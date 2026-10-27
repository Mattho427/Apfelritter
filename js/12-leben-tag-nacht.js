"use strict";
/* Der Apfelritter, Teil 12 von 27: Leben im Königsland, Tag und Nacht, Wetter.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Leben im Königsland: Tiere, Leute, Vögel ============
   Lebensorte aus der Welt; nahe beim Ritter entstehen ihre Bewohner, weit weg verschwinden sie wieder.
   Nichts davon kämpft: Tiere fliehen vor Ritter und Kampf, Leute gehen ihren Geschäften nach und grüßen. */
const LIFE_KIND = {
  // Tiere: c Verhalten, spd Schritt, run Flucht, fear Fluchtabstand, snd Laut
  kuh:        { c:'herd', spd: 9,  run: 34,  fear: 34,  snd:'moo',   v: 2 },
  schaf:      { c:'herd', spd: 11, run: 46,  fear: 56,  snd:'baa',   v: 2 },
  ziege:      { c:'herd', spd: 12, run: 52,  fear: 50,  snd:'bleat', v: 2 },
  schwein:    { c:'herd', spd: 12, run: 44,  fear: 44,  snd:'oink',  v: 2 },
  huhn:       { c:'herd', spd: 16, run: 70,  fear: 44,  snd:'cluck', v: 3, hop: true },
  hahn:       { c:'herd', spd: 16, run: 70,  fear: 44,  snd:'crow',  v: 1, hop: true },
  gans:       { c:'herd', spd: 13, run: 50,  fear: 36,  snd:'honk',  v: 1 },
  pferd:      { c:'herd', spd: 10, run: 40,  fear: 30,  snd:'neigh', v: 2 },
  ente:       { c:'swim', spd: 9,  run: 30,  fear: 64,  snd:'quack', v: 2 },
  reh:        { c:'wild', spd: 16, run: 150, fear: 150, v: 1 },
  hirsch:     { c:'wild', spd: 14, run: 140, fear: 170, v: 1 },
  hase:       { c:'wild', spd: 18, run: 150, fear: 110, v: 1, hop: true },
  fuchs:      { c:'wild', spd: 24, run: 130, fear: 140, v: 1 },
  wildschwein:{ c:'wild', spd: 14, run: 110, fear: 110, snd:'oink', v: 1 },
  hund:       { c:'pet',  spd: 30, run: 80,  fear: 0,   snd:'bark',  v: 3 },
  katze:      { c:'pet',  spd: 18, run: 90,  fear: 54,  snd:'meow',  v: 2 },
  taube:      { c:'bird', spd: 10, run: 0,   fear: 70,  snd:'coo',   v: 1 },
  spatz:      { c:'bird', spd: 12, run: 0,   fear: 56,  snd:'chirp', v: 1 },
  frosch:     { c:'frog', spd: 0,  run: 0,   fear: 52,  snd:'croak', v: 1 }
};
/* Leute: Sprüche je Stand */
const VK_SAY = {
  buerger: ['Gott zum Gruße, Herr Ritter.', 'Der Rat zahlt gut für jedes erschlagene Untier.', 'Habt Ihr vom Lindwurm im Moor gehört?', 'Der Zoll an der Steinbrücke ist wieder gestiegen.', 'Man sagt, ein Goldmann sei durch die Stadt gereist.'],
  buergerin: ['Grüß Gott, edler Herr!', 'Kommt Ihr auch zum Markt?', 'Die Eier sind teuer, seit die Plünderer die Höfe heimsuchen.', 'Meine Schwester hat Irrlichter im Moor gesehen.'],
  magd: ['Grüß Gott, Herr Ritter!', 'Ich muss zum Brunnen, die Herrin wartet.', 'Seit der Tod umgeht, legen die Hühner nicht.', 'Habt Ihr Hunger? Die Wirtin kocht heute Kraut.'],
  baeuerin: ['Gott zum Gruße!', 'Die Gänse haben wieder den Kohl gefressen.', 'Schaut nach den Feldern, wenn Ihr vorbeireitet, Herr.'],
  bauer: ['Das Korn steht gut dieses Jahr.', 'Hütet Euch vor dem Finsterwald, Herr.', 'Der Zehnt frisst uns die halbe Ernte.', 'Nachts heulen drüben die Werwölfe.', 'Die Landsknechte im Lager nehmen, was sie wollen.'],
  knecht: ['Schwer, so ein Sack Mehl.', 'Der Müller zahlt schlecht, aber er zahlt.', 'Gott zum Gruße.'],
  moench: ['Pax vobiscum.', 'Betet für die armen Seelen auf dem Friedhof.', 'Ora et labora, mein Sohn.', 'Der Abt hat Bücher aus der Druckerei in Altmünster kommen lassen. Gedruckt!'],
  wache: ['Halt! … ach, Ihr seid es, Herr Ritter.', 'Alles ruhig am Tor.', 'Plünderer auf der Königsstraße. Seid wachsam.', 'Ohne Passierschein kommt hier keiner rein. Ihr natürlich schon.'],
  pilger: ['Ich ziehe zum Grab des Apostels, weit im Westen.', 'Der Weg zur Heiligen Stadt ist weit.', 'Gott schütze Euch auf Euren Wegen.', 'Habt Ihr ein Stück Brot für einen Pilger?'],
  bettler: ['Ein Almosen, edler Herr?', 'Gott vergelt’s.', 'Ich war Landsknecht, damals, im großen Krieg.'],
  hirte: ['Meine Schafe sind mein ganzer Reichtum.', 'Der Fuchs hat mir zwei Lämmer gerissen.', 'Gott zum Gruße, Herr.'],
  haendler: ['Kauft, Leute, kauft!', 'Gute Ware, ehrlicher Preis!']
};
const VK_WARE = [['Frisches Brot! Brezeln!', 'Brot vom Bäcker, noch warm!'], ['Feines Tuch aus dem Norden!', 'Leinen und Barchent aus Goldbrunn!'], ['Töpfe und Krüge, gut gebrannt!', 'Krüge für Bier und Wein!'],
  ['Kohl und Rüben, frisch vom Feld!', 'Zwiebeln, Rüben, Kraut!'], ['Fisch aus dem Fluss, heute gefangen!', 'Hecht und Karpfen!'], ['Äpfel aus den Obstgärten!', 'Süße Äpfel, saure Äpfel!']];
VK_TYPES.spielmann = { o: { robe:'short', hat:'barett', parti:true, lute:true, belt:true },
  pals: [['#6a1414', '#9a2420', '#c03a2c', '#de5a44', '#7a5a10', '#a88220', '#d2a83a', '#ecca5c'], ['#1c2a5a', '#2a3e7e', '#3e56a0', '#5a74bc', '#6a1414', '#9a2420', '#c03a2c', '#de5a44']] };
VK_SAY.spielmann = ['Tanzt, Leute, tanzt!', 'Ein Lied für den Herrn Ritter!', 'Hei, wie das klingt!'];
VK_TYPES.hirte = { o: { robe:'short', hat:'filz', belt:true, staff:true, beard:true, hair:['h', 'j'] },
  pals: [['#4a3e2a', '#625238', '#7c6a4a', '#96845e', '#3a3028', '#4e4236', '#645646', '#7a6c58']] };
