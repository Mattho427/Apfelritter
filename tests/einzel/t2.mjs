import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const browser = await chromium.launch();
const p = await (await browser.newContext({ viewport: { width: 1000, height: 1000 } })).newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(500);
const cab = await p.$('.cabinet');
await p.fill('#heroName', 'Ulrich');
await p.press('#heroName', 'Enter');
await p.waitForTimeout(500);
const log = async label => console.log(label, JSON.stringify(await p.evaluate(() => ({ mode: G.mode, lvl: HERO.lvl, xp: HERO.xp, gold: HERO.gold, pot: HERO.potions, kills: HERO.kills, hp: Math.round(G.knight.hp), max: ST.hp, dmg: ST.dmg, arm: ST.arm, q: HERO.quests.map(q => q.id + ':' + q.n).join(','), done: HERO.done.join(','), inv: HERO.inv.filter(Boolean).length }))));
// Auftrag annehmen und künstlich erfüllen
await p.evaluate(() => { openTalk(NPCS[0]); acceptQuest({ id: 'v1' }); closePanel(); HERO.quests[0].n = 6; renderTracker(); });
await p.evaluate(() => { openTalk(NPCS[0]); });
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 't_turnin.png' });
await p.evaluate(() => { document.querySelector('#talkBody .opt.ready').click(); });
await p.waitForTimeout(300);
await log('after turn-in');
await p.evaluate(() => closePanel());
// Händlerin: kaufen und verkaufen
await p.evaluate(() => { HERO.gold = 500; openTalk(NPCS[1]); renderTalk('buy'); });
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 't_shop.png' });
await p.evaluate(() => { [...document.querySelectorAll('#talkBody .shoprow .tbtn')].forEach(b => b.click()); });
await p.evaluate(() => renderTalk('sell'));
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 't_sell.png' });
await log('after shop');
await p.evaluate(() => closePanel());
// Rucksack: alles Bessere anlegen
await p.evaluate(() => { openBag(); const i = HERO.inv.findIndex(Boolean); if (i >= 0){ G.sel = { from:'inv', i }; renderBag(); } });
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 't_bag.png' });
await p.evaluate(() => closePanel());
// Stufe 12, zum Tod aufs Schlachtfeld
await p.evaluate(() => { HERO.lvl = 12; HERO.potions = 10; for (const s of SLOTS) HERO.eq[s] = makeItem(s, 12, 2); refreshStats(); G.knight.hp = ST.hp; renderSkills(); updateHud(); const b = LAIRS.tod; G.knight.x = b.x - 90; G.knight.y = b.y + 30; });
await p.waitForTimeout(2600);
await log('at tod');
for (let r = 0; r < 160; r++){
  const dir = await p.evaluate(() => {
    const k = G.knight, b = G.mons.find(m => m.k === 'tod');
    if (!b) return null;
    if (G.mode !== 'play') return 'none';
    if (k.hp < ST.hp * .4) drinkPotion();
    if (G.cd.rund <= 0) skillRund(); else if (G.cd.ruf <= 0) skillRuf(); else if (G.cd.stoss <= 0) skillStoss();
    const dx = b.x - k.x, dy = b.y - k.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
  });
  if (!dir || dir === 'none') break;
  await p.keyboard.down(dir); await p.keyboard.down('Space');
  await p.waitForTimeout(250);
  await p.keyboard.up('Space'); await p.keyboard.up(dir);
  if (r === 8) await cab.screenshot({ path: OUT + 't_boss.png' });
}
await log('after boss');
await p.waitForTimeout(600);
await cab.screenshot({ path: OUT + 't_boss2.png' });
// Sterben
await p.evaluate(() => { G.knight.hp = 1; G.knight.inv = 0; hurt({ x: G.knight.x + 5, y: G.knight.y }, 9999); });
await p.waitForTimeout(1800);
await cab.screenshot({ path: OUT + 't_dead.png' });
await log('dead');
await p.click('#btnRespawn');
await p.waitForTimeout(400);
await log('respawned');
// Karte
await p.keyboard.press('KeyK');
await p.waitForTimeout(300);
await cab.screenshot({ path: OUT + 't_map.png' });
await p.keyboard.press('KeyK');
// Leistung im Wald
await p.evaluate(() => { const s = SPAWN_SLOTS.find(s => s.zone === 'wald'); G.knight.x = s.x; G.knight.y = s.y + 60; });
await p.waitForTimeout(1500);
const perf = await p.evaluate(() => new Promise(res => { let n = 0, t0 = performance.now(), worst = 0, prev = t0; function f(t){ worst = Math.max(worst, t - prev); prev = t; if (++n < 120) requestAnimationFrame(f); else res({ avg: (t - t0) / n, worst, mons: G.mons.length }); } requestAnimationFrame(f); }));
console.log('perf', JSON.stringify(perf));
const tm = await p.evaluate(() => { const t0 = performance.now(); for (let i = 0; i < 60; i++){ update(1 / 60); render(); } return (performance.now() - t0) / 60; });
console.log('ms per update+render', tm.toFixed(2));
const save = await p.evaluate(() => { saveHero(); return (localStorage.getItem(SAVE_KEY) || '').length; });
console.log('save bytes', save);
console.log(errs.join('\n') || 'keine Fehler');
await browser.close();
