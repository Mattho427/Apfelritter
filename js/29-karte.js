"use strict";
/* Der Apfelritter, Teil 29 von 30: Die große Karte: Zoomen und Verschieben, Detailkacheln, Zeichen für Orte und Leute, Beschriftungen ohne
   Überdeckung, Gebietsstufen nach Gefahr, Legende mit Filtern, Hinweise beim Zeigen; Ziel, Notizen und Wegfindung; Erkundung mit Kartennebel.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */

/* ============ Die große Karte (Version 34) ============
   Grund ist die Pergamentkarte (Teil 8): ganz herausgezoomt die Übersicht, näher heran Detailkacheln (je 256 Kartenpunkte, zu 4 oder 2
   Weltpixeln je Punkt), die nach und nach gemalt werden, solange die Karte offen ist; bis dahin steht die Übersicht vergrößert darunter.
   Darüber Zeichen (Gasthaus, Schmied, Händler, Stall, Kirche, Post, Herold, Reisen, Gewölbe, Anführer, Hausburgen, Rastort), Aufträge,
   Hauptgeschichte, Weltereignis, andere Ritter und der eigene Ritter mit Blickrichtung. Beschriftungen werden nach Wichtigkeit gesetzt
   und weggelassen, wo sie eine wichtigere überdecken würden. Was man zeigt oder antippt, erklärt ein Hinweis. */
const MV = { cx: GW / 2, cy: GH / 2, z: 1, seen: false, dirty: true, tiles: new Map(), hits: [], pts: new Map(), pinch: null, drag: null, raf: 0, last: 0, dpr: 1 };
const MAP_FILTERS = [['gebiete', 'Gebiete und Stufen'], ['gasthaus', 'Gasthäuser'], ['dienste', 'Schmied, Händler, Stall, Kirche, Post'], ['auftrag', 'Aufträge und Geschichte'],
  ['anfuehrer', 'Anführer'], ['gewoelbe', 'Gewölbe und Kriegszüge'], ['ritter', 'Andere Ritter']];
const MF = (() => { let o = {}; try { o = JSON.parse(localStorage.getItem('apfelritter.karte') || '{}') || {}; } catch(e){} for (const [k] of MAP_FILTERS) if (typeof o[k] !== 'boolean') o[k] = true; return o; })();
const mfSave = () => { try { localStorage.setItem('apfelritter.karte', JSON.stringify(MF)); } catch(e){} };

/* Zeichen als kleine Pixelbilder (9 × 9) */
const MI_PAL = { w: '#f4ecd8', o: '#6a4a2a', y: '#e0a040', a: '#8a8e96', b: '#c8ccd4', c: '#a07850', t: '#5a3a20', s: '#b0b4bc', r: '#b8281e', g: '#e8c040', p: '#2a1a3a', e: '#8a8478', k: '#d8c8a0', n: '#3b2e20', d: '#5a1012' };
const MI = Object.fromEntries(Object.entries({
  gasthaus: ['.wwwww...', 'wwwwwww..', 'ooooooo..', 'oyyyyyooo', 'oyyyyyo.o', 'oyyyyyo.o', 'oyyyyyooo', 'oyyyyyo..', 'ooooooo..'],
  schmied: ['.........', 'bbbbbbbb.', '.aaaaaaaa', '...aaaa..', '...aaaa..', '..aaaaaa.', '.aaaaaaaa', '.........', '.........'],
  haendler: ['...tt....', '..t..t...', '...tt....', '..cccc...', '.cccccc..', 'cccggccc.', 'ccggggcc.', 'cccggccc.', '.cccccc..'],
  stall: ['.ss...ss.', '.ss...ss.', '.ss...ss.', '.ss...ss.', '.ss...ss.', '..ss.ss..', '..sssss..', '...sss...', '.........'],
  kirche: ['...ww....', '...ww....', '.wwwwww..', '.wwwwww..', '...ww....', '...ww....', '...ww....', '...ww....', '.........'],
  post: ['.........', 'wwwwwwwww', 'wrwwwwwrw', 'wwrwwwrww', 'wwwrwrwww', 'wwwwrwwww', 'wwwwwwwww', '.........', '.........'],
  herold: ['t........', 'trrrrrr..', 'trrggrr..', 'trrrrrr..', 'trrrrr...', 't........', 't........', 't........', 't........'],
  reise: ['.........', 'ccccccccc', 'ckkkkkkkc', 'ccccccccc', '.nnn.nnn.', 'n.n.n.n.n', '.nnn.nnn.', '.........', '.........'],
  tor: ['..eeeee..', '.eeeeeee.', 'ee.....ee', 'e..ppp..e', 'e.ppppp.e', 'e.ppppp.e', 'e.ppppp.e', 'eeeeeeeee', '.........'],
  anfuehrer: ['..wwwww..', '.wwwwwww.', 'wwwwwwwww', 'ww..w..ww', 'ww..w..ww', 'wwwwwwwww', '.www.www.', '..w.w.w..', '.........'],
  rast: ['....t....', '...tkt...', '..tkkkt..', '.tkkkkkt.', 'tkkkkkkkt', 'tkk.t.kkt', 'ttttttttt', '.........', '.........'],
  ziel: ['nn.......', 'nggggg...', 'nggrggg..', 'nggggg...', 'nn.......', 'n........', 'n........', 'n........', 'nnn......'],
  notiz: ['.rrr.....', 'rrwrr....', 'rrrrr....', '.rrr.....', '..n......', '..n......', '..n......', '..n......', '.........']
}).map(([k, rows]) => [k, makeSprite(rows, MI_PAL, OUT)]));
/* Leute nach ihrer Rolle einem Zeichen zuordnen */
function npcIcon(n){
  const r = (n.role || '') + ' ' + n.id;
  if (/Schmied|Plattner|Waffen/.test(r)) return 'schmied';
  if (/Pferde|Stall/.test(r)) return 'stall';
  if (/Post/.test(r)) return 'post';
  if (/Herold|Turnier/.test(r)) return 'herold';
  if (/Reisen|Fuhrmann|Überfahrt|Fähr|Schiff|Hafen/.test(r)) return 'reise';
  if (/Priester|Pfarr|Kaplan|Abt|Dom|Prediger|Propst|Legat/.test(r)) return 'kirche';
  if (n.shop || /Händler|Krämer|Kaufherr|Markt|Kämmer/.test(r)) return 'haendler';
  return null;
}

/* ---------- Ansicht ---------- */
function mapSize(){
  const c = $('mapCv'), box = c.parentElement, dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(200, Math.round(box.clientWidth * dpr)), h = Math.max(150, Math.round(box.clientHeight * dpr));
  MV.dpr = dpr;
  if (c.width !== w || c.height !== h){ c.width = w; c.height = h; MV.dirty = true; }
  return c;
}
const mapS0 = c => Math.max(GW / c.width, GH / c.height);   // Spielpixel je Bildpunkt, wenn das ganze Land passt
const mapS = c => mapS0(c) / MV.z;
const MAP_ZMAX = c => Math.max(2, mapS0(c) / 2.2);   // höchstens etwa ein Weltpixel je Bildpunkt
function mapClamp(c){
  MV.z = clamp(MV.z, 1, MAP_ZMAX(c));
  const s = mapS(c), hw = c.width * s / 2, hh = c.height * s / 2;
  MV.cx = hw * 2 >= GW ? GW / 2 : clamp(MV.cx, hw, GW - hw); MV.cy = hh * 2 >= GH ? GH / 2 : clamp(MV.cy, hh, GH - hh);
}
function mapZoomAt(f, px, py){   // px, py: Bildpunkte auf der Leinwand
  const c = $('mapCv'), s = mapS(c), gx = MV.cx + (px - c.width / 2) * s, gy = MV.cy + (py - c.height / 2) * s;
  MV.z *= f; mapClamp(c);
  const s2 = mapS(c); MV.cx = gx - (px - c.width / 2) * s2; MV.cy = gy - (py - c.height / 2) * s2;
  mapClamp(c); MV.dirty = true;
}
function mapZoomTo(z, gx, gy){ const c = $('mapCv'); MV.z = z; if (gx != null){ MV.cx = gx; MV.cy = gy; } mapClamp(c); MV.dirty = true; }
const mapCenterMe = () => { const k = G.knight, at = G.inside ? { x: G.inside.dx, y: G.inside.dy } : DG_ON ? DG_ON.door : k; mapZoomTo(Math.max(MV.z, 4), at.x, at.y); };

