"use strict";
/* Der Apfelritter, Teil 11 von 29: Aufträge, der Held, Erscheinungsorte, Gasthäuser.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Aufträge ============ */
/* kind + zone: so viele dieser Monster in diesem Gebiet; boss: den Anführer erschlagen */
const QUESTS = [
  { id:'v1', giver:'vogt', lvl:1, kind:'wieder', zone:'obstgarten', need:6, t:'Die Toten im Obstgarten',
    d:'Seit dem Pestjahr steigen im Obstgarten die Toten aus der Erde. Erschlagt sechs Wiedergänger, ehe sie die Mägde erschrecken.' },
  { id:'v2', giver:'vogt', lvl:2, kind:'pluend', zone:'obstgarten', need:6, t:'Plünderer am Burgweg', after:'v1',
    d:'Gesindel lauert unter den Apfelbäumen und raubt die Fuhrleute aus. Vertreibt sechs Plünderer aus den Obstgärten.' },
  { id:'v3', giver:'vogt', lvl:3, kind:'ratte', zone:'fluss', need:8, t:'Ratten an der Mühle', after:'v1',
    d:'Der Müller klagt, die Pestratten fressen ihm das Korn aus den Säcken. Erschlagt acht in der Flussaue.' },
  { id:'v4', giver:'vogt', lvl:5, kind:'pluend', zone:'dorf', need:8, t:'Das verbrannte Dorf', after:'v2',
    d:'Im verbrannten Dorf haben sich Plünderer eingenistet. Acht von ihnen sollen ihre Strafe bekommen.' },
  { id:'v5', giver:'vogt', lvl:6, kind:'armbrust', zone:'lager', need:6, t:'Landsknechte ohne Sold', after:'v4',
    d:'Im Lager der Landsknechte gibt es keinen Sold mehr, nur noch Raub. Bringt sechs Armbrustschützen zur Strecke.' },
  { id:'v6', giver:'vogt', lvl:8, kind:'rabe', zone:'galgen', need:8, t:'Raben über dem Galgen', after:'v5',
    d:'Die Raben vom Galgenberg greifen inzwischen Lebende an. Holt acht vom Himmel.' },
  { id:'v7', giver:'vogt', lvl:9, kind:'werwolf', zone:'wald', need:8, t:'Wölfe im Finsterwald', after:'v6',
    d:'Die Köhler im Finsterwald trauen sich nicht mehr hinaus. Erschlagt acht Werwölfe.' },
  { id:'v8', giver:'vogt', lvl:11, kind:'armbrust', zone:'wald', need:8, t:'Schützen im Tann', after:'v7',
    d:'Wilderer mit Armbrüsten schießen im Wald auf alles, was sich regt. Acht von ihnen, dann ist Ruhe.' },
  { id:'v9', giver:'vogt', lvl:17, boss:'raubritter', zone:'ruine', need:1, t:'Kunz der Schwarze', after:'v8',
    d:'Kunz der Schwarze hält die Raubritterburg und lacht über des Königs Landfrieden. Reitet hin und macht dem ein Ende.' },
  { id:'b1', giver:'buerger', lvl:3, kind:'ratte', zone:'dorf', need:8, t:'Pest vor den Toren',
    d:'Aus dem verbrannten Dorf schleppen die Ratten die Pest bis an unsere Mauern. Erschlagt acht von ihnen.' },
  { id:'b2', giver:'buerger', lvl:5, kind:'wieder', zone:'friedhof', need:8, t:'Unruhige Gräber', after:'b1',
    d:'Die Mönche vom Kloster sagen, die Toten auf dem Friedhof wandeln. Legt acht Wiedergänger zur Ruhe.' },
  { id:'b3', giver:'buerger', lvl:7, kind:'rabe', zone:'friedhof', need:6, t:'Raben am Kloster', after:'b2',
    d:'Schwarze Raben hacken den Pilgern die Augen aus. Sechs Stück, dann können die Pilger wieder beten.' },
  { id:'b4', giver:'buerger', lvl:10, kind:'wieder', zone:'schlachtfeld', need:10, t:'Das alte Schlachtfeld', after:'b3',
    d:'Auf dem alten Schlachtfeld stehen die Gefallenen wieder auf. Zehn müssen zurück in die Erde.' },
  { id:'b5', giver:'buerger', lvl:11, kind:'pluend', zone:'schlachtfeld', need:8, t:'Die Leichenfledderer', after:'b4',
    d:'Plünderer fleddern die Toten auf dem Schlachtfeld. Acht von ihnen sollen das büßen.' },
  { id:'b6', giver:'buerger', lvl:13, boss:'tod', zone:'schlachtfeld', need:1, t:'Der Tod geht um', after:'b5',
    d:'Auf dem Schlachtfeld wurde der Tod selbst gesehen, mit Sense und Leichentuch. Stellt Euch ihm, wenn Ihr den Mut habt.' },
  { id:'b7', giver:'buerger', lvl:12, kind:'moor', zone:'moor', need:8, t:'Moorleichen', after:'b4',
    d:'Torfstecher verschwinden im Moor, und manche kommen als Leichen zurück. Acht Moorleichen.' },
  { id:'b8', giver:'buerger', lvl:13, kind:'irrlicht', zone:'moor', need:8, t:'Irrlichter', after:'b7',
    d:'Irrlichter locken die Leute in den Sumpf und stehlen, was glänzt. Löscht acht von ihnen aus.' },
  { id:'b9', giver:'buerger', lvl:15, boss:'lindwurm', zone:'moor', need:1, t:'Der Lindwurm', after:'b8',
    d:'Im Sumpf haust der Lindwurm und speit Feuer. Die Stadt zahlt gut für seinen Kopf.' },
  { id:'b10', giver:'buerger', lvl:14, kind:'pluend', zone:'ruine', need:10, t:'Die Bande des Raubritters', after:'b5',
    d:'Die Kaufleute der Stadt wagen sich nicht mehr auf die Straße. Zehn Mann aus Kunz’ Bande, dann kommen die Wagen wieder durch.' },
  { id:'b11', giver:'buerger', lvl:15, kind:'armbrust', zone:'ruine', need:8, t:'Schützen auf den Zinnen', after:'b10',
    d:'Von den Zinnen der Raubritterburg schießen sie auf jeden. Acht Schützen müssen fallen.' }
];
const QDEF = Object.fromEntries(QUESTS.map(q => [q.id, q]));
const NPC_TEXT = {
  vogt: ['Gott zum Gruße, Ritter. Das Land braucht starke Arme.', 'Ihr seid zurück. Gibt es Neues aus dem Königsland?', 'Der König ist fern, aber wir sind hier.'],
  buerger: ['Willkommen in der Königsstadt. Wir sind nur dem König untertan.', 'Die Stadt dankt Euch für jeden Dienst.', 'Handel braucht sichere Wege, Ritter.'],
  kraemerin: ['Heiltränke, frisch gebraut! Und ich kaufe, was Ihr da draußen findet.', 'Was darf es sein?'],
  kraemer: ['Gute Ware zu ehrlichen Preisen. Meistens jedenfalls.', 'Zeigt her, was Ihr erbeutet habt.']
};
/* Kopfgeld: jederzeit wiederholbar, im Gebiet zur eigenen Stufe */
function bountyZone(lvl){
  let best = 'obstgarten', bd = 1e9;
  for (const [z, [lo, hi]] of Object.entries(ZONE_LV)){ const d = Math.abs((lo + hi) / 2 - (lvl + .5)); if (d < bd){ bd = d; best = z; } }
  return best;
}
const ZONE_BY_ID = Object.fromEntries(ZONES.map(z => [z.id, z]));
function qInfo(q){
  if (q.id === 'kg') return { id:'kg', t:'Kopfgeld: ' + ZONE_BY_ID[q.zone].name, need:q.need, zone:q.zone, lvl:q.lvl, giver:q.giver,
    d:'Der Rat zahlt für jedes erschlagene Untier. Erschlagt ' + q.need + ' Monster im Gebiet ' + ZONE_BY_ID[q.zone].name + '.' };
  return QDEF[q.id];
}
const qReward = d => ({ xp: Math.round(xpNeed(d.lvl) * (d.boss ? .8 : d.id === 'kg' ? .3 : .4)), gold: Math.round(((d.boss ? 40 : 6) + d.lvl * (d.boss ? 10 : 5)) * rufLohn(d.giver)), rar: d.boss ? 3 : d.id === 'kg' ? 0 : 1 });

