// Mehrspieler über die Zeit: Botenpost, Markt (auch Wettlauf und Verkäufer offline), Länderwettstreit, Ordenshaus
import { launch, wait, OUT } from './harness.mjs';
import { zeigeTafel, schliesseTafel } from '../pfad.mjs';
const H = await launch(3, { init: { fn: () => { window.__wx = 'klar'; }, arg: 0 } });
await H.start(['Hans', 'Grete', 'Kunz'], ['reich', 'frankreich', 'england']);
let [A, B, C] = H.pages.map(P => P.p);
const cab = async (p, name) => (await p.$('.cabinet')).screenshot({ path: OUT + 'as_' + name + '.png' });
const ev = (p, f, a) => p.evaluate(f, a);
const ok = (c, msg) => console.log((c ? 'OK   ' : 'FEHL ') + msg);
for (const p of [A, B, C]) await ev(p, () => { HERO.gold = 1000; HERO.lvl = 8; refreshStats(); for (let i = 0; i < 4; i++) HERO.inv[i] = makeItem(['waffe', 'helm', 'schild', 'kleinod'][i], 8, 2); fameNow(); });
await wait(2500);
console.log('Abos', await ev(A, () => AS.subs.length), 'Ritter bekannt', await ev(A, () => asKnown().map(k => k.nm).join(',')));

// ---- 1) Brief von Hans an Grete mit 50 Gulden und einem Helm
const sendErr = await ev(A, () => asSend({ to: 'user1', tx: 'Seid gegrüßt, Grete! Hier ein Helm für Euch.', g: 50, idx: 1 }));
ok(sendErr === '', 'Brief abgeschickt ' + sendErr);
ok(await ev(A, () => HERO.gold === 1000 - 50 - PORTO && HERO.inv[1] === null && HERO.po.length === 1), 'Hans: Gulden und Helm in Treuhand');
await wait(2500);
const inbox = await ev(B, () => AS.inbox.map(L => L.fnm + ': ' + L.tx + ' / ' + L.g + ' / ' + (L.raw ? L.raw.n : '-')));
ok(inbox.length === 1 && /Helm|Schaller|Eisenhut|Lederhaube|Beckenhaube|Armet/.test(inbox[0]), 'Grete sieht den Brief: ' + inbox[0]);
console.log('Grete Meldungen:', await ev(B, () => [...document.querySelectorAll('#log p')].map(p => p.textContent).filter(t => /Brief/.test(t)).join(' / ')));
await ev(B, () => { const n = NPCS.find(n => n.id === 'postmeister'); G.knight.x = n.x + 16; G.knight.y = n.y + 8; openTalk(n); renderTalk('post'); });
await wait(300); await cab(B, 'post_inbox');
await ev(B, () => renderTalk('postL:' + AS.inbox[0].k)); await wait(200); await cab(B, 'post_letter');
await ev(B, () => { const x = AS.inbox[0]; asTakeLetter(x); closePanel(); });
ok(await ev(B, () => HERO.gold === 1050 && HERO.inv.filter(Boolean).length === 5 && AS.inbox.length === 0), 'Grete: 50 Gulden und Helm angenommen');
await wait(2500);
ok(await ev(A, () => HERO.po.length === 0), 'Hans: Brief als abgeholt gemeldet, Treuhand aufgelöst');
console.log('Hans Meldungen:', await ev(A, () => [...document.querySelectorAll('#log p')].map(p => p.textContent).filter(t => /Brief/.test(t)).join(' / ')));
// Brief zurückholen nach drei Tagen
await ev(A, () => { asSend({ to: 'user2', tx: 'Kunz, meldet Euch!', g: 20, idx: null }); HERO.po[0].t -= 4 * DAY; });
const g0 = await ev(A, () => HERO.gold); await ev(A, () => asRecall(HERO.po[0]));
ok(await ev(A, g => HERO.gold === g + 20 && HERO.po.length === 0, g0), 'Brief nach drei Tagen zurückgeholt, 20 Gulden zurück');

