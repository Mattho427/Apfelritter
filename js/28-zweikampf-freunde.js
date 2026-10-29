"use strict";
/* Der Apfelritter, Teil 28 von 29: Mehr Spiel mit anderen Rittern: Zweikampf zu Fuß, Gesten, Flüstern, Freunde, die Ritter im Land und Gesuche.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */

/* ============ Zweikampf zu Fuß (Version 32) ============
   Zwei Ritter fechten in einem Kreis aus Seil und Wimpeln, bis einer am Boden liegt, aufgibt oder zwei Minuten um sind. Es geht um die
   Ehre, nicht ums Leben: Jeder hat für den Kampf einen eigenen Vorrat (dreimal sein volles Leben), das echte Leben bleibt, wie es ist.
   Wie beim gemeinsamen Kampf rechnet jede Seite nur für sich: Schwingt der Gegner und steht man im Hieb (oder im Bolzen), zieht man sich
   den Schaden selbst ab, mit eigener Rüstung und eigenem Schild. In der Anwesenheit (zk) steht der eigene Vorrat. Wer fertig ist (am Boden,
   aufgegeben, Zeit um), meldet seinen letzten Stand, und sobald beide fertig sind, vergleichen beide Seiten dieselben zwei Zahlen. */
ASK.zk = { ask: 'Ihr fordert % zum Zweikampf.', them: '% fordert Euch zum ritterlichen Zweikampf zu Fuß.' };
const ZK_T = 120, ZK_R = 230, ZK_NEAR = 200, ZK_PTS = 5, ZK_DAY = 5, ZK_POOL = 3;   // Vorrat: dreimal das volle Leben, damit ein Gang eine Weile dauert
const zkOn = () => !!(NET.zk && !NET.zk.end);
const zkFoe = q => !!(q && NET.zk && !NET.zk.end && NET.zk.w === q.peer);
const zkFrac = z => clamp(+z.h || 0, 0, 1e6) / clamp(+z.mx || 1, 1, 1e6);
function zkStart(q, id, asker){
  if (G.mode === 'menu') closePanel();
  if (G.mode !== 'play' || G.inside || DG_ON || G.joust || G.fgame){ logLine('Der Zweikampf kann jetzt nicht beginnen.', '#d8c69c'); return; }
  dismount('Zum Zweikampf sitzt Ihr ab.');
  const k = G.knight, mx = Math.max(1, Math.round(ST.hp * ZK_POOL));
  HERO.zk = HERO.zk || { e: 1000, w: 0, l: 0, d: 0 };
  NET.zk = { id, w: q.peer, nm: q.nm, h: mx, mx, cx: (k.x + q.x) / 2, cy: (k.y + q.y) / 2, t0: nowS(), seen: nowS(), end: 0, done: 0, oh: null, hitSw: q.sw, sec: 0, asker };
  showBanner('Zweikampf', HERO.name + ' gegen ' + q.nm); Sound.horn();
  logLine('Der Zweikampf gegen ' + q.nm + ' beginnt! Gefochten wird im Kreis, bis einer am Boden liegt oder aufgibt, längstens zwei Minuten. Um Euer Leben geht es nicht.', '#ffd98a');
  renderTracker(); sendPresence(true);
}
function zkPres(){ const Z = NET.zk; return { id: Z.id, w: Z.w, h: Math.round(Z.h), mx: Z.mx, e: HERO.zk ? HERO.zk.e : 1000, end: Z.end ? 1 : 0 }; }
function zkTheirs(){ const Z = NET.zk, q = Z && PEERS.get(Z.w), z = q && q.zk; return z && z.id === Z.id && z.w === NET.me ? z : null; }
/* jeden Schritt: zu Fuß und im Kreis bleiben, vom Hieb des Gegners getroffen? */
function zkFrame(){
  const Z = NET.zk, k = G.knight;
  if (!Z || Z.end || G.mode !== 'play') return;
  if (HERO.riding) dismount('Ein Zweikampf zu Fuß!');
  const dx = k.x - Z.cx, dy = k.y - Z.cy, d = Math.hypot(dx, dy);
  if (d > ZK_R){ const nx = Z.cx + dx / d * ZK_R, ny = Z.cy + dy / d * ZK_R; if (!blocked(nx, ny)){ k.x = nx; k.y = ny; } k.kbx = 0; k.kby = 0; }
  const q = PEERS.get(Z.w);
  if (q && !q.dead && q.atkT > 0 && q.wt !== 'armbrust' && Z.hitSw !== q.sw && k.inv <= 0 && inSwing(q, k.x, k.y - KBODY, 12)){
    Z.hitSw = q.sw;
    const crit = Math.random() * 100 < q.cb[1];
    zkHurt(q, q.cb[0] * q.mult * (crit ? 1.75 : 1), false, crit);
  }
}
/* Bolzen des Gegners (aus kbTick, Teil 29) */
function zkBolt(b){
  const Z = NET.zk, k = G.knight;
  if (!Z || Z.end || b.own || !b.src || b.src.peer !== Z.w || b.hit.has(k) || k.inv > 0 || G.mode !== 'play') return false;
  if (Math.hypot(k.x - b.x, k.y - KBODY - b.y) > 14) return false;
  b.hit.add(k);
  const cb = b.src.cb || [5, 5], crit = Math.random() * 100 < cb[1];
  zkHurt(b.src, cb[0] * b.mult * (crit ? 1.75 : 1), true, crit);
  return true;
}
function zkHurt(from, raw, ranged, crit){
  const Z = NET.zk, k = G.knight;
  let block = false;
  if (!ranged && HERO.eq.schild){ const [fx, fy] = DIRV[k.dir]; if ((from.x - k.x) * fx + (from.y - k.y) * fy > 0 && Math.random() * 100 < ST.block) block = true; }
  const n = Math.max(1, Math.round(raw * (1 - ST.mit) * rand(.9, 1.1) * (block ? .25 : 1)));
  Z.h = Math.max(0, Z.h - n); k.inv = .55; G.shake = .2; G.combatT = 0;
  floatText(k.x + rand(-4, 4), k.y - KS.ay + 2, '-' + n, crit ? '#ffb040' : '#ff5a5a', 1);
  if (block){ floatText(k.x, k.y - KS.ay - 6, 'abgewehrt', '#d8dee8'); Sound.parry(); } else Sound.hurt();
  const dx = k.x - from.x, dy = k.y - from.y, l = Math.hypot(dx, dy) || 1; k.kbx = dx / l * (block ? 50 : 100); k.kby = dy / l * (block ? 50 : 100);
  burst(k.x, k.y - KBODY, ['#d4d8de', '#f0e6c8', '#c8343c'], block ? 5 : 10, 80);
  if (Z.h <= 0){ floatText(k.x, k.y - KS.ay - 18, 'Am Boden!', '#ff9a8a', 2, 1.4); zkStop(null, true); }
  else { renderTracker(); sendPresence(true); }
}
/* fertig: am Boden, aufgegeben oder Zeit um; der letzte Stand steht fest */
function zkStop(msg, lost){
  const Z = NET.zk; if (!Z || Z.end) return;
  if (lost) Z.h = 0;
  Z.h = Math.round(Z.h); Z.end = 1; Z.endT = nowS();
  if (msg) logLine(msg, '#d8c69c');
  renderTracker(); sendPresence(true);
}
function zkGiveUp(){ if (zkOn()){ zkStop('Ihr gebt den Zweikampf verloren.', true); Sound.choose(); } }
function zkTick(t){
  const Z = NET.zk, q = PEERS.get(Z.w), th = zkTheirs();
  if (Z.done){ if (t - Z.doneT > 6){ NET.zk = null; renderTracker(); sendPresence(true); } return; }
  if (th){
    Z.seen = t;
    const oh = clamp(+th.h || 0, 0, 1e6);
    if (Z.oh != null && oh < Z.oh && q){ floatText(q.x + rand(-4, 4), q.y - KS.ay + 2, '-' + Math.round(Z.oh - oh), '#ffe08a', 1); Sound.hit(); burst(q.x, q.y - KBODY, ['#d4d8de', '#f0e6c8'], 8, 70); }
    if (oh !== Z.oh){ Z.oh = oh; renderTracker(); }
  } else if (t - Z.seen > 5 && t - Z.t0 > 6){ zkDone(null, (q ? q.nm : Z.nm) + ' ist fort. Der Zweikampf endet ohne Sieger.'); return; }
  if (!Z.end){
    if (t - Z.t0 > ZK_T) zkStop('Die Zeit ist um. Wer mehr Kraft übrig hat, gewinnt.');
    else if (G.mode === 'dying' || G.mode === 'dead' || G.inside || DG_ON || G.joust || G.fgame) zkStop('Ihr verlasst den Kampfplatz und gebt den Zweikampf verloren.', true);
    else if (th && th.end) zkStop();
  }
  if (Z.end && th && th.end) return zkResult(th);
  if (Z.end && t - Z.endT > 10){ zkDone(null, 'Der Zweikampf endet ohne Sieger.'); return; }
  const sec = Math.ceil(Math.max(0, ZK_T - (t - Z.t0)));
  if (sec !== Z.sec){ Z.sec = sec; renderTracker(); }
}
function zkResult(th){
  const Z = NET.zk, a = Z.h / Z.mx, b = zkFrac(th), res = a > b ? 1 : a < b ? 0 : .5, nm = Z.nm;
  const H = HERO.zk = HERO.zk || { e: 1000, w: 0, l: 0, d: 0 };
  const eOp = clamp(+th.e || 1000, 100, 3000), exp = 1 / (1 + Math.pow(10, (eOp - H.e) / 400));
  H.e = clamp(Math.round(H.e + 32 * (res - exp)), 100, 3000);
  if (res === 1){
    H.w++;
    const day = hbDay(); if (!HERO.zkd || HERO.zkd.d !== day) HERO.zkd = { d: day, n: 0 };
    let extra = '';
    if (HERO.zkd.n < ZK_DAY){ HERO.zkd.n++; const g = 10 + HERO.lvl * 2; HERO.gold += g; lwAdd(ZK_PTS); extra = ' Ehrensold: ' + g + ' Gulden, +' + ZK_PTS + ' Punkte für ' + lwIn(HERO.f) + ' im Wettstreit.'; }
    showBanner('Sieg im Zweikampf', 'gegen ' + nm); Sound.levelUp(); Sound.cheer(.6);
    logLine('Ihr besiegt ' + nm + ' im Zweikampf!' + extra + ' Wertung im Zweikampf: ' + H.e + '.', '#ffd98a');
  } else if (res === 0){
    H.l++; showBanner('Niederlage im Zweikampf', nm + ' bleibt Sieger'); Sound.tone(180, .3, 'triangle', .04, -60);
    logLine(nm + ' besiegt Euch im Zweikampf. Wertung im Zweikampf: ' + H.e + '.', '#d8c69c');
  } else {
    H.d++; showBanner('Unentschieden', 'Zweikampf gegen ' + nm);
    logLine('Der Zweikampf gegen ' + nm + ' endet unentschieden. Wertung im Zweikampf: ' + H.e + '.', '#d8c69c');
  }
  zkDone(res);
  updateHud(); pushFame(); markDirty(true);
}
function zkDone(res, msg){
  const Z = NET.zk; if (!Z) return;
  if (msg){ logLine(msg, '#d8c69c'); showBanner('Zweikampf', 'ohne Sieger'); }
  Z.end = 1; Z.done = 1; Z.doneT = nowS(); Z.res = res;
  renderTracker(); sendPresence(true);
}
/* Zeilen oben links */
function zkRows(box){
  const Z = NET.zk; if (!Z) return;
  const p = el('p', 'ev');
  if (Z.done){ p.append(el('b', null, 'Zweikampf: '), Z.res === 1 ? 'gewonnen' : Z.res === 0 ? 'verloren' : Z.res === .5 ? 'unentschieden' : 'ohne Sieger'); box.append(p); return; }
  const left = Math.max(0, ZK_T - (nowS() - Z.t0));
  p.append(el('b', null, 'Zweikampf gegen ' + Z.nm), ' ' + Math.floor(left / 60) + ':' + String(Math.floor(left % 60)).padStart(2, '0'));
  box.append(p);
  const th = zkTheirs(), q = el('p', 'ev');
  q.append(el('span', null, 'Ihr ' + Math.round(Z.h / Z.mx * 100) + ' % · ' + Z.nm + ' ' + (th ? Math.round(zkFrac(th) * 100) : 100) + ' %' + (Z.end ? ' · warte …' : '')));
  box.append(q);
}
/* der Kreis: Seil mit roten und hellen Gliedern am Boden, vier Pfähle mit Wimpeln */
function zkRing(cam){
  const Z = NET.zk; if (!Z || Z.done || G.inside || DG_ON || !inView(Z.cx, Z.cy, cam, ZK_R + 40)) return;
  const n = 180, pts = [];
  for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2; pts.push([Math.round(Z.cx + Math.cos(a) * ZK_R), Math.round(Z.cy + Math.sin(a) * ZK_R)]); }
  ctx.fillStyle = 'rgba(18,16,22,.3)'; for (const [x, y] of pts) ctx.fillRect(x - 4, y + 2, 9, 2);
  ctx.fillStyle = OUT; for (const [x, y] of pts) ctx.fillRect(x - 4, y - 2, 9, 5);
  pts.forEach(([x, y], i) => { ctx.fillStyle = i % 6 < 3 ? '#b8281e' : '#e8dcbc'; ctx.fillRect(x - 3, y - 1, 7, 3); });
}
const ZK_POLE = (() => { const c = canvasOf(16, 34), g = c.getContext('2d');
  g.fillStyle = OUT; g.fillRect(1, 1, 4, 33); g.fillRect(4, 1, 12, 9);
  g.fillStyle = '#8a6a44'; g.fillRect(2, 2, 2, 31); g.fillStyle = '#b0905e'; g.fillRect(2, 2, 1, 31);
  g.fillStyle = '#b8281e'; g.fillRect(5, 2, 10, 7); g.fillStyle = '#e8dcbc'; g.fillRect(5, 4, 10, 3);
  return c; })();