/* ============ Der Held (wird gespeichert) ============ */
const SAVE_KEY = 'apfelritter-held-v5';
function freshHero(name, f){
  return { v:6, name, f: KN_FACTIONS[f] ? f : 'reich', food:null, drink:null, horse:null, riding:false, lvl:1, xp:0, gold:10, potions:3, inv: Array(24).fill(null),
    eq: { waffe: makeItem('waffe', 1, 0, { name:'Rostiges Kurzschwert' }), helm:null, ruestung: makeItem('ruestung', 1, 0, { name:'Wattierter Gambeson' }),
      schild: makeItem('schild', 1, 0, { name:'Holzschild' }), beine:null, kleinod:null },
    quests:[], done:[], kills:0, bosses:{}, bind:'burg', x: BIND.burg.x, y: BIND.burg.y, played:0, savedAt:0, made: Date.now() };
}
function validHero(h){
  return h && (h.v === 5 || h.v === 6) && typeof h.name === 'string' && h.lvl >= 1 && Array.isArray(h.inv) && h.eq && typeof h.eq === 'object';
}
function cleanHero(h){
  h.lvl = clamp(h.lvl | 0, 1, MAX_LVL); h.xp = Math.max(0, h.xp | 0); h.gold = Math.max(0, h.gold | 0); h.potions = clamp(h.potions | 0, 0, 20);
  h.inv = Array.from({ length: 24 }, (_, i) => h.inv[i] && h.inv[i].s && (h.inv[i].s !== 'ware' || WARES[h.inv[i].w]) ? h.inv[i] : null);
  for (const it of h.inv) if (it && it.s === 'ware') it.q = clamp(it.q | 0, 1, WARE_MAX);
  for (const s of SLOTS) if (!h.eq[s] || !h.eq[s].s) h.eq[s] = null;
  h.quests = (h.quests || []).filter(q => q && (q.id === 'kg' ? ZONE_LV[q.zone] : QDEF[q.id])).slice(0, 4);
  h.done = h.done || []; h.bosses = h.bosses || {}; h.kills = h.kills | 0; h.hunted = h.hunted | 0;
  if (!BIND[h.bind]) h.bind = 'burg';
  if (h.v === 5){ h.x *= WS; h.y *= WS; h.v = 6; }   // Spielstand aus der Zeit vor den Feinpixeln
  if (!gOk(h.x, h.y)){ h.x = BIND[h.bind].x; h.y = BIND[h.bind].y; }
  if (!KN_FACTIONS[h.f]) h.f = 'reich';
  for (const key of ['food', 'drink']){ const b = h[key]; h[key] = b && FARE_BY[b.id] && b.t > 0 ? { id: b.id, t: Math.min(+b.t || 0, FARE_MIN * 60) } : null; }
  if (h.inn && !INN_BY[h.inn]) h.inn = null;
  if (!HORSES[h.horse]) h.horse = null;
  if (h.festDone){ const ks = Object.keys(h.festDone).slice(-12), o = {}; for (const kk of ks) o[kk] = true; h.festDone = o; }
  h.mood = h.mood && h.mood.t > 0 ? { t: Math.min(600, +h.mood.t || 0) } : null;
  h.bless = h.bless && h.bless.t > 0 ? { t: Math.min(h.glaube === 'alt' ? 1800 : 1200, +h.bless.t || 0) } : null;   // beim alten Glauben 30 Minuten (Teil 26)
  h.ablass = !!h.ablass; h.thesen = h.thesen ? 1 : 0;
  h.gunst = h.gunst && h.gunst.t > 0 ? { t: Math.min(1800, +h.gunst.t || 0) } : null; h.gunstD = h.gunstD | 0;   // Burgen der Häuser (Teil 27)
  h.hbt = h.hbt && typeof h.hbt === 'object' ? { d: h.hbt.d | 0, n: clamp(h.hbt.n | 0, 0, 3) } : null;
  h.hbv = h.hbv && typeof h.hbv === 'object' ? Object.fromEntries(Object.keys(KN_FACTIONS).filter(f => h.hbv[f]).map(f => [f, 1])) : {};
  h.hbs = h.hbs && typeof h.hbs === 'object' ? { n: Math.max(0, h.hbs.n | 0), own: Math.max(0, h.hbs.own | 0) } : null;   // Belagerungen zurückgeschlagen (Teil 27)
  h.zk = h.zk && typeof h.zk === 'object' ? { e: clamp((h.zk.e | 0) || 1000, 100, 3000), w: Math.max(0, h.zk.w | 0), l: Math.max(0, h.zk.l | 0), d: Math.max(0, h.zk.d | 0) } : null;   // Zweikampf (Teil 28)
  h.zkd = h.zkd && typeof h.zkd === 'object' ? { d: h.zkd.d | 0, n: clamp(h.zkd.n | 0, 0, 99) } : null;
  h.frd = Array.isArray(h.frd) ? h.frd.filter(f => f && typeof f === 'object' && cleanName(f.nm)).slice(-30).map(f => ({ id: typeof f.id === 'string' ? f.id.slice(0, 200) : '', nm: cleanName(f.nm), f: KN_FACTIONS[f.f] ? f.f : 'reich', lv: clamp(f.lv | 0, 1, MAX_LVL), at: Math.max(0, +f.at || 0) })) : [];   // Freunde
  h.kz = h.kz && typeof h.kz === 'object' ? { pavia: Math.max(0, h.kz.pavia | 0), wien: Math.max(0, h.kz.wien | 0) } : {};
  h.fsw = h.fsw && typeof h.fsw === 'object' ? Object.fromEntries(['muehle', 'karten', 'kegeln', 'ringen'].map(k => [k, Math.max(0, h.fsw[k] | 0)])) : {};
  h.tal = h.tal && typeof h.tal === 'object' ? Object.fromEntries(Object.entries(h.tal).filter(([l, id]) => MEISTER_BY[id] && MEISTER_BY[id].lvl === +l && h.lvl >= +l)) : {};
  h.pilg = h.pilg && typeof h.pilg === 'object' ? { on: h.pilg.on ? 1 : 0, done: h.pilg.done ? 1 : 0, v: Object.fromEntries(Object.keys(h.pilg.v || {}).filter(k => /^[a-z]{3,20}$/.test(k)).map(k => [k, 1])) } : null;
  h.riding = !!(h.horse && h.riding);
  if (h.joust){ const j = h.joust, b = {}; for (const id of ['konrad', 'bayard', 'goetz']) if (j.beat && j.beat[id]) b[id] = true; h.joust = { wins: Math.max(0, j.wins | 0), beat: b, elo: clamp(j.elo | 0 || 1000, 100, 3000), pw: Math.max(0, j.pw | 0), pl: Math.max(0, j.pl | 0) }; }
  if (h.or){ const o = orClean(h.or); h.or = o ? Object.assign(o, { gm: h.or.gm ? 1 : 0, t: +h.or.t || 0 }) : null; }
  if (h.ow && (typeof h.ow !== 'object' || h.ow.w !== orWeek())) h.ow = null;
  h.tw = Math.max(0, h.tw | 0);
  h.pt = h.pt && typeof h.pt.id === 'string' && /^[a-z0-9]{3,12}$/.test(h.pt.id) && Date.now() - (+h.pt.at || 0) < 1800000 ? { id: h.pt.id, t: +h.pt.t || Date.now(), at: +h.pt.at } : null;   // Gruppe: eine halbe Stunde lang
  if (h.frec){ const o = {}; for (const r of FREC.map(q => q.id)) if (+h.frec[r] > 0) o[r] = Math.round(+h.frec[r]); h.frec = o; }
  for (const key of ['evDone', 'evFirst', 'evCur']) if (h[key] && typeof h[key] !== 'object') h[key] = null;
  if (h.story) h.story = stCleanStory(h.story);
  asHero(h); strHero(h); ehHero(h); rrHero(h);
  return h;
}
let HERO = null;

