// Bildbogen von Weltbauten: node ../werkzeuge/bauten.mjs art[:Bildnummer[:Jahreszeit]] … [--datei name.png]
// Jede Art steht auf Wiese, mit Fußfläche (rot) und Ankerpunkt; so lassen sich neue Bauten schnell prüfen.
import { chromium, OUT, PAGE } from '../pfad.mjs';
import fs from 'fs';
const args = process.argv.slice(2), fi = args.indexOf('--datei'), file = fi >= 0 ? args.splice(fi, 2)[1] : 'bauten.png';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
const url = await p.evaluate(list => {
  const items = list.map(a => { const [kind, seed, sea] = a.split(':'); const s0 = wp_SEA; if (sea) wp_season(+sea); const P = makeProp(kind, +(seed || 1)); if (sea) wp_season(s0); return { kind, P }; }).filter(o => o.P);
  const pad = 16, W2 = items.reduce((a, o) => a + o.P.img.width + pad, pad), H2 = Math.max(...items.map(o => o.P.img.height)) + pad * 2 + 20;
  const c = document.createElement('canvas'); c.width = W2; c.height = H2;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#4e5b2d'; g.fillRect(0, 0, W2, H2);
  let x = pad;
  for (const { kind, P } of items){
    const ox = x, oy = H2 - pad - 20 - P.img.height;
    g.drawImage(P.img, ox, oy);
    g.strokeStyle = 'rgba(255,40,60,.8)'; g.lineWidth = 1;
    for (const f of P.foot) g.strokeRect(ox + (P.ax + f[0]) * 2 + .5, oy + (P.ay + f[1]) * 2 + .5, (f[2] - f[0]) * 2, (f[3] - f[1]) * 2);
    g.fillStyle = '#ffd541'; g.fillRect(ox + P.ax * 2 - 2, oy + P.ay * 2 - 2, 5, 5);
    g.fillStyle = '#fff'; g.font = '12px monospace'; g.fillText(kind, ox, H2 - 8);
    x += P.img.width + pad;
  }
  return c.toDataURL();
}, args);
fs.writeFileSync(OUT + file, Buffer.from(url.split(',')[1], 'base64'));
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : 'gespeichert ' + OUT + file);
await b.close();
