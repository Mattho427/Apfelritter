import { launch, wait, OUT } from './harness.mjs';
const target = +(process.argv[2] || 545);   // Sekunde des Spieltags: 545 = 9:05
const shift = target - (Date.now() / 1000 % 1440);
const H = await launch(2, { init: { fn: ([sh, need]) => { window.__skyShift = sh; window.__evNeed = need; window.__wx = 'klar'; }, arg: [shift, +(process.argv[3] || 8)] } });
await H.start(['Hans', 'Grete'], ['reich', 'frankreich']);
const [A, B] = H.pages.map(P => P.p);
const cab = async (p, name) => (await p.$('.cabinet')).screenshot({ path: OUT + name });
const site = await A.evaluate(() => EVT.cur ? { x: EVT.cur.site.x, y: EVT.cur.site.y, id: EVT.cur.id } : null);
console.log('event', JSON.stringify(site));
for (const [p, dx] of [[A, -40], [B, 40]]) await p.evaluate(([x, y]) => { G.knight.x = x; G.knight.y = y; HERO.lvl = 8; refreshStats(); G.knight.hp = ST.hp; $('banner').hidden = true; updateHud(); }, [site.x + dx, site.y + 40]);
const bot = () => { window.__bot = setInterval(() => {
  if (G.mode !== 'play') return;
  const k = G.knight; keys.clear(); atkHeld = false; k.hp = ST.hp;
  let best = null, bd = 1e9;
  for (const m of G.mons){ if (!m.ev) continue; const d = Math.hypot(m.x - k.x, m.y - k.y); if (d < bd){ bd = d; best = m; } }
  if (!best) return;
  const dx = best.x - k.x, dy = best.y - k.y;
  if (Math.abs(dx) > 24) keys.add(dx > 0 ? 'right' : 'left');
  if (Math.abs(dy) > 8) keys.add(dy > 0 ? 'down' : 'up');
  if (bd < 46){ k.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); atkHeld = true; }
}, 100); };
const st = p => p.evaluate(() => { const E = EVT.cur; return E ? E.phase + ' ' + E.killedN + '/' + E.need + ' boss ' + (E.bossHp | 0) + '/' + E.bossMax + ' mine ' + E.killed.reduce((a, b) => a + b, 0) + ' dmg ' + Math.round(E.dmg) + ' mons ' + G.mons.filter(m => m.ev).length + (E.over ? ' OVER won=' + E.won : '') : 'kein'; });
await wait(12000);
console.log('t+12', await st(A), '|', await st(B));
await cab(A, 'ev_a1.png');
await A.evaluate(bot); await B.evaluate(bot);
let shots = 0;
for (let i = 0; i < 40; i++){
  await wait(4000);
  const a = await st(A), b = await st(B);
  console.log('t+' + (16 + i * 4), a, '|', b);
  if (/boss/.test(a) && shots === 0){ await wait(1500); await cab(A, 'ev_boss_a.png'); await cab(B, 'ev_boss_b.png'); shots = 1; }
  if (/OVER/.test(a) && /OVER/.test(b)) break;
}
await wait(800);
await cab(A, 'ev_end.png');
console.log('A inv', await A.evaluate(() => HERO.inv.filter(Boolean).map(i => i.n).join(', ') + ' gold ' + HERO.gold + ' log ' + [...document.querySelectorAll('#log p')].slice(-2).map(p => p.textContent).join(' / ')));
console.log('B inv', await B.evaluate(() => HERO.inv.filter(Boolean).map(i => i.n).join(', ') + ' gold ' + HERO.gold));
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
