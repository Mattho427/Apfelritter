/* Der Apfelritter, Teil 1 von 22: Grundlagen: Hilfen, Zeichenwerkzeuge, verzögertes Laden der Tafelbilder.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
"use strict";
/* Fingerabdruck dieser Fassung: Zwischenspeicher gelten nur für genau diese. Wird von werkzeug/stempel.mjs vor dem Veröffentlichen gesetzt. */
const SRC_HASH = '1407764:4kf9d8';
/* Bilder der Tafeln unter dem Spiel: erst nach dem Start malen, sichtbare zuerst, der Rest nach und nach */
const LAZY = { q: [], go: false, io: null };
try { LAZY.io = new IntersectionObserver(es => { if (LAZY.go) for (const e of es) if (e.isIntersecting) lazyNow(e.target); }, { rootMargin: '300px' }); } catch(e){}
function lazySrc(im, fn){ if (LAZY.go){ try { im.src = fn(); } catch(e){} return; } im._lz = fn; LAZY.q.push(im); }
function lazyNow(im){ const fn = im._lz; if (!fn) return; im._lz = null; if (LAZY.io) LAZY.io.unobserve(im); try { im.src = fn(); } catch(e){ console.warn(e); } }
function lazyPump(){ const t0 = performance.now(); while (LAZY.q.length && performance.now() - t0 < 12) lazyNow(LAZY.q.shift()); if (LAZY.q.length) setTimeout(lazyPump, 40); }
function lazyStart(){ if (LAZY.go) return; LAZY.go = true; if (LAZY.io) for (const im of LAZY.q) LAZY.io.observe(im); setTimeout(lazyPump, 300); }
/* ============ Grundlagen (gemeinsam für alle Module) ============ */
const WW = 6144, WH = 3072;          // Größe der Welt in Weltpixeln
const WS = 2;                        // Feinpixel je Weltpixel: Weltbilder und Boden in doppelter Auflösung, Spielkoordinaten in Feinpixeln
const TILE = 16;
const cv = document.getElementById('game');
cv.tabIndex = 0;
/* innere Auflösung des Spielfelds in Feinpixeln: im Seitenverhältnis des freien Platzes, höchstens 960 × 540 (so groß wie die Gaststube).
   Telefone hochkant 512 breit (sonst wird der Ritter zu klein) und höchstens 480 hoch (Bildrate), Telefone quer bis 360 hoch.
   Festgelegt beim Laden; ändert sich das Fenster später, passt fitStage() das Bild ein (mit schmalem Rand). */
const [W, H] = (() => {
  let aw = 960, ah = 540, touch = false;
  try {
    const b = document.getElementById('stageBox');
    if (b && b.clientWidth > 50 && b.clientHeight > 50){ aw = b.clientWidth; ah = b.clientHeight; }
    touch = matchMedia('(hover:none) and (pointer:coarse)').matches;
  } catch(e){}
  const asp = Math.max(1.15, Math.min(2.4, aw / ah)), even = v => Math.round(v / 2) * 2, by8 = v => Math.round(v / 8) * 8;
  if (aw < 600) return [512, even(Math.max(288, Math.min(480, 512 / asp)))];                                        // Telefon hochkant
  if (touch && aw > ah){ const h = even(Math.max(270, Math.min(360, ah))); return [Math.max(480, Math.min(960, by8(h * Math.min(2.9, aw / ah)))), h]; }   // Telefon oder Tablet quer
  let w = 960, h = even(w / asp);
  if (h > 540){ h = 540; w = Math.max(640, by8(h * asp)); }
  return [w, h];
})();
cv.width = W; cv.height = H;
/* Bühne so groß wie möglich im freien Platz, im Seitenverhältnis des Spielfelds (Anzeigen auf der Bühne liegen so genau über dem Bild) */
function fitStage(){
  const b = document.getElementById('stageBox'), st = document.getElementById('stage');
  if (!b || !st || !b.clientWidth || !b.clientHeight) return;
  const s = Math.min(b.clientWidth / W, b.clientHeight / H), h = Math.floor(H * s);
  st.style.width = Math.floor(W * s) + 'px'; st.style.height = h + 'px';
  st.classList.toggle('below', b.clientHeight - h >= 56 && b.clientHeight > b.clientWidth * .8);   // hochkant mit Platz: Meldungen unter dem Bild statt darauf
  st.style.setProperty('--below', Math.max(0, b.clientHeight - h - 10) + 'px');
}
fitStage();
addEventListener('resize', fitStage);
try { new ResizeObserver(fitStage).observe(document.getElementById('stageBox')); } catch(e){}
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const OUT = '#16120f';               // Konturfarbe für Figuren und Bauten
const RM = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } })();

