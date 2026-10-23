"use strict";
/* Der Apfelritter, Teil 9 von 22: Regeln, Beute, Kleine Bibel, Waffenarten, Pixelschrift, Symbole.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Spielwelt in Feinpixeln: Spielkoordinaten = Weltpixel × WS ============ */
const GW = WW * WS, GH = WH * WS;
const gPt = p => ({ x: p.x * WS, y: p.y * WS });
let DG_ON = null;   // laufendes Gewölbe (siehe Gewölbe), sonst null
const gBlocked = (x0, y0, x1, y1, wade) => DG_ON ? dgBox(x0, y0, x1, y1) : boxBlocked(x0 / WS, y0 / WS, x1 / WS, y1 / WS, wade);
const gOk = (x, y) => wo_ok(Math.floor(x / WS), Math.floor(y / WS));
const gNear = (x, y) => gPt(wo_near(x, y));     // Weltpixel herein, Feinpixel heraus
function gRandWalk(x, y, rMin, rMax){ if (DG_ON) return dgRandWalk(x, y, rMin, rMax); const p = randomWalkable(x / WS, y / WS, rMin / WS, rMax / WS); return p && { x: p.x * WS + (Math.random() < .5 ? 1 : 0), y: p.y * WS }; }
const gZone = (x, y) => zoneAt(Math.floor(x / WS), Math.floor(y / WS));
const gZid = (x, y) => wo_zid(Math.floor(x / WS), Math.floor(y / WS));
const GSTART = gPt(START);
/* Objekte, Feuer und Rauch für das Spiel in Feinpixeln (die Welt behält ihre eigenen Daten für den Boden) */
if (Object.keys(PM_NEW).length && SRC_HASH){ try { localStorage.setItem(PM_KEY, JSON.stringify({ h: SRC_HASH, m: Object.assign({}, PM || {}, PM_NEW) })); } catch(e){} }
const GPROPS = PROPS.map(p => ({ kind: p.kind, lz: p.lz, x: p.x * WS, y: p.y * WS, img: p.img, ax: p.ax * WS, ay: p.ay * WS,
  occl: p.occl ? p.occl.map(v => v * WS) : null, apple: p.apple, crown: p.crown ? gPt(p.crown) : null, shake: 0, door: p.door == null ? null : p.door * WS, wins: p.wins, v: p.v, img0: p.img }));
if (wp_SEA === 3) for (const p of GPROPS) if (p.v == null) p.img = snowCached(p.img0);   // eigene Bauten (Mauern, Meiler) im Winter
const GFIRES = FIRES.map(f => ({ x: f.x * WS, y: f.y * WS, big: f.big })), GSMOKES = SMOKES.map(gPt);

/* ============ Regeln: Stufen, Gebiete, Monsterwerte ============ */
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
};
Sound.on = store.get('apfelritter-ton') !== 'aus';
Object.assign(Sound, {
  coin(){ this.tone(1320, .05, 'square', .028); this.tone(1760, .08, 'square', .022, 0, .045); },
  loot(r){ const b = [392, 440, 523, 587, 659][r] || 440; [1, 1.25, 1.5, 2].slice(0, 2 + Math.min(2, r)).forEach((m, i) => this.tone(b * m, .16, 'triangle', .05, 0, i * .07)); if (r >= 3) this.bell(.3); },
  quest(){ [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .2, 'square', .04, 0, i * .09)); this.bell(.4); },
  potion(){ this.tone(300, .12, 'sine', .06, 200); this.tone(420, .14, 'sine', .05, 260, .1); this.tone(560, .2, 'triangle', .04, 300, .2); },
  bash(){ this.noise(.12, .1, 700); this.tone(90, .18, 'square', .06, -40); },
  cry(){ this.tone(1200, .25, 'sawtooth', .025, 500); this.tone(1500, .3, 'sawtooth', .02, -300, .2); this.horn(); },
  click(){ this.tone(660, .04, 'square', .022); },
  equip(){ this.noise(.06, .05, 2500); this.tone(500, .06, 'square', .03, 200, .04); },
  chat(){ this.tone(880, .05, 'triangle', .03); this.tone(1175, .07, 'triangle', .025, 0, .05); },
  neigh(){
    if (!this.on || !this.ac) return;
    const t = this.ac.currentTime, o = this.ac.createOscillator(), g = this.ac.createGain(), lfo = this.ac.createOscillator(), lg = this.ac.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(950, t); o.frequency.exponentialRampToValueAtTime(380, t + .7);
    lfo.frequency.value = 17; lg.gain.value = 70; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.025, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + .75);
    o.connect(g); g.connect(this.ac.destination); o.start(t); lfo.start(t); o.stop(t + .8); lfo.stop(t + .8);
  },
  hoof(){ this.noise(.035, .045, 700); this.tone(150, .04, 'triangle', .02, -50); },
  anvil(){ this.tone(1800, .3, 'square', .028, -100); this.tone(2600, .25, 'triangle', .022, 0, .01); this.noise(.05, .06, 4000); }
});

