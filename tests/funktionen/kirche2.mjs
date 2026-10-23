// Kirchen: Dienste der Geistlichen (Segen, Beichte, Kerze, Ablass, Wallfahrt), Messe mit Predigt, Glocken, Speichern
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
await p.evaluate(() => {
  window.__wx = 'klar'; const h = freshHero('Hans', 'reich'); h.lvl = 12; h.gold = 2000; startGame(h); $('banner').hidden = true;
  // Hilfen: in eine Kirche gehen, mit dem n-ten Geistlichen sprechen, Knopf anklicken
  window.__geh = id => { closePanel(); if (G.inside) leaveInn(); const c = CH_BY[id], k = G.knight; k.x = c.dx; k.y = c.y + 14; k.dir = 'up'; updateNear(true); talk(); return G.inside && G.inside.id; };
  window.__sprich = (i = 0) => { closePanel(); openTalk(chRoom(G.inside).clergyN[i]); return [...$('talkBody').querySelectorAll('button')].map(x => x.textContent + (x.disabled ? ' (aus)' : '')); };
  window.__knopf = re => { const x = [...$('talkBody').querySelectorAll('button')].find(q => new RegExp(re).test(q.textContent)); if (!x) return 'kein Knopf ' + re; x.click(); return $('talkText').textContent.slice(0, 160); };
  // Spieluhr auf eine Stunde stellen
  window.__uhr = hr => { const t = Date.now() / 1000, cur = (t / DAY_LEN % 1) * 24; window.__skyShift = ((hr - cur + 24) % 24) / 24 * DAY_LEN; };
});
await p.waitForTimeout(800);
let fehl = 0;
const T = async (name, fn, ok, arg) => {
  const r = await p.evaluate(fn, arg), gut = ok(r);
  if (!gut) fehl++;
  console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r));
  return r;
};

await T('Burgkapelle', () => { window.__uhr(14); return __geh('burgkapelle'); }, r => r === 'burgkapelle');
await T('Kaplan Knöpfe', () => __sprich(0), r => r.some(t => /Segen/.test(t)) && r.some(t => /Beichten/.test(t)) && r.some(t => /Kerze/.test(t)) && r.some(t => /Pilgerbrief/.test(t)));
await T('Segen', () => {
  const g = HERO.gold, hp = ST.hp, txt = __knopf('Segen');
  return { txt, gold: g - HERO.gold, preis: chSegenPreis(), hp0: hp, hp1: ST.hp, t: HERO.bless && HERO.bless.t, chips: $('buffs').querySelectorAll('.buff').length, blessed: chBlessed() };
}, r => r.gold === r.preis && r.hp1 > r.hp0 && r.t > 1190 && r.chips >= 1 && r.blessed);
await T('Beichte', () => {
  __sprich(0); __knopf('Beichten'); const a = __knopf('Würfeln');
  return { a, beicht: HERO.beicht === chDay(), mood: HERO.mood && HERO.mood.t };
}, r => r.beicht && r.mood >= 600 && /absolvo/.test(r.a));
await T('Beichte nochmal', () => { __sprich(0); return __knopf('Beichten'); }, r => /heute schon/.test(r));
await T('Kerze', () => { __sprich(0); const g = HERO.gold, t = __knopf('Kerze'); return { t, gold: g - HERO.gold, n: CH.cand.burgkapelle.length }; }, r => r.gold === 2 && r.n === 1);
await T('Pilgerbrief', () => { __sprich(0); const t = __knopf('Pilgerbrief'); return { t, pilg: HERO.pilg, rows: $('tracker') ? $('tracker').textContent.match(/Wallfahrt[^A-Z]*/) : null }; },
  r => r.pilg && r.pilg.on === 1 && r.pilg.v.burgkapelle === 1);
for (const id of ['stadtkirche', 'klosterkirche', 'wallfahrtskapelle', 'kaiserdom', 'friedhofskapelle'])
  await T('Pilgerort ' + id, id => { __geh(id); return Object.keys(HERO.pilg.v).length; }, r => r === (id === 'friedhofskapelle' ? 5 : ['stadtkirche', 'klosterkirche', 'wallfahrtskapelle', 'kaiserdom'].indexOf(id) + 2), id);
await T('Wallfahrt vollenden', () => {
  __geh('burgkapelle'); const k = __sprich(0), xp = HERO.xp, lv = HERO.lvl, t = __knopf('vollenden'), it = HERO.inv.find(i => i && /Jakobsmuschel/.test(i.n || ''));
  return { k: k.filter(x => /Wallfahrt/.test(x)), t, done: HERO.pilg.done, item: it && { s: it.s, n: it.n, r: it.r, a: it.a }, mehrEP: HERO.xp !== xp || HERO.lvl !== lv };
}, r => r.done === 1 && r.item && r.item.s === 'kleinod' && r.mehrEP);
await T('Nach der Wallfahrt', () => __sprich(0).filter(x => /Wallfahrt|Pilger/.test(x)), r => r.length === 0);

