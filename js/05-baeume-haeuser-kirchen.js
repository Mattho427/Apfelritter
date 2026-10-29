"use strict";
/* Der Apfelritter, Teil 5 von 29: Bäume, Häuser, Kirchen und Klöster, Stromland-Bauten.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Bäume ============ */
wp_P.sbark = wp_rmp(['#1d1613', '#2e241e', '#40322a', '#544237', '#685446']);                  // Fichtenrinde
wp_P.wbark = wp_rmp(['#1e1b17', '#302b25', '#433d34', '#575044', '#6c6555', '#807966']);       // Weidenrinde
wp_P.abark = wp_rmp(['#1c1814', '#2d2620', '#3f362d', '#51473b', '#655a4b', '#7a6e5c']);       // Apfelrinde
wp_P.rods = wp_rmp(['#26241a', '#3a3824', '#4e4a2e', '#625c38', '#767044']);                   // Weidenruten
const wp_APL = wp_rmp(['#3f1210', '#6a1d18', '#922b21', '#b2402d', '#d0705a']);                // Äpfel

/* Rinde je Art: Funktion für wp_seg/wp_curve */
function wp_barkFn(type, s, o){
  o = o || {};
  const R = { beech: wp_P.beech, birch: wp_P.birch, spruce: wp_P.sbark, dead: wp_P.gwood, willow: wp_P.wbark, apple: wp_P.abark }[type] || wp_P.bark;
  return (x, y, t, q, nx) => {
    const side = q * (nx >= 0 ? 1 : -1);
    let v = .5 - side * .34 + (o.lit || 0);
    if (Math.abs(side) > .78) v += side < 0 ? .06 : -.12;
    if (type === 'beech'){
      v += .08 + (wp_fbm(x * .3, y * .2, s, 2) - .5) * .25;
      if (wp_h(x, y >> 1, s + 3) > .93) v -= .25;                              // Lentizellen
      if (wp_vn(x * .4, y * .4, s + 8) > .78) v -= .18;                          // Narben
      if (o.moss && side > .2 && wp_fbm(x * .3, y * .15, s + 5, 2) > .52) return wp_tone(wp_P.moss, .45 + side * .1, x, y);
    } else if (type === 'birch'){
      v += .2;
      const low = o.base ? clamp((y - (o.base - 14)) / 14, 0, 1) : 0;
      if (wp_h(x >> 1, y, s) > .84 - low * .4 || (wp_vn(x * .5, y * .9, s + 4) > .74)) return wp_P.birch[low > .5 ? 0 : 1];
      if (low > 0 && wp_vn(x * .7, y * .25, s + 6) < low * .55) return wp_P.birch[1 + (wp_h(x, y, s) * 2 | 0)];
    } else if (type === 'spruce'){
      if (wp_h(x >> 1, y >> 1, s) > .7) v += .14;
      if (((x + y * 2) & 3) === 0) v -= .12;
    } else if (type === 'dead'){
      const f = wp_vn(x * .9, y * .12, s);
      if (Math.abs(f - .5) < .08) v -= .32;
      if (wp_vn(x * .2, y * .08, s + 2) > .6) v += .14;                          // abgeschälte Rinde: helles Holz
      else v -= .08;
    } else {
      // Borke mit Längsfurchen
      const f = wp_vn(x * .62, y * .15, s);
      if (Math.abs(f - .5) < (type === 'willow' ? .1 : .07)) v -= .34;
      else if (f > .72) v += .12;
      if (wp_h(x, y, s + 1) > .94) v -= .2;
      if ((type === 'apple' || type === 'oak') && side < .2 && wp_fbm(x * .3, y * .3, s + 9, 2) > .6 && wp_h(x, y, s + 4) > .45) return wp_P.lichen[(wp_h(x, y, s) * 2) | 0];
      if (o.moss && side > .3 && wp_fbm(x * .3, y * .15, s + 5, 2) > .55) return wp_tone(wp_P.moss, .4 + side * .1, x, y);
    }
    return wp_tone(R, v + (wp_h(x, y, s + 7) - .5) * .1, x, y);
  };
}
/* Ast als Kurve */
function wp_limb(B, x0, y0, cx, cy, x1, y1, w0, w1, fn){ wp_curve(B, x0, y0, cx, cy, x1, y1, w0, w1, fn, Math.max(4, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3))); }
/* Wurzelanlauf am Stammfuß */
function wp_roots(B, x, y, w, n, fn, R){
  for (let i = 0; i < n; i++){
    const side = i % 2 ? 1 : -1, L = 2 + R() * 4;
    wp_limb(B, x + side * w * .25, y - 5, x + side * (w * .45 + L * .3), y - 1, x + side * (w * .38 + L), y + R(), w * .5, 1.6, fn);
  }
}

/* Farbton mit schwachem Raster (dz 0..1 = Rasterstärke) */
function wp_tq(R, v, x, y, dz){
  const n = R.length, i = Math.floor(v * (n - 1) + .5 + (BAYER4[(y & 3) * 4 + (x & 3)] / 16 - .5) * dz);
  return R[i < 0 ? 0 : i >= n ? n - 1 : i];
}
/* Lappen (Teilkronen) rund um eine Kronenellipse */
function wp_lobes(R, cx, cy, rx, ry, n, k){
  const L = [[cx, cy + ry * .12, rx * .56, ry * .56]];
  for (let i = 0; i < n; i++){
    const a = -Math.PI * 1.08 + Math.PI * 1.16 * (i + .5) / n + (R() - .5) * .35, d = .5 + R() * .12;
    const sz = (k || 1) * (.85 + R() * .3);
    L.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rx * .44 * sz, ry * .48 * sz]);
  }
  for (const side of [-1, 1]) if (R() < .8) L.push([cx + side * rx * (.5 + R() * .1), cy + ry * (.25 + R() * .1), rx * .4, ry * .42]);
  return L;
}
/* ---------- Laubkrone aus Lappen und Blattbüscheln ----------
   o: cx, cy, rx, ry (Gesamtform für Licht), lobes [[x,y,rx,ry]], L Rampe, s, n Büschel gesamt,
   r0, r1 Büschelradius, sq Abflachung, mask(x,y), base Grundhelligkeit, dz Raster */
function wp_crown(B, o){
  if (wp_SEA === 3 && o.L !== wp_LEAF.fichte && !o.ever) return wp_bareCrown(B, o);
  const R = rng(o.s), L = o.L, lobes = (o.lobes || [[o.cx, o.cy, o.rx, o.ry]]).slice();
  lobes.sort((p, q) => (p[1] + p[3] * .6) - (q[1] + q[3] * .6));
  const area = lobes.reduce((a, l) => a + l[2] * l[3], 0), sq = o.sq || .8, base = o.base === undefined ? .44 : o.base, dz = o.dz === undefined ? .55 : o.dz;
  const all = [];
  lobes.forEach((lb, li) => {
    const n = Math.max(3, Math.round(o.n * lb[2] * lb[3] / area)), cl = [];
    for (let i = 0; i < n * 8 && cl.length < n; i++){
      const a = R() * Math.PI * 2, d = Math.pow(R(), o.pw || .5);
      const x = lb[0] + Math.cos(a) * d * lb[2], y = lb[1] + Math.sin(a) * d * lb[3];
      if (o.mask && !o.mask(x, y)) continue;
      cl.push({ x, y, r: o.r0 + R() * (o.r1 - o.r0) * (1.05 - d * .3), k: R(), id: li * 997 + i, lb });
    }
    cl.sort((p, q) => p.y - q.y);
    for (const c of cl) all.push(c);
  });
  for (const c of all){
    const rx = c.r, ry = c.r * sq, lb = c.lb;
    for (let y = Math.floor(c.y - ry - 1); y <= Math.ceil(c.y + ry + 1); y++){
      for (let x = Math.floor(c.x - rx - 1); x <= Math.ceil(c.x + rx + 1); x++){
        const dx = (x + .5 - c.x) / rx, dy = (y + .5 - c.y) / ry, d2 = dx * dx + dy * dy;
        const edge = 1 + (wp_vn(Math.atan2(dy, dx) * 2.2 + c.id * .37, c.id * .13, o.s) - .5) * .5;
        if (d2 > edge * edge){
          if (d2 < (edge + .35) ** 2 && dy < .2 && wp_h(x, y, o.s + 31) > .78 && !wp_op(B, x, y)) wp_set(B, x, y, wp_tq(L, base + .06 - dy * .15, x, y, dz));
          continue;
        }
        const gx = (x + .5 - o.cx) / o.rx, gy = (y + .5 - o.cy) / o.ry, g2 = Math.min(1, gx * gx + gy * gy);
        const Lg = -.55 * gx - .62 * gy + .5 * Math.sqrt(1 - g2);
        const bx = (x + .5 - lb[0]) / lb[2], by = (y + .5 - lb[1]) / lb[3], b2 = Math.min(1, bx * bx + by * by);
        const Lb = -.55 * bx - .65 * by + .5 * Math.sqrt(1 - b2);
        let t = base + Lg * .2 + Lb * .2 + (c.k - .5) * .08;
        const ox = dx + .3, oy = dy + .4, lit = ox * ox + oy * oy < .72 * edge * edge;
        if (lit){
          t += .1;
          if (wp_h(x >> 1, y, c.id + o.s) > .8) t += .14;                      // Blattglanz
        } else {
          t -= .1;
          if (wp_h(x, y >> 1, c.id + o.s + 5) > .84) t -= .12;
        }
        if (d2 > .66 * edge * edge && dx + dy > .25) t -= .14;                 // Schattenrand unten rechts
        if ((bx + .25) ** 2 + (by + .3) ** 2 > 1.05) t -= .09;                // Lappen-Unterseite
        if (o.tint) t += o.tint(x, y);
        wp_set(B, x, y, wp_tq(L, t, x, y, dz));
      }
    }
  }
  return all;
}
/* dunkles Kroneninneres mit Blattstruktur (sichtbar in Lücken) */
function wp_crownCore(B, cx, cy, rx, ry, L, s, lobes){
  if (wp_SEA === 3 && L !== wp_LEAF.fichte && L !== wp_LEAF.kiefer) return;
  const f = (x, y) => wp_tq(L, .06 + (wp_h(x >> 1, y, s) > .7 ? .14 : 0) + wp_fbm(x * .2, y * .2, s, 2) * .16, x, y, .5);
  if (lobes) for (const l of lobes) wp_ell(B, l[0], l[1] + l[3] * .1, l[2] * .82, l[3] * .78, f);
  else wp_ell(B, cx, cy, rx, ry, f);
}
/* Äpfel in die Krone hängen */
function wp_apples(B, cx, cy, rx, ry, n, s){
  if (wp_SEA === 3) return [];
  if (wp_SEA === 0) return wp_blossoms(B, cx, cy, rx, ry, n, s);
  if (wp_SEA === 2) n = Math.round(n * 1.7);   // Herbst: Erntezeit
  const R = rng(s), pts = [];
  for (let i = 0; i < n * 10 && pts.length < n; i++){
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * .86;
    const x = Math.round(cx + Math.cos(a) * d * rx), y = Math.round(cy + Math.sin(a) * d * ry * .92 + ry * .05);
    if (!wp_op(B, x, y) || !wp_op(B, x + 2, y + 2) || !wp_op(B, x, y - 1)) continue;
    if (pts.some(p => Math.abs(p[0] - x) < 4 && Math.abs(p[1] - y) < 4)) continue;
    pts.push([x, y]);
    const big = R() < .45, glint = R() < .6;
    if (big){
      wp_set(B, x + 1, y, wp_APL[3]); wp_set(B, x, y + 1, wp_APL[3]); wp_set(B, x + 1, y + 1, wp_APL[2]); wp_set(B, x + 2, y + 1, wp_APL[1]);
      wp_set(B, x + 1, y + 2, wp_APL[1]); wp_set(B, x, y + 2, wp_APL[2]); wp_set(B, x + 2, y + 2, wp_APL[0]); wp_set(B, x + 2, y, wp_APL[2]);
      if (glint) wp_set(B, x + 1, y, wp_APL[4]);
      wp_dk(B, x + 1, y + 3, .55); wp_dk(B, x + 2, y + 3, .55); wp_dk(B, x + 3, y + 2, .6);
      if (R() < .5) wp_set(B, x + 1, y - 1, wp_P.bark[1]);
    } else {
      wp_set(B, x, y, glint ? wp_APL[4] : wp_APL[3]); wp_set(B, x + 1, y, wp_APL[2]); wp_set(B, x, y + 1, wp_APL[2]); wp_set(B, x + 1, y + 1, wp_APL[1]);
      wp_dk(B, x, y + 2, .6); wp_dk(B, x + 1, y + 2, .55); wp_dk(B, x + 2, y + 1, .65);
    }
  }
  return pts;
}
/* Mistelkugel */
function wp_mistel(B, cx, cy, r, s){
  const L = wp_rmp(['#2e3a1c', '#4a5a28', '#6a7a36', '#8c9a4c']);
  wp_ell(B, cx, cy, r, r * .85, (x, y) => (wp_h(x, y, s) > .25 ? wp_tone(L, .55 - (x + .5 - cx) / r * .3 - (y + .5 - cy) / r * .3 + (wp_h(x, y, s + 1) - .5) * .4, x, y) : 0));
  wp_set(B, Math.round(cx), Math.round(cy - 1), wp_c('#d8d6b8'));
}
const wp_treeOut = (B) => { wp_outline(B, true); };
function wp_treeRes(B, foot, crown, extra){
  return { img: wp_canvas(B), ax: B.ax, ay: B.ay, foot, occl: crown ? [Math.round(crown[0] - B.ax), Math.round(crown[1] - B.ay), Math.round(crown[2] - B.ax), Math.min(-4, Math.round(crown[3] - B.ay))] : null, extra: extra || {} };
}

/* ---------- Apfelbaum (alter Hochstamm im Streuobst) ---------- */
function wp_tApfel(s){
  const B = wp_img(72, 84, 81), R = rng(s), ax = B.ax, ay = B.ay, L = wp_LEAF.apfel;
  const cx = ax + (R() - .5) * 4, cy = 35 + (R() - .5) * 3, rx = 30 + R() * 3, ry = 23 + R() * 3;
  wp_groundShadow(B, ax + 4, ay, 26, 5);
  const bark = wp_barkFn('apple', s), lean = (R() - .5) * 7, tx = ax + lean, ty = ay - 24 - R() * 4;
  wp_roots(B, ax, ay, 8, 3, bark, R);
  wp_limb(B, ax, ay + 1, ax + lean * .2, ay - 12, tx, ty, 8, 6, bark);
  const lobes = wp_lobes(R, cx, cy, rx, ry, 6, 1);
  wp_crownCore(B, cx, cy, rx, ry, L, s, lobes);
  // Leitäste zu den Lappen
  for (const l of lobes.slice(1)) if (R() < .7) wp_limb(B, tx, ty + 2, (tx + l[0]) / 2 + (R() - .5) * 8, (ty + l[1]) / 2 + 3, l[0], l[1] + l[3] * .3, 4.5, 1.6, bark);
  const holes = []; for (let i = 0; i < 3; i++) holes.push([cx + (R() - .5) * rx * 1.1, cy + (R() - .2) * ry * .7, 3 + R() * 2.5]);
  wp_crown(B, { cx, cy, rx, ry, lobes, L, s, n: 130, r0: 3, r1: 5.5, sq: .78, mask: (x, y) => !holes.some(h => Math.hypot(x - h[0], y - h[1]) < h[2]) });
  wp_apples(B, cx, cy, rx, ry, 16 + (R() * 7 | 0), s + 5);
  if (R() < .35) wp_mistel(B, cx + (R() - .5) * rx, cy - ry * .45, 3, s);
  // Stütze unter einem schweren Ast (Gabelstange)
  if (R() < .5){
    const side = R() < .5 ? -1 : 1, px = Math.round(cx + side * rx * .5), py = Math.round(cy + ry * .55);
    wp_line(B, px + side * 9, ay, px, py + 1, (x, y, t) => wp_P.gwood[t < .5 ? 3 : 2]);
    wp_set(B, px - 1, py, wp_P.gwood[3]); wp_set(B, px + 1, py, wp_P.gwood[2]); wp_set(B, px - 1, py - 1, wp_P.gwood[4]); wp_set(B, px + 1, py - 1, wp_P.gwood[3]);
  }
  wp_grass(B, ax - 6, ay, 7, s + 9, wp_LEAF.busch);
  wp_treeOut(B);
  return wp_treeRes(B, [[-6, -8, 6, 2]], [cx - rx + 4, cy - ry + 6, cx + rx - 4, ay - 8], { crown: { x: Math.round(cx - ax), y: Math.round(cy - ay) }, apples: true });
}

/* ---------- Eiche (knorrig, breit) ---------- */
function wp_tEiche(s){
  const B = wp_img(88, 104, 100), R = rng(s), ax = B.ax, ay = B.ay, L = wp_LEAF.eiche;
  const cx = ax + (R() - .5) * 4, cy = 42, rx = 40, ry = 33;
  wp_groundShadow(B, ax + 5, ay, 34, 6);
  const bark = wp_barkFn('oak', s, { moss: true }), tx = ax + (R() - .5) * 4, ty = ay - 34;
  wp_roots(B, ax, ay, 13, 5, bark, R);
  wp_limb(B, ax, ay + 1, ax, ay - 18, tx, ty, 13, 10, bark);
  // deutlich getrennte Lappen
  const lobes = [], nl = 6 + (R() * 2 | 0);
  for (let i = 0; i < nl; i++){
    const a = -Math.PI * (.02 + .96 * i / (nl - 1)) + (R() - .5) * .25, d = .58 + R() * .14;
    lobes.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d * .85 + 5, 11 + R() * 5, 9 + R() * 3]);
  }
  lobes.push([cx - rx * .35, cy + ry * .35, 13, 9], [cx + rx * .35, cy + ry * .32, 13, 9], [cx, cy + 2, 15, 11]);
  wp_crownCore(B, cx, cy, rx, ry, L, s, lobes);
  for (const l of lobes){
    const mx = (tx + l[0]) / 2 + (R() - .5) * 14, my = (ty + l[1]) / 2 + (R() - .5) * 8;
    wp_limb(B, tx, ty + 3, mx, my, l[0], l[1] + 3, 6, 2, bark);
  }
  wp_limb(B, tx - 4, ty + 6, tx - 9, ty + 2, tx - 12, ty + 3, 3, 2, bark);
  wp_crown(B, { cx, cy, rx, ry, lobes, L, s, n: 210, r0: 3, r1: 5.8, sq: .76, pw: .5, base: .42 });
  const hx = Math.round(tx + (R() - .5) * 4), hy = ay - 14 - (R() * 6 | 0);
  wp_ell(B, hx, hy, 1.6, 2.6, () => wp_P.dark[0]); wp_set(B, hx - 1, hy - 3, wp_P.bark[4]); wp_set(B, hx, hy - 3, wp_P.bark[3]);
  wp_grass(B, ax - 10, ay, 10, s + 9, wp_LEAF.busch);
  wp_treeOut(B);
  return wp_treeRes(B, [[-8, -9, 8, 2]], [cx - rx + 4, cy - ry + 8, cx + rx - 4, ay - 9]);
}

/* ---------- Buche (glatter grauer Stamm, dichte Kuppel) ---------- */
function wp_tBuche(s){
  const B = wp_img(80, 100, 97), R = rng(s), ax = B.ax, ay = B.ay, L = wp_LEAF.buche;
  const cx = ax + (R() - .5) * 3, cy = 38, rx = 36, ry = 32;
  wp_groundShadow(B, ax + 5, ay, 30, 5.5);
  const bark = wp_barkFn('beech', s, { moss: true }), tx = ax + (R() - .5) * 3, ty = ay - 40;
  wp_roots(B, ax, ay, 10, 4, bark, R);
  wp_limb(B, ax, ay + 1, ax, ay - 20, tx, ty, 10, 7, bark);
  const lobes = wp_lobes(R, cx, cy, rx, ry, 5, 1.15);
  wp_crownCore(B, cx, cy, rx, ry, L, s, lobes);
  for (let i = 0; i < 5; i++){
    const px = cx + (i - 2) * rx * .3 + (R() - .5) * 6, py = cy - ry * .25 + Math.abs(i - 2) * 6;
    wp_limb(B, tx, ty + 4, (tx + px) / 2, ty - 4, px, py, 4, 1.5, bark);
  }
  const holes = []; for (let i = 0; i < 2; i++) holes.push([cx + (R() - .5) * rx, cy + R() * ry * .4, 3 + R() * 2]);
  wp_crown(B, { cx, cy, rx, ry, lobes, L, s, n: 220, r0: 3.5, r1: 6.5, sq: .58, base: .47, mask: (x, y) => !holes.some(h => Math.hypot(x - h[0], y - h[1]) < h[2]) });
  wp_grass(B, ax - 8, ay, 8, s + 9, wp_LEAF.busch);
  wp_treeOut(B);
  return wp_treeRes(B, [[-6, -8, 6, 2]], [cx - rx + 4, cy - ry + 8, cx + rx - 4, ay - 8]);
}

/* ---------- Fichte (Stufen hängender Zweige) ---------- */
function wp_tFichte(s){
  const B = wp_img(52, 104, 101), R = rng(s), ax = B.ax, ay = B.ay, L = wp_LEAF.fichte;
  const top = 3 + (R() * 3 | 0), bot = ay - 9, hw = 22 + R() * 2.5;
  wp_groundShadow(B, ax + 4, ay, 20, 4.5);
  const bark = wp_barkFn('spruce', s);
  wp_limb(B, ax, ay + 1, ax, ay - 30, ax, top + 6, 5, 2, bark);
  wp_limb(B, ax - 1, ay - 2, ax - 4, ay, ax - 6, ay + 1, 2.5, 1, bark); wp_limb(B, ax + 1, ay - 2, ax + 4, ay, ax + 6, ay + 1, 2.5, 1, bark);
  const tiers = [];
  let y = bot;
  while (y > top + 6){ const h = 9 + (y - top) * .05 + R() * 2; tiers.push([y, h]); y -= h * .72; }
  const cones = [];
  for (const [yb, h] of tiers){
    const yt = yb - h, rel = (yb - top) / (bot - top), w0 = hw * Math.pow(Math.max(0, rel), .9) + 2, jagS = s + yb;
    for (let yy = Math.floor(yt); yy <= Math.ceil(yb + 4); yy++){
      for (let x = Math.floor(ax - w0 - 3); x <= Math.ceil(ax + w0 + 3); x++){
        const dx = x + .5 - ax, f = (yy - yt) / h;
        if (f < 0) continue;
        const half = w0 * (.35 + .65 * Math.pow(Math.min(1, f), 1.1)) + (wp_h(x, yy >> 1, jagS) - .5) * 1.6;
        if (Math.abs(dx) > half) continue;
        // gezackte Unterkante: Zweigspitzen hängen nach außen tiefer
        const jag = (wp_h(x >> 1, 0, jagS) - .35) * 3 + (Math.abs(dx) / w0) * 3.2 - (Math.abs(dx) < 3 ? 1 : 0);
        if (yy > yb + jag) continue;
        const nx = dx / (w0 + 1), low = yy - (yb + jag);
        let t = .5 - nx * .3 + (1 - rel) * .06;
        const st = wp_vn(dx * .6 - yy * .55 * Math.sign(dx || 1), yy * .8, s + 3);
        if (st > .62) t += .14; else if (st < .3) t -= .14;
        if (low > -1.2) t -= .34; else if (low > -2.6) t -= .16;   // dunkle Zweigspitzen unten
        if (f < .3) t -= .24; else if (f > .45 && f < .75) t += .08; // Schatten unter der Stufe darüber, heller Bauch
        wp_set(B, x, yy, wp_tq(L, t, x, yy, .5));
      }
    }
    if (rel < .5 && R() < .85) cones.push([ax + (R() - .5) * w0 * 1.1, yb - 3]);
  }
  wp_line(B, ax, top - 2, ax, top + 6, L[4]); wp_set(B, ax - 1, top + 3, L[5]); wp_set(B, ax + 1, top + 4, L[3]);
  for (const [x, yy] of cones){ const X = Math.round(x), Y = Math.round(yy); if (!wp_op(B, X, Y)) continue; wp_set(B, X, Y, wp_P.sbark[4]); wp_set(B, X, Y + 1, wp_P.sbark[3]); wp_set(B, X, Y + 2, wp_P.sbark[1]); }
  wp_treeOut(B);
  return wp_treeRes(B, [[-5, -8, 5, 2]], [-hw + 6 + ax, top + 14, hw - 6 + ax, ay - 8]);
}

/* ---------- Birke (Moor, schlank, hängende Zweige) ---------- */
function wp_tBirke(s){
  const B = wp_img(44, 88, 85), R = rng(s), ax = B.ax, ay = B.ay, L = wp_LEAF.birke;
  const cx = ax + (R() - .5) * 4, cy = 33, rx = 17, ry = 27;
  wp_groundShadow(B, ax + 3, ay, 14, 3.5);
  const bark = wp_barkFn('birch', s, { base: ay });
  const lean = (R() - .5) * 6;
  wp_limb(B, ax, ay + 1, ax + lean * .3, ay - 30, ax + lean, 12, 4.5, 2, bark);
  if (R() < .55){ const l2 = lean + (R() < .5 ? -7 : 7); wp_limb(B, ax + 1, ay - 2, ax + l2 * .5, ay - 28, ax + l2, 22, 3, 1.5, bark); }
  const lobes = [];
  lobes.push([cx, cy, rx * .7, ry * .75]);
  for (let i = 0; i < 8; i++) lobes.push([cx + (R() - .5) * rx * 1.3, cy + (i / 7 - .5) * ry * 1.5 + (R() - .5) * 4, 5 + R() * 2.5, 5 + R() * 2]);
  wp_crownCore(B, cx, cy, rx, ry, L, s, lobes.map(l => [l[0], l[1], l[2] * .7, l[3] * .7]));
  for (let i = 0; i < 7; i++){
    const y0 = ay - 30 - i * 6, side = i & 1 ? 1 : -1, x0 = ax + lean * (1 - (y0 - 12) / (ay - 12));
    wp_limb(B, x0, y0, x0 + side * 4, y0 - 5, x0 + side * (5 + R() * 4), y0 - 5 + R() * 3, 1.5, 1, () => wp_P.birch[2]);
  }
  wp_crown(B, { cx, cy, rx, ry, lobes, L, s, n: 150, r0: 1.7, r1: 3, sq: .9, base: .48, pw: .7, mask: (x, y) => wp_h(Math.round(x / 4), Math.round(y / 4), s + 7) > .12 });
  for (let i = 0; i < 18; i++){
    const side = R() < .5 ? -1 : 1, x0 = cx + side * rx * (.35 + R() * .5), y0 = cy + R() * ry * .7, len = 3 + R() * 6;
    for (let k = 0; k < len; k++){
      const X = Math.round(x0 + side * k * .15), Y = Math.round(y0 + k);
      if (!wp_op(B, X, Y)) wp_set(B, X, Y, L[2 + (R() * 4 | 0)]);
    }
  }
  wp_grass(B, ax - 6, ay, 7, s + 9, wp_LEAF.weide);
  wp_treeOut(B);
  return wp_treeRes(B, [[-4, -6, 4, 2]], [cx - rx + 3, cy - ry + 6, cx + rx - 3, ay - 6]);
}

/* ---------- Kopfweide (Flussufer) ---------- */
function wp_tWeide(s){
  const B = wp_img(72, 80, 77), R = rng(s), ax = B.ax, ay = B.ay, L = wp_LEAF.weide;
  const hy = ay - 30 - (R() * 4 | 0), cx = ax, cy = hy - 20, rx = 29, ry = 18;
  wp_groundShadow(B, ax + 4, ay, 22, 4.5);
  const bark = wp_barkFn('willow', s, { moss: true });
  wp_roots(B, ax, ay, 15, 4, bark, R);
  wp_limb(B, ax, ay + 1, ax - 2 + (R() - .5) * 4, ay - 14, ax, hy + 3, 15, 14, bark);
  // Ruten (unterer Teil bleibt sichtbar)
  const shoots = [];
  for (let i = 0; i < 46; i++){
    const x0 = ax + (R() - .5) * 18, a = -Math.PI / 2 + (x0 - ax) / 18 * 1.3 + (R() - .5) * .35, len = 14 + R() * 16;
    shoots.push([x0, hy - 1, x0 + Math.cos(a) * len, hy - 1 + Math.sin(a) * len * .9]);
  }
  for (const [x0, y0, x1, y1] of shoots) wp_line(B, x0, y0, x1, y1, (x, y, t) => wp_P.rods[t < .35 ? 1 : 2 + ((x + y) & 1)]);
  const lobes = [[cx, cy, 24, 13], [cx - 17, cy + 6, 10, 8], [cx + 17, cy + 5, 10, 8], [cx - 8, cy - 7, 12, 8], [cx + 9, cy - 8, 11, 8]];
  for (let i = 0; i < 4; i++) lobes.push([cx + (R() - .5) * 44, cy + (R() - .5) * 14, 6 + R() * 3, 6 + R() * 2]);
  wp_crown(B, { cx, cy, rx, ry, lobes, L, s, n: 170, r0: 1.6, r1: 3, sq: 1.45, base: .42, pw: .6 });
  // Kopf: knotige Wülste, oben im Laubschatten
  for (let i = 0; i < 7; i++){
    const kx = ax + (i - 3) * 2.8 + (R() - .5) * 2, ky = hy + (R() - .5) * 3, r = 2 + R() * 1.8;
    wp_ell(B, kx, ky, r, r * .9, (x, y) => bark(x, y, 0, (x + .5 - kx) / r, 1));
    wp_shade(B, kx - r, ky - r, kx + r, ky - r + 2, .35);
  }
  // vordere Ruten über dem Kopf
  for (let i = 0; i < 14; i++){ const [x0, y0, x1, y1] = shoots[i * 3]; wp_line(B, x0, y0, x0 + (x1 - x0) * .4, y0 + (y1 - y0) * .4, (x, y, t) => wp_P.rods[2 + (t > .5 ? 1 : 0)]); }
  const hx = ax + (R() < .5 ? -2 : 2), hY = ay - 14;
  wp_ell(B, hx, hY, 2.4, 4.5, (x, y) => wp_P.dark[(y + .5 - hY) > 2 ? 1 : 0]);
  wp_grass(B, ax - 9, ay, 9, s + 9, wp_LEAF.weide);
  wp_treeOut(B);
  return wp_treeRes(B, [[-6, -8, 6, 2]], [cx - rx + 4, cy - ry + 6, cx + rx - 4, ay - 8]);
}