const MAX_LVL = 20;
const TITLES = [[1, 'Knappe'], [3, 'Ritter'], [5, 'Freiherr'], [7, 'Graf'], [9, 'Landgraf'], [11, 'Markgraf'], [13, 'Herzog'], [15, 'Kurfürst'], [17, 'König'], [20, 'Kaiser']];
const titleOf = lvl => TITLES.reduce((t, [l, n]) => lvl >= l ? n : t, 'Knappe');
const xpNeed = lvl => Math.round(30 * Math.pow(lvl, 1.55) + 50);
const SKILLS = [
  { id:'hieb', name:'Hieb', key:'Leer', lvl:1, icon:'sword', desc:'Schwerthieb im Bogen' },
  { id:'rund', name:'Rundhieb', key:'R', lvl:3, cd:6, icon:'sweep', desc:'trifft alles rundherum, 140 % Schaden' },
  { id:'stoss', name:'Schildstoß', key:'F', lvl:6, cd:9, icon:'shield', desc:'Sprung nach vorn, betäubt, wehrt Geschosse ab' },
  { id:'ruf', name:'Schlachtruf', key:'G', lvl:10, cd:30, icon:'eagle', desc:'Schlachtruf der Herkunft: 10 Sekunden lang +30 % Schaden und +10 % Volltreffer' },
  { id:'trank', name:'Heiltrank', key:'Q', lvl:1, cd:6, icon:'potion', desc:'heilt 45 % des Lebens' },
  { id:'pferd', name:'Pferd', key:'H', lvl:1, icon:'horse', desc:'auf- und absitzen; im Sattel wird der Hieb zum Lanzenstoß (180 % Schaden, betäubt)' }
];

/* Gebiete: Stufenbereich der Monster; Burg und Stadt sind sicher */
const ZONE_LV = { obstgarten:[1, 3], fluss:[2, 4], dorf:[3, 6], friedhof:[5, 8], lager:[6, 9], galgen:[7, 10], wald:[8, 12], schlachtfeld:[10, 14], moor:[12, 16], ruine:[14, 18],
  weinberge:[15, 18], auwald:[16, 19], piratennest:[18, 21] };
const SAFE = { burg:true, stadt:true, weiler:true, speyer:true, fischerdorf:true };
const ZONE_MOBS = {
  obstgarten:['wieder', 'pluend'], fluss:['ratte', 'moor'], dorf:['ratte', 'pluend'], friedhof:['wieder', 'rabe'],
  lager:['pluend', 'armbrust'], galgen:['rabe', 'wieder'], wald:['werwolf', 'armbrust', 'rabe'],
  schlachtfeld:['wieder', 'pluend', 'rabe'], moor:['moor', 'irrlicht'], ruine:['pluend', 'armbrust'],
  weinberge:['pluend', 'armbrust', 'rabe'], auwald:['nix', 'werwolf', 'moor'], piratennest:['pirat', 'pschuetze']
};
const ZONE_INFO = {
  obstgarten:'Unter der Burg. Wiedergänger und Plünderer, gut für den Anfang.',
  burg:'Die Reichsburg. Der Vogt vergibt Aufträge, die Krämerin handelt. Kein Monster wagt sich herein.',
  stadt:'Die Reichsstadt. Der Bürgermeister braucht Hilfe, der Krämer kauft Beute. Hier bist du sicher.',
  fluss:'Mühle und Brücken. Pestratten und Moorleichen am Ufer.',
  dorf:'Verbrannte Höfe. Ratten und Plünderer.',
  friedhof:'Kapelle und Kloster. Die Toten finden keine Ruhe, Raben kreisen.',
  lager:'Landsknechte ohne Sold: Plünderer und Armbrustschützen.',
  galgen:'Das Hochgericht. Raben und Wiedergänger.',
  wald:'Werwölfe, Schützen und Raben im dunklen Tann.',
  schlachtfeld:'Zerbrochene Spieße, unruhige Tote. Hier geht der Tod um.',
  moor:'Nebel, Moorleichen und Irrlichter. Im Sumpf haust der Lindwurm.',
  ruine:'Die Raubritterburg auf dem Felsen. Kunz der Schwarze und seine Bande.',
  weiler:'Höfe, Gärten und Felder am Fuß der Burg. Markt am Anger unter der Linde, Vieh auf der Weide. Hier seid Ihr sicher.',
  speyer:'Die Reichsstadt am Rhein mit dem Kaiserdom, dem Hafen und dem Ratshof, in dem die Reichstage tagen. Hier seid Ihr sicher.',
  fischerdorf:'Fischerhütten, Netze und Kähne am Ufer. Der Fischer verkauft Angeln und kauft jeden Fang. Hier seid Ihr sicher.',
  weinberge:'Rebhänge über Speyer. Landsknechte, die aus Italien heimkehren, plündern die Winzerhöfe.',
  auwald:'Weiden, Altwasser und Nebel am Strom. Nöcke lauern im Wasser, Wölfe im Dickicht.',
  piratennest:'Die Insel im Altarm. Hinrich Rotbart und seine Flusspiraten überfallen von hier die Rheinschiffe.'
};
const zoneLvText = id => ZONE_LV[id] ? 'Stufe ' + ZONE_LV[id][0] + '–' + ZONE_LV[id][1] : SAFE[id] ? 'sicher' : '';

