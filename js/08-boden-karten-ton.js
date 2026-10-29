"use strict";
/* Der Apfelritter, Teil 8 von 29: Boden, Karten, Ton und Musik.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Boden ============ */
/* Paletten je Bodenart: 4 Kanäle zu je 12 Tönen (dunkel..hell) */
const wo_PAL = [
  /* 0 Wiese */ [['#1b2214', '#28311b', '#343f20', '#414e26', '#4e5b2d', '#5b6834', '#68733c', '#767e46', '#868c52'], ['#2a2817', '#3a371f', '#4b4728', '#5c5732', '#6d663c', '#7d7447', '#8c8253'], ['#17201a', '#1f2c1f', '#283824', '#31442a', '#3b5030', '#465c37', '#52683f'], ['#1e1812', '#2b2219', '#382d21', '#463929', '#544532', '#62523c']],
  /* 1 Waldboden */ [['#15120d', '#1f1a13', '#292218', '#342b1d', '#3f3422', '#4a3d28', '#56472f', '#635236', '#705d3e'], ['#1a2213', '#232e19', '#2e3b1f', '#384825', '#43552c', '#4f6233', '#5b6e3b'], ['#28180f', '#3a2313', '#4d2f17', '#5f3b1c', '#704722', '#805429', '#8e6131'], ['#181512', '#231f1a', '#2f2a23', '#3b352d', '#484138']],
  /* 2 Moor */ [['#16190f', '#1d2114', '#252a19', '#2e331e', '#373c23', '#41462a', '#4c5030', '#575a37', '#62643f'], ['#272d16', '#36401d', '#465125', '#56612e', '#667039', '#767e44'], ['#21171a', '#2e2024', '#3d2a2e', '#4c3539', '#5b4044', '#694b4e'], ['#100e0b', '#18140f', '#201b14', '#29221a', '#322a20']],
  /* 3 Heide */ [['#232114', '#312e1b', '#403c23', '#4f4a2b', '#5e5834', '#6d663e', '#7c7449', '#8a8155'], ['#28211a', '#362c22', '#44382b', '#524435', '#60513f', '#6d5d4a'], ['#282725', '#383633', '#484641', '#59564f', '#6a665e', '#7b776d'], ['#1e2515', '#29321b', '#353f22', '#414c29']],
  /* 4 Schlachtfeld */ [['#18140f', '#221c15', '#2c241a', '#362c20', '#403426', '#4a3d2c', '#554733'], ['#20241a', '#2b3020', '#363b26', '#42472d', '#4f5335', '#5b5e3d'], ['#100f0e', '#191715', '#23201d', '#2e2a26', '#3a3530'], ['#1a2122', '#242e30', '#2f3b3d', '#3b4849']],
  /* 5 Kirchhof */ [['#151b14', '#1d251b', '#262f21', '#2f3a28', '#38452f', '#425037', '#4c5a3f', '#57654a'], ['#212a15', '#2d381b', '#394622', '#455429'], ['#1e1812', '#2b2219', '#382d21', '#463929'], ['#3a3d32', '#4e5143', '#626553']],
  /* 6 Dorfflur */ [['#202315', '#2d311b', '#3a4022', '#484e29', '#565c31', '#64693a', '#727544', '#80814f'], ['#2b2817', '#3c381f', '#4d4828', '#5e5832', '#70683d', '#817848', '#908654'], ['#17201a', '#1f2c1f', '#283824', '#31442a', '#3b5030'], ['#1e1812', '#2b2219', '#382d21', '#463929', '#544532']],
  /* 7 Lagerplatz */ [['#1b1611', '#262018', '#322a1f', '#3e3427', '#4a3f2f', '#564a38', '#625542'], ['#24271a', '#303420', '#3d4227', '#4a502f', '#585e37', '#656b40'], ['#3a3020', '#4e4229', '#625434', '#76663f', '#88784b'], ['#121110', '#1c1a18', '#282521', '#35312c']],
  /* 8 Waldlichtung */ [['#192014', '#222a19', '#2b351e', '#354024', '#3f4b2a', '#4a5631', '#556139', '#616c42'], ['#1a2213', '#232e19', '#2e3b1f', '#384825', '#43552c'], ['#28180f', '#3a2313', '#4d2f17', '#5f3b1c', '#704722'], ['#15120d', '#1f1a13', '#292218', '#342b1d']],
  /* 9 Fels und Geröll */ [['#232220', '#2f2d2a', '#3c3a36', '#4a4742', '#58554f', '#67635c', '#76716a', '#86817a', '#96918a'], ['#26221d', '#332e27', '#413b32', '#4f483e', '#5e564a', '#6c6456'], ['#1c2415', '#26301b', '#313d21', '#3d4a28'], ['#5a5c48', '#72735c', '#8a8a72', '#a0a088']],
  /* 10 Schnee */ [['#6a7590', '#7c87a0', '#8e99b0', '#a0aabf', '#b0bacc', '#bfc8d8', '#cdd5e2', '#d9e0ea', '#e3e9f0', '#ebf0f5', '#f2f5f9', '#f8fafc'], ['#56627e', '#66728e', '#78849e', '#8a96ae', '#9ca8be'], ['#2f2d2a', '#3c3a36', '#4a4742', '#58554f'], ['#e8eef6', '#f4f8fc', '#ffffff']],
  /* 11 Heidekraut */ [['#22200f', '#2f2c16', '#3d391d', '#4b4625', '#59532d', '#665f36', '#736b40', '#7f774b'], ['#3a3222', '#4c4330', '#5e543e', '#70654d', '#82765c', '#93876c'], ['#2a1726', '#3c2034', '#512a44', '#663553', '#7b4062', '#8f4d70', '#a25c7e'], ['#16200f', '#1f2c14', '#29381a', '#334420']],
  /* 12 Kiefernwald */ [['#1a120c', '#261910', '#322114', '#3e2918', '#4a321d', '#563b22', '#614428', '#6c4d2f'], ['#1a2312', '#243018', '#2f3e1e', '#3a4c25', '#46592c'], ['#3a3020', '#4c4029', '#5e5034', '#706040', '#82704c'], ['#100d0a', '#18130e', '#211a13', '#2a2118']]
].map(chs => chs.map(k => wo_ramp(k, 12)));
const wo_ZB = ZONES.map(z => ({ obstgarten: 0, burg: 0, stadt: 0, dorf: 6, wald: 1, moor: 2, friedhof: 5, galgen: 3, schlachtfeld: 4, lager: 0, ruine: 3, fluss: 0, weiler: 6, speyer: 0, fischerdorf: 6, weinberge: 6, auwald: 1, piratennest: 7,
  schwarzwald: 1, annaberg: 0, silberrevier: 3, schanze: 7, hochgebirge: 9,
  wittenberg: 6, heide: 11, nuernberg: 6, reichswald: 12, gailingen: 3, donauried: 2, augsburg: 6, lechfeld: 3,
  adlerhorst: 0, lilienthal: 0, loewenburg: 0, turmfeste: 3 })[z.id]);

/* Bodentexturen 256 × 256 Feinpixel (Periode 128 Weltpixel): Kanal << 4 | Ton */
function wo_tex(kind, seed){
  const N = 256, T = new Uint8Array(N * N), R = rng(seed), P = (x, y, ch, t) => { T[((y & 255) << 8) | (x & 255)] = (ch << 4) | clamp(t, 0, 11); };
  const nz = (x, y, s) => wo_NB[((y + s * 37) & 255) * 256 + ((x + s * 59) & 255)];
  // Halme: ein Feinpixel breit, unten Schattenpunkt, nach oben heller, Spitze geneigt
  const blades = (n, len, dryP, ch0, tb, lean) => {
    const L = [];
    for (let k = 0; k < n; k++) L.push([R() * N | 0, R() * N | 0, 2 + (R() * len * 2 | 0), R() < dryP ? 1 : ch0, R() < lean ? (R() < .5 ? -1 : 1) : 0, R()]);
    L.sort((a, b) => a[1] - b[1]);
    for (const [x, y, l, ch, ln, r] of L){
      P(x, y + 1, ch === 1 ? 1 : ch0, tb - 2);
      for (let j = 0; j <= l; j++){ const t = tb + Math.round(j / Math.max(1, l) * 3 + r * 1.5); P(x + (j >= l - 1 && l > 2 ? ln : 0) + (j === l && l > 5 ? ln : 0), y - j, ch, t); }
    }
  };
  const leaves = (n, chs, tb) => {
    for (let k = 0; k < n; k++){
      const x = R() * N | 0, y = R() * N | 0, ch = chs[R() * chs.length | 0], t = tb + (R() * 4 | 0), sh = R() * 5 | 0;
      const pts = sh === 0 ? [[0, 0], [1, 0]] : sh === 1 ? [[0, 0], [0, 1]] : sh === 2 ? [[0, 0], [1, 0], [0, 1], [1, 1]] : sh === 3 ? [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] : [[0, 0], [1, 0], [2, 1], [1, 1], [2, 2], [3, 2]];
      for (const [dx, dy] of pts) P(x + dx, y + dy, ch, t - (dx + dy > 1 ? 1 : 0));
      P(x, y, ch, t + 1);
      P(x + 1, y + (sh === 3 ? 3 : sh === 4 ? 3 : 2), 0, 1);
    }
  };
  const blobs = (n, rmin, rmax, ch, tb, spikes) => {
    for (let k = 0; k < n; k++){
      const cx = R() * N, cy = R() * N, r = rmin + R() * (rmax - rmin), c = ch[R() * ch.length | 0];
      for (let dy = -r - 1; dy <= r + 1; dy++) for (let dx = -r - 1; dx <= r + 1; dx++){
        const q = (dx * dx + dy * dy * 1.6) / (r * r);
        if (q > 1) continue;
        P(Math.round(cx + dx), Math.round(cy + dy), c, Math.round(tb + (-dx - dy) / r * 1.6 + (1 - q) * 1.2 + (R() - .5)));
      }
      for (let dx = -2; dx <= 2; dx++) P(Math.round(cx + dx * r * .3), Math.round(cy + r * .8 + 1), 0, 0);
      if (spikes) for (let s = 0; s < r * 3; s++){ const x = Math.round(cx - r + R() * r * 2), y = Math.round(cy - R() * r * .6), l = 2 + (R() * 3 | 0); for (let j = 0; j < l; j++) P(x, y - j, c, tb + 3 + (j > 0 ? 1 : 0)); }
    }
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
    const v = nz(x, y, seed), f = (wo_h(x, y, seed + 7) - .5) * .9;   // Feinkorn
    let ch = 0, t = 3 + (v * 3.4 + f | 0);
    if (kind === 'heath' && v > .62){ ch = 1; t = 3 + ((v - .6) * 8 + f | 0); }
    if (kind === 'battle' && v < .35){ ch = 1; t = 3 + (v * 5 + f | 0); }
    if (kind === 'camp' && v > .55){ ch = 1; t = 3 + ((v - .5) * 6 + f | 0); }
    if (kind === 'forest') t = 2 + (v * 3 + f | 0);
    if (kind === 'moor') t = 2 + (v * 3 + f | 0);
    if (kind === 'rock'){ ch = v > .62 ? 1 : 0; t = 3 + (v * 3.6 + f | 0); }
    if (kind === 'snow') t = 7 + (v * 2.6 + f * .6 | 0);
    if (kind === 'heather'){ ch = v > .58 ? 1 : 0; t = 3 + (v * 3.2 + f | 0); }
    if (kind === 'pine') t = 2 + (v * 3 + f | 0);
    P(x, y, ch, t);
  }
  if (kind === 'meadow'){ blades(7800, 4, .12, 0, 4, .35); blades(1500, 2, 0, 2, 3, .25); }
  if (kind === 'farm'){ blades(7200, 4, .35, 0, 4, .35); }
  if (kind === 'church'){ blades(7200, 2, .05, 0, 3, .25); blades(900, 1, 0, 1, 3, 0); }
  if (kind === 'clear'){ blades(4800, 3, .1, 0, 4, .35); leaves(1500, [2, 3], 2); blades(600, 2, 0, 1, 3, 0); }
  if (kind === 'forest'){ leaves(9000, [0, 0, 2, 2, 0, 1], 4); for (let k = 0; k < 120; k++){ let x = R() * N, y = R() * N; const a = R() * 6.28, l = 6 + R() * 14; for (let j = 0; j < l; j++){ P(Math.round(x), Math.round(y), 3, 1 + ((j >> 1) & 1)); P(Math.round(x), Math.round(y) + 1, 0, 0); x += Math.cos(a); y += Math.sin(a) * .6; } } }
  if (kind === 'moor'){ blobs(140, 5, 11, [0, 0, 0, 1, 2], 3, true); for (let k = 0; k < 2700; k++) P(R() * N | 0, R() * N | 0, 3, 1 + (R() * 2 | 0)); blades(2700, 3, 0, 0, 5, .45); }
  if (kind === 'heath'){ blades(3900, 3, .5, 0, 4, .35); for (let k = 0; k < 420; k++){ const x = R() * N | 0, y = R() * N | 0; P(x, y, 2, 5); P(x + 1, y, 2, 4); P(x, y + 1, 2, 3); P(x + 1, y + 1, 2, 2); P(x + 2, y + 1, 2, 3); P(x + 1, y + 2, 2, 1); P(x + 1, y + 3, 1, 0); } }
  if (kind === 'battle'){ for (let k = 0; k < 440; k++){ const x = R() * N | 0, y = R() * N | 0, l = 4 + (R() * 8 | 0); for (let j = 0; j < l; j++){ P(x + j, y, 0, 1); P(x + j, y - 1, 0, 5); } } blades(1500, 2, 0, 1, 3, .5); }
  if (kind === 'camp'){ for (let k = 0; k < 1000; k++){ const x = R() * N | 0, y = R() * N | 0, l = 4 + (R() * 8 | 0), ch = R() < .3 ? 2 : 1; for (let j = 0; j < l; j++) P(x + j, y + (j > 4 ? 1 : 0), ch, ch === 2 ? 2 + (R() * 3 | 0) : 4); } }
  if (kind === 'rock'){
    blobs(260, 2, 5, [0, 0, 1], 5, false);                                   // Geröll
    for (let k = 0; k < 160; k++){ let x = R() * N, y = R() * N; const l = 4 + R() * 10; for (let j = 0; j < l; j++){ P(x | 0, y | 0, 0, 1); x += R() < .6 ? 1 : 0; y += R() < .5 ? 1 : 0; } }   // Risse
    blobs(40, 3, 6, [2], 3, true);                                            // Moospolster
    for (let k = 0; k < 900; k++) P(R() * N | 0, R() * N | 0, 3, 1 + (R() * 3 | 0));   // Flechten
  }
  if (kind === 'snow'){
    for (let k = 0; k < 70; k++){ const x = R() * N | 0, y = R() * N | 0, l = 8 + (R() * 20 | 0); for (let j = 0; j < l; j++){ P(x + j, y, 1, 8 + (j > l / 2 ? 1 : 0)); P(x + j, y - 1, 0, 11); } }   // Wehen mit Schattenkante
    blobs(5, 2, 3, [2], 3, false);                                           // Fels schaut heraus
    for (let k = 0; k < 500; k++) P(R() * N | 0, R() * N | 0, 3, 8 + (R() * 4 | 0));   // Glitzern
  }
  if (kind === 'heather'){
    blades(2600, 3, .45, 0, 4, .35);
    // Heidekraut: Polster aus Zweigen mit lila Blütenrispen oben, Schattenfuß unten
    for (let k = 0; k < 520; k++){
      const cx = R() * N | 0, cy = R() * N | 0, w = 3 + (R() * 4 | 0);
      for (let i = 0; i < w; i++){ const hgt = 2 + (R() * 3 | 0); P(cx + i, cy + 1, 3, 0); for (let j = 0; j < hgt; j++) P(cx + i, cy - j, j >= hgt - 2 ? 2 : 3, j >= hgt - 2 ? 3 + (R() * 4 | 0) : 2 + j); }
    }
    for (let k = 0; k < 900; k++) P(R() * N | 0, R() * N | 0, 1, 5 + (R() * 3 | 0));   // heller Sand
  }
  if (kind === 'pine'){
    // Nadelstreu: kurze Striche kreuz und quer, Zapfen, Moosflecken, Wurzeln
    for (let k = 0; k < 7000; k++){ const x = R() * N | 0, y = R() * N | 0, d = R() < .5 ? 1 : -1, t0 = 3 + (R() * 4 | 0); P(x, y, 0, t0); P(x + d, y + 1, 0, t0 - 1); if (R() < .4) P(x + 2 * d, y + 2, 0, t0 - 2); }
    blobs(60, 3, 7, [1], 3, false);
    for (let k = 0; k < 140; k++){ const x = R() * N | 0, y = R() * N | 0; P(x, y, 2, 4); P(x + 1, y, 2, 3); P(x, y + 1, 2, 2); P(x + 1, y + 1, 2, 1); P(x, y + 2, 3, 0); }
    for (let k = 0; k < 60; k++){ let x = R() * N, y = R() * N; const a = R() * 6.28, l = 6 + R() * 12; for (let j = 0; j < l; j++){ P(Math.round(x), Math.round(y), 2, 1 + ((j >> 1) & 1)); P(Math.round(x), Math.round(y) + 1, 3, 0); x += Math.cos(a); y += Math.sin(a) * .6; } }
  }
  return T;
}
const wo_TEX = [wo_tex('meadow', 1), wo_tex('forest', 2), wo_tex('moor', 3), wo_tex('heath', 4), wo_tex('battle', 5), wo_tex('church', 6), wo_tex('farm', 7), wo_tex('camp', 8), wo_tex('clear', 9), wo_tex('rock', 10), wo_tex('snow', 11),
  wo_tex('heather', 12), wo_tex('pine', 13)];

