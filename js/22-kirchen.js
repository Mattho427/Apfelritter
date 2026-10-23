"use strict";
/* Der Apfelritter, Teil 22 von 23: Kirchen, Priester und Glaube: begehbare Kirchen, Segen, Beichte, Kerzen, Ablass, Wallfahrt, Messe.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */

/* ============ Kirchen, Priester und Glaube ============
   Sechs Kirchen lassen sich betreten, genau wie die Gasthäuser (G.inside, Raum 960 × 540, Tür unten in der Mitte; Mitspieler
   sehen einander drinnen). In jeder wirkt ein Geistlicher: Segen gegen eine Spende, Beichte, Kerzen. Der Burgkaplan schickt
   auf Wallfahrt zu fünf heiligen Orten, im Kaiserdom verkauft ein Ablassprediger Ablassbriefe. Jeden Spieltag um 10 Uhr ist Messe. */
const CH_SEGEN = 1200, CH_MESSE = [10, 11.5], CH_MESSE_NEED = 40;   // Segen 20 Minuten; Messe 10 bis 11:30 Uhr; so lange dabei sein
const chBlessed = () => !!(HERO && HERO.bless && HERO.bless.t > 0);
const chDay = () => Math.floor(skyNow() / DAY_LEN);
const chMesseNow = () => SKY.hour >= CH_MESSE[0] && SKY.hour < CH_MESSE[1];

