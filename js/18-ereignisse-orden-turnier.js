"use strict";
/* Der Apfelritter, Teil 18 von 28: Weltereignisse, Ritterorden, Großes Turnier, Start.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Weltereignisse: für alle Ritter zur selben Stunde ============
   Die Uhr der Welt bestimmt, wann etwas geschieht: um 9 Uhr überfallen Raubritter das Dorf Lindach, um 22 Uhr zieht
   die Wilde Jagd durchs Land (jede Nacht an einem anderen Ort). Jede Seite lässt dieselben Gegner zur selben Zeit an
   denselben Orten erscheinen (Zufall aus der Kennung des Ereignisses). Wer welchen Gegner erschlagen hat, steht als
   Bitliste in der Anwesenheit; zusammen ergibt das den Fortschritt aller. Das Leben des Anführers ist sein Höchstwert
   weniger dem Schaden, den jeder Teilnehmer gemeldet hat; den Höchstwert bringt jeder Teilnehmer nach seiner Stufe mit. */
const EV_N = 96;
const EV_DEFS = [
  { id: 'ueberfall', kind: 'raid', name: 'Überfall auf Lindach', at: 9, len: 5, boss: 'raubritter', bossName: 'Eppelein von Rabeneck', where: 'in Dorf Lindach',
    siteAt: [2530, 690, 'Dorf Lindach'], bossAt: [2540, 700], goal: [2530, 690, 150, 110], wave: [5, 25, 14], need: [20, 8, 60], hpf: .5, unit: 'Räubern vertrieben',
    pick: R => R() < .32 ? 'armbrust' : 'pluend',
    soon: 'In Lindach läutet die Sturmglocke: Eine Raubritterbande zieht heran!', start: 'Raubritter überfallen Dorf Lindach! Vertreibt die Bande, dann stellt sich ihr Hauptmann.',
    won: 'Lindach ist gerettet', lost: 'Die Raubritter ziehen mit ihrer Beute ab. Lindach hat diesmal verloren.', prize: 'Dankkette von Lindach', prizeAcc: 'die Dankkette von Lindach', aff: ['hp', 'arm', 'str'],
    mobs: { pluend: 'Raubgeselle', armbrust: 'Bandenschütze' } },
  { id: 'jagd', kind: 'hunt', name: 'Die Wilde Jagd', at: 22, len: 5, boss: 'raubritter', bossName: 'Der Wilde Jäger', ghost: true, where: '', hpf: .6,
    soon: 'Ein fernes Horn in der Dämmerung: Heute Nacht zieht die Wilde Jagd!', start: 'Die Wilde Jagd braust heran! Der Wilde Jäger und seine Geisterhunde ziehen über das Land.',
    won: 'Die Wilde Jagd ist gebannt', lost: 'Der Morgen graut, die Wilde Jagd verweht im Wind.', prize: 'Horn des Wilden Jägers', prizeAcc: 'das Horn des Wilden Jägers', aff: ['crit', 'spd', 'str'],
    mobs: { werwolf: 'Geisterhund' } },
  /* nachmittags im Wechsel von drei Spieltagen */
  { id: 'brand', kind: 'fire', name: 'Brand der Königsstadt', at: 15, len: 4, cyc: [3, 0], where: 'in der Königsstadt', siteAt: [2966, 2300, 'die Königsstadt'],
    soon: 'Über den Dächern der Königsstadt steigt Rauch auf. Ein Funke ist in ein Strohlager gefallen!', start: 'Feuer in der Königsstadt! Füllt Eimer an den Brunnen und löscht die brennenden Häuser, bevor die Gassen in Flammen stehen.',
    won: 'Die Königsstadt ist gerettet', lost: 'Das Feuer frisst sich durch die Gassen, mehrere Häuser brennen nieder.', prize: 'Zunftmedaille der Königsstadt', prizeAcc: 'die Zunftmedaille der Königsstadt', aff: ['hp', 'arm', 'spd'] },
  { id: 'pest', kind: 'raid', name: 'Der Rattenkönig', at: 15, len: 4, cyc: [3, 1], boss: 'werwolf', bossName: 'Der Rattenkönig', where: 'im Dorf am Fluss', ratKing: true,
    siteAt: [1760, 2340, 'das Dorf am Fluss'], bossAt: [1770, 2330], goal: [1760, 2350, 170, 110], wave: [8, 15, 12], need: [30, 10, 90], hpf: .45, unit: 'Pestratten erschlagen',
    ins: [[1590, 2300], [1960, 2240], [1760, 2530], [1900, 2450]], pick: () => 'ratte',
    soon: 'In den Kornspeichern des Dorfes am Fluss raschelt und quiekt es. Die Pestratten kommen!', start: 'Pestratten überschwemmen das Dorf am Fluss! Erschlagt sie, bis der Rattenkönig selbst aus dem Speicher kriecht.',
    won: 'Der Rattenkönig ist erschlagen', lost: 'Die Ratten verschwinden in den Gräben, die Pest bleibt im Dorf.', prize: 'Pfeife des Rattenfängers', prizeAcc: 'die Pfeife des Rattenfängers', aff: ['spd', 'crit', 'hp'], mobs: { ratte: 'Pestratte' } },
  { id: 'kaiser', kind: 'escort', name: 'Der König kommt', at: 15, len: 5, cyc: [3, 2], where: 'von der Königsburg zur Königsstadt', siteAt: [1900, 640, 'die Königsburg'],
    soon: 'Ein Bote reitet durchs Land: Heute zieht König Albrecht von der Königsburg in die Königsstadt!', start: 'Der Zug des Königs bricht von der Königsburg auf! Schützt ihn auf dem Weg in die Königsstadt vor Strauchdieben und Wegelagerern.',
    won: 'Der König ist in der Königsstadt', lost: 'Der König kehrt um, der Weg war zu unsicher.', prize: 'Königlicher Gnadenpfennig', prizeAcc: 'den Königlichen Gnadenpfennig', aff: ['hp', 'str', 'crit'],
    pick: R => R() < .35 ? 'armbrust' : 'pluend', mobs: { pluend: 'Strauchdieb', armbrust: 'Wegelagerer' } }
];
const EV_KAISER = [[1900, 600], [1904, 700], [1940, 744], [1970, 790], [1946, 836], [1890, 874], [1860, 930], [1876, 1010], [1898, 1100], [1900, 1200], [1900, 1310], [2150, 1330], [2350, 1372], [2470, 1400], [2620, 1404], [2760, 1384], [2830, 1480], [2900, 1600], [2950, 1720], [2966, 1800], [2966, 1880], [2966, 1990], [2966, 2120]];
const EV_AMBUSH = [.24, .5, .77], EV_KSPEED = 34;
const EV_JAGD = [['den Finsterwald', 640, 600], ['das Moor', 430, 2600], ['den Galgenberg', 3760, 1150]];
const EV_RAID_IN = [[2700, 700], [2610, 850], [2380, 650], [2530, 500]];
const EVT = { cur: null, raid: false, soonId: '', art: {} };
const evArt = k => EVT.art[k] || (EVT.art[k] = ghostArt(artOf(k)));
/* Wann ist was? Letzter Beginn vor jetzt; läuft es noch, oder kommt es in der nächsten Spielstunde? */
function evInfo(d, now){
  const s = Math.floor((now - d.at * 60) / DAY_LEN) * DAY_LEN + d.at * 60, day = Math.floor(s / DAY_LEN);
  const ok = n => !d.cyc || n % d.cyc[0] === d.cyc[1];   // manche Ereignisse nur an jedem dritten Spieltag
  if (ok(day) && now < s + d.len * 60) return { st: 'on', t0: s, id: d.id + ':' + day };
  if (ok(day + 1) && now > s + DAY_LEN - 60) return { st: 'soon', t0: s + DAY_LEN, id: d.id + ':' + (day + 1) };
  return null;
}
function evSite(d, t0){
  if (d.siteAt) return Object.assign(gNear(d.siteAt[0], d.siteAt[1]), { name: d.siteAt[2] });
  const J = EV_JAGD[Math.floor(t0 / DAY_LEN) % EV_JAGD.length];
  return Object.assign(gNear(J[1], J[2]), { name: J[0] });
}
const evHex = a => { let s = ''; for (let i = 0; i < EV_N; i += 4) s += (a[i] | a[i + 1] << 1 | a[i + 2] << 2 | a[i + 3] << 3).toString(16); return s; };
const evUnhex = (s, out) => { if (typeof s !== 'string') return; for (let j = 0; j < Math.min(s.length, EV_N / 4); j++){ const v = parseInt(s[j], 16) || 0; for (let b = 0; b < 4; b++) if (v >> b & 1) out[j * 4 + b] = 1; } };
function evPres(){
  const E = EVT.cur, k = evHex(E.killed), d = Math.round(E.dmg), f = E.fb ? E.fb.slice() : null, sw = E.path ? Math.round(E.s) : null;
  HERO.evCur = { id: E.id, k, d, c: E.contrib ? 1 : 0, f, s: sw };
  return { id: E.id, k, d, n: 1, f, s: sw };
}
/* alle, die mitmachen: ich und die Mitspieler mit derselben Kennung; wer gegangen ist, zählt mit seinem letzten Stand weiter */
function evParts(E){
  for (const q of PEERS.values()){ const e = q.ev; if (e && e.id === E.id && e.n) E.seen.set(q.by || q.peer, { lv: q.lv, d: clamp(+e.d || 0, 0, 1e7), k: typeof e.k === 'string' ? e.k : '',
    f: Array.isArray(e.f) ? e.f.slice(0, 8).map(v => clamp(v | 0, 0, 50)) : null, s: Number.isFinite(+e.s) ? +e.s : 0 }); }
  return [{ lv: HERO.lvl, d: E.dmg, me: true }].concat([...E.seen.values()]);
}
function evTick(dt){
  if (!HERO || G.mode === 'title') return;
  const now = skyNow();
  let act = null;
  for (const d of EV_DEFS){
    const i = evInfo(d, now); if (!i) continue;
    if (i.st === 'on') act = Object.assign({ d }, i);
    else if (EVT.soonId !== i.id){ EVT.soonId = i.id; if (G.mode === 'play' || G.mode === 'menu'){ logLine(d.soon, '#ff9a8a'); Sound.bell(); } }
  }
  if (act && (!EVT.cur || EVT.cur.id !== act.id)) evBegin(act, now);
  if (!act && EVT.cur){ if (!EVT.cur.over) evEnd(false); EVT.cur = null; renderTracker(); }
  if (EVT.cur) evRun(dt, now);
  const raid = !!(EVT.cur && EVT.cur.d.id === 'ueberfall' && !EVT.cur.over);
  if (raid !== EVT.raid){ EVT.raid = raid; if (!DG_ON) updateZone(false); }
}
function evBegin(a, now){
  if (EVT.cur) evClear(EVT.cur);
  const d = a.d, E = EVT.cur = { d, id: a.id, t0: a.t0, t1: a.t0 + d.len * 60, site: evSite(d, a.t0), killed: new Uint8Array(EV_N), all: new Uint8Array(EV_N),
    dmg: 0, part: false, contrib: false, spawned: new Map(), boss: null, phase: { hunt: 'boss', fire: 'fire', escort: 'walk' }[d.kind] || 'raid', over: false, won: false, key: '', need: 20, seen: new Map() };
  if (d.kind === 'fire'){ E.fires = evFires(); E.fb = E.fires.map(() => 0); }
  if (d.kind === 'escort'){ E.path = EV_KAISER.map(q => gNear(q[0], q[1])); E.cum = [0]; for (let i = 1; i < E.path.length; i++) E.cum.push(E.cum[i - 1] + Math.hypot(E.path[i].x - E.path[i - 1].x, E.path[i].y - E.path[i - 1].y)); E.len = E.cum[E.cum.length - 1]; E.s = 0; E.ambK = 0; E.lastT = now; E.pos = E.path[0]; E.dir = 'down'; }
  const C = HERO.evCur;   // nach dem Neuladen: eigener Beitrag zu diesem Ereignis
  if (C && C.id === E.id){ evUnhex(C.k, E.killed); E.dmg = clamp(+C.d || 0, 0, 1e7); E.contrib = !!C.c; E.part = true; if (E.fb && Array.isArray(C.f)) E.fb = E.fb.map((v, i) => clamp(C.f[i] | 0, 0, 50)); if (E.path && C.s) E.s = clamp(+C.s || 0, 0, E.len); }
  HERO.evDone = HERO.evDone || {};
  if (HERO.evDone[E.id]){ E.over = true; E.won = HERO.evDone[E.id] === 2; }
  if (!E.over && now - a.t0 < 40 && (G.mode === 'play' || G.mode === 'menu')){
    showBanner(d.name, d.id === 'jagd' ? 'über ' + E.site.name : d.where);
    logLine(d.start + (d.id === 'jagd' ? ' Sie zieht über ' + E.site.name + '.' : ''), '#ff9a8a');
    if (d.id === 'jagd'){ Sound.howl(); setTimeout(() => Sound.horn(), 700); } else if (d.kind === 'escort'){ Sound.horn(); setTimeout(() => Sound.horn(), 500); Sound.cheer(.6); } else { Sound.bell(); setTimeout(() => Sound.bell(), 600); if (d.kind === 'raid') Sound.horn(); }
  }
  renderTracker();
}
/* Gegner Nummer i: Art, Eingang, Ziel im Dorf, alles aus dem gemeinsamen Zufall */
function evSpawn(E, i, w){
  const R = rng(hashStr(E.id + ':' + i)), d = E.d, k = G.knight;
  let m;
  if (d.kind === 'raid'){
    const ins = d.ins || EV_RAID_IN, kind = d.pick(R), e = ins[(w + i) % ins.length], gl = d.goal;
    const p = gNear(e[0] + (R() - .5) * 60, e[1] + (R() - .5) * 50), goal = gNear(gl[0] + (R() - .5) * gl[2], gl[1] + (R() - .5) * gl[3]);
    m = createMonster(kind, p.x, p.y, clamp(HERO.lvl + (R() < .3 ? 1 : 0), 3, MAX_LVL), null);
    m.hx = goal.x; m.hy = goal.y; m.tx = goal.x; m.ty = goal.y; m.walking = true; m.wT = 40; m.march = true;
    m.nm = d.mobs[kind];
  } else if (d.kind === 'escort'){
    const kind = d.pick(R), c = evAt(E, EV_AMBUSH[w] * E.len), side = R() < .5 ? -1 : 1;
    const p = gNear((c.x + side * (90 + R() * 70)) / WS, (c.y + (R() - .5) * 160) / WS);
    m = createMonster(kind, p.x, p.y, clamp(HERO.lvl + (R() < .3 ? 1 : 0), 3, MAX_LVL), null);
    m.hx = c.x; m.hy = c.y; m.nm = d.mobs[kind];
    if (Math.hypot(G.knight.x - m.x, G.knight.y - m.y) < 500) engage(m, true);
  } else {
    const a = R() * Math.PI * 2, r = 120 + R() * 90, c = E.boss || E.site;
    const p = gNear((c.x + Math.cos(a) * r) / WS, (c.y + Math.sin(a) * r * .7) / WS);
    m = createMonster('werwolf', p.x, p.y, clamp(HERO.lvl - 2, 4, MAX_LVL), null);
    m.art = evArt('werwolf'); m.nm = 'Geisterhund'; m.hx = c.x; m.hy = c.y; m.ghost = true;
    if (Math.hypot(k.x - m.x, k.y - m.y) < 400) engage(m, true);
  }
  m.zone = gZone(m.x, m.y).id; m.ev = { id: E.id, i };
  E.spawned.set(i, m);
  if (!d.ghost) for (let j = 0; j < 6; j++) G.parts.push({ x: m.x + rand(-8, 8), y: m.y, vx: rand(-20, 20), vy: rand(-30, -10), life: .5, c: '#6e5a42', g: 40 });
  return m;
}
function evSpawnBoss(E, lvl){
  const d = E.d, p = d.bossAt ? gNear(d.bossAt[0], d.bossAt[1]) : E.site;
  const m = createMonster(d.boss, p.x, p.y, lvl, null);
  m.ev = { id: E.id, boss: true }; m.nm = d.bossName; m.summoned = true; m.hx = p.x; m.hy = p.y; m.zone = gZone(p.x, p.y).id;
  if (d.ghost){ m.art = evArt(d.boss); m.ghost = true; }
  if (d.ratKing) m.art = ratKingArt();
  E.boss = m; G.flash = .35; Sound.thunder();
  for (let j = 0; j < 30; j++) G.parts.push({ x: m.x + rand(-16, 16), y: m.y - rand(0, 40), vx: rand(-40, 40), vy: rand(-80, -20), life: .9, c: d.ghost ? '#9fdcff' : '#b3202a', g: 30, glow: true });
  return m;
}
function evRun(dt, now){
  const E = EVT.cur, k = G.knight, d = E.d;
  if (E.over){ evClear(E); return; }
  const outside = !G.inside && !DG_ON, dist = Math.hypot(k.x - E.site.x, k.y - E.site.y), near = outside && dist < 1400;
  if (((outside && dist < (d.kind === 'fire' ? 1100 : 800)) || E.contrib) && G.mode === 'play' && !E.part && d.kind !== 'escort'){ E.part = true; sendPresence(true); }
  // Fortschritt aller: eigene Bits und die der anderen
  const parts = evParts(E);
  E.all.set(E.killed);
  for (const p of parts) if (p.k) evUnhex(p.k, E.all);
  let killed = 0; for (let i = 0; i < EV_N; i++) killed += E.all[i];
  E.killedN = killed; E.parts = parts.length;
  if (d.kind === 'raid'){
    E.need = window.__evNeed || Math.min(d.need[2], d.need[0] + d.need[1] * (parts.length - 1));   // __evNeed: zum Ausprobieren
    if (E.phase === 'raid' && killed >= E.need){ E.phase = 'boss'; if (G.mode === 'play'){ showBanner(d.bossName, d.ratKing ? 'kriecht aus dem Kornspeicher' : 'Der Hauptmann der Bande stellt sich'); logLine(d.ratKing ? 'Der Boden bebt, die Ratten fliehen in alle Richtungen: Der Rattenkönig kommt!' : 'Die Bande weicht! Da reitet ihr Hauptmann heran: ' + d.bossName + '.', '#ff9a8a'); Sound.horn(); } }
    const [wn, wt, wc] = d.wave;
    if (near) for (let w = 0; w < wc; w++){
      if (now < E.t0 + 10 + w * wt || (E.phase !== 'raid' && !d.ratKing)) break;
      for (let j = 0; j < wn; j++){ const i = w * wn + j; if (i < EV_N && !E.all[i] && !E.spawned.has(i)) evSpawn(E, i, w); }
    }
  }
  if (d.kind === 'fire') return evFireRun(E, parts, now, near);
  if (d.kind === 'escort'){ evEscortRun(E, parts, now); if (E.over) return; }
  // Leben des Anführers aus dem Schaden aller
  const maxHp = d.boss ? Math.round(parts.reduce((a, p) => a + monHp(d.boss, clamp(p.lv, 1, MAX_LVL)), 0) * d.hpf) : 0;
  const dealt = parts.reduce((a, p) => a + p.d, 0), hp = Math.max(0, maxHp - dealt);
  E.bossHp = hp; E.bossMax = maxHp;
  if (E.phase === 'boss'){
    if (hp <= 0 && dealt > 0) return evEnd(true);
    if (near && (!E.boss || !G.mons.includes(E.boss)) && (d.kind === 'raid' || now > E.t0 + 3)) evSpawnBoss(E, clamp(Math.max(...parts.map(p => p.lv)) + 1, 4, MAX_LVL + 2));
    if (E.boss){ E.boss.max = maxHp; E.boss.hp = Math.max(1, hp); }
    // Geisterhunde: alle 25 Sekunden zwei neue, solange der Jäger lebt
    if (d.ghost && near && E.boss) for (let w = 0; w < 14; w++){
      if (now < E.t0 + 8 + w * 25) break;
      for (let j = 0; j < 2; j++){ const i = w * 2 + j; if (!E.all[i] && !E.spawned.has(i)) evSpawn(E, i, w); }
    }
  }
  // anderswo Erschlagene verschwinden hier; Verschwundene (zu weit weg) dürfen wiederkommen
  if (outside) for (const [i, m] of E.spawned){
    const here = G.mons.includes(m);
    if (here && E.all[i] && !E.killed[i]){ G.mons.splice(G.mons.indexOf(m), 1); burst(m.x, m.y - 14, d.ghost ? ['#9fdcff', '#e8f6ff'] : ['#6e5a42', '#c9c2ad'], 10, 60, d.ghost); }
    if (!G.mons.includes(m) && !E.all[i]) E.spawned.delete(i);
  }
  if (d.kind === 'escort') return;
  const left = Math.max(0, E.t1 - now), key = E.phase + ':' + killed + '/' + E.need + ':' + Math.ceil(left) + ':' + Math.round(hp / Math.max(1, maxHp) * 100) + ':' + near;
  if (key !== E.key){ E.key = key; renderTracker(); }
}
/* ---------- Brand der Königsstadt: Eimer vom Brunnen zu den brennenden Häusern ----------
   Acht Häuser fangen nacheinander Feuer. Jeder zählt in der Anwesenheit (f), wie viele Eimer er an welches Haus
   gebracht hat; zusammen gelöscht ist ein Feuer, wenn genug Eimer da waren. */
