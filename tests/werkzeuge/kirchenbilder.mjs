// Zeichnet die Kirchenbauten der Welt einzeln (mit Ankerpunkt und Raster), um Türen zu finden
import { chromium, OUT, PAGE } from '../pfad.mjs';
import fs from 'fs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
const res = await p.evaluate(() => {
  const out = [];
  for (const p of GPROPS.filter(p => ['kirche', 'kapelle', 'kloster', 'dom'].includes(p.kind))){
    if (p.lz) propLazy(p);
    const im = p.img, S = 2, c = document.createElement('canvas'); c.width = im.width * S + 40; c.height = im.height * S + 40;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#6a8a4a'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(im, 20, 20, im.width * S, im.height * S);
    g.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 0; x < im.width; x += 10) g.fillRect(20 + x * S, 0, 1, 18); for (let y = 0; y < im.height; y += 10) g.fillRect(0, 20 + y * S, 18, 1);
    g.fillStyle = '#ff0040'; g.fillRect(20 + p.ax * S - 3, 20 + p.ay * S - 3, 7, 7);
    out.push({ kind: p.kind, v: p.v, x: p.x, y: p.y, ax: p.ax, ay: p.ay, w: im.width, h: im.height, url: c.toDataURL(), rects: p.rects || p.box || null, door: p.door || null });
  }
  return out;
});
for (const [i, r] of res.entries()){ fs.writeFileSync(OUT + 'kirche_' + i + '_' + r.kind + '.png', Buffer.from(r.url.split(',')[1], 'base64')); delete r.url; console.log(i, JSON.stringify(r)); }
await b.close();
