"use strict";
/* Der Apfelritter, Teil 6 von 25: Weltgrafiken Teil 2: Burg, Stadtmauer, Ruine, Kleinteile.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Weltgrafiken, Teil 2: Burg, Stadtmauer, Ruine, Kleinteile ============ */
/* Licht von links: lx = -1 (Kante links) .. 1 (rechts) */
const wp_xLit = (x, x0, x1, k) => -((x - x0) / Math.max(1, x1 - x0) - .5) * (k || .3);
function wp_xMason(B, x0, y0, x1, y1, o){
  const fn = (o.rubble ? wp_rubble : wp_ashlar)(Object.assign({ R: o.R || wp_P.stone, s: o.s, per: o.per || 0, lit: (x, y) => (o.lit ? o.lit(x, y) : wp_xLit(x, x0, x1, .26)),
    moss: (x, y) => (y - (y1 - 10)) / 10 * (o.mossK || .9) }, o.more || {}));
  wp_rect(B, x0, y0, x1, y1, o.mask ? (x, y) => o.mask(x, y) ? fn(x, y) : 0 : fn);
}
/* Zinnenkranz: Zinnen (mw breit) und Scharten im Takt per; oben Deckplatten */
function wp_xCren(B, x0, x1, yb, mh, mw, per, o){
  for (let x = x0; x < x1; x++){
    const u = ((x - x0 + (o.off || 0)) % per + per) % per;
    if (u >= mw) continue;
    for (let y = yb - mh; y < yb; y++){
      let t = .55 + (u === 0 ? .18 : u === mw - 1 ? -.2 : 0) + (wp_h(x, y, o.s) - .5) * .18 + (y === yb - mh ? .2 : 0);
      if (o.slit && u === (mw >> 1) && y > yb - mh + 2 && y < yb - 1 && (Math.floor((x - x0) / per) % 2 === 0)) { wp_set(B, x, y, wp_P.dark[0]); continue; }
      wp_set(B, x, y, wp_tone(o.R || wp_P.stone, t, x, y));
    }
  }
}
/* Kegeldach mit Schiefer- oder Ziegelreihen */
function wp_xCone(B, cx, yb, r, h, R, s){
  for (let y = yb - h; y <= yb; y++){
    const t = (y - (yb - h)) / h, hw = r * t;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++){
      const nx = (x + .5 - cx) / Math.max(1, hw), row = Math.floor((yb - y) / 3), lx = Math.floor((x - cx) / 3 + row * .5);
      let v = .55 - nx * .3 + (wp_h(lx, row, s) - .5) * .25 - ((yb - y) % 3 === 0 ? .18 : 0) + t * .05;
      if (Math.abs(nx) > .92) v -= .15;
      wp_set(B, x, y, wp_tone(R, v, x, y));
    }
  }
  wp_seg(B, cx, yb - h - 6, cx, yb - h, 1.2, wp_P.iron[4]); wp_set(B, cx, yb - h - 7, wp_P.gold[4]); wp_set(B, cx, yb - h - 6, wp_P.gold[3]);
}
/* Zylinder (Rundturm) aus Mauerwerk, unten Ellipsenbogen */
function wp_xTower(B, cx, ytop, yb, r, o){
  const R = o.R || wp_P.stone;
  const fn = (o.rubble ? wp_rubble : wp_ashlar)({ R, s: o.s, ux: (x) => Math.asin(clamp((x + .5 - cx) / r, -1, 1)) * r * 1.3 + 400,
    lit: (x) => { const nx = (x + .5 - cx) / r; return -nx * .32 - Math.max(0, Math.abs(nx) - .75) * .5; },
    moss: (x, y) => (y - (yb - 14)) / 14 * .9, buckel: o.buckel, stain: .5, ch: o.ch || 6 });
  for (let x = Math.floor(cx - r); x < cx + r; x++){
    const nx = (x + .5 - cx) / r, curve = Math.sqrt(Math.max(0, 1 - nx * nx)) * (o.ry || 6);
    for (let y = ytop; y < yb + curve; y++) wp_put(B, x, y, fn);
  }
}
/* Schießscharte mit Kreuz für die Armbrust; Gewände links im Licht, rechts im Schatten */
const wp_xSlit = (B, x, y, h) => {
  const m = y + (h >> 1) - 1;
  for (let j = -1; j <= h; j++){ wp_dk(B, x - 1, y + j, 1.14); wp_dk(B, x + 1, y + j, .78); }
  wp_rect(B, x, y, x + 1, y + h, wp_P.dark[0]); wp_rect(B, x - 1, m, x + 2, m + 1, wp_P.dark[0]);
};
function wp_xFlagCloth(B, x, y, w, h, s){
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){
    const wave = Math.round(Math.sin(i * .35 + s) * 1.2), X = x + i, Y = y + j + wave;
    const t = .62 + Math.sin(i * .35 + s + 1.2) * .2 - j / h * .1 + (i === w - 1 && j % 4 === 0 ? -.4 : 0);
    if (i > w - 3 && (j % 5 === 2)) continue;
    wp_set(B, X, Y, wp_tone(wp_P.gold, t, X, Y));
  }
  wp_eagle(B, x + (w >> 1) - 7, y + (h >> 1) - 6, 'm');
}