/* Pflastertextur 128 × 128 Feinpixel (Periode 64 Weltpixel): 0 Fuge, sonst Ton 1..7; Steine mit abgerundeten Ecken */
function wo_paveTex(sizeX, sizeY, seed){
  const N = 128, T = new Uint8Array(N * N), R = rng(seed);
  let y = 0;
  const rows = [];
  while (y < N){ const h = Math.min(N - y, sizeY + (R() * 3 | 0)); rows.push([y, h]); y += h; }
  if (rows[rows.length - 1][1] < 5){ const l = rows.pop(); rows[rows.length - 1][1] += l[1]; }
  for (const [y0, h] of rows){
    const off = R() * N | 0;
    let x = 0;
    while (x < N){
      const w = Math.min(N - x, sizeX + (R() * sizeX * .8 | 0)), b = 2 + (R() * 3.6 | 0);
      for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++){
        const px = (x + dx + off) & (N - 1), py = y0 + dy;
        let t;
        if (dx === w - 1 || dy === h - 1 || ((dx === 0 || dx === w - 2) && (dy === 0 || dy === h - 2))) t = 0;
        else t = b + (dy === 0 || (dy === 1 && (dx === 0 || dx === w - 3)) ? 1 : 0) + (dx === 0 ? 1 : 0) - (dy === h - 2 ? 1 : 0) - (dx === w - 2 ? 1 : 0) - (dy === h - 3 && dx > w * .5 ? 1 : 0);
        T[py * N + px] = clamp(t, 0, 7);
      }
      x += w;
    }
  }
  return T;
}
const wo_COBT = wo_paveTex(8, 8, 31), wo_FLAGT = wo_paveTex(20, 14, 37);
const wo_COBP = wo_ramp(['#211e1a', '#3a3631', '#4b463f', '#59534a', '#666056', '#746d62', '#827a6e', '#90887b'], 8);
const wo_COBM = wo_ramp(['#1f251a', '#2c3620', '#3a4627', '#46532e'], 4);
const wo_DIRT = wo_ramp(['#1a150f', '#251e16', '#30271d', '#3b3124', '#463a2b', '#524433', '#5e4e3b', '#6b5944', '#78654e'], 12);
const wo_MUDP = wo_ramp(['#15110c', '#1f1912', '#2a2218', '#352b1f', '#403426'], 6);
const wo_WATR = wo_ramp(['#111a1b', '#16211f', '#1b2725', '#222f2c', '#293733', '#31403b', '#3a4943', '#45534c', '#525e57', '#636e66', '#77817a'], 12);
const wo_WATP = wo_ramp(['#0e100c', '#13150f', '#181b13', '#1e2117', '#25281c', '#2e3122', '#3a3d2c', '#4a4c3a'], 8);
const wo_WATC = wo_ramp(['#101a19', '#15221f', '#1b2a26', '#22322d', '#2a3b34', '#33443c', '#3f4f46', '#4d5c52'], 10);
const wo_SKY = wo_c('#7f8a86'), wo_SKY2 = wo_c('#a2aaa4');
const wo_BANK = wo_ramp(['#15110c', '#201911', '#2b2217', '#372c1e', '#433626', '#4f412e'], 6);
const wo_SAND = wo_ramp(['#2e2a20', '#3d382b', '#4c4636', '#5b5442', '#6a634f'], 5);
const wo_WOOD = wo_ramp(['#1c1610', '#2a2118', '#3a2e21', '#4b3c2b', '#5d4c37', '#705d44', '#836e52'], 7);
const wo_WOODG = wo_ramp(['#1e1d1b', '#2e2b27', '#3f3b35', '#524c44', '#655e54', '#787064'], 6);
const wo_FIELDP = {
  plow: wo_ramp(['#1a140e', '#251c14', '#30251a', '#3b2e20', '#463727', '#52402e'], 8),
  wheat: wo_ramp(['#3b3320', '#4d4328', '#605432', '#73653b', '#857545', '#95844f', '#a39159'], 8),
  rye: wo_ramp(['#35321f', '#464226', '#57522e', '#686237', '#797140', '#88804b'], 8),
  green: wo_ramp(['#1e2814', '#28351a', '#334320', '#3e5026', '#4a5c2d', '#566935'], 8),
  burn: wo_ramp(['#0e0d0c', '#161412', '#1f1c19', '#292521', '#35302a', '#4a4540', '#5f5a53'], 8),
  stub: wo_ramp(['#3a3322', '#4b432b', '#5c5235', '#6d623f', '#7d714a', '#8b7e55'], 8)
};
const wo_HERBP = wo_ramp(['#1b2414', '#26331a', '#324221', '#3f5129', '#4c6031', '#5a6e3a'], 6);

/* ---------- Streudetails (Büschel, Blumen, Steine, Laub, Pilze, Farn, Schilf ...) ---------- */
/* Zeichen: 0-9 Kanal 0 Ton; a-j Kanal 1; A-J Kanal 2; k-t Kanal 3; Sonderfarben siehe wo_DC */
const wo_DC = { '*': wo_c('#c4c0ac'), '+': wo_c('#b09a3e'), '%': wo_c('#8e3428'), '&': wo_c('#56648e'), '@': wo_c('#94687a'), '$': wo_c('#6a4c78'),
  '~': wo_c('#2a3536'), '^': wo_c('#6e7a78'), '!': wo_c('#6a3a22'), '?': wo_c('#a39b88'), '=': wo_c('#5a4632'), '#': wo_c('#1a1612'), ':': wo_c('#3a3a36'),
  ';': wo_c('#6a6862'), ',': wo_c('#8c8a80'), '_': wo_pk(18, 16, 20), '<': wo_c('#c8b878'), '>': wo_c('#7a2a20'), '|': wo_c('#e0dccb'), 'Y': wo_c('#c9b45a'), 'O': wo_c('#4a3a1c') };
function wo_dec(rows){
  const L = [], h = rows.length, w = rows[0].length;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const ch = rows[y][x]; if (ch === '.') continue;
    let k;
    if (ch >= '0' && ch <= '9') k = -(1 + (+ch));
    else if (ch >= 'a' && ch <= 'j') k = -(1 + 16 + ch.charCodeAt(0) - 97);
    else if (ch >= 'A' && ch <= 'J') k = -(1 + 32 + ch.charCodeAt(0) - 65);
    else if (ch >= 'k' && ch <= 't') k = -(1 + 48 + ch.charCodeAt(0) - 107);
    else k = wo_DC[ch];
    L.push(x - (w >> 1), y - h + 1, k);
  }
  return L;
}
const wo_D = {
  tuft: [wo_dec(['..8.9..', '.7.8.7.', '7.787.6', '.67676.', '..454..', '..___..']), wo_dec(['.9...8', '.8.9.7', '7787.7', '67676.', '.4545.', '.___..']), wo_dec(['..9..', '.787.', '76867', '.565.', '.___.'])],
  tuftDry: [wo_dec(['..h.i..', '.g.h.g.', 'g.ghg.f', '.fgfgf.', '..ded..', '..___..']), wo_dec(['.i..h', 'gh.hg', '.fgf.', '.ded.', '.___.'])],
  daisy: [wo_dec(['*.*..', '3.3*.', '3.3.3']), wo_dec(['.*...*', '.3.*.3', '.3.3.3'])],
  butter: [wo_dec(['+..+', '3+.3', '3.33']), wo_dec(['.+.+.', '.3+3.', '.3.3.'])],
  poppy: [wo_dec(['%..', '%%.', '3.%', '3.3']), wo_dec(['.%..%', '.3.%%', '.3.3.'])],
  blue: [wo_dec(['&..&', '3&.3', '3.3.'])],
  clover: [wo_dec(['.@.', '@4@', '.3.']), wo_dec(['@.@', '3.3'])],
  stone: [wo_dec([';,.', ':;;', '_::']), wo_dec(['.;,.', ';;;:', ':::_']), wo_dec([',;', ':_'])],
  pebbles: [wo_dec([',.;.:', '..:..', ';:..,'])],
  mole: [wo_dec(['..453..', '.45332.', '4533221', 's22211_']).map((v, i) => i % 3 === 2 && v < 0 ? -(1 + 48 + ((-v - 1) & 15)) : v)],
  fern: [wo_dec(['b...d...b', '.c.dfd.c.', '..cefec..', 'bcdfgfdcb', '.bcdedcb.', '...cdc...', '...___...']), wo_dec(['c.....c', '.d.e.d.', '..efe..', 'cdfgfdc', '.cdedc.', '..___..'])],
  shroom: [wo_dec(['>%%', '%|%', '.*.']), wo_dec(['=O=', '.?.']), wo_dec(['>%>.', '%%|%', '.*..'])],
  leafs: [wo_dec(['C..D.', '.DE.C', 'C..D.']), wo_dec(['.E.', 'DCD', '.D.'])],
  twig: [wo_dec(['n.....', '.mn...', '...mn.', '....mn']), wo_dec(['....nm', '..nm..', 'nm....'])],
  moss: [wo_dec(['.cdc.', 'cdedc', '.cdc.']), wo_dec(['cd.', 'dedc', '.cd.'])],
  reed: [wo_dec(['.O..', '.O.6', '.4.5', '54.4', '4.44', '3433']), wo_dec(['6..7.', '5.6.6', '4.5.5', '45.44', '34343']), wo_dec(['..O.', '.7O.', '6.5.', '.54.', '5.4.', '4343'])],
  cotton: [wo_dec(['|.|', '5.4', '4.4']), wo_dec(['.|..', '.5.|', '.4.5'])],
  heather: [wo_dec(['A.B.', 'BCA.', '.ABA']), wo_dec(['.B.', 'ACB'])],
  thistle: [wo_dec(['$.$', '5$5', '.4.', '.3.'])],
  bone: [wo_dec(['?..', '.?:', '..?']), wo_dec(['??:'])],
  shaft: [wo_dec(['=....', '.=...', '..=..', '...=.', '....:']), wo_dec(['....=', '...=.', '..=..', '.=...', ';....'])],
  rust: [wo_dec(['!:', ':!']), wo_dec(['.!.', '!:!'])],
  straw: [wo_dec(['<..', '.<<']), wo_dec(['.<', '<.', '.<'])],
  lily: [wo_dec(['.cd.', 'cddc', '.cc.']), wo_dec(['cd*', 'ddc'])]
};
function wo_stampD(B, X0, Y0, x, y, L, pal, b){
  for (let k = 0; k < L.length; k += 3){
    const px = x + L[k] - X0, py = y + L[k + 1] - Y0;
    if (px < 0 || py < 0 || px > 255 || py > 255) continue;
    let c = L[k + 2];
    if (c < 0){ const q = -c - 1; c = pal[q >> 4][clamp(q & 15, 0, 11)]; }
    else if (c === wo_DC['_']){ const o = B[(py << 8) | px]; c = wo_mix(o, 0xff141018, .45); }
    B[(py << 8) | px] = c;
  }
}

/* ---------- Chunks ---------- */
const wo_NCX = WW >> 8, wo_NCY = WH >> 8;
const wo_FBC = Array.from({ length: wo_NCX * wo_NCY }, () => []);   // Bodenflächen je Chunk
for (const f of wo_FEAT) for (let cj = Math.max(0, (f.y0 - 4) >> 8); cj <= Math.min(wo_NCY - 1, (f.y1 + 4) >> 8); cj++) for (let ci = Math.max(0, (f.x0 - 4) >> 8); ci <= Math.min(wo_NCX - 1, (f.x1 + 4) >> 8); ci++) wo_FBC[cj * wo_NCX + ci].push(f);
const wo_TBC = Array.from({ length: wo_NCX * wo_NCY }, () => []);   // Bäume und Bauten je Chunk (für Wurzeln, Trampelpfade)
for (const q of wo_PI){ const p = q.p; for (let cj = Math.max(0, (p.y - 40) >> 8); cj <= Math.min(wo_NCY - 1, (p.y + 40) >> 8); cj++) for (let ci = Math.max(0, (p.x - 40) >> 8); ci <= Math.min(wo_NCX - 1, (p.x + 40) >> 8); ci++) wo_TBC[cj * wo_NCX + ci].push(q); }
const wo_OBC = Array.from({ length: wo_NCX * wo_NCY }, () => []);
for (const o of wo_GOBJ) for (let cj = Math.max(0, (o.y - 40) >> 8); cj <= Math.min(wo_NCY - 1, (o.y + 40) >> 8); cj++) for (let ci = Math.max(0, (o.x - 40) >> 8); ci <= Math.min(wo_NCX - 1, (o.x + 40) >> 8); ci++) wo_OBC[cj * wo_NCX + ci].push(o);
/* Nähe-Flags je 8-px-Zelle: 1 Wasser, 2 Weg */
const wo_NEAR = new Uint8Array(wo_CW * wo_CH);
for (let j = 0; j < wo_CH; j++) for (let i = 0; i < wo_CW; i++){
  let w = 1e9, r = 1e9;
  for (let dy = 0; dy <= 2; dy++) for (let dx = 0; dx <= 2; dx++){ const g = (2 * j + dy) * wo_GW + 2 * i + dx; w = Math.min(w, wo_WSD[g]); r = Math.min(r, wo_RSD[g]); }
  wo_NEAR[j * wo_CW + i] = (w < 16 ? 1 : 0) | (r < 6 ? 2 : 0);
}
/* Chunks: 256 Weltpixel = 512 Feinpixel je Seite. Flächenmaske und Bild im Feinraster,
   dazu ein Grobpuffer (ein Weltpixel) für Wurzeln, Stümpfe, Bohlen und große Streudetails. */
const wo_CP = 256 * WS;
const wo_CLS = new Uint8Array(wo_CP * wo_CP);   // Art je Feinpixel: 1 Wasser, 2 Ufer, 3 Weg und Hof, 4 Feld, 5 Fläche, 6 Brücke, 7 Furt, 16 + Bodenart
let wo_LB = 0, wo_GSEA = wp_SEA;                  // zuletzt gemalte Bodenart; Jahreszeit des Bodens
const wo_FID = new Uint8Array(wo_CP * wo_CP), wo_BUF = new Uint32Array(wo_CP * wo_CP), wo_BUF1 = new Uint32Array(65536), wo_BUF0 = new Uint32Array(65536);
const wo_IMGD = (() => { try { return new ImageData(wo_CP, wo_CP); } catch (e){ return ctx.createImageData(wo_CP, wo_CP); } })();
let wo_FX = 0, wo_FY = 0;   // aktuelles Feinpixel (Weltkoordinaten × WS) für Texturen

