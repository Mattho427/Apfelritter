// Burgen der vier Häuser (Version 31): Lage und Gebiete, Erreichbarkeit, Bauteile in den Hausfarben, Oberhäupter, Wachen und Kämmerer,
// Gunst des Hauses, Tribut für den Wettstreit, Rasten, Stand im Wettstreit, Gäste, Besuch aller vier Burgen, Trophäe, Tafel, Spielstand
import { chromium, OUT, PAGE, zeigeTafel, schliesseTafel } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await p.evaluate(() => { window.__wx = 'klar'; window.__fest = false; window.__skyShift = (0.5 - (Date.now() / 1000 / DAY_LEN % 1)) * DAY_LEN;
  const h = freshHero('Hans', 'reich'); h.lvl = 16; h.gold = 900; startGame(h); $('banner').hidden = true;
  window.goN = id => { const n = NPCS.find(q => q.id === id), k = G.knight; k.x = n.x; k.y = n.y + 24; updateZone(true); G.mons.length = 0; return n; };
  window.btnT = re => [...$('talkBody').querySelectorAll('button')].find(x => re.test(x.textContent)); });
await p.waitForTimeout(600);
let fehl = 0;
const T = async (name, fn, ok, arg) => { let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = 'Fehler: ' + e.message.split('\n')[0]; } const gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const shot = async n => { await p.waitForTimeout(900); await (await p.$('canvas')).screenshot({ path: OUT + n }); };
const panel = async n => { await p.waitForTimeout(300); try { await (await p.$('#ovTalk .panel')).screenshot({ path: OUT + n, timeout: 5000 }); } catch (e){ console.log('kein Bild ' + n); } };

await T('Vier Burgen', () => Object.entries(wo_HAUS).map(([f, H]) => [f, H.zone, zoneAt(H.gx, (H.y0 + H.y1) / 2).id, !!SAFE[H.zone], !!H.tor, !!H.keep]),
  r => r.length === 4 && r.every(([f, z, at, safe, tor, keep]) => z === at && safe && tor && keep));
await T('Bauteile', () => ['adler', 'lilie', 'loewe', 'turm'].map(k => PROPS.filter(q => q.kind.startsWith(k + '_')).length),
  r => r.every(n => n >= 14));
await T('Erreichbar', () => Object.keys(wo_HAUS).map(f => { const P = wo_HAUSP[f]; return [wo_ok(P.hof.x, P.hof.y), wo_ok(P.tor.x, P.tor.y)]; }),
  r => r.every(([a, c]) => a && c));
await T('Leute', () => Object.keys(HB).map(f => ['hb_', 'hbk_', 'hbw_'].map(pre => NPCS.filter(n => n.id.startsWith(pre + f)).length).join('')),
  r => r.every(s => s === '112'));
await T('Rasten möglich', () => Object.values(HB).map(B => !!BIND[B.zone]), r => r.every(Boolean));
// Ritter vom Adler im Adlerhorst
await T('Adlerhorst betreten', async () => { goN('hb_reich'); await new Promise(r => setTimeout(r, 400)); return { z: G.zone, safe: isSafe(G.zone), hbv: HERO.hbv }; },
  r => r.z === 'adlerhorst' && r.safe && r.hbv && r.hbv.reich);
await shot('hb_adlerhorst.png');
await T('Gruß des eigenen Hauses', () => { openTalk(goN('hb_reich')); return { own: HB.reich.own.includes(G.greet), b: [...$('talkBody').querySelectorAll('button')].map(x => x.textContent) }; },
  r => r.own && r.b.some(t => /Gunst des Hauses bitten/.test(t)) && r.b.some(t => /Tribut zahlen/.test(t)) && r.b.some(t => /Hier rasten/.test(t)));
await panel('hb_oberhaupt.png');
await T('Gunst des Hauses', () => { const x0 = asXpBonus(); btnT(/Gunst des Hauses bitten/).click(); const b = btnT(/Gunst des Hauses habt Ihr heute/);
  return { t: Math.round(HERO.gunst.t), x0, x1: asXpBonus(), g1: asGoldBonus(), off: !!(b && b.disabled), chip: !!$('buffs').textContent.match(/Min/) }; },
  r => r.t === 1800 && Math.abs(r.x1 - r.x0 - .1) < 1e-9 && r.g1 >= .1 && r.off && r.chip);
