"use strict";
/* Der Apfelritter, Teil 4 von 24: Gegenstände und Symbole, Weltgrafiken, Jahreszeiten.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Gegenstände: Äpfel, Reichsapfel, Herz, Adler, Siegel, Symbole, Geschosse ============ */
const bi_I = {
  red: bi_mat('#3c0e12', '#64171d', '#8c2225', '#b2352c', '#d05a40', '#e8946c'),   // roter Apfel
  ylw: bi_mat('#5a4a14', '#8a7424', '#b49a3a', '#d4bc5a'),                         // gelbgrüner Grund
  gld: bi_mat('#3e2a08', '#6e4e12', '#a07a1e', '#cca434', '#e8cc62', '#faeeb0'),   // Gold
  rot: bi_mat('#20160c', '#382816', '#52401f', '#6c5528', '#856c36'),              // faulig braun
  mld: bi_mat('#5e5c48', '#8a8870', '#b4b296', '#d6d2b8'),                         // Schimmelpolster
  lf:  bi_mat('#26310f', '#3a4a18', '#55682a', '#748838', '#93a650'),              // Blatt
  stk: bi_mat('#2a1c10', '#4a3420', '#6e5032'),                                    // Stiel
  wht: bi_mat('#b8b2a0', '#e6e2d4', '#fffdf4'),                                    // Glanz
  jr:  bi_mat('#4a0a10', '#8e1622', '#d8303a', '#ff9a8a'),                         // Rubin
  jb:  bi_mat('#0e1a40', '#1e3a80', '#3a6ac8', '#a8c8ff'),                         // Saphir
  jg:  bi_mat('#0a2e1a', '#16583a', '#2a9060', '#9ae4b4'),                         // Smaragd
  prl: bi_mat('#8a8676', '#c8c4b0', '#f4f2e6'),                                    // Perle
  hrt: bi_mat('#3a0a10', '#6a1219', '#9a1e24', '#c63232', '#e2604c', '#f6a890'),   // Herz
};
/* Form mit Kugelschattierung; inside(u, v) entscheidet über die Umrisslinie */
function bi_blob(P, cx, cy, rx, ry, m, o, inside){
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++){
    const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry;
    if (!inside(u, v, x, y)) continue;
    const q = Math.min(.97, u * u + v * v);
    bi_fill(P, x, y, m, o, u, v, Math.sqrt(1 - q) * (o.z || 1), u, v);
  }
}
/* Apfel 12 × 14 als Zeichenraster (Licht von oben links); Gold und Faul per Farbtausch und Zusätzen */
const bi_APPLE = [
  '.....t..lLkl', '......tlLkLl', '......svll..', '..ooo.sooo..', '.o45421332o.', 'o3565433322o', 'o4554433321o', 'o3444323221o',
  'o3343332421o', 'o2343322311o', 'o2233222121o', '.o22222111o.', '..o121111o..', '...oooooo...'];
const bi_APAL = {
  red:    { o: '#2a0c0c', 1: '#561418', 2: '#7e1c1e', 3: '#a82a26', 4: '#c8463a', 5: '#e07a5c', 6: '#f6c8a8' },
  gold:   { o: '#3a2606', 1: '#6a4a10', 2: '#9a741c', 3: '#c49e2e', 4: '#e2c050', 5: '#f4e08a', 6: '#fffbe4' },
  rotten: { o: '#1a120a', 1: '#2e2012', 2: '#46331c', 3: '#5e4726', 4: '#7a6032', 5: '#8e7440', 6: '#9a8048' },
};
function bi_apple(kind){
  const rows = bi_APPLE.map(r => r.split('')), rot = kind === 'rotten';
  const pal = Object.assign({ t: '#6e5032', s: '#3a2614', l: '#34461a', L: '#55702a', k: '#86a040', v: '#24300e',
    m: '#c8c2a0', M: '#8e8a6c', h: '#0c0806', d: '#7a6034', D: '#4a3418' }, bi_APAL[kind]);
  const set = (x, y, c) => { rows[y][x] = c; };
  if (kind === 'red'){ set(9, 6, '2'); set(4, 9, '4'); set(9, 9, '2'); }                       // Streifen, Lentizellen
  if (rot){
    // eingefallen: Schulter gesackt, Runzeln, Monilia-Sporenringe, Wurmloch, welkes Blatt
    for (const [x, y, c] of [[2, 3, '.'], [3, 3, '.'], [1, 4, '.'], [2, 4, 'o'], [3, 4, 'o'], [0, 5, '.'], [1, 5, 'o'], [11, 9, '.'], [10, 9, 'o'],
      [8, 0, '.'], [9, 0, '.'], [10, 0, '.'], [11, 0, '.'], [7, 1, 'd'], [8, 1, 'D'], [9, 1, '.'], [10, 1, '.'], [11, 1, '.'], [7, 2, 'D'], [8, 2, 'd'], [9, 2, 'D'], [9, 3, 'o'],
      [5, 0, '.'], [6, 1, 's'], [3, 5, '4'], [4, 5, '4'], [3, 6, '3'],
      [6, 7, 'M'], [8, 7, 'm'], [5, 8, 'm'], [7, 8, '1'], [9, 8, 'M'], [6, 9, 'M'], [7, 9, '1'], [8, 9, '2'], [5, 10, 'm'], [8, 10, 'm'], [6, 11, 'M'], [9, 10, 'M'], [7, 11, 'm'],
      [3, 8, 'h'], [2, 8, '4'], [3, 7, '2'], [4, 11, '1'], [2, 10, '1']]) set(x, y, c);
  }
  const c = makeSprite(rows.map(r => r.join('')), pal, null, 0);
  if (kind === 'gold'){ // Funkelstern
    const g = c.getContext('2d'); g.fillStyle = '#fffdf0'; g.fillRect(1, 3, 1, 1);
    g.fillStyle = '#f8eab0'; g.fillRect(0, 3, 1, 1); g.fillRect(2, 3, 1, 1); g.fillRect(1, 2, 1, 1); g.fillRect(1, 4, 1, 1);
  }
  return c;
}
/* Reichsapfel 14 × 18: Goldkugel, Edelsteinband um den Gleicher und über den Scheitel, Kreuz */
function bi_orbArt(){
  const I = bi_I, P = bi_buf(14, 18, 0, 0), cx = 7, cy = 11.6, r = 5.6;
  const band = u => .2 + .26 * Math.sqrt(Math.max(0, 1 - u * u));
  bi_part(P, 1);
  bi_blob(P, cx, cy, r, r, I.gld, { k: 1.2, d: .8, tex: (x, y, lv, u, v) => {
    const b = band(u);
    if (Math.abs(v - b) < .17) return clamp(lv + (v < b ? 1 : 0), 2, 5);       // Band um den Gleicher
    if (Math.abs(u) < .19 && v < b) return clamp(lv + (u < 0 ? 1 : 0), 2, 5);    // Bügel über den Scheitel
    if (Math.abs(v - b) < .3 || (Math.abs(u) < .32 && v < b)) return lv - 2;     // Schattenkante
    return lv;
  } }, (u, v) => u * u + v * v <= 1);
  // Steine und Perlen auf dem Band
  bi_part(P, 0);
  const gem = (x, y, m, l) => bi_put(P, x, y, m, l);
  gem(3, 13, I.jb, 2); gem(4, 13, I.prl, 2); gem(6, 14, I.jr, 2); gem(7, 14, I.jr, 3); gem(9, 13, I.prl, 1); gem(10, 13, I.jg, 2); gem(2, 12, I.prl, 1); gem(11, 12, I.prl, 0);
  gem(6, 9, I.jb, 3); gem(7, 9, I.jb, 2); gem(6, 7, I.prl, 2); gem(7, 11, I.prl, 1);
  // Glanz
  bi_put(P, 4, 9, I.wht, 2); bi_put(P, 3, 10, I.gld, 5); bi_put(P, 4, 8, I.gld, 5);
  // Kreuz mit Rubin in der Vierung
  bi_part(P, 1);
  for (let y = 1; y <= 5; y++) for (let x = 6; x <= 7; x++) bi_put(P, x, y, I.gld, x === 6 ? 4 : 2);
  for (let x = 4; x <= 9; x++) for (let y = 2; y <= 3; y++) bi_put(P, x, y, I.gld, y === 2 ? 4 : 2);
  bi_put(P, 6, 1, I.gld, 5); bi_put(P, 4, 2, I.gld, 5);
  bi_put(P, 6, 2, I.jr, 3); bi_put(P, 7, 2, I.jr, 2); bi_put(P, 6, 3, I.jr, 2); bi_put(P, 7, 3, I.jr, 1);
  bi_put(P, 6, 5, I.gld, 1); bi_put(P, 7, 5, I.gld, 1);
  return bi_img(P).img;
}
/* Herz 11 × 10 */
function bi_heartArt(){
  const I = bi_I, P = bi_buf(11, 10, 0, 0);
  bi_part(P, 1);
  bi_blob(P, 5.5, 4.6, 4.6, 4.2, I.hrt, { k: 1.2, d: .8 }, (u, v) => {
    const X = u * 1.18, Y = -v * 1.2 + .14, a = X * X + Y * Y - 1;
    return a * a * a - X * X * Y * Y * Y <= 0;
  });
  bi_part(P, 0);
  bi_put(P, 2, 2, I.wht, 1); bi_put(P, 3, 2, I.hrt, 5); bi_put(P, 2, 3, I.hrt, 5);
  return bi_img(P).img;
}
/* Reichsadler 32 × 28: schwarzer Doppeladler, golden nimbiert, rot gezungt und bewehrt.
   Linke Hälfte wird gemalt und gespiegelt (Wappenbild ist symmetrisch). */
const bi_EAP = { a: '#100e13', b: '#1c1a21', c: '#2a2730', d: '#3c3844', e: '#575262', r: '#8e1a1a', R: '#cc3a2c', k: '#5a1010',
  w: '#e8d8a0', g: '#6e5012', h: '#a8821e', i: '#d8b440', j: '#f2de8a' };