/* Bodenfläche in die Chunkmaske malen (Feinraster) */
function wo_paint(f, id, X0, Y0){
  const x0 = Math.max(0, Math.floor(f.x0 * 2) - X0 * 2), x1 = Math.min(wo_CP, Math.ceil(f.x1 * 2) - X0 * 2), y0 = Math.max(0, Math.floor(f.y0 * 2) - Y0 * 2), y1 = Math.min(wo_CP, Math.ceil(f.y1 * 2) - Y0 * 2);
  if (f.e){
    const [cx, cy, rx, ry] = f.e;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
      const wx = X0 + x * .5, wy = Y0 + y * .5, dx = (wx - cx) / rx, dy = (wy - cy) / ry, q = dx * dx + dy * dy + (wo_fin(wx, wy) - .5) * (f.soft ? .6 : .25);
      if (q < 1) wo_FID[(y << 9) | x] = id;
    }
  } else for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) wo_FID[(y << 9) | x] = id;
}
/* Fläche an einem Weltpunkt dieses Chunks (0 = keine) */
const wo_fidAt = (x, y, X0, Y0) => { const lx = Math.floor((x - X0) * 2), ly = Math.floor((y - Y0) * 2); return lx >= 0 && ly >= 0 && lx < wo_CP && ly < wo_CP ? wo_FID[(ly << 9) | lx] : 0; };