/* r: Berührung, hr: Trefferfläche (Radien in px); hp, dmg, xp: Faktoren */
const MON = {
  wieder:     { name:'Wiedergänger', hp:2, dmg:1, xp:1, spd:28, r:9, hr:11 },
  ratte:      { name:'Pestratte', hp:.6, dmg:.55, xp:.45, spd:76, r:6, hr:8 },
  rabe:       { name:'Rabe', hp:.8, dmg:.7, xp:.7, spd:100, r:8, hr:11, fly:true },
  pluend:     { name:'Plünderer', hp:3, dmg:1.35, xp:1.25, spd:46, r:9, hr:11 },
  armbrust:   { name:'Armbrustschütze', hp:2, dmg:1.25, xp:1.2, spd:40, r:9, hr:11 },
  werwolf:    { name:'Werwolf', hp:3, dmg:1.45, xp:1.35, spd:54, r:11, hr:13 },
  moor:       { name:'Moorleiche', hp:4, dmg:1.1, xp:1.3, spd:24, r:10, hr:12, wade:true },
  irrlicht:   { name:'Irrlicht', hp:1, dmg:.9, xp:.9, spd:46, r:7, hr:9, fly:true },
  pirat:      { name:'Flusspirat', hp:3.2, dmg:1.45, xp:1.35, spd:50, r:9, hr:11 },
  pschuetze:  { name:'Piratenschütze', hp:2.2, dmg:1.3, xp:1.25, spd:42, r:9, hr:11 },
  nix:        { name:'Nöck', hp:3.6, dmg:1.35, xp:1.4, spd:30, r:10, hr:12, wade:true },
  rotbart:    { name:'Hinrich Rotbart', hp:60, dmg:2.8, xp:20, spd:50, r:12, hr:15, boss:true },
  noeck:      { name:'Der Nöck', hp:60, dmg:2.3, xp:22, spd:38, r:16, hr:24, boss:true, wade:true },
  wels:       { name:'Der Waller', hp:68, dmg:2.6, xp:21, spd:34, r:16, hr:22, boss:true, wade:true },
  raubritter: { name:'Kunz der Schwarze', hp:50, dmg:2.6, xp:16, spd:40, r:15, hr:20, boss:true },
  lindwurm:   { name:'Der Lindwurm', hp:55, dmg:2.2, xp:18, spd:56, r:14, hr:16, boss:true, wade:true },
  tod:        { name:'Der Tod', hp:45, dmg:2.8, xp:17, spd:0, r:14, hr:20, boss:true, fly:true }
};
const artOf = k => MON_ART[k] || BOSS_ART[k];
const monHp = (k, L) => Math.round((1.5 + MON[k].hp * .9) * (6 + 2.7 * L));
const NIGHT_BEAST = { werwolf: 1, irrlicht: 1, wieder: 1, nix: 1 };
/* Kampfweise: Spielarten kämpfen wie ihr Vorbild */
const AI_KIND = { pirat: 'pluend', rotbart: 'pluend', pschuetze: 'armbrust', nix: 'moor', wels: 'werwolf' };
const aiK = k => AI_KIND[k] || k;
const monDmg = (k, L) => Math.max(1, Math.round((2.5 + 1.5 * L) * MON[k].dmg * (NIGHT_BEAST[k] && isNight() ? 1.25 : 1)));
const monXp = (k, L) => Math.round((10 + 5 * L) * MON[k].xp);
const monGold = L => Math.max(1, Math.round(rand(.6, 1.4) * (1 + L * .8)));
/* Erfahrung nach Stufenabstand; graue Monster (5 und mehr Stufen darunter) bringen nichts */
const xpMul = d => d >= 0 ? 1 + Math.min(4, d) * .08 : d >= -4 ? 1 + d * .15 : 0;
const conOf = d => d >= 3 ? 0 : d >= 1 ? 1 : d >= -1 ? 2 : d >= -4 ? 3 : 4;
const CON_COL = ['#ff5a4a', '#ffa040', '#f2e05a', '#72dc6a', '#a8a8a8'];
LAIRS.tod = wo_near(3640, 2700);
for (const k in LAIRS) LAIRS[k] = gPt(LAIRS[k]);
const BOSSES = {
  rotbart:    { lvl:21, zone:'piratennest' },
  wels:       { lvl:20, zone:'auwald' },
  raubritter: { lvl:19, zone:'ruine' },
  lindwurm:   { lvl:16, zone:'moor' },
  tod:        { lvl:14, zone:'schlachtfeld' }
};
const BOSS_MINION = { raubritter:'pluend', lindwurm:'moor', tod:'wieder', rotbart:'pirat', wels:'nix' };
const BIND = { burg: gNear(1900, 456), stadt: gNear(2972, 2380), speyer: gNear(5060, 1420) };
const HUB_NAME = { burg:'Reichsburg', stadt:'Reichsstadt', weiler:'Dorf Lindach', speyer:'Reichsstadt Speyer', fischerdorf:'Fischerdorf Altrip' };