function bi_eagleRows(){
  const w = 16, h = 28, G = [];
  for (let y = 0; y < h; y++) G.push(new Array(w).fill('.'));
  const put = (y, x0, str) => { for (let k = 0; k < str.length; k++) if (str[k] !== '.' && x0 + k >= 0 && x0 + k < w) G[y][x0 + k] = str[k]; };
  // Schwungfedern mit Lücken: [x, y, Länge], alle drei Zeilen eine Spalte nach außen
  for (const [x0, y0, n] of [[0, 14, 3], [3, 14, 5], [6, 14, 6], [9, 14, 5]]){
    for (let i = 0; i < n; i++) put(y0 + i, x0 - Math.floor(i / 3), i === 0 ? 'cb' : (i % 3 === 1 ? 'eb' : 'db'));
    put(y0 + n, x0 - Math.floor(n / 3), 'c');
  }
  // Leib: Brustfedern in versetzten Reihen
  for (let y = 12; y < 20; y++) for (let x = (y > 17 ? 13 : 12); x < 16; x++) put(y, x, (y & 1) ? ((x + (y >> 1)) & 1 ? 'c' : 'b') : ((x + (y >> 1)) & 1 ? 'd' : 'c'));
  const E = [
    // Kopf mit offenem Hakenschnabel, Auge und roter Zunge
    [2, 7, 'cdd'], [3, 5, 'bcddec'], [4, 3, 'ddbwcddc'], [5, 2, 'ecbbbccdc'], [6, 1, 'raaRabbccb'], [7, 2, 'RR..abdcb'],
    // Hals
    [8, 8, 'bdcb'], [9, 9, 'bdcb'], [10, 10, 'bdcbb'], [11, 10, 'abcdcb'],
    // Flügelbug und Deckfedern
    [9, 0, 'de'], [10, 0, 'cdeed'], [11, 0, 'bcdcdeeddd'], [12, 0, 'abcbcdcdedcb'], [13, 1, 'abcbcdcdcdc'], [14, 11, 'c'],
    // Schenkel und Fänge
    [17, 11, 'd'], [18, 11, 'dc'], [19, 10, 'dcb'], [20, 10, 'cb'],
    [21, 8, 'RRrR'], [22, 7, 'R.R.k'], [23, 6, 'k..k'],
    // Stoß
    [20, 13, 'cdc'], [21, 12, 'dbdc'], [22, 12, 'dbdc'], [23, 11, 'db.dc'], [24, 11, 'db.dc'], [25, 11, 'c..dc'], [26, 14, 'cd'], [27, 15, 'c'],
  ];
  for (const [y, x, str] of E) put(y, x, str);
  return G.map(r => r.join(''));
}
function bi_eagleArt(){
  const half = bi_eagleRows(), rows = half.map(r => r + r.split('').reverse().join(''));
  const c = canvasOf(32, 28), g = c.getContext('2d');
  // Nimben hinter den Köpfen
  for (const cx of [8, 24]) for (let y = 0; y < 11; y++) for (let x = Math.floor(cx - 6); x <= cx + 6; x++){
    const d = Math.hypot(x + .5 - cx, y + .5 - 5.2);
    if (d > 5.1) continue;
    const col = d > 4.3 ? '#6e5012' : d > 3.4 ? (x + y) & 1 ? '#d8b440' : '#f2de8a' : (x + y) & 1 ? '#a8821e' : '#d8b440';
    g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
  g.drawImage(makeSprite(rows, bi_EAP, null, 0), 0, 0);
  return c;
}
/* Siegel 40 × 40: goldene Bulle mit Perlrand, Rautengrund und Reichsadler */
function bi_sealArt(eagle){
  const I = bi_I, P = bi_buf(40, 40, 0, 0);
  bi_part(P, 1);
  bi_blob(P, 20, 20, 19.4, 19.4, I.gld, { k: .9, d: .7, z: .6, tex: (x, y, lv, u, v) => {
    const r = Math.hypot(u, v) * 19.4, a = Math.atan2(v, u);
    if (r > 18.2) return clamp(lv - 1, 0, 4);                                         // Außenkante
    if (r > 17.4) return clamp(lv + 1, 1, 5);
    if (r > 14.4 && r < 16.6){                                                         // Perlrand
      const k = (a / (Math.PI * 2) * 40 + 40) % 1, q = Math.abs(r - 15.5);
      if (k > .25 && k < .85 && q < .9) return k < .55 ? (q < .4 ? 5 : 4) : 2;
      return 1;
    }
    if (r > 13.6) return clamp(lv + (r < 14 ? 1 : -1), 1, 4);                          // Innenring
    // Rautengrund (Diaper) im Feld
    const d1 = (x + y) % 5, d2 = (x - y + 40) % 5;
    if (d1 === 0 || d2 === 0) return clamp(lv - 2, 0, 1);
    return clamp(lv - 1, 1, 2);
  } }, (u, v) => u * u + v * v <= 1);
  const c = bi_img(P).img, g = c.getContext('2d');
  g.drawImage(eagle, 4, 6);
  return c;
}
/* Symbole 16 × 16 aus Zeichenrastern; fx = Bewegungsstriche ohne Kontur */
const bi_IPAL = { 1: '#3a3e46', 2: '#5e646e', 3: '#8c939c', 4: '#bcc2c8', 5: '#e8ecec',
  g: '#5e420e', h: '#9a7420', i: '#d0a838', j: '#f0dc88', l: '#3a2414', m: '#5e3c22', n: '#82593a', p: '#a67c50', q: '#c4a070',
  r: '#6a1418', R: '#a8262a', s: '#d4483a', S: '#f08a6a', v: '#3a5a30', V: '#5e8448', u: '#9cbc80', w: '#f4f0e0', x: '#a8a292', y: '#6e6a5e' };
function bi_icon(rows, fx){
  const c = canvasOf(16, 16), g = c.getContext('2d');
  g.drawImage(makeSprite(rows, bi_IPAL, OUT, 0), 0, 0);
  if (fx) g.drawImage(makeSprite(fx, bi_IPAL, null, 0), 0, 0);
  return c;
}
/* Hiebspur als Zeichenraster: Ring um (cx, cy) zwischen r0 und r1 von Winkel a0 bis a1, hinten verblassend */
function bi_trailRows(cx, cy, r0, r1, a0, a1, rows){
  const G = rows ? rows.map(r => r.split('')) : Array.from({ length: 16 }, () => new Array(16).fill('.'));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++){
    const dx = x + .5 - cx, dy = y + .5 - cy, r = Math.hypot(dx, dy);
    let a = Math.atan2(dy, dx); while (a < a0) a += Math.PI * 2;
    if (a > a1) continue;
    const t = (a - a0) / (a1 - a0), th = r0 + (r1 - r0) * (1 - t * .6 - .4) ;
    if (r > r1 || r < Math.min(r1 - .8, th)) continue;
    const v = t + (dither(x, y) - .5) * .3;
    G[y][x] = v < .3 ? 'y' : v < .55 ? 'x' : v < .8 ? '4' : r > r1 - .9 ? 'w' : '5';
  }
  return G.map(r => r.join(''));
}
function bi_iconsArt(){
  const ic = {};
  ic.sword = bi_icon([
    '................', '.............5..', '............452.', '...........452..', '..........452...', '....j....452....', '.....i..452.....', '......i452......',
    '.......h3.......', '.....nm.i.......', '....nm...i......', '...nl.....h.....', '..ji............', '..ih............', '................', '................']);
  // weiter Hieb: Schwert unter einem weiten Halbbogen mit Pfeilspitzen an beiden Enden
  const arc = [];
  for (let y = 0; y < 16; y++){
    let r = '';
    for (let x = 0; x < 16; x++){
      const d = Math.hypot(x + .5 - 8, y + .5 - 11), e = (x + .5) / 16;
      r += (d > 5.7 && d < 7.2 && y < 11) ? (e < .2 ? 'y' : e < .4 ? 'x' : e < .62 ? '4' : e < .8 ? '5' : 'w') : '.';
    }
    arc.push(r);
  }
  const sw = ['................', '................', '................', '................', '................', '.......5........', '.......45.......', '.......42.......',
    '.......42.......', '.......42.......', '.....jihhg......', '.......nm.......', '.......mn.......', '.......ji.......', '................', '................'];
  const ah = { '11,0': 'x', '11,1': 'x', '11,2': 'x', '11,3': 'x', '12,1': 'y', '12,2': 'y', '11,13': 'w', '11,14': 'w', '11,15': '5', '11,12': '5', '12,13': '5', '12,14': '5' };
  ic.arc = bi_icon(arc.map((r, y) => r.split('').map((c, x) => ah[y + ',' + x] || (sw[y][x] !== '.' ? sw[y][x] : c)).join('')));
  // Kettenhemd mit Messingsaum
  const mail = ['................', '.....BB..BB.....', '...MMMB..BMMM...', '..MMMMMBBMMMMM..', '.MMMMMMMMMMMMMM.', '.MMMMMMMMMMMMMM.', '.MMMMMMMMMMMMMM.', '.BBMMMMMMMMMMBB.',
    '...MMMMMMMMMM...', '...MMMMMMMMMM...', '...MMMMMMMMMM...', '...MMMMMMMMMM...', '..MMMMMMMMMMMM..', '..MMMMMMMMMMMM..', '..BBBBBBBBBBBB..', '................'];
  ic.heart = bi_icon(mail.map((r, y) => r.split('').map((c, x) => {
    if (c === 'B') return (x + y) % 3 === 0 ? 'j' : (x & 1) ? 'h' : 'i';
    if (c !== 'M') return c;
    let b = x < 5 ? 3 : x < 9 ? 2.6 : x < 12 ? 2.1 : 1.6;
    if ((x === 3 || x === 12) && y > 4 && y < 9) b = 1;                                 // Achsel
    if (y > 11) b -= .3;
    const hi = (y & 1) ? !(x & 1) : (x & 1);
    return String(clamp(Math.round(b + (hi ? .9 : -.3)), 1, 5));
  }).join('')));
  // flinke Hand: Fingerhandschuh mit Bewegungsstrichen
  ic.bolt = bi_icon(['................', '........4.3.....', '......4.3.3.....', '......3.4.2.3...', '......4.3.3.2...', '...4..3.4.2.3...', '....4.4544332...', '.....33433221...',
    '.....23433221...', '......344321....', '......233221....', '.....45443321...', '....3443332211..', '....2i22i22i11..', '................', '................'],
    ['................', '................', '................', '.xww............', '................', '................', 'xxw.............', '................',
     '................', '.xxww...........', '................', '................', '..xw............', '................', '................', '................']);
  // leichte Stiefel: Stulpenstiefel mit Schnalle
  ic.boot = bi_icon(['................', '....qppppq......', '....pnnnnp......', '....mmmmmm......', '.....pnnml......', '.....pnnml......', '.....pnnml......', '.....qnnml......',
    '.....hjihh......', '.....pnnnml.....', '.....pnnnnmml...', '.....pnnnnnnml..', '.....qpnnnnnnnm.', '....lllllllllll.', '................', '................'],
    ['................', '................', '................', '................', '................', 'xww.............', '................', '................',
     '.xxw............', '................', '................', 'xww.............', '................', '................', '................', '................']);
  // Erntesegen: Weidenkorb voller Äpfel, ein goldener obenauf
  ic.gold = bi_icon(['................', '......nmmn......', '.....n....m.....', '....n......m....', '....n.ijih.m....', '...Ssijiihgm....', '..SsRhiihhgsR...', '..sRRRrggRsRRr..',
    '..qpqpqpqpqpqp..', '..mnlnmnlnmnlm..', '...nmlnmnlmnl...', '...mnlmnmlnml...', '....nlmnmlnm....', '....llllllll....', '................', '................']);
  // Rundhieb: Schwert in einem fast geschlossenen Kreisbogen mit Pfeilspitze
  const ring = bi_trailRows(8, 8.5, 5.4, 7.2, -Math.PI * .42, Math.PI * 1.38);
  const s2 = ['................', '.........ww.....', '..........5w....', '.......5.w......', '.......45.......', '.......42.......', '.......42.......', '.......42.......',
    '.......42.......', '.....jihhg......', '.......nm.......', '.......mn.......', '.......ji.......', '................', '................', '................'];
  ic.sweep = bi_icon(ring.map((r, y) => r.split('').map((c, x) => s2[y][x] !== '.' ? s2[y][x] : c).join('')));
  // Heiltrank: Waldglasflasche mit rotem Trank, Korken und Schnur
  ic.potion = bi_icon(['................', '......pqqp......', '......mnnm......', '......uVVv......', '.....qpqpq......', '......uVVv......', '.....uVVVVv.....', '....uwVVVVVv....',
    '...uwVVVVVVVv...', '...uSsRRRRRRv...', '..uSRRRRRRRRRv..', '..usRRRRRRRRrv..', '..uRRRRRRRRrrv..', '...vRRRRRRrrv...', '....vvrrrrvv....', '................']);
  return ic;
}
/* Armbrustbolzen 12 × 3, Spitze rechts: Federn, Bindung, Schaft, vierkantige Eisenspitze */
function bi_boltArt(){
  return makeSprite(['.xww.....11.', 'nRnppqpqp345', '.yxx.....12.'], Object.assign({}, bi_IPAL, { x: '#8a8478', w: '#d6d0bc', y: '#5e584c' }), null, 0);
}
/* Feuerball 10 × 10 in drei Phasen: weißgelber Kern, flackernde Zungen */
function bi_fireArt(){
  const cols = ['#5a1410', '#9a2a14', '#d4561c', '#f2922e', '#ffd060', '#fff4c8'], out = [];
  for (let f = 0; f < 3; f++){
    const c = canvasOf(10, 10), g = c.getContext('2d'), N = noise2(77 + f * 13);
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++){
      const dx = x + .5 - 5, dy = y + .5 - 5.3, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
      const edge = 3.3 + N(Math.cos(a) * 1.6 + f * 2.1, Math.sin(a) * 1.6 + f) * 2.4 - (dy > 1 ? .4 : 0);
      if (r > edge) continue;
      const v = 1 - r / edge + (N(x * .8 + f * 3, y * .8) - .5) * .35;
      g.fillStyle = cols[clamp(Math.floor(v * 6.2 + dither(x + f, y) * .8), 0, 5)];
      g.fillRect(x, y, 1, 1);
    }
    out.push(c);
  }
  return out;
}
const ITEM_ART = (() => {
  const eagle = bi_eagleArt();
  return { red: bi_apple('red'), gold: bi_apple('gold'), rotten: bi_apple('rotten'), orb: bi_orbArt(), heart: bi_heartArt(),
    eagle, seal: bi_sealArt(eagle), icons: bi_iconsArt(), bolt: bi_boltArt(), fire: bi_fireArt() };
})();

/* ============ Weltgrafiken: Bäume, Häuser, Kirche, Burg, Kleinkram (Reich um 1520) ============ */
/* Alles prozedural in einen Pixelpuffer (Uint32, ABGR), am Ende ein putImageData je Bild. */

/* ---------- Farben ---------- */
const wp_CC = new Map();
function wp_c(h){
  let v = wp_CC.get(h);
  if (v === undefined){
    const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
    const a = h.length > 7 ? parseInt(h.slice(7, 9), 16) : 255;
    v = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0; wp_CC.set(h, v);
  }
  return v;
}
const wp_cl = v => v < 0 ? 0 : v > 255 ? 255 : v | 0;
const wp_pk = (r, g, b, a) => (((a === undefined ? 255 : a) << 24) | (wp_cl(b) << 16) | (wp_cl(g) << 8) | wp_cl(r)) >>> 0;
function wp_mix(c1, c2, t){
  const r1 = c1 & 255, g1 = (c1 >>> 8) & 255, b1 = (c1 >>> 16) & 255;
  const r2 = c2 & 255, g2 = (c2 >>> 8) & 255, b2 = (c2 >>> 16) & 255;
  return wp_pk(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t, c1 >>> 24);
}
const wp_rmp = list => list.map(wp_c);
/* Rampenfarbe mit Bayer-Raster, v 0..1 */
function wp_tone(R, v, x, y){
  if (wp_FINE){ x *= wp_S; y *= wp_S; }
  const n = R.length, i = Math.floor(v * (n - 1) + BAYER4[(y & 3) * 4 + (x & 3)] / 16);
  return R[i < 0 ? 0 : i >= n ? n - 1 : i];
}
const wp_SH = wp_pk(20, 18, 24, 84);     // Bodenschatten (halbdurchsichtig)
const wp_SH2 = wp_pk(20, 18, 24, 120);   // Kernschatten
const wp_OUT = wp_c(OUT);

