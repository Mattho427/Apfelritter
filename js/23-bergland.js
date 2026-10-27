"use strict";
/* Der Apfelritter, Teil 23 von 28: Das Bergland: Bergstadt Silberberg, ihre Leute, die Aufträge des Bergmeisters.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */

/* ============ Das Bergland (Version 25) ============
   Südlich der Königsstadt liegt das Bergland: Schwarztann, Silberrevier, Söldnerschanze und Hochgebirge, in der Mitte die
   Bergstadt Silberberg. Hier geht es von Stufe 19 bis 30. Der Bergmeister vergibt die Aufträge, im Gasthaus Zur Silbernen Kanne
   kann man rasten, in der St. Annenkirche beten. */
NPC_ART.bergmeister = np_frames({ robe: 'long', hat: 'barett', fur: true, chain: true, belt: true, staff: true, beard: true, hair: ['h', 'j'] },
  { 1: '#141218', 2: '#221e28', 3: '#322c3a', 4: '#463e50', 5: '#e2ded0', 6: '#c8c4b2', 7: '#aaa696', 8: '#8a8678' });
NPC_ART.kraemerin3 = np_frames({ robe: 'long', hat: 'haube', apron: 'linen' }, { 1: '#2e3a1c', 2: '#46562a', 3: '#5e7038', 4: '#7c8c4c', 5: '#3a2c1e', 6: '#4a3a28', 7: '#5a4a34', 8: '#6e5c44' });
NPC_ART.schmied2 = np_frames({ robe: 'short', apron: 'leather', belt: true, beard: true, hairSide: true, hair: ['j', 'h'], sleeve: ['s', 't', 'u', 'v'] },
  { 1: '#2a2420', 2: '#3a322c', 3: '#4a4038', 4: '#5c5048', 5: '#2a2420', 6: '#3a322c', 7: '#4a4038', 8: '#5c5048' });
NPC_ART.stall2 = np_frames({ robe: 'short', hat: 'filz', belt: true, beard: true, hair: ['h', 'j'] },
  { 1: '#3a2c1e', 2: '#4e3c28', 3: '#645036', 4: '#7c6646', 5: '#2c3424', 6: '#3e4a32', 7: '#526044', 8: '#6a7a58', R: '#8a1c1c' });
for (const n of [
  { id: 'bergmeister', name: 'Bergmeister Kaspar Eibenstock', role: 'Aufträge', hub: 'annaberg', at: gNear(2830, wo_ANNA.gy + 34), quest: true,
    greet: ['Glück auf, Herr Ritter! Das Silber macht Silberberg reich, aber die Berge geben es nicht umsonst her.', 'Wölfe im Tann, Kobolde in den Gruben, Landsknechte vor den Toren. Ich brauche jeden Mann, der ein Schwert führen kann.', 'Vor zwanzig Jahren stand hier nur Wald. Heute prägen wir Taler aus unserem Silber.'] },
  { id: 'kraemerin3', name: 'Krämerin Anna', role: 'Händlerin', hub: 'annaberg', at: gNear(3070, wo_ANNA.gy + 40), shop: true,
    greet: ['Heiltränke und alles, was ein Ritter im Gebirge braucht. Und ich kaufe, was Ihr dort findet.', 'Silbererz? Bärenfell? Zeigt her!'] },
  { id: 'schmied2', name: 'Schmied Merten', role: 'Schmied', hub: 'annaberg', at: gNear(2700, wo_ANNA.gy + 36), smith: true,
    greet: ['Bergeisen ist das härteste, das es gibt. Gebt mir Eure Rüstung, ich mache sie besser.', 'Die Knappen bringen mir ihre Eisen jeden Tag. Für einen Ritter nehme ich mir Zeit.'] },
  { id: 'stall2', name: 'Stallmeister Veit', role: 'Pferde', hub: 'annaberg', at: gNear(2760, 3446), stable: true,
    greet: ['Im Gebirge braucht Ihr ein trittsicheres Pferd, Herr Ritter.', 'Meine Pferde ziehen Erzwagen den ganzen Tag. Die tragen auch einen Ritter.'] }
]){ n.x = n.at.x; n.y = n.at.y; n.art = NPC_ART[n.id]; n.key = n.id; NPCS.push(n); }
{ const bm = NPCS.find(n => n.id === 'bergmeister'); if (bm) BIND.annaberg = { x: bm.x, y: bm.y + 30 }; }

