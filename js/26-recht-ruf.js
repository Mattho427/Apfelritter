"use strict";
/* Der Apfelritter, Teil 26 von 28: Recht und Ruf: Ansehen bei Fürsten, Städten, Bauern und Kirche; Diebstahl, Wilderei, Kopfgeld,
   Stadtwachen, Gericht, Pranger und Kerker; Steckbriefe; die Fehde gegen Schwarzeck; die Glaubensentscheidung in Goldbrunn.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */

/* ============ Ansehen (Version 28) ============
   Vier Stände merken sich, was Ihr tut, von −100 bis 100. Das Ansehen ändert Preise und Lohn, bringt Vorrechte
   und spricht vor Gericht mit. */
const RUF = [
  { id: 'fuersten', n: 'Fürsten', bei: 'bei den Fürsten', d: 'König, Herzöge, Grafen und ihre Vögte', c: '#e8c860' },
  { id: 'staedte', n: 'Städte', bei: 'bei den Städten', d: 'Räte, Bürger und Händler der Königsstädte', c: '#9cc8ff' },
  { id: 'bauern', n: 'Bauern', bei: 'bei den Bauern', d: 'Dörfer, Höfe, Wirte, Fuhrleute und Bergknappen', c: '#9fe08a' },
  { id: 'kirche', n: 'Kirche', bei: 'bei der Kirche', d: 'Priester, Klöster und Bischöfe', c: '#e8dcbc' }
];
const RUF_BY = Object.fromEntries(RUF.map(r => [r.id, r]));
const RUF_RANG = ['Verachtet', 'Misstraut', 'Gleichgültig', 'Geachtet', 'Geehrt', 'Verehrt'];   // Stufe −2 bis 3
const rufVal = id => HERO && HERO.ruf ? HERO.ruf[id] || 0 : 0;
const rufLvOf = v => v <= -60 ? -2 : v <= -20 ? -1 : v < 20 ? 0 : v < 50 ? 1 : v < 80 ? 2 : 3;
const rufLv = id => rufLvOf(rufVal(id));
const rufRang = id => RUF_RANG[rufLv(id) + 2];
/* Wirkungen: Lohn je Auftraggeber, Preise bei Händlern, Wirten, Fuhrleuten und Priestern */
const RUF_GIVER = { vogt: 'fuersten', bergmeister: 'bauern' };   // alle anderen Auftraggeber sitzen im Rat einer Stadt
const rufOfGiver = g => RUF_GIVER[g] || 'staedte';
const rufLohn = giver => 1 + .06 * rufLv(rufOfGiver(giver));
const RUF_PREIS = { staedte: .05, bauern: .06, kirche: .08 };
const rufPrice = (p, id) => Math.max(1, Math.round(p * (1 - RUF_PREIS[id] * rufLv(id))));
const rufSell = v => Math.max(1, Math.round(v * (1 + .04 * rufLv('staedte'))));
const rufPct = v => (v > 0 ? '+' : '−') + Math.abs(Math.round(v * 100)) + ' %';
function rufEff(id, r){
  const L = [];
  if (id === 'fuersten'){ if (r) L.push('Lohn des Vogts ' + rufPct(.06 * r)); if (r >= 2) L.push('Jagdrecht in den Bannforsten'); if (r >= 3) L.push('Lehensgeld beim Vogt und ein Geleitbrief vor Gericht'); }
  if (id === 'staedte'){ if (r) L.push('Händler ' + rufPct(-.05 * r) + ' beim Kauf, ' + rufPct(.04 * r) + ' beim Verkauf', 'Lohn der Räte ' + rufPct(.06 * r)); if (r < 0) L.push('Händler und Wachen sind misstrauisch'); }
  if (id === 'bauern'){ if (r) L.push('Speis, Trank und Fuhrwerk ' + rufPct(-.06 * r), 'Lohn des Bergmeisters ' + rufPct(.06 * r)); }
  if (id === 'kirche'){ if (r) L.push('Segen und Ablass ' + rufPct(-.08 * r)); if (r >= 2) L.push('der Pfarrer spricht vor Gericht für Euch'); if (r <= -2) L.push('kein Priester segnet Euch mehr'); }
  return L.length ? L : ['keine Vor- und Nachteile'];
}
/* Ansehen ändern; key: höchstens einmal am Spieltag */
function rufAdd(id, n, why, key){
  if (!HERO || !n || !RUF_BY[id]) return 0;
  const R = HERO.ruf || (HERO.ruf = {});
  if (key){ const D = HERO.rufD || (HERO.rufD = {}), d = chDay(); if (D[key] === d) return 0; D[key] = d; const ks = Object.keys(D); if (ks.length > 24) delete D[ks[0]]; }
  const a = rufLv(id), v0 = R[id] || 0;
  R[id] = clamp(v0 + n, -100, 100);
  const dv = R[id] - v0; if (!dv) return 0;
  const b = rufLv(id), Rd = RUF_BY[id];
  logLine('Ansehen ' + Rd.bei + ' ' + (dv > 0 ? '+' : '−') + Math.abs(dv) + (why ? ' (' + why + ')' : '') + '.', dv > 0 ? '#bfe0a0' : '#ff9a8a');
  if (b !== a){
    showBanner(RUF_RANG[b + 2] + ' ' + Rd.bei, rufEff(id, b)[0]);
    if (b > a) Sound.bell(); else Sound.tone(220, .3, 'triangle', .04, -60);
  }
  markDirty(true);
  return dv;
}
const rufAll = (n, why) => { for (const r of RUF) rufAdd(r.id, n, why); };
/* Quellen: Aufträge, Feste, Weltereignisse, Kriegszüge, die Kirche (aus den anderen Teilen gerufen) */
function rrQuest(d){ rufAdd(rufOfGiver(d.giver), d.id === 'kg' ? 1 : d.boss ? 6 : 3, 'Auftrag'); }
const RUF_FEST = { advent: 'staedte', schuetzen: 'staedte', martini: 'staedte', fastnacht: 'staedte' };
function rrFest(f){ rufAdd(RUF_FEST[f.id] || 'bauern', 2, f.gameName, 'fest:' + f.id); }
const RUF_EV = { ueberfall: ['bauern', 5], pest: ['bauern', 4], brand: ['staedte', 5], jagd: ['kirche', 4], kaiser: ['fuersten', 6] };
function rrEvent(id){ const e = RUF_EV[id]; if (e) rufAdd(e[0], e[1], EV_DEFS.find(d => d.id === id).name); }
function rrKz(first){ rufAdd('fuersten', first ? 8 : 2, 'Kriegszug für den König'); }
function rrChurch(what){
  const E = { segen: [1, 'Spende für den Segen', 'segen'], messe: [2, 'Messe', 'messe'], beichte: [1, 'Beichte', 'beichte'], kerze: [1, 'Kerze gestiftet', 'kerze'], ablass: [3, 'Ablassbrief'], pilger: [12, 'Wallfahrt'] }[what];
  if (E) rufAdd('kirche', E[0], E[1], E[2]);
}
/* Segen: wer beim alten Glauben bleibt, ist länger gesegnet; die Verachteten segnet keiner */
const rrBlessT = t => HERO && HERO.glaube === 'alt' ? Math.round(t * 1.5) : t;
const rrNoBless = () => rufLv('kirche') <= -2;

/* ============ Recht: Diebstahl, Wilderei, Kopfgeld, Wachen, Gericht ============
   Wer erwischt wird, hat ein Kopfgeld am Hals. Die Wachen an den Toren und auf den Märkten halten jeden an, auf den eines
   ausgesetzt ist. Dann gibt es das Bußgeld, den Pranger, den Kerker, oder die Flucht. */
const BANNFORST = { reichswald: 'des Königs', schwarzwald: 'des Herzogs' };
const HOCHWILD = { hirsch: 'einen Hirsch', wildschwein: 'ein Wildschwein' };
const jagdrecht = () => rufLv('fuersten') >= 2;
/* Städte mit Wache und Gericht (Weltpixel): Pranger, draußen vor dem Tor, nach der Strafe; Burg und Bergstadt ohne Pranger */
const RR_CITY = {
  stadt: { n: 'der Königsstadt', judge: 'Schultheiß Konrad Imhof', pr: [2900, 2290], prop: true, out: [2966, 2720] },
  burg: { n: 'der Königsburg', judge: 'Vogt Heinrich', out: [1900, 960] },
  speyer: { n: 'Altmünster', judge: 'Schultheiß Jörg Hammer', pr: [5040, 1420], out: [5100, 1050] },
  annaberg: { n: 'Silberberg', judge: 'Bergrichter Hans Teufel', out: [2900, 3840] },
  wittenberg: { n: 'Schwanstedt', judge: 'Schultheiß Christian Beyer', pr: [7900, 560], out: [7950, 900] },
  nuernberg: { n: 'Burgfelden', judge: 'Schultheiß Hans Imhoff', pr: [7860, 2300], out: [7740, 2820] },
  augsburg: { n: 'Goldbrunn', judge: 'Stadtpfleger Ulrich Rehlinger', pr: [7380, 3790], out: [7430, 3300] }
};
const rrCityOf = z => RR_CITY[z] ? z : null;
const rrHere = () => gZone(G.knight.x, G.knight.y).id;   // sofort nach einem Sprung, G.zone folgt erst im nächsten Bild
const rrWanted = () => !!(HERO && HERO.acht && HERO.acht.g > 0);
const rrBounty = () => HERO && HERO.acht ? HERO.acht.g : 0;
function rrCrime(g, why){
  const A = HERO.acht || (HERO.acht = { g: 0, w: [] });
  A.g = Math.round(A.g + g); A.w = A.w.filter(x => x !== why).concat([why]).slice(-3);
  logLine('Kopfgeld auf Euch: ' + A.g + ' Gulden (' + why + '). Die Wachen in den Städten halten nach Euch Ausschau.', '#ff8a7a');
  Sound.tone(180, .4, 'square', .04, -40); renderTracker(); sendPresence(true); markDirty(true);
}
function rrClear(){ HERO.acht = null; renderTracker(); sendPresence(true); markDirty(true); }
/* Zustand dieser Sitzung */
function rrS(){
  if (!G.rr || G.rr.hero !== HERO) G.rr = { hero: HERO, cool: 0, halt: null, flee: null, pr: null, ker: null, z: '', amb: null, fdT: 60, out: null, abs: null, said: {}, resumed: false };
  return G.rr;
}
const rrBusy = () => !!(G && G.rr && (G.rr.pr || G.rr.ker || G.rr.halt));
/* Wachen in der Nähe (Leute aus den Lebensorten) */
function rrGuards(r){
  const k = G.knight, out = [];
  for (const s of LIFE_SPOTS) if (s.act) for (const e of s.ents) if (e.person && e.type === 'wache' && Math.abs(e.x - k.x) < r && Math.abs(e.y - k.y) < r && Math.hypot(e.x - k.x, e.y - k.y) < r) out.push(e);
  return out;
}