function rng(seed){ seed = (seed >>> 0) || 1; return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.random() * arr.length | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function canvasOf(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }

/* Pixel-Sprite aus Zeichen-Rastern. Zeichen ohne Farbe in pal bleiben leer (für Leucht-Ebenen). */
function makeSprite(rows, pal, outline, pad){
  const h = rows.length, w = rows[0].length;
  if (pad === undefined) pad = outline ? 1 : 0;
  const c = canvasOf(w + pad * 2, h + pad * 2), g = c.getContext('2d');
  const solid = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== '.';
  if (outline){
    g.fillStyle = outline;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++){
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) g.fillRect(x + pad, y + pad, 1, 1);
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const col = pal[rows[y][x]];
    if (rows[y][x] === '.' || !col) continue;
    g.fillStyle = col; g.fillRect(x + pad, y + pad, 1, 1);
  }
  return c;
}
function flipped(src){
  const c = canvasOf(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c;
}
function whiteOf(src){
  const c = canvasOf(src.width, src.height), g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); return c;
}
/* Kontur in leere Nachbarpixel zeichnen, ohne die Größe zu ändern */
function addOutline(src, color){
  const w = src.width, h = src.height, c = canvasOf(w, h), g = c.getContext('2d');
  const d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  g.fillStyle = color || OUT;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) g.fillRect(x, y, 1, 1);
  g.drawImage(src, 0, 0); return c;
}
/* Pixelbild verdoppeln (Scale2x/EPX): schräge Kanten werden geglättet, gerade bleiben scharf */
function scale2x(src){
  const w = src.width, h = src.height, sd = new Uint32Array(src.getContext('2d').getImageData(0, 0, w, h).data.buffer);
  const c = canvasOf(w * 2, h * 2), g = c.getContext('2d'), id = g.createImageData(w * 2, h * 2), od = new Uint32Array(id.data.buffer), W2 = w * 2;
  const at = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? 0 : sd[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const P = sd[y * w + x], A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1), o = 2 * y * W2 + 2 * x;
    od[o] = C === A && C !== D && A !== B ? A : P;
    od[o + 1] = A === B && A !== C && B !== D ? B : P;
    od[o + W2] = D === C && D !== B && C !== A ? C : P;
    od[o + W2 + 1] = B === D && B !== A && D !== C ? D : P;
  }
  g.putImageData(id, 0, 0); return c;
}
/* Ein Bild (Frame): Grafik, optionale Leuchtebene, weiße Silhouette für Treffer */
function spriteOf(img, glow){ return { img, glow: glow || null, white: whiteOf(img) }; }
function S(rows, pal, outline, glowPal){
  const img = makeSprite(rows, pal, outline);
  return spriteOf(img, glowPal ? makeSprite(rows, glowPal, null, outline ? 1 : 0) : null);
}
const flipS = s => ({ img: flipped(s.img), glow: s.glow && flipped(s.glow), white: flipped(s.white) });
const facing = frames => ({ r: frames, l: frames.map(flipS) });

/* Drehung ohne Glättung: jedes Zielpixel nimmt das nächste Quellpixel (bleibt pixelscharf).
   Dreht src um den Punkt (px, py); liefert { img, ox, oy } mit der Lage des Drehpunkts im Ergebnis. */
function rotateNN(src, angle, px, py){
  const w = src.width, h = src.height, c = Math.cos(angle), s = Math.sin(angle);
  const pts = [[-px, -py], [w - px, -py], [-px, h - py], [w - px, h - py]].map(([x, y]) => [x * c - y * s, x * s + y * c]);
  const minX = Math.floor(Math.min(...pts.map(p => p[0]))), maxX = Math.ceil(Math.max(...pts.map(p => p[0])));
  const minY = Math.floor(Math.min(...pts.map(p => p[1]))), maxY = Math.ceil(Math.max(...pts.map(p => p[1])));
  const ow = maxX - minX + 1, oh = maxY - minY + 1, out = canvasOf(ow, oh), og = out.getContext('2d');
  const sd = src.getContext('2d').getImageData(0, 0, w, h).data, od = og.createImageData(ow, oh);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++){
    const dx = x + minX + .5, dy = y + minY + .5;
    const sx = Math.floor(dx * c + dy * s + px), sy = Math.floor(-dx * s + dy * c + py);
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
    const si = (sy * w + sx) * 4, oi = (y * ow + x) * 4;
    od.data[oi] = sd[si]; od.data[oi + 1] = sd[si + 1]; od.data[oi + 2] = sd[si + 2]; od.data[oi + 3] = sd[si + 3];
  }
  og.putImageData(od, 0, 0);
  return { img: out, ox: -minX, oy: -minY };
}

/* Wertrauschen 0..1, weich interpoliert, deterministisch je seed */
function noise2(seed){
  const R = rng(seed), P = new Uint8Array(512), V = new Float32Array(256);
  for (let i = 0; i < 256; i++){ P[i] = i; V[i] = R(); }
  for (let i = 255; i > 0; i--){ const j = R() * (i + 1) | 0; const t = P[i]; P[i] = P[j]; P[j] = t; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
    const a = V[P[P[X] + Y]], b = V[P[P[X + 1] + Y]], c = V[P[P[X] + Y + 1]], d = V[P[P[X + 1] + Y + 1]];
    const u = sm(xf), v = sm(yf);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  };
}
/* Mehrere Oktaven */
function fbm(n, x, y, oct){ let s = 0, a = .5, f = 1, t = 0; for (let i = 0; i < (oct || 3); i++){ s += n(x * f, y * f) * a; t += a; a *= .5; f *= 2; } return s / t; }
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x, y) => BAYER4[(y & 3) * 4 + (x & 3)] / 16;
/* Farbe aus einer Farbrampe (dunkel..hell) für Wert v 0..1 mit geordnetem Dithering */
function ramp(colors, v, x, y){ const n = colors.length; return colors[clamp(Math.floor(v * (n - 1) + dither(x, y)), 0, n - 1)]; }


/* Ordenshaus und Ruhm des Landes (siehe 20-post-markt-speyer): heroStats liest das schon, bevor jenes Modul geladen ist */
var ASV = { ord: 0, glory: false };