/* ---------- Reichsburg ---------- */
function wp_cMauer(s, v){
  const B = wp_img(64, 72, 70), ay = B.ay, top = ay - 46, R = rng(s);
  wp_xMason(B, 0, top, 64, ay, { s: 77, per: 64, more: { buckel: false, stain: .6 } });
  wp_rect(B, 0, top - 4, 64, top, (x, y) => wp_tone(wp_P.stone, y === top - 4 ? .82 : .62 + (wp_h(x, y, 5) - .5) * .2, x, y));   // Wehrgang-Deckplatten
  wp_xCren(B, 0, 64, top - 4, 12, 10, 16, { s: 78, off: 3, slit: true });
  wp_rect(B, 0, top - 1, 64, top, wp_P.dark[1]);
  for (let x = 0; x < 64; x++) if (x % 16 === 4) wp_set(B, x, top + 3, wp_P.dark[0]);      // Wasserspeier-Löcher
  if (v % 3 === 1) wp_xSlit(B, 22 + (R() * 20 | 0), top + 12, 7);
  if (v % 3 === 2){ for (let i = 0; i < 3; i++) wp_ivy(B, 6 + (R() * 50 | 0), ay - 2, 20 + (R() * 14 | 0), s + i, (x, y) => wp_op(B, x, y)); }
  for (let i = 0; i < 3; i++) wp_crack(B, 6 + (R() * 52 | 0), top + 8 + (R() * 20 | 0), 6 + (R() * 6 | 0), s + 9 + i, (x, y) => wp_op(B, x, y));
  wp_shade(B, 0, ay - 3, 64, ay, .25);
  for (let i = 0; i < 4; i++) wp_grass(B, 4 + i * 16 + (R() * 6 | 0), ay - 1, 4, s + 30 + i);
  return { img: wp_canvas(B), ax: B.ax, ay, foot: [[-32, -26, 32, 2]], occl: [-32, -70, 32, -24], extra: {} };
}
function wp_cTurm(s, v){
  const B = wp_img(72, 128, 124), ay = B.ay, cx = B.ax, r = 27, body = ay - 78, R = rng(s);
  wp_groundShadow(B, cx + 4, ay + 1, 30, 5);
  wp_xTower(B, cx, body, ay - 6, r, { s: 90 + v, buckel: true, ry: 6 });
  wp_xTower(B, cx, body - 8, body + 2, r + 3, { s: 95, ry: 3 });                     // auskragender Wehrgang
  for (let i = 0; i < 9; i++){ const x = cx - r + 3 + i * 6.2; wp_rect(B, x, body + 2, x + 3, body + 6, (X, Y) => wp_tone(wp_P.stone, .45 - (Y - body) * .06 + (X < cx ? .1 : -.1), X, Y)); }
  wp_xCone(B, cx, body - 8, r + 5, 40, wp_P.slate, s);
  wp_xSlit(B, cx - 8, body + 18, 8); wp_xSlit(B, cx + 9, body + 40, 7);
  wp_window(B, cx - 3, body + 30, 5, 7, { s, kreuz: false, dark: v % 2 === 0, frame: wp_P.stone });
  for (let i = 0; i < 2; i++) wp_crack(B, cx - 18 + (R() * 34 | 0), body + 20 + (R() * 30 | 0), 8, s + i, (x, y) => wp_op(B, x, y));
  if (v === 1) wp_ivy(B, cx + 14, ay - 4, 34, s + 5, (x, y) => wp_op(B, x, y));
  wp_outline(B, true);
  return { img: wp_canvas(B), ax: cx, ay, foot: [[-30, -30, 30, 2]], occl: [-36, -126, 36, -28], extra: {} };
}
function wp_cTor(s){
  const B = wp_img(104, 120, 116), ay = B.ay, cx = B.ax, top = ay - 70;
  wp_groundShadow(B, cx + 6, ay + 1, 52, 5);
  wp_xMason(B, 0, top, 104, ay, { s: 81, more: { buckel: true, stain: .5 } });
  wp_xMason(B, 18, top - 30, 86, top + 2, { s: 82, lit: (x) => wp_xLit(x, 18, 86, .3) });            // Torturm-Aufsatz
  wp_xCren(B, 0, 18, top, 10, 7, 11, { s: 83 }); wp_xCren(B, 86, 104, top, 10, 7, 11, { s: 84, off: 4 });
  // Walmdach des Torturms (Ziegel)
  for (let y = top - 52; y < top - 29; y++){ const t = (y - (top - 52)) / 23, hw = 12 + t * 24; for (let x = Math.floor(cx - hw); x < cx + hw; x++){ const nx = (x - cx) / hw; wp_set(B, x, y, wp_tone(wp_P.tile, .55 - nx * .25 - ((y - top) % 3 === 0 ? .15 : 0) + (wp_h(x >> 1, (y / 3) | 0, s) - .5) * .2, x, y)); } }
  wp_rect(B, cx - 13, top - 53, cx + 13, top - 52, wp_P.tile[1]);
  // Torbogen (offen), hochgezogenes Fallgitter
  const aw = 34, ah = 44, ax0 = cx - aw / 2;
  for (let y = ay - ah - 8; y < ay; y++) for (let x = ax0; x < ax0 + aw; x++){
    const dx = (x + .5 - cx) / (aw / 2), archY = ay - ah - Math.sqrt(Math.max(0, 1 - dx * dx)) * 8;
    if (y < archY) continue;
    const depth = (y - archY) / (ay - archY);
    wp_set(B, x, y, wp_tone(wp_P.dark, .15 + depth * .5 + (Math.abs(dx) > .85 ? -.2 : 0), x, y));
  }
  for (let x = ax0 + 3; x < ax0 + aw - 2; x += 5) wp_rect(B, x, ay - ah - 6, x + 1, ay - ah + 6, wp_P.iron[2]);
  for (let x = ax0 + 3; x < ax0 + aw - 2; x += 5) wp_set(B, x, ay - ah + 6, wp_P.iron[4]);
  wp_rect(B, ax0 + 2, ay - ah - 2, ax0 + aw - 2, ay - ah - 1, wp_P.iron[1]);
  // Bogenkeilsteine
  for (let k = 0; k <= 12; k++){ const a = Math.PI * (k / 12), x = cx - Math.cos(a) * (aw / 2 + 2), y = ay - ah - Math.sin(a) * 10; wp_rect(B, x - 1, y - 2, x + 2, y + 1, wp_tone(wp_P.stone, k % 2 ? .75 : .55, x | 0, y | 0)); }
  // Reichswappen über dem Tor
  wp_rect(B, cx - 10, top - 26, cx + 10, top - 6, (x, y) => wp_tone(wp_P.gold, .55 - (x - cx) * .02 + (y === top - 26 ? .3 : 0), x, y));
  wp_eagle(B, cx - 7, top - 22, 'm');
  wp_xSlit(B, 8, top + 14, 9); wp_xSlit(B, 95, top + 14, 9); wp_xSlit(B, cx - 20, top - 22, 6); wp_xSlit(B, cx + 20, top - 22, 6);
  wp_shade(B, 0, ay - 3, 104, ay, .25);
  wp_outline(B, true);
  return { img: wp_canvas(B), ax: cx, ay, foot: [[-52, -40, -18, 2], [18, -40, 52, 2]], occl: [-52, -118, 52, -38], extra: {} };
}
function wp_cBergfried(s){
  const B = wp_img(104, 176, 172), ay = B.ay, cx = B.ax, x0 = cx - 40, x1 = cx + 40, top = ay - 118;
  wp_groundShadow(B, cx + 8, ay + 1, 50, 6);
  wp_xMason(B, x0, top, x1, ay, { s: 101, more: { buckel: true, stain: .9, ch: 7 } });
  for (const ex of [x0, x1 - 5]) wp_rect(B, ex, top, ex + 5, ay, (x, y) => wp_tone(wp_P.stone, (ex === x0 ? .7 : .35) + ((y - top) % 14 < 7 ? .08 : -.05), x, y));   // Eckquader
  // Wehrgang mit Konsolen und Zinnen
  wp_rect(B, x0 - 4, top - 6, x1 + 4, top, (x, y) => wp_tone(wp_P.stone, .6 + wp_xLit(x, x0, x1, .3), x, y));
  for (let x = x0 - 2; x < x1 + 2; x += 7) wp_rect(B, x, top, x + 3, top + 5, (X, Y) => wp_tone(wp_P.stone, .5 - (Y - top) * .07, X, Y));
  wp_xCren(B, x0 - 4, x1 + 4, top - 6, 10, 6, 11, { s: 102 });
  // hohes Walmdach mit Schiefer
  for (let y = top - 52; y < top - 15; y++){ const t = (y - (top - 52)) / 37, hw = 6 + t * 36; for (let x = Math.floor(cx - hw); x < cx + hw; x++){ const nx = (x - cx) / hw; wp_set(B, x, y, wp_tone(wp_P.slate, .58 - nx * .3 - ((y - top) % 3 === 0 ? .16 : 0) + (wp_h(x >> 1, (y / 3) | 0, s) - .5) * .22, x, y)); } }
  // Reichsbanner auf der Stange
  wp_seg(B, cx, top - 50, cx, top - 74, 1.4, wp_P.iron[3]); wp_set(B, cx, top - 75, wp_P.gold[5]);
  wp_xFlagCloth(B, cx + 1, top - 73, 22, 15, s % 7);
  // Fenster, Hocheingang, Schlitze
  wp_window(B, cx - 4, top + 18, 8, 10, { s, kreuz: true, frame: wp_P.stone, sill: wp_P.stone });
  wp_window(B, cx - 18, top + 50, 5, 8, { s: s + 1, dark: true, frame: wp_P.stone });
  wp_window(B, cx + 13, top + 50, 5, 8, { s: s + 2, dark: true, frame: wp_P.stone });
  wp_door(B, cx - 6, top + 74, 12, 16, { arch: 'round', s });
  wp_xSlit(B, cx - 22, ay - 30, 9); wp_xSlit(B, cx + 22, ay - 34, 9);
  for (let i = 0; i < 4; i++) wp_crack(B, x0 + 8 + i * 17, top + 30 + i * 13, 9, s + i, (x, y) => wp_op(B, x, y));
  wp_shade(B, x0, ay - 3, x1, ay, .25);
  wp_outline(B, true);
  return { img: wp_canvas(B), ax: cx, ay, foot: [[-46, -46, 46, 2]], occl: [-48, -174, 48, -44], extra: {} };
}

