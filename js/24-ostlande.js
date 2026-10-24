"use strict";
/* Der Apfelritter, Teil 24 von 25: Die Ostlande: Wittenberg, Nürnberg und Augsburg, ihre Leute, Aufträge, der Fuhrmann, die Thesen.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */

/* ============ Die Ostlande (Version 26) ============
   Östlich von Speyer und dem Bergland: Sachsen mit Wittenberg und der Dübener Heide, Franken mit Nürnberg, dem Reichswald und
   Burg Gailingen, Schwaben mit Augsburg, dem Donauried und dem Lechfeld. In jeder Stadt vergibt jemand Aufträge, es gibt Händler,
   Schmiede und einen Fuhrmann, der zwischen allen großen Städten fährt. */
NPC_ART.cranach = np_frames({ robe: 'long', hat: 'barett', fur: true, chain: true, belt: true, beard: true, hair: ['h', 'j'] },
  { 1: '#1a1412', 2: '#2a201c', 3: '#3c2e28', 4: '#544036', 5: '#8a6a40', 6: '#a88450', 7: '#c4a066', 8: '#dcbc80' });
NPC_ART.pirckheimer = np_frames({ robe: 'long', hat: 'barett', fur: true, chain: true, belt: true, hair: ['h', 'j'] },
  { 1: '#3a0c10', 2: '#5a141a', 3: '#7a2026', 4: '#9a3034', 5: '#141218', 6: '#221e28', 7: '#322c3a', 8: '#463e50' });
NPC_ART.mschwarz = np_frames({ robe: 'short', hat: 'barett', parti: true, belt: true, hair: ['h', 'j'] },
  { 1: '#1c3a1a', 2: '#2a5a26', 3: '#3e7a36', 4: '#5a9a4c', 5: '#6a1414', 6: '#9a2420', 7: '#c03a2c', 8: '#de5a44', R: '#e0c040' });
NPC_ART.fugger = np_frames({ robe: 'long', hat: 'haube', fur: true, chain: true },
  { 1: '#1a1610', 2: '#2a2418', 3: '#3e3624', 4: '#544a32', 5: '#8a6a10', 6: '#b08a20', 7: '#d4aa3a', 8: '#ecc85c' });
NPC_ART.fuhrmann = np_frames({ robe: 'short', hat: 'filz', belt: true, beard: true, staff: true, hair: ['h', 'j'] },
  { 1: '#3a3020', 2: '#52442c', 3: '#6a5a3a', 4: '#82704a', 5: '#2c3424', 6: '#3e4a32', 7: '#526044', 8: '#6a7a58' });
NPC_ART.plattner = np_frames({ robe: 'short', apron: 'leather', belt: true, beard: true, hairSide: true, hair: ['j', 'h'], plate: true },
  { 1: '#2a2420', 2: '#3a322c', 3: '#4a4038', 4: '#5c5048', 5: '#2a2420', 6: '#3a322c', 7: '#4a4038', 8: '#5c5048' });
NPC_ART.werber = np_frames({ robe: 'short', hat: 'barett', parti: true, beard: true, belt: true, halberd: true, hair: ['h', 'j'] },
  { 1: '#4a0c0c', 2: '#7a1414', 3: '#a8221c', 4: '#c83a28', 5: '#6a5010', 6: '#9a7a1c', 7: '#c8a030', 8: '#e6c44c', R: '#f4f4ec' });
NPC_ART.schiffmeister = np_frames({ robe: 'short', hat: 'filz', belt: true, beard: true, hairSide: true, hair: ['j', 'h'] },
  { 1: '#1c2a3a', 2: '#2a3e54', 3: '#3e566e', 4: '#566e88', 5: '#3a2c1e', 6: '#4a3a28', 7: '#5a4a34', 8: '#6e5c44' });