await T('Tribut', () => { const g0 = HERO.gold, p0 = lwStand(orWeek()).tot.reich; btnT(/Tribut zahlen/).click(); return { dg: g0 - HERO.gold, dp: lwStand(orWeek()).tot.reich - p0, n: HERO.hbt.n }; },
  r => r.dg === 100 && r.dp === 10 && r.n === 1);
await T('Rasten', () => { btnT(/Hier rasten/).click(); return HERO.bind; }, r => r === 'adlerhorst');
await T('Stand im Wettstreit', () => { btnT(/Wettstreit der Häuser/).click(); return { n: $('talkBody').querySelectorAll('li').length, t: $('talkText').textContent }; },
  r => r.n === 4 && /Stelle|führt/.test(r.t));
await panel('hb_wettstreit.png');
await T('Torwache und Kämmerer', () => { closePanel(); openTalk(goN('hbw_reichl')); const w = G.greet; closePanel(); openTalk(goN('hbk_reich'));
  return { w, buy: !!btnT(/Handeln: kaufen/), art: NPCS.find(n => n.id === 'hbw_reichl').art.frames[0].width }; }, r => /Krone|Willkommen|Tor|sicher/.test(r.w) && r.buy && r.art > 40);
// als Gast in den anderen drei Burgen
await T('Gast in Lilienthal', async () => { closePanel(); goN('hb_frankreich'); await new Promise(r => setTimeout(r, 400)); openTalk(NPCS.find(n => n.id === 'hb_frankreich'));
  return { guest: HB.frankreich.guest.includes(G.greet), gunst: !!btnT(/Gunst des Hauses/), rast: !!btnT(/Hier rasten/), stand: !!btnT(/Wettstreit/), z: G.zone, hint: $('talkBody').textContent.includes('Nur die Ritter des Hauses der Lilie') }; },
  r => r.guest && !r.gunst && !r.rast && r.stand && r.z === 'lilienthal' && r.hint);
await p.evaluate(() => closePanel());
await shot('hb_lilienthal.png');
await p.evaluate(() => { const P = wo_HAUSP.frankreich, q = gPt({ x: P.tor.x, y: P.tor.y + 90 }), k = G.knight; k.x = q.x; k.y = q.y; updateZone(true); });
await shot('hb_schlossgarten.png');
await T('Löwenburg', async () => { goN('hb_england'); await new Promise(r => setTimeout(r, 400)); return G.zone; }, r => r === 'loewenburg');
await shot('hb_loewenburg.png');
await T('Turmfeste', async () => { goN('hb_spanien'); await new Promise(r => setTimeout(r, 400)); return { z: G.zone, hbv: Object.keys(HERO.hbv).length }; }, r => r.z === 'turmfeste' && r.hbv === 4);
await shot('hb_turmfeste.png');
await p.evaluate(() => { const P = wo_HAUSP.spanien, q = gPt({ x: P.tor.x, y: P.tor.y + 60 }), k = G.knight; k.x = q.x; k.y = q.y; updateZone(true); });
await shot('hb_turmfeste_tor.png');
await T('Trophäe', () => TROPHY_BY.hausburgen.ok(HERO), r => r === true);
await zeigeTafel(p);
await T('Tafel', () => { const L = $('hbList'); return L ? [...L.querySelectorAll('li')].map(li => li.querySelector('.what').firstChild.textContent) : null; },
  r => r && r.length === 4 && r[0] === 'Der Adlerhorst' && r[1] === 'Schloss Lilienthal');
await schliesseTafel(p);
await T('Spielstand', () => { const c = JSON.parse(JSON.stringify(HERO)); cleanHero(c);
  return { gunst: c.gunst && Math.round(c.gunst.t / 60), d: c.gunstD === hbDay(), hbt: c.hbt, hbv: Object.keys(c.hbv).sort().join(), bind: c.bind }; },
  r => r.gunst >= 29 && r.d && r.hbt.n === 1 && r.hbv === 'england,frankreich,reich,spanien' && r.bind === 'adlerhorst');
await T('Gunst läuft ab', () => { HERO.gunst.t = .5; hbTick(1); return { g: HERO.gunst, x: asXpBonus() < .1 }; }, r => r.g === null && r.x);
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
