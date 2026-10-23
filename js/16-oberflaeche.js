"use strict";
/* Der Apfelritter, Teil 16 von 23: Pferd, Schmied, Wegweiser, Oberfläche.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Pferd: Aufsitzen, Absitzen ============ */
ICONS.horse = (() => { const c = canvasOf(16, 16), sp = horseSet('klepper', 'reich').left[4].under; c.getContext('2d').drawImage(sp, 1, 0, 18, 18, -1, -1, 18, 18); return c; })();
const riding = () => !!(HERO && HERO.riding && HERO.horse && !G.inside);
function mountHorse(){
  if (!canAct() || G.inside || DG_ON) return;
  if (!HERO.horse){ floatText(G.knight.x, G.knight.y - KS.ay - 4, 'Kein Pferd', '#d8c69c'); logLine('Ihr habt kein Pferd. Der Stallmeister in der Reichsburg verkauft welche.', '#d8c69c'); return; }
  if (G.combatT < 3){ floatText(G.knight.x, G.knight.y - KS.ay - 4, 'Nicht im Kampf', '#d8c69c'); return; }
  HERO.riding = true; Sound.neigh();
  if (!G.lanceTip){ G.lanceTip = true; logLine('Im Sattel wird der Hieb zum Lanzenstoß. Zum Kampf zu Fuß mit H absitzen.', '#ffd98a'); }
  burst(G.knight.x, G.knight.y - 4, ['#6e5a42', '#8a7254'], 12, 50);
  renderSkills(); sendPresence(true); markDirty();
}
function dismount(msg){
  if (!HERO || !HERO.riding) return;
  HERO.riding = false;
  if (msg) floatText(G.knight.x, G.knight.y - KS.ay - 4, msg, '#ffb08a', 1, 1.2);
  renderSkills(); sendPresence(true); markDirty();
}
const toggleHorse = () => HERO.riding ? dismount() : mountHorse();

/* ============ Schmied: Ausrüstung verbessern (+1 bis +5) ============ */
const itemName = it => it.n + (it.up ? ' +' + it.up : '') + (it.q > 1 ? ' ×' + it.q : '');
const upgradeCost = it => Math.round((20 + it.il * 12) * ((it.up || 0) + 1) * [1, 1.3, 1.7, 2.3, 3][it.r]);
function upgradeItem(it){
  if (!it.base) it.base = { dmg: it.dmg || 0, arm: it.arm || 0, a: Object.assign({}, it.a), v: it.v };
  it.up = (it.up || 0) + 1;
  const B = it.base, u = it.up;
  if (B.dmg) it.dmg = Math.max(B.dmg + u, Math.round(B.dmg * (1 + .12 * u)));
  if (B.arm) it.arm = Math.max(B.arm + u, Math.round(B.arm * (1 + .12 * u)));
  for (const k in B.a) it.a[k] = Math.max(B.a[k] + (u >> 1), Math.round(B.a[k] * (1 + .08 * u)));
  it.v = Math.round(B.v * (1 + .35 * u));
}
/* lohnt der Tausch? gewichtete Summe der Veränderungen */
const GAIN_W = { hp:.35, dmg:3, arm:1.2, crit:2.2, spd:1.6, block:1.3 };
function itemGain(it){
  if (it.s === 'ware') return 0;
  const cur = heroStats(HERO), nxt = heroStats(Object.assign({}, HERO, { eq: Object.assign({}, HERO.eq, { [it.s]: it }) }));
  let g = 0; for (const k in GAIN_W) g += (nxt[k] - cur[k]) * GAIN_W[k];
  return g;
}

/* ============ Wegweiser zum Auftrag ============ */
function questTarget(){
  if (!HERO || G.inside) return null;
  const stt = stTarget(); if (stt) return stt;
  for (const q of HERO.quests){
    const d = qInfo(q); if (!d) continue;
    if (q.n >= d.need){ const n = NPCS.find(x => x.id === d.giver); if (n) return { x: n.x, y: n.y, label: 'Abgabe' }; }
    else if (d.boss) return { x: LAIRS[d.boss].x, y: LAIRS[d.boss].y, label: MON[d.boss].name };
    else { const z = ZONE_BY_ID[d.zone]; if (z && G.zone !== d.zone) return { x: z.label.x, y: z.label.y, label: z.name }; }
  }
  return null;
}
const QARROW = [];
function drawQuestArrow(k){
  const t = questTarget(); if (!t) return;
  const dx = t.x - k.x, dy = t.y - k.y;
  if (Math.hypot(dx, dy) < 220) return;
  const a = Math.atan2(dy, dx), c = Math.cos(a), s = Math.sin(a);
  const sc = Math.min((W / 2 - 30) / Math.abs(c || 1e-6), (H / 2 - 30) / Math.abs(s || 1e-6));
  const cx = Math.round(W / 2 + c * sc), cy = Math.round(H / 2 + s * sc);
  const pulse = (G.t * 3 | 0) % 2, ai = ((Math.round(a / (Math.PI * 2) * 64) % 64) + 64) % 64, key = ai + pulse * 64;
  let img = QARROW[key];
  if (!img){
    const aq = ai / 64 * Math.PI * 2, qc = Math.cos(aq), qs = Math.sin(aq), cg = (img = QARROW[key] = canvasOf(33, 33)).getContext('2d');
    for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++){
      const u = (x * qc + y * qs) / 1.4, v = (-x * qs + y * qc) / 1.4;     // u entlang, v quer
      const inside = u <= 9 && u >= -5 && Math.abs(v) <= (9 - u) * .5;
      const edge = u <= 9.8 && u >= -5.8 && Math.abs(v) <= (9.8 - u) * .55 + .45;
      if (inside){ cg.fillStyle = u > 3 ? (pulse ? '#ffffff' : '#fff0a0') : '#ffd541'; cg.fillRect(x + 16, y + 16, 1, 1); }
      else if (edge){ cg.fillStyle = OUT; cg.fillRect(x + 16, y + 16, 1, 1); }
    }
  }
  ctx.drawImage(img, cx - 16, cy - 16);
  drawText(t.label, clamp(cx - c * 30, 60, W - 60), clamp(cy - s * 24 - 6, 6, H - 18), '#ffd541');
}

/* ============ Oberfläche ============ */
const $ = id => document.getElementById(id);
const TOUCH = (() => { try { return matchMedia('(hover:none) and (pointer:coarse)').matches; } catch(e){ return false; } })();
/* Eingabeart: Tastatur oder Finger. Auf Tablets mit Tastatur schaltet das Spiel um, sobald eine Taste gedrückt wird,
   und beim nächsten Tippen wieder zurück. Hinweise im Spiel richten sich danach (touchUI). */
const KBD = { on: !TOUCH, told: false };
const touchUI = () => TOUCH && !KBD.on;
function setKbd(on){
  if (KBD.on === on) return;
  KBD.on = on;
  document.body.classList.toggle('kbd', on && TOUCH); document.body.classList.toggle('keys', on);
  if (on && TOUCH && !KBD.told && G && G.mode === 'play'){ KBD.told = true; logLine('Tastatur erkannt: Pfeile oder WASD laufen, Leertaste schlägt, E spricht. F1 zeigt alle Tasten.', '#ffd98a'); }
  if (G && G.mode === 'menu' && !$('ovTalk').hidden) numberKeys($('talkBody'));
}
document.body.classList.toggle('keys', KBD.on);
addEventListener('touchstart', () => setKbd(false), { passive: true, capture: true });
/* Ziffern 1–9 für die Wahlmöglichkeiten eines Fensters */
function numberKeys(box){
  let n = 0;
  for (const b of box.querySelectorAll('button')){ b.removeAttribute('data-k'); if (!b.disabled && n < 9) b.dataset.k = ++n; }
  if (KBD.on){ const f = box.querySelector('[data-k="1"]'); if (f) f.focus({ preventScroll: true }); }
}
/* Pfeiltasten in Fenstern: zum nächsten Knopf in dieser Richtung */
function navFocus(ov, code, cur){
  const bs = [...ov.querySelectorAll('button, input, select, a[href]')].filter(b => !b.disabled && b.offsetParent !== null);
  if (!bs.length) return;
  if (!cur || !bs.includes(cur)){ bs[0].focus({ preventScroll: false }); return; }
  const r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
  const dx = code === 'ArrowRight' ? 1 : code === 'ArrowLeft' ? -1 : 0, dy = code === 'ArrowDown' ? 1 : code === 'ArrowUp' ? -1 : 0;
  let best = null, bd = 1e9;
  for (const b of bs){
    if (b === cur) continue;
    const r = b.getBoundingClientRect(), vx = r.left + r.width / 2 - cx, vy = r.top + r.height / 2 - cy, along = vx * dx + vy * dy;
    if (along <= 2) continue;
    const d = along + Math.abs(vx * dy + vy * dx) * 2.5;
    if (d < bd){ bd = d; best = b; }
  }
  if (!best){ const i = bs.indexOf(cur); best = bs[(i + (dx + dy > 0 ? 1 : bs.length - 1)) % bs.length]; }
  best.focus({ preventScroll: false });
}
function openKeys(){ if (!openPanel('ovKeys')) return; $('btnKeysClose').focus({ preventScroll: true }); }
const nowS = () => performance.now() / 1000;
function scaled(c, s){
  const o = canvasOf(c.width * s, c.height * s), g = o.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, o.width, o.height); return o;
}
const urlOf = (c, s) => scaled(c, s || 4).toDataURL();
const SEAL_URL = urlOf(ITEM_ART.seal, 3);
$('sealTop').src = SEAL_URL;
document.querySelectorAll('[data-seal]').forEach(im => { im.src = SEAL_URL; });
const ICON_URL = {};
for (const [name, c] of Object.entries(ICONS)) ICON_URL[name] = urlOf(c, 3);
const NPC_URL = {};
for (const n of NPCS) Object.defineProperty(NPC_URL, n.id, { configurable: true, enumerable: true,
  get(){ const v = urlOf(n.art.frames[0], 3); Object.defineProperty(NPC_URL, n.id, { value: v, writable: true, configurable: true, enumerable: true }); return v; },
  set(v){ Object.defineProperty(NPC_URL, n.id, { value: v, writable: true, configurable: true, enumerable: true }); } });
const itemUrls = new Map();
function itemUrl(it){ const key = iconKey(it); if (!itemUrls.has(key)) itemUrls.set(key, urlOf(iconOf(it), 3)); return itemUrls.get(key); }
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
function btn(label, onClick, cls){ const b = el('button', cls || 'tbtn', label); b.type = 'button'; b.addEventListener('click', e => { e.stopPropagation(); Sound.click(); onClick(); }); return b; }