/* abgeleitete Werte aus Stufe und Ausrüstung */
function heroStats(h){
  const L = h.lvl, s = { hp: 30 + 10 * L, dmg: 4 + 1.5 * L, arm: 0, crit: 5, spd: 0, block: 0, xp: 0, gold: 0, holy: 0, leech: 0 };
  const wtH = WT[wtOf(h.eq.waffe)], two = wtH.hand === 2, wd = h.eq.waffe && h.eq.waffe.dmg || 0;
  for (const slot of SLOTS){
    const it = h.eq[slot]; if (!it || (two && slot === 'schild')) continue;
    if (it.dmg) s.dmg += it.dmg;
    if (it.arm) s.arm += it.arm;
    for (const [k, v] of Object.entries(it.a || {})){ if (k === 'str') s.dmg += v; else s[k] += v; }
  }
  if (h.eq.schild && !two && !isBib(h.eq.schild)) s.block += 20;
  if (wtH.dmg !== 1) s.dmg = (s.dmg - wd) * wtH.dmg + wd;   // die ganze Wucht des Hiebs; die Waffe selbst trägt die Art schon in sich
  // Haus und Stärkung durch Speis und Trank
  s.regen = 1;
  const fx = [(KN_FACTIONS[h.f] || KN_FACTIONS.reich).bonus].concat([h.food, h.drink].map(b => b && b.t > 0 && FARE_BY[b.id] ? FARE_BY[b.id].fx : null));
  for (const e of fx){ if (!e) continue; if (e.hpPct) s.hp *= 1 + e.hpPct / 100; if (e.dmgPct) s.dmg *= 1 + e.dmgPct / 100; if (e.crit) s.crit += e.crit; if (e.spd) s.spd += e.spd; if (e.regen) s.regen = Math.max(s.regen, e.regen); }
  if (!two && isBib(h.eq.schild)) s.regen *= h.glaube === 'neu' ? 1.8 : 1.5;   // die Bibel: schneller wieder bei Kräften, mit dem Bekenntnis noch mehr
  if (h.bless && h.bless.t > 0){ s.hp *= 1.08; s.regen = Math.max(s.regen, 1.5); }   // Segen aus der Kirche
  for (const id in SETS){ const n = SLOTS.filter(sl => h.eq[sl] && h.eq[sl].set === id && !(two && sl === 'schild')).length;   // Rüstungssätze
    for (const [need, k, v] of SETS[id].bon) if (n >= need){ if (k === 'hp' || k === 'dmg' || k === 'arm') s[k] *= 1 + v / 100; else s[k] += v; } }
  if (h.tal){ const T = Object.values(h.tal);   // Meisterschaften
    if (T.includes('haut')) s.hp *= 1.08; if (T.includes('klinge')) s.dmg *= 1.06; if (T.includes('falke')) s.crit += 4; if (T.includes('flink')) s.spd += 8;
    if (T.includes('wall') && h.eq.schild && !two && !isBib(h.eq.schild)){ s.block += 6; s.arm *= 1.1; }
    if (T.includes('zaeh')) s.regen = Math.max(s.regen, 2);
    if (T.includes('unbeugsam')){ s.hp *= 1.06; s.arm *= 1.12; } if (T.includes('meister')){ s.dmg *= 1.08; s.crit += 3; }
    s.arm = Math.round(s.arm); }
  if (ASV && ASV.ord >= 4) s.dmg *= 1.03;   // Ordenshaus: Waffenkammer, Ordenshof
  if (ASV && ASV.ord >= 5) s.hp *= 1.05;
  ehStats(h, s);   // Ehrenstufen: je ein halbes Hundertstel Leben und Schaden
  s.hp = Math.round(s.hp); s.arm = Math.round(s.arm);
  s.dmg = Math.round(s.dmg); s.block = Math.min(60, s.block); s.crit = Math.min(50, s.crit);
  s.cd = .6 / (1 + s.spd / 100) * wtH.cd;
  s.mit = s.arm / (s.arm + 30 + 8 * L);
  return s;
}
let ST = null;
function refreshStats(){ ST = heroStats(HERO); if (G && G.knight) G.knight.hp = Math.min(G.knight.hp, ST.hp); }

