"use strict";
/* Der Apfelritter, Teil 3 von 25: Bilder der Gegner: Monster, Anführer, Raubritter, Tod, Lindwurm, Stromland.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Monster: acht gewöhnliche Gegner (monsters.js) ============ */
/* Export: MON_ART[art] = { w, h, ax, ay, idle:{r,l}, move:{r,l}, act:{r,l} }, Frames { img, glow, white }.
   Anker ax = w/2 (gespiegelte Bilder teilen den Anker). act[0] Ausholen/Zielen, act[1] Angriff.
   Zusätzlich pluend.reach (Spießspitze in act[1], px vor dem Anker) und armbrust.muzzle (Bolzenaustritt, Blick rechts). */
/* Malwerkzeug: Pixelpuffer mit Material und Helligkeitsstufe je Pixel.
   Teile werden von hinten nach vorn gemalt; mo_end() setzt eine dunkle Innenkontur gegen frühere Teile. */
const mo_RAMP = [null];                          // Materialien: Farbrampen dunkel..hell (gepackt RGBA)
const mo_OC = [0];                               // Konturfarbe je Material
function mo_pack(h){
  const v = parseInt(h.slice(1, 7), 16), a = h.length > 7 ? parseInt(h.slice(7, 9), 16) : 255;
  return ((a << 24) | (v & 255) << 16 | (v & 0xff00) | v >> 16) >>> 0;
}
function mo_mix(a, b, t){ // zwei Hex-Farben mischen
  const p = parseInt(a.slice(1, 7), 16), q = parseInt(b.slice(1, 7), 16), f = (s, k) => Math.round(((p >> s) & 255) * (1 - t) + ((q >> s) & 255) * t) << s;
  return '#' + ((f(16) | f(8) | f(0)) >>> 0).toString(16).padStart(6, '0');
}
function mo_mat(...cols){
  mo_RAMP.push(cols.map(mo_pack)); mo_OC.push(mo_pack(mo_mix(OUT, cols[0].slice(0, 7), .3)));
  return mo_RAMP.length - 1;
}
const mo_LX = -.52, mo_LY = -.68, mo_LZ = .52;  // Licht von oben links

function mo_pp(w, h, ax, ay){
  const n = w * h;
  return { w, h, ax, ay, M: new Uint16Array(n), V: new Uint8Array(n), T: new Uint8Array(n), G: new Uint32Array(n), part: 1, gn: 0, noOutline: false, x0: w, y0: h, x1: -1, y1: -1 };
}
function mo_put(P, x, y, mat, lv){
  x = Math.floor(x) + P.ax; y = Math.floor(y) + P.ay;
  if (x < 0 || y < 0 || x >= P.w || y >= P.h) return;
  const i = y * P.w + x;
  if (!mat){ P.M[i] = 0; return; }
  const n = mo_RAMP[mat].length - 1;
  P.M[i] = mat; P.V[i] = lv < 0 ? 0 : lv > n ? n : lv; P.T[i] = P.part;
  if (x < P.x0) P.x0 = x; if (x > P.x1) P.x1 = x; if (y < P.y0) P.y0 = y; if (y > P.y1) P.y1 = y;   // Rahmen des Teils
}
/* Licht aus Normale: 0..1 */
function mo_sh(nx, ny, nz, o){
  let s = (nx * mo_LX + ny * mo_LY + nz * mo_LZ + .3) / 1.25;
  if (o.k) s = .5 + (s - .5) * o.k;
  return s + (o.b || 0);
}
function mo_px(P, x, y, mat, o, nx, ny, nz, u, v){
  const n = mo_RAMP[mat].length;
  let lv = o.lv !== undefined ? o.lv : clamp(Math.floor(mo_sh(nx, ny, nz, o) * n + (o.d ? (dither(x, y) - .47) * o.d : 0)), 0, n - 1);
  if (o.tex){
    const r = o.tex(x, y, lv, u, v);
    if (r === false) return;
    if (typeof r === 'number') lv = r; else if (r) { mat = r[0]; lv = r[1]; }
  }
  mo_put(P, x, y, mat, lv);
}
/* Ellipse mit Kugelschattierung */
function mo_ell(P, cx, cy, rx, ry, mat, o){
  o = o || {};
  for (let y = Math.floor(cy - ry); y < cy + ry; y++) for (let x = Math.floor(cx - rx); x < cx + rx; x++){
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = nx * nx + ny * ny;
    if (d <= 1) mo_px(P, x, y, mat, o, nx, ny, Math.sqrt(1 - d), nx, ny);
  }
}
/* Glied: verjüngte Kapsel mit Zylinderschattierung. tex bekommt u = Lage längs (0..1), v = quer (-1..1) */
function mo_cap(P, x0, y0, x1, y1, r0, r1, mat, o){
  o = o || {};
  const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-6, L = Math.sqrt(L2), rm = Math.max(r0, r1);
  for (let y = Math.floor(Math.min(y0, y1) - rm); y <= Math.max(y0, y1) + rm; y++)
    for (let x = Math.floor(Math.min(x0, x1) - rm); x <= Math.max(x0, x1) + rm; x++){
      const px = x + .5, py = y + .5, t = ((px - x0) * dx + (py - y0) * dy) / L2, tc = clamp(t, 0, 1);
      const r = r0 + (r1 - r0) * tc, ex = px - (x0 + dx * tc), ey = py - (y0 + dy * tc), d2 = ex * ex + ey * ey;
      if (d2 > r * r) continue;
      const nx = ex / r, ny = ey / r;
      mo_px(P, x, y, mat, o, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), t, (ey * dx - ex * dy) / L / r);
    }
}
/* Vieleck, waagerecht zylindrisch schattiert; tex bekommt u = quer (0..1), v = Höhe (0..1) */
function mo_poly(P, pts, mat, o){
  o = o || {};
  let y0 = 1e9, y1 = -1e9;
  for (const p of pts){ if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  const cyl = o.cyl === undefined ? .8 : o.cyl;
  for (let y = Math.floor(y0); y < y1; y++){
    const Y = y + .5, xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){
      const a = pts[i], b = pts[j];
      if ((a[1] <= Y) !== (b[1] <= Y)) xs.push(a[0] + (Y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    if (xs.length < 2) continue;
    xs.sort((p, q) => p - q);
    const L = xs[0], R = xs[xs.length - 1], mid = (L + R) / 2 + (o.cx || 0), half = Math.max(.5, (R - L) / 2), v = (Y - y0) / (y1 - y0);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++){
        let nx = clamp((x + .5 - mid) / half, -1, 1) * cyl;
        if (o.fold) nx = clamp(nx + o.fold(x, y), -1, 1);
        const ny = o.vc ? clamp((v - .5) * 2 * o.vc, -.95, .95) : (o.ny || 0);
        mo_px(P, x, y, mat, o, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), (x + .5 - L) / (R - L || 1), v);
      }
  }
}
/* Linie (Bresenham); lv darf eine Funktion (k, n) sein */
function mo_line(P, x0, y0, x1, y1, mat, lv){
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, n = Math.max(dx, -dy);
  let e = dx + dy, k = 0;
  for (;;){
    mo_put(P, x0, y0, mat, typeof lv === 'function' ? lv(k, n) : lv);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e; if (e2 >= dy){ e += dy; x0 += sx; } if (e2 <= dx){ e += dx; y0 += sy; }
    k++;
  }
}
/* Handgezeichnetes Raster an (x,y) (oben links); map[ch] = [mat, stufe, glowFarbe?, glowAlpha?] */
function mo_stamp(P, rows, map, x, y){
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++){
    const e = map[rows[j][i]]; if (!e) continue;
    if (e[0] >= 0) mo_put(P, x + i, y + j, e[0], e[1]);
    if (e[2]) mo_glow(P, x + i, y + j, e[2], e[3]);
  }
}
/* Leuchtpixel (stärkerer Wert gewinnt) */
function mo_glow(P, x, y, hex, a){
  x = Math.floor(x) + P.ax; y = Math.floor(y) + P.ay;
  if (x < 0 || y < 0 || x >= P.w || y >= P.h) return;
  const i = y * P.w + x, al = Math.round((a === undefined ? 1 : a) * 255);
  if ((P.G[i] >>> 24) >= al) return;
  P.G[i] = mo_pack(hex.slice(0, 7) + al.toString(16).padStart(2, '0')); P.gn++;
}
/* Gestufter Lichthof um (x,y): Ringe mit abnehmender Deckkraft, geordnet gerastert */
function mo_halo(P, x, y, r, hex, a){
  for (let j = -Math.ceil(r); j <= r; j++) for (let i = -Math.ceil(r); i <= r; i++){
    const d = Math.sqrt(i * i + j * j) / r; if (d > 1) continue;
    const k = (1 - d) * a, q = k > a * .6 ? k : (dither(x + i + 9, y + j + 9) < .5 ? k * 1.3 : 0);
    if (q > .03) mo_glow(P, x + i, y + j, hex, Math.min(1, Math.round(q * 8) / 8));
  }
}
/* Teil abschließen: dunkle Innenkante gegen schon gemalte Teile */
function mo_end(P, drop){
  if (drop !== 0){
    drop = drop || 2;
    const { w, h, M, V, T } = P, pt = P.part, mark = [];
    for (let y = P.y0; y <= P.y1; y++) for (let x = P.x0; x <= P.x1; x++){
      const i = y * w + x; if (!M[i] || T[i] !== pt) continue;
      if ((x > 0 && M[i - 1] && T[i - 1] !== pt) || (x < w - 1 && M[i + 1] && T[i + 1] !== pt) ||
          (y > 0 && M[i - w] && T[i - w] !== pt) || (y < h - 1 && M[i + w] && T[i + w] !== pt)) mark.push(i);
    }
    for (const i of mark) V[i] = Math.max(0, V[i] - drop);
  }
  P.part++; P.x0 = P.w; P.y0 = P.h; P.x1 = P.y1 = -1;
}
/* Canvas aus gepackten Pixeln */
function mo_cvs(U, w, h){
  const c = canvasOf(w, h), g = c.getContext('2d'), id = g.createImageData(w, h);
  new Uint32Array(id.data.buffer).set(U); g.putImageData(id, 0, 0); return c;
}
/* Fertig: Farben auflösen, äußere Kontur, Leuchtebene. Liefert [Blick rechts, Blick links],
   Spiegelbild und weiße Treffer-Silhouette direkt aus den Pixeln (schneller als Zeichnen auf Canvas) */
function mo_done(P){
  const { w, h, M, V } = P, n = w * h, U = new Uint32Array(n);
  for (let i = 0; i < n; i++) if (M[i]) U[i] = mo_RAMP[M[i]][V[i]];
  if (!P.noOutline) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const i = y * w + x; if (M[i]) continue;
    let m = 0;
    if (x > 0 && M[i - 1]) m = M[i - 1]; else if (x < w - 1 && M[i + 1]) m = M[i + 1];
    else if (y > 0 && M[i - w]) m = M[i - w]; else if (y < h - 1 && M[i + w]) m = M[i + w];
    if (m) U[i] = mo_OC[m];
  }
  const G = P.gn ? P.G : null, Wt = new Uint32Array(n), Uf = new Uint32Array(n), Wf = new Uint32Array(n), Gf = G ? new Uint32Array(n) : null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const i = y * w + x, j = y * w + w - 1 - x, u = U[i];
    if (u >>> 24) Wt[i] = Wf[j] = ((u & 0xff000000) | 0xffffff) >>> 0;
    Uf[j] = u; if (G) Gf[j] = G[i];
  }
  return [{ img: mo_cvs(U, w, h), glow: G ? mo_cvs(G, w, h) : null, white: mo_cvs(Wt, w, h) },
          { img: mo_cvs(Uf, w, h), glow: G ? mo_cvs(Gf, w, h) : null, white: mo_cvs(Wf, w, h) }];
}
/* Satz bauen: draw(pose) -> Frame; spec = { idle:[posen], move:[...], act:[...] } */
function mo_set(w, h, ax, ay, draw, spec){
  const fr = list => { const f = list.map(p => { const P = mo_pp(w, h, ax, ay); draw(P, p); return mo_done(P); }); return { r: f.map(q => q[0]), l: f.map(q => q[1]) }; };
  return { w, h, ax, ay, idle: fr(spec.idle), move: fr(spec.move), act: fr(spec.act) };
}
/* deterministisches Rauschen für Texturen */
const mo_N = noise2(1520);
const mo_hash = (x, y, s) => { let v = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0; v = (v ^ (v >>> 13)) * 1274126177 | 0; return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };

/* ---------- gemeinsame Farben ---------- */
const mo_DARK = mo_mat('#0e0c0a', '#1a1612', '#28221c');                       // Höhlen, Schlitze
const mo_BONE = mo_mat('#4a4434', '#7a735c', '#a69e80', '#cbc4a6', '#e2dcc2'); // Knochen, Zähne, Nägel

/* Klauenhand: drei Finger in Richtung (dx,dy) */
function mo_claw(P, x, y, dx, dy, skin, len, open){
  const l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, px = -uy, py = ux;
  mo_ell(P, x, y, 1.4, 1.3, skin, { b: .05 });
  for (let f = -1; f <= 1; f++){
    const sp = f * (open ? 1.1 : .7), fl = len - Math.abs(f) * .6;
    const x0 = x + px * sp, y0 = y + py * sp, x1 = x0 + ux * fl + px * f * (open ? .8 : .2), y1 = y0 + uy * fl + py * f * (open ? .8 : .2);
    mo_line(P, x0, y0, x1, y1, skin, 1);
    mo_put(P, Math.round(x1 + ux * .9), Math.round(y1 + uy * .9), mo_BONE, 2);
  }
}

/* ---------- Wiedergänger: Untoter im schmutzigen Leichentuch ---------- */
const mo_WL = {
  lin: mo_mat('#39352c', '#58533f', '#7b745c', '#9d957a', '#b9b194'),   // Leinen, vergilbt
  ert: mo_mat('#2b2418', '#43392a', '#5c4f39', '#72644a'),              // Grabeserde
  skn: mo_mat('#252a22', '#40483a', '#5d6652', '#7c836b', '#989d84'),   // faulende Haut
  crd: mo_mat('#221e17', '#3a3428', '#554c3a', '#6c634c')               // Bindestreifen
};
function mo_wieder(P, p){
  const C = mo_WL, bx = p.bx || 0, by = p.by || 0, t = p.t || 0;
  const leg = (L, near) => {
    const [kx, ky, fx, fy] = L;
    mo_cap(P, kx + bx, ky + by, fx, fy - 2, 1.25, .9, C.skn, { b: near ? .08 : -.15 });
    mo_ell(P, kx + bx + .3, ky + by + .3, 1.4, 1.3, C.skn, { b: near ? .1 : -.1 });  // Kniescheibe
    mo_poly(P, [[fx - 2, fy - 3], [fx + 1, fy - 3], [fx + 4, fy - 1], [fx + 4, fy], [fx - 2, fy]], C.skn, { b: near ? -.05 : -.25, cyl: .4, ny: -.3 });
    mo_put(P, fx + 3, fy - 1, mo_BONE, near ? 2 : 1); mo_put(P, fx + 1, fy - 1, C.skn, 0);
    mo_put(P, fx - 1, fy - 3, mo_BONE, 1);                         // Knöchel
    mo_put(P, kx + bx + (near ? 0 : 0), ky + by + 2, C.skn, near ? 3 : 2);
    if (near){ mo_line(P, kx + bx - 1, ky + by + 3, fx - 1, fy - 4, C.crd, 1); } // Wickelband am Schienbein
    mo_end(P);
  };
  const arm = (A, near) => {
    const [sx, sy, ex, ey, hx, hy] = A.map((v, i) => v + (i % 2 ? by : bx));
    const o = { b: near ? 0 : -.22 };
    mo_cap(P, sx, sy, ex, ey, 1.5, 1.15, C.skn, o);
    mo_cap(P, ex, ey, hx, hy, 1.15, .95, C.skn, Object.assign({ tex: (x, y, lv, u, v) => v > .45 && u > .25 && u < .7 ? lv - 1 : undefined }, o));
    mo_put(P, ex, ey, mo_BONE, near ? 2 : 1);
    if (near){ // Tuch hängt über die Schulter, Fetzen am Oberarm
      const mx = sx + (ex - sx) * .55, my = sy + (ey - sy) * .55;
      mo_cap(P, sx, sy, mx, my, 2.3, 1.7, C.lin, { d: .3 });
      mo_line(P, mx - 1, my + 1, mx - 1, my + 4 + (p.sway || 0), C.lin, 2);
      mo_line(P, mx + .5, my + 1, mx + 1, my + 3, C.lin, 1);
      mo_put(P, mx - 1, my + 5 + (p.sway || 0), C.lin, 1);
    }
    mo_claw(P, hx, hy, hx - ex, hy - ey, C.skn, near ? 3 : 2.5, p.open);
    mo_end(P);
  };
  arm(p.fa, false);
  leg(p.fl, false);
  // Leichentuch: gebeugter Körper, gebunden an Brust, Hüfte und Knien, zerrissener Saum
  const R = rng(17 + t * 5), hem = [];
  for (let x = 6.4; x >= -5.2; x -= 1.3){ const r = R(); hem.push([x + bx, -11 + by + (r * 2.5 | 0)]); if (r > .72) hem.push([x - .6 + bx, -7 + by - (R() * 2 | 0)], [x - 1.2 + bx, -10 + by]); }
  const body = [[-1, -36], [3, -36.5], [6, -34], [7, -31], [6, -27], [4.6, -23], [5.2, -18], [6.6, -12], ...hem.map(q => [q[0] - bx, q[1] - by]),
    [-5.6, -12], [-4.8, -18], [-4.2, -23], [-5.6, -28], [-5.2, -32], [-3.5, -35]].map(q => [q[0] + bx, q[1] + by]);
  mo_poly(P, body, C.lin, {
    cyl: .9, d: .2,
    fold: (x, y) => { const X = x - bx, Y = y - by; return Y > -22 ? .6 * Math.sin(X * 1.25 + t * .8) : Y > -29 ? .45 * Math.sin(X * 1.1 - Y * .9) : .35 * Math.sin(X * .9 + Y * .8); },
    tex: (x, y, lv, u, v) => {
      const X = x - bx, Y = y - by, n = mo_N(x * .18 + 3, y * .18), s = Math.sin(X * 1.25 + t * .8);
      if (v > .72 && n * .7 + v * .6 + mo_hash(x, y, 4) * .14 > 1.08) return [C.ert, Math.min(lv, 2) - (mo_hash(x, y) < .3 ? 1 : 0)];  // Grabeserde am Saum
      if (Y > -22 && s < -.88) return lv - 1;                                                             // Faltentiefe
      if (Y > -22 && s > .93 && lv > 1) return lv + 1;                                                    // Faltengrat
      if (n < .24) return [C.lin, Math.max(0, lv - 1)];                                                   // Stockflecken
      if (mo_hash(x, y, 9) < .05) return lv - 1;                                                          // Webfehler
      return undefined;
    }
  });
  // Riss an der Flanke: darunter eingefallene Rippen
  for (const [x, y, m, l] of [[-4, -29, mo_DARK, 1], [-3, -29, mo_DARK, 0], [-2, -29, C.lin, 1], [-5, -28, mo_DARK, 1], [-4, -28, C.skn, 2], [-3, -28, C.skn, 3], [-2, -28, mo_DARK, 0],
    [-5, -27, mo_DARK, 0], [-4, -27, mo_DARK, 1], [-3, -27, mo_DARK, 0], [-2, -27, mo_DARK, 1], [-5, -26, mo_DARK, 1], [-4, -26, C.skn, 2], [-3, -26, C.skn, 3], [-2, -26, C.skn, 1],
    [-4, -25, mo_DARK, 0], [-3, -25, mo_DARK, 1], [-2, -25, mo_DARK, 0], [-4, -24, C.skn, 1], [-3, -24, C.skn, 2], [-3, -23, mo_DARK, 1], [-1, -27, C.lin, 0], [-1, -24, C.lin, 0]])
    mo_put(P, x + 1 + bx, y + by, m, l);
  // Bindestreifen mit Knoten
  for (const [yy, w0, w1] of [[-30, -5, 6], [-21, -4, 4], [-14, -5, 6]])
    for (let x = w0; x <= w1; x++){ const cv = Math.round((x - .5) * (x - .5) * .03); mo_put(P, x + bx, yy + cv + by, C.crd, x < -2 ? 1 : x > 3 ? 1 : 2); }
  mo_put(P, 5 + bx, -21 + by, C.crd, 3); mo_put(P, 6 + bx, -20 + by, C.crd, 1); mo_put(P, 6 + bx, -19 + by, C.crd, 2); mo_put(P, 5 + bx, -18 + by, C.crd, 1);
  mo_line(P, 1 + bx, -20 + by, 2 + bx, -15 + by, C.lin, 1); mo_line(P, -3 + bx, -20 + by, -3 + bx, -15 + by, C.lin, 1);
  mo_line(P, 2 + bx, -13 + by, 3 + bx, -11 + by, C.lin, 1);
  mo_end(P);
  leg(p.nl, true);
  // Kopf: Tuch als Kapuze, oben verknotet, darin das eingefallene Gesicht
  const hx = p.hx + bx, hy = p.hy + by;
  mo_ell(P, hx - .8, hy, 5, 5.4, C.lin, { d: .4, tex: (x, y, lv) => mo_N(x * .6, y * .6) < .25 ? lv - 1 : undefined });
  mo_ell(P, hx - 1.8, hy - 5.4, 1.5, 1.3, C.lin, { b: .1 });
  mo_put(P, hx - 3, hy - 6, C.lin, 3); mo_put(P, hx - 4, hy - 7, C.lin, 2); mo_put(P, hx - 1, hy - 7, C.lin, 3); mo_put(P, hx, hy - 8, C.lin, 1);
  mo_line(P, hx - 4, hy - 2, hx - 3, hy + 3, C.lin, 1);             // Faltenkante der Kapuze
  mo_ell(P, hx + 1.6, hy + .6, 3.2, 4.1, mo_DARK, { lv: 1 });        // Schatten in der Kapuze
  mo_end(P, 0);
  const F = { k: [mo_DARK, 0], K: [mo_DARK, 1], s: [C.skn, 1], t: [C.skn, 2], u: [C.skn, 3], v: [C.skn, 4],
    E: [mo_BONE, 4, '#e4fff0', 1], T: [mo_BONE, 3], q: [mo_BONE, 1], n: [mo_DARK, 0] };
  mo_stamp(P, p.mouth ? [
    "tuvvu.",
    "kkukk.",
    "kEtkEu",
    "stvtnu",
    "qTqnn.",
    "kkkkk.",
    "kTqTk.",
    ".sss.."] : [
    "tuvvu.",
    "kkukk.",
    "kEtkEu",
    "stvtnu",
    "sttnn.",
    "qTkTT.",
    "kTTqT.",
    ".sss.."], F, hx - 1, hy - 3);
  mo_end(P, 0);
  arm(p.na, true);
}
function mo_wiederEyes(P, p){ const hx = p.hx + (p.bx || 0), hy = p.hy + (p.by || 0); mo_halo(P, hx, hy - 1, 2.3, '#9dffc0', .45); mo_halo(P, hx + 3, hy - 1, 2.3, '#9dffc0', .45); }
/* Beine: [Knie x, y, Fuß x, y]; Arme: [Schulter, Ellbogen, Hand] */
const mo_WIEDER = {
  idle: [
    { t: 0, hx: 5, hy: -37, fl: [-1, -11, -2, 0], nl: [2, -11, 3, 0], fa: [0, -32, 5, -29, 10, -28], na: [2, -31, 7, -28, 12, -27] },
    { t: 1, by: 1, hx: 5, hy: -37, sway: 1, fl: [-1, -11, -2, 0], nl: [2, -11, 3, 0], fa: [0, -32, 5, -28, 10, -26], na: [2, -31, 7, -27, 12, -25] }],
  move: [
    { t: 0, hx: 6, hy: -37, fl: [-2, -11, -4, 0], nl: [4, -11, 5, 0], fa: [0, -32, 6, -30, 11, -31], na: [2, -31, 7, -29, 13, -29] },
    { t: 1, by: -1, hx: 6, hy: -37, sway: 1, fl: [1, -12, 0, -3], nl: [2, -11, 1, 0], fa: [0, -32, 6, -29, 11, -30], na: [2, -31, 7, -28, 13, -27] },
    { t: 2, hx: 6, hy: -37, fl: [3, -11, 5, 0], nl: [-1, -11, -3, 0], fa: [0, -32, 6, -30, 11, -30], na: [2, -31, 7, -29, 13, -30] },
    { t: 3, by: -1, hx: 6, hy: -37, sway: 1, fl: [0, -11, 0, 0], nl: [3, -12, 2, -3], fa: [0, -32, 6, -29, 11, -29], na: [2, -31, 7, -28, 13, -28] }],
  act: [
    { t: 1, bx: -1, hx: 4, hy: -38, mouth: 1, open: 1, fl: [-2, -11, -4, 0], nl: [3, -11, 4, 0], fa: [0, -33, 4, -38, 9, -44], na: [2, -32, 8, -36, 13, -42] },
    { t: 2, bx: 2, by: 1, hx: 8, hy: -35, mouth: 1, open: 1, fl: [-2, -11, -5, 0], nl: [6, -11, 8, 0], fa: [1, -31, 8, -29, 15, -29], na: [3, -31, 10, -27, 18, -26] }]
};
/* Zwei-Glieder-Kette: Gelenkpunkt zwischen a und b (Längen l1, l2), bend = Knickrichtung (+1/-1) */
function mo_ik(ax, ay, bx, by, l1, l2, bend){
  const dx = bx - ax, dy = by - ay, d = clamp(Math.hypot(dx, dy), .01, l1 + l2 - .01), a = Math.atan2(dy, dx);
  const c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), t = a - bend * Math.acos(c);
  return [ax + Math.cos(t) * l1, ay + Math.sin(t) * l1];
}
/* Kuhmaulschuh (breite, stumpfe Kappe, um 1520), Ferse bei fx, Sohle bei fy */
function mo_shoe(P, fx, fy, mat, b, slash){
  mo_poly(P, [[fx - 2, fy - 3], [fx + 1.5, fy - 3], [fx + 3, fy - 2.4], [fx + 5, fy - 2], [fx + 5.6, fy - .8], [fx + 5, fy], [fx - 2.3, fy]], mat, { cyl: .5, ny: -.35, b });
  mo_line(P, fx - 2, fy - 1, fx + 5, fy - 1, mat, 0);                     // Sohle
  if (slash){ mo_put(P, fx + 3, fy - 2, slash, 3); mo_put(P, fx + 4, fy - 2, slash, 2); }   // geschlitzte Kappe
}

