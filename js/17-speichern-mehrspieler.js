"use strict";
/* Der Apfelritter, Teil 17 von 24: Speichern, Ruhmeshalle, andere Ritter, Mehrspieler.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Speichern: im Browser und, wo möglich, im Konto ============ */
const cloud = { db:null, uid:null, user:null, room:null, saving:false, last:'', nextT:0, noWrite:false, fameLast:'', fameBusy:false, fameNoWrite:false, fameT:0, loaded:false };
let dirty = false;
function markDirty(now){ dirty = true; if (now) saveHero(); }
function heroCore(){ return JSON.stringify(Object.assign({}, HERO, { savedAt: 0, played: Math.round(HERO.played / 60) })); }
function saveHero(){
  if (!HERO || !G || G.mode === 'title') return;
  if (DG_ON){ HERO.x = DG_ON.door.x; HERO.y = DG_ON.door.y + 30; HERO.inn = null; }
  else if (G.inside){ HERO.x = G.inside.dx; HERO.y = G.inside.dy + 2; HERO.inn = G.inside.id; }
  else if (G.knight && G.knight.hp > 0){ HERO.x = Math.round(G.knight.x); HERO.y = Math.round(G.knight.y); HERO.inn = null; }
  if (G.mode === 'dead' || G.mode === 'dying'){ HERO.x = BIND[HERO.bind].x; HERO.y = BIND[HERO.bind].y; }
  HERO.savedAt = Date.now();
  store.set(SAVE_KEY, JSON.stringify(HERO));
  dirty = false;
  cloudSave(); pushFame();
}
function cloudSave(force){
  if (!cloud.db || !cloud.uid || cloud.noWrite || !HERO) return;
  const core = heroCore();
  if (core === cloud.last) return;
  if (cloud.saving || (!force && nowS() < cloud.nextT)){ clearTimeout(cloud.retry); cloud.retry = setTimeout(() => cloudSave(true), 4000); return; }
  cloud.saving = true; cloud.nextT = nowS() + 20;
  const body = { hero: JSON.stringify(HERO), at: HERO.savedAt, v: 5 };
  cloud.db.doc('data/users/' + cloud.uid + '/save').set(body)
    .then(() => { cloud.last = core; })
    .catch(e => { if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) cloud.noWrite = true; })
    .finally(() => { cloud.saving = false; });
}
function loadLocal(){
  try { const h = JSON.parse(store.get(SAVE_KEY) || 'null'); return validHero(h) ? h : null; } catch(e){ return null; }
}

/* ============ Ruhmeshalle: die Ritter aller Spieler ============ */
function fameBody(){
  return Object.assign(fameExtra(), { nm: HERO.name, f: HERO.f, lv: HERO.lvl, kills: HERO.kills, bosses: Object.keys(HERO.bosses).length, title: titleOf(HERO.lvl),
    score: HERO.lvl * 100000 + (HERO.lvl >= MAX_LVL && HERO.eh ? Math.min(99999, HERO.eh.n * 1000 + Math.floor(HERO.eh.xp / ehNeed(HERO.eh.n) * 999)) : Math.min(99999, HERO.xp)) });
}
function pushFame(){
  renderFameLocal();
  if (!cloud.db || !cloud.uid || cloud.fameNoWrite || !HERO || cloud.fameBusy) return;
  const body = fameBody(), js = JSON.stringify(body);
  if (js === cloud.fameLast) return;
  if (nowS() < cloud.fameT){ clearTimeout(cloud.fameRetry); cloud.fameRetry = setTimeout(pushFame, (cloud.fameT - nowS()) * 1000 + 100); return; }
  cloud.fameBusy = true; cloud.fameT = nowS() + 15;
  cloud.db.doc('heroes/' + cloud.uid).set(Object.assign(body, { at: Date.now() }))
    .then(() => { cloud.fameLast = js; })
    .catch(e => { if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) cloud.fameNoWrite = true; })
    .finally(() => { cloud.fameBusy = false; if (AS.again){ AS.again = false; cloud.fameT = 0; pushFame(); } });
}
function renderFame(rows){
  const box = $('fameList');
  box.textContent = '';
  const list = rows.map(r => ({ id: r.id, nm: cleanName(r.nm) || 'Unbekannt', f: KN_FACTIONS[r.f] ? r.f : 'reich', lv: clamp(r.lv | 0, 1, MAX_LVL), kills: Math.max(0, r.kills | 0), bosses: clamp(r.bosses | 0, 0, 5), score: +r.score || 0, eh: clamp(r.eh | 0, 0, 999), ht: ehHas(HT, r.ht) ? r.ht : null, wa: ehHas(WAPPEN, r.wa) ? r.wa : null }))
    .sort((a, b) => b.score - a.score).slice(0, 15);
  if (!list.length){ box.append(el('li', 'empty', 'Noch niemand verzeichnet.')); return; }
  list.forEach((r, i) => {
    const li = el('li', r.id === cloud.uid ? 'me' : '');
    const nm = el('span', 'fn'); if (r.wa){ const im = el('img', 'forb'); im.src = urlOf(wappenImg(r.wa), 2); im.alt = ''; nm.append(im); } nm.append(r.nm); if (r.bosses) nm.append(el('small', null, ' ' + '✠'.repeat(r.bosses)));
    li.append(el('span', 'fr', String(i + 1)), nm, el('span', 'fl', 'Stufe ' + r.lv + (r.eh ? ', Ehre ' + r.eh : '') + ' · ' + (r.ht ? HT[r.ht].n : titleOf(r.lv))), el('span', 'fk', KN_FACTIONS[r.f].knight + ' · ' + r.kills + ' erschlagen'));
    box.append(li);
  });
}
function renderFameLocal(){
  if (fameTab !== 'ritter'){ renderFameTab(); return; }
  const h = HERO || SAVED;
  if (cloud.fameLive) return;
  renderFame(h ? [{ id: cloud.uid || 'local', nm: h.name, f: h.f, lv: h.lvl, kills: h.kills, eh: h.eh ? h.eh.n : 0, ht: h.ht, wa: h.wa && h.trs ? h.wa : null, bosses: Object.keys(h.bosses || {}).length, score: h.lvl * 100000 + h.xp }] : []);
}

