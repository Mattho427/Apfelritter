"use strict";
/* Der Apfelritter, Teil 27 von 27: Waffenarten im Kampf, Zeugmeister, Kleine Bibel, Spielstart.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Waffenarten im Kampf: Bolzen, Fähigkeiten je Waffe, Zeugmeister ============
   Die Armbrust schießt statt zu hauen; jeder Schuss zählt wie ein Hieb (sw), Mitspieler erzeugen den Bolzen daraus selbst und
   rechnen ihn wie einen Hieb des anderen. Die Art des Schusses steckt in der Hiebdauer (sl .25 / .26 Fächer / .27 Durchschuss). */
const wtK = k => k === G.knight ? heroWt() : (k.wt || 'schwert');
const WT_SKILL = {
  schwert: { hieb: 'Schwerthieb im Bogen', rund: ['Rundhieb', 'trifft alles rundherum, 140 % Schaden'], stoss: ['Schildstoß', 'Sprung nach vorn, betäubt, wehrt Geschosse ab'] },
  hellebarde: { hieb: 'Hieb mit der Hellebarde, trifft weit', rund: ['Weiter Schwung', 'die Hellebarde kreist weit um Euch, 140 % Schaden'], stoss: ['Hellebardenstoß', 'langer Stoß nach vorn, 180 % Schaden, wirft zurück und betäubt'] },
  zweihaender: { hieb: 'Hieb mit dem Zweihänder, breit und schwer', rund: ['Wirbelhieb', 'der Zweihänder kreist um Euch, 180 % Schaden'], stoss: ['Mordschlag', 'schwerer Schlag nach vorn, 240 % Schaden, betäubt'] },
  armbrust: { hieb: 'Bolzen in Blickrichtung, zielt auf den nächsten Gegner davor', rund: ['Bolzenfächer', 'fünf Bolzen zugleich im Fächer, je 75 % Schaden'], stoss: ['Durchschuss', 'ein Bolzen durch alle Gegner hindurch, 220 % Schaden'] }
};
/* Fähigkeitenleiste: Namen und Bilder nach der Waffe */
function wtSkillUi(){
  const w = heroWt(), S = WT_SKILL[w];
  for (const id of ['rund', 'stoss']){ const b = document.querySelector('[data-skill="' + id + '"]'); if (!b) continue; b.title = S[id][0] + ': ' + S[id][1]; b.setAttribute('aria-label', S[id][0] + (touchUI() ? '' : ', Taste ' + (id === 'rund' ? 'R' : 'F'))); }
  const hb = document.querySelector('[data-skill="hieb"]');
  if (hb){ hb.querySelector('img').src = w === 'schwert' ? ICON_URL.sword : wtUrl(w); hb.title = (w === 'armbrust' ? 'Schuss: ' : 'Hieb: ') + S.hieb; hb.setAttribute('aria-label', (w === 'armbrust' ? 'Schuss' : 'Hieb') + (touchUI() ? '' : ', Leertaste')); }
  const ab = $('btnAtk'); if (ab){ ab.textContent = w === 'armbrust' ? 'Schuss' : 'Hieb'; ab.setAttribute('aria-label', w === 'armbrust' ? 'Armbrustschuss' : WT[w].n + 'hieb'); }   // große Taste auf dem Handy
  const ri = document.querySelector('[data-skill="rund"] img'); if (ri) ri.src = wtSkUrl(w, 'rund') || ICON_URL.sweep;
  const si = document.querySelector('[data-skill="stoss"] img'); if (si && w !== 'schwert') si.src = wtSkUrl(w, 'stoss') || wtUrl(w);
  const sb = document.querySelector('[data-skill="stoss"]');
  if (sb && w === 'schwert' && heroBib()){ sb.title = 'Gebet: heilt ' + BIB_HEAL + ' % des Lebens und löst Verlangsamung, ' + BIB_CD + ' Sekunden Pause'; sb.setAttribute('aria-label', 'Gebet' + (touchUI() ? '' : ', Taste F')); if (si) si.src = bibUrl(); }
}
/* Zweihändig: Schild und Zweihandwaffe schließen einander aus; das andere Stück wandert in den Rucksack */
function wtFix(it, i, old){
  if (WT[wtOf(HERO.eq.waffe)].hand !== 2 || !HERO.eq.schild) return true;
  const other = it.s === 'schild' ? 'waffe' : 'schild', j = HERO.inv.indexOf(null);
  if (j < 0){
    HERO.eq[it.s] = old || null; HERO.inv[i] = it;
    logLine('Eine zweihändige Waffe und ' + (isBib(it) || isBib(HERO.eq.schild) ? 'eine Bibel' : 'ein Schild') + ' gehen nicht zusammen, und im Rucksack ist kein Platz für ' + (other === 'schild' ? (isBib(HERO.eq.schild) ? 'die Bibel.' : 'den Schild.') : 'die Waffe.'), '#ff9a8a');
    Sound.click(); renderBag(); return false;
  }
  HERO.inv[j] = HERO.eq[other]; HERO.eq[other] = null;
  logLine(other === 'schild' ? 'Für die zweihändige Waffe kommt ' + (isBib(HERO.inv[j]) ? 'die Bibel' : 'der Schild') + ' in den Rucksack.' : 'Für ' + (isBib(it) ? 'die Bibel' : 'den Schild') + ' kommt die zweihändige Waffe in den Rucksack.', '#d8c69c');
  return true;
}
/* ---------- Armbrust: zielen, schießen, Bolzen ---------- */
function xbAim(k, base){
  let best = null, bd = 400;
  for (const m of G.mons){
    if (!vulnerable(m) || (m.mode === 'idle' && !m.story && aiK(m.k) === 'irrlicht')) continue;
    const c = centerOf(m), gp = gripOf(k), dx = c.x - gp.x, dy = c.y - gp.y, d = Math.hypot(dx, dy);
    if (d > bd) continue;
    const da = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - base), Math.cos(Math.atan2(dy, dx) - base)));
    if (da < .62){ bd = d; best = Math.atan2(dy, dx); }
  }
  return best == null ? base : best;
}
function xbShoot(kind){
  const k = G.knight, [fx, fy] = DIRV[k.dir], a = kind === 1 ? Math.atan2(fy, fx) : xbAim(k, Math.atan2(fy, fx));   // der Fächer streut in Blickrichtung
  k.swing++; k.swA0 = k.swA1 = a; k.atkLen = .25 + kind * .01; k.atkT = .25; k.mult = kind === 1 ? .75 : kind === 2 ? 2.2 : 1; k.skF = false;
  for (const d of kind === 1 ? [-.36, -.18, 0, .18, .36] : [0]) kbFire(k, a + d, k.mult, kind === 2, true);
  Sound.bolt(); if (kind) G.shake = Math.max(G.shake, .08);
  G.combatT = 0; sendPresence(true);
}
function xbPeer(q){
  if (typeof samePlace === 'function' && !samePlace(q)) return;
  if (Math.hypot(q.x - G.knight.x, q.y - G.knight.y) > 1200) return;
  const kind = clamp(Math.round((q.atkLen - .25) * 100), 0, 2);
  for (const d of kind === 1 ? [-.36, -.18, 0, .18, .36] : [0]) kbFire(q, q.swA0 + d, q.mult, kind === 2, false);
}
function kbFire(src, a, mult, pierce, own){
  const gp = gripOf(src), sp = 430;
  (G.kbolts = G.kbolts || []).push({ x: gp.x + Math.cos(a) * 16, y: gp.y + Math.sin(a) * 12, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .85, h: src.y - gp.y, mult, pierce, own, src, hit: new Set() });
}
function kbTick(dt){
  const L = G.kbolts; if (!L || !L.length) return;
  for (let i = L.length - 1; i >= 0; i--){
    const b = L[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let gone = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > GW || b.y > GH || gBlocked(b.x - 1, b.y + b.h - 2, b.x + 1, b.y + b.h, true);
    if (!gone) for (const m of G.mons.slice()){
      if (b.hit.has(m) || !vulnerable(m)) continue;
      if (!bodyCircles(m).some(c => Math.hypot(c.x - b.x, c.y - b.y) < c.hr + 4)) continue;
      b.hit.add(m);
      if (b.own){ const h = rollHit(b.mult), d = Math.round(h.dmg * foeMul(m)); damage(m, d, h.crit, WT.armbrust.kb); leech(d); }
      else { const q = b.src, cb = q.cb || [5, 5], crit = Math.random() * 100 < cb[1]; damage(m, Math.max(1, Math.round(cb[0] * b.mult * rand(.9, 1.1) * (crit ? 1.75 : 1))), crit, WT.armbrust.kb, q); }
      if (!b.pierce){ gone = true; break; }
    }
    if (!gone && b.own && !DG_ON) for (const e of huntTargets({ x: b.x, y: b.y + b.h }, 60)){
      if (b.hit.has(e)) continue;
      const hb = huntBody(e); if (Math.hypot(hb.x - b.x, hb.y - b.y) > hb.r + 4) continue;
      b.hit.add(e); huntHit(e, rollHit(b.mult)); if (!b.pierce){ gone = true; break; }
    }
    if (gone){ L.splice(i, 1); burst(b.x, b.y, ['#c8c0a8', '#8a6a44'], 4, 40); }
  }
}
function kbDraw(){
  const L = G.kbolts; if (!L || !L.length) return;
  for (const b of L){
    const a = Math.atan2(b.vy, b.vx), r = BOLT_ROT[((Math.round(a / (Math.PI * 2) * 32) % 32) + 32) % 32];
    ctx.fillStyle = 'rgba(18,16,22,.3)'; ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y + b.h), 5, 1);
    ctx.drawImage(r.img, Math.round(b.x - r.ox), Math.round(b.y - r.oy));
  }
}
/* Griffpunkt beim Hellebardenstoß: die Waffe fährt nach vorn */
function thrustGp(k, wt){
  const gp = gripOf(k);
  if (wt !== 'hellebarde' || !(k.mult >= 1.75) || !(k.atkT > 0)) return gp;
  const p = 1 - k.atkT / k.atkLen, e = Math.sin(Math.min(1, p * 1.4) * Math.PI) * 12, [fx, fy] = DIRV[k.dir];
  return { x: gp.x + fx * e, y: gp.y + fy * e * .7 };
}