/* ============ Erscheinungsorte der Monster in jedem Gebiet ============ */
const SPAWN_SLOTS = (() => {
  const R = rng(2024), out = [];
  const TARGET = { obstgarten:22, fluss:16, dorf:20, friedhof:18, lager:18, galgen:16, wald:30, schlachtfeld:24, moor:24, ruine:20, weinberge:24, auwald:28, piratennest:12,
    schwarzwald:34, silberrevier:30, schanze:26, hochgebirge:34, heide:34, reichswald:34, gailingen:20, donauried:26, lechfeld:28 };
  const NEWZ = { schwarzwald:1, silberrevier:1, schanze:1, hochgebirge:1 };   // Bergland: nur im neuen Kartenteil suchen, damit die alten Lager bleiben, wo sie waren
  const EASTZ = { heide:1, reichswald:1, gailingen:1, donauried:1, lechfeld:1 };   // Ostlande: nur rechts der alten Welt
  const zid = (x, y) => ZONES[gZid(x, y)].id;
  const nearSafe = (x, y) => [[0, 0], [220, 0], [-220, 0], [0, 220], [0, -220], [160, 160], [-160, 160], [160, -160], [-160, -160]].some(([dx, dy]) => SAFE[zid(clamp(x + dx, 0, GW - 1), clamp(y + dy, 0, GH - 1))]);
  const lairs = Object.values(LAIRS), inns = Object.values(wo_INNP).map(gPt);
  const free = (x, y, z) => { const isle = z === 'piratennest';
    return !out.some(s => Math.abs(s.x - x) < (isle ? 96 : 144) && Math.abs(s.y - y) < (isle ? 70 : 116)) && !lairs.some(p => Math.hypot(p.x - x, p.y - y) < (isle ? 150 : 300)) && (isle || !nearSafe(x, y))
    && !inns.some(e => Math.hypot(e.x - x, e.y - y) < 480); };
  for (const [zone, kinds] of Object.entries(ZONE_MOBS)){
    const [lo, hi] = ZONE_LV[zone];
    const first = out.length;
    const add = (kind, x, y) => out.push({ kind, x: Math.round(x), y: Math.round(y), zone, lvl: lo, mon:null, t:0 });
    let n = 0;
    const pts = [];
    for (const kind of kinds) for (const q of (SPAWNS[kind] || [])){ const p = gPt(q); if (zid(p.x, p.y) === zone) pts.push([kind, p]); }
    for (let i = pts.length - 1; i > 0; i--){ const j = R() * (i + 1) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    for (const [kind, p] of pts){ if (n >= TARGET[zone] * .7) break; if (!free(p.x, p.y, zone)) continue; add(kind, p.x, p.y); n++; }
    for (let t = 0; t < 6000 && n < TARGET[zone]; t++){
      const x = EASTZ[zone] ? (WW0 - 200) * WS + R() * (GW - (WW0 - 200) * WS) : R() * WW0 * WS, y = EASTZ[zone] ? R() * GH : NEWZ[zone] ? (WH0 - 200) * WS + R() * (GH - (WH0 - 200) * WS) : R() * WH0 * WS;
      if (zid(x, y) !== zone || !gOk(x, y) || !free(x, y, zone)) continue;
      add(kinds[R() * kinds.length | 0], x, y); n++;
    }
    // je weiter von Burg und Stadt entfernt, desto stärker
    const mine = out.slice(first), hub = s => Math.min(...Object.values(BIND).map(b => Math.hypot(b.x - s.x, b.y - s.y)));
    mine.sort((a, b) => hub(a) - hub(b));
    mine.forEach((s, i) => { s.lvl = clamp(lo + Math.floor((i + R() * 2 - .5) / mine.length * (hi - lo + 1)), lo, hi); });
  }
  for (const [kind, b] of Object.entries(BOSSES)) out.push({ kind, x: LAIRS[kind].x, y: LAIRS[kind].y, zone: b.zone, lvl: b.lvl, mon:null, t:0, boss:true });
  return out;
})();

/* ============ Leute in Burg und Stadt ============ */
NPC_ART.stall = np_frames({ robe:'short', hat:'filz', belt:true, beard:true, hair:['j', 'h'] },
  { 1:'#2a3a24', 2:'#3e5434', 3:'#546e44', 4:'#708a58', 5:'#4a3a28', 6:'#5e4a34', 7:'#725c42', 8:'#8a7254', R:'#8a1c1c' });
NPC_ART.schmied = np_frames({ robe:'short', apron:'leather', belt:true, beard:true, hairSide:true, hair:['h', 'j'], sleeve:['s', 't', 'u', 'v'] },
  { 1:'#2a2420', 2:'#3a322c', 3:'#4a4038', 4:'#5c5048', 5:'#2a2420', 6:'#3a322c', 7:'#4a4038', 8:'#5c5048' });
NPC_ART.herold = np_frames({ robe:'short', hat:'barett', belt:true, chain:true, staff:true, parti:true, hair:['h', 'j'] },
  { 1:'#7a5a10', 2:'#b08a1e', 3:'#d8b030', 4:'#f0d460', 5:'#141218', 6:'#221e28', 7:'#322c3a', 8:'#463e50', R:'#b8281e' });
const NPCS = [
  { id:'vogt', name:'Vogt Heinrich', role:'Aufträge', hub:'burg', at: gNear(1954, 530), quest:true },
  { id:'kraemerin', name:'Krämerin Gertrud', role:'Händlerin', hub:'burg', at: gNear(2074, 536), shop:true },
  { id:'buerger', name:'Bürgermeister Ulman', role:'Aufträge', hub:'stadt', at: gNear(2926, 2352), quest:true },
  { id:'kraemer', name:'Krämer Jörg', role:'Händler', hub:'stadt', at: gNear(3052, 2318), shop:true },
  { id:'stall', name:'Stallmeister Lienhard', role:'Pferde', hub:'burg', at: gNear(1760, 548), stable:true,
    greet:['Ein Ritter ohne Pferd ist nur ein Mann in Blech.', 'Gute Pferde, ehrlicher Preis. Fast immer.', 'Wollt Ihr reiten oder laufen, Herr Ritter?'] },
  { id:'schmied', name:'Schmied Wolf', role:'Schmied', hub:'stadt', at: gNear(3000, 2372), smith:true,
    greet:['Gebt her, ich schlage Euch das Eisen härter.', 'Gute Klingen brauchen gute Hämmer.', 'Wer bei mir arbeiten lässt, kehrt öfter heim.'] },
  { id:'herold', name:'Herold Kaspar', role:'Turnier', hub:'stadt', at: gNear(wo_TJ.x - 64, wo_TJ.y + 44), joust:true,
    greet:['Hört, hört! Wer bricht heute eine Lanze vor der Königsstadt?', 'Ein Ritter zeigt sich im Turnier, nicht nur im Wald.', 'Die Damen auf der Tribüne warten schon, Herr Ritter.'] }
];
NPCS.forEach(n => { n.x = n.at.x; n.y = n.at.y; n.art = NPC_ART[n.id]; n.key = n.id; });

/* ============ Gasthäuser: Speis und Trank, Rast, Treffpunkt ============ */
/* Speisen und Getränke wie in einem Wirtshaus um 1520 (keine Kartoffeln, die kamen erst später aus Amerika).
   fx: hpPct Leben, dmgPct Schaden, crit Volltreffer, spd Hiebtempo, regen Erholung; base Preis bei Stufe 1 */
const FARE = [
  { id:'brot', kind:'speise', n:'Roggenbrot mit Schmalz', fx:{ hpPct:6 }, base:2, icon:'brot' },
  { id:'brei', kind:'speise', n:'Hirsebrei mit Honig', fx:{ hpPct:5, regen:2 }, base:3, icon:'schuessel' },
  { id:'erbsen', kind:'speise', n:'Erbsen mit Speck', fx:{ hpPct:10 }, base:4, icon:'schuessel' },
  { id:'wurst', kind:'speise', n:'Rostbratwürste mit Sauerkraut', fx:{ hpPct:8, dmgPct:5 }, base:6, icon:'wurst' },
  { id:'braten', kind:'speise', n:'Schweinebraten mit Brotknödeln', fx:{ hpPct:15, regen:2 }, base:9, icon:'braten' },
  { id:'kapaun', kind:'speise', n:'Gebratener Kapaun mit Mandelmus', fx:{ hpPct:18, dmgPct:6 }, base:14, icon:'braten', only:'adler' },
  { id:'forelle', kind:'speise', n:'Gesottene Forelle aus dem Fluss', fx:{ hpPct:12, regen:3 }, base:8, icon:'fisch', only:'krone' },
  { id:'ochsen', kind:'speise', n:'Ochsenbraten nach Art des Hauses', fx:{ hpPct:20 }, base:11, icon:'braten', only:'ochse' },
  { id:'salm', kind:'speise', n:'Stromsalm mit Kräutern', fx:{ hpPct:16, regen:3 }, base:12, icon:'fisch', only:'anker' },
  { id:'pfaelzer', kind:'trank', n:'Wein vom Haardtrand', fx:{ spd:9, dmgPct:3 }, base:6, icon:'wein', only:'anker' },
  { id:'knappenbrot', kind:'speise', n:'Bergmannsbrot mit Speck und Zwiebeln', fx:{ hpPct:16, regen:2 }, base:10, icon:'brot', only:'kanne' },
  { id:'forellebach', kind:'speise', n:'Forelle aus dem Silberbach', fx:{ hpPct:14, dmgPct:5 }, base:11, icon:'fisch', only:'kanne' },
  { id:'bergbier', kind:'trank', n:'Dunkles Bergbier aus Silberberg', fx:{ crit:5, dmgPct:4 }, base:6, icon:'krug', only:'kanne' },
  { id:'zander', kind:'speise', n:'Zander aus der Schwane mit Petersilie', fx:{ hpPct:15, regen:3 }, base:11, icon:'fisch', only:'schwan' },
  { id:'torgauer', kind:'trank', n:'Dunkelbier, wie es Bruder Elias liebt', fx:{ crit:6, regen:2 }, base:6, icon:'krug', only:'schwan' },
  { id:'rostbrat', kind:'speise', n:'Sechs Burgfeldener Rostbratwürste mit Kren', fx:{ hpPct:14, dmgPct:7 }, base:10, icon:'wurst', only:'gloecklein' },
  { id:'lebkuechner', kind:'speise', n:'Lebkuchen frisch vom Lebküchner', fx:{ hpPct:10, crit:4 }, base:6, icon:'brot', only:'gloecklein' },
  { id:'huchen', kind:'speise', n:'Huchen aus dem Wildbach', fx:{ hpPct:16, dmgPct:5 }, base:12, icon:'fisch', only:'lamm' },
  { id:'weizen', kind:'trank', n:'Weizenbier aus Goldbrunn', fx:{ spd:8, crit:4 }, base:6, icon:'krug', only:'lamm' },
  { id:'kofent', kind:'trank', n:'Dünnbier (Kofent)', fx:{ crit:2 }, base:1, icon:'krug' },
  { id:'bier', kind:'trank', n:'Bier nach dem Reinheitsgebot von 1516', fx:{ crit:5 }, base:3, icon:'krug' },
  { id:'wein', kind:'trank', n:'Landwein', fx:{ spd:8 }, base:4, icon:'wein' },
  { id:'met', kind:'trank', n:'Met mit Honig', fx:{ dmgPct:6 }, base:4, icon:'krug' },
  { id:'malvasier', kind:'trank', n:'Malvasier aus dem Süden', fx:{ spd:10, crit:3 }, base:10, icon:'wein', only:'adler' },
  // nur bei den Festen
  { id:'maiwein', kind:'trank', n:'Maiwein mit Waldmeister', fx:{ crit:4, regen:2 }, base:3, icon:'wein', fest:'mai' },
  { id:'hefezopf', kind:'speise', n:'Hefezopf vom Maifest', fx:{ hpPct:8, regen:2 }, base:3, icon:'brot', fest:'mai' },
  { id:'holunder', kind:'trank', n:'Holundersaft vom Johannistag', fx:{ spd:6, regen:2 }, base:2, icon:'krug', fest:'johannis' },
  { id:'stockbrot', kind:'speise', n:'Stockbrot aus dem Johannisfeuer', fx:{ hpPct:10 }, base:2, icon:'brot', fest:'johannis' },
  { id:'federweisser', kind:'trank', n:'Federweißer vom neuen Wein', fx:{ spd:8, crit:2 }, base:3, icon:'wein', fest:'ernte' },
  { id:'zwiebelkuchen', kind:'speise', n:'Zwiebelkuchen zur Ernte', fx:{ hpPct:12, dmgPct:3 }, base:4, icon:'brot', fest:'ernte' },
  { id:'gluehwein', kind:'trank', n:'Heißer Würzwein (Glühwein)', fx:{ dmgPct:5, regen:2 }, base:3, icon:'wein', fest:'advent' },
  { id:'lebkuchen', kind:'speise', n:'Burgfeldener Lebkuchen', fx:{ hpPct:10, crit:3 }, base:3, icon:'brot', fest:'advent' }
];
const FARE_BY = Object.fromEntries(FARE.map(f => [f.id, f]));
const FARE_MIN = 15;                                  // Minuten Spielzeit, die eine Mahlzeit vorhält
const farePrice = f => rufPrice(f.base * (1 + HERO.lvl * .45), 'bauern');
const fxText = fx => [fx.hpPct && '+' + fx.hpPct + ' % Leben', fx.dmgPct && '+' + fx.dmgPct + ' % Schaden', fx.crit && '+' + fx.crit + ' % Volltreffer', fx.spd && '+' + fx.spd + ' % Hiebtempo', fx.regen && (fx.regen > 2 ? 'dreifache' : 'doppelte') + ' Erholung'].filter(Boolean).join(', ');
Object.assign(Sound, {
  eat(){ for (let i = 0; i < 3; i++) this.noise(.05, .06, 1200, i * .12); },
  drink(){ this.tone(220, .12, 'sine', .05, 80); this.tone(260, .12, 'sine', .045, 80, .14); this.tone(300, .16, 'sine', .04, 60, .28); }
});

/* Symbole für Speis und Trank (16 × 16) */
Object.assign(ICONS, {
  brot: bi_icon(['................', '................', '................', '................', '......nnnn......', '....nnpqqpnn....', '...npqqpqqqpn...', '..npqpqqpqpqpn..',
    '..nqqpqqpqqpqn..', '.mnpppqppppppnm.', '.lmnnpppppnnnml.', '..llmmmmmmmmll..', '....llllllll....', '................', '................', '................']),
  schuessel: bi_icon(['................', '................', '................', '..........x.....', '.........x......', '....ijjjxjji....', '...ihijjjjihi...', '..nmnnnnnnnnmn..',
    '..npqqpqqpqqpn..', '...npqqpqqpqn...', '....nppppppn....', '.....nmmmmn.....', '......llll......', '................', '................', '................']),
  wurst: bi_icon(['................', '................', '................', '................', '.....rRRRRr.....', '....rRSSRRRr....', '...rRRRRRRRRr...', '....rrRRRRRr....',
    '...ij.rRSSRRr...', '..ijirRRRRRRRr..', '..34444rrrrr443.', '...3344444443...', '.....333333.....', '................', '................', '................']),
  braten: bi_icon(['................', '................', '..........5w....', '.........5w5....', '....mnnn5w5.....', '...mnpqqp55.....', '..mnpqqqppnm....', '..mnppqpppnm....',
    '..lmnppppnml....', '...llmmmmll.....', '.3344444444433..', '..33444444433...', '....33333333....', '................', '................', '................']),
  fisch: bi_icon(['................', '................', '................', '................', '................', '...........x....', '..xyyyyyyyxx.x..', '.x1yRyyRyyyyxx..',
    '.xwwwwwwwwwwxw..', '..xyyyyyyyyx..x.', '.3344444444433..', '..33444444433...', '....33333333....', '................', '................', '................']),
  krug: bi_icon(['................', '................', '....wwwwww......', '...wwwwwwww.....', '...wxwwxwwx.....', '...npqqpqpn.....', '...npqqpqpnmm...', '...hiiiiiihnn...',
    '...npqqpqpn..m..', '...npqqpqpn..m..', '...npqqpqpnmm...', '...hiiiiiihn....', '...npqqpqpn.....', '....nnnnnn......', '................', '................']),
  wein: bi_icon(['................', '................', '....uuuuuuu.....', '....uRRRRRu.....', '....usRRRRu.....', '.....uRRRu......', '......uuu.......', '......vVv.......',
    '.......u........', '......vVv.......', '.......u........', '....vvVVVvv.....', '.....vvvvv......', '................', '................', '................'])
});

/* Leute im Gasthaus */
const INN_INFO = {
  adler: { name:'Zum Goldenen Adler', where:'in der Königsstadt', host:'Wirtin Margarethe', role:'Wirtin', wall:wp_P.ochre, seed:31 },
  krone: { name:'Zur Krone', where:'an der Steinbrücke', host:'Wirt Konrad', role:'Wirt', wall:wp_P.plaster, seed:47 },
  ochse: { name:'Zum Roten Ochsen', where:'am Burgweg', host:'Wirt Bartholomäus', role:'Wirt', wall:wp_P.pink, seed:59 },
  anker: { name:'Zum Anker', where:'in Altmünster am Hafen', host:'Wirt Ruprecht', role:'Wirt', wall:wp_P.ochre, seed:71 },
  kanne: { name:'Zur Silbernen Kanne', where:'in der Bergstadt Silberberg', host:'Wirtin Walburga', role:'Wirtin', wall:wp_P.plaster, seed:83 },
  schwan: { name:'Zum Weißen Schwan', where:'in Schwanstedt', host:'Wirt Melchior', role:'Wirt', wall:wp_P.ochre, seed:97 },
  gloecklein: { name:'Zum Bratwurstglöcklein', where:'in Burgfelden', host:'Wirtin Kunigunde', role:'Wirtin', wall:wp_P.pink, seed:101 },
  lamm: { name:'Zum Weißen Lamm', where:'in Goldbrunn', host:'Wirt Ulrich', role:'Wirt', wall:wp_P.plaster, seed:109 }
};
const INN_ART = {
  wirt: np_frames({ robe:'short', apron:'linen', belt:true, beard:true, hairSide:true, hair:['j', 'h'] },
    { 1:'#3a2a1a', 2:'#56402a', 3:'#70583a', 4:'#8a7050', 5:'#2a2420', 6:'#3a322c', 7:'#4a4038', 8:'#5c5048' }),
  wirtin: np_frames({ robe:'long', hat:'haube', apron:'linen' },
    { 1:'#4a1414', 2:'#6e2020', 3:'#8e3028', 4:'#ae4a3a', 5:'#3a2c1e', 6:'#4a3a28', 7:'#5a4a34', 8:'#6e5c44' }),
  spielmann: np_frames({ robe:'short', hat:'barett', parti:true, lute:true, belt:true },
    { 1:'#6a1414', 2:'#9a2420', 3:'#c03a2c', 4:'#de5a44', 5:'#7a5a10', 6:'#a88220', 7:'#d2a83a', 8:'#ecca5c' }),
  bauer: np_frames({ robe:'short', hat:'filz', beard:true, belt:true, hair:['j', 'h'] },
    { 1:'#3a3a2c', 2:'#525240', 3:'#6a6a54', 4:'#84846a', 5:'#3a2c1e', 6:'#4a3a28', 7:'#5a4a34', 8:'#6e5c44', R:'#6a5a3a' }),
  landsknecht: np_frames({ robe:'short', hat:'barett', parti:true, beard:true, belt:true, hair:['h', 'j'] },
    { 1:'#1c2a5a', 2:'#2a3e7e', 3:'#3e56a0', 4:'#5a74bc', 5:'#8a8478', 6:'#b0aa9a', 7:'#d4cebc', 8:'#eee8d8', R:'#b8281e' })
};
const INN_LORE = {
  spielmann: [
    'Habt Ihr gehört? In der Krönungsstadt hat man den jungen Albrecht zum König gekrönt.',
    'Im Juni trafen sich die Häupter der vier großen Häuser auf einem Feld voller goldener Zelte. Ein Turnier jagte das andere.',
    'Aus Schwanstedt erzählt man, ein Mönch namens Elias streite mit dem Heiligen Vater. Das gibt noch Ärger, sag ich Euch.',
    'Die Goldmanns in Goldbrunn haben die Königswahl bezahlt. Gold öffnet jede Tür, auch die der Fürsten.',
    'Ein Seefahrer aus dem Westen will um die ganze Welt segeln, heißt es. Ob er je wiederkommt?',
    'Wer in die Raubritterburg will, sollte vorher hier gut essen. Mit leerem Magen kämpft es sich schlecht.'
  ],
  bauer: [
    'Der Zehnt frisst uns auf, und jetzt noch die Monster in den Feldern.',
    'Auf dem alten Schlachtfeld geht der Tod um. Ohne Heiltränke geht da keiner hin.',
    'Im Moor haust der Lindwurm. Sein Feuer brennt durch jede Rüstung.',
    'Kunz der Schwarze lacht über jeden Ritter unter Stufe 17. Glaubt es mir.',
    'Die Würste hier sind die besten im ganzen Königsland. Esst eine, dann schlagt Ihr kräftiger zu.'
  ]
};

/* ---------- Gasthäuser in der Welt ---------- */
const INNS = Object.entries(wo_INNP).map(([id, p]) => {
  const pr = GPROPS.find(q => q.kind === 'gasthaus_' + id);
  return Object.assign({ id, x: p.x * WS, y: p.y * WS, dx: p.door * WS, dy: p.y * WS + 12, top: pr ? pr.y - pr.ay : p.y * WS - 200 }, INN_INFO[id]);
});
const INN_BY = Object.fromEntries(INNS.map(i => [i.id, i]));
const HUB_IN = { burg:'in der Königsburg', stadt:'in der Königsstadt', speyer:'in Altmünster', annaberg:'in der Bergstadt Silberberg', wittenberg:'in Schwanstedt', nuernberg:'in Burgfelden', augsburg:'in Goldbrunn',
  adlerhorst:'auf dem Adlerhorst', lilienthal:'auf Schloss Lilienthal', loewenburg:'auf der Löwenburg', turmfeste:'in der Turmfeste' };
for (const inn of INNS){
  BIND[inn.id] = { x: inn.dx, y: inn.dy + 2 };
  HUB_NAME[inn.id] = 'Gasthaus ' + inn.name;
  HUB_IN[inn.id] = 'im Gasthaus ' + inn.name;
  MAP_LABELS.push({ x: inn.dx / WS, y: inn.y / WS - 70, name: inn.name, inn: true });
}
const nearInn = (x, y) => INNS.some(i => Math.hypot(i.dx - x, i.dy - y) < 220);

/* ---------- Innenraum: Herd, Schanktisch, Tische und Bänke (Raumkoordinaten, Figuren in Feinpixeln) ---------- */
const RW = 960, RH = 540;                  // Gaststube; ist die Leinwand kleiner, folgt der Blick dem Ritter
const ROOM_DOOR = { x: 480, y: 522 };
const roomCam = k => ({ x: Math.round(clamp(k.x - W / 2, 0, Math.max(0, RW - W))), y: Math.round(clamp(k.y - 22 - H / 2, 0, Math.max(0, RH - H))) });
function innRoom(inn){
  if (inn.church) return chRoom(inn);   // Kirchen: eigener Raum (22-kirchen)
  if (inn.room) return inn.room;
  const s = inn.seed, B = wp_buf(RW, RH), R = rng(s), items = [], rects = [], candles = [];
  const C = (h) => wp_c(h), FL = 130;     // Oberkante des Dielenbodens
  wp_rect(B, 0, 0, RW, RH, C('#100d0b'));
  // Rückwand: Fachwerk mit Butzenscheiben
  wp_fachwerk(B, { x0: 22, x1: RW - 22, yT: 8, yB: FL - 4, R: wp_P.oak, P: inn.wall, s, pat: 'kreuz', flake: .35, gap: 24, par: 8,
    wins: [{ x: 212, w: 18, h: 18, glass: true }, { x: 300, w: 18, h: 18, glass: true }, { x: 446, w: 18, h: 18, glass: true }, { x: 520, w: 18, h: 18, glass: true }, { x: 620, w: 18, h: 18, glass: true }] });
  wp_beam(B, 22, FL - 4, RW - 22, FL - 4, 3, wp_P.oak, s + 3);
  // Seitenwände in Schräge
  wp_poly(B, [[0, 0], [22, 8], [22, FL + 2], [0, FL + 30]], (x, y) => wp_tone(wp_P.oak, .18 + (wp_h(x, y, s) - .5) * .1, x, y));
  wp_poly(B, [[RW, 0], [RW - 22, 8], [RW - 22, FL + 2], [RW, FL + 30]], (x, y) => wp_tone(wp_P.oak, .1 + (wp_h(x, y, s) - .5) * .1, x, y));
  // Dielenboden
  for (let y = FL - 2; y < RH; y++){
    const row = Math.floor((y - FL + 2) / 8), off = (row * 37) % 72;
    for (let x = 0; x < RW; x++){
      const k = Math.floor((x + off) / 72), seam = (y - FL + 2) % 8 === 0 || (x + off) % 72 === 0;
      let v = .42 + (wp_h(k, row, s) - .5) * .22 + (wp_vn(x * .07, y * .45, s + 2) - .5) * .25 - (y < FL + 6 ? .15 : 0);
      if (seam) v -= .28;
      if (!seam && (x + off) % 72 === 3 && (y - FL + 2) % 8 === 4) v -= .2;     // Holznagel
      wp_set(B, x, y, wp_tone(wp_P.wood, v, x, y));
      if (wp_h(x, y, s + 9) > .986) wp_set(B, x, y, wp_P.straw[3]);        // Binsenhalme auf dem Boden
    }
  }
  for (let y = FL - 2; y < FL + 30; y++){ const w2 = Math.round(22 - (y - FL + 2) * .72); wp_rect(B, 0, y, Math.max(0, w2), y + 1, C('#100d0b')); wp_rect(B, RW - Math.max(0, w2), y, RW, y + 1, C('#100d0b')); }
  // Herd: Steinmantel, Feueröffnung, Kesselhaken
  const hx0 = 40, hx1 = 168;
  wp_rect(B, hx0, 10, hx1, FL + 12, wp_rubble({ R: wp_P.grey, s: s + 5, cw: 7, chh: 4 }));
  wp_rect(B, hx0 - 4, 50, hx1 + 4, 57, (x, y) => wp_tone(wp_P.oak, y === 50 ? .75 : .4, x, y));
  wp_rect(B, hx0 + 22, 72, hx1 - 22, FL + 10, (x, y) => wp_P.dark[y < 80 ? 0 : 1]);
  wp_rect(B, hx0 + 22, FL + 4, hx1 - 22, FL + 10, (x, y) => wp_tone(wp_P.char, .3 + wp_h(x, y, s) * .5, x, y));
  const kx = (hx0 + hx1) / 2;
  wp_line(B, kx, 72, kx, 92, wp_P.iron[2]);
  wp_ell(B, kx, 100, 11, 8, (x, y) => wp_tone(wp_P.iron, .25 + (kx - x) * .03 - (y - 100) * .03, x, y));
  for (let i = 0; i < 8; i++){ const jx = hx0 + 6 + i * 15; wp_rect(B, jx, 42, jx + 6, 50, (x, y) => wp_tone(i & 1 ? wp_P.ochre : wp_P.grey, .3 + (jx + 6 - x) * .09, x, y)); }
  rects.push([hx0 - 2, 0, hx1 + 2, FL + 14]);
  // Holzstapel neben dem Herd
  wp_woodpile(B, hx1 + 6, FL + 12, 26, 16, s + 21);
  rects.push([hx1 + 4, FL - 6, hx1 + 34, FL + 13]);
  // Regal mit Krügen und Zinntellern, Hirschgeweih, Wappen des Hauses
  const sx0 = 700, sx1 = 914;
  for (const sy of [46, 74]) wp_rect(B, sx0, sy, sx1, sy + 3, (x, y) => wp_tone(wp_P.oak, y === sy ? .75 : .35, x, y));
  for (let i = 0; i < 17; i++){
    const jx = sx0 + 6 + i * 12, sy = i & 1 ? 74 : 46;
    if (i % 3 === 0) wp_ell(B, jx + 3, sy - 4, 4, 4, (x, y) => wp_tone(wp_P.iron, .75 - Math.hypot(x - jx - 2, y - sy + 5) * .1, x, y));
    else wp_rect(B, jx, sy - 8, jx + 6, sy, (x, y) => wp_tone(i % 3 === 1 ? wp_P.grey : wp_P.ochre, .3 + (jx + 6 - x) * .08, x, y));
  }
  wp_rect(B, 400, 18, 424, 38, (x, y) => wp_tone(wp_P.oak, .35, x, y));
  for (const [ax, ay] of [[394, 20], [390, 15], [430, 20], [434, 15], [388, 26], [436, 26]]) wp_line(B, 412, 27, ax, ay, wp_P.bark[4]);
  // Fässer an der Wand hinter dem Schanktisch
  for (let i = 0; i < 8; i++) wp_barrel(B, 716 + i * 26, FL + 2, 18, 22, s + i, { R: wp_P.wood });
  // Ausgang unten: Tür ins Freie
  const dx0 = ROOM_DOOR.x - 18, dx1 = ROOM_DOOR.x + 18;
  wp_rect(B, 0, RH - 16, RW, RH, (x, y) => wp_tone(wp_P.oak, .22 + (wp_h(x, y, s) - .5) * .1, x, y));
  wp_rect(B, dx0, RH - 16, dx1, RH, (x, y) => wp_tone(wp_P.moss, .55 + (y - RH + 16) * .02, x, y));
  wp_rect(B, dx0 - 2, RH - 18, dx0, RH, wp_P.oak[4]); wp_rect(B, dx1, RH - 18, dx1 + 2, RH, wp_P.oak[1]);
  rects.push([0, 0, 22, RH], [RW - 22, 0, RW, RH], [0, 0, RW, FL + 4], [0, RH - 16, dx0 - 2, RH], [dx1 + 2, RH - 16, RW, RH]);
  // Radleuchter mit Kerzen an Ketten
  const chand = [330, 630];
  for (const lx of chand){
    wp_line(B, lx, 0, lx, 30, wp_P.iron[2]);
    wp_ell(B, lx, 34, 24, 3, (x, y) => (Math.abs((x - lx) / 24) ** 2 + ((y - 34) / 3) ** 2 > .45) ? wp_tone(wp_P.oak, .45 - (y - 34) * .1, x, y) : 0);
    for (const cx of [lx - 18, lx - 6, lx + 6, lx + 18]){ wp_rect(B, cx, 26, cx + 2, 32, C('#e8e0c8')); wp_set(B, cx, 24, C('#ffd36a')); wp_set(B, cx, 25, C('#fff3c0')); }
  }
  const bg = wp_canvas(B);
  // Wirtshausschild an der Rückwand
  const sign = wp_img(16, 14, 13); wp_innSign(sign, 0, -2, 1, inn.id); wp_outline(sign, true);
  bg.getContext('2d').drawImage(wp_canvas(sign), 860, 14);

  // Schanktisch (vor dem Wirt)
  const cw = 220, ct = wp_img(cw, 26, 24);
  wp_rect(ct, 2, 2, cw - 2, 8, (x, y) => wp_tone(wp_P.oak, y < 4 ? .8 : .5, x, y));
  wp_rect(ct, 4, 8, cw - 4, 24, wp_planks(wp_P.wood, s + 11, 6, {}));
  for (const kx2 of [34, 70, 150, 186]){ wp_rect(ct, kx2, -1, kx2 + 5, 2, (x, y) => wp_tone(wp_P.wood, .6, x, y)); wp_rect(ct, kx2, -2, kx2 + 5, 0, C('#e8e2d0')); }
  wp_outline(ct, true);
  items.push({ img: wp_canvas(ct), x: 806, y: 190, ax: cw >> 1, ay: 24 });
  rects.push([690, 0, 920, 192]);
  // Tische mit Bänken in zwei Reihen
  const tables = [[72, 196, 262], [300, 430, 250], [560, 690, 266], [150, 280, 392], [420, 552, 404], [690, 820, 386]];
  for (const [x0, x1, ty] of tables){
    const w2 = x1 - x0, T = wp_img(w2 + 4, 22, 20);
    wp_rect(T, 2, 2, w2 + 2, 11, (x, y) => wp_tone(wp_P.oak, .55 + (wp_vn(x * .2, y, s) - .5) * .3 - (y > 8 ? .2 : 0), x, y));
    wp_rect(T, 2, 11, w2 + 2, 13, (x, y) => wp_tone(wp_P.oak, .2, x, y));
    for (const lx of [6, w2 - 4]) wp_rect(T, lx, 13, lx + 3, 20, (x, y) => wp_tone(wp_P.oak, .3, x, y));
    wp_rect(T, 8, 16, w2 - 4, 17, (x, y) => wp_tone(wp_P.oak, .25, x, y));
    // Krüge, Brot, Kerze
    for (let i = 0; i < 3; i++){ const mx = 10 + R() * (w2 - 20) | 0; wp_rect(T, mx, 2, mx + 4, 8, (x, y) => wp_tone(wp_P.wood, .5 + (mx + 4 - x) * .1, x, y)); wp_rect(T, mx, 1, mx + 4, 3, C('#e8e2d0')); }
    const bx = 14 + R() * (w2 - 30) | 0; wp_ell(T, bx, 6, 5, 3, (x, y) => wp_tone(wp_P.straw, .7 - (y - 4) * .15, x, y));
    const cx = Math.round(w2 / 2) + 2; wp_rect(T, cx, 0, cx + 2, 7, C('#e8e0c8'));
    wp_outline(T, true);
    items.push({ img: wp_canvas(T), x: Math.round((x0 + x1) / 2), y: ty, ax: (w2 + 4) >> 1, ay: 20 });
    candles.push({ x: x0 + cx - 1, y: ty - 21 });
    rects.push([x0 - 1, ty - 11, x1 + 1, ty + 2]);
    for (const by of [ty - 16, ty + 14]){
      const Bn = wp_img(w2 - 6, 8, 7);
      wp_rect(Bn, 1, 1, w2 - 7, 4, (x, y) => wp_tone(wp_P.wood, y < 2 ? .7 : .45, x, y));
      for (const lx of [3, w2 - 11]) wp_rect(Bn, lx, 4, lx + 2, 7, (x, y) => wp_tone(wp_P.wood, .3, x, y));
      wp_outline(Bn, true);
      items.push({ img: wp_canvas(Bn), x: Math.round((x0 + x1) / 2), y: by, ax: (w2 - 6) >> 1, ay: 7 });
    }
  }
  // Licht: Herdfeuer, Kerzen, Laterne über dem Schanktisch, Radleuchter, Tageslicht durch die Tür
  const lights = [[kx, 112, 270, 1, 1], [806, 70, 170, .7, .4], [chand[0], 200, 220, .5, .35], [chand[1], 200, 220, .5, .35], [ROOM_DOOR.x, RH + 16, 130, .55, 0]].concat(candles.map(c => [c.x, c.y, 80, .55, .5]));
  const light = canvasOf(RW, RH), lg = light.getContext('2d'), id = lg.createImageData(RW, RH);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++){
    let L = 0, warm = 0;
    for (const [lx, ly, r, k, wm] of lights){ const dx = x - lx, dy = (y - ly) * 1.2; if (Math.abs(dx) >= r || Math.abs(dy) >= r) continue; const d = Math.hypot(dx, dy); if (d < r){ const v = Math.pow(1 - d / r, 1.4) * k; L += v; warm += v * wm; } }
    L = Math.min(1, L); warm = Math.min(1, warm);
    const q = .07, a = Math.floor((.52 * (1 - L) + .1 * warm) / q + dither(x, y)) * q, i = (y * RW + x) * 4;
    const t = clamp(warm * 1.4, 0, 1);
    id.data[i] = Math.round(14 + (255 - 14) * t); id.data[i + 1] = Math.round(10 + (160 - 10) * t); id.data[i + 2] = Math.round(8 + (70 - 8) * t);
    id.data[i + 3] = Math.round(clamp(a, 0, .85) * 255);
  }
  lg.putImageData(id, 0, 0);
  const host = inn.role === 'Wirtin' ? 'wirtin' : 'wirt';
  const npcs = [
    { id:'wirt', key:'wirt_' + inn.id, name: inn.host, role: inn.role, x: 806, y: 176, art: INN_ART[host], wirt: true, inn: inn.id,
      greet:['Setzt Euch, Ritter! Was darf’s sein?', 'Willkommen im ' + inn.name.replace(/^Zu[mr] /, '') + '. Hier wird nicht gekämpft, hier wird gegessen.', 'Ein Krug Bier gegen den Staub der Straße?'] },
    { id:'spielmann', key:'spielmann_' + inn.id, name:'Spielmann Veit', role:'Spielmann', x: 480, y: 168, art: INN_ART.spielmann, lore: INN_LORE.spielmann },
    { id:'bauer', key:'bauer_' + inn.id, name:'Bauer Hinz', role:'Gast', x: 112, y: 247, art: INN_ART.bauer, lore: INN_LORE.bauer },
    { id:'landsknecht', key:'landsknecht_' + inn.id, name:'Landsknecht Utz', role:'Würfelspieler', x: 760, y: 371, art: INN_ART.landsknecht, dice: true,
      greet:['Lust auf ein Spielchen, Herr Ritter? Drei Würfel, ehrliche Würfel.', 'Im letzten Feldzug hab ich meinen Sold verspielt. Heute hol ich ihn mir wieder.', 'Wer nicht wagt, der nicht gewinnt. Setzt Ihr?'] }
  ];
  innMore(inn, npcs);   // Mühle, Einunddreißig, Kegeln, Ringen (Teil 25)
  return (inn.room = { bg, light, items, rects, npcs, candles, fire: { x: kx, y: FL + 8 } });
}
const roomBlocked = (rm, x, y) => rm.rects.some(r => x + 6 > r[0] && x - 6 < r[2] && y > r[1] && y - 5 < r[3]);

