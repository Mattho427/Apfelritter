// Wind, Natur und Klang (Version 35): Windstärke nach Wetter, wiegende Kronen (vorberechnete Neigungen), Grasbüschel (nicht im Winter),
// Laub im Herbststurm, Rauch mit dem Wind, Wolkenschatten; Schritte nach Boden, Hufe, Hall in Gasthaus und Kirche, Glocken nach Entfernung,
// Plätschern am Wasser, Ton aus
import { chromium, OUT, PAGE, zeigeTafel, schliesseTafel } from '../pfad.mjs';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await p.evaluate(() => { window.__wx = 'klar'; window.__season = 1; window.__at = h => { window.__skyShift = (h / 24 - (Date.now() / 1000 / DAY_LEN % 1)) * DAY_LEN; }; __at(13);
  const h = freshHero('Hans', 'reich'); h.lvl = 12; startGame(h); $('banner').hidden = true;
  window.goW = (x, y) => { const q = gNear(x, y), k = G.knight; k.x = q.x; k.y = q.y; updateZone(true); G.mons.length = 0; }; goW(1500, 1300); });
await p.waitForTimeout(1500);
let fehl = 0;
const T = async (name, fn, ok, arg) => { let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = 'Fehler: ' + e.message.split('\n')[0]; } const gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const changed = () => p.evaluate(async () => { const a = ctx.getImageData(0, 0, W, H).data; await new Promise(r => setTimeout(r, 450)); const c = ctx.getImageData(0, 0, W, H).data; let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) > 30) n++; return n; });

// ---- Wind
await T('Flaute bei klarem Himmel', () => +WIND.a.toFixed(2), r => r < .2);
await p.evaluate(() => { window.__wx = 'Gewitter'; }); await p.waitForTimeout(2500);
await T('Sturm bei Gewitter', () => +WIND.a.toFixed(2), r => r > .6);
await T('Neigungsbilder', () => { const q = GPROPS.find(x => x.kind === 'eiche' && !x.lz), a = swayImg(q.img, 2), c = swayImg(q.img, -1); return { w: q.img.width, a: a.width, same: swayImg(q.img, 2) === a, ks: [...new Set(Array.from({ length: 40 }, (_, i) => { G.t += .37; return swayK(q.x, q.y, 1); }))].sort() }; },
  r => r.a === r.w + 4 && r.same && r.ks.length >= 3);
const mit = await changed();
await p.evaluate(() => { window.__noSway = true; window.__noTufts = true; }); await p.waitForTimeout(200);
const ohne = await changed();
await p.evaluate(() => { window.__noSway = false; window.__noTufts = false; });
await T('Bäume wiegen sich', () => 0, () => mit > ohne * 1.3 && mit - ohne > 1500);
console.log('     verändert mit/ohne', mit, ohne);
await T('Grasbüschel', () => { const cam = camOf(G.knight); let n = 0; for (let j = Math.floor(cam.y / 36); j <= Math.floor((cam.y + H) / 36); j++) for (let i = Math.floor(cam.x / 36); i <= Math.floor((cam.x + W) / 36); i++) if (tuftAt(i, j)) n++; return n; }, r => r >= 20);
await T('Im Winter kein Gras', () => { const c = SEA.cur, f0 = window.tuftAt; let n = 0; window.tuftAt = (i, j) => { n++; return f0(i, j); }; SEA.cur = 3; drawTufts(camOf(G.knight)); SEA.cur = c; window.tuftAt = f0; return n; }, r => r === 0);
await p.screenshot({ path: OUT + 'n35_sturm.png' });
// Laub im Herbststurm
await T('Laub im Herbststurm', () => { SEA.cur = 2; LEAF.length = 0; for (let i = 0; i < 80; i++) fx35(.05); return { n: LEAF.length, cols: [...new Set(LEAF.map(l => l.c))].length }; }, r => r.n >= 6 && r.cols >= 2);
await p.evaluate(() => { SEA.cur = 1; });
// Rauch zieht mit dem Wind
await T('Rauch im Sturm', () => { const s = GSMOKES[0]; goW(s.x / WS, s.y / WS + 40); G.parts.length = 0; for (let i = 0; i < 60; i++) updateFx(.05); const sm = G.parts.filter(q => q.wx !== undefined); return { n: sm.length, wx: sm.length ? Math.round(sm[0].wx) : 0 }; }, r => r.n >= 3 && Math.abs(r.wx) > 40);
await p.evaluate(() => { window.__wx = 'klar'; }); await p.waitForTimeout(2200);
await T('Rauch bei Flaute', () => { G.parts.length = 0; for (let i = 0; i < 60; i++) updateFx(.05); const sm = G.parts.filter(q => q.wx !== undefined); return { n: sm.length, wx: sm.length ? Math.round(Math.max(...sm.map(q => Math.abs(q.wx)))) : 0 }; }, r => r.n >= 3 && r.wx < 25);
// Wolkenschatten bei heiterem Himmel
await p.evaluate(() => { window.__wx = 'heiter'; goW(1700, 900); }); await p.waitForTimeout(2500);
await T('Wolkenschatten', async () => { CLOUD.off = 0; CLOUD.slowT = 0; CLOUD.ema = 1 / 60; render(); const lum = () => { const d = ctx.getImageData(0, 0, W, H).data; let s = 0; for (let i = 0; i < d.length; i += 64) s += d[i] + d[i + 1] + d[i + 2]; return s; };
  const a = lum(); window.__noClouds = true; render(); const c = lum(); window.__noClouds = false; return { mit: a, ohne: c, tex: CLOUD.tex && CLOUD.tex.width }; }, r => r.tex === 1024 && r.ohne > r.mit * 1.01);