const EV_IGNITE = [0, 0, 0, 35, 60, 90, 120, 150];
function evFires(){
  const c = gNear(2966, 2300), houses = GPROPS.filter(p => (p.kind === 'stadthaus' || p.kind === 'fachwerkhaus') && Math.abs(p.x - c.x) < 1000 && Math.abs(p.y - c.y) < 800)
    .sort((a, b) => ((a.x * 7 + a.y * 13) % 97) - ((b.x * 7 + b.y * 13) % 97)), out = [];
  for (const p of houses){ if (out.length >= 8) break; if (out.some(f => Math.hypot(f.x - p.x, f.y - p.y) < 260)) continue; out.push({ x: p.x, y: p.y - p.ay * .55, fx: p.x, fy: p.y + 22, w: p.ax * .7, ign: EV_IGNITE[out.length] }); }
  return out;
}
const evWells = () => EVT.wells || (EVT.wells = GPROPS.filter(p => p.kind === 'brunnen' && Math.hypot(p.x - gNear(2966, 2300).x, p.y - gNear(2966, 2300).y) < 1500));
function evFireRun(E, parts, now, near){
  const need = 3 + Math.min(5, parts.length - 1);
  let out = 0, burn = 0;
  E.fires.forEach((f, i) => {
    let tot = E.fb[i]; for (const p of parts) if (!p.me && p.f) tot += p.f[i] || 0;
    f.lit = now >= E.t0 + f.ign; f.tot = tot; f.need = need;
    const was = f.out; f.out = f.lit && tot >= need;
    if (f.out){ out++; if (!was && f.seen){ burst(f.x, f.y, ['#c8d4e0', '#8a8478', '#ffffff'], 18, 70); if (Math.hypot(G.knight.x - f.x, G.knight.y - f.y) < 700) logLine('Ein Feuer ist gelöscht.', '#9fe08a'); } }
    else if (f.lit){ burn++; if (!f.seen && Math.hypot(G.knight.x - f.x, G.knight.y - f.y) < 900 && G.mode === 'play'){ floatText(f.x, f.y - 30, 'Feuer!', '#ff9a50', 2, 1.6); Sound.bell(); } }
    f.seen = f.seen || f.lit;
  });
  E.outN = out; E.burnN = burn;
  if (out >= E.fires.length) return evEnd(true);
  if (near && burn && Math.random() < .02) Sound.fire();
  const left = Math.max(0, E.t1 - now), key = 'f' + out + ':' + burn + ':' + Math.ceil(left);
  if (key !== E.key){ E.key = key; renderTracker(); }
}
/* ---------- Der König kommt: Zug auf dem Weg von der Burg zur Stadt ----------
   Der Zug geht seinen Weg, an drei Stellen lauern Strauchdiebe. Er wartet, bis alle sechs an einer Stelle erschlagen
   sind (Bitliste wie bei der Räuberbande). Wer weiter ist, meldet seinen Stand (s); der weiteste gilt. */
