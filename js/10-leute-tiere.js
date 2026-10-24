"use strict";
/* Der Apfelritter, Teil 10 von 27: Leute in Burg und Stadt, Tiere, Leute unterwegs.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Leute in Burg und Stadt (von vorn, Atmen in zwei Bildern) ============ */
const NP_BASE = {
  K:'#22252b', D:'#434952', M:'#6c747e', L:'#98a1ab', H:'#c5ccd3', G:'#eef1f3',
  s:'#6e4630', t:'#a0694a', u:'#cf9a74', v:'#ecc4a0', e:'#141217',
  w:'#8a8478', x:'#c8c2b0', z:'#f2eee0', N:'#3a2416', n:'#61402a', b:'#8c6340', B:'#b08454',
  a:'#9c7a32', A:'#e0c271', f:'#5a4030', F:'#8a6a4a', W:'#4a3020', X:'#7a5634', h:'#3a2414', j:'#5a3a20'
};
function np_figure(o){
  const Wd = 23, Ht = 47, cx = 11, g = Array.from({ length: Ht }, () => Array(Wd).fill('.'));
  const px = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (c && x >= 0 && y >= 0 && x < Wd && y < Ht) g[y][x] = c; };
  const tone = (x, x0, x1, ramp, lift) => { const t = (x - x0 + .5) / (x1 - x0 + 1), nx = 2 * t - 1, l = -nx * .55 + Math.sqrt(Math.max(0, 1 - nx * nx)) * .75 + (lift || 0); return ramp[l > .86 ? 3 : l > .45 ? 2 : l > .05 ? 1 : 0]; };
  const band = (y, x0, x1, ramp, lift) => { for (let x = x0; x <= x1; x++) px(x, y, tone(x, x0, x1, ramp, lift)); };
  const C1 = ['1', '2', '3', '4'], C2 = ['5', '6', '7', '8'], SK = ['s', 't', 'u', 'v'], LN = ['w', 'x', 'x', 'z'], LE = ['N', 'n', 'b', 'B'], IR = ['D', 'M', 'L', 'H'];
  const long = o.robe === 'long', hem = long ? 43 : 33, back = !!o.back, sd = back ? -1 : 1;   // sd: Seite der getragenen Dinge
  // Schritt (0 Stand, 1 linker Fuß gehoben, 3 rechter Fuß gehoben) und Armschwung
  const lu = o.step === 1 ? 1 : 0, ru = o.step === 3 ? 1 : 0, sw = o.step === 1 ? -1 : o.step === 3 ? 1 : 0;
  // Beine und Schuhe
  if (long){ band(44 - lu, cx - 5, cx - 1, LE); band(44 - ru, cx + 1, cx + 5, LE); if (!lu) band(45, cx - 5, cx - 1, ['N', 'N', 'n', 'n']); if (!ru) band(45, cx + 1, cx + 5, ['N', 'N', 'n', 'n']); }
  else {
    for (let y = 34; y <= 42; y++){ if (y <= 42 - lu) band(y, cx - 4, cx - 1, C2); if (y <= 42 - ru) band(y, cx + 1, cx + 4, C2); }
    for (let y = 43; y <= 45; y++){ band(y - lu, cx - 5, cx - 1, LE); band(y - ru, cx + 1, cx + 5, LE); }
  }
  // Rumpf und Rock
  for (let y = 17; y <= hem; y++){
    const t = (y - 17) / Math.max(1, hem - 17), half = Math.round(5 + t * (long ? 2.6 : 1.2));
    band(y, cx - half, cx + half, C1, y < 20 ? .15 : 0);
  }
  if (!long) for (let x = cx - 6; x <= cx + 6; x++) px(x, 33, (x & 1) ? '1' : '2');
  // Gürtel
  if (o.belt){ for (let x = cx - 6; x <= cx + 6; x++) px(x, 27, x === cx && !back ? 'A' : (x < cx - 3 ? 'N' : 'n')); }
  if (o.rope){ for (let x = cx - 6; x <= cx + 6; x++) px(x, 27, (x & 1) ? 'x' : 'w'); if (!back){ px(cx - 2, 28, 'x'); px(cx - 2, 29, 'w'); px(cx - 2, 30, 'x'); } }
  // Schürze (von hinten nur die Bänder)
  if (o.apron && !back){ const ap = o.apron === 'leather' ? LE : LN; for (let y = 24; y <= hem - 2; y++){ const hw = y < 27 ? 3 : 4; band(y, cx - hw, cx + hw, ap, .1); } for (let x = cx - 5; x <= cx + 5; x++) px(x, 24, o.apron === 'leather' ? 'N' : 'w'); }
  if (o.apron && back){ for (let x = cx - 6; x <= cx + 6; x++) px(x, 25, o.apron === 'leather' ? 'N' : 'w'); px(cx - 1, 26, 'x'); px(cx + 1, 26, 'x'); px(cx - 1, 27, 'w'); px(cx + 1, 28, 'w'); }
  // Pelzkragen und Saum (Schaube)
  if (o.fur){
    for (let y = 17; y <= 21; y++){ const hw = 6 - (y > 19 ? 1 : 0); for (let x = cx - hw; x <= cx + hw; x++) if (back || Math.abs(x - cx) > 1 || y > 20) px(x, y, ((x + y) & 1) ? 'F' : 'f'); }
    if (!back) for (let y = 22; y <= hem; y++){ px(cx - 1, y, (y & 1) ? 'F' : 'f'); px(cx + 1, y, (y & 1) ? 'f' : 'F'); px(cx, y, '1'); }
  }
  // Mantel des Pilgers mit Kragen
  if (o.cape){ for (let y = 17; y <= 24; y++){ const hw = 6 + (y > 20 ? 1 : 0); band(y, cx - hw, cx + hw, C2, .1); } }
  // Amtskette
  if (o.chain && !back){ for (let k = 0; k <= 5; k++){ px(cx - 4 + k * .6, 18 + k, k & 1 ? 'a' : 'A'); px(cx + 4 - k * .6, 18 + k, k & 1 ? 'A' : 'a'); } px(cx, 24, 'A'); px(cx, 25, 'a'); }
  // Brustplatte (Vogt, Wachen)
  if (o.plate){ for (let y = 18; y <= 26; y++){ const hw = y < 25 ? 4 : 3; band(y, cx - hw, cx + hw, IR, .2); } }
  // Arme mit Ärmeln, Hände (schwingen beim Gehen)
  const sl = o.sleeve || C1;
  for (let y = 18; y <= 29; y++){ px(cx - 7, y + (y > 26 ? sw : 0), sl[1]); px(cx - 6, y + (y > 26 ? sw : 0), sl[2]); px(cx + 6, y - (y > 26 ? sw : 0), sl[1]); px(cx + 7, y - (y > 26 ? sw : 0), sl[0]); }
  px(cx - 7, 30 + sw, 'u'); px(cx - 6, 30 + sw, 'v'); px(cx - 7, 31 + sw, 't'); px(cx - 6, 31 + sw, 'u');
  px(cx + 6, 30 - sw, 'u'); px(cx + 7, 30 - sw, 't'); px(cx + 6, 31 - sw, 't'); px(cx + 7, 31 - sw, 's');
  // Hals und Kopf
  px(cx - 1, 16, 't'); px(cx, 16, 'u'); px(cx + 1, 16, 's');
  for (const [y, hw] of [[7, 2], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 2], [15, 1]]) band(y, cx - hw, cx + hw, SK, .12);
  const hair = o.hair || ['h', 'j'];
  if (back){
    // Hinterkopf: Haar (Glatze mit Kranz beim Mönch)
    for (const [y, hw] of [[7, 2], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 2]]) for (let x = cx - hw; x <= cx + hw; x++) px(x, y, (x + y) & 1 ? hair[0] : hair[1]);
    if (o.bald) for (const [y, hw] of [[7, 2], [8, 2], [9, 1]]) for (let x = cx - hw; x <= cx + hw; x++) px(x, y, x < cx ? 'u' : 'v');
  } else {
    if (o.hairSide){ for (let y = 8; y <= 12; y++){ px(cx - 3, y, hair[0]); px(cx + 3, y, hair[0]); } }
    if (o.bald){ for (const x of [-3, 3]) for (let y = 9; y <= 11; y++) px(cx + x, y, hair[0]); }
    else if (o.hairTop !== false){ for (let x = cx - 2; x <= cx + 2; x++) px(x, 7, hair[(x & 1)]); px(cx - 3, 8, hair[0]); px(cx + 3, 8, hair[0]); }
    px(cx - 2, 10, 'e'); px(cx + 2, 10, 'e'); px(cx - 2, 9, hair[1]); px(cx + 2, 9, hair[1]);
    px(cx, 11, 't'); px(cx, 12, 't'); px(cx - 1, 14, 's'); px(cx, 14, 's'); px(cx + 1, 14, 's');
    if (o.beard){ for (const [y, x0, x1] of [[12, -3, -2], [12, 2, 3], [13, -3, -1], [13, 1, 3], [14, -2, -2], [14, 2, 2], [15, -2, 2], [16, -1, 1]]) for (let x = x0; x <= x1; x++) px(cx + x, y, (x + y) & 1 ? hair[0] : hair[1]); px(cx - 1, 14, 's'); px(cx, 14, 's'); px(cx + 1, 14, 's'); }
  }
  // Schembartmaske: helles Larvengesicht mit dunklen Augen, roten Wangen und gemaltem Bart
  if (o.mask && !back){
    for (const [y, hw] of [[8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 2]]) band(y, cx - hw, cx + hw, ['x', 'z', 'z', 'z'], .1);
    px(cx - 2, 10, 'e'); px(cx + 2, 10, 'e'); px(cx - 2, 12, 'R'); px(cx + 2, 12, 'R'); px(cx - 1, 13, 'N'); px(cx, 13, 'N'); px(cx + 1, 13, 'N'); px(cx, 11, 'x');
    for (const [y, x0, x1] of [[14, -3, -2], [14, 2, 3], [15, -2, 2], [16, -1, 1]]) for (let x = x0; x <= x1; x++) px(cx + x, y, 'N');
  }
  // Kopfbedeckung
  if (o.hat === 'narr'){   // Narrenkappe: zwei Zipfel mit Schellen, Zackenkragen
    for (const [y, hw] of [[5, 3], [6, 4], [7, 5]]) band(y, cx - hw, cx + hw, C2, .2);
    for (let k = 0; k < 4; k++){ px(cx - 4 - k, 4 - k, k & 1 ? '6' : '7'); px(cx - 3 - k, 4 - k, '6'); px(cx + 4 + k, 4 - k, k & 1 ? '2' : '3'); px(cx + 3 + k, 4 - k, '2'); }
    px(cx - 8, 0, 'A'); px(cx + 8, 0, 'A'); px(cx - 7, 0, 'a'); px(cx + 7, 0, 'a');
    for (let y = 8; y <= 15; y++){ px(cx - 4, y, '6'); px(cx + 4, y, '2'); }
    if (back) for (let y = 8; y <= 16; y++) band(y, cx - 4, cx + 4, C2, .15);
    for (let x = cx - 6; x <= cx + 6; x++) px(x, 17, (x & 1) ? 'A' : (x < cx ? '7' : '3'));
  } else if (o.hat === 'eisenhut'){
    for (const [y, hw] of [[3, 2], [4, 3], [5, 4], [6, 4]]) band(y, cx - hw, cx + hw, IR, .25);
    band(7, cx - 6, cx + 6, ['K', 'D', 'M', 'L']); band(8, cx - 5, cx + 5, ['K', 'K', 'D', 'D']);
  } else if (o.hat === 'barett'){
    for (const [y, x0, x1] of [[4, -4, 4], [5, -6, 6], [6, -7, 7], [7, -6, 6]]) band(y, cx + x0, cx + x1, ['5', '6', '7', '8'], .1);
    for (let x = cx - 5; x <= cx + 5; x += 2) px(x, 6, '8');
    px(cx + 5, 3, 'z'); px(cx + 6, 2, 'z'); px(cx + 7, 1, 'x');
  } else if (o.hat === 'haube'){
    for (const [y, hw] of [[5, 3], [6, 4], [7, 4]]) band(y, cx - hw, cx + hw, LN, .2);
    for (let y = 8; y <= 15; y++){ px(cx - 4, y, 'x'); px(cx + 4, y, 'w'); }
    band(16, cx - 3, cx + 3, LN);
    if (back) for (let y = 8; y <= 14; y++) band(y, cx - 4, cx + 4, LN, .1);
  } else if (o.hat === 'tuch'){
    for (const [y, hw] of [[5, 3], [6, 4], [7, 4], [8, 4]]) band(y, cx - hw, cx + hw, C2, .2);
    for (let y = 9; y <= 12; y++){ px(cx - 4, y, '6'); px(cx + 4, y, '5'); }
    if (back) for (let y = 9; y <= 15; y++) band(y, cx - 4, cx + 4, C2, .1);
  } else if (o.hat === 'filz'){
    for (const [y, hw] of [[3, 3], [4, 3], [5, 3]]) band(y, cx - hw, cx + hw, ['W', 'X', 'X', 'b'], .1);
    band(6, cx - 7, cx + 7, ['W', 'W', 'X', 'X']); px(cx - 3, 5, 'R');
  } else if (o.hat === 'pilger'){
    for (const [y, hw] of [[3, 3], [4, 4], [5, 4]]) band(y, cx - hw, cx + hw, ['W', 'X', 'X', 'b'], .1);
    band(6, cx - 9, cx + 9, ['W', 'W', 'X', 'b']); if (!back){ px(cx, 4, 'z'); px(cx - 1, 5, 'x'); px(cx + 1, 5, 'x'); }
  } else if (o.hat === 'kapuze'){
    for (const [y, hw] of [[4, 3], [5, 4], [6, 5], [7, 5]]) band(y, cx - hw, cx + hw, C1, .2);
    for (let y = 8; y <= 16; y++){ band(y, cx - 5, cx - 4, C1); band(y, cx + 4, cx + 5, C1); }
    band(16, cx - 5, cx + 5, C1, .1);
    if (back) for (let y = 8; y <= 17; y++) band(y, cx - 5, cx + 5, C1, .15);
  }
  // Mi-parti: Rock rechts in der zweiten Farbe, Beine gegengewechselt
  if (o.parti) for (let y = 16; y < Ht; y++) for (let x = 0; x < Wd; x++){
    const ch = g[y][x], i = '1234'.indexOf(ch), j = '5678'.indexOf(ch);
    if (y <= 33 && (x - cx) * sd > 0 && i >= 0) g[y][x] = '5678'[i];
    else if (y > 33 && (x - cx) * sd > 0 && j >= 0) g[y][x] = '1234'[j];
  }
  // Laute vor dem Bauch, Hals nach rechts oben
  if (o.lute && !back){
    for (let y = 22; y <= 31; y++) for (let x = cx - 7; x <= cx + 2; x++){
      const u = (x + .5 - (cx - 2.5)) / 4.6, v = (y + .5 - 27) / 4.2;
      if (u * u + v * v > 1) continue;
      px(x, y, u * u + v * v > .7 ? 'W' : u < -.2 ? 'B' : 'X');
    }
    px(cx - 3, 26, 'N'); px(cx - 2, 26, 'N'); px(cx - 3, 27, 'N');
    for (let k = 0; k <= 6; k++) px(cx + 1 + k, 24 - k, k & 1 ? 'X' : 'B');
    px(cx + 8, 17, 'W'); px(cx + 8, 16, 'W'); px(cx + 7, 16, 'N');
  }
  // Tragen: Korb am Arm, Sack auf dem Rücken, Eimer
  const X = d => cx + sd * d;
  if (o.carry === 'korb'){ for (let y = 29; y <= 33; y++) for (let d = 6; d <= 10; d++) px(X(d), y - sw * sd, y === 29 ? 'B' : ((d + y) & 1) ? 'b' : 'n'); px(X(7), 28 - sw * sd, 'b'); px(X(9), 28 - sw * sd, 'b'); px(X(8), 27 - sw * sd, 'b'); }
  if (o.carry === 'sack' && back){ for (let y = 15; y <= 25; y++){ const hw = y < 17 ? 3 : 4; band(y, cx - hw, cx + hw, LN, .1); } px(cx, 14, 'w'); }
  if (o.carry === 'eimer'){ for (let y = 30; y <= 34; y++) for (let d = 7; d <= 11; d++) px(X(-d), y + sw * sd, y === 30 ? 'D' : d === 11 ? 'W' : (d & 1 ? 'X' : 'b')); px(X(-9), 29 + sw * sd, 'D'); }
  // Hellebarde, Stab oder Hacke
  if (o.halberd){
    for (let y = 1; y <= 45; y++) px(X(9), y, y & 1 ? 'W' : 'X');
    for (const [x, y, c] of [[9, 0, 'H'], [9, 1, 'L'], [10, 2, 'L'], [10, 3, 'M'], [10, 4, 'H'], [10, 5, 'L'], [8, 3, 'M'], [8, 4, 'L'], [7, 4, 'D'], [8, 5, 'M']]) px(X(x), y, c);
    px(X(8), 30, 'u'); px(X(8), 31, 't');
  }
  if (o.staff){ for (let y = 5; y <= 45; y++) px(X(9), y, y & 1 ? 'W' : 'X'); px(X(9), 4, 'b'); if (o.hat === 'pilger') px(X(9), 8, 'z'); px(X(8), 30, 'u'); px(X(8), 31, 't'); }
  if (o.hoe){ for (let y = 2; y <= 44; y++) px(X(9), y, y & 1 ? 'W' : 'X'); for (const [x, y] of [[10, 2], [11, 2], [10, 3], [11, 3], [11, 4]]) px(X(x), y, 'M'); px(X(8), 30, 'u'); }
  return g;
}
function np_frames(o, pal){
  const g = np_figure(o), P = Object.assign({}, NP_BASE, pal), rows = g.map(r => r.join(''));
  const f0 = makeSprite(rows, P, OUT);
  const breath = ['.'.repeat(rows[0].length)].concat(rows.slice(0, 30), rows.slice(31));
  const f1 = makeSprite(breath, P, OUT);
  return { frames: [f0, f1], ax: 12, ay: 47 };
}
const NPC_ART = {
  vogt: np_frames({ robe:'short', hat:'eisenhut', beard:true, hair:['w', 'x'], belt:true, plate:true, halberd:true },
    { 1:'#4a0e12', 2:'#7a1a1e', 3:'#a42a2a', 4:'#c84a40', 5:'#1c1a20', 6:'#2c2a32', 7:'#3e3a44', 8:'#56505c', R:'#b8281e' }),
  kraemerin: np_frames({ robe:'long', hat:'haube', apron:'linen', belt:false },
    { 1:'#2e3a1c', 2:'#46562a', 3:'#5e7038', 4:'#7c8c4c', 5:'#3a2c1e', 6:'#4a3a28', 7:'#5a4a34', 8:'#6e5c44' }),
  buerger: np_frames({ robe:'long', hat:'barett', beard:true, hair:['h', 'j'], fur:true, chain:true },
    { 1:'#141218', 2:'#221e28', 3:'#322c3a', 4:'#463e50', 5:'#141218', 6:'#241e2a', 7:'#3a3040', 8:'#504658' }),
  kraemer: np_frames({ robe:'short', hat:'filz', hairSide:true, apron:'leather', belt:true, sleeve:['5', '6', '7', '8'] },
    { 1:'#1e3a2e', 2:'#2c5440', 3:'#3e6e52', 4:'#5a8a68', 5:'#4a2a18', 6:'#6a3e22', 7:'#8a5630', 8:'#a87040', R:'#b8281e' })
};

