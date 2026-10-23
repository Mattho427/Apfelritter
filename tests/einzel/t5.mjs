import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const browser = await chromium.launch();
const p = await (await browser.newContext({ viewport: { width: 1000, height: 1100 } })).newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(600);
const cab = await p.$('.cabinet');
await p.click('#factionPick .fpick:nth-child(2)');
await cab.screenshot({ path: OUT + 'f_title.png' });
await p.fill('#heroName', 'Bayard');
await p.press('#heroName', 'Enter');
await p.waitForTimeout(500);
console.log('faction', await p.evaluate(() => HERO.f + ' dmg ' + ST.dmg + ' hp ' + ST.hp));
// vor den Roten Ochsen, hinauflaufen
await p.evaluate(() => { const i = INN_BY.ochse; G.knight.x = i.dx; G.knight.y = i.y + 30; document.getElementById('banner').hidden = true; });
await p.waitForTimeout(400);
await cab.screenshot({ path: OUT + 'f_door.png' });
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(500); await p.keyboard.up('ArrowUp');
await p.waitForTimeout(300);
console.log('inside', await p.evaluate(() => G.inside && G.inside.id));
await p.evaluate(() => { document.getElementById('banner').hidden = true; });
await p.waitForTimeout(1200);
await cab.screenshot({ path: OUT + 'f_inside.png' });
// zum Wirt laufen und sprechen
await p.evaluate(() => { G.knight.x = 806; G.knight.y = 200; });
await p.waitForTimeout(200);
await p.keyboard.press('KeyE');
await p.waitForTimeout(200);
await p.evaluate(() => { [...document.querySelectorAll('#talkBody .opt')].find(b => b.textContent === 'Speisen').click(); });
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 'f_food.png' });
await p.evaluate(() => { HERO.gold = 200; renderTalk('speise'); [...document.querySelectorAll('#talkBody .shoprow .tbtn')].pop().click(); renderTalk('trank'); [...document.querySelectorAll('#talkBody .shoprow .tbtn')][1].click(); });
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 'f_drink.png' });
console.log('buffs', await p.evaluate(() => JSON.stringify({ food: HERO.food, drink: HERO.drink, hp: ST.hp, crit: ST.crit, regen: ST.regen, gold: HERO.gold })));
await p.evaluate(() => closePanel());
// Spielmann
await p.evaluate(() => { G.knight.x = 480; G.knight.y = 192; });
await p.waitForTimeout(200);
await p.keyboard.press('KeyE');
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 'f_lore.png' });
await p.evaluate(() => closePanel());
// hinsetzen hinter Tisch 1
await p.evaluate(() => { G.knight.x = 134; G.knight.y = 248; G.knight.dir = 'down'; });
await p.waitForTimeout(300);
await cab.screenshot({ path: OUT + 'f_sit.png' });
// hinausgehen
await p.evaluate(() => { G.knight.x = 480; G.knight.y = 505; });
await p.keyboard.down('ArrowDown'); await p.waitForTimeout(500); await p.keyboard.up('ArrowDown');
await p.waitForTimeout(300);
console.log('after leave', await p.evaluate(() => JSON.stringify({ inside: !!G.inside, x: Math.round(G.knight.x), y: Math.round(G.knight.y), zone: G.zone })));
// andere Gasthäuser von außen
for (const id of ['adler', 'krone']){
  await p.evaluate(id => { const i = INN_BY[id]; G.knight.x = i.dx + 40; G.knight.y = i.y + 40; }, id);
  await p.waitForTimeout(500);
  await (await p.$('#game')).screenshot({ path: OUT + 'f_ext_' + id + '.png' });
}
await (await p.$('.notes')).screenshot({ path: OUT + 'f_notes.png' });
console.log(errs.join('\n') || 'keine Fehler');
await browser.close();