/* ---------- Zufall und Rauschen (deterministisch) ---------- */
function wp_h(x, y, s){
  if (wp_FINE && (x !== (x | 0) || y !== (y | 0))){ x = Math.floor(x * wp_S) + 7919; y = Math.floor(y * wp_S) + 104729; }   // Feinpixel: eigenes Rauschen
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function wp_hi(x, y, s){   // ganzzahlige Gitterpunkte
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul((s | 0) + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/* Wertrauschen; px = Periode in Gitterzellen (kachelbar in x), 0 = keine */
function wp_vn(x, y, s, px){
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  let x0 = xi, x1 = xi + 1;
  if (px){ x0 = ((x0 % px) + px) % px; x1 = ((x1 % px) + px) % px; }
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = wp_hi(x0, yi, s), b = wp_hi(x1, yi, s), c = wp_hi(x0, yi + 1, s), d = wp_hi(x1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function wp_fbm(x, y, s, oct, px){
  let t = 0, a = .5, f = 1, n = 0;
  for (let i = 0; i < oct; i++){ t += wp_vn(x * f, y * f, s + i * 31, px ? px * f : 0) * a; n += a; a *= .5; f *= 2; }
  return t / n;
}

/* ---------- Pixelpuffer ----------
   Ein Bild hat w × h Bildpunkte; jeder Bildpunkt besteht aus S × S Feinpixeln (S = wp_S beim Anlegen).
   Füllende Grundformen (Rechteck, Vieleck, Ellipse, Strecke) rastern im Feinraster und rufen
   f(x, y) mit Bildkoordinaten in Schritten von 1/S auf; wp_set, wp_dk und wp_tint wirken auf ganze Bildpunkte. */
let wp_S = 1, wp_FINE = 0, wp_WINREC = null;   // wp_WINREC: Fenster mitschreiben (für die Nacht)
function wp_buf(w, h, wrap){ const S = wp_S; return { w, h, S, W: w * S, H: h * S, d: new Uint32Array(w * h * S * S), wrap: !!wrap }; }
/* ein Feinpixel */
function wp_sf(B, X, Y, c){
  if (Y < 0 || Y >= B.H) return;
  if (X < 0 || X >= B.W){ if (!B.wrap) return; X = ((X % B.W) + B.W) % B.W; }
  B.d[Y * B.W + X] = c;
}
function wp_gf(B, X, Y){
  if (Y < 0 || Y >= B.H) return 0;
  if (X < 0 || X >= B.W){ if (!B.wrap) return 0; X = ((X % B.W) + B.W) % B.W; }
  return B.d[Y * B.W + X];
}
/* Feinpixel mit Farbe oder Funktion f(x, y) (Bildkoordinaten) */
function wp_pf(B, X, Y, f){
  let c = f;
  if (typeof f === 'function'){ const o = wp_FINE; wp_FINE = 1; c = f(X / B.S, Y / B.S); wp_FINE = o; }
  if (c) wp_sf(B, X, Y, c);
}
function wp_set(B, x, y, c){
  const S = B.S, X = Math.floor(x) * S, Y = Math.floor(y) * S;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) wp_sf(B, X + i, Y + j, c);
}
function wp_get(B, x, y){ return wp_gf(B, Math.floor(x * B.S), Math.floor(y * B.S)); }
const wp_op = (B, x, y) => (wp_get(B, x, y) >>> 24) === 255;
/* f: Farbe oder Funktion (x,y) -> Farbe | 0 (0 = nichts zeichnen) */
function wp_put(B, x, y, f){
  const S = B.S, X = Math.floor(x) * S, Y = Math.floor(y) * S;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) wp_pf(B, X + i, Y + j, f);
}
function wp_rect(B, x0, y0, x1, y1, f){
  const S = B.S, Y1 = y1 * S, X1 = x1 * S;
  for (let Y = Math.max(0, Math.floor(y0 * S)); Y < Y1 && Y < B.H; Y++) for (let X = Math.floor(x0 * S); X < X1; X++) wp_pf(B, X, Y, f);
}
/* Vieleck füllen (Feinpixelmitten) */
function wp_poly(B, pts, f){
  const S = B.S; let y0 = 1e9, y1 = -1e9;
  for (const p of pts){ if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  const n = pts.length, xs = [];
  for (let Y = Math.max(0, Math.floor(y0 * S)); Y <= Math.min(B.H - 1, Math.ceil(y1 * S)); Y++){
    const yc = (Y + .5) / S; xs.length = 0;
    for (let i = 0; i < n; i++){
      const a = pts[i], b = pts[(i + 1) % n];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2){
      for (let X = Math.ceil(xs[k] * S - .5); X <= Math.floor(xs[k + 1] * S - .5); X++) wp_pf(B, X, Y, f);
    }
  }
}
function wp_ell(B, cx, cy, rx, ry, f){
  const S = B.S;
  for (let Y = Math.floor((cy - ry) * S); Y <= Math.ceil((cy + ry) * S); Y++){
    const t = ((Y + .5) / S - cy) / ry; if (t * t > 1) continue;
    const dx = rx * Math.sqrt(1 - t * t);
    for (let X = Math.ceil((cx - dx) * S - .5); X <= Math.floor((cx + dx) * S - .5); X++) wp_pf(B, X, Y, f);
  }
}
/* Linie (Bresenham im Feinraster, Pinsel ein Bildpunkt); f darf Funktion (x,y,t) sein */
function wp_line(B, x0, y0, x1, y1, f){
  const S = B.S;
  x0 = Math.round(x0) * S; y0 = Math.round(y0) * S; x1 = Math.round(x1) * S; y1 = Math.round(y1) * S;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  const n = Math.max(dx, -dy) || 1; let e = dx + dy, k = 0;
  for (;;){
    let c = f;
    if (typeof f === 'function'){ const o = wp_FINE; wp_FINE = 1; c = f(x0 / S, y0 / S, k / n); wp_FINE = o; }
    if (c) for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) wp_sf(B, x0 + i, y0 + j, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e; if (e2 >= dy){ e += dy; x0 += sx; } if (e2 <= dx){ e += dx; y0 += sy; } k++;
  }
}
/* dicke Strecke: f(x, y, t entlang 0..1, q quer -1..1, nx Normale x) */
function wp_seg(B, x0, y0, x1, y1, wd, f){
  const S = B.S, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, L = Math.sqrt(L2), r = wd / 2;
  const nx = -dy / L, ny = dx / L, fn = typeof f === 'function';
  for (let Y = Math.floor((Math.min(y0, y1) - r - 1) * S); Y <= Math.ceil((Math.max(y0, y1) + r + 1) * S); Y++)
    for (let X = Math.floor((Math.min(x0, x1) - r - 1) * S); X <= Math.ceil((Math.max(x0, x1) + r + 1) * S); X++){
      const px = (X + .5) / S - x0, py = (Y + .5) / S - y0, t = (px * dx + py * dy) / L2;
      if (t < 0 || t > 1) continue;
      const q = px * nx + py * ny; if (Math.abs(q) > r) continue;
      let c = f;
      if (fn){ const o = wp_FINE; wp_FINE = 1; c = f(X / S, Y / S, t, q / (r || 1), nx); wp_FINE = o; }
      if (c) wp_sf(B, X, Y, c);
    }
}
/* quadratische Kurve als Folge dicker Strecken (Äste, Kopfbänder) */
function wp_curve(B, x0, y0, cx, cy, x1, y1, w0, w1, f, steps){
  steps = steps || 8; let px = x0, py = y0;
  for (let i = 1; i <= steps; i++){
    const t = i / steps, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    const nx = a * x0 + b * cx + c * x1, ny = a * y0 + b * cy + c * y1;
    wp_seg(B, px, py, nx, ny, w0 + (w1 - w0) * t, f); px = nx; py = ny;
  }
}
/* vorhandenes deckendes Pixel abdunkeln (k<1) oder aufhellen (k>1); wirkt auf jedes Feinpixel des Bildpunkts */
function wp_dkf(B, X, Y, k){
  const c = wp_gf(B, X, Y); if ((c >>> 24) !== 255) return;
  wp_sf(B, X, Y, k < 1 ? wp_mix(c, wp_OUT, 1 - k) : wp_mix(c, 0xffe8f0f4, Math.min(1, k - 1)));
}
function wp_dk(B, x, y, k){
  const S = B.S, X = Math.floor(x) * S, Y = Math.floor(y) * S;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) wp_dkf(B, X + i, Y + j, k);
}
/* Farbe über vorhandenes deckendes Pixel mischen */
function wp_tintf(B, X, Y, c, a){
  const o = wp_gf(B, X, Y); if ((o >>> 24) !== 255) return;
  wp_sf(B, X, Y, wp_mix(o, c, a));
}
function wp_tint(B, x, y, c, a){
  const S = B.S, X = Math.floor(x) * S, Y = Math.floor(y) * S;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) wp_tintf(B, X + i, Y + j, c, a);
}
/* Schatten auf den Boden: nur auf leere Pixel */
function wp_shadowEll(B, cx, cy, rx, ry, core){
  const S = B.S;
  wp_ell(B, cx, cy, rx, ry, (x, y) => {
    if (wp_get(B, x, y)) return 0;
    const t = ((x + .5 / S - cx) / rx) ** 2 + ((y + .5 / S - cy) / ry) ** 2;
    if (t > .72 && dither(x * S, y * S) < (t - .72) * 3) return 0;
    return core && t < .35 ? wp_SH2 : wp_SH;
  });
}
function wp_shadowPoly(B, pts){ wp_poly(B, pts, (x, y) => wp_get(B, x, y) ? 0 : wp_SH); }

/* Kontur (im Feinraster, ein Feinpixel breit): leere Nachbarpixel; oben/links (Lichtseite) dunkler Materialton, sonst OUT */
function wp_outline(B, soft){
  const w = B.W, h = B.H, d = B.d, o = new Uint32Array(d);
  const op = (x, y) => {
    if (y < 0 || y >= h) return 0;
    if (x < 0 || x >= w){ if (!B.wrap) return 0; x = (x + w) % w; }
    const c = d[y * w + x]; return (c >>> 24) === 255 ? c : 0;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const i = y * w + x; if ((d[i] >>> 24) === 255) continue;
    const r = op(x + 1, y), l = op(x - 1, y), u = op(x, y - 1), dn = op(x, y + 1);
    if (!r && !l && !u && !dn) continue;
    o[i] = (soft && !l && !u) ? wp_mix(dn || r, wp_OUT, .62) : wp_OUT;
  }
  B.d = o;
}
function wp_canvas(B){
  const c = canvasOf(B.W, B.H), g = c.getContext('2d');
  const id = g.createImageData(B.W, B.H);
  id.data.set(new Uint8ClampedArray(B.d.buffer, B.d.byteOffset, B.d.length * 4));
  g.putImageData(id, 0, 0); return c;
}
/* Puffer in Puffer kopieren (nur deckende/teilweise Pixel); beide mit gleichem S */
function wp_blit(D, S2, ox, oy){
  const OX = Math.round(ox * D.S), OY = Math.round(oy * D.S);
  for (let Y = 0; Y < S2.H; Y++) for (let X = 0; X < S2.W; X++){
    const c = S2.d[Y * S2.W + X]; if (c) wp_sf(D, X + OX, Y + OY, c);
  }
}


/* ---------- Farbrampen (bedeckter Tag, gedämpft; dunkel .. hell) ---------- */
const wp_P = {
  stone:  wp_rmp(['#2b2824', '#433e37', '#5a544a', '#716a5d', '#898072', '#a09786', '#b4ab98']),  // Burg: grauer Sandstein
  grey:   wp_rmp(['#292826', '#403e3a', '#57544e', '#6e6a62', '#858077', '#9c968b', '#b0aa9d']),  // Kalkbruchstein
  red:    wp_rmp(['#2f2420', '#4a3730', '#634a3f', '#7b5d4f', '#927261', '#a68874', '#b89c87']),  // roter Sandstein (Kirche)
  dark:   wp_rmp(['#1d1b19', '#2c2926', '#3b3733', '#4b4640', '#5c564e']),                       // Ruß, Fugen
  oak:    wp_rmp(['#1c1612', '#2c221a', '#3d3024', '#4f3e2e', '#624e3a', '#776048']),             // Eichenbalken
  oakred: wp_rmp(['#24130f', '#3a1d16', '#52291e', '#683527', '#7c4331', '#8e553f']),             // ochsenblutroter Anstrich
  wood:   wp_rmp(['#2a2018', '#3f3124', '#574431', '#6f583f', '#88704f', '#9e8660']),             // Bretter
  gwood:  wp_rmp(['#252320', '#38352f', '#4c4840', '#625c52', '#787165', '#8f877a']),             // vergrautes Holz
  plaster:wp_rmp(['#5f5a4d', '#787160', '#908874', '#a69e88', '#b8b09a', '#c8c0aa']),             // Kalkputz
  ochre:  wp_rmp(['#5b4b33', '#756244', '#8d7855', '#a28d66', '#b29e76', '#c0ad86']),             // ockerfarben getüncht
  pink:   wp_rmp(['#5c4640', '#785c53', '#8f7166', '#a48679', '#b49789', '#c2a698']),             // rötlich getüncht
  thatch: wp_rmp(['#28241d', '#3a3429', '#4e4635', '#625841', '#766a4c', '#8a7c58', '#9b8c64']),
  tile:   wp_rmp(['#2e1915', '#43231c', '#582e25', '#6b392d', '#7c4637', '#8b5442', '#99624f']),  // Biberschwanz
  shingle:wp_rmp(['#23211e', '#35322d', '#48443d', '#5c574e', '#706a5f', '#857e71']),
  slate:  wp_rmp(['#1d2024', '#2a2e34', '#383d45', '#474d56', '#575e68', '#69717b']),
  iron:   wp_rmp(['#18181b', '#28292d', '#3b3d43', '#53565d', '#6f737b', '#959aa2']),
  gold:   wp_rmp(['#4e3812', '#73561c', '#9a7629', '#bb9437', '#d1ad4c', '#e0c46a']),
  glass:  wp_rmp(['#1a2220', '#283431', '#394a45', '#4f655e', '#6d857c', '#93a89d']),
  moss:   wp_rmp(['#232b15', '#303b1b', '#3f4c22', '#4f5c2a', '#5f6b33', '#717c3e']),
  lichen: wp_rmp(['#6e7150', '#858660', '#9a9670', '#a9a27a']),
  straw:  wp_rmp(['#3c321d', '#574928', '#726134', '#8b7840', '#a18e4f', '#b4a05f', '#c4b172']),
  earth:  wp_rmp(['#231c16', '#33291f', '#45382a', '#574735', '#6a5841']),
  bark:   wp_rmp(['#1a1512', '#2a221c', '#3a3027', '#4b3f33', '#5d4f40', '#6f604f']),
  beech:  wp_rmp(['#2e302d', '#43453f', '#585a52', '#6e6f65', '#838377', '#999889']),
  birch:  wp_rmp(['#1d1b1a', '#3c3936', '#6a665e', '#928d82', '#b2ad9f', '#c8c3b4']),
  char:   wp_rmp(['#110f0e', '#1b1816', '#272320', '#36302b', '#463e37']),                       // verkohlt
  cloth:  wp_rmp(['#2a2622', '#4a443b', '#6e665a', '#958c7c', '#b3aa98', '#c7bfad']),             // Leinen
  red2:   wp_rmp(['#2c1210', '#481b17', '#65251f', '#7f3027', '#963d31', '#a8503f']),             // Tuchrot
  blue2:  wp_rmp(['#161a24', '#212839', '#2e384f', '#3d4a65', '#4f5d78', '#64728b']),
  yel2:   wp_rmp(['#3f3014', '#5e4a1d', '#7d6428', '#9a7d35', '#b29546', '#c4a959']),
  flesh:  wp_rmp(['#4a3326', '#6b4c39', '#8a674f', '#a68166', '#b8957a'])
};
const wp_LEAF = {
  apfel:  wp_rmp(['#121910', '#1a2414', '#24311a', '#2f3e20', '#3c4c27', '#4a5a2f', '#5a6938', '#6d7a44', '#848c55']),
  eiche:  wp_rmp(['#0f160f', '#162014', '#1e2b19', '#28371e', '#324325', '#3e502c', '#4c5e35', '#5d6d40', '#727e4f']),
  buche:  wp_rmp(['#141b0f', '#1c2613', '#263319', '#31411f', '#3d4f26', '#4a5e2e', '#596d37', '#6b7d42', '#818f52']),
  fichte: wp_rmp(['#0d1311', '#131c18', '#19251f', '#203027', '#283b30', '#314639', '#3c5243', '#4a604f']),
  birke:  wp_rmp(['#192312', '#223019', '#2d3e1f', '#3a4d26', '#475c2e', '#566c37', '#677c42', '#7b8d50', '#909f60']),
  weide:  wp_rmp(['#191f15', '#222b1c', '#2d3824', '#39452d', '#465337', '#546142', '#64704f', '#76815e', '#8a936f']),
  busch:  wp_rmp(['#121a0f', '#1a2414', '#24311a', '#2e3e20', '#3a4b27', '#47592f', '#566737', '#677642'])
};

/* ============ Jahreszeiten: ein Jahr für alle Ritter ============
   Jede Jahreszeit dauert vier Spieltage (96 Minuten). Bäume werden je Jahreszeit gemalt (Blüte, Laub, Herbstfarben, kahl),
   im Winter liegt Schnee auf Dächern, Mauern und Zweigen. */
const SEA_LEN = 4 * 1440, SEA_NAME = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
const seaAt = t => window.__season != null ? (+window.__season & 3) : Math.floor(t / SEA_LEN) % 4;
const seaNow = () => seaAt(Date.now() / 1000 + (window.__skyShift || 0));
let wp_SEA = seaNow();                     // Jahreszeit, in der gerade gemalt wird
const wp_LEAF0 = Object.assign({}, wp_LEAF), wp_ROOF0 = { thatch: wp_P.thatch, tile: wp_P.tile, shingle: wp_P.shingle, slate: wp_P.slate };
const wp_LEAF_SEA = [
  { // Frühling: helles, junges Grün
    apfel: wp_rmp(['#16200f', '#20301a', '#2c401f', '#3a5126', '#48632e', '#587436', '#6a8640', '#7e984c', '#96aa5c']),
    eiche: wp_rmp(['#141e10', '#1c2a15', '#26381b', '#314721', '#3d5728', '#4b6830', '#5b793a', '#6d8a46', '#829b55']),
    buche: wp_rmp(['#18220f', '#223214', '#2e431a', '#3b5520', '#496827', '#587b30', '#6a8d3a', '#7e9f46', '#94b056']),
    birke: wp_rmp(['#1c2a12', '#283a19', '#364d20', '#466028', '#567430', '#68873a', '#7c9a46', '#92ac54', '#a8bd66']),
    weide: wp_rmp(['#1c2416', '#26311e', '#324026', '#3f502f', '#4d6039', '#5c7044', '#6d8150', '#80915e', '#95a26e']),
    busch: wp_rmp(['#16200f', '#1f2c14', '#2a3b1a', '#364b21', '#435c29', '#516c31', '#617d3a', '#728d45'])
  },
  {},
  { // Herbst: Eiche braun, Buche kupfern, Birke golden, Busch rot
    apfel: wp_rmp(['#1c1a0e', '#2a2612', '#3a3417', '#4b431c', '#5d5222', '#6e6029', '#806f31', '#93803b', '#a89248']),
    eiche: wp_rmp(['#1a120c', '#281b10', '#382614', '#4a3218', '#5c3f1c', '#6e4c22', '#805a29', '#926a33', '#a67c40']),
    buche: wp_rmp(['#1e100a', '#2e170c', '#42200e', '#562a10', '#6c3512', '#824216', '#97511c', '#aa6226', '#bc7634']),
    birke: wp_rmp(['#2a220c', '#3c3010', '#504014', '#665218', '#7c641c', '#927622', '#a6882a', '#b89a36', '#c8ac46']),
    weide: wp_rmp(['#222210', '#302f15', '#403e1b', '#504e22', '#615e2a', '#726e33', '#837e3e', '#958f4b', '#a8a05a']),
    busch: wp_rmp(['#200e0a', '#30140c', '#441a0e', '#5a2210', '#702a12', '#863416', '#9a401c', '#ae4e26'])
  },
  { // Winter: Laubkronen kahl (siehe wp_bareCrown); Birkenreiser, dürres Gras
    birke: wp_rmp(['#1e1618', '#2a2024', '#382a2e', '#46363a', '#544246', '#624e50', '#705a5a', '#7e6664', '#8c726e']),
    weide: wp_rmp(['#2a2418', '#3a3220', '#4c4229', '#5e5233', '#70623d', '#827248', '#938254', '#a49262', '#b4a270']),
    busch: wp_rmp(['#2a2418', '#3a3220', '#4c4229', '#5e5233', '#70623d', '#827248', '#938254', '#a49262'])
  }
];
const wp_SNOW = ['#4c5466', '#6a7388', '#8a93a8', '#a9b2c4', '#c4cbd8', '#dbe0e9', '#ecf0f4', '#f6f8fa'];
const wp_ROOF_SNOW = {};
for (const k in wp_ROOF0){ const n = wp_ROOF0[k].length; wp_ROOF_SNOW[k] = wp_rmp(Array.from({ length: n }, (_, i) => wp_SNOW[Math.round(1 + i / (n - 1) * 6)])); }
/* Paletten einer Jahreszeit setzen (vor dem Malen) */
function wp_season(s){
  wp_SEA = s;
  Object.assign(wp_LEAF, wp_LEAF0, wp_LEAF_SEA[s]);
  Object.assign(wp_P, s === 3 ? wp_ROOF_SNOW : wp_ROOF0);
}
wp_season(wp_SEA);
/* Winter: kahle Krone aus Ästen und feinen Zweigen statt Laub */
function wp_bareCrown(B, o){
  const R = rng(o.s + 77), lobes = o.lobes || [[o.cx, o.cy, o.rx, o.ry]];
  const limb = (x, y) => wp_tone(wp_P.bark, .3 + (wp_h(x, y, o.s) - .5) * .2, x, y), twig = (x, y, t) => wp_P.bark[t < .5 ? 2 : 1];
  const bx = o.cx, by = o.cy + o.ry * .5;
  for (const l of lobes){
    const ex = l[0] + (R() - .5) * l[2] * .3, ey = l[1] - l[3] * .15;
    wp_limb(B, bx + (R() - .5) * 4, by, (bx + ex) / 2 + (R() - .5) * 6, (by + ey) / 2, ex, ey, 2.2, 1.1, limb);
    for (let i = 0, n = 4 + (R() * 4 | 0); i < n; i++){
      const a = -Math.PI / 2 + (R() - .5) * 2.8, d = .55 + R() * .45, x1 = ex + Math.cos(a) * l[2] * d, y1 = ey + Math.sin(a) * l[3] * d;
      wp_line(B, ex, ey, x1, y1, twig);
      if (R() < .6){ const a2 = a + (R() - .5) * 1.3; wp_line(B, x1, y1, x1 + Math.cos(a2) * 4, y1 + Math.sin(a2) * 4, twig); }
    }
  }
  return [];
}
/* Frühling: Apfelblüten in der Krone */
function wp_blossoms(B, cx, cy, rx, ry, n, s){
  const R = rng(s), BL = [wp_c('#f8f2f4'), wp_c('#f2d6de'), wp_c('#e2aec0')];
  for (let i = 0; i < n * 16; i++){
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * .94, x = Math.round(cx + Math.cos(a) * d * rx), y = Math.round(cy + Math.sin(a) * d * ry * .92);
    if (!wp_op(B, x, y)) continue;
    const c = BL[R() < .55 ? 0 : R() < .6 ? 1 : 2];
    wp_set(B, x, y, c); if (R() < .45) wp_set(B, x + 1, y, c); if (R() < .3) wp_set(B, x, y + 1, BL[2]);
  }
  return [];
}
/* Schnee auf ein fertiges Bild legen: auf jede Oberkante (über ihr ist es durchsichtig) ein paar Feinpixel Schnee,
   die dunkle Kontur oben bleibt stehen, die untere auch. Flache Kanten bekommen mehr Schnee als steile. */
function snowify(img, seed){
  const w = img.width, h = img.height, c = canvasOf(w, h), g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, w, h), d = id.data, op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 160;
  const SN = [[0xf6, 0xf8, 0xfb], [0xe6, 0xeb, 0xf1], [0xd2, 0xd9, 0xe3], [0xb4, 0xbe, 0xcd]];
  const top = new Int16Array(w).fill(-1);
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (op(x, y)){ top[x] = y; break; }
  for (let x = 0; x < w; x++){
    for (let y = 0; y < h; y++){
      if (!op(x, y) || op(x, y - 1)) continue;
      // Neigung: wie weit liegen die Oberkanten der Nachbarspalten daneben?
      let sl = 0;
      if (top[x] === y){ const a = top[x - 1] >= 0 ? Math.abs(top[x - 1] - y) : 3, b = top[x + 1] >= 0 ? Math.abs(top[x + 1] - y) : 3; sl = Math.min(a, b); }
      const dep = sl > 3 ? 1 : sl > 1 ? 2 : 2 + (wo_h(x >> 2, y >> 3, seed) * 3 | 0);
      for (let k = 1; k <= dep; k++){
        const yy = y + k; if (!op(x, yy) || !op(x, yy + 1)) break;
        const o = (yy * w + x) * 4, col = SN[k === 1 ? 0 : k === dep ? 3 : k === 2 ? 1 : 2];
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2];
      }
    }
  }
  g.putImageData(id, 0, 0);
  return c;
}
const SNOW_IMG = new Map();
const snowCached = img => { let c = SNOW_IMG.get(img); if (!c){ c = snowify(img, img.width * 7 + img.height); SNOW_IMG.set(img, c); } return c; };

