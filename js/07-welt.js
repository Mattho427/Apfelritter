"use strict";
/* Der Apfelritter, Teil 7 von 25: Die Welt: Gebiete, Gewässer, Wege, Höhen, Kollision, Platzierung.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Die Welt: das Reichsland 6144 × 4608, im Süden das Bergland (Gelände, Gebiete, Fluss, Wege, Platzierung, Kollision, Karten) ============ */
const wo_T0 = performance.now();
const wo_CW = WW >> 3, wo_CH = WH >> 3;                // Kollisionsraster, 8 px
const wo_GW = (WW >> 2) + 2, wo_GH = (WH >> 2) + 2;     // Feldraster, 4 px (Wasser, Wege)
const wo_ZW = WW >> 4, wo_ZH = WH >> 4;                // Gebietsraster, 16 px

/* ---------- Zufall, Farben, Rauschen ---------- */
let wo_FINE = 0;   // beim Bodenrechnen im Feinraster: Bruchteil-Koordinaten bekommen eigenes Rauschen
function wo_h(x, y, s){
  if (wo_FINE && (x !== (x | 0) || y !== (y | 0))){ x = Math.floor(x * WS) + 7919; y = Math.floor(y * WS) + 104729; }
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const wo_pk = (r, g, b) => ((255 << 24) | (clamp(b | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(r | 0, 0, 255)) >>> 0;
const wo_c = hex => wo_pk(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
function wo_mix(a, b, t){
  return wo_pk((a & 255) + ((b & 255) - (a & 255)) * t, ((a >>> 8) & 255) + (((b >>> 8) & 255) - ((a >>> 8) & 255)) * t,
    ((a >>> 16) & 255) + (((b >>> 16) & 255) - ((a >>> 16) & 255)) * t);
}
/* n Töne aus Stützfarben (dunkel..hell) */
function wo_ramp(keys, n){
  const K = keys.map(wo_c), out = new Uint32Array(n || 12), m = out.length;
  for (let i = 0; i < m; i++){ const t = i / (m - 1) * (K.length - 1), k = Math.min(K.length - 2, t | 0); out[i] = wo_mix(K[k], K[k + 1], t - k); }
  return out;
}
const wo_hex = c => '#' + [c & 255, (c >>> 8) & 255, (c >>> 16) & 255].map(v => v.toString(16).padStart(2, '0')).join('');
/* kachelbares Wertrauschen 256 × 256, auf 0..1 gestreckt */
function wo_tile(seed, cells, oct){
  const S = 256, T = new Float32Array(S * S); let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++){
    const p = cells << o, R = rng(seed * 7 + o * 131), A = new Float32Array(p * p), cs = S / p;
    for (let i = 0; i < p * p; i++) A[i] = R();
    for (let y = 0; y < S; y++){
      const gy = y / cs, yi = gy | 0, fy = gy - yi, v = fy * fy * (3 - 2 * fy), y0 = (yi % p) * p, y1 = ((yi + 1) % p) * p;
      for (let x = 0; x < S; x++){
        const gx = x / cs, xi = gx | 0, fx = gx - xi, u = fx * fx * (3 - 2 * fx), x0 = xi % p, x1 = (xi + 1) % p;
        const a = A[y0 + x0], b = A[y0 + x1], c = A[y1 + x0], d = A[y1 + x1];
        T[y * S + x] += (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * amp;
      }
    }
    tot += amp; amp *= .5;
  }
  let mn = 1e9, mx = -1e9;
  for (let i = 0; i < T.length; i++){ if (T[i] < mn) mn = T[i]; if (T[i] > mx) mx = T[i]; }
  for (let i = 0; i < T.length; i++) T[i] = (T[i] - mn) / (mx - mn);
  return T;
}
const wo_NA = wo_tile(3, 4, 4);    // grob
const wo_NB = wo_tile(5, 16, 3);   // fein (Periode 256 px)
function wo_nbl(T, x, y){
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const x0 = xi & 255, x1 = (xi + 1) & 255, y0 = (yi & 255) << 8, y1 = ((yi + 1) & 255) << 8;
  const a = T[y0 + x0], b = T[y0 + x1], c = T[y1 + x0], d = T[y1 + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const wo_lo = (x, y) => wo_nbl(wo_NA, x * .0625, y * .0625);     // Flecken ~1000 px
const wo_mid = (x, y) => wo_nbl(wo_NA, x * .25 + 77, y * .25 + 31); // Flecken ~250 px
const wo_fin = (x, y) => wo_NB[((y | 0) & 255) * 256 + ((x | 0) & 255)];
/* Catmull-Rom: Stützpunkte [x, y, w] → dichte Punktfolge */
function wo_spline(pts, step){
  const out = [], n = pts.length;
  for (let i = 0; i < n - 1; i++){
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), m = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < m; k++){
      const t = k / m, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), (p1[2] || 0) + ((p2[2] || 0) - (p1[2] || 0)) * t]);
    }
  }
  out.push(pts[n - 1].slice());
  return out;
}

/* ============ Gebiete ============ */
const ZONES = [
  { id: 'obstgarten', name: 'Die Obstgärten', monsters: ['wieder', 'pluend'], label: { x: 1660, y: 1150 } },
  { id: 'burg', name: 'Die Reichsburg', monsters: ['pluend', 'armbrust'], label: { x: 1900, y: 110 } },
  { id: 'stadt', name: 'Die Reichsstadt', monsters: ['ratte', 'pluend', 'armbrust'], label: { x: 2966, y: 2440 } },
  { id: 'dorf', name: 'Das verbrannte Dorf', monsters: ['ratte', 'pluend'], label: { x: 1760, y: 2330 } },
  { id: 'wald', name: 'Der Finsterwald', monsters: ['werwolf', 'armbrust', 'rabe'], label: { x: 640, y: 560 } },
  { id: 'moor', name: 'Das Moor', monsters: ['moor', 'irrlicht'], label: { x: 420, y: 2640 } },
  { id: 'friedhof', name: 'Der Klosterfriedhof', monsters: ['wieder', 'rabe'], label: { x: 1700, y: 2960 } },
  { id: 'galgen', name: 'Der Galgenberg', monsters: ['rabe', 'wieder'], label: { x: 3780, y: 1110 } },
  { id: 'schlachtfeld', name: 'Das alte Schlachtfeld', monsters: ['wieder', 'rabe', 'pluend'], label: { x: 3760, y: 2560 } },
  { id: 'lager', name: 'Das Landsknechtslager', monsters: ['pluend', 'armbrust'], label: { x: 2990, y: 1020 } },
  { id: 'ruine', name: 'Die Raubritterburg', monsters: ['pluend', 'armbrust'], label: { x: 3540, y: 170 } },
  { id: 'fluss', name: 'Die Flussaue', monsters: ['ratte', 'moor'], label: { x: 2280, y: 1760 } },
  { id: 'weiler', name: 'Das Dorf Lindach', monsters: [], label: { x: 2520, y: 846 } },
  { id: 'speyer', name: 'Die Reichsstadt Speyer', monsters: [], label: { x: 5100, y: 1100 } },
  { id: 'fischerdorf', name: 'Das Fischerdorf Altrip', monsters: [], label: { x: 4430, y: 1500 } },
  { id: 'weinberge', name: 'Die Weinberge', monsters: ['pluend', 'armbrust'], label: { x: 5200, y: 560 } },
  { id: 'auwald', name: 'Der Auwald', monsters: ['nix', 'werwolf'], label: { x: 5120, y: 2440 } },
  { id: 'piratennest', name: 'Das Piratennest', monsters: ['pirat', 'pschuetze'], label: { x: 5700, y: 1720 } },
  // Das Bergland im Süden (Version 25)
  { id: 'schwarzwald', name: 'Der Schwarzwald', monsters: ['wolf', 'schrat', 'wegelagerer'], label: { x: 1180, y: 3960 } },
  { id: 'annaberg', name: 'Die Bergstadt Annaberg', monsters: [], label: { x: 2900, y: 3300 } },
  { id: 'silberrevier', name: 'Das Silberrevier', monsters: ['kobold', 'grubengeist', 'wegelagerer'], label: { x: 2420, y: 4200 } },
  { id: 'schanze', name: 'Die Söldnerschanze', monsters: ['doppelsoeldner', 'hakenschuetze'], label: { x: 4400, y: 3330 } },
  { id: 'hochgebirge', name: 'Das Hochgebirge', monsters: ['baer', 'geier', 'eislicht'], label: { x: 4700, y: 4400 } },
  // Die Ostlande (Version 26): Sachsen im Norden, Franken in der Mitte, Schwaben im Süden
  { id: 'wittenberg', name: 'Wittenberg an der Elbe', monsters: [], label: { x: 7920, y: 270 } },
  { id: 'heide', name: 'Die Dübener Heide', monsters: ['kreuzotter', 'strauchdieb', 'irrwisch'], label: { x: 7300, y: 1230 } },
  { id: 'nuernberg', name: 'Die Reichsstadt Nürnberg', monsters: [], label: { x: 7740, y: 1960 } },
  { id: 'reichswald', name: 'Der Reichswald', monsters: ['keiler', 'moosweib', 'strauchdieb'], label: { x: 8300, y: 2920 } },
  { id: 'gailingen', name: 'Burg Gailingen', monsters: ['reisiger', 'armbrust', 'strauchdieb'], label: { x: 8650, y: 1760 } },
  { id: 'donauried', name: 'Das Donauried', monsters: ['riesenkrebs', 'moor', 'irrwisch'], label: { x: 6720, y: 3300 } },
  { id: 'augsburg', name: 'Die Reichsstadt Augsburg', monsters: [], label: { x: 7430, y: 3440 } },
  { id: 'lechfeld', name: 'Das Lechfeld', monsters: ['geisterreiter', 'geisterbogner', 'wieder'], label: { x: 7400, y: 4300 } }
];
const wo_ZI = {}; ZONES.forEach((z, i) => { wo_ZI[z.id] = i; });
/* Gebietskerne: Ellipsen [cx, cy, rx, ry] */
const wo_ZELL = {
  obstgarten: [[1900, 1290, 560, 400]], burg: [[1900, 470, 600, 430]],
  wald: [[600, 980, 760, 1060], [300, 1760, 420, 330]], ruine: [[3420, 400, 720, 470]],
  lager: [[2990, 1270, 400, 360]], galgen: [[3800, 1250, 360, 420]], dorf: [[1700, 2340, 560, 330]],
  friedhof: [[1620, 2880, 640, 240]], moor: [[480, 2660, 640, 560]],
  schlachtfeld: [[3780, 2560, 420, 640], [3150, 2930, 520, 230]], stadt: [[2966, 2310, 470, 380]], weiler: [[2444, 570, 190, 220]],
  speyer: [[5100, 1390, 400, 330]], fischerdorf: [[4440, 1600, 230, 170]], weinberge: [[5150, 640, 760, 520], [5900, 1000, 360, 520]],
  auwald: [[5000, 2420, 920, 640], [5900, 2400, 400, 700], [4450, 2700, 380, 380]], piratennest: [[5700, 1780, 380, 120]],
  schwarzwald: [[880, 3840, 980, 720], [300, 3320, 420, 300]], annaberg: [[2900, 3550, 330, 260]],
  silberrevier: [[2350, 4170, 760, 420], [3500, 4320, 520, 300], [3330, 3900, 300, 200]],
  schanze: [[4450, 3500, 640, 420], [3960, 3260, 280, 220]],
  hochgebirge: [[5350, 4160, 900, 600], [4300, 4440, 480, 220], [5950, 3520, 300, 420], [6560, 4440, 420, 200], [8820, 4300, 520, 360], [9060, 3760, 260, 300]],
  wittenberg: [[7920, 490, 560, 250]],
  heide: [[6980, 1180, 700, 300], [8300, 1250, 760, 300], [6480, 640, 300, 320], [8850, 430, 520, 330], [7000, 260, 420, 220], [6600, 1180, 300, 260]],
  nuernberg: [[7740, 2390, 580, 400], [7040, 2120, 300, 240]],
  reichswald: [[8560, 2560, 700, 380], [7650, 2960, 720, 200], [6560, 2240, 340, 480], [8980, 2160, 300, 300], [6560, 2780, 280, 200]],
  gailingen: [[8650, 1910, 470, 240]],
  donauried: [[6800, 3150, 520, 300], [8520, 3170, 700, 190]],
  augsburg: [[7430, 3740, 420, 300]],
  lechfeld: [[7420, 4290, 520, 320], [8300, 3720, 380, 420], [6620, 3760, 380, 360]]
};
/* Bergstadt Annaberg: Mauerring mit Nord- und Südtor, Durchlässe im Westen und Osten */
const wo_ANNA = { x0: 2630, x1: 3170, y0: 3340, y1: 3760, gx: 2900, gy: 3550 };
/* Speyer: Mauerring mit Nord- und Hafentor, davor der Kai am Strom */
const wo_SPY = { x0: 4714, x1: 5486, y0: 1170, y1: 1580, gx: 5100, quay: 1640 };
/* Stadtmauer (Fußlinien) und Burgring */
const wo_CITY = { x0: 2580, x1: 3352, y0: 2000, y1: 2620, gx: 2966 };
const wo_TJ = { x: 3540, y: 2214 };   // Turnierwiese östlich der Stadt: Mitte der Schranke
const wo_CAST = { x0: 1626, x1: 2174, y0: 300, y1: 640, gx: 1900 };
/* Städte der Ostlande (x1 ergibt sich aus der Mauerreihe beim Bauen; hier der Plan) */
const wo_WIT = { x0: 7500, x1: 8400, y0: 300, y1: 720, gx: 7950, gy: 510 };
const wo_NUE = { x0: 7238, x1: 8242, y0: 2050, y1: 2730, gx: 7740, gy: 2230, gy2: 2580 };
const wo_AUG = { x0: 7108, x1: 7752, y0: 3520, y1: 4000, gx: 7430, gy: 3740 };

/* ============ Gewässer ============ */
/* Fluss von Ost nach West: x, y, halbe Breite */
const wo_RIVER = wo_spline([
  [9300, 1700, 36], [9000, 1690, 36], [8700, 1676, 37], [8400, 1660, 38], [8100, 1646, 38], [7800, 1630, 39], [7500, 1612, 40], [7200, 1590, 41], [6900, 1566, 42], [6600, 1540, 43],
  [6300, 1520, 44], [6160, 1540, 44], [6040, 1566, 44], [5920, 1600, 43], [5800, 1630, 42], [5680, 1650, 42], [5560, 1672, 41], [5440, 1700, 40],
  [5320, 1722, 40], [5200, 1734, 40], [5080, 1738, 39], [4960, 1736, 38], [4840, 1730, 37], [4720, 1724, 36], [4600, 1720, 35], [4460, 1716, 35], [4320, 1716, 34],
  [4180, 1716, 34], [4000, 1724, 34], [3860, 1732, 33], [3780, 1736, 33], [3700, 1748, 33], [3600, 1778, 33], [3480, 1826, 32],
  [3340, 1862, 32], [3200, 1878, 32], [3080, 1884, 31], [2966, 1886, 31], [2860, 1884, 31], [2760, 1872, 30], [2640, 1856, 30],
  [2540, 1848, 30], [2420, 1846, 30], [2300, 1852, 30], [2160, 1870, 30], [2040, 1886, 30], [1940, 1896, 30], [1880, 1900, 30],
  [1810, 1906, 30], [1700, 1928, 31], [1580, 1968, 31], [1460, 2016, 31], [1340, 2058, 32], [1220, 2086, 32], [1100, 2100, 32],
  [960, 2110, 33], [860, 2116, 33], [780, 2122, 33], [700, 2146, 34], [600, 2190, 35], [480, 2240, 37], [340, 2290, 38],
  [200, 2318, 40], [60, 2334, 40], [-80, 2342, 40]], 8);
/* Altarm des Stroms: zweigt oberhalb von Speyer ab und umschließt die Insel mit dem Piratennest */
const wo_ARM = wo_spline([[6060, 1580, 28], [5990, 1660, 28], [5930, 1760, 27], [5850, 1840, 27], [5740, 1890, 27], [5620, 1904, 27], [5500, 1880, 27], [5400, 1820, 27],
  [5330, 1752, 28], [5300, 1724, 30]], 8);
/* y einer Flusslinie bei x (Strom und Altarm laufen dort von Ost nach West) */
function wo_yAt(L, x){
  for (let k = 0; k < L.length - 1; k++){
    const a = L[k], b = L[k + 1];
    if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
  }
  return null;
}
/* liegt der Punkt auf der Insel zwischen Strom und Altarm? */
function wo_onIsle(x, y){
  if (x < 5330 || x > 6050) return false;
  const a = wo_yAt(wo_RIVER, x), b = wo_yAt(wo_ARM, x);
  return a !== null && b !== null && y > a && y < b;
}
/* Silberbach: entspringt im Quellsee unter dem Hochgebirge und fließt nach Westen durch Revier und Schwarzwald */
const wo_SBACH = wo_spline([[4880, 4034, 9], [4760, 4060, 10], [4600, 4120, 11], [4440, 4170, 12], [4300, 4184, 12], [4140, 4176, 13], [4000, 4160, 13], [3840, 4120, 14],
  [3700, 4080, 14], [3540, 4036, 15], [3400, 4000, 15], [3260, 3972, 16], [3140, 3962, 16], [3020, 3972, 16], [2900, 3990, 17], [2780, 4024, 17], [2650, 4060, 17],
  [2520, 4096, 18], [2400, 4118, 18], [2260, 4116, 18], [2100, 4098, 19], [1950, 4066, 19], [1800, 4042, 19], [1650, 4048, 20], [1500, 4064, 20], [1350, 4100, 20],
  [1200, 4140, 21], [1050, 4176, 21], [900, 4200, 21], [750, 4214, 22], [600, 4224, 22], [450, 4240, 22], [300, 4258, 22], [150, 4270, 22], [-80, 4284, 22]], 8);
/* Ostlande: die Elbe bei Wittenberg (kommt von Osten, biegt nach Norden ab), die Pegnitz durch Nürnberg in den Main,
   die Donau (Quelle unter dem Hochgebirge) und der Lech, der von den Alpen an Augsburg vorbei in die Donau fließt */
const wo_ELBE = wo_spline([[9300, 1040, 38], [9000, 1000, 38], [8700, 950, 38], [8400, 890, 38], [8150, 852, 37], [7950, 842, 37], [7700, 846, 36], [7450, 830, 36],
  [7200, 770, 35], [7000, 680, 34], [6860, 560, 34], [6760, 400, 33], [6710, 200, 33], [6690, -80, 33]], 8);
const wo_PEG = wo_spline([[9300, 2230, 14], [9000, 2262, 15], [8700, 2300, 15], [8450, 2350, 16], [8240, 2392, 16], [8000, 2402, 16], [7740, 2402, 16], [7480, 2398, 17],
  [7240, 2392, 17], [7060, 2350, 18], [6930, 2250, 18], [6870, 2090, 19], [6840, 1910, 19], [6820, 1730, 20], [6810, 1590, 21]], 8);
const wo_DON = wo_spline([[6390, 3034, 10], [6550, 3052, 15], [6750, 3080, 20], [7000, 3100, 24], [7300, 3112, 28], [7600, 3118, 32], [7900, 3120, 36], [8200, 3112, 38],
  [8500, 3122, 40], [8800, 3140, 40], [9100, 3160, 40], [9300, 3170, 40]], 8);
const wo_LECH = wo_spline([[8020, 4700, 24], [7990, 4450, 24], [7930, 4200, 25], [7880, 3950, 25], [7862, 3700, 26], [7842, 3450, 26], [7804, 3250, 27], [7784, 3110, 28]], 8);
/* Mühlbach vom Mühlteich zum Fluss */
const wo_BACH = wo_spline([[2556, 1190, 7], [2550, 1260, 8], [2542, 1340, 9], [2536, 1420, 9], [2531, 1500, 10], [2529, 1580, 10],
  [2531, 1660, 10], [2536, 1740, 11], [2542, 1820, 12], [2546, 1866, 14]], 8);
/* Teiche: x, y, rx, ry, Art (2 klar, 3 Moor) */
const wo_PONDS = [
  [2560, 1156, 72, 40, 2], [1190, 2962, 64, 26, 2], [330, 640, 58, 30, 2],
  [440, 2790, 126, 64, 3], [240, 2560, 64, 30, 3], [770, 2530, 52, 26, 3], [890, 2800, 46, 22, 3], [300, 2960, 86, 34, 3],
  [680, 2950, 58, 28, 3], [140, 2730, 40, 26, 3], [1020, 2930, 30, 18, 3], [560, 2440, 36, 18, 3], [990, 2700, 34, 18, 3],
  [110, 2440, 44, 20, 3], [620, 2600, 30, 16, 3], [370, 2650, 26, 14, 3], [190, 2880, 30, 16, 3], [860, 2980, 40, 18, 3],
  [520, 3020, 50, 20, 3], [60, 2600, 30, 40, 3],
  // Altwasser im Auwald
  [4700, 2300, 74, 30, 2], [5320, 2520, 96, 36, 2], [5660, 2330, 62, 26, 2], [4900, 2720, 84, 30, 2], [5940, 2720, 72, 34, 3], [4380, 2180, 50, 22, 2], [5600, 2860, 60, 24, 3],
  // Bergland: Quellsee des Silberbachs, Bergseen, ein Weiher im Schwarzwald
  [4960, 4022, 92, 44, 2], [5640, 4470, 76, 34, 2], [6020, 3820, 58, 30, 2], [1480, 4420, 64, 30, 2], [640, 3480, 48, 24, 2], [3560, 4420, 44, 22, 2],
  // Ostlande: Donauquelle, Heideweiher, Tümpel im Donauried, Weiher im Reichswald, Bergsee in den Alpen
  [6372, 3026, 44, 24, 2], [7560, 1300, 52, 24, 2], [8620, 1130, 46, 22, 2], [6950, 980, 40, 20, 3],
  [6600, 3240, 60, 26, 3], [6920, 3290, 44, 20, 3], [7120, 3230, 50, 22, 3], [6460, 3180, 36, 18, 3], [8400, 3240, 56, 22, 3], [8760, 3250, 44, 20, 3], [6760, 3360, 34, 16, 3],
  [8760, 2700, 58, 26, 2], [7260, 2940, 40, 20, 2], [8860, 4260, 70, 32, 2]
];
/* Torfstiche: Rechtecke voll Moorwasser */
const wo_PEAT = [[800, 2858, 848, 2874], [812, 2884, 852, 2898], [250, 2470, 304, 2484], [700, 3010, 762, 3026], [960, 2830, 1000, 2846], [380, 2878, 430, 2892]];

const wo_WSD = new Float32Array(wo_GW * wo_GH).fill(120);   // Abstand zum Ufer (negativ = Wasser)
const wo_WT = new Uint8Array(wo_GW * wo_GH);                 // 1 Fluss, 2 Teich, 3 Moor, 4 Bach
function wo_bil(G, x, y){
  const gx = x * .25, gy = y * .25, xi = gx | 0, yi = gy | 0, fx = gx - xi, fy = gy - yi, i = yi * wo_GW + xi;
  const a = G[i], b = G[i + 1], c = G[i + wo_GW], d = G[i + wo_GW + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const wo_gidx = (x, y) => (clamp(Math.round(y * .25), 0, wo_GH - 1)) * wo_GW + clamp(Math.round(x * .25), 0, wo_GW - 1);
/* Strecke in ein Abstandsfeld stempeln: s = Abstand − Halbbreite − Uferwelle. Die Uferwelle ist höchstens 6,5 px groß: Wo schon ein
   näheres Stück die Zelle um mehr unterbietet, wird sie gar nicht erst berechnet (gleiches Ergebnis, viel schneller). */
function wo_stamp(G, D, T, typ, pts, m, wob){
  const wmax = wob ? 7 : 0;
  for (let k = 0; k < pts.length - 1; k++){
    const [x0, y0, w0] = pts[k], [x1, y1, w1] = pts[k + 1], wm = Math.max(w0, w1) + m;
    const gx0 = Math.max(0, Math.floor((Math.min(x0, x1) - wm) / 4)), gx1 = Math.min(wo_GW - 1, Math.ceil((Math.max(x0, x1) + wm) / 4));
    const gy0 = Math.max(0, Math.floor((Math.min(y0, y1) - wm) / 4)), gy1 = Math.min(wo_GH - 1, Math.ceil((Math.max(y0, y1) + wm) / 4));
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++){
      const px = gx * 4, py = gy * 4;
      let t = ((px - x0) * dx + (py - y0) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = x0 + dx * t - px, qy = y0 + dy * t - py, d = Math.sqrt(qx * qx + qy * qy), i = gy * wo_GW + gx, s0 = d - (w0 + (w1 - w0) * t);
      if (s0 - wmax >= G[i]) continue;
      const s = wob ? s0 - wob(px, py) : s0;
      if (s < G[i]){ G[i] = s; if (D) D[i] = d; if (T) T[i] = typ; }
    }
  }
}
function wo_stampEll(G, T, typ, cx, cy, rx, ry, m, wob){
  const gx0 = Math.max(0, Math.floor((cx - rx - m) / 4)), gx1 = Math.min(wo_GW - 1, Math.ceil((cx + rx + m) / 4));
  const gy0 = Math.max(0, Math.floor((cy - ry - m) / 4)), gy1 = Math.min(wo_GH - 1, Math.ceil((cy + ry + m) / 4));
  const rr = Math.min(rx, ry);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++){
    const px = gx * 4, py = gy * 4, q = Math.sqrt(((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2);
    const s = (q - 1) * rr - (wob ? wob(px, py) : 0), i = gy * wo_GW + gx;
    if (s < G[i]){ G[i] = s; T[i] = typ; }
  }
}
function wo_stampRect(G, T, typ, x0, y0, x1, y1, m){
  for (let gy = Math.max(0, Math.floor((y0 - m) / 4)); gy <= Math.min(wo_GH - 1, Math.ceil((y1 + m) / 4)); gy++)
    for (let gx = Math.max(0, Math.floor((x0 - m) / 4)); gx <= Math.min(wo_GW - 1, Math.ceil((x1 + m) / 4)); gx++){
      const px = gx * 4, py = gy * 4, dx = Math.max(x0 - px, px - x1), dy = Math.max(y0 - py, py - y1);
      const s = dx > 0 || dy > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) : Math.max(dx, dy), i = gy * wo_GW + gx;
      if (s < G[i]){ G[i] = s; T[i] = typ; }
    }
}
const wo_bankWob = (x, y) => (wo_mid(x, y) - .5) * 9 + (wo_fin(x * .5, y * .5) - .5) * 4;
wo_stamp(wo_WSD, null, wo_WT, 1, wo_RIVER, 120, wo_bankWob);
wo_stamp(wo_WSD, null, wo_WT, 1, wo_ARM, 90, wo_bankWob);
wo_stamp(wo_WSD, null, wo_WT, 4, wo_BACH, 60, (x, y) => (wo_fin(x * .5, y * .5) - .5) * 3);
wo_stamp(wo_WSD, null, wo_WT, 1, wo_SBACH, 60, (x, y) => (wo_mid(x, y) - .5) * 5 + (wo_fin(x * .5, y * .5) - .5) * 3);
for (const L of [wo_ELBE, wo_DON, wo_LECH]) wo_stamp(wo_WSD, null, wo_WT, 1, L, 100, wo_bankWob);
wo_stamp(wo_WSD, null, wo_WT, 1, wo_PEG, 60, (x, y) => (wo_mid(x, y) - .5) * 4 + (wo_fin(x * .5, y * .5) - .5) * 3);
for (const [x, y, rx, ry, t] of wo_PONDS) wo_stampEll(wo_WSD, wo_WT, t, x, y, rx, ry, 40, (px, py) => (wo_mid(px * 3, py * 3) - .5) * Math.min(rx, ry) * .55);
for (const [x0, y0, x1, y1] of wo_PEAT) wo_stampRect(wo_WSD, wo_WT, 3, x0, y0, x1, y1, 16);
const wo_wsd = (x, y) => (x < 0 || y < 0 || x >= WW || y >= WH) ? 99 : wo_bil(wo_WSD, x, y);

/* ============ Wege ============ */
/* t: 0 Fahrweg, 1 Pfad, 2 Bohlenweg, 3 Pflaster */
const wo_ROADS = [
  { t: 3, hw: 12, p: [[1900, 330], [1900, 470], [1900, 560], [1900, 652]] },                                   // Burghof
  { t: 0, hw: 11, p: [[1900, 640], [1904, 700], [1940, 744], [1970, 790], [1946, 836], [1890, 874], [1860, 930], [1876, 1010], [1898, 1100], [1900, 1200], [1900, 1310]] }, // Burgweg
  { t: 0, hw: 11, p: [[1900, 1310], [1894, 1450], [1886, 1600], [1882, 1760], [1880, 1850], [1880, 1960], [1866, 2060], [1820, 2160], [1770, 2250], [1740, 2380], [1720, 2520], [1712, 2660], [1700, 2760]] }, // Südweg
  { t: 0, hw: 12, p: [[-20, 1470], [200, 1452], [420, 1420], [650, 1380], [900, 1350], [1150, 1330], [1400, 1318], [1650, 1310], [1900, 1310], [2150, 1330], [2350, 1372], [2470, 1400], [2540, 1404], [2620, 1404], [2760, 1384], [2950, 1340], [3150, 1316], [3350, 1312], [3550, 1322], [3760, 1356], [3950, 1372], [4120, 1378], [4290, 1396], [4450, 1440], [4590, 1520], [4720, 1596], [4860, 1632], [5000, 1642], [5100, 1644]] }, // Reichsstraße
  { t: 0, hw: 12, p: [[2760, 1384], [2830, 1480], [2900, 1600], [2950, 1720], [2966, 1800], [2966, 1880], [2966, 1990]] }, // zur Steinbrücke
  { t: 3, hw: 20, p: [[2966, 1960], [2966, 2100], [2966, 2230]] },                                             // Hauptgasse Nord
  { t: 3, hw: 20, p: [[2966, 2390], [2966, 2520], [2966, 2650]] },                                             // Hauptgasse Süd
  { t: 3, hw: 15, p: [[2600, 2136], [2800, 2132], [2966, 2130], [3140, 2134], [3330, 2136]] },                 // Obere Gasse
  { t: 3, hw: 16, p: [[2600, 2362], [2840, 2360], [3090, 2362], [3340, 2364], [3420, 2366]] },                 // Quergasse zur Bresche
  { t: 0, hw: 11, p: [[2966, 2640], [2950, 2740], [2880, 2830], [2760, 2890], [2560, 2910], [2360, 2900], [2200, 2860], [2190, 2800]] }, // Südtor zum Friedhof
  { t: 0, hw: 11, p: [[3420, 2366], [3540, 2390], [3640, 2440], [3720, 2520], [3760, 2640], [3740, 2800], [3700, 2960], [3680, 3090]] }, // Ostweg Schlachtfeld
  { t: 0, hw: 10, p: [[3760, 1356], [3770, 1480], [3778, 1600], [3780, 1700], [3780, 1800], [3774, 1920], [3746, 2060], [3720, 2200], [3700, 2340], [3660, 2450]] }, // Ostbrücke
  { t: 1, hw: 7, p: [[3550, 1322], [3600, 1290], [3650, 1262], [3700, 1240], [3720, 1236]] },                  // Galgenpfad
  { t: 0, hw: 10, p: [[2590, 2362], [2470, 2370], [2320, 2350], [2140, 2300], [1960, 2268], [1770, 2250]] },  // Westweg Stadt–Dorf
  { t: 0, hw: 10, p: [[1740, 2380], [1600, 2420], [1430, 2462], [1250, 2516], [1090, 2560], [970, 2592]] },   // Dorf–Moor
  { t: 2, hw: 8, p: [[980, 2590], [900, 2610], [820, 2636], [740, 2668], [680, 2700], [630, 2716]] },         // Bohlenweg
  { t: 1, hw: 8, p: [[650, 1380], [700, 1560], [760, 1760], [800, 1950], [820, 2060], [820, 2190], [840, 2320], [900, 2460], [975, 2580]] }, // Furtweg
  { t: 1, hw: 8, p: [[900, 1350], [820, 1200], [700, 1090], [630, 1000], [570, 860], [490, 700], [420, 520], [380, 300], [350, 40]] }, // Köhlerweg
  { t: 1, hw: 7, p: [[1860, 930], [1700, 900], [1500, 880], [1300, 860], [1080, 860], [860, 930], [700, 1000]] }, // Holzweg
  { t: 0, hw: 10, p: [[1970, 790], [2150, 810], [2350, 800], [2560, 770], [2780, 730], [2980, 690], [3180, 650], [3330, 620], [3430, 600], [3530, 588], [3548, 560]] }, // Ruinenweg
  { t: 1, hw: 7, p: [[1700, 2760], [1640, 2800], [1540, 2826], [1430, 2830], [1300, 2830]] },                 // Klosterpforte
  { t: 1, hw: 7, p: [[1700, 2760], [1780, 2764], [1870, 2808], [1960, 2812], [2100, 2820], [2190, 2810]] },  // Friedhofsweg
  { t: 1, hw: 7, p: [[2440, 1402], [2400, 1470], [2400, 1560], [2450, 1590]] },                                // Mühlweg
  { t: 1, hw: 6, p: [[1880, 1840], [2060, 1820], [2260, 1806], [2440, 1800], [2500, 1790]] },                 // Leinpfad
  { t: 1, hw: 7, p: [[2950, 1340], [2960, 1240], [2990, 1150], [2990, 1090]] },                                // Lagergasse
  { t: 1, hw: 6, p: [[2140, 1324], [2160, 1220], [2180, 1160]] },                                              // zum Obsthof
  { t: 0, hw: 9, p: [[2350, 800], [2392, 736], [2428, 668], [2444, 612]] },                                    // Dorfweg Lindach
  { t: 1, hw: 7, p: [[2290, 590], [2380, 600], [2444, 612], [2520, 604], [2610, 586]] },                      // Dorfgasse
  { t: 3, hw: 16, p: [[4760, 1640], [4900, 1642], [5100, 1644], [5300, 1642], [5470, 1634]] },                 // Kai in Speyer
  { t: 3, hw: 20, p: [[5100, 1620], [5100, 1500], [5100, 1380], [5100, 1260], [5100, 1150]] },                 // Hauptgasse Speyer
  { t: 3, hw: 15, p: [[4740, 1384], [4920, 1382], [5100, 1380], [5280, 1382], [5460, 1384]] },                 // Quergasse Speyer
  { t: 0, hw: 11, p: [[5100, 1160], [5100, 1060], [5130, 940], [5180, 820], [5240, 700], [5290, 570], [5310, 430], [5300, 300]] }, // Weinstraße
  { t: 1, hw: 7, p: [[5240, 700], [5400, 690], [5560, 720], [5720, 800], [5860, 880]] },                       // Wingertpfad Ost
  { t: 1, hw: 7, p: [[5180, 820], [5020, 780], [4860, 730], [4720, 700]] },                                    // Wingertpfad West
  { t: 0, hw: 10, p: [[5000, 1650], [5000, 1690]] },                                                           // zur Schiffbrücke
  { t: 1, hw: 8, p: [[5000, 1780], [5030, 1900], [5090, 2040], [5230, 2140], [5420, 2160], [5600, 2090], [5700, 1990], [5740, 1940]] }, // Auweg zur Insel
  { t: 1, hw: 7, p: [[5740, 1850], [5730, 1810], [5700, 1770]] },                                              // Inselpfad
  { t: 1, hw: 7, p: [[4450, 1440], [4442, 1500], [4436, 1560], [4430, 1620]] },                                // Fischergasse
  { t: 1, hw: 6, p: [[5090, 2040], [4900, 2140], [4700, 2240], [4520, 2380], [4420, 2560]] },                 // Pfad im Auwald
  // Bergland
  { t: 0, hw: 11, p: [[2950, 2740], [2954, 2840], [2952, 2960], [2944, 3080], [2934, 3200], [2916, 3260], [2900, 3330]] },  // Bergstraße nach Annaberg
  { t: 3, hw: 18, p: [[2900, 3310], [2900, 3430], [2900, 3550], [2900, 3670], [2900, 3790]] },                 // Hauptgasse Annaberg
  { t: 3, hw: 14, p: [[2610, 3550], [2760, 3550], [2900, 3550], [3040, 3550], [3190, 3550]] },                 // Quergasse Annaberg
  { t: 0, hw: 11, p: [[2610, 3550], [2480, 3566], [2300, 3600], [2100, 3630], [1900, 3650], [1700, 3672], [1500, 3700], [1300, 3730], [1100, 3760], [900, 3790], [700, 3810], [500, 3830], [300, 3850], [100, 3866], [-20, 3874]] }, // Schwarzwaldstraße
  { t: 1, hw: 8, p: [[1300, 2830], [1270, 2940], [1240, 3060], [1210, 3200], [1180, 3360], [1150, 3520], [1130, 3640], [1110, 3755]] }, // Klosterweg in den Schwarzwald
  { t: 0, hw: 11, p: [[3190, 3550], [3320, 3550], [3500, 3540], [3700, 3520], [3900, 3500], [4100, 3480], [4300, 3470], [4440, 3474]] }, // Oststraße zur Schanze
  { t: 0, hw: 10, p: [[3680, 3090], [3660, 3200], [3620, 3320], [3560, 3440], [3500, 3540]] },                 // vom Schlachtfeld herab
  { t: 1, hw: 7, p: [[4420, 2560], [4440, 2720], [4460, 2900], [4470, 3080], [4460, 3260], [4440, 3420]] },     // Auwald zur Schanze
  { t: 0, hw: 10, p: [[2900, 3790], [2890, 3860], [2878, 3940], [2870, 4040], [2840, 4140], [2760, 4240], [2620, 4320], [2460, 4370], [2300, 4384]] }, // Revierweg
  { t: 1, hw: 7, p: [[2870, 4040], [3000, 4100], [3200, 4180], [3400, 4250], [3600, 4300]] },                 // Pfad zu den Osthalden
  { t: 1, hw: 8, p: [[4440, 3480], [4560, 3600], [4680, 3740], [4800, 3860], [4960, 3906], [5140, 3950], [5320, 4040], [5500, 4130], [5680, 4220]] }, // Passweg ins Hochgebirge
  { t: 1, hw: 7, p: [[600, 3820], [580, 3960], [560, 4100], [548, 4240], [530, 4370]] },                       // Pfad zur Teufelsschlucht
  // Ostlande
  { t: 0, hw: 12, p: [[5860, 880], [6050, 940], [6300, 1000], [6600, 1040], [6900, 1060], [7200, 1050], [7500, 1010], [7750, 960], [7900, 940], [7950, 900], [7950, 840], [7950, 780], [7950, 730]] }, // Hohe Straße nach Wittenberg
  { t: 3, hw: 18, p: [[7950, 290], [7950, 400], [7950, 510], [7950, 620], [7950, 740]] },                     // Hauptgasse Wittenberg
  { t: 3, hw: 15, p: [[7490, 510], [7720, 510], [7950, 510], [8180, 510], [8410, 510]] },                     // Collegienstraße
  { t: 0, hw: 11, p: [[5470, 1634], [5600, 1566], [5800, 1500], [6100, 1452], [6500, 1460], [6800, 1480], [7050, 1490], [7230, 1500], [7300, 1540], [7300, 1600], [7300, 1660], [7310, 1720], [7380, 1800], [7520, 1900], [7660, 1980], [7740, 2030]] }, // Mainstraße nach Nürnberg
  { t: 3, hw: 18, p: [[7740, 2030], [7740, 2230], [7740, 2400], [7740, 2580], [7740, 2750]] },                // Hauptgasse Nürnberg
  { t: 3, hw: 14, p: [[7230, 2230], [7480, 2230], [7740, 2230], [8000, 2230], [8250, 2230]] },                // Sebalder Gasse
  { t: 3, hw: 14, p: [[7300, 2580], [7520, 2580], [7740, 2580], [7960, 2580], [8180, 2580]] },                // Lorenzer Gasse
  { t: 0, hw: 11, p: [[5600, 2090], [5900, 2150], [6200, 2200], [6500, 2244], [6750, 2262], [6900, 2262], [7050, 2262], [7150, 2246], [7230, 2230]] }, // Auweg nach Nürnberg
  { t: 0, hw: 12, p: [[7740, 2740], [7726, 2860], [7700, 2980], [7690, 3050], [7690, 3120], [7690, 3190], [7670, 3280], [7600, 3380], [7480, 3460], [7430, 3510]] }, // Reichsstraße nach Augsburg
  { t: 1, hw: 8, p: [[7750, 3740], [7800, 3712], [7840, 3700], [7880, 3700], [7930, 3700], [8000, 3704], [8200, 3730], [8400, 3770]] },   // über den Lechsteg
  { t: 3, hw: 18, p: [[7430, 3510], [7430, 3620], [7430, 3740], [7430, 3880], [7430, 4010]] },                // Hauptgasse Augsburg
  { t: 3, hw: 14, p: [[7110, 3740], [7270, 3740], [7430, 3740], [7590, 3740], [7750, 3740]] },                // Quergasse Augsburg
  { t: 0, hw: 11, p: [[4450, 3290], [4700, 3240], [5000, 3200], [5300, 3170], [5600, 3170], [5900, 3200], [6200, 3260], [6450, 3380], [6700, 3520], [6900, 3640], [7110, 3740]] }, // Salzstraße von der Schanze nach Augsburg
  { t: 1, hw: 8, p: [[7430, 4010], [7420, 4120], [7404, 4260], [7390, 4420], [7380, 4560]] },                 // Pfad ins Lechfeld
  { t: 1, hw: 8, p: [[7200, 1030], [7150, 1180], [7100, 1330], [7060, 1490]] },                                // Heideweg
  { t: 1, hw: 7, p: [[7420, 1840], [7700, 1820], [8000, 1800], [8300, 1830], [8520, 1880]] },                 // Pfad nach Gailingen
  { t: 1, hw: 7, p: [[7740, 2740], [8000, 2810], [8300, 2850], [8600, 2840], [8900, 2780]] },                 // Pfad in den Reichswald
  { t: 1, hw: 7, p: [[6700, 3520], [6680, 3400], [6640, 3300], [6560, 3200], [6440, 3100]] },                 // Pfad ins Donauried
  { t: 1, hw: 7, p: [[7900, 860], [8200, 900], [8500, 950], [8800, 1000]] }                                    // Elbpfad in die Heide
].map(r => ({ t: r.t, hw: r.hw, p: wo_spline(r.p.map(q => [q[0], q[1], r.hw]), 6) }));
const wo_RSD = new Float32Array(wo_GW * wo_GH).fill(120), wo_RD = new Float32Array(wo_GW * wo_GH).fill(120), wo_RT = new Uint8Array(wo_GW * wo_GH);
for (const r of wo_ROADS) wo_stamp(wo_RSD, wo_RD, wo_RT, r.t, r.p, 26, r.t === 3 ? null : (x, y) => (wo_fin(x, y) - .5) * (r.t === 1 ? 2.6 : 1.6));
const wo_rsd = (x, y) => (x < 0 || y < 0 || x >= WW || y >= WH) ? 99 : wo_bil(wo_RSD, x, y);

/* ============ Höhen und Hangschatten (8 px) ============ */
const wo_HILLS = [ // cx, cy, rx, ry, Höhe, Plateau
  [1900, 470, 440, 340, 1, .62], [3720, 1210, 270, 220, .55, .32], [3540, 440, 360, 290, .95, .55],
  [700, 340, 520, 380, .45, 0], [1180, 1060, 300, 260, .25, 0], [3220, 2960, 420, 200, .22, 0], [3000, 640, 300, 200, .3, 0],
  [5150, 560, 620, 380, .7, .12], [5900, 900, 320, 440, .55, .1], [4700, 560, 300, 260, .35, 0],
  // Bergland: Hochgebirge, Erzberge um Annaberg, Schwarzwaldhöhen
  [5400, 4330, 700, 380, 1.6, .2], [5920, 3900, 360, 440, 1.3, .15], [4700, 4470, 400, 200, 1.1, .1], [6020, 4460, 300, 260, 1.5, .2], [5050, 4560, 300, 140, 1.2, .1],
  [2300, 4300, 540, 280, .7, .1], [3500, 4360, 420, 240, .6, .1], [2900, 3550, 440, 360, .3, .55],
  [820, 4050, 700, 480, .55, 0], [300, 3320, 300, 260, .4, 0], [1500, 3500, 360, 260, .35, 0],
  // Ostlande: Felsen von Gailingen, Fläming, Reichswaldhöhen, Alpen im Südosten
  [8650, 1890, 250, 160, .9, .5], [8600, 80, 520, 160, .3, 0], [8600, 2700, 520, 300, .25, 0], [7600, 1240, 380, 140, .12, 0],
  [8820, 4420, 620, 300, 1.45, .2], [6640, 4530, 480, 170, 1.15, .1], [9060, 3880, 300, 420, 1.15, .2], [8300, 4560, 300, 120, 1.0, .1]
];
function wo_height(x, y){
  let h = (wo_mid(x, y) - .5) * .3 + (wo_lo(x, y) - .5) * .5;
  for (let k = 0; k < wo_HILLS.length; k++){
    const H = wo_HILLS[k], dx = (x - H[0]) / H[2], dy = (y - H[1]) / H[3];
    if (dx > 1 || dx < -1 || dy > 1 || dy < -1) continue;
    const q = Math.sqrt(dx * dx + dy * dy), pl = H[5];
    if (q < 1){ const t = q < pl ? 1 : 1 - (q - pl) / (1 - pl); h += H[4] * t * t * (3 - 2 * t); }
  }
  return h;
}
const wo_SW = wo_CW + 1, wo_SHD = new Float32Array(wo_SW * (wo_CH + 1)), wo_HGT = new Float32Array(wo_SW * (wo_CH + 1));
for (let j = 0; j <= wo_CH; j++) for (let i = 0; i <= wo_CW; i++) wo_HGT[j * wo_SW + i] = wo_height(i * 8, j * 8);
for (let j = 0; j <= wo_CH; j++) for (let i = 0; i <= wo_CW; i++){
  const a = wo_HGT[j * wo_SW + Math.max(0, i - 1)], b = wo_HGT[j * wo_SW + Math.min(wo_CW, i + 1)];
  const c = wo_HGT[Math.max(0, j - 1) * wo_SW + i], d = wo_HGT[Math.min(wo_CH, j + 1) * wo_SW + i];
  wo_SHD[j * wo_SW + i] = clamp(((b - a) + (d - c)) * 30, -2.2, 2.2);   // Licht von oben links
}
function wo_shade(x, y){
  const gx = x * .125, gy = y * .125, xi = gx | 0, yi = gy | 0, fx = gx - xi, fy = gy - yi, i = yi * wo_SW + xi;
  const a = wo_SHD[i], b = wo_SHD[i + 1], c = wo_SHD[i + wo_SW], d = wo_SHD[i + wo_SW + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
function wo_slope(x, y){ const i = (y >> 3) * wo_SW + (x >> 3); return Math.abs(wo_SHD[i]); }

/* ============ Gebietsraster (16 px) ============ */
const wo_ZR = new Uint8Array(wo_ZW * wo_ZH);
(function wo_zones(){
  const L = [];
  for (const id in wo_ZELL) for (const e of wo_ZELL[id]) L.push(wo_ZI[id], e[0], e[1], 1 / e[2], 1 / e[3]);
  const LF = Float64Array.from(L), n = LF.length, zst = wo_ZI.stadt;
  for (let j = 0; j < wo_ZH; j++) for (let i = 0; i < wo_ZW; i++){
    const x = i * 16 + 8, y = j * 16 + 8, wob = (wo_mid(x * .7, y * .7) - .5) * .32;
    // nächste Ellipse ohne Wellung (die Stadt hat keine) und mit; Wurzel nur für die Sieger
    let bq = 1e18, bz = 0, sq = 1e18;
    for (let k = 0; k < n; k += 5){
      const dx = (x - LF[k + 1]) * LF[k + 3], dy = (y - LF[k + 2]) * LF[k + 4], q = dx * dx + dy * dy;
      if (LF[k] === zst){ if (q < sq) sq = q; } else if (q < bq){ bq = q; bz = LF[k]; }
    }
    let best = bz;
    if (Math.sqrt(sq) < Math.sqrt(bq) + wob) best = zst;
    const C = wo_CITY;
    if ((x > C.x0 - 50 && x < C.x1 + 50 && y > C.y0 - 70 && y < C.y1 + 40) || (x > C.x1 && x < wo_TJ.x + 230 && y > wo_TJ.y - 190 && y < wo_TJ.y + 120)) best = wo_ZI.stadt;   // Stadt und Turnierwiese
    else if (x > wo_SPY.x0 - 60 && x < wo_SPY.x1 + 90 && y > wo_SPY.y0 - 70 && y < wo_yAt(wo_RIVER, x)) best = wo_ZI.speyer;   // Speyer bis an den Strom
    else if (wo_onIsle(x, y)) best = wo_ZI.piratennest;
    else if (x > wo_ANNA.x0 - 60 && x < wo_ANNA.x1 + 60 && y > wo_ANNA.y0 - 80 && y < wo_ANNA.y1 + 50) best = wo_ZI.annaberg;   // Bergstadt
    else if (x > wo_WIT.x0 - 70 && x < wo_WIT.x1 + 70 && y > wo_WIT.y0 - 90 && y < wo_WIT.y1 + 60) best = wo_ZI.wittenberg;   // Städte der Ostlande
    else if (x > wo_NUE.x0 - 70 && x < wo_NUE.x1 + 70 && y > wo_NUE.y0 - 110 && y < wo_NUE.y1 + 60) best = wo_ZI.nuernberg;
    else if (x > wo_AUG.x0 - 70 && x < wo_AUG.x1 + 70 && y > wo_AUG.y0 - 90 && y < wo_AUG.y1 + 60) best = wo_ZI.augsburg;
    else if (x > 4100){ if (best === wo_ZI.piratennest) best = y < 1700 ? wo_ZI.weinberge : wo_ZI.auwald; }
    else if (y < WH0){
      const g = wo_gidx(x, y), w = wo_WSD[g], t = wo_WT[g];
      if (((t === 1 && w < 84 && x > 760) || (t === 4 && w < 56) || (t === 2 && w < 50 && y < 1300)) && best !== wo_ZI.stadt) best = wo_ZI.fluss;
    }
    wo_ZR[j * wo_ZW + i] = best;
  }
})();
function zoneAt(x, y){ return ZONES[wo_ZR[clamp(y >> 4, 0, wo_ZH - 1) * wo_ZW + clamp(x >> 4, 0, wo_ZW - 1)]]; }
const wo_zid = (x, y) => wo_ZR[clamp(y >> 4, 0, wo_ZH - 1) * wo_ZW + clamp(x >> 4, 0, wo_ZW - 1)];

/* ============ Kollision und Belegung ============ */
const wo_COL = new Uint8Array(wo_CW * wo_CH);   // 0 frei, 1 fest, 2 Wasser
let wo_ICE = false;                                // Winter: das Eis trägt (Wasser begehbar)
const wo_OCC = new Uint8Array(wo_CW * wo_CH);   // Belegung beim Platzieren
for (let j = 0; j < wo_CH; j++) for (let i = 0; i < wo_CW; i++){
  const g = (2 * j + 1) * wo_GW + 2 * i + 1;   // Zellmitte liegt genau auf einem Feldpunkt
  if (wo_WSD[g] < -1) wo_COL[j * wo_CW + i] = 2;
}
/* Zellspalten, die ein Intervall mindestens 2 px tief überdecken (mindestens eine) */
function wo_span(a, b, n){ let c0 = Math.ceil((a - 6) / 8), c1 = Math.floor((b - 2) / 8); if (c1 < c0){ c0 = c1 = Math.floor((a + b) / 16); } return [Math.max(0, c0), Math.min(n - 1, c1)]; }
function wo_mark(A, x0, y0, x1, y1, v){
  const [c0, c1] = wo_span(x0, x1, wo_CW), [r0, r1] = wo_span(y0, y1, wo_CH);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) A[r * wo_CW + c] = v;
}
function wo_markAny(A, x0, y0, x1, y1, v){   // alle berührten Zellen
  for (let r = Math.max(0, Math.floor(y0 / 8)); r <= Math.min(wo_CH - 1, Math.floor((y1 - .01) / 8)); r++)
    for (let c = Math.max(0, Math.floor(x0 / 8)); c <= Math.min(wo_CW - 1, Math.floor((x1 - .01) / 8)); c++) A[r * wo_CW + c] = v;
}
function wo_occFree(x0, y0, x1, y1){
  for (let r = Math.max(0, Math.floor(y0 / 8)); r <= Math.min(wo_CH - 1, Math.floor((y1 - .01) / 8)); r++)
    for (let c = Math.max(0, Math.floor(x0 / 8)); c <= Math.min(wo_CW - 1, Math.floor((x1 - .01) / 8)); c++) if (wo_OCC[r * wo_CW + c] || wo_COL[r * wo_CW + c]) return false;
  return true;
}

/* ============ Objekte ============ */
const PROPS = [], FIRES = [], SMOKES = [];
const wo_PI = [];         // interne Zusatzdaten je Objekt (Fußflächen in Weltkoordinaten)
function wo_add(kind, x, y, P, noCol){
  x = Math.round(x); y = Math.round(y);
  const ex = P.extra || {};
  const e = { kind, x, y, img: P.img, ax: P.ax, ay: P.ay, wins: P.wins || null, v: P.v, lz: !!P.lz,
    occl: P.occl ? [x + P.occl[0], y + P.occl[1], x + P.occl[2], y + P.occl[3]] : null,
    apple: !!ex.apples, crown: ex.crown ? { x: x + ex.crown.x, y: y + ex.crown.y } : null, shake: 0, door: ex.door ? x + ex.door.x : null };
  const feet = [];
  for (const f of P.foot){
    const r = [x + f[0], y + f[1], x + f[2], y + f[3]]; feet.push(r);
    if (!noCol) wo_mark(wo_COL, r[0], r[1], r[2], r[3], 1);
    wo_markAny(wo_OCC, r[0], r[1], r[2], r[3], 1);
  }
  if (!P.foot.length) wo_markAny(wo_OCC, x - 8, y - 6, x + 8, y + 2, 1);
  if (ex.flames) for (const f of ex.flames) FIRES.push({ x: x + f.x, y: y + f.y, big: !!f.big });
  if (ex.smoke) for (const s of ex.smoke) SMOKES.push({ x: x + s.x, y: y + s.y });
  PROPS.push(e); wo_PI.push({ p: e, feet });
  return e;
}
function wo_put(kind, x, y, seed){ const P = makeProp(kind, seed); return P ? wo_add(kind, x, y, P) : null; }
/* passt das Objekt hierhin? (frei, kein Wasser, Abstand zu Wegen) */
function wo_fits(P, x, y, m, rm){
  const F = P.foot.length ? P.foot : [[-6, -4, 6, 2]];
  for (const f of F){
    const x0 = x + f[0] - m, y0 = y + f[1] - m, x1 = x + f[2] + m, y1 = y + f[3] + m;
    if (x0 < 4 || y0 < 4 || x1 > WW - 4 || y1 > WH - 4 || !wo_occFree(x0, y0, x1, y1)) return false;
    for (let k = 0; k < 9; k++){
      const px = k % 3 === 0 ? x0 : k % 3 === 1 ? (x0 + x1) / 2 : x1, py = k < 3 ? y0 : k < 6 ? (y0 + y1) / 2 : y1;
      if (wo_wsd(px, py) < 3 || wo_rsd(px, py) < rm) return false;
    }
  }
  return true;
}
function wo_try(kind, x, y, seed, m, rm){
  const P = makeProp(kind, seed);
  if (!P || !wo_fits(P, Math.round(x), Math.round(y), m === undefined ? 2 : m, rm === undefined ? 4 : rm)) return null;
  return wo_add(kind, x, y, P);
}
/* freie Flächen reservieren (Durchgänge, Plätze, Lager) */
const wo_reserve = (x0, y0, x1, y1) => wo_markAny(wo_OCC, x0, y0, x1, y1, 1);

/* ---------- Bodenflächen (Felder, Höfe, Brücken ...) ---------- */
const wo_FEAT = [];
/* m: Material; Form: Rechteck (x0..y1) oder Ellipse (e: [cx, cy, rx, ry]) */
const wo_feat = o => { if (o.e){ const [cx, cy, rx, ry] = o.e; o.x0 = cx - rx; o.y0 = cy - ry; o.x1 = cx + rx; o.y1 = cy + ry; } wo_FEAT.push(o); return o; };
const WM = { FIELD: 1, YARD: 2, BRIDGE: 3, FORD: 4, SHADOW: 5, RABEN: 6, COAL: 7, MOUND: 8, HERB: 9, ROCK: 10, ASH: 11, MUD: 12, GARDEN: 13, STEG: 14 };
/* kleine Bodenobjekte (Stümpfe, liegende Stämme), im Boden gezeichnet */
const wo_GOBJ = [];

/* ---------- Brücken und Furten ---------- */
const wo_BRIDGES = [];
function wo_bridgeV(x, w, kind, yA, yB){   // senkrechte Brücke über den Fluss, x Mitte
  let y0 = yA, y1 = yB;
  while (y0 > yA - 200 && wo_wsd(x, y0) < 6) y0 -= 2;
  while (y1 < yB + 200 && wo_wsd(x, y1) < 6) y1 += 2;
  y0 = Math.floor((y0 - 4) / 8) * 8; y1 = Math.ceil((y1 + 4) / 8) * 8;
  const b = wo_feat({ m: WM.BRIDGE, kind, v: 1, x0: x - w / 2, x1: x + w / 2, y0, y1, hi: 1 });
  for (let r = y0 >> 3; r < y1 >> 3; r++) for (let c = (x - w / 2) >> 3; c < (x + w / 2) >> 3; c++){
    const edge = c === (x - w / 2) >> 3 || c === ((x + w / 2) >> 3) - 1;
    wo_COL[r * wo_CW + c] = edge ? 1 : 0;
  }
  wo_reserve(x - w / 2 - 8, y0 - 24, x + w / 2 + 8, y1 + 24);
  wo_BRIDGES.push(b); return b;
}
function wo_bridgeH(y, h, kind, xA, xB){  // waagerechter Steg über den Mühlbach
  let x0 = xA, x1 = xB;
  while (x0 > xA - 80 && wo_wsd(x0, y) < 5) x0 -= 2;
  while (x1 < xB + 80 && wo_wsd(x1, y) < 5) x1 += 2;
  x0 = Math.floor((x0 - 4) / 8) * 8; x1 = Math.ceil((x1 + 4) / 8) * 8;
  const b = wo_feat({ m: WM.STEG, kind, x0, x1, y0: y - h / 2, y1: y + h / 2, hi: 1 });
  for (let c = x0 >> 3; c < x1 >> 3; c++) for (let r = (y - h / 2) >> 3; r < (y + h / 2) >> 3; r++){
    const edge = r === (y - h / 2) >> 3 || r === ((y + h / 2) >> 3) - 1;
    wo_COL[r * wo_CW + c] = edge ? 1 : 0;
  }
  wo_reserve(x0 - 20, y - h / 2 - 8, x1 + 20, y + h / 2 + 8);
  wo_BRIDGES.push(b); return b;
}
function wo_ford(x, w, yA, yB){
  let y0 = yA, y1 = yB;
  while (wo_wsd(x, y0) < 4) y0 -= 2;
  while (wo_wsd(x, y1) < 4) y1 += 2;
  const f = wo_feat({ m: WM.FORD, x0: x - w / 2, x1: x + w / 2, y0: y0 - 6, y1: y1 + 6 });
  wo_markAny(wo_COL, x - w / 2 + 4, y0, x + w / 2 - 4, y1, 0);
  wo_reserve(x - w / 2 - 8, y0 - 20, x + w / 2 + 8, y1 + 20);
  return f;
}
wo_bridgeV(2966, 48, 'stein', 1880, 1890);
wo_bridgeV(1880, 40, 'holz', 1895, 1905);
wo_bridgeV(3780, 40, 'holz', 1730, 1740);
wo_bridgeV(5000, 44, 'holz', 1730, 1742);
wo_bridgeV(5740, 36, 'holz', 1886, 1894);
wo_bridgeH(1404, 40, 'holz', 2532, 2540);
wo_ford(820, 64, 2112, 2124);

/* ============ eigene Bodenbauten: Mauerkronen, Meiler, Köhlerhütte, Holzstoß ============ */
/* Pixelpuffer-Helfer für eigene Bilder */
function wo_img(w, h){ return { w, h, d: new Uint32Array(w * h) }; }
function wo_px(B, x, y, c){ x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < B.w && y < B.h) B.d[y * B.w + x] = c; }
function wo_cv(B){ const c = canvasOf(B.w, B.h), g = c.getContext('2d'), id = g.createImageData(B.w, B.h); id.data.set(new Uint8Array(B.d.buffer)); g.putImageData(id, 0, 0); return c; }
const wo_STONE = wo_ramp(['#2b2824', '#433e37', '#5a544a', '#716a5d', '#898072', '#a09786'], 6);
const wo_GREY = wo_ramp(['#292826', '#403e3a', '#57544e', '#6e6a62', '#858077', '#9c968b'], 6);
const wo_MOSS = wo_ramp(['#232b15', '#303b1b', '#3f4c22', '#4f5c2a', '#5f6b33'], 5);
const wo_OUTC = wo_c(OUT);
/* senkrecht verlaufende Mauer, von oben gesehen: Wehrgang, Zinnen außen, Stirnseite unten */
function wo_wallNS(xc, yN, yS, t, hgt, R, outerLeft, seed, endFace){
  const len = yS - yN, w = t + 2, h = len + hgt + 1, B = wo_img(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const wy = y, inFace = endFace && y >= h - 1 - hgt;
    let c;
    if (x === 0 || x === w - 1) c = wo_OUTC;
    else if (inFace){
      const fy = y - (h - 1 - hgt), course = (fy / 6) | 0, off = course & 1 ? 5 : 0, joint = fy % 6 === 5 || ((x + off) % 10 === 0);
      const v = 3 - (fy / hgt) * 1.6 + (wo_h(x, course, seed) - .5) * 1.4;
      c = joint ? R[1] : R[clamp(Math.round(v), 1, 5)];
      if (fy === 0) c = R[5];
    } else {
      const lx = outerLeft ? x - 1 : t - x, mer = lx < 5, inner = lx > t - 4;
      const yy = y + seed * 7;
      if (mer){
        const seg = yy % 14, gap = seg < 5;
        if (gap) c = lx < 2 ? R[2] : R[1];
        else { c = seg === 5 ? R[5] : lx === 0 ? R[2] : lx === 4 ? R[2] : R[4]; if (seg === 13) c = R[1]; }
      } else if (inner){ c = lx === t - 1 ? R[1] : (yy % 9 === 0 ? R[2] : R[3]); }
      else {
        const row = (yy / 7) | 0, sx = (lx + (row & 1) * 3) % 7, joint = (yy % 7 === 0) || sx === 0;
        const v = 2.6 + (wo_h(row, (lx + (row & 1) * 3) / 7 | 0, seed + 3) - .5) * 1.6;
        c = joint ? R[1] : R[clamp(Math.round(v), 1, 4)];
        if (wo_h(x, yy, seed + 9) < .05) c = R[1];
      }
      const mo = wo_fin(x * 5 + seed * 13, yy * 2);
      if (mo > .74 && !mer) c = wo_MOSS[clamp(((mo - .74) * 14) | 0, 1, 4)];
    }
    B.d[y * w + x] = c;
  }
  return { img: scale2x(wo_cv(B)), ax: w >> 1, ay: h - 1, foot: [[-(t >> 1), -len, t - (t >> 1), 1]], occl: [-(t >> 1) - 12, -len - hgt, t - (t >> 1) + 12, -len + 4], extra: {} };
}
/* Kohlenmeiler: Erdkuppel mit Rasenstücken, Rauchloch */
function wo_meilerImg(seed){
  const w = 50, h = 30, B = wo_img(w, h), R = rng(seed), E = wo_ramp(['#15120f', '#221d18', '#2f2821', '#3d342b', '#4b4135', '#5a4f41'], 6);
  const G = wo_ramp(['#1f2716', '#2b351c', '#384423', '#46522b', '#546034'], 5);
  const cx = 25, cy = 26, rx = 22, ry = 19;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const dx = (x - cx) / rx, dy = (y - cy) / ry, q = dx * dx + dy * dy;
    if (y > cy + 1 || q > 1) continue;
    const nz = Math.sqrt(Math.max(0, 1 - q)), lit = (-dx * .55 - dy * .6 + nz * .6);
    let v = 1.4 + lit * 3 + (wo_h(x, y, seed) - .5) * 1.2, c = E[clamp(Math.round(v), 0, 5)];
    const sod = wo_fin(x * 7 + seed, y * 9) > .58 && q < .9;
    if (sod) c = G[clamp(Math.round(v - .6), 0, 4)];
    if (((x * 3 + y * 5 + seed) % 11 === 0) && q < .85) c = E[0];
    if (q > .86) c = E[clamp(Math.round(v - 1.5), 0, 3)];
    B.d[y * w + x] = c;
  }
  for (let x = 2; x < w - 2; x++){ const y = cy + 1, dx = (x - cx) / rx; if (Math.abs(dx) < 1) B.d[y * w + x] = wo_pk(20, 18, 24); }
  for (const [x, y] of [[cx - 1, 7], [cx, 7], [cx + 1, 7], [cx, 8], [cx - 1, 8]]) B.d[y * w + x] = E[0];
  for (let k = 0; k < 6; k++){ const x = (cx - 18 + R() * 36) | 0, y = (cy - 3 - R() * 5) | 0; B.d[y * w + x] = wo_c('#7a5a2a'); }
  const c = addOutline(scale2x(wo_cv(B)), OUT);
  return { img: c, ax: cx, ay: cy + 1, foot: [[-19, -10, 19, 2]], occl: null, extra: { smoke: [{ x: 0, y: -19 }, { x: -7, y: -14 }] } };
}
/* Köhlerhütte: Kegel aus Stangen mit Rinde und Grassoden */
function wo_huetteImg(seed){
  const w = 46, h = 50, B = wo_img(w, h), cx = 23, base = 47;
  const BK = wo_ramp(['#17130f', '#251e17', '#342a20', '#45382a', '#574735', '#6a5841'], 6), G = wo_ramp(['#1f2716', '#2b351c', '#384423', '#46522b'], 4);
  for (let y = 4; y <= base; y++){
    const t = (y - 4) / (base - 4), hw = 2 + t * 19;
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++){
      const u = (x - cx) / hw, lit = -u * .9 + .2;
      let v = 2 + lit * 1.6 + (wo_h(x >> 1, y, seed) - .5) * 1.2;
      const pole = ((x - cx) * 12 / (t * 20 + 2) + 40) % 3 < .9;
      let c = BK[clamp(Math.round(v - (pole ? 1 : 0)), 0, 5)];
      if (wo_fin(x * 6 + seed, y * 4) > .62 && y > 14) c = G[clamp(Math.round(v - .5), 0, 3)];
      B.d[y * w + x] = c;
    }
  }
  for (let y = base - 15; y <= base; y++) for (let x = cx - 4; x <= cx + 4; x++){ const yy = y - (base - 15); if (Math.abs(x - cx) <= Math.min(4, 1 + yy / 2)) B.d[y * w + x] = wo_c('#0f0c0a'); }
  for (let k = 0; k < 4; k++){ wo_px(B, cx - 2 + k, 2 + (k & 1), BK[4]); wo_px(B, cx - 1 + k, 3, BK[3]); }
  const c = addOutline(scale2x(wo_cv(B)), OUT);
  return { img: c, ax: cx, ay: base, foot: [[-17, -12, 17, 2]], occl: [-22, -48, 22, -14], extra: { smoke: [{ x: 1, y: -46 }] } };
}
/* Holzstoß: gespaltene Scheite, Stirnseiten sichtbar */
function wo_holzImg(seed){
  const w = 40, h = 24, B = wo_img(w, h), R = rng(seed);
  const WD = wo_ramp(['#1d1610', '#2e2318', '#433322', '#5a462f', '#715a3d', '#8a714f'], 6), END = wo_ramp(['#4a3a26', '#6b5636', '#8b7448', '#a8915e', '#bba673'], 5);
  for (let y = 3; y < h - 1; y++) for (let x = 2; x < w - 2; x++) B.d[y * w + x] = WD[1];
  for (let row = 0; row < 4; row++) for (let k = 0; k < 7; k++){
    const cx = 5 + k * 5 + (row & 1) * 2, cy = h - 4 - row * 5;
    if (cx > w - 5 || (row === 3 && (k === 0 || k > 5))) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++){
      if (dx * dx + dy * dy > 5) continue;
      const v = 2.4 - (dx + dy) * .45 + (R() - .5) * .6;
      wo_px(B, cx + dx, cy + dy, END[clamp(Math.round(v), 0, 4)]);
    }
    wo_px(B, cx, cy, END[1]); if (R() < .5) wo_px(B, cx + 1, cy - 1, END[0]);
  }
  for (let x = 2; x < w - 2; x++) wo_px(B, x, h - 1, wo_pk(20, 18, 24));
  const c = addOutline(scale2x(wo_cv(B)), OUT);
  return { img: c, ax: w >> 1, ay: h - 2, foot: [[-17, -8, 17, 1]], occl: null, extra: {} };
}