/* ---------- Toter Baum (kahl, Bruchäste, Baumschwamm) ---------- */
function wp_tTot(s){
  const B = wp_img(60, 84, 81), R = rng(s), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 3, ay, 16, 3.5);
  const bark = wp_barkFn('dead', s), tx = ax + (R() - .5) * 8, ty = ay - 34 - R() * 6;
  wp_roots(B, ax, ay, 9, 4, bark, R);
  wp_limb(B, ax, ay + 1, ax + (tx - ax) * .2, ay - 16, tx, ty, 9, 6, bark);
  const twig = (x, y, a, len) => { const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len; wp_line(B, x, y, x1, y1, (px, py, t) => wp_P.gwood[t < .5 ? 2 : 1]); return [x1, y1]; };
  const grow = (x, y, a, len, w, d) => {
    if (w < 1.6 || d <= 0){
      // feine Zweige: dünne Linien, leicht geknickt
      const [x1, y1] = twig(x, y, a, len);
      if (R() < .7) twig(x1, y1, a - .5 - R() * .3, len * .55); if (R() < .6) twig(x1, y1, a + .4 + R() * .3, len * .45);
      return;
    }
    const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len, bend = (R() - .5) * len * .3;
    wp_limb(B, x, y, (x + x1) / 2 + Math.cos(a + 1.57) * bend, (y + y1) / 2 + Math.sin(a + 1.57) * bend, x1, y1, w, w * .7, bark);
    if (R() < .15 && d < 3){ wp_set(B, Math.round(x1), Math.round(y1) - 1, wp_P.gwood[5]); wp_set(B, Math.round(x1) + 1, Math.round(y1) - 2, wp_P.gwood[4]); return; }
    const n = R() < .35 ? 3 : 2;
    for (let i = 0; i < n; i++) grow(x1, y1, a + (i - (n - 1) / 2) * (.5 + R() * .4) + (R() - .5) * .35, len * (.6 + R() * .2), w * .6, d - 1);
  };
  grow(tx, ty, -Math.PI / 2 - .55 - R() * .2, 14 + R() * 4, 5, 3);
  grow(tx, ty, -Math.PI / 2 + .5 + R() * .2, 13 + R() * 4, 4.5, 3);
  if (R() < .7) grow(tx, ty - 2, -Math.PI / 2 + (R() - .5) * .3, 10, 3.5, 3);
  // abgebrochener Aststummel mit Splittern
  const side = R() < .5 ? -1 : 1, by = ay - 24 - (R() * 6 | 0);
  wp_limb(B, tx + side * 2, by, tx + side * 6, by - 2, tx + side * 9, by - 3, 3, 2.4, bark);
  wp_set(B, Math.round(tx + side * 10), by - 4, wp_P.gwood[5]); wp_set(B, Math.round(tx + side * 10), by - 2, wp_P.gwood[4]);
  // Zunderschwamm am Stamm
  const fy = ay - 10 - (R() * 10 | 0), fs = R() < .5 ? -1 : 1, fx = Math.round(ax + (tx - ax) * .15 + fs * 4);
  for (let k = 0; k < 2; k++){
    const yy = fy - k * 4;
    for (let i = 0; i < 4 - k; i++){ wp_set(B, fx + fs * i, yy, wp_tone(wp_P.cloth, .62 - i * .08, 0, 0)); wp_set(B, fx + fs * i, yy + 1, wp_tone(wp_P.earth, .55 - i * .1, 0, 0)); }
  }
  const hx = Math.round(ax + (tx - ax) * .4), hy = ay - 22;
  wp_ell(B, hx, hy, 1.5, 3, () => wp_P.dark[0]);
  wp_grass(B, ax - 7, ay, 8, s + 9, wp_LEAF.weide);
  wp_treeOut(B);
  return { img: wp_canvas(B), ax, ay, foot: [[-5, -8, 5, 2]], occl: null, extra: {} };
}

/* ---------- Busch (Hasel, Schlehe, Hagebutte) ---------- */
function wp_tBusch(s){
  const B = wp_img(36, 26, 24), R = rng(s), ax = B.ax, ay = B.ay, L = wp_LEAF.busch;
  const cx = ax + (R() - .5) * 2, cy = 14, rx = 15.5, ry = 10;
  wp_groundShadow(B, ax + 2, ay, 16, 3);
  const lobes = [[cx - 7, cy + 2, 8, 7], [cx + 7, cy + 2, 8, 7], [cx - 1, cy - 3, 9, 7], [cx + (R() - .5) * 6, cy + 4, 9, 5]];
  wp_crownCore(B, cx, cy, rx, ry, L, s, lobes);
  for (let i = 0; i < 5; i++) wp_line(B, ax + (i - 2) * 2, ay, ax + (i - 2) * 5, cy + 2, wp_P.bark[2]);
  wp_crown(B, { cx, cy, rx, ry, lobes, L, s, n: 50, r0: 2.6, r1: 4.4, sq: .78, base: .46 });
  const kind = R();
  if (kind < .66){
    const col = kind < .33 ? [wp_c('#24233a'), wp_c('#3d3d5c'), wp_c('#6d6f8e')] : [wp_c('#5c1712'), wp_c('#8e2a1c'), wp_c('#c0553a')];
    for (let i = 0; i < 12; i++){
      const x = Math.round(cx + (R() - .5) * rx * 1.6), y = Math.round(cy + (R() - .5) * ry * 1.4);
      if (!wp_op(B, x, y) || !wp_op(B, x + 1, y + 1)) continue;
      wp_set(B, x, y, col[2]); wp_set(B, x + 1, y, col[1]); wp_set(B, x, y + 1, col[1]); wp_set(B, x + 1, y + 1, col[0]);
    }
  }
  wp_treeOut(B);
  return { img: wp_canvas(B), ax, ay, foot: [[-14, -9, 14, 1]], occl: null, extra: {} };
}


/* ============ Häuser: Dorfhaus, Brandruine, Stadthaus, Mühle ============ */
const wp_PLA = () => [wp_P.plaster, wp_P.plaster, wp_P.ochre, wp_P.pink];
function wp_res(B, foot, occl, extra){ wp_outline(B, true); return { img: wp_canvas(B), ax: B.ax, ay: B.ay, foot, occl, extra: extra || {} }; }

/* Scheunentor: zwei Flügel mit Z-Strebe, Bänder, Riegel; open 0..1 = linker Flügel offen */
function wp_barnDoor(B, x, y, w, h, s, open){
  const R = wp_P.gwood, I = wp_P.iron, hw = w >> 1;
  for (let k = 0; k < 2; k++){
    const x0 = x + k * hw, ww = k ? w - hw : hw;
    if (k === 0 && open){ wp_rect(B, x0, y, x0 + ww, y + h, (X, Y) => wp_P.dark[Y < y + 3 ? 0 : (X < x0 + 2 ? 0 : 1)]); for (let j = 3; j < h; j++) if (wp_h(x0 + 2, j, s) > .4) wp_set(B, x0 + 2 + (j & 1), y + j, wp_P.straw[1 + (j % 3)]); continue; }
    wp_rect(B, x0, y, x0 + ww, y + h, wp_planks(R, s + k, 3, { ox: x0 }));
    wp_beam(B, x0, y + 2, x0 + ww, y + 2, 2, R, s + 5); wp_beam(B, x0, y + h - 3, x0 + ww, y + h - 3, 2, R, s + 6);
    if (k === 0) wp_beam(B, x0 + 1, y + h - 3, x0 + ww - 1, y + 3, 2, R, s + 7); else wp_beam(B, x0 + 1, y + 3, x0 + ww - 1, y + h - 3, 2, R, s + 7);
    for (const by of [y + 2, y + h - 3]) for (let i = 0; i < 4; i++) wp_set(B, k ? x0 + ww - 1 - i : x0 + i, by, I[i === 0 ? 2 : 3]);
  }
  for (let j = 0; j < h; j++) wp_set(B, x + hw, y + j, wp_P.dark[1]);
  wp_rect(B, x + hw - 2, y + (h >> 1), x + hw + 3, y + (h >> 1) + 1, I[3]);
  wp_rect(B, x - 1, y - 1, x + w + 1, y, wp_tone(wp_P.oak, .55, x, y));
}
/* Sitzbank vor dem Haus */
function wp_bench(B, x, yb, w){
  const R = wp_P.gwood;
  wp_rect(B, x, yb - 4, x + w, yb - 3, wp_tone(R, .8, x, 0)); wp_rect(B, x, yb - 3, x + w, yb - 2, wp_tone(R, .35, x, 0));
  for (const lx of [x + 1, x + w - 2]){ wp_set(B, lx, yb - 2, R[1]); wp_set(B, lx, yb - 1, R[1]); }
}
/* Wagenrad an die Wand gelehnt */
function wp_wheel(B, cx, cy, r, R, s, o){
  o = o || {};
  R = R || wp_P.wood;
  const sp = o.spokes || 8, I = wp_P.iron;
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++){
    const dx = x + .5 - cx, dy = y + .5 - cy, d = Math.hypot(dx, dy);
    if (d > r + .5) continue;
    const a = Math.atan2(dy, dx);
    if (d > r - .9 && o.tire !== false){ wp_set(B, x, y, wp_tone(I, .45 - dy / r * .25 - dx / r * .1, x, y)); continue; }
    if (d > r - (o.rim || 2.2)){ wp_set(B, x, y, wp_tone(R, .55 - dy / r * .2 - dx / r * .15 + (wp_h(Math.round(a * 6), 0, s) - .5) * .2, x, y)); continue; }
    if (d < (o.hub || 1.8)){ wp_set(B, x, y, wp_tone(R, .7 - (dx + dy) * .2, x, y)); continue; }
    const k = (a + Math.PI) / (Math.PI * 2) * sp, f = k - Math.round(k);
    if (Math.abs(f) * (Math.PI * 2 / sp) * d < .65) wp_set(B, x, y, wp_tone(R, .5 - (dx + dy) / r * .15, x, y));
  }
  if (o.hub) wp_set(B, Math.round(cx - .5), Math.round(cy - .5), I[1]);
}

/* Wirtshausschild am eisernen Ausleger: bemaltes Brett mit Wappenbild (Adler, Krone, Ochse) */
function wp_innSign(B, hx, hy, dir, emblem){
  const I = wp_P.iron, G = wp_P.gold;
  for (let i = 0; i < 12; i++) wp_set(B, hx + dir * i, hy, I[i & 1 ? 2 : 3]);
  wp_line(B, hx, hy + 4, hx + dir * 5, hy, I[2]);
  for (let i = 0; i < 3; i++){ wp_set(B, hx + dir * (11 - i), hy - 1 - (i === 1 ? 1 : 0), I[3]); }
  const bx = dir > 0 ? hx + 2 : hx - 12, by = hy + 3;
  wp_set(B, bx + 1, hy + 1, I[2]); wp_set(B, bx + 1, hy + 2, I[1]); wp_set(B, bx + 9, hy + 1, I[2]); wp_set(B, bx + 9, hy + 2, I[1]);
  const field = { adler: '#2a2420', krone: '#7a1e1c', ochse: '#d8ccae', anker: '#1c3450', kanne: '#2a3a2a', schwan: '#1e3a5a', gloecklein: '#5a1a14', lamm: '#2a4a2a' }[emblem] || '#2a2420';
  wp_rect(B, bx, by, bx + 11, by + 10, (x, y) => (x === bx || y === by || x === bx + 10 || y === by + 9) ? wp_tone(wp_P.oak, x === bx || y === by ? .7 : .3, x, y) : wp_mix(wp_c(field), wp_c('#000000'), (x - bx) * .025));
  const art = {
    adler: ['.g...g.', '.gg.gg.', 'g.ggg.g', 'ggggggg', '.g.g.g.', '..ggg..', '...g...'],
    krone: ['g..g..g', 'g.ggg.g', 'ggggggg', 'g.g.g.g', 'ggggggg', '.......', '.......'],
    ochse: ['r.....r', 'rr...rr', '.rrrrr.', '.rwrwr.', '..rrr..', '..rrr..', '...r...'],
    anker: ['..ggg..', '...g...', '.ggggg.', '...g...', 'g..g..g', 'gg.g.gg', '.ggggg.'],
    kanne: ['.sss...', '..s..s.', '.sSs.s.', '.sSss..', '.sSs...', '.sSs...', 'sssss..'],
    schwan: ['..vv...', '.v.v...', '...v...', '..vvv.v', '.vvvvvv', 'vvvvvv.', '.vvvv..'],
    gloecklein: ['...g...', '..ggg..', '.ggggg.', '.ggggg.', '.ggggg.', 'ggggggg', '...g...'],
    lamm: ['.....g.', '.....gr', '.vv..g.', 'vvvvvg.', '.vvvvv.', '.v.v.v.', '.......']
  }[emblem] || [];
  const col = { g: j => G[j < 3 ? 5 : 3], r: () => wp_c('#8e1c1c'), w: () => wp_c('#16120f'), s: () => wp_c('#d8dee6'), S: () => wp_c('#9aa4b0'), v: () => wp_c('#eeeae0') };
  art.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (col[row[i]]) wp_set(B, bx + 2 + i, by + 1 + j, col[row[i]](j)); });
}

/* ---------- Dorfhaus (Wohnstallhaus, traufständig) ---------- */
function wp_bHaus(s, v, inn){
  const B = wp_img(104, 118, 115), R = rng(s), ax = B.ax, ay = B.ay;
  const mat = ['thatch', 'tile', 'thatch', 'shingle'][(v || 0) % 4];
  const end = mat === 'thatch' ? (R() < .5 ? 'half' : 'hip') : (R() < .55 ? 'gable' : 'half');
  const PL = wp_PLA()[R() * 4 | 0], T = R() < .55 ? wp_P.oak : wp_P.oakred, pat = ['mann', 'kreuz', 'alem'][R() * 3 | 0];
  const X0 = -46, X1 = 46, D = 30, Hw = 53, plinth = 5, g1 = 31;
  const xL = ax + X0, xR = ax + X1, yG = ay - plinth, yU = ay - g1, yT = ay - Hw;
  const flip = R() < .5, stoneGF = R() < .55;
  // Bodenschatten rechts
  wp_shadowPoly(B, [[xL + 3, ay - 1], [xR + 5, ay - 1], [xR + 5, ay + 2], [xL + 3, ay + 2]]);
  // Sockel aus Bruchstein
  wp_rect(B, xL, yG, xR, ay, wp_rubble({ R: wp_P.grey, s, cw: 5, chh: 3, moss: (x, y) => (y - yG) / plinth * .55 }));
  // Grundriss: Stall auf einer Seite
  const sx = flip ? xL + 4 : xR - 24, dx = flip ? xL + 34 : xR - 36;
  const gfWins = flip ? [{ x: xL + 54, w: 7, h: 9, shut: true, glass: R() < .5 }, { x: xL + 70, w: 7, h: 9, shut: R() < .6, glass: true }]
                      : [{ x: xL + 12, w: 7, h: 9, shut: R() < .6, glass: true }, { x: xL + 28, w: 7, h: 9, shut: true, glass: R() < .5 }];
  if (stoneGF){
    // Erdgeschoss massiv, verputzt, mit abgeplatztem Putz
    const pl = wp_plaster({ R: PL, s: s + 2, flake: .8, base: yG + 2, under: wp_rubble({ R: wp_P.grey, s: s + 3, cw: 5, chh: 3 }) });
    wp_rect(B, xL, yU, xR, yG, pl);
    for (const w of gfWins){
      const wy = yG - 16;
      wp_rect(B, w.x - 1, wy - 1, w.x + w.w + 1, wy + w.h + 1, (x, y) => wp_tone(wp_P.grey, (x < w.x || y < wy) ? .75 : .45, x, y));
      wp_window(B, w.x, wy, w.w, w.h, { frame: wp_P.oak, kreuz: true, s: s + w.x, dark: !w.glass });
      if (w.shut){ wp_shutter(B, w.x - 4, wy, 3, w.h, wp_P.gwood, s + w.x); wp_shutter(B, w.x + w.w + 1, wy, 3, w.h, wp_P.gwood, s + w.x + 1); }
    }
    // Eckquader
    for (const cx of [xL, xR - 3]) for (let y = yU; y < yG; y += 3){ const w2 = ((y - yU) / 3) & 1 ? 3 : 4, x0 = cx === xL ? xL : xR - w2; wp_rect(B, x0, y, x0 + w2, y + 3, (x, yy) => wp_tone(wp_P.grey, (yy === y ? .8 : .55) - (x - x0) * .05, x, yy)); wp_line(B, x0, y + 2, x0 + w2 - 1, y + 2, wp_P.dark[2]); }
    wp_beam(B, xL - 1, yU, xR + 1, yU, 2, T, s + 1);
  } else {
    wp_fachwerk(B, { x0: xL, x1: xR, yT: yU, yB: yG, R: T, P: PL, s: s + 4, wins: gfWins, door: { x: dx, w: 10 }, pat, flake: .5, gap: 14, par: 5, dirt: true });
  }
  // Tür (Brettertür mit Bändern) in Steingewände oder Holzrahmen
  const dH = 21;
  if (R() < .5) wp_door(B, dx, yG - dH, 10, dH, { R: wp_P.wood, s: s + 7, frame: stoneGF ? wp_P.grey : T });
  else {
    // geteilte Stalltür, oberer Flügel offen
    wp_door(B, dx, yG - dH, 10, dH, { R: wp_P.wood, s: s + 7, frame: stoneGF ? wp_P.grey : T });
    wp_rect(B, dx + 1, yG - dH + 1, dx + 9, yG - dH + 9, (x, y) => wp_P.dark[y < yG - dH + 4 ? 0 : 1]);
    wp_line(B, dx + 1, yG - dH + 9, dx + 8, yG - dH + 9, wp_P.wood[4]);
  }
  // Stufe vor der Tür
  wp_rect(B, dx - 1, yG, dx + 11, yG + 2, (x, y) => wp_tone(wp_P.grey, y === yG ? .8 : .45, x, y));
  // Scheunentor
  wp_barnDoor(B, sx, yG - 22, 20, 22, s + 11, R() < .45);
  // Obergeschoss: Fachwerk mit Fenstern und Heuluke
  const upW = [];
  const living = flip ? [xL + 34, xL + 50, xL + 66, xL + 80] : [xL + 8, xL + 22, xL + 38, xL + 54];
  for (const wx of living) if (R() < .82) upW.push({ x: wx, w: 7, h: 8, shut: R() < .4, glass: R() < .7 });
  wp_fachwerk(B, { x0: xL, x1: xR, yT, yB: yU, R: T, P: PL, s: s + 5, wins: upW, pat, flake: .35, gap: 14, par: 3, sill: 3 });
  // Heuluke über dem Stall
  const hx = flip ? xL + 9 : xR - 19;
  wp_rect(B, hx, yU - 9, hx + 9, yU - 3, (x, y) => wp_P.dark[y < yU - 7 ? 0 : 1]);
  for (let i = 0; i < 9; i++) if (wp_h(i, 0, s) > .3) wp_set(B, hx + i, yU - 4 - (wp_h(i, 1, s) * 3 | 0), wp_P.straw[2 + (i % 3)]);
  wp_rect(B, hx - 1, yU - 10, hx + 10, yU - 9, wp_tone(T, .5, 0, 0)); for (let j = yU - 9; j < yU - 3; j++){ wp_set(B, hx - 1, j, T[2]); wp_set(B, hx + 9, j, T[1]); }
  // Dach
  const Hr = mat === 'thatch' ? 27 : 23;
  const rf = wp_roofEaves(B, { X0, X1, D, Hw, Hr, ov: 1, ovs: 2, end, mat, s: s + 21, moss: mat === 'thatch' ? .2 : mat === 'shingle' ? .12 : .06, mossLow: mat === 'thatch' ? .004 : 0 });
  // Schatten der Traufe auf der Wand
  wp_shade(B, xL, rf.yE, xR, rf.yE + 4, .45, 4);
  const extra = { smoke: [] };
  if (mat === 'thatch'){
    // Eulenloch am Walm: Rauchabzug
    const ex = flip ? Math.round(B.ax + rf.Xr - rf.hx - 2) : Math.round(B.ax + rf.Xl + rf.hx + 1), ey = Math.round(rf.yR) + 3;
    wp_rect(B, ex - 1, ey, ex + 2, ey + 2, wp_P.dark[0]); wp_set(B, ex, ey - 1, wp_P.dark[0]);
    extra.smoke.push({ x: ex - ax, y: ey - 2 - ay });
  } else {
    const cxm = Math.round(ax + (flip ? 16 : -16)), ch = wp_chimney(B, cxm, Math.round(rf.yR) + 10, 6, 15, s + 3);
    extra.smoke.push({ x: Math.round(ch.x - ax), y: Math.round(ch.y - ay) });
  }
  // Vordergrund: Holzstapel, Bank, Rad, Gras
  const wpx = flip ? xR - 16 : xL + 2;
  wp_woodpile(B, wpx, ay, 14, 9, s + 13);
  wp_beam(B, wpx - 1, ay - 10, wpx + 15, ay - 10, 1, wp_P.gwood, s);
  if (R() < .7) wp_bench(B, flip ? xL + 50 : xL + 42, ay + 1, 10);
  if (R() < .5) wp_wheel(B, flip ? xL + 30 : xR - 32, ay - 6, 6, wp_P.gwood, s + 4, { spokes: 6 });
  if (R() < .5) wp_barrel(B, flip ? xL + 47 : xL + 58, ay + 1, 7, 9, s + 9, { R: wp_P.wood });
  for (let i = 0; i < 6; i++) wp_grass(B, xL + 4 + R() * 88, ay + 1, 3, s + i, wp_LEAF.busch);
  extra.door = { x: dx + 5 - ax };
  if (inn){ const dir = flip ? -1 : 1; wp_innSign(B, dir > 0 ? dx + 11 : dx - 2, yG - 23, dir, inn); }
  return wp_res(B, [[-48, -40, 48, 2]], [-48, -112, 48, -6], extra);
}

/* Verbrannte Fachwerkwand: Ständer verkohlt, Gefache teils herausgefallen.
   top(x) Höhe der Wand (Y), keep Anteil verbliebener Gefache, back = Rückwand (innen, dunkler) */
function wp_burntWall(B, x0, x1, yB, H, s, o){
  const C = wp_P.char, R = rng(s), top = o.top, post = 12;
  const cells = new Map(), keep = o.keep;
  const yRail = [Math.round(H * .4), Math.round(H * .72)];
  const cellOf = (x, Y) => { const cx = Math.floor((x - x0) / post), cy = Y < yRail[0] ? 0 : Y < yRail[1] ? 1 : 2; return cx * 3 + cy; };
  const kept = k => { if (!cells.has(k)) cells.set(k, R() < keep); return cells.get(k); };
  const PL = o.P || wp_P.plaster;
  for (let x = x0; x < x1; x++){
    const tp = top(x);
    for (let Y = 0; Y < Math.min(H, tp); Y++){
      const y = yB - Y, k = cellOf(x, Y);
      if (!kept(k)) continue;
      let c = wp_tone(PL, .45 + (wp_fbm(x * .1, Y * .12, s + 1, 2) - .5) * .5, x, y);
      const soot = clamp(Y / H * .8 + wp_fbm(x * .15, Y * .1, s + 2, 2) * .6 - .3 + (o.back ? .25 : 0), 0, 1);
      c = wp_mix(c, C[1], soot * .85);
      if (Y >= tp - 1) c = wp_tone(wp_P.grey, .45, x, y);                         // Bruchkante
      wp_set(B, x, y, c);
    }
  }
  // Riegel (teilweise verbrannt)
  for (const ry of yRail) for (let x = x0; x < x1; x++) if (top(x) > ry + 1 && wp_fbm(x * .2, ry, s + 4, 2) > .35) { wp_set(B, x, yB - ry, wp_tone(C, .55, x, 0)); wp_set(B, x, yB - ry + 1, wp_tone(C, .25, x, 0)); }
  // Ständer: verkohlt, verschieden hoch, oben angekohlt spitz
  for (let x = x0; x <= x1 - 3; x += post){
    const h = Math.min(H + 4, top(x) + 4 + R() * 14) * (R() < .2 ? .5 : 1);
    wp_beam(B, x + 1.5, yB + 1, x + 1.5 + (R() - .5) * 2, yB - h, 3, R() < .3 ? wp_P.oak : C, s + x);
    wp_set(B, x + 1, Math.round(yB - h) - 1, C[2]);
  }
  // Streben in einigen Gefachen
  for (let x = x0; x < x1 - post; x += post) if (R() < .4){ const yy = Math.min(H, top(x + post / 2)) - 2; if (yy > 6) wp_beam(B, x + 2, yB - 2, x + post, yB - yy, 2, C, s + x + 3); }
}
/* ---------- Brandruine eines Dorfhauses ---------- */
function wp_bRuine(s, v){
  const B = wp_img(104, 104, 101), R = rng(s), ax = B.ax, ay = B.ay;
  const X0 = -46, X1 = 46, D = 34, xL = ax + X0, xR = ax + X1, C = wp_P.char;
  wp_shadowPoly(B, [[xL + 3, ay - 1], [xR + 5, ay - 1], [xR + 5, ay + 2], [xL + 3, ay + 2]]);
  const ybk = ay - D;
  // Rückwand (innen gesehen), oben stark eingestürzt
  wp_burntWall(B, xL + 2, xR - 2, ybk, 38, s + 1, { keep: .62, back: true, top: x => 14 + wp_fbm(x * .06, 0, s, 2) * 30 });
  // Boden innen: Asche, Schutt, Glutnester
  for (let y = ybk + 1; y < ay - 4; y++) for (let x = xL + 2; x < xR - 2; x++){
    const n = wp_fbm(x * .12, y * .2, s + 4, 3);
    let c = wp_tone(C, .25 + n * .7, x, y);
    if (n > .6 && wp_h(x, y, s + 5) > .6) c = wp_tone(wp_P.grey, .35 + n * .3, x, y);
    if (n < .32 && wp_h(x, y, s + 6) > .8) c = wp_c(wp_h(x, y, 1) > .5 ? '#9a3c1c' : '#c86a2a');
    wp_set(B, x, y, c);
  }
  // herabgestürzte Balken und Firstpfette im Inneren
  for (let i = 0; i < 7; i++){
    const x0 = xL + 6 + R() * 78, y0 = ybk + 3 + R() * 22, a = (R() - .5) * 1.2, L = 12 + R() * 18;
    wp_beam(B, x0, y0, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L * .4, 3, R() < .25 ? wp_P.oak : C, s + i * 7);
  }
  // Stirnwände als Stümpfe (von vorn hinten nach oben)
  for (const [x, lit] of [[xL, .62], [xR - 3, .28]]){
    const h = 24 + R() * 16;
    for (let Z = 0; Z <= D; Z++){
      const hh = h * (1 - Z / D * .4) - wp_h(Z >> 2, 0, s + x) * 8;
      for (let Y = 0; Y < hh; Y++) for (let i = 0; i < 3; i++){
        const y = ay - Z - Y;
        if (wp_op(B, x + i, y) && i === 1) continue;
        wp_set(B, x + i, y, wp_tone(Y < 6 ? wp_P.grey : C, lit + (i === 0 ? .1 : 0) + (wp_h(Y, Z, s) - .5) * .3, x + i, y));
      }
    }
  }
  // Sparren ragen schräg auf, einer liegt quer
  for (let i = 0; i < 3; i++){
    const x0 = xL + 16 + i * 26 + R() * 8, y0 = ybk - 6;
    wp_beam(B, x0, y0, x0 + (R() - .5) * 10, y0 - 22 - R() * 18, 3, C, s + i * 3);
  }
  wp_beam(B, xL + 10, ybk - 26, xR - 20, ybk + 4, 3, C, s + 99);
  // Vorderwand: Sockel, dann verbrannte Fachwerkwand
  wp_rect(B, xL, ay - 6, xR, ay, wp_rubble({ R: wp_P.grey, s, cw: 5, chh: 3, moss: (x, y) => (y - (ay - 6)) / 10 }));
  for (let x = xL; x < xR; x++) if (wp_h(x, 0, s) > .4) wp_tint(B, x, ay - 6, C[0], .4);
  wp_burntWall(B, xL, xR, ay - 6, 32, s + 2, { keep: .5, top: x => 6 + wp_fbm(x * .08, 3, s + 8, 2) * 30 - (Math.abs(x - ax - 4) < 9 ? 12 : 0) });
  // Türhöhle mit verkohltem Sturz
  const dx = xL + 38;
  wp_rect(B, dx, ay - 19, dx + 9, ay - 6, (x, y) => wp_op(B, x, y) ? wp_P.dark[y < ay - 16 ? 0 : 1] : 0);
  // Schutthaufen und Balken vorn
  for (let i = 0; i < 5; i++){
    const hx = xL + 6 + R() * 84, hw = 5 + R() * 6;
    wp_ell(B, hx, ay, hw, 3.2, (x, y) => wp_tone(wp_h(x, y, s) > .5 ? wp_P.grey : C, .3 + (ay - y) * .1 + wp_h(x, y, s + 2) * .35, x, y));
  }
  for (let i = 0; i < 3; i++){ const x0 = xL + 10 + R() * 70; wp_beam(B, x0, ay + 1, x0 + 10 + R() * 8, ay - 3 - R() * 5, 2, C, s + 30 + i); }
  for (let i = 0; i < 5; i++) wp_grass(B, xL + 2 + R() * 88, ay + 1, 3, s + i, wp_LEAF.weide);
  const extra = { smoke: [{ x: -16 + (R() * 8 | 0), y: -40 }, { x: 16 + (R() * 8 | 0), y: -44 }] };
  if (v === 1) extra.smoke.push({ x: -34, y: -26 });
  return wp_res(B, [[-48, -40, 48, 2]], [-48, -90, 48, -6], extra);
}