/* ============ Andere Ritter: Anwesenheit und Gespräch ============ */
const PEERS = new Map();
const num = (v, lo, hi, d) => Number.isFinite(+v) ? clamp(+v, lo, hi) : d;
function readPeer(p){
  const s = p.presence || {};
  if (!Number.isFinite(+s.x) || !Number.isFinite(+s.y)) return null;
  let q = PEERS.get(p.peer);
  if (!q){ q = { x: +s.x * (s.ws ? 1 : WS), y: +s.y * (s.ws ? 1 : WS), anim: 0, atkT: 0, atkLen: SWING, swA0: 0, swA1: 0, mult: 1, bashT: 0, inv: 0, slowT: 0, sw: s.sw, seen: 0 }; PEERS.set(p.peer, q); }
  const sc = s.ws ? 1 : WS;   // ältere Fassung sendet Weltpixel
  q.tx = num(s.x * sc, 0, GW, q.x); q.ty = num(s.y * sc, 0, GH, q.y);
  const sin = INN_BY[s.in] || CH_BY[s.in] || (typeof s.in === 'string' && /^dg:[a-z]+$/.test(s.in) && DG_DEF[s.in.slice(3)]) ? s.in : 0;   // Gasthaus oder Gewölbe
  if (Math.hypot(q.tx - q.x, q.ty - q.y) > 300 || sin !== (q.in || 0)){ q.x = q.tx; q.y = q.ty; }
  q.dir = DIRV[s.d] ? s.d : 'down'; q.moving = !!s.mv; q.dead = !!s.dead; q.lk = typeof s.lk === 'string' && LOOK_RE.test(s.lk) ? s.lk : ''; q.lance = s.ln ? 1 : 0;
  q.wt = WT_BY_CODE[q.lk[5]] || 'schwert';
  q.nm = cleanName(s.nm) || 'Ritter'; q.lv = num(s.lv, 1, MAX_LVL, 1) | 0; q.f = KN_FACTIONS[s.f] ? s.f : 'reich'; q.in = sin; q.ride = HORSES[s.ri] && !q.in ? s.ri : null;
  if (s.sw !== q.sw){ q.sw = s.sw; q.atkLen = num(s.sl, .1, 1, SWING); q.atkT = q.atkLen; q.swA0 = num(s.sa, -10, 10, 0); q.swA1 = num(s.se, -10, 10, 0); q.mult = num(s.m, .5, 2.5, 1); if (q.wt === 'armbrust') xbPeer(q); }
  netRead(q, p, s);
  return q;
}
function updatePeers(dt){
  for (const q of PEERS.values()){
    const f = Math.min(1, dt * 10);
    q.x += (q.tx - q.x) * f; q.y += (q.ty - q.y) * f;
    if (q.moving) q.anim += dt * 8; else q.anim = 0;
    if (q.atkT > 0) q.atkT -= dt;
  }
}
let presLast = '', presT = 0;
function sendPresence(force){
  if (!cloud.room || !HERO) return;
  const t = nowS();
  if (!force && t - presT < .12) return;
  const k = G.knight;
  const pr = { ws: WS, x: Math.round(k.x), y: Math.round(k.y), d: k.dir, mv: k.moving ? 1 : 0, sw: k.swing, sa: +k.swA0.toFixed(2), se: +k.swA1.toFixed(2), sl: +k.atkLen.toFixed(2), m: k.mult,
    lv: HERO.lvl, nm: HERO.name, f: HERO.f, lk: lookOf(HERO.eq), ln: k.lance > 0 || (G.joust && G.joust.st === 'charge') ? 1 : 0, in: DG_ON ? 'dg:' + DG_ON.id : G.inside ? G.inside.id : 0, ri: G.joust ? 'streitross' : riding() ? HERO.horse : 0, dead: G.mode === 'dying' || G.mode === 'dead' ? 1 : 0, z: G.zone };
  Object.assign(pr, netPres()); ehPres(pr);
  const js = JSON.stringify(pr);
  if (js === presLast && !force) return;
  presLast = js; presT = t;
  cloud.room.presence(pr).catch(() => {});
}
function sendChat(text){
  const om = /^\/o\s+/i.test(text) && HERO.or ? text.replace(/^\/o\s+/i, '') : null;   // „/o …“: nur an den eigenen Orden
  if (om !== null && !om) return;
  if (om === null){ G.say = text; G.sayT = nowS() + 6; }
  logChat(om !== null ? '[' + HERO.or.kz + '] ' + HERO.name : HERO.name, om !== null ? om : text, true); Sound.chat();
  if (cloud.room && cloud.room.connected()) cloud.room.emit('chat', om !== null ? { nm: HERO.name, t: om, or: HERO.or.id } : { nm: HERO.name, t: text }).catch(() => {});
}
function logChat(nm, text, me){
  const n = el('b', null, nm + ': '); n.style.color = me ? '#ecd27a' : '#9cc8ff';
  logLine('', '#e8dcbc', [n, text]);
}
function setupRoom(room){
  if (!room) return;
  cloud.room = room;
  $('btnChat').hidden = false;
  room.onPeers(ch => {
    const live = new Set();
    for (const p of ch.peers){ if (p.sameTab) NET.me = p.peer; if (p.sameTab || p.kind !== 'viewer') continue; if (readPeer(p)) live.add(p.peer); }
    for (const id of [...PEERS.keys()]) if (!live.has(id)) PEERS.delete(id);
    for (const p of ch.joined) if (!p.sameTab && p.kind === 'viewer' && p.presence && p.presence.nm && G && G.mode !== 'title') logLine(cleanName(p.presence.nm) + ' ist im Reichsland.', '#9cc8ff');
    const n = ch.peers.filter(p => p.kind === 'viewer').length;
    $('online').textContent = Math.max(1, n); $('onlineWrap').hidden = n < 2;
  }, () => { PEERS.clear(); $('onlineWrap').hidden = true; renderParty(); });
  room.on('chat', msg => {
    if (msg.sameTab) return;
    const d = msg.data || {}, t = cleanText(d.t, 120);
    if (!t) return;
    if (d.or && (!HERO || !HERO.or || d.or !== HERO.or.id)) return;   // Ordensgespräch eines anderen Ordens
    const q = PEERS.get(msg.peer), nm = q ? q.nm : (cleanName(d.nm) || 'Ritter');
    if (q && !d.or){ q.say = t; q.sayT = nowS() + 6; }
    logChat(d.or ? '[' + HERO.or.kz + '] ' + nm : nm, t, false); Sound.chat();
  }, () => {});
  if (HERO && G && G.mode !== 'title') sendPresence(true);
}
function initCloud(){
  const C = window.claude;
  if (!C || typeof C.use !== 'function') return;
  C.use('room').then(setupRoom).catch(() => {});
  let db = null, uid = null, pending = 2;
  const ready = () => {
    if (--pending > 0 || !db || !uid) return;
    cloud.db = db; cloud.uid = uid;
    db.doc('data/users/' + uid + '/save').get().then(snap => {
      cloud.loaded = true;
      const d = snap.exists ? snap.data() : null;
      if (!d || typeof d.hero !== 'string') return;
      let h = null; try { h = JSON.parse(d.hero); } catch(e){}
      if (!validHero(h)) return;
      if (G.mode === 'title' && (!SAVED || (h.savedAt || 0) > (SAVED.savedAt || 0))){ SAVED = h; G.confirmNew = false; renderStart(); renderFameLocal(); }
      if (HERO && HERO.made === h.made) cloud.last = JSON.stringify(Object.assign({}, h, { savedAt: 0, played: Math.round(h.played / 60) }));
    }).catch(() => {});
    db.collection('heroes').orderBy('score', 'desc').limit(25).onSnapshot(snap => {
      cloud.fameLive = true;
      cloud.fameRows = snap.docs.map(s => Object.assign({ id: s.id }, s.data() || {}));
      if (fameTab === 'ritter') renderFame(cloud.fameRows);
    }, () => { cloud.fameLive = false; cloud.fameRows = null; renderFameLocal(); });
    // die zuletzt gesehenen Ritter: für Turnier- und Festbestenlisten
    db.collection('heroes').orderBy('at', 'desc').limit(200).onSnapshot(snap => {
      cloud.allRows = snap.docs.map(s => Object.assign({ id: s.id }, s.data() || {}));
      if (fameTab !== 'ritter') renderFameTab();
    }, () => {});
    if (HERO && G.mode !== 'title'){ cloudSave(true); pushFame(); orSubscribe(); }
    asSubscribe();
  };
  C.use('db').then(v => { db = v; ready(); }).catch(() => ready());
  C.use('user').then(u => {
    cloud.user = u;
    if (!u){ ready(); return; }
    u.id().then(id => { uid = id && /^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(id) ? id : null; ready(); }).catch(() => ready());
  }).catch(() => ready());
}

/* ============ Mehrspieler: Anfragen, Gruppe, gemeinsamer Kampf ============
   Jeder Ritter beschreibt in seiner Anwesenheit nur sich selbst: eine offene Anfrage (q), eine Antwort (a),
   seine Gruppe (pt), seinen Tjost (jo), sein Handelsangebot (tr), seine Würfel (dc), seinen Beitrag zum
   Weltereignis (ev). Das ist fester Zustand statt einzelner Nachrichten: Geht etwas unterwegs verloren, gilt
   beim nächsten Senden der neue Stand, und wer später kommt, sieht ihn auch. Monster rechnet jede Seite
   selbst; die Hiebe der Mitspieler treffen sie hier genauso, und die Monster gehen auf den nächsten Ritter los.
   So sehen alle ungefähr denselben Kampf. */
const NET = { me: null, q: null, a: null, inbox: [], seen: {}, pt: null, ptT: 0, mem: {}, askKey: '', kx: { n: 0, s: 0, l: 1 }, kxSeen: {} };
const rid = () => Math.random().toString(36).slice(2, 9);
const PARTY_MAX = 4;
const ASK = {
  party: { ask: 'Ihr ladet % in Eure Gruppe ein.', them: '% lädt Euch in die Gruppe ein.' },
  duel:  { ask: 'Ihr fordert % zum Tjost.', them: '% fordert Euch zum Tjost an der Schranke.' },
  trade: { ask: 'Ihr bittet % zum Handel.', them: '% möchte mit Euch handeln.' },
  dice:  { ask: 'Ihr bittet % an den Würfeltisch.', them: '% möchte mit Euch um # Gulden würfeln.' },
  tourn: { ask: 'Ihr meldet Euch beim Großen Turnier von % an.', them: '' },
  order: { ask: 'Ihr bietet % die Aufnahme in Euren Orden an.', them: '% bietet Euch die Aufnahme in den Orden „#“ an.' }
};
const hereId = () => DG_ON ? 'dg:' + DG_ON.id : G.inside ? G.inside.id : 0;
const samePlace = q => (q.in || 0) === hereId();
const peerDist = q => Math.hypot(q.x - G.knight.x, q.y - G.knight.y);
const inParty = q => !!(q && NET.pt && q.pt && q.pt.id === NET.pt.id);
const partyList = () => NET.pt ? [...PEERS.values()].filter(inParty).sort((a, b) => a.pt.t - b.pt.t) : [];
/* Gruppenmitglieder in der Nähe (für Erfahrung und Beute) */
const partyNear = () => partyList().filter(q => samePlace(q) && !q.dead && peerDist(q) < 900);
const nearLists = (x, y) => LISTS && Math.hypot(x - LISTS.x, y - LISTS.y) < 620;
/* Gebiete, in denen nicht gekämpft wird; Lindach nur, solange keine Raubritter im Dorf sind */
const isSafe = z => !!SAFE[z] && !((z === 'weiler' && EVT.raid) || STY.unsafe === z);

