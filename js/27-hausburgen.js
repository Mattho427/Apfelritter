"use strict";
/* Der Apfelritter, Teil 27 von 29: Die Burgen der vier Häuser: Adlerhorst, Schloss Lilienthal, Löwenburg und Turmfeste mit ihren Oberhäuptern,
   Torwachen und Kämmerern; Gunst des Hauses, Tribut für den Wettstreit, Rasten, Besuch aller vier Burgen, Belagerung, Tafel.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */

/* ============ Die Burgen der vier Häuser (Version 31) ============
   Mauern, Türme und Fahnen stehen in Teil 6 und 7. Hier wohnen die Leute: Das Oberhaupt empfängt die Ritter seines Hauses
   (Gunst des Hauses einmal am Spieltag, Tribut für den Wettstreit, Rasten, Stand im Wettstreit), Gäste anderer Häuser grüßt es höflich.
   Vor dem Tor halten zwei Ritter des Hauses Wache, im Hof verkauft der Kämmerer. */
const HB_GUNST_T = 1800, HB_GUNST = .1, HB_TRIBUT = 100, HB_TRIBUT_PTS = 10, HB_TRIBUT_MAX = 3;
const HB = {
  reich: { burg: 'Adlerhorst', im: 'auf dem Adlerhorst', zone: 'adlerhorst', keeper: 'Kämmerer Konrad',
    own: ['Willkommen auf dem Adlerhorst, Ritter vom Adler. Mein Haus dient der Krone, seit es Könige gibt, und die Krone verlässt sich auf uns.',
      'Unsere Adler sehen weit, sagt man. Ich sehe, dass Ihr müde seid. Bleibt eine Weile, der Hof ist sicher.',
      'Von hier sieht man bei klarem Wetter die Türme der Königsburg und die Weinberge über Altmünster. Beides schützen wir.'],
    guest: ['Ein Gast von einem anderen Haus? Seid willkommen auf dem Adlerhorst. Wer der Krone dient, ist hier nicht fremd.',
      'Grüßt Euer Haus von der Herzogin vom Adler. Im Wettstreit schenken wir einander nichts, an der Tafel aber teilen wir das Brot.'],
    pal: { 1: '#6a5010', 2: '#9a7a1c', 3: '#c8a030', 4: '#e6c44c', 5: '#5a1012', 6: '#8e1c1c', 7: '#b8302a', 8: '#d85448' },
    ruler: { robe: 'long', fur: true, chain: true, belt: true, hair: ['h', 'j'] }, keeperArt: { robe: 'long', hat: 'barett', chain: true, belt: true, beard: true, hair: ['h', 'j'] } },
  frankreich: { burg: 'Schloss Lilienthal', im: 'auf Schloss Lilienthal', zone: 'lilienthal', keeper: 'Kämmerin Blanche',
    own: ['Willkommen in Lilienthal, Ritter der Lilie. Ruht Euch im Garten aus, die Lilien blühen für uns alle.',
      'Ein Ritter der Lilie trägt Licht in die dunklen Wälder. Kommt zurück, wenn Ihr Kraft braucht.',
      'Meine Reiter stürmen in geschlossener Reihe, und genau so halten wir im Wettstreit zusammen.'],
    guest: ['Ein Gast! Seid willkommen in Lilienthal. Seht Euch den Garten an, solche Lilien wachsen nirgends sonst im Königreich.',
      'Richtet Eurem Haus Grüße vom Grafen von der Lilie aus. Im Wettstreit werden wir Euch schlagen, aber höflich.'],
    pal: { 1: '#143a20', 2: '#1f5c30', 3: '#2e7d40', 4: '#4aa05a', 5: '#7e7a70', 6: '#aeaa9c', 7: '#d8d4c6', 8: '#f6f2e6' },
    ruler: { robe: 'long', hat: 'barett', fur: true, chain: true, belt: true, beard: true, hair: ['h', 'j'] }, keeperArt: { robe: 'long', hat: 'haube', belt: true, apron: 'linen' } },
  england: { burg: 'Löwenburg', im: 'auf der Löwenburg', zone: 'loewenburg', keeper: 'Kämmerer Osric',
    own: ['Willkommen auf der Löwenburg, Ritter vom Löwen! Draußen der Finsterwald, drinnen Feuer, Bier und gute Klingen.',
      'Wer bei uns übt, trifft im Turnier. Seht Euch den Übungsplatz an, die Scheibe hat schon viele Löcher.',
      'Der Löwe schläft nie ganz. Wir halten den Westen, wo der Strom das Königreich verlässt.'],
    guest: ['Ein Gast im Finsterwald? Mutig. Seid willkommen auf der Löwenburg.',
      'Grüßt Euer Haus vom Fürsten Edwin. Und sagt ihm, dass wir im nächsten Turnier wieder gewinnen.'],
    pal: { 1: '#5a0e0e', 2: '#861a16', 3: '#ae2c22', 4: '#d0483a', 5: '#6a5010', 6: '#9a7a1c', 7: '#c8a030', 8: '#e6c44c' },
    ruler: { robe: 'long', fur: true, chain: true, belt: true, beard: true, hair: ['j', 'h'] }, keeperArt: { robe: 'short', hat: 'filz', belt: true, beard: true, hairSide: true, hair: ['j', 'h'] } },
  spanien: { burg: 'Turmfeste', im: 'in der Turmfeste', zone: 'turmfeste', keeper: 'Kämmerer Gonzalo',
    own: ['Willkommen in der Turmfeste, Ritter der Türme. Hier kommt keiner vorbei, der nicht vorbeikommen soll.',
      'Stein und Stahl, Herr Ritter. Unsere Mauern stehen seit hundert Jahren, und keine einzige ist gefallen.',
      'Von unseren Türmen sieht man die Hohe Straße bis in die Heide und die Weinberge über Altmünster. Wer in die Ostlande zieht, kommt an uns vorbei.'],
    guest: ['Ein Gast an der Pforte. Gut, dass Ihr durch das Tor gekommen seid und nicht über die Mauer. Seid willkommen.',
      'Grüßt Euer Haus vom Markgrafen von den Türmen. Wer im Wettstreit gegen uns antritt, braucht Geduld.'],
    pal: { 1: '#1a1a20', 2: '#2e2e36', 3: '#46464f', 4: '#66666f', 5: '#7e7a70', 6: '#aeaa9c', 7: '#d8d4c6', 8: '#f6f2e6' },
    ruler: { robe: 'short', plate: true, cape: true, belt: true, beard: true, hair: ['h', 'j'] }, keeperArt: { robe: 'long', hat: 'barett', belt: true, chain: true, hair: ['h', 'j'] } }
};
const HB_ZONE = Object.fromEntries(Object.entries(HB).map(([f, b]) => [b.zone, f]));
/* Oberhaupt mit goldener Krone (Herzogin, Fürst) oder Reif */
function hbFrames(o, pal, crown){
  const g = np_figure(o);
  if (crown){
    const top = g.findIndex(r => r.some(c => c !== '.'));
    for (const [x, y, c] of [[9, 0, '9'], [11, 0, '9'], [13, 0, '9'], [9, 1, '9'], [10, 1, '0'], [11, 1, '9'], [12, 1, '0'], [13, 1, '9']]) if (top + y - 1 >= 0) g[top + y - 1][x] = c;
  }
  const P = Object.assign({}, NP_BASE, pal, { 9: '#f2d256', 0: '#b8302a' }), rows = g.map(r => r.join(''));
  const breath = ['.'.repeat(rows[0].length)].concat(rows.slice(0, 30), rows.slice(31));
  return { frames: [makeSprite(rows, P, OUT), makeSprite(breath, P, OUT)], ax: 12, ay: 47 };
}
/* Torwache: ein Ritter des Hauses in Harnisch und Wappenrock, die Hellebarde aufrecht */
function hbGuardArt(fid){
  const S = knightSet(fid, '11x21h'), fr = S.walk.down[4] || S.walk.down[0], ax = kn_PAD + kn_CX, ay = kn_PAD + kn_H;
  const c = canvasOf(56, 74), g = c.getContext('2d'), X = 28, Y = 70, W = WT_CARRY.hellebarde.down;
  g.drawImage(fr.img, X - ax, Y - ay);
  drawSword(g, X + W.x, Y + W.y, W.a, weaponSet('hellebarde', '21'));
  if (fr.hands) g.drawImage(fr.hands, X - ax, Y - ay);
  return { frames: [c, c], ax: X, ay: Y };
}
const HB_NPC = [];
for (const [fid, B] of Object.entries(HB)){
  const H = wo_HAUS[fid], P = wo_HAUSP[fid], F = KN_FACTIONS[fid];
  if (!H || !P) continue;
  const lord = { id: 'hb_' + fid, name: F.ruler, role: 'Oberhaupt: ' + F.name, hb: fid, hub: B.zone, at: gNear(P.keep.x, P.keep.y + 40), art: 'hb_' + fid };
  Object.defineProperty(lord, 'greet', { get: () => HERO && HERO.f === fid ? B.own : B.guest });   // eigenes Haus oder Gast
  NPC_ART['hb_' + fid] = hbFrames(B.ruler, B.pal, fid === 'reich' || fid === 'england');
  const keeper = { id: 'hbk_' + fid, name: B.keeper, role: 'Kämmerer ' + (fid === 'frankreich' ? 'des Schlosses' : 'der Burg'), hb: fid, hub: B.zone, at: gNear(P.hof.x + 60, P.hof.y + 50),
    art: 'hbk_' + fid, shop: true, rich: true,
    greet: ['Heiltränke, Tuch und was ein Ritter sonst braucht, für die Ritter des Hauses zum ehrlichen Preis.', 'Ich kaufe auch, was Ihr unterwegs findet. Zeigt her!'] };
  if (fid === 'frankreich') keeper.role = 'Kämmerin des Schlosses';
  NPC_ART['hbk_' + fid] = np_frames(B.keeperArt, B.pal);
  NPC_ART['hbw_' + fid] = hbGuardArt(fid);
  HB_NPC.push(lord, keeper);
  for (const sx of [-1, 1]){
    const w = { id: 'hbw_' + fid + (sx < 0 ? 'l' : 'r'), name: F.knight, role: 'Torwache', hb: fid, hub: B.zone, at: gNear(P.tor.x + sx * 36, P.tor.y + 14), art: 'hbw_' + fid };
    const calm = [F.cry + ' Willkommen ' + B.im + '.', 'Wir halten das Tor, Herr Ritter. Das Oberhaupt empfängt Euch vor dem Bergfried.', 'Im Hof seid Ihr sicher. Draußen nicht.'];
    Object.defineProperty(w, 'greet', { get: () => hbSiegeOn(fid) ? [F.cry + ' Die Schwarze Schar steht vor dem Tor! Helft uns, Herr Ritter!', 'Schlagt die Söldner zurück, wir halten das Tor so lange!'] : calm });
    HB_NPC.push(w);
  }
}
for (const n of HB_NPC){ n.x = n.at.x; n.y = n.at.y; n.art = NPC_ART[n.art]; n.key = n.id; NPCS.push(n); }
for (const fid in HB){ const n = HB_NPC.find(q => q.id === 'hb_' + fid); if (n) BIND[HB[fid].zone] = { x: n.x, y: n.y + 30 }; }

