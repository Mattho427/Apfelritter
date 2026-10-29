// Mehr Online-Spiel (Version 32): Ritter im Land, Freunde, Flüstern, Gesten, Gesuche, Zweikampf zu Fuß (Sieg, Aufgeben, Zuschauer), Ruhmeshalle
import { launch, wait, OUT } from './harness.mjs';
import { zeigeTafel, schliesseTafel } from '../pfad.mjs';
const H = await launch(3, { init: { fn: () => { window.__wx = 'klar'; window.__skyShift = (0.5 - (Date.now() / 1000 / 1440 % 1)) * 1440; }, arg: 0 } });
await H.start(['Hans', 'Grete', 'Kunz'], ['reich', 'frankreich', 'england']);
let [A, B, C] = H.pages.map(P => P.p);
const cab = async (p, name) => (await p.$('.cabinet')).screenshot({ path: OUT + 'zk_' + name + '.png' });
const panel = async (p, name) => { await wait(250); try { await (await p.$('#ovTalk .panel')).screenshot({ path: OUT + 'zk_' + name + '.png', timeout: 5000 }); } catch (e){ console.log('kein Bild ' + name); } };
const ev = (p, f, a) => p.evaluate(f, a);
let fehl = 0;
const ok = (c, msg) => { if (!c) fehl++; console.log((c ? 'OK   ' : 'FEHL ') + msg); };
const logOf = (p, re) => ev(p, re => [...document.querySelectorAll('#log p')].map(x => x.textContent).filter(t => new RegExp(re).test(t)), re.source);
// alle drei auf der Turnierwiese, Hans und Grete nahe beieinander
for (const [p, dx, dy] of [[A, -50, 60], [B, 50, 60], [C, 0, 260]]) await ev(p, ([dx, dy]) => { const h = NPCS.find(n => n.id === 'herold'); G.knight.x = h.x + dx; G.knight.y = h.y + dy; HERO.gold = 200; HERO.lvl = 10; refreshStats(); G.knight.hp = ST.hp; updateHud(); $('banner').hidden = true; G.knight.dir = dx < 0 ? 'right' : 'left'; }, [dx, dy]);
await wait(1500);

// ---- Ritter im Land
ok(await ev(A, () => !$('btnRitter').hidden), 'Knopf „Ritter“ sichtbar');
await ev(A, () => openRitter());
const list = await ev(A, () => [...document.querySelectorAll('#talkBody .shoprow')].map(r => r.querySelector('b').textContent + ': ' + r.querySelector('small').textContent + ' [' + [...r.querySelectorAll('button')].map(b => b.textContent).join('/') + ']'));
console.log(list.join('\n'));
ok(list.length === 2 && list.some(t => /^Grete: Stufe 10 · Lilienritter/.test(t) && /Flüstern\/Freund\/Ansprechen/.test(t)) && list.some(t => /^Kunz/.test(t)), 'Liste der Ritter mit Haus, Ort und Knöpfen');
// Freund
await ev(A, () => [...document.querySelectorAll('#talkBody .shoprow')].find(r => /Grete/.test(r.textContent)).querySelectorAll('button')[1].click());
ok(await ev(A, () => HERO.frd.length === 1 && HERO.frd[0].nm === 'Grete' && HERO.frd[0].id === 'user1'), 'Grete ist Freundin von Hans (mit Kennung)');
ok(await ev(A, () => /Grete ★/.test($('talkBody').textContent)), 'Stern bei Freunden');
await panel(A, 'ritter');
// Gesuch
await ev(B, () => { openRitter(); renderTalk('gesuch'); });
await panel(B, 'gesuch');
await ev(B, () => { [...document.querySelectorAll('#talkBody button')].find(b => /Kriegszug/.test(b.textContent)).click(); closePanel(); });
await wait(900);
ok(await ev(A, () => { const q = [...PEERS.values()].find(p => p.nm === 'Grete'); return q && q.gs === 'kz'; }), 'Hans sieht Gretes Gesuch (Kriegszug)');
await ev(A, () => renderTalk('ritter'));
ok(await ev(A, () => /Grete ★: Stufe 10 · Lilienritter · .* · sucht Gefährten für einen Kriegszug/.test([...document.querySelectorAll('#talkBody .shoprow')].map(r => r.querySelector('b').textContent + ': ' + r.querySelector('small').textContent).join('\n'))), 'Gesuch in der Liste');
await ev(A, () => closePanel());

// ---- Flüstern
await ev(A, () => sendChat('/w Grete Treffen wir uns am Brunnen?'));
await wait(900);
const gw = await logOf(B, /flüstert/);
ok(gw.length === 1 && gw[0] === '[flüstert] Hans: Treffen wir uns am Brunnen?', 'Grete liest das Flüstern: ' + gw[0]);
ok((await logOf(C, /Brunnen/)).length === 0, 'Kunz liest es nicht');
ok((await logOf(A, /\[an Grete\]/)).length === 1, 'Hans sieht, was er geflüstert hat');
await ev(B, () => sendChat('/r Gern, gleich nach der Messe.'));
await wait(900);
ok((await logOf(A, /\[flüstert\] Grete: Gern/)).length === 1 && (await logOf(C, /Messe/)).length === 0, 'Antwort mit /r nur bei Hans');
await ev(A, () => sendChat('/w Niemand Hallo'));
ok((await logOf(A, /So flüstert Ihr/)).length === 1, 'Hinweis bei unbekanntem Namen');

