// Bergland: Annaberg (Leute, Gasthaus, Kirche, Rast), Aufträge des Bergmeisters, neue Gebiete und Gegner
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
await p.evaluate(() => { window.__wx = 'klar'; const h = freshHero('Hans', 'reich'); h.lvl = 20; h.gold = 3000; startGame(h); $('banner').hidden = true; setInterval(() => { if (G.knight.hp > 0) G.knight.hp = ST.hp; }, 200); });
await p.waitForTimeout(600);
let fehl = 0;
const T = async (name, fn, ok, arg) => { const r = await p.evaluate(fn, arg), gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
await T('Gebiete', () => ['schwarzwald', 'annaberg', 'silberrevier', 'schanze', 'hochgebirge'].map(z => z + ':' + (ZONE_LV[z] || 'sicher') + ':' + SPAWN_SLOTS.filter(s => s.zone === z).length), r => r.every(x => !/:0$/.test(x) || /annaberg/.test(x)));
await T('Anführer', () => ['tatzelwurm', 'bergmoench', 'feldhauptmann', 'ruebezahl'].map(k => k + ' ' + (SPAWN_SLOTS.find(s => s.kind === k) || {}).zone + ' ' + gZone(LAIRS[k].x, LAIRS[k].y).id), r => r.every(x => { const [, a, b2] = x.split(' '); return a === b2; }));
await T('Erreichbar', () => { const out = {}; for (const [n, x, y] of [['anna', 2900, 3550], ['schwarz', 900, 3900], ['revier', 2600, 4100], ['schanze', 4450, 3500], ['gebirge', 5400, 4200], ['thron', 5720, 4300], ['schlucht', 520, 4440], ['stollen', 2300, 4490]]){ const q = wo_near(x, y); out[n] = wo_ok(q.x, q.y); } return out; }, r => Object.values(r).every(Boolean));
await T('Gasthaus Kanne', () => { const i = INN_BY.kanne; return i && { name: i.name, host: i.host, bind: !!BIND.kanne }; }, r => r && r.name === 'Zur Silbernen Kanne' && r.bind);
await T('Kirche St. Annen', () => { const c = CH_BY.annenkirche; return c && { name: c.name, zone: gZone(c.x, c.y).id, d: Math.round(Math.hypot(c.x - 3050 * WS, c.y - 3532 * WS)) }; }, r => r && r.zone === 'annaberg' && r.d < 40);
await T('Leute', () => NPCS.filter(n => n.hub === 'annaberg').map(n => n.id + ':' + gZone(n.x, n.y).id), r => r.length === 4 && r.every(x => x.endsWith(':annaberg')));
// zum Bergmeister gehen, Aufträge ansehen, annehmen, rasten
await T('Bergmeister', () => { const n = NPCS.find(q => q.id === 'bergmeister'), k = G.knight; k.x = n.x; k.y = n.y + 24; updateZone(true); openTalk(n); return [...$('talkBody').querySelectorAll('button')].map(x => x.textContent); },
  r => r.some(t => /Wölfe im Schwarzwald/.test(t)) && r.some(t => /Hier rasten/.test(t)) && r.some(t => /Kopfgeld: Der Schwarzwald/.test(t)));
await T('Auftrag annehmen', () => { [...$('talkBody').querySelectorAll('button')].find(x => /Wölfe im Schwarzwald/.test(x.textContent)).click(); $('talkBody').querySelector('button.btn').click(); return HERO.quests.map(q => q.id); }, r => r.includes('g1'));
await T('Rasten', () => { [...$('talkBody').querySelectorAll('button')].find(x => /Hier rasten/.test(x.textContent)).click(); return HERO.bind; }, r => r === 'annaberg');
await T('Kirche betreten', () => { closePanel(); const c = CH_BY.annenkirche, k = G.knight; k.x = c.dx; k.y = c.y + 14; k.dir = 'up'; updateNear(true); talk(); return G.inside && G.inside.id; }, r => r === 'annenkirche');
await T('Gasthaus betreten', () => { leaveInn(); const i = INN_BY.kanne, k = G.knight; k.x = i.dx; k.y = i.dy; updateNear(true); talk(); return G.inside && G.inside.id; }, r => r === 'kanne');
await p.waitForTimeout(500);
await (await p.$('canvas')).screenshot({ path: OUT + 'bl_kanne.png' });
await T('Speisen der Kanne', () => { const w = chRoom ? null : null; const n = G.inside && innRoom(G.inside).npcs.find(q => q.wirt); if (!n) return 'kein Wirt'; openTalk(n); [...$('talkBody').querySelectorAll('button')].find(x => /Speisen/.test(x.textContent)).click(); return [...$('talkBody').querySelectorAll('b')].map(x => x.textContent).filter(t => /Spezialität/.test(t)); }, r => Array.isArray(r) && r.length >= 2);
// Monster im Bergland: je Gebiet ein Lager wecken
await T('Monster', () => { closePanel(); if (G.inside) leaveInn(); const out = []; for (const z of ['schwarzwald', 'silberrevier', 'schanze', 'hochgebirge']){ for (const k of ZONE_MOBS[z]){ const s = SPAWN_SLOTS.find(q => q.zone === z && q.kind === k); if (!s) { out.push(k + ' fehlt'); continue; } const m = createMonster(k, s.x, s.y, s.lvl, null); out.push(k + ' ' + m.lvl + ' ' + m.max); } } return out; }, r => r.every(x => !/fehlt/.test(x)));
await T('Kampf im Bergland', () => new Promise(res => { const s = SPAWN_SLOTS.find(q => q.zone === 'schanze' && q.kind === 'hakenschuetze'), k = G.knight; G.mons.length = 0; k.x = s.x - 120; k.y = s.y; const m = createMonster('hakenschuetze', s.x, s.y, 24, null); engage(m); setTimeout(() => res({ st: m.st, shots: G.shots.length, hp: k.hp }), 4000); }), r => r.st);
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