function evAt(E, s){
  let i = 1; while (i < E.cum.length - 1 && E.cum[i] < s) i++;
  const a = E.path[i - 1], b = E.path[i], t = clamp((s - E.cum[i - 1]) / Math.max(1, E.cum[i] - E.cum[i - 1]), 0, 1);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: b.x - a.x, dy: b.y - a.y };
}
function evEscortRun(E, parts, now){
  const dt = Math.min(1, Math.max(0, now - E.lastT)); E.lastT = now;
  for (const p of parts) if (!p.me && p.s > E.s && p.s - E.s < 600) E.s = p.s;
  const k = E.ambK < EV_AMBUSH.length ? EV_AMBUSH[E.ambK] * E.len : Infinity;
  const ids = E.ambK < EV_AMBUSH.length ? [0, 1, 2, 3, 4, 5].map(j => E.ambK * 6 + j) : [];
  const cleared = ids.length && ids.every(i => E.all[i]);
  if (E.s >= k - 1 && !cleared){
    E.s = Math.min(E.s, k);
    if (!E.halt){ E.halt = true; if (Math.hypot(G.knight.x - E.pos.x, G.knight.y - E.pos.y) < 1200 && G.mode === 'play'){ showBanner('Überfall auf den Königszug', 'Schützt den König!'); Sound.horn(); } }
    const outside = !G.inside && !DG_ON;
    if (outside && Math.hypot(G.knight.x - E.pos.x, G.knight.y - E.pos.y) < 1400) for (const i of ids) if (!E.all[i] && !E.spawned.has(i)) evSpawn(E, i, E.ambK);
  } else {
    if (E.halt && cleared){ E.halt = false; E.ambK++; if (Math.hypot(G.knight.x - E.pos.x, G.knight.y - E.pos.y) < 1200) logLine('Die Strauchdiebe sind vertrieben, der Zug des Königs zieht weiter.', '#9fe08a'); }
    else if (cleared) E.ambK++;
    E.s = Math.min(E.len, E.s + EV_KSPEED * dt);
  }
  E.ambLeft = ids.filter(i => !E.all[i]).length;
  const p = evAt(E, E.s); E.pos = p; E.walking = !E.halt && E.s < E.len;
  E.dir = Math.abs(p.dx) > Math.abs(p.dy) ? (p.dx > 0 ? 'right' : 'left') : (p.dy > 0 ? 'down' : 'up');
  const kn = G.knight;
  if (!E.part && G.mode === 'play' && !G.inside && !DG_ON && Math.hypot(kn.x - p.x, kn.y - p.y) < 700){ E.part = true; sendPresence(true); }
  if (E.s >= E.len) return evEnd(true);
  const left = Math.max(0, E.t1 - now), key = 'k' + Math.round(E.s / E.len * 100) + ':' + E.halt + ':' + E.ambLeft + ':' + Math.ceil(left);
  if (key !== E.key){ E.key = key; renderTracker(); }
}
/* Handgriffe beim Brand */
function evAction(){
  const E = EVT.cur; if (!E || E.over || E.d.kind !== 'fire' || G.mode !== 'play' || DG_ON) return null;
  const k = G.knight;
  if (!G.bucket){ for (const w of evWells()) if (Math.hypot(k.x - w.x, k.y - w.y - 14) < 46) return { key: 'eimer', label: 'Eimer füllen' }; return null; }
  let best = null, bd = 90;
  E.fires.forEach((f, i) => { if (!f.lit || f.out) return; const d = Math.hypot(k.x - f.fx, k.y - f.fy); if (d < bd){ bd = d; best = i; } });
  return best != null ? { key: 'l' + best, label: 'Löschen', fire: best } : null;
}
function evDo(a){
  const E = EVT.cur, k = G.knight; if (!E) return;
  if (a.key === 'eimer'){ G.bucket = true; Sound.tone(520, .12, 'sine', .03, -200); Sound.noise(.25, .04, 900); floatText(k.x, k.y - KS.ay - 6, 'Eimer voll', '#9cc8ff'); }
  else if (a.fire != null){
    const f = E.fires[a.fire]; G.bucket = false; E.fb[a.fire]++; E.contrib = true;
    Sound.noise(.6, .07, 2400); Sound.tone(900, .3, 'sine', .015, -500);
    for (let j = 0; j < 22; j++) G.parts.push({ x: f.fx + rand(-12, 12), y: f.y + rand(-10, 30), vx: rand(-30, 30), vy: rand(-70, -20), life: rand(.6, 1.2), c: Math.random() < .5 ? '#e8eef4' : '#9aa6b0', g: -10 });
    floatText(f.x, f.y - 20, 'Zisch! ' + Math.min(f.need, (f.tot || 0) + 1) + ' / ' + f.need, '#c8dcff', 1, 1.4);
  }
  G.evActKey = ''; updateNear(); sendPresence(true); markDirty();
}
/* Löscheimer in der Hand: Holz mit zwei Eisenbändern, Wasser obenauf */
const BUCKET = (() => { const c = canvasOf(14, 17), g = c.getContext('2d');
  g.fillStyle = OUT; g.fillRect(1, 5, 12, 12); g.fillRect(3, 0, 8, 1); g.fillRect(2, 1, 1, 4); g.fillRect(11, 1, 1, 4);
  g.fillStyle = '#6f583f'; g.fillRect(2, 6, 10, 10); g.fillStyle = '#9e8660'; g.fillRect(2, 6, 3, 10); g.fillStyle = '#4a3a28'; g.fillRect(10, 6, 2, 10);
  g.fillStyle = '#8a8e96'; g.fillRect(2, 8, 10, 1); g.fillRect(2, 13, 10, 1);
  g.fillStyle = '#5a8ac8'; g.fillRect(3, 6, 8, 2); g.fillStyle = '#a8d0f0'; g.fillRect(4, 6, 3, 1);
  return c; })();