/* Leute in den Kirchen (von vorn; Betende von hinten, mit Blick zum Altar) */
const CH_ART = {
  kaplan: np_frames({ robe: 'long', hat: 'barett', apron: 'linen', hair: ['h', 'j'] }, { 1: '#141218', 2: '#221e28', 3: '#322c3a', 4: '#463e50', 5: '#141218', 6: '#221e28', 7: '#322c3a', 8: '#463e50' }),
  pfarrer: np_frames({ robe: 'long', hat: 'barett', apron: 'linen', hair: ['w', 'x'] }, { 1: '#141218', 2: '#221e28', 3: '#322c3a', 4: '#463e50', 5: '#141218', 6: '#221e28', 7: '#322c3a', 8: '#463e50', w: '#8a8478', x: '#c8c2b0' }),
  prior: np_frames({ robe: 'long', hat: 'kapuze', rope: true, bald: true, hair: ['w', 'x'] }, { 1: '#121014', 2: '#1c1a20', 3: '#2a262e', 4: '#3a343e', w: '#8a8478', x: '#c8c2b0' }),
  domherr: np_frames({ robe: 'long', hat: 'barett', fur: true, chain: true, hair: ['w', 'x'] }, { 1: '#2a0c1e', 2: '#42142e', 3: '#5e1e40', 4: '#7a2a54', 5: '#141218', 6: '#221e28', 7: '#322c3a', 8: '#463e50', w: '#8a8478', x: '#c8c2b0' }),
  einsiedler: np_frames({ robe: 'long', hat: 'kapuze', rope: true, beard: true, staff: true, hair: ['w', 'x'] }, { 1: '#3a2c1c', 2: '#52402a', 3: '#6a5438', 4: '#806848', w: '#8a8478', x: '#c8c2b0' }),
  kuester: np_frames({ robe: 'short', hat: 'filz', apron: 'leather', beard: true, belt: true, hair: ['h', 'j'] }, { 1: '#2a2a30', 2: '#3a3a42', 3: '#4e4e58', 4: '#62626e', 5: '#3a2c1c', 6: '#52402a', 7: '#6a5438', 8: '#806848' }),
  ablass: np_frames({ robe: 'long', hat: 'kapuze', rope: true, bald: true, staff: true, hair: ['h', 'j'] }, { 1: '#8a8478', 2: '#aaa496', 3: '#c8c2b0', 4: '#e2dcc8', 5: '#141218', 6: '#221e28', 7: '#322c3a', 8: '#463e50' }),
  moench: np_frames({ robe: 'long', hat: 'kapuze', rope: true, bald: true, back: true, hair: ['h', 'j'] }, { 1: '#121014', 2: '#1c1a20', 3: '#2a262e', 4: '#3a343e' }),
  buerger: np_frames({ robe: 'long', hat: 'barett', fur: true, back: true, hair: ['h', 'j'] }, { 1: '#2a3a24', 2: '#3a4e32', 3: '#4e6442', 4: '#647a54', 5: '#2a1a10', 6: '#3e2a1a', 7: '#56402a', 8: '#6e563c' }),
  buergerin: np_frames({ robe: 'long', hat: 'haube', back: true }, { 1: '#3a1418', 2: '#561e22', 3: '#72302e', 4: '#8e443c' }),
  magd: np_frames({ robe: 'long', hat: 'tuch', back: true }, { 1: '#2a3448', 2: '#3a4862', 3: '#4e5e7c', 4: '#647694', 5: '#3a1418', 6: '#561e22', 7: '#72302e', 8: '#8e443c' }),
  bauer: np_frames({ robe: 'short', hat: 'filz', belt: true, back: true, hair: ['h', 'j'] }, { 1: '#3a3020', 2: '#52442c', 3: '#6a5a3a', 4: '#82704a' }),
  baeuerin: np_frames({ robe: 'long', hat: 'tuch', back: true }, { 1: '#4a3a22', 2: '#64502e', 3: '#7e683c', 4: '#98804e', 5: '#5e5a4a', 6: '#7a7660', 7: '#969078', 8: '#b2ac92' })
};
/* die Kirchen: Lage in Weltpixeln (nächster Bau dieser Art), Tür relativ zur Mitte, Innenraum-Stil, Geistliche */
const CH_DEF = [
  { id: 'burgkapelle', name: 'Burgkapelle St. Georg', kind: 'kapelle', at: [1730, 470], door: -18, style: 'kapelle', where: 'in der Reichsburg', pilg: true,
    clergy: [{ id: 'kaplan', art: 'kaplan', name: 'Burgkaplan Ambrosius', role: 'Burgkaplan', segen: true, beichte: true, kerze: true, wallfahrt: true,
      greet: ['Gott zum Gruße, Herr Ritter. Auch der stärkste Arm braucht den Segen des Herrn.', 'Der heilige Georg ist der Schutzpatron der Ritter. Er bezwang den Drachen, Ihr bezwingt das Böse im Reichsland.', 'Wer zu den fünf heiligen Orten des Reichslandes pilgert, kehrt verwandelt heim, sagt man.'] }],
    pray: ['magd', 'bauer'] },
  { id: 'stadtkirche', name: 'Stadtkirche St. Marien', kind: 'kirche', at: [2716, 2322], door: 7, style: 'kirche', where: 'in der Reichsstadt', pilg: true,
    clergy: [{ id: 'pfarrer', art: 'pfarrer', name: 'Pfarrer Johannes Faber', role: 'Stadtpfarrer', segen: true, beichte: true, kerze: true, messe: true,
      greet: ['Friede sei mit Euch. Die Messe ist jeden Tag um zehn Uhr.', 'Die Bürger streiten über die neue Lehre aus Wittenberg. Ich bete, dass die Kirche nicht zerbricht.', 'Eine Kerze für die Verstorbenen kostet wenig und wiegt doch schwer.'] }],
    pray: ['buerger', 'buergerin', 'magd', 'baeuerin'] },
  { id: 'klosterkirche', name: 'Klosterkirche St. Benedikt', kind: 'kirche', at: [1270, 2790], door: 7, style: 'kloster', where: 'beim Kloster', pilg: true,
    clergy: [{ id: 'prior', art: 'prior', name: 'Prior Bernhard', role: 'Prior des Klosters', segen: true, beichte: true, kerze: true,
      greet: ['Ora et labora, Herr Ritter. Bei uns wird gebetet und gearbeitet.', 'Unter dem Kloster liegt die Krypta. Seit einiger Zeit wandeln dort die Toten.', 'Unsere Brüder schreiben noch mit der Feder, obwohl man jetzt Bücher drucken kann.'] }],
    pray: ['moench', 'moench', 'moench', 'bauer'] },
  { id: 'friedhofskapelle', name: 'Friedhofskapelle St. Michael', kind: 'kapelle', at: [1970, 2782], door: -18, style: 'kapelle', where: 'am Friedhof',
    clergy: [{ id: 'kuester', art: 'kuester', name: 'Küster Lukas', role: 'Küster und Totengräber', kerze: true,
      greet: ['Hier halten wir Totenwache. Seit die Toten auf dem Friedhof umgehen, schlafe ich schlecht.', 'Eine Kerze für die armen Seelen? Sie haben es nötig.', 'Der Erzengel Michael wägt die Seelen. Dieser Kapelle ist er Patron.'] }],
    pray: ['baeuerin'] },
  { id: 'wallfahrtskapelle', name: 'Wallfahrtskapelle Unserer Lieben Frau', kind: 'kapelle', at: [5300, 286], door: -18, style: 'kapelle', where: 'über den Weinbergen', pilg: true,
    clergy: [{ id: 'einsiedler', art: 'einsiedler', name: 'Einsiedler Konrad', role: 'Einsiedler', segen: true, kerze: true,
      greet: ['Seid gegrüßt, Pilger. Viele steigen den Berg herauf, um hier zu beten.', 'Die Muttergottes von der Weinstraße hat schon manchen getröstet.', 'Ich habe der Welt entsagt. Nur die Winzer bringen mir Brot und Wein.'] }],
    pray: ['bauer', 'baeuerin'] },
  { id: 'kaiserdom', name: 'Kaiserdom zu Speyer', kind: 'dom', at: [5300, 1350], style: 'dom', where: 'in Speyer', pilg: true,
    clergy: [{ id: 'domherr', art: 'domherr', name: 'Domherr Philipp', role: 'Domherr', segen: true, beichte: true, kerze: true, messe: true, ablassRede: true,
      greet: ['Willkommen im Dom zu Speyer. Hier ruhen acht Kaiser und Könige.', 'Auf dem Reichstag in dieser Stadt wird heftig um den Glauben gestritten.', 'Seit über vierhundert Jahren steht dieser Dom. Er wird auch uns überdauern.'] },
      { id: 'ablass', art: 'ablass', name: 'Bruder Tilman', role: 'Ablassprediger', ablass: true, x: 330,
      greet: ['Sobald das Geld im Kasten klingt, die Seele aus dem Fegefeuer springt!', 'Ein Ablassbrief, Herr Ritter! Für Euch und Eure Lieben.', 'Der Papst selbst hat den Ablass gewährt. Wer zahlt, dem wird die Strafe erlassen.'] }],
    pray: ['buerger', 'buergerin', 'magd', 'buerger', 'buergerin', 'baeuerin'] }
];
const CHURCHES = CH_DEF.map((d, i) => {
  const wx = d.at[0] * WS, wy = d.at[1] * WS;
  let p = null, bd = 1e9;
  for (const q of GPROPS) if (q.kind === d.kind){ const dd = Math.hypot(q.x - wx, q.y - wy); if (dd < bd){ bd = dd; p = q; } }
  if (!p || bd > 600) return null;
  const dx = d.kind === 'dom' && p.door ? p.door : p.x + d.door;
  return Object.assign({}, d, { x: p.x, y: p.y, dx, dy: p.y + 12, church: true, seed: 7100 + i * 37, host: d.clergy[0].name });
}).filter(Boolean);
const CH_BY = Object.fromEntries(CHURCHES.map(c => [c.id, c]));
const PILG = CHURCHES.filter(c => c.pilg).map(c => c.id);
for (const c of CHURCHES){
  HUB_NAME[c.id] = c.name; HUB_IN[c.id] = 'in der ' + c.name.replace(/^Kaiserdom/, 'Kaiserdom');
  if (c.style === 'dom') HUB_IN[c.id] = 'im Kaiserdom zu Speyer';
  if (c.id !== 'kaiserdom') MAP_LABELS.push({ x: c.dx / WS, y: c.y / WS - (c.kind === 'kirche' ? 250 : 120), name: c.name.replace(/ (St\.|Unserer).*$/, '') });
}