/* ---------- Quadermauerwerk ----------
   o: R Rampe, s Seed, ch Schichthöhe, bmin/bmax Steinlänge, per Periode in x (kachelbar),
   ux(x,y) Bogenmaß (Rundturm), curve(x) Schichtversatz, lit(x,y) Zusatzlicht, oy Versatz,
   buckel Buckelquader, moss(x,y) 0..1, stain Schlieren, mo Fugenrampe */
function wp_ashlar(o){
  const R = o.R, s = o.s | 0, ch = o.ch || 6, b0 = o.bmin || 8, b1 = o.bmax || 15, per = o.per || 512;
  const MO = o.mo || wp_P.dark, rows = new Map();
  const row = r => {
    let a = rows.get(r); if (a) return a;
    const st = []; let u = 0, k = 0;
    while (u < per){ let L = b0 + Math.floor(wp_h(r, k, s + 7) * (b1 - b0 + 1)); if (per - (u + L) < b0) L = per - u; st.push(u); u += L; k++; }
    st.push(per); a = { st, off: Math.floor(wp_h(r, 1, s) * per) }; rows.set(r, a); return a;
  };
  const pn = per / 4, pm = per / 8;
  return (x, y) => {
    const u0 = o.ux ? o.ux(x, y) : x, v = Math.floor(y - (o.curve ? o.curve(x) : 0) + (o.oy || 0));
    const u = Math.floor(u0), uw = ((u % per) + per) % per;
    const r = Math.floor(v / ch), ly = v - r * ch, rw = row(r);
    const uu = (((u - rw.off) % per) + per) % per;
    let k = 0; while (rw.st[k + 1] <= uu) k++;
    const lx = uu - rw.st[k], bw = rw.st[k + 1] - rw.st[k];
    const lit = o.lit ? o.lit(x, y) : 0;
    if (ly === ch - 1 || lx === 0){
      return wp_tone(MO, .45 + lit * .5 + (wp_h(uw, v, s + 2) - .5) * .5, x, y);
    }
    const id = wp_h(k, r, s + 3);
    let t = .5 + (id - .5) * .34 + (wp_fbm(uw * .25, v * .25, s + 5, 2, pn) - .5) * .42 + (wp_h(uw, v, s + 9) - .5) * .12 + lit;
    if (ly === 0) t += .16; else if (ly === ch - 2) t -= .13;
    if (lx === 1) t += .08; else if (lx === bw - 1) t -= .1;
    if (o.buckel && bw > 6 && ch > 5){
      // Buckel: rauer Kern mit hellem Rand oben links, dunkel unten rechts
      if (lx >= 2 && lx <= bw - 3 && ly >= 1 && ly <= ch - 3){
        t += .06 + (wp_h(uw, v, s + 21) - .5) * .22;
        if (ly === 1 || lx === 2) t += .12;
        if (ly === ch - 3 || lx === bw - 3) t -= .2;
      } else t += .05;
    }
    // Witterungsschlieren (senkrecht)
    if (o.stain){ const sv = wp_fbm(uw * .5, v * .06, s + 11, 2, per / 2); if (sv > .56) t -= (sv - .56) * o.stain * 2.2; }
    // gelegentlich verwitterter / ausgebrochener Stein
    if (id > .94 && ((lx + ly) & 1)) t -= .18;
    let m = o.moss ? o.moss(x, y) : 0;
    if (m > 0){
      const n = wp_fbm(uw * .125, v * .125, s + 13, 3, pm);
      m = m + (n - .5) * 1.2;
      if (m > .5) return wp_tone(wp_P.moss, .3 + (m - .5) * .9 + lit + (ly === 0 ? .15 : 0) + (wp_h(uw, v, s + 4) - .5) * .3, x, y);
    }
    if (wp_h(uw, v, s + 17) > .994) return wp_P.lichen[(wp_h(uw, v, 3) * 2 | 0)];
    return wp_tone(R, t, x, y);
  };
}