/* ---------- Anwesenheit: lesen und schreiben ---------- */
function netRead(q, p, s){
  const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  q.peer = p.peer; q.by = p.by || null; q.z = typeof s.z === 'string' ? s.z.slice(0, 16) : '';
  q.hp = num(s.hp, 0, 100, 100);
  q.cb = Array.isArray(s.cb) ? [num(s.cb[0], 1, 800, 5), num(s.cb[1], 0, 60, 5)] : [Math.round(4 + q.lv * 2.5), 5];
  q.rq = obj(s.q); q.an = obj(s.a); q.jo = obj(s.jo); q.tr = obj(s.tr); q.dc = obj(s.dc); q.ev = obj(s.ev); q.fr = obj(s.fr);
  const pt = obj(s.pt); q.pt = pt && typeof pt.id === 'string' && /^[a-z0-9]{3,12}$/.test(pt.id) ? { id: pt.id, t: +pt.t || 0 } : null;
  q.bz = typeof s.bz === 'string' ? s.bz.slice(0, 2) : '';
  q.or = orClean(s.or);
  q.gt = obj(s.gt); q.bk = !!s.bk;
  q.wa = ehHas(WAPPEN, s.wa) ? s.wa : null; q.ht = ehHas(HT, s.ht) ? s.ht : null;
  q.hl = Number.isInteger(s.hl) ? s.hl : null; q.go = Array.isArray(s.go) ? s.go.filter(Number.isInteger).slice(0, 8) : null; q.dd = obj(s.dd);
  const kx = obj(s.kx); q.kx = kx ? { n: Math.max(0, kx.n | 0), s: Math.max(0, +kx.s || 0), l: num(kx.l, 1, MAX_LVL + 3, 1) } : null;
  q.safeZ = isSafe(q.z); q.safe = q.safeZ || nearInn(q.x, q.y) || nearFest(q.x, q.y);
}
function netPres(){
  const k = G.knight, o = { hp: ST && k ? clamp(Math.round(k.hp / ST.hp * 100), 0, 100) : 100, cb: ST ? [ST.dmg, ST.crit] : null };
  o.q = NET.q ? { to: NET.q.to, k: NET.q.k, n: NET.q.n, x: NET.q.x } : null;
  o.a = NET.a ? { to: NET.a.to, n: NET.a.n, ok: NET.a.ok } : null;
  o.pt = NET.pt ? { id: NET.pt.id, t: NET.pt.t } : null;
  o.kx = NET.pt ? NET.kx : null;
  o.or = HERO.or ? { id: HERO.or.id, nm: HERO.or.nm, kz: HERO.or.kz, wp: HERO.or.wp } : null;
  o.gt = NET.gt ? tnPres() : null;
  o.bk = G.bucket ? 1 : null;
  const M = DG_ON && DG_ON.D.group ? DG_ON : null;
  o.hl = M && G.lever != null ? G.lever : null;
  o.go = M && M.openG.length ? M.openG : null;
  o.dd = M ? { k: M.id + ':' + dgDay(), d: Math.round(M.bossDmg || 0) } : null;
  o.bz = G.joust ? 'j' : G.fgame ? 'f' : NET.tr ? 'h' : NET.dc ? 'w' : '';
  o.jo = NET.jo ? duelPres() : null;
  o.tr = NET.tr ? tradePres() : null;
  o.dc = NET.dc ? dicePres() : null;
  o.ev = EVT.cur && EVT.cur.part ? evPres() : null;
  return o;
}

/* ---------- Anfragen und Antworten ---------- */
function netAsk(q, kind, x){
  if (!q || !cloud.room) return;
  if (NET.q){ logLine('Ihr wartet noch auf die Antwort von ' + NET.q.nm + '.', '#d8c69c'); return; }
  const why = netBusy(kind, q, true);
  if (why){ logLine(why, '#d8c69c'); return; }
  NET.q = { to: q.peer, k: kind, n: rid(), x: x || 0, t: nowS(), nm: q.nm };
  logLine(ASK[kind].ask.replace('%', q.nm), '#9cc8ff'); Sound.choose();
  sendPresence(true);
}
/* Warum geht es gerade nicht? (leer: es geht) */
function netBusy(kind, q, mine){
  const who = mine ? q.nm : 'Ihr';
  if (G.mode !== 'play' && G.mode !== 'menu') return 'Gerade nicht.';
  if (kind !== 'party' && (G.joust || G.fgame || NET.tr || NET.dc || NET.jo)) return 'Ihr seid gerade beschäftigt.';
  if (mine && kind !== 'party' && q.bz) return q.nm + ' ist gerade beschäftigt.';
  if (kind === 'party' && mine && q.pt && NET.pt && q.pt.id === NET.pt.id) return q.nm + ' ist schon in Eurer Gruppe.';
  if (kind === 'party' && mine && NET.pt && partyList().length >= PARTY_MAX - 1) return 'Eure Gruppe ist voll.';
  if (kind === 'duel' && (!nearLists(G.knight.x, G.knight.y) || !nearLists(q.x, q.y) || !samePlace(q))) return 'Zum Tjost müssen beide Ritter auf der Turnierwiese stehen.';
  if (kind === 'duel' && (DG_ON || G.inside)) return 'Zum Tjost müssen beide Ritter auf der Turnierwiese stehen.';
  if (kind === 'order' && mine && !HERO.or) return 'Ihr gehört keinem Orden an.';
  if (kind === 'tourn' && mine && NET.tj) return 'Ihr seid schon gemeldet.';
  if (kind === 'tourn' && mine && HERO.gold < TN_FEE) return 'Das Startgeld beträgt ' + TN_FEE + ' Gulden.';
  if (kind === 'duel' && NET.tj) return mine ? 'Ihr seid zum Großen Turnier gemeldet.' : 'Gerade nicht.';
  if (kind === 'order' && mine && q.or && q.or.id === HERO.or.id) return q.nm + ' ist schon in Eurem Orden.';
  if (kind === 'order' && !mine && !(q.or && q.or.id === q.rq.x)) return 'Gerade nicht.';
  if (kind === 'trade' && (!samePlace(q) || peerDist(q) > 260)) return who === 'Ihr' ? 'Zu weit weg.' : q.nm + ' ist zu weit weg.';
  if (kind === 'dice'){
    if (!G.inside || G.inside.church || !samePlace(q)) return 'Gewürfelt wird im Gasthaus.';
    const st = mine ? NET.diceStake || 0 : +q.rq.x || 0;
    if (HERO.gold < st) return mine ? 'Ihr habt keine ' + st + ' Gulden.' : 'Ihr habt keine ' + st + ' Gulden.';
  }
  return '';
}
function netAnswer(i, ok){
  const q = PEERS.get(i.peer); NET.inbox = NET.inbox.filter(x => x !== i); NET.askKey = null;
  if (!q){ renderAsk(); return; }
  if (ok){ const why = netBusy(i.r.k, q, false); if (why){ logLine(why, '#d8c69c'); ok = false; } }
  NET.a = { to: q.peer, n: i.r.n, ok: ok ? 1 : 0, t: nowS() };
  if (ok) netBegin(i.r.k, q, i.r, false); else logLine('Ihr lehnt ab.', '#d8c69c');
  renderAsk(); sendPresence(true);
}
/* beide Seiten fangen an: wer gefragt hat, sobald die Zusage da ist; wer zusagt, sofort */
function netBegin(kind, q, r, asker){
  if (kind === 'party') partyJoin(q, r.x, asker);
  else if (kind === 'duel') startDuel(q, r.n, asker);
  else if (kind === 'trade') startTrade(q, r.n);
  else if (kind === 'dice') startDicePvp(q, r.n, +r.x || 0);
  else if (kind === 'tourn' && asker){
    if (HERO.gold >= TN_FEE){ HERO.gold -= TN_FEE; updateHud(); markDirty(true); }
    NET.tj = { id: r.x, host: q.peer, paid: true };
    logLine('Ihr seid zum Großen Turnier gemeldet. Bleibt auf der Turnierwiese, bis ' + q.nm + ' beginnt.', '#ffd98a'); Sound.coin();
    if (G.talk && G.talk.view === 'turnier') renderTalk('turnier');
  }
  else if (kind === 'order'){
    if (asker){ if (HERO.or){ logLine(q.nm + ' ist nun Ritter Eures Ordens.', '#ffd98a'); Sound.quest(); } }
    else if (q.or){ if (HERO.or && HERO.or.id !== q.or.id) logLine('Ihr verlasst den Orden „' + HERO.or.nm + '“.', '#d8c69c'); orJoin(q.or, false); showBanner(q.or.nm, 'Ihr seid aufgenommen'); logLine('Ihr seid nun Ritter des Ordens „' + q.or.nm + '“. Beim Herold steht die Wochenaufgabe des Ordens.', '#ffd98a'); Sound.quest(); }
  }
}
function netTick(){
  if (!HERO || !G || G.mode === 'title' || !cloud.room) return;
  const t = nowS();
  if (!NET.me){ const me = cloud.room.peers().find(p => p.sameTab); if (me) NET.me = me.peer; }
  if (NET.q){
    const q = PEERS.get(NET.q.to), an = q && q.an;
    if (an && an.to === NET.me && an.n === NET.q.n){
      const r = NET.q; NET.q = null;
      if (an.ok) netBegin(r.k, q, r, true); else logLine(q.nm + ' lehnt ab.', '#d8c69c');
    } else if (!q || t - NET.q.t > 30){ logLine(NET.q.nm + ' antwortet nicht.', '#d8c69c'); NET.q = null; }
  }
  if (NET.a && t - NET.a.t > 15) NET.a = null;
  for (const q of PEERS.values()){
    const r = q.rq;
    if (!r || r.to !== NET.me || typeof r.n !== 'string' || !ASK[r.k]) continue;
    const key = q.peer + ':' + r.n;
    if (NET.seen[key]) continue;
    NET.seen[key] = 1;
    if (r.k === 'tourn'){   // Anmeldung zum Großen Turnier: der Marschall nimmt an, solange Platz ist
      const T = NET.gt, ok = T && T.st === 'an' && r.x === T.id && T.pl.length < TN_MAX && !T.pl.includes(q.peer);
      if (ok){ T.pl.push(q.peer); T.nm.push(q.nm); logLine(q.nm + ' meldet sich zum Großen Turnier.', '#ffd98a'); Sound.chat(); }
      NET.a = { to: q.peer, n: r.n, ok: ok ? 1 : 0, t }; continue;
    }
    if (netBusy(r.k, q, false)){ NET.a = { to: q.peer, n: r.n, ok: 0, t }; continue; }   // beschäftigt: gleich ablehnen
    NET.inbox.push({ peer: q.peer, r, t, nm: q.nm }); Sound.chat();
  }
  NET.inbox = NET.inbox.filter(i => { const q = PEERS.get(i.peer); return q && q.rq && q.rq.n === i.r.n && t - i.t < 30; });
  renderAsk();
  partyTick(t);
  if (NET.tr) tradeTick(t);
  if (NET.dc) diceTick(t);
  tnTick(t);
  evTick(t);
  sendPresence();
}
/* Anfrage an mich: Kästchen oben mit Annehmen und Ablehnen (Tasten Y und N) */
function renderAsk(){
  const i = NET.inbox[0], key = i ? i.peer + i.r.n : '';
  if (key === NET.askKey) return;
  NET.askKey = key;
  const box = $('ask'); box.hidden = !i;
  if (!i) return;
  const oq = i.r.k === 'order' ? PEERS.get(i.peer) : null;
  $('askText').textContent = ASK[i.r.k].them.replace('%', i.nm).replace('#', oq && oq.or ? oq.or.nm : i.r.x);
  $('askYes').textContent = KBD.on ? 'Annehmen (Y)' : 'Annehmen';
  $('askNo').textContent = KBD.on ? 'Ablehnen (N)' : 'Ablehnen';
}
$('askYes').addEventListener('click', () => { if (NET.inbox[0]) netAnswer(NET.inbox[0], true); });
$('askNo').addEventListener('click', () => { if (NET.inbox[0]) netAnswer(NET.inbox[0], false); });