/* Hauptschleife: ein Chunk */
function wo_rcBegin(ci, cj){
  const X0 = ci << 8, Y0 = cj << 8, F = wo_FID, fl = wo_FBC[cj * wo_NCX + ci];
  F.fill(0);
  for (let k = 0; k < fl.length; k++) if (!fl[k].hi) wo_paint(fl[k], k + 1, X0, Y0);
  for (let k = 0; k < fl.length; k++) if (fl[k].hi) wo_paint(fl[k], k + 1, X0, Y0);
}
/* Feinzeilen ya..yb eines Chunks berechnen (0..wo_CP) */
function wo_rcRows(ci, cj, ya, yb){
  const X0 = ci << 8, Y0 = cj << 8, B = wo_BUF, F = wo_FID, fl = wo_FBC[cj * wo_NCX + ci];
  wo_FINE = 1;
  for (let y = ya; y < yb; y++){
    const FY = (Y0 << 1) + y, wy = FY * .5;
    for (let x = 0; x < wo_CP; x++){
      const FX = (X0 << 1) + x, wx = FX * .5, i = (y << 9) | x, cell = wo_NEAR[(wy >> 3) * wo_CW + (wx >> 3)];
      wo_FX = FX; wo_FY = FY;
      const fd = F[i], fe = fd ? fl[fd - 1] : null, fm = fe ? fe.m : 0;
      const dth = BAYER4[(FY & 3) * 4 + (FX & 3)] / 16;
      let wsd = 99, rsd = 99, col = 0, cl;
      if (cell & 1) wsd = wo_bil(wo_WSD, wx, wy);
      if (cell & 2) rsd = wo_bil(wo_RSD, wx, wy);
      const sh = wo_shade(wx, wy);
      if (fm === WM.BRIDGE || fm === WM.STEG){ col = wo_pxBridge(fe, wx, wy, dth, wsd); cl = 6; }
      else if (fm === WM.FORD && wsd < 3){ col = wo_pxFord(fe, wx, wy, wsd, dth); cl = 7; }
      else if (wsd < 0){ col = wo_pxWater(wx, wy, wsd, dth); cl = 1; }
      else if (wsd < 4.5){ col = wo_pxBank(wx, wy, wsd, dth, sh); cl = 2; }
      else if (rsd < 0 && fm !== WM.FIELD){ col = wo_pxRoad(wx, wy, rsd, dth, sh, fe); cl = 3; }
      else if (fe && fm !== WM.SHADOW){ col = wo_pxFeat(fe, wx, wy, dth, sh); cl = fm === WM.FIELD ? 4 : fm === WM.YARD ? 3 : 5; }
      else { col = wo_pxGround(wx, wy, dth, sh); cl = 16 + wo_LB; }
      wo_CLS[i] = cl;
      if (fm === WM.SHADOW && (FX + FY) % 2 === 0) col = wo_mix(col, 0xff120e0c, .38);
      else if (fm === WM.SHADOW) col = wo_mix(col, 0xff120e0c, .2);
      B[i] = col;
    }
  }
  wo_FINE = 0;
}
/* Grobdetails (Weltpixel) einrechnen: geänderte Weltpixel geglättet verdoppeln (Scale2x) */
function wo_rcDetails(ci, cj){
  const B = wo_BUF, B1 = wo_BUF1, B0 = wo_BUF0;
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) B1[(y << 8) | x] = B[(y << 10) | (x << 1)];
  B0.set(B1);
  wo_details(ci << 8, cj << 8, ci, cj);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++){
    const i = (y << 8) | x, P = B1[i]; if (P === B0[i]) continue;
    const A = y > 0 ? B1[i - 256] : P, Q = x < 255 ? B1[i + 1] : P, C = x > 0 ? B1[i - 1] : P, D = y < 255 ? B1[i + 256] : P, o = (y << 10) | (x << 1);
    B[o] = C === A && C !== D && A !== Q ? A : P;
    B[o + 1] = A === Q && A !== C && Q !== D ? Q : P;
    B[o + wo_CP] = D === C && D !== Q && C !== A ? C : P;
    B[o + wo_CP + 1] = Q === D && Q !== A && D !== C ? D : P;
  }
}
function wo_rcEnd(ci, cj){
  wo_fineDetails(ci << 8, cj << 8, ci, cj);
  if (wo_GSEA !== 1) wo_seaFilter(ci << 8, cj << 8, wo_GSEA);
  wo_IMGD.data.set(new Uint8Array(wo_BUF.buffer));
  return wo_IMGD;
}
/* Boden in der Jahreszeit: Schneedecke und Eis im Winter, Herbstfarben und Laub, frisches Grün und Blumen im Frühling */
const wo_SNOWG = ['#6a7590', '#7c87a0', '#8e99b0', '#a0aabf', '#b0bacc', '#bfc8d8', '#cdd5e2', '#d9e0ea', '#e3e9f0', '#ebf0f5', '#f2f5f9', '#f8fafc'].map(wo_c);
const wo_ICEP = ['#56768a', '#64869a', '#7396a8', '#84a6b6', '#96b4c2', '#a8c2ce', '#bad0da', '#cce0e6'].map(wo_c), wo_CRACK = wo_c('#4a6676');
const wo_AUTG = ['#262012', '#383018', '#4a3f20', '#5c4f28', '#6e5f31', '#80703b', '#928145', '#a49150'].map(wo_c);
const wo_STUB = ['#3a3018', '#4e4220', '#62542a', '#766634', '#8a783e', '#9e8a4a', '#b09c58'].map(wo_c);
const wo_SPRG = ['#1e2a12', '#2a3a18', '#364a1e', '#435c25', '#516d2d', '#607e36', '#709040', '#82a24c'].map(wo_c);
const wo_SPRF = ['#283818', '#34481e', '#405a24', '#4e6c2c', '#5c7e34', '#6a8e3e'].map(wo_c);
const wo_LEAFC = ['#7a2e14', '#9a4418', '#b8621e', '#c88a2a', '#8a5a1c', '#a8301a'].map(wo_c), wo_FLOW = ['#f4f0e8', '#f0d860', '#e8a8c0', '#ffffff', '#c8c8f0'].map(wo_c);
function wo_seaFilter(X0, Y0, sea){
  const B = wo_BUF, C = wo_CLS, ox = X0 * 2, oy = Y0 * 2, at = (R, L, a, k) => R[clamp(Math.floor(a + L * k), 0, R.length - 1)];
  for (let y = 0; y < wo_CP; y++){
    const FY = oy + y;
    for (let x = 0; x < wo_CP; x++){
      const i = (y << 9) | x, c = B[i], cl = C[i], FX = ox + x;
      const L = ((c & 255) * .3 + ((c >> 8) & 255) * .55 + ((c >> 16) & 255) * .15) / 255, dth = BAYER4[(FY & 3) * 4 + (FX & 3)] / 16;
      if (sea === 3){
        if (cl === 1 || cl === 7){
          // Eis: dunkler über tiefem Wasser, Risse, Schneewehen
          let col = wo_ICEP[clamp(Math.floor((L - .08) * 22 + dth), 0, 7)];
          // Risse: Höhenlinie eines Rauschens, so dünn wie sein Anstieg (etwa ein Feinpixel)
          const n = wo_nbl(wo_NB, FX * .045, FY * .045), gr = Math.abs(wo_nbl(wo_NB, (FX + 1) * .045, FY * .045) - n) + Math.abs(wo_nbl(wo_NB, FX * .045, (FY + 1) * .045) - n);
          if (Math.abs(n - .5) < gr * .7) col = wo_CRACK;
          else if (wo_lo(FX * .5, FY * .5) > .6 + dth * .04) col = wo_SNOWG[8 + (dth * 3 | 0)];
          B[i] = col; continue;
        }
        const k = clamp(Math.floor(6.5 + (L - .26) * 16 + dth), 0, 11);
        if (cl === 3 || cl === 6){ B[i] = wo_mix(c, wo_SNOWG[clamp(k - 1, 0, 11)], .55); continue; }
        let col = wo_SNOWG[k];
        if (wo_h(FX >> 3, FY >> 3, 917) < .05 && wo_h(FX, FY, 918) < .5) col = wo_mix(c, wo_SNOWG[6], .45);   // hier schaut Gras durch
        else if (wo_h(FX, FY, 919) > .996) col = wo_SNOWG[11];                                                 // Glitzern
        B[i] = col;
      } else if (sea === 2){
        const b = cl - 16, leaf = wo_h(FX >> 1, FY >> 1, 811);
        if (cl >= 16){
          if (b !== 1 && b !== 2 && b !== 12 && (b < 9 || b > 10)) B[i] = wo_mix(c, at(wo_AUTG, L, -1, 18), .32);
          if ((b < 9 || b === 11) && leaf < (b === 1 ? .05 : b === 2 ? .006 : .012)) B[i] = wo_LEAFC[(wo_h(FX >> 1, FY >> 1, 812) * 6) | 0];
        } else if (cl === 4) B[i] = wo_mix(c, at(wo_STUB, L, -1, 18), .55);
        else if ((cl === 3 || cl === 2) && leaf < .006) B[i] = wo_LEAFC[(wo_h(FX >> 1, FY >> 1, 812) * 6) | 0];
      } else if (sea === 0){
        const b = cl - 16;
        if (cl >= 16){
          if (b !== 1 && b !== 12 && (b < 9 || b > 10)) B[i] = wo_mix(c, at(wo_SPRG, L, -1, 20), .26);
          const f = wo_h(FX >> 1, FY >> 1, 813);
          if (b < 9 && f < (b === 1 ? .008 : b === 0 || b === 6 || b === 8 ? .007 : .002)) B[i] = b === 1 ? wo_FLOW[0] : wo_FLOW[(wo_h(FX >> 1, FY >> 1, 814) * 5) | 0];
        } else if (cl === 4) B[i] = wo_mix(c, at(wo_SPRF, L, -1, 18), .45);
      }
    }
  }
}
function wo_renderChunk(ci, cj){ wo_rcBegin(ci, cj); wo_rcRows(ci, cj, 0, wo_CP); wo_rcDetails(ci, cj); return wo_rcEnd(ci, cj); }
/* Gebiet → Bodenart mit verwischten Grenzen */
function wo_biome(wx, wy){
  const ox = (wo_NB[((wy >> 1) & 255) * 256 + ((wx >> 1) & 255)] - .5) * 56 + (wo_h(wx, wy, 3) - .5) * 10;
  const oy = (wo_NB[(((wx >> 1) + 128) & 255) * 256 + ((wy >> 1) & 255)] - .5) * 56 + (wo_h(wx, wy, 4) - .5) * 10;
  const b = wo_ZB[wo_zid((wx + ox) | 0, (wy + oy) | 0)];
  return b === 9 && wo_hgt(wx, wy) + (wo_mid(wx * 2, wy * 2) - .5) * .25 > 1.05 ? 10 : b;   // Hochgebirge: oben Schnee
}
/* Geländehöhe aus dem 8-px-Raster */
function wo_hgt(x, y){
  const gx = clamp(x * .125, 0, wo_CW - .01), gy = clamp(y * .125, 0, wo_CH - .01), xi = gx | 0, yi = gy | 0, fx = gx - xi, fy = gy - yi, i = yi * wo_SW + xi;
  const a = wo_HGT[i], b = wo_HGT[i + 1], c = wo_HGT[i + wo_SW], d = wo_HGT[i + wo_SW + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
function wo_inClear(wx, wy){ for (const [cx, cy, rx, ry] of wo_CLEAR) if (((wx - cx) / rx) ** 2 + ((wy - cy) / ry) ** 2 < .8 + wo_fin(wx, wy) * .3) return true; return false; }
function wo_pxGround(wx, wy, dth, sh){
  let b = wo_biome(wx, wy);
  if (b === 1 && wo_inClear(wx, wy)) b = 8;
  wo_LB = b;
  const e = wo_TEX[b][((wo_FY & 255) << 8) | (wo_FX & 255)], P = wo_PAL[b];
  const lo = wo_mid(wx, wy), s = sh * 1.5 + (lo - .5) * 3 + (b === 1 ? -.5 : 0);
  let ch = e >> 4, t = (e & 15) + Math.floor(s + dth);
  // Wiese: trockene und satte Flecken
  if ((b === 0 || b === 6) && ch === 0){ const d = wo_lo(wx * 3, wy * 3); if (d > .66 && dth < (d - .66) * 4) ch = 1; else if (d < .3 && dth < (.3 - d) * 4) ch = 2; }
  return P[ch][t < 0 ? 0 : t > 11 ? 11 : t];
}
function wo_pxWater(wx, wy, wsd, dth){
  const g = wo_gidx(wx, wy), wt = wo_WT[g], dep = -wsd;
  if (wt === 3){
    const v = 5 - Math.min(4, dep * .45) + (wo_fin(wx * 2, wy * 6) - .5) * 1.2;
    let c = wo_WATP[clamp(Math.floor(v + dth), 0, 7)];
    if (dep < 2.2 && wo_h(wx, wy, 9) < .4) c = wo_MOSS[2 + (wo_h(wx, wy, 8) * 2 | 0)];
    if (wo_fin(wx * 3 + 50, wy * 9) > .82 && dep > 3) c = wo_mix(c, wo_SKY, .35);
    return c;
  }
  if (wt === 2){
    const v = 7 - Math.min(6, dep * .3) + (wo_fin(wx * 2, wy * 7) - .5) * 1.4;
    let c = wo_WATC[clamp(Math.floor(v + dth), 0, 9)];
    if (wo_fin(wx * 2 + 90, wy * 8) > .84) c = wo_mix(c, wo_SKY, .3);
    return c;
  }
  // Fluss / Bach: Strömungsstreifen in Fließrichtung
  const vert = wt === 4;
  const sx = vert ? wy * .22 : wx * .22, sy = vert ? wx * 2.2 : wy * 2.2;
  const st = wo_nbl(wo_NB, sx, sy), st2 = wo_nbl(wo_NB, sx * 2.3 + 40, sy * .7 + 90);
  const depthT = Math.min(1, dep / 18);
  let v = 8.2 - depthT * 5.6 + (st - .5) * 2.6 + (st2 - .5) * 1.2 + (dep < 3 ? 1.2 : 0);
  let c = wo_WATR[clamp(Math.floor(v + dth), 0, 11)];
  if (st > .78 && st2 > .5) c = wo_mix(c, wo_SKY, .45);
  if (st > .86 && st2 > .62 && (wo_FX & 1)) c = wo_mix(c, wo_SKY2, .6);
  return c;
}
function wo_pxBank(wx, wy, wsd, dth, sh){
  const g = wo_gidx(wx, wy), wt = wo_WT[g];
  const up = wo_bil(wo_WSD, wx, Math.max(0, wy - 3)), dn = wo_bil(wo_WSD, wx, Math.min(WH - 4, wy + 3));
  const north = dn < up - .8;   // Wasser liegt südlich: Abbruchkante sichtbar
  if (wt === 3){
    const v = 1 + wsd * .6 + (wo_h(wx, wy, 5) - .5) * 1.4;
    return wo_MUDP[clamp(Math.floor(v + dth), 0, 5)];
  }
  if (north && wsd < 3.6){
    const v = 4 - wsd * .4 + (wo_fin(wx * 3, wy) - .5) * 2 - (wsd < 1 ? 2 : 0);
    let c = wo_BANK[clamp(Math.floor(v + dth), 0, 5)];
    if (wo_h(wx, wy >> 1, 6) < .07) c = wo_DIRT[7];
    return c;
  }
  const v = 1.4 + wsd * .5 + (wo_fin(wx * 2, wy * 2) - .5) * 1.8 + sh * .4;
  let c = wsd < 1.6 ? wo_SAND[clamp(Math.floor(v + dth), 0, 4)] : wo_BANK[clamp(Math.floor(v + 1 + dth), 0, 5)];
  if (wo_h(wx, wy, 7) < .06) c = wo_SAND[4];
  return c;
}
function wo_pxRoad(wx, wy, rsd, dth, sh, fe){
  const g = wo_gidx(wx, wy), t = wo_RT[g], d = wo_bil(wo_RD, wx, wy), hw = d - rsd;
  if (t === 3 || (fe && fe.m === WM.YARD && fe.sub !== 3)){
    const cv = wo_COBT[((wo_FY & 127) << 7) | (wo_FX & 127)];
    if (cv === 0) return wo_mix(wo_COBP[0], wo_COBM[1], wo_fin(wx * 3, wy * 3) > .6 ? .6 : 0);
    let v = cv + Math.floor(sh * .8 + (wo_mid(wx * 3, wy * 3) - .5) * 2.4 + dth);
    if (t === 3 && d < 2.5) v -= 2;                          // Rinnstein
    if (rsd > -2.5) v -= 1;
    let c = wo_COBP[clamp(v, 1, 7)];
    const dirt = wo_fin(wx + 100, wy + 50);
    if (dirt > .7) c = wo_mix(c, wo_DIRT[4], (dirt - .7) * 2.4);
    return c;
  }
  if (t === 2){
    const v = 1 + (wo_fin(wx * 2, wy * 2) * 3) + dth;
    return wo_MUDP[clamp(v | 0, 0, 5)];
  }
  // Ränder ausfransen
  if (rsd > -2.8 && wo_h(wx, wy, 11) < (rsd + 2.8) / 2.8) return wo_pxGround(wx, wy, dth, sh);
  const n = wo_fin(wx * 2, wy * 2), lo = wo_lo(wx * 6, wy * 6);
  let v = 5.2 + (n - .5) * 2.4 + sh * 1.1 + (lo - .5) * 1.6;
  if (t === 0){
    const r = Math.abs(d - hw * .5);
    if (r < 1.4) v -= 2.6; else if (r < 2.4) v -= 1.2; else if (r < 3.2) v += .6;
    if (r < 1.6 && wo_mid(wx * 5, wy * 5) > .72) return (wo_FY + wo_FX) & 3 ? wo_mix(wo_WATR[7], wo_SKY, .25) : wo_WATR[9];   // Pfütze in der Spur
    if (d < hw * .2 && wo_h(wx, wy, 12) < .55){ const P = wo_PAL[0][0]; return P[clamp(4 + Math.floor(sh + dth + n * 2), 0, 11)]; }
  } else v += (1 - d / hw) * .8;
  const pb = wo_h(wx, wy, 13);
  if (pb < .035) return wo_DIRT[8]; if (pb < .07) return wo_DIRT[2];
  return wo_DIRT[clamp(Math.floor(v + dth), 0, 11)];
}
function wo_pxFeat(f, wx, wy, dth, sh){
  const m = f.m;
  if (m === WM.FIELD){
    const P = wo_FIELDP[f.crop === 'fallow' ? 'green' : f.crop] || wo_FIELDP.plow;
    const u = f.vert ? wx - f.x0 : wy - f.y0, along = f.vert ? wy : wx, wdt = f.vert ? f.x1 - f.x0 : f.y1 - f.y0;
    if (u < 1 || u > wdt - 2) return wo_pxGround(wx, wy, dth, sh);           // Feldrain
    const furrow = (u + (f.s & 3)) % 4, n = wo_fin(wx * 2, wy * 2);
    const earth = wo_FIELDP.plow;
    if (f.crop === 'plow') return earth[clamp(Math.floor((furrow === 0 ? 1 : furrow === 1 ? 4 : 3) + (n - .5) * 2 + sh * .6 + dth), 0, 7)];
    if (f.crop === 'burn'){ const a = wo_h(wx, wy, 21); if (a < .05) return wo_c('#5e5850'); return P[clamp(Math.floor((furrow === 0 ? 0 : 2) + n * 2.6 + dth), 0, 7)]; }
    if (f.crop === 'fallow') return wo_pxGround(wx, wy, dth, sh);
    if (f.crop === 'stub'){ const st = (along + (u >> 2) * 3) % 3 === 0 && furrow !== 0; return st ? P[clamp(5 + (n * 2 | 0), 0, 7)] : earth[clamp(Math.floor(3 + n * 2 + dth), 0, 7)]; }
    // stehendes Korn: Halme in Reihen, Ähren oben hell
    const hh = wo_h(wx, (wy / 3) | 0, f.s), col = furrow === 0 ? 1 : 3 + Math.floor((wo_fin(wx * 3, wy) * 3) + sh * .7 + dth);
    if (furrow === 0) return earth[clamp(1 + (n * 2 | 0), 0, 7)];
    return P[clamp(col + (hh < .2 ? 2 : 0), 0, 7)];
  }
  if (m === WM.YARD){
    if (f.sub === 3){   // Lagerplatz: zertrampelt
      const e = wo_TEX[7][((wo_FY & 255) << 8) | (wo_FX & 255)];
      return wo_PAL[7][e >> 4][clamp((e & 15) + Math.floor(sh + (wo_mid(wx * 4, wy * 4) - .5) * 3 + dth), 0, 11)];
    }
    if (f.sub === 2) return wo_pxRoad(wx, wy, -10, dth, sh, f);     // Markt: Pflaster
    const n = wo_fin(wx * 2, wy * 2), lo = wo_mid(wx * 4, wy * 4);
    let v = 3.6 + (n - .5) * 2.4 + (lo - .5) * 2.6 + sh;
    const hh = wo_h(wx, wy, 31);
    const pd = lo + (n - .5) * .05;
    if (pd < .2){                                                     // Pfütze: Schlammrand, dunkles Wasser, Himmelsglanz
      if (pd > .185) return wo_MUDP[2];
      return wo_fin(wx * 2 + 40, wy * 7) > .78 ? wo_mix(wo_WATR[8], wo_SKY, .4) : wo_mix(wo_WATR[3], wo_SKY, .12);
    }
    if (hh < .05) return wo_FIELDP.stub[4];                           // Stroh
    if (hh < .08) return wo_DIRT[1];
    if (f.sub === 1 && wo_FLAGT[((wo_FY & 127) << 7) | (wo_FX & 127)] === 0 && lo > .5) return wo_COBP[1];
    return wo_DIRT[clamp(Math.floor(v + dth), 0, 11)];
  }
  if (m === WM.MOUND){
    // gewölbter Hügel mit runden Ecken, Licht von links oben; Gräber begrast, Massengräber mit frischer Erde
    const nx = ((wx + .5 - f.x0) / (f.x1 - f.x0) - .5) * 2.2, ny = ((wy + .5 - f.y0) / (f.y1 - f.y0) - .5) * 2.2;
    const q = Math.abs(nx) ** 3 + Math.abs(ny) ** 3;
    if (q > 1){
      const g = wo_pxGround(wx, wy, dth, sh);
      return q < 1.6 && nx + ny > .4 ? wo_mix(g, 0xff120e0c, .3) : g;   // Schatten unten rechts
    }
    const lit = -nx * .55 - ny * .65 + Math.sqrt(Math.max(0, 1 - q)) * .4, n = wo_fin(wx * 3, wy * 3);
    const t = Math.floor(3.5 + lit * 4 + (n - .5) * 1.6 + dth);
    if (f.big ? n > .45 : (n > .38 || q > .45)) return wo_PAL[5][0][clamp(t, 0, 11)];
    return wo_DIRT[clamp(t + 1, 0, 11)];
  }
  if (m === WM.HERB){
    const u = wx - f.x0, v2 = wy - f.y0;
    if (u < 2 || v2 < 2 || u > f.x1 - f.x0 - 3 || v2 > f.y1 - f.y0 - 3) return u < 1 || v2 < 1 ? wo_WOOD[3] : wo_WOOD[1];
    const row = (v2 - 2) % 6, plant = row < 3 && ((u + (f.s * 3) + ((v2 / 6) | 0) * 2) % 5) < 3;
    if (plant) return wo_HERBP[clamp(1 + row + (wo_h(wx, wy, f.s) * 2.5 | 0), 0, 5)];
    return wo_FIELDP.plow[clamp(2 + (wo_fin(wx * 3, wy * 3) * 3 | 0), 0, 7)];
  }
  if (m === WM.RABEN){
    const [cx, cy, rx, ry] = f.e, dx = (wx - cx) / rx, dy = (wy - cy) / ry, q = dx * dx + dy * dy;
    if (q > .82){ const v = 2 + (dy > 0 ? 2 : 0) - dx; return wo_GREY[clamp(Math.floor(v + dth), 0, 5)]; }
    const cv = wo_FLAGT[((wo_FY & 127) << 7) | (wo_FX & 127)];
    if (cv === 0) return wo_GREY[0];
    return wo_GREY[clamp(cv - 1 + Math.floor(sh * .5 + dth), 1, 5)];
  }
  if (m === WM.ROCK){
    const n = wo_fin(wx * 2, wy * 2), lo = wo_mid(wx * 5, wy * 5);
    if (lo < .45) return wo_pxGround(wx, wy, dth, sh);
    const cr = wo_fin(wx * 4 + 70, wy * 4 + 10);
    const v = 2.4 + (n - .5) * 3 + sh * 1.2 - (cr > .7 ? 1.5 : 0);
    if (wo_h(wx, wy, 41) < .1) return wo_PAL[3][3][2];
    return wo_GREY[clamp(Math.floor(v + dth), 0, 5)];
  }
  if (m === WM.COAL){
    const n = wo_fin(wx * 3, wy * 3), v = (f.soft ? 1.6 : .8) + n * 2.2 + sh * .5;
    if (f.soft && wo_fin(wx * 2 + 30, wy * 2 + 60) > .62) return wo_pxGround(wx, wy, dth, sh);
    if (wo_h(wx, wy, 42) < .04) return wo_c('#4a4640');
    return wo_PAL[7][3][clamp(Math.floor(v + dth), 0, 11)];
  }
  if (m === WM.ASH){
    const [cx, cy, rx, ry] = f.e, q = ((wx - cx) / rx) ** 2 + ((wy - cy) / ry) ** 2;
    if (q > .7){ return wo_GREY[clamp(Math.floor(1 + wo_h(wx, wy, 43) * 3), 0, 5)]; }
    return wo_h(wx, wy, 44) < .3 ? wo_c('#5c5850') : wo_PAL[7][3][clamp(Math.floor(1 + wo_fin(wx * 4, wy * 4) * 3 + dth), 0, 11)];
  }
  if (m === WM.MUD){
    const n = wo_fin(wx * 3, wy * 3), [cx, cy, rx, ry] = f.e, q = ((wx - cx) / rx) ** 2 + ((wy - cy) / ry) ** 2, w = q + (wo_mid(wx * 6, wy * 6) - .5) * .5;
    if (w < .3){                                                      // Wasserlache im Schlamm: dunkler Rand, Himmelsglanz
      if (w > .26) return wo_MUDP[1];
      return wo_fin(wx * 2 + 70, wy * 7) > .8 ? wo_mix(wo_WATR[7], wo_SKY, .35) : wo_mix(wo_PAL[4][3][4], wo_SKY, .1);
    }
    return wo_PAL[4][0][clamp(Math.floor(1 + n * 3 + dth), 0, 11)];
  }
  return wo_pxGround(wx, wy, dth, sh);
}
function wo_pxBridge(f, wx, wy, dth, wsd){
  if (f.m === WM.STEG){   // Steg: Bohlen quer zur Laufrichtung (senkrechte Fugen)
    const v2 = wy - f.y0, H2 = f.y1 - f.y0;
    if (v2 < 4 || v2 >= H2 - 4){
      const post = ((wx - f.x0) % 16) < 3;
      if (v2 < 2 || v2 >= H2 - 2) return post ? wo_WOOD[1] : wo_WOODG[2];
      return post ? wo_WOOD[4] : wo_WOODG[4 - (v2 < 4 ? 0 : 1)];
    }
    const u = wx - f.x0, plank = (u / 4) | 0, gap = u % 4 === 3;
    if (gap) return wo_WOOD[0];
    return wo_WOODG[clamp(2 + (wo_h(plank, 3, 9) * 3 | 0) + (v2 === 4 ? 1 : 0) - (wo_h(plank, wy, 2) < .1 ? 1 : 0), 0, 5)];
  }
  const u = wx - f.x0, W2 = f.x1 - f.x0, v2 = wy - f.y0;
  if (f.kind === 'stein'){
    if (u < 8 || u >= W2 - 8){   // Brüstung: Deckplatten
      const e = u < 8 ? u : W2 - 1 - u, blk = ((v2 + (u < 8 ? 0 : 5)) / 10) | 0, j = (v2 + (u < 8 ? 0 : 5)) % 10 === 0;
      if (e === 0) return wo_OUTC;
      if (j) return wo_GREY[1];
      return wo_GREY[clamp((e === 1 ? 2 : e > 5 ? 3 : 4) + (wo_h(blk, u < 8 ? 1 : 2, 5) * 2 | 0) - (e === 7 ? 2 : 0), 0, 5)];
    }
    const cv = wo_FLAGT[((wo_FY & 127) << 7) | ((wo_FX + 14) & 127)];
    if (cv === 0) return wo_GREY[1];
    return wo_GREY[clamp(cv - 2 + Math.floor((wo_fin(wx * 3, wy * 3) - .5) * 2 + dth), 1, 5)];
  }
  // Holzbrücke: Bohlen quer, Geländer an beiden Seiten
  if (u < 6 || u >= W2 - 6){
    const e = u < 6 ? u : W2 - 1 - u, post = (v2 % 18) < 4;
    if (e === 0) return wo_OUTC;
    if (post) return wo_WOOD[e < 3 ? 4 : 2];
    return e < 2 ? wo_WOOD[1] : e < 4 ? wo_WOODG[3 + (e === 2 ? 1 : 0)] : wo_WOOD[1];
  }
  const plank = (v2 / 4) | 0, gap = v2 % 4 === 3;
  if (gap) return wsd < 0 ? wo_WATR[1] : wo_WOOD[0];
  let c = wo_WOODG[clamp(2 + (wo_h(plank, 5, 3) * 3 | 0) + (v2 % 4 === 0 ? 1 : 0), 0, 5)];
  if ((u === 8 || u === W2 - 9) && v2 % 4 === 1) c = wo_c('#24201c');   // Nägel
  if (wo_h(plank, wx >> 3, 8) < .08) c = wo_WOODG[1];
  return c;
}
function wo_pxFord(f, wx, wy, wsd, dth){
  const u = wx - (f.x0 + f.x1) / 2, n = wo_fin(wx * 2, wy * 2);
  const stoneGrid = (((wx + 3) % 11) < 6) && (((wy + ((wx / 11) | 0) * 4) % 9) < 5);
  if (stoneGrid && wo_h((wx / 11) | 0, (wy / 9) | 0, 3) < .7){
    const sx = (wx + 3) % 11, sy = (wy + ((wx / 11) | 0) * 4) % 9;
    return wo_GREY[clamp(4 - (sx > 3 ? 1 : 0) - (sy > 3 ? 1 : 0) + (sx === 0 || sy === 0 ? 1 : 0), 1, 5)];
  }
  const v = 7.5 + (n - .5) * 2.4 + (Math.abs(u) > 24 ? -1.5 : 0);
  let c = wo_WATR[clamp(Math.floor(v + dth), 0, 11)];
  if (wo_fin(wx * .5, wy * 4) > .7) c = wo_mix(c, wo_SKY2, .5);
  if (wo_h(wx, wy, 33) < .1) c = wo_SAND[3];
  return c;
}

/* Streudetails, Wurzeln, Stümpfe, Gräber usw. in den Chunk stempeln */
function wo_details(X0, Y0, ci, cj){
  const B = wo_BUF1, BF = wo_BUF;   // Weltpixel / Feinpixel
  const surf = (x, y) => {   // was liegt hier? 0 Boden, 1 Weg, 2 Wasser, 3 Ufer, 4 Fläche
    if (wo_fidAt(x, y, X0, Y0)) return 4;
    const w = wo_wsd(x, y); if (w < 0) return 2; if (w < 7) return 3;
    if (wo_rsd(x, y) < 1) return 1;
    return 0;
  };
  // Wurzeln und Laub um Baumstämme, Trampelpfade vor Türen
  for (const q of wo_TBC[cj * wo_NCX + ci]){
    const p = q.p, k = p.kind;
    if (k === 'eiche' || k === 'buche' || k === 'apfelbaum' || k === 'weide' || k === 'toter_baum' || k === 'fichte' || k === 'birke'){
      const b = wo_biome(p.x, p.y), P = wo_PAL[b === 8 ? 1 : b], R = rng(p.x * 7 + p.y);
      const n = k === 'eiche' ? 6 : k === 'fichte' || k === 'birke' ? 3 : 4;
      for (let r = 0; r < n; r++){
        let a = (r / n) * Math.PI + (R() - .5) * .6, x = p.x + Math.cos(a) * 4, y = p.y - 1;
        const L = 5 + R() * (k === 'eiche' ? 10 : 6);
        for (let s = 0; s < L; s++){
          x += Math.cos(a) * 1; y += Math.abs(Math.sin(a)) * .5 + .15;
          const lx = Math.round(x) - X0, ly = Math.round(y) - Y0;
          if (lx < 0 || ly < 0 || lx > 255 || ly > 254) continue;
          B[(ly << 8) | lx] = s < L * .5 ? wo_WOOD[3] : wo_WOOD[2];
          B[((ly + 1) << 8) | lx] = wo_mix(B[((ly + 1) << 8) | lx], 0xff100c0a, .5);
          if (s < 2 && ly > 0) B[((ly - 1) << 8) | lx] = wo_WOOD[4];
          a += (R() - .5) * .3;
        }
      }
      // Laub oder Nadeln rings um den Stamm
      for (let s = 0; s < 26; s++){
        const a = R() * 6.283, r = 6 + R() * 26, x = Math.round(p.x + Math.cos(a) * r), y = Math.round(p.y + Math.sin(a) * r * .55);
        if (surf(x, y)) continue;
        wo_stampD(B, X0, Y0, x, y, wo_D[k === 'fichte' ? 'twig' : 'leafs'][R() * 2 | 0], P.length ? P : wo_PAL[1], b);
      }
    } else if (k === 'fachwerkhaus' || k === 'fachwerkhaus_ruine' || k === 'stadthaus' || k === 'zelt' || k === 'kapelle' || k === 'muehle'){
      // ausgetretene Erde vor dem Eingang
      const R = rng(p.x + p.y * 3);
      for (let y = 0; y < 28; y++) for (let x = -24 + (y >> 1); x <= 24 - (y >> 1); x++){
        const wx = p.x + x * .5, wy = p.y + 3 + y * .5, lx = (p.x - X0) * 2 + x, ly = (p.y + 3 - Y0) * 2 + y;
        if (lx < 0 || ly < 0 || lx >= wo_CP || ly >= wo_CP || surf(wx, wy) === 2) continue;
        if (R() < .25 + y * .02) continue;
        BF[(ly << 9) | lx] = wo_DIRT[clamp(3 + (wo_fin(wx * 3, wy * 3) * 3 + (R() - .5) * .8 | 0), 0, 11)];
      }
    }
  }
  // Baumstümpfe und liegende Stämme
  for (const o of wo_OBC[cj * wo_NCX + ci]) wo_drawGobj(B, X0, Y0, o);
  // Bohlenweg: Bohlen quer zur Richtung
  for (const r of wo_ROADS){
    if (r.t !== 2) continue;
    for (let k = 0; k < r.p.length - 1; k++){
      const [x0, y0] = r.p[k], [x1, y1] = r.p[k + 1], L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
      for (let s = 0; s < L; s += 4){
        const cx = x0 + ux * s, cy = y0 + uy * s;
        if (cx < X0 - 16 || cy < Y0 - 16 || cx > X0 + 272 || cy > Y0 + 272) continue;
        const pi = Math.round((k * 6 + s) / 4), tone = 2 + (wo_h(pi, 1, 77) * 3 | 0), len = r.hw + (wo_h(pi, 2, 77) - .5) * 4;
        for (let t = -len; t <= len; t++) for (let w = 0; w < 3; w++){
          const px = Math.round(cx - uy * t + ux * w) - X0, py = Math.round(cy + ux * t + uy * w) - Y0;
          if (px < 0 || py < 0 || px > 255 || py > 255) continue;
          B[(py << 8) | px] = w === 2 ? wo_WOODG[0] : wo_WOODG[clamp(tone + (w === 0 ? 1 : 0) - (Math.abs(t) > len - 1 ? 1 : 0), 0, 5)];
        }
      }
    }
  }
  // Streudetails je 8-px-Zelle
  for (let cy = (Y0 >> 3) - 1; cy <= (Y0 >> 3) + 32; cy++) for (let cx = (X0 >> 3) - 1; cx <= (X0 >> 3) + 32; cx++){
    const h1 = wo_h(cx, cy, 101); if (h1 > .62) continue;
    const x = cx * 8 + (wo_h(cx, cy, 102) * 8 | 0), y = cy * 8 + (wo_h(cx, cy, 103) * 8 | 0);
    if (x < 0 || y < 0 || x >= WW || y >= WH) continue;
    const s = surf(x, y), z = ZONES[wo_zid(x, y)].id, b = wo_biome(x, y), P = wo_PAL[b], h2 = wo_h(cx, cy, 104), h3 = wo_h(cx, cy, 105);
    const v = (arr) => arr[(h3 * arr.length) | 0];
    let D = null;
    if (s === 2){
      const wt = wo_WT[wo_gidx(x, y)];
      if ((wt === 2 || wt === 3) && h1 < .07 && wo_wsd(x, y) < -4) D = v(wo_D.lily);
    } else if (s === 3){
      if (h1 < .5 && (z === 'fluss' || z === 'moor' || wo_WT[wo_gidx(x, y)] !== 1 || h1 < .25)) D = v(wo_D.reed);
      else if (h1 < .56) D = v(wo_D.pebbles);
    } else if (s === 1){
      if (h1 < .05) D = v(wo_D.stone); else if (h1 < .08 && (z === 'dorf' || z === 'stadt' || z === 'lager')) D = v(wo_D.straw);
    } else if (s === 0){
      if (b === 0 || b === 6 || b === 8){
        const fl = wo_lo(x * 4, y * 4);
        if (h1 < .16) D = v(h2 < .25 ? wo_D.tuftDry : wo_D.tuft);
        else if (h1 < .16 + fl * .14) D = v(h2 < .35 ? wo_D.daisy : h2 < .6 ? wo_D.butter : h2 < .75 ? wo_D.clover : h2 < .88 ? (b === 6 ? wo_D.poppy : wo_D.daisy) : wo_D.blue);
        else if (h1 < .33) D = v(wo_D.stone);
        else if (h1 < .335 && b !== 8) D = v(wo_D.mole);
        else if (b === 8 && h1 < .4) D = v(h2 < .5 ? wo_D.fern : wo_D.moss);
      } else if (b === 1){
        if (h1 < .1) D = v(wo_D.fern); else if (h1 < .2) D = v(wo_D.moss); else if (h1 < .28) D = v(wo_D.twig);
        else if (h1 < .3) D = v(wo_D.shroom); else if (h1 < .36) D = v(wo_D.leafs); else if (h1 < .4) D = v(wo_D.stone);
      } else if (b === 2){
        if (h1 < .14) D = v(wo_D.cotton); else if (h1 < .26) D = v(wo_D.heather); else if (h1 < .36) D = v(wo_D.tuft); else if (h1 < .4) D = v(wo_D.moss);
      } else if (b === 3){
        if (h1 < .14) D = v(wo_D.tuftDry); else if (h1 < .26) D = v(wo_D.stone); else if (h1 < .3) D = v(wo_D.thistle); else if (h1 < .36) D = v(wo_D.pebbles); else if (h1 < .4) D = v(wo_D.heather);
      } else if (b === 4){
        if (h1 < .08) D = v(wo_D.shaft); else if (h1 < .14) D = v(wo_D.rust); else if (h1 < .17) D = v(wo_D.bone); else if (h1 < .27) D = v(wo_D.tuftDry); else if (h1 < .34) D = v(wo_D.stone);
      } else if (b === 5){
        if (h1 < .1) D = v(wo_D.tuft); else if (h1 < .2) D = v(wo_D.daisy); else if (h1 < .26) D = v(wo_D.moss); else if (h1 < .3) D = v(wo_D.stone);
      }
    } else if (s === 4){
      const fd = wo_fidAt(x, y, X0, Y0);
      const fe = fd ? wo_FBC[cj * wo_NCX + ci][fd - 1] : null;
      if (fe && fe.m === WM.FIELD){
        const u = fe.vert ? x - fe.x0 : y - fe.y0, wdt = fe.vert ? fe.x1 - fe.x0 : fe.y1 - fe.y0;
        if ((u < 3 || u > wdt - 4) && h1 < .35) D = v(h2 < .4 ? wo_D.poppy : h2 < .7 ? wo_D.blue : wo_D.tuft);
        else if ((fe.crop === 'wheat' || fe.crop === 'rye') && h1 < .06) D = v(h2 < .6 ? wo_D.poppy : wo_D.blue);
        else if (fe.crop === 'fallow' && h1 < .3) D = v(h2 < .3 ? wo_D.thistle : h2 < .6 ? wo_D.tuftDry : wo_D.daisy);
      } else if (fe && fe.m === WM.YARD && h1 < .08) D = v(fe.sub === 3 ? wo_D.straw : h2 < .5 ? wo_D.straw : wo_D.stone);
      else if (fe && fe.m === WM.ROCK && h1 < .2) D = v(h2 < .5 ? wo_D.pebbles : wo_D.tuftDry);
      else if (fe && fe.m === WM.MUD && h1 < .1) D = v(h2 < .5 ? wo_D.shaft : wo_D.rust);
    }
    if (D) wo_stampD(B, X0, Y0, x, y, D, P, b);
  }
}
/* Baumstumpf oder liegender Stamm */
function wo_drawGobj(B, X0, Y0, o){
  const R = rng(o.s * 13 + 1), BK = o.birch ? wo_ramp(['#2a2724', '#4a4640', '#7a756a', '#a8a294', '#c4bfb0'], 6) : wo_WOOD, END = wo_ramp(['#4a3a26', '#6b5636', '#8b7448', '#a8915e'], 4);
  const put = (x, y, c) => { const lx = x - X0, ly = y - Y0; if (lx >= 0 && ly >= 0 && lx < 256 && ly < 256) B[(ly << 8) | lx] = c; };
  const shade = (x, y) => { const lx = x - X0, ly = y - Y0; if (lx >= 0 && ly >= 0 && lx < 256 && ly < 256) B[(ly << 8) | lx] = wo_mix(B[(ly << 8) | lx], 0xff140f0c, .45); };
  if (o.k === 'stump'){
    for (let x = -6; x <= 6; x++) shade(o.x + x, o.y + 1);
    for (let y = -6; y <= 0; y++) for (let x = -5; x <= 5; x++){
      if (y < -4 && Math.abs(x) > 4) continue;
      put(o.x + x, o.y + y, x === -5 || x === 5 || y === 0 ? wo_OUTC : BK[clamp(3 - (x > 1 ? 1 : 0) - (x > 3 ? 1 : 0) + (x < -2 ? 1 : 0) + (wo_h(x, y, o.s) < .2 ? -1 : 0), 0, BK.length - 1)]);
    }
    for (let y = -8; y <= -5; y++) for (let x = -4; x <= 4; x++){
      const q = (x * x) / 20 + ((y + 6.5) * (y + 6.5)) / 2.6;
      if (q > 1.05) continue;
      put(o.x + x, o.y + y, q > .7 ? (y < -6 ? wo_OUTC : BK[2]) : END[clamp(2 + (Math.round(Math.hypot(x, (y + 6.5) * 2)) % 2) - (x > 1 ? 1 : 0), 0, 3)]);
    }
    for (const dx of [-7, 6]){ put(o.x + dx, o.y, BK[2]); put(o.x + dx + (dx < 0 ? -1 : 1), o.y + 1, BK[1]); }
    if (R() < .6) for (let k = 0; k < 4; k++) put(o.x - 3 + (R() * 7 | 0), o.y - 3 + (R() * 3 | 0), wo_MOSS[3 + (k & 1)]);
    return;
  }
  const L = o.len, x0 = o.x - (L >> 1);
  for (let x = 0; x < L; x++) shade(x0 + x, o.y + 1), shade(x0 + x + 1, o.y + 2);
  for (let x = 0; x < L; x++) for (let y = -6; y <= 0; y++){
    const edge = y === -6 || y === 0 || x === 0;
    let c = edge ? wo_OUTC : BK[clamp(4 - Math.abs(y + 4) - (y > -2 ? 1 : 0) + (wo_h(x >> 1, y, o.s) < .15 ? -1 : 0), 0, BK.length - 1)];
    if (!edge && wo_fin(x * 5 + o.s, y * 7) > .66 && !o.birch) c = wo_MOSS[clamp(2 + (y < -3 ? 1 : 0), 0, 4)];
    if (o.birch && !edge && wo_h(x, y, o.s) < .12) c = wo_OUTC;
    put(x0 + x, o.y + y, c);
  }
  for (let y = -5; y <= -1; y++) for (let x = L - 3; x <= L; x++){ const q = (x - L + 1.5) ** 2 / 3 + (y + 3) ** 2 / 5; if (q < 1) put(x0 + x, o.y + y, END[clamp(2 + ((x + y) & 1) - (y > -2 ? 1 : 0), 0, 3)]); }
  put(x0 + L + 1, o.y - 3, wo_OUTC);
  if (R() < .7){ const bx = x0 + 4 + (R() * (L - 8) | 0); put(bx, o.y - 7, BK[2]); put(bx + 1, o.y - 8, BK[2]); put(bx + 2, o.y - 9, BK[1]); }
}

/* kleine Streudetails im Feinraster: Halmbüschel, Blüten, Kiesel, Laub (je 4-px-Zelle) */
function wo_stampF(X0, Y0, FX, FY, L, pal){
  const B = wo_BUF, ox = X0 * 2, oy = Y0 * 2;
  for (let k = 0; k < L.length; k += 3){
    const px = FX + L[k] - ox, py = FY + L[k + 1] - oy;
    if (px < 0 || py < 0 || px >= wo_CP || py >= wo_CP) continue;
    let c = L[k + 2];
    if (c < 0){ const q = -c - 1; c = pal[q >> 4][clamp(q & 15, 0, 11)]; }
    else if (c === wo_DC['_']){ const o = B[(py << 9) | px]; c = wo_mix(o, 0xff141018, .4); }
    B[(py << 9) | px] = c;
  }
}
function wo_fineDetails(X0, Y0, ci, cj){
  for (let cy = (Y0 >> 2) - 1; cy <= (Y0 >> 2) + 64; cy++) for (let cx = (X0 >> 2) - 1; cx <= (X0 >> 2) + 64; cx++){
    const h1 = wo_h(cx, cy, 201); if (h1 > .34) continue;
    const FX = cx * 8 + (wo_h(cx, cy, 202) * 8 | 0), FY = cy * 8 + (wo_h(cx, cy, 203) * 8 | 0), x = FX >> 1, y = FY >> 1;
    if (x < 0 || y < 0 || x >= WW || y >= WH) continue;
    let s = 0;
    if (wo_fidAt(x, y, X0, Y0)) s = 4;
    else { const w = wo_wsd(x, y); if (w < 0) s = 2; else if (w < 7) s = 3; else if (wo_rsd(x, y) < 1.5) s = 1; }
    if (s === 2 || s === 4) continue;
    const b = wo_biome(x, y), P = wo_PAL[b], h2 = wo_h(cx, cy, 204), h3 = wo_h(cx, cy, 205);
    const v = arr => arr[(h3 * arr.length) | 0];
    let D = null;
    if (s === 1 || s === 3){ if (h1 < .06) D = v(wo_D.pebbles); }
    else if (b === 0 || b === 6 || b === 8 || b === 5){
      if (h1 < .17) D = v(h2 < .2 ? wo_D.tuftDry : wo_D.tuft);
      else if (h1 < .21 + wo_lo(x * 4, y * 4) * .08) D = v(h2 < .4 ? wo_D.daisy : h2 < .6 ? wo_D.butter : h2 < .8 ? wo_D.clover : b === 6 ? wo_D.poppy : wo_D.blue);
      else if (h1 < .25) D = v(wo_D.pebbles);
      else if (b === 8 && h1 < .3) D = v(wo_D.moss);
    } else if (b === 1){
      if (h1 < .14) D = v(wo_D.leafs); else if (h1 < .22) D = v(wo_D.moss); else if (h1 < .27) D = v(wo_D.twig);
    } else if (b === 2){
      if (h1 < .1) D = v(wo_D.tuft); else if (h1 < .18) D = v(wo_D.heather); else if (h1 < .23) D = v(wo_D.cotton);
    } else if (b === 3){
      if (h1 < .12) D = v(wo_D.tuftDry); else if (h1 < .2) D = v(wo_D.heather); else if (h1 < .26) D = v(wo_D.pebbles);
    } else if (b === 4){
      if (h1 < .14) D = v(wo_D.tuftDry); else if (h1 < .18) D = v(wo_D.rust); else if (h1 < .24) D = v(wo_D.pebbles);
    }
    if (D) wo_stampF(X0, Y0, FX, FY, D, P);
  }
}

/* ---------- Chunk-Cache (LRU) und Zeichnen; Kamera und Leinwand in Feinpixeln ---------- */
const wo_CACHE = new Map(), wo_CMAX = 30;
let wo_tick = 0;
const wo_WFX = new Map();   // Glanzpunkte je Chunk
function wo_chunk(ci, cj){
  const key = cj * wo_NCX + ci;
  let e = wo_CACHE.get(key);
  if (e){ e.t = ++wo_tick; return e; }
  return wo_store(ci, cj, wo_renderChunk(ci, cj));
}
const wo_POOL = [];   // freie Leinwände (vom Überblenden)
function wo_store(ci, cj, id){
  const key = cj * wo_NCX + ci, old = wo_CACHE.get(key);
  let c, e;
  if (old) c = wo_POOL.pop() || canvasOf(wo_CP, wo_CP);
  else if (wo_CACHE.size >= wo_CMAX){
    let ok = -1, ot = 1e18;
    for (const [k, v] of wo_CACHE) if (v.t < ot){ ot = v.t; ok = k; }
    const ev = wo_CACHE.get(ok); c = ev.c; if (ev.prev) wo_POOL.push(ev.prev); wo_CACHE.delete(ok);
  } else c = canvasOf(wo_CP, wo_CP);
  c.getContext('2d').putImageData(id, 0, 0);
  e = { c, t: ++wo_tick, s: wo_GSEA };
  if (old){ e.prev = old.c; e.f0 = performance.now(); if (old.prev) wo_POOL.push(old.prev); }   // neue Jahreszeit: überblenden
  wo_CACHE.set(key, e);
  if (!wo_WFX.has(key)) wo_WFX.set(key, wo_glints(ci, cj));
  return e;
}
const wo_JOBROWS = 8;    // Feinzeilen je Bild beim Vorausrechnen (klein, damit kein Bild stockt)
function drawGround(g, camX, camY){
  camX = Math.round(camX); camY = Math.round(camY);
  const c0 = Math.max(0, Math.floor(camX / wo_CP)), c1 = Math.min(wo_NCX - 1, Math.floor((camX + W - 1) / wo_CP)), r0 = Math.max(0, Math.floor(camY / wo_CP)), r1 = Math.min(wo_NCY - 1, Math.floor((camY + H - 1) / wo_CP));
  let made = 0, stale = null, miss = null, nMiss = 0;
  const now = performance.now();
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (!wo_CACHE.has(r * wo_NCX + c)) nMiss++;
  const lazy = nMiss > 1 || (G && G.mode === 'title');   // Titelbild, Sprung (Fähre, Neustart): Platzhalter und Häppchen statt Stocken
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++){
    const X0 = c * wo_CP - camX, Y0 = r * wo_CP - camY;
    if (lazy && !wo_CACHE.has(r * wo_NCX + c)){ wo_holder(g, c, r, X0, Y0); if (!miss) miss = [c, r]; continue; }
    const had = wo_CACHE.has(r * wo_NCX + c), e = wo_chunk(c, r), X = X0, Y = Y0;
    if (!had) made++;
    else if (e.s !== wo_GSEA && !stale) stale = [c, r];
    if (e.prev){
      const f = (now - e.f0) / 900;
      if (f >= 1){ wo_POOL.push(e.prev); e.prev = null; g.drawImage(e.c, X, Y); }
      else { g.drawImage(e.prev, X, Y); g.globalAlpha = f; g.drawImage(e.c, X, Y); g.globalAlpha = 1; }
    } else g.drawImage(e.c, X, Y);
  }
  if (miss){ const t0 = performance.now(), B = G && G.mode === 'title' ? 14 : 22; while (performance.now() - t0 < B){ if (wo_jobStep(miss[0], miss[1])) break; } return; }
  if (made){ wo_JOB = null; return; }
  // sichtbarer Chunk aus der alten Jahreszeit: zuerst und schneller neu malen
  if (stale){ const t0 = performance.now(); while (performance.now() - t0 < 4 && !wo_jobStep(stale[0], stale[1])); return; }
  // vorausschauend höchstens einen Nachbarchunk je Bild vorbereiten, in Streifen
  const cx = Math.floor((camX + W / 2) / wo_CP), cy = Math.floor((camY + H / 2) / wo_CP);
  for (let d = 1, dm = W <= 700 ? 1 : 2; d <= dm; d++) for (let r = cy - d; r <= cy + d; r++) for (let c = cx - d; c <= cx + d; c++){
    if (c < 0 || r < 0 || c >= wo_NCX || r >= wo_NCY) continue;
    const ce = wo_CACHE.get(r * wo_NCX + c);
    if (ce && ce.s === wo_GSEA) continue;
    if (Math.abs(c - cx) < d && Math.abs(r - cy) < d) continue;
    wo_jobStep(c, r); return;
  }
}
/* Platzhalter für einen noch nicht gemalten Bodenteil: die kleine Karte, weich vergrößert */
function wo_holder(g, c, r, X, Y){
  const s = MINIMAP.width / wo_NCX;
  g.save(); g.imageSmoothingEnabled = true; g.drawImage(MINIMAP, c * s, r * s, s, s, X, Y, wo_CP, wo_CP); g.restore();
}
let wo_JOB = null;
/* ein Schritt beim Vorausrechnen eines Chunks; true, wenn er fertig ist */
function wo_jobStep(c, r){
  if (!wo_JOB || wo_JOB.c !== c || wo_JOB.r !== r) wo_JOB = { c, r, step: 0 };
  const J = wo_JOB, n = wo_CP / wo_JOBROWS;
  if (J.step === 0) wo_rcBegin(c, r);
  else if (J.step <= n) wo_rcRows(c, r, (J.step - 1) * wo_JOBROWS, J.step * wo_JOBROWS);
  else if (J.step === n + 1) wo_rcDetails(c, r);
  else { wo_store(c, r, wo_rcEnd(c, r)); wo_JOB = null; return true; }
  J.step++; return false;
}
/* Glanzlichter auf dem Wasser */
function wo_glints(ci, cj){
  const L = [], X0 = ci << 8, Y0 = cj << 8;
  for (let y = 4; y < 256; y += 6) for (let x = 2; x < 256; x += 7){
    const wx = X0 + x + (wo_h(x, y, cj * 97 + ci) * 5 | 0), wy = Y0 + y, w = wo_wsd(wx, wy);
    if (w > -3 || wo_h(wx, wy, 61) > .32) continue;
    let br = false; for (const b of wo_BRIDGES) if (wx > b.x0 - 4 && wx < b.x1 + 4 && wy > b.y0 && wy < b.y1) br = true;
    if (br) continue;
    const wt = wo_WT[wo_gidx(wx, wy)];
    L.push(wx, wy, wt, wo_h(wx, wy, 62) * 10, 2 + (wo_h(wx, wy, 63) * 3 | 0));
  }
  return L;
}
function drawWaterFx(g, camX, camY, t){
  if (wo_GSEA === 3) return;   // Eis
  camX = Math.round(camX); camY = Math.round(camY);
  const c0 = Math.max(0, Math.floor(camX / wo_CP)), c1 = Math.min(wo_NCX - 1, Math.floor((camX + W - 1) / wo_CP)), r0 = Math.max(0, Math.floor(camY / wo_CP)), r1 = Math.min(wo_NCY - 1, Math.floor((camY + H - 1) / wo_CP));
  const tt = RM ? 0 : t;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++){
    const L = wo_WFX.get(r * wo_NCX + c); if (!L) continue;
    for (let k = 0; k < L.length; k += 5){
      const wt = L[k + 2], ph = (tt * (wt === 1 ? .55 : wt === 4 ? .8 : .25) + L[k + 3]) % 1;
      if (ph > .45) continue;
      const fl = wt === 1 ? -ph * 14 : 0, fv = wt === 4 ? ph * 14 : 0;
      const x = Math.round((L[k] + fl) * WS - camX), y = Math.round((L[k + 1] + fv) * WS - camY);
      if (x < -8 || y < -4 || x > W + 8 || y > H + 4) continue;
      const a = ph < .1 ? ph * 10 : ph > .35 ? (.45 - ph) * 10 : 1;
      g.fillStyle = wt === 3 ? 'rgba(150,160,150,' + (a * .35).toFixed(2) + ')' : 'rgba(186,198,194,' + (a * .55).toFixed(2) + ')';
      g.fillRect(x, y, wt === 4 ? 1 : L[k + 4] * WS - 1, wt === 4 ? L[k + 4] * WS - 1 : 1);
    }
  }
  // Mühlrad: Gischt
  const mx = 2534 * WS - camX, my = 1532 * WS - camY;
  if (mx > -40 && my > -40 && mx < W + 40 && my < H + 40){
    g.fillStyle = 'rgba(205,214,210,.7)';
    for (let k = 0; k < 14; k++){ const p = ((tt * 3 + k * .37) % 1); g.fillRect(Math.round(mx - 12 + k * 2 + Math.sin(tt * 9 + k) * 4), Math.round(my + 8 + p * 16), 1, 1 + (k & 1)); }
  }
}

