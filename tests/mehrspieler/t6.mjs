import { launch, wait, OUT } from './harness.mjs';
import { zeigeTafel, schliesseTafel } from '../pfad.mjs';
const H = await launch(2);
await H.start(['Hans', 'Grete'], ['reich', 'spanien']);
const [A, B] = H.pages.map(P => P.p);
const cab = async (p, name) => (await p.$('.cabinet')).screenshot({ path: OUT + name });
// Festrekorde und Turnierwertung
await A.evaluate(() => { HERO.frec = { stein: 138, klettern: 92 }; HERO.joust = { wins: 1, beat: {}, elo: 1032, pw: 3, pl: 1 }; cloud.fameT = 0; cloud.fameLast = ''; pushFame(); });
await B.evaluate(() => { HERO.frec = { stein: 131, schnee: 34, springen: 241 }; HERO.joust = { wins: 0, beat: {}, elo: 968, pw: 1, pl: 3 }; cloud.fameT = 0; cloud.fameLast = ''; pushFame(); });
await wait(1500);
console.log('DB', JSON.stringify([...H.DBS].filter(([k]) => k.startsWith('heroes/')).map(([k, v]) => [v.nm, v.je, v.jw, v.jl, v.fs, v.fk, v.fj, v.fb])));
for (const t of ['tjost', 'feste']){
  await A.evaluate(t => { document.querySelector('[data-ft="' + t + '"]').click(); }, t); await wait(200);
  await zeigeTafel(A, '#fameList');
  const note = await A.evaluateHandle(() => document.getElementById('fameList').closest('.note'));
  await note.asElement().screenshot({ path: OUT + 'fame_' + t + '.png' }); await schliesseTafel(A);
  console.log(t, await A.evaluate(() => $('fameList').textContent));
}
console.log('best stein', await B.evaluate(() => JSON.stringify(festBest('stein'))));
// Rekord melden: B wirft 14,0 Ellen
await B.evaluate(() => festRecord('stein', 140)); await wait(300);
console.log('B log', await B.evaluate(() => [...document.querySelectorAll('#log p')].slice(-1).map(p => p.textContent).join()));
// Anwesenheit mit sechs verbesserten Gegenständen im Handel
const bytes = await A.evaluate(() => {
  for (let i = 0; i < 6; i++){ const it = makeItem(SLOTS[i], 18, 3); upgradeItem(it); upgradeItem(it); HERO.inv[i] = it; }
  NET.tr = { id: 'x', w: 'peer1', nm: 'Grete', idx: [0, 1, 2, 3, 4, 5], g: 999, ok: ['abc', 'def'], t: nowS(), seen: nowS(), done: 0 };
  const n = JSON.stringify(Object.assign({ ws: 2, x: 1000, y: 1000, d: 'down', mv: 1, sw: 12, sa: 1.23, se: 2.34, sl: .3, m: 1, lv: 18, nm: 'Hansjoachim Lang', f: 'reich', lk: '33333', ln: 0, in: 0, ri: 0, dead: 0, z: 'obstgarten' }, netPres())).length;
  NET.tr = null; return n;
});
console.log('presence bytes mit 6 Gegenständen:', bytes);
// Gewölbe gemeinsam
for (const p of [A, B]) await p.evaluate(() => { const d = DG_DOORS.find(d => d.dg === 'krypta'); G.knight.x = d.x; G.knight.y = d.y + 20; HERO.lvl = 9; refreshStats(); G.knight.hp = ST.hp; enterDungeon(d); });
await wait(300);
await B.evaluate(() => { G.knight.x += 30; });
await wait(900);
console.log('A in dg sees', await A.evaluate(() => [...PEERS.values()].map(q => q.nm + ' in ' + q.in + ' same ' + samePlace(q)).join()));
await cab(A, 'dg_a.png');
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