function drawBucket(x, y){ ctx.drawImage(BUCKET, Math.round(x) - 7, Math.round(y) - 8); }
function evFlames(cam){
  const E = EVT.cur; if (!E || E.d.kind !== 'fire' || E.over || G.inside || DG_ON) return;
  for (const f of E.fires){
    if (!f.lit || !inView(f.x, f.y, cam, 120)) continue;
    if (f.out){ if (Math.random() < .3) G.parts.push({ x: f.x + rand(-14, 14), y: f.y, vx: rand(2, 10), vy: rand(-24, -12), life: rand(1.4, 2.2), c: '#6e6a70', g: -2, s: 3 }); continue; }
    const big = Math.max(.35, 1 - (f.tot || 0) / f.need);   // je mehr Wasser, desto kleiner
    // Feuerschein über dem Haus
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, 90 * big + 30); gr.addColorStop(0, 'rgba(255,140,50,' + (.35 * big).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = gr; ctx.fillRect(f.x - 130, f.y - 130, 260, 260); ctx.restore();
    // Flammen in doppelter Größe über die Dachbreite
    for (const [ox, oy, k] of [[-.5, 10, .8], [-.18, -4, 1], [.18, -2, 1], [.5, 12, .8]]){
      const sc = (1.3 + big * .9) * k;
      ctx.save(); ctx.translate(Math.round(f.x + ox * f.w), Math.round(f.y + oy)); ctx.scale(sc, sc);
      flameHD(0, 0, G.t * 1.1 + ox * 3 + f.x * .01, big > .5); ctx.restore();
    }
    if (Math.random() < .9) G.parts.push({ x: f.x + rand(-f.w * .5, f.w * .5), y: f.y - 10, vx: rand(-12, 12), vy: rand(-70, -34), life: rand(.5, 1.2), c: Math.random() < .5 ? '#e0782a' : '#ffd36a', g: -10, glow: true });
    if (Math.random() < .8) G.parts.push({ x: f.x + rand(-16, 16), y: f.y - 34, vx: rand(4, 16), vy: rand(-34, -18), life: rand(2, 3.2), c: Math.random() < .5 ? '#2e2a30' : '#48444c', g: -3, s: 4 });
  }
}
function evLights(v, L){
  const E = EVT.cur; if (!E || E.over || G.inside || DG_ON) return;
  if (E.d.kind === 'fire') for (const f of E.fires) if (f.lit && !f.out && v(f.x, f.y, 300)) L.push([f.x, f.y, 280, 1, 1]);
  if (E.d.kind === 'escort' && E.pos && v(E.pos.x, E.pos.y, 200)) L.push([E.pos.x, E.pos.y - 30, 200, .9, 1]);
}
/* der Königszug: der König zu Pferd mit Krone, davor und dahinter zwei Ritter der Garde */
const EV_ESC = [0, 1].map(() => ({ x: 0, y: 0, dir: 'down', moving: false, anim: 0, atkT: 0, atkLen: SWING, swA0: 0, swA1: 0, mult: 1, bashT: 0, inv: 0, slowT: 0, ride: null, lance: 0 }));
function evList(cam, list){
  const E = EVT.cur; if (!E || E.d.kind !== 'escort' || E.over || !E.pos || G.inside || DG_ON) return;
  const p = E.pos, l = Math.hypot(p.dx, p.dy) || 1, ux = p.dx / l, uy = p.dy / l;
  if (!inView(p.x, p.y, cam, 120)) return;
  const set = knightSet('reich', '44444'), f = E.walking ? (G.t * 6 | 0) % 4 : 4;
  list.push({ y: p.y + .17, d: () => {
    drawMounted(ctx, 'streitross', set.key, E.dir, p.x, p.y, f);
    const hx = Math.round(p.x) - 4, hy = Math.round(p.y) - 70;   // Krone über dem Helm
    ctx.fillStyle = OUT; ctx.fillRect(hx - 1, hy - 1, 11, 7); ctx.fillStyle = '#e0c040'; ctx.fillRect(hx, hy + 2, 9, 3); ctx.fillRect(hx, hy, 1, 2); ctx.fillRect(hx + 4, hy - 1, 1, 3); ctx.fillRect(hx + 8, hy, 1, 2); ctx.fillStyle = '#b8281e'; ctx.fillRect(hx + 4, hy + 3, 1, 1);
    drawText('König Albrecht', p.x, p.y - 92, '#ffd98a');
  } });
  EV_ESC.forEach((g, i) => {
    const off = i ? -46 : 40, side = i ? 18 : -18;
    g.x = p.x + ux * off - uy * side; g.y = p.y + uy * off + ux * side; g.dir = E.dir; g.moving = E.walking; g.anim = E.walking ? G.t * 8 : 0;
    list.push({ y: g.y + .16, d: () => drawKnightAt(g, set, false, 1) });
  });
}
/* Rattenkönig: eine riesige Ratte, gescheckt und grau */
let RATKING = null;
function ratKingArt(){
  if (RATKING) return RATKING;
  const A = MON_ART.ratte, S = 2.4, sc = src => { const c = canvasOf(Math.round(src.width * S), Math.round(src.height * S)), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height); return c; };
  const fr = s => ({ img: sc(s.img), glow: s.glow ? sc(s.glow) : null, white: sc(s.white) });
  const side = o => ({ r: o.r.map(fr), l: o.l.map(fr) });
  const big = Object.assign({}, A, { w: Math.round(A.w * S), h: Math.round(A.h * S), ax: Math.round(A.ax * S), ay: Math.round(A.ay * S), move: side(A.move), idle: side(A.idle), act: side(A.act || A.idle) });
  return (RATKING = tintArt(big, (r, g, b) => [r * .8 + 20, g * .85 + 10, b * .7 + 18]));
}
/* ein Gegner des Ereignisses fällt hier */
function evMark(m){
  const E = EVT.cur;
  if (!E || m.ev.id !== E.id) return;
  if (m.ev.boss){ E.boss = null; return; }
  E.killed[m.ev.i] = 1; E.all[m.ev.i] = 1;
  sendPresence(true);
}
function evEnd(won){
  const E = EVT.cur, d = E.d, k = G.knight;
  E.over = true; E.won = won; G.bucket = false;
  HERO.evDone = HERO.evDone || {}; HERO.evDone[E.id] = won ? 2 : 1;
  const ks = Object.keys(HERO.evDone); if (ks.length > 10) delete HERO.evDone[ks[0]];
  evClear(E);
  if (!won){ if (E.part) logLine(d.lost, '#d8c69c'); renderTracker(); return; }
  if (E.contrib){
    orCount('boss'); lwAdd(15); ehCount('ev'); rrEvent(d.id);
    const gold = 25 + HERO.lvl * 5, xp = Math.round(xpNeed(HERO.lvl) * .2) + 20;
    HERO.gold += gold; HERO.potions = Math.min(20, HERO.potions + 2);
    HERO.evFirst = HERO.evFirst || {};
    const first = !HERO.evFirst[d.id];
    const it = first ? makeItem('kleinod', HERO.lvl + 1, 3, { name: d.prize, aff: d.aff }) : makeItem(pick(SLOTS), HERO.lvl + 1, Math.random() < .3 ? 3 : 2);
    HERO.evFirst[d.id] = true;
    const j = HERO.inv.indexOf(null);
    if (j >= 0) HERO.inv[j] = it; else dropLoot(k, 'item', 0, it);
    const itN = first ? d.prizeAcc : it.n;
    showBanner(d.won, gold + ' Gulden, ' + xp + ' EP und ' + itN);
    logLine(d.won + '! Ihr erhaltet ' + gold + ' Gulden, zwei Heiltränke und ' + itN + (E.parts > 2 ? '. Mit Euch ' + (d.kind === 'fire' ? 'halfen ' : 'kämpften ') + (E.parts - 1) + ' Ritter.' : E.parts === 2 ? '. Ein zweiter Ritter ' + (d.kind === 'fire' ? 'half' : 'kämpfte') + ' mit Euch.' : '.'), '#ffd98a');
    logItem('Lohn: ', it);
    gainXp(xp); Sound.levelUp(); Sound.cheer(1); G.flash = .3;
    burst(k.x, k.y - KBODY, ['#c9a227', '#ecd27a', '#ffffff'], 36, 120, true);
    updateHud(); pushFame(); markDirty(true);
  } else if (E.part) logLine(d.won + '. Andere Ritter haben es geschafft.', '#ffd98a');
  renderTracker();
}
/* übrige Gegner fliehen oder verwehen */
function evClear(E){
  const lists = DG_ON && DG_ON.world ? [G.mons, DG_ON.world.mons] : [G.mons];
  for (const [, m] of E.spawned) for (const L of lists){ const i = L.indexOf(m); if (i >= 0){ L.splice(i, 1); if (L === G.mons) burst(m.x, m.y - 14, E.d.ghost ? ['#9fdcff', '#e8f6ff'] : ['#6e5a42', '#c9c2ad'], 8, 60, E.d.ghost); } }
  E.spawned.clear();
  if (E.boss) for (const L of lists){ const i = L.indexOf(E.boss); if (i >= 0) L.splice(i, 1); }
  E.boss = null;
}
/* Zeilen oben links und die Marke auf den Karten */
function evRows(box){
  const now = skyNow();
  const E = EVT.cur;
  if (!E){
    for (const d of EV_DEFS){ const i = evInfo(d, now); if (i && i.st === 'soon'){ const p = el('p', 'ev'); p.append(el('b', null, 'Gleich: ' + d.name), ' ' + (d.id === 'jagd' ? 'heute Nacht' : d.where)); box.append(p); } }
    return;
  }
  if (E.over && !E.won) return;
  const p = el('p', 'ev'), left = Math.max(0, E.t1 - now), mm = Math.floor(left / 60), ss = String(Math.floor(left % 60)).padStart(2, '0');
  if (E.over){ p.append(el('b', null, E.d.won)); box.append(p); return; }
  p.append(el('b', null, E.d.name), ' ' + mm + ':' + ss);
  box.append(p);
  const q = el('p', 'ev');
  if (E.phase === 'fire') q.append(el('span', null, (E.outN || 0) + ' von ' + E.fires.length + ' Feuern gelöscht' + (E.burnN ? ', ' + E.burnN + ' brennen' : '')));
  else if (E.phase === 'walk') q.append(el('span', null, E.halt ? 'Überfall! ' + (E.ambLeft || 0) + ' Strauchdiebe am Weg' : 'Der Zug hat ' + Math.round(E.s / E.len * 100) + ' % des Weges hinter sich'));
  else if (E.phase === 'raid') q.append(el('span', null, (E.killedN || 0) + ' von ' + E.need + ' ' + E.d.unit));
  else q.append(el('span', null, (E.d.id === 'jagd' ? 'über ' + E.site.name.replace(/^(den|das) /, '') + ', ' : '') + E.d.bossName.replace(/^Der /, '') + ' ' + Math.round((E.bossHp || 0) / Math.max(1, E.bossMax || 1) * 100) + ' %'));
  if (E.parts > 1) q.append(' · ' + E.parts + ' Ritter');
  box.append(q);
}
const evMark2 = () => EVT.cur && !EVT.cur.over ? (EVT.cur.pos || EVT.cur.site) : null;

/* ---------- Ruhmeshalle: Ritter, Turnier, Feste ----------
   Alles steht im eigenen Eintrag unter heroes/<Kennung>: Stufe und Ruhm wie bisher, dazu die Turnierwertung und die
   besten Festspiele. Die Liste der zuletzt gesehenen Ritter liefert Turnier- und Festbestenlisten. */