/* ============ Platzierung ============ */
const wo_R = rng(1520);
let wo_seed = 1;
const wo_ns = () => (wo_seed = (wo_seed * 31 + 7) % 100003) + .37;
const wo_pick = (R, arr) => arr[R() * arr.length | 0];
const wo_HOUSES = [];     // Häuser für Rattenpunkte
const wo_GRAVES = [];     // Gräber für Wiedergänger
const wo_INNP = {};       // Gasthäuser

/* ---------- Reichsburg ---------- */
(function wo_castle(){
  const C = wo_CAST, gx = C.gx;
  const T = makeProp('burg_turm', 1), M = makeProp('burg_mauer', 1), G = makeProp('burg_tor', 1), BF = makeProp('bergfried', 1);
  const tw = T.foot[0][2] - T.foot[0][0], mw = M.foot[0][2] - M.foot[0][0];
  // Südmauer mit Tor
  wo_reserve(gx - 18, C.y1 - 70, gx + 18, C.y1 + 40);
  for (let k = 0; k < 3; k++){ wo_put('burg_mauer', C.x0 + tw / 2 + mw / 2 + k * mw, C.y1, k + 2); wo_put('burg_mauer', C.x1 - tw / 2 - mw / 2 - k * mw, C.y1, k + 5); }
  wo_put('burg_tor', gx, C.y1, 1);
  wo_put('burg_turm', C.x0, C.y1 + 1, 1); wo_put('burg_turm', C.x1, C.y1 + 1, 2);
  // Nordmauer mit Bergfried
  for (let k = 0; k < 3; k++){ wo_put('burg_mauer', C.x0 + tw / 2 + mw / 2 + k * mw, C.y0, k + 8); wo_put('burg_mauer', C.x1 - tw / 2 - mw / 2 - k * mw, C.y0, k + 11); }
  wo_put('bergfried', gx, C.y0 + 2, 1);
  wo_put('burg_turm', C.x0, C.y0 + 1, 3); wo_put('burg_turm', C.x1, C.y0 + 1, 4);
  // Seitenmauern (von oben)
  const t = 28, hg = 54, yN = C.y0 + 2, yS = C.y1 - (T.foot[0][3] - T.foot[0][1]) + 2;
  wo_add('mauer', C.x0, yS, wo_wallNS(C.x0, yN, yS, t, hg, wo_STONE, true, 3, false));
  wo_add('mauer', C.x1, yS, wo_wallNS(C.x1, yN, yS, t, hg, wo_STONE, false, 5, false));
  wo_feat({ m: WM.SHADOW, x0: C.x1 + t / 2 + 1, x1: C.x1 + t / 2 + 10, y0: yN, y1: yS + 8 });
  wo_feat({ m: WM.SHADOW, x0: C.x0 + t / 2 + 1, x1: C.x0 + t / 2 + 8, y0: yN, y1: yS });
  // Burghof
  wo_feat({ m: WM.YARD, sub: 1, x0: C.x0 + 14, y0: C.y0, x1: C.x1 - 14, y1: C.y1 - 10 });
  wo_put('kapelle', 1730, 470, 3);
  wo_put('stadthaus', 2040, 452, 11); wo_put('stadthaus', 2122, 452, 12);
  wo_put('fachwerkhaus', 1712, 610, 5);
  wo_put('brunnen', 1960, 470, 1);
  wo_put('feuerschale', 1858, 600, 1); wo_put('feuerschale', 1942, 600, 2);
  wo_put('feuerschale', 1856, 372, 3); wo_put('feuerschale', 1944, 372, 4);
  wo_put('banner', 1878, 520, 1); wo_put('banner', 1922, 520, 2);
  wo_put('heuhaufen', 1790, 600, 3); wo_put('karren', 2066, 560, 2); wo_put('fass', 2110, 590, 1); wo_put('fass', 2124, 596, 2);
  wo_put('kisten', 2140, 560, 3); wo_put('fass', 1820, 470, 4); wo_put('kisten', 1660, 400, 6);
  // Burgweg: Feuerschalen und Banner vor dem Tor
  wo_put('banner', gx - 64, C.y1 + 22, 3); wo_put('banner', gx + 64, C.y1 + 22, 4);
  // Felsen an den Flanken des Burgbergs
  const R = rng(77);
  for (let k = 0; k < 90; k++){
    const a = R() * Math.PI * 2, r = .66 + R() * .3, x = gx + Math.cos(a) * 430 * r, y = 470 + Math.sin(a) * 330 * r;
    if (Math.sin(a) > .55 && Math.abs(Math.cos(a)) < .5) continue;   // Südhang frei für den Weg
    wo_try(R() < .45 ? 'fels' : 'stein', x, y, wo_ns(), 6, 10);
  }
})();