/* ---------- Bruchsteinmauerwerk (unregelmäßig, Zellenrauschen) ---------- */
function wp_rubble(o){
  const R = o.R, s = o.s | 0, cw = o.cw || 7, chh = o.chh || 5, per = o.per || 0, MO = o.mo || wp_P.dark;
  const nx = per ? Math.round(per / cw) : 0, cwe = per ? per / nx : cw;
  return (x, y) => {
    const u = o.ux ? o.ux(x, y) : x, v = y - (o.curve ? o.curve(x) : 0) + (o.oy || 0);
    const gx = Math.floor(u / cwe), gy = Math.floor(v / chh);
    let d1 = 1e9, d2 = 1e9, cx1 = 0, cy1 = 0, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++){
      const X = gx + i, Y = gy + j, Xw = nx ? ((X % nx) + nx) % nx : X;
      const off = (Y & 1) * .5;
      const px = (X + off + .2 + wp_h(Xw, Y, s) * .6) * cwe, py = (Y + .15 + wp_h(Xw, Y, s + 1) * .7) * chh;
      const dx = (u - px) / cwe, dy = (v - py) / chh, d = dx * dx + dy * dy;
      if (d < d1){ d2 = d1; d1 = d; cx1 = dx; cy1 = dy; id = wp_h(Xw, Y, s + 2); } else if (d < d2) d2 = d;
    }
    const e = Math.sqrt(d2) - Math.sqrt(d1);
    const uw = per ? ((Math.floor(u) % per) + per) % per : Math.floor(u), vi = Math.floor(v);
    const lit = o.lit ? o.lit(x, y) : 0;
    if (e < (o.joint || .16)) return wp_tone(MO, .4 + lit * .5 + (wp_h(uw, vi, s + 5) - .5) * .5, x, y);
    let t = .48 + (id - .5) * .45 - cy1 * .38 - cx1 * .14 + (wp_h(uw, vi, s + 6) - .5) * .16 + lit;
    if (e < .3) t -= .06;
    let m = o.moss ? o.moss(x, y) : 0;
    if (m > 0){
      const n = wp_fbm(uw * .125, vi * .125, s + 13, 3, per ? per / 8 : 0); m += (n - .5) * 1.2;
      if (m > .5) return wp_tone(wp_P.moss, .3 + (m - .5) * .9 - cy1 * .3 + lit, x, y);
    }
    if (wp_h(uw, vi, s + 17) > .994) return wp_P.lichen[(wp_h(uw, vi, 3) * 2 | 0)];
    return wp_tone(R, t, x, y);
  };
}

/* ---------- Kalkputz mit Schmutz, Rissen und abgeplatzten Stellen ----------
   o: R, s, base (y Boden für Spritzschmutz), flake 0..1, under (Funktion für Untergrund), per */
function wp_plaster(o){
  const R = o.R, s = o.s | 0, per = o.per || 0;
  return (x, y) => {
    const xw = per ? ((x % per) + per) % per : x, pq = per ? per / 16 : 0;
    let t = .66 + (wp_fbm(xw * .0625, y * .0625, s, 3, pq) - .5) * .32 + (wp_h(xw, y, s) - .5) * .1 + (o.lit ? o.lit(x, y) : 0);
    if (o.base !== undefined){
      const d = (y - (o.base - 9)) / 9;
      if (d > 0) t -= d * (.22 + wp_fbm(xw * .25, y * .5, s + 3, 2, per ? per / 4 : 0) * .25);
    }
    if (o.flake){
      const f = wp_fbm(xw * .125, y * .17, s + 7, 3, per ? per / 8 : 0);
      if (f > 1 - o.flake * .42){
        if (f < 1 - o.flake * .42 + .03) t -= .2;     // Bruchkante
        else if (o.under) return o.under(x, y);
      }
    }
    // Wasserflecken
    const wv = wp_fbm(xw * .25, y * .045, s + 9, 2, per ? per / 4 : 0); if (wv > .6) t -= (wv - .6) * .9;
    return wp_tone(R, t, x, y);
  };
}

/* ---------- Biberschwanz-Ziegel; u entlang der Reihe, v hangabwärts ---------- */
function wp_tileAt(R, u, v, x, y, s, extra){
  const tw = 4, th = 3, vi = Math.floor(v), r = Math.floor(vi / th), ly = vi - r * th;
  const uu = Math.floor(u) + (r & 1) * 2, k = Math.floor(uu / tw), lx = uu - k * tw;
  const id = wp_h(k, r, s);
  let t = .56 + (id - .5) * .36 + (wp_vn(u * .12, v * .12, s + 3) - .5) * .3 + (extra || 0);
  if (ly === 0) t -= .34;
  else if (ly === th - 1 && (lx === 0 || lx === tw - 1)) t -= .4;
  else if (lx === 0) t -= .14;
  if (ly === 1 && lx === 1) t += .1;
  if (id > .955) t -= .28; else if (id < .03) t += .16;
  return wp_tone(R, t, x, y);
}
/* Schindeln (Holz), schmal und länger */
function wp_shingleAt(R, u, v, x, y, s, extra){
  const tw = 3, th = 4, vi = Math.floor(v), r = Math.floor(vi / th), ly = vi - r * th;
  const uu = Math.floor(u) + (r % 3) , k = Math.floor(uu / tw), lx = uu - k * tw;
  const id = wp_h(k, r, s);
  let t = .55 + (id - .5) * .4 + (wp_h(Math.floor(u), r, s + 1) - .5) * .12 + (extra || 0);
  if (ly === 0) t -= .32; else if (lx === 0) t -= .2; else if (ly === 1) t += .08;
  if (id > .96) t -= .3;
  return wp_tone(R, t, x, y);
}
/* Stroh: Lagen mit senkrechten Halmstrichen, helle Oberkante, Schattenfuge */
function wp_thatchAt(R, u, v, x, y, s, extra){
  const ui = Math.floor(u), wob = Math.floor(wp_vn(u * .06, 0, s + 2) * 3), vv = Math.floor(v) + wob;
  const row = Math.floor(vv / 5), band = vv - row * 5;
  let t = .5 + (wp_h(ui, row, s) - .5) * .3 + (wp_h(ui >> 1, row, s + 1) - .5) * .2 + (wp_fbm(u * .06, v * .07, s + 9, 2) - .5) * .3 + (extra || 0);
  t += [.16, .1, .03, -.06, -.26][band];
  if (band === 4 && wp_h(ui, row, s + 4) > .6) t += .14;                 // Halmenden ragen über die Fuge
  if (wp_h(ui, Math.floor(v), s + 5) > .95) t += .14;
  return wp_tone(R, t, x, y);
}

/* ---------- Holz ---------- */
/* Balken mit Maserung und Licht von oben links */
function wp_beam(B, x0, y0, x1, y1, wd, R, s, o){
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const lk = -(.6 * nx + .8 * ny);
  o = o || {};
  wp_seg(B, x0, y0, x1, y1, wd, (x, y, t, q) => {
    if (o.mask && !o.mask(x, y)) return 0;
    const a = t * L, g = wp_vn(a * .22, (q + 1) * wd * .7, s);
    let v = .5 + q * lk * .32 + (g - .5) * .55 + (wp_h(x, y, s) - .5) * .12 + (o.lit || 0);
    if (Math.abs(q) > .7) v += q * lk > 0 ? .1 : -.16;
    if (wd >= 3 && Math.abs(q) < .3 && wp_vn(a * .15, 0, s + 9) > .7) v -= .3;   // Schwundriss
    return wp_tone(R, v, x, y);
  });
}
/* senkrechte Bretter: bw Brettbreite */
function wp_planks(R, s, bw, o){
  o = o || {};
  return (x, y) => {
    const k = Math.floor((x - (o.ox || 0)) / bw), lx = x - (o.ox || 0) - k * bw;
    const id = wp_h(k, 0, s);
    if (lx === 0) return wp_tone(R, .08, x, y);
    let t = .45 + (id - .5) * .3 + (wp_vn(lx * .8 + k * 7, y * .18, s + 1) - .5) * .5 + (o.lit ? o.lit(x, y) : 0);
    if (lx === 1) t += .12; else if (lx === bw - 1) t -= .1;
    if (wp_h(k, Math.floor(y / 3), s + 4) > .96) t -= .3;   // Astloch
    return wp_tone(R, t, x, y);
  };
}
/* waagerechte Bretter */
function wp_hplanks(R, s, bh, o){
  o = o || {};
  return (x, y) => {
    const k = Math.floor((y - (o.oy || 0)) / bh), ly = y - (o.oy || 0) - k * bh;
    if (ly === bh - 1) return wp_tone(R, .05, x, y);
    let t = .45 + (wp_h(k, 0, s) - .5) * .3 + (wp_vn(x * .18, ly * .8 + k * 7, s + 1) - .5) * .5 + (o.lit ? o.lit(x, y) : 0);
    if (ly === 0) t += .14;
    return wp_tone(R, t, x, y);
  };
}

/* ---------- Risse, Moos, Efeu ---------- */
function wp_crack(B, x, y, len, s, mask){
  const R = rng(s);
  let dx = R() < .5 ? -1 : 1;
  for (let i = 0; i < len; i++){
    if (!mask || mask(x, y)){
      if (wp_op(B, x, y)){ wp_dk(B, x, y, .35); wp_dk(B, x - 1, y, 1.12); }
    }
    if (R() < .55) y++; else x += dx;
    if (R() < .2) dx = -dx;
  }
}
/* Efeu / Ranken an Mauern */
function wp_ivy(B, x, y, len, s, mask){
  const R = rng(s), L = wp_LEAF.eiche;
  let px = x, py = y;
  for (let i = 0; i < len; i++){
    px += Math.round((R() - .5) * 2.2); py -= R() < .75 ? 1 : 0;
    if (mask && !mask(px, py)) continue;
    if (!wp_op(B, px, py)) continue;
    wp_set(B, px, py, L[1]);
    if (R() < .55){
      const lx = px + (R() < .5 ? -1 : 1), ly = py + (R() < .5 ? 0 : 1);
      if (wp_op(B, lx, ly)){ wp_set(B, lx, ly, L[3 + (R() * 3 | 0)]); if (R() < .5 && wp_op(B, lx, ly - 1)) wp_set(B, lx, ly - 1, L[5 + (R() * 2 | 0)]); }
    }
  }
}
/* Grasbüschel am Fuß */
function wp_grass(B, x, y, n, s, R2){
  const R = rng(s), G = R2 || wp_LEAF.buche;
  for (let i = 0; i < n; i++){
    const gx = x + Math.round((R() - .5) * 2 * i), h = 1 + (R() * 4 | 0), lean = R() < .5 ? -1 : 1;
    for (let k = 0; k < h; k++) wp_set(B, gx + (k > 1 ? lean : 0), y - k, G[2 + Math.min(5, k + (R() * 2 | 0))]);
  }
}