/* ---------- Detailkacheln ---------- */
function mapTile(S, tx, ty){
  const key = S + ':' + tx + ':' + ty; let t = MV.tiles.get(key);
  if (!t){ t = { S, tx, ty, cv: null, u: 0 }; MV.tiles.set(key, t); }
  t.u = MV.last;
  return t;
}
function mapPaintSome(budget){
  const t0 = performance.now(); let n = 0;
  const want = [...MV.tiles.values()].filter(t => !t.cv && t.u === MV.last);
  for (const t of want){
    if (performance.now() - t0 > budget && n) break;
    const W2 = 256 * t.S; t.cv = mapPaint(t.tx * W2, t.ty * W2, 256, 256, t.S, false); n++; MV.dirty = true;
  }
  if (MV.tiles.size > 70){ const old = [...MV.tiles.entries()].sort((a, b) => a[1].u - b[1].u).slice(0, MV.tiles.size - 56); for (const [k] of old) MV.tiles.delete(k); }
  return want.length - n;
}

/* ---------- Zeichnen ---------- */
const MAP_FONT = () => { const cs = getComputedStyle(document.documentElement); return [cs.getPropertyValue('--f-display').trim() || 'serif', cs.getPropertyValue('--f-body').trim() || 'monospace']; };
function zoneDanger(id){
  const lv = ZONE_LV[id], h = HERO ? HERO.lvl : 1;
  if (!lv) return SAFE[id] ? ['#1f5a2a', 'sicher'] : ['#2a1c12', ''];
  if (lv[0] >= h + 3) return ['#8e1414', 'gefährlich'];
  if (lv[1] > h + 1) return ['#9a5a10', 'fordernd'];
  if (lv[1] < h - 3) return ['#6a6458', 'leicht'];
  return ['#2a1c12', 'passend'];
}
function drawFullMap(){
  const c = mapSize(), g = c.getContext('2d'), cw = c.width, ch = c.height, dpr = MV.dpr;
  mapClamp(c);
  const s = mapS(c), x0 = MV.cx - cw / 2 * s, y0 = MV.cy - ch / 2 * s, X = gx => (gx - x0) / s, Y = gy => (gy - y0) / s, k = G.knight;
  MV.last++; MV.hits = []; MV.dirty = false;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#b8a274'; g.fillRect(0, 0, cw, ch);
  // Grund: Übersicht, darüber die Detailkacheln (Weltpixel je Bildpunkt = s / 2)
  const wpp = s / WS;
  g.imageSmoothingEnabled = wpp > 8; g.setTransform(16 / s, 0, 0, 16 / s, -x0 / s, -y0 / s); g.drawImage(FULLMAP, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
  const S = wpp >= 5.5 ? 8 : wpp >= 2.6 ? 4 : 2;
  if (S < 8){
    g.imageSmoothingEnabled = wpp > S;
    const span = 256 * S * WS, tx0 = Math.max(0, Math.floor(x0 / span)), tx1 = Math.min(Math.ceil(WW / (256 * S)) - 1, Math.floor((x0 + cw * s) / span)), ty0 = Math.max(0, Math.floor(y0 / span)), ty1 = Math.min(Math.ceil(WH / (256 * S)) - 1, Math.floor((y0 + ch * s) / span));
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){ const t = mapTile(S, tx, ty); if (t.cv) g.drawImage(t.cv, Math.floor(X(tx * span)), Math.floor(Y(ty * span)), Math.ceil(span / s) + 1, Math.ceil(span / s) + 1); }
  }
  // Unerkundetes unter Pergamentnebel, mit feiner Schraffur
  if (EX.bits){
    if (!MV.fogCv || MV.fogCv.width !== cw || MV.fogCv.height !== ch){ MV.fogCv = canvasOf(cw, ch); MV.fogG = MV.fogCv.getContext('2d'); }
    const F = MV.fogG; F.globalCompositeOperation = 'source-over'; F.clearRect(0, 0, cw, ch); F.imageSmoothingEnabled = true;
    F.drawImage(exFog(), X(0), Y(0), GW / s, GH / s);
    if (!MV.hatch){ const hc = canvasOf(8, 8), hg = hc.getContext('2d'); hg.fillStyle = 'rgba(90,64,36,.22)'; for (let i = 0; i < 8; i++) hg.fillRect(i, 7 - i, 1, 1); MV.hatch = hc; }
    F.globalCompositeOperation = 'source-atop'; F.fillStyle = F.createPattern(MV.hatch, 'repeat'); F.save(); F.scale(dpr, dpr); F.fillRect(0, 0, cw / dpr, ch / dpr); F.restore();
    F.globalCompositeOperation = 'source-over';
    g.drawImage(MV.fogCv, 0, 0);
  }
  g.imageSmoothingEnabled = false;
  const u = Math.max(1, Math.round(dpr * (MV.z >= 3 ? 2 : MV.z >= 1.6 ? 1.5 : 1.2) * 2) / 2), inV = (x, y, m) => X(x) > -m && X(x) < cw + m && Y(y) > -m && Y(y) < ch + m;
  const hit = (x, y, r, t, sub) => MV.hits.push({ x: X(x), y: Y(y), r, t, sub, gx: x, gy: y });
  const icon = (key, x, y, t, sub, sc) => { const im = MI[key]; if (!im || !inV(x, y, 20) || !exSeen(x, y)) return;   /* unter dem Nebel verborgen */ const w = im.width * u * (sc || 1), h = im.height * u * (sc || 1); g.drawImage(im, Math.round(X(x) - w / 2), Math.round(Y(y) - h / 2), Math.round(w), Math.round(h)); hit(x, y, w * .7, t, sub); };
  const [fD, fB] = MAP_FONT(), boxes = [], TX = [];   // Schriften erst zum Schluss, über den Zeichen
  const label = (text, x, y, size, col, font, sub, subCol, force) => {
    if (!inV(x, y, 60)) return false;
    g.font = Math.round(size * dpr) + 'px ' + font; const w = g.measureText(text).width, h = size * dpr;
    let w2 = 0; if (sub){ g.font = Math.round(size * .72 * dpr) + 'px ' + fB; w2 = g.measureText(sub).width; }
    const bw = Math.max(w, w2) + 6 * dpr, bh = h * (sub ? 1.8 : 1.1), bx = X(x) - bw / 2, by = Y(y) - h * .7;
    if (!force && boxes.some(b => bx < b[0] + b[2] && bx + bw > b[0] && by < b[1] + b[3] && by + bh > b[1])) return false;
    boxes.push([bx, by, bw, bh]);
    TX.push(() => {
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.font = Math.round(size * dpr) + 'px ' + font; g.lineWidth = 3 * dpr; g.strokeStyle = 'rgba(232,216,176,.92)'; g.strokeText(text, X(x), Y(y)); g.fillStyle = col; g.fillText(text, X(x), Y(y));
    if (sub){ g.font = Math.round(size * .72 * dpr) + 'px ' + fB; g.strokeText(sub, X(x), Y(y) + h * .95); g.fillStyle = subCol || '#4a3422'; g.fillText(sub, X(x), Y(y) + h * .95); }
    });
    return true;
  };
  // eigener Ritter und Ziele zuerst in die Beschriftungsliste, damit nichts darüber steht
  const me = G.inside ? { x: G.inside.dx, y: G.inside.dy } : DG_ON ? DG_ON.door : k;
  boxes.push([X(me.x) - 12 * dpr, Y(me.y) - 12 * dpr, 24 * dpr, 24 * dpr]);
  // Aufträge: gestrichelter Kreis um das Gebiet
  if (MF.auftrag) for (const q of HERO.quests){
    const d = qInfo(q); if (!d || q.n >= d.need) continue;
    const z = ZONE_BY_ID[d.zone]; if (!z) continue;
    const zx = z.label.x * WS, zy = z.label.y * WS + 28;
    g.strokeStyle = '#c9a227'; g.lineWidth = 2 * dpr; g.setLineDash([5 * dpr, 4 * dpr]); g.beginPath(); g.arc(X(zx), Y(zy), Math.max(16 * dpr, 220 / s), 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    hit(zx, zy, 22 * dpr, 'Auftrag: ' + d.t, ZONE_BY_ID[d.zone].name + ' · ' + Math.min(q.n, d.need) + ' von ' + d.need);
  }
  // der Weg zum Ziel: golden mit dunklem Rand; solange er gesucht wird oder keiner da ist, gestrichelt geradeaus
  const wy = HERO.way;
  if (wy){
    const pts = WAY.pts ? [me, { x: WAY.px, y: WAY.py }, ...WAY.pts.slice(WAY.i + 1)] : [me, wy];
    g.lineJoin = 'round'; g.lineCap = 'round';
    for (const [lw, col] of [[6, 'rgba(42,28,18,.75)'], [3, '#ffd541']]){
      g.strokeStyle = col; g.lineWidth = lw * dpr; g.setLineDash(WAY.pts ? [] : [6 * dpr, 5 * dpr]);
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(X(p.x), Y(p.y)) : g.moveTo(X(p.x), Y(p.y))); g.stroke();
    }
    g.setLineDash([]); g.lineCap = 'butt';
  }
  // Beschriftungen: Städte und Burgen, Gebiete mit Stufen, Orte
  // erst Städte und Burgen (immer), dann die Gebiete dort, wo noch Platz ist
  for (const z of [...ZONES.filter(z => SAFE[z.id]), ...ZONES.filter(z => !SAFE[z.id])]){
    const safe = !!SAFE[z.id], [col, dg] = zoneDanger(z.id), lv = zoneLvText(z.id);
    if (!safe && !MF.gebiete) continue;
    if (label(z.name, z.label.x * WS, z.label.y * WS, safe ? 17 : 14, safe ? '#2a1c12' : col, fD, safe ? '' : lv + (dg && dg !== 'passend' ? ' · ' + dg : ''), col, safe))
      hit(z.label.x * WS, z.label.y * WS, 30 * dpr, z.name, (lv || '') + (EX.cnt ? (lv ? ' · ' : '') + (HERO.expl[z.id] ? 'erkundet' : 'erkundet zu ' + Math.round(exFrac(exZoneIdx(z.id)) * 100) + ' %') : '') + (ZONE_INFO[z.id] ? ' · ' + ZONE_INFO[z.id] : ''));
  }
  if (MV.z >= 1.5) for (const l of MAP_LABELS) if (!ZONES.some(z => z.name === l.name) && exSeen(l.x * WS, l.y * WS)) label(l.name, l.x * WS, l.y * WS, 12, '#3a2a1a', fD);
  // Hausburgen: Schild des Hauses
  for (const [fid, B] of Object.entries(HB)){
    const n = NPCS.find(q => q.id === 'hb_' + fid); if (!n || !inV(n.x, n.y, 20)) continue;
    const im = knightSet(fid).icon, w = im.width * u * .9, h = im.height * u * .9;
    g.drawImage(im, Math.round(X(n.x) - w / 2), Math.round(Y(n.y) - h - 4 * dpr), Math.round(w), Math.round(h));
    hit(n.x, n.y - 10 * s, w * .7, B.burg, KN_FACTIONS[fid].name + (HERO.f === fid ? ' · Euer Haus: Gunst, Tribut, Rast' : ' · Gast'));
  }
  // Gasthäuser, Kirchen, Leute mit Diensten
  if (MF.gasthaus) for (const inn of INNS){ icon('gasthaus', inn.dx, inn.y, inn.name, inn.where + ' · Wirt: ' + inn.host); if (MV.z >= 3.2) label(inn.name, inn.dx, inn.y + 14 * s * dpr, 11, '#5a2a10', fB); }
  if (MF.dienste){
    for (const ch2 of CHURCHES) icon('kirche', ch2.dx, ch2.dy - 20, ch2.name, (ch2.clergy && ch2.clergy[0] ? ch2.clergy[0].name + ' · ' : '') + (ch2.where || 'Kirche'));
    for (const n of NPCS){ const key = npcIcon(n); if (!key || key === 'kirche' && CHURCHES.some(c2 => Math.hypot(c2.dx - n.x, c2.dy - n.y) < 200)) continue; icon(key, n.x, n.y, n.name, n.role); if (MV.z >= 4.5) label(n.name, n.x, n.y + 14 * s * dpr, 10, '#2a3a1a', fB); }
  }
  // Gewölbe und Kriegszüge
  if (MF.gewoelbe) for (const d of DG_DOORS){ const D2 = DG_DEF[d.dg]; icon('tor', d.x, d.y, d.name, D2 ? (D2.kz ? 'Kriegszug für eine Gruppe' : D2.group ? 'Gewölbe für eine Gruppe' : 'Gewölbe') + (D2.lvl ? ' · ab Stufe ' + D2.lvl : '') : ''); }
  // Anführer: rot, erschlagene grau
  if (MF.anfuehrer) for (const [kind, p] of Object.entries(LAIRS)){
    if (!inV(p.x, p.y, 20) || !exSeen(p.x, p.y)) continue;
    const done = HERO.bosses[kind], im = MI.anfuehrer, w = im.width * u, h = im.height * u;
    g.fillStyle = done ? '#6a6458' : '#8e1414'; g.beginPath(); g.arc(X(p.x), Y(p.y), w * .62, 0, Math.PI * 2); g.fill();
    g.globalAlpha = done ? .6 : 1; g.drawImage(im, Math.round(X(p.x) - w / 2), Math.round(Y(p.y) - h / 2), Math.round(w), Math.round(h)); g.globalAlpha = 1;
    const M2 = MON[kind]; hit(p.x, p.y, w * .7, M2 ? M2.name : 'Anführer', (BOSSES[kind] ? 'Stufe ' + BOSSES[kind].lvl + ' · ' : '') + (done ? 'schon bezwungen' : 'noch nicht bezwungen'));
  }
  // Rastort
  const bd = BIND[HERO.bind]; if (bd) icon('rast', bd.x + 18, bd.y, 'Euer Rastort', 'Nach dem Tod erwacht Ihr ' + (HUB_IN[HERO.bind] || 'hier') + '.', .9);
  // Leute mit Aufträgen: Ausrufe- oder Fragezeichen
  if (MF.auftrag) for (const n of NPCS){
    const mk = npcMark(n); if (!mk || !inV(n.x, n.y, 20)) continue;
    const r = 6 * u; g.fillStyle = OUT; g.beginPath(); g.arc(X(n.x), Y(n.y) - r * 1.6, r + dpr, 0, Math.PI * 2); g.fill(); g.fillStyle = mk === '?' ? '#7fd65f' : '#ffd541'; g.beginPath(); g.arc(X(n.x), Y(n.y) - r * 1.6, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = OUT; g.font = 'bold ' + Math.round(r * 1.5) + 'px ' + fB; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(mk, X(n.x), Y(n.y) - r * 1.55);
    hit(n.x, n.y - r * 1.6 * s, r * 1.4, n.name, mk === '?' ? 'Auftrag abgeben' : 'hat etwas für Euch');
  }
  // Hauptgeschichte, Weltereignis, Steckbriefe
  if (MF.auftrag){
    const stm = stTarget(); if (stm && inV(stm.x, stm.y, 20)){ const sx = X(stm.x), sy = Y(stm.y), r = 7 * u; g.fillStyle = OUT; g.beginPath(); g.moveTo(sx, sy - r - 2 * dpr); g.lineTo(sx + r + 2 * dpr, sy); g.lineTo(sx, sy + r + 2 * dpr); g.lineTo(sx - r - 2 * dpr, sy); g.fill(); g.fillStyle = '#ffd541'; g.beginPath(); g.moveTo(sx, sy - r); g.lineTo(sx + r, sy); g.lineTo(sx, sy + r); g.lineTo(sx - r, sy); g.fill(); hit(stm.x, stm.y, r * 1.3, 'Hauptgeschichte', stm.label || 'nächster Schritt'); }
    rrMap(g, X, Y);
  }
  const es = evMark2(); if (es && inV(es.x, es.y, 20)){ const ex = X(es.x), ey = Y(es.y), q = u * 1.4; g.fillStyle = OUT; g.fillRect(ex - q, ey - 14 * q, 3 * q, 16 * q); g.fillRect(ex + q, ey - 15 * q, 10 * q, 8 * q); g.fillStyle = '#d0343c'; g.fillRect(ex + 2 * q, ey - 14 * q, 8 * q, 6 * q); g.fillStyle = '#e8dcbc'; g.fillRect(ex, ey - 13 * q, q, 14 * q); hit(es.x, es.y - 8 * q * s, 14 * q, EVT.cur.d.name, EVT.cur.d.where || 'Weltereignis'); }
  // andere Ritter
  if (MF.ritter) for (const p of PEERS.values()){
    const at = peerAt(p), px = at ? at.x : p.x, py = at ? at.y : p.y; if (!inV(px, py, 20)) continue;
    const fr = typeof frIs === 'function' && frIs(p.by, p.nm), pal = inParty(p), r = 4 * u;
    g.fillStyle = OUT; g.fillRect(Math.round(X(px) - r - dpr), Math.round(Y(py) - r - dpr), Math.round(r * 2 + 2 * dpr), Math.round(r * 2 + 2 * dpr));
    g.fillStyle = pal ? '#7fe08a' : fr ? '#f0c040' : '#6a9ae0'; g.fillRect(Math.round(X(px) - r), Math.round(Y(py) - r), Math.round(r * 2), Math.round(r * 2));
    if (pal || fr || MV.z >= 2.2) label(p.nm, px, py - 12 * s * dpr, 11, pal ? '#1f5a2a' : '#1a3a6a', fB, null, null, true);
    hit(px, py, r * 1.6, p.nm, 'Stufe ' + p.lv + ' · ' + KN_FACTIONS[p.f].knight + (pal ? ' · in Eurer Gruppe' : fr ? ' · Freund' : ''));
  }
  // Notizen und das Ziel
  for (const n of HERO.notes){ if (!inV(n.x, n.y, 20)) continue; const im = MI.notiz, w = im.width * u, h = im.height * u; g.drawImage(im, Math.round(X(n.x) - w * .3), Math.round(Y(n.y) - h), Math.round(w), Math.round(h)); hit(n.x, n.y - 4 * s * dpr, w * .7, n.t, 'Eure Notiz'); if (MV.z >= 2) label(n.t, n.x, n.y + 6 * s * dpr, 11, '#5a1012', fB, null, null, true); }
  if (wy && inV(wy.x, wy.y, 20)){ const im = MI.ziel, w = im.width * u * 1.2, h = im.height * u * 1.2; g.drawImage(im, Math.round(X(wy.x) - w * .12), Math.round(Y(wy.y) - h), Math.round(w), Math.round(h)); hit(wy.x, wy.y - 6 * s * dpr, w * .8, 'Ziel: ' + wy.t, WAY.pts ? 'noch ' + Math.round(WAY.left / 2) + ' Schritt' : WAY.job ? 'der Weg wird gesucht' : 'kein Weg über Land'); }
  if ($('mapExpl') && EX.cnt) $('mapExpl').textContent = 'Erkundet: ' + Object.keys(HERO.expl).length + ' von ' + exZones().length + ' Gebieten';
  for (const f of TX) f();
  // der eigene Ritter: Pfeil in Blickrichtung mit pulsierendem Ring
  const mx = X(me.x), my = Y(me.y), a = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 }[k.dir] || 0, r = 7 * u, pul = (performance.now() / 900) % 1;
  g.strokeStyle = 'rgba(176,36,42,' + (1 - pul).toFixed(2) + ')'; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(mx, my, r + pul * 14 * dpr, 0, Math.PI * 2); g.stroke();
  g.save(); g.translate(mx, my); g.rotate(a);
  g.fillStyle = OUT; g.beginPath(); g.moveTo(r + 3 * dpr, 0); g.lineTo(-r - 2 * dpr, -r * .8 - 2 * dpr); g.lineTo(-r * .4, 0); g.lineTo(-r - 2 * dpr, r * .8 + 2 * dpr); g.fill();
  g.fillStyle = '#ecd27a'; g.beginPath(); g.moveTo(r, 0); g.lineTo(-r, -r * .8); g.lineTo(-r * .45, 0); g.lineTo(-r, r * .8); g.fill();
  g.fillStyle = '#b0242a'; g.fillRect(-2 * dpr, -2 * dpr, 4 * dpr, 4 * dpr); g.restore();
  hit(me.x, me.y, r * 1.5, HERO.name, (ZONE_BY_ID[G.zone] ? ZONE_BY_ID[G.zone].name : '') + ' · Stufe ' + HERO.lvl);
  // Maßstab unten links: 500 Schritt
  const step = 1000 / s, sx0 = 12 * dpr, sy0 = ch - 14 * dpr;
  if (step > 20 * dpr && step < cw * .5){ g.fillStyle = OUT; g.fillRect(sx0, sy0, step, 3 * dpr); for (const f of [0, .5, 1]) g.fillRect(sx0 + step * f - dpr, sy0 - 3 * dpr, 2 * dpr, 9 * dpr); g.font = Math.round(11 * dpr) + 'px ' + fB; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText('500 Schritt', sx0, sy0 - 4 * dpr); }
  mapTipUpdate();
}
/* nach dem Öffnen: solange die Karte offen ist, Kacheln malen und den Ring pulsieren lassen */
function mapLoop(){
  MV.raf = 0;
  if ($('ovMap').hidden) return;
  if (WAY.job) wayStep(6);   // der Weg wird auch bei offener Karte weiter gesucht
  const left = mapPaintSome(14), now = performance.now();
  if (MV.dirty || left || now - (MV.drawT || 0) > 120){ MV.drawT = now; drawFullMap(); }
  MV.raf = requestAnimationFrame(mapLoop);
}
function openMap(){
  if (!openPanel('ovMap')) return;
  mapSize();
  if (!MV.seen){ MV.seen = true; MV.z = 1; mapCenterMe(); MV.z = 3; mapClamp($('mapCv')); }
  else { const me = G.inside ? { x: G.inside.dx, y: G.inside.dy } : DG_ON ? DG_ON.door : G.knight; MV.cx = me.x; MV.cy = me.y; mapClamp($('mapCv')); }
  mapPopClose(); mapLegend(); MV.dirty = true; drawFullMap();
  if (!MV.raf) MV.raf = requestAnimationFrame(mapLoop);
  $('btnMapClose').focus({ preventScroll: true });
}