/* ---------- Stadthaus (giebelständig, Vorkragungen, Laden) ---------- */
function wp_bStadthaus(s, v, inn){
  const B = wp_img(88, 134, 130), R = rng(s), ax = B.ax, ay = B.ay;
  const PL = [wp_P.plaster, wp_P.ochre, wp_P.pink, wp_P.plaster][R() * 4 | 0], T = R() < .6 ? wp_P.oakred : wp_P.oak;
  const pat = R() < .5 ? 'mann' : 'kreuz';
  const X0 = -37, X1 = 37, D = 26, g0 = 24, st = 16, jet = 2;
  const xL = ax + X0, xR = ax + X1;
  wp_shadowPoly(B, [[xL + 3, ay - 1], [xR + 6, ay - 1], [xR + 6, ay + 2], [xL + 3, ay + 2]]);
  // Erdgeschoss: Bruchstein verputzt, Eckquader, Kielbogenportal, Laden mit Klappläden
  const yG = ay - g0;
  wp_rect(B, xL, yG, xR, ay, wp_plaster({ R: wp_P.plaster, s: s + 2, flake: .6, base: ay, under: wp_rubble({ R: wp_P.grey, s: s + 3, cw: 5, chh: 3 }) }));
  for (const cx of [xL, xR]) for (let y = yG; y < ay; y += 4){ const w2 = ((y - yG) / 4) & 1 ? 4 : 6, x0 = cx === xL ? xL : xR - w2; wp_rect(B, x0, y, x0 + w2, y + 4, (x, yy) => wp_tone(wp_P.red, (yy === y ? .8 : .55) - (x - x0) * .04 + (wp_h(x, yy, s) - .5) * .15, x, yy)); wp_line(B, x0, y + 3, x0 + w2 - 1, y + 3, wp_P.dark[2]); }
  const flip = R() < .5, px = flip ? xR - 21 : xL + 9, sx = flip ? xL + 8 : xR - 32;
  // Portal mit Kielbogen (Spätgotik) und profiliertem Gewände
  wp_door(B, px, yG + 3, 11, 21, { R: wp_P.oak, s: s + 5, arch: 'korb', frame: wp_P.red });
  for (let j = 0; j < 4; j++){ wp_set(B, px + 4 - j, yG + 2 - j + 3, wp_P.red[4]); wp_set(B, px + 6 + j, yG + 2 - j + 3, wp_P.red[2]); }
  wp_set(B, px + 5, yG + 1, wp_P.red[5]); wp_set(B, px + 5, yG, wp_P.red[4]);
  // Ladenöffnung: oberer Laden hochgeklappt, unterer als Auslage
  const sw = 22, sy = yG + 8;
  wp_rect(B, sx, sy, sx + sw, sy + 8, (x, y) => wp_P.dark[y < sy + 3 ? 0 : 1]);
  wp_rect(B, sx - 1, sy - 1, sx + sw + 1, sy, wp_tone(wp_P.red, .7, 0, 0));
  wp_rect(B, sx, sy - 4, sx + sw, sy - 1, wp_planks(wp_P.wood, s + 8, 3, { ox: sx }));
  wp_line(B, sx, sy - 4, sx + sw - 1, sy - 4, wp_P.wood[4]);
  wp_rect(B, sx - 1, sy + 8, sx + sw + 1, sy + 10, (x, y) => wp_tone(wp_P.wood, y === sy + 8 ? .8 : .3, x, y));
  // Waren auf der Auslage: Krüge, Brote oder Tuchballen
  const ware = R() * 3 | 0;
  for (let i = 0; i < 5; i++){
    const wx = sx + 2 + i * 4, wy = sy + 7;
    if (ware === 0){ wp_set(B, wx, wy, wp_tone(wp_P.ochre, .5, 0, 0)); wp_set(B, wx + 1, wy, wp_tone(wp_P.ochre, .3, 0, 0)); wp_set(B, wx, wy - 1, wp_tone(wp_P.ochre, .75, 0, 0)); wp_set(B, wx + 1, wy - 1, wp_tone(wp_P.ochre, .5, 0, 0)); wp_set(B, wx, wy - 2, wp_P.ochre[1]); }
    else if (ware === 1){ wp_set(B, wx, wy, wp_P.straw[4]); wp_set(B, wx + 1, wy, wp_P.straw[3]); wp_set(B, wx + 2, wy, wp_P.straw[2]); wp_set(B, wx + 1, wy - 1, wp_P.straw[5]); }
    else { const C = [wp_P.red2, wp_P.blue2, wp_P.yel2, wp_P.cloth][i % 4]; wp_rect(B, wx, wy - 2, wx + 3, wy + 1, (x, y) => wp_tone(C, .6 - (y - wy) * .15 - (x - wx) * .1, x, y)); }
  }
  // Obergeschosse mit Vorkragung
  let yb = yG;
  const wins = n => { const a = []; const span = (xR - xL - 8) / n; for (let i = 0; i < n; i++) a.push({ x: Math.round(xL + 4 + span * (i + .5) - 4), w: 8, h: 9, glass: true, shut: R() < .2 }); return a; };
  for (let k = 0; k < 2; k++){
    const e = (k + 1);                           // seitliche Vorkragung
    const x0 = xL - e, x1 = xR + e, yB2 = yb + jet, yT2 = yB2 - st;
    const wn = k === 0 ? 4 : (R() < .5 ? 4 : 3);
    // Fensterband: Fenster dicht nebeneinander
    wp_fachwerk(B, { x0, x1, yT: yT2, yB: yB2, R: T, P: PL, s: s + 10 + k, wins: wins(wn), pat: 'kreuz', flake: .25, gap: 16, par: 3, sill: 2 });
    wp_jetty(B, x0, x1, yB2 - 1, T, s, 5);
    yb = yT2;
  }
  // Giebel mit Fachwerk, Ladeluke, Aufzugsbalken
  const e = 3, gx0 = xL - e, gx1 = xR + e, gyB = yb + jet, Hr = 36, gyT = gyB - Hr, gcx = (gx0 + gx1) / 2;
  const inG = (x, y) => y >= gyT && y < gyB && Math.abs(x + .5 - gcx) <= (y - gyT) / Hr * (gx1 - gx0) / 2;
  const plg = wp_plaster({ R: PL, s: s + 30, flake: .2 });
  for (let y = gyT; y < gyB; y++) for (let x = gx0; x < gx1; x++) if (inG(x, y)) wp_set(B, x, y, plg(x, y));
  const beamG = (xa, ya, xb, yb2, w) => wp_beam(B, xa, ya, xb, yb2, w || 2, T, s + xa + ya, { mask: (x, y) => inG(x, y) || inG(x, y - 1) });
  const k1 = gyB - 14, k2 = k1 - 11;
  for (const ky of [gyB - 1, k1, k2]) beamG(gx0 - 2, ky, gx1 + 2, ky, 3);
  // Ständer und Streben in den Dachgeschossen
  for (let i = -2; i <= 2; i++){ const x = Math.round(gcx + i * 10); beamG(x, gyT, x, gyB, 3); }
  for (const sd of [-1, 1]){
    // Mann-Figur: Fußstreben am äußeren Ständer, Kopfbänder
    beamG(gcx + sd * 21, k1 + 2, gcx + sd * 29, gyB - 2, 2); beamG(gcx + sd * 19, k1 + 2, gcx + sd * 12, gyB - 3, 2);
    beamG(gcx + sd * 11, k2 + 2, gcx + sd * 17, k1 - 1, 2);
  }
  // Fenster im 1. Dachgeschoss, Ladeluke darüber
  for (const sd of [-1, 1]) wp_window(B, Math.round(gcx + sd * 5 - (sd < 0 ? 6 : 1)), k1 + 4, 6, 6, { frame: T, kreuz: true, s: s + sd });
  const lx = Math.round(gcx - 3);
  wp_rect(B, lx, k2 + 2, lx + 7, k1 - 1, wp_planks(wp_P.wood, s + 40, 2, { ox: lx }));
  wp_line(B, lx, k2 + 2, lx + 6, k2 + 2, wp_P.wood[1]);
  // Aufzugsbalken mit Rolle und Seil
  const ab = Math.round(gyT + 6);
  for (let i = -1; i <= 2; i++) wp_set(B, Math.round(gcx) + i, ab, wp_tone(T, .7, 0, 0));
  wp_rect(B, Math.round(gcx) - 1, ab + 1, Math.round(gcx) + 2, ab + 3, (x, y) => wp_tone(T, .3, x, y));
  wp_set(B, Math.round(gcx), ab + 3, wp_P.iron[3]); wp_line(B, Math.round(gcx) + 1, ab + 3, Math.round(gcx) + 1, k1 - 4, wp_P.straw[2]);
  wp_set(B, Math.round(gcx) + 1, k1 - 3, wp_P.iron[3]); wp_set(B, Math.round(gcx), k1 - 3, wp_P.iron[2]);
  // Dachflächen nach hinten
  const rf = wp_roofGable(B, { X0: gx0 - ax, X1: gx1 - ax, D, Hw: ay - gyB, Hr, ovf: 2, ovb: 2, ovs: 2, mat: 'tile', s: s + 50, moss: .08 });
  // Ortgang: Windbretter an der Giebelkante
  for (let y = gyT; y < gyB; y++){
    const half = (y - gyT) / Hr * (gx1 - gx0) / 2 + 1;
    wp_set(B, Math.round(gcx - half - 1), y, wp_tone(wp_P.gwood, .7, 0, 0)); wp_set(B, Math.round(gcx - half - 2), y, wp_P.gwood[1]);
    wp_set(B, Math.round(gcx + half), y, wp_tone(wp_P.gwood, .35, 0, 0)); wp_set(B, Math.round(gcx + half + 1), y, wp_P.gwood[0]);
  }
  // Schornstein auf der linken Dachfläche
  const chx = Math.round(gcx - 14), chb = Math.round(gyT + 3 - D * .55 + 14 * Hr / ((gx1 - gx0) / 2));
  const ch = wp_chimney(B, chx, chb, 6, 14, s + 60);
  // Hauszeichen am Ausleger: Brezel, Krug oder Schlüssel; beim Gasthaus das Wirtshausschild
  const hx = flip ? xL - 2 : xR + 2, hy = yG - 10, dir = flip ? -1 : 1;
  if (inn){
    wp_innSign(B, flip ? xL + 1 : xR - 1, yG - 12, dir, inn);
    for (let i = 0; i < 4; i++) wp_grass(B, xL + 2 + R() * 70, ay + 1, 2, s + i, wp_LEAF.busch);
    return wp_res(B, [[-40, -46, 40, 2]], [-42, -126, 42, -8], { smoke: [{ x: Math.round(ch.x - ax), y: Math.round(ch.y - ay) }], door: { x: px + 5 - ax } });
  }
  for (let i = 0; i < 7; i++) wp_set(B, hx + dir * i, hy, wp_P.iron[i & 1 ? 2 : 3]);
  wp_line(B, hx, hy + 3, hx + dir * 4, hy, wp_P.iron[2]);
  const sgx = hx + dir * 5 - 2, sgy = hy + 2, sign = R() * 3 | 0;
  wp_set(B, sgx + 2, sgy - 1, wp_P.iron[2]);
  const G = wp_P.gold;
  const icons = [
    ['.ggg.', 'g.g.g', 'g.g.g', '.ggg.', '.g.g.'],                   // Brezel
    ['.ggg.', 'gg.gg', 'ggggg', 'ggggg', '.ggg.'],                   // Krug
    ['.gg..', 'g..g.', '.gggg', '...g.', '...gg']                    // Schlüssel
  ][sign];
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (icons[j][i] === 'g') wp_set(B, sgx + i, sgy + j, G[i + j < 4 ? 4 : 2]);
  for (let i = 0; i < 4; i++) wp_grass(B, xL + 2 + R() * 70, ay + 1, 2, s + i, wp_LEAF.busch);
  return wp_res(B, [[-40, -46, 40, 2]], [-42, -126, 42, -8], { smoke: [{ x: Math.round(ch.x - ax), y: Math.round(ch.y - ay) }] });
}

/* ---------- Wassermühle (Rad rechts an der Wasserseite) ---------- */
function wp_bMuehle(s, v){
  const B = wp_img(124, 126, 122), R = rng(s), ax = B.ax, ay = B.ay;
  const X0 = -54, X1 = 22, D = 34, Hw = 47, g1 = 27;
  const xL = ax + X0, xR = ax + X1, yU = ay - g1, yT = ay - Hw, T = wp_P.oak;
  // Mühlgraben (Wasser) rechts unten mit Ufermauer
  const wx0 = xR - 2, wx1 = B.w;
  const WAT = wp_rmp(['#18211f', '#212d29', '#2b3a34', '#384a42', '#4d6156', '#6f8578', '#98aa9c']);
  const water = (x, y) => {
    let t = .38 + (wp_vn(x * .18, y * .7, s) - .5) * .35;
    if (wp_vn(x * .35 - y * .2, y * 1.3, s + 1) > .7) t += .3;                // Strömungslinien
    if (y < ay - 12) t -= .15;                                                   // Schatten der Ufermauer
    return wp_tone(WAT, t, x, y);
  };
  wp_rect(B, wx0, ay - 14, wx1, ay + 3, water);
  wp_rect(B, wx0, ay - 17, wx1, ay - 14, wp_ashlar({ R: wp_P.grey, s: s + 1, ch: 3, bmin: 5, bmax: 8, moss: () => .6 }));
  // Rad: oberschlächtig, Speichen, Schaufelkasten, nass und bemoost
  const wcx = ax + 43, wcy = ay - 24, wr = 22;
  const WR = wp_rmp(['#1a1612', '#2a221b', '#3a3026', '#4c3f31', '#5f5040', '#716151']);
  wp_wheel(B, wcx, wcy, wr, WR, s + 3, { spokes: 10, rim: 4.5, hub: 3.5, tire: false });
  // Schaufeln am Kranz
  for (let k = 0; k < 28; k++){
    const a = k / 28 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
    const x0 = wcx + c * (wr - 4.5), y0 = wcy + sn * (wr - 4.5), x1 = wcx + c * (wr + 1.5), y1 = wcy + sn * (wr + 1.5);
    wp_line(B, x0, y0, x1, y1, wp_tone(WR, .35 - sn * .2 - c * .1, 0, 0));
  }
  // Achse und Lager
  wp_rect(B, wcx - 3, wcy - 2, wcx + 3, wcy + 3, (x, y) => wp_tone(WR, .7 - (x - wcx) * .08 - (y - wcy) * .08, x, y));
  wp_set(B, wcx, wcy, wp_P.iron[1]);
  // Moos und Nässe am Rad
  for (let y = wcy - wr - 2; y < wcy + wr + 2; y++) for (let x = wcx - wr - 2; x < wcx + wr + 2; x++) if (wp_op(B, x, y) && wp_fbm(x * .2, y * .2, s + 5, 2) > .6) wp_tint(B, x, y, wp_P.moss[3], .45);
  // Wasser im unteren Radteil und Gischt
  wp_rect(B, wcx - wr - 2, ay - 14, wcx + wr + 3, ay + 3, (x, y) => wp_op(B, x, y) && y > ay - 9 ? water(x, y) : 0);
  for (let i = 0; i < 26; i++){ const x = wcx + (R() - .5) * wr * 1.6, y = ay - 12 - R() * 4; wp_set(B, x, y, wp_c(R() < .5 ? '#c9d2c8' : '#9fb0a4')); }
  // Gerinne (Holzrinne) von hinten rechts auf den Scheitel
  const gy = wcy - wr - 3;
  for (let x = wcx - 4; x < wx1; x++){
    const yy = gy - Math.round((x - wcx) * .18);
    wp_rect(B, x, yy - 3, x + 1, yy + 1, (X, Y) => wp_tone(WR, Y === yy - 3 ? .75 : Y === yy ? .2 : .45, X, Y));
    wp_set(B, x, yy - 2, water(x, yy - 2));
  }
  for (const px of [wcx + 14, wcx + 26]){ const yy = gy - Math.round((px - wcx) * .18); wp_beam(B, px, yy + 1, px, ay - 14, 2, WR, s + px); }
  // Wasserfall vom Gerinne auf die Schaufeln
  for (let y = gy - 1; y < gy + 8; y++) for (let x = wcx - 6; x < wcx - 2; x++) if (wp_h(x, y, s + 9) > .3) wp_set(B, x, y, wp_c(wp_h(x, y, 2) > .5 ? '#b8c6bc' : '#6f877a'));
  // Gebäude: Bruchstein-Erdgeschoss, Fachwerk-Obergeschoss
  wp_shadowPoly(B, [[xL + 3, ay - 1], [xR + 4, ay - 1], [xR + 4, ay + 2], [xL + 3, ay + 2]]);
  wp_rect(B, xL, yU, xR, ay, wp_rubble({ R: wp_P.grey, s: s + 7, cw: 6, chh: 4, moss: (x, y) => (y - (ay - 8)) / 8 }));
  for (const cx of [xL, xR]) for (let y = yU; y < ay; y += 4){ const w2 = ((y - yU) / 4) & 1 ? 4 : 6, x0 = cx === xL ? xL : xR - w2; wp_rect(B, x0, y, x0 + w2, y + 4, (x, yy) => wp_tone(wp_P.stone, (yy === y ? .8 : .55) - (x - x0) * .04, x, yy)); wp_line(B, x0, y + 3, x0 + w2 - 1, y + 3, wp_P.dark[2]); }
  // Rundbogentor und Fenster unten
  wp_door(B, xL + 30, ay - 21, 11, 21, { R: wp_P.wood, s: s + 8, arch: 'round', frame: wp_P.stone });
  wp_rect(B, xL + 29, ay, xL + 41, ay + 2, (x, y) => wp_tone(wp_P.grey, y === ay ? .8 : .45, x, y));
  for (const wx of [xL + 10, xL + 55]){ wp_window(B, wx, ay - 19, 5, 9, { frame: wp_P.stone, kreuz: false, s: s + wx, dark: true }); for (let i = 0; i < 5; i += 2) for (let j = 1; j < 8; j++) wp_set(B, wx + i, ay - 19 + j, wp_P.iron[2]); }
  wp_fachwerk(B, { x0: xL, x1: xR, yT, yB: yU, R: T, P: wp_P.plaster, s: s + 9, wins: [{ x: xL + 8, w: 6, h: 6, glass: true }, { x: xL + 50, w: 6, h: 6, shut: true, glass: true }], door: { x: xL + 28, w: 9 }, pat: 'mann', flake: .45, gap: 14, par: 3, sill: 3 });
  // Ladeluke oben mit Aufzug
  wp_rect(B, xL + 28, yU - 12, xL + 37, yU - 1, (x, y) => wp_P.dark[y < yU - 10 ? 0 : 1]);
  wp_sack(B, xL + 32, yU - 1, 5, 5, s + 2);
  // Dach (Biberschwanz, bemoost)
  const rf = wp_roofEaves(B, { X0, X1, D, Hw, Hr: 26, ov: 2, ovs: 2, end: 'half', mat: R() < .5 ? 'tile' : 'shingle', s: s + 21, moss: .14 });
  wp_shade(B, xL, rf.yE, xR, rf.yE + 4, .45, 4);
  const ch = wp_chimney(B, xL + 14, Math.round(rf.yR) + 12, 6, 16, s + 3);
  // Aufzugsbalken über der Luke
  const ab = Math.round(rf.yE) - 2;
  wp_rect(B, xL + 31, ab - 1, xL + 35, ab + 1, (x, y) => wp_tone(T, y === ab - 1 ? .7 : .35, x, y));
  wp_line(B, xL + 33, ab + 1, xL + 33, yU - 13, wp_P.straw[2]);
  // Mühlsteine an der Wand, Säcke
  // Ersatz-Läufersteine an die Wand gelehnt: Auge in der Mitte, Schärffurchen
  const ms = (cx, cy, r) => {
    wp_ell(B, cx, cy, r, r, (x, y) => {
      const dx = (x + .5 - cx) / r, dy = (y + .5 - cy) / r, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      if (d < .22) return wp_P.dark[0];
      let t = .58 - dx * .22 - dy * .22 + (wp_h(x, y, s) - .5) * .25;
      if (d > .82) t -= .18;
      if (d > .3 && d < .82 && Math.abs(((a / (Math.PI * 2) * 8 + d * .8) % 1 + 1) % 1 - .5) < .09) t -= .22;
      return wp_tone(wp_P.stone, t, x, y);
    });
  };
  ms(xL + 47, ay - 7, 7); ms(xL + 53, ay - 6, 6);
  wp_sack(B, xL + 22, ay + 1, 7, 8, s + 4); wp_sack(B, xL + 17, ay + 1, 6, 7, s + 5); wp_sack(B, xL + 20, ay - 5, 6, 6, s + 6);
  for (let i = 0; i < 5; i++) wp_grass(B, xL + 2 + R() * 60, ay + 1, 3, s + i, wp_LEAF.busch);
  return wp_res(B, [[-52, -50, 52, 2]], [-56, -118, 62, -6], { smoke: [{ x: Math.round(ch.x - ax), y: Math.round(ch.y - ay) }] });
}


/* ============ Kirche, Kapelle, Kloster (Spätgotik) ============ */

/* Pyramide oder Kegel über n-Eck um (X, Z), Fuß in Höhe Y, Spitze H darüber.
   f(u, v, x, y, e) Deckung; rz Tiefenstauchung; edge Gratlinie */
function wp_pyramid(B, X, Z, Y, r, H, n, f, o){
  o = o || {};
  const rz = o.rz || 1, rot = o.rot === undefined ? Math.PI / n : o.rot, smooth = n > 12;
  const V = []; for (let k = 0; k < n; k++){ const a = rot + k * 2 * Math.PI / n; V.push([X + Math.cos(a) * r, Y, Z + Math.sin(a) * r * rz]); }
  const A = [X, Y + H, Z], faces = [];
  for (let k = 0; k < n; k++){ const p = V[k], q = V[(k + 1) % n]; faces.push({ k, p, q, mz: (p[2] + q[2]) / 2 }); }
  faces.sort((a, b) => b.mz - a.mz);
  const per = Math.hypot(V[1][0] - V[0][0], V[1][2] - V[0][2]);
  for (const F of faces){
    const U = [F.q[0] - F.p[0], 0, F.q[2] - F.p[2]], W = [A[0] - F.p[0], A[1] - F.p[1], A[2] - F.p[2]];
    let nx = U[1] * W[2] - U[2] * W[1], ny = U[2] * W[0] - U[0] * W[2], nz = U[0] * W[1] - U[1] * W[0];
    const cx = (F.p[0] + F.q[0]) / 2 - X, cz = (F.p[2] + F.q[2]) / 2 - Z;
    if (nx * cx + nz * cz < 0){ nx = -nx; ny = -ny; nz = -nz; }
    if (ny - nz <= 0 && !o.all) continue;                 // Blickrichtung der Projektion (0, 1, -1)
    const Lw = Math.hypot(W[0], W[1], W[2]);
    wp_plane(B, F.p, U, W, [[0, 0], [1, 0], [0, 1]], (a, b, x, y) => {
      let lit;
      if (smooth){ const ang = Math.atan2(F.p[2] - Z + a * U[2], F.p[0] - X + a * U[0]); lit = wp_lit(Math.cos(ang), r / H * 1.2, Math.sin(ang)); }
      else lit = wp_lit(nx, ny, nz);
      let e = (lit - .38) * .55;
      if (!smooth && o.edge !== false && (a < .06 || a + b > .94)) e += (a < .06 ? .14 : -.1);
      return f((F.k + a) * per, (1 - b) * Lw, x, y, e, F.k, b);
    });
  }
  return { ax: B.ax + A[0], ay: B.ay - A[2] - A[1] };
}
/* Mauerfläche mit Sockelschmutz und Moos am Fuß */
function wp_wall(B, x0, x1, yT, yB, fn, o){
  o = o || {};
  for (let y = Math.floor(yT); y < yB; y++) for (let x = Math.floor(x0); x < x1; x++){
    if (o.mask && !o.mask(x, y)) continue;
    let c = fn(x, y);
    const d = (y - (yB - (o.grime || 8))) / (o.grime || 8);
    if (d > 0 && dither(x, y) < d * .8) c = wp_mix(c, wp_P.moss[1], .25 + d * .2);
    wp_set(B, x, y, c);
  }
}
/* Gesims: vorspringende Steinleiste mit Licht oben, Schatten darunter */
function wp_cornice(B, x0, x1, y, R, h){
  h = h || 2;
  for (let x = Math.floor(x0); x < x1; x++){
    wp_set(B, x, y, wp_tone(R, .85, x, y));
    for (let k = 1; k < h; k++) wp_set(B, x, y + k, wp_tone(R, .45, x, y + k));
    wp_tint(B, x, y + h, wp_OUT, .35);
  }
}
/* Schallöffnung mit Holzlamellen */
function wp_louvre(B, x, y, w, h, R){
  const g = wp_gwin(B, x, y, w, h, { frame: R, dark: true, lights: 1, sill: true });
  for (let j = Math.ceil(g.yS - y) + 1; j < h - 1; j += 2) for (let i = 1; i < w - 1; i++){ wp_set(B, x + i, y + j, wp_tone(wp_P.gwood, .55, x + i, y + j)); wp_set(B, x + i, y + j + 1, wp_P.dark[1]); }
}
/* Turmuhr: einzeigriges Zifferblatt (blau mit goldenem Ring) */
function wp_clock(B, cx, cy, r, s){
  wp_ell(B, cx, cy, r + 1, r + 1, (x, y) => wp_tone(wp_P.stone, .7 - (x + .5 - cx) / r * .2, x, y));
  wp_ell(B, cx, cy, r, r, (x, y) => {
    const d = Math.hypot(x + .5 - cx, y + .5 - cy);
    if (d > r - 1) return wp_P.gold[d > r - .5 ? 2 : 4];
    const a = Math.atan2(y + .5 - cy, x + .5 - cx);
    if (d > r - 2.2 && Math.abs(((a / (Math.PI * 2) * 12) % 1 + 1) % 1 - .5) > .38) return wp_P.gold[4];
    return wp_tone(wp_P.blue2, .45 - (y + .5 - cy) / r * .2, x, y);
  });
  wp_line(B, cx, cy, cx + r * .55, cy - r * .55, wp_P.gold[5]);        // Stundenzeiger (nur einer, wie um 1520)
  wp_set(B, Math.round(cx), Math.round(cy), wp_P.gold[3]);
}
/* Sonnenuhr auf die Wand gemalt */
function wp_sundial(B, x, y, w, h){
  wp_rect(B, x, y, x + w, y + h, (X, Y) => wp_tone(wp_P.plaster, .75 + (wp_h(X, Y, 3) - .5) * .2, X, Y));
  const cx = x + (w >> 1), cy = y + 1;
  for (let k = -3; k <= 3; k++){ const a = Math.PI / 2 + k * .32; wp_line(B, cx, cy + 1, cx + Math.cos(a) * (h - 2), cy + 1 + Math.sin(a) * (h - 2), wp_P.red2[2]); }
  wp_rect(B, x, y, x + w, y + 1, wp_P.red2[3]); wp_rect(B, x, y + h - 1, x + w, y + h, wp_P.red2[2]);
  wp_line(B, cx, cy, cx + 2, cy + 3, wp_P.iron[1]);
}
/* Epitaph (Grabplatte) in der Wand */
function wp_epitaph(B, x, y, w, h, R, s){
  wp_rect(B, x, y, x + w, y + h, (X, Y) => wp_tone(R, .62 + (wp_h(X, Y, s) - .5) * .25 - (Y - y) * .02, X, Y));
  wp_rect(B, x + 1, y + 2, x + w - 1, y + h - 1, (X, Y) => wp_tone(R, .42 + (wp_h(X, Y, s) - .5) * .2, X, Y));
  const cx = x + (w >> 1);
  wp_line(B, cx, y + 3, cx, y + h - 3, wp_tone(R, .78, 0, 0)); wp_line(B, cx - 1, y + 4, cx + 1, y + 4, wp_tone(R, .78, 0, 0));
  wp_rect(B, x, y + h, x + w, y + h + 1, wp_tone(R, .3, 0, 0));
}
/* kleine Lüftungsgaube im Dach */
function wp_vent(B, cx, y, R){
  for (let j = 0; j < 4; j++) for (let i = -j - 1; i <= j + 1; i++) wp_set(B, cx + i, y + j, wp_tone(R, i < 0 ? .7 : .35, cx + i, y + j));
  wp_set(B, cx, y + 2, wp_P.dark[0]); wp_set(B, cx, y + 3, wp_P.dark[0]); wp_set(B, cx - 1, y + 3, wp_P.dark[1]);
  for (let i = -3; i <= 3; i++) wp_tint(B, cx + i, y + 4, wp_OUT, .35);
}
/* Wetterhahn auf Kugel und Kreuz */
function wp_finial(B, x, y, cock){
  const G = wp_P.gold;
  wp_line(B, x, y, x, y - 9, wp_P.iron[2]);
  wp_set(B, x, y - 3, G[4]); wp_set(B, x + 1, y - 3, G[2]); wp_set(B, x, y - 2, G[2]); wp_set(B, x + 1, y - 2, G[1]);
  if (cock){
    const rows = ['.gg..', 'ggg.g', '.gggg', '..gg.'];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) if (rows[j][i] === 'g') wp_set(B, x - 2 + i, y - 13 + j, G[j < 2 ? 4 : 2]);
  } else { wp_line(B, x - 2, y - 7, x + 2, y - 7, G[3]); wp_set(B, x, y - 10, G[4]); }
}
/* Glasierte Ziegel: Rautenmuster auf großem Dach */
function wp_glazedFn(base, s){
  const GL = [wp_rmp(['#1f2a22', '#2d3c2e', '#3e5040', '#566a54']), wp_rmp(['#4d3a14', '#6e5520', '#90722e', '#ae8e42'])];
  return (u, v, x, y, e) => {
    const cu = Math.floor(u / 4), cv = Math.floor(v / 3), m = ((cu + cv) % 10 + 10) % 10, n = ((cu - cv) % 10 + 10) % 10;
    if (v > 6 && (m === 0 || n === 0)){
      const ly = Math.floor(v) % 3, lx = (Math.floor(u) + (cv & 1) * 2) % 4;
      let t = .5 + e + (wp_h(cu, cv, s) - .5) * .2;
      if (ly === 0) t -= .35; else if (lx === 0) t -= .15; else if (ly === 1 && lx === 1) t += .25;
      return wp_tone(GL[(cu + cv) & 1 ? 1 : 0], t, x, y);
    }
    return base(u, v, x, y, e);
  };
}