const LIFE_WATER = (x, y, d) => wo_wsd(x / WS, y / WS) < -(d || 3);
const LIFE_FREE = (x, y) => !blocked(x, y) && wo_wsd(x / WS, y / WS) > 2;
/* Lebensorte (Spielkoordinaten): k Art, n [min, max], r Streifradius, p Person, t Leutearten */
const LIFE_SPOTS = (() => {
  const S = [], R = rng(1519), P = (x, y) => gPt({ x, y });
  const add = o => { if (o.p || o.k){ o.ents = []; o.act = false; o.cool = 0; S.push(o); } };
  const near = (x, y) => gNear(x, y);
  const ware = img => { const a = wp_cacheOf('marktstand') || []; for (let i = 0; i < a.length; i++) if (a[i] && a[i].img === img) return i; return 0; };
  // Höfe und Häuser: Hühner, Katzen; Marktstände: Händler
  for (const p of GPROPS){
    const z = gZone(p.x, p.y).id;
    if (p.kind === 'fachwerkhaus' && z !== 'dorf'){
      add({ k: R() < .8 ? 'huhn' : 'gans', x: p.x + (R() - .5) * 120, y: p.y + 70, r: 90, n: [3, 6], mix: R() < .5 ? 'hahn' : null });
      if (R() < .35) add({ k: 'katze', x: p.x + 60, y: p.y + 40, r: 70, n: [1, 1] });
      if (R() < .25) add({ k: 'spatz', x: p.x - 40, y: p.y + 50, r: 40, n: [3, 5] });
    }
    if (p.kind === 'stadthaus' && R() < .22) add({ k: R() < .5 ? 'katze' : 'huhn', x: p.x, y: p.y + 60, r: 60, n: [1, 3] });
    if (p.kind === 'marktstand') add({ p: 'stand', t: ['haendler'], x: p.x + 4, y: p.y - 14, base: p.y, dir: 'down', ware: p.v != null ? p.v : ware(p.img), n: [1, 1] });
    if (p.kind === 'muehle') add({ p: 'walk', t: ['knecht'], x: p.x - 80, y: p.y + 60, r: 80, n: [1, 1] });
    if (p.kind === 'kirche' && z === 'stadt') add({ k: 'taube', x: p.x + 40, y: p.y + 80, r: 50, n: [4, 6] });
  }
  // Königsstadt: Bürger auf Gassen und Markt, Wachen an den Toren, Schweine, Hunde, Tauben
  const C = wo_CITY;
  for (const [x, y, r, n] of [[2980, 2310, 200, 4], [2966, 2160, 160, 2], [2966, 2480, 160, 2], [2720, 2366, 180, 2], [3240, 2366, 180, 2], [2780, 2136, 160, 1], [3160, 2136, 160, 1]])
    add({ p: 'walk', t: ['buerger', 'buergerin', 'magd', 'buergerin', 'knecht', 'moench', 'bettler'], ...P(x, y), r: r * WS, n: [n, n + 1] });
  for (const [x, y] of [[C.gx - 36, C.y0 + 30], [C.gx + 36, C.y0 + 30], [C.gx - 36, C.y1 + 30], [C.gx + 36, C.y1 + 30]]) add({ p: 'stand', t: ['wache'], ...near(x, y), dir: 'down', n: [1, 1] });
  add({ k: 'schwein', ...P(2790, 2470), r: 160, n: [2, 3] }); add({ k: 'schwein', ...P(3200, 2440), r: 140, n: [1, 2] });
  add({ k: 'taube', ...P(2990, 2330), r: 120, n: [5, 8] }); add({ k: 'taube', ...P(2930, 2180), r: 80, n: [3, 5] });
  add({ k: 'hund', ...P(2900, 2420), r: 260, n: [1, 1] }); add({ k: 'hund', ...P(3100, 2180), r: 220, n: [1, 1] });
  add({ k: 'katze', ...P(2700, 2200), r: 100, n: [1, 1] }); add({ k: 'katze', ...P(3280, 2500), r: 100, n: [1, 1] });
  // Königsburg: Gesinde, Wachen, Hühner, Hund, Pferde beim Stallmeister
  const B = wo_CAST;
  add({ p: 'walk', t: ['magd', 'knecht', 'magd', 'buerger', 'moench'], ...P(1910, 520), r: 260, n: [3, 4] });
  for (const [x, y] of [[B.gx - 34, B.y1 + 26], [B.gx + 34, B.y1 + 26], [B.gx - 30, B.y1 - 40], [B.gx + 30, B.y1 - 40]]) add({ p: 'stand', t: ['wache'], ...near(x, y), dir: 'down', n: [1, 1] });
  add({ k: 'huhn', ...P(1760, 640), r: 90, n: [3, 5], mix: 'hahn' }); add({ k: 'hund', ...P(1950, 560), r: 200, n: [1, 1] });
  add({ k: 'taube', ...P(1990, 470), r: 80, n: [4, 6] });
  add({ k: 'pferd', ...P(1720, 556), r: 70, n: [2, 2] });
  // Dorf Lindach: Bauern, Mägde, Vieh
  const H = wo_HAMLET;
  add({ p: 'walk', t: ['bauer', 'baeuerin', 'magd', 'knecht', 'baeuerin', 'bauer'], ...P(H.x, H.y + 10), r: 300, n: [4, 5] });
  add({ p: 'work', t: ['bauer'], ...P(2380, 372), r: 70, n: [1, 1] }); add({ p: 'work', t: ['baeuerin', 'bauer'], ...P(2520, 372), r: 70, n: [1, 1] });
  add({ k: 'kuh', ...P(2622, 610), r: 110, n: [3, 4] }); add({ k: 'schwein', ...P(2350, 650), r: 90, n: [2, 3] });
  add({ k: 'gans', ...P(H.x + 40, H.y + 34), r: 90, n: [4, 5] }); add({ k: 'ziege', ...P(2540, 430), r: 80, n: [2, 2] });
  add({ k: 'hund', ...P(H.x - 20, H.y + 30), r: 220, n: [1, 1] });
  add({ p: 'walk', t: ['hirte'], ...P(2440, 280), r: 120, n: [1, 1] }); add({ k: 'schaf', ...P(2440, 280), r: 140, n: [6, 8] });
  // Bergstadt Silberberg: Bürger, Knappen, Wachen; Knappen an den Göpeln; Wild im Schwarztann
  const A = wo_ANNA;
  for (const [x, y, r, n] of [[2920, A.gy + 50, 180, 3], [2900, A.gy - 120, 120, 1], [2900, A.gy + 160, 120, 1], [2760, A.gy, 140, 1], [3060, A.gy, 140, 1]])
    add({ p: 'walk', t: ['buerger', 'buergerin', 'knappe', 'magd', 'knappe', 'knecht'], ...P(x, y), r: r * WS, n: [n, n + 1] });
  for (const [x, y] of [[A.gx - 36, A.y0 + 30], [A.gx + 36, A.y0 + 30], [A.gx - 36, A.y1 + 30], [A.gx + 36, A.y1 + 30]]) add({ p: 'stand', t: ['wache'], ...near(x, y), dir: 'down', n: [1, 1] });
  add({ k: 'taube', ...P(2966, A.gy + 50), r: 100, n: [4, 6] }); add({ k: 'hund', ...P(2860, A.gy + 60), r: 200, n: [1, 1] }); add({ k: 'katze', ...P(3100, A.gy - 60), r: 90, n: [1, 1] });
  add({ k: 'pferd', ...P(2740, 3430), r: 60, n: [2, 2] });
  for (const g of wo_BERG.goepel || []) add({ p: 'work', t: ['knappe'], ...P(g.x + 30, g.y + 40), r: 60, n: [1, 2] });
  for (const [cx, cy] of wo_SWCLEAR) if (R() < .7) add({ k: R() < .35 ? 'hirsch' : 'reh', ...P(cx, cy), r: 200, n: [1, 3] });
  // Herbst: Apfelernte im Obstgarten
  const orchard = GPROPS.filter(p => p.kind === 'apfelbaum' && gZone(p.x, p.y).id === 'obstgarten');
  for (let i = 0; i < Math.min(6, orchard.length); i++){ const p = orchard[(i * 7919 + 13) % orchard.length]; add({ p: 'work', t: ['bauer', 'baeuerin', 'magd', 'knecht'], x: p.x + 22, y: p.y + 14, r: 50, n: [1, 1], sea: [2] }); }
  // Obsthof, Mühle, Gasthäuser, Kloster
  add({ k: 'kuh', ...P(2230, 1200), r: 90, n: [2, 2] }); add({ p: 'walk', t: ['bauer', 'magd'], ...P(2200, 1180), r: 110, n: [1, 2] });
  add({ k: 'ente', ...P(2560, 1156), r: 90, n: [3, 5] }); add({ k: 'ente', ...P(2534, 1450), r: 60, n: [2, 3] });
  for (const inn of INNS) add({ k: 'hund', x: inn.dx + 60, y: inn.dy + 40, r: 120, n: [1, 1] });
  add({ p: 'walk', t: ['moench'], ...P(1360, 2870), r: 160, n: [3, 3] }); add({ k: 'gans', ...P(1420, 2920), r: 80, n: [3, 4] });
  add({ k: 'huhn', ...P(1300, 2900), r: 80, n: [3, 4], mix: 'hahn' });
  // Schäfer in der Flussaue und unter der Burg
  add({ p: 'walk', t: ['hirte'], ...P(1480, 760), r: 140, n: [1, 1] }); add({ k: 'schaf', ...P(1480, 760), r: 170, n: [6, 9] });
  add({ p: 'walk', t: ['hirte'], ...P(2180, 1700), r: 140, n: [1, 1] }); add({ k: 'schaf', ...P(2180, 1700), r: 160, n: [5, 7] });
  // Wasser: Enten an Teichen und am Fluss, Frösche im Moor
  for (const [x, y, rx, ry, t] of wo_PONDS){
    if (t === 2) add({ k: 'ente', ...P(x, y), r: Math.min(rx, ry) * WS, n: [2, 4] });
    else if (R() < .6) add({ k: 'frosch', ...P(x + rx * .9, y), r: 30, n: [2, 3] });
  }
  for (let i = 0; i < wo_RIVER.length; i += 40){ const [x, y] = wo_RIVER[i]; if (R() < .6) add({ k: 'ente', ...P(x, y), r: 90, n: [2, 3] }); }
  // Wild: Rehe, Hirsche, Hasen, Füchse, Wildschweine
  const wildAt = (zones, k, n, cnt, r) => {
    for (let t = 0; t < cnt * 40 && cnt > 0; t++){
      const x = 60 + R() * (WW0 - 120), y = 60 + R() * (WH - 120);
      if (!zones.includes(ZONES[wo_zid(x, y)].id) || !wo_ok(x | 0, y | 0)) continue;
      add({ k, ...P(x, y), r: r || 160, n }); cnt--;
    }
  };
  for (const [cx, cy] of wo_CLEAR) add({ k: R() < .3 ? 'hirsch' : 'reh', ...P(cx, cy), r: 200, n: [1, 3] });
  wildAt(['wald'], 'reh', [1, 3], 10); wildAt(['wald'], 'wildschwein', [1, 3], 6); wildAt(['wald', 'obstgarten'], 'fuchs', [1, 1], 7);
  wildAt(['obstgarten', 'fluss', 'burg', 'weiler', 'lager', 'galgen'], 'hase', [1, 2], 18, 140); wildAt(['burg', 'obstgarten'], 'reh', [1, 2], 4);
  // Turnierwiese: Zuschauer auf den drei Stufen der Tribüne (beim Tjost voll besetzt), Knappen bei den Zelten
  const TB = GPROPS.find(p => p.kind === 'tribuene');
  if (TB){
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - (row % 2); i++)
      add({ p: 'stand', t: ['buerger', 'buergerin', 'magd', 'knecht', 'buergerin', 'moench', 'bauer', 'baeuerin'], x: Math.round(TB.x - 125 + i * 50 + (row % 2) * 25 + (R() - .5) * 10), y: TB.y - 24 * (row + 1) + 3,
        dir: 'down', n: [0, R() < .3 ? 1 : 0], crowd: true, sy: TB.y + 1 - row * .1 });
    for (const dx of [-206, 206]) add({ p: 'stand', t: ['knecht'], ...gNear((TB.x + dx) / WS, (TB.y + 34) / WS), dir: dx < 0 ? 'right' : 'left', n: [1, 1] });
  }
  // Ostlande (Version 26): Bürger, Studenten und Mönche in Schwanstedt, Handwerker in Burgfelden, Kaufleute in Goldbrunn, Wachen an den Toren
  for (const [C, types, spots] of [
    [wo_WIT, ['buerger', 'buergerin', 'moench', 'buerger', 'magd', 'knecht'], [[7950, 560, 200, 3], [7700, 520, 160, 2], [8200, 520, 160, 2], [7950, 380, 120, 1]]],
    [wo_NUE, ['buerger', 'buergerin', 'knecht', 'magd', 'buerger', 'moench', 'bettler'], [[7800, 2290, 220, 4], [7740, 2500, 140, 2], [7500, 2600, 160, 2], [8000, 2600, 160, 2], [7980, 2180, 140, 1], [7500, 2230, 140, 1]]],
    [wo_AUG, ['buerger', 'buergerin', 'buerger', 'magd', 'knecht', 'bettler'], [[7430, 3790, 200, 3], [7600, 3898, 100, 2], [7250, 3740, 140, 1], [7430, 3620, 120, 1]]]]){
    for (const [x, y, r, n] of spots) add({ p: 'walk', t: types, ...P(x, y), r: r * WS, n: [n, n + 1] });
    for (const [x, y] of [[C.gx - 36, C.y0 + 30], [C.gx + 36, C.y0 + 30], [C.gx - 36, C.y1 + 30], [C.gx + 36, C.y1 + 30]]) add({ p: 'stand', t: ['wache'], ...near(x, y), dir: 'down', n: [1, 1] });
    add({ k: 'taube', ...P(C.gx + 40, C.gy + 50), r: 100, n: [4, 6] }); add({ k: 'hund', ...P(C.gx - 80, C.gy + 40), r: 200, n: [1, 1] }); add({ k: 'katze', ...P(C.gx + 120, C.gy - 50), r: 90, n: [1, 1] });
  }
  add({ k: 'schwein', ...P(7600, 2650), r: 120, n: [2, 3] }); add({ k: 'huhn', ...P(7560, 3920), r: 60, n: [3, 4], mix: 'hahn' });
  // Schafe in der Heide, Hirsche im Königsforst, Wildschweine (Jagd) und Hasen auf dem Land
  if (wo_OST.schaeferei){ const h = wo_OST.schaeferei; add({ p: 'walk', t: ['hirte'], ...P(h.x + 60, h.y + 120), r: 160, n: [1, 1] }); add({ k: 'schaf', ...P(h.x + 60, h.y + 140), r: 200, n: [8, 11] }); }
  for (const [cx, cy] of wo_RWCLEAR) add({ k: R() < .35 ? 'hirsch' : 'reh', ...P(cx, cy), r: 200, n: [1, 3] });
  const wildE = (zones, k, n, cnt, r) => {
    for (let t = 0; t < cnt * 40 && cnt > 0; t++){
      const x = WW0 + 60 + R() * (WW - WW0 - 120), y = 60 + R() * (WH - 120);
      if (!zones.includes(ZONES[wo_zid(x, y)].id) || !wo_ok(x | 0, y | 0)) continue;
      add({ k, ...P(x, y), r: r || 160, n }); cnt--;
    }
  };
  wildE(['heide', 'reichswald'], 'hase', [1, 2], 14, 140); wildE(['reichswald'], 'wildschwein', [1, 3], 6); wildE(['heide', 'reichswald'], 'fuchs', [1, 1], 6); wildE(['heide', 'lechfeld'], 'reh', [1, 2], 6);
  for (const [x, y] of [[7400, 760], [8300, 860], [7750, 3070], [8400, 3080]]) add({ k: 'ente', ...P(x, y), r: 90, n: [2, 3] });
  return S;
})();
function lifeReset(){ for (const s of LIFE_SPOTS){ s.ents = []; s.act = false; s.cool = 0; } }