/* ---------- Tafeln unter dem Spiel ---------- */
const BEASTS = [
  ['wieder', 'Wiedergänger', 'Obstgarten, Friedhof, Galgenberg, Schlachtfeld'],
  ['ratte', 'Pestratte', 'Flussaue und verbranntes Dorf, flink'],
  ['rabe', 'Rabe', 'kreist und stößt herab'],
  ['pluend', 'Plünderer', 'zieht den Spieß zurück, dann sticht er'],
  ['armbrust', 'Armbrustschütze', 'hält Abstand, ein roter Strich zeigt den Schuss'],
  ['werwolf', 'Werwolf', 'Finsterwald, lauert und springt'],
  ['moor', 'Moorleiche', 'zäh, ihr Griff macht dich langsam'],
  ['irrlicht', 'Irrlicht', 'stiehlt Beute vom Boden'],
  ['raubritter', 'Kunz der Schwarze', 'Raubritterburg, Stufe 19, stürmt heran'],
  ['lindwurm', 'Der Lindwurm', 'Moor, Stufe 16, speit Feuer'],
  ['tod', 'Der Tod', 'Schlachtfeld, Stufe 14, kommt mit der Sense'],
  ['pirat', 'Flusspirat', 'Piratennest, sticht mit dem Bootshaken'],
  ['pschuetze', 'Piratenschütze', 'Piratennest, schießt aus sicherem Abstand'],
  ['nix', 'Nöck', 'Auwald, steigt nachts aus dem Wasser, sein Griff macht langsam'],
  ['rotbart', 'Hinrich Rotbart', 'Piratennest, Stufe 21, schnell und ruft seine Mannschaft'],
  ['wels', 'Der Waller', 'Auwald am großen Altwasser, Stufe 20, schnellt mit offenem Maul vor'],
  ['noeck', 'Der Nöck', 'Versunkene Zollburg, nur mit Gefährten: taucht ab, setzt den Saal unter Wasser und schickt Flutwellen']
];
for (const [kind, name, desc] of BEASTS){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name), v = el('span', 'val' + (MON[kind].boss ? ' bad' : ''), MON[kind].boss ? 'Anführer' : '');
  lazySrc(im, () => urlOf(artOf(kind).idle.r[0].img, 2)); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh, v); $('beasts').append(li);
}
/* Leben im Reichsland: Tiere und Leute */
for (const [kind, name, desc, person] of [
  ['huhn', 'Hühner, Gänse, Schweine', 'an Höfen, im Dorf Lindach und in den Gassen der Stadt'],
  ['kuh', 'Kühe, Schafe, Ziegen', 'auf Weiden; die Schäfer ziehen mit ihren Herden unter der Burg und in der Flussaue'],
  ['reh', 'Rehe, Hirsche, Hasen', 'an Waldrändern und Lichtungen, Hasen auf Wiesen und Feldern; scheu'],
  ['fuchs', 'Füchse und Wildschweine', 'im Finsterwald und am Rand der Obstgärten'],
  ['ente', 'Enten, Frösche, Fische', 'auf Teichen, am Fluss und im Moor'],
  ['buerger', 'Bürger und Mägde', 'in der Reichsstadt und auf der Burg, grüßen und wissen Neues', true],
  ['haendler', 'Händler', 'an den Marktständen in der Stadt und am Anger von Lindach', true],
  ['wache', 'Wachen', 'an den Toren von Burg und Stadt', true],
  ['moench', 'Mönche und Pilger', 'im Klostergarten und unterwegs auf den Straßen', true]
]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  lazySrc(im, () => urlOf(person ? vkPerson(kind, 0).stand.right : trArt(kind, 0).stand, 2)); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh); $('lifeList').append(li);
}
/* Die Ritter Europas: Tafel und Auswahl beim Anlegen */
const PLATE_URL = {};
for (const id of FACTION_IDS){
  const F = KN_FACTIONS[id];
  Object.defineProperty(PLATE_URL, id, { configurable: true, enumerable: true, get(){ const v = urlOf(knightSet(id).plate, 3); Object.defineProperty(PLATE_URL, id, { value: v, writable: true, enumerable: true }); return v; } });
  const li = el('li'), im = el('img'), tx = el('div');
  lazySrc(im, () => PLATE_URL[id]); im.alt = F.knight + ' in Wappenrock und Rüstung';
  tx.append(el('b', null, F.knight), el('small', null, F.name + ' · ' + F.ruler), el('span', null, F.desc), el('small', 'bonus', 'Vorteil: ' + F.bonusText + ' · Schlachtruf: „' + F.cry + '“'));
  li.append(im, tx); $('knightList').append(li);
}
function renderPick(){
  const box = $('factionPick'); box.textContent = '';
  for (const id of FACTION_IDS){
    const F = KN_FACTIONS[id], b = el('button', 'fpick'), im = el('img');
    b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(G.pickF === id));
    lazySrc(im, () => PLATE_URL[id]); im.alt = '';
    b.append(im, el('span', null, F.name.replace(/^(Heiliges Römisches |Königreich )/, '')));
    b.addEventListener('click', () => { G.pickF = id; Sound.click(); renderPick(); });
    box.append(b);
  }
  const F = KN_FACTIONS[G.pickF];
  $('factionDesc').textContent = F.knight + ' · ' + F.bonusText + '. ' + F.desc;
}
/* Pferde: Tafel */
for (const hid of HORSE_IDS){
  const h = HORSES[hid], li = el('li'), im = el('img'), wh = el('span', 'what', h.name);
  lazySrc(im, () => urlOf(horseSet(hid, 'reich').right[4].under, 1)); im.alt = ''; im.className = 'horseimg';
  wh.append(el('small', null, h.desc));
  li.append(im, wh, el('span', 'val', h.price + ' Gulden'));
  $('horseList').append(li);
}
/* Harnisch, Turnier, Tag und Nacht: Tafeln */
for (let r = 0; r < 5; r++){
  const li = el('li'), im = el('img'), wh = el('span', 'what', GEAR_NAME[r][0].toUpperCase() + GEAR_NAME[r].slice(1));
  lazySrc(im, () => urlOf(knightSet('reich', '' + r + r + r + 'nn').walk.down[0].img, 1)); im.alt = '';
  wh.append(el('small', null, 'Harnisch, ' + RARITY[r].n + (r >= 2 ? ', mit Federbusch' : '')));
  if (r) wh.style.color = '#' + [1, 3, 5].map(i => Math.round(parseInt(RARITY[r].c.slice(i, i + 2), 16) * .55).toString(16).padStart(2, '0')).join('');   // Farbe der Güte, dunkler fürs Pergament
  li.append(im, wh); $('gearList').append(li);
}
for (const f of JOUST_FOES){
  const li = el('li'), im = el('img'), wh = el('span', 'what', f.name);
  lazySrc(im, () => { const set = knightSet(f.f, f.look); return set.url || (set.url = urlOf(set.icon, 3)); }); im.alt = '';
  wh.append(el('small', null, 'Stufe ' + f.lvl + ', ' + f.prize + ' Gulden, ' + f.trophy.name));
  li.append(im, wh); $('joustList').append(li);
}
for (const [ic, name, desc] of [['sonne', 'Morgen, 4 bis 9 Uhr', 'Morgenrot, oft liegt Nebel über den Wiesen'], ['sonne', 'Tag', 'klar oder heiter, Wolkenschatten ziehen übers Land'],
  ['wolke', 'Regen, Nebel, Gewitter', 'das Wetter wechselt alle fünf Minuten, im Gewitter blitzt und donnert es'], ['mond', 'Nacht, 21 bis 4 Uhr', 'Grillen und Käuzchen, Fledermäuse über den Dächern']]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  im.src = urlOf(SKY_ICON[ic], 3); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh); $('dayList').append(li);
}
/* Feste und Gasthaus: Tafeln */
for (const f of FESTS){
  const li = el('li'), im = el('img'), wh = el('span', 'what', f.name);
  lazySrc(im, () => urlOf(FEST_ART[f.id] || (FEST_ART[f.id] = np_frames(f.host.o, f.host.pal)).frames[0], 2)); im.alt = '';
  wh.append(el('small', null, SEA_NAME[FESTS.indexOf(f)] + ', ' + f.where + '. ' + f.host.name + ' lädt zum ' + f.gameName + ', Preis: ' + f.prize + '.'));
  li.append(im, wh); $('festList').append(li);
}
for (const [art, name, desc] of [[INN_ART.spielmann, 'Spielmann Veit', 'spielt für einen Gulden einen Tanz, eine Ballade oder ein Trinklied; gute Laune bringt 10 Minuten lang 10 % mehr Erfahrung'],
  [INN_ART.landsknecht, 'Landsknecht Utz', 'würfelt um 5, 20 oder 50 Gulden: drei Würfel, einmal nachwerfen; Dreierpasch schlägt Pärchen, Pärchen schlägt Augen']]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  im.src = urlOf(art.frames[0], 2); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh); $('innFun').append(li);
}
/* Mit anderen Rittern, Weltereignisse: Tafeln */
for (const [f, name, desc] of [['reich', 'Gruppe', 'bis zu vier Ritter. Erschlägt ein Gefährte ein Monster, bekommt jeder in der Nähe drei Viertel der Erfahrung; dazu ein Zehntel mehr je Gefährte nahebei. Oben links stehen Stufe und Leben der Gefährten, T öffnet die Gruppe.'],
  ['england', 'Gemeinsam kämpfen', 'Eure Hiebe treffen auch die Monster vor einem anderen Ritter, und die Monster gehen auf den nächsten Ritter los. Lohn bekommt, wer mitgekämpft hat oder in der Gruppe nahebei steht.'],
  ['frankreich', 'Tjost gegen einen Ritter', 'auf der Turnierwiese vor dem Osttor: Wer fordert, reitet die südliche Bahn. Der Sieger bekommt Ehrensold vom Herold und Punkte für die Turnierwertung; Zuschauer sehen oben links den Stand.'],
  ['spanien', 'Handel', 'Gegenstände aus dem Rucksack und Gulden. Getauscht wird erst, wenn beide für genau diese Angebote einverstanden sind.']]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  lazySrc(im, () => knightUrl(f)); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh); $('mpList').append(li);
}
{ const li = el('li'), im = el('img'), wh = el('span', 'what', 'Würfeln gegen einen Ritter');
  im.src = urlOf(INN_ART.landsknecht.frames[0], 2); im.alt = '';
  wh.append(el('small', null, 'im Gasthaus um 5, 20 oder 50 Gulden: beide werfen drei Würfel und dürfen einmal nachwerfen, der bessere Wurf gewinnt den Einsatz des anderen.')); li.append(im, wh); $('mpList').append(li); }
/* ghostArt steht hier und nicht bei den Weltereignissen, weil die Tafel gleich darunter es schon beim Laden braucht */
/* Geisterhaft: blasses Blau, durchscheinend, leuchtet in der Nacht */
function ghostArt(art){
  const tint = (src, glow) => {
    const c = canvasOf(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0);
    const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
    for (let i = 0; i < d.length; i += 4){
      if (!d[i + 3]) continue;
      const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255;
      if (glow){ d[i] = 120 + l * 80; d[i + 1] = 200 + l * 55; d[i + 2] = 240; d[i + 3] = Math.round(d[i + 3] * (.16 + l * .3)); }
      else { d[i] = 36 + l * 160; d[i + 1] = 60 + l * 180; d[i + 2] = 100 + l * 150; d[i + 3] = Math.round(d[i + 3] * .84); }
    }
    g.putImageData(id, 0, 0); return c;
  };
  const fr = s => ({ img: tint(s.img), glow: tint(s.img, true), white: s.white });
  const side = o => ({ r: o.r.map(fr), l: o.l.map(fr) });
  return Object.assign({}, art, { move: side(art.move), idle: side(art.idle), act: side(art.act) });
}
for (const [art, name, desc] of [[BOSS_ART.raubritter, 'Überfall auf Lindach', 'jeden Spieltag um 9 Uhr, also alle 24 Minuten: Eine Raubritterbande zieht ins Dorf, das dann nicht mehr sicher ist. Sind genug Räuber vertrieben (je mehr Ritter, desto mehr), stellt sich ihr Hauptmann Eppelein von Gailingen.'],
  [ghostArt(MON_ART.werwolf), 'Die Wilde Jagd', 'jede Spielnacht um 22 Uhr, im Wechsel über dem Finsterwald, dem Moor und dem Galgenberg: der Wilde Jäger mit seinen Geisterhunden. Bis zum Morgengrauen muss er gebannt sein.']]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  lazySrc(im, () => urlOf(art.idle.r[0].img, 1)); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh); $('evList').append(li);
}
/* Jahreszeiten, Gewölbe, Jagd: Tafeln */
const SEA_ICON = {
  bluete: makeSprite(['...a...', '.a.a.a.', '..aaa..', 'aaabaaa', '..aaa..', '.a.a.a.', '...a...'], { a:'#f0c8d4', b:'#f0d050' }, OUT),
  blatt: makeSprite(['....aa.', '...aaa.', '..aaba.', '.aaba..', '.aba...', 'ab.....', 'b......'], { a:'#d07a28', b:'#6a3a18' }, OUT),
  flocke: makeSprite(['...a...', '.a.a.a.', '..aaa..', 'aaa.aaa', '..aaa..', '.a.a.a.', '...a...'], { a:'#e4ecf8' }, OUT)
};
for (const [im0, name, desc] of [[SEA_ICON.bluete, 'Frühling', 'die Apfelbäume blühen, junges Grün, Zugvögel kehren heim'], [SKY_ICON.sonne, 'Sommer', 'sattes Laub, reifende Äpfel, Falter über den Wiesen, Gewitter'],
  [SEA_ICON.blatt, 'Herbst', 'buntes Laub fällt, im Obstgarten wird geerntet, oft Nebel und Regen'], [SEA_ICON.flocke, 'Winter', 'Schnee auf Dächern und Feldern, kahle Bäume; Fluss und Teiche frieren zu, das Eis trägt']]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  im.src = urlOf(im0, 3); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh); $('seaList').append(li);
}
for (const id of ['krypta', 'keller']){
  const D = DG_DEF[id], li = el('li'), im = el('img'), wh = el('span', 'what', D.name);
  lazySrc(im, () => urlOf(wp_paintV('abgang', D.style, 1).img, 1)); im.alt = ''; im.className = 'horseimg';
  wh.append(el('small', null, 'Stufe ' + D.lvl[0] + '–' + D.lvl[1] + ', ' + (id === 'krypta' ? 'neben der Klosterkirche' : 'im Hof der Raubritterburg') + '. ' + D.elite.name + ' bewacht ' + D.chest + '.'));
  li.append(im, wh); $('dgList').append(li);
}
{ const D = DG_DEF.bergwerk, li = el('li'), im = el('img'), wh = el('span', 'what', D.name);
  lazySrc(im, () => urlOf(wp_paintV('stollen', 0, 1).img, 1)); im.alt = ''; im.className = 'horseimg';
  wh.append(el('small', null, 'im Finsterwald, für Gruppen: Die Stufe richtet sich nach dem stärksten Gefährten (ab 8). Zwei Fallgitter öffnen sich nur, wenn zwei Ritter die Hebel in den Seitenstollen zugleich ziehen. Der Bergdrache bewacht ' + D.chest + ', sein Leben teilen sich alle Kämpfer.'));
  li.append(im, wh); $('dgList').append(li); }
{ const D = DG_DEF.zollburg, li = el('li'), im = el('img'), wh = el('span', 'what', D.name);
  lazySrc(im, () => urlOf(wp_paintV('rad', 0, 1).img, 1)); im.alt = ''; im.className = 'horseimg';
  wh.append(el('small', null, 'unter dem Zollturm auf der Pirateninsel, für vier Ritter, Stufe 18 bis 22: Zwei Fallgitter heben sich nur, wenn zwei Ritter die Schleusenräder zugleich drehen. Im Thronsaal taucht der Nöck zweimal ab und flutet den Saal; dann müssen zwei Ritter die Schieber an der Nordwand zugleich öffnen, während die anderen den Flutwellen durch die Lücke ausweichen. Wer ihn zum ersten Mal bezwingt, bekommt seine Krone.'));
  li.append(im, wh); $('dgList').append(li); }