/* ---------- Reichsstadt ---------- */
(function wo_city(){
  const C = wo_CITY, R = rng(1356);
  const T = makeProp('stadt_turm', 1), M = makeProp('stadt_mauer', 1);
  const tw = T.foot[0][2] - T.foot[0][0], mw = M.foot[0][2] - M.foot[0][0];
  wo_reserve(C.gx - 18, C.y0 - 40, C.gx + 18, C.y0 + 40); wo_reserve(C.gx - 18, C.y1 - 40, C.gx + 18, C.y1 + 40);
  for (const y of [C.y0, C.y1]){
    // T M M T M M G M M T M M T
    let x = C.x0 - tw / 2;
    const spec = 'TMMTMMGMMTMMT';
    for (const ch of spec){
      const w = ch === 'T' ? tw : ch === 'M' ? mw : 104;
      const cx = x + w / 2;
      if (ch === 'T') wo_put('stadt_turm', cx, y + 1, wo_ns()); else if (ch === 'M') wo_put('stadt_mauer', cx, y, wo_ns()); else wo_put('stadt_tor', cx, y, y === C.y0 ? 1 : 2);
      x += w;
    }
  }
  // Seitenmauern; im Osten eine Bresche
  const t = 24, hg = 46, yN = C.y0 + 2, yS = C.y1 - (T.foot[0][3] - T.foot[0][1]) + 2;
  wo_add('mauer', C.x0, yS, wo_wallNS(C.x0, yN, yS, t, hg, wo_GREY, true, 7, false));
  const bN = 2326, bS = 2410;
  wo_add('mauer', C.x1, bN, wo_wallNS(C.x1, yN, bN, t, hg, wo_GREY, false, 9, true));
  wo_add('mauer', C.x1, yS, wo_wallNS(C.x1, bS, yS, t, hg, wo_GREY, false, 11, false));
  wo_put('stadt_turm', C.x1, 2190, 3);
  wo_feat({ m: WM.SHADOW, x0: C.x1 + t / 2 + 1, x1: C.x1 + t / 2 + 10, y0: yN, y1: bN });
  wo_feat({ m: WM.SHADOW, x0: C.x1 + t / 2 + 1, x1: C.x1 + t / 2 + 10, y0: bS, y1: yS + 8 });
  wo_feat({ m: WM.SHADOW, x0: C.x0 + t / 2 + 1, x1: C.x0 + t / 2 + 8, y0: yN, y1: yS });
  wo_reserve(C.x1 - 20, bN + 4, C.x1 + 60, bS - 4);
  for (let k = 0; k < 7; k++) wo_try('stein', C.x1 + (R() - .3) * 50, bN + 12 + R() * (bS - bN - 20), wo_ns(), 0, 2);
  // Hof- und Gassenboden innerhalb der Mauern
  wo_feat({ m: WM.YARD, sub: 0, x0: C.x0 + 12, y0: C.y0 + 2, x1: C.x1 - 12, y1: C.y1 - 4 });
  // Marktplatz
  const mk = { x0: 2846, y0: 2214, x1: 3112, y1: 2400 };
  wo_feat({ m: WM.YARD, sub: 2, x0: mk.x0, y0: mk.y0, x1: mk.x1, y1: mk.y1 });
  wo_reserve(C.gx - 24, C.y0, C.gx + 24, C.y1);
  wo_put('brunnen', 3010, 2300, 2); wo_put('pranger', 2900, 2286, 1);
  for (const [x, y, v] of [[2884, 2254, 0], [2930, 2254, 1], [3010, 2252, 4], [3062, 2254, 2], [2884, 2368, 3], [2930, 2368, 5], [3010, 2370, 1], [3062, 2368, 0]])
    wo_try('marktstand', x, y, wo_seedFor('marktstand', v), 1, -40);
  for (const [k, x, y] of [['karren', 3060, 2250], ['kisten', 2880, 2236], ['fass', 2864, 2244], ['fass', 2872, 2252], ['kisten', 3090, 2384], ['karren', 2896, 2392],
    ['fass', 3090, 2240], ['kisten', 2926, 2250], ['heuhaufen', 3080, 2330], ['fass', 2864, 2340]]) wo_try(k, x, y, wo_ns(), 0, -40);
  // Kirche mit Kirchhof
  wo_put('kirche', 2716, 2322, 1);
  for (let k = 0; k < 6; k++){ const g = wo_try(k % 2 ? 'grabkreuz' : 'grabstein', 2630 + k * 18, 2196 + (k % 2) * 4, wo_ns(), 0, -40); if (g) wo_GRAVES.push(g); }
  // Häuserzeilen (Giebel zur Gasse)
  const rowA = [2634, 2718, 2802, 2886, 3046, 3130, 3214, 3298], rowC = [2634, 2718, 2802, 2886, 3046, 3130, 3214, 3298];
  for (const x of rowA){
    const kind = x === 3130 ? 'gasthaus_adler' : 'stadthaus', h = wo_try(kind, x, 2104, wo_ns(), -2, -40);
    if (h){ if (kind === 'stadthaus') wo_HOUSES.push(h); else { wo_INNP.adler = h; wo_reserve(h.door - 14, 2106, h.door + 14, 2140); } }
  }
  for (const x of rowC){ const h = wo_try('stadthaus', x, 2524, wo_ns(), -2, -40); if (h) wo_HOUSES.push(h); }
  for (const x of [2880, 3052]){ const h = wo_try('stadthaus', x, 2212, wo_ns(), -2, -40); if (h) wo_HOUSES.push(h); }
  for (const x of [3182, 3266]){ const h = wo_try('stadthaus', x, 2300, wo_ns(), -2, -40); if (h) wo_HOUSES.push(h); }
  // Kleinkram in Gassen und Höfen
  for (let k = 0; k < 40; k++) wo_try(wo_pick(R, ['fass', 'kisten', 'fass', 'karren', 'heuhaufen', 'brunnen']), C.x0 + 30 + R() * (C.x1 - C.x0 - 60), C.y0 + 30 + R() * (C.y1 - C.y0 - 60), wo_ns(), 4, 8);
  // Turnierwiese vor der Ostmauer: Schranke, Tribüne, Zelte der Ritter, Banner und Feuerschalen
  const TJ = wo_TJ;
  wo_feat({ m: WM.YARD, sub: 3, e: [TJ.x, TJ.y + 6, 156, 54] });
  wo_put('tribuene', TJ.x, TJ.y - 50, 1);
  wo_put('schranke', TJ.x, TJ.y, 1);
  wo_reserve(TJ.x - 150, TJ.y - 44, TJ.x + 150, TJ.y + 46);
  wo_tryNear('zelt', TJ.x - 130, TJ.y - 48, wo_seedFor('zelt', 0), 0, 2); wo_tryNear('zelt', TJ.x + 130, TJ.y - 48, wo_seedFor('zelt', 1), 0, 2);
  for (const [x, y, v] of [[TJ.x - 122, TJ.y - 4, 1], [TJ.x + 122, TJ.y - 4, 2], [TJ.x - 84, TJ.y - 52, 3], [TJ.x + 84, TJ.y - 52, 4]]) wo_put('banner', x, y, v);
  for (const dx of [-176, 176]) wo_tryNear('feuerschale', TJ.x + dx, TJ.y + 10, wo_ns(), 0, 2);
  // Gärten vor der Stadt
  for (let k = 0; k < 28; k++){ const x = C.x0 - 40 - R() * 200, y = C.y0 + R() * (C.y1 - C.y0); wo_try(R() < .5 ? 'apfelbaum' : 'busch', x, y, wo_ns(), 8, 10); }
  for (let k = 0; k < 18; k++){ const x = C.x1 + 60 + R() * 120, y = C.y0 + R() * (C.y1 - C.y0); wo_try(R() < .4 ? 'apfelbaum' : 'busch', x, y, wo_ns(), 8, 10); }
})();