// ---- Gesten
await ev(A, () => sendChat('/verneigen'));
await wait(700);
ok(await ev(B, () => { const q = [...PEERS.values()].find(p => p.nm === 'Hans'); return q && q.geK === 'verneigen' && /verneigt sich/.test(q.say); }), 'Grete sieht Hans sich verneigen');
ok((await logOf(B, /^Hans verneigt sich\.$/)).length === 1 && (await logOf(A, /^Ihr verneigt Euch\.$/)).length === 1, 'Bericht bei beiden');
await cab(B, 'geste');
await ev(B, () => { openRitter(); renderTalk('gesten'); });
const gb = await ev(B, () => [...document.querySelectorAll('#talkBody button')].map(b => b.textContent));
ok(gb.includes('Knien') && gb.includes('Tanzen') && gb.includes('Schwertgruß'), 'Gestenknöpfe: ' + gb.join(', '));
await ev(B, () => [...document.querySelectorAll('#talkBody button')].find(b => b.textContent === 'Knien').click());
await wait(700);
ok(await ev(A, () => [...PEERS.values()].find(p => p.nm === 'Grete').geK === 'knien'), 'Hans sieht Grete knien');
await wait(300); await cab(A, 'knien');

// ---- Zweikampf: Anfrage im Gespräch, Annehmen
await ev(A, () => openPeer([...PEERS.values()].find(p => p.nm === 'Grete')));
const po = await ev(A, () => [...document.querySelectorAll('#talkBody button')].map(b => b.textContent + (b.disabled ? '(x)' : '')));
ok(po.includes('Zum Zweikampf fordern') && po.includes('Flüstern') && po.includes('Aus den Freunden streichen'), 'Knöpfe im Gespräch: ' + po.join(' | '));
await panel(A, 'gespraech');
await ev(A, () => [...document.querySelectorAll('#talkBody button')].find(b => b.textContent === 'Zum Zweikampf fordern').click());
await wait(900);
ok(await ev(B, () => !$('ask').hidden && /fordert Euch zum ritterlichen Zweikampf/.test($('askText').textContent)), 'Grete wird gefordert');
await ev(B, () => $('askYes').click());
await wait(1200);
const z0 = await ev(A, () => NET.zk && { w: NET.zk.nm, h: NET.zk.h, mx: NET.zk.mx, r: Math.round(Math.hypot(G.knight.x - NET.zk.cx, G.knight.y - NET.zk.cy)) });
ok(z0 && z0.w === 'Grete' && z0.h === z0.mx && z0.mx > 300 && z0.r < 120, 'Zweikampf läuft bei Hans ' + JSON.stringify(z0));
ok(await ev(B, () => NET.zk && NET.zk.nm === 'Hans'), 'und bei Grete');
ok(await ev(C, () => { const a = [...PEERS.values()].find(p => p.nm === 'Hans'); return a && a.zk && a.bz === 'z'; }), 'Kunz sieht, dass Hans ficht');
ok(await ev(A, () => /Zweikampf gegen Grete/.test($('tracker').textContent)), 'Zeile oben links');
// Kreis: wer hinaus will, bleibt drin
const inRing = await ev(A, () => { const Z = NET.zk, k = G.knight; k.x = Z.cx + 400; k.y = Z.cy; zkFrame(); return Math.round(Math.hypot(k.x - Z.cx, k.y - Z.cy)); });
ok(inRing <= 231, 'Der Kreis hält Hans drin: ' + inRing);
// Treffer: Grete schlägt zu, Hans zieht es sich ab
const bot = () => { window.__zb = setInterval(() => {
  if (G.mode !== 'play' || !NET.zk || NET.zk.end) { keys.clear(); atkHeld = false; return; }
  const q = PEERS.get(NET.zk.w), k = G.knight; if (!q) return;
  keys.clear(); atkHeld = false;
  const dx = q.x - k.x, dy = q.y - k.y, d = Math.hypot(dx, dy);
  if (Math.abs(dx) > 30) keys.add(dx > 0 ? 'right' : 'left');
  if (Math.abs(dy) > 8) keys.add(dy > 0 ? 'down' : 'up');
  if (d < 52){ k.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); atkHeld = Math.random() < (window.__zkAgg || .7); }
}, 90); };
await ev(A, bot); await ev(B, bot); await ev(B, () => { window.__zkAgg = 1; }); await ev(A, () => { window.__zkAgg = .25; });
let shot = 0;
for (let i = 0; i < 80; i++){
  await wait(1500);
  const a = await ev(A, () => NET.zk ? Math.round(NET.zk.h) + '/' + NET.zk.mx + (NET.zk.end ? ' ende' : '') + (NET.zk.done ? ' fertig' : '') : '-');
  const b = await ev(B, () => NET.zk ? Math.round(NET.zk.h) + '/' + NET.zk.mx + (NET.zk.end ? ' ende' : '') + (NET.zk.done ? ' fertig' : '') : '-');
  if (i % 4 === 0) console.log('t' + i, 'Hans', a, '| Grete', b);
  if (!shot && /^\d+/.test(a) && parseInt(a) < z0.mx * .8){ await cab(A, 'kampf'); await cab(C, 'zuschauer'); shot = 1; }
  if (/fertig/.test(a) && /fertig/.test(b)) break;
}
await ev(A, () => clearInterval(window.__zb)); await ev(B, () => clearInterval(window.__zb));
const ra = await ev(A, () => ({ zk: HERO.zk, res: NET.zk && NET.zk.res, gold: HERO.gold, lw: HERO.lw && HERO.lw.p, log: [...document.querySelectorAll('#log p')].map(x => x.textContent).filter(t => /Zweikampf/.test(t)).slice(-1)[0] }));
const rb = await ev(B, () => ({ zk: HERO.zk, res: NET.zk && NET.zk.res, gold: HERO.gold, lw: HERO.lw && HERO.lw.p, log: [...document.querySelectorAll('#log p')].map(x => x.textContent).filter(t => /Zweikampf/.test(t)).slice(-1)[0] }));
console.log('Hans', JSON.stringify(ra)); console.log('Grete', JSON.stringify(rb));
ok(ra.res != null && rb.res != null && ra.res + rb.res === 1, 'Beide zählen dasselbe Ergebnis');
ok(Math.abs(ra.zk.e + rb.zk.e - 2000) <= 1, 'Wertung wandert vom Verlierer zum Sieger');
const win = ra.res === 1 ? ra : rb.res === 1 ? rb : null;
ok(!win || (win.gold === 200 + 10 + 20 && win.lw === 5 && win.zk.w === 1), 'Sieger: Ehrensold und 5 Punkte im Wettstreit');
await cab(A, 'ende');
// echtes Leben blieb unberührt
ok(await ev(A, () => G.knight.hp > 0 && G.mode === 'play') && await ev(B, () => G.knight.hp > 0 && G.mode === 'play'), 'Niemand ist wirklich gestorben');
await wait(6500);
ok(await ev(A, () => NET.zk === null) && await ev(B, () => NET.zk === null), 'Zweikampf aufgeräumt');

