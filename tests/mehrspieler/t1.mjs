import { launch, wait, OUT } from './harness.mjs';
const H = await launch(2);
await H.start(['Hans', 'Grete'], ['reich', 'frankreich']);
const [A, B] = H.pages.map(P => P.p);
const cab = async (p, name) => (await p.$('.cabinet')).screenshot({ path: OUT + name });
// beide in den Obstgarten an ein Lager
const spot = await A.evaluate(() => { const s = SPAWN_SLOTS.find(s => s.zone === 'obstgarten' && s.kind === 'wieder'); return { x: s.x, y: s.y }; });
for (const [p, dx] of [[A, 120], [B, 150]]) await p.evaluate(([x, y]) => { G.knight.x = x; G.knight.y = y; HERO.lvl = 4; refreshStats(); G.knight.hp = ST.hp; $('banner').hidden = true; }, [spot.x + dx, spot.y + 60]);
await wait(900);
// A spricht B an
const near = await A.evaluate(() => G.nearPeer && G.nearPeer.nm);
console.log('A near peer:', near, 'btn:', await A.evaluate(() => $('btnTalk').textContent));
await A.keyboard.press('KeyE'); await wait(300);
console.log('A peer opts:', await A.evaluate(() => [...document.querySelectorAll('#talkBody [data-k]')].map(b => b.dataset.k + ':' + b.textContent + (b.disabled ? '(x)' : '')).join(' | ')));
await cab(A, 'p_peer.png');
await A.keyboard.press('Digit1'); await wait(700);
console.log('B ask:', await B.evaluate(() => !$('ask').hidden && $('askText').textContent));
await cab(B, 'p_ask.png');
await B.evaluate(() => setKbd(true));
await B.keyboard.press('KeyY'); await wait(900);
console.log('party A', await A.evaluate(() => NET.pt && NET.pt.id + ' members ' + partyList().map(q => q.nm)), '| B', await B.evaluate(() => NET.pt && NET.pt.id + ' members ' + partyList().map(q => q.nm)));
console.log('tracker A:', await A.evaluate(() => $('tracker').textContent));
// gemeinsamer Kampf: nur B haut; A sammelt mit
const a0 = await A.evaluate(() => ({ kills: HERO.kills, xp: HERO.xp, mons: G.mons.length }));
const b0 = await B.evaluate(() => ({ kills: HERO.kills, xp: HERO.xp, mons: G.mons.length }));
console.log('vorher A', JSON.stringify(a0), 'B', JSON.stringify(b0));
for (let r = 0; r < 50; r++){
  const dir = await B.evaluate(() => {
    const k = G.knight; let best = null, bd = 1e9;
    for (const m of G.mons){ const d = Math.hypot(m.x - k.x, m.y - k.y); if (d < bd){ bd = d; best = m; } }
    if (!best || bd > 600) return null;
    const dx = best.x - k.x, dy = best.y - k.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
  });
  if (!dir) break;
  await B.keyboard.down(dir); await B.keyboard.down('Space'); await wait(250); await B.keyboard.up('Space'); await B.keyboard.up(dir);
  await A.evaluate(() => { G.knight.hp = ST.hp; }); await B.evaluate(() => { G.knight.hp = ST.hp; });
  if (r === 8){ await cab(A, 'p_fightA.png'); await cab(B, 'p_fightB.png'); }
}
await wait(600);
const a1 = await A.evaluate(() => ({ kills: HERO.kills, xp: HERO.xp, mons: G.mons.map(m => m.k + ':' + m.mode + ':' + Math.round(m.hp) + (m.tgt ? '>' + (m.tgt === G.knight ? 'me' : m.tgt.nm) : '')).join(' ') }));
const b1 = await B.evaluate(() => ({ kills: HERO.kills, xp: HERO.xp, mons: G.mons.map(m => m.k + ':' + m.mode + ':' + Math.round(m.hp) + (m.tgt ? '>' + (m.tgt === G.knight ? 'me' : m.tgt.nm) : '')).join(' ') }));
console.log('nachher A', JSON.stringify(a1)); console.log('nachher B', JSON.stringify(b1));
await cab(A, 'p_afterA.png');
console.log('presence bytes max', await A.evaluate(() => window.__presBytes), await B.evaluate(() => window.__presBytes));
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