for (const [kind, name, wares] of [['hase', 'Hase', ['hasenbalg', 'wildbret']], ['reh', 'Reh', ['rehfell', 'wildbret']], ['hirsch', 'Hirsch', ['geweih', 'hirschfell', 'wildbret']],
  ['fuchs', 'Fuchs', ['fuchsbalg']], ['wildschwein', 'Wildschwein', ['hauer', 'schwarte', 'wildbret']]]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name + (kind === 'wildschwein' ? ' (wehrt sich)' : ''));
  lazySrc(im, () => urlOf(trArt(kind, 0).stand, 2)); im.alt = '';
  const sm = el('small'); for (const w of wares){ const ic = el('img'); lazySrc(ic, () => urlOf(WARE_ICON[w], 2)); ic.alt = ''; ic.style.cssText = 'width:20px;height:20px;vertical-align:middle;margin-right:2px'; sm.append(ic); }
  sm.append(wares.map(w => WARES[w].n).join(', ')); wh.append(sm);
  li.append(im, wh); $('huntList').append(li);
}
/* Gasthäuser: Tafel */
for (const inn of INNS){
  const li = el('li'), sp = FARE.filter(f => f.only === inn.id).map(f => f.n);
  li.append(el('b', null, inn.name), el('small', null, inn.where + ' · ' + inn.host), el('span', null, 'Spezialität: ' + (sp.join(', ') || 'Bier und Braten')));
  $('innList').append(li);
}
for (const z of ZONES){
  const li = el('li'), bn = el('b', null, z.name), lv = el('span', 'lv', zoneLvText(z.id));
  li.append(bn, ' ', lv, el('br'), ZONE_INFO[z.id] || ''); $('zoneList').append(li);
}
for (const l of MAP_LABELS){
  const sp = el('span', null, l.name), z = ZONES.find(q => q.name === l.name);
  if (z && zoneLvText(z.id)) sp.append(el('small', null, zoneLvText(z.id)));
  sp.style.left = (l.x / WW * 100) + '%'; sp.style.top = (l.y / WH * 100) + '%'; $('mapLabels').append(sp);
}
RARITY.forEach((r, i) => {
  const li = el('li'), sw = el('span', 'swatch'); sw.style.background = r.c;
  li.append(sw, el('span', null, r.n[0].toUpperCase() + r.n.slice(1)), el('small', null, ['ohne Zusätze', 'ein Zusatz', 'zwei Zusätze', 'drei Zusätze, berühmter Name', 'nur von Anführern'][i]));
  $('rarityList').append(li);
});
$('rankList').innerHTML = '';
for (const [l, n] of TITLES){ const li = el('li'); li.append(el('span', null, n), el('span', null, 'ab Stufe ' + l)); $('rankList').append(li); }
for (const s of SKILLS){
  const li = el('li'), im = el('img'); im.src = ICON_URL[s.icon]; im.alt = '';
  const wh = el('span', 'what', s.name); wh.append(el('small', null, s.desc));
  li.append(im, wh, el('span', 'val', s.lvl > 1 ? 'ab Stufe ' + s.lvl : 'sofort'));
  $('skillList').append(li);
}

/* ---------- Kopfzeile ---------- */
let hudHp = -1;
function updateHud(){
  if (!HERO || !G) return;
  hudHp = -1; updateHp();
  $('gold').textContent = HERO.gold;
  $('potions').textContent = HERO.potions;
  const E = HERO.eh || { n: 0, xp: 0 }, top = HERO.lvl >= MAX_LVL;
  setDisplayText($('rank'), 'Stufe ' + HERO.lvl + ' · ' + (top && E.n ? 'Ehre ' + E.n : titleOf(HERO.lvl)));
  const need = top ? ehNeed(E.n) : xpNeed(HERO.lvl), xp = top ? E.xp : HERO.xp;
  $('xpFill').style.width = clamp(xp / need, 0, 1) * 100 + '%';
  $('xpFill').classList.toggle('eh', top);
  $('xpNum').textContent = xp + ' / ' + need + (top ? ' Ehre' : ' EP');
  const pc = document.querySelector('[data-skill="trank"] .cnt'); if (pc) pc.textContent = HERO.potions;
  [...$('rankList').children].forEach((li, i) => li.classList.toggle('now', titleOf(HERO.lvl) === TITLES[i][1]));
}
function updateHp(){
  const k = G.knight, hp = Math.max(0, Math.ceil(k.hp));
  if (hp === hudHp) return;
  hudHp = hp;
  $('hpFill').style.width = clamp(hp / ST.hp, 0, 1) * 100 + '%';
  $('hpNum').textContent = hp + ' / ' + ST.hp;
  $('hpBox').classList.toggle('low', hp < ST.hp * .3);
}
let bossShown = null;
function updateBossBar(){
  const b = G.mons.find(m => (MON[m.k].boss || (m.story && m.story.boss)) && m.mode === 'fight');
  if (!b){ if (bossShown !== null){ $('bossBar').hidden = true; bossShown = null; } return; }
  if (bossShown !== b.uid){ setDisplayText($('bossName'), (b.nm || MON[b.k].name) + ' ' + b.lvl); $('bossBar').hidden = false; bossShown = b.uid; }
  $('bossFill').style.width = clamp(b.hp / b.max, 0, 1) * 100 + '%';
}
function updateZone(entered){
  const z = ZONE_BY_ID[G.zone], el2 = $('zone');
  if (G.inside){ el2.textContent = G.inside.name; el2.append(el('small', null, (G.inside.church ? 'Kirche ' : 'Gasthaus ') + G.inside.where + ' · sicher')); }
  else {
    el2.textContent = z ? z.name : '';
    if (z && G.zone === 'weiler' && EVT.raid) el2.append(el('small', null, 'Raubritter im Dorf!'));
    else if (z && STY.unsafe === G.zone) el2.append(el('small', null, G.zone === 'weiler' ? 'Kampf im Dorf!' : 'Kampf in der Stadt!'));
    else if (z && zoneLvText(z.id)) el2.append(el('small', null, zoneLvText(z.id)));
  }
  if (entered && !RM){ el2.style.animation = 'none'; void el2.offsetWidth; el2.style.animation = 'zonein 1.2s steps(6)'; }
  if (entered && !G.inside && G.zone === 'weiler' && EVT.raid) logLine('Ihr betretet Lindach. Raubritter plündern das Dorf!', '#ff9a8a');
  else if (entered && !G.inside && SAFE[G.zone] && !isSafe(G.zone)) logLine('Ihr betretet ' + (G.zone === 'weiler' ? 'das Dorf Lindach' : 'die ' + HUB_NAME[G.zone]) + '. Hier wird gekämpft!', '#ff9a8a');
  else if (entered && !G.inside && SAFE[G.zone]) logLine('Ihr betretet ' + (G.zone === 'weiler' || G.zone === 'fischerdorf' ? 'das ' : 'die ') + HUB_NAME[G.zone] + '. Hier seid Ihr sicher.', '#9fe08a');
  if (entered && G.inside) logLine(G.inside.church ? 'Ihr tretet ein: ' + G.inside.name + '. Hier ist es still und kühl.' : 'Ihr tretet ein: ' + G.inside.name + '. ' + G.inside.host + ' hat Speis und Trank.', '#ffd98a');
}
let bannerTimer = 0;
/* Ziffern und römische Zahlen in der Lesefont, die Frakturschrift macht sie schwer lesbar */
function setDisplayText(el2, text){
  el2.textContent = '';
  String(text).split(/(\d+|\b[IVX]+\b)/).forEach((part, i) => {
    if (!part) return;
    if (i % 2){ const sp = el('span', 'num', part); el2.append(sp); }
    else el2.append(part);
  });
}
function showBanner(text, sub){
  const b = $('banner');
  setDisplayText(b, text);
  if (sub) b.append(el('small', null, sub));
  b.hidden = false; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { b.hidden = true; }, 2200);
}
/* Meldungen unten links: Beute, Aufträge, Gespräche */
function logLine(text, color, parts){
  const box = $('log'), p = el('p');
  if (parts) p.append(...parts); else p.textContent = text;
  if (color) p.style.color = color;
  box.append(p);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => { p.classList.add('old'); }, 7000);
  setTimeout(() => { p.remove(); }, 9000);
}
function logItem(prefix, it){
  const s = el('span', null, itemName(it)); s.style.color = RARITY[it.r].c;
  logLine('', null, [prefix, s]);
}
function renderTracker(){
  const box = $('tracker');
  box.textContent = '';
  if (!HERO) return;
  if (G && G.watch){ const p = el('p', 'ev'); p.append(el('b', null, 'Tjost: '), G.watch); box.append(p); }
  stRows(box); asRows(box); ehRows(box); evRows(box); tnRows(box); chRows(box); partyRows(box);
  for (const q of HERO.quests){
    const d = qInfo(q); if (!d) continue;
    const done = q.n >= d.need, p = el('p', done ? 'done' : '');
    p.append(el('b', null, d.t), ' ', el('span', null, done ? 'abgeben' : Math.min(q.n, d.need) + ' / ' + d.need));
    box.append(p);
  }
}

/* ---------- Fähigkeiten ---------- */
const SKILL_FN = { hieb: () => attack(), rund: skillRund, stoss: skillStoss, ruf: skillRuf, trank: drinkPotion, pferd: () => toggleHorse() };
function buildSkills(){
  const bar = $('skills');
  bar.textContent = '';
  for (const s of SKILLS){
    const b = el('button', 'skill'); b.type = 'button'; b.dataset.skill = s.id;
    const im = el('img'); im.src = ICON_URL[s.icon]; im.alt = '';
    b.append(im, el('span', 'key', s.key), el('span', 'cd'), el('span', 'lock', s.id === 'pferd' ? 'Stall' : 'Stufe ' + s.lvl));
    if (s.id === 'trank') b.append(el('span', 'cnt', '0'));
    b.setAttribute('aria-label', s.name + (touchUI() ? '' : ', Taste ' + s.key));
    b.title = s.name + ': ' + s.desc;
    if (s.id === 'hieb'){
      b.addEventListener('pointerdown', e => { e.preventDefault(); Sound.init(); atkBtn = true; attack(); try { b.setPointerCapture(e.pointerId); } catch(err){} });
      const end = () => { atkBtn = false; };
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('lostpointercapture', end);
    } else b.addEventListener('pointerdown', e => { e.preventDefault(); Sound.init(); SKILL_FN[s.id](); });
    b.addEventListener('contextmenu', e => e.preventDefault());
    bar.append(b);
  }
  renderSkills();
}
function renderSkills(){
  if (!HERO) return;
  for (const s of SKILLS){
    const b = document.querySelector('[data-skill="' + s.id + '"]');
    if (b) b.classList.toggle('locked', HERO.lvl < s.lvl || (s.id === 'pferd' && !HERO.horse));
  }
  const pb = document.querySelector('[data-skill="pferd"]');
  if (pb){ pb.classList.toggle('on', !!HERO.riding); if (HERO.horse){ const im = pb.querySelector('img'); HO_ICON[HERO.horse] = HO_ICON[HERO.horse] || urlOf(horseIcon(HERO.horse), 3); im.src = HO_ICON[HERO.horse]; } }
  // Schildstoß und Schlachtruf mit dem Wappen der eigenen Herkunft
  const set = knightSet(HERO.f), F = KN_FACTIONS[HERO.f];
  set.url = set.url || urlOf(set.icon, 3);
  for (const id of ['stoss', 'ruf']){ const im = document.querySelector('[data-skill="' + id + '"] img'); if (im) im.src = set.url; }
  const rb = document.querySelector('[data-skill="ruf"]'); if (rb) rb.title = 'Schlachtruf „' + F.cry + '“: 10 Sekunden lang +30 % Schaden und +10 % Volltreffer';
  wtSkillUi();
}
const HO_ICON = {};
function horseIcon(hid){ const c = canvasOf(16, 16), sp = horseSet(hid, HERO ? HERO.f : 'reich').left[4].under; c.getContext('2d').drawImage(sp, 1, 0, 18, 18, -1, -1, 18, 18); return c; }
/* Stärkung durch Speis und Trank in der Kopfzeile */
const MOOD_ICON = makeSprite(['....aab', '....ab.', '....a..', '....a..', '.aaaa..', 'aaaaa..', 'aaaa...', '.aa....'], { a:'#ecd27a', b:'#9a7420' }, OUT);
function renderBuffs(){
  const box = $('buffs'); box.textContent = '';
  if (!HERO) return;
  if (HERO.mood && HERO.mood.t > 0){ const chip = el('span', 'buff'), im = el('img'); im.src = urlOf(MOOD_ICON, 3); im.alt = ''; chip.append(im, el('span', null, Math.ceil(HERO.mood.t / 60) + ' Min.')); chip.title = 'Gute Laune: +10 % Erfahrung'; box.append(chip); }
  for (const key of ['food', 'drink']){
    const b = HERO[key], f = b && FARE_BY[b.id];
    if (!f) continue;
    const chip = el('span', 'buff'), im = el('img'); im.src = ICON_URL[f.icon] || urlOf(ICONS[f.icon], 3); im.alt = '';
    chip.append(im, el('span', null, Math.ceil(b.t / 60) + ' Min.'));
    chip.title = f.n + ': ' + fxText(f.fx);
    box.append(chip);
  }
  chBuffs(box);
  asBuffs(box);
}
const cdShown = {};
function updateSkillCd(){
  for (const s of SKILLS){
    if (!s.cd) continue;
    const c = G.cd[s.id] || 0, T = G.cdTop || (G.cdTop = {});
    T[s.id] = c > 0 ? Math.max(T[s.id] || 0, c) : 0;
    const v = Math.round(clamp(c / Math.max(s.cd, T[s.id]), 0, 1) * 20) / 20;
    if (cdShown[s.id] === v) continue;
    cdShown[s.id] = v;
    const b = document.querySelector('[data-skill="' + s.id + '"] .cd'); if (b) b.style.height = v * 100 + '%';
  }
}

