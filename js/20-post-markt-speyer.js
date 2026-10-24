"use strict";
/* Der Apfelritter, Teil 20 von 27: Botenpost, Marktplatz, Länderwettstreit, Ordenshaus, Speyer und Fluss.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Mehrspieler über die Zeit: Botenpost, Marktplatz, Länderwettstreit, Ordenshaus ============
   Jeder Ritter schreibt nur in sein eigenes Dokument der Ruhmeshalle (heroes/<id>), alle anderen lesen es mit.
   Briefe liegen beim Absender (po, Empfänger in pto), der Empfänger bestätigt in seinem Dokument (pr, Absender in prf).
   Angebote liegen beim Verkäufer (mk), Kaufansprüche beim Käufer (kf). Der früheste Anspruch gewinnt, der Käufer nimmt
   die Ware gleich mit, der Verkäufer bekommt sein Geld beim nächsten Besuch. Gulden und Gegenstände gehen beim Absenden
   fort (Treuhand) und kommen zurück, wenn ein Brief zurückgeholt oder ein Kauf verloren wird. Fremdes wird gesäubert. */
const AS = { post: [], ack: [], mk: [], kf: [], lw: [], subs: [], seen: new Set(), first: true, got: false, draft: null, mf: 'alle', sell: null, inbox: [], t: 0 };
const UID_RE = /^[A-Za-z0-9_\-.~:@+]{1,200}$/, AID_RE = /^[a-z0-9]{4,16}$/;
const PORTO = 3, POST_MAX = 8, POST_GOLD = 1000, POST_BACK = 3 * 86400000, MK_MAX = 6, KF_MAX = 6, MK_FEE = .05, DAY = 86400000;
const asId = () => (Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36)).slice(0, 14);
const asMe = () => cloud.uid || 'me';
const asOnline = () => !!(cloud.db && cloud.uid && !cloud.fameNoWrite);
function fameNow(){ cloud.fameT = 0; if (cloud.fameBusy){ AS.again = true; return; } pushFame(); }   // läuft gerade eine Speicherung, gleich danach noch einmal
/* Briefe sind kein Staatsgeheimnis, aber auch nicht offen lesbar: einfache Verschiebung mit dem Empfänger als Schlüssel */
const asKey = k => { const h = hashStr(String(k)); return i => (h >>> (i % 24)) & 15; };
const asHide = (tx, k) => { const s = asKey(k); return [...String(tx || '')].map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ s(i))).join(''); };
const asShow = asHide;
function asHero(h){
  h = h || HERO;
  const arr = (a, n) => Array.isArray(a) ? a.filter(x => x && typeof x === 'object').slice(-n) : [];
  h.po = arr(h.po, POST_MAX).filter(l => AID_RE.test(l.id) && UID_RE.test(l.to)).map(l => ({ id: l.id, to: l.to, tn: cleanName(l.tn) || 'Ritter', tx: cleanText(l.tx, 200), g: clamp(l.g | 0, 0, POST_GOLD), it: l.it && typeof l.it === 'object' ? l.it : null, t: +l.t || Date.now() }));
  h.pr = arr(h.pr, 60).filter(x => typeof x.k === 'string' && x.k.length < 240 && Date.now() - (+x.t || 0) < 21 * DAY);
  h.mk = arr(h.mk, MK_MAX).filter(l => AID_RE.test(l.id) && l.it && typeof l.it === 'object').map(l => ({ id: l.id, it: l.it, p: clamp(l.p | 0, 1, 99999), t: +l.t || Date.now() }));
  h.mkd = arr(h.mkd, 20).filter(x => AID_RE.test(x.id) && Date.now() - (+x.t || 0) < 7 * DAY);
  h.kf = arr(h.kf, KF_MAX).filter(c => UID_RE.test(c.s) && AID_RE.test(c.id) && c.it && typeof c.it === 'object').map(c => ({ s: c.s, snm: cleanName(c.snm) || 'Ritter', id: c.id, p: clamp(c.p | 0, 1, 99999), it: c.it, t: +c.t || Date.now(), got: c.got ? 1 : 0 }));
  if (h.lw && (typeof h.lw !== 'object' || !(h.lw.w > 0))) h.lw = null;
  if (h.lwp && (typeof h.lwp !== 'object' || !(h.lwp.w > 0))) h.lwp = null;
  if (h.lw) h.lw = { w: h.lw.w | 0, p: clamp(h.lw.p | 0, 0, 1e6) };
  if (h.lwp) h.lwp = { w: h.lwp.w | 0, p: clamp(h.lwp.p | 0, 0, 1e6) };
  if (h.od && (typeof h.od !== 'object' || typeof h.od.oid !== 'string')) h.od = null;
  if (h.od) h.od = { oid: h.od.oid, g: clamp(h.od.g | 0, 0, 1e7) };
  return h;
}
/* was in das Dokument der Ruhmeshalle geht (fameExtra hängt das an) */
function asFame(o){
  if (!HERO) return o;
  asHero();
  if (HERO.po.length){ o.po = HERO.po.map(l => ({ id: l.id, to: l.to, tx: asHide(l.tx, l.to), g: l.g, it: l.it, t: l.t })); o.pto = [...new Set(HERO.po.map(l => l.to))]; }
  if (HERO.pr.length){ o.pr = HERO.pr.map(x => x.k); o.prf = [...new Set(HERO.pr.map(x => x.k.split('|')[0]))]; }
  if (HERO.mk.length) o.mk = HERO.mk.map(l => ({ id: l.id, it: l.it, p: l.p, t: l.t }));
  if (HERO.mkd.length) o.mkd = HERO.mkd.map(x => ({ id: x.id, b: x.b, t: x.t }));
  if (HERO.mk.length + HERO.mkd.length) o.mkn = HERO.mk.length + HERO.mkd.length;
  if (HERO.kf.length){ o.kf = HERO.kf.map(c => ({ s: c.s, id: c.id, p: c.p, t: c.t, got: c.got })); o.kfn = HERO.kf.length; }
  if (HERO.lw){ o.lw = HERO.lw; o.lww = HERO.lw.w; }
  if (HERO.lwp) o.lwp = HERO.lwp;
  if (HERO.od && HERO.or && HERO.od.oid === HERO.or.id && HERO.od.g > 0) o.od = HERO.od;
  return o;
}
function asSubscribe(){
  for (const u of AS.subs) try { u(); } catch(e){}
  AS.subs = []; AS.got = false;
  if (!cloud.db || !cloud.uid) return;
  const C = cloud.db.collection('heroes'), me = cloud.uid;
  const on = (q, key) => AS.subs.push(q.onSnapshot(snap => { AS[key] = snap.docs.map(s => Object.assign({ id: s.id }, s.data() || {})); AS.got = true; asTick(true); }, () => {}));
  on(C.where('pto', 'array-contains', me).limit(100), 'post');
  on(C.where('prf', 'array-contains', me).limit(100), 'ack');
  on(C.where('mkn', '>', 0).limit(200), 'mk');
  on(C.where('kfn', '>', 0).limit(300), 'kf');
  on(C.where('lww', '>=', orWeek() - 1).limit(500), 'lw');
}
/* bekannte Ritter: Ruhmeshalle, Orden, Absender, die gerade im Land sind */
function asKnown(){
  const me = asMe(), map = new Map();
  const add = (id, nm, lv, f, at) => { if (!id || id === me || !UID_RE.test(id)) return; const e = map.get(id) || { id, nm: cleanName(nm) || 'Ritter', lv: clamp(lv | 0, 1, MAX_LVL), f: KN_FACTIONS[f] ? f : 'reich', at: 0 }; e.at = Math.max(e.at, +at || 0); map.set(id, e); };
  for (const r of (cloud.allRows || []).concat(cloud.orRows || [], AS.post, AS.mk)) add(r.id, r.nm, r.lv, r.f, r.at);
  for (const q of PEERS.values()) add(q.by, q.nm, q.lv, q.f, Date.now());
  return [...map.values()].sort((a, b) => b.at - a.at);
}

