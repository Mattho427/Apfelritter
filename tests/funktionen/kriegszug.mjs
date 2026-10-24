// Kriegszüge: Pavia 1525 (Kanone, Tiergarten, König Franz) und Wien 1529 (Lunten gegen die Zeit, der Aga), Werber und Schiffmeister
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await p.evaluate(() => { window.__wx = 'klar'; const h = freshHero('Hans', 'reich'); h.lvl = 20; h.gold = 5000; startGame(h); $('banner').hidden = true; setInterval(() => { if (G.knight.hp > 0 && !window.__noHeal) G.knight.hp = ST.hp; }, 200); });
await p.waitForTimeout(600);
let fehl = 0;
const T = async (name, fn, ok, arg) => { const r = await p.evaluate(fn, arg), gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const shot = async n => { await p.waitForTimeout(700); await (await p.$('canvas')).screenshot({ path: OUT + n }); };
// zu niedrige Stufe: der Werber schickt einen weg
await T('Stufe zu niedrig', () => { const n = NPCS.find(q => q.id === 'werber'), k = G.knight; k.x = n.x; k.y = n.y + 24; updateZone(true); openTalk(n);
  const bt = [...$('talkBody').querySelectorAll('button')].find(x => /nach Pavia/.test(x.textContent)); if (!bt) return 'kein Knopf'; bt.click(); return { dg: !!DG_ON, text: $('talkText').textContent.slice(0, 40) }; },
  r => r.dg === false && /Stufe 24/.test(r.text));
await p.evaluate(() => { closePanel(); HERO.lvl = 28; refreshStats(); });
// Pavia
await T('Nach Pavia', () => { const n = NPCS.find(q => q.id === 'werber'); openTalk(n); [...$('talkBody').querySelectorAll('button')].find(x => /nach Pavia/.test(x.textContent)).click();
  const M = DG_ON; return { id: M && M.id, step: M.kz.step, foes: kzFoes(), elite: G.mons.filter(m => m.elite).map(m => m.nm || m.elite + ' ' + m.lvl), lvl: M.lvl, tracker: $('tracker').textContent }; },
  r => r.id === 'pavia' && r.step === 0 && r.foes >= 17 && r.elite.length === 1 && /Pavia 1525: Feuert die Kanone/.test(r.tracker));
await shot('kz_pavia_lager.png');
await T('Kanone abfeuern', () => { const M = DG_ON, L = M.levers[0], k = G.knight; k.x = L.o.x; k.y = L.o.y + 24; G.dgNear = null; dgNear(); const lab = $('btnTalk').textContent; talk();
  return { lab, step: M.kz.step, offen: M.gates[0].open, go: kzGo(M), lab2: $('btnTalk').textContent }; },
  r => r.lab === 'Kanone abfeuern' && r.step === 1 && r.offen && r.go.includes(0) && r.go.includes(10) && /gefeuert/.test(r.lab2));
await shot('kz_pavia_bresche.png');
await T('Tiergarten', async () => { const M = DG_ON, k = G.knight, g = M.gates[0].o; k.x = g.x; k.y = g.y + 260; let n = 0;
  for (const m of G.mons.slice()) if (!m.elite && n < 13){ m.hp = 1; kill(m); n++; }
  await new Promise(r => setTimeout(r, 400)); const zw = { step: M.kz.step, kills: M.kz.kills, tr: $('tracker').textContent };
  for (const m of G.mons.slice()) if (!m.elite){ m.hp = 1; kill(m); break; }
  await new Promise(r => setTimeout(r, 400)); return { zw, step: M.kz.step, palisade: M.gates[1].open }; },
  r => r.zw.step === 1 && r.zw.kills === 13 && /13 \/ 14/.test(r.zw.tr) && r.step === 2 && r.palisade);
await T('Gegner kämpfen', async () => { const M = DG_ON, k = G.knight, out = {};
  for (const kind of ['schweizer', 'arkebusier', 'gendarm', 'janitschar', 'tuefekci', 'mineur']){ const m = createMonster(kind, k.x + 70, k.y, 28, null); m.zone = 'gewoelbe'; engage(m); out[kind] = artOf(kind) ? 'Bild' : 'fehlt'; }
  await new Promise(r => setTimeout(r, 2500)); for (const m of G.mons) if (!m.elite) out[m.k] += ' ' + m.st;
  return out; }, r => Object.values(r).every(x => /^Bild/.test(x)));
await shot('kz_pavia_kampf.png');
await T('König Franz', async () => { const M = DG_ON, k = G.knight, f = G.mons.find(m => m.elite); for (const m of G.mons.slice()) if (!m.elite) G.mons.splice(G.mons.indexOf(m), 1);
  k.x = f.x - 80; k.y = f.y; engage(f); await new Promise(r => setTimeout(r, 1500)); const st = f.st, hp = f.max; f.hp = 1; kill(f);
  await new Promise(r => setTimeout(r, 500)); return { st, hp, won: M.kz.won, kz: HERO.kz, ehre: TROPHY_BY.pavia.ok(HERO), tr: $('tracker').textContent, helm: G.loot.some(l => l.it && l.it.u === 'franz') }; },
  r => r.won && r.kz.pavia === 1 && r.ehre && r.helm && /König Franz ergibt sich/.test(r.tr) && r.hp > 1000);
await shot('kz_pavia_lagerdes_koenigs.png');
await T('Kriegskasse', () => { const M = DG_ON, k = G.knight; k.x = M.chest.x; k.y = M.chest.y + 20; G.dgNear = null; dgNear(); const lab = $('btnTalk').textContent; talk(); return { lab, offen: M.chestOpen }; }, r => r.lab === 'Truhe öffnen' && r.offen);
await T('Rückzug', () => { const M = DG_ON, k = G.knight; k.x = M.stair.x; k.y = M.stair.y + 20; G.dgNear = null; dgNear(); const lab = $('btnTalk').textContent; talk(); return { lab, dg: !!DG_ON, zone: G.zone }; },
  r => r.lab === 'Rückzug antreten' && !r.dg);
// Wien: Zeit läuft ab
await T('Nach Wien', () => { const n = NPCS.find(q => q.id === 'schiffmeister'), k = G.knight; k.x = n.x; k.y = n.y + 24; updateZone(true); openTalk(n); [...$('talkBody').querySelectorAll('button')].find(x => /nach Wien/.test(x.textContent)).click();
  const M = DG_ON; return { id: M && M.id, t: M.kz.t, gates: M.gates.length, levers: M.levers.filter(Boolean).length, tracker: $('tracker').textContent, zone: gZone(n.x, n.y).id }; },
  r => r.id === 'wien' && r.t === 420 && r.levers === 3 && /noch 7:00|noch 6:5\d/.test(r.tracker));
await shot('kz_wien_eingang.png');
await T('Mine fliegt hoch', async () => { window.__noHeal = true; const M = DG_ON; M.kz.t = .4; await new Promise(r => setTimeout(r, 900)); const out = { dg: !!DG_ON, hp: G.knight.hp, max: ST.hp }; window.__noHeal = false; return out; },
  r => !r.dg && r.hp < r.max * .5 && r.hp >= 1);
// Wien: rechtzeitig
await T('Lunten löschen', async () => { const n = NPCS.find(q => q.id === 'schiffmeister'); openTalk(n); [...$('talkBody').querySelectorAll('button')].find(x => /nach Wien/.test(x.textContent)).click();
  const M = DG_ON, k = G.knight, out = [];
  for (const [li, L] of M.levers.entries()){ k.x = L.o.x; k.y = L.o.y + 24; G.dgNear = null; dgNear(); out.push($('btnTalk').textContent); talk(); await new Promise(r => setTimeout(r, 300)); out.push(M.kz.step + ':' + Object.keys(M.kz.done).length); }
  return { out, offen: M.gates[0].open, t: Math.round(M.kz.t), rising: G.rising.length + G.mons.length }; },
  r => r.out[0] === 'Lunte herausreißen' && r.out[5] === '1:3' && r.offen && r.t > 400);
await shot('kz_wien_pulver.png');
await T('Der Aga', async () => { const M = DG_ON, k = G.knight, a = G.mons.find(m => m.elite); k.x = a.x - 60; k.y = a.y; engage(a); await new Promise(r => setTimeout(r, 1500)); const st = a.st; a.hp = 1; kill(a);
  await new Promise(r => setTimeout(r, 500)); return { st, won: M.kz.won, kz: HERO.kz, ehre: TROPHY_BY.wien.ok(HERO), rest: G.mons.length, tr: $('tracker').textContent }; },
  r => r.won && r.kz.wien === 1 && r.ehre && r.rest === 0 && /Wien hält stand/.test(r.tr));
await shot('kz_wien_aga.png');
// Speichern: Kriegszüge bleiben im Spielstand
await T('Spielstand', () => { leaveDungeon(); const h = JSON.parse(JSON.stringify(HERO)); cleanHero(h); return h.kz; }, r => r.pavia === 1 && r.wien === 1);
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
