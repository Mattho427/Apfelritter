// Kriegszug zu zweit: beide ziehen nach Pavia; feuert Hans die Kanone, geht die Mauer auch bei Grete auf. In Wien zählen die Lunten
// beider zusammen, und die Stufe richtet sich nach dem stärkeren Gefährten.
import { launch, wait, OUT } from './harness.mjs';
const H = await launch(2);
await H.start(['Hans', 'Grete'], ['reich', 'spanien']);
const [A, B] = H.pages.map(P => P.p);
let fehl = 0;
const T = (name, r, ok) => { const gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(20), JSON.stringify(r)); };
const zu = (p, id, lvl) => p.evaluate(([id, lvl]) => { HERO.lvl = lvl; refreshStats(); G.knight.hp = ST.hp; setInterval(() => { if (G.knight.hp > 0) G.knight.hp = ST.hp; }, 200);
  const n = NPCS.find(q => q.kz === id); G.knight.x = n.x; G.knight.y = n.y + 24; updateZone(true); kzStart(n); return DG_ON && DG_ON.id; }, [id, lvl]);
// Gruppe bilden, damit die Stufe nach dem Stärkeren geht
for (const [p, dx] of [[A, 0], [B, 30]]) await p.evaluate(dx => { const n = NPCS.find(q => q.id === 'werber'); G.knight.x = n.x + dx; G.knight.y = n.y + 40; updateZone(true); $('banner').hidden = true; }, dx);
await wait(1200);
await A.evaluate(() => netAsk([...PEERS.values()][0], 'party', NET.pt ? NET.pt.id : rid())); await wait(900);
await B.evaluate(() => { if (NET.inbox[0]) netAnswer(NET.inbox[0], true); }); await wait(1500);
T('Gruppe', await A.evaluate(() => partyList().map(q => q.nm)), r => r.includes('Grete'));
for (const [p, l] of [[A, 28], [B, 25]]) await p.evaluate(l => { HERO.lvl = l; refreshStats(); sendPresence(true); }, l);
await wait(1500);
T('Pavia', [await zu(A, 'pavia', 28), await zu(B, 'pavia', 25)], r => r[0] === 'pavia' && r[1] === 'pavia');
await wait(1200);
T('Stufe', await B.evaluate(() => DG_ON.lvl), r => r[0] >= 28);
await A.evaluate(() => kzPull(0)); await wait(1500);
T('Mauer bei Grete', await B.evaluate(() => ({ step: DG_ON.kz.step, offen: DG_ON.gates[0].open, kanone: !!DG_ON.kz.done[0], log: [...document.querySelectorAll('#log p')].slice(-3).map(p => p.textContent).join(' | ') })),
  r => r.step === 1 && r.offen && r.kanone && /Gefährten waren schneller/.test(r.log));
await (await B.$('canvas')).screenshot({ path: OUT + 'tk2_b.png' });
// Grete schlägt vierzehn: die Palisade fällt auch bei Hans
await B.evaluate(() => { let n = 0; for (const m of G.mons.slice()) if (!m.elite && n < 14){ m.hp = 1; kill(m); n++; } }); await wait(1500);
T('Palisade bei Hans', await A.evaluate(() => ({ step: DG_ON.kz.step, offen: DG_ON.gates[1].open })), r => r.step === 2 && r.offen);
for (const p of [A, B]) await p.evaluate(() => leaveDungeon(true));
// Wien: jeder löscht Lunten, die des anderen zählen mit
T('Wien', [await zu(A, 'wien', 28), await zu(B, 'wien', 28)], r => r[0] === 'wien' && r[1] === 'wien');
await wait(1000);
await A.evaluate(() => { kzPull(0); kzPull(1); }); await wait(1200);
await B.evaluate(() => kzPull(2)); await wait(1500);
T('Lunten zusammen', await A.evaluate(() => ({ done: Object.keys(DG_ON.kz.done).length, offen: DG_ON.gates[0].open, step: DG_ON.kz.step })), r => r.done === 3 && r.offen && r.step === 1);
T('Lunten bei Grete', await B.evaluate(() => ({ done: Object.keys(DG_ON.kz.done).length, offen: DG_ON.gates[0].open })), r => r.done === 3 && r.offen);
T('Anwesenheit', await A.evaluate(() => JSON.stringify(netPres()).length), r => r < 3000);
console.log(H.errors().join('\n') || (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await H.done();
