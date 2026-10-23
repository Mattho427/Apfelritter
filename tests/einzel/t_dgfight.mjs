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
await p.fill('#heroName', 'Test'); await p.press('#heroName', 'Enter');
await p.waitForTimeout(300);
const c = await p.$('#game');
await p.evaluate(() => { HERO.lvl = 16; refreshStats(); G.knight.hp = ST.hp; const d = DG_DOORS.find(d => d.dg === 'keller'); G.knight.x = d.x; G.knight.y = d.y + 30; });
await p.waitForTimeout(400);
await p.keyboard.press('KeyE'); await p.waitForTimeout(600);
// in den Wachraum (Armbrustschützen)
await p.evaluate(() => { const M = DG_ON, r = M.D.rooms[2]; G.knight.x = M.ox + (r[0] + 1) * 32 + 16; G.knight.y = M.oy + (r[1] + r[3] - 2) * 32 + 28; });
const log = [];
for (let i = 0; i < 12; i++){
  await p.keyboard.down('Space'); await p.waitForTimeout(250); await p.keyboard.up('Space');
  log.push(await p.evaluate(() => Math.round(G.knight.hp) + '/' + ST.hp + ' f' + G.mons.filter(m => m.mode === 'fight').length + ' s' + G.shots.length + ' n' + G.mons.length));
}
console.log(log.join(' | '));
await c.screenshot({ path: 'd_fight.png' });
// sterben und wieder erwachen
await p.evaluate(() => { G.knight.inv = 0; hurt(null, 99999); });
await p.waitForTimeout(2200);
console.log('mode', await p.evaluate(() => G.mode + ' dg ' + !!DG_ON));
await p.evaluate(() => respawn());
await p.waitForTimeout(500);
console.log('after respawn', await p.evaluate(() => JSON.stringify({ mode: G.mode, dg: !!DG_ON, zone: G.zone, x: Math.round(G.knight.x), y: Math.round(G.knight.y), mons: G.mons.length })));
// Speichern im Gewölbe: Lage = Eingang
await p.evaluate(() => { const d = DG_DOORS[0]; G.knight.x = d.x; G.knight.y = d.y + 30; });
await p.waitForTimeout(300); await p.keyboard.press('KeyE'); await p.waitForTimeout(400);
console.log('save', await p.evaluate(() => { saveHero(); return DG_ON.id + ' ' + HERO.x + ',' + HERO.y + ' door ' + DG_ON.door.x + ',' + DG_ON.door.y; }));
console.log(errs.join('\n') || 'ok');
await browser.close();