/* ---------- Plünderer: verwilderter Landsknecht um 1520 mit Halbspieß ---------- */
const mo_LK = {
  skn: mo_mat('#3a261e', '#634033', '#8c5f48', '#ab7b5e', '#c39374'),
  hai: mo_mat('#1b1510', '#2f241b', '#463627', '#5c4834'),
  red: mo_mat('#33171a', '#552426', '#753430', '#90483c', '#a45c4a'),   // verblichenes Krapprot
  och: mo_mat('#4a381c', '#73592e', '#98793f', '#b39552', '#c8ac6a'),   // Futter, Puffen
  gry: mo_mat('#1c1f23', '#2f3339', '#454a52', '#5d636b'),              // rechtes Hosenbein
  lin: mo_mat('#4a463b', '#736d5c', '#9a927b', '#b7af95'),              // Hemd
  lea: mo_mat('#1a130d', '#2f2218', '#4a3624', '#634a33', '#7a5d42'),
  stl: mo_mat('#24272b', '#474c52', '#737a81', '#a1a8ae', '#d0d4d4'),
  wod: mo_mat('#2a1e15', '#463321', '#644b31', '#7f6445'),
  ber: mo_mat('#151318', '#232027', '#332f38', '#46414c'),              // schwarzes Barett
  fea: mo_mat('#55524a', '#837e70', '#b0aa98', '#d0cab8')               // geknickte Feder
};
/* Spieß (Halbspieß, ca. 48 px = 1,9 m): R = hintere Hand, Richtung (ux,uy); Schaft 30 px ab hinterer Hand, Tülle mit Federn, Blattspitze */
function mo_spear(P, R, ux, uy, glint){
  const C = mo_LK, back = 8, len = 30;
  const bx = R[0] - ux * back, by = R[1] - uy * back, sx = R[0] + ux * len, sy = R[1] + uy * len;
  mo_cap(P, bx, by, sx, sy, .95, .9, C.wod, { k: 1.2, tex: (x, y, lv, u) => (mo_hash(x, y, 3) < .12 ? lv - 1 : undefined) });
  mo_put(P, bx, by, C.stl, 1);                                                          // Schuh am Schaftende
  const px = -uy, py = ux;
  // Federn (Schaftbeschläge) und Tülle
  mo_line(P, sx - ux * 5 + px * .9, sy - uy * 5 + py * .9, sx + px * .6, sy + py * .6, C.stl, 2);
  mo_line(P, sx - ux * 5 - px * .6, sy - uy * 5 - py * .6, sx - px * .6, sy - py * .6, C.stl, 1);
  mo_cap(P, sx, sy, sx + ux * 2, sy + uy * 2, 1.1, .9, C.stl, { k: 1.3 });
  // Blatt: Weidenblattform mit Mittelgrat
  const tip = [sx + ux * 10, sy + uy * 10];
  mo_poly(P, [[sx + ux * 2 + px * .6, sy + uy * 2 + py * .6], [sx + ux * 4.5 + px * 2, sy + uy * 4.5 + py * 2], [tip[0] + px * .2, tip[1] + py * .2], [tip[0] + ux * .6, tip[1] + uy * .6],
    [sx + ux * 4.5 - px * 2, sy + uy * 4.5 - py * 2], [sx + ux * 2 - px * .6, sy + uy * 2 - py * .6]], C.stl, { cyl: 0, b: .1, tex: (x, y) => ((x + .5 - sx) * px + (y + .5 - sy) * py) < 0 ? 1 : 3 });
  mo_line(P, sx + ux * 2.5, sy + uy * 2.5, tip[0] - ux, tip[1] - uy, C.stl, 4);
  if (glint){ mo_glow(P, tip[0], tip[1], '#ffffff', 1); mo_glow(P, tip[0] + 1, tip[1], '#fff6d0', .7); mo_glow(P, tip[0] - 1, tip[1], '#fff6d0', .7); mo_glow(P, tip[0], tip[1] - 1, '#fff6d0', .7); mo_glow(P, tip[0], tip[1] + 1, '#fff6d0', .7); mo_glow(P, tip[0], tip[1] - 2, '#fff6d0', .35); mo_glow(P, tip[0], tip[1] + 2, '#fff6d0', .35); mo_glow(P, tip[0] + 2, tip[1], '#fff6d0', .35); mo_glow(P, tip[0] - 2, tip[1], '#fff6d0', .35); }
  return tip;
}
/* geschlitzter Puffärmel / Pluderhose: Längsschlitze mit hervorquellendem Futter */
function mo_slashTex(lining, n, from, to, seed){
  return (x, y, lv, u, v) => {
    if (u < from || u > to) return undefined;
    const q = (v * .5 + .5) * n + (seed || 0), f = q - Math.floor(q);
    if (f > .38 && f < .72) return [lining, clamp(lv + 1, 1, 4)];
    if (f >= .72 && f < .86) return lv - 1;
    return undefined;
  };
}
function mo_pluend(P, p){
  const ang = p.ang || 0, ux = Math.cos(ang), uy = Math.sin(ang);
  p.F = [p.R[0] + ux * p.fd, p.R[1] + uy * p.fd + 1];
  const C = mo_LK, bx = p.bx || 0, by = p.by || 0, L = p.lean || 0;
  const hipN = [1 + bx, -21 + by], hipF = [-2 + bx, -21 + by];
  const shN = [1 + bx + L, -34 + by], shF = [-4 + bx + L, -34 + by];
  // Bein: Pluderhose (gepufft, geschlitzt), Kniebund mit Nestel, enger Strumpf, Kuhmaulschuh
  const leg = (hip, foot, near) => {
    const ank = [foot[0], foot[1] - 2.5], kn = mo_ik(hip[0], hip[1], ank[0], ank[1], 10, 9, 1);
    const b = near ? 0 : -.18;
    // Unterschenkel
    mo_cap(P, kn[0], kn[1], ank[0], ank[1], 1.6, 1.15, near ? C.och : C.gry, { b, tex: near ? (x, y, lv, u) => (Math.floor(u * 6) % 2 ? [C.red, lv] : undefined) : (x, y, lv, u, v) => (u > .1 && u < .35 && v > -.2 && v < .7 ? [C.skn, lv] : undefined) });
    mo_shoe(P, ank[0] - 1, foot[1], C.lea, b, C.lea);
    mo_end(P);
    // Oberschenkel: Puffen mit Schlitzen
    const m = near ? C.red : C.gry;
    mo_cap(P, hip[0], hip[1], kn[0] + (kn[0] - hip[0]) * .05, kn[1] - 1, 3.1, 2.6, m, { b, d: .4, tex: mo_slashTex(near ? C.och : C.red, 2.4, .08, .82, near ? 0 : .3) });
    // Kniebund und Nestelband
    const kb = [kn[0], kn[1] + .5];
    mo_line(P, kb[0] - 2, kb[1], kb[0] + 2, kb[1], near ? C.red : C.gry, 0);
    mo_put(P, kb[0] - 2, kb[1] + 2, C.och, near ? 3 : 1); mo_put(P, kb[0] - 3, kb[1] + 3, C.och, 2); mo_put(P, kb[0] - 2, kb[1] + 4, C.och, 1);
    if (!near){ mo_put(P, kb[0] + 1, kb[1] - 2, mo_DARK, 1); mo_put(P, kb[0], kb[1] - 3, C.skn, 1); } // Loch am Knie
    mo_end(P);
  };
  // Arm: gepuffter, geschlitzter Oberärmel, enger Unterärmel mit Querschlitzen
  const arm = (sh, hand, near) => {
    const el = mo_ik(sh[0], sh[1], hand[0], hand[1], 7, 7, -1), b = near ? .02 : -.22;
    mo_cap(P, el[0], el[1], hand[0], hand[1], 1.6, 1.25, C.red, { b, tex: (x, y, lv, u) => (u > .35 && u < .5 ? [C.och, lv + 1] : u > .85 ? [C.lin, lv] : undefined) });
    mo_cap(P, sh[0], sh[1], el[0], el[1], near ? 3.0 : 2.4, 1.8, C.red, { b: near ? b : -.25, d: .4, tex: mo_slashTex(C.och, 2.2, .05, .8, near ? .1 : .5) });
    if (near){ // ausgerissener Fetzen am Oberarm
      mo_line(P, el[0] - 1, el[1] + 1, el[0] - 2, el[1] + 4, C.red, 1); mo_put(P, el[0] - 1, el[1] + 2, C.och, 2);
    }
    mo_end(P);
    mo_ell(P, hand[0], hand[1], 1.6, 1.4, C.skn, { b: b + .05 });
    mo_put(P, hand[0] + (near ? .5 : 0), hand[1] + 1, C.skn, 1);
    mo_end(P, 1);
  };
  // Hinterer Arm (rechter Arm, hält den Spieß hinten)
  arm(shF, p.R, false);
  leg(hipF, p.ff, false);
  leg(hipN, p.nf, true);
  // Wams: eng, Brust quer geschlitzt, tiefer viereckiger Ausschnitt, kurzer Schoß
  const tq = [[-5 + L, -35], [-2 + L, -37], [3 + L, -37], [5 + L, -35], [6 + L * .6, -31], [4.5 + L * .2, -25.5], [6, -20], [2, -19.5], [-2, -20], [-5.5, -20.5],
    [-4.5 + L * .2, -25.5], [-6 + L * .7, -30]].map(q => [q[0] + bx, q[1] + by]);
  mo_poly(P, tq, C.red, { cyl: .9, d: .5, tex: (x, y, lv, u, v) => {
    const X = x - bx - L * (1 - v), Y = y - by;
    for (const r of [-34, -31, -28]) if (Y === r || Y === r + 1){                         // Brustschlitze mit Puffen
      const q = (X + 20 + (r === -31 ? 2 : 0)) % 4;
      if (q === 0) return [C.och, lv + (Y === r ? 1 : 0)];
      if (q === 1) return [C.och, lv - (Y === r ? 0 : 1)];
      if (q === 2 && Y === r + 1) return lv - 1;
    }
    if (Y > -23){ const s = (X + 20) % 3; if (s === 0) return [C.och, lv]; }               // Schoß mit Schlitzen
    if (mo_N(x * .5 + 7, y * .5) < .22) return lv - 1;                                    // Schmutz
    return undefined;
  } });
  // Ausschnitt mit gefälteltem Hemd
  for (let x = -1; x <= 4; x++){ mo_put(P, x + bx + L, -37 + by, C.lin, x & 1 ? 2 : 3); mo_put(P, x + bx + L, -36 + by, C.lin, x === 4 ? 0 : 1 + (x & 1)); }
  mo_put(P, 1 + bx + L, -35 + by, C.skn, 2); mo_put(P, 2 + bx + L, -35 + by, C.lin, 1); mo_put(P, 0 + bx + L, -35 + by, C.lin, 0);
  // Flicken mit Stichen und ein Loch
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) mo_put(P, -4 + i + bx + L * .5, -30 + j + by, C.gry, i === 0 || j === 0 ? 3 : 2);
  mo_put(P, -4 + bx + L * .5, -31 + by, C.lin, 3); mo_put(P, -2 + bx + L * .5, -31 + by, C.lin, 3); mo_put(P, -5 + bx + L * .5, -28 + by, C.lin, 3);
  mo_put(P, 3 + bx, -24 + by - 4, mo_DARK, 1); mo_put(P, 4 + bx, -24 + by - 4, C.lin, 1);
  // Gürtel mit Schnalle, Beutel
  for (let x = -5; x <= 5; x++) mo_put(P, x + bx + L * .2, -25 + by + (x > 3 ? 0 : 0), C.lea, x === 4 ? 4 : x & 1 ? 2 : 1);
  mo_put(P, 4 + bx + L * .2, -24 + by, C.stl, 3);
  mo_ell(P, -5 + bx, -22.5 + by, 1.6, 2, C.lea, { b: -.05 }); mo_put(P, -5 + bx, -24 + by, C.lea, 4);
  mo_end(P);
  // Katzbalger an der linken Hüfte: S-förmiges Gefäß, Scheide schräg nach hinten
  const kx = 2 + bx + L * .2, ky = -25 + by;
  mo_line(P, kx - 1, ky + 1, kx - 9, ky + 6, C.lea, 1); mo_line(P, kx - 1, ky, kx - 8, ky + 5, C.lea, 2); mo_put(P, kx - 9, ky + 7, C.stl, 2); mo_put(P, kx - 10, ky + 6, C.stl, 1);
  mo_line(P, kx, ky - 1, kx + 2, ky - 3, C.lea, 3); mo_put(P, kx + 3, ky - 4, C.stl, 3);       // Griff, Knauf
  mo_put(P, kx + 1, ky + 1, C.stl, 3); mo_put(P, kx + 2, ky, C.stl, 2); mo_put(P, kx - 1, ky - 2, C.stl, 3); mo_put(P, kx - 2, ky - 1, C.stl, 2); // S-Bügel
  mo_end(P, 1);
  // Kopf: Bart, Barett mit geschlitzter Krempe und geknickter Feder
  const hx = p.hx + bx, hy = p.hy + by;
  const F = { h: [C.hai, 1], H: [C.hai, 2], j: [C.hai, 3], a: [C.skn, 1], b: [C.skn, 2], c: [C.skn, 3], d: [C.skn, 4], e: [mo_DARK, 0], w: [C.lin, 2], m: [mo_DARK, 1], n: [C.skn, 0], r: [C.red, 2] };
  mo_stamp(P, [
    ".hhhhh...",
    "hhbcccc..",
    "hhbhhbh..",
    "hcbebce..",
    "hbcccccd.",
    "hHbcccnc.",
    "hHjHbbjj.",
    ".Hjj" + (p.shout ? "me" : "mm") + "jH.",
    ".HHjjjjH.",
    "..HHjjH..",
    "...HHH..."], F, hx - 4, hy - 5);
  mo_end(P, 1);
  // Barett: flache Scheibe, schräg, Krempe geschlitzt
  mo_ell(P, hx - 1, hy - 7.5, 4.6, 2.4, C.ber, { b: .05 });
  mo_ell(P, hx - .5, hy - 5.6, 7.2, 1.7, C.ber, { k: 1.2, tex: (x, y, lv, u, v) => (v > .1 && (x & 1) ? [C.och, 2] : undefined) });
  mo_put(P, hx + 5, hy - 6, C.ber, 3); mo_put(P, hx - 6, hy - 5, C.ber, 0);
  // Feder: am Ansatz aufrecht, oben abgeknickt und hängend
  mo_line(P, hx - 4, hy - 8, hx - 5, hy - 12, C.fea, 3);
  mo_line(P, hx - 5, hy - 12, hx - 8, hy - 11, C.fea, 2); mo_put(P, hx - 9, hy - 10, C.fea, 1); mo_put(P, hx - 9, hy - 9, C.fea, 0);
  mo_put(P, hx - 4, hy - 10, C.fea, 2); mo_put(P, hx - 6, hy - 10, C.fea, 1); mo_put(P, hx - 3, hy - 9, C.fea, 1); mo_put(P, hx - 7, hy - 12, C.fea, 3);
  mo_end(P, 1);
  // Spieß, hintere Hand darüber, dann vorderer Arm
  mo_spear(P, p.R, ux, uy, p.glint);
  mo_end(P, 1);
  mo_ell(P, p.R[0], p.R[1], 1.6, 1.4, C.skn, { b: -.1 }); mo_end(P, 1);
  arm(shN, p.F, true);
  if (p.shout){ // Stoßlinien hinter der Spitze
    const tx = p.R[0] + ux * 40, ty = p.R[1] + uy * 40;
    for (let k = 4; k < 14; k++){ mo_glow(P, tx - ux * k, ty - 3, '#f4efe0', .62 - k * .035); if (k > 6) mo_glow(P, tx - ux * k - 1, ty + 3, '#f4efe0', .55 - k * .03); }
  }
}
/* Posen: nf/ff = vorderer/hinterer Fuß (Ferse), R/F = hintere/vordere Hand, ang = Spießwinkel */
const mo_PLUEND = {
  idle: [
    { hx: 3, hy: -39, nf: [2, 0], ff: [-3, 0], R: [-3, -25], ang: -.62, fd: 9 },
    { by: 1, hx: 3, hy: -39, nf: [2, 0], ff: [-3, 0], R: [-3, -24], ang: -.62, fd: 9 }],
  move: [
    { hx: 3, hy: -39, nf: [4, 0], ff: [-5, 0], R: [-2, -26], ang: -.5, fd: 9 },
    { by: -1, hx: 3, hy: -39, nf: [0, 0], ff: [-1, -3], R: [-2, -27], ang: -.5, fd: 9 },
    { hx: 3, hy: -39, nf: [-4, 0], ff: [4, 0], R: [-2, -26], ang: -.5, fd: 9 },
    { by: -1, hx: 3, hy: -39, nf: [1, -3], ff: [-1, 0], R: [-2, -27], ang: -.5, fd: 9 }],
  act: [
    { bx: -2, lean: -2, hx: 0, hy: -39, nf: [4, 0], ff: [-8, 0], R: [-14, -28], ang: -.05, fd: 11, glint: 1 },
    { bx: 3, by: 2, lean: 3, hx: 8, hy: -37, shout: 1, nf: [9, 0], ff: [-9, 0], R: [-3, -27], ang: 0, fd: 13 }]
};
/* ---------- Armbrustschütze um 1520: Stahlbogenarmbrust, Brigantine, Kragen, Eisenhut ---------- */
const mo_AB = {
  hat: mo_mat('#191c1f', '#31363b', '#4f565d', '#737b82', '#9ea5aa'),   // Eisenhut, angelaufen
  rst: mo_mat('#3a2416', '#5a3920', '#7a512e'),                         // Rost
  brg: mo_mat('#1b2027', '#29313b', '#3a4452', '#4f5a69', '#636f7e'),   // Brigantinenbezug, blau verblichen
  brs: mo_mat('#4e3a1c', '#7c5f2c', '#a98744', '#d0b064'),              // Messingnieten
  mai: mo_mat('#1d1f22', '#3b3f44', '#6a7076', '#9aa0a4'),              // Kettengeflecht
  wam: mo_mat('#2b2117', '#463626', '#614c37', '#7a644b'),              // Wams, braune Wolle
  hos: mo_mat('#27221e', '#3e362f', '#574d43', '#6f6457'),              // Hosen
  wod: mo_mat('#22170e', '#3b2818', '#573c24', '#704f33', '#86643f'),   // Nussbaum
  str: mo_mat('#4a4232', '#7a705a', '#a89e84')                          // Sehne, Hanf
};
/* Armbrust: B = Kolbenende, Winkel ang; st: 0 = gespannt und geladen, 1 = abgeschossen. Liefert Bolzenaustritt. */
function mo_xbow(P, B, ang, st){
  if (mo_AB.gun) return mo_gun(P, B, ang, st);
  const C = mo_AB, ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux;
  const at = (a, b) => [B[0] + ux * a + px * b, B[1] + uy * a + py * b];
  const F = at(19, 0), nut = at(11, -1);
  // Abzugsstange unter der Säule
  const t0 = at(10.5, 1.5), t1 = at(3.5, 3.2);
  mo_line(P, t0[0], t0[1], t1[0], t1[1], mo_LK.stl, 1); mo_put(P, t1[0], t1[1], mo_LK.stl, 2);
  // Säule mit Wange am Kolben und Beineinlage
  const s0 = at(0, .6), s1 = at(20, 0);
  mo_cap(P, s0[0], s0[1], s1[0], s1[1], 1.7, 1.0, C.wod, { k: 1.2 });
  for (let a = 3; a <= 15; a++){ const q = at(a, -.2); mo_put(P, q[0], q[1], mo_BONE, a % 4 === 0 ? 4 : 3); }
  const k1 = at(1, 1.4); mo_put(P, k1[0], k1[1], mo_BONE, 2);
  // Nuss aus Horn
  mo_put(P, nut[0], nut[1], mo_BONE, 4);
  // Bogen (Stahl) mit Bindung, Spitzen nach hinten gebogen
  const sweep = st ? 1.2 : 3.2;
  const tipA = at(19 - sweep, -6), tipB = at(19 - sweep, 6), midA = at(19.6, -3), midB = at(19.6, 3);
  mo_line(P, F[0], F[1], midA[0], midA[1], mo_LK.stl, 3); mo_line(P, midA[0], midA[1], tipA[0], tipA[1], mo_LK.stl, 2);
  mo_line(P, F[0], F[1], midB[0], midB[1], mo_LK.stl, 2); mo_line(P, midB[0], midB[1], tipB[0], tipB[1], mo_LK.stl, 1);
  mo_put(P, tipA[0], tipA[1], mo_LK.stl, 4);
  // Sehne
  if (!st){ mo_line(P, tipA[0], tipA[1], nut[0], nut[1], C.str, 2); mo_line(P, tipB[0], tipB[1], nut[0] + 0, nut[1] + 1, C.str, 1); }
  else { const sa = at(18.6 - sweep * .2, -5), sb = at(18.6 - sweep * .2, 5); mo_line(P, sa[0], sa[1], sb[0], sb[1], C.str, 2); }
  // Bindung und Bügel vorn
  const b0 = at(18, 0); mo_put(P, b0[0], b0[1], C.str, 0);
  const g0 = at(21, -1), g1 = at(23, -1), g2 = at(23, 1), g3 = at(21, 1);
  mo_line(P, g0[0], g0[1], g1[0], g1[1], mo_LK.stl, 3); mo_line(P, g1[0], g1[1], g2[0], g2[1], mo_LK.stl, 2); mo_line(P, g2[0], g2[1], g3[0], g3[1], mo_LK.stl, 1);
  // Bolzen
  if (!st){
    const q0 = at(10, -1.6), q1 = at(22, -1.6), q2 = at(24, -1.6);
    mo_line(P, q0[0], q0[1], q1[0], q1[1], C.wod, 4); mo_line(P, q1[0], q1[1], q2[0], q2[1], mo_LK.stl, 4);
    const f0 = at(10, -2.6), f1 = at(11, -2.6); mo_put(P, f0[0], f0[1], mo_LK.fea, 3); mo_put(P, f1[0], f1[1], mo_LK.fea, 2);
  }
  return at(24, -1.6);
}
/* Hakenbüchse (um 1520): Holzschaft, Eisenlauf mit dem Haken darunter, Luntenschloss mit glimmender Lunte; st 1 = Schuss mit Mündungsfeuer */
function mo_gun(P, B, ang, st){
  const C = mo_AB, ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux;
  const at = (a, b) => [B[0] + ux * a + px * b, B[1] + uy * a + py * b];
  const s0 = at(0, .8), s1 = at(12, 0);
  mo_cap(P, s0[0], s0[1], s1[0], s1[1], 2, 1.2, C.wod, { k: 1.2 });                      // Schaft
  const l0 = at(6, -.6), l1 = at(26, -.6);
  mo_cap(P, l0[0], l0[1], l1[0], l1[1], 1.1, 1, mo_LK.stl, { k: 1.4 });                    // Lauf
  const m = at(26.5, -.6); mo_put(P, m[0], m[1], mo_DARK, 0);
  const h0 = at(17, .6), h1 = at(18, 3.2), h2 = at(16, 3.6);
  mo_line(P, h0[0], h0[1], h1[0], h1[1], mo_LK.stl, 2); mo_line(P, h1[0], h1[1], h2[0], h2[1], mo_LK.stl, 1);   // Haken
  const sp = at(8, -2.2), lu = at(7.5, -3.6);
  mo_line(P, at(9.5, -1)[0], at(9.5, -1)[1], sp[0], sp[1], mo_LK.stl, 3);                 // Hahn (Schlange)
  mo_put(P, lu[0], lu[1], C.str, 2); mo_glow(P, lu[0], lu[1], '#ff9030', 1); mo_halo(P, lu[0], lu[1], 1.6, '#ff7020', .35);   // Lunte
  const band = at(20, -.6); mo_put(P, band[0], band[1], C.brs || mo_LK.och, 3);
  if (st){
    for (const [a, b, c2, al] of [[28, -.6, '#fff4c0', 1], [29.5, -.6, '#ffd060', 1], [31, -1.5, '#ff9030', .9], [31, .4, '#ff9030', .9], [32.5, -.6, '#ff7020', .7]]){ const q = at(a, b); mo_glow(P, q[0], q[1], c2, al); }
    const q = at(29, -.6); mo_halo(P, q[0], q[1], 4.5, '#ffb040', .5);
  }
  return at(26.5, -.6);
}
/* Bolzenaustritt (Spitze des aufgelegten Bolzens) relativ zum Anker */
function mo_muzzle(p){ const ux = Math.cos(p.ang), uy = Math.sin(p.ang); return { x: Math.round(p.B[0] + ux * 24 + uy * 1.6), y: Math.round(p.B[1] + uy * 24 - ux * 1.6) }; }
function mo_armbrust(P, p){
  const C = mo_AB, K = mo_LK, bx = p.bx || 0, by = p.by || 0, L = p.lean || 0;
  const ux = Math.cos(p.ang), uy = Math.sin(p.ang);
  const R = [p.B[0] + ux * 5 - uy * 2.5, p.B[1] + uy * 5 + ux * 2.5], Fh = [p.B[0] + ux * 14 - uy * 1.6, p.B[1] + uy * 14 + ux * 1.6];
  const hipN = [1 + bx, -21 + by], hipF = [-2 + bx, -21 + by];
  const shN = [1 + bx + L, -34 + by], shF = [-4 + bx + L, -34 + by];
  const leg = (hip, foot, near) => {
    const ank = [foot[0], foot[1] - 2.5], kn = mo_ik(hip[0], hip[1], ank[0], ank[1], 10, 9, 1), b = near ? 0 : -.2;
    mo_cap(P, kn[0], kn[1], ank[0], ank[1], 1.7, 1.2, near ? C.hos : C.wam, { b, tex: (x, y, lv, u, v) => (Math.abs(v + .2) < .2 ? lv - 1 : undefined) });   // Naht
    mo_shoe(P, ank[0] - 1, foot[1], K.lea, b, null);
    mo_line(P, ank[0] - 1, foot[1] - 3, ank[0] + 1, foot[1] - 3, K.lea, 3); mo_put(P, ank[0], foot[1] - 3, K.stl, 3);   // Riemen mit Schnalle
    mo_end(P);
    mo_cap(P, hip[0], hip[1], kn[0], kn[1], 2.7, 2.0, near ? C.hos : C.wam, { b, d: .4, tex: (x, y, lv, u, v) => (u > .1 && u < .75 && Math.abs(v - .1) < .18 ? lv - 1 : mo_hash(x, y, 31) < .08 ? lv - 1 : undefined) });
    mo_line(P, kn[0] - 1.5, kn[1] + 1.5, kn[0] + 1.5, kn[1] + 1, K.red, near ? 2 : 1);      // Kniebund mit Nestel
    if (near){ mo_put(P, kn[0] - 2, kn[1] + 2, K.red, 3); mo_put(P, kn[0] - 2, kn[1] + 3, K.red, 1); }
    mo_end(P);
  };
  const arm = (sh, hand, near) => {
    const el = mo_ik(sh[0], sh[1], hand[0], hand[1], 7, 7, -1), b = near ? .02 : -.25;
    mo_cap(P, el[0], el[1], hand[0], hand[1], 1.5, 1.2, C.wam, { b, tex: (x, y, lv, u) => (u > .82 ? [K.lin, lv] : undefined) });
    mo_cap(P, sh[0], sh[1], el[0], el[1], 2.3, 1.7, C.wam, { b, d: .4, tex: (x, y, lv, u, v) => (u < .3 ? [C.mai, ((x + y) & 1) ? lv : lv - 1] : undefined) });
    mo_end(P);
    mo_ell(P, hand[0], hand[1], 1.5, 1.4, K.skn, { b: b + .05 });
    mo_end(P, 1);
  };
  // Köcher mit Bolzen an der rechten Hüfte (hinten)
  const qx = -6 + bx, qy = -25 + by;
  mo_poly(P, [[qx - 1, qy - 2], [qx + 2, qy - 2], [qx + 1, qy + 6], [qx - 2, qy + 6]], K.lea, { cyl: .8, b: -.1, tex: (x, y, lv) => (y === qy + 1 ? 4 : undefined) });
  for (let k = 0; k < 3; k++){ mo_put(P, qx - 1 + k, qy - 3 - (k & 1), K.fea, 3 - k); mo_put(P, qx - 1 + k, qy - 4 - (k & 1), k === 1 ? K.red : K.fea, 2); }
  mo_end(P);
  arm(shF, R, false);
  leg(hipF, p.ff, false);
  leg(hipN, p.nf, true);
  // Brigantine: Stoffbezug mit Messingnieten in Dreiergruppen, unten geschoben
  const tq = [[-5 + L, -35], [-2 + L, -36.5], [3 + L, -36.5], [5 + L, -35], [6 + L * .6, -30], [5 + L * .2, -24], [6, -19], [-6, -19.5], [-5 + L * .2, -24], [-6 + L * .7, -30]].map(q => [q[0] + bx, q[1] + by]);
  mo_poly(P, tq, C.brg, { cyl: .9, d: .4, tex: (x, y, lv, u, v) => {
    const X = x - bx - Math.round(L * (1 - v)), Y = y - by;
    if (Y > -23 && Y < -19 && (Y === -22 || Y === -20)) return lv - 1;                          // Geschübe des Schoßes
    if (Y < -23 && ((Y + 40) % 3 === 0) && ((X + 40) % 3 !== 2)) return [C.brs, clamp(lv, 1, 3)]; // Nietreihen
    if (Y > -23 && (X + 40) % 2 === 0 && (Y === -21)) return [C.brs, 2];
    return undefined;
  } });
  // Mittelnaht vorn mit Schnallen
  for (let y = -33; y <= -24; y++) mo_put(P, 4 + bx + L * (y < -28 ? .6 : .3), y + by, C.brg, 0);
  mo_put(P, 4 + bx + L * .5, -30 + by, K.stl, 3); mo_put(P, 4 + bx + L * .3, -26 + by, K.stl, 3);
  // Gürtel
  for (let x = -5; x <= 5; x++) mo_put(P, x + bx + L * .2, -24 + by, K.lea, x & 1 ? 2 : 1);
  mo_end(P);
  // Kettenkragen über den Schultern
  mo_poly(P, [[-5, -35], [-2, -36.5], [3, -36.5], [6, -35], [5.5, -32], [1, -31], [-3, -31.5], [-6, -32.5]].map(q => [q[0] + bx + L, q[1] + by]), C.mai, { cyl: .8, tex: (x, y, lv) => ((x + y * 2) & 3) === 0 ? lv - 1 : ((x + y) & 1 ? lv : lv + 1) });
  mo_line(P, -5 + bx + L, -32 + by, 5 + bx + L, -31 + by, C.mai, 0);
  mo_end(P);
  // Winde (Krapfenwinde) am Gürtel, linke Hüfte
  const wx = 1 + bx, wy = -21 + by;
  mo_ell(P, wx, wy, 2, 2, K.stl, { k: 1.3 }); mo_put(P, wx, wy, K.stl, 0); mo_line(P, wx + 1, wy, wx + 3, wy + 2, K.stl, 3); mo_put(P, wx + 3, wy + 3, K.wod, 2);
  mo_line(P, wx - 1, wy + 2, wx - 2, wy + 6, K.stl, 1);  // Zahnstange
  mo_end(P, 1);
  // Kopf: Gesicht mit Schnurrbart, Eisenhut mit Grat und Nieten
  const hx = p.hx + bx, hy = p.hy + by;
  const F = { h: [K.hai, 1], H: [K.hai, 2], a: [K.skn, 1], b: [K.skn, 2], c: [K.skn, 3], d: [K.skn, 4], e: [mo_DARK, 0], m: [mo_DARK, 1], n: [K.skn, 0], s: [K.skn, 1] };
  mo_stamp(P, [
    "hhbbbb..",
    "hhbccc..",
    "hcbebce.",
    "hbcccccd",
    "hbbccnc.",
    "hHhhhHh.",
    ".hbmmb..",
    ".hsbbs..",
    "..hss..."], F, hx - 4, hy - 3);
  mo_end(P, 1);
  mo_ell(P, hx - .5, hy - 4.5, 4.2, 3.4, C.hat, { k: 1.1, b: -.08, tex: (x, y, lv) => (mo_hash(x, y, 5) < .1 ? [C.rst, 1] : undefined) });
  mo_poly(P, [[hx - 8, hy - 1.5], [hx - 4, hy - 3.6], [hx + 4, hy - 3.6], [hx + 7.5, hy - 1.2], [hx + 7, hy - .2], [hx + 3.5, hy - 2], [hx - 4, hy - 2], [hx - 7.5, hy - .4]], C.hat, { cyl: .6, ny: -.4, b: .05,
    tex: (x, y, lv) => (mo_hash(x, y, 9) < .14 ? [C.rst, 2] : undefined) });
  mo_line(P, hx - 3, hy - 7.6, hx + 2, hy - 7.6, C.hat, 4);                   // Grat
  for (const q of [-3, 0, 3]) mo_put(P, hx + q, hy - 3, C.hat, 4);           // Nieten des Futterbands
  mo_end(P, 1);
  // Armbrust, hintere Hand am Abzug, vordere Hand stützt
  const muz = mo_xbow(P, p.B, p.ang, p.fired);
  mo_end(P, 1);
  mo_ell(P, R[0], R[1], 1.5, 1.4, K.skn, { b: -.05 }); mo_end(P, 1);
  arm(shN, Fh, true);
  if (p.aim){ mo_glow(P, muz[0], muz[1], '#ffffff', 1); mo_glow(P, muz[0] + 1, muz[1], '#fff3c8', .7); mo_glow(P, muz[0], muz[1] - 1, '#fff3c8', .6); mo_glow(P, muz[0], muz[1] + 1, '#fff3c8', .6); mo_glow(P, muz[0] + 2, muz[1], '#fff3c8', .3); }
  if (p.fired) for (let k = 0; k < 6; k++) mo_glow(P, muz[0] - 2 + k * 1.2, muz[1] + (k > 2 ? -1 : 0), '#f0ead8', .55 - k * .08);   // Schusslinie
}
const mo_ARMBRUST = {
  idle: [
    { hx: 3, hy: -38, nf: [2, 0], ff: [-3, 0], B: [-6, -24], ang: -.12 },
    { by: 1, hx: 3, hy: -38, nf: [2, 0], ff: [-3, 0], B: [-6, -23], ang: -.12 }],
  move: [
    { hx: 3, hy: -38, nf: [4, 0], ff: [-5, 0], B: [-6, -24], ang: -.16 },
    { by: -1, hx: 3, hy: -38, nf: [0, 0], ff: [-1, -3], B: [-6, -25], ang: -.16 },
    { hx: 3, hy: -38, nf: [-4, 0], ff: [4, 0], B: [-6, -24], ang: -.16 },
    { by: -1, hx: 3, hy: -38, nf: [1, -3], ff: [-1, 0], B: [-6, -25], ang: -.16 }],
  act: [
    { bx: -1, lean: 1, hx: 3, hy: -38, nf: [5, 0], ff: [-5, 0], B: [-2, -34], ang: 0, aim: 1 },
    { bx: -2, lean: -1, hx: 1, hy: -38, nf: [5, 0], ff: [-6, 0], B: [-4, -35], ang: -.1, fired: 1 }]
};
/* Zottiges Fell: an freien Kanten in Richtung (dx,dy) Haarspitzen ansetzen */
function mo_shag(P, mats, dx, dy, prob, seed, len, cur){   // cur: nur das laufende Teil
  const { w, h, M, V } = P, add = [], pt = P.part;
  const xa = cur ? Math.max(1, P.x0) : 1, xb = cur ? Math.min(w - 2, P.x1) : w - 2, ya = cur ? Math.max(1, P.y0) : 1, yb = cur ? Math.min(h - 2, P.y1) : h - 2;
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++){
    const i = y * w + x; if (!mats.includes(M[i]) || (cur && P.T[i] !== pt)) continue;
    const j = (y + dy) * w + x + dx; if (M[j]) continue;
    if (mo_hash(x >> 1, y, seed) < prob) add.push([x, y, M[i], V[i]]);
  }
  for (const [x, y, m, v] of add) for (let k = 1; k <= (len || 1); k++){
    const xx = x + dx * k + (k > 1 ? -Math.sign(dx || 1) : 0), yy = y + dy * k;
    if (xx < 0 || yy < 0 || xx >= w || yy >= h) break;
    const j = yy * w + xx; if (M[j]) break;
    M[j] = m; V[j] = Math.max(0, v - k + 1); P.T[j] = P.part;
    if (xx < P.x0) P.x0 = xx; if (xx > P.x1) P.x1 = xx; if (yy < P.y0) P.y0 = yy; if (yy > P.y1) P.y1 = yy;
  }
}

/* ---------- Werwolf: im Geist von Cranachs Holzschnitt (um 1512) ein Wolfsmensch, aufrecht und gebückt, Mähne, Klauen, Reste der Bruech, glühende Augen ---------- */
const mo_WW = {
  fur: mo_mat('#141011', '#241c19', '#372b25', '#4d3e33', '#665343', '#816b56'),   // Fell, graubraun
  bel: mo_mat('#30271e', '#4a3e31', '#665847', '#82735e', '#9b8c75'),              // Kehle, Brust, Bauch
  skn: mo_mat('#1a1314', '#2f2425', '#4a3a38', '#6a5450'),                         // Nase, Lefzen, Ohr innen
  mou: mo_mat('#26090b', '#4c1416', '#74241f', '#93392d'),                         // Rachen, Zunge
  cl:  mo_mat('#2a2620', '#5e5848', '#99917a', '#cbc3a8'),                         // Klauen
  lin: mo_mat('#3d392f', '#5c5647', '#7c7460', '#9a917a', '#b3aa90'),              // Leinenfetzen der Bruech
  rop: mo_mat('#231a10', '#3e311f', '#5b4a30', '#6e5c3e')                          // Strick
};
/* Fellstriche längs eines Glieds der Länge L (px) */
function mo_strand(L, seed){
  return (x, y, lv, u, v) => {
    const lane = Math.round(v * 2.6), seg = Math.floor((u * L + mo_hash(lane, 7, seed) * 3) / 3), q = mo_hash(lane + 40, seg, seed);
    return q < .26 ? lv + 1 : q > .8 ? lv - 1 : undefined;
  };
}
/* Fellstriche auf Flächen, schräg mit Neigung k */
const mo_furPoly = (seed, k) => (x, y, lv) => {
  const lane = Math.round(x - y * k), seg = Math.floor((y + mo_hash(lane, 3, seed) * 3) / 3), q = mo_hash(lane + 40, seg, seed);
  return q < .25 ? lv + 1 : q > .8 ? lv - 1 : undefined;
};
/* Pranke: drei kräftige Finger mit langen, hellen Krallen in Richtung (dx,dy) */
function mo_wclaw(P, x, y, dx, dy, near, spread){
  const C = mo_WW, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, px = -uy, py = ux, b = near ? .08 : -.3;
  mo_ell(P, x, y, 2.1, 1.9, C.fur, { b, tex: mo_furPoly(5, 0) });
  for (let f = -1; f <= 1; f++){
    const o = f * (spread ? 1.6 : 1.25), fl = 2.4 - Math.abs(f) * .5;
    const x0 = x + ux * 1.3 + px * o, y0 = y + uy * 1.3 + py * o;
    const x1 = x0 + ux * fl + px * f * (spread ? .9 : .2), y1 = y0 + uy * fl + py * f * (spread ? .9 : .2);
    mo_line(P, x0, y0, x1, y1, C.fur, near ? (f < 1 ? 3 : 2) : 1);
    // Kralle: gekrümmt, zur Spitze heller
    const cx = x1 + ux * 1.1, cy = y1 + uy * 1.1;
    mo_put(P, cx, cy, C.cl, near ? 1 : 0); mo_put(P, cx + ux + py * .6, cy + uy - px * .6, C.cl, near ? 3 : 2);
  }
}
/* Kopf im Profil (Blick rechts), Ursprung = Auge. Oberschädel mit Oberkiefer, Unterkiefer je nach Öffnung j */
const mo_WWHEAD = [
  "....6..4............",
  "...65..43...........",
  "...6pP.4P2..........",
  "..56pP34P2..........",
  "..556654433.........",
  ".45666656654433.....",
  "3455655KYy55554433..",
  "34454454544444443Nn.",
  "23444344654444432nn.",
  "23344332llwllllWlwl.",
  "23333..........W...."];
const mo_WWRUFF = [
  "23444bc...",
  "234443bc..",
  ".234433bc.",
  "..23433cbb",
  "..12.32bba",
  "...1..2.a."];
const mo_WWJAW = [
  "l2w23W33l.",
  "2333333332",
  ".12222221."];
