// Die große Karte (Version 34): Öffnen, Zoomen (Knöpfe, Tasten, Rad, Doppelklick), Verschieben, Detailkacheln, Zeichen und Hinweise,
// Beschriftungen, Gebietsstufen, Filter (gemerkt), kleine Karte antippen, Handy
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), ctx2 = await b.newContext({ viewport: { width: 1400, height: 860 } }), p = await ctx2.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await p.evaluate(() => { window.__wx = 'klar'; localStorage.removeItem('apfelritter.karte'); const h = freshHero('Hans', 'reich'); h.lvl = 9; startGame(h); $('banner').hidden = true; const q = gNear(2966, 2200), k = G.knight; k.x = q.x; k.y = q.y; updateZone(true); });
await p.waitForTimeout(800);
let fehl = 0;
const T = async (name, fn, ok, arg) => { let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = 'Fehler: ' + e.message.split('\n')[0]; } const gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const panel = async n => { await p.waitForTimeout(500); await (await p.$('#ovMap .panel')).screenshot({ path: OUT + n }); };

await p.keyboard.press('KeyK'); await p.waitForTimeout(800);
await T('Öffnen mit K', () => ({ open: !$('ovMap').hidden, z: +MV.z.toFixed(1), w: $('mapCv').width, near: Math.hypot(MV.cx - G.knight.x, MV.cy - G.knight.y) < 400 }), r => r.open && r.z >= 2.5 && r.w > 600 && r.near);
await T('Zeichen und Ritter', () => { const t = MV.hits.map(h => h.t); return { n: t.length, me: t.includes(HERO.name), inn: t.some(x => /^Zum /.test(x)), smith: MV.hits.some(h => /Schmied/.test(h.sub || '')) }; }, r => r.n > 10 && r.me && r.inn && r.smith);
await p.waitForTimeout(2500);
await T('Detailkacheln', () => ({ n: [...MV.tiles.values()].filter(t => t.cv).length, S: [...MV.tiles.values()].map(t => t.S).filter((v, i, a) => a.indexOf(v) === i) }), r => r.n >= 2);
await panel('karte_nah.png');
// Hinweis beim Zeigen
const pt = await p.evaluate(() => { const c = $('mapCv'), r = c.getBoundingClientRect(), h = MV.hits.find(x => /^Zum /.test(x.t)); return { x: r.left + h.x / MV.dpr, y: r.top + h.y / MV.dpr, t: h.t }; });
await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(300);
await T('Hinweis', () => $('mapTip').hidden ? null : $('mapTip').querySelector('b').textContent, r => r === pt.t);
// Zoom: Knöpfe, Tasten, Rad, Doppelklick
await T('Knopf weiter weg', () => { const z0 = MV.z; $('mapZout').click(); return { z0: +z0.toFixed(2), z1: +MV.z.toFixed(2) }; }, r => r.z1 < r.z0);
await T('Knopf näher', () => { const z0 = MV.z; $('mapZin').click(); return { z0: +z0.toFixed(2), z1: +MV.z.toFixed(2) }; }, r => r.z1 > r.z0);
const z0 = await p.evaluate(() => MV.z);
await p.keyboard.press('Minus'); await p.waitForTimeout(100);
await T('Taste minus', () => MV.z, r => r < z0);
const cx0 = await p.evaluate(() => MV.cx);
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
await T('Pfeil verschiebt', () => MV.cx, r => r > cx0);
await p.mouse.move(pt.x, pt.y); await p.mouse.wheel(0, -400); await p.waitForTimeout(200);
await T('Rad zoomt', () => MV.z, r => r > z0 * .9);
await p.keyboard.press('Digit0'); await p.waitForTimeout(300);
await T('Ganzes Land', () => ({ z: MV.z, cx: Math.round(MV.cx), gw: GW / 2 }), r => r.z === 1 && r.cx === r.gw);
await panel('karte_ganz.png');
await T('Gebietsstufen', () => { const lv = ZONES.filter(z => ZONE_LV[z.id]).map(z => [z.id, zoneDanger(z.id)[1]]); return { leicht: lv.filter(x => x[1] === 'leicht').length, gefaehrlich: lv.filter(x => x[1] === 'gefährlich').length }; }, r => r.leicht >= 1 && r.gefaehrlich >= 3);
// Ziehen verschiebt
await p.keyboard.press('Equal'); await p.keyboard.press('Equal'); await p.waitForTimeout(200);
const before = await p.evaluate(() => [MV.cx, MV.cy]);
const box = await (await p.$('#mapCv')).boundingBox();
await p.mouse.move(box.x + 400, box.y + 200); await p.mouse.down(); await p.mouse.move(box.x + 300, box.y + 150, { steps: 5 }); await p.mouse.up();
await T('Ziehen verschiebt', () => [Math.round(MV.cx), Math.round(MV.cy)], r => r[0] > before[0] && r[1] > before[1]);
await p.mouse.dblclick(box.x + 500, box.y + 250); await p.waitForTimeout(200);
await T('Doppelklick zoomt', () => MV.z, r => r > 2);
// Filter: Gasthäuser aus, gemerkt
await T('Filter Gasthäuser', () => { const b2 = [...document.querySelectorAll('#mapLegend [data-mf]')].find(x => x.dataset.mf === 'gasthaus'); b2.click(); drawFullMap(); return { pressed: b2.getAttribute('aria-pressed'), inns: MV.hits.filter(h => /^Zum /.test(h.t)).length, saved: JSON.parse(localStorage.getItem('apfelritter.karte')).gasthaus }; },
  r => r.pressed === 'false' && r.inns === 0 && r.saved === false);
await T('Filter wieder an', () => { const b2 = document.querySelector('#mapLegend [data-mf="gasthaus"]'); b2.click(); return MF.gasthaus; }, r => r === true);
await T('Legende', () => ({ chips: document.querySelectorAll('#mapLegend .mchip').length, key: $('mapLegend').textContent.includes('gefährlich') }), r => r.chips === 7 && r.key);
await p.keyboard.press('KeyK'); await p.waitForTimeout(300);
await T('Schließen mit K', () => $('ovMap').hidden, r => r === true);
// die kleine Karte antippen öffnet die große
const mm = await p.evaluate(() => { const c = cv.getBoundingClientRect(); return { x: c.left + (W - 6 - MM_W * MM_Z / 2) * c.width / W, y: c.top + (H - 6 - MM_H * MM_Z / 2) * c.height / H }; });
await p.mouse.click(mm.x, mm.y); await p.waitForTimeout(400);
await T('Kleine Karte antippen', () => !$('ovMap').hidden, r => r === true);
await p.evaluate(() => closePanel());
// Handy
const ph = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
ph.on('pageerror', e => errs.push('Handy: ' + e.message));
await ph.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await ph.goto(PAGE); await ph.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await ph.evaluate(() => { const h = freshHero('Grete', 'frankreich'); startGame(h); $('banner').hidden = true; openMap(); });
await ph.waitForTimeout(1500);
const hr = await ph.evaluate(() => { const r = $('mapCv').getBoundingClientRect(), pnl = document.querySelector('#ovMap .panel').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), fits: pnl.width <= innerWidth + 1 }; });
const hok = hr.w >= 300 && hr.h >= 200 && hr.fits; if (!hok) fehl++; console.log((hok ? 'ok   ' : 'FEHL ') + 'Handy'.padEnd(22), JSON.stringify(hr));
await (await ph.$('#ovMap .panel')).screenshot({ path: OUT + 'karte_handy.png' });
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
