// Bildbogen der Gegner: node ../werkzeuge/gegnerbilder.mjs wolf baer ... → tests/ausgabe/gb_<namen>.png (vierfach, alle Posen)
import { chromium, OUT, PAGE } from '../pfad.mjs';
import fs from 'fs';
const b = await chromium.launch(), p = await (await b.newContext()).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
const kinds = process.argv.slice(2);
const url = await p.evaluate(kinds => {
  const S = 4, rows = kinds.map(k => artOf(k)).filter(Boolean);
  const W = Math.max(...rows.map(a => (a.idle.r.length + a.move.r.length + a.act.r.length) * (a.w + 6))) * S, H = rows.reduce((s, a) => s + (a.h + 10) * S, 0);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#6a7458'; g.fillRect(0, 0, W, H);
  let y = 0;
  for (const a of rows){
    let x = 0;
    for (const set of ['idle', 'move', 'act']) for (const f of a[set].r){
      g.fillStyle = set === 'act' ? '#7a6a58' : set === 'move' ? '#5e6a50' : '#6a7458'; g.fillRect(x, y, (a.w + 6) * S, (a.h + 10) * S);
      g.drawImage(f.img, x + 3 * S, y + 5 * S, a.w * S, a.h * S); if (f.glow) g.drawImage(f.glow, x + 3 * S, y + 5 * S, a.w * S, a.h * S);
      g.fillStyle = '#ff0'; g.fillRect(x + (3 + a.ax) * S, y + (5 + a.ay) * S, S, S);
      x += (a.w + 6) * S;
    }
    y += (a.h + 10) * S;
  }
  return c.toDataURL();
}, kinds);
fs.writeFileSync(OUT + 'gb_' + kinds.join('_') + '.png', Buffer.from(url.split(',')[1], 'base64'));
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : 'ok');
await b.close();
