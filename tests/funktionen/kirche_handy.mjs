// Kirche auf dem Handy (quer und hoch): Raum, Gespräch mit dem Ablassprediger, Tafel
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(); let fehl = 0;
for (const [name, opt] of [['quer', { viewport: { width: 844, height: 390 } }], ['hoch', { viewport: { width: 390, height: 780 } }]]){
  const ctx = await b.newContext(Object.assign({ isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, opt)), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto(PAGE);
  await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
  await p.evaluate(() => { const h = freshHero('Hans', 'reich'); h.lvl = 10; h.gold = 900; startGame(h); $('banner').hidden = true; });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const c = CH_BY.kaiserdom, k = G.knight; k.x = c.dx; k.y = c.y + 14; k.dir = 'up'; updateNear(true); talk(); k.x = 400; k.y = 330; });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: OUT + 'kh_' + name + '_raum.png' });
  const r = await p.evaluate(() => { openTalk(chRoom(G.inside).clergyN[1]); const t = $('ovTalk').getBoundingClientRect(); return { inside: G.inside && G.inside.id, talk: [Math.round(t.width), Math.round(t.height)], scroll: document.documentElement.scrollWidth - innerWidth, knoepfe: [...$('talkBody').querySelectorAll('button')].map(x => x.textContent) }; });
  await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + 'kh_' + name + '_ablass.png' });
  console.log(name, JSON.stringify(r));
  if (r.inside !== 'kaiserdom' || r.scroll > 0) fehl++;
  if (errs.length){ fehl++; console.log('FEHLER', errs.join(' | ')); }
  await ctx.close();
}
console.log(fehl ? 'FEHL ' + fehl : 'keine Fehler');
await b.close();
