import { launch, wait, OUT } from './harness.mjs';
const H = await launch(2);
await H.start(['Hans', 'Grete'], ['reich', 'england']);
const [A, B] = H.pages.map(P => P.p);
const cab = async (p, name) => (await p.$('.cabinet')).screenshot({ path: OUT + name });
// Eingang in der Welt
const door = await A.evaluate(() => { const d = DG_DOORS.find(d => d.dg === 'bergwerk'); return d && { x: d.x, y: d.y, zone: gZone(d.x, d.y).id }; });
console.log('door', JSON.stringify(door));
await A.evaluate(d => { G.knight.x = d.x; G.knight.y = d.y + 60; $('banner').hidden = true; }, door);
await wait(800); await cab(A, 'mine_door.png');
// Gruppe bilden und hinabsteigen
await A.evaluate(() => { NET.pt = { id: 'grp1', t: Date.now() }; HERO.lvl = 12; refreshStats(); G.knight.hp = ST.hp; });
await B.evaluate(() => { NET.pt = { id: 'grp1', t: Date.now() + 1 }; HERO.lvl = 10; refreshStats(); G.knight.hp = ST.hp; });
await wait(500);
for (const p of [A, B]) await p.evaluate(() => { const d = DG_DOORS.find(d => d.dg === 'bergwerk'); G.knight.x = d.x; G.knight.y = d.y + 20; enterDungeon(d); setInterval(() => { G.knight.hp = ST.hp; }, 50); });
await wait(600);
const info = await A.evaluate(() => { const M = DG_ON; return { lvl: M.lvl, gates: M.gates.map(g => g.tiles.map(t => [t % M.C, Math.floor(t / M.C), M.g[t]]).join(' ') + ' levers ' + g.levers), levers: M.levers.map(L => L && [L.o.tx, L.o.ty]), mons: G.mons.map(m => (m.nm || m.k) + m.lvl).join(', ') }; });
console.log(JSON.stringify(info));
await cab(A, 'mine_entry.png');
// A zum westlichen Hebel, B zum östlichen
const lv = await A.evaluate(() => DG_ON.levers.slice(0, 2).map(L => ({ x: L.o.x, y: L.o.y })));
for (const m of [A, B]) await m.evaluate(() => { for (const mm of G.mons) if (!mm.grp) mm.hp = 1; });
await A.evaluate(L => { G.knight.x = L.x; G.knight.y = L.y + 24; }, lv[0]);
await B.evaluate(L => { G.knight.x = L.x; G.knight.y = L.y + 24; }, lv[1]);
await wait(500);
console.log('A near', await A.evaluate(() => G.dgNear + ' ' + $('btnTalk').textContent));
await A.keyboard.press('KeyE'); await wait(400);
await cab(A, 'mine_lever.png');
console.log('gate0 after A only', await A.evaluate(() => DG_ON.gates[0].open));
await B.keyboard.press('KeyE'); await wait(900);
console.log('gate0 after both: A', await A.evaluate(() => DG_ON.gates[0].open), 'B', await B.evaluate(() => DG_ON.gates[0].open));
// am Gitter vorbei
await A.evaluate(() => { const g = DG_ON.gates[0].o; G.knight.x = g.x; G.knight.y = g.y + 30; });
await wait(600); await cab(A, 'mine_gate.png');
// zweites Gitter
const lv2 = await A.evaluate(() => DG_ON.levers.slice(2, 4).map(L => ({ x: L.o.x, y: L.o.y })));
await A.evaluate(L => { G.knight.x = L.x; G.knight.y = L.y + 24; }, lv2[0]);
await B.evaluate(L => { G.knight.x = L.x; G.knight.y = L.y + 24; }, lv2[1]);
await wait(500); await A.keyboard.press('KeyE'); await B.keyboard.press('KeyE'); await wait(900);
console.log('gate1: A', await A.evaluate(() => DG_ON.gates[1].open), 'B', await B.evaluate(() => DG_ON.gates[1].open));
// zum Drachen
for (const [p, dx] of [[A, -30], [B, 30]]) await p.evaluate(dx => { const b = G.mons.find(m => m.grp); G.knight.x = b.x + dx; G.knight.y = b.y + 40; }, dx);
await wait(1500); await cab(A, 'mine_drake.png');
const bot = () => setInterval(() => {
  if (G.mode !== 'play') return; const k = G.knight, b = G.mons.find(m => m.grp); keys.clear(); atkHeld = false; if (!b) return;
  const dx = b.x - k.x, dy = b.y - 10 - k.y; if (Math.abs(dx) > 30) keys.add(dx > 0 ? 'right' : 'left'); if (Math.abs(dy) > 12) keys.add(dy > 0 ? 'down' : 'up');
  if (Math.hypot(dx, dy) < 60){ k.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); atkHeld = true; }
}, 100);
await A.evaluate(bot); await B.evaluate(bot);
for (let i = 0; i < 30; i++){
  await wait(3000);
  const a = await A.evaluate(() => { const b = G.mons.find(m => m.grp); return b ? Math.round(b.hp) + '/' + b.max + ' myDmg ' + Math.round(DG_ON.bossDmg) : 'tot ' + (HERO.dgBoss && HERO.dgBoss.bergwerk); });
  const b = await B.evaluate(() => { const b = G.mons.find(m => m.grp); return b ? Math.round(b.hp) + '/' + b.max + ' myDmg ' + Math.round(DG_ON.bossDmg) : 'tot ' + (HERO.dgBoss && HERO.dgBoss.bergwerk); });
  console.log('t' + i, a, '|', b);
  if (/tot/.test(a) && /tot/.test(b)) break;
}
await wait(1000); await cab(A, 'mine_end.png');
console.log('A loot', await A.evaluate(() => G.loot.map(l => l.t + (l.it ? ':' + l.it.n : '')).join(', ')));
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