/* ---------- Gunst des Hauses, Tribut, Besuch ---------- */
const hbDay = () => Math.floor(skyNow() / DAY_LEN);
const hbGunstOn = () => !!(HERO && HERO.gunst && HERO.gunst.t > 0);
function hbGunst(fid){
  if (HERO.f !== fid || HERO.gunstD === hbDay()) return;
  HERO.gunst = { t: HB_GUNST_T }; HERO.gunstD = hbDay();
  Sound.bell(); showBanner('Gunst des Hauses', '30 Minuten +10 % Erfahrung und Gulden');
  logLine('Das Oberhaupt Eures Hauses schenkt Euch seine Gunst: 30 Minuten lang +10 % Erfahrung und Gulden.', '#ffe9a0');
  renderBuffs(); markDirty(true);
}
function hbTribut(){
  const d = hbDay(); if (!HERO.hbt || HERO.hbt.d !== d) HERO.hbt = { d, n: 0 };
  if (HERO.hbt.n >= HB_TRIBUT_MAX || HERO.gold < HB_TRIBUT) return;
  HERO.gold -= HB_TRIBUT; HERO.hbt.n++; lwAdd(HB_TRIBUT_PTS);
  Sound.coin(); logLine('Ihr zahlt ' + HB_TRIBUT + ' Gulden Tribut: +' + HB_TRIBUT_PTS + ' Punkte für ' + lwIn(HERO.f) + ' im Wettstreit.', '#ffd98a');
  updateHud(); markDirty(true);
}
function hbTick(dt){
  if (HERO.gunst){
    HERO.gunst.t -= dt;
    if (HERO.gunst.t <= 0){ HERO.gunst = null; renderBuffs(); markDirty(); logLine('Die Gunst des Hauses ist verflogen.', '#d8c69c'); }
    else if (Math.floor(HERO.gunst.t / 60) !== Math.floor((HERO.gunst.t + dt) / 60)) renderBuffs();
  }
  const f = HB_ZONE[G.zone];
  if (f && !G.inside && !(HERO.hbv && HERO.hbv[f])){
    HERO.hbv = Object.assign({}, HERO.hbv, { [f]: 1 });
    const n = Object.keys(HERO.hbv).length;
    logLine((f === HERO.f ? 'Ihr seid zum ersten Mal in der Burg Eures Hauses: ' + HB_GR[f][0] : 'Ihr besucht als Gast ' + HB_GR[f][3]) + '. (' + n + ' von 4 Hausburgen besucht)', '#9fe08a');
    markDirty(true);
  }
}
function hbBuffs(box){
  if (!hbGunstOn()) return;
  const chip = el('span', 'buff'), im = el('img'); im.src = knightSet(HERO.f).url || (knightSet(HERO.f).url = urlOf(knightSet(HERO.f).icon, 3)); im.alt = '';
  chip.append(im, el('span', null, Math.ceil(HERO.gunst.t / 60) + ' Min.')); chip.title = 'Gunst des Hauses: +10 % Erfahrung und Gulden'; box.append(chip);
}

