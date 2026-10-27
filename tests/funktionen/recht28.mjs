// Recht und Ruf (Version 28): Ansehen bei vier Ständen mit Preisen und Lohn, Diebstahl, Wilderei, Festnahme, Bußgeld, Pranger,
// Kerker (Bestechung und Ausbruch), Flucht, Steckbriefe, die Fehde gegen Schwarzeck, die Glaubensentscheidung, Spielstand
import { chromium, OUT, PAGE, zeigeTafel, schliesseTafel } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 90000 });
await p.evaluate(() => { window.__wx = 'klar'; window.__fest = false; const h = freshHero('Hans', 'reich'); h.lvl = 20; h.gold = 5000; startGame(h); $('banner').hidden = true;
  setInterval(() => { if (G.knight.hp > 0 && !window.__noHeal) G.knight.hp = ST.hp; }, 200);
  window.goW = (x, y) => { const q = gNear(x, y), k = G.knight; k.x = q.x; k.y = q.y; updateZone(true); G.mons.length = 0; };
  window.goN = id => { const n = NPCS.find(q => q.id === id), k = G.knight; k.x = n.x; k.y = n.y + 24; updateZone(true); return n; };
  window.zurWache = async () => { rrS().cool = 0; goW(2966, 2070); await new Promise(r => setTimeout(r, 700)); const e = rrGuards(900).sort((a, b) => a.y - b.y)[0]; if (!e) return false;
    const k = G.knight; k.x = e.x; k.y = e.y + 60; updateZone(true); await new Promise(r => setTimeout(r, 900)); return true; };
  window.btnT = re => [...$('talkBody').querySelectorAll('button')].find(x => re.test(x.textContent)); });
await p.waitForTimeout(600);
let fehl = 0;
const T = async (name, fn, ok, arg) => { let r; try { r = await p.evaluate(fn, arg); } catch (e) { r = 'Fehler: ' + e.message.split('\n')[0]; } const gut = ok(r); if (!gut) fehl++; console.log((gut ? 'ok   ' : 'FEHL ') + name.padEnd(22), JSON.stringify(r)); return r; };
const shot = async n => { await p.waitForTimeout(700); await (await p.$('canvas')).screenshot({ path: OUT + n }); };
const panel = async n => { await p.waitForTimeout(300); try { await (await p.$('#ovTalk .panel')).screenshot({ path: OUT + n, timeout: 5000 }); } catch (e){ console.log('kein Bild ' + n); } };

// Ansehen: Preise, Lohn, Rangwechsel
await T('Ansehen und Preise', () => {
  const pr0 = rufPrice(100, 'staedte'), q0 = qReward({ lvl: 10, giver: 'buerger' }).gold;
  rufAdd('staedte', 55, 'Test'); rufAdd('kirche', -65, 'Test');
  return { v: HERO.ruf.staedte, rang: rufRang('staedte'), pr0, pr: rufPrice(100, 'staedte'), sell: rufSell(100), q0, q: qReward({ lvl: 10, giver: 'buerger' }).gold, vogt: qReward({ lvl: 10, giver: 'vogt' }).gold,
    kirche: rufRang('kirche'), segen: rrNoBless(), banner: $('bannerText') ? $('bannerText').textContent : '', log: [...document.querySelectorAll('#log p')].slice(-2).map(p => p.textContent).join(' | ') };
}, r => r.rang === 'Geehrt' && r.pr0 === 100 && r.pr === 90 && r.sell === 108 && r.q > r.q0 && r.vogt === r.q0 && r.kirche === 'Verachtet' && r.segen && /Ansehen bei der Kirche/.test(r.log));
await T('Auftrag bringt Ansehen', () => {
  const v0 = HERO.ruf.fuersten; HERO.quests.push({ id: 'kg', zone: 'obstgarten', need: 1, n: 1, lvl: 20, giver: 'vogt' });
  completeQuest(HERO.quests[HERO.quests.length - 1]); return { d: HERO.ruf.fuersten - v0 };
}, r => r.d === 1);
await T('Händler mit Rabatt', () => { closePanel(); const n = NPCS.find(q => q.shop && gZone(q.x, q.y).id === 'stadt'); goN(n.id); openTalk(n); renderTalk('buy');
  const row = $('talkBody').querySelector('.shoprow button'); return { txt: row.textContent, want: '1 für ' + rufPrice(4 + 2 * HERO.lvl, 'staedte'), raw: 4 + 2 * HERO.lvl }; },
  r => r.txt === r.want && +r.want.split(' ').pop() < r.raw);
