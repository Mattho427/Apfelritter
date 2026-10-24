"use strict";
/* Der Apfelritter, Teil 2 von 26: Der Ritter (Herkunft, Harnisch, Schwert, Aussehen) und die Pferde.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Der Ritter: Reichsritter in Schaller und gelbem Wappenrock mit Reichsadler ============ */
const kn_PAL = {
  K:'#22252b', D:'#434952', M:'#6c747e', L:'#98a1ab', H:'#c5ccd3', G:'#eef1f3',   // blankes Eisen
  O:'#6f4a12', o:'#b07c1c', y:'#dfae2e', Y:'#f2d256',                            // gelbes Tuch
  e:'#141217', E:'#3a3741', r:'#b8281e',                                           // Adler: schwarz, rot bewehrt
  N:'#3a2416', n:'#61402a', b:'#8c6340',                                           // Leder
  A:'#9c7a32', a:'#e0c271',                                                        // Messing
  C:'#858c94', c:'#4a4f57',                                                        // Kettengeflecht
  W:'#4a3020', w:'#6e4c30'                                                         // Holz (Schildrückseite)
};
/* Wappenfarben (Tinkturen) in vier Helligkeiten, Haut, Federbusch */
Object.assign(kn_PAL, {
  1:'#6f4a12', 2:'#b07c1c', 3:'#dfae2e', 4:'#f2d256',                            // Gold
  5:'#5a1012', 6:'#8e1c1c', 7:'#b8302a', 8:'#d85448',                            // Rot
  U:'#141e48', u:'#22357a', J:'#3452a8', j:'#5a7ad0',                            // Blau
  S:'#7e7a70', s:'#aeaa9c', T:'#d8d4c6', t:'#f6f2e6',                            // Silber (weiß)
  P:'#4a2056', p:'#8a4a9a',                                                        // Purpur
  Z:'#7a4a32', z:'#c08a66', q:'#e8bc96',                                           // Haut
  F:'#8a8a86', f:'#c8c6be', g:'#f6f4ee'                                            // Federbusch
});
const kn_TINC = { or:'1234', gu:'5678', az:'UuJj', ar:'SsTt' };
let kn_F = null;                     // Herkunft, für die gerade gezeichnet wird
const kn_W = 29, kn_H = 48, kn_CX = 14, kn_PAD = 1;
const kn_new = () => Array.from({ length: kn_H }, () => Array(kn_W).fill('.'));
function kn_px(g, x, y, ch){ x = Math.round(x); y = Math.round(y); if (ch && ch !== '.' && ch !== ' ' && y >= 0 && y < kn_H && x >= 0 && x < kn_W) g[y][x] = ch; }
function kn_art(g, x, y, rows){ rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) kn_px(g, x + i, y + j, r[i]); }); }
function kn_seg(g, y, segs){ for (const [x, s] of segs) kn_art(g, x, y, [s]); }
function kn_comp(dst, src, dx, dy){ src.forEach((r, j) => r.forEach((ch, i) => kn_px(dst, i + dx, j + dy, ch))); }
const kn_DK = { Y:'y', y:'o', o:'O', G:'H', H:'L', L:'M', M:'D', D:'K', b:'n', n:'N', C:'c', a:'A', E:'e' };
function kn_dk(g, x, y){ const ch = g[y] && g[y][x]; if (ch && kn_DK[ch]) g[y][x] = kn_DK[ch]; }
function kn_line(g, x0, y0, x1, y1, ch){
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let k = 0; k <= n; k++) kn_px(g, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, typeof ch === 'function' ? ch(k, n) : ch);
}
/* Tuch: Zylinderschattierung quer über x0..x1, Licht von links oben */
function kn_tone(t, lift){ const nx = 2 * t - 1, l = -nx * .55 + Math.sqrt(Math.max(0, 1 - nx * nx)) * .75 + (lift || 0); return l > .86 ? 'Y' : l > .45 ? 'y' : l > .05 ? 'o' : 'O'; }
function kn_cloth(g, y, x0, x1, lift){ for (let x = x0; x <= x1; x++) kn_px(g, x, y, kn_tone((x - x0 + .5) / (x1 - x0 + 1), lift)); }

/* Reichsadler für den Schild: 9 breit von vorn, 7 breit schräg gesehen */
const kn_EAGLE7 = [
  're...er',
  '.ee.ee.',
  'e.eee.e',
  'eeeeeee',
  '.eEeEe.',
  '.e.e.e.',
  '.reeer.',
  '...e...'];
const kn_EAGLE9 = [
  'ree...eer',
  '..ee.ee..',
  'e..eee..e',
  'ee.eee.ee',
  'eeeeeeeee',
  '.eEeeeEe.',
  '..e.e.e..',
  '.r.eee.r.',
  '...e.e...'];
/* Dreiecksschild: oben gerade, unten spitz, leicht gewölbt. face: 'front' (Adler) oder 'back' (Holz, bemalter Rand) */
function kn_shield(g, x0, y0, w, h, face, dark){
  const cx = x0 + w / 2, top = Math.round(h * .48), hwOf = j => {
    if (j < top) return w / 2;
    const q = (j + .5 - top) / (h - top);
    return w / 2 * (1 - Math.pow(q, 1.7));
  };
  for (let j = 0; j < h; j++){
    const hw = hwOf(j);
    for (let x = x0; x < x0 + w; x++){
      const d = x + .5 - cx;
      if (Math.abs(d) > hw + .05) continue;
      const nx = d / (w / 2), edgeR = d > hw - 1, edgeL = d < -hw + 1, bot = Math.abs(hwOf(j + 1)) < Math.abs(d) - .05;
      let ch;
      if (face === 'back'){
        const rim = kn_TINC[kn_F.rim];
        ch = ((x - x0) % 3 === 0) ? 'W' : (nx < -.2 ? 'w' : 'W');
        if (j === 0 || edgeL || edgeR || bot) ch = edgeR || bot ? rim[1] : rim[2];
      } else {
        const T = kn_TINC[kn_F.field(d < 0, j < top)];
        const l = -nx * .45 + .58 - j / h * .2 - (dark ? .3 : 0);
        ch = T[l > .85 ? 3 : l > .42 ? 2 : l > .1 ? 1 : 0];
        if (j === 0) ch = dark ? T[1] : T[3];
        else if (edgeL && !dark) ch = T[3];
        else if (edgeR || bot) ch = dark ? T[0] : T[1];
      }
      kn_px(g, x, y0 + j, ch);
    }
  }
  if (face !== 'back') kn_F.charge(g, x0, y0, w, h, top, dark);
}
/* kleine Wappenbilder in die Viertel eines Schildes setzen: art = [oben links, oben rechts, unten links, unten rechts, unten Mitte] */
function kn_quarters(g, x0, y0, w, h, top, art){
  const xs = [x0 + Math.round(w * .27), x0 + Math.round(w * .73) - (w >= 9 ? 1 : 0)], ys = [y0 + Math.round(top * .55), y0 + top + Math.round((h - top) * .28)];
  art.forEach((a, i) => {
    if (!a) return;
    const cx = i === 4 ? Math.round(x0 + w / 2 - .5) : xs[i & 1], cy = i === 4 ? ys[1] : ys[i >> 1];
    if (w < 9){ kn_px(g, cx, cy, a[1][1] !== '.' ? a[1][1] : a[0][1]); return; }
    kn_art(g, cx - (a[0].length >> 1), cy - 1, a);
  });
}
/* Abzeichen auf dem Wappenrock: erst das Kreuz einfärben, dann das Bild darüber */
function kn_recolor(g, x, y, ramp){ const row = g[y]; if (!row) return; const i = 'OoyY'.indexOf(row[x]); if (i >= 0) row[x] = ramp[i]; }
function kn_emblem(g, view){
  if (kn_F.mark) kn_F.mark(g, view);
  const a = view === 'F' ? kn_F.chestF : kn_F.chestB;
  if (a) kn_art(g, a.x, a.y, a.rows);
}

/* Wappenrock von vorn und hinten: Schultern, kurze weite Ärmel, Leib, Schoß mit Falten */
function kn_tabard(g, folds){
  kn_cloth(g, 8, 6, 8, .25); kn_cloth(g, 8, 20, 22, .05);
  for (let y = 9; y <= 15; y++){
    const fl = y >= 12 ? 1 : 0, lift = .12 - (y - 9) * .03;
    kn_cloth(g, y, 5 - fl, 8, lift); kn_cloth(g, y, 9, 19, lift); kn_cloth(g, y, 20, 23 + fl, lift - .12);
  }
  for (let x = 4; x <= 8; x++) kn_dk(g, x, 15);
  for (let x = 20; x <= 24; x++) kn_dk(g, x, 15);
  for (let y = 16; y <= 19; y++) kn_cloth(g, y, 9, 19, -.05);
  const skirt = [[21, 9, 19], [22, 8, 20], [23, 8, 20], [24, 8, 20], [25, 7, 21], [26, 7, 21], [27, 7, 21], [28, 7, 21]];
  for (const [y, a, b] of skirt) kn_cloth(g, y, a, b, y === 21 ? -.3 : -.08);
  for (const [y] of skirt.slice(1)) for (const x of folds) kn_dk(g, x, y);
  for (let x = 7; x <= 21; x++) kn_dk(g, x, 28);
}

/* ---------- Vorderansicht (Blick nach unten) ---------- */
/* Schaller mit Visier und Sehschlitz, Nackenschirm seitlich ausgestellt, darunter der Bart */
const kn_HELM_F = [
  '....LHHLM....',
  '..LHGGHLLMD..',
  '.LHGHHHLLLMD.',
  '.HGHHHHLLLMD.',
  '.DKKKKKKKKKD.',
  '.LHGHHLLLLMD.',
  'ALHHHGLLLLMDA',
  'AKDLHGHLLMDKA',
  '.KDLHGHHLMDK.',
  '..KDLHHLMDK..'];
/* Brustadler: Köpfe beiderseits des Halsausschnitts, Schwingen bis auf die Ärmel */
const kn_EAGLE_F = [
  '.eee...eee.',
  '...ee.ee...',
  'e...eee...e',
  'ee.eeeee.ee',
  'eeeeeeeeeee',
  '.eEeeeeeEe.',
  '.e.e.e.e.e.',
  '...reeer...'];