/* ---------- Spätgotische Stadtkirche mit Westturm ---------- */
function wp_bKirche(s, v){
  const W = 184, B = wp_img(W, 250, 246), R = rng(s), ax = B.ax, ay = B.ay;
  const RS = wp_P.red, ST = wp_P.stone;
  const mason = (o) => wp_ashlar(Object.assign({ R: RS, s, ch: 4, bmin: 6, bmax: 13, per: 512, stain: .7, mo: wp_rmp(['#2a221e', '#3a302a', '#4c3f37', '#5e5045']) }, o || {}));
  const wallFn = mason({ moss: (x, y) => (y - (ay - 10)) / 12 });
  wp_shadowPoly(B, [[4, ay - 1], [W - 2, ay - 1], [W - 2, ay + 3], [6, ay + 3]]);

  /* ---- Turm ---- */
  const tX0 = -86, tX1 = -46, tZ = 12, Ht = 150, tx0 = ax + tX0, tx1 = ax + tX1, tyB = ay - tZ, tyT = tyB - Ht;
  wp_wall(B, tx0, tx1, tyT, tyB, (x, y) => {
    let c = wallFn(x, y);
    if (x < tx0 + 2) c = wp_mix(c, 0xffe8eef0, .08); else if (x > tx1 - 3) c = wp_mix(c, wp_OUT, .2);
    return c;
  });
  // Eckquader betont, Gesimse, Öffnungen je Geschoss
  for (const yy of [tyB - 40, tyB - 80, tyB - 116]) wp_cornice(B, tx0 - 1, tx1 + 1, yy, RS, 2);
  wp_cornice(B, tx0 - 1, tx1 + 1, tyB - 6, RS, 2);
  const tcx = Math.round((tx0 + tx1) / 2);
  wp_gwin(B, tcx - 2, tyB - 34, 4, 14, { frame: RS, dark: true, lights: 1, s });                 // Schlitz
  wp_door(B, tcx - 5, tyB - 17, 10, 17, { R: wp_P.oak, s: s + 3, arch: 'spitz', frame: RS });   // Turmpforte
  wp_gwin(B, tcx - 3, tyB - 74, 6, 18, { frame: RS, lights: 1, s: s + 1, streak: 8 });
  wp_clock(B, tcx, tyB - 96, 8, s);
  for (const dx of [-9, 3]) wp_louvre(B, tcx + dx, tyB - 146, 6, 24, RS);
  // Wehrplatte: Dachfläche (Steinplatten) hinter der Galerie
  const pZ0 = tZ, pZ1 = tZ + 40, gY = Ht;
  wp_plane(B, [tX0, gY, pZ0], [tX1 - tX0, 0, 0], [0, 0, pZ1 - pZ0], [[0, 0], [1, 0], [1, 1], [0, 1]], (a, b, x, y) => wp_tone(wp_P.grey, .55 + ((x + y) % 5 === 0 ? -.2 : 0) + (wp_h(x, y, s) - .5) * .2, x, y));
  // hintere und seitliche Brüstung
  const parH = 5;
  for (let z = pZ0; z <= pZ1; z++){
    for (const [X, lit] of [[tX0, .7], [tX1 - 2, .3]]) for (let i = 0; i < 2; i++) for (let k = 0; k < parH; k++){ const x = ax + X + i, y = ay - z - gY - k; wp_set(B, x, y, wp_tone(RS, lit + (k === parH - 1 ? .2 : 0) + ((z >> 1) % 3 === 0 && k > 1 && k < parH - 1 ? -.5 : 0), x, y)); }
  }
  for (let x = tx0; x < tx1; x++) for (let k = 0; k < parH; k++){ const y = ay - pZ1 - gY - k; wp_set(B, x, y, wp_tone(RS, .45 + (k === parH - 1 ? .25 : 0), x, y)); }
  // Spitzhelm: achtseitig, Schiefer in Schuppendeckung
  const sp = wp_pyramid(B, (tX0 + tX1) / 2, (pZ0 + pZ1) / 2, gY, 18.5, 70, 8, (u, vv, x, y, e) => wp_slateAt(wp_P.slate, u, vv, x, y, s + 9, e + .05), { rot: Math.PI / 8 });
  // Gauben am Helm
  for (const dx of [-7, 0, 7]){ const gx = Math.round(sp.ax + dx * 1.6), gy = Math.round(sp.ay + 40 + Math.abs(dx) * .3); wp_vent(B, gx, gy, wp_P.slate); }
  wp_finial(B, Math.round(sp.ax), Math.round(sp.ay), true);
  // vordere Maßwerkbrüstung mit Fialen
  const fy = ay - pZ0 - gY;
  for (let x = tx0 - 1; x <= tx1; x++) for (let k = 0; k < parH + 1; k++){
    const y = fy - k, ph = ((x - tx0) % 6 + 6) % 6;
    let t = .55 + (k === parH ? .3 : 0) - (x - tx0) / 40 * .2;
    if (k >= 1 && k <= 3 && (ph === 2 || ph === 3)) { wp_set(B, x, y, wp_P.dark[k === 2 ? 0 : 1]); continue; }   // Vierpass-Durchbruch
    wp_set(B, x, y, wp_tone(RS, t, x, y));
  }
  for (const fx of [tx0 - 1, tx1 - 3]) wp_buttress(B, fx, fy + 2, fy - 6, 4, { R: RS, steps: 0, fiale: 9 });
  for (const fx of [tx0, tx1 - 3]) wp_buttress(B, fx, ay - pZ1 - gY + 1, ay - pZ1 - gY - 5, 3, { R: RS, steps: 0, fiale: 7 });

  /* ---- Chor (rechts, eingezogen, niedriger, Walm über dem Polygon) ---- */
  const cX0 = 50, cX1 = 72, cZ = 8, Hc = 48, cx0 = ax + cX0, cx1 = ax + cX1, cyB = ay - cZ;
  wp_wall(B, cx0, cx1, cyB - Hc, cyB, wallFn);
  // schräge Polygonseite (Südost), im Schatten
  for (let i = 0; i < 10; i++){ const x = cx1 + i, yb = cyB - Math.round(i * .8); for (let y = yb - Hc; y < yb; y++) wp_set(B, x, y, wp_mix(wallFn(x, y), wp_OUT, .34)); }
  wp_cornice(B, cx0, cx1 + 10, cyB - Hc, RS, 2);
  wp_gwin(B, cx0 + 7, cyB - Hc + 8, 9, 32, { frame: RS, lights: 2, s: s + 5, streak: 8 });
  for (let j = 0; j < 28; j++) for (let i = 0; i < 4; i++){ const x = cx1 + 4 + i, y = cyB - Hc + 12 + j - Math.round((4 + i) * .8); wp_set(B, x, y, i === 0 || i === 3 ? wp_tone(RS, .25, x, y) : wp_tone(wp_P.glass, .18 + ((x + y) & 1) * .12, x, y)); }
  const rc = wp_roofEaves(B, { X0: cX0 - 2, X1: cX1 + 10, Z0: cZ, D: 34, Hw: Hc, Hr: 32, ov: 1, ovs: 0, endL: 'gable', endR: 'hip', mat: 'tile', s: s + 31, moss: .08 });
  wp_shade(B, cx0, rc.yE, cx1 + 10, rc.yE + 3, .4, 3);
  wp_buttress(B, cx1 - 1, cyB + 2, cyB - Hc + 8, 5, { fn: wallFn, R: RS, steps: 2, fiale: 8 });
  wp_finial(B, Math.round(ax + rc.Xr - rc.hxR), Math.round(rc.yR) - 1, false);

  /* ---- Langhaus ---- */
  const nX0 = -46, nX1 = 52, Hn = 58, nx0 = ax + nX0, nx1 = ax + nX1, nyT = ay - Hn;
  wp_wall(B, nx0, nx1, nyT, ay, wallFn);
  // Sockel mit Schräge
  for (let x = nx0; x < nx1; x++){ wp_set(B, x, ay - 7, wp_tone(RS, .82, x, 0)); wp_set(B, x, ay - 6, wp_tone(RS, .5, x, 0)); }
  wp_cornice(B, nx0, nx1, nyT, RS, 3);
  // Joche: Strebepfeiler und Maßwerkfenster
  const bays = [[nx0 + 2, nx0 + 32], [nx0 + 36, nx0 + 64], [nx0 + 68, nx1 - 4]];
  bays.forEach(([a, b], i) => {
    const wcx = Math.round((a + b) / 2), ww = 11;
    if (i === 1){
      // Südportal mit gestuftem Gewände, darüber kürzeres Fenster
      const pw = 12, ph = 22, px = wcx - pw / 2, py = ay - 6 - ph;
      for (let k = 3; k >= 1; k--) wp_door(B, px - k, py - k, pw + 2 * k, ph + k, { arch: 'spitz', open: true });
      for (let k = 3; k >= 1; k--){
        for (let j = 0; j < ph + k; j++) for (let ii = 0; ii < 2 * k + pw; ii++){
          const x = px - k + ii, y = py - k + j; if (!wp_op(B, x, y)) continue;
          const c = wp_get(B, x, y); if (c === wp_P.dark[0] || c === wp_P.dark[1]) wp_set(B, x, y, wp_tone(RS, .3 + k * .15 + (ii < k + pw / 2 ? .1 : -.05), x, y));
        }
      }
      wp_door(B, px, py, pw, ph, { R: wp_P.oak, s: s + 7, arch: 'spitz' });
      for (let j = 4; j < ph; j++) wp_set(B, px + (pw >> 1), py + j, wp_P.oak[0]);
      wp_gwin(B, wcx - 5, nyT + 8, 10, 16, { frame: RS, lights: 2, s: s + 11, streak: 5 });
      wp_sundial(B, a + 1, nyT + 12, 7, 7);
    } else {
      wp_gwin(B, wcx - (ww >> 1), nyT + 8, ww, 36, { frame: RS, lights: 2, s: s + 13 + i, streak: 9 });
      wp_epitaph(B, wcx - 3, ay - 18, 6, 9, wp_P.grey, s + i);
    }
  });
  for (const bx of [nx0 + 32, nx0 + 64, nx1 - 4]) wp_buttress(B, bx, ay + 2, nyT + 10, 6, { fn: wallFn, R: RS, steps: 2, fiale: 9 });
  // Rinnspuren, Risse
  for (let i = 0; i < 4; i++) wp_crack(B, nx0 + 8 + R() * 80, nyT + 6 + R() * 20, 8 + R() * 10, s + i);
  // Dach des Langhauses mit glasierten Rauten
  const base = wp_roofFn('tile', s + 41, { moss: .06 });
  const rf = wp_roofEaves(B, { X0: nX0, X1: nX1, D: 50, Hw: Hn, Hr: 50, ov: 2, ovs: 1, endL: 'gable', endR: 'gable', mat: 'tile', fn: wp_glazedFn(base, s), s: s + 41 });
  wp_shade(B, nx0, rf.yE, nx1, rf.yE + 4, .4, 4);
  for (const gx of [nx0 + 20, nx0 + 50, nx0 + 80]) wp_vent(B, gx, Math.round(rf.yE - 30), wp_P.tile);
  for (const gx of [nx0 + 35, nx0 + 65]) wp_vent(B, gx, Math.round(rf.yE - 52), wp_P.tile);
  // Grasbüschel
  for (let i = 0; i < 10; i++) wp_grass(B, 6 + R() * 170, ay + 1, 3, s + i, wp_LEAF.busch);
  return wp_res(B, [[-80, -84, 80, 2]], [-86, -236, 86, -8], { smoke: [] });
}

/* ---------- Friedhofskapelle mit Dachreiter und Beinhaus ---------- */
function wp_bKapelle(s, v){
  const B = wp_img(100, 118, 114), R = rng(s), ax = B.ax, ay = B.ay;
  const PL = wp_P.plaster, Q = v ? wp_P.stone : wp_P.red;
  const X0 = -40, X1 = 26, Hw = 34, x0 = ax + X0, x1 = ax + X1, yT = ay - Hw;
  wp_shadowPoly(B, [[x0 + 3, ay - 1], [x1 + 18, ay - 1], [x1 + 18, ay + 2], [x0 + 3, ay + 2]]);
  const rough = wp_rubble({ R: wp_P.grey, s: s + 2, cw: 5, chh: 3 });
  const wallFn = wp_plaster({ R: PL, s: s + 1, flake: .9, base: ay, under: rough });
  // Chorpolygon rechts (schräge Seite)
  for (let i = 0; i < 12; i++){ const x = x1 + i, yb = ay - Math.round(i * .8); for (let y = yb - Hw + 2; y < yb; y++) wp_set(B, x, y, wp_mix(wallFn(x, y), wp_OUT, .3)); }
  wp_gwin(B, x1 + 4, yT + 10, 4, 14, { frame: Q, lights: 1, s: s + 4 });
  wp_wall(B, x0, x1, yT, ay, wallFn, { grime: 9 });
  // Eckquader
  for (const cx of [x0, x1 - 1]) for (let y = yT; y < ay; y += 4){ const w2 = ((y - yT) / 4) & 1 ? 3 : 5, xa = cx === x0 ? x0 : x1 - w2; wp_rect(B, xa, y, xa + w2, y + 4, (x, yy) => wp_tone(Q, (yy === y ? .82 : .55) - (x - xa) * .05, x, yy)); wp_line(B, xa, y + 3, xa + w2 - 1, y + 3, wp_P.dark[2]); }
  wp_cornice(B, x0, x1 + 12, yT, Q, 2);
  // Fenster, Portal mit Vordach
  wp_gwin(B, x0 + 8, yT + 7, 7, 18, { frame: Q, lights: 2, s: s + 2, streak: 6 });
  wp_gwin(B, x1 - 15, yT + 7, 7, 18, { frame: Q, lights: 2, s: s + 3, streak: 6 });
  const dx = x0 + 26;
  wp_door(B, dx, ay - 17, 10, 17, { R: wp_P.oak, s: s + 5, arch: 'spitz', frame: Q });
  // Vordach auf zwei Pfosten
  for (const px of [dx - 4, dx + 13]) wp_beam(B, px, ay + 1, px, ay - 19, 2, wp_P.gwood, s + px);
  for (let j = 0; j < 5; j++) for (let i = -6 - j; i <= 16 + j; i++){ const x = dx + i, y = ay - 25 + j; wp_set(B, x, y, wp_tileAt(wp_P.tile, i, j * 1.5, x, y, s, .05 - (i > 5 ? .08 : 0))); }
  for (let i = -11; i <= 21; i++) wp_tint(B, dx + i, ay - 20, wp_OUT, .4);
  // Beinhaus-Öffnung mit Gitter und Schädeln
  const bx = x0 + 5, by = ay - 11;
  wp_rect(B, bx, by, bx + 14, by + 7, (x, y) => wp_P.dark[y < by + 2 ? 0 : 1]);
  for (let i = 0; i < 6; i++){ const kx = bx + 1 + i * 2 + (i & 1), ky = by + 3 + (i % 3 === 0 ? 1 : 0); wp_set(B, kx, ky, wp_c('#b9ae92')); wp_set(B, kx + 1, ky, wp_c('#9a8f74')); wp_set(B, kx, ky + 1, wp_c('#6d6450')); }
  for (let i = 0; i <= 14; i += 3) for (let j = 0; j < 7; j++) wp_set(B, bx + i, by + j, wp_P.iron[2]);
  wp_rect(B, bx - 1, by - 1, bx + 15, by, wp_tone(Q, .75, 0, 0)); wp_rect(B, bx - 1, by + 7, bx + 15, by + 8, wp_tone(Q, .4, 0, 0));
  // Dach mit Walm über dem Chor
  const rf = wp_roofEaves(B, { X0, X1: X1 + 8, D: 36, Hw, Hr: 32, ov: 1, ovs: 2, endL: 'gable', endR: 'hip', mat: 'tile', s: s + 21, moss: .14 });
  wp_shade(B, x0, rf.yE, x1 + 8, rf.yE + 4, .4, 4);
  // Dachreiter: sechseckig mit Glockenstube und Spitzhelm
  const dX = -12, dZ = 18, dY = Hw + 32 - 6, dcx = ax + dX;
  const yb = ay - dZ - dY;
  for (let y = yb - 12; y < yb + 4; y++) for (let i = -4; i <= 4; i++){
    const x = dcx + i, t = .55 - i * .07;
    wp_set(B, x, y, wp_tone(wp_P.gwood, t + (y < yb - 9 ? .1 : 0), x, y));
  }
  wp_rect(B, dcx - 2, yb - 9, dcx + 3, yb - 2, wp_P.dark[0]);
  wp_ell(B, dcx + .5, yb - 4, 1.6, 1.6, () => wp_P.gold[2]); wp_set(B, dcx, yb - 5, wp_P.gold[4]);
  const sp = wp_pyramid(B, dX + .5, dZ, dY + 12, 5.5, 18, 6, (u, vv, x, y, e) => wp_slateAt(wp_P.slate, u, vv, x, y, s + 7, e));
  wp_finial(B, Math.round(sp.ax), Math.round(sp.ay), false);
  // Kreuz auf dem Chorfirst
  for (let i = 0; i < 6; i++) wp_set(B, ax + X1 + 2, Math.round(rf.yR) - 1 - i, wp_P.iron[2]); wp_line(B, ax + X1, Math.round(rf.yR) - 5, ax + X1 + 4, Math.round(rf.yR) - 5, wp_P.iron[2]);
  for (let i = 0; i < 4; i++) wp_crack(B, x0 + 4 + R() * 56, yT + 4 + R() * 18, 6 + R() * 8, s + i);
  wp_ivy(B, x0 + 2, ay - 1, 60, s + 9);
  for (let i = 0; i < 6; i++) wp_grass(B, x0 + R() * 76, ay + 1, 3, s + i, wp_LEAF.busch);
  return wp_res(B, [[-42, -48, 42, 2]], [-46, -110, 48, -6], {});
}

/* Kreuzgangarkade: dunkler Gang, Maßwerk mit Mittelpfosten, zwei Spitzbögen und Okulus, Brüstung */
function wp_arcade(B, ox, oy, ow, oh, ST, s, ay){
  const r = ow * .8, ah = Math.sqrt(r * r - (r - ow / 2) ** 2), yS = oy + Math.ceil(ah);
  const inA = (px, py) => py <= 0 ? px >= 0 && px <= ow : Math.hypot(px - r, py) <= r && Math.hypot(px - (ow - r), py) <= r;
  for (let j = 0; j < oh; j++) for (let i = 0; i < ow; i++){
    const X = ox + i, Y = oy + j, px = i + .5, py = yS - Y - .5;
    if (!inA(px, py)) continue;
    const edge = !inA(px - 1, py) || !inA(px + 1, py) || !inA(px, py + 1);
    if (edge){ wp_set(B, X, Y, wp_tone(ST, i < ow / 2 ? .78 : .32, X, Y)); continue; }
    // Gang im Schatten: oben Gewölbe dunkel, unten Rückwand mit Licht
    let t = .04 + clamp((Y - yS) / (oh - ah), 0, 1) * .3 - i / ow * .06;
    if (Y > oy + oh - 4) t += .12;
    wp_set(B, X, Y, wp_tone(wp_P.grey, t, X, Y));
  }
  // Maßwerk: Mittelpfosten, zwei Unterbögen, Okulus
  const mx = ox + (ow >> 1), sub = (ow >> 1) - 1, sr = sub * .8, sh = Math.sqrt(sr * sr - (sr - sub / 2) ** 2);
  for (let j = Math.round(yS - 1); j < oy + oh; j++){ wp_set(B, mx, j, wp_tone(ST, .62, mx, j)); }
  for (const sx of [ox + 1, mx + 1]){
    const sy = yS + 2;
    for (let i = 0; i < sub; i++) for (let j = -Math.ceil(sh); j <= 0; j++){
      const px = i + .5, py = -j - .5 + .5;
      const inS = Math.hypot(px - sr, py) <= sr && Math.hypot(px - (sub - sr), py) <= sr;
      const inS2 = Math.hypot(px - sr, py) <= sr - 1 && Math.hypot(px - (sub - sr), py) <= sr - 1;
      if (inS && !inS2) wp_set(B, sx + i, sy + j, wp_tone(ST, i < sub / 2 ? .75 : .5, sx + i, sy + j));
    }
  }
  const ocy = oy + Math.max(3, Math.round(ah * .45)), orr = Math.min(2.6, ow * .16);
  for (let a = 0; a < 24; a++){ const px = mx + .5 + Math.cos(a / 24 * Math.PI * 2) * orr, py = ocy + Math.sin(a / 24 * Math.PI * 2) * orr; wp_set(B, px, py, wp_tone(ST, a < 12 ? .55 : .78, 0, 0)); }
  // Brüstung
  for (let x = ox; x < ox + ow; x++){ wp_set(B, x, ay - 8, wp_tone(ST, .85, x, 0)); for (let y = ay - 7; y < ay - 4; y++) wp_set(B, x, y, wp_tone(ST, .45 + (wp_h(x, y, s) - .5) * .2, x, y)); }
}

/* ---------- Klosterflügel mit Kreuzgang, Dormitorium, Treppenturm ---------- */
function wp_bKloster(s, v){
  const W = 212, B = wp_img(W, 144, 140), R = rng(s), ax = B.ax, ay = B.ay;
  const X0 = -98, X1 = 92, Hg = 32, Hw = 56, x0 = ax + X0, x1 = ax + X1;
  const ST = wp_P.stone, PL = wp_P.plaster;
  wp_shadowPoly(B, [[x0 + 3, ay - 1], [x1 + 6, ay - 1], [x1 + 6, ay + 2], [x0 + 3, ay + 2]]);
  const stoneFn = wp_ashlar({ R: ST, s, ch: 4, bmin: 6, bmax: 12, per: 512, stain: .5, moss: (x, y) => (y - (ay - 8)) / 10 });
  const upFn = wp_plaster({ R: PL, s: s + 1, flake: .5, under: wp_rubble({ R: wp_P.grey, s: s + 2, cw: 5, chh: 3 }) });
  // Obergeschoss (Dormitorium): verputzt, Fensterpaare
  wp_wall(B, x0, x1, ay - Hw, ay - Hg, upFn, { grime: 1 });
  wp_cornice(B, x0, x1, ay - Hg - 1, ST, 2);
  for (let x = x0 + 10; x < x1 - 8; x += 18){
    for (const dx of [0, 6]) wp_window(B, x + dx, ay - Hw + 9, 4, 9, { frame: ST, s: s + x, kreuz: false });
    wp_rect(B, x - 1, ay - Hw + 18, x + 11, ay - Hw + 19, wp_tone(ST, .78, 0, 0));
  }
  // Kreuzgang: Maßwerkarkaden auf Brüstung, dahinter dunkler Gang mit Gewölberippen
  const aw = 23;
  wp_wall(B, x0, x1, ay - Hg, ay, stoneFn);
  for (let x = x0 + 4; x + aw - 4 <= x1 - 2; x += aw){
    const ox = x + 2, ow = aw - 4, oy = ay - Hg + 4, oh = Hg - 10;
    wp_arcade(B, ox, oy, ow, oh, ST, s + x, ay);
  }
  // Pfeiler zwischen den Arkaden als Strebepfeiler
  for (let x = x0 + 4; x <= x1 - 2; x += aw) wp_buttress(B, x - 2, ay + 1, ay - Hg + 3, 4, { fn: stoneFn, R: ST, steps: 1 });
  // Dach mit Gauben und Dachreiter
  const rf = wp_roofEaves(B, { X0, X1, D: 40, Hw, Hr: 30, ov: 2, ovs: 2, endL: 'gable', endR: 'half', mat: 'tile', s: s + 21, moss: .16 });
  wp_shade(B, x0, rf.yE, x1, rf.yE + 4, .4, 4);
  for (let gx = x0 + 24; gx < x1 - 20; gx += 34) wp_vent(B, gx, Math.round(rf.yE - 22), wp_P.tile);
  const dX = 10, dZ = 20, dY = Hw + 30 - 6, dcx = ax + dX, yb = ay - dZ - dY;
  for (let y = yb - 10; y < yb + 4; y++) for (let i = -3; i <= 3; i++) wp_set(B, dcx + i, y, wp_tone(wp_P.gwood, .55 - i * .08, dcx + i, y));
  wp_rect(B, dcx - 1, yb - 8, dcx + 2, yb - 2, wp_P.dark[0]); wp_set(B, dcx, yb - 4, wp_P.gold[3]);
  const sp = wp_pyramid(B, dX + .5, dZ, dY + 10, 4.5, 14, 6, (u, vv, x, y, e) => wp_slateAt(wp_P.slate, u, vv, x, y, s + 7, e));
  wp_finial(B, Math.round(sp.ax), Math.round(sp.ay), false);
  // Treppenturm links (achteckig, mit Fensterschlitzen und Kegelhelm)
  const tX = X0 + 2, tR = 9, tcx = ax + tX, tH = 78;
  const tFn = wp_ashlar({ R: ST, s: s + 4, ch: 4, bmin: 4, bmax: 7, per: 64, ux: (x) => Math.asin(clamp((x + .5 - tcx) / tR, -1, 1)) * tR * 1.3, curve: (x) => Math.sqrt(Math.max(0, 1 - ((x + .5 - tcx) / tR) ** 2)) * 2.5 });
  for (let y = ay - tH; y < ay; y++) for (let i = -tR; i < tR; i++){
    const x = tcx + i, n = (i + .5) / tR;
    let c = tFn(x, y);
    c = n < -.2 ? wp_mix(c, 0xffe8eef0, (-.2 - n) * .2) : wp_mix(c, wp_OUT, (n + .2) * .35);
    wp_set(B, x, y, c);
  }
  for (let k = 0; k < 4; k++){ const wy = ay - 18 - k * 15, wx = tcx - 3 + k * 2; wp_rect(B, wx, wy, wx + 2, wy + 5, wp_P.dark[0]); wp_set(B, wx - 1, wy - 1, wp_tone(ST, .8, 0, 0)); wp_set(B, wx + 2, wy - 1, wp_tone(ST, .8, 0, 0)); }
  wp_door(B, tcx - 3, ay - 11, 6, 11, { R: wp_P.oak, s: s + 9, arch: 'korb', frame: ST });
  wp_cornice(B, tcx - tR, tcx + tR, ay - tH, ST, 2);
  const tp = wp_pyramid(B, tX, 0, tH + 1, tR + 1, 22, 16, (u, vv, x, y, e) => wp_slateAt(wp_P.slate, u, vv, x, y, s + 3, e), { rz: .45 });
  wp_finial(B, Math.round(tp.ax), Math.round(tp.ay), false);
  for (let i = 0; i < 5; i++) wp_crack(B, x0 + 20 + R() * 160, ay - Hw + 4 + R() * 16, 6 + R() * 8, s + i);
  wp_ivy(B, x1 - 20, ay - 1, 70, s + 3);
  for (let i = 0; i < 12; i++) wp_grass(B, x0 + R() * 190, ay + 1, 3, s + i, wp_LEAF.busch);
  return wp_res(B, [[-100, -60, 100, 2]], [-104, -134, 104, -8], {});
}


/* Turnierschranke: Pfosten und bemalte Planken (rot und weiß), lang und niedrig */
function wp_kSchranke(s){
  const L = 216, B = wp_img(L + 10, 22, 19), ax = B.ax, ay = B.ay, x0 = ax - L / 2, x1 = ax + L / 2;
  wp_shadowPoly(B, [[x0, ay - 1], [x1 + 5, ay - 1], [x1 + 5, ay + 2], [x0, ay + 2]]);
  wp_rect(B, x0, ay - 5, x1, ay - 3, (x, y) => wp_tone(wp_P.wood, y === ay - 5 ? .7 : .4, x, y));
  for (let x = x0; x <= x1 + .5; x += 24) wp_beam(B, x, ay + 1, x, ay - 15, 2.6, wp_P.wood, s + x);
  wp_rect(B, x0 - 1, ay - 15, x1 + 2, ay - 8, (x, y) => { const k = Math.floor((x - x0 + (ay - y) * .7) / 7) & 1; return wp_tone(k ? wp_P.red2 : wp_P.cloth, .78 - (y - ay + 15) * .07 + (wp_h(x, y, s) - .5) * .08, x, y); });
  wp_line(B, x0 - 1, ay - 15, x1 + 1, ay - 15, wp_P.wood[4]); wp_line(B, x0 - 1, ay - 8, x1 + 1, ay - 8, wp_P.wood[1]);
  for (let x = x0; x <= x1 + .5; x += 24){ wp_set(B, x, ay - 16, wp_P.wood[5]); wp_set(B, x, ay - 12, wp_P.iron[2]); }
  return wp_xRes(B, [[-L / 2 - 2, -3, L / 2 + 2, 1]], null);
}
/* Tribüne: drei Sitzstufen, Rückwand, gestreiftes Zeltdach mit Wimpeln, Wappen an der Brüstung */
const TRIB = { w: 150, step: 12 };
function wp_kTribuene(s){
  const Wd = TRIB.w, st = TRIB.step, B = wp_img(Wd + 12, 104, 100), ax = B.ax, ay = B.ay, x0 = ax - Wd / 2, x1 = ax + Wd / 2, R = rng(s);
  wp_shadowPoly(B, [[x0 + 2, ay - 1], [x1 + 6, ay - 1], [x1 + 6, ay + 3], [x0 + 2, ay + 3]]);
  // Rückwand und Gerüst
  wp_rect(B, x0, ay - 70, x1, ay - 3 * st, wp_planks(wp_P.wood, s + 1, 5, { ox: x0, lit: (x, y) => -.12 }));
  for (const x of [x0 + 1, ax, x1 - 1]) wp_beam(B, x, ay, x, ay - 76, 2.6, wp_P.oak, s + x);
  // Stufen: Setzstufe (Front) und Sitzfläche, von unten nach oben
  for (let i = 2; i >= 0; i--){
    const yF = ay - st * i, yT = yF - st;
    wp_rect(B, x0, yT, x1, yF, wp_planks(wp_P.wood, s + 3 + i, 6, { ox: x0 + i * 3, lit: (x, y) => (y - yT < 2 ? .18 : 0) - i * .05 }));
    wp_rect(B, x0, yT, x1, yT + 1, (x, y) => wp_tone(wp_P.wood, .85, x, y));
  }
  // Brüstung mit Tüchern und Wappenschilden
  const CL = [wp_P.red2, wp_P.blue2, wp_P.yel2, wp_P.cloth];
  for (let k = 0; k < 6; k++){
    const cx = x0 + 12 + k * (Wd - 24) / 5, C = CL[k % 4];
    wp_poly(B, [[cx - 9, ay - st + 1], [cx + 9, ay - st + 1], [cx + 7, ay - 2], [cx, ay + 1], [cx - 7, ay - 2]], (x, y) => wp_tone(C, .62 - (y - ay + st) * .02 + (((x - cx + 20) | 0) % 4 === 0 ? -.1 : 0), x, y));
    wp_poly(B, [[cx - 3, ay - st + 3], [cx + 3, ay - st + 3], [cx + 3, ay - st + 7], [cx, ay - st + 9], [cx - 3, ay - st + 7]], (x, y) => wp_tone(CL[(k + 2) % 4], .8, x, y));
  }
  // Zeltdach: schräge Bahn mit Streifen, Bogenkante, Wimpel
  const top = ay - 92, eave = ay - 76, stripe = x => Math.floor((x - x0 + 60) / 6) & 1;
  wp_poly(B, [[x0 - 5, eave], [x1 + 5, eave], [x1 + 2, top], [x0 - 2, top]], (x, y) => wp_tone(stripe(x) ? wp_P.red2 : wp_P.yel2, .48 + (y - top) * .02 + (wp_h(x, y, s) - .5) * .08, x, y));
  for (let x = x0 - 5; x <= x1 + 5; x++){ const lx = (x - x0 + 60) % 6, h = lx === 0 || lx === 5 ? 1 : 3; for (let j = 0; j <= h; j++) wp_set(B, x, eave + j, wp_tone(stripe(x) ? wp_P.red2 : wp_P.yel2, .36 - j * .07, x, eave + j)); }
  for (const x of [x0, ax, x1]){
    wp_seg(B, x, top, x, top - 8, 1.2, wp_P.oak[3]);
    wp_poly(B, [[x + 1, top - 8], [x + 9, top - 6], [x + 1, top - 4]], (X, Y) => wp_tone(CL[(x | 0) % 3], .7, X, Y));
  }
  return wp_xRes(B, [[-Wd / 2, -3 * st - 4, Wd / 2, 2]], [-Wd / 2 - 4, -100, Wd / 2 + 4, -8], {});
}


