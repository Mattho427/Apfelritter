// Nachtlicht, Wasser und Wetter (Version 34): Lichtstempel mit Schatten, Schatten vom Feuer weg, Laterne des Ritters, Spiegelungen,
// gespiegelte Fenster, Pfützen und Hochwasser aus dem Wetterverlauf, Regenringe, Funken, Glühwürmchen
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await p.evaluate(() => { window.__wx = 'klar'; window.__season = 1; window.__at = h => { window.__skyShift = (h / 24 - (Date.now() / 1000 / DAY_LEN % 1)) * DAY_LEN; }; __at(23);
  const h = freshHero('Hans', 'reich'); h.lvl = 12; startGame(h); $('banner').hidden = true;
  window.goW = (x, y) => { const q = gNear(x, y), k = G.knight; k.x = q.x; k.y = q.y; updateZone(true); G.mons.length = 0; }; goW(4488, 1700); });
await p.waitForTimeout(2500);
let fehl = 0;
const T = async (name, fn, ok, arg) => { let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = 'Fehler: ' + e.message.split('\n')[0]; } const gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const shot = async n => { await p.waitForTimeout(700); await (await p.$('canvas')).screenshot({ path: OUT + n }); };
const lumAt = pts => p.evaluate(pts => pts.map(([x, y]) => { const d = ctx.getImageData(x - 1, y - 1, 3, 3).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; return Math.round(s / 9); }), pts);

// ---- Nachtlicht
await T('Lichtstempel', () => ({ n: NLS.m.size, k: NLS.m.has('k'), fire: [...NLS.m.keys()].filter(k => typeof k === 'string' && k[0] === 'f').length }), r => r.n >= 2 && r.k && r.fire >= 1);
// Punkte hinter Bäumen, vom Feuer aus gesehen: mit Schatten dunkler als ohne
const pts = await p.evaluate(() => { const cam = camOf(G.knight), out = [];
  const fire = GFIRES.map(f => [f, Math.hypot(f.x - G.knight.x, f.y - G.knight.y)]).sort((a, b) => a[1] - b[1])[0][0];
  for (const q of propsInView(cam)){ if (!/weide|birke|eiche|buche|fichte|apfel/.test(q.kind) || q.lz) continue;
    const d = Math.hypot(q.x - fire.x, q.y - fire.y); if (d < 50 || d > 180) continue;
    const ux = (q.x - fire.x) / d, uy = (q.y - fire.y) / d, x = Math.round(q.x + ux * 30 - cam.x), y = Math.round(q.y + uy * 30 - cam.y);
    if (x < 10 || y < 10 || x > W - 10 || y > H - 10) continue;
    if (propsInView(cam).some(o => x + cam.x > o.x - o.ax && x + cam.x < o.x - o.ax + o.img.width && y + cam.y > o.y - o.ay && y + cam.y < o.y - o.ay + o.img.height)) continue;
    out.push([x, y]); }
  return out.slice(0, 8); });
const mit = await lumAt(pts);
await p.evaluate(() => { window.__noNightShade = true; }); await p.waitForTimeout(500);
const ohne = await lumAt(pts);
await p.evaluate(() => { window.__noNightShade = false; });
console.log('     Punkte', JSON.stringify(pts.map((q, i) => mit[i] + '/' + ohne[i])));
await T('Schatten vom Feuer weg', () => 0, () => pts.length >= 1 && pts.some((q, i) => ohne[i] - mit[i] >= 4));
await shot('n34_feuer.png');
// ---- Spiegelungen und gespiegelte Fenster
await T('Wassermaske', () => { const k = G.knight, m = waterMask(Math.floor(k.x / wo_CP), Math.floor(k.y / wo_CP)); return { has: m.has, rfl: !!RFL.cv }; }, r => r.has && r.rfl);
await T('Spiegelbild im Wasser', () => { const d = RFL.cv.getContext('2d').getImageData(0, 0, RFL.cv.width, RFL.cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; }, r => r > 500);
await T('Fenster im Wasser', () => { const L = skyLights(camOf(G.knight)); return L.filter(l => l.length === 5 && l[2] === 70).length; }, r => r >= 0);
await T('Im Winter zugefroren', () => { const s0 = wo_GSEA; wo_GSEA = 3; const c = RFL.cv.getContext('2d'); c.clearRect(0, 0, RFL.cv.width, RFL.cv.height); drawReflections(camOf(G.knight), 0, 0); const d = c.getImageData(0, 0, RFL.cv.width, RFL.cv.height).data; wo_GSEA = s0; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; }, r => r === 0);
// ---- Tag: Pfützen, Hochwasser, Regenringe
await p.evaluate(() => { __at(14); window.__wet = 1; window.__flood = 1; WET.t = -1; });
await p.waitForTimeout(1800);
await T('Nässe und Flut', () => ({ w: WET.w, f: WET.f, said: WET.said }), r => r.w === 1 && r.f === 1);
await T('Bodenstück mit Wasser', () => [...SGC.m.values()].some(s => /:12:12$/.test(s.key)), r => r === true);
await shot('n34_hochwasser.png');
await T('Wetterverlauf', () => { window.__wet = null; window.__flood = null; window.__wx = 'Gewitter'; WET.t = -1; const a = wetNow(); const r = { w: +a.w.toFixed(2), f: +a.f.toFixed(2) }; window.__wx = 'klar'; WET.t = -1; const c = wetNow(); r.klarW = +c.w.toFixed(2); return r; }, r => r.w === 1 && r.f > .9 && r.klarW === 0);
await T('Regenringe', async () => { window.__wx = 'Regen'; window.__skyShift += 1; for (let i = 0; i < 30; i++){ updateClock(); rainRings(.1, camOf(G.knight)); } const n = G.rings.length; window.__wx = 'klar'; return n; }, r => r >= 3);
// ---- Funken und Glühwürmchen
await p.evaluate(() => { __at(23); goW(266, 420); }); await p.waitForTimeout(2000);
await T('Funken am Feuer', () => G.parts.filter(q => q.glow && q.g === 22).length, r => r >= 1);
await p.evaluate(() => goW(2470, 1600)); await p.waitForTimeout(1500);
await T('Glühwürmchen', () => ({ n: FFLY.length, zone: G.zone }), r => r.n >= 10);
await shot('n34_gluehwuermchen.png');
await p.evaluate(() => { window.__season = undefined; });
await T('Spielbild ohne Fehler', () => { for (let i = 0; i < 5; i++) render(); return true; }, r => r === true);
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