/* ---------- Bewohner erzeugen ---------- */
const SEA_WINTER_OFF = { frosch: 1, ente: 1, kuh: 1, schaf: 1, ziege: 1, pferd: 1 };
function lifeMake(s, full){
  let n = full ? Math.max(1, s.n[1]) : s.n[0] + (Math.random() * (s.n[1] - s.n[0] + 1) | 0);
  // nachts sind die Händler daheim, auf den Gassen wenige, auf den Feldern niemand
  if (s.sea && !s.sea.includes(SEA.cur)) n = 0;
  if (s.fest && (!G || !G.fest || G.fest.id !== s.fest)) n = 0;
  if (SEA.cur === 3 && ((s.k && SEA_WINTER_OFF[s.k]) || s.p === 'work' || (s.p && s.t[0] === 'hirte'))) n = 0;   // im Winter: Vieh im Stall, Frösche und Enten fort
  if (!full && !s.fest && isNight() && s.p && s.t[0] !== 'wache'){ if (s.p === 'walk' && s.t[0] !== 'hirte') n = Math.random() < .3 ? 1 : 0; else if (s.p !== 'road') n = 0; }
  for (let i = 0; i < n; i++){
    if (s.p){
      const type = s.t[(Math.random() * s.t.length) | 0], art = vkPerson(type, (Math.random() * 3) | 0);
      let x = s.x, y = s.y;
      if (s.p !== 'stand' && s.p !== 'dance' && s.p !== 'parade'){ const q = gRandWalk(s.x, s.y, 0, s.r); if (!q) continue; x = q.x; y = q.y; }
      s.ents.push({ person: true, type, art, x, y, hx: s.x, hy: s.y, r: s.r || 0, mode: s.p, st: 'idle', t: rand(.5, 4), dir: s.dir || 'down', f: 0, anim: Math.random() * 4,
        spd: rand(24, 34), sayT: 0, say: null, sayUntil: 0, spot: s, ware: s.ware });
      // Händler hinter dem Ladentisch: nach dem Stand zeichnen, unterhalb der Tischplatte abschneiden
      if (s.base){ const e = s.ents[s.ents.length - 1]; e.sy = s.base + 1; e.clip = s.base - 29; }
      if (s.p === 'dance' || s.p === 'parade') festPlace(s, s.ents[s.ents.length - 1], i, n);
      if (s.sy) s.ents[s.ents.length - 1].sy = s.sy;
      continue;
    }
    const k = i === 0 && s.mix ? s.mix : s.k, K = LIFE_KIND[k];
    let x = s.x, y = s.y, ok = false;
    for (let a = 0; a < 12 && !ok; a++){
      const ang = Math.random() * 6.283, rr = Math.random() * (s.r || 40);
      x = s.x + Math.cos(ang) * rr; y = s.y + Math.sin(ang) * rr * .7;
      ok = K.c === 'swim' ? LIFE_WATER(x, y, 4) : LIFE_FREE(x, y);
    }
    if (!ok) continue;
    const art = k === 'pferd' ? lifeHorse(i) : trArt(k, (Math.random() * K.v) | 0);
    s.ents.push({ k, K, art, x, y, hx: s.x, hy: s.y, r: s.r || 40, st: 'idle', t: rand(.3, 4), dir: Math.random() < .5 ? 1 : -1, anim: Math.random() * 4, z: 0, vz: 0, spot: s });
  }
}
/* grasende Pferde beim Stallmeister: Seitenbilder ohne Reiter */
function lifeHorse(i){
  const set = horseSet(i ? 'zelter' : 'klepper', 'reich');
  const r = set.right.map(f => f.under), l = set.left.map(f => f.under);
  return { walk: r.slice(0, 4), stand: r[4], graze: r[4], run: [r[0], r[2]], l: { walk: l.slice(0, 4), stand: l[4], graze: l[4], run: [l[0], l[2]] }, ax: set.right[0].ax + 1, ay: HO_GY + 1, w: set.right[0].w, horse: true };
}