/* ============ Karten ============ */
/* Klassifizierung je Kartenpunkt: Wasser, Weg, Wald, Moor ... */
function wo_mapClass(x, y){
  if (wo_wsd(x, y) < 0) return 'w';
  for (const b of wo_BRIDGES) if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) return 'b';
  if (wo_rsd(x, y) < 2) return wo_RT[wo_gidx(x, y)] === 3 ? 'p' : 'r';
  return ZONES[wo_zid(x, y)].id;
}
const wo_TREEK = { eiche: 1, buche: 1, fichte: 1, schneefichte: 1, birke: 1, weide: 1, apfelbaum: 1, toter_baum: 1, kiefer: 1 };
const wo_BUILDK = { dom: 1, kran: 1, gasthaus_anker: 1, fachwerkhaus: 1, fachwerkhaus_ruine: 1, stadthaus: 1, kirche: 1, kapelle: 1, kloster: 1, muehle: 1, burg_mauer: 1, burg_turm: 1, burg_tor: 1, bergfried: 1, stadt_mauer: 1, stadt_turm: 1, stadt_tor: 1, ruine_mauer: 1, ruine_turm: 1, mauer: 1, zelt: 1, tribuene: 1, gasthaus_kanne: 1, schlosskirche: 1, frauenkirche: 1, fuggerhaus: 1, perlach: 1, gasthaus_schwan: 1, gasthaus_gloecklein: 1, gasthaus_lamm: 1, gasthaus_adler: 1, gasthaus_krone: 1, gasthaus_ochse: 1, goepel: 1 , adler_mauer: 1, adler_turm: 1, adler_vturm: 1, adler_tor: 1, adler_bergfried: 1, lilie_mauer: 1, lilie_turm: 1, lilie_vturm: 1, lilie_tor: 1, lilie_bergfried: 1, loewe_mauer: 1, loewe_turm: 1, loewe_vturm: 1, loewe_tor: 1, loewe_bergfried: 1, turm_mauer: 1, turm_turm: 1, turm_vturm: 1, turm_tor: 1, turm_bergfried: 1, adler_palas: 1, adler_kapelle: 1, lilie_palas: 1, lilie_kapelle: 1, loewe_palas: 1, loewe_kapelle: 1, turm_palas: 1, turm_kapelle: 1 };
const MINIMAP = (() => {
  const MW = WW >> 5, MH = WH >> 5, c = canvasOf(MW, MH), g = c.getContext('2d'), id = g.createImageData(MW, MH), D = new Uint32Array(id.data.buffer);
  const col = { w: '#3c5560', b: '#8a7458', r: '#8a7450', p: '#7a7468', obstgarten: '#5c6a3c', burg: '#5f6840', stadt: '#6a6448', dorf: '#6e6a40', wald: '#2c3a22', moor: '#41452f',
    friedhof: '#46523a', galgen: '#6e6646', schlachtfeld: '#5a4c34', lager: '#66603e', ruine: '#605c4a', fluss: '#566a40', weiler: '#6e6a40',
    speyer: '#6a6448', fischerdorf: '#66684a', weinberge: '#5e6a36', auwald: '#33442a', piratennest: '#5e5440',
    schwarzwald: '#1f2c1a', annaberg: '#6a6448', silberrevier: '#625c4a', schanze: '#5e5640', hochgebirge: '#76767a',
    wittenberg: '#6a6448', heide: '#6a5a4a', nuernberg: '#6a6448', reichswald: '#2e3420', gailingen: '#625c4a', donauried: '#45492f', augsburg: '#6a6448', lechfeld: '#6e6a48',
    adlerhorst: '#6a6448', lilienthal: '#6a6448', loewenburg: '#6a6448', turmfeste: '#6a6448' };
  for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++){
    let k = wo_mapClass(i * 32 + 16, j * 32 + 16);
    let w = 0; for (const [dx, dy] of [[6, 6], [26, 6], [6, 26], [26, 26]]) if (wo_wsd(i * 32 + dx, j * 32 + dy) < 0) w++;
    if (w >= 2) k = 'w';
    let cc = wo_c(col[k] || '#5c6a3c');
    const s = wo_SHD[(j * 4) * wo_SW + i * 4];
    cc = wo_mix(cc, s > 0 ? 0xffd0d8d0 : 0xff101010, Math.min(.25, Math.abs(s) * .1));
    if ((i + j) & 1 && k !== 'w') cc = wo_mix(cc, 0xff000000, .05);
    D[j * MW + i] = cc;
  }
  g.putImageData(id, 0, 0);
  for (const r of wo_ROADS){ g.fillStyle = r.t === 3 ? '#8e887a' : r.t === 2 ? '#6a5a40' : '#9a845a'; for (const [x, y] of r.p) g.fillRect(x / 32 | 0, y / 32 | 0, 1, 1); }
  for (const q of wo_PI){
    const p = q.p;
    if (wo_BUILDK[p.kind]){ g.fillStyle = /mauer|turm|tor|bergfried/.test(p.kind) ? '#a29c8c' : p.kind === 'zelt' ? '#b0a690' : p.kind.includes('ruine') ? '#4a4038' : '#8c4a36'; for (const f of q.feet) g.fillRect(f[0] / 32 | 0, f[1] / 32 | 0, Math.max(1, (f[2] - f[0]) / 32 | 0), Math.max(1, (f[3] - f[1]) / 32 | 0)); }
  }
  for (const b of wo_BRIDGES){ g.fillStyle = '#b09a70'; g.fillRect(b.x0 / 32 | 0, b.y0 / 32 | 0, Math.max(1, (b.x1 - b.x0) / 32 | 0), Math.max(1, (b.y1 - b.y0) / 32 | 0)); }
  return c;
})();