/* ---------- Gewölbe: Eingang, Säule, Sarkophag, Truhe, Kohlebecken, Weinfass ---------- */
/* Abgang in den Keller (v 0, Bruchstein, Holztür daneben) oder in die Gruft (v 1, Quader, Spitzbogen mit Kreuz) */
function wp_kAbgang(s, v){
  const B = wp_img(52, 50, 46), ax = B.ax, ay = B.ay, R = v ? wp_P.stone : wp_P.grey;
  wp_groundShadow(B, ax + 3, ay + 1, 24, 3);
  // Rückwand mit Bogen
  const mason = (v ? wp_ashlar : wp_rubble)({ R, s, per: 0, lit: (x, y) => -(x - ax) / 60, moss: (x, y) => v ? -1 : (y - (ay - 26)) / 10 * .8 });
  wp_rect(B, ax - 23, ay - 42, ax + 23, ay - 22, mason);
  wp_rect(B, ax - 23, ay - 43, ax + 23, ay - 42, (x, y) => wp_tone(R, .78, x, y));
  const archTop = ay - 38, inArch = (x, y) => { const dx = Math.abs(x + .5 - ax); return v ? (y + .5 > archTop + dx * 1.15 && dx < 8) : ((dx / 8) ** 2 + ((y + .5 - (ay - 30)) / 9) ** 2 < 1 || (dx < 8 && y + .5 > ay - 30)); };
  wp_rect(B, ax - 9, archTop - 1, ax + 9, ay - 22, (x, y) => inArch(x, y) ? wp_tone(wp_P.dark, .08 + (y - archTop) * .01, x, y) : 0);
  // Treppenschacht: Stufen hinab, je tiefer desto dunkler
  wp_rect(B, ax - 15, ay - 22, ax + 15, ay - 4, (x, y) => wp_tone(wp_P.dark, .05, x, y));
  for (let i = 0; i < 4; i++){
    const y0 = ay - 8 - i * 4, lv = .62 - i * .14;
    wp_rect(B, ax - 13, y0, ax + 13, y0 + 3, (x, y) => wp_tone(R, (y === y0 ? lv + .14 : lv) + (wp_h(x, y, s + i) - .5) * .08, x, y));
  }
  // Einfassung links und rechts
  for (const sx of [-1, 1]) wp_rect(B, sx < 0 ? ax - 19 : ax + 15, ay - 22, sx < 0 ? ax - 15 : ax + 19, ay - 3, (x, y) => wp_tone(R, .55 + (sx < 0 ? .1 : -.08) + (wp_h(x >> 1, y >> 1, s) - .5) * .2, x, y));
  if (v){
    // Kreuz über dem Bogen, kleine Säulchen
    wp_rect(B, ax - 1, ay - 50, ax + 1, ay - 43, (x, y) => wp_tone(wp_P.stone, .8, x, y)); wp_rect(B, ax - 3, ay - 48, ax + 3, ay - 46, (x, y) => wp_tone(wp_P.stone, .8, x, y));
    for (const sx of [-1, 1]) wp_rect(B, ax + sx * 11 - 1, ay - 38, ax + sx * 11 + 1, ay - 22, (x, y) => wp_tone(wp_P.stone, .7 - (x - ax - sx * 11) * .1, x, y));
  } else {
    // alte Bohlentür lehnt rechts an der Wand
    wp_poly(B, [[ax + 17, ay - 2], [ax + 25, ay - 2], [ax + 24, ay - 24], [ax + 18, ay - 22]], wp_planks(wp_P.oak, s + 3, 3, { ox: ax + 17 }));
    wp_line(B, ax + 18, ay - 8, ax + 24, ay - 9, wp_P.iron[2]); wp_line(B, ax + 18, ay - 18, ax + 24, ay - 19, wp_P.iron[2]);
  }
  return wp_xRes(B, [[-20, -22, 20, -5]], null, {});
}
/* Säule: v 0 grober Pfeiler (Keller), v 1 runde Säule mit Kapitell (Krypta) */
function wp_kSaeule(s, v){
  const B = wp_img(22, 56, 52), ax = B.ax, ay = B.ay, R = v ? wp_P.stone : wp_P.grey;
  wp_groundShadow(B, ax + 3, ay + 1, 9, 2.5);
  wp_rect(B, ax - 8, ay - 5, ax + 8, ay, (x, y) => wp_tone(R, .5 - (x - ax) * .03 + (y === ay - 5 ? .2 : 0), x, y));
  if (v){
    wp_rect(B, ax - 5, ay - 44, ax + 5, ay - 5, (x, y) => { const t = (x + .5 - ax) / 5; return wp_tone(R, .62 - t * .3 - t * t * .15 + (wp_h(x, y >> 2, s) - .5) * .05, x, y); });
    wp_rect(B, ax - 8, ay - 50, ax + 8, ay - 44, (x, y) => wp_tone(R, .7 - (x - ax) * .03 - (y - ay + 50) * .04, x, y));
  } else {
    wp_rect(B, ax - 7, ay - 48, ax + 7, ay - 5, wp_rubble({ R, s, per: 0, lit: (x, y) => -(x - ax) / 14, moss: (x, y) => (y - (ay - 16)) / 12 }));
    wp_rect(B, ax - 7, ay - 50, ax + 7, ay - 48, (x, y) => wp_tone(R, .74, x, y));
  }
  return wp_xRes(B, [[-7, -6, 7, 1]], null, {});
}
/* Sarkophag (zwei Felder breit): v 0 mit liegender Gestalt, v 1 mit Kreuz */
function wp_kSarg(s, v){
  const B = wp_img(36, 28, 24), ax = B.ax, ay = B.ay, R = wp_P.stone;
  wp_groundShadow(B, ax + 3, ay + 1, 17, 2.5);
  wp_rect(B, ax - 16, ay - 10, ax + 16, ay, wp_ashlar({ R, s, per: 0, lit: (x, y) => -.12, moss: () => -1 }));
  wp_rect(B, ax - 17, ay - 22, ax + 17, ay - 10, (x, y) => wp_tone(R, .7 - (y - ay + 22) * .015 + (wp_h(x >> 1, y >> 1, s) - .5) * .06, x, y));
  wp_rect(B, ax - 17, ay - 11, ax + 17, ay - 10, (x, y) => wp_tone(R, .45, x, y));
  if (v){ wp_rect(B, ax - 1, ay - 20, ax + 1, ay - 12, (x, y) => wp_tone(R, .45, x, y)); wp_rect(B, ax - 5, ay - 18, ax + 5, ay - 16, (x, y) => wp_tone(R, .45, x, y)); }
  else {
    wp_ell(B, ax - 11, ay - 16, 3, 3, (x, y) => wp_tone(R, .86 - (x - ax + 11) * .05, x, y));
    wp_rect(B, ax - 8, ay - 18, ax + 13, ay - 13, (x, y) => wp_tone(R, .8 - (y - ay + 18) * .06, x, y));
    wp_rect(B, ax - 6, ay - 17, ax - 4, ay - 14, (x, y) => wp_tone(R, .6, x, y));
  }
  return wp_xRes(B, [[-16, -10, 16, 1]], null, {});
}
/* Truhe mit Eisenbändern: v 0 zu, v 1 offen */
function wp_kTruhe(s, v){
  const B = wp_img(24, 26, 22), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 2, ay + 1, 11, 2);
  wp_rect(B, ax - 10, ay - 10, ax + 10, ay, wp_hplanks(wp_P.oakred, s, 3, { oy: ay - 10 }));
  if (v){
    wp_rect(B, ax - 9, ay - 13, ax + 9, ay - 10, (x, y) => wp_tone(wp_P.dark, .1, x, y));
    for (let i = 0; i < 6; i++) wp_set(B, ax - 7 + i * 3, ay - 12 + (i & 1), wp_P.gold[i % 2 ? 3 : 5]);
    wp_rect(B, ax - 10, ay - 24, ax + 10, ay - 13, wp_hplanks(wp_P.oakred, s + 1, 3, { oy: ay - 24 }));
    for (const xx of [ax - 8, ax + 6]) wp_rect(B, xx, ay - 24, xx + 2, ay - 13, wp_P.iron[3]);
  } else {
    wp_rect(B, ax - 10, ay - 16, ax + 10, ay - 10, (x, y) => wp_tone(wp_P.oakred, .65 - (y - ay + 16) * .06, x, y));
    wp_rect(B, ax - 10, ay - 16, ax + 10, ay - 15, wp_P.oakred[5]);
    wp_rect(B, ax - 2, ay - 12, ax + 2, ay - 8, wp_P.gold[3]); wp_set(B, ax, ay - 10, wp_P.dark[0]);
  }
  for (const xx of [ax - 8, ax + 6]) wp_rect(B, xx, ay - (v ? 10 : 16), xx + 2, ay, wp_P.iron[3]);
  return wp_xRes(B, [[-9, -7, 9, 1]], null, {});
}
/* Kohlebecken auf drei Beinen (Flamme wird im Spiel gezeichnet) */
function wp_kBecken(s){
  const B = wp_img(20, 30, 27), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 2, ay + 1, 8, 2);
  for (const sg of [-1, 0, 1]) wp_seg(B, cx + sg * 2, ay - 16, cx + sg * 7, ay, 1.4, wp_P.iron[2]);
  wp_ell(B, cx, ay - 18, 8, 4, (x, y) => wp_tone(wp_P.iron, .5 - (x - cx) * .04 + (y > ay - 18 ? -.2 : .1), x, y));
  wp_rect(B, cx - 6, ay - 21, cx + 6, ay - 19, (x, y) => wp_tone(wp_P.char, .3 + wp_h(x, y, s) * .6, x, y));
  for (let i = 0; i < 5; i++) wp_set(B, cx - 5 + i * 2.5, ay - 20, wp_c(i % 2 ? '#c8401c' : '#f0902a'));
  return wp_xRes(B, [[-6, -5, 6, 1]], null, {});
}
/* Weinfass auf dem Lager, liegend, zwei Felder breit */
function wp_kWeinfass(s, v){
  const B = wp_img(34, 28, 25), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 2, ay + 1, 15, 2.5);
  for (const sx of [-1, 1]) wp_rect(B, ax + sx * 10 - 2, ay - 6, ax + sx * 10 + 2, ay, (x, y) => wp_tone(wp_P.oak, .4, x, y));
  wp_rect(B, ax - 14, ay - 21, ax + 12, ay - 4, (x, y) => { const t = (y + .5 - (ay - 12.5)) / 8.5; return wp_tone(wp_P.wood, .6 - t * .3 - t * t * .2 + (((x - ax + 30) | 0) % 5 === 0 ? -.12 : 0), x, y); });
  for (const xx of [ax - 9, ax + 6]) wp_rect(B, xx, ay - 21, xx + 2, ay - 4, (x, y) => wp_tone(wp_P.iron, .5 - (y - ay + 13) * .03, x, y));
  wp_ell(B, ax + 13, ay - 12.5, 3.5, 8.5, (x, y) => { const d = Math.hypot((x + .5 - ax - 13) / 3.5, (y + .5 - ay + 12.5) / 8.5); return d > .8 ? wp_tone(wp_P.iron, .45, x, y) : wp_tone(wp_P.wood, .48 - d * .2, x, y); });
  wp_set(B, ax + 13, ay - 9, wp_P.oak[1]); wp_set(B, ax + 13, ay - 8, wp_P.oak[2]);
  return wp_xRes(B, [[-15, -8, 15, 1]], null, {});
}

/* ---------- Bergwerk: Stolleneingang, Hebel, Fallgitter, Lore, Erzhaufen ---------- */
/* Stolleneingang im Fels: Zimmerung aus Eichenbalken, Gleise führen heraus */
function wp_kStollen(s){
  const B = wp_img(72, 62, 57), ax = B.ax, ay = B.ay, R = wp_P.grey;
  wp_groundShadow(B, ax + 3, ay + 1, 33, 4);
  const inRock = (x, y) => { const dx = (x + .5 - ax) / 33, dy = (y + .5 - (ay - 20)) / 34; return dx * dx + (dy < 0 ? dy * dy * 1.1 : dy * dy * .25) + (wp_vn(x * .22, y * .22, s) - .5) * .42 < 1 && y < ay - 1; };
  wp_rect(B, ax - 35, ay - 56, ax + 35, ay - 1, (x, y) => {
    if (!inRock(x, y)) return 0;
    const n = wp_vn(x * .35, y * .35, s + 1), crack = wp_vn(x * .9, y * .25, s + 2) < .1;
    return wp_tone(R, .5 - (x - ax) * .007 - (y - ay + 50) * .002 + (n - .5) * .4 + (crack ? -.3 : 0), x, y);
  });
  for (let k = 0; k < 18; k++){   // Flechten und Moos auf dem Fels
    const x = ax - 26 + wp_h(k, 1, s) * 52, y = ay - 48 + wp_h(k, 2, s) * 30;
    if (inRock(x, y)) wp_ell(B, x, y, 2 + wp_h(k, 3, s) * 2, 1.2, (xx, yy) => inRock(xx, yy) ? wp_tone(k & 1 ? wp_P.moss : wp_P.lichen, .45, xx, yy) : 0);
  }
  // Schacht: dunkel, nach hinten schwärzer
  wp_rect(B, ax - 11, ay - 34, ax + 11, ay - 2, (x, y) => wp_tone(wp_P.dark, Math.max(0, .34 - (ay - 2 - y) * .012) + (Math.abs(x - ax) > 8 ? .08 : 0), x, y));
  // Zimmerung: zwei Stempel und eine Kappe
  for (const sx of [-1, 1]) wp_rect(B, ax + sx * 12 - 2, ay - 36, ax + sx * 12 + 2, ay - 1, (x, y) => wp_tone(wp_P.oak, .62 - (x - (ax + sx * 12 - 2)) * .1 + (wp_h(x, y >> 2, s + 4) - .5) * .12, x, y));
  wp_rect(B, ax - 17, ay - 40, ax + 17, ay - 35, (x, y) => wp_tone(wp_P.oak, (y === ay - 40 ? .78 : .55) - (y - ay + 40) * .05 + (wp_h(x >> 2, y, s + 5) - .5) * .1, x, y));
  for (const sx of [-1, 1]) wp_rect(B, ax + sx * 15 - 1, ay - 39, ax + sx * 15 + 1, ay - 37, wp_P.iron[2]);
  // Gleise mit Schwellen
  for (let i = 0; i < 4; i++){ const y = ay - 26 + i * 8; wp_rect(B, ax - 8 - i * .6, y, ax + 8 + i * .6, y + 2, (x, yy) => wp_tone(wp_P.wood, .3 + i * .1, x, yy)); }
  for (const sx of [-1, 1]) wp_line(B, ax + sx * 5, ay - 30, ax + sx * 7, ay + 3, (x, y, t) => wp_P.iron[2 + (t > .5 ? 1 : 0)]);
  // Laterne am Stempel
  wp_rect(B, ax + 15, ay - 30, ax + 19, ay - 25, wp_P.iron[1]); wp_rect(B, ax + 16, ay - 29, ax + 18, ay - 26, wp_c('#e8a040'));
  return wp_xRes(B, [[-31, -30, -13, -4], [13, -30, 31, -4], [-31, -48, 31, -30]], null, { lamp: [ax + 17, ay - 27] });
}
/* Hebel an der Wand: v 0 oben (los), v 1 unten (gezogen) */
function wp_kHebel(s, v){
  const B = wp_img(24, 40, 36), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 2, ay + 1, 9, 2);
  // Kette hinauf in die Decke
  for (let y = ay - 36; y < ay - 16; y += 3) wp_rect(B, ax - 1, y, ax + 1, y + 2, (x, yy) => wp_P.iron[(y >> 1) & 1 ? 3 : 2]);
  // Sockel aus Holz mit Eisenband
  wp_rect(B, ax - 7, ay - 16, ax + 7, ay, wp_hplanks(wp_P.oak, s, 4, { oy: ay - 16 }));
  wp_rect(B, ax - 7, ay - 16, ax + 7, ay - 15, wp_P.oak[5]);
  for (const yy of [ay - 12, ay - 4]) wp_rect(B, ax - 7, yy, ax + 7, yy + 1, wp_P.iron[2]);
  wp_rect(B, ax - 2, ay - 15, ax + 2, ay - 13, wp_P.dark[0]);
  // Hebelarm mit Griff
  const tx = v ? ax + 9 : ax - 6, ty = v ? ay - 9 : ay - 30;
  wp_seg(B, ax, ay - 14, tx, ty, 1.6, (x, y, t) => wp_P.iron[t > .5 ? 4 : 3]);
  wp_ell(B, tx, ty, 2.2, 2.2, (x, y) => wp_tone(wp_P.oakred, .7 - (x - tx) * .1, x, y));
  return wp_xRes(B, [[-7, -6, 7, 1]], null, {});
}
/* Fallgitter über einem Gang von zwei Feldern: v 0 unten (zu), v 1 hochgezogen */
function wp_kGitter(s, v){
  const B = wp_img(66, 64, 60), ax = B.ax, ay = B.ay, bot = v ? ay - 46 : ay;
  if (!v) wp_groundShadow(B, ax + 2, ay + 1, 30, 2.5);
  // Balken oben, aus dem das Gitter kommt
  wp_rect(B, ax - 33, ay - 64, ax + 33, ay - 55, (x, y) => wp_tone(wp_P.oak, .55 - (y - ay + 64) * .03 + (wp_h(x >> 2, y, s) - .5) * .1, x, y));
  wp_rect(B, ax - 33, ay - 55, ax + 33, ay - 54, wp_P.dark[0]);
  // senkrechte Stäbe mit Spitzen, waagrechte Riegel
  for (let i = -28; i <= 28; i += 7){
    wp_rect(B, ax + i - 1, ay - 54, ax + i + 2, bot - 3, (x, y) => wp_tone(wp_P.iron, .62 - (x - (ax + i - 1)) * .14, x, y));
    wp_poly(B, [[ax + i - 1, bot - 3], [ax + i + 2, bot - 3], [ax + i + .5, bot]], wp_P.iron[4]);
  }
  for (let y = ay - 50; y < bot - 6; y += 12) wp_rect(B, ax - 30, y, ax + 31, y + 2, (x, yy) => wp_tone(wp_P.iron, yy === y ? .55 : .35, x, yy));
  return wp_xRes(B, [[-32, -6, 32, 1]], null, {});
}
/* Lore (Hunt) mit Erz auf vier kleinen Rädern */
function wp_kLore(s, v){
  const B = wp_img(32, 28, 25), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 2, ay + 1, 14, 2.5);
  for (const sx of [-9, 7]) wp_ell(B, ax + sx, ay - 3, 3, 3, (x, y) => wp_tone(wp_P.iron, .45 - Math.hypot(x - ax - sx, y - ay + 3) * .08, x, y));
  wp_poly(B, [[ax - 14, ay - 17], [ax + 14, ay - 17], [ax + 12, ay - 5], [ax - 12, ay - 5]], wp_hplanks(wp_P.wood, s, 4, { oy: ay - 17 }));
  for (const xx of [ax - 11, ax + 9]) wp_rect(B, xx, ay - 17, xx + 2, ay - 5, wp_P.iron[2]);
  wp_rect(B, ax - 14, ay - 17, ax + 14, ay - 16, wp_P.iron[3]);
  for (let k = 0; k < 9; k++){   // Erzbrocken obenauf
    const x = ax - 11 + wp_h(k, 1, s) * 22, y = ay - 18 - wp_h(k, 2, s) * 4;
    wp_ell(B, x, y, 2.5, 2, (xx, yy) => wp_tone(wp_P.grey, .45 + (x - xx) * .08 + (y - yy) * .06, xx, yy));
    if (k % 3 === 0) wp_set(B, x, y - 1, v ? wp_c('#d8b058') : wp_c('#c8d4e0'));
  }
  return wp_xRes(B, [[-12, -7, 12, 1]], null, {});
}
/* Erzhaufen: v 0 Silbererz (blaugrau glänzend), v 1 Kupfererz (grün und golden) */
function wp_kErz(s, v){
  const B = wp_img(30, 22, 19), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 2, ay + 1, 13, 2.5);
  for (let k = 0; k < 16; k++){
    const a = wp_h(k, 1, s) * Math.PI, r = wp_h(k, 2, s), x = ax + Math.cos(a) * 11 * r * (k & 1 ? 1 : -1), y = ay - 3 - Math.sin(a) * 8 * (1 - r) - (k > 10 ? 4 : 0);
    const rr = 2.5 + wp_h(k, 3, s) * 2;
    wp_ell(B, x, y, rr, rr * .8, (xx, yy) => wp_tone(wp_P.grey, .42 + (x - xx) * .07 + (y - yy) * .07 + (wp_h(xx | 0, yy | 0, s) - .5) * .1, xx, yy));
    if (wp_h(k, 4, s) < .55){ const c = v ? (k % 2 ? wp_c('#4f9a6a') : wp_c('#d8b058')) : (k % 2 ? wp_c('#a8bccc') : wp_c('#e8f0f8')); wp_set(B, x - 1, y - 1, c); if (k % 3 === 0) wp_set(B, x, y - 1, c); }
  }
  return wp_xRes(B, [[-11, -6, 11, 1]], null, {});
}


/* ---------- Feste: Tisch mit Bänken, Holzstoß fürs Johannisfeuer, Erntekrone, Laterne, Garbe, Christbaum ---------- */
function wp_kFesttisch(s){
  const B = wp_img(46, 30, 26), ax = B.ax, ay = B.ay, R = rng(s);
  wp_groundShadow(B, ax + 2, ay + 1, 21, 3);
  const bench = y0 => { wp_rect(B, ax - 19, y0, ax + 19, y0 + 3, (x, y) => wp_tone(wp_P.wood, y === y0 ? .7 : .45, x, y)); for (const lx of [ax - 16, ax + 14]) wp_rect(B, lx, y0 + 3, lx + 2, y0 + 6, (x, y) => wp_tone(wp_P.wood, .3, x, y)); };
  bench(ay - 23);
  wp_rect(B, ax - 21, ay - 17, ax + 21, ay - 9, (x, y) => wp_tone(wp_P.oak, .58 + (wp_vn(x * .2, y, s) - .5) * .3 - (y > ay - 11 ? .2 : 0), x, y));
  for (const lx of [ax - 18, ax + 16]) wp_rect(B, lx, ay - 9, lx + 2, ay - 3, (x, y) => wp_tone(wp_P.oak, .3, x, y));
  for (let i = 0; i < 4; i++){ const mx = ax - 16 + (R() * 30 | 0); wp_rect(B, mx, ay - 21, mx + 3, ay - 16, (x, y) => wp_tone(wp_P.wood, .55 + (mx + 3 - x) * .1, x, y)); wp_rect(B, mx, ay - 22, mx + 3, ay - 20, wp_c('#e8e2d0')); }
  wp_ell(B, ax + (R() - .5) * 20, ay - 14, 4, 2, (x, y) => wp_tone(wp_P.straw, .7, x, y));
  bench(ay - 5);
  return wp_xRes(B, [[-20, -18, 20, -9]], null, {});
}
function wp_kFeuerholz(s){
  const B = wp_img(52, 40, 34), ax = B.ax, ay = B.ay, R = rng(s);
  wp_ell(B, ax, ay - 4, 22, 6, (x, y) => wp_tone(wp_P.char, .2 + wp_h(x, y, s) * .4, x, y));
  for (let a = 0; a < 14; a++){ const an = a / 14 * Math.PI * 2; wp_ell(B, ax + Math.cos(an) * 22, ay - 4 + Math.sin(an) * 6, 2.6, 1.8, (x, y) => wp_tone(wp_P.grey, .6 - (y - ay + 4) * .12, x, y)); }
  for (let i = 0; i < 11; i++){ const t = i / 10, bx = ax - 16 + t * 32, top = ax + (R() - .5) * 4; wp_seg(B, bx, ay - 4, top, ay - 30 - R() * 4, 2.6, (x, y) => wp_tone(wp_P.bark, .35 + wp_h(x >> 1, y, s + i) * .25, x, y)); }
  return wp_xRes(B, [[-20, -8, 20, 0]], null, {});
}
function wp_kErntekrone(s){
  const B = wp_img(34, 92, 88), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 2, ay + 1, 6, 1.5);
  wp_rect(B, ax - 1, ay - 66, ax + 1, ay, (x, y) => wp_tone(wp_P.oak, x < ax ? .5 : .35, x, y));
  wp_ell(B, ax, ay - 76, 11, 12, (x, y) => y > ay - 72 ? 0 : wp_tone(wp_P.straw, .62 - (x - ax) * .03 + (((x * 3 + y) & 3) === 0 ? -.15 : 0), x, y));
  wp_rect(B, ax - 12, ay - 74, ax + 12, ay - 69, (x, y) => wp_tone(wp_P.straw, .75 - (y - ay + 74) * .08 + ((x & 1) ? -.08 : 0), x, y));
  const CL = [wp_P.red2, wp_P.blue2, wp_P.yel2, wp_P.cloth];
  for (let i = 0; i < 6; i++){ const bx = ax - 10 + i * 4, len = 10 + (i % 3) * 4; wp_rect(B, bx, ay - 69, bx + 1, ay - 69 + len, (x, y) => wp_tone(CL[i % 4], .65, x, y)); }
  wp_rect(B, ax - 1, ay - 91, ax + 1, ay - 87, wp_P.gold[4]);
  return wp_xRes(B, [[-2, -2, 2, 1]], null, {});
}
function wp_kLaterne(s){
  const B = wp_img(18, 46, 43), ax = B.ax - 2, ay = B.ay;
  wp_groundShadow(B, ax + 2, ay + 1, 4, 1.2);
  wp_rect(B, ax - 1, ay - 36, ax + 1, ay, (x, y) => wp_tone(wp_P.oak, x < ax ? .5 : .3, x, y));
  wp_rect(B, ax - 1, ay - 37, ax + 7, ay - 35, wp_P.iron[2]);
  wp_rect(B, ax + 3, ay - 34, ax + 9, ay - 26, (x, y) => (x === ax + 3 || x === ax + 8 || y === ay - 34 || y === ay - 27) ? wp_P.iron[1] : wp_c('#f0c060'));
  wp_rect(B, ax + 2, ay - 36, ax + 10, ay - 34, wp_P.iron[2]);
  return wp_xRes(B, [[-2, -2, 2, 1]], null, {});
}
function wp_kGarbe(s){
  const B = wp_img(20, 26, 23), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 2, ay + 1, 7, 2);
  wp_poly(B, [[ax - 7, ay], [ax + 7, ay], [ax + 2, ay - 18], [ax - 2, ay - 18]], (x, y) => wp_tone(wp_P.straw, .55 - (x - ax) * .04 + (((x * 2 + (y >> 1)) & 3) === 0 ? -.14 : 0), x, y));
  wp_rect(B, ax - 4, ay - 11, ax + 4, ay - 9, (x, y) => wp_tone(wp_P.straw, .35, x, y));
  wp_ell(B, ax, ay - 20, 4, 3, (x, y) => wp_tone(wp_P.straw, .7 - (y - ay + 20) * .05, x, y));
  return wp_xRes(B, [[-5, -3, 5, 1]], null, {});
}
/* Christbaum: eine Fichte mit roten Äpfeln, Strohsternen und Kerzen (so schmückte man um 1520 im Elsass) */
function wp_kChristbaum(s){
  const P = wp_tFichte(s), c = canvasOf(P.img.width, P.img.height), g = c.getContext('2d'), R = rng(s + 5);
  g.drawImage(P.img, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data, op = (x, y) => x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 200;
  const put = (x, y, col, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h || w); };
  const lit = [];
  for (let i = 0, n = 0; i < 600 && n < 40; i++){
    const x = (R() * c.width) | 0, y = (R() * c.height * .8) | 0;
    if (!op(x, y) || !op(x + 4, y + 4) || !op(x, y - 5) || !op(x - 3, y)) continue;
    const k = R(); n++;
    if (k < .45){ put(x, y, '#16120f', 5); put(x + 1, y + 1, '#c8281e', 3); put(x + 1, y + 1, '#f06a50', 1); }
    else if (k < .75){ put(x - 1, y + 1, '#16120f', 6, 4); put(x, y + 1, '#e8c860', 4, 2); put(x + 1, y, '#e8c860', 2, 4); put(x + 1, y + 1, '#fff0b0', 2); }
    else { put(x, y, '#16120f', 4, 6); put(x + 1, y + 1, '#f4f0e0', 2, 4); put(x + 1, y - 2, '#ffd36a', 2); lit.push([x + 2, y - 1]); }
  }
  return Object.assign({}, P, { img: c, occl: null, extra: { candles: lit } });
}