const FREC = [
  { id: 'stein', f: 'fs', name: 'Steinstoßen', fmt: v => (v / 10).toFixed(1).replace('.', ',') + ' Ellen', hi: true },
  { id: 'klettern', f: 'fk', name: 'Maibaumklettern', fmt: v => (v / 10).toFixed(1).replace('.', ',') + ' Sekunden', hi: false },
  { id: 'springen', f: 'fj', name: 'Feuerspringen', fmt: v => v + ' Mutpunkte', hi: true },
  { id: 'schnee', f: 'fb', name: 'Schneeballschlacht', fmt: v => v + ' Sekunden', hi: false }
];
const FREC_BY = Object.fromEntries(FREC.map(r => [r.id, r]));
let fameTab = 'ritter';
function fameExtra(){
  const J = HERO.joust || {}, o = {};
  if (HERO.or){ const w = orWeek(); o.oid = HERO.or.id; o.onm = HERO.or.nm; o.okz = HERO.or.kz; o.owp = HERO.or.wp.join('-'); if (HERO.or.gm) o.ogm = 1; if (HERO.ow && HERO.ow.w === w) o.ow = HERO.ow; }
  if (J.pw || J.pl){ o.je = J.elo || 1000; o.jw = J.pw || 0; o.jl = J.pl || 0; }
  if (HERO.tw) o.tw = HERO.tw;
  for (const r of FREC){ const v = HERO.frec && HERO.frec[r.id]; if (v) o[r.f] = v; }
  return ehFameDoc(asFame(o));
}
/* bester Wert aller bekannten Ritter für ein Festspiel */
function festBest(id){
  const r = FREC_BY[id]; let best = null;
  const rows = (cloud.allRows || []).concat(HERO ? [Object.assign({ nm: HERO.name, id: cloud.uid || 'me' }, fameExtra())] : []);
  for (const x of rows){ const v = +x[r.f]; if (!v || v < 0) continue; if (!best || (r.hi ? v > best.v : v < best.v)) best = { v, nm: cleanName(x.nm) || 'Unbekannt' }; }
  return best;
}
/* ein Festspiel ist vorbei: eigenen Rekord merken, Rekord aller Ritter melden */
function festRecord(id, v){
  const r = FREC_BY[id]; if (!r || !(v > 0)) return;
  v = Math.round(v);
  HERO.frec = HERO.frec || {};
  const old = HERO.frec[id], all = festBest(id);
  if (old && (r.hi ? v <= old : v >= old)) return;
  HERO.frec[id] = v;
  const top = !all || all.nm === HERO.name || (r.hi ? v > all.v : v < all.v);
  const im = /(suche|schlacht)$/.test(r.name) ? ' in der ' : ' im ';
  logLine((top ? 'Rekord aller Ritter' : 'Neuer eigener Rekord') + im + r.name + ': ' + r.fmt(v) + '!', top ? '#ffd541' : '#ffd98a');
  if (top) Sound.cheer(1);
  pushFame(); markDirty(true);
}
function renderFameTab(){
  for (const b of document.querySelectorAll('[data-ft]')){ const on = b.dataset.ft === fameTab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }
  if (fameTab === 'ritter'){ if (cloud.fameRows) renderFame(cloud.fameRows); else renderFameLocal(); return; }
  const box = $('fameList'); box.textContent = '';
  const me = HERO || SAVED, mine = me ? Object.assign({ id: cloud.uid || 'local', nm: me.name }, HERO ? fameExtra() : {}) : null;
  const rows = (cloud.allRows || []).filter(r => r.id !== (cloud.uid || 'local')).concat(mine ? [mine] : []);
  if (fameTab === 'laender'){ asFameLw(box); return; }
  if (fameTab === 'ehre'){ ehFameTab(box, rows); return; }
  if (fameTab === 'orden'){
    const L = orKnown().slice(0, 12);
    if (!L.length){ box.append(el('li', 'empty', 'Noch steht kein Orden in der Wappenrolle. Gegründet wird beim Herold vor der Königsstadt.')); return; }
    L.forEach((o, i) => { const li = el('li', HERO && HERO.or && HERO.or.id === o.id ? 'me' : ''), nm = el('span', 'fn'), im = el('img', 'forb'); im.src = orUrl(o.wp, 2); im.alt = ''; nm.append(im, o.nm); li.append(el('span', 'fr', String(i + 1)), nm, el('span', 'fl', o.kz), el('span', 'fk', o.n + ' Ritter, zusammen Stufe ' + o.lv + (o.gm ? ' · Großmeister ' + o.gm : '') + (o.oh >= OH_STEPS[0] ? ' · Ordenshaus Stufe ' + ohLvl(o.oh) : ''))); box.append(li); });
    return;
  }
  if (fameTab === 'tjost'){
    const L = rows.filter(r => (r.jw | 0) + (r.jl | 0) > 0).map(r => ({ id: r.id, nm: cleanName(r.nm) || 'Unbekannt', e: clamp(r.je | 0, 100, 3000), w: Math.max(0, r.jw | 0), l: Math.max(0, r.jl | 0), tw: clamp(r.tw | 0, 0, 999) })).sort((a, b) => b.e - a.e).slice(0, 15);
    if (!L.length){ box.append(el('li', 'empty', 'Noch hat kein Ritter gegen einen anderen tjostiert.')); return; }
    L.forEach((r, i) => { const li = el('li', r.id === (cloud.uid || 'local') ? 'me' : ''); li.append(el('span', 'fr', String(i + 1)), el('span', 'fn', r.nm), el('span', 'fl', 'Wertung ' + r.e), el('span', 'fk', r.w + (r.w === 1 ? ' Sieg' : ' Siege') + ', ' + r.l + (r.l === 1 ? ' Niederlage' : ' Niederlagen') + (r.tw ? ' · ' + r.tw + (r.tw === 1 ? ' Großes Turnier gewonnen' : ' Große Turniere gewonnen') : ''))); box.append(li); });
    return;
  }
  let any = false;
  for (const f of FREC){
    const L = rows.filter(r => +r[f.f] > 0).map(r => ({ id: r.id, nm: cleanName(r.nm) || 'Unbekannt', v: +r[f.f] })).sort((a, b) => f.hi ? b.v - a.v : a.v - b.v).slice(0, 3);
    if (!L.length) continue;
    any = true;
    const li = el('li', 'frec'); li.append(el('span', 'fn', f.name));
    L.forEach((r, i) => li.append(el('span', 'fk' + (r.id === (cloud.uid || 'local') ? ' me' : ''), (i + 1) + '. ' + r.nm + ', ' + f.fmt(r.v))));
    box.append(li);
  }
  if (!any) box.append(el('li', 'empty', 'Noch keine Festspiele verzeichnet. Gefeiert wird an drei von vier Tagen jeder Jahreszeit.'));
}
for (const b of document.querySelectorAll('[data-ft]')) b.addEventListener('click', () => { fameTab = b.dataset.ft; renderFameTab(); });

const peerAt = p => { if (!p.in) return null; const inn = INN_BY[p.in]; if (inn) return { x: inn.dx, y: inn.y }; const d = typeof p.in === 'string' && DG_DOORS.find(o => 'dg:' + o.dg === p.in); return d ? { x: d.x, y: d.y } : null; };
function festRecordOf(g, ok){
  if (g.kind === 'stein' && g.best) festRecord('stein', g.best * 10);
  if (g.kind === 'klettern' && ok && g.clock) festRecord('klettern', g.clock * 10);
  if (g.kind === 'springen' && g.pts && ok) festRecord('springen', g.pts);
  if (g.kind === 'schnee' && ok) festRecord('schnee', 60 - g.time);
  if (FG[g.kind] && FG[g.kind].rec) FG[g.kind].rec(g, ok);
}

/* ============ Ritterorden: die Wappenrolle beim Herold ============
   Ein Orden lebt in den Einträgen seiner Ritter (heroes/<Kennung>: oid, onm, okz, owp, ogm und ow, die Taten der
   Woche). Wer gründet, wählt Namen, Kürzel und Wappen; aufnehmen kann jeder Ordensritter einen anderen, der vor ihm
   steht. Die Wochenaufgabe zählt die Taten aller Mitglieder zusammen, den Lohn holt sich jeder beim Herold. */
