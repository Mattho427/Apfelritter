// Ostlande: Städte (Leute, Gasthäuser, Kirchen, Rast), Erreichbarkeit, Fuhrmann, Aufträge, Thesen, neue Gegner und Anführer
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await p.evaluate(() => { window.__wx = 'klar'; const h = freshHero('Hans', 'reich'); h.lvl = 26; h.gold = 5000; startGame(h); $('banner').hidden = true; setInterval(() => { if (G.knight.hp > 0) G.knight.hp = ST.hp; }, 200); });
await p.waitForTimeout(600);
let fehl = 0;
const T = async (name, fn, ok, arg) => { const r = await p.evaluate(fn, arg), gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const GEBIETE = ['heide', 'reichswald', 'gailingen', 'donauried', 'lechfeld'];
await T('Gebiete', z => z.map(id => id + ':' + ZONE_LV[id] + ':' + SPAWN_SLOTS.filter(s => s.zone === id).length), r => r.every(x => !/:0$/.test(x)), GEBIETE);
await T('Städte sicher', () => ['wittenberg', 'nuernberg', 'augsburg'].map(z => z + ':' + !!SAFE[z] + ':' + SPAWN_SLOTS.filter(s => s.zone === z).length), r => r.every(x => /:true:0$/.test(x)));
await T('Anführer', () => ['hackelberg', 'eppelein', 'donauweibchen', 'bulcsu'].map(k => k + ' ' + (SPAWN_SLOTS.find(s => s.kind === k) || {}).zone + ' ' + gZone(LAIRS[k].x, LAIRS[k].y).id), r => r.every(x => { const [, a, b2] = x.split(' '); return a === b2; }));
await T('Erreichbar', () => { const out = {}; for (const [n, x, y] of [['wittenberg', 7950, 560], ['nuernberg', 7740, 2300], ['lorenz', 7740, 2520], ['augsburg', 7430, 3800], ['fuggerei', 7600, 3898], ['heide', 7300, 1200], ['nordheide', 8800, 450], ['huenengrab', 8620, 1290], ['gailingen', 8650, 1960], ['reichswald', 8400, 2700], ['ried', 6800, 3200], ['ostlech', 8300, 3720], ['lechfeld', 7400, 4300], ['ungarnstein', 7560, 4510], ['laende', 7600, 3050]]){ const q = wo_near(x, y); out[n] = wo_ok(q.x, q.y); } return out; }, r => Object.values(r).every(Boolean));
await T('Gasthäuser', () => ['schwan', 'gloecklein', 'lamm'].map(id => { const i = INN_BY[id]; return i ? i.name + ' ' + gZone(i.x, i.y).id + (BIND[id] ? ' Rast' : '') : id + ' fehlt'; }), r => r.length === 3 && r.every(x => / (wittenberg|nuernberg|augsburg) Rast$/.test(x)));
await T('Kirchen', () => ['schlosskirche', 'wbkirche', 'sebald', 'lorenz', 'frauenkirche', 'augsdom', 'ulrichskapelle'].map(id => CH_BY[id] ? id + ':' + gZone(CH_BY[id].x, CH_BY[id].y).id : id + ' fehlt'), r => r.length === 7 && !r.some(x => /fehlt/.test(x)));
await T('Leute', () => NPCS.filter(n => ['wittenberg', 'nuernberg', 'augsburg'].includes(n.hub)).map(n => n.id + ':' + gZone(n.x, n.y).id), r => r.length >= 12 && r.every(x => /:(wittenberg|nuernberg|augsburg)$/.test(x)));
// Fuhrmann: von der Reichsstadt nach Nürnberg, dann nach Augsburg
await T('Fuhrmann', () => { const n = NPCS.find(q => q.id === 'fuhrmann_s'), k = G.knight; k.x = n.x; k.y = n.y + 24; updateZone(true); openTalk(n); [...$('talkBody').querySelectorAll('button')].find(x => /Fuhrwerk/.test(x.textContent)).click(); return [...$('talkBody').querySelectorAll('button')].map(x => x.textContent); },
  r => r.length >= 5 && r.some(t => /^Nürnberg \(\d+ Gulden\)/.test(t)));
await T('Fahrt nach Nürnberg', () => { const g = HERO.gold; [...$('talkBody').querySelectorAll('button')].find(x => /^Nürnberg/.test(x.textContent)).click(); return { zone: gZone(G.knight.x, G.knight.y).id, kosten: g - HERO.gold, mode: G.mode }; }, r => r.zone === 'nuernberg' && r.kosten > 0 && r.mode === 'play');
await p.waitForTimeout(1500);
await (await p.$('canvas')).screenshot({ path: OUT + 'ost_nuernberg.png' });
// Aufträge in Nürnberg
await T('Pirckheimer', () => { const n = NPCS.find(q => q.id === 'pirckheimer'), k = G.knight; k.x = n.x; k.y = n.y + 24; updateZone(true); openTalk(n); return [...$('talkBody').querySelectorAll('button')].map(x => x.textContent); },
  r => r.some(t => /Keiler im Reichswald/.test(t)) && r.some(t => /Hier rasten/.test(t)));
await T('Auftrag annehmen', () => { [...$('talkBody').querySelectorAll('button')].find(x => /Keiler im Reichswald/.test(x.textContent)).click(); $('talkBody').querySelector('button.btn').click(); return HERO.quests.map(q => q.id); }, r => r.includes('n1'));
await T('Rasten in Nürnberg', () => { [...$('talkBody').querySelectorAll('button')].find(x => /Hier rasten/.test(x.textContent)).click(); return HERO.bind; }, r => r === 'nuernberg');
await T('Händlerin', () => { closePanel(); const n = NPCS.find(q => q.id === 'lebkuechnerin'); openTalk(n); [...$('talkBody').querySelectorAll('button')].find(x => /kaufen/.test(x.textContent)).click(); return [...$('talkBody').querySelectorAll('.shoprow')].length; }, r => r >= 4);
// Thesen in Wittenberg
await T('Thesen', () => { closePanel(); const xp = HERO.xp + HERO.lvl * 1e7; const c = CH_BY.schlosskirche, k = G.knight; k.x = c.dx; k.y = c.y + 14; k.dir = 'up'; updateNear(true); talk(); const room = chRoom(G.inside); openTalk(room.clergyN[0]);
  const bt = [...$('talkBody').querySelectorAll('button')].find(x => /Thesen/.test(x.textContent)); if (!bt) return 'kein Knopf'; bt.click();
  return { inside: G.inside && G.inside.id, n: $('talkBody').querySelectorAll('.thesen p').length, thesen: HERO.thesen, mehr: HERO.xp + HERO.lvl * 1e7 > xp, ehre: TROPHY_BY.thesen.ok(HERO) }; },
  r => r.inside === 'schlosskirche' && r.n >= 5 && r.thesen === 1 && r.mehr);
await p.waitForTimeout(400);
await (await p.$('canvas')).screenshot({ path: OUT + 'ost_schlosskirche.png' });
// alle neuen Gegner und Anführer entstehen, wehren sich und fallen
await T('Monster', () => { closePanel(); if (G.inside) leaveInn(); const out = []; for (const z of ['heide', 'reichswald', 'gailingen', 'donauried', 'lechfeld']){ for (const k of ZONE_MOBS[z]){ const s = SPAWN_SLOTS.find(q => q.zone === z && q.kind === k); if (!s){ out.push(k + ' fehlt'); continue; } const m = createMonster(k, s.x, s.y, s.lvl, null); out.push(k + ' ' + m.lvl + ' ' + m.max); } } return out; }, r => r.every(x => !/fehlt/.test(x)));
for (const [k, z] of [['kreuzotter', 'heide'], ['keiler', 'reichswald'], ['geisterbogner', 'lechfeld'], ['riesenkrebs', 'donauried'], ['hackelberg', 'heide'], ['eppelein', 'gailingen'], ['donauweibchen', 'donauried'], ['bulcsu', 'lechfeld']])
  await T('Kampf ' + k, ([k]) => new Promise(res => { const s = SPAWN_SLOTS.find(q => q.kind === k), kn = G.knight; G.mons.length = 0; kn.x = s.x - 90; kn.y = s.y; updateZone(true); const m = createMonster(k, s.x, s.y, s.lvl, null); if (!G.mons.includes(m)) G.mons.push(m); engage(m);
    setTimeout(() => { const st = m.st, d = Math.round(Math.hypot(m.x - kn.x, m.y - kn.y)); m.hp = 1; G.kills0 = HERO.kills; kill(m); res({ st, d, tot: !G.mons.includes(m) || m.hp <= 0, boss: HERO.bosses[k] || 0 }); }, 2500); }), r => r.st && r.tot, [k, z]);
await p.evaluate(() => { const s = SPAWN_SLOTS.find(q => q.kind === 'bulcsu'), kn = G.knight; G.mons.length = 0; kn.x = s.x - 70; kn.y = s.y + 10; const m = createMonster("geisterreiter", s.x, s.y, 28, null); if (!G.mons.includes(m)) G.mons.push(m); });
await p.waitForTimeout(900);
await (await p.$('canvas')).screenshot({ path: OUT + 'ost_lechfeld.png' });
await T('Ruhmeszeichen', () => ['hackelberg', 'eppelein', 'donauweibchen', 'bulcsu'].map(id => TROPHY_BY[id].ok(HERO)), r => r.every(Boolean));
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