/* ---------- Zeugmeister in der Reichsstadt: Waffen jeder Art und ein Rat dazu ---------- */
NPC_ART.zeugmeister = np_frames({ robe: 'short', hat: 'filz', beard: true, belt: true, apron: 'linen', hair: ['h', 'j'] }, { 1: '#3a2418', 2: '#523424', 3: '#6c4632', 4: '#885a40', 5: '#2a2a30', 6: '#3a3a42', 7: '#4e4e58', 8: '#62626e' });
{ const at = gNear(3060, 2392);
  NPCS.push({ id: 'zeugmeister', key: 'zeugmeister', name: 'Zeugmeister Wolf Behaim', role: 'Waffen', hub: 'stadt', x: at.x, y: at.y, art: NPC_ART.zeugmeister, zeug: true,
    greet: ['Im Zeughaus der Reichsstadt liegt alles, was ein Kriegsmann braucht: Spieße, Hellebarden, Zweihänder und Armbrüste.', 'Die Schweizer schwören auf die Hellebarde, die Landsknechte auf den Zweihänder. Und die Jäger auf die Armbrust.', 'Ein Zweihänder will zwei Hände, Herr Ritter. Den Schild lasst dann im Rucksack.'] }); }
function wtTalkOpts(n, opts){
  if (!n.zeug) return;
  opts.append(btn('Waffen kaufen', () => renderTalk('wtLaden'), 'opt'), btn('Welche Waffe passt zu mir?', () => renderTalk('wtInfo'), 'opt'));
}
function wtView(view, body, opts){
  const n = G.talk && G.talk.n || NPCS.find(q => q.zeug);
  if (view === 'wtLaden'){
    $('talkText').textContent = 'Ihr habt ' + HERO.gold + ' Gulden. Jede Art einmal, geschmiedet für einen Ritter Eurer Stufe.';
    if (!n.wstock || n.wstockLvl !== HERO.lvl || nowS() > n.wstockT){
      n.wstock = ['schwert', 'hellebarde', 'zweihaender', 'armbrust'].map(wt => makeItem('waffe', HERO.lvl, 1, { wt }));
      n.wstockLvl = HERO.lvl; n.wstockT = nowS() + 300;
    }
    n.wstock.forEach((it, i) => {
      if (!it) return;
      const r = el('div', 'shoprow'), ic = el('img'); ic.src = itemUrl(it); ic.alt = ''; ic.style.boxShadow = '0 0 0 2px ' + RARITY[it.r].c;
      const t = el('div', 'stx'), nm = el('b', null, itemName(it)); nm.style.color = RARITY[it.r].c;
      const diff = statDiff(it).map(([nn, d]) => (d > 0 ? '+' : '−') + Math.abs(d) + ' ' + nn).join(', ');
      t.append(nm, el('small', null, WT[wtOf(it)].n + ' · ' + itemLines(it).join(' · ')), el('small', 'cmp', diff ? 'Statt jetzt: ' + diff : ''));
      const cost = it.v * 4, b = btn(cost + ' Gulden', () => {
        const j = HERO.inv.indexOf(null);
        if (HERO.gold < cost || j < 0) return;
        HERO.gold -= cost; HERO.inv[j] = it; n.wstock[i] = null; Sound.coin(); logItem('Gekauft: ', it); updateHud(); markDirty(true); renderTalk('wtLaden');
      }, 'tbtn');
      b.disabled = HERO.gold < cost || HERO.inv.indexOf(null) < 0;
      r.append(ic, t, b); body.append(r);
    });
    body.append(el('p', 'hint', 'Ausrüsten im Rucksack (I). Eine zweihändige Waffe legt den Schild ab.'));
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn')); body.append(opts); return;
  }
  if (view === 'wtInfo'){
    $('talkText').textContent = 'Jede Waffe kämpft anders, und mit der Waffe ändern sich auch Eure Fähigkeiten R und F.';
    for (const w of ['schwert', 'hellebarde', 'zweihaender', 'armbrust']){
      const S = WT_SKILL[w], r = el('div', 'shoprow'), ic = el('img'); ic.src = w === 'schwert' ? ICON_URL.sword : wtUrl(w); ic.alt = '';
      const t = el('div', 'stx'); t.append(el('b', null, WT[w].n), el('small', null, WT[w].d), el('small', null, 'R: ' + S.rund[0] + ' – ' + S.rund[1] + '. F: ' + S.stoss[0] + ' – ' + S.stoss[1] + '.'));
      r.append(ic, t); body.append(r);
    }
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn')); body.append(opts); return;
  }
}
/* Tafel unter dem Spiel */
for (const w of ['schwert', 'hellebarde', 'zweihaender', 'armbrust']){
  const S = WT_SKILL[w], li = el('li'), im = el('img'), wh = el('span', 'what', WT[w].n);
  lazySrc(im, () => w === 'schwert' ? ICON_URL.sword : wtUrl(w)); im.alt = '';
  wh.append(el('small', null, WT[w].d + '. R: ' + S.rund[0] + ', F: ' + S.stoss[0] + '.')); li.append(im, wh); $('wtList').append(li);
}