/* ---------- Innenraum: Altar und Fenster vorn, Säulen, Bänke, Kanzel, Taufstein, Kerzenständer ---------- */
const CH_GLASS = ['#1e3a7a', '#2f5aa8', '#4a78c8', '#7a1418', '#a8261e', '#c8402e', '#b88a1e', '#e0b440', '#245a30', '#3a7a44', '#5a2a6a'].map(wp_c);
const chArch = (w, h, round) => (i, j) => {   // Fensterform: Rund- oder Spitzbogen oben
  const r = w / 2, cx = (w - 1) / 2, dx = Math.abs(i - cx);
  if (j >= r) return true;
  return round ? Math.hypot(dx, r - j) <= r + .2 : dx <= r * Math.pow(j / r, .55) + .3;
};
function chGlassWin(B, x, y, w, h, s, round, frame){
  const shape = chArch(w, h, round), F = frame || wp_P.stone;
  for (let j = -2; j < h + 2; j++) for (let i = -2; i < w + 2; i++){
    const inner = i >= 0 && j >= 0 && i < w && j < h && shape(i, j);
    const near = !inner && [[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2]].some(([a, b]) => { const ii = i + a, jj = j + b; return ii >= 0 && jj >= 0 && ii < w && jj < h && shape(ii, jj); });
    if (near){ wp_set(B, x + i, y + j, wp_tone(F, .55 + (i < 0 || j < 0 ? .2 : -.15), x + i, y + j)); continue; }
    if (!inner) continue;
    const cu = Math.floor(i / 4), cv = Math.floor((j + (cu & 1) * 2) / 5), lead = i % 4 === 0 || (j + (cu & 1) * 2) % 5 === 0 || i === Math.round(w / 2);
    if (lead){ wp_set(B, x + i, y + j, wp_c('#14121a')); continue; }
    let c = CH_GLASS[Math.floor(wp_h(cu, cv, s) * CH_GLASS.length)];
    const lit = 1 - (i / w + j / h) * .45 + (wp_h(i, j, s + 1) - .5) * .12;
    const r = ((c >> 0) & 255) * lit, g = ((c >> 8) & 255) * lit, b = ((c >> 16) & 255) * lit;
    wp_set(B, x + i, y + j, (255 << 24) | (wp_cl(b) << 16) | (wp_cl(g) << 8) | wp_cl(r));
  }
}
function chBench(w, s){   // Kirchenbank mit Lehne und geschnitzten Wangen, von hinten oben gesehen
  const B = wp_img(w + 4, 28, 26);
  wp_rect(B, 2, 4, w + 2, 9, (x, y) => wp_tone(wp_P.oak, y < 6 ? .62 : .42, x, y));               // Lehne
  wp_rect(B, 2, 9, w + 2, 12, (x, y) => wp_tone(wp_P.oak, .22, x, y));
  wp_rect(B, 3, 12, w + 1, 18, (x, y) => wp_tone(wp_P.wood, .5 + (wp_vn(x * .15, y, s) - .5) * .25, x, y));   // Sitz
  wp_rect(B, 3, 18, w + 1, 20, (x, y) => wp_tone(wp_P.oak, .2, x, y));
  for (const wx of [1, w]){ wp_rect(B, wx, 1, wx + 3, 26, (x, y) => wp_tone(wp_P.oak, .35 + (x === wx ? .2 : 0), x, y)); wp_ell(B, wx + 1.5, 2, 2, 2, (x, y) => wp_tone(wp_P.oak, .55, x, y)); }
  wp_outline(B, true);
  return wp_canvas(B);
}
function chPillar(h, R, s, round){   // Säule bis an den oberen Bildrand, rund beleuchtet von links
  const w = 24, B = wp_img(w, h, h);
  wp_rect(B, 2, 0, w - 2, h - 8, (x, y) => wp_tone(R, .78 - Math.abs(x - 8) * .06 - (x > 15 ? .12 : 0) + (wp_h(x, y >> 2, s) - .5) * .08 - ((y % (round ? 18 : 22)) === 0 ? .18 : 0), x, y));
  wp_rect(B, 0, h - 8, w, h, (x, y) => wp_tone(R, y === h - 8 ? .7 : .45 - (x > 16 ? .1 : 0), x, y));   // Sockel
  wp_outline(B, true);
  return wp_canvas(B);
}
function chPulpit(s){   // Kanzel: Korb auf einer Säule, Schalldeckel darüber, Treppe
  const B = wp_img(46, 118, 116);
  wp_rect(B, 20, 70, 26, 116, (x, y) => wp_tone(wp_P.red, .5 - (x > 23 ? .15 : 0), x, y));
  wp_poly(B, [[8, 44], [38, 44], [34, 72], [12, 72]], (x, y) => wp_tone(wp_P.oak, .55 - (y - 44) * .008 - (x > 28 ? .12 : 0), x, y));
  for (const px of [14, 23, 32]) wp_rect(B, px, 48, px + 2, 68, (x, y) => wp_tone(wp_P.gold, .55, x, y));
  wp_rect(B, 6, 42, 40, 46, (x, y) => wp_tone(wp_P.oak, .7, x, y));
  wp_rect(B, 22, 6, 24, 30, (x, y) => wp_tone(wp_P.oak, .4, x, y));
  wp_poly(B, [[4, 8], [42, 8], [36, 2], [10, 2]], (x, y) => wp_tone(wp_P.oak, .6 - (y - 2) * .03, x, y));
  wp_set(B, 23, 0, wp_P.gold[4]); wp_set(B, 23, 1, wp_P.gold[3]);
  for (let i = 0; i < 6; i++) wp_rect(B, 36 + i, 74 + i * 7, 42 + i, 77 + i * 7, (x, y) => wp_tone(wp_P.oak, .5, x, y));
  wp_outline(B, true);
  return wp_canvas(B);
}
function chFont(){   // Taufstein
  const B = wp_img(30, 30, 28);
  wp_rect(B, 11, 14, 19, 26, (x, y) => wp_tone(wp_P.stone, .6 - (x > 15 ? .15 : 0), x, y));
  wp_rect(B, 7, 25, 23, 28, (x, y) => wp_tone(wp_P.stone, .5, x, y));
  wp_ell(B, 15, 9, 13, 7, (x, y) => wp_tone(wp_P.stone, .7 - (y - 6) * .03 - (x > 20 ? .12 : 0), x, y));
  wp_ell(B, 15, 8, 10, 4, (x, y) => wp_tone(wp_P.glass, .55 + (15 - x) * .02, x, y));
  wp_outline(B, true);
  return wp_canvas(B);
}
function chRack(){   // Kerzenständer aus Eisen mit Sand, zwölf Plätze
  const B = wp_img(56, 40, 38);
  wp_rect(B, 4, 10, 52, 16, (x, y) => wp_tone(wp_P.iron, y < 12 ? .6 : .35, x, y));
  wp_rect(B, 6, 16, 50, 20, (x, y) => wp_tone(wp_P.straw, .45, x, y));
  for (const lx of [8, 46]) wp_rect(B, lx, 20, lx + 2, 38, (x, y) => wp_tone(wp_P.iron, .4, x, y));
  wp_rect(B, 6, 30, 50, 32, (x, y) => wp_tone(wp_P.iron, .3, x, y));
  wp_outline(B, true);
  return wp_canvas(B);
}
function chRoom(ch){
  if (ch.room) return ch.room;
  const st = ch.style, s = ch.seed, B = wp_buf(RW, RH), items = [], rects = [], candles = [], C = wp_c;
  const big = st === 'dom', chap = st === 'kapelle', round = big;
  const WALL = chap ? wp_P.plaster : big ? wp_P.stone : wp_P.red, FL = big ? 168 : chap ? 136 : 150;
  wp_rect(B, 0, 0, RW, RH, C('#0e0c10'));
  // Rückwand: Quader (Kapelle: Kalkputz), Gurtgesims; Apsis mit Altarbogen in der Mitte
  wp_rect(B, 22, 0, RW - 22, FL, chap ? (x, y) => wp_tone(wp_P.plaster, .62 + (wp_vn(x * .05, y * .05, s) - .5) * .18 - y * .0008, x, y)
    : wp_ashlar({ R: WALL, s: s + 1, ch: big ? 9 : 7, bmin: 12, bmax: 22 }));
  wp_rect(B, 22, FL - 10, RW - 22, FL - 4, (x, y) => wp_tone(WALL, y === FL - 10 ? .8 : .4, x, y));
  const ax0 = 360, ax1 = 600, arW = ax1 - ax0;
  for (let y = 0; y < FL - 10; y++) for (let x = ax0; x < ax1; x++){
    const i = x - ax0; if (!chArch(arW, FL, round)(i, y + (round ? 0 : 6))) continue;
    wp_set(B, x, y, wp_tone(WALL, .22 + (x - ax0) / arW * .08 + (wp_h(x >> 2, y >> 2, s) - .5) * .05, x, y));
  }
  // Fenster: zwei hohe Glasfenster in der Apsis, je zwei in der Rückwand links und rechts
  const winH = FL - 46;
  chGlassWin(B, ax0 + 46, 18, 26, winH - 24, s + 2, round); chGlassWin(B, ax1 - 72, 18, 26, winH - 24, s + 3, round);
  for (const wx of chap ? [120, 800] : [96, 224, 712, 840]) chGlassWin(B, wx, 22, chap ? 22 : 28, winH, s + wx, round, chap ? wp_P.grey : WALL);
  if (big) for (const wx of [160, 776]) chGlassWin(B, wx, 30, 18, winH - 30, s + wx + 1, true, WALL);
  // Seitenwände in Schräge
  wp_poly(B, [[0, 0], [22, 8], [22, FL + 2], [0, FL + 30]], (x, y) => wp_tone(WALL, .2 + (wp_h(x, y, s) - .5) * .1, x, y));
  wp_poly(B, [[RW, 0], [RW - 22, 8], [RW - 22, FL + 2], [RW, FL + 30]], (x, y) => wp_tone(WALL, .12 + (wp_h(x, y, s) - .5) * .1, x, y));
  // Boden: Steinplatten, vor dem Altar Grabplatten mit Kreuz
  for (let y = FL - 2; y < RH; y++){
    const row = Math.floor((y - FL + 2) / 22), off = (row & 1) * 24;
    for (let x = 0; x < RW; x++){
      const k = Math.floor((x + off) / 48), seam = (y - FL + 2) % 22 === 0 || (x + off) % 48 === 0;
      let v = .5 + (wp_h(k, row, s + 4) - .5) * .2 + (wp_vn(x * .06, y * .2, s + 5) - .5) * .14 - (y < FL + 6 ? .14 : 0) - (seam ? .25 : 0);
      wp_set(B, x, y, wp_tone(chap ? wp_P.grey : big ? wp_P.stone : wp_P.red, v - (chap ? 0 : .06), x, y));
    }
  }
  for (const gx of [372, 452, 532]){
    const gy = FL + 52;
    wp_rect(B, gx, gy, gx + 56, gy + 26, (x, y) => wp_tone(wp_P.dark, .55 + (wp_h(x >> 1, y >> 1, s) - .5) * .2, x, y));
    wp_rect(B, gx + 26, gy + 4, gx + 30, gy + 22, (x, y) => wp_tone(wp_P.stone, .3, x, y)); wp_rect(B, gx + 18, gy + 9, gx + 38, gy + 12, (x, y) => wp_tone(wp_P.stone, .3, x, y));
  }
  for (let y = FL - 2; y < FL + 30; y++){ const w2 = Math.round(22 - (y - FL + 2) * .72); wp_rect(B, 0, y, Math.max(0, w2), y + 1, C('#0e0c10')); wp_rect(B, RW - Math.max(0, w2), y, RW, y + 1, C('#0e0c10')); }
  // Altarstufe und Altar mit Tuch und Antependium, Flügelaltar an der Wand, Kreuz darüber
  wp_rect(B, 300, FL - 4, 660, FL + 34, (x, y) => wp_tone(big ? wp_P.stone : wp_P.red, .66 + (wp_h(x >> 3, y >> 3, s) - .5) * .1 - (y > FL + 28 ? .3 : 0), x, y));
  wp_rect(B, 420, FL - 30, 540, FL + 10, (x, y) => wp_tone(big ? wp_P.stone : wp_P.red, .55 - (x > 520 ? .12 : 0), x, y));
  wp_rect(B, 416, FL - 34, 544, FL - 26, (x, y) => wp_tone(wp_P.cloth, .85 - (y - FL + 34) * .05, x, y));
  wp_rect(B, 436, FL - 24, 524, FL + 6, (x, y) => wp_tone(big ? wp_P.red2 : st === 'kloster' ? wp_P.blue2 : wp_P.red2, .55 + ((x + y) % 7 === 0 ? .15 : 0), x, y));
  wp_rect(B, 474, FL - 18, 486, FL, (x, y) => wp_tone(wp_P.gold, .7, x, y)); wp_rect(B, 466, FL - 12, 494, FL - 8, (x, y) => wp_tone(wp_P.gold, .7, x, y));
  const rt = FL - 112, rw = chap ? 70 : big ? 120 : 96;   // Flügelaltar: Mittelbild und zwei Flügel in Goldrahmen
  wp_rect(B, 480 - rw / 2 - 4, rt - 4, 480 + rw / 2 + 4, FL - 36, (x, y) => wp_tone(wp_P.gold, .45 + (wp_h(x, y, s) - .5) * .25, x, y));
  const panes = [[480 - rw / 2, 480 - rw / 6, wp_P.blue2], [480 - rw / 6 + 2, 480 + rw / 6 - 2, wp_P.red2], [480 + rw / 6, 480 + rw / 2, wp_P.blue2]];
  for (const [p0, p1, R] of panes){
    wp_rect(B, p0, rt, p1, FL - 40, (x, y) => wp_tone(R, .45 + (y - rt) * -.002 + (wp_h(x >> 1, y >> 1, s + 9) - .5) * .12, x, y));
    const mx = (p0 + p1) / 2; wp_ell(B, mx, rt + 14, 4, 4, (x, y) => wp_tone(wp_P.flesh, .7, x, y)); wp_ell(B, mx, rt + 13, 7, 7, (x, y) => (Math.hypot(x - mx, y - rt - 13) > 5.2 ? wp_tone(wp_P.gold, .85, x, y) : 0));
    wp_poly(B, [[mx - 7, rt + 19], [mx + 7, rt + 19], [mx + 10, FL - 44], [mx - 10, FL - 44]], (x, y) => wp_tone(R === wp_P.red2 ? wp_P.blue2 : wp_P.red2, .55 - (x - mx) * .015, x, y));
  }
  wp_rect(B, 478, rt - 46, 482, rt - 6, (x, y) => wp_tone(wp_P.oak, .5, x, y)); wp_rect(B, 468, rt - 36, 492, rt - 32, (x, y) => wp_tone(wp_P.oak, .5, x, y));
  wp_rect(B, 479, rt - 34, 481, rt - 20, (x, y) => wp_tone(wp_P.flesh, .65, x, y));
  for (const cx of [430, 528]){ wp_rect(B, cx - 2, FL - 40, cx + 2, FL - 34, (x, y) => wp_tone(wp_P.gold, .7, x, y)); wp_rect(B, cx - 1, FL - 50, cx + 1, FL - 40, C('#e8e0c8')); candles.push({ x: cx, y: FL - 51 }); }
  rects.push([0, 0, RW, FL + 4], [410, FL - 4, 550, FL + 14]);
  // Wandleuchter an der Rückwand
  for (const lx of chap ? [270, 690] : [170, 330, 630, 790]){ wp_rect(B, lx - 3, 58, lx + 3, 62, (x, y) => wp_tone(wp_P.iron, .5, x, y)); wp_rect(B, lx - 1, 50, lx + 1, 58, C('#e8e0c8')); candles.push({ x: lx, y: 49 }); }
  // Ausgang unten: Tür ins Freie
  const dx0 = ROOM_DOOR.x - 20, dx1 = ROOM_DOOR.x + 20;
  wp_rect(B, 0, RH - 16, RW, RH, (x, y) => wp_tone(WALL, .3 + (wp_h(x, y, s) - .5) * .1, x, y));
  wp_rect(B, dx0, RH - 16, dx1, RH, (x, y) => wp_tone(wp_P.moss, .55 + (y - RH + 16) * .02, x, y));
  wp_rect(B, dx0 - 2, RH - 18, dx0, RH, wp_P.oak[4]); wp_rect(B, dx1, RH - 18, dx1 + 2, RH, wp_P.oak[1]);
  rects.push([0, 0, 22, RH], [RW - 22, 0, RW, RH], [0, RH - 16, dx0 - 2, RH], [dx1 + 2, RH - 16, RW, RH]);
  const bg = wp_canvas(B);
  // Säulen der Mittelschiffarkaden (Kapelle: keine)
  if (!chap) for (const px of [150, 810]) for (const py of big ? [236, 336, 436] : [250, 380]){
    items.push({ img: chPillar(py, WALL, s + px + py, round), x: px, y: py, ax: 12, ay: py });
    rects.push([px - 12, py - 10, px + 12, py + 1]);
  }
  // Bänke in zwei Blöcken, Mittelgang zum Altar
  const rows = big ? [262, 302, 342, 382, 422, 462] : chap ? [270, 316, 362, 408] : [262, 304, 346, 388, 430];
  const bL = chap ? [250, 440] : [186, 446], bR = chap ? [520, 710] : [514, 774], pews = [];
  for (const by of rows) for (const [x0, x1] of [bL, bR]){
    items.push({ img: chBench(x1 - x0, s + by + x0), x: Math.round((x0 + x1) / 2), y: by, ax: (x1 - x0 + 4) >> 1, ay: 26 });
    rects.push([x0, by - 8, x1, by + 1]); pews.push([x0, x1, by]);
  }
  // Kanzel am linken Pfeiler, Taufstein links vom Eingang, Kerzenständer rechts
  if (!chap){ items.push({ img: chPulpit(s), x: 196, y: 236, ax: 23, ay: 116 }); rects.push([176, 222, 220, 238]); }
  items.push({ img: chFont(), x: 330, y: 494, ax: 15, ay: 28 }); rects.push([318, 484, 342, 496]);
  const rack = { x: 640, y: 494 };
  items.push({ img: chRack(), x: rack.x, y: rack.y, ax: 28, ay: 38 }); rects.push([614, 484, 666, 496]);
  const slots = Array.from({ length: 12 }, (_, i) => ({ x: rack.x - 21 + (i % 6) * 8, y: rack.y - 24 + (i >= 6 ? 3 : 0) }));
  // Licht: Fenster (kühl, farbig), Kerzen (warm), Tageslicht an der Tür
  const winL = (chap ? [131, 811] : [110, 238, 726, 854]).map(x => [x, FL + 60, big ? 230 : 200, .55, [150, 170, 255]]);
  const lights = winL.concat([[ax0 + 59, FL + 30, 180, .5, [255, 140, 120]], [ax1 - 59, FL + 30, 180, .5, [140, 170, 255]], [480, FL - 30, 170, .6, [255, 170, 80]], [ROOM_DOOR.x, RH + 16, 140, .55, [255, 240, 210]]],
    candles.map(c => [c.x, c.y + 6, 70, .5, [255, 160, 70]]), [[rack.x, rack.y - 20, 90, .45, [255, 160, 70]]]);
  const light = canvasOf(RW, RH), lg = light.getContext('2d'), id = lg.createImageData(RW, RH);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++){
    let L = 0, tr = 0, tg = 0, tb = 0;
    for (const [lx, ly, r, k, col] of lights){ const dx = x - lx, dy = (y - ly) * 1.15; if (Math.abs(dx) >= r || Math.abs(dy) >= r) continue; const d = Math.hypot(dx, dy); if (d < r){ const v = Math.pow(1 - d / r, 1.4) * k; L += v; tr += v * col[0]; tg += v * col[1]; tb += v * col[2]; } }
    const q = .07, Lc = Math.min(1, L), a = Math.floor((.56 * (1 - Lc) + .08 * Math.min(1, L)) / q + dither(x, y)) * q, i = (y * RW + x) * 4;
    const n = L || 1, mix = clamp(L * 1.2, 0, 1);
    id.data[i] = Math.round(12 + (tr / n - 12) * mix); id.data[i + 1] = Math.round(10 + (tg / n - 10) * mix); id.data[i + 2] = Math.round(18 + (tb / n - 18) * mix);
    id.data[i + 3] = Math.round(clamp(a, 0, .86) * 255);
  }
  lg.putImageData(id, 0, 0);
  // Geistliche am Altar, Betende in den Bänken (bei der Messe mehr)
  const npcs = ch.clergy.map((c, i) => Object.assign({ key: 'ch_' + ch.id + '_' + c.id, x: c.x || (480 + i * 150), y: FL + 46, church: ch.id, clergy: true }, c, { art: CH_ART[c.art] }));
  const R = rng(s), pray = [], messe = [];
  const spot = (row, i) => { const [x0, x1, by] = pews[row]; return { x: Math.round(x0 + 24 + i * (x1 - x0 - 48) / 3), y: by + 18 }; };
  ch.pray.forEach((t, i) => { const p = spot((i * 3 + 1) % pews.length, i % 4); pray.push({ id: 'beter', key: 'ch_beter_' + t, name: t === 'moench' ? 'Mönch' : 'Betende', role: 'im Gebet', noPlate: true, x: p.x, y: p.y, art: CH_ART[t], greet: ['Pssst. Hier wird gebetet.', 'Gott sei mit Euch, Herr Ritter.', 'Ich bete für meinen Sohn im Feld.'] }); });
  for (let i = 0; i < (big ? 8 : chap ? 3 : 6); i++){ const t = ['buerger', 'buergerin', 'magd', 'bauer', 'baeuerin'][(R() * 5) | 0], p = spot((i * 5 + 2) % pews.length, (i + 2) % 4); messe.push({ id: 'beter', key: 'ch_beter_' + t, name: 'Kirchgänger', role: 'zur Messe', noPlate: true, x: p.x + 6, y: p.y, art: CH_ART[t], greet: ['Die Predigt ist lang heute.', 'Amen.'] }); }
  return (ch.room = { church: true, bg, light, items, rects, npcs: npcs.concat(pray), clergyN: npcs, base: npcs.concat(pray), messe, candles, slots, rack, fire: null, FL });
}