const OR_TINCT = [['Gold', '#d8b040', '#8a6a18'], ['Silber', '#dedcd2', '#8e8c84'], ['Rot', '#b8281e', '#661410'], ['Blau', '#2c4c9c', '#16285a'], ['Grün', '#2e7a3a', '#164020'], ['Schwarz', '#2a262e', '#0e0c10'], ['Purpur', '#7c2c7c', '#401440']];
const OR_CHARGE = [
  ['Adler', ['1001001', '1101011', '0111110', '0011100', '0111110', '0010100', '0100010']],
  ['Löwe', ['0011000', '0111100', '0011110', '0111010', '1111000', '0110100', '1100110']],
  ['Kreuz', ['0001000', '0001000', '1111111', '0001000', '0001000', '0001000', '0001000']],
  ['Stern', ['0001000', '0011100', '1111111', '0111110', '0011100', '0110110', '1000001']],
  ['Rose', ['0010100', '0111110', '1101011', '1110111', '1101011', '0111110', '0010100']],
  ['Turm', ['1010101', '1111111', '0111110', '0110110', '0111110', '0111110', '1111111']],
  ['Schwert', ['0001000', '0001000', '0001000', '0001000', '0111110', '0001000', '0011100']],
  ['Apfel', ['0001100', '0011000', '0111110', '1111111', '1111111', '0111110', '0011100']]
];
const OR_COST = 100;
const OR_TASKS = [
  { id: 'kills', t: 'Erschlagt gemeinsam Monster', per: 60, unit: 'Monster' },
  { id: 'boss', t: 'Bezwingt gemeinsam Anführer', per: 2, unit: 'Anführer' },
  { id: 'wild', t: 'Erlegt gemeinsam Wild', per: 12, unit: 'Stück Wild' },
  { id: 'chests', t: 'Hebt gemeinsam Schätze in den Gewölben', per: 1, unit: 'Truhen' }
];
const orWeek = () => Math.floor((Date.now() / 86400000 + 3) / 7);   // Wochen ab Montag
const orTask = () => OR_TASKS[orWeek() % OR_TASKS.length];
const OR_KZ_RE = /^[A-Za-zÄÖÜäöüß]{2,5}$/;
/* fremde Ordensangaben prüfen */
function orClean(o){
  if (!o || typeof o !== 'object' || typeof o.id !== 'string' || !/^[a-z0-9]{4,12}$/.test(o.id)) return null;
  const nm = cleanText(o.nm, 28), kz = typeof o.kz === 'string' && OR_KZ_RE.test(o.kz) ? o.kz : '';
  const wp = Array.isArray(o.wp) && o.wp.length === 3 ? [clamp(o.wp[0] | 0, 0, 6), clamp(o.wp[1] | 0, 0, 7), clamp(o.wp[2] | 0, 0, 6)] : [2, 0, 0];
  return nm && kz ? { id: o.id, nm, kz, wp } : null;
}
const OR_IMG = new Map();
/* Ordensbanner 13 × 17 mit Schwalbenschwanz: Feld, Bild, dunkler Rand */
function orBanner(wp){
  const key = wp.join('-'); if (OR_IMG.has(key)) return OR_IMG.get(key);
  const c = canvasOf(13, 17), g = c.getContext('2d'), F = OR_TINCT[wp[0]], C = OR_TINCT[wp[2]], bm = OR_CHARGE[wp[1]][1];
  g.fillStyle = OUT; g.fillRect(0, 0, 13, 15); g.fillRect(0, 15, 5, 2); g.fillRect(8, 15, 5, 2);
  g.fillStyle = F[1]; g.fillRect(1, 1, 11, 14); g.fillRect(1, 15, 3, 1); g.fillRect(9, 15, 3, 1);
  g.fillStyle = F[2]; g.fillRect(10, 1, 2, 14); g.fillRect(1, 14, 11, 1);
  g.fillStyle = C[1];
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if (bm[y][x] === '1') g.fillRect(3 + x, 4 + y, 1, 1);
  g.fillStyle = C[2];
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if (bm[y][x] === '1' && (y === 6 || bm[y + 1][x] !== '1')) g.fillRect(3 + x, 4 + y, 1, 1);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(1, 1, 11, 1);
  OR_IMG.set(key, c); return c;
}
const orUrl = (wp, s) => urlOf(orBanner(wp), s || 3);
/* eigene Taten der Woche */
function orCount(kind, n){
  if (!HERO || !HERO.or) return;
  const w = orWeek();
  if (!HERO.ow || HERO.ow.w !== w) HERO.ow = { w, kills: 0, boss: 0, wild: 0, chests: 0 };
  HERO.ow[kind] = (HERO.ow[kind] || 0) + (n || 1);
}
/* Mitglieder: aus der Ruhmeshalle (auch wer gerade nicht spielt), dazu die Ritter im Land */
function orMembers(){
  if (!HERO.or) return [];
  const id = HERO.or.id, map = new Map();
  for (const r of cloud.orRows || []) if (r.oid === id) map.set(r.id, { id: r.id, nm: cleanName(r.nm) || 'Unbekannt', lv: clamp(r.lv | 0, 1, MAX_LVL), at: +r.at || 0, gm: !!r.ogm, ow: r.ow && typeof r.ow === 'object' ? r.ow : null, on: false });
  for (const q of PEERS.values()) if (q.or && q.or.id === id){ const key = q.by || q.peer, m = map.get(key) || { id: key, nm: q.nm, lv: q.lv, at: Date.now(), gm: false, ow: null }; m.on = true; m.nm = q.nm; m.lv = q.lv; map.set(key, m); }
  const me = cloud.uid || 'me';
  map.set(me, { id: me, nm: HERO.name, lv: HERO.lvl, at: Date.now(), gm: !!HERO.or.gm, ow: HERO.ow, on: true, me: true });
  return [...map.values()].sort((a, b) => (b.me - a.me) || (b.on - a.on) || b.lv - a.lv);
}
function orProgress(){
  const T = orTask(), w = orWeek(), L = orMembers();
  let n = 0; for (const m of L) if (m.ow && m.ow.w === w) n += Math.max(0, +m.ow[T.id] || 0);
  return { T, n, need: Math.max(T.per * 3, T.per * L.length), members: L.length };
}
function orSubscribe(){
  if (cloud.orSub){ cloud.orSub(); cloud.orSub = null; }
  cloud.orRows = null;
  if (!cloud.db || !HERO || !HERO.or) return;
  cloud.orSub = cloud.db.collection('heroes').where('oid', '==', HERO.or.id).onSnapshot(snap => {
    cloud.orRows = snap.docs.map(s => Object.assign({ id: s.id }, s.data() || {}));
    if (G.talk && G.talk.orden && G.talk.view !== 'ordenNeu') renderTalk(G.talk.view || 'orden');
  }, () => {});
}
function orJoin(o, gm){
  HERO.or = { id: o.id, nm: o.nm, kz: o.kz, wp: o.wp.slice(), gm: gm ? 1 : 0, t: Date.now() };
  HERO.ow = { w: orWeek(), kills: 0, boss: 0, wild: 0, chests: 0 };
  orSubscribe(); cloud.fameT = 0; pushFame(); markDirty(true); sendPresence(true);
}
function orLeave(){
  if (!HERO.or) return;
  logLine('Ihr tretet aus dem Orden „' + HERO.or.nm + '“ aus.', '#d8c69c');
  HERO.or = null; HERO.ow = null; orSubscribe(); cloud.fameT = 0; pushFame(); markDirty(true); sendPresence(true);
}
function orClaim(){
  const P = orProgress(), w = orWeek();
  if (P.n < P.need || HERO.owClaim === w) return;
  HERO.owClaim = w;
  const gold = 40 + HERO.lvl * 6, xp = Math.round(xpNeed(HERO.lvl) * .15) + 15;
  HERO.gold += gold;
  const first = !HERO.orFirst, it = first ? makeItem('kleinod', HERO.lvl + 1, 3, { name: 'Ordenskette', aff: ['hp', 'str', 'arm'] }) : makeItem(pick(SLOTS), HERO.lvl + 1, 2);
  HERO.orFirst = true;
  const j = HERO.inv.indexOf(null); if (j >= 0) HERO.inv[j] = it; else dropLoot(G.knight, 'item', 0, it);
  showBanner('Ordenslohn', gold + ' Gulden, ' + xp + ' EP und ' + it.n);
  logLine('Der Herold zahlt den Ordenslohn der Woche: ' + gold + ' Gulden, ' + xp + ' EP und ' + it.n + '.', '#ffd98a');
  gainXp(xp); Sound.levelUp(); updateHud(); markDirty(true);
}
/* bekannte Orden aus der Ruhmeshalle */
function orKnown(){
  const map = new Map();
  const me = cloud.uid || 'me';
  for (const r of (cloud.allRows || []).filter(r => r.id !== me).concat(HERO && HERO.or ? [Object.assign({ id: me, nm: HERO.name, lv: HERO.lvl }, fameExtra())] : [])){
    const o = orClean({ id: r.oid, nm: r.onm, kz: r.okz, wp: typeof r.owp === 'string' ? r.owp.split('-').map(Number) : null });
    if (!o) continue;
    const e = map.get(o.id) || Object.assign(o, { n: 0, lv: 0, gm: '' });
    e.n++; e.lv += clamp(r.lv | 0, 1, MAX_LVL); if (r.ogm) e.gm = cleanName(r.nm) || '';
    e.oh = (e.oh || 0) + (r.od && r.od.oid === o.id ? clamp(+r.od.g || 0, 0, 1e7) : 0);
    map.set(o.id, e);
  }
  return [...map.values()].sort((a, b) => b.lv - a.lv);
}
/* ---------- beim Herold ---------- */
function ordenView(view, body, opts){
  G.talk.orden = true; G.talk.view = view;
  const O = HERO.or;
  if (view === 'ordenNeu') return orForm(body, opts);
  if (view === 'ordenListe'){
    $('talkText').textContent = 'Die Ritter des Ordens „' + O.nm + '“. Wer gerade im Land ist, steht oben.';
    for (const m of orMembers()){
      const r = el('div', 'shoprow'), t = el('div', 'stx'), ic = el('img'); ic.src = orUrl(O.wp); ic.alt = '';
      const ago = m.on ? 'im Land' : m.at ? 'zuletzt vor ' + agoText(Date.now() - m.at) : '';
      const week = m.ow && m.ow.w === orWeek() ? ' · diese Woche ' + (+m.ow[orTask().id] || 0) + ' ' + orTask().unit : '';
      t.append(el('b', null, m.nm + (m.gm ? ' (Großmeister)' : '') + (m.me ? ' (Ihr)' : '')), el('small', null, 'Stufe ' + m.lv + ' · ' + titleOf(m.lv) + ' · ' + ago + week));
      r.append(ic, t); body.append(r);
    }
    if (!cloud.db) body.append(el('p', 'hint', 'Ohne Anmeldung seht Ihr nur die Ordensritter, die gerade im Land sind.'));
    opts.append(btn('Zurück', () => renderTalk('orden'), 'tbtn')); body.append(opts); return;
  }
  if (!O){
    $('talkText').textContent = 'In meiner Wappenrolle stehen die Ritterorden des Königslandes. Gründet einen eigenen für ' + OR_COST + ' Gulden, oder lasst Euch von einem Ordensritter aufnehmen: Sprecht ihn im Land an.';
    const b = btn('Einen Orden gründen (' + OR_COST + ' Gulden)', () => renderTalk('ordenNeu'), 'opt'); b.disabled = HERO.gold < OR_COST; opts.append(b);
    const known = orKnown();
    if (known.length){ body.append(el('p', 'hint', 'Bekannte Orden:')); for (const o of known.slice(0, 8)){ const r = el('div', 'shoprow'), ic = el('img'), t = el('div', 'stx'); ic.src = orUrl(o.wp); ic.alt = ''; t.append(el('b', null, o.nm + ' (' + o.kz + ')'), el('small', null, o.n + (o.n === 1 ? ' Ritter' : ' Ritter') + (o.gm ? ' · Großmeister ' + o.gm : ''))); r.append(ic, t); body.append(r); } }
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn')); body.append(opts); return;
  }
  const P = orProgress(), claimed = HERO.owClaim === orWeek();
  $('talkText').textContent = 'Ihr seid Ritter des Ordens „' + O.nm + '“ (' + O.kz + ')' + (O.gm ? ' und sein Großmeister.' : '.') + ' Diese Woche: ' + P.T.t + (P.n >= P.need ? ', geschafft!' : ', jeder Ritter des Ordens zählt mit.');
  const head = el('div', 'shoprow'), ic = el('img'), t = el('div', 'stx'); ic.src = orUrl(O.wp, 4); ic.alt = ''; ic.className = 'orbig';
  t.append(el('b', null, O.nm), el('small', null, P.members + ' Ritter · Wappen: ' + OR_CHARGE[O.wp[1]][0] + ' in ' + OR_TINCT[O.wp[2]][0] + ' auf ' + OR_TINCT[O.wp[0]][0]));
  head.append(ic, t); body.append(head);
  const bar = el('div', 'orbar'), fill = el('i'); fill.style.width = Math.min(100, P.n / P.need * 100) + '%';
  bar.append(fill, el('span', null, 'Wochenaufgabe: ' + Math.min(P.n, P.need) + ' von ' + P.need + ' ' + P.T.unit)); body.append(bar);
  if (P.n >= P.need){ const b = btn(claimed ? 'Ordenslohn dieser Woche erhalten' : 'Ordenslohn abholen', () => { orClaim(); renderTalk('orden'); }, 'opt' + (claimed ? '' : ' ready')); b.disabled = claimed; opts.append(b); }
  opts.append(btn('Ritter des Ordens', () => renderTalk('ordenListe'), 'opt'));
  opts.append(el('p', 'hint', 'Neue Ritter nehmt Ihr auf, indem Ihr sie im Land ansprecht. Im Gespräch schreibt Ihr mit „/o“ vorweg nur an Euren Orden.'));
  opts.append(btn('Aus dem Orden austreten', () => { if (G.orAsk){ G.orAsk = false; orLeave(); renderTalk('orden'); } else { G.orAsk = true; renderTalk('orden'); } }, 'opt'));
  if (G.orAsk) opts.append(el('p', 'hint', 'Noch einmal drücken, um wirklich auszutreten.'));
  opts.append(btn('Zurück', () => { G.orAsk = false; renderTalk('main'); }, 'tbtn'));
  body.append(opts);
}
const agoText = ms => { const m = Math.round(ms / 60000); return m < 60 ? Math.max(1, m) + ' Min.' : m < 2880 ? Math.round(m / 60) + ' Std.' : Math.round(m / 1440) + ' Tagen'; };
/* Gründung: Name, Kürzel und Wappen; die Vorschau wird ohne Neuzeichnen des Fensters getauscht */
function orForm(body, opts){
  const F = G.orForm = G.orForm || { nm: '', kz: '', wp: [2, 0, 0] };
  $('talkText').textContent = 'Wie soll Euer Orden heißen? Name, ein Kürzel aus zwei bis fünf Buchstaben und ein Wappen. Die Gründung kostet ' + OR_COST + ' Gulden.';
  const form = el('div', 'orform'), prev = el('img'); prev.className = 'orbig'; prev.alt = 'Wappen';
  const nm = el('input'); nm.maxLength = 28; nm.placeholder = 'Orden vom Goldenen Apfel'; nm.value = F.nm; nm.setAttribute('aria-label', 'Name des Ordens');
  const kz = el('input'); kz.maxLength = 5; kz.placeholder = 'Kürzel'; kz.value = F.kz; kz.setAttribute('aria-label', 'Kürzel des Ordens');
  const ok = btn('Orden gründen', () => {
    const o = orClean({ id: rid() + rid().slice(0, 3), nm: F.nm, kz: F.kz, wp: F.wp });
    if (!o || HERO.gold < OR_COST || orKnown().some(k => k.nm.toLowerCase() === o.nm.toLowerCase())) return;
    HERO.gold -= OR_COST; updateHud(); orJoin(o, true); G.orForm = null;
    showBanner(o.nm, 'gegründet von ' + HERO.name); logLine('Ihr gründet den Orden „' + o.nm + '“. Nehmt andere Ritter auf, indem Ihr sie im Land ansprecht.', '#ffd98a'); Sound.quest();
    renderTalk('orden');
  }, 'opt');
  const why = el('p', 'hint');
  const upd = () => {
    F.nm = nm.value; F.kz = kz.value.trim(); prev.src = orUrl(F.wp, 4);
    const dup = orKnown().some(k => k.nm.toLowerCase() === cleanText(F.nm, 28).toLowerCase());
    const bad = !cleanText(F.nm, 28) ? 'Der Orden braucht einen Namen.' : !OR_KZ_RE.test(F.kz) ? 'Das Kürzel hat zwei bis fünf Buchstaben.' : dup ? 'Diesen Namen trägt schon ein Orden.' : HERO.gold < OR_COST ? 'Ihr habt keine ' + OR_COST + ' Gulden.' : '';
    ok.disabled = !!bad; why.textContent = bad;
    for (const [i, b] of cyc.entries()) b.textContent = ['Feld: ', 'Bild: ', 'Farbe des Bildes: '][i] + (i === 1 ? OR_CHARGE[F.wp[1]][0] : OR_TINCT[F.wp[i]][0]);
  };
  nm.addEventListener('input', upd); kz.addEventListener('input', upd);
  const cyc = [0, 1, 2].map(i => { const b = btn('', () => { F.wp[i] = (F.wp[i] + 1) % (i === 1 ? OR_CHARGE.length : OR_TINCT.length); if (i !== 1 && F.wp[0] === F.wp[2]) F.wp[i] = (F.wp[i] + 1) % OR_TINCT.length; upd(); }, 'tbtn'); return b; });
  const fields = el('div', 'orfields'); fields.append(nm, kz, ...cyc);
  form.append(prev, fields); body.append(form);
  opts.append(ok, why, btn('Zurück', () => renderTalk('orden'), 'tbtn'));
  body.append(opts); upd();
}