function mo_wwHead(P, ex, ey, j){
  const C = mo_WW, F = C.fur, ox = ex - 8, oy = ey - 6;
  const map = { '1': [F, 0], '2': [F, 1], '3': [F, 2], '4': [F, 3], '5': [F, 4], '6': [F, 5],
    a: [C.bel, 0], b: [C.bel, 1], c: [C.bel, 2], d: [C.bel, 3],
    K: [mo_DARK, 0], p: [C.skn, 3], P: [C.skn, 1], n: [C.skn, 0], N: [C.skn, 3], l: [C.skn, 0],
    W: [mo_BONE, 4], w: [mo_BONE, 2], Y: [mo_BONE, 4, '#fff6b8', 1], y: [C.skn, 0, '#ffb428', .75] };
  const off = i => Math.round(j * (i + 2) / 12);
  // Halskrause hinter allem, sinkt mit dem Kiefer
  mo_stamp(P, mo_WWRUFF, map, ox, oy + 10 + (j > 2 ? 1 : 0));
  // Rachen zwischen Ober- und Unterkiefer, Zunge unten
  if (j) for (let i = 1; i < 10; i++) for (let y = 9; y <= 9 + off(i); y++)
    mo_put(P, ox + 6 + i, oy + y, C.mou, y === 9 + off(i) && i > 2 ? 2 + (i & 1) : i < 3 ? 0 : 1);
  // Unterkiefer, vorn stärker gesenkt
  for (let i = 0; i < 10; i++) for (let r = 0; r < 3; r++){
    const e = map[mo_WWJAW[r][i]]; if (!e) continue;
    mo_put(P, ox + 6 + i, oy + 10 + off(i) + r, e[0], e[1]);
  }
  mo_stamp(P, mo_WWHEAD, map, ox, oy);
  // Geifer an den Fängen
  if (j > 2){ mo_put(P, ox + 15, oy + 11, mo_BONE, 3); mo_put(P, ox + 15, oy + 12, mo_MO.wet, 1); mo_put(P, ox + 14, oy + 14, mo_MO.wet, 0); }
  mo_halo(P, ex, ey, 3, '#ffb428', .42);
}
function mo_werwolf(P, p){
  const C = mo_WW, F = C.fur, H = p.hip, Ch = p.ch;
  const dx = Ch[0] - H[0], dy = Ch[1] - H[1], dl = Math.hypot(dx, dy), nx = -dy / dl, ny = dx / dl;   // n zeigt nach vorn
  const at = (t, o) => [H[0] + dx * t + nx * o, H[1] + dy * t + ny * o];
  const hipN = p.nhip || [H[0] + 1, H[1] + 1], hipF = p.fhip || [H[0] - 2, H[1]];
  const knee = (hip, paw, hk) => { const hock = hk || [paw[0] - 2.5, paw[1] - 6.5 + (p.tuck || 0)]; return [hock, mo_ik(hip[0], hip[1], hock[0], hock[1], 10, 9, 1)]; };
  // Bein als Zehengänger: Hüfte, Knie, Sprunggelenk, Pfote
  const leg = (hip, paw, near, hk) => {
    const [hock, kn] = knee(hip, paw, hk), b = near ? .1 : -.38;
    const pd = hk ? [paw[0] - hock[0], paw[1] - hock[1]] : [1, 0], pl = Math.hypot(pd[0], pd[1]), qx = pd[0] / pl, qy = pd[1] / pl;
    mo_cap(P, hock[0], hock[1], paw[0], paw[1] - 1.2, 1.5, 1.1, F, { b });
    mo_cap(P, kn[0], kn[1], hock[0], hock[1], 2.4, 1.5, F, { b, tex: mo_strand(9, near ? 11 : 12) });
    mo_put(P, hock[0] - 1, hock[1], F, near ? 2 : 0);                                     // Fersenhöcker
    // Pfote: Zehen und Krallen
    const pc = hk ? [paw[0] + qx, paw[1] + qy - .5] : [paw[0] + 1.2, paw[1] - 1];
    mo_ell(P, pc[0], pc[1], 2.5, 1.4, F, { b: b + .05 });
    for (let k = 0; k < 3; k++){
      const cx = hk ? pc[0] + qx * 2.4 + qy * (k - 1) : paw[0] + 3 + k * .7, cy = hk ? pc[1] + qy * 2.4 - qx * (k - 1) : paw[1] - (k === 2 ? 0 : 1) + (k === 0 ? 0 : 0);
      mo_put(P, cx, cy, C.cl, near ? 3 - (k >> 1) : 1);
    }
    if (!hk){ mo_put(P, paw[0] + 1, paw[1] - 1, F, 0); mo_put(P, paw[0] + 2, paw[1] - 1, F, near ? 3 : 1); }
    mo_end(P);
    mo_cap(P, hip[0], hip[1], kn[0], kn[1], 3.8, 2.6, F, { b, d: .3, tex: mo_strand(10, near ? 13 : 14) });
    mo_shag(P, [F], -1, 0, .4, near ? 31 : 32, 1, true);
    mo_end(P);
  };
  const arm = (sh, hand, near) => {
    const el = mo_ik(sh[0], sh[1], hand[0], hand[1], 9, 9, p.armBend || -1), b = near ? .12 : -.38;
    mo_cap(P, el[0], el[1], hand[0], hand[1], 1.9, 1.4, F, { b, tex: mo_strand(9, near ? 3 : 4) });
    mo_cap(P, sh[0], sh[1], el[0], el[1], 2.9, 2, F, { b, d: .3, tex: mo_strand(9, near ? 5 : 6) });
    mo_put(P, el[0] - 1, el[1] + 1, F, near ? 1 : 0); mo_put(P, el[0] - 2, el[1] + 2, F, near ? 2 : 0);   // Ellbogenbüschel
    mo_wclaw(P, hand[0], hand[1], hand[0] - el[0], hand[1] - el[1], near, p.spread);
    mo_shag(P, [F], -1, 1, .4, near ? 7 : 8, 2, true);
    mo_end(P);
  };
  // Schwanz: buschig, hängt nach hinten unten
  const tr = at(.02, -3), tm = p.tm ? [H[0] + p.tm[0], H[1] + p.tm[1]] : [tr[0] - 5, tr[1] + 5], tt = p.tt ? [H[0] + p.tt[0], H[1] + p.tt[1]] : [tr[0] - 7, tr[1] + 13];
  mo_cap(P, tr[0], tr[1], tm[0], tm[1], 1.3, 2.1, F, { b: -.15, tex: mo_strand(7, 21) });
  mo_cap(P, tm[0], tm[1], tt[0], tt[1], 2.1, .7, F, { b: -.2, tex: mo_strand(8, 22) });
  mo_shag(P, [F], -1, 1, .5, 23, 2, true); mo_shag(P, [F], 1, 1, .3, 24, 1, true);
  mo_end(P);
  arm(p.fs, p.fh, false);
  leg(hipF, p.fp, false, p.fhk);
  // Rumpf: tiefer Brustkorb, schmale Lende
  mo_poly(P, [at(-.12, -3.6), at(.25, -3.4), at(.6, -4.6), at(.95, -4.4), at(1.18, -1.5), at(1.12, 4.6), at(.78, 5.8), at(.45, 3.6), at(.15, 3.8), at(-.08, 3)], F,
    { cyl: .8, d: .3, tex: mo_furPoly(3, -nx * .8) });
  // Brust und Bauch heller, Rippenbögen
  const b0 = at(.98, 3), b1 = at(.3, 2.4);
  mo_cap(P, b0[0], b0[1], b1[0], b1[1], 2.6, 1.6, C.bel, { b: -.05, d: .3, tex: (x, y, lv, u, v) => (u > .3 && u < .75 && (Math.round(u * 9) & 1) && v < .4 ? lv - 1 : mo_strand(8, 15)(x, y, lv, u, v)) });
  mo_shag(P, [F, C.bel], 0, -1, .45, 13, 1, true);   // Rückenkamm
  mo_shag(P, [C.bel], 1, 1, .4, 14, 1, true);
  mo_end(P);
  leg(hipN, p.np, true, p.nhk);
  // Reste der Bruech: zerrissenes Leinen um die Lende, ausgefranster Saum
  const [, knN] = knee(hipN, p.np, p.nhk), tx = knN[0] - hipN[0], ty = knN[1] - hipN[1], tl = Math.hypot(tx, ty), sx = -ty / tl * 3.4, sy = tx / tl * 3.4;
  const hm = [hipN[0] + tx * .5, hipN[1] + ty * .5], hem = [];
  for (let k = 0; k <= 6; k++){ const s = k / 6, z = (k & 1 ? .16 : 0) + (k === 3 ? .1 : 0); hem.push([hm[0] - sx * (1 - 2 * s) - tx * z, hm[1] - sy * (1 - 2 * s) - ty * z]); }
  mo_poly(P, [at(.12, -4.1), at(.14, 4.2), ...hem, at(-.14, -3.9)], C.lin, { cyl: .8, d: .3,
    tex: (x, y, lv, u, v) => (mo_hash(x, y, 41) < .07 ? [mo_DARK, 1] : ((x + y * 2) % 5 === 0 ? lv - 1 : mo_N(x * .5 + 9, y * .5) < .3 ? lv - 1 : undefined)) });
  // Strick als Gürtel, Knoten mit hängendem Ende
  const g0 = at(.13, -4.2), g1 = at(.13, 4.3);
  mo_line(P, g0[0], g0[1], g1[0], g1[1], C.rop, (k, n) => (k & 1 ? 2 : 3));
  mo_put(P, g1[0] - 1, g1[1] + 1, C.rop, 3); mo_line(P, g1[0] - 1, g1[1] + 2, g1[0] - 2, g1[1] + 5, C.rop, 1);
  mo_end(P);
  // Mähne über Nacken und Schultern: Strähnen nach hinten oben
  const mn = at(1.1, -1.4);
  mo_ell(P, mn[0], mn[1], 5.2, 4.4, F, { d: .3, b: .02, tex: mo_furPoly(9, .6) });
  for (let k = 0; k < 9; k++){
    const a = -2.2 - k * .2 + (p.mane || 0), r0 = 3.4, r1 = 6.2 + (k & 1) * 1.6, s0 = [mn[0] + Math.cos(a) * r0, mn[1] + Math.sin(a) * r0 * .9], s1 = [mn[0] + Math.cos(a) * r1, mn[1] + Math.sin(a) * r1 * .9];
    mo_line(P, s0[0], s0[1], s1[0], s1[1], F, (q, n) => (q === n ? 1 : k < 4 ? 4 - (q > 2 ? 1 : 0) : 3 - (q > 2 ? 1 : 0)));
  }
  mo_shag(P, [F], -1, -1, .5, 3, 1, true);
  mo_end(P, 1);
  mo_wwHead(P, p.hd[0], p.hd[1], p.jaw || 0);
  mo_end(P, 1);
  arm(p.ns, p.nh, true);
}
/* Posen: hip/ch = Becken, Brust; hd = Auge; np/fp = Pfoten (nhk/fhk = Sprunggelenk, falls frei); ns/nh, fs/fh = Schulter, Hand; tm/tt = Schwanz relativ zum Becken */
const mo_WERWOLF = {
  idle: [
    { hip: [-4, -24], ch: [3, -37], hd: [11, -42], np: [3, 0], fp: [-6, 0], ns: [5, -36], nh: [14, -26], fs: [1, -37], fh: [11, -29], tm: [-8, 3], tt: [-12, 10] },
    { hip: [-4, -23], ch: [3, -36], hd: [11, -41], jaw: 1, mane: .15, np: [3, 0], fp: [-6, 0], ns: [5, -35], nh: [14, -24], fs: [1, -36], fh: [11, -27], tm: [-8, 3], tt: [-13, 9] }],
  move: [
    { hip: [-2, -24], ch: [5, -36], hd: [13, -41], np: [6, 0], fp: [-7, 0], ns: [6, -35], nh: [6, -21], fs: [2, -36], fh: [15, -27], tm: [-8, 2], tt: [-15, 6] },
    { hip: [-2, -25], ch: [5, -37], hd: [13, -42], mane: .2, np: [1, 0], fp: [-2, -4], ns: [6, -36], nh: [11, -22], fs: [2, -37], fh: [12, -25], tm: [-8, 1], tt: [-16, 4] },
    { hip: [-2, -24], ch: [5, -36], hd: [13, -41], np: [-6, 0], fp: [6, 0], ns: [6, -35], nh: [16, -27], fs: [2, -36], fh: [5, -22], tm: [-8, 2], tt: [-15, 6] },
    { hip: [-2, -25], ch: [5, -37], hd: [13, -42], mane: .2, np: [1, -4], fp: [-1, 0], ns: [6, -36], nh: [13, -24], fs: [2, -37], fh: [10, -23], tm: [-8, 1], tt: [-16, 4] }],
  act: [
    { hip: [-6, -15], ch: [3, -25], hd: [11, -28], jaw: 2, tuck: 2, mane: -.3, np: [0, 0], fp: [-6, 0], ns: [4, -25], nh: [14, -5], fs: [1, -26], fh: [10, -5], tm: [-8, 0], tt: [-15, 1] },
    { hip: [-9, -26], ch: [4, -30], hd: [13, -33], jaw: 4, spread: 1, armBend: 1, mane: -.5, np: [-24, -17], nhk: [-19, -21], fp: [-26, -22], fhk: [-21, -25], nhip: [-8, -25], fhip: [-10, -27],
      ns: [5, -30], nh: [21, -19], fs: [3, -32], fh: [19, -41], tm: [-7, -3], tt: [-15, -6] }]
};
/* ---------- Moorleiche: gegerbte, dunkle Haut, rötliches Haar, Fellkappe und Strick wie beim Mann von Tollund ---------- */
const mo_MO = {
  skn: mo_mat('#120c09', '#22170f', '#352517', '#4b3521', '#634830', '#7e6143'),  // ledrige Haut, nass glänzend
  hai: mo_mat('#2e140b', '#4d2412', '#6c381c'),                                   // vom Moor rot gefärbtes Haar
  cap: mo_mat('#1c150f', '#2f2419', '#463626', '#5a4732'),                        // Fellkappe
  rop: mo_mat('#231a10', '#3e311f', '#5b4a30'),                                   // Strick
  wol: mo_mat('#16150e', '#252317', '#353222', '#46412d'),                        // Wollumhang, vom Moor gefärbt
  wed: mo_mat('#1a2210', '#2c3a1a', '#435326', '#5f6e32', '#7f8a44'),             // Laichkraut, Torfmoos
  wet: mo_mat('#6f8584', '#9fb2ae')                                               // Tropfen
};
function mo_weed(P, x, y, len, seed, lv){
  const R = rng(seed);
  let cx = x;
  for (let k = 0; k < len; k++){ mo_put(P, cx, y + k, mo_MO.wed, clamp((lv === undefined ? 2 : lv) - (k > len - 2 ? 1 : 0) + (R() < .3 ? 1 : 0), 0, 4)); if (R() < .3) cx += R() < .5 ? -1 : 1; }
  return [cx, y + len];
}
function mo_moor(P, p){
  const C = mo_MO, bx = p.bx || 0, by = p.by || 0, t = p.t || 0;
  const leg = (L, near) => {
    const [kx, ky, fx, fy] = L, b = near ? 0 : -.22;
    mo_cap(P, bx - (near ? -1 : 1), -20 + by, kx + bx, ky + by, 1.45, 1.05, C.skn, { b, tex: (x, y, lv, u, v) => (v < -.5 && u > .2 && u < .8 ? lv + 1 : undefined) });
    mo_cap(P, kx + bx, ky + by, fx, fy - 2, 1.2, .9, C.skn, { b, tex: (x, y, lv, u, v) => (v < -.4 && u > .15 ? lv + 1 : mo_hash(x, y, 2) < .18 ? lv - 1 : undefined) });   // Schienbein glänzt
    mo_poly(P, [[fx - 1.6, fy - 2.6], [fx + 1, fy - 2.6], [fx + 3.6, fy - 1.3], [fx + 3.8, fy], [fx - 1.6, fy]], C.skn, { b: b - .05, cyl: .4, ny: -.3 });
    mo_put(P, fx + 3, fy - 1, mo_BONE, near ? 1 : 0); mo_put(P, fx + 1, fy - 1, C.skn, 0);   // Zehennagel, Zehenspalt
    mo_ell(P, kx + bx + .4, ky + by, 1.4, 1.2, C.skn, { b: b + .12 });   // knotiges Knie
    mo_end(P);
  };
  const arm = (A, near) => {
    const [sx, sy, ex, ey, hx, hy] = A.map((v, i) => v + (i % 2 ? by : bx)), b = near ? 0 : -.25;
    mo_cap(P, sx, sy, ex, ey, 1.7, 1.3, C.skn, { b, tex: (x, y, lv, u, v) => (v < -.4 ? lv + 1 : undefined) });
    mo_cap(P, ex, ey, hx, hy, 1.3, 1.05, C.skn, { b });
    mo_claw(P, hx, hy, hx - ex, hy - ey, C.skn, near ? 3 : 2.5, p.open);
    // Kraut hängt vom Arm
    const w0 = mo_weed(P, ex - 1, ey + 1, near ? 5 + (t & 1) : 3, 31 + t + (near ? 5 : 0), near ? 3 : 1);
    if (near) mo_weed(P, (sx + ex) / 2, (sy + ey) / 2 + 1, 4, 77 + t, 2);
    mo_end(P);
    if (near && p.drip !== undefined){ // Tropfen als Glanz, ohne Kontur
      mo_glow(P, w0[0], w0[1] + 1 + p.drip, '#b4ccc6', .85); mo_glow(P, w0[0], w0[1] + p.drip, '#8aa49e', .4);
      mo_glow(P, hx + 1, hy + 3 + ((p.drip + 1) % 3), '#b4ccc6', .75);
    }
  };
  arm(p.fa, false);
  leg(p.fl, false);
  // Rumpf: eingefallen, gekrümmt, Rippen und gefalteter Bauch
  const body = [[-3, -36], [2, -37], [5, -35], [6, -30], [5, -25], [5.5, -20], [3, -18], [-3, -18], [-5, -21], [-5, -27], [-6, -32]].map(q => [q[0] + bx, q[1] + by]);
  mo_poly(P, body, C.skn, { cyl: .9, d: .2, tex: (x, y, lv, u, v) => {
    const Y = y - by, X = x - bx, rx = X > -2 && X < 5 - (Y + 33) * .25;
    if (Y > -33 && Y < -24 && rx) return (Y & 1) ? lv - 1 : lv + (u < .6 ? 1 : 0);                 // Rippenbögen, oben glänzend
    if (Y > -24 && Y < -21 && X > -2 && X < 4) return lv - 1;                                      // eingesunkener Bauch
    if (Y > -23 && Y < -19 && ((X + Y) & 3) === 0) return lv - 1;                                  // Falten der Haut
    if (mo_hash(x, y, 8) < .05) return lv + 2;                                                     // nasser Glanz
    return undefined;
  } });
  mo_line(P, -1 + bx, -34 + by, 4 + bx, -35 + by, C.skn, 4); mo_put(P, 2 + bx, -33 + by, C.skn, 1);   // Schlüsselbein, Brustbein
  // Lendentuch, zerfallen
  mo_poly(P, [[-5, -21], [5.5, -21], [6, -16], [3, -14], [1, -16], [-2, -14], [-5, -16]].map(q => [q[0] + bx, q[1] + by]), C.wol, { cyl: .8, d: .5, tex: (x, y, lv) => (mo_hash(x, y, 6) < .15 ? false : undefined) });
  mo_end(P);
  // Wollumhang über der hinteren Schulter, ausgefranst
  mo_poly(P, [[-5, -35.5], [-1, -37], [1, -35], [-2, -31], [-3, -26], [-4, -21], [-5, -18.5], [-5.6, -22], [-5.6, -27], [-6.2, -31]].map(q => [q[0] + bx, q[1] + by]), C.wol, { cyl: .9, d: .4,
    tex: (x, y, lv, u, v) => (v > .7 && mo_hash(x, y, 12) < .5 ? false : mo_hash(x, y, 14) < .1 ? false : (x & 1) && v > .3 ? lv - 1 : undefined) });
  mo_weed(P, -5 + bx, -27 + by, 6, 11 + t, 2); mo_weed(P, -2 + bx, -31 + by, 4, 15 + t, 3);
  mo_end(P);
  leg(p.nl, true);
  // Kopf: flach gedrückt, eingefallene Augen, Fellkappe mit Kinnriemen, Strick um den Hals
  const hx = p.hx + bx, hy = p.hy + by;
  const F = { a: [C.skn, 1], b: [C.skn, 2], c: [C.skn, 3], d: [C.skn, 4], e: [C.skn, 5], k: [mo_DARK, 0], E: [mo_BONE, 3, '#ffd870', 1], r: [C.hai, 1], R: [C.hai, 2], m: [mo_DARK, 1], T: [mo_BONE, 2] };
  mo_stamp(P, [
    "rRbcdc.",
    "rbcdedc",
    "rbkEckE",
    "rabccbc",
    "rabbbac",
    ".abmmT.",
    "..abba.",
    "...aa.."], F, hx - 3, hy - 3);
  mo_end(P, 1);
  // Kappe aus Schaffell, spitz, Riemen unter dem Kinn
  mo_poly(P, [[hx - 4.5, hy - 2.5], [hx - 3, hy - 6.5], [hx - 1, hy - 7.6], [hx + 2, hy - 7], [hx + 4.5, hy - 3.5], [hx + 4, hy - 2.6], [hx - 4, hy - 1.6]], C.cap, { cyl: .8, ny: -.3, d: .5,
    tex: (x, y, lv) => ((x * 3 + y * 5) % 4 === 0 ? lv - 1 : undefined) });
  mo_line(P, hx - 4, hy - 2.5, hx + 4, hy - 3, C.cap, 0);
  mo_line(P, hx - 3, hy - 2, hx - 2, hy + 3, C.rop, 1);
  mo_put(P, hx - 4, hy - 1, C.hai, 2); mo_put(P, hx - 4, hy, C.hai, 1); mo_put(P, hx - 5, hy + 1, C.hai, 1);
  // Strick um den Hals, Ende hängt herab
  mo_line(P, hx - 4, hy + 5, hx + 2, hy + 5, C.rop, 2); mo_put(P, hx + 2, hy + 5, C.rop, 1);
  mo_line(P, hx - 3, hy + 6, hx - 4, hy + 11, C.rop, 1); mo_put(P, hx - 4, hy + 12, C.rop, 2);
  // Kraut über der Kappe, Strähnen über Stirn und Schulter
  mo_weed(P, hx - 4, hy - 5, 8, 41 + t, 3); mo_weed(P, hx - 1, hy - 7, 3, 47 + t, 4); mo_weed(P, hx + 2, hy - 6, 3, 53 + t, 3); mo_weed(P, hx - 6, hy + 2, 6, 59 + t, 2);
  mo_put(P, hx + 1, hy - 6, C.cap, 3); mo_put(P, hx - 2, hy - 5, C.cap, 3);
  mo_end(P, 1);
  mo_halo(P, hx + .5, hy - 1, 2.2, '#ffc850', .35); mo_halo(P, hx + 3.5, hy - 1, 2, '#ffc850', .3);
  arm(p.na, true);
}
const mo_MOOR = {
  idle: [
    { t: 0, hx: 4, hy: -38, fl: [-1, -11, -2, 0], nl: [2, -11, 3, 0], fa: [-1, -33, 1, -26, 2, -19], na: [2, -33, 6, -28, 10, -27], drip: 0 },
    { t: 1, by: 1, hx: 4, hy: -38, fl: [-1, -11, -2, 0], nl: [2, -11, 3, 0], fa: [-1, -33, 1, -26, 2, -19], na: [2, -33, 6, -27, 10, -26], drip: 2 }],
  move: [
    { t: 0, hx: 5, hy: -38, fl: [-2, -11, -3, 0], nl: [3, -11, 4, 0], fa: [-1, -33, 1, -26, 3, -19], na: [2, -33, 7, -29, 12, -29], drip: 0 },
    { t: 1, by: 1, hx: 5, hy: -38, fl: [0, -11, -1, -2], nl: [2, -11, 1, 0], fa: [-1, -33, 1, -26, 2, -19], na: [2, -33, 7, -28, 12, -28], drip: 1 },
    { t: 2, hx: 5, hy: -38, fl: [2, -11, 4, 0], nl: [-1, -11, -3, 0], fa: [-1, -33, 2, -26, 4, -19], na: [2, -33, 7, -29, 12, -29], drip: 2 },
    { t: 3, by: 1, hx: 5, hy: -38, fl: [0, -11, 0, 0], nl: [2, -11, 2, -2], fa: [-1, -33, 1, -26, 3, -19], na: [2, -33, 7, -28, 12, -28], drip: 0 }],
  act: [
    { t: 1, bx: -1, hx: 3, hy: -39, open: 1, fl: [-2, -11, -4, 0], nl: [3, -11, 4, 0], fa: [-1, -33, 2, -39, 6, -44], na: [2, -33, 7, -38, 11, -43], drip: 1 },
    { t: 2, bx: 2, by: 2, hx: 8, hy: -35, open: 1, fl: [-2, -11, -5, 0], nl: [6, -11, 8, 0], fa: [1, -31, 8, -27, 14, -23], na: [3, -31, 10, -25, 16, -21], drip: 2 }]
};
/* ---------- Pestratte: Hausratte (Rattus rattus, um 1520 die Ratte Europas), schlank, große Ohren, langer nackter Schwanz; räudig, Schwären, rot glühende Augen ---------- */
const mo_RT = {
  fur: mo_mat('#131012', '#211c1c', '#312927', '#433835', '#574a44', '#6b5d55'),
  bar: mo_mat('#44302f', '#634644', '#835f58', '#a07a6f'),   // kahle Haut, Schwanz, Pfoten, Ohr innen
  sor: mo_mat('#2a1210', '#4a1e18', '#683022')               // verkrustete Schwären
};
/* Fellstriche längs des Leibs (waagerecht) */
const mo_ratTex = (x, y, lv) => { const seg = Math.floor((x + mo_hash(y, 5, 61) * 4) / 3), q = mo_hash(y + 30, seg, 62); return q < .24 ? lv + 1 : q > .82 ? lv - 1 : undefined; };
function mo_ratte(P, p){
  const C = mo_RT, bx = p.bx || 0, by = p.by || 0, a = p.tilt || 0, sx = p.sx || 1, ar = p.arch || 0, ca = Math.cos(a), sa = Math.sin(a);
  const R = (x, y) => { x *= sx; if (x > -7 && x < 3) y -= ar * (1 - Math.abs(x + 2) / 5); const xr = x + 8, yr = y + 3; return [bx - 8 + xr * ca - yr * sa, by - 3 + xr * sa + yr * ca]; };
  // Schwanz: nackt, geschuppt (Ringe), länger als der Leib, in flachem Bogen zum Boden
  const t0 = R(-8, -3.4), tl = p.tail || 0;
  let px = t0[0], py = t0[1];
  for (let k = 1; k <= 11; k++){
    const nx = t0[0] - k * .95, ny = Math.min(-1, t0[1] - .7 * Math.sin(k * .42) * (k < 5 ? 1 : 0) + Math.max(0, k - 3) * .45 + Math.sin(k * .7 + tl) * .6);
    mo_line(P, px, py, nx, ny, C.bar, k % 3 === 0 ? 0 : k > 7 ? 1 : 2); px = nx; py = ny;
  }
  mo_line(P, px, py, px - 2, Math.min(-1, py + 1), C.bar, 1);
  mo_end(P, 0);
  // fernes Beinpaar
  const hp = R(-5, -2.5), fp = R(3.5, -2.2);
  mo_line(P, hp[0], hp[1], p.hf[0], -1, C.bar, 0); mo_line(P, p.hf[0], -1, p.hf[0] + 1, -1, C.bar, 1);
  mo_line(P, fp[0], fp[1], p.ff[0], p.ff[1] !== undefined ? p.ff[1] : -1, C.bar, 0);
  mo_end(P, 0);
  // Leib: gewölbter Rücken, Bauch heller abgesetzt
  const body = [[-8.4, -3.6], [-7.6, -6.4], [-5, -8.2], [-2, -8.8], [1.5, -8.2], [4, -7], [5, -5], [4.6, -2.6], [2, -1.4], [-2, -1.2], [-6, -1.5], [-8.2, -2.2]].map(q => R(q[0], q[1]));
  mo_poly(P, body, C.fur, { cyl: .35, vc: .9, d: .3, tex: mo_ratTex });
  // Räude: kahle Flecken mit Krusten und Schwären
  for (const [x, y, m, l] of [[-3, -8, C.bar, 2], [-2, -8, C.bar, 3], [-2, -7, C.sor, 2], [-3, -7, C.bar, 1], [-1, -7, C.sor, 0], [1, -6, C.bar, 2], [2, -6, C.bar, 1], [1, -5, C.sor, 1],
    [-6, -5, C.bar, 1], [-6, -4, C.sor, 2], [-5, -4, C.bar, 0], [-1, -4, C.sor, 1]]){ const q = R(x, y); mo_put(P, q[0], q[1], m, l); }
  mo_shag(P, [C.fur], 0, -1, .55, 21, 1, true);   // struppiger Rücken
  mo_shag(P, [C.fur], -1, 0, .35, 23, 1, true);
  mo_end(P);
  // Kopf: spitze Schnauze, rosige Nase
  const hc = R(6.2, -4.8);
  mo_ell(P, hc[0], hc[1], 2.9, 2.4, C.fur, { b: .16, d: .3, tex: mo_ratTex });
  mo_poly(P, [R(6, -6.8), R(8.8, -5.4), R(10.7, -4), R(10.6, -3.1), R(8.4, -2.6), R(5.6, -2.6)], C.fur, { cyl: .3, vc: .9, b: .14 });
  const nz = R(10.6, -3.6); mo_put(P, nz[0], nz[1], C.bar, 3); mo_put(P, nz[0] - 1, nz[1] + 1, C.bar, 1);
  const mo0 = R(8, -2.6);
  if (p.bite){ mo_put(P, mo0[0], mo0[1], mo_DARK, 0); mo_put(P, mo0[0] + 1, mo0[1], mo_DARK, 0); mo_put(P, mo0[0] + 2, mo0[1], mo_BONE, 4); mo_put(P, mo0[0] + 2, mo0[1] + 1, mo_BONE, 3); mo_put(P, mo0[0] + 1, mo0[1] + 1, C.bar, 1); }
  else mo_line(P, mo0[0], mo0[1], mo0[0] + 2, mo0[1], C.fur, 0);
  // Auge: glühend rot
  const ey = R(7.4, -5.2); mo_put(P, ey[0], ey[1], C.sor, 2); mo_put(P, ey[0] - 1, ey[1], mo_DARK, 1);
  mo_glow(P, ey[0], ey[1], '#ff7048', 1); mo_halo(P, ey[0], ey[1], 2.2, '#ff3a20', .38);
  // Schnurrhaare
  const wh = R(9.6, -3.8); mo_put(P, wh[0] + 1, wh[1] - 1, mo_BONE, 1); mo_put(P, wh[0] + 2, wh[1] - 1, mo_BONE, 0); mo_put(P, wh[0] + 1, wh[1] + 1, mo_BONE, 1); mo_put(P, wh[0] + 2, wh[1] + 2, mo_BONE, 0);
  mo_end(P);
  // großes, dünnes Ohr, innen rosig
  const ea = R(4.4, -8.2);
  mo_ell(P, ea[0], ea[1], 2.2, 2.4, C.fur, { lv: 2 }); mo_ell(P, ea[0] + .5, ea[1] + .3, 1.4, 1.6, C.bar, { b: .1 }); mo_put(P, ea[0] - 1, ea[1] - 2, C.fur, 4); mo_put(P, ea[0] + 1, ea[1] + 1, C.bar, 0);
  mo_end(P, 1);
  // nahes Beinpaar: Keule mit langem Hinterfuß, Vorderpfote
  const hn = R(-5.2, -3.8), fn = R(3.6, -2.6);
  mo_ell(P, hn[0], hn[1], 2.7, 2.4, C.fur, { b: .05, tex: mo_ratTex });
  mo_line(P, hn[0], hn[1] + 2, p.hn[0], -1, C.bar, 1); mo_line(P, p.hn[0], -1, p.hn[0] + 2, -1, C.bar, 2); mo_put(P, p.hn[0] + 3, -1, C.bar, 3);
  const fy = p.fn[1] !== undefined ? p.fn[1] : -1;
  mo_line(P, fn[0], fn[1], p.fn[0], fy, C.bar, 1); mo_put(P, p.fn[0] + 1, fy, C.bar, 3);
  mo_end(P, 1);
}
const mo_RATTE = {
  idle: [
    { hf: [-6], ff: [3], hn: [-5], fn: [5] },
    { arch: .6, tilt: -.06, tail: 1.5, hf: [-6], ff: [3], hn: [-5], fn: [5] }],
  move: [
    { sx: 1.08, bx: -1, tail: 0, hf: [-9], ff: [8], hn: [-8], fn: [9] },
    { sx: .9, arch: 1.4, tail: 1.2, hf: [-4], ff: [1], hn: [-3], fn: [3] },
    { tail: 2.4, hf: [-6], ff: [6], hn: [-5], fn: [6] }],
  act: [
    { bx: -1, tilt: -.6, arch: .5, bite: 1, tail: .6, hf: [-6], ff: [3, -8], hn: [-5], fn: [4, -9] },
    { sx: 1.15, bx: 2, by: 1, tilt: .05, bite: 1, tail: 2, hf: [-7], ff: [10], hn: [-6], fn: [11] }]
};

/* ---------- Rabe (Kolkrabe): schwarz mit blauviolettem Glanz, Keilschwanz, zottige Kehle, gefingerte Handschwingen ---------- */
const mo_RB = {
  fea: mo_mat('#09080c', '#121118', '#1c1c27', '#2a2c3c', '#3d4257', '#58607c'),
  bk:  mo_mat('#0e0d0f', '#232125', '#3a373d', '#57535c')
};
const mo_RBL = [12.6, 13.6, 13.2, 12.2, 10.6];   // Länge der fünf Handschwingen (Finger)
/* Flügel als ebene Fläche (u = Spannweite 0..14, v = Tiefe nach hinten 0..6), affin auf den Schirm gelegt: p = S + u*sp + v*ch */
function mo_wing(P, S, sp, ch, near, lit){
  const C = mo_RB, det = sp[0] * ch[1] - sp[1] * ch[0];
  if (Math.abs(det) < .04) return;
  const cs = [[0, -1], [14, -1], [14, 9], [0, 9]].map(([u, v]) => [S[0] + u * sp[0] + v * ch[0], S[1] + u * sp[1] + v * ch[1]]);
  const xa = Math.floor(Math.min(...cs.map(c => c[0]))), xb = Math.ceil(Math.max(...cs.map(c => c[0])));
  const ya = Math.floor(Math.min(...cs.map(c => c[1]))), yb = Math.ceil(Math.max(...cs.map(c => c[1])));
  const base = (near ? 2 : 1) + (lit || 0);
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++){
    const dx = x + .5 - S[0], dy = y + .5 - S[1], u = (dx * ch[1] - dy * ch[0]) / det, v = (sp[0] * dy - sp[1] * dx) / det;
    if (u < -.4 || v < -.7 || u > 14.5) continue;
    let lv = -1;
    // Armschwingen und Deckfedern: Hinterkante gewellt (einzelne Federn)
    const fu = u / 1.5 - Math.floor(u / 1.5), cm = 5.4 - .9 * Math.pow(Math.abs(fu - .5) * 2, 2) - (u < 1.6 ? (1.6 - u) * 1.4 : 0) - Math.max(0, u - 7) * .5;
    if (u <= 9.6 && v <= cm){
      lv = v < .9 ? base + 1 + (lit ? 1 : 0) : v < 2.3 ? base + 1 : base;   // Flügelbug, Deckfedern, Schwingen
      if (v >= 2.3 && fu < .22) lv = base - 1;                             // Federkanten
      if (v >= 2 && v < 2.6) lv = base - 1;                                // Kante der großen Decken
    }
    // Handschwingen: fünf gespreizte Finger
    for (let k = 0; k < 5; k++){
      const vk = .5 + k * 1.15 + Math.max(0, u - 8) * k * .34, L = mo_RBL[k], hw = u > L - 1.2 ? .42 : .66;
      if (u >= 6.5 && u <= L && Math.abs(v - vk) <= hw){
        const f = k === 0 ? base + 1 : base + ((k & 1) ? 0 : -1 + 1);
        lv = Math.abs(v - vk) < .2 && u < L - 1 ? f + 1 : f;               // Schaft heller
        if (k > 0 && v - vk < -.35) lv = base - 1;                          // Überlappung dunkler
      }
    }
    if (lv >= 0) mo_put(P, x, y, C.fea, lv);
  }
}
function mo_rabe(P, p){
  const C = mo_RB, a = p.tilt || 0, ca = Math.cos(a), sa = Math.sin(a);
  const R = (x, y) => [(x * ca - y * sa) * .86, (x * sa + y * ca) * .86], rot = q => [q[0] * ca - q[1] * sa, q[0] * sa + q[1] * ca];
  const ch = rot(p.ch || [-.9, .1]);
  // ferner Flügel (hinter dem Leib, dunkler)
  mo_wing(P, R(2, -2), rot(p.fw), ch, false, p.fl || 0);
  mo_end(P, 0);
  // Schwanz: Keil aus gestaffelten Federn
  mo_poly(P, [R(-3.5, -1.4), R(-8, -2.4), R(-11, -1.2), R(-12.6, .2), R(-11, 1.6), R(-8, 2.6), R(-3.5, 1.6)], C.fea, { cyl: .2, vc: .7, b: .05,
    tex: (x, y, lv, u, v) => (Math.abs(v - .5) < .08 ? lv + 1 : (Math.round(v * 6) & 1) ? lv - 1 : u < .3 ? lv + 1 : undefined) });
  mo_end(P, 0);
  // Füße: angelegt oder als Fänge vorgestreckt
  if (p.claw){
    const f0 = R(1, 2.2), f1 = R(5, 5.6);
    mo_line(P, f0[0], f0[1], f1[0], f1[1], C.bk, 2);
    const t1 = R(7, 5.2), t2 = R(6.6, 7.2), t3 = R(3.6, 7);
    mo_line(P, f1[0], f1[1], t1[0], t1[1], C.bk, 3); mo_line(P, f1[0], f1[1], t2[0], t2[1], C.bk, 2); mo_line(P, f1[0], f1[1], t3[0], t3[1], C.bk, 1);
    for (const t of [t1, t2, t3]) mo_put(P, t[0], t[1], mo_BONE, 1);
  } else { const f0 = R(-1, 2.6), f1 = R(-4.5, 3.2); mo_line(P, f0[0], f0[1], f1[0], f1[1], C.bk, 1); mo_put(P, f1[0] - 1, f1[1], C.bk, 2); }
  mo_end(P, 0);
  // Rumpf mit Schuppenmuster, Hals, Kopf
  const b0 = R(0, 0), n0 = R(4, -1), h0 = R(6.2, -1.8);
  mo_ell(P, b0[0], b0[1], 5.4, 3.2, C.fea, { d: .4, tex: (x, y, lv) => (((x + (y & 1) * 2) & 3) === 0 && lv > 1 ? lv + 1 : mo_hash(x, y, 13) < .15 ? lv - 1 : undefined) });
  mo_ell(P, n0[0], n0[1], 2.7, 2.5, C.fea, { d: .4 });
  mo_ell(P, h0[0], h0[1], 2.9, 2.6, C.fea, { b: .02, d: .3 });
  // zottige Kehlfedern
  for (const [x, y, l] of [[5, 1, 2], [4, 2, 1], [6, 1.4, 1], [7, .6, 2], [3, 2.2, 2], [5, 2.4, 0]]){ const q = R(x, y); mo_put(P, q[0], q[1], C.fea, l); }
  // Schnabel: kräftig, First gebogen, Nasenborsten
  mo_poly(P, [R(7.6, -3.8), R(9.8, -3.4), R(11.8, -2.4), R(12.8, -.9), R(11.2, -.5), R(7.8, -.1)], C.bk, { cyl: .2, ny: -.3, b: -.1 });
  const kf = R(9.6, -3.1), kf2 = R(10.8, -2.6); mo_put(P, kf[0], kf[1], C.bk, 3); mo_put(P, kf2[0], kf2[1], C.bk, 3);
  const nb = R(8, -3.2); mo_put(P, nb[0], nb[1], C.fea, 3);
  if (p.caw){
    const m0 = R(8, .1), m1 = R(11.4, 1.8); mo_line(P, m0[0], m0[1], m1[0], m1[1], C.bk, 2);
    const q0 = R(9, -.2), q1 = R(10, .4), q2 = R(9, .5); mo_put(P, q0[0], q0[1], mo_WW.mou, 1); mo_put(P, q1[0], q1[1], mo_DARK, 0); mo_put(P, q2[0], q2[1], mo_WW.mou, 2);
  } else { const m0 = R(8.2, -1.4), m1 = R(11.4, -1.2); mo_line(P, m0[0], m0[1], m1[0], m1[1], C.bk, 0); }
  // Auge mit Glanzlicht
  const e0 = R(6.6, -2.6); mo_put(P, e0[0], e0[1], mo_DARK, 0); mo_put(P, e0[0] + 1, e0[1], C.fea, 1); mo_put(P, e0[0], e0[1] - 1, C.fea, 4);
  mo_glow(P, e0[0], e0[1], '#d8d4c4', .6);
  mo_end(P, 0);
  // naher Flügel
  mo_wing(P, R(1, -1.4), rot(p.nw), ch, true, p.nl || 0);
  mo_end(P, 1);
}
/* Posen: nw/fw = Spannrichtung naher/ferner Flügel (Länge ~ Verkürzung), nl/fl = Aufhellung, tilt = Neigung des Leibs */
const mo_RABE = {
  idle: [
    { nw: [-.14, -.78], fw: [-.05, -.86], nl: 1 },
    { nw: [-.04, -.5], fw: [0, -.74] }],
  move: [
    { nw: [-.36, -1], fw: [-.16, -.88], nl: 1 },
    { nw: [.12, .6], fw: [.05, -.78] },
    { nw: [-.14, 1], fw: [-.06, .66] },
    { nw: [-.06, .36], fw: [-.03, -.42] }],
  act: [
    { tilt: -.35, caw: 1, nw: [-.5, -.95], fw: [-.25, -.85], nl: 1, fl: 1 },
    { tilt: .42, claw: 1, nw: [-.9, -.38], fw: [-.82, -.6], ch: [-.55, .4] }]
};

/* ---------- Irrlicht: fahlgrüne, flackernde Flamme mit Lichthof ---------- */
const mo_IR = mo_mat('#2a7a52b0', '#47c483d8', '#86f0b0', '#c4ffd8', '#f0fff6');
const mo_IRC = { m: mo_IR, g: ['#3cd08a', '#7af0b0', '#bfffd8', '#eafff2', '#ffffff'], spark: '#e0fff0', halo: '#5ef0a0' };   // Farben (das Eislicht tauscht sie)
function mo_irrlicht(P, p){
  const IC = mo_IRC;
  P.noOutline = true;
  const k = (p.k || 1) * 1.15, ph = p.ph || 0, top = p.top || 9, r0 = 3.6 * k;
  for (let y = -Math.ceil(top * k) - 1; y <= 7; y++) for (let x = -8; x <= 8; x++){
    const Y = y + .5, X = x + .5;
    let d;
    if (Y > 0) d = Math.hypot(X, Y * 1.1) / r0;
    else { const hgt = -Y / (top * k), wv = Math.sin(hgt * 4 + ph) * hgt * 1.6, wd = r0 * (1 - hgt) * (1 - hgt * .2); d = wd > .2 ? Math.abs(X - wv) / wd : 2; if (hgt > 1) d = 2; }
    if (d > 1) continue;
    const v = 1 - d, lv = clamp(Math.floor(v * 4.6 + (dither(x, y) - .5) * .9 + (Y > -2 && Y < 2 ? .6 : 0)), 0, 4);
    mo_put(P, x, y, IC.m, lv);
    mo_glow(P, x, y, IC.g[lv], lv > 2 ? 1 : .7);
  }
  // Funken
  for (const [x, y] of p.sp || []){ mo_put(P, x, y, IC.m, 3); mo_glow(P, x, y, IC.spark, 1); }
  mo_halo(P, 0, 0, p.halo || 10, IC.halo, p.ha || .34);
}
const mo_IRR = {
  idle: [{ ph: 0, top: 9 }, { ph: 2, top: 8, sp: [[2, -10]] }],
  move: [{ ph: 0, top: 9 }, { ph: 1.6, top: 10, sp: [[-2, -11]] }, { ph: 3.2, top: 8 }, { ph: 4.8, top: 10, sp: [[3, -9]] }],
  act: [{ ph: 1, top: 6, k: .8, halo: 6, ha: .45 }, { ph: 2.5, top: 11, k: 1.25, halo: 10.5, ha: .4, sp: [[-5, -6], [5, -8], [-3, -12], [6, -2], [-6, 1]] }]
};
/* ---------- Zusammenstellung (alle Bilder werden einmal beim Laden gemalt) ---------- */
const MON_ART = {
  wieder: mo_set(54, 52, 27, 50, (P, p) => { mo_wieder(P, p); mo_wiederEyes(P, p); }, mo_WIEDER),
  pluend: Object.assign(mo_set(78, 57, 39, 54, mo_pluend, mo_PLUEND), { reach: 37 }),
  armbrust: Object.assign(mo_set(50, 54, 25, 51, mo_armbrust, mo_ARMBRUST), { muzzle: mo_muzzle(mo_ARMBRUST.act[0]) }),
  werwolf: mo_set(70, 62, 35, 56, mo_werwolf, mo_WERWOLF),
  moor: mo_set(50, 54, 25, 52, mo_moor, mo_MOOR),
  ratte: mo_set(48, 22, 24, 19, mo_ratte, mo_RATTE),
  rabe: mo_set(36, 34, 18, 17, mo_rabe, mo_RABE),
  irrlicht: mo_set(22, 28, 11, 17, mo_irrlicht, mo_IRR)
};

/* ============ Anführer und Gegenstände (bosses_items.js) ============ */
/* Malwerkzeug: Pixelpuffer mit Material, Helligkeitsstufe und Teilnummer je Pixel.
   Teile werden von hinten nach vorn gemalt; spätere Teile setzen eine dunkle Kante gegen frühere. */
const bi_R = [null], bi_OC = [0];                 // Farbrampen dunkel..hell und Konturfarbe je Material (gepackt)
function bi_pk(h){ const v = parseInt(h.slice(1, 7), 16); return (0xff000000 | (v & 255) << 16 | (v & 0xff00) | v >> 16) >>> 0; }
function bi_mix(a, b, t){
  const p = parseInt(a.slice(1, 7), 16), q = parseInt(b.slice(1, 7), 16), f = s => Math.round(((p >> s) & 255) * (1 - t) + ((q >> s) & 255) * t) << s;
  return '#' + ((f(16) | f(8) | f(0)) >>> 0).toString(16).padStart(6, '0');
}
function bi_mat(...cols){ bi_R.push(cols.map(bi_pk)); bi_OC.push(bi_pk(bi_mix(OUT, cols[0], .3))); return bi_R.length - 1; }
const bi_L = (() => { const l = Math.hypot(.5, .72, .5); return [-.5 / l, -.72 / l, .5 / l]; })();   // Licht von oben links
const bi_N1 = noise2(1520), bi_N2 = noise2(1525), bi_N3 = noise2(31);

function bi_buf(w, h, ax, ay){
  const n = w * h;
  return { w, h, ax, ay, M: new Uint8Array(n), V: new Uint8Array(n), T: new Uint16Array(n), G: new Uint32Array(n), E: [0, 0], NO: [0, 0], RM: [null, null], px: [], part: 1, gl: 0 };
}
/* Teil abschließen: Plattenränder (oben blank, links etwas schwächer, unten dunkel, dort gelegentlich Rost)
   rim = [Material, Stufe oben, Stufe unten, Stufe links, Rost] */
function bi_rim(P){
  const r = P.RM[P.part]; if (!r){ P.px.length = 0; return; }
  const { w, T, M, V } = P, t = P.part, up = [], sd = [], dn = [];
  for (const i of P.px){
    if (T[i] !== t) continue;
    const x = i % w;
    if (T[i - w] !== t) up.push(i);
    else if (r[3] !== undefined && x > 0 && T[i - 1] !== t) sd.push(i);
    else if (r[2] !== undefined && (T[i + w] !== t || (x < w - 1 && T[i + 1] !== t))) dn.push(i);
  }
  for (const i of up){ M[i] = r[0]; V[i] = r[1]; }
  for (const i of sd){ M[i] = r[0]; V[i] = r[3]; }
  for (const i of dn){
    const x = i % w, y = i / w | 0;
    if (r[4] && bi_N1(x * .6 + t * 3, y * .6) > .76){ M[i] = bi_M.rst; V[i] = 1; } else V[i] = Math.min(V[i], r[2]);
  }
  P.px.length = 0;
}
/* neues Teil: e = Kante gegen Früheres (0 keine, 1 abdunkeln, 2 Kontur), no = ohne Außenkontur, rim siehe oben */
function bi_part(P, e, no, rim){ bi_rim(P); P.part++; P.E[P.part] = e || 0; P.NO[P.part] = no ? 1 : 0; P.RM[P.part] = rim || null; }
function bi_i(P, x, y){ x = Math.floor(x) + P.ax; y = Math.floor(y) + P.ay; return (x < 0 || y < 0 || x >= P.w || y >= P.h) ? -1 : y * P.w + x; }
function bi_put(P, x, y, m, lv){
  const i = bi_i(P, x, y); if (i < 0) return;
  if (!m){ P.M[i] = 0; return; }
  const n = bi_R[m].length - 1;
  P.M[i] = m; P.V[i] = lv < 0 ? 0 : lv > n ? n : lv | 0;
  if (P.T[i] !== P.part){ P.T[i] = P.part; if (P.RM[P.part]) P.px.push(i); }
}
function bi_has(P, x, y, m){ const i = bi_i(P, x, y); return i >= 0 && P.M[i] > 0 && (!m || P.M[i] === m); }
/* Stufe eines vorhandenen Pixels setzen */
function bi_lv(P, x, y, lv, m){ const i = bi_i(P, x, y); if (i < 0 || !P.M[i]) return; if (m) P.M[i] = m; P.V[i] = clamp(lv, 0, bi_R[P.M[i]].length - 1); }
function bi_glow(P, x, y, col){ const i = bi_i(P, x, y); if (i < 0) return; P.G[i] = bi_pk(col); P.gl = 1; }