const OST_NPC = [
  // Wittenberg
  { id: 'cranach', name: 'Ratsherr Lucas Cranach', role: 'Aufträge und Arzneien', hub: 'wittenberg', at: gNear(7660, wo_WIT.gy + 46), quest: true, shop: true,
    greet: ['Ich male für den Kurfürsten, ich drucke Bücher, und in meiner Apotheke gibt es die besten Arzneien in Sachsen. Was braucht Ihr, Herr Ritter?',
      'Die Heide zwischen Elbe und Main ist voller Gefahren. Wer dort reist, braucht ein Schwert und einen Heiltrank.',
      'Doktor Luther sitzt mir oft Modell. Er hat ein gutes Gesicht für Holzschnitte, kantig und entschlossen.'] },
  { id: 'schmied3', name: 'Schmied Hans Bader', role: 'Schmied', hub: 'wittenberg', at: gNear(8170, wo_WIT.gy + 44), art: 'schmied2', smith: true,
    greet: ['Die Studenten zerbrechen ihre Degen schneller, als ich sie schmieden kann. Eure Rüstung mache ich gern besser.', 'Bestes Eisen aus dem Erzgebirge, Herr Ritter.'] },
  { id: 'fuhrmann_w', name: 'Fuhrmann Jobst', role: 'Reisen', hub: 'wittenberg', at: gNear(8010, wo_WIT.y1 + 44), art: 'fuhrmann', fuhr: 'wittenberg',
    greet: ['Mein Wagen fährt zu allen großen Städten im Reich. Steigt auf, wenn Ihr müde Beine habt!', 'Die Hohe Straße ist sicher, solange die Strauchdiebe schlafen.'] },
  // Nürnberg
  { id: 'pirckheimer', name: 'Ratsherr Willibald Pirckheimer', role: 'Aufträge', hub: 'nuernberg', at: gNear(7680, wo_NUE.gy + 58), quest: true,
    greet: ['Ich habe für Nürnberg gegen die Eidgenossen gefochten und lese Griechisch am Abend. Die Stadt braucht beides: Gelehrte und Ritter.',
      'Eppelein von Gailingen überfällt unsere Kaufleute auf der Straße nach Norden. Man sagt, er sei einst mit dem Pferd über den Burggraben gesprungen.',
      'Mein Freund Albrecht Dürer wohnt gleich unter der Burg. Wenn Ihr Glück habt, malt er Euch einmal.'] },
  { id: 'plattner', name: 'Plattner Konrad Seusenhofer', role: 'Plattner', hub: 'nuernberg', at: gNear(7425, wo_NUE.gy2 + 32), art: 'plattner', smith: true,
    greet: ['Nürnberger Harnische trägt man vom Kaiser bis zum Landsknecht. Ich treibe Euer Eisen so, dass es jeden Hieb ablenkt.', 'Riefeln, Herr Ritter! Die Kehlungen machen den Harnisch leicht und stark zugleich.'] },
  { id: 'lebkuechnerin', name: 'Lebküchnerin Margret', role: 'Händlerin', hub: 'nuernberg', at: gNear(7990, wo_NUE.gy + 72), art: 'kraemerin3', shop: true, rich: true,
    greet: ['Lebkuchen, Heiltränke, Wachs und Gewürz aus Venedig! In Nürnberg gibt es alles, Herr Ritter.', 'Ich kaufe, was Ihr im Reichswald findet: Felle, Hauer, Alraunen.'] },
  { id: 'stall3', name: 'Stallmeister Kilian', role: 'Pferde', hub: 'nuernberg', at: gNear(7330, wo_NUE.gy + 60), art: 'stall2', stable: true,
    greet: ['Fränkische Pferde, ausdauernd und klug. Für den Reichswald braucht Ihr ein Pferd, das nicht scheut.'] },
  { id: 'fuhrmann_n', name: 'Fuhrmann Sixt', role: 'Reisen', hub: 'nuernberg', at: gNear(7800, wo_NUE.y0 - 44), art: 'fuhrmann', fuhr: 'nuernberg',
    greet: ['Nürnberg liegt in der Mitte des Reiches. Von hier fahre ich überall hin, Herr Ritter.', 'Die Pegnitz, der Main, die Donau: Ich kenne jede Furt und jede Brücke.'] },
  // Augsburg
  { id: 'mschwarz', name: 'Matthäus Schwarz, Buchhalter der Fugger', role: 'Aufträge', hub: 'augsburg', at: gNear(7480, wo_AUG.gy + 50), quest: true,
    greet: ['Ich führe die Bücher des Hauses Fugger, jeden Pfennig von Antwerpen bis Venedig. Und ich trage gern schöne Kleider, wie Ihr seht.',
      'Das Donauried und das Lechfeld sind unsicher geworden. Unsere Fuhrleute weigern sich, nachts dort zu fahren.',
      'Herr Jakob hat den Kaiser gewählt, sagt man in der Stadt. Er hat ihn jedenfalls bezahlt.'] },
  { id: 'fugger', name: 'Jakob Fugger der Reiche', role: 'Kaufherr', hub: 'augsburg', at: gNear(7220, wo_AUG.y1 - 36), art: 'fugger',
    greet: ['Ich habe dem Kaiser geliehen, dem Papst und dem König von Portugal. Was kann ich für einen Ritter tun?',
      'Die Fuggerei habe ich für die Armen gestiftet: ein Gulden Miete im Jahr und drei Gebete am Tag für mich und meine Familie.',
      'Man sagt, ich sei der reichste Mann der Welt. Ich sage: Ich will gewinnen, solange ich kann.'] },
  { id: 'kraemer4', name: 'Krämer Anton', role: 'Händler', hub: 'augsburg', at: gNear(7660, wo_AUG.gy + 50), art: 'kraemer', shop: true, rich: true,
    greet: ['Barchent, Pfeffer, Silber und Heiltränke! In Augsburg kauft man ein, Herr Ritter.', 'Pfeilspitzen vom Lechfeld? Die kaufe ich, die Gelehrten sammeln so etwas.'] },
  { id: 'schmied4', name: 'Schmied Lukas', role: 'Schmied', hub: 'augsburg', at: gNear(7210, wo_AUG.gy + 46), art: 'schmied2', smith: true,
    greet: ['Augsburger Plattner sind so gut wie die Nürnberger, das sage ich jedem. Zeigt her!'] },
  { id: 'fuhrmann_a', name: 'Fuhrmann Bartel', role: 'Reisen', hub: 'augsburg', at: gNear(7490, wo_AUG.y0 - 44), art: 'fuhrmann', fuhr: 'augsburg',
    greet: ['Von Augsburg nach Venedig fahre ich nicht mehr, die Alpen sind zu steil für meine Rösser. Aber ins Reich, jederzeit!'] },
  // Fuhrleute in den alten Städten
  { id: 'fuhrmann_s', name: 'Fuhrmann Wendel', role: 'Reisen', hub: 'stadt', at: gNear(3030, 2690), art: 'fuhrmann', fuhr: 'stadt',
    greet: ['Nach Wittenberg, Nürnberg oder Augsburg? Mein Wagen fährt, sobald Ihr zahlt.', 'Im Osten liegen reiche Städte, Herr Ritter. Und gefährliche Wälder dazwischen.'] },
  { id: 'fuhrmann_sp', name: 'Fuhrmann Claus', role: 'Reisen', hub: 'speyer', at: gNear(5160, 1110), art: 'fuhrmann', fuhr: 'speyer',
    greet: ['Von Speyer aus fahre ich die Hohe Straße nach Osten. Setzt Euch auf die Säcke, es wird holprig.'] },
  { id: 'fuhrmann_an', name: 'Fuhrmann Gottfried', role: 'Reisen', hub: 'annaberg', at: gNear(2860, 3420), art: 'fuhrmann', fuhr: 'annaberg',
    greet: ['Ich fahre Silber nach Augsburg zu den Fuggern. Ein Ritter auf dem Wagen ist mir nur recht.'] },
  // Kriegszüge: der Werber vor dem Nordtor von Augsburg, der Schiffmeister an der Donaulände
  { id: 'werber', name: 'Hauptmann Kaspar Winzerer', role: 'Kriegszug nach Pavia', at: gNear(7530, 3470), kz: 'pavia',
    greet: ['Herr Georg von Frundsberg zieht über die Alpen, der Kaiser braucht jeden Spieß in Italien! Vor Pavia liegt der König von Frankreich mit seinem ganzen Heer.',
      'Viel Feind, viel Ehr, sagt der Frundsberg. Wer mit Gefährten kommt, hat bessere Aussichten, heil heimzukehren.',
      'Doppelten Sold für Doppelsöldner, Herr Ritter. Für Euch aber gibt es mehr: Die Kriegskasse des Königs steht in seinem Lager.'] },
  { id: 'schiffmeister', name: 'Schiffmeister Ulrich', role: 'Kriegszug nach Wien', at: gNear(7690, 3046), kz: 'wien',
    greet: ['Meine Ulmer Schachtel fährt die Donau hinab bis nach Wien. Graf Salm braucht dort jeden Mann, die Türken stehen vor der Stadt.',
      'Der Sultan Süleyman hat hundertzwanzigtausend Mann. Seine Mineure graben Stollen unter die Mauern und füllen sie mit Pulver.',
      'Nehmt Gefährten mit. In den Gegenminen ist es eng, dunkel, und die Zeit läuft gegen Euch.'] }
];
for (const n of OST_NPC){ n.x = n.at.x; n.y = n.at.y; n.art = NPC_ART[n.art || n.id]; n.key = n.id; NPCS.push(n); }
for (const [hub, id] of [['wittenberg', 'cranach'], ['nuernberg', 'pirckheimer'], ['augsburg', 'mschwarz']]){ const n = NPCS.find(q => q.id === id); if (n) BIND[hub] = { x: n.x, y: n.y + 30 }; }