// Diebstahl: gelingt, dann misslingt er
await T('Diebstahl gelingt', () => { const n = G.talk; renderTalk('main'); const b = btnT(/mitgehen/); if (!b) return 'kein Knopf'; const inv0 = HERO.inv.filter(Boolean).length, g0 = HERO.gold;
  window.__rrSteal = 1; b.click(); const b2 = btnT(/aus den Augen/); return { mehr: HERO.inv.filter(Boolean).length - inv0, gold: HERO.gold - g0, gesperrt: !!(b2 && b2.disabled), acht: rrWanted(), stolen: HERO.stolen }; },
  r => (r.mehr === 1 || r.gold > 0) && r.gesperrt && !r.acht && r.stolen === 1);
await T('Diebstahl erwischt', async () => { const n = G.talk; n.rrStole = 0; window.__rrSteal = 0; G.knight.x += 400; renderTalk('main'); const v0 = HERO.ruf.staedte; btnT(/mitgehen/).click();
  await new Promise(r => setTimeout(r, 100));
  return { acht: HERO.acht, d: HERO.ruf.staedte - v0, handel: !!btnT(/Handeln/), angry: rrAngry(n), text: $('talkText').textContent.slice(0, 30), talk: G.talk && G.talk.id }; },
  r => r.acht && r.acht.g === 18 + 20 * 5 && r.d === -8 && !r.handel && r.angry && /Haltet den Dieb/.test(r.text));
// Festnahme am Tor
await T('Festnahme am Tor', async () => { closePanel(); window.__rrSteal = null;
  await zurWache();
  return { talk: G.talk && G.talk.name, text: $('talkText').textContent.slice(0, 40), opts: [...$('talkBody').querySelectorAll('button')].map(b => b.textContent) }; },
  r => r.talk === 'Stadtwache' && /Halt, im Namen/.test(r.text) && r.opts.some(o => /Bußgeld zahlen/.test(o)) && r.opts.includes('Fliehen!'));
await panel('recht_wache.png');
await T('Bußgeld zahlen', () => { const g0 = HERO.gold, a = rrBounty(); btnT(/Bußgeld zahlen/).click(); return { bezahlt: g0 - HERO.gold, a, acht: HERO.acht, mode: G.mode }; },
  r => r.bezahlt === r.a && !r.acht && r.mode === 'play');
// Pranger
await T('Gericht: Pranger', async () => { rrCrime(40, 'Test'); await zurWache();
  btnT(/Gericht/).click(); const opts = [...$('talkBody').querySelectorAll('button')].map(b => b.textContent);
  btnT(/Pranger/).click(); const R = rrS(); await new Promise(r => setTimeout(r, 2500));
  const k = G.knight, k0 = [k.x, k.y]; keys.add('ArrowLeft'); await new Promise(r => setTimeout(r, 400)); keys.delete('ArrowLeft');
  return { opts, pr: !!R.pr, t: Math.round(R.pr.t), fest: k.x === k0[0] && Math.abs(k.x - gNear(2900, 2290).x) < 2, hits: R.pr.hits + R.pr.th.length, tr: $('tracker').textContent, pres: netPres().rr, talk: (talk(), G.mode) }; },
  r => r.opts.some(o => /Pranger/.test(o)) && r.opts.some(o => /Kerker/.test(o)) && r.pr && r.fest && r.t > 20 && /Am Pranger/.test(r.tr) && r.pres === 'p' && r.talk === 'play');
await shot('recht_pranger.png');
await T('Pranger verbüßt', async () => { const v0 = HERO.ruf.staedte; rrS().pr.t = .3; await new Promise(r => setTimeout(r, 800));
  const b = rrBuettelOf('stadt'), k = G.knight; return { pr: !!rrS().pr, acht: HERO.acht, haft: HERO.haft, d: HERO.ruf.staedte - v0, nah: Math.round(Math.hypot(k.x - b.x, k.y - b.y)) }; },
  r => !r.pr && !r.acht && !r.haft && r.d === 2 && r.nah < 60);