/* ============ Kleine Bibel: Gebet, Fund beim ersten Wiedergänger, Tafel ============ */
function bibPray(){
  const k = G.knight; if (k.bashT > 0) return;
  const heal = Math.round(ST.hp * BIB_HEAL / 100 * (HERO.glaube === 'neu' ? 1.25 : 1));   // mit dem Augsburger Bekenntnis heilt das Gebet mehr
  k.hp = Math.min(ST.hp, k.hp + heal); k.slowT = 0;
  G.cd.stoss = cdT(BIB_CD, 'sturm', 3);
  floatText(k.x, k.y - KS.ay - 2, '+' + heal, '#ffe9a0', 1);
  burst(k.x, k.y - KBODY, ['#fff3c0', '#ecd27a', '#ffffff'], 22, 70, true);
  Sound.potion(); updateHud();
}
function bibFind(m, from){
  if (m.k !== 'wieder' || m.by !== 'me' || !HERO || HERO.bib) return;
  HERO.bib = 1;
  dropLoot(from, 'item', 0, makeItem('schild', m.lvl, 1, { nh: 'bibel' }));
  logLine('Bei dem Wiedergänger liegt eine kleine Bibel. Ihr könnt sie in der Nebenhand statt des Schildes tragen.', '#ecd27a');
}
{ const li = el('li'), im = el('img'), wh = el('span', 'what', 'Kleine Bibel');
  lazySrc(im, bibUrl); im.alt = '';
  wh.append(el('small', null, 'in der Nebenhand statt des Schildes; mehr Leben, schnellere Erholung, +' + BIB_UNDEAD + ' % Schaden gegen Untote und Geister. F: Gebet, heilt ' + BIB_HEAL + ' % des Lebens.'));
  li.append(im, wh); $('wtList').append(li); }