/* ---------- Aktualisieren ---------- */
function lifeThreat(e, K){
  const k = G.knight;
  if (G.mode === 'play' || G.mode === 'dying'){
    const d = Math.hypot(k.x - e.x, k.y - e.y), f = K.fear * (k.moving ? 1 : .6) * (k.atkT > 0 ? 1.7 : 1) * (k.ride ? 1.4 : 1);
    if (f > 0 && d < f) return k;
  }
  for (const m of G.mons) if (m.mode === 'fight' && Math.abs(m.x - e.x) < 120 && Math.abs(m.y - e.y) < 90) return m;
  return null;
}
function lifeMove(e, vx, vy, dt, swim){
  const nx = e.x + vx * dt, ny = e.y + vy * dt;
  const ok = (x, y) => swim ? LIFE_WATER(x, y, 2) : !blocked(x, y) && wo_wsd(x / WS, y / WS) > 1;
  if (ok(nx, ny)){ e.x = nx; e.y = ny; return true; }
  if (ok(nx, e.y)){ e.x = nx; return true; }
  if (ok(e.x, ny)){ e.y = ny; return true; }
  return false;
}
function lifeAnimal(e, dt){
  if (e.st === 'charge' || e.st === 'rest') return huntBoar(e, dt);
  const K = e.K, s = e.spot, th = K.c !== 'pet' || K.fear ? lifeThreat(e, K) : null;
  if (e.st === 'fly'){                                   // Vogel fliegt auf und davon
    e.z += e.vz * dt; e.vz = Math.min(90, e.vz + 30 * dt); e.x += e.vx * dt; e.y += e.vy * dt; e.anim += dt * 12;
    if (e.z > 260) e.gone = true;
    return;
  }
  if (e.z > 0 || e.vz){ e.vz -= 420 * dt; e.z = Math.max(0, e.z + e.vz * dt); if (e.z === 0) e.vz = 0; }
  if (th && e.st !== 'flee'){
    if (K.c === 'bird'){ e.st = 'fly'; e.vz = 50; const a = Math.atan2(e.y - th.y, e.x - th.x) + rand(-.6, .6); e.vx = Math.cos(a) * 90; e.vy = Math.sin(a) * 60; e.dir = e.vx > 0 ? 1 : -1; s.cool = 30; if (Math.random() < .4) lifeSound('flap', e); return; }
    if (K.c === 'frog'){ e.st = 'flee'; e.t = .5; e.vz = 120; const a = Math.atan2(e.y - th.y, e.x - th.x); e.fx = Math.cos(a); e.fy = Math.sin(a); s.cool = 40; return; }
    e.st = 'flee'; e.t = rand(.9, 1.6);
    const a = Math.atan2(e.y - th.y, e.x - th.x) + rand(-.5, .5); e.fx = Math.cos(a); e.fy = Math.sin(a);
    if (K.hop && Math.random() < .6){ e.vz = 90; burst(e.x, e.y - 6, ['#f0eee6', '#c8a070'], 3, 30); }
    if (K.snd && Math.random() < .35) lifeSound(K.snd, e);
  }
  if (e.st === 'flee'){
    e.t -= dt;
    if (K.c === 'frog'){ e.x += e.fx * 60 * dt; e.y += e.fy * 40 * dt; if (e.t <= 0){ e.gone = true; burst(e.x, e.y, ['#9ab0a8', '#d8e2dc'], 4, 30); } return; }
    let fx = e.fx, fy = e.fy;
    if (K.c !== 'wild'){ const hd = Math.hypot(e.hx - e.x, e.hy - e.y); if (hd > e.r * 1.6){ fx = (e.hx - e.x) / hd; fy = (e.hy - e.y) / hd; } }
    // gehetztes Wild wird müde, verwundetes langsamer
    const tire = K.c === 'wild' ? ((e.ft = (e.ft || 0) + dt) > 3 ? .62 : 1) * (e.hp < e.max ? .85 : 1) : 1;
    if (!lifeMove(e, fx * K.run * tire, fy * K.run * .8 * tire, dt, K.c === 'swim')){ const t = e.fx; e.fx = -e.fy; e.fy = t; }
    e.dir = fx > 0 ? 1 : -1; e.anim += dt * (K.c === 'wild' ? 9 : 12);
    if (K.c === 'wild' && Math.hypot(G.knight.x - e.x, G.knight.y - e.y) > 520){ e.gone = true; s.cool = 60; }
    if (e.t <= 0 && !th) e.st = 'idle', e.t = rand(1, 3);
    return;
  }
  // Hund: läuft gern ein Stück neben dem Ritter her
  if (e.k === 'hund' && (G.mode === 'play') && !e.follow && Math.random() < dt * .03 && Math.hypot(G.knight.x - e.x, G.knight.y - e.y) < 160){ e.follow = rand(4, 8); lifeSound('bark', e); }
  if (e.follow > 0){
    e.follow -= dt; const k = G.knight, dx = k.x - 26 * (k.dir === 'left' ? -1 : 1) - e.x, dy = k.y + 6 - e.y, d = Math.hypot(dx, dy);
    if (d > 20 && Math.hypot(e.hx - e.x, e.hy - e.y) < 700){ lifeMove(e, dx / d * Math.min(110, d * 2), dy / d * Math.min(110, d * 2), dt); e.dir = dx > 0 ? 1 : -1; e.anim += dt * 10; e.st = 'walk'; }
    else { e.st = 'idle'; e.anim = 0; }
    if (e.follow <= 0) e.follow = -rand(20, 40);
    return;
  }
  if (e.follow < 0) e.follow += dt;
  if (e.st === 'walk'){
    const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
    if (d < 3 || !lifeMove(e, dx / d * K.spd, dy / d * K.spd, dt, K.c === 'swim')){ e.st = 'idle'; e.t = rand(1.5, 6); return; }
    e.dir = dx > 0 ? 1 : -1; e.anim += dt * (K.c === 'bird' ? 10 : 7);
    if (K.c === 'bird' && Math.random() < dt * 3) e.vz = 30;
    return;
  }
  // ruhen, grasen, picken; dann ein Stück weiter
  if (e.ft) e.ft = Math.max(0, e.ft - dt * .5);
  e.t -= dt; e.graze = K.c !== 'swim' && (e.t % 2.4) < 1.6;
  if (e.t <= 0){
    for (let a = 0; a < 6; a++){
      const ang = Math.random() * 6.283, rr = Math.random() * e.r, x = e.hx + Math.cos(ang) * rr, y = e.hy + Math.sin(ang) * rr * .7;
      if (K.c === 'swim' ? LIFE_WATER(x, y, 4) : LIFE_FREE(x, y)){ e.tx = x; e.ty = y; e.st = 'walk'; break; }
    }
    e.t = rand(2, 6);
  }
}
const VK_DIR = (vx, vy) => Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
function lifePerson(e, dt){
  if ((e.mode === 'dance' || e.mode === 'parade') && festPerson(e, dt)) return;
  if (e.rrChase && rrChase(e, dt)) return;   // eine Wache verfolgt den Ritter (Teil 26)
  const k = G.knight, dk = Math.hypot(k.x - e.x, k.y - e.y);
  if (e.mode === 'stand'){
    e.torch = e.type === 'wache' && SKY.night > .45;
    if (e.type === 'haendler') e.dir = dk < 170 ? (Math.abs(k.x - e.x) > 30 ? (k.x > e.x ? 'right' : 'left') : 'down') : 'down';
    e.anim += dt; return;
  }
  if (e.mode === 'work'){                              // Feldarbeit: hacken und ein Stück weitergehen
    e.t -= dt;
    if (e.st === 'walk'){
      const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
      if (d < 3 || !lifeMove(e, dx / d * 16, dy / d * 16, dt)){ e.st = 'idle'; e.t = rand(4, 8); }
      e.dir = VK_DIR(dx, dy); e.anim += dt * 5; return;
    }
    e.dir = 'down'; e.chop = (e.t * 1.6) % 1 < .5;
    if (e.chop && !e.chopped){ e.chopped = true; G.parts.push({ x: e.x + 9, y: e.y + 1, vx: rand(-12, 12), vy: -20, life: .4, c: '#5a4632', g: 80 }); }
    if (!e.chop) e.chopped = false;
    if (e.t <= 0){ const q = gRandWalk(e.hx, e.hy, 10, e.r); if (q){ e.tx = q.x; e.ty = q.y; e.st = 'walk'; } else e.t = rand(3, 6); }
    return;
  }
  if (e.mode === 'road'){                              // Reisende folgen dem Weg
    const p = e.path[e.pi];
    if (!p){ e.gone = true; return; }
    const dx = p[0] - e.x, dy = p[1] - e.y, d = Math.hypot(dx, dy);
    if (d < 6){ e.pi += e.pd; if (e.pi < 0 || e.pi >= e.path.length) e.gone = true; return; }
    if (dk < 40 && e.sayUntil > nowS()){ e.dir = VK_DIR(k.x - e.x, k.y - e.y); return; }
    e.x += dx / d * e.spd * dt; e.y += dy / d * e.spd * dt; e.dir = VK_DIR(dx, dy); e.anim += dt * e.spd / 7;
    return;
  }
  // umhergehen: Ziel nahe dem Zuhause, unterwegs anderen ausweichen
  if (e.st === 'walk'){
    const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
    if (dk < 34 && e.sayUntil > nowS()){ e.dir = VK_DIR(k.x - e.x, k.y - e.y); return; }   // beim Reden stehen bleiben
    if (d < 4){ e.st = 'idle'; e.t = rand(2, 7); return; }
    const [mx, my] = steer(e, dx / d * e.spd, dy / d * e.spd, false);
    if (!lifeMove(e, mx, my, dt)){ e.stuck = (e.stuck || 0) + dt; if (e.stuck > .6){ e.st = 'idle'; e.t = rand(.5, 2); e.stuck = 0; } }
    e.dir = VK_DIR(mx, my); e.anim += dt * e.spd / 7;
    return;
  }
  e.t -= dt;
  if (dk < 60 && G.mode === 'play') e.dir = VK_DIR(k.x - e.x, k.y - e.y);
  if (e.t <= 0){ const q = gRandWalk(e.hx, e.hy, 20, e.r); if (q){ e.tx = q.x; e.ty = q.y; e.st = 'walk'; e.av = 0; } e.t = rand(1, 3); }
}
/* Sprüche: Leute in der Nähe grüßen, Händler rufen ihre Ware aus */
function lifeTalk(e){
  const now = nowS(), k = G.knight, d = Math.hypot(k.x - e.x, k.y - e.y);
  if (G.mode !== 'play' || e.sayT > now || G.lifeSayT > now) return;
  const reach = e.type === 'haendler' ? 160 : 74;
  if (d > reach) return;
  const L = e.type === 'haendler' ? VK_WARE[e.ware || 0].concat(VK_SAY.haendler) : VK_SAY[e.type];
  e.say = L[(Math.random() * L.length) | 0]; e.sayUntil = now + 3.6; e.sayT = now + (e.type === 'haendler' ? 14 : 45); G.lifeSayT = now + 3.2;
}
function lifeSound(snd, e){
  if (!Sound[snd]) return;
  const d = Math.hypot(G.knight.x - e.x, G.knight.y - e.y), v = clamp(1.2 - d / 420, 0, 1);
  if (v > .05) Sound[snd](v);
}
/* Reisende auf Burgweg, Königsstraße, Brückenweg und Dorfweg */
const LIFE_ROADS = wo_ROADS.filter(r => r.t === 0 || r.t === 3).map(r => r.p.map(q => [q[0] * WS, q[1] * WS]));
const LIFE_ROADZ = { obstgarten: 1, fluss: 1, burg: 1, stadt: 1, weiler: 1 };
function lifeTraveler(){
  const k = G.knight, cam = camOf(k);
  for (let tries = 0; tries < 8; tries++){
    const path = LIFE_ROADS[(Math.random() * LIFE_ROADS.length) | 0], i = (Math.random() * path.length) | 0, [x, y] = path[i];
    const d = Math.hypot(x - k.x, y - k.y);
    if (d < W * .6 || d > 1300 || inView(x, y, cam, 30) || !LIFE_ROADZ[gZone(x, y).id]) continue;
    const pd = Math.random() < .5 ? 1 : -1, type = ['pilger', 'haendler', 'bauer', 'knecht', 'magd', 'moench', 'buerger', 'bettler'][(Math.random() * 8) | 0];
    const off = (Math.random() < .5 ? -1 : 1) * rand(3, 8);
    G.travel.push({ person: true, type, art: vkPerson(type, (Math.random() * 3) | 0), x: x + off, y, mode: 'road', path: path.map(q => [q[0] + off, q[1]]), pi: clamp(i + pd, 0, path.length - 1), pd,
      dir: 'down', anim: 0, spd: rand(22, 32), sayT: 0, sayUntil: 0, st: 'walk' });
    return;
  }
}
function updateLife(dt){
  if (G.inside) return;
  const k = G.knight;
  G.lifeT = (G.lifeT || 0) - dt;
  if (G.lifeT <= 0){
    G.lifeT = .5;
    for (const s of LIFE_SPOTS){
      if (s.cool > 0) s.cool -= .5;
      const d = Math.hypot(s.x - k.x, s.y - k.y);
      if (!s.act && d < 1150 && s.cool <= 0){
        // nicht vor den Augen des Ritters entstehen lassen (außer beim Start)
        if (G.lifeInit && d < Math.min(W, H) * .55 && !s.p) continue;
        s.act = true; lifeMake(s);
      } else if (s.act && d > 1600){ s.act = false; s.ents = []; }
    }
    G.lifeInit = true;
    if (G.mode === 'play' || G.mode === 'title'){
      G.travelT = (G.travelT || 0) - .5;
      if (G.travelT <= 0 && G.travel.length < 4){ lifeTraveler(); G.travelT = rand(5, 12); }
      // Laute: ein Tier in der Nähe meldet sich, Vögel singen, in der Stadt läutet es
      const near = [];
      for (const s of LIFE_SPOTS) if (s.act) for (const e of s.ents) if (!e.person && e.K && e.K.snd && Math.hypot(e.x - k.x, e.y - k.y) < 360) near.push(e);
      if (near.length && Math.random() < .09) { const e = near[(Math.random() * near.length) | 0]; lifeSound(e.K.snd, e); }
      const z = G.zone;
      if (SKY.night < .4 && SKY.rain < .5 && SEA.cur !== 3 && (z === 'obstgarten' || z === 'burg' || z === 'weiler' || z === 'fluss' || z === 'wald') && Math.random() < (z === 'wald' ? .1 : .16)) Sound.chirp(.5 + Math.random() * .5);
      if (z === 'stadt'){ G.bellT = (G.bellT || 20) - .5; if (G.bellT <= 0){ Sound.chime(); G.bellT = rand(40, 70); } }
    }
  }
  for (const s of LIFE_SPOTS){
    if (!s.act) continue;
    for (let i = s.ents.length - 1; i >= 0; i--){
      const e = s.ents[i];
      if (e.person){ lifePerson(e, dt); lifeTalk(e); } else lifeAnimal(e, dt);
      if (e.gone) s.ents.splice(i, 1);
    }
  }
  for (let i = G.travel.length - 1; i >= 0; i--){
    const e = G.travel[i];
    lifePerson(e, dt); lifeTalk(e);
    if (e.gone || Math.hypot(e.x - k.x, e.y - k.y) > 1700) G.travel.splice(i, 1);
  }
  updateSky(dt);
}
/* ---------- Himmel: Vogelschwärme, Falter, springende Fische ---------- */
const SKY_BIRD = { galgen:'krähe', schlachtfeld:'krähe', friedhof:'krähe', dorf:'krähe', wald:'krähe', moor:'krähe', ruine:'krähe', stadt:'taube', obstgarten:'star', fluss:'star', burg:'star', weiler:'star', lager:'krähe' };
const SKY_FALTER = { obstgarten: 1, burg: 1, weiler: 1, fluss: 1 };
function updateSky(dt){
  const k = G.knight, cam = camOf(k);
  G.flockT = (G.flockT || rand(3, 8)) - dt;
  if (G.flockT <= 0 && G.flocks.length < 2 && !(isNight() && SEA.cur === 3)){
    G.flockT = rand(14, 34);
    const geese = !isNight() && (SEA.cur === 2 || SEA.cur === 0) && Math.random() < .35;   // Zugvögel im Keil
    const kind = isNight() ? 'fledermaus' : geese ? 'gans' : SKY_BIRD[G.zone] || 'star', n = geese ? 7 + (Math.random() * 6 | 0) : 4 + (Math.random() * 9 | 0), from = Math.random() < .5 ? -1 : 1, sp = geese ? rand(45, 60) : rand(55, 85);
    const y0 = cam.y + rand(H * .1, H * .9), x0 = from < 0 ? cam.x - 80 : cam.x + W + 80, vy = rand(-14, 14);
    const birds = [];
    for (let i = 0; i < n; i++) birds.push(geese ? { dx: -from * Math.ceil(i / 2) * 11, dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 7, ph: i * .7 } : { dx: -from * (i * 9 + rand(0, 8)), dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 6 + rand(-3, 3), ph: Math.random() * 6 });
    G.flocks.push({ kind, x: x0, y: y0, vx: -from * sp, vy: geese ? vy * .3 : vy, z: geese ? rand(170, 210) : rand(110, 170), birds, t: 0 });
    if (kind === 'krähe' && Math.random() < .5) Sound.caw();
  }
  for (let i = G.flocks.length - 1; i >= 0; i--){
    const F = G.flocks[i]; F.t += dt; F.x += F.vx * dt; F.y += (F.vy + Math.sin(F.t * 1.3) * 8) * dt;
    if ((F.vx > 0 && F.x > cam.x + W + 260) || (F.vx < 0 && F.x < cam.x - 260)) G.flocks.splice(i, 1);
  }
  // Falter über Wiesen
  seaFlutter(dt, cam);
  if (SKY_FALTER[G.zone] && SKY.night < .3 && SKY.rain < .3 && SEA.cur < 2 && G.falter.length < 5 && Math.random() < dt * .8){
    const x = cam.x + rand(20, W - 20), y = cam.y + rand(40, H - 20);
    if (LIFE_FREE(x, y)) G.falter.push({ x, y, z: rand(6, 16), vx: rand(-20, 20), vy: rand(-12, 12), t: 0, life: rand(12, 26), c: (Math.random() * TR_FLY.falter.length) | 0 });
  }
  for (let i = G.falter.length - 1; i >= 0; i--){
    const b = G.falter[i]; b.t += dt; b.life -= dt;
    b.vx += rand(-60, 60) * dt; b.vy += rand(-40, 40) * dt; b.vx = clamp(b.vx, -26, 26); b.vy = clamp(b.vy, -18, 18);
    if (Math.hypot(k.x - b.x, k.y - b.y) < 30){ b.vx += (b.x - k.x) * dt * 4; b.vy += (b.y - k.y) * dt * 4; }
    b.x += b.vx * dt; b.y += b.vy * dt; b.z = clamp(b.z + Math.sin(b.t * 3) * 6 * dt, 4, 22);
    if (b.life <= 0 || !inView(b.x, b.y, cam, 80)) G.falter.splice(i, 1);
  }
  // Fische springen im Fluss und in Teichen
  G.fishT = (G.fishT || 2) - dt;
  if (G.fishT <= 0 && SEA.cur !== 3){
    G.fishT = rand(1.5, 4);
    for (let t = 0; t < 6; t++){
      const x = cam.x + rand(10, W - 10), y = cam.y + rand(10, H - 10);
      if (!LIFE_WATER(x, y, 8)) continue;
      for (let j = 0; j < 7; j++) G.parts.push({ x: x + rand(-3, 3), y: y - 2, vx: rand(-20, 20), vy: rand(-55, -25), life: rand(.35, .6), c: j & 1 ? '#d8e2dc' : '#9ab0a8', g: 160 });
      G.fishJ = { x, y, t: 0 };
      break;
    }
  }
  if (G.fishJ){ G.fishJ.t += dt; if (G.fishJ.t > .5) G.fishJ = null; }
}