/* ---------- Hinweise beim Zeigen ---------- */
function mapTipUpdate(){
  const tip = $('mapTip'), P = MV.pointer; if (!P){ tip.hidden = true; return; }
  let best = null, bd = 1e9;
  for (const h of MV.hits){ const d = Math.hypot(h.x - P.x, h.y - P.y); if (d < Math.max(h.r, 10 * MV.dpr) && d < bd){ bd = d; best = h; } }
  if (!best){ tip.hidden = true; return; }
  tip.textContent = ''; tip.append(el('b', null, best.t)); if (best.sub) tip.append(el('small', null, best.sub));
  tip.hidden = false;
  const box = tip.parentElement, bx = P.x / MV.dpr, by = P.y / MV.dpr, tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = clamp(bx + 14, 4, box.clientWidth - tw - 4) + 'px'; tip.style.top = clamp(by - th - 10, 4, box.clientHeight - th - 4) + 'px';
}

/* ---------- Legende mit Filtern ---------- */
function mapLegend(){
  const L = $('mapLegend'); if (L.childElementCount) { for (const b of L.querySelectorAll('[data-mf]')) b.setAttribute('aria-pressed', String(MF[b.dataset.mf])); return; }
  const ICO = { gebiete: null, gasthaus: 'gasthaus', dienste: 'schmied', auftrag: null, anfuehrer: 'anfuehrer', gewoelbe: 'tor', ritter: null };
  for (const [k, name] of MAP_FILTERS){
    const b = el('button', 'mchip'); b.type = 'button'; b.dataset.mf = k; b.setAttribute('aria-pressed', String(MF[k]));
    if (ICO[k]){ const im = el('img'); im.src = urlOf(MI[ICO[k]], 2); im.alt = ''; b.append(im); }
    else { const sw = el('span', 'msw ' + k); b.append(sw); }
    b.append(name);
    b.addEventListener('click', () => { MF[k] = !MF[k]; b.setAttribute('aria-pressed', String(MF[k])); mfSave(); MV.dirty = true; drawFullMap(); });
    L.append(b);
  }
  const key = el('p', 'mkey');
  for (const [c2, t] of [['#1f5a2a', 'sicher'], ['#6a6458', 'leicht'], ['#2a1c12', 'passend'], ['#9a5a10', 'fordernd'], ['#8e1414', 'gefährlich']]){ const sp = el('span', null, t); sp.style.color = c2; key.append(sp, ' '); }
  key.prepend('Gebiete nach Eurer Stufe: ');
  const ex = el('p', 'mexpl'); ex.id = 'mapExpl';
  L.append(key, ex);
}