// ---- 2) Markt: Hans bietet ein Schwert an, Grete kauft
await ev(A, () => asOffer(0, 100));
{ const t0 = Date.now(); while (Date.now() - t0 < 15000 && !(await ev(B, () => asListings().length === 1))) await wait(250); console.log('Angebot nach', Date.now() - t0, 'ms bei Grete'); }   // das Speichern geht gebündelt, darum warten statt fester Pause
const listing = await ev(B, () => asListings().map(x => x.snm + ' ' + x.it.n + ' ' + x.p));
ok(listing.length === 1, 'Grete sieht das Angebot: ' + listing[0]);
await ev(B, () => { const n = NPCS.find(n => n.id === 'marktvogt'); G.knight.x = n.x + 16; G.knight.y = n.y + 8; openTalk(n); renderTalk('markt'); });
await wait(300); await cab(B, 'markt');
const gB = await ev(B, () => HERO.gold), wB = await ev(B, () => HERO.inv.filter(it => it && it.s === 'waffe').length);
ok(await ev(B, () => asBuy(asListings()[0])) === '', 'Grete zahlt');
await wait(9000);
ok(await ev(B, ([g, w]) => HERO.gold === g - 100 && HERO.inv.filter(it => it && it.s === 'waffe').length === w + 1, [gB, wB]), 'Grete hat das Schwert');
await wait(3000);
ok(await ev(A, () => HERO.mk.length === 0 && HERO.mkd.length === 1), 'Hans: Angebot verkauft');
console.log('Hans Gold nach Verkauf', await ev(A, () => HERO.gold), '(erwartet ' + (1000 - 50 - 3 - 3 + 100 - 5) + ')');
await wait(3000);
ok(await ev(B, () => HERO.kf.length === 0), 'Grete: Kauf abgeschlossen');

// ---- 3) Wettlauf: Grete und Kunz kaufen fast gleichzeitig denselben Schild
await ev(A, () => asOffer(2, 80));
await wait(2000);
const gB2 = await ev(B, () => HERO.gold), gC2 = await ev(C, () => HERO.gold), gA2 = await ev(A, () => HERO.gold);
await Promise.all([ev(B, () => asBuy(asListings()[0])), ev(C, () => asBuy(asListings()[0]))]);
await wait(14000);
const rb = await ev(B, () => ({ gold: HERO.gold, schild: HERO.inv.filter(it => it && it.s === 'schild').length })), rc = await ev(C, () => ({ gold: HERO.gold, schild: HERO.inv.filter(it => it && it.s === 'schild').length }));
console.log('Wettlauf Grete', JSON.stringify(rb), 'vorher', gB2, '| Kunz', JSON.stringify(rc), 'vorher', gC2);
ok(rb.schild + rc.schild === 3, 'genau einer bekommt den Schild (beide hatten schon einen eigenen)');
const paid = (gB2 - rb.gold) + (gC2 - rc.gold);
ok(paid === 80, 'zusammen nur einmal bezahlt: ' + paid);
await wait(3000);
ok(await ev(A, g => HERO.gold === g + 76, gA2), 'Hans einmal bezahlt (80 − 4 Gebühr)');

// ---- 4) Verkäufer offline: Hans bietet an, geht, Grete kauft, Hans kommt wieder
await ev(A, () => asOffer(3, 60));
await wait(26000);   // Spielstand im Konto (alle 20 s)
const gA3 = await ev(A, () => HERO.gold);
await H.close(0); A = null;
await wait(1500);
const gB3 = await ev(B, () => HERO.gold), kB3 = await ev(B, () => HERO.inv.filter(it => it && it.s === 'kleinod').length);
ok(await ev(B, () => { const L = asListings(); return L.length === 1 && asBuy(L[0]) === ''; }), 'Grete kauft, während Hans fort ist');
await wait(9000);
ok(await ev(B, ([g, k]) => HERO.gold === g - 60 && HERO.inv.filter(it => it && it.s === 'kleinod').length === k + 1, [gB3, kB3]), 'Grete hat das Kleinod, ohne dass Hans da ist');
A = await H.reopen(0);
await wait(6000);
ok(await ev(A, g => HERO.gold === g + 57 && HERO.mk.length === 0, gA3), 'Hans kommt wieder und wird bezahlt (60 − 3)');
console.log('Hans Meldungen:', await ev(A, () => [...document.querySelectorAll('#log p')].map(p => p.textContent).join(' / ')));