// ---- Klang
await T('Böden', () => { const out = {}; const at = (id, x, y) => { goW(x, y); out[id] = surfAt(); };
  const br = wo_BRIDGES[0]; at('bruecke', (br.x0 + br.x1) / 2, (br.y0 + br.y1) / 2); at('burghof', 1900, 400);
  for (const id of ['wald', 'hochgebirge', 'obstgarten']){ const z = ZONE_BY_ID[id]; at(id, z.label.x, z.label.y); }
  return out; }, r => r.bruecke === 'holz' && r.burghof === 'stein' && r.wald === 'laub' && r.hochgebirge === 'kies' && r.obstgarten === 'gras');
await p.evaluate(() => goW(ZONE_BY_ID.wald.label.x, ZONE_BY_ID.wald.label.y));
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(900); await p.keyboard.up('ArrowRight');
await T('Schritte im Wald', () => ({ last: AMB.last, n: AMB.n, ac: !!Sound.ac }), r => r.ac && r.last === 'laub' && r.n >= 6);
await T('Hufe auf Pflaster', () => { goW(1900, 400); AMB.surf = surfAt(); const n0 = AMB.n; Sound.hoof(); return { surf: AMB.surf, n: AMB.n - n0 }; }, r => r.surf === 'stein' && r.n === 1);
await T('Hall im Gasthaus', () => { enterInn(INNS[0]); ambTick(.016); const r = { room: Sound.room, ir: !!Sound.bus.conv.buffer, sec: +(Sound.bus.conv.buffer.duration).toFixed(1) }; leaveInn(); ambTick(.016); r.out = Sound.room; return r; }, r => r.room === 'gasthaus' && r.ir && r.sec < 1 && r.out === 'aussen');
await T('Hall in der Kirche', () => { const ch = CHURCHES[0]; enterInn(ch); ambTick(.016); const r = { inside: !!(G.inside && G.inside.church), room: Sound.room, sec: +(Sound.bus.conv.buffer.duration).toFixed(1), surf: surfAt() }; leaveInn(); ambTick(.016); return r; }, r => r.inside && r.room === 'kirche' && r.sec >= 3 && r.surf === 'stein');
await T('Glocken nach Entfernung', () => { AMB.tolls.length = 0; goW(2966, 2240); AMB.hour = 9; SKY.hour = 10.02; ambTick(.016); goW(4300, 3600); AMB.hour = 10; SKY.hour = 11.02; ambTick(.016); return AMB.tolls; },
  r => r.length === 2 && r[0].n === 10 && r[1].n === 11 && r[0].v > r[1].v && r[0].lp > r[1].lp);
await T('Nachts keine Glocken', () => { AMB.tolls.length = 0; AMB.hour = 22; SKY.hour = 23.02; ambTick(.016); return AMB.tolls.length; }, r => r === 0);
await T('Plätschern am Wasser', () => { const br = wo_BRIDGES[0]; goW((br.x0 + br.x1) / 2 + 60, (br.y0 + br.y1) / 2 - 40); const n0 = AMB.n; for (let i = 0; i < 40; i++) ambTick(.05); return AMB.n - n0; }, r => r >= 3);
await T('Ton aus: still', () => { Sound.on = false; const n0 = AMB.n; Sound.foot('gras'); Sound.toll(3, 1, 3000); for (let i = 0; i < 20; i++) ambTick(.05); const r = AMB.n - n0; Sound.on = true; return r; }, r => r === 0);
// Tafel
await zeigeTafel(p, '#dayList');
await T('Tafel', () => [...document.querySelectorAll('.note')].find(n => n.querySelector('#dayList')).querySelector('.tip').textContent, r => /Wind/.test(r) && /Kirchenglocke/.test(r));
await schliesseTafel(p);
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