/* ============ Schnittstelle ============ */
/* Art -> [Zeichner, Anzahl Varianten]. Varianten werden erst bei Bedarf gezeichnet und behalten. */
/* ============ Stromland: Kähne, Tretkran, Netze, Palisade, Rebzeilen, Dom ============ */
const wp_CU = wp_rmp(['#173029', '#21413a', '#2c5249', '#386458', '#477768', '#5a8a79', '#71a08d']);   // Kupfer mit Grünspan
const wp_VINE = [
  wp_rmp(['#1a2a12', '#26391a', '#334b21', '#425d29', '#527031', '#64833b', '#789646']),   // Frühling
  wp_rmp(['#122010', '#1a2c15', '#24391a', '#2e4720', '#3a5627', '#47652f', '#567438']),   // Sommer
  wp_rmp(['#2a1a0c', '#42260e', '#5c3412', '#764418', '#90561e', '#a86a28', '#bc8034']),   // Herbst
  null
];
/* Stromkahn (Nachen); v: 0 mit Riemen, 1 beladen, 2 Lastkahn mit Mast, 3 an Land gezogen */
function wp_kKahn(s, v){
  const L = v === 2 ? 46 : 38, land = v === 3;
  const B = wp_img(2 * L + 18, v === 2 ? 96 : 50, v === 2 ? 88 : 42), cx = B.ax, ay = B.ay, R = rng(s);
  const half = x => Math.max(0, 1 - Math.pow(Math.abs((x + .5 - cx) / L), 2.4));
  const up = x => { const t = (x + .5 - cx) / L; return t < 0 ? Math.pow(-t, 3) * 9 : Math.pow(t, 4) * 4; };
  const yNear = x => ay - 7 - up(x), dep = x => 11 * Math.pow(half(x), .55), yFar = x => yNear(x) - dep(x);
  const yBot = x => ay - 1 + (land ? 0 : 0) - (1 - half(x)) * 3;
  if (land) wp_groundShadow(B, cx + 3, ay + 1, L, 4);
  // Innenraum: Bodenbretter mit Spanten, weiter hinten dunkler
  for (let x = cx - L; x <= cx + L; x++){
    if (half(x) <= .02) continue;
    const yf = Math.round(yFar(x)), yn = Math.round(yNear(x));
    for (let y = yf + 1; y < yn; y++){
      const t = (y - yf) / Math.max(1, yn - yf), rib = ((x - cx + 60) % 9) === 0;
      wp_set(B, x, y, wp_tone(wp_P.oak, rib ? .1 : .2 + t * .28 + ((y - yf) % 3 === 0 ? -.06 : 0), x, y));
    }
    wp_set(B, x, yf, wp_tone(wp_P.wood, .78, x, yf)); wp_set(B, x, yf + 1, wp_tone(wp_P.oak, .14, x, yf));   // ferner Dollbord
  }
  // Ruderbänke quer
  for (const bx of [cx - 18, cx + 4, cx + 22]) if (half(bx) > .2){ const yf = Math.round(yFar(bx)), yn = Math.round(yNear(bx)); for (let y = yf + 1; y < yn; y++){ wp_set(B, bx, y, wp_tone(wp_P.wood, .7, bx, y)); wp_set(B, bx + 1, y, wp_tone(wp_P.wood, .45, bx, y)); wp_set(B, bx + 2, y, wp_tone(wp_P.wood, .3, bx, y)); } }
  // Ladung
  if (v === 1 || v === 2){
    for (let i = 0; i < (v === 2 ? 5 : 3); i++){
      const fx = cx - 22 + i * 11 + (R() * 3 | 0), yb = Math.round(yNear(fx)) - 1;
      if (i % 2){ wp_rect(B, fx - 4, yb - 8, fx + 4, yb, (x, y) => wp_tone(wp_P.wood, (x === fx - 4 || y === yb - 8 ? .7 : .4) + ((y - yb) % 4 === 0 ? -.15 : 0), x, y)); }
      else { wp_ell(B, fx, yb - 5, 4, 5.5, (x, y) => { const nx = (x + .5 - fx) / 4; return wp_tone(wp_P.oak, .55 - nx * .3 + (Math.abs(y + .5 - (yb - 5)) > 3 && Math.abs(y + .5 - (yb - 5)) < 4.2 ? -.25 : 0), x, y); }); wp_line(B, fx - 3, yb - 8, fx + 3, yb - 8, wp_P.iron[3]); wp_line(B, fx - 3, yb - 2, fx + 3, yb - 2, wp_P.iron[2]); }
    }
  }
  // nahe Bordwand aus Planken, Licht oben
  for (let x = cx - L; x <= cx + L; x++){
    if (half(x) <= .02 && Math.abs(x - cx) < L - 1) continue;
    const yn = Math.round(yNear(x)), yb = Math.round(yBot(x));
    for (let y = yn; y <= yb; y++){
      const k = y - yn, band = Math.floor(k / 3);
      let t = k === 0 ? .85 : .42 - band * .08 + ((k % 3) === 0 ? .12 : 0) - Math.abs((x - cx) / L) * .1;
      if (land && y === yb) t -= .2;
      wp_set(B, x, y, wp_tone(wp_P.wood, t, x, y));
    }
  }
  // Steven und Nieten
  const bow = cx - L, stern = cx + L;
  for (let k = 0; k < 4; k++){ wp_set(B, bow - k * .4, Math.round(yNear(bow)) - k, wp_tone(wp_P.oak, .7, 0, 0)); }
  for (let x = cx - L + 4; x < cx + L - 2; x += 5) wp_set(B, x, Math.round(yNear(x)) + 2, wp_P.iron[2]);
  if (v === 0 || v === 3){   // Riemen über den Bänken
    wp_line(B, cx - 26, Math.round(yFar(cx - 26)) + 1, cx + 14, Math.round(yNear(cx + 14)) - 1, wp_P.oak[3]);
    wp_line(B, cx - 24, Math.round(yFar(cx - 24)) + 2, cx + 16, Math.round(yNear(cx + 16)), wp_P.oak[2]);
    wp_rect(B, cx + 12, Math.round(yNear(cx + 14)) - 2, cx + 19, Math.round(yNear(cx + 14)), wp_tone(wp_P.wood, .5, 0, 0));
  }
  if (v === 2){   // Mast mit Rah und gerefftem Segel, Wanten zum Bug und Heck
    const mx = cx - 6, mb = Math.round(yNear(mx)) - 2, mt = mb - 70;
    wp_beam(B, mx, mb, mx, mt, 2, wp_P.oak, s + 3);
    wp_beam(B, mx - 22, mt + 10, mx + 22, mt + 10, 1.6, wp_P.oak, s + 4);
    for (let x = mx - 21; x <= mx + 21; x++){ const sag = Math.round(Math.sin((x - mx + 21) / 42 * Math.PI) * 2); for (let k = 0; k < 4; k++) wp_set(B, x, mt + 11 + k + sag, wp_tone(wp_P.cloth, .75 - k * .15 - (x - mx) * .006, x, mt + 11 + k)); }
    wp_line(B, mx, mt + 1, bow + 2, Math.round(yNear(bow + 2)), wp_P.straw[1]);
    wp_line(B, mx, mt + 1, stern - 2, Math.round(yNear(stern - 2)), wp_P.straw[1]);
    for (let k = 0; k < 7; k++) wp_set(B, mx + 2 + k, mt - 2 + (k >> 2), wp_tone(wp_P.red2, .6, k, 0));          // Wimpel
  }
  // Wellen am Rumpf
  if (!land) for (let x = cx - L + 3; x < cx + L - 3; x++) if (((x * 7 + s) % 11) < 2){ const yb = Math.round(yBot(x)) + 1; wp_set(B, x, yb, wp_c('#9fb8b6')); wp_set(B, x + 1, yb, wp_c('#7f9a98')); }
  return wp_xRes(B, land ? [[-L + 4, -8, L - 4, 1]] : [], null);
}

/* Tretkran am Kai: Holzturm mit Spitzdach, Tretrad, Ausleger über dem Wasser mit Seil und Fass */
function wp_kKran(s){
  const B = wp_img(132, 150, 140), R = rng(s);
  B.ax = 44; const cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 6, ay + 1, 24, 4);
  const x0 = cx - 15, x1 = cx + 15, yT = ay - 62;
  // Bohlenwand mit Eckständern und Riegeln
  wp_rect(B, x0, yT, x1, ay, (x, y) => wp_tone(wp_P.gwood, .48 - (x - x0) / 30 * .3 + (((x - x0) % 5) === 0 ? -.15 : 0) + (wp_h(x, y >> 2, s) - .5) * .12, x, y));
  for (const bx of [x0, x1 - 2]) wp_beam(B, bx + 1, ay, bx + 1, yT, 2, wp_P.oak, s + bx);
  for (const by of [ay - 22, ay - 44]) wp_beam(B, x0, by, x1, by, 2, wp_P.oak, s + by);
  wp_beam(B, x0 + 2, ay - 23, x1 - 3, ay - 43, 1.6, wp_P.oak, s + 7);
  wp_door(B, cx - 5, ay - 16, 10, 16, { R: wp_P.oak, s: s + 5, arch: 'flat' });
  wp_window(B, cx - 3, ay - 56, 6, 7, { frame: wp_P.oak, s: s + 1 });
  // Spitzdach mit Schindeln
  const rT = yT - 30;
  wp_poly(B, [[x0 - 4, yT + 1], [x1 + 4, yT + 1], [cx, rT]], (x, y) => { const row = Math.floor((y - rT) / 3), nx = (x + .5 - cx) / Math.max(1, (y - rT) / 30 * 19); return wp_tone(wp_P.shingle, .5 - nx * .32 + ((y - rT) % 3 === 0 ? -.14 : 0) + (wp_h(Math.floor(x / 3 + row * .5), row, s) - .5) * .2, x, y); });
  wp_finial(B, cx, rT, false);
  // Tretrad links am Turm
  const wx = x0 - 6, wy = ay - 22, wr = 18;
  wp_ell(B, wx, wy, wr, wr, (x, y) => { const d = Math.hypot(x + .5 - wx, y + .5 - wy); if (d > wr - 2.4) return wp_tone(wp_P.oak, .55 - (y - wy) / wr * .25, x, y); if (d > wr - 5){ const a = Math.atan2(y + .5 - wy, x + .5 - wx); return (Math.floor(a / (Math.PI / 12)) & 1) ? wp_tone(wp_P.wood, .45, x, y) : wp_tone(wp_P.wood, .3, x, y); } return 0; });
  for (let a = 0; a < 8; a++){ const an = a * Math.PI / 4 + .2; wp_line(B, wx, wy, wx + Math.cos(an) * (wr - 4), wy + Math.sin(an) * (wr - 4), wp_P.oak[2]); }
  wp_ell(B, wx, wy, 2.4, 2.4, wp_P.iron[3]);
  wp_beam(B, wx, wy, wx - 4, ay, 2, wp_P.oak, s + 11); wp_beam(B, wx, wy, wx + 6, ay, 2, wp_P.oak, s + 12);
  // Ausleger mit Strebe, Seil, Haken, Fass
  const jx0 = x1 - 2, jy0 = yT + 6, jx1 = x1 + 64, jy1 = yT - 26;
  wp_beam(B, jx0, jy0, jx1, jy1, 2.6, wp_P.oak, s + 21);
  wp_beam(B, x1, ay - 40, jx0 + 30, jy0 - 15, 2, wp_P.oak, s + 22);
  wp_line(B, cx, yT - 4, jx1, jy1, wp_P.straw[2]);
  const hy = ay - 36;
  wp_line(B, jx1, jy1 + 1, jx1, hy, wp_P.straw[2]);
  wp_set(B, jx1, hy + 1, wp_P.iron[3]); wp_set(B, jx1 + 1, hy + 2, wp_P.iron[2]);
  wp_ell(B, jx1, hy + 9, 5, 6.5, (x, y) => { const nx = (x + .5 - jx1) / 5, dy = Math.abs(y + .5 - (hy + 9)); return wp_tone(wp_P.oak, .58 - nx * .3 + (dy > 3.4 && dy < 4.6 ? -.25 : 0), x, y); });
  return wp_xRes(B, [[-16, -9, 16, 2], [-26, -6, -10, 1]], [-30, -96, 26, -10]);
}

/* Netzgestell der Fischer: zwei Pfosten, Querholz, hängende Netze mit Korkschwimmern */
function wp_kNetze(s){
  const B = wp_img(52, 46, 42), cx = B.ax, ay = B.ay, R = rng(s);
  wp_groundShadow(B, cx + 2, ay + 1, 22, 3);
  const top = ay - 30;
  for (let x = cx - 16; x <= cx + 16; x++){
    const bot = ay - 5 - Math.round(Math.sin((x - cx + 16) / 32 * Math.PI) * 4 + (wp_h(x, 3, s) - .5) * 3);
    for (let y = top + 1; y < bot; y++){
      const m = ((x + y) % 3 === 0) || ((x - y + 99) % 3 === 0);
      if (m) wp_set(B, x, y, wp_tone(wp_P.straw, .28 + (y - top) / 40 * .25, x, y));
    }
    wp_set(B, x, bot, wp_tone(wp_P.straw, .5, x, bot));
    if (((x - cx) % 5) === 0) wp_set(B, x, top + 2, wp_c('#c8a868'));
  }
  for (const px of [cx - 19, cx + 19]) wp_beam(B, px, ay, px, top - 4, 2, wp_P.gwood, s + px);
  wp_beam(B, cx - 21, top, cx + 21, top, 2, wp_P.gwood, s + 3);
  return wp_xRes(B, [[-21, -3, -17, 1], [17, -3, 21, 1]], null);
}

/* Palisade aus zugespitzten Stämmen mit Querriegel */
function wp_kPalisade(s, v){
  const B = wp_img(54, 46, 42), cx = B.ax, ay = B.ay, R = rng(s);
  wp_groundShadow(B, cx + 3, ay + 1, 27, 3);
  for (let i = 0; i < 12; i++){
    const x = cx - 24 + i * 4, h = 30 + (R() * 7 | 0), top = ay - h, lean = (R() - .5) * .06;
    for (let y = top; y < ay; y++) for (let k = 0; k < 4; k++){
      if (y < top + 4 && Math.abs(k - 1.5) > (y - top) * .45 + .3) continue;
      const X = x + k + Math.round((ay - y) * lean);
      wp_set(B, X, y, wp_tone(wp_P.bark, .34 + (k === 0 ? .22 : k === 3 ? -.16 : .04) + (wp_h(X, y >> 1, s) - .5) * .22 + (y < top + 5 ? .12 : 0), X, y));
    }
  }
  wp_beam(B, cx - 25, ay - 13, cx + 25, ay - 13, 1.6, wp_P.gwood, s + 3);
  for (let i = 0; i < 6; i++) wp_set(B, cx - 22 + i * 8, ay - 13, wp_P.straw[3]);
  return wp_xRes(B, [[-25, -5, 25, 2]], null);
}

/* Rebzeile: Weinstöcke an Einzelpfählen; Laub je Jahreszeit, Trauben im Herbst */
function wp_kRebzeile(s, v){
  const B = wp_img(70, 34, 30), cx = B.ax, ay = B.ay, R = rng(s + v * 13), sea = wp_SEA, VL = wp_VINE[sea];
  wp_groundShadow(B, cx + 2, ay + 1, 33, 2);
  for (let i = 0; i < 8; i++){
    const x = Math.round(cx - 29 + i * 8.2 + (R() - .5) * 1.5), ht = 18 + (R() * 3 | 0);
    wp_line(B, x, ay, x, ay - ht, wp_P.gwood[3]); wp_set(B, x, ay - ht, wp_P.gwood[4]);
    wp_line(B, x + 1, ay, x + 1, ay - 7, wp_P.bark[2]); wp_set(B, x + 2, ay - 4, wp_P.bark[1]);
    if (!VL){   // Winter: geschnittene Ruten
      wp_line(B, x + 1, ay - 7, x + 4, ay - 11, wp_P.bark[2]); wp_line(B, x + 1, ay - 8, x - 2, ay - 12, wp_P.bark[1]);
      continue;
    }
    const cy = ay - 12 - (R() * 2 | 0), rx = sea === 0 ? 3 : 4.6, ry = sea === 0 ? 4 : 6.2;
    wp_ell(B, x + 1, cy, rx, ry, (X, Y) => {
      const nx = (X + .5 - x - 1) / rx, ny = (Y + .5 - cy) / ry;
      if (wp_h(X, Y, s + i) < .16 && nx * nx + ny * ny > .5) return 0;
      let c = wp_tone(VL, .55 - nx * .25 - ny * .2 + (wp_h(X >> 1, Y, s + i * 3) - .5) * .35, X, Y);
      if (sea === 2 && wp_h(X, Y, s + 7) < .25) c = wp_tone(wp_P.red2, .55 - ny * .2, X, Y);
      return c;
    });
    if (sea >= 1){   // Trauben: im Sommer grün und klein, im Herbst blau und voll
      const G = sea === 2 ? [wp_c('#1c1626'), wp_c('#34284a'), wp_c('#54447a')] : [wp_c('#3a4a20'), wp_c('#56682c'), wp_c('#748a3c')];
      for (const [dx, dy] of sea === 2 ? [[-2, 3], [3, 4]] : [[2, 4]]){
        const gx = x + 1 + dx, gy = cy + dy;
        wp_set(B, gx, gy, G[2]); wp_set(B, gx + 1, gy, G[1]); wp_set(B, gx, gy + 1, G[1]); wp_set(B, gx + 1, gy + 1, G[0]); if (sea === 2){ wp_set(B, gx, gy + 2, G[0]); wp_set(B, gx - 1, gy + 1, G[1]); }
      }
    }
  }
  return wp_xRes(B, [[-32, -4, 32, 1]], null);
}

/* romanisches Rundbogenfenster mit Gewände */
function wp_rwin(B, x, y, w, h, Rf, o){
  o = o || {};
  if (wp_WINREC && !o.dark) wp_WINREC.push([x, y, w, h]);
  const r = w / 2, yS = y + Math.ceil(r);
  const inA = (px, py) => py <= 0 ? (px >= 0 && px <= w) : Math.hypot(px - r, py) <= r;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){
    const X = x + i, Y = y + j, px = i + .5, py = yS - Y - .5;
    if (!inA(px, py)) continue;
    const edge = !inA(px - 1, py) || !inA(px + 1, py) || !inA(px, py + 1) || j === h - 1;
    if (edge){ wp_set(B, X, Y, wp_tone(Rf, i < w / 2 && j < h - 1 ? .22 : .62, X, Y)); continue; }
    wp_set(B, X, Y, o.dark ? wp_P.dark[j < 3 ? 0 : 1] : wp_tone(wp_P.glass, .12 + ((i + j) % 4 === 0 ? .18 : 0) + (j < r ? .08 : 0), X, Y));
  }
  for (let i = -1; i <= w; i++) wp_set(B, x + i, y + h, wp_tone(Rf, .8, x + i, y + h));
}
/* Zwerggalerie: Reihe kleiner Rundbögen auf Säulchen unter der Traufe */
function wp_dwarfGallery(B, x0, x1, yT, h, Rf){
  for (let x = Math.floor(x0); x < x1; x++){
    const u = ((x - x0) % 6 + 6) % 6;
    for (let y = yT; y < yT + h; y++){
      const k = y - yT, arch = k < 3 ? Math.abs(u - 3) <= k : true;
      if (u === 0 || !arch || k === h - 1) wp_set(B, x, y, wp_tone(Rf, u === 0 ? .7 : k === h - 1 ? .82 : .5, x, y));
      else wp_set(B, x, y, wp_P.dark[k < 4 ? 0 : 1]);
    }
  }
  wp_cornice(B, x0, x1, yT - 2, Rf, 2);
}
/* Dom zu Altmünster: Westbau mit zwei Türmen, Langhaus mit Obergaden und Zwerggalerie, Vierungsturm mit Kuppel, Ostturm und Apsis */
function wp_bDom(s, v){
  const W = 300, B = wp_img(W, 300, 292), R = rng(s), ax = B.ax, ay = B.ay;
  const RS = wp_P.red, Y2 = wp_P.ochre;
  const wallFn = wp_ashlar({ R: RS, s, ch: 4, bmin: 6, bmax: 14, per: 512, stain: .6, mo: wp_rmp(['#2a221e', '#3a302a', '#4c3f37', '#5e5045']), moss: (x, y) => (y - (ay - 10)) / 12 });
  const bandFn = (x, y) => { const c = wallFn(x, y); return ((y >> 2) % 5 === 0) ? wp_mix(c, Y2[3], .35) : c; };   // gelbe Sandsteinlagen
  const cuFn = (u, vv, x, y, e) => wp_tone(wp_CU, .5 + e + ((Math.floor(u) % 5) === 0 ? -.12 : 0) + (wp_h(x >> 1, y >> 1, s) - .5) * .1, x, y);
  wp_shadowPoly(B, [[6, ay - 1], [W - 4, ay - 1], [W - 4, ay + 4], [8, ay + 4]]);
  const tower = (X0, X1, Z, H, capH, kind) => {
    const x0 = ax + X0, x1 = ax + X1, yB = ay - Z, yT = yB - H;
    wp_wall(B, x0, x1, yT, yB, (x, y) => { let c = bandFn(x, y); if (x < x0 + 2) c = wp_mix(c, 0xffe8eef0, .08); else if (x > x1 - 3) c = wp_mix(c, wp_OUT, .22); return c; });
    for (const yy of [yB - 46, yB - 92, yB - 130]) if (yB - yy < H - 8) wp_cornice(B, x0 - 1, x1 + 1, yy, RS, 2);
    const cx = Math.round((x0 + x1) / 2);
    // Lisenen an den Kanten
    for (const lx of [x0, x1 - 3]) for (let y = yT + 4; y < yB; y++) for (let k = 0; k < 3; k++) wp_set(B, lx + k, y, wp_tone(RS, k === 0 ? .7 : .5, lx + k, y));
    wp_rwin(B, cx - 2, yB - 40, 5, 14, RS);
    if (H > 100){ wp_rwin(B, cx - 6, yB - 86, 5, 16, RS); wp_rwin(B, cx + 2, yB - 86, 5, 16, RS); }
    // Schallarkaden oben: drei Bögen
    for (const dx of [-9, -2, 5]) wp_rwin(B, cx + dx, yT + 10, 5, 15, RS, { dark: true });
    wp_cornice(B, x0 - 1, x1 + 1, yT, RS, 3);
    const sp = wp_pyramid(B, (X0 + X1) / 2, Z + (X1 - X0) / 2, H, (X1 - X0) * .72, capH, 4, cuFn, { rot: Math.PI / 4 });
    wp_finial(B, Math.round(sp.ax), Math.round(sp.ay), kind === 'west');
  };
  /* ---- Langhaus ---- */
  const nX0 = -84, nX1 = 52, Hn = 84, nx0 = ax + nX0, nx1 = ax + nX1, nyT = ay - Hn;
  wp_wall(B, nx0, nx1, nyT, ay, bandFn);
  for (let x = nx0; x < nx1; x++){ wp_set(B, x, ay - 8, wp_tone(RS, .82, x, 0)); wp_set(B, x, ay - 7, wp_tone(RS, .5, x, 0)); }
  // Seitenschiff unten mit Rundbogenfenstern, Obergaden oben, Lisenen dazwischen
  for (let i = 0; i < 7; i++){
    const bx = nx0 + 6 + i * 19;
    wp_rwin(B, bx + 3, ay - 34, 7, 18, RS);
    wp_rwin(B, bx + 3, nyT + 16, 7, 22, RS);
    for (let y = nyT + 8; y < ay - 8; y++) for (let k = 0; k < 2; k++) wp_set(B, bx - 4 + k, y, wp_tone(RS, k ? .48 : .72, bx - 4 + k, y));
  }
  wp_cornice(B, nx0, nx1, ay - 44, RS, 2);
  wp_dwarfGallery(B, nx0, nx1, nyT + 2, 9, RS);
  const rf = wp_roofEaves(B, { X0: nX0, X1: nX1, D: 56, Hw: Hn, Hr: 30, ov: 2, ovs: 1, endL: 'gable', endR: 'gable', fn: cuFn, s: s + 41 });
  wp_shade(B, nx0, rf.yE, nx1, rf.yE + 4, .4, 4);
  /* ---- Westbau: zwei Türme, dazwischen Portal und Giebel ---- */
  const wX0 = -138, wX1 = -84;
  tower(-146, -118, 2, 168, 48, 'west');
  const mx0 = ax - 118, mx1 = ax - 84, myT = ay - 112;
  wp_wall(B, mx0, mx1, myT, ay, bandFn);
  wp_dwarfGallery(B, mx0, mx1, myT + 2, 9, RS);
  const pw = 16, ph = 30, px = Math.round((mx0 + mx1) / 2 - pw / 2), py = ay - 6 - ph;
  for (let k = 3; k >= 1; k--) wp_door(B, px - k, py - k, pw + 2 * k, ph + k, { arch: 'round', open: true });
  for (let k = 3; k >= 1; k--) for (let j = 0; j < ph + k; j++) for (let ii = 0; ii < 2 * k + pw; ii++){
    const x = px - k + ii, y = py - k + j; if (!wp_op(B, x, y)) continue;
    const c = wp_get(B, x, y); if (c === wp_P.dark[0] || c === wp_P.dark[1]) wp_set(B, x, y, wp_tone(RS, .3 + k * .15 + (ii < k + pw / 2 ? .1 : -.05), x, y));
  }
  wp_door(B, px, py, pw, ph, { R: wp_P.oak, s: s + 7, arch: 'round' });
  wp_rwin(B, Math.round((mx0 + mx1) / 2) - 6, myT + 20, 12, 12, RS);   // Rundfenster über dem Portal
  tower(-112, -84, 10, 150, 44, 'west2');
  /* ---- Vierungsturm mit Kuppel ---- */
  const vX0 = 52, vX1 = 92, vZ = 22, Hv = 132, vx0 = ax + vX0, vx1 = ax + vX1, vyB = ay - vZ;
  wp_wall(B, vx0, vx1, vyB - Hv, ay, bandFn);
  for (let i = 0; i < 2; i++) wp_rwin(B, vx0 + 8 + i * 16, ay - 40, 7, 18, RS);
  wp_cornice(B, vx0, vx1, ay - Hn + 4, RS, 2);
  wp_dwarfGallery(B, vx0, vx1, vyB - Hv + 12, 9, RS);
  for (const dx of [8, 20]) wp_rwin(B, vx0 + dx, vyB - Hv + 30, 6, 16, RS);
  wp_cornice(B, vx0 - 1, vx1 + 1, vyB - Hv, RS, 3);
  const vd = wp_pyramid(B, (vX0 + vX1) / 2, vZ + (vX1 - vX0) / 2, Hv, (vX1 - vX0) * .62, 54, 8, cuFn, { rot: Math.PI / 8 });
  wp_finial(B, Math.round(vd.ax), Math.round(vd.ay), true);
  /* ---- Ostturm und Apsis ---- */
  tower(92, 118, 6, 158, 46, 'ost');
  const aX0 = 118, aX1 = 146, aH = 70, ax0 = ax + aX0, ax1 = ax + aX1;
  for (let x = ax0; x < ax1; x++){
    const nx = (x + .5 - ax0) / (ax1 - ax0), sag = Math.round(Math.sin(nx * Math.PI) * 6);
    for (let y = ay - aH - sag; y < ay - sag + 2; y++) wp_set(B, x, y, wp_mix(bandFn(x, y), wp_OUT, nx * .35));
  }
  wp_dwarfGallery(B, ax0, ax1, ay - aH + 2, 8, RS);
  wp_rwin(B, ax0 + 8, ay - 44, 7, 20, RS);
  // halbes Kegeldach der Apsis
  for (let x = ax0 - 1; x <= ax1 + 1; x++){
    const nx = clamp((x + .5 - ax0) / (ax1 - ax0), 0, 1), sag = Math.round(Math.sin(nx * Math.PI) * 6), yb = ay - aH - sag, yt = yb - Math.round(16 * (1 - nx * .85));
    for (let y = yt; y < yb + 1; y++) wp_set(B, x, y, wp_tone(wp_CU, .62 - nx * .35 + ((y - yt) % 3 === 0 ? -.1 : 0), x, y));
  }
  // Grasbüschel am Sockel
  for (let i = 0; i < 12; i++) wp_grass(B, 10 + R() * 280, ay + 1, 3, s + i, wp_LEAF.busch);
  return wp_res(B, [[-146, -64, 146, 2]], [-150, -280, 150, -10], { door: { x: px + pw / 2 - ax } });
}
/* ---------- Versunkene Zollburg: Schleusenrad, Thron des Nöck, Anker ---------- */
/* Schleusenrad an der Mauer: v 0 Schütz unten (zu), v 1 gedreht, das Schütz steht oben */
function wp_kRad(s, v){
  const B = wp_img(26, 48, 44), ax = B.ax, ay = B.ay, cy = ay - 21, rot = v ? .42 : 0, R = 8.6;
  wp_groundShadow(B, ax + 2, ay + 1, 10, 2.2);
  // Zahnstange hinauf in die Mauer, gedreht steht sie höher
  const top = v ? ay - 47 : ay - 38;
  wp_rect(B, ax - 1.5, top, ax + 1.5, cy - 3, (x, y) => wp_tone(wp_P.iron, x < ax - 1 ? .25 : ((y - top) % 3 < 1 ? .72 : .45), x, y));
  // Sockel aus nassem Quaderstein mit Algen
  wp_rect(B, ax - 8, ay - 11, ax + 8, ay, (x, y) => wp_tone(wp_P.stone, .5 - (x - ax) * .03 + (y < ay - 10 ? .18 : 0) + (wp_h(x >> 1, y >> 1, s) - .5) * .16 - (Math.floor(y - ay + 11) % 6 === 0 ? .18 : 0), x, y));
  for (let x = ax - 8; x < ax + 8; x++) if (wp_h(x, 3, s) < .55) wp_rect(B, x, ay - 3 - ((wp_h(x, 5, s) * 3) | 0), x + 1, ay, (xx, yy) => wp_tone(wp_P.moss, .35 + (wp_h(xx, yy, s) - .5) * .2, xx, yy));
  // Achse und Lager
  wp_rect(B, ax - 2, cy, ax + 2, ay - 11, (x, y) => wp_tone(wp_P.iron, .4 - (x - ax) * .06, x, y));
  // Rad: eiserner Kranz, sechs Speichen, Griffe außen
  wp_rect(B, ax - R - 1, cy - R - 1, ax + R + 1, cy + R + 1, (x, y) => {
    const dx = x - ax, dy = y - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) - rot;
    if (d > R) return 0;
    if (d > R - 1.8) return wp_tone(wp_P.iron, .62 - dy * .035 - dx * .02 + (d > R - .5 ? -.18 : 0), x, y);
    if (d < 2) return wp_tone(wp_P.oakred, .6 - dy * .1, x, y);
    const sp = Math.abs(((a / (Math.PI / 3)) % 1 + 1) % 1 - .5);
    return sp > .4 ? wp_tone(wp_P.iron, .52 - dy * .03, x, y) : 0;
  });
  for (let i = 0; i < 6; i++){ const a = rot + i * Math.PI / 3 + Math.PI / 6, hx = ax + Math.cos(a) * (R + .8), hy = cy + Math.sin(a) * (R + .8); wp_ell(B, hx, hy, 1.3, 1.3, (x, y) => wp_tone(wp_P.oak, .65 - (y - hy) * .2, x, y)); }
  // Wasser tropft vom gehobenen Schütz
  if (v) for (let k = 0; k < 4; k++) wp_set(B, ax - 1 + (k & 1) * 2, top + 5 + k * 3, wp_c('#9fd0dc'));
  return wp_xRes(B, [[-7, -5, 7, 1]], null, {});
}
/* Thron des Nöck: Zollbank aus Quaderstein, überwuchert, mit Muscheln */
function wp_kThron(s){
  const B = wp_img(54, 60, 56), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 3, ay + 1, 24, 3.5);
  const st = (x, y, l) => wp_tone(wp_P.stone, l + (wp_h(x >> 1, y >> 1, s) - .5) * .16, x, y);
  // Rückenlehne mit Rundbogen
  wp_rect(B, ax - 18, ay - 56, ax + 18, ay - 20, (x, y) => {
    const dx = Math.abs(x - ax), top = ay - 46 - Math.sqrt(Math.max(0, 1 - (dx / 18) ** 2)) * 10;
    if (y < top) return 0;
    return st(x, y, y < top + 1.5 || dx > 16.5 ? .72 : .5 - (x - ax) * .008);
  });
  // eingemeißelte Welle, darüber das vergoldete Königswappen, verwittert
  for (let x = ax - 12; x <= ax + 12; x++){ const y = Math.round(ay - 33 + Math.sin((x - ax) * .55) * 1.5); wp_set(B, x, y, wp_P.stone[1]); wp_set(B, x, y + 1, wp_P.stone[4]); }
  wp_rect(B, ax - 5, ay - 48, ax + 5, ay - 38, (x, y) => { const dx = Math.abs(x - ax), yy = y - (ay - 48); return yy < 5 || dx < 5 - (yy - 5) * .9 ? wp_tone(wp_P.gold, .45 - (x - ax) * .04 + (wp_h(x * 2, y * 2, s + 3) < .3 ? -.25 : 0), x, y) : 0; });
  // Armlehnen und Sitz
  for (const sx of [-1, 1]) wp_rect(B, sx < 0 ? ax - 24 : ax + 16, ay - 28, sx < 0 ? ax - 16 : ax + 24, ay - 3, (x, y) => st(x, y, (y < ay - 26.5 ? .75 : .52) + (sx < 0 ? .06 : -.08)));
  wp_rect(B, ax - 16, ay - 17, ax + 16, ay - 3, (x, y) => st(x, y, y < ay - 15 ? .78 : .46));
  wp_rect(B, ax - 24, ay - 3, ax + 24, ay, (x, y) => st(x, y, .36));
  // Laichkraut hängt herab
  for (let k = 0; k < 12; k++){
    const x0 = Math.round(ax - 20 + wp_h(k, 1, s) * 40), y0 = Math.round(ay - 54 + wp_h(k, 2, s) * 24), n = 5 + (wp_h(k, 3, s) * 11 | 0);
    let x = x0; for (let j = 0; j < n; j++){ wp_set(B, x, y0 + j, wp_tone(wp_P.moss, .25 + (j % 3) * .12, x, y0 + j)); if (wp_h(k, j, s) < .3) x += wp_h(j, k, s) < .5 ? -1 : 1; }
  }
  // Muscheln
  for (let k = 0; k < 6; k++){ const x = ax - 18 + wp_h(k, 7, s) * 36, y = ay - 24 + wp_h(k, 8, s) * 20; wp_ell(B, x, y, 1.3, 1, (xx, yy) => wp_c(yy < y ? '#d8d0bc' : '#8a8270')); }
  return wp_xRes(B, [[-24, -8, 24, 1]], null, {});
}
/* Anker, rostig, liegt auf dem Boden */
function wp_kAnker(s){
  const B = wp_img(36, 18, 15), ax = B.ax, ay = B.ay;
  wp_groundShadow(B, ax + 2, ay + 1, 16, 2);
  const rust = (x, y, l) => wp_tone(wp_P.iron, l + (wp_h(x * 2, y * 2, s) < .25 ? -.2 : 0), x, y);
  wp_seg(B, ax - 12, ay - 5, ax + 11, ay - 5, 2, (x, y) => rust(x, y, .5 - (y - ay + 6) * .12));
  wp_ell(B, ax - 15, ay - 5, 2.8, 2.8, (x, y) => Math.hypot(x - ax + 15, y - ay + 5) > 1.4 ? rust(x, y, .55) : 0);
  wp_seg(B, ax - 9, ay - 10, ax - 9, ay - 1, 1.4, (x, y) => rust(x, y, .6));
  for (const sy of [-1, 1]){ wp_seg(B, ax + 11, ay - 5, ax + 6, ay - 5 + sy * 6, 1.8, (x, y) => rust(x, y, .5)); wp_poly(B, [[ax + 6, ay - 5 + sy * 6], [ax + 3, ay - 5 + sy * 5], [ax + 6, ay - 5 + sy * 8.5]], (x, y) => rust(x, y, .66)); }
  return wp_xRes(B, [[-11, -5, 12, 1]], null, {});
}