/* ---------- Stadtmauer ---------- */
function wp_sMauer(s, v){
  const B = wp_img(64, 64, 62), ay = B.ay, top = ay - 34, R = rng(s);
  const pl = wp_plaster({ R: wp_P.plaster, s: 61, base: ay, flake: .5, per: 64, under: wp_rubble({ R: wp_P.grey, s: 62, per: 64 }) });
  wp_rect(B, 0, top, 64, ay, (x, y) => pl(x, y));
  // überdachter Wehrgang: Bretterbrüstung, Ständer, Ziegeldach
  wp_rect(B, 0, top - 10, 64, top, wp_hplanks(wp_P.gwood, 63, 3, { oy: 0 }));
  for (let x = 2; x < 64; x += 16) wp_rect(B, x, top - 18, x + 2, top, (X, Y) => wp_tone(wp_P.oak, X % 16 === 2 ? .6 : .35, X, Y));
  for (let y = top - 26; y < top - 16; y++) for (let x = 0; x < 64; x++){ const row = Math.floor((y - (top - 26)) / 3); wp_set(B, x, y, wp_tone(wp_P.tile, .55 - row * .06 - ((y - top) % 3 === 2 ? .18 : 0) + (wp_h((x + row * 2) >> 2, row, 64) - .5) * .25, x, y)); }
  wp_rect(B, 0, top - 16, 64, top - 15, wp_P.oak[0]);
  for (let x = 6; x < 64; x += 16) wp_xSlit(B, x, top + 8, 6);
  if (v === 1) for (let i = 0; i < 2; i++) wp_ivy(B, 8 + (R() * 46 | 0), ay - 2, 18, s + i, (x, y) => wp_op(B, x, y));
  wp_shade(B, 0, ay - 3, 64, ay, .25);
  for (let i = 0; i < 4; i++) wp_grass(B, 4 + i * 16 + (R() * 6 | 0), ay - 1, 3, s + 20 + i);
  return { img: wp_canvas(B), ax: B.ax, ay, foot: [[-32, -22, 32, 2]], occl: [-32, -62, 32, -20], extra: {} };
}
function wp_xPyramid(B, cx, yb, hw, h, R, s){
  for (let y = yb - h; y < yb; y++){ const t = (y - (yb - h)) / h, w = 2 + t * hw; for (let x = Math.floor(cx - w); x < cx + w; x++){ const nx = (x - cx) / w; wp_set(B, x, y, wp_tone(R, .56 - nx * .28 - ((yb - y) % 3 === 0 ? .17 : 0) + (wp_h((x + (y / 3 | 0)) >> 2, (y / 3) | 0, s) - .5) * .24 - (nx > .2 && nx < .25 ? .2 : 0), x, y)); } }
  wp_seg(B, cx, yb - h - 5, cx, yb - h, 1.2, wp_P.iron[4]); wp_set(B, cx, yb - h - 6, wp_P.gold[4]);
}
function wp_sTurm(s, v){
  const B = wp_img(64, 104, 100), ay = B.ay, cx = B.ax, x0 = cx - 24, x1 = cx + 24, top = ay - 60;
  wp_groundShadow(B, cx + 5, ay + 1, 28, 4);
  const pl = wp_plaster({ R: v ? wp_P.ochre : wp_P.plaster, s: 70 + v, base: ay, flake: .45, under: wp_rubble({ R: wp_P.grey, s: 71 }), lit: (x) => wp_xLit(x, x0, x1, .3) });
  wp_rect(B, x0, top, x1, ay, pl);
  for (const ex of [x0, x1 - 4]) wp_rect(B, ex, top, ex + 4, ay, (x, y) => wp_tone(wp_P.grey, (ex === x0 ? .7 : .35) + ((y - top) % 10 < 5 ? .1 : -.05), x, y));
  wp_xPyramid(B, cx, top + 1, 28, 34, wp_P.tile, s);
  wp_window(B, cx - 4, top + 10, 8, 9, { s, kreuz: true, frame: wp_P.oak });
  wp_xSlit(B, cx - 10, top + 32, 7); wp_xSlit(B, cx + 10, top + 32, 7);
  wp_shade(B, x0, ay - 3, x1, ay, .25);
  wp_outline(B, true);
  return { img: wp_canvas(B), ax: cx, ay, foot: [[-26, -26, 26, 2]], occl: [-30, -100, 30, -24], extra: {} };
}
function wp_sTor(s){
  const B = wp_img(104, 112, 108), ay = B.ay, cx = B.ax, top = ay - 66;
  wp_groundShadow(B, cx + 6, ay + 1, 52, 5);
  const pl = wp_plaster({ R: wp_P.plaster, s: 75, base: ay, flake: .35, under: wp_rubble({ R: wp_P.grey, s: 76 }), lit: (x) => wp_xLit(x, 0, 104, .26) });
  wp_rect(B, 0, top + 18, 104, ay, pl);
  wp_rect(B, 22, top - 14, 82, top + 18, (x, y) => pl(x, y));
  for (const ex of [22, 78]) wp_rect(B, ex, top - 14, ex + 4, ay, (x, y) => wp_tone(wp_P.grey, (ex === 22 ? .72 : .35) + ((y - top) % 10 < 5 ? .1 : -.05), x, y));
  wp_xPyramid(B, cx, top - 13, 38, 30, wp_P.tile, s);
  for (let y = top + 10; y < top + 18; y++) for (let x = 0; x < 104; x++) if (x < 22 || x >= 82) wp_set(B, x, y, wp_tone(wp_P.tile, .5 - ((y - top) % 3 === 0 ? .2 : 0), x, y));
  // Tordurchfahrt mit Holzflügeln (offen)
  const aw = 34, ah = 40, ax0 = cx - aw / 2;
  for (let y = ay - ah - 9; y < ay; y++) for (let x = ax0; x < ax0 + aw; x++){
    const dx = (x + .5 - cx) / (aw / 2), archY = ay - ah - Math.sqrt(Math.max(0, 1 - dx * dx)) * 9;
    if (y >= archY) wp_set(B, x, y, wp_tone(wp_P.dark, .12 + (y - archY) / (ay - archY) * .55, x, y));
  }
  wp_rect(B, ax0 - 5, ay - ah + 4, ax0, ay, wp_planks(wp_P.oak, 77, 3)); wp_rect(B, ax0 + aw, ay - ah + 4, ax0 + aw + 5, ay, wp_planks(wp_P.oak, 78, 3));
  // Wappen und Uhr
  wp_rect(B, cx - 9, top - 4, cx + 9, top + 13, (x, y) => wp_tone(wp_P.gold, .55 + (y === top - 4 ? .3 : 0) - (x - cx) * .02, x, y));
  wp_eagle(B, cx - 7, top - 1, 'm');
  wp_ell(B, cx, top - 6 - 14, 5, 5, (x, y) => wp_tone(wp_P.plaster, .9, x, y));
  wp_seg(B, cx, top - 20, cx, top - 23, 1, wp_P.iron[1]); wp_seg(B, cx, top - 20, cx + 2, top - 19, 1, wp_P.iron[1]);
  wp_shade(B, 0, ay - 3, 104, ay, .25);
  wp_outline(B, true);
  return { img: wp_canvas(B), ax: cx, ay, foot: [[-52, -36, -18, 2], [18, -36, 52, 2]], occl: [-52, -110, 52, -34], extra: {} };
}