function enterInn(inn){
  if (G.mode !== 'play' || G.inside || !inn) return;
  const rm = innRoom(inn), k = G.knight;
  if (HERO.riding){ HERO.riding = false; renderSkills(); }
  G.inside = inn; k.ride = null;
  k.x = ROOM_DOOR.x; k.y = ROOM_DOOR.y - 4; k.dir = 'up'; k.atkT = 0; k.bashT = 0; k.kbx = k.kby = 0; k.slowT = 0;
  for (const m of G.mons) if (m.slot) m.slot.mon = null;
  G.mons.length = 0; G.rising.length = 0; G.shots.length = 0; G.parts.length = 0;
  for (const s of SPAWN_SLOTS) if (s.mon === true) s.mon = null;
  Sound.setTune(inn.church ? 'choral' : 'inn');
  updateZone(true); updateBossBar(); updateNear();
  showBanner(inn.name, inn.church ? 'Stille · hier seid Ihr sicher' : 'Speis und Trank · hier seid Ihr sicher');
  if (inn.church) chEnter(inn);
  sendPresence(true); markDirty(true);
}
function leaveInn(){
  const inn = G.inside, k = G.knight;
  if (!inn) return;
  G.inside = null;
  k.x = inn.dx; k.y = inn.dy + 2; k.dir = 'down';
  G.zone = gZone(k.x, k.y).id; G.spawnT = 0; G.parts.length = 0;
  Sound.setTune(musicFor());
  updateZone(true); updateNear(); sendPresence(true); markDirty(true);
}
function updateInn(dt){
  const k = G.knight, v = inputVec(), rm = innRoom(G.inside);
  k.moving = v.x !== 0 || v.y !== 0;
  if (k.moving){
    if (Math.abs(v.x) > Math.abs(v.y) + .01) k.dir = v.x > 0 ? 'right' : 'left'; else k.dir = v.y > 0 ? 'down' : 'up';
    k.anim += dt * 8;
  } else k.anim = 0;
  const sp = 110, nx = k.x + v.x * sp * dt, ny = k.y + v.y * sp * dt;
  if (!roomBlocked(rm, nx, k.y)) k.x = nx;
  if (!roomBlocked(rm, k.x, ny)) k.y = ny;
  if (k.y > ROOM_DOOR.y - 2 && Math.abs(k.x - ROOM_DOOR.x) < 16 && v.y > 0){ leaveInn(); return; }
  k.y = Math.min(k.y, ROOM_DOOR.y + 2);
  if (k.hp < ST.hp) k.hp = Math.min(ST.hp, k.hp + ST.hp * .15 * dt);
  for (const id in G.cd) if (G.cd[id] > 0) G.cd[id] = Math.max(0, G.cd[id] - dt);
  G.combatT = 99; G.buffT = 0;
  if (rm.church) chUpdate(dt);
  // Funken aus dem Herd
  if (rm.fire && Math.random() < dt * 12) G.parts.push({ x: rm.fire.x + rand(-26, 26), y: rm.fire.y - 6, vx: rand(-6, 6), vy: rand(-46, -22), life: rand(.4, .9), c: Math.random() < .5 ? '#e0782a' : '#ffd36a', g: -8, glow: true });
}
function renderInn(){
  const inn = G.inside, rm = innRoom(inn), k = G.knight, cam = roomCam(k);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (RW < W || RH < H){ ctx.fillStyle = '#0b0908'; ctx.fillRect(0, 0, W, H); }
  ctx.setTransform(1, 0, 0, 1, -cam.x + Math.max(0, (W - RW) >> 1), -cam.y + Math.max(0, (H - RH) >> 1));
  ctx.drawImage(rm.bg, 0, 0);
  if (rm.fire) for (let i = 0; i < 6; i++) flame(rm.fire.x - 30 + i * 12, rm.fire.y, G.t + i * .7, i > 0 && i < 5);
  const actors = [{ x: k.x, y: k.y }].concat(rm.npcs, [...PEERS.values()].filter(p => p.in === inn.id));
  for (const a of actors) shadow(a.x, a.y - 1, 16, .35);
  const list = rm.items.map(it => ({ y: it.y, d: () => ctx.drawImage(it.img, Math.round(it.x - it.ax), Math.round(it.y - it.ay)) }));
  for (const n of rm.npcs) list.push({ y: n.y + .15, d: () => drawNpc(n) });
  for (const p of PEERS.values()) if (p.in === inn.id) list.push({ y: p.y + .18, d: () => drawKnightAt(p, knightSet(p.f, p.lk), false, 1) });
  list.push({ y: k.y + .2, d: drawKnight });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) it.d();
  for (const c of rm.candles){ const f = (G.t * 9 + c.x) | 0; ctx.fillStyle = '#ffd36a'; ctx.fillRect(c.x, c.y - 2 - (f % 3 === 0 ? 1 : 0), 1, 2); ctx.fillStyle = '#fff3c0'; ctx.fillRect(c.x, c.y - 1, 1, 1); }
  if (rm.church) chRoomFx(rm);
  for (const p of G.parts){ ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, 1, 1); }
  ctx.drawImage(rm.light, 0, 0);
  // Noten steigen vom Spielmann auf
  const sm = rm.npcs.find(n => n.id === 'spielmann');
  if (sm && !RM) for (let q = 0; q < 3; q++){
    const ph = (G.t * .55 + q / 3) % 1, nx = Math.round(sm.x + 12 + Math.sin(G.t * 1.7 + q * 2) * 6 + ph * 8), ny = Math.round(sm.y - 52 - ph * 34);
    ctx.globalAlpha = Math.min(1, (1 - ph) * 1.6); ctx.fillStyle = G.song && G.song.t > G.t ? '#ffd541' : '#e0c890';
    ctx.fillRect(nx, ny + 4, 3, 2); ctx.fillRect(nx + 2, ny, 1, 5); ctx.fillRect(nx + 3, ny, 2, 1);
  }
  ctx.globalAlpha = 1;
  for (const n of rm.npcs) if (!n.noPlate || G.near === n) drawNpcPlate(n);
  if (rm.church) chRoomTop(rm);
  for (const p of PEERS.values()) if (p.in === inn.id){
    drawText(p.nm + ' ' + p.lv, p.x, p.y - KS.ay - 15, '#9cc8ff');
    if (p.say && nowS() < p.sayT) drawBubble(p.x, p.y - KS.ay - 17, p.say);
  }
  if (G.say && nowS() < G.sayT) drawBubble(k.x, k.y - KS.ay - 4, G.say);
  if (G.nearExit) drawText(touchUI() ? 'Hinausgehen' : 'Nach unten: hinaus', ROOM_DOOR.x, ROOM_DOOR.y - 2, '#ffffff');
  for (const f of G.floats){ ctx.globalAlpha = clamp(f.life / f.max * 2.5, 0, 1); drawText(f.txt, f.x, f.y, f.c, 'c', f.s); }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