/* ---------- Betreten, Wallfahrt, Messe ---------- */
const CH = { cand: {}, say: null, sayT: 0, sermI: 0, sermT: 0 };   // gestiftete Kerzen je Kirche (bis wann sie brennen), Predigt
function chEnter(ch){
  const P = HERO.pilg;
  if (P && P.on && !P.done && ch.pilg && !P.v[ch.id]){
    P.v[ch.id] = 1; const n = PILG.filter(id => P.v[id]).length;
    logLine('Pilgerzeichen: ' + ch.name + ' (' + n + ' von ' + PILG.length + ').', '#ffd98a');
    showBanner('Pilgerzeichen', ch.name + ' · ' + n + ' von ' + PILG.length);
    if (n >= PILG.length) logLine('Alle heiligen Orte besucht. Kehrt zum Burgkaplan in der Reichsburg zurück.', '#ffd98a');
    Sound.coin(); markDirty(true); renderTracker();
  }
}
const SERMON = ['In nomine Patris et Filii et Spiritus Sancti.', 'Dominus vobiscum.', 'Kyrie eleison. Christe eleison.', 'Selig sind die Friedfertigen, denn sie werden Gottes Kinder heißen.',
  'Gloria in excelsis Deo.', 'Liebet eure Feinde, tut Gutes denen, die euch hassen.', 'Gebt dem Kaiser, was des Kaisers ist, und Gott, was Gottes ist.',
  'Was ihr getan habt einem unter meinen geringsten Brüdern, das habt ihr mir getan.', 'Agnus Dei, qui tollis peccata mundi, miserere nobis.', 'Ite, missa est. Gehet hin in Frieden.'];
