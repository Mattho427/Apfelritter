// Waffenarten: Bildbogen (Haltung, Hieb), Werte, Fähigkeitenleiste
import { launch, wait, OUT } from '../mehrspieler/harness.mjs';
import fs from 'fs';
const H = await launch(1, { init: { fn: () => { window.__wx = 'klar'; }, arg: 0 } });
await H.start(['Hans'], ['reich']);
const A = H.pages[0].p;
const res = await A.evaluate(() => {
  HERO.lvl = 12; refreshStats();
  const out = {};
  HERO.eq.schild = makeItem('schild', 12, 1);
  for (const wt of ['schwert', 'hellebarde', 'zweihaender', 'armbrust']){
    const it = makeItem('waffe', 12, 2, { wt }); it.dmg = 30;   // gleiche Grundlage
    const i = HERO.inv.indexOf(null); HERO.inv[i] = it; equipFrom(i);
    out[wt] = { name: it.n, look: lookOf(HERO.eq), dmg: ST.dmg, cd: +ST.cd.toFixed(3), block: ST.block, arm: ST.arm, schild: !!HERO.eq.schild,
      hieb: document.querySelector('[data-skill="hieb"]').title, rund: document.querySelector('[data-skill="rund"]').title, stoss: document.querySelector('[data-skill="stoss"]').title };
    if (wt === 'armbrust'){ const j = HERO.inv.findIndex(x => x && x.s === 'schild'); out.reequipShield = j; if (j >= 0){ equipFrom(j); out.afterShield = { waffe: HERO.eq.waffe && HERO.eq.waffe.n, schild: !!HERO.eq.schild, look: lookOf(HERO.eq) }; } }
  }
  return out;
});
console.log(JSON.stringify(res, null, 1));
// Bildbogen
const sheet = async (name, phases) => {
  const url = await A.evaluate(phases => {
    const C = 120, wts = ['schwert', 'hellebarde', 'zweihaender', 'armbrust'], dirs = ['down', 'right', 'up', 'left'];
    const cols = phases.length * dirs.length;
    const sc = document.createElement('canvas'); sc.width = cols * C; sc.height = wts.length * C;
    const sg = sc.getContext('2d');
    sg.fillStyle = '#7a9a5a'; sg.fillRect(0, 0, sc.width, sc.height);
    wts.forEach((wt, r) => {
      const look = '221' + '22' + (wt === 'schwert' ? '' : WT[wt].code);
      const lk = wt === 'schwert' ? look : look.slice(0, 2) + 'x' + look.slice(3);
      const set = knightSet('reich', lk);
      let c = 0;
      for (const d of dirs) for (const ph of phases){
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#7a9a5a'; ctx.fillRect(0, 0, C, C);
        const k = { x: 60, y: 84, dir: d, moving: false, anim: 0, atkT: 0, atkLen: .3, swA0: 0, swA1: 0, mult: 1, bashT: 0, inv: 0, slowT: 0, swing: 0, wt };
        if (ph !== 'carry'){
          const [fx, fy] = DIRV[d], base = Math.atan2(fy, fx), arc = WT[wt].arc || 1.45;
          if (ph === 'skill' && wt === 'hellebarde'){ k.mult = 1.8; k.swA0 = base - .0001; k.swA1 = base + .0001; k.atkLen = .28; k.atkT = .28 * .55; }
          else if (wt === 'armbrust'){ k.atkLen = .25; k.atkT = ph === 'a1' ? .22 : .08; k.swA0 = k.swA1 = base; }
          else { k.atkLen = .3; k.swA0 = base - arc; k.swA1 = base + arc; k.atkT = ph === 'a1' ? .2 : .06; if (ph === 'skill'){ k.mult = 2.4; k.swA0 = base - .55; k.swA1 = base + .55; } }
        }
        drawKnightAt(k, set, false, 1);
        ctx.restore();
        sg.drawImage(cv, 0, 0, C, C, c * C, r * C, C, C); c++;
      }
    });
    const big = document.createElement('canvas'); big.width = sc.width * 2; big.height = sc.height * 2;
    const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(sc, 0, 0, big.width, big.height);
    return big.toDataURL();
  }, phases);
  fs.writeFileSync(OUT + name + '.png', Buffer.from(url.split(',')[1], 'base64'));
};
await A.evaluate(() => { G.paused = true; });
await sheet('tw1_carry', ['carry']);
await sheet('tw1_atk', ['a1', 'a2']);
await sheet('tw1_skill', ['skill']);
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