/* Helligkeit 0..1 aus Normale */
function bi_s(nx, ny, nz, o){
  let s = (nx * bi_L[0] + ny * bi_L[1] + nz * bi_L[2] + .32) / 1.3;
  if (o.k) s = .5 + (s - .5) * o.k;
  return s + (o.b || 0);
}
/* ein Pixel füllen: Stufe mit geordnetem Dithering; o.sp = [Material, Schwelle] setzt Glanz */
function bi_fill(P, x, y, m, o, nx, ny, nz, u, v){
  const s = bi_s(nx, ny, nz, o), dt = (dither(x, y) - .47) * (o.d === undefined ? .9 : o.d);
  let lv;
  if (o.sp && s + dt * .08 > o.sp[1]){ m = o.sp[0]; lv = clamp(Math.floor((s - o.sp[1]) * (o.sp[2] || 14) + 1.5 + dt), 1, bi_R[m].length - 1); }
  else lv = o.lv !== undefined ? o.lv : clamp(Math.floor(s * bi_R[m].length + dt), 0, bi_R[m].length - 1);
  if (o.tex){
    const r = o.tex(x, y, lv, u, v, s, m);
    if (r === false) return;
    if (typeof r === 'number') lv = r; else if (r) { m = r[0]; lv = r[1]; }
  }
  bi_put(P, x, y, m, lv);
}
/* Ellipse mit Kugelschattierung; u,v = -1..1 */
function bi_ell(P, cx, cy, rx, ry, m, o){
  o = o || {};
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++){
    const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry, q = u * u + v * v;
    if (q > 1) continue;
    bi_fill(P, x, y, m, o, u, v, Math.sqrt(1 - q) * (o.z || 1), u, v);
  }
}
/* Kapsel (Glied) von a nach b mit Radien r0..r1, Zylinderschattierung; u = 0..1 entlang, v = -1..1 quer */
function bi_cap(P, x0, y0, x1, y1, r0, r1, m, o){
  o = o || {};
  const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-4, L = Math.sqrt(L2), R = Math.max(r0, r1);
  for (let y = Math.floor(Math.min(y0, y1) - R); y <= Math.ceil(Math.max(y0, y1) + R); y++)
    for (let x = Math.floor(Math.min(x0, x1) - R); x <= Math.ceil(Math.max(x0, x1) + R); x++){
      const px = x + .5, py = y + .5, t = clamp(((px - x0) * dx + (py - y0) * dy) / L2, 0, 1);
      const r = r0 + (r1 - r0) * t, ex = px - (x0 + dx * t), ey = py - (y0 + dy * t);
      if (ex * ex + ey * ey > r * r) continue;
      const nx = ex / r, ny = ey / r;
      bi_fill(P, x, y, m, o, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * (o.z || 1), t, (ex * dy - ey * dx) / L / r);
    }
}
function bi_in(pts, x, y){
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){
    const a = pts[i], b = pts[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
/* Vieleck in lokalen Koordinaten; o.xf = [x, y, Winkel] legt es in die Figur.
   o.c = [cx, cy, rx, ry] wölbt die Fläche wie eine Kuppel, sonst o.n = feste Normale. tex erhält lokale Koordinaten. */
function bi_poly(P, pts, m, o){
  o = o || {};
  const f = o.xf || [0, 0, 0], ca = Math.cos(f[2]), sa = Math.sin(f[2]);
  const wp = pts.map(p => [f[0] + p[0] * ca - p[1] * sa, f[1] + p[0] * sa + p[1] * ca]);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of wp){ x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const n = o.n || [0, 0, 1], c = o.c;
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++){
    const qx = x + .5 - f[0], qy = y + .5 - f[1], lx = qx * ca + qy * sa, ly = -qx * sa + qy * ca;
    if (!bi_in(pts, lx, ly)) continue;
    if (c){
      let nx = (lx - c[0]) / c[2], ny = (ly - c[1]) / c[3]; const q = nx * nx + ny * ny, nz = Math.sqrt(Math.max(.08, 1 - q));
      const rx = nx * ca - ny * sa, ry = nx * sa + ny * ca;
      bi_fill(P, x, y, m, o, rx, ry, nz, lx, ly);
    } else bi_fill(P, x, y, m, o, n[0], n[1], n[2], lx, ly);
  }
}
/* Linie (Bresenham); lv darf eine Funktion (k, x, y) sein */
function bi_ln(P, x0, y0, x1, y1, m, lv, only){
  x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.floor(x1); y1 = Math.floor(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy, k = 0;
  for (;;){
    const l = typeof lv === 'function' ? lv(k, x0, y0) : lv;
    if (l !== null && l !== undefined && (!only || bi_has(P, x0, y0, only))){
      if (m) bi_put(P, x0, y0, m, l); else bi_lv(P, x0, y0, l);
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy){ e += dy; x0 += sx; }
    if (e2 <= dx){ e += dx; y0 += sy; }
    k++;
  }
}
/* Puffer in Bild (und Leuchtebene) umsetzen: Innenkanten und Außenkontur */
function bi_img(P){
  bi_rim(P);
  const { w, h, M, V, T, E, NO } = P, n = w * h;
  const c = canvasOf(w, h), g = c.getContext('2d'), id = g.createImageData(w, h), d = new Uint32Array(id.data.buffer);
  for (let i = 0; i < n; i++){
    const m = M[i]; if (!m) continue;
    const x = i % w, t = T[i];
    let k = -1;
    if (x > 0 && M[i - 1] && T[i - 1] > t && E[T[i - 1]]) k = i - 1;
    else if (x < w - 1 && M[i + 1] && T[i + 1] > t && E[T[i + 1]]) k = i + 1;
    else if (i >= w && M[i - w] && T[i - w] > t && E[T[i - w]]) k = i - w;
    else if (i + w < n && M[i + w] && T[i + w] > t && E[T[i + w]]) k = i + w;
    if (k < 0) d[i] = bi_R[m][V[i]];
    else if (E[T[k]] === 1) d[i] = bi_R[m][Math.max(0, V[i] - 2)];
    else d[i] = bi_OC[M[k]];
  }
  for (let i = 0; i < n; i++){
    if (M[i]) continue;
    const x = i % w; let k = -1;
    if (x > 0 && M[i - 1] && !NO[T[i - 1]]) k = i - 1;
    else if (x < w - 1 && M[i + 1] && !NO[T[i + 1]]) k = i + 1;
    else if (i + w < n && M[i + w] && !NO[T[i + w]]) k = i + w;
    else if (i >= w && M[i - w] && !NO[T[i - w]]) k = i - w;
    if (k >= 0) d[i] = bi_OC[M[k]];
  }
  g.putImageData(id, 0, 0);
  let gc = null;
  if (P.gl){
    gc = canvasOf(w, h); const gg = gc.getContext('2d'), gd = gg.createImageData(w, h);
    new Uint32Array(gd.data.buffer).set(P.G); gg.putImageData(gd, 0, 0);
  }
  return { img: c, glow: gc };
}
function bi_frame(P){ const r = bi_img(P); return spriteOf(r.img, r.glow); }

const bi_rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
/* Zwei-Glieder-Kinematik: Gelenkpunkt zwischen s und t; bend wählt die Seite */
function bi_ik(s, t, l1, l2, bend){
  const dx = t[0] - s[0], dy = t[1] - s[1], d = Math.hypot(dx, dy) || .001, dd = Math.min(d, l1 + l2 - .05);
  const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a)), ux = dx / d, uy = dy / d;
  return [[s[0] + ux * a - uy * hh * bend, s[1] + uy * a + ux * hh * bend], [s[0] + ux * dd, s[1] + uy * dd]];
}

/* ============ Materialien ============ */
const bi_M = {
  blk: bi_mat('#121116', '#1c1b21', '#28272e', '#36353d', '#47464f', '#5e5d68'),   // geschwärzter Stahl
  brt: bi_mat('#383b42', '#5a5f68', '#848a93', '#adb3ba', '#d6dadd', '#f1f2ef'),   // blanker Stahl
  rst: bi_mat('#2e1b13', '#4a2a1a', '#6a3e24', '#8a5730'),                         // Rost
  red: bi_mat('#3a0c11', '#5c141b', '#801e24', '#a42c2c', '#c24a3e'),              // rote Federn, Tuch
  fbk: bi_mat('#0d0c0f', '#19171c', '#26232a', '#36323a', '#4a454f'),              // schwarze Federn
  lth: bi_mat('#20150d', '#352416', '#4f3520', '#6b4a2e', '#86623e'),              // Leder
  wd:  bi_mat('#251a10', '#3d2b1a', '#584027', '#735637', '#8e6e48'),              // Holz
  ml:  bi_mat('#1c1d22', '#33353b', '#53565d', '#7a7e85', '#a3a7ac'),              // Kettengeflecht
  brs: bi_mat('#3a290d', '#634616', '#8e6a24', '#b8913a', '#dcc274'),              // Messing
  bone: bi_mat('#383124', '#5f5541', '#8b8065', '#b5aa8b', '#d6cdae', '#ece6cc'),  // vergilbte Knochen
  lin: bi_mat('#1c1a17', '#2c2924', '#3e3a33', '#544e44', '#6c6556', '#878069'),  // schmutziges Leichentuch
  flsh: bi_mat('#22140e', '#3d251a', '#583625', '#734c35'),                         // vertrocknetes Fleisch
  irn: bi_mat('#151418', '#211f25', '#2f2d34', '#423f48', '#57545e'),              // Sensenblatt
  gls: bi_mat('#4a5658', '#76878a', '#a9b8b6', '#d5dfda'),                         // Glas
  snd: bi_mat('#5a4520', '#86693a', '#ae9254'),                                    // Sand
  scl: bi_mat('#1a1e14', '#262d1c', '#343e26', '#455131', '#59653d', '#717c4f'),  // Schuppen des Lindwurms (oliv)
  bly: bi_mat('#3a2b16', '#5c4826', '#82693a', '#a68a50', '#c4aa6c'),             // Bauchschilde
  hrn: bi_mat('#26201a', '#433929', '#6b5e45', '#968665', '#bfb08a', '#ddd2ae'),  // Horn und Stacheln
  fir: bi_mat('#7a1a12', '#b8381a', '#e0702a', '#f6a63e', '#ffd878', '#fff4cc'),  // Feuer
  mth: bi_mat('#1e0a0b', '#3e1214', '#64201e', '#8a3428'),                         // Rachen
};

/* Zeichenraster einsetzen: Zeichen → [Material, Stufe] */
function bi_grid(P, x, y, rows, map){
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++){
    const e = map[rows[r][c]]; if (e) bi_put(P, x + c, y + r, e[0], e[1]);
  }
}
/* Kartenzeichen für Stahlraster */
const bi_SM = (() => {
  const M = bi_M, o = { o: [M.fbk, 0], r: [M.brs, 4], s: [M.brs, 2], x: [M.rst, 2], y: [M.rst, 1] };
  for (let i = 0; i < 6; i++) o[i] = [M.blk, i];
  'abcde'.split('').forEach((ch, i) => { o[ch] = [M.brt, i + 1]; });
  return o;
})();

/* ============ Raubritter im schwarz-weißen Harnisch (um 1520) ============ */
const bi_RK = { w: 104, h: 80, ax: 52, ay: 77 };
/* Abnutzung: kleine Rostflecken und Kratzer, in Teil-Koordinaten (wandert nicht mit) */
function bi_wear(lv, u, v, s){
  const n = bi_N1(u * .9 + s, v * .9);
  if (n > .82) return [bi_M.rst, n > .87 ? 1 : 2];
  if (bi_N2(u * 1.9 + s * 3, v * .4 + s) > .88) return Math.min(5, lv + 1);
  return lv;
}
/* blanke Bahn (schwarz-weiß): zwei feste Stufen */
const bi_band = s => [bi_M.brt, s > .62 ? 4 : 3];
const bi_RIMN = [bi_M.brt, 3, 0, undefined, 1], bi_RIMF = [bi_M.blk, 3, 0], bi_RIMT = [bi_M.brt, 3, 0, 1, 1], bi_RIML = [bi_M.brt, 2, 0, undefined, 1];
const bi_ST = { d: .35, k: .85 };                  // Schattierung für geschwärzten Stahl
const bi_SPL = { d: .3, k: .85, sp: [bi_M.brt, .8, 6] };   // mit Glanzstreifen
function bi_rkLeg(P, hp, foot, dark, seed){
  const M = bi_M, b = dark ? -.2 : 0, rim = dark ? bi_RIMF : bi_RIMN, [kn, an] = bi_ik(hp, foot, 14, 13.5, -1);
  // Diechling mit blanker Bahn vorn
  bi_part(P, 1, 0, rim);
  bi_cap(P, hp[0], hp[1], kn[0], kn[1], 4.7, 3.5, M.blk, { ...(dark ? bi_ST : bi_SPL), b, tex: (x, y, lv, u, v, s, m) => {
    if (v > .2 && v < .62) return dark ? lv + 1 : bi_band(s);
    if (m === M.brt) return;
    return bi_wear(lv, u * 12, v * 4, seed);
  } });
  // Beinröhre
  bi_part(P, 1, 0, rim);
  bi_cap(P, kn[0], kn[1], an[0], an[1], 3.2, 2.4, M.blk, { ...(dark ? bi_ST : bi_SPL), b, tex: (x, y, lv, u, v, s, m) => (m === M.brt ? undefined : bi_wear(lv, u * 10 + 5, v * 3, seed)) });
  // Kniebuckel mit Muschel und Niete
  bi_part(P, 1, 0, rim);
  bi_ell(P, kn[0] + .5, kn[1] + .1, 3.5, 3.2, M.blk, { ...bi_ST, b: b + .05 });
  bi_part(P, 0, 0, dark ? bi_RIMF : [M.brt, 4, 0, 3]);
  bi_ell(P, kn[0] - 1, kn[1] + .4, 2.1, 2.6, M.blk, { ...bi_ST, b: b - .05 });
  bi_put(P, kn[0] - 1, kn[1] + .5, M.brs, dark ? 1 : 3);
  // Kuhmaulschuh: breit und stumpf, Folgen über dem Rist
  bi_part(P, 1, 0, dark ? bi_RIMF : [M.brt, 3, 0, undefined, 1]);
  const ax = an[0], ay = an[1], lift = foot[1] < -3.5;
  const pts = lift ? [[-2.6, -1.8], [1.6, -1.8], [4.2, -.4], [6.6, .9], [7.1, 2.4], [6.4, 3.1], [-2.8, 2.4]]
                   : [[-2.6, -1.8], [1.6, -1.8], [4.2, -.4], [7, .5], [8, 1.8], [7.8, 3], [-3, 3]];
  bi_poly(P, pts, M.blk, { ...bi_ST, xf: [ax, ay, lift ? .15 : 0], c: [2.5, -.5, 6, 3.6], b: b + .05, tex: (x, y, lv, u, v) => {
    if (v > 2.2) return [M.blk, 0];
    if (u > -.4 && u < 5.4){ const k = (u + 9.6) % 1.9; if (k < .6) return 0; if (k < 1.2 && v < 1.6) return dark ? 3 : [M.brt, v < .4 ? 4 : 3]; }
    return lv;
  } });
  return kn;
}
function bi_rkArm(P, sh, hand, bend, dark){
  const M = bi_M, b = dark ? -.24 : 0, rim = dark ? bi_RIMF : bi_RIMN, [el, hd] = bi_ik(sh, hand, 9.5, 9.6, bend);
  bi_part(P, 1, 0, rim);
  bi_cap(P, sh[0], sh[1], el[0], el[1], 2.8, 2.5, M.blk, { ...(dark ? bi_ST : bi_SPL), b, tex: (x, y, lv, u, v, s, m) => (m === M.brt ? undefined : bi_wear(lv, u * 8, v * 3, 4)) });
  bi_part(P, 1, 0, rim);
  bi_cap(P, el[0], el[1], hd[0], hd[1], 2.5, 2.2, M.blk, { ...(dark ? bi_ST : bi_SPL), b, tex: (x, y, lv, u, v, s, m) => (m === M.brt ? undefined : bi_wear(lv, u * 8 + 3, v * 3, 9)) });
  // Armkachel mit Muschel
  bi_part(P, 1, 0, rim);
  bi_ell(P, el[0], el[1], 3, 2.9, M.blk, { ...bi_ST, b: b + .06 });
  bi_put(P, el[0], el[1], M.brs, dark ? 1 : 3);
  // Hentze (Fäustling) mit Stulpe
  const dx = hd[0] - el[0], dy = hd[1] - el[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  bi_part(P, 1, 0, rim);
  bi_cap(P, hd[0] - ux * 3.6, hd[1] - uy * 3.6, hd[0] - ux * .4, hd[1] - uy * .4, 2.3, 3.2, M.blk, { ...bi_ST, b });
  bi_part(P, 1, 0, rim);
  bi_ell(P, hd[0] + ux * 1.3, hd[1] + uy * 1.3, 2.6, 2.5, M.blk, { ...bi_ST, b: b + .05, tex: (x, y, lv, u, v) => (Math.abs(u * ux + v * uy + .15) < .17 ? 0 : lv) });
  return { el, hd };
}
/* Mordaxt: Schaft von (bx,by) im Winkel a, Länge L; s = Seite des Beils */
function bi_poleaxe(P, bx, by, a, L, s){
  const M = bi_M, c = Math.cos(a), si = Math.sin(a);
  const W = (u, v) => [bx + c * u - si * v * s, by + si * u + c * v * s];
  const loc = (x, y) => { const qx = x + .5 - bx, qy = y + .5 - by; return [qx * c + qy * si, (-qx * si + qy * c) * s]; };
  const hx = W(L - 4, 0);
  // Schaft mit Maserung, eisernem Schuh und Lederwicklung
  bi_part(P, 1);
  bi_cap(P, bx, by, hx[0], hx[1], 1.15, 1.15, M.wd, { tex: (x, y, lv, u) => {
    const g = bi_N3(u * 24, 3);
    if (Math.abs(u * L - (L - 30)) < 2.5) return [M.lth, clamp(lv + ((x + y) & 1), 0, 4)];
    return clamp(lv + (g > .64 ? 1 : g < .32 ? -1 : 0), 0, 4);
  } });
  const sh = W(2.4, 0);
  bi_cap(P, bx, by, sh[0], sh[1], 1.4, 1.3, M.brt, { b: -.2 });
  // Schaftfedern mit Nägeln
  bi_part(P, 0);
  for (let u = L - 20; u < L - 9; u++){ const p = W(u, -.5); bi_put(P, p[0], p[1], M.brt, u % 4 ? 2 : 4); }
  for (let u = L - 19; u < L - 9; u += 3){ const p = W(u, .5); bi_put(P, p[0], p[1], M.brt, 4); }
  // Brechscheibe
  bi_part(P, 1, 0, [M.brt, 4, 1]);
  const r0 = W(L - 21, -3), r1 = W(L - 21, 3);
  bi_cap(P, r0[0], r0[1], r1[0], r1[1], 1.1, 1.1, M.brt, { b: -.12 });
  // Tülle
  bi_part(P, 1, 0, [M.brt, 4, 1]);
  const t0 = W(L - 11, 0), t1 = W(L - 4.5, 0);
  bi_cap(P, t0[0], t0[1], t1[0], t1[1], 1.7, 1.7, M.brt, { b: -.2 });
  // Beil mit geschwungener Schneide
  bi_part(P, 1);
  const blade = [[L - 10, 1], [L - 11.6, 4], [L - 14.4, 7.6], [L - 13, 8.8], [L - 9, 9.3], [L - 5.6, 9], [L - 2.8, 8.2], [L - 3.8, 5], [L - 6, 1]];
  bi_poly(P, blade.map(p => W(p[0], p[1])), M.blk, { b: -.1, n: [-.3, -.5, .8], tex: (x, y, lv) => {
    const [lu, lw] = loc(x, y);
    if (lw > 8.1) return [M.brt, 5];                                                  // geschliffene Schneide
    if (lw > 7.2) return [M.brt, (x + y) & 1 ? 3 : 4];
    if (lw < 2.2) return 1;
    if (Math.hypot(lu - (L - 7.6), lw - 4.6) < .8) return 0;                           // Lochzier
    const n = bi_N1(lu * 1.3, lw * 1.3);
    if (n > .76) return [M.rst, n > .82 ? 1 : 2];
    return clamp(2 + (lw > 5.5 ? 1 : 0) + ((x + y) & 1 && lw > 6.4 ? 1 : 0), 0, 5);
  } });
  // Hammer mit gezahnter Bahn
  bi_part(P, 1, 0, [M.brt, 4, 1]);
  bi_poly(P, [[L - 9.6, -1], [L - 9.9, -4.7], [L - 6.1, -4.7], [L - 6.4, -1]].map(p => W(p[0], p[1])), M.brt, { b: -.3, tex: (x, y, lv) => {
    const [, lw] = loc(x, y);
    return lw < -3.9 ? ((x + y) & 1 ? 1 : 4) : lv;
  } });
  // Stoßklinge oben
  bi_part(P, 1);
  bi_poly(P, [[L - 5, 1.4], [L + 3.6, .15], [L + 3.6, -.15], [L - 5, -1.4]].map(p => W(p[0], p[1])), M.brt, { n: [-si * s * .7, c * s * .7 - .3, .6] });
  return W(L + 3, 0);
}
/* Federbusch aus roten und schwarzen Straußenfedern, nach hinten fallend */
function bi_plume(P, x, y, wind, ph){
  const M = bi_M, cols = [M.fbk, M.red, M.fbk, M.red, M.red];
  const a0 = [-1.75, -2.05, -2.3, -1.6, -2.55], ln = [15, 16, 13, 12, 11];
  for (let f = 0; f < 5; f++){
    bi_part(P, f ? 1 : 0);
    let px = x + (f === 3 ? .6 : 0), py = y, a = a0[f] - wind * .45;
    const len = ln[f] + wind * 2, curl = -(.17 + f * .012) * (1 - wind * .35);
    for (let k = 0; k < len; k++){
      const t = k / len, r = 1.1 + Math.sin(t * Math.PI) * 1.1 - t * .5;
      const nx = px + Math.cos(a), ny = py + Math.sin(a);
      bi_cap(P, px, py, nx, ny, r, r, cols[f], { b: .08 - t * .1, k: 1.2 });
      // Fahnen: gefranste Unterkante
      if (k > 2 && (k + ph + f) % 2 === 0){ const ex = nx - Math.sin(a) * -(r + .7), ey = ny + Math.cos(a) * (r + .7); bi_put(P, ex, ey, cols[f], 1); }
      px = nx; py = ny; a += curl * (1 + Math.sin(k * .8 + ph * 1.7 + f) * .3);
    }
  }
}
/* Geschlossener Helm mit Spatzenschnabel-Visier (Blick rechts), 18 × 14 */
const bi_HELM = [
  '......bdeb........',
  '....23cdd432......',
  '...2345c44321.....',
  '..234554443211....',
  '.12345444332111...',
  '.1235r44433221100.',
  '11234s4ooooooo10..',
  '012333dddddccccb..',
  '0122233444444433cd',
  '01122233333333322c',
  '0111222o3o3o322b..',
  '.011122222222b1...',
  '..0011cccccb10....',
  '...00abba000......',
];
/* eine Pose zeichnen */
function bi_rkPose(q){
  const M = bi_M, P = bi_buf(bi_RK.w, bi_RK.h, bi_RK.ax, bi_RK.ay), hip = q.hip, L = q.lean;
  const T = (x, y) => { const r = bi_rot(x, y, L); return [hip[0] + r[0], hip[1] + r[1]]; };
  const XF = [hip[0], hip[1], L];
  const shN = T(1.2, -19.4), shF = T(-2.8, -19.8), nk = T(.8, -22);
  const hd = q.hd || [0, 0], hx = Math.round(nk[0] - 5.5 + hd[0]), hy = Math.round(nk[1] - 12.5 + hd[1]);
  const w = q.wpn, wc = Math.cos(w.a), ws = Math.sin(w.a);
  const hN = [w.x + wc * w.uN, w.y + ws * w.uN], hF = [w.x + wc * w.uF, w.y + ws * w.uF];
  // Federbusch hinter allem
  bi_plume(P, hx + 3.5, hy + 2.5, q.wind || 0, q.ph || 0);
  // Schwertscheide hinter dem Körper (linke Hüfte)
  bi_part(P, 1);
  const sa = T(-3, -2.5), sb = T(-14.5, 11);
  bi_cap(P, sa[0], sa[1], sb[0], sb[1], 1.3, 1.1, M.lth, { b: -.1 });
  const sc = [sb[0] + (sa[0] - sb[0]) * .14, sb[1] + (sa[1] - sb[1]) * .14];
  bi_part(P, 1, 0, [M.brt, 3, 0]);
  bi_cap(P, sc[0], sc[1], sb[0], sb[1], 1.5, 1.2, M.brt, { b: -.3 });
  // ferner Arm, fernes Bein, ferne Achsel
  bi_rkArm(P, shF, hF, q.bF || 1, true);
  bi_rkLeg(P, T(-.8, 0), q.fF, true, 5);
  bi_part(P, 1, 0, bi_RIMF);
  bi_ell(P, shF[0] - .4, shF[1] + .6, 4.6, 4.4, M.blk, { ...bi_ST, b: -.2 });
  // nahes Bein
  const knN = bi_rkLeg(P, T(.6, 0), q.fN, false, 1);
  // Panzerschurz aus Ringen
  bi_part(P, 1);
  bi_poly(P, [[-6.8, -1], [5.8, -1], [6.4, 4.4], [3, 5.8], [-1, 5.2], [-5, 6], [-7.6, 4.6]], M.ml, { xf: XF, c: [-1, 1, 7, 6], d: .3, tex: (x, y, lv, u, v) => {
    if (v > 4.6 && (Math.floor(u) & 1)) return false;
    return clamp(lv + (((x + y) & 1) ? 1 : -1), 0, 4);
  } });
  // Rücken und Brust, schwarz mit blanken Bahnen
  bi_part(P, 1, 0, bi_RIMT);
  const torso = [[-6, -5], [-7.2, -10], [-7.3, -16], [-6, -20.6], [-3.4, -22.4], [2.4, -22.4], [5.4, -20.4], [7.8, -16.4], [8.4, -12.4], [7.4, -8.4], [5.6, -5.6], [5, -4.6]];
  bi_poly(P, torso, M.blk, { ...bi_ST, sp: [M.brt, .86, 5], xf: XF, c: [1.5, -13, 9, 11], b: .04, tex: (x, y, lv, u, v, s, m) => {
    const cu = (v + 13) * (v + 13) * .016;
    if (Math.abs(u - 5.4 + cu) < .6 && v > -20) return bi_band(s);                    // blanke Bahnen (schwarz-weiß)
    if (Math.abs(u - 1.2 + cu * .6) < .5 && v > -19 && v < -6) return bi_band(s - .1);
    if (Math.abs(u + 3.4 + cu * .3) < .45 && v > -18 && v < -7) return [M.brt, 2];
    if (m === M.brt) return;
    return bi_wear(lv, u, v, 13);
  } });
  // Bauchreifen mit Nieten, von oben nach unten
  for (let k = 0; k < 3; k++){
    bi_part(P, 0, 0, k ? bi_RIML : bi_RIMN);
    const y0 = -6.2 + k * 2.2;
    bi_poly(P, [[-6.6 - k * .3, y0], [5.6 + k * .3, y0 - .2], [6.2 + k * .4, y0 + 2.6], [-7 - k * .3, y0 + 2.8]], M.blk, { ...bi_ST, xf: XF, c: [0, y0 + 1.2, 8, 3],
      tex: (x, y, lv, u) => ((Math.abs(u - 3.2) < .5 || Math.abs(u + 3.6) < .5) ? [M.brs, 3] : lv) });
  }
  // Nierendolch an der rechten Hüfte
  bi_part(P, 1);
  const d0 = T(-5.6, -3.6), d1 = T(-8.4, 4);
  bi_cap(P, d0[0], d0[1], d1[0], d1[1], .9, .8, M.lth, { b: .05 });
  bi_ell(P, d0[0] - .2, d0[1] - .7, 1.5, 1.1, M.wd, { b: .1 });
  // nahe Beintasche, drei Folgen
  const tp = T(.8, .4), ta = Math.atan2(knN[1] - tp[1], knN[0] - tp[0]) - Math.PI / 2;
  for (let k = 0; k < 3; k++){
    bi_part(P, 0, 0, k ? bi_RIML : bi_RIMN);
    const y0 = -.6 + k * 2.6;
    bi_poly(P, [[-4 + k * .2, y0], [5 + k * .2, y0], [5.4, y0 + 3], [-3.6 + k * .4, y0 + 3.2]], M.blk, { ...bi_ST, xf: [tp[0], tp[1], ta], c: [.5, 3, 6, 6], b: .06,
      tex: (x, y, lv, u, v) => (k === 0 && Math.abs(u - 3.4) < .5 && Math.abs(v - 1) < .5 ? [M.brs, 4] : bi_wear(lv, u * 1.3, v * 1.3, 17 + k)) });
  }
  // Griff des Schwerts an der linken Hüfte: Knauf, lederumwickelte Hilze, Parierstange
  bi_part(P, 1);
  const g0 = T(3.6, -3.4), g1 = T(7.2, -7.6);
  bi_cap(P, g0[0], g0[1], g1[0], g1[1], .8, .8, M.lth, { b: .1, tex: (x, y, lv) => ((x + y) & 1 ? lv : lv + 1) });
  bi_part(P, 1);
  bi_ell(P, g1[0] + .6, g1[1] - .6, 1.2, 1.2, M.brt, { b: -.1 });
  bi_part(P, 1);
  const q0 = T(1.4, -4.8), q1 = T(5.2, -1.2);
  bi_cap(P, q0[0], q0[1], q1[0], q1[1], .7, .7, M.brt, { b: -.15 });
  // Halsberge
  bi_part(P, 1, 0, [M.brt, 3, 0]);
  bi_ell(P, nk[0] + .4, nk[1] + .8, 4.8, 2.4, M.blk, { ...bi_ST });
  // Helm aus Raster
  bi_part(P, 1);
  bi_grid(P, hx, hy, bi_HELM, bi_SM);
  // Mordaxt
  const tip = bi_poleaxe(P, w.x, w.y, w.a, 60, w.s || 1);
  // naher Arm mit großer Achsel (Folgen, Hauptplatte, Brechrand)
  bi_rkArm(P, shN, hN, q.bN || 1, false);
  const sxf = [shN[0], shN[1], L * .5];
  for (let k = 0; k < 3; k++){
    bi_part(P, 0, 0, bi_RIML);
    const y0 = 1 + k * 1.8;
    bi_poly(P, [[-5.4 + k * .3, y0], [5.2 - k * .4, y0], [4.8 - k * .5, y0 + 2.6], [-5 + k * .4, y0 + 2.8]], M.blk, { ...bi_ST, xf: sxf, c: [0, y0 + 1, 6, 3], b: .02 });
  }
  bi_part(P, 1, 0, bi_RIMN);
  bi_ell(P, shN[0] - .3, shN[1] - .3, 5.6, 4.4, M.blk, { ...bi_ST, b: .06, tex: (x, y, lv, u, v, s) => (Math.abs(u + .1 - v * .2) < .14 ? bi_band(s) : bi_wear(lv, u * 5 + 9, v * 5, 19)) });
  bi_part(P, 1, 0, [M.brt, 4, 1, 3]);
  bi_poly(P, [[-1.2, -3.4], [2.8, -3.8], [3.4, -7.2], [-.6, -6.2]], M.blk, { ...bi_ST, xf: sxf, n: [-.6, -.3, .7] });
  bi_part(P, 0);
  bi_put(P, shN[0] - 3, shN[1] - 1, M.brs, 4);
  bi_put(P, shN[0] + 2, shN[1] - 2, M.brs, 3);
  bi_put(P, shN[0] - 1, shN[1] + 3.2, M.brs, 3);
  return { f: bi_frame(P), tip };
}
function bi_raubritter(){
  const PI = Math.PI, A = bi_RK;
  const idle = [0, 1].map(i => bi_rkPose({ hip: [0, -29.5 + i * .6], lean: .03, fN: [3.2, -3], fF: [-3.2, -3], ph: i * 2, hd: [0, i],
    wpn: { x: 15, y: 0, a: -PI / 2, uN: 39, uF: 44, s: 1 } }).f);
  const walk = [
    { hip: [0, -29], fN: [7, -3], fF: [-6.5, -3.6], wy: 0 },
    { hip: [0, -30.2], fN: [1.5, -3], fF: [-2.5, -6], wy: -1 },
    { hip: [0, -29], fN: [-6.5, -3.6], fF: [7, -3], wy: 0 },
    { hip: [0, -30.2], fN: [-2.5, -6], fF: [1.5, -3], wy: -1 },
  ];
  const move = walk.map((s, i) => bi_rkPose({ hip: s.hip, lean: .1, fN: s.fN, fF: s.fF, ph: i, wind: .4, hd: [0, s.wy ? 0 : 1],
    wpn: { x: -10, y: -20 + s.wy, a: -1.0, uN: 12, uF: 25, s: 1 } }).f);
  const wind = bi_rkPose({ hip: [-1, -28.5], lean: -.14, fN: [9, -3], fF: [-8, -3], ph: 1, wind: .1, hd: [-1, 0],
    wpn: { x: 15, y: -33, a: -2.5, uN: 10, uF: 22, s: -1 } });
  const charge = bi_rkPose({ hip: [1, -27], lean: .32, fN: [11, -3], fF: [-12, -4.5], ph: 3, wind: 1.3, hd: [1, 1],
    wpn: { x: -15, y: -38, a: .04, uN: 9, uF: 20, s: 1 } });
  return { w: A.w, h: A.h, ax: A.ax, ay: A.ay, idle: facing(idle), move: facing(move), act: facing([wind.f, charge.f]), reach: Math.round(charge.tip[0]) };
}

const BOSS_ART = {};
BOSS_ART.raubritter = bi_raubritter();

/* ============ Der Tod: Gerippe mit Leichentuch und Sense (Totentanz um 1520) ============ */
const bi_TD = { w: 100, h: 84, ax: 50, ay: 49 };
/* Schädel im Dreiviertelprofil (Blick rechts), 10 × 13; r = glühendes Auge */
const bi_SKULL = [
  '..34554...',
  '.2345665..',
  '234556665.',
  '2345566654',
  '2344556654',
  '23445oo553',
  '2344oroo43',
  '12344oo4n3',
  '.1234443n2',
  '..1233tgtt',
  '..123tgtg.',
  '..123443..',
  '...122....',
];
const bi_SKM = (() => {
  const M = bi_M, o = { o: [M.fbk, 0], n: [M.fbk, 1], g: [M.fbk, 0], t: [M.bone, 5], r: [M.red, 3] };
  for (let i = 1; i <= 6; i++) o[i] = [M.bone, i - 1];
  return o;
})();
const bi_hash = n => { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return ((n ^ n >>> 16) >>> 0) / 4294967296; };
/* Knochenarm: Oberarm, Elle und Speiche, Fingerknochen; Fetzen vertrockneter Haut */
function bi_boneArm(P, sh, hand, bend, dark){
  const M = bi_M, b = dark ? -.25 : 0, [el, hd] = bi_ik(sh, hand, 9, 8.6, bend);
  bi_part(P, 1);
  bi_cap(P, sh[0], sh[1], el[0], el[1], 1.1, .9, M.bone, { b, d: .3 });
  // Hautfetzen am Oberarm
  bi_part(P, 1);
  bi_cap(P, lerp(sh[0], el[0], .2), lerp(sh[1], el[1], .2), lerp(sh[0], el[0], .55) - .6, lerp(sh[1], el[1], .55) + 1.6, .8, .5, M.flsh, { b });
  const dx = hd[0] - el[0], dy = hd[1] - el[1], L = Math.hypot(dx, dy) || 1, px = -dy / L * .9, py = dx / L * .9;
  bi_part(P, 1);
  bi_cap(P, el[0] + px, el[1] + py, hd[0] + px * .6, hd[1] + py * .6, .7, .6, M.bone, { b: b - .05, d: .3 });
  bi_cap(P, el[0] - px, el[1] - py, hd[0] - px * .4, hd[1] - py * .4, .7, .6, M.bone, { b, d: .3 });
  bi_part(P, 1);
  bi_ell(P, el[0], el[1], 1.4, 1.4, M.bone, { b: b + .05 });
  // Hand: Knöchel und Fingerglieder um den Schaft
  bi_part(P, 1);
  bi_ell(P, hd[0] + dx / L * .8, hd[1] + dy / L * .8, 1.8, 1.6, M.bone, { b: b + .02, tex: (x, y, lv) => ((x + y) & 1 ? lv : Math.max(0, lv - 2)) });
  return { el, hd };
}
/* Sense: Sensenbaum von a nach t mit zwei Griffen, Blatt am oberen Ende (Winkel ba, Krümmung cv) */
function bi_scythe(P, a, t, uN, uF, ba, cv, len){
  const M = bi_M, dx = t[0] - a[0], dy = t[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  bi_part(P, 1);
  bi_cap(P, a[0], a[1], t[0], t[1], 1.15, 1.15, M.wd, { tex: (x, y, lv, u) => { const g = bi_N3(u * 34, 1); return clamp(lv + (g > .64 ? 1 : g < .3 ? -1 : 0), 0, 4); } });
  // Griffe (Knaggen)
  for (const u of [uN, uF]){
    const g = [a[0] + dx * u, a[1] + dy * u];
    bi_part(P, 1);
    bi_cap(P, g[0], g[1], g[0] - uy * 3.2 + ux * .6, g[1] + ux * 3.2 + uy * .6, .9, .8, M.wd, { b: .05 });
  }
  // Blatt: Rücken dick, zur Spitze dünn, blanke Schneide innen; eiserner Ring am Ansatz
  bi_part(P, 1);
  let x = t[0] - ux * 1.5, y = t[1] - uy * 1.5, ang = ba;
  const pts = [];
  for (let k = 0; k <= len; k++){ pts.push([x, y, ang]); x += Math.cos(ang); y += Math.sin(ang); ang += cv * (.6 + k / len * .9); }
  for (let k = 0; k < pts.length - 1; k++){
    const p = pts[k], q = pts[k + 1], tt = k / len, w = 2.2 * (1 - tt * .8) + .4, nx = -Math.sin(p[2]) * Math.sign(cv), ny = Math.cos(p[2]) * Math.sign(cv);
    bi_cap(P, p[0], p[1], q[0], q[1], .75, .75, M.irn, { b: .1 });
    for (let s = .5; s < w; s += .5) bi_put(P, p[0] + nx * s, p[1] + ny * s, s > w - .9 ? M.brt : M.irn, s > w - .9 ? (tt > .3 ? 4 : 3) : clamp(2 - (s > 1.5 ? 1 : 0) + (bi_N1(k * .5, s) > .7 ? 1 : 0), 0, 4));
    if (bi_N1(k * .7 + 3, 1) > .74) bi_put(P, p[0] + nx, p[1] + ny, M.rst, 2);
  }
  bi_part(P, 1);
  bi_cap(P, t[0] - ux * 3, t[1] - uy * 3, t[0] - ux * .5, t[1] - uy * .5, 1.5, 1.5, M.irn, { b: .25, tex: (x, y, lv, u) => (u > .4 && u < .7 ? [M.brt, 2] : lv) });
  const e = pts[pts.length - 1];
  return [e[0], e[1]];
}
/* Leichentuch: Bahnen fallen vom Rücken nach hinten unten, jede mit Faltenlicht links, unten zerfetzt (wie Schraffur im Holzschnitt) */
function bi_tdRobe(P, b, ph, wind){
  const M = bi_M, N = 9;
  for (let k = 0; k < N; k++){
    bi_part(P, k ? 1 : 0);
    const L = 34 + bi_hash(k * 7 + 1) * 18 - Math.max(0, k - 6) * 7, y0 = -18 + b + Math.abs(k - 3) * .6, x0 = -9.5 + k * 1.75;
    for (let i = 0; i <= L; i++){
      const t = i / 50, y = y0 + i;
      const x = x0 + (k - 5.5) * t * 4.2 - wind * t * t * 16 + Math.sin(ph + i * .21 + k * 1.3) * t * 1.8;
      const end = i > L - 5 ? (L - i) / 5 : 1, wd = end * (1.5 + t * .9);
      if (i > L - 8 && bi_hash(k * 31 + i) > .8) continue;                       // Löcher und Risse
      for (let dx = -wd; dx <= wd + .01; dx += .5){
        const f = (dx + wd) / (2 * wd + .01);
        const lv = 1.6 + (1 - f) * 2.6 + (k & 1 ? .5 : -.2) - t * 1.4 + (dither(Math.round(x + dx), y) - .5) * .8;
        bi_put(P, x + dx, y, M.lin, clamp(Math.floor(lv), 0, 5));
      }
    }
  }
}
/* Leib des Toten: Wirbelsäule, Rippenkorb, Becken, Hautreste */
function bi_tdBody(P, b){
  const M = bi_M;
  // Leibeshöhle: dunkel hinter den Rippen
  bi_part(P, 0);
  bi_ell(P, 2.4, -9.6 + b, 4.4, 6.6, M.fbk, { lv: 1 });
  // Wirbelsäule: Wirbel mit dunklen Fugen
  bi_part(P, 1);
  for (let y = -17; y <= 2; y++){ const x = -.8 - (y + 6) * (y + 6) * .006; bi_put(P, x, y + b, M.bone, y & 1 ? 1 : 3); bi_put(P, x + 1, y + b, M.bone, y & 1 ? 0 : 2); }
  // Schlüsselbein, Rippenbögen, Brustbein
  bi_part(P, 0);
  bi_ln(P, -.5, -16.6 + b, 5.6, -15.6 + b, M.bone, k => (k < 2 ? 3 : 5));
  for (let k = 0; k < 6; k++){
    const y0 = -14.6 + k * 2, len = 6.6 - Math.abs(k - 2) * .45 - Math.max(0, k - 3) * 1.6;
    for (let t = 0; t <= 1.001; t += .08){
      const x = .4 + len * t, y = y0 - 1.1 * Math.sin(t * 2.6) + t * 1.7;
      bi_put(P, x, y + b, M.bone, clamp(5 - k * .45 - (t > .75 ? 1 : 0) - (t < .15 ? 1 : 0), 1, 5));
    }
  }
  bi_ln(P, 6.4, -14.6 + b, 6.8, -9.6 + b, M.bone, k => (k & 1 ? 3 : 4));
  // eingefallene, vertrocknete Haut über Bauch und unteren Rippen
  bi_part(P, 1);
  bi_poly(P, [[.6, -5.6], [4.6, -4.6], [3.4, -1.8], [.8, -.8]], M.flsh, { xf: [0, b, 0], n: [-.2, -.4, .8], tex: (x, y, lv, u) => (Math.sin(u * 2.4) > .5 ? lv - 1 : lv) });
  bi_put(P, 4, -6 + b, M.flsh, 2); bi_put(P, 5, -5 + b, M.flsh, 1);
  // Becken mit Hüftloch
  bi_part(P, 1);
  bi_poly(P, [[-2.6, 1], [2.6, -.4], [4.6, 1.6], [3.4, 4.4], [.4, 4.6], [-1.6, 3.4]], M.bone, { xf: [0, b, 0], c: [1, 2, 4, 3], d: .3, tex: (x, y, lv, u, v) => ((u - 1.4) * (u - 1.4) + (v - 2.6) * (v - 2.6) < 1.1 ? [M.fbk, 1] : lv) });
}
function bi_tdLeg(P, b, ph, wind, far){
  const M = bi_M, sw = Math.sin(ph * 1.3 + (far ? 1.2 : 0)) * 1.2 - wind * 2.6, d = far ? -.25 : 0;
  const hp = [far ? .6 : 1.8, 3.4 + b], kn = [(far ? 2.2 : 4.4) + sw * .3, 13 + b], an = [(far ? 1 : 3) + sw, 22.5 + b], ft = [(far ? 2.6 : 4.8) + sw * 1.3, 27.5 + b];
  bi_part(P, 1);
  bi_cap(P, hp[0], hp[1], kn[0], kn[1], 1.3, 1, M.bone, { b: d, d: .3 });
  bi_cap(P, lerp(hp[0], kn[0], .2) - .8, lerp(hp[1], kn[1], .2), lerp(hp[0], kn[0], .6) - 1.2, lerp(hp[1], kn[1], .6), .9, .5, M.flsh, { b: d });
  bi_part(P, 1);
  bi_cap(P, kn[0], kn[1], an[0], an[1], 1, .75, M.bone, { b: d - .03, d: .3 });
  bi_cap(P, kn[0] - 1, kn[1] + 1.5, an[0] - .8, an[1] - 1, .45, .45, M.bone, { b: d - .25 });
  bi_part(P, 1);
  bi_ell(P, kn[0] + .2, kn[1], 1.6, 1.4, M.bone, { b: d + .05 });
  bi_part(P, 1);
  bi_cap(P, an[0], an[1], ft[0], ft[1], 1.1, .6, M.bone, { b: d + .05, tex: (x, y, lv) => (y & 1 ? lv : Math.max(0, lv - 1)) });
  bi_put(P, ft[0] + .6, ft[1] + 1, M.bone, 2); bi_put(P, ft[0] - .6, ft[1] + 1.2, M.bone, 1);
}
function bi_tdPose(q){
  const M = bi_M, P = bi_buf(bi_TD.w, bi_TD.h, bi_TD.ax, bi_TD.ay), b = q.bob || 0, ph = q.ph || 0, wind = q.wind || 0;
  const sk = [3.5, -24 + b], gx = Math.round(sk[0] - 5), gy = Math.round(sk[1] - 6);
  const shN = [2.4, -13.6 + b], shF = [-2.6, -14.4 + b];
  const sc = q.sc, sa = sc.a, st = sc.t;
  const at = u => [sa[0] + (st[0] - sa[0]) * u, sa[1] + (st[1] - sa[1]) * u];
  const hN = at(sc.uN), hF = at(sc.uF);
  // Schwungspur der Sense
  if (q.trail){
    bi_part(P, 0, 1);
    for (const [x, y, l] of q.trail) bi_put(P, x, y, M.bone, l);
  }
  // Zipfel der Gugel, vom Wind nach hinten geweht
  bi_part(P, 1);
  let zx = sk[0] - 6, zy = sk[1] - 3;
  for (let i = 0; i < 9; i++){
    const nx = zx - .9 - wind * .5 - i * .05, ny = zy + 2.3 - wind * .2 + i * .1 + Math.sin(ph + i) * .3;
    bi_cap(P, zx, zy, nx, ny, 2.3 - i * .17, 2.1 - i * .17, M.lin, { b: -.1, d: .5 });
    zx = nx; zy = ny;
  }
  // Leichentuch hinten, ferner Arm, Leib, Beine
  bi_tdRobe(P, b, ph, wind);
  bi_boneArm(P, shF, hF, q.bF || 1, true);
  bi_tdLeg(P, b, ph, wind, true);
  bi_tdBody(P, b, ph, wind);
  bi_tdLeg(P, b, ph, wind, false);
  // Stundenglas an einer Schnur um die Hüfte
  bi_part(P, 0);
  bi_ln(P, -1, 1 + b, 4, 1.6 + b, M.lth, 1);
  bi_ln(P, 4, 1.6 + b, 5.5, 4 + b, M.lth, 2);
  bi_part(P, 1);
  bi_grid(P, 4, Math.round(4 + b), ['bccb', '.gG.', '.ss.', '.Gg.', 'bssb', 'bccb'], { b: [M.brs, 2], c: [M.brs, 4], g: [M.gls, 2], G: [M.gls, 3], s: [M.snd, 2] });
  // Schulterkragen der Gugel mit Falten und zerfranstem Saum
  bi_part(P, 1);
  bi_poly(P, [[-9, -3], [-4, -6], [3, -6], [6, -3.4], [5.4, -.6], [2, .4], [-1, 2.6], [-5, 3.4], [-9.6, 2.4]], M.lin, { xf: [1.6, -12.6 + b, 0], c: [0, -4, 10, 8], d: .6, tex: (x, y, lv, u, v) => {
    if (v > .4 && bi_hash(Math.floor(u + 20) * 13) > .5 && v > .4 + bi_hash(Math.floor(u + 20) * 7) * 3) return false;
    return Math.sin(u * 1.4 + v * .15) > .55 ? lv - 1 : lv;
  } });
  // Kapuze: dunkles Inneres, Schädel, Kapuzenrand
  bi_part(P, 1);
  bi_ell(P, sk[0] + 1.5, sk[1] + .8, 5.6, 7.2, M.fbk, { lv: 0 });
  bi_part(P, 1);
  bi_grid(P, gx, gy, bi_SKULL, bi_SKM);
  bi_glow(P, gx + 5, gy + 6, '#ff3a2a'); bi_glow(P, gx + 6, gy + 6, '#a8201c');
  bi_part(P, 1);
  bi_poly(P, [[-3.6, -11.4], [1, -12.4], [5.4, -10.8], [7.8, -6.8], [8.2, -1.6], [7, 4.6], [3.4, 8.4], [-3, 9.4], [-8.4, 6.8], [-10.2, 1.4], [-9.4, -4.6], [-6.8, -9.2]], M.lin, {
    xf: [sk[0], sk[1], 0], c: [-1.6, -2, 9, 10], b: .06, d: .5, tex: (x, y, lv, u, v) => {
      const ox = u - (3.4 - v * .18), oy = v - 1.4;
      if ((ox * ox) / 25 + (oy * oy) / 64 < 1) return false;
      if ((ox * ox) / 36 + (oy * oy) / 84 < 1) return Math.min(5, lv + 2);   // Kapuzensaum
      if (Math.sin(u * 1.1 - v * .45) > .72) return Math.max(0, lv - 1);      // Falten
      return lv;
    } });
  // Sense und naher Arm
  const tip = bi_scythe(P, sa, st, sc.uN, sc.uF, sc.ba, sc.cv, sc.len || 26);
  bi_boneArm(P, shN, hN, q.bN || 1, false);
  return { f: bi_frame(P), tip };
}
/* Bogen der Schwungspur (für act[1]) */
function bi_arc(cx, cy, r, a0, a1, lv){
  const out = [];
  for (let a = a0; a < a1; a += .5 / r){ const k = (a - a0) / (a1 - a0); if (k > .25 || ((a * r) | 0) % 2) out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, k > .7 ? lv : lv - 1]); }
  return out;
}
function bi_tod(){
  const A = bi_TD;
  const hold = (b, lean) => ({ a: [14 + lean, 24 + b], t: [8, -42 + b], uN: .44, uF: .64, ba: -.1, cv: .028, len: 27 });
  const idle = [0, 1].map(i => bi_tdPose({ bob: i, ph: i * 1.6, wind: 0, sc: hold(i, 0) }).f);
  const move = [0, 1, 2].map(i => bi_tdPose({ bob: [0, -1, 0][i], ph: i * 2.1, wind: .8, sc: hold([0, -1, 0][i], 1) }).f);
  // Sense hoch über dem Kopf, Blatt nach vorn
  const raise = bi_tdPose({ bob: -2, ph: .8, wind: .3, sc: { a: [21, 6], t: [-13, -38], uN: .3, uF: .5, ba: -.62, cv: .034, len: 27 } });
  // weiter Schwung: Baum waagerecht nach vorn, Blatt zieht unten durch
  const sweep = bi_tdPose({ bob: 1, ph: 2.4, wind: .9, sc: { a: [-11, -12], t: [40, -3], uN: .27, uF: .47, ba: 1.25, cv: .036, len: 25 },
    trail: bi_arc(4, -6, 42, -1.45, .6, 4).concat(bi_arc(4, -6, 38, -1.2, .5, 3)) });
  return { w: A.w, h: A.h, ax: A.ax, ay: A.ay, idle: facing(idle), move: facing(move), act: facing([raise.f, sweep.f]), reach: Math.round(Math.max(sweep.tip[0], 42)), foot: 32 };
}
BOSS_ART.tod = bi_tod();