/* ---------- Zeichnen ---------- */
function lifeEnts(cam, out){
  for (const s of LIFE_SPOTS) if (s.act) for (const e of s.ents) if (inView(e.x, e.y, cam, 70)) out.push(e);
  for (const e of G.travel) if (inView(e.x, e.y, cam, 60)) out.push(e);
  return out;
}
function lifeShadow(e){
  if (e.person){ if (!e.clip) shadow(e.x, e.y - 1, 14, .34); return; }
  if (e.st === 'fly' || (e.K && e.K.c === 'swim')) return;
  const w = Math.max(5, Math.round(e.art.w * (e.art.horse ? .5 : .55)));
  shadow(e.x, e.y - 1, w, .3 - Math.min(.2, e.z * .01));
}
function drawLife(e){
  if (e.person){
    const A = e.art, moving = (e.st === 'walk' || e.mode === 'road') && !(e.sayUntil > nowS() && Math.hypot(G.knight.x - e.x, G.knight.y - e.y) < 40);
    let img;
    if (e.mode === 'work' && e.st !== 'walk') img = e.chop ? A.down[2] : A.stand.down;
    else if (moving) img = A[e.dir][(e.anim | 0) % 4];
    else img = e.dir === 'down' ? ((G.t * .8 + e.hx) % 2 < 1 ? A.stand.down : A.breath) : A.stand[e.dir];
    // Zuschauer springen beim Treffer auf
    const jump = e.spot && e.spot.crowd && G.joust && G.joust.cheer > 0 ? Math.round(Math.abs(Math.sin(G.t * 11 + e.hx * .37)) * 4) : 0;
    const x0 = Math.round(e.x - A.ax), y0 = Math.round(e.y - A.ay) - jump;
    if (e.torch){ const tx = e.x + (e.dir === 'left' ? -9 : 9); ctx.fillStyle = '#4a3020'; ctx.fillRect(Math.round(tx), y0 + 18, 2, 14); flameHD(tx + 1, y0 + 19, G.t + e.hx, false); }
    if (e.clip){ const h = Math.round(e.clip - y0); if (h > 0) ctx.drawImage(img, 0, 0, img.width, h, x0, y0, img.width, h); }
    else ctx.drawImage(img, x0, y0);
    return;
  }
  const A = e.art, side = e.dir < 0 && A.l ? A.l : A;
  if (e.st === 'fly'){
    const f = TR_FLY[e.k === 'spatz' ? 'star' : 'taube'][(e.anim | 0) % 2];
    shadow(e.x, e.y - 1, 4, .18);
    ctx.drawImage(f, Math.round(e.x - 3), Math.round(e.y - 8 - e.z)); return;
  }
  let img;
  if (e.st === 'flee' || e.st === 'charge') img = (e.K.c === 'wild' && !A.horse) ? side.run[(e.anim | 0) % 2] : side.walk[(e.anim | 0) % 4];
  else if (e.st === 'walk' || e.st === 'rest') img = side.walk[(e.anim | 0) % 4];
  else img = e.graze ? side.graze : side.stand;
  const bob = e.K && e.K.c === 'swim' ? Math.round(Math.sin(G.t * 2 + e.hx) * .6) : 0;
  ctx.drawImage(img, Math.round(e.x - A.ax), Math.round(e.y - A.ay - e.z + bob));
  if (e.K && e.K.c === 'swim'){
    // Kielwasser
    ctx.fillStyle = 'rgba(200,214,210,.55)';
    const w = A.w - 4, x0 = Math.round(e.x - w / 2), y0 = Math.round(e.y);
    ctx.fillRect(x0, y0, w, 1);
    if (e.st !== 'idle'){ const tx = e.dir > 0 ? x0 - 3 : x0 + w + 1; ctx.fillRect(tx, y0 - 1, 2, 1); ctx.fillRect(e.dir > 0 ? tx - 3 : tx + 3, y0 + 1, 2, 1); }
  }
}
function drawSpeech(cam){
  const now = nowS();
  for (const e of lifeEnts(cam, [])) if (e.person && e.say && e.sayUntil > now) drawBubble(e.x, e.y - 50, e.say);
}
function drawSky(cam){
  for (const f of G.flutter){ const w = Math.sin(f.t * 4 + f.ph) > 0; ctx.fillStyle = f.c; ctx.fillRect(Math.round(f.x), Math.round(f.y), w ? 2 : 1, w ? 1 : 2); }
  for (const b of G.falter){
    const f = TR_FLY.falter[b.c][(b.t * 9 | 0) % 2];
    ctx.drawImage(f, Math.round(b.x - 1), Math.round(b.y - b.z - 1));
  }
  if (G.fishJ){
    const p = G.fishJ.t / .5, x = Math.round(G.fishJ.x - 6 + p * 12), y = Math.round(G.fishJ.y - Math.sin(p * Math.PI) * 10);
    ctx.fillStyle = '#9aa8a8'; ctx.fillRect(x - 2, y, 5, 2); ctx.fillStyle = '#c8d4d0'; ctx.fillRect(x - 1, y, 3, 1); ctx.fillStyle = '#5a6a6a'; ctx.fillRect(x - 4, y - 1, 2, 2);
  }
  for (const F of G.flocks){
    const imgs = TR_FLY[F.kind];
    for (const b of F.birds){
      const x = F.x + b.dx, y = F.y + b.dy;
      if (!inView(x, y, cam, 40)) continue;
      ctx.fillStyle = 'rgba(18,16,22,.16)'; ctx.fillRect(Math.round(x - 2), Math.round(y), 5, 2);
      ctx.drawImage(imgs[((F.t * 7 + b.ph) | 0) % 2], Math.round(x - 3), Math.round(y - F.z));
    }
  }
}