/* ============ Ziel, Notizen und Wegfindung (Version 35) ============
   Ein Tippen auf die Karte öffnet ein kleines Fenster: Ziel setzen, Notiz schreiben, Ziel oder Notiz löschen. Der Weg zum Ziel wird im
   Kollisionsraster (8 Weltpixel) mit A* gesucht, in Stücken von wenigen Millisekunden je Bild; Straßen kosten weniger, so folgt der Weg den
   Straßen und Brücken. Er steht golden auf der großen und der kleinen Karte und als Punkte am Boden, ein heller Pfeil am Bildrand führt ihn
   entlang. Wer vom Weg abkommt, bekommt nach zwei Sekunden einen neuen. Ziel und Notizen stehen im Spielstand. */
const PF = { ok: null, tc: null, g: null, par: null, st: null, gen: 0, heap: null, hf: null };
const PF_DC = [1, -1, 0, 0, 1, 1, -1, -1], PF_DR = [0, 0, 1, -1, 1, -1, 1, -1];
function pfInit(){
  if (PF.ok) return;
  const N = wo_CW * wo_CH, ok = PF.ok = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (wo_REACH[i] && !wo_COL[i] && !wo_COL[i + 1] && i % wo_CW < wo_CW - 1) ok[i] = 1;   // der Ritter steht auf (i, i + 1)
  PF.tc = new Uint8Array(N); PF.g = new Float32Array(N); PF.par = new Int32Array(N); PF.st = new Uint32Array(N);
  PF.heap = new Int32Array(1 << 21); PF.hf = new Float32Array(1 << 21);
}
const pfX = i => ((i % wo_CW) * 8 + 8) * WS, pfY = i => (((i / wo_CW) | 0) * 8 + 6) * WS;
/* nächster begehbarer Knoten zu einem Punkt in Spielpixeln (Ring um Ring) */
function pfNode(gx, gy, maxD){
  pfInit();
  const c0 = Math.round((gx / WS - 8) / 8), r0 = Math.round((gy / WS - 6) / 8);
  for (let d = 0; d <= (maxD || 60); d++){
    let best = -1, bd = 1e9;
    for (let r = r0 - d; r <= r0 + d; r++){
      if (r < 0 || r >= wo_CH) continue;
      const edge = r === r0 - d || r === r0 + d;
      for (let c = c0 - d; c <= c0 + d; c += edge ? 1 : 2 * d){
        if (c < 0 || c >= wo_CW - 1) continue;
        const i = r * wo_CW + c; if (!PF.ok[i]) continue;
        const q = (c - c0) * (c - c0) + (r - r0) * (r - r0); if (q < bd){ bd = q; best = i; }
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}
function pfPush(j, n, f){
  const H = PF.heap, F = PF.hf; if (j.hn >= H.length){ j.over = true; return; }
  let i = j.hn++;
  while (i > 0){ const p = (i - 1) >> 1; if (F[p] <= f) break; H[i] = H[p]; F[i] = F[p]; i = p; }
  H[i] = n; F[i] = f;
}
function pfPop(j){
  const H = PF.heap, F = PF.hf, top = H[0], n = --j.hn;
  if (n > 0){
    const x = H[n], fx = F[n]; let i = 0;
    for (;;){ let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && F[c + 1] < F[c]) c++; if (F[c] >= fx) break; H[i] = H[c]; F[i] = F[c]; i = c; }
    H[i] = x; F[i] = fx;
  }
  return top;
}
function pfStart(s, t){
  pfInit();
  const j = { s, t, gen: ++PF.gen, hn: 0, n: 0, done: false, over: false, path: null, tx: t % wo_CW, ty: (t / wo_CW) | 0 };
  PF.g[s] = 0; PF.par[s] = -1; PF.st[s] = j.gen * 4 + 1; pfPush(j, s, 0);
  return j;
}
/* Kosten eines Knotens: auf der Straße 0,6, sonst 1 (einmal nachgeschlagen) */
function pfTc(n){
  let v = PF.tc[n];
  if (!v) v = PF.tc[n] = wo_rsd((n % wo_CW) * 8 + 8, ((n / wo_CW) | 0) * 8 + 6) < 1 ? 1 : 2;
  return v === 1 ? .6 : 1;
}
/* A* weiterrechnen, höchstens ms Millisekunden; true, wenn fertig (j.path: Punkte oder null, wenn kein Weg) */
function pfRun(j, ms){
  if (j.done) return true;
  const t0 = performance.now(), ok = PF.ok, g = PF.g, par = PF.par, st = PF.st, CW = wo_CW, N = ok.length, open = j.gen * 4 + 1, shut = open + 1;
  let it = 0;
  while (j.hn > 0 && !j.over){
    if ((++it & 511) === 0 && performance.now() - t0 > ms) return false;
    const i = pfPop(j); if (st[i] === shut) continue;
    st[i] = shut; j.n++;
    if (i === j.t){ j.done = true; j.path = pfTrace(j); return true; }
    if (j.n > 700000) break;
    const c = i % CW, gi = g[i];
    for (let k = 0; k < 8; k++){
      const dc = PF_DC[k], dr = PF_DR[k], nc = c + dc; if (nc < 0 || nc >= CW - 1) continue;
      const n = i + dr * CW + dc; if (n < 0 || n >= N || !ok[n]) continue;
      if (dc && dr && (!ok[i + dc] || !ok[i + dr * CW])) continue;   // keine Ecken abschneiden
      const sn = st[n]; if (sn === shut) continue;
      const ng = gi + (dc && dr ? 1.414 : 1) * pfTc(n);
      if (sn === open && ng >= g[n]) continue;
      g[n] = ng; par[n] = i; st[n] = open;
      const dx = Math.abs(nc - j.tx), dy = Math.abs(((n / CW) | 0) - j.ty);
      pfPush(j, n, ng + (Math.max(dx, dy) + .414 * Math.min(dx, dy)) * .78);
    }
  }
  j.done = true; j.path = null; return true;
}
function pfTrace(j){
  const P = []; for (let i = j.t, n = 0; i >= 0 && n < 200000; i = PF.par[i], n++){ P.push([pfX(i), pfY(i)]); if (i === j.s) break; }
  P.reverse();
  return pfSimplify(P, 13 * WS);
}
/* Douglas-Peucker: Treppenstufen weg, Biegungen der Straße bleiben */
function pfSimplify(P, eps){
  if (P.length < 3) return P.map(p => ({ x: p[0], y: p[1] }));
  const keep = new Uint8Array(P.length), stack = [[0, P.length - 1]]; keep[0] = keep[P.length - 1] = 1;
  while (stack.length){
    const [a, b] = stack.pop(), ax = P[a][0], ay = P[a][1], bx = P[b][0], by = P[b][1], L = Math.hypot(bx - ax, by - ay) || 1;
    let md = 0, mi = -1;
    for (let i = a + 1; i < b; i++){ const d = Math.abs((bx - ax) * (ay - P[i][1]) - (ax - P[i][0]) * (by - ay)) / L; if (d > md){ md = d; mi = i; } }
    if (md > eps){ keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  const out = []; for (let i = 0; i < P.length; i++) if (keep[i]) out.push({ x: P[i][0], y: P[i][1] });
  return out;
}

const WAY = { job: null, pts: null, i: 0, px: 0, py: 0, left: 0, planT: -9, fail: false, told: null };
const wayFrom = () => G.inside ? { x: G.inside.dx, y: G.inside.dy } : DG_ON ? DG_ON.door : G.knight;
const placeName = (x, y) => { const z = gZone(x, y); return z ? z.name : 'Ziel'; };
function waySet(x, y, t){
  HERO.way = { x: Math.round(x), y: Math.round(y), t: cleanText(t || 'Ziel', 40) || 'Ziel' };
  WAY.pts = null; WAY.fail = false; WAY.job = null; WAY.told = null; wayPlan(); MV.dirty = true; markDirty();
  Sound.choose();
  logLine('Neues Ziel: ' + HERO.way.t + '. Der goldene Weg steht auf der Karte, der helle Pfeil führt Euch hin.', '#f4ecd8');
}
function wayClear(why){
  if (!HERO || !HERO.way) return;
  HERO.way = null; WAY.pts = null; WAY.job = null; WAY.fail = false; MV.dirty = true; markDirty();
  if (why) logLine(why, '#f4ecd8');
}
function wayPlan(){
  const w = HERO && HERO.way; if (!w) return;
  const me = wayFrom(), s = pfNode(me.x, me.y), t = pfNode(w.x, w.y);
  WAY.planT = nowS();
  if (s < 0 || t < 0){ WAY.job = null; WAY.fail = true; return; }
  WAY.job = pfStart(s, t);
}
function wayStep(ms){
  const j = WAY.job; if (!j) return;
  if (!pfRun(j, ms)) return;
  WAY.job = null; MV.dirty = true;
  if (j.path){ WAY.pts = j.path; WAY.i = 0; WAY.fail = false; if (!G.inside && !DG_ON) wayProgress(); else { WAY.px = j.path[0].x; WAY.py = j.path[0].y; } }
  else {
    WAY.pts = null; WAY.fail = true;
    if (HERO.way && WAY.told !== HERO.way){ WAY.told = HERO.way; logLine('Zu „' + HERO.way.t + '“ führt kein Weg über Land. Der Pfeil zeigt die Richtung.', '#d8c69c'); }
  }
}
/* jedes Bild in der offenen Welt (Teil 13) */
function wayTick(){
  if (!HERO || !HERO.way || G.mode === 'title') return;
  if (WAY.job){ wayStep(3); return; }
  if (G.inside || DG_ON) return;
  const k = G.knight, w = HERO.way;
  if (Math.hypot(w.x - k.x, w.y - k.y) < 90){ showBanner('Am Ziel', w.t); Sound.quest(); wayClear('Ihr seid am Ziel: ' + w.t + '.'); return; }
  if (!WAY.pts){ if (!WAY.fail && nowS() - WAY.planT > 1) wayPlan(); return; }
  if (wayProgress() > 170 && nowS() - WAY.planT > 2) wayPlan();
}
/* wo auf dem Weg steht der Ritter, wie weit ist es noch? Abstand zum Weg in Spielpixeln */
function wayProgress(){
  const P = WAY.pts, k = G.knight;
  if (P.length === 1){ WAY.i = 0; WAY.px = P[0].x; WAY.py = P[0].y; WAY.left = Math.hypot(P[0].x - k.x, P[0].y - k.y); return WAY.left; }
  let best = 1e9, bi = WAY.i, bx = P[0].x, by = P[0].y;
  for (let i = Math.max(0, WAY.i - 1); i < Math.min(P.length - 1, WAY.i + 14); i++){
    const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1, t = clamp(((k.x - a.x) * dx + (k.y - a.y) * dy) / L2, 0, 1), x = a.x + dx * t, y = a.y + dy * t, d = Math.hypot(k.x - x, k.y - y);
    if (d < best){ best = d; bi = i; bx = x; by = y; }
  }
  WAY.i = bi; WAY.px = bx; WAY.py = by;
  let left = Math.hypot(P[bi + 1].x - bx, P[bi + 1].y - by);
  for (let i = bi + 1; i < P.length - 1; i++) left += Math.hypot(P[i + 1].x - P[i].x, P[i + 1].y - P[i].y);
  WAY.left = left;
  return best;
}
/* Punkt d Spielpixel weiter auf dem Weg */
function wayAhead(d){
  const P = WAY.pts; let x = WAY.px, y = WAY.py;
  for (let i = WAY.i + 1; i < P.length; i++){ const L = Math.hypot(P[i].x - x, P[i].y - y); if (L >= d) return { x: x + (P[i].x - x) * d / L, y: y + (P[i].y - y) * d / L }; d -= L; x = P[i].x; y = P[i].y; }
  return { x, y };
}
/* für den hellen Pfeil am Bildrand (Teil 15) */
function wayTarget(){
  const w = HERO && HERO.way; if (!w || G.inside || DG_ON) return null;
  const k = G.knight, steps = Math.round((WAY.pts ? WAY.left : Math.hypot(w.x - k.x, w.y - k.y)) / 2), p = WAY.pts ? wayAhead(380) : w;
  return { x: p.x, y: p.y, label: w.t + ' · ' + steps + ' Schritt', always: true };
}
/* goldene Punkte am Boden, die zum Ziel wandern, und das Fähnchen am Ziel (Teil 15, unter den Requisiten) */
function wayGround(cam){
  const w = HERO && HERO.way; if (!w || G.mode === 'title') return;
  if (WAY.pts){
    const P = WAY.pts, sp = 34, ph = G.t * 40; let x = WAY.px, y = WAY.py, carry = sp - ph % sp, n = 0;
    for (let i = WAY.i + 1; i < P.length && n < 70; i++){
      const dx = P[i].x - x, dy = P[i].y - y, L = Math.hypot(dx, dy) || 1; let s = carry;
      for (; s <= L && n < 70; s += sp, n++){
        const px = Math.round(x + dx * s / L), py = Math.round(y + dy * s / L);
        if (n < 1 || !inView(px, py, cam)) continue;
        // kleine goldene Raute; eine helle Welle läuft zum Ziel
        const hi = ((n + Math.floor(ph / sp)) % 6) === 0;
        ctx.globalAlpha = n > 50 ? (70 - n) / 20 * .9 : .9;
        ctx.fillStyle = OUT; ctx.fillRect(px - 1, py - 4, 3, 8); ctx.fillRect(px - 3, py - 2, 7, 4); ctx.fillRect(px - 2, py - 3, 5, 6);
        ctx.fillStyle = hi ? '#fff6c0' : '#ffd541'; ctx.fillRect(px, py - 3, 1, 6); ctx.fillRect(px - 2, py - 1, 5, 2); ctx.fillRect(px - 1, py - 2, 3, 4);
        ctx.fillStyle = hi ? '#ffffff' : '#fff0a0'; ctx.fillRect(px - 1, py - 2, 1, 1);
      }
      carry = s - L; x = P[i].x; y = P[i].y;
    }
    ctx.globalAlpha = 1;
  }
  if (inView(w.x, w.y, cam, 40)){
    const x = Math.round(w.x), y = Math.round(w.y), f = (G.t * 4 | 0) % 2;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - 5, y - 1, 11, 3);
    ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 34, 3, 35); ctx.fillRect(x + 1, y - 35, 16, 11);
    ctx.fillStyle = '#e8dcbc'; ctx.fillRect(x, y - 33, 1, 33);
    ctx.fillStyle = '#ffd541'; ctx.fillRect(x + 2, y - 34, 14, 9 - f); ctx.fillStyle = '#c9a227'; ctx.fillRect(x + 2, y - 27 - f, 14, 2);
    ctx.fillStyle = '#b0242a'; ctx.fillRect(x + 7, y - 32, 4, 4);
  }
}

/* ---------- Fenster auf der Karte: Ziel und Notizen ---------- */
function mapPopClose(){ const b = $('mapPop'); if (b){ b.hidden = true; b.textContent = ''; } MV.pop = null; }
function mapPopPlace(P){
  const box = $('mapPop'), wrap = box.parentElement, bx = P.x / MV.dpr, by = P.y / MV.dpr;
  box.style.left = clamp(bx + 12, 4, wrap.clientWidth - box.offsetWidth - 4) + 'px'; box.style.top = clamp(by - box.offsetHeight - 8, 4, wrap.clientHeight - box.offsetHeight - 4) + 'px';
}
function mapPopOpen(P){
  if (!HERO || G.mode === 'title') return;
  const c = $('mapCv'), s = mapS(c), gx = MV.cx + (P.x - c.width / 2) * s, gy = MV.cy + (P.y - c.height / 2) * s, near = 14 * MV.dpr * s;
  let best = null, bd = 1e9;
  for (const h of MV.hits){ const d = Math.hypot(h.x - P.x, h.y - P.y); if (h.gx != null && d < Math.max(h.r, 12 * MV.dpr) && d < bd){ bd = d; best = h; } }
  const note = HERO.notes.find(n => Math.hypot(n.x - gx, n.y - gy) < near), goal = HERO.way && Math.hypot(HERO.way.x - gx, HERO.way.y - gy) < near;
  const box = $('mapPop'); box.textContent = ''; $('mapTip').hidden = true;
  if (best && best.t !== HERO.name){ box.append(el('b', null, best.t)); if (best.sub) box.append(el('small', null, best.sub)); }
  else if (note){ box.append(el('b', null, note.t)); box.append(el('small', null, 'Eure Notiz')); }
  else { box.append(el('b', null, placeName(gx, gy))); box.append(el('small', null, exSeen(gx, gy) ? 'erkundet' : 'noch unerkundet')); }
  const row = el('div', 'mprow'), tx = best && best.t !== HERO.name ? best.gx : gx, ty = best && best.t !== HERO.name ? best.gy : gy;
  if (goal) row.append(btn('Ziel löschen', () => { wayClear('Ziel gelöscht.'); mapPopClose(); drawFullMap(); }));
  else row.append(btn(HERO.way ? 'Neues Ziel hier' : 'Ziel setzen', () => { waySet(tx, ty, best && best.t !== HERO.name ? best.t : note ? note.t : placeName(gx, gy)); mapPopClose(); drawFullMap(); }));
  if (note) row.append(btn('Notiz löschen', () => { HERO.notes = HERO.notes.filter(n => n !== note); markDirty(); mapPopClose(); MV.dirty = true; drawFullMap(); }));
  else row.append(btn('Notiz …', () => mapNoteEdit(P, gx, gy)));
  const x = btn('×', mapPopClose, 'tbtn mpx'); x.setAttribute('aria-label', 'Schließen'); row.append(x);
  box.append(row); box.hidden = false; MV.pop = { gx, gy };
  mapPopPlace(P);
}
function mapNoteEdit(P, gx, gy){
  const box = $('mapPop'); box.textContent = '';
  box.append(el('b', null, 'Notiz auf der Karte'));
  const inp = el('input'); inp.type = 'text'; inp.maxLength = 40; inp.placeholder = 'z. B. Kräuter am Bach'; inp.className = 'mpin';
  const save = () => {
    const t = cleanText(inp.value, 40); if (!t){ mapPopClose(); return; }
    HERO.notes.push({ x: Math.round(gx), y: Math.round(gy), t });
    if (HERO.notes.length > 24){ HERO.notes.shift(); logLine('Die älteste Notiz ist vom Rand der Karte gefallen (höchstens 24).', '#d8c69c'); }
    markDirty(); mapPopClose(); MV.dirty = true; drawFullMap();
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); save(); } else if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); mapPopClose(); } e.stopPropagation(); });
  const row = el('div', 'mprow'); row.append(btn('Merken', save), btn('Abbrechen', mapPopClose));
  box.append(inp, row); box.hidden = false; mapPopPlace(P);
  inp.focus({ preventScroll: true });
}
/* Ziel und Notizen aus dem Spielstand prüfen (aus cleanHero, Teil 11) */
function kaHero(h){
  const okPt = o => o && typeof o === 'object' && isFinite(o.x) && isFinite(o.y) && o.x >= 0 && o.y >= 0 && o.x <= GW && o.y <= GH;
  h.way = okPt(h.way) ? { x: Math.round(h.way.x), y: Math.round(h.way.y), t: cleanText(h.way.t, 40) || 'Ziel' } : null;
  h.notes = Array.isArray(h.notes) ? h.notes.filter(okPt).slice(-24).map(n => ({ x: Math.round(n.x), y: Math.round(n.y), t: cleanText(n.t, 40) || 'Notiz' })) : [];
  WAY.pts = null; WAY.job = null; WAY.fail = false; WAY.i = 0; WAY.told = null; WAY.planT = -9;
  exLoad(h);
}