/* ---------- Mit einem Ritter sprechen ---------- */
function knightUrl(f, lk){ const set = knightSet(f, lk || undefined); return set.url || (set.url = urlOf(set.icon, 3)); }
function nearPeer(r){
  let best = null, bd = r || 40;
  for (const q of PEERS.values()){ if (!samePlace(q) || q.dead) continue; const d = peerDist(q); if (d < bd){ bd = d; best = q; } }
  return best;
}
function openPeer(q){
  if (!q || !openPanel('ovTalk')) return;
  G.talk = { peerTalk: true, peer: q.peer, name: q.nm, key: 'peer:' + q.peer };
  $('talkImg').src = knightUrl(q.f, q.lk); $('talkName').textContent = q.nm;
  $('talkRole').textContent = 'Stufe ' + q.lv + ' · ' + titleOf(q.lv) + ' · ' + KN_FACTIONS[q.f].knight;
  renderTalk('peer');
}
function peerView(view, body, opts){
  const q = PEERS.get(G.talk.peer);
  if (view === 'trade') return tradeView(body, opts, q);
  if (view === 'dicepvp') return diceViewPvp(body, opts, q);
  if (view === 'party') return partyView(body, opts);
  if (!q){ $('talkText').textContent = 'Der Ritter ist fortgeritten.'; opts.append(btn('Lebt wohl', closePanel, 'opt')); body.append(opts); return; }
  if (view === 'dicestake'){
    $('talkText').textContent = 'Drei Würfel, einmal nachwerfen, wer mehr hat, gewinnt den Einsatz des anderen. Ihr habt ' + HERO.gold + ' Gulden.';
    for (const st of [5, 20, 50]){ const b = btn('Um ' + st + ' Gulden', () => { NET.diceStake = st; closePanel(); netAsk(q, 'dice', st); }, 'opt'); b.disabled = HERO.gold < st; opts.append(b); }
    opts.append(btn('Zurück', () => renderTalk('peer'), 'tbtn'));
    body.append(opts); return;
  }
  const same = inParty(q), J = q.jo, tr = q.tr;
  $('talkText').textContent = same ? q.nm + ' reitet mit Euch in einer Gruppe.' : q.bz === 'j' ? q.nm + ' reitet gerade einen Tjost.' : q.bz ? q.nm + ' ist gerade beschäftigt.' : 'Ein Ritter wie Ihr. Was wollt Ihr von ' + q.nm + '?';
  const ask = (label, kind, x, why) => { const b = btn(label, () => { closePanel(); netAsk(q, kind, x); }, 'opt'); if (why){ b.disabled = true; b.title = why; } opts.append(b); return b; };
  if (!same) ask('In die Gruppe einladen', 'party', NET.pt ? NET.pt.id : rid(), NET.pt && partyList().length >= PARTY_MAX - 1 ? 'Die Gruppe ist voll.' : '');
  else opts.append(btn('Gruppe ansehen', () => renderTalk('party'), 'opt'));
  if (!G.inside && !DG_ON){
    const okL = nearLists(G.knight.x, G.knight.y) && nearLists(q.x, q.y);
    ask(okL ? 'Zum Tjost fordern' : 'Zum Tjost fordern (nur auf der Turnierwiese)', 'duel', 0, okL ? (q.bz ? 'beschäftigt' : '') : 'Beide müssen auf der Turnierwiese vor dem Osttor stehen.');
  }
  ask('Handeln', 'trade', 0, q.bz ? 'beschäftigt' : '');
  if (HERO.or && !(q.or && q.or.id === HERO.or.id)) ask('In Euren Orden aufnehmen (' + HERO.or.kz + ')', 'order', HERO.or.id, '');
  if (G.inside && !G.inside.church){ const b = btn('Würfeln', () => renderTalk('dicestake'), 'opt'); b.disabled = !!q.bz; opts.append(b); }
  else opts.append(el('p', 'hint', 'Gewürfelt wird im Gasthaus. Den Tjost reitet Ihr auf der Turnierwiese vor dem Osttor der Reichsstadt.'));
  opts.append(btn('Lebt wohl', closePanel, 'opt'));
  body.append(opts);
}

/* ---------- Gruppe: bis zu vier Ritter teilen Erfahrung, Beute und den Kampf ---------- */
function partyJoin(q, id, asker){
  id = typeof id === 'string' && /^[a-z0-9]{3,12}$/.test(id) ? id : rid();
  if (!asker && NET.pt && NET.pt.id !== id) logLine('Ihr verlasst Eure alte Gruppe.', '#d8c69c');
  if (!asker && [...PEERS.values()].filter(p => p.pt && p.pt.id === id).length >= PARTY_MAX){ logLine('Die Gruppe ist schon voll.', '#d8c69c'); return; }
  if (!NET.pt || NET.pt.id !== id) NET.pt = { id, t: Date.now() };
  HERO.pt = { id, t: NET.pt.t, at: Date.now() };
  NET.ptT = nowS();
  showBanner('Gruppe', asker ? q.nm + ' reitet nun mit Euch' : 'Ihr reitet nun mit ' + q.nm);
  logLine(asker ? q.nm + ' schließt sich Eurer Gruppe an.' : 'Ihr schließt Euch der Gruppe von ' + q.nm + ' an. Die Erfahrung wird geteilt.', '#9fe08a');
  Sound.quest(); renderParty(); sendPresence(true); markDirty();
}
function partyLeave(silent){
  if (!NET.pt) return;
  NET.pt = null; HERO.pt = null; NET.mem = {};
  if (!silent){ logLine('Ihr verlasst die Gruppe.', '#d8c69c'); Sound.choose(); }
  renderParty(); sendPresence(true); markDirty();
}
/* Wer kommt, wer geht, wer fällt, wer steigt hinab: Meldungen und die Liste oben links */
function partyTick(t){
  if (!NET.pt) return;
  const now = {};
  for (const q of partyList()){
    const was = NET.mem[q.peer];
    now[q.peer] = { nm: q.nm, dead: q.dead, in: q.in || 0, hp: q.hp, lv: q.lv };
    if (!was){ if (t - NET.ptT > 3) logLine(q.nm + ' ist in der Gruppe.', '#9fe08a'); continue; }
    if (q.dead && !was.dead) logLine(q.nm + ' ist gefallen!', '#ff9a8a');
    if (q.in !== was.in && typeof q.in === 'string' && q.in.startsWith('dg:') && DG_DEF[q.in.slice(3)]) logLine(q.nm + ' steigt hinab: ' + DG_DEF[q.in.slice(3)].name + '.', '#c8b8ff');
    if (q.lv > was.lv) logLine(q.nm + ' erreicht Stufe ' + q.lv + '.', '#ecd27a');
  }
  for (const id in NET.mem) if (!now[id]) logLine(NET.mem[id].nm + ' ist nicht mehr in der Gruppe.', '#d8c69c');
  for (const q of partyList()){
    const kx = q.kx, was = NET.kxSeen[q.peer]; if (!kx) continue;
    NET.kxSeen[q.peer] = kx;
    if (!was || kx.n <= was.n || kx.s <= was.s) continue;
    if (!samePlace(q) || peerDist(q) > 900 || G.mode !== 'play' || G.knight.hp <= 0 || HERO.lvl >= MAX_LVL) continue;
    const xp = Math.round(Math.min(kx.s - was.s, 4000) * Math.min(1, xpMul(kx.l - HERO.lvl)) * .75 * (1 + .1 * partyNear().length));
    if (xp > 0){ gainXp(xp); floatText(G.knight.x, G.knight.y - KS.ay - 10, '+' + xp + ' EP Gruppe', '#c9a6ff', 1, 1.2); }
  }
  const changed = JSON.stringify(now) !== JSON.stringify(NET.mem);
  NET.mem = now;
  if (Object.keys(now).length) NET.ptT = Math.min(NET.ptT, t), NET.alone = 0;
  else if (!NET.alone) NET.alone = t;
  else if (t - NET.alone > 300){ logLine('Eure Gruppe hat sich aufgelöst.', '#d8c69c'); partyLeave(true); return; }
  if (changed) renderParty();
}
function renderParty(){
  $('btnParty').hidden = !NET.pt || !partyList().length;
  renderTracker();
}
/* Zeilen über den Aufträgen: Name, Stufe, Leben */
function partyRows(box){
  const L = partyList(); if (!L.length) return;
  const head = el('p', 'phead'); head.append(el('b', null, 'Gruppe'), ' ' + (L.length + 1) + ' Ritter'); box.append(head);
  for (const q of L){
    const p = el('p', 'pm' + (q.dead ? ' dead' : '')), bar = el('i', 'hpb'), fill = el('i');
    fill.style.width = (q.dead ? 0 : q.hp) + '%'; bar.append(fill);
    const where = !samePlace(q) ? (typeof q.in === 'string' && q.in.startsWith('dg:') ? ' unten' : CH_BY[q.in] ? ' in der Kirche' : q.in ? ' im Gasthaus' : ' anderswo') : '';
    p.append(el('b', null, q.nm), ' ' + q.lv + ' ', bar, where); box.append(p);
  }
}
function partyView(body, opts){
  const L = partyList();
  $('talkText').textContent = L.length ? 'Ihr reitet zu ' + (L.length + 1) + '. Erschlägt ein Gefährte in der Nähe ein Monster, bekommt Ihr drei Viertel seiner Erfahrung, und jeder Gefährte nahebei bringt ein Zehntel mehr.' : 'Ihr seid allein in der Gruppe.';
  for (const q of L){
    const r = el('div', 'shoprow'), ic = el('img'); ic.src = knightUrl(q.f, q.lk); ic.alt = '';
    const t = el('div', 'stx');
    t.append(el('b', null, q.nm), el('small', null, 'Stufe ' + q.lv + ' · ' + titleOf(q.lv) + ' · ' + (q.dead ? 'gefallen' : 'Leben ' + q.hp + ' %') + (samePlace(q) ? ' · ' + Math.round(peerDist(q) / 2 / 10) * 10 + ' Schritt entfernt' : '')));
    r.append(ic, t); body.append(r);
  }
  opts.append(btn('Gruppe verlassen', () => { partyLeave(); closePanel(); }, 'opt'), btn(G.talk && G.talk.peerTalk && G.talk.peer ? 'Zurück' : 'Schließen', () => G.talk && G.talk.peer ? renderTalk('peer') : closePanel(), 'tbtn'));
  body.append(opts);
}
function openParty(){
  if (!NET.pt || !openPanel('ovTalk')) return;
  G.talk = { peerTalk: true, peer: null, name: 'Gruppe', key: 'party' };
  $('talkImg').src = knightUrl(HERO.f, lookOf(HERO.eq)); $('talkName').textContent = 'Eure Gruppe'; $('talkRole').textContent = HERO.name + ' und Gefährten';
  renderTalk('party');
}
$('btnParty').addEventListener('click', () => { Sound.init(); G.mode === 'menu' && G.talk && G.talk.key === 'party' ? closePanel() : openParty(); });