/* Stärkung durch Speis und Trank: läuft in Spielzeit ab */
function tickBuffs(dt){
  chTick(dt); hbTick(dt);
  if (HERO.mood){ HERO.mood.t -= dt; if (HERO.mood.t <= 0){ HERO.mood = null; renderBuffs(); logLine('Die gute Laune ist verflogen.', '#d8c69c'); } else if (Math.floor(HERO.mood.t / 60) !== Math.floor((HERO.mood.t + dt) / 60)) renderBuffs(); }
  for (const key of ['food', 'drink']){
    const b = HERO[key]; if (!b) continue;
    b.t -= dt;
    if (b.t <= 0){
      HERO[key] = null; refreshStats(); updateHud(); renderBuffs(); markDirty();
      logLine(key === 'food' ? 'Die Mahlzeit ist verdaut.' : 'Der Trunk ist verflogen.', '#d8c69c');
    } else if (Math.floor(b.t / 60) !== Math.floor((b.t + dt) / 60)) renderBuffs();
  }
}
function eatFare(f){
  const price = farePrice(f);
  if (HERO.gold < price) return;
  HERO.gold -= price;
  HERO[f.kind === 'speise' ? 'food' : 'drink'] = { id: f.id, t: FARE_MIN * 60 };
  refreshStats(); G.knight.hp = Math.min(ST.hp, G.knight.hp + ST.hp * .3);
  if (f.kind === 'speise') Sound.eat(); else Sound.drink();
  floatText(G.knight.x, G.knight.y - KS.ay - 4, fxText(f.fx).split(',')[0], '#ffd98a', 1, 1.4);
  logLine((f.kind === 'speise' ? 'Ihr esst ' : 'Ihr trinkt ') + f.n + ': ' + fxText(f.fx) + '.', '#ffd98a');
  updateHud(); renderBuffs(); markDirty(true);
}