/* ---------- Aufträge: Cranach (Heide, ab Stufe 10), Pirckheimer (Reichswald und Gailingen, ab 14), Schwarz (Donauried und Lechfeld, ab 22) ---------- */
for (const q of [
  { id: 'w1', giver: 'cranach', lvl: 10, kind: 'kreuzotter', zone: 'heide', need: 8, t: 'Ottern in der Heide',
    d: 'Die Schäfer in der Heide verlieren jede Woche Schafe an die Kreuzottern. Erschlagt acht von ihnen. Ihr Gift brauche ich ohnehin für meine Arzneien.' },
  { id: 'w2', giver: 'cranach', lvl: 11, kind: 'strauchdieb', zone: 'heide', need: 8, t: 'Strauchdiebe am Elbweg', after: 'w1',
    d: 'Studenten, die nach Wittenberg wollen, werden auf der Hohen Straße ausgeraubt. Acht Strauchdiebe sollen dafür büßen.' },
  { id: 'w3', giver: 'cranach', lvl: 12, kind: 'irrwisch', zone: 'heide', need: 6, t: 'Die Irrwische', after: 'w2',
    d: 'Über den Heideweihern tanzen nachts rote Lichter und locken die Leute ins Moor. Löscht sechs Irrwische aus.' },
  { id: 'w4', giver: 'cranach', lvl: 14, boss: 'hackelberg', zone: 'heide', need: 1, t: 'Hackelberg, der Wilde Jäger', after: 'w3',
    d: 'Hans von Hackelberg wollte bis zum Jüngsten Tag jagen, statt in den Himmel zu kommen. Gott hat ihn beim Wort genommen. Er reitet vom Hünengrab im Osten der Heide aus, mit seinen Hunden. Stellt ihn.' },
  { id: 'n1', giver: 'pirckheimer', lvl: 14, kind: 'keiler', zone: 'reichswald', need: 8, t: 'Keiler im Reichswald',
    d: 'Die Keiler im Reichswald sind dieses Jahr so stark wie nie. Sie verwüsten die Felder im Knoblauchsland. Erlegt acht von ihnen.' },
  { id: 'n2', giver: 'pirckheimer', lvl: 15, kind: 'moosweib', zone: 'reichswald', need: 6, t: 'Die Moosweiblein', after: 'n1',
    d: 'Die Zeidler im Wald klagen über Moosweiblein, die ihre Bienenstöcke plündern und die Leute in die Irre führen. Sechs von ihnen, bitte.' },
  { id: 'n3', giver: 'pirckheimer', lvl: 16, kind: 'strauchdieb', zone: 'reichswald', need: 10, t: 'Die Goldene Straße', after: 'n2',
    d: 'Auf der Straße durch den Reichswald lauern Strauchdiebe auf die Kaufleute aus Prag. Zehn von ihnen, dann ist der Weg wieder frei.' },
  { id: 'n4', giver: 'pirckheimer', lvl: 18, kind: 'reisiger', zone: 'gailingen', need: 8, t: 'Die Reisigen von Gailingen', after: 'n3',
    d: 'Eppelein hält sich eine Schar Reisiger auf seiner Burg nordöstlich der Stadt. Schlagt acht von ihnen, dann wird er unruhig.' },
  { id: 'n5', giver: 'pirckheimer', lvl: 20, kind: 'armbrust', zone: 'gailingen', need: 8, t: 'Schützen auf den Mauern', after: 'n4',
    d: 'Von den Mauern der Burg schießen seine Armbrustschützen auf jeden, der sich nähert. Holt acht von ihnen herunter.' },
  { id: 'n6', giver: 'pirckheimer', lvl: 22, boss: 'eppelein', zone: 'gailingen', need: 1, t: 'Eppelein von Gailingen', after: 'n5',
    d: 'Nun zu ihm selbst. Eppelein reitet einen Fuchs, der über jeden Graben springt. Die Nürnberger hängen keinen, sie hätten ihn denn, sagt er. Fangt ihn!' },
  { id: 'a1', giver: 'mschwarz', lvl: 22, kind: 'riesenkrebs', zone: 'donauried', need: 8, t: 'Krebse im Ried',
    d: 'Im Donauried kriechen Krebse, so groß wie Hunde, aus dem Schlamm und zwicken den Pferden die Beine ab. Acht davon, und unsere Fuhren kommen wieder durch.' },
  { id: 'a2', giver: 'mschwarz', lvl: 23, kind: 'irrwisch', zone: 'donauried', need: 8, t: 'Lichter über dem Ried', after: 'a1',
    d: 'Nachts führen Irrwische unsere Fuhrleute in die Tümpel. Ein Wagen voll Barchent ist schon versunken. Löscht acht von ihnen aus.' },
  { id: 'a3', giver: 'mschwarz', lvl: 24, kind: 'moor', zone: 'donauried', need: 8, t: 'Die Toten im Ried', after: 'a2',
    d: 'Aus dem Schlamm steigen Moorleichen, die man vor Jahrhunderten dort versenkt hat. Gebt acht von ihnen ihre Ruhe.' },
  { id: 'a4', giver: 'mschwarz', lvl: 26, boss: 'donauweibchen', zone: 'donauried', need: 1, t: 'Das Donauweibchen', after: 'a3',
    d: 'Wer am Ufer der Donau ihr Lied hört, geht ins Wasser und kommt nicht wieder. Das Donauweibchen haust im Ried, nicht weit von der Quelle. Bringt sie zum Schweigen.' },
  { id: 'a5', giver: 'mschwarz', lvl: 27, kind: 'geisterreiter', zone: 'lechfeld', need: 8, t: 'Reiter in der Nacht', after: 'a4',
    d: 'Auf dem Lechfeld reiten nachts die Ungarn, die vor fast sechshundert Jahren dort fielen. Acht Geisterreiter, dann wagen sich die Bauern wieder auf die Felder.' },
  { id: 'a6', giver: 'mschwarz', lvl: 28, kind: 'geisterbogner', zone: 'lechfeld', need: 8, t: 'Pfeile aus dem Nebel', after: 'a5',
    d: 'Ihre Bogenschützen treffen aus dem Sattel auf hundert Schritt. Bringt acht von ihnen zur Ruhe.' },
  { id: 'a7', giver: 'mschwarz', lvl: 30, boss: 'bulcsu', zone: 'lechfeld', need: 1, t: 'Bulcsú, der Geisterfürst', after: 'a6',
    d: 'Bulcsú führte die Ungarn damals an. Man hängte ihn in Regensburg, aber seine Seele reitet noch. Beim Ungarnstein im Süden des Lechfelds sammelt er sein Heer. Nur ein Ritter auf der Höhe seiner Kraft kann ihn bezwingen.' }
]){ QUESTS.push(q); QDEF[q.id] = q; }