/* Übersichtskarte im Stil einer alten Landkarte (Pergament, Tinte, Baumzeichen, Schraffen) */
const FULLMAP = (() => {
  const MW = WW >> 3, MH = WH >> 3, c = canvasOf(MW, MH), g = c.getContext('2d'), id = g.createImageData(MW, MH), D = new Uint32Array(id.data.buffer);
  const PARCH = wo_ramp(['#8f7a52', '#ad9768', '#c2ad7f', '#d2bf92', '#dccca2'], 10);
  const INK = wo_c('#3b2e20'), INK2 = wo_c('#5a4a34'), WAT = wo_ramp(['#4c6a70', '#6a8a8a', '#88a29c', '#a3b5a8'], 6);
  const GRN = wo_ramp(['#4e5a34', '#68744a', '#848c60', '#a0a477'], 6), BRN = wo_c('#7a4a2e'), RED = wo_c('#8a3a28');
  const cls = new Array(MW * MH);
  for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++){
    const x = i * 8 + 4, y = j * 8 + 4, k = wo_mapClass(x, y); cls[j * MW + i] = k;
    const edge = Math.min(i, j, MW - 1 - i, MH - 1 - j), stain = wo_lo(i * 23, j * 23), fib = wo_fin(i * 3, j * 3);
    let v = 7.2 + (stain - .5) * 3 + (fib - .5) * 1.2 - Math.max(0, (24 - edge) / 24) * 3.2;
    let cc = PARCH[clamp(Math.floor(v + dither(i, j)), 0, 9)];
    if (k === 'wald' || k === 'schwarzwald' || k === 'reichswald') cc = wo_mix(cc, GRN[k === 'wald' ? 3 : 2], .3);
    else if (k === 'heide') cc = wo_mix(cc, wo_c('#9a7a8a'), .18); else if (k === 'donauried') cc = wo_mix(cc, wo_c('#7a7a58'), .3);
    else if (k === 'hochgebirge') cc = wo_mix(cc, wo_hgt(x, y) > 1.05 ? wo_c('#eef0f0') : wo_c('#8a8478'), wo_hgt(x, y) > 1.05 ? .55 : .35);
    else if (k === 'silberrevier') cc = wo_mix(cc, wo_c('#8a8070'), .22); else if (k === 'moor') cc = wo_mix(cc, wo_c('#7a7a58'), .35);
    else if (k === 'schlachtfeld') cc = wo_mix(cc, wo_c('#9a7a58'), .2); else if (k === 'dorf' || k === 'obstgarten' || k === 'fluss') cc = wo_mix(cc, GRN[3], .14);
    const sh = wo_SHD[(j) * wo_SW + i];
    if (k !== 'w' && Math.abs(sh) > .5 && ((i + j * 2) % 4 === 0)) cc = wo_mix(cc, INK2, Math.min(.5, Math.abs(sh) * .22));   // Schraffen am Hang
    D[j * MW + i] = cc;
  }
  // Gewässer: Uferlinie in Tinte, Wellenstriche
  for (let j = 1; j < MH - 1; j++) for (let i = 1; i < MW - 1; i++){
    if (cls[j * MW + i] !== 'w') continue;
    const n = cls[(j - 1) * MW + i] !== 'w' || cls[(j + 1) * MW + i] !== 'w' || cls[j * MW + i - 1] !== 'w' || cls[j * MW + i + 1] !== 'w';
    const dep = -wo_wsd(i * 8 + 4, j * 8 + 4);
    D[j * MW + i] = n ? INK2 : WAT[clamp(4 - (dep / 10 | 0), 1, 4)];
    if (!n && (i + (j % 6 < 3 ? 0 : 3)) % 6 === 0 && j % 3 === 0) D[j * MW + i] = WAT[1];
  }
  // Felder als Streifen
  for (const f of wo_FIELDS) for (let y = f.y0 >> 3; y < f.y1 >> 3; y++) for (let x = f.x0 >> 3; x < f.x1 >> 3; x++){
    const u = f.vert ? x : y;
    D[y * MW + x] = u % 2 ? wo_mix(D[y * MW + x], f.crop === 'burn' ? INK : wo_c('#a08a4a'), .45) : D[y * MW + x];
  }
  // Wege als gestrichelte Doppellinie
  const ink = (x, y, c2) => { if (x >= 0 && y >= 0 && x < MW && y < MH) D[(y | 0) * MW + (x | 0)] = c2; };
  for (const r of wo_ROADS){
    for (let k = 0; k < r.p.length; k++){
      const [x, y] = r.p[k];
      if (r.t === 1 && (k >> 1) % 2) continue;
      const mx = x / 8, my = y / 8;
      ink(mx, my, r.t === 3 ? INK2 : r.t === 2 ? INK : BRN);
    }
  }
  // Baumzeichen
  for (const q of wo_PI){
    const p = q.p;
    if (!wo_TREEK[p.kind] || wo_h(p.x, p.y, 91) > .45) continue;
    const mx = p.x / 8 | 0, my = p.y / 8 | 0, fir = p.kind === 'fichte' || p.kind === 'schneefichte' || p.kind === 'kiefer';
    if (fir){ ink(mx, my - 3, INK); ink(mx - 1, my - 2, GRN[0]); ink(mx, my - 2, GRN[1]); ink(mx + 1, my - 2, GRN[0]); ink(mx - 1, my - 1, GRN[1]); ink(mx, my - 1, GRN[2]); ink(mx + 1, my - 1, GRN[0]); ink(mx, my, INK); }
    else if (p.kind === 'toter_baum'){ ink(mx, my, INK); ink(mx, my - 1, INK); ink(mx - 1, my - 2, INK); ink(mx + 1, my - 2, INK); }
    else { ink(mx - 1, my - 2, GRN[1]); ink(mx, my - 2, GRN[2]); ink(mx + 1, my - 2, GRN[1]); ink(mx - 1, my - 1, GRN[0]); ink(mx, my - 1, GRN[1]); ink(mx + 1, my - 1, GRN[0]); ink(mx, my - 3, GRN[1]); ink(mx, my, INK); if (p.apple) ink(mx + 1, my - 2, RED); }
  }
  // Gebäude als rote Blöcke mit Tintenrand, Mauern grau
  for (const q of wo_PI){
    const p = q.p;
    if (!wo_BUILDK[p.kind]) continue;
    const wall = /mauer|turm|tor|bergfried/.test(p.kind);
    for (const f of q.feet){
      const x0 = f[0] >> 3, y0 = f[1] >> 3, x1 = Math.max(x0 + 1, f[2] >> 3), y1 = Math.max(y0 + 1, f[3] >> 3);
      for (let y = y0 - (wall ? 0 : 1); y <= y1; y++) for (let x = x0; x <= x1; x++){
        const e = x === x0 || x === x1 || y === y1 || y === y0 - (wall ? 0 : 1);
        ink(x, y, e ? INK : wall ? wo_c('#8a8270') : p.kind === 'zelt' ? wo_c('#c8b890') : p.kind.includes('ruine') ? wo_c('#5a4a3a') : RED);
      }
    }
  }
  for (const b of wo_BRIDGES) for (let y = b.y0 >> 3; y <= b.y1 >> 3; y++) for (let x = b.x0 >> 3; x <= b.x1 >> 3; x++) ink(x, y, x === b.x0 >> 3 || x === b.x1 >> 3 || y === b.y0 >> 3 || y === b.y1 >> 3 ? INK : wo_c('#a08a62'));
  // Zeichen: Galgen, gekreuzte Schwerter, Kreuze, Zelte
  const glyph = (cx, cy, rows) => { rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') ink(cx - (row.length >> 1) + i, cy - rows.length + j, INK); else if (row[i] === 'r') ink(cx - (row.length >> 1) + i, cy - rows.length + j, RED); }); };
  glyph(3720 / 8, 1196 / 8, ['#####', '#...#', '#...#', '#...#']);
  glyph(3700 / 8, 2560 / 8, ['#...#', '.#.#.', '..#..', '.#.#.', '#...#']);
  glyph(3500 / 8, 2860 / 8, ['#...#', '.#.#.', '..#..', '.#.#.', '#...#']);
  for (const g2 of wo_GRAVES) if (wo_h(g2.x, g2.y, 5) < .3) glyph(g2.x / 8, g2.y / 8, ['.#.', '###', '.#.']);
  glyph(1900 / 8, 300 / 8, ['.r.', 'rrr', '.#.', '.#.']);
  // Windrose (ohne Schrift)
  const rx = MW - 42, ry = MH - 40;
  for (let k = -12; k <= 12; k++){ ink(rx + k, ry, INK2); ink(rx, ry + k, INK2); }
  for (let k = -6; k <= 6; k++){ ink(rx + k, ry + k, INK2); ink(rx + k, ry - k, INK2); }
  for (let k = 0; k < 10; k++){ ink(rx - 1, ry - 12 + k, INK); ink(rx + 1, ry - 12 + k, INK); }
  ink(rx, ry - 14, INK); ink(rx - 1, ry - 13, INK); ink(rx + 1, ry - 13, INK); ink(rx, ry - 15, RED);
  for (let a = 0; a < 6.283; a += .05){ ink(rx + Math.cos(a) * 7, ry + Math.sin(a) * 7, INK2); }
  // Rahmen: doppelte Linie
  for (let i = 0; i < MW; i++){ for (const y of [3, 6, MH - 4, MH - 7]) ink(i, y, y === 3 || y === MH - 4 ? INK : INK2); }
  for (let j = 0; j < MH; j++){ for (const x of [3, 6, MW - 4, MW - 7]) ink(x, j, x === 3 || x === MW - 4 ? INK : INK2); }
  for (let i = 8; i < MW - 8; i += 8){ ink(i, 4, RED); ink(i, MH - 5, RED); }
  for (let j = 8; j < MH - 8; j += 8){ ink(4, j, RED); ink(MW - 5, j, RED); }
  g.putImageData(id, 0, 0);
  return c;
})();
const MAP_LABELS = ZONES.map(z => ({ x: z.label.x, y: z.label.y, name: z.name })).concat([
  { x: 2470, y: 1640, name: 'Mühle' }, { x: 620, y: 1160, name: 'Köhlerei' }, { x: 1360, y: 2640, name: 'Kloster' }, { x: 2966, y: 1810, name: 'Steinbrücke' },
  { x: 5300, y: 1000, name: 'Dom' }, { x: 5230, y: 1780, name: 'Hafen' }, { x: 5000, y: 1830, name: 'Schiffbrücke' }, { x: 5900, y: 1630, name: 'Zollturm' }, { x: 5300, y: 250, name: 'Wallfahrtskapelle' },
  { x: 1700, y: 4010, name: 'Silberbach' }, { x: 4960, y: 4100, name: 'Quellsee' }, { x: 520, y: 4300, name: 'Teufelsschlucht' }, { x: 940, y: 3520, name: 'Räuberlager' },
  { x: 2300, y: 4470, name: 'Altenberg-Stollen' }, { x: 5720, y: 4200, name: 'Rübezahls Thron' }, { x: 5180, y: 3800, name: 'Almhütte' },
  { x: 8620, y: 1170, name: 'Hünengrab' }, { x: 6560, y: 1590, name: 'Der Furtbach' }, { x: 8740, y: 960, name: 'Die Schwane' }, { x: 8480, y: 2610, name: 'Zeidlerhof' }, { x: 6990, y: 2110, name: 'Krautland' },
  { x: 7620, y: 3000, name: 'Lände an der Silberach' }, { x: 6380, y: 2980, name: 'Silberachquelle' }, { x: 8700, y: 3220, name: 'Die Silberach' }, { x: 7720, y: 4530, name: 'Heidenstein' }
]);