/* ---------- Fenster und Türen ---------- */
/* Butzenscheiben (Bleiverglasung mit runden Scheiben); kreuz = Fensterkreuz */
function wp_window(B, x, y, w, h, o){
  o = o || {};
  if (wp_WINREC && !o.dark) wp_WINREC.push([x, y, w, h]); const G = wp_P.glass, Rf = o.frame || wp_P.oak, s = o.s || 1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){
    const X = x + i, Y = y + j;
    if (o.shape && !o.shape(i, j)) continue;
    if (i === 0 || j === 0 || i === w - 1 || j === h - 1){ wp_set(B, X, Y, wp_tone(Rf, i === 0 || j === 0 ? .15 : .3, X, Y)); continue; }
    if (o.kreuz && (i === (w >> 1) || (h > 7 && j === Math.round(h * .4)))){ wp_set(B, X, Y, wp_tone(Rf, i === (w >> 1) ? .45 : .6, X, Y)); continue; }
    if (o.dark){ wp_set(B, X, Y, wp_P.dark[j < 2 ? 0 : 1]); continue; }
    // Glasbild: Butzenscheiben in Blei (im Feinraster), Spiegelung von oben links
    wp_put(B, X, Y, (fx, fy) => {
      const u = Math.round((fx - x) * B.S), v = Math.round((fy - y) * B.S), S3 = B.S + 1, pu = Math.floor(u / S3), pv = Math.floor(v / S3), lu = u - pu * S3, lv = v - pv * S3;
      const refl = 1 - ((fx - x) / w + (fy - y) / h) * .9 + (wp_h(pu, pv, s) - .5) * .2;
      if (lu === 0 || lv === 0) return wp_tone(G, .08, fx, fy);                       // Bleisprosse
      let t = .3 + refl * .35 + (lu === 1 && lv === 1 ? .22 : 0) - (lu === S3 - 1 && lv === S3 - 1 ? .12 : 0);
      if (lu === 1 && lv === 1 && wp_h(pu, pv, s + 3) > .7 && refl > .5) t = .92;
      return wp_tone(G, t, fx, fy);
    });
  }
  if (o.sill){ for (let i = -1; i <= w; i++) wp_set(B, x + i, y + h, wp_tone(o.sill, i < w / 2 ? .7 : .5, x + i, y + h)); }
}
/* Fensterladen (Brett mit Querleiste) */
function wp_shutter(B, x, y, w, h, R, s){
  wp_rect(B, x, y, x + w, y + h, wp_planks(R, s, 2, { ox: x }));
  for (let i = 0; i < w; i++){ wp_set(B, x + i, y + 1, wp_tone(R, .7, x + i, y + 1)); wp_set(B, x + i, y + h - 2, wp_tone(R, .6, x + i, y + h - 2)); }
  for (let j = 0; j < h; j++){ wp_set(B, x, y + j, R[0]); wp_set(B, x + w - 1, y + j, R[1]); }
}
/* Tür: Bretter, Langbänder, Ring; arch: 'flat' | 'round' | 'spitz' | 'korb' (Vorhang/Kielbogen) */
function wp_door(B, x, y, w, h, o){
  o = o || {}; const Rw = o.R || wp_P.wood, I = wp_P.iron, s = o.s || 5, arch = o.arch || 'flat';
  const ah = arch === 'flat' ? 0 : arch === 'round' ? Math.ceil(w / 2) : arch === 'spitz' ? Math.ceil(Math.sqrt(w * .8 * w * .8 - (w * .8 - w / 2) ** 2)) : 3;
  const inside = (i, j) => {
    if (j >= ah) return true;
    const cx = (w - 1) / 2, dx = Math.abs(i - cx);
    if (arch === 'round') return (dx / (w / 2)) ** 2 + ((ah - j - .5) / ah) ** 2 <= 1.02;
    if (arch === 'spitz'){ const r = w * .8, px = i + .5, py = ah - j - .5; return Math.hypot(px - r, py) <= r && Math.hypot(px - (w - r), py) <= r; }
    return dx < w / 2 - (ah - j) * .7;
  };
  const pl = wp_planks(Rw, s, 3, { ox: x });
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){
    if (!inside(i, j)) continue;
    const X = x + i, Y = y + j;
    if (o.open){ wp_set(B, X, Y, wp_P.dark[j < 3 ? 0 : (i < 2 ? 0 : 1)]); continue; }
    if (!inside(i, j - 1) || !inside(i - 1, j) || !inside(i + 1, j)) wp_set(B, X, Y, wp_tone(Rw, .05, X, Y));
    else wp_put(B, X, Y, pl);
  }
  if (o.open) return;
  // Langbänder mit Nieten
  const bands = h > 22 ? [ah + 3, h - 6, ah + ((h - ah) >> 1) - 1] : [ah + 2, h - 5];
  for (const by of bands){
    const len = Math.round(w * .78);
    for (let i = 1; i < len; i++){
      if (!inside(i, by)) continue;
      wp_set(B, x + i, y + by, I[i % 4 === 1 ? 4 : 2]); wp_set(B, x + i, y + by + 1, I[1]);
    }
    wp_set(B, x + len, y + by, I[3]);           // Bandende (Lilie)
    wp_set(B, x + len, y + by - 1, I[2]); wp_set(B, x + len, y + by + 1, I[1]);
  }
  // Zugring und Schloss
  const rx = x + w - 3, ry = y + Math.round(ah + (h - ah) * .5);
  wp_set(B, rx, ry, I[4]); wp_set(B, rx - 1, ry + 1, I[2]); wp_set(B, rx + 1, ry + 1, I[2]); wp_set(B, rx, ry + 2, I[1]);
  if (o.frame){
    for (let j = 0; j < h; j++){
      for (let i = -1; i <= w; i++){
        if (inside(i, j)) continue;
        if (inside(i - 1, j) || inside(i + 1, j) || inside(i, j + 1) || (i >= 0 && i < w && inside(i, j + 1))){
          wp_set(B, x + i, y + j, wp_tone(o.frame, i < w / 2 ? .75 : .5, x + i, y + j));
        }
      }
    }
  }
}


/* ---------- Licht und Projektion ----------
   3D: X nach rechts (Osten), Y nach oben, Z nach hinten (Norden). Bild: x = ax + X, y = ay - Z - Y.
   Licht von oben links (Nordwest, hoch) */
const wp_LV = (() => { const v = [-.5, .8, .12], n = Math.hypot(v[0], v[1], v[2]); return v.map(a => a / n); })();
function wp_lit(nx, ny, nz){ const m = Math.hypot(nx, ny, nz) || 1; return (nx * wp_LV[0] + ny * wp_LV[1] + nz * wp_LV[2]) / m; }
function wp_img(w, h, ay, wrap){ const B = wp_buf(w, h, wrap); B.ax = w >> 1; B.ay = ay; return B; }
const wp_sx = (B, X) => B.ax + X;
const wp_sy = (B, Y, Z) => B.ay - (Z || 0) - Y;
/* Ebene P0 + a*U + b*V für (a,b) im Vieleck poly2; f(a, b, x, y) -> Farbe */
function wp_plane(B, P0, U, V, poly2, f){
  const ox = B.ax + P0[0], oy = B.ay - P0[2] - P0[1];
  const ux = U[0], uy = -U[2] - U[1], vx = V[0], vy = -V[2] - V[1];
  const det = ux * vy - uy * vx; if (Math.abs(det) < 1e-6) return;
  const pts = poly2.map(p => [ox + p[0] * ux + p[1] * vx, oy + p[0] * uy + p[1] * vy]);
  wp_poly(B, pts, (x, y) => {
    const dx = x + .5 - ox, dy = y + .5 - oy;
    return f((dx * vy - dy * vx) / det, (ux * dy - uy * dx) / det, x, y);
  });
}
/* deckende Pixel im Rechteck abdunkeln; a Stärke, fade: Zeilen mit Raster-Auslauf nach unten */
function wp_shade(B, x0, y0, x1, y1, a, fade, col){
  col = col || wp_OUT; const S = B.S;
  for (let Y = Math.floor(y0 * S); Y < y1 * S; Y++) for (let X = Math.floor(x0 * S); X < x1 * S; X++){
    if (fade){ const t = (Y / S - y0) / fade; if (t > 1) continue; if (dither(X, Y) < t) continue; }
    wp_tintf(B, X, Y, col, a);
  }
}
/* deckende Pixel per Maske abdunkeln */
function wp_shadeIf(B, x0, y0, x1, y1, m, a){
  const S = B.S;
  for (let Y = Math.floor(y0 * S); Y < y1 * S; Y++) for (let X = Math.floor(x0 * S); X < x1 * S; X++) if (m(X / S, Y / S)) wp_tintf(B, X, Y, wp_OUT, a);
}
/* Bodenschatten als Vieleck (nur leere Pixel), weicher Rand */
function wp_groundShadow(B, cx, cy, rx, ry){ wp_shadowEll(B, cx, cy, rx, ry, true); }

/* ---------- Dachdeckung ----------
   liefert f(u, v, x, y, e): u entlang der Traufe, v hangabwärts (px), e Lichtzuschlag */
function wp_roofFn(mat, s, o){
  o = o || {};
  const moss = o.moss || 0, R = o.R;
  return (u, v, x, y, e) => {
    let c;
    if (mat === 'thatch') c = wp_thatchAt(R || wp_P.thatch, u, v, x, y, s, e);
    else if (mat === 'shingle') c = wp_shingleAt(R || wp_P.shingle, u, v, x, y, s, e);
    else if (mat === 'slate') c = wp_slateAt(R || wp_P.slate, u, v, x, y, s, e);
    else c = wp_tileAt(R || wp_P.tile, u, v, x, y, s, e);
    if (moss){
      const m = wp_fbm(u * .09, v * .14, s + 77, 3) + moss - .5 + (o.mossLow ? v * o.mossLow : 0);
      if (m > .62){
        const t = .35 + (m - .62) * 1.6 + e * .6 + (wp_h(Math.floor(u), Math.floor(v), s + 3) - .5) * .35;
        return wp_tone(mat === 'thatch' ? wp_P.moss : wp_LEAF.busch, t, x, y);
      }
    }
    return c;
  };
}
/* Schiefer: kleine schräge Schuppen (altdeutsche Deckung) */
function wp_slateAt(R, u, v, x, y, s, extra){
  const vi = Math.floor(v), r = Math.floor(vi / 3), ly = vi - r * 3;
  const uu = Math.floor(u + v * .5) + (r & 1) * 2, k = Math.floor(uu / 4), lx = uu - k * 4;
  const id = wp_h(k, r, s);
  let t = .5 + (id - .5) * .3 + (wp_vn(u * .1, v * .1, s + 3) - .5) * .25 + (extra || 0);
  if (ly === 0) t -= .3; else if (lx === 0) t -= .16;
  if (ly === 1 && lx === 2) t += .12;
  if (id > .96) t += .2;
  return wp_tone(R, t, x, y);
}

/* ---------- Traufständiges Dach ----------
   o: X0, X1 Wandkanten, D Tiefe, Hw Traufhöhe (Wand), Hr Firsthöhe über Hw, ov Überstand vorn, ovs seitlich,
   end 'gable' | 'half' | 'hip', mat, s, moss, ridge (Firstziegel) */