/* ---------- Gespräch mit dem Oberhaupt ---------- */
function hbTalkOpts(n, opts){
  if (!n.hb || n.id !== 'hb_' + n.hb) return;
  const fid = n.hb, own = HERO.f === fid, B = HB[fid];
  if (own){
    const done = HERO.gunstD === hbDay(), b = btn(done ? 'Die Gunst des Hauses habt Ihr heute schon erhalten' : 'Um die Gunst des Hauses bitten (30 Minuten +10 % Erfahrung und Gulden)', () => { hbGunst(fid); G.greet = 'Geht mit meinem Segen, und macht unserem Haus Ehre.'; renderTalk('main'); }, done ? 'opt' : 'opt new');
    b.disabled = done; opts.append(b);
    const d = hbDay(), k = HERO.hbt && HERO.hbt.d === d ? HERO.hbt.n : 0, t = btn('Tribut zahlen: ' + HB_TRIBUT + ' Gulden für +' + HB_TRIBUT_PTS + ' Punkte im Wettstreit (' + (HB_TRIBUT_MAX - k) + ' heute)', () => { hbTribut(); G.greet = 'Euer Gold stärkt unser Haus. Ich danke Euch.'; renderTalk('main'); }, 'opt');
    t.disabled = k >= HB_TRIBUT_MAX || HERO.gold < HB_TRIBUT; opts.append(t);
    if (HERO.bind !== B.zone) opts.append(btn('Hier rasten: nach dem Tod ' + B.im + ' erwachen', () => { HERO.bind = B.zone; Sound.bell(); logLine('Ihr erwacht künftig ' + B.im + '.', '#9fe08a'); markDirty(true); renderTalk('main'); }, 'opt'));
    else opts.append(el('p', 'hint', 'Ihr rastet hier: Nach dem Tod erwacht Ihr ' + B.im + '.'));
  } else opts.append(el('p', 'hint', 'Nur die Ritter ' + lwIn(fid).replace(/^das /, 'des ').replace('Haus ', 'Hauses ') + ' erhalten hier Gunst und Rast.'));
  opts.append(btn('Wie steht es im Wettstreit der Häuser?', () => renderTalk('hbStand'), 'opt'));
}
function hbView(view, body, opts){
  const n = G.talk;
  if (view === 'hbStand'){
    const { tot, cnt } = lwStand(orWeek()), order = Object.keys(tot).sort((a, b) => tot[b] - tot[a]), win = lwWinners();
    const mine = order.indexOf(n.hb) + 1;
    $('talkText').textContent = (mine === 1 && tot[n.hb] > 0 ? 'Diese Woche führt unser Haus! ' : 'Unser Haus steht diese Woche an ' + mine + '. Stelle. ')
      + (win.length ? 'Letzte Woche gewann ' + win.map(f => lwIn(f)).join(' und ') + '.' : 'Letzte Woche hat kein Haus Punkte gesammelt.');
    const ul = el('ul', 'list');
    for (const f of order){ const li = el('li'), im = el('img'); im.src = knightSet(f).url || (knightSet(f).url = urlOf(knightSet(f).icon, 3)); im.alt = '';
      const wh = el('span', 'what', KN_FACTIONS[f].name); wh.append(el('small', null, cnt[f] === 1 ? 'ein Ritter hat diese Woche Punkte gesammelt' : cnt[f] ? cnt[f] + ' Ritter haben diese Woche Punkte gesammelt' : 'noch kein Ritter hat diese Woche Punkte gesammelt'));
      li.append(im, wh, el('span', 'val', tot[f] + ' Punkte')); ul.append(li); }
    body.append(ul);
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  }
}