function olList(cam, list){
  const Z = NET.zk;
  if (Z && !Z.done && !G.inside && !DG_ON && inView(Z.cx, Z.cy, cam, ZK_R + 40))
    for (let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + Math.PI / 4, x = Math.round(Z.cx + Math.cos(a) * ZK_R), y = Math.round(Z.cy + Math.sin(a) * ZK_R); list.push({ y, d: () => ctx.drawImage(ZK_POLE, x - 3, y - 33) }); }
}
/* über den Köpfen: Vorrat im Zweikampf (auch für Zuschauer), am Boden die Gesuche */
function olDraw(cam, k){
  // über dem eigenen Helm; bei Mitspielern unter dem Namen (wo sonst das Leben der Gefährten steht, Gefährten darunter)
  const bar = (o, f, up) => { const x0 = Math.round(o.x - 16), y0 = Math.round(o.y - KS.ay - up + (o === k ? -6 : inParty(o) ? 2 : -3)); ctx.fillStyle = OUT; ctx.fillRect(x0, y0, 32, 5); ctx.fillStyle = '#3a1416'; ctx.fillRect(x0 + 1, y0 + 1, 30, 3); ctx.fillStyle = '#f0b040'; ctx.fillRect(x0 + 1, y0 + 1, Math.round(30 * clamp(f, 0, 1)), 3); };
  const Z = NET.zk;
  if (Z && !Z.done && !G.inside) bar(k, Z.h / Z.mx, 0);
  for (const p of PEERS.values()){
    if (p.in || !inView(p.x, p.y, cam, 20)) continue;
    const z = p.zk, up = p.ride ? 15 : 0;
    if (z && !z.end) bar(p, zkFrac(z), up);
    if (p.gs && GS[p.gs]) drawText(GS[p.gs].s, p.x, p.y + 12, '#ffd98a');
  }
}