let last = performance.now();
function frame(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  update(dt); render();
  if (HERO && G.mode !== 'title'){ updateHp(); updateSkillCd(); }
  if (!PL.list || PL.i < PL.list.length){ if (PL.at && Math.hypot(G.knight.x - PL.at.x, G.knight.y - PL.at.y) > 1500) PL.list = null; propPump(G.mode === 'title' ? 8 : 4); }
  requestAnimationFrame(frame);
}
function boot(){
  SAVED = loadLocal();
  G = freshState('title'); seedTitle();
  setSound(Sound.on, false);
  buildSkills();
  G.pickF = 'reich'; renderPick();
  renderStart(); renderFameLocal();
  showOverlay('ovStart');
  updateZone();
  initCloud();
  requestAnimationFrame(t => { last = t; frame(t); setTimeout(lazyStart, 250); setTimeout(mo_warm, 4000); });
}
boot();



/* Aufgaben, die erst nach dem Laden aller Teile laufen sollen (Mikroaufgaben liefen früher nach dem Ende des einen Skripts) */
queueMicrotask(() => {   // Ordensbanner erst, wenn das Ordensmodul geladen ist
for (const [src, name, desc] of [[orBanner([3, 7, 0]), 'Ritterorden', 'beim Herold gegründet (100 Gulden) mit Namen, Kürzel und Wappen; Ordensritter nehmen andere auf, die vor ihnen stehen. Jede Woche eine gemeinsame Aufgabe mit Ordenslohn, „/o“ vor einer Nachricht schreibt nur an den Orden.'],
  [() => knightSet('frankreich').icon, 'Großes Turnier', 'beim Herold ausgerufen: bis zu acht Ritter im K.-o.-System, ein Tjost nach dem anderen. Startgeld 20 Gulden, der Sieger bekommt drei Fünftel des Topfs, beim ersten Mal den Goldenen Turnierhelm.']]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  lazySrc(im, () => urlOf(typeof src === 'function' ? src() : src, 3)); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh); $('mpList').append(li);
}
});
/* Nachmittags im Dreitagewechsel (Bilder: Eimer, Rattenkönig, Kaiser) */
queueMicrotask(() => {   // Eimer und Rattenbild sind weiter unten erklärt
  const BK = canvasOf(14, 17); BK.getContext('2d').drawImage(BUCKET, 0, 0);
  for (const [src, name, desc] of [[BK, 'Brand der Reichsstadt', 'jeden dritten Spieltag um 15 Uhr: Acht Häuser fangen nacheinander Feuer. Füllt am Brunnen einen Eimer (E) und löscht am brennenden Haus; je mehr Ritter, desto mehr Eimer braucht ein Feuer.'],
    [null, 'Der Rattenkönig', 'am folgenden Spieltag um 15 Uhr im Dorf am Fluss: Pestratten in Scharen, dann kriecht der Rattenkönig aus dem Kornspeicher. Sein Leben teilen sich alle Kämpfer.'],
    [() => knightSet('reich', '44444').icon, 'Der Kaiser kommt', 'am dritten Spieltag um 15 Uhr: Kaiser Karl zieht mit zwei Reichsrittern von der Reichsburg in die Reichsstadt. An drei Stellen lauern Strauchdiebe, der Zug wartet, bis sie vertrieben sind.']]){
    const li = el('li'), im = el('img'), wh = el('span', 'what', name);
    lazySrc(im, () => urlOf(typeof src === 'function' ? src() : src || MON_ART.ratte.idle.r[0].img, src === BK ? 3 : 2)); im.alt = '';
    wh.append(el('small', null, desc)); li.append(im, wh); $('evList').append(li);
  } });