const KN_BIB_F = ['555555', '577a75', '57aaa5', '577a75', '577a75', '578775', 'tttTT5'];   // roter Einband, Messingkreuz, Schnitt unten
const KN_BIB_B = ['5555', 'T775', 'T785', 'T775', 'T775', 'T775', '5555'];
const KN_BIB_S = ['555', '57T', '5aT', '57T', '57T', '57T', '555'];
function kn_upperF(atk){
  const g = kn_new();
  kn_tabard(g, [11, 17]);
  // Abzeichen auf der Brust, Halsausschnitt mit Brustplatte
  kn_emblem(g, 'F');
  kn_seg(g, 10, [[12, 'DHGLD']]); kn_seg(g, 11, [[13, 'DLD']]); kn_px(g, 14, 12, 'D');
  // Gürtel mit Schnalle, schräger Schwertgurt
  kn_seg(g, 20, [[9, 'NbNNNaANNNN']]);
  kn_line(g, 9, 22, 20, 25, 'N');
  // Helm
  kn_art(g, 8, 0, kn_F.helmF);
  // rechter Arm (Bildlinks): Armröhre, Armkachel mit Muschel
  kn_seg(g, 16, [[5, 'LHD']]);
  kn_seg(g, 17, [[4, 'DLGD']]);
  kn_seg(g, 18, [[4, 'KDLK']]);
  if (atk){ kn_line(g, 6, 19, 12, 23, 'L'); kn_line(g, 7, 19, 13, 23, 'M'); kn_line(g, 6, 20, 12, 24, 'D'); }
  else for (let y = 19; y <= 22; y++) kn_seg(g, y, [[5, y === 22 ? 'MHD' : 'LHD']]);
  // linker Arm: Armkachel über dem Schild
  kn_seg(g, 16, [[21, 'KLMD']]);
  // Schild, bei zweihändiger Waffe der freie linke Arm
  if (kn_F.noShield){
    kn_seg(g, 17, [[21, 'DGLD']]); kn_seg(g, 18, [[21, 'KLDK']]);
    for (let y = 19; y <= 22; y++) kn_seg(g, y, [[22, y === 22 ? 'DHM' : 'DHL']]);
    if (kn_F.bible){ kn_art(g, 22, 21, KN_BIB_F); kn_art(g, 21, 23, ['KDK', 'DHL', 'DLM', 'DLM', '.D.']); }
    else kn_art(g, 21, 23, ['KDDK', 'DHHLD', 'DLHGL', 'DMLLM', '.DK.']);
  } else kn_shield(g, 17, 17, 11, 20, 'front');
  return g;
}
const kn_HAND_F = ['KDDK', 'DLHHD', 'LGHLD', 'MLLMD', '.KD.'];
function kn_handF(){ const g = kn_new(); kn_art(g, 4, 23, kn_HAND_F); return g; }

/* Bein von vorn: Diechling, Kniebuckel mit Muschel außen, Beinröhre, spitzer Eisenschuh */
function kn_legF(x0, out, lift){
  const o = out < 0;
  const seg = [
    [[x0, 'LHMD']], [[x0, 'LHMD']], [[x0, 'LHMD']], [[x0, 'MHMD']], [[x0, 'LHMD']],
    [[x0, 'KDDK']],
    [[o ? x0 - 1 : x0 + 4, 'D'], [x0, 'LGLD']],
    [[o ? x0 - 2 : x0 + 4, o ? 'DL' : 'LD'], [x0, 'HLMD']],
    [[o ? x0 - 1 : x0 + 4, 'D'], [x0, 'MLMD']],
    [[x0, 'KDDK']],
    [[x0, 'LHMD']], [[x0, 'LHMD']], [[x0, 'LHMD']], [[x0, 'LHMD']], [[x0, 'MHMD']],
    [[x0 + 1, 'HMD']],
    [[o ? x0 - 1 : x0, 'DLHLD']],
    [[o ? x0 - 2 : x0, 'DLHHMD']],
    [[o ? x0 - 3 : x0 + 2, 'KLHMK']]
  ];
  if (lift){ seg.splice(10, lift); for (let i = 0; i < lift; i++) seg.push([]); }
  return seg;
}
function kn_front(f, atk){
  const g = kn_new(), L = kn_LIFT[f];
  const A = kn_legF(9, -1, L[0]), B = kn_legF(16, 1, L[1]);
  A.forEach((s, i) => kn_seg(g, 29 + i, s.concat(B[i])));
  // Kettenschurz zwischen Saum und Beinen
  for (let x = 9; x <= 19; x++){ kn_px(g, x, 29, (x & 1) ? 'C' : 'c'); if (x > 9 && x < 19) kn_px(g, x, 30, (x & 1) ? 'c' : 'C'); }
  for (let x = 12; x <= 16; x++) kn_px(g, x, 31, (x & 1) ? 'C' : 'c');
  kn_comp(g, kn_upperF(atk), 0, kn_BOB[f]);
  return g;
}
const kn_LIFT = [[0, 0], [2, 0], [0, 0], [0, 2], [0, 0]];
const kn_BOB = [0, 0, 1, 0, 1];

/* ---------- Rückansicht (Blick nach oben) ---------- */
/* Schaller von hinten: Glocke mit Grat, langer Nackenschirm mit Messingsaum */
const kn_HELM_B = [
  '....LHHLM....',
  '..LHGGHLLMD..',
  '.LHGHGHLLLMD.',
  '.HGHHGHLLLMD.',
  '.LHHHGLLLLMD.',
  '.LHHHLLLLLMD.',
  'LLHHHLLLLLMMD',
  'MLHHLLLLLLMDD',
  'MLLLLLLLLMMDD',
  '.AaaAAAAAAAA.'];
function kn_upperB(atk){
  const g = kn_new();
  kn_tabard(g, [11, 14, 17]);
  // Abzeichen auf dem Rücken
  kn_emblem(g, 'B');
  // Gürtel
  kn_seg(g, 20, [[9, 'NbNNNNNNNNN']]);
  // Helm
  kn_art(g, 8, 0, kn_F.helmB);
  // rechter Arm (Bildrechts) mit dem Schwert
  kn_seg(g, 16, [[21, 'LHD']]);
  kn_seg(g, 17, [[21, 'DLGD']]);
  kn_seg(g, 18, [[21, 'KLDK']]);
  if (atk){ kn_line(g, 22, 19, 16, 21, 'L'); kn_line(g, 23, 19, 17, 21, 'M'); }
  else for (let y = 19; y <= 22; y++) kn_seg(g, y, [[21, y === 22 ? 'MHD' : 'LHD']]);
  // linker Arm am Schild: Rückseite aus Holz, Unterarm in den Riemen
  if (!kn_F.noShield) kn_shield(g, 1, 17, 11, 20, 'back');
  if (kn_F.bible) kn_art(g, 1, 21, KN_BIB_B);
  kn_seg(g, 16, [[5, 'KLMD']]);
  for (let y = 17; y <= 24; y++) kn_seg(g, y, [[6, y === 17 ? 'DLGD' : 'LHMD']]);
  kn_seg(g, 25, [[5, 'DLHHD']]); kn_seg(g, 26, [[5, 'MLLMD']]);
  if (!kn_F.noShield) for (const y of [19, 23]) for (let x = 3; x <= 10; x++) kn_px(g, x, y, x === 3 || x === 10 ? 'A' : 'N');
  return g;
}
const kn_HAND_B = ['KDDK', 'DLHHD', 'LHHMD', 'MLLMD', '.DK.'];
function kn_handB(){ const g = kn_new(); kn_art(g, 20, 23, kn_HAND_B); return g; }
/* Bein von hinten: Kettenzeug an der Kniekehle, geschlossene Beinröhre, Ferse */
function kn_legB(x0, lift){
  const seg = [
    [[x0, 'cCcC']], [[x0, 'CcCc']], [[x0, 'NNNN']], [[x0, 'cCcC']], [[x0, 'CcCc']],
    [[x0, 'KDDK']],
    [[x0, 'DccD']], [[x0, 'DcCD']], [[x0, 'DccD']],
    [[x0, 'KDDK']],
    [[x0, 'LHMD']], [[x0, 'LHMD']], [[x0, 'LHMD']], [[x0, 'LHMD']], [[x0, 'MHMD']],
    [[x0 + 1, 'HMD']],
    [[x0, 'DLHD']], [[x0, 'KDKD']], [[x0, 'MLHD']]
  ];
  if (lift){ seg.splice(10, lift); for (let i = 0; i < lift; i++) seg.push([]); }
  return seg;
}
function kn_back(f, atk){
  const g = kn_new(), L = kn_LIFT[f];
  const A = kn_legB(9, L[1]), B = kn_legB(16, L[0]);
  A.forEach((s, i) => kn_seg(g, 29 + i, s.concat(B[i])));
  for (let x = 9; x <= 19; x++){ kn_px(g, x, 29, (x & 1) ? 'C' : 'c'); if (x > 9 && x < 19) kn_px(g, x, 30, (x & 1) ? 'c' : 'C'); }
  kn_comp(g, kn_upperB(atk), 0, kn_BOB[f]);
  return g;
}

/* ---------- Seitenansicht ----------
   Gemalt wird für den Blick nach rechts; m spiegelt die Lage (Blick nach links), das Licht bleibt links oben.
   Blick rechts: Schwertarm vorn, Schild am fernen Arm vor der Brust.
   Blick links: Schildarm vorn mit dem ganzen Schild, Schwertarm hinter dem Leib. */
function kn_S(g, m, dy){
  const X = x => m ? kn_W - 1 - x : x;
  return {
    g, X,
    px: (x, y, ch) => kn_px(g, X(x), y + dy, ch),
    art: (x, y, rows) => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) kn_px(g, X(x + i), y + j + dy, r[i]); }),
    seg: (y, segs) => { for (const [x, s] of segs) for (let i = 0; i < s.length; i++) kn_px(g, X(x + i), y + dy, s[i]); },
    cloth: (y, x0, x1, lift) => kn_cloth(g, y + dy, Math.min(X(x0), X(x1)), Math.max(X(x0), X(x1)), lift),
    dk: (x, y) => kn_dk(g, X(x), y + dy)
  };
}
const kn_HELM_S = [
  '......MLHHLM....',
  '....MLHGGHHLM...',
  '...MLHGHHHHLLM..',
  '...LHGHHHHHHLD..',
  '..MLHHHHHHHHKKK.',
  '.MLHHLLLLLLLHGLD',
  'ALLLDDDDKLLLMHMD',
  '..........KDLHLD',
  '..........KDHGLD',
  '...........KDLD.'];