/* ---------- Fuhrmann: Reisen zwischen den großen Städten ---------- */
const FUHR = {
  stadt: { name: 'Reichsstadt', npc: 'fuhrmann_s' }, speyer: { name: 'Speyer', npc: 'fuhrmann_sp' }, annaberg: { name: 'Bergstadt Annaberg', npc: 'fuhrmann_an' },
  wittenberg: { name: 'Wittenberg', npc: 'fuhrmann_w' }, nuernberg: { name: 'Nürnberg', npc: 'fuhrmann_n' }, augsburg: { name: 'Augsburg', npc: 'fuhrmann_a' }
};
const fuhrNpc = id => NPCS.find(q => q.id === FUHR[id].npc);
function fuhrCost(from, to){
  const a = fuhrNpc(from), b = fuhrNpc(to);
  if (!a || !b) return 0;
  return Math.round((6 + Math.hypot(a.x - b.x, a.y - b.y) / WS / 180) * (1 + HERO.lvl * .12));
}
function fuhrTo(from, to){
  const n = fuhrNpc(to), cost = fuhrCost(from, to);
  if (!n || HERO.gold < cost || G.mode !== 'menu') return false;
  HERO.gold -= cost; closePanel();
  if (riding()) dismount(true);
  Sound.coin();
  const k = G.knight, p = gNear(n.x / WS - 30, n.y / WS + 16);
  k.x = p.x; k.y = p.y; k.dir = 'down';
  if (typeof stopFish === 'function') stopFish();
  G.flash = .6; G.mons.length = 0; updateZone(true);
  showBanner('Mit dem Fuhrwerk', FUHR[to].name);
  logLine('Nach langer Fahrt seid Ihr in ' + FUHR[to].name + '. Die Fahrt kostete ' + cost + ' Gulden.', '#9fe08a');
  updateHud(); sendPresence(true); markDirty(true);
  return true;
}