/* ============ Belagerung der Hausburgen (Version 32) ============
   Im Morgengrauen (4 bis 8 Uhr) berennt die Schwarze Schar, eine Kompanie von Söldnern, eine der vier Burgen, an jedem Spieltag eine
   andere. Das ist ein Weltereignis wie der Überfall auf Lindach (Teil 18): Die Söldner sammeln sich vor dem Tor, alle Ritter schlagen
   sie gemeinsam zurück, dann stellt sich ihr Hauptmann. Solange gestürmt wird, ist auch die Burg nicht sicher. Ritter des belagerten
   Hauses bekommen doppelte Punkte im Wettstreit und die Gunst ihres Hauses, Gäste den Dank des Oberhaupts in Gulden. */
const HB_GR = {   // wer, wem, wessen, wen
  reich: ['der Adlerhorst', 'dem Adlerhorst', 'des Adlerhorsts', 'den Adlerhorst'],
  frankreich: ['Schloss Lilienthal', 'Schloss Lilienthal', 'von Schloss Lilienthal', 'Schloss Lilienthal'],
  england: ['die Löwenburg', 'der Löwenburg', 'der Löwenburg', 'die Löwenburg'],
  spanien: ['die Turmfeste', 'der Turmfeste', 'der Turmfeste', 'die Turmfeste']
};
const HB_SIEGE = {
  reich: { boss: 'Hauptmann Ruprecht Eisenfaust', prize: 'Ehrenspange vom Adlerhorst', acc: 'die Ehrenspange vom Adlerhorst', aff: ['hp', 'arm', 'str'] },
  frankreich: { boss: 'Hauptmann Kunz Brandner', prize: 'Lilienbrosche von Lilienthal', acc: 'die Lilienbrosche von Lilienthal', aff: ['spd', 'crit', 'hp'] },
  england: { boss: 'Hauptmann Veit Wolfsbart', prize: 'Löwenring der Löwenburg', acc: 'den Löwenring der Löwenburg', aff: ['str', 'crit', 'hp'] },
  spanien: { boss: 'Hauptmann Hagen Sturmbock', prize: 'Turmsiegel der Turmfeste', acc: 'das Turmsiegel der Turmfeste', aff: ['arm', 'hp', 'str'] }
};
const HB_SIEGE_PTS = 15;
const cap1 = s => s[0].toUpperCase() + s.slice(1);
Object.keys(HB).forEach((fid, i) => {
  const P = wo_HAUSP[fid], B = HB[fid], S = HB_SIEGE[fid], [wer, wem, wessen, wen] = HB_GR[fid];
  if (!P) return;
  const x = P.tor.x, y = P.tor.y;
  EV_DEFS.push({ id: 'belagerung_' + fid, kind: 'raid', siege: fid, zone: B.zone, name: 'Belagerung ' + wessen, at: 4, len: 4, cyc: [4, i],
    boss: 'feldhauptmann', bossName: S.boss, bossSub: 'Der Hauptmann der Schwarzen Schar stellt sich', bossLine: 'Die Söldner weichen vom Tor! Da tritt ihr Hauptmann vor: ', where: 'vor ' + wem, siteAt: [x, y + 60, B.burg], bossAt: [x, y + 96], goal: [x, y + 70, 220, 70],
    ins: [[x - 70, y + 300], [x + 70, y + 320], [x - 190, y + 240], [x + 190, y + 250]], wave: [6, 22, 14], need: [24, 8, 64], hpf: .55, lvOff: -1, unit: 'Söldnern zurückgeschlagen',
    pick: R => R() < .3 ? 'hakenschuetze' : 'doppelsoeldner', mobs: { doppelsoeldner: 'Söldner der Schwarzen Schar', hakenschuetze: 'Büchsenschütze der Schar' },
    soon: 'Ein Sturmhorn tönt vor ' + wem + ': Die Schwarze Schar zieht im Morgengrauen heran!',
    start: 'Die Schwarze Schar berennt ' + wen + '! Werft die Söldner vor dem Tor zurück, dann stellt sich ihr Hauptmann.',
    won: cap1(wer) + ' hält stand', lost: 'Die Söldner brennen das Vorwerk ' + wessen + ' nieder und ziehen mit ihrer Beute ab.',
    prize: S.prize, prizeAcc: S.acc, aff: S.aff, unsafe: 'Die Burg wird belagert!', enter: 'Ihr erreicht ' + wen + '. Die Schwarze Schar stürmt das Tor!' });
  RUF_EV['belagerung_' + fid] = ['fuersten', 4];
});
const hbSiegeOn = fid => !!(EVT.cur && !EVT.cur.over && EVT.cur.d.siege === fid);
{ const li = el('li'), im = el('img'), wh = el('span', 'what', 'Belagerung der Hausburgen');   // Tafel: Weltereignisse
  lazySrc(im, () => urlOf(artOf('doppelsoeldner').idle.r[0].img, 2)); im.alt = '';
  wh.append(el('small', null, 'jeden Spieltag um 4 Uhr im Morgengrauen, im Wechsel Adlerhorst, Schloss Lilienthal, Löwenburg und Turmfeste: Die Schwarze Schar berennt das Tor, die Burg ist dann nicht sicher. Sind genug Söldner zurückgeschlagen, stellt sich ihr Hauptmann. Die Ritter des belagerten Hauses bekommen doppelte Punkte im Wettstreit und die Gunst ihres Hauses, Gäste den Dank des Oberhaupts in Gulden.'));
  li.append(im, wh); $('evList').append(li); }
