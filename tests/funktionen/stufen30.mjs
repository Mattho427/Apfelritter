// Stufen bis 30: Aufstieg, Titel, Meisterschaften (Wahl, Wirkung, Neuordnen), Ehrenstufen erst ab 30, Speichern
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
await p.evaluate(() => { const h = freshHero('Hans', 'reich'); h.lvl = 19; h.gold = 5000; startGame(h); $('banner').hidden = true; });
await p.waitForTimeout(500);
let fehl = 0;
const T = async (name, fn, ok, arg) => { const r = await p.evaluate(fn, arg), gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
await T('Höchststufe', () => ({ max: MAX_LVL, t20: titleOf(20), t25: titleOf(25), t30: titleOf(30) }), r => r.max === 30 && r.t30 === 'König' && r.t20 === 'Erzherzog');
await T('Aufstieg auf 20', () => { gainXp(xpNeed(19)); return { lvl: HERO.lvl, free: talFree() }; }, r => r.lvl === 20 && r.free === 1);
await T('Rucksack-Knopf', () => { openBag(); return [...$('itemInfo').querySelectorAll('button')].map(x => x.textContent); }, r => r.some(t => /Meisterschaften \(1 frei\)/.test(t)));
await T('Eiserne Haut', () => { const hp0 = ST.hp; [...$('itemInfo').querySelectorAll('button')].find(x => /Meisterschaften/.test(x.textContent)).click(); document.querySelector('[data-slot="tal:haut"]').click(); return { hp0, hp1: ST.hp, tal: HERO.tal, free: talFree(), dis: document.querySelector('[data-slot="tal:klinge"]').disabled }; },
  r => r.hp1 > r.hp0 && r.tal[20] === 'haut' && r.free === 0 && r.dis);
await T('Aufstieg auf 30', () => { closePanel(); let n = 0; while (HERO.lvl < 30 && n++ < 20) gainXp(xpNeed(HERO.lvl)); return { lvl: HERO.lvl, xp: HERO.xp, free: talFree(), eh: HERO.eh && HERO.eh.n }; }, r => r.lvl === 30 && r.free === 5);
await T('Alle wählen', () => { for (const [l, id] of [[22, 'flink'], [24, 'feldscher'], [26, 'lern'], [28, 'geissel'], [30, 'meister']]) HERO.tal[l] = id; refreshStats(); return { spd: ST.spd, crit: ST.crit, free: talFree() }; }, r => r.free === 0 && r.spd >= 8);
await T('Feldscher', () => { const k = G.knight; k.hp = 1; HERO.potions = 3; G.cd.trank = 0; drinkPotion(); return { heal: k.hp - 1, soll: Math.round(ST.hp * .6) }; }, r => r.heal === r.soll);
await T('Geißel der Untoten', () => { const m = { k: 'wieder' }, n = { k: 'wolf' }; return { untot: foeMul(m), wolf: foeMul(n) }; }, r => r.untot >= 1.2 && r.wolf === 1);
await T('Lernbegier, Ehre ab 30', () => { const e0 = (HERO.eh && HERO.eh.xp) || 0; gainXp(1000); return { eh: HERO.eh, lvl: HERO.lvl }; }, r => r.eh && r.eh.xp + r.eh.n * 4000 >= 1080);
await T('Neu ordnen', () => { G.zone = 'annaberg'; openBag(); G.talView = true; renderBag(); const g = HERO.gold; [...$('itemInfo').querySelectorAll('button')].find(x => /Neu ordnen/.test(x.textContent)).click(); return { tal: HERO.tal, kosten: g - HERO.gold }; }, r => Object.keys(r.tal).length === 0 && r.kosten === 100 + 30 * 20);
await T('Speichern säubert', () => { const h = cleanHero(Object.assign(JSON.parse(JSON.stringify(HERO)), { lvl: 23, tal: { 20: 'haut', 22: 'flink', 24: 'feldscher', 26: 'xxx', 21: 'klinge' } })); return h.tal; }, r => r[20] === 'haut' && r[22] === 'flink' && !r[24] && !r[26] && !r[21]);
await (await p.$('.cabinet')).screenshot({ path: OUT + 'st_meister.png' });
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