/* ============ Gesten ============
   Wer eine Geste macht, zählt in der Anwesenheit (ge) mit; die anderen sehen eine neue Zahl, eine Sprechblase und eine kleine Bewegung. */
const GE = {
  verneigen: { er: 'verneigt sich', ihr: 'Ihr verneigt Euch', n: 'Verneigen', t: 1.4 },
  gruessen: { er: 'grüßt mit dem Schwert', ihr: 'Ihr grüßt mit dem Schwert', n: 'Schwertgruß', t: 1.4 },
  winken: { er: 'winkt', ihr: 'Ihr winkt', n: 'Winken', t: 1.6 },
  jubeln: { er: 'jubelt', ihr: 'Ihr jubelt', n: 'Jubeln', t: 1.6 },
  knien: { er: 'kniet nieder', ihr: 'Ihr kniet nieder', n: 'Knien', t: 3 },
  tanzen: { er: 'tanzt', ihr: 'Ihr tanzt', n: 'Tanzen', t: 2.4 },
  lachen: { er: 'lacht', ihr: 'Ihr lacht', n: 'Lachen', t: 1.6 },
  drohen: { er: 'droht mit der Faust', ihr: 'Ihr droht mit der Faust', n: 'Drohen', t: 1.4 }
};
const GE_CMD = { verneigen: 'verneigen', verbeugen: 'verneigen', gruessen: 'gruessen', 'grüßen': 'gruessen', salutieren: 'gruessen', winken: 'winken', jubeln: 'jubeln', knien: 'knien', tanzen: 'tanzen', lachen: 'lachen', drohen: 'drohen' };
function geDo(k){
  if (!GE[k] || !HERO || (G.mode !== 'play' && G.mode !== 'menu')) return;
  if (G.mode === 'menu') closePanel();
  NET.ge = { k, n: ((NET.ge && NET.ge.n) | 0) + 1 };
  geShow(G.knight, k);
  G.say = '*' + GE[k].er + '*'; G.sayT = nowS() + 2.5;
  logLine(GE[k].ihr + '.', '#c8b8a0');
  if (k === 'jubeln') Sound.cheer(.3); else Sound.choose();
  sendPresence(true);
}
function geShow(o, k){ o.geK = k; o.geT = nowS(); }
/* aus netRead: eine neue Geste eines Mitspielers (die beim ersten Sehen schon stand, zählt nicht) */
function geSeen(q, ge){
  const n = ge && GE[ge.k] && Number.isInteger(ge.n) ? ge.n : 0;
  if (q.geN === undefined){ q.geN = n; return; }
  if (!n || n === q.geN) return;
  q.geN = ge.n; geShow(q, ge.k);
  q.say = '*' + GE[ge.k].er + '*'; q.sayT = nowS() + 2.5;
  if (G && G.mode !== 'title' && samePlace(q) && peerDist(q) < 700) logLine(q.nm + ' ' + GE[ge.k].er + '.', '#c8b8a0');
}
function geOff(o){
  if (!o.geK || o.ride) return null;
  const t = nowS() - o.geT, d = GE[o.geK].t; if (t < 0 || t > d) return null;
  const dip = (v, s) => t < s ? 1 - t / s * (1 - v) : t > d - s ? 1 - (d - t) / s * (1 - v) : v;
  switch (o.geK){
    case 'verneigen': return { sy: dip(.9, .25) };
    case 'knien': return { sy: dip(.8, .3) };
    case 'jubeln': return { dy: -Math.abs(Math.sin(t * 9)) * 7 };
    case 'tanzen': return { dx: Math.sin(t * 7) * 4, dy: -Math.abs(Math.sin(t * 14)) * 3 };
    case 'lachen': return { dy: -Math.abs(Math.sin(t * 16)) * 1.5 };
    case 'winken': case 'drohen': return { dx: Math.sin(t * 16) };
    default: return null;
  }
}
/* den Ritter mit seiner Geste zeichnen: gestaucht (verneigen, knien) oder gehüpft (jubeln, tanzen), die Füße bleiben am Boden */
function geWrap(o, fn){
  const f = geOff(o);
  if (!f){ fn(); return; }
  const x = Math.round(o.x), y = Math.round(o.y);
  ctx.save(); ctx.translate(x + Math.round(f.dx || 0), y + Math.round(f.dy || 0)); if (f.sy) ctx.scale(1, f.sy); ctx.translate(-x, -y);
  fn(); ctx.restore();
}