/* ============ Tag und Nacht, Wetter: eine Uhr für alle Ritter (aus der Weltzeit) ============
   Ein Tag dauert 24 Minuten, eine Stunde also eine Minute. Das Wetter wechselt alle fünf Minuten,
   für alle Spieler gleich, mit weichem Übergang. */
const DAY_LEN = 1440, WX_SLOT = 300;
const WX_KIND = {
  klar:     { rain: 0,  cloud: 0,   fog: 0,  storm: 0, dark: 0,   snow: 0,  gust: 0 },
  heiter:   { rain: 0,  cloud: .45, fog: 0,  storm: 0, dark: 0,   snow: 0,  gust: 0 },
  'bewölkt':{ rain: 0,  cloud: .9,  fog: .1, storm: 0, dark: .08, snow: 0,  gust: 0 },
  Regen:    { rain: .75, cloud: 1,  fog: .15, storm: 0, dark: .15, snow: 0, gust: 0 },
  Nebel:    { rain: 0,  cloud: .5,  fog: .9, storm: 0, dark: .07, snow: 0,  gust: 0 },
  Gewitter: { rain: 1,  cloud: 1,   fog: .1, storm: 1, dark: .24, snow: 0,  gust: 0 },
  Schnee:   { rain: 0,  cloud: .9,  fog: .2, storm: 0, dark: .1,  snow: .7, gust: 0 },
  Schneesturm: { rain: 0, cloud: 1, fog: .5, storm: 0, dark: .2,  snow: 1,  gust: 1 }
};
const SKY = { hour: 12, night: 0, dark: 0, tint: 0, dawn: true, rain: 0, cloud: 0, fog: 0, storm: 0, snow: 0, gust: 0, w: 'klar', wind: 18, wasNight: null };
const skyNow = () => Date.now() / 1000 + (window.__skyShift || 0);
function wxAt(slot){
  if (window.__wx) return window.__wx;   // zum Ausprobieren
  const h = wo_h(slot, 77, 1520), hourS = ((slot * WX_SLOT / DAY_LEN) % 1) * 24, morning = hourS > 4 && hourS < 9;
  const sea = seaAt(slot * WX_SLOT);
  if (morning && h < (sea === 2 ? .38 : .22)) return 'Nebel';
  if (sea === 3) return h < .3 ? 'klar' : h < .5 ? 'heiter' : h < .64 ? 'bewölkt' : h < .88 ? 'Schnee' : h < .93 ? 'Nebel' : 'Schneesturm';
  if (sea === 2) return h < .22 ? 'klar' : h < .44 ? 'heiter' : h < .64 ? 'bewölkt' : h < .84 ? 'Regen' : h < .95 ? 'Nebel' : 'Gewitter';
  if (sea === 0) return h < .26 ? 'klar' : h < .56 ? 'heiter' : h < .7 ? 'bewölkt' : h < .9 ? 'Regen' : h < .95 ? 'Nebel' : 'Gewitter';
  return h < .38 ? 'klar' : h < .6 ? 'heiter' : h < .72 ? 'bewölkt' : h < .84 ? 'Regen' : h < .88 ? 'Nebel' : 'Gewitter';
}
function updateClock(){
  const t = skyNow(), hour = (t / DAY_LEN % 1) * 24;
  SKY.hour = hour;
  // Nacht 21–4 Uhr, Dämmerung 4–6:30 und 18:30–21 Uhr
  SKY.night = hour >= 21 || hour < 4 ? 1 : hour < 6.5 ? 1 - (hour - 4) / 2.5 : hour < 18.5 ? 0 : (hour - 18.5) / 2.5;
  SKY.night = SKY.night * SKY.night * (3 - 2 * SKY.night);
  SKY.dawn = hour < 12;
  SKY.tint = Math.sin(Math.PI * clamp(SKY.night, 0, 1)) * (hour > 3 && hour < 22 ? 1 : 0);
  const slot = Math.floor(t / WX_SLOT), f = clamp((t / WX_SLOT - slot) * WX_SLOT / 40, 0, 1), A = WX_KIND[wxAt(slot - 1)], B = WX_KIND[wxAt(slot)];
  SKY.w = wxAt(slot);
  for (const k of ['rain', 'cloud', 'fog', 'storm', 'snow', 'gust']) SKY[k] = A[k] + (B[k] - A[k]) * f;
  const wd = A.dark + (B.dark - A.dark) * f;
  SKY.dark = clamp(.58 * SKY.night + wd * (1 - SKY.night * .4), 0, .72);
  SKY.wind = 14 + SKY.storm * 30 + SKY.rain * 10 + SKY.gust * 34;
  seaTick();
}
/* Ereignisse: Blitz und Donner, Nachtanbruch, Glocken, Nachtgeräusche (im Spiel) */
function skyEvents(dt){
  if (!G) return;
  festSync(); festParts(dt, camOf(G.knight));
  const k = G.knight, nightNow = SKY.night > .6;
  if (SKY.wasNight !== null && nightNow !== SKY.wasNight && G.mode === 'play' && !G.inside)
    logLine(nightNow ? 'Die Nacht bricht herein. Werwölfe, Irrlichter und Wiedergänger sind jetzt stärker.' : 'Der Morgen graut. Die Nacht weicht.', nightNow ? '#9cb8ff' : '#ffd98a');
  SKY.wasNight = nightNow;
  if (G.inside) { Sound.setRain(0); return; }
  if (SKY.storm > .5){
    G.boltT = (G.boltT || rand(4, 9)) - dt;
    if (G.boltT <= 0){ G.boltT = rand(6, 15); G.flash = .3; G.bolt = { x: camOf(k).x + rand(40, W - 40), t: .18 }; setTimeout(() => Sound.thunder(), rand(400, 1800)); }
  }
  if (G.bolt){ G.bolt.t -= dt; if (G.bolt.t <= 0) G.bolt = null; }
  Sound.setRain(Math.max(SKY.rain, SKY.gust * .45));
  seaPrints();
  // Glocken um 6, 12 und 18 Uhr in Stadt, Burg und Dorf
  const hr = Math.floor(SKY.hour);
  if (G.lastHour !== undefined && hr !== G.lastHour && (hr === 6 || hr === 12 || hr === 18) && SAFE[G.zone]) Sound.chime();
  if (G.lastHour !== undefined && hr !== G.lastHour) chHour(hr);   // Glocken zur Messe
  G.lastHour = hr;
  G.nightT = (G.nightT || 1) - dt;
  if (G.nightT <= 0){
    G.nightT = .5;
    const z = G.zone, open = z === 'obstgarten' || z === 'burg' || z === 'weiler' || z === 'fluss' || z === 'lager' || z === 'galgen';
    if (SKY.night > .6 && open && SEA.cur < 2 && Math.random() < .3) Sound.cricket(.6);
    if (SKY.night > .6 && (z === 'wald' || z === 'burg' || z === 'friedhof') && Math.random() < .02) Sound.owl(.7);
    if (SKY.hour > 5 && SKY.hour < 6.6 && (z === 'weiler' || z === 'burg') && Math.random() < .03) Sound.crow(.5);
  }
}
const isNight = () => SKY.night > .6;
/* ---------- Wechsel der Jahreszeit ----------
   Die Bilder der kommenden Jahreszeit werden in den letzten Minuten davor nach und nach gemalt (wenige ms je Bild),
   beim Wechsel auf einmal getauscht. Der Boden malt sich danach Stück für Stück neu und blendet über. */