/* ============ Großes Turnier: K.-o.-System an der Schranke ============
   Wer das Turnier ausruft, ist Marschall: In seiner Anwesenheit (gt) stehen die Gemeldeten, der Turnierbaum und der
   laufende Tjost. Die beiden Ritter eines Tjosts sehen das und reiten gegeneinander; der Marschall liest das Ergebnis
   aus ihrer Anwesenheit und setzt den Sieger eine Runde weiter. Startgeld zahlt jeder selbst, den Preis nimmt sich
   der Sieger aus dem Topf. */
const TN_FEE = 20, TN_MAX = 8;
const TN_ROUND = n => n === 1 ? 'Finale' : n === 2 ? 'Halbfinale' : n === 4 ? 'Viertelfinale' : 'Achtelfinale';
/* Turnierbaum: Runde für Runde, je Tjost [a, b, w] mit Platznummern (-1 Freilos, null noch offen) */
function tnBracket(n){
  const size = n <= 2 ? 2 : n <= 4 ? 4 : 8, real = Array.from({ length: n }, (_, i) => i), byes = size - n, R1 = [];
  for (let i = n - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [real[i], real[j]] = [real[j], real[i]]; }
  let k = 0;
  for (let m = 0; m < size / 2; m++) R1.push(m < byes ? [real[k++], -1, null] : [real[k++], real[k++], null]);   // Freilose gegen Ritter, nie gegeneinander
  const rounds = [R1];
  for (let m = size / 4; m >= 1; m /= 2) rounds.push(Array.from({ length: m }, () => [null, null, null]));
  return rounds;
}
/* der Marschall: eigene Anmeldung annehmen, Tjoste ansetzen, Ergebnisse eintragen */
function tnHost(name){
  if (NET.gt || NET.tj) return;
  if (HERO.gold < TN_FEE){ logLine('Das Startgeld beträgt ' + TN_FEE + ' Gulden.', '#d8c69c'); return; }
  HERO.gold -= TN_FEE; updateHud();
  NET.gt = { id: rid(), st: 'an', pl: [NET.me], nm: [HERO.name], br: null, cur: null, t: nowS() };
  NET.tj = { id: NET.gt.id, host: NET.me, paid: true };
  showBanner('Großes Turnier', 'Ihr ruft aus, bis zu ' + TN_MAX + ' Ritter'); Sound.horn(); Sound.cheer(.8);
  logLine('Ihr ruft ein Großes Turnier aus. Andere Ritter melden sich beim Herold an, dann beginnt Ihr es dort.', '#ffd98a');
  sendPresence(true);
}
function tnPres(){ const T = NET.gt; return { id: T.id, st: T.st, pl: T.pl, nm: T.nm, br: T.br, cur: T.cur ? { i: T.cur.i, r: T.cur.r, a: T.cur.a, b: T.cur.b, id: T.cur.id } : null, ch: T.ch ?? null }; }
/* das Turnier, das ich sehe: meines oder das eines Marschalls in der Nähe */
function tnView(){
  if (NET.gt) return { T: NET.gt, host: NET.me, hostNm: HERO.name };
  const host = NET.tj ? PEERS.get(NET.tj.host) : null;
  if (host && host.gt && host.gt.id === NET.tj.id) return { T: host.gt, host: host.peer, hostNm: host.nm };
  for (const q of PEERS.values()) if (q.gt && typeof q.gt.id === 'string' && Array.isArray(q.gt.pl) && samePlace(q) && nearLists(q.x, q.y)) return { T: q.gt, host: q.peer, hostNm: q.nm };
  return null;
}
function tnStart(){
  const T = NET.gt; if (!T || T.st !== 'an' || T.pl.length < 2) return;
  T.br = tnBracket(T.pl.length); T.st = 'lauf'; T.cur = null;
  showBanner('Großes Turnier', T.pl.length + ' Ritter, der Herold ruft den ersten Tjost'); Sound.horn();
  sendPresence(true);
}
function tnCancel(){
  const T = NET.gt; if (!T) return;
  T.st = 'aus'; logLine('Ihr sagt das Große Turnier ab. Jeder bekommt sein Startgeld zurück.', '#d8c69c');
  tnRefund(); sendPresence(true);
  setTimeout(() => { if (NET.gt === T){ NET.gt = null; sendPresence(true); } }, 8000);
}
function tnRefund(){ if (NET.tj && NET.tj.paid){ HERO.gold += TN_FEE; updateHud(); markDirty(true); } NET.tj = null; }
/* Ergebnis eines Tjosts aus Sicht des Ritters x: 1 Sieg, 0 Niederlage, .5 Gleichstand, null noch offen */
function tnResult(x, id){
  if (x === NET.me) return NET.lastDuel && NET.lastDuel.id === id ? NET.lastDuel.res : null;
  const q = PEERS.get(x), jo = q && q.jo;
  return jo && jo.id === id && jo.end && typeof jo.res === 'number' ? jo.res : null;
}
function tnTick(t){
  const T = NET.gt;
  if (T){
    // Anmeldung: Gemeldete, die fort sind, streichen
    if (T.st === 'an'){ const keep = T.pl.map((p, i) => p === NET.me || PEERS.get(p) ? i : -1).filter(i => i >= 0); if (keep.length !== T.pl.length){ T.pl = keep.map(i => T.pl[i]); T.nm = keep.map(i => T.nm[i]); } }
    if (T.st === 'lauf') tnHostRun(T, t);
  }
  // als Gemeldeter: dran sein, Absage, Ende
  const V = tnView();
  if (NET.tj && !NET.gt){
    const host = PEERS.get(NET.tj.host), gt = host && host.gt;
    if (!gt || gt.id !== NET.tj.id){ NET.tj.lost = NET.tj.lost || t; if (t - NET.tj.lost > 8){ logLine('Der Marschall ist fort. Das Große Turnier fällt aus, Ihr bekommt Euer Startgeld zurück.', '#d8c69c'); tnRefund(); } }
    else {
      NET.tj.lost = 0;
      if (gt.st === 'aus'){ logLine('Das Große Turnier ist abgesagt. Ihr bekommt Euer Startgeld zurück.', '#d8c69c'); tnRefund(); }
      else if (gt.st === 'ende') tnFinish(gt);
      else if (Array.isArray(gt.pl) && !gt.pl.includes(NET.me) && gt.st === 'lauf'){ NET.tj = null; }
    }
  }
  if (NET.gt && NET.gt.st === 'ende' && NET.tj) tnFinish(NET.gt);
  if (V && V.T.cur && V.T.st === 'lauf') tnMyTurn(V.T);
  const key = V ? V.T.id + V.T.st + JSON.stringify(V.T.cur) + JSON.stringify(V.T.br) + (V.T.pl || []).length : '';
  if (key !== (G.tnKey || '')){ G.tnKey = key; renderTracker(); if (G.talk && G.talk.view === 'turnier') renderTalk('turnier'); }
}
/* bin ich dran? dann gegen den anderen reiten */
function tnMyTurn(T){
  const c = T.cur, me = NET.me; if (!c || (c.a !== me && c.b !== me)) return;
  if (G.joust || (NET.jo && NET.jo.id === c.id) || (NET.lastDuel && NET.lastDuel.id === c.id)) return;
  const other = c.a === me ? c.b : c.a, q = PEERS.get(other);
  if (!q || G.mode === 'dead' || G.mode === 'dying') return;
  if (G.mode === 'menu') closePanel();
  if (G.mode !== 'play' || G.fgame || DG_ON || G.inside || !nearLists(G.knight.x, G.knight.y)) return;
  showBanner('Ihr seid dran', TN_ROUND(T.br[c.r].length) + ' gegen ' + q.nm);
  startDuel(q, c.id, c.a === me);
}
function tnHostRun(T, t){
  const R = T.br;
  if (!T.cur){
    // Freilose durchwinken, nächsten Tjost suchen
    for (let r = 0; r < R.length; r++) for (let i = 0; i < R[r].length; i++){
      const m = R[r][i]; if (m[2] != null) continue;
      if (m[0] != null && m[1] === -1){ tnAdvance(T, r, i, m[0]); return; }
      if (m[1] != null && m[0] === -1){ tnAdvance(T, r, i, m[1]); return; }
      if (m[0] != null && m[1] != null && m[0] >= 0 && m[1] >= 0){
        T.cur = { r, i, a: T.pl[m[0]], b: T.pl[m[1]], id: T.id + ':' + r + i, t };
        logLine('Der Herold ruft: ' + TN_ROUND(R[r].length) + ', ' + T.nm[m[0]] + ' gegen ' + T.nm[m[1]] + '!', '#ffd98a'); Sound.horn();
        sendPresence(true); return;
      }
    }
    return;
  }
  const c = T.cur, m = R[c.r][c.i], ra = tnResult(c.a, c.id), rb = tnResult(c.b, c.id);
  let w = null;
  if (ra != null || rb != null){
    const res = ra != null ? ra : 1 - rb;
    w = res === .5 ? ((hashStr(c.id) & 1) ? m[0] : m[1]) : res > .5 ? m[0] : m[1];
    if (res === .5) logLine('Gleichstand! Das Los entscheidet für ' + T.nm[w] + '.', '#ffd98a');
  } else {
    // nicht angetreten: wer fehlt, verliert
    const okA = c.a === NET.me || PEERS.get(c.a), okB = c.b === NET.me || PEERS.get(c.b);
    if (!okA || !okB || t - c.t > 120){ w = okA && !okB ? m[0] : okB && !okA ? m[1] : m[0]; logLine(T.nm[w === m[0] ? m[1] : m[0]] + ' ist nicht angetreten.', '#d8c69c'); }
  }
  if (w != null){ T.cur = null; tnAdvance(T, c.r, c.i, w); }
}
function tnAdvance(T, r, i, w){
  const R = T.br; R[r][i][2] = w;
  if (r + 1 < R.length) R[r + 1][i >> 1][i & 1] = w;
  else { T.st = 'ende'; T.ch = w; logLine(T.nm[w] + ' gewinnt das Große Turnier!', '#ffd98a'); Sound.cheer(1); setTimeout(() => { if (NET.gt === T){ NET.gt = null; sendPresence(true); } }, 30000); }
  sendPresence(true);
}
/* Ende: Sieger und Zweiter nehmen sich ihren Anteil am Topf */
function tnFinish(gt){
  if (!NET.tj) return;
  const me = Array.isArray(gt.pl) ? gt.pl.indexOf(NET.me) : -1, n = Array.isArray(gt.pl) ? gt.pl.length : 0, pot = TN_FEE * n;
  NET.tj = null;
  if (me < 0 || !Array.isArray(gt.br)) return;
  const fin = gt.br[gt.br.length - 1][0], second = fin && fin[0] === gt.ch ? fin[1] : fin ? fin[0] : -1;
  if (gt.ch === me){
    const gold = Math.round(pot * .6) + 40, xp = Math.round(xpNeed(HERO.lvl) * .2) + 20;
    HERO.gold += gold; HERO.tw = (HERO.tw || 0) + 1; lwAdd(20);
    const first = HERO.tw === 1, it = first ? makeItem('helm', HERO.lvl + 1, 3, { name: 'Goldener Turnierhelm', aff: ['hp', 'arm', 'crit'] }) : makeItem(pick(SLOTS), HERO.lvl + 1, 2);
    const j = HERO.inv.indexOf(null); if (j >= 0) HERO.inv[j] = it; else dropLoot(G.knight, 'item', 0, it);
    showBanner('Sieger des Großen Turniers', gold + ' Gulden und ' + it.n);
    logLine('Ihr gewinnt das Große Turnier vor ' + n + ' Rittern: ' + gold + ' Gulden aus Topf und Ehrensold, ' + xp + ' EP und ' + it.n + '.', '#ffd98a');
    gainXp(xp); Sound.levelUp(); Sound.cheer(1);
  } else if (second === me){
    const gold = Math.round(pot * .25) + 10; HERO.gold += gold;
    logLine('Ihr werdet Zweiter im Großen Turnier: ' + gold + ' Gulden.', '#ffd98a'); Sound.coin();
  } else logLine((gt.nm && gt.nm[gt.ch]) ? cleanName(gt.nm[gt.ch]) + ' gewinnt das Große Turnier.' : 'Das Große Turnier ist vorbei.', '#d8c69c');
  updateHud(); pushFame(); markDirty(true);
}
/* beim Herold */
function turnierView(body, opts){
  G.talk.view = 'turnier';
  const V = tnView(), T = V && V.T, mine = !!NET.gt;
  const names = T && Array.isArray(T.nm) ? T.nm.map(x => cleanName(x) || 'Ritter') : [];
  if (!T || T.st === 'aus' || T.st === 'ende' && !mine){
    $('talkText').textContent = 'Beim Großen Turnier reiten bis zu ' + TN_MAX + ' Ritter im K.-o.-System, ein Tjost nach dem anderen. Startgeld ' + TN_FEE + ' Gulden; der Sieger bekommt drei Fünftel des Topfs und Ehrensold, der Zweite ein Viertel. ' + (T && T.st === 'ende' ? names[T.ch] + ' hat zuletzt gewonnen.' : '');
    const b = btn('Ein Großes Turnier ausrufen (' + TN_FEE + ' Gulden)', () => { tnHost(); renderTalk('turnier'); }, 'opt'); b.disabled = HERO.gold < TN_FEE || !!NET.tj || !cloud.room; opts.append(b);
    if (!cloud.room) opts.append(el('p', 'hint', 'Ein Großes Turnier braucht andere Ritter im Land.'));
  } else if (T.st === 'an'){
    const joined = NET.tj && NET.tj.id === T.id;
    $('talkText').textContent = (mine ? 'Ihr ruft das Große Turnier aus. ' : V.hostNm + ' ruft ein Großes Turnier aus. ') + 'Gemeldet sind ' + names.length + ' von ' + TN_MAX + ' Rittern: ' + names.join(', ') + '.';
    if (mine){ const b = btn('Das Turnier beginnen', () => { tnStart(); renderTalk('turnier'); }, 'opt new'); b.disabled = T.pl.length < 2; opts.append(b, btn('Absagen', () => { tnCancel(); renderTalk('turnier'); }, 'opt')); if (T.pl.length < 2) opts.append(el('p', 'hint', 'Es braucht mindestens zwei Ritter.')); }
    else if (!joined){ const host = PEERS.get(V.host), b = btn('Anmelden (' + TN_FEE + ' Gulden)', () => { if (host){ NET.tnWant = T.id; netAsk(host, 'tourn', T.id); } renderTalk('turnier'); }, 'opt'); b.disabled = HERO.gold < TN_FEE || names.length >= TN_MAX || !!NET.q; opts.append(b); }
    else opts.append(el('p', 'hint', 'Ihr seid gemeldet. Bleibt auf der Turnierwiese, bis der Marschall beginnt.'));
  } else {
    $('talkText').textContent = T.st === 'ende' ? names[T.ch] + ' hat das Große Turnier gewonnen!' : T.cur ? 'Es reiten ' + names[T.pl.indexOf(T.cur.a)] + ' und ' + names[T.pl.indexOf(T.cur.b)] + '.' : 'Der Herold ruft den nächsten Tjost.';
    (T.br || []).forEach((round) => {
      const box = el('div', 'tnround'); box.append(el('b', null, TN_ROUND(round.length)));
      for (const m of round){
        const nm = x => x == null ? '…' : x < 0 ? 'Freilos' : names[x];
        const p = el('p', m[2] != null ? 'done' : ''); p.textContent = nm(m[0]) + ' – ' + nm(m[1]) + (m[2] != null && m[2] >= 0 ? '  →  ' + names[m[2]] : '');
        box.append(p);
      }
      body.append(box);
    });
  }
  opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
  body.append(opts);
}
/* Zeile oben links */
function tnRows(box){
  const V = tnView(); if (!V) return;
  const T = V.T, names = Array.isArray(T.nm) ? T.nm.map(x => cleanName(x) || 'Ritter') : [];
  if (T.st === 'aus') return;
  const p = el('p', 'ev'); p.append(el('b', null, 'Großes Turnier: '));
  if (T.st === 'an') p.append(names.length + ' gemeldet, Marschall ' + V.hostNm);
  else if (T.st === 'ende') p.append(names[T.ch] + ' siegt!');
  else if (T.cur && Array.isArray(T.br) && T.br[T.cur.r]) p.append(TN_ROUND(T.br[T.cur.r].length) + ', ' + names[T.pl.indexOf(T.cur.a)] + ' gegen ' + names[T.pl.indexOf(T.cur.b)]);
  else p.append('gleich der nächste Tjost');
  box.append(p);
}