// ---- 5) Länderwettstreit: Hans hat letzte Woche gewonnen
await ev(A, () => { HERO.lw = { w: orWeek() - 1, p: 120 }; HERO.lwp = null; lwRoll(); lwAdd(7); fameNow(); });
await ev(B, () => { HERO.lw = { w: orWeek() - 1, p: 40 }; HERO.lwp = null; lwRoll(); lwAdd(30); fameNow(); });
await wait(7000);
ok(await ev(A, () => ASV.glory && lwWinners().join() === 'reich'), 'Das Königreich hat letzte Woche gewonnen, Hans hat den Ruhm');
ok(await ev(B, () => !ASV.glory && lwWinners().join() === 'reich'), 'Grete sieht den Sieg des Königreichs');
const xpb = await ev(A, () => { const x0 = HERO.xp, l0 = HERO.lvl; gainXp(100); return HERO.lvl === l0 ? HERO.xp - x0 : -1; });
ok(xpb === 105, 'Ruhm: +5 % Erfahrung (' + xpb + ')');
await ev(B, () => { closePanel(); const n = NPCS.find(n => n.id === 'herold'); G.knight.x = n.x + 16; G.knight.y = n.y + 8; openTalk(n); renderTalk('lw'); });
await wait(300); await cab(B, 'lw');
await ev(A, () => { const n = NPCS.find(n => n.id === 'herold'); G.knight.x = n.x + 16; G.knight.y = n.y + 8; openTalk(n); renderTalk('lw'); });
const gA5 = await ev(A, () => HERO.gold); await ev(A, () => asLwClaim());
ok(await ev(A, g => HERO.gold > g && HERO.lwClaim === orWeek(), gA5), 'Hans holt den Wochenlohn');
await ev(A, () => closePanel());

// ---- 6) Ordenshaus: Hans und Grete im selben Orden spenden zusammen 1100 Gulden
const O = { id: 'ordtest1', nm: 'Orden vom Apfel', kz: 'APF', wp: [3, 7, 0] };
await ev(A, o => { orJoin(o, true); ohGive(500); }, O);
await ev(B, o => { orJoin(o, false); ohGive(500); ohGive(100); }, O);
await wait(6000);
ok(await ev(A, () => ASV.ord === 2 && ohSum() === 1100), 'Hans: Ordenshaus Stufe 2 (' + await ev(A, () => ASV.ord + ' / ' + ohSum()) + ')');
ok(await ev(B, () => ASV.ord === 2), 'Grete: Ordenshaus Stufe 2');
await ev(B, () => { closePanel(); const n = NPCS.find(n => n.id === 'kaemmerer'); G.knight.x = n.x + 16; G.knight.y = n.y + 8; openTalk(n); renderTalk('ordh'); });
await wait(400); await cab(B, 'ordhaus');
await ev(B, () => closePanel()); await wait(500); await cab(B, 'ordhaus_welt');
await ev(B, () => { fameTab = 'laender'; renderFameTab(); });
await zeigeTafel(B, '#fameList'); await (await B.$('#fameList')).screenshot({ path: OUT + 'as_fame_lw.png' }); await schliesseTafel(B);
console.log('Dokument Hans:', JSON.stringify(H.DBS.get('heroes/user0')).length, 'Bytes');
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
