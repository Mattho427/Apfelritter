// Bildschirmfotos an Weltorten: node ../werkzeuge/orte.mjs name:x,y name:x,y ... (Weltpixel)
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
await p.evaluate(() => { window.__wx = 'klar'; window.__season = +(new URLSearchParams(location.search).get('s') || 1); const hr = +(new URLSearchParams(location.search).get('h') || 12), t = Date.now() / 1000, cur = (t / DAY_LEN % 1) * 24; window.__skyShift = ((hr - cur + 24) % 24) / 24 * DAY_LEN; const h = freshHero('Hans', 'reich'); h.lvl = 30; startGame(h); $('banner').hidden = true; setInterval(() => { if (G.knight.hp > 0) G.knight.hp = ST.hp; }, 200); });
for (const arg of process.argv.slice(2)){
  const [name, xy] = arg.split(':'), [x, y] = xy.split(',').map(Number);
  const r = await p.evaluate(([x, y]) => { const q = wo_near(x, y), k = G.knight; k.x = q.x * WS; k.y = q.y * WS; G.mons.length = 0; updateZone(true); return { zone: G.zone, at: [q.x, q.y] }; }, [x, y]);
  await p.waitForTimeout(2500);
  await (await p.$('canvas')).screenshot({ path: OUT + 'ort_' + name + '.png' });
  console.log(name, JSON.stringify(r));
}
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : 'keine Fehler');
await b.close();