/* ---------- Raubritterburg (Ruine) ---------- */
function wp_rMauer(s, v){
  const B = wp_img(64, 60, 58), ay = B.ay, R = rng(s);
  const edge = x => ay - 34 + Math.round(Math.sin(x * .3 + v) * 3 + wp_vn(x * .25, v, 91) * 12);   // zerbrochene Oberkante
  wp_xMason(B, 0, ay - 52, 64, ay, { s: 85, rubble: true, per: 64, R: wp_P.grey, mossK: 1.1, mask: (x, y) => y >= edge(x) });
  for (let x = 0; x < 64; x++){ const e = edge(x); wp_set(B, x, e, wp_tone(wp_P.grey, .8, x, e)); if (wp_h(x, 3, s) > .6) wp_set(B, x, e - 1, wp_tone(wp_P.moss, .5, x, e - 1)); }
  for (let i = 0; i < 2; i++){ const hx = 10 + (R() * 40 | 0), hy = ay - 22 + (R() * 8 | 0); wp_ell(B, hx, hy, 4, 3, (x, y) => wp_op(B, x, y) ? wp_tone(wp_P.dark, .2 + (y - hy) * .1, x, y) : 0); }
  for (let i = 0; i < 3; i++) wp_ivy(B, 4 + (R() * 56 | 0), ay - 2, 16 + (R() * 12 | 0), s + i, (x, y) => wp_op(B, x, y));
  for (let i = 0; i < 6; i++){ const x = 3 + (R() * 58 | 0); wp_ell(B, x, ay - 2, 2 + R() * 2, 1.6, (X, Y) => wp_tone(wp_P.grey, .6 - (Y - ay + 2) * .2, X, Y)); }   // herabgefallene Steine
  wp_outline(B, true);
  return { img: wp_canvas(B), ax: B.ax, ay, foot: [[-32, -22, 32, 2]], occl: [-32, -58, 32, -20], extra: {} };
}
function wp_rTurm(s, v){
  const B = wp_img(76, 112, 108), ay = B.ay, cx = B.ax, r = 28, R = rng(s);
  wp_groundShadow(B, cx + 4, ay + 1, 32, 5);
  wp_xTower(B, cx, ay - 92, ay - 6, r, { s: 87 + v, rubble: true, R: wp_P.grey, ry: 6 });
  // ausgebrochene Krone
  for (let x = cx - r; x < cx + r; x++){ const e = ay - 92 + Math.round(Math.abs(Math.sin((x - cx) * .18 + v)) * 14 + wp_vn(x * .2, v, 33) * 16); for (let y = ay - 94; y < e; y++) wp_set(B, x, y, 0); }
  for (let x = cx - r + 2; x < cx + r - 2; x++) for (let y = ay - 94; y < ay - 40; y++) if (wp_op(B, x, y) && !wp_op(B, x, y - 1)){ wp_set(B, x, y, wp_tone(wp_P.moss, .55, x, y)); break; }
  // Fensterlöcher, Riss, Efeu
  wp_rect(B, cx - 4, ay - 58, cx + 3, ay - 46, wp_P.dark[0]); wp_rect(B, cx - 3, ay - 60, cx + 2, ay - 58, wp_P.dark[0]);
  wp_rect(B, cx - 16, ay - 30, cx - 12, ay - 22, wp_P.dark[0]);
  wp_crack(B, cx + 8, ay - 70, 26, s, (x, y) => wp_op(B, x, y));
  for (let i = 0; i < 3; i++) wp_ivy(B, cx - 20 + (R() * 40 | 0), ay - 4, 30 + (R() * 20 | 0), s + i, (x, y) => wp_op(B, x, y));
  wp_outline(B, true);
  return { img: wp_canvas(B), ax: cx, ay, foot: [[-30, -30, 30, 2]], occl: [-36, -110, 36, -28], extra: {} };
}