/* ============ Flüstern, Befehle im Gespräch ============
   „/w Name Nachricht“ geht nur an diesen Ritter (die anderen zeigen sie nicht an), „/r Nachricht“ antwortet dem, der zuletzt geflüstert hat.
   Gesten gehen auch als Befehl („/verneigen“), „/aufgeben“ beendet einen Zweikampf, „/ritter“ öffnet die Liste der Ritter im Land. */
function olCommand(text){
  const m = /^\/(\S+)\s*([\s\S]*)$/.exec(text); if (!m) return false;
  const c = m[1].toLowerCase(), rest = m[2];
  if (GE_CMD[c]){ geDo(GE_CMD[c]); return true; }
  if (c === 'w' || c === 'f' || c === 'flüstern' || c === 'fluestern'){ olWhisperTo(rest); return true; }
  if (c === 'r' || c === 'antworten'){
    const q = NET.wl && PEERS.get(NET.wl);
    if (!NET.wl) logLine('Niemand hat Euch etwas zugeflüstert.', '#d8c69c'); else if (!q) logLine('Der Ritter ist nicht mehr im Land.', '#d8c69c'); else olWhisper(q, rest);
    return true;
  }
  if (c === 'aufgeben'){ if (zkOn()) zkGiveUp(); else logLine('Ihr fechtet gerade keinen Zweikampf.', '#d8c69c'); return true; }
  if (c === 'ritter'){ openRitter(); return true; }
  return false;   // „/o“ und alles andere wie bisher
}
function olWhisperTo(s){
  const low = s.toLowerCase(), q = [...PEERS.values()].sort((a, b) => b.nm.length - a.nm.length).find(p => low.startsWith(p.nm.toLowerCase() + ' '));
  if (!q){ logLine('So flüstert Ihr: /w Name Nachricht, mit dem Namen eines Ritters, der gerade im Land ist.', '#d8c69c'); return; }
  olWhisper(q, s.slice(q.nm.length + 1));
}
function olWhisperLine(head, t){ const n = el('b', null, head); n.style.color = '#e8a8e0'; logLine('', '#f0d8ec', [n, t]); }
function olWhisper(q, t){
  t = cleanText(t, 120); if (!t) return;
  olWhisperLine('[an ' + q.nm + '] ' + HERO.name + ': ', t); Sound.chat();
  if (cloud.room && cloud.room.connected()) cloud.room.emit('chat', { nm: HERO.name, t, to: q.peer }).catch(() => {});
}
/* aus dem Gesprächsempfang (Teil 17) */
function olHeard(peer, nm, t){ NET.wl = peer; olWhisperLine('[flüstert] ' + nm + ': ', t); Sound.chat(); }
function olChatTo(q){ closePanel(); openChat(); $('chatIn').value = '/w ' + q.nm + ' '; }