/* Lohn obendrauf, wenn die Belagerung zurückgeschlagen ist (aus evEnd, Teil 18) */
function hbSiegeWon(d){
  const fid = d.siege, own = HERO.f === fid;
  HERO.hbs = { n: ((HERO.hbs && HERO.hbs.n) | 0) + 1, own: ((HERO.hbs && HERO.hbs.own) | 0) + (own ? 1 : 0) };
  if (own){
    lwAdd(HB_SIEGE_PTS);
    HERO.gunst = { t: HB_GUNST_T }; renderBuffs();
    logLine('Ihr habt die Burg Eures Hauses verteidigt! +' + HB_SIEGE_PTS + ' Punkte mehr im Wettstreit, und ' + KN_FACTIONS[fid].ruler + ' schenkt Euch die Gunst des Hauses (30 Minuten).', '#ffe9a0');
  } else {
    const g = 20 + HERO.lvl * 3; HERO.gold += g;
    logLine(KN_FACTIONS[fid].ruler + ' dankt Euch, dass Ihr als Gast für ' + lwIn(fid) + ' gefochten habt: ' + g + ' Gulden.', '#ffd98a');
  }
}

/* ---------- Trophäen und Tafel ---------- */
TROPHIES.splice(TROPHIES.findIndex(t => t.id === 'turnier'), 0, { id: 'hausburgen', n: 'Gast aller Häuser', d: 'alle vier Burgen der Häuser besucht: Adlerhorst, Schloss Lilienthal, Löwenburg und Turmfeste', ok: h => !!h.hbv && Object.keys(HB).every(f => h.hbv[f]) },
  { id: 'burgwacht', n: 'Burgverteidiger', d: 'die Burg des eigenen Hauses gegen die Schwarze Schar gehalten', ok: h => !!h.hbs && h.hbs.own > 0 });