/* ---------- Botenpost ---------- */
function asInbox(){
  const me = asMe(), have = new Set(HERO.pr.map(x => x.k)), out = [];
  for (const d of AS.post){
    if (!UID_RE.test(d.id) || d.id === me || !Array.isArray(d.po)) continue;
    for (const l of d.po.slice(0, POST_MAX)){
      if (!l || l.to !== me || typeof l.id !== 'string' || !AID_RE.test(l.id)) continue;
      const k = d.id + '|' + l.id; if (have.has(k)) continue;
      out.push({ k, from: d.id, fnm: cleanName(d.nm) || 'Ein Ritter', id: l.id, tx: cleanText(asShow(l.tx, me), 200), g: clamp(l.g | 0, 0, POST_GOLD), raw: l.it && typeof l.it === 'object' ? l.it : null, t: +l.t || 0 });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}
function asTakeLetter(L){
  const it = L.raw ? cleanItem(L.raw) : null, j = HERO.inv.indexOf(null);
  if (it && j < 0){ logLine('Euer Rucksack ist voll. Macht erst Platz für die Beilage.', '#d8c69c'); return false; }
  if (it) HERO.inv[j] = it;
  HERO.gold += L.g;
  HERO.pr.push({ k: L.k, t: Date.now() }); asHero();
  if (L.g || it){ Sound.coin(); logLine('Aus dem Brief von ' + L.fnm + ': ' + [L.g ? L.g + ' Gulden' : '', it ? itemName(it) : ''].filter(Boolean).join(' und ') + '.', '#ffd98a'); }
  AS.inbox = asInbox(); updateHud(); renderTracker(); markDirty(true); fameNow();
  return true;
}
function asSend(D){
  const to = asKnown().find(k => k.id === D.to);
  if (!to) return 'Wählt einen Empfänger.';
  const tx = cleanText(D.tx, 200), g = clamp(D.g | 0, 0, POST_GOLD), it = D.idx != null ? HERO.inv[D.idx] : null;
  if (!tx && !g && !it) return 'Ein leerer Brief? Schreibt etwas oder legt etwas bei.';
  if (HERO.po.length >= POST_MAX) return 'Ihr habt schon ' + POST_MAX + ' Briefe unterwegs.';
  if (HERO.gold < g + PORTO) return 'Ihr braucht ' + (g + PORTO) + ' Gulden (mit Porto).';
  HERO.gold -= g + PORTO;
  if (it) HERO.inv[D.idx] = null;
  HERO.po.push({ id: asId(), to: to.id, tn: to.nm, tx, g, it: it ? packItem(it) : null, t: Date.now() });
  Sound.horn(); logLine('Der Postreiter bläst ins Horn und reitet los zu ' + to.nm + '.', '#ffd98a');
  AS.draft = null; updateHud(); markDirty(true); fameNow();
  return '';
}
function asRecall(l){
  const it = l.it ? cleanItem(l.it) : null, j = HERO.inv.indexOf(null);
  if (it && j < 0){ logLine('Euer Rucksack ist voll. Macht erst Platz für die Beilage.', '#d8c69c'); return; }
  if (it) HERO.inv[j] = it;
  HERO.gold += l.g; HERO.po = HERO.po.filter(x => x !== l);
  logLine('Der Brief an ' + l.tn + ' kommt ungelesen zurück' + (l.g || it ? ', samt Beilage.' : '.'), '#d8c69c');
  updateHud(); markDirty(true); fameNow();
}

/* ---------- Marktplatz ---------- */
function asClaimsFor(s, id){
  const me = asMe(), out = [];
  for (const d of AS.kf){ if (d.id === me || !UID_RE.test(d.id) || !Array.isArray(d.kf)) continue; for (const c of d.kf.slice(0, KF_MAX)) if (c && c.s === s && c.id === id) out.push({ b: d.id, t: +c.t || 0, got: c.got ? 1 : 0 }); }
  for (const c of HERO.kf) if (c.s === s && c.id === id) out.push({ b: me, t: c.t, got: c.got });
  return out;
}
const asWinner = cs => cs.slice().sort((a, b) => (a.t - b.t) || (a.b < b.b ? -1 : a.b > b.b ? 1 : 0))[0] || null;
function asListings(){
  const me = asMe(), out = [];
  for (const d of AS.mk){
    if (d.id === me || !UID_RE.test(d.id) || !Array.isArray(d.mk)) continue;
    for (const l of d.mk.slice(0, MK_MAX)){
      if (!l || typeof l.id !== 'string' || !AID_RE.test(l.id)) continue;
      const it = cleanItem(l.it); if (!it) continue;
      const cs = asClaimsFor(d.id, l.id);
      out.push({ s: d.id, snm: cleanName(d.nm) || 'Ein Ritter', id: l.id, it, raw: packItem(it), p: clamp(l.p | 0, 1, 99999), t: +l.t || 0, mine: cs.some(c => c.b === me), busy: cs.some(c => c.b !== me) });
    }
  }
  return out.sort((a, b) => b.t - a.t);
}
function asBuy(L){
  if (HERO.kf.length >= KF_MAX) return 'Ihr habt schon ' + KF_MAX + ' Käufe offen.';
  if (L.busy || L.mine) return 'Dieses Stück wird gerade verkauft.';
  if (HERO.gold < L.p) return 'Ihr habt keine ' + L.p + ' Gulden.';
  HERO.gold -= L.p;
  HERO.kf.push({ s: L.s, snm: L.snm, id: L.id, p: L.p, it: L.raw, t: Date.now(), got: 0 });
  Sound.coin(); logLine('Ihr zahlt ' + L.p + ' Gulden für ' + itemName(L.it) + '. Der Marktvogt prüft, ob kein anderer schneller war.', '#ffd98a');
  updateHud(); markDirty(true); fameNow();
  setTimeout(() => asTick(), 6500);
  return '';
}
function asOffer(idx, p){
  const it = HERO.inv[idx];
  if (!it) return 'Wählt etwas aus dem Rucksack.';
  if (HERO.mk.length >= MK_MAX) return 'Ihr habt schon ' + MK_MAX + ' Angebote auf dem Markt.';
  p = clamp(p | 0, 1, 99999);
  HERO.inv[idx] = null;
  HERO.mk.push({ id: asId(), it: packItem(it), p, t: Date.now() });
  Sound.coin(); logLine('Der Marktvogt nimmt ' + itemName(it) + ' für ' + p + ' Gulden in sein Buch.', '#ffd98a');
  AS.sell = null; updateHud(); markDirty(true); fameNow();
  return '';
}
function asWithdraw(l){
  if (asClaimsFor(asMe(), l.id).some(c => c.b !== asMe())) return 'Ein Käufer hat schon bezahlt.';
  const it = cleanItem(l.it), j = HERO.inv.indexOf(null);
  if (!it) { HERO.mk = HERO.mk.filter(x => x !== l); return ''; }
  if (j < 0) return 'Euer Rucksack ist voll.';
  HERO.inv[j] = it; HERO.mk = HERO.mk.filter(x => x !== l);
  logLine('Ihr nehmt ' + itemName(it) + ' vom Markt zurück.', '#d8c69c');
  updateHud(); markDirty(true); fameNow();
  return '';
}

/* ---------- Länderwettstreit ---------- */
function lwRoll(){
  const w = orWeek();
  if (HERO.lw && HERO.lw.w === w) return;
  HERO.lwp = HERO.lw && HERO.lw.w === w - 1 ? HERO.lw : HERO.lwp && HERO.lwp.w === w - 1 ? HERO.lwp : null;
  HERO.lw = { w, p: 0 };
}
function lwAdd(n){ if (!HERO || !(n > 0)) return; lwRoll(); HERO.lw.p = Math.min(1e6, HERO.lw.p + n); }
const lwPts = (r, w) => r.lw && r.lw.w === w ? clamp(+r.lw.p || 0, 0, 1e6) : r.lwp && r.lwp.w === w ? clamp(+r.lwp.p || 0, 0, 1e6) : 0;
function lwStand(w){
  const me = asMe(), tot = {}, cnt = {};
  for (const f of Object.keys(KN_FACTIONS)){ tot[f] = 0; cnt[f] = 0; }
  if (HERO) lwRoll();
  const rows = AS.lw.filter(r => r.id !== me).concat(HERO ? [{ id: me, f: HERO.f, lw: HERO.lw, lwp: HERO.lwp }] : []);
  for (const r of rows){ if (!KN_FACTIONS[r.f]) continue; const p = lwPts(r, w); if (p > 0){ tot[r.f] += p; cnt[r.f]++; } }
  return { tot, cnt };
}
function lwWinners(){ const { tot } = lwStand(orWeek() - 1), best = Math.max(0, ...Object.values(tot)); return best > 0 ? Object.keys(tot).filter(f => tot[f] === best) : []; }

/* ---------- Ordenshaus ---------- */
const LW_LAND = { reich: 'Das Reich', frankreich: 'Frankreich', england: 'England', spanien: 'Spanien' };
const lwIn = f => f === 'reich' ? 'das Reich' : LW_LAND[f];   // mitten im Satz
const OH_STEPS = [300, 1000, 2500, 5000, 9000];
const OH_PERK = [['Ordensstube', '+5 % Gulden von allem, was Ihr aufhebt'], ['Ordenskammer', '+5 % Erfahrung'], ['Ordensapotheke', 'jeden Tag zwei Heiltränke beim Kämmerer'], ['Waffenkammer', '+3 % Schaden'], ['Ordenshof', '+5 % Leben']];
function ohSum(){
  if (!HERO || !HERO.or) return 0;
  const id = HERO.or.id, me = asMe(); let s = 0;
  for (const r of cloud.orRows || []) if (r.id !== me && r.oid === id && r.od && r.od.oid === id) s += clamp(+r.od.g || 0, 0, 1e7);
  if (HERO.od && HERO.od.oid === id) s += HERO.od.g;
  return s;
}
const ohLvl = s => OH_STEPS.filter(x => s >= x).length;
function ohGive(n){
  if (!HERO.or || HERO.gold < n) return;
  if (!HERO.od || HERO.od.oid !== HERO.or.id) HERO.od = { oid: HERO.or.id, g: 0 };
  HERO.gold -= n; HERO.od.g += n;
  Sound.coin(); logLine('Ihr spendet ' + n + ' Gulden für das Ordenshaus des „' + HERO.or.nm + '“.', '#ffd98a');
  updateHud(); markDirty(true); fameNow(); asTick();
}
const asXpBonus = () => (ASV.glory ? .05 : 0) + (ASV.ord >= 2 ? .05 : 0);
const asGoldBonus = () => (ASV.glory ? .05 : 0) + (ASV.ord >= 1 ? .05 : 0);

/* ---------- Abgleich: Zustellung, Auszahlung, Kaufentscheid, Hinweise ---------- */
function asTick(fromSub){
  if (!HERO || !G || G.mode === 'title') return;
  asHero();
  const me = asMe(), now = Date.now();
  let changed = false;
  // abgeholte Briefe
  const acked = new Set();
  for (const d of AS.ack) if (Array.isArray(d.pr)) for (const k of d.pr.slice(0, 60)) if (typeof k === 'string' && k.startsWith(me + '|')) acked.add(d.id + '|' + k.slice(me.length + 1));
  for (const l of HERO.po.slice()) if (acked.has(l.to + '|' + l.id)){ HERO.po = HERO.po.filter(x => x !== l); changed = true; logLine('Der Postreiter meldet: ' + l.tn + ' hat Euren Brief erhalten.', '#9fe08a'); }
  // neue Briefe
  AS.inbox = asInbox();
  const fresh = AS.inbox.filter(L => !AS.seen.has(L.k));
  for (const L of fresh) AS.seen.add(L.k);
  if (fresh.length && AS.got){
    if (AS.first) logLine('Der Postmeister hat ' + (AS.inbox.length === 1 ? 'einen Brief' : AS.inbox.length + ' Briefe') + ' für Euch.', '#ffd98a');
    else { logLine('Ein Postreiter bringt einen Brief von ' + fresh[fresh.length - 1].fnm + '. Der Postmeister hält ihn bereit.', '#ffd98a'); Sound.horn(); }
  }
  if (AS.got) AS.first = false;
  // Verkäufer: bezahlt wird, wer den Zuschlag hat und die Ware genommen hat
  for (const l of HERO.mk.slice()){
    const w = asWinner(asClaimsFor(me, l.id).filter(c => c.b !== me));
    if (!w || !w.got) continue;
    const fee = Math.max(1, Math.round(l.p * MK_FEE)), it = cleanItem(l.it), who = asKnown().find(k => k.id === w.b);
    HERO.gold += l.p - fee; HERO.mk = HERO.mk.filter(x => x !== l); HERO.mkd.push({ id: l.id, b: w.b, t: now });
    Sound.coin(); logLine('Verkauft: ' + (it ? itemName(it) : 'ein Stück') + ' an ' + (who ? who.nm : 'einen Ritter') + ' für ' + l.p + ' Gulden (Marktgebühr ' + fee + ').', '#ffd98a');
    changed = true;
  }
  // Käufer: Zuschlag prüfen, Ware nehmen oder Geld zurück
  for (const c of HERO.kf.slice()){
    const sd = AS.mk.find(d => d.id === c.s);
    const listed = !!(sd && Array.isArray(sd.mk) && sd.mk.some(l => l && l.id === c.id));
    const soldMe = !!(sd && Array.isArray(sd.mkd) && sd.mkd.some(x => x && x.id === c.id && x.b === me));
    if (!c.got){
      if (now - c.t < 6000 || !AS.got) continue;
      const w = asWinner(asClaimsFor(c.s, c.id));
      if (w && w.b === me && (listed || soldMe)){
        const it = cleanItem(c.it), j = HERO.inv.indexOf(null);
        if (!it){ c.got = 1; changed = true; continue; }
        if (j < 0){ if (!c.full){ c.full = 1; logLine('Euer Rucksack ist voll. Macht Platz, dann gibt Euch der Marktvogt ' + itemName(it) + '.', '#d8c69c'); } continue; }
        HERO.inv[j] = it; c.got = 1; changed = true;
        Sound.loot(it.r); logLine('Gekauft: ' + itemName(it) + ' von ' + c.snm + '.', '#ffd98a');
      } else if ((w && w.b !== me) || (!listed && !soldMe && now - c.t > 20000)){
        HERO.gold += c.p; HERO.kf = HERO.kf.filter(x => x !== c); changed = true;
        logLine('Ein anderer Ritter war schneller. Der Marktvogt gibt Euch ' + c.p + ' Gulden zurück.', '#d8c69c');
      }
    } else if (soldMe || now - c.t > 8 * DAY){ HERO.kf = HERO.kf.filter(x => x !== c); changed = true; }
  }
  // Ordenshaus und Länderwettstreit
  if (HERO.or && (!HERO.od || HERO.od.oid !== HERO.or.id)){ HERO.od = { oid: HERO.or.id, g: 0 }; }
  if (!HERO.or && HERO.od){ HERO.od = null; }
  const ord = HERO.or ? ohLvl(ohSum()) : 0, glory = lwWinners().includes(HERO.f);
  if (ord !== ASV.ord || glory !== ASV.glory){
    if (ord > ASV.ord && !AS.firstOrd) logLine('Das Ordenshaus ist gewachsen: ' + OH_PERK[ord - 1][0] + '. ' + OH_PERK[ord - 1][1] + '.', '#ffd98a');
    if (glory && !ASV.glory) logLine('Ruhm des Landes: ' + LW_LAND[HERO.f] + ' hat den Länderwettstreit der letzten Woche gewonnen. Diese Woche +5 % Erfahrung und Gulden.', '#ffd98a');
    ASV.ord = ord; ASV.glory = glory; refreshStats(); renderBuffs();
  }
  AS.firstOrd = !AS.got;
  if (changed){ asHero(); updateHud(); markDirty(true); fameNow(); }
  if (changed || fromSub){
    renderTracker();
    const v = G.talk && G.talk.view;
    if (G.mode === 'menu' && typeof v === 'string' && /^(post|markt|lw|ordh)/.test(v) && v !== 'postNeu' && v !== 'marktV') renderTalk(v);
  }
}
setInterval(() => { try { asTick(); } catch(e){} }, 5000);

/* ---------- Leute: Postmeister, Postreiter, Marktvogt, Ordenskämmerer ---------- */
NPC_ART.postmeister = np_frames({ robe: 'short', hat: 'barett', belt: true, chain: true, parti: true, hair: ['h', 'j'] }, { 1: '#1c2a5a', 2: '#2a3e7e', 3: '#3e56a0', 4: '#5a74bc', 5: '#7a5a10', 6: '#b08a1e', 7: '#d8b030', 8: '#f0d460', R: '#b8281e' });
NPC_ART.postreiter = np_frames({ robe: 'short', hat: 'filz', belt: true, parti: true, hair: ['h', 'j'] }, { 1: '#7a5a10', 2: '#b08a1e', 3: '#d8b030', 4: '#f0d460', 5: '#141218', 6: '#221e28', 7: '#322c3a', 8: '#463e50' });
NPC_ART.marktvogt = np_frames({ robe: 'long', hat: 'barett', fur: true, beard: true, belt: true, hair: ['h', 'j'] }, { 1: '#16241c', 2: '#22362a', 3: '#30483a', 4: '#425e4c', 5: '#2a1a10', 6: '#3e2a1a', 7: '#56402a', 8: '#6e563c' });
NPC_ART.kaemmerer = np_frames({ robe: 'long', hat: 'barett', chain: true, beard: true, hair: ['w', 'x'] }, { 1: '#3a0e12', 2: '#5a1a1e', 3: '#7a2a2a', 4: '#9a3a34', 5: '#141218', 6: '#221e28', 7: '#322c3a', 8: '#463e50', w: '#8a8478', x: '#c8c2b0' });
for (const n of [
  { id: 'postmeister', name: 'Postmeister Johann von Taxis', role: 'Kaiserliche Post', hub: 'stadt', at: gNear(2884, 2306), post: true,
    greet: ['Die Post der Taxis reitet von Brüssel bis Innsbruck. Und von hier zu jedem Ritter im Reichsland.', 'Ein Brief, ein Beutel Gulden, ein gutes Schwert: Meine Reiter bringen alles.', 'Alle fünf Meilen ein frisches Pferd, so ist die kaiserliche Post schneller als jeder Bote.'] },
  { id: 'postreiter', name: 'Postreiter Kilian', role: 'Kaiserliche Post', hub: 'burg', at: gNear(1850, 528), post: true,
    greet: ['Das Horn am Gürtel, den Brief in der Tasche. Wohin soll es gehen, Herr Ritter?', 'Ich reite für die Taxis. Briefe holt Ihr bei mir oder beim Postmeister in der Stadt.'] },
  { id: 'marktvogt', name: 'Marktvogt Sebald', role: 'Marktplatz', hub: 'stadt', at: gNear(3008, 2286), market: true,
    greet: ['Auf diesem Markt kauft Ihr, was andere Ritter anbieten, auch wenn sie gerade nicht in der Stadt sind.', 'Ehrliches Maß, ehrlicher Preis. Und ein Zwanzigstel für die Stadt.', 'Wer zuerst zahlt, bekommt die Ware. So ist es Brauch.'] },
  { id: 'kaemmerer', name: 'Ordenskämmerer Ruprecht', role: 'Ordenshaus', hub: 'stadt', at: gNear(3412, 2300), ordhaus: true,
    greet: ['Jeder Gulden für das Ordenshaus macht alle Brüder stärker.', 'Ein Orden ohne Haus ist wie ein Ritter ohne Pferd.', 'Ich führe die Bücher aller Ordenshäuser des Reichslandes.'] }
]){ n.x = n.at.x; n.y = n.at.y; n.art = NPC_ART[n.id]; n.key = n.id; NPCS.push(n); }
{ const k = NPCS.find(n => n.id === 'kaemmerer'); Object.defineProperty(k, 'role', { get: () => HERO && HERO.or && ASV.ord ? 'Ordenshaus · Stufe ' + ASV.ord : 'Ordenshaus' }); }
/* Fahnenmast am Ordenshaus: zeigt das Banner des eigenen Ordens und seine Stufe */
function asList(cam, list){
  if (!HERO || !HERO.or) return;
  const k = NPCS.find(n => n.id === 'kaemmerer'); if (!k) return;
  const x = k.x - 34, y = k.y - 4;
  if (!inView(x, y, cam, 60)) return;
  list.push({ y, d: () => {
    shadow(x, y, 8, .35);
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 64, 4, 64); ctx.fillStyle = '#6e563c'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 63, 2, 62);
    ctx.fillStyle = '#d8b030'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 66, 4, 3);
    const b = orBanner(HERO.or.wp), sway = Math.round(Math.sin(G.t * 2) * 1);
    ctx.drawImage(b, 0, 0, b.width, b.height, Math.round(x) + 2, Math.round(y) - 62 + sway, b.width * 2, b.height * 2);
  } });
}
function asBuffs(box){
  if (!HERO) return;
  const chip = (icon, txt, title) => { const c = el('span', 'buff'), im = el('img'); im.src = icon; im.alt = ''; c.append(im, el('span', null, txt)); c.title = title; box.append(c); };
  if (ASV.glory) chip(urlOf(ICONS.eagle, 2), 'Ruhm', 'Ruhm des Landes: Euer Land hat den Länderwettstreit der letzten Woche gewonnen. +5 % Erfahrung und Gulden.');
  if (ASV.ord > 0 && HERO.or) chip(orUrl(HERO.or.wp, 2), 'Haus ' + ASV.ord, 'Ordenshaus Stufe ' + ASV.ord + ': ' + OH_PERK.slice(0, ASV.ord).map(p => p[1]).join(', ') + '.');
}
function asRows(box){
  if (!HERO) return;
  const n = AS.inbox.length;
  if (n){ const p = el('p', 'post'); p.append(el('b', null, 'Botenpost: '), el('span', null, (n === 1 ? 'ein Brief' : n + ' Briefe') + ' beim Postmeister')); box.append(p); }
  if (HERO.kf.some(c => !c.got)){ const p = el('p', 'post'); p.append(el('b', null, 'Markt: '), el('span', null, 'Kauf wird geprüft')); box.append(p); }
}
const asMark = n => (n.post && AS.inbox.length) ? '!' : '';