/* ---------- Aufträge des Bergmeisters (Stufe 19 bis 30) ---------- */
for (const q of [
  { id: 'g1', giver: 'bergmeister', lvl: 19, kind: 'wolf', zone: 'schwarzwald', need: 8, t: 'Wölfe im Schwarztann',
    d: 'Die Fuhrleute, die Holz für unsere Gruben bringen, werden von Wolfsrudeln angefallen. Erschlagt acht Grauwölfe, dann kommen die Wagen wieder durch.' },
  { id: 'g2', giver: 'bergmeister', lvl: 20, kind: 'wegelagerer', zone: 'schwarzwald', need: 8, t: 'Das Räuberlager', after: 'g1',
    d: 'Auf einer Lichtung im Tann lagern Wegelagerer und rauben die Silberfuhren aus. Acht von ihnen müssen fallen.' },
  { id: 'g3', giver: 'bergmeister', lvl: 21, kind: 'schrat', zone: 'schwarzwald', need: 6, t: 'Die Waldschrate', after: 'g2',
    d: 'Die Köhler schwören, die Bäume selbst gingen auf sie los: Waldschrate, alt wie der Wald. Fällt sechs von ihnen.' },
  { id: 'g4', giver: 'bergmeister', lvl: 22, boss: 'tatzelwurm', zone: 'schwarzwald', need: 1, t: 'Der Tatzelwurm', after: 'g3',
    d: 'In der Teufelsschlucht haust der Tatzelwurm, mit dem Kopf einer Katze und dem Leib einer Echse. Sein Biss ist giftig. Folgt dem Pfad über den Silberbach.' },
  { id: 'g5', giver: 'bergmeister', lvl: 21, kind: 'kobold', zone: 'silberrevier', need: 10, t: 'Kobolde in den Gruben', after: 'g1',
    d: 'Kobolde stehlen unser Gezähe und lassen die Grubenlampen verlöschen. Zehn von ihnen, und die Knappen fahren wieder ein.' },
  { id: 'g6', giver: 'bergmeister', lvl: 22, kind: 'grubengeist', zone: 'silberrevier', need: 8, t: 'Die verschütteten Knappen', after: 'g5',
    d: 'Vor Jahren hat ein Wassereinbruch zwanzig Knappen begraben. Nun steigen ihre Geister aus den Halden. Gebt acht von ihnen ihre Ruhe.' },
  { id: 'g7', giver: 'bergmeister', lvl: 24, boss: 'bergmoench', zone: 'silberrevier', need: 1, t: 'Der Bergmönch', after: 'g6',
    d: 'Im Altenberg-Stollen wandelt der Bergmönch, groß wie zwei Männer, mit einer Lampe, die nie verlöscht. Wer ihn sieht, kehrt selten wieder. Ihr müsst es versuchen.' },
  { id: 'g8', giver: 'bergmeister', lvl: 23, kind: 'doppelsoeldner', zone: 'schanze', need: 8, t: 'Landsknechte ohne Sold', after: 'g5',
    d: 'Ein Haufen Landsknechte hat sich östlich der Stadt verschanzt und verlangt Brandschatzung. Acht Doppelsöldner, dann verhandeln sie anders.' },
  { id: 'g9', giver: 'bergmeister', lvl: 24, kind: 'hakenschuetze', zone: 'schanze', need: 8, t: 'Hakenbüchsen', after: 'g8',
    d: 'Ihre Hakenbüchsen schießen weiter als jede Armbrust. Bringt acht Schützen zum Schweigen, ehe sie unsere Fuhren beschießen.' },
  { id: 'g10', giver: 'bergmeister', lvl: 26, boss: 'feldhauptmann', zone: 'schanze', need: 1, t: 'Feldhauptmann Balthasar Wüst', after: 'g9',
    d: 'Balthasar Wüst führt den Haufen. Er hat in vielen Kriegen jenseits der Berge gefochten und fürchtet weder Gott noch König. Stellt ihn in seiner Schanze.' },
  { id: 'g11', giver: 'bergmeister', lvl: 26, kind: 'baer', zone: 'hochgebirge', need: 6, t: 'Bären am Pass', after: 'g10',
    d: 'Am Passweg ins Hochgebirge reißen Bären die Saumtiere. Sechs Braunbären, dann können die Säumer wieder ziehen.' },
  { id: 'g12', giver: 'bergmeister', lvl: 27, kind: 'geier', zone: 'hochgebirge', need: 8, t: 'Bartgeier', after: 'g11',
    d: 'Die Bartgeier stoßen auf alles herab, was sich am Fels bewegt. Holt acht von ihnen vom Himmel.' },
  { id: 'g13', giver: 'bergmeister', lvl: 28, kind: 'eislicht', zone: 'hochgebirge', need: 8, t: 'Eislichter', after: 'g12',
    d: 'Über den Schneefeldern tanzen Eislichter und locken Wanderer in den Abgrund. Löscht acht von ihnen aus.' },
  { id: 'g14', giver: 'bergmeister', lvl: 30, boss: 'ruebezahl', zone: 'hochgebirge', need: 1, t: 'Rübezahl', after: 'g13',
    d: 'Hinter den Gletschern sitzt Rübezahl auf seinem Felsenthron, der Herr der Berge. Er schickt Stürme und Lawinen. Nur ein Ritter auf der Höhe seiner Kraft kann ihm trotzen.' }
]){ QUESTS.push(q); QDEF[q.id] = q; }