/* ============ Start ============ */
function seedTitle(){
  for (const [dx, dy, kind] of [[-300, 60, 'wieder'], [320, 30, 'pluend'], [-120, -150, 'rabe'], [180, 160, 'wieder'], [-380, -60, 'pluend']]){
    const p = gRandWalk(GSTART.x + dx, GSTART.y + dy, 0, 60);
    if (p) createMonster(kind, p.x, p.y, 1, null);
  }
}
const stageEl = $('stage');
function fitCanvas(){
  const dpr = window.devicePixelRatio || 1;
  if (matchMedia('(hover:none) and (pointer:coarse) and (orientation:landscape)').matches) cv.style.width = '';
  else {
    const avail = stageEl.clientWidth, n = Math.floor(avail * dpr / W), snapped = n * W / dpr;
    cv.style.width = n >= 1 && snapped >= avail * .88 ? snapped + 'px' : '';
  }
  // verkleinert weich zeichnen (sonst fallen Pixelzeilen aus), sonst pixelscharf
  cv.style.imageRendering = cv.getBoundingClientRect().width * dpr < W * .97 ? 'auto' : '';
}
try { new ResizeObserver(fitCanvas).observe(stageEl); } catch(e){ addEventListener('resize', fitCanvas); }
fitCanvas();
