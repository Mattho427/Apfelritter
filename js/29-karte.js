"use strict";
/* Der Apfelritter, Teil 29 von 30: Die große Karte: Zoomen und Verschieben, Detailkacheln, Zeichen für Orte und Leute, Beschriftungen ohne
   Überdeckung, Gebietsstufen nach Gefahr, Legende mit Filtern, Hinweise beim Zeigen.
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
  rast: ['....t....', '...tkt...', '..tkkkt..', '.tkkkkkt.', 'tkkkkkkkt', 'tkk.t.kkt', 'ttttttttt', '.........', '.........']
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
  g.imageSmoothingEnabled = false;
  const u = Math.max(1, Math.round(dpr * (MV.z >= 3 ? 2 : MV.z >= 1.6 ? 1.5 : 1.2) * 2) / 2), inV = (x, y, m) => X(x) > -m && X(x) < cw + m && Y(y) > -m && Y(y) < ch + m;
  const hit = (x, y, r, t, sub) => MV.hits.push({ x: X(x), y: Y(y), r, t, sub });
  const icon = (key, x, y, t, sub, sc) => { const im = MI[key]; if (!im || !inV(x, y, 20)) return; const w = im.width * u * (sc || 1), h = im.height * u * (sc || 1); g.drawImage(im, Math.round(X(x) - w / 2), Math.round(Y(y) - h / 2), Math.round(w), Math.round(h)); hit(x, y, w * .7, t, sub); };
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
  // Beschriftungen: Städte und Burgen, Gebiete mit Stufen, Orte
  // erst Städte und Burgen (immer), dann die Gebiete dort, wo noch Platz ist
  for (const z of [...ZONES.filter(z => SAFE[z.id]), ...ZONES.filter(z => !SAFE[z.id])]){
    const safe = !!SAFE[z.id], [col, dg] = zoneDanger(z.id), lv = zoneLvText(z.id);
    if (!safe && !MF.gebiete) continue;
    if (label(z.name, z.label.x * WS, z.label.y * WS, safe ? 17 : 14, safe ? '#2a1c12' : col, fD, safe ? '' : lv + (dg && dg !== 'passend' ? ' · ' + dg : ''), col, safe))
      hit(z.label.x * WS, z.label.y * WS, 30 * dpr, z.name, (lv || '') + (ZONE_INFO[z.id] ? (lv ? ' · ' : '') + ZONE_INFO[z.id] : ''));
  }
  if (MV.z >= 1.5) for (const l of MAP_LABELS) if (!ZONES.some(z => z.name === l.name)) label(l.name, l.x * WS, l.y * WS, 12, '#3a2a1a', fD);
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
    if (!inV(p.x, p.y, 20)) continue;
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
  const left = mapPaintSome(14), now = performance.now();
  if (MV.dirty || left || now - (MV.drawT || 0) > 120){ MV.drawT = now; drawFullMap(); }
  MV.raf = requestAnimationFrame(mapLoop);
}
function openMap(){
  if (!openPanel('ovMap')) return;
  mapSize();
  if (!MV.seen){ MV.seen = true; MV.z = 1; mapCenterMe(); MV.z = 3; mapClamp($('mapCv')); }
  else { const me = G.inside ? { x: G.inside.dx, y: G.inside.dy } : DG_ON ? DG_ON.door : G.knight; MV.cx = me.x; MV.cy = me.y; mapClamp($('mapCv')); }
  mapLegend(); MV.dirty = true; drawFullMap();
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
  L.append(key);
}

/* ---------- Bedienung: Ziehen, Rad, Spreizen, Doppelklick, Tasten, Knöpfe ---------- */
(() => {
  const c = $('mapCv'), pos = e => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; };
  c.addEventListener('wheel', e => { e.preventDefault(); const p = pos(e); mapZoomAt(Math.exp(-e.deltaY * .0016), p.x, p.y); drawFullMap(); }, { passive: false });
  c.addEventListener('pointerdown', e => { c.setPointerCapture(e.pointerId); MV.pts.set(e.pointerId, pos(e)); MV.moved = 0; if (MV.pts.size === 2){ const [a, b] = [...MV.pts.values()]; MV.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; } });
  c.addEventListener('pointermove', e => {
    const p = pos(e); MV.pointer = p;
    if (MV.pts.has(e.pointerId)){
      const old = MV.pts.get(e.pointerId); MV.pts.set(e.pointerId, p);
      if (MV.pts.size === 1){ const s = mapS(c); MV.cx -= (p.x - old.x) * s; MV.cy -= (p.y - old.y) * s; MV.moved += Math.abs(p.x - old.x) + Math.abs(p.y - old.y); mapClamp(c); MV.dirty = true; c.style.cursor = 'grabbing'; }
      else if (MV.pts.size === 2 && MV.pinch){ const [a, b] = [...MV.pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (MV.pinch.d > 0) mapZoomAt(d / MV.pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); MV.pinch.d = d; MV.moved += 99; }
      drawFullMap();
    } else mapTipUpdate();
  });
  const up = e => { MV.pts.delete(e.pointerId); if (MV.pts.size < 2) MV.pinch = null; c.style.cursor = ''; if (e.pointerType !== 'mouse' && MV.moved < 8){ MV.pointer = pos(e); mapTipUpdate(); } };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse'){ MV.pointer = null; mapTipUpdate(); } });
  c.addEventListener('dblclick', e => { const p = pos(e); mapZoomAt(2, p.x, p.y); drawFullMap(); });
  const mid = () => [c.width / 2, c.height / 2];
  $('mapZin').addEventListener('click', () => { mapZoomAt(1.7, ...mid()); drawFullMap(); });
  $('mapZout').addEventListener('click', () => { mapZoomAt(1 / 1.7, ...mid()); drawFullMap(); });
  $('mapMe').addEventListener('click', () => { mapCenterMe(); drawFullMap(); });
  $('mapAll').addEventListener('click', () => { mapZoomTo(1, GW / 2, GH / 2); drawFullMap(); });
  addEventListener('keydown', e => {
    if ($('ovMap').hidden || (e.target && e.target.closest && e.target.closest('input, textarea'))) return;
    const s = mapS(c), step = Math.min(c.width, c.height) * .18 * s, K = e.code;
    let done = true;
    if (K === 'Equal' || K === 'NumpadAdd' || e.key === '+') mapZoomAt(1.5, ...mid());
    else if (K === 'Minus' || K === 'NumpadSubtract' || e.key === '-') mapZoomAt(1 / 1.5, ...mid());
    else if (K === 'ArrowLeft' || K === 'KeyA') MV.cx -= step; else if (K === 'ArrowRight' || K === 'KeyD') MV.cx += step;
    else if (K === 'ArrowUp' || K === 'KeyW') MV.cy -= step; else if (K === 'ArrowDown' || K === 'KeyS') MV.cy += step;
    else if (K === 'Space' || K === 'KeyC') mapCenterMe(); else if (K === 'Digit0' || K === 'Numpad0') mapZoomTo(1, GW / 2, GH / 2);
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
