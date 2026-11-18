// Ziel, Notizen, Wegfindung und Erkundung (Version 35): Fenster auf der Karte, goldener Weg (Karte, kleine Karte, Boden), heller Pfeil,
// Ankunft, Ziel löschen, Notiz schreiben und löschen, Spielstand; Erkundung: Nebel, aufdecken, Lohn je Gebiet, ältere Ritter, Handy
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await p.evaluate(() => { window.__wx = 'klar'; window.__season = 1; window.__skyShift = (13 / 24 - (Date.now() / 1000 / DAY_LEN % 1)) * DAY_LEN;
  const h = freshHero('Hans', 'reich'); startGame(h); $('banner').hidden = true;
  window.goW = (x, y) => { const q = gNear(x, y), k = G.knight; k.x = q.x; k.y = q.y; updateZone(true); G.mons.length = 0; }; goW(2966, 2200); });
let fehl = 0;
const T = async (name, fn, ok, arg) => { let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = 'Fehler: ' + e.message.split('\n')[0]; } const gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };

// ---- Erkundung
await T('Neuer Ritter: Nebel', () => ({ seen: [...EX.bits].some(v => v), expl: Object.keys(HERO.expl).length, tot: exZones().length }), r => r.expl === 0 && r.tot >= 25);
await p.waitForTimeout(800);
await T('Umgebung aufgedeckt', () => ({ here: exSeen(G.knight.x, G.knight.y), far: exSeen(16000, 8000), seenLen: HERO.seen.length }), r => r.here && !r.far && r.seenLen > 1000);
await T('Gebiet erkundet: Lohn', async () => {
  const zi = exZoneIdx('obstgarten'), g0 = HERO.gold, x0 = HERO.xp + HERO.lvl * 1e6;
  for (let n = 0; n < EX.W * EX.H; n++){ if (EX.cellZ[n] !== zi || !EX.ok[n]) continue; const i = n % EX.W, j = (n / EX.W) | 0; goW(i * 64 + 32, j * 64 + 32); EX.t = 0; exTick(.016); if (HERO.expl.obstgarten) break; }
  return { done: !!HERO.expl.obstgarten, frac: +exFrac(zi).toFixed(2), gold: HERO.gold - g0, xp: HERO.xp + HERO.lvl * 1e6 - x0 }; }, r => r.done && r.frac >= .75 && r.gold > 0 && r.xp > 0);
await T('Spielstand der Erkundung', () => { const bitsOn = () => [...EX.bits].reduce((a, v) => { for (; v; v &= v - 1) a++; return a; }, 0), n0 = bitsOn(), h = cleanHero(JSON.parse(JSON.stringify(HERO))); const n1 = bitsOn(); HERO = cleanHero(JSON.parse(JSON.stringify(HERO))); return { n0, n1, expl: !!h.expl.obstgarten }; }, r => r.n0 > 50 && r.n0 === r.n1 && r.expl);
await T('Älterer Ritter', () => { const h = freshHero('Alt', 'reich'); h.lvl = 12; h.kills = 300; delete h.seen; const c = cleanHero(h); const r = { stadt: exSeen(5932, 4400), berg: exSeen(4600, 8800), expl: Object.keys(c.expl).length }; HERO = cleanHero(JSON.parse(JSON.stringify(SAVED))); return r; },
  r => r.stadt && !r.berg && r.expl >= 6);
