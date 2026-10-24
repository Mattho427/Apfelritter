// Version 27: Festkalender, Ostern, Schützenfest, Martini, Fastnacht mit ihren Spielen; Mühle, Einunddreißig, Kegeln und Ringen im Gasthaus
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), errs = [];
let fehl = 0;
const neu = async (fest, sea) => {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 860 } }), p = await ctx.newPage();
  p.on('pageerror', e => errs.push((fest || 'gasthaus') + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await ctx.addInitScript(([f, s]) => { if (f) window.__fest = f; if (s != null) window.__season = s; window.__wx = 'klar'; }, [fest, sea]);
  await p.goto(PAGE);
  await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
  await p.evaluate(() => { const h = freshHero('Hans', 'reich'); h.lvl = 14; h.gold = 900; startGame(h); $('banner').hidden = true; setInterval(() => { if (G.knight.hp > 0) G.knight.hp = ST.hp; }, 200); });
  await p.waitForTimeout(700);
  return { ctx, p };
};
const T = async (p, name, fn, ok, arg) => { const r = await p.evaluate(fn, arg), gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const shot = async (p, n, sel) => { await p.waitForTimeout(500); await (await p.$(sel || 'canvas')).screenshot({ path: OUT + n }); };
const warte = (p, fn, ms) => p.waitForFunction(fn, null, { timeout: ms || 30000, polling: 100 }).then(() => true, () => false);

// Kalender: an jedem Tag jeder Jahreszeit höchstens ein Fest, die neuen an den freien Tagen
{ const { ctx, p } = await neu(null, 0);
  await T(p, 'Kalender', () => [0, 1, 2, 3].map(s => [0, 1, 2, 3].map(d => FESTS.filter(f => f.sea === s && f.days.includes(d)).map(f => f.id).join('+') || '-').join(' ')),
    r => r.join('|') === 'ostern mai mai -|- johannis johannis schuetzen|- ernte ernte martini|- advent advent fastnacht');
  await T(p, 'Rekorde', () => FREC.map(r => r.id + ':' + r.f), r => ['eier:fe', 'schiessen:fz', 'gans:fg', 'moriske:fm'].every(x => r.includes(x)));
  await ctx.close(); }

// die vier Feste: Fest steht, Gastgeber, Speisen, Spiel gewinnen, Preis
const lauf = {
  ostern: async p => { await p.evaluate(() => { const g = G.fgame; let i = 0; const t = setInterval(() => { if (!G.fgame){ clearInterval(t); return; } const e = g.eggs.find(q => !q.found); if (e){ G.knight.x = e.x; G.knight.y = e.y; } }, 120); }); },
  schuetzen: async p => { await p.evaluate(() => { FG.schiessen.aim = () => [0.02, 0.01]; const t = setInterval(() => { const g = G.fgame; if (!g){ clearInterval(t); atkHeld = false; return; } if (g.st === 'aim') atkHeld = !atkHeld; }, 260); }); },
  martini: async p => { await p.evaluate(() => { const t = setInterval(() => { const g = G.fgame; if (!g){ clearInterval(t); return; } const s = g.geese.find(q => !q.got); if (s){ s.st = 'tired'; s.rest = 3; G.knight.x = s.x; G.knight.y = s.y; } }, 150); }); },
  fastnacht: async p => { await p.evaluate(() => { const V = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }; const t = setInterval(() => { const g = G.fgame; if (!g){ clearInterval(t); padVec = { x: 0, y: 0 }; return; }
    if (g.st !== 'play'){ padVec = { x: 0, y: 0 }; return; } if (padVec.x || padVec.y){ padVec = { x: 0, y: 0 }; return; } const d = g.seq[g.i]; if (d) padVec = { x: V[d][0], y: V[d][1] }; }, 70); }); }
};
for (const [id, sea, game] of [['ostern', 0, 'eier'], ['schuetzen', 1, 'schiessen'], ['martini', 2, 'gans'], ['fastnacht', 3, 'moriske']]){
  const { ctx, p } = await neu(id, sea);
  await p.waitForFunction(() => G.fest, null, { timeout: 10000 });
  await T(p, 'Fest ' + id, () => { const F = G.fest, k = G.knight; k.x = F.cx; k.y = F.cy + 60; updateZone(true); return { id: F.id, objs: F.objs.length, host: NPCS.some(n => n.fest === F.id), speisen: FARE.filter(x => x.fest === F.id).length, tune: musicFor(), leute: LIFE_SPOTS.filter(s => s.fest === F.id).length }; },
    r => r.id === id && r.objs >= 3 && r.host && r.speisen === 2 && r.tune === id && r.leute >= 2);
  await p.waitForTimeout(1800);
  await shot(p, 'f27_' + id + '.png');
  await T(p, 'Spiel ' + game, () => { const F = G.fest, n = NPCS.find(q => q.fest === F.id); G.knight.x = n.x; G.knight.y = n.y + 20; openTalk(n);
    const bt = [...$('talkBody').querySelectorAll('button')].find(x => x.textContent.startsWith(F.gameName)); bt.click();
    [...$('talkBody').querySelectorAll('button')].find(x => /Mitmachen/.test(x.textContent)).click(); return G.fgame && G.fgame.kind; }, r => r === game);
  await p.waitForTimeout(id === 'fastnacht' ? 2500 : 900);
  if (id === 'schuetzen') await p.evaluate(() => { atkHeld = true; });
  await shot(p, 'f27_' + id + '_spiel.png');
  if (id === 'schuetzen') await p.evaluate(() => { atkHeld = false; });
  await lauf[id](p);
  const fertig = await warte(p, () => !G.fgame, 60000);
  await T(p, 'Gewonnen ' + game, () => ({ preis: HERO.inv.filter(Boolean).map(itemName).join(', '), done: !!(HERO.festDone && HERO.festDone[festKey()]), rec: HERO.frec, log: [...document.querySelectorAll('#log p')].slice(-2).map(x => x.textContent).join(' | ').slice(0, 160) }),
    r => fertig && r.done && /Osterei|Schützenvogel|Martinsgans|Schembartmaske/.test(r.preis || ''));
  await ctx.close();
}

// Gasthaus: vier neue Gäste und ihre Spiele
{ const { ctx, p } = await neu(false, 1);
  await T(p, 'Gäste', () => { const inn = INN_BY.krone; G.knight.x = inn.dx; G.knight.y = inn.y + 12; enterInn(inn); return innRoom(inn).npcs.map(n => n.id + (n.fsGame ? ':' + n.fsGame : '')); },
    r => ['schulmeister:muehle', 'spielerin:karten', 'kegler:kegeln', 'ringer:ringen'].every(x => r.includes(x)));
  const offen = id => p.evaluate(id => { closePanel(); const n = innRoom(G.inside).npcs.find(q => q.id === id); G.knight.x = n.x; G.knight.y = n.y + 30; openTalk(n);
    [...$('talkBody').querySelectorAll('button')].find(x => x.textContent === FS_GAMES[n.fsGame].label).click(); [...$('talkBody').querySelectorAll('button')].find(x => /Um 5 Gulden/.test(x.textContent)).click(); return G.fs && G.fs.kind; }, id);
  // Mühle: setzen, der Schulmeister antwortet, dann gewinnen und aufgeben
  console.log('     Mühle', await offen('schulmeister'));
  await T(p, 'Mühle setzen', async () => { const S = G.fs; muClick(S, 0); await new Promise(r => setTimeout(r, 900)); return { b: S.b.filter(Boolean).length, hand: S.hand.slice(1), turn: S.turn, knoepfe: $('talkBody').querySelectorAll('.fsboard .pt').length }; },
    r => r.b === 2 && r.hand[0] === 8 && r.hand[1] === 8 && r.turn === 1 && r.knoepfe === 24);
  await shot(p, 'f27_muehle.png', '#ovTalk');
  await T(p, 'Mühle Ende', () => { const S = G.fs, g0 = HERO.gold; S.b = Array(24).fill(0); S.hand = [0, 0, 0]; S.b[0] = S.b[1] = S.b[2] = 1; S.b[9] = S.b[10] = 2; S.remove = false; muCheckEnd(S); return { res: S.res, gewinn: HERO.gold - g0, fsw: HERO.fsw }; },
    r => r.res === 1 && r.gewinn === 10 && r.fsw.muehle === 1);
  // Einunddreißig
  console.log('     Karten', await offen('spielerin'));
  await shot(p, 'f27_karten.png', '#ovTalk');
  await T(p, 'Einunddreißig', () => { const S = G.fs; while (caSum(S.me) < 24) FS_PLAY.karten.draw(S); if (S.res === null) FS_PLAY.karten.stand(S); const me = caSum(S.me), op = caSum(S.op);
    const soll = me > 31 ? -1 : op > 31 ? 1 : Math.sign(me - op); return { me, op, res: S.res, soll, karten: $('talkBody').querySelectorAll('.fscards img').length }; }, r => r.res === r.soll && r.karten >= 4);
  // Kegeln: drei Würfe
  console.log('     Kegeln', await offen('kegler'));
  await shot(p, 'f27_kegeln.png', '#ovTalk');
  await T(p, 'Kegeln', async () => { const S = G.fs, w = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 3; i++){ S.t = 0; FS_PLAY.kegeln.press(S); await w(150); S.t = Math.PI / 3; FS_PLAY.kegeln.press(S); for (let k = 0; k < 60 && S.st === 'roll'; k++) await w(100); if (i < 2) FS_PLAY.kegeln.next(S); }
    return { wuerfe: S.throws, res: S.res, foe: S.foe }; }, r => r.wuerfe.length === 3 && r.res !== null && r.wuerfe.some(n => n > 0));
  // Ringen: im Takt drücken
  console.log('     Ringen', await offen('ringer'));
  await p.waitForTimeout(400);
  await shot(p, 'f27_ringen.png', '#ovTalk');
  await T(p, 'Ringen', async () => { const S = G.fs; await new Promise(res => { const t = setInterval(() => { if (S.res !== null){ clearInterval(t); res(); return; } const m = (Math.sin(S.ph) + 1) / 2; if (S.st === 'go' && Math.abs(m - S.zc) < S.zw / 2 - .02) FS_PLAY.ringen.press(S); }, 16); setTimeout(() => { clearInterval(t); res(); }, 40000); });
    return { res: S.res, wins: S.wins }; }, r => r.res === 1 && r.wins[0] === 2);
  await T(p, 'Stammgast', () => { HERO.fsw = { muehle: 1, karten: 1, kegeln: 1, ringen: 1 }; const h = JSON.parse(JSON.stringify(HERO)); h.frec = { eier: 300, schiessen: 41 }; cleanHero(h); return { ehre: TROPHY_BY.stammgast.ok(HERO), fsw: h.fsw, frec: h.frec }; },
    r => r.ehre && r.fsw.ringen === 1 && r.frec.schiessen === 41 && r.frec.eier === 300);
  await T(p, 'Aufgeben', () => { closePanel(); const n = innRoom(G.inside).npcs.find(q => q.id === 'schulmeister'); openTalk(n); [...$('talkBody').querySelectorAll('button')].find(x => /Mühle/.test(x.textContent)).click();
    [...$('talkBody').querySelectorAll('button')].find(x => /Um 5 Gulden/.test(x.textContent)).click(); const g0 = HERO.gold, S = G.fs; [...$('talkBody').querySelectorAll('button')].find(x => x.textContent === 'Zurück').click(); return { res: S.res, diff: HERO.gold - g0, fs: G.fs }; },
    r => r.res === -1 && r.diff === 0 && r.fs === null);
  await ctx.close(); }
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