/* ---------- Die Thesen an der Tür der Schlosskirche ---------- */
const THESEN = [
  ['1', 'Da unser Herr und Meister Jesus Christus spricht: Tut Buße, wollte er, dass das ganze Leben der Gläubigen Buße sei.'],
  ['21', 'Darum irren die Ablassprediger, die sagen, dass der Mensch durch den Ablass des Papstes von jeder Strafe frei und selig werde.'],
  ['27', 'Menschenlehre predigen die, die sagen, sobald das Geld im Kasten klingt, fahre die Seele aus dem Fegefeuer.'],
  ['36', 'Jeder Christ, der wahrhaft bereut, hat vollkommenen Erlass von Strafe und Schuld, auch ohne Ablassbrief.'],
  ['43', 'Man soll die Christen lehren: Wer dem Armen gibt oder dem Bedürftigen leiht, tut besser, als wenn er Ablass kauft.'],
  ['62', 'Der wahre Schatz der Kirche ist das heilige Evangelium von der Herrlichkeit und Gnade Gottes.']
];

/* ---------- Gesprächsoptionen und Ansichten ---------- */
function ostTalkOpts(n, opts){
  if (n.fuhr){
    opts.append(btn('Mit dem Fuhrwerk reisen', () => renderTalk('ostFuhr'), 'opt'));
  }
  if (n.id === 'stiftsherr'){
    opts.append(btn('Die Thesen an der Tür lesen' + (HERO.thesen ? '' : ' (neu)'), () => renderTalk('ostThesen'), 'opt'));
  }
  kzTalkOpts(n, opts);
  if (n.id === 'fugger'){
    opts.append(btn('Erzählt von der Fuggerei', () => { G.greet = 'Hundertsechs Wohnungen, jede mit eigener Tür, eigener Küche und einem kleinen Garten. Wer dort wohnt, zahlt einen rheinischen Gulden im Jahr. Das ist mein Werk für die Ewigkeit, Herr Ritter.'; renderTalk('main'); }, 'opt'));
  }
}
function ostView(view, body, opts){
  const n = G.talk;
  if (view === 'ostFuhr'){
    $('talkText').textContent = 'Wohin soll es gehen? Ihr habt ' + HERO.gold + ' Gulden. Unterwegs könnt Ihr nicht kämpfen und nichts verlieren.';
    for (const to of Object.keys(FUHR)){
      if (to === n.fuhr) continue;
      const c = fuhrCost(n.fuhr, to), b = btn(FUHR[to].name + ' (' + c + ' Gulden)', () => fuhrTo(n.fuhr, to), 'opt');
      b.disabled = HERO.gold < c || !fuhrNpc(to);
      opts.append(b);
    }
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  } else if (view === 'ostThesen'){
    $('talkText').textContent = 'An der Tür hängt ein Druck der Disputation zur Erklärung der Kraft des Ablasses, die Doktor Martin Luther im Jahr 1517 verfasst hat. Ein paar Sätze daraus:';
    const box = el('div', 'thesen');
    for (const [nr, t] of THESEN){ const p = el('p'); p.append(el('b', null, nr + '. '), t); box.append(p); }
    body.append(box);
    if (!HERO.thesen){
      HERO.thesen = 1;
      const xp = Math.round(xpNeed(HERO.lvl) * .08);
      gainXp(xp);
      logLine('Ihr lest die Thesen an der Tür der Schlosskirche. (+' + xp + ' EP)', '#ecd27a');
      markDirty(true);
    }
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts);
  }
}

/* ============ Kriegszüge: Pavia 1525 und Wien 1529 ============
   Zwei Abenteuer für Gruppen, die man beim Werber vor Augsburg und beim Schiffmeister an der Donaulände beginnt. Sie laufen im Gewölbe
   (eigene Karte, eigene Gegner), haben aber Ziele, die nacheinander erfüllt werden (M.kz.step). Gefährten teilen offene Tore und
   gelöschte Lunten über die Anwesenheit (go: Tore als Zahl, Hebel als 10 + Nummer). Die Stufe richtet sich nach dem stärksten Gefährten.
   Pavia: Die Kanone sprengt die Mauer des Tiergartens, dann vierzehn Feinde im Park, dann fällt die Palisade vor dem Lager des Königs.
   Wien: Sieben Minuten, um die Lunten in drei Pulverkammern zu löschen, sonst fliegt die Mine in die Luft; dann der Aga. */