/* ============ Beute: Seltenheit, Grundformen, Zusätze ============ */
const RARITY = [
  { n:'gewöhnlich', c:'#cfc9b8', m:1, aff:0 },
  { n:'gut', c:'#7fd65f', m:1.18, aff:1 },
  { n:'selten', c:'#5fa8f4', m:1.4, aff:2 },
  { n:'episch', c:'#c07ff5', m:1.7, aff:3 },
  { n:'legendär', c:'#f4aa3c', m:2.05, aff:3 }
];
const SLOTS = ['waffe', 'helm', 'ruestung', 'schild', 'beine', 'kleinod'];
const SLOT_NAME = { waffe:'Waffe', helm:'Helm', ruestung:'Rüstung', schild:'Schild', beine:'Beine', kleinod:'Kleinod' };
const BASES = {
  waffe: ['Kurzschwert', 'Reitschwert', 'Ritterschwert', 'Langschwert', 'Anderthalbhänder'],
  helm: ['Lederhaube', 'Eisenhut', 'Beckenhaube', 'Schaller', 'Armet'],
  ruestung: ['Gambeson', 'Kettenhemd', 'Brigantine', 'Halbharnisch', 'Plattenharnisch'],
  schild: ['Holzschild', 'Rundschild', 'Tartsche', 'Dreiecksschild', 'Pavese'],
  beine: ['Lederstiefel', 'Reitstiefel', 'Kettenhosen', 'Beinröhren', 'Beinharnisch'],
  kleinod: ['Pilgerzeichen', 'Kupferring', 'Silberring', 'Bernsteinamulett', 'Goldkette']
};
const ARM_MUL = { helm:.8, ruestung:1.6, schild:1.2, beine:1 };
const AFFIX = {
  hp:    { suf:'des Bären',  v: il => 4 + il * 2.2,  fmt: v => '+' + v + ' Leben' },
  str:   { suf:'des Löwen',  v: il => 1 + il * .55, fmt: v => '+' + v + ' Schaden' },
  crit:  { suf:'des Falken', v: il => 1 + il * .22, fmt: v => '+' + v + ' % Volltreffer' },
  spd:   { suf:'des Windes', v: il => 2 + il * .45, fmt: v => '+' + v + ' % Hiebtempo' },
  arm:   { suf:'der Eiche',  v: il => 1 + il * .8,  fmt: v => '+' + v + ' Rüstung' },
  block: { suf:'der Wacht',  v: il => 3 + il * .5,  fmt: v => '+' + v + ' % Abwehr', only:'schild' }
};
const EPIC_PRE = ['Barbarossas', 'Rolands', 'Siegfrieds', 'Dietrichs', 'Hildebrands', 'Wielands', 'Ottos', 'Rudolfs', 'Maximilians'];
/* ---------- Kleine Bibel: in der Nebenhand statt des Schildes ----------
   Liegt im Platz des Schildes (nh: 'bibel'), hat keine Rüstung und keine Abwehr. Dafür gibt sie mehr Leben, schnellere Erholung
   und mehr Schaden gegen Untote und Geister, und F wird zum Gebet, das heilt. */
const BIB_BASES = ['Abgegriffene kleine Bibel', 'Kleine Bibel', 'Kleine Bibel mit Messingschließe', 'Kleine Bibel mit Goldschnitt', 'Kleine Prachtbibel'];
const BIB_UNDEAD = 25, BIB_HEAL = 30, BIB_CD = 15;
const UNDEAD = { wieder: 1, moor: 1, irrlicht: 1, tod: 1, nix: 1, noeck: 1 };   // Untote und Geister
const isBib = it => !!(it && it.s === 'schild' && it.nh === 'bibel');
const heroBib = () => !!(HERO && HERO.eq && isBib(HERO.eq.schild));
const rollNh = () => Math.random() < .15 ? 'bibel' : null;
const BIB_ICON = bi_icon(['................', '...rrrrrrrrrr...', '..rsRRRRRRRRRr..', '..rRhRRRRRRhRrw.', '..rRRRRijRRRRrw.', '..rRRRRijRRRRrw.', '..rRRiijjiiRRrw.', '..rRRjjjjjjRRrw.',
  '..rRRRRijRRRRrw.', '..rRRRRijRRRRrw.', '..rRRRRijRRRRrw.', '..rRhRRRRRRhRrw.', '..rRRRRRRRRRRrx.', '...rrrrrrrrrrxx.', '....xxxxxxxxxx..', '................']);
let BIB_URL = null;
const bibUrl = () => BIB_URL || (BIB_URL = urlOf(BIB_ICON, 3));
/* ---------- Waffenarten: Schwert, Hellebarde, Zweihänder, Armbrust ----------
   dmg Schaden je Treffer (ganzer Hieb), cd Pause zwischen Hieben, reach Reichweite, swing Dauer des Hiebs, arc halber Hiebbogen, hand 2 = ohne Schild */