/* ============ Tiere: Hof, Wald, Wasser und Luft (Figurenmaßstab, Blick nach rechts) ============
   Vierbeiner prozedural: Fell in vier Tönen 1 2 3 4 (dunkel .. hell), Abzeichen 5 6 7 8, Auge e, Huf h, Nase n,
   Horn und Geweih k, Schwanz und Mähne m, Euter u, Weiß w. Bilder: Gang 0..3, Stand 4, Grasen 5, Flucht 6 und 7. */
const tr_grid = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
function tr_px(g, x, y, c){ x = Math.round(x); y = Math.round(y); if (c && y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
const tr_tone = v => '1234'[clamp(Math.floor(v * 4), 0, 3)];
function tr_ell(g, cx, cy, rx, ry, lit, R){
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++){
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, q = nx * nx + ny * ny;
    if (q > 1) continue;
    const v = .64 - ny * .36 - nx * .12 - q * .16 + (lit || 0);
    tr_px(g, x, y, R ? R[clamp(Math.floor(v * 4), 0, 3)] : tr_tone(v));
  }
}
function tr_thick(g, x0, y0, x1, y1, w0, w1, chf){
  const L = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.ceil(L * 2.5);
  for (let i = 0; i <= n; i++){
    const t = i / n, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t, r = (w0 + (w1 - w0) * t) / 2;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++){
      const dx = x + .5 - cx, dy = y + .5 - cy;
      if (dx * dx + dy * dy > r * r) continue;
      tr_px(g, x, y, typeof chf === 'function' ? chf(t, dx / r, dy / r) : chf);
    }
  }
}
const tr_coat = (lit, R) => (t, qx, qy) => { const v = .6 - qy * .3 - qx * .18 + (lit || 0); return R ? R[clamp(Math.floor(v * 4), 0, 3)] : tr_tone(v); };
/* Bein: oben (x, top), unten mit Schwung sw und Heben lift; Huf zwei Zeilen */
function tr_leg(g, x, top, gy, w0, w1, sw, lift, far, hoof, R){
  const bx = x + sw, by = gy - 2 - lift;
  tr_thick(g, x, top, bx, by, w0, w1, (t, qx) => { const v = .5 - qx * .22 - t * .16 - (far ? .3 : 0); return R ? R[clamp(Math.floor(v * 4), 0, 3)] : tr_tone(v); });
  if (hoof) for (let i = 0; i < Math.max(2, Math.round(w1)); i++){ tr_px(g, bx - (w1 > 2 ? 1 : 0) + i, gy - 1 - lift, hoof); tr_px(g, bx - (w1 > 2 ? 1 : 0) + i, gy - lift, hoof); }
}
/* Beinstellungen je Bild: [Schwung, Heben] für nah vorn, fern vorn, nah hinten, fern hinten */
const TR_GAIT = [
  [[2, 0], [-2, 0], [-2, 0], [2, 0]], [[1, 1], [0, 0], [0, 0], [1, 1]], [[-2, 0], [2, 0], [2, 0], [-2, 0]], [[0, 0], [1, 1], [1, 1], [0, 0]],
  [[0, 0], [0, 0], [0, 0], [0, 0]], [[0, 0], [0, 0], [0, 0], [0, 0]], [[4, 2], [3, 1], [-4, 1], [-3, 0]], [[-1, 0], [0, 1], [2, 1], [1, 0]]
];
/* Vierbeiner nach Bauplan S, Bild f */
function tr_quad(S, f){
  const g = tr_grid(S.W, S.H), gy = S.H - 1, G = TR_GAIT[f], graze = f === 5, run = f >= 6;
  const L = S.legs;   // [x nah vorn, x fern vorn, x nah hinten, x fern hinten, Oberkante]
  const lean = run ? (f === 6 ? -1 : 1) : 0;
  // ferne Beine, Schwanz
  tr_leg(g, L[1], L[4] + lean, gy, S.lw[0], S.lw[1], G[1][0] * (S.stride || 1), G[1][1], true, S.hoof);
  tr_leg(g, L[3], L[4] - lean, gy, S.lw[0], S.lw[1], G[3][0] * (S.stride || 1), G[3][1], true, S.hoof);
  if (S.tail) S.tail(g, f);
  // Leib
  for (const e of S.body) tr_ell(g, e[0], e[1] + (e[0] > S.W / 2 ? lean : -lean) * .5, e[2], e[3], e[4] || 0, S.bodyR);
  // Hals und Kopf
  const H = graze ? S.graze : S.head;
  if (H.neck) tr_thick(g, H.neck[0], H.neck[1], H.neck[2], H.neck[3], H.neck[4], H.neck[5], tr_coat(.04));
  if (H.ell) tr_ell(g, H.ell[0], H.ell[1], H.ell[2], H.ell[3], .06);
  if (H.snout) tr_thick(g, H.snout[0], H.snout[1], H.snout[2], H.snout[3], H.snout[4], H.snout[5], (t, qx, qy) => S.snoutC ? S.snoutC(t, qx, qy) : tr_tone(.62 - qy * .3 - t * .12));
  if (H.px) for (const [x, y, c] of H.px) tr_px(g, x, y, c);
  // nahe Beine
  tr_leg(g, L[0], L[4] + lean, gy, S.lw[0], S.lw[1], G[0][0] * (S.stride || 1), G[0][1], false, S.hoof);
  tr_leg(g, L[2], L[4] - lean, gy, S.lw[0], S.lw[1], G[2][0] * (S.stride || 1), G[2][1], false, S.hoof);
  if (S.after) S.after(g, f, graze);
  return g;
}
/* Abzeichen: Felltöne an Flecken durch die Abzeichenfarbe ersetzen */
function tr_patch(g, seed, k, x0, x1){
  for (let y = 0; y < g.length; y++) for (let x = x0 || 0; x < (x1 || g[0].length); x++){
    const i = '1234'.indexOf(g[y][x]); if (i < 0) continue;
    if (wp_vn(x * .28 + seed, y * .34, seed) > k) g[y][x] = '5678'[i];
  }
}
const TR_SPEC = {
  kuh: { W: 40, H: 28, stride: 1, lw: [3.6, 2.6], hoof: 'h', legs: [28, 26, 11, 13, 16],
    body: [[9, 12, 6.4, 6.6, .02], [19, 13, 12.5, 6.4], [28, 13, 6, 7, .03]],
    head: { neck: [31, 12, 34, 9, 7, 5], ell: [35, 10, 3.6, 3.2], snout: [35, 11, 38, 13.5, 4.2, 3.6], px: [[35, 9, 'e'], [38, 14, 'n'], [37, 14, 'n'], [38, 13, 'n'], [32, 7, '2'], [31, 7, '1'], [33, 6, 'k'], [34, 5, 'k'], [36, 6, 'k'], [37, 5, 'k']] },
    graze: { neck: [31, 13, 35, 20, 7, 5], ell: [36, 21, 3.4, 3.4], snout: [36, 22, 38, 25, 4, 3.4], px: [[37, 20, 'e'], [38, 26, 'n'], [37, 26, 'n'], [33, 18, '2'], [35, 17, 'k'], [37, 17, 'k']] },
    tail: (g, f) => { const s = f === 5 ? 1 : (f & 1); tr_thick(g, 3, 8, 2 - s, 19, 1.6, 1.4, '2'); for (const [x, y] of [[1 - s, 19], [2 - s, 19], [1 - s, 20], [2 - s, 20], [2 - s, 21]]) tr_px(g, x, y, 'm'); },
    after: (g, f) => { for (let x = 15; x <= 18; x++) tr_px(g, x, 19, x === 15 || x === 18 ? 'U' : 'u'); tr_px(g, 16, 20, 'u'); tr_px(g, 17, 20, 'U'); } },
  schwein: { W: 24, H: 15, stride: .8, lw: [2.6, 2.2], hoof: 'h', legs: [17, 15, 6, 8, 10],
    body: [[6, 7.5, 4.6, 4.8, .02], [11, 7.5, 8.6, 5.2], [16, 7.6, 4.6, 5, .02]],
    head: { ell: [19.5, 7.6, 3.4, 3.4], snout: [21, 8.6, 22.6, 9, 3.4, 3.2], px: [[20, 6, 'e'], [23, 9, 'n'], [23, 8, 'n'], [22, 9, 'N'], [19, 4, '2'], [20, 4, '1'], [20, 5, '1'], [21, 5, '2']] },
    graze: { ell: [19.5, 9.6, 3.4, 3.2], snout: [21, 11, 22, 12.6, 3.4, 3], px: [[20, 8, 'e'], [22, 13, 'n'], [23, 12, 'n'], [19, 6, '2'], [20, 6, '1'], [21, 7, '2']] },
    snoutC: (t, qx, qy) => t > .6 ? 'n' : tr_tone(.62 - qy * .3),
    tail: (g, f) => { for (const [x, y] of [[2, 5], [1, 5], [1, 6], [2, 7], [1, 8]]) tr_px(g, x, y, '2'); } },
  schaf: { W: 22, H: 17, stride: .8, lw: [1.8, 1.6], hoof: 'h', legs: [15, 14, 6, 7, 11],
    body: [[10, 8.4, 8.4, 5.6]],
    head: { neck: [16, 8, 17, 6, 4, 3.4], ell: [18, 6.4, 2.4, 2.6], snout: [18, 7, 20, 8.5, 3, 2.4], px: [[18, 6, 'e'], [20, 9, 'N'], [16, 5, '6'], [15, 5, '5']] },
    graze: { neck: [16, 9, 18, 12, 4, 3.4], ell: [18.6, 13, 2.4, 2.4], snout: [19, 13.6, 20, 15, 3, 2.4], px: [[19, 12, 'e'], [16, 11, '6']] },
    snoutC: (t, qx, qy) => '5678'[clamp(Math.floor((.6 - qy * .3 - t * .2) * 4), 0, 3)],
    tail: (g, f) => { tr_px(g, 1, 7, '2'); tr_px(g, 1, 8, '2'); tr_px(g, 2, 9, '1'); },
    after: (g, f, graze) => {
      // Wolle: Locken am Rücken, Kopf und Beine dunkel
      for (let k = 0; k < 7; k++){ const x = 4 + k * 2.2, y = 3 + (k % 2 ? 0 : .6); tr_ell(g, x, y, 1.6, 1.4, .18); }
      for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++){ const c = g[y][x], i = '1234'.indexOf(c); if (i > 0 && ((x * 3 + y * 5) % 7 === 0)) g[y][x] = '1234'[i - 1]; }
      for (let y = 12; y < 17; y++) for (let x = 0; x < 22; x++) if ('1234'.includes(g[y][x]) && y > 13) g[y][x] = '5678'['1234'.indexOf(g[y][x])];
      if (!graze){ tr_ell(g, 17.2, 5.4, 2.2, 1.6, .2); }
    } },
  ziege: { W: 21, H: 19, stride: .9, lw: [1.8, 1.4], hoof: 'h', legs: [14, 13, 5, 6, 11],
    body: [[9, 9.6, 7.6, 4.4]],
    head: { neck: [14, 9, 16, 5, 3.6, 2.8], ell: [16.6, 4.4, 2.4, 2.2], snout: [17, 5, 19.4, 6.4, 2.6, 2], px: [[17, 4, 'e'], [19, 7, 'N'], [18, 8, 'm'], [18, 9, 'm'], [15, 3, '2'], [14, 3, '1'], [16, 2, 'k'], [15, 1, 'k'], [14, 1, 'k'], [17, 2, 'k'], [16, 1, 'k']] },
    graze: { neck: [14, 10, 16, 14, 3.6, 2.8], ell: [17, 15, 2.2, 2.2], snout: [17.4, 15.6, 19, 17.4, 2.6, 2], px: [[17, 14, 'e'], [16, 12, 'k'], [15, 12, 'k'], [19, 18, 'm']] },
    tail: (g, f) => { tr_px(g, 1, 6, '3'); tr_px(g, 1, 5, '4'); tr_px(g, 2, 7, '3'); } },
  reh: { W: 25, H: 26, stride: 1.2, lw: [2, 1.3], hoof: 'h', legs: [17, 16, 6, 7, 15],
    body: [[6, 12.6, 4.4, 4.4, .02], [11, 13, 8, 4.4], [16, 12.6, 4, 4.6, .03]],
    head: { neck: [17, 11, 19, 5, 4, 3], ell: [20, 4.4, 2.6, 2.2], snout: [20.5, 5, 23, 6.2, 2.6, 2], px: [[20, 4, 'e'], [23, 6, 'n'], [18, 1, '2'], [18, 2, '3'], [19, 1, '1'], [17, 0, '2'], [17, 1, '3']] },
    graze: { neck: [17, 12, 20, 19, 4, 3], ell: [21, 20, 2.4, 2.2], snout: [21.4, 20.6, 22.6, 23, 2.4, 2], px: [[21, 19, 'e'], [22, 23, 'n'], [19, 17, '2'], [18, 16, '2']] },
    tail: (g, f) => { for (let y = 10; y <= 14; y++) for (let x = 2; x <= 3; x++) tr_px(g, x, y, 'w'); tr_px(g, 1, 11, 'w'); } },
  hirsch: { W: 33, H: 34, stride: 1.4, lw: [2.6, 1.6], hoof: 'h', legs: [23, 22, 8, 9, 21],
    body: [[8, 17.6, 6, 5.6, .02], [15, 18, 10.5, 5.6], [22, 17.4, 5.4, 6.2, .03]],
    head: { neck: [23, 16, 25, 9, 6, 4], ell: [26.5, 8.4, 3.2, 2.8], snout: [27, 9, 30.4, 10.6, 3.2, 2.6], px: [[27, 8, 'e'], [30, 10, 'n'], [24, 6, '2'], [23, 6, '1']] },
    graze: { neck: [23, 17, 27, 25, 6, 4], ell: [28, 26, 3, 2.8], snout: [28.4, 26.6, 30, 30, 3, 2.6], px: [[28, 25, 'e'], [29, 30, 'n']] },
    tail: (g, f) => { for (let y = 14; y <= 17; y++) for (let x = 2; x <= 3; x++) tr_px(g, x, y, 'w'); },
    after: (g, f, graze) => {
      // Geweih: zwei Stangen mit Enden
      const ox = graze ? 2 : 0, oy = graze ? 17 : 0;
      const br = [[26, 6, 24, 0], [24, 0, 22, -4], [25, 3, 21, 1], [24, 0, 26, -3], [27, 6, 29, 1], [29, 1, 30, -4], [29, 1, 32, 0], [28, 3, 31, 3]];
      for (const [x0, y0, x1, y1] of br) tr_thick(g, x0 + ox, y0 + oy + 4, x1 + ox, y1 + oy + 4, 1.4, 1, 'k');
    } },
  fuchs: { W: 24, H: 12, stride: .9, lw: [1.6, 1.3], hoof: 'm', legs: [16, 15, 7, 8, 7],
    body: [[11, 6, 6.8, 2.8]],
    head: { ell: [17.6, 4.6, 2.6, 2.2], snout: [18.6, 5.4, 21.6, 5.8, 2.2, 1.4], px: [[18, 4, 'e'], [22, 6, 'm'], [16, 2, 'm'], [17, 2, '3'], [18, 1, 'm'], [18, 2, '3'], [18, 6, 'w'], [19, 6, 'w']] },
    graze: { ell: [18, 7, 2.4, 2], snout: [19, 7.6, 21.4, 9, 2, 1.4], px: [[18, 6, 'e'], [16, 4, 'm'], [18, 4, 'm']] },
    tail: (g, f) => { const s = f & 1; tr_thick(g, 5, 5, 0, 6 + s, 2.4, 3.2, (t, qx, qy) => t > .8 ? 'w' : tr_tone(.6 - qy * .3)); },
    after: (g, f) => { for (let x = 15; x <= 17; x++) tr_px(g, x, 7, 'w'); } },
  hund: { W: 20, H: 15, stride: .9, lw: [2, 1.6], hoof: 'h', legs: [14, 13, 5, 6, 8],
    body: [[9, 7.6, 6.4, 3.4]],
    head: { ell: [15, 5, 2.8, 2.6], snout: [16, 6, 18.6, 6.6, 2.6, 2], px: [[15, 4, 'e'], [19, 6, 'N'], [13, 4, '1'], [13, 5, '1'], [14, 3, '1'], [13, 6, '1']] },
    graze: { ell: [15, 8, 2.6, 2.4], snout: [16, 9, 18, 11, 2.4, 2], px: [[15, 7, 'e'], [18, 11, 'N'], [13, 7, '1'], [13, 8, '1']] },
    tail: (g, f) => { const s = f & 1; tr_thick(g, 3, 6, 1 - s, 2, 1.6, 1.2, '3'); },
    after: (g, f) => { for (const [x, y] of [[13, 8], [14, 8], [15, 9]]) if (g[y][x] !== '.') g[y][x] = '7'; } },
  wildschwein: { W: 27, H: 17, stride: .9, lw: [2.8, 2.2], hoof: 'h', legs: [19, 17, 7, 9, 11],
    body: [[7, 9, 5, 5, .02], [12, 8.4, 9, 5.8], [18, 7.8, 5, 6, .02]],
    head: { ell: [21.4, 8.6, 3.6, 3.6], snout: [23, 9.6, 25.6, 11, 3.2, 2.6], px: [[22, 7, 'e'], [26, 11, 'n'], [25, 12, 'w'], [24, 12, 'w'], [20, 5, '1'], [21, 4, '1'], [21, 5, '2']] },
    graze: { ell: [21.6, 11, 3.4, 3.2], snout: [23, 12, 25, 14.6, 3, 2.4], px: [[22, 9, 'e'], [25, 15, 'n'], [24, 15, 'w'], [20, 7, '1']] },
    tail: (g, f) => { tr_px(g, 2, 6, '1'); tr_px(g, 1, 7, '1'); tr_px(g, 1, 8, 'm'); },
    after: (g, f) => { for (let x = 9; x <= 20; x++){ const y = x > 15 ? 2 : 3; if (g[y + 1][x] !== '.') tr_px(g, x, y, (x & 1) ? 'm' : '1'); } } }
};
/* Farben je Tier und Spielart */
const TR_PAL = {
  kuh:    [{ 1:'#4a2414', 2:'#6c361e', 3:'#8e4e2c', 4:'#ac6a40', 5:'#8e8a80', 6:'#b6b2a6', 7:'#d6d2c6', 8:'#eeebe2', e:'#141012', h:'#2a2420', n:'#c8908a', N:'#7a4a46', k:'#d8ceb2', m:'#2a1a12', u:'#d8a49c', U:'#b07a72', w:'#eeebe2', patch:.56 },
            { 1:'#54402a', 2:'#76603e', 3:'#987e54', 4:'#b49c6c', 5:'#3a2a1c', 6:'#4e3a26', 7:'#624a32', 8:'#78603e', e:'#141012', h:'#2a2420', n:'#5a4440', N:'#3a2a26', k:'#d8ceb2', m:'#2a1e14', u:'#c89a90', U:'#a07870', w:'#e8e2d0' }],
  schwein:[{ 1:'#7a4a40', 2:'#a06a58', 3:'#c08a74', 4:'#d8a890', 5:'#3a2a24', 6:'#4e3a32', 7:'#624a40', 8:'#7a5e50', e:'#141012', h:'#3a2a24', n:'#e0a090', N:'#8a4a40', patch:.6 },
            { 1:'#2a201c', 2:'#403228', 3:'#584636', 4:'#705a46', 5:'#7a5a42', 6:'#94704e', 7:'#ac885e', 8:'#c0a070', e:'#0e0c0c', h:'#1a1412', n:'#7a5a50', N:'#3a2a26', patch:.66 }],
  schaf:  [{ 1:'#8a8270', 2:'#aca490', 3:'#cac2ac', 4:'#e4dec8', 5:'#241e1a', 6:'#3a322c', 7:'#504842', 8:'#686058', e:'#0e0c0c', h:'#1e1a16', N:'#141012' },
            { 1:'#5a4e40', 2:'#766a58', 3:'#928670', 4:'#aca088', 5:'#241e1a', 6:'#3a322c', 7:'#504842', 8:'#686058', e:'#0e0c0c', h:'#1e1a16', N:'#141012' }],
  ziege:  [{ 1:'#8a8478', 2:'#ada698', 3:'#cac4b4', 4:'#e2ddd0', e:'#2a1a0e', h:'#2a2420', N:'#4a3a34', k:'#7a6a52', m:'#8a8478' },
            { 1:'#3e2a1a', 2:'#5a3e26', 3:'#765434', 4:'#906c46', e:'#1a100a', h:'#1e1814', N:'#2a1e18', k:'#a0906e', m:'#2a1e14' }],
  reh:    [{ 1:'#4e2a14', 2:'#72401e', 3:'#965a2e', 4:'#b47844', e:'#0e0a08', h:'#2a1e16', n:'#1a1210', w:'#ece6da' }],
  hirsch: [{ 1:'#3e2414', 2:'#5c361e', 3:'#7c4c2c', 4:'#98663e', e:'#0e0a08', h:'#241a14', n:'#1a1210', w:'#e2dccf', k:'#cfc2a0' }],
  fuchs:  [{ 1:'#6a2a10', 2:'#9a4418', 3:'#c4642a', 4:'#dc8a4a', e:'#0e0a08', h:'#1a1210', m:'#1e1410', w:'#efe8dc' }],
  hund:   [{ 1:'#4a3220', 2:'#6a4a30', 3:'#8a6642', 4:'#a68256', 7:'#c8a878', e:'#0e0a08', h:'#2a2018', N:'#141012' },
            { 1:'#1a1816', 2:'#2c2a26', 3:'#403c36', 4:'#58524a', 7:'#a0784a', e:'#0e0a08', h:'#141210', N:'#0a0808' },
            { 1:'#6a645a', 2:'#8a8478', 3:'#aaa496', 4:'#c8c2b2', 7:'#e4dece', e:'#0e0a08', h:'#3a3630', N:'#1a1614' }],
  wildschwein: [{ 1:'#1e1814', 2:'#302620', 3:'#44382e', 4:'#5a4a3c', e:'#0a0808', h:'#120e0c', n:'#4a3a34', m:'#0e0c0a', w:'#e8e0cc' }]
};
/* kleine Tiere als Pixelraster (Blick nach rechts) */
const TR_SMALL = {
  huhn: { pal: [{ 1:'#6a3a1a', 2:'#8e5226', 3:'#b06e36', 4:'#cc8c4e', r:'#c42a20', y:'#e0a030', e:'#0e0a08' }, { 1:'#9a968a', 2:'#c2beb2', 3:'#dedad0', 4:'#f4f2ea', r:'#c42a20', y:'#e0a030', e:'#0e0a08' },
                  { 1:'#2a2420', 2:'#3e342c', 3:'#584a3a', 4:'#76624a', r:'#c42a20', y:'#e0a030', e:'#0e0a08' }],
    frames: {
      stand: ['.......rr..', '......r34r.', '......4e44y', '.1....3443r', '1211..2332.', '122223333..', '.12233332..', '..122222...', '...y..y....', '..yy.yy....'],
      walk:  ['.......rr..', '......r34r.', '......4e44y', '.1....3443r', '1211..2332.', '122223333..', '.12233332..', '..122222...', '...y...y...', '..yy....yy.'],
      peck:  ['...........', '...........', '...........', '.1.........', '1211.......', '1222233.rr.', '.1223334r4.', '..12223e44y', '...y..y334r', '..yy.yy....'] } },
  hahn: { pal: [{ 1:'#5a1e10', 2:'#8a3418', 3:'#b85a20', 4:'#e0a040', r:'#d02a1e', y:'#e0a030', e:'#0e0a08', g:'#1e3a3e', G:'#2e5a52' }],
    frames: {
      stand: ['.g.....rrr..', 'gG.....r34r.', 'gG.G...4e44y', '.gG.G..3443r', '.GgG2..2332r', '.gG22233333.', '..122233332.', '...1222222..', '....y...y...', '...yy..yy...'],
      walk:  ['.g.....rrr..', 'gG.....r34r.', 'gG.G...4e44y', '.gG.G..3443r', '.GgG2..2332r', '.gG22233333.', '..122233332.', '...1222222..', '....y....y..', '...yy.....yy'],
      peck:  ['............', '.g..........', 'gG.G........', '.gG.G.......', '.GgG2.......', '.gG22233.rr.', '..122233r34.', '...1222234e4y', '....y...3443r', '...yy..yy..r'] } },
  gans: { pal: [{ 1:'#8e8a80', 2:'#b6b2a6', 3:'#d8d4c8', 4:'#f2efe6', y:'#e0782a', Y:'#b0501a', e:'#0e0a08' }],
    frames: {
      stand: ['........34..', '........4e4y', '........33yy', '........33..', '........23..', '........23..', '.1......23..', '1222...233..', '122223333...', '.12223333...', '..1222222...', '...y...y....', '..yY..yY....'],
      walk:  ['........34..', '........4e4y', '........33yy', '........33..', '........23..', '........23..', '.1......23..', '1222...233..', '122223333...', '.12223333...', '..1222222...', '...y....y...', '..yY.....yY.'],
      peck:  ['............', '............', '............', '............', '............', '.1..........', '1222........', '1222233333..', '.122333334..', '..122222334y', '...y.y...4ey', '..yY.yY..33y', '............'] } },
  ente: { pal: [{ 1:'#3a3022', 2:'#5a4a34', 3:'#7a6646', 4:'#9a8460', g:'#1e4a2e', G:'#2e6a3e', y:'#d8a030', w:'#e8e4d8', e:'#0e0a08' },
                { 1:'#4a3624', 2:'#6a4e34', 3:'#8a6a48', 4:'#a8865e', g:'#5a4430', G:'#7a5e40', y:'#c8902a', w:'#c8b898', e:'#0e0a08' }],
    frames: {
      stand: ['........gg..', '.......gGeg.', '.......gGgyy', '........w...', '.1....2333..', '1222223334..', '.12222333...', '..111111....'],
      walk:  ['........gg..', '.......gGeg.', '.......gGgyy', '........w...', '.1....2333..', '1222223334..', '.12222333...', '...111111...'],
      peck:  ['............', '............', '............', '............', '.1..........', '12222233gg..', '.1222233gGgy', '..11111.....'] } },
  hase: { pal: [{ 1:'#4a3a2a', 2:'#6a543c', 3:'#8a7052', 4:'#a68c6a', w:'#e8e2d4', e:'#0e0a08', n:'#c8908a' }],
    frames: {
      stand: ['.....12....', '.....12....', '.....23....', '....3343...', '....34e3n..', '.w.23333...', 'w2223333...', '12223333...', '.1h..hh....'],
      walk:  ['...........', '.....12....', '.....123...', '....3343...', '.w..34e3n..', 'w2223333...', '1222333333.', '.12.....2h.', '.h.........'],
      peck:  ['.....12....', '.....12....', '.....23....', '....3343...', '....34e3n..', '.w.23333...', 'w2223333...', '12223333...', '.1h..hh....'] } },
  katze: { pal: [{ 1:'#3a3430', 2:'#56504a', 3:'#726a62', 4:'#8e867c', e:'#c8b030', n:'#c8908a' }, { 1:'#6a3a18', 2:'#8e5226', 3:'#b06e36', 4:'#cc8c4e', e:'#3a8a30', n:'#c8908a' }],
    frames: {
      stand: ['1..........1.1', '1..........343', '.1.........4e3n', '.12222222233.', '.1222223333..', '..2.2...3.3..', '..2.2...3.3..'],
      walk:  ['1..........1.1', '1..........343', '.1.........4e3n', '.12222222233.', '.1222223333..', '..2..2..3..3.', '.2....2.3...3'],
      peck:  ['...........1.1', '1..........343', '1..........4e3n', '.1.2222223333.', '.11222223333..', '...22223333...', '..2.2...3.3...'] } },
  taube: { pal: [{ 1:'#4a4c54', 2:'#6a6e78', 3:'#8a909a', 4:'#aab0b8', g:'#4a7a6a', y:'#c88a6a', e:'#c8402a' }],
    frames: { stand: ['....33.', '1..3e3y', '1223g3.', '.12233.', '..y.y..'], walk: ['....33.', '1..3e3y', '1223g3.', '.12233.', '.y...y.'], peck: ['.......', '1......', '12233..', '.1223e3', '..y.y3y'] } },
  spatz: { pal: [{ 1:'#3a2a1a', 2:'#5a4228', 3:'#7a5e3a', 4:'#a08a6a', y:'#3a2a1a', e:'#0e0a08' }],
    frames: { stand: ['...33', '1.3e4', '1223.', '.y.y.'], walk: ['...33', '1.3e4', '1223.', 'y...y'], peck: ['.....', '1....', '12234', '.y3e4'] } },
  frosch: { pal: [{ 1:'#1e3a16', 2:'#2e5420', 3:'#467030', 4:'#6a9046', e:'#e0c040' }],
    frames: { stand: ['...e.e', '.23443', '12333.', '1.1.1.'], walk: ['....e.e', '..23443', '123333.', '1....1.'], peck: ['...e.e', '.23443', '12333.', '1.1.1.'] } }
};
/* Bild aus Raster mit Kontur; Bildersatz je Richtung */
function tr_sprite(rows, pal){
  const R = rows.map(r => typeof r === 'string' ? r : r.join('')), w = Math.max(...R.map(r => r.length));
  return makeSprite(R.map(r => r.padEnd(w, '.')), pal, OUT);
}
const TR_ART = {};
function trArt(kind, v){
  const key = kind + (v || 0);
  if (TR_ART[key]) return TR_ART[key];
  let set;
  if (TR_SPEC[kind]){
    const S = TR_SPEC[kind], pals = TR_PAL[kind], P = pals[(v || 0) % pals.length];
    const frames = [];
    for (let f = 0; f < 8; f++){ const g = tr_quad(S, f); if (P.patch) tr_patch(g, 7 + (v || 0) * 13, P.patch); frames.push(tr_sprite(g, P)); }
    set = { walk: frames.slice(0, 4), stand: frames[4], graze: frames[5], run: frames.slice(6, 8), w: S.W + 2, h: S.H + 2 };
  } else {
    const T = TR_SMALL[kind], P = T.pal[(v || 0) % T.pal.length], F = T.frames;
    const st = tr_sprite(F.stand, P), wk = tr_sprite(F.walk, P), pk = tr_sprite(F.peck, P);
    set = { walk: [st, wk, st, wk], stand: st, graze: pk, run: [wk, st], w: st.width, h: st.height };
  }
  const flip = a => Array.isArray(a) ? a.map(flipped) : flipped(a);
  set.l = { walk: flip(set.walk), stand: flip(set.stand), graze: flip(set.graze), run: flip(set.run) };
  set.ax = set.w >> 1; set.ay = set.h - 1;
  return (TR_ART[key] = set);
}
/* fliegende Vögel und Schmetterlinge: zwei Flügelschläge */
const TR_FLY = (() => {
  const mk = (rows, pal) => makeSprite(rows, pal, null);
  const crow = { a:'#1a1818', b:'#3a3636' }, star = { a:'#2a2a30', b:'#4a4a56' }, dove = { a:'#6a6e78', b:'#9aa0aa' };
  const bird = pal => [mk(['b.....b', '.b...b.', '..aaa..'], pal), mk(['.......', '..aaa..', '.b...b.', 'b.....b'], pal)];
  const fly = (c1, c2) => [mk(['a.a', 'bab', 'a.a'], { a: c1, b: c2 }), mk(['...', 'aba', '...'], { a: c1, b: c2 })];
  const bat = { a:'#141216', b:'#2a2630' };
  return { krähe: bird(crow), star: bird(star), taube: bird(dove), gans: bird({ a:'#3a3630', b:'#7a746a' }),
    fledermaus: [mk(['b.....b', 'bb.a.bb', '.bbabb.'], bat), mk(['..bab..', '.bbabb.', 'b.....b'], bat)],
    falter: [fly('#e8d050', '#3a2a1a'), fly('#f0eee6', '#3a3a3a'), fly('#c84a2a', '#2a1a12'), fly('#7a8ad8', '#2a2a3a')] };
})();

