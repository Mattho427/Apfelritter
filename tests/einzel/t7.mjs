import { chromium, ROOT, OUT, GAME, PAGE, MOBILE, zeigeTafel } from '../pfad.mjs';
const browser = await chromium.launch();
const p = await (await browser.newContext({ viewport: { width: 1000, height: 1100 } })).newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(500);
const cab = await p.$('.cabinet');
await p.click('#factionPick .fpick:nth-child(3)');
await p.fill('#heroName', 'Brandon');
await p.press('#heroName', 'Enter');
await p.waitForTimeout(400);
// Stallmeister
await p.evaluate(() => { HERO.gold = 3000; HERO.lvl = 12; refreshStats(); updateHud(); const n = NPCS.find(n => n.id === 'stall'); G.knight.x = n.x; G.knight.y = n.y + 16; document.getElementById('banner').hidden = true; });
await p.waitForTimeout(300);
await cab.screenshot({ path: OUT + 'h_stall_world.png' });
await p.keyboard.press('KeyE');
await p.waitForTimeout(200);
await p.evaluate(() => [...document.querySelectorAll('#talkBody .opt')].find(b => b.textContent === 'Pferde ansehen').click());
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 'h_stable.png' });
await p.evaluate(() => [...document.querySelectorAll('#talkBody .shoprow .tbtn')][2].click());
await p.evaluate(() => closePanel());
console.log('horse', await p.evaluate(() => HERO.horse + ' gold ' + HERO.gold));
// aufsitzen und reiten
await p.keyboard.press('KeyH');
await p.waitForTimeout(200);
const x0 = await p.evaluate(() => G.knight.x);
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(800);
await cab.screenshot({ path: OUT + 'h_ride.png' });
await p.keyboard.up('ArrowRight');
const x1 = await p.evaluate(() => G.knight.x);
console.log('ride dist in .8s', Math.round(x1 - x0), 'riding', await p.evaluate(() => HERO.riding + ' ' + G.knight.ride));
for (const d of ['ArrowDown', 'ArrowUp', 'ArrowLeft']){ await p.keyboard.down(d); await p.waitForTimeout(350); await (await p.$('#game')).screenshot({ path: OUT + 'h_ride_' + d + '.png' }); await p.keyboard.up(d); }
// Hieb im Sattel: Lanzenstoß, der Ritter bleibt oben; danach mit H absitzen
await p.keyboard.press('Space');
await p.waitForTimeout(800);
console.log('after attack riding', await p.evaluate(() => HERO.riding));
await p.keyboard.press('KeyH');
await p.waitForTimeout(200);
// Schmied
await p.evaluate(() => { const n = NPCS.find(n => n.id === 'schmied'); G.knight.x = n.x; G.knight.y = n.y + 16; });
await p.waitForTimeout(300);
await (await p.$('#game')).screenshot({ path: OUT + 'h_smith_world.png' });
await p.keyboard.press('KeyE');
await p.waitForTimeout(200);
await p.evaluate(() => [...document.querySelectorAll('#talkBody .opt')].find(b => b.textContent === 'Ausrüstung verbessern').click());
await p.evaluate(() => { for (let i = 0; i < 3; i++) document.querySelector('#talkBody .shoprow .tbtn').click(); });
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 'h_smith.png' });
console.log('weapon', await p.evaluate(() => itemName(HERO.eq.waffe) + ' dmg ' + HERO.eq.waffe.dmg + ' ST ' + ST.dmg));
await p.evaluate(() => closePanel());
// Wegweiser und bessere Beute
await p.evaluate(() => { HERO.quests = [{ id: 'v7', n: 0 }]; renderTracker(); HERO.inv[0] = makeItem('helm', 12, 2); HERO.inv[1] = makeItem('waffe', 1, 0); const n = NPCS[0]; G.knight.x = n.x; G.knight.y = n.y + 60; });
await p.waitForTimeout(400);
await (await p.$('#game')).screenshot({ path: OUT + 'h_arrow.png' });
await p.keyboard.press('KeyI');
await p.waitForTimeout(200);
await cab.screenshot({ path: OUT + 'h_bag.png' });
await p.keyboard.press('Escape');
// Gasthaus: absitzen beim Eintreten
await p.evaluate(() => { HERO.riding = true; const i = INN_BY.ochse; G.knight.x = i.dx; G.knight.y = i.dy + 2; enterInn(i); });
console.log('inn riding', await p.evaluate(() => HERO.riding + ' ' + !!G.inside));
await zeigeTafel(p); await (await p.$('.notespanel')).screenshot({ path: OUT + 'h_notes.png' });
console.log(errs.join('\n') || 'keine Fehler');
await browser.close();