/* Startbereich vorbereiten, damit das erste Bild nicht stockt */
(function wo_warm(){
  const cx = START.x - W / 2, cy = START.y - 22 - H / 2;
  void cx; void cy;   // der Boden entsteht beim ersten Zeichnen in Häppchen (siehe drawGround)
})();
const wo_STARTMS = performance.now() - wo_T0;

/* ============ Ton: Effekte und ein Trauermarsch in d-Moll ============ */
const nf = s => 440 * Math.pow(2, s / 12);
const MELODY = [-7,null,-4,null, 0,null,-2,-4, -5,null,-7,null, null,null,null,null,
                -7,null,-4,0, 1,null,0,-2, -4,-5,-2,-5, -7,null,null,null];
const BASS = [-31,-31,-35,-33,-31,-31,-36,-31];
/* im Gasthaus: ein munterer Tanz in G-Dur */
const INN_MEL = [5,null,2,-2, 0,2,3,0, 2,null,-2,2, 0,null,null,null,
                 5,null,2,-2, 0,2,3,7, 5,2,0,-3, -2,null,null,null];
const INN_BASS = [-26,-19,-26,-19,-26,-21,-19,-26];
/* Weisen: mel Halbtöne über a′ je Achtel (null Pause), bass je Takt (4 Achtel), sp Sekunden je Achtel, w Klang, v Lautstärke, len Tonlänge;
   bw/bv/blen Bass; hat Schellen, drum Trommel, bell Glocke zum Anfang, drone Bordunton; indoor: ohne Jahreszeitenklang */