/* ============ Erkundung (Version 35) ============
   Das Land ist in Felder zu 64 Weltpixeln geteilt (144 × 72). Was der Ritter in rund 380 Weltpixeln um sich sieht, ist erkundet; der
   Spielstand hält es als Bitfeld (Base64). Felder, die man zu Fuß nie erreicht, zählen nicht mit. Sind drei Viertel eines Gebiets erkundet,
   gibt es Erfahrung und Gulden. Unerkundetes liegt auf der großen und der kleinen Karte unter Pergamentnebel, Zeichen dort sind verborgen.
   Ritter, die schon vor dieser Fassung unterwegs waren, kennen die Städte und alle Gebiete bis zu ihrer Stufe (ohne Lohn dafür). */
const EX = { W: WW >> 6, H: WH >> 6, bits: null, cnt: null, tot: null, cellZ: null, ok: null, fog: null, fg: null, fid: null, dirty: true, t: 0, hero: null };
function exInit(){
  if (EX.cellZ) return;
  const W = EX.W, H = EX.H, N = W * H, walk = new Uint8Array(N);
  for (let r = 0; r < wo_CH; r++) for (let c = 0; c < wo_CW; c++) if (wo_REACH[r * wo_CW + c]) walk[(r >> 3) * W + (c >> 3)] = 1;
  EX.ok = new Uint8Array(N); EX.cellZ = new Uint8Array(N); EX.tot = new Uint16Array(ZONES.length);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++){
    const n = j * W + i; EX.cellZ[n] = wo_zid(i * 64 + 32, j * 64 + 32);
    let ok = 0;
    for (let dj = -1; dj <= 1 && !ok; dj++) for (let di = -1; di <= 1; di++){ const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < W && b < H && walk[b * W + a]){ ok = 1; break; } }
    EX.ok[n] = ok; if (ok) EX.tot[EX.cellZ[n]]++;
  }
}
const exBit = n => EX.bits[n >> 3] >> (n & 7) & 1;
const exSeen = (gx, gy) => { if (!EX.bits) return true; const i = clamp(Math.floor(gx / WS / 64), 0, EX.W - 1), j = clamp(Math.floor(gy / WS / 64), 0, EX.H - 1); return !!exBit(j * EX.W + i); };
const exPack = () => { let s = ''; for (let i = 0; i < EX.bits.length; i++) s += String.fromCharCode(EX.bits[i]); return btoa(s); };
const exZoneIdx = id => ZONES.indexOf(ZONE_BY_ID[id]);
const exFrac = zi => EX.tot[zi] ? EX.cnt[zi] / EX.tot[zi] : 0;
const exZones = () => ZONES.filter((z, i) => EX.tot[i] >= 4);
function exCount(){ const c = EX.cnt = new Uint16Array(ZONES.length); for (let n = 0; n < EX.W * EX.H; n++) if (EX.ok[n] && exBit(n)) c[EX.cellZ[n]]++; }
function exLoad(h){
  exInit();
  const N = EX.W * EX.H, bits = new Uint8Array((N + 7) >> 3);
  let fresh = true;
  if (typeof h.seen === 'string' && h.seen.length < 4000){ try { const s = atob(h.seen); for (let i = 0; i < Math.min(s.length, bits.length); i++) bits[i] = s.charCodeAt(i); fresh = false; } catch(e){} }
  h.expl = h.expl && typeof h.expl === 'object' ? Object.fromEntries(Object.keys(h.expl).filter(id => ZONE_BY_ID[id]).map(id => [id, 1])) : {};
  EX.bits = bits; EX.hero = h;
  if (fresh && (h.lvl > 1 || h.kills > 0)){
    for (let n = 0; n < N; n++){ const z = ZONES[EX.cellZ[n]]; if (z && (SAFE[z.id] || (ZONE_LV[z.id] && ZONE_LV[z.id][0] <= h.lvl))) bits[n >> 3] |= 1 << (n & 7); }
    exCount();
    ZONES.forEach((z, i) => { if (EX.tot[i] >= 4 && exFrac(i) >= .75) h.expl[z.id] = 1; });
  }
  exCount(); h.seen = exPack(); EX.dirty = true; EX.t = 0;
}
/* jedes Bild in der offenen Welt (Teil 13): Felder um den Ritter aufdecken */
function exTick(dt){
  if (!EX.bits || EX.hero !== HERO || G.inside || DG_ON || G.mode === 'title') return;
  if ((EX.t -= dt) > 0) return;
  EX.t = .25;
  const k = G.knight, ci = k.x / WS / 64, cj = k.y / WS / 64, rc = 380 / 64, touched = new Set();
  let n0 = 0;
  for (let j = Math.max(0, Math.floor(cj - rc)); j <= Math.min(EX.H - 1, Math.floor(cj + rc)); j++)
    for (let i = Math.max(0, Math.floor(ci - rc)); i <= Math.min(EX.W - 1, Math.floor(ci + rc)); i++){
      const dx = i + .5 - ci, dy = j + .5 - cj; if (dx * dx + dy * dy > rc * rc) continue;
      const n = j * EX.W + i, b = 1 << (n & 7); if (EX.bits[n >> 3] & b) continue;
      EX.bits[n >> 3] |= b; n0++;
      if (EX.ok[n]){ EX.cnt[EX.cellZ[n]]++; touched.add(EX.cellZ[n]); }
    }
  if (!n0) return;
  HERO.seen = exPack(); EX.dirty = true; MV.dirty = true;
  for (const zi of touched){ const z = ZONES[zi]; if (z && !HERO.expl[z.id] && EX.tot[zi] >= 4 && exFrac(zi) >= .75) exReward(z, zi); }
}
function exReward(z){
  HERO.expl[z.id] = 1;
  const lv = ZONE_LV[z.id], L = clamp(lv ? Math.round((lv[0] + lv[1]) / 2) : HERO.lvl - 2, 1, HERO.lvl), xp = Math.max(10, Math.round(xpNeed(L) * .12)), gold = 8 + L * 4;
  const done = Object.keys(HERO.expl).length, all = exZones().length;
  HERO.gold += gold; Sound.quest(); gainXp(xp);
  showBanner('Gebiet erkundet', z.name + ' · ' + done + ' von ' + all);
  logLine('Gebiet erkundet: ' + z.name + ' (+' + xp + ' Erfahrung, +' + gold + ' Gulden). ' + done + ' von ' + all + ' Gebieten erkundet.', '#ecd27a');
  if (done >= all) logLine('Ihr habt das ganze Königsland erkundet! Kein Kartenmacher kennt es besser.', '#ffd541');
  updateHud(); markDirty(true);
}
/* Nebel: ein Bildpunkt je Feld, unerkundet Pergament, erkundet durchsichtig; vergrößert und weich gezeichnet */
function exFog(){
  if (!EX.fog){ EX.fog = canvasOf(EX.W, EX.H); EX.fg = EX.fog.getContext('2d'); EX.fid = EX.fg.createImageData(EX.W, EX.H); }
  if (!EX.dirty || !EX.bits) return EX.fog;
  const D = EX.fid.data;
  for (let n = 0; n < EX.W * EX.H; n++){ const o = n * 4, h = (Math.imul(n, 2654435761) >>> 27) & 15; D[o] = 222 - h; D[o + 1] = 206 - h; D[o + 2] = 168 - h; D[o + 3] = exBit(n) ? 0 : 238; }
  EX.fg.putImageData(EX.fid, 0, 0); EX.dirty = false;
  return EX.fog;
}