// Kerker: schließen öffnet ihn wieder, Bestechung, dann Ausbruch
await T('Kerker', async () => { rrCrime(120, 'Test'); await zurWache();
  btnT(/Gericht/).click(); btnT(/Kerker/).click(); const t0 = $('rrKerT') && $('rrKerT').textContent, nm = $('talkName').textContent;
  closePanel(); await new Promise(r => setTimeout(r, 300));
  return { nm, t0, wieder: G.talk && G.talk.id, haft: HERO.haft && HERO.haft.k, pres: netPres().rr }; },
  r => r.nm === 'Im Kerker' && /Noch \d+ Sekunden/.test(r.t0) && r.wieder === 'kerker' && r.haft === 'ker' && r.pres === 'k');
await panel('recht_kerker.png');
await T('Bestechen', () => { const g0 = HERO.gold, br = rrBribe(); btnT(/bestechen/).click(); return { br, bezahlt: g0 - HERO.gold, ker: !!rrS().ker, acht: HERO.acht }; },
  r => r.bezahlt === r.br && !r.ker && !r.acht);
await T('Ausbruch', async () => { rrCrime(60, 'Test'); rrJail('stadt'); btnT(/rütteln/).click(); await new Promise(r => setTimeout(r, 200));
  const K = rrS().ker, bar = !!$('rrMark'); for (let i = 0; i < 3; i++){ K.rut.ph = 0; rrRuetteln(); }
  const k = G.knight; return { bar, ker: !!rrS().ker, acht: rrBounty(), zone: gZone(k.x, k.y).id, mode: G.mode }; },
  r => r.bar && !r.ker && r.acht === 100 && r.zone === 'schlachtfeld' && r.mode === 'play');
// Flucht: entkommen, dann gefasst
await T('Flucht', async () => { await zurWache();
  btnT(/Fliehen/).click(); const R = rrS(), e = R.flee && R.flee.e; await new Promise(r => setTimeout(r, 700));
  const jagt = !!(e && e.rrChase && e.st === 'walk'); goW(2966, 2720); await new Promise(r => setTimeout(r, 400));
  return { jagt, flee: !!R.flee, acht: rrBounty(), chase: e && e.rrChase }; },
  r => r.jagt && !r.flee && r.acht === 135 && !r.chase);
await T('Gefasst', async () => { await zurWache();
  btnT(/Fliehen/).click(); const R = rrS(), e = R.flee.e; goW(2966, 2400); await new Promise(r => setTimeout(r, 1400)); e.x = G.knight.x + 10; e.y = G.knight.y; await new Promise(r => setTimeout(r, 300));
  const opts = [...$('talkBody').querySelectorAll('button')].map(b => b.textContent); closePanel(); await new Promise(r => setTimeout(r, 200));
  return { text: $('talkText').textContent.slice(0, 20), opts, nachZu: G.talk && G.talk.id, view: btnT(/Kerker/) ? 'gericht' : '' }; },
  r => !r.opts.includes('Fliehen!') && r.nachZu === 'stadtwache' && r.view === 'gericht');
await T('Selbst stellen', () => { closePanel(); rrS().halt = null; rrS().cool = nowS() + 60; const n = goN('buettel_s'); openTalk(n); const b = btnT(/Euch stellen/); if (!b) return 'kein Knopf';
  const fine = Math.round(rrBounty() * .75); b.click(); const g0 = HERO.gold; btnT(/Bußgeld zahlen/).click(); return { fine, bezahlt: g0 - HERO.gold, acht: HERO.acht }; },
  r => r.bezahlt === r.fine && !r.acht);