const WT = {
  schwert:     { n: 'Schwert', dmg: 1, cd: 1, reach: 1, swing: 1, arc: 1.45, hand: 1, kb: 1, code: 's', d: 'schnell; mit Schild in der anderen Hand' },
  hellebarde:  { n: 'Hellebarde', dmg: 1.3, cd: 1.25, reach: 1.5, swing: 1.2, arc: 1.15, hand: 2, kb: 1.5, code: 'h', d: 'trifft auf große Reichweite; zweihändig, ohne Schild' },
  zweihaender: { n: 'Zweihänder', dmg: 1.75, cd: 1.45, reach: 1.25, swing: 1.3, arc: 1.95, hand: 2, kb: 1.3, code: 'z', d: 'wuchtig und breit, aber langsam; zweihändig, ohne Schild' },
  armbrust:    { n: 'Armbrust', dmg: 1.55, cd: 1.7, reach: 0, swing: 1, arc: 0, hand: 2, kb: .7, code: 'a', ranged: true, d: 'schießt Bolzen auf Abstand; zweihändig, ohne Schild' }
};
const WT_BY_CODE = { s: 'schwert', h: 'hellebarde', z: 'zweihaender', a: 'armbrust' };
const WT_BASES = {
  hellebarde: ['Bauernspieß', 'Partisane', 'Glefe', 'Hellebarde', 'Rossschinder'],
  zweihaender: ['Schlachtschwert', 'Bidenhänder', 'Zweihänder', 'Flamberg', 'Paratschwert'],
  armbrust: ['Jagdarmbrust', 'Hornbogenarmbrust', 'Stahlarmbrust', 'Windenarmbrust', 'Prunkarmbrust']
};
const wtOf = it => it && it.s === 'waffe' && it.wt && WT[it.wt] ? it.wt : 'schwert';
const baseName = it => it.s === 'waffe' && it.wt && WT_BASES[it.wt] ? WT_BASES[it.wt][it.b] : isBib(it) ? BIB_BASES[it.b] : BASES[it.s][it.b];
const rollWt = () => { const q = Math.random(); return q < .55 ? null : q < .7 ? 'hellebarde' : q < .85 ? 'zweihaender' : 'armbrust'; };
const heroWt = () => HERO && HERO.eq ? wtOf(HERO.eq.waffe) : 'schwert';
const WT_ICON_ROWS = {
  hellebarde: ['..............4.', '.............45.', '.......33...454.', '......34455.4...', '......345554....', '.......34554....', '.........nm.4...', '........nm......',
    '.......nm.......', '......nm........', '.....nm.........', '....nm..........', '...nm...........', '..nm............', '.2m.............', '................'],
  zweihaender: ['..............45', '.............454', '............454.', '...........454..', '..........454...', '.........454....', '........454.....', '.......454......',
    '..3...454.......', '...3.454........', '....3hh.........', '....hh3.........', '...nm..3........', '..nm............', '.nm.............', 'ii..............'],
  armbrust: ['................', '..........3.....', '.........w43....', '........w..3....', '.......w...3....', '......w....3....', 'qnnnnnnnnnn34445', 'mmmmmmmmmm.3....',
    '......w2...3....', '.......w...3....', '........w..3....', '.........w43....', '..........3.....', '................', '................', '................']
};
const WT_ICON = {}; for (const w in WT_ICON_ROWS) WT_ICON[w] = bi_icon(WT_ICON_ROWS[w]);
/* Symbole der Fähigkeiten je Waffe: Linien in ein 16 × 16-Raster, die letzten zwei Punkte als Spitze */
function wt_rows(base, lines){
  const R = (base || Array(16).fill('................')).map(r => r.split(''));
  for (const [x0, y0, x1, y1, c, h] of lines){
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++){ const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if (R[y] && R[y][x] !== undefined) R[y][x] = h && i >= n - 1 ? h[i - n + 1] : c; }
  }
  return R.map(r => r.join(''));
}
const WT_SKICON = {
  armbrust: {
    rund: bi_icon(wt_rows(null, [[1, 14, 14, 12, 'm', '45'], [1, 14, 12, 5, 'm', '45'], [1, 14, 6, 2, 'm', '45'], [1, 14, 2, 14, 'w'], [1, 13, 1, 14, 'w']])),
    stoss: bi_icon(wt_rows(wt_rows(null, [[5, 6, 5, 10, 'r'], [6, 6, 6, 10, 'R'], [7, 7, 7, 9, 'r'], [10, 6, 10, 10, 'r'], [11, 6, 11, 10, 'R'], [12, 7, 12, 9, 'r']]), [[1, 8, 15, 8, 'm', '45'], [1, 7, 2, 7, 'w'], [1, 9, 2, 9, 'w']]))
  },
  hellebarde: { stoss: bi_icon(WT_ICON_ROWS.hellebarde, wt_rows(null, [[3, 15, 7, 11, 'x'], [6, 15, 9, 12, 'y'], [0, 12, 3, 9, 'y']])) },
  zweihaender: { stoss: bi_icon(WT_ICON_ROWS.zweihaender, wt_rows(null, [[9, 0, 10, 1, 'j'], [14, 5, 15, 6, 'j'], [8, 3, 9, 3, 'i'], [12, 7, 12, 8, 'i'], [11, 0, 11, 0, 'w'], [15, 3, 15, 3, 'w']])) }
};
const WT_SKURL = {};
const wtSkUrl = (w, id) => WT_SKICON[w] && WT_SKICON[w][id] ? WT_SKURL[w + id] || (WT_SKURL[w + id] = urlOf(WT_SKICON[w][id], 3)) : null;
const WT_URL = {};
const wtUrl = w => WT_URL[w] || (WT_URL[w] = urlOf(WT_ICON[w], 3));
const UNIQUES = {
  raubritter: { s:'waffe', n:'Das Reichsschwert', aff:['str', 'crit', 'spd'] },
  lindwurm:   { s:'schild', n:'Drachenschuppenschild', aff:['block', 'arm', 'hp'] },
  tod:        { s:'kleinod', n:'Der Reichsapfel', aff:['hp', 'str', 'crit'] },
  rotbart:    { s:'waffe', n:'Rotbarts Entermesser', aff:['crit', 'spd', 'str'] },
  wels:       { s:'kleinod', n:'Die Wallerperle', aff:['hp', 'block', 'crit'] }
};
let itemSeq = 0;
function makeItem(s, il, r, o){
  o = o || {};
  il = clamp(Math.round(il), 1, 22);
  const b = clamp(Math.floor((il - 1) / 4), 0, 4), R = RARITY[r], it = { s, il, r, b, a:{} };
  if (s === 'waffe'){ const wt = o.wt || (o.name ? null : rollWt()); if (wt && wt !== 'schwert' && WT[wt]) it.wt = wt; }   // berühmte Klingen bleiben Schwerter
  if (s === 'schild'){ const nh = o.nh || (o.name ? null : rollNh()); if (nh === 'bibel') it.nh = nh; }   // manchmal liegt statt des Schildes eine kleine Bibel
  if (s === 'waffe') it.dmg = Math.max(1, Math.round((3 + il * 1.3) * R.m * rand(.94, 1.06) * (it.wt ? WT[it.wt].dmg : 1)));
  else if (ARM_MUL[s] && !it.nh) it.arm = Math.max(1, Math.round((1 + il) * ARM_MUL[s] * R.m * rand(.94, 1.06)));
  let pool = Object.keys(AFFIX).filter(k => (!AFFIX[k].only || AFFIX[k].only === s) && !(it.nh && k === 'block'));
  const keys = o.aff ? o.aff.slice() : it.nh ? ['hp'] : [], n = R.aff + (s === 'kleinod' ? 1 : 0) + (it.nh ? 1 : 0);
  pool = pool.filter(x => !keys.includes(x));
  while (keys.length < n && pool.length){ const k = pick(pool); pool = pool.filter(x => x !== k); keys.push(k); }
  for (const k of keys) it.a[k] = Math.max(1, Math.round(AFFIX[k].v(il) * R.m * rand(.75, 1.1) * (keys.length > 2 ? .85 : 1) * (it.nh && k === 'hp' ? 1.6 : 1)));
  if (o.name) it.n = o.name;
  else if (r === 3) it.n = pick(EPIC_PRE) + ' ' + (it.nh ? baseName(it)[0].toLowerCase() + baseName(it).slice(1) : baseName(it));
  else it.n = baseName(it) + (keys.length && !it.nh ? ' ' + AFFIX[keys[0]].suf : '');
  if (o.u) it.u = o.u;
  it.v = Math.round((4 + il * 1.6) * [1, 2.2, 5, 11, 25][r]);
  it.id = Date.now().toString(36) + (itemSeq++).toString(36);
  return it;
}
const rollRarity = boss => { const q = Math.random(); return boss ? (q < .35 ? 3 : 2) : q < .015 ? 3 : q < .095 ? 2 : q < .4 ? 1 : 0; };
function itemLines(it){
  const out = [];
  if (it.dmg) out.push(it.dmg + ' Schaden');
  if (it.arm) out.push(it.arm + ' Rüstung');
  for (const [k, v] of Object.entries(it.a || {})) out.push(AFFIX[k].fmt(v));
  if (isBib(it)) out.push('+' + BIB_UNDEAD + ' % gegen Untote');
  return out;
}

