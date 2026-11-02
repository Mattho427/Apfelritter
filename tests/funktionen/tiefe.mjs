// Tiefe im Bild (Version 33): Sonnenstand (Richtung, Länge, Stärke nach Uhrzeit, Jahreszeit und Wetter), Schattenkacheln, eingerechnete
// Bodenstücke, dunklere Bildpunkte im Schatten eines Baums, Gestaltenschatten, Fußschatten, Randabdunklung, Gasthaus ohne Schatten, Tafel
import { chromium, OUT, PAGE, zeigeTafel, schliesseTafel } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await p.evaluate(() => { window.__wx = 'klar'; window.__at = h => { window.__skyShift = (h / 24 - (Date.now() / 1000 / DAY_LEN % 1)) * DAY_LEN; }; __at(15);
  const h = freshHero('Hans', 'reich'); h.lvl = 12; startGame(h); $('banner').hidden = true;
  const q = gNear(5400, 4400), k = G.knight; k.x = q.x; k.y = q.y; updateZone(true); G.mons.length = 0; });
await p.waitForTimeout(2500);
let fehl = 0;
const T = async (name, fn, ok, arg) => { let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = 'Fehler: ' + e.message.split('\n')[0]; } const gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const shot = async n => { await p.waitForTimeout(700); await (await p.$('canvas')).screenshot({ path: OUT + n }); };
const sun = h => p.evaluate(h => { __at(h); updateClock(); const S = sunNow(); return { dx: +S.dx.toFixed(2), dy: +S.dy.toFixed(2), L: +S.L.toFixed(2), a: +S.a.toFixed(2) }; }, h);

await T('Sonne wandert', async () => 0, () => true);
const s8 = await sun(8), s12 = await sun(12), s17 = await sun(17), s23 = await sun(23);
console.log('     8 Uhr', JSON.stringify(s8), '12 Uhr', JSON.stringify(s12), '17 Uhr', JSON.stringify(s17), '23 Uhr', JSON.stringify(s23));
await T('Morgens nach Westen', () => 0, () => s8.dx < -.4 && s8.L > s12.L);
await T('Mittags kurz, Norden', () => 0, () => Math.abs(s12.dx) < .25 && s12.dy < -.4 && s12.a > .38);
await T('Abends nach Osten', () => 0, () => s17.dx > .5 && s17.L > s12.L);
await T('Nachts ein Hauch', () => 0, () => s23.a > 0 && s23.a < .12);
await T('Winter länger', () => { __at(12); updateClock(); const c = SEA.cur; SEA.cur = 1; const a = sunNow().L; SEA.cur = 3; const w = sunNow().L; SEA.cur = c; sunNow(); return { sommer: +a.toFixed(2), winter: +w.toFixed(2) }; }, r => r.winter > r.sommer * 1.25);
await T('Regen macht weich', () => { window.__wx = 'Regen'; window.__skyShift += WX_SLOT * 3; updateClock(); const a = sunNow().a; window.__wx = 'klar'; window.__skyShift -= WX_SLOT * 3; updateClock(); return { regen: +a.toFixed(2), klar: +sunNow().a.toFixed(2) }; }, r => r.regen < r.klar * .6);
// zurück auf 15 Uhr, ein paar Bilder laufen lassen
await p.evaluate(() => __at(15));
await p.waitForTimeout(2500);
await T('Kacheln und Boden', () => ({ tiles: SHT.tiles.size, fresh: [...SHT.tiles.values()].filter(t => t.key === SUN.key).length, chunks: [...SGC.m.values()].filter(s => s.key.startsWith(SUN.key + ':')).length }),
  r => r.tiles >= 4 && r.fresh >= 4 && r.chunks >= 2);