/* ============ Leute unterwegs: von vorn, hinten und der Seite, Gang in vier Bildern ============ */
/* Seitenansicht (Blick nach rechts) im selben Raster wie np_figure; f 0..3 Gang, 4 Stand */
function np_side(o, f){
  const Wd = 23, Ht = 47, cx = 11, g = Array.from({ length: Ht }, () => Array(Wd).fill('.'));
  const px = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (c && x >= 0 && y >= 0 && x < Wd && y < Ht) g[y][x] = c; };
  const tone = (x, x0, x1, ramp, lift) => { const t = (x - x0 + .5) / (x1 - x0 + 1), nx = 2 * t - 1, l = -nx * .5 + Math.sqrt(Math.max(0, 1 - nx * nx)) * .75 + (lift || 0); return ramp[l > .86 ? 3 : l > .45 ? 2 : l > .05 ? 1 : 0]; };
  const band = (y, x0, x1, ramp, lift) => { for (let x = x0; x <= x1; x++) px(x, y, tone(x, x0, x1, ramp, lift)); };
  const line = (x0, y0, x1, y1, w, ramp, lift) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) || 1;
    for (let i = 0; i <= n; i++){ const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; for (let k = 0; k < w; k++) px(x - (w - 1) / 2 + k, y, ramp[clamp(Math.round(2 - k * .9 + (lift || 0)), 0, 3)]); }
  };
  const C1 = ['1', '2', '3', '4'], C2 = ['5', '6', '7', '8'], SK = ['s', 't', 'u', 'v'], LN = ['w', 'x', 'x', 'z'], LE = ['N', 'n', 'b', 'B'], IR = ['D', 'M', 'L', 'H'];
  const long = o.robe === 'long', hem = long ? 43 : 33, st = f === 4 ? [0, 0] : [[3, -3], [0, 0], [-3, 3], [0, 0]][f], lift = f === 1 ? 1 : f === 3 ? -1 : 0;
  const armS = f === 4 ? 0 : [-3, 0, 3, 0][f], hair = o.hair || ['h', 'j'], sl = o.sleeve || C1;
  // ferner Arm (hinter dem Leib)
  line(cx - 1, 19, cx - 1 - armS * .7, 29, 2, sl, -1); px(cx - 1 - armS * .7, 30, 't');
  // Beine: ferner zuerst, dunkler
  const legs = (k, dark) => {
    const fx = cx + st[k], ft = 45 - (k === 0 && f === 1 ? 1 : k === 1 && f === 3 ? 1 : 0);
    if (long){ for (let x = 0; x < 4; x++) px(fx - 1 + x, ft, dark ? 'N' : x > 1 ? 'b' : 'n'); for (let x = 0; x < 3; x++) px(fx - 1 + x, ft - 1, dark ? 'N' : 'n'); return; }
    line(cx + (k ? -1 : 1) * .5, 34, fx, ft - 2, 3, C2, dark ? -1.2 : 0);
    for (let x = 0; x < 4; x++){ px(fx - 1 + x, ft, dark ? 'N' : x > 1 ? 'b' : 'n'); px(fx - 1 + x, ft - 1, dark ? 'N' : 'n'); }
  };
  legs(1, true);
  // Rumpf und Rock: Brust vorn, Rücken hinten, Rock weitet sich nach unten
  for (let y = 17; y <= hem; y++){
    const t = (y - 17) / Math.max(1, hem - 17), b = Math.round(3 + t * (long ? 2 : .8)), fr = Math.round(3 + t * (long ? 1.6 : .6));
    band(y, cx - b, cx + fr, C1, y < 20 ? .15 : 0);
  }
  if (!long) for (let x = cx - 4; x <= cx + 4; x++) px(x, 33, (x & 1) ? '1' : '2');
  if (o.cape) for (let y = 17; y <= 25; y++) band(y, cx - 4 - (y > 20 ? 1 : 0), cx + 3, C2, .1);
  if (o.fur) for (let y = 17; y <= 20; y++) for (let x = cx - 4; x <= cx + 3; x++) px(x, y, ((x + y) & 1) ? 'F' : 'f');
  if (o.fur) for (let y = 21; y <= hem; y++) px(cx + 3 + (y > 34 ? 1 : 0), y, (y & 1) ? 'F' : 'f');
  if (o.plate) for (let y = 18; y <= 26; y++) band(y, cx - 3, cx + 4, IR, .2);
  if (o.belt) for (let x = cx - 4; x <= cx + 4; x++) px(x, 27, x === cx + 3 ? 'A' : 'n');
  if (o.rope){ for (let x = cx - 4; x <= cx + 4; x++) px(x, 27, (x & 1) ? 'x' : 'w'); px(cx + 2, 28, 'x'); px(cx + 2, 29, 'w'); px(cx + 3, 30, 'x'); }
  if (o.apron){ const ap = o.apron === 'leather' ? LE : LN; for (let y = 24; y <= hem - 2; y++) band(y, cx + 1, cx + 4 + (y > 30 ? 1 : 0), ap, .2); }
  if (o.parti) for (let y = 17; y <= 33; y++) for (let x = cx - 6; x <= cx; x++){ const i = '1234'.indexOf(g[y][x]); if (i >= 0) g[y][x] = '5678'[i]; }
  if (o.carry === 'sack') for (let y = 15; y <= 26; y++) band(y, cx - 7, cx - 3, LN, .1);
  // nahes Bein
  legs(0, false);
  // Hals und Kopf im Profil
  px(cx, 16, 't'); px(cx + 1, 16, 'u');
  for (const [y, x0, x1] of [[7, -2, 1], [8, -3, 2], [9, -3, 3], [10, -3, 3], [11, -3, 3], [12, -3, 3], [13, -2, 3], [14, -2, 2], [15, -1, 1]]) band(y, cx + x0, cx + x1, SK, .1);
  px(cx + 4, 11, 'u'); px(cx + 4, 12, 't');                 // Nase
  if (o.bald){ for (let y = 9; y <= 12; y++){ px(cx - 3, y, hair[0]); px(cx - 2, y, hair[1]); } }
  else if (!o.hat || o.hat === 'filz' || o.hat === 'barett' || o.hat === 'eisenhut' || o.hat === 'pilger'){
    for (const [y, x0, x1] of [[7, -2, 1], [8, -3, 1], [9, -3, -1], [10, -3, -1], [11, -3, -2], [12, -3, -2], [13, -2, -2]]) for (let x = x0; x <= x1; x++) px(cx + x, y, (x + y) & 1 ? hair[0] : hair[1]);
  }
  px(cx + 2, 10, 'e'); px(cx + 2, 9, hair[1]); px(cx - 1, 11, 't'); px(cx + 2, 13, 's');
  if (o.beard) for (const [y, x0, x1] of [[12, 0, 1], [13, 0, 3], [14, -1, 3], [15, -1, 2], [16, 0, 2]]) for (let x = x0; x <= x1; x++) px(cx + x, y, (x + y) & 1 ? hair[0] : hair[1]);
  if (o.mask){   // Larve im Profil: lange Nase, gemalter Bart
    for (const [y, x0, x1] of [[8, 0, 3], [9, 0, 3], [10, 0, 3], [11, 0, 4], [12, 0, 3], [13, 0, 3], [14, 0, 2]]) for (let x = x0; x <= x1; x++) px(cx + x, y, x === x0 ? 'x' : 'z');
    px(cx + 5, 11, 'z'); px(cx + 6, 12, 'x'); px(cx + 2, 10, 'e'); px(cx + 2, 12, 'R');
    for (const [y, x0, x1] of [[13, 1, 3], [14, 0, 3], [15, 0, 2], [16, 1, 2]]) for (let x = x0; x <= x1; x++) px(cx + x, y, 'N');
  }
  // Kopfbedeckung
  if (o.hat === 'narr'){
    for (const [y, x0, x1] of [[5, -3, 2], [6, -4, 3], [7, -5, 3]]) band(y, cx + x0, cx + x1, C2, .2);
    for (let y = 8; y <= 16; y++) band(y, cx - 5, cx - 2, C2, .1);
    for (let k = 0; k < 5; k++) px(cx - 4 - k, 5 - k, k & 1 ? '6' : '7');
    px(cx - 9, 0, 'A'); px(cx - 8, 0, 'a'); px(cx + 2, 4, '3'); px(cx + 3, 3, '2'); px(cx + 4, 2, 'A');
  }
  if (o.hat === 'eisenhut'){ for (const [y, x0, x1] of [[3, -2, 1], [4, -3, 2], [5, -4, 3], [6, -4, 3]]) band(y, cx + x0, cx + x1, IR, .25); band(7, cx - 6, cx + 5, ['K', 'D', 'M', 'L']); band(8, cx - 5, cx + 4, ['K', 'K', 'D', 'D']); }
  else if (o.hat === 'barett'){ for (const [y, x0, x1] of [[4, -4, 3], [5, -6, 5], [6, -6, 6], [7, -5, 4]]) band(y, cx + x0, cx + x1, C2, .1); px(cx - 4, 3, 'z'); px(cx - 5, 2, 'z'); px(cx - 6, 1, 'x'); }
  else if (o.hat === 'haube'){ for (const [y, x0, x1] of [[5, -3, 2], [6, -4, 3], [7, -4, 3]]) band(y, cx + x0, cx + x1, LN, .2); for (let y = 8; y <= 15; y++) band(y, cx - 4, cx - 1 + (y < 10 ? 2 : 0), LN, .1); band(16, cx - 3, cx + 1, LN); }
  else if (o.hat === 'tuch'){ for (const [y, x0, x1] of [[5, -3, 2], [6, -4, 3], [7, -4, 3], [8, -4, 2]]) band(y, cx + x0, cx + x1, C2, .2); for (let y = 9; y <= 14; y++) band(y, cx - 4, cx - 2, C2, .1); }
  else if (o.hat === 'filz'){ for (const [y, x0, x1] of [[3, -3, 2], [4, -3, 2], [5, -3, 2]]) band(y, cx + x0, cx + x1, ['W', 'X', 'X', 'b'], .1); band(6, cx - 6, cx + 6, ['W', 'W', 'X', 'X']); px(cx - 3, 5, 'R'); }
  else if (o.hat === 'pilger'){ for (const [y, x0, x1] of [[3, -3, 2], [4, -4, 3], [5, -4, 3]]) band(y, cx + x0, cx + x1, ['W', 'X', 'X', 'b'], .1); band(6, cx - 8, cx + 8, ['W', 'W', 'X', 'b']); px(cx + 1, 4, 'z'); }
  else if (o.hat === 'kapuze'){ for (const [y, x0, x1] of [[4, -3, 2], [5, -4, 3], [6, -5, 4], [7, -5, 4]]) band(y, cx + x0, cx + x1, C1, .2); for (let y = 8; y <= 17; y++) band(y, cx - 5, cx - 1 + (y < 9 ? 3 : 0), C1, .1); }
  // naher Arm mit Hand; Dinge in der Hand
  const hx = cx + armS * .8, hy = 30;
  if (o.halberd || o.staff || o.hoe){
    const sx = cx + 5;
    if (o.halberd){ for (let y = 1; y <= 45; y++) px(sx, y, y & 1 ? 'W' : 'X'); for (const [x, y, c] of [[0, 0, 'H'], [0, 1, 'L'], [1, 2, 'L'], [1, 3, 'M'], [1, 4, 'H'], [1, 5, 'L'], [-1, 3, 'M'], [-1, 4, 'L'], [-2, 4, 'D'], [-1, 5, 'M']]) px(sx + x, y, c); }
    if (o.staff){ for (let y = 5; y <= 45; y++) px(sx, y, y & 1 ? 'W' : 'X'); px(sx, 4, 'b'); }
    if (o.hoe){ for (let k = 0; k <= 30; k++) px(cx - 6 + k * .45, 4 + k, k & 1 ? 'W' : 'X'); for (const [x, y] of [[-8, 3], [-7, 3], [-8, 4], [-7, 2], [-9, 4]]) px(cx + x, y, 'M'); }
    line(cx, 19, sx - 1, 27, 2, sl); px(sx - 1, 28, 'u'); px(sx, 28, 't');
  } else {
    line(cx, 19, hx, hy - 1, 3, sl); px(hx, hy, 'u'); px(hx + 1, hy, 't'); px(hx, hy + 1, 't');
    if (o.carry === 'korb'){ for (let y = hy; y <= hy + 4; y++) for (let x = hx - 1; x <= hx + 3; x++) px(x, y + 1, y === hy ? 'B' : ((x + y) & 1) ? 'b' : 'n'); px(hx + 1, hy - 1, 'b'); }
    if (o.carry === 'eimer'){ for (let y = hy + 1; y <= hy + 5; y++) for (let x = hx - 1; x <= hx + 2; x++) px(x, y, y === hy + 1 ? 'D' : x === hx - 1 ? 'W' : 'X'); }
  }
  return g;
}
/* Bildersatz einer Person: Gang in vier Richtungen, Stand vorn */
const VK_SETS = {};
function vkSet(key, o, pal){
  if (VK_SETS[key]) return VK_SETS[key];
  const P = Object.assign({}, NP_BASE, pal), mk = g => makeSprite(g.map(r => r.join('')), P, OUT);
  const set = { down: [], up: [], right: [], left: [], ax: 12, ay: 47 };
  for (let f = 0; f < 4; f++){
    const step = f === 1 ? 1 : f === 3 ? 3 : 0;
    set.down.push(mk(np_figure(Object.assign({}, o, { step }))));
    set.up.push(mk(np_figure(Object.assign({}, o, { step, back: true }))));
    const s = mk(np_side(o, f)); set.right.push(s); set.left.push(flipped(s));
  }
  set.stand = { down: set.down[0], up: set.up[0], right: mk(np_side(o, 4)), left: null };
  set.stand.left = flipped(set.stand.right);
  set.breath = makeSprite(['.'.repeat(23)].concat(np_figure(o).map(r => r.join('')).slice(0, 30), np_figure(o).map(r => r.join('')).slice(31)), P, OUT);
  return (VK_SETS[key] = set);
}
/* Leute nach Stand: Aussehen und Farben (je Art mehrere Kleiderfarben) */
const VK_TYPES = {
  buerger:  { o: { robe:'long', hat:'barett', beard:true, fur:true, belt:false, hair:['h', 'j'] },
    pals: [['#141218', '#221e28', '#322c3a', '#463e50', '#3a0e12', '#5a1a1e', '#7a2a2a', '#9a3a34'], ['#2a1a10', '#3e2a1a', '#56402a', '#6e563c', '#141218', '#241e2a', '#3a3040', '#504658'], ['#16241c', '#22362a', '#30483a', '#425e4c', '#2a1a10', '#3e2a1a', '#56402a', '#6e563c']] },
  buergerin:{ o: { robe:'long', hat:'haube', apron:'linen', hairTop:false },
    pals: [['#1a2a4a', '#24386a', '#34508a', '#4a6aa6', '#3a2c1e', '#4a3a28', '#5a4a34', '#6e5c44'], ['#4a1416', '#6a1e20', '#8a2e2c', '#a8463e', '#3a2c1e', '#4a3a28', '#5a4a34', '#6e5c44'], ['#2e3a1c', '#46562a', '#5e7038', '#7c8c4c', '#3a2c1e', '#4a3a28', '#5a4a34', '#6e5c44']] },
  magd:     { o: { robe:'long', hat:'tuch', apron:'linen', carry:'korb', hairTop:false },
    pals: [['#3a3024', '#52442e', '#6a5a3c', '#84724c', '#6a1e1a', '#8a2e24', '#a84432', '#c25a40'], ['#2e2a26', '#46403a', '#5e564e', '#787064', '#24386a', '#34508a', '#4a6aa6', '#6684bc']] },
  baeuerin: { o: { robe:'long', hat:'tuch', apron:'linen', carry:'eimer', hairTop:false },
    pals: [['#4a3a22', '#64502e', '#7e683c', '#98804e', '#6a6040', '#847a52', '#9e9466', '#b8ae7c']] },
  bauer:    { o: { robe:'short', hat:'filz', belt:true, hoe:true, beard:true, hair:['h', 'j'] },
    pals: [['#3e3020', '#56442c', '#6e5a3a', '#88724c', '#4a4a3a', '#5e5e4a', '#76765c', '#8e8e70'], ['#2c3424', '#3e4a32', '#526242', '#6a7a54', '#4a3a28', '#5e4a34', '#765e44', '#8e7656']] },
  knecht:   { o: { robe:'short', belt:true, carry:'sack', hair:['h', 'j'] },
    pals: [['#5a4e3a', '#72664c', '#8a7e60', '#a49878', '#3a3028', '#4e4236', '#645646', '#7a6c58']] },
  moench:   { o: { robe:'long', hat:'kapuze', rope:true, bald:true, hair:['h', 'j'] },
    pals: [['#2a1e16', '#3e2c20', '#54402e', '#6a543e', '#2a1e16', '#3e2c20', '#54402e', '#6a543e'], ['#141216', '#222026', '#34303a', '#48434e', '#141216', '#222026', '#34303a', '#48434e']] },
  wache:    { o: { robe:'short', hat:'eisenhut', plate:true, halberd:true, belt:true, parti:true, beard:true, hair:['h', 'j'] },
    pals: [['#4a0e12', '#7a1a1e', '#a42a2a', '#c84a40', '#8a8478', '#b0aa9c', '#d0cabc', '#ebe6da'], ['#2a2410', '#4e4418', '#a07a1a', '#d0a830', '#141216', '#222026', '#34303a', '#48434e']] },
  pilger:   { o: { robe:'long', hat:'pilger', cape:true, staff:true, beard:true, hair:['h', 'j'] },
    pals: [['#3a342c', '#524a3e', '#6a6050', '#847a66', '#4a3a28', '#5e4a34', '#765e44', '#8e7656']] },
  bettler:  { o: { robe:'short', staff:true, beard:true, hair:['w', 'x'] },
    pals: [['#3a3630', '#4e4a42', '#625e54', '#787266', '#3a3028', '#4a3e32', '#5a4c3e', '#6a5c4c']] },
  knappe:   { o: { robe:'short', hat:'kapuze', belt:true, hoe:true, beard:true, hair:['h', 'j'] },
    pals: [['#8a8678', '#aaa696', '#c8c4b2', '#e2ded0', '#2a2620', '#3a342c', '#4c453a', '#5e564a'], ['#5a5a58', '#747472', '#8e8e8a', '#a8a8a2', '#2a2620', '#3a342c', '#4c453a', '#5e564a']] },
  schembart:{ o: { robe:'short', hat:'narr', mask:true, parti:true, belt:true, hair:['h', 'j'] },   // Schembartläufer zur Fastnacht
    pals: [['#5a0e0e', '#861a16', '#ae2c22', '#d0483a', '#6a5010', '#9a7a1c', '#c8a030', '#e6c44c'], ['#1c4a24', '#2a6a32', '#3e8a44', '#5aaa5a', '#8a8478', '#b0aa9c', '#d0cabc', '#ebe6da'],
      ['#14244a', '#20366a', '#30508e', '#4a6eb0', '#5a0e0e', '#861a16', '#ae2c22', '#d0483a']] },
  haendler: { o: { robe:'short', hat:'filz', apron:'leather', belt:true, hairSide:true, hair:['h', 'j'] },
    pals: [['#1e3a2e', '#2c5440', '#3e6e52', '#5a8a68', '#4a2a18', '#6a3e22', '#8a5630', '#a87040'], ['#3a1e2e', '#542c40', '#6e3e52', '#8a5a68', '#2a2a2a', '#3e3e3e', '#565656', '#6e6e6e']] }
};
const VK_HAIR = [['#2a1a10', '#4a3020'], ['#5a3a1a', '#7a5228'], ['#8a6a3a', '#b08a50'], ['#3a3632', '#6a645c'], ['#a89a84', '#d0c4ae']];
function vkPerson(type, v){
  const T = VK_TYPES[type], p = T.pals[v % T.pals.length], hr = VK_HAIR[(v * 7 + type.length) % VK_HAIR.length];
  const pal = { 1: p[0], 2: p[1], 3: p[2], 4: p[3], 5: p[4], 6: p[5], 7: p[6], 8: p[7], h: hr[0], j: hr[1], R: '#8a1c1c' };
  if (T.o.hair && T.o.hair[0] === 'w') Object.assign(pal, { w: '#8a8478', x: '#c8c2b0' });
  return vkSet(type + v, T.o, pal);
}