// Wilderei im Königsforst
await T('Wilderei', () => { closePanel(); goW(8300, 2920); G.zone = gZone(G.knight.x, G.knight.y).id; const v0 = HERO.ruf.fuersten; window.__rrSeen = 1;
  rrHunt({ k: 'hase' }); const nachHase = rrWanted(); rrHunt({ k: 'hirsch' }); const a = rrBounty();
  HERO.ruf.fuersten = 60; rrHunt({ k: 'hirsch' }); const mitRecht = rrBounty(); HERO.ruf.fuersten = v0 - 5; window.__rrSeen = null;
  return { zone: G.zone, nachHase, a, mitRecht, d: -5 }; },
  r => r.zone === 'reichswald' && !r.nachHase && r.a === 14 + 20 * 4 && r.mitRecht === r.a);
await p.evaluate(() => rrClear());
// Steckbriefe
await T('Steckbrief annehmen', () => { const n = goN('buettel_s'); openTalk(n); const mark = npcMark(n); btnT(/Steckbriefe/).click();
  const rows = [...$('talkBody').querySelectorAll('.shoprow b')].map(b => b.textContent); [...$('talkBody').querySelectorAll('.shoprow')].find(r => /Ott der Rossdieb/.test(r.textContent)).querySelector('button').click();
  return { mark, rows, stb: HERO.stb && HERO.stb.id, tr: $('tracker').textContent, ziel: rrTarget() && rrTarget().label }; },
  r => r.mark === '!' && r.rows.length === 5 && r.stb === 'rossdieb' && /Ott der Rossdieb/.test(r.tr) && r.ziel === 'Ott der Rossdieb');
await panel('recht_steckbriefe.png');
await T('Versteck', async () => { closePanel(); const S = HERO.stb, k = G.knight; k.x = S.x - 300; k.y = S.y; updateZone(true); G.mons.length = 0; await new Promise(r => setTimeout(r, 600));
  const o = G.mons.find(m => m.stb === 'rossdieb'); return { da: !!o, nm: o && o.nm, hp: o && o.max, normal: monHp('pluend', o ? o.lvl : 1), gesellen: G.mons.filter(m => m.stbH).length, zone: gZone(S.x, S.y).id }; },   // das Versteck liegt in der Flussaue
  r => r.da && r.nm === 'Ott der Rossdieb' && r.hp === r.normal * 4 && r.gesellen === 2 && r.zone === 'fluss');
await shot('recht_versteck.png');
await T('Gesuchter fällt', async () => { const o = G.mons.find(m => m.stb === 'rossdieb'); o.hp = 1; kill(o); await new Promise(r => setTimeout(r, 300));
  return { st: HERO.stb.st, tr: $('tracker').textContent, ziel: rrTarget().label }; }, r => r.st === 1 && /zum Büttel/.test(r.tr) && /Büttel/.test(r.ziel));
await T('Kopfgeld abholen', () => { const n = goN('buettel_n'); openTalk(n); const mark = npcMark(n), g0 = HERO.gold; btnT(/Kopfgeld abholen/).click();
  return { mark, gold: HERO.gold - g0, stb: HERO.stb, n: HERO.stbN, woche: HERO.stbW.d }; },
  r => r.mark === '?' && r.gold === 75 && !r.stb && r.n === 1 && r.woche.includes('rossdieb'));
// Die Fehde gegen Schwarzeck
await T('Fehde beginnt', () => { closePanel(); HERO.lvl = 24; refreshStats(); HERO.done.push('n6'); const n = goN('pirckheimer'); openTalk(n); const mark = npcMark(n);
  btnT(/Von Schwarzeck/).click(); btnT(/Fehdebrief/).click(); return { mark, F: HERO.fehde, tr: $('tracker').textContent }; },
  r => r.mark === '!' && r.F.st === 1 && /Schwarzecks Reisige 0 \/ 10/.test(r.tr));
await T('Reisige', () => { closePanel(); for (let i = 0; i < 10; i++){ const m = createMonster('reisiger', 100, 100, 22, null); m.zone = 'gailingen'; kill(m); } return HERO.fehde; }, r => r.st === 2 && r.n === 0);
await T('Überfälle', async () => { goW(8300, 2920); const R = rrS(), out = [];
  for (let j = 0; j < 3; j++){ R.fdT = 0; R.amb = null; await new Promise(r => setTimeout(r, 300)); const ms = G.mons.filter(m => m.fdA && m.fdA === (R.amb && R.amb.id)); out.push(ms.map(m => m.nm).join('+')); for (const m of ms){ m.hp = 1; kill(m); } }
  return { out, F: HERO.fehde, ziel: rrTarget() && rrTarget().label }; },
  r => r.out.length === 3 && /Schwarzecks Hauptmann/.test(r.out[0]) && r.F.st === 3 && r.ziel === 'Schwarzecks Lager');