/* ---------- Kleinteile ---------- */
const wp_xRes = (B, foot, occl, extra) => { wp_outline(B, true); return { img: wp_canvas(B), ax: B.ax, ay: B.ay, foot, occl, extra: extra || {} }; };
function wp_kBrunnen(s){
  const B = wp_img(36, 44, 40), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 3, ay + 1, 17, 3);
  wp_xTower(B, cx, ay - 12, ay - 4, 14, { s: 120, rubble: true, R: wp_P.grey, ry: 4 });
  wp_ell(B, cx, ay - 12, 14, 4, (x, y) => wp_tone(wp_P.grey, .75, x, y));
  wp_ell(B, cx, ay - 12, 11, 3, (x, y) => wp_tone(wp_P.dark, .1 + (y - ay + 15) * .1, x, y));
  for (const px of [cx - 11, cx + 10]) wp_beam(B, px, ay - 12, px, ay - 34, 2.5, wp_P.oak, s);
  wp_beam(B, cx - 12, ay - 33, cx + 12, ay - 33, 2, wp_P.oak, s + 1);
  for (let y = ay - 42; y < ay - 34; y++){ const t = (y - ay + 42) / 8, hw = 5 + t * 12; for (let x = Math.floor(cx - hw); x < cx + hw; x++) wp_set(B, x, y, wp_tone(wp_P.shingle, .55 - (x - cx) / hw * .25 - (y % 2 ? .1 : 0), x, y)); }
  wp_seg(B, cx, ay - 32, cx, ay - 22, 1, wp_P.straw[3]);
  wp_rect(B, cx - 2, ay - 22, cx + 3, ay - 18, (x, y) => wp_tone(wp_P.wood, .5 + (x === cx - 2 ? .2 : 0), x, y)); wp_rect(B, cx - 2, ay - 21, cx + 3, ay - 20, wp_P.iron[2]);
  return wp_xRes(B, [[-15, -14, 15, 2]], [-17, -42, 17, -14]);
}
function wp_kGalgen(s){
  const B = wp_img(72, 88, 84), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 4, ay + 1, 34, 4);
  wp_rect(B, cx - 34, ay - 6, cx + 34, ay, wp_rubble({ R: wp_P.grey, s: 130, cw: 6, chh: 3 }));    // gemauerter Sockel
  for (const px of [cx - 28, cx + 28]) wp_beam(B, px, ay - 4, px, ay - 76, 5, wp_P.gwood, s + px);
  wp_beam(B, cx - 32, ay - 74, cx + 32, ay - 74, 5, wp_P.gwood, s + 3);
  for (const sg of [-1, 1]) wp_beam(B, cx + sg * 28, ay - 62, cx + sg * 18, ay - 72, 2.5, wp_P.gwood, s + 4);   // Kopfbänder
  wp_seg(B, cx, ay - 72, cx, ay - 48, 1, wp_P.straw[2]);
  wp_ell(B, cx, ay - 44, 3, 4, (x, y) => (Math.abs((x + .5 - cx) / 3) ** 2 + ((y + .5 - ay + 44) / 4) ** 2 > .45) ? wp_P.straw[3] : 0);
  wp_beam(B, cx + 8, ay - 2, cx + 18, ay - 56, 2, wp_P.wood, s + 9);                                // Leiter
  wp_beam(B, cx + 13, ay - 2, cx + 23, ay - 56, 2, wp_P.wood, s + 10);
  for (let k = 1; k < 8; k++) wp_seg(B, cx + 8 + k * 1.25, ay - 2 - k * 6.7, cx + 13 + k * 1.25, ay - 2 - k * 6.7, 1, wp_P.wood[3]);
  for (let i = 0; i < 3; i++){ const R = rng(s + i); wp_set(B, cx - 20 + (R() * 40 | 0), ay - 78 - (R() * 4 | 0), wp_c('#1d1a22')); }
  return wp_xRes(B, [[-32, -8, -24, 2], [24, -8, 32, 2]], [-34, -86, 34, -8]);
}
function wp_kPranger(s){
  const B = wp_img(32, 52, 48), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 2, ay + 1, 10, 2);
  wp_rect(B, cx - 7, ay - 4, cx + 7, ay, wp_rubble({ R: wp_P.grey, s: 140, cw: 5, chh: 3 }));
  wp_beam(B, cx, ay - 4, cx, ay - 44, 5, wp_P.gwood, s);
  wp_rect(B, cx - 10, ay - 34, cx + 10, ay - 29, wp_hplanks(wp_P.gwood, s + 1, 5));
  for (const hx of [cx - 6, cx, cx + 6]) wp_ell(B, hx, ay - 31.5, hx === cx ? 2 : 1.4, hx === cx ? 2 : 1.4, wp_P.dark[0]);
  wp_rect(B, cx - 11, ay - 35, cx + 11, ay - 34, wp_P.iron[2]); wp_rect(B, cx - 11, ay - 29, cx + 11, ay - 28, wp_P.iron[2]);
  for (let y = ay - 50; y < ay - 44; y++){ const hw = 3 + (y - ay + 50) * 1.4; wp_rect(B, cx - hw, y, cx + hw, y + 1, (x) => wp_tone(wp_P.shingle, .6 - (x - cx) / hw * .3, x, y)); }
  wp_seg(B, cx + 3, ay - 38, cx + 6, ay - 24, 1, wp_P.iron[3]); wp_ell(B, cx + 6, ay - 22, 2, 2, (x, y) => wp_P.iron[(x + y) % 2 ? 2 : 4]);
  return wp_xRes(B, [[-8, -6, 8, 2]], null);
}
function wp_kZelt(s, v){
  const B = wp_img(88, 72, 68), cx = B.ax, ay = B.ay;
  const C = v % 2 ? [wp_P.red2, wp_P.cloth] : [wp_P.blue2, wp_P.yel2];
  wp_groundShadow(B, cx + 6, ay + 1, 44, 5);
  // Rundzelt: Kegeldach über Wand, Bahnen gestreift
  const top = ay - 60, wallT = ay - 24;
  for (let y = top; y < wallT; y++){ const t = (y - top) / (wallT - top), hw = 3 + t * 38; for (let x = Math.floor(cx - hw); x < cx + hw; x++){ const nx = (x - cx) / hw, band = Math.abs(Math.floor((nx + 1) * 5)) % 2; wp_set(B, x, y, wp_tone(C[band], .62 - nx * .3 - (y === wallT - 1 ? .15 : 0), x, y)); } }
  for (let x = cx - 40; x < cx + 40; x++){ const sc = (x - cx + 40) % 8; for (let y = wallT; y < wallT + 3 + (sc < 4 ? 1 : 0); y++) wp_set(B, x, y, wp_tone(C[1], .55 - (x - cx) * .006, x, y)); }   // Zackenbehang
  for (let y = wallT + 3; y < ay; y++) for (let x = cx - 38; x < cx + 38; x++){ const nx = (x - cx) / 38, band = Math.abs(Math.floor((nx + 1) * 6)) % 2; wp_set(B, x, y, wp_tone(C[band], .5 - nx * .25 - (y > ay - 3 ? .2 : 0), x, y)); }
  // Eingang offen, eine Bahn zurückgeschlagen
  wp_poly(B, [[cx - 6, ay], [cx, wallT + 4], [cx + 8, ay]], (x, y) => wp_tone(wp_P.dark, .15 + (y - wallT) * .02, x, y));
  wp_poly(B, [[cx + 8, ay], [cx, wallT + 4], [cx + 14, ay - 4]], (x, y) => wp_tone(C[1], .7, x, y));
  wp_seg(B, cx, top - 10, cx, top + 2, 1.5, wp_P.oak[2]);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 9 - j; i++) wp_set(B, cx + 1 + i, top - 9 + j + Math.round(Math.sin(i * .6) * .6), wp_tone(wp_P.red2, .6, i, j));    // Fähnlein
  for (const sg of [-1, 1]) { wp_line(B, cx + sg * 38, wallT, cx + sg * 44, ay + 2, wp_P.straw[2]); wp_set(B, cx + sg * 44, ay + 2, wp_P.oak[1]); }
  return wp_xRes(B, [[-40, -28, 40, 2]], [-42, -70, 42, -26]);
}
function wp_kKarren(s){
  const B = wp_img(60, 40, 36), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 3, ay + 1, 28, 3);
  wp_rect(B, cx - 24, ay - 20, cx + 20, ay - 15, wp_hplanks(wp_P.gwood, s, 3));
  for (let k = 0; k < 9; k++){ const x = cx - 23 + k * 5; wp_seg(B, x, ay - 30, x + 1, ay - 19, 1.2, wp_P.gwood[3]); }    // Leitern
  wp_beam(B, cx - 25, ay - 30, cx + 20, ay - 30, 1.6, wp_P.gwood, s + 1);
  wp_beam(B, cx + 18, ay - 17, cx + 30, ay - 12, 2, wp_P.oak, s + 2);
  for (let i = 0; i < 5; i++) wp_sack(B, cx - 18 + i * 7, ay - 20, 7, 6, s + i);
  for (const wx of [cx - 14, cx + 10]){
    wp_ell(B, wx, ay - 9, 9, 9, (x, y) => { const d = Math.hypot(x + .5 - wx, y + .5 - ay + 9); return d > 7.6 ? wp_tone(wp_P.iron, .45 - (y - ay) * .02, x, y) : d > 6.2 ? wp_tone(wp_P.oak, .45, x, y) : 0; });
    for (let a = 0; a < 6; a++){ const an = a * Math.PI / 3; wp_line(B, wx, ay - 9, wx + Math.cos(an) * 6.5, ay - 9 + Math.sin(an) * 6.5, wp_P.oak[2]); }
    wp_ell(B, wx, ay - 9, 1.8, 1.8, wp_P.iron[3]);
  }
  return wp_xRes(B, [[-28, -14, 28, 2]], null);
}
function wp_kHeu(s){
  const B = wp_img(44, 34, 32), cx = B.ax, ay = B.ay, R = rng(s);
  wp_groundShadow(B, cx + 3, ay + 1, 21, 3);
  wp_ell(B, cx, ay - 12, 19, 13, (x, y) => { if (y > ay) return 0; const nx = (x + .5 - cx) / 19, ny = (y + .5 - ay + 12) / 13; return wp_tone(wp_P.straw, .55 - nx * .3 - ny * .25 + (wp_h(x, y >> 1, s) - .5) * .35, x, y); });
  for (let i = 0; i < 26; i++){ const x = cx - 16 + R() * 32, y = ay - 22 + R() * 20; if (wp_op(B, x, y)) wp_line(B, x, y, x + (R() - .5) * 6, y + R() * 3, wp_P.straw[R() < .5 ? 5 : 2]); }
  wp_seg(B, cx + 6, ay - 26, cx + 14, ay - 34, 1, wp_P.wood[3]);                        // Heugabel-Stiel
  return wp_xRes(B, [[-18, -12, 18, 2]], null);
}
function wp_kScheuche(s){
  const B = wp_img(32, 56, 52), cx = B.ax, ay = B.ay;
  wp_beam(B, cx, ay, cx, ay - 44, 2.5, wp_P.gwood, s); wp_beam(B, cx - 13, ay - 32, cx + 13, ay - 33, 2, wp_P.gwood, s + 1);
  wp_poly(B, [[cx - 12, ay - 33], [cx + 12, ay - 34], [cx + 8, ay - 14], [cx - 9, ay - 15]], (x, y) => wp_tone(wp_P.cloth, .4 + (wp_h(x >> 1, y >> 1, s) - .5) * .4 - (x - cx) * .015, x, y));
  for (let i = 0; i < 5; i++) wp_line(B, cx - 7 + i * 3, ay - 15, cx - 8 + i * 3.5, ay - 9, wp_P.straw[4]);
  wp_ell(B, cx, ay - 39, 4, 4, (x, y) => wp_tone(wp_P.cloth, .7 - (x - cx) * .05, x, y));
  wp_rect(B, cx - 7, ay - 44, cx + 7, ay - 42, wp_P.dark[2]); wp_rect(B, cx - 4, ay - 48, cx + 4, ay - 44, wp_P.dark[3]);
  for (const sg of [-1, 1]) wp_line(B, cx + sg * 13, ay - 33, cx + sg * 15, ay - 29, wp_P.straw[3]);
  return wp_xRes(B, [[-3, -3, 3, 1]], null);
}
function wp_kGrabstein(s, v){
  const B = wp_img(18, 22, 20), cx = B.ax, ay = B.ay, R = rng(s);
  wp_ell(B, cx, ay - 1, 8, 2.4, (x, y) => wp_tone(wp_P.earth, .4 + (wp_h(x, y, s) - .5) * .4, x, y));
  const tilt = (v % 3) - 1, h = 13 + v % 3;
  for (let y = ay - h - 3; y < ay - 1; y++) for (let x = cx - 6; x < cx + 6; x++){
    const tx = x - Math.round((ay - y) * tilt * .08), round = y < ay - h + 2 && Math.hypot(tx + .5 - cx, y - (ay - h + 2)) > 6;
    if (round) continue;
    wp_set(B, x, y, wp_tone(wp_P.grey, .62 - (tx - cx) * .05 + (wp_h(x, y, s) - .5) * .2 + (y > ay - 5 ? -.1 : 0), x, y));
  }
  wp_rect(B, cx - 1, ay - h - 1, cx, ay - h + 6, wp_P.dark[2]); wp_rect(B, cx - 3, ay - h + 1, cx + 2, ay - h + 2, wp_P.dark[2]);
  for (let i = 0; i < 4; i++) wp_tint(B, cx - 6 + (R() * 12 | 0), ay - 3 - (R() * 8 | 0), wp_P.moss[3], .7);
  return wp_xRes(B, [[-7, -4, 7, 1]], null);
}
function wp_kGrabkreuz(s, v){
  const B = wp_img(16, 24, 22), cx = B.ax, ay = B.ay, lean = (v % 3 - 1) * 2;
  wp_ell(B, cx, ay - 1, 7, 2.2, (x, y) => wp_tone(wp_P.earth, .4 + (wp_h(x, y, s) - .5) * .4, x, y));
  wp_beam(B, cx, ay - 1, cx + lean, ay - 20, 2.4, wp_P.gwood, s);
  wp_beam(B, cx - 5 + lean * .6, ay - 15, cx + 5 + lean * .6, ay - 15, 2, wp_P.gwood, s + 1);
  if (v % 2) wp_seg(B, cx - 1, ay - 13, cx + 2, ay - 6, 1, wp_c('#4d4a3a'));        // vertrockneter Kranz
  return wp_xRes(B, [[-3, -3, 3, 1]], null);
}
function wp_kWegkreuz(s){
  const B = wp_img(28, 52, 48), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 2, ay + 1, 9, 2);
  wp_rect(B, cx - 5, ay - 4, cx + 5, ay, wp_rubble({ R: wp_P.grey, s: 150, cw: 4, chh: 2 }));
  wp_beam(B, cx, ay - 3, cx, ay - 40, 3, wp_P.oak, s); wp_beam(B, cx - 9, ay - 31, cx + 9, ay - 31, 2.5, wp_P.oak, s + 1);
  // Corpus
  wp_rect(B, cx - 1, ay - 33, cx + 1, ay - 21, (x, y) => wp_tone(wp_P.flesh, .55 - (x - cx) * .2, x, y));
  wp_seg(B, cx - 7, ay - 31, cx + 7, ay - 31, 1, wp_P.flesh[3]); wp_set(B, cx, ay - 35, wp_P.flesh[3]); wp_rect(B, cx - 1, ay - 26, cx + 1, ay - 24, wp_P.cloth[4]);
  for (let y = ay - 46; y < ay - 39; y++){ const hw = 2 + (y - ay + 46) * 1.4; wp_rect(B, cx - hw, y, cx + hw, y + 1, (x) => wp_tone(wp_P.shingle, .6 - (x - cx) / hw * .3 - (y % 2 ? .12 : 0), x, y)); }
  return wp_xRes(B, [[-3, -3, 3, 1]], null);
}
function wp_kFels(s, v){
  const B = wp_img(68, 50, 46), cx = B.ax, ay = B.ay, R = rng(s);
  wp_groundShadow(B, cx + 5, ay + 1, 33, 4);
  const pts = [], n = 11;
  for (let i = 0; i < n; i++){ const a = Math.PI + i / (n - 1) * Math.PI, rr = .75 + R() * .25; pts.push([cx + Math.cos(a) * 31 * rr, ay - 2 + Math.sin(a) * 40 * rr]); }
  pts.push([cx + 31, ay]); pts.push([cx - 31, ay]);
  wp_poly(B, pts, (x, y) => {
    const f = Math.floor(wp_vn(x * .12, y * .12, s + v, 0) * 5);
    let t = .55 - (x - cx) / 31 * .25 - (y - ay + 40) / 40 * -.1 + (f - 2) * .07 + (wp_h(x, y, s) - .5) * .15;
    if (Math.abs(wp_vn(x * .12, y * .12, s + v, 0) * 5 - f - .5) > .46) t -= .22;
    return wp_tone(wp_P.grey, t, x, y);
  });
  wp_shade(B, cx - 31, ay - 4, cx + 32, ay, .25);
  for (let i = 0; i < 30; i++){ const x = cx - 28 + R() * 56, y = ay - 34 + R() * 24; if (wp_op(B, x, y) && !wp_op(B, x, y - 2)) wp_tint(B, x, y, wp_P.moss[3], .8); }
  for (let i = 0; i < 8; i++) wp_set(B, cx - 20 + (R() * 40 | 0), ay - 10 - (R() * 22 | 0), wp_P.lichen[R() * 3 | 0]);
  for (let i = 0; i < 3; i++) wp_crack(B, cx - 15 + (R() * 30 | 0), ay - 30 + (R() * 15 | 0), 8, s + i, (x, y) => wp_op(B, x, y));
  for (let i = 0; i < 4; i++) wp_grass(B, cx - 28 + i * 18, ay - 1, 4, s + i);
  return wp_xRes(B, [[-30, -18, 30, 2]], [-32, -46, 32, -16]);
}
function wp_kStein(s){
  const B = wp_img(24, 18, 16), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 2, ay + 1, 11, 2);
  wp_ell(B, cx, ay - 6, 10, 7, (x, y) => y > ay ? 0 : wp_tone(wp_P.grey, .6 - (x - cx) * .04 - (y - ay + 6) * .05 + (wp_h(x >> 1, y >> 1, s) - .5) * .3, x, y));
  wp_tint(B, cx - 3, ay - 10, wp_P.moss[4], .8); wp_tint(B, cx - 2, ay - 11, wp_P.moss[3], .8);
  return wp_xRes(B, [[-10, -7, 10, 1]], null);
}
function wp_kFeuerschale(s){
  const B = wp_img(22, 30, 28), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 2, ay + 1, 9, 2);
  for (const sg of [-1, 0, 1]) wp_seg(B, cx + sg * 2, ay - 14, cx + sg * 8, ay, 1.4, wp_P.iron[2]);
  wp_ell(B, cx, ay - 16, 9, 4, (x, y) => wp_tone(wp_P.iron, .5 - (x - cx) * .04 + (y > ay - 16 ? -.2 : .1), x, y));
  wp_rect(B, cx - 7, ay - 19, cx + 7, ay - 17, (x, y) => wp_tone(wp_P.char, .3 + wp_h(x, y, s) * .6, x, y));
  for (let i = 0; i < 5; i++) wp_set(B, cx - 5 + i * 2.5, ay - 18, wp_c(i % 2 ? '#c8401c' : '#e0782a'));
  return wp_xRes(B, [[-7, -5, 7, 1]], null, { flames: [{ x: 0, y: -19, big: true }] });
}
function wp_kLagerfeuer(s){
  const B = wp_img(28, 20, 18), cx = B.ax, ay = B.ay, R = rng(s);
  wp_ell(B, cx, ay - 4, 11, 4, (x, y) => wp_tone(wp_P.char, .25 + wp_h(x, y, s) * .5, x, y));
  for (let a = 0; a < 10; a++){ const an = a / 10 * Math.PI * 2; wp_ell(B, cx + Math.cos(an) * 11, ay - 4 + Math.sin(an) * 4, 2.2, 1.6, (x, y) => wp_tone(wp_P.grey, .65 - (y - ay + 4) * .15, x, y)); }
  for (let i = 0; i < 3; i++){ const an = R() * Math.PI; wp_beam(B, cx - Math.cos(an) * 7, ay - 4 - Math.sin(an) * 2, cx + Math.cos(an) * 7, ay - 4 + Math.sin(an) * 2, 2, wp_P.oak, s + i); }
  for (let i = 0; i < 6; i++) wp_set(B, cx - 4 + (R() * 8 | 0), ay - 4 - (R() * 2 | 0), wp_c(R() < .5 ? '#c8401c' : '#f0a040'));
  wp_outline(B, true);
  return { img: wp_canvas(B), ax: cx, ay, foot: [], occl: null, extra: { flames: [{ x: 0, y: -6, big: true }], smoke: [{ x: 0, y: -14 }] } };
}
function wp_xWattle(B, x0, x1, y0, y1, s, vertical){
  if (!vertical){
    for (let x = x0 + 2; x < x1; x += 8) wp_beam(B, x, y1, x, y0 - 2, 2, wp_P.gwood, s + x);
    for (let y = y0; y < y1 - 1; y++) for (let x = x0; x < x1; x++){
      const row = Math.floor((y - y0) / 2), ph = Math.floor((x - x0 + 2) / 8) + row;
      if (wp_op(B, x, y) && (x - x0 + 2) % 8 < 2 && ph % 2 === 0) continue;
      wp_set(B, x, y, wp_tone(wp_P.wood, .5 + ((y - y0) % 2 ? -.15 : .1) + (ph % 2 ? -.12 : .05) + (wp_h(x, y, s) - .5) * .2, x, y));
    }
  } else {
    for (let y = y0; y < y1; y += 8) wp_beam(B, x0 + (x1 - x0) / 2, y + 3, x0 + (x1 - x0) / 2, y - 9, 2, wp_P.gwood, s + y);
    wp_rect(B, x0 + 2, y0, x1 - 2, y1 - 1, (x, y) => wp_tone(wp_P.wood, .45 + ((y >> 1) % 2 ? -.12 : .1) + (x === x0 + 2 ? .15 : 0), x, y));
  }
}
function wp_kZaunH(s){ const B = wp_img(32, 22, 20); wp_xWattle(B, 0, 32, B.ay - 12, B.ay, 160); wp_shade(B, 0, B.ay - 2, 32, B.ay, .2); return { img: wp_canvas(B), ax: B.ax, ay: B.ay, foot: [[-16, -4, 16, 1]], occl: null, extra: {} }; }
function wp_kZaunV(s){ const B = wp_img(10, 34, 32); wp_xWattle(B, 1, 9, 4, B.ay, 161, true); return wp_xRes(B, [[-3, -32, 3, 1]], null); }
function wp_kSpiesse(s, v){
  const B = wp_img(40, 48, 44), cx = B.ax, ay = B.ay, R = rng(s);
  wp_ell(B, cx, ay - 1, 14, 3, (x, y) => wp_tone(wp_P.earth, .35 + wp_h(x, y, s) * .3, x, y));
  for (let i = 0; i < 4; i++){
    const bx = cx - 10 + i * 7 + (R() - .5) * 4, a = -Math.PI / 2 + (R() - .5) * 1.1, L = 18 + R() * 22, ex = bx + Math.cos(a) * L, ey = ay - 2 + Math.sin(a) * L;
    wp_beam(B, bx, ay - 2, ex, ey, 1.8, wp_P.wood, s + i);
    if (i % 2 === 0){ wp_seg(B, ex, ey, ex + Math.cos(a) * 5, ey + Math.sin(a) * 5, 1.6, wp_P.iron[4]); }
    else { wp_line(B, ex - 1, ey, ex + 1, ey - 2, wp_P.wood[4]); }                       // zersplittert
  }
  // eingedellte Schaller am Boden
  wp_ell(B, cx + 8, ay - 4, 6, 4, (x, y) => y > ay - 2 ? 0 : wp_tone(wp_P.iron, .6 - (x - cx - 8) * .06 - (y - ay + 4) * .1, x, y));
  wp_rect(B, cx + 2, ay - 3, cx + 15, ay - 2, wp_P.iron[2]); wp_set(B, cx + 6, ay - 6, wp_P.iron[1]);
  // zerrissener Fahnenfetzen
  if (v % 2) for (let j = 0; j < 5; j++) for (let i = 0; i < 8 - j; i++) wp_set(B, cx - 14 + i, ay - 30 + j + (i % 3 === 0 ? 1 : 0), wp_tone(wp_P.red2, .5 - j * .05, i, j));
  return wp_xRes(B, [[-14, -6, 14, 2]], null);
}
function wp_kFass(s){ const B = wp_img(18, 22, 20); wp_groundShadow(B, B.ax + 2, B.ay + 1, 8, 2); wp_barrel(B, B.ax, B.ay, 13, 17, s); return wp_xRes(B, [[-7, -5, 7, 1]], null); }
function wp_kKisten(s){
  const B = wp_img(28, 26, 24), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 3, ay + 1, 13, 2);
  const crate = (x0, y0, w, h, k) => {
    wp_rect(B, x0, y0, x0 + w, y0 + h, wp_hplanks(wp_P.wood, s + k, 3, { oy: y0 }));
    wp_rect(B, x0, y0, x0 + w, y0 + 1, wp_P.wood[4]);
    for (const xx of [x0, x0 + w - 2]) wp_rect(B, xx, y0, xx + 2, y0 + h, wp_P.iron[2]);
    wp_line(B, x0 + 2, y0 + h - 1, x0 + w - 3, y0 + 1, wp_P.wood[1]);
  };
  crate(cx - 12, ay - 12, 14, 12, 1); crate(cx + 1, ay - 10, 11, 10, 2); crate(cx - 8, ay - 22, 12, 10, 3);
  return wp_xRes(B, [[-12, -8, 12, 1]], null);
}
function wp_kWegweiser(s){
  const B = wp_img(26, 44, 40), cx = B.ax, ay = B.ay;
  wp_beam(B, cx, ay, cx, ay - 38, 2.6, wp_P.gwood, s);
  const board = (y, dir) => { const x0 = dir > 0 ? cx + 1 : cx - 11; wp_rect(B, x0, y, x0 + 10, y + 4, wp_hplanks(wp_P.gwood, s + y, 4)); wp_poly(B, dir > 0 ? [[cx + 11, y], [cx + 13, y + 2], [cx + 11, y + 4]] : [[cx - 11, y], [cx - 13, y + 2], [cx - 11, y + 4]], wp_P.gwood[3]); for (let i = 2; i < 9; i += 2) wp_set(B, x0 + i, y + 2, wp_P.gwood[0]); };
  board(ay - 34, 1); board(ay - 27, -1);
  wp_set(B, cx, ay - 39, wp_P.gwood[4]);
  return wp_xRes(B, [[-3, -3, 3, 1]], null);
}
function wp_kBanner(s){
  const B = wp_img(24, 56, 52), cx = B.ax - 8, ay = B.ay;
  wp_rect(B, cx - 2, ay - 3, cx + 3, ay, wp_P.grey[3]);
  wp_seg(B, cx, ay - 2, cx, ay - 52, 1.6, wp_P.oak[3]); wp_set(B, cx, ay - 53, wp_P.gold[5]); wp_set(B, cx, ay - 52, wp_P.gold[3]);
  wp_xFlagCloth(B, cx + 1, ay - 50, 17, 16, s % 5);
  return wp_xRes(B, [[-2, -3, 2, 1]], null);
}

