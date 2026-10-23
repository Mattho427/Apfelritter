import { launch, wait, OUT } from './harness.mjs';
const kind = process.argv[2] || 'brand', cyc = { brand: 0, pest: 1, kaiser: 2 }[kind], now = Date.now() / 1000;
let d = Math.floor(now / 1440); while (d % 3 !== cyc) d++;
const shift = d * 1440 + 15 * 60 + 5 - now;
const H = await launch(2, { init: { fn: ([sh, need]) => { window.__skyShift = sh; window.__wx = 'klar'; window.__evNeed = need; }, arg: [shift, 12] } });
await H.start(['Hans', 'Grete'], ['reich', 'frankreich']);
const [A, B] = H.pages.map(P => P.p);
const cab = async (p, name) => (await p.$('.cabinet')).screenshot({ path: OUT + name });
console.log('event', await A.evaluate(() => EVT.cur && EVT.cur.id + ' ' + EVT.cur.phase));
for (const p of [A, B]) await p.evaluate(() => { HERO.lvl = 10; HERO.eq.waffe = makeItem('waffe', 11, 2); HERO.eq.ruestung = makeItem('ruestung', 11, 2); refreshStats(); G.knight.hp = ST.hp; $('banner').hidden = true; setInterval(() => { G.knight.hp = ST.hp; }, 50); });
const st = p => p.evaluate(() => { const E = EVT.cur; if (!E) return 'kein'; return E.phase + (E.fires ? ' out ' + E.outN + ' burn ' + E.burnN + ' mine ' + E.fb.join('') : '') + (E.path ? ' s ' + Math.round(E.s) + '/' + Math.round(E.len) + ' halt ' + !!E.halt + ' amb ' + E.ambK + ' left ' + E.ambLeft : '') + (E.phase === 'raid' || E.phase === 'boss' ? ' kills ' + E.killedN + '/' + E.need + ' boss ' + (E.bossHp | 0) + '/' + E.bossMax : '') + (E.over ? ' OVER won=' + E.won : ''); });
if (kind === 'brand'){
  const fires = await A.evaluate(() => EVT.cur.fires.map(f => [Math.round(f.x), Math.round(f.y), f.ign]));
  console.log('fires', JSON.stringify(fires), 'wells', await A.evaluate(() => evWells().length));
  await A.evaluate(() => { const f = EVT.cur.fires[0]; G.knight.x = f.fx; G.knight.y = f.fy + 120; }); await wait(1500); await cab(A, 'ev_brand1.png');
  const bot = () => setInterval(() => {
    const E = EVT.cur; if (!E || E.over || G.mode !== 'play') return; const k = G.knight;
    if (!G.bucket){ const w = evWells().sort((a, b) => Math.hypot(a.x - k.x, a.y - k.y) - Math.hypot(b.x - k.x, b.y - k.y))[0]; k.x = w.x; k.y = w.y + 40; updateNear(); if (G.evAct) evDo(G.evAct); }
    else { const f = E.fires.find(f => f.lit && !f.out); if (!f) return; k.x = f.fx; k.y = f.fy; updateNear(); if (G.evAct) evDo(G.evAct); }
  }, 700);
  await A.evaluate(bot); await B.evaluate(bot);
} else if (kind === 'pest'){
  const site = await A.evaluate(() => ({ x: EVT.cur.site.x, y: EVT.cur.site.y }));
  for (const [p, dx] of [[A, -40], [B, 40]]) await p.evaluate(([x, y]) => { G.knight.x = x; G.knight.y = y + 40; }, [site.x + dx, site.y]);
} else {
  for (const [p, dx] of [[A, -40], [B, 40]]) await p.evaluate(dx => { const E = EVT.cur; G.knight.x = E.pos.x + dx; G.knight.y = E.pos.y + 60; }, dx);
  await wait(2500); await cab(A, 'ev_kaiser1.png');
}
if (kind !== 'brand'){
  const bot = () => setInterval(() => {
    if (G.mode !== 'play') return; const k = G.knight, E = EVT.cur; keys.clear(); atkHeld = false;
    let best = null, bd = 1e9; for (const m of G.mons){ if (!m.ev) continue; const d = Math.hypot(m.x - k.x, m.y - k.y); if (d < bd){ bd = d; best = m; } }
    if (!best){ if (E && E.pos && Math.hypot(E.pos.x - k.x, E.pos.y + 60 - k.y) > 300){ k.x = E.pos.x + 30; k.y = E.pos.y + 60; return; } if (E && E.pos){ const dx = E.pos.x - k.x, dy = E.pos.y + 60 - k.y; if (Math.abs(dx) > 30) keys.add(dx > 0 ? 'right' : 'left'); if (Math.abs(dy) > 30) keys.add(dy > 0 ? 'down' : 'up'); } return; }
    if (bd > 260){ k.x = best.x + (k.x < best.x ? -60 : 60); k.y = best.y + 10; return; }   // Bot findet keinen Weg um Mauern
    const dx = best.x - k.x, dy = best.y - k.y; if (Math.abs(dx) > 24) keys.add(dx > 0 ? 'right' : 'left'); if (Math.abs(dy) > 8) keys.add(dy > 0 ? 'down' : 'up');
    if (bd < 46){ k.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); atkHeld = true; }
  }, 100);
  await A.evaluate(bot); await B.evaluate(bot);
}
let shots = 0;
for (let i = 0; i < 80; i++){
  await wait(4000);
  const a = await st(A), b = await st(B);
  console.log('t' + i * 4, a, '|', b);
  if (shots < 2 && i === 3 + shots * 5){ await cab(A, 'ev_' + kind + '_' + shots + '.png'); shots++; }
  if (/OVER/.test(a) && /OVER/.test(b)) break;
}
await wait(800); await cab(A, 'ev_' + kind + '_end.png');
console.log('A', await A.evaluate(() => HERO.inv.filter(Boolean).map(i => i.n).join(', ') + ' | ' + [...document.querySelectorAll('#log p')].slice(-2).map(p => p.textContent).join(' / ')));
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
