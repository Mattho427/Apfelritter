import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const browser = await chromium.launch();
const p = await (await browser.newContext({ viewport: { width: 1000, height: 1000 } })).newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(700);
const cab = await p.$('.cabinet');
await cab.screenshot({ path: OUT + 's_title.png' });
console.log('title errs:', errs.join('\n') || 'none');
await p.fill('#heroName', 'Götz');
await p.press('#heroName', 'Enter');
await p.waitForTimeout(1200);
await cab.screenshot({ path: OUT + 's_start.png' });
let st = await p.evaluate(() => ({ mode: G.mode, x: G.knight.x, y: G.knight.y, near: G.near && G.near.id, zone: G.zone, hp: G.knight.hp, max: ST.hp }));
console.log(JSON.stringify(st));
// zum Vogt
await p.evaluate(() => { const n = NPCS[0]; G.knight.x = n.x; G.knight.y = n.y + 14; });
await p.waitForTimeout(300);
await p.keyboard.press('KeyE');
await p.waitForTimeout(300);
await cab.screenshot({ path: OUT + 's_talk.png' });
console.log('talk errs:', errs.join('\n') || 'none');
await p.evaluate(() => { const b = [...document.querySelectorAll('#talkBody .opt.new')][0]; b && b.click(); });
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 's_quest.png' });
await p.evaluate(() => { const b = [...document.querySelectorAll('#talkBody .btn')][0]; b && b.click(); });
await p.waitForTimeout(200);
await p.keyboard.press('Escape');
// in den Obstgarten zu einem Wiedergänger-Lager
await p.evaluate(() => { const s = SPAWN_SLOTS.find(s => s.zone === 'obstgarten' && s.kind === 'wieder'); G.knight.x = s.x + 80; G.knight.y = s.y; });
await p.waitForTimeout(1500);
st = await p.evaluate(() => ({ mode: G.mode, mons: G.mons.map(m => m.k + m.lvl + ':' + m.mode).join(' '), zone: G.zone }));
console.log(JSON.stringify(st));
await cab.screenshot({ path: OUT + 's_field.png' });
// kämpfen: zum nächsten Monster laufen und hauen
for (let r = 0; r < 40; r++){
  const dir = await p.evaluate(() => {
    const k = G.knight; let best = null, bd = 1e9;
    for (const m of G.mons){ const d = Math.hypot(m.x - k.x, m.y - k.y); if (d < bd){ bd = d; best = m; } }
    if (!best) return null;
    const dx = best.x - k.x, dy = best.y - k.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
  });
  if (!dir) break;
  await p.keyboard.down(dir); await p.keyboard.down('Space');
  await p.waitForTimeout(300);
  await p.keyboard.up('Space'); await p.keyboard.up(dir);
  if (r === 12) await cab.screenshot({ path: OUT + 's_fight.png' });
}
st = await p.evaluate(() => ({ mode: G.mode, kills: HERO.kills, lvl: HERO.lvl, xp: HERO.xp, gold: HERO.gold, inv: HERO.inv.filter(Boolean).map(i => i.n), loot: G.loot.length, hp: Math.round(G.knight.hp), quests: JSON.stringify(HERO.quests) }));
console.log(JSON.stringify(st));
await cab.screenshot({ path: OUT + 's_after.png' });
await p.keyboard.press('KeyI');
await p.waitForTimeout(300);
await p.evaluate(() => { const b = document.querySelector('#bagGrid .slot:not(.empty)'); b && b.click(); });
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 's_bag.png' });
await p.keyboard.press('Escape');
await p.keyboard.press('KeyL');
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 's_qlog.png' });
await p.keyboard.press('Escape');
console.log(errs.join('\n') || 'keine Fehler');
await browser.close();
