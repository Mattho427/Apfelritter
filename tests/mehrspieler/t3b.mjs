import { launch, wait, OUT } from './harness.mjs';
const H = await launch(3);
await H.start(['Hans', 'Grete', 'Kunz'], ['reich', 'spanien', 'england']);
const [A, B, C] = H.pages.map(P => P.p);
const cab = async (p, name) => (await p.$('.cabinet')).screenshot({ path: OUT + name });
for (const [p, dx, dy] of [[A, -40, 120], [B, 0, 120], [C, 60, 160]]) await p.evaluate(([dx, dy]) => { const h = NPCS.find(n => n.id === 'herold'); G.knight.x = h.x + dx; G.knight.y = h.y + dy; HERO.lvl = 6; refreshStats(); $('banner').hidden = true; }, [dx, dy]);
await wait(900);
await A.evaluate(() => openPeer([...PEERS.values()].find(q => q.nm === 'Grete'))); await wait(200);
console.log('A opts:', await A.evaluate(() => [...document.querySelectorAll('#talkBody button')].map(b => b.textContent + (b.disabled ? '(x)' : '')).join(' | ')));
await A.evaluate(() => { [...document.querySelectorAll('#talkBody button')].find(b => b.textContent === 'Zum Tjost fordern').click(); }); await wait(700);
await B.evaluate(() => $('askYes').click()); await wait(500);
// beide: Lanze senken, wenn das Ziel auf dem Helm steht
for (const p of [A, B]) await p.evaluate(() => {
  const tick = () => {
    const J = G.joust;
    if (J && J.st === 'charge'){ const gap = (J.ox - J.px) * J.dir, u = Math.sin(J.ph); atkHeld = gap < JOUST_AIM && J.lock === null && Math.abs(u - .46) < (Math.random() < .5 ? .1 : .5); }
    else atkHeld = false;
    if ((window.__jt = (window.__jt || 0) + 1) < 4000) requestAnimationFrame(tick);
  };
  tick();
});
for (const p of [A, B]) await p.evaluate(() => { window.__dl = []; const f = duelImpact; duelImpact = (J, v) => { f(J, v); window.__dl.push(J.pass + ": my " + J.pvp.L[J.pass - 1] + " op " + v + " -> " + J.text + " [" + J.me + ":" + J.op + "]"); }; });
let shot = 0;
for (let i = 0; i < 80; i++){
  await wait(500);
  const s = await A.evaluate(() => G.joust ? G.joust.st + ' p' + G.joust.pass + ' ' + G.joust.me + ':' + G.joust.op : 'ende');
  if (!shot && /charge/.test(s)){ await wait(1500); await cab(A, 'du_a.png'); await cab(C, 'du_c.png'); shot = 1; }
  if (s === 'ende') break;
}
await wait(1500);
const rA = await A.evaluate(() => ({ j: HERO.joust, gold: HERO.gold, log: [...document.querySelectorAll('#log p')].slice(-2).map(p => p.textContent).join(' / ') }));
const rB = await B.evaluate(() => ({ j: HERO.joust, gold: HERO.gold, log: [...document.querySelectorAll('#log p')].slice(-2).map(p => p.textContent).join(' / ') }));
console.log('A', JSON.stringify(rA)); console.log('B', JSON.stringify(rB));
console.log("A:\n" + (await A.evaluate(() => window.__dl.join("\n")))); console.log("B:\n" + (await B.evaluate(() => window.__dl.join("\n"))));
await wait(6000);
console.log('NET.jo cleared', await A.evaluate(() => NET.jo), await B.evaluate(() => NET.jo));
console.log('DB', JSON.stringify([...H.DBS].filter(([k]) => k.startsWith('heroes/')).map(([k, v]) => [k, v.nm, v.je, v.jw, v.jl])));
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