/* ---------- Diebstahl beim Händler ---------- */
const rrAngry = n => n.rrAngry && nowS() < n.rrAngry;
const rrWatch = n => n.rrStole && nowS() < n.rrStole;
const rrStealP = n => clamp(.62 - .14 * rrGuards(260).length - (n.rich ? .08 : 0) + .03 * rufLv('staedte'), .12, .8);
function rrSteal(n){
  if (!n.shop || rrAngry(n) || rrWatch(n)) return;
  const ok = Math.random() < (window.__rrSteal != null ? window.__rrSteal : rrStealP(n)), k = G.knight;
  n.rrStole = nowS() + 300;
  if (ok){
    const j = HERO.inv.indexOf(null), st = n.stock && n.stock.length && j >= 0 ? n.stock.splice(Math.random() * n.stock.length | 0, 1)[0] : null;
    HERO.stolen = (HERO.stolen | 0) + 1;
    if (st){ HERO.inv[j] = st; logItem('Unbemerkt eingesteckt: ', st); }
    else { const g = Math.round(4 + HERO.lvl * 3 + rand(0, 6)); HERO.gold += g; logLine('Unbemerkt greift Ihr in die Kasse: ' + g + ' Gulden.', '#d8c69c'); }
    G.greet = pick(['Hm? Habt Ihr etwas gesagt, Herr Ritter?', 'Schönes Wetter heute, nicht wahr?', 'Ich hätte schwören können, da lag noch etwas …']);
    Sound.coin(); updateHud(); markDirty(true); renderTalk('main');
    return true;
  }
  n.rrAngry = nowS() + 600;
  G.greet = 'Haltet den Dieb! Wache! Wache! Mit Euch handle ich nicht mehr, Ihr Strauchdieb im Harnisch!';
  const z = rrHere(); rrCrime(18 + HERO.lvl * 5, 'Diebstahl ' + (RR_CITY[z] ? 'in ' + RR_CITY[z].n : 'beim Händler'));
  rufAdd('staedte', -8, 'beim Stehlen erwischt');
  G.shake = .15; Sound.hit();
  const near = rrGuards(420)[0];
  if (near){ closePanel(); rrArrest(near, 'Die Wache hat alles gesehen. '); }
  else renderTalk('main');
  return false;
}
/* ---------- Wilderei im Bannforst (aus huntKill) ---------- */
function rrHunt(e){
  const z = rrHere();
  if (!BANNFORST[z] || !HOCHWILD[e.k] || jagdrecht()) return;
  if (Math.random() >= (window.__rrSeen != null ? window.__rrSeen : .45)){ if (Math.random() < .3) logLine('Niemand hat Euch gesehen. Diesmal.', '#d8c69c'); return; }
  rrCrime(14 + HERO.lvl * 4, 'Wilderei im Bannforst ' + BANNFORST[z]);
  rufAdd('fuersten', -5, 'Wilderei');
  floatText(G.knight.x, G.knight.y - KS.ay - 24, 'Ein Förster hat Euch gesehen!', '#ff8a7a', 1, 2.2);
}

/* ---------- Festnahme ---------- */
const RR_WACHE = { id: 'stadtwache', key: 'stadtwache', name: 'Stadtwache', role: 'im Namen des Rates', rrWache: true, x: 0, y: 0 };
function rrArrest(e, pre){
  const R = rrS(), k = G.knight, c = rrCityOf(rrHere()) || (e && rrCityOf(gZone(e.x, e.y).id)) || (R.flee && R.flee.c) || 'stadt';
  if (R.halt || R.pr || R.ker || G.mode !== 'play') return;
  if (riding()) dismount(true);
  k.kbx = k.kby = 0;
  R.halt = { c, e, caught: !!(R.flee) }; R.flee = null; if (e) { e.rrChase = false; e.dir = VK_DIR(k.x - e.x, k.y - e.y); }
  RR_WACHE.art = RR_WACHE.art || NPC_ART.buettel; RR_WACHE.x = e ? e.x : k.x; RR_WACHE.y = e ? e.y : k.y;
  const A = HERO.acht;
  RR_WACHE.greet = [(pre || '') + (R.halt.caught ? 'Hab ich Euch! Jetzt geht es vor das Gericht, ob Ihr wollt oder nicht. ' : 'Halt, im Namen des Rates! ')
    + 'Auf Euren Kopf sind ' + A.g + ' Gulden ausgesetzt: ' + A.w.join(', ') + '. ' + (R.halt.caught ? '' : 'Zahlt das Bußgeld, oder ich bringe Euch vor ' + (c === 'burg' ? 'den Vogt' : 'das Gericht') + '.')];
  Sound.horn();
  openTalk(RR_WACHE);
}
function rrPay(full){
  const g = full ? rrBounty() : Math.round(rrBounty() * .75);
  if (HERO.gold < g) return false;
  HERO.gold -= g; Sound.coin();
  logLine('Ihr zahlt ' + g + ' Gulden Bußgeld. Das Kopfgeld ist getilgt.', '#ffd98a');
  rrRelease(false); rrClear(); updateHud();
  return true;
}
function rrRelease(move){
  const R = rrS(); R.halt = null; R.cool = nowS() + 25;
  if (move){ const c = RR_CITY[move] || RR_CITY.stadt, b = rrBuettelOf(move) || (move === 'burg' ? NPCS.find(n => n.id === 'vogt') : null), p = b ? { x: b.x, y: b.y + 34 } : gNear(c.out[0], c.out[1]); G.knight.x = p.x; G.knight.y = p.y; G.knight.dir = 'down'; updateZone(true); }
  if (G.mode === 'menu') closePanel();
}
/* Flucht: die Wache rennt hinterher; wer aus der Stadt kommt, ist fürs Erste frei */
function rrFlee(){
  const R = rrS(), H = R.halt; if (!H) return;
  R.halt = null;
  if (G.mode === 'menu') closePanel();
  const e = H.e && H.e.person ? H.e : rrGuards(400)[0];
  R.flee = { e, t: 0, c: H.c };
  if (e){ e.rrChase = true; e.say = pick(['Halt! Stehen bleiben!', 'Haltet ihn!', 'Im Namen des Rates, halt!']); e.sayUntil = nowS() + 3; }
  logLine('Ihr flieht! Verlasst ' + RR_CITY[H.c].n + ', bevor die Wache Euch packt.', '#ff8a7a');
  Sound.horn(); renderTracker();
}
function rrChase(e, dt){   // aus lifePerson
  const R = G.rr, k = G.knight;
  if (!R || !R.flee || R.flee.e !== e){ e.rrChase = false; e.st = 'idle'; return false; }
  const dx = k.x - e.x, dy = k.y - e.y, d = Math.hypot(dx, dy) || 1;
  if (!lifeMove(e, dx / d * 122, dy / d * 122, dt)) R.flee.stuck = (R.flee.stuck || 0) + dt; else R.flee.stuck = 0;
  e.dir = VK_DIR(dx, dy); e.st = 'walk'; e.anim += dt * 9;
  return true;
}
function rrFleeTick(dt){
  const R = rrS(), F = R.flee, k = G.knight;
  F.t += dt;
  const z = gZone(k.x, k.y).id, e = F.e;
  if (!isSafe(z) || F.t > 45 || (F.stuck || 0) > 4 || (e && Math.hypot(e.x - k.x, e.y - k.y) > 900)){
    R.flee = null; if (e){ e.rrChase = false; e.st = 'idle'; e.x = e.hx; e.y = e.hy; }
    const A = HERO.acht; if (A){ A.g = Math.round(A.g * 1.25 + 10); A.w = A.w.filter(x => x !== 'Flucht vor der Wache').concat(['Flucht vor der Wache']).slice(-3); }
    logLine('Ihr seid entkommen. Das Kopfgeld steigt auf ' + rrBounty() + ' Gulden.', '#ff8a7a');
    rufAdd('staedte', -3, 'Flucht vor der Wache'); renderTracker(); sendPresence(true); markDirty(true);
    return;
  }
  if (F.t > 1.2 && G.mode === 'play' && ((e && Math.hypot(e.x - k.x, e.y - k.y) < 26) || rrGuards(52).some(g => g !== e))) rrArrest(e, '');
}