/* ============ Der Lindwurm: flügelloser Drache mit zwei Vorderbeinen (Sage und Wappen) ============ */
const bi_LW = { w: 84, h: 48, ax: 42, ay: 46 };
/* Schuppenmuster: versetzte Reihen, Unterkante dunkel, Oberkante mit Glanz */
function bi_scales(lv, x, y, sz){
  const r = Math.floor(y / 2), off = (r & 1) * 1.5, c = Math.floor((x + off) / (sz || 3)), fu = (x + off) / (sz || 3) - c, fv = y / 2 - r;
  if (fv > .5 && (fu > .7 || fu < .15)) return lv - 2;
  if (fv > .5) return lv - 1;
  if (fu < .4 && lv < 5 && bi_hash(c * 31 + r * 17) > .45) return lv + 1;
  return lv;
}
/* Rückenstachel (Knochenhorn) von Basis (x,y) in Richtung a */
function bi_spike(P, x, y, a, h, wd){
  const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
  bi_poly(P, [[x - px * wd, y - py * wd], [x + ux * h, y + uy * h], [x + px * wd, y + py * wd]], bi_M.hrn, { n: [-.4, -.6, .6], tex: (xx, yy, lv) => {
    const d = (xx + .5 - x) * px + (yy + .5 - y) * py;
    return d < -.2 ? lv + 1 : d > .6 ? lv - 1 : lv;
  } });
}
function bi_lwLeg(P, sh, ft, far){
  const M = bi_M, b = far ? -.28 : .04, [el, an] = bi_ik(sh, ft, 7, 6.2, 1);
  // Oberarm mit Schulterschuppen, Unterarm mit Bauchschuppen innen
  bi_part(P, far ? 1 : 2);
  bi_cap(P, sh[0], sh[1], el[0], el[1], far ? 3.6 : 4.2, 2.8, M.scl, { b, tex: (x, y, lv) => bi_scales(lv, x, y, 2) });
  bi_part(P, 1);
  bi_cap(P, el[0], el[1], an[0], an[1], 2.7, 2, M.scl, { b: b - .02, tex: (x, y, lv, u, v) => (v < -.35 ? [M.bly, clamp(lv - 1, 0, 3)] : bi_scales(lv, x, y, 2)) });
  // Ellbogensporn
  bi_part(P, 1);
  bi_spike(P, el[0] - 1.2, el[1] + .4, 2.8, 3.4, 1);
  // Fuß mit drei Krallen nach vorn und einer Afterkralle
  bi_part(P, 1);
  bi_ell(P, an[0] + 1.2, an[1] - .6, 3, 1.6, M.scl, { b: b - .05 });
  bi_part(P, 1);
  for (let k = 0; k < 3; k++){
    const cx = an[0] + 1.4 + k * 1.6, cy = an[1] - .2;
    bi_put(P, cx + 1, cy - 1, M.hrn, far ? 2 : 4); bi_put(P, cx + 2, cy, M.hrn, far ? 1 : 3);
  }
  bi_put(P, an[0] - 2, an[1] - .2, M.hrn, far ? 1 : 3);
}
/* Kopf als Zeichenraster (Blick rechts): Oberkopf mit zurückgebogenem Horn, Brauenwulst, Schlitzauge, Nüster, Oberzähne */
const bi_LWH = [
  'k.....................',
  'jk....................',
  '.ji...1233............',
  '..jih23444431.........',
  '...hh234455543........',
  '..12334FEP554431......',
  '.122334444234544321...',
  '.11223333333344444321.',
  '..1122333333333344443N',
  '..1112222333333333332.',
  '...111222222222222221p',
  '....11pqrsrsrsrsrsrq..',
  '.....tT...t.t..t.TT...'];
/* Unterkiefer mit Zähnen, Lippenschilden, Kehlschilden und Bartfäden; Gelenk bei (1.5, 2.5) */
const bi_LWJ = [
  '....t.T.t..t.t.Tt...',
  '..1pqrsrsrsrsrsrq1..',
  '.1123333333333333321',
  '..11222222222222221.',
  '....pqpqpqpqpqpq....',
  '...........hh.h.....',
  '............h..h....'];
const bi_LWM = (() => {
  const M = bi_M, o = { p: [M.bly, 1], q: [M.bly, 2], r: [M.bly, 3], s: [M.bly, 4], h: [M.hrn, 2], i: [M.hrn, 3], j: [M.hrn, 4], k: [M.hrn, 5],
    t: [M.bone, 5], T: [M.bone, 3], E: [M.fir, 4], F: [M.fir, 2], P: [M.mth, 0], N: [M.scl, 0] };
  for (let i = 0; i < 6; i++) o[i] = [M.scl, i];
  return o;
})();
/* Raster gedreht einsetzen: Rasterpunkt (px, py) landet bei (x, y) */
function bi_gridRot(P, x, y, rows, map, px, py, a){
  const c = Math.cos(a), s = Math.sin(a), h = rows.length, w = rows[0].length, R = Math.hypot(w, h) + 2;
  for (let ty = Math.floor(y - R); ty <= y + R; ty++) for (let tx = Math.floor(x - R); tx <= x + R; tx++){
    const dx = tx + .5 - x, dy = ty + .5 - y, gx = Math.floor(dx * c + dy * s + px), gy = Math.floor(-dx * s + dy * c + py);
    if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue;
    const e = map[rows[gy][gx]]; if (e) bi_put(P, tx, ty, e[0], e[1]);
  }
}
const bi_FIRC = ['#7a1a12', '#b8381a', '#e0702a', '#f6a63e', '#ffd878', '#fff4cc'];
/* Kopf mit Hals, Brust und Vorderläufen. jaw = Öffnung (rad), hb = Kopfversatz, fire/ember/tongue = Zusätze */
function bi_lwHead(q){
  const M = bi_M, P = bi_buf(bi_LW.w, bi_LW.h, bi_LW.ax, bi_LW.ay), by = q.by || 0, jaw = q.jaw || 0, hb = q.hb || [0, 0];
  const hx = 9 + hb[0], hy = -40 + by + hb[1];
  const belly = (lv, k) => [M.bly, (Math.floor(k) % 3) === 0 ? 0 : clamp(lv + 2, 2, 4)];
  // ferner Vorderlauf
  bi_lwLeg(P, [-8.5, -12 + by], q.fF, true);
  // Halsweg: Brust → Hinterkopf
  const nk = [[-4, -15 + by], [2, -22 + by + hb[1] * .4], [hx + 4, hy + 10]];
  // Rückenkamm: Hornstacheln mit dunkler Haut dazwischen
  bi_part(P, 1);
  const crest = [];
  for (let i = 0; i < 2; i++){
    const a = nk[i], c = nk[i + 1], dx = c[0] - a[0], dy = c[1] - a[1], L = Math.hypot(dx, dy), nx = dy / L, ny = -dx / L;
    for (let t = .15; t < 1; t += .34){ const r = (6.2 - i * 1.3) - t * 1.1; crest.push([a[0] + dx * t + nx * (r - 1), a[1] + dy * t + ny * (r - 1), Math.atan2(ny, nx) - .55, 4.8 - i * .6]); }
  }
  [[-11, -18.5 + by, -2.35, 4], [-15.5, -14.5 + by, -2.6, 3.4]].forEach(c => crest.unshift(c));
  for (const [x, y, a, h] of crest) bi_spike(P, x, y, a, h, 1.5);
  // Brust mit Bauchschilden
  bi_part(P, 1);
  bi_ell(P, -6, -12.5 + by, 10.5, 8.6, M.scl, { d: .35, tex: (x, y, lv, u, v) => (u * .45 + v > .62 && u > -.3 ? belly(lv, (y - by) * .7 - x * .5) : bi_scales(lv, x, y)) });
  // Hals in zwei Gliedern, Kehlschilde vorn
  for (let i = 0; i < 2; i++){
    bi_part(P, 1);
    const a = nk[i], c = nk[i + 1], len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    bi_cap(P, a[0], a[1], c[0], c[1], 6.4 - i * 1.2, 5.2 - i * .9, M.scl, { d: .35, tex: (x, y, lv, u, v) => (v < -.5 ? belly(lv + (v < -.85 ? -1 : 0), (u * len + i * 7) / 1.1) : bi_scales(lv, x, y)) });
  }
  // Ohrfächer hinter dem Kiefer
  bi_part(P, 1);
  [[2.7, 6], [3.1, 5], [2.3, 5.2]].forEach(([a, l]) => bi_spike(P, hx + 4, hy + 8, a, l, 1.3));
  // Rachen (offen): dunkelrot, innen glühend
  const hgx = hx + 3.5, hgy = hy + 13.5, J = (x, y) => { const dx = x - hgx, dy = y - hgy, c = Math.cos(jaw), s = Math.sin(jaw); return [hgx + dx * c - dy * s, hgy + dx * s + dy * c]; };
  if (jaw > 0){
    bi_part(P, 1);
    bi_poly(P, [[hx + 5, hy + 11], [hx + 20, hy + 11], J(hx + 20, hy + 12), J(hx + 5, hy + 12.5)], M.mth, { tex: (x, y) => (x > hx + 15 ? 2 : x > hx + 10 ? 1 : 0) });
    // Zunge im Unterkiefer
    for (let x = hx + 7; x < hx + 17; x++){ const p = J(x, hy + 12); bi_put(P, p[0], p[1] - 1, M.red, x > hx + 13 ? 3 : 2); }
    if (q.glowM) for (let y = hy + 9; y < hy + 22; y++) for (let x = hx + 4; x < hx + 22; x++) if (bi_has(P, x, y, M.mth)){
      const d = (x - hx - 4) / 16, g = d < .4 ? 3 : d < .65 ? 2 : d < .85 ? 1 : 0;
      if (g){ bi_put(P, x, y, M.fir, g + (q.fire ? 1 : 0)); bi_glow(P, x, y, bi_FIRC[g + (q.fire ? 1 : 0)]); }
    }
  }
  // Unterkiefer, Oberkopf
  bi_part(P, 1);
  bi_gridRot(P, hgx, hgy, bi_LWJ, bi_LWM, 1.5, 2.5, jaw);
  if (q.glowM) for (const [c, r] of [[4, 0], [6, 0], [8, 0]]){ const p = J(hx + 2 + c, hy + 11 + r); bi_glow(P, p[0], p[1], '#e0702a'); }
  bi_part(P, 1);
  bi_grid(P, hx, hy, bi_LWH, bi_LWM);
  for (let r = 0; r < bi_LWH.length; r++) for (let c = 0; c < bi_LWH[r].length; c++){
    const ch = bi_LWH[r][c]; if (ch === 'E') bi_glow(P, hx + c, hy + r, '#ffe08a'); else if (ch === 'F') bi_glow(P, hx + c, hy + r, '#e0702a');
  }
  // gespaltene Zunge
  if (q.tongue){
    bi_part(P, 1);
    for (const [x, y, l] of [[20, 11, 2], [21, 12, 3], [22, 12, 3], [23, 11, 4], [24, 10, 3], [23, 13, 2], [24, 13, 3]]) bi_put(P, hx + x, hy + y, M.red, l);
  }
  // naher Vorderlauf
  bi_lwLeg(P, [1.5, -11 + by], q.fN, false);
  // Funken vor dem Maul
  if (q.ember){
    bi_part(P, 0, 1);
    for (const [x, y, c] of [[23, 9, 3], [25, 7, 2], [24, 5, 4], [26, 10, 1], [22, 6, 2]]){ bi_put(P, hx + x, hy + y, M.fir, c); bi_glow(P, hx + x, hy + y, bi_FIRC[c]); }
  }
  // Feuerstoß aus dem Maul: heller Kern, gezackte Zungen
  if (q.fire){
    bi_part(P, 0, 1);
    const m0 = J(hx + 20, hy + 12), cy = (hy + 11 + m0[1]) / 2;
    for (let x = hx + 18; x < hx + 34; x++){
      const t = (x - hx - 18) / 5;
      for (let y = Math.floor(cy - 8); y <= cy + 8; y++){
        const n = bi_N2(x * .7 + 3, y * .9), half = 1.2 + t * 1.6 + (n - .5) * 2.2 - (t > 2.2 ? (t - 2.2) * 2.4 : 0), d = Math.abs(y + .5 - cy + t * .3);
        if (d > half) continue;
        const lv = clamp(Math.round(5.3 - d / half * 3.6 - t * .45 + (n - .5)), 0, 5);
        bi_put(P, x, y, M.fir, lv); bi_glow(P, x, y, bi_FIRC[lv]);
      }
    }
  }
  return { f: bi_frame(P), mouth: [hx + 22, Math.round(hy + 12 + jaw * 5)] };
}
/* Körperglied: Schuppenwalze mit Bauchschilden und Rückenstachel (richtungsneutral).
   Nur senkrecht schattiert und nur oben/unten konturiert, damit die überlappenden Glieder zu einem Leib verschmelzen. */
function bi_lwSeg(d, k){
  const M = bi_M, sh = Math.round(d * .2) + 2, w = d + 2, h = Math.round(d * .82) + sh + 2;
  const P = bi_buf(w, h, 0, 0), cx = w / 2, cy = h - 1 - d * .41, rx = d / 2, ry = d * .41;
  // Rückenstachel mit kleinem Nebenstachel
  bi_part(P, 1);
  bi_spike(P, cx + .5, cy - ry + 1.5, -1.62, sh + 1, Math.max(1.4, d * .085));
  bi_part(P, 1);
  bi_spike(P, cx - d * .28, cy - ry + 2.6, -1.85, sh * .5 + 1, Math.max(1.1, d * .06));
  bi_part(P, 1, 1);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = 0; x < w; x++){
    const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry;
    if (u * u + v * v > 1) continue;
    if (v > .5){ bi_put(P, x, y, M.bly, clamp(3 - Math.round((v - .5) * 5) - ((x + k) % 4 === 0 ? 1 : 0), 0, 4)); continue; }   // Bauchschilde
    if (v > .38){ bi_put(P, x, y, M.scl, 0); continue; }
    const s = .62 - v * .5 - Math.abs(v + .45) * .25 + (dither(x, y) - .5) * .25;
    bi_put(P, x, y, M.scl, bi_scales(clamp(Math.round(s * 5.2), 1, 5), x + k * 3, y, d > 18 ? 3 : 2.5));
  }
  const r = bi_img(P), c = r.img, g = c.getContext('2d'), id = g.getImageData(0, 0, w, h), D = new Uint32Array(id.data.buffer), oc = bi_OC[M.scl];
  const fill = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) fill[i] = D[i] >>> 24 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const i = y * w + x; if (fill[i]) continue;
    if ((y > 0 && fill[i - w]) || (y < h - 1 && fill[i + w])) D[i] = oc;
  }
  g.putImageData(id, 0, 0);
  return { img: c, white: whiteOf(c), w, h };
}
/* Schwanzspitze: kleines Glied mit aufgestellter, pfeilförmiger Spitze */
function bi_lwTail(){
  const M = bi_M, w = 14, h = 24, P = bi_buf(w, h, 0, 0), cx = 7, cy = h - 5;
  bi_part(P, 1);
  for (let k = 0; k < 8; k++){ const t = k / 7; bi_ell(P, cx + Math.sin(t * 2.2) * 1.5, cy - 3 - k * 1.7, 2.6 - t * 1.6, 1.6, M.scl, { tex: (x, y, lv) => bi_scales(lv, x, y, 2) }); }
  bi_part(P, 1);
  bi_poly(P, [[cx + 1.4, 3], [cx + 4.2, 7], [cx + 2.2, 6.4], [cx + 1.4, 8.4], [cx + .4, 6.4], [cx - 1.6, 7]], M.hrn, { n: [-.4, -.6, .6], b: -.25 });
  bi_part(P, 1);
  bi_ell(P, cx, cy, 5.6, 3.6, M.scl, { tex: (x, y, lv, u, v) => (v > .5 ? [M.bly, clamp(lv, 1, 3)] : bi_scales(lv, x, y, 2.5)) });
  const r = bi_img(P);
  return { img: r.img, white: whiteOf(r.img), w, h };
}
function bi_lindwurm(){
  const A = bi_LW;
  const steps = [[[4, -1], [-5, -1]], [[7, -3], [-6, -1]], [[6, -1], [-3, -3]], [[2.4, -1], [-7.5, -1]]];
  const idle = [0, 1].map(i => bi_lwHead({ by: i, fN: [5, -1], fF: [-4.5, -1], tongue: i === 1 }).f);
  const move = steps.map((s, i) => bi_lwHead({ by: i % 2 ? -1 : 0, hb: [0, i % 2 ? 1 : 0], fN: s[0], fF: s[1] }).f);
  const open = bi_lwHead({ by: -1, hb: [-2, -1], fN: [6, -1], fF: [-4, -1], jaw: .38, ember: 1, glowM: 1 });
  const fire = bi_lwHead({ by: 0, hb: [1, 0], fN: [6.5, -1], fF: [-3.5, -1], jaw: .55, fire: 1, glowM: 1 });
  const segs = [26, 24, 22, 20, 18, 16, 14, 12].map((d, k) => bi_lwSeg(d, k));
  return { w: A.w, h: A.h, ax: A.ax, ay: A.ay, idle: facing(idle), move: facing(move), act: facing([open.f, fire.f]), segs, tail: bi_lwTail(),
    mouth: { x: fire.mouth[0], y: fire.mouth[1] } };
}
BOSS_ART.lindwurm = bi_lindwurm();
/* ============ Stromland: Flusspiraten, Piratenschützen, Nöcke, Hinrich Rotbart, der Waller ============ */
/* Spielart einer vorhandenen Zeichnung: Materialien einer Tafel für die Dauer des Malens tauschen */
function mo_with(T, over, fn){
  const save = {};
  for (const k in over){ save[k] = T[k]; T[k] = over[k]; }
  try { return fn(); } finally { Object.assign(T, save); }
}
const mo_PIR = {   // Flusspirat: blaugraues Wams, Leinenhemd, rote Zipfelmütze (die Feder hängt als Zipfel)
  red: mo_mat('#141a24', '#1e2735', '#2b3648', '#3b475b', '#4d5a6e'),
  och: mo_mat('#4e4a3e', '#78725f', '#a29a80', '#c2bba0', '#d6d0b6'),
  gry: mo_mat('#231a12', '#382a1d', '#4e3c2a', '#655038'),
  ber: mo_mat('#3a0f0d', '#5e1a16', '#842a21', '#a3402f'),
  fea: mo_mat('#3a0f0d', '#5e1a16', '#842a21', '#a3402f'),
  hai: mo_mat('#140f0b', '#241a12', '#35271b', '#47372a')
};
const mo_ROT = {   // Hinrich Rotbart: karmesinroter Rock mit Goldfutter, schwarzer Hut mit weißer Feder, roter Bart
  red: mo_mat('#2a0708', '#4a0d10', '#6e1518', '#911f21', '#ae302c'),
  och: mo_mat('#4e3812', '#7a5a1c', '#a8822c', '#d0a843', '#e6c460'),
  gry: mo_mat('#101012', '#1c1c20', '#2a2a30', '#3c3c44'),
  ber: mo_mat('#0d0c0e', '#18161a', '#242128', '#333038'),
  fea: mo_mat('#7a776e', '#a8a598', '#d2cec0', '#f0ece0'),
  hai: mo_mat('#4a1508', '#7a240c', '#a83a14', '#c8561e')
};
MON_ART.pirat = mo_with(mo_LK, mo_PIR, () => Object.assign(mo_set(78, 57, 39, 54, mo_pluend, mo_PLUEND), { reach: 37 }));
MON_ART.rotbart = mo_with(mo_LK, mo_ROT, () => Object.assign(mo_set(78, 57, 39, 54, mo_pluend, mo_PLUEND), { reach: 37 }));
MON_ART.pschuetze = mo_with(mo_AB, {
  hat: mo_mat('#3a0f0d', '#5e1a16', '#842a21', '#a3402f', '#bd5a42'),
  brg: mo_mat('#1a1410', '#2c2219', '#3e3123', '#52412f', '#66533c'),
  wam: mo_mat('#141a24', '#1e2735', '#2b3648', '#3b475b'),
  hos: mo_mat('#4e4a3e', '#78725f', '#a29a80', '#c2bba0')
}, () => Object.assign(mo_set(50, 54, 25, 51, mo_armbrust, mo_ARMBRUST), { muzzle: mo_muzzle(mo_ARMBRUST.act[0]) }));
MON_ART.nix = mo_with(mo_MO, {   // Nöck: grünblaue, nass glänzende Haut, Haar wie Wasserpest
  skn: mo_mat('#0a1614', '#12251f', '#1c372d', '#294c3e', '#386351', '#4c7b66'),
  hai: mo_mat('#0b1a12', '#14301e', '#1f472b'),
  cap: mo_mat('#0b1a12', '#14301e', '#1f472b', '#2c5c38'),
  rop: mo_mat('#16301c', '#22462a', '#335f3a'),
  wol: mo_mat('#0e1418', '#172128', '#212f38', '#2d3e4a'),
  wed: mo_mat('#13301a', '#1f4a26', '#2e6633', '#438240', '#5e9c50')
}, () => mo_set(50, 54, 25, 52, mo_moor, mo_MOOR));