await T('Schwarzecks Lager', async () => { const c = gNear(FD_CAMP[0], FD_CAMP[1]), k = G.knight; k.x = c.x - 200; k.y = c.y + 60; updateZone(true); G.mons.length = 0; await new Promise(r => setTimeout(r, 600));
  const a = G.mons.find(m => m.k === 'absberg'); return { da: !!a, nm: a && a.nm, art: !!artOf('absberg'), wachen: G.mons.filter(m => m.fdA === -1).length, hp: a && a.max }; },
  r => r.da && r.nm === 'Hans Thomas von Schwarzeck' && r.art && r.wachen === 3);
await shot('recht_absberg.png');
await T('Schwarzeck fällt', async () => { const a = G.mons.find(m => m.k === 'absberg'), k = G.knight; k.x = a.x - 80; k.y = a.y; engage(a); await new Promise(r => setTimeout(r, 1200)); const st = a.st; a.hp = 1; kill(a);
  await new Promise(r => setTimeout(r, 300)); return { st, F: HERO.fehde, hand: G.loot.some(l => l.it && l.it.u === 'absberg'), ziel: rrTarget().label }; },
  r => r.F.st === 4 && r.hand && r.ziel === 'Steinhauer');
await T('Fehde zu Ende', () => { const n = goN('pirckheimer'); openTalk(n); const v0 = HERO.ruf.fuersten; btnT(/Schwarzeck ist geschlagen/).click(); btnT(/Bund der Herren/).click();
  return { F: HERO.fehde, d: HERO.ruf.fuersten - v0, troph: TROPHY_BY.fehde.ok(HERO), tr: $('tracker').textContent }; },
  r => r.F.st === 5 && r.F.e === 'bund' && r.d === 10 && r.troph && !/Fehde:/.test(r.tr));
// Glaube
await T('Glaube: zu früh', () => { closePanel(); HERO.thesen = 0; const n = goN('melanchthon'); openTalk(n); btnT(/Bekenntnis annehmen/).click(); return $('talkText').textContent; }, r => /Thesen/.test(r));
await T('Goldbrunner Bekenntnis', () => { HERO.thesen = 1; HERO.ablass = true; const r0 = Object.assign({}, HERO.ruf), regen0 = heroStats(Object.assign({}, HERO, { eq: Object.assign({}, HERO.eq, { schild: makeItem('schild', 20, 2, { bib: true }) }) })).regen;
  renderTalk('main'); btnT(/Bekenntnis annehmen/).click(); btnT(/Ich bekenne/).click();
  const ch = NPCS.find(n => n.ablass); let abl = 'kein Ablassprediger'; if (ch){ const o = el('div'); chTalkOpts(ch, o); abl = [...o.querySelectorAll('button')].map(b => b.textContent + (b.disabled ? ' (aus)' : '')).join('|'); }
  return { g: HERO.glaube, dk: HERO.ruf.kirche - r0.kirche, ds: HERO.ruf.staedte - r0.staedte, ablass: HERO.ablass, abl, troph: TROPHY_BY.bekenntnis.ok(HERO) }; },
  r => r.g === 'neu' && r.dk === -15 && r.ds === 6 && !r.ablass && r.troph);
await T('Zurück zur alten Kirche', () => { HERO.ruf.kirche = 0; const r0 = Object.assign({}, HERO.ruf), n = goN('campeggio'); openTalk(n); btnT(/alten Kirche zurückkehren/).click(); btnT(/Ich bleibe/).click();
  chBless(CH_SEGEN); return { g: HERO.glaube, dk: HERO.ruf.kirche - r0.kirche, db: HERO.ruf.bauern - r0.bauern, segen: HERO.bless.t }; },
  r => r.g === 'alt' && r.dk === 5 && r.db === -5 && r.segen === 1800);