/* ---------- Gericht: Bußgeld, Pranger, Kerker, Fürsprache, Geleitbrief ---------- */
const rrPrT = () => Math.round(30 + Math.min(30, rrBounty() / 10));
const rrKerT = () => Math.round(45 + Math.min(75, rrBounty() / 4));
const rrBribe = () => Math.ceil(rrBounty() * .6);
function rrPillory(c){
  const R = rrS(), C = RR_CITY[c]; if (!C || !C.pr) return;
  const p = gNear(C.pr[0], C.pr[1]), k = G.knight;
  R.halt = null; R.pr = { c, t: window.__rrT || rrPrT(), x: p.x, y: p.y, hits: 0, th: [], tT: 1.2, sayT: 2 };
  HERO.haft = { k: 'pr', t: R.pr.t, c };
  if (G.mode === 'menu') closePanel();
  if (riding()) dismount(true);
  k.x = p.x; k.y = p.y; k.dir = 'down';
  showBanner('Am Pranger', 'auf dem Markt ' + (c === 'stadt' ? 'der Königsstadt' : 'von ' + C.n));
  logLine('Ihr steht am Pranger. Die Leute auf dem Markt zeigen mit dem Finger auf Euch.', '#d8c69c');
  Sound.bell(); renderTracker(); sendPresence(true); markDirty(true);
}
function rrJail(c){
  const R = rrS();
  R.halt = null; R.ker = { c, t: window.__rrT || rrKerT(), rut: null, ok: 0 };
  HERO.haft = { k: 'ker', t: R.ker.t, c };
  if (riding()) dismount(true);
  logLine('Die Tür des Kerkers fällt hinter Euch ins Schloss.', '#d8c69c');
  Sound.anvil(); rrOpenJail(); renderTracker(); sendPresence(true); markDirty(true);
}
const RR_KERKER = { id: 'kerker', key: 'kerker', name: 'Im Kerker', role: 'Turm', rrKerker: true, x: 0, y: 0 };
function rrOpenJail(){
  const R = rrS(), C = RR_CITY[R.ker.c] || RR_CITY.stadt;
  RR_KERKER.art = RR_KERKER.art || { frames: [rrCellArt()] }; RR_KERKER.role = R.ker.c === 'burg' ? 'Burgverlies' : 'Turm ' + C.n.replace(/^der /, '');
  RR_KERKER.greet = ['Stroh, ein Wasserkrug und ein vergittertes Fenster hoch oben. Draußen ruft der Wächter die Stunde.'];
  if (G.mode === 'menu') closePanel();
  openTalk(RR_KERKER); renderTalk('rrKerker');
}
function rrFree(how){
  const R = rrS(), c = (R.pr || R.ker || {}).c || 'stadt';
  R.pr = null; R.ker = null; HERO.haft = null;
  if (how === 'flucht'){
    const C = RR_CITY[c], p = gNear(C.out[0], C.out[1]), k = G.knight;
    if (G.mode === 'menu') closePanel();
    k.x = p.x; k.y = p.y; k.dir = 'down'; updateZone(true); R.cool = nowS() + 8;
    const A = HERO.acht || (HERO.acht = { g: 0, w: [] }); A.g = Math.round(A.g * 1.5 + 10); A.w = A.w.filter(x => x !== 'Ausbruch aus dem Kerker').concat(['Ausbruch aus dem Kerker']).slice(-3);
    showBanner('Ausgebrochen', 'Das Kopfgeld steigt auf ' + A.g + ' Gulden');
    logLine('Ihr seid aus dem Kerker ausgebrochen und steht vor den Mauern ' + (c === 'speyer' || c === 'wittenberg' || c === 'nuernberg' || c === 'augsburg' || c === 'annaberg' ? 'von ' : '') + C.n + '.', '#ff8a7a');
    rufAdd('staedte', -5, 'Ausbruch'); renderTracker(); sendPresence(true); markDirty(true);
    return;
  }
  rrClear();
  if (how === 'pranger') rufAdd('staedte', 2, 'Strafe verbüßt');
  rrRelease(c);
  showBanner('Frei', how === 'bestochen' ? 'Der Wärter schaut weg' : 'Die Strafe ist verbüßt');
  logLine(how === 'bestochen' ? 'Der Wärter zählt die Gulden und schließt auf. Das Kopfgeld ist getilgt.' : 'Ihr habt Eure Strafe verbüßt. Das Kopfgeld ist getilgt.', '#9fe08a');
  Sound.bell(); renderTracker(); sendPresence(true); markDirty(true);
}
/* Pranger: festgehalten, faules Obst fliegt, die Leute lästern */
const RR_PR_SAY = ['Pfui, ein Dieb im Harnisch!', 'Schämt Euch, Herr Ritter!', 'Da, nimm das!', 'Ein feiner Ritter ist das!', 'Wer stiehlt, der steht.', 'Faule Eier für den Schelm!'];
const RR_FRUIT = [['#8a6a2a', '#c8a050'], ['#6a8a2a', '#a8c050'], ['#9a2a1a', '#d84a3a'], ['#e8e0c0', '#fff8e0']];
function rrPrTick(dt){
  const R = rrS(), P = R.pr, k = G.knight;
  k.x = P.x; k.y = P.y; k.dir = 'down'; k.moving = false; k.kbx = k.kby = 0; G.near = null;
  if (G.mode === 'play'){ P.t -= dt; HERO.haft.t = P.t; }
  P.tT -= dt; P.sayT -= dt;
  if (P.tT <= 0 && !RM){
    P.tT = rand(.7, 1.8);
    const a = rand(-2.6, -.5), d = rand(150, 240), f = pick(RR_FRUIT);
    P.th.push({ x: k.x + Math.cos(a) * d * (Math.random() < .5 ? -1 : 1), y: k.y + Math.sin(a) * d * .4 + 30, t: 0, c: f });
  }
  for (let i = P.th.length - 1; i >= 0; i--){
    const f = P.th[i]; f.t += dt / .7;
    if (f.t >= 1){
      P.th.splice(i, 1); P.hits++;
      for (let j = 0; j < 8; j++) G.parts.push({ x: k.x + rand(-6, 6), y: k.y - 40 + rand(-6, 6), vx: rand(-50, 50), vy: rand(-50, 10), life: .5, c: f.c[j % 2], g: 200 });
      Sound.splat();
      if (P.hits % 4 === 1) floatText(k.x, k.y - KS.ay - 14, pick(['Platsch!', 'Pfui!', 'Matsch!']), '#d8c69c');
    }
  }
  if (P.sayT <= 0){
    P.sayT = rand(2.5, 4.5);
    const L = []; for (const s of LIFE_SPOTS) if (s.act) for (const e of s.ents) if (e.person && e.type !== 'wache' && Math.hypot(e.x - k.x, e.y - k.y) < 320) L.push(e);
    const e = L.length ? pick(L) : null; if (e){ e.say = pick(RR_PR_SAY); e.sayUntil = nowS() + 3; }
  }
  if (P.t <= 0) rrFree('pranger');
}
function rrPrDraw(){
  const P = G.rr && G.rr.pr; if (!P) return;
  for (const f of P.th){
    const k = G.knight, x0 = f.x, y0 = f.y - 30, x = x0 + (k.x - x0) * f.t, y = y0 + (k.y - 40 - y0) * f.t - Math.sin(f.t * Math.PI) * 50;
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
    ctx.fillStyle = f.c[0]; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); ctx.fillStyle = f.c[1]; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 2, 2);
  }
}
/* Kerker: warten, bestechen oder am Gitter rütteln, bis es nachgibt */
function rrCellArt(){
  const c = canvasOf(40, 52), g = c.getContext('2d');
  g.fillStyle = '#2a2622'; g.fillRect(0, 0, 40, 52);
  for (let y = 0; y < 52; y += 6) for (let x = (y / 6 % 2) * 5; x < 40; x += 10){ g.fillStyle = (x * 7 + y * 3) % 5 ? '#4a443c' : '#3e3a34'; g.fillRect(x, y, 9, 5); }
  g.fillStyle = '#16120f'; g.fillRect(12, 8, 16, 14); g.fillStyle = '#7a9ac0'; g.fillRect(13, 9, 14, 12); g.fillStyle = '#a8c4e0'; g.fillRect(13, 9, 14, 4);
  g.fillStyle = '#2a2a30'; for (const x of [16, 20, 24]) g.fillRect(x, 9, 2, 12); g.fillRect(13, 14, 14, 1);
  g.fillStyle = '#7a6a30'; g.fillRect(0, 44, 40, 8); g.fillStyle = '#a8904a'; for (let x = 1; x < 40; x += 3) g.fillRect(x, 43 + (x % 2), 2, 2);
  g.fillStyle = '#5a4a3a'; g.fillRect(30, 36, 6, 8); g.fillStyle = '#7a6a54'; g.fillRect(31, 37, 4, 2);
  return c;
}
function rrKerTick(dt){
  const R = rrS(), K = R.ker;
  K.t -= dt; HERO.haft.t = K.t;
  if (!G.talk || !G.talk.rrKerker){ if (G.mode === 'play') rrOpenJail(); return; }
  if (K.rut){ K.rut.ph += dt * (2.2 + K.ok * .5); const m = $('rrMark'); if (m) m.style.left = (50 + Math.sin(K.rut.ph) * 46) + '%'; }
  const tt = $('rrKerT'); if (tt) tt.textContent = 'Noch ' + Math.max(0, Math.ceil(K.t)) + ' Sekunden.';
  if (K.t <= 0) rrFree('verbüßt');
}
function rrRuetteln(){
  const K = rrS().ker; if (!K || !K.rut) return;
  const pos = 50 + Math.sin(K.rut.ph) * 46, w = 15 - K.ok * 3;
  if (Math.abs(pos - 50) < w / 2 + 2){ K.ok++; Sound.anvil(); if (K.ok >= 3) return rrFree('flucht'); renderTalk('rrKerker'); $('talkText').textContent = ['', 'Ein Stab im Gitter wackelt.', 'Der Mörtel bröckelt. Noch einmal!'][K.ok]; }
  else { K.t += 10; K.ok = Math.max(0, K.ok - 1); Sound.tone(200, .25, 'triangle', .04, -60); renderTalk('rrKerker'); $('talkText').textContent = 'Der Wärter brüllt durch die Tür: „Ruhe da drinnen!“ Die Strafe dauert zehn Sekunden länger.'; }
}

/* ============ Steckbriefe: gesuchte Räuber ============
   Die Büttel in den Städten zahlen für Räuber, Mordbrenner und Falschmünzer. Jeder Gesuchte hat ein Versteck in einem Gebiet,
   dort wartet er mit zwei Spießgesellen. Jede Woche lässt sich jeder einmal stellen. */