/* ---------- Der Waller: ein riesiger Wels, der sich durch Schlamm und Altwasser schiebt ---------- */
const mo_WELS = {
  skn: mo_mat('#0c0f0b', '#171c14', '#232b1d', '#323c27', '#434f33', '#566241'),
  bel: mo_mat('#3e3b2e', '#5c5745', '#7a7460', '#99927a', '#b3ac92'),
  fin: mo_mat('#11140f', '#1d221a', '#2c3226', '#3d4434'),
  mth: mo_mat('#250b0b', '#421614', '#622420', '#7e3a30'),
  bar: mo_mat('#1a1e16', '#2d3326', '#43493a')
};
function mo_wels(P, p){
  const C = mo_WELS, ph = p.ph || 0, op = p.open || 0, lift = p.lift || 0, by = p.by || 0, N = 10, pts = [];
  for (let i = 0; i <= N; i++){
    const t = i / N, x = -52 + t * 82, wav = Math.sin(t * 3.4 + ph) * (1 - t) * 4.5;
    pts.push([x, -11 + wav + by - (t > .7 ? lift * (t - .7) * 7 : 0), 2.6 + Math.pow(t, .75) * 10.5]);
  }
  // Schwanzflosse
  const tl = pts[0], sw = Math.sin(ph) * 2.5;
  mo_poly(P, [[tl[0] + 3, tl[1] - 2], [tl[0] - 9, tl[1] - 10 + sw], [tl[0] - 6, tl[1]], [tl[0] - 10, tl[1] + 9 + sw], [tl[0] + 3, tl[1] + 3]], C.fin, { cyl: .4, d: .3 });
  mo_end(P);
  // lange Afterflosse unten
  for (let i = 1; i < N - 3; i++){ const a = pts[i]; mo_line(P, a[0], a[1] + a[2] - 1, a[0] + 6, a[1] + a[2] + 2 + Math.sin(ph + i) * .8, C.fin, 2); }
  mo_end(P);
  // Rumpf: Kette von Kapseln, Bauch hell, Rücken gefleckt
  for (let i = 0; i < N; i++){
    const a = pts[i], b = pts[i + 1];
    mo_cap(P, a[0], a[1], b[0], b[1], a[2], b[2], C.skn, { b: .02, tex: (x, y, lv, u, v) => v > .42 ? [C.bel, clamp(lv + (v > .7 ? 1 : 0), 0, 3)] : (mo_N(x * .45 + 3, y * .45) < .3 ? lv - 1 : mo_hash(x, y, 4) < .05 ? lv + 1 : undefined) });
  }
  mo_end(P);
  // kleine Rückenflosse, Brustflosse
  const df = pts[6]; mo_poly(P, [[df[0] - 2, df[1] - df[2] + 1], [df[0] + 2, df[1] - df[2] - 6], [df[0] + 6, df[1] - df[2] + 1]], C.fin, { cyl: .2 }); mo_end(P);
  const pf = pts[8]; mo_poly(P, [[pf[0], pf[1] + 4], [pf[0] - 9, pf[1] + 12 + Math.sin(ph * 2)], [pf[0] - 3, pf[1] + 10], [pf[0] + 3, pf[1] + 6]], C.fin, { cyl: .3, b: .05 }); mo_end(P);
  // Kopf: breit und flach, Maul vorn, offen beim Zustoßen
  const h = pts[N], hx = h[0], hy = h[1];
  mo_ell(P, hx + 6, hy + 1, 13.5, 9.6, C.skn, { b: .04, tex: (x, y, lv, u, v) => (y - hy > 3 ? [C.bel, lv] : mo_N(x * .5, y * .5 + 9) < .28 ? lv - 1 : undefined) });
  if (op > 0){
    mo_poly(P, [[hx + 9, hy + 3], [hx + 20, hy - 2 - op * 3], [hx + 21, hy + 1], [hx + 20, hy + 6 + op * 3]], C.mth, { cyl: 0 });
    for (let k = 0; k < 5; k++){ mo_put(P, hx + 12 + k * 2, hy + 1 - op * (k / 4) * 2, mo_BONE, 3); mo_put(P, hx + 12 + k * 2, hy + 5 + op * (k / 4) * 2, mo_BONE, 2); }
  } else mo_line(P, hx + 10, hy + 3, hx + 19, hy + 2, mo_DARK, 0);
  mo_end(P, 1);
  // Barteln: zwei lange am Oberkiefer, kurze am Kinn, wiegen sich
  const w = Math.sin(ph) * 2;
  for (const [sx, sy, k] of [[hx + 17, hy - 1, 1], [hx + 16, hy, -1]]){
    let px = sx, py = sy;
    for (let j = 1; j <= 7; j++){ const nx = sx + 3 - j * 3.2, ny = sy + j * 2.2 + w * (j / 7) * k + (j > 4 ? (j - 4) * 1.2 : 0); mo_line(P, px, py, nx, ny, C.bar, j < 3 ? 2 : 1); px = nx; py = ny; }
  }
  for (const dx of [10, 13, 16]){ mo_line(P, hx + dx, hy + 7, hx + dx - 1, hy + 11 + (dx & 1), C.bar, 1); }
  // Auge: klein, gelblich
  mo_put(P, hx + 11, hy - 4, mo_BONE, 3); mo_put(P, hx + 12, hy - 4, mo_DARK, 0);
  mo_end(P, 1);
  mo_halo(P, hx + 11.5, hy - 4, 1.6, '#f0e08a', .3);
}
const mo_WELSP = {
  idle: [{ ph: 0 }, { ph: .8, by: .5 }],
  move: [{ ph: 0 }, { ph: 1.6 }, { ph: 3.1 }, { ph: 4.7 }],
  act: [{ ph: .4, lift: 1.2, open: .6 }, { ph: 2.2, lift: 2.6, open: 1.8 }]
};
BOSS_ART.wels = mo_set(132, 54, 66, 49, mo_wels, mo_WELSP);
/* ---------- Der Nöck der Zollburg: Flussgeist, der aus einem Wasserwirbel aufsteigt, mit rostiger Zollkrone und Dreizack ---------- */
const mo_NK = {
  skn: mo_mat('#08161a', '#0f2428', '#183639', '#244b4c', '#326461', '#46807a'),
  bel: mo_mat('#1c3a32', '#2a5244', '#3c6c58', '#548a6e', '#6ea684'),
  crn: mo_mat('#3a2a0c', '#644a14', '#937022', '#c19a36', '#e2c260'),
  pat: mo_mat('#173a34', '#245a4c', '#3a7e66'),
  irn: mo_mat('#1e1712', '#3e2e22', '#614834', '#86684c', '#ac8c68'),
  wat: mo_mat('#10283a', '#18404f', '#245a6a', '#3a7a8c', '#64a2b2', '#a8d4de'),
  hai: mo_mat('#0a1a10', '#12301c', '#1d4a29', '#2c6436')
};
function mo_noeck(P, p){
  const C = mo_NK, bx = p.bx || 0, by = p.by || 0, ph = p.ph || 0, rs = p.raise || 0, th = p.thr || 0;
  // Wasserwirbel am Grund: Ringe drehen sich mit der Phase
  mo_ell(P, 0, -4, 31, 7.5, C.wat, { lv: 2, tex: (x, y, lv) => {
    const r = Math.hypot(x / 31, (y + 4) / 7.5), a = Math.atan2((y + 4) * 4, x);
    const ring = Math.sin(r * 15 - ph * 2 + a * 1.5);
    return r > .9 ? 1 : ring > .75 ? 5 : ring > .35 ? 4 : r < .45 ? 1 : 2;
  } });
  mo_end(P, 0);
  for (let k = 0; k < 9; k++){ const a = k / 9 * 6.283 + ph, x = Math.cos(a) * 28, y = -4 + Math.sin(a) * 6.5; mo_put(P, x, y - 1, C.wat, 5); mo_put(P, x + 1, y - 2, C.wat, 4); }
  // Haar aus Wasserpest fällt hinter dem Kopf über den Rücken
  const hx = 6 + bx + th * 3, hy = -82 + by + (rs ? -1 : 0);
  for (let k = 0; k < 8; k++){
    let x = hx - 11 + k * 1.3, y = hy - 6 + (k & 1);
    const len = 22 + (k * 7 % 9) - k;
    for (let j = 0; j < len; j++){ mo_put(P, x, y + j, C.hai, clamp(2 - (j > len - 3 ? 1 : 0) + ((j + k) % 5 === 0 ? 1 : 0), 0, 3)); if (((j * 3 + k * 5) % 6) === 0) x -= 1; if (Math.sin(ph + j * .4 + k) > .92) x += 1; }
  }
  mo_end(P, 1);
  // Rückenflosse, stachelig, vom Nacken bis zur Hüfte
  const fin = []; for (let i = 0; i <= 6; i++){ const y = -70 + i * 5; fin.push([-19 + (i > 3 ? (i - 3) * 1.5 : 0) + bx, y + by]); fin.push([-27 + (i & 1 ? 4 : 0) + (i > 3 ? (i - 3) * 2 : 0) + bx, y + 2.5 + by]); }
  mo_poly(P, fin.concat([[-14 + bx, -38 + by], [-12 + bx, -70 + by]]), C.bel, { cyl: .3, b: -.12, tex: (x, y, lv) => (((y - by) & 3) === 0 ? lv - 1 : undefined) });
  mo_end(P);
  // ferner Arm: hebt sich drohend, Klauenhand
  const fa = rs ? [-15, -63, -27, -76, -23, -92] : th ? [-15, -63, -26, -55, -33, -47] : [-15, -63, -27, -52, -27, -38 + Math.sin(ph) * 1.5];
  const [fsx, fsy, fex, fey, fhx, fhy] = fa.map((v, i) => v + (i % 2 ? by : bx));
  mo_cap(P, fsx, fsy, fex, fey, 5, 4, C.skn, { b: -.22 });
  mo_cap(P, fex, fey, fhx, fhy, 4, 3, C.skn, { b: -.22 });
  mo_claw(P, fhx, fhy, fhx - fex, fhy - fey, C.skn, 6, 1);
  mo_weed(P, fex, fey + 2, 7, 41 + (ph * 3 | 0), 1);
  mo_end(P);
  // Leib steigt aus dem Wasser
  mo_cap(P, bx * .4, -36 + by, 0, -8, 12.5, 15.5, C.skn, { b: .02, tex: (x, y, lv, u, v) => {
    if (Math.abs(v) < .5) return [C.bel, clamp(lv - 1 + (((y - by) & 3) === 0 ? -1 : 1), 0, 4)];
    return (((x + (y >> 1) * 2) % 4) === 0 && (y & 1)) ? lv - 1 : mo_hash(x, y, 3) < .05 ? lv + 1 : undefined;
  } });
  mo_end(P);
  // Rumpf: breite Schultern, Bauchschilde, Kiemen
  const body = [[-20, -65], [-8, -71], [9, -71], [22, -65], [19, -53], [14, -43], [12, -34], [-12, -34], [-14, -43], [-19, -54]].map(q => [q[0] + bx, q[1] + by]);
  mo_poly(P, body, C.skn, { cyl: .95, d: .2, tex: (x, y, lv, u, v) => {
    const X = x - bx, Y = y - by;
    if (u > .3 && u < .72 && Y > -60) return [C.bel, clamp(lv - 1 + ((Y & 3) === 0 ? -1 : 1), 0, 4)];
    if (Y > -64 && Y < -50 && u > .8 && ((Y + 64) % 4 === 0)) return lv - 2;
    if (mo_hash(x, y, 9) < .04) return lv + 2;
    return undefined;
  } });
  mo_end(P);
  for (let x = -12; x <= 12; x++) mo_put(P, x + bx, -36 + by + ((x & 1) ? 1 : 0), C.irn, (x & 1) ? 3 : 4);
  mo_ell(P, 2 + bx, -35 + by, 2.6, 2.4, C.crn, { b: .05 });
  mo_end(P, 1);
  // Kopf: breit, Fischmaul, Flossenohren
  mo_poly(P, [[hx - 14, hy - 1], [hx - 10, hy - 4], [hx - 15, hy - 10], [hx - 7, hy - 5]], C.skn, { b: -.15, cyl: .3 });
  mo_ell(P, hx, hy, 11.5, 10, C.skn, { b: .05, tex: (x, y, lv, u, v) => (v > .35 ? [C.bel, clamp(lv - 1, 0, 4)] : mo_hash(x, y, 5) < .06 ? lv + 1 : undefined) });
  mo_poly(P, [[hx + 9, hy - 2], [hx + 17, hy - 8], [hx + 15, hy + 1]], C.skn, { b: .1, cyl: .3 });
  mo_end(P, 1);
  // Gesicht: glühende Augen, breites Maul mit Zähnen, Barteln
  for (const ex of [2, 7]){ mo_put(P, hx + ex, hy - 2, mo_DARK, 0); mo_put(P, hx + ex + 1, hy - 2, mo_BONE, 4); mo_put(P, hx + ex, hy - 3, mo_DARK, 0); mo_put(P, hx + ex + 1, hy - 3, mo_DARK, 0); mo_glow(P, hx + ex + 1, hy - 2, '#7ff0e0', 1); }
  mo_halo(P, hx + 5, hy - 2, 5, '#7ff0e0', .35);
  const mo = rs || th ? 2 : 0;
  mo_line(P, hx - 3, hy + 3, hx + 11, hy + 3, mo_DARK, 0);
  if (mo){ mo_line(P, hx - 2, hy + 4, hx + 10, hy + 4 + mo, mo_DARK, 0); mo_line(P, hx - 1, hy + 5, hx + 9, hy + 5 + mo, mo_DARK, 1); }
  for (let k = 0; k < 7; k++) mo_put(P, hx - 2 + k * 2, hy + 3 + (k & 1) * (mo ? mo + 1 : 0), mo_BONE, 4);
  for (const [sx, sy, d] of [[hx + 11, hy + 4, 1], [hx - 3, hy + 4, -1]]){ let px = sx, py = sy; for (let j = 1; j < 7; j++){ const nx = sx + d * j * .6, ny = sy + j * 1.9 + Math.sin(ph + j) * .6; mo_line(P, px, py, nx, ny, C.hai, j < 3 ? 3 : 2); px = nx; py = ny; } }
  mo_end(P, 1);
  // Zollkrone: rostiges Gold mit Grünspan, fünf Zacken
  mo_poly(P, [[hx - 9, hy - 7], [hx + 9, hy - 7], [hx + 9, hy - 11], [hx - 9, hy - 11]], C.crn, { cyl: .9, tex: (x, y, lv) => (mo_hash(x, y, 21) < .22 ? [C.pat, 1] : undefined) });
  for (let k = 0; k < 5; k++){ const x0 = hx - 9 + k * 4.5; mo_poly(P, [[x0 - 1.4, hy - 11], [x0 + 1.4, hy - 11], [x0, hy - 16 - (k === 2 ? 2 : 0)]], C.crn, { cyl: .4, b: .08 }); mo_put(P, x0, hy - 16 - (k === 2 ? 2 : 0), C.crn, 4); }
  mo_put(P, hx, hy - 9, mo_BONE, 4); mo_glow(P, hx, hy - 9, '#bff8ff', .8);
  mo_end(P, 1);
  // naher Arm mit Dreizack: aufrecht, zum Stoß erhoben oder vorgestoßen
  const na = rs ? [15, -63, 22, -74, 16, -88] : th ? [15, -63, 28, -58, 41, -55] : [15, -63, 25, -52, 27, -42];
  const [nsx, nsy, nex, ney, nhx, nhy] = na.map((v, i) => v + (i % 2 ? by : bx));
  let s0, s1;
  if (rs){ s0 = [nhx + 14, nhy + 18]; s1 = [nhx - 16, nhy - 18]; }
  else if (th){ s0 = [nhx - 26, nhy + 3]; s1 = [nhx + 22, nhy - 2]; }
  else { s0 = [nhx + 2, -6 + by]; s1 = [nhx + 4, -102 + by]; }
  mo_line(P, s0[0], s0[1], s1[0], s1[1], C.irn, (k, n) => k % 6 === 0 ? 2 : 4);
  mo_line(P, s0[0] + (th ? 0 : 1), s0[1] + (th ? 1 : 0), s1[0] + (th ? 0 : 1), s1[1] + (th ? 1 : 0), C.irn, 2);
  const ux = s1[0] - s0[0], uy = s1[1] - s0[1], ul = Math.hypot(ux, uy) || 1, dx = ux / ul, dy = uy / ul, px = -dy, py = dx;
  mo_line(P, s1[0] - px * 6, s1[1] - py * 6, s1[0] + px * 6, s1[1] + py * 6, C.irn, 4);
  mo_line(P, s1[0] - px * 6 - dx, s1[1] - py * 6 - dy, s1[0] + px * 6 - dx, s1[1] + py * 6 - dy, C.irn, 2);
  for (const o of [-6, 0, 6]){
    const bx0 = s1[0] + px * o, by0 = s1[1] + py * o, L = o ? 9 : 12;
    mo_line(P, bx0, by0, bx0 + dx * L, by0 + dy * L, C.irn, 4); mo_line(P, bx0 + px * .8, by0 + py * .8, bx0 + dx * (L - 1) + px * .8, by0 + dy * (L - 1) + py * .8, C.irn, 2);
    const sg = o ? Math.sign(o) : 1; mo_put(P, bx0 + dx * (L - 3) + px * sg * 1.2, by0 + dy * (L - 3) + py * sg * 1.2, C.irn, 3);   // Widerhaken
  }
  mo_weed(P, s1[0] - dx * 5, s1[1] - dy * 5 + 1, 6, 77 + (ph * 2 | 0), 2);
  mo_end(P);
  mo_ell(P, 15 + bx, -63 + by, 6, 5, C.skn, { b: .1 });
  mo_cap(P, nsx, nsy, nex, ney, 5, 4, C.skn, { b: .05, tex: (x, y, lv, u, v) => (v < -.35 ? lv + 1 : undefined) });
  mo_cap(P, nex, ney, nhx, nhy, 4, 3.2, C.skn, { b: .05 });
  mo_ell(P, nhx, nhy, 3.4, 3.2, C.skn, { b: .12 });
  mo_weed(P, nex - 1, ney + 2, 6, 33 + (ph * 3 | 0), 2);
  mo_end(P);
  if (p.drip !== undefined){ mo_glow(P, nhx, nhy + 4 + p.drip, '#b4e0e8', .85); mo_glow(P, fhx, fhy + 5 + ((p.drip + 1) % 3), '#b4e0e8', .7); }
}
const mo_NOECKP = {
  idle: [{ ph: 0, drip: 0 }, { ph: .9, by: 1, drip: 2 }],
  move: [{ ph: 0, drip: 0 }, { ph: 1.6, by: 1, drip: 1 }, { ph: 3.1, drip: 2 }, { ph: 4.7, by: 1, drip: 0 }],
  act: [{ ph: .5, raise: 1, bx: -2 }, { ph: 2, thr: 1, bx: 3, by: 1 }]
};
BOSS_ART.noeck = Object.assign(mo_set(128, 124, 60, 116, mo_noeck, mo_NOECKP), { reach: 58 });
/* ============ Bergland (Version 25): Gegner aus Schwarzwald, Silberrevier, Söldnerschanze und Hochgebirge ============ */
/* ---------- Vierbeiner im Profil (Blick rechts): Grauwolf und Braunbär teilen sich den Maler, S ist der Bauplan der Art ----------
   Pose p: bx, by Leib; tilt Neigung (+ Kopf tiefer); hd [dx, dy] Kopf; jaw 0..3; ears 1 angelegt; tail Schwanzwinkel;
   hf, ff, hn, fn Fußpunkte (fern hinten, fern vorn, nah hinten, nah vorn), y 0 = Boden */