await T('Domherr', () => { __geh('kaiserdom'); const k = __sprich(0); return { k, t: __knopf('Ablass') }; }, r => /Luther/.test(r.t) && !r.k.includes('Erzählt weiter'));
await T('Ablassbrief', () => {
  const k = __sprich(1), g = HERO.gold, t = __knopf('Ablassbrief kaufen');
  return { k, t, gold: g - HERO.gold, preis: chAblassPreis(), ablass: HERO.ablass, chips: [...$('buffs').querySelectorAll('.buff')].map(c => c.textContent) };
}, r => r.gold === r.preis && r.ablass === true && r.chips.includes('Ablass'));
await T('Zweiter Ablass gesperrt', () => __sprich(1).filter(x => /Ablass/.test(x)), r => r.length === 1 && /schon.*\(aus\)/.test(r[0]));
await T('Fall mit Ablass', () => {
  closePanel(); leaveInn(); const g = HERO.gold; die();
  return { verlust: g - HERO.gold, ablass: HERO.ablass, used: G.ablassUsed };
}, r => r.verlust === 0 && r.ablass === false && r.used === true);
await p.waitForTimeout(1800);
await T('Totenschrift', () => $('deadText').textContent, r => /Ablassbrief/.test(r));
await T('Fall ohne Ablass', () => {
  respawn(); if (G.inside) leaveInn(); const g = HERO.gold; G.knight.hp = 1; die();
  return { verlust: g - HERO.gold, soll: Math.floor(g * .1), used: G.ablassUsed };
}, r => r.verlust === r.soll && r.used === false);
await p.waitForTimeout(1800);
await p.evaluate(() => { respawn(); if (G.inside) leaveInn(); });

// Messe in der Stadtkirche: 10 Uhr Spielzeit, nach 40 Sekunden Segen und Erfahrung
await T('Glocken', () => { HERO.bless = null; refreshStats(); const c = CH_BY.stadtkirche, k = G.knight; k.x = c.dx; k.y = c.y + 60; G.zone = gZone(k.x, k.y).id; chHour(9); return [...document.querySelectorAll('#log *')].map(e => e.textContent).filter(t => /Glocken/.test(t)).pop() || ''; }, r => /Glocken.*Messe/.test(r));
await T('Messe beginnt', () => { window.__uhr(10.02); return __geh('stadtkirche'); }, r => r === 'stadtkirche');
await p.waitForTimeout(600);
await T('Kirchgänger', () => { const rm = chRoom(G.inside); return { hour: +SKY.hour.toFixed(2), messe: chMesseNow(), npcs: rm.npcs.length, base: rm.base.length }; }, r => r.messe && r.npcs > r.base);
await p.waitForTimeout(7500);
await T('Predigt', () => CH.say && nowS() < CH.sayT ? CH.say.text : '', r => r.length > 5);
await (await p.$('canvas')).screenshot({ path: OUT + 'ki_messe.png' });
await T('Messe zu Ende', () => {
  const xp = HERO.xp + HERO.lvl * 1e6; for (let i = 0; i < 40; i++) chUpdate(1);
  return { messe: HERO.messe === chDay(), bless: chBlessed(), mehrEP: HERO.xp + HERO.lvl * 1e6 > xp };
}, r => r.messe && r.bless && r.mehrEP);
await T('Nur einmal am Tag', () => { const xp = HERO.xp + HERO.lvl * 1e6; for (let i = 0; i < 60; i++) chUpdate(1); return HERO.xp + HERO.lvl * 1e6 === xp; }, r => r === true);
await T('Nach der Messe', () => { window.__uhr(12); return new Promise(res => setTimeout(() => res({ messe: chMesseNow(), npcs: chRoom(G.inside).npcs.length, base: chRoom(G.inside).base.length }), 400)); }, r => !r.messe && r.npcs === r.base);


// Speichern: Segen, Ablass und Wallfahrt überstehen das Säubern
await T('Speichern', () => {
  HERO.ablass = true; HERO.bless = { t: 500 };
  const h = cleanHero(JSON.parse(JSON.stringify(HERO))) || JSON.parse(JSON.stringify(HERO));
  const bad = cleanHero(Object.assign(JSON.parse(JSON.stringify(HERO)), { bless: { t: 99999 }, pilg: { on: 'x', v: { 'a b': 1, kaiserdom: 1, ['<x>']: 1 } } })) ;
  return { ablass: h.ablass, bless: h.bless, pilg: h.pilg, badBless: bad && bad.bless, badPilg: bad && bad.pilg };
}, r => r.ablass === true && r.bless.t === 500 && r.pilg.done === 1 && (!r.badBless || r.badBless.t <= 1200));
await T('Tafel', () => [...document.querySelectorAll('#chList li')].map(li => li.textContent.slice(0, 40)), r => r.length === 7);

console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