/* ---------- Gasthäuser an der Steinbrücke und am Burgweg ---------- */
(function wo_inns(){
  const place = (id, kind, tx, ty) => {
    const P = makeProp(kind, 7);
    for (let r = 0; r <= 260; r += 8) for (let k = 0; k < (r ? 16 : 1); k++){
      const a = k / 16 * Math.PI * 2, x = Math.round(tx + Math.cos(a) * r), y = Math.round(ty + Math.sin(a) * r * .7);
      if (!wo_fits(P, x, y, 3, 3)) continue;
      const dx = x + P.extra.door.x;
      if (!wo_occFree(dx - 14, y + 4, dx + 14, y + 34) || wo_wsd(dx, y + 20) < 6) continue;
      wo_INNP[id] = wo_add(kind, x, y, P);
      wo_reserve(dx - 16, y + 3, dx + 16, y + 36);
      return;
    }
  };
  place('ochse', 'gasthaus_ochse', 2010, 800);
  place('krone', 'gasthaus_krone', 3080, 1900);
})();

/* ---------- Dorf Lindach am Fuß der Burg: Anger mit Linde, Maibaum und Brunnen, Höfe, Gärten, Felder, Weide ---------- */
const wo_HAMLET = { x: 2444, y: 584 }, wo_HFIELDS = [];
/* Saatwert, der eine bestimmte Spielart eines Objekts ergibt */
function wo_seedFor(kind, v){
  const n = wp_K[kind][1];
  for (let s = 1; s < 4000; s++){ const sv = Math.floor(s * 977) + s; if (Math.floor(wp_h(sv, 11, 4049) * n) === v) return s; }
  return v + 1;
}
/* in der Nähe versuchen, falls die Stelle besetzt ist */
function wo_tryNear(kind, x, y, seed, m, rm){
  for (let r = 0; r <= 36; r += 6) for (let k = 0; k < (r ? 8 : 1); k++){
    const a = k / 8 * Math.PI * 2, o = wo_try(kind, x + Math.cos(a) * r, y + Math.sin(a) * r * .7, seed, m, rm);
    if (o) return o;
  }
  return null;
}
(function wo_hamlet(){
  const R = rng(1488), { x: cx, y: cy } = wo_HAMLET;
  wo_reserve(cx - 46, cy - 26, cx + 46, cy + 30);                       // Anger frei halten
  wo_put('eiche', cx - 30, cy - 4, 9);                                  // Dorflinde
  wo_put('maibaum', cx + 26, cy + 6, 1);
  wo_tryNear('brunnen', cx + 62, cy - 22, 6, 2, 3);
  // Marktstände am Anger
  for (const [x, y, v] of [[cx - 70, cy + 52, 0], [cx + 4, cy + 58, 3], [cx + 76, cy + 50, 5]]) wo_tryNear('marktstand', x, y, wo_seedFor('marktstand', v), 2, 3);
  // Höfe rings um den Anger
  for (const [x, y] of [[2346, 476], [2452, 452], [2566, 484], [2330, 700], [2566, 704], [2446, 760]]){
    const h = wo_tryNear('fachwerkhaus', x, y, wo_ns(), 2, 4);
    if (!h) continue;
    wo_HOUSES.push(h);
    // Garten mit Beeten neben dem Haus
    const gx = h.x + (R() < .5 ? -78 : 54), gy = h.y - 12;
    if (wo_occFree(gx - 2, gy - 2, gx + 26, gy + 22)){ wo_feat({ m: WM.HERB, x0: gx, y0: gy, x1: gx + 24, y1: gy + 20, s: R() * 99 | 0 }); wo_reserve(gx, gy, gx + 24, gy + 20); }
  }
  // Felder nördlich des Dorfes
  for (let x = 2300; x < 2590; ){
    const w = 18 + (R() * 14 | 0), crop = wo_pick(R, ['wheat', 'rye', 'green', 'plow', 'wheat', 'stub']);
    const f = wo_feat({ m: WM.FIELD, crop, vert: true, x0: x, x1: x + w, y0: 338, y1: 404, s: R() * 1000 | 0 });
    wo_HFIELDS.push(f); wo_reserve(f.x0 + 3, f.y0 + 3, f.x1 - 3, f.y1 - 3); x += w + 3;
  }
  wo_tryNear('vogelscheuche', 2420, 372, 4, -10, 2); wo_tryNear('vogelscheuche', 2530, 380, 5, -10, 2);
  // Weide im Osten: Zaun, darin nichts als Gras
  for (let y = 520; y <= 700; y += 30) wo_try('zaun_v', 2650, y, wo_ns(), -1, 2);
  wo_reserve(2600, 530, 2646, 700);
  // Kleinkram an den Höfen
  for (let k = 0; k < 26; k++) wo_try(wo_pick(R, ['heuhaufen', 'fass', 'kisten', 'karren', 'heuhaufen', 'zaun_h', 'apfelbaum', 'busch']), cx - 170 + R() * 340, cy - 150 + R() * 300, wo_ns(), 6, 8);
  for (let k = 0; k < 10; k++) wo_try(R() < .7 ? 'apfelbaum' : 'busch', 2290 + R() * 330, 780 + R() * 50, wo_ns(), 8, 10);
})();

/* ---------- Mühle, Ufer, Brückenköpfe ---------- */
(function wo_river(){
  const R = rng(4242);
  const m = wo_put('muehle', 2470, 1542, 1); if (m) wo_HOUSES.push(m);
  for (const [k, x, y] of [['kisten', 2392, 1560], ['fass', 2380, 1540], ['fass', 2388, 1528], ['karren', 2380, 1600], ['heuhaufen', 2420, 1620]]) wo_try(k, x, y, wo_ns(), 0, -20);
  // Weiden und Büsche an den Ufern
  for (let k = 0; k < wo_RIVER.length; k += 3){
    const [x, y, w] = wo_RIVER[k];
    for (const s of [-1, 1]){
      if (R() < .45) continue;
      const d = w + 12 + R() * 34, px = x + (R() - .5) * 10, py = y + s * d;
      wo_try(R() < .62 ? 'weide' : R() < .6 ? 'busch' : 'birke', px, py, wo_ns(), 6, 8);
    }
  }
  for (let k = 0; k < wo_BACH.length; k += 2){
    const [x, y, w] = wo_BACH[k];
    for (const s of [-1, 1]) if (R() < .4) wo_try(R() < .6 ? 'weide' : 'busch', x + s * (w + 14 + R() * 20), y, wo_ns(), 6, 8);
  }
  for (let k = 0; k < 14; k++){ const a = R() * 6.28; wo_try(R() < .5 ? 'weide' : 'busch', 2560 + Math.cos(a) * 100, 1156 + Math.sin(a) * 62, wo_ns(), 6, 8); }
  // Wegweiser und Kreuze an Brücken
  wo_try('wegweiser', 2996, 1820, 1, 0, 2); wo_try('wegkreuz', 1912, 1830, 2, 0, 2); wo_try('wegweiser', 3812, 1680, 3, 0, 2);
  wo_try('wegkreuz', 852, 2050, 4, 0, 2);
})();

/* ---------- Obstgärten ---------- */
(function wo_orchard(){
  const R = rng(1499);
  wo_reserve(1840, 1250, 1960, 1370);   // Platz um den Startpunkt
  wo_put('fachwerkhaus', 2182, 1124, 7); wo_put('brunnen', 2254, 1180, 3); wo_put('heuhaufen', 2096, 1150, 5);
  wo_put('karren', 2250, 1120, 6); wo_put('fass', 2118, 1112, 3); wo_put('fass', 2130, 1120, 5); wo_put('kisten', 2240, 1218, 2);
  wo_try('wegkreuz', 1940, 1278, 9, 0, 2); wo_try('wegweiser', 1862, 1282, 7, 0, 2);
  // Zaun um den Hof
  for (let x = 2116; x <= 2296; x += 32){ wo_try('zaun_h', x, 1070, wo_ns(), -1, 2); if (x < 2150 || x > 2190) wo_try('zaun_h', x, 1250, wo_ns(), -1, 2); }
  // Baumreihen
  for (let j = 0; j < 13; j++) for (let i = 0; i < 15; i++){
    const x = 1360 + i * 76 + (j & 1) * 38 + (R() - .5) * 18, y = 860 + j * 70 + (R() - .5) * 14;
    if (wo_zid(x, y) !== wo_ZI.obstgarten && R() < .8) continue;
    if (wo_mid(x * 2, y * 2) < .26) continue;
    wo_try(R() < .9 ? 'apfelbaum' : (R() < .5 ? 'busch' : 'buche'), x, y, wo_ns(), 4, 10);
  }
  for (let k = 0; k < 6; k++) wo_try(wo_pick(R, ['heuhaufen', 'fass', 'karren', 'vogelscheuche', 'kisten']), 1450 + R() * 900, 900 + R() * 760, wo_ns(), 8, 10);
})();