/* ============ Freunde ============
   Gemerkt werden Name und Kennung (wenn der Raum sie nennt). Kommt ein Freund ins Land, steht es im Bericht; die Liste der Ritter im Land
   zeigt Freunde zuerst und darunter die, die gerade nicht da sind. */
const FR_MAX = 30;
const frList = () => HERO.frd || (HERO.frd = []);
const frFind = (by, nm) => HERO ? frList().findIndex(f => (by && f.id && f.id === by) || f.nm === nm) : -1;
const frIs = (by, nm) => frFind(by, nm) >= 0;
function frToggle(q){
  const L = frList(), i = frFind(q.by, q.nm);
  if (i >= 0){ L.splice(i, 1); logLine(q.nm + ' steht nicht mehr unter Euren Freunden.', '#d8c69c'); }
  else { if (L.length >= FR_MAX) L.shift(); L.push({ id: q.by || '', nm: q.nm, f: q.f, lv: q.lv, at: Date.now() }); logLine(q.nm + ' ist nun Euer Freund. Ihr erfahrt künftig, wenn ' + q.nm + ' ins Land kommt.', '#9fe08a'); Sound.choose(); }
  markDirty();
}

/* ============ Gesuche ============
   Wer Gefährten sucht, zeigt es in der Anwesenheit (gs); die anderen sehen es unter dem Ritter und in der Liste der Ritter im Land. */