function mo_quad(P, S, p){
  const C = S.C, bx = p.bx || 0, by = p.by || 0, tl = p.tilt || 0, hd = p.hd || [0, 0];
  const hip = [S.hip[0] + bx, S.hip[1] + by - tl * 3], sho = [S.sho[0] + bx, S.sho[1] + by + tl * 3];
  const furT = (L, sd) => mo_strand(L, sd);
  const leg = (fore, near, foot) => {
    const b = near ? 0 : -.26, top = fore ? [sho[0] - 1, sho[1] + 2] : [hip[0] + 1, hip[1] + 1], [r0, r1] = fore ? S.legR[1] : S.legR[0];
    if (fore){
      const pas = [foot[0] - .5, foot[1] - S.paw * 1.4], el = mo_ik(top[0], top[1], pas[0], pas[1], S.legL[1][0], S.legL[1][1], -1);
      mo_cap(P, top[0], top[1], el[0], el[1], r0 * 1.25, r1, near ? C.fur : C.fur, { b, d: .3, tex: furT(10, 3) });
      mo_cap(P, el[0], el[1], pas[0], pas[1], r1, r1 * .8, C.fur, { b, tex: furT(8, 4) });
      mo_cap(P, pas[0], pas[1], foot[0] + S.paw * .6, foot[1] - S.paw * .5, r1 * .8, S.paw * .55, C.fur, { b: b - .04 });
    } else {
      const hock = [foot[0] - S.hock[0], foot[1] - S.hock[1]], kn = mo_ik(top[0], top[1], hock[0], hock[1], S.legL[0][0], S.legL[0][1], 1);
      mo_cap(P, top[0], top[1], kn[0], kn[1], r0 * 1.5, r1 * 1.1, C.fur, { b, d: .3, tex: furT(10, 5) });      // Keule
      mo_cap(P, kn[0], kn[1], hock[0], hock[1], r1 * 1.05, r1 * .8, C.fur, { b, tex: furT(8, 6) });
      mo_cap(P, hock[0], hock[1], foot[0] + S.paw * .5, foot[1] - S.paw * .5, r1 * .8, S.paw * .55, C.fur, { b: b - .04 });
    }
    mo_ell(P, foot[0] + S.paw * .4, foot[1] - S.paw * .45, S.paw, S.paw * .6, C.fur, { b: b - .05 });
    for (let k = 0; k < 3; k++) mo_put(P, foot[0] + S.paw * .9 + k * .8, foot[1] - .5, mo_BONE, near ? 2 : 0);   // Krallen
    mo_end(P, near ? 2 : 1);
  };
  // Schwanz hinter allem
  if (S.tail){
    const ta = (p.tail || 0) + S.tail.a, t0 = [hip[0] - S.tail.o, hip[1] - 1];
    let px = t0[0], py = t0[1];
    for (let k = 1; k <= S.tail.n; k++){
      const a = ta + k * S.tail.curl, nx = px + Math.cos(a) * S.tail.seg, ny = py + Math.sin(a) * S.tail.seg, r = S.tail.r * (1 - k / (S.tail.n + 2) * .45);
      mo_cap(P, px, py, nx, ny, r, r * .9, C.fur, { d: .4, tex: (x, y, lv, u, v) => (k === S.tail.n && u > .5 ? [C.sad, lv - 1] : mo_hash(x, y, 9) < .3 ? lv + 1 : undefined) });
      px = nx; py = ny;
    }
    mo_shag(P, [C.fur], -1, 0, .45, 31, 1, true);
    mo_end(P, 1);
  }
  leg(false, false, p.hf); leg(true, false, p.ff);
  // Leib: Keule hinten, tiefe Brust vorn, Bauch hell
  mo_cap(P, hip[0], hip[1], sho[0], sho[1], S.rH, S.rS, C.fur, { d: .35, tex: (x, y, lv, u, v) => {
    if (v > .5) return [C.bel, clamp(lv - (v > .8 ? 1 : 0), 0, 4)];
    if (v < -.45 && S.saddle && u > .15 && u < .85) return [C.sad, clamp(lv, 0, 3)];
    const lane = Math.round(v * 4), seg = Math.floor((x + mo_hash(lane, 3, 17) * 3) / 3), q = mo_hash(lane + 40, seg, 17);
    return q < .22 ? lv + 1 : q > .82 ? lv - 1 : undefined;
  } });
  if (S.hump) mo_ell(P, sho[0] - 2, sho[1] - S.rS * .45, S.hump, S.hump * .8, C.fur, { d: .3, k: .55, tex: mo_furPoly(21, .3) });
  mo_ell(P, sho[0] + 1, sho[1] + S.rS * .25, S.rS * .85, S.rS * .95, C.fur, { d: .3, tex: (x, y, lv, u, v) => (v > .35 ? [C.bel, clamp(lv, 0, 4)] : mo_hash(x >> 1, y, 23) < .25 ? lv + 1 : undefined) });
  mo_shag(P, [C.fur], 0, -1, .5, 27, 1, true); mo_shag(P, [C.bel, C.fur], 0, 1, .55, 29, 2, true);
  mo_end(P);
  // Hals und Kopf
  const neck = [sho[0] + S.neck[0], sho[1] + S.neck[1]], hx = neck[0] + S.head[0] + hd[0], hy = neck[1] + S.head[1] + hd[1] + tl * 6, j = p.jaw || 0;
  mo_cap(P, sho[0], sho[1] - 1, hx - 1, hy + 1, S.rS * .8, S.skull[1] * .9, C.fur, { d: .3, tex: furT(10, 8) });
  if (p.mane) mo_shag(P, [C.fur], 0, -1, .7, 33, 2, true);
  mo_end(P);
  // Ohren
  const ea = p.ears ? .9 : 0;
  for (const [ox, sh] of S.ears){
    const e0x = hx + ox, e0y = hy - S.skull[1] * .7;
    if (S.roundEar) mo_ell(P, e0x - ea, e0y - 1.2 + ea, S.roundEar, S.roundEar * .9, C.fur, { b: sh });
    else mo_poly(P, [[e0x - 2, e0y + .5], [e0x - .6 - ea * 2.8, e0y - 5 + ea * 2.8], [e0x + 1.8, e0y]], C.fur, { cyl: .3, b: sh });
  }
  mo_end(P, 1);
  // Schädel, Schnauze, Unterkiefer
  mo_ell(P, hx, hy, S.skull[0], S.skull[1], C.fur, { b: .05, d: .3, tex: (x, y, lv) => (mo_hash(x, y, 41) < .2 ? lv + 1 : undefined) });
  const m0 = [hx + S.skull[0] * .5, hy + .4], m1 = [hx + S.snout[0], hy + S.snout[1]];
  mo_cap(P, m0[0], m0[1], m1[0], m1[1], S.snout[2], S.snout[3], C.fur, { b: .08, tex: (x, y, lv, u, v) => (v > .3 ? [C.bel, clamp(lv, 0, 4)] : undefined) });
  if (j){
    mo_poly(P, [[m0[0], m0[1] + 1], [m1[0], m1[1] + 1], [m1[0] - .5, m1[1] + 1 + j], [m0[0] + 1, m0[1] + 2]], C.mou, { cyl: .2, lv: 1 });
    mo_cap(P, m0[0], m0[1] + 1.5 + j * .4, m1[0] - 1.4, m1[1] + 1.4 + j, S.snout[3], S.snout[3] * .8, C.fur, { b: -.05 });
    for (let k = 0; k < 2; k++){ mo_put(P, m1[0] - 1 - k * 2, m1[1] + 1, mo_BONE, 4); mo_put(P, m1[0] - 2 - k * 2, m1[1] + j, mo_BONE, 3); }
  } else mo_line(P, m0[0] + 1, m0[1] + 1.4, m1[0] - .5, m1[1] + 1, C.skn, 1);
  mo_ell(P, m1[0] + .6, m1[1] - .4, S.snout[3] * .75, S.snout[3] * .65, C.skn, { b: .1 });   // Nase
  if (S.tusk) for (let k = 0; k < 3; k++) mo_put(P, m1[0] - 2.4 + k * .5, m1[1] + 1.4 - k, mo_BONE, k === 2 ? 4 : 3);   // Hauer
  mo_end(P, 1);
  // Auge mit Glanz
  const ex = hx + S.eye[0], ey = hy + S.eye[1];
  mo_put(P, ex, ey, C.eye, 2); mo_put(P, ex - 1, ey, mo_DARK, 0); mo_put(P, ex, ey - 1, C.fur, 1);
  mo_glow(P, ex, ey, S.glow, .9); mo_halo(P, ex, ey, 1.8, S.glow, .3);
  leg(false, true, p.hn); leg(true, true, p.fn);
}
const mo_WOLF = {
  C: { fur: mo_mat('#16151a', '#26252a', '#3a3838', '#504c48', '#68625a', '#827a70', '#9a9286'), bel: mo_mat('#4a463e', '#6a6458', '#8a8474', '#aaa292', '#c4bcaa'),
       sad: mo_mat('#0e0e10', '#1a1a1e', '#2a2a2e', '#3a3a3e'), skn: mo_mat('#0e0c0c', '#1e1a1a', '#2e2828'), mou: mo_mat('#26090b', '#4c1416', '#74241f', '#93392d'), eye: mo_mat('#6a5010', '#b08a20', '#e8c040') },
  hip: [-10, -17], sho: [8, -18], rH: 5.1, rS: 6.3, legL: [[7.5, 6.5], [8, 7]], legR: [[2.6, 1.7], [2.3, 1.6]], hock: [-2.5, 5], paw: 1.8, saddle: true,
  neck: [4, -3], head: [5, -2], skull: [4.3, 3.7], snout: [8.8, 1.4, 2.5, 1.5], ears: [[-1.2, -.25], [.6, 0]], eye: [1.6, -1], glow: '#ffd050',
  tail: { a: Math.PI * .82, curl: .1, n: 5, seg: 2.6, r: 2.4, o: 3 }
};
const mo_WOLFP = {
  idle: [{ hf: [-13, 0], ff: [8, 0], hn: [-10, 0], fn: [11, 0], tail: 0 }, { by: .5, hf: [-13, 0], ff: [8, 0], hn: [-10, 0], fn: [11, 0], tail: .08, hd: [0, 1] }],
  move: [
    { hf: [-18, 0], hn: [-15, -1], ff: [14, -3], fn: [17, 0], tail: -.1 },
    { by: -1, tilt: .04, hf: [-11, -3], hn: [-8, 0], ff: [6, 0], fn: [9, -2], tail: .05 },
    { hf: [-14, 0], hn: [-17, -2], ff: [16, 0], fn: [12, -3], tail: -.1 },
    { by: -1, tilt: .04, hf: [-7, 0], hn: [-10, -3], ff: [9, -2], fn: [5, 0], tail: .05 }],
  act: [
    { by: 3, tilt: .18, jaw: 1, ears: 1, mane: 1, hd: [1, 2], hf: [-12, 0], hn: [-9, 0], ff: [9, 0], fn: [12, 0], tail: .25 },
    { by: -6, tilt: -.12, jaw: 3, mane: 1, hd: [2, -1], hf: [-20, -5], hn: [-18, -3], ff: [19, -11], fn: [22, -9], tail: -.3 }]
};
const mo_BAER = {
  C: { fur: mo_mat('#120c09', '#20160e', '#332316', '#48321f', '#5f432a', '#775636', '#8e6a44'), bel: mo_mat('#3e2c1e', '#58402c', '#72583e', '#8c7052', '#a68a68'),
       sad: mo_mat('#0e0a08', '#1a120c', '#281c12'), skn: mo_mat('#0c0a0a', '#1c1616', '#2c2424'), mou: mo_mat('#26090b', '#4c1416', '#74241f', '#93392d'), eye: mo_mat('#2a1a0a', '#4a3010', '#7a5420') },
  hip: [-13, -22], sho: [10, -23], rH: 8, rS: 9.2, legL: [[10, 9], [10.5, 9]], legR: [[4.2, 3], [3.8, 2.8]], hock: [-2, 4], paw: 2.8, hump: 6,
  neck: [5, -2], head: [7, -1], skull: [6.3, 5.7], snout: [9, 2.6, 3.7, 2.7], ears: [[-2.8, -.25], [.8, 0]], roundEar: 2.5, eye: [2, -1.6], glow: '#ffb040',
  tail: { a: Math.PI * .9, curl: 0, n: 1, seg: 2.5, r: 2.2, o: 6 }
};
const mo_BAERP = {
  idle: [{ hf: [-15, 0], ff: [10, 0], hn: [-12, 0], fn: [13, 0] }, { by: .7, hf: [-15, 0], ff: [10, 0], hn: [-12, 0], fn: [13, 0], hd: [0, 1] }],
  move: [
    { hf: [-19, 0], hn: [-12, -2], ff: [8, 0], fn: [16, -2] },
    { by: -1, hf: [-15, -2], hn: [-15, 0], ff: [12, -2], fn: [12, 0] },
    { hf: [-12, -2], hn: [-19, 0], ff: [16, -2], fn: [8, 0] },
    { by: -1, hf: [-15, 0], hn: [-15, -2], ff: [12, 0], fn: [12, -2] }],
  act: [
    { by: 2, tilt: .14, jaw: 2, ears: 1, hd: [2, 2], hf: [-14, 0], hn: [-11, 0], ff: [11, 0], fn: [14, 0] },
    { by: -4, tilt: -.08, jaw: 3, hd: [3, -1], hf: [-18, 0], hn: [-16, 0], ff: [20, -8], fn: [23, -6] }]
};
MON_ART.wolf = mo_set(64, 40, 32, 37, (P, p) => mo_quad(P, mo_WOLF, p), mo_WOLFP);
MON_ART.baer = mo_set(76, 50, 38, 47, (P, p) => mo_quad(P, mo_BAER, p), mo_BAERP);
/* ---------- Abwandlungen: neue Farben und Waffen für vorhandene Gestalten ---------- */
const mo_WEG = {   // Wegelagerer: Jägergrün und Leder, dunkle Gugel statt Barett
  red: mo_mat('#16200f', '#243218', '#344622', '#475a2e', '#5b6e3a'), och: mo_mat('#3a2a16', '#56401f', '#73582c', '#8e703a'),
  gry: mo_mat('#231a12', '#382a1d', '#4e3c2a', '#655038'), ber: mo_mat('#16130f', '#262018', '#382f24', '#4a3f30'), fea: mo_mat('#3a2e1e', '#5a4a30', '#7a6644', '#96805a')
};
const mo_DS = {    // Doppelsöldner: grell geschlitzt in Rot und Gelb, weißes Futter, riesige Feder
  red: mo_mat('#4a0c0c', '#7a1414', '#a8221c', '#c83a28', '#e0583a'), och: mo_mat('#6a5010', '#9a7a1c', '#c8a030', '#e6c44c', '#f6dc74'),
  gry: mo_mat('#4a4a46', '#787670', '#a6a49c', '#cfcdc4'), lin: mo_mat('#6a665a', '#949080', '#bab6a4', '#dcd8c6'),
  ber: mo_mat('#4a0c0c', '#7a1414', '#a8221c', '#c83a28'), fea: mo_mat('#8a8a84', '#b4b4ac', '#dcdcd4', '#fafaf4')
};
const mo_FH = {    // Feldhauptmann Balthasar Wüst: Schwarz und Gold, rotes Futter, weiße Straußenfeder
  red: mo_mat('#0e0e12', '#1a1a20', '#2a2a32', '#3c3c46', '#50505c'), och: mo_mat('#5a3e10', '#8a6420', '#c49a3a', '#e8c45a', '#fbe08a'),
  gry: mo_mat('#4a0c0c', '#7a1414', '#a8221c', '#c83a28'), lin: mo_mat('#7a7468', '#a49e90', '#cac4b4', '#e8e2d2'),
  ber: mo_mat('#0e0e12', '#1a1a20', '#2a2a32', '#3c3c46'), fea: mo_mat('#9a9a94', '#c4c4bc', '#e8e8e0', '#ffffff'), hai: mo_mat('#2a1a0e', '#4a2e16', '#6a4422', '#8a5c30')
};
MON_ART.wegelagerer = mo_with(mo_LK, mo_WEG, () => Object.assign(mo_set(78, 57, 39, 54, mo_pluend, mo_PLUEND), { reach: 37 }));
MON_ART.doppelsoeldner = mo_with(mo_LK, mo_DS, () => Object.assign(mo_set(78, 57, 39, 54, mo_pluend, mo_PLUEND), { reach: 37 }));
BOSS_ART.feldhauptmann = mo_with(mo_LK, mo_FH, () => Object.assign(mo_set(78, 57, 39, 54, mo_pluend, mo_PLUEND), { reach: 37 }));
MON_ART.hakenschuetze = mo_with(mo_AB, {   // Hakenbüchsenschütze: Sturmhaube, blaues Wams, Hakenbüchse statt Armbrust
  gun: true, hat: mo_mat('#16181c', '#2c3036', '#4a5058', '#6e767e', '#98a0a6'), brg: mo_mat('#141a2e', '#1e2842', '#2c3a5a', '#3e4e74', '#52648e'),
  wam: mo_mat('#4a4636', '#6a6450', '#8a826a', '#a69e84'), hos: mo_mat('#2a1418', '#421e24', '#5c2a30', '#76383e')
}, () => Object.assign(mo_set(50, 54, 25, 51, mo_armbrust, mo_ARMBRUST), { muzzle: mo_muzzle(mo_ARMBRUST.act[0]), gun: true }));
MON_ART.grubengeist = mo_with(mo_MO, {   // Grubengeist: fahle, bläuliche Haut, weißer Bergkittel mit Kapuze, Staub statt Kraut
  skn: mo_mat('#1a2026', '#2a343e', '#3e4c58', '#566a78', '#7088a0', '#90a8bc'), hai: mo_mat('#4a4e54', '#6a7078', '#8a9098'),
  cap: mo_mat('#6a6e70', '#8e9294', '#b2b6b6', '#d2d6d4'), rop: mo_mat('#3a3a3a', '#5a5a58', '#7a7a76'),
  wol: mo_mat('#5a5e60', '#7a7e80', '#9a9ea0', '#b8bcbc'), wed: mo_mat('#3a3a3c', '#545456', '#6e6e70', '#8a8a8c', '#a6a6a8')
}, () => mo_set(50, 54, 25, 52, mo_moor, mo_MOOR));
MON_ART.geier = mo_with(mo_RB, {   // Bartgeier: dunkle Schwingen, rostbraun, heller Kopf
  fea: mo_mat('#1a120c', '#2e2016', '#4a3420', '#6a4c2e', '#8a6a42', '#b08c5c'), bk: mo_mat('#4a4434', '#7a735c', '#a69e80', '#cbc4a6')
}, () => mo_set(36, 34, 18, 17, mo_rabe, mo_RABE));
MON_ART.eislicht = mo_with(mo_IRC, {   // Eislicht: kaltes Blau statt Grün
  m: mo_mat('#2a5a8ab0', '#4a8ac4d8', '#8ac4f0', '#c4e4ff', '#f4faff'), g: ['#3c8ad0', '#7ab4f0', '#bfdcff', '#eaf4ff', '#ffffff'], spark: '#e8f4ff', halo: '#6ab4ff'
}, () => mo_set(22, 28, 11, 17, mo_irrlicht, mo_IRR));
/* ---------- Kobold: Bergmännlein mit roter Zipfelmütze, grauem Bart, Lederkittel und Keilhaue ---------- */
const mo_KB = {
  skn: mo_mat('#1e2216', '#2e3420', '#42482c', '#585e3a', '#70764a', '#8a8e5e'), cap: mo_mat('#3a0c0c', '#5e1414', '#84201c', '#a8342a', '#c44c38'),
  tun: mo_mat('#1e150e', '#30231a', '#463424', '#5c4630', '#72583e'), hos: mo_mat('#16161a', '#24242a', '#36363e', '#4a4a54'),
  brd: mo_mat('#4a4640', '#6e6a60', '#948e82', '#b6b0a2', '#d2ccbe'), eye: mo_mat('#6a5010', '#b08a20', '#e8c040')
};
function mo_kobold(P, p){
  const C = mo_KB, bx = p.bx || 0, by = p.by || 0, ln = p.lean || 0, hipY = -7 + by, shY = -14 + by;
  const leg = (fx, lift, near) => {
    const b = near ? 0 : -.28, hx = bx + (near ? 1.2 : -1.2);
    mo_cap(P, hx, hipY, fx, -2.2 - lift, 1.6, 1.2, C.hos, { b });
    mo_poly(P, [[fx - 1.5, -2.6 - lift], [fx + 1.5, -2.6 - lift], [fx + 4, -1.2 - lift], [fx + 4.4, -lift], [fx - 1.6, -lift]], C.tun, { b: b - .05, cyl: .4, ny: -.3 });   // Schnabelschuh
    mo_end(P, 1);
  };
  const arm = (hand, near) => {
    const b = near ? 0 : -.3, sx = bx + (near ? 2 : -2) + ln * 2, sy = shY + 1.5;
    const el = mo_ik(sx, sy, hand[0], hand[1], 3.6, 3.6, near ? -1 : -1);
    mo_cap(P, sx, sy, el[0], el[1], 1.4, 1.2, C.tun, { b }); mo_cap(P, el[0], el[1], hand[0], hand[1], 1.1, 1, C.skn, { b });
    mo_ell(P, hand[0], hand[1], 1.3, 1.2, C.skn, { b: b + .05 });
    mo_end(P, 1);
  };
  arm(p.fh, false); leg(p.ff, p.fl || 0, false);
  // Keilhaue: Stiel durch beide Hände, Eisen am Ende quer
  const g = p.nh, ux = Math.cos(p.pa), uy = Math.sin(p.pa), e = [g[0] + ux * 9, g[1] + uy * 9], b0 = [g[0] - ux * 3, g[1] - uy * 3];
  mo_cap(P, b0[0], b0[1], e[0], e[1], .8, .8, mo_LK.wod, { k: 1.2 });
  const px = -uy, py = ux;
  mo_cap(P, e[0] - px * 2.6, e[1] - py * 2.6, e[0] + px * 4.4 + ux, e[1] + py * 4.4 + uy, 1.2, .5, mo_LK.stl, { k: 1.3 });
  mo_end(P, 1);
  // Kittel mit Gürtel
  const t = [[-3.4, shY], [3.6, shY], [4.6, hipY + 1], [5.4, hipY + 3.4], [-5, hipY + 3.4], [-4.4, hipY + 1]].map(q => [q[0] + bx + (q[1] < hipY ? ln * 2 : 0), q[1]]);
  mo_poly(P, t, C.tun, { cyl: .8, d: .4, tex: (x, y, lv) => (y === Math.round(hipY) ? [mo_LK.lea, 1] : (x + y) % 5 === 0 ? lv - 1 : undefined) });
  mo_put(P, bx + 1 + ln, hipY, mo_LK.och, 3);   // Gürtelschnalle
  mo_end(P);
  leg(p.nf, p.nl || 0, true);
  // Kopf: groß, Knollennase, Spitzohr, glühendes Auge
  const hx = bx + 2 + ln * 3.5, hy = shY - 4.6;
  mo_poly(P, [[hx - 3.8, hy - 1.2], [hx - 6.8, hy - 4.6], [hx - 2.4, hy - 2.6]], C.skn, { cyl: .3, b: -.05 });   // Ohr
  mo_ell(P, hx, hy, 4.4, 4, C.skn, { d: .3, tex: (x, y, lv) => (mo_hash(x, y, 51) < .12 ? lv - 1 : undefined) });
  mo_ell(P, hx + 4.2, hy + .9, 1.9, 1.6, C.skn, { b: .12 });   // Nase
  mo_end(P, 1);
  mo_poly(P, [[hx - 1.5, hy + 2], [hx + 4.5, hy + 2.4], [hx + 3.6, hy + 5.6], [hx + 1.4, hy + 8 + (p.beard || 0)], [hx - 1.2, hy + 5]], C.brd, { cyl: .6, d: .5, tex: (x, y, lv) => ((x & 1) ? lv - 1 : undefined) });   // Bart
  if (p.grin){ mo_line(P, hx + 1.4, hy + 2.8, hx + 3.6, hy + 2.6, mo_DARK, 0); mo_put(P, hx + 2.5, hy + 3, mo_BONE, 4); }
  mo_end(P, 1);
  const ex = hx + 1.8, ey = hy - .8;
  mo_put(P, ex, ey, C.eye, 2); mo_put(P, ex + 1, ey, C.eye, 1); mo_put(P, ex - .5, ey - 1.2, C.skn, 0); mo_put(P, ex + .7, ey - 1.4, C.skn, 0);   // Brauen
  mo_glow(P, ex, ey, '#ffd050', .9); mo_halo(P, ex + .5, ey, 1.8, '#ffc040', .32);
  // Zipfelmütze, nach hinten gebogen, Quaste
  const tw = p.cap || 0;
  mo_poly(P, [[hx - 4.6, hy - 1.6], [hx - 3, hy - 4.2], [hx - 2.2, hy - 7.4], [hx - 4.8, hy - 10.6 + tw], [hx - 8.4, hy - 11 + tw * 1.4], [hx - 6, hy - 8.2], [hx - .2, hy - 5], [hx + 3.6, hy - 3.4], [hx + 4.4, hy - 1.8]], C.cap, { cyl: .6, d: .4, ny: -.2 });
  mo_line(P, hx - 4.4, hy - 1.4, hx + 4.2, hy - 1.8, C.cap, 0);
  mo_ell(P, hx - 8.8, hy - 10.4 + tw * 1.4, 1.3, 1.3, C.brd, { b: .1 });
  mo_end(P, 1);
  arm(p.nh, true);
}
const mo_KOBP = {
  idle: [{ ff: -2, nf: 2, fh: [1, -9], nh: [3, -10], pa: -2.1 }, { by: .5, ff: -2, nf: 2, fh: [1, -8.5], nh: [3, -9.5], pa: -2.05, cap: .5 }],
  move: [
    { ff: -4, nf: 4, fl: 0, nl: 1.5, lean: .2, fh: [2, -9], nh: [4, -10], pa: -2.1 },
    { by: -.8, ff: -1, nf: 1, fl: 1, lean: .2, fh: [2, -9.5], nh: [4, -10.5], pa: -2.0, cap: .8 },
    { ff: 3, nf: -3, fl: 1.5, nl: 0, lean: .2, fh: [2, -9], nh: [4, -10], pa: -2.1 },
    { by: -.8, ff: 1, nf: -1, nl: 1, lean: .2, fh: [2, -9.5], nh: [4, -10.5], pa: -2.0, cap: .8 }],
  act: [
    { by: .5, lean: -.4, ff: -3, nf: 3, fh: [-1, -17], nh: [0, -18], pa: -2.4, grin: 1, cap: 1.2 },
    { by: 1.5, lean: .8, ff: -3, nf: 5, fh: [6, -8], nh: [8, -9], pa: .5, grin: 1, beard: 1, cap: -1 }]
};
MON_ART.kobold = mo_set(40, 36, 20, 33, mo_kobold, mo_KOBP);
/* ---------- Waldschrat: wandelnder Baumgeist aus Rinde und Moos, Astarme, Wurzelfüße, Krone aus Zweigen und Laub ---------- */
const mo_SR = {
  brk: mo_mat('#140f0a', '#22190f', '#332517', '#463321', '#5a432c', '#6e5538'), mos: mo_mat('#1a2410', '#2a3a18', '#3e5222', '#566a2e', '#70843c'),
  lef: mo_mat('#122010', '#1e3416', '#2c4a1e', '#3e6228', '#547a34', '#6e9242'), inn: mo_mat('#4a3420', '#6a4c2e', '#8a6a42', '#a68858')
};
const mo_barkTex = sd => (x, y, lv, u, v) => { const lane = Math.floor(x / 2 + mo_hash(0, y >> 2, sd) * 1.5); if ((lane & 1) && mo_hash(lane, y >> 1, sd) < .6) return lv - 1; if (mo_N(x * .3, y * .3) > .72) return [mo_SR.mos, clamp(lv, 0, 4)]; return undefined; };
function mo_schrat(P, p){
  const C = mo_SR, bx = p.bx || 0, by = p.by || 0, ln = p.lean || 0;
  const hip = [bx, -22 + by], sh = [bx + ln * 6, -42 + by];
  const leg = (f, near) => {
    const b = near ? 0 : -.3, top = [hip[0] + (near ? 2.5 : -2.5), hip[1]], kn = mo_ik(top[0], top[1], f[0], f[1] - 2, 11, 11, 1);
    mo_cap(P, top[0], top[1], kn[0], kn[1], 4, 3.2, C.brk, { b, d: .3, tex: mo_barkTex(3) });
    mo_cap(P, kn[0], kn[1], f[0], f[1] - 2, 3.2, 3, C.brk, { b, tex: mo_barkTex(4) });
    for (const [dx, dy] of [[5.5, 1], [3, 1.5], [-3.5, 1]]) mo_cap(P, f[0], f[1] - 2, f[0] + dx, f[1] + dy - 1, 2, .6, C.brk, { b: b - .05 });   // Wurzelzehen
    mo_end(P, 1);
  };
  const arm = (A, near) => {
    const b = near ? 0 : -.32, s0 = [sh[0] + (near ? 3.5 : -3.5), sh[1] + 2], el = A[0], hd = A[1];
    mo_cap(P, s0[0], s0[1], el[0], el[1], 3, 2.4, C.brk, { b, tex: mo_barkTex(7) });
    mo_cap(P, el[0], el[1], hd[0], hd[1], 2.4, 1.6, C.brk, { b, tex: mo_barkTex(8) });
    const dx = hd[0] - el[0], dy = hd[1] - el[1], l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    for (let f = -1.5; f <= 1.5; f++){ const a = Math.atan2(uy, ux) + f * .35, fl = 6 - Math.abs(f); mo_line(P, hd[0], hd[1], hd[0] + Math.cos(a) * fl, hd[1] + Math.sin(a) * fl, C.brk, near ? 3 : 1); mo_put(P, hd[0] + Math.cos(a) * (fl + 1), hd[1] + Math.sin(a) * (fl + 1), C.brk, 1); }
    if (near) for (let k = 0; k < 3; k++){ const q = [el[0] + (hd[0] - el[0]) * (.3 + k * .25), el[1] + (hd[1] - el[1]) * (.3 + k * .25)]; mo_ell(P, q[0], q[1] - 1.6, 1.8, 1.2, C.lef, { b: .05 }); }   // Blätter am Arm
    mo_end(P, 1);
  };
  arm(p.fa, false); leg(p.fl, false);
  // Rumpf: knorriger Stamm
  const tr = [[sh[0] - 6.5, sh[1] - 2], [sh[0] + 6, sh[1] - 2.5], [sh[0] + 7.4, sh[1] + 6], [hip[0] + 7.2, hip[1] - 2], [hip[0] + 6, hip[1] + 3], [hip[0] - 6, hip[1] + 3], [hip[0] - 7.4, hip[1] - 3], [sh[0] - 7.6, sh[1] + 7]];
  mo_poly(P, tr, C.brk, { cyl: .9, d: .3, tex: mo_barkTex(11) });
  mo_ell(P, bx + ln * 3 + 2, -31 + by, 2.4, 3, C.inn, { b: -.05 }); mo_ell(P, bx + ln * 3 + 2, -31 + by, 1.2, 1.6, mo_DARK, { lv: 0 });   // Astloch
  mo_end(P);
  leg(p.nl, true);
  // Kopf: Knorren mit glühenden Augenhöhlen, Mund wie ein Riss, Moosbart
  const hx = sh[0] + 2 + ln * 2, hy = sh[1] - 7;
  mo_poly(P, [[hx - 6, hy + 4], [hx - 5.6, hy - 3], [hx - 2, hy - 6], [hx + 4, hy - 5.4], [hx + 6.6, hy - 1], [hx + 6, hy + 5], [hx, hy + 6.4]], C.brk, { cyl: .8, d: .3, tex: mo_barkTex(13) });
  for (const ox of [-1.6, 3]){ mo_ell(P, hx + ox, hy - 1, 1.5, 1.2, mo_DARK, { lv: 0 }); }
  if (p.roar) mo_poly(P, [[hx - 1, hy + 2.4], [hx + 4.6, hy + 2], [hx + 3.6, hy + 4.6], [hx, hy + 4.4]], mo_DARK, { lv: 0 });
  else mo_line(P, hx - .6, hy + 3, hx + 4, hy + 2.6, mo_DARK, 0);
  mo_end(P, 1);
  mo_poly(P, [[hx - 3, hy + 4], [hx + 5.4, hy + 3.8], [hx + 4, hy + 9 + (p.sway || 0)], [hx + 1, hy + 12], [hx - 1.6, hy + 8]], C.mos, { cyl: .6, d: .5, tex: (x, y, lv) => ((x + y) & 1 ? lv - 1 : undefined) });
  for (const ox of [-1.6, 3]){ mo_glow(P, hx + ox, hy - 1, '#a8ff7a', 1); mo_glow(P, hx + ox + .6, hy - 1, '#d8ffb0', .8); mo_halo(P, hx + ox, hy - 1, 2.4, '#7aff5a', .35); }
  mo_end(P, 1);
  // Krone: Zweige mit Laubbüscheln
  const sw = p.sway || 0;
  for (const [a, l, sd] of [[-2.2, 10, 1], [-1.75, 12, 2], [-1.35, 11, 3], [-.95, 9, 4], [-2.6, 8, 5]]){
    const x1 = hx + Math.cos(a) * l + sw, y1 = hy - 4 + Math.sin(a) * l;
    mo_cap(P, hx + Math.cos(a) * 3, hy - 4 + Math.sin(a) * 3, x1, y1, 1.4, .6, C.brk, { b: .05 });
    mo_ell(P, x1, y1 - 1, 4 + (sd & 1), 3.2, C.lef, { d: .5, tex: (x, y, lv) => (mo_hash(x, y, sd) < .3 ? lv + 1 : mo_hash(x, y, sd + 9) < .2 ? lv - 2 : undefined) });
  }
  mo_end(P, 1);
  arm(p.na, true);
}
const mo_SCHP = {
  idle: [{ fl: [-4, 0], nl: [4, 0], fa: [[-8, -32], [-7, -22]], na: [[9, -33], [11, -23]] }, { by: .6, sway: .8, fl: [-4, 0], nl: [4, 0], fa: [[-8, -31], [-6, -21]], na: [[9, -32], [12, -22]] }],
  move: [
    { lean: .1, fl: [-7, 0], nl: [6, -1], fa: [[-6, -32], [-2, -23]], na: [[8, -34], [9, -24]] },
    { by: -1, lean: .1, sway: 1, fl: [-3, -2], nl: [3, 0], fa: [[-8, -33], [-6, -23]], na: [[10, -33], [13, -24]] },
    { lean: .1, fl: [6, -1], nl: [-7, 0], fa: [[-9, -33], [-9, -23]], na: [[10, -32], [15, -24]] },
    { by: -1, lean: .1, sway: -1, fl: [3, 0], nl: [-3, -2], fa: [[-8, -33], [-6, -23]], na: [[10, -33], [13, -24]] }],
  act: [
    { by: -1, lean: -.15, sway: -1.5, roar: 1, fl: [-5, 0], nl: [5, 0], fa: [[-6, -50], [-2, -60]], na: [[9, -51], [13, -61]] },
    { by: 2, lean: .45, sway: 1.5, roar: 1, fl: [-6, 0], nl: [8, 0], fa: [[6, -36], [16, -28]], na: [[14, -36], [24, -24]] }]
};
MON_ART.schrat = mo_set(64, 72, 30, 68, mo_schrat, mo_SCHP);
/* ---------- Der Tatzelwurm: Echsenleib mit zwei Vordertatzen und Katzenkopf, Rückenkamm, gelbe Augen ---------- */
const mo_TZ = {
  skn: mo_mat('#0e120a', '#1a2210', '#283418', '#384820', '#4a5e2a', '#5e7434', '#748a40'), bel: mo_mat('#4a3e1e', '#6a5a2a', '#8a7838', '#a89448', '#c2ae5c'),
  crs: mo_mat('#2a0e0c', '#4a1612', '#6e2418', '#923820'), fur: mo_mat('#1e1810', '#30261a', '#463826', '#5e4c34', '#786244'), mou: mo_mat('#26090b', '#4c1416', '#74241f', '#93392d'),
  eye: mo_mat('#6a5010', '#b08a20', '#f0c838')
};
function mo_tatzel(P, p){
  const C = mo_TZ, ph = p.ph || 0, lift = p.lift || 0, N = 10, pts = [], by = p.by || 0, j = p.open || 0;
  for (let i = 0; i <= N; i++){
    const t = i / N, x = -46 + t * 70, wav = Math.sin(t * 4.4 + ph) * (1 - t * .8) * 3.4;
    pts.push([x, -16 + Math.pow(1 - t, 2) * 12 + wav + by - (t > .7 ? lift * (t - .7) * 34 : 0), 1.8 + Math.pow(t, .65) * 10.4]);
  }
  const sh = pts[8];
  const leg = (near, foot) => {
    const b = near ? 0 : -.3, top = [sh[0] + (near ? 2 : -3), sh[1] + sh[2] * .35], el = mo_ik(top[0], top[1], foot[0], foot[1] - 3, 8.5, 8, -1);
    mo_cap(P, top[0], top[1], el[0], el[1], 4.4, 3.4, C.skn, { b, d: .3, tex: (x, y, lv) => ((x + y * 2) % 4 === 0 ? lv - 1 : undefined) });
    mo_cap(P, el[0], el[1], foot[0], foot[1] - 3, 3.4, 2.8, C.skn, { b });
    mo_ell(P, foot[0] + 1.5, foot[1] - 2, 4, 2.4, C.skn, { b: b - .05 });
    for (let k = 0; k < 4; k++) mo_put(P, foot[0] + 4.5 + k * .9, foot[1] - 1 + (k & 1), mo_BONE, near ? 3 : 1);
    mo_end(P, 1);
  };
  leg(false, p.ff);
  for (let i = 1; i < N - 1; i++){ const a = pts[i], h = 2.4 + (i % 2) * 2 + a[2] * .3; mo_poly(P, [[a[0] - 2.4, a[1] - a[2] + 1.5], [a[0] + .5, a[1] - a[2] - h], [a[0] + 3, a[1] - a[2] + 1.5]], C.crs, { cyl: .3 }); }
  mo_end(P, 1);
  for (let i = 0; i < N; i++){
    const a = pts[i], b = pts[i + 1];
    mo_cap(P, a[0], a[1], b[0], b[1], a[2], b[2], C.skn, { b: .02, d: .3, tex: (x, y, lv, u, v) => v > .42 ? [C.bel, clamp(lv + ((x & 2) ? 0 : -1), 0, 4)] : (Math.sin((x - y * .3) * .5) > .84 ? lv - 2 : ((x + (y & 1) * 2) % 4 === 0 ? lv - 1 : undefined)) });
  }
  mo_end(P);
  // Katzenkopf
  const h = pts[N], hx = h[0] + 5, hy = h[1] - 5;
  for (const [ox, b] of [[-4.5, -.25], [2, 0]]) mo_poly(P, [[hx + ox - 3.4, hy - 5], [hx + ox - 1.2, hy - 14], [hx + ox + 3, hy - 5.8]], C.fur, { cyl: .3, b });
  for (const ox of [-4.5, 2]) mo_poly(P, [[hx + ox - 1.6, hy - 6], [hx + ox - .8, hy - 11], [hx + ox + 1.2, hy - 6.4]], C.crs, { cyl: .2, b: .1 });
  mo_ell(P, hx, hy, 9, 8, C.fur, { d: .35, tex: (x, y, lv) => ((x - y) % 3 === 0 ? lv - 1 : mo_hash(x, y, 61) < .2 ? lv + 1 : undefined) });
  mo_ell(P, hx + 7, hy + 2.4, 4.6, 3.8, C.fur, { b: .1, tex: (x, y, lv, u, v) => (v > .15 ? [C.bel, clamp(lv, 0, 4)] : undefined) });
  if (j){
    mo_poly(P, [[hx + 2, hy + 4], [hx + 11.5, hy + 3.4], [hx + 11, hy + 4.4 + j * 2.6], [hx + 3, hy + 5.6 + j]], C.mou, { cyl: .2, lv: 1 });
    mo_cap(P, hx + 2.6, hy + 6 + j, hx + 9.6, hy + 5.2 + j * 2.6, 2, 1.5, C.fur, { b: -.05 });
    mo_line(P, hx + 10, hy + 3.6, hx + 10, hy + 6.4 + j, mo_BONE, 4); mo_line(P, hx + 7, hy + 3.8, hx + 7, hy + 5.6 + j * .7, mo_BONE, 3);
  } else mo_line(P, hx + 5, hy + 4.4, hx + 10.6, hy + 4, mo_DARK, 0);
  mo_ell(P, hx + 11, hy + .6, 1.6, 1.3, C.crs, { b: .2 });
  mo_end(P, 1);
  for (const [dx, dy] of [[11, -1.5], [12, .6], [11, 2.6]]) mo_line(P, hx + 8, hy + 2, hx + 8 + dx, hy + 2 + dy, mo_BONE, 2);
  const ex = hx + 3.4, ey = hy - 1.6;
  mo_ell(P, ex, ey, 2.4, 2, C.eye, { b: .2 }); mo_line(P, ex + .3, ey - 1.5, ex + .3, ey + 1.5, mo_DARK, 0);
  mo_glow(P, ex, ey, '#ffd84a', 1); mo_halo(P, ex, ey, 3.4, '#ffc030', .4);
  leg(true, p.nf);
}
const mo_TZP = {
  idle: [{ ph: 0, ff: [11, 0], nf: [16, 0] }, { ph: 1, by: .5, ff: [11, 0], nf: [16, 0] }],
  move: [{ ph: 0, ff: [6, 0], nf: [20, -2] }, { ph: 1.6, ff: [10, -2], nf: [15, 0] }, { ph: 3.2, ff: [18, -2], nf: [7, 0] }, { ph: 4.8, ff: [14, 0], nf: [11, -2] }],
  act: [{ ph: .6, lift: 1, open: 1.4, ff: [10, 0], nf: [15, 0] }, { ph: 2.2, lift: -.2, by: 2, open: 2.8, ff: [22, -4], nf: [27, -3] }]
};
BOSS_ART.tatzelwurm = Object.assign(mo_set(116, 72, 58, 66, mo_tatzel, mo_TZP), { reach: 44 });
/* ---------- Der Bergmönch: riesiger Kuttengeist mit Grubenlampe und Fäustel, unten zerfließt er in Nebel ---------- */
const mo_BM = {
  rob: mo_mat('#0e0c10', '#18151c', '#24202a', '#322c3a', '#423a4c'), mst: mo_mat('#4a4e5ac0', '#6a7080a0', '#8a90a080', '#aab0c060'),
  rop: mo_mat('#3a3020', '#5a4a30', '#7a6644'), brd: mo_mat('#4a4c50', '#6e7074', '#94969a', '#b8babc'), skn: mo_mat('#3a3e44', '#5a6068', '#7a8088'),
  lmp: mo_mat('#2a1e0c', '#4a3614', '#6a4e1e', '#8a6a2a'), fla: mo_mat('#c86a10', '#f0a030', '#ffd870', '#fff4c0')
};
function mo_bergmoench(P, p){
  const C = mo_BM, by = p.by || 0, sw = p.sw || 0;
  // Nebelsaum: unten durchscheinend
  for (let y = 4; y < 22; y++){ const w = 15 + y * .4 + Math.sin(y * .7 + sw) * 1.5; for (let x = -Math.round(w); x <= Math.round(w); x++){ const q = mo_hash(x, y, 71 + (sw * 3 | 0)), e = 1 - Math.abs(x) / w; if (q < (1 - y / 22) * .55 * (.4 + e)) mo_put(P, x, y + by, C.mst, clamp(3 - (y / 6 | 0) - (q > .3 ? 1 : 0), 0, 3)); } }
  mo_end(P, 0);
  // ferner Arm mit Lampe an der Kette
  const sh = [-6, -36 + by], la = p.lamp;
  mo_cap(P, sh[0], sh[1], la[0], la[1] - 6, 4, 3, C.rob, { b: -.3 });
  mo_line(P, la[0], la[1] - 6, la[0], la[1] - 2, C.rop, 1);
  mo_poly(P, [[la[0] - 3, la[1] - 2], [la[0] + 3, la[1] - 2], [la[0] + 2.4, la[1] + 5], [la[0] - 2.4, la[1] + 5]], C.lmp, { cyl: .6 });
  mo_ell(P, la[0], la[1] + 1.6, 1.6, 2.4, C.fla, { lv: 3 });
  mo_end(P, 1);
  mo_glow(P, la[0], la[1] + 1, '#fff4c0', 1); mo_halo(P, la[0], la[1] + 1.5, 9, '#ffc850', .42);
  // Kutte: weit, mit Falten, Strick als Gürtel
  mo_poly(P, [[-9, -44 + by], [7, -45 + by], [12, -30 + by], [15, -10 + by], [17, 6 + by], [-17, 6 + by], [-15, -10 + by], [-12, -30 + by]], C.rob, { cyl: .9, d: .4, fold: (x, y) => Math.sin(x * .55 + y * .05) * .35 });
  mo_line(P, -11, -26 + by, 11, -27 + by, C.rop, 2); mo_line(P, 4, -26 + by, 6, -14 + by, C.rop, 1); mo_put(P, 6, -13 + by, C.rop, 2);
  mo_end(P);
  // Kapuze, darin Dunkelheit, glühende Augen, langer grauer Bart
  const hx = 2, hy = -50 + by;
  mo_poly(P, [[hx - 10, hy + 8], [hx - 9, hy - 3], [hx - 4, hy - 10], [hx + 4, hy - 10.5], [hx + 9, hy - 4], [hx + 10, hy + 6], [hx + 6, hy + 9]], C.rob, { cyl: .8, d: .3 });
  mo_ell(P, hx + 2, hy + 1, 5.6, 5.4, mo_DARK, { lv: 0 });
  mo_poly(P, [[hx - 2, hy + 4], [hx + 7, hy + 4], [hx + 6, hy + 14], [hx + 2.6, hy + 20 + sw * .6], [hx - 1, hy + 12]], C.brd, { cyl: .6, d: .5, tex: (x, y, lv) => ((x & 1) ? lv - 1 : undefined) });
  mo_end(P, 1);
  for (const ox of [0, 4]){ mo_glow(P, hx + ox, hy, '#bfe8ff', 1); mo_glow(P, hx + ox + 1, hy, '#7ac8ff', .8); mo_halo(P, hx + ox + .5, hy, 2.6, '#6ab8ff', .4); }
  // naher Arm mit Fäustel
  const s2 = [7, -37 + by], hd = p.ham, el = mo_ik(s2[0], s2[1], hd[0], hd[1], 10, 10, p.hb || 1);
  mo_cap(P, s2[0], s2[1], el[0], el[1], 4.2, 3.4, C.rob, { d: .3 }); mo_cap(P, el[0], el[1], hd[0], hd[1], 3.4, 2.6, C.rob, {});
  mo_ell(P, hd[0], hd[1], 2.2, 2, C.skn, { b: .05 });
  const a = p.ha, ux = Math.cos(a), uy = Math.sin(a), e = [hd[0] + ux * 13, hd[1] + uy * 13];
  mo_cap(P, hd[0] - ux * 2, hd[1] - uy * 2, e[0], e[1], 1, 1, mo_LK.wod, { k: 1.2 });
  mo_cap(P, e[0] - uy * 4, e[1] + ux * 4, e[0] + uy * 4, e[1] - ux * 4, 2.6, 2.6, mo_LK.stl, { k: 1.3 });
  mo_end(P, 1);
}
const mo_BMP = {
  idle: [{ sw: 0, lamp: [-14, -24], ham: [12, -22], ha: -1.3 }, { sw: 1.5, by: 1, lamp: [-15, -23], ham: [12, -21], ha: -1.25 }],
  move: [{ sw: 0, lamp: [-16, -24], ham: [12, -22], ha: -1.3 }, { sw: 1, by: 1, lamp: [-13, -23], ham: [12, -21], ha: -1.3 }, { sw: 2, lamp: [-11, -24], ham: [12, -22], ha: -1.3 }, { sw: 3, by: 1, lamp: [-14, -23], ham: [12, -21], ha: -1.3 }],
  act: [{ sw: 1, lamp: [-16, -30], ham: [6, -58], ha: -2.4, hb: -1 }, { sw: 2, by: 2, lamp: [-10, -20], ham: [22, -24], ha: .4 }]
};
BOSS_ART.bergmoench = mo_set(96, 100, 48, 62, mo_bergmoench, mo_BMP);
/* ---------- Rübezahl: der Riese der Berge, wilder Bart und Haar, Fellumhang, ein Baumstamm als Keule ---------- */
const mo_RZ = {
  skn: mo_mat('#3a2418', '#5c3a26', '#7e5236', '#9c6a48', '#b4825a'), hai: mo_mat('#2e2a26', '#4a4640', '#6a645c', '#8c867c', '#aaa498'),
  cap: mo_mat('#16200f', '#243218', '#344622', '#475a2e', '#5b6e3a'), fur: mo_mat('#1e160e', '#302418', '#463624', '#5e4a32', '#786044'),
  tun: mo_mat('#2a1e12', '#3e2c1a', '#544024', '#6a5430'), brk: mo_SR.brk, lef: mo_SR.lef
};
function mo_ruebezahl(P, p){
  const C = mo_RZ, bx = p.bx || 0, by = p.by || 0, ln = p.lean || 0, hip = [bx, -36 + by], sh = [bx + ln * 10, -66 + by];
  const leg = (f, near) => {
    const b = near ? 0 : -.3, top = [hip[0] + (near ? 4 : -4), hip[1]], kn = mo_ik(top[0], top[1], f[0], f[1] - 4, 17, 17, 1);
    mo_cap(P, top[0], top[1], kn[0], kn[1], 6, 4.8, C.tun, { b, d: .3 });
    mo_cap(P, kn[0], kn[1], f[0], f[1] - 4, 5, 4.6, C.fur, { b, tex: mo_furPoly(7, .2) });     // Fellwickel
    mo_poly(P, [[f[0] - 4, f[1] - 5], [f[0] + 4, f[1] - 5], [f[0] + 9, f[1] - 2], [f[0] + 9, f[1]], [f[0] - 5, f[1]]], C.fur, { b: b - .05, cyl: .4, ny: -.3 });
    mo_end(P, 1);
  };
  const arm = (hand, near) => {
    const b = near ? 0 : -.3, s0 = [sh[0] + (near ? 9 : -9), sh[1] + 3], el = mo_ik(s0[0], s0[1], hand[0], hand[1], 15, 14, near ? -1 : 1);
    mo_cap(P, s0[0], s0[1], el[0], el[1], 5.6, 4.6, C.skn, { b, d: .3, tex: (x, y, lv) => (mo_hash(x, y, 81) < .15 ? lv - 1 : undefined) });
    mo_cap(P, el[0], el[1], hand[0], hand[1], 4.6, 4, C.skn, { b });
    mo_ell(P, hand[0], hand[1], 4, 3.6, C.skn, { b: b + .05 });
    mo_end(P, 1);
  };
  // Fellumhang hinter allem
  mo_poly(P, [[sh[0] - 12, sh[1] - 2], [sh[0] + 4, sh[1] - 4], [sh[0] - 2, hip[1] + 10], [hip[0] - 20 - (p.wind || 0) * 3, hip[1] + 24], [hip[0] - 22 - (p.wind || 0) * 4, hip[1] + 4]], C.fur, { cyl: .7, d: .4, tex: mo_furPoly(9, .4) });
  mo_shag(P, [C.fur], -1, 1, .5, 13, 2, true);
  mo_end(P, 1);
  arm(p.fh, false); leg(p.fl, false);
  // Rumpf: Kittel, breiter Gürtel
  mo_poly(P, [[sh[0] - 12, sh[1]], [sh[0] + 12, sh[1] - 1], [hip[0] + 13, hip[1] + 2], [hip[0] + 12, hip[1] + 12], [hip[0] - 12, hip[1] + 12], [hip[0] - 13, hip[1] + 2]], C.tun, { cyl: .9, d: .4, tex: (x, y, lv) => (Math.abs(y - hip[1] - 2) < 2 ? [mo_LK.lea, lv > 2 ? 3 : 1] : ((x * 3 + y) % 7 === 0 ? lv - 1 : undefined)) });
  mo_ell(P, hip[0] + 2 + ln * 3, hip[1] + 2, 2.6, 2, mo_LK.och, { b: .1 });   // Schnalle
  mo_end(P);
  leg(p.nl, true);
  // Kopf: Gesicht, buschige Brauen, mächtiger Bart, wildes Haar, Kranz aus Tannengrün
  const hx = sh[0] + 3 + ln * 4, hy = sh[1] - 9;
  mo_ell(P, hx, hy - 2, 11, 10, C.hai, { d: .5, tex: mo_furPoly(15, -.4) });   // Haar hinten
  mo_ell(P, hx + 2, hy, 7.6, 8, C.skn, { d: .3 });
  mo_ell(P, hx + 8.6, hy + 1, 2.6, 2.4, C.skn, { b: .15 });   // Nase
  mo_poly(P, [[hx - 5, hy + 1], [hx + 10, hy + 2], [hx + 11, hy + 10], [hx + 6 + (p.wind || 0), hy + 22], [hx, hy + 24], [hx - 5, hy + 14]], C.hai, { cyl: .7, d: .5, tex: (x, y, lv) => ((x + (y >> 1)) % 3 === 0 ? lv - 1 : undefined) });   // Bart
  if (p.roar) mo_ell(P, hx + 5, hy + 6, 2.6, 1.6 + p.roar, mo_DARK, { lv: 0 });
  mo_line(P, hx + 1, hy - 4, hx + 8, hy - 5, C.hai, 1); mo_line(P, hx + 1, hy - 3, hx + 7, hy - 4, C.hai, 0);   // Brauen
  mo_end(P, 1);
  const ex = hx + 5, ey = hy - 2;
  mo_put(P, ex, ey, mo_BONE, 4); mo_put(P, ex + 1, ey, mo_DARK, 0);
  mo_glow(P, ex, ey, '#bfe8ff', .9); mo_halo(P, ex, ey, 2.6, '#8acfff', .35);
  for (let k = 0; k < 9; k++){ const a = Math.PI + k / 8 * Math.PI, x = hx + Math.cos(a) * 9.5, y = hy - 4 + Math.sin(a) * 7; mo_ell(P, x, y, 2.2, 1.6, C.cap, { b: (k & 1) * .1 }); }
  mo_end(P, 1);
  // Keule: junger Baumstamm mit Wurzelstock, in beiden Händen
  const g = p.nh, a = p.ca, ux = Math.cos(a), uy = Math.sin(a), e = [g[0] + ux * 34, g[1] + uy * 34], t0 = [g[0] - ux * 6, g[1] - uy * 6];
  mo_cap(P, t0[0], t0[1], e[0], e[1], 2.6, 5, C.brk, { d: .3, tex: mo_barkTex(17) });
  for (const [o, l] of [[-1, 6], [.6, 7], [1.4, 5]]){ const aa = a + o, q = [e[0] + Math.cos(aa) * l, e[1] + Math.sin(aa) * l]; mo_cap(P, e[0], e[1], q[0], q[1], 2.2, .8, C.brk, {}); }
  mo_ell(P, e[0] - ux * 8 - uy * 3, e[1] - uy * 8 + ux * 3, 3, 2, C.lef, { b: .05 });
  mo_end(P, 1);
  arm(p.nh, true);
}
const mo_RZP = {
  idle: [{ fl: [-7, 0], nl: [7, 0], fh: [-12, -40], nh: [16, -40], ca: -1.2 }, { by: 1, wind: .5, fl: [-7, 0], nl: [7, 0], fh: [-12, -39], nh: [16, -39], ca: -1.18 }],
  move: [
    { lean: .1, fl: [-12, 0], nl: [10, -2], fh: [-8, -40], nh: [18, -42], ca: -1.1, wind: 1 },
    { by: -2, lean: .1, fl: [-4, -3], nl: [4, 0], fh: [-12, -41], nh: [18, -43], ca: -1.15, wind: 1.5 },
    { lean: .1, fl: [10, -2], nl: [-12, 0], fh: [-14, -40], nh: [19, -42], ca: -1.1, wind: 1 },
    { by: -2, lean: .1, fl: [4, 0], nl: [-4, -3], fh: [-12, -41], nh: [18, -43], ca: -1.15, wind: 1.5 }],
  act: [
    { lean: -.15, roar: 1, fl: [-9, 0], nl: [9, 0], fh: [-6, -72], nh: [6, -76], ca: -2.3, wind: 2 },
    { by: 3, lean: .5, roar: 2, fl: [-12, 0], nl: [14, 0], fh: [14, -44], nh: [24, -40], ca: .25, wind: 3 }]
};
BOSS_ART.ruebezahl = Object.assign(mo_set(120, 116, 56, 112, mo_ruebezahl, mo_RZP), { reach: 54 });
/* ============ Ostlande (Version 26): Gegner aus Heide, Reichswald, Gailingen, Donauried und Lechfeld ============ */
/* ---------- Abwandlungen: Strauchdieb, Reisiger, Irrwisch ---------- */
const mo_SD = {    // Strauchdieb: geflicktes Graubraun, speckige Gugel
  red: mo_mat('#1e1812', '#2e261c', '#40362a', '#544838', '#685a46'), och: mo_mat('#2a2418', '#403624', '#584a32', '#6e5e42'),
  gry: mo_mat('#18181a', '#26262a', '#36363c', '#48484e'), ber: mo_mat('#1a140e', '#2c2218', '#3e3022', '#52402e'), fea: mo_mat('#2a2a26', '#3e3e38', '#54544c', '#6a6a60')
};
const mo_RS = {    // Reisiger: eiserner Harnisch statt Wams, rotes Futter, Eisenhut, schwarze Feder
  red: mo_mat('#1a1c20', '#30343a', '#4c525a', '#6e767e', '#98a0a6'), och: mo_mat('#3a0e0e', '#5a1616', '#7a2420', '#9a3428'),
  gry: mo_mat('#1c1f23', '#2f3339', '#454a52', '#5d636b'), ber: mo_mat('#202226', '#3a3e44', '#5a6068', '#808890'), fea: mo_mat('#0e0e10', '#1a1a1e', '#2a2a30', '#3a3a42')
};
MON_ART.strauchdieb = mo_with(mo_LK, mo_SD, () => Object.assign(mo_set(78, 57, 39, 54, mo_pluend, mo_PLUEND), { reach: 37 }));
MON_ART.reisiger = mo_with(mo_LK, mo_RS, () => Object.assign(mo_set(78, 57, 39, 54, mo_pluend, mo_PLUEND), { reach: 37 }));
MON_ART.irrwisch = mo_with(mo_IRC, {   // Irrwisch: rötlich-gelbe Flamme über Heide und Ried
  m: mo_mat('#8a4a1ab0', '#c4782ad8', '#f0b050', '#ffe08a', '#fff6d8'), g: ['#d07a2a', '#f0a84a', '#ffd88a', '#fff2c8', '#ffffff'], spark: '#fff0c0', halo: '#ffb04a'
}, () => mo_set(22, 28, 11, 17, mo_irrlicht, mo_IRR));

/* ---------- Keiler: borstiger Wildschweinkeiler mit Hauern (Vierbeiner-Maler) ---------- */
const mo_KEILER = {
  C: { fur: mo_mat('#0e0b09', '#1a1510', '#282018', '#362c22', '#463a2c', '#584a38', '#6a5a46'), bel: mo_mat('#1a1410', '#2a221a', '#3a3024', '#4a3e30'),
       sad: mo_mat('#0a0806', '#14100c', '#1e1812'), skn: mo_mat('#1a1212', '#2e2020', '#44302e'), mou: mo_mat('#26090b', '#4c1416', '#74241f', '#93392d'), eye: mo_mat('#3a0a06', '#7a1a0e', '#c43a1a') },
  hip: [-11, -15], sho: [9, -16], rH: 6.4, rS: 8, legL: [[5.5, 5], [5.5, 5]], legR: [[2.6, 1.6], [2.4, 1.5]], hock: [-1.5, 3.5], paw: 1.6, hump: 5.4,
  neck: [3, 2], head: [6, 2], skull: [5, 4.4], snout: [9.6, 2.8, 3.2, 2.4], ears: [[-1.4, -.25], [.4, 0]], eye: [1.2, -1.8], glow: '#ff6030', tusk: true,
  tail: { a: Math.PI * .8, curl: .5, n: 3, seg: 1.8, r: 1, o: 2 }
};
const mo_KEILERP = {
  idle: [{ hf: [-13, 0], ff: [8, 0], hn: [-10, 0], fn: [11, 0], mane: 1 }, { by: .5, hf: [-13, 0], ff: [8, 0], hn: [-10, 0], fn: [11, 0], hd: [0, 1], mane: 1 }],
  move: [
    { hf: [-17, 0], hn: [-14, -2], ff: [13, -2], fn: [15, 0], mane: 1 },
    { by: -1, hf: [-11, -2], hn: [-9, 0], ff: [7, 0], fn: [9, -2], mane: 1 },
    { hf: [-14, 0], hn: [-16, -2], ff: [15, 0], fn: [12, -2], mane: 1 },
    { by: -1, hf: [-9, 0], hn: [-11, -2], ff: [9, -2], fn: [6, 0], mane: 1 }],
  act: [
    { by: 2, tilt: .25, jaw: 1, ears: 1, mane: 1, hd: [0, 3], hf: [-12, 0], hn: [-9, 0], ff: [9, 0], fn: [12, 0] },
    { by: -2, tilt: .1, jaw: 2, mane: 1, hd: [4, 1], hf: [-20, -3], hn: [-18, -1], ff: [19, -6], fn: [22, -4] }]
};
MON_ART.keiler = mo_set(64, 40, 32, 37, (P, p) => mo_quad(P, mo_KEILER, p), mo_KEILERP);

/* ---------- Kreuzotter: graubraune Giftschlange mit dunklem Zickzackband, rote Augen ---------- */
const mo_KO = { sk: mo_mat('#1a1712', '#2e2a20', '#463f30', '#5e5440', '#766a52', '#8e8064'), zz: mo_mat('#0a0908', '#16130f', '#221d17'),
  bel: mo_mat('#14120e', '#221e18', '#302a22'), tng: mo_mat('#4a0a0a', '#8a1a14', '#c43020') };
function mo_otter(P, p){
  const C = mo_KO, ph = p.ph || 0, rise = p.rise || 0, lun = p.lunge || 0, n = 14, pts = [];
  for (let i = 0; i <= n; i++){
    const t = i / n, head = Math.max(0, (t - .72) / .28);
    const x = -21 + t * 31 + head * lun * 6, y = -3 + Math.sin(t * Math.PI * 2.4 + ph) * 3 * (1 - t * .5) - head * head * rise * 9;
    pts.push([x, y, 1 + Math.sin(Math.min(1, t * 1.25) * Math.PI) * 2.3 + (t > .8 ? .5 : 0)]);
  }
  for (let i = 0; i < n; i++){
    const [x0, y0, r0] = pts[i], [x1, y1, r1] = pts[i + 1], seg = i;
    mo_cap(P, x0, y0, x1, y1, r0, r1, C.sk, { d: .3, tex: (x, y, lv, u, v) => {
      if (v > .45) return [C.bel, clamp(lv - 1, 0, 2)];
      const zz = Math.abs((((seg * 4 + u * 4) % 4) + 4) % 4 - 2) - 1;   // Zickzack quer
      if (v < -.1 && Math.abs(v + .45 - zz * .25) < .26) return [C.zz, clamp(lv - 2, 0, 2)];
      return mo_hash(x, y, 7) < .12 ? lv + 1 : undefined;
    } });
  }
  mo_end(P, 1);
  const [hx, hy] = pts[n];
  mo_ell(P, hx + 1.4, hy - .2, 3.4, 2.4, C.sk, { b: .05, tex: (x, y, lv, u, v) => (v < -.5 && u < .2 ? [C.zz, 1] : undefined) });
  mo_put(P, hx + 2, hy - 1, C.tng, 2); mo_glow(P, hx + 2, hy - 1, '#ff4a2a', .9);
  if (p.tongue){ mo_line(P, hx + 4.6, hy + .4, hx + 7.4, hy + .6, C.tng, 2); mo_put(P, hx + 8, hy, C.tng, 2); mo_put(P, hx + 8, hy + 1.4, C.tng, 2); }
  mo_end(P, 1);
}
const mo_OTTERP = {
  idle: [{ ph: 0 }, { ph: .5, tongue: 1 }],
  move: [{ ph: 0 }, { ph: 1.57 }, { ph: 3.14 }, { ph: 4.71, tongue: 1 }],
  act: [{ ph: .8, rise: 1, tongue: 1 }, { ph: 1.4, rise: .5, lunge: 1.4, tongue: 1 }]
};
MON_ART.kreuzotter = mo_set(48, 24, 24, 21, mo_otter, mo_OTTERP);

/* ---------- Moosweiblein: kleiner Waldgeist im Mantel aus Moos, Flechtenhaar, Rindengesicht, Zweighände, Pilze ---------- */
const mo_MW = { mos: mo_mat('#121c0e', '#1e2c14', '#2c3e1c', '#3e5226', '#526832', '#6a7e40'), hai: mo_mat('#3a4232', '#566048', '#727e62', '#929e80', '#b0baa0'),
  brk: mo_SR.brk, pil: mo_mat('#4a0e0a', '#7a1a12', '#a8301e', '#c84a2c'), wht: mo_mat('#8a8676', '#b4b0a0', '#d8d4c4') };