const STB = [
  { id: 'rossdieb', nm: 'Ott der Rossdieb', k: 'pluend', tint: 'bauer', zone: 'fluss', grp: 'bauern', city: 'stadt', crime: 'stiehlt Pferde von den Weiden der Flussaue' },
  { id: 'kelchdieb', nm: 'Lienhart Kelchdieb', k: 'pluend', tint: 'gold', zone: 'friedhof', grp: 'kirche', city: 'stadt', crime: 'hat die Kelche aus der Klosterkirche geraubt' },
  { id: 'falschmuenzer', nm: 'Mathes der Falschmünzer', k: 'armbrust', tint: 'bund', zone: 'lager', grp: 'staedte', city: 'stadt', crime: 'prägt falsche Pfennige im Landsknechtslager' },
  { id: 'schinder', nm: 'Barthel der Schinder', k: 'pluend', tint: 'fuersten', zone: 'wald', grp: 'bauern', city: 'stadt', crime: 'überfällt Köhler und Holzfäller im Finsterwald' },
  { id: 'brandstifter', nm: 'Jörg Brandstifter', k: 'pluend', tint: 'bund', zone: 'schlachtfeld', grp: 'bauern', city: 'stadt', crime: 'zündet Höfe an, wenn die Bauern nicht zahlen' },
  { id: 'weinraeuber', nm: 'Hensel Schlaukopf', k: 'pluend', tint: 'gold', zone: 'weinberge', grp: 'staedte', city: 'speyer', crime: 'raubt die Weinfuhren nach Altmünster' },
  { id: 'stockfisch', nm: 'Claus Stockfisch', k: 'pirat', tint: 'bauer', zone: 'auwald', grp: 'staedte', city: 'speyer', crime: 'lauert den Kähnen im Altarm auf' },
  { id: 'hackenbart', nm: 'Veit Hackenbart', k: 'wegelagerer', tint: 'fuersten', zone: 'schwarzwald', grp: 'bauern', city: 'annaberg', crime: 'plündert die Fuhren auf der Bergstraße' },
  { id: 'silberdieb', nm: 'Kunz Silberschmelzer', k: 'wegelagerer', tint: 'gold', zone: 'silberrevier', grp: 'fuersten', city: 'annaberg', crime: 'schmilzt gestohlenes Silber des Herzogs ein' },
  { id: 'fahnenflucht', nm: 'Wolf Fahnenflucht', k: 'doppelsoeldner', tint: 'bund', zone: 'schanze', grp: 'fuersten', city: 'annaberg', crime: 'ist mit der Soldkasse seines Fähnleins davon' },
  { id: 'kohlhase', nm: 'Hans Rosskamm', k: 'strauchdieb', tint: 'fuersten', zone: 'heide', grp: 'bauern', city: 'wittenberg', crime: 'führt Fehde gegen die ganze Nordmark, weil man ihm zwei Rappen nahm' },
  { id: 'moenchsschreck', nm: 'Nickel Mönchsschreck', k: 'strauchdieb', tint: 'gold', zone: 'heide', grp: 'kirche', city: 'wittenberg', crime: 'überfällt Mönche und Studenten auf dem Weg nach Schwanstedt' },
  { id: 'goldstrasse', nm: 'Kaspar vom Hohlweg', k: 'strauchdieb', tint: 'bund', zone: 'reichswald', grp: 'staedte', city: 'nuernberg', crime: 'lauert den Prager Kaufleuten auf der Goldenen Straße auf' },
  { id: 'ohneland', nm: 'Fritz Ohneland', k: 'reisiger', tint: 'bauer', zone: 'gailingen', grp: 'staedte', city: 'nuernberg', crime: 'reitet mit den Leuten Eppeleins und brandschatzt die Dörfer' },
  { id: 'schwarzsimon', nm: 'Simon der Schwarze', k: 'strauchdieb', tint: 'fuersten', zone: 'donauried', grp: 'staedte', city: 'augsburg', crime: 'raubt die Fuhren der Goldmanns im Ried' },
  { id: 'feuerkopf', nm: 'Michel Feuerkopf', k: 'hakenschuetze', tint: 'bund', zone: 'lechfeld', grp: 'bauern', city: 'augsburg', crime: 'schießt auf die Bauern, die das Geisterfeld bestellen' }
];
const STB_BY = Object.fromEntries(STB.map(s => [s.id, s]));
const stbLv = s => Math.min(MAX_LVL, ZONE_LV[s.zone][1] + 1);
const stbGold = s => Math.round((30 + stbLv(s) * 9) * (1 + .06 * rufLv(s.grp)));
const stbWeek = () => { const W = HERO.stbW; return W && W.w === orWeek() ? W.d : []; };
/* das Versteck: ein Lagerplatz im Gebiet, für jeden Gesuchten derselbe */
function stbHide(s){
  const L = SPAWN_SLOTS.filter(q => q.zone === s.zone && !q.boss);
  let h = 0; for (const ch of s.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const q = L.length ? L[h % L.length] : null;
  if (q) return { x: q.x, y: q.y };
  const z = ZONE_BY_ID[s.zone]; return { x: z.label.x * WS, y: z.label.y * WS };
}
function stbTake(s){
  if (HERO.stb || stbWeek().includes(s.id)) return;
  const h = stbHide(s);
  HERO.stb = { id: s.id, st: 0, x: h.x, y: h.y };
  Sound.choose(); logLine('Steckbrief: ' + s.nm + ', ' + s.crime + '. Sein Versteck liegt im Gebiet ' + ZONE_BY_ID[s.zone].name + '.', '#ecd27a');
  renderTracker(); markDirty(true);
}
function stbSpawn(s){
  const S = HERO.stb, L = stbLv(s);
  const p = gRandWalk(S.x, S.y, 0, 40) || S, m = createMonster(s.k, p.x, p.y, L, null);
  m.stb = s.id; m.nm = s.nm; m.art = stArt(s.k, s.tint); m.hx = S.x; m.hy = S.y; m.zone = s.zone; m.hp = m.max = monHp(s.k, L) * 4;
  for (let i = 0; i < 2; i++){
    const q = gRandWalk(S.x, S.y, 30, 110) || S, g = createMonster(pick(ZONE_MOBS[s.zone].filter(k => MENSCHEN[k]).concat([s.k])), q.x, q.y, Math.max(1, L - 1), null);
    g.stbH = s.id; g.nm = 'Spießgeselle'; g.hx = S.x; g.hy = S.y; g.zone = s.zone;
  }
  showBanner('Gesucht: ' + s.nm, 'Kopfgeld ' + stbGold(s) + ' Gulden');
  logLine(s.nm + ': „' + pick(['Ein Ritter? Hier holt Ihr Euch nur blaue Flecken!', 'Den Kopf wollt Ihr? Kommt und holt ihn!', 'Der Büttel schickt einen Blechmann? Packt ihn, Leute!']) + '“', '#ff9a8a');
  Sound.horn();
  return m;
}
function stbTurnIn(){
  const S = HERO.stb, s = S && STB_BY[S.id]; if (!s || S.st !== 1) return;
  const gold = stbGold(s), L = stbLv(s), xp = Math.round(xpNeed(Math.min(HERO.lvl, MAX_LVL - 1)) * .15);
  HERO.stb = null; HERO.gold += gold; HERO.stbN = (HERO.stbN | 0) + 1;
  const W = HERO.stbW && HERO.stbW.w === orWeek() ? HERO.stbW : (HERO.stbW = { w: orWeek(), d: [] }); W.d.push(s.id);
  const it = makeItem(pick(SLOTS), Math.min(MAX_LVL, L), Math.random() < .35 ? 3 : 2), j = HERO.inv.indexOf(null);
  if (j >= 0) HERO.inv[j] = it; else dropLoot(G.knight, 'item', 0, it);
  showBanner('Kopfgeld für ' + s.nm, gold + ' Gulden und ' + itemName(it));
  logLine('Der Büttel zahlt Euch ' + gold + ' Gulden Kopfgeld für ' + s.nm + '.', '#ffd98a'); logItem('Dazu: ', it);
  if (HERO.lvl < MAX_LVL) gainXp(xp);
  rufAdd(s.grp, 5, 'Gesuchter gestellt'); if (s.grp !== 'staedte') rufAdd('staedte', 1, 'Gesuchter gestellt');
  Sound.quest(); renderTracker(); updateHud(); pushFame(); markDirty(true);
}
function stbTick(){
  const S = HERO.stb; if (!S || S.st !== 0 || G.inside || DG_ON) return;
  const s = STB_BY[S.id]; if (!s){ HERO.stb = null; return; }
  const k = G.knight, d = Math.hypot(k.x - S.x, k.y - S.y);
  if (d < 640 && G.mode === 'play' && !G.mons.some(m => m.stb === s.id)) stbSpawn(s);
}

/* ============ Die Fehde gegen Hans Thomas von Schwarzeck ============
   Der Raubritter aus der Mittelmark überfällt seit Jahren Burgfeldener Kaufleute. Vor zwei Jahren brach der Bund der Herren dreiundzwanzig Burgen
   seiner Freunde, ihn selbst fing er nie. Ratsherr Steinhauer bittet um Hilfe: erst seine Reisigen, dann seine Überfälle, dann er selbst. */
MON.absberg = { name: 'Hans Thomas von Schwarzeck', hp: 30, dmg: 2.5, xp: 12, spd: 60, r: 16, hr: 18 };
AI_KIND.absberg = 'raubritter'; MENSCHEN.absberg = 1;
DEATH_COLORS.absberg = ['#1a1c20', '#c4cad0', '#a8241e', '#6e767e'];
mo_lazy(MON_ART, 'absberg', () => Object.assign(mo_riderSet(mo_horseSpec(mo_RAPPE, 1.25, '#2a1a0a'), { C: {
  skn: mo_LK.skn, gar: mo_mat('#121316', '#24262a', '#3a3e44', '#5a6068', '#848c94', '#b0b8c0'), tri: mo_mat('#6a6a64', '#9a9a92', '#c4c4bc', '#e6e6de'),
  lea: mo_LK.lea, boo: mo_mat('#121316', '#24262a', '#3a3e44', '#5a6068'), hat: mo_LK.stl, hai: mo_LK.hai, stl: mo_LK.stl, wod: mo_LK.wod,
  clo: mo_mat('#0e0e10', '#1c1c20', '#2c2c32', '#3e3e46'), glv: mo_mat('#121316', '#24262a', '#3a3e44', '#5a6068'), str: mo_LK.lin, gld: mo_LK.och },
  hat: 'helm', plume: true, plumeC: mo_mat('#4a0e0e', '#7a1616', '#a8241e', '#c83a2a'), weapon: 'schwert', z: 1.25 }, 100, 92, 48, 88), { reach: 46 }));
UNIQUES.absberg = { s: 'kleinod', n: 'Schwarzecks Fehdehandschuh', aff: ['str', 'crit', 'hp'] };
const FD_NEED = [0, 10, 3];
const FD_CAMP = [8640, 2860];   // Schwarzecks Lager im Süden des Königsforsts (Weltpixel)
const FD_ZONES = { reichswald: 1, gailingen: 1 };
const fdLv = () => clamp(HERO.lvl + 1, 24, MAX_LVL);
const fdStep = () => HERO && HERO.fehde ? HERO.fehde.st : 0;
function fdStart(){
  HERO.fehde = { st: 1, n: 0 };
  logLine('Ihr nehmt den Fehdebrief Burgfeldens an Hans Thomas von Schwarzeck. Nach altem Recht ist die Fehde damit angesagt.', '#ecd27a');
  rufAdd('staedte', 3, 'Fehde für Burgfelden'); rufAdd('fuersten', -2, 'Fehde gegen einen Ritter');
  Sound.horn(); renderTracker(); markDirty(true);
}
function fdNext(){
  const F = HERO.fehde; F.st++; F.n = 0;
  const T = { 2: ['Schwarzecks Reisige sind geschlagen', 'Jetzt lauert er Euch selbst auf'], 3: ['Drei Überfälle abgewehrt', 'Schwarzeck sitzt in seinem Lager im Königsforst'], 4: ['Schwarzeck ist geschlagen', 'Bringt die Nachricht zu Ratsherr Steinhauer'] }[F.st];
  if (T){ showBanner(T[0], T[1]); logLine(T[0] + '. ' + T[1] + '.', '#ecd27a'); }
  Sound.quest(); renderTracker(); markDirty(true);
}
function fdAmbush(){
  const R = rrS(), k = G.knight, L = fdLv() - 1, id = Date.now() % 100000;
  R.amb = { id, n: 0, need: 4 };
  for (let i = 0; i < 4; i++){
    const p = gRandWalk(k.x, k.y, 230, 320) || { x: k.x + 240, y: k.y }, cap = i === 0;
    const m = createMonster(i === 3 ? 'armbrust' : 'reisiger', p.x, p.y, L, null);
    m.fdA = id; m.nm = cap ? 'Schwarzecks Hauptmann' : 'Schwarzecks Reisiger'; m.zone = G.zone; m.hx = p.x; m.hy = p.y;
    if (cap){ m.art = stArt('reisiger', 'fuersten'); m.hp = m.max = monHp('reisiger', L) * 3; }
    engage(m, true);
  }
  showBanner('Überfall!', 'Schwarzecks Reiter lauern Euch auf'); logLine('Schwarzecks Hauptmann: „Für Schwarzeck! Burgfeldener Pfeffersäcke und ihre Knechte!“', '#ff9a8a');
  Sound.horn(); G.flash = .2;
}
function fdTick(dt){
  const F = HERO.fehde, R = rrS(), k = G.knight; if (!F || G.inside || DG_ON || G.mode !== 'play') return;
  if (F.st === 2){
    if (R.amb && !G.mons.some(m => m.fdA === R.amb.id)){ R.amb = null; R.fdT = rand(25, 45); }
    if (!R.amb && FD_ZONES[G.zone] && (R.fdT -= dt) <= 0) fdAmbush();
  }
  if (F.st === 3){
    const c = gNear(FD_CAMP[0], FD_CAMP[1]), d = Math.hypot(k.x - c.x, k.y - c.y);
    if (d < 640 && !G.mons.some(m => m.k === 'absberg')){
      const L = fdLv(), a = createMonster('absberg', c.x + 40, c.y + 30, L, null);
      a.fd = true; a.nm = MON.absberg.name; a.hx = c.x; a.hy = c.y; a.zone = gZone(c.x, c.y).id; a.hp = a.max = Math.round(monHp('absberg', L) * 1.6);
      for (let i = 0; i < 3; i++){ const p = gRandWalk(c.x, c.y, 40, 140) || c, m = createMonster('reisiger', p.x, p.y, L - 1, null); m.fdA = -1; m.nm = 'Schwarzecks Reisiger'; m.hx = c.x; m.hy = c.y; m.zone = a.zone; }
      showBanner(MON.absberg.name, 'Stufe ' + L + ' · Raubritter'); logLine('Schwarzeck: „Ein Ritter im Sold der Krämer! Schämt Euch, Herr. Aber gut, Fehde ist Fehde.“', '#ff9a8a');
      Sound.horn(); G.flash = .3;
    }
  }
}
function fdEnd(how){
  const F = HERO.fehde; if (!F || F.st !== 4) return;
  F.st = 5; F.e = how;
  const gold = Math.round((180 + HERO.lvl * 18) * (how === 'urfehde' ? 2.2 : 1)), xp = Math.round(xpNeed(Math.min(HERO.lvl, MAX_LVL - 1)) * .3);
  HERO.gold += gold; if (HERO.lvl < MAX_LVL) gainXp(xp);
  if (how === 'bund'){ rufAdd('fuersten', 10, 'Schwarzeck dem Bund ausgeliefert'); rufAdd('staedte', 6, 'Schwarzeck gefangen'); }
  else { rufAdd('staedte', 8, 'Schwarzeck schwört Urfehde'); rufAdd('fuersten', -4, 'Schwarzeck freigelassen'); }
  showBanner('Die Fehde ist zu Ende', gold + ' Gulden' + (how === 'urfehde' ? ' Sühnegeld' : ' vom Rat'));
  logLine(how === 'bund' ? 'Der Bund der Herren holt Schwarzeck in Ketten ab. Burgfelden zahlt Euch ' + gold + ' Gulden.' : 'Schwarzeck schwört Urfehde: nie wieder Rache an Burgfelden. Er zahlt ' + gold + ' Gulden Sühne, und Ihr lasst ihn ziehen.', '#ffd98a');
  Sound.quest(); Sound.cheer(.8); renderTracker(); updateHud(); pushFame(); markDirty(true);
}

/* ---------- Monster aus Steckbrief und Fehde fallen (aus kill) ---------- */
function rrKill(m){
  if (!HERO) return;
  const S = HERO.stb, F = HERO.fehde;
  if (m.stb && S && S.id === m.stb && S.st === 0){
    S.st = 1; const s = STB_BY[S.id];
    showBanner(s.nm + ' ist gestellt', 'Zum Büttel, das Kopfgeld abholen'); logLine(s.nm + ' liegt im Staub. Jeder Büttel in den Städten zahlt das Kopfgeld.', '#ecd27a');
    renderTracker(); markDirty(true);
  }
  if (F && F.st === 1 && (m.fdA || (m.k === 'reisiger' && FD_ZONES[m.zone]))){ F.n++; if (F.n >= FD_NEED[1]) fdNext(); else { renderTracker(); markDirty(); } }
  const R = G.rr;
  if (F && F.st === 2 && R && R.amb && m.fdA === R.amb.id && ++R.amb.n >= R.amb.need){ R.amb = null; R.fdT = rand(30, 50); F.n++; if (F.n >= FD_NEED[2]) fdNext(); else { showBanner('Überfall abgewehrt', F.n + ' von ' + FD_NEED[2]); renderTracker(); markDirty(); } }
  if (m.fd && F && F.st === 3){
    const u = UNIQUES.absberg;   // die Fehde gibt es nur einmal, also auch den Handschuh
    dropLoot({ x: m.x, y: m.y }, 'item', 0, makeItem(u.s, Math.min(MAX_LVL, m.lvl + 1), 4, { name: u.n, aff: u.aff, u: 'absberg' }));
    for (let j = 0; j < 3; j++) dropLoot({ x: m.x, y: m.y }, 'gold', monGold(m.lvl) * 3);
    fdNext();
  }
}

/* ============ Glaube: das Goldbrunner Bekenntnis ============
   Auf dem Hoftag zu Goldbrunn legt Magister Philipp das Bekenntnis der neuen Lehre vor, der Legat Lorenzo fordert die
   Rückkehr zur alten Kirche. Wer die Thesen gelesen hat und Stufe 15 erreicht, entscheidet sich. Ein Wechsel kostet Ansehen. */
const GLAUBE = {
  alt: { n: 'beim alten Glauben', eff: 'Der Segen der Kirche hält 30 statt 20 Minuten. Kirche +10, Fürsten +4.', ruf: [['kirche', 10], ['fuersten', 4]] },
  neu: { n: 'beim Goldbrunner Bekenntnis', eff: 'Die Kleine Bibel stärkt mehr: schnellere Erholung, das Gebet heilt ein Viertel mehr. Kein Ablass mehr. Kirche −15, Städte +6, Bauern +6.', ruf: [['kirche', -15], ['staedte', 6], ['bauern', 6]] }
};
const glaubeOk = () => HERO.lvl >= 15 && !!HERO.thesen;
function glaubeWahl(id){
  if (!GLAUBE[id] || HERO.glaube === id || !glaubeOk()) return;
  const was = HERO.glaube;
  if (was) rufAll(-5, 'Wankelmut im Glauben');
  HERO.glaube = id;
  for (const [g, n] of GLAUBE[id].ruf) rufAdd(g, n, id === 'alt' ? 'treu zur alten Kirche' : 'Goldbrunner Bekenntnis');
  if (id === 'neu' && HERO.ablass){ HERO.ablass = false; logLine('Euer Ablassbrief ist Euch nun nichts mehr wert.', '#d8c69c'); }
  showBanner(id === 'alt' ? 'Treu zur alten Kirche' : 'Das Goldbrunner Bekenntnis', GLAUBE[id].eff.split('. ')[0]);
  logLine('Ihr bekennt Euch ' + GLAUBE[id].n + '. ' + GLAUBE[id].eff, '#ffe9a0');
  burst(G.knight.x, G.knight.y - KBODY, ['#fff3c0', '#ecd27a', '#ffffff'], 24, 70, true); Sound.chime();
  refreshStats(); updateHud(); renderBuffs(); sendPresence(true); markDirty(true);
}

/* ============ Leute: Büttel in sechs Städten, Magister Philipp und Kardinal Lorenzo in Goldbrunn ============ */
NPC_ART.buettel = np_frames({ robe: 'short', hat: 'filz', parti: true, belt: true, beard: true, halberd: true, hair: ['h', 'j'] },
  { 1: '#1a1c22', 2: '#2a2e36', 3: '#3c424c', 4: '#545c68', 5: '#6a1414', 6: '#9a2420', 7: '#c03a2c', 8: '#de5a44', R: '#e0c040' });
NPC_ART.melanchthon = np_frames({ robe: 'long', hat: 'barett', fur: true, belt: true, beard: true, hair: ['h', 'j'] },
  { 1: '#141216', 2: '#1e1c22', 3: '#2c2830', 4: '#3c3642', 5: '#3a2c20', 6: '#52402c', 7: '#6a543a', 8: '#82684a' });
NPC_ART.campeggio = np_frames({ robe: 'long', hat: 'haube', chain: true, belt: true },
  { 1: '#4a0a0e', 2: '#6e1218', 3: '#961c22', 4: '#b8282c', 5: '#5a0c10', 6: '#7e141a', 7: '#a41e24', 8: '#c82a2e' });
const RR_NPC = [
  { id: 'buettel_s', name: 'Büttel Lorenz', city: 'stadt', at: gNear(2826, 2246) },
  { id: 'buettel_sp', name: 'Büttel Dietrich', city: 'speyer', at: gNear(4930, 1458) },
  { id: 'buettel_an', name: 'Bergbüttel Matthes', city: 'annaberg', at: gNear(2756, 3640) },
  { id: 'buettel_w', name: 'Büttel Andreas', city: 'wittenberg', at: gNear(7586, 612) },
  { id: 'buettel_n', name: 'Büttel Jakob Löffelholz', city: 'nuernberg', at: gNear(7604, 2342) },
  { id: 'buettel_a', name: 'Büttel Sebastian', city: 'augsburg', at: gNear(7566, 3846) }
];
for (const n of RR_NPC){ Object.assign(n, { role: 'Steckbriefe und Gericht', hub: n.city, art: 'buettel', buettel: true,
  greet: ['Steckbriefe, frisch gesiegelt! Wer einen Räuber stellt, bekommt das Kopfgeld vom Rat.', 'Wer stiehlt oder im Bannforst wildert, dem sitzt bald die Wache im Nacken. Und dann kommt er zu mir.', 'Der Pranger steht nicht zum Schmuck auf dem Markt, Herr Ritter.'] }); }
RR_NPC.push(
  { id: 'melanchthon', name: 'Magister Philipp', role: 'Das Goldbrunner Bekenntnis', hub: 'augsburg', at: gNear(7290, 3700), glaube: 'neu',
    greet: ['Auf diesem Hoftag legen wir dem König unser Bekenntnis vor: achtundzwanzig Artikel, was wir glauben und warum.', 'Bruder Elias darf nicht nach Goldbrunn kommen, er ist in der Acht. So rede ich für uns alle, so sanft ich kann.', 'Der Mensch wird gerecht durch den Glauben, nicht durch Werke und schon gar nicht durch gekaufte Briefe.'] },
  { id: 'campeggio', name: 'Kardinal Lorenzo', role: 'Legat des Heiligen Vaters', hub: 'augsburg', at: gNear(7400, 3744), glaube: 'alt',
    greet: ['Seine Heiligkeit hat mich über die Berge geschickt, damit dieses Königreich in den Schoß der Kirche zurückfindet.', 'Ein Bekenntnis! Als ob man die Lehre vieler Jahrhunderte mit achtundzwanzig Artikeln umstoßen könnte.', 'Der König steht zur Kirche, Herr Ritter. Wer klug ist, tut es ihm gleich.'] });
for (const n of RR_NPC){ n.x = n.at.x; n.y = n.at.y; n.art = NPC_ART[n.art || n.id]; n.key = n.id; NPCS.push(n); }
const rrBuettelOf = c => NPCS.find(n => n.buettel && n.city === c);
/* Wachen auf Streife über die Märkte */
(() => {
  const add = o => { o.ents = []; o.act = false; o.cool = 0; LIFE_SPOTS.push(o); };
  for (const [x, y, r] of [[2980, 2300, 160], [5060, 1420, 140], [2920, 3600, 120], [7950, 560, 140], [7800, 2300, 170], [7430, 3790, 150], [1910, 520, 140]])
    add({ p: 'walk', t: ['wache'], ...gPt({ x, y }), r: r * WS, n: [1, 1] });
})();

/* ============ Gespräche ============ */
function rrTalkOpts(n, opts){
  const S = HERO.stb, F = HERO.fehde;
  if (n.shop && !n.rrWache){
    if (rrAngry(n)) opts.append(el('p', 'hint', 'Der Händler dreht Euch den Rücken zu. Mit Dieben handelt er nicht.'));
    else { const p = rrStealP(n), b = btn(rrWatch(n) ? 'Der Händler lässt Euch nicht aus den Augen' : 'Etwas mitgehen lassen (Diebstahl, etwa ' + Math.round(p * 10) * 10 + ' %)', () => rrSteal(n), 'opt'); b.disabled = rrWatch(n); opts.append(b); }
  }
  if (n.rrWache){
    const H = rrS().halt, g = rrBounty(), pay = btn('Das Bußgeld zahlen (' + g + ' Gulden)', () => rrPay(true), 'opt');
    pay.disabled = HERO.gold < g || !!(H && H.caught);
    opts.append(pay, btn('Vor ' + (H && H.c === 'burg' ? 'den Vogt' : 'das Gericht') + ' treten', () => renderTalk('rrGericht'), 'opt'));
    if (!(H && H.caught)) opts.append(btn('Fliehen!', rrFlee, 'opt'));
  }
  if (n.buettel){
    if (S && S.st === 1) opts.append(btn('Kopfgeld abholen: ' + STB_BY[S.id].nm, () => { stbTurnIn(); renderTalk('main'); }, 'opt ready'));
    opts.append(btn('Steckbriefe ansehen' + (S ? '' : ' (' + STB.filter(s => s.city === n.city && !stbWeek().includes(s.id)).length + ')'), () => renderTalk('rrStb'), 'opt' + (!S && STB.some(s => s.city === n.city && !stbWeek().includes(s.id)) ? ' new' : '')));
    if (rrWanted()) opts.append(btn('Euch stellen (Bußgeld ' + Math.round(rrBounty() * .75) + ' Gulden, ein Viertel erlassen)', () => renderTalk('rrStellen'), 'opt'));
    opts.append(btn('Was ist verboten?', () => renderTalk('rrRecht'), 'opt'));
  }
  if (n.id === 'pirckheimer'){
    if (!F && HERO.lvl >= 22 && HERO.done.includes('n6')) opts.append(btn('Von Schwarzeck hören (Fehde, ab Stufe 22)', () => renderTalk('rrFehde'), 'opt new'));
    else if (F && F.st === 4) opts.append(btn('Schwarzeck ist geschlagen', () => renderTalk('rrFehdeEnde'), 'opt ready'));
    else if (F && F.st < 4) opts.append(btn('Wie steht die Fehde?', () => renderTalk('rrFehde'), 'opt'));
  }
  if (n.id === 'vogt' && rufLv('fuersten') >= 3){
    const has = HERO.lehen === chDay(), g = 30 + HERO.lvl * 6, b = btn(has ? 'Das Lehensgeld für heute ist abgeholt' : 'Lehensgeld abholen (' + g + ' Gulden)', () => { HERO.lehen = chDay(); HERO.gold += g; Sound.coin(); logLine('Der Vogt zahlt Euch ' + g + ' Gulden Lehensgeld.', '#ffd98a'); updateHud(); markDirty(true); renderTalk('main'); }, 'opt');
    b.disabled = has; opts.append(b);
  }
  if (n.glaube){
    const cur = HERO.glaube === n.glaube;
    opts.append(btn(cur ? (n.glaube === 'alt' ? 'Ihr steht zur alten Kirche' : 'Ihr steht zum Bekenntnis') : n.glaube === 'alt' ? (HERO.glaube ? 'Zur alten Kirche zurückkehren' : 'Beim alten Glauben bleiben') : 'Das Goldbrunner Bekenntnis annehmen', () => renderTalk('rrGlaube'), 'opt' + (!HERO.glaube && glaubeOk() ? ' new' : '')));
  }
}
function rrView(view, body, opts){
  const n = G.talk, say = t => { $('talkText').textContent = t; }, back = (v) => { opts.append(btn('Zurück', () => renderTalk(v || 'main'), 'tbtn')); body.append(opts); };
  const R = rrS();
  if (view === 'rrGericht' || view === 'rrStellen'){
    const c = (R.halt && R.halt.c) || (n && n.city) || rrCityOf(G.zone) || 'stadt', C = RR_CITY[c], g = rrBounty();
    if (!g){ say('Gegen Euch liegt nichts vor, Herr Ritter.'); return back(); }
    if (view === 'rrStellen'){ R.halt = { c, e: null, self: true }; }
    const red = R.halt && R.halt.self, fine = red ? Math.round(g * .75) : g;
    say(C.judge + ' blickt von seinem Buch auf: „' + (red ? 'Ihr stellt Euch selbst? Das rechne ich Euch an. ' : '') + 'Ihr schuldet ' + fine + ' Gulden für ' + HERO.acht.w.join(', ') + '. Zahlt, oder nehmt Eure Strafe.“');
    const pay = btn('Das Bußgeld zahlen (' + fine + ' Gulden)', () => rrPay(!red), 'opt'); pay.disabled = HERO.gold < fine; opts.append(pay);
    if (C.pr) opts.append(btn('Am Pranger stehen (' + rrPrT() + ' Sekunden)', () => rrPillory(c), 'opt'));
    opts.append(btn('In den Kerker (' + rrKerT() + ' Sekunden)', () => rrJail(c), 'opt'));
    if (rufLv('kirche') >= 2 && HERO.fuers !== chDay()) opts.append(btn('Den Pfarrer um Fürsprache bitten (Kopfgeld halbieren)', () => { HERO.fuers = chDay(); HERO.acht.g = Math.ceil(HERO.acht.g / 2); logLine('Der Pfarrer spricht für Euch. Das Kopfgeld sinkt auf ' + HERO.acht.g + ' Gulden.', '#ffe9a0'); markDirty(true); renderTalk(view === 'rrStellen' ? 'rrGericht' : view); }, 'opt'));
    if (rufLv('fuersten') >= 3 && HERO.geleit !== orWeek()) opts.append(btn('Den Geleitbrief Eures Lehnsherrn vorzeigen (frei)', () => { HERO.geleit = orWeek(); logLine('Der Geleitbrief des Fürsten wiegt mehr als jedes Kopfgeld. Ihr seid frei.', '#ffd98a'); rrRelease(false); rrClear(); }, 'opt'));
    if (!R.halt || R.halt.self) return back(R.halt && R.halt.self ? 'main' : undefined);
    body.append(opts); return;
  }
  if (view === 'rrKerker'){
    const K = R.ker; if (!K){ closePanel(); return; }
    say(K.rut ? 'Drückt „Rütteln“, wenn der Strich im hellen Feld steht. Dreimal, dann gibt das Gitter nach. Daneben hört Euch der Wärter.' : 'Ihr sitzt im Kerker. Die Zeit vergeht, oder Ihr helft ihr nach.');
    const t = el('p', 'hint'); t.id = 'rrKerT'; t.textContent = 'Noch ' + Math.ceil(K.t) + ' Sekunden.'; body.append(t);
    if (K.rut){
      const bar = el('div', 'rrbar'), z = el('span', 'rrzone'), m = el('span', 'rrmark'); m.id = 'rrMark';
      z.style.width = (15 - K.ok * 3) + '%'; z.style.left = (50 - (15 - K.ok * 3) / 2) + '%'; bar.append(z, m); body.append(bar);
      opts.append(btn('Rütteln!', rrRuetteln, 'opt'), btn('Lieber stillhalten', () => { K.rut = null; renderTalk('rrKerker'); }, 'opt'));
    } else {
      const b = rrBribe(), bb = btn('Den Wärter bestechen (' + b + ' Gulden)', () => { if (HERO.gold < b) return; HERO.gold -= b; Sound.coin(); updateHud(); rrFree('bestochen'); }, 'opt'); bb.disabled = HERO.gold < b;
      opts.append(btn('Warten', () => { say(pick(['Ihr zählt die Steine in der Wand. Es sind viele.', 'Eine Ratte schaut vorbei und geht wieder.', 'Draußen läutet eine Glocke.'])); }, 'opt'), bb,
        btn('Am Gitter rütteln (Ausbruch)', () => { K.rut = { ph: 0 }; renderTalk('rrKerker'); }, 'opt'));
    }
    body.append(opts); return;
  }
  if (view === 'rrStb'){
    const S = HERO.stb, done = stbWeek();
    say(S ? 'Ihr jagt schon ' + STB_BY[S.id].nm + '. Bringt den erst zur Strecke.' : 'Für diese Gesuchten zahlt der Rat ' + (/^der /.test(RR_CITY[n.city].n) ? RR_CITY[n.city].n : 'von ' + RR_CITY[n.city].n) + '. Jeder lässt sich einmal in der Woche stellen, das Kopfgeld zahlt jeder Büttel.');
    for (const s of STB.filter(q => q.city === n.city)){
      const r = el('div', 'shoprow'), im = el('img'); lazySrc(im, () => urlOf(stArt(s.k, s.tint).idle.r[0].img, 1)); im.alt = ''; im.className = 'horseimg';
      const t = el('div', 'stx'); t.append(el('b', null, s.nm), el('small', null, s.crime[0].toUpperCase() + s.crime.slice(1) + '. Versteck im Gebiet ' + ZONE_BY_ID[s.zone].name + ', Stufe ' + stbLv(s) + '. Kopfgeld ' + stbGold(s) + ' Gulden, Ansehen ' + RUF_BY[s.grp].bei + '.'));
      const mine = S && S.id === s.id, wk = done.includes(s.id);
      const b = btn(mine ? (S.st ? 'Gestellt' : 'Ihr jagt ihn') : wk ? 'Diese Woche gestellt' : 'Annehmen', () => { stbTake(s); renderTalk('rrStb'); }, 'tbtn');
      b.disabled = !!S || wk; r.append(im, t, b); body.append(r);
    }
    if (S && S.st === 0) opts.append(btn('Den Steckbrief zurückgeben', () => { HERO.stb = null; for (const m of G.mons.slice()) if (m.stb || m.stbH) G.mons.splice(G.mons.indexOf(m), 1); renderTracker(); markDirty(true); renderTalk('rrStb'); }, 'tbtn'));
    return back();
  }
  if (view === 'rrRecht'){
    say('Wer einem Händler etwas wegnimmt und erwischt wird, hat ein Kopfgeld am Hals. Ebenso, wer in den Bannforsten Hochwild schießt: im Königsforst und im Schwarztann gehören Hirsch und Sau dem Landesherrn. Die Wachen an den Toren und auf den Märkten halten jeden an, auf den ein Kopfgeld steht. Wer zahlt, ist frei. Wer nicht zahlen kann, steht am Pranger oder sitzt im Kerker. Wer flieht, dem wird es teurer.');
    if (rrWanted()) body.append(el('p', 'hint', 'Auf Euch sind ' + rrBounty() + ' Gulden ausgesetzt: ' + HERO.acht.w.join(', ') + '.'));
    return back();
  }
  if (view === 'rrFehde'){
    const F = HERO.fehde;
    if (!F){
      say('Hans Thomas von Schwarzeck, ein Ritter aus der Mittelmark, führt seit Jahren Fehde gegen Burgfelden. Er überfällt unsere Kaufleute, schlägt ihnen die Hände ab und verlangt Lösegeld. Vor zwei Jahren hat der Bund der Herren dreiundzwanzig Burgen seiner Freunde gebrochen, ihn selbst haben sie nie gefangen. Wollt Ihr dem Rat den Fehdebrief überbringen und die Sache zu Ende bringen?');
      opts.append(btn('Den Fehdebrief übernehmen', () => { fdStart(); renderTalk('rrFehde'); }, 'opt new'));
      return back();
    }
    say(['', 'Schwarzecks Reisige streifen im Königsforst und um Burg Rabeneck. Schlagt zehn von ihnen, dann muss er selbst aus seinem Loch.',
      'Schwarzeck weiß nun, wer Ihr seid. Seine Reiter werden Euch im Königsforst und bei Rabeneck auflauern. Wehrt drei Überfälle ab.',
      'Er hat sich im Süden des Königsforsts verschanzt, in einem Lager zwischen den Kiefern. Der goldene Pfeil zeigt Euch den Weg.',
      'Ihr habt ihn? Dann sagt mir, was mit ihm geschehen soll.', 'Die Fehde ist vorbei. Burgfelden dankt Euch.'][F.st] + (F.st < 3 ? ' (' + F.n + ' / ' + FD_NEED[F.st] + ')' : ''));
    return back();
  }
  if (view === 'rrFehdeEnde'){
    say('Schwarzeck liegt verwundet in Ketten. Der Bund der Herren will ihn haben und richten. Er selbst bietet Sühnegeld und schwört Urfehde, wenn Ihr ihn ziehen lasst. Was soll geschehen?');
    opts.append(btn('Dem Bund der Herren ausliefern (Fürsten +10, Städte +6)', () => { fdEnd('bund'); renderTalk('main'); }, 'opt'),
      btn('Urfehde schwören lassen, Sühnegeld nehmen (mehr Gulden, Städte +8, Fürsten −4)', () => { fdEnd('urfehde'); renderTalk('main'); }, 'opt'));
    return back();
  }
  if (view === 'rrGlaube'){
    const id = n.glaube, G0 = GLAUBE[id];
    if (!glaubeOk()){ say(HERO.thesen ? 'Kommt wieder, wenn Ihr mehr von der Welt gesehen habt (ab Stufe 15).' : 'Habt Ihr die Thesen an der Tür der Schlosskirche in Schwanstedt gelesen? Lest sie erst, dann reden wir.'); return back(); }
    if (HERO.glaube === id){ say(id === 'alt' ? 'Gott segne Euch, mein Sohn. Bleibt standhaft.' : 'Wir bleiben beim Wort, Herr Ritter. Das genügt.'); body.append(el('p', 'hint', G0.eff)); return back(); }
    say((id === 'alt' ? 'Die Kirche hat die Schlüssel des Himmelreichs seit Petrus. Kehrt um, Herr Ritter, und bleibt beim Glauben Eurer Väter.' : 'Lest selbst, Herr Ritter: Wir lehren nichts, was nicht in der Schrift steht. Wollt Ihr Euch zu unserem Bekenntnis stellen?')
      + (HERO.glaube ? ' Wer den Glauben wechselt, verliert bei allen Ständen an Ansehen.' : ''));
    body.append(el('p', 'hint', G0.eff));
    opts.append(btn(id === 'alt' ? 'Ich bleibe beim alten Glauben' : 'Ich bekenne mich zum Goldbrunner Bekenntnis', () => { glaubeWahl(id); renderTalk('main'); }, 'opt'));
    return back();
  }
}
const rrMark = n => {
  if (n.buettel){ const S = HERO.stb; if (S && S.st === 1) return '?'; if (!S && HERO.lvl >= 3 && STB.some(s => s.city === n.city && !stbWeek().includes(s.id) && ZONE_LV[s.zone][0] <= HERO.lvl + 1)) return '!'; }
  if (n.id === 'pirckheimer' && ((!HERO.fehde && HERO.lvl >= 22 && HERO.done.includes('n6')) || fdStep() === 4)) return fdStep() === 4 ? '?' : '!';
  if (n.glaube && !HERO.glaube && glaubeOk()) return '!';
  return '';
};

/* ============ Jede Spielrunde (aus der Hauptschleife, auch bei offenem Fenster) ============ */
function rrTick(dt){
  if (!HERO) return;
  const R = rrS(), k = G.knight;
  if (!R.resumed){ R.resumed = true; const H = HERO.haft; if (H && RR_CITY[H.c]){ window.__rrT = Math.max(5, H.t | 0); if (H.k === 'pr' && RR_CITY[H.c].pr) rrPillory(H.c); else rrJail(H.c); window.__rrT = 0; } else HERO.haft = null; }
  if (R.pr){ rrPrTick(dt); return; }
  if (R.ker){ rrKerTick(dt); return; }
  if (R.halt){   // das Fenster wurde geschlossen: wer schon gefasst ist, kommt nicht mehr davon
    if (G.mode === 'play'){ if (R.halt.self) R.halt = null; else if (R.halt.caught){ openTalk(RR_WACHE); renderTalk('rrGericht'); } else rrFlee(); }
    return;
  }
  if (G.mode !== 'play') return;
  if (R.flee) rrFleeTick(dt);
  else if (rrWanted() && nowS() > R.cool){   // Wachen am Tor stehen zum Teil vor der Mauer: es zählt, ob Ritter oder Wache in der Stadt sind
    const here = isSafe(G.zone) && rrCityOf(G.zone), g = rrGuards(110).find(e => here || rrCityOf(gZone(e.x, e.y).id));
    if (g) rrArrest(g, '');
  }
  if (R.z !== G.zone){
    R.z = G.zone;
    if (BANNFORST[G.zone] && !R.said[G.zone] && !jagdrecht()){ R.said[G.zone] = 1; logLine(ZONE_BY_ID[G.zone].name.replace(/^Der /, 'Der ') + ' ist Bannforst ' + BANNFORST[G.zone] + ': Hirsche und Wildschweine darf hier nur jagen, wer das Jagdrecht hat.', '#d8c69c'); }
    if (rrWanted() && rrCityOf(G.zone) && !R.said['w' + G.zone]){ R.said['w' + G.zone] = 1; logLine('Vorsicht: Die Wachen ' + (G.zone === 'burg' ? 'der Burg' : 'der Stadt') + ' kennen Euer Gesicht. Auf Euch sind ' + rrBounty() + ' Gulden ausgesetzt.', '#ff8a7a'); }
  }
  stbTick(); fdTick(dt);
}

/* ============ Anzeigen: Zeilen oben links, Wegweiser, Karte, Ansehen im Auftragsbuch, Pranger, Mitspieler ============ */
function rrRows(box){
  if (!HERO) return;
  const R = G.rr, row = (b, t, cls) => { const p = el('p', cls || ''); p.append(el('b', null, b), ' ', el('span', null, t)); box.append(p); };
  if (R && R.pr) row('Am Pranger:', Math.ceil(R.pr.t) + ' Sekunden', 'ev');
  else if (R && R.ker) row('Im Kerker:', Math.ceil(R.ker.t) + ' Sekunden', 'ev');
  else if (R && R.flee) row('Auf der Flucht:', 'raus aus ' + RR_CITY[R.flee.c].n, 'ev');
  else if (rrWanted()) row('Gesucht:', rrBounty() + ' Gulden Kopfgeld', 'ev');
  const S = HERO.stb; if (S){ const s = STB_BY[S.id]; if (s) row(s.nm, S.st ? 'zum Büttel' : ZONE_BY_ID[s.zone].name, S.st ? 'done' : ''); }
  const F = HERO.fehde; if (F && F.st < 5) row('Fehde:', ['', 'Schwarzecks Reisige ' + F.n + ' / ' + FD_NEED[1], 'Überfälle ' + F.n + ' / ' + FD_NEED[2], 'Schwarzecks Lager', 'zu Steinhauer'][F.st], F.st === 4 ? 'done' : '');
}
function rrTarget(){
  if (!HERO || G.inside) return null;
  const S = HERO.stb;
  if (S){ const s = STB_BY[S.id]; if (s){ if (S.st){ const b = NPCS.filter(n => n.buettel).sort((a, c) => Math.hypot(a.x - G.knight.x, a.y - G.knight.y) - Math.hypot(c.x - G.knight.x, c.y - G.knight.y))[0]; if (b) return { x: b.x, y: b.y, label: b.name }; } else return { x: S.x, y: S.y, label: s.nm }; } }
  const F = HERO.fehde;
  if (F && F.st === 3){ const c = gNear(FD_CAMP[0], FD_CAMP[1]); return { x: c.x, y: c.y, label: 'Schwarzecks Lager' }; }
  if (F && F.st === 4){ const p = NPCS.find(n => n.id === 'pirckheimer'); return { x: p.x, y: p.y, label: 'Steinhauer' }; }
  if (F && F.st < 3 && !FD_ZONES[G.zone]){ const z = ZONE_BY_ID.reichswald; return { x: z.label.x * WS, y: z.label.y * WS, label: 'Fehde: Königsforst' }; }
  return null;
}
function rrMap(g, P){
  const S = HERO.stb, mark = (x, y, c) => { const px = P(x), py = P(y); g.fillStyle = '#16120f'; g.fillRect(px - 5, py - 5, 11, 11); g.fillStyle = c; g.fillRect(px - 4, py - 4, 9, 9); g.fillStyle = '#16120f'; g.fillRect(px - 1, py - 3, 3, 4); g.fillRect(px - 1, py + 2, 3, 2); };
  if (S && !S.st) mark(S.x, S.y, '#d0343c');
  if (fdStep() === 3){ const c = gNear(FD_CAMP[0], FD_CAMP[1]); mark(c.x, c.y, '#a8241e'); }
}
/* das Ansehen im Auftragsbuch */
function rrQuestCard(box){
  const card = el('div', 'qcard rufcard');
  card.append(el('h4', null, 'Ansehen'));
  for (const r of RUF){
    const v = rufVal(r.id), lv = rufLv(r.id), row = el('div', 'rufrow');
    const bar = el('span', 'rufbar'), fill = el('span', 'ruffill');
    fill.style.left = (v < 0 ? 50 + v / 2 : 50) + '%'; fill.style.width = Math.abs(v) / 2 + '%'; fill.style.background = v < 0 ? '#c8443c' : r.c; bar.append(fill);
    const nm = el('b', null, r.n); nm.style.color = r.c;
    row.append(nm, bar, el('span', 'rufrang', RUF_RANG[lv + 2] + ' (' + (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + ')'));
    card.append(row, el('p', 'rufeff', rufEff(r.id, lv).join(', ')));
  }
  if (HERO.glaube) card.append(el('p', 'qgoal', 'Glaube: ' + (HERO.glaube === 'alt' ? 'beim alten Glauben' : 'Goldbrunner Bekenntnis')));
  if (rrWanted()) card.append(el('p', 'qgoal bad', 'Gesucht: ' + rrBounty() + ' Gulden Kopfgeld (' + HERO.acht.w.join(', ') + ')'));
  box.append(card);
}
/* im Bild: Pranger in Städten ohne eigenen, Schwarzecks Lager, fliegendes Obst */
const RR_PROPS = {};
function rrProp(key, kind, wx, wy, seed){
  let o = RR_PROPS[key];
  if (!o || o.sea !== SEA.cur){ const P = makeProp(kind, seed); o = RR_PROPS[key] = { kind, lz: P.lz, v: P.v, x: wx * WS, y: wy * WS, img: P.img, ax: P.ax * WS, ay: P.ay * WS, shake: 0, sea: SEA.cur }; }
  return o;
}
function rrList(cam, list){
  const R = G.rr;
  if (R && R.pr){ const C = RR_CITY[R.pr.c]; if (C && !C.prop){ const o = rrProp('pr:' + R.pr.c, 'pranger', C.pr[0], C.pr[1] - 4, 1); list.push({ y: o.y - .5, d: () => drawProp(o) }); } }
  if (fdStep() === 3){
    for (const [i, dx, dy] of [[0, -90, -40], [1, 70, -54], [2, 10, 60]]){ const o = rrProp('zelt' + i, 'zelt', FD_CAMP[0] + dx, FD_CAMP[1] + dy, i + 1); if (inView(o.x, o.y, cam, 200)) list.push({ y: o.y, d: () => drawProp(o) }); }
    const c = gNear(FD_CAMP[0], FD_CAMP[1]); if (inView(c.x, c.y, cam, 60)) list.push({ y: c.y + 20, d: () => flameHD(c.x, c.y + 20, G.t, false) });
  }
}
function rrOverlay(){
  const R = G.rr; if (!R || (!R.pr && !R.flee)) return;
  rrPrDraw();
}
function rrUi(){
  const R = G.rr; if (!R || !R.pr) return;
  ctx.fillStyle = 'rgba(16,14,20,.62)'; ctx.fillRect(W / 2 - 150, 6, 300, 34);
  drawText('Am Pranger', W / 2, 9, '#ffd98a'); drawText('noch ' + Math.ceil(R.pr.t) + ' Sekunden,  getroffen ' + R.pr.hits, W / 2, 24, '#ffffff');
}
/* Mitspieler: gesucht oder am Pranger */
const rrPres = () => { const R = G.rr; return R && R.pr ? 'p' : R && R.ker ? 'k' : rrWanted() ? 'g' : ''; };
function rrPlate(p, up){
  if (!p.rr) return;
  const y = p.y - KS.ay - 15 - up - (ehHas(HT, p.ht) ? 26 : 13);
  drawText(p.rr === 'p' ? 'am Pranger' : p.rr === 'k' ? 'im Kerker' : 'gesucht', p.x, y, '#ff8a7a');
}
/* Spielstand */
function rrHero(h){
  const R = h.ruf && typeof h.ruf === 'object' ? h.ruf : {};
  h.ruf = Object.fromEntries(RUF.map(r => [r.id, clamp(Math.round(+R[r.id] || 0), -100, 100)]));
  h.rufD = h.rufD && typeof h.rufD === 'object' ? Object.fromEntries(Object.entries(h.rufD).filter(([k, v]) => /^[a-z:]{3,24}$/.test(k) && Number.isInteger(v)).slice(-24)) : {};
  const A = h.acht; h.acht = A && +A.g > 0 ? { g: Math.min(99999, Math.round(+A.g)), w: Array.isArray(A.w) ? A.w.filter(x => typeof x === 'string').map(x => x.slice(0, 60)).slice(-3) : [] } : null;
  const H = h.haft; h.haft = H && (H.k === 'pr' || H.k === 'ker') && RR_CITY[H.c] && +H.t > 0 && h.acht ? { k: H.k, c: H.c, t: Math.min(150, +H.t) } : null;
  const S = h.stb; h.stb = S && STB_BY[S.id] ? { id: S.id, st: S.st ? 1 : 0, x: +S.x || 0, y: +S.y || 0 } : null;
  if (h.stb && !gOk(h.stb.x, h.stb.y)){ const q = stbHide(STB_BY[h.stb.id]); h.stb.x = q.x; h.stb.y = q.y; }
  h.stbW = h.stbW && h.stbW.w === orWeek() && Array.isArray(h.stbW.d) ? { w: h.stbW.w, d: h.stbW.d.filter(id => STB_BY[id]) } : null;
  h.stbN = Math.max(0, h.stbN | 0); h.stolen = Math.max(0, h.stolen | 0);
  const F = h.fehde; h.fehde = F && F.st >= 1 && F.st <= 5 ? { st: F.st | 0, n: Math.max(0, F.n | 0), e: F.e === 'bund' || F.e === 'urfehde' ? F.e : undefined } : null;
  h.glaube = h.glaube === 'alt' || h.glaube === 'neu' ? h.glaube : null;
}
/* Trophäen */
TROPHIES.splice(TROPHIES.findIndex(t => t.id === 'turnier'), 0,
  { id: 'kopfjaeger', n: 'Kopfgeldjäger', d: 'zehn Gesuchte zur Strecke gebracht', ok: h => (h.stbN | 0) >= 10 },
  { id: 'fehde', n: 'Die Schwarzecker Fehde', d: 'die Fehde gegen Hans Thomas von Schwarzeck zu Ende gebracht', ok: h => !!(h.fehde && h.fehde.st >= 5) },
  { id: 'verehrt', n: 'Verehrt', d: 'bei Fürsten, Städten, Bauern oder Kirche verehrt', ok: h => !!(h.ruf && Object.values(h.ruf).some(v => v >= 80)) },
  { id: 'bekenntnis', n: 'Bekenntnis', d: 'sich in Goldbrunn zu einem Glauben bekannt', ok: h => !!h.glaube });
for (const id of ['kopfjaeger', 'fehde', 'verehrt', 'bekenntnis']) TROPHY_BY[id] = TROPHIES.find(t => t.id === id);
/* Bestiarium */
(() => {
  const li = el('li'), im = el('img'), wh = el('span', 'what', MON.absberg.name), v = el('span', 'val bad', 'Fehde');
  lazySrc(im, () => urlOf(artOf('absberg').idle.r[0].img, 2)); im.alt = '';
  wh.append(el('small', null, 'Raubritter in schwarzem Harnisch auf einem Rappen; die Fehde für Burgfelden, im Lager im Süden des Königsforsts')); li.append(im, wh, v); $('beasts').append(li);
})();
/* Tafel: Recht und Ruf */
(() => {
  const L = $('rufList'); if (L){
    for (const r of RUF){ const li = el('li'), wh = el('span', 'what', r.n); wh.style.color = r.c; wh.append(el('small', null, r.d + '. Geachtet: ' + rufEff(r.id, 1).join(', ') + '. Verehrt: ' + rufEff(r.id, 3).join(', ') + '.')); li.append(wh, el('span', 'val', '−100 bis 100')); L.append(li); }
  }
  const Q = $('rechtList'); if (Q){
    for (const [t, d, v] of [['Diebstahl', 'bei jedem Händler; je mehr Wachen in der Nähe, desto eher fliegt es auf. Erwischt: Kopfgeld, Städte −8, der Händler ist zehn Minuten lang verstimmt.', 'Kopfgeld'],
      ['Wilderei', 'Hirsche und Wildschweine im Königsforst und im Schwarztann gehören dem Landesherrn. Fast jeder zweite Schuss wird gesehen: Kopfgeld, Fürsten −5. Wer bei den Fürsten geehrt ist, hat das Jagdrecht.', 'Kopfgeld'],
      ['Festnahme', 'Die Wachen an den Toren und auf den Märkten halten jeden an, auf den ein Kopfgeld steht: zahlen, vor Gericht treten oder fliehen. Wer flieht und aus der Stadt kommt, zahlt künftig ein Viertel mehr.', ''],
      ['Gericht', 'Bußgeld, Pranger auf dem Markt (30 bis 60 Sekunden) oder Kerker (45 bis 120 Sekunden, Bestechung oder Ausbruch). Wer sich beim Büttel selbst stellt, dem wird ein Viertel erlassen.', ''],
      ['Steckbriefe', 'Die Büttel in der Königsstadt, in Altmünster, Silberberg, Schwanstedt, Burgfelden und Goldbrunn zahlen für gesuchte Räuber. Jeder wartet mit zwei Spießgesellen in seinem Versteck.', STB.length + ' Gesuchte'],
      ['Die Schwarzecker Fehde', 'Ab Stufe 22 bei Ratsherr Steinhauer in Burgfelden, nach Eppelein: Schwarzecks Reisige, seine Überfälle, dann er selbst in seinem Lager im Königsforst.', 'Stufe 22'],
      ['Glaube', 'Ab Stufe 15, wer die Thesen in Schwanstedt gelesen hat: Magister Philipp und Kardinal Lorenzo in Goldbrunn. Alter Glaube: längerer Segen. Bekenntnis: stärkere Bibel, kein Ablass.', 'Stufe 15']]){
      const li = el('li'), wh = el('span', 'what', t); wh.append(el('small', null, d)); li.append(wh, el('span', 'val', v)); Q.append(li);
    }
  }
})();