/* Marktstand: Pfosten, gestreiftes Sonnendach mit Bogenkante, Ladentisch und Ware (v: 0 Brot, 1 Tuch, 2 Töpfe, 3 Kohl und Rüben, 4 Fisch, 5 Äpfel) */
function wp_kMarktstand(s, v){
  const B = wp_img(52, 44, 41), ax = B.ax, ay = B.ay, R = rng(s), ware = v % 6;
  const AW = [[wp_P.red2, wp_P.cloth], [wp_P.blue2, wp_P.cloth], [wp_P.yel2, wp_P.red2], [wp_P.red2, wp_P.yel2], [wp_P.blue2, wp_P.yel2], [wp_P.cloth, wp_P.red2]][v % 6];
  const x0 = ax - 21, x1 = ax + 21, top = ay - 14;
  wp_shadowPoly(B, [[x0 + 2, ay - 1], [x1 + 5, ay - 1], [x1 + 5, ay + 2], [x0 + 2, ay + 2]]);
  // hintere Pfosten und Rückwand aus Tuch
  for (const x of [x0 + 2, x1 - 2]) wp_beam(B, x, ay - 8, x, ay - 32, 2, wp_P.wood, s + x);
  wp_rect(B, x0 + 3, ay - 30, x1 - 2, top - 2, (x, y) => wp_tone(AW[1], .28 + (y - ay + 30) * .012 + (((x - x0) % 8) < 1 ? -.1 : 0), x, y));
  // Ladentisch: Platte und Bretterfront
  wp_rect(B, x0, top, x1, top + 2, (x, y) => wp_tone(wp_P.wood, y === top ? .85 : .55, x, y));
  wp_rect(B, x0 + 1, top + 2, x1 - 1, ay - 2, wp_planks(wp_P.wood, s + 2, 4, { ox: x0 + 1 }));
  wp_rect(B, x0 + 1, ay - 3, x1 - 1, ay - 2, wp_P.wood[1]);
  // Ware auf dem Tisch
  const lay = (n, fn) => { for (let i = 0; i < n; i++) fn(x0 + 4 + (i + .5) * (x1 - x0 - 8) / n, top - 1, i); };
  if (ware === 0) lay(6, (x, y, i) => { if (i % 3 === 2){ wp_ell(B, x, y - 2, 2.6, 2, (X, Y) => (Math.hypot(X - x + .3, Y - y + 2) < 1.1) ? 0 : wp_tone(wp_P.straw, .5 - (Y - y) * .1, X, Y)); } else { wp_ell(B, x, y - 1.6, 3, 2, (X, Y) => wp_tone(wp_P.straw, .82 - (Y - y + 2) * .16 - (X - x) * .03, X, Y)); wp_line(B, x - 1, y - 2, x + 1, y - 3, wp_P.straw[2]); } });
  if (ware === 1) lay(5, (x, y, i) => { const C = [wp_P.red2, wp_P.blue2, wp_P.yel2, wp_P.cloth, wp_P.moss][i]; for (let k = 0; k < 2; k++) wp_ell(B, x, y - 1.5 - k * 3, 3.4, 1.7, (X, Y) => wp_tone(C, .75 - (Y - y + 1.5 + k * 3) * .2 - (Math.abs(X - x) > 2.6 ? .25 : 0), X, Y)); });
  if (ware === 2) lay(5, (x, y, i) => { const C = i & 1 ? wp_P.red : wp_P.ochre, h = 4 + (i % 3); wp_ell(B, x, y - h / 2, 2.6, h / 2, (X, Y) => wp_tone(C, .7 - (X - x) * .12, X, Y)); wp_rect(B, x - 1, y - h - 1, x + 2, y - h, C[1]); });
  if (ware === 3) lay(6, (x, y, i) => { if (i & 1){ for (let k = 0; k < 3; k++) wp_line(B, x - 1 + k, y - 1, x - 2 + k * 1.5, y - 4, wp_P.ochre[4]); wp_set(B, x, y - 5, wp_LEAF.busch[5]); } else wp_ell(B, x, y - 2, 2.6, 2.4, (X, Y) => wp_tone(wp_LEAF.buche, .75 - (Y - y + 2) * .18 - (X - x) * .1 + (wp_h(X * 2, Y * 2, s) - .5) * .2, X, Y)); });
  if (ware === 4){ wp_rect(B, x0 + 3, top - 1, x1 - 3, top, wp_P.gwood[3]); lay(6, (x, y, i) => { wp_ell(B, x, y - 1.2, 3, 1.1, (X, Y) => wp_tone(wp_P.iron, .85 - (Y - y + 1) * .25, X, Y)); wp_set(B, x + 3, y - 1, wp_P.iron[3]); wp_set(B, x - 2, y - 2, wp_P.dark[1]); }); }
  if (ware === 5) lay(3, (x, y, i) => { wp_ell(B, x, y - 2, 4.4, 2.6, (X, Y) => wp_tone(wp_P.straw, .45 - (Y - y + 2) * .15, X, Y)); for (let k = 0; k < 5; k++) wp_ell(B, x - 3 + k * 1.5, y - 4 - (k & 1), 1.2, 1.1, (X, Y) => wp_tone(i === 1 ? wp_LEAF.birke : wp_P.red2, .8 - (Y - y + 4) * .2, X, Y)); });
  // vordere Pfosten
  for (const x of [x0 + 1, x1 - 1]) wp_beam(B, x, ay - 1, x, ay - 28, 2, wp_P.wood, s + 9 + x);
  // Sonnendach: schräge Bahn mit Längsstreifen, vorn Bogenkante
  const stripe = x => Math.floor((x - x0 + 60) / 5) & 1;
  wp_poly(B, [[x0 - 3, ay - 28], [x1 + 3, ay - 28], [x1 + 1, ay - 36], [x0 - 1, ay - 36]], (x, y) => wp_tone(AW[stripe(x)], .5 + (y - ay + 36) * .045 + (wp_h(x, y, s) - .5) * .08, x, y));
  for (let x = x0 - 3; x <= x1 + 3; x++){
    const lx = (x - x0 + 60) % 5, h = lx === 0 || lx === 4 ? 1 : 2;
    for (let j = 0; j <= h; j++) wp_set(B, x, ay - 28 + j, wp_tone(AW[stripe(x)], .38 - j * .1, x, ay - 28 + j));
  }
  wp_line(B, x0 - 1, ay - 36, x1 + 1, ay - 36, wp_P.wood[2]);
  return wp_xRes(B, [[-22, -10, 22, 2]], [-26, -40, 26, -12], {});
}
/* Maibaum: geschälter Stamm mit Kränzen, Bändern und Zunftzeichen */
function wp_kMaibaum(s){
  const B = wp_img(30, 112, 108), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 4, ay + 1, 10, 2);
  wp_rect(B, cx - 4, ay - 3, cx + 5, ay + 1, (x, y) => wp_tone(wp_P.grey, y === ay - 3 ? .8 : .5, x, y));
  wp_seg(B, cx, ay - 2, cx, ay - 100, 2.8, (x, y, t, q) => wp_tone(wp_P.birch, .7 - q * .35 + ((Math.floor((y + x * .4) / 5) & 1) ? -.2 : 0), x, y));
  // Querstangen mit Zeichen
  for (const [y, w] of [[ay - 78, 9], [ay - 60, 8], [ay - 42, 7]]){
    wp_seg(B, cx - w, y, cx + w, y, 1.4, wp_P.oak[3]);
    for (const sx of [-1, 1]){ const x = cx + sx * w; wp_rect(B, x - 2, y + 1, x + 2, y + 5, (X, Y) => wp_tone(sx < 0 ? wp_P.red2 : wp_P.blue2, .7 - (Y - y) * .08, X, Y)); wp_set(B, x, y + 3, wp_P.gold[5]); }
  }
  // Kranz oben, flatternde Bänder
  wp_ell(B, cx, ay - 101, 6, 2.4, (x, y) => Math.abs(((x - cx) / 6) ** 2 + ((y - ay + 101) / 2.4) ** 2) > .4 ? wp_tone(wp_LEAF.fichte, .6 - (y - ay + 101) * .1 + (wp_h(x, y, s) - .5) * .3, x, y) : 0);
  for (let i = 0; i < 4; i++){ const C = [wp_P.red2, wp_P.yel2, wp_P.blue2, wp_P.cloth][i]; for (let k = 0; k < 14; k++) wp_set(B, cx - 5 + i * 3 + Math.round(Math.sin(k * .6 + i) * 1.4), ay - 99 + k, wp_tone(C, .6, 0, 0)); }
  wp_ell(B, cx, ay - 106, 2, 3, (x, y) => wp_tone(wp_LEAF.fichte, .5 - (y - ay + 106) * .1, x, y));
  return wp_xRes(B, [[-4, -3, 4, 1]], [-10, -108, 10, -10], {});
}