/* ---------- Gespräche: Botenpost, Markt, Länderwettstreit, Ordenshaus ---------- */
function asTalkOpts(n, opts){
  if (n.post){
    const k = AS.inbox.length;
    opts.append(btn('Botenpost: Eure Briefe' + (k ? ' (' + k + ' neu)' : ''), () => renderTalk('post'), 'opt' + (k ? ' new' : '')));
    opts.append(btn('Einen Brief schreiben (' + PORTO + ' Gulden Porto)', () => { AS.draft = AS.draft || { to: '', tx: '', g: 0, idx: null }; renderTalk('postNeu'); }, 'opt'));
  }
  if (n.market) opts.append(btn('Markt: Angebote der Ritter', () => renderTalk('markt'), 'opt'), btn('Etwas verkaufen', () => { AS.sell = { idx: null, p: 0 }; renderTalk('marktV'); }, 'opt'), btn('Meine Angebote und Käufe', () => renderTalk('marktM'), 'opt'));
  if (n.joust) opts.append(btn('Länderwettstreit', () => renderTalk('lw'), 'opt'));
  if (n.ordhaus) opts.append(btn('Ordenshaus' + (HERO.or ? ' des „' + HERO.or.nm + '“' : ''), () => renderTalk('ordh'), 'opt'));
}
/* eine Zeile mit Gegenstand: Bild, Name in der Farbe der Seltenheit, Werte, darunter ein Zusatz */
function asItemRow(it, sub){
  const r = el('div', 'shoprow'), ic = el('img'), t = el('div', 'stx'), nm = el('b', null, itemName(it));
  ic.src = itemUrl(it); ic.alt = ''; ic.style.boxShadow = '0 0 0 2px ' + RARITY[it.r].c; nm.style.color = RARITY[it.r].c;
  t.append(nm, el('small', null, it.s === 'ware' ? 'Handelsware' : 'Stufe ' + it.il + ' · ' + itemLines(it).join(' · ')));
  if (sub) t.append(el('small', null, sub));
  r.append(ic, t);
  return r;
}
function asPick(grid, sel, view, onPick){
  HERO.inv.forEach((it, i) => {
    if (!it) return;
    const b = el('button', 'slot' + (sel === i ? ' sel' : '')); b.type = 'button'; b.dataset.slot = view + ':' + i;
    b.style.setProperty('--rc', RARITY[it.r].c);
    const im = el('img'); im.src = itemUrl(it); im.alt = itemName(it); b.append(im);
    if (it.q > 1) b.append(el('span', 'qty', it.q));
    b.title = itemName(it) + (it.s === 'ware' ? '' : ': ' + itemLines(it).join(', '));
    b.addEventListener('click', () => onPick(i));
    grid.append(b);
  });
}
function asLwBars(w){
  const st = lwStand(w), max = Math.max(1, ...Object.values(st.tot)), box = el('div', 'lwbars');
  for (const f of Object.keys(st.tot).sort((a, b) => st.tot[b] - st.tot[a])){
    const r = el('div', 'lwrow' + (HERO && f === HERO.f ? ' me' : '')), im = el('img'), bar = el('div', 'orbar'), fill = el('i');
    im.src = urlOf(knightSet(f).icon, 2); im.alt = '';
    fill.style.width = (st.tot[f] / max * 100) + '%';
    bar.append(fill, el('span', null, st.tot[f] + ' Punkte · ' + st.cnt[f] + (st.cnt[f] === 1 ? ' Ritter' : ' Ritter')));
    r.append(im, el('b', null, LW_LAND[f]), bar); box.append(r);
  }
  return box;
}
function asLwClaim(){
  const w = orWeek();
  if (!lwWinners().includes(HERO.f) || HERO.lwClaim === w) return;
  HERO.lwClaim = w;
  const gold = 30 + HERO.lvl * 8;
  HERO.gold += gold; HERO.potions = Math.min(20, HERO.potions + 2);
  showBanner('Wochenlohn des Landes', gold + ' Gulden und zwei Heiltränke');
  logLine('Der Herold zahlt den Wochenlohn für ' + lwIn(HERO.f) + ': ' + gold + ' Gulden und zwei Heiltränke.', '#ffd98a');
  Sound.levelUp(); updateHud(); markDirty(true);
}
const asDay = () => Math.floor(Date.now() / DAY);
function asView(view, body, opts){
  G.talk.view = view;
  const back = to => opts.append(btn('Zurück', () => renderTalk(to || 'main'), 'tbtn'));
  if (!asOnline() && view !== 'lw' && view !== 'ordh'){
    $('talkText').textContent = 'Die kaiserliche Post und der Markt verbinden Euch mit den anderen Rittern. Ohne Anmeldung bleibt Ihr hier für Euch.';
    back(); body.append(opts); return;
  }
  if (view === 'post'){
    const L = AS.inbox;
    $('talkText').textContent = L.length ? 'Für Euch ' + (L.length === 1 ? 'liegt ein Brief' : 'liegen ' + L.length + ' Briefe') + ' bereit.' : 'Für Euch liegt kein Brief da.';
    for (const x of L){
      const r = el('div', 'shoprow'), t = el('div', 'stx'), seal = el('span', 'seal', '✉');
      t.append(el('b', null, 'Von ' + x.fnm), el('small', null, 'vor ' + agoText(Date.now() - x.t) + (x.tx ? ' · „' + x.tx.slice(0, 48) + (x.tx.length > 48 ? '…' : '') + '“' : '') + (x.g ? ' · ' + x.g + ' Gulden' : '') + (x.raw ? ' · mit Beilage' : '')));
      const b = btn('Öffnen', () => renderTalk('postL:' + x.k), 'tbtn'); b.dataset.slot = 'pl:' + x.k;
      r.append(seal, t, b); body.append(r);
    }
    if (HERO.po.length){
      body.append(el('p', 'hint', 'Eure Briefe unterwegs:'));
      for (const l of HERO.po){
        const r = el('div', 'shoprow'), t = el('div', 'stx'), old = Date.now() - l.t > POST_BACK;
        t.append(el('b', null, 'An ' + l.tn), el('small', null, 'vor ' + agoText(Date.now() - l.t) + (l.g ? ' · ' + l.g + ' Gulden' : '') + (l.it ? ' · mit Beilage' : '') + ' · noch nicht abgeholt'));
        r.append(el('span', 'seal', '✉'), t);
        if (old){ const b = btn('Zurückholen', () => { asRecall(l); renderTalk('post'); }, 'tbtn'); b.dataset.slot = 'pr:' + l.id; r.append(b); } else r.append(el('span'));
        body.append(r);
      }
      body.append(el('p', 'hint', 'Holt der Empfänger einen Brief drei Tage lang nicht ab, könnt Ihr ihn samt Beilage zurückholen.'));
    }
    opts.append(btn('Einen Brief schreiben', () => { AS.draft = AS.draft || { to: '', tx: '', g: 0, idx: null }; renderTalk('postNeu'); }, 'opt'));
    back(); body.append(opts); return;
  }
  if (view.startsWith('postL:')){
    const x = AS.inbox.find(L => L.k === view.slice(6));
    if (!x){ $('talkText').textContent = 'Diesen Brief habt Ihr schon geöffnet.'; back('post'); body.append(opts); return; }
    $('talkText').textContent = 'Ein Brief von ' + x.fnm + ', vor ' + agoText(Date.now() - x.t) + ' geschrieben.';
    const card = el('div', 'letter'); card.append(el('p', null, x.tx || '(Der Brief ist leer, nur die Beilage liegt darin.)'), el('p', 'sig', x.fnm)); body.append(card);
    const it = x.raw ? cleanItem(x.raw) : null;
    if (x.g) body.append(el('p', 'tg', 'Beigelegt: ' + x.g + ' Gulden'));
    if (it) body.append(asItemRow(it, 'Beigelegt'));
    opts.append(btn(x.g || it ? 'Beilage annehmen' : 'Gelesen', () => { if (asTakeLetter(x)) renderTalk('post'); }, 'opt ready'));
    opts.append(btn('Antworten', () => { if (!x.raw || HERO.inv.includes(null)) asTakeLetter(x); AS.draft = { to: x.from, tx: '', g: 0, idx: null }; renderTalk('postNeu'); }, 'opt'));
    back('post'); body.append(opts); return;
  }
  if (view === 'postNeu'){
    const D = AS.draft || (AS.draft = { to: '', tx: '', g: 0, idx: null }), K = asKnown();
    if (D.idx != null && !HERO.inv[D.idx]) D.idx = null;
    D.g = clamp(D.g, 0, Math.max(0, Math.min(POST_GOLD, HERO.gold - PORTO)));
    $('talkText').textContent = 'Wem soll der Postreiter einen Brief bringen? Er findet jeden Ritter, auch wenn der gerade nicht im Land ist. Porto: ' + PORTO + ' Gulden.';
    const sel = el('select', 'pin'); sel.setAttribute('aria-label', 'Empfänger');
    sel.append(new Option('Empfänger wählen …', ''));
    for (const k of K.slice(0, 80)) sel.append(new Option(k.nm + ' (Stufe ' + k.lv + ', ' + LW_LAND[k.f] + ')', k.id));
    sel.value = D.to; sel.addEventListener('change', () => { D.to = sel.value; });
    const ta = el('textarea', 'pin'); ta.maxLength = 200; ta.rows = 3; ta.placeholder = 'Euer Brief, bis 200 Zeichen'; ta.value = D.tx; ta.setAttribute('aria-label', 'Brieftext');
    const cnt = el('small', 'hint', D.tx.length + ' / 200');
    ta.addEventListener('input', () => { D.tx = ta.value; cnt.textContent = ta.value.length + ' / 200'; });
    body.append(sel, ta, cnt);
    if (!K.length) body.append(el('p', 'hint', 'Noch kennt der Postmeister keinen anderen Ritter. Wer einmal im Reichsland war, steht in seinem Buch.'));
    const gold = el('div', 'tgold'); gold.append(el('span', null, 'Gulden beilegen: ' + D.g));
    for (const d of [-50, -10, 10, 50]){ const b = btn((d > 0 ? '+' : '−') + Math.abs(d), () => { D.g = clamp(D.g + d, 0, Math.max(0, Math.min(POST_GOLD, HERO.gold - PORTO))); renderTalk('postNeu'); }, 'tbtn'); b.dataset.slot = 'pg:' + d; gold.append(b); }
    body.append(gold, el('p', 'hint', 'Einen Gegenstand beilegen (antippen, noch einmal antippen: keiner):'));
    const grid = el('div', 'tgrid'); asPick(grid, D.idx, 'pi', i => { D.idx = D.idx === i ? null : i; renderTalk('postNeu'); });
    if (grid.children.length) body.append(grid);
    if (D.idx != null) body.append(asItemRow(HERO.inv[D.idx], 'liegt bei'));
    const err = el('p', 'hint warn');
    const send = btn('Absenden (' + (PORTO + D.g) + ' Gulden)', () => { const e = asSend(D); if (e){ err.textContent = e; } else renderTalk('post'); }, 'opt ready'); send.dataset.slot = 'psend';
    opts.append(send); back('post'); body.append(err, opts); return;
  }
  if (view === 'markt'){
    const all = asListings(), f = AS.mf, L = all.filter(x => f === 'alle' || (f === 'ware' ? x.it.s === 'ware' : x.it.s === f));
    $('talkText').textContent = all.length ? 'Auf dem Markt ' + (all.length === 1 ? 'liegt ein Angebot' : 'liegen ' + all.length + ' Angebote') + '. Ihr habt ' + HERO.gold + ' Gulden.' : 'Noch bietet kein Ritter etwas an. Wer etwas verkaufen will, kommt zu mir.';
    if (all.length){
      const fl = el('div', 'tgold');
      for (const [k, nm] of [['alle', 'Alle'], ['waffe', 'Waffen'], ['helm', 'Helme'], ['ruestung', 'Rüstungen'], ['schild', 'Schilde'], ['beine', 'Beine'], ['kleinod', 'Kleinode'], ['ware', 'Waren']]){ const b = btn(nm, () => { AS.mf = k; renderTalk('markt'); }, 'tbtn' + (f === k ? ' on' : '')); b.dataset.slot = 'mf:' + k; fl.append(b); }
      body.append(fl);
    }
    for (const x of L.slice(0, 30)){
      const better = x.it.s !== 'ware' && itemGain(x.it) > 0;
      const r = asItemRow(x.it, 'von ' + x.snm + ' · vor ' + agoText(Date.now() - x.t) + (better ? ' · besser als Eures' : ''));
      const b = btn(x.mine ? 'Bezahlt' : x.busy ? 'Verkauft' : x.p + ' Gulden', () => { const e = asBuy(x); if (e) logLine(e, '#d8c69c'); renderTalk('markt'); }, 'tbtn');
      b.dataset.slot = 'mb:' + x.s + ':' + x.id; b.disabled = x.mine || x.busy || HERO.gold < x.p;
      r.append(b); body.append(r);
    }
    if (all.length && !L.length) body.append(el('p', 'hint', 'Davon liegt gerade nichts aus.'));
    opts.append(btn('Etwas verkaufen', () => { AS.sell = { idx: null, p: 0 }; renderTalk('marktV'); }, 'opt'), btn('Meine Angebote und Käufe', () => renderTalk('marktM'), 'opt'));
    back(); body.append(opts); return;
  }
  if (view === 'marktV'){
    const S = AS.sell || (AS.sell = { idx: null, p: 0 }), it = S.idx != null ? HERO.inv[S.idx] : null;
    $('talkText').textContent = 'Was wollt Ihr anbieten? Ich verwahre die Ware, bis ein Ritter sie kauft, auch wenn Ihr dann nicht in der Stadt seid. Beim Verkauf behält die Stadt ein Zwanzigstel.';
    const grid = el('div', 'tgrid'); asPick(grid, S.idx, 'mv', i => { S.idx = i; S.p = Math.max(1, Math.round(itemValue(HERO.inv[i]) * 2)); renderTalk('marktV'); });
    body.append(grid.children.length ? grid : el('p', 'hint', 'Euer Rucksack ist leer.'));
    if (it){
      body.append(asItemRow(it, 'Der Krämer zahlt ' + itemValue(it) + ' Gulden'));
      const pr = el('div', 'tgold'); pr.append(el('span', null, 'Preis: ' + S.p + ' Gulden'));
      for (const d of [-100, -10, -1, 1, 10, 100]){ const b = btn((d > 0 ? '+' : '−') + Math.abs(d), () => { S.p = clamp(S.p + d, 1, 99999); renderTalk('marktV'); }, 'tbtn'); b.dataset.slot = 'mp:' + d; pr.append(b); }
      body.append(pr);
      const go = btn('Anbieten für ' + S.p + ' Gulden', () => { const e = asOffer(S.idx, S.p); if (e) logLine(e, '#d8c69c'); else renderTalk('marktM'); }, 'opt ready'); go.dataset.slot = 'moffer';
      opts.append(go);
    }
    opts.append(btn('Zum Markt', () => renderTalk('markt'), 'opt')); back(); body.append(opts); return;
  }
  if (view === 'marktM'){
    const me = asMe();
    $('talkText').textContent = 'Euer Eintrag im Buch des Marktvogts.';
    body.append(el('p', 'hint', HERO.mk.length ? 'Eure Angebote:' : 'Ihr bietet gerade nichts an.'));
    for (const l of HERO.mk){
      const it = cleanItem(l.it); if (!it) continue;
      const busy = asClaimsFor(me, l.id).some(c => c.b !== me), r = asItemRow(it, l.p + ' Gulden · ' + (busy ? 'ein Käufer hat bezahlt' : 'seit ' + agoText(Date.now() - l.t)));
      const b = btn('Zurücknehmen', () => { const e = asWithdraw(l); if (e) logLine(e, '#d8c69c'); renderTalk('marktM'); }, 'tbtn'); b.dataset.slot = 'mw:' + l.id; b.disabled = busy;
      r.append(b); body.append(r);
    }
    if (HERO.kf.length){ body.append(el('p', 'hint', 'Eure Käufe:')); for (const c of HERO.kf){ const it = cleanItem(c.it); if (it) body.append(asItemRow(it, 'von ' + c.snm + ' · ' + c.p + ' Gulden · ' + (c.got ? 'erhalten' : 'wird geprüft'))); } }
    if (HERO.mkd.length) body.append(el('p', 'hint', 'In den letzten sieben Tagen verkauft: ' + HERO.mkd.length + (HERO.mkd.length === 1 ? ' Stück.' : ' Stücke.')));
    opts.append(btn('Zum Markt', () => renderTalk('markt'), 'opt'), btn('Etwas verkaufen', () => { AS.sell = { idx: null, p: 0 }; renderTalk('marktV'); }, 'opt'));
    back(); body.append(opts); return;
  }
  if (view === 'lw'){
    const w = orWeek(), win = lwWinners(); lwRoll();
    $('talkText').textContent = 'Hört, hört! Jede Woche wetteifern die Ritter des Reiches, Frankreichs, Englands und Spaniens um den Ruhm ihres Landes. Punkte bringt alles, was ein Ritter vollbringt: Monster und Anführer, Weltereignisse, Tjost, Feste, Jagd, Gewölbe und die Hauptgeschichte.';
    body.append(el('p', 'hint', 'Diese Woche, Stand jetzt:'), asLwBars(w));
    body.append(el('p', 'hint', 'Euer Beitrag: ' + HERO.lw.p + ' Punkte für ' + lwIn(HERO.f) + '. ' + (win.length ? 'Letzte Woche gewann ' + win.map(lwIn).join(' und ') + '.' : 'Letzte Woche hat kein Land gewonnen.') + ' Die Ritter des Siegerlandes haben eine Woche lang +5 % Erfahrung und Gulden und holen hier einen Wochenlohn ab.'));
    if (win.includes(HERO.f)){ const done = HERO.lwClaim === w, b = btn(done ? 'Wochenlohn dieser Woche erhalten' : 'Wochenlohn des Landes abholen', () => { asLwClaim(); renderTalk('lw'); }, 'opt' + (done ? '' : ' ready')); b.disabled = done; opts.append(b); }
    if (!asOnline()) body.append(el('p', 'hint', 'Ohne Anmeldung zählen nur Eure eigenen Punkte.'));
    back(); body.append(opts); return;
  }
  if (view === 'ordh'){
    if (!HERO.or){ $('talkText').textContent = 'Das Ordenshaus gehört den Ritterorden. Gründet beim Herold einen Orden oder lasst Euch von einem Ordensritter aufnehmen, dann baut Ihr hier gemeinsam.'; back(); body.append(opts); return; }
    const sum = ohSum(), L = ohLvl(sum), next = OH_STEPS[L];
    $('talkText').textContent = 'Das Haus des Ordens „' + HERO.or.nm + '“ ' + (L ? 'hat die Stufe ' + L + ': ' + OH_PERK[L - 1][0] + '.' : 'ist noch eine leere Halle.') + ' Jeder Gulden, den ein Ordensritter spendet, zählt für alle, und die Vorteile gelten für jeden im Orden.';
    const head = el('div', 'shoprow'), ic = el('img'), t = el('div', 'stx'); ic.src = orUrl(HERO.or.wp, 4); ic.alt = ''; ic.className = 'orbig';
    t.append(el('b', null, HERO.or.nm), el('small', null, 'Gespendet: ' + sum + ' Gulden · davon von Euch ' + (HERO.od ? HERO.od.g : 0)));
    head.append(ic, t, el('span')); body.append(head);
    const bar = el('div', 'orbar'), fill = el('i'); fill.style.width = (next ? Math.min(100, sum / next * 100) : 100) + '%';
    bar.append(fill, el('span', null, next ? 'Stufe ' + (L + 1) + ' bei ' + next + ' Gulden (' + sum + ' / ' + next + ')' : 'Höchste Stufe erreicht')); body.append(bar);
    const ul = el('ul', 'perks');
    OH_PERK.forEach((p, i) => { const li = el('li', i < L ? 'on' : '', (i < L ? '✓ ' : '· ') + 'Stufe ' + (i + 1) + ', ' + p[0] + ' (' + OH_STEPS[i] + ' Gulden): ' + p[1]); ul.append(li); });
    body.append(ul);
    const donors = (cloud.orRows || []).filter(r => r.id !== asMe() && r.oid === HERO.or.id && r.od && r.od.oid === HERO.or.id).map(r => [cleanName(r.nm) || 'Ritter', clamp(+r.od.g || 0, 0, 1e7)]).concat([[HERO.name, HERO.od ? HERO.od.g : 0]]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (donors.length) body.append(el('p', 'hint', 'Die größten Spender: ' + donors.map(d => d[0] + ' ' + d[1]).join(', ') + '.'));
    const gold = el('div', 'tgold'); gold.append(el('span', null, 'Spenden (Ihr habt ' + HERO.gold + '):'));
    for (const n of [10, 50, 100, 500]){ const b = btn(n + ' Gulden', () => { ohGive(n); renderTalk('ordh'); }, 'tbtn'); b.dataset.slot = 'og:' + n; b.disabled = HERO.gold < n; gold.append(b); }
    body.append(gold);
    if (L >= 3){ const done = HERO.ohDay === asDay(), b = btn(done ? 'Heute schon Heiltränke geholt' : 'Zwei Heiltränke aus der Ordensapotheke', () => { HERO.ohDay = asDay(); HERO.potions = Math.min(20, HERO.potions + 2); Sound.coin(); logLine('Aus der Ordensapotheke: zwei Heiltränke.', '#ffd98a'); updateHud(); markDirty(true); renderTalk('ordh'); }, 'opt' + (done ? '' : ' ready')); b.disabled = done || HERO.potions >= 20; opts.append(b); }
    if (!asOnline()) body.append(el('p', 'hint', 'Ohne Anmeldung zählen nur Eure eigenen Spenden.'));
    back(); body.append(opts); return;
  }
  back(); body.append(opts);
}
/* Ruhmeshalle: Länderwettstreit */
function asFameLw(box){
  const w = orWeek(), st = lwStand(w), win = lwWinners();
  Object.keys(st.tot).sort((a, b) => st.tot[b] - st.tot[a]).forEach((f, i) => {
    const li = el('li', HERO && HERO.f === f ? 'me' : ''), nm = el('span', 'fn'), im = el('img', 'forb'); im.src = urlOf(knightSet(f).icon, 2); im.alt = ''; nm.append(im, LW_LAND[f]);
    li.append(el('span', 'fr', String(i + 1)), nm, el('span', 'fl', st.tot[f] + ' Punkte'), el('span', 'fk', st.cnt[f] + ' Ritter diese Woche' + (win.includes(f) ? ' · Sieger der letzten Woche' : '')));
    box.append(li);
  });
  box.append(el('li', 'empty', 'Jede Woche ab Montag beginnt der Wettstreit neu. Punkte bringt alles, was ein Ritter vollbringt; den Stand verkündet der Herold vor der Reichsstadt.'));
}


/* ============ Stromland: Leute in Speyer und Altrip, Fährmann, Fischerei, Schiffsreise, Aufträge des Stadtschreibers ============ */
Object.assign(Sound, {
  plop(){ this.tone(520, .08, 'sine', .05, -260); this.noise(.06, .03, 2600, .02); },
  bite(){ this.tone(300, .05, 'square', .04, 120); this.tone(420, .05, 'square', .035, 120, .07); this.noise(.08, .05, 1800); },
  reel(){ for (let i = 0; i < 5; i++) this.noise(.025, .03, 3200, i * .045); },
  oar(){ this.noise(.18, .05, 900); this.noise(.18, .04, 700, .45); }
});
NPC_ART.hafenmeister = np_frames({ robe: 'short', hat: 'filz', beard: true, belt: true, chain: true, hair: ['h', 'j'] }, { 1: '#16283a', 2: '#223a52', 3: '#30506c', 4: '#466a88', 5: '#2a2420', 6: '#3a322c', 7: '#4a4038', 8: '#5c5048' });
NPC_ART.fischer = np_frames({ robe: 'short', hat: 'filz', apron: 'linen', beard: true, hairSide: true, hair: ['j', 'h'] }, { 1: '#2c3424', 2: '#3e4a32', 3: '#526044', 4: '#6a7a58', 5: '#3a2c1e', 6: '#4a3a28', 7: '#5a4a34', 8: '#6e5c44' });
NPC_ART.faehrmann = np_frames({ robe: 'short', hat: 'filz', beard: true, belt: true, hair: ['h', 'j'] }, { 1: '#3a2c1e', 2: '#4e3c28', 3: '#645036', 4: '#7c6646', 5: '#2a3a44', 6: '#3a4e5a', 7: '#4e6470', 8: '#647c88' });
NPC_ART.kraemerin2 = np_frames({ robe: 'long', hat: 'haube', apron: 'linen' }, { 1: '#2a3a5a', 2: '#3a4e74', 3: '#4e648e', 4: '#667ca6', 5: '#3a2c1e', 6: '#4a3a28', 7: '#5a4a34', 8: '#6e5c44' });
NPC_ART.schreiber = np_frames({ robe: 'long', hat: 'barett', fur: true, belt: true, hair: ['h', 'j'] }, { 1: '#141218', 2: '#221e28', 3: '#322c3a', 4: '#463e50', 5: '#3a2a1a', 6: '#54402a', 7: '#6e583c', 8: '#8a7254' });
NPC_ART.reichsherold = np_frames({ robe: 'short', hat: 'barett', belt: true, chain: true, staff: true, parti: true, hair: ['h', 'j'] }, { 1: '#141218', 2: '#221e28', 3: '#322c3a', 4: '#463e50', 5: '#7a5a10', 6: '#b08a1e', 7: '#d8b030', 8: '#f0d460', R: '#b8281e' });
for (const n of [
  { id: 'hafenmeister', name: 'Hafenmeister Claus Ruthard', role: 'Hafen und Überfahrt', hub: 'speyer', at: gNear(5200, 1632), ferry: 'speyer',
    greet: ['Holz aus dem Schwarzwald, Wein aus der Pfalz, Tuch aus Flandern: Alles geht über meinen Kai.', 'Die Piraten auf der Insel kosten uns jede Woche ein Schiff. Der Rat zahlt gut für ihre Köpfe.', 'Wollt Ihr flussabwärts? Meine Schiffer fahren bis zur Steinbrücke vor der Reichsstadt.'] },
  { id: 'schreiber', name: 'Stadtschreiber Konrad Lehmann', role: 'Aufträge', hub: 'speyer', at: gNear(4846, 1512), quest: true,
    greet: ['Speyer ist eine freie Reichsstadt, und das Reichskammergericht sitzt in unseren Mauern. Ordnung ist hier Pflicht.', 'Der Rat braucht einen Ritter, der mehr kann als Wein trinken. Seid Ihr so einer?', 'Ich führe die Bücher der Stadt, und darin steht viel Unglück: Piraten, Nöcke, Landsknechte.'] },
  { id: 'kraemerin2', name: 'Krämerin Barbara', role: 'Händlerin', hub: 'speyer', at: gNear(4834, 1340), shop: true,
    greet: ['Heiltränke aus der Apotheke am Dom, und ich kaufe, was Ihr draußen erbeutet.', 'Wein aus der Pfalz habe ich nicht, dafür alles andere.'] },
  { id: 'reichsherold', name: 'Reichsherold Jörg Rugen', role: 'Ehre und Wochenprüfungen', hub: 'speyer', at: gNear(4986, 1344), ehre: true,
    greet: ['Ich verzeichne die Taten der Ritter in den Wappenbüchern des Reiches.', 'Wer die Prüfungen des Reiches besteht, dessen Name wird in ganz Deutschland genannt.', 'Ein Kaiser ist Ihr schon? Dann zeigt, was ein Kaiser noch lernen kann.'] },
  { id: 'fischer', name: 'Fischer Nikolaus', role: 'Fischer', hub: 'fischerdorf', at: gNear(4440, 1614), fish: true, ferry: 'altrip',
    greet: ['Der Rhein gibt jedem etwas, man muss nur Geduld haben. Und eine gute Angel.', 'Im Frühjahr und im Herbst ziehen die Salme den Strom hinauf. Dann ist hier Leben!', 'Nachts beißen die Aale. Und manchmal etwas Größeres, das man lieber nicht am Haken hätte.'] },
  { id: 'faehrmann', name: 'Fährmann Veit', role: 'Überfahrt', hub: 'stadt', at: gNear(3070, 1842), ferry: 'stadt',
    greet: ['Den Fluss hinauf bis zum Rhein und nach Speyer, so weit wie mein Schiff fährt.', 'Zu Fuß ist es weit bis Speyer, mit dem Schiff ein Gebet und ein Lied.'] }
]){ n.x = n.at.x; n.y = n.at.y; n.art = NPC_ART[n.id]; n.key = n.id; NPCS.push(n); }
{ const sb = NPCS.find(n => n.id === 'schreiber'); if (sb) BIND.speyer = { x: sb.x, y: sb.y + 30 }; }

/* ---------- Aufträge des Stadtschreibers (Stufe 15 bis 20) ---------- */
for (const q of [
  { id: 's1', giver: 'schreiber', lvl: 15, kind: 'pluend', zone: 'weinberge', need: 8, t: 'Plünderer in den Weinbergen',
    d: 'Landsknechte auf dem Heimweg brechen die Kelterhäuser auf und saufen den Winzern die Fässer leer. Vertreibt acht von ihnen aus den Weinbergen.' },
  { id: 's2', giver: 'schreiber', lvl: 15, kind: 'armbrust', zone: 'weinberge', need: 6, t: 'Schützen zwischen den Reben', after: 's1',
    d: 'Zwischen den Rebzeilen lauern Armbrustschützen und schießen auf die Leser. Sechs müssen fallen, dann kann die Lese weitergehen.' },
  { id: 's3', giver: 'schreiber', lvl: 16, kind: 'rabe', zone: 'weinberge', need: 8, t: 'Raben über den Trauben', after: 's2',
    d: 'Ganze Schwärme fallen über die Trauben her. Acht Raben, und die Winzer schicken Euch ein Fass.' },
  { id: 's4', giver: 'schreiber', lvl: 16, kind: 'nix', zone: 'auwald', need: 6, t: 'Die Nöcke im Altwasser', after: 's1',
    d: 'Im Auwald ziehen Nöcke die Leute ins Wasser, Kinder wie Fuhrknechte. Erschlagt sechs von ihnen, aber nehmt Euch vor ihrem Griff in Acht.' },
  { id: 's5', giver: 'schreiber', lvl: 17, kind: 'werwolf', zone: 'auwald', need: 8, t: 'Wölfe im Auwald', after: 's4',
    d: 'Die Holzfäller im Auwald trauen sich nicht mehr hinaus. Acht Werwölfe soll es dort geben. Bringt ihre Zahl auf null.' },
  { id: 's6', giver: 'schreiber', lvl: 18, boss: 'wels', zone: 'auwald', need: 1, t: 'Der Waller', after: 's5',
    d: 'Im großen Altwasser haust ein Wels, so lang wie ein Kahn. Er hat schon zwei Fischer samt Boot verschlungen. Fangt ihn, mit dem Schwert statt mit der Angel.' },
  { id: 's7', giver: 'schreiber', lvl: 18, kind: 'pirat', zone: 'piratennest', need: 8, t: 'Flusspiraten', after: 's4',
    d: 'Von der Insel im Altarm überfallen Piraten unsere Schiffe. Geht über die Schiffbrücke und den Auweg zur Insel und erschlagt acht von ihnen.' },
  { id: 's8', giver: 'schreiber', lvl: 19, kind: 'pschuetze', zone: 'piratennest', need: 6, t: 'Schützen auf der Insel', after: 's7',
    d: 'Die Schützen des Rotbart schießen von der Insel auf jeden Treidelzug. Sechs von ihnen, dann ziehen die Pferde die Schiffe wieder.' },
  { id: 's9', giver: 'schreiber', lvl: 20, boss: 'rotbart', zone: 'piratennest', need: 1, t: 'Hinrich Rotbart', after: 's8',
    d: 'Hinrich Rotbart, der Hauptmann der Flusspiraten, sitzt an seinem Feuer auf der Insel und lacht über den Rat. Lasst ihn nicht länger lachen.' }
]){ QUESTS.push(q); QDEF[q.id] = q; }

/* ---------- Fischerei ---------- */
/* v Wert, cm Größe, wt Gewässer (1 Fluss und Strom, 2 Teich und Altwasser, 3 Moor, 4 Bach) */
const FISH = {
  rotauge:  { n: 'Rotauge', v: 3, cm: [14, 32], body: 'x', fin: 'R' },
  barsch:   { n: 'Flussbarsch', v: 5, cm: [16, 42], body: 'V', fin: 'R', bar: 'v' },
  schleie:  { n: 'Schleie', v: 6, cm: [22, 58], body: 'v', fin: 'v' },
  forelle:  { n: 'Bachforelle', v: 9, cm: [20, 52], body: 'y', fin: 'x', dot: 'R' },
  karpfen:  { n: 'Karpfen', v: 8, cm: [32, 88], body: 'h', fin: 'g' },
  zander:   { n: 'Zander', v: 11, cm: [38, 92], body: '2', fin: 'y', bar: '1' },
  hecht:    { n: 'Hecht', v: 13, cm: [42, 128], body: 'V', fin: 'v', dot: 'u', long: true, r: 1 },
  aal:      { n: 'Aal', v: 10, cm: [48, 112], body: 'm', fin: 'l', eel: true },
  lachs:    { n: 'Rheinsalm', v: 24, cm: [58, 118], body: '4', fin: '3', dot: '2', r: 1 },
  wels:     { n: 'Wels', v: 20, cm: [80, 230], body: 'y', fin: 'l', long: true, r: 1 },
  stoer:    { n: 'Stör', v: 70, cm: [120, 280], body: '3', fin: '2', long: true, r: 2 },
  stiefel:  { n: 'Alter Stiefel', v: 0, junk: true },
  muenze:   { n: 'Römische Münze', v: 45, junk: true, r: 2 }
};
const ROD_PRICE = 30;
function fishIcon(F){
  if (F === FISH.stiefel) return bi_icon(['................', '................', '.......lll......', '.......lmml.....', '.......lmml.....', '.......lmml.....', '.......lmml.....', '.......lmml.....',
    '.......lmmlll...', '......lmmmmmmll.', '......lmmmmmmml.', '......llllllll..', '................', '...v...u........', '..v.v.u.........', '................']);
  if (F === FISH.muenze) return bi_icon(['................', '................', '.....hhhhhh.....', '....hiiiiiih....', '...hijjjjjjih...', '...hij.ii.jih...', '...hijiiiijih...', '...hijiiiijih...',
    '...hij.ii.jih...', '...hijjjjjjih...', '....hiiiiiih....', '.....hhhhhh.....', '................', '................', '................', '................']);
  const rows = F.eel ? ['................', '................', '................', '................', '................', '.............B..', '...........BBBB.', '.BB......BBBBwBB',
    'BBBBB..BBBBBBBB.', '.LLLLBBBLLLLLL..', '...LLLLLL.......', '................', '................', '................', '................', '................']
    : F.long ? ['................', '................', '................', '................', '...........F....', '.F....BBBBBBF...', 'FFBBBBBBBBBBBBB.', '.FBBBBBBBBBBBwBB',
    'FFLLLLLLLLLLLLL.', '.F..LLLLLLLLL...', '.......F.F......', '................', '................', '................', '................', '................']
    : ['................', '................', '................', '................', '........F.......', '.......FFF......', '.F...BBBBBBB....', 'FF.BBBBBBBBBBB..',
    'FFBBBBBBBBBBwBB.', 'FFLLLLLLLLLLLL..', '.F.LLLLLLLLL....', '......F.FF......', '................', '................', '................', '................'];
  return bi_icon(rows.map((r, y) => r.split('').map((c, x) => {
    if (c === 'B'){ if (F.bar && x % 3 === 0) return F.bar; if (F.dot && (x * 7 + y * 3) % 5 === 0) return F.dot; return F.body; }
    if (c === 'L') return F.long || F.eel ? 'x' : '4';
    if (c === 'F') return F.fin;
    return c;
  }).join('')));
}
for (const [id, F] of Object.entries(FISH)){
  WARES['f_' + id] = { n: F.n, v: F.v, r: F.r || 0, wirt: !F.junk, fish: true };
  WARE_ICON['f_' + id] = fishIcon(F);
}
const FISH_W = { 1: 'Fluss', 2: 'Teich', 3: 'Moor', 4: 'Bach' };
function fishTable(wt, gx){
  const strom = gx / WS > 4096, night = isNight(), sea = SEA.cur, L = [];
  if (wt === 1){
    L.push(['rotauge', 30], ['barsch', 22], ['zander', 10], ['hecht', 7], ['aal', night ? 18 : 3], ['stiefel', 5], ['muenze', .6]);
    if (strom) L.push(['lachs', sea === 0 || sea === 2 ? 10 : 2], ['wels', night ? 6 : 2], ['stoer', .8]);
  } else if (wt === 2) L.push(['karpfen', 24], ['schleie', 20], ['rotauge', 16], ['hecht', 7], ['stiefel', 4], ['aal', night ? 6 : 1], ['wels', strom ? 3 : 0], ['muenze', .4]);
  else if (wt === 3) L.push(['schleie', 26], ['aal', night ? 14 : 5], ['stiefel', 9], ['muenze', .5]);
  else L.push(['forelle', 36], ['rotauge', 10], ['barsch', 8], ['stiefel', 3]);
  return L.filter(e => e[1] > 0);
}
function rollFish(wt, gx){
  const L = fishTable(wt, gx), sum = L.reduce((a, e) => a + e[1], 0);
  let r = Math.random() * sum;
  for (const [id, w] of L){ r -= w; if (r <= 0) return id; }
  return L[0][0];
}
/* Wasser vor dem Ritter: Punkt in Blickrichtung, 20 bis 70 Weltpixel weit */
function waterAhead(k){
  const d = DIRV[k.dir] || [1, 0];
  for (let s = 20; s <= 70; s += 6){
    const wx = (k.x + d[0] * s * WS) / WS, wy = (k.y - 4 + d[1] * s * WS) / WS;
    if (wo_wsd(wx, wy) < -4){ const wt = wo_WT[wo_gidx(wx, wy)]; return { x: wx * WS, y: wy * WS, wt: wt || 1 }; }
  }
  return null;
}
const canFish = () => HERO && HERO.rod && G.mode === 'play' && !G.inside && !DG_ON && !G.joust && !G.fgame && !riding() && G.knight.hp > 0;
function startFish(){
  const k = G.knight, w = waterAhead(k);
  if (!w || !canFish()) return false;
  if (G.combatT < 4){ floatText(k.x, k.y - KS.ay - 4, 'Nicht im Kampf', '#d8c69c'); return true; }
  G.fish = { st: 'wait', t: rand(2.5, 7) * (SEA.cur === 3 ? 1.5 : 1), x: w.x, y: w.y, wt: w.wt, kx: k.x, ky: k.y, a: 0 };
  Sound.plop(); keys.clear();
  if (!HERO.fishTip){ HERO.fishTip = true; logLine('Die Angel ist ausgeworfen. Taucht der Schwimmer unter, schnell ' + (touchUI() ? '„Anschlagen“ tippen' : 'E drücken') + '! Wer sich bewegt, holt die Schnur ein.', '#ffd98a'); }
  updateNear(true);
  return true;
}
function stopFish(msg){
  if (!G.fish) return;
  G.fish = null;
  if (msg) logLine(msg, '#d8c69c');
  updateNear(true);
}
function fishAct(){
  const F = G.fish; if (!F) return;
  if (F.st !== 'bite'){ Sound.reel(); stopFish('Ihr holt die Schnur ein.'); return; }
  const id = rollFish(F.wt, F.x), D = FISH[id], it = makeWare('f_' + id);
  const free = HERO.inv.findIndex(x => x && x.s === 'ware' && x.w === it.w && (x.q || 1) < WARE_MAX), empty = HERO.inv.indexOf(null);
  if (free < 0 && empty < 0){ stopFish('Euer Rucksack ist voll. Der Fang springt zurück ins Wasser.'); return; }
  if (free >= 0) HERO.inv[free].q = (HERO.inv[free].q || 1) + 1; else HERO.inv[empty] = it;
  Sound.reel(); Sound.coin();
  const k = G.knight;
  HERO.fb = HERO.fb || {};
  let txt = D.n;
  if (!D.junk){
    const cm = Math.round(D.cm[0] + Math.pow(Math.random(), 1.8) * (D.cm[1] - D.cm[0]));
    const rec = cm > (HERO.fb[id] || 0);
    if (!HERO.fb[id]) logLine('Neu im Fischbuch: ' + D.n + '.', '#ffd98a');
    if (rec) HERO.fb[id] = cm;
    txt += ', ' + cm + ' cm' + (rec && HERO.fb[id] === cm ? ' (Bestmaß)' : '');
    gainXp(Math.round((4 + HERO.lvl * 1.2) * (D.r ? 1 + D.r : 1)));
  } else if (id === 'muenze'){ HERO.fb.muenze = (HERO.fb.muenze || 0) + 1; }
  HERO.fished = (HERO.fished || 0) + 1;
  floatText(k.x, k.y - KS.ay - 6, txt, D.r ? '#ffd98a' : '#e8dcbc');
  logLine('Gefangen: ' + txt + '.', D.r ? '#ffd98a' : '#e8dcbc');
  if (typeof ehOnFish === 'function') ehOnFish(id);
  burst(F.x, F.y, ['#cfe0e0', '#9fb8b6', '#ffffff'], 10, 60);
  // gleich wieder auswerfen
  F.st = 'wait'; F.t = rand(2.5, 7) * (SEA.cur === 3 ? 1.5 : 1); F.a = 0;
  updateHud(); markDirty();
  updateNear(true);
}
function fishTick(dt){
  const F = G.fish; if (!F) return;
  const k = G.knight;
  if (!canFish() || Math.hypot(k.x - F.kx, k.y - F.ky) > 8 || k.atkT > 0 || G.combatT < .5){ stopFish(G.combatT < .5 ? 'Ein Angriff! Die Angel fällt Euch aus der Hand.' : 'Ihr holt die Schnur ein.'); return; }
  F.t -= dt; F.a += dt;
  if (F.st === 'wait' && F.t <= 0){ F.st = 'bite'; F.t = FISH_BITE; Sound.bite(); updateNear(true); }
  else if (F.st === 'bite' && F.t <= 0){ F.st = 'wait'; F.t = rand(3, 8); logLine('Der Fisch hat den Köder genommen und ist fort.', '#d8c69c'); updateNear(true); }
}
const FISH_BITE = .9;
function fishList(cam, list){
  const F = G.fish; if (!F) return;
  const k = G.knight, d = DIRV[k.dir] || [1, 0];
  const hx = k.x + d[0] * 12 + (d[1] ? 8 : 0), hy = k.y - 30 + (d[1] < 0 ? -6 : 0);
  const bob = F.st === 'bite' ? 3 + Math.round(Math.sin(F.a * 30)) : Math.round(Math.sin(F.a * 3) * 1);
  list.push({ y: Math.max(k.y + 1, F.y), d: () => {
    // Schnur in leichtem Bogen
    ctx.fillStyle = 'rgba(230,226,210,.75)';
    for (let i = 0; i <= 24; i++){ const t = i / 24, x = hx + (F.x - hx) * t, y = hy + (F.y - 2 + bob - hy) * t + Math.sin(t * Math.PI) * 10; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    // Schwimmer: rot und weiß, beim Biss halb unter Wasser, mit Ringen
    const bx = Math.round(F.x), by = Math.round(F.y + bob);
    if (F.st === 'bite'){ ctx.fillStyle = 'rgba(220,235,235,.7)'; const r = 4 + (F.a * 14 % 6); for (let a = 0; a < 6.28; a += .35) ctx.fillRect(Math.round(F.x + Math.cos(a) * r * 1.6), Math.round(F.y + 2 + Math.sin(a) * r * .6), 1, 1); }
    ctx.fillStyle = OUT; ctx.fillRect(bx - 2, by - 5, 4, 7);
    ctx.fillStyle = '#e8e2d0'; ctx.fillRect(bx - 1, by - 1, 2, 2);
    if (F.st !== 'bite'){ ctx.fillStyle = '#c8343c'; ctx.fillRect(bx - 1, by - 4, 2, 3); }
    ctx.fillStyle = 'rgba(210,228,228,.55)'; ctx.fillRect(bx - 4, by + 2, 8, 1);
    if (F.st === 'bite') drawText('!', bx, by - 18, '#ffd541');
  } });
}

/* ---------- Schiffsreise zwischen Reichsstadt, Altrip und Speyer ---------- */
const FERRY = {
  stadt: { name: 'Reichsstadt (Steinbrücke)', npc: 'faehrmann' },
  altrip: { name: 'Fischerdorf Altrip', npc: 'fischer' },
  speyer: { name: 'Speyer (Hafen)', npc: 'hafenmeister' }
};
const FERRY_COST = { 'stadt-altrip': 14, 'stadt-speyer': 18, 'altrip-speyer': 4 };
const ferryCost = (a, b) => Math.round((FERRY_COST[[a, b].sort().join('-')] || 10) * (1 + HERO.lvl * .12));
function ferryTo(from, to){
  const n = NPCS.find(q => q.id === FERRY[to].npc), cost = ferryCost(from, to);
  if (!n || HERO.gold < cost) return;
  HERO.gold -= cost; closePanel();
  Sound.oar(); Sound.coin();
  const k = G.knight, p = gNear(n.x / WS + 18, n.y / WS + 10);
  k.x = p.x; k.y = p.y; k.dir = 'down';
  stopFish(); G.flash = .6;
  showBanner('Überfahrt', FERRY[to].name);
  logLine('Das Schiff legt an: ' + FERRY[to].name + '. Die Fahrt kostete ' + cost + ' Gulden.', '#9fe08a');
  updateHud(); sendPresence(true); markDirty(true);
}

/* ---------- Gesprächsoptionen und Ansichten ---------- */
function strTalkOpts(n, opts){
  if (n.fish){
    if (!HERO.rod){ const b = btn('Eine Angel kaufen (' + ROD_PRICE + ' Gulden)', () => { if (HERO.gold < ROD_PRICE) return; HERO.gold -= ROD_PRICE; HERO.rod = true; Sound.coin(); logLine('Ihr kauft eine Angel aus Haselholz mit Rosshaarschnur. Stellt Euch ans Wasser, schaut hinüber und drückt ' + (touchUI() ? '„Angeln“' : 'E') + '.', '#ffd98a'); updateHud(); markDirty(true); renderTalk('main'); }, 'opt'); b.disabled = HERO.gold < ROD_PRICE; opts.append(b); }
    const fish = HERO.inv.filter(it => it && it.s === 'ware' && WARES[it.w].fish);
    if (fish.length) opts.append(btn('Fang verkaufen (' + fish.reduce((a, it) => a + (it.q || 1), 0) + ' Stück für ' + fish.reduce((a, it) => a + Math.round(itemValue(it) * 1.3), 0) + ' Gulden)', () => { sellFish(1.3); renderTalk('main'); }, 'opt'));
    opts.append(btn('Das Fischbuch', () => renderTalk('strFisch'), 'opt'));
  }
  if (n.ferry) for (const to of Object.keys(FERRY)) if (to !== n.ferry){
    const c = ferryCost(n.ferry, to), b = btn('Mit dem Schiff nach ' + FERRY[to].name + ' (' + c + ' Gulden)', () => ferryTo(n.ferry, to), 'opt');
    b.disabled = HERO.gold < c || G.combatT < 4; opts.append(b);
  }
}
function sellFish(mul){
  let sum = 0;
  for (let i = 0; i < HERO.inv.length; i++){ const it = HERO.inv[i]; if (it && it.s === 'ware' && WARES[it.w].fish){ sum += Math.round(itemValue(it) * mul); HERO.inv[i] = null; } }
  if (!sum) return;
  HERO.gold += sum; Sound.coin(); logLine('Ihr verkauft Euren Fang für ' + sum + ' Gulden.', '#ffd98a');
  updateHud(); markDirty(true);
}
function strView(view, body, opts){
  if (view === 'strFisch'){
    const fb = HERO.fb || {};
    $('talkText').textContent = 'Jeder Fisch, den Ihr fangt, steht im Fischbuch, mit dem größten Maß. ' + (HERO.fished ? 'Bisher habt Ihr ' + HERO.fished + ' Mal etwas aus dem Wasser gezogen.' : 'Noch habt Ihr nichts gefangen.');
    for (const [id, F] of Object.entries(FISH)){
      if (F.junk && id === 'stiefel') continue;
      const r = el('div', 'shoprow'), ic = el('img'), got = fb[id];
      ic.src = urlOf(WARE_ICON['f_' + id], 3); ic.alt = ''; if (!got) ic.style.filter = 'brightness(0) opacity(.45)';
      const t = el('div', 'stx');
      t.append(el('b', null, got ? F.n : '???'), el('small', null, id === 'muenze' ? (got ? got + ' gefunden' : 'manchmal liegt etwas Altes im Schlamm') : got ? 'Bestmaß ' + got + ' cm · Wert ' + F.v + ' Gulden' : fishHint(id)));
      r.append(ic, t); body.append(r);
    }
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn')); body.append(opts);
  }
}
function fishHint(id){
  return { rotauge: 'überall im Fluss', barsch: 'im Fluss und im Rhein', schleie: 'in Teichen und im Moor', forelle: 'im Mühlbach', karpfen: 'in Teichen und Altwassern', zander: 'im Fluss, eher selten',
    hecht: 'Räuber im Fluss und in Teichen', aal: 'nachts im Fluss und im Moor', lachs: 'im Rhein, im Frühling und im Herbst', wels: 'im Rhein und im Altwasser, nachts', stoer: 'im Rhein, sehr selten' }[id] || '';
}
function strHero(h){
  h.rod = !!h.rod; h.fishTip = !!h.fishTip; h.fished = Math.max(0, h.fished | 0);
  const fb = {}; if (h.fb && typeof h.fb === 'object') for (const id in FISH) if (+h.fb[id] > 0) fb[id] = Math.min(400, Math.round(+h.fb[id])); h.fb = fb;
}