// ---- Karte: Fenster, Ziel setzen, Weg
await p.evaluate(() => { HERO = SAVED; cleanHero(HERO); goW(2966, 2200); });
await p.keyboard.press('KeyK'); await p.waitForTimeout(1200);
const box = await (await p.$('#mapCv')).boundingBox();
await p.mouse.click(box.x + box.width * .3, box.y + box.height * .42); await p.waitForTimeout(500);
await T('Fenster auf der Karte', () => ({ open: !$('mapPop').hidden, btns: [...$('mapPop').querySelectorAll('button')].map(b => b.textContent) }), r => r.open && r.btns.includes('Ziel setzen') && r.btns.some(t => /Notiz/.test(t)));
await p.click('#mapPop button'); await p.waitForTimeout(900);
await T('Ziel und Weg', () => ({ way: !!HERO.way, pts: WAY.pts ? WAY.pts.length : 0, left: Math.round(WAY.left), hit: MV.hits.some(h => /^Ziel: /.test(h.t)) }), r => r.way && r.pts >= 2 && r.left > 100 && r.hit);
await (await p.$('#ovMap .panel')).screenshot({ path: OUT + 'k35_ziel.png' });
// Notiz schreiben
await p.mouse.click(box.x + box.width * .62, box.y + box.height * .6); await p.waitForTimeout(500);
await p.click('#mapPop button:nth-of-type(2)'); await p.waitForTimeout(200);
await p.keyboard.type('Kräuter am Bach'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
await T('Notiz geschrieben', () => ({ notes: HERO.notes.map(n => n.t), map: !$('ovMap').hidden, hit: MV.hits.some(h => h.t === 'Kräuter am Bach') }), r => r.notes.length === 1 && r.notes[0] === 'Kräuter am Bach' && r.map && r.hit);
const np = await p.evaluate(() => { const h = MV.hits.find(x => x.t === 'Kräuter am Bach'), c = $('mapCv'), r = c.getBoundingClientRect(); return { x: r.left + h.x / MV.dpr, y: r.top + h.y / MV.dpr }; });
await p.mouse.click(np.x, np.y); await p.waitForTimeout(500);
await T('Notiz löschen', () => { const b2 = [...$('mapPop').querySelectorAll('button')].find(b => b.textContent === 'Notiz löschen'); if (b2) b2.click(); return { had: !!b2, notes: HERO.notes.length }; }, r => r.had && r.notes === 0);
await p.keyboard.press('KeyK'); await p.waitForTimeout(600);
// im Spiel: heller Pfeil, Punkte am Boden, kleine Karte
await T('Heller Pfeil', () => { const t = wayTarget(); return t && t.label; }, r => typeof r === 'string' && /Schritt$/.test(r));
await T('Goldene Punkte am Boden', () => { render(); const d = ctx.getImageData(0, 0, W, H).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 213 && d[i + 2] === 65) n++; return n; }, r => r >= 20);
await p.screenshot({ path: OUT + 'k35_spiel.png' });
await T('Weg nach Abweichung neu', async () => { const k = G.knight, n0 = PF.gen; k.x += 600; k.y += 300; WAY.planT = -9; for (let i = 0; i < 40 && PF.gen === n0; i++){ wayTick(); await new Promise(r => setTimeout(r, 30)); } return { neu: PF.gen > n0 }; }, r => r.neu);
await T('Ankunft', () => { const w = HERO.way, k = G.knight; k.x = w.x + 20; k.y = w.y; wayTick(); return { way: HERO.way, log: [...document.querySelectorAll('#log *')].map(e => e.textContent).filter(t => /am Ziel/.test(t)).length }; }, r => r.way === null && r.log >= 1);
await T('Ziel mit Entf löschen', async () => { waySet(G.knight.x + 2000, G.knight.y, 'Probe'); openMap(); await new Promise(r => setTimeout(r, 200)); dispatchEvent(new KeyboardEvent('keydown', { code: 'Delete', key: 'Delete', bubbles: true })); const r = HERO.way; closePanel(); return r; }, r => r === null);
// Handy: Fenster passt in die Karte
const ph = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
ph.on('pageerror', e => errs.push('Handy: ' + e.message));
await ph.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await ph.goto(PAGE); await ph.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await ph.evaluate(() => { const h = freshHero('Grete', 'frankreich'); h.lvl = 5; startGame(h); $('banner').hidden = true; openMap(); });
await ph.waitForTimeout(1200);
const mb = await (await ph.$('#mapCv')).boundingBox();
await ph.touchscreen.tap(mb.x + mb.width * .8, mb.y + mb.height * .5); await ph.waitForTimeout(600);
const hr = await ph.evaluate(() => { const a = $('mapPop').getBoundingClientRect(), c = $('mapCv').getBoundingClientRect(); return { open: !$('mapPop').hidden, inside: a.left >= c.left - 1 && a.right <= c.right + 1 && a.top >= c.top - 1 && a.bottom <= c.bottom + 1 }; });
const hok = hr.open && hr.inside; if (!hok) fehl++; console.log((hok ? 'ok   ' : 'FEHL ') + 'Handy: Fenster'.padEnd(22), JSON.stringify(hr));
await (await ph.$('#ovMap .panel')).screenshot({ path: OUT + 'k35_handy.png' });
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