function chUpdate(dt){   // aus updateInn, solange man in einer Kirche ist
  const ch = G.inside, rm = chRoom(ch), on = chMesseNow(), M = G.messe || (G.messe = { day: -1, t: 0 });
  rm.npcs = on ? rm.base.concat(rm.messe) : rm.base;
  if (!on) return;
  const d = chDay(); if (M.day !== d){ M.day = d; M.t = 0; CH.sermI = 0; CH.sermT = 0; }
  M.t += dt; CH.sermT -= dt;
  const pr = rm.clergyN.find(n => n.segen || n.messe) || rm.clergyN[0];
  if (CH.sermT <= 0){ CH.sermT = 7; CH.say = { n: pr, text: SERMON[CH.sermI++ % SERMON.length] }; CH.sayT = nowS() + 6; }
  if (M.t >= CH_MESSE_NEED && HERO.messe !== d){
    HERO.messe = d;
    chBless(CH_SEGEN, 'Die Messe ist gelesen. ' + pr.name.replace(/^\S+ /, '') + ' spendet Euch den Segen.');
    const xp = Math.round(15 + HERO.lvl * 6); if (HERO.lvl < MAX_LVL){ gainXp(xp); floatText(G.knight.x, G.knight.y - KS.ay - 10, '+' + xp + ' EP', '#c9a6ff', 1, 1.2); }
  }
}
function chHour(hr){   // Glocken: eine Stunde vor der Messe in Städten, Burg und Dörfern
  if (hr !== CH_MESSE[0] - 1 || G.mode !== 'play' || !HERO) return;
  const k = G.knight, near = CHURCHES.find(c => Math.hypot(c.dx - k.x, c.dy - k.y) < 1600);
  if (!near && !SAFE[G.zone]) return;
  Sound.chime(); setTimeout(() => Sound.chime(), 900);
  if (near) logLine('Die Glocken läuten: Um 10 Uhr ist Messe in der ' + near.name.replace(/^Kaiserdom zu Speyer$/, 'Domkirche') + '. Wer dabei ist, empfängt den Segen.', '#ffd98a');
}
/* Segen: mehr Leben, schnellere Erholung, mehr Schaden gegen Untote */
function chBless(t, msg){
  HERO.bless = { t };
  refreshStats(); updateHud(); renderBuffs(); markDirty(true);
  logLine(msg || 'Ihr seid gesegnet: 20 Minuten lang mehr Leben, schnellere Erholung und +15 % Schaden gegen Untote.', '#ffe9a0');
  burst(G.knight.x, G.knight.y - KBODY, ['#fff3c0', '#ecd27a', '#ffffff'], 18, 60, true); Sound.potion();
}
const CH_CROSS = makeSprite(['..a..', '..a..', 'aaaaa', '..a..', '..a..', '..a..', '..a..'], { a: '#ecd27a' }, OUT);