// Kirche, Feste, Ereignisse, Kriegszüge
await T('Weitere Quellen', () => { closePanel(); const v = () => Object.assign({}, HERO.ruf), a = v();
  rrChurch('kerze'); rrChurch('kerze'); rrEvent('brand'); rrKz(true); rrFest(FESTS.find(f => f.id === 'schuetzen')); rrFest(FESTS.find(f => f.id === 'mai'));
  const b = v(); return { kirche: b.kirche - a.kirche, staedte: b.staedte - a.staedte, fuersten: b.fuersten - a.fuersten, bauern: b.bauern - a.bauern }; },
  r => r.kirche === 1 && r.staedte === 7 && r.fuersten === 8 && r.bauern === 2);
// Lehensgeld beim Vogt
await T('Lehensgeld', () => { HERO.ruf.fuersten = 85; const n = goN('vogt'); openTalk(n); const b = btnT(/Lehensgeld abholen/); if (!b) return 'kein Knopf'; const g0 = HERO.gold, soll = 30 + HERO.lvl * 6; b.click(); return { g: HERO.gold - g0, soll, wieder: !!(btnT(/abgeholt/) && btnT(/abgeholt/).disabled) }; },
  r => r.g === r.soll && r.wieder);
// Auftragsbuch und Tafel
await T('Auftragsbuch', async () => { closePanel(); rrCrime(50, 'Diebstahl in der Königsstadt'); openQuests(); await new Promise(r => setTimeout(r, 200));
  const c = document.querySelector('.rufcard'); return { rows: c ? c.querySelectorAll('.rufrow').length : 0, txt: c ? c.textContent : '' }; },
  r => r.rows === 4 && /Verehrt/.test(r.txt) && /Gesucht: 50 Gulden/.test(r.txt) && /alten Glauben/.test(r.txt));
await (await p.$('#ovQuests .panel')).screenshot({ path: OUT + 'recht_ansehen.png' });
await T('Tafel', () => { closePanel(); return { ruf: $('rufList').children.length, recht: $('rechtList').children.length, beast: [...$('beasts').querySelectorAll('.what')].some(w => /Schwarzeck/.test(w.textContent)) }; }, r => r.ruf === 4 && r.recht === 7 && r.beast);
await zeigeTafel(p, '#rufList'); await p.waitForTimeout(400); await (await p.$('#ovNotes .panel')).screenshot({ path: OUT + 'recht_tafel.png' }); await schliesseTafel(p);
// Wegweiser: Gebiete in Weltpixeln
await T('Wegweiser', () => { HERO.stb = null; HERO.quests = [{ id: 'kg', zone: 'wald', need: 10, n: 0, lvl: 20, giver: 'vogt' }]; goN('vogt'); const st = window.stTarget; window.stTarget = () => null; const t = questTarget(), z = ZONE_BY_ID.wald; window.stTarget = st;
  return { t, ok: t.x === z.label.x * WS && gZone(t.x, t.y).id === 'wald' }; }, r => r.ok);
// Spielstand
await T('Spielstand', () => { HERO.stb = { id: 'kohlhase', st: 0, x: 1, y: 1 }; HERO.haft = { k: 'ker', t: 50, c: 'stadt' }; const h = JSON.parse(JSON.stringify(HERO)); h.ruf.kirche = 500; h.fehde.st = 9; cleanHero(h);
  return { ruf: h.ruf, acht: h.acht, haft: h.haft, stb: h.stb, glaube: h.glaube, fehde: h.fehde, stbN: h.stbN }; },
  r => r.ruf.kirche === 100 && r.acht.g === 50 && r.haft.k === 'ker' && r.stb.id === 'kohlhase' && r.stb.x > 100 && r.glaube === 'alt' && !r.fehde && r.stbN === 1);
await T('Haft nach dem Laden', async () => { const h = JSON.parse(JSON.stringify(HERO)); h.haft = { k: 'pr', t: 40, c: 'stadt' }; cleanHero(h); startGame(h); $('banner').hidden = true; await new Promise(r => setTimeout(r, 600));
  return { pr: !!(rrS().pr), t: rrS().pr && Math.round(rrS().pr.t) }; }, r => r.pr && r.t <= 40 && r.t > 30);
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