DG_DEF.pavia = { name: 'Die Schlacht bei Pavia', kz: true, base: [24, 28], lvl: [0, 2], cols: 48, rows: 50, style: 4, dark: .45, seed: 1525, lever: 'kanone',
  rooms: [[19, 2, 10, 6, 'lager'], [17, 12, 14, 7, 'bresche'], [3, 22, 12, 10, 'park'], [18, 22, 12, 10, 'park'], [33, 22, 12, 10, 'park'], [16, 36, 16, 12, 'vault']],
  links: [[0, 1], [1, 3], [3, 2], [3, 4], [3, 5]],
  gates: [{ a: 0, row: 9, kind: 'ruine_mauer' }, { a: 3, row: 33, kind: 'palisade' }],
  levers: [{ room: 0, gate: 0 }],
  mobs: { bresche: [['schweizer', 3], ['arkebusier', 2]], park: [['schweizer', 2], ['gendarm', 1], ['arkebusier', 1]], vault: [['gendarm', 2], ['schweizer', 1]] },
  elite: { k: 'franz', name: 'König Franz I. von Frankreich' }, chest: 'die Kriegskasse des Königs', chestN: 'die Kriegskasse des Königs', need: 14,
  short: 'Pavia 1525', lvN: 'Kanone abfeuern', lvDone: 'Die Kanone hat gefeuert',
  goals: ['Feuert die Kanone auf die Mauer des Tiergartens', 'Schlagt das Heer im Tiergarten: {n} / {need}', 'Stellt König Franz in seinem Lager'],
  gateT: [['Bresche geschossen', 'Hinein in den Tiergarten von Mirabello', 'Die Kanone donnert, die Mauer des Tiergartens bricht in einer Wolke aus Staub! Durch die Bresche stürmen die Landsknechte in den nebligen Park.'],
    ['Die Palisade fällt', 'Dahinter liegt das Lager des Königs', 'Der Tiergarten ist genommen. Die Landsknechte reißen die Palisade nieder. Dahinter steht das Zelt des Königs von Frankreich.']],
  intro: 'Pavia, am Morgen des 24. Februar 1525. Nebel liegt über dem Tiergarten von Mirabello, in dem das französische Heer lagert. Feuert die Kanone am Nordrand des Lagers auf die Mauer, dann hinein mit den Landsknechten! Mit Gefährten geht es leichter.',
  win: ['König Franz ergibt sich', 'Der Sieg von Pavia gehört dem Kaiser'],
  winL: 'König Franz I. ist vom Pferd gestürzt und ergibt sich. An seine Mutter schreibt er am Abend: „Von allem ist mir nichts geblieben als die Ehre und das Leben.“ Die Kriegskasse im Zelt gehört Euch.' };
