import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1000, height: 1000 } });
await ctx.addInitScript(() => { window.__season = 1; window.__wx = 'klar'; });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(400);
await p.fill('#heroName', 'Jäger'); await p.press('#heroName', 'Enter');
await p.waitForTimeout(300);
const c = await p.$('#game');
// zu einem Rudel Rehe
const info = await p.evaluate(() => {
  HERO.lvl = 9; refreshStats(); G.knight.hp = ST.hp; window.__skyShift = 12 / 24 * DAY_LEN - (Date.now() / 1000 % DAY_LEN);
  const s = LIFE_SPOTS.find(s => s.k === 'reh'); G.knight.x = s.x - 140; G.knight.y = s.y; return s.k + ' ' + s.x + ',' + s.y;
});
await p.waitForTimeout(1500);
const hunt = async (kind) => p.evaluate(async (kind) => {
  const k = G.knight, log = [];
  for (let n = 0; n < 12; n++){
    const e = huntTargets(k, 3000).find(e => e.k === kind);
    if (!e) return log.concat('none');
    e.st = 'idle'; e.t = 5; e.x = k.x + 26; e.y = k.y; k.dir = 'right';
    attack();
    await new Promise(r => setTimeout(r, 450));
    log.push((e.gone ? 'dead' : 'hp ' + e.hp + '/' + e.max) + ' st ' + e.st);
    if (e.gone) break;
  }
  return log;
}, kind);
console.log('spot', info, await hunt('reh'));
await p.waitForTimeout(500);
await c.screenshot({ path: 'h_loot.png' });
// Beute einsammeln
await p.evaluate(() => { for (const a of G.loot) { G.knight.x = a.x; G.knight.y = a.y; } });
await p.waitForTimeout(300);
await p.evaluate(() => { for (const a of G.loot.slice()) { a.z = 0; a.vz = 0; pickUp(a) && G.loot.splice(G.loot.indexOf(a), 1); } });
console.log('inv', await p.evaluate(() => HERO.inv.filter(Boolean).map(it => itemName(it) + ' v' + it.v).join(', ')));
// Wildschwein
const boar = await p.evaluate(async () => {
  const s = LIFE_SPOTS.find(s => s.k === 'wildschwein'); G.knight.x = s.x - 120; G.knight.y = s.y; return s.x + ',' + s.y;
});
await p.waitForTimeout(1500);
const hp0 = await p.evaluate(() => G.knight.hp);
const bl = await p.evaluate(async () => {
  const k = G.knight, e = huntTargets(k, 3000).find(e => e.k === 'wildschwein'); if (!e) return 'no boar';
  e.st = 'idle'; e.x = k.x + 26; e.y = k.y; k.dir = 'right'; attack();
  await new Promise(r => setTimeout(r, 350));
  return 'after hit st ' + e.st + ' hp ' + e.hp + '/' + e.max;
});
await p.waitForTimeout(900);
await c.screenshot({ path: 'h_boar.png' });
console.log(bl, 'knight hp', hp0, '->', await p.evaluate(() => G.knight.hp));
// mehr Schläge bis tot
console.log('boar', await hunt('wildschwein'));
await p.evaluate(() => { for (const a of G.loot.slice()) { a.z = 0; a.vz = 0; pickUp(a) && G.loot.splice(G.loot.indexOf(a), 1); } });
console.log('inv', await p.evaluate(() => HERO.inv.filter(Boolean).map(it => itemName(it)).join(', ')));
// Rucksack
await p.keyboard.press('KeyI'); await p.waitForTimeout(200);
await p.evaluate(() => { const i = HERO.inv.findIndex(it => it && it.s === 'ware'); G.sel = { from: 'inv', i }; renderBag(); });
await p.screenshot({ path: 'h_bag.png' });
await p.evaluate(() => closePanel());
// beim Krämer verkaufen
await p.evaluate(() => { const n = NPCS.find(n => n.id === 'kraemer'); G.knight.x = n.x; G.knight.y = n.y + 16; });
await p.waitForTimeout(300); await p.keyboard.press('KeyE'); await p.waitForTimeout(200);
await p.evaluate(() => renderTalk('sell'));
await p.screenshot({ path: 'h_sell.png' });
console.log('sell rows', await p.$$eval('#talkBody .shoprow', rs => rs.map(r => r.textContent.slice(0, 60))));
await p.evaluate(() => closePanel());
console.log(errs.join('\n') || 'ok');
await browser.close();