/* ---------- verbranntes Dorf und Felder ---------- */
const wo_FIELDS = wo_HFIELDS.slice();
(function wo_village(){
  const R = rng(1525);
  const crops = ['wheat', 'rye', 'green', 'plow', 'fallow', 'burn', 'stub', 'wheat', 'rye', 'burn'];
  function gewann(x0, y0, x1, y1, vert, burnt){
    let p = vert ? x0 : y0; const end = vert ? x1 : y1;
    while (p < end - 12){
      const w = Math.min(end - p, 20 + (R() * 18 | 0)), crop = burnt && R() < .45 ? 'burn' : wo_pick(R, crops);
      const f = wo_feat({ m: WM.FIELD, crop, vert, x0: vert ? p : x0, x1: vert ? p + w : x1, y0: vert ? y0 : p, y1: vert ? y1 : p + w, s: R() * 1000 | 0 });
      wo_FIELDS.push(f); wo_reserve(f.x0 + 3, f.y0 + 3, f.x1 - 3, f.y1 - 3); p += w + 3;
    }
  }
  gewann(1290, 2110, 1560, 2290, true, true);
  gewann(1950, 2384, 2360, 2560, false, false);
  gewann(1430, 2504, 1680, 2680, true, true);
  gewann(2010, 2060, 2400, 2250, false, false);
  gewann(1080, 2250, 1260, 2420, true, false);
  // Häuser um den Anger
  wo_put('eiche', 1800, 2296, 3);   // Dorflinde
  wo_put('brunnen', 1736, 2318, 4);
  for (const [k, x, y] of [['fachwerkhaus_ruine', 1640, 2214], ['fachwerkhaus_ruine', 1910, 2210], ['fachwerkhaus', 1990, 2172], ['fachwerkhaus_ruine', 1610, 2350],
    ['fachwerkhaus_ruine', 1648, 2470], ['fachwerkhaus', 1880, 2440], ['fachwerkhaus_ruine', 1530, 2240], ['fachwerkhaus_ruine', 1960, 2330], ['kapelle', 1830, 2580]]){
    const h = wo_try(k, x, y, wo_ns(), 2, 4); if (h) wo_HOUSES.push(h);
  }
  wo_try('wegkreuz', 1800, 2120, 5, 0, 2); wo_try('pranger', 1770, 2330, 2, 0, 2);
  for (let k = 0; k < 40; k++) wo_try(wo_pick(R, ['heuhaufen', 'heuhaufen', 'vogelscheuche', 'karren', 'fass', 'kisten', 'busch', 'zaun_h', 'zaun_h', 'apfelbaum', 'apfelbaum']),
    1300 + R() * 1100, 2080 + R() * 600, wo_ns(), 6, 8);
  for (const f of wo_FIELDS){ if (R() < .35) wo_try(f.crop === 'stub' ? 'heuhaufen' : 'vogelscheuche', (f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2 + 6, wo_ns(), -10, 2); }
})();

const wo_DGDOORS = [];   // Eingänge der Gewölbe (Weltpixel)
/* ---------- Kloster und Friedhof ---------- */
(function wo_monastery(){
  const R = rng(1517);
  wo_put('kirche', 1270, 2790, 2); wo_put('kloster', 1452, 2790, 1);
  { const e = wo_tryNear('abgang', 1362, 2832, wo_seedFor('abgang', 1), 2, 4); if (e){ wo_DGDOORS.push({ dg: 'krypta', x: e.x, y: e.y }); wo_reserve(e.x - 16, e.y, e.x + 16, e.y + 30); } }
  wo_put('brunnen', 1390, 2880, 5);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) wo_feat({ m: WM.HERB, x0: 1230 + i * 70, y0: 2846 + j * 56, x1: 1280 + i * 70, y1: 2880 + j * 56, s: i * 3 + j });
  for (const [x, y] of [[1560, 2880], [1590, 2940], [1520, 2950], [1200, 2900], [1610, 2840]]) wo_try('apfelbaum', x, y, wo_ns(), 2, 4);
  // Friedhof mit Zaun, Kapelle und Gräbern
  const F = { x0: 1760, y0: 2702, x1: 2184, y1: 2996 };
  wo_put('kapelle', 1970, 2782, 1);
  wo_reserve(2040, 2790, 2120, 2830);   // Platz des Todes
  for (let x = F.x0 + 16; x < F.x1; x += 32){ wo_try('zaun_h', x, F.y0, wo_ns(), -1, -20); wo_try('zaun_h', x, F.y1, wo_ns(), -1, -20); }
  for (let y = F.y0 + 32; y <= F.y1; y += 32){ if (y < 2752 || y > 2820) wo_try('zaun_v', F.x0, y, wo_ns(), -1, -20); wo_try('zaun_v', F.x1, y, wo_ns(), -1, -20); }
  for (const gy of [2848, 2894, 2940, 2984]){
    for (let x = F.x0 + 26; x < F.x1 - 14; x += 24 + (R() * 6 | 0)){
      if (Math.abs(x - 1975) < 22 || R() < .12) continue;
      const k = R() < .55 ? 'grabkreuz' : 'grabstein', g = wo_try(k, x, gy - 26, wo_ns(), 0, -20);
      if (g){ wo_GRAVES.push(g); wo_feat({ m: WM.MOUND, x0: x - 6, y0: gy - 24, x1: x + 6, y1: gy - 4, s: x }); }
    }
  }
  wo_try('eiche', 1800, 2760, 7, 0, 4); wo_try('toter_baum', 2150, 2756, 2, 0, 4); wo_try('eiche', 2160, 2970, 8, 0, 4);
  wo_try('feuerschale', 1940, 2818, 5, 0, -20); wo_try('feuerschale', 2004, 2818, 6, 0, -20);
  for (let k = 0; k < 30; k++) wo_try(wo_pick(R, ['busch', 'eiche', 'buche', 'stein', 'toter_baum']), 1100 + R() * 1200, 2700 + R() * 360, wo_ns(), 8, 10);
})();

/* ---------- Galgenberg ---------- */
(function wo_gallows(){
  const R = rng(1532);
  wo_feat({ m: WM.RABEN, e: [3720, 1200, 52, 34] });
  wo_put('galgen', 3720, 1200, 1);
  wo_try('wegkreuz', 3604, 1306, 3, 0, 2);
  for (const [x, y] of [[3632, 1150], [3820, 1270], [3850, 1130], [3600, 1180]]) wo_try('toter_baum', x, y, wo_ns(), 4, 6);
  for (let k = 0; k < 60; k++){
    const a = R() * 6.28, r = 70 + R() * 320, x = 3720 + Math.cos(a) * r, y = 1200 + Math.sin(a) * r * .8;
    wo_try(wo_pick(R, ['stein', 'stein', 'busch', 'fels', 'toter_baum', 'busch']), x, y, wo_ns(), 6, 8);
  }
})();

/* ---------- Landsknechtslager ---------- */
(function wo_camp(){
  const R = rng(1525);
  wo_feat({ m: WM.YARD, sub: 3, e: [2990, 1320, 300, 250] });
  for (const [y, xs] of [[1200, [2770, 2880, 2990, 3100, 3210]], [1110, [2825, 2935, 3045, 3155]], [1476, [2780, 2890, 3000, 3110, 3220]], [1566, [2835, 2945, 3055, 3165]]])
    for (const x of xs) wo_try('zelt', x, y, wo_ns(), 0, 4);
  for (const [x, y] of [[2935, 1262], [3150, 1262], [2945, 1418], [3165, 1418], [2840, 1300]]){ wo_try('lagerfeuer', x, y, wo_ns(), 0, 4); wo_feat({ m: WM.ASH, e: [x, y - 2, 16, 9] }); }
  wo_try('banner', 2990, 1040, 3, 0, 2); wo_try('banner', 2850, 1340, 4, 0, -20); wo_try('banner', 3130, 1300, 5, 0, -20);
  for (let k = 0; k < 40; k++){
    const a = k / 40 * Math.PI * 2, x = 2990 + Math.cos(a) * 340, y = 1320 + Math.sin(a) * 290;
    if (Math.abs(Math.sin(a)) < .22) continue;
    wo_try('karren', x, y, wo_ns(), 0, 8);
  }
  for (let k = 0; k < 40; k++) wo_try(wo_pick(R, ['fass', 'kisten', 'spiesse', 'fass', 'kisten', 'heuhaufen', 'feuerschale']), 2720 + R() * 540, 1080 + R() * 520, wo_ns(), 4, 6);
})();

/* ---------- Raubritterburg auf Felsen ---------- */
(function wo_ruin(){
  const R = rng(1495), cx = 3548, cy = 450;
  wo_feat({ m: WM.ROCK, e: [cx, cy + 10, 300, 230] });
  wo_reserve(3520, 520, 3576, 620);   // Zugang
  for (const x of [3420, 3484]) wo_put('ruine_mauer', x, 560, wo_ns());
  for (const x of [3612, 3676]) wo_put('ruine_mauer', x, 560, wo_ns());
  wo_put('ruine_turm', 3380, 562, 1); wo_put('ruine_turm', 3712, 334, 2);
  for (const x of [3420, 3484, 3548, 3612]) wo_put('ruine_mauer', x, 330, wo_ns());
  wo_put('ruine_turm', 3384, 336, 3);
  wo_reserve(3500, 400, 3600, 500);   // Lager des Raubritters
  wo_try('lagerfeuer', 3480, 470, 1, 0, 2); wo_feat({ m: WM.ASH, e: [3480, 468, 18, 10] });
  for (const [k, x, y] of [['kisten', 3640, 420], ['fass', 3660, 440], ['fass', 3446, 400], ['toter_baum', 3640, 500], ['banner', 3548, 380], ['karren', 3440, 520]]) wo_try(k, x, y, wo_ns(), 0, 2);
  { const e = wo_tryNear('abgang', 3456, 446, wo_seedFor('abgang', 0), 2, 2); if (e){ wo_DGDOORS.push({ dg: 'keller', x: e.x, y: e.y }); wo_reserve(e.x - 16, e.y, e.x + 16, e.y + 30); } }
  for (let k = 0; k < 16; k++) wo_try(R() < .5 ? 'stein' : 'busch', 3400 + R() * 300, 360 + R() * 180, wo_ns(), 2, 4);
  // Felskranz
  for (let k = 0; k < 140; k++){
    const a = R() * 6.28, r = .78 + R() * .32, x = cx + Math.cos(a) * 300 * r, y = cy + 10 + Math.sin(a) * 230 * r;
    wo_try(R() < .6 ? 'fels' : 'stein', x, y, wo_ns(), 0, 6);
  }
  for (let k = 0; k < 160; k++){
    const x = 2950 + R() * 1140, y = 20 + R() * 820;
    if (wo_zid(x, y) !== wo_ZI.ruine) continue;
    wo_try(wo_pick(R, ['fels', 'stein', 'fichte', 'fichte', 'birke', 'busch', 'toter_baum', 'busch']), x, y, wo_ns(), 6, 8);
  }
})();

/* ---------- altes Schlachtfeld ---------- */
(function wo_battle(){
  const R = rng(1525 + 2);
  for (const [x, y] of [[3560, 2620], [3880, 2440], [3820, 2860], [3400, 2960]]){
    wo_feat({ m: WM.MOUND, big: 1, x0: x - 40, y0: y - 6, x1: x + 40, y1: y + 14, s: x });
    for (let k = 0; k < 6; k++){ const g = wo_try('grabkreuz', x - 34 + k * 13 + (R() - .5) * 3, y - 8 + (R() - .5) * 3, wo_ns(), -1, 2); if (g) wo_GRAVES.push(g); }
  }
  for (let k = 0; k < 150; k++){
    const x = 3150 + R() * 940, y = 1900 + R() * 1160;
    if (wo_zid(x, y) !== wo_ZI.schlachtfeld) continue;
    wo_try(wo_pick(R, ['spiesse', 'spiesse', 'spiesse', 'toter_baum', 'stein', 'karren', 'fass', 'busch', 'banner', 'kisten']), x, y, wo_ns(), 8, 8);
  }
  for (let k = 0; k < 26; k++){ const x = 3200 + R() * 880, y = 1950 + R() * 1100; if (wo_zid(x, y) === wo_ZI.schlachtfeld) wo_feat({ m: WM.MUD, e: [x, y, 20 + R() * 40, 10 + R() * 18], s: k }); }
})();

/* ---------- Stromland: Steg in den Strom (endet im Wasser) ---------- */
function wo_pier(x, w, y0, y1){
  y0 = Math.floor(y0 / 8) * 8; y1 = Math.ceil(y1 / 8) * 8;
  const b = wo_feat({ m: WM.BRIDGE, kind: 'holz', v: 1, x0: x - w / 2, x1: x + w / 2, y0, y1, hi: 1 });
  for (let r = y0 >> 3; r < y1 >> 3; r++) for (let c = (x - w / 2) >> 3; c < (x + w / 2) >> 3; c++){
    const i = r * wo_CW + c, edge = c === (x - w / 2) >> 3 || c === ((x + w / 2) >> 3) - 1;
    if (wo_COL[i] === 2 || r >= (y1 >> 3) - 1) wo_COL[i] = edge || r === (y1 >> 3) - 1 ? 1 : 0;
  }
  wo_reserve(x - w / 2 - 6, y0 - 16, x + w / 2 + 6, y1 + 4);
  wo_BRIDGES.push(b); return b;
}
/* Kahn auf dem Wasser (ohne Kollision; das Wasser sperrt ohnehin) */
function wo_boat(x, y, v){ const P = makeProp('kahn', wo_seedFor('kahn', v)); return P ? wo_add('kahn', x, y, P, true) : null; }

/* ---------- Reichsstadt Speyer am Rhein: Mauerring, Kaiserdom, Markt, Ratshof, Gasthaus Zum Anker, Hafen ---------- */
const wo_SPYP = {};   // besondere Bauten (Dom, Ratshof, Kran) für Leute und Geschichte
(function wo_speyer(){
  const C = wo_SPY, R = rng(1526);
  const T = makeProp('stadt_turm', 1), M = makeProp('stadt_mauer', 1);
  const tw = T.foot[0][2] - T.foot[0][0], mw = M.foot[0][2] - M.foot[0][0];
  wo_reserve(C.gx - 18, C.y0 - 40, C.gx + 18, C.y0 + 40); wo_reserve(C.gx - 18, C.y1 - 40, C.gx + 18, C.y1 + 40);
  for (const y of [C.y0, C.y1]){
    let x = C.x0 - tw / 2;
    for (const ch of 'TMMTMMGMMTMMT'){
      const w = ch === 'T' ? tw : ch === 'M' ? mw : 104, cx = x + w / 2;
      if (ch === 'T') wo_put('stadt_turm', cx, y + 1, wo_ns()); else if (ch === 'M') wo_put('stadt_mauer', cx, y, wo_ns()); else wo_put('stadt_tor', cx, y, y === C.y0 ? 1 : 2);
      x += w;
    }
  }
  const t = 24, hg = 46, yN = C.y0 + 2, yS = C.y1 - (T.foot[0][3] - T.foot[0][1]) + 2;
  wo_add('mauer', C.x0, yS, wo_wallNS(C.x0, yN, yS, t, hg, wo_GREY, true, 13, false));
  wo_add('mauer', C.x1, yS, wo_wallNS(C.x1, yN, yS, t, hg, wo_GREY, false, 15, false));
  wo_put('stadt_turm', C.x0, 1376, 4); wo_put('stadt_turm', C.x1, 1376, 5);
  wo_feat({ m: WM.SHADOW, x0: C.x1 + t / 2 + 1, x1: C.x1 + t / 2 + 10, y0: yN, y1: yS + 8 });
  wo_feat({ m: WM.SHADOW, x0: C.x0 + t / 2 + 1, x1: C.x0 + t / 2 + 8, y0: yN, y1: yS });
  wo_feat({ m: WM.YARD, sub: 0, x0: C.x0 + 12, y0: C.y0 + 2, x1: C.x1 - 12, y1: C.y1 - 4 });
  wo_reserve(C.gx - 24, C.y0, C.gx + 24, C.y1);                       // Hauptgasse
  wo_reserve(C.x0 + 14, 1364, C.x1 - 14, 1398);                       // Quergasse
  // Kaiserdom im Osten der Stadt, davor der Domnapf
  const dom = wo_put('dom', 5300, 1350, 1); wo_SPYP.dom = dom;
  wo_tryNear('becken', 5150, 1372, 1, 0, -40);
  // Marktplatz im Westen: Brunnen, Stände, Krempel
  const mk = { x0: 4740, y0: 1290, x1: 5070, y1: 1362 };
  wo_feat({ m: WM.YARD, sub: 2, x0: mk.x0, y0: mk.y0, x1: mk.x1, y1: mk.y1 });
  wo_put('brunnen', 4910, 1334, 2);
  for (const [x, y, v] of [[4790, 1306, 1], [4840, 1306, 4], [4980, 1306, 2], [5032, 1308, 5], [4790, 1356, 0], [5030, 1358, 3]]) wo_try('marktstand', x, y, wo_seedFor('marktstand', v), 1, -40);
  for (const [k, x, y] of [['fass', 4760, 1340], ['kisten', 4870, 1352], ['karren', 4960, 1352], ['fass', 5056, 1336], ['heuhaufen', 4880, 1300]]) wo_try(k, x, y, wo_ns(), 0, -40);
  // Häuserzeilen: Nordzeile über dem Markt, Südzeile an der Mauer; Ratshof und Gasthaus
  for (const x of [4762, 4846, 4930, 5014]){ const h = wo_try('stadthaus', x, 1276, wo_ns(), -2, -40); if (h) wo_HOUSES.push(h); }
  for (const x of [4762, 4846, 4930, 5014, 5168, 5252, 5336, 5420]){
    const kind = x === 5014 ? 'gasthaus_anker' : 'stadthaus', h = wo_try(kind, x, 1484, wo_ns(), -2, -40);
    if (!h) continue;
    if (kind === 'gasthaus_anker'){ wo_INNP.anker = h; wo_reserve(h.door - 14, 1486, h.door + 14, 1520); }
    else { wo_HOUSES.push(h); if (x === 4846) wo_SPYP.rat = h; }
  }
  if (wo_SPYP.rat){ wo_put('banner', wo_SPYP.rat.x - 30, 1508, 5); wo_put('banner', wo_SPYP.rat.x + 30, 1508, 6); }
  for (let k = 0; k < 18; k++) wo_try(wo_pick(R, ['fass', 'kisten', 'fass', 'karren']), C.x0 + 30 + R() * (C.x1 - C.x0 - 60), C.y0 + 30 + R() * (C.y1 - C.y0 - 60), wo_ns(), 4, 8);
  // Domgarten hinter dem Dom
  for (let k = 0; k < 10; k++) wo_try(R() < .6 ? 'apfelbaum' : 'busch', 5140 + R() * 320, 1190 + R() * 80, wo_ns(), 6, 6);
  /* ---- Hafen am Kai: Pflaster bis ans Ufer, Stege, Kran, Kähne, Ladung ---- */
  wo_feat({ m: WM.YARD, sub: 0, x0: 4700, y0: 1592, x1: 5500, y1: 1690 });
  for (const px of [4860, 5180, 5380]) wo_pier(px, 32, 1676, 1752);
  wo_SPYP.kran = wo_tryNear('kran', 5262, 1668, 1, 0, -40);
  wo_boat(4800, 1724, 1); wo_boat(4925, 1728, 0); wo_boat(5100, 1730, 2); wo_boat(5262, 1734, 1); wo_boat(5440, 1726, 1);
  for (const [k, x, y] of [['fass', 4740, 1606], ['fass', 4752, 1614], ['kisten', 4790, 1606], ['kisten', 4806, 1612], ['karren', 4950, 1604], ['fass', 5060, 1608],
    ['kisten', 5150, 1606], ['fass', 5168, 1612], ['karren', 5330, 1606], ['kisten', 5420, 1606], ['fass', 5436, 1612], ['fass', 5470, 1668], ['kisten', 4730, 1670], ['fass', 4948, 1674]])
    wo_try(k, x, y, wo_ns(), 0, -40);
  wo_try('wegweiser', 4690, 1610, 4, 0, 2);
  // Gärten und Bäume vor den Mauern
  for (let k = 0; k < 24; k++){ const x = C.x0 - 30 - R() * 120, y = C.y0 + R() * (C.y1 - C.y0 - 40); wo_try(R() < .5 ? 'apfelbaum' : 'busch', x, y, wo_ns(), 8, 10); }
  for (let k = 0; k < 24; k++){ const x = C.x1 + 40 + R() * 160, y = C.y0 + R() * (C.y1 - C.y0); wo_try(R() < .4 ? 'apfelbaum' : 'busch', x, y, wo_ns(), 8, 10); }
})();

/* ---------- Fischerdorf Altrip am Ufer: Hütten, Netze, Steg, Kähne ---------- */
const wo_ALTRIP = { x: 4440, y: 1600 };
(function wo_altrip(){
  const R = rng(1529), { x: cx, y: cy } = wo_ALTRIP;
  wo_reserve(cx - 40, cy - 30, cx + 40, cy + 40);
  for (const [x, y] of [[4316, 1540], [4566, 1534], [4300, 1640], [4590, 1632]]){ const h = wo_tryNear('fachwerkhaus', x, y, wo_ns(), 2, 4); if (h) wo_HOUSES.push(h); }
  for (const [x, y] of [[4380, 1652], [4500, 1650], [4410, 1590]]) wo_tryNear('netze', x, y, wo_ns(), 0, 3);
  wo_pier(cx, 32, 1664, 1752);
  wo_boat(cx - 62, 1722, 0); wo_boat(cx + 66, 1726, 1);
  for (const [x, y] of [[4350, 1676], [4520, 1678]]) wo_tryNear('kahn', x, y, wo_seedFor('kahn', 3), 0, 1);
  for (const [k, x, y] of [['fass', 4470, 1590], ['kisten', 4486, 1596], ['fass', 4372, 1606], ['heuhaufen', 4260, 1590], ['karren', 4620, 1580], ['lagerfeuer', 4470, 1630]]) wo_tryNear(k, x, y, wo_ns(), 0, 2);
  for (let k = 0; k < 16; k++) wo_try(R() < .6 ? 'weide' : 'busch', 4220 + R() * 460, 1460 + R() * 220, wo_ns(), 8, 8);
})();

/* ---------- Weinberge über Speyer: Rebstücke am Hang, Winzerhöfe, Wallfahrtskapelle ---------- */
(function wo_vines(){
  const R = rng(1527);
  // Rebstück: x, y (links oben), Segmente je Zeile, Zeilen
  for (const [x0, y0, nx, ny] of [[4760, 360, 6, 7], [5250, 360, 5, 8], [5470, 520, 4, 6], [4880, 620, 4, 6], [5380, 790, 4, 5], [5720, 660, 3, 8], [5840, 1010, 3, 6],
    [4620, 880, 4, 5], [5560, 980, 3, 5], [4600, 460, 3, 5], [5040, 960, 3, 4]]){
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++){
      if (i % 3 === 2 && j % 2 === 0) continue;                         // Gassen zwischen den Zeilen
      wo_try('rebzeile', x0 + i * 72 + (j & 1) * 6, y0 + j * 24, wo_ns(), 0, 6);
    }
  }
  for (const [x, y] of [[5000, 880], [5520, 620], [5780, 1180], [4720, 700]]){
    const h = wo_tryNear('fachwerkhaus', x, y, wo_ns(), 2, 4); if (!h) continue;
    wo_HOUSES.push(h);
    for (const [k, dx, dy] of [['weinfass', 64, 10], ['fass', -60, 14], ['karren', 70, 40], ['kisten', -66, 34]]) wo_tryNear(k, h.x + dx, h.y + dy, wo_ns(), 0, 2);
  }
  wo_tryNear('kapelle', 5300, 286, 2, 2, 4);
  wo_tryNear('wegkreuz', 5130, 940, 5, 0, 2); wo_tryNear('wegweiser', 5110, 1110, 6, 0, 2);
  for (let k = 0; k < 220; k++){
    const x = 4300 + R() * 1820, y = 40 + R() * 1300;
    if (wo_zid(x, y) !== wo_ZI.weinberge) continue;
    wo_try(wo_pick(R, ['busch', 'eiche', 'stein', 'busch', 'apfelbaum', 'birke']), x, y, wo_ns(), 10, 10);
  }
})();

/* ---------- Auwald am Strom: Weiden, Birken, Eichen; Altwasser; Nebel ---------- */
(function wo_auwald(){
  const R = rng(1528), S = 36;
  const CL = [[5330, 2600, 190, 120], [4820, 2060, 170, 110], [5700, 2620, 160, 110], [4520, 2480, 150, 100], [5180, 2860, 170, 100], [5980, 2240, 130, 100]];
  for (let gy = 1760; gy < WH0; gy += S) for (let gx = 4096; gx < WW0; gx += S){
    const x = gx + R() * S, y = gy + R() * S;
    if (wo_zid(x, y) !== wo_ZI.auwald) continue;
    if (CL.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < .85 + wo_fin(x, y) * .3) && R() < .92) continue;
    const n = wo_mid(x * 1.4, y * 1.4);
    if (R() > .42 + n * .35) continue;
    const w = wo_wsd(x, y), kind = w < 40 && R() < .6 ? 'weide' : R() < .16 ? 'busch' : R() < .35 ? 'birke' : R() < .6 ? 'weide' : R() < .82 ? 'eiche' : 'buche';
    wo_try(kind, x, y, wo_ns(), kind === 'busch' ? 4 : 10, 10);
  }
})();