const kn_EAGLE_SL = ['ee.ee', '.eee.', 'eeeee', '..e..'];
/* Leib im Profil: Schoß, Leib, Gürtel, naher Ärmel mit Adler, Helm */
function kn_bodyS(S){
  const skirt = [[21, 10, 17], [22, 9, 18], [23, 9, 18], [24, 9, 18], [25, 8, 19], [26, 8, 19], [27, 8, 19], [28, 8, 19]];
  S.cloth(8, 10, 15, .25);
  for (let y = 9; y <= 19; y++) S.cloth(y, 9, y >= 10 && y <= 15 ? 18 : 17, .1 - (y - 9) * .02);
  for (const [y, a, b] of skirt) S.cloth(y, a, b, y === 21 ? -.3 : -.08);
  for (const [y] of skirt.slice(1)){ S.dk(12, y); S.dk(16, y); }
  for (let x = 8; x <= 19; x++) S.dk(x, 28);
  S.seg(20, [[10, 'NNbNNNNN']]);                                               // Gürtel
  // naher Ärmel
  S.cloth(8, 10, 15, .3);
  for (let y = 9; y <= 15; y++) S.cloth(y, 10, y >= 13 ? 17 : 16, .15 - (y - 9) * .03);
  for (let x = 10; x <= 17; x++) S.dk(x, 15);
  for (let y = 10; y <= 14; y++) S.dk(y >= 13 ? 17 : 16, y);
  if (kn_F.sleeve) S.art(kn_F.sleeve[0].length > 3 ? 11 : 12, 11, kn_F.sleeve);
  S.art(5, 0, kn_F.helmS);
}
/* Bein im Profil mit Versatz von Knie (dk) und Fuß (df); fern = dunkler */
function kn_legS(dk, df){
  const T = (o, segs) => segs.map(([c, t]) => [c + o, t]);
  return [
    T(0, [[10, 'cC'], [12, 'LHMD']]), T(0, [[10, 'Cc'], [12, 'LHMD']]),
    T(dk >> 1, [[10, 'cC'], [12, 'MHMD']]), T(dk, [[10, 'Cc'], [12, 'LHMD']]), T(dk, [[11, 'c'], [12, 'LHMD']]),
    T(dk, [[11, 'K'], [12, 'KDDK']]), T(dk, [[11, 'c'], [12, 'LGLD'], [16, 'D']]), T(dk, [[11, 'D'], [12, 'HLHMD']]), T(dk, [[12, 'MLMD']]), T(dk, [[12, 'KDDK']]),
    T(df, [[11, 'MLHMD']]), T(df, [[12, 'LHMD']]), T(df, [[12, 'LHMD']]), T(df, [[12, 'LHMD']]), T(df, [[12, 'MHMD']]),
    T(df, [[13, 'LHD']]),
    T(df, [[12, 'DLHLD']]), T(df, [[12, 'KDKDKLD']]), T(df, [[11, 'MLHLLLLMDK']])
  ];
}
const kn_DARK = { L:'M', H:'L', G:'H', M:'D', D:'K', C:'c', c:'K' };
const kn_STRIDE = [[0, 0, 0, 0], [2, 3, -2, -3], [0, 0, 0, 0], [-2, -3, 2, 3], [0, 0, 0, 0]];
function kn_legsS(S, nearK, nearF, farK, farF){
  const far = kn_legS(farK, farF).map(s => s.map(([c, t]) => [c - 1, t.split('').map(ch => kn_DARK[ch] || ch).join('')]));
  const near = kn_legS(nearK, nearF);
  far.forEach((s, i) => S.seg(29 + i, s));
  near.forEach((s, i) => S.seg(29 + i, s));
}
/* Kettenschurz unter dem Saum */
function kn_mailS(S){ for (let x = 10; x <= 17; x++){ S.px(x, 29, (x & 1) ? 'C' : 'c'); if (x > 10 && x < 17) S.px(x, 30, (x & 1) ? 'c' : 'C'); } }
/* naher Schwertarm (Blick rechts): Armröhre, Armkachel, Unterarm nach vorn */
function kn_swordArmS(S){
  S.seg(16, [[12, 'LHMD']]);
  S.seg(17, [[12, 'DLGHD']]);
  S.seg(18, [[12, 'KDLDK']]);
  S.seg(19, [[13, 'LHMD']]); S.seg(20, [[13, 'LHMD']]); S.seg(21, [[14, 'LHD']]); S.seg(22, [[14, 'KDK']]);
}
function kn_swordArmAtkS(S){
  S.seg(16, [[12, 'LHMD']]); S.seg(17, [[12, 'DLGHD']]); S.seg(18, [[12, 'KDLDK']]);
  for (let k = 0; k <= 4; k++){ S.px(13 + k, 19 + k * .8, 'L'); S.px(14 + k, 19 + k * .8, 'M'); S.px(13 + k, 20 + k * .8, 'D'); }
}
const kn_HAND_S = ['DLHD', 'LGHMD', 'MLLMD', '.KDK'];
function kn_side(f, m, atk){
  const g = kn_new(), b = kn_BOB[f], U = kn_S(g, m, b), Lg = kn_S(g, m, 0);
  if (!m && !kn_F.noShield) kn_shield(g, 18, 17 + b, 7, 20, 'front', true);    // ferner Schild vor der Brust
  else { U.seg(21, [[14, 'MLD']]); U.seg(22, [[15, 'DMD']]); }                 // ferner Schwertarm
  kn_legsS(Lg, ...kn_STRIDE[f]);
  kn_mailS(Lg);
  kn_bodyS(U);
  if (!m){ if (atk) kn_swordArmAtkS(U); else kn_swordArmS(U); if (kn_F.bible) U.art(19, 18, KN_BIB_S); }
  else if (kn_F.noShield){ kn_swordArmS(U); if (kn_F.bible) U.art(13, 20, KN_BIB_S); }                                     // zweihändig: naher Arm frei
  else {                                                                        // naher Schildarm mit Schild
    U.seg(16, [[13, 'LHMD']]); U.seg(17, [[13, 'DLGHD']]);
    kn_shield(g, 5, 17 + b, 10, 20, 'front');
  }
  return g;
}
function kn_handS(f, m){
  const g = kn_new(), S = kn_S(g, m, kn_BOB[f]);
  if (!m) S.art(13, 23, kn_HAND_S);
  else S.art(14, 22, ['DLD', 'MLHD', '.DK']);
  return g;
}

/* ---------- Das Langschwert ----------
   Scheibenknauf, lederumwickelte Hilze, gerade Parierstange, zweischneidige Klinge mit Hohlkehle. */
function kn_sword(k){
  const len = 36 * k, wq = 5 * k, c = canvasOf(len + 2, wq * 2 + 2), g = c.getContext('2d'), cy = wq + 1;
  const P = (t, q, col, w, h) => { g.fillStyle = col; g.fillRect(Math.round(t * k) + 1, Math.round(cy + q * k), w || Math.max(1, Math.round(k)), h || Math.max(1, Math.round(k))); };
  const I = ['#2b2d31', '#53575d', '#82878d', '#b4b9be', '#dfe3e6'], Lr = ['#2a1812', '#4a2a1d', '#6b3d29', '#8a5537'];
  // Scheibenknauf
  for (let q = -1; q <= 1; q++) P(0, q, q < 0 ? I[3] : q === 0 ? I[2] : I[1]);
  for (let q = -1; q <= 2; q++) P(1, q - .5, q < 0 ? I[4] : q < 2 ? I[2] : I[1]);
  // Hilze
  for (let t = 2; t < 7; t++){ P(t, 0, t % 2 ? Lr[3] : Lr[2]); P(t, 1, t % 2 ? Lr[1] : Lr[0]); }
  // Parierstange
  for (let q = -3; q <= 4; q++) P(7, q, q < 0 ? I[3] : q < 2 ? I[2] : I[1]);
  P(6, -3, I[2]); P(6, 4, I[1]); P(8, -3, I[1]); P(8, 4, I[0]);
  // Klinge: 2 px breit, dann 1 px, helle Spitze
  for (let t = 8; t < 30; t++){ P(t, 0, '#e4e8ea'); P(t, 1, '#8f979f'); }
  for (let t = 30; t < 35; t++) P(t, t < 33 ? 0 : .5, '#c9ced3');
  P(35, .5, '#f4f6f7');
  if (k > 1.5) for (let t = 8; t < 26; t++) P(t, .5, '#6a727a', Math.round(k), 1);           // Hohlkehle
  return { img: c, gx: 4.5 * k + 1, gy: cy };
}
const SWORD = { len: 36, gripBack: 5 };
const kn_SW = kn_sword(1);
const kn_SWR = Array.from({ length: 64 }, (_, i) => rotateNN(kn_SW.img, i / 64 * Math.PI * 2, kn_SW.gx + .5, kn_SW.gy + .5));
function drawSword(g, x, y, angle, rots){
  const i = ((Math.round(angle / (Math.PI * 2) * 64) % 64) + 64) % 64, r = (rots || kn_SWR)[i];
  g.drawImage(r.img, Math.round(x - r.ox), Math.round(y - r.oy));
}
const SWORD_ICON = kn_sword(2).img;

/* ---------- Die Ritter Europas um 1520 ----------
   Jede Herkunft legt fest: Tuchfarben des Wappenrocks, Abzeichen auf Brust, Rücken und Ärmel,
   Helmform (vorn, hinten, seitlich), Federbusch und das Wappen im Schild. */
const kn_RED = '5678';
const kn_LILY3 = ['.4.', '434', '3.3'];
const kn_LION3 = ['3..4', '.444', '.3.3'];
const kn_CASTLE3 = ['4.4.4', '44444', '44.44'];
const kn_LIONP3 = ['.p.', 'pPp', 'P.P'];
/* große Lilie für Brust und Rücken */
const kn_LILY_F = [
  '....4....',
  '...344...',
  '...343...',
  '3..343..3',
  '43.343.34',
  '.4334433.',
  '222222222',
  '...343...',
  '..3.3.3..'];
/* Armet: runder geschlossener Helm, hinten die Scheibe, oben der Federbusch */
const kn_ARMET_F = [
  '.....gfF.....',
  '....gfgF.....',
  '...LHfgLM....',
  '..LHGGHLLMD..',
  '.LHGHHHLLLMD.',
  '.DKKKKKKKKKD.',
  '.LHGHKHKLLMD.',
  '.MLHGHHLLLMD.',
  '..KLHGHLLMK..',
  '...KDLLLDK...'];
const kn_ARMET_B = [
  '.....gfF.....',
  '....gfgF.....',
  '...LHfgLM....',
  '..LHGGHLLMD..',
  '.LHGHHHLLLMD.',
  '.LHHHGHLLLMD.',
  '.LHHHHLLLLMD.',
  '.MLHHHLLLLMD.',
  '..KLHAaALMK..',
  '...KDAaADK...'];
const kn_ARMET_S = [
  '..gfF...........',
  '..fgfF.LHHLM....',
  '...fF.LHGGHLM...',
  '....MLHGHHHHLM..',
  '....LHGHHHHHLLD.',
  '....LHHHHHHKKKK.',
  '....MLHHHHHLLHGD',
  '...AaMLHHHHLLMD.',
  '....ADLHHHLLMD..',
  '......KDLLLMD...'];
/* geschlossener Helm aus Greenwich: hoher Kamm, Visier mit zwei Sehschlitzen */
const kn_CLOSE_F = [
  '......H......',
  '.....LGM.....',
  '...LHHGHLM...',
  '..LHGHGHLMD..',
  '.LHGHHGHLLMD.',
  '.DKKKKKKKKKD.',
  '.LHGHHGLLLMD.',
  '.DKKKKKKKKKD.',
  '..KLHGHLLMK..',
  '...KDLLMDK...'];
const kn_CLOSE_B = [
  '......H......',
  '.....LGM.....',
  '...LHHGHLM...',
  '..LHGHGHLMD..',
  '.LHGHHGHLLMD.',
  '.LHHHHGLLLMD.',
  '.LHHHHGLLLMD.',
  '.MLHHHLLLLMD.',
  '..KLHHHLLMK..',
  '...KDLLMDK...'];
const kn_CLOSE_S = [
  '.......MHHM.....',
  '......LHGGHL....',
  '.....LHGHHHHLM..',
  '....LHGHHHHHHLD.',
  '....LHHHHHHKKKK.',
  '....LHHHHHHLHGLD',
  '....MLHHHHHKKKKD',
  '....MLHHHHHLLMD.',
  '.....KDLHHLLMD..',
  '......KDLLMD....'];
