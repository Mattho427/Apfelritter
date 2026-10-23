import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const vw = +(process.argv[2] || 1000), vh = +(process.argv[3] || 1000), tag = process.argv[4] || '';
const browser = await chromium.launch();
const p = await (await browser.newContext({ viewport: { width: vw, height: vh } })).newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(400);
await p.fill('#heroName', 'Test'); await p.press('#heroName', 'Enter');
await p.waitForTimeout(400);
await p.evaluate((LV) => { const NIGHT = LV < 0; LV = Math.abs(LV); const h = NPCS.find(n => n.id === 'herold'); HERO.gold = 500; HERO.lvl = LV; refreshStats(); G.knight.x = h.x; G.knight.y = h.y + 24; window.__wx = 'klar'; if (NIGHT){ window.__skyShift = 23 / 24 * DAY_LEN - (Date.now() / 1000 % DAY_LEN); } }, +(process.env.LVL || 6));
await p.waitForTimeout(500);
await p.keyboard.press('e');
await p.waitForTimeout(300);
const opts = await p.$$eval('#talkBody button', bs => bs.map(b => b.textContent));
console.log('main opts', opts);
await p.click('text=Zum Tjost antreten');
await p.waitForTimeout(300);
await p.screenshot({ path: 'j_talk' + tag + '.png' });
console.log(await p.$$eval('#talkBody .shoprow', rs => rs.map(r => r.textContent.slice(0, 120))));
await p.click('#talkBody .shoprow >> nth=' + (process.env.FOE || 0) + ' >> button');
await p.waitForTimeout(700);
const c = await p.$('#game');
await c.screenshot({ path: 'j_intro' + tag + '.png' });
// Durchgänge spielen: im Spiel selbst drücken, wenn die Marke im Schild- oder Helmfeld steht
const foeIdx = +(process.env.FOE || 0);
await p.evaluate(() => { const tick = () => { const J = G.joust; if (J){ const gap = (J.ox - J.px) * J.dir, u = Math.sin(J.ph); atkHeld = J.st === 'charge' && gap < 300 && J.lock === null && u > -.5 && u < .55; } requestAnimationFrame(tick); }; tick(); });
let shots = 0, lastPass = 0, ch = 0;
for (let i = 0; i < 1500; i++){
  const st = await p.evaluate(() => { const J = G.joust; if (!J) return null; const gap = (J.ox - J.px) * J.dir; return { st: J.st, gap, lock: J.lock, pass: J.pass, me: J.me, op: J.op, text: J.text }; });
  if (!st) break;
  if (st.st === 'charge' && st.pass === 1 && st.gap < 520 && ch === 0){ ch++; await c.screenshot({ path: 'j_charge' + tag + '.png' }); }
  if (st.st === 'charge' && st.gap < 400 && st.gap > 250 && shots < 1){ shots++; await c.screenshot({ path: 'j_aim' + tag + '.png' }); }
  if (st.st === 'after' && st.pass !== lastPass){ lastPass = st.pass; await p.waitForTimeout(150); await c.screenshot({ path: 'j_hit' + st.pass + tag + '.png' }); console.log('pass', st.pass, st.me + ':' + st.op, st.text); }
  await p.waitForTimeout(15);
}
await p.waitForTimeout(400);
await c.screenshot({ path: 'j_end' + tag + '.png' });
console.log(await p.evaluate(() => JSON.stringify({ joust: HERO.joust, gold: HERO.gold, mode: G.mode, x: G.knight.x, y: G.knight.y, ok: gOk(G.knight.x, G.knight.y), inv: HERO.inv.filter(Boolean).map(i => i.n) })));
console.log(await p.evaluate(() => [...document.querySelectorAll('#log div, #log p')].slice(-3).map(d => d.textContent).join(' | ')));
console.log(errs.join('\n') || 'no errors');
await browser.close();