const GS = {
  gruppe: { s: 'sucht Gruppe', l: 'sucht eine Gruppe' },
  kz: { s: 'sucht Kriegszug', l: 'sucht Gefährten für einen Kriegszug' },
  gw: { s: 'sucht Gewölbe', l: 'sucht Gefährten für ein Gewölbe' },
  ev: { s: 'sucht Mitstreiter', l: 'sucht Mitstreiter für das Weltereignis' },
  zk: { s: 'sucht Zweikampf', l: 'sucht einen Gegner zum Zweikampf' },
  handel: { s: 'will handeln', l: 'möchte handeln' },
  orden: { s: 'sucht Orden', l: 'sucht einen Ritterorden' }
};
function gsSet(k){
  NET.gs = GS[k] ? k : '';
  logLine(NET.gs ? 'Euer Gesuch steht: Ihr ' + GS[k].l.replace(/^möchte/, 'möchtet') + '.' : 'Ihr habt Euer Gesuch zurückgenommen.', '#9cc8ff');
  sendPresence(true);
}

/* ============ Die Ritter im Land ============ */
function olWhere(q){
  if (typeof q.in === 'string' && q.in.startsWith('dg:') && DG_DEF[q.in.slice(3)]) return (DG_DEF[q.in.slice(3)].kz ? 'im Kriegszug: ' : 'im Gewölbe: ') + DG_DEF[q.in.slice(3)].name;
  if (q.in && INN_BY[q.in]) return INN_BY[q.in].name;
  if (q.in && CH_BY[q.in]) return CH_BY[q.in].name;
  const z = ZONE_BY_ID[q.z]; return z ? z.name : 'unterwegs';
}
function openRitter(){
  if (!HERO || !openPanel('ovTalk')) return;
  G.talk = { peerTalk: true, peer: null, name: 'Ritter im Land', key: 'ritter' };
  $('talkImg').src = knightUrl(HERO.f, lookOf(HERO.eq)); $('talkName').textContent = 'Ritter im Land';
  renderTalk('ritter');
}
function olView(view, body, opts){
  const back = () => opts.append(btn('Zurück', () => renderTalk('ritter'), 'tbtn'));
  if (view === 'gesten'){
    $('talkText').textContent = 'Eine Geste sehen alle Ritter in der Nähe. Im Gespräch geht es auch so: /verneigen, /winken, /jubeln …';
    for (const [k, g] of Object.entries(GE)) opts.append(btn(g.n, () => geDo(k), 'opt'));
    back(); body.append(opts); return;
  }
  if (view === 'gesuch'){
    $('talkText').textContent = 'Was sucht Ihr? Das Gesuch steht unter Eurem Ritter und in der Liste der Ritter im Land, bis Ihr es zurücknehmt.';
    for (const [k, g] of Object.entries(GS)){ const b = btn(cap1(g.l.replace(/^sucht /, '').replace(/^möchte /, '')), () => { gsSet(k); renderTalk('ritter'); }, NET.gs === k ? 'opt new' : 'opt'); opts.append(b); }
    if (NET.gs) opts.append(btn('Gesuch zurücknehmen', () => { gsSet(''); renderTalk('ritter'); }, 'opt'));
    back(); body.append(opts); return;
  }
  const L = [...PEERS.values()].sort((a, b) => (frIs(b.by, b.nm) - frIs(a.by, a.nm)) || b.lv - a.lv);
  $('talkRole').textContent = L.length ? (L.length + 1) + ' Ritter gerade im Spiel' : 'Ihr seid allein im Land';
  $('talkText').textContent = L.length ? 'Diese Ritter sind gerade im Land. Wer nahe steht, lässt sich ansprechen; flüstern geht über jede Entfernung.' : 'Gerade ist außer Euch kein Ritter im Land. Freunde, die kommen, meldet der Bericht.';
  for (const q of L){
    const r = el('div', 'shoprow'), ic = el('img'); ic.src = knightUrl(q.f, q.lk); ic.alt = '';
    const t = el('div', 'stx'), fr = frIs(q.by, q.nm);
    t.append(el('b', null, q.nm + (fr ? ' ★' : '')), el('small', null, 'Stufe ' + q.lv + ' · ' + KN_FACTIONS[q.f].knight + ' · ' + olWhere(q) + (q.gs && GS[q.gs] ? ' · ' + GS[q.gs].l : '') + (inParty(q) ? ' · in Eurer Gruppe' : '')));
    const acts = el('div', 'racts');
    acts.append(btn('Flüstern', () => olChatTo(q), 'tbtn'), btn(fr ? 'Kein Freund mehr' : 'Freund', () => { frToggle(q); renderTalk('ritter'); }, 'tbtn'));
    if (samePlace(q) && !q.dead && peerDist(q) < 160) acts.append(btn('Ansprechen', () => { closePanel(); openPeer(q); }, 'tbtn'));
    r.append(ic, t, acts); body.append(r);
  }
  const away = HERO.frd ? HERO.frd.filter(f => ![...PEERS.values()].some(q => (f.id && q.by === f.id) || q.nm === f.nm)) : [];
  if (away.length) body.append(el('p', 'hint', 'Freunde, die gerade nicht im Land sind: ' + away.map(f => f.nm + ' (Stufe ' + f.lv + (f.at ? ', zuletzt ' + new Date(f.at).toLocaleDateString('de-DE') : '') + ')').join(', ') + '.'));
  body.append(el('p', 'hint', NET.gs ? 'Euer Gesuch: Ihr ' + GS[NET.gs].l.replace(/^möchte/, 'möchtet') + '.' : 'Ihr habt kein Gesuch ausgehängt.'));
  opts.append(btn(NET.gs ? 'Gesuch ändern' : 'Gefährten suchen', () => renderTalk('gesuch'), 'opt'), btn('Gesten', () => renderTalk('gesten'), 'opt'));
  body.append(opts);
}
/* im Gespräch mit einem Ritter (Teil 17): Zweikampf, Flüstern, Freund */
function olPeerOpts(q, opts, ask){
  if (zkFoe(q)) opts.append(btn('Den Zweikampf aufgeben', () => { closePanel(); zkGiveUp(); }, 'opt'));
  else if (!G.inside && !DG_ON) ask(peerDist(q) <= ZK_NEAR ? 'Zum Zweikampf fordern' : 'Zum Zweikampf fordern (näher herantreten)', 'zk', 0, peerDist(q) > ZK_NEAR ? 'Tretet näher heran.' : q.bz ? 'beschäftigt' : '');
  opts.append(btn('Flüstern', () => olChatTo(q), 'opt'), btn(frIs(q.by, q.nm) ? 'Aus den Freunden streichen' : 'Zu den Freunden', () => { frToggle(q); renderTalk('peer'); }, 'opt'));
}
/* jeden Netzschritt: Zweikampf, Freunde auf dem neuesten Stand, Gesuch „Gruppe“ erledigt sich mit der Gruppe */
function olTick(t){
  if (NET.zk) zkTick(t);
  if (!NET.helloT) NET.helloT = t;
  if (NET.gs === 'gruppe' && NET.pt && partyList().length){ NET.gs = ''; sendPresence(true); }
  if (t - (NET.frT || 0) > 5 && HERO.frd && HERO.frd.length){
    NET.frT = t;
    for (const q of PEERS.values()){ const i = frFind(q.by, q.nm); if (i >= 0) Object.assign(HERO.frd[i], { id: q.by || HERO.frd[i].id, nm: q.nm, f: q.f, lv: q.lv, at: Date.now() }); }
  }
}
/* wer ins Land kommt, sobald er einen Namen hat (beim Laden der Seite ist die Anwesenheit noch leer); Freunde besonders.
   Wer schon da war, als man selbst ins Spiel kam, wird nicht gemeldet. */
