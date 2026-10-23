// Gegenstände bis Stufe 32: Grundformen, neue Zusätze, Fundstücke, Rüstungssätze, Waren; Handel/Post packen und prüfen
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
await p.evaluate(() => { const h = freshHero('Hans', 'reich'); h.lvl = 30; h.gold = 9000; startGame(h); $('banner').hidden = true; });
await p.waitForTimeout(500);
let fehl = 0;
const T = async (name, fn, ok, arg) => { const r = await p.evaluate(fn, arg), gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
await T('Grundformen 21-32', () => [21, 25, 29, 32].map(il => { const it = makeItem('ruestung', il, 2); return il + ':' + it.b + ':' + it.n; }), r => r.every(x => !/undefined/.test(x)) && /:7:/.test(r[3]));
await T('Waffenarten Stufe 31', () => ['schwert', 'hellebarde', 'zweihaender', 'armbrust'].map(wt => makeItem('waffe', 31, 1, { wt }).n), r => r.every(x => x && !/undefined/.test(x)));
await T('Bibel Stufe 30', () => makeItem('schild', 30, 1, { nh: 'bibel' }).n, r => /bibel/i.test(r));
await T('Neue Zusätze', () => { const seen = {}; for (let i = 0; i < 400; i++){ const it = makeItem(pick(['kleinod', 'waffe']), 28, 3); for (const k in it.a) seen[k] = (seen[k] || 0) + 1; } return seen; }, r => r.xp && r.gold && r.holy && r.leech);
await T('Nicht unter Stufe 15', () => { let bad = 0; for (let i = 0; i < 300; i++){ const it = makeItem('kleinod', 10, 3); if (it.a.xp || it.a.gold) bad++; } return bad; }, r => r === 0);
await T('Zusätze wirken', () => { HERO.eq.kleinod = makeItem('kleinod', 30, 3, { aff: ['xp', 'gold', 'hp'] }); HERO.eq.waffe = makeItem('waffe', 30, 3, { wt: 'schwert', aff: ['holy', 'leech', 'str'] }); refreshStats(); return { xp: ST.xp, gold: ST.gold, holy: ST.holy, leech: ST.leech, untot: foeMul({ k: 'wieder' }) }; },
  r => r.xp > 0 && r.gold > 0 && r.holy > 0 && r.leech > 0 && r.untot > 1);
await T('Lebensraub heilt', () => { const k = G.knight; k.hp = 10; leech(400); return k.hp; }, r => r > 10);
await T('Satz: 4 Teile', () => { const hp0 = heroStats(HERO).hp; for (const sl of ['helm', 'ruestung', 'beine', 'schild']) HERO.eq[sl] = makeSetItem('riefel', sl, 30); refreshStats(); return { n: setCount(HERO, 'riefel'), hp0, hp1: ST.hp, names: ['helm', 'schild'].map(s => HERO.eq[s].n) }; }, r => r.n === 4 && r.hp1 > r.hp0);
await T('Satz in der Karte', () => { openBag(); G.sel = { from: 'eq', slot: 'helm' }; renderBag(); return $('itemInfo').querySelector('.iset') ? $('itemInfo').querySelector('.iset').textContent : ''; }, r => /Riefelharnisch \(4 von 4/.test(r));
await (await p.$('.cabinet')).screenshot({ path: OUT + 'gg_satz.png' });
await T('Packen und prüfen', () => { closePanel(); const out = []; for (const it of [makeSetItem('landsknecht', 'waffe', 31), makeItem('waffe', 32, 4, { wt: 'hellebarde' }), makeItem('schild', 30, 2, { nh: 'bibel' }), makeItem(UNIQUES.georgsspiess.s, 31, 4, { name: UNIQUES.georgsspiess.n, aff: UNIQUES.georgsspiess.aff, u: 'georgsspiess', wt: 'hellebarde' })]){ const c = cleanItem(JSON.parse(JSON.stringify(packItem(it)))); out.push([c.n, c.il, c.b, c.wt || '-', c.nh || '-', c.set || '-', c.u || '-'].join('|')); } return out; },
  r => /\|31\|7\|-\|-\|landsknecht/.test(r[0]) && /hellebarde/.test(r[1]) && /bibel/.test(r[2]) && /georgsspiess/.test(r[3]));
await T('Aussehen', () => { HERO.eq.waffe = makeItem('waffe', 32, 4, { wt: 'zweihaender' }); return [lookOf(HERO.eq), LOOK_RE.test(lookOf(HERO.eq))]; }, r => r[1]);
await T('Ritter zeichnen', () => new Promise(res => { refreshStats(); setTimeout(() => res('ok'), 600); }), r => r === 'ok');
await T('Waren aus dem Bergland', () => { G.loot.length = 0; let n = 0; for (let i = 0; i < 60; i++){ const m = createMonster('baer', G.knight.x + 50, G.knight.y, 28, null); m.by = 'me'; kill(m); } const w = G.loot.filter(a => a.it && a.it.s === 'ware').map(a => a.it.w); return { n: w.length, w: [...new Set(w)] }; }, r => r.n > 15 && r.w.includes('baerenfell'));
await T('Fundstücke und Sätze', () => { const real = Math.random; let k = 0; Math.random = () => (k++ % 7 === 0 ? .001 : real()); G.loot.length = 0; for (let i = 0; i < 40; i++){ const m = createMonster('wolf', G.knight.x + 50, G.knight.y, 25, null); m.by = 'me'; kill(m); } Math.random = real; const its = G.loot.filter(a => a.it && a.it.s !== 'ware').map(a => a.it); return { fund: its.filter(i => i.u).length, satz: its.filter(i => i.set).length }; }, r => r.fund > 0 && r.satz > 0);
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