/* ---------- Gemeinsamer Kampf: Hiebe und Lanzen der Mitspieler treffen die Monster hier ---------- */
function peerHits(){
  if (G.inside || G.mode === 'title') return;
  const here = hereId();
  for (const q of PEERS.values()){
    if ((q.in || 0) !== here || q.dead) continue;
    if (q.atkT > 0 && q.wt !== 'armbrust') for (const m of G.mons.slice()){
      if (!vulnerable(m) || (m.pHit && m.pHit[q.peer] === q.sw)) continue;
      if (!bodyCircles(m).some(c => inSwing(q, c.x, c.y, c.hr))) continue;
      (m.pHit = m.pHit || {})[q.peer] = q.sw;
      const crit = Math.random() * 100 < q.cb[1];
      damage(m, Math.max(1, Math.round(q.cb[0] * q.mult * rand(.9, 1.1) * (crit ? 1.75 : 1))), crit, 1, q);
    }
    if (q.lance && q.ride && q.moving){
      if (!q.lanceOn){ q.lanceOn = true; q.lanceN = (q.lanceN || 0) + 1; }
      const L = LANCE_TIP[q.dir], t = { x: q.x + L[0], y: q.y + L[1] };
      for (const m of G.mons.slice()){
        if (!vulnerable(m) || (m.pLance && m.pLance[q.peer] === q.lanceN)) continue;
        if (!bodyCircles(m).some(c => Math.hypot(c.x - t.x, c.y - t.y) < c.hr + 10)) continue;
        (m.pLance = m.pLance || {})[q.peer] = q.lanceN;
        if (!MON[m.k].boss) m.stunT = 1.2;
        const crit = Math.random() * 100 < q.cb[1];
        damage(m, Math.max(1, Math.round(q.cb[0] * 1.8 * rand(.9, 1.1) * (crit ? 1.75 : 1))), crit, 2.6, q);
      }
    } else q.lanceOn = false;
  }
}
/* Ziel eines Monsters: der nächste Ritter am selben Ort, der nicht in Sicherheit ist (der eigene oder ein Mitspieler) */
function monTarget(m, c, selfOk, dt){
  const k = G.knight, here = hereId();
  const ok = T => T === k ? selfOk : !T.dead && !(m.ev ? T.safeZ : T.safe) && (T.in || 0) === here && PEERS.get(T.peer) === T;
  m.tgtT = (m.tgtT || 0) - dt;
  if (m.tgt && ok(m.tgt) && m.tgtT > 0) return m.tgt;
  let best = selfOk ? k : null, bd = best ? Math.hypot(k.x - c.x, k.y - KBODY - c.y) : 1e9;
  for (const q of PEERS.values()){
    if (!ok(q)) continue;
    const d = Math.hypot(q.x - c.x, q.y - KBODY - c.y);
    if (d < bd * (q === m.tgt ? 1.3 : 1) && d < 700){ bd = d; best = q; }
  }
  if (m.tgt && best && m.tgt !== best && ok(m.tgt) && Math.hypot(m.tgt.x - c.x, m.tgt.y - KBODY - c.y) < bd * 1.3) best = m.tgt;
  m.tgt = best; m.tgtT = .6;
  return best;
}
/* Monster trifft einen Mitspieler: nur zu sehen, den Schaden rechnet dessen Seite */
function hitT(T, m, dmg){
  if (T === G.knight) return hurt(m, dmg);
  burst(T.x, T.y - KBODY, ['#c8343c', '#f0a0a0', '#d4d8de'], 8, 80); Sound.hit();
  return true;
}
/* Wer bekommt Lohn für ein Monster, das ein Mitspieler erschlagen hat? Wer mitgekämpft hat oder in der Gruppe nahebei steht. */
function killCredit(m){
  if (!m.by || m.by === 'me' || (m.mine || 0) > 0) return true;
  const q = PEERS.get(m.by);
  return !!(q && inParty(q) && samePlace(q) && peerDist(q) < 900);
}

/* ---------- Handel zwischen Rittern ----------
   Jeder legt Gegenstände und Gulden hin. „Einverstanden“ gilt nur für genau die beiden Angebote, die man gerade
   sieht: Ändert einer etwas, muss der andere neu zusagen. Haben beide für dieselben Angebote zugesagt, tauscht
   jede Seite für sich: das Eigene fort, das Fremde in den Rucksack. */