function mo_moosweib(P, p){
  const C = mo_MW, bx = p.bx || 0, by = p.by || 0, ln = p.lean || 0, sw = p.sw || 0;
  const sh = [bx + ln * 4, -24 + by], hx = sh[0] + 1.5 + ln * 2, hy = sh[1] - 5;
  // ferner Zweigarm
  const twig = (s0, hand, near) => { mo_cap(P, s0[0], s0[1], hand[0], hand[1], 1.3, .8, C.brk, { b: near ? 0 : -.3, tex: mo_barkTex(5) }); for (const a of [-.6, 0, .6]){ const d = Math.atan2(hand[1] - s0[1], hand[0] - s0[0]) + a; mo_line(P, hand[0], hand[1], hand[0] + Math.cos(d) * 3.2, hand[1] + Math.sin(d) * 3.2, C.brk, near ? 3 : 1); } mo_end(P, 1); };
  twig([sh[0] - 2, sh[1] + 2], p.fh, false);
  // Mantel aus Moos mit ausgefranstem Saum
  mo_poly(P, [[sh[0] - 5, sh[1] - 1], [sh[0] + 5, sh[1] - 1.5], [bx + 9 + sw, -1 + by * .3], [bx + 7, 0], [bx - 8, 0], [bx - 10 - sw, -1]], C.mos, { cyl: .85, d: .5, tex: (x, y, lv, u, v) => {
    if (v > .86 && mo_hash(x, 3, 11) < .45) return false;
    if (mo_hash(x >> 1, y, 13) < .18) return lv + 1;
    return ((x + y * 2) % 5 === 0) ? lv - 1 : undefined;
  } });
  for (const [px, py] of [[-5, -6], [4, -11], [-2, -16]]){ mo_ell(P, bx + px, by + py - 1, 1.8, 1.1, C.pil, { b: .1 }); mo_put(P, bx + px, by + py - 1.4, C.wht, 2); mo_put(P, bx + px, by + py, C.wht, 0); }
  mo_end(P);
  // Flechtenhaar fällt über den Rücken
  for (let k = 0; k < 6; k++){ let x = hx - 3 + k * .9, y = hy - 3; const len = 10 + (k * 5 % 7); for (let j = 0; j < len; j++){ mo_put(P, x, y + j, C.hai, clamp(3 - (j > len - 3 ? 2 : 0) - (k & 1), 0, 4)); if ((j + k) % 4 === 0) x -= .8; } }
  mo_end(P, 1);
  // Gesicht aus Rinde, lange Nase, grüne Augen
  mo_ell(P, hx, hy, 3.4, 3.8, C.brk, { b: .12, tex: mo_barkTex(9) });
  mo_cap(P, hx + 2.4, hy - .4, hx + 5.4, hy + 1.4, 1.1, .6, C.brk, { b: .2 });
  for (const ox of [-.6, 1.6]){ mo_put(P, hx + ox, hy - 1, mo_DARK, 0); mo_glow(P, hx + ox, hy - 1, '#b0ff8a', 1); }
  mo_halo(P, hx + .5, hy - 1, 3, '#8aff6a', .3);
  if (p.hiss) mo_line(P, hx, hy + 2, hx + 2, hy + 2.4, mo_DARK, 0);
  mo_ell(P, hx - .4, hy - 3.6, 3.6, 1.8, C.mos, { b: .05 });   // Moosmütze
  mo_end(P, 1);
  twig([sh[0] + 2, sh[1] + 2], p.nh, true);
  for (const [sx, sy] of p.sp || []){ mo_glow(P, sx, sy, '#c8ff9a', .9); mo_glow(P, sx + 1, sy + 1, '#8aff6a', .5); }
}
const mo_MOOSP = {
  idle: [{ fh: [-6, -16], nh: [6, -15] }, { by: .5, sw: .5, fh: [-6, -15], nh: [6, -14] }],
  move: [{ lean: .2, sw: 1, fh: [-4, -16], nh: [7, -16] }, { by: -1, lean: .2, sw: -1, fh: [-6, -15], nh: [8, -15] }, { lean: .2, sw: 1, fh: [-3, -16], nh: [6, -17] }, { by: -1, lean: .2, sw: -1, fh: [-5, -15], nh: [8, -16] }],
  act: [{ lean: -.2, hiss: 1, fh: [-2, -30], nh: [5, -32], sp: [[3, -34], [7, -31]] }, { by: 1, lean: .6, hiss: 1, sw: 1.5, fh: [8, -18], nh: [14, -17], sp: [[16, -18], [18, -15], [15, -21]] }]
};
MON_ART.moosweib = mo_set(40, 40, 20, 38, mo_moosweib, mo_MOOSP);

/* ---------- Riesenkrebs: Flusskrebs, so groß wie ein Hund, olivbraun, rote Scheren ---------- */
const mo_KR = { sh: mo_mat('#100e08', '#1e1a10', '#2e2818', '#423822', '#584a2e', '#6e5c3a'), cl: mo_mat('#2a0e08', '#4a180c', '#6e2612', '#923a1c', '#b4502a'),
  leg: mo_mat('#1a1610', '#2a241a', '#3a3224') };
function mo_krebs(P, p){
  const C = mo_KR, bx = p.bx || 0, by = p.by || 0, op = p.open || 0, cx = p.cx || 0, ph = p.ph || 0;
  // ferne Beine und ferne Schere
  for (let k = 0; k < 4; k++){ const x0 = -2 + k * 3 + bx, a = Math.sin(ph + k * 1.4) * 1.5; mo_line(P, x0, -6 + by, x0 - 3 + a, -1, C.leg, 0); mo_line(P, x0 - 3 + a, -1, x0 - 4 + a, 0, C.leg, 1); }
  const claw = (sx, sy, ex, ey, near) => {
    const b = near ? 0 : -.3;
    mo_cap(P, sx, sy, ex, ey, 1.4, 2, C.sh, { b, d: .3 });
    const a = Math.atan2(ey - sy, ex - sx), ux = Math.cos(a), uy = Math.sin(a), o = .3 + op * .5;
    mo_ell(P, ex + ux * 3, ey + uy * 3, 4.4, 3, C.cl, { b, tex: (x, y, lv) => (mo_hash(x, y, 3) < .15 ? lv + 1 : undefined) });
    for (const sg of [-1, 1]){ const aa = a + sg * o, tx = ex + ux * 5 + Math.cos(aa) * 6, ty = ey + uy * 5 + Math.sin(aa) * 6; mo_cap(P, ex + ux * 5, ey + uy * 5, tx, ty, sg < 0 ? 2 : 1.6, .5, C.cl, { b: b + (sg < 0 ? .05 : -.05) }); }
    mo_end(P, 1);
  };
  claw(5 + bx, -9 + by, 13 + bx + cx, -14 + by - op * 2, false);
  // Schwanz (Hinterleib) in Segmenten, Schwanzfächer
  let px = -5 + bx, py = -7 + by;
  for (let k = 0; k < 5; k++){ const nx = px - 3.4, ny = py + .6 + k * .3, r = 4 - k * .45; mo_cap(P, px, py, nx, ny, r, r - .3, C.sh, { d: .3, tex: (x, y, lv, u) => (u < .12 ? lv - 2 : undefined) }); px = nx; py = ny; }
  mo_poly(P, [[px, py - 3], [px - 6, py - 4 + Math.sin(ph) * .5], [px - 7, py + 1], [px - 1, py + 2]], C.sh, { cyl: .5, b: -.05 });
  mo_end(P);
  // Kopfbrustpanzer mit Dornen, Stielaugen, Fühler
  mo_ell(P, 3 + bx, -8 + by, 9, 5.4, C.sh, { d: .3, tex: (x, y, lv, u, v) => (Math.abs(u - .1) < .06 ? lv - 2 : mo_hash(x, y, 9) < .1 ? lv + 1 : undefined) });
  for (let k = 0; k < 4; k++) mo_put(P, -2 + k * 3 + bx, -13 + by + (k & 1), C.cl, 3);
  mo_end(P);
  const ex = 11 + bx, ey = -12 + by;
  mo_line(P, ex, ey + 1, ex + 1, ey - 1, C.leg, 2); mo_put(P, ex + 1, ey - 2, mo_DARK, 0); mo_glow(P, ex + 1, ey - 2, '#ffcf6a', .7);
  mo_line(P, ex + 1, ey - 1, ex + 14, ey - 9 + Math.sin(ph) * 1.5, C.leg, 2); mo_line(P, ex, ey, ex + 12, ey - 4 + Math.sin(ph + 1) * 1.5, C.leg, 1);
  for (let k = 0; k < 4; k++){ const x0 = k * 3 + bx, a = Math.sin(ph + k * 1.4 + 2) * 1.5; mo_line(P, x0, -5 + by, x0 - 2 + a, -1, C.leg, 2); mo_line(P, x0 - 2 + a, -1, x0 - 3 + a, 0, C.leg, 3); }
  mo_end(P, 1);
  claw(8 + bx, -6 + by, 17 + bx + cx, -9 + by - op * 3, true);
}
const mo_KREBSP = {
  idle: [{ ph: 0 }, { ph: 1, by: .5, open: .3 }],
  move: [{ ph: 0 }, { ph: 1.6, by: -.5 }, { ph: 3.1 }, { ph: 4.7, by: -.5 }],
  act: [{ ph: .5, open: 1.2, by: -1, cx: -2 }, { ph: 1, open: 0, cx: 5, bx: 2 }]
};
MON_ART.riesenkrebs = Object.assign(mo_set(60, 32, 26, 29, mo_krebs, mo_KREBSP), { reach: 30 });

/* ---------- Reiter: Pferd (Vierbeiner-Maler, vergrößerbar) mit Reiter; Geisterreiter, Geisterbogner, Hackelberg, Eppelein, Bulcsú ----------
   R = Bauplan des Reiters { C: Farben, hat, weapon, mustache, ghost, z }, Pose p wie beim Vierbeiner plus hand [dx, dy], wa (Waffenwinkel), lean, draw */
function mo_horseSpec(C, z, glow){
  return { C, hip: [-15 * z, -28 * z], sho: [13 * z, -29 * z], rH: 8.6 * z, rS: 9.8 * z, legL: [[11 * z, 10 * z], [11 * z, 10 * z]], legR: [[4 * z, 2.5 * z], [3.6 * z, 2.2 * z]],
    hock: [-3 * z, 6.5 * z], paw: 2.4 * z, neck: [6 * z, -12 * z], head: [5 * z, -2 * z], skull: [4.8 * z, 3.9 * z], snout: [9.4 * z, 5.2 * z, 3.3 * z, 2.5 * z],
    ears: [[-1.6 * z, -.25], [.4 * z, 0]], eye: [1.4 * z, -1.3 * z], glow: glow || '#1a1008', tail: { a: Math.PI * .6, curl: .05, n: 6, seg: 3.2 * z, r: 2.8 * z, o: 4 * z } };
}
const mo_zPose = (p, z) => { const q = Object.assign({}, p); for (const k of ['hf', 'ff', 'hn', 'fn', 'hd', 'hand']) if (q[k]) q[k] = q[k].map(v => v * z); for (const k of ['bx', 'by']) if (q[k]) q[k] *= z; return q; };
function mo_rider(P, H, R, p){
  const z = R.z || 1, C = R.C, gh = R.ghost;
  mo_quad(P, H, p);
  const bx = p.bx || 0, by = p.by || 0, ln = (p.lean || 0) * z;
  const sx = (H.hip[0] + H.sho[0]) / 2 + bx, sy = Math.min(H.hip[1], H.sho[1]) - H.rH * .9 + by;
  // Satteldecke mit Fransen
  mo_poly(P, [[sx - 8 * z, sy], [sx + 7 * z, sy - .5 * z], [sx + 6 * z, sy + 8 * z], [sx - 9 * z, sy + 8 * z]], C.clo, { cyl: .6, d: .3, tex: (x, y, lv, u, v) => (v > .85 && (x & 1) ? false : v > .78 ? [C.tri, lv] : undefined) });
  mo_end(P, 1);
  // Rumpf
  const hip = [sx, sy - 1 * z], shd = [sx + ln, sy - 13 * z];
  mo_cap(P, hip[0], hip[1], shd[0], shd[1], 4.4 * z, 4 * z, C.gar, { d: .3, tex: (x, y, lv, u, v) => (u < .12 ? [C.lea, clamp(lv, 0, 3)] : Math.abs(v) < .14 && u > .2 ? [C.tri, lv] : undefined) });
  mo_end(P);
  // nahes Bein mit Stiefel im Steigbügel
  const kn = [sx + 6 * z, sy + 5 * z], ft = [sx + 4 * z, sy + 12 * z];
  mo_cap(P, sx + 1 * z, sy, kn[0], kn[1], 2.6 * z, 2.2 * z, C.gar, { d: .3 });
  mo_cap(P, kn[0], kn[1], ft[0], ft[1], 2 * z, 1.7 * z, C.boo, {});
  mo_ell(P, ft[0] + 1.2 * z, ft[1] + .6 * z, 2.4 * z, 1.4 * z, C.boo, { b: .05 });
  mo_line(P, ft[0] - 1.5 * z, ft[1] + 1.4 * z, ft[0] + 3 * z, ft[1] + 1.4 * z, C.stl, 2);
  mo_end(P, 1);
  // Kopf und Gesicht
  const hx = shd[0] + 1.6 * z, hy = shd[1] - 4.6 * z;
  mo_ell(P, hx, hy, 2.8 * z, 3.2 * z, C.skn, { b: .05 });
  mo_ell(P, hx + 2.6 * z, hy + .4 * z, .9 * z, 1.1 * z, C.skn, { b: .15 });
  const ex = hx + 1.4 * z, ey = hy - .6 * z;
  mo_put(P, ex, ey, gh ? C.skn : mo_DARK, gh ? 4 : 0);
  if (gh || R.eyeGlow){ mo_glow(P, ex, ey, R.eyeGlow || '#c8f4ff', 1); mo_halo(P, ex, ey, 2.2 * z, R.eyeGlow || '#9ae8ff', .35); }
  if (R.mustache){ mo_line(P, hx + 1.6 * z, hy + 1.6 * z, hx - .6 * z, hy + 4 * z, C.hai, 2); mo_line(P, hx + 2.4 * z, hy + 1.6 * z, hx + 4 * z, hy + 4.4 * z, C.hai, 1); }
  if (R.beard) mo_poly(P, [[hx - 1 * z, hy + 1.6 * z], [hx + 3.4 * z, hy + 1.4 * z], [hx + 2.4 * z, hy + 5.4 * z], [hx, hy + 5 * z]], C.hai, { cyl: .5 });
  mo_end(P, 1);
  // Kopfbedeckung
  if (R.hat === 'muetze' || R.hat === 'krone'){
    mo_poly(P, [[hx - 3.4 * z, hy - 1.6 * z], [hx + 3 * z, hy - 2 * z], [hx + 2.2 * z, hy - 6.4 * z], [hx - 2.4 * z, hy - 7.2 * z]], C.hat, { cyl: .8, d: .4, tex: mo_furPoly(51, .2) });
    if (R.hat === 'krone'){ for (let k = 0; k < 4; k++){ const x = hx - 3 * z + k * 2 * z; mo_put(P, x, hy - 3 * z, C.gld, 4); mo_put(P, x, hy - 4.2 * z, C.gld, 3); } mo_glow(P, hx, hy - 3.4 * z, '#ffe8a0', .8); }
    if (R.plume) mo_cap(P, hx - 1.4 * z, hy - 6.6 * z, hx - 5 * z, hy - 11 * z, .9 * z, .5 * z, C.tri, { b: .1 });
  } else if (R.hat === 'jaeger'){
    mo_ell(P, hx, hy - 3 * z, 5.6 * z, 1.5 * z, C.hat, { b: .02 });
    mo_ell(P, hx - .3 * z, hy - 4.6 * z, 3 * z, 2.4 * z, C.hat, { b: .08 });
    if (R.antler) for (const sg of [-1, 1]){ const bxa = hx + sg * 1.6 * z, bya = hy - 6.4 * z; mo_line(P, bxa, bya, bxa + sg * 3 * z, bya - 6 * z, C.ant, 3); mo_line(P, bxa + sg * 1.6 * z, bya - 3 * z, bxa + sg * 4.6 * z, bya - 4 * z, C.ant, 2); mo_line(P, bxa + sg * 2.4 * z, bya - 5 * z, bxa + sg * 1 * z, bya - 8.4 * z, C.ant, 2); }
  } else if (R.hat === 'helm'){
    mo_poly(P, [[hx - 4 * z, hy + .6 * z], [hx + 3.6 * z, hy - .2 * z], [hx + 3 * z, hy - 4.4 * z], [hx - 1 * z, hy - 5.6 * z], [hx - 5.6 * z, hy - 2 * z]], C.stl, { cyl: .9, b: .05 });
    mo_line(P, hx - .4 * z, hy - .8 * z, hx + 3 * z, hy - 1.2 * z, mo_DARK, 0);   // Sehschlitz
    if (R.plume) mo_cap(P, hx - 2 * z, hy - 5 * z, hx - 7 * z, hy - 9 * z, 1.2 * z, .5 * z, C.tri, { b: .1 });
  }
  mo_end(P, 1);
  // naher Arm mit Waffe
  const s0 = [shd[0] + 1 * z, shd[1] + 1.4 * z], hd = [s0[0] + p.hand[0], s0[1] + p.hand[1]], el = mo_ik(s0[0], s0[1], hd[0], hd[1], 5.6 * z, 5.2 * z, 1);
  const wa = p.wa || 0, ux = Math.cos(wa), uy = Math.sin(wa);
  const weapon = () => {
    if (R.weapon === 'sabel'){
      const L = 16 * z; let px = hd[0], py = hd[1];
      mo_line(P, hd[0] - ux * 2 * z, hd[1] - uy * 2 * z, hd[0] + ux * 1.4 * z, hd[1] + uy * 1.4 * z, C.lea, 2);
      for (let k = 1; k <= 8; k++){ const t = k / 8, a = wa + t * .45, nx = hd[0] + ux * 1.4 * z + Math.cos(a) * L * t, ny = hd[1] + uy * 1.4 * z + Math.sin(a) * L * t; mo_line(P, px, py, nx, ny, C.stl, k > 6 ? 4 : 3); px = nx; py = ny; }
      if (p.glint) mo_glow(P, px, py, '#ffffff', 1);
    } else if (R.weapon === 'schwert'){
      const L = 15 * z, t1 = [hd[0] + ux * L, hd[1] + uy * L];
      mo_line(P, hd[0] - ux * 2.4 * z, hd[1] - uy * 2.4 * z, hd[0], hd[1], C.lea, 2);
      mo_line(P, hd[0] - uy * 2.6 * z, hd[1] + ux * 2.6 * z, hd[0] + uy * 2.6 * z, hd[1] - ux * 2.6 * z, C.stl, 3);   // Parierstange
      mo_line(P, hd[0], hd[1], t1[0], t1[1], C.stl, 4); mo_line(P, hd[0] + uy * .9, hd[1] - ux * .9, t1[0] + uy * .9, t1[1] - ux * .9, C.stl, 2);
      if (p.glint) mo_glow(P, t1[0], t1[1], '#ffffff', 1);
    } else if (R.weapon === 'spiess'){
      const L = 30 * z, t0 = [hd[0] - ux * 10 * z, hd[1] - uy * 10 * z], t1 = [hd[0] + ux * L, hd[1] + uy * L];
      mo_line(P, t0[0], t0[1], t1[0], t1[1], C.wod, (k, n) => k % 7 === 0 ? 1 : 2);
      mo_poly(P, [[t1[0] - uy * 1.6 * z, t1[1] + ux * 1.6 * z], [t1[0] + ux * 6 * z, t1[1] + uy * 6 * z], [t1[0] + uy * 1.6 * z, t1[1] - ux * 1.6 * z]], C.stl, { cyl: .4, b: .1 });
      mo_line(P, t1[0] - uy * 3 * z, t1[1] + ux * 3 * z, t1[0] + uy * 3 * z, t1[1] - ux * 3 * z, C.stl, 2);   // Knebel der Saufeder
    } else if (R.weapon === 'bogen'){
      const bx0 = hd[0] + 1 * z, top = [bx0 - 2 * z, hd[1] - 9 * z], bot = [bx0 - 2 * z, hd[1] + 9 * z], sx2 = p.draw ? s0[0] - 2 * z : bx0 - 3 * z;
      let lx = top[0], ly = top[1];
      for (let k = 1; k <= 10; k++){ const t = k / 10, a = (t - .5) * Math.PI, x = bx0 + Math.cos(a) * 3 * z - (t < .15 || t > .85 ? 2 * z : 0), y = hd[1] + Math.sin(a) * 9 * z; mo_line(P, lx, ly, x, y, C.wod, 3); lx = x; ly = y; }
      mo_line(P, top[0], top[1], sx2, hd[1], C.str, 2); mo_line(P, sx2, hd[1], bot[0], bot[1], C.str, 2);
      if (p.draw){ mo_line(P, sx2, hd[1], bx0 + 6 * z, hd[1], C.wod, 4); mo_put(P, bx0 + 7 * z, hd[1], C.stl, 4); mo_glow(P, bx0 + 7 * z, hd[1], R.eyeGlow || '#c8f4ff', .7); }
    }
  };
  if (R.weapon === 'bogen'){ weapon(); mo_end(P, 1); }
  mo_cap(P, s0[0], s0[1], el[0], el[1], 2 * z, 1.7 * z, C.gar, {});
  mo_cap(P, el[0], el[1], hd[0], hd[1], 1.7 * z, 1.4 * z, C.gar, { tex: (x, y, lv, u) => (u > .8 ? [C.tri, lv] : undefined) });
  mo_ell(P, hd[0], hd[1], 1.6 * z, 1.5 * z, C.glv || C.skn, { b: .08 });
  mo_end(P, 1);
  if (R.weapon !== 'bogen'){ weapon(); mo_end(P, 1); }
  if (gh) for (let k = 0; k < 6; k++){ const a = k * 1.1 + (p.ph || 0); mo_glow(P, sx - 18 * z + Math.cos(a) * 4 * z, -3 * z + Math.sin(a) * 2 * z, '#bfefff', .45); }   // Nebelschwaden an den Hufen
}
/* Gangarten des Pferdes, dazu Armhaltung je Waffe */
const mo_HORSEP = {
  idle: [{ hf: [-16, 0], ff: [11, 0], hn: [-13, 0], fn: [14, 0], tail: 0 }, { by: .5, hf: [-16, 0], ff: [11, 0], hn: [-13, 0], fn: [14, 0], hd: [0, 1], tail: .06 }],
  move: [
    { by: -1, hf: [-24, 0], hn: [-20, -3], ff: [18, -5], fn: [22, -2], tail: -.2, mane: 1 },
    { by: -3, tilt: .03, hf: [-14, -4], hn: [-11, -1], ff: [8, -1], fn: [12, -4], tail: 0, mane: 1 },
    { by: -1, hf: [-18, 0], hn: [-22, -3], ff: [22, 0], fn: [16, -5], tail: -.2, mane: 1 },
    { by: -3, tilt: .03, hf: [-9, -1], hn: [-12, -4], ff: [12, -4], fn: [7, -1], tail: 0, mane: 1 }],
  act: [
    { by: -2, tilt: -.15, hf: [-16, 0], hn: [-13, 0], ff: [14, -10], fn: [18, -8], hd: [0, -2], tail: .2, mane: 1 },
    { tilt: .08, hf: [-22, -2], hn: [-19, 0], ff: [20, -4], fn: [24, -2], hd: [2, 1], tail: -.2, mane: 1 }]
};
const mo_ARMS = {
  sabel: { idle: [{ hand: [4, 3], wa: -1.2 }, { hand: [4, 3.4], wa: -1.2 }], move: [{ hand: [5, 2], wa: -1 }, { hand: [5, 1.6], wa: -1 }, { hand: [5, 2], wa: -1 }, { hand: [5, 1.6], wa: -1 }],
    act: [{ hand: [-2, -9], wa: -2.4, lean: -.4 }, { hand: [9, 2], wa: .35, lean: 1, glint: 1 }] },
  schwert: { idle: [{ hand: [4, 3], wa: -1.3 }, { hand: [4, 3.4], wa: -1.3 }], move: [{ hand: [5, 2], wa: -1.1 }, { hand: [5, 1.6], wa: -1.1 }, { hand: [5, 2], wa: -1.1 }, { hand: [5, 1.6], wa: -1.1 }],
    act: [{ hand: [-2, -9], wa: -2.2, lean: -.4 }, { hand: [9, 2], wa: .3, lean: 1, glint: 1 }] },
  spiess: { idle: [{ hand: [5, 2], wa: -1.25 }, { hand: [5, 2.4], wa: -1.25 }], move: [{ hand: [6, 1], wa: -.5 }, { hand: [6, .6], wa: -.5 }, { hand: [6, 1], wa: -.5 }, { hand: [6, .6], wa: -.5 }],
    act: [{ hand: [1, -2], wa: -.35, lean: -.5 }, { hand: [11, 0], wa: .05, lean: 1.2 }] },
  bogen: { idle: [{ hand: [6, 2] }, { hand: [6, 2.4] }], move: [{ hand: [6, 1] }, { hand: [6, .6] }, { hand: [6, 1] }, { hand: [6, .6] }],
    act: [{ hand: [9, -1], draw: 1, lean: -.2 }, { hand: [9, -1], lean: .2 }] }
};
function mo_riderSet(H, R, w, h, ax, ay){
  const z = R.z || 1, A = mo_ARMS[R.weapon], spec = {};
  for (const k of ['idle', 'move', 'act']) spec[k] = mo_HORSEP[k].map((q, i) => mo_zPose(Object.assign({ ph: i * 1.3 }, q, A[k][i]), z));
  const set = mo_set(w, h, ax, ay, (P, p) => mo_rider(P, H, R, p), spec);
  if (R.weapon === 'bogen'){ const q = spec.act[0], H2 = H, sx = (H2.hip[0] + H2.sho[0]) / 2 + (q.bx || 0), sy = Math.min(H2.hip[1], H2.sho[1]) - H2.rH * .9 + (q.by || 0); set.muzzle = { x: Math.round(sx + (q.lean || 0) * z + 1 * z + q.hand[0] + 8 * z), y: Math.round(sy - 13 * z + 1.4 * z + q.hand[1]) }; }
  return set;
}
const mo_GH = {   // Geisterpferd und Geisterreiter: bläulich, durchscheinend
  fur: mo_mat('#1a2a3a90', '#2a4a5aa0', '#3e6a7cb0', '#5a8c9cc0', '#7eaebcd0', '#a8d0dae0', '#d0eef4e8'), bel: mo_mat('#2a4a5aa0', '#4a7a8ab8', '#7aa8b4d0', '#a8d0dae0'),
  sad: mo_mat('#10202aa0', '#1a3040b0'), skn: mo_mat('#4a6a7ac0', '#6a8e9ed0', '#8eb4c2e0', '#b4d6e0f0', '#d8f0f6'), mou: mo_mat('#10202a', '#1a3040', '#2a4a5a'), eye: mo_mat('#6ac8f0', '#a8e8ff', '#f0ffff')
};
const mo_GHR = {
  skn: mo_GH.skn, gar: mo_mat('#1e3040a0', '#2e4a5cb8', '#46687cc8', '#6a8ea0d8', '#90b4c4e8'), tri: mo_mat('#4a6a5ab0', '#6a9478c8', '#94c0a0e0'), lea: mo_mat('#1a2a34b0', '#2a3e4cc0', '#3e5664d0'),
  boo: mo_mat('#14222cb0', '#22343ec0', '#34505ed0'), hat: mo_mat('#1a2830b0', '#2a3e4ac0', '#40586ad0', '#5a7688e0'), hai: mo_mat('#4a6a7a', '#7a9aaa', '#a8c8d4'),
  stl: mo_mat('#4a5a64', '#7a8a94', '#a8b8c0', '#d4e4ea', '#f4ffff'), wod: mo_mat('#2a3a44', '#3e5260', '#566c7a', '#70889a'), str: mo_mat('#8aa8b8', '#b4d0dc', '#dcf0f6'),
  clo: mo_mat('#2a1a3ab0', '#3e2a54c0', '#56406ed0', '#70588ae0'), gld: mo_mat('#6a6a4a', '#9a9a6a', '#cacaa0', '#f0f0d0')
};
MON_ART.geisterreiter = Object.assign(mo_riderSet(mo_horseSpec(mo_GH, 1, '#a8f0ff'), { C: mo_GHR, hat: 'muetze', weapon: 'sabel', mustache: true, ghost: true, z: 1 }, 80, 72, 38, 68), { reach: 34 });
MON_ART.geisterbogner = mo_riderSet(mo_horseSpec(mo_GH, 1, '#a8f0ff'), { C: mo_GHR, hat: 'muetze', weapon: 'bogen', mustache: true, ghost: true, z: 1 }, 80, 72, 38, 68);
// Bulcsú, der Geisterfürst: größer, Purpur und fahles Gold, Krone über der Fellmütze, Federbusch
BOSS_ART.bulcsu = Object.assign(mo_riderSet(mo_horseSpec(mo_GH, 1.3, '#ffe0a0'), { C: Object.assign({}, mo_GHR, {
  gar: mo_mat('#3a1a4ab0', '#542a68c0', '#6e3e86d0', '#8a56a2e0', '#a876bef0'), tri: mo_mat('#6a5a2ac0', '#9a8a3ad0', '#cabc5ae0', '#ece0a0'),
  hat: mo_mat('#2a2014c0', '#3e3020d0', '#58462ee0', '#72603ef0') }), hat: 'krone', plume: true, weapon: 'sabel', mustache: true, ghost: true, eyeGlow: '#ffe8a0', z: 1.3 }, 104, 92, 50, 88), { reach: 46 });
// Hackelberg, der Wilde Jäger: dunkles Jägergrün, Hirschgeweih am Hut, Saufeder, auf einem Rappen mit glühenden Augen
const mo_RAPPE = { fur: mo_mat('#08080a', '#121214', '#1c1c20', '#28282e', '#36363e', '#46464e', '#585862'), bel: mo_mat('#121214', '#1c1c20', '#28282e', '#36363e'),
  sad: mo_mat('#060608', '#0e0e10'), skn: mo_mat('#16161a', '#24242a', '#34343c'), mou: mo_mat('#26090b', '#4c1416', '#74241f'), eye: mo_mat('#6a1a0a', '#c43a1a', '#ff7a3a') };
BOSS_ART.hackelberg = Object.assign(mo_riderSet(mo_horseSpec(mo_RAPPE, 1.25, '#ff5a2a'), { C: {
  skn: mo_mat('#4a5a4a', '#6a7a68', '#8a9a86', '#aab8a4', '#c8d4c0'), gar: mo_mat('#0e160e', '#18241a', '#243426', '#324634', '#425a44'), tri: mo_mat('#3a2a14', '#5a4220', '#7a5c30', '#9a7840'),
  lea: mo_mat('#1a120c', '#2a1e14', '#3c2c1e'), boo: mo_mat('#140e0a', '#221812', '#32241a'), hat: mo_mat('#121a10', '#1e2a1a', '#2c3c26', '#3c5034'),
  hai: mo_mat('#3a3a32', '#5a5a4e', '#7a7a6a'), stl: mo_mat('#24272b', '#474c52', '#737a81', '#a1a8ae', '#d0d4d4'), wod: mo_mat('#2a1e15', '#463321', '#644b31', '#7f6445'),
  ant: mo_mat('#4a3e2e', '#7a6a50', '#a8987a', '#cec0a2'), clo: mo_mat('#2a0e0e', '#421616', '#5e2020', '#7a2c28'), str: mo_LK.lin, gld: mo_LK.och },
  hat: 'jaeger', antler: true, weapon: 'spiess', beard: true, eyeGlow: '#ff6a3a', z: 1.25 }, 100, 92, 48, 88), { reach: 48 });
// Eppelein von Gailingen: Raubritter in blankem Harnisch auf einem Fuchs, Helm mit roter Feder, Schwert
const mo_FUCHS = { fur: mo_mat('#1a0c06', '#2e160a', '#46220e', '#603014', '#7a401c', '#945426', '#aa6834'), bel: mo_mat('#3a1c0c', '#562a12', '#723a1a', '#8e4e26'),
  sad: mo_mat('#140806', '#22100a'), skn: mo_mat('#1a1210', '#2c1e1a', '#3e2c26'), mou: mo_mat('#26090b', '#4c1416', '#74241f'), eye: mo_mat('#1a1008', '#3a2410', '#5a3a1a') };
BOSS_ART.eppelein = Object.assign(mo_riderSet(mo_horseSpec(mo_FUCHS, 1.25, '#2a1a0a'), { C: {
  skn: mo_LK.skn, gar: mo_mat('#1a1c20', '#30343a', '#4c525a', '#6e767e', '#98a0a6', '#c4cad0'), tri: mo_mat('#4a0e0e', '#7a1616', '#a8241e', '#c83a2a'),
  lea: mo_LK.lea, boo: mo_mat('#1a1c20', '#30343a', '#4c525a', '#6e767e'), hat: mo_LK.stl, hai: mo_LK.hai, stl: mo_LK.stl, wod: mo_LK.wod,
  clo: mo_mat('#3a0a0a', '#5a1212', '#7a1c18', '#9a2a22'), glv: mo_mat('#1a1c20', '#30343a', '#4c525a', '#6e767e'), str: mo_LK.lin, gld: mo_LK.och },
  hat: 'helm', plume: true, weapon: 'schwert', z: 1.25 }, 100, 92, 48, 88), { reach: 46 });

/* ---------- Das Donauweibchen: Wasserfrau, die aus einem Strudel der Donau steigt, langes grüngoldenes Haar, Kranz aus Seerosen ---------- */
const mo_DW = {
  skn: mo_mat('#1e3a3a', '#2e5654', '#46746e', '#64948a', '#86b4a8', '#acd4c6'), sca: mo_mat('#143a3a', '#1e5250', '#2c6e68', '#408c82', '#5aaa9c'),
  hai: mo_mat('#2a3a14', '#44561e', '#62762a', '#86963a', '#aab452', '#ccd070'), lil: mo_mat('#8a8a84', '#b8b8b0', '#e0e0d8', '#fafaf4'),
  ylw: mo_mat('#8a6a10', '#c49a20', '#f0c840'), wat: mo_NK.wat
};
function mo_weibchen(P, p){
  const C = mo_DW, bx = p.bx || 0, by = p.by || 0, ph = p.ph || 0, rs = p.raise || 0, th = p.thr || 0;
  mo_ell(P, 0, -4, 28, 7, C.wat, { lv: 2, tex: (x, y, lv) => { const r = Math.hypot(x / 28, (y + 4) / 7), a = Math.atan2((y + 4) * 4, x), ring = Math.sin(r * 15 - ph * 2 + a * 1.5); return r > .9 ? 1 : ring > .75 ? 5 : ring > .35 ? 4 : r < .45 ? 1 : 2; } });
  mo_end(P, 0);
  const hx = 3 + bx + th * 2, hy = -72 + by;
  // Haar fällt in Wellen bis ins Wasser
  for (let k = 0; k < 22; k++){
    const side = k < 11 ? -1 : 1, kk = k % 11;
    let x = hx + side * (2 + kk * .7), y = hy - 6 + (k & 1);
    const len = 40 + (k * 7 % 13) - kk;
    for (let j = 0; j < len; j++){
      mo_put(P, x, y + j, C.hai, clamp(3 - (j > len - 4 ? 2 : 0) + ((j + k) % 6 === 0 ? 1 : 0) - (side < 0 ? 1 : 0), 0, 5));
      mo_put(P, x + side, y + j, C.hai, clamp(2 - (side < 0 ? 1 : 0), 0, 5));
      if (j > 6 && ((j * 3 + k * 5) % 6) === 0) x += side * (j < 20 ? 1 : .5);
      if (Math.sin(ph + j * .3 + k) > .92) x -= side;
    }
  }
  mo_end(P, 1);
  const arm = (A, near) => {
    const [sx0, sy0, ex0, ey0, hx0, hy0] = A.map((v, i) => v + (i % 2 ? by : bx)), b = near ? .05 : -.25;
    mo_cap(P, sx0, sy0, ex0, ey0, 3.2, 2.6, C.skn, { b }); mo_cap(P, ex0, ey0, hx0, hy0, 2.6, 2, C.skn, { b }); mo_ell(P, hx0, hy0, 2.4, 2.2, C.skn, { b: b + .05 });
    mo_end(P, 1);
    if (near && (rs || th)) for (let k = 0; k < 5; k++){ mo_glow(P, hx0 + (k - 2) * 2.4, hy0 - 3 - (k & 1) * 2, '#b8f4ff', .9); }
    return [hx0, hy0];
  };
  arm(rs ? [-9, -54, -17, -66, -14, -80] : th ? [-9, -54, -16, -46, -22, -40] : [-9, -54, -15, -44, -14, -32 + Math.sin(ph)], false);
  // Leib steigt aus dem Wasser, Schuppenkleid
  mo_cap(P, bx * .4, -34 + by, 0, -6, 6, 10, C.sca, { d: .3, tex: (x, y, lv) => (((x + (y >> 1) * 2) % 4) === 0 && (y & 1) ? lv - 1 : mo_hash(x, y, 4) < .06 ? lv + 2 : undefined) });
  mo_end(P);
  mo_poly(P, [[-10 + bx, -59 + by], [10 + bx, -59 + by], [8 + bx, -50 + by], [5 + bx, -40 + by], [6.5 + bx, -32 + by], [-6.5 + bx, -32 + by], [-5 + bx, -40 + by], [-8 + bx, -50 + by]], C.skn, { cyl: .95, d: .2, tex: (x, y, lv, u, v) => (y - by > -46 ? [C.sca, clamp(lv - ((x + y) & 1), 0, 4)] : undefined) });
  mo_end(P);
  // Kopf: schmales Gesicht, leuchtende Augen, singender Mund, Kranz aus Seerosen
  mo_ell(P, hx, hy, 5.2, 6.8, C.skn, { b: .1 });
  mo_cap(P, hx - 1, hy + 6, hx + bx * .2, -58 + by, 2.4, 2.8, C.skn, {});   // Hals
  for (const ex of [1, 4.6]){ mo_put(P, hx + ex, hy - 1, mo_DARK, 0); mo_glow(P, hx + ex, hy - 1, '#9ff4ff', 1); }
  mo_halo(P, hx + 2.8, hy - 1, 4, '#7fe8ff', .3);
  if (rs || th) mo_ell(P, hx + 2.6, hy + 3.4, 1.2, 1.6 + (rs ? .6 : 0), mo_DARK, { lv: 0 }); else mo_line(P, hx + 1.4, hy + 3.4, hx + 4, hy + 3.2, mo_DARK, 1);
  mo_end(P, 1);
  for (let k = 0; k < 5; k++){ const a = Math.PI + .3 + k / 4 * (Math.PI - .6), x = hx + Math.cos(a) * 6.4, y = hy - 3 + Math.sin(a) * 4.4; mo_ell(P, x, y, 2, 1.5, C.lil, { b: .1 }); mo_put(P, x, y, C.ylw, 2); }
  mo_end(P, 1);
  arm(rs ? [9, -54, 16, -66, 12, -82] : th ? [9, -54, 21, -52, 33, -50] : [9, -54, 15, -44, 14, -33 + Math.sin(ph + 1)], true);
  if (p.drip !== undefined){ mo_glow(P, 14 + bx, -28 + by + p.drip, '#b4e0e8', .85); }
}
const mo_WEIBP = {
  idle: [{ ph: 0, drip: 0 }, { ph: .9, by: 1, drip: 2 }],
  move: [{ ph: 0, drip: 0 }, { ph: 1.6, by: 1, drip: 1 }, { ph: 3.1, drip: 2 }, { ph: 4.7, by: 1, drip: 0 }],
  act: [{ ph: .5, raise: 1, bx: -1 }, { ph: 2, thr: 1, bx: 3, by: 1 }]
};
BOSS_ART.donauweibchen = Object.assign(mo_set(100, 104, 50, 98, mo_weibchen, mo_WEIBP), { reach: 52 });

