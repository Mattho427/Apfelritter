// Mehrspieler: Waffenart im Aussehen, Bolzen beim anderen, Schaden des anderen
import { launch, wait, OUT } from '../mehrspieler/harness.mjs';
const H = await launch(2, { init: { fn: () => { window.__wx = 'klar'; }, arg: 0 } });
await H.start(['Anna', 'Bert'], ['reich', 'frankreich']);
const [A, B] = H.pages.map(P => P.p);
const setup = (wt, dx) => () => {};
for (const [P, wt, dx] of [[A, 'armbrust', 0], [B, 'hellebarde', 40]]){
  await P.evaluate(([wt, dx]) => {
    HERO.lvl = 12; refreshStats(); setInterval(() => { if (G.knight.hp > 0) G.knight.hp = ST.hp; }, 100);
    const it = makeItem('waffe', 12, 1, { wt }); const i = HERO.inv.indexOf(null); HERO.inv[i] = it; equipFrom(i);
    const clear = (x, y) => { for (let dy = -70; dy <= 70; dy += 8) for (let ddx = -70; ddx <= 230; ddx += 8) if (gBlocked(x + ddx - 3, y + dy - 3, x + ddx + 3, y + dy + 3, false)) return false; return true; };
    let spot = null;
    for (let y = 600; y < GH - 600 && !spot; y += 96) for (let x = 600; x < GW - 600 && !spot; x += 96) if (gZone(x, y).id === 'obstgarten' && clear(x, y)) spot = { x, y };
    G.knight.x = spot.x - dx; G.knight.y = spot.y + dx; G.knight.dir = 'right'; window.__spot = spot;
    sendPresence(true);
  }, [wt, dx]);
}
await wait(2500);
console.log('B sieht A', await B.evaluate(() => [...PEERS.values()].map(q => ({ nm: q.nm, lk: q.lk, wt: q.wt, set: knightSet(q.f, q.lk).wt }))));
console.log('A sieht B', await A.evaluate(() => [...PEERS.values()].map(q => ({ nm: q.nm, lk: q.lk, wt: q.wt, reach: Math.round(reachOf(q)) }))));
// Auf beiden Seiten derselbe Gegner (örtlich erzeugt), A schießt
for (const P of [A, B]) await P.evaluate(() => { for (const m of G.mons.slice()) G.mons.splice(G.mons.indexOf(m), 1); const m = createMonster('wieder', __spot.x + 150, __spot.y, 12); m.hp = m.max = 99999; m.spd = 0; window.__m = m; });
await A.evaluate(() => { G.knight.atkCd = 0; attack(); });
await wait(250);
console.log('B: Bolzen unterwegs', await B.evaluate(() => (G.kbolts || []).map(b => ({ own: b.own, x: Math.round(b.x - __spot.x), vx: Math.round(b.vx) }))));
await (await B.$('canvas')).screenshot({ path: OUT + 'tw5_B.png' });
await wait(800);
console.log('Schaden am Gegner: A', await A.evaluate(() => __m.max - __m.hp), 'B', await B.evaluate(() => __m.max - __m.hp));
// Durchschuss beim anderen
await A.evaluate(() => { G.cd = {}; G.knight.atkCd = 0; skillStoss(); });
await wait(200);
console.log('B: Durchschuss', await B.evaluate(() => (G.kbolts || []).map(b => ({ pierce: b.pierce, mult: b.mult }))));
await wait(800);
// B haut mit der Hellebarde, A sieht den Hieb
await B.evaluate(() => { G.knight.atkCd = 0; attack(); });
await wait(150);
console.log('A sieht Hieb von B', await A.evaluate(() => [...PEERS.values()].map(q => ({ atkT: +q.atkT.toFixed(2), len: q.atkLen, arc: +(q.swA1 - q.swA0).toFixed(2) }))));
await (await A.$('canvas')).screenshot({ path: OUT + 'tw5_A.png' });
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