const SEA = { cur: wp_SEA, job: null };
wo_ICE = SEA.cur === 3;
const SEA_MSG = ['Der Frühling kommt. Die Apfelbäume blühen, das Eis ist geschmolzen.', 'Es wird Sommer. In den Obstgärten reifen die Äpfel.',
  'Es wird Herbst. Das Laub färbt sich, im Obstgarten wird geerntet.', 'Der Winter zieht ein. Schnee liegt auf dem Land, und das Eis trägt über Fluss und Teiche.'];
const SEA_LEAFY = { apfelbaum: 1, eiche: 1, buche: 1, birke: 1, weide: 1 };
function seaTick(){
  const t = Date.now() / 1000 + (window.__skyShift || 0), s = seaAt(t), left = SEA_LEN - (t % SEA_LEN);
  const want = s !== SEA.cur ? s : left < 150 && window.__season == null ? (s + 1) % 4 : -1;
  if (want < 0) return;
  if (!SEA.job || SEA.job.s !== want){
    const seen = new Set(), list = [];
    for (const p of GPROPS){ const k = p.v != null ? p.kind + '|' + p.v : p.img0; if (!seen.has(k)){ seen.add(k); list.push(p); } }
    SEA.job = { s: want, list, i: 0 };
  }
  const J = SEA.job, t0 = performance.now();
  while (J.i < J.list.length && performance.now() - t0 < 5){
    const p = J.list[J.i++], img = p.v != null ? wp_paintV(p.kind, p.v, want).img : want === 3 ? snowCached(p.img0) : p.img0;
    if (p.wins && p.wins.length) nightImg(img, p.wins);   // Nachtbild gleich mit vorbereiten
  }
  if (J.i >= J.list.length && s === want) seaApply(want);
}
function seaApply(s){
  SEA.cur = s; SEA.job = null; wo_ICE = s === 3;
  for (const p of GPROPS){
    p.img = p.v != null ? wp_paintV(p.kind, p.v, s).img : s === 3 ? snowCached(p.img0) : p.img0; p.lz = false;
    if (p.wins && p.wins.length){ const n = nightImg(p.img, p.wins); p.nimg = n.img; p.lights = n.lit.map(([x, y]) => [p.x - p.ax + x, p.y - p.ay + y]); }
  }
  wo_GSEA = s;
  // Bilder der vergangenen Jahreszeit freigeben
  for (let k = 0; k < 4; k++) for (const kind of [...wp_CACHES[k].keys()]) if (seaKey(kind, s) !== k) wp_CACHES[k].delete(kind);
  const used = new Set(GPROPS.map(p => p.img));
  for (const img of [...NIGHT_IMG.keys()]) if (!used.has(img)) NIGHT_IMG.delete(img);
  if (G && G.mode === 'play'){ showBanner(SEA_NAME[s], SEA_MSG[s].split('. ')[0] + '.'); logLine(SEA_MSG[s], s === 3 ? '#c8dcff' : s === 2 ? '#f0b060' : '#9fe08a'); }
  if (G && s !== 3) G.prints = [];
}
/* Spuren im Schnee */
function seaPrints(){
  const k = G.knight;
  if (SEA.cur !== 3 || G.mode !== 'play' || G.inside || G.joust) return;
  const lp = G.lastPrint;
  if (!lp || Math.hypot(k.x - lp.x, k.y - lp.y) > (k.ride ? 15 : 11)){
    G.printSide = !G.printSide;
    G.prints.push({ x: k.x + (G.printSide ? 3 : -3), y: k.y - 1, t: G.t, h: !!k.ride });
    G.lastPrint = { x: k.x, y: k.y };
    while (G.prints.length > 200 || (G.prints.length && G.t - G.prints[0].t > 40)) G.prints.shift();
  }
}
function drawPrints(cam){
  for (const p of G.prints){
    const a = 1 - (G.t - p.t) / 40;
    if (a <= 0 || !inView(p.x, p.y, cam, 10)) continue;
    ctx.fillStyle = 'rgba(74,88,118,' + (a * .42).toFixed(2) + ')';
    if (p.h) ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y), 3, 2); else ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y), 2, 1);
  }
}
/* fallendes Laub im Herbst, Blütenblätter im Frühling */
function seaFlutter(dt, cam){
  const sea = SEA.cur;
  if ((sea === 2 || sea === 0) && !RM && G.flutter.length < 50 && Math.random() < dt * 9){
    const vis = propsInView(cam).filter(p => sea === 0 ? p.kind === 'apfelbaum' : SEA_LEAFY[p.kind]);
    if (vis.length){
      const p = vis[(Math.random() * vis.length) | 0], cx = p.crown ? p.crown.x : p.x, cy = p.crown ? p.crown.y : p.y - 80;
      G.flutter.push({ x: cx + rand(-44, 44), y: cy + rand(-24, 26), gy: p.y + rand(-8, 34), t: 0, ph: Math.random() * 6, rest: 0,
        c: sea === 0 ? pick(['#f6eef0', '#f0d0da', '#ffffff']) : pick(['#b0561e', '#c88a2a', '#8a3a1a', '#d0a030', '#a8301a']) });
    }
  }
  for (let i = G.flutter.length - 1; i >= 0; i--){
    const f = G.flutter[i]; f.t += dt;
    if (f.y < f.gy){ f.y += (15 + Math.sin(f.t * 3 + f.ph) * 7) * dt; f.x += (Math.sin(f.t * 2.2 + f.ph) * 18 + SKY.wind * .4) * dt; }
    else f.rest += dt;
    if (f.rest > 2.5 || !inView(f.x, f.y, cam, 80)) G.flutter.splice(i, 1);
  }
}
/* Nachtbilder der Häuser: erleuchtete Fenster (gleiche Lage wie im Tagbild) */
const NIGHT_IMG = new Map();
function nightImg(img, wins){
  if (NIGHT_IMG.has(img)) return NIGHT_IMG.get(img);
  const c = canvasOf(img.width, img.height), g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  const lit = [];
  wins.forEach((w, i) => {
    if (wo_h(i, img.width, img.height) < .28) return;                 // manches Fenster bleibt dunkel
    const x0 = Math.round((w[0] + .5) * WS), y0 = Math.round((w[1] + .5) * WS), x1 = Math.round((w[0] + w[2] - .5) * WS), y1 = Math.round((w[1] + w[3] - .5) * WS);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
      const o = (y * c.width + x) * 4; if (d[o + 3] < 250) continue;
      const L = (d[o] * .3 + d[o + 1] * .55 + d[o + 2] * .15) / 255, v = clamp(.25 + L * 1.6 + (y - y0 < 2 ? .1 : 0), 0, 1);
      d[o] = 130 + 125 * v; d[o + 1] = 70 + 150 * v; d[o + 2] = 20 + 90 * v * v;
    }
    lit.push([(w[0] + w[2] / 2) * WS, (w[1] + w[3] / 2) * WS]);
  });
  g.putImageData(id, 0, 0);
  const r = { img: c, lit };
  NIGHT_IMG.set(img, r);
  return r;
}
for (const p of GPROPS){
  if (!p.wins || !p.wins.length || p.lz) continue;
  const n = nightImg(p.img, p.wins);
  p.nimg = n.img; p.lights = n.lit.map(([x, y]) => [p.x - p.ax + x, p.y - p.ay + y]);
}
/* Wolkenschatten: kachelbares Rauschen, wandert mit dem Wind */
const CLOUD_TEX = (() => {
  const N = 256, c = canvasOf(N * 2, N * 2), g = c.getContext('2d'), id = g.createImageData(N * 2, N * 2), D = id.data, n = noise2(1520);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
    // kachelbar: vier Ecken mischen
    const u = x / N, v = y / N, f = (a, b) => fbm(n, a * 6, b * 6, 4);
    const val = f(u, v) * (1 - u) * (1 - v) + f(u - 1, v) * u * (1 - v) + f(u, v - 1) * (1 - u) * v + f(u - 1, v - 1) * u * v;
    const a = clamp((val - .52) * 5, 0, 1), q = Math.floor(a * 4 + dither(x, y)) / 4;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++){ const o = ((y * 2 + j) * N * 2 + x * 2 + i) * 4; D[o] = 14; D[o + 1] = 16; D[o + 2] = 26; D[o + 3] = Math.round(q * 255); }
  }
  g.putImageData(id, 0, 0); return c;
})();
/* Lichtkarte in halber Auflösung: Dunkel, aus dem Lichter ausgestanzt werden */
const LIGHT_CV = canvasOf(Math.ceil(W / 2), Math.ceil(H / 2)), LIGHT_G = LIGHT_CV.getContext('2d');
function skyLights(cam){
  const L = [], k = G.knight, v = (x, y, m) => x > cam.x - m && x < cam.x + W + m && y > cam.y - m && y < cam.y + H + m;
  if (G.mode !== 'title') L.push([k.x, k.y - 22, 210, .9, 0]);
  for (const p of PEERS.values()) if (!p.in && v(p.x, p.y, 200)) L.push([p.x, p.y - 22, 170, .8, 0]);
  evLights(v, L);
  for (const f of GFIRES) if (v(f.x, f.y, 260)) L.push([f.x, f.y - 8, f.big ? 300 : 210, 1, 1]);
  for (const inn of INNS) if (v(inn.dx, inn.y, 200)) L.push([inn.dx, inn.y - 30, 150, .85, 1]);
  for (const p of propsInView(cam)) if (p.lights && p.lights.length){
    if (p.lights.length === 1){ L.push([p.lights[0][0], p.lights[0][1], 96, .6, 1]); continue; }
    let sx = 0, sy = 0, d = 0; for (const [x, y] of p.lights){ sx += x; sy += y; } sx /= p.lights.length; sy /= p.lights.length;
    for (const [x, y] of p.lights) d = Math.max(d, Math.hypot(x - sx, y - sy));
    L.push([sx, sy, 96 + d * .9, Math.min(.85, .6 + p.lights.length * .04), 1]);
  }
  for (const m of G.mons){
    if (aiK(m.k) === 'irrlicht' && v(m.x, m.y, 120)) L.push([m.x, m.y - 26, 130, .9, 2]);
    if (aiK(m.k) === 'tod' && m.st !== 'hidden' && v(m.x, m.y, 120)) L.push([m.x, m.y - 30, 90, .4, 3]);
  }
  for (const s of G.shots) if (s.k === 'fire') L.push([s.x, s.y, 140, .9, 1]);
  for (const a of G.loot) if (a.t === 'item' && a.it.r >= 2 && v(a.x, a.y, 60)) L.push([a.x, a.y - 10, 60, .6, 0]);
  for (const s of LIFE_SPOTS) if (s.act) for (const e of s.ents) if (e.torch && v(e.x, e.y, 180)) L.push([e.x + 8, e.y - 40, 190, .95, 1]);
  festLights(cam, L);
  return L;
}
const LIGHT_COL = ['255,240,210', '255,150,60', '120,255,180', '170,180,255'];
function drawSkyLight(cam){
  // Wolkenschatten auf dem Land
  if (SKY.cloud > .05 && !RM){
    const ox = ((cam.x + skyNow() * SKY.wind) % 512 + 512) % 512, oy = ((cam.y + skyNow() * SKY.wind * .35) % 512 + 512) % 512;
    ctx.globalAlpha = SKY.cloud * (.2 - SKY.night * .12);
    for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) ctx.drawImage(CLOUD_TEX, Math.round(x), Math.round(y));
    ctx.globalAlpha = 1;
  }
  // Morgen- und Abendrot
  if (SKY.tint > .02){ ctx.fillStyle = SKY.dawn ? 'rgba(255,150,110,' + (SKY.tint * .13).toFixed(3) + ')' : 'rgba(255,110,50,' + (SKY.tint * .15).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (SKY.dark < .02) return;
  const lights = skyLights(cam), g = LIGHT_G, lw = LIGHT_CV.width, lh = LIGHT_CV.height;
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, lw, lh);
  const blue = SKY.night > .4;
  g.fillStyle = blue ? 'rgba(6,10,30,' + SKY.dark.toFixed(3) + ')' : 'rgba(18,18,26,' + SKY.dark.toFixed(3) + ')';
  g.fillRect(0, 0, lw, lh);
  g.globalCompositeOperation = 'destination-out';
  const nl = clamp(SKY.night * 1.3, 0, 1);
  for (const [x, y, r, kk, c] of lights){
    const px = (x - cam.x) / 2, py = (y - cam.y) / 2, rr = r / 2, a = kk * (c === 0 ? .55 + .45 * nl : 1);
    if (px < -rr || py < -rr || px > lw + rr || py > lh + rr) continue;
    const gr = g.createRadialGradient(px, py, 0, px, py, rr);
    gr.addColorStop(0, 'rgba(0,0,0,' + a.toFixed(2) + ')'); gr.addColorStop(.55, 'rgba(0,0,0,' + (a * .55).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(LIGHT_CV, 0, 0, lw * 2, lh * 2);
  // warmer Schein um Feuer, Fenster und Irrlichter
  if (nl > .05){
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, r, kk, c] of lights){
      if (!c) continue;
      const px = x - cam.x, py = y - cam.y, rr = r * .6;
      if (px < -rr || py < -rr || px > W + rr || py > H + rr) continue;
      const gr = ctx.createRadialGradient(px, py, 0, px, py, rr);
      gr.addColorStop(0, 'rgba(' + LIGHT_COL[c] + ',' + (.2 * kk * nl).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + LIGHT_COL[c] + ',0)');
      ctx.fillStyle = gr; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
/* Blitz: gezackte Linie vom Himmel */
function drawBolt(){
  if (!G.bolt) return;
  ctx.fillStyle = 'rgba(236,240,255,.9)';
  const R = rng(G.bolt.x | 0);
  let x = G.bolt.x - camOf(G.knight).x, y = 0;
  while (y < H * .7){ const nx = x + (R() - .5) * 26, ny = y + 10 + R() * 18; for (let t = 0; t < 1; t += .1) ctx.fillRect(Math.round(x + (nx - x) * t), Math.round(y + (ny - y) * t), 2, 2); x = nx; y = ny; }
}
/* Uhr und Wetter oben rechts */
const SKY_ICON = {
  sonne: makeSprite(['....a....', '.a..a..a.', '...bbb...', '..bcccb..', 'aabcccbaa', '..bcccb..', '...bbb...', '.a..a..a.', '....a....'], { a:'#f0c040', b:'#f6c84a', c:'#ffe89a' }, OUT),
  mond: makeSprite(['...aaa...', '.aab.....', '.abb.....', 'aabb.....', 'aabb.....', 'aabb.....', '.abb.....', '.aab..a..', '...aaa...'], { a:'#e4e8f8', b:'#b4bcda' }, OUT),
  wolke: makeSprite(['...aaa....', '.aabbbaa..', 'abbbbbbba.', 'abbbbbbbba', '.aaaaaaaa.'], { a:'#a8acb8', b:'#d6dae2' }, OUT)
};
/* Auf Tablets quer steht der Gebietsname oben rechts: die Anzeige dann darunter */
let skyHudYv = 8, skyHudT = -9;
function skyHudY(){
  if (G.t - skyHudT < 1 && G.t >= skyHudT) return skyHudYv;
  skyHudT = G.t; skyHudYv = 8;
  try {
    const zr = $('zone').getBoundingClientRect(), cr = cv.getBoundingClientRect();
    if (cr.height && zr.height && zr.top < cr.top + cr.height * .2 && zr.right > cr.left + cr.width * .6) skyHudYv = Math.round((zr.bottom - cr.top) * H / cr.height) + 4;
  } catch(e){}
  return skyHudYv;
}
function drawSkyHud(){
  const h = Math.floor(SKY.hour), night = SKY.night > .5;
  const part = h < 5 ? 'Nacht' : h < 10 ? 'Morgen' : h < 14 ? 'Mittag' : h < 18 ? 'Nachmittag' : h < 22 ? 'Abend' : 'Nacht';
  const txt = (G.fest ? G.fest.name : SEA_NAME[SEA.cur]) + ', ' + h + ' Uhr, ' + part + ', ' + SKY.w;
  const im = textImg(txt, night ? '#c8d0ff' : '#ffe9a8'), x = W - 8 - im.width, y = skyHudY();
  ctx.fillStyle = 'rgba(16,14,20,.55)'; ctx.fillRect(x - 28, y - 4, im.width + 34, im.height + 8);
  ctx.drawImage(night ? SKY_ICON.mond : SKY_ICON.sonne, x - 24, y - 1);
  if (SKY.cloud > .6) ctx.drawImage(SKY_ICON.wolke, x - 22, y + 4);
  ctx.drawImage(im, x, y);
}