/* ---------- Fenster ---------- */
const OVERLAYS = ['ovStart', 'ovPause', 'ovMap', 'ovBag', 'ovQuests', 'ovTalk', 'ovDead', 'ovKeys', 'ovNotes'];
function showOverlay(id){ OVERLAYS.forEach(o => { $(o).hidden = o !== id; }); }
function blurActive(){ if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
function openPanel(id){
  if (G.mode !== 'play' && G.mode !== 'menu') return false;
  G.mode = 'menu'; keys.clear(); atkHeld = false; atkBtn = false; padVec = { x: 0, y: 0 }; markArms();
  showOverlay(id);
  return true;
}
function closePanel(){
  if (G.mode !== 'menu') return;
  if (NET.tr && !NET.tr.done && G.talk && G.talk.key === 'trade'){ const T = NET.tr; NET.tr = null; logLine('Der Handel mit ' + T.nm + ' ist abgebrochen.', '#d8c69c'); sendPresence(true); }
  if (NET.dc && G.talk && G.talk.key === 'dicepvp'){ NET.dc = null; sendPresence(true); }
  G.mode = 'play'; G.talk = null; G.sel = null;
  showOverlay(null); blurActive();
}

/* ---------- Karte ---------- */
function drawFullMap(){
  const c = $('mapCv'), g = c.getContext('2d'), s = GW / c.width, k = G.knight, P = v => v / s | 0;
  g.imageSmoothingEnabled = false; g.drawImage(FULLMAP, 0, 0, c.width, c.height);
  for (const [kind, p] of Object.entries(LAIRS)){ g.fillStyle = '#5a1012'; g.fillRect(P(p.x) - 4, P(p.y) - 4, 9, 9); g.fillStyle = HERO.bosses[kind] ? '#7a6a5a' : '#c8343c'; g.fillRect(P(p.x) - 3, P(p.y) - 3, 7, 7); g.fillStyle = '#ecd27a'; g.fillRect(P(p.x) - 1, P(p.y) - 1, 3, 3); }
  for (const n of NPCS){ g.fillStyle = '#16120f'; g.fillRect(P(n.x) - 3, P(n.y) - 3, 7, 7); g.fillStyle = npcMark(n) ? '#ffd541' : '#5ac85a'; g.fillRect(P(n.x) - 2, P(n.y) - 2, 5, 5); }
  for (const q of HERO.quests){
    const d = qInfo(q); if (!d || q.n >= d.need) continue;
    const z = ZONE_BY_ID[d.zone]; if (!z) continue;
    g.strokeStyle = '#c9a227'; g.lineWidth = 2; g.setLineDash([4, 3]); g.beginPath(); g.arc(P(z.label.x), P(z.label.y) + 14, 22, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  }
  for (const m of G.mons){ g.fillStyle = MON[m.k].boss ? '#8e1b1b' : '#3a1014'; g.fillRect(P(m.x) - 1, P(m.y) - 1, 3, 3); }
  for (const inn of INNS){ g.fillStyle = '#16120f'; g.fillRect(P(inn.dx) - 3, P(inn.y) - 3, 7, 7); g.fillStyle = '#e0823a'; g.fillRect(P(inn.dx) - 2, P(inn.y) - 2, 5, 5); }
  for (const p of PEERS.values()){ const at = peerAt(p), px = P(at ? at.x : p.x) + (at ? 5 : 0), py = P(at ? at.y : p.y); g.fillStyle = '#16120f'; g.fillRect(px - 3, py - 3, 7, 7); g.fillStyle = inParty(p) ? '#7fe08a' : '#6a9ae0'; g.fillRect(px - 2, py - 2, 5, 5); if (inParty(p)){ g.font = '12px monospace'; g.fillStyle = '#16120f'; g.fillText(p.nm, px + 6, py + 5); g.fillStyle = '#cfeec2'; g.fillText(p.nm, px + 5, py + 4); } }
  const stm = stTarget(); if (stm){ const sx = P(stm.x), sy = P(stm.y); g.fillStyle = '#16120f'; g.beginPath(); g.moveTo(sx, sy - 8); g.lineTo(sx + 7, sy); g.lineTo(sx, sy + 8); g.lineTo(sx - 7, sy); g.fill(); g.fillStyle = '#ffd541'; g.beginPath(); g.moveTo(sx, sy - 6); g.lineTo(sx + 5, sy); g.lineTo(sx, sy + 6); g.lineTo(sx - 5, sy); g.fill(); }
  const es = evMark2(); if (es){ const ex = P(es.x), ey = P(es.y); g.fillStyle = '#16120f'; g.fillRect(ex - 1, ey - 14, 3, 16); g.fillRect(ex + 1, ey - 15, 10, 8); g.fillStyle = '#d0343c'; g.fillRect(ex + 2, ey - 14, 8, 6); g.fillStyle = '#e8dcbc'; g.fillRect(ex, ey - 13, 1, 14); }
  const kx = P(k.x), ky = P(k.y);
  g.fillStyle = '#16120f'; g.fillRect(kx - 4, ky - 4, 9, 9); g.fillStyle = '#ecd27a'; g.fillRect(kx - 3, ky - 3, 7, 7); g.fillStyle = '#b0242a'; g.fillRect(kx - 1, ky - 1, 3, 3);
}
function openMap(){ if (G.inside || !openPanel('ovMap')) return; drawFullMap(); $('btnMapClose').focus({ preventScroll: true }); }

/* ---------- Rucksack und Ausrüstung ---------- */
const STAT_ROWS = [['hp', 'Leben'], ['dmg', 'Schaden'], ['arm', 'Rüstung'], ['crit', '% Volltreffer'], ['spd', '% Hiebtempo'], ['block', '% Abwehr']];
function statDiff(it){
  const cur = heroStats(HERO), nxt = heroStats(Object.assign({}, HERO, { eq: Object.assign({}, HERO.eq, { [it.s]: it }) }));
  return STAT_ROWS.map(([k, n]) => [n, nxt[k] - cur[k]]).filter(([, d]) => d);
}
function itemCard(it, compare){
  if (it.s === 'ware'){
    const box = el('div', 'icard'), head = el('div', 'ihead'), im = el('img');
    im.src = itemUrl(it); im.alt = ''; im.style.boxShadow = '0 0 0 2px ' + RARITY[it.r].c;
    const nm = el('b', null, itemName(it)); nm.style.color = RARITY[it.r].c;
    const tx = el('div'); tx.append(nm, el('small', null, (WARES[it.w].fish ? 'Fang aus dem Wasser' : 'Handelsware aus der Jagd') + (it.q > 1 ? ', ' + it.q + ' Stück' : ''))); head.append(im, tx); box.append(head);
    box.append(el('p', 'idiff', WARES[it.w].wirt ? 'Der Krämer kauft es, der Wirt zahlt mehr.' : 'Der Krämer kauft es.'));
    box.append(el('p', 'ival', 'Wert: ' + itemValue(it) + ' Gulden'));
    return box;
  }
  const box = el('div', 'icard'), head = el('div', 'ihead'), im = el('img');
  im.src = itemUrl(it); im.alt = ''; im.style.boxShadow = '0 0 0 2px ' + RARITY[it.r].c;
  const nm = el('b', null, itemName(it)); nm.style.color = RARITY[it.r].c;
  const sub = el('small', null, (it.s === 'waffe' ? WT[wtOf(it)].n : isBib(it) ? 'Nebenhand' : SLOT_NAME[it.s]) + ' · Stufe ' + it.il + ' · ' + RARITY[it.r].n);
  const tx = el('div'); tx.append(nm, sub); head.append(im, tx); box.append(head);
  const ul = el('ul', 'ilines'); for (const l of itemLines(it)) ul.append(el('li', null, l)); box.append(ul);
  if (it.s === 'waffe') box.append(el('p', 'idiff', WT[wtOf(it)].n + ': ' + WT[wtOf(it)].d + '.'));
  if (isBib(it)) box.append(el('p', 'idiff', 'In der Nebenhand statt des Schildes: keine Rüstung und keine Abwehr, dafür schnellere Erholung, +' + BIB_UNDEAD + ' % Schaden gegen Untote und Geister, und F wird zum Gebet (heilt ' + BIB_HEAL + ' % des Lebens).'));
  if (compare){
    const diff = statDiff(it);
    if (diff.length){
      const c = el('p', 'idiff'); c.append('Statt jetzt: ');
      diff.forEach(([n, d], i) => { const s = el('span', d > 0 ? 'up' : 'down', (d > 0 ? '+' : '−') + Math.abs(d) + ' ' + n); c.append(i ? ', ' : '', s); });
      box.append(c);
    } else if (HERO.eq[it.s] !== it) box.append(el('p', 'idiff', 'Keine Änderung zu deiner Ausrüstung.'));
  }
  box.append(el('p', 'ival', 'Wert: ' + it.v + ' Gulden'));
  return box;
}
function equipFrom(i){
  const it = HERO.inv[i]; if (!it || it.s === 'ware') return;
  const old = HERO.eq[it.s];
  HERO.eq[it.s] = it; HERO.inv[i] = old || null;
  if (!wtFix(it, i, old)) return;
  refreshStats(); Sound.equip(); updateHud(); markDirty(true);
  G.sel = { from:'eq', slot: it.s };
  renderBag(); renderSkills();
}
function unequip(slot){
  const it = HERO.eq[slot], j = HERO.inv.indexOf(null);
  if (!it) return;
  if (j < 0){ logLine('Der Rucksack ist voll.', '#ff9a8a'); return; }
  HERO.inv[j] = it; HERO.eq[slot] = null;
  refreshStats(); Sound.equip(); updateHud(); markDirty(true);
  G.sel = { from:'inv', i: j };
  renderBag(); renderSkills();
}
function selItem(){
  const s = G.sel; if (!s) return null;
  return s.from === 'inv' ? HERO.inv[s.i] : HERO.eq[s.slot];
}
function renderBag(){
  const fk = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.slot : null;
  renderBag0();
  if (fk){ const b = document.querySelector('[data-slot="' + fk + '"]'); if (b) b.focus({ preventScroll: true }); }
}
function renderBag0(){
  const doll = $('doll'), grid = $('bagGrid'), info = $('itemInfo'), stats = $('statList');
  doll.textContent = ''; grid.textContent = ''; info.textContent = ''; stats.textContent = '';
  const slotBtn = (it, label, onSel, onUse, selected) => {
    const b = el('button', 'slot' + (selected ? ' sel' : '') + (it ? '' : ' empty')); b.type = 'button';
    if (it){ const im = el('img'); im.src = itemUrl(it); im.alt = ''; b.append(im); if (it.q > 1) b.append(el('span', 'qty', '×' + it.q)); b.style.setProperty('--rc', RARITY[it.r].c); b.setAttribute('aria-label', itemName(it)); if (!label && itemGain(it) > .5) b.classList.add('better'); }
    else b.setAttribute('aria-label', (label || 'Platz') + ', leer');
    let last = 0;
    b.addEventListener('click', () => { const t = performance.now(); if (it && t - last < 400 && onUse){ onUse(); return; } last = t; Sound.click(); onSel(); });
    return b;
  };
  for (const s of SLOTS){
    const it = HERO.eq[s], wrap = el('div', 'dslot');
    const sb = slotBtn(it, SLOT_NAME[s], () => { G.sel = it ? { from:'eq', slot:s } : null; renderBag(); }, () => unequip(s), G.sel && G.sel.from === 'eq' && G.sel.slot === s); sb.dataset.slot = 'eq:' + s;
    wrap.append(sb, el('span', 'dname', SLOT_NAME[s]));
    doll.append(wrap);
  }
  HERO.inv.forEach((it, i) => { const sb = slotBtn(it, '', () => { G.sel = it ? { from:'inv', i } : null; renderBag(); }, () => equipFrom(i), G.sel && G.sel.from === 'inv' && G.sel.i === i); sb.dataset.slot = 'inv:' + i; grid.append(sb); });
  const st = ST;
  for (const [k, n] of [['Stufe', HERO.lvl + ' · ' + titleOf(HERO.lvl)], ['Leben', st.hp], ['Schaden', st.dmg], ['Rüstung', st.arm + ' (−' + Math.round(st.mit * 100) + ' %)'], ['Volltreffer', st.crit + ' %'], ['Hiebtempo', '+' + st.spd + ' %'], ['Abwehr', st.block + ' %'], ['Gulden', HERO.gold], ['Erschlagen', HERO.kills], ['Harnisch', GEAR_NAME[HERO.eq.ruestung ? HERO.eq.ruestung.r : 0]]].concat(HERO.joust ? [['Tjost', HERO.joust.wins + ' Siege']] : []).concat(HERO.hunted ? [['Gejagt', HERO.hunted + ' Stück Wild']] : []).concat(HERO.lvl >= MAX_LVL || HERO.eh.n ? [['Ehrenstufe', HERO.eh.n + ' (' + HERO.eh.xp + ' / ' + ehNeed(HERO.eh.n) + ')'], ['Ehrenzeichen', HERO.ez | 0], ['Trophäen', (HERO.trs || []).length + ' von ' + TROPHIES.length]] : [])){
    stats.append(el('dt', null, k), el('dd', null, n));
  }
  $('bagCount').textContent = HERO.inv.filter(Boolean).length + ' / 24';
  const it = selItem();
  if (!it){ info.append(el('p', 'hint', touchUI() ? 'Tippe einen Gegenstand an. Zweimal tippen legt ihn an.' : 'Wähle einen Gegenstand. Doppelklick legt ihn an oder ab.')); return; }
  info.append(itemCard(it, G.sel.from === 'inv'));
  const acts = el('div', 'acts');
  if (G.sel.from === 'inv'){
    if (it.s !== 'ware') acts.append(btn('Anlegen', () => equipFrom(G.sel.i), 'btn small'));
    const drop = btn(G.dropAsk ? 'Wirklich wegwerfen?' : 'Wegwerfen', () => {
      if (!G.dropAsk){ G.dropAsk = true; renderBag(); return; }
      G.dropAsk = false; HERO.inv[G.sel.i] = null; G.sel = null; markDirty(true); renderBag();
    }, 'tbtn');
    acts.append(drop);
  } else acts.append(btn('Ablegen', () => unequip(G.sel.slot), 'btn small'));
  info.append(acts);
}
function openBag(){ if (!openPanel('ovBag')) return; G.sel = null; G.dropAsk = false; renderBag(); $('btnBagClose').focus({ preventScroll: true }); }

/* ---------- Auftragsbuch ---------- */
function renderQuests(){
  const box = $('questList'); box.textContent = '';
  stQuestCard(box);
  if (!HERO.quests.length){ box.append(el('p', 'hint', 'Kein Auftrag. Der Vogt in der Reichsburg und der Bürgermeister der Reichsstadt haben Arbeit für Euch.')); return; }
  for (const q of HERO.quests){
    const d = qInfo(q), r = qReward(d), done = q.n >= d.need, card = el('div', 'qcard' + (done ? ' done' : ''));
    card.append(el('h4', null, d.t), el('p', null, d.d));
    const goal = d.boss ? MON[d.boss].name + ' erschlagen' : d.kind ? d.need + ' × ' + MON[d.kind].name + ' im Gebiet ' + ZONE_BY_ID[d.zone].name : d.need + ' Monster im Gebiet ' + ZONE_BY_ID[d.zone].name;
    card.append(el('p', 'qgoal', 'Ziel: ' + goal + ' (' + zoneLvText(d.zone) + ')'));
    card.append(el('p', 'qprog', done ? 'Erfüllt. Kehrt zum ' + (d.giver === 'vogt' ? 'Vogt in der Reichsburg' : 'Bürgermeister in der Reichsstadt') + ' zurück.' : 'Fortschritt: ' + q.n + ' / ' + d.need));
    card.append(el('p', 'qrew', 'Lohn: ' + r.xp + ' EP, ' + r.gold + ' Gulden' + (r.rar ? ', ein ' + RARITY[r.rar].n + 'er Gegenstand' : '')));
    card.append(btn('Aufgeben', () => { HERO.quests = HERO.quests.filter(x => x !== q); renderQuests(); renderTracker(); markDirty(true); }, 'tbtn'));
    box.append(card);
  }
}
function openQuests(){ if (!openPanel('ovQuests')) return; renderQuests(); $('btnQuestsClose').focus({ preventScroll: true }); }

/* ---------- Gespräche, Aufträge vergeben, Handel ---------- */
function availableQuests(giver){
  return QUESTS.filter(q => q.giver === giver && q.lvl <= HERO.lvl + 1 && !HERO.done.includes(q.id) && !HERO.quests.some(x => x.id === q.id) && (!q.after || HERO.done.includes(q.after)));
}
function updateNear(force){
  const k = G.knight;
  let best = null, bd = 40, door = null, exit = false;
  for (const n of (G.inside ? innRoom(G.inside).npcs : NPCS)){ const d = Math.hypot(n.x - k.x, n.y - k.y); if (d < bd){ bd = d; best = n; } }
  if (G.inside) exit = !best && k.y > ROOM_DOOR.y - 26 && Math.abs(k.x - ROOM_DOOR.x) < 24;
  else if (!best) for (const inn of INNS.concat(CHURCHES)) if (Math.abs(k.x - inn.dx) < 18 && k.y > inn.y && k.y - inn.y < 44) door = inn;
  if (!best && !door && !G.inside) for (const d of DG_DOORS) if (Math.abs(k.x - d.x) < 28 && k.y > d.y - 8 && k.y - d.y < 46) door = d;
  let pq = !door && cloud.room ? nearPeer(bd) : null;   // ein Ritter steht näher als jeder andere
  if (pq){ best = null; exit = false; }
  const ea = G.inside ? null : evAction();   // Weltereignis: Eimer füllen, Feuer löschen
  if (ea){ best = null; door = null; exit = false; pq = null; }
  const eaKey = ea ? ea.key : '';
  const fo = !best && !door && !exit && !pq && !ea && !G.fish && canFish() && !!waterAhead(k), fk = G.fish ? 'f' + G.fish.st : fo ? 'o' : '';
  if (force || best !== G.near || door !== G.nearDoor || exit !== G.nearExit || pq !== G.nearPeer || eaKey !== (G.evActKey || '') || fk !== (G.fishKey || '')){
    G.near = best; G.nearDoor = door; G.nearExit = exit; G.nearPeer = pq; G.evAct = ea; G.evActKey = eaKey; G.fishOk = fo; G.fishKey = fk;
    const b = $('btnTalk');
    b.hidden = !best && !door && !exit && !pq && !ea && !fk;
    b.textContent = G.fish ? (G.fish.st === 'bite' ? 'Anschlagen!' : 'Angel einholen') : fo ? 'Angeln' : ea ? ea.label : pq ? 'Ritter ansprechen: ' + pq.nm : best ? 'Sprechen: ' + best.name : door ? (door.dg ? 'Hinabsteigen: ' : 'Eintreten: ') + door.name : 'Hinausgehen';
  }
}
function talk(){
  if (G.mode !== 'play') return;
  if (DG_ON) return dgInteract();
  if (G.fish){ if (Math.hypot(G.knight.x - G.fish.kx, G.knight.y - G.fish.ky) > 8) stopFish(); else return fishAct(); }
  if (G.evAct) return evDo(G.evAct);
  if (G.nearPeer && PEERS.get(G.nearPeer.peer) === G.nearPeer) openPeer(G.nearPeer);
  else if (G.near) openTalk(G.near);
  else if (G.nearDoor) (G.nearDoor.dg ? enterDungeon : enterInn)(G.nearDoor);
  else if (G.nearExit) leaveInn();
  else if (G.fishOk && startFish()) return;
  else stTalkFallback();
}
function npcUrl(n){ return NPC_URL[n.key] || (NPC_URL[n.key] = urlOf(n.art.frames[0], 3)); }
function openTalk(n){
  if (!openPanel('ovTalk')) return;
  G.talk = n; G.loreI = Math.random() * 20 | 0;
  G.greet = n.greet ? pick(n.greet) : n.lore ? n.lore[G.loreI % n.lore.length] : HERO.kills < 3 && !HERO.done.length ? NPC_TEXT[n.id][0] : pick(NPC_TEXT[n.id]);
  $('talkImg').src = npcUrl(n); $('talkName').textContent = n.name; $('talkRole').textContent = n.role;
  renderTalk('main');
}
function acceptQuest(q){
  if (HERO.quests.length >= 4) return;
  HERO.quests.push(q.id === 'kg' ? q : { id: q.id, n: 0 });
  Sound.choose(); logLine('Neuer Auftrag: ' + qInfo(q.id === 'kg' ? q : { id: q.id }).t, '#ecd27a');
  renderTracker(); markDirty(true);
}
function completeQuest(q){
  const d = qInfo(q), r = qReward(d);
  HERO.quests = HERO.quests.filter(x => x !== q);
  if (q.id !== 'kg') HERO.done.push(q.id);
  HERO.gold += r.gold;
  let it = null;
  if (r.rar){
    const empty = SLOTS.filter(s => !HERO.eq[s]), slot = empty.length ? pick(empty) : pick(SLOTS);
    it = makeItem(slot, d.lvl + 1, r.rar);
    const j = HERO.inv.indexOf(null);
    if (j >= 0) HERO.inv[j] = it; else dropLoot(G.knight, 'item', 0, it);
  }
  Sound.quest(); showBanner('Auftrag abgeschlossen', '+' + r.xp + ' EP · +' + r.gold + ' Gulden');
  logLine('Auftrag abgeschlossen: ' + d.t + '. +' + r.gold + ' Gulden.', '#ecd27a');
  if (it) logItem('Belohnung: ', it);
  gainXp(r.xp); renderTracker(); updateHud(); pushFame(); markDirty(true);
}
function renderTalk(view){
  const a = document.activeElement, slot = a && a.dataset ? a.dataset.slot : null;
  renderTalk0(view);
  if (G.talk) numberKeys($('talkBody'));
  if (slot){ const b = $('talkBody').querySelector('[data-slot="' + slot + '"]'); if (b && !b.disabled) b.focus({ preventScroll: true }); }   // Auswahl bleibt beim Neuzeichnen
}
function renderTalk0(view){
  const n = G.talk, body = $('talkBody'); body.textContent = '';
  if (!n) return;
  if (n.peerTalk){ peerView(view, body, el('div', 'opts')); return; }
  const opts = el('div', 'opts');
  if (view === 'story'){ stChoiceView(body, opts); return; }
  if (view === 'main'){
    $('talkText').textContent = G.greet;
    stTalkOpts(n, opts);
    if (n.quest){
      for (const q of HERO.quests){ const d = qInfo(q); if (d.giver === n.id && q.n >= d.need) opts.append(btn('Auftrag abgeben: ' + d.t, () => { completeQuest(q); renderTalk('main'); }, 'opt ready')); }
      for (const q of availableQuests(n.id)) opts.append(btn('Auftrag: ' + q.t + ' (Stufe ' + q.lvl + ')', () => renderTalk({ q }), 'opt new'));
      if (!HERO.quests.some(q => q.id === 'kg')){
        const zone = bountyZone(HERO.lvl), kg = { id:'kg', zone, need:10, n:0, lvl: HERO.lvl, giver: n.id };
        opts.append(btn('Kopfgeld: ' + ZONE_BY_ID[zone].name + ' (wiederholbar)', () => renderTalk({ q: kg }), 'opt'));
      }
      if (HERO.bind !== n.hub) opts.append(btn('Hier rasten: nach dem Tod ' + HUB_IN[n.hub] + ' erwachen', () => { HERO.bind = n.hub; Sound.bell(); logLine('Ihr erwacht künftig ' + HUB_IN[n.hub] + '.', '#9fe08a'); markDirty(true); renderTalk('main'); }, 'opt'));
      else opts.append(el('p', 'hint', 'Ihr rastet hier: Nach dem Tod erwacht Ihr ' + HUB_IN[n.hub] + '.'));
    }
    if (n.wirt){
      const meat = HERO.inv.filter(it => it && it.s === 'ware' && WARES[it.w].wirt);
      if (meat.length) opts.append(btn((meat.some(it => WARES[it.w].fish) ? 'Wildbret und Fisch' : 'Wildbret') + ' verkaufen (' + meat.reduce((a, it) => a + (it.q || 1), 0) + ' Stück für ' + meat.reduce((a, it) => a + Math.round(itemValue(it) * 1.6), 0) + ' Gulden)', () => { sellMeat(); renderTalk('main'); }, 'opt'));
      opts.append(btn('Speisen', () => renderTalk('speise'), 'opt'), btn('Getränke', () => renderTalk('trank'), 'opt'));
      if (HERO.bind !== n.inn) opts.append(btn('Eine Kammer für die Nacht: nach dem Tod hier erwachen', () => { HERO.bind = n.inn; Sound.bell(); logLine('Ihr erwacht künftig ' + HUB_IN[n.inn] + '.', '#9fe08a'); markDirty(true); renderTalk('main'); }, 'opt'));
      else opts.append(el('p', 'hint', 'Eure Kammer ist bereit: Nach dem Tod erwacht Ihr hier.'));
    }
    if (n.lore) opts.append(btn('Erzählt weiter', () => { G.loreI++; G.greet = n.lore[G.loreI % n.lore.length]; renderTalk('main'); }, 'opt'));
    if (n.id === 'spielmann' && G.inside) for (const [id, name] of SONGS){ const b = btn(name + ' spielen lassen (1 Gulden)', () => { requestSong(id, name); renderTalk('main'); }, 'opt'); b.disabled = HERO.gold < 1; opts.append(b); }
    if (n.dice) opts.append(btn('Würfeln', () => { G.dice = null; renderTalk('dice'); }, 'opt'));
    if (n.fest) festTalk(n, opts);
    if (n.shop){ opts.append(btn('Handeln: kaufen', () => renderTalk('buy'), 'opt'), btn('Handeln: verkaufen', () => renderTalk('sell'), 'opt')); }
    if (n.stable) opts.append(btn('Pferde ansehen', () => renderTalk('stable'), 'opt'));
    if (n.smith) opts.append(btn('Ausrüstung verbessern', () => renderTalk('smith'), 'opt'));
    if (n.joust) opts.append(btn('Zum Tjost antreten', () => renderTalk('joust'), 'opt'), btn('Großes Turnier' + (tnView() ? ' (' + (tnView().T.st === 'an' ? 'Anmeldung' : 'läuft') + ')' : ''), () => renderTalk('turnier'), 'opt'), btn('Wappenrolle: Ritterorden' + (HERO.or ? ' (' + HERO.or.kz + ')' : ''), () => renderTalk('orden'), 'opt'));
    strTalkOpts(n, opts);
    wtTalkOpts(n, opts);
    chTalkOpts(n, opts);
    ehTalkOpts(n, opts);
    asTalkOpts(n, opts);
    opts.append(btn('Lebt wohl', closePanel, 'opt'));
    body.append(opts);
  } else if (view.q){
    const q = view.q, d = qInfo(q), r = qReward(d);
    $('talkText').textContent = d.d;
    const card = el('div', 'qcard');
    card.append(el('h4', null, d.t));
    const goal = d.boss ? MON[d.boss].name + ' erschlagen' : d.kind ? d.need + ' × ' + MON[d.kind].name + ' im Gebiet ' + ZONE_BY_ID[d.zone].name : d.need + ' Monster im Gebiet ' + ZONE_BY_ID[d.zone].name;
    card.append(el('p', 'qgoal', 'Ziel: ' + goal + ' (' + zoneLvText(d.zone) + ')'));
    card.append(el('p', 'qrew', 'Lohn: ' + r.xp + ' EP, ' + r.gold + ' Gulden' + (r.rar ? ', ein ' + RARITY[r.rar].n + 'er Gegenstand' : '')));
    body.append(card);
    if (HERO.quests.length >= 4) opts.append(el('p', 'hint', 'Ihr habt schon vier Aufträge. Gebt erst einen ab oder auf.'));
    else opts.append(btn('Annehmen', () => { acceptQuest(q); renderTalk('main'); }, 'btn small'));
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  } else if (view === 'speise' || view === 'trank'){
    const cur = HERO[view === 'speise' ? 'food' : 'drink'], cf = cur && FARE_BY[cur.id];
    $('talkText').textContent = (view === 'speise' ? 'Was soll es zu essen sein?' : 'Was darf ich einschenken?') + ' Ihr habt ' + HERO.gold + ' Gulden.'
      + (cf ? ' Noch wirkt: ' + cf.n + ' (' + Math.ceil(cur.t / 60) + ' Min.).' : '');
    for (const f of FARE){
      if (f.kind !== view || (f.only && f.only !== n.inn) || f.fest) continue;
      const r = el('div', 'shoprow'), ic = el('img'); ic.src = ICON_URL[f.icon] || urlOf(ICONS[f.icon], 3); ic.alt = '';
      const t = el('div', 'stx'), nm = el('b', null, f.n + (f.only ? ' (Spezialität des Hauses)' : ''));
      t.append(nm, el('small', null, fxText(f.fx) + ' · ' + FARE_MIN + ' Minuten'));
      const price = farePrice(f), b = btn((view === 'speise' ? 'Essen für ' : 'Trinken für ') + price, () => { eatFare(f); renderTalk(view); }, 'tbtn');
      b.disabled = HERO.gold < price;
      r.append(ic, t, b); body.append(r);
    }
    body.append(el('p', 'hint', 'Eine Speise und ein Getränk wirken zugleich. Was Ihr neu bestellt, ersetzt das alte.'));
    opts.append(btn(view === 'speise' ? 'Getränke' : 'Speisen', () => renderTalk(view === 'speise' ? 'trank' : 'speise'), 'tbtn'), btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  } else if (view === 'stable'){
    $('talkText').textContent = 'Ihr habt ' + HERO.gold + ' Gulden. Mit H (oder dem Pferd in der Leiste) sitzt Ihr auf und ab. Im Sattel wird der Hieb zum Lanzenstoß, wer getroffen wird, fällt vom Pferd.';
    for (const hid of HORSE_IDS){
      const h = HORSES[hid], r = el('div', 'shoprow'), ic = el('img');
      HO_ICON['big_' + hid] = HO_ICON['big_' + hid] || urlOf(horseSet(hid, HERO.f).right[4].under, 1);
      ic.src = HO_ICON['big_' + hid]; ic.alt = ''; ic.className = 'horseimg';
      const t = el('div', 'stx');
      t.append(el('b', null, h.name), el('small', null, 'ab Stufe ' + h.lvl + ' · ' + Math.round((h.speed - 1) * 100) + ' % schneller · ' + h.desc));
      const own = HERO.horse === hid, have = HERO.horse && HORSES[HERO.horse].price >= h.price;
      const b = btn(own ? 'Euer Pferd' : 'Kaufen für ' + h.price, () => {
        if (HERO.gold < h.price || HERO.lvl < h.lvl || have) return;
        HERO.gold -= h.price; HERO.horse = hid; Sound.neigh(); Sound.coin();
        logLine('Ihr kauft ' + h.art + ' ' + h.name + '. Mit ' + (touchUI() ? 'dem Pferd in der Leiste' : 'H') + ' sitzt Ihr auf.', '#ffd98a');
        updateHud(); renderSkills(); markDirty(true); renderTalk('stable');
      }, 'tbtn');
      b.disabled = own || have || HERO.gold < h.price || HERO.lvl < h.lvl;
      r.append(ic, t, b); body.append(r);
    }
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  } else if (view === 'festgame' || view === 'festshop'){
    festTalkView(view, body, opts);
  } else if (view === 'dice'){
    diceView(body, opts);
  } else if (view === 'turnier'){
    turnierView(body, opts);
  } else if (typeof view === 'string' && view.startsWith('orden')){
    ordenView(view, body, opts);
  } else if (typeof view === 'string' && /^ch[A-Z]/.test(view)){
    chView(view, body, opts);
  } else if (typeof view === 'string' && /^wt[A-Z]/.test(view)){
    wtView(view, body, opts);
  } else if (typeof view === 'string' && /^eh[A-Z]/.test(view)){
    ehView(view, body, opts);
  } else if (typeof view === 'string' && /^str/.test(view)){
    strView(view, body, opts);
  } else if (typeof view === 'string' && /^(post|markt|lw$|ordh)/.test(view)){
    asView(view, body, opts);
  } else if (view === 'joust'){
    $('talkText').textContent = 'Drei Durchgänge an der Schranke, ich stelle Euch Turnierpferd und Lanze. Kurz vor dem Zusammenprall wandert Euer Ziel über den Gegner: Senkt die Lanze mit dem Hieb, wenn es auf Helm oder Schild steht. '
      + 'Der Helm zählt zwei Punkte, der Schild einen. Wer aus dem Sattel fällt, hat verloren. Ihr habt ' + HERO.gold + ' Gulden.';
    const J = HERO.joust || { wins: 0, beat: {} };
    for (const f of JOUST_FOES){
      const r = el('div', 'shoprow'), ic = el('img'), set = knightSet(f.f, f.look);
      set.url = set.url || urlOf(set.icon, 3); ic.src = set.url; ic.alt = '';
      const t = el('div', 'stx');
      t.append(el('b', null, f.name + (J.beat[f.id] ? ' (besiegt)' : '')), el('small', null, 'Stufe ' + f.lvl + ', Preis ' + f.prize + ' Gulden' + (J.beat[f.id] ? '' : ' und ' + f.trophy.name) + '. ' + f.say));
      const b = btn('Antreten für ' + f.stake, () => { if (HERO.gold < f.stake) return; closePanel(); startJoust(f); }, 'tbtn');
      b.disabled = HERO.gold < f.stake;
      r.append(ic, t, b); body.append(r);
    }
    body.append(el('p', 'hint', J.wins ? 'Ihr habt ' + J.wins + (J.wins === 1 ? ' Tjost' : ' Tjoste') + ' gewonnen.' : 'Der erste Sieg gegen jeden Gegner bringt einen Preis für Euren Rucksack.'));
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  } else if (view === 'smith'){
    $('talkText').textContent = 'Ihr habt ' + HERO.gold + ' Gulden. Jede Stufe macht Klinge und Rüstung härter, bis +5.';
    const list = SLOTS.filter(sl => HERO.eq[sl]).map(sl => [HERO.eq[sl], 'angelegt']).concat(HERO.inv.filter(it => it && it.s !== 'ware').map(it => [it, 'im Rucksack']));
    if (!list.length) body.append(el('p', 'hint', 'Ihr habt nichts, was ich bearbeiten könnte.'));
    for (const [it, where] of list){
      const r = el('div', 'shoprow'), ic = el('img'); ic.src = itemUrl(it); ic.alt = ''; ic.style.boxShadow = '0 0 0 2px ' + RARITY[it.r].c;
      const t = el('div', 'stx'), nm = el('b', null, itemName(it)); nm.style.color = RARITY[it.r].c;
      t.append(nm, el('small', null, where + ' · ' + itemLines(it).join(' · ')));
      const up = it.up || 0, cost = upgradeCost(it);
      const b = btn(up >= 5 ? 'Meisterstück' : '+' + (up + 1) + ' für ' + cost, () => {
        if (up >= 5 || HERO.gold < cost) return;
        HERO.gold -= cost; upgradeItem(it); refreshStats(); Sound.anvil(); setTimeout(() => Sound.anvil(), 260);
        logItem('Der Schmied verbessert: ', it); updateHud(); markDirty(true); renderTalk('smith');
      }, 'tbtn');
      b.disabled = up >= 5 || HERO.gold < cost;
      r.append(ic, t, b); body.append(r);
    }
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  } else if (view === 'buy'){
    $('talkText').textContent = 'Ihr habt ' + HERO.gold + ' Gulden.';
    const price = 4 + 2 * HERO.lvl, row = el('div', 'shoprow');
    const im = el('img'); im.src = ICON_URL.potion; im.alt = '';
    const tx = el('div', 'stx'); tx.append(el('b', null, 'Heiltrank'), el('small', null, 'heilt 45 % des Lebens · ' + HERO.potions + ' / 20 im Gepäck'));
    const buy = m => { const n = Math.min(m, 20 - HERO.potions, Math.floor(HERO.gold / price)); if (n <= 0) return; HERO.gold -= n * price; HERO.potions += n; Sound.coin(); updateHud(); markDirty(true); renderTalk('buy'); };
    const b1 = btn('1 für ' + price, () => buy(1), 'tbtn'), b5 = btn('5 für ' + price * 5, () => buy(5), 'tbtn');
    b1.disabled = HERO.gold < price || HERO.potions >= 20; b5.disabled = HERO.gold < price * 5 || HERO.potions > 15;
    row.append(im, tx, el('span', 'sbtns')); row.lastChild.append(b1, b5);
    body.append(row);
    if (!n.stock || n.stockLvl !== HERO.lvl || nowS() > n.stockT){ n.stock = [makeItem(pick(SLOTS), HERO.lvl, 0), makeItem(pick(SLOTS), HERO.lvl, 1), makeItem(pick(SLOTS), HERO.lvl, 1), makeItem(pick(SLOTS), HERO.lvl + 1, 1)]; n.stockLvl = HERO.lvl; n.stockT = nowS() + 300; }
    n.stock.forEach((it, i) => {
      const r = el('div', 'shoprow'), ic = el('img'); ic.src = itemUrl(it); ic.alt = ''; ic.style.boxShadow = '0 0 0 2px ' + RARITY[it.r].c;
      const t = el('div', 'stx'), nm = el('b', null, itemName(it)); nm.style.color = RARITY[it.r].c;
      const diff = statDiff(it).map(([nn, d]) => (d > 0 ? '+' : '−') + Math.abs(d) + ' ' + nn).join(', ');
      t.append(nm, el('small', null, itemLines(it).join(' · ')), el('small', 'cmp', diff ? 'Statt jetzt: ' + diff : ''));
      const cost = it.v * 4, b = btn(cost + ' Gulden', () => {
        const j = HERO.inv.indexOf(null);
        if (HERO.gold < cost || j < 0) return;
        HERO.gold -= cost; HERO.inv[j] = it; n.stock.splice(i, 1); Sound.coin(); logItem('Gekauft: ', it); updateHud(); markDirty(true); renderTalk('buy');
      }, 'tbtn');
      b.disabled = HERO.gold < cost || HERO.inv.indexOf(null) < 0;
      r.append(ic, t, b); body.append(r);
    });
    opts.append(btn('Verkaufen', () => renderTalk('sell'), 'tbtn'), btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  } else if (view === 'sell'){
    $('talkText').textContent = 'Ihr habt ' + HERO.gold + ' Gulden. Was wollt Ihr loswerden?';
    const items = HERO.inv.map((it, i) => [it, i]).filter(([it]) => it);
    if (!items.length) body.append(el('p', 'hint', 'Euer Rucksack ist leer.'));
    for (const [it, i] of items){
      const r = el('div', 'shoprow'), ic = el('img'); ic.src = itemUrl(it); ic.alt = ''; ic.style.boxShadow = '0 0 0 2px ' + RARITY[it.r].c;
      const t = el('div', 'stx'), nm = el('b', null, itemName(it)); nm.style.color = RARITY[it.r].c;
      t.append(nm, el('small', null, it.s === 'ware' ? 'Handelsware aus der Jagd' : 'Stufe ' + it.il + ' · ' + itemLines(it).join(' · ')));
      r.append(ic, t, btn('für ' + itemValue(it), () => { HERO.inv[i] = null; HERO.gold += itemValue(it); Sound.coin(); updateHud(); markDirty(true); renderTalk('sell'); }, 'tbtn'));
      body.append(r);
    }
    const commons = items.filter(([it]) => it.r === 0);
    if (commons.length) opts.append(btn('Alles Gewöhnliche verkaufen (' + commons.reduce((a, [it]) => a + itemValue(it), 0) + ' Gulden)', () => { for (const [it, i] of commons){ HERO.inv[i] = null; HERO.gold += itemValue(it); } Sound.coin(); updateHud(); markDirty(true); renderTalk('sell'); }, 'tbtn'));
    opts.append(btn('Kaufen', () => renderTalk('buy'), 'tbtn'), btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  }
}

/* ---------- Würfelspiel im Gasthaus: drei Würfel, einmal nachwerfen ----------
   Dreierpasch schlägt Pärchen, Pärchen schlägt Augen; bei Gleichstand bekommt jeder seinen Einsatz zurück. */
const DICE_URL = [null];
for (let v = 1; v <= 6; v++){
  const c = canvasOf(16, 16), g = c.getContext('2d');
  g.fillStyle = '#16120f'; g.fillRect(1, 1, 14, 14); g.fillStyle = '#efe6cc'; g.fillRect(2, 2, 12, 12); g.fillStyle = '#c8bc9a'; g.fillRect(2, 13, 12, 1); g.fillRect(13, 2, 1, 12);
  g.fillStyle = '#2a1c14';
  const P = { 1: [[7, 7]], 2: [[4, 4], [10, 10]], 3: [[4, 4], [7, 7], [10, 10]], 4: [[4, 4], [10, 4], [4, 10], [10, 10]], 5: [[4, 4], [10, 4], [7, 7], [4, 10], [10, 10]], 6: [[4, 4], [10, 4], [4, 7], [10, 7], [4, 10], [10, 10]] }[v];
  for (const [x, y] of P) g.fillRect(x, y, 2, 2);
  if (v === 1){ g.fillStyle = '#a8262a'; g.fillRect(7, 7, 2, 2); }
  DICE_URL[v] = urlOf(c, 3);
}
const roll3 = () => [1, 2, 3].map(() => 1 + (Math.random() * 6 | 0));
function diceRank(d){
  const s = d.slice().sort((a, b) => b - a);
  if (s[0] === s[2]) return { r: 300 + s[0], n: 'Dreierpasch der ' + s[0] };
  const pair = s[0] === s[1] ? s[0] : s[1] === s[2] ? s[1] : 0;
  if (pair){ const k = s[0] === pair ? s[2] : s[0]; return { r: 200 + pair * 10 + k, n: 'Pärchen der ' + pair }; }
  return { r: s[0] + s[1] + s[2], n: (s[0] + s[1] + s[2]) + ' Augen' };
}
/* der Landsknecht wirft nach, wenn er hinten liegt: was nicht zum Pärchen gehört, sonst alles bis auf den höchsten */
function diceAI(d, target){
  if (diceRank(d).r > target) return d;
  const s = d.slice(), cnt = {}; for (const v of s) cnt[v] = (cnt[v] || 0) + 1;
  const pair = +Object.keys(cnt).find(v => cnt[v] === 2) || 0, hi = Math.max(...s);
  let kept = false;
  return s.map(v => pair ? (v === pair ? v : 1 + (Math.random() * 6 | 0)) : (v === hi && !kept ? (kept = true, v) : 1 + (Math.random() * 6 | 0)));
}
function diceSound(){ for (let i = 0; i < 4; i++) Sound.noise(.03, .05, 2200, i * .06); Sound.tone(300, .04, 'square', .015, -100, .2); }
function diceView(body, opts){
  const D = G.dice, row = (d, hold) => {
    const r = el('div', 'dicerow');
    d.forEach((v, i) => {
      const b = el('button', 'die' + (hold && !hold[i] ? ' re' : '')); b.type = 'button';
      const im = el('img'); im.src = DICE_URL[v]; im.alt = v + ' Augen'; b.append(im);
      if (hold){ b.title = hold[i] ? 'behalten (zum Neuwerfen wählen)' : 'wird neu geworfen'; b.addEventListener('click', () => { D.hold[i] = !D.hold[i]; renderTalk('dice'); }); }
      else b.disabled = true;
      r.append(b);
    });
    return r;
  };
  if (!D || D.phase === 'bet'){
    $('talkText').textContent = 'Drei Würfel, einmal nachwerfen. Dreierpasch schlägt Pärchen, Pärchen schlägt Augen. Bei Gleichstand behält jeder seinen Einsatz. Ihr habt ' + HERO.gold + ' Gulden.';
    for (const st of [5, 20, 50]){ const b = btn('Um ' + st + ' Gulden würfeln', () => diceStart(st), 'opt'); b.disabled = HERO.gold < st; opts.append(b); }
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
  } else if (D.phase === 'roll'){
    $('talkText').textContent = 'Euer Wurf: ' + diceRank(D.me).n + '. Wählt die Würfel, die Ihr neu werfen wollt, oder lasst es so. Einsatz ' + D.stake + ' Gulden.';
    body.append(el('p', 'hint', 'Euer Wurf'), row(D.me, D.hold));
    const re = D.hold.filter(h => !h).length;
    opts.append(btn(re ? 'Neu werfen (' + re + ' ' + (re === 1 ? 'Würfel' : 'Würfel') + ')' : 'So lassen', () => diceFinish(), 'opt'));
    if (re) opts.append(btn('Doch so lassen', () => { D.hold = [true, true, true]; diceFinish(); }, 'opt'));
  } else {
    const a = diceRank(D.me), b = diceRank(D.op);
    body.append(el('p', 'hint', 'Euer Wurf: ' + a.n), row(D.me), el('p', 'hint', D.foe + ': ' + b.n), row(D.op));
    $('talkText').textContent = D.res > 0 ? 'Gewonnen! ' + a.n + ' gegen ' + b.n + '. Ihr streicht ' + D.stake * 2 + ' Gulden ein.' : D.res < 0 ? 'Verloren. ' + b.n + ' schlägt ' + a.n + '. „Das Glück ist ein Landsknecht, Herr Ritter.“' : 'Gleichstand, jeder behält seinen Einsatz.';
    const again = btn('Noch eine Runde um ' + D.stake, () => diceStart(D.stake), 'opt'); again.disabled = HERO.gold < D.stake;
    opts.append(again, btn('Anderer Einsatz', () => { G.dice = null; renderTalk('dice'); }, 'opt'), btn('Zurück', () => { G.dice = null; renderTalk('main'); }, 'tbtn'));
  }
  body.append(opts);
}
function diceStart(stake){
  if (HERO.gold < stake) return;
  HERO.gold -= stake; updateHud();
  G.dice = { stake, me: roll3(), op: null, hold: [true, true, true], phase: 'roll', foe: G.talk.name.split(' ').slice(-1)[0] };
  diceSound(); renderTalk('dice');
}
function diceFinish(){
  const D = G.dice;
  if (D.hold.some(h => !h)){ D.me = D.me.map((v, i) => D.hold[i] ? v : 1 + (Math.random() * 6 | 0)); diceSound(); }
  const mine = diceRank(D.me).r;
  D.op = diceAI(roll3(), mine);
  const theirs = diceRank(D.op).r;
  D.res = Math.sign(mine - theirs); D.phase = 'done';
  if (D.res > 0){ HERO.gold += D.stake * 2; Sound.gold(); HERO.dicewins = (HERO.dicewins || 0) + 1; }
  else if (D.res === 0) HERO.gold += D.stake;
  else Sound.tone(180, .3, 'triangle', .04, -60);
  updateHud(); markDirty(true);
  setTimeout(() => { if (G.talk && G.dice === D) renderTalk('dice'); }, 0);
}
/* Spielmann: Liedwunsch für einen Gulden, dazu gute Laune (+10 % Erfahrung, 10 Minuten) */
const SONGS = [['inn', 'Einen Tanz'], ['ballade', 'Eine Ballade'], ['trink', 'Ein Trinklied']];
function requestSong(id, name){
  if (HERO.gold < 1) return;
  HERO.gold -= 1; G.song = { id, t: G.t + 240 }; Sound.setTune(id, true);
  HERO.mood = { t: 600 }; renderBuffs(); updateHud(); markDirty(true); Sound.coin();
  G.greet = name + ', sehr wohl! ' + ({ inn: 'Und nun alle die Füße gehoben!', ballade: 'Vom Ritter, der auszog, die Pest zu besiegen …', trink: 'Hebt die Krüge, Leute!' })[id];
  logLine('Der Spielmann spielt ' + name.toLowerCase() + '. Gute Laune: +10 % Erfahrung für 10 Minuten.', '#ffd98a');
}

/* ---------- Tod ---------- */
function showDead(){
  $('deadText').textContent = G.ablassUsed ? 'Der Ablassbrief bewahrt Euer Gold. Eure Ausrüstung bleibt Euch.' : G.lostGold ? 'Ihr verliert ' + G.lostGold + ' Gulden. Eure Ausrüstung bleibt Euch.' : 'Eure Ausrüstung bleibt Euch.';
  const where = HUB_IN[HERO.bind] || 'in der Reichsburg';
  $('btnRespawn').textContent = where[0].toUpperCase() + where.slice(1) + ' erwachen';
  showOverlay('ovDead'); Sound.stopMusic();
  setTimeout(() => { if (G.mode === 'dead') $('btnRespawn').focus({ preventScroll: true }); }, 600);
}

/* ---------- Start: neuer Ritter oder weiterspielen ---------- */
let SAVED = null;
function renderStart(){
  $('startNew').hidden = !!SAVED && !G.confirmNew;
  $('startCont').hidden = !SAVED || !!G.confirmNew;
  $('startConfirm').hidden = !G.confirmNew;
  if (SAVED){
    $('contName').textContent = SAVED.name;
    $('contInfo').textContent = (KN_FACTIONS[SAVED.f] || KN_FACTIONS.reich).knight + ' · Stufe ' + SAVED.lvl + ' · ' + titleOf(SAVED.lvl) + ' · ' + SAVED.gold + ' Gulden · ' + SAVED.kills + ' erschlagen';
  }
  if (G.confirmNew) $('startNew').hidden = true;
}
const cleanText = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanName = s => cleanText(s, 16);
function startGame(hero){
  Sound.init();
  HERO = cleanHero(hero); SAVED = HERO;
  refreshStats();
  G = freshState('play');
  NET.pt = HERO.pt ? { id: HERO.pt.id, t: HERO.pt.t } : null; NET.ptT = nowS(); NET.alone = 0; NET.mem = {};
  orSubscribe();
  EVT.cur = null;
  G.knight.hp = ST.hp;
  for (const s of SPAWN_SLOTS){ s.mon = null; s.t = 0; }
  updateZone(); showOverlay(null); blurActive();
  updateHud(); updateBossBar(); stStart(); AS.seen.clear(); AS.first = true; asTick(); ehCheck(true); renderTracker(); renderSkills();
  $('btnPause').textContent = 'Menü';
  Sound.step = 0; Sound.startMusic();
  if (HERO.kills === 0 && HERO.lvl === 1){
    showBanner('Willkommen, ' + HERO.name, 'Sprecht mit dem Vogt in der Burg');
    logLine('Der Vogt Heinrich steht im Burghof. Geht zu ihm und drückt ' + (touchUI() ? '„Sprechen“' : 'E') + '.', '#ecd27a');
  } else showBanner(HERO.name, 'Stufe ' + HERO.lvl + ' · ' + titleOf(HERO.lvl));
  renderBuffs();
  if (HERO.inn && INN_BY[HERO.inn]){ const inn = INN_BY[HERO.inn]; G.knight.x = inn.dx; G.knight.y = inn.dy + 2; enterInn(inn); }
  saveHero(); pushFame(); sendPresence(true);
  cv.focus({ preventScroll: true });
  if (TOUCH){
    const cab = document.querySelector('.cabinet'), r = cab.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) cab.scrollIntoView({ block: r.height > innerHeight ? 'start' : 'center' });
  }
}
function pauseGame(){
  if (G.mode !== 'play' || (G.joust && G.joust.pvp)) return;   // ein Tjost gegen einen Ritter läuft weiter
  G.mode = 'pause'; keys.clear(); atkHeld = false; atkBtn = false;
  showOverlay('ovPause'); Sound.stopMusic();
  $('btnPause').textContent = 'Weiter';
  saveHero();
}
function resumeGame(){
  if (G.mode !== 'pause') return;
  Sound.init();
  G.mode = 'play'; showOverlay(null); blurActive();
  $('btnPause').textContent = 'Menü';
  Sound.startMusic();
}
function setSound(on, save){
  Sound.on = on;
  if (save) store.set('apfelritter-ton', on ? 'an' : 'aus');
  $('btnSound').textContent = on ? 'Ton an' : 'Ton aus';
  $('btnSound').setAttribute('aria-pressed', String(on));
  if (!on) Sound.stopMusic();
  else if (G.mode === 'play'){ Sound.init(); Sound.startMusic(); }
}

$('formNew').addEventListener('submit', e => {
  e.preventDefault();
  const name = cleanName($('heroName').value);
  if (!name){ $('heroName').focus(); $('nameHint').hidden = false; return; }
  G.confirmNew = false;
  startGame(freshHero(name, G.pickF));
});
$('btnContinue').addEventListener('click', () => { if (SAVED) startGame(SAVED); });
$('btnNewHero').addEventListener('click', () => { G.confirmNew = true; renderStart(); $('btnCancelNew').focus({ preventScroll: true }); });
$('btnReallyNew').addEventListener('click', () => { G.confirmNew = false; SAVED = null; renderStart(); $('heroName').value = ''; $('heroName').focus({ preventScroll: true }); });
$('btnCancelNew').addEventListener('click', () => { G.confirmNew = false; renderStart(); });
$('btnResume').addEventListener('click', resumeGame);
$('btnKeysClose').addEventListener('click', () => closePanel());
/* ---------- Tafeln und Hilfe: alle Tafeln in einem Fenster, links die Liste (im Menü und auf dem Startbildschirm) ---------- */
let notesFrom = null;
const NOTE_EL = [...document.querySelectorAll('#notes > .note')];
NOTE_EL.forEach((n, i) => {
  const h = n.querySelector('h3'), b = el('button', null, h ? h.textContent : 'Tafel ' + (i + 1));
  b.type = 'button'; b.id = 'ntab' + i; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', n.id || (n.id = 'note' + i));
  n.setAttribute('role', 'tabpanel'); n.setAttribute('aria-labelledby', b.id);
  b.addEventListener('click', () => showNote(i));
  $('noteTabs').append(b);
});
function showNote(i){
  i = clamp(i | 0, 0, NOTE_EL.length - 1);
  NOTE_EL.forEach((n, j) => { n.hidden = j !== i; const b = $('ntab' + j); b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
  $('noteView').scrollTop = 0; notesI = i; store.set('apfelritter-tafel', String(i));
  $('ntab' + i).scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
let notesI = +(store.get('apfelritter-tafel') || 0) || 0;
function openNotes(){
  const cur = OVERLAYS.find(o => !$(o).hidden);
  if (cur === 'ovNotes') return;
  notesFrom = cur || null;
  showOverlay('ovNotes'); showNote(notesI);
  $('ntab' + notesI).focus({ preventScroll: true });
}
function closeNotes(){
  const back = notesFrom; notesFrom = null;
  showOverlay(back);
  const b = back === 'ovPause' ? $('btnNotes') : back === 'ovStart' ? $('btnNotesStart') : null;
  if (b && KBD.on) b.focus({ preventScroll: true });
}
$('btnNotes').addEventListener('click', openNotes);
$('btnNotesStart').addEventListener('click', openNotes);
$('btnNotesClose').addEventListener('click', closeNotes);
$('btnKeys').addEventListener('click', () => { resumeGame(); openKeys(); });
/* echtes Vollbild, wo der Browser es erlaubt (eingebettete Seiten dürfen das oft nicht; dann bleibt der Knopf verborgen) */
const FS = {
  ok: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
  on: () => !!(document.fullscreenElement || document.webkitFullscreenElement)
};
function syncFull(){ const b = $('btnFull'); b.hidden = !FS.ok; b.textContent = FS.on() ? 'Vollbild beenden' : 'Vollbild'; fitStage(); }
$('btnFull').addEventListener('click', () => {
  try {
    const d = document, e = d.documentElement;
    if (FS.on()) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { const r = (e.requestFullscreen || e.webkitRequestFullscreen).call(e); if (r && r.catch) r.catch(() => {}); }
  } catch(err){}
});
document.addEventListener('fullscreenchange', syncFull); document.addEventListener('webkitfullscreenchange', syncFull);
syncFull();
$('btnPause').addEventListener('click', () => { G.mode === 'play' ? pauseGame() : G.mode === 'pause' ? resumeGame() : null; });
$('btnSound').addEventListener('click', () => setSound(!Sound.on, true));
$('btnMap').addEventListener('click', () => { G.mode === 'menu' && !$('ovMap').hidden ? closePanel() : openMap(); });
$('btnBag').addEventListener('click', () => { G.mode === 'menu' && !$('ovBag').hidden ? closePanel() : openBag(); });
$('btnQuests').addEventListener('click', () => { G.mode === 'menu' && !$('ovQuests').hidden ? closePanel() : openQuests(); });
for (const id of ['btnMapClose', 'btnBagClose', 'btnQuestsClose', 'btnTalkClose']) $(id).addEventListener('click', closePanel);
$('btnRespawn').addEventListener('click', respawn);
$('btnTalk').addEventListener('click', () => { Sound.init(); talk(); });
/* Leute anklicken */
cv.addEventListener('pointerdown', e => {
  if (!G || G.mode !== 'play') return;
  const r = cv.getBoundingClientRect(), cam = camOf(G.knight);
  const wx = cam.x + (e.clientX - r.left) / r.width * W, wy = cam.y + (e.clientY - r.top) / r.height * H;
  for (const n of NPCS){
    if (Math.abs(wx - n.x) < 12 && wy > n.y - 48 && wy < n.y + 4){
      if (Math.hypot(n.x - G.knight.x, n.y - G.knight.y) < 70){ e.preventDefault(); openTalk(n); }
      else floatText(n.x, n.y - 60, 'Zu weit weg', '#d8c69c');
      return;
    }
  }
  if (G.inside || DG_ON) return;
  for (const q of PEERS.values()){
    if (!samePlace(q) || Math.abs(wx - q.x) > 12 || wy < q.y - 48 || wy > q.y + 4) continue;
    if (peerDist(q) < 90){ e.preventDefault(); openPeer(q); } else floatText(q.x, q.y - 60, 'Zu weit weg', '#d8c69c');
    return;
  }
});

/* ---------- Plaudern ---------- */
function openChat(){
  if (G.mode !== 'play') return;
  keys.clear(); atkHeld = false;
  $('chatForm').hidden = false; $('chatIn').value = ''; $('chatIn').focus({ preventScroll: true });
}
function closeChat(){ $('chatForm').hidden = true; $('chatIn').blur(); }
$('chatForm').addEventListener('submit', e => {
  e.preventDefault();
  const t = cleanText($('chatIn').value, 120);
  closeChat();
  if (t) sendChat(t);
});
$('chatIn').addEventListener('keydown', e => { if (e.key === 'Escape'){ e.preventDefault(); closeChat(); } e.stopPropagation(); });
$('btnChat').addEventListener('click', () => { Sound.init(); $('chatForm').hidden ? openChat() : closeChat(); });

/* ---------- Tastatur ---------- */
const KEYMAP = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down' };
const ATK_KEYS = ['Space', 'KeyJ'];
const SKILL_KEYS = { KeyR:'rund', Digit1:'rund', KeyF:'stoss', Digit2:'stoss', KeyG:'ruf', Digit3:'ruf', KeyQ:'trank', Digit4:'trank', KeyH:'pferd', Digit5:'pferd' };
addEventListener('keydown', e => {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
  if (!e.ctrlKey && !e.metaKey && !e.altKey) setKbd(true);
  if (G && G.mode === 'scene'){   // Zwischenszene: weiter oder überspringen
    if (e.code === 'Escape'){ e.preventDefault(); stSkip(); }
    else if (!e.repeat && (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')){ e.preventDefault(); stAdvance(); }
    else if (KEYMAP[e.code] || ATK_KEYS.includes(e.code)) e.preventDefault();
    return;
  }
  if (!$('ovNotes').hidden){   // Tafeln und Hilfe: Pfeile wechseln die Tafel, Bild auf/ab blättert, Esc zurück
    const tabs = [...$('noteTabs').children], i = tabs.indexOf(document.activeElement);
    if (e.code === 'Escape' || e.code === 'Backspace' || e.code === 'KeyP'){ e.preventDefault(); closeNotes(); }
    else if (/^Arrow(Up|Down|Left|Right)$/.test(e.code)){ e.preventDefault(); const n = (i < 0 ? notesI : i) + (/Down|Right/.test(e.code) ? 1 : -1); showNote((n + tabs.length) % tabs.length); $('ntab' + notesI).focus({ preventScroll: true }); }
    else if (e.code === 'PageDown' || e.code === 'PageUp'){ e.preventDefault(); $('noteView').scrollBy({ top: (e.code === 'PageDown' ? 1 : -1) * $('noteView').clientHeight * .85 }); }
    else if ((e.code === 'Enter' || e.code === 'Space') && t && t.closest && t.closest('button')) return;   // Knopf drücken
    else if (e.code !== 'Tab') e.preventDefault();
    return;
  }
  if (NET.inbox[0] && (G.mode === 'play' || G.mode === 'menu') && !e.repeat && /^[yYnN]$/.test(e.key)){ e.preventDefault(); netAnswer(NET.inbox[0], /^[yY]$/.test(e.key)); return; }   // Anfrage eines Ritters
  if (e.code === 'F1' || e.key === '?'){ e.preventDefault(); if (G.mode === 'menu' && !$('ovKeys').hidden) closePanel(); else if (G.mode === 'pause'){ resumeGame(); openKeys(); } else openKeys(); return; }
  // offene Fenster: Ziffern wählen, Pfeile wandern, Rücktaste zurück
  if (G.mode === 'menu' || G.mode === 'pause' || G.mode === 'dead'){
    const ov = OVERLAYS.map($).find(o => !o.hidden);
    if (ov){
      const m = /^(Digit|Numpad)([1-9])$/.exec(e.code);
      if (m){ const b = ov.querySelector('[data-k="' + m[2] + '"]'); if (b && !b.disabled){ e.preventDefault(); b.click(); return; } }
      if (/^Arrow/.test(e.code)){ e.preventDefault(); navFocus(ov, e.code, t && t.closest ? t.closest('button, input, select, a') : null); return; }
      if (e.code === 'Backspace'){ const back = [...ov.querySelectorAll('button')].find(b => /^Zurück/.test(b.textContent) && b.offsetParent); e.preventDefault(); if (back) back.click(); else if (G.mode === 'menu') closePanel(); return; }
      if (G.mode === 'menu' && e.code === 'KeyE' && !$('ovBag').hidden && G.sel){ e.preventDefault(); if (G.sel.from === 'inv') equipFrom(G.sel.i); else unequip(G.sel.slot); return; }
      if (G.mode === 'menu' && /^Key[WASD]$/.test(e.code)){ e.preventDefault(); navFocus(ov, { KeyW:'ArrowUp', KeyS:'ArrowDown', KeyA:'ArrowLeft', KeyD:'ArrowRight' }[e.code], t && t.closest ? t.closest('button, input, select, a') : null); return; }
    }
  }
  const d = KEYMAP[e.code];
  const inRun = G.mode === 'play' || G.mode === 'dying';
  if (d){ if (G.mode === 'play'){ keys.add(d); e.preventDefault(); } return; }
  if (G.mode === 'play'){
    if (ATK_KEYS.includes(e.code)){ e.preventDefault(); atkHeld = true; attack(); return; }
    if (SKILL_KEYS[e.code]){ e.preventDefault(); if (!e.repeat) SKILL_FN[SKILL_KEYS[e.code]](); return; }
    if (e.code === 'KeyE'){ e.preventDefault(); if (!e.repeat) talk(); return; }
    if (e.code === 'Enter' || e.code === 'NumpadEnter'){ e.preventDefault(); if (!e.repeat) openChat(); return; }
  }
  if (inRun && ATK_KEYS.includes(e.code)){ e.preventDefault(); return; }
  if (e.repeat) return;
  if (G.mode === 'title' && (e.code === 'Enter' || e.code === 'NumpadEnter') && !(t && t.closest && t.closest('button'))){
    e.preventDefault();
    if (SAVED && !G.confirmNew) startGame(SAVED); else $('heroName').focus({ preventScroll: true });
    return;
  }
  if (e.code === 'KeyI' || e.code === 'KeyB'){ if (G.mode === 'menu' && !$('ovBag').hidden) closePanel(); else openBag(); }
  else if (e.code === 'KeyL'){ if (G.mode === 'menu' && !$('ovQuests').hidden) closePanel(); else openQuests(); }
  else if (e.code === 'KeyK'){ if (G.mode === 'menu' && !$('ovMap').hidden) closePanel(); else openMap(); }
  else if (e.code === 'KeyT'){ if (G.mode === 'menu' && G.talk && G.talk.key === 'party') closePanel(); else openParty(); }
  else if (e.code === 'KeyP' || e.code === 'Escape'){
    if (G.mode === 'menu') closePanel();
    else if (G.mode === 'play') pauseGame(); else if (G.mode === 'pause') resumeGame();
  } else if (e.code === 'KeyM') setSound(!Sound.on, true);
  else if ((e.code === 'Enter' || e.code === 'Space') && G.mode === 'pause'){
    const b = t && t.closest && t.closest('button'); if (b) return;
    e.preventDefault(); resumeGame();
  } else if ((e.code === 'Enter' || e.code === 'Space') && G.mode === 'dead'){
    const b = t && t.closest && t.closest('button'); if (b) return;
    e.preventDefault(); respawn();
  }
});
addEventListener('keyup', e => {
  const d = KEYMAP[e.code]; if (d) keys.delete(d);
  if (ATK_KEYS.includes(e.code)) atkHeld = false;
});
addEventListener('blur', () => { keys.clear(); atkHeld = false; atkBtn = false; pauseGame(); });
document.addEventListener('pointerdown', e => {
  const tg = e.target;
  if (tg && tg.closest && tg.closest('input, textarea, select')) return;
  try { window.focus(); } catch(err){}
  if (tg === cv || (tg.closest && tg.closest('.stage'))) cv.focus({ preventScroll: true });
}, true);
document.addEventListener('visibilitychange', () => { if (document.hidden){ pauseGame(); saveHero(); } });
addEventListener('pagehide', () => saveHero());

/* Steuerkreuz: Richtung aus der Daumenposition relativ zur Mitte, 8 Richtungen */
const pad = $('pad');
let padId = null;
function markArms(){
  for (const arm of pad.querySelectorAll('[data-d]')){
    const d = arm.dataset.d;
    arm.classList.toggle('on', (d === 'left' && padVec.x < 0) || (d === 'right' && padVec.x > 0) || (d === 'up' && padVec.y < 0) || (d === 'down' && padVec.y > 0));
  }
}
function padFrom(e){
  const r = pad.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  if (Math.hypot(dx, dy) < 12) padVec = { x: 0, y: 0 };
  else {
    const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4;
    padVec = { x: Math.round(Math.cos(ang)), y: Math.round(Math.sin(ang)) };
  }
  markArms();
}
pad.addEventListener('pointerdown', e => {
  e.preventDefault(); padId = e.pointerId;
  try { pad.setPointerCapture(e.pointerId); } catch(err){}
  Sound.init(); padFrom(e);
});
pad.addEventListener('pointermove', e => { if (e.pointerId === padId) padFrom(e); });
const padEnd = e => { if (e.pointerId !== padId) return; padId = null; padVec = { x: 0, y: 0 }; markArms(); };
pad.addEventListener('pointerup', padEnd);
pad.addEventListener('pointercancel', padEnd);
pad.addEventListener('contextmenu', e => e.preventDefault());
const atkB = $('btnAtk');
atkB.addEventListener('pointerdown', e => {
  e.preventDefault(); Sound.init();
  try { atkB.setPointerCapture(e.pointerId); } catch(err){}
  atkBtn = true; atkB.classList.add('on'); attack();
});
const atkEnd = () => { atkBtn = false; atkB.classList.remove('on'); };
atkB.addEventListener('pointerup', atkEnd);
atkB.addEventListener('pointercancel', atkEnd);
atkB.addEventListener('lostpointercapture', atkEnd);
atkB.addEventListener('contextmenu', e => e.preventDefault());