function wp_roofEaves(B, o){
  const D = o.D, Hw = o.Hw, Hr = o.Hr, ov = o.ov === undefined ? 2 : o.ov, ovs = o.ovs === undefined ? 2 : o.ovs;
  const Z0 = o.Z0 || 0, Zr = Z0 + D / 2, Yr = Hw + Hr, sl = Hr / (D / 2);
  const Ze = Z0 - ov, Ye = Hw - ov * sl;
  const Xl = o.X0 - ovs, Xr = o.X1 + ovs, len = Math.hypot(Zr - Ze, Yr - Ye);
  const side = k => {
    const end = (k < 0 ? o.endL : o.endR) || o.end || 'gable';
    const bh = end === 'hip' ? 0 : end === 'half' ? (o.bh || .62) : 1;
    const hx = end === 'gable' ? 0 : (o.hx || (end === 'hip' ? D * .45 : D * .27));
    return { end, bh, hx };
  };
  const SL = side(-1), SR = side(1);
  const fn = o.fn || wp_roofFn(o.mat, o.s, { moss: o.moss, R: o.R, mossLow: o.mossLow });
  const kV = len;
  const litF = wp_lit(0, Zr - Ze, -(Yr - Ye)), litL = wp_lit(-1, .9, 0), litR = wp_lit(1, .9, 0);
  const eF = (litF - .38) * .5;
  // Walmflächen (Enden) zuerst
  for (const k of [-1, 1]){
    const S = k < 0 ? SL : SR; if (S.end === 'gable') continue;
    const xa = k < 0 ? Xl : Xr, F = [xa, Ye + S.bh * (Yr - Ye), Ze + S.bh * (Zr - Ze)];
    const E = [k < 0 ? Xl + S.hx : Xr - S.hx, Yr, Zr];
    const Bk = [xa, F[1], Zr + (Zr - F[2])];
    const M = [(F[0] + Bk[0]) / 2, F[1], (F[2] + Bk[2]) / 2];
    const U = [Bk[0] - F[0], Bk[1] - F[1], Bk[2] - F[2]], V = [E[0] - M[0], E[1] - M[1], E[2] - M[2]];
    const ev = ((k < 0 ? litL : litR) - .38) * .5 - (k > 0 ? .08 : 0);
    const Lu = Math.hypot(U[0], U[1], U[2]), Lv = Math.hypot(V[0], V[1], V[2]);
    wp_plane(B, F, U, V, [[0, 0], [1, 0], [.5, 1]], (a, b, x, y) => fn(a * Lu, (1 - b) * Lv + 40, x, y, ev + (b > .93 ? .1 : 0)));
  }
  // Vorderfläche
  const poly = [[Xl, 0], [Xr, 0]];
  if (SR.bh < 1) poly.push([Xr, SR.bh]);
  poly.push([Xr - SR.hx, 1], [Xl + SL.hx, 1]);
  if (SL.bh < 1) poly.push([Xl, SL.bh]);
  wp_plane(B, [0, Ye, Ze], [1, 0, 0], [0, Yr - Ye, Zr - Ze], poly, (a, b, x, y) => {
    const v = (1 - b) * kV;
    let e = eF + (a - Xl) / (Xr - Xl) * -.08;
    if (o.mat === 'thatch' && v > kV - 3) e += (v > kV - 1.5 ? -.22 : .12) + (wp_h(x, 0, o.s) - .5) * .3;
    return fn(a, v, x, y, e);
  });
  const yE = B.ay - Ze - Ye, yR = B.ay - Zr - Yr, xl = B.ax + Xl, xr = B.ax + Xr - 1;
  // Ortgang (Giebelkante)
  for (const k of [-1, 1]){
    const S = k < 0 ? SL : SR; if (S.end === 'hip') continue;
    const yTop = S.end === 'half' ? B.ay - (Ze + S.bh * (Zr - Ze)) - (Ye + S.bh * (Yr - Ye)) : yR;
    const xx = k < 0 ? xl : xr;
    for (let y = Math.ceil(yTop); y < yE; y++){
      if (o.mat === 'thatch') wp_dk(B, xx, y, k < 0 ? .7 : .55);
      else wp_set(B, xx, y, wp_tone(o.verge || wp_P.gwood, k < 0 ? .6 : .2, xx, y));
    }
  }
  for (let x = Math.ceil(xl); x <= xr; x++) wp_dk(B, x, Math.floor(yE) - 1, o.mat === 'thatch' ? .62 : .5);
  // First
  const fx0 = Math.ceil(xl + SL.hx), fx1 = Math.floor(xr - SR.hx), yr = Math.round(yR);
  if (o.mat === 'thatch'){
    for (let x = fx0 - 1; x <= fx1 + 1; x++){
      const bump = wp_h(x >> 1, 0, o.s + 5) > .5 ? 1 : 0;
      for (let k = -1 - bump; k <= 1; k++) wp_set(B, x, yr + k, wp_tone(wp_P.moss, .5 - k * .15 + (wp_h(x, k, o.s) - .5) * .4, x, yr + k));
    }
    for (let x = fx0 + 3; x < fx1 - 1; x += 7){
      wp_line(B, x - 2, yr - 3, x + 1, yr + 1, wp_P.gwood[1]); wp_line(B, x + 2, yr - 3, x - 1, yr + 1, wp_P.gwood[2]);
      wp_set(B, x - 2, yr - 3, wp_P.gwood[3]); wp_set(B, x + 2, yr - 3, wp_P.gwood[4]);
    }
  } else if (o.mat === 'shingle'){
    for (let x = fx0; x <= fx1; x++){ wp_set(B, x, yr - 1, wp_tone(wp_P.gwood, .65, x, yr - 1)); wp_set(B, x, yr, wp_tone(wp_P.gwood, .3, x, yr)); }
  } else if (o.mat === 'slate'){
    for (let x = fx0; x <= fx1; x++){ wp_set(B, x, yr - 1, wp_tone(wp_P.iron, .6, x, yr - 1)); wp_set(B, x, yr, wp_tone(wp_P.iron, .3, x, yr)); }
  } else {
    const RR = o.R || wp_P.tile;
    for (let x = fx0 - 1; x <= fx1 + 1; x++){
      const k = ((x - fx0) % 5 + 5) % 5;
      wp_set(B, x, yr - 2, k === 0 ? 0 : wp_tone(RR, k === 1 ? .75 : .55, x, yr - 2));
      wp_set(B, x, yr - 1, wp_tone(RR, k === 0 ? .2 : k === 1 ? .7 : .5, x, yr - 1));
      wp_set(B, x, yr, wp_tone(wp_P.grey, .55 + (wp_h(x, 1, o.s) - .5) * .3, x, yr));
    }
  }
  return { yE, yR, Ye, Ze, Zr, Yr, Xl, Xr, hx: SL.hx, hxR: SR.hx, sl, eF };
}

/* ---------- Giebelständiges Dach (Stadthaus): zwei Flächen nach hinten ----------
   o: X0, X1, D, Hw, Hr, ovf vorn, ovb hinten, ovs seitlich, mat, s */
function wp_roofGable(B, o){
  const D = o.D, Hw = o.Hw, Hr = o.Hr, ovf = o.ovf || 2, ovb = o.ovb || 2, ovs = o.ovs || 2;
  const Xc = (o.X0 + o.X1) / 2, half = (o.X1 - o.X0) / 2 + ovs, Yr = Hw + Hr, Ye = Hw - ovs * Hr / ((o.X1 - o.X0) / 2);
  const fn = wp_roofFn(o.mat, o.s, { moss: o.moss, R: o.R });
  const len = Math.hypot(half, Yr - Ye), dep = D + ovf + ovb;
  for (const side of [-1, 1]){
    const P0 = [Xc + side * half, Ye, -ovf], U = [0, 0, dep], V = [-side * half, Yr - Ye, 0];
    const lv = wp_lit(side * (Yr - Ye), half, 0), e = (lv - .45) * .55 - (side > 0 ? .06 : 0);
    wp_plane(B, P0, U, V, [[0, 0], [1, 0], [1, 1], [0, 1]], (a, b, x, y) => {
      let ee = e;
      if (a < 2.5 / dep) ee -= .25;                           // Stirnbrett vorn
      return fn(a * dep, (1 - b) * len, x, y, ee + (b > .97 ? .1 : 0));
    });
  }
  // Firstlinie und Ortgang
  const xr = Math.round(B.ax + Xc);
  for (let z = -ovf; z <= D + ovb; z++){
    const y = Math.round(B.ay - z - Yr);
    wp_set(B, xr, y, wp_tone(o.R || wp_P.tile, .8, xr, y)); wp_set(B, xr - 1, y, wp_tone(o.R || wp_P.tile, .62, xr - 1, y));
  }
  return { Xc, Yr, Ye, half };
}

/* ---------- Fachwerk-Geschoss ----------
   o: x0, x1, yT, yB (Bildkoordinaten, yB = Unterkante), R Holz, P Putz, s, wins [{x, w, h, shut, glass}],
   door {x, w}, pat 'mann' | 'kreuz' | 'alem', gap max. Feldbreite, sill Schwellenhöhe */
function wp_fachwerk(B, o){
  const R = o.R || wp_P.oak, s = o.s, x0 = o.x0, x1 = o.x1, yT = o.yT, yB = o.yB;
  const sill = o.sill === undefined ? 3 : o.sill, top = 2, pw = o.pw || 3;
  const P = o.P || wp_P.plaster;
  const wattle = (x, y) => wp_tone(wp_P.wood, .25 + (((x + (y >> 1)) & 3) === 0 ? .3 : 0) + (y & 1 ? .1 : -.05), x, y);
  const pl = wp_plaster({ R: P, s: s + 1, flake: o.flake || 0, under: (x, y) => wp_h(x, y, s) > .55 ? wattle(x, y) : wp_tone(wp_P.earth, .5 + (wp_h(x, y, s + 1) - .5) * .5, x, y), base: o.dirt ? yB : undefined });
  wp_rect(B, x0, yT, x1, yB, pl);
  // senkrechte Hölzer
  const posts = [x0, x1 - pw - 1];
  const wins = o.wins || [];
  const yBr = yB - sill - (o.par || Math.round((yB - yT) * .36));      // Brustriegel
  for (const w of wins){ posts.push(w.x - pw, w.x + w.w); }
  if (o.door) posts.push(o.door.x - pw, o.door.x + o.door.w);
  posts.sort((a, b) => a - b);
  const P2 = [];
  for (const p of posts){ if (P2.length && p - P2[P2.length - 1] < pw + 2) continue; P2.push(p); }
  const gap = o.gap || 16;
  for (let i = 0; i + 1 < P2.length; i++){
    const g = P2[i + 1] - P2[i] - pw;
    if (g > gap){ const n = Math.ceil(g / gap); for (let k = 1; k < n; k++) P2.push(Math.round(P2[i] + pw + (g + pw) * k / n - pw / 2 - 1)); }
  }
  P2.sort((a, b) => a - b);
  const inWin = (xa, xb) => wins.find(w => w.x >= xa - 1 && w.x + w.w <= xb + 1);
  const inDoor = (xa, xb) => o.door && o.door.x >= xa - 1 && o.door.x + o.door.w <= xb + 1;
  // Fenster und Tür zuerst (Hölzer rahmen sie)
  for (const w of wins){
    const wy = yBr - w.h;
    if (w.shut){
      wp_window(B, w.x, wy, w.w, w.h, { frame: R, kreuz: w.w >= 6, s: s + w.x, dark: !w.glass });
      const sw = Math.ceil(w.w / 2);
      if (w.x - sw - pw >= x0) wp_shutter(B, w.x - sw - pw, wy, sw, w.h, w.shutR || wp_P.gwood, s + 3);
      if (w.x + w.w + pw + sw <= x1) wp_shutter(B, w.x + w.w + pw, wy, sw, w.h, w.shutR || wp_P.gwood, s + 4);
    } else wp_window(B, w.x, wy, w.w, w.h, { frame: R, kreuz: w.w >= 6, s: s + w.x, dark: w.glass === false });
  }
  // Streben je Feld
  const beam = (xa, ya, xb, yb, wd, k) => wp_beam(B, xa, ya, xb, yb, wd || 2, R, s + (k || 0));
  for (let i = 0; i + 1 < P2.length; i++){
    const xa = P2[i] + pw, xb = P2[i + 1], w = xb - xa;
    if (w < 3) continue;
    const win = inWin(xa, xb), dr = inDoor(xa, xb);
    if (dr) continue;
    if (win){
      // Brüstungsfeld: Andreaskreuz oder Feuerbock
      const yy0 = yBr + 2, yy1 = yB - sill;
      if (yy1 - yy0 >= 4){
        if (o.pat === 'alem'){ beam(xa, yy1, xb, yy0, 2, i); }
        else { beam(xa, yy0, xb, yy1, 2, i); beam(xa, yy1, xb, yy0, 2, i + 9); }
      }
      // Sturzriegel
      beam(xa - 1, yBr - win.h - 2, xb + 1, yBr - win.h - 2, 2, i + 3);
      continue;
    }
    const left = (xa + xb) / 2 < (x0 + x1) / 2;
    if (o.pat === 'kreuz' && w <= 16){ beam(xa, yT + top, xb, yB - sill, 2, i); beam(xa, yB - sill, xb, yT + top, 2, i + 5); }
    else if (o.pat === 'alem'){
      // lange Strebe über die ganze Geschosshöhe
      if (left) beam(xa, yB - sill, xb, yT + top + 1, 3, i); else beam(xa, yT + top + 1, xb, yB - sill, 3, i);
    } else {
      // Fränkischer Mann: Fußstrebe + Kopfband
      const ym = yT + Math.round((yB - yT) * .3);
      if (left){ beam(xa, yB - sill, xb, ym, 3, i); beam(xa + 1, yT + top, xa + 5, yT + top + 4, 2, i + 2); }
      else { beam(xa, ym, xb, yB - sill, 3, i); beam(xb - 1, yT + top, xb - 5, yT + top + 4, 2, i + 2); }
    }
    // Riegel durch das Feld
    if (o.pat !== 'kreuz' || w > 16) beam(xa, yBr, xb, yBr, 2, i + 7);
  }
  // Ständer
  for (const p of P2) beam(p + pw / 2, yT, p + pw / 2, yB, pw + (p === x0 || p >= x1 - pw - 1 ? 1 : 0), p);
  // Rähm und Schwelle
  beam(x0 - 1, yT + 1, x1 + 1, yT + 1, top, 11);
  if (sill) beam(x0 - 1, yB - sill / 2, x1 + 1, yB - sill / 2, sill, 13);
  // Holznägel an den Knoten
  for (const p of P2){
    wp_set(B, p + 1, yT + top + 1, R[0]); if (sill) wp_set(B, p + 1, yB - sill - 1, R[0]);
  }
  // Brustriegel-Nägel
  for (const p of P2) wp_set(B, p + 1, yBr, R[0]);
  return { posts: P2, yBr };
}

/* Balkenköpfe einer Vorkragung: Reihe kleiner Stirnholz-Quadrate mit Schatten */
function wp_jetty(B, x0, x1, y, R, s, step){
  step = step || 6;
  for (let x = x0 + 1; x < x1 - 2; x += step){
    wp_set(B, x, y, wp_tone(R, .75, x, y)); wp_set(B, x + 1, y, wp_tone(R, .5, x + 1, y));
    wp_set(B, x, y + 1, wp_tone(R, .45, x, y + 1)); wp_set(B, x + 1, y + 1, wp_tone(R, .25, x + 1, y + 1));
    // Knagge (Kopfwinkelholz) unter jedem zweiten Kopf
    if (((x - x0) / step & 1) === 0){ wp_set(B, x, y + 2, wp_tone(R, .35, x, y + 2)); wp_set(B, x + 1, y + 2, wp_tone(R, .15, x + 1, y + 2)); }
  }
  wp_shade(B, x0, y + 2, x1, y + 5, .35, 3);
}

/* ---------- Gotische Fenster ----------
   Spitzbogen mit Maßwerk; o: lights (Bahnen), frame Rampe Gewände, s */