function olPeers(peers){
  const H = NET.hello || (NET.hello = {}), live = !!(HERO && G && G.mode !== 'title' && NET.helloT && nowS() - NET.helloT > 3);
  if (HERO && G && G.mode !== 'title' && !NET.helloT) NET.helloT = nowS();
  for (const p of peers){
    if (p.sameTab || p.kind !== 'viewer' || !p.presence || !p.presence.nm || H[p.peer]) continue;
    H[p.peer] = 1;
    if (!live) continue;
    const nm = cleanName(p.presence.nm) || 'Ein Ritter', fr = frIs(p.by, nm);
    logLine(nm + (fr ? ', Euer Freund, ist im Königsland.' : ' ist im Königsland.'), fr ? '#9fe08a' : '#9cc8ff');
    if (fr) Sound.chat();
  }
}
$('btnRitter').addEventListener('click', () => { Sound.init(); G.mode === 'menu' && G.talk && G.talk.key === 'ritter' ? closePanel() : openRitter(); });

/* ============ Ruhmeshalle: Zweikampf ============ */
function zkFame(o){ const H = HERO.zk; if (H && (H.w || H.l || H.d)){ o.ze = H.e; o.zw = H.w; o.zl = H.l; } return o; }
function zkFameTab(box, rows){
  const L = rows.filter(r => (r.zw | 0) + (r.zl | 0) > 0).map(r => ({ id: r.id, nm: cleanName(r.nm) || 'Unbekannt', e: clamp(r.ze | 0, 100, 3000), w: Math.max(0, r.zw | 0), l: Math.max(0, r.zl | 0) })).sort((a, b) => b.e - a.e).slice(0, 15);
  if (!L.length){ box.append(el('li', 'empty', 'Noch hat kein Ritter einen Zweikampf zu Fuß gefochten. Fordern könnt Ihr jeden Ritter, der nahe bei Euch steht.')); return; }
  L.forEach((r, i) => { const li = el('li', r.id === (cloud.uid || 'local') ? 'me' : ''); li.append(el('span', 'fr', String(i + 1)), el('span', 'fn', r.nm), el('span', 'fl', 'Wertung ' + r.e), el('span', 'fk', r.w + (r.w === 1 ? ' Sieg' : ' Siege') + ', ' + r.l + (r.l === 1 ? ' Niederlage' : ' Niederlagen'))); box.append(li); });
}
TROPHIES.splice(TROPHIES.findIndex(t => t.id === 'turnier'), 0, { id: 'zweikampf', n: 'Meister der Klinge', d: 'zehn Zweikämpfe zu Fuß gegen andere Ritter gewonnen', ok: h => !!h.zk && h.zk.w >= 10 });
TROPHY_BY.zweikampf = TROPHIES.find(t => t.id === 'zweikampf');