/* ============ Pixelschrift 3 × 5 für Namen, Zahlen und Sprechblasen ============ */
const FONT = {
  A:'010101111101101', B:'110101110101110', C:'011100100100011', D:'110101101101110', E:'111100110100111',
  F:'111100110100100', G:'011100101101011', H:'101101111101101', I:'111010010010111', J:'001001001101010',
  K:'101101110101101', L:'100100100100111', M:'101111111101101', N:'110101101101101', O:'010101101101010',
  P:'110101110100100', Q:'010101101110011', R:'110101110101101', S:'011100010001110', T:'111010010010010',
  U:'101101101101111', V:'101101101101010', W:'101101111111101', X:'101101010101101', Y:'101101010010010',
  Z:'111001010100111',
  '0':'111101101101111', '1':'010110010010111', '2':'111001111100111', '3':'111001111001111', '4':'101101111001001',
  '5':'111100111001111', '6':'111100111101111', '7':'111001010010010', '8':'111101111101111', '9':'111101111001111',
  '+':'000010111010000', '-':'000000111000000', '!':'010010010000010', '?':'110001010000010', '.':'000000000000010',
  ',':'000000000010100', ':':'000010000010000', '/':'001001010100100', '(':'010100100100010', ')':'010001001001010',
  "'":'010010000000000', '%':'101001010100101', '"':'101101000000000', '*':'000101010101000', '=':'000111000111000',
  '<':'001010100010001', '>':'100010001010100', '–':'000000111000000'
};
const UML4 = { 'Ä':'010101111101', 'Ö':'010101101010', 'Ü':'101101101111' };
const textCache = new Map();
const fontSafe = s => String(s).toUpperCase().replace(/ß/g, 'SS').replace(/[^A-Z0-9ÄÖÜ+\-!?.,:/()'%"*=<>– ]/g, '');
function textImg(str, color, plain){
  const key = str + '\u0001' + color + (plain ? '\u0002' : '');
  let c = textCache.get(key);
  if (c) return c;
  if (textCache.size > 900) textCache.clear();
  const s = fontSafe(str);
  let w = 0; for (const ch of s) w += ch === ' ' ? 3 : 4;
  w = Math.max(1, w - 1);
  const rows = Array.from({ length: 6 }, () => Array(w).fill('.'));
  let x = 0;
  for (const ch of s){
    if (ch === ' '){ x += 3; continue; }
    if (UML4[ch]){
      rows[0][x] = 'a'; rows[0][x + 2] = 'a';
      for (let i = 0; i < 12; i++) if (UML4[ch][i] === '1') rows[2 + (i / 3 | 0)][x + i % 3] = 'a';
    } else {
      const gl = FONT[ch];
      if (gl) for (let i = 0; i < 15; i++) if (gl[i] === '1') rows[1 + (i / 3 | 0)][x + i % 3] = 'a';
    }
    x += 4;
  }
  // Glyphen verdoppelt (Feinpixel), Kontur ein Feinpixel
  const r2 = []; for (const r of rows){ const l = r.map(ch => ch + ch).join(''); r2.push(l, l); }
  c = makeSprite(r2, { a: color }, plain ? null : OUT, plain ? 0 : 1);
  textCache.set(key, c);
  return c;
}
/* Text zeichnen; align 'c' mittig, 'l' links, 'r' rechts; s = Vergrößerung */
function drawText(str, x, y, color, align, s){
  const im = textImg(str, color), w = im.width * (s || 1), h = im.height * (s || 1);
  const x0 = align === 'l' ? x : align === 'r' ? x - w : x - w / 2;
  ctx.drawImage(im, Math.round(x0), Math.round(y), w, h);
}
/* Zeilen für Sprechblasen umbrechen */
function wrapText(str, max){
  const words = fontSafe(str).split(/\s+/).filter(Boolean), lines = [];
  let cur = '';
  for (let w of words){
    while (w.length > max){ if (cur){ lines.push(cur); cur = ''; } lines.push(w.slice(0, max)); w = w.slice(max); }
    if (!cur) cur = w; else if ((cur + ' ' + w).length <= max) cur += ' ' + w; else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

/* ============ Symbole für Ausrüstung (16 × 16) ============ */
const ICONS = ITEM_ART.icons;
const mirror8 = rows => rows.map(r => r + r.split('').reverse().join(''));
ICONS.helm = bi_icon(mirror8(['........', '......44', '....4455', '...34455', '..334455', '..334444', '..333444', '.2111111',
  '.2333444', '.2233444', '..222333', '...12222', '....1111', '........', '........', '........']));
const SHIELD_ROWS = ['................', '.gggggggggggggg.', '.gjjjiiiiiiiihg.', '.gjiiiiiiiiiihg.', '.gji1i1ii1i1ihg.', '.gji11111111ihg.', '.gjii111111iihg.', '.gjiii1111iiihg.',
  '.gjiii1ii1iiihg.', '..gjiiiiiiiihg..', '..gjiiiiiiiihg..', '...gjiiiiiihg...', '....gjiiiihg....', '.....ggiihg.....', '.......gg.......', '................'];
const remap = (rows, map) => rows.map(r => r.split('').map(c => map[c] || c).join(''));
ICONS.shield = bi_icon(SHIELD_ROWS);
ICONS.ring = bi_icon(['................', '...h........h...', '...h........h...', '....h......h....', '.....h....h.....', '......hiih......', '......gjjg......', '.....giSsig.....',
  '....gisRRsig....', '....gsRRRRsg....', '....giRRRrig....', '.....girrig.....', '......gihg......', '.......gg.......', '................', '................']);
ICONS.coin = bi_icon(['................', '................', '.....hhhhhh.....', '....hjjjjjih....', '...hjjiiiiiih...', '...hjiigiigih...', '...hjiiggggih...', '...hjiiiggiih...',
  '...hjiiggggih...', '...hjiigiigih...', '...hiiiiiiigh...', '....hiiiiigh....', '.....hhhhhh.....', '................', '................', '................']);
ICONS.eagle = (() => { const c = canvasOf(16, 16), e = ITEM_ART.eagle, s = Math.min(1, 15 / Math.max(e.width, e.height)), g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(e, Math.round((16 - e.width * s) / 2), Math.round((16 - e.height * s) / 2), Math.round(e.width * s), Math.round(e.height * s)); return c; })();
const UNIQUE_ICON = {
  raubritter: bi_icon(remap(['................', '.............j..', '............jih.', '...........jih..', '..........jih...', '....R....jih....', '.....R..jih.....', '......Rjih......',
    '.......hi.......', '.....nm.R.......', '....nm...R......', '...nl.....h.....', '..ji............', '..ih............', '................', '................'], {})),
  lindwurm: bi_icon(remap(SHIELD_ROWS, { g:'v', j:'u', i:'V', h:'v', 1:'j' })),
  tod: (() => { const c = canvasOf(16, 16), o = ITEM_ART.orb; c.getContext('2d').drawImage(o, Math.round((16 - o.width) / 2), Math.round(16 - o.height)); return c; })(),
  rotbart: bi_icon(['................', '..........45....', '.........452....', '........452.....', '.......452......', '......452.......', '.....452........', '....452.........',
    '...j52..........', '..jihR..........', '..ihR...........', '..nRR...........', '.nm.............', '.lm.............', '................', '................']),
  wels: bi_icon(['................', '......hiih......', '.....h....h.....', '....h......h....', '....i......i....', '....i......i....', '.....h....h.....', '......hjjh......',
    '.....nwwwwn.....', '....nw5555wn....', '....w555544w....', '....w554444w....', '....n544443n....', '.....nw443n.....', '......nnnn......', '................'])
};
/* Handelsware aus der Jagd: Symbole 16 × 16 */
const WARE_ICON = (() => {
  const pelt = (A, B, C, spots) => bi_icon(['................', '..A..........A..', '...AAAAAAAAAA...', '...ABBBBBBBBA...', '..AABBCCCCBBAA..', '...ABCCCCCCBA...', '...ABCCCCCCBA...', '...ABCCCCCCBA...',
    '...ABBCCCCBBA...', '..AABBCCCCBBAA..', '...ABBBBBBBBA...', '...AAAAAAAAAA...', '..A....AA....A..', '.......AA.......', '........A.......', '................'].map((r, y) => r.split('').map((c, x) => c === 'A' ? A : c === 'B' ? B : c === 'C' ? (spots && (x * 7 + y * 5) % 11 === 0 ? 'w' : C) : '.').join('')));
  return {
    wildbret: bi_icon(['................', '................', '...........ww...', '..........wxxw..', '..........wxw...', '.........xw.....', '....RRRRx.......', '...RSSSRR.......',
      '..RSSwSSRr......', '..RSSSSRRr......', '..RSSRRRrr......', '..RRRRRrr.......', '...rRRrr........', '....rrr.........', '................', '................']),
    hasenbalg: pelt('y', 'x', '4'), rehfell: pelt('m', 'n', 'p', true), hirschfell: pelt('l', 'm', 'n'), schwarte: pelt('l', 'y', 'm'),
    fuchsbalg: bi_icon(['................', '.s.s............', '.sSSs...........', '..sSSSs.........', '...sSwSSs.......', '....sSSSSs......', '.....sSSSSs.....', '......sSSSSs....',
      '.......sSSSs....', '........sSSSs...', '.........sSSws..', '..........sSwws.', '...........swww.', '............ww..', '................', '................']),
    geweih: bi_icon(['................', '.w...........w..', '.q.w.......w.q..', '..qq.q...q.qq...', '...qqq...qqq....', '....qq...qq.....', '..w.qq...qq.w...', '...qqq...qqq....',
      '.....qq.qq......', '......qqq.......', '.....nnnnn......', '.....nppnn......', '......nnn.......', '................', '................', '................']),
    hauer: bi_icon(['................', '................', '....w......w....', '...wx......xw...', '...wx......xw...', '..wx........xw..', '..wx........xw..', '..wx........xw..',
      '...wx......xw...', '....wxx..xxw....', '.....xx..xx.....', '......mmmm......', '.....mnnnnm.....', '......mmmm......', '................', '................'])
  };
})();
const SLOT_ICON = { waffe:'sword', helm:'helm', ruestung:'heart', schild:'shield', beine:'boot', kleinod:'ring' };
const iconOf = it => it.s === 'ware' ? WARE_ICON[it.w] : (it.u && UNIQUE_ICON[it.u]) || (isBib(it) && BIB_ICON) || (it.s === 'waffe' && it.wt && WT_ICON[it.wt]) || ICONS[SLOT_ICON[it.s]];
const iconKey = it => it.u || it.w || (isBib(it) ? 'nh_bibel' : it.s === 'waffe' && it.wt ? 'w_' + it.wt : it.s);
/* Auf dem Boden: Symbol mit Kontur in der Farbe der Seltenheit */
const groundIconCache = new Map();
function groundIcon(it){
  const key = iconKey(it) + it.r;
  let c = groundIconCache.get(key);
  if (!c){ c = addOutline(iconOf(it), it.r ? RARITY[it.r].c : '#16120f'); groundIconCache.set(key, c); }
  return c;
}
const COIN_PILE = makeSprite(['...hjh...', '..hjiih..', '.hjiigih.', 'hgiihhigh', 'ghhggghhg'], bi_IPAL, OUT);
const POTION_SMALL = makeSprite(['.mm.', '.uv.', 'uVVv', 'sRRr', 'uRrv', '.vv.'], bi_IPAL, OUT);