/* Borgoñota: offener Helm mit Schirm, Kamm, Wangenklappen und Nackenschutz, roter Federbusch */
const kn_BORG_F = [
  '.....gf......',
  '....gfFM.....',
  '...LHGFHLM...',
  '..LHGHGHLLD..',
  '.LHGHHGHLLMD.',
  'DLHHHHHHHLLMD',
  '.DLDqezezDLD.',
  '.DLDqqzzZDLD.',
  '.KDLqzZzZLDK.',
  '..KDLzZzLDK..'];
const kn_BORG_B = [
  '.....gf......',
  '....gfFM.....',
  '...LHGFHLM...',
  '..LHGHGHLLD..',
  '.LHGHHGHLLMD.',
  '.LHHHHGLLLMD.',
  '.MLHHHGLLLMD.',
  'LLHHHLLLLLMMD',
  'MLLLLLLLLLMDD',
  '.DDDDDDDDDDD.'];
const kn_BORG_S = [
  '...gf..MHHM.....',
  '...fF.LHGGHL....',
  '....FLHGHHHHLM..',
  '....LHGHHHHHHLD.',
  '....LHHHHHHHHHHD',
  '...MLHHHHHLDqqz.',
  '..MLLHHHHHLDqez.',
  'LLLMLHHHHHLDqzZ.',
  '..KDLLHHHLLDzZ..',
  '.......KDLLDZ...'];
/* Burgunderkreuz: zwei gekreuzte Äste mit Aststummeln */
function kn_markSaltire(g){
  for (let i = 0; i <= 40; i++){
    const t = i / 40, y = Math.round(10 + t * 17), a = 9.5 + t * 9, b = 18.5 - t * 9;
    for (const c of [a, b]){ kn_recolor(g, Math.round(c - .5), y, kn_RED); kn_recolor(g, Math.round(c + .5), y, kn_RED); }
  }
  [.18, .42, .66, .86].forEach((t, i) => {
    const y = Math.round(10 + t * 17), a = 9.5 + t * 9, b = 18.5 - t * 9, sd = i & 1 ? 1 : -1;
    kn_recolor(g, Math.round(a + sd * 2), y, kn_RED); kn_recolor(g, Math.round(b - sd * 2), y + 1, kn_RED);
  });
}
/* Georgskreuz: rotes Kreuz über Brust und Rücken */
function kn_markCross(g){
  for (let y = 8; y <= 28; y++) for (let x = 13; x <= 15; x++) kn_recolor(g, x, y, kn_RED);
  for (let y = 13; y <= 15; y++) for (let x = 9; x <= 19; x++) kn_recolor(g, x, y, kn_RED);
}
const KN_FACTIONS = {
  reich: {
    name:'Heiliges Römisches Reich', knight:'Reichsritter', ruler:'Kaiser Karl V.', cry:'Für Kaiser und Reich!',
    bonus:{ hpPct:5 }, bonusText:'+5 % Leben',
    desc:'Ritter Kaiser Karls V., 1519 gewählt und 1520 in Aachen gekrönt. Gelber Wappenrock mit dem schwarzen Doppeladler, deutsche Schaller mit Bart und ein Dreiecksschild mit dem Reichsadler.',
    cloth:{}, field: () => 'or', rim:'or',
    charge(g, x0, y0, w, h, top, dark){ const E = w >= 9 ? kn_EAGLE9 : kn_EAGLE7; kn_art(g, Math.round(x0 + w / 2 - E[0].length / 2), y0 + 2, dark ? E.map(r => r.replace(/E/g, 'e')) : E); },
    chestF:{ x:9, y:12, rows:kn_EAGLE_F }, chestB:{ x:9, y:11, rows:kn_EAGLE_F }, sleeve:kn_EAGLE_SL,
    helmF:kn_HELM_F, helmB:kn_HELM_B, helmS:kn_HELM_S
  },
  frankreich: {
    name:'Königreich Frankreich', knight:'Chevalier de France', ruler:'König Franz I.', cry:'Montjoie Saint-Denis!',
    bonus:{ dmgPct:5 }, bonusText:'+5 % Schaden',
    desc:'Gendarm einer Ordonnanzkompanie König Franz’ I., des Siegers von Marignano 1515. Blauer Rock mit den goldenen Lilien Frankreichs, geschlossener Armet mit weißem Federbusch.',
    cloth:{ O:'#141e48', o:'#22357a', y:'#3452a8', Y:'#5a7ad0' }, field: () => 'az', rim:'az',
    charge(g, x0, y0, w, h, top){ kn_quarters(g, x0, y0, w, h, top, [kn_LILY3, kn_LILY3, null, null, kn_LILY3]); },
    chestF:{ x:10, y:11, rows:kn_LILY_F }, chestB:{ x:10, y:10, rows:kn_LILY_F }, sleeve:kn_LILY3,
    helmF:kn_ARMET_F, helmB:kn_ARMET_B, helmS:kn_ARMET_S
  },
  england: {
    name:'Königreich England', knight:'Knight of England', ruler:'König Heinrich VIII.', cry:'Saint George!',
    bonus:{ crit:3 }, bonusText:'+3 % Volltreffer',
    desc:'Ritter König Heinrichs VIII., der 1520 auf dem Feld des Güldenen Tuches Franz I. traf. Weißer Rock mit dem roten Georgskreuz, geschlossener Helm aus der Plattnerei von Greenwich; im Schild die Leoparden Englands und die Lilien Frankreichs.',
    cloth:{ O:'#7e7a70', o:'#aeaa9c', y:'#d8d4c6', Y:'#f6f2e6' }, field: (left, up) => left === up ? 'az' : 'gu', rim:'gu',
    charge(g, x0, y0, w, h, top){ kn_quarters(g, x0, y0, w, h, top, [kn_LILY3, kn_LION3, kn_LION3, kn_LILY3]); },
    mark: kn_markCross, sleeve:['.7.', '878', '.7.'],
    helmF:kn_CLOSE_F, helmB:kn_CLOSE_B, helmS:kn_CLOSE_S
  },
  spanien: {
    name:'Kastilien und Aragón', knight:'Caballero de Castilla', ruler:'König Karl I. (zugleich Kaiser Karl V.)', cry:'¡Santiago!',
    bonus:{ spd:5 }, bonusText:'+5 % Hiebtempo',
    desc:'Caballero König Karls I. von Kastilien und Aragón, der zugleich Kaiser ist. Weißer Rock mit dem roten Burgunderkreuz, dem Feldzeichen der spanischen Truppen; offene Borgoñota mit rotem Busch, im Schild Burg und Löwe von Kastilien und León.',
    cloth:{ O:'#7e7a70', o:'#aeaa9c', y:'#d8d4c6', Y:'#f6f2e6' }, pal:{ F:'#5a1012', f:'#b8302a', g:'#e8705e' },
    field: (left, up) => left === up ? 'gu' : 'ar', rim:'gu',
    charge(g, x0, y0, w, h, top){ kn_quarters(g, x0, y0, w, h, top, [kn_CASTLE3, kn_LIONP3, kn_LIONP3, kn_CASTLE3]); },
    mark: kn_markSaltire, sleeve:['7.7', '.8.', '7.7'],
    helmF:kn_BORG_F, helmB:kn_BORG_B, helmS:kn_BORG_S
  }
};
for (const F of Object.values(KN_FACTIONS)) F.pal = Object.assign({}, kn_PAL, F.cloth, F.pal || {});
const FACTION_IDS = Object.keys(KN_FACTIONS);
/* ---------- Ausrüstung am Ritter sichtbar: Harnischglanz nach Rüstung, Federbusch nach Helm, Schildrand nach Schild ----------
   look: fünf Zeichen, Seltenheit von Rüstung, Helm, Schild (n = nichts), dann Grundform und Seltenheit der Waffe */
const GEAR_STEEL = [
  { K:'#1e2024', D:'#373b41', M:'#565c64', L:'#787f88', H:'#98a0a8', G:'#b8bec5' },                                  // matt geschmiedet
  null,                                                                                                               // blank poliert
  { K:'#121828', D:'#26344e', M:'#405676', L:'#6682a6', H:'#98b0cc', G:'#d6e2f0' },                                   // gebläut
  { K:'#0c0c10', D:'#1c1c22', M:'#30303a', L:'#4c4c58', H:'#72727e', G:'#a6a6b0', A:'#c49a3a', a:'#f4da82' },          // geschwärzt, Messing
  { K:'#3a2810', D:'#6c521e', M:'#9c7a30', L:'#c49e46', H:'#e4c466', G:'#fbeaa6', A:'#d8a838', a:'#fff0a0' }           // vergoldet
];
const GEAR_PLUME = [null, null, { F:'#1e3a7a', f:'#4a6ac8', g:'#a8c0f4' }, { F:'#4a1e5a', f:'#8a4aa8', g:'#cfa2e8' }, { F:'#8a4a0c', f:'#e0a028', g:'#ffe68a' }];
const GEAR_RIM = [null, null, 'ar', 'or', 'or'];
const GEAR_NAME = ['matt geschmiedet', 'blank poliert', 'gebläut', 'geschwärzt mit Messing', 'vergoldet'];
const lookOf = eq => { const r = it => it ? String(it.r) : 'n', wt = wtOf(eq.waffe); return r(eq.ruestung) + r(eq.helm) + (WT[wt].hand === 2 ? 'x' : isBib(eq.schild) ? 'b' : r(eq.schild)) + (eq.waffe ? Math.min(4, eq.waffe.b) + '' + eq.waffe.r : 'nn') + (wt === 'schwert' ? '' : WT[wt].code); };
const LOOK_RE = /^[0-4n]{2}[0-4nxb][0-4n]{2}[shza]?$/;
function knightFaction(fid, body){
  const base = KN_FACTIONS[fid] || KN_FACTIONS.reich;
  if (!body) return base;
  const a = body[0] === 'n' ? 0 : +body[0], h = body[1] === 'n' ? -1 : +body[1], s = body[2] === 'n' || body[2] === 'x' || body[2] === 'b' ? -1 : +body[2];
  const F = Object.create(base);
  F.noShield = body[2] === 'x' || body[2] === 'b'; F.bible = body[2] === 'b';
  F.pal = Object.assign({}, base.pal, GEAR_STEEL[a] || {}, h >= 2 ? GEAR_PLUME[h] : {});
  if (s >= 2) F.rim = GEAR_RIM[s];
  return F;
}
/* Schwert nach Grundform (Länge, Griff) und Seltenheit (Klinge, Gefäß) */
const SW_COL = [
  { I: ['#24262a', '#44484e', '#6a6e74', '#909499', '#b2b6ba'], b1: '#b6babe', b2: '#6c7278', tip: '#a8aeb4', Lr: ['#2a1812', '#4a2a1d', '#6b3d29', '#8a5537'] },
  { I: ['#2b2d31', '#53575d', '#82878d', '#b4b9be', '#dfe3e6'], b1: '#e4e8ea', b2: '#8f979f', tip: '#c9ced3', Lr: ['#2a1812', '#4a2a1d', '#6b3d29', '#8a5537'] },
  { I: ['#3a3e46', '#6a707a', '#9aa2ae', '#ccd4de', '#f2f6fa'], b1: '#eef4ff', b2: '#8aa2c4', tip: '#dfe8f8', Lr: ['#141c30', '#24304a', '#344466', '#4a5c82'] },
  { I: ['#4e3812', '#8a6420', '#c49a3a', '#e8c45a', '#fbe08a'], b1: '#d8d8e2', b2: '#4c4c5a', tip: '#c4c4d0', Lr: ['#0e0e12', '#1c1c22', '#2c2c34', '#3e3e48'] },
  { I: ['#5a3e10', '#9a7020', '#d4a83a', '#f0cc5a', '#fff0a0'], b1: '#fffdf2', b2: '#c8a868', tip: '#ffffff', Lr: ['#3a0a0a', '#5a1414', '#7a1e1e', '#9a2a2a'], gem: '#d8282a' }
];
function kn_swordLook(b, r){
  const k = 1, grip = [4, 4, 5, 6, 8][b], blade = [20, 24, 26, 29, 32][b], gw = [2, 3, 3, 3, 4][b], C = SW_COL[r];
  const gEnd = 2 + grip, bl0 = gEnd + 1, tip = bl0 + blade, len = tip + 2, wq = gw + 2;
  const c = canvasOf(len + 2, wq * 2 + 2), g = c.getContext('2d'), cy = wq + 1, I = C.I;
  const P = (t, q, col) => { g.fillStyle = col; g.fillRect(Math.round(t) + 1, Math.round(cy + q), 1, 1); };
  for (let q = -1; q <= 1; q++) P(0, q, q < 0 ? I[3] : q === 0 ? (C.gem || I[2]) : I[1]);
  for (let q = -1; q <= 2; q++) P(1, q - .5, q < 0 ? I[4] : q < 2 ? I[2] : I[1]);
  for (let t = 2; t < gEnd; t++){ P(t, 0, t % 2 ? C.Lr[3] : C.Lr[2]); P(t, 1, t % 2 ? C.Lr[1] : C.Lr[0]); }
  for (let q = -gw; q <= gw + 1; q++) P(gEnd, q, q < 0 ? I[3] : q < 2 ? I[2] : I[1]);
  P(gEnd - 1, -gw, I[2]); P(gEnd - 1, gw + 1, I[1]); P(gEnd + 1, -gw, I[1]); P(gEnd + 1, gw + 1, I[0]);
  if (r >= 3){ P(gEnd - 1, -gw + 1, I[4]); P(gEnd + 1, gw, I[3]); }
  for (let t = bl0; t < tip - 5; t++){ P(t, 0, C.b1); P(t, 1, C.b2); }
  for (let t = tip - 5; t < tip; t++) P(t, t < tip - 2 ? 0 : .5, C.tip);
  P(tip, .5, '#f4f6f7');
  if (r >= 2) for (let t = bl0 + 2; t < tip - 6; t += 5) P(t, 0, '#ffffff');      // Glanzpunkte
  return { img: c, gx: (2 + grip / 2) * k + 1, gy: cy };
}
const SWORD_LOOK = {};
function swordSet(wl){
  if (!wl || wl[0] === 'n') wl = '21';
  return SWORD_LOOK[wl] || (SWORD_LOOK[wl] = (() => { const S = kn_swordLook(+wl[0], +wl[1]); return Array.from({ length: 64 }, (_, i) => rotateNN(S.img, i / 64 * Math.PI * 2, S.gx + .5, S.gy + .5)); })());
}