const TRADE_MAX = 6;
const sigOf = o => { const s = JSON.stringify(o); let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
function packItem(it){
  const o = {}; for (const k of ['s', 'il', 'r', 'b', 'a', 'dmg', 'arm', 'n', 'u', 'v', 'up', 'base', 'w', 'q']) if (it[k] != null) o[k] = it[k];
  return o;
}
/* Fremde Gegenstände prüfen: nur bekannte Arten, Werte in vernünftigen Grenzen, neue Kennung */
function cleanItem(o){
  if (!o || typeof o !== 'object') return null;
  if (o.s === 'ware'){
    if (!WARES[o.w]) return null;
    const it = makeWare(o.w); it.q = clamp(o.q | 0, 1, WARE_MAX); it.v = clamp(o.v | 0, 1, WARES[o.w].v * 5); it.il = clamp(o.il | 0, 1, MAX_LVL); return it;
  }
  if (!SLOTS.includes(o.s)) return null;
  const il = clamp(o.il | 0, 1, 22), r = clamp(o.r | 0, 0, 4), up = clamp(o.up | 0, 0, 5), M = RARITY[r].m * 1.1 * (1 + .12 * up) + .5;
  const it = { s: o.s, il, r, b: clamp(o.b | 0, 0, 4), a: {} };
  if (o.s === 'schild' && o.nh === 'bibel') it.nh = 'bibel';
  if (o.s === 'waffe'){ if (WT[o.wt] && o.wt !== 'schwert') it.wt = o.wt; it.dmg = clamp(o.dmg | 0, 1, Math.round((3 + il * 1.3) * M * (it.wt ? WT[it.wt].dmg : 1)) + 5); }
  else if (ARM_MUL[o.s] && !it.nh) it.arm = clamp(o.arm | 0, 1, Math.round((1 + il) * ARM_MUL[o.s] * M) + 5);
  let n = 0;
  for (const k in (o.a && typeof o.a === 'object' ? o.a : {})) if (AFFIX[k] && (!AFFIX[k].only || AFFIX[k].only === o.s) && !(it.nh && k === 'block') && n++ < 4) it.a[k] = clamp(o.a[k] | 0, 1, Math.round(AFFIX[k].v(il) * M * (it.nh && k === 'hp' ? 1.6 : 1)) + 3);
  it.n = cleanText(o.n, 40) || baseName(it);
  if (o.u && UNIQUES[o.u]) it.u = o.u;
  it.v = clamp(o.v | 0, 1, Math.round((4 + il * 1.6) * 25 * 3));
  if (up){
    it.up = up;
    const B = o.base && typeof o.base === 'object' ? o.base : {};
    it.base = { dmg: clamp(B.dmg | 0, 0, it.dmg || 0), arm: clamp(B.arm | 0, 0, it.arm || 0), a: {}, v: clamp(B.v | 0, 1, it.v) };
    for (const k in it.a) it.base.a[k] = clamp((B.a && B.a[k]) | 0, 1, it.a[k]);
  }
  it.id = Date.now().toString(36) + (itemSeq++).toString(36);
  return it;
}
function startTrade(q, id){
  if (G.mode !== 'play' && G.mode !== 'menu') return;
  NET.tr = { id, w: q.peer, nm: q.nm, idx: [], g: 0, ok: null, t: nowS(), seen: nowS(), done: 0, theirSig: '' };
  if (G.mode === 'menu') showOverlay('ovTalk'); else openPanel('ovTalk');
  G.mode = 'menu';
  G.talk = { peerTalk: true, peer: q.peer, name: q.nm, key: 'trade' };
  $('talkImg').src = knightUrl(q.f, q.lk); $('talkName').textContent = 'Handel mit ' + q.nm;
  $('talkRole').textContent = 'Stufe ' + q.lv + ' · ' + titleOf(q.lv) + ' · ' + KN_FACTIONS[q.f].knight;
  Sound.choose(); renderTalk('trade'); sendPresence(true);
}
function tradeOffer(){ const T = NET.tr; return { g: T.g, it: T.idx.map(i => HERO.inv[i]).filter(Boolean).map(packItem) }; }
function tradePres(){ const T = NET.tr; if (T.frozen) return T.frozen; const o = tradeOffer(); return { id: T.id, w: T.w, g: o.g, it: o.it, ok: T.ok, dn: T.done ? 1 : 0 }; }
/* das Angebot des anderen, wie er es zeigt */
function tradeTheirs(){
  const T = NET.tr, q = T && PEERS.get(T.w), tr = q && q.tr;
  if (!tr || tr.id !== T.id || tr.w !== NET.me) return null;
  const it = Array.isArray(tr.it) ? tr.it.slice(0, TRADE_MAX) : [];
  return { raw: { g: tr.g, it: tr.it }, g: clamp(+tr.g | 0, 0, 1e7), it, items: it.map(cleanItem).filter(Boolean), ok: Array.isArray(tr.ok) ? tr.ok : null, dn: !!tr.dn };
}
function tradeFree(){ return HERO.inv.filter(x => !x).length + NET.tr.idx.length; }
function tradeAgree(){
  const T = NET.tr, th = tradeTheirs(); if (!T || T.done || !th) return;
  if (T.ok){ T.ok = null; }
  else {
    if (th.items.length > tradeFree()){ logLine('Zu wenig Platz im Rucksack.', '#ff9a8a'); return; }
    T.ok = [sigOf(tradeOffer()), sigOf(th.raw)];
  }
  Sound.choose(); sendPresence(true); renderTalk('trade');
}
function tradeChanged(){ const T = NET.tr; T.ok = null; sendPresence(true); renderTalk('trade'); }
function tradeCancel(silent){
  const T = NET.tr; if (!T) return;
  NET.tr = null;
  if (!silent) logLine(T.done ? 'Der Handel mit ' + T.nm + ' ist abgeschlossen.' : 'Der Handel mit ' + T.nm + ' ist abgebrochen.', '#d8c69c');
  if (G.mode === 'menu' && G.talk && G.talk.key === 'trade') closePanel();
  sendPresence(true);
}
function tradeTick(t){
  const T = NET.tr, q = PEERS.get(T.w), th = tradeTheirs();
  if (T.done){ if (t - T.doneT > 4) tradeCancel(true); return; }
  if (th) T.seen = t;
  if (!q || (!th && t - T.seen > 3 && t - T.t > 5) || (q && samePlace(q) && peerDist(q) > 420) || (q && !samePlace(q))){ logLine((q ? q.nm : T.nm) + ' hat den Handel verlassen.', '#d8c69c'); tradeCancel(true); return; }
  if (!th) return;
  const mine = sigOf(tradeOffer()), theirs = sigOf(th.raw);
  if (T.ok && (T.ok[0] !== mine || T.ok[1] !== theirs)) T.ok = null;
  const key = theirs + ':' + (th.ok ? th.ok.join() : '') + ':' + th.dn;
  if (T.ok && th.ok && th.ok[0] === T.ok[1] && th.ok[1] === T.ok[0]) return tradeCommit(q, th);
  if (key !== T.theirSig){ T.theirSig = key; if (G.talk && G.talk.key === 'trade') renderTalk('trade'); }
}
function tradeCommit(q, th){
  const T = NET.tr, give = T.idx.map(i => HERO.inv[i]);
  if (give.some(x => !x) || HERO.gold < T.g || th.items.length > tradeFree()){ logLine('Der Handel ist geplatzt.', '#ff9a8a'); tradeCancel(true); return; }
  T.frozen = Object.assign(tradePres(), { dn: 1 });   // was der andere sah, bleibt stehen, bis auch er getauscht hat
  for (const i of T.idx) HERO.inv[i] = null;
  HERO.gold += th.g - T.g;
  for (const it of th.items){ const j = HERO.inv.indexOf(null); HERO.inv[j] = it; logItem('Eingetauscht: ', it); }
  if (th.g) logLine('Ihr erhaltet ' + th.g + ' Gulden von ' + q.nm + '.', '#ffd98a');
  T.done = 1; T.doneT = nowS(); T.idx = []; T.got = th.items.length + (th.g ? 1 : 0);
  showBanner('Handel', 'abgeschlossen mit ' + q.nm); Sound.gold(); updateHud(); markDirty(true);
  if (G.talk && G.talk.key === 'trade') renderTalk('trade');
}
function tradeRow(it){
  const r = el('div', 'trow'), ic = el('img'); ic.src = itemUrl(it); ic.alt = ''; ic.style.boxShadow = '0 0 0 2px ' + RARITY[it.r].c;
  const t = el('div', 'stx'), nm = el('b', null, itemName(it)); nm.style.color = RARITY[it.r].c;
  t.append(nm, el('small', null, it.s === 'ware' ? 'Handelsware' : 'Stufe ' + it.il + ' · ' + itemLines(it).join(' · ')));
  r.append(ic, t); return r;
}
function tradeView(body, opts, q){
  const T = NET.tr;
  if (!T){ $('talkText').textContent = 'Der Handel ist vorbei.'; opts.append(btn('Schließen', closePanel, 'opt')); body.append(opts); return; }
  const th = tradeTheirs(), agreed = !!T.ok, theyOk = th && th.ok && T.ok && th.ok[0] === T.ok[1] && th.ok[1] === T.ok[0], theyAgree = th && th.ok && th.ok[0] === sigOf(th.raw) && th.ok[1] === sigOf(tradeOffer());
  if (T.done){
    $('talkText').textContent = 'Handschlag! Der Tausch mit ' + T.nm + ' ist vollzogen.';
    opts.append(btn('Schließen', () => tradeCancel(true), 'opt')); body.append(opts); return;
  }
  $('talkText').textContent = 'Legt hin, was Ihr gebt. Getauscht wird erst, wenn beide einverstanden sind. Wer danach noch etwas ändert, muss neu zustimmen.';
  const cols = el('div', 'trade'), mine = el('div', 'tcol'), theirs = el('div', 'tcol');
  mine.append(el('h4', null, 'Ihr gebt'));
  const give = T.idx.map(i => HERO.inv[i]).filter(Boolean);
  for (const it of give) mine.append(tradeRow(it));
  mine.append(el('p', 'tg', T.g ? T.g + ' Gulden' : give.length ? '' : 'noch nichts'));
  mine.append(el('p', 'tst' + (agreed ? ' ok' : ''), agreed ? 'Ihr seid einverstanden.' : 'Ihr überlegt noch.'));
  theirs.append(el('h4', null, T.nm + ' gibt'));
  if (!th) theirs.append(el('p', 'hint', 'Warte auf ' + T.nm + ' …'));
  else {
    for (const it of th.items) theirs.append(tradeRow(it));
    theirs.append(el('p', 'tg', th.g ? th.g + ' Gulden' : th.items.length ? '' : 'noch nichts'));
    theirs.append(el('p', 'tst' + (theyAgree ? ' ok' : ''), theyAgree ? T.nm + ' ist einverstanden.' : T.nm + ' überlegt noch.'));
  }
  cols.append(mine, theirs); body.append(cols);
  body.append(el('p', 'hint', 'Aus dem Rucksack hinlegen (bis ' + TRADE_MAX + ' Stück), angelegte Ausrüstung bleibt bei Euch:'));
  const grid = el('div', 'tgrid');
  HERO.inv.forEach((it, i) => {
    if (!it) return;
    const sel = T.idx.includes(i), b = el('button', 'slot' + (sel ? ' sel' : '')); b.type = 'button'; b.dataset.slot = 'tr:' + i;
    b.style.setProperty('--rc', RARITY[it.r].c);
    const im = el('img'); im.src = itemUrl(it); im.alt = itemName(it); b.append(im);
    if (it.q > 1) b.append(el('span', 'qty', it.q));
    b.title = itemName(it) + (it.s === 'ware' ? '' : ': ' + itemLines(it).join(', '));
    b.disabled = !sel && T.idx.length >= TRADE_MAX;
    b.addEventListener('click', () => { if (sel) T.idx = T.idx.filter(x => x !== i); else if (T.idx.length < TRADE_MAX) T.idx.push(i); tradeChanged(); });
    grid.append(b);
  });
  if (!grid.children.length) grid.append(el('p', 'hint', 'Euer Rucksack ist leer.'));
  body.append(grid);
  const gold = el('div', 'tgold');
  gold.append(el('span', null, 'Gulden: ' + T.g + ' von ' + HERO.gold));
  for (const d of [-50, -10, 10, 50]){ const b = btn((d > 0 ? '+' : '−') + Math.abs(d), () => { T.g = clamp(T.g + d, 0, HERO.gold); tradeChanged(); }, 'tbtn'); b.dataset.slot = 'trg:' + d; b.disabled = d < 0 ? T.g <= 0 : T.g >= HERO.gold; gold.append(b); }
  body.append(gold);
  const room = th ? tradeFree() - th.items.length : 0;
  const ok = btn(agreed ? 'Doch nicht einverstanden' : 'Einverstanden', tradeAgree, 'opt' + (agreed ? '' : ' new'));
  ok.dataset.slot = 'trok'; ok.disabled = !th || (!agreed && room < 0);
  opts.append(ok);
  if (th && room < 0) opts.append(el('p', 'hint', 'Für das, was ' + T.nm + ' gibt, fehlt Euch Platz im Rucksack.'));
  if (theyOk) opts.append(el('p', 'hint', 'Beide sind einverstanden …'));
  opts.append(btn('Abbrechen', () => tradeCancel(), 'tbtn'));
  body.append(opts);
}

/* ---------- Würfeln gegen einen Ritter: beide werfen, jeder darf einmal nachwerfen ---------- */
function startDicePvp(q, id, stake){
  if (HERO.gold < stake){ logLine('Ihr habt keine ' + stake + ' Gulden.', '#d8c69c'); return; }
  NET.dc = { id, w: q.peer, nm: q.nm, st: stake, r: roll3(), hold: [true, true, true], f: null, res: null, t: nowS(), seen: nowS(), key: '' };
  if (G.mode === 'menu') showOverlay('ovTalk'); else openPanel('ovTalk');
  G.mode = 'menu';
  G.talk = { peerTalk: true, peer: q.peer, name: q.nm, key: 'dicepvp' };
  $('talkImg').src = knightUrl(q.f, q.lk); $('talkName').textContent = 'Würfeln mit ' + q.nm; $('talkRole').textContent = 'Einsatz ' + stake + ' Gulden';
  diceSound(); renderTalk('dicepvp'); sendPresence(true);
}
function dicePres(){ const D = NET.dc; return { id: D.id, w: D.w, st: D.st, r: D.r, f: D.f }; }
const diceOk = d => Array.isArray(d) && d.length === 3 && d.every(v => Number.isInteger(v) && v >= 1 && v <= 6);
function diceTheirs(){
  const D = NET.dc, q = D && PEERS.get(D.w), dc = q && q.dc;
  if (!dc || dc.id !== D.id || dc.w !== NET.me) return null;
  return { r: diceOk(dc.r) ? dc.r : null, f: diceOk(dc.f) ? dc.f : null };
}
function diceTick(t){
  const D = NET.dc, th = diceTheirs();
  if (th) D.seen = t;
  if (D.res == null && !th && t - D.seen > 4 && t - D.t > 6){ logLine(D.nm + ' ist vom Tisch aufgestanden.', '#d8c69c'); diceLeave(); return; }
  if (D.res == null && D.f && th && th.f){
    const a = diceRank(D.f).r, b = diceRank(th.f).r;
    D.res = Math.sign(a - b); D.op = th.f;
    if (D.res > 0){ HERO.gold += D.st; Sound.gold(); HERO.dicewins = (HERO.dicewins || 0) + 1; logLine('Ihr gewinnt ' + D.st + ' Gulden von ' + D.nm + '.', '#ffd98a'); }
    else if (D.res < 0){ HERO.gold -= Math.min(D.st, HERO.gold); Sound.tone(180, .3, 'triangle', .04, -60); logLine(D.nm + ' gewinnt Euren Einsatz von ' + D.st + ' Gulden.', '#d8c69c'); }
    updateHud(); markDirty(true);
  }
  const key = JSON.stringify(th) + D.res;
  if (key !== D.key){ D.key = key; if (G.talk && G.talk.key === 'dicepvp') renderTalk('dicepvp'); }
}
function diceLeave(){
  const D = NET.dc; NET.dc = null;
  if (D && G.mode === 'menu' && G.talk && G.talk.key === 'dicepvp') closePanel();
  sendPresence(true);
}
function diceViewPvp(body, opts, q){
  const D = NET.dc;
  if (!D){ $('talkText').textContent = 'Der Tisch ist leer.'; opts.append(btn('Schließen', closePanel, 'opt')); body.append(opts); return; }
  const th = diceTheirs();
  const row = (d, hold) => {
    const r = el('div', 'dicerow');
    d.forEach((v, i) => {
      const b = el('button', 'die' + (hold && !hold[i] ? ' re' : '')); b.type = 'button';
      const im = el('img'); im.src = DICE_URL[v]; im.alt = v + ' Augen'; b.append(im);
      if (hold){ b.dataset.slot = 'die:' + i; b.title = hold[i] ? 'behalten (zum Neuwerfen wählen)' : 'wird neu geworfen'; b.addEventListener('click', () => { D.hold[i] = !D.hold[i]; renderTalk('dicepvp'); }); }
      else b.disabled = true;
      r.append(b);
    });
    return r;
  };
  const mine = D.f || D.r;
  body.append(el('p', 'hint', 'Euer Wurf: ' + diceRank(mine).n + (D.f ? '' : ' (einmal nachwerfen erlaubt)')), row(mine, D.f ? null : D.hold));
  const theirs = th ? th.f || th.r : null;
  body.append(el('p', 'hint', D.nm + ': ' + (theirs ? diceRank(theirs).n + (th.f ? '' : ', überlegt noch') : 'wirft …')));
  if (theirs) body.append(row(theirs));
  if (D.res != null){
    $('talkText').textContent = D.res > 0 ? 'Gewonnen! Ihr streicht ' + D.st + ' Gulden von ' + D.nm + ' ein.' : D.res < 0 ? 'Verloren. ' + D.nm + ' bekommt Euren Einsatz.' : 'Gleichstand, jeder behält seinen Einsatz.';
    const again = btn('Noch eine Runde um ' + D.st, () => { const qq = PEERS.get(D.w), st = D.st; diceLeave(); if (qq){ NET.diceStake = st; netAsk(qq, 'dice', st); } }, 'opt');
    again.disabled = HERO.gold < D.st || !PEERS.get(D.w);
    opts.append(again, btn('Aufstehen', diceLeave, 'tbtn'));
  } else if (!D.f){
    $('talkText').textContent = 'Wählt die Würfel, die Ihr neu werfen wollt, oder lasst es so. Einsatz ' + D.st + ' Gulden.';
    const re = D.hold.filter(h => !h).length;
    const go = btn(re ? 'Neu werfen (' + re + ' Würfel)' : 'So lassen', () => { D.f = D.r.map((v, i) => D.hold[i] ? v : 1 + (Math.random() * 6 | 0)); if (re) diceSound(); sendPresence(true); renderTalk('dicepvp'); }, 'opt');
    go.dataset.slot = 'dgo'; opts.append(go, btn('Aufstehen', diceLeave, 'tbtn'));
  } else {
    $('talkText').textContent = 'Warte auf ' + D.nm + ' …';
    opts.append(btn('Aufstehen', diceLeave, 'tbtn'));
  }
  body.append(opts);
}

/* ---------- Tjost gegen einen Ritter ----------
   Wer fordert, reitet die südliche Bahn und beginnt links; wer annimmt, die nördliche und beginnt rechts. Jeder
   Durchgang beginnt erst, wenn beide bereit sind. Beim Zusammenprall zeigt jeder, wohin er die Lanze gesenkt hat;
   aus beiden Zielen und einem Zufall, den beide gleich würfeln (Kennung des Tjosts und Durchgang), rechnen beide
   Seiten dasselbe Ergebnis. */
const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function startDuel(q, id, asker){
  if (G.mode === 'menu') closePanel();
  if (!LISTS || G.joust || G.fgame || DG_ON || G.inside || G.mode !== 'play'){ logLine('Der Tjost kann jetzt nicht beginnen.', '#d8c69c'); return; }
  HERO.joust = HERO.joust || { wins: 0, beat: {} };
  NET.jo = { id, w: q.peer, nm: q.nm, side: asker ? 1 : -1, r: 0, L: [], ps: [HERO.lvl, Math.round(ST.block), Math.round(ST.mit * 100)], e: HERO.joust.elo || 1000, t: nowS(), seen: nowS(), s: [0, 0] };
  const foe = { id: 'pvp', name: q.nm, short: q.nm, lvl: q.lv, f: q.f, look: q.lk || undefined, pvp: true, osc: 2 };   // osc: wie schnell das eigene Ziel wandert
  G.joust = { foe, pvp: NET.jo, pass: 0, me: 0, op: 0, st: 'intro', t: 1.8, cx: LISTS.x, cy: LISTS.y - 60, cheer: 0, parts: [], text: '', textT: 0, fallen: null };
  HERO.riding = false; renderSkills(); G.near = null; $('btnTalk').hidden = true; $('log').style.visibility = 'hidden';
  for (const s of LIFE_SPOTS) if (s.crowd){ s.act = true; s.ents = []; lifeMake(s, true); }
  showBanner('Tjost', HERO.name + ' gegen ' + q.nm);
  Sound.horn(); Sound.cheer(.8);
  joustPass();
  G.joust.st = 'intro'; G.joust.t = 2.2;
  sendPresence(true);
}
function duelPres(){ const D = NET.jo; return { id: D.id, w: D.w, sd: D.side, r: D.r, L: D.L, s: D.s, ps: D.ps, e: D.e, end: D.end ? 1 : 0, res: D.end ? D.res : null }; }
function duelTheirs(D){ const q = PEERS.get(D.w), jo = q && q.jo; return jo && jo.id === D.id && jo.w === NET.me ? jo : null; }
const duelReady = J => { const jo = duelTheirs(J.pvp); return !!jo && (jo.r | 0) >= J.pass; };
/* jeden Schritt: ist der andere noch da? */
function duelTick(J){
  const D = J.pvp, jo = duelTheirs(D), t = nowS();
  if (jo) D.seen = t;
  else if (t - D.seen > 4 && t - D.t > 6 && !D.end){
    G.joust = null; NET.jo = null; $('log').style.visibility = '';
    const herold = NPCS.find(n => n.id === 'herold'), k = G.knight;
    if (herold){ k.x = herold.x + 30; k.y = herold.y + 10; k.dir = 'left'; }
    showBanner('Tjost', 'ohne Sieger'); logLine(D.nm + ' hat die Schranke verlassen. Der Tjost endet ohne Sieger.', '#d8c69c');
    sendPresence(true); return false;
  }
  return true;
}
function duelLock(J){
  J.pvp.L[J.pass - 1] = J.lock === null ? -9 : Math.round(J.lock * 1000) / 1000;
  J.lock = J.lock === null ? null : J.pvp.L[J.pass - 1];
  J.st = 'after'; J.t = 1.9; J.waitRes = nowS();
  sendPresence(true);
}
function duelPeerLock(J){ const jo = duelTheirs(J.pvp), v = jo && Array.isArray(jo.L) ? jo.L[J.pass - 1] : null; return typeof v === 'number' && v >= -9 && v <= 1.01 ? v : null; }
/* Stoß von a auf b; beide Seiten rufen in derselben Reihenfolge den gemeinsamen Zufall */
function duelStrike(R, lock, a, b){
  const zone = lock <= -2 ? 'zu spät' : joustZone(lock), o = { zone, pts: 0, fall: false, glance: false }, r1 = R(), r2 = R();
  if (zone === 'Helm' || zone === 'Schild'){
    const d = clamp(a[0] - b[0], -10, 10);
    if (r1 < clamp(.78 + d * .03 - b[1] / 300, .35, .95)){
      o.pts = zone === 'Helm' ? 2 : 1;
      if (r2 < clamp((zone === 'Helm' ? .26 : .08) + d * .015 - b[2] / 500, .02, .45)) o.fall = true;
    } else o.glance = true;
  }
  return o;
}
function duelImpact(J, opLock){
  const D = J.pvp, jo = duelTheirs(D), myL = D.L[J.pass - 1], R = rng(hashStr(D.id + ':' + J.pass));
  const sp = v => Array.isArray(v) && v.length === 3 ? v.map((x, i) => clamp(+x || 0, 0, i === 0 ? MAX_LVL : 100)) : [1, 0, 0];
  const mine = D.ps, theirs = sp(jo && jo.ps);
  const A = D.side > 0 ? [myL, mine] : [opLock, theirs], B = D.side > 0 ? [opLock, theirs] : [myL, mine];
  const ra = duelStrike(R, A[0], A[1], B[1]), rb = duelStrike(R, B[0], B[1], A[1]);
  const me = D.side > 0 ? ra : rb, op = D.side > 0 ? rb : ra;
  J.me += me.pts; J.op += op.pts; D.s = [J.me, J.op];
  const hitX = J.ox, hy = (J.py + J.oy) / 2 - 40;
  if (me.pts || op.pts){ for (let i = 0; i < 18; i++) J.parts.push({ x: hitX + rand(-8, 8), y: hy + rand(-10, 10), vx: rand(-90, 90), vy: rand(-120, -20), life: rand(.5, 1), c: Math.random() < .5 ? '#e8d8b0' : '#b08a5a' }); G.shake = .35; Sound.hit(); Sound.parry(); J.cheer = 2; Sound.cheer(1); }
  else Sound.swing();
  const parts = [], f = J.foe;
  parts.push(me.zone === 'zu spät' ? 'Zu spät!' : me.pts ? me.zone + '! +' + me.pts : me.glance ? 'Abgeglitten' : 'Daneben');
  if (op.pts) parts.push(f.short + ' trifft' + (op.zone === 'Helm' ? ' den Helm' : '') + ' +' + op.pts);
  else if (op.zone === 'zu spät') parts.push(f.short + ' zu spät');
  const oFall = me.fall, iFall = op.fall;
  if (oFall){ parts.push(f.short + ' fällt!'); J.fallen = { who: 'op', x: J.ox, y: J.oy, t: 0, dir: -J.dir }; }
  if (iFall){ parts.push('Ihr fallt!'); J.fallen = { who: 'me', x: J.px, y: J.py, t: 0, dir: J.dir }; }
  J.text = parts.join(',  '); J.textT = 2.4;
  J.over = oFall || iFall || (J.pass >= 3 && J.me !== J.op) || J.pass >= 5;
  J.t = Math.max(J.t, 1.2);
  J.res = oFall !== iFall ? (oFall ? 1 : 0) : J.me === J.op ? .5 : J.me > J.op ? 1 : 0;
  if (J.over){ D.end = 1; D.endT = nowS(); D.res = J.res; }
  sendPresence(true);
}
function duelEnd(J){
  const D = J.pvp, k = G.knight, jo = duelTheirs(D);
  G.joust = null; $('log').style.visibility = '';
  const herold = NPCS.find(n => n.id === 'herold');
  if (herold){ k.x = herold.x + 30; k.y = herold.y + 10; k.dir = 'left'; if (!gOk(k.x, k.y)){ k.x = herold.x; k.y = herold.y + 26; } }
  const H = HERO.joust = HERO.joust || { wins: 0, beat: {} };
  const eMe = H.elo || 1000, eOp = clamp(jo ? +jo.e || 1000 : 1000, 100, 3000), exp = 1 / (1 + Math.pow(10, (eOp - eMe) / 400));
  const score = J.res == null ? .5 : J.res;
  NET.lastDuel = { id: D.id, res: score };
  H.elo = Math.round(eMe + 32 * (score - exp));
  if (score === 1){
    H.pw = (H.pw || 0) + 1;
    const gold = 15 + HERO.lvl * 2, xp = Math.round(xpNeed(HERO.lvl) * .06 + 10);
    HERO.gold += gold; gainXp(xp);
    showBanner('Sieg im Tjost', J.me + ' : ' + J.op + ' gegen ' + D.nm);
    logLine('Ihr besiegt ' + D.nm + ' im Tjost. Der Herold zahlt ' + gold + ' Gulden Ehrensold, ' + xp + ' EP. Turnierwertung: ' + H.elo + '.', '#ffd98a');
    Sound.levelUp();
  } else if (score === 0){
    H.pl = (H.pl || 0) + 1;
    showBanner('Niederlage im Tjost', J.me + ' : ' + J.op + ' gegen ' + D.nm);
    logLine(D.nm + ' bleibt Sieger. Turnierwertung: ' + H.elo + '.', '#d8c69c');
  } else {
    showBanner('Unentschieden', J.me + ' : ' + J.op + ' gegen ' + D.nm);
    logLine('Gleichstand mit ' + D.nm + ' nach fünf Durchgängen. Turnierwertung: ' + H.elo + '.', '#d8c69c');
  }
  D.end = 1; D.endT = D.endT || nowS();
  setTimeout(() => { if (NET.jo === D) { NET.jo = null; sendPresence(true); } }, 5000);
  updateHud(); pushFame(); markDirty(true); sendPresence(true);
}
/* Zuschauer: zwei Mitspieler reiten gegeneinander, oben steht der Stand */
function duelWatch(){
  let txt = '';
  if (!G.joust && !G.inside && !DG_ON && nearLists(G.knight.x, G.knight.y)) for (const a of PEERS.values()){
    const ja = a.jo; if (!ja || ja.sd !== 1 || !Array.isArray(ja.s)) continue;
    const b = PEERS.get(ja.w); if (!b || !b.jo || b.jo.id !== ja.id) continue;
    const sc = ja.s.map(v => clamp(v | 0, 0, 20));
    txt = a.nm + ' gegen ' + b.nm + (ja.end ? ', Ausgang ' : ', Stand ') + sc[0] + ' : ' + sc[1];
    if (!G.crowdOn){ G.crowdOn = true; for (const sp of LIFE_SPOTS) if (sp.crowd){ sp.act = true; sp.ents = []; lifeMake(sp, true); } }
    break;
  }
  if (txt !== (G.watch || '')){ G.watch = txt; renderTracker(); }
}