const TUNES = {
  dunkel: { mel: MELODY, bass: BASS, sp: .27, w: 'triangle', v: .028, len: .3, bell: true },
  land: { sp: .25, w: 'triangle', v: .028, len: .26, bw: 'triangle', bv: .02,
    mel: [-7,-5,-4,-2, 0,null,-2,-4, -5,null,-7,null, -9,null,-7,null, -4,null,0,null, 3,null,0,-2, 0,null,null,null, null,null,null,null,
          0,-2,-4,-5, -7,null,-4,null, -5,-7,-9,-7, -5,null,null,null, -7,-5,-4,0, -2,-4,-5,-9, -7,null,null,null, null,null,null,null],
    bass: [-31,-31,-33,-33,-28,-24,-31,-31, -24,-31,-33,-24,-31,-26,-31,-31] },
  stadt: { sp: .21, w: 'triangle', v: .028, len: .2, drum: true,
    mel: [-2,2,5,null, 3,2,0,-2, 0,null,2,3, 5,null,null,null, 7,5,3,2, 0,2,3,0, -2,null,null,null, null,null,null,null,
          5,null,5,7, 8,7,5,3, 2,null,-2,null, 0,null,null,null, 3,2,0,-2, -4,-2,0,2, -2,null,null,null, null,null,null,null],
    bass: [-26,-26,-21,-19,-21,-19,-26,-26, -19,-28,-26,-19,-21,-28,-26,-26] },
  nacht: { sp: .36, w: 'sine', v: .024, len: .5, bw: 'sine', bv: .02, blen: 1.4,
    mel: [0,null,null,null, 3,null,2,null, 0,null,null,null, -5,null,null,null, -2,null,null,null, 0,null,-2,-4, -5,null,null,null, null,null,null,null],
    bass: [-24,-24,-28,-28,-26,-26,-29,-29] },
  gruft: { sp: .42, w: 'sine', v: .02, len: .7, indoor: true, drone: [-31, -24],
    mel: [null,null,null,null, -4,null,null,null, -5,null,null,null, -11,null,null,null, null,null,null,null, -4,null,-5,null, -7,null,null,null, null,null,null,null] },
  inn: { mel: INN_MEL, bass: INN_BASS, sp: .19, w: 'triangle', v: .03, len: .17, bv: .012, blen: .3, hat: true, indoor: true },
  ballade: { sp: .3, w: 'triangle', v: .03, len: .35, bw: 'triangle', bv: .018, blen: .9, indoor: true,
    mel: [0,null,2,3, 5,null,3,2, 0,null,-2,0, 2,null,null,null, 3,null,2,0, -2,null,-4,-2, 0,null,-5,null, 0,null,null,null],
    bass: [-24,-24,-26,-26,-28,-28,-29,-24] },
  trink: { sp: .17, w: 'square', v: .022, len: .14, bv: .012, blen: .3, hat: true, indoor: true,
    mel: [3,3,7,7, 10,null,7,null, 8,7,5,3, 5,null,null,null, 3,3,7,7, 10,null,15,null, 12,10,8,7, 3,null,null,null],
    bass: [-21,-26,-21,-26,-28,-26,-21,-26] },
  mai: { sp: .18, w: 'triangle', v: .03, len: .16, drum: true, hat: true, indoor: true,
    mel: [-2,2,5,2, 7,5,2,5, 3,0,3,7, 5,null,null,null, 7,9,10,9, 7,5,3,2, 0,2,-2,0, -2,null,null,null],
    bass: [-26,-26,-21,-19,-21,-19,-26,-26] },
  johannis: { sp: .19, w: 'triangle', v: .03, len: .17, drum: true, indoor: true,
    mel: [-7,-7,-4,-7, 0,-4,-7,-4, -2,-2,1,-2, 3,1,-2,1, 0,null,-2,-4, -5,-4,-5,-7, -9,-7,-5,-4, -7,null,null,null],
    bass: [-31,-31,-26,-26,-28,-28,-31,-31] },
  ernte: { sp: .22, w: 'triangle', v: .03, len: .2, drum: true, indoor: true,
    mel: [-4,null,0,3, 5,3,0,null, 1,0,-2,0, -4,null,null,null, 3,null,5,8, 7,5,3,null, 1,3,0,-2, -4,null,null,null],
    bass: [-28,-28,-23,-21,-28,-23,-21,-28] },
  choral: { sp: .5, w: 'sine', v: .026, len: .9, indoor: true, drone: [-31, -24],   // Kirche: Choral im dorischen Ton
    mel: [-7,null,-5,-4, -2,null,-4,null, -5,-7,null,null, -2,null,0,-2, -4,-5,-4,null, -7,null,null,null,
          0,null,2,0, -2,-4,-2,null, -4,-5,null,-7, -7,null,null,null, null,null,null,null] },
  advent: { sp: .3, w: 'sine', v: .032, len: .4, bell: true, bw: 'sine', bv: .02, blen: 1, indoor: true,
    mel: [-2,null,0,2, 3,null,2,null, 0,null,-2,null, 0,null,null,null, 2,null,3,5, 7,null,5,null, 3,2,0,2, -2,null,null,null],
    bass: [-26,-26,-21,-21,-19,-19,-26,-26] }
};
/* welche Weise gerade passt */
function musicFor(){
  if (!G || G.mode === 'title') return 'dunkel';
  if (DG_ON) return 'gruft';
  if (G.inside) return G.inside.church ? 'choral' : G.song && G.song.t > G.t ? G.song.id : 'inn';
  if (G.joust) return 'stadt';
  const f = typeof festNear === 'function' ? festNear() : null;
  if (f) return f.tune;
  if (isNight()) return 'nacht';
  if (EVT.cur && !EVT.cur.over && Math.hypot(G.knight.x - (EVT.cur.pos || EVT.cur.site).x, G.knight.y - (EVT.cur.pos || EVT.cur.site).y) < 1400) return EVT.cur.d.ghost ? 'nacht' : EVT.cur.d.kind === 'escort' && !EVT.cur.halt ? 'stadt' : 'dunkel';
  if (isSafe(G.zone)) return 'stadt';
  if ({ obstgarten: 1, fluss: 1, dorf: 1, lager: 1 }[G.zone]) return 'land';
  return 'dunkel';
}
const Sound = {
  ac:null, on:true, timer:null, step:0, next:0,
  init(){
    if (!this.ac){ try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ return; } }
    if (this.ac.state === 'suspended') this.ac.resume();
  },
  tone(f, d, type = 'square', v = .06, slide = 0, delay = 0){
    if (!this.on || !this.ac) return;
    const t = this.ac.currentTime + delay, o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.ac.destination); o.start(t); o.stop(t + d + .03);
  },
  noise(d, v = .08, lowpass = 0, delay = 0){
    if (!this.on || !this.ac) return;
    const n = Math.floor(this.ac.sampleRate * d), buf = this.ac.createBuffer(1, n, this.ac.sampleRate), data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.6);
    const src = this.ac.createBufferSource(), g = this.ac.createGain();
    src.buffer = buf; g.gain.value = v;
    let node = src;
    if (lowpass){ const f = this.ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass; src.connect(f); node = f; }
    node.connect(g); g.connect(this.ac.destination); src.start(this.ac.currentTime + delay);
  },
  bell(delay = 0){ [196, 392, 523, 784].forEach((f, i) => this.tone(f, 2.4 - i * .4, 'sine', [.05, .025, .015, .01][i], 0, delay)); },
  pick(combo){ const b = 520 * Math.pow(2, (Math.min(combo, 5) - 1) * 2 / 12); this.tone(b, .07, 'square', .04); this.tone(b * 1.5, .1, 'square', .035, 0, .055); },
  gold(){ [587, 740, 880, 1175].forEach((f, i) => this.tone(f, .14, 'square', .04, 0, i * .06)); },
  orb(){ [294, 440, 587, 880, 1175].forEach((f, i) => this.tone(f, .3, 'triangle', .07, 0, i * .09)); this.bell(.45); },
  swing(){ this.noise(.07, .05, 3000); this.tone(700, .07, 'square', .015, -450); },
  hit(){ this.tone(170, .09, 'square', .06, -90); this.noise(.06, .06, 1200); },
  kill(){ this.tone(260, .25, 'triangle', .07, -200); this.noise(.12, .05, 900); },
  splat(){ this.noise(.1, .07, 600); this.tone(120, .1, 'triangle', .05, -40); },
  hurt(){ this.tone(220, .32, 'sawtooth', .06, -160); this.noise(.18, .08, 1500); },
  caw(){ this.tone(560, .1, 'sawtooth', .022, -240); this.tone(500, .12, 'sawtooth', .022, -240, .14); },
  howl(){ this.tone(330, .7, 'triangle', .05, 220); this.tone(550, .4, 'triangle', .03, -150, .65); },
  rise(){ this.noise(.45, .05, 400); this.tone(80, .45, 'sawtooth', .03, 40); },
  drop(){ this.tone(230, .05, 'triangle', .04, -100); },
  rot(){ this.tone(120, .14, 'triangle', .035, -40); },
  horn(){ this.tone(110, .7, 'sawtooth', .045, 0); this.tone(165, .9, 'sawtooth', .035, 0, .35); },
  cheer(v = 1){ for (let i = 0; i < 6; i++) this.noise(.45 + Math.random() * .4, .03 * v, 1200 + Math.random() * 1200, i * .08); [392, 494, 587, 523].forEach((f, i) => this.tone(f + Math.random() * 40, .28, 'triangle', .011 * v, 50, .08 + i * .11)); },
  thunder(){ this.noise(1.6, .22, 380); this.noise(.25, .12, 2500); },
  squeak(){ this.tone(1800, .05, 'square', .02, 400); this.tone(2100, .05, 'square', .02, 300, .08); },
  bolt(){ this.tone(900, .08, 'triangle', .05, -600); this.noise(.05, .04, 3000); },
  gun(){ this.noise(.28, .12, 900); this.tone(70, .3, 'square', .06, -30); this.noise(.5, .03, 400, .1); },
  parry(){ this.tone(1400, .12, 'square', .04, -200); this.tone(2100, .1, 'triangle', .03, 0, .02); },
  fire(){ this.noise(.5, .1, 900); this.tone(140, .4, 'sawtooth', .03, -60); },
  scythe(){ this.noise(.2, .08, 2400); this.tone(300, .25, 'sawtooth', .03, -200); },
  levelUp(){ [392, 494, 587, 784].forEach((f, i) => this.tone(f, .22, 'square', .045, 0, i * .1)); this.bell(.4); },
  choose(){ this.tone(587, .1, 'square', .04); this.tone(880, .18, 'square', .04, 0, .08); },
  over(){ this.stopMusic(); [294, 262, 233, 220, 147].forEach((f, i) => this.tone(f, .4, 'triangle', .08, 0, i * .26)); this.bell(1.3); },
  startMusic(){
    if (!this.ac || this.timer || !this.on) return;
    this.next = this.ac.currentTime + .08;
    this.timer = setInterval(() => this.schedule(), 60);
  },
  stopMusic(){ clearInterval(this.timer); this.timer = null; },
  tune:'dunkel', pend:null,
  // neue Weise erst am Taktanfang (sofort, wenn keine läuft)
  setTune(t, now){ if (!TUNES[t] || (this.tune === t && !this.pend) || this.pend === t) return; if (!this.timer || now){ this.tune = t; this.step = 0; this.pend = null; } else this.pend = t; },
  schedule(){
    if (this.pend && this.step % 8 === 0){ this.tune = this.pend; this.pend = null; this.step = 0; }
    const T = TUNES[this.tune] || TUNES.dunkel, sea = !T.indoor && typeof SEA !== 'undefined' ? SEA.cur : 1;
    const sp = T.sp * (sea === 3 ? 1.12 : sea === 2 ? 1.05 : 1);
    while (this.next < this.ac.currentTime + .25){
      const n = T.mel.length, i = this.step % n, m = T.mel[i], d = this.next - this.ac.currentTime;
      if (m !== null){
        this.tone(nf(m), T.len, sea === 3 ? 'sine' : T.w, T.v * (sea === 3 ? 1.2 : 1), 0, d);
        if (sea === 3) this.tone(nf(m + 12), T.len * 1.6, 'sine', T.v * .25, 0, d);                    // Winter: Glockenklang
        else if (sea === 0 && i % 2 === 0) this.tone(nf(m + 12), T.len * .8, 'sine', T.v * .3, 0, d);   // Frühling: Flöte
      }
      if (T.bass && i % 4 === 0){ const b = T.bass[(i >> 2) % T.bass.length]; if (b !== null) this.tone(nf(b), T.blen || .9, T.bw || 'square', T.bv || .012, 0, d); }
      if (T.hat && i % 2 === 1) this.noise(.03, .018, 2600, d);
      if (T.drum && i % 4 === 0){ this.noise(.08, .045, 380, d); this.tone(72, .12, 'sine', .035, -20, d); }
      if (T.drum && i % 4 === 2) this.noise(.04, .02, 1800, d);
      if (T.drone && i % 16 === 0) for (const dn of T.drone) this.tone(nf(dn), sp * 15, 'sine', .014, 0, d);
      if (T.bell && i === 0 && this.step % (n * 2) === 0) this.bell(d);
      this.next += sp; this.step++;
    }
  }
};



/* Tierlaute, Vogelsang und Glocken; k = Lautstärke nach Entfernung 0..1 */
Object.assign(Sound, {
  cluck(k){ for (let i = 0; i < 3; i++) this.tone(620 + Math.random() * 80, .05, 'square', .012 * k, -160, i * .09); },
  crow(k){ this.tone(700, .16, 'sawtooth', .014 * k, 300); this.tone(1000, .22, 'sawtooth', .014 * k, -200, .17); this.tone(820, .4, 'sawtooth', .012 * k, -380, .4); },
  moo(k){ this.tone(140, .9, 'sawtooth', .02 * k, -30); this.tone(146, .9, 'triangle', .02 * k, -40); },
  baa(k){ for (let i = 0; i < 5; i++) this.tone(420 - i * 6, .07, 'sawtooth', .012 * k, 30, i * .07); },
  oink(k){ this.tone(190, .12, 'sawtooth', .02 * k, -60); this.noise(.1, .02 * k, 700, .02); this.tone(170, .1, 'sawtooth', .016 * k, -50, .16); },
  quack(k){ this.tone(330, .09, 'sawtooth', .016 * k, -120); this.tone(320, .1, 'sawtooth', .014 * k, -120, .13); },
  honk(k){ this.tone(440, .14, 'square', .012 * k, -80); this.tone(400, .16, 'square', .01 * k, -60, .18); },
  bark(k){ this.tone(300, .07, 'square', .02 * k, -140); this.noise(.06, .03 * k, 1400); this.tone(280, .07, 'square', .018 * k, -130, .16); this.noise(.06, .025 * k, 1400, .16); },
  meow(k){ this.tone(600, .3, 'triangle', .016 * k, 300); this.tone(900, .25, 'triangle', .012 * k, -350, .25); },
  bleat(k){ for (let i = 0; i < 4; i++) this.tone(520, .06, 'sawtooth', .01 * k, -20, i * .06); },
  neigh(k){ for (let i = 0; i < 6; i++) this.tone(700 - i * 50, .08, 'sawtooth', .012 * k, 60, i * .07); },
  chirp(k){
    const b = 2600 + Math.random() * 1400, n = 2 + (Math.random() * 4 | 0);
    for (let i = 0; i < n; i++) this.tone(b + (i & 1 ? 500 : 0), .06, 'sine', .012 * k, i & 1 ? -800 : 600, i * .09);
  },
  coo(k){ this.tone(330, .25, 'sine', .016 * k, -40); this.tone(300, .35, 'sine', .014 * k, -30, .3); },
  croak(k){ this.tone(160, .12, 'square', .014 * k, -40); this.noise(.08, .02 * k, 600, .02); this.tone(150, .12, 'square', .012 * k, -40, .2); },
  flap(k){ for (let i = 0; i < 4; i++) this.noise(.05, .03 * k, 900, i * .07); },
  chime(){ [262, 523, 659, 784].forEach((f, i) => this.tone(f, 2.8 - i * .5, 'sine', [.03, .015, .009, .006][i])); [196, 392].forEach((f, i) => this.tone(f, 2.8, 'sine', [.025, .01][i], 0, 1.4)); }
});

/* Regen als Dauerrauschen, Grillen, Käuzchen */
Object.assign(Sound, {
  rainSrc: null, rainGain: null, rainV: 0,
  setRain(v){
    if (!this.ac || !this.on) v = 0;
    if (Math.abs(v - this.rainV) < .02 && (this.rainSrc || v === 0)) return;
    this.rainV = v;
    if (!this.ac) return;
    if (!this.rainSrc && v > 0){
      const n = this.ac.sampleRate * 2, buf = this.ac.createBuffer(1, n, this.ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
      src.buffer = buf; src.loop = true; f.type = 'lowpass'; f.frequency.value = 1400; g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(this.ac.destination); src.start();
      this.rainSrc = src; this.rainGain = g;
    }
    if (this.rainGain) this.rainGain.gain.setTargetAtTime(v * .045, this.ac.currentTime, .8);
  },
  charge(){ this.tone(196, .14, 'sawtooth', .035, 90); this.tone(262, .22, 'sawtooth', .03, 0, .12); this.noise(.35, .05, 600); },
  cricket(k){ for (let i = 0; i < 3; i++) this.tone(4300 + Math.random() * 200, .03, 'sine', .006 * k, 0, i * .05); },
  owl(k){ this.tone(380, .3, 'sine', .02 * k, -30); this.tone(360, .55, 'sine', .018 * k, -50, .45); }
});