/* ---------- Piratennest auf der Insel: Palisaden, Zelte, Feuer, Beute, Kähne, Zollturm ---------- */
const wo_ISLE = { x: 5700, y: 1786 };
(function wo_pirates(){
  const R = rng(1529 + 2), { x: cx, y: cy } = wo_ISLE;
  wo_feat({ m: WM.YARD, sub: 3, e: [cx, cy + 4, 150, 46] });
  wo_reserve(cx - 40, cy - 30, cx + 40, cy + 30);                      // Lagerplatz des Rotbart
  wo_try('lagerfeuer', cx, cy + 4, 2, 0, 2); wo_feat({ m: WM.ASH, e: [cx, cy + 2, 16, 9] });
  for (const x of [5560, 5612, 5788, 5840]) wo_tryNear('palisade', x, 1734, wo_ns(), 0, 2);
  for (const x of [5612, 5664, 5820]) wo_tryNear('palisade', x, 1852, wo_ns(), 0, 2);
  wo_tryNear('zelt', cx - 92, cy + 2, wo_seedFor('zelt', 2), 0, 2); wo_tryNear('zelt', cx + 96, cy + 8, wo_seedFor('zelt', 3), 0, 2);
  for (const [k, dx, dy] of [['kisten', -40, -22], ['fass', -52, -14], ['fass', 46, -22], ['kisten', 58, -18], ['kisten', 30, 30], ['fass', -30, 34], ['banner', 0, -40], ['karren', -140, 30]])
    wo_tryNear(k, cx + dx, cy + dy, wo_ns(), 0, 2);
  wo_tryNear('kahn', 5440, 1790, wo_seedFor('kahn', 3), 0, 1); wo_tryNear('kahn', 5480, 1820, wo_seedFor('kahn', 3), 0, 1);
  wo_boat(5560, 1694, 0); wo_boat(5900, 1640, 1);
  const tw = wo_tryNear('ruine_turm', 5904, 1740, 3, 2, 2);
  if (tw) wo_SPYP.zoll = tw;
  { const e = wo_tryNear('abgang', 5856, 1772, wo_seedFor('abgang', 0), 2, 4); if (e){ wo_DGDOORS.push({ dg: 'zollburg', x: e.x, y: e.y }); wo_reserve(e.x - 18, e.y, e.x + 18, e.y + 34); } }
  for (let k = 0; k < 40; k++){ const x = 5360 + R() * 700, y = 1650 + R() * 260; if (wo_onIsle(x, y)) wo_try(wo_pick(R, ['busch', 'weide', 'stein', 'toter_baum', 'busch']), x, y, wo_ns(), 6, 6); }
})();

/* ---------- Köhlerlichtung im Finsterwald ---------- */
const wo_CLEAR = [[620, 1000, 210, 170], [330, 640, 120, 90], [1040, 480, 110, 90], [260, 1500, 120, 100], [980, 1640, 100, 80]];
(function wo_coal(){
  for (const [x, y] of [[548, 930], [700, 1060], [520, 1090]]){ wo_add('meiler', x, y, wo_meilerImg(x)); wo_feat({ m: WM.COAL, e: [x, y - 6, 34, 22] }); }
  wo_feat({ m: WM.COAL, e: [620, 1010, 120, 90], soft: 1 });
  wo_add('koehlerhuette', 716, 940, wo_huetteImg(3));
  for (const [x, y] of [[640, 1120], [770, 990], [470, 1010], [600, 880]]) wo_add('holzstoss', x, y, wo_holzImg(x));
  wo_try('lagerfeuer', 666, 976, 4, 0, 2); wo_feat({ m: WM.ASH, e: [666, 974, 14, 8] });
  wo_try('karren', 736, 1100, 7, 0, 2); wo_try('kisten', 690, 920, 4, 0, 2); wo_try('fass', 750, 950, 5, 0, 2);
})();

/* ---------- Moor ---------- */
(function wo_moor(){
  const R = rng(1349);
  wo_reserve(570, 2690, 650, 2750);   // Hort des Lindwurms
  for (let k = 0; k < 700; k++){
    const x = R() * 1250, y = 2120 + R() * 950;
    if (wo_zid(x, y) !== wo_ZI.moor) continue;
    const n = wo_mid(x * 1.5, y * 1.5);
    if (R() > .25 + n * .6) continue;
    wo_try(wo_pick(R, ['birke', 'birke', 'birke', 'toter_baum', 'busch', 'busch', 'stein', 'toter_baum', 'weide']), x, y, wo_ns(), 6, 8);
  }
})();

/* ---------- Finsterwald ---------- */
/* ---------- Verlassenes Bergwerk im Finsterwald (feste Bildnummern, damit der Wald sonst gleich bleibt) ---------- */
(function wo_mine(){
  const cx = 330, cy = 300;
  wo_feat({ m: WM.ROCK, e: [cx, cy + 18, 120, 76] });
  const e = wo_tryNear('stollen', cx, cy, 1, 2, 4);
  if (!e) return;
  wo_DGDOORS.push({ dg: 'bergwerk', x: e.x, y: e.y });
  for (const [k, dx, dy, sd] of [['lore', 50, 24, 3], ['erz', -48, 20, 5], ['erz', 38, 50, 6], ['kisten', -42, 46, 7], ['fass', 60, 2, 8], ['lagerfeuer', -60, 62, 2]]) wo_try(k, e.x + dx, e.y + dy, sd, 0, 2);
  wo_reserve(e.x - 76, e.y - 64, e.x + 76, e.y + 72);   // Halde vor dem Stollen bleibt frei
})();
(function wo_forest(){
  const R = rng(1200), S = 34;
  for (let gy = 0; gy < WH0; gy += S) for (let gx = 0; gx < 1500; gx += S){
    const x = gx + R() * S, y = gy + R() * S;
    if (wo_zid(x, y) !== wo_ZI.wald) continue;
    let clear = false;
    for (const [cx, cy, rx, ry] of wo_CLEAR) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) clear = true;
    if (clear && R() < .9) continue;
    const n = wo_mid(x * 1.3, y * 1.3), core = clamp(1 - Math.hypot((x - 520) / 700, (y - 700) / 700), 0, 1);
    if (R() > .55 + n * .35) continue;
    const pf = .15 + core * .6 + (wo_lo(x * 3, y * 3) - .5) * .5;
    const kind = R() < .12 ? 'busch' : R() < pf ? 'fichte' : R() < .55 ? 'buche' : R() < .9 ? 'eiche' : 'toter_baum';
    wo_try(kind, x, y, wo_ns(), kind === 'busch' ? 4 : 10, 10);
  }
  // Waldrand: Büsche und Birken
  for (let k = 0; k < 500; k++){
    const x = R() * 1600, y = R() * 2200;
    if (wo_zid(x, y) === wo_ZI.wald) continue;
    const nb = [[48, 0], [-48, 0], [0, 48], [0, -48]].some(([dx, dy]) => wo_zid(x + dx, y + dy) === wo_ZI.wald);
    if (nb) wo_try(R() < .6 ? 'busch' : R() < .5 ? 'birke' : 'eiche', x, y, wo_ns(), 6, 8);
  }
})();

/* ---------- Streu: einzelne Bäume, Büsche, Steine überall ---------- */
(function wo_scatter(){
  const R = rng(1648);
  const kinds = {
    obstgarten: ['busch', 'stein', 'eiche'], burg: ['busch', 'stein', 'eiche', 'buche', 'fels'], fluss: ['weide', 'busch', 'birke', 'stein'],
    dorf: ['busch', 'eiche', 'stein', 'apfelbaum'], lager: ['busch', 'stein', 'fass'], galgen: ['busch', 'stein', 'toter_baum'],
    schlachtfeld: ['stein', 'busch', 'toter_baum'], friedhof: ['busch', 'stein'], stadt: ['busch', 'apfelbaum'], ruine: ['stein', 'busch'],
    wald: ['busch', 'stein'], moor: ['busch', 'stein'], weiler: ['busch', 'apfelbaum'],
    speyer: ['busch'], fischerdorf: ['weide', 'busch', 'stein'], weinberge: ['busch', 'stein', 'eiche', 'apfelbaum'], auwald: ['weide', 'busch', 'birke', 'eiche'], piratennest: ['busch', 'stein', 'toter_baum']
  };
  for (let k = 0; k < 2600; k++){
    const x = 20 + R() * (WW0 - 40), y = 20 + R() * (WH0 - 40), z = ZONES[wo_zid(x, y)].id;
    if (z === 'stadt' && x > wo_CITY.x0 - 20 && x < wo_CITY.x1 + 20 && y > wo_CITY.y0 - 60 && y < wo_CITY.y1 + 20) continue;
    if (z === 'speyer') continue;
    if (R() < .45) continue;
    wo_try(wo_pick(R, kinds[z]), x, y, wo_ns(), 10, 10);
  }
  // Baumstümpfe und liegende Stämme
  for (let k = 0; k < 520; k++){
    const x = 20 + R() * (WW0 - 40), y = 20 + R() * (WH0 - 40), z = ZONES[wo_zid(x, y)].id;
    if (!(z === 'wald' || (z === 'moor' && R() < .5) || (z === 'auwald' && R() < .6) || (z === 'ruine' && R() < .3) || (z === 'fluss' && R() < .2) || (z === 'burg' && R() < .15))) continue;
    const log = R() < .45, len = log ? 22 + R() * 22 | 0 : 0, w = log ? len : 10, h = log ? 7 : 7;
    if (!wo_occFree(x - w / 2 - 6, y - h - 6, x + w / 2 + 6, y + 6) || wo_wsd(x, y) < 8 || wo_rsd(x, y) < 10) continue;
    const o = { k: log ? 'log' : 'stump', x: Math.round(x), y: Math.round(y), len, s: k, birch: z === 'moor' };
    wo_GOBJ.push(o);
    wo_mark(wo_COL, x - w / 2, y - h + 1, x + w / 2, y + 1, 1); wo_markAny(wo_OCC, x - w / 2 - 2, y - h - 2, x + w / 2 + 2, y + 3, 1);
  }
})();

/* ============ Das Bergland im Süden (Version 25) ============
   Erst nach allem anderen gebaut, damit die alte Welt (Bäume, Steine, Lager) genau so bleibt wie bisher. */
const wo_BERG = {};   // besondere Orte im Bergland (für Leute, Anführer und Aufträge)
const wo_addFit = (kind, x, y, P) => wo_fits(P, Math.round(x), Math.round(y), 0, 2) ? wo_add(kind, x, y, P) : null;   // eigene Bilder (Holzstoß) nur, wo Platz ist
wo_bridgeV(2876, 48, 'stein', 3988, 3998);   // Steinbrücke am Revierweg
wo_bridgeV(548, 36, 'holz', 4222, 4234);     // Steg zur Teufelsschlucht
/* ---------- Bergstadt Annaberg: Mauerring, Kirche St. Annen, Gasthaus Zur Silbernen Kanne, Markt ---------- */
(function wo_annaberg(){
  const C = wo_ANNA, R = rng(1496), gy = C.gy;
  const T = makeProp('stadt_turm', 1), M = makeProp('stadt_mauer', 1);
  const tw = T.foot[0][2] - T.foot[0][0], mw = M.foot[0][2] - M.foot[0][0];
  wo_reserve(C.gx - 18, C.y0 - 40, C.gx + 18, C.y0 + 40); wo_reserve(C.gx - 18, C.y1 - 40, C.gx + 18, C.y1 + 40);
  for (const y of [C.y0, C.y1]){
    let x = C.x0 - tw / 2;
    for (const ch of 'TMMMGMMMT'){
      const w = ch === 'T' ? tw : ch === 'M' ? mw : 104, cx = x + w / 2;
      if (ch === 'T') wo_put('stadt_turm', cx, y + 1, wo_ns()); else if (ch === 'M') wo_put('stadt_mauer', cx, y, wo_ns()); else wo_put('stadt_tor', cx, y, y === C.y0 ? 1 : 2);
      x += w;
    }
  }
  // Seitenmauern mit Durchlass zur Quergasse, flankiert von Türmen
  const t = 24, hg = 46, yN = C.y0 + 2, yS = C.y1 - (T.foot[0][3] - T.foot[0][1]) + 2, gN = gy - 64, gS = gy + 42;
  for (const [x, left, sd] of [[C.x0, true, 21], [C.x1, false, 23]]){
    wo_add('mauer', x, gN, wo_wallNS(x, yN, gN, t, hg, wo_GREY, left, sd, true));
    wo_add('mauer', x, yS, wo_wallNS(x, gS, yS, t, hg, wo_GREY, left, sd + 1, false));
    wo_put('stadt_turm', x, gN + 2, sd); wo_put('stadt_turm', x, gS + 28, sd + 1);
    wo_feat({ m: WM.SHADOW, x0: left ? x + t / 2 + 1 : x + t / 2 + 1, x1: x + t / 2 + (left ? 8 : 10), y0: yN, y1: yS + 8 });
    wo_reserve(left ? x - 60 : x - 20, gN + 6, left ? x + 20 : x + 60, gS - 4);
  }
  wo_feat({ m: WM.YARD, sub: 0, x0: C.x0 + 12, y0: C.y0 + 2, x1: C.x1 - 12, y1: C.y1 - 4 });
  wo_reserve(C.gx - 24, C.y0, C.gx + 24, C.y1);                       // Hauptgasse
  wo_reserve(C.x0 + 14, gy - 16, C.x1 - 14, gy + 16);                 // Quergasse
  // Kirche St. Annen, Häuser mit dem Giebel zur Quergasse, Gasthaus und Bergamt im Süden
  wo_BERG.kirche = wo_put('kirche', 3050, gy - 18, 3);
  wo_reserve(3030, gy - 16, 3090, gy + 10);
  for (const x of [2700, 2790]){ const h = wo_try('stadthaus', x, gy - 18, wo_ns(), -2, -40); if (h) wo_HOUSES.push(h); }
  for (const x of [2700, 2790, 3010, 3100]){
    const kind = x === 3010 ? 'gasthaus_kanne' : 'stadthaus', h = wo_try(kind, x, 3700, wo_ns(), -2, -40);
    if (!h) continue;
    if (kind === 'gasthaus_kanne'){ wo_INNP.kanne = h; wo_reserve(h.door - 14, 3702, h.door + 14, 3734); }
    else { wo_HOUSES.push(h); if (x === 2790) wo_BERG.bergamt = h; }
  }
  // Markt zwischen Quergasse und Südzeile
  wo_feat({ m: WM.YARD, sub: 2, x0: 2700, y0: gy + 18, x1: 3130, y1: gy + 88 });
  wo_put('brunnen', 2966, gy + 56, 6);
  for (const [x, y, v] of [[2730, gy + 62, 2], [2790, gy + 64, 5], [3040, gy + 62, 1], [3100, gy + 62, 4]]) wo_try('marktstand', x, y, wo_seedFor('marktstand', v), 1, -40);
  for (const [k, x, y] of [['erz', 2850, gy + 40], ['lore', 2848, gy + 74], ['fass', 3006, gy + 34], ['kisten', 3014, gy + 80], ['karren', 2680, gy + 30], ['heuhaufen', 3150, gy + 30]]) wo_try(k, x, y, wo_ns(), 0, -40);
  // Stall und Rastplatz hinter der Nordzeile
  for (const [k, x, y] of [['heuhaufen', 2700, 3410], ['heuhaufen', 2730, 3416], ['karren', 2800, 3400], ['fass', 2830, 3420], ['zaun_h', 2690, 3440], ['zaun_h', 2722, 3440], ['brunnen', 2780, 3446]]) wo_try(k, x, y, wo_ns(), 0, -40);
  for (let k = 0; k < 14; k++) wo_try(wo_pick(R, ['fass', 'kisten', 'fass', 'erz']), C.x0 + 30 + R() * (C.x1 - C.x0 - 60), C.y0 + 30 + R() * (C.y1 - C.y0 - 60), wo_ns(), 4, 8);
  wo_try('wegweiser', C.gx + 40, C.y0 - 40, 5, 0, 2); wo_try('wegkreuz', C.gx - 46, C.y1 + 50, 6, 0, 2);
  // Gärten vor den Mauern
  for (let k = 0; k < 22; k++){ const x = C.x0 - 40 - R() * 150, y = C.y0 + R() * (C.y1 - C.y0); wo_try(R() < .5 ? 'apfelbaum' : 'busch', x, y, wo_ns(), 8, 10); }
  for (let k = 0; k < 22; k++){ const x = C.x1 + 40 + R() * 150, y = C.y0 + R() * (C.y1 - C.y0); wo_try(R() < .5 ? 'apfelbaum' : 'busch', x, y, wo_ns(), 8, 10); }
})();
/* ---------- Silberrevier: Halden, Göpel über den Schächten, Stollen, Knappenhütten ---------- */
(function wo_revier(){
  const R = rng(1471);
  wo_BERG.goepel = [];
  for (const [x, y] of [[2600, 3930], [2180, 4290], [3290, 4220], [3740, 4370], [2020, 3960], [3060, 3870]]){
    wo_feat({ m: WM.ROCK, e: [x + 10, y + 16, 110, 52] });
    const g = wo_tryNear('goepel', x, y, wo_ns(), 2, 4);
    if (!g) continue;
    wo_BERG.goepel.push(g);
    for (const [k, dx, dy] of [['erz', -56, 18], ['erz', 50, 26], ['lore', 62, 4], ['kisten', -60, -6], ['stein', -36, 36], ['stein', 30, 40]]) wo_tryNear(k, x + dx, y + dy, wo_ns(), 0, 2);
  }
  // Stollen: der verfallene Altenberg-Stollen (Bergmönch), zwei offene
  for (const [id, x, y, sd] of [['moench', 2300, 4440, 1], ['ost', 3620, 4262, 2], ['west', 1980, 4330, 3]]){
    wo_feat({ m: WM.ROCK, e: [x, y + 18, 120, 70] });
    const e = wo_tryNear('stollen', x, y, sd, 2, 4);
    if (!e) continue;
    wo_BERG['stollen_' + id] = e;
    for (const [k, dx, dy] of [['lore', 50, 24], ['erz', -48, 20], ['erz', 40, 52], ['kisten', -44, 48], ['fass', 60, 4]]) wo_try(k, e.x + dx, e.y + dy, wo_ns(), 0, 2);
    wo_reserve(e.x - 70, e.y - 50, e.x + 70, e.y + 70);
  }
  for (const [x, y] of [[2460, 3880], [3150, 4120], [2700, 4360], [1960, 4180]]){ const h = wo_tryNear('fachwerkhaus', x, y, wo_ns(), 2, 4); if (h){ wo_HOUSES.push(h); wo_addFit('holzstoss', h.x + 70, h.y + 6, wo_holzImg(h.x)); } }
  // Halden ohne Göpel: Geröll und Erz
  for (let k = 0; k < 22; k++){
    const x = 1900 + R() * 2000, y = 3800 + R() * 760;
    if (wo_zid(x, y) !== wo_ZI.silberrevier || wo_wsd(x, y) < 30) continue;
    wo_feat({ m: WM.ROCK, e: [x, y, 40 + R() * 50, 18 + R() * 20], s: k });
    for (let i = 0; i < 3; i++) wo_try(R() < .5 ? 'erz' : 'stein', x + (R() - .5) * 70, y + (R() - .5) * 30, wo_ns(), 0, 4);
  }
  for (let k = 0; k < 360; k++){
    const x = 1700 + R() * 2400, y = 3700 + R() * 900;
    if (wo_zid(x, y) !== wo_ZI.silberrevier) continue;
    wo_try(wo_pick(R, ['fichte', 'fichte', 'birke', 'stein', 'busch', 'toter_baum', 'fels', 'stein']), x, y, wo_ns(), 8, 8);
  }
})();
/* ---------- Söldnerschanze: Wall aus Schanzkörben, Geschütze, Zelte, Feuer ---------- */
(function wo_schanze(){
  const R = rng(1522), cx = 4450, cy = 3470;
  wo_BERG.schanze = { x: cx, y: cy };
  wo_feat({ m: WM.YARD, sub: 3, e: [cx, cy + 6, 230, 150] });
  wo_reserve(cx - 50, cy - 70, cx + 50, cy - 10);                      // Zelt des Feldhauptmanns
  wo_tryNear('zelt', cx, cy - 74, wo_seedFor('zelt', 3), 0, 2);
  for (const [dx, dy] of [[-40, -46], [40, -46]]) wo_tryNear('banner', cx + dx, cy + dy, wo_ns(), 0, 2);
  // Wall: Schanzkörbe im Ring, Lücken für die Wege im Westen, Norden und Südosten
  for (let k = 0; k < 64; k++){
    const a = k / 64 * Math.PI * 2, x = cx + Math.cos(a) * 270, y = cy + 10 + Math.sin(a) * 190;
    if (Math.abs(Math.sin(a)) < .16 && Math.cos(a) < 0) continue;     // Westtor
    if (Math.abs(Math.cos(a)) < .1 && Math.sin(a) < 0) continue;      // Nordtor
    if (Math.abs(a - .85) < .16) continue;                            // Südosttor
    wo_try('schanzkorb', x, y, wo_ns(), -2, 6);
  }
  // Geschütze hinter dem Wall
  for (const [dx, dy, v] of [[-200, -70, 0], [-210, 90, 0], [200, -80, 1], [180, 110, 1], [-60, 150, 0], [90, -150, 1]]) wo_tryNear('kanone', cx + dx, cy + dy, wo_seedFor('kanone', v), 0, 2);
  for (const [x, y] of [[cx - 140, cy - 20], [cx + 130, cy - 10], [cx - 120, cy + 90], [cx + 20, cy + 110], [cx + 140, cy + 80], [cx - 30, cy - 120]]) wo_tryNear('zelt', x, y, wo_ns(), 0, 2);
  for (const [x, y] of [[cx - 60, cy + 30], [cx + 70, cy + 40], [cx - 10, cy - 10]]){ wo_tryNear('lagerfeuer', x, y, wo_ns(), 0, 2); wo_feat({ m: WM.ASH, e: [x, y - 2, 16, 9] }); }
  for (let k = 0; k < 30; k++) wo_try(wo_pick(R, ['fass', 'kisten', 'spiesse', 'fass', 'karren', 'feuerschale', 'spiesse']), cx - 230 + R() * 460, cy - 150 + R() * 320, wo_ns(), 4, 6);
  for (const x of [cx - 330, cx - 280]) wo_tryNear('palisade', x, cy - 60, wo_ns(), 0, 2);
  // Vorposten an der Oststraße und Gräben voll Schlamm
  wo_tryNear('zelt', 3960, 3300, wo_ns(), 0, 2); wo_tryNear('lagerfeuer', 4010, 3330, wo_ns(), 0, 2); wo_tryNear('banner', 3920, 3330, wo_ns(), 0, 2);
  for (let k = 0; k < 18; k++){ const x = 3900 + R() * 1200, y = 3150 + R() * 700; if (wo_zid(x, y) === wo_ZI.schanze) wo_feat({ m: WM.MUD, e: [x, y, 18 + R() * 30, 8 + R() * 12], s: k }); }
  for (let k = 0; k < 220; k++){
    const x = 3700 + R() * 1600, y = 3100 + R() * 900;
    if (wo_zid(x, y) !== wo_ZI.schanze) continue;
    wo_try(wo_pick(R, ['busch', 'stein', 'toter_baum', 'spiesse', 'busch', 'birke', 'fichte']), x, y, wo_ns(), 8, 8);
  }
})();
/* ---------- Schwarzwald: dichter Tann, Lichtungen, Räuberlager, Teufelsschlucht ---------- */
const wo_SWCLEAR = [[640, 3480, 150, 100], [1480, 4420, 170, 100], [940, 3600, 150, 100], [520, 4440, 140, 110], [1660, 3820, 140, 90], [260, 3980, 110, 80], [1200, 4300, 120, 80]];
(function wo_schwarzwald(){
  const R = rng(1513), S = 30;
  // Räuberlager auf der Lichtung
  wo_BERG.raeuber = { x: 940, y: 3600 };
  wo_feat({ m: WM.YARD, sub: 3, e: [940, 3606, 110, 60] });
  wo_tryNear('lagerfeuer', 940, 3604, 3, 0, 2); wo_feat({ m: WM.ASH, e: [940, 3602, 16, 9] });
  for (const [x, y] of [[860, 3570], [1020, 3576]]) wo_tryNear('zelt', x, y, wo_ns(), 0, 2);
  for (const [k, x, y] of [['kisten', 900, 3640], ['fass', 990, 3644], ['karren', 1050, 3630], ['spiesse', 880, 3620]]) wo_tryNear(k, x, y, wo_ns(), 0, 2);
  // Teufelsschlucht: Felsklippen im Kreis, Zugang von Norden
  const tx = 520, ty = 4440;
  wo_BERG.schlucht = { x: tx, y: ty };
  wo_feat({ m: WM.ROCK, e: [tx, ty + 10, 150, 110] });
  wo_reserve(tx - 50, ty - 40, tx + 50, ty + 40);
  for (let k = 0; k < 10; k++){
    const a = -Math.PI / 2 + .6 + k / 9 * (Math.PI * 2 - 1.2), x = tx + Math.cos(a) * 140, y = ty + 14 + Math.sin(a) * 100;
    wo_tryNear('klippe', x, y, wo_ns(), -4, 2);
  }
  // Köhlerplatz
  wo_add('meiler', 1640, 3830, wo_meilerImg(1640)); wo_feat({ m: WM.COAL, e: [1640, 3824, 34, 22] });
  wo_add('holzstoss', 1720, 3800, wo_holzImg(1720)); wo_add('koehlerhuette', 1590, 3790, wo_huetteImg(9));
  // der Tann
  for (let gy = WH0 - 200; gy < WH; gy += S) for (let gx = 0; gx < 2100; gx += S){
    const x = gx + R() * S, y = gy + R() * S;
    if (wo_zid(x, y) !== wo_ZI.schwarzwald) continue;
    if (wo_SWCLEAR.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) && R() < .93) continue;
    const n = wo_mid(x * 1.3, y * 1.3);
    if (R() > .62 + n * .33) continue;
    const kind = R() < .1 ? 'busch' : R() < .78 ? 'fichte' : R() < .5 ? 'buche' : R() < .8 ? 'birke' : 'toter_baum';
    wo_try(kind, x, y, wo_ns(), kind === 'busch' ? 4 : 9, 10);
  }
  for (let k = 0; k < 300; k++){
    const x = R() * 2300, y = WH0 - 100 + R() * (WH - WH0 + 100);
    if (wo_zid(x, y) === wo_ZI.schwarzwald) continue;
    if ([[48, 0], [-48, 0], [0, 48], [0, -48]].some(([dx, dy]) => wo_zid(x + dx, y + dy) === wo_ZI.schwarzwald)) wo_try(R() < .6 ? 'busch' : 'birke', x, y, wo_ns(), 6, 8);
  }
})();
/* ---------- Hochgebirge: Fels, Geröll, Schnee; Bergsee, Almhütte, Gipfelkreuz, Rübezahls Felsenthron ---------- */
(function wo_gebirge(){
  const R = rng(1519), snow = (x, y) => wo_height(x, y) > 1.05;
  wo_BERG.thron = { x: 5720, y: 4300 };
  wo_reserve(5660, 4250, 5780, 4340);
  for (let k = 0; k < 7; k++){ const a = Math.PI + .3 + k / 6 * (Math.PI - .6), x = 5720 + Math.cos(a) * 120, y = 4310 + Math.sin(a) * 80; wo_tryNear('schneeklippe', x, y, wo_ns(), -4, 2); }
  const h = wo_tryNear('fachwerkhaus', 5180, 3880, wo_seedFor('fachwerkhaus', 3), 2, 4); if (h){ wo_HOUSES.push(h); wo_BERG.alm = h; wo_addFit('holzstoss', h.x + 70, h.y + 4, wo_holzImg(h.x)); wo_tryNear('zaun_h', h.x - 70, h.y + 20, 1, 0, 2); }
  wo_tryNear('wegkreuz', 5960, 4440, 7, 0, 2);
  for (let k = 0; k < 900; k++){
    const x = 3800 + R() * 2340, y = 3300 + R() * 1300;
    if (wo_zid(x, y) !== wo_ZI.hochgebirge) continue;
    const sn = snow(x, y), q = R();
    const kind = q < .14 ? (sn ? 'schneeklippe' : 'klippe') : q < .4 ? (sn ? 'schneefels' : 'fels') : q < .6 ? (sn ? 'schneestein' : 'stein') : q < .9 ? (sn ? 'schneefichte' : 'fichte') : (sn ? 'schneefichte' : 'toter_baum');
    wo_try(kind, x, y, wo_ns(), kind === 'stein' ? 4 : 8, 8);
  }
})();
/* ---------- Ufer des Silberbachs, Streu im Bergland, Stümpfe ---------- */
(function wo_bergStreu(){
  const R = rng(1530);
  for (let k = 0; k < wo_SBACH.length; k += 3){
    const [x, y, w] = wo_SBACH[k];
    for (const sd of [-1, 1]){
      if (R() < .5) continue;
      const z = ZONES[wo_zid(x, y + sd * (w + 20))].id, d = w + 12 + R() * 30;
      wo_try(z === 'hochgebirge' ? 'stein' : R() < .55 ? 'weide' : R() < .6 ? 'busch' : 'birke', x + (R() - .5) * 10, y + sd * d, wo_ns(), 6, 8);
    }
  }
  const kinds = { schwarzwald: ['busch', 'stein', 'fichte'], annaberg: ['busch'], silberrevier: ['stein', 'busch', 'birke'], schanze: ['busch', 'stein'], hochgebirge: ['stein', 'stein', 'fels'],
    moor: ['busch', 'stein'], friedhof: ['busch', 'stein'], schlachtfeld: ['stein', 'busch', 'toter_baum'], auwald: ['weide', 'busch', 'birke', 'eiche'] };
  for (let k = 0; k < 1300; k++){
    const x = 20 + R() * (WW0 - 40), y = WH0 + R() * (WH - WH0 - 20), z = ZONES[wo_zid(x, y)].id;
    if (z === 'annaberg' || R() < .45 || !kinds[z]) continue;
    wo_try(wo_pick(R, kinds[z]), x, y, wo_ns(), 10, 10);
  }
  for (let k = 0; k < 360; k++){
    const x = 20 + R() * (WW0 - 40), y = WH0 + R() * (WH - WH0 - 20), z = ZONES[wo_zid(x, y)].id;
    if (!(z === 'schwarzwald' || (z === 'silberrevier' && R() < .5))) continue;
    const log = R() < .45, len = log ? 22 + R() * 22 | 0 : 0, w = log ? len : 10, hh = 7;
    if (!wo_occFree(x - w / 2 - 6, y - hh - 6, x + w / 2 + 6, y + 6) || wo_wsd(x, y) < 8 || wo_rsd(x, y) < 10) continue;
    wo_GOBJ.push({ k: log ? 'log' : 'stump', x: Math.round(x), y: Math.round(y), len, s: k + 9000, birch: false });
    wo_mark(wo_COL, x - w / 2, y - hh + 1, x + w / 2, y + 1, 1); wo_markAny(wo_OCC, x - w / 2 - 2, y - hh - 2, x + w / 2 + 2, y + 3, 1);
  }
})();
/* ============ Die Ostlande (Version 26) ============
   Nach dem Bergland gebaut, damit alte Welt und Bergland genau so bleiben. Sachsen mit Wittenberg und der Dübener Heide,
   Franken mit Nürnberg, dem Reichswald und Burg Gailingen, Schwaben mit Augsburg, dem Donauried und dem Lechfeld. */
