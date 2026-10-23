import { chromium, devices, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const browser = await chromium.launch();
for (const [name, vp] of [['port', { width: 390, height: 844 }], ['land', { width: 844, height: 390 }]]){
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto(MOBILE, { waitUntil: 'load' });
  await p.waitForTimeout(500);
  await p.fill('#heroName', 'Hans');
  await (await p.$('.cabinet')).screenshot({ path: OUT + 'mob_' + name + '_start.png' }); await p.tap('#formNew button[type=submit]');
  await p.waitForTimeout(400);
  await p.evaluate(() => { const n = NPCS[0]; G.knight.x = n.x; G.knight.y = n.y + 14; HERO.quests.push({ id: 'v1', n: 2 }); renderTracker(); HERO.horse = 'zelter'; HERO.riding = true; renderSkills(); });
  await p.waitForTimeout(2400);
  await (await p.$('.cabinet')).screenshot({ path: OUT + 'mob_' + name + '.png' });
  await p.tap('#btnTalk');
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + 'mob_' + name + '_talk.png' });
  await p.evaluate(() => closePanel());
  await p.evaluate(() => openBag());
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + 'mob_' + name + '_bag.png' });
  console.log(name, errs.join('\n') || 'ok');
  await ctx.close();
}
await browser.close();