/* ---------- Zeichnen im Kirchenraum (aus renderInn) ---------- */
function chRoomFx(rm){
  const ch = G.inside, n = 3 + (CH.cand[ch.id] || []).filter(t => t > nowS()).length;
  for (let i = 0; i < Math.min(n, rm.slots.length); i++){
    const c = rm.slots[i], f = (G.t * 8 + i * 3) | 0;
    ctx.fillStyle = '#e8e0c8'; ctx.fillRect(c.x, c.y, 2, 5);
    ctx.fillStyle = '#ffd36a'; ctx.fillRect(c.x, c.y - 2 - (f % 3 === 0 ? 1 : 0), 2, 2); ctx.fillStyle = '#fff3c0'; ctx.fillRect(c.x, c.y - 1, 1, 1);
  }
  if (chMesseNow() && !RM) for (let q = 0; q < 4; q++){   // Weihrauch steigt vom Altar
    const ph = (G.t * .25 + q / 4) % 1, x = 480 + Math.sin(G.t * .7 + q * 1.7) * 10 + ph * 6, y = rm.FL - 40 - ph * 80;
    ctx.globalAlpha = (1 - ph) * .35; ctx.fillStyle = '#d8d4cc'; ctx.fillRect(Math.round(x), Math.round(y), 4, 3);
  }
  ctx.globalAlpha = 1;
}
function chRoomTop(rm){
  if (CH.say && nowS() < CH.sayT && rm.npcs.includes(CH.say.n)) drawBubble(CH.say.n.x, CH.say.n.y - CH.say.n.art.ay - 30, CH.say.text);
  if (chMesseNow()) drawText('Messe', 480, rm.FL + 76, '#ffd98a');
}

