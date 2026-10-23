import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1000, height: 1000 } });
await ctx.addInitScript(() => { window.__season = 1; window.__wx = 'klar'; });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(400);
await p.fill('#heroName', 'Jäger'); await p.press('#heroName', 'Enter');
await p.waitForTimeout(300);
await p.evaluate(() => { HERO.lvl = 9; refreshStats(); G.knight.hp = ST.hp; const s = LIFE_SPOTS.find(s => s.k === 'wildschwein'); G.knight.x = 3800; G.knight.y = 2600; });
await p.waitForTimeout(1500);
console.log(await p.evaluate(async () => {
  const k = G.knight, s = LIFE_SPOTS.find(s => s.k === 'wildschwein'); s.x = k.x + 40; s.y = k.y + 30; s.act = true; s.ents = []; lifeMake(s, true); const e = s.ents[0]; if (!e) return 'no boar';
  e.st = 'idle'; e.x = k.x + 60; e.y = k.y + 30; console.log(e.art.w); k.dir = 'right';
  huntHit(e, { dmg: 5, crit: false });
  const out = [];
  for (let i = 0; i < 16; i++){ await new Promise(r => setTimeout(r, 150)); out.push(e.st + ' d' + Math.round(Math.hypot(e.x - k.x, e.y - k.y)) + ' t' + e.t.toFixed(1) + ' khp' + k.hp + ' inv' + k.inv.toFixed(2) + ' mode ' + G.mode); }
  return out.join('\n');
}));
console.log(errs.join('\n') || 'ok');
await browser.close();