/* ============ Bergland (Version 25): Göpel, Kanone, Schanzkorb, Felsklippe ============ */
/* Pferdegöpel über einem Schacht: Gerüst aus Balken mit Seilscheibe, darunter die Schachtkaue mit Schindeldach */
function wp_kGoepel(s){
  const B = wp_img(84, 112, 104), cx = B.ax, ay = B.ay, R = rng(s);
  wp_groundShadow(B, cx + 6, ay + 1, 38, 5);
  // Kaue: Bretterhaus über dem Schacht
  const x0 = cx - 26, x1 = cx + 26, yT = ay - 30;
  wp_rect(B, x0, yT, x1, ay, wp_planks(wp_P.gwood, s, 4, { ox: x0, lit: x => -(x - x0) / 52 * .25 }));
  for (const bx of [x0, x1 - 2]) wp_beam(B, bx + 1, ay, bx + 1, yT, 2, wp_P.oak, s + bx);
  wp_beam(B, x0, ay - 15, x1, ay - 15, 1.6, wp_P.oak, s + 3);
  wp_door(B, cx - 6, ay - 18, 12, 18, { R: wp_P.oak, s: s + 5, arch: 'flat' });
  // Satteldach mit Schindeln
  const rT = yT - 18;
  wp_poly(B, [[x0 - 5, yT + 2], [x1 + 5, yT + 2], [x1 - 6, rT], [x0 + 6, rT]], (x, y) => { const v = (y - rT) / (yT + 2 - rT); return wp_tone(wp_P.shingle, .62 - v * .3 + ((y - rT) % 3 === 0 ? -.14 : 0) + (wp_h(Math.floor(x / 3 + ((y - rT) / 3 | 0) * .5), (y - rT) / 3 | 0, s) - .5) * .2, x, y); });
  wp_rect(B, x0 + 6, rT - 1, x1 - 6, rT, wp_P.oak[2]);
  // Gerüst: zwei schräge Streben je Seite, Riegel, oben die Seilscheibe
  const top = ay - 98, wx = cx, wy = top + 9;
  for (const sx of [-1, 1]){
    wp_beam(B, cx + sx * 22, ay - 30, cx + sx * 5, top + 12, 2.4, wp_P.oak, s + 11 + sx);
    wp_beam(B, cx + sx * 30, ay - 22, cx + sx * 8, top + 30, 1.8, wp_P.oak, s + 21 + sx);
  }
  for (const yy of [ay - 52, ay - 74]){ const w = 5 + (yy - top) / (ay - 30 - top) * 17; wp_beam(B, cx - w, yy, cx + w, yy, 1.8, wp_P.oak, s + yy); }
  wp_beam(B, cx - 9, top + 12, cx + 9, top + 12, 2.2, wp_P.oak, s + 31);
  wp_ell(B, wx, wy, 9, 9, (x, y) => { const d = Math.hypot(x + .5 - wx, y + .5 - wy); if (d > 7.4) return wp_tone(wp_P.oak, .6 - (y - wy) / 9 * .3, x, y); if (d < 2) return wp_P.iron[3]; const a = Math.atan2(y + .5 - wy, x + .5 - wx); return Math.abs(Math.sin(a * 3)) < .22 ? wp_tone(wp_P.oak, .45, x, y) : 0; });
  // Seil hinab in die Kaue
  wp_line(B, wx + 8, wy, wx + 8, ay - 30, wp_P.straw[2]); wp_line(B, wx - 8, wy, wx - 8, ay - 30, wp_P.straw[1]);
  // Erzkübel und Haspel am Boden
  wp_ell(B, cx + 34, ay - 5, 5, 5, (x, y) => wp_tone(wp_P.wood, .5 - (x - cx - 34) * .06, x, y));
  wp_rect(B, cx + 30, ay - 10, cx + 38, ay - 9, wp_P.iron[2]);
  for (let k = 0; k < 4; k++) wp_set(B, cx + 31 + k * 2, ay - 11, wp_c(k & 1 ? '#c8d4e0' : '#7a7a80'));
  return wp_xRes(B, [[-27, -14, 27, 2], [29, -6, 39, 1]], [-30, -100, 30, -14]);
}
/* Feldschlange auf der Lafette: Bronzerohr, Holzwangen, zwei Räder; v 0 nach links, v 1 nach rechts */
function wp_kKanone(s, v){
  const B = wp_img(60, 34, 30), cx = B.ax, ay = B.ay, d = v ? 1 : -1;
  wp_groundShadow(B, cx + 3, ay + 1, 26, 3);
  // Lafettenschwanz am Boden
  wp_beam(B, cx - d * 24, ay - 1, cx + d * 2, ay - 9, 2.6, wp_P.oak, s + 1);
  // Rohr: von der Lafette nach vorn, leicht erhoben
  const bx0 = cx - d * 10, by0 = ay - 12, bx1 = cx + d * 24, by1 = ay - 16;
  wp_seg(B, bx0, by0, bx1, by1, 3.4, (x, y, t, q) => wp_tone(wp_P.gold, .55 - q * .35 + (t > .92 ? -.25 : 0) + (Math.abs(t - .3) < .03 || Math.abs(t - .7) < .03 ? .2 : 0), x, y));
  wp_ell(B, bx0, by0, 3.6, 3.6, (x, y) => wp_tone(wp_P.gold, .45 - (y - by0) * .1, x, y));
  wp_ell(B, bx1, by1, 2.2, 2.6, () => wp_P.dark[0]);
  // Rad mit Speichen
  const wx = cx + d * 2, wy = ay - 8, r = 8;
  wp_ell(B, wx, wy, r, r, (x, y) => { const dd = Math.hypot(x + .5 - wx, y + .5 - wy); if (dd > r - 2) return wp_tone(wp_P.oak, .55 - (y - wy) / r * .3, x, y); if (dd < 1.6) return wp_P.iron[3]; const a = Math.atan2(y + .5 - wy, x + .5 - wx); return Math.abs(Math.sin(a * 3)) < .25 ? wp_tone(wp_P.oak, .4, x, y) : 0; });
  wp_ell(B, wx, wy, r, r, (x, y) => Math.hypot(x + .5 - wx, y + .5 - wy) > r - .9 ? wp_P.iron[2] : 0);
  // Kugeln daneben
  for (const [kx, ky] of [[-d * 18, -2], [-d * 14, -2], [-d * 16, -5]]) wp_ell(B, cx + kx, ay + ky, 2, 2, (x, y) => wp_tone(wp_P.iron, .5 - (x - cx - kx) * .12 - (y - ay - ky) * .12, x, y));
  return wp_xRes(B, [[-14, -6, 14, 1]], null);
}
/* Schanzkorb: Flechtkorb voll Erde */
function wp_kSchanzkorb(s){
  const B = wp_img(24, 28, 26), cx = B.ax, ay = B.ay;
  wp_groundShadow(B, cx + 2, ay + 1, 11, 2.5);
  wp_rect(B, cx - 9, ay - 20, cx + 9, ay, (x, y) => { const u = (x - cx) / 9, row = (y + ((x >> 1) & 1)) >> 1, w = ((x >> 1) + row) & 1; return wp_tone(wp_P.straw, .42 - u * .3 + (w ? .1 : -.12) + (wp_h(x, y, s) - .5) * .1, x, y); });
  wp_ell(B, cx, ay - 20, 9, 3, (x, y) => wp_tone(wp_P.earth, .5 - (x - cx) * .03 + (wp_h(x, y, s + 1) - .5) * .3, x, y));
  for (let i = -8; i <= 8; i += 4) wp_line(B, cx + i, ay - 22, cx + i, ay, (x, y) => wp_tone(wp_P.wood, .3, x, y));
  return wp_xRes(B, [[-9, -6, 9, 1]], null);
}
/* Felsklippe: hohe, kantige Felsnadeln aus geschichtetem Sandstein (Hochgebirge, Schlucht) */
function wp_kKlippe(s, v){
  const B = wp_img(92, 116, 110), cx = B.ax, ay = B.ay, R = rng(s + v * 31);
  wp_groundShadow(B, cx + 8, ay + 1, 42, 6);
  const spires = [], n = 2 + (R() * 3 | 0);
  for (let i = 0; i < n; i++) spires.push({ x: cx - 26 + (n > 1 ? i * (52 / (n - 1)) : 26) + (R() - .5) * 10, h: 44 + R() * 58, w: 13 + R() * 9, flat: R() < .45, sd: s + i * 97 });
  spires.sort((a, b) => b.h - a.h);
  for (const sp of spires){
    const top = ay - sp.h, N = 9, L = [], Rt = [];
    for (let k = 0; k <= N; k++){
      const t = k / N, y = ay - t * sp.h, step = (wp_h(k, 1, sp.sd) - .5) * .5, w = sp.w * (1 - Math.pow(t, 1.25) * (sp.flat ? .62 : .9)) * (1 + step * (k > 0 && k < N ? 1 : 0));
      L.push([sp.x - w + (wp_h(k, 2, sp.sd) - .5) * 4, y]); Rt.push([sp.x + w + (wp_h(k, 3, sp.sd) - .5) * 4, y]);
    }
    if (sp.flat){ const tl = L[N], tr = Rt[N]; L[N] = [tl[0], tl[1] + 2]; Rt[N] = [tr[0], tr[1] + (wp_h(9, 4, sp.sd) * 5 | 0)]; }
    const pts = L.concat(Rt.reverse());
    const ridge = y => sp.x + (wp_vn(y * .08, 3, sp.sd) - .5) * sp.w * .7;   // Grat zwischen Licht- und Schattenseite
    wp_poly(B, pts, (x, y) => {
      const lit = x < ridge(y), band = Math.floor((y + wp_vn(x * .09, 0, sp.sd) * 5) / 6), f = wp_vn(x * .2, y * .12, sp.sd + 7);
      let t = (lit ? .64 : .36) + (band & 1 ? -.05 : .04) + (f - .5) * .22 - (y - top) / sp.h * .06;
      if ((y + 1) % 6 === 0 && wp_h(x >> 2, band, sp.sd) < .6) t -= .16;   // Schichtfugen
      if (Math.abs(x - ridge(y)) < .8) t += lit ? .1 : -.08;
      return wp_tone(wp_P.grey, t, x, y);
    });
    for (let i = 0; i < 3; i++) wp_crack(B, Math.round(sp.x + (R() - .5) * sp.w), Math.round(top + 8 + R() * sp.h * .6), 12, sp.sd + i, (x, y) => wp_op(B, x, y));
  }
  wp_shade(B, cx - 46, ay - 6, cx + 46, ay, .25);
  for (let i = 0; i < 26; i++){ const x = cx - 40 + R() * 80, y = ay - 60 + R() * 56; if (wp_op(B, x, y) && !wp_op(B, x, y - 2)) wp_tint(B, x, y, wp_P.moss[2], .7); }
  for (let i = 0; i < 5; i++) wp_grass(B, cx - 36 + i * 18, ay - 1, 4, s + i);
  return wp_xRes(B, [[-36, -16, 36, 2]], [-42, -110, 42, -14]);
}
/* ============ Ostlande (Version 26): Kiefer, Wacholder, Schlosskirche, Schöner Brunnen, Fuggereihaus, Perlachturm, Bienenstand, Frauenkirche ============ */
/* ---------- Waldkiefer: hoher Stamm, oben fuchsrote Spiegelrinde, flache Nadelballen ---------- */
function wp_tKiefer(s){
  const B = wp_img(60, 118, 115), R = rng(s), ax = B.ax, ay = B.ay, L = wp_LEAF.kiefer;
  const lean = (R() - .5) * 8, top = 10 + R() * 6, tx = ax + lean;
  wp_groundShadow(B, ax + 6, ay, 22, 4.5);
  const fox = wp_rmp(['#2a140c', '#46200f', '#663014', '#86421a', '#a45624', '#bc6c32', '#cc8444']);
  const bark = (x, y, t, q, nx) => {
    const up = clamp((ay - 30 - y) / 26, 0, 1), side = q * (nx >= 0 ? 1 : -1);
    if (wp_h(x >> 1, y >> 1, s) < up * .9) return wp_tone(fox, .62 - side * .3 + (wp_h(x, y, s + 3) - .5) * .2, x, y);   // Spiegelrinde
    const f = wp_vn(x * .7, y * .22, s); let v = .46 - side * .3; if (Math.abs(f - .5) < .09) v -= .3; else if (f > .7) v += .12;
    return wp_tone(wp_P.bark, v, x, y);
  };
  wp_limb(B, ax, ay + 1, ax + lean * .4, ay - 40, tx, top + 22, 4.6, 2.2, bark);
  wp_limb(B, ax - 1, ay - 2, ax - 4, ay, ax - 6, ay + 1, 2.4, 1, bark); wp_limb(B, ax + 1, ay - 2, ax + 4, ay, ax + 6, ay + 1, 2.4, 1, bark);
  // Äste zu den Nadelballen, dann die Ballen (flach, unregelmäßig), unten ein toter Aststummel
  const clumps = [];
  const n = 4 + (R() * 3 | 0);
  for (let i = 0; i < n; i++){
    const f = i / (n - 1), side = i === 0 ? 0 : (i & 1 ? -1 : 1), y = top + 6 + f * 38 + (R() - .5) * 4;
    const x = tx + side * (5 + f * 10 + R() * 5), rx = 9 + (1 - Math.abs(f - .45)) * 6 + R() * 3, ry = 4.2 + R() * 1.6;
    clumps.push([x, y, rx, ry]);
    if (side) wp_limb(B, tx - lean * f * .2, y + 10, tx + side * 3, y + 6, x - side * 2, y + 2, 1.8, 1, bark);
  }
  wp_limb(B, tx - lean * .3, ay - 36, tx - 8, ay - 40, tx - 12, ay - 41, 1.4, .7, bark);
  for (const c of clumps) wp_crownCore(B, c[0], c[1], c[2], c[3], L, s, null);
  wp_crown(B, { cx: tx, cy: top + 26, rx: 24, ry: 26, lobes: clumps, L, s, n: 70, r0: 2.2, r1: 3.8, sq: .55, base: .44, ever: true });
  // Zapfen
  for (let i = 0; i < 5; i++){ const c = clumps[R() * clumps.length | 0], X = Math.round(c[0] + (R() - .5) * c[2]), Y = Math.round(c[1] + c[3] - 1); if (!wp_op(B, X, Y)) continue; wp_set(B, X, Y, wp_P.sbark[4]); wp_set(B, X, Y + 1, wp_P.sbark[2]); }
  wp_treeOut(B);
  return wp_treeRes(B, [[-5, -7, 5, 2]], [tx - 24, top, tx + 24, top + 50]);
}
/* ---------- Wacholder: schlanke Säule, blaugrün, mit Beeren ---------- */
function wp_tWacholder(s){
  const B = wp_img(22, 42, 40), R = rng(s), ax = B.ax, ay = B.ay, L = wp_LEAF.wacholder;
  const h = 26 + R() * 10, w = 6 + R() * 2, top = ay - h;
  wp_groundShadow(B, ax + 3, ay, 9, 2.5);
  for (let y = Math.floor(top); y <= ay; y++){
    const f = (y - top) / h, half = w * Math.sin(Math.min(1, f * 1.15) * Math.PI * .5) * (f > .9 ? 1 - (f - .9) * 3 : 1) + (wp_h(0, y >> 1, s) - .5) * 1.8;
    for (let x = Math.floor(ax - half - 1); x <= Math.ceil(ax + half + 1); x++){
      const dx = (x + .5 - ax) / Math.max(1, half); if (Math.abs(dx) > 1) continue;
      let t = .5 - dx * .3 + (wp_vn(x * .9, y * .6, s) - .5) * .4;
      if (wp_h(x, y, s + 2) > .9) t += .2;
      if (f > .95) t -= .2;
      wp_set(B, x, y, wp_tq(L, t, x, y, .5));
    }
  }
  for (let i = 0; i < 6; i++){ const x = Math.round(ax + (R() - .5) * w * 1.4), y = Math.round(top + 6 + R() * (h - 10)); if (wp_op(B, x, y)) wp_set(B, x, y, wp_c(i & 1 ? '#3a4a78' : '#5a6aa0')); }
  wp_treeOut(B);
  return { img: wp_canvas(B), ax, ay, foot: [[-4, -4, 4, 1]], occl: null, extra: {} };
}

/* ---------- Schlosskirche zu Schwanstedt: verputztes Langhaus, runder Schlossturm mit Kegeldach, an der Tür die Thesen ---------- */
function wp_bSchlosskirche(s, v){
  const W = 184, B = wp_img(W, 250, 246), R = rng(s), ax = B.ax, ay = B.ay;
  const PL = wp_P.plaster, ST = wp_P.stone;
  const wallFn = wp_plaster({ R: PL, s: s + 1, flake: .4, base: ay, under: wp_rubble({ R: wp_P.grey, s: s + 2, cw: 5, chh: 3 }) });
  wp_shadowPoly(B, [[4, ay - 1], [W - 2, ay - 1], [W - 2, ay + 3], [6, ay + 3]]);
  /* ---- runder Turm links ---- */
  const tr = 22, tcx = ax - 64, tyB = ay - 10, Ht = 140, tyT = tyB - Ht;
  for (let y = tyT; y < tyB + 6; y++) for (let x = tcx - tr; x <= tcx + tr; x++){
    const nx = (x + .5 - tcx) / tr; if (Math.abs(nx) > 1) continue;
    const bulge = Math.sqrt(1 - nx * nx) * 5, yy = y - bulge;   // Steinlagen folgen der Rundung
    if (yy > tyB + 4) continue;
    const row = Math.floor((yy - tyT) / 5), u = Math.asin(nx) * tr * 1.5, joint = ((yy - tyT) % 5) < 1 || (((u + row * 4) % 11) + 11) % 11 < 1;
    let t = .62 - nx * .38 + (wp_h(row, Math.floor((u + row * 4) / 11), s) - .5) * .16 - (Math.abs(nx) > .9 ? .12 : 0);
    if (joint) t -= .22;
    wp_set(B, x, y, wp_tone(ST, t, x, y));
  }
  for (const yy of [tyB - 46, tyB - 96]) for (let x = tcx - tr - 1; x <= tcx + tr + 1; x++){ const nx = (x + .5 - tcx) / (tr + 1); if (Math.abs(nx) > 1) continue; const y = Math.round(yy - Math.sqrt(1 - nx * nx) * 5); wp_set(B, x, y, wp_tone(ST, .85 - nx * .3, x, y)); wp_set(B, x, y + 1, wp_tone(ST, .3, x, y)); }
  wp_gwin(B, tcx - 3, tyB - 40, 6, 14, { frame: ST, lights: 1, s, dark: true });
  wp_gwin(B, tcx - 4, tyB - 88, 8, 18, { frame: ST, lights: 1, s: s + 1, streak: 6 });
  wp_clock(B, tcx, tyB - 114, 7, s);
  for (const dx of [-12, 6]) wp_louvre(B, tcx + dx, tyB - 134, 6, 14, ST);
  // Kegeldach mit Schiefer, Laterne, Knauf
  const sp = wp_pyramid(B, -64, 10, Ht + 10, tr + 3, 58, 16, (u, vv, x, y, e) => wp_slateAt(wp_P.slate, u, vv, x, y, s + 9, e + .05));
  wp_finial(B, Math.round(sp.ax), Math.round(sp.ay), false);
  /* ---- Langhaus (Hallenkirche) ---- */
  const nX0 = -42, nX1 = 86, Hn = 60, nx0 = ax + nX0, nx1 = ax + nX1, nyT = ay - Hn;
  wp_wall(B, nx0, nx1, nyT, ay, wallFn);
  for (let x = nx0; x < nx1; x++){ wp_set(B, x, ay - 7, wp_tone(ST, .8, x, 0)); wp_set(B, x, ay - 6, wp_tone(ST, .45, x, 0)); }
  wp_cornice(B, nx0, nx1, nyT, ST, 3);
  const bays = [[nx0 + 4, nx0 + 34], [nx0 + 38, nx0 + 70], [nx0 + 74, nx0 + 100], [nx0 + 104, nx1 - 4]];
  bays.forEach(([a, b], i) => {
    const wcx = Math.round((a + b) / 2);
    if (i === 1){
      // die Tür mit den Thesen: Spitzbogenportal, Holztür, darauf ein angeschlagenes Blatt
      const pw = 14, ph = 24, px = wcx - pw / 2, py = ay - 6 - ph;
      for (let k = 3; k >= 1; k--) wp_door(B, px - k, py - k, pw + 2 * k, ph + k, { arch: 'spitz', open: true });
      for (let k = 3; k >= 1; k--) for (let j = 0; j < ph + k; j++) for (let ii = 0; ii < 2 * k + pw; ii++){
        const x = px - k + ii, y = py - k + j; if (!wp_op(B, x, y)) continue;
        const c = wp_get(B, x, y); if (c === wp_P.dark[0] || c === wp_P.dark[1]) wp_set(B, x, y, wp_tone(ST, .3 + k * .15 + (ii < k + pw / 2 ? .1 : -.05), x, y));
      }
      wp_door(B, px, py, pw, ph, { R: wp_P.oak, s: s + 7, arch: 'spitz' });
      for (let j = 4; j < ph; j++) wp_set(B, px + (pw >> 1), py + j, wp_P.oak[0]);
      const qx = px + 2, qy = py + 8;
      wp_rect(B, qx, qy, qx + 5, qy + 8, (x, y) => wp_tone(wp_P.cloth, .9 - (y - qy) * .02 + ((y - qy) % 2 === 1 && x > qx && x < qx + 4 ? -.25 : 0), x, y));
      wp_set(B, qx + 2, qy, wp_P.iron[1]); wp_set(B, qx + 5, qy + 8, wp_tone(wp_P.cloth, .6, 0, 0));
      wp_gwin(B, wcx - 5, nyT + 8, 10, 14, { frame: ST, lights: 2, s: s + 11, streak: 5 });
    } else wp_gwin(B, wcx - 5, nyT + 8, 11, 36, { frame: ST, lights: 2, s: s + 13 + i, streak: 9 });
  });
  for (const bx of [nx0 + 34, nx0 + 70, nx0 + 100]) wp_buttress(B, bx, ay + 2, nyT + 10, 5, { fn: wallFn, R: ST, steps: 2, fiale: 0 });
  for (let i = 0; i < 4; i++) wp_crack(B, nx0 + 8 + R() * 110, nyT + 6 + R() * 20, 8 + R() * 10, s + i);
  const rf = wp_roofEaves(B, { X0: nX0, X1: nX1, D: 50, Hw: Hn, Hr: 50, ov: 2, ovs: 1, endL: 'gable', endR: 'hip', mat: 'slate', s: s + 41 });
  wp_shade(B, nx0, rf.yE, nx1, rf.yE + 4, .4, 4);
  for (const gx of [nx0 + 30, nx0 + 70, nx0 + 104]) wp_vent(B, gx, Math.round(rf.yE - 30), wp_P.slate);
  for (let i = 0; i < 10; i++) wp_grass(B, 6 + R() * 170, ay + 1, 3, s + i, wp_LEAF.busch);
  return wp_res(B, [[-86, -84, 88, 2]], [-90, -236, 90, -8], { smoke: [], door: { x: nX0 + 51 } });
}