TROPHY_BY.hausburgen = TROPHIES.find(t => t.id === 'hausburgen'); TROPHY_BY.burgwacht = TROPHIES.find(t => t.id === 'burgwacht');
(() => {
  const L = $('hbList'); if (!L) return;
  const where = { reich: 'im Norden zwischen der Raubritterburg und den Weinbergen', frankreich: 'südlich des Klosters, an der Bergstraße nach Silberberg',
    england: 'im Westen auf einer Lichtung im Finsterwald, am Furtweg', spanien: 'an der Hohen Straße, wo sie in die Heide der Ostlande führt' };
  for (const [fid, B] of Object.entries(HB)){
    const F = KN_FACTIONS[fid], li = el('li'), im = el('img'), wh = el('span', 'what', (fid === 'frankreich' ? '' : fid === 'reich' ? 'Der ' : 'Die ') + B.burg);
    lazySrc(im, () => knightSet(fid).url || (knightSet(fid).url = urlOf(knightSet(fid).icon, 3))); im.alt = '';
    wh.append(el('small', null, F.name + ', ' + where[fid] + '. ' + F.ruler + ', zwei ' + F.knight + ' am Tor, ' + B.keeper + ' mit Laden.'));
    li.append(im, wh, el('span', 'val', 'sicher')); L.append(li);
  }
})();