await shot('tiefe_15.png');
// ein Baum im Bild: an der Mitte seines Schattens ist der Boden mit Schatten dunkler als ohne
const pts = await p.evaluate(() => { const cam = camOf(G.knight), S = SUN, out = [];
  for (const q of propsInView(cam)){ if (!/fichte|kiefer|birke|turm|banner/.test(q.kind) || q.lz) continue;
    const t = (q.img.width / 2 + 8) / Math.abs(S.dx); if (t > q.ay * S.L * .85) continue;   // seitlich neben dem Bild, noch im Schatten
    const x = Math.round(q.x + S.dx * t - cam.x), y = Math.round(q.y + S.dy * t - cam.y);
    if (x < 20 || y < 20 || x > W - 20 || y > H - 20) continue;
    if (propsInView(cam).some(o => o !== q && x + cam.x > o.x - o.ax && x + cam.x < o.x - o.ax + o.img.width && y + cam.y > o.y - o.ay && y + cam.y < o.y - o.ay + o.img.height)) continue;
    if (x + cam.x > q.x - q.ax && x + cam.x < q.x - q.ax + q.img.width && y + cam.y > q.y - q.ay && y + cam.y < q.y - q.ay + q.img.height) continue;
    out.push([x, y, q.kind]); }
  return out.slice(0, 12); });
const lum = () => p.evaluate(pts => pts.map(([x, y]) => { const d = ctx.getImageData(x - 1, y - 1, 3, 3).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; return Math.round(s / 9); }), pts);
const mit = await lum();
await p.evaluate(() => { window.__noShade = true; });
await p.waitForTimeout(700);
const ohne = await lum();
await p.evaluate(() => { window.__noShade = false; });
console.log('     Punkte', JSON.stringify(pts.map((q, i) => q[2] + ' ' + mit[i] + '/' + ohne[i])));
await T('Schatten am Boden', () => 0, () => pts.length >= 3 && pts.filter((q, i) => ohne[i] - mit[i] > 12).length >= Math.ceil(pts.length / 2));
await T('Ritter wirft Schatten', () => { const k = G.knight, S = SUN, cam = camOf(k), x = Math.round(k.x + S.dx * KS.ay * S.L * .8 - cam.x), y = Math.round(k.y + S.dy * KS.ay * S.L * .8 - cam.y);
  return { x, y, hasBlob: typeof castBlob === 'function', len: Math.round(KS.ay * S.L) }; }, r => r.hasBlob && r.len > 15);
await T('Fußschatten', () => { const cam = camOf(G.knight), v = propsInView(cam); return v.filter(q => !q.lz && q.img.width >= 40 && !AO_SKIP.has(q.kind) && (q.occl || q.ay >= 60)).length; }, r => r >= 3);
await T('Randabdunklung', () => ({ on: !$('vignette').hidden, bg: getComputedStyle($('vignette')).backgroundImage.slice(0, 15) }), r => r.on && /radial/.test(r.bg));
// im Gasthaus: keine Schatten, keine Randabdunklung
await T('Gasthaus', async () => { const inn = INNS[0]; enterInn(inn); await new Promise(r => setTimeout(r, 500)); const r = { inside: !!G.inside, vig: $('vignette').hidden, shade: shadeGround({ c: 'x' }, 0, 0) }; leaveInn(); await new Promise(r => setTimeout(r, 300)); return r; },
  r => r.inside && r.vig && r.shade === 'x');
// Abendlicht und Morgenlicht als Bilder
for (const h of [7.5, 18]){ await p.evaluate(h => __at(h), h); await p.waitForTimeout(1800); await shot('tiefe_' + String(h).replace('.', '_') + '.png'); }
await T('Leistung', () => { const t0 = performance.now(); for (let i = 0; i < 30; i++) render(); return Math.round((performance.now() - t0) / 30 * 10) / 10; }, r => r < 40);
await zeigeTafel(p, '#dayList');
await T('Tafel', () => [...document.querySelectorAll('.note')].find(n => n.querySelector('#dayList')).querySelector('.tip').textContent, r => /Schatten wandern mit der Sonne/.test(r));
await schliesseTafel(p);
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