/* ---------- Hellebarde, Zweihänder, Armbrust: waagrecht nach rechts, Griffpunkt gx/gy, wie das Schwert in 64 Drehungen ---------- */
const WOOD_C = ['#2a1810', '#4a2c1a', '#6a4426', '#8a5c34'];
function kn_hellebardeLook(b, r){
  const C = SW_COL[r], I = C.I, sh = [44, 46, 48, 50, 52][b], grip = 12;
  const c = canvasOf(sh + 12, 22), g = c.getContext('2d'), cy = 10;
  const P = (t, q, col) => { g.fillStyle = col; g.fillRect(Math.round(t) + 1, Math.round(cy + q), 1, 1); };
  // Schaft aus Eschenholz, Eisenschuh am Ende, Lederwicklung am Griff
  for (let t = 0; t < sh; t++){ P(t, 0, t % 7 === 3 ? WOOD_C[2] : WOOD_C[3]); P(t, 1, WOOD_C[1]); }
  P(0, 0, I[2]); P(0, 1, I[1]); P(1, 0, I[3]); P(1, 1, I[1]);
  for (let t = grip - 2; t < grip + 3; t++){ P(t, 0, C.Lr[t % 2 ? 3 : 2]); P(t, 1, C.Lr[t % 2 ? 1 : 0]); }
  // Schaftfedern: Eisenbänder unter dem Kopf
  for (let t = sh - 9; t < sh; t++){ P(t, -1, I[2]); P(t, 2, I[1]); }
  // Beil oben mit sichelförmiger Schneide
  for (let q = -1; q >= -7; q--){
    const wide = q <= -5 ? -q - 4 : 0, t0 = sh - 7 - wide, t1 = sh - 1 + Math.round(wide * .5);
    for (let t = t0; t <= t1; t++) P(t, q, q === -7 ? C.b1 : q === -6 ? (t === t0 || t === t1 ? I[2] : I[4]) : (t === t0 ? I[1] : I[3]));
  }
  // Haken unten, Stoßklinge vorn
  for (let k = 0; k < 4; k++) P(sh - 4 - k, 2 + Math.round(k * .8), k === 3 ? I[1] : I[2]);
  for (let t = sh; t < sh + 9; t++){ P(t, 0, C.b1); if (t < sh + 6) P(t, 1, C.b2); }
  P(sh + 9, .5, '#f4f6f7');
  if (r >= 2) P(sh - 3, -4, '#ffffff');
  if (C.gem) P(sh - 4, 0, C.gem);
  return { img: c, gx: grip + 1.5, gy: cy + .5 };
}
function kn_zweiLook(b, r){
  const C = SW_COL[r], I = C.I, grip = [8, 9, 10, 10, 11][b], ric = 4, blade = [28, 31, 34, 36, 38][b], gw = 5;
  const gEnd = 2 + grip, bl0 = gEnd + 1, tip = bl0 + ric + blade, wq = gw + 2;
  const c = canvasOf(tip + 4, wq * 2 + 4), g = c.getContext('2d'), cy = wq + 1;
  const P = (t, q, col) => { g.fillStyle = col; g.fillRect(Math.round(t) + 1, Math.round(cy + q), 1, 1); };
  // Knauf, lange Hilze
  for (let q = -1; q <= 2; q++) P(0, q - .5, q < 0 ? I[3] : q < 2 ? I[2] : I[1]);
  P(1, 0, I[4]); P(1, 1, I[2]);
  for (let t = 2; t < gEnd; t++){ P(t, 0, t % 2 ? C.Lr[3] : C.Lr[2]); P(t, 1, t % 2 ? C.Lr[1] : C.Lr[0]); }
  // breite Parierstange mit Enden nach vorn
  for (let q = -gw; q <= gw + 1; q++) P(gEnd, q, q < 0 ? I[3] : q < 2 ? I[2] : I[1]);
  P(gEnd + 1, -gw, I[2]); P(gEnd + 2, -gw, I[1]); P(gEnd + 1, gw + 1, I[1]); P(gEnd + 2, gw + 1, I[0]);
  // Fehlschärfe mit Leder und Parierhaken
  for (let t = bl0; t < bl0 + ric; t++){ P(t, 0, C.Lr[2]); P(t, 1, C.Lr[0]); }
  P(bl0 + ric - 1, -1, I[3]); P(bl0 + ric - 1, -2, I[2]); P(bl0 + ric - 1, 2, I[2]); P(bl0 + ric - 1, 3, I[1]);
  // Klinge drei Pixel breit, beim Flamberg gewellt
  const wave = b === 3;
  for (let t = bl0 + ric; t < tip - 5; t++){ const o = wave ? Math.round(Math.sin(t * .9) * .7) : 0; P(t, -1 + o, C.b1); P(t, o, C.b1); P(t, 1 + o, C.b2); }
  for (let t = tip - 5; t < tip; t++){ P(t, t < tip - 2 ? 0 : .5, C.tip); if (t < tip - 3) P(t, 1, C.b2); }
  P(tip, .5, '#f4f6f7');
  if (r >= 2) for (let t = bl0 + ric + 2; t < tip - 6; t += 6) P(t, -1, '#ffffff');
  if (C.gem) P(gEnd, .5, C.gem);
  return { img: c, gx: 2 + grip * .55 + 1, gy: cy };
}
function kn_armbrustLook(b, r){
  const C = SW_COL[r], I = C.I, st = [20, 21, 22, 23, 24][b], sp = [6, 7, 7, 8, 8][b];
  const c = canvasOf(st + 8, sp * 2 + 6), g = c.getContext('2d'), cy = sp + 2;
  const P = (t, q, col) => { g.fillStyle = col; g.fillRect(Math.round(t) + 1, Math.round(cy + q), 1, 1); };
  // Säule aus Holz, hinten der breitere Kolben, unten Abzug
  for (let t = 0; t < st; t++){ P(t, 0, t % 6 === 2 ? WOOD_C[2] : WOOD_C[3]); P(t, 1, WOOD_C[1]); if (t < 6){ P(t, -1, WOOD_C[2]); P(t, 2, WOOD_C[0]); } }
  P(8, 2, I[2]); P(8, 3, I[1]); P(9, 3, I[1]);
  // Bolzen in der Rinne mit Federn
  for (let t = 10; t < st + 2; t++) P(t, -1, t < 12 ? '#c8c0a8' : '#8a6a44');
  P(st + 2, -1, I[3]); P(st + 3, -1, I[4]);
  // Bogen quer an der Spitze (Horn oder Stahl), die Enden nach hinten gebogen
  const pb = st - 2, bow = b >= 2 ? I : ['#3a2a18', '#5a4226', '#7a5a34', '#9a7448', '#b08a5a'];
  for (let q = -sp; q <= sp + 1; q++){ const bend = Math.round(((q - .5) / sp) ** 2 * 2.5); P(pb - bend, q, bow[3]); P(pb - bend + 1, q, bow[1]); }
  // Sehne von den Bogenenden zur Nuss
  for (let q = -sp + 1; q <= sp; q++){ const tt = Math.round(pb - 3 - (sp - Math.abs(q - .5)) * .8); P(tt, q, '#d8d0b8'); }
  P(12, 0, I[2]);
  if (r >= 2) P(pb, -sp, '#ffffff');
  if (C.gem) P(4, 0, C.gem);
  return { img: c, gx: 7.5, gy: cy + .5 };
}
const WEAPON_LOOK = {};
function weaponSet(wt, wl){
  if (wt === 'schwert' || !WT[wt]) return swordSet(wl);
  if (!wl || wl[0] === 'n') wl = '21';
  const key = wt + wl;
  return WEAPON_LOOK[key] || (WEAPON_LOOK[key] = (() => {
    const S = (wt === 'hellebarde' ? kn_hellebardeLook : wt === 'zweihaender' ? kn_zweiLook : kn_armbrustLook)(+wl[0], +wl[1]);
    return Array.from({ length: 64 }, (_, i) => rotateNN(S.img, i / 64 * Math.PI * 2, S.gx + .5, S.gy + .5));
  })());
}
/* Haltung ohne Hieb: Hellebarde aufrecht, Zweihänder über der Schulter, Armbrust gesenkt in der Hand */
const WT_CARRY = {
  hellebarde:  { down: { x: -9, y: -21, a: -1.72, behind: false }, up: { x: 9, y: -21, a: -1.42, behind: true }, right: { x: 4, y: -22, a: -1.3, behind: false }, left: { x: -4, y: -22, a: -1.84, behind: true } },
  zweihaender: { down: { x: -8, y: -22, a: -1.95, behind: false }, up: { x: 8, y: -22, a: -1.2, behind: true }, right: { x: 2, y: -24, a: -2.1, behind: false }, left: { x: -2, y: -24, a: -1.05, behind: true } },
  armbrust:    { down: { x: -8, y: -21, a: 2.0, behind: false }, up: { x: 8, y: -21, a: Math.PI - 2.0, behind: true }, right: { x: 1, y: -22, a: 1.2, behind: false }, left: { x: -3, y: -23, a: Math.PI - 1.2, behind: true } }
};
/* Armbrust im Anschlag: Griffpunkt je Blickrichtung, gedreht wird nach dem Ziel */
const XB_AIM = { down: { x: 2, y: -28, behind: false }, up: { x: 5, y: -37, behind: true }, right: { x: 3, y: -23, behind: false }, left: { x: -3, y: -23, behind: true } };
/* ---------- Zusammensetzen ---------- */
function kn_frame(grid, handGrid){
  const rows = grid.map(r => r.join(''));
  const fr = spriteOf(makeSprite(rows, kn_F.pal, OUT));
  if (handGrid) fr.hands = makeSprite(handGrid.map(r => r.join('')), kn_F.pal, OUT);
  return fr;
}
const KNIGHT_GRIP = { down: { x: 0, y: -24 }, up: { x: 0, y: -28 }, right: { x: 5, y: -25 }, left: { x: -5, y: -25 } };
const KNIGHT_CARRY = {
  down:  { x: -8, y: -23, a: 2.2, behind: false },
  up:    { x: 8, y: -23, a: Math.PI - 2.2, behind: true },
  right: { x: 1, y: -24, a: 1.25, behind: false },
  left:  { x: -3, y: -25, a: Math.PI - 1.15, behind: true }
};
/* alle Bilder eines Ritters: Gehen, Hieb, Treffer, Sturz, Infotafel und Schild als Symbol */
function kn_buildSet(id, body){
  const prev = kn_F; kn_F = knightFaction(id, body);
  const walk = { down: [], up: [], right: [], left: [] }, atk = { down: [], up: [], right: [], left: [] }, hit = {}, fall = {};
  const ax = kn_PAD + kn_CX, ay = kn_PAD + kn_H;
  for (let f = 0; f < 5; f++){
    let hg = kn_new(); kn_comp(hg, kn_handF(), 0, kn_BOB[f]);
    let body = kn_front(f); kn_comp(body, hg, 0, 0); walk.down.push(kn_frame(body, hg));
    hg = kn_new(); kn_comp(hg, kn_handB(), 0, kn_BOB[f]);
    body = kn_back(f); kn_comp(body, hg, 0, 0); walk.up.push(kn_frame(body, hg));
    for (const [d, m] of [['right', false], ['left', true]]){
      const h2 = kn_handS(f, m), b2 = kn_side(f, m);
      if (!m) kn_comp(b2, h2, 0, 0);
      walk[d].push(kn_frame(b2, h2));
    }
  }
  for (let f = 0; f < 5; f++){
    atk.down.push(kn_frame(kn_front(f, true)));
    atk.up.push(kn_frame(kn_back(f, true)));
    atk.right.push(kn_frame(kn_side(f, false, true)));
    atk.left.push(walk.left[f]);
  }
  for (const d of ['down', 'up', 'right', 'left']){
    // kurz nach einem Treffer: rot überzogen
    const src = walk[d][0].img, c = canvasOf(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(214,40,40,.55)'; g.fillRect(0, 0, c.width, c.height);
    hit[d] = [spriteOf(c)];
    // Sterben: der Ritter kippt um die Füße zur Seite (pixelscharf gedreht)
    const sd = d === 'left' ? -1 : 1;
    fall[d] = [.35, .8, 1.25, 1.57].map(a => rotateNN(src, sd * a, ax, ay - 1));
  }
  // Infotafel: von vorn mit Schwert und Schild, knapp zugeschnitten
  const plate = (() => {
    const fr = walk.down[0], cr = KNIGHT_CARRY.down, n = 90, c = canvasOf(n, n), g = c.getContext('2d'), x = 46, y = 70;
    g.drawImage(fr.img, x - ax, y - ay);
    drawSword(g, x + cr.x, y + cr.y, 1.95);
    g.drawImage(fr.hands, x - ax, y - ay);
    const dd = g.getImageData(0, 0, n, n).data;
    let x0 = n, y0 = n, x1 = 0, y1 = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (dd[(j * n + i) * 4 + 3]){ x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
    const out = canvasOf(x1 - x0 + 5, y1 - y0 + 5);
    out.getContext('2d').drawImage(c, x0 - 2, y0 - 2, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  })();
  // Schild als Symbol (16 × 16) für Fähigkeiten und Tafeln
  const icon = (() => {
    const g = kn_new(); kn_shield(g, 1, 0, 11, 14, 'front');
    const rows = g.slice(0, 14).map(r => r.slice(0, 13).join(''));
    const sp = makeSprite(rows, kn_F.pal, OUT), c = canvasOf(16, 16);
    c.getContext('2d').drawImage(sp, 1, 0);
    return c;
  })();
  kn_F = prev;
  return { id, walk, atk, hit, fall, plate, icon };
}
const KN_SETS = {}, KN_LOOKS = {};
/* Bildersatz eines Ritters: Herkunft und Aussehen der Ausrüstung (look, siehe lookOf) */
function knightSet(id, look){
  if (!KN_FACTIONS[id]) id = 'reich';
  if (!look || !LOOK_RE.test(look)) return KN_SETS[id] || (KN_SETS[id] = Object.assign(kn_buildSet(id), { key: id, sword: null, wr: 1, wt: 'schwert' }));
  const key = id + '|' + look;
  if (KN_LOOKS[key]) return KN_LOOKS[key];
  const bk = id + '|' + look.slice(0, 3), body = KN_SETS[bk] || (KN_SETS[bk] = kn_buildSet(id, look.slice(0, 3)));
  const wt = WT_BY_CODE[look[5]] || 'schwert';
  return (KN_LOOKS[key] = Object.assign({}, body, { key: bk, sword: wt === 'schwert' ? swordSet(look.slice(3, 5)) : weaponSet(wt, look.slice(3, 5)), wr: look[4] === 'n' ? 1 : +look[4], wt }));
}
const KNIGHT_SET0 = knightSet('reich');
const KNIGHT = KNIGHT_SET0.walk, KNIGHT_ATK = KNIGHT_SET0.atk, KNIGHT_HIT = KNIGHT_SET0.hit, KNIGHT_FALL = KNIGHT_SET0.fall, KNIGHT_PLATE = KNIGHT_SET0.plate;
const KNIGHT_SIZE = { w: KNIGHT.down[0].img.width, h: KNIGHT.down[0].img.height, ax: kn_PAD + kn_CX, ay: kn_PAD + kn_H };
const KNIGHT_FIST = makeSprite(['DLHD', 'LGHD', 'KDDK'], kn_PAL, OUT);


/* ============ Pferde: Klepper, Zelter, Streitross ============
   Seitenansicht (64 × 44), vorn und hinten (34 × 44), Boden in Zeile 43. Vier Bilder für den Schritt, eines für den Stand.
   Fell in vier Tönen d h i k (dunkel .. hell), Mähne l m, Hufe x; Tuch und Wappen aus der Palette der Herkunft. */
const HORSES = {
  klepper:    { name:'Klepper', art:'einen', lvl:1, price:40, speed:1.45, cloth:'none',
    coat:{ d:'#3e2c1c', h:'#5e4428', i:'#7e5e3a', k:'#9c7c50' }, mane:{ l:'#2a1e14', m:'#4a382a' },
    desc:'ein genügsamer Gaul, wie ihn Bauern und Boten reiten' },
  zelter:     { name:'Zelter', art:'einen', lvl:5, price:260, speed:1.7, cloth:'blanket',
    coat:{ d:'#3a1c10', h:'#6a3018', i:'#8e4824', k:'#b26a3a' }, mane:{ l:'#141012', m:'#2a2220' },
    desc:'ein Passgänger, bequem auf langen Reisen, mit Satteldecke in Euren Farben' },
  streitross: { name:'Streitross', art:'ein', lvl:12, price:1200, speed:1.9, cloth:'caparison',
    coat:{ d:'#141216', h:'#26222c', i:'#3c3644', k:'#5a5262' }, mane:{ l:'#0c0a0e', m:'#1e1a22' },
    desc:'ein Hengst für die Schlacht, mit Rossstirn aus Stahl und Decke mit Eurem Wappen' }
};
const HORSE_IDS = Object.keys(HORSES);
/* Entwurf in 64 × 44, gezeichnet um HO_Z vergrößert (Pferd im rechten Maß zum Reiter) */
const HO_Z = 1.2, hz = v => Math.round(v * HO_Z);
const HO_H = hz(44), HO_GY = HO_H - 1, HO_SEAT = hz(12);
const ho_grid = w => Array.from({ length: HO_H }, () => Array(hz(w)).fill('.'));
/* ein Entwurfspixel: deckt alle Rasterzellen seines vergrößerten Felds */
function ho_px(g, x, y, ch){
  if (!ch) return;
  x = Math.round(x); y = Math.round(y);
  const X0 = Math.round(x * HO_Z), X1 = Math.max(X0, Math.round((x + 1) * HO_Z) - 1), Y0 = Math.round(y * HO_Z), Y1 = Math.max(Y0, Math.round((y + 1) * HO_Z) - 1);
  for (let Y = Y0; Y <= Y1; Y++) for (let X = X0; X <= X1; X++) if (Y >= 0 && Y < g.length && X >= 0 && X < g[0].length) g[Y][X] = ch;
}
/* Rasterzellen eines Entwurfsrechtecks (einschließlich x1, y1); fn(X, Y, x, y) mit Entwurfskoordinaten x, y */
function ho_scan(g, x0, y0, x1, y1, fn){
  for (let Y = Math.max(0, Math.round(y0 * HO_Z)); Y < Math.min(g.length, Math.round((y1 + 1) * HO_Z)); Y++)
    for (let X = Math.max(0, Math.round(x0 * HO_Z)); X < Math.min(g[0].length, Math.round((x1 + 1) * HO_Z)); X++) fn(X, Y, Math.floor(X / HO_Z), Math.floor(Y / HO_Z));
}
const ho_tone = v => 'dhik'[clamp(Math.floor(v * 4), 0, 3)];
/* gefüllte Ellipse mit Licht von links oben */
function ho_ell(g, cx, cy, rx, ry, lit){
  const Z = HO_Z;
  for (let Y = Math.floor((cy - ry) * Z); Y <= Math.ceil((cy + ry) * Z); Y++) for (let X = Math.floor((cx - rx) * Z); X <= Math.ceil((cx + rx) * Z); X++){
    const nx = ((X + .5) / Z - cx) / rx, ny = ((Y + .5) / Z - cy) / ry, q = nx * nx + ny * ny;
    if (q > 1 || Y < 0 || Y >= g.length || X < 0 || X >= g[0].length) continue;
    g[Y][X] = ho_tone(.66 - ny * .34 - nx * .14 - q * .16 + (lit || 0));
  }
}
/* dicke Strecke; chf(t entlang, qx, qy quer) liefert das Zeichen */
function ho_thick(g, x0, y0, x1, y1, w0, w1, chf){
  const Z = HO_Z, L = Math.hypot(x1 - x0, y1 - y0) || 1, n = Math.ceil(L * 2 * Z);
  for (let i = 0; i <= n; i++){
    const t = i / n, cx = (x0 + (x1 - x0) * t) * Z, cy = (y0 + (y1 - y0) * t) * Z, r = (w0 + (w1 - w0) * t) / 2 * Z;
    for (let Y = Math.floor(cy - r); Y <= Math.ceil(cy + r); Y++) for (let X = Math.floor(cx - r); X <= Math.ceil(cx + r); X++){
      const dx = X + .5 - cx, dy = Y + .5 - cy;
      if (dx * dx + dy * dy > r * r || Y < 0 || Y >= g.length || X < 0 || X >= g[0].length) continue;
      const ch = chf(t, dx / r, dy / r); if (ch) g[Y][X] = ch;
    }
  }
}
const ho_coatF = (lit, dark) => (t, qx, qy) => ho_tone(.6 - qy * .3 - qx * .2 + (lit || 0) - (dark || 0));
/* Bein: oben, Knie oder Sprunggelenk, Fessel, Huf; lift hebt den Huf an */
function ho_leg(g, x0, top, kdx, hdx, lift, far, hind){
  const dk = far ? .25 : 0, kx = x0 + kdx + (hind ? -2 : 0), ky = 33 - lift, hx = x0 + hdx + (lift ? 1 : 0), hy = 40 - lift;
  ho_thick(g, x0, top, kx, ky, hind ? 5 : 4, 3, ho_coatF(.05, dk));
  ho_thick(g, kx, ky, hx, hy - 1, 2.6, 2.2, (t, qx) => ho_tone(.42 - qx * .2 - dk - t * .15));
  for (let i = -1; i <= 1; i++){ ho_px(g, hx + i, hy, 'x'); ho_px(g, hx + i, hy + 1, 'x'); }
  ho_px(g, hx - 1, hy - 1, far ? 'd' : 'h');
}
const HO_STEP = {   // je Bein [Knie, Huf, Heben] für Bild 0..3; Bild 4 = Stand
  nf: [[2, 4, 0], [1, 1, 2], [-1, -3, 0], [0, 0, 0], [0, 0, 0]],
  ff: [[-1, -3, 0], [0, 0, 0], [2, 4, 0], [1, 1, 2], [0, 0, 0]],
  nh: [[-1, -3, 0], [0, 0, 0], [2, 3, 0], [1, 1, 2], [0, 0, 0]],
  fh: [[2, 3, 0], [1, 1, 2], [-1, -3, 0], [0, 0, 0], [0, 0, 0]]
};
const ho_cloth = ch => ({ d:'O', h:'o', i:'y', k:'Y' })[ch];
const ho_steel = ch => ({ d:'K', h:'D', i:'M', k:'L' })[ch];
/* Wappen auf der Pferdedecke (Seite) */
function ho_arms(g, fid, cx, cy){
  const red = (x, y) => ho_scan(g, x, y, x, y, (X, Y) => { const i = 'OoyY'.indexOf(g[Y][X]); if (i >= 0) g[Y][X] = '5678'[i]; });
  if (fid === 'reich') kn_EAGLE9.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') ho_px(g, cx - 4 + i, cy - 4 + j, r[i]); });
  else if (fid === 'frankreich') for (const [x, y] of [[cx - 6, cy - 3], [cx + 6, cy - 3], [cx, cy + 4], [cx - 12, cy + 4], [cx + 12, cy + 4]]) kn_LILY3.forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] !== '.') ho_px(g, x - 1 + i, y - 1 + j, r[i]); });
  else if (fid === 'england'){ for (let y = 12; y <= 35; y++) for (let x = cx - 1; x <= cx + 1; x++) red(x, y); for (let x = 6; x <= 48; x++) for (let y = cy - 1; y <= cy + 1; y++) red(x, y); }
  else if (fid === 'spanien') for (let t = 0; t <= 1; t += .02){ const y = Math.round(13 + t * 20); for (const x of [cx - 10 + t * 20, cx + 10 - t * 20]){ red(Math.round(x), y); red(Math.round(x) + 1, y); } }
}
/* Seitenansicht, Blick nach rechts */
function ho_side(h, fid, f){
  const g = ho_grid(64), S = HO_STEP;
  // ferne Beine, Schweif
  ho_leg(g, 38, 26, S.ff[f][0], S.ff[f][1], S.ff[f][2], true, false);
  ho_leg(g, 14, 25, S.fh[f][0], S.fh[f][1], S.fh[f][2], true, true);
  ho_thick(g, 11, 15, 8, 24, 4, 3.4, (t, qx) => qx < 0 ? 'm' : 'l');
  ho_thick(g, 8, 24, 9, 33 + (f & 1), 3.4, 2, (t, qx) => qx < -.2 ? 'm' : 'l');
  // Leib: Kruppe, Rumpf, Brust
  ho_ell(g, 17, 18, 8, 8, .04);
  ho_ell(g, 28, 20, 15, 8, 0);
  ho_ell(g, 40, 19, 7.5, 8.5, .02);
  // Hals, Kopf, Ohren, Mähne
  ho_thick(g, 41, 17, 49, 6, 9, 6, ho_coatF(.06));
  ho_thick(g, 50, 5, 57, 12, 6, 4.4, (t, qx, qy) => ho_tone(.62 - qy * .3 - t * .25));
  for (const [x, y] of [[49, 1], [49, 2], [50, 2], [51, 0], [51, 1]]) ho_px(g, x, y, 'h');
  ho_thick(g, 48, 3, 40, 12, 2.6, 2.6, (t, qx, qy) => qy < 0 ? 'm' : 'l');
  ho_px(g, 50, 4, 'm'); ho_px(g, 51, 5, 'l');
  ho_px(g, 52, 7, 'x'); ho_px(g, 57, 11, 'd'); ho_px(g, 56, 13, 'd');
  // nahe Beine
  ho_leg(g, 42, 26, S.nf[f][0], S.nf[f][1], S.nf[f][2], false, false);
  ho_leg(g, 18, 25, S.nh[f][0], S.nh[f][1], S.nh[f][2], false, true);
  // Decke
  if (h.cloth === 'caparison'){
    ho_scan(g, 6, 9, 50, 36, (X, Y, x, y) => { const ch = g[Y][X]; if ('dhik'.includes(ch) && !(x > 47 && y < 13)) g[Y][X] = ho_cloth(ch); });
    ho_scan(g, 9, 22, 46, 34, (X, Y, x, y) => {
      const hem = 33 + ((x >> 1) & 1), c = g[Y][X];
      if (y >= 26 && y <= hem && (c === '.' || 'dhikx'.includes(c))) g[Y][X] = y >= hem ? 'a' : ((X + Y) % 4 === 0 ? 'o' : 'y');
      else if (y <= hem - 1 && X % 6 === 0 && 'OoyY'.includes(c)) g[Y][X] = c === 'Y' ? 'y' : c === 'y' ? 'o' : 'O';
    });
    ho_arms(g, fid, 27, 23);
    // Rossstirn aus Stahl
    ho_scan(g, 48, 2, 59, 13, (X, Y, x, y) => { const ch = g[Y][X]; if ('dhik'.includes(ch) && x + y > 53) g[Y][X] = ho_steel(ch); });
    ho_px(g, 52, 7, 'K'); ho_px(g, 53, 4, 'G');
  } else if (h.cloth === 'blanket'){
    ho_scan(g, 19, 12, 36, 23, (X, Y, x, y) => { if (g[Y][X] !== '.') g[Y][X] = y === 23 ? ((X & 1) ? 'a' : 'A') : 'OoyY'[clamp(Math.floor((.75 - (x - 19) * .02 - (y - 12) * .03) * 4), 0, 3)]; });
  }
  // Sattel, Zaumzeug, Zügel
  for (let x = 22; x <= 33; x++){ ho_px(g, x, 11, 'n'); ho_px(g, x, 12, 'N'); }
  ho_px(g, 21, 9, 'n'); ho_px(g, 21, 10, 'n'); ho_px(g, 22, 10, 'b'); ho_px(g, 33, 10, 'b'); ho_px(g, 34, 10, 'n');
  for (let k = 0; k <= 5; k++) ho_px(g, 51 + k, 6 + k, 'N');
  ho_px(g, 53, 11, 'a');
  for (let k = 0; k <= 9; k++) ho_px(g, 54 - k * 1.6, 11 + k * .3, 'N');
  return g;
}
/* von vorn: Leib und Beine unter dem Reiter, Hals und Kopf davor */
function ho_front(h, fid, f){
  const under = ho_grid(34), over = ho_grid(34), lift = [[0, 2], [0, 0], [2, 0], [0, 0], [0, 0]][f];
  ho_ell(under, 17, 19, 11, 7, -.15);
  for (const [x, lf] of [[10, lift[1]], [24, lift[0]]]) ho_thick(under, x, 26, x, 40 - lf, 3, 2, (t, qx) => ho_tone(.3 - qx * .1));
  ho_ell(under, 17, 21, 8.5, 8, .05);
  for (const [x, lf] of [[13, lift[0]], [21, lift[1]]]){
    ho_thick(under, x, 26, x, 39 - lf, 4, 2.4, (t, qx) => ho_tone(.55 - qx * .25 - t * .2));
    for (let i = -1; i <= 1; i++){ ho_px(under, x + i, 40 - lf, 'x'); ho_px(under, x + i, 41 - lf, 'x'); }
  }
  if (h.cloth === 'caparison'){
    ho_scan(under, 4, 10, 30, 34, (X, Y) => { const ch = under[Y][X]; if ('dhik'.includes(ch)) under[Y][X] = ho_cloth(ch); });
    ho_scan(under, 6, 26, 28, 34, (X, Y, x, y) => { const hem = 33 + ((x >> 1) & 1); if (y <= hem) under[Y][X] = y >= hem ? 'a' : (X % 6 === 0 ? 'o' : 'y'); });
    if (fid === 'reich') kn_EAGLE7.forEach((r, j) => { for (let i = 0; i < 7; i++) if (r[i] !== '.') ho_px(under, 14 + i, 22 + j, r[i]); });
    else if (fid === 'frankreich') for (const x of [12, 22]) kn_LILY3.forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] !== '.') ho_px(under, x - 1 + i, 26 + j, r[i]); });
    else ho_scan(under, 6, 20, 28, 32, (X, Y) => {
      const i = 'OoyY'.indexOf(under[Y][X]); if (i < 0) return;
      const x = X / HO_Z, y = Y / HO_Z;
      const on = fid === 'england' ? (Math.abs(x - 17.4) <= 1.1 || Math.abs(y - 27.4) <= 1.1) : (Math.abs((x - 17.4) - (y - 27.4) * .9) <= 1.1 || Math.abs((x - 17.4) + (y - 27.4) * .9) <= 1.1);
      if (on) under[Y][X] = '5678'[i];
    });
  } else if (h.cloth === 'blanket'){
    ho_scan(under, 5, 13, 29, 22, (X, Y, x, y) => { if (under[Y][X] !== '.' && (x < 9 || x > 25)) under[Y][X] = y === 22 ? 'a' : 'OoyY'[x < 17 ? 2 : 1]; });
  }
  // Hals und Kopf (vor dem Reiter)
  const o = 9;   // der Kopf ragt nach vorn, also im Bild tiefer
  ho_thick(over, 17, 17 + o, 17, 10 + o, 8, 6, (t, qx) => ho_tone(.6 - qx * .3 + t * .05));
  ho_thick(over, 17, 5 + o, 17, 16 + o, 5.4, 4.6, (t, qx) => ho_tone(.62 - qx * .3 - t * .3));
  for (const [x, y] of [[14, 2], [14, 3], [20, 2], [20, 3], [15, 4], [19, 4]]) ho_px(over, x, y + o, 'h');
  for (const [x, y] of [[16, 4], [17, 4], [18, 4], [17, 5], [16, 5]]) ho_px(over, x, y + o, 'l');
  ho_px(over, 15, 8 + o, 'x'); ho_px(over, 19, 8 + o, 'x'); ho_px(over, 16, 16 + o, 'd'); ho_px(over, 18, 16 + o, 'd');
  for (const x of [14, 20]) for (const y of [7, 13]) ho_px(over, x, y + o, 'N');
  if (h.cloth === 'caparison'){
    ho_scan(over, 12, 15 + o, 22, 19 + o, (X, Y) => { const ch = over[Y][X]; if ('dhik'.includes(ch)) over[Y][X] = ho_cloth(ch); });
    ho_scan(over, 14, 3 + o, 20, 15 + o, (X, Y) => { const ch = over[Y][X]; if ('dhik'.includes(ch)) over[Y][X] = ho_steel(ch); });
    ho_px(over, 17, 6 + o, 'G'); ho_px(over, 17, 7 + o, 'H'); ho_px(over, 15, 8 + o, 'K'); ho_px(over, 19, 8 + o, 'K');
  }
  return { under, over };
}
/* von hinten: Kruppe, Schweif und Hinterbeine vor dem Reiter */
function ho_back(h, fid, f){
  const over = ho_grid(34), lift = [[0, 2], [0, 0], [2, 0], [0, 0], [0, 0]][f];
  for (const [x, lf] of [[11, lift[1]], [23, lift[0]]]) ho_thick(over, x, 27, x, 40 - lf, 2.6, 2, (t, qx) => ho_tone(.25 - qx * .1));
  ho_ell(over, 17, 22, 10.5, 8, .02);
  for (const [x, lf] of [[13, lift[0]], [21, lift[1]]]){
    ho_thick(over, x, 27, x - (x < 17 ? 1 : -1), 34 - lf, 5, 3, (t, qx) => ho_tone(.55 - qx * .25));
    ho_thick(over, x - (x < 17 ? 1 : -1), 33 - lf, x, 39 - lf, 2.6, 2.2, (t, qx) => ho_tone(.38 - qx * .2));
    for (let i = -1; i <= 1; i++){ ho_px(over, x + i, 40 - lf, 'x'); ho_px(over, x + i, 41 - lf, 'x'); }
  }
  if (h.cloth === 'caparison'){
    ho_scan(over, 3, 12, 31, 34, (X, Y) => { const ch = over[Y][X]; if ('dhik'.includes(ch)) over[Y][X] = ho_cloth(ch); });
    ho_scan(over, 6, 27, 28, 35, (X, Y, x, y) => { const hem = 34 + ((x >> 1) & 1); if (y <= hem) over[Y][X] = y >= hem ? 'a' : (X % 6 === 0 ? 'o' : 'y'); });
    ho_scan(over, 6, 16, 28, 33, (X, Y) => {
      const i = 'OoyY'.indexOf(over[Y][X]); if (i < 0) return;
      const x = X / HO_Z, y = Y / HO_Z;
      const on = fid === 'england' ? (Math.abs(x - 17.4) <= 1.1 || Math.abs(y - 25.4) <= 1.1) : fid === 'spanien' ? (Math.abs((x - 17.4) - (y - 25.4) * .9) <= 1.1 || Math.abs((x - 17.4) + (y - 25.4) * .9) <= 1.1) : false;
      if (on) over[Y][X] = '5678'[i];
    });
    if (fid === 'reich') kn_EAGLE9.forEach((r, j) => { for (let i = 0; i < 9; i++) if (r[i] !== '.') ho_px(over, 13 + i, 20 + j, r[i]); });
    if (fid === 'frankreich') for (const [x, y] of [[11, 21], [23, 21], [17, 28]]) kn_LILY3.forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] !== '.') ho_px(over, x - 1 + i, y - 1 + j, r[i]); });
  } else if (h.cloth === 'blanket'){
    ho_scan(over, 4, 14, 30, 18, (X, Y, x, y) => { if (over[Y][X] !== '.') over[Y][X] = y === 18 ? 'a' : 'OoyY'[x < 17 ? 2 : 1]; });
  }
  ho_thick(over, 17, 19, 17, 27, 5, 4.2, (t, qx) => qx < 0 ? 'm' : 'l');
  ho_thick(over, 17, 27, 17 + (f & 1 ? 1 : -1), 37, 4.2, 2.4, (t, qx) => qx < -.2 ? 'm' : 'l');
  return { under: null, over };
}
/* Reiter: Oberleib des Ritters (bis zum Saum des Rocks) mit Beinen am Pferd */
function ho_rider(view){
  let g;
  if (view === 'down'){
    g = kn_front(0); const hg = kn_new(); kn_comp(hg, kn_handF(), 0, 0); kn_comp(g, hg, 0, 0);
  } else if (view === 'up'){
    g = kn_back(0); const hg = kn_new(); kn_comp(hg, kn_handB(), 0, 0); kn_comp(g, hg, 0, 0);
  } else { const m = view === 'left'; g = kn_side(0, m); kn_comp(g, kn_handS(0, m), 0, 0); }
  for (let y = 29; y < kn_H; y++) g[y].fill('.');
  if (view === 'down' || view === 'up'){
    for (const sd of [-1, 1]){
      const X = x => sd < 0 ? x : kn_W - 1 - x - 1;
      const L = [[27, 7, 'LHMD'], [28, 6, 'LHMD'], [29, 5, 'LHMD'], [30, 5, 'KDDK'], [31, 5, 'LGLD'], [32, 5, 'LHMD'], [33, 5, 'LHMD'], [34, 5, 'MHMD'], [35, 4, 'DLHHD'], [36, 4, 'KDDKK']];
      for (const [y, x, s] of L) for (let i = 0; i < s.length; i++) kn_px(g, sd < 0 ? x + i : X(x) - i, y, s[i]);
    }
  } else {
    const S = kn_S(g, view === 'left', 0);
    S.seg(28, [[13, 'LHHMD']]); S.seg(29, [[15, 'LHHMD']]); S.seg(30, [[16, 'KLGD']]);
    for (let y = 31; y <= 33; y++) S.seg(y, [[17, 'LHMD']]);
    S.seg(34, [[17, 'MHMD']]); S.seg(35, [[16, 'DLHHD']]); S.seg(36, [[16, 'KDDKK']]);
  }
  return g;
}
/* alle Bilder eines Pferdes mit Reiter für eine Herkunft */
const HO_SETS = {};
function horseSet(hid, fid){
  const key = hid + '|' + fid;
  if (HO_SETS[key]) return HO_SETS[key];
  const [fk, body] = String(fid).split('|'), h = HORSES[hid], F = knightFaction(fk, body);
  const pal = Object.assign({}, F.pal, h.coat, h.mane, { x:'#1a1816' });
  const mk = g => g ? makeSprite(g.map(r => r.join('')), pal, OUT) : null;
  const prev = kn_F; kn_F = F;
  const set = { right: [], left: [], down: [], up: [], rider: {} };
  for (let f = 0; f < 5; f++){
    const side = mk(ho_side(h, fid, f));
    set.right.push({ under: side, over: null, ax: hz(28), w: hz(64) });
    set.left.push({ under: flipped(side), over: null, ax: hz(64) + 2 - 1 - hz(28), w: hz(64) });
    const fr = ho_front(h, fid, f), bk = ho_back(h, fid, f);
    set.down.push({ under: mk(fr.under), over: mk(fr.over), ax: hz(17) + 1, w: hz(34) });
    set.up.push({ under: null, over: mk(bk.over), ax: hz(17) + 1, w: hz(34) });
  }
  for (const v of ['down', 'up', 'right', 'left']) set.rider[v] = makeSprite(ho_rider(v).map(r => r.join('')), F.pal, OUT);
  kn_F = prev;
  return (HO_SETS[key] = set);
}
/* Pferd mit Reiter zeichnen: (x, y) Bodenpunkt, f Schrittbild, bob Auf und Ab des Reiters */
function drawMounted(g, hid, fid, dir, x, y, f, alpha){
  const set = horseSet(hid, fid), fr = set[dir][f], rd = set.rider[dir];
  const hx = Math.round(x - fr.ax - 1), hy = Math.round(y - HO_GY - 1), bob = f === 1 || f === 3 ? 1 : 0;
  const rx = Math.round(x - (kn_PAD + kn_CX)), ry = Math.round(y - (HO_GY - HO_SEAT) - 26 - kn_PAD + bob);
  if (fr.under) g.drawImage(fr.under, hx, hy);
  g.drawImage(rd, rx, ry);
  if (fr.over) g.drawImage(fr.over, hx, hy);
}