/* ---------- Meisterschaften im Rucksack: ab Stufe 20 je zwei Stufen eine Wahl ---------- */
const talFree = () => HERO.lvl < 20 ? 0 : MEISTER.filter(t => HERO.lvl >= t.lvl && !(HERO.tal || {})[t.lvl]).length;
const talResetCost = () => 100 + HERO.lvl * 20;
function talButton(box){
  if (HERO.lvl < 20) return;
  const n = talFree(), b = btn('Meisterschaften' + (n ? ' (' + n + ' frei)' : ''), () => { G.talView = true; G.sel = null; renderBag(); }, 'btn small');
  b.dataset.slot = 'tal';
  box.append(b);
}
function talView(box){
  const T = HERO.tal || (HERO.tal = {}), safe = isSafe(G.zone) || !!G.inside;
  box.append(el('h4', 'talh', 'Meisterschaften'), el('p', 'hint', 'Ab Stufe 20 dürft Ihr alle zwei Stufen eine Meisterschaft wählen. Die Wahl gilt, bis Ihr sie in einer Stadt oder einem Gasthaus gegen Gulden neu ordnet.'));
  for (const t of MEISTER){
    const row = el('div', 'talrow' + (HERO.lvl < t.lvl ? ' locked' : '')), head = el('b', null, 'Stufe ' + t.lvl);
    row.append(head);
    for (const o of t.opts){
      const cur = T[t.lvl] === o.id, b = btn(o.n, () => {
        if (T[t.lvl] || HERO.lvl < t.lvl) return;
        T[t.lvl] = o.id; refreshStats(); updateHud(); markDirty(true); Sound.quest();
        logLine('Meisterschaft gewählt: ' + o.n + ' (' + o.d + ').', '#ecd27a'); renderBag();
      }, 'tbtn talopt' + (cur ? ' sel' : ''));
      b.title = o.d; b.disabled = HERO.lvl < t.lvl || (!!T[t.lvl] && !cur); b.dataset.slot = 'tal:' + o.id;
      const w = el('span', 'talo'); w.append(b, el('small', null, o.d)); row.append(w);
    }
    box.append(row);
  }
  const acts = el('div', 'acts');
  if (Object.keys(T).length){
    const c = talResetCost(), r = btn('Neu ordnen (' + c + ' Gulden)', () => {
      if (!safe || HERO.gold < c) return;
      HERO.gold -= c; HERO.tal = {}; refreshStats(); updateHud(); markDirty(true); Sound.coin(); logLine('Ihr ordnet Eure Meisterschaften neu.', '#ecd27a'); renderBag();
    }, 'tbtn');
    r.disabled = !safe || HERO.gold < c; r.title = safe ? '' : 'Nur in einer Stadt oder einem Gasthaus';
    acts.append(r);
  }
  acts.append(btn('Zurück', () => { G.talView = false; renderBag(); }, 'tbtn'));
  box.append(acts);
}

/* ---------- Tafel „Das Bergland“: Gebiete, Meisterschaften, Sätze und Fundstücke ---------- */
for (const [z, extra] of [['annaberg', 'Bergmeister, Krämerin, Schmied, Stallmeister, Gasthaus, Kirche'], ['schwarzwald', 'Anführer: der Tatzelwurm'], ['silberrevier', 'Anführer: der Bergmönch'], ['schanze', 'Anführer: Feldhauptmann Balthasar Wüst'], ['hochgebirge', 'Anführer: Rübezahl']]){
  const zz = ZONE_BY_ID[z], li = el('li'), wh = el('span', 'what', zz.name);
  wh.append(el('small', null, (ZONE_LV[z] ? 'Stufe ' + ZONE_LV[z][0] + '–' + ZONE_LV[z][1] + ' · ' : 'sicher · ') + extra));
  li.append(wh); $('blList').append(li);
}
for (const t of MEISTER){
  const li = el('li'), wh = el('span', 'what', 'Stufe ' + t.lvl);
  wh.append(el('small', null, t.opts.map(o => o.n + ' (' + o.d + ')').join(' · ')));
  li.append(wh); $('meisterList').append(li);
}
for (const id in SETS){
  const S = SETS[id], li = el('li'), wh = el('span', 'what', S.n);
  wh.append(el('small', null, Object.values(S.parts).join(', ') + '. ' + S.bon.map(([n, , , t]) => n + ' Teile: ' + t).join(', ') + '. Von den Anführern im Bergland, selten auch von anderen Gegnern ab Stufe 21.'));
  li.append(wh); $('satzList').append(li);
}
{ const li = el('li'), wh = el('span', 'what', 'Fundstücke');
  wh.append(el('small', null, FUNDE.map(k => UNIQUES[k].n).join(', ') + '. Legendär und sehr selten, bei jedem Gegner ab Stufe 20.'));
  li.append(wh); $('satzList').append(li); }
