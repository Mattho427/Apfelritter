import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const sea = +(process.argv[2] || 0);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1000, height: 1000 } });
await ctx.addInitScript(s => { window.__season = s; window.__wx = 'klar'; window.__fest = true; }, sea);
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(400);
await p.fill('#heroName', 'Spiel'); await p.press('#heroName', 'Enter');
await p.waitForTimeout(500);
await p.evaluate(() => { window.__skyShift = 12 / 24 * DAY_LEN - (Date.now() / 1000 % DAY_LEN); HERO.gold = 100; HERO.lvl = 6; refreshStats(); });
await p.waitForTimeout(300);
await p.evaluate(() => { const n = NPCS.find(n => n.fest && !n.festShop); G.knight.x = n.x; G.knight.y = n.y + 18; $('banner').hidden = true; });
await p.waitForTimeout(400);
await p.keyboard.press('KeyE'); await p.waitForTimeout(300);
console.log('opts', await p.evaluate(() => [...document.querySelectorAll('#talkBody [data-k]')].map(b => b.dataset.k + ':' + b.textContent).join(' | ')));
await p.keyboard.press('Digit1'); await p.waitForTimeout(200);
await p.keyboard.press('Digit1'); await p.waitForTimeout(400);   // Mitmachen
console.log('game', await p.evaluate(() => G.fgame && G.fgame.kind));
// Spieler im Spiel: drücken, wenn es passt
await p.evaluate(() => {
  const tick = () => {
    const g = G.fgame;
    if (g){
      if (g.kind === 'klettern') atkHeld = g.st === 'climb' && Math.abs(Math.sin(g.ph)) < (.5 - g.stage * .06) * .8;
      if (g.kind === 'springen') atkHeld = g.st === 'run' && g.x > g.fx - 64 + 4 && g.x < g.fx - 64 + g.zw - 4;
      if (g.kind === 'stein') atkHeld = g.st === 'ready' || (g.st === 'charge' && g.pw < .97);
      if (g.kind === 'schnee'){
        const k = G.knight, c = g.kids.find(c => !c.gone);
        if (c){ k.x += (c.x - 90 - k.x) * .2; k.y += (c.y - k.y) * .2; k.dir = 'right'; if (Math.random() < .2) fgThrow(); }
      }
    } else atkHeld = false;
    requestAnimationFrame(tick);
  };
  tick();
});
let shot = false;
for (let i = 0; i < 300; i++){
  await p.waitForTimeout(100);
  const st = await p.evaluate(() => G.fgame ? G.fgame.kind + ':' + (G.fgame.st || '') + ':' + (G.fgame.stage ?? G.fgame.round ?? G.fgame.tries ?? G.fgame.time) : null);
  if (!shot && st && i > 12){ shot = true; await (await p.$('#game')).screenshot({ path: 'g_' + sea + '.png' }); }
  if (!st) break;
}
console.log('end', await p.evaluate(() => JSON.stringify({ done: HERO.festDone, gold: HERO.gold, inv: HERO.inv.filter(Boolean).map(i => i.n), mode: G.mode })));
console.log(await p.evaluate(() => [...document.querySelectorAll('#log p')].slice(-2).map(d => d.textContent).join(' | ')));
console.log(errs.join('\n') || 'ok');
await browser.close();