// ---- zweiter Zweikampf: Grete fordert, Hans gibt auf
await ev(B, () => netAsk([...PEERS.values()].find(p => p.nm === 'Hans'), 'zk'));
await wait(900); await ev(A, () => $('askYes').click()); await wait(1200);
await ev(A, () => sendChat('/aufgeben'));
await wait(2500);
const g2 = await ev(B, () => NET.zk && NET.zk.res), h2 = await ev(A, () => NET.zk && NET.zk.res);
ok(g2 === 1 && h2 === 0, 'Aufgeben: Grete gewinnt, Hans verliert');
// beschäftigt: während des Zweikampfs keine neue Anfrage
await wait(6500);

// ---- Ruhmeshalle: Zweikampf
for (const p of [A, B]) await ev(p, () => { cloud.fameT = 0; cloud.fameBusy = false; pushFame(); });
await wait(3000);
await zeigeTafel(C, '#fameList');
await ev(C, () => document.querySelector('[data-ft="zweikampf"]').click());
const fame = await ev(C, () => [...document.querySelectorAll('#fameList li')].map(li => li.textContent));
console.log(fame.join('\n'));
ok(fame.length === 2 && fame.every(t => /Wertung \d+/.test(t)) && fame.some(t => /Grete/.test(t)) && fame.some(t => /Hans/.test(t)), 'Zweikampf in der Ruhmeshalle');
try { await (await C.$('#fameList')).screenshot({ path: OUT + 'zk_ruhm.png', timeout: 5000 }); } catch (e){ console.log('kein Bild zk_ruhm'); }
await schliesseTafel(C);

// ---- Freund kommt ins Land
await H.close(1); await wait(800);
B = await H.reopen(1); await wait(2000);
const fl = await logOf(A, /Euer Freund/);
ok(fl.length === 1 && /^Grete, Euer Freund, ist im Königsland\.$/.test(fl[0]), 'Hans erfährt, dass Grete kommt: ' + fl[0]);
ok((await logOf(C, /^Grete ist im Königsland\.$/)).length >= 1, 'Kunz bekommt die gewöhnliche Meldung');
// Spielstand
ok(await ev(A, () => { const c = JSON.parse(JSON.stringify(HERO)); cleanHero(c); return c.frd.length === 1 && c.frd[0].nm === 'Grete' && c.zk.w + c.zk.l + c.zk.d === 2; }), 'Freunde und Zweikampf im Spielstand');
console.log(H.errors().join('\n') || 'keine Fehler');
console.log(fehl ? 'FEHL ' + fehl : 'alles gut');
await H.done();