const wo_OST = {};   // besondere Orte der Ostlande (für Leute, Anführer, Aufträge und Kriegszüge)
wo_bridgeV(7950, 48, 'stein', 842, 846);     // Elbbrücke vor Wittenberg
wo_bridgeV(7300, 48, 'stein', 1597, 1601);   // Mainbrücke
wo_bridgeV(7740, 44, 'stein', 2400, 2404);   // Fleischbrücke über die Pegnitz
wo_bridgeV(7690, 48, 'holz', 3117, 3121);    // Donaubrücke
wo_bridgeH(2262, 40, 'holz', 6925, 6950);    // Steg über die Pegnitz am Auweg
wo_bridgeH(3702, 40, 'holz', 7850, 7878);    // Lechsteg
/* Stadtmauer einer Stadt der Ostlande: Nord- und Südreihe nach Muster (T Turm, M Mauer, G Tor), Seitenmauern mit Durchlässen
   (gaps: [oben, unten] je Durchlass; Wasser fließt durch einen Durchlass ohne Weg) */
function wo_ringWall(C, pat, gaps, sd){
  const T = makeProp('stadt_turm', 1), M = makeProp('stadt_mauer', 1);
  const tw = T.foot[0][2] - T.foot[0][0], mw = M.foot[0][2] - M.foot[0][0], th = T.foot[0][3] - T.foot[0][1];
  wo_reserve(C.gx - 18, C.y0 - 40, C.gx + 18, C.y0 + 40); wo_reserve(C.gx - 18, C.y1 - 40, C.gx + 18, C.y1 + 40);
  for (const y of [C.y0, C.y1]){
    let x = C.x0 - tw / 2;
    for (const ch of pat){
      const w = ch === 'T' ? tw : ch === 'M' ? mw : 104, cx = x + w / 2;
      if (ch === 'T') wo_put('stadt_turm', cx, y + 1, wo_ns()); else if (ch === 'M') wo_put('stadt_mauer', cx, y, wo_ns()); else wo_put('stadt_tor', cx, y, y === C.y0 ? 1 : 2);
      x += w;
    }
  }
  const t = 24, hg = 46, yN = C.y0 + 2, yS = C.y1 - th + 2;
  for (const [x, left, s0] of [[C.x0, true, sd], [C.x1, false, sd + 10]]){
    let y = yN, k = 0;
    for (const [g0, g1] of gaps){
      wo_add('mauer', x, g0, wo_wallNS(x, y, g0, t, hg, wo_GREY, left, s0 + k, true));
      wo_put('stadt_turm', x, g0 + 2, s0 + k); wo_put('stadt_turm', x, g1 + 28, s0 + k + 1);
      wo_reserve(left ? x - 60 : x - 20, g0 + 6, left ? x + 20 : x + 60, g1 - 4);
      y = g1; k += 2;
    }
    wo_add('mauer', x, yS, wo_wallNS(x, y, yS, t, hg, wo_GREY, left, s0 + k, false));
    wo_feat({ m: WM.SHADOW, x0: x + t / 2 + 1, x1: x + t / 2 + (left ? 8 : 10), y0: yN, y1: yS + 8 });
  }
  wo_feat({ m: WM.YARD, sub: 0, x0: C.x0 + 12, y0: C.y0 + 2, x1: C.x1 - 12, y1: C.y1 - 4 });
  wo_reserve(C.gx - 24, C.y0, C.gx + 24, C.y1);                       // Hauptgasse
}
const wo_gap = gy => [gy - 64, gy + 42];
const wo_inCity = (x, y) => [wo_WIT, wo_NUE, wo_AUG].some(C => x > C.x0 - 30 && x < C.x1 + 30 && y > C.y0 - 60 && y < C.y1 + 30);   // Durchlass für eine Quergasse
/* Häuserzeile: Liste [Art, x] an der Grundlinie y; Häuser kommen zu den Rattenpunkten */
function wo_row(y, list, store){
  for (const [kind, x, key] of list){
    const h = wo_try(kind, x, y, kind.startsWith('gasthaus') ? 1 : wo_ns(), -2, -40);
    if (!h) continue;
    if (key && store) store[key] = h;
    if (kind.startsWith('gasthaus')) wo_reserve(h.door - 14, y + 2, h.door + 14, y + 34);
    else if (kind === 'stadthaus' || kind === 'fachwerkhaus') wo_HOUSES.push(h);
  }
}
function wo_market(x0, y0, x1, y1, well, stalls, junk){
  wo_feat({ m: WM.YARD, sub: 2, x0, y0, x1, y1 });
  if (well) wo_put(well[0], well[1], well[2], well[3] || 2);
  for (const [x, y, v] of stalls) wo_try('marktstand', x, y, wo_seedFor('marktstand', v), 1, -40);
  for (const [k, x, y] of junk || []) wo_try(k, x, y, wo_ns(), 0, -40);
}
/* Gärten und Bäume vor einer Stadtmauer */
function wo_gardens(C, R, n){
  for (let k = 0; k < n; k++){ const x = C.x0 - 40 - R() * 160, y = C.y0 + R() * (C.y1 - C.y0); wo_try(R() < .5 ? 'apfelbaum' : 'busch', x, y, wo_ns(), 8, 10); }
  for (let k = 0; k < n; k++){ const x = C.x1 + 40 + R() * 160, y = C.y0 + R() * (C.y1 - C.y0); wo_try(R() < .5 ? 'apfelbaum' : 'busch', x, y, wo_ns(), 8, 10); }
}

/* ---------- Wittenberg: Schloss und Schlosskirche im Westen, Markt mit Rathaus und Stadtkirche, Cranachhof, Universität, Lutherhaus im Osten ---------- */
(function wo_wittenberg(){
  const C = wo_WIT, R = rng(1517), gy = C.gy;
  wo_ringWall(C, 'TMMMTMMGMMTMMMT', [wo_gap(gy)], 31);
  wo_reserve(C.x0 + 14, gy - 16, C.x1 - 14, gy + 16);                  // Collegienstraße
  wo_OST.schlosskirche = wo_put('schlosskirche', 7630, gy - 22, 1);
  wo_OST.schloss = wo_put('bergfried', 7752, gy - 28, 3);
  wo_row(gy - 22, [['stadthaus', 7845], ['kirche', 8080, 'stadtkirche'], ['stadthaus', 8215, 'uni'], ['stadthaus', 8305]], wo_OST);
  wo_market(7700, gy + 18, 8150, gy + 88, ['brunnen', 7860, gy + 56, 3], [[7740, gy + 62, 2], [7800, gy + 64, 5], [8040, gy + 62, 1], [8100, gy + 62, 4]],
    [['fass', 7716, gy + 30], ['kisten', 8130, gy + 80], ['karren', 7990, gy + 34]]);
  wo_row(C.y1 - 60, [['stadthaus', 7560], ['stadthaus', 7645, 'cranach'], ['gasthaus_schwan', 7730, 'innW'], ['stadthaus', 7815, 'rathaus'], ['stadthaus', 8065]], wo_OST);
  if (wo_OST.innW) wo_INNP.schwan = wo_OST.innW;
  wo_OST.lutherhaus = wo_try('kloster', 8255, C.y1 - 58, 2, -2, -40);
  if (wo_OST.rathaus){ wo_put('banner', wo_OST.rathaus.x - 30, C.y1 - 34, 7); wo_put('banner', wo_OST.rathaus.x + 30, C.y1 - 34, 8); }
  for (let k = 0; k < 12; k++) wo_try(wo_pick(R, ['fass', 'kisten', 'fass', 'karren']), C.x0 + 30 + R() * (C.x1 - C.x0 - 60), C.y0 + 30 + R() * (C.y1 - C.y0 - 60), wo_ns(), 4, 8);
  wo_try('wegweiser', C.gx + 40, C.y1 + 40, 7, 0, 2);
  wo_gardens(C, R, 20);
  // Elbwiesen mit Heuhaufen, Kähne am Ufer
  for (let k = 0; k < 16; k++){ const x = 7300 + R() * 1300, y = 760 + R() * 40; if (wo_wsd(x, y) > 20) wo_try(R() < .5 ? 'heuhaufen' : 'weide', x, y, wo_ns(), 6, 8); }
  for (const x of [7820, 8100]) wo_boat(x, 806, 1);
})();

/* ---------- Nürnberg: Kaiserburg auf dem Felsen, Sebalder und Lorenzer Stadt beiderseits der Pegnitz, Hauptmarkt mit dem Schönen Brunnen ---------- */
(function wo_nuernberg(){
  const C = wo_NUE, R = rng(1524), gy = C.gy, g2 = C.gy2;
  wo_ringWall(C, 'TMMTMMTMGMTMMTMMT', [wo_gap(gy), [2338, 2446], wo_gap(g2)], 41);
  wo_reserve(C.x0 + 14, gy - 16, C.x1 - 14, gy + 16); wo_reserve(C.x0 + 14, g2 - 16, C.x1 - 14, g2 + 16);
  // Kaiserburg: Mauer mit Tor zur Gasse, dahinter Sinwellturm, Türme und Kapelle
  wo_feat({ m: WM.YARD, sub: 1, x0: 7280, y0: 2066, x1: 7580, y1: 2176 });
  wo_OST.burgtor = wo_put('burg_tor', 7430, 2176, 1);
  for (const x of [7314, 7350, 7510, 7546]) wo_put('burg_mauer', x, 2174, wo_ns());
  wo_OST.sinwell = wo_put('bergfried', 7400, 2120, 2); wo_put('burg_turm', 7300, 2130, 3); wo_put('burg_turm', 7560, 2130, 4);
  wo_OST.burgkapelle = wo_tryNear('kapelle', 7500, 2112, 3, -2, -40);
  wo_row(gy - 22, [['fachwerkhaus', 7640, 'duerer'], ['kirche', 7860, 'sebald'], ['stadthaus', 8000], ['stadthaus', 8085], ['stadthaus', 8170]], wo_OST);
  // Hauptmarkt zwischen Sebalder Gasse und Pegnitz, Frauenkirche am Ostrand
  wo_market(7480, gy + 18, 8090, gy + 112, ['schoenerbrunnen', 7830, gy + 66, 1], [[7520, gy + 50, 1], [7580, gy + 52, 3], [7640, gy + 50, 5], [7900, gy + 52, 2], [7960, gy + 50, 0], [8020, gy + 52, 4], [7560, gy + 100, 2], [7980, gy + 102, 1]],
    [['fass', 7494, gy + 80], ['kisten', 8070, gy + 84], ['karren', 7660, gy + 98]]);
  wo_OST.frauenkirche = wo_tryNear('frauenkirche', 8160, gy + 112, 1, -2, -40);
  wo_OST.weinstadel = wo_tryNear('fachwerkhaus', 7350, 2350, wo_ns(), -2, -40);
  wo_row(g2 - 22, [['stadthaus', 7340], ['stadthaus', 7425, 'plattner'], ['gasthaus_gloecklein', 7510, 'innN'], ['stadthaus', 7600], ['kirche', 7880, 'lorenz'], ['stadthaus', 8030, 'uhrmacher'], ['stadthaus', 8115]], wo_OST);
  if (wo_OST.innN) wo_INNP.gloecklein = wo_OST.innN;
  wo_row(C.y1 - 60, [['stadthaus', 7330], ['stadthaus', 7415, 'lebkuchen'], ['stadthaus', 7500], ['stadthaus', 7585], ['stadthaus', 7900], ['stadthaus', 7985], ['stadthaus', 8070], ['stadthaus', 8155]], wo_OST);
  // Ufer der Pegnitz in der Stadt: Weiden, Fässer am Weinstadel
  for (const [k, x, y] of [['weide', 7290, 2440], ['weide', 8190, 2360], ['fass', 7410, 2366], ['fass', 7424, 2372], ['kisten', 7280, 2362]]) wo_try(k, x, y, wo_ns(), 0, -40);
  for (let k = 0; k < 16; k++) wo_try(wo_pick(R, ['fass', 'kisten', 'fass', 'karren']), C.x0 + 30 + R() * (C.x1 - C.x0 - 60), C.y0 + 30 + R() * (C.y1 - C.y0 - 60), wo_ns(), 4, 8);
  wo_try('wegweiser', C.gx + 40, C.y0 - 44, 8, 0, 2); wo_try('wegweiser', C.gx - 40, C.y1 + 50, 9, 0, 2);
  wo_gardens(C, R, 22);
  // Knoblauchsland: Gemüsefelder nordwestlich der Stadt
  for (const [x0, y0, x1, y1] of [[6930, 1980, 7090, 2080], [7100, 1960, 7200, 2060], [6960, 2100, 7110, 2190], [7120, 2090, 7190, 2180]]){
    if (!wo_occFree(x0, y0, x1, y1)) continue;
    for (let p = x0; p < x1 - 10;){
      const w = Math.min(x1 - p, 16 + (R() * 12 | 0)), f = wo_feat({ m: WM.FIELD, crop: wo_pick(R, ['green', 'green', 'plow', 'green', 'rye']), vert: true, x0: p, x1: p + w, y0, y1, s: R() * 1000 | 0 });
      wo_FIELDS.push(f); p += w;
    }
    wo_reserve(x0, y0, x1, y1);
  }
  for (const [x, y] of [[6900, 2060], [7210, 2010]]){ const h = wo_tryNear('fachwerkhaus', x, y, wo_ns(), 2, 4); if (h) wo_HOUSES.push(h); }
})();

/* ---------- Augsburg: Dom im Norden, Rathaus und Perlachturm, Weinmarkt, Fuggerhäuser, Fuggerei; Werbeplatz vor dem Tor, Donaulände ---------- */
(function wo_augsburg(){
  const C = wo_AUG, R = rng(1521), gy = C.gy;
  wo_ringWall(C, 'TMMTMGMTMMT', [wo_gap(gy)], 51);
  wo_reserve(C.x0 + 14, gy - 16, C.x1 - 14, gy + 16);
  wo_row(gy - 22, [['kirche', 7230, 'dom'], ['stadthaus', 7350], ['stadthaus', 7510, 'rathaus'], ['stadthaus', 7690]], wo_OST);
  wo_OST.perlach = wo_put('perlach', 7598, gy - 24, 1);
  wo_market(7160, gy + 18, 7720, gy + 86, ['brunnen', 7300, gy + 54, 5], [[7200, gy + 60, 3], [7250, gy + 62, 1], [7360, gy + 60, 4], [7520, gy + 60, 2], [7580, gy + 62, 0], [7650, gy + 60, 5]],
    [['fass', 7176, gy + 30], ['kisten', 7700, gy + 76], ['karren', 7480, gy + 34]]);
  wo_row(C.y1 - 60, [['stadthaus', 7170, 'fugger'], ['stadthaus', 7255], ['gasthaus_lamm', 7340, 'innA']], wo_OST);
  if (wo_OST.innA) wo_INNP.lamm = wo_OST.innA;
  // Fuggerei: zwei Zeilen kleiner Häuser an einer eigenen Gasse, mit Tor und Brunnen
  wo_OST.fuggerei = { x: 7600, y: 3898 };
  wo_feat({ m: WM.YARD, sub: 2, x0: 7470, y0: 3874, x1: 7740, y1: 3922 });
  wo_reserve(7470, 3874, 7740, 3922);
  for (const y of [3870, 3950]) for (const x of [7502, 7570, 7638, 7706]){ const h = wo_try('fuggerhaus', x, y, wo_ns(), -2, -40); if (h) wo_HOUSES.push(h); }
  wo_tryNear('brunnen', 7604, 3912, 4, 0, -40);
  for (let k = 0; k < 10; k++) wo_try(wo_pick(R, ['fass', 'kisten', 'fass', 'karren']), C.x0 + 30 + R() * (C.x1 - C.x0 - 60), C.y0 + 30 + R() * (C.y1 - C.y0 - 60), wo_ns(), 4, 8);
  wo_gardens(C, R, 18);
  // Werbeplatz der Landsknechte vor dem Nordtor: Zelt, Trommel, Fahnen
  wo_OST.werbung = { x: 7520, y: 3440 };
  wo_feat({ m: WM.YARD, sub: 3, e: [7540, 3446, 70, 36] });
  wo_tryNear('zelt', 7560, 3430, wo_seedFor('zelt', 2), 0, 2); wo_tryNear('banner', 7500, 3440, 9, 0, 2); wo_tryNear('banner', 7610, 3446, 10, 0, 2); wo_tryNear('fass', 7470, 3452, 3, 0, 2);
  // Donaulände am Nordufer bei der Brücke: Stege, Ulmer Schachteln, Ladung
  wo_OST.laende = { x: 7600, y: 3050 };
  for (const px of [7560, 7820]) wo_pier(px, 30, 3064, 3122);
  wo_boat(7510, 3118, 1); wo_boat(7616, 3120, 2); wo_boat(7870, 3124, 0);
  for (const [k, x, y] of [['fass', 7590, 3044], ['kisten', 7620, 3040], ['karren', 7650, 3046], ['fass', 7770, 3046]]) wo_try(k, x, y, wo_ns(), 0, 2);
  wo_try('wegweiser', C.gx + 40, C.y0 - 44, 10, 0, 2);
})();