/* ---------- Gespräch mit den Geistlichen ---------- */
const chSegenPreis = () => 4 + HERO.lvl * 2;
const chAblassPreis = () => 25 + HERO.lvl * 8;
function chTalkOpts(n, opts){
  if (!n.clergy) return;
  const has = HERO.gold;
  if (n.segen){ const p = chSegenPreis(), b = btn('Um den Segen bitten (' + p + ' Gulden Spende)', () => renderTalk('chSegen'), 'opt'); b.disabled = has < p; opts.append(b); }
  if (n.beichte) opts.append(btn('Beichten', () => renderTalk('chBeichte'), 'opt'));
  if (n.kerze){ const b = btn('Eine Kerze stiften (2 Gulden)', () => renderTalk('chKerze'), 'opt'); b.disabled = has < 2; opts.append(b); }
  if (n.wallfahrt){
    const P = HERO.pilg, all = P && PILG.every(id => P.v[id]);
    if (!P || !P.on) opts.append(btn('Um einen Pilgerbrief bitten', () => renderTalk('chPilger'), 'opt'));
    else if (all && !P.done) opts.append(btn('Die Wallfahrt vollenden', () => renderTalk('chPilgerEnde'), 'opt'));
    else if (!P.done) opts.append(btn('Wohin führt die Wallfahrt?', () => renderTalk('chPilger'), 'opt'));
  }
  if (n.messe || n.segen) opts.append(btn('Wann ist Messe?', () => renderTalk('chMesse'), 'opt'));
  if (n.ablassRede) opts.append(btn('Was haltet Ihr vom Ablass?', () => renderTalk('chLore'), 'opt'));
  if (n.ablass){ const p = chAblassPreis(), b = btn(HERO.ablass ? 'Ihr tragt schon einen Ablassbrief' : 'Einen Ablassbrief kaufen (' + p + ' Gulden)', () => renderTalk('chAblass'), 'opt'); b.disabled = !!HERO.ablass || has < p; opts.append(b); }
}
function chView(view, body, opts){
  const n = G.talk, say = t => { $('talkText').textContent = t; }, back = () => { opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn')); body.append(opts); };
  if (view === 'chSegen'){
    const p = chSegenPreis();
    if (HERO.gold < p){ say('Gott segnet auch die Armen, Herr Ritter. Kommt zur Messe um zehn Uhr, da kostet der Segen nichts.'); return back(); }
    HERO.gold -= p; updateHud();
    say('Der Herr segne dich und behüte dich. Der Herr lasse sein Angesicht leuchten über dir. Gehe hin in Frieden.');
    chBless(CH_SEGEN); return back();
  }
  if (view === 'chBeichte'){
    if (HERO.beicht === chDay()){ say('Ihr wart heute schon bei mir, mein Sohn. Kommt morgen wieder.'); return back(); }
    say('Sprecht, mein Sohn. Was lastet auf Eurer Seele?');
    for (const [s, a] of [['Ich habe im Zorn gefochten.', 'Zorn ist eine Todsünde. Betet fünf Vaterunser und schont künftig, wer um Gnade bittet.'],
      ['Ich habe beim Würfeln geflucht.', 'Fluchen beleidigt den Herrn. Betet drei Ave Maria, und lasst die Würfel öfter liegen.'],
      ['Ich habe mehr Bier getrunken, als gut war.', 'Maß halten ist eine Tugend. Betet ein Vaterunser und trinkt morgen Wasser.']]){
      opts.append(btn(s, () => {
        HERO.beicht = chDay(); HERO.mood = { t: Math.max(HERO.mood ? HERO.mood.t : 0, 600) };
        renderBuffs(); markDirty(true); say(a + ' Ego te absolvo. Geht in Frieden.');
        logLine('Nach der Beichte ist Euch leicht ums Herz: 10 Minuten gute Laune (+10 % Erfahrung).', '#ffe9a0');
        body.textContent = ''; opts.textContent = ''; back();
      }, 'opt'));
    }
    return back();
  }
  if (view === 'chKerze'){
    if (HERO.gold < 2){ say('Für eine Kerze braucht es zwei Gulden.'); return back(); }
    HERO.gold -= 2; updateHud(); markDirty();
    const L = CH.cand[G.inside.id] = (CH.cand[G.inside.id] || []).filter(t => t > nowS()); L.push(nowS() + 600);
    say(pick(['Ihr entzündet eine Kerze für die Seelen der Verstorbenen.', 'Ihr entzündet eine Kerze für eine glückliche Heimkehr.', 'Ihr entzündet eine Kerze für alle, die im Feld stehen.']) + ' Sie brennt im Ständer beim Eingang.');
    Sound.click(); return back();
  }
  if (view === 'chPilger'){
    if (!HERO.pilg || !HERO.pilg.on){ HERO.pilg = { on: 1, v: {}, done: 0 }; chEnter(G.inside); markDirty(true); }
    const P = HERO.pilg;
    say('Fünf heilige Orte hat das Reichsland. Besucht jeden und betet dort, dann kehrt mit dem Pilgerbrief zu mir zurück.');
    for (const id of PILG){ const c = CH_BY[id], r = el('p', 'hint', (P.v[id] ? '✓ ' : '· ') + c.name + ' ' + c.where); body.append(r); }
    return back();
  }
  if (view === 'chPilgerEnde'){
    const P = HERO.pilg, j = HERO.inv.indexOf(null);
    if (j < 0){ say('Euer Rucksack ist voll. Macht Platz für das Pilgerzeichen.'); return back(); }
    P.done = 1;
    const it = makeItem('kleinod', Math.min(MAX_LVL, HERO.lvl + 1), 3, { name: 'Jakobsmuschel des Pilgers', aff: ['hp', 'crit'] });
    HERO.inv[j] = it; logItem('Pilgerzeichen: ', it);
    const xp = Math.round(120 + HERO.lvl * 40); if (HERO.lvl < MAX_LVL) gainXp(xp);
    say('Ihr habt alle heiligen Orte besucht. Nehmt diese Jakobsmuschel, das Zeichen der Pilger. Möge sie Euch auf allen Wegen beschützen.');
    showBanner('Wallfahrt vollendet', 'Jakobsmuschel und ' + xp + ' Erfahrung'); Sound.coin(); markDirty(true); renderTracker();
    return back();
  }
  if (view === 'chMesse'){ say('Jeden Tag um zehn Uhr läuten die Glocken zur Messe. Wer bis zum Segen bleibt, geht gesegnet hinaus, und der Segen kostet dann nichts.'); return back(); }
  if (view === 'chLore'){ say('Manche sagen, die Gnade Gottes lasse sich nicht kaufen. Ein Mönch aus Wittenberg, Martin Luther, schrieb fünfundneunzig Thesen gegen den Ablasshandel. Andere halten den Ablass für ein frommes Werk. Entscheidet selbst, Herr Ritter.'); return back(); }
  if (view === 'chAblass'){
    const p = chAblassPreis();
    if (HERO.ablass || HERO.gold < p){ say(HERO.ablass ? 'Ihr tragt doch schon einen Ablassbrief, Herr Ritter!' : 'Ohne Geld kein Ablass. So ist es nun einmal.'); return back(); }
    HERO.gold -= p; HERO.ablass = true; updateHud(); renderBuffs(); markDirty(true);
    say('Hier ist Euer Ablassbrief, gesiegelt und gültig. Fallt Ihr im Kampf, so bewahrt er Euer Gold. Und nun: Wer ist der Nächste?');
    logLine('Ablassbrief gekauft: Beim nächsten Fall verliert Ihr kein Gold.', '#ffd98a'); Sound.coin(); return back();
  }
}
/* Anzeigen: Segen in der Kopfzeile, Wallfahrt im Wegweiser */
function chBuffs(box){
  if (chBlessed()){ const chip = el('span', 'buff'), im = el('img'); im.src = urlOf(CH_CROSS, 3); im.alt = ''; chip.append(im, el('span', null, Math.ceil(HERO.bless.t / 60) + ' Min.')); chip.title = 'Segen: +8 % Leben, schnellere Erholung, +15 % Schaden gegen Untote'; box.append(chip); }
  if (HERO.ablass){ const chip = el('span', 'buff'), im = el('img'); im.src = urlOf(CH_CROSS, 3); im.alt = ''; chip.append(im, el('span', null, 'Ablass')); chip.title = 'Ablassbrief: Beim nächsten Fall verliert Ihr kein Gold'; box.append(chip); }
}
function chRows(box){
  const P = HERO.pilg; if (!P || !P.on || P.done) return;
  const n = PILG.filter(id => P.v[id]).length, p = el('p', n >= PILG.length ? 'done' : '');
  p.append(el('b', null, 'Wallfahrt'), ' ', el('span', null, n >= PILG.length ? 'zum Burgkaplan' : n + ' / ' + PILG.length)); box.append(p);
}
function chTick(dt){   // Segen läuft in Spielzeit ab
  if (!HERO.bless) return;
  HERO.bless.t -= dt;
  if (HERO.bless.t <= 0){ HERO.bless = null; refreshStats(); updateHud(); renderBuffs(); markDirty(); logLine('Der Segen ist verklungen.', '#d8c69c'); }
  else if (Math.floor(HERO.bless.t / 60) !== Math.floor((HERO.bless.t + dt) / 60)) renderBuffs();
}
/* Tafel unter „Tafeln und Hilfe“ */
for (const c of CHURCHES){
  const cl = c.clergy[0], li = el('li'), im = el('img'), wh = el('span', 'what', c.name);
  lazySrc(im, () => urlOf(CH_ART[cl.art].frames[0], 2)); im.alt = '';
  const what = [cl.segen && 'Segen', cl.beichte && 'Beichte', cl.kerze && 'Kerzen', cl.wallfahrt && 'Pilgerbrief', c.clergy.some(q => q.ablass) && 'Ablassbrief'].filter(Boolean).join(', ');
  wh.append(el('small', null, c.where + ' · ' + cl.name + (what ? ': ' + what : '') + (c.pilg ? ' · Wallfahrtsort' : '')));
  li.append(im, wh); $('chList').append(li);
}
