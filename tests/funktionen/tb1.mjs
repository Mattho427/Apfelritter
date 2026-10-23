// Kleine Bibel: Bildbogen, Werte, Fund, Gebet, Untote, Zweihand-Regel, Symbole
import { launch, wait, OUT } from '../mehrspieler/harness.mjs';
import fs from 'fs';
const H = await launch(1, { init: { fn: () => { window.__wx = 'klar'; }, arg: 0 } });
await H.start(['Hans'], ['reich']);
const A = H.pages[0].p;
const T = async (name, fn, arg) => { const r = await A.evaluate(fn, arg); console.log(name.padEnd(22), JSON.stringify(r)); return r; };
await T('Bibel-Namen', () => [1, 5, 9, 13, 17].map(l => { const it = makeItem('schild', l, l > 12 ? 3 : 1, { nh: 'bibel' }); return it.n + ' | ' + itemLines(it).join(', ') + ' | arm ' + it.arm; }));
await T('Anteil Bibeln', () => { let n = 0; for (let i = 0; i < 1000; i++) if (makeItem('schild', 8, 1).nh) n++; return n / 10 + ' %'; });
await T('Werte Schild/Bibel', () => {
  HERO.lvl = 10; refreshStats();
  const sh = makeItem('schild', 10, 1); sh.a = {}; sh.nh = undefined; delete sh.nh;
  let i = HERO.inv.indexOf(null); HERO.inv[i] = sh; equipFrom(i);
  const a = { hp: ST.hp, arm: ST.arm, block: ST.block, regen: ST.regen, look: lookOf(HERO.eq), stoss: document.querySelector('[data-skill="stoss"]').title };
  const bb = makeItem('schild', 10, 1, { nh: 'bibel' }); i = HERO.inv.indexOf(null); HERO.inv[i] = bb; equipFrom(i);
  const b = { hp: ST.hp, arm: ST.arm, block: ST.block, regen: ST.regen, look: lookOf(HERO.eq), stoss: document.querySelector('[data-skill="stoss"]').title, card: itemCard(bb).innerText.replace(/\n/g, ' | ') };
  return { schild: a, bibel: b };
});
await T('Gebet', () => { const k = G.knight; HERO.lvl = 10; refreshStats(); k.hp = 20; k.slowT = 2; G.cd = {}; skillStoss(); return { hp: k.hp, max: ST.hp, slow: k.slowT, cd: G.cd.stoss, bash: k.bashT }; });
await T('Zweihänder nimmt Bibel', () => { const it = makeItem('waffe', 10, 1, { wt: 'zweihaender' }); const i = HERO.inv.indexOf(null); HERO.inv[i] = it; equipFrom(i); return { schild: HERO.eq.schild && HERO.eq.schild.n, look: lookOf(HERO.eq), log: [...document.querySelectorAll('#log div, #log p, .log > *')].slice(-1).map(e => e.textContent) }; });
await T('Bibel nimmt Zweihänder', () => { const j = HERO.inv.findIndex(x => isBib(x)); equipFrom(j); return { waffe: HERO.eq.waffe && HERO.eq.waffe.n, schild: HERO.eq.schild && HERO.eq.schild.n, look: lookOf(HERO.eq) }; });
// Fund beim ersten Wiedergänger
await A.evaluate(() => { const sw = makeItem('waffe', 10, 1, { wt: 'schwert' }); delete sw.wt; const i = HERO.inv.indexOf(null); HERO.inv[i] = sw; equipFrom(i); setInterval(() => { if (G.knight.hp > 0) G.knight.hp = ST.hp; }, 100); });
await T('Fund', () => { delete HERO.bib; const k = G.knight, m = createMonster('wieder', k.x + 30, k.y, 5); m.by = 'me'; kill(m); return { bib: HERO.bib, loot: G.loot ? G.loot.filter(l => l.it && isBib(l.it)).map(l => l.it.n) : 'keine Liste' }; });
await T('kein zweiter Fund', () => { const k = G.knight, m = createMonster('wieder', k.x + 30, k.y, 5); m.by = 'me'; const n0 = (G.loot || []).filter(l => l.it && isBib(l.it)).length; kill(m); return (G.loot || []).filter(l => l.it && isBib(l.it)).length - n0; });
// Schaden gegen Untote: Mittelwert mit und ohne Bibel
await T('Untote +25 %', () => {
  const k = G.knight, avg = (kind) => { let s = 0; for (let n = 0; n < 60; n++){ const m = createMonster(kind, k.x + 30, k.y - 5, 10); m.hp = m.max = 1e6; m.spd = 0; k.dir = 'right'; startSwing(k, false, 1, .3); k.atkT = .01; swingHits(); s += m.max - m.hp; G.mons.splice(G.mons.indexOf(m), 1); } return Math.round(s / 60); };
  G.buffT = 0; const withB = { wieder: avg('wieder'), pluend: avg('pluend') };
  const bb = HERO.eq.schild; HERO.eq.schild = null; refreshStats(); const noB = { wieder: avg('wieder'), pluend: avg('pluend') }; HERO.eq.schild = bb; refreshStats();
  return { mitBibel: withB, ohne: noB };
});
await T('cleanItem', () => { const it = makeItem('schild', 10, 2, { nh: 'bibel' }); const c = cleanItem(JSON.parse(JSON.stringify(Object.assign({}, it, { arm: 50, a: Object.assign({}, it.a, { block: 9 }) })))); return { nh: c.nh, arm: c.arm, a: c.a, n: c.n }; });
// Bildbogen
const url = await A.evaluate(() => {
  const C = 110, dirs = ['down', 'right', 'up', 'left'], rows = [['221', 'Schild'], ['22b', 'Bibel']];
  const sc = document.createElement('canvas'); sc.width = dirs.length * 2 * C; sc.height = rows.length * C; const sg = sc.getContext('2d');
  sg.fillStyle = '#7a9a5a'; sg.fillRect(0, 0, sc.width, sc.height);
  rows.forEach(([body], r) => {
    const set = knightSet('reich', body + '22'); let c = 0;
    for (const d of dirs) for (const ph of ['carry', 'atk']){
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#7a9a5a'; ctx.fillRect(0, 0, C, C);
      const k = { x: 55, y: 80, dir: d, moving: false, anim: 0, atkT: 0, atkLen: .3, swA0: 0, swA1: 0, mult: 1, bashT: 0, inv: 0, slowT: 0, swing: 0 };
      if (ph === 'atk'){ const [fx, fy] = DIRV[d], base = Math.atan2(fy, fx); k.swA0 = base - 1.45; k.swA1 = base + 1.45; k.atkT = .12; }
      drawKnightAt(k, set, false, 1); ctx.restore(); sg.drawImage(cv, 0, 0, C, C, c * C, r * C, C, C); c++;
    }
  });
  const big = document.createElement('canvas'); big.width = sc.width * 2; big.height = sc.height * 2 + 70;
  const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.fillStyle = '#222'; bg.fillRect(0, 0, big.width, big.height); bg.drawImage(sc, 0, 0, sc.width * 2, sc.height * 2);
  bg.drawImage(BIB_ICON, 10, sc.height * 2 + 3, 64, 64); bg.drawImage(ICONS.shield, 90, sc.height * 2 + 3, 64, 64);
  return big.toDataURL();
});
fs.writeFileSync(OUT + 'tb1_sheet.png', Buffer.from(url.split(',')[1], 'base64'));
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