DG_DEF.wien = { name: 'Die Gegenminen vor Wien', kz: true, base: [26, 28], lvl: [0, 2], cols: 46, rows: 48, style: 2, dark: .9, seed: 1529, lever: 'fass', time: 420,
  rooms: [[19, 2, 8, 6, 'entry'], [15, 11, 16, 8, 'mine'], [2, 12, 9, 7, 'pulver'], [35, 12, 9, 7, 'pulver'], [16, 24, 14, 8, 'mine'], [3, 26, 9, 7, 'pulver'], [13, 37, 20, 9, 'vault']],
  links: [[0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [4, 6]],
  gates: [{ a: 4, row: 34 }],
  levers: [{ room: 2, gate: 0 }, { room: 3, gate: 0 }, { room: 5, gate: 0 }],
  mobs: { mine: [['mineur', 2], ['janitschar', 2]], pulver: [['mineur', 1], ['tuefekci', 1]], vault: [['janitschar', 2], ['tuefekci', 1]] },
  names: { mineur: 'Osmanischer Mineur' },
  elite: { k: 'aga', name: 'Der Aga der Janitscharen' }, chest: 'die Kriegskasse des Aga', chestN: 'die Kriegskasse des Aga',
  short: 'Wien 1529', lvN: 'Lunte herausreißen', lvDone: 'Die Lunte ist gelöscht',
  goals: ['Löscht die Lunten in den Pulverkammern: {n} / 3, noch {t}', 'Besiegt den Aga der Janitscharen'],
  gateT: [['Die Mine ist entschärft', 'Hinter dem Gitter wartet der Aga', 'Alle drei Lunten sind gelöscht! Das Fallgitter zum letzten Stollen fährt hoch, und von unten hört man den Aga seine Janitscharen zum Sturm rufen.']],
  intro: 'Wien, im Oktober 1529. Unter dem Kärntnertor haben die Mineure des Sultans drei Pulverkammern gegraben, die Lunten brennen schon. Ihr habt sieben Minuten, um sie alle zu löschen. Mit Gefährten geht es leichter.',
  win: ['Wien hält stand', 'Sultan Süleyman bricht die Belagerung ab'],
  winL: 'Der Aga fällt, die Janitscharen fliehen durch ihre Stollen. Drei Tage später lässt Sultan Süleyman die Zelte abbrechen und zieht ab. Wien ist gerettet, und Ihr wart dabei.' };
UNIQUES.franz = { s: 'helm', n: 'Der Federhelm des Königs Franz', aff: ['crit', 'str', 'hp'] };
UNIQUES.aga = { s: 'kleinod', n: 'Der Reiherbusch des Aga', aff: ['spd', 'crit', 'arm'] };
const kzFoes = () => G.mons.filter(m => !m.elite).length;
function kzEnter(M){
  M.kz = { step: 0, done: {}, kills: 0, n0: kzFoes(), t: M.D.time || 0, tShown: -1, won: false };
  logLine(M.D.intro, '#ffd98a');
  renderTracker();
}
/* was die Gefährten wissen sollen: offene Tore und erledigte Hebel */
function kzGo(M){
  const a = M.openG.slice();
  for (const li of Object.keys(M.kz.done)) a.push(10 + +li);
  return a.length ? a : null;
}
function kzGate(M, gi, mine){
  const gt = M.gates[gi], K = M.kz, T = M.D.gateT[gi]; if (!gt || gt.open || !K) return;
  gt.open = true;
  for (const t of gt.tiles) M.blk[t] = 0;
  M.openG = M.gates.map((g, i) => g.open ? i : -1).filter(i => i >= 0);
  K.step = Math.max(K.step, gi + 1);
  burst(gt.o.x, gt.o.y - 20, M.D.style === 4 ? ['#6e5a42', '#9a948a', '#5c4e3c', '#c9c2ad'] : ['#6e5a42', '#9a948a', '#c9c2ad'], 32, 120); G.shake = .45;
  Sound.thunder(); Sound.tone(70, .9, 'sawtooth', .05, 30);
  showBanner(T[0], T[1]); logLine((mine ? '' : 'Eure Gefährten waren schneller. ') + T[2], '#ffd98a');
  renderTracker(); sendPresence(true);
}
/* Hebel der Kriegszüge: die Kanone in Pavia, die Pulverfässer in Wien */
function kzDone(M, li, mine){
  const K = M.kz, L = M.levers[li]; if (!K || !L || K.done[li]) return;
  K.done[li] = 1;
  if (M.id === 'pavia'){
    G.flash = .35; G.shake = .5; Sound.thunder(); Sound.tone(55, 1.2, 'sawtooth', .06, -10);
    burst(L.o.x + 20, L.o.y - 30, ['#fff4c0', '#ffd060', '#ff9030', '#4a4440'], 26, 130, true);
    floatText(L.o.x, L.o.y - 46, 'Feuer!', '#ffd98a', 1, 1.4);
    kzGate(M, L.gate, mine);
  } else {
    const n = Object.keys(K.done).length, all = n >= M.levers.filter(Boolean).length;
    Sound.tone(900, .5, 'sine', .03, -700); burst(L.o.x, L.o.y - 30, ['#ffd36a', '#9a948a', '#3a3028'], 10, 60);
    floatText(L.o.x, L.o.y - 46, 'Gelöscht ' + n + ' / 3', '#9fe08a', 1, 1.6);
    logLine((mine ? 'Ihr reißt die brennende Lunte aus dem Pulverfass' : 'Ein Gefährte hat eine Lunte gelöscht') + ' (' + n + ' von 3).', '#9fe08a');
    if (mine && !all){   // die Mineure merken es und stürzen herbei
      for (let j = 0; j < 2; j++){ const p = dgRandWalk(L.o.x, L.o.y + 40, 50, 110); if (p) G.rising.push({ kind: j ? 'janitschar' : 'mineur', x: p.x, y: p.y, t: .8 + j * .3, lvl: M.lvl[1], engage: true }); }
      logLine('Aus einem Seitenstollen stürzen Türken herbei!', '#ff9a8a');
    }
    if (all) kzGate(M, L.gate, mine);
  }
  G.dgNear = 'neu'; dgNear(); renderTracker(); sendPresence(true);
}
function kzPull(li){ const M = DG_ON; if (M && M.kz && !M.kz.won) kzDone(M, li, true); }
function kzTick(M, dt){
  const K = M.kz, D = M.D; if (!K) return;
  const here = 'dg:' + M.id;
  for (const q of PEERS.values()) if (q.in === here && q.go) for (const v of q.go){
    if (v >= 10){ if (M.levers[v - 10] && !K.done[v - 10]) kzDone(M, v - 10, false); }
    else if (M.gates[v] && !M.gates[v].open) kzGate(M, v, false);
  }
  // brennende Lunten an den Pulverfässern, Rauch über der abgefeuerten Kanone
  for (const [li, L] of M.levers.entries()) if (L && G.parts.length < 400 && Math.random() < dt * (M.id === 'wien' ? (K.done[li] ? 0 : 16) : K.done[li] ? 5 : 0)){
    const w = M.id === 'wien', o = L.o;
    G.parts.push(w ? { x: o.x + rand(-2, 2), y: o.y - 26, vx: rand(-18, 18), vy: rand(-50, -20), life: rand(.25, .5), c: Math.random() < .5 ? '#ffd36a' : '#ff8a2a', g: 60, glow: true }
      : { x: o.x + 22 + rand(-3, 3), y: o.y - 24, vx: rand(-6, 6), vy: rand(-24, -10), life: rand(1, 2), c: '#8a8680', g: -4, s: 2 });
  }
  if (K.won) return;
  if (D.need && K.step === 1){
    const n = clamp(K.n0 - kzFoes(), 0, D.need);
    if (n !== K.kills){ K.kills = n; renderTracker(); }
    if (n >= D.need) kzGate(M, 1, true);
  }
  if (D.time && K.step === 0){
    K.t -= dt;
    const s = Math.max(0, Math.ceil(K.t));
    if (s !== K.tShown){
      K.tShown = s; renderTracker();
      if (s === 120 || s === 60 || s === 30 || s === 10){ logLine('Noch ' + (s >= 60 ? s / 60 + (s === 60 ? ' Minute' : ' Minuten') : s + ' Sekunden') + ', dann fliegt die Mine in die Luft!', '#ff9a8a'); Sound.tone(440, .15, 'square', .03); }
    }
    if (K.t <= 0) return kzBlast(M);
  }
  if (K.step >= D.gates.length && !G.mons.some(m => m.elite)) kzWin(M);
}
function kzBlast(M){
  const k = G.knight;
  M.kz.t = 0; M.kz.won = true;
  Sound.thunder(); Sound.tone(50, 1.4, 'sawtooth', .07, -20); G.flash = .9; G.shake = .8;
  for (const L of M.levers) if (L) burst(L.o.x, L.o.y - 20, ['#ffd36a', '#ff7020', '#3a3028', '#9a948a'], 40, 160, true);
  showBanner('Die Mine fliegt in die Luft', 'verschüttet, aber am Leben');
  logLine('Zu spät! Die Pulverkammern gehen hoch, der Stollen stürzt ein. Halb taub und voller Staub zieht man Euch aus dem Schutt. Versucht es noch einmal, schneller und mit Gefährten.', '#ff9a8a');
  leaveDungeon(true);
  k.hp = Math.max(1, Math.round(k.hp * .35)); updateHud(); renderTracker();
}
function kzWin(M){
  const K = M.kz, D = M.D, k = G.knight;
  K.won = true; K.step = 99;
  HERO.kz = HERO.kz || {};
  const first = !HERO.kz[M.id];
  HERO.kz[M.id] = (HERO.kz[M.id] | 0) + 1;
  Sound.horn(); G.flash = .4;
  showBanner(D.win[0], D.win[1]); logLine(D.winL, '#ecd27a');
  const xp = Math.round(xpNeed(Math.min(HERO.lvl, MAX_LVL - 1)) * (first ? .25 : .06));
  if (xp > 0){ gainXp(xp); floatText(k.x, k.y - KS.ay - 22, '+' + xp + ' EP', '#c9a6ff', 1, 1.6); }
  const u = UNIQUES[D.elite.k], L = M.lvl[1] + 1;
  if (first || Math.random() < .15) dropLoot({ x: k.x, y: k.y + 10 }, 'item', 0, makeItem(u.s, L, 4, { name: u.n, aff: u.aff, u: D.elite.k }));
  for (const mm of G.mons.slice()){ burst(mm.x, mm.y - 20, DEATH_COLORS[mm.k] || ['#9a948a'], 8, 60); G.mons.splice(G.mons.indexOf(mm), 1); }   // der Rest des Heeres flieht
  pushFame(); renderTracker(); updateHud(); markDirty(true);
}
/* Zeile im Auftragskasten */
function kzRows(box){
  const M = DG_ON; if (!M || !M.kz) return;
  const K = M.kz, D = M.D, p = el('p', K.won ? 'done' : 'ev');
  const t = Math.max(0, Math.ceil(K.t)), mm = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  const g = K.won ? (K.step === 99 ? D.win[0] : 'gescheitert') : D.goals[Math.min(K.step, D.goals.length - 1)].replace('{n}', D.need ? K.kills : Object.keys(K.done).length).replace('{need}', D.need || 3).replace('{t}', mm);
  p.append(el('b', null, D.short + ': '), g);
  box.append(p);
}
/* der Werber und der Schiffmeister */
const KZ_MIN = { pavia: 24, wien: 26 };
function kzStart(n){
  const id = n.kz, D = DG_DEF[id];
  if (HERO.lvl < KZ_MIN[id]){ G.greet = 'Kommt wieder, wenn Ihr Stufe ' + KZ_MIN[id] + ' erreicht habt. Dort draußen sterben selbst erfahrene Ritter.'; renderTalk('main'); return; }
  closePanel();
  enterDungeon({ dg: id, x: n.x, y: n.y + 6, name: D.name });
}
function kzTalkOpts(n, opts){
  if (!n.kz) return;
  const id = n.kz, b = btn((id === 'pavia' ? 'Mit Frundsberg nach Pavia ziehen' : 'Mit der Ulmer Schachtel nach Wien fahren') + ' (ab Stufe ' + KZ_MIN[id] + (HERO.kz && HERO.kz[id] ? ', schon ' + HERO.kz[id] + '-mal gesiegt' : '') + ')', () => kzStart(n), 'opt');
  opts.append(b);
  opts.append(btn(id === 'pavia' ? 'Erzählt von Pavia' : 'Erzählt von Wien', () => {
    G.greet = id === 'pavia' ? 'König Franz belagert Pavia seit Oktober. Antonio de Leyva hält die Stadt mit Landsknechten und Spaniern, aber das Geld geht ihm aus. Wir greifen nachts an, durch die Mauer des Tiergartens, wo der König sein Lager hat. Am Ende werden wir ihn stellen. Ein König, gefangen von Landsknechten, das hat die Welt noch nicht gesehen!'
      : 'Die Türken haben Ungarn genommen, nun stehen sie vor Wien. Ihre Mineure graben unter dem Kärntnertor. Wir graben ihnen entgegen, in Gegenminen, und wer zuerst das Pulver findet, gewinnt. Unten wartet der Aga der Janitscharen mit seinen besten Männern.';
    renderTalk('main'); }, 'opt'));
}
for (const id of ['pavia', 'wien']){
  const D = DG_DEF[id], li = el('li'), im = el('img'), wh = el('span', 'what', D.name);
  lazySrc(im, () => urlOf(wp_paintV(id === 'pavia' ? 'kanone' : 'fass', 0, 1).img, 1)); im.alt = ''; im.className = 'horseimg';
  wh.append(el('small', null, id === 'pavia' ? 'Kriegszug beim Werber vor dem Nordtor von Augsburg, ab Stufe 24, für Gruppen: Kanone auf die Mauer des Tiergartens, vierzehn Feinde im Park, dann König Franz in seinem Lager. Er bewacht ' + D.chest + '.'
    : 'Kriegszug beim Schiffmeister an der Donaulände, ab Stufe 26, für Gruppen: In sieben Minuten die Lunten in drei Pulverkammern löschen, dann den Aga der Janitscharen besiegen. Er bewacht ' + D.chest + '.'));
  li.append(im, wh); $('dgList').append(li);
}
