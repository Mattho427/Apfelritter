// Belagerung der Hausburgen (Version 32): vier Weltereignisse im Wechsel, Burg unsicher, Torwachen, Söldner, Hauptmann, Lohn für das eigene Haus und für Gäste
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
// Tag des Adlerhorsts (Spieltag mit Rest 0), erst um 21 Uhr (kein Ereignis), dann um 4:05 Uhr
await p.evaluate(() => { window.__wx = 'klar'; window.__evNeed = 6;
  const now = Date.now() / 1000, D = Math.floor(now / DAY_LEN), d = D + (4 - D % 4) % 4 + 4;
  window.__at = h => { window.__skyShift = d * DAY_LEN + h * 60 - Date.now() / 1000; };
  __at(21);
  const h = freshHero('Hans', 'reich'); h.lvl = 12; h.gold = 300; startGame(h); $('banner').hidden = true;
  const P = wo_HAUSP.reich, q = gNear(P.tor.x, P.tor.y + 110), k = G.knight; k.x = q.x; k.y = q.y; updateZone(true); });
await p.waitForTimeout(800);
let fehl = 0;
const T = async (name, fn, ok, arg) => { let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = 'Fehler: ' + e.message.split('\n')[0]; } const gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const shot = async n => { await p.waitForTimeout(600); await (await p.$('canvas')).screenshot({ path: OUT + n }); };

await T('Vier Belagerungen', () => EV_DEFS.filter(d => d.siege).map(d => [d.siege, d.zone, d.at, d.len, d.cyc.join('/'), d.name]),
  r => r.length === 4 && r.map(x => x[4]).join() === '4/0,4/1,4/2,4/3' && r.every(x => x[2] === 4 && x[3] === 4) && r[0][5] === 'Belagerung des Adlerhorsts' && r[1][5] === 'Belagerung von Schloss Lilienthal');
await T('Kein Ereignis zugleich', () => { const on = h => EV_DEFS.filter(d => (h - d.at + 24) % 24 < d.len), bad = [];
  for (let h = 0; h < 24; h++){ const L = on(h); for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++){ const a = L[i], c = L[j]; if (!(a.cyc && c.cyc && a.cyc[0] === c.cyc[0] && a.cyc[1] !== c.cyc[1])) bad.push(h + ':' + a.id + '/' + c.id); } }
  return bad; }, r => r.length === 0);
await T('Abends sicher', () => ({ z: G.zone, safe: isSafe(G.zone), ev: EVT.cur && EVT.cur.id }), r => r.z === 'adlerhorst' && r.safe && !r.ev);
// um 4:05 Uhr: die Schwarze Schar
await p.evaluate(() => __at(4 + 5 / 60));
await p.waitForTimeout(1500);
await T('Belagerung beginnt', () => ({ id: EVT.cur && EVT.cur.d.id, raid: EVT.raid, safe: isSafe(G.zone), zone: $('zone').textContent, log: [...document.querySelectorAll('#log p')].map(x => x.textContent).filter(t => /Schwarze Schar/.test(t)) }),
  r => r.id === 'belagerung_reich' && r.raid === 'adlerhorst' && !r.safe && /Die Burg wird belagert!/.test(r.zone) && r.log.some(t => /berennt den Adlerhorst/.test(t)));
await T('Torwache ruft', () => { const n = NPCS.find(q => q.id === 'hbw_reichl'); return n.greet.join(' '); }, r => /Schwarze Schar steht vor dem Tor/.test(r));
await T('Oben links', () => $('tracker').textContent, r => /Belagerung des Adlerhorsts/.test(r) && /Söldnern zurückgeschlagen/.test(r));
await p.waitForTimeout(12000);
await T('Söldner vor dem Tor', () => G.mons.filter(m => m.ev).map(m => m.nm + ' ' + m.k), r => r.length >= 5 && r.every(t => /Söldner der Schwarzen Schar doppelsoeldner|Büchsenschütze der Schar hakenschuetze/.test(t)));
await shot('bel_soeldner.png');
await p.evaluate(() => { window.__bot = setInterval(() => {
  if (G.mode !== 'play') return;
  const k = G.knight; keys.clear(); atkHeld = false; k.hp = ST.hp;
  let best = null, bd = 1e9;
  for (const m of G.mons){ if (!m.ev) continue; const d = Math.hypot(m.x - k.x, m.y - k.y); if (d < bd){ bd = d; best = m; } }
  if (!best) return;
  const dx = best.x - k.x, dy = best.y - k.y;
  if (Math.abs(dx) > 24) keys.add(dx > 0 ? 'right' : 'left');
  if (Math.abs(dy) > 8) keys.add(dy > 0 ? 'down' : 'up');
  if (bd < 46){ k.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); atkHeld = true; }
}, 100); });
let boss = false;
for (let i = 0; i < 70; i++){
  await p.waitForTimeout(3000);
  const s = await p.evaluate(() => { const E = EVT.cur; return E ? E.phase + ' ' + E.killedN + '/' + E.need + ' ' + (E.bossHp | 0) + (E.over ? ' over ' + E.won : '') : '-'; });
  if (i % 5 === 0) console.log('     t' + i * 3, s);
  if (!boss && /^boss/.test(s) && await p.evaluate(() => !!(EVT.cur.boss && G.mons.includes(EVT.cur.boss)))){ boss = true; await shot('bel_hauptmann.png'); console.log('     Hauptmann:', await p.evaluate(() => EVT.cur.boss.nm + ' ' + EVT.cur.boss.k)); }
  if (/over/.test(s)) break;
}
await p.evaluate(() => clearInterval(window.__bot));
await T('Gewonnen', () => ({ won: EVT.cur && EVT.cur.won, hbs: HERO.hbs, gunst: HERO.gunst && Math.round(HERO.gunst.t), lw: HERO.lw && HERO.lw.p, prize: HERO.inv.filter(Boolean).map(i => i.n).filter(n => /Adlerhorst/.test(n)), log: [...document.querySelectorAll('#log p')].map(x => x.textContent).filter(t => /verteidigt|hält stand/.test(t)) }),
  r => r.won && r.hbs && r.hbs.own === 1 && r.hbs.n === 1 && r.gunst >= 1790 && r.lw >= 30 && r.prize.length === 1 && r.log.length >= 2);
await T('Trophäe', () => TROPHY_BY.burgwacht.ok(HERO), r => r === true);
await T('Wieder sicher', () => ({ raid: EVT.raid, safe: isSafe(G.zone) }), r => r.raid === '' && r.safe);
await shot('bel_ende.png');
// als Gast: Dank in Gulden, keine Punkte
await T('Gast bekommt Gulden', () => { const g0 = HERO.gold, p0 = HERO.lw.p; hbSiegeWon(EV_DEFS.find(d => d.siege === 'england')); return { dg: HERO.gold - g0, dp: HERO.lw.p - p0, hbs: HERO.hbs, log: [...document.querySelectorAll('#log p')].slice(-1)[0].textContent }; },
  r => r.dg === 20 + 12 * 3 && r.dp === 0 && r.hbs.n === 2 && r.hbs.own === 1 && /Fürst Edwin der Löwe dankt Euch/.test(r.log));
await T('Spielstand', () => { const c = JSON.parse(JSON.stringify(HERO)); cleanHero(c); return c.hbs; }, r => r && r.n === 2 && r.own === 1);
await T('Tafel', () => [...document.querySelectorAll('#evList li .what')].map(x => x.firstChild.textContent), r => r.includes('Belagerung der Hausburgen'));
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