/* ---------- Schöner Brunnen in Burgfelden: achteckiges Becken mit Gitter, darüber eine bunte gotische Turmspitze ---------- */
function wp_kSchoenerBrunnen(s){
  const B = wp_img(64, 136, 132), cx = B.ax, ay = B.ay, R = rng(s), ST = wp_P.stone;
  wp_groundShadow(B, cx + 8, ay + 1, 30, 5);
  // Becken
  const bw = 26, bt = ay - 12;
  wp_ell(B, cx, bt + 2, bw, 7, (x, y) => wp_tone(wp_P.glass, .35 + (wp_h(x, y >> 1, s) > .8 ? .3 : 0) - (y - bt) * .05, x, y));
  wp_rect(B, cx - bw, bt + 2, cx + bw, ay, (x, y) => wp_tone(ST, .62 - (x - cx) / bw * .3 + ((x - cx + 64) % 8 === 0 ? -.2 : 0) - (y > ay - 3 ? .15 : 0), x, y));
  wp_ell(B, cx, bt + 2, bw, 7, (x, y) => { const d = ((x + .5 - cx) / bw) ** 2 + ((y + .5 - bt - 2) / 7) ** 2; return d > .78 ? wp_tone(ST, .8 - (x - cx) / bw * .3, x, y) : 0; });
  // Gitter vor dem Becken
  for (let x = cx - bw - 2; x <= cx + bw + 2; x += 3) wp_line(B, x, ay - 14, x, ay + 1, wp_P.iron[x % 6 ? 2 : 3]);
  for (const yy of [ay - 14, ay - 8, ay]) wp_line(B, cx - bw - 2, yy, cx + bw + 2, yy, wp_P.iron[2]);
  for (let x = cx - bw - 2; x <= cx + bw + 2; x += 6) wp_set(B, x, ay - 16, wp_P.gold[4]);
  // Turm in drei Geschossen mit Figuren, Fialen und Maßwerk, nach oben spitz
  const cols = [wp_P.gold, wp_P.red2, wp_P.blue2, wp_P.gold];
  const tiers = [[bt - 2, 15, 22], [bt - 24, 11, 22], [bt - 46, 7, 22], [bt - 68, 4, 20]];
  tiers.forEach(([yb, hw, hh], k) => {
    for (let y = yb - hh; y < yb; y++) for (let x = cx - hw; x <= cx + hw; x++){
      const nx = (x + .5 - cx) / hw, f = (yb - y) / hh;
      let t = .62 - nx * .32;
      const ph = ((x - cx + 40) % 5);
      const arch = y < yb - 3 && y > yb - hh + 5 && (ph === 2) ;
      if (arch) { wp_set(B, x, y, wp_P.dark[1]); continue; }
      const C = (y - (yb - hh)) % 7 < 2 ? cols[k] : ST;
      wp_set(B, x, y, wp_tone(C, t + (f > .9 ? .1 : 0), x, y));
    }
    // Figuren in den Nischen
    for (let i = -1; i <= 1; i++){ const fx = Math.round(cx + i * hw * .55), fy = yb - 6; if (hw < 6 && i) continue; wp_rect(B, fx - 1, fy - 7, fx + 1, fy, (x, y) => wp_tone(wp_P.flesh, .6 - (x - fx) * .2, x, y)); wp_set(B, fx, fy - 8, wp_tone(wp_P.flesh, .8, 0, 0)); wp_set(B, fx - 1, fy - 4, cols[(k + i + 3) % 4][3]); wp_set(B, fx + 1, fy - 3, cols[(k + i + 3) % 4][2]); }
    // Fialen an den Ecken
    for (const sx of [-1, 1]){ const fx = cx + sx * (hw + 1); for (let j = 0; j < hh + 6; j++){ const y = yb - j; wp_set(B, fx, y, wp_tone(ST, sx < 0 ? .75 : .4, fx, y)); if (j > hh) wp_set(B, fx, y, wp_P.gold[sx < 0 ? 5 : 3]); } }
  });
  // Spitze mit Knauf
  for (let j = 0; j < 22; j++){ const y = bt - 88 - j, hw2 = Math.max(0, 3 - j * .15); for (let x = Math.round(cx - hw2); x <= Math.round(cx + hw2); x++) wp_set(B, x, y, wp_tone(j % 5 < 2 ? wp_P.gold : ST, .7 - (x - cx) * .2, x, y)); }
  wp_ell(B, cx, bt - 112, 1.6, 1.6, () => wp_P.gold[5]);
  return wp_res(B, [[-24, -14, 24, 2]], [-20, -128, 20, -16]);
}

/* ---------- Fuggereihaus: zwei Wohnungen übereinander, jede mit eigener Tür, ockergelb mit grünen Läden ---------- */
function wp_bFuggerhaus(s, v){
  const B = wp_img(72, 86, 82), R = rng(s), ax = B.ax, ay = B.ay;
  const X0 = -32, X1 = 32, D = 22, Hw = 32, x0 = ax + X0, x1 = ax + X1, yT = ay - Hw;
  wp_shadowPoly(B, [[x0 + 3, ay - 1], [x1 + 8, ay - 1], [x1 + 8, ay + 2], [x0 + 3, ay + 2]]);
  const wallFn = wp_plaster({ R: wp_P.ochre, s: s + 1, flake: .2, base: ay, under: wp_rubble({ R: wp_P.grey, s: s + 2, cw: 5, chh: 3 }) });
  wp_wall(B, x0, x1, yT, ay, wallFn);
  wp_cornice(B, x0, x1, yT, wp_P.plaster, 1);
  for (let x = x0; x < x1; x++) wp_set(B, x, ay - Hw / 2, wp_tone(wp_P.plaster, .75, x, 0));   // Gurtgesims zwischen den Geschossen
  const GR = wp_rmp(['#14241a', '#1e3426', '#2a4632', '#38583e', '#466a4a']);
  // zwei Haustüren (Erdgeschoss links, Treppe zum Obergeschoss rechts), Fenster mit grünen Läden
  for (const [dx, k] of [[-22, 0], [12, 1]]){
    wp_door(B, ax + dx, ay - 13, 8, 13, { R: wp_P.oak, s: s + 3 + k, arch: 'flat' });
    wp_rect(B, ax + dx - 1, ay - 15, ax + dx + 9, ay - 13, wp_tone(wp_P.plaster, .8, 0, 0));
    wp_set(B, ax + dx + 3, ay - 17, wp_P.iron[3]); wp_set(B, ax + dx + 4, ay - 17, wp_P.iron[2]);   // Klingelzug
  }
  for (const wx of [-8, 0]) { wp_window(B, ax + wx - 4, ay - 12, 6, 7, { frame: wp_P.plaster, s: s + wx, kreuz: true }); }
  for (const wx of [-25, -11, 5, 19]){
    wp_window(B, ax + wx, yT + 4, 7, 8, { frame: wp_P.plaster, s: s + wx + 9, kreuz: true });
    for (const sd of [-3, 8]) wp_rect(B, ax + wx + sd, yT + 4, ax + wx + sd + 2, yT + 12, (x, y) => wp_tone(GR, .55 - (y - yT) * .02 + ((y - yT) % 3 === 0 ? -.2 : 0), x, y));
  }
  const rf = wp_roofEaves(B, { X0, X1, D, Hw, Hr: 20, ov: 2, ovs: 2, endL: 'gable', endR: 'gable', mat: 'tile', s: s + 21, moss: .06 });
  wp_shade(B, x0, rf.yE, x1, rf.yE + 3, .4, 3);
  wp_vent(B, ax - 10, Math.round(rf.yE - 11), wp_P.tile);
  const ch = wp_chimney(B, ax + 14, Math.round(rf.yE - 13), 5, 9, s + 30);
  for (let i = 0; i < 4; i++) wp_grass(B, x0 + 2 + R() * 60, ay + 1, 2, s + i, wp_LEAF.busch);
  return wp_res(B, [[-33, -26, 33, 2]], [-34, -80, 34, -8], { smoke: [{ x: Math.round(ch.x - ax), y: Math.round(ch.y - ay) }] });
}

/* ---------- Perlachturm in Goldbrunn: schlanker Stadtturm mit Uhr, Glockenstube und Spitzhelm ---------- */
function wp_bPerlach(s){
  const B = wp_img(60, 200, 196), R = rng(s), ax = B.ax, ay = B.ay, ST = wp_P.stone;
  const x0 = ax - 17, x1 = ax + 17, top = ay - 140;
  wp_groundShadow(B, ax + 10, ay + 1, 26, 5);
  const wallFn = wp_plaster({ R: wp_P.plaster, s: s + 1, flake: .3, base: ay, lit: x => -(x - x0) / 34 * .2 });
  wp_wall(B, x0, x1, top, ay, wallFn);
  for (const ex of [x0, x1 - 4]) for (let y = top; y < ay; y += 4){ const w2 = ((y - top) / 4) & 1 ? 3 : 4; wp_rect(B, ex === x0 ? ex : x1 - w2, y, (ex === x0 ? ex : x1 - w2) + w2, y + 4, (x, yy) => wp_tone(ST, (ex === x0 ? .75 : .4) - (yy === y + 3 ? .2 : 0), x, yy)); }
  for (const yy of [ay - 44, ay - 88, top + 18]) wp_cornice(B, x0 - 1, x1 + 1, yy, ST, 2);
  wp_door(B, ax - 6, ay - 18, 12, 18, { R: wp_P.oak, s: s + 3, arch: 'round', frame: ST });
  wp_gwin(B, ax - 3, ay - 74, 6, 16, { frame: ST, lights: 1, s, streak: 6 });
  wp_clock(B, ax, top + 34, 9, s);
  for (const dx of [-9, 3]) wp_louvre(B, ax + dx, top + 4, 6, 12, ST);
  const sp = wp_pyramid(B, 0, 12, 140, 20, 50, 4, (u, vv, x, y, e) => wp_tileAt(wp_P.tile, u, vv, x, y, s + 9, e), { rot: Math.PI / 4 });
  wp_finial(B, Math.round(sp.ax), Math.round(sp.ay), true);
  for (let i = 0; i < 3; i++) wp_crack(B, x0 + 6 + R() * 22, ay - 60 - R() * 40, 8, s + i);
  return wp_res(B, [[-18, -24, 18, 2]], [-20, -190, 20, -20]);
}

/* ---------- Bienenstand der Zeidler: Bank unter einem Schindeldach mit Strohkörben ---------- */
function wp_kBienenstand(s){
  const B = wp_img(56, 44, 40), cx = B.ax, ay = B.ay, R = rng(s);
  wp_groundShadow(B, cx + 3, ay + 1, 26, 3);
  for (const px of [cx - 24, cx + 22]) wp_beam(B, px, ay + 1, px, ay - 26, 2, wp_P.gwood, s + px);
  wp_rect(B, cx - 25, ay - 10, cx + 25, ay - 8, wp_planks(wp_P.wood, s, 3, { ox: cx - 25 }));
  for (let i = 0; i < 4; i++){
    const kx = cx - 18 + i * 12, ky = ay - 10;
    wp_ell(B, kx, ky - 6, 5.2, 6.4, (x, y) => y > ky ? 0 : wp_tone(wp_P.straw, .62 - (x + .5 - kx) / 5 * .3 + ((y - ky) % 2 === 0 ? -.16 : 0), x, y));
    wp_rect(B, kx - 1, ky - 2, kx + 1, ky, wp_P.dark[0]);
  }
  for (let j = 0; j < 6; j++) for (let x = cx - 28 + j; x <= cx + 28 - j; x++){ const y = ay - 32 + j; wp_set(B, x, y, wp_tone(wp_P.shingle, .6 - j * .06 + ((x + j) % 4 === 0 ? -.15 : 0), x, y)); }
  for (let k = 0; k < 8; k++){ const bx = Math.round(cx + (R() - .5) * 44), by = Math.round(ay - 14 - R() * 16); wp_set(B, bx, by, wp_c('#d8b030')); wp_set(B, bx + 1, by, wp_c('#2a2010')); }   // Bienen
  return wp_res(B, [[-26, -10, 26, 2]], null);
}

/* ---------- Frauenkirche am Burgfeldener Hauptmarkt: Staffelgiebel, Vorhalle, darüber das Chörlein mit der Uhr (Männleinlaufen) ---------- */
function wp_bFrauenkirche(s){
  const W = 120, B = wp_img(W, 200, 196), R = rng(s), ax = B.ax, ay = B.ay;
  const RS = wp_P.red;
  const mason = wp_ashlar({ R: RS, s, ch: 4, bmin: 6, bmax: 13, per: 512, stain: .6 });
  wp_shadowPoly(B, [[6, ay - 1], [W - 2, ay - 1], [W - 2, ay + 3], [8, ay + 3]]);
  // Schiff hinter der Fassade: Satteldach nach hinten
  const fx0 = ax - 46, fx1 = ax + 46, Hf = 70, fyT = ay - Hf;
  wp_roofGable(B, { X0: -46, X1: 46, D: 60, Hw: Hf, Hr: 50, ovf: 0, ovb: 2, ovs: 1, mat: 'tile', s: s + 50, moss: .05 });
  wp_wall(B, fx0, fx1, fyT, ay, mason);
  // Staffelgiebel mit Fialen und Blendmaßwerk
  const gH = 64, steps = 5;
  for (let k = 0; k < steps; k++){
    const sw = 46 - k * 9, y0 = fyT - (k + 1) * gH / steps, y1 = fyT - k * gH / steps;
    for (let y = Math.floor(y0); y < y1; y++) for (let x = ax - sw; x <= ax + sw; x++){
      const ph = ((x - ax + 64) % 6);
      let t = .58 - (x - ax) / 46 * .25 + (y < y0 + 2 ? .2 : 0);
      if (ph === 3 && y > y0 + 4 && y < y1 - 2) t -= .35;
      wp_set(B, x, y, wp_tone(RS, t, x, y));
    }
    for (const sx of [-1, 1]){ const px = ax + sx * sw; for (let j = 0; j < 8; j++) wp_set(B, px, Math.round(y0) - j, wp_tone(RS, sx < 0 ? .8 : .45, px, 0)); wp_set(B, px, Math.round(y0) - 9, wp_P.gold[4]); }
  }
  // Vorhalle mit Portal und Figuren
  const vx0 = ax - 26, vx1 = ax + 26, vyT = ay - 34;
  wp_rect(B, vx0, vyT, vx1, ay, (x, y) => wp_tone(RS, .62 - (x - ax) / 26 * .2 - (y > ay - 3 ? .15 : 0), x, y));
  for (let k = 3; k >= 1; k--) wp_door(B, ax - 9 - k, ay - 26 - k, 18 + 2 * k, 26 + k, { arch: 'spitz', open: true });
  wp_door(B, ax - 9, ay - 26, 18, 26, { R: wp_P.oak, s: s + 7, arch: 'spitz' });
  for (const sx of [-20, 16]){ wp_rect(B, ax + sx, ay - 22, ax + sx + 4, ay - 8, (x, y) => wp_tone(wp_P.stone, .7 - (x - ax - sx) * .1, x, y)); wp_set(B, ax + sx + 2, ay - 24, wp_tone(wp_P.flesh, .7, 0, 0)); }
  for (let x = vx0 - 1; x <= vx1 + 1; x++) for (let j = 0; j < 4; j++) wp_set(B, x, vyT - j, wp_tone(RS, .7 - j * .1 - (x - ax) / 26 * .2 + ((x + j) % 6 === 0 ? -.2 : 0), x, 0));
  // Chörlein mit Uhr über der Vorhalle, darüber das Männleinlaufen
  const cx = ax, cy = vyT - 26;
  wp_rect(B, cx - 12, cy - 10, cx + 12, vyT - 4, (x, y) => wp_tone(RS, .66 - (x - cx) / 12 * .28, x, y));
  for (let k = 0; k < 6; k++) for (let x = cx - 12 + k; x <= cx + 12 - k; x++) wp_set(B, x, cy - 10 - k, wp_tone(wp_P.slate, .55 - (x - cx) * .02, x, 0));
  wp_clock(B, cx, cy + 2, 7, s);
  for (let i = -2; i <= 2; i++){ const px = cx + i * 4, py = cy - 7; wp_set(B, px, py, wp_P.gold[4]); wp_set(B, px, py + 1, [wp_P.red2, wp_P.blue2, wp_P.gold][(i + 3) % 3][3]); }
  // Fenster seitlich, Rosette
  for (const sx of [-38, 30]) wp_gwin(B, ax + sx, fyT + 10, 8, 26, { frame: RS, lights: 2, s: s + sx, streak: 6 });
  wp_ell(B, ax, fyT - 18, 8, 8, (x, y) => { const d = Math.hypot(x + .5 - ax, y + .5 - fyT + 18); return d > 7 ? wp_tone(RS, .8, x, y) : wp_tone(wp_P.glass, .3 + (Math.abs(Math.sin(Math.atan2(y - fyT + 18, x - ax) * 4)) < .3 ? .3 : 0), x, y); });
  for (let i = 0; i < 6; i++) wp_grass(B, 8 + R() * 104, ay + 1, 3, s + i, wp_LEAF.busch);
  return wp_res(B, [[-48, -50, 48, 2]], [-50, -180, 50, -8], {});
}

const wp_K = {
  apfelbaum: [(s, v) => wp_tApfel(s, v), 6], eiche: [(s, v) => wp_tEiche(s, v), 5], buche: [(s, v) => wp_tBuche(s, v), 5], fichte: [(s, v) => wp_tFichte(s, v), 6],
  birke: [(s, v) => wp_tBirke(s, v), 5], weide: [(s, v) => wp_tWeide(s, v), 4], toter_baum: [(s, v) => wp_tTot(s, v), 5], busch: [(s, v) => wp_tBusch(s, v), 6],
  fachwerkhaus: [(s, v) => wp_bHaus(s, v), 4], fachwerkhaus_ruine: [(s, v) => wp_bRuine(s, v), 3], stadthaus: [(s, v) => wp_bStadthaus(s, v), 4],
  kirche: [(s, v) => wp_bKirche(s, v), 1], kapelle: [(s, v) => wp_bKapelle(s, v), 2], kloster: [(s, v) => wp_bKloster(s, v), 1], muehle: [(s, v) => wp_bMuehle(s, v), 1],
  burg_mauer: [(s, v) => wp_cMauer(s, v), 3], burg_turm: [(s, v) => wp_cTurm(s, v), 2], burg_tor: [(s, v) => wp_cTor(s, v), 1], bergfried: [(s, v) => wp_cBergfried(s, v), 1],
  stadt_mauer: [(s, v) => wp_sMauer(s, v), 3], stadt_turm: [(s, v) => wp_sTurm(s, v), 2], stadt_tor: [(s, v) => wp_sTor(s, v), 1],
  ruine_mauer: [(s, v) => wp_rMauer(s, v), 3], ruine_turm: [(s, v) => wp_rTurm(s, v), 2],
  brunnen: [(s, v) => wp_kBrunnen(s, v), 2], galgen: [(s, v) => wp_kGalgen(s, v), 2], pranger: [(s, v) => wp_kPranger(s, v), 2], zelt: [(s, v) => wp_kZelt(s, v), 4],
  karren: [(s, v) => wp_kKarren(s, v), 3], heuhaufen: [(s, v) => wp_kHeu(s, v), 4], vogelscheuche: [(s, v) => wp_kScheuche(s, v), 3],
  grabstein: [(s, v) => wp_kGrabstein(s, v), 6], grabkreuz: [(s, v) => wp_kGrabkreuz(s, v), 6], wegkreuz: [(s, v) => wp_kWegkreuz(s, v), 2],
  fels: [(s, v) => wp_kFels(s, v), 5], stein: [(s, v) => wp_kStein(s, v), 6], feuerschale: [(s, v) => wp_kFeuerschale(s, v), 2], lagerfeuer: [(s, v) => wp_kLagerfeuer(s, v), 3],
  zaun_h: [(s, v) => wp_kZaunH(s, v), 4], zaun_v: [(s, v) => wp_kZaunV(s, v), 3], spiesse: [(s, v) => wp_kSpiesse(s, v), 4], fass: [(s, v) => wp_kFass(s, v), 4],
  kisten: [(s, v) => wp_kKisten(s, v), 4], wegweiser: [(s, v) => wp_kWegweiser(s, v), 3], banner: [(s, v) => wp_kBanner(s, v), 2],
  marktstand: [(s, v) => wp_kMarktstand(s, v), 6], maibaum: [(s, v) => wp_kMaibaum(s), 1], schranke: [(s, v) => wp_kSchranke(s), 1], tribuene: [(s, v) => wp_kTribuene(s), 1],
  abgang: [(s, v) => wp_kAbgang(s, v), 2], saeule: [(s, v) => wp_kSaeule(s, v), 2], sarg: [(s, v) => wp_kSarg(s, v), 2], truhe: [(s, v) => wp_kTruhe(s, v), 2], becken: [(s, v) => wp_kBecken(s), 1], weinfass: [(s, v) => wp_kWeinfass(s, v), 1],
  stollen: [(s, v) => wp_kStollen(s), 1], hebel: [(s, v) => wp_kHebel(s, v), 2], gitter: [(s, v) => wp_kGitter(s, v), 2], lore: [(s, v) => wp_kLore(s, v), 2], erz: [(s, v) => wp_kErz(s, v), 2],
  festtisch: [(s, v) => wp_kFesttisch(s), 1], feuerholz: [(s, v) => wp_kFeuerholz(s), 1], erntekrone: [(s, v) => wp_kErntekrone(s), 1], laterne: [(s, v) => wp_kLaterne(s), 1], garbe: [(s, v) => wp_kGarbe(s), 1], christbaum: [(s, v) => wp_kChristbaum(s), 1],
  rad: [(s, v) => wp_kRad(s, v), 2], thron: [(s, v) => wp_kThron(s), 1], anker: [(s, v) => wp_kAnker(s), 1],
  kahn: [(s, v) => wp_kKahn(s, v), 4], kran: [(s, v) => wp_kKran(s), 1], netze: [(s, v) => wp_kNetze(s), 2], palisade: [(s, v) => wp_kPalisade(s, v), 3],
  rebzeile: [(s, v) => wp_kRebzeile(s, v), 3], dom: [(s, v) => wp_bDom(s, v), 1], gasthaus_anker: [(s, v) => wp_bStadthaus(s + 77, 0, 'anker'), 1],
  gasthaus_adler: [(s, v) => wp_bStadthaus(s + 31, 0, 'adler'), 1], gasthaus_krone: [(s, v) => wp_bHaus(s + 17, 1, 'krone'), 1], gasthaus_ochse: [(s, v) => wp_bHaus(s + 5, 3, 'ochse'), 1],
  // Bergland: Göpel, Kanone, Schanzkorb, Klippe, Gasthaus in Silberberg; im Hochgebirge liegt immer Schnee
  goepel: [(s, v) => wp_kGoepel(s), 1], kanone: [(s, v) => wp_kKanone(s, v), 2], schanzkorb: [(s, v) => wp_kSchanzkorb(s), 3], klippe: [(s, v) => wp_kKlippe(s, v), 4],
  gasthaus_kanne: [(s, v) => wp_bStadthaus(s + 53, 0, 'kanne'), 1],
  gasthaus_schwan: [(s, v) => wp_bStadthaus(s + 61, 0, 'schwan'), 1], gasthaus_gloecklein: [(s, v) => wp_bStadthaus(s + 67, 0, 'gloecklein'), 1], gasthaus_lamm: [(s, v) => wp_bStadthaus(s + 73, 0, 'lamm'), 1],
  schneefichte: [(s, v) => wp_tFichte(s, v), 6], schneefels: [(s, v) => wp_kFels(s, v), 5], schneeklippe: [(s, v) => wp_kKlippe(s, v), 4], schneestein: [(s, v) => wp_kStein(s), 6],
  // Ostlande
  kiefer: [(s, v) => wp_tKiefer(s), 6], wacholder: [(s, v) => wp_tWacholder(s), 4], schlosskirche: [(s, v) => wp_bSchlosskirche(s, v), 1], schoenerbrunnen: [(s, v) => wp_kSchoenerBrunnen(s), 1],
  fuggerhaus: [(s, v) => wp_bFuggerhaus(s, v), 3], perlach: [(s, v) => wp_bPerlach(s), 1], bienenstand: [(s, v) => wp_kBienenstand(s), 2], frauenkirche: [(s, v) => wp_bFrauenkirche(s), 1],
  lilienbanner: [(s, v) => wp_kLilien(s), 1], scheibe: [(s, v) => wp_kScheibe(s), 1],
  // Burgen der vier Häuser (Version 31)
  lilienbeet: [(s, v) => wp_kLilienbeet(s, v), 3]
};
for (const [key, fid] of [['adler', 'reich'], ['lilie', 'frankreich'], ['loewe', 'england'], ['turm', 'spanien']]) Object.assign(wp_K, {
  [key + '_mauer']: [(s, v) => wp_house(fid, () => wp_cMauer(s, v)), 3], [key + '_turm']: [(s, v) => wp_house(fid, () => wp_cTurm(s, v)), 2],
  [key + '_vturm']: [(s, v) => wp_house(fid, () => wp_cVTurm(s, v)), 2], [key + '_tor']: [(s, v) => wp_house(fid, () => wp_cTor(s)), 1],
  [key + '_bergfried']: [(s, v) => wp_house(fid, () => wp_cBergfried(s)), 1], [key + '_banner']: [(s, v) => wp_house(fid, () => wp_kBanner(s)), 2],
  [key + '_palas']: [(s, v) => wp_house(fid, () => wp_bStadthaus(s, v)), 4], [key + '_kapelle']: [(s, v) => wp_house(fid, () => wp_bKapelle(s, v)), 2]
});
const WP_KINDS = Object.keys(wp_K);
/* Bilder je Jahreszeit: Bäume in allen vier, alles andere im Sommer- und im Winterbild */
const SEA_TREE = { apfelbaum: 1, eiche: 1, buche: 1, birke: 1, weide: 1, busch: 1, fichte: 1, toter_baum: 1, rebzeile: 1 };
const SEA_SNOW = { schneefichte: 1, schneefels: 1, schneeklippe: 1, schneestein: 1 };   // Hochgebirge: das ganze Jahr verschneit
const seaKey = (kind, s) => SEA_SNOW[kind] ? 3 : SEA_TREE[kind] ? s : s === 3 ? 3 : 1;
const wp_CACHES = [new Map(), new Map(), new Map(), new Map()];
const wp_cacheOf = kind => wp_CACHES[seaKey(kind, wp_SEA)].get(kind);
/* makeProp(kind, seed) -> { img, ax, ay, foot, occl, extra, wins, v }; gleicher seed = gleiches Bild (v Spielart).
   img hat WS-fache Größe (Feinpixel), ax, ay, foot, occl und extra sind in Weltpixeln. */
/* Beim ersten Besuch werden alle Bilder gemalt und ihre Maße gemerkt (Fuß, Verdeckung, Fenster, Zubehör). Danach stehen die Maße
   sofort bereit, die Platzierung bleibt gleich, und die Bilder entstehen erst im Hintergrund oder kurz bevor man sie sieht. */
const PM_KEY = 'apfelritter_pm';
const PM = (() => { try { const o = JSON.parse(localStorage.getItem(PM_KEY) || 'null'); return o && o.h === SRC_HASH && SRC_HASH ? o.m : null; } catch(e){ return null; } })();
const PM_NEW = {}, PM_BLANK = new Map();
const pmBlank = (w, h) => { const k = w + 'x' + h; let c = PM_BLANK.get(k); if (!c){ c = canvasOf(w, h); PM_BLANK.set(k, c); } return c; };
function makeProp(kind, seed){
  const e = wp_K[kind];
  if (!e){ console.warn('makeProp: unbekannte Art', kind); return null; }
  const n = e[1], sv = Math.floor(Math.abs(+seed || 0) * 977) + Math.floor(Math.abs(+seed || 0));
  const v = Math.floor(wp_h(sv, 11, 4049) * n);
  const sk = seaKey(kind, wp_SEA), mk = sk + '|' + kind + '|' + v, done = wp_CACHES[sk].get(kind), m = PM && PM[mk];
  let p;
  if (m && !(done && done[v])) p = { img: pmBlank(m.w, m.h), ax: m.ax, ay: m.ay, foot: m.foot, occl: m.occl, extra: m.extra || {}, wins: m.wins, lz: true };
  else { p = wp_paintV(kind, v, wp_SEA); if (!m) PM_NEW[mk] = { w: p.img.width, h: p.img.height, ax: p.ax, ay: p.ay, foot: p.foot, occl: p.occl, extra: p.extra, wins: p.wins }; }
  const ex = {};
  for (const k in p.extra){ const val = p.extra[k]; ex[k] = Array.isArray(val) ? val.map(q => Object.assign({}, q)) : (val && typeof val === 'object') ? Object.assign({}, val) : val; }
  return { img: p.img, ax: p.ax, ay: p.ay, foot: p.foot.map(r => r.slice()), occl: p.occl ? p.occl.slice() : null, extra: ex, wins: p.wins, v, lz: !!p.lz };
}
/* Bild einer Spielart in einer Jahreszeit: bei Bedarf gemalt, dann behalten */
function wp_paintV(kind, v, sea){
  const e = wp_K[kind], key = seaKey(kind, sea), M = wp_CACHES[key];
  let arr = M.get(kind); if (!arr){ arr = new Array(e[1]); M.set(kind, arr); }
  let p = arr[v];
  if (!p){
    let kh = 0; for (let i = 0; i < kind.length; i++) kh = (kh * 31 + kind.charCodeAt(i)) | 0;
    const s0 = wp_S, cur = wp_SEA; wp_S = WS; wp_WINREC = []; if (key !== cur) wp_season(key);
    try { p = arr[v] = e[0]((kh & 0xffff) + v * 7919 + 101, v); p.wins = wp_WINREC; if (key === 3) p.img = snowify(p.img, kh + v); }
    finally { wp_S = s0; wp_WINREC = null; if (wp_SEA !== cur) wp_season(cur); }
  }
  return p;
}
