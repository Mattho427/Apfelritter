// Waffenarten im Kampf: Bolzen, Fächer, Durchschuss, Reichweite, Betäubung, Zeugmeister
import { launch, wait, OUT } from '../mehrspieler/harness.mjs';
const H = await launch(1, { init: { fn: () => { window.__wx = 'klar'; }, arg: 0 } });
await H.start(['Hans'], ['reich']);
const A = H.pages[0].p;
await A.evaluate(() => {
  HERO.lvl = 12; refreshStats(); setInterval(() => { if (G.knight.hp > 0) G.knight.hp = ST.hp; }, 100);
  window.__eq = wt => { const it = makeItem('waffe', 12, 1, { wt }); const i = HERO.inv.indexOf(null); HERO.inv[i] = it; equipFrom(i); G.cd = {}; G.knight.atkCd = 0; };
  const clear = (x, y) => { for (let dy = -70; dy <= 70; dy += 8) for (let dx = -70; dx <= 230; dx += 8) if (gBlocked(x + dx - 3, y + dy - 3, x + dx + 3, y + dy + 3, false)) return false; return true; };
  let spot = null;
  for (let y = 600; y < GH - 600 && !spot; y += 96) for (let x = 600; x < GW - 600 && !spot; x += 96) if (gZone(x, y).id === 'obstgarten' && clear(x, y)) spot = { x, y };
  window.__spot = spot;
  window.__arena = () => { for (const m of G.mons.slice()) G.mons.splice(G.mons.indexOf(m), 1); G.knight.x = spot.x; G.knight.y = spot.y; G.knight.dir = 'right'; G.kbolts = []; return spot; };
  window.__mon = (dx, dy) => { const k = G.knight, m = createMonster('wieder', k.x + dx, k.y + dy, 12); m.hp = m.max = 99999; m.spd = 0; return m; };
});
await A.evaluate(() => __arena()); await wait(2500);
console.log('Stelle', await A.evaluate(() => JSON.stringify(__spot) + ' ' + gZone(__spot.x, __spot.y).id));
const T = async (name, fn) => { const r = await A.evaluate(fn); console.log(name.padEnd(28), JSON.stringify(r)); return r; };
// Armbrust: einzelner Schuss
await A.evaluate(() => { __eq('armbrust'); __arena(); window.__m1 = __mon(150, 0); attack(); });
await wait(120);
await (await A.$('canvas')).screenshot({ path: OUT + 'tw2_bolt.png' });
await wait(700);
await T('Schuss', () => ({ hp: __m1.max - __m1.hp, bolts: (G.kbolts || []).length, cd: +G.knight.atkCd.toFixed(2) }));
// Bolzenfächer: drei Gegner im Fächer
await A.evaluate(() => { __arena(); window.__ms = [__mon(110, -40), __mon(130, 0), __mon(110, 40)]; G.cd = {}; G.knight.atkCd = 0; skillRund(); });
await wait(900);
await T('Fächer', () => __ms.map(m => m.max - m.hp));
// Durchschuss: drei in einer Reihe
await A.evaluate(() => { __arena(); window.__ms = [__mon(70, 0), __mon(120, 0), __mon(170, 0)]; G.cd = {}; G.knight.atkCd = 0; skillStoss(); });
await wait(900);
await T('Durchschuss', () => __ms.map(m => m.max - m.hp));
// ohne Durchschuss: nur der erste
await A.evaluate(() => { __arena(); window.__ms = [__mon(70, 0), __mon(120, 0)]; G.knight.atkCd = 0; attack(); });
await wait(900);
await T('Schuss Reihe', () => __ms.map(m => m.max - m.hp));
// Zielhilfe: Gegner schräg vorn
await A.evaluate(() => { __arena(); window.__m1 = __mon(120, 50); G.knight.atkCd = 0; attack(); });
await wait(900);
await T('Zielhilfe', () => __m1.max - __m1.hp);
// Reichweite: Gegner 62 vor dem Griff – Schwert nein, Hellebarde ja
for (const wt of ['schwert', 'hellebarde', 'zweihaender']){
  await A.evaluate(wt => { __eq(wt); __arena(); window.__m1 = __mon(64, -20); G.knight.atkCd = 0; attack(); }, wt);
  await wait(700);
  await T('Reichweite ' + wt, () => ({ dmg: __m1.max - __m1.hp, reach: Math.round(reachOf(G.knight)), cd: +ST.cd.toFixed(2) }));
}
// Hellebardenstoß weit vorn, Mordschlag betäubt
await A.evaluate(() => { __eq('hellebarde'); __arena(); window.__m1 = __mon(88, 0); G.cd = {}; skillStoss(); });
await wait(120); await (await A.$('canvas')).screenshot({ path: OUT + 'tw2_stoss.png' }); await wait(600);
await T('Hellebardenstoß', () => ({ dmg: __m1.max - __m1.hp, stun: +(__m1.stunT || 0).toFixed(2) }));
await A.evaluate(() => { __eq('zweihaender'); __arena(); window.__m1 = __mon(40, -20); G.cd = {}; skillStoss(); });
await wait(200);
await T('Mordschlag', () => ({ dmg: __m1.max - __m1.hp, stun: +(__m1.stunT || 0).toFixed(2), cd: G.cd.stoss }));
await A.evaluate(() => { __arena(); window.__ms = [__mon(40, -20), __mon(-40, -20), __mon(0, 30)]; G.cd = {}; G.knight.atkCd = 0; skillRund(); });
await wait(800);
await T('Wirbelhieb', () => __ms.map(m => m.max - m.hp));
// Zeugmeister
await A.evaluate(() => { __arena(); for (const m of G.mons.slice()) G.mons.splice(G.mons.indexOf(m), 1); const n = NPCS.find(n => n.zeug); G.knight.x = n.x; G.knight.y = n.y + 30; G.knight.dir = 'up'; HERO.gold = 5000; });
await wait(1500);
await (await A.$('canvas')).screenshot({ path: OUT + 'tw2_zeug.png' });
await A.evaluate(() => { openTalk(NPCS.find(n => n.zeug)); });
await wait(300);
await T('Zeugmeister Optionen', () => [...document.querySelectorAll('#talkBody button')].map(b => b.textContent));
await A.evaluate(() => { [...document.querySelectorAll('#talkBody button')].find(b => b.textContent === 'Waffen kaufen').click(); });
await wait(300);
await (await A.$('.cabinet')).screenshot({ path: OUT + 'tw2_laden.png' });
await T('Laden', () => [...document.querySelectorAll('#talkBody .shoprow')].map(r => r.innerText.replace(/\n/g, ' | ')));
await A.evaluate(() => { [...document.querySelectorAll('#talkBody .shoprow button')][2].click(); });
await wait(300);
await T('gekauft', () => ({ gold: HERO.gold, inv: HERO.inv.filter(Boolean).map(i => i.n + ' ' + (i.wt || 'schwert')).slice(-2) }));
await A.evaluate(() => { [...document.querySelectorAll('#talkBody button')].find(b => b.textContent === 'Zurück').click(); });
await wait(200);
await A.evaluate(() => { [...document.querySelectorAll('#talkBody button')].find(b => /passt/.test(b.textContent)).click(); });
await wait(300);
await (await A.$('.cabinet')).screenshot({ path: OUT + 'tw2_info.png' });
// Beute: Verteilung der Arten
await T('Beute 400', () => { const c = {}; for (let i = 0; i < 400; i++){ const it = makeItem('waffe', 10, 1); c[it.wt || 'schwert'] = (c[it.wt || 'schwert'] || 0) + 1; } return c; });
await T('Namen', () => ['hellebarde', 'zweihaender', 'armbrust'].map(wt => [0, 4, 8, 12, 17].map(l => makeItem('waffe', l + 1, l > 10 ? 3 : 1, { wt }).n).join(', ')));
await T('cleanItem', () => { const it = makeItem('waffe', 10, 2, { wt: 'zweihaender' }); const c = cleanItem(JSON.parse(JSON.stringify(it))); const bad = cleanItem(Object.assign({}, it, { wt: 'kanone' })); return { wt: c.wt, dmg: [it.dmg, c.dmg], bad: bad.wt || 'schwert' }; });
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