/* ---------- Tafel: Mit anderen Rittern ---------- */
for (const [src, name, desc] of [[() => ZK_POLE, 'Zweikampf zu Fuß', 'gegen einen Ritter, der nahe bei Euch steht, überall unter freiem Himmel: Gefochten wird in einem Kreis aus Seil und Wimpeln mit Klinge, Schild und Fähigkeiten, längstens zwei Minuten. Um das Leben geht es nicht. Der Sieger bekommt Ehrensold, Punkte für sein Haus im Wettstreit (fünfmal am Spieltag) und Punkte für die Wertung im Zweikampf.'],
  [() => knightSet('frankreich').icon, 'Gesten', 'verneigen, mit dem Schwert grüßen, winken, jubeln, knien, tanzen, lachen, drohen: unter „Ritter“ oder als Befehl im Gespräch, etwa „/verneigen“. Alle Ritter in der Nähe sehen es.'],
  [() => knightSet('england').icon, 'Flüstern und Freunde', '„/w Name Nachricht“ zeigt nur der angesprochene Ritter an, „/r Nachricht“ antwortet dem, der zuletzt geflüstert hat. Wen Ihr zu Euren Freunden zählt, dessen Kommen meldet der Bericht.'],
  [() => knightSet('spanien').icon, 'Ritter im Land und Gesuche', 'unter „Ritter“ (Taste O): alle, die gerade spielen, mit Stufe, Haus und Ort, Freunde zuerst. Wer Gefährten für einen Kriegszug, ein Gewölbe oder das Weltereignis sucht, hängt ein Gesuch aus; es steht dann auch unter seinem Ritter.']]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  lazySrc(im, () => urlOf(src(), src() === ZK_POLE ? 2 : 3)); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh); $('mpList').append(li);
}
