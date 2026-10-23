import { launch, wait, OUT } from './harness.mjs';
const H = await launch(3);
await H.start(['Hans', 'Grete', 'Kunz'], ['reich', 'spanien', 'england']);
const P = H.pages.map(P => P.p), [A, B, C] = P;
const cab = async (p, name) => (await p.$('.cabinet')).screenshot({ path: OUT + name });
for (const [p, dx] of [[A, -40], [B, 0], [C, 40]]) await p.evaluate(dx => { const h = NPCS.find(n => n.id === 'herold'); G.knight.x = h.x + dx; G.knight.y = h.y + 60; HERO.gold = 100; HERO.lvl = 6; refreshStats(); updateHud(); $('banner').hidden = true; }, dx);
await wait(900);
await A.evaluate(() => tnHost()); await wait(600);
for (const p of [B, C]){ await p.evaluate(() => openTalk(NPCS.find(n => n.id === 'herold'))); await wait(150); await p.evaluate(() => renderTalk('turnier')); await wait(150);
  console.log('opts', await p.evaluate(() => $('talkText').textContent + ' | ' + [...document.querySelectorAll('#talkBody button')].map(b => b.textContent + (b.disabled ? '(x)' : '')).join(' | ')));
  await p.evaluate(() => [...document.querySelectorAll('#talkBody button')].find(b => /Anmelden/.test(b.textContent)).click()); await wait(900);
  await p.evaluate(() => closePanel()); }
console.log('gemeldet', await A.evaluate(() => NET.gt.nm.join(', ')), 'gold', await B.evaluate(() => HERO.gold), await C.evaluate(() => HERO.gold));
await A.evaluate(() => { openTalk(NPCS.find(n => n.id === 'herold')); renderTalk('turnier'); }); await wait(200);
await A.evaluate(() => [...document.querySelectorAll('#talkBody button')].find(b => /beginnen/.test(b.textContent)).click()); await wait(300);
await A.evaluate(() => closePanel());
for (const p of P) await p.evaluate(() => { const tick = () => { const J = G.joust; if (J && J.st === 'charge'){ const gap = (J.ox - J.px) * J.dir, u = Math.sin(J.ph); atkHeld = gap < JOUST_AIM && J.lock === null && Math.abs(u - (Math.random() < .5 ? .46 : -.2)) < .14; } else atkHeld = false; requestAnimationFrame(tick); }; tick(); });
let shot = 0;
for (let i = 0; i < 120; i++){
  await wait(2000);
  const s = await A.evaluate(() => { const T = NET.gt; return T ? T.st + ' cur ' + (T.cur ? T.cur.id + ' ' + T.nm[T.pl.indexOf(T.cur.a)] + '-' + T.nm[T.pl.indexOf(T.cur.b)] : '-') + ' br ' + JSON.stringify(T.br) : 'kein'; });
  if (i % 5 === 0) console.log('t' + i * 2, s);
  if (/lauf cur/.test(s) && !/cur -/.test(s) && shot < 2){ await wait(3000); await cab(C, 'tn_watch' + shot + '.png'); shot++; }
  if (/^ende/.test(s)) { console.log('ENDE', s); break; }
}
await wait(1500);
for (const [n, p] of [['A', A], ['B', B], ['C', C]]) console.log(n, await p.evaluate(() => 'gold ' + HERO.gold + ' tw ' + (HERO.tw || 0) + ' elo ' + (HERO.joust && HERO.joust.elo) + ' inv ' + HERO.inv.filter(Boolean).map(i => i.n).join(',') + ' | ' + [...document.querySelectorAll('#log p')].slice(-1).map(p => p.textContent).join()));
await A.evaluate(() => { openTalk(NPCS.find(n => n.id === 'herold')); renderTalk('turnier'); }); await wait(300); await cab(A, 'tn_tree.png');
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
