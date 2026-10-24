"use strict";
/* Der Apfelritter, Teil 21 von 27: Spätes Spiel (Ehre, Prüfungen, Wappen), die versunkene Zollburg.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Spätes Spiel: Ehrenstufen, Wochenprüfungen des Reiches, Ehrenzeichen, Trophäen, Wappen und Titel ============ */
const EH_CAP = 30;                                         // höchstens 30 Ehrenstufen zählen für Leben und Schaden (je 0,5 %)
const ehNeed = n => 4000 + 400 * n;                        // Erfahrung bis zur nächsten Ehrenstufe
const EH_LVL = 18;                                         // ab dieser Stufe zählen die Wochenprüfungen
/* Wappen: kleine Schilde 10 × 12; Tinkturen und Teilungen */
const TINC = { g: '#d8b030', s: '#d6d2c6', r: '#b02a22', b: '#2a4e9a', k: '#1c1a20', v: '#2e7a3a' };
const EAGLE6 = ['k....k', 'kk..kk', '.kkkk.', '..kk..', '.k..k.', '......'], CROWN6 = ['r.r.r.', 'rrrrrr', 'rrrrrr', '......', '......', '......'];
const WAPPEN = {
  kunz:     { n: 'Schwarz und Silber geviert', f: (x, y) => (x < 5) === (y < 6) ? 'k' : 's' },
  drache:   { n: 'Rot mit goldenem Schrägbalken', f: (x, y) => Math.abs(x - y * .85) < 1.8 ? 'g' : 'r' },
  tod:      { n: 'Schwarz mit silbernem Kreuz', f: (x, y) => x === 4 || x === 5 || y === 4 || y === 5 ? 's' : 'k' },
  strom:    { n: 'Blau mit silbernem Wellenbalken', f: (x, y) => Math.abs(y - 6 - Math.round(Math.sin(x * 1.2))) < 1.3 ? 's' : 'b' },
  waller:   { n: 'Grün über Blau, gewellt geteilt', f: (x, y) => y < 6 + Math.round(Math.sin(x * 1.3)) ? 'v' : 'b' },
  noeck:    { n: 'Blau und Grün gespalten, mit Wellen', f: (x, y) => (y % 4 === 1 && (x + y) % 3 !== 0) ? 's' : x < 5 ? 'b' : 'v' },
  fischer:  { n: 'Blau mit drei silbernen Wellen', f: (x, y) => [2, 6, 10].some(r => Math.abs(y - r - Math.round(Math.sin(x * 1.4) * .7)) < .9) ? 's' : 'b' },
  turnier:  { n: 'Gold mit rotem Sparren', f: (x, y) => Math.abs(y - (8 - Math.abs(x - 4.5) * .9)) < 1.4 ? 'r' : 'g' },
  reich:    { n: 'Gold mit schwarzem Adler', f: (x, y) => x >= 2 && x < 8 && y >= 3 && y < 9 && EAGLE6[y - 3][x - 2] === 'k' ? 'k' : 'g' },
  kaiser:   { n: 'Gold mit roter Krone', f: (x, y) => x >= 2 && x < 8 && y >= 3 && y < 9 && CROWN6[y - 3][x - 2] === 'r' ? 'r' : 'g' },
  ehre5:    { n: 'Rot mit silbernem Balken', f: (x, y) => y >= 4 && y < 8 ? 's' : 'r' },
  ehre10:   { n: 'Gold und Blau schräg geteilt', f: (x, y) => x > y * .85 ? 'g' : 'b' },
  ehre20:   { n: 'Purpurn gekrönt', f: (x, y) => x >= 2 && x < 8 && y >= 2 && y < 8 && CROWN6[y - 2][x - 2] === 'r' ? 'g' : (x + y) % 2 ? 'r' : 'k' },
  pruefung: { n: 'Rot mit silbernem Andreaskreuz', f: (x, y) => Math.abs(x - y * .85) < 1.2 || Math.abs(9 - x - y * .85) < 1.2 ? 's' : 'r' },
  bergwerk: { n: 'Schwarz mit goldenem Schragen', f: (x, y) => Math.abs(x - y * .85) < 1.1 || Math.abs(9 - x - y * .85) < 1.1 ? 'g' : 'k' },
  prunk1:   { n: 'Geschacht in Gold und Blau', f: (x, y) => ((x >> 1) + (y >> 1)) % 2 ? 'g' : 'b', shop: 8 },
  prunk2:   { n: 'Rot und Silber gepfählt', f: (x, y) => (x >> 1) % 2 ? 's' : 'r', shop: 8 },
  prunk3:   { n: 'Silber und Blau gerautet', f: (x, y) => ((x + y) >> 1) % 2 ? 's' : 'b', shop: 8 }
};
const WA_IMG = {};
function wappenImg(id){
  if (WA_IMG[id]) return WA_IMG[id];
  const W = WAPPEN[id], c = canvasOf(12, 14), g = c.getContext('2d');
  const inS = (x, y) => y < 8 ? x >= 0 && x < 10 : Math.abs(x + .5 - 5) < 5 - (y - 7) * .9;
  for (let y = 0; y < 12; y++) for (let x = 0; x < 10; x++){
    if (!inS(x, y)) continue;
    let col = TINC[W.f(x, y)] || '#888';
    if (x === 0 || y === 0) col = mixHex(col, '#ffffff', .18); else if (x === 9 || !inS(x, y + 1)) col = mixHex(col, '#000000', .25);
    g.fillStyle = col; g.fillRect(x + 1, y + 1, 1, 1);
  }
  // Kontur
  const id2 = g.getImageData(0, 0, 12, 14), D = id2.data, op = (x, y) => x >= 0 && y >= 0 && x < 12 && y < 14 && D[(y * 12 + x) * 4 + 3] > 0, out = [];
  for (let y = 0; y < 14; y++) for (let x = 0; x < 12; x++) if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) out.push([x, y]);
  g.fillStyle = '#16120f'; for (const [x, y] of out) g.fillRect(x, y, 1, 1);
  return (WA_IMG[id] = c);
}
function mixHex(a, b, t){ const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

/* ---------- Trophäen: einmal verdient, bleiben sie im Buch ---------- */
const FISH_REAL = Object.keys(FISH).filter(id => !FISH[id].junk);
const storyDone = h => (h.story ? h.story.c | 0 : 0);
const ehHas = (T, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(T, k);
const TROPHIES = [
  { id: 'kaiser', n: 'Vivat Imperator', d: 'Stufe 30 erreicht', ok: h => h.lvl >= MAX_LVL, wa: 'kaiser' },
  { id: 'kunz', n: 'Das Reichsschwert', d: 'Kunz den Schwarzen bezwungen', ok: h => h.bosses.raubritter > 0, wa: 'kunz', ic: () => UNIQUE_ICON.raubritter },
  { id: 'lindwurm', n: 'Drachenschuppe', d: 'den Lindwurm im Moor erschlagen', ok: h => h.bosses.lindwurm > 0, wa: 'drache', ic: () => UNIQUE_ICON.lindwurm },
  { id: 'tod', n: 'Der Reichsapfel', d: 'den Tod auf dem Schlachtfeld vertrieben', ok: h => h.bosses.tod > 0, wa: 'tod', ic: () => UNIQUE_ICON.tod },
  { id: 'rotbart', n: 'Rotbarts Entermesser', d: 'Hinrich Rotbart besiegt', ok: h => h.bosses.rotbart > 0, wa: 'strom', ic: () => UNIQUE_ICON.rotbart },
  { id: 'waller', n: 'Die Wallerperle', d: 'den Waller im Altwasser erlegt', ok: h => h.bosses.wels > 0, wa: 'waller', ic: () => UNIQUE_ICON.wels },
  { id: 'tatzelwurm', n: 'Tatzelwurmschuppe', d: 'den Tatzelwurm in der Teufelsschlucht erschlagen', ok: h => h.bosses.tatzelwurm > 0 },
  { id: 'bergmoench', n: 'Das Grubenlicht', d: 'den Bergmönch im Altenberg-Stollen gebannt', ok: h => h.bosses.bergmoench > 0 },
  { id: 'feldhauptmann', n: 'Wüsts Bidenhänder', d: 'Feldhauptmann Balthasar Wüst in seiner Schanze besiegt', ok: h => h.bosses.feldhauptmann > 0 },
  { id: 'ruebezahl', n: 'Herr der Berge', d: 'Rübezahl auf seinem Felsenthron bezwungen', ok: h => h.bosses.ruebezahl > 0 },
  { id: 'hackelberg', n: 'Das Jagdhorn', d: 'Hackelberg, den Wilden Jäger, in der Heide gestellt', ok: h => h.bosses.hackelberg > 0 },
  { id: 'eppelein', n: 'Die Nürnberger hängen keinen …', d: 'Eppelein von Gailingen auf seiner Burg besiegt', ok: h => h.bosses.eppelein > 0 },
  { id: 'donauweibchen', n: 'Perlen der Donau', d: 'das Donauweibchen im Ried bezwungen', ok: h => h.bosses.donauweibchen > 0 },
  { id: 'thesen', n: 'Fünfundneunzig Thesen', d: 'die Thesen an der Tür der Schlosskirche zu Wittenberg gelesen', ok: h => !!h.thesen },
  { id: 'bulcsu', n: 'Sieger vom Lechfeld', d: 'Bulcsú und seine Geisterreiter zur Ruhe gebracht', ok: h => h.bosses.bulcsu > 0 },
  { id: 'pavia', n: 'Sieger von Pavia', d: 'König Franz I. in der Schlacht bei Pavia gefangen genommen', ok: h => !!(h.kz && h.kz.pavia) },
  { id: 'wien', n: 'Verteidiger von Wien', d: 'die Gegenminen vor Wien gehalten und den Aga der Janitscharen besiegt', ok: h => !!(h.kz && h.kz.wien) },
  { id: 'bergwerk', n: 'Glück auf!', d: 'die Truhe im verlassenen Bergwerk geöffnet', ok: h => !!(h.dg && h.dg.bergwerk), wa: 'bergwerk' },
  { id: 'zollburg', n: 'Krone des Nöck', d: 'den Nöck in der versunkenen Zollburg bezwungen', ok: h => !!(h.dg && h.dg.zollburg), wa: 'noeck' },
  { id: 'turnier', n: 'Turniersieger', d: 'ein Großes Turnier gewonnen', ok: h => (h.tw | 0) >= 1, wa: 'turnier' },
  { id: 'tjost', n: 'Meister der Schranke', d: 'alle drei Tjostgegner des Herolds besiegt', ok: h => !!(h.joust && h.joust.beat && h.joust.beat.konrad && h.joust.beat.bayard && h.joust.beat.goetz) },
  { id: 'fischbuch', n: 'Das volle Fischbuch', d: 'jede Fischart gefangen', ok: h => FISH_REAL.every(id => h.fb && h.fb[id]), wa: 'fischer', ic: () => WARE_ICON.f_stoer },
  { id: 'muenze', n: 'Römisches Gold', d: 'eine römische Münze aus dem Wasser gezogen', ok: h => !!(h.fb && h.fb.muenze), ic: () => WARE_ICON.f_muenze },
  { id: 'jaeger', n: 'Jägermeister', d: '100 Stück Wild erlegt', ok: h => (h.hunted | 0) >= 100, ic: () => WARE_ICON.geweih },
  { id: 'story5', n: 'Bauernkrieg', d: 'die Hauptgeschichte bis 1525 erlebt', ok: h => storyDone(h) >= 5 },
  { id: 'story8', n: 'Retter des Reiches', d: 'die Hauptgeschichte bis 1529 erlebt', ok: h => storyDone(h) >= 8, wa: 'reich' },
  { id: 'eh5', n: 'Fünffach geehrt', d: 'Ehrenstufe 5 erreicht', ok: h => h.eh && h.eh.n >= 5, wa: 'ehre5' },
  { id: 'eh10', n: 'Zehnfach geehrt', d: 'Ehrenstufe 10 erreicht', ok: h => h.eh && h.eh.n >= 10, wa: 'ehre10' },
  { id: 'eh20', n: 'Legende des Reiches', d: 'Ehrenstufe 20 erreicht', ok: h => h.eh && h.eh.n >= 20, wa: 'ehre20' },
  { id: 'pruef10', n: 'Zehn Prüfungen', d: 'zehn Wochenprüfungen des Reiches bestanden', ok: h => (h.wkN | 0) >= 10, wa: 'pruefung' },
  { id: 'ordenshaus', n: 'Prächtiges Ordenshaus', d: 'mit dem Orden das Ordenshaus auf Stufe 5 gebracht', ok: () => ASV.ord >= 5 }
];
const TROPHY_BY = Object.fromEntries(TROPHIES.map(t => [t.id, t]));
/* Ehrentitel: über dem Namen, für alle sichtbar */
const HT = {
  ehrenritter: { n: 'Ehrenritter', need: 'Ehrenstufe 1', ok: h => h.eh && h.eh.n >= 1 },
  bannerherr: { n: 'Bannerherr', need: 'Ehrenstufe 3', ok: h => h.eh && h.eh.n >= 3 },
  vlies: { n: 'Ritter vom Goldenen Vlies', need: 'Ehrenstufe 6', ok: h => h.eh && h.eh.n >= 6 },
  paladin: { n: 'Paladin des Reiches', need: 'Ehrenstufe 10', ok: h => h.eh && h.eh.n >= 10 },
  held: { n: 'Held des Reiches', need: 'Ehrenstufe 15', ok: h => h.eh && h.eh.n >= 15 },
  legende: { n: 'Legende', need: 'Ehrenstufe 20', ok: h => h.eh && h.eh.n >= 20 },
  piratenjaeger: { n: 'Piratenjäger', need: 'Rotbart dreimal besiegt', ok: h => (h.bosses.rotbart | 0) >= 3 },
  drachentoeter: { n: 'Drachentöter', need: 'Lindwurm und Bergdrache bezwungen', ok: h => h.bosses.lindwurm > 0 && !!(h.dg && h.dg.bergwerk) },
  meisterfischer: { n: 'Meisterfischer', need: 'das volle Fischbuch', ok: h => FISH_REAL.every(id => h.fb && h.fb[id]) },
  turnierkoenig: { n: 'Turnierkönig', need: 'drei Große Turniere gewonnen', ok: h => (h.tw | 0) >= 3 },
  retter: { n: 'Retter des Reiches', need: 'die Hauptgeschichte bis 1529', ok: h => storyDone(h) >= 8 },
  noeckbezwinger: { n: 'Bezwinger des Nöck', need: 'die versunkene Zollburg', ok: h => !!(h.dg && h.dg.zollburg) },
  jaegermeister: { n: 'Jägermeister', need: '100 Stück Wild', ok: h => (h.hunted | 0) >= 100 },
  freund: { n: 'Freund des Kaisers', need: '15 Ehrenzeichen beim Reichsherold', ok: h => !!(h.htBuy && h.htBuy.freund), shop: 15 }
};
const waOwned = (h, id) => { if (!ehHas(WAPPEN, id)) return false; const W = WAPPEN[id]; if (W.shop) return !!(h.waBuy && h.waBuy[id]); const t = TROPHIES.find(t => t.wa === id); return !!(t && h.trs && h.trs.includes(t.id)); };

/* ---------- Ehrenstufen ---------- */
function ehGain(n){
  const E = HERO.eh;
  E.xp += Math.max(0, Math.round(n));
  let up = false;
  while (E.xp >= ehNeed(E.n)){ E.xp -= ehNeed(E.n); E.n++; up = true; ehUp(); }
  if (up){ refreshStats(); pushFame(); markDirty(true); }
  updateHud();
}
function ehUp(){
  const k = G.knight, n = HERO.eh.n, gold = 40 + n * 10;
  HERO.ez = (HERO.ez | 0) + 1; HERO.gold += gold;
  Sound.levelUp(); burst(k.x, k.y - KBODY, ['#ecd27a', '#ffffff', '#9cc8ff'], 30, 110, true);
  const t = Object.values(HT).find(x => x.need === 'Ehrenstufe ' + n);
  showBanner('Ehrenstufe ' + n, t ? 'Neuer Titel: ' + t.n : '+1 Ehrenzeichen, ' + gold + ' Gulden');
  logLine('Ehrenstufe ' + n + ' erreicht: ein Ehrenzeichen und ' + gold + ' Gulden. ' + (n <= EH_CAP ? 'Leben und Schaden steigen um ein halbes Hundertstel.' : '') + (t ? ' Beim Reichsherold könnt Ihr den Titel „' + t.n + '“ wählen.' : ''), '#ecd27a');
}

/* ---------- Wochenprüfungen: drei Aufgaben je Woche, für alle Ritter dieselben ---------- */
const WK_KILL = [
  { t: 'Erschlagt 25 Flusspiraten', kind: 'pirat', need: 25 }, { t: 'Erschlagt 20 Nöcke', kind: 'nix', need: 20 }, { t: 'Erschlagt 20 Werwölfe', kind: 'werwolf', need: 20 },
  { t: 'Erschlagt 30 Monster in den Weinbergen', zone: 'weinberge', need: 30 }, { t: 'Erschlagt 30 Monster im Auwald', zone: 'auwald', need: 30 },
  { t: 'Erschlagt 25 Monster in der Raubritter\u00adburg', zone: 'ruine', need: 25 }, { t: 'Erschlagt 25 Monster im Moor', zone: 'moor', need: 25 },
  { t: 'Erschlagt 15 Piraten\u00adschützen', kind: 'pschuetze', need: 15 }, { t: 'Erschlagt 30 Monster auf dem alten Schlacht\u00adfeld', zone: 'schlachtfeld', need: 30 }
];
const WK_BOSS = [
  { t: 'Bezwingt Hinrich Rotbart', boss: 'rotbart', need: 1 }, { t: 'Erlegt den Waller', boss: 'wels', need: 1 }, { t: 'Erschlagt den Lindwurm', boss: 'lindwurm', need: 1 },
  { t: 'Bezwingt Kunz den Schwarzen', boss: 'raubritter', need: 1 }, { t: 'Vertreibt den Tod vom Schlachtfeld', boss: 'tod', need: 1 }
];
const WK_MISC = [
  { t: 'Fangt 15 Fische', ev: 'fish', need: 15 }, { t: 'Fangt einen Hecht', ev: 'fish:hecht', need: 1 }, { t: 'Erlegt 15 Stück Wild', ev: 'hunt', need: 15 },
  { t: 'Gewinnt 3 Tjoste an der Schranke', ev: 'joust', need: 3 }, { t: 'Kämpft bei 2 Welt\u00adereignissen mit', ev: 'ev', need: 2 },
  { t: 'Öffnet die Schatztruhe eines Gewölbes', ev: 'dg', need: 1 }, { t: 'Bezwingt den Nöck in der versunkenen Zoll\u00adburg', ev: 'dg:zollburg', need: 1 }
];
function wkList(w){
  const R = rng(w * 7919 + 1529), pick = L => L[(R() * L.length) | 0];
  R(); R();
  return [pick(WK_KILL), pick(WK_BOSS), pick(WK_MISC)];
}
function wkCur(){
  const w = orWeek();
  if (!HERO.wk || HERO.wk.w !== w) HERO.wk = { w, p: [0, 0, 0], c: [0, 0, 0] };
  return { W: HERO.wk, L: wkList(w) };
}
function wkAdd(test){
  if (!HERO || HERO.lvl < EH_LVL) return;
  const { W, L } = wkCur();
  L.forEach((d, i) => {
    if (W.c[i] || W.p[i] >= d.need || !test(d)) return;
    W.p[i]++;
    if (W.p[i] >= d.need){ Sound.quest(); showBanner('Prüfung bestanden', d.t); logLine('Wochenprüfung bestanden: ' + d.t + '. Der Reichsherold in Speyer hat Euren Lohn.', '#ecd27a'); }
    markDirty();
  });
  renderTracker();
}
function ehOnKill(m){ wkAdd(d => d.boss ? m.k === d.boss : (d.kind ? m.k === d.kind : !!d.zone) && (!d.zone || m.zone === d.zone)); }
function ehOnFish(id){ if (!FISH[id] || FISH[id].junk) return; wkAdd(d => d.ev === 'fish' || d.ev === 'fish:' + id); }
function ehCount(ev){ wkAdd(d => d.ev === ev || (ev.startsWith('dg:') && d.ev === 'dg')); }
function wkClaim(i){
  const { W, L } = wkCur(), d = L[i];
  if (W.c[i] || W.p[i] < d.need) return;
  W.c[i] = 1; HERO.wkN = (HERO.wkN | 0) + 1;
  const gold = 100 + HERO.lvl * 10;
  HERO.ez = (HERO.ez | 0) + 3; HERO.gold += gold;
  Sound.coin(); Sound.quest();
  logLine('Lohn der Prüfung „' + d.t + '“: 3 Ehrenzeichen, ' + gold + ' Gulden und Erfahrung.', '#ffd98a');
  gainXp(1200);
  if (W.c.every(Boolean)){
    HERO.ez += 3;
    const it = makeItem(pick(SLOTS), clamp(HERO.lvl + 1, 1, 32), Math.random() < .5 ? 4 : 3), j = HERO.inv.indexOf(null);
    if (j >= 0){ HERO.inv[j] = it; logLine('Alle drei Prüfungen der Woche bestanden! Der Reichsherold überreicht 3 Ehrenzeichen und ' + it.n + '.', '#ecd27a'); }
    else { HERO.ez += 2; logLine('Alle drei Prüfungen der Woche bestanden! Der Rucksack ist voll, also gibt der Herold 5 Ehrenzeichen.', '#ecd27a'); }
    showBanner('Woche der Ehre', 'alle Prüfungen bestanden');
  }
  updateHud(); markDirty(true); pushFame();
}

/* ---------- Trophäen prüfen (alle paar Sekunden) ---------- */
function ehCheck(quiet){
  if (!HERO) return;
  HERO.trs = HERO.trs || [];
  for (const t of TROPHIES){
    if (HERO.trs.includes(t.id)) continue;
    let ok = false; try { ok = t.ok(HERO); } catch(e){}
    if (!ok) continue;
    HERO.trs.push(t.id);
    if (!quiet && G && G.mode === 'play'){
      Sound.chime(); showBanner('Neue Trophäe', t.n);
      logLine('Neue Trophäe im Trophäenbuch: „' + t.n + '“ (' + t.d + ')' + (t.wa ? '. Dazu ein Wappen beim Reichsherold.' : '.'), '#ffd98a');
    }
    markDirty(); pushFame();
  }
}
setInterval(() => { try { if (HERO && G && G.mode !== 'title') ehCheck(false); } catch(e){} }, 3000);

/* ---------- Werte, Spielstand, Ruhmeshalle, Anwesenheit ---------- */
function ehStats(h, s){ if (h.eh && h.eh.n > 0){ const b = Math.min(EH_CAP, h.eh.n) * .005; s.dmg *= 1 + b; s.hp *= 1 + b; } }
function ehHero(h){
  h.eh = h.eh && typeof h.eh === 'object' ? { n: clamp(h.eh.n | 0, 0, 999), xp: Math.max(0, h.eh.xp | 0) } : { n: 0, xp: 0 };
  h.ez = clamp(h.ez | 0, 0, 9999); h.wkN = Math.max(0, h.wkN | 0);
  if (h.wk && (typeof h.wk !== 'object' || h.wk.w !== orWeek())) h.wk = null;
  if (h.wk) h.wk = { w: h.wk.w, p: [0, 1, 2].map(i => Math.max(0, (h.wk.p || [])[i] | 0)), c: [0, 1, 2].map(i => (h.wk.c || [])[i] ? 1 : 0) };
  h.trs = Array.isArray(h.trs) ? h.trs.filter(id => TROPHY_BY[id]).slice(0, 60) : [];
  const bag = (o, T) => { const r = {}; if (o && typeof o === 'object') for (const k in T) if (o[k]) r[k] = 1; return r; };
  h.waBuy = bag(h.waBuy, WAPPEN); h.htBuy = bag(h.htBuy, HT);
  if (!ehHas(WAPPEN, h.wa)) h.wa = null;
  if (!ehHas(HT, h.ht)) h.ht = null;
}
function ehFameDoc(o){
  if (HERO.eh && HERO.eh.n) o.eh = HERO.eh.n;
  if (HERO.trs && HERO.trs.length) o.tc = HERO.trs.length;
  if (HERO.wa && waOwned(HERO, HERO.wa)) o.wa = HERO.wa;
  if (ehHas(HT, HERO.ht) && HT[HERO.ht].ok(HERO)) o.ht = HERO.ht;
  return o;
}
function ehPres(pr){
  if (HERO.wa && waOwned(HERO, HERO.wa)) pr.wa = HERO.wa;
  if (ehHas(HT, HERO.ht) && HT[HERO.ht].ok(HERO)) pr.ht = HERO.ht;
}
function ehPlate(p, up){
  const y = p.y - KS.ay - 15 - up;
  if (ehHas(WAPPEN, p.wa)){ const tw = textImg(p.nm + ' ' + p.lv, '#ffffff').width; ctx.drawImage(wappenImg(p.wa), Math.round(p.x + tw / 2 + 3), Math.round(y - 1)); }
  if (ehHas(HT, p.ht)) drawText(HT[p.ht].n, p.x, y - 13, '#e8c860');
}
function ehFameTab(box, rows){
  const me = cloud.uid || 'local';
  const L = rows.filter(r => (r.eh | 0) > 0 || (r.tc | 0) > 0).map(r => ({ id: r.id, nm: cleanName(r.nm) || 'Unbekannt', eh: clamp(r.eh | 0, 0, 999), tc: clamp(r.tc | 0, 0, 60), wa: ehHas(WAPPEN, r.wa) ? r.wa : null, ht: ehHas(HT, r.ht) ? r.ht : null }))
    .sort((a, b) => b.eh - a.eh || b.tc - a.tc).slice(0, 15);
  if (!L.length){ box.append(el('li', 'empty', 'Noch hat kein Ritter Ehrenstufen oder Trophäen. Der Reichsherold in Speyer führt das Buch.')); return; }
  L.forEach((r, i) => {
    const li = el('li', r.id === me ? 'me' : ''), nm = el('span', 'fn');
    if (r.wa){ const im = el('img', 'forb'); im.src = urlOf(wappenImg(r.wa), 2); im.alt = ''; nm.append(im); }
    nm.append(r.nm);
    li.append(el('span', 'fr', String(i + 1)), nm, el('span', 'fl', (r.eh ? 'Ehrenstufe ' + r.eh : 'ohne Ehrenstufe') + (r.ht ? ' · ' + HT[r.ht].n : '')), el('span', 'fk', r.tc + (r.tc === 1 ? ' Trophäe' : ' Trophäen')));
    box.append(li);
  });
}
function ehRows(box){
  if (!HERO || HERO.lvl < EH_LVL) return;
  const { W, L } = wkCur(), done = L.filter((d, i) => W.p[i] >= d.need).length, open = L.filter((d, i) => W.p[i] >= d.need && !W.c[i]).length;
  if (W.c.every(Boolean)) return;
  const p = el('p', 'post'); p.append(el('b', null, 'Prüfungen: '), el('span', null, done + ' von 3' + (open ? ', Lohn beim Reichsherold' : ''))); box.append(p);
}

/* ---------- Reichsherold: Gesprächsansichten ---------- */
function ehTalkOpts(n, opts){
  if (!n.ehre) return;
  opts.append(btn('Wochenprüfungen des Reiches', () => renderTalk('ehPruef'), 'opt'), btn('Ehrenzeichen eintauschen (' + (HERO.ez | 0) + ')', () => renderTalk('ehLaden'), 'opt'),
    btn('Das Trophäenbuch (' + (HERO.trs || []).length + ' von ' + TROPHIES.length + ')', () => renderTalk('ehBuch'), 'opt'), btn('Wappen und Ehrentitel wählen', () => renderTalk('ehWahl'), 'opt'));
}
function ehView(view, body, opts){
  const back = () => opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
  const row = (icon, title, sub, button) => { const r = el('div', 'shoprow'), ic = el('img'); ic.src = icon; ic.alt = ''; const t = el('div', 'stx'); t.append(el('b', null, title), el('small', null, sub)); r.append(ic, t); if (button) r.append(button); body.append(r); return r; };
  if (view === 'ehPruef'){
    const { W, L } = wkCur(), left = Math.max(0, (orWeek() + 1) * 7 * 86400000 - Date.now() + 0);
    $('talkText').textContent = HERO.lvl < EH_LVL ? 'Die Prüfungen des Reiches sind für erfahrene Ritter. Kommt wieder, wenn Ihr Stufe ' + EH_LVL + ' erreicht habt. Hier seht Ihr, was diese Woche verlangt wird.'
      : 'Jede Woche stellt das Reich drei Prüfungen, für alle Ritter dieselben. Jede bestandene bringt 3 Ehrenzeichen, Gulden und Erfahrung; wer alle drei besteht, bekommt mehr.';
    L.forEach((d, i) => {
      const done = W.p[i] >= d.need, got = W.c[i];
      const b = got ? null : btn(done ? 'Lohn holen' : W.p[i] + ' / ' + d.need, () => { wkClaim(i); renderTalk('ehPruef'); }, 'tbtn');
      if (b) b.disabled = !done || HERO.lvl < EH_LVL;
      row(urlOf(i === 1 ? ICONS.eagle : i === 0 ? ICONS.sword : ICONS.coin, 3), d.t, got ? 'bestanden, Lohn erhalten' : done ? 'bestanden' : 'noch ' + (d.need - W.p[i]) + ' zu tun', b);
    });
    body.append(el('p', 'hint', 'Die nächsten Prüfungen gibt es in der neuen Woche. Bestanden habt Ihr bisher ' + (HERO.wkN | 0) + ' Prüfungen.'));
    back(); body.append(opts); return;
  }
  if (view === 'ehLaden'){
    $('talkText').textContent = 'Ihr habt ' + (HERO.ez | 0) + ' Ehrenzeichen. Ehrenzeichen gibt es für jede Ehrenstufe und für bestandene Wochenprüfungen.';
    const buy = (cost, fn) => { if ((HERO.ez | 0) < cost) return; HERO.ez -= cost; fn(); Sound.coin(); updateHud(); markDirty(true); pushFame(); renderTalk('ehLaden'); };
    const lv = clamp(HERO.lvl + 2, 1, 32);
    for (const s of SLOTS){
      const b = btn('12 Ehrenzeichen', () => buy(12, () => { const j = HERO.inv.indexOf(null); if (j < 0){ HERO.ez += 12; logLine('Euer Rucksack ist voll.', '#d8c69c'); return; } const it = makeItem(s, lv, 4, { name: BASES[s][clamp(Math.floor((lv - 1) / 4), 0, 4)] + ' des Reiches' }); HERO.inv[j] = it; logLine('Der Reichsherold überreicht Euch ' + it.n + '.', '#f4aa3c'); }), 'tbtn');
      b.disabled = (HERO.ez | 0) < 12;
      row(urlOf(ICONS[SLOT_ICON[s]], 3), 'Legendär: ' + SLOT_NAME[s], 'Stufe ' + lv + ', aus der Rüstkammer des Kaisers', b);
    }
    { const b = btn('2 Ehrenzeichen', () => buy(2, () => { HERO.potions = Math.min(20, HERO.potions + 10); logLine('Zehn Heiltränke aus der Hofapotheke.', '#9fe08a'); }), 'tbtn'); b.disabled = (HERO.ez | 0) < 2 || HERO.potions >= 20; row(urlOf(ICONS.potion, 3), 'Zehn Heiltränke', 'höchstens 20 im Gürtel', b); }
    for (const [id, W] of Object.entries(WAPPEN)) if (W.shop){
      const own = waOwned(HERO, id), b = btn(own ? 'Euer Wappen' : W.shop + ' Ehrenzeichen', () => buy(W.shop, () => { HERO.waBuy[id] = 1; HERO.wa = id; logLine('Ihr führt nun das Wappen „' + W.n + '“.', '#ffd98a'); sendPresence(true); }), 'tbtn');
      b.disabled = own || (HERO.ez | 0) < W.shop;
      row(urlOf(wappenImg(id), 3), 'Prunkwappen: ' + W.n, 'zu sehen neben Eurem Namen und in der Ruhmeshalle', b);
    }
    { const T = HT.freund, own = T.ok(HERO), b = btn(own ? 'Euer Titel' : T.shop + ' Ehrenzeichen', () => buy(T.shop, () => { HERO.htBuy.freund = 1; HERO.ht = 'freund'; logLine('Ihr tragt nun den Titel „Freund des Kaisers“.', '#ffd98a'); sendPresence(true); }), 'tbtn'); b.disabled = own || (HERO.ez | 0) < T.shop; row(urlOf(ICONS.eagle, 3), 'Ehrentitel: Freund des Kaisers', 'über Eurem Namen für alle Ritter zu sehen', b); }
    back(); body.append(opts); return;
  }
  if (view === 'ehBuch'){
    const have = HERO.trs || [];
    $('talkText').textContent = 'Das Trophäenbuch verzeichnet Eure Taten. ' + have.length + ' von ' + TROPHIES.length + ' Trophäen sind darin. Manche bringen ein Wappen, das Ihr führen dürft.';
    for (const t of TROPHIES){
      const got = have.includes(t.id), icon = t.ic ? t.ic() : t.wa ? wappenImg(t.wa) : ICONS.coin;
      const r = row(urlOf(icon, 3), got ? t.n : '???', t.d + (t.wa ? ' · Wappen: ' + WAPPEN[t.wa].n : ''), null);
      if (!got) r.querySelector('img').style.filter = 'grayscale(1) brightness(.45)';
    }
    back(); body.append(opts); return;
  }
  if (view === 'ehWahl'){
    $('talkText').textContent = 'Wappen und Titel sehen alle Ritter neben Eurem Namen und in der Ruhmeshalle. ' + (HERO.eh.n ? 'Ihr steht auf Ehrenstufe ' + HERO.eh.n + '.' : 'Ehrenstufen gibt es nach Stufe 20 für jede weitere Erfahrung.');
    body.append(el('h4', null, 'Wappen'));
    const none = btn(HERO.wa ? 'Ohne Wappen' : 'Ohne Wappen (gewählt)', () => { HERO.wa = null; sendPresence(true); markDirty(true); pushFame(); renderTalk('ehWahl'); }, 'tbtn'); none.disabled = !HERO.wa; body.append(none);
    for (const [id, W] of Object.entries(WAPPEN)){
      const own = waOwned(HERO, id); if (!own) continue;
      const b = btn(HERO.wa === id ? 'gewählt' : 'Führen', () => { HERO.wa = id; Sound.choose(); sendPresence(true); markDirty(true); pushFame(); renderTalk('ehWahl'); }, 'tbtn'); b.disabled = HERO.wa === id;
      row(urlOf(wappenImg(id), 3), W.n, '', b);
    }
    body.append(el('h4', null, 'Ehrentitel'));
    const nt = btn(HERO.ht ? 'Ohne Titel' : 'Ohne Titel (gewählt)', () => { HERO.ht = null; sendPresence(true); markDirty(true); pushFame(); renderTalk('ehWahl'); }, 'tbtn'); nt.disabled = !HERO.ht; body.append(nt);
    for (const [id, T] of Object.entries(HT)){
      const own = T.ok(HERO), b = own ? btn(HERO.ht === id ? 'gewählt' : 'Tragen', () => { HERO.ht = id; Sound.choose(); sendPresence(true); markDirty(true); pushFame(); renderTalk('ehWahl'); }, 'tbtn') : null;
      if (b) b.disabled = HERO.ht === id;
      const r = row(urlOf(ICONS.eagle, 3), own ? T.n : T.n + ' (noch nicht)', 'verdient durch: ' + T.need, b);
      if (!own) r.querySelector('img').style.filter = 'grayscale(1) brightness(.45)';
    }
    back(); body.append(opts); return;
  }
}

/* ============ Die versunkene Zollburg: Flut im Thronsaal, Flutwellen, Schieber, der Nöck ============
   Das Leben des Nöck teilen sich alle Kämpfer (wie beim Bergdrachen). Fällt es unter zwei Drittel und unter ein Drittel, taucht er ab
   und der Saal läuft voll: Er ist unverwundbar, Flutwellen laufen als Ringe mit einer Lücke durch den Saal, und zwei Ritter müssen die
   beiden Schieber der Flut zugleich öffnen. Die Schieber sind Hebel eines Gitters ohne Gitter; offen meldet sie die Anwesenheit (go). */
const ZB_FLOOD = [.66, .33];
const zbBoss = () => G.mons.find(m => m.k === 'noeck' && m.grp);
function zbFloodOn(M, n){
  const b = zbBoss(), gt = M.gates.find(g => g.flood === n);
  return !!(b && gt && !gt.open && b.hp <= b.max * ZB_FLOOD[n - 1]);
}
const dgLvN = (near, held) => {
  const M = DG_ON, L = M && near && near.startsWith('lever:') ? M.levers[+near.slice(6)] : null;
  if (L && M.kz) return M.kz.done[+near.slice(6)] ? M.D.lvDone : M.D.lvN;
  if (!L || !M.D.zb) return held ? 'Hebel loslassen' : 'Hebel ziehen';
  return M.gates[L.gate].flood ? (held ? 'Schieber loslassen' : 'Schieber öffnen') : (held ? 'Rad loslassen' : 'Rad drehen');
};
function zbEnter(M){
  const r = M.D.rooms.find(r => r[4] === 'vault'), T = DG_T;
  M.zb = { lvl: 0, waves: [], waveT: 2, sumT: 9, x0: M.ox + r[0] * T, y0: M.oy + r[1] * T, x1: M.ox + (r[0] + r[2]) * T, y1: M.oy + (r[1] + r[3]) * T, seen: false };
  for (const gt of M.gates) if (gt.flood) gt.open = false;
  G.wadeM = 1;
}
function zbTick(M, dt){
  const Z = M.zb, k = G.knight, b = zbBoss();
  if (!Z) return;
  const fl = b ? (zbFloodOn(M, 1) ? 1 : zbFloodOn(M, 2) ? 2 : 0) : 0;
  Z.lvl = clamp(Z.lvl + (fl ? dt * .45 : -dt * .3), 0, 1);
  const inRoom = k.x > Z.x0 && k.x < Z.x1 && k.y > Z.y0 + 10 && k.y < Z.y1;
  G.wadeM = inRoom && Z.lvl > .25 ? 1 - .3 * Z.lvl : 1;
  if (inRoom && !Z.seen){ Z.seen = true; if (b) logLine('Im Thronsaal der Zollburg erhebt sich der Nöck aus seinem Wirbel. Zwei Schieberpaare an der Nordwand halten das Wasser des Stroms zurück.', '#9fdcff'); }
  if (b){
    if (fl && !b.sub){
      b.sub = true; b.st = 'go'; b.stunT = 0; Z.waveT = 1.6;
      Sound.thunder(); Sound.tone(70, 1.4, 'sine', .06, -20); G.shake = .35;
      showBanner('Die Flut steigt', 'zwei Ritter: beide Schieber zugleich öffnen');
      logLine('Der Nöck taucht ab, der Strom bricht in den Saal! Unter Wasser ist er nicht zu treffen. Zwei Ritter müssen die ' + (fl === 1 ? 'äußeren' : 'inneren') + ' Schieber an der Nordwand zugleich öffnen, die anderen weichen den Flutwellen aus: Durch die Lücke im Ring kommt man trocken.', '#9fdcff');
    }
    if (!fl && b.sub){
      b.sub = false; b.stunT = 3.2; b.st = 'rest'; b.sT = 0;
      showBanner('Das Wasser läuft ab', 'der Nöck liegt auf dem Trockenen');
      logLine('Das Wasser gurgelt ab. Der Nöck liegt benommen auf den Fliesen: Jetzt zuschlagen!', '#9fe08a');
      Sound.tone(300, .5, 'sine', .04, -200);
    }
    const rage = !b.sub && b.hp <= b.max * ZB_FLOOD[1];
    if (rage && !b.raged){ b.raged = true; logLine('Der Nöck rast vor Zorn: Seine Wellen rollen nun auch über den trockenen Boden!', '#ff9a8a'); Sound.horn(); }
    Z.waveT -= dt;
    if ((b.sub || rage) && b.mode === 'fight' && Z.waveT <= 0){
      Z.waveT = b.sub ? (fl === 2 ? 2.3 : 2.9) : 5.2;
      Z.waves.push({ x: b.x, y: b.y - 4, r: 16, gap: rand(0, 6.283), gw: 1.05, hit: false });
      Sound.tone(98, .8, 'sine', .05, -30); Sound.tone(196, .4, 'triangle', .02, -60, .1);
    }
    Z.sumT -= dt;
    if (!b.sub && b.mode === 'fight' && Z.sumT <= 0){
      Z.sumT = rage ? 8 : 12;
      if (G.mons.filter(m => m.minion).length < 4){
        logLine('Der Nöck ruft: Wassergeister steigen aus den Fugen!', '#9fdcc8');
        for (let j = 0; j < 2; j++){ const p = dgRandWalk(b.x, b.y, 60, 120); if (p) G.rising.push({ kind: 'nix', x: p.x, y: p.y, t: .9 + j * .25, lvl: Math.max(1, b.lvl - 3), engage: true, minionOf: b, nm: 'Wassergeist' }); }
      }
    }
  } else if (Z.waves.length) Z.waves.length = 0;
  // Flutwellen laufen als Ringe (mit Lücke) durch den Saal
  for (let i = Z.waves.length - 1; i >= 0; i--){
    const w = Z.waves[i]; w.r += 118 * dt;
    if (w.r > 620){ Z.waves.splice(i, 1); continue; }
    if (w.hit || !inRoom || G.mode !== 'play' || k.hp <= 0) continue;
    const dx = k.x - w.x, dy = (k.y - w.y) / .62, d = Math.hypot(dx, dy);
    if (Math.abs(d - w.r) > 9) continue;
    const a = Math.atan2(dy, dx) - w.gap, an = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
    if (an < w.gw / 2) continue;
    w.hit = true;
    if (hurt({ x: w.x, y: w.y }, monDmg('noeck', b ? b.lvl : M.lvl[1] + 1) * .7)){ floatText(k.x, k.y - KS.ay - 8, 'Flutwelle!', '#9fdcff'); burst(k.x, k.y - 6, ['#9fdcff', '#e8f6ff', '#3a7a8c'], 10, 80); }
  }
}
/* Wasser im Saal: über dem Boden, unter Mauern, Leuten und Dingen */
function zbFloor(M){
  const Z = M.zb; if (!Z || Z.lvl <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(Z.x0, Z.y0, Z.x1 - Z.x0, Z.y1 - Z.y0); ctx.clip();
  ctx.globalAlpha = .46 * Z.lvl; ctx.fillStyle = '#1c566a'; ctx.fillRect(Z.x0, Z.y0, Z.x1 - Z.x0, Z.y1 - Z.y0);
  ctx.globalAlpha = .55 * Z.lvl; ctx.fillStyle = '#8cc8d8';
  for (let y = Z.y0 + 8; y < Z.y1; y += 14) for (let x = Z.x0 + ((y / 14 | 0) % 2) * 20; x < Z.x1; x += 40){
    const o = Math.round(Math.sin(G.t * 1.8 + x * .05 + y * .13) * 6); ctx.fillRect(x + o, y, 10, 1); ctx.fillRect(x + o + 3, y - 1, 4, 1);
  }
  ctx.restore(); ctx.globalAlpha = 1;
}
/* Flutwellen und der Wirbel des abgetauchten Nöck: über allem, leuchtend */
function zbOver(M){
  const Z = M.zb; if (!Z) return;
  const b = zbBoss();
  ctx.save(); ctx.beginPath(); ctx.rect(Z.x0, Z.y0 + 6, Z.x1 - Z.x0, Z.y1 - Z.y0 - 6); ctx.clip();
  for (const w of Z.waves){
    const n = Math.max(24, Math.round(w.r * .9)), al = clamp(1.4 - w.r / 520, .25, 1);
    for (let i = 0; i < n; i++){
      const a = i / n * 6.283, d = Math.abs(Math.atan2(Math.sin(a - w.gap), Math.cos(a - w.gap)));
      if (d < w.gw / 2) continue;
      const x = Math.round(w.x + Math.cos(a) * w.r), y = Math.round(w.y + Math.sin(a) * w.r * .62);
      ctx.globalAlpha = al * .55; ctx.fillStyle = '#2e7a90'; ctx.fillRect(x - 2, y, 5, 3);
      ctx.globalAlpha = al; ctx.fillStyle = d < w.gw / 2 + .12 ? '#ffffff' : '#bfe8f2'; ctx.fillRect(x - 1, y - 1, 3, 1);
    }
  }
  if (b && b.sub){
    for (let j = 0; j < 3; j++){
      const r = 10 + ((G.t * 18 + j * 9) % 27), al = 1 - r / 37; ctx.globalAlpha = al * .8; ctx.fillStyle = '#bfe8f2';
      for (let i = 0; i < 28; i++){ const a = i / 28 * 6.283 + j; ctx.fillRect(Math.round(b.x + Math.cos(a) * r), Math.round(b.y - 4 + Math.sin(a) * r * .5), 2, 1); }
    }
  }
  ctx.restore(); ctx.globalAlpha = 1;
}
/* Schieber öffnen das Wasser ab */
function zbDrained(M, gt, byLever){
  if (byLever){ G.shake = .3; Sound.tone(140, .9, 'sawtooth', .04, -60); Sound.tone(420, .6, 'sine', .02, -300, .2); }
  logLine(byLever ? 'Die Schieber knarren auf, das Wasser stürzt in die Abflüsse!' : 'Die Schieber stehen offen, das Wasser läuft ab.', '#9fe08a');
}
function zbKill(m){
  const M = DG_ON, c = centerOf(m), from = { x: m.x, y: m.y };
  HERO.kills++; HERO.dgBoss = HERO.dgBoss || {}; HERO.dgBoss[M.id] = dgDay(); orCount('kills'); orCount('boss'); lwAdd(20);
  Sound.kill(); Sound.thunder(); G.flash = .55; G.shake = .45;
  burst(c.x, c.y, DEATH_COLORS.noeck, 60, 150, true); burst(m.x, m.y - 6, ['#9fdcff', '#e8f6ff', '#3a7a8c'], 30, 120);
  if (M.zb) M.zb.waves.length = 0;
  for (const mm of G.mons.slice()) if (mm.minion){ burst(mm.x, mm.y - 20, DEATH_COLORS.nix, 12, 70); G.mons.splice(G.mons.indexOf(mm), 1); }
  for (let j = 0; j < 6; j++) dropLoot(from, 'gold', monGold(m.lvl) * 4);
  dropLoot(from, 'potion'); dropLoot(from, 'potion');
  HERO.dgFirst = HERO.dgFirst || {};
  const crown = () => makeItem('helm', m.lvl + 1, 4, { name: UNIQUES.noeck.n, aff: UNIQUES.noeck.aff, u: 'noeck' });
  if (!HERO.dgFirst.noeck){ HERO.dgFirst.noeck = true; dropLoot(from, 'item', 0, crown()); }
  else dropLoot(from, 'item', 0, Math.random() < .25 ? crown() : makeItem(pick(SLOTS), m.lvl, 4));
  dropLoot(from, 'item', 0, makeItem(pick(SLOTS), m.lvl, 3));
  if (m.by === 'me') NET.kx = { n: NET.kx.n + 1, s: NET.kx.s + monXp('noeck', m.lvl), l: m.lvl };
  const xp = Math.round(monXp('noeck', m.lvl) * 1.5 * xpMul(m.lvl - HERO.lvl)); if (xp > 0) gainXp(xp);
  showBanner('Der Nöck ist bezwungen', 'der Zollschatz im Thronsaal ist frei');
  logLine('Der Nöck zerfällt zu Wasser und Schlamm, seine Krone klirrt auf die Fliesen. Der Zollschatz der versunkenen Burg gehört Euch.', '#ecd27a');
  pushFame(); updateHud(); markDirty(true);
}

/* Tafeln: Fische des Stroms, Ehre */
for (const id of Object.keys(FISH).filter(id => !FISH[id].junk)){
  const F = FISH[id], li = el('li'), im = el('img'), wh = el('span', 'what', F.n);
  lazySrc(im, () => urlOf(WARE_ICON['f_' + id], 2)); im.alt = '';
  wh.append(el('small', null, F.cm[0] + ' bis ' + F.cm[1] + ' cm' + (F.r === 2 ? ', sehr selten' : F.r ? ', selten' : ''))); li.append(im, wh); $('fishNote').append(li);
}
for (const [icon, name, desc] of [[ICONS.eagle, 'Ehrenstufen', 'nach Stufe 30, je ' + ehNeed(0) + ' Erfahrung und mehr'], [ICONS.coin, 'Wochenprüfungen', 'drei Aufgaben je Woche beim Reichsherold in Speyer'],
  [wappenImg('reich'), 'Wappen', Object.keys(WAPPEN).length + ' Wappen, aus Trophäen oder für Ehrenzeichen'], [UNIQUE_ICON.noeck, 'Trophäen', TROPHIES.length + ' Taten im Trophäenbuch'], [ICONS.sword, 'Ehrentitel', Object.keys(HT).length + ' Titel, vom Ehrenritter bis zur Legende']]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  lazySrc(im, () => urlOf(icon, 2)); im.alt = ''; wh.append(el('small', null, desc)); li.append(im, wh); $('ehNote').append(li);
}