function wp_gwin(B, x, y, w, h, o){
  o = o || {};
  if (wp_WINREC) wp_WINREC.push([x, y, w, h]);
  const G = wp_P.glass, Rf = o.frame || wp_P.stone, s = o.s || 1, lights = o.lights || (w >= 7 ? 2 : 1);
  const r = w * .8, ah = Math.sqrt(r * r - (r - w / 2) ** 2);
  const inA = (px, py) => {          // px,py relativ zur Kämpferlinie (py>0 = über Kämpfer)
    if (py <= 0) return px >= 0 && px <= w;
    return Math.hypot(px - r, py) <= r && Math.hypot(px - (w - r), py) <= r;
  };
  const yS = y + Math.ceil(ah);       // Kämpferlinie
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){
    const X = x + i, Y = y + j, px = i + .5, py = yS - Y - .5;
    if (!inA(px, py)) continue;
    const edge = !inA(px - 1, py) || !inA(px + 1, py) || !inA(px, py + 1) || j === h - 1;
    if (edge){ wp_set(B, X, Y, wp_tone(Rf, (i < w / 2 && !(j === h - 1)) ? .2 : .55, X, Y)); continue; }
    // Pfosten (Bahnen), Maßwerkkreis im Bogen
    const inner = i - 1, iw = w - 2;
    let mull = false;
    for (let k = 1; k < lights; k++) if (inner === Math.round(iw * k / lights - .5)) mull = true;
    const cy = yS - Math.max(2, ah * .45), cxm = x + w / 2;
    const dcy = Math.hypot(X + .5 - cxm, Y + .5 - cy);
    if (lights > 1 && Y < yS + 1){
      if (dcy < Math.min(w * .28, ah * .42) && dcy > Math.min(w * .28, ah * .42) - 1.2){ wp_set(B, X, Y, wp_tone(Rf, .7, X, Y)); continue; }
      if (mull && Y < cy) mull = false;
      if (Y === yS && !mull){
        // kleine Kleeblattbögen über den Bahnen
        wp_set(B, X, Y, wp_tone(Rf, .62, X, Y)); continue;
      }
    }
    if (mull){ wp_set(B, X, Y, wp_tone(Rf, .65, X, Y)); continue; }
    if (o.dark){ wp_set(B, X, Y, wp_P.dark[Y < yS ? 0 : 1]); continue; }
    // Bleiverglasung: Rauten
    const lead = ((X + Y) & 3) === 0 || ((X - Y) & 3) === 0;
    const refl = .55 - (i / w) * .3 - (j / h) * .25 + (wp_h(X, Y, s) - .5) * .2;
    let t = lead ? .08 : .25 + refl * .5;
    if (!lead && wp_h(X, Y, s + 2) > .9) t = .85;
    wp_set(B, X, Y, wp_tone(o.glass || G, t, X, Y));
  }
  // Sohlbank und Wasserschlag
  if (o.sill !== false) for (let i = -1; i <= w; i++){ wp_set(B, x + i, y + h, wp_tone(Rf, .78, x + i, y + h)); wp_set(B, x + i, y + h + 1, wp_tone(Rf, .32, x + i, y + h + 1)); }
  // Schmutzfahne unter der Sohlbank
  if (o.streak) for (let j = 2; j < o.streak; j++) for (let i = 0; i < w; i++) if (wp_h(x + i, 0, s + 9) > .35 && dither(x + i, y + h + j) > j / o.streak) wp_tint(B, x + i, y + h + j, wp_OUT, .18);
  return { yS, ah };
}

/* Strebepfeiler: Breite w, von Boden yb hoch bis yt; Absätze mit Wasserschlag; Fiale oben */
function wp_buttress(B, x, yb, yt, w, o){
  o = o || {};
  const fn = o.fn, R = o.R || wp_P.stone, steps = o.steps || 2, Hh = yb - yt;
  for (let k = 0; k <= steps; k++){
    const yy0 = Math.round(yt + Hh * k / (steps + 1)), yy1 = Math.round(yt + Hh * (k + 1) / (steps + 1));
    const ww = w - (steps - k);
    const xa = x + Math.floor((w - ww) / 2);
    for (let y = yy0; y < yy1; y++) for (let i = 0; i < ww; i++){
      const X = xa + i; let c = fn ? fn(X, y) : wp_tone(R, .5, X, y);
      if (i === 0) c = wp_mix(c, 0xffe0e8ec, .12); else if (i >= ww - 2) c = wp_mix(c, wp_OUT, i === ww - 1 ? .4 : .2);
      wp_set(B, X, y, c);
    }
    // Wasserschlag (schräge Abdeckung)
    for (let i = -1; i <= ww; i++){ wp_set(B, xa + i, yy0, wp_tone(R, .8, xa + i, yy0)); wp_set(B, xa + i, yy0 + 1, wp_tone(R, .42, xa + i, yy0 + 1)); }
    if (k > 0) wp_shade(B, xa - 1, yy0 + 2, xa + ww + 1, yy0 + 4, .25, 2);
  }
  // Schlagschatten auf die Wand rechts daneben
  if (o.cast !== false) for (let y = yt + 2; y < yb - 1; y++){ wp_tint(B, x + w, y, wp_OUT, .3); if (dither(x + w + 1, y) < .5) wp_tint(B, x + w + 1, y, wp_OUT, .2); }
  if (o.fiale){
    // Fiale mit Krabben und Kreuzblume
    const cx = x + (w >> 1), fh = o.fiale;
    for (let j = 0; j < fh; j++){
      const half = Math.max(0, Math.round((j / fh) * (w / 2 - .5)));
      for (let i = -half; i <= half; i++) wp_set(B, cx + i, yt - fh + j, wp_tone(R, i < 0 ? .72 : i === 0 ? .55 : .3, cx + i, yt - fh + j));
      if (j > 2 && j % 3 === 0){ wp_set(B, cx - half - 1, yt - fh + j, wp_tone(R, .7, 0, 0)); wp_set(B, cx + half + 1, yt - fh + j, wp_tone(R, .3, 0, 0)); }
    }
    wp_set(B, cx, yt - fh - 1, wp_tone(R, .8, 0, 0)); wp_set(B, cx - 1, yt - fh, wp_tone(R, .7, 0, 0)); wp_set(B, cx + 1, yt - fh, wp_tone(R, .4, 0, 0));
  }
}

/* Schornstein aus Backstein/Bruchstein mit Abdeckplatte */
function wp_chimney(B, x, yb, w, h, s){
  const fn = wp_ashlar({ R: wp_P.red, s, ch: 2, bmin: 3, bmax: 4, per: 64, mo: wp_P.grey });
  for (let y = yb - h; y < yb; y++) for (let i = 0; i < w; i++){
    let c = fn(x + i, y);
    if (i === 0) c = wp_mix(c, 0xffe0e8ec, .12); else if (i === w - 1) c = wp_mix(c, wp_OUT, .35);
    if (y < yb - h + 4) c = wp_mix(c, wp_P.char[1], .55 - (y - (yb - h)) * .12);   // Ruß
    wp_set(B, x + i, y, c);
  }
  for (let i = -1; i <= w; i++){ wp_set(B, x + i, yb - h - 1, wp_tone(wp_P.grey, .75, x + i, 0)); wp_set(B, x + i, yb - h, wp_tone(wp_P.grey, .3, x + i, 0)); }
  wp_rect(B, x + 1, yb - h - 2, x + w - 1, yb - h - 1, wp_P.char[0]);
  return { x: x + w / 2, y: yb - h - 3 };
}

/* ---------- Reichsadler (schwarzer Doppeladler, rote Zungen und Fänge, goldener Nimbus) ---------- */
const wp_EAGLE = {
  // 15 x 13
  m: [
    '.nn.........nn.',
    'n.kk.......kk.n',
    'rkkk.......kkkr',
    '.n.kk.....kk.n.',
    'k...kk.k.kk...k',
    'kk...kkkkk...kk',
    'kkk..kkkkk..kkk',
    '.kkkkkkkkkkkkk.',
    '..kkkkkkkkkkk..',
    '...k.kkkkk.k...',
    '.....rkkkr.....',
    '....r.kkk.r....',
    '.......k.......'
  ],
  // 21 x 18
  l: [
    '..nnn.........nnn....',
    '.n...n.......n...n...',
    'n.kkk.........kkk.n..',
    'rkkkkk.......kkkkkr..',
    '.n..kkk.....kkk..n...',
    '..nn.kk.....kk.nn....',
    'k.....kk.k.kk.....k..',
    'kk.....kkkkk.....kk..',
    'kkk....kkkkk....kkk..',
    'kkkk..kkkkkkk..kkkk..',
    '.kkkkkkkkkkkkkkkkk...',
    '..kkkkkkkkkkkkkkk....',
    '...kk.kkkkkkk.kk.....',
    '......kkkkkkk........',
    '.....rk.kkk.kr.......',
    '....r.r.kkk.r.r......',
    '........k.k..........',
    '.......k...k.........'
  ],
  // 9 x 8
  s: [
    'rk.....kr',
    '.kk...kk.',
    'k..kkk..k',
    'kk.kkk.kk',
    '.kkkkkkk.',
    '...kkk...',
    '..r.k.r..',
    '....k....'
  ]
};
/* Großform symmetrisch aus linker Hälfte ergänzen */
(function(){ const L = wp_EAGLE.l; for (let i = 0; i < L.length; i++){ const r = L[i].slice(0, 11); L[i] = r + r.slice(0, 10).split('').reverse().join(''); } })();
function wp_eagle(B, x, y, size, o){
  o = o || {};
  const G = wp_EAGLE[size || 'm'], pal = { k: o.k || 0xff1d1a19, r: o.r || wp_c('#9b2a22'), n: o.n === undefined ? wp_c('#d9b04a') : o.n, y: wp_c('#c79a33') };
  for (let j = 0; j < G.length; j++) for (let i = 0; i < G[j].length; i++){
    const ch = G[j][i]; if (ch === '.') continue;
    let c = pal[ch]; if (!c) continue;
    if (o.warp){ const d = o.warp(i, j); if (d === null) continue; wp_set(B, x + i, y + j + d, c); continue; }
    if (ch === 'k' && o.hi && wp_h(i, j, 5) > .82) c = wp_c('#3a3532');
    wp_set(B, x + i, y + j, c);
  }
}

/* ---------- Kleinteile ---------- */
/* Holzstapel (Scheite mit Stirnseiten) */
function wp_woodpile(B, x, yb, w, h, s){
  const R = rng(s);
  for (let r = 0; r * 3 < h; r++){
    for (let c = 0; c < w; c += 3){
      const cx = x + c + (r & 1), cy = yb - 2 - r * 3;
      if (cx + 2 > x + w) continue;
      const t = .45 + (R() - .5) * .3;
      wp_set(B, cx, cy - 1, wp_tone(wp_P.wood, t + .35, cx, cy)); wp_set(B, cx + 1, cy - 1, wp_tone(wp_P.wood, t + .2, cx, cy));
      wp_set(B, cx, cy, wp_tone(wp_P.wood, t + .15, cx, cy)); wp_set(B, cx + 1, cy, wp_tone(wp_P.wood, t - .05, cx, cy));
      wp_set(B, cx + 2, cy, wp_P.bark[1]); wp_set(B, cx + 2, cy - 1, wp_P.bark[2]); wp_set(B, cx, cy + 1, wp_P.bark[0]); wp_set(B, cx + 1, cy + 1, wp_P.bark[1]);
    }
  }
}
/* Leiter */
function wp_ladder(B, x0, y0, x1, y1, R){
  R = R || wp_P.gwood;
  wp_beam(B, x0, y0, x1, y1, 1, R, 3); wp_beam(B, x0 + 4, y0, x1 + 4, y1, 1, R, 4);
  const n = Math.floor(Math.abs(y1 - y0) / 4);
  for (let k = 1; k <= n; k++){ const t = k / (n + 1), xx = x0 + (x1 - x0) * t, yy = y0 + (y1 - y0) * t; wp_line(B, xx + 1, yy, xx + 3, yy, R[3]); }
}
/* Sack (Leinen, zugebunden) */
function wp_sack(B, cx, yb, w, h, s){
  wp_ell(B, cx, yb - h / 2, w / 2, h / 2, (x, y) => {
    const nx = (x + .5 - cx) / (w / 2), ny = (y + .5 - (yb - h / 2)) / (h / 2);
    return wp_tone(wp_P.cloth, .42 - nx * .25 - ny * .25 + (wp_h(x, y, s) - .5) * .12 + ((x + y * 2) % 5 === 0 ? -.1 : 0), x, y);
  });
  wp_set(B, cx, yb - h - 1, wp_P.cloth[2]); wp_set(B, cx - 1, yb - h, wp_P.cloth[1]); wp_set(B, cx, yb - h, wp_P.straw[2]);
}
/* Fass stehend (Dauben, Reifen, Deckel) */
function wp_barrel(B, cx, yb, w, h, s, o){
  o = o || {};
  const r = w / 2, R = o.R || wp_P.wood;
  for (let y = yb - h; y < yb; y++){
    const t = (y - (yb - h)) / h, bulge = 1 - Math.pow(2 * t - 1, 2) * .14, rr = r * bulge;
    for (let x = Math.ceil(cx - rr - .5); x <= Math.floor(cx + rr - .5); x++){
      const nx = (x + .5 - cx) / rr;
      const st = Math.floor((Math.asin(clamp(nx, -1, 1)) + 1.6) * 3.2);
      let v = .55 - nx * .35 + (wp_h(st, 0, s) - .5) * .2 + (wp_vn(st * 3, y * .3, s) - .5) * .2;
      if (Math.abs(nx * 5 - Math.round(nx * 5)) < .12) v -= .2;
      const hoop = [.12, .3, .7, .88].some(q => Math.abs(t - q) < .5 / h + .02);
      if (hoop) wp_set(B, x, y, wp_tone(o.hoopR || wp_P.iron, .5 - nx * .3 + (Math.abs(t - .12) < .06 || Math.abs(t - .7) < .06 ? .2 : 0), x, y));
      else wp_set(B, x, y, wp_tone(R, v, x, y));
    }
  }
  // Deckel oben (Ellipse)
  if (!o.noTop) wp_ell(B, cx, yb - h + 1, r * .86, 1.8, (x, y) => wp_tone(R, .62 + ((x & 1) ? .05 : -.05) - (x + .5 - cx) / r * .2, x, y));
}