/* ---------- Bedienung: Ziehen, Rad, Spreizen, Doppelklick, Tasten, Knöpfe ---------- */
(() => {
  const c = $('mapCv'), pos = e => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; };
  c.addEventListener('wheel', e => { e.preventDefault(); const p = pos(e); mapZoomAt(Math.exp(-e.deltaY * .0016), p.x, p.y); drawFullMap(); }, { passive: false });
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); MV.pts.set(e.pointerId, pos(e)); MV.moved = 0; if (MV.pts.size === 1) MV.multi = false; if (MV.pop) mapPopClose(); clearTimeout(MV.popT); if (MV.pts.size === 2){ MV.multi = true; const [a, b] = [...MV.pts.values()]; MV.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; } });
  c.addEventListener('pointermove', e => {
    const p = pos(e); MV.pointer = p;
    if (MV.pts.has(e.pointerId)){
      const old = MV.pts.get(e.pointerId); MV.pts.set(e.pointerId, p);
      if (MV.pts.size === 1){ const s = mapS(c); MV.cx -= (p.x - old.x) * s; MV.cy -= (p.y - old.y) * s; MV.moved += Math.abs(p.x - old.x) + Math.abs(p.y - old.y); mapClamp(c); MV.dirty = true; c.style.cursor = 'grabbing'; }
      else if (MV.pts.size === 2 && MV.pinch){ const [a, b] = [...MV.pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (MV.pinch.d > 0) mapZoomAt(d / MV.pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); MV.pinch.d = d; MV.moved += 99; }
      drawFullMap();
    } else mapTipUpdate();
  });
  // ein Tippen ohne Ziehen: kurz warten (Doppelklick zoomt), dann das Fenster für Ziel und Notiz
  const up = e => {
    const had = MV.pts.delete(e.pointerId); if (MV.pts.size < 2) MV.pinch = null; c.style.cursor = '';
    if (had && !MV.pts.size && !MV.multi && MV.moved < 8 && e.type === 'pointerup'){ const p = pos(e); clearTimeout(MV.popT); MV.popT = setTimeout(() => { if (!$('ovMap').hidden) mapPopOpen(p); }, 260); }
  };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse'){ MV.pointer = null; mapTipUpdate(); } });
  c.addEventListener('dblclick', e => { clearTimeout(MV.popT); mapPopClose(); const p = pos(e); mapZoomAt(2, p.x, p.y); drawFullMap(); });
  const mid = () => [c.width / 2, c.height / 2];
  $('mapZin').addEventListener('click', () => { mapZoomAt(1.7, ...mid()); drawFullMap(); });
  $('mapZout').addEventListener('click', () => { mapZoomAt(1 / 1.7, ...mid()); drawFullMap(); });
  $('mapMe').addEventListener('click', () => { mapCenterMe(); drawFullMap(); });
  $('mapAll').addEventListener('click', () => { mapZoomTo(1, GW / 2, GH / 2); drawFullMap(); });
  addEventListener('keydown', e => {
    if ($('ovMap').hidden || (e.target && e.target.closest && e.target.closest('input, textarea'))) return;
    const s = mapS(c), step = Math.min(c.width, c.height) * .18 * s, K = e.code;
    if (MV.pop && K === 'Escape'){ e.preventDefault(); e.stopPropagation(); mapPopClose(); return; }
    let done = true;
    if (K === 'Equal' || K === 'NumpadAdd' || e.key === '+') mapZoomAt(1.5, ...mid());
    else if (K === 'Minus' || K === 'NumpadSubtract' || e.key === '-') mapZoomAt(1 / 1.5, ...mid());
    else if (K === 'ArrowLeft' || K === 'KeyA') MV.cx -= step; else if (K === 'ArrowRight' || K === 'KeyD') MV.cx += step;
    else if (K === 'ArrowUp' || K === 'KeyW') MV.cy -= step; else if (K === 'ArrowDown' || K === 'KeyS') MV.cy += step;
    else if (K === 'Space' || K === 'KeyC') mapCenterMe(); else if (K === 'Digit0' || K === 'Numpad0') mapZoomTo(1, GW / 2, GH / 2);
    else if (K === 'Delete' || K === 'Backspace'){ if (HERO.way) wayClear('Ziel gelöscht.'); }
    else if (K === 'Enter' && !(e.target && e.target.closest && e.target.closest('button'))) mapPopOpen({ x: c.width / 2, y: c.height / 2 });   // Fenster für die Kartenmitte
    else done = false;
    if (done){ e.preventDefault(); e.stopPropagation(); mapClamp(c); MV.dirty = true; drawFullMap(); }
  }, true);
  addEventListener('resize', () => { if (!$('ovMap').hidden){ MV.dirty = true; drawFullMap(); } });
  // die kleine Karte im Spielbild antippen: große Karte öffnen
  cv.addEventListener('pointerdown', e => {
    if (!G || G.mode !== 'play' || G.inside || DG_ON || G.scene) return;
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
    const x0 = W - (MM_W + 4) * MM_Z - 6, y0 = H - (MM_H + 4) * MM_Z - 6;
    if (x >= x0 && y >= y0 && x <= W - 6 && y <= H - 6){ e.preventDefault(); e.stopPropagation(); openMap(); }
  }, true);
})();