/* ---------- Dübener Heide: Kiefern, Birken, Wacholder, Sandflecken, Weiher; Hünengrab (Hackelberg), Schäferei ---------- */
(function wo_heide(){
  const R = rng(1532);
  wo_OST.huenengrab = { x: 8620, y: 1220 };
  wo_feat({ m: WM.ROCK, e: [8620, 1230, 90, 50] });
  wo_reserve(8580, 1200, 8660, 1250);
  for (let k = 0; k < 9; k++){ const a = k / 9 * Math.PI * 2, x = 8620 + Math.cos(a) * 80, y = 1230 + Math.sin(a) * 46; wo_tryNear(k & 1 ? 'stein' : 'fels', x, y, wo_ns(), -4, 2); }
  const h = wo_tryNear('fachwerkhaus', 7380, 1180, wo_seedFor('fachwerkhaus', 2), 2, 4); if (h){ wo_HOUSES.push(h); wo_OST.schaeferei = h; for (let i = 0; i < 4; i++) wo_tryNear('zaun_h', h.x - 60 + i * 32, h.y + 50, 1, 0, 2); }
  for (let k = 0; k < 30; k++){ const x = 6400 + R() * 2800, y = 120 + R() * 1350; if (wo_zid(x, y) === wo_ZI.heide && wo_wsd(x, y) > 30) wo_feat({ m: WM.ROCK, e: [x, y, 30 + R() * 50, 14 + R() * 20], s: k }); }
  for (let k = 0; k < 1400; k++){
    const x = 6300 + R() * 2900, y = 60 + R() * 1460;
    if (wo_zid(x, y) !== wo_ZI.heide) continue;
    const q = R(), n = wo_mid(x * 1.6, y * 1.6);
    if (n < .4 && q < .7) continue;   // offene Heide
    const kind = q < .4 ? 'kiefer' : q < .52 ? 'birke' : q < .7 ? 'wacholder' : q < .84 ? 'busch' : q < .93 ? 'stein' : 'toter_baum';
    wo_try(kind, x, y, wo_ns(), kind === 'busch' || kind === 'stein' || kind === 'wacholder' ? 4 : 9, 9);
  }
})();

/* ---------- Reichswald: dichter Wald aus Kiefern und Eichen, Lichtungen, Zeidlerhof mit Bienenstöcken, Köhler ---------- */
const wo_RWCLEAR = [[8420, 2660, 150, 90], [7600, 2960, 130, 80], [8860, 2480, 120, 80], [6560, 2240, 130, 100], [8200, 2900, 110, 70]];
(function wo_reichswald(){
  const R = rng(1527), S = 30;
  wo_OST.zeidler = { x: 8420, y: 2660 };
  const h = wo_tryNear('fachwerkhaus', 8380, 2640, wo_seedFor('fachwerkhaus', 1), 2, 4); if (h){ wo_HOUSES.push(h); wo_addFit('holzstoss', h.x + 70, h.y + 4, wo_holzImg(h.x)); }
  for (const [x, y, v] of [[8470, 2700, 0], [8530, 2690, 1], [8320, 2700, 0]]) wo_tryNear('bienenstand', x, y, wo_seedFor('bienenstand', v), 0, 2);
  wo_add('meiler', 7620, 2960, wo_meilerImg(7620)); wo_feat({ m: WM.COAL, e: [7620, 2954, 34, 22] });
  wo_add('koehlerhuette', 7560, 2930, wo_huetteImg(11));
  for (let gy = 1900; gy < 3100; gy += S) for (let gx = 6200; gx < 9200; gx += S){
    const x = gx + R() * S, y = gy + R() * S;
    if (wo_zid(x, y) !== wo_ZI.reichswald) continue;
    if (wo_RWCLEAR.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) && R() < .93) continue;
    const n = wo_mid(x * 1.3, y * 1.3);
    if (R() > .55 + n * .35) continue;
    const kind = R() < .1 ? 'busch' : R() < .55 ? 'kiefer' : R() < .35 ? 'fichte' : R() < .6 ? 'eiche' : R() < .7 ? 'birke' : 'toter_baum';
    wo_try(kind, x, y, wo_ns(), kind === 'busch' ? 4 : 9, 10);
  }
})();

/* ---------- Burg Gailingen auf dem Felsen: Ringmauer, Bergfried, Lager der Reisigen ---------- */
(function wo_gailingen(){
  const R = rng(1381), cx = 8650, cy = 1890;
  wo_OST.gailingen = { x: cx, y: cy };
  wo_feat({ m: WM.YARD, sub: 3, e: [cx, cy + 10, 150, 80] });
  wo_reserve(cx - 30, cy - 20, cx + 30, cy + 30);
  wo_tryNear('bergfried', cx - 40, cy - 40, 5, -2, 2);
  for (let k = 0; k < 12; k++){
    const a = k / 12 * Math.PI * 2, x = cx + Math.cos(a) * 170, y = cy + 14 + Math.sin(a) * 100;
    if (Math.abs(a - Math.PI) < .3) continue;   // Tor im Westen
    wo_tryNear(k % 3 === 0 ? 'ruine_turm' : 'ruine_mauer', x, y, wo_ns(), -4, 2);
  }
  for (const [k, x, y] of [['zelt', cx + 60, cy + 20], ['lagerfeuer', cx + 10, cy + 40], ['banner', cx - 70, cy + 30], ['fass', cx + 90, cy + 50], ['kisten', cx - 20, cy + 70], ['spiesse', cx + 40, cy - 30]]) wo_tryNear(k, x, y, wo_ns(), 0, 2);
  for (let k = 0; k < 200; k++){
    const x = 8100 + R() * 1100, y = 1650 + R() * 560;
    if (wo_zid(x, y) !== wo_ZI.gailingen) continue;
    wo_try(wo_pick(R, ['fels', 'stein', 'kiefer', 'busch', 'toter_baum', 'eiche', 'wacholder']), x, y, wo_ns(), 8, 8);
  }
})();

/* ---------- Donauried: Weiden, Schilf und Tümpel an der jungen Donau, Fischerhütte ---------- */
(function wo_donauried(){
  const R = rng(1533);
  wo_OST.weibchen = { x: 7040, y: 3060 };
  const h = wo_tryNear('fachwerkhaus', 6700, 3000, wo_seedFor('fachwerkhaus', 0), 2, 4); if (h){ wo_HOUSES.push(h); wo_tryNear('netze', h.x + 70, h.y + 10, 1, 0, 3); }
  for (let k = 0; k < 24; k++){ const x = 6300 + R() * 2900, y = 2900 + R() * 500; if (wo_zid(x, y) === wo_ZI.donauried && wo_wsd(x, y) > 10) wo_feat({ m: WM.MUD, e: [x, y, 20 + R() * 34, 8 + R() * 14], s: k }); }
  for (let k = 0; k < 900; k++){
    const x = 6300 + R() * 2900, y = 2850 + R() * 600;
    if (wo_zid(x, y) !== wo_ZI.donauried) continue;
    wo_try(wo_pick(R, ['weide', 'weide', 'busch', 'busch', 'birke', 'toter_baum', 'stein']), x, y, wo_ns(), 8, 8);
  }
})();

/* ---------- Lechfeld: weite Ebene mit Hügelgräbern, Ulrichskapelle, Ungarnstein und alten Waffen ---------- */
(function wo_lechfeld(){
  const R = rng(955);
  wo_OST.ulrich = wo_tryNear('kapelle', 7200, 4380, 5, 2, 4);
  wo_OST.ungarnstein = { x: 7560, y: 4460 };
  wo_feat({ m: WM.ROCK, e: [7560, 4470, 80, 40] });
  wo_reserve(7520, 4440, 7600, 4490);
  for (const [k, dx, dy] of [['fels', -60, -10], ['stein', 50, 20], ['spiesse', -30, 30], ['spiesse', 40, -20], ['toter_baum', 80, -30]]) wo_tryNear(k, 7560 + dx, 4460 + dy, wo_ns(), 0, 2);
  for (let k = 0; k < 14; k++){ const x = 7000 + R() * 900, y = 4050 + R() * 500; if (wo_zid(x, y) === wo_ZI.lechfeld && wo_wsd(x, y) > 20 && wo_rsd(x, y) > 30) wo_feat({ m: WM.MOUND, e: [x, y, 24 + R() * 16, 12 + R() * 8], s: k }); }
  for (let k = 0; k < 700; k++){
    const x = 6200 + R() * 3000, y = 3400 + R() * 1200;
    if (wo_zid(x, y) !== wo_ZI.lechfeld || R() < .4) continue;
    wo_try(wo_pick(R, ['busch', 'stein', 'busch', 'birke', 'spiesse', 'toter_baum', 'eiche']), x, y, wo_ns(), 10, 10);
  }
})();

/* ---------- Alpen im Südosten: wie das Hochgebirge, mit Schnee oben ---------- */
(function wo_alpen(){
  const R = rng(1534), snow = (x, y) => wo_height(x, y) > 1.05;
  for (let k = 0; k < 900; k++){
    const x = 6150 + R() * 3060, y = 3500 + R() * 1100;
    if (wo_zid(x, y) !== wo_ZI.hochgebirge) continue;
    const sn = snow(x, y), q = R();
    const kind = q < .14 ? (sn ? 'schneeklippe' : 'klippe') : q < .4 ? (sn ? 'schneefels' : 'fels') : q < .6 ? (sn ? 'schneestein' : 'stein') : q < .9 ? (sn ? 'schneefichte' : 'fichte') : (sn ? 'schneefichte' : 'toter_baum');
    wo_try(kind, x, y, wo_ns(), kind === 'stein' ? 4 : 8, 8);
  }
})();

/* ---------- Ufer der Flüsse, Streu in den Ostlanden, Stümpfe ---------- */
(function wo_ostStreu(){
  const R = rng(1535);
  for (const L of [wo_ELBE, wo_PEG, wo_DON, wo_LECH, wo_RIVER]) for (let k = 0; k < L.length; k += 4){
    const [x, y, w] = L[k];
    if (x < WW0 + 150) continue;
    for (const sd of [-1, 1]){
      if (R() < .55) continue;
      const z = ZONES[wo_zid(x, y + sd * (w + 20))].id, d = w + 12 + R() * 30;
      if (z === 'wittenberg' || z === 'nuernberg' || z === 'augsburg') continue;
      wo_try(z === 'hochgebirge' ? 'stein' : R() < .6 ? 'weide' : R() < .6 ? 'busch' : 'birke', x + (R() - .5) * 10, y + sd * d, wo_ns(), 6, 8);
    }
  }
  const kinds = { heide: ['busch', 'stein', 'wacholder', 'kiefer'], reichswald: ['busch', 'stein', 'kiefer'], gailingen: ['stein', 'busch'], donauried: ['weide', 'busch'], lechfeld: ['busch', 'stein'], hochgebirge: ['stein', 'fels'],
    wittenberg: ['busch', 'apfelbaum'], nuernberg: ['busch', 'apfelbaum'], augsburg: ['busch', 'apfelbaum'], weinberge: ['busch', 'stein'], auwald: ['weide', 'busch', 'birke'] };
  for (let k = 0; k < 1800; k++){
    const x = WW0 + 20 + R() * (WW - WW0 - 40), y = 20 + R() * (WH - 40), z = ZONES[wo_zid(x, y)].id;
    if (R() < .45 || !kinds[z]) continue;
    if ((z === 'wittenberg' || z === 'nuernberg' || z === 'augsburg') && wo_inCity(x, y)) continue;
    wo_try(wo_pick(R, kinds[z]), x, y, wo_ns(), 10, 10);
  }
  for (let k = 0; k < 420; k++){
    const x = WW0 + 20 + R() * (WW - WW0 - 40), y = 20 + R() * (WH - 40), z = ZONES[wo_zid(x, y)].id;
    if (!(z === 'reichswald' || (z === 'heide' && R() < .4) || (z === 'donauried' && R() < .5))) continue;
    const log = R() < .45, len = log ? 22 + R() * 22 | 0 : 0, w = log ? len : 10, hh = 7;
    if (!wo_occFree(x - w / 2 - 6, y - hh - 6, x + w / 2 + 6, y + 6) || wo_wsd(x, y) < 8 || wo_rsd(x, y) < 10) continue;
    wo_GOBJ.push({ k: log ? 'log' : 'stump', x: Math.round(x), y: Math.round(y), len, s: k + 19000, birch: z === 'donauried' });
    wo_mark(wo_COL, x - w / 2, y - hh + 1, x + w / 2, y + 1, 1); wo_markAny(wo_OCC, x - w / 2 - 2, y - hh - 2, x + w / 2 + 2, y + 3, 1);
  }
})();

PROPS.sort((a, b) => a.y - b.y || a.x - b.x);
const APPLE_TREES = PROPS.filter(p => p.apple);

/* ============ Erreichbarkeit (Flutfüllung) ============ */
/* Knoten (i, j): Ritter bei x = 8i + 8, y = 8j + 6; braucht die Zellen (i, j) und (i + 1, j) frei */
const wo_REACH = new Uint8Array(wo_CW * wo_CH);
const START = { x: 1900, y: 1318 };
(function wo_flood(){
  const free = i => wo_COL[i] === 0 && wo_COL[i + 1] === 0 && (i % wo_CW) < wo_CW - 1;
  const seen = new Uint8Array(wo_CW * wo_CH), Q = new Int32Array(wo_CW * wo_CH);
  let s = ((START.y - 6) >> 3) * wo_CW + ((START.x - 8) >> 3);
  if (!free(s)) for (let d = 1; d < 20 && !free(s); d++) s += 1;
  let qh = 0, qt = 0; Q[qt++] = s; seen[s] = 1;
  while (qh < qt){
    const i = Q[qh++]; wo_REACH[i] = 1; wo_REACH[i + 1] = 1;
    const c = i % wo_CW;
    for (const n of [i - 1, i + 1, i - wo_CW, i + wo_CW]){
      if (n < 0 || n >= wo_CW * wo_CH || seen[n]) continue;
      const nc = n % wo_CW; if (Math.abs(nc - c) > 1) continue;
      seen[n] = 1; if (free(n)) Q[qt++] = n;
    }
  }
})();
/* ein Punkt, an dem der Ritter stehen kann und der vom Start erreichbar ist */
function wo_ok(x, y){
  if (x < 10 || y < 10 || x > WW - 10 || y > WH - 4) return false;
  if (boxBlocked(x - 6, y - 5, x + 6, y)) return false;
  const c0 = Math.floor((x - 6) / 8), c1 = Math.floor((x + 5.99) / 8), r0 = Math.floor((y - 5) / 8), r1 = Math.floor((y - .01) / 8);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (!wo_REACH[r * wo_CW + c]) return false;
  return true;
}

/* ============ Schnittstelle ============ */
function boxBlocked(x0, y0, x1, y1, wade){
  if (x0 < 0 || y0 < 0 || x1 > WW || y1 > WH) return true;
  const c0 = x0 >> 3, c1 = Math.min(wo_CW - 1, (Math.ceil(x1) - 1) >> 3), r0 = y0 >> 3, r1 = Math.min(wo_CH - 1, (Math.ceil(y1) - 1) >> 3);
  for (let r = r0; r <= r1; r++){
    const o = r * wo_CW;
    for (let c = c0; c <= c1; c++){ const v = wo_COL[o + c]; if (v === 1 || (v === 2 && !wade && !wo_ICE)) return true; }
  }
  return false;
}
function randomWalkable(x, y, rMin, rMax){
  for (let k = 0; k < 40; k++){
    const a = Math.random() * Math.PI * 2, r = rMin + Math.random() * (rMax - rMin), px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
    if (wo_ok(px, py)) return { x: px, y: py };
  }
  return null;
}
/* Lager der Anführer */
function wo_near(x, y){   // nächster gültiger Punkt
  for (let r = 0; r < 120; r += 4) for (let k = 0; k < 16; k++){ const a = k / 16 * 6.283, px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r); if (wo_ok(px, py)) return { x: px, y: py }; if (!r) break; }
  return { x, y };
}
const LAIRS = { raubritter: wo_near(3550, 452), lindwurm: wo_near(610, 2722), tod: wo_near(2080, 2812), rotbart: wo_near(5700, 1762), wels: wo_near(5330, 2578),
  tatzelwurm: wo_near(520, 4450), bergmoench: wo_near(2300, 4490), feldhauptmann: wo_near(4450, 3440), ruebezahl: wo_near(5720, 4300),
  hackelberg: wo_near(8620, 1280), eppelein: wo_near(8650, 1940), donauweibchen: wo_near(7040, 3070), bulcsu: wo_near(7560, 4510) };

/* ============ Erscheinungspunkte ============ */
const SPAWNS = (() => {
  const R = rng(666), S = { wieder: [], ratte: [], pluend: [], armbrust: [], werwolf: [], moor: [], irrlicht: [], rabe: [], pirat: [], pschuetze: [], nix: [],
    wolf: [], schrat: [], wegelagerer: [], kobold: [], grubengeist: [], doppelsoeldner: [], hakenschuetze: [], baer: [], geier: [], eislicht: [],
    kreuzotter: [], strauchdieb: [], irrwisch: [], keiler: [], moosweib: [], reisiger: [], riesenkrebs: [], geisterreiter: [], geisterbogner: [] };
  const add = (k, x, y) => { const p = wo_ok(x, y) ? { x: Math.round(x), y: Math.round(y) } : null; if (p && !S[k].some(q => Math.abs(q.x - p.x) < 40 && Math.abs(q.y - p.y) < 40)) S[k].push(p); };
  const inZone = (zs, n, k, y0, y1) => { for (let t = 0; t < n * 30 && n > 0; t++){ const x = R() * WW0, y = y0 === undefined ? R() * WH0 : y0 + R() * (y1 - y0); if (zs.includes(ZONES[wo_zid(x, y)].id)){ const l = S[k].length; add(k, x, y); if (S[k].length > l) n--; } } };
  for (const g of wo_GRAVES) add('wieder', g.x + (R() - .5) * 8, g.y + 14);
  for (const h of wo_HOUSES) for (const dx of [-30, 0, 30]) add('ratte', h.x + dx, h.y + 10);
  inZone(['stadt', 'dorf', 'fluss'], 30, 'ratte');
  inZone(['obstgarten', 'galgen', 'schlachtfeld'], 40, 'wieder');
  inZone(['obstgarten', 'burg', 'stadt', 'dorf', 'schlachtfeld', 'lager', 'ruine'], 90, 'pluend');
  inZone(['burg', 'stadt', 'wald', 'lager', 'ruine'], 80, 'armbrust');
  inZone(['wald'], 70, 'werwolf');
  inZone(['moor'], 50, 'irrlicht');
  inZone(['wald', 'friedhof', 'galgen', 'schlachtfeld'], 50, 'rabe');
  inZone(['weinberge'], 40, 'pluend'); inZone(['weinberge'], 30, 'armbrust'); inZone(['weinberge'], 20, 'rabe');
  inZone(['auwald'], 30, 'werwolf');
  inZone(['piratennest'], 30, 'pirat'); inZone(['piratennest'], 20, 'pschuetze');
  // Nöcke an den Ufern von Strom und Altwasser im Auwald
  for (let t = 0; t < 8000 && S.nix.length < 40; t++){
    const x = 4100 + R() * 2040, y = 1700 + R() * 1370, w = wo_wsd(x, y);
    if (w > 5 && w < 20 && ZONES[wo_zid(x, y)].id === 'auwald') add('nix', x, y);
  }
  // Moorleichen an Tümpelrändern und Ufern
  for (let t = 0; t < 6000 && S.moor.length < 60; t++){
    const x = R() * WW0, y = 1700 + R() * 1370, w = wo_wsd(x, y);
    if (w > 6 && w < 18 && ['moor', 'fluss', 'auwald'].includes(ZONES[wo_zid(x, y)].id)) add('moor', x, y);
  }
  // Bergland
  const B0 = WH0 - 100, B1 = WH;
  inZone(['schwarzwald'], 50, 'wolf', B0, B1); inZone(['schwarzwald'], 40, 'schrat', B0, B1); inZone(['schwarzwald', 'silberrevier'], 50, 'wegelagerer', B0, B1);
  inZone(['silberrevier'], 50, 'kobold', B0, B1);
  for (const k of ['stollen_moench', 'stollen_ost', 'stollen_west']){ const e = wo_BERG[k]; if (e) for (let i = 0; i < 6; i++) add('grubengeist', e.x + (R() - .5) * 240, e.y + 40 + R() * 160); }
  inZone(['silberrevier'], 30, 'grubengeist', B0, B1);
  inZone(['schanze'], 50, 'doppelsoeldner', B0, B1); inZone(['schanze'], 40, 'hakenschuetze', B0, B1);
  inZone(['hochgebirge'], 40, 'baer', B0, B1); inZone(['hochgebirge'], 40, 'geier', B0, B1); inZone(['hochgebirge'], 30, 'eislicht', B0, B1);
  // Ostlande: nur rechts der alten Welt suchen
  const inEast = (zs, n, k) => { for (let t = 0; t < n * 40 && n > 0; t++){ const x = WW0 + R() * (WW - WW0), y = R() * WH; if (zs.includes(ZONES[wo_zid(x, y)].id)){ const l = S[k].length; add(k, x, y); if (S[k].length > l) n--; } } };
  inEast(['heide'], 50, 'kreuzotter'); inEast(['heide', 'reichswald', 'gailingen'], 60, 'strauchdieb'); inEast(['heide', 'donauried'], 40, 'irrwisch');
  inEast(['reichswald'], 50, 'keiler'); inEast(['reichswald'], 40, 'moosweib'); inEast(['gailingen'], 40, 'reisiger');
  const gl = wo_OST.gailingen; if (gl) for (let i = 0; i < 8; i++) add('reisiger', gl.x + (R() - .5) * 300, gl.y + (R() - .5) * 180);
  for (let t = 0; t < 8000 && S.riesenkrebs.length < 40; t++){ const x = WW0 + R() * (WW - WW0), y = 2800 + R() * 700, w = wo_wsd(x, y); if (w > 5 && w < 22 && ZONES[wo_zid(x, y)].id === 'donauried') add('riesenkrebs', x, y); }
  inEast(['lechfeld'], 50, 'geisterreiter'); inEast(['lechfeld'], 40, 'geisterbogner');
  return S;
})();