/* Tafel unter dem Spiel */
queueMicrotask(() => {
  for (const [img, name, desc] of [[NPC_ART.postmeister.frames[0], 'Kaiserliche Post', 'beim Postmeister in der Reichsstadt oder beim Postreiter in der Reichsburg: Briefe an jeden Ritter, auch wenn er gerade nicht spielt, mit bis zu ' + POST_GOLD + ' Gulden und einem Gegenstand als Beilage. Porto ' + PORTO + ' Gulden.'],
    [NPC_ART.marktvogt.frames[0], 'Marktplatz', 'beim Marktvogt in der Reichsstadt: Waren für andere Ritter einstellen und ihre Angebote kaufen. Wer zuerst zahlt, bekommt die Ware; der Verkäufer erhält sein Geld beim nächsten Besuch, die Stadt behält ein Zwanzigstel.'],
    [() => knightSet('england').icon, 'Länderwettstreit', 'jede Woche: Alles, was ein Ritter vollbringt, bringt seinem Land Punkte. Die Ritter des Siegerlandes haben in der folgenden Woche +5 % Erfahrung und Gulden und holen beim Herold einen Wochenlohn ab.'],
    [NPC_ART.kaemmerer.frames[0], 'Ordenshaus', 'beim Ordenskämmerer neben dem Herold: Die Ritter eines Ordens spenden Gulden und bauen ihr Haus in fünf Stufen aus, jede bringt allen einen Vorteil.']]){
    const li = el('li'), im = el('img'), wh = el('span', 'what', name);
    lazySrc(im, () => { const c = typeof img === 'function' ? img() : img; return urlOf(c, c.width > 20 ? 2 : 3); }); im.alt = '';
    wh.append(el('small', null, desc)); li.append(im, wh); $('mpList').append(li);
  }
});