const KNIGHT_NOTES = [
  'Der Ritter trägt den Wappenrock des Reiches: gelbes Tuch mit dem schwarzen Doppeladler auf Brust, Rücken und Ärmeln. So erkannte man im Getümmel, für wen er kämpfte.',
  'Auf dem Kopf sitzt eine Schaller mit Visier und schmalem Sehschlitz, hinten läuft sie in einen langen Nackenschirm aus. Kinn und Kehle deckt der Bart, eine gewölbte Platte vor dem Hals.',
  'Unter dem Rock steckt er in einem Plattenharnisch: Armröhren mit Armkacheln, eiserne Handschuhe, darunter schaut der Kettenschurz hervor. Das Beinzeug hat Kniebuckel mit Muscheln und spitze Eisenschuhe.',
  'Am linken Arm hängt ein Dreiecksschild aus Holz, mit Leder bezogen und bemalt, wieder mit dem Reichsadler.',
  'Seine Waffe ist ein langes Schwert mit gerader Parierstange und Scheibenknauf, gut 1,3 Meter lang. Er führt es mit einer Hand, denn die andere hält den Schild.',
  'Schaller und Dreiecksschild stammen aus dem 15. Jahrhundert. Um 1520 galt so eine Rüstung schon als altmodisch, doch mancher Ritter im Reich trug noch, was sein Vater getragen hatte.'
];
