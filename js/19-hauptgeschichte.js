"use strict";
/* Der Apfelritter, Teil 19 von 26: Hauptgeschichte 1520–1529.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Hauptgeschichte: Unruhige Zeiten 1520–1525 ============
   Fünf Kapitel, jedes eine Folge von Schritten: sprechen (talk), hingehen (goto), kämpfen (kill), geleiten (escort),
   jagen (hunt), entscheiden (choice). Zwischenszenen spielen in der Welt oder auf einer Bühne (Reichstag zu Worms).
   Stand in HERO.story: c Kapitel, s Schritt, n Zähler, b Anführer erschlagen, e Weg beim Geleit, a Hinterhalt,
   f Entscheidungen, gn Gewissen (wer Gnade zeigt und Wort hält, dem vertrauen später beide Seiten), log Chronik. */
const stP = (x, y) => ({ x: x * WS, y: y * WS });   // Weltpixel → Spielfeld
const stPt = a => stP(a[0], a[1]);
const STY = { act: new Map(), npcs: [], mobs: [], key: '', path: null, waitT: 0, boxT: 0 };

/* ---------- Darsteller: Leute (Gehbilder in vier Richtungen) und Ritter ---------- */
const ST_PAL = {
  herold: ['#7a5a10', '#b08a1e', '#d8b030', '#f0d460', '#141218', '#221e28', '#322c3a', '#463e50'],
  bote: ['#141218', '#221e28', '#322c3a', '#463e50', '#7a5a10', '#b08a1e', '#d8b030', '#f0d460'],
  rot: ['#4a0e12', '#7a1a1e', '#a42a2a', '#c84a40', '#3a0e12', '#5a1a1e', '#7a2a2a', '#9a3a34'],
  henker: ['#3a0e12', '#5a1416', '#7a1e1e', '#962a26', '#141216', '#222026', '#34303a', '#48434e'],
  gelehrt: ['#141218', '#221e28', '#322c3a', '#463e50', '#2a1a10', '#3e2a1a', '#56402a', '#6e563c'],
  gruen: ['#16241c', '#22362a', '#30483a', '#425e4c', '#2a1a10', '#3e2a1a', '#56402a', '#6e563c'],
  bauer: ['#4a3a22', '#64502e', '#7e683c', '#98804e', '#3a2c1e', '#4a3a28', '#5a4a34', '#6e5c44'],
  jaeck: ['#5a1a14', '#7a2a1e', '#9a3e2a', '#b85a3e', '#3a2c1e', '#4a3a28', '#5a4a34', '#6e5c44']
};
const stPal = (k, R) => { const p = ST_PAL[k], o = { R: R || '#8a1c1c', h: '#3a2a1a', j: '#5a4028', w: '#8a8478', x: '#c8c2b0' }; p.forEach((c, i) => { o[i + 1] = c; }); return o; };
const ST_CAST = {
  me:        { nm: '' },
  luther:    { nm: 'Doktor Martin Luther', p: ['moench', 1] },
  amsdorf:   { nm: 'Nikolaus von Amsdorf', o: { robe: 'long', hat: 'barett', fur: true, hair: ['h', 'j'] }, pal: 'gelehrt' },
  kaspar:    { nm: 'Reichsherold Kaspar Sturm', o: { robe: 'short', hat: 'barett', belt: true, chain: true, staff: true, parti: true, hair: ['h', 'j'] }, pal: 'herold', R: '#b8281e' },
  bote:      { nm: 'Reichsbote Ambrosius', o: { robe: 'short', hat: 'filz', belt: true, parti: true, hair: ['h', 'j'] }, pal: 'bote' },
  aleander:  { nm: 'Kommissar Aleander', o: { robe: 'long', hat: 'barett', fur: true, hair: ['w', 'x'] }, pal: 'rot' },
  henker:    { nm: 'Meister Hans, der Henker', o: { robe: 'short', hat: 'kapuze', belt: true, hair: ['h', 'j'] }, pal: 'henker' },
  melchior:  { nm: 'Drucker Melchior', p: ['haendler', 0] },
  eck:       { nm: 'Johann von der Ecken', o: { robe: 'long', hat: 'barett', fur: true, beard: true, hair: ['h', 'j'] }, pal: 'rot' },
  buerger1:  { nm: 'Bürger', p: ['buerger', 1] },
  buerger2:  { nm: 'Bürgerin', p: ['buergerin', 0] },
  buerger3:  { nm: 'Bürger', p: ['buerger', 2] },
  magd:      { nm: 'Magd', p: ['magd', 0] },
  kaiser:    { nm: 'Kaiser Karl V.', kn: ['reich', '44444'], crown: true },
  wenkheim:  { nm: 'Burkhard Hund von Wenkheim', kn: ['reich', '33343'] },
  reiter:    { nm: 'Vermummter Reiter', kn: ['reich', '22222'] },
  hutten:    { nm: 'Ulrich von Hutten', kn: ['reich', '22232'] },
  sickingen: { nm: 'Franz von Sickingen', kn: ['reich', '44443'] },
  goetz:     { nm: 'Götz von Berlichingen', kn: ['reich', '33343'] },
  konrad:    { nm: 'Junker Konrad von Lindach', kn: ['reich', '11111'] },
  truchsess: { nm: 'Georg Truchsess von Waldburg', kn: ['spanien', '44443'] },
  fuerst:    { nm: 'Feldhauptmann der Fürsten', kn: ['england', '33333'] },
  jaecklein: { nm: 'Jäcklein Rohrbach', o: { robe: 'short', hat: 'filz', beard: true, belt: true, hair: ['j', 'h'] }, pal: 'jaeck' },
  hipler:    { nm: 'Wendel Hipler', o: { robe: 'long', hat: 'barett', beard: true, belt: true, hair: ['w', 'x'] }, pal: 'gruen' },
  bauer1:    { nm: 'Bauer', p: ['bauer', 0] },
  bauer2:    { nm: 'Bäuerin', p: ['baeuerin', 0] },
  bauer3:    { nm: 'Bauer', o: { robe: 'short', hat: 'filz', beard: true, belt: true, hair: ['h', 'j'] }, pal: 'bauer' },
  knecht:    { nm: 'Knecht', p: ['wache', 0] },
  landsknecht: { nm: 'Landsknecht', p: ['wache', 1] },
  moench:    { nm: 'Bruder Anselm', p: ['moench', 0] }
};
for (const [id, c] of Object.entries(ST_CAST)) c.id = id;
function stSet(c){
  if (c.set) return c.set;
  if (c.kn) return (c.set = knightSet(c.kn[0], c.kn[1]));
  if (c.p) return (c.set = vkPerson(c.p[0], c.p[1]));
  return (c.set = vkSet('st_' + c.id, c.o, stPal(c.pal, c.R)));
}
const stKn = () => ({ x: 0, y: 0, dir: 'down', moving: false, anim: 0, atkT: 0, atkLen: SWING, swA0: 0, swA1: 0, mult: 1, bashT: 0, inv: 0, slowT: 0, ride: null, lance: 0 });
function stActor(id, castId, at, dir, o){
  const c = ST_CAST[castId] || ST_CAST[id], p = Array.isArray(at) ? stPt(at) : at;
  const a = Object.assign({ id, c, nm: c.id === 'me' ? HERO.name : c.nm, x: p.x, y: p.y, dir: dir || 'down', moving: false, anim: 0, tx: null, ty: null, spd: 44, lie: false, dead: false, ride: null }, o || {});
  if (c.kn) a.k = stKn();
  if (c.id !== 'me') stSet(c);
  STY.act.set(id, a);
  return a;
}
/* liegende Figur: Standbild um 90 Grad gedreht */
function stLying(A){
  if (A._lie) return A._lie;
  const s = A.stand.down, c = canvasOf(s.height, s.width), g = c.getContext('2d');
  g.translate(c.width, 0); g.rotate(Math.PI / 2); g.drawImage(s, 0, 0);
  return (A._lie = c);
}
function stDrawActor(a){
  if (a.c.id === 'me') return;
  if (a.c.kn){
    const k = a.k; k.x = a.x; k.y = a.y; k.dir = a.dir; k.moving = a.moving; k.anim = a.anim; k.ride = a.ride;
    drawKnightAt(k, a.c.set, a.dead, 1);
    if (a.c.crown && !a.dead){   // Krone über dem Helm
      const hx = Math.round(a.x) - 4, hy = Math.round(a.y) - (a.ride ? 70 : 52);
      ctx.fillStyle = OUT; ctx.fillRect(hx - 1, hy - 1, 11, 7); ctx.fillStyle = '#e0c040'; ctx.fillRect(hx, hy + 2, 9, 3); ctx.fillRect(hx, hy, 1, 2); ctx.fillRect(hx + 4, hy - 1, 1, 3); ctx.fillRect(hx + 8, hy, 1, 2); ctx.fillStyle = '#b8281e'; ctx.fillRect(hx + 4, hy + 3, 1, 1);
    }
    return;
  }
  const A = a.c.set;
  if (a.lie){ const img = stLying(A); ctx.drawImage(img, Math.round(a.x - img.width / 2), Math.round(a.y - img.height + 2)); return; }
  const img = a.moving ? A[a.dir][(a.anim | 0) % 4] : a.dir === 'down' ? ((G.t * .8 + a.x) % 2 < 1 ? A.stand.down : A.breath) : A.stand[a.dir];
  const x0 = Math.round(a.x - A.ax), y0 = Math.round(a.y - A.ay);
  if (a.torch){ const tx = a.x + (a.dir === 'left' ? -9 : 9); ctx.fillStyle = '#4a3020'; ctx.fillRect(Math.round(tx), y0 + 18, 2, 14); flameHD(tx + 1, y0 + 19, G.t + a.x, false); }
  ctx.drawImage(img, x0, y0);
}
/* Darsteller nach Name: in der Szene gesetzt, als Leute des Schritts (c_…) oder nach Rolle */
const stA = id => id ? STY.act.get(id) || STY.act.get('c_' + id) || [...STY.act.values()].find(a => a.c.id === id) || null : null;
const stTop = a => a.c.kn ? (a.ride ? 84 : 62) : a.lie ? 20 : 54;
function stMove(a, dt){
  if (a.tx == null){ a.moving = false; return; }
  const dx = a.tx - a.x, dy = a.ty - a.y, l = Math.hypot(dx, dy), sp = a.spd * (a.ride ? 1.8 : 1);
  if (l < sp * dt + .5){ a.x = a.tx; a.y = a.ty; a.tx = a.ty = null; a.moving = false; if (a.face) a.dir = a.face; return; }
  a.x += dx / l * sp * dt; a.y += dy / l * sp * dt; a.moving = true; a.anim += dt * (a.ride ? 7 : 6);
  a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}
function stPortrait(c){
  if (c.url) return c.url;
  if (c.id === 'me') return urlOf(ownSet().walk.down[0].img, 3);
  const s = stSet(c);
  return (c.url = urlOf(c.kn ? s.walk.down[0].img : s.stand.down, 3));
}
/* Darsteller in der Welt (Szenen und Geleit), nach Tiefe einsortiert */
function stList(cam, list){
  if (G.scene && G.scene.stage) return;
  for (const a of STY.act.values()){
    if (a.stage || !inView(a.x, a.y, cam, 80) || a.c.id === 'me') continue;
    list.push({ y: a.y + .12, d: () => { shadow(a.x, a.y - 1, a.lie ? 22 : a.ride ? 40 : 16, .36); stDrawActor(a); } });
  }
}
function stPlates(cam){
  if (G.scene && G.scene.stage) return;
  for (const a of STY.act.values()){
    if (a.stage || a.c.id === 'me' || !inView(a.x, a.y, cam, 20) || a.mute) continue;
    if (G.scene ? stA(G.scene.speaker) !== a : Math.hypot(a.x - G.knight.x, a.y - G.knight.y) > 300 || (a.esc && a.id !== 'esc0')) continue;   // in Szenen nur, wer spricht
    drawText(a.nm, a.x, a.y - stTop(a) - 12, '#ffd98a');
    if (a.say && nowS() < a.sayT) drawBubble(a.x, a.y - stTop(a) - 14, a.say);
  }
}

/* ---------- Zwischenszenen ----------
   Befehle der Reihe nach: cam/pan Kamera, put/del Darsteller, walk gehen (wait: abwarten), face, lie, say Rede,
   title Tafel, stage Bühne, fx Feuer und Bücher, sound, flash, shake, wait Pause, hero Ritter versetzen, night Dunkel, fn eigener Schritt. */
const stBox = (() => {
  const box = el('div', 'scenebox'), img = el('img'), txt = el('div'), nm = el('b'), p = el('p'), hint = el('small');
  img.alt = ''; txt.append(nm, p, hint); box.append(img, txt); box.hidden = true;
  const card = el('div', 'scenecard'), h = el('h2'), sub = el('p'), hint2 = el('small'); card.append(h, sub, hint2); card.hidden = true;
  const skip = el('button', 'sceneskip', 'Überspringen'); skip.type = 'button'; skip.hidden = true;
  const st = $('stage'); st.append(box, card, skip);
  box.addEventListener('pointerdown', e => { e.preventDefault(); stAdvance(); });
  card.addEventListener('pointerdown', e => { e.preventDefault(); stAdvance(); });
  skip.addEventListener('click', e => { e.stopPropagation(); stSkip(); });
  return { box, img, nm, p, hint, card, h, sub, hint2, skip };
})();
function stShowLine(c){
  const B = stBox, S = G.scene;
  B.card.hidden = true; B.box.hidden = !c;
  if (!c) return;
  const ac = stA(c.say), who = c.say === 'me' ? ST_CAST.me : ST_CAST[c.say] || (ac && ac.c) || null, npc = !who && NPCS.find(n => n.id === c.say);
  B.nm.textContent = c.nm || (c.say === 'me' ? HERO.name : who ? who.nm : npc ? npc.name : '');
  B.img.hidden = !(who || npc);
  if (who) B.img.src = stPortrait(who); else if (npc) B.img.src = npcUrl(npc);
  B.p.textContent = c.text;
  B.hint.textContent = touchUI() ? 'Tippen: weiter' : 'E oder Leertaste: weiter · Esc: Szene überspringen';
  S.speaker = c.say;
}
function stShowCard(c){
  const B = stBox; B.box.hidden = true; B.card.hidden = false;
  B.h.textContent = c.title; B.sub.textContent = c.sub || '';
  B.hint2.textContent = touchUI() ? 'Tippen: weiter' : 'E oder Leertaste: weiter';
}
function stPlay(script, onEnd){
  if (!script || !script.length){ if (onEnd) onEnd(); return; }
  if (G.mode !== 'play' && G.mode !== 'menu'){ setTimeout(() => stPlay(script, onEnd), 600); return; }   // erst nach Tod, Pause …
  if (G.mode === 'menu') closePanel();
  const k = G.knight;
  G.scene = { q: script, i: 0, wait: 0, line: null, cam: { x: k.x, y: k.y - 10 }, camTo: null, fx: [], stage: null, night: 0, temp: [], onEnd, speaker: null, walkW: null };
  if (STY.held){ G.scene.temp.push(...STY.held.temp); G.scene.fx = STY.held.fx; G.scene.night = STY.held.night; STY.held = null; }
  G.mode = 'scene'; keys.clear(); atkHeld = false; atkBtn = false; padVec = { x: 0, y: 0 }; k.moving = false;
  document.body.classList.add('inscene'); $('btnTalk').hidden = true; stBox.skip.hidden = false;
  stNext();
}
function stNext(){
  const S = G.scene; if (!S) return;
  S.line = null; S.speaker = null; stShowLine(null); stBox.card.hidden = true;
  while (S.i < S.q.length){ if (stCmd(S.q[S.i++], S, false)) return; }
  stEnd();
}
function stCmd(c, S, quick){
  const pos = a => S.stage ? { x: W / 2 + a[0], y: H / 2 + a[1] } : stPt(a);
  if (c.if && !c.if(stS().f, stS())) return false;
  if (c.cam){ const p = pos(c.cam); S.cam = { x: p.x, y: p.y }; S.camTo = null; }
  if (c.pan){ const p = pos(c.pan); S.camTo = { x: p.x, y: p.y, sp: c.sp || 1.6 }; if (quick) S.cam = { x: p.x, y: p.y }; }
  if (c.put){ const a = stActor(c.put, c.as || c.put, pos(c.at), c.dir, c.o); if (!c.keep) S.temp.push(c.put); if (c.ride) a.ride = c.ride; if (S.stage) a.stage = true; }
  if (c.del) STY.act.delete(c.del);
  if (c.walk){
    const a = stA(c.walk);
    if (a){
      const p = pos(c.to); a.tx = p.x; a.ty = p.y; a.face = c.face || null; if (c.spd) a.spd = c.spd;
      if (quick){ a.x = p.x; a.y = p.y; a.tx = a.ty = null; if (c.face) a.dir = c.face; }
      else if (c.wait){ S.walkW = a; return true; }
    }
  }
  if (c.face){ const a = stA(c.face[0]); if (a) a.dir = c.face[1]; }
  if (c.lie){ const a = stA(c.lie[0]); if (a) a.lie = c.lie[1]; }
  if (c.dead){ const a = stA(c.dead[0]); if (a) a.dead = c.dead[1]; }
  if (c.torch){ const a = stA(c.torch[0]); if (a) a.torch = c.torch[1]; }
  if (c.ridek){ const a = stA(c.ridek[0]); if (a) a.ride = c.ridek[1]; }
  if (c.stage !== undefined){ S.stage = c.stage; if (c.stage) S.cam = null; else S.cam = { x: G.knight.x, y: G.knight.y }; }
  if (c.fx){ const p = pos(c.at); S.fx.push({ k: c.fx, x: p.x, y: p.y, big: c.big || 1, t: 0 }); }
  if (c.fxoff) S.fx = S.fx.filter(f => f.k !== c.fxoff);
  if (c.night !== undefined) S.night = c.night;
  if (c.hero){ const p = pos(c.hero), k = G.knight; k.x = p.x; k.y = p.y; if (c.dir) k.dir = c.dir; HERO.riding = false; renderSkills(); }
  if (c.herodir) G.knight.dir = c.herodir;
  if (c.fn) c.fn();
  if (c.hold) S.hold = true;
  if (quick) return false;
  if (c.sound && Sound[c.sound]) Sound[c.sound]();
  if (c.flash) G.flash = c.flash;
  if (c.shake) G.shake = c.shake;
  if (c.say){ S.line = c; stShowLine(c); return true; }
  if (c.title){ S.line = c; stShowCard(c); Sound.chime && Sound.chime(); return true; }
  if (c.wait){ S.wait = c.wait; return true; }
  return false;
}
function stAdvance(){
  const S = G.scene; if (!S) return;
  if (S.line){ Sound.click(); stNext(); }
}
function stSkip(){
  const S = G.scene; if (!S) return;
  S.walkW = null; S.wait = 0;
  while (S.i < S.q.length) stCmd(S.q[S.i++], S, true);
  stEnd();
}
function stEnd(){
  const S = G.scene; if (!S) return;
  if (S.hold) STY.held = { temp: S.temp, fx: S.fx, night: S.night };
  else for (const id of S.temp) STY.act.delete(id);
  for (const a of STY.act.values()) if (a.tx != null && !a.esc){ a.x = a.tx; a.y = a.ty; a.tx = a.ty = null; }
  G.scene = null; G.mode = 'play';
  document.body.classList.remove('inscene'); stShowLine(null); stBox.card.hidden = true; stBox.skip.hidden = true;
  cv.focus({ preventScroll: true });
  if (S.onEnd) S.onEnd();
  stSync(); renderTracker();
}
function stUpdate(dt){
  const S = G.scene;
  for (const a of STY.act.values()) stMove(a, dt);
  if (S.camTo && S.cam){ const t = 1 - Math.pow(.02, dt * S.camTo.sp); S.cam.x += (S.camTo.x - S.cam.x) * t; S.cam.y += (S.camTo.y - S.cam.y) * t; if (Math.hypot(S.camTo.x - S.cam.x, S.camTo.y - S.cam.y) < 1) S.camTo = null; }
  for (const f of S.fx) f.t += dt;
  if (S.wait > 0){ S.wait -= dt; if (S.wait <= 0){ S.wait = 0; stNext(); } }
  if (S.walkW && S.walkW.tx == null){ S.walkW = null; stNext(); }
}
const stCam = () => { const c = G.scene.cam; return { x: Math.round(clamp(c.x - W / 2, 0, GW - W)), y: Math.round(clamp(c.y + 24 - H / 2, 0, GH - H)) }; };   // Geschehen über dem Sprechfenster
/* Feuer, Bücherhaufen, Rauch: nur während der Szene */
function stFx(cam){
  const fx = G.scene ? G.scene.fx : STY.held ? STY.held.fx : null; if (!fx) return;
  for (const f of fx){
    if (f.k === 'books'){
      const x = Math.round(f.x), y = Math.round(f.y);
      const cols = ['#7a1a1e', '#3e2c20', '#c8b890', '#2a3a5a', '#5a4a2a', '#e8dcbc'];
      for (let i = 0; i < 12; i++){ const bx = x - 14 + (i * 7) % 26, by = y - 4 - Math.floor(i / 4) * 4; ctx.fillStyle = OUT; ctx.fillRect(bx - 1, by - 1, 9, 5); ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(bx, by, 7, 3); ctx.fillStyle = '#e8dcbc'; ctx.fillRect(bx + 1, by + 1, 5, 1); }
    }
    if (f.k === 'fire'){
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(f.x, f.y - 10, 4, f.x, f.y - 10, 80 * f.big); gr.addColorStop(0, 'rgba(255,140,50,.4)'); gr.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = gr; ctx.fillRect(f.x - 120, f.y - 130, 240, 240); ctx.restore();
      for (const [ox, k] of [[-10, .8], [0, 1.1], [10, .8]]){ ctx.save(); ctx.translate(Math.round(f.x + ox * f.big), Math.round(f.y)); const sc = (1 + f.big) * k; ctx.scale(sc, sc); flameHD(0, 0, G.t * 1.2 + ox, true); ctx.restore(); }
      if (Math.random() < .8) G.parts.push({ x: f.x + rand(-10, 10) * f.big, y: f.y - 14, vx: rand(-10, 10), vy: rand(-60, -30), life: rand(.5, 1.1), c: Math.random() < .5 ? '#e0782a' : '#ffd36a', g: -10, glow: true });
      if (Math.random() < .6) G.parts.push({ x: f.x + rand(-8, 8), y: f.y - 40 * f.big, vx: rand(4, 14), vy: rand(-30, -16), life: rand(1.8, 3), c: Math.random() < .5 ? '#2e2a30' : '#48444c', g: -3, s: 3 });
    }
  }
}
/* Balken oben und unten, Zeichen über dem, der spricht, Dunkel bei Nacht */
function stOverlay(cam){
  const S = G.scene;
  if (!S){ if (STY.held && STY.held.night){ ctx.fillStyle = 'rgba(8,10,28,' + STY.held.night.toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); } return; }
  if (S.night > 0){
    ctx.fillStyle = 'rgba(8,10,28,' + S.night.toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
    // Fackeln und Feuer leuchten durch die Nacht
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, a) => { const gr = ctx.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(255,170,70,' + a + ')'); gr.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
    for (const a of STY.act.values()) if (a.torch) glow(a.x - cam.x + (a.dir === 'left' ? -9 : 9), a.y - cam.y - 28, 70, (.32 + Math.sin(G.t * 9 + a.x) * .04).toFixed(3));
    for (const f of S.fx) if (f.k === 'fire') glow(f.x - cam.x, f.y - cam.y - 20, 150 * f.big, .4);
    ctx.restore();
  }
  const a = S.speaker && (S.speaker === 'me' ? { x: G.knight.x, y: G.knight.y, c: ST_CAST.me } : stA(S.speaker));
  const npc = !a && S.speaker && NPCS.find(n => n.id === S.speaker);
  const sp = a || npc;
  if (sp){
    const ox = S.stage ? 0 : cam.x, oy = S.stage ? 0 : cam.y, top = a ? (a.c && a.c.id === 'me' ? 58 : stTop(a)) : npc.art.ay + 6;
    const x = Math.round(sp.x - ox), y = Math.round(sp.y - oy - top - 8 + Math.sin(G.t * 5) * 2);
    ctx.fillStyle = OUT; ctx.fillRect(x - 5, y - 1, 11, 2); ctx.fillRect(x - 4, y + 1, 9, 2); ctx.fillRect(x - 3, y + 3, 7, 2); ctx.fillRect(x - 1, y + 5, 3, 2);
    ctx.fillStyle = '#ffd541'; ctx.fillRect(x - 4, y, 9, 1); ctx.fillRect(x - 3, y + 1, 7, 2); ctx.fillRect(x - 2, y + 3, 5, 2); ctx.fillRect(x, y + 5, 1, 1);
  }
  const bar = Math.round(H * .07);
  ctx.fillStyle = '#0a080b'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
}

/* ---------- Bühne: der Saal im Bischofshof zu Worms, April 1521 ----------
   Holzgetäfelte Wand mit Wandteppichen, in der Mitte der Thron unter rotem Baldachin, links und rechts die Reichsstände
   auf Bänken, Fliesenboden, hohe Fenster und Kerzen. Einmal gemalt, die Kerzen flackern beim Zeichnen. */
let ST_HALL = null;
function stHall(){
  if (ST_HALL && ST_HALL.width === W) return ST_HALL;
  const c = canvasOf(W, H), g = c.getContext('2d'), R = rng(1521), cx = W / 2, wallY = Math.round(H * .44);
  g.imageSmoothingEnabled = false;
  // Fliesen: Schachbrett aus zwei Steinen mit dunklen Fugen
  for (let y = wallY; y < H; y += 16) for (let x = 0; x < W; x += 24){
    const odd = ((x / 24 | 0) + (y / 16 | 0)) & 1;
    g.fillStyle = odd ? '#5e5248' : '#7a6a58'; g.fillRect(x, y, 24, 16);
    g.fillStyle = odd ? '#54483f' : '#6e604f'; g.fillRect(x, y + 12, 24, 4);
    g.fillStyle = 'rgba(255,240,210,' + (R() * .05).toFixed(3) + ')'; g.fillRect(x + 2, y + 2, 20, 3);
    g.fillStyle = '#3a302a'; g.fillRect(x, y, 24, 1); g.fillRect(x, y, 1, 16);
  }
  // Teppich vom Thron nach vorn
  g.fillStyle = '#5a1416'; g.fillRect(cx - 40, wallY, 80, H - wallY);
  g.fillStyle = '#7a1e1e'; g.fillRect(cx - 36, wallY, 72, H - wallY);
  g.fillStyle = '#b08a1e'; g.fillRect(cx - 34, wallY, 2, H - wallY); g.fillRect(cx + 32, wallY, 2, H - wallY);
  // Wand: dunkle Täfelung mit Pfosten
  g.fillStyle = '#2e2420'; g.fillRect(0, 0, W, wallY);
  for (let x = 0; x < W; x += 48){ g.fillStyle = '#3a2e26'; g.fillRect(x + 4, 6, 40, wallY - 14); g.fillStyle = '#241c18'; g.fillRect(x, 0, 4, wallY); g.fillStyle = '#463830'; g.fillRect(x + 4, 6, 40, 2); }
  g.fillStyle = '#1a1412'; g.fillRect(0, wallY - 8, W, 8); g.fillStyle = '#4a3a30'; g.fillRect(0, wallY - 8, W, 2);
  // hohe Spitzbogenfenster
  for (const fx of [cx - W * .38, cx + W * .38]){
    const x0 = Math.round(fx - 18), y0 = 14, w = 36, h = wallY - 40;
    g.fillStyle = '#1a1412'; g.fillRect(x0 - 3, y0 + 10, w + 6, h); g.beginPath(); g.moveTo(x0 - 3, y0 + 12); g.quadraticCurveTo(x0 + w / 2, y0 - 16, x0 + w + 3, y0 + 12); g.fill();
    g.fillStyle = '#8aa4b8'; g.fillRect(x0, y0 + 12, w, h - 4); g.beginPath(); g.moveTo(x0, y0 + 14); g.quadraticCurveTo(x0 + w / 2, y0 - 10, x0 + w, y0 + 14); g.fill();
    g.fillStyle = '#5a6e80'; for (let yy = y0 + 18; yy < y0 + h; yy += 10) g.fillRect(x0, yy, w, 1); g.fillRect(x0 + w / 2, y0 + 4, 1, h);
    g.fillStyle = 'rgba(230,240,255,.18)'; g.fillRect(x0 + 3, y0 + 14, 8, h - 10);
  }
  // Wandteppiche: zwei seitliche, ein großer hinter dem Thron mit dem Reichsadler
  const tap = (x, y, w, h, col) => {
    g.fillStyle = OUT; g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = col; g.fillRect(x, y, w, h);
    g.fillStyle = '#b08a1e'; g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2); g.fillRect(x, y, 2, h); g.fillRect(x + w - 2, y, 2, h);
    for (let i = 0; i < w; i += 6){ g.fillStyle = '#d8b030'; g.fillRect(x + i + 1, y + h, 2, 4); }
  };
  tap(cx - W * .25 - 30, 18, 60, wallY - 50, '#2a3a5a'); tap(cx + W * .25 - 30, 18, 60, wallY - 50, '#2a3a5a');
  tap(cx - 60, 10, 120, wallY - 34, '#8a1c1c');
  const eg = ICONS.eagle; if (eg){ g.drawImage(eg, 0, 0, eg.width, eg.height, cx - 28, Math.round(H * .07) + 8, 56, 56); }
  // Baldachin und Thron auf zwei Stufen
  g.fillStyle = OUT; g.fillRect(cx - 50, 4, 100, 12); g.fillStyle = '#a42a2a'; g.fillRect(cx - 48, 6, 96, 8);
  for (let i = 0; i < 96; i += 8){ g.fillStyle = '#d8b030'; g.fillRect(cx - 48 + i, 14, 4, 4); }
  for (const [w, y] of [[150, wallY + 18], [120, wallY + 6]]){ g.fillStyle = OUT; g.fillRect(cx - w / 2 - 1, y - 1, w + 2, 14); g.fillStyle = '#8a8478'; g.fillRect(cx - w / 2, y, w, 12); g.fillStyle = '#b0aa9c'; g.fillRect(cx - w / 2, y, w, 2); }
  g.fillStyle = OUT; g.fillRect(cx - 21, wallY - 52, 42, 60); g.fillStyle = '#b08a1e'; g.fillRect(cx - 19, wallY - 50, 38, 56); g.fillStyle = '#d8b030'; g.fillRect(cx - 19, wallY - 50, 38, 3);
  g.fillStyle = '#7a1e1e'; g.fillRect(cx - 14, wallY - 44, 28, 46); g.fillStyle = '#a42a2a'; g.fillRect(cx - 14, wallY - 44, 28, 3);
  // die Reichsstände auf Bänken zu beiden Seiten
  const lords = [['buerger', 0], ['buerger', 1], ['buerger', 2], ['buergerin', 1], ['buerger', 0], ['moench', 0]];
  for (const side of [-1, 1]) for (let row = 0; row < 2; row++){
    const bx = cx + side * (W * .28) - 70, by = wallY + 48 + row * 56;
    for (let i = 0; i < 4; i++){
      const set = vkPerson(...lords[(i + row * 2 + (side > 0 ? 3 : 0)) % lords.length]), img = set.stand[side < 0 ? 'right' : 'left'];
      g.drawImage(img, Math.round(bx + i * 36 - set.ax), Math.round(by - set.ay));
    }
    g.fillStyle = OUT; g.fillRect(bx - 16, by - 6, 150, 9); g.fillStyle = '#5a3e28'; g.fillRect(bx - 15, by - 5, 148, 7); g.fillStyle = '#7a5838'; g.fillRect(bx - 15, by - 5, 148, 2);
  }
  ST_HALL = c; return c;
}
const ST_CANDLES = () => [[W / 2 - 90, H * .44 - 4], [W / 2 + 90, H * .44 - 4], [W * .08, H * .5], [W * .92, H * .5]];
function renderStage(){
  const S = G.scene;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(stHall(), 0, 0);
  // Kerzenleuchter mit Schein
  for (const [x, y] of ST_CANDLES()){
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 22); ctx.fillStyle = '#b08a1e'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 20);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 70); gr.addColorStop(0, 'rgba(255,190,90,' + (.28 + Math.sin(G.t * 9 + x) * .04).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - 70, y - 76, 140, 140); ctx.restore();
    flameHD(x, y - 2, G.t + x * .1, false);
  }
  const acts = [...STY.act.values()].filter(a => a.stage).sort((a, b) => a.y - b.y);
  for (const a of acts){ shadow(a.x, a.y - 1, 16, .4); stDrawActor(a); }
  const sp = stA(S.speaker); if (sp && sp.stage) drawText(sp.nm, sp.x, sp.y - stTop(sp) - 12, '#ffd98a');
  for (const p of G.parts){ if (!p.glow) continue; ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, 1, 1); }
  stOverlay({ x: 0, y: 0 });
}

/* ---------- Stand der Geschichte ---------- */
function stS(){ return HERO.story || (HERO.story = { c: 0, s: 0, n: 0, b: 0, e: 0, a: 0, gn: 0, f: {}, log: [] }); }
const stCh = () => HERO ? ST_CH[stS().c] || null : null;
function stStep(){ const C = stCh(); return C ? C.steps[stS().s] || null : null; }
const stLocked = () => { const C = stCh(); return !C || HERO.lvl < C.lvl; };
const stKey = () => { const S = stS(); return S.c + ':' + S.s; };
const stActive = () => !!(HERO && stStep() && !stLocked());
const stLv = (o) => clamp(Math.max(stCh().lvl, HERO.lvl) + (o || 0), 1, MAX_LVL + 2);
function stCleanStory(s){
  if (!s || typeof s !== 'object') return null;
  const f = {};
  if (s.f && typeof s.f === 'object') for (const [k, v] of Object.entries(s.f).slice(0, 24)) if (/^[a-z0-9]{1,8}$/.test(k) && /^[a-z0-9]{1,10}$/.test(String(v))) f[k] = String(v);
  return { c: clamp(s.c | 0, 0, ST_CH.length), s: clamp(s.s | 0, 0, 40), n: clamp(s.n | 0, 0, 99), b: s.b ? 1 : 0, e: clamp(+s.e || 0, 0, 1e5), a: clamp(s.a | 0, 0, 9), gn: clamp(s.gn | 0, 0, 9), f,
    log: (Array.isArray(s.log) ? s.log : []).filter(x => typeof x === 'string').slice(-30).map(x => x.slice(0, 220)) };
}
/* Schritte überspringen, die für den gewählten Weg nicht gelten; am Ende des Kapitels der Lohn */
function stFix(){
  const S = stS();
  for (let guard = 0; guard < 80; guard++){
    const C = ST_CH[S.c]; if (!C) return;
    const st = C.steps[S.s];
    if (!st){ stChapterEnd(C); continue; }
    if (st.if && !st.if(S.f, S)){ S.s++; continue; }
    return;
  }
}
function stComplete(){
  const S = stS();
  for (const m of STY.mobs) if (G.mons.includes(m)) G.mons.splice(G.mons.indexOf(m), 1);
  STY.mobs = []; STY.path = null; STY.doneKey = '';
  if (STY.unsafe){ STY.unsafe = null; updateZone(false); }
  S.s++; S.n = 0; S.b = 0; S.e = 0; S.a = 0;
  for (const [id, a] of STY.act) if (a.esc) STY.act.delete(id);
  stFix(); Sound.quest();
  stSync(); renderTracker(); updateHud(); markDirty(true);
  const st = stStep();
  if (st && !stLocked()){
    if (st.type === 'choice' && st.auto) setTimeout(() => { if (G.mode === 'play' && stStep() === st) stOpenChoice(st); }, 60);
    else if (st.type !== 'choice' || st.npc) logLine('Hauptgeschichte: ' + stGoal(st), '#ffd98a');
  }
}
function stChapterEnd(C){
  const S = stS(), r = C.reward(S.f, S);
  const xp = Math.round(xpNeed(Math.max(C.lvl, HERO.lvl)) * .6) + 40, gold = 40 + Math.max(C.lvl, HERO.lvl) * 15;
  const it = makeItem(r.s, Math.max(C.lvl, HERO.lvl) + 2, r.r || 4, { name: r.n, aff: r.aff });
  const j = HERO.inv.indexOf(null);
  if (j >= 0) HERO.inv[j] = it; else dropLoot(G.knight, 'item', 0, it);
  HERO.gold += gold;
  S.log.push('Kapitel ' + C.n + ' „' + C.t + '“ (' + C.year + ') abgeschlossen. Lohn: ' + r.n + '.'); lwAdd(25);
  if (r.title){ S.f.titel = r.tid; S.log.push('Man nennt Euch nun: ' + r.title + '.'); }
  S.c++; S.s = 0; S.n = 0; S.b = 0; S.e = 0; S.a = 0;
  showBanner('Kapitel ' + C.n + ' abgeschlossen', C.t);
  logLine('Kapitel ' + C.n + ' „' + C.t + '“ abgeschlossen: ' + gold + ' Gulden, ' + xp + ' EP.', '#ffd98a');
  logItem('Lohn: ', it);
  gainXp(xp); Sound.levelUp(); Sound.cheer(1); G.flash = .3;
  const N = ST_CH[S.c];
  if (N) setTimeout(() => logLine('Hauptgeschichte: Kapitel ' + N.n + ' „' + N.t + '“' + (HERO.lvl < N.lvl ? ' wartet ab Stufe ' + N.lvl + '.' : ' beginnt. ' + stGoal(N.steps[0])), '#ffd98a'), 2600);
  else setTimeout(() => { showBanner('Ende der Hauptgeschichte', r.title || 'Unruhige Zeiten'); logLine('Die Hauptgeschichte ist zu Ende. Eure Chronik steht im Auftragsbuch (L).', '#ffd98a'); }, 2600);
  pushFame();
}
const stTitle = () => { const t = HERO && HERO.story && HERO.story.f.titel; return t ? ST_TITLES[t] || '' : ''; };

/* ---------- Ziel, Wegweiser, Anzeige ---------- */
function stGoal(st){
  if (!st) return '';
  const S = stS();
  if (st.type === 'kill'){ const tot = stTotal(st); return st.t + ' (' + Math.min(tot, S.n + S.b) + ' / ' + tot + ')'; }
  if (st.type === 'hunt') return st.t + ' (' + Math.min(S.n, st.n) + ' / ' + st.n + ')';
  if (st.type === 'escort'){ const P = stPath(st), amb = st.amb[S.a]; return st.t + (amb && S.e >= amb.at * P.len - 1 ? ': Überfall!' : ' (' + Math.round(S.e / P.len * 100) + ' %)'); }
  return st.t;
}
const stTotal = st => st.mobs.reduce((a, m) => a + m.n, 0) + (st.boss ? 1 : 0);
function stNpcAt(id){ return NPCS.find(n => n.id === id); }
function stTarget(){
  if (!stActive() || G.inside || DG_ON) return null;
  const st = stStep(), S = stS();
  if ((st.type === 'talk' || st.type === 'choice') && st.npc){ const n = stNpcAt(st.npc); return n ? { x: n.x, y: n.y, label: n.name } : null; }
  if (st.type === 'escort'){ const P = stPath(st), p = stAt(P, S.e); return { x: p.x, y: p.y, label: st.lead || 'Geleit' }; }
  if (st.at){ const p = stPt(st.at); return { x: p.x, y: p.y, label: st.place || 'Hauptgeschichte' }; }
  return null;
}
function stRows(box){
  if (!HERO) return;
  const C = stCh();
  if (!C){ return; }
  if (!HERO.story && HERO.lvl < C.lvl) return;
  const p = el('p', 'st');
  if (HERO.lvl < C.lvl){ p.classList.add('wait'); p.append(el('b', null, 'Kapitel ' + C.n + ': '), el('span', null, 'ab Stufe ' + C.lvl)); box.append(p); return; }
  const st = stStep(); if (!st) return;
  p.append(el('b', null, 'Kapitel ' + C.n + ': '), el('span', null, stGoal(st)));
  box.append(p);
}
function stQuestCard(box){
  if (!HERO) return;
  const S = stS(), C = stCh(), card = el('div', 'qcard story');
  if (C){
    card.append(el('h4', null, 'Hauptgeschichte · Kapitel ' + C.n + ': ' + C.t), el('p', 'qyear', C.year), el('p', null, C.d));
    const st = stStep();
    card.append(el('p', 'qgoal', HERO.lvl < C.lvl ? 'Dieses Kapitel beginnt ab Stufe ' + C.lvl + '.' : 'Jetzt: ' + stGoal(st)));
    if (st && st.d && HERO.lvl >= C.lvl) card.append(el('p', 'qprog', st.d));
  } else card.append(el('h4', null, 'Hauptgeschichte: Unruhige Zeiten'), el('p', 'qgoal', 'Abgeschlossen' + (stTitle() ? '. Man nennt Euch: ' + stTitle() + '.' : '.')));
  if (S.log.length){
    const det = el('details', 'chron'), sum = el('summary', null, 'Chronik (' + S.log.length + ')'), ul = el('ul');
    for (const l of S.log) ul.append(el('li', null, l));
    det.append(sum, ul); if (!C) det.open = true; card.append(det);
  }
  box.append(card);
}
function stWants(id){
  if (!stActive()) return false;
  const st = stStep();
  return (st.type === 'talk' || st.type === 'choice') && st.npc === id;
}

/* ---------- Leute der Geschichte in der Welt (zum Ansprechen) und stumme Darsteller ---------- */
function stSync(){
  if (!HERO) return;
  for (const n of STY.npcs){ const i = NPCS.indexOf(n); if (i >= 0) NPCS.splice(i, 1); if (n.act) STY.act.delete(n.act.id); }
  STY.npcs = [];
  for (const [id, a] of STY.act) if (a.cast && !(G.scene && G.scene.temp.includes(id))) STY.act.delete(id);
  const st = stActive() ? stStep() : null;
  if (!st || !st.cast) return;
  for (const c of st.cast){
    if (c.if && !c.if(stS().f, stS())) continue;
    const a = stActor('c_' + c.id, c.as || c.id, c.talk ? gNear(c.at[0], c.at[1]) : c.at, c.dir || 'down', { cast: true, lie: !!c.lie, mute: !!c.mute, ride: c.ride || null });
    if (c.talk){
      STY.act.delete(a.id);
      const C = ST_CAST[c.as || c.id], set = stSet(C), frame = C.kn ? set.walk.down[0].img : set.stand.down;
      const n = { id: c.id, key: 'st_' + c.id, name: C.nm, role: c.role || 'Hauptgeschichte', x: a.x, y: a.y, act: a, art: { frames: [frame, frame], ax: C.kn ? KS.ax : set.ax, ay: C.kn ? 50 : set.ay },
        greet: [c.greet || 'Gott zum Gruße, Herr Ritter.'], story: true };
      NPC_URL[n.key] = stPortrait(C);
      NPCS.push(n); STY.npcs.push(n);
    }
  }
}

/* ---------- Ablauf in der Welt ---------- */
function stTick(dt){
  for (const a of STY.act.values()) stMove(a, dt);
  if (!stActive() || G.mode !== 'play') return;
  const st = stStep(), S = stS(), k = G.knight;
  if (STY.key !== stKey()){ STY.key = stKey(); STY.mobs = STY.mobs.filter(m => G.mons.includes(m) && m.story && m.story.key === STY.key); }
  const busy = () => G.mons.some(m => m.mode === 'fight' && !m.story && !m.ev && Math.hypot(m.x - k.x, m.y - k.y) < 320);   // Weltereignisse halten die Geschichte nicht auf
  if (st.type === 'goto'){
    const p = stPt(st.at);
    if (Math.hypot(k.x - p.x, k.y - p.y) < (st.r || 70) * WS){
      STY.busyT = busy() ? (STY.busyT || 0) + dt : 0;
      if (STY.busyT > 0 && STY.busyT < 15){ if ((STY.waitT -= dt) <= 0){ STY.waitT = 6; floatText(k.x, k.y - KS.ay - 8, 'Erst den Kampf beenden', '#ffd98a'); } return; }
      STY.busyT = 0;
      stPlay(st.scene, stComplete);
    }
  } else if (st.type === 'kill') stKillTick(st, S);
  else if (st.type === 'escort') stEscortTick(st, S, dt);
  else if (st.type === 'scene') stPlay(st.scene, stComplete);
}
const ST_TINT = {
  dunkel: (r, g, b) => [r * .45, g * .45, b * .55],
  trier: (r, g, b) => [Math.min(255, r * 1.15 + 18), g * .7, b * .7],
  fuersten: (r, g, b) => [r * .7, g * .8, Math.min(255, b * 1.2 + 20)],
  bund: (r, g, b) => [Math.min(255, r * 1.1 + 10), g * .85, b * .6],
  bauer: (r, g, b) => [r * .85 + 24, g * .8 + 16, b * .6],
  gold: (r, g, b) => [Math.min(255, r * 1.15 + 30), Math.min(255, g * 1.05 + 18), b * .55]
};
const ST_ART = {};
function stArt(kind, tint){ const key = kind + ':' + tint; return ST_ART[key] || (ST_ART[key] = tintArt(artOf(kind), ST_TINT[tint])); }
function stSpawn(st, spec, key, at, boss){
  const p = gRandWalk(at.x, at.y, boss ? 10 : 40, boss ? 60 : 170) || at;
  const m = createMonster(spec.k, p.x, p.y, stLv(spec.lv || 0), null);
  m.story = { key, boss: !!boss }; m.nm = spec.nm; m.hx = at.x; m.hy = at.y; m.zone = gZone(m.x, m.y).id;
  if (spec.tint) m.art = stArt(spec.k, spec.tint);
  if (spec.hpf){ m.hp = m.max = Math.round(monHp(spec.k, m.lvl) * spec.hpf); }
  if (boss){ m.summoned = true; m.elite = MON[spec.k].boss ? null : null; }
  STY.mobs.push(m);
  for (let j = 0; j < 6; j++) G.parts.push({ x: m.x + rand(-8, 8), y: m.y, vx: rand(-20, 20), vy: rand(-30, -10), life: .5, c: '#6e5a42', g: 40 });
  if (Math.hypot(G.knight.x - m.x, G.knight.y - m.y) < 380) engage(m, true);
  return m;
}
function stKillTick(st, S){
  const at = stPt(st.at), k = G.knight, d = Math.hypot(k.x - at.x, k.y - at.y), key = stKey();
  const u = st.unsafe && d < 1600 ? st.unsafe : null;
  if (u !== STY.unsafe){ STY.unsafe = u; updateZone(false); }
  if (d > 1000) return;
  const alive = STY.mobs.filter(m => G.mons.includes(m) && m.story.key === key);
  const norm = st.mobs.reduce((a, m) => a + m.n, 0), aliveN = alive.filter(m => !m.story.boss).length;
  let want = Math.min(norm - S.n - aliveN, (st.cap || 8) - alive.length);
  for (let i = 0; want > 0 && i < 40; i++){
    const idx = S.n + aliveN + i, spec = stSpecAt(st.mobs, idx); if (!spec) break;
    stSpawn(st, spec, key, at, false); want--;
  }
  if (st.boss && !S.b && (S.n >= norm || st.bossFirst) && !alive.some(m => m.story.boss)){
    const m = stSpawn(st, st.boss, key, at, true); G.flash = .3; Sound.horn();
    showBanner(st.boss.nm, st.boss.sub || 'stellt sich zum Kampf');
    if (st.boss.cry) setTimeout(() => logLine(st.boss.nm + ': „' + st.boss.cry + '“', '#ff9a8a'), 300);
    engage(m, true);
  }
}
const stSpecAt = (mobs, idx) => { let s = 0; for (const m of mobs){ s += m.n; if (idx < s) return m; } return null; };
/* ein Gegner der Geschichte fällt (aus kill(), auch wenn ein Mitspieler den letzten Hieb hatte) */
function stKill(m){
  if (!m.story || !HERO || m.story.key !== stKey()) return;
  const st = stStep(), S = stS();
  if (!st) return;
  if (st.type === 'kill'){
    if (m.story.boss) S.b = 1; else S.n++;
    renderTracker(); markDirty();
    if (S.n + S.b >= stTotal(st) && STY.doneKey !== stKey()){ STY.doneKey = stKey(); setTimeout(() => stPlay(st.after, stComplete), 700); }
  } else if (st.type === 'escort' && m.story.amb === S.a){
    S.n++; renderTracker(); markDirty();
  }
}
function stHunt(kind){
  if (!stActive()) return;
  const st = stStep(), S = stS();
  if (st.type !== 'hunt' || kind !== st.kind) return;
  S.n++; renderTracker(); markDirty();
  floatText(G.knight.x, G.knight.y - KS.ay - 22, st.unit + ' ' + Math.min(S.n, st.n) + ' / ' + st.n, '#ffd98a');
  if (S.n >= st.n && STY.doneKey !== stKey()){ STY.doneKey = stKey(); setTimeout(() => stPlay(st.after, stComplete), 600); }
}

/* ---------- Geleit: die Gruppe geht ihren Weg, wartet auf den Ritter, hält bei einem Überfall ---------- */
function stPath(st){
  if (STY.path && STY.path.st === st) return STY.path;
  const pts = st.path.map(stPt), cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return (STY.path = { st, pts, cum, len: cum[cum.length - 1] });
}
function stAt(P, s){
  s = clamp(s, 0, P.len);
  let i = 1; while (i < P.cum.length - 1 && P.cum[i] < s) i++;
  const a = P.pts[i - 1], b = P.pts[i], t = clamp((s - P.cum[i - 1]) / Math.max(1, P.cum[i] - P.cum[i - 1]), 0, 1);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: b.x - a.x, dy: b.y - a.y };
}
function stEscortTick(st, S, dt){
  const P = stPath(st), k = G.knight;
  // Darsteller anlegen
  st.who.forEach((w, i) => { if (!STY.act.has('esc' + i)) stActor('esc' + i, w, stAt(P, S.e - i * 40), 'down', { esc: true }); });
  const lead = stAt(P, S.e), amb = st.amb[S.a], ambS = amb ? amb.at * P.len : Infinity, key = stKey();
  let walking = false;
  if (amb && S.e >= ambS - 1){
    S.e = ambS;
    const tot = amb.mobs.reduce((a, m) => a + m.n, 0);
    if (S.n >= tot){ S.a++; S.n = 0; logLine(st.cleared || 'Der Weg ist frei, es geht weiter.', '#9fe08a'); renderTracker(); markDirty(); }
    else if (Math.hypot(k.x - lead.x, k.y - lead.y) < 1100){
      const alive = STY.mobs.filter(m => G.mons.includes(m) && m.story.key === key && m.story.amb === S.a).length;
      if (!STY.ambShown){ STY.ambShown = true; showBanner(amb.nm || 'Überfall!', amb.sub || 'Schützt den Zug!'); Sound.horn(); if (amb.cry) logLine(amb.cry, '#ff9a8a'); }
      for (let i = 0, want = tot - S.n - alive; i < want; i++){
        const spec = stSpecAt(amb.mobs, S.n + alive + i); if (!spec) break;
        const side = (i % 2 ? 1 : -1), c = { x: lead.x + side * rand(90, 150), y: lead.y + rand(-80, 80) };
        const m = stSpawn(st, spec, key, gNear(c.x / WS, c.y / WS), false); m.story.amb = S.a; m.hx = lead.x; m.hy = lead.y; engage(m, true);
      }
    }
  } else {
    STY.ambShown = false;
    const near = Math.hypot(k.x - lead.x, k.y - lead.y) < 300;
    if (near){ S.e = Math.min(P.len, S.e + (st.spd || 36) * dt); walking = true; STY.saveT = (STY.saveT || 0) + dt; if (STY.saveT > 5){ STY.saveT = 0; markDirty(); } }
    else if ((STY.waitT -= dt) <= 0){ STY.waitT = 9; const a = STY.act.get('esc0'); if (a){ a.say = st.wait || 'Wir warten auf Euch, Herr Ritter!'; a.sayT = nowS() + 3; } }
  }
  st.who.forEach((w, i) => {
    const a = STY.act.get('esc' + i), p = stAt(P, S.e - i * 40);
    a.x = p.x; a.y = p.y; a.moving = walking && S.e - i * 40 > 0; if (walking) a.anim += dt * 6;
    if (Math.abs(p.dx) + Math.abs(p.dy) > 0) a.dir = Math.abs(p.dx) > Math.abs(p.dy) ? (p.dx > 0 ? 'right' : 'left') : (p.dy > 0 ? 'down' : 'up');
    if (!walking && amb && S.e >= ambS - 1) a.dir = 'down';
  });
  if (S.e >= P.len){ S.e = P.len; stPlay(st.after, stComplete); }
  const key2 = 'e' + Math.round(S.e / P.len * 100) + ':' + S.a + ':' + S.n;
  if (key2 !== STY.rowKey){ STY.rowKey = key2; renderTracker(); }
}

/* ---------- Gespräche und Entscheidungen ---------- */
function stTalkOpts(n, opts){
  if (!stWants(n.id)) return;
  const st = stStep(), C = stCh();
  if (st.type === 'talk') opts.append(btn('Kapitel ' + C.n + ': ' + (st.opt || st.t), () => { closePanel(); stPlay(st.scene, stComplete); }, 'opt story'));
  else opts.append(btn('Kapitel ' + C.n + ': ' + (st.opt || 'Eure Entscheidung'), () => renderTalk('story'), 'opt story'));
}
function stOpenChoice(st){
  const c = ST_CAST[st.who], set = stSet(c), frame = c.kn ? set.walk.down[0].img : set.stand.down;
  const n = { id: 'st_' + st.who, key: 'st_' + st.who, name: c.nm, role: 'Hauptgeschichte', x: G.knight.x, y: G.knight.y, art: { frames: [frame, frame], ax: 0, ay: 0 }, greet: [st.q], story: true, choice: true };
  NPC_URL[n.key] = stPortrait(c);
  openTalk(n); renderTalk('story');
}
function stChoiceView(body, opts){
  const st = stStep(), S = stS();
  if (!st || st.type !== 'choice'){ closePanel(); return; }
  $('talkText').textContent = st.q;
  for (const o of st.opts){
    const ok = !o.need || o.need(S.f, S);
    const b = btn(o.t, () => {
      Object.assign(S.f, o.f || {});
      const gk = 'g' + S.c + S.s;   // Gewissen nur einmal je Entscheidung, auch nach einem Neuladen mitten in der Szene
      if (o.gn && !S.f[gk]){ S.gn = clamp(S.gn + o.gn, 0, 9); S.f[gk] = '1'; }
      if (o.log && S.log[S.log.length - 1] !== o.log) S.log.push(o.log);
      Sound.choose(); closePanel(); markDirty(true);
      stPlay(o.scene, stComplete);
    }, 'opt' + (ok ? '' : ''));
    b.disabled = !ok; opts.append(b);
    if (!ok && o.no) opts.append(el('p', 'hint', o.no));
  }
  if (!G.talk || !G.talk.choice) opts.append(btn('Später', () => renderTalk('main'), 'tbtn'));
  body.append(opts);
}

/* Start, Stufenaufstieg, Taste E ohne Gegenüber */
function stStart(){
  STY.act.clear(); STY.npcs.forEach(n => { const i = NPCS.indexOf(n); if (i >= 0) NPCS.splice(i, 1); }); STY.npcs = [];
  STY.mobs = []; STY.path = null; STY.key = ''; STY.held = null; STY.unsafe = null; STY.doneKey = '';
  if (!HERO.story && HERO.lvl < ST_CH[0].lvl) return;
  stS(); stFix(); stSync();
  const C = stCh(), st = stStep();
  if (!C || !st) return;
  if (HERO.lvl < C.lvl) return;
  setTimeout(() => {
    if (!HERO || G.mode !== 'play') return;
    if (st.type === 'choice' && st.auto && stStep() === st) stOpenChoice(st);
    else logLine('Hauptgeschichte, Kapitel ' + C.n + ': ' + stGoal(st), '#ffd98a');
  }, 1800);
}
function stLevel(L){
  if (!HERO) return;
  const C = HERO.story ? stCh() : ST_CH[0];
  if (!C || C.lvl !== L) return;
  stS(); stFix(); stSync(); renderTracker();
  setTimeout(() => { showBanner('Hauptgeschichte', 'Kapitel ' + C.n + ': ' + C.t); logLine('Hauptgeschichte, Kapitel ' + C.n + ' „' + C.t + '“: ' + stGoal(stStep()), '#ffd98a'); Sound.horn(); }, 2400);
}
function stTalkFallback(){
  if (!stActive()) return false;
  const st = stStep();
  if (st.type === 'choice' && st.auto){ stOpenChoice(st); return true; }
  return false;
}

/* ---------- Die fünf Kapitel ----------
   Orte in Weltpixeln. Historisch: Karls Krönung in Aachen (Oktober 1520), Aleanders Bücherverbrennungen (Mainz, November 1520,
   der Henker weigerte sich), Luther in Worms (April 1521) mit dem Reichsherold Kaspar Sturm, der vorgetäuschte Überfall
   (Mai 1521), Sickingens Fehde gegen Trier (1522) und sein Tod auf Nanstein (Mai 1523), die zwölf Artikel (März 1525),
   Weinsberg (Ostern 1525), Götz als Bauernhauptmann, der Vertrag von Weingarten (April 1525). */
const ST_TITLES = { bauern: 'Bauernritter', herren: 'Bannerherr des Bundes', frieden: 'Friedensstifter' };
const ST_KAISERWEG = [[2040, 800], [1960, 800], [1946, 836], [1890, 874], [1860, 930], [1876, 1010], [1898, 1100], [1900, 1200], [1900, 1310], [2150, 1330], [2350, 1372], [2470, 1400], [2620, 1404], [2760, 1384], [2830, 1480], [2900, 1600], [2950, 1720], [2966, 1800], [2966, 1856]];
const ST_HIPLERWEG = [[2470, 640], [2455, 720], [2440, 790], [2300, 790], [2150, 788], [2040, 800], [1960, 800], [1946, 836], [1890, 874], [1860, 930], [1876, 1010], [1898, 1100], [1900, 1200], [1900, 1286]];
const isF = (k, v) => f => f[k] === v;
const ST_CH = [
/* ===== Kapitel 1 ===== */
{ n: 1, t: 'Der neue Kaiser', year: 'Herbst 1520', lvl: 2,
  d: 'In Aachen ist der junge Karl gekrönt worden. Sein erstes Ausschreiben soll ins Reichsland kommen, doch der Reichsbote ist überfällig.',
  reward: f => f.k1 === 'brand' ? { s: 'kleinod', n: 'Rosenkranz des Kommissars', aff: ['hp', 'arm', 'crit'], r: 3 } : { s: 'kleinod', n: 'Lettern des Druckers Melchior', aff: ['str', 'crit', 'spd'], r: 3 },
  steps: [
  { type: 'talk', npc: 'vogt', opt: 'Ihr habt nach mir geschickt?', t: 'Sprecht mit dem Vogt in der Reichsburg', d: 'Der Vogt Heinrich lässt nach Euch schicken.',
    scene: [
      { title: 'Kapitel 1: Der neue Kaiser', sub: 'Reichsland, im Herbst des Jahres 1520' },
      { say: 'vogt', text: 'Gut, dass Ihr kommt. In Aachen hat man den jungen Karl gekrönt, den Enkel des alten Kaisers Maximilian. Zwanzig Jahre ist er alt und herrscht über Spanien, Burgund und das Reich.' },
      { say: 'vogt', text: 'Sein erstes Ausschreiben ist zu uns unterwegs: Er ruft die Stände zum Reichstag nach Worms. Doch der Reichsbote ist überfällig. Gestern hätte er hier sein sollen.' },
      { say: 'me', text: 'Welchen Weg nimmt er?' },
      { say: 'vogt', text: 'Den Burgweg hinab, durch die Obstgärten. Dort treibt sich Gesindel herum. Reitet hinunter und seht nach ihm.' }
    ] },
  { type: 'goto', at: [1880, 1080], r: 60, place: 'Der Reichsbote', t: 'Sucht den Reichsboten in den Obstgärten', d: 'Er kam den Burgweg herunter, durch die Obstgärten.',
    cast: [{ id: 'bote', at: [1880, 1080], lie: true }],
    scene: [
      { pan: [1880, 1066] },
      { say: 'bote', text: 'Herr Ritter … Gott sei Dank. Sie kamen aus den Bäumen, fünf Mann mit Spießen und Knüppeln.' },
      { say: 'bote', text: 'Die Ledertasche mit dem kaiserlichen Siegel haben sie mir genommen. Ihr Anführer heißt Hans Ohnegnad. Nach Westen sind sie, zu den alten Bäumen.' },
      { say: 'me', text: 'Bleibt liegen und haltet durch. Ich hole Euch die Tasche zurück.' }
    ] },
  { type: 'kill', at: [1560, 1040], place: 'Strauchdiebe', t: 'Holt die Tasche von den Strauchdieben zurück', d: 'Hans Ohnegnad und seine Strauchdiebe lagern westlich des Burgwegs.',
    cast: [{ id: 'bote', at: [1880, 1080], lie: true }],
    mobs: [{ k: 'pluend', n: 4, nm: 'Strauchdieb' }], boss: { k: 'pluend', nm: 'Hans Ohnegnad', hpf: 3.5, lv: 1, tint: 'dunkel', sub: 'Anführer der Strauchdiebe', cry: 'Das Siegel bleibt bei uns, Blechmann!' },
    after: [
      { say: 'me', text: 'Da ist die Tasche, und das Siegel ist unversehrt. Zurück zum Vogt.' }
    ] },
  { type: 'talk', npc: 'vogt', opt: 'Die Tasche des Reichsboten', t: 'Bringt die Tasche zum Vogt',
    scene: [
      { say: 'vogt', text: 'Ihr habt sie! Und das Siegel ist heil. Lasst sehen …' },
      { say: 'vogt', text: '„Wir, Karl, erwählter Römischer Kaiser, laden Kurfürsten, Fürsten, Grafen, Herren und Städte auf den Tag der Heiligen Drei Könige nach Worms.“ Da wird über vieles gesprochen werden. Auch über einen Mönch aus Wittenberg.' },
      { say: 'vogt', text: 'Die Reichsstadt muss eine Abschrift haben. Bringt sie dem Bürgermeister Ulman. Und Ritter: In der Stadt gärt es. Seht Euch vor.' }
    ] },
  { type: 'talk', npc: 'buerger', opt: 'Ein Ausschreiben des Kaisers', t: 'Bringt die Abschrift zum Bürgermeister der Reichsstadt',
    scene: [
      { say: 'buerger', text: 'Ein Ausschreiben des Kaisers, mit Siegel! Habt Dank, Herr Ritter. Worms also … Die Stadt wird Gesandte schicken.' },
      { put: 'aleander', at: [3090, 2318], dir: 'left' }, { put: 'henker', at: [3110, 2338], dir: 'left' }, { put: 'melchior', at: [2952, 2340], dir: 'right' },
      { put: 'bu1', as: 'buerger1', at: [2948, 2300], dir: 'right' }, { put: 'bu2', as: 'buerger2', at: [3034, 2366], dir: 'up' }, { put: 'magd', at: [2968, 2378], dir: 'up' },
      { fx: 'books', at: [2990, 2334] },
      { pan: [2990, 2330] },
      { walk: 'aleander', to: [3020, 2320], face: 'left' }, { walk: 'henker', to: [3006, 2344], face: 'left', wait: true },
      { say: 'aleander', text: 'Im Namen Seiner Heiligkeit, des Papstes Leo! Ich bin Hieronymus Aleander, Gesandter des Heiligen Stuhls. Diese Bücher des Ketzers Luther werden heute verbrannt.' },
      { say: 'melchior', text: 'Das sind meine Drucke! „An den christlichen Adel deutscher Nation“. Darin steht nichts als die Wahrheit über Rom!' },
      { say: 'aleander', text: 'Meister Hans, entzündet den Haufen.' },
      { say: 'henker', text: 'Erst frage ich die Bürger dieser Stadt: Sind diese Bücher nach Recht und Urteil verdammt?' },
      { say: 'bu1', nm: 'Die Bürger', text: 'Nein! Kein Gericht hat sie verurteilt!' },
      { say: 'henker', text: 'Dann verbrenne ich sie nicht. Ich vollstrecke nur, was ein Richter verurteilt hat.' },
      { walk: 'henker', to: [3070, 2350] },
      { say: 'aleander', text: 'Feigling! … Ihr da, Ritter. Ihr steht im Dienst des Kaisers, und der Kaiser steht zur Kirche. Nehmt die Fackel.' },
      { hold: true }
    ] },
  { type: 'choice', auto: true, who: 'aleander', t: 'Entscheidet Euch auf dem Markt (E)',
    q: 'Aleander hält Euch die Fackel hin. Der Drucker Melchior sieht Euch an, die Bürger schweigen.',
    opts: [
      { t: 'Die Fackel nehmen und den Haufen anzünden', f: { k1: 'brand' }, log: 'Herbst 1520: Ihr habt auf dem Markt Luthers Bücher für den Kommissar Aleander verbrannt.',
        scene: [
          { fx: 'fire', at: [2990, 2332], big: 1.1, sound: 'fire' },
          { say: 'aleander', text: 'So geht es allen Schriften gegen den Heiligen Vater. Der Kaiser wird von Eurer Treue hören.' },
          { say: 'melchior', text: 'Bücher kann man verbrennen, Herr Ritter. Was darin steht, nicht. Es ist längst tausendfach gedruckt.' },
          { say: 'buerger', text: 'Mir gefällt das nicht. Aber Ihr habt getan, was Ihr für Eure Pflicht haltet. Hier ist der Dank der Stadt für das Ausschreiben.' }
        ] },
      { t: 'Euch weigern wie der Henker', f: { k1: 'weigern' }, gn: 1, log: 'Herbst 1520: Ihr habt Euch geweigert, Bücher zu verbrennen, die kein Gericht verurteilt hatte.',
        scene: [
          { say: 'me', text: 'Der Henker hat recht. Kein Gericht hat diese Bücher verurteilt. Ich verbrenne sie nicht.' },
          { say: 'aleander', text: 'Das wird der Kaiser erfahren! Diese ganze Stadt steht im Ruch der Ketzerei.' },
          { walk: 'aleander', to: [3150, 2318], spd: 60 },
          { say: 'melchior', text: 'Das vergesse ich Euch nicht, Herr Ritter. Wenn Ihr je einen Drucker braucht: Meine Presse steht Euch offen.' },
          { say: 'buerger', text: 'Mutig, vielleicht zu mutig. Aber die Stadt dankt Euch, für das Ausschreiben und für den Frieden auf dem Markt.' }
        ] }
    ] }
  ] },
/* ===== Kapitel 2 ===== */
{ n: 2, t: 'Hier stehe ich', year: 'Frühjahr 1521', lvl: 5,
  d: 'Der Kaiser hat Doktor Martin Luther nach Worms geladen und ihm freies Geleit versprochen. Der Reichsherold sucht einen Ritter für den Weg durch das Reichsland.',
  reward: f => f.k2 === 'kampf' ? { s: 'helm', n: 'Visierhelm des Wenkheim', aff: ['arm', 'hp', 'str'], r: 3 } : { s: 'kleinod', n: 'Brief des Junkers Jörg', aff: ['hp', 'crit', 'spd'], r: 3 },
  steps: [
  { type: 'talk', npc: 'herold', opt: 'Ihr sucht einen Ritter?', t: 'Sprecht mit dem Herold vor der Reichsstadt', d: 'Herold Kaspar steht bei der Turnierwiese östlich der Stadt.',
    scene: [
      { title: 'Kapitel 2: Hier stehe ich', sub: 'Reichsland, im April des Jahres 1521' },
      { say: 'herold', text: 'Ihr seid der Ritter, der das Ausschreiben gerettet hat? Dann seid Ihr der Rechte. Ich bin nicht nur Turnierherold: Der Kaiser hat mich zum Reichsherold ernannt, Kaspar Sturm ist mein Name.' },
      { say: 'herold', text: 'Mein Auftrag: Ich geleite Doktor Martin Luther aus Wittenberg nach Worms. Der Kaiser hat ihm freies Geleit zugesagt, hin und zurück.' },
      { say: 'me', text: 'Freies Geleit hatte auch Jan Hus in Konstanz. Man hat ihn trotzdem verbrannt.' },
      { say: 'herold', text: 'Darum brauche ich Euch. Es gibt Leute, die auf das Kopfgeld hoffen, das manche Pfaffen versprechen. Trefft uns am Gasthaus Zum Roten Ochsen am Burgweg.' }
    ] },
  { type: 'goto', at: [2046, 800], r: 60, place: 'Zum Roten Ochsen', t: 'Trefft Luther am Gasthaus Zum Roten Ochsen', d: 'Am Burgweg unter der Reichsburg.',
    cast: [{ id: 'luther', at: [2024, 810] }, { id: 'kaspar', at: [2068, 810] }],
    scene: [
      { pan: [2046, 804] },
      { say: 'kaspar', text: 'Da seid Ihr. Herr Doktor, das ist der Ritter, von dem ich Euch erzählt habe.' },
      { say: 'luther', text: 'Gott zum Gruß, Herr Ritter. Man hat mir geraten umzukehren. In Worms würde man mich verbrennen wie den Hus.' },
      { say: 'luther', text: 'Aber ich sage Euch: Und wären so viel Teufel in Worms, wie Ziegel auf den Dächern, ich wollte doch hinein.' },
      { say: 'me', text: 'Dann bringe ich Euch sicher bis an die Brücke vor der Reichsstadt. Dort übernimmt die Stadt das Geleit.' }
    ] },
  { type: 'escort', who: ['kaspar', 'luther'], lead: 'Doktor Luther', path: ST_KAISERWEG, spd: 38, t: 'Geleitet Luther zur Brücke vor der Reichsstadt',
    d: 'Bleibt nahe beim Zug, sonst wartet er auf Euch.', wait: 'Herr Ritter, wir warten auf Euch!', cleared: 'Die Kopfgeldjäger sind vertrieben. Luther betet kurz, dann geht es weiter.',
    amb: [
      { at: .3, nm: 'Überfall!', sub: 'Kopfgeldjäger wollen Luther', cry: '„Der Ketzer ist hundert Gulden wert, Geleit hin oder her!“', mobs: [{ k: 'pluend', n: 3, nm: 'Kopfgeldjäger' }, { k: 'armbrust', n: 1, nm: 'Kopfgeldjäger' }] },
      { at: .7, nm: 'Hinterhalt', sub: 'Schützt den Doktor!', mobs: [{ k: 'pluend', n: 2, nm: 'Kopfgeldjäger' }, { k: 'armbrust', n: 2, nm: 'Armbruster der Kopfgeldjäger' }] }
    ],
    after: [
      { say: 'luther', text: 'Ihr habt Euer Leben für einen armen Mönch gewagt. Gott vergelte es Euch.' },
      { say: 'kaspar', text: 'Von hier an geleitet uns die Stadt. Wartet auf Nachricht aus Worms, Herr Ritter.' },
      { title: 'Worms, am 18. April 1521', sub: 'Im Bischofshof tagt der Reichstag. Der Kaiser, die Kurfürsten und die Stände des Reiches sind versammelt.' },
      { stage: 'worms' },
      { put: 'kaiser', at: [0, -14], dir: 'down' }, { put: 'eck', at: [-70, 34], dir: 'right' }, { put: 'luther', at: [0, 82], dir: 'up' }, { put: 'kaspar', at: [104, 70], dir: 'up' },
      { say: 'eck', text: 'Martin Luther! Seine Kaiserliche Majestät fragt Euch zum zweiten Mal: Bekennt Ihr Euch zu diesen Büchern, und widerruft Ihr, was darin gegen die Kirche steht?' },
      { say: 'luther', text: 'Wenn ich nicht durch Zeugnisse der Schrift oder durch klare Gründe der Vernunft überwunden werde, so bleibe ich gebunden an die Schrift. Mein Gewissen ist gefangen in Gottes Wort.' },
      { say: 'luther', text: 'Widerrufen kann und will ich nichts, weil es weder sicher noch geraten ist, gegen das Gewissen zu handeln. Hier stehe ich, ich kann nicht anders. Gott helfe mir. Amen.' },
      { sound: 'bell' },
      { say: 'kaiser', text: 'Ein einzelner Mönch irrt, wenn er gegen die Meinung der ganzen Christenheit steht. Ich bin entschlossen, dafür meine Reiche, meine Freunde, meinen Leib und mein Leben einzusetzen.' },
      { title: 'Das Wormser Edikt', sub: 'Im Mai 1521 verhängt der Kaiser die Reichsacht über Luther: Niemand darf ihn beherbergen, jeder soll ihn ausliefern. Doch das Geleit für die Heimreise gilt noch einundzwanzig Tage.' },
      { stage: null }
    ] },
  { type: 'talk', npc: 'herold', opt: 'Gibt es Nachricht aus Worms?', t: 'Sprecht wieder mit dem Herold',
    scene: [
      { say: 'herold', text: 'Ihr habt es gehört: Die Acht ist verhängt. Ich habe den Doktor ein Stück auf dem Heimweg geleitet, dann hat er mich zurückgeschickt.' },
      { say: 'herold', text: 'Er nimmt den Weg durch den Finsterwald, mit seinem Freund Amsdorf. Mir ist nicht wohl dabei. Reitet ihm nach, Herr Ritter!' }
    ] },
  { type: 'goto', at: [1050, 862], r: 70, place: 'Weg in den Finsterwald', t: 'Holt Luther auf dem Weg in den Finsterwald ein', d: 'Der Weg zweigt westlich der Obstgärten in den Wald ab.',
    cast: [{ id: 'luther', at: [1032, 870], dir: 'left' }, { id: 'amsdorf', at: [1068, 876], dir: 'left' }],
    scene: [
      { pan: [1040, 866] },
      { say: 'luther', text: 'Herr Ritter! Ihr seid uns nachgeritten? Das wäre nicht nötig gewesen, das Geleit gilt noch …' },
      { put: 'wenk', as: 'wenkheim', at: [850, 850], dir: 'right', ride: 'streitross' }, { put: 'r1', as: 'reiter', at: [840, 900], dir: 'right', ride: 'zelter' }, { put: 'r2', as: 'reiter', at: [870, 806], dir: 'right', ride: 'zelter' },
      { sound: 'horn' },
      { walk: 'wenk', to: [982, 862] }, { walk: 'r1', to: [996, 908] }, { walk: 'r2', to: [1008, 828], wait: true },
      { say: 'wenk', nm: 'Vermummter Reiter', text: 'Halt! Wer von euch ist der Mönch Martinus? Absteigen, alle beide!' },
      { say: 'amsdorf', text: 'Herr Ritter, helft uns! Das sind Räuber!' },
      { hold: true }
    ] },
  { type: 'choice', auto: true, who: 'reiter', t: 'Entscheidet Euch im Finsterwald (E)',
    cast: [{ id: 'luther', at: [1032, 870], dir: 'left' }, { id: 'amsdorf', at: [1068, 876], dir: 'left' }],
    q: 'Die vermummten Reiter umringen Luther. Ihr Anführer trägt kein Wappen, aber er reitet ein Pferd, das mehr wert ist als ein ganzes Dorf.',
    opts: [
      { t: 'Das Schwert ziehen und die Reiter angreifen', f: { k2: 'kampf' }, log: 'Mai 1521: Im Finsterwald habt Ihr Luther gegen vermummte Reiter verteidigt.',
        scene: [
          { say: 'me', text: 'Hier kommt keiner durch! Der Doktor steht unter kaiserlichem Geleit!' },
          { say: 'wenk', nm: 'Vermummter Reiter', text: 'Dann eben mit Gewalt. Knechte, haltet ihn auf, aber tötet ihn nicht!' }
        ] },
      { t: 'Die Hand vom Schwert lassen und abwarten', f: { k2: 'still' }, gn: 1, log: 'Mai 1521: Im Finsterwald habt Ihr die vermummten Reiter gewähren lassen und geschwiegen.',
        scene: [
          { say: 'me', text: 'Räuber auf solchen Pferden? Und keiner greift nach dem Geldbeutel. Hier stimmt etwas nicht.' },
          { walk: 'wenk', to: [1010, 866], wait: true },
          { say: 'wenk', nm: 'Vermummter Reiter', text: 'Klug, Ritter. Hört gut zu und vergesst es dann: Wir dienen dem Kurfürsten Friedrich von Sachsen. Der Doktor wird versteckt, bis die Acht ihn nicht mehr findet.' },
          { say: 'luther', text: 'Also doch Freunde! Herr Ritter, sagt niemandem, was Ihr gesehen habt. Und betet für mich.' },
          { walk: 'luther', to: [880, 862] }, { walk: 'r1', to: [860, 900] }, { walk: 'r2', to: [860, 820] }, { walk: 'wenk', to: [850, 860] }, { walk: 'amsdorf', to: [1220, 862], wait: true },
          { title: 'Junker Jörg', sub: 'Luther verschwindet. Viele halten ihn für tot. Auf der Wartburg aber lebt bald ein bärtiger Junker Jörg und übersetzt das Neue Testament ins Deutsche.' }
        ] }
    ] },
  { type: 'kill', if: isF('k2', 'kampf'), at: [1000, 872], place: 'Vermummte Knechte', t: 'Wehrt die vermummten Knechte ab',
    cast: [{ id: 'luther', at: [1032, 870], dir: 'left' }, { id: 'amsdorf', at: [1068, 876], dir: 'left' }, { id: 'wenkheim', at: [940, 862], dir: 'right', ride: 'streitross', mute: true }],
    mobs: [{ k: 'pluend', n: 4, nm: 'Vermummter Knecht', tint: 'dunkel' }],
    after: [
      { say: 'wenkheim', nm: 'Vermummter Reiter', text: 'Genug! Haltet ein, Ritter, Ihr kämpft gegen Freunde.' },
      { say: 'wenkheim', text: 'Ich bin Burkhard Hund von Wenkheim. Wir kommen im Auftrag des Kurfürsten von Sachsen. Der Doktor muss verschwinden, ehe ihn die Acht trifft. Alle Welt soll glauben, Räuber hätten ihn verschleppt.' },
      { say: 'luther', text: 'So ist das also. Lasst es gut sein, Herr Ritter. Gott schickt mir Freunde, die wie Räuber aussehen.' },
      { say: 'me', text: 'Dann geht mit Gott, Herr Doktor. Gesehen habe ich nichts, außer einem guten Kampf.' },
      { walk: 'luther', to: [880, 862] }, { walk: 'wenkheim', to: [850, 852] }, { walk: 'amsdorf', to: [1220, 862], wait: true },
      { title: 'Junker Jörg', sub: 'Luther verschwindet. Viele halten ihn für tot. Auf der Wartburg aber lebt bald ein bärtiger Junker Jörg und übersetzt das Neue Testament ins Deutsche.' }
    ] }
  ] },
/* ===== Kapitel 3 ===== */
{ n: 3, t: 'Der letzte Ritter', year: '1522 bis 1523', lvl: 8,
  d: 'Die Reichsritter verarmen, die Fürsten werden mächtiger. Franz von Sickingen, der stärkste Ritter am Rhein, ruft seine Standesgenossen zur Fehde gegen den Erzbischof von Trier.',
  reward: f => f.k3 === 'sick' ? { s: 'waffe', n: 'Sickingens Schwert', aff: ['str', 'crit', 'spd'], r: 4 } : { s: 'schild', n: 'Schild der Fürsten von Hessen und der Pfalz', aff: ['block', 'arm', 'hp'], r: 4 },
  steps: [
  { type: 'talk', npc: 'hutten', opt: 'Ihr wolltet mich sprechen?', t: 'Ein Ritter wartet vor dem Gasthaus Zum Goldenen Adler', d: 'In der Reichsstadt, im Nordosten nahe der Mauer.',
    cast: [{ id: 'hutten', at: [3120, 2130], talk: true, greet: 'Ihr seid doch der Ritter, von dem man sich erzählt? Auf ein Wort.' }],
    scene: [
      { title: 'Kapitel 3: Der letzte Ritter', sub: 'Reichsland, im Sommer des Jahres 1522' },
      { say: 'hutten', text: 'Ulrich von Hutten, Ritter und Dichter. „Ich hab’s gewagt“, das ist mein Wahlspruch. Man erzählt sich, Ihr hättet den Luther beschützt.' },
      { say: 'hutten', text: 'Hört: Die Fürsten fressen uns Ritter auf, die geistlichen Herren pressen das Land aus. Mein Freund Franz von Sickingen hat in Landau die Ritterschaft am Rhein zu einem Bund geschlossen.' },
      { say: 'hutten', text: 'Wir ziehen gegen den Erzbischof von Trier. Fällt Trier, fällt die Macht der Pfaffenfürsten. Reitet mit uns!' }
    ] },
  { type: 'choice', auto: true, who: 'hutten', t: 'Gebt Hutten eine Antwort (E)',
    cast: [{ id: 'hutten', at: [3120, 2130], mute: true }],
    q: 'Hutten wartet auf Eure Antwort. Wer mit Sickingen reitet, bricht den ewigen Landfrieden des Reiches. Wer ablehnt, steht auf der Seite der Fürsten.',
    opts: [
      { t: 'Mit Sickingen gegen Trier reiten', f: { k3: 'sick' }, log: '1522: Ihr seid mit Franz von Sickingen gegen Trier geritten.',
        scene: [{ say: 'hutten', text: 'So spricht ein Ritter! Sickingen lagert mit seinem Heer im Landsknechtslager. Meldet Euch bei ihm.' }] },
      { t: 'Ablehnen und dem Vogt Meldung machen', f: { k3: 'fuerst' }, log: '1522: Ihr habt Hutten abgewiesen und den Fürsten gedient.',
        scene: [{ say: 'hutten', text: 'Dann seid Ihr ein Knecht der Fürsten wie alle anderen. Wir sehen uns auf dem Feld, Ritter.' }, { say: 'me', text: 'Der Landfriede gilt für alle. Auch für Sickingen.' }] }
    ] },
  // mit Sickingen
  { type: 'goto', if: isF('k3', 'sick'), at: [2962, 1215], r: 70, place: 'Sickingens Lager', t: 'Meldet Euch bei Sickingen im Landsknechtslager',
    cast: [{ id: 'sickingen', at: [2945, 1195] }, { id: 'goetz', at: [2988, 1200] }],
    scene: [
      { pan: [2966, 1202] },
      { say: 'sickingen', text: 'Hutten schickt Euch? Willkommen, Ritter. Ich bin Franz von Sickingen. Mehr als zwanzig Fehden habe ich geführt, gegen Städte, Fürsten und Herzöge.' },
      { say: 'goetz', text: 'Götz von Berlichingen. Die rechte Hand hab ich vor Landshut gelassen, die eiserne tut’s auch. Schön, dass noch einer Mut hat.' },
      { say: 'sickingen', text: 'Wir ziehen gegen Trier. Der Erzbischof Richard wird lernen, was die Ritterschaft vermag.' },
      { title: 'Trier, im September 1522', sub: 'Sickingen belagert Trier eine Woche lang. Doch die Stadt hält, und die Fürsten von Hessen und der Pfalz eilen dem Erzbischof zu Hilfe. Sickingen muss abziehen.' },
      { title: 'Im Frühjahr 1523', sub: 'Nun schlagen die Fürsten zurück. Mit Kartaunen, schweren Geschützen, ziehen sie gegen Sickingen und seine Freunde.' },
      { say: 'sickingen', text: 'Sie kommen. Hessen, Pfalz und Trier, mit mehr Landsknechten, als ich Reiter habe. Haltet sie vom Lager fern, Ritter!' }
    ] },
  { type: 'kill', if: isF('k3', 'sick'), at: [2985, 1330], place: 'Angriff der Fürsten', t: 'Haltet die Landsknechte der Fürsten vom Lager fern', cap: 5,
    cast: [{ id: 'sickingen', at: [2945, 1195] }, { id: 'goetz', at: [2988, 1200] }],
    mobs: [{ k: 'pluend', n: 5, nm: 'Landsknecht der Fürsten', tint: 'fuersten' }, { k: 'armbrust', n: 3, nm: 'Armbruster der Fürsten', tint: 'fuersten' }],
    boss: { k: 'raubritter', nm: 'Feldhauptmann der Fürsten', hpf: .4, lv: 1, tint: 'fuersten', sub: 'führt die Landsknechte der Fürsten', cry: 'Für Hessen und die Pfalz! Ergebt euch, Rebellen!' },
    after: [
      { put: 'fh', as: 'fuerst', at: [2985, 1330], dir: 'up' }, { pan: [2985, 1318] },
      { say: 'fuerst', text: 'Genug … ich ergebe mich. Ihr kämpft gut, Ritter. Aber Ihr wisst so gut wie ich: Draußen warten zehnmal so viele.' },
      { hold: true }
    ] },
  { type: 'choice', if: isF('k3', 'sick'), auto: true, who: 'fuerst', t: 'Entscheidet über den Gefangenen (E)',
    q: 'Der Feldhauptmann der Fürsten kniet vor Euch. Sickingens Leute rufen: „Hängt ihn!“ Ein Gefangener seines Ranges brächte auch ein schönes Lösegeld.',
    opts: [
      { t: 'Ihn laufen lassen: Ritterlich ist, wer Gnade zeigt', f: { k3g: 'gnade' }, gn: 1, log: 'Frühjahr 1523: Ihr habt den gefangenen Feldhauptmann der Fürsten freigelassen.',
        scene: [{ say: 'fuerst', text: 'Das vergesse ich Euch nicht. Wenn der Tag kommt, an dem Ihr Gnade braucht, erinnert man sich an Euch.' }, { walk: 'fh', to: [2985, 1520], spd: 60, wait: true }] },
      { t: 'Ihn gegen Lösegeld festsetzen', f: { k3g: 'geld' }, log: 'Frühjahr 1523: Ihr habt den Feldhauptmann gegen Lösegeld festgesetzt.',
        scene: [{ say: 'goetz', nm: 'Götz von Berlichingen', text: 'Recht so! Ein Feldhauptmann bringt gut und gern hundert Gulden, davon kauft man Pulver. Hier ist Euer Anteil.', fn: () => { HERO.gold += 100; updateHud(); Sound.coin(); } }] }
    ] },
  { type: 'scene', if: isF('k3', 'sick'), t: 'Burg Nanstein',
    scene: [
      { title: 'Burg Nanstein, am 7. Mai 1523', sub: 'Die Kartaunen der Fürsten schießen Sickingens Burg in Trümmer. Ein Balken, von einer Kugel getroffen, verwundet ihn tödlich.' },
      { put: 'sick', as: 'sickingen', at: [2962, 1200], dir: 'down' }, { dead: ['sick', true] }, { put: 'gz', as: 'goetz', at: [2998, 1196], dir: 'left' }, { hero: [2928, 1206], dir: 'right' }, { cam: [2962, 1200] },
      { say: 'sick', nm: 'Franz von Sickingen', text: 'Ritter … Ihr seid noch da. Die Zeit der Ritter ist vorbei. Die Kanonen der Fürsten haben sie erschossen.' },
      { say: 'sick', nm: 'Franz von Sickingen', text: 'Nehmt mein Schwert. Es soll keinem Fürsten über dem Kamin hängen.' },
      { say: 'gz', nm: 'Götz von Berlichingen', text: 'Franz ist tot. Hutten ist in die Schweiz geflohen, krank und arm, sagt man. Und ich … ich reite heim auf meine Burg und halte still.' },
      { title: 'Das Ende der Reichsritter', sub: 'Mit Sickingen fällt die Macht der freien Ritter. Hutten stirbt im Sommer 1523 auf der Insel Ufenau im Zürichsee. Die Fürsten aber sind mächtiger als je zuvor.' }
    ] },
  // mit den Fürsten
  { type: 'talk', if: isF('k3', 'fuerst'), npc: 'vogt', opt: 'Hutten wirbt Ritter für Sickingen', t: 'Macht dem Vogt Meldung',
    scene: [
      { say: 'vogt', text: 'Hutten war hier? Gut, dass Ihr es mir meldet. Sickingen bricht den ewigen Landfrieden, den Kaiser Maximilian verkündet hat.' },
      { title: 'Trier, im September 1522', sub: 'Sickingen belagert Trier eine Woche lang. Doch die Stadt hält, und die Fürsten von Hessen und der Pfalz eilen dem Erzbischof zu Hilfe. Sickingen muss abziehen.' },
      { title: 'Im Frühjahr 1523', sub: 'Nun schlagen die Fürsten zurück. Mit Kartaunen, schweren Geschützen, ziehen sie gegen Sickingen und seine Freunde.' },
      { say: 'vogt', text: 'Die Fürsten verlangen unsere Hilfe. Sickingens Reiter halten das Landsknechtslager. Schlagt sie heraus, und ist Sickingen selbst dort: Bringt ihn lebend.' }
    ] },
  { type: 'kill', if: isF('k3', 'fuerst'), at: [2962, 1160], place: 'Sickingens Lager', t: 'Schlagt Sickingens Leute aus dem Landsknechtslager', cap: 5,
    mobs: [{ k: 'pluend', n: 5, nm: 'Sickingens Knecht', tint: 'gold' }, { k: 'armbrust', n: 3, nm: 'Sickingens Schütze', tint: 'gold' }],
    boss: { k: 'raubritter', nm: 'Franz von Sickingen', hpf: .4, lv: 2, tint: 'gold', sub: 'der letzte Ritter', cry: 'Ich bin Franz von Sickingen! Mich nimmt kein Fürstenknecht!' },
    after: [
      { put: 'sick', as: 'sickingen', at: [2962, 1165], dir: 'down' }, { dead: ['sick', true] }, { pan: [2962, 1165] },
      { say: 'sick', nm: 'Franz von Sickingen', text: 'Ihr … habt gut gefochten. Für die falsche Seite, aber gut.' },
      { say: 'sick', nm: 'Franz von Sickingen', text: 'Die Zeit der Ritter ist vorbei. Morgen gehört die Welt den Fürsten und ihren Kanonen. Gebt acht auf meine Knechte. Sie haben nur getan, was ich befahl.' },
      { hold: true }
    ] },
  { type: 'choice', if: isF('k3', 'fuerst'), auto: true, who: 'sickingen', t: 'Entscheidet über Sickingens Knechte (E)',
    q: 'Sickingen ist tödlich verwundet. Seine Knechte haben die Waffen gestreckt. Die Fürsten wollen sie hängen sehen, zur Warnung für alle Ritter.',
    opts: [
      { t: 'Seine Knechte heimlich ziehen lassen', f: { k3g: 'gnade' }, gn: 1, log: 'Frühjahr 1523: Ihr habt Sickingens Knechte vor dem Strick bewahrt.',
        scene: [{ say: 'me', text: 'Geht. Schnell, bevor die Fürsten kommen. Und tragt nie wieder Waffen gegen das Reich.' }, { say: 'sick', nm: 'Franz von Sickingen', text: 'Habt Dank … Ihr seid doch ein Ritter.' }] },
      { t: 'Sie den Fürsten übergeben', f: { k3g: 'recht' }, log: 'Frühjahr 1523: Ihr habt Sickingens Knechte den Fürsten ausgeliefert.',
        scene: [{ say: 'me', text: 'Das Recht muss seinen Lauf nehmen. Wer den Landfrieden bricht, steht vor Gericht.' }, { say: 'sick', nm: 'Franz von Sickingen', text: 'So sei es. Ihr dient Euren Herren gut.' }] }
    ] },
  { type: 'scene', if: isF('k3', 'fuerst'), t: 'Burg Nanstein',
    scene: [
      { title: 'Burg Nanstein, am 7. Mai 1523', sub: 'Franz von Sickingen stirbt an seinen Wunden, kurz nachdem er sich den Fürsten ergeben hat. Hutten flieht in die Schweiz und stirbt im Sommer auf der Insel Ufenau.' },
      { title: 'Das Ende der Reichsritter', sub: 'Die Fürsten haben gesiegt. Die freien Ritter verlieren ihre Burgen, ihre Fehden und ihre Macht.' }
    ] }
  ] },
/* ===== Kapitel 4 ===== */
{ n: 4, t: 'Der Bundschuh', year: '1524', lvl: 11,
  d: 'In Lindach murren die Bauern: Zehnt, Fron und der Wildbann drücken sie. Im Süden haben sich schon die ersten Dörfer erhoben.',
  reward: f => f.k4 === 'rede' ? { s: 'kleinod', n: 'Die zwölf Artikel', aff: ['hp', 'crit', 'spd'], r: 4 } : f.k4 === 'schwert' ? { s: 'ruestung', n: 'Harnisch des Junkers', aff: ['arm', 'hp', 'str'], r: 4 } : { s: 'beine', n: 'Bundschuhe', aff: ['spd', 'hp', 'crit'], r: 4 },
  steps: [
  { type: 'talk', npc: 'vogt', opt: 'Ihr habt mich rufen lassen?', t: 'Sprecht mit dem Vogt in der Reichsburg',
    scene: [
      { title: 'Kapitel 4: Der Bundschuh', sub: 'Reichsland, im Herbst des Jahres 1524' },
      { say: 'vogt', text: 'In Lindach gärt es. Der junge Junker Konrad hat Schulden bei den Fuggern in Augsburg. Also nimmt er den Bauern mehr: den großen Zehnt, den kleinen Zehnt, Frondienst an sechs Tagen.' },
      { say: 'vogt', text: 'Bei Stühlingen im Schwarzwald haben sich die Bauern schon erhoben. Sie tragen den Bundschuh auf ihren Fahnen. Reitet nach Lindach und seht, wie es dort steht.' }
    ] },
  { type: 'goto', at: [2470, 600], r: 80, place: 'Die Linde in Lindach', t: 'Reitet nach Lindach zur Dorflinde',
    scene: [
      { put: 'jaeck', as: 'jaecklein', at: [2440, 600], dir: 'right' }, { put: 'hip', as: 'hipler', at: [2502, 612], dir: 'left' }, { put: 'b1', as: 'bauer1', at: [2466, 632], dir: 'up' }, { put: 'b2', as: 'bauer2', at: [2420, 626], dir: 'right' }, { put: 'b3', as: 'bauer3', at: [2522, 640], dir: 'up' },
      { pan: [2470, 612] },
      { say: 'jaeck', text: 'Der Junker frisst uns die Haare vom Kopf! Und seine Säue und Hirsche fressen uns die Saat vom Feld, und wehe, einer von uns schießt einen Hasen!' },
      { say: 'hip', text: 'Ruhig, Jäcklein. Mit Geschrei richtet man nichts aus. Mit Recht schon eher.' },
      { say: 'hip', text: 'Herr Ritter, ich bin Wendel Hipler. Ich war Kanzler bei den Grafen von Hohenlohe. Ich kenne das Recht der Herren, und ich weiß, wo es Unrecht ist.' },
      { put: 'kon', as: 'konrad', at: [2640, 640], dir: 'left' }, { put: 'kn1', as: 'knecht', at: [2672, 630], dir: 'left' }, { put: 'kn2', as: 'knecht', at: [2672, 660], dir: 'left' },
      { walk: 'kon', to: [2560, 620] }, { walk: 'kn1', to: [2592, 610] }, { walk: 'kn2', to: [2592, 646], wait: true },
      { say: 'kon', text: 'Was ist das für eine Versammlung? Der Zehnt ist fällig, und morgen ist Frondienst auf meinen Äckern. Wer nicht kommt, zahlt Strafe.' },
      { say: 'jaeck', text: 'Und wer zahlt uns den Schaden, den Euer Wild auf unseren Feldern anrichtet?' },
      { say: 'kon', text: 'Das Wild gehört dem Herrn. So war es immer, und so bleibt es.' },
      { walk: 'kon', to: [2720, 640] }, { walk: 'kn1', to: [2740, 630] }, { walk: 'kn2', to: [2740, 660], wait: true },
      { say: 'hip', text: 'Herr Ritter, Ihr seid weder Bauer noch Junker. Helft uns: Die Wildschweine aus dem Finsterwald verwüsten die Rübenäcker. Erlegt sie ein Ritter, ist es kein Wildern.' }
    ] },
  { type: 'hunt', kind: 'wildschwein', n: 3, unit: 'Wildschweine', at: [1150, 760], place: 'Finsterwald (Wildschweine)', t: 'Erlegt drei Wildschweine im Finsterwald', d: 'Wildschweine leben im Finsterwald und wehren sich.',
    after: [{ say: 'me', text: 'Drei Keiler weniger. Die Rübenäcker in Lindach werden es danken. Zurück zu Hipler.' }] },
  { type: 'talk', npc: 'hipler', opt: 'Die Keiler sind erlegt', t: 'Sprecht mit Wendel Hipler in Lindach',
    cast: [{ id: 'hipler', at: [2496, 612], talk: true, greet: 'Ah, der Ritter! Habt Ihr die Keiler erwischt?' }],
    scene: [
      { say: 'hipler', text: 'Gott vergelt’s! Und nun etwas Wichtigeres. Aus Memmingen kommt dies hier: zwölf Artikel, aufgeschrieben von den Bauern in Oberschwaben.' },
      { say: 'hipler', text: 'Freie Wahl des Pfarrers. Kein kleiner Zehnt. Keine Leibeigenschaft, denn Christus hat uns alle erlöst. Freie Jagd und freier Fischfang, Holz aus dem Wald, gemessene Fron, alte Strafen statt neuer Willkür.' },
      { say: 'hipler', text: 'Das ist kein Aufruhr, das ist eine Bitte mit Gründen aus der Schrift. Bringt den Text zum Drucker in der Reichsstadt. Hundert Abzüge, für jedes Dorf einen.' }
    ] },
  { type: 'talk', npc: 'melchior', opt: 'Hipler schickt mich mit einem Text', t: 'Bringt die zwölf Artikel zum Drucker Melchior in der Reichsstadt',
    cast: [{ id: 'melchior', at: [2954, 2300], talk: true, role: 'Drucker', greet: 'Bücher, Flugschriften, Ablassbriefe … Was darf es sein?' }],
    scene: [
      { if: isF('k1', 'weigern'), say: 'melchior', text: 'Der Ritter vom Markt! Für Euch tue ich alles. Zeigt her … die zwölf Artikel. Die gehen weg wie warme Semmeln.' },
      { if: isF('k1', 'brand'), say: 'melchior', text: 'Ihr? Ihr habt meine Bücher angezündet. … Gut, für die Bauern drucke ich es trotzdem. Nicht für Euch.' },
      { sound: 'anvil' }, { wait: .5 }, { sound: 'anvil' }, { wait: .5 },
      { say: 'melchior', text: 'Die Presse knarrt, die Druckerschwärze stinkt, und morgen liest das halbe Reichsland, was die Bauern wollen. Bringt einen Abzug zu Junker Konrad. Er soll ihn als Erster lesen.' }
    ] },
  { type: 'talk', npc: 'konrad', opt: 'Ich bringe Euch die Artikel der Bauern', t: 'Bringt die Artikel zu Junker Konrad in Lindach',
    cast: [{ id: 'konrad', at: [2330, 482], talk: true, role: 'Herr von Lindach', greet: 'Ihr seid der Ritter, der für die Bauern Keiler jagt? Was wollt Ihr?' }],
    scene: [
      { say: 'konrad', text: 'Zwölf Artikel … „dass wir frei sind und sein wollen“. Keine Leibeigenschaft! Und wer bestellt dann meine Felder?' },
      { say: 'me', text: 'Dieselben Leute, Junker. Nur gegen Lohn und nach Recht.' },
      { say: 'konrad', text: 'Ihr redet wie ein Prediger aus Wittenberg. … Ich will darüber nachdenken. Aber den Zehnt zahlen sie, dieses Jahr noch.' },
      { title: 'In derselben Nacht', sub: 'Über Lindach liegt Nebel. In der Zehntscheune des Junkers lagert das Korn des ganzen Dorfes.' }
    ] },
  { type: 'goto', at: [2545, 488], r: 70, place: 'Die Zehntscheune', t: 'Seht nach der Zehntscheune in Lindach',
    scene: [
      { night: .55 },
      { put: 'jaeck', as: 'jaecklein', at: [2500, 524], dir: 'up', o: { torch: true } }, { put: 'b1', as: 'bauer3', at: [2532, 532], dir: 'up', o: { torch: true } }, { put: 'b2', as: 'bauer1', at: [2470, 536], dir: 'up', o: { torch: true } },
      { pan: [2512, 512] },
      { say: 'jaeck', text: 'Der Ritter! Bleibt, wo Ihr seid. Das Korn in der Scheune ist unser Korn. Heute Nacht holen wir es uns, und die Scheune geht in Flammen auf.' },
      { say: 'jaeck', text: 'Soll der Junker sehen, wie es ist, wenn man alles verliert!' },
      { hold: true }
    ] },
  { type: 'choice', auto: true, who: 'jaecklein', t: 'Entscheidet Euch an der Zehntscheune (E)',
    q: 'Jäcklein und seine Leute stehen mit Fackeln vor der Zehntscheune. Im Dorf schläft alles.',
    opts: [
      { t: 'Mit Jäcklein reden und ihn umstimmen', f: { k4: 'rede' }, gn: 1, log: '1524: Ihr habt Jäcklein Rohrbach ausgeredet, die Zehntscheune anzuzünden.',
        scene: [
          { say: 'me', text: 'Brennt die Scheune, hungert im Winter ganz Lindach, nicht der Junker. Und morgen hängen sie euch für Brandstiftung, und zwar mit Recht.' },
          { say: 'me', text: 'Hipler hat einen besseren Weg. Die Artikel sind gedruckt, das ganze Land liest sie. Wartet ab.' },
          { say: 'jaeck', text: '… Verflucht. Ihr habt recht, das Korn brauchen wir selbst. Aber merkt Euch: Wenn die Herren nicht hören wollen, kommt der Bundschuh. Im Frühjahr.' },
          { torch: ['jaeck', false] }, { torch: ['b1', false] }, { torch: ['b2', false] },
          { walk: 'jaeck', to: [2400, 640] }, { walk: 'b1', to: [2420, 660] }, { walk: 'b2', to: [2380, 660], wait: true }
        ] },
      { t: 'Das Schwert ziehen und die Scheune schützen', f: { k4: 'schwert' }, log: '1524: Ihr habt die Zehntscheune mit dem Schwert gegen Jäckleins Leute verteidigt.',
        scene: [{ say: 'me', text: 'Brandstiftung ist ein Verbrechen. Geht heim, oder ich treibe euch heim!' }, { say: 'jaeck', text: 'Ein Herrenknecht also! Leute, schlagt ihn nieder!' }] },
      { t: 'Zur Seite treten und sie gewähren lassen', f: { k4: 'brand' }, log: '1524: Ihr habt zugesehen, wie die Zehntscheune des Junkers brannte.',
        scene: [
          { say: 'me', text: 'Es ist nicht meine Scheune. Und nicht mein Korn.' },
          { walk: 'jaeck', to: [2540, 500], wait: true },
          { fx: 'fire', at: [2548, 470], big: 2, sound: 'fire' }, { shake: .3 },
          { say: 'jaeck', text: 'Seht, wie sie brennt! Das ist für jeden Sack Zehnt, den wir geschleppt haben!' },
          { say: 'jaeck', text: 'Ihr seid ein Freund, Ritter. Das vergessen wir nicht, wenn der Bundschuh kommt.' }
        ] }
    ] },
  { type: 'kill', if: isF('k4', 'schwert'), at: [2512, 520], unsafe: 'weiler', place: 'Die Zehntscheune', t: 'Vertreibt Jäckleins Leute von der Scheune',
    mobs: [{ k: 'pluend', n: 4, nm: 'Jäckleins Mann', tint: 'bauer', lv: -1 }],
    after: [{ say: null, nm: 'Jäcklein, aus der Dunkelheit', text: 'Das büßt Ihr, Ritter! Wenn der Bundschuh kommt, steht Ihr auf der falschen Seite!' }] },
  { type: 'scene', t: 'Winter',
    scene: [{ title: 'Winter 1524 auf 1525', sub: 'In Oberschwaben, in Franken, im Elsass und in Thüringen rotten sich die Bauern zu Haufen zusammen. Die zwölf Artikel werden mehr als zwanzigmal nachgedruckt.' }] }
  ] },
/* ===== Kapitel 5 ===== */
{ n: 5, t: 'Der Bauernkrieg', year: 'Frühjahr 1525', lvl: 14,
  d: 'Überall im Süden des Reiches stehen die Haufen der Bauern. Der Schwäbische Bund schickt seine Landsknechte unter Georg Truchsess von Waldburg, den man bald den Bauernjörg nennt.',
  reward: f => f.k5 === 'bauern' ? { s: 'kleinod', n: 'Die Bundschuhfahne', aff: ['str', 'hp', 'crit'], r: 4, title: ST_TITLES.bauern, tid: 'bauern' }
    : f.k5 === 'herren' ? { s: 'waffe', n: 'Bannerschwert des Schwäbischen Bundes', aff: ['str', 'crit', 'spd'], r: 4, title: ST_TITLES.herren, tid: 'herren' }
    : { s: 'kleinod', n: 'Friedensbrief von Lindach', aff: ['hp', 'arm', 'crit'], r: 4, title: ST_TITLES.frieden, tid: 'frieden' },
  steps: [
  { type: 'goto', at: [2470, 600], r: 90, place: 'Lindach', t: 'Reitet nach Lindach', d: 'Der Bundschuh weht über Lindach.',
    scene: [
      { title: 'Kapitel 5: Der Bauernkrieg', sub: 'Reichsland, im April des Jahres 1525' },
      { put: 'gz', as: 'goetz', at: [2470, 580], dir: 'down' }, { put: 'hip', as: 'hipler', at: [2420, 600], dir: 'right' }, { put: 'jaeck', as: 'jaecklein', at: [2526, 606], dir: 'left' },
      { put: 'b1', as: 'bauer1', at: [2440, 652], dir: 'up' }, { put: 'b2', as: 'bauer3', at: [2480, 662], dir: 'up' }, { put: 'b3', as: 'bauer2', at: [2516, 652], dir: 'up' }, { put: 'b4', as: 'landsknecht', at: [2400, 642], dir: 'up' },
      { pan: [2470, 616] },
      { say: 'gz', text: 'Ihr! Gut, dass ein vernünftiger Mensch kommt. Die Bauern haben mich zu ihrem Hauptmann gemacht. Gefragt haben sie mich nicht: Hauptmann oder tot, das war die Wahl.' },
      { if: isF('k3', 'sick'), say: 'gz', text: 'Seit Franz von Sickingen tot ist, bin ich ein Ritter ohne Fehde. Jetzt führe ich Bauern. Die Welt steht kopf.' },
      { say: 'jaeck', text: 'In Weinsberg haben wir den Grafen von Helfenstein durch die Spieße gejagt, am Ostersonntag! So geht es allen, die uns geschunden haben.' },
      { if: isF('k4', 'brand'), say: 'jaeck', text: 'Und Ihr, Ritter, Ihr habt bei der Scheune zugesehen. Ihr seid einer von uns.' },
      { if: isF('k4', 'schwert'), say: 'jaeck', text: 'Und der da hat bei der Scheune auf uns eingeschlagen. Was will der Herrenknecht hier?' },
      { if: isF('k4', 'rede'), say: 'jaeck', text: 'Ihr habt mich damals von der Scheune weggeredet. Vielleicht hattet Ihr recht. Vielleicht auch nicht.' },
      { say: 'hip', text: 'Weinsberg war ein Verbrechen, Jäcklein, und es wird uns alle teuer zu stehen kommen. Der Truchsess von Waldburg zieht mit dem Heer des Schwäbischen Bundes heran.' },
      { say: 'hip', text: 'Bei Weingarten aber hat er mit den Bauern vom Bodensee einen Vertrag geschlossen, ganz ohne Schlacht. Wenn es dort ging, geht es auch hier.' },
      { say: 'gz', text: 'Ritter, Ihr kennt beide Seiten. Wo steht Ihr?' },
      { hold: true }
    ] },
  { type: 'choice', auto: true, who: 'goetz', t: 'Entscheidet Euch in Lindach (E)',
    q: 'Götz, Hipler und Jäcklein sehen Euch an. Vor dem Dorf sammelt sich der Haufen, und von Westen naht das Heer des Bundes.',
    opts: [
      { t: 'Zu den Bauern stehen und Lindach verteidigen', f: { k5: 'bauern' }, log: 'April 1525: Ihr habt Lindach gegen das Heer des Schwäbischen Bundes verteidigt.',
        scene: [{ say: 'gz', text: 'Dann haltet das Dorf. Der Bund kommt über den Burgweg, gleich sind sie da.' }, { say: 'jaeck', text: 'Endlich ein Ritter auf der richtigen Seite!' }] },
      { t: 'Zum Truchsess reiten und dem Bund dienen', f: { k5: 'herren' }, log: 'April 1525: Ihr seid mit dem Heer des Schwäbischen Bundes gegen die Bauern geritten.',
        scene: [{ say: 'jaeck', text: 'Verräter! Lauft nur zu Euren Herren!' }, { say: 'gz', text: 'Geht. Vielleicht ist es besser, wenn einer von uns auf der anderen Seite steht. Der Truchsess lagert an der Kreuzung in den Obstgärten.' }] },
      { t: 'Zwischen beiden vermitteln, wie in Weingarten', f: { k5: 'frieden' }, need: (f, S) => S.gn >= 2, log: 'April 1525: Ihr habt zwischen den Bauern und dem Bund vermittelt.',
        no: 'Dafür müssten Euch beide Seiten vertrauen. Wer früher Gnade gezeigt und auf sein Gewissen gehört hat (mindestens zweimal), dem hört man jetzt zu.',
        scene: [{ say: 'hip', text: 'Ich wusste es! Kommt, wir bringen dem Truchsess die zwölf Artikel und ein Angebot. Ihr schützt mich unterwegs.' }, { say: 'jaeck', text: 'Verhandeln! Mit dem Bauernjörg! Ihr werdet schon sehen, was davon kommt.' }, { say: 'gz', text: 'Versucht es. Ich halte den Haufen ruhig, so lange ich kann.' }] }
    ] },
  // bei den Bauern
  { type: 'kill', if: isF('k5', 'bauern'), at: [2462, 640], unsafe: 'weiler', place: 'Lindach', t: 'Verteidigt Lindach gegen das Heer des Bundes', cap: 5,
    mobs: [{ k: 'pluend', n: 6, nm: 'Landsknecht des Bundes', tint: 'bund' }, { k: 'armbrust', n: 4, nm: 'Hakenschütze des Bundes', tint: 'bund' }],
    boss: { k: 'raubritter', nm: 'Georg Truchsess von Waldburg', hpf: .45, lv: 2, tint: 'bund', sub: 'Feldherr des Schwäbischen Bundes', cry: 'Ergebt euch, oder ich brenne das Dorf nieder!' },
    after: [
      { put: 'tr', as: 'truchsess', at: [2462, 640], dir: 'up' }, { pan: [2462, 630] },
      { say: 'tr', nm: 'Georg Truchsess von Waldburg', text: 'Genug! Zurück, Männer! … Dieses Dorf ist es nicht wert. Aber merkt Euch, Ritter: Für jeden Bauern, der hier lebt, sterben anderswo hundert.' },
      { walk: 'tr', to: [2200, 790], spd: 70 },
      { title: 'Im Mai 1525', sub: 'Der Truchsess schlägt die Bauern bei Böblingen, bei Königshofen und vor Würzburg. Bei Frankenhausen fällt Thomas Müntzer. Mehr als siebzigtausend Bauern sterben.' },
      { title: 'Lindach', sub: 'Doch Lindach steht. Junker Konrad, eingeschüchtert, erlaubt dem Dorf die Jagd auf den eigenen Feldern und erlässt den kleinen Zehnt. Die Bauern nennen Euch den Bauernritter.' }
    ] },
  // beim Bund
  { type: 'goto', if: isF('k5', 'herren'), at: [1900, 1322], r: 70, place: 'Lager des Truchsess', t: 'Meldet Euch beim Truchsess an der Kreuzung in den Obstgärten',
    cast: [{ id: 'truchsess', at: [1922, 1300] }, { id: 'landsknecht', at: [1878, 1292] }],
    scene: [
      { pan: [1904, 1306] },
      { say: 'truchsess', text: 'Ein Ritter, der den Weg zu uns findet. Gut. Georg Truchsess von Waldburg, Feldherr des Schwäbischen Bundes.' },
      { say: 'truchsess', text: 'Die Bauern nennen mich den Bauernjörg. Sollen sie. Ordnung hat Gott der Welt gegeben, und wer sie umstürzt, den trifft das Schwert.' },
      { say: 'truchsess', text: 'Beim Landsknechtslager sammelt sich ein Haufen, angeführt von dem Mörder von Weinsberg. Zerschlagt ihn.' }
    ] },
  { type: 'kill', if: isF('k5', 'herren'), at: [2985, 1300], place: 'Der Haufen', t: 'Zerschlagt den Haufen beim Landsknechtslager', cap: 5,
    mobs: [{ k: 'pluend', n: 8, nm: 'Aufständischer Bauer', tint: 'bauer', lv: -1 }],
    boss: { k: 'pluend', nm: 'Jäcklein Rohrbach', hpf: 7, lv: 2, tint: 'bauer', sub: 'der Hauptmann von Weinsberg', cry: 'Für Weinsberg und den Bundschuh!' },
    after: [
      { put: 'gz', as: 'goetz', at: [3012, 1290], dir: 'left' }, { pan: [2990, 1300] },
      { say: 'gz', text: 'Es ist vorbei. Ich lege mein Amt nieder, Ritter. Ich war nie gern Hauptmann von Bauern.' },
      { say: 'gz', text: 'Sagt dem Truchsess, Götz von Berlichingen ergibt sich. Man wird mir den Prozess machen. Aber hängen wird man mich nicht. Mich nicht.' },
      { title: 'Im Mai 1525', sub: 'Jäcklein Rohrbach wird gefangen und bei Neckargartach verbrannt. Der Truchsess schlägt die Bauern bei Böblingen, bei Königshofen und vor Würzburg. Mehr als siebzigtausend Bauern sterben.' },
      { title: 'Lindach', sub: 'Lindach wird zur Strafe gebrandschatzt, und Junker Konrad verlangt den doppelten Zehnt. Der Bund ehrt Euch als Bannerherrn. Ihr habt gesiegt, doch froh werdet Ihr darüber nicht.' }
    ] },
  // als Vermittler
  { type: 'escort', if: isF('k5', 'frieden'), who: ['hipler'], lead: 'Wendel Hipler', path: ST_HIPLERWEG, spd: 36, t: 'Bringt Wendel Hipler sicher zum Truchsess', d: 'Der Truchsess lagert an der Kreuzung in den Obstgärten.',
    wait: 'Herr Ritter, allein komme ich nicht weit!', cleared: 'Der Weg ist frei. Hipler wischt sich den Schweiß von der Stirn.',
    amb: [
      { at: .35, nm: 'Jäckleins Leute', sub: 'Sie wollen keinen Frieden', cry: '„Kein Vertrag mit dem Bauernjörg! Schlagt den Schreiber tot!“', mobs: [{ k: 'pluend', n: 4, nm: 'Jäckleins Mann', tint: 'bauer', lv: -1 }] },
      { at: .78, nm: 'Plündernde Landsknechte', sub: 'Sie wollen Beute, keinen Frieden', mobs: [{ k: 'pluend', n: 2, nm: 'Landsknecht des Bundes', tint: 'bund' }, { k: 'armbrust', n: 2, nm: 'Hakenschütze des Bundes', tint: 'bund' }] }
    ],
    after: [
      { put: 'tr', as: 'truchsess', at: [1924, 1300], dir: 'down' }, { put: 'lk', as: 'landsknecht', at: [1878, 1292], dir: 'down' }, { pan: [1904, 1302] },
      { say: 'esc0', nm: 'Wendel Hipler', text: 'Herr Truchsess, ich bin Wendel Hipler und spreche für den Haufen von Lindach. Wir bringen die zwölf Artikel und ein Angebot.' },
      { say: 'tr', nm: 'Georg Truchsess von Waldburg', text: 'Ein Schreiber und ein Ritter. Was wollt ihr? Eure Bauern haben in Weinsberg Edelleute ermordet.' },
      { say: 'me', text: 'Nicht diese Bauern. In Lindach ist niemand getötet worden. Bei Weingarten habt Ihr einen Vertrag geschlossen. Schließt hier noch einen.' },
      { if: isF('k3g', 'gnade'), say: 'tr', nm: 'Georg Truchsess von Waldburg', text: 'Man erzählt sich, Ihr hättet im Krieg um Sickingen Gnade geübt, wo andere gehängt hätten. Das spricht für Euch.' },
      { say: 'tr', nm: 'Georg Truchsess von Waldburg', text: '… Also gut. Die Bauern von Lindach legen die Waffen nieder und gehen heim. Der Bund zieht ab. Über die Artikel richten Schiedsleute, je zwei von jeder Seite.' },
      { say: 'esc0', nm: 'Wendel Hipler', text: 'Mehr kann man in diesen Zeiten nicht verlangen. Ich bringe die Nachricht ins Dorf.' },
      { say: 'tr', nm: 'Georg Truchsess von Waldburg', text: 'Eines noch. Der Mörder von Weinsberg, Jäcklein Rohrbach, steht nicht unter diesem Frieden. Und wie ich höre, ist er mit seinen Leuten schon unterwegs hierher.' }
    ] },
  { type: 'kill', if: isF('k5', 'frieden'), at: [1900, 1340], place: 'Lager des Truchsess', t: 'Haltet Jäcklein auf, ehe er den Frieden zerschlägt',
    cast: [{ id: 'truchsess', at: [1924, 1300] }, { id: 'hipler', at: [1886, 1304] }],
    mobs: [{ k: 'pluend', n: 4, nm: 'Jäckleins Mann', tint: 'bauer', lv: -1 }],
    boss: { k: 'pluend', nm: 'Jäcklein Rohrbach', hpf: 7, lv: 2, tint: 'bauer', sub: 'will keinen Frieden', cry: 'Kein Friede mit den Herren!' },
    after: [
      { put: 'jk', as: 'jaecklein', at: [1900, 1338], dir: 'up' }, { pan: [1900, 1322] },
      { say: 'jk', nm: 'Jäcklein Rohrbach', text: 'Ihr … verfluchter Friedensmacher. Ihr wisst nicht, was die Herren mit uns machen, wenn wir die Waffen strecken.' },
      { say: 'me', text: 'Vielleicht. Aber Lindach lebt, und morgen gehen die Bauern heim zu ihren Familien.' },
      { title: 'Im Mai 1525', sub: 'Anderswo schlägt der Truchsess die Haufen bei Böblingen, bei Königshofen und vor Würzburg. Mehr als siebzigtausend Bauern sterben. Der Vertrag von Weingarten aber hält, und auch der von Lindach.' },
      { title: 'Lindach', sub: 'Die Schiedsleute erlassen den kleinen Zehnt und begrenzen die Fron. Junker Konrad murrt, aber er hält sich daran. Im Reichsland nennt man Euch den Friedensstifter.' }
    ] }
  ] }
];
/* ---------- Kapitel 6 bis 8: Speyer 1526–1529 ----------
   Historisch: erster Reichstag zu Speyer unter Erzherzog Ferdinand (Juni bis August 1526), die evangelischen Fürsten mit
   „V.D.M.I.Æ." auf dem Ärmel, der Abschied vom 27. August („wie es ein jeder vor Gott und Kaiserlicher Majestät zu verantworten
   hofft"), die Schlacht bei Mohács (29. August 1526); der Sacco di Roma (6. Mai 1527) und die heimkehrenden Landsknechte;
   der zweite Reichstag zu Speyer und die Protestation vom 19. April 1529, die Belagerung Wiens (Herbst 1529).
   Eitel Schott von Hohenrhein, der Domherr Lambert und die Winzer sind erfunden. */
Object.assign(ST_CAST, {
  domherr:   { nm: 'Domherr Lambert', o: { robe: 'long', hat: 'barett', fur: true, hair: ['w', 'x'] }, pal: 'rot', R: '#b8281e' },
  winzer:    { nm: 'Winzer Veit', o: { robe: 'short', hat: 'filz', beard: true, belt: true, hair: ['h', 'j'] }, pal: 'bauer' },
  winzerin:  { nm: 'Winzerin Gret', p: ['baeuerin', 1] },
  ferdinand: { nm: 'Erzherzog Ferdinand', kn: ['spanien', '44444'], crown: true },
  johann:    { nm: 'Kurfürst Johann von Sachsen', kn: ['reich', '44443'] },
  philipp:   { nm: 'Landgraf Philipp von Hessen', kn: ['england', '33343'] },
  jsturm:    { nm: 'Jakob Sturm von Straßburg', o: { robe: 'long', hat: 'barett', fur: true, beard: true, hair: ['h', 'j'] }, pal: 'gelehrt' },
  schott:    { nm: 'Eitel Schott von Hohenrhein', kn: ['reich', '22232'] },
  pirat:     { nm: 'Flusspirat', p: ['wache', 2] }
});
for (const id of ['domherr', 'winzer', 'winzerin', 'ferdinand', 'johann', 'philipp', 'jsturm', 'schott', 'pirat']) ST_CAST[id].id = id;
Object.assign(ST_TITLES, { prot: 'Ritter der Protestation', erzh: 'Bannerherr des Erzherzogs', rfrieden: 'Hüter des Reichsfriedens' });
ST_CH.push(
/* ===== Kapitel 6 ===== */
{ n: 6, t: 'Der Reichstag zu Speyer', year: 'Sommer 1526', lvl: 16,
  d: 'In Speyer tagen die Stände des Reiches unter Erzherzog Ferdinand, dem Bruder des Kaisers. Die Stadt ist voller Gesandter, und auf dem Strom treiben die Piraten des Hinrich Rotbart ihr Unwesen.',
  reward: f => f.k6 === 'evang' ? { s: 'kleinod', n: 'Ärmelband „Verbum Domini“', aff: ['hp', 'crit', 'spd'], r: 4 }
    : f.k6 === 'alt' ? { s: 'waffe', n: 'Schwert aus der Rüstkammer Ferdinands', aff: ['str', 'crit', 'spd'], r: 4 }
    : { s: 'kleinod', n: 'Siegel des Abschieds von Speyer', aff: ['hp', 'arm', 'crit'], r: 4 },
  steps: [
  { type: 'goto', at: [4960, 1400], r: 80, place: 'Markt zu Speyer', t: 'Reitet nach Speyer auf den Markt', d: 'Der Reichsherold Kaspar Sturm erwartet Euch auf dem Markt der Reichsstadt Speyer, am Strom im Osten.',
    cast: [{ id: 'kaspar', at: [4986, 1392] }, { id: 'domherr', at: [4950, 1396], dir: 'right' }],
    scene: [
      { title: 'Kapitel 6: Der Reichstag zu Speyer', sub: 'Speyer, im Juni des Jahres 1526' },
      { pan: [4968, 1394] },
      { say: 'kaspar', text: 'Da seid Ihr ja! Fünf Jahre ist es her, dass wir den Doktor Luther nach Worms geleitet haben. Jetzt tagt der Reichstag in Speyer.' },
      { say: 'kaspar', text: 'Der Kaiser kämpft in Italien gegen den König von Frankreich, also führt sein Bruder Ferdinand den Vorsitz. Und der Kurfürst von Sachsen und der Landgraf von Hessen sind mit großem Gefolge gekommen.' },
      { say: 'kaspar', text: 'Ihre Leute tragen fünf Buchstaben auf dem Ärmel: V.D.M.I.Æ. Verbum Domini manet in aeternum, das Wort des Herrn bleibt in Ewigkeit. Ganz Speyer redet davon.' },
      { say: 'domherr', text: 'Und unterdessen plündern die Flusspiraten unsere Schiffe! Ich bin Lambert, Domherr am Kaiserdom. Die Kähne mit Korn und Wein für die Gesandten werden nachts im Hafen ausgeraubt.' },
      { say: 'domherr', text: 'Die Leute des Hinrich Rotbart kommen von ihrer Insel herüber, als gehöre ihnen der Strom. Wenn der Reichstag hungert, geht er auseinander, ehe etwas beschlossen ist.' },
      { say: 'me', text: 'Dann sollen sie heute Nacht einen Ritter im Hafen finden.' }
    ] },
  { type: 'kill', at: [5150, 1662], unsafe: 'speyer', place: 'Der Hafen', t: 'Vertreibt die Flusspiraten aus dem Hafen von Speyer', d: 'Am Kai vor dem Hafentor liegen die Kähne des Domkapitels.', cap: 6,
    mobs: [{ k: 'pirat', n: 5, nm: 'Flusspirat' }, { k: 'pschuetze', n: 3, nm: 'Piratenschütze' }],
    boss: { k: 'pirat', nm: 'Bootsmann Henne Schwarzhand', hpf: 6, lv: 1, tint: 'dunkel', sub: 'Rotbarts Bootsmann', cry: 'Der Strom gehört Rotbart, und was darauf schwimmt, auch!' },
    after: [
      { put: 'hm', as: 'domherr', at: [5100, 1630], dir: 'down' }, { pan: [5130, 1650] },
      { say: 'me', text: 'Der Bootsmann trug einen Brief bei sich. Gesiegelt, aber nicht mit Rotbarts Zeichen: ein Schott, ein Querbalken im Schild.' },
      { say: 'hm', nm: 'Domherr Lambert', text: 'Zeigt her … „Fünfzig Gulden für jeden Kahn, der die Gesandten der neuen Lehre nicht erreicht.“ Unterschrieben: E. S. v. H.' },
      { say: 'hm', nm: 'Domherr Lambert', text: 'Eitel Schott von Hohenrhein, ein verarmter Ritter aus den Bergen. Er bezahlt Piraten, damit der Reichstag scheitert. Ich bringe den Brief dem Erzherzog.' },
      { say: 'hm', nm: 'Domherr Lambert', text: 'Herr Ritter, der Herold sucht Euch im Ratshof. Heute wird dort über das Wormser Edikt gestritten.' }
    ] },
  { type: 'goto', at: [4846, 1508], r: 60, place: 'Ratshof', t: 'Geht zum Ratshof von Speyer', d: 'Der Ratshof steht in der südlichen Häuserzeile am Markt.',
    cast: [{ id: 'kaspar', at: [4870, 1514], dir: 'left' }],
    scene: [
      { say: 'kaspar', text: 'Kommt mit hinein, Ihr seid mein Zeuge. Und schweigt, es sei denn, man fragt Euch.' },
      { title: 'Speyer, im August 1526', sub: 'Im Ratshof ringen die Stände um das Wormser Edikt. Soll es überall gelten, oder darf jeder Fürst selbst entscheiden?' },
      { stage: 'speyer' },
      { put: 'ferdinand', at: [0, -14], dir: 'down' }, { put: 'johann', at: [-92, 40], dir: 'right' }, { put: 'philipp', at: [-64, 64], dir: 'right' }, { put: 'domherr', at: [86, 40], dir: 'left' }, { put: 'kaspar', at: [104, 76], dir: 'up' },
      { say: 'ferdinand', text: 'Seine Majestät der Kaiser verlangt, dass das Edikt von Worms befolgt wird. Wer Luthers Lehre duldet, stellt sich gegen Kaiser und Kirche.' },
      { say: 'philipp', text: 'Mit Verlaub, Euer Liebden: In meinem Land predigt man das Evangelium. Soll ich meine Prediger verjagen, weil ein Edikt es befiehlt, das kein Konzil bestätigt hat?' },
      { say: 'johann', text: 'Ein Konzil soll entscheiden, frei und christlich, in deutschen Landen. Bis dahin kann niemand über unser Gewissen gebieten.' },
      { say: 'domherr', text: 'Ein Konzil! Und bis es kommt, reißt jeder Fürst Klöster ein und nimmt die Kirchengüter. So zerfällt das Reich.' },
      { say: 'kaspar', text: '(leise) Ritter, man fragt nach Euch. Ihr habt die Piraten aus dem Hafen vertrieben, also hört man Euch zu. Was sagt Ihr?' },
      { hold: true }
    ] },
  { type: 'choice', auto: true, who: 'kaspar', t: 'Entscheidet Euch im Ratshof (E)',
    q: 'Die Stände sehen Euch an: der Erzherzog auf seinem Stuhl, die Fürsten von Sachsen und Hessen mit den fünf Buchstaben am Ärmel, der Domherr mit dem Brief des Eitel Schott.',
    opts: [
      { t: 'Für die evangelischen Stände sprechen', f: { k6: 'evang' }, log: 'Sommer 1526: Im Ratshof zu Speyer habt Ihr für die evangelischen Stände gesprochen.',
        scene: [
          { stage: 'speyer' },
          { say: 'me', text: 'Ich habe Luther nach Worms geleitet. Er hat nichts verlangt als Gründe aus der Schrift. Man soll niemanden zwingen, gegen sein Gewissen zu glauben.' },
          { say: 'philipp', text: 'Wohl gesprochen! Ein Ritter, der weiß, wofür er das Schwert trägt.' },
          { say: 'ferdinand', text: 'Ihr sprecht kühn für einen Ritter. Merkt Euch: Der Kaiser vergisst nicht, wer an seiner Seite stand.' }
        ] },
      { t: 'Zum Erzherzog und zum Edikt halten', f: { k6: 'alt' }, log: 'Sommer 1526: Im Ratshof zu Speyer habt Ihr zum Erzherzog und zum Wormser Edikt gehalten.',
        scene: [
          { stage: 'speyer' },
          { say: 'me', text: 'Ich habe den Treueid auf den Kaiser geschworen. Ein Reich, ein Glaube, ein Gesetz. Sonst gehen wir in Fehden unter wie zu Sickingens Zeiten.' },
          { say: 'ferdinand', text: 'Endlich ein Mann von Treue. Ihr sollt einen Platz in meinem Gefolge haben, wenn Ihr wollt.' },
          { say: 'johann', text: 'Die Treue zum Kaiser ehrt Euch. Doch Gott ist man mehr Treue schuldig als jedem Fürsten.' }
        ] },
      { t: 'Auf einen Ausgleich drängen, bis ein Konzil kommt', f: { k6: 'ausgleich' }, gn: 1, log: 'Sommer 1526: Im Ratshof zu Speyer habt Ihr auf einen Ausgleich bis zum Konzil gedrängt.',
        scene: [
          { stage: 'speyer' },
          { say: 'me', text: 'Ihr Herren, während Ihr streitet, bezahlt einer wie Eitel Schott Piraten, damit Ihr hungert. Einigt Euch, wenigstens bis ein Konzil entscheidet. Sonst gewinnen nur die Räuber.' },
          { say: 'kaspar', text: 'Der Ritter hat recht. Und aus Ungarn kommen böse Nachrichten: Der Sultan zieht mit einem großen Heer die Donau herauf.' },
          { say: 'ferdinand', text: '… Dann soll es so sein. Bis zum Konzil hält es jeder Stand mit dem Edikt, wie er es vor Gott und dem Kaiser verantworten kann.' }
        ] }
    ] },
  { type: 'scene', t: 'Der Abschied',
    scene: [
      { title: 'Der Abschied von Speyer', sub: 'Am 27. August 1526 einigen sich die Stände: Bis zu einem Konzil soll jeder Stand es mit dem Wormser Edikt so halten, wie er es vor Gott und Kaiserlicher Majestät zu verantworten hofft.' },
      { title: 'Mohács, am 29. August 1526', sub: 'Zwei Tage später schlägt Sultan Süleyman das Heer der Ungarn. König Ludwig ertrinkt auf der Flucht in einem Bach. Ungarn und Böhmen fallen an Erzherzog Ferdinand, und mit ihnen der Krieg gegen die Türken.' },
      { title: 'Eitel Schott', sub: 'Der Erzherzog lässt Eitel Schott von Hohenrhein vorladen. Doch der Ritter erscheint nicht. Man sagt, er sei zu Rotbart auf die Insel geflohen.' }
    ] }
  ] },
/* ===== Kapitel 7 ===== */
{ n: 7, t: 'Die Beute aus Rom', year: 'Herbst 1527', lvl: 18,
  d: 'Im Mai haben die Landsknechte des Kaisers Rom geplündert. Jetzt ziehen sie heim, mit Kirchensilber im Tornister, und an der Weinstraße nehmen sie, was die Winzer mühsam geerntet haben.',
  reward: f => f.k7 === 'dom' ? { s: 'kleinod', n: 'Reliquiar von Sankt Peter', aff: ['hp', 'arm', 'crit'], r: 4 }
    : f.k7 === 'winzer' ? { s: 'beine', n: 'Wingertstiefel der Weinstraße', aff: ['hp', 'spd', 'arm'], r: 4 }
    : { s: 'waffe', n: 'Römischer Silberdegen', aff: ['str', 'crit', 'spd'], r: 4 },
  steps: [
  { type: 'goto', at: [5300, 330], r: 80, place: 'Wallfahrtskapelle', t: 'Reitet die Weinstraße hinauf zur Wallfahrtskapelle', d: 'Die Weinstraße führt vom Nordtor Speyers hinauf in die Weinberge.',
    cast: [{ id: 'winzer', at: [5282, 342], dir: 'right' }, { id: 'winzerin', at: [5320, 346], dir: 'left' }],
    scene: [
      { title: 'Kapitel 7: Die Beute aus Rom', sub: 'An der Weinstraße, im Herbst des Jahres 1527' },
      { pan: [5300, 336] },
      { say: 'winzer', text: 'Herr Ritter! Der Heilige Wendelin hat Euch geschickt. Ich bin Veit, und unten am Hang sind meine Wingerte. Waren meine Wingerte.' },
      { say: 'winzerin', text: 'Landsknechte, Herr! Sie kommen aus Italien. Im Mai waren sie in Rom, als die Stadt erstürmt wurde. Jetzt trinken sie unseren Most und schlagen die Fässer ein.' },
      { say: 'winzer', text: 'Ihr Feldweibel prahlt, er habe im Vatikan geschlafen und dem Papst ins Fenster gespuckt. Den Herzog von Bourbon hat eine Kugel an der Mauer getroffen, und der alte Frundsberg liegt krank daheim. Keiner hält die Kerle mehr im Zaum.' },
      { say: 'me', text: 'Dann halte ich sie im Zaum. Wo lagern sie?' },
      { say: 'winzer', text: 'Am Wingertpfad östlich der Straße, beim großen Kelterhaus. Gott schütze Euch.' }
    ] },
  { type: 'kill', at: [5560, 720], place: 'Die Landsknechte', t: 'Vertreibt die Landsknechte aus den Weinbergen', d: 'Am Wingertpfad östlich der Weinstraße.', cap: 6,
    mobs: [{ k: 'pluend', n: 6, nm: 'Landsknecht aus Rom', tint: 'gold' }, { k: 'armbrust', n: 3, nm: 'Hakenschütze aus Rom', tint: 'gold' }],
    boss: { k: 'raubritter', nm: 'Feldweibel Lienhart Rauchbein', hpf: .5, lv: 2, tint: 'gold', sub: 'aus dem Heer, das Rom geplündert hat', cry: 'Rom haben wir genommen, da nehmen wir auch euren Wein!' },
    after: [
      { put: 'wz', as: 'winzer', at: [5520, 700], dir: 'right' }, { pan: [5550, 712] },
      { say: 'me', text: 'Im Tornister des Feldweibels liegt ein Reliquiar aus Silber, vergoldet, mit Edelsteinen. Darauf eingraviert: SANCTVS PETRVS.' },
      { say: 'wz', nm: 'Winzer Veit', text: 'Aus Rom … aus Sankt Peter! Und daneben Dukaten, mehr als ich in zehn Jahren verdiene. Herr Ritter, was macht Ihr damit?' },
      { hold: true }
    ] },
  { type: 'choice', auto: true, who: 'winzer', t: 'Entscheidet über die Beute aus Rom (E)',
    q: 'Vor Euch liegen das Reliquiar aus Sankt Peter und ein Beutel römischer Dukaten. Die Winzer haben ihre ganze Ernte verloren.',
    opts: [
      { t: 'Das Reliquiar dem Domherrn in Speyer bringen', f: { k7: 'dom' }, gn: 1, log: 'Herbst 1527: Ihr habt das geraubte Reliquiar aus Rom dem Dom zu Speyer übergeben.',
        scene: [{ say: 'me', text: 'Was aus einer Kirche geraubt wurde, gehört in eine Kirche. Der Domherr in Speyer soll es verwahren, bis Rom es zurückfordert.' }, { say: 'winzer', text: 'Das ist recht. Aber die Dukaten, Herr? Wir haben nichts mehr für den Winter.' }, { say: 'me', text: 'Die Dukaten gehören euch. Kauft Saatgut und neue Fässer.' }] },
      { t: 'Alles den Winzern geben, damit sie ihre Höfe wieder aufbauen', f: { k7: 'winzer' }, gn: 1, log: 'Herbst 1527: Ihr habt die Beute aus Rom den geplünderten Winzern an der Weinstraße geschenkt.',
        scene: [{ say: 'me', text: 'Rom ist weit, und der Papst hat Silber genug. Eure Kinder hungern hier. Verkauft das Reliquiar in Straßburg und baut eure Höfe wieder auf.' }, { say: 'winzer', text: 'Gott vergelt es Euch tausendmal! Solange ich lebe, steht in meinem Keller ein Fass für Euch bereit.' }] },
      { t: 'Die Beute behalten', f: { k7: 'selbst' }, log: 'Herbst 1527: Ihr habt die Beute aus Rom behalten.',
        scene: [{ fn: () => { HERO.gold += 400; updateHud(); } }, { say: 'me', text: 'Ich habe sie erschlagen, also ist es meine Beute. So ist Kriegsrecht.' }, { say: 'winzer', text: 'Dann seid Ihr nicht besser als die Landsknechte, Herr. Nur höflicher.' }] }
    ] },
  { type: 'goto', if: isF('k7', 'dom'), at: [5240, 1404], r: 60, place: 'Kaiserdom', t: 'Bringt das Reliquiar zum Domherrn am Kaiserdom', d: 'Der Domherr wartet vor dem Kaiserdom in Speyer.',
    cast: [{ id: 'domherr', at: [5250, 1392] }],
    scene: [
      { pan: [5246, 1396] },
      { say: 'domherr', text: 'Ein Reliquiar aus Sankt Peter? Heilige Mutter Gottes … Ihr hättet es verkaufen können und wärt ein reicher Mann.' },
      { say: 'domherr', text: 'Der Dom wird es verwahren, und wenn Frieden ist, geht es nach Rom zurück. Ich werde für Euch beten, Herr Ritter, ob Ihr nun der alten oder der neuen Lehre folgt.' },
      { say: 'domherr', text: 'Und hört: Eitel Schott ist wieder gesehen worden, auf der Insel bei Rotbart. Er hat Geld, viel Geld. Woher, weiß niemand.' }
    ] },
  { type: 'scene', t: 'Winter',
    scene: [
      { title: 'Winter 1527 auf 1528', sub: 'Rom liegt in Trümmern, Papst Clemens muss sich dem Kaiser beugen. Im Reich aber führen immer mehr Fürsten und Städte die neue Lehre ein, so wie es der Abschied von Speyer erlaubt. Die Altgläubigen sinnen auf Rache.' }
    ] }
  ] },
/* ===== Kapitel 8 ===== */
{ n: 8, t: 'Die Protestation', year: 'Frühjahr 1529', lvl: 20,
  d: 'Wieder tagt der Reichstag in Speyer, doch diesmal hat die altgläubige Mehrheit den Abschied von 1526 aufgehoben. Die evangelischen Stände wollen sich nicht beugen. Und auf der Insel im Strom sammelt Eitel Schott seine Leute.',
  reward: f => f.k8 === 'prot' ? { s: 'kleinod', n: 'Abschrift der Protestation', aff: ['hp', 'str', 'crit'], r: 4, title: ST_TITLES.prot, tid: 'prot' }
    : f.k8 === 'kaiser' ? { s: 'schild', n: 'Wappenschild Ferdinands von Österreich', aff: ['arm', 'hp', 'block'], r: 4, title: ST_TITLES.erzh, tid: 'erzh' }
    : { s: 'ruestung', n: 'Harnisch des Reichsfriedens', aff: ['hp', 'arm', 'str'], r: 4, title: ST_TITLES.rfrieden, tid: 'rfrieden' },
  steps: [
  { type: 'goto', at: [4846, 1508], r: 60, place: 'Ratshof', t: 'Geht zum Ratshof von Speyer', d: 'Der Reichsherold erwartet Euch vor dem Ratshof am Markt.',
    cast: [{ id: 'kaspar', at: [4872, 1514], dir: 'left' }, { id: 'jsturm', at: [4822, 1516], dir: 'right' }],
    scene: [
      { title: 'Kapitel 8: Die Protestation', sub: 'Speyer, im April des Jahres 1529' },
      { pan: [4848, 1512] },
      { say: 'kaspar', text: 'Drei Jahre ist es her. Damals haben sich die Stände geeinigt. Jetzt hat die Mehrheit den Abschied von 1526 aufgehoben: Das Edikt von Worms soll wieder gelten, keine Neuerungen mehr.' },
      { say: 'jsturm', text: 'Jakob Sturm, Gesandter der Stadt Straßburg. Herr Ritter, wir Städte und die evangelischen Fürsten lassen uns nicht überstimmen. Nicht in Fragen des Glaubens.' },
      { say: 'jsturm', text: 'Heute wird im Ratshof eine Schrift verlesen. Kommt und hört sie Euch an.' },
      { title: 'Speyer, am 19. April 1529', sub: 'Im Ratshof stehen die evangelischen Stände vor Erzherzog Ferdinand: der Kurfürst von Sachsen, der Landgraf von Hessen, der Markgraf von Brandenburg-Ansbach, die Herzöge von Lüneburg, der Fürst von Anhalt und vierzehn Reichsstädte.' },
      { stage: 'speyer' },
      { put: 'ferdinand', at: [0, -14], dir: 'down' }, { put: 'johann', at: [-80, 54], dir: 'up' }, { put: 'philipp', at: [-40, 70], dir: 'up' }, { put: 'jsturm', at: [40, 70], dir: 'up' }, { put: 'kaspar', at: [104, 76], dir: 'up' },
      { say: 'johann', text: 'Wir protestieren hiermit vor Gott, unserem einigen Schöpfer, Erhalter, Erlöser und Seligmacher, der ein Erforscher aller Herzen ist.' },
      { say: 'johann', text: 'In Sachen, Gottes Ehre und unserer Seelen Heil und Seligkeit belangend, muss ein jeglicher für sich selbst vor Gott stehen und Rechenschaft geben.' },
      { say: 'philipp', text: 'Darum können wir dem Beschluss der Mehrheit nicht folgen. Wir berufen uns auf den Kaiser und auf ein freies Konzil.' },
      { say: 'ferdinand', text: 'Der Beschluss ist gefasst. Ihr habt ihm zu gehorchen. Ich nehme Eure Schrift nicht an.' },
      { walk: 'ferdinand', to: [200, -14], spd: 60, wait: true },
      { say: 'jsturm', text: 'Er geht! Dann tragen wir die Protestation selbst zum Kaiser. Ein Schiff liegt im Hafen bereit, Meister Kaspar soll die Gesandten begleiten.' },
      { stage: null },
      { hold: true }
    ] },
  { type: 'choice', auto: true, who: 'kaspar', t: 'Entscheidet Euch vor dem Ratshof (E)',
    q: 'Die Gesandten wollen ihre Schrift zum Kaiser bringen. Der Erzherzog hat sie abgewiesen. Kaspar Sturm sieht Euch fragend an.',
    opts: [
      { t: 'Den protestierenden Ständen Euer Schwert anbieten', f: { k8: 'prot' }, log: 'April 1529: Ihr habt den protestierenden Ständen in Speyer Euer Schwert angeboten.',
        scene: [{ say: 'me', text: 'Wer für sein Gewissen einsteht, verdient einen Ritter an seiner Seite. Ich bringe die Gesandten sicher aus Speyer.' }, { say: 'jsturm', text: 'Dann segelt Ihr mit Meister Kaspar voraus. Das Schiff der Gesandten folgt am Abend.' }] },
      { t: 'Dem Erzherzog dienen, wie es Eure Pflicht ist', f: { k8: 'kaiser' }, log: 'April 1529: Ihr habt Euch dem Erzherzog Ferdinand angeschlossen.',
        scene: [{ say: 'me', text: 'Ich habe dem Kaiser die Treue geschworen. Der Erzherzog spricht für ihn. Ich folge seinem Ruf.' }, { say: 'kaspar', text: 'Dann geht zu ihm. Ich begleite die Gesandten trotzdem, das ist mein Amt als Herold, gleich wem sie dienen.' }] },
      { t: 'Freies Geleit für beide Seiten fordern, damit der Friede im Reich hält', f: { k8: 'frieden' }, gn: 1, need: (f, S) => S.gn >= 3, log: 'April 1529: Ihr habt in Speyer freies Geleit für beide Seiten gefordert.',
        no: 'Dafür müssten beide Seiten Euch vertrauen. Wer oft Gnade gezeigt und auf sein Gewissen gehört hat (mindestens dreimal), dessen Wort gilt jetzt bei Katholiken und Protestanten.',
        scene: [{ say: 'me', text: 'Ihr könnt streiten, so viel Ihr wollt. Aber auf dem Strom und auf den Straßen des Reiches soll jeder Gesandte sicher reisen, gleich welchem Glauben er folgt.' }, { say: 'kaspar', text: 'Das ist die Stimme, die dem Reich fehlt. Ich trage Euren Vorschlag zu beiden Seiten.' }] }
    ] },
  { type: 'scene', t: 'Nachricht vom Strom',
    scene: [
      { title: 'Am Abend', sub: 'Glocken läuten im Hafen. Das Schiff der Gesandten ist überfallen worden, kaum dass es abgelegt hatte, mitten auf dem Strom bei der Pirateninsel.' }
    ] },
  { type: 'talk', npc: 'hafenmeister', opt: 'Was ist mit dem Schiff der Gesandten?', t: 'Sprecht mit dem Hafenmeister am Kai', d: 'Der Hafenmeister steht am Kai vor dem Hafentor.',
    scene: [
      { say: 'hafenmeister', text: 'Es ist schrecklich, Herr Ritter! Drei Boote voller Piraten, und vorne ein Ritter im schwarzen Harnisch. Sie haben das Schiff geentert und die Gesandten mitgenommen.' },
      { say: 'hafenmeister', text: 'Auch den Herold, Meister Kaspar. Und die Schrift mit den Siegeln. Ich habe es selbst gesehen: Sie haben sie hinüber zur Insel gebracht, ans Lager unter dem Zollturm.' },
      { say: 'me', text: 'Eitel Schott. Diesmal entkommt er mir nicht. Bringt mich zur Insel, oder ich reite über die Schiffbrücke und den Auweg.' }
    ] },
  { type: 'kill', at: [5900, 1790], place: 'Das Lager unter dem Zollturm', t: 'Stürmt das Lager der Piraten unter dem Zollturm und befreit die Gefangenen', d: 'Über die Schiffbrücke und den Auweg erreicht man die Insel im Strom, oder mit dem Fährmann.', cap: 7,
    mobs: [{ k: 'pirat', n: 6, nm: 'Schotts Pirat' }, { k: 'pschuetze', n: 4, nm: 'Schotts Schütze' }],
    boss: { k: 'raubritter', nm: 'Eitel Schott von Hohenrhein', hpf: .55, lv: 2, tint: 'dunkel', sub: 'Raubritter, gekauft von den Feinden des Friedens', cry: 'Keine Schrift erreicht den Kaiser! Das Reich gehört denen, die zahlen!' },
    after: [
      { put: 'ks', as: 'kaspar', at: [5930, 1770], dir: 'left' }, { put: 'js', as: 'jsturm', at: [5950, 1786], dir: 'left' }, { put: 'sc', as: 'schott', at: [5884, 1800], dir: 'right' }, { dead: ['sc', true] }, { pan: [5912, 1786] },
      { say: 'ks', nm: 'Reichsherold Kaspar Sturm', text: 'Herr Ritter! Zum dritten Mal rettet Ihr mich. Ich sollte Euch zum Ehrenherold machen.' },
      { say: 'sc', nm: 'Eitel Schott von Hohenrhein', text: '… Ihr Narren. Glaubt Ihr, eine Schrift ändert etwas? Ob Papst oder Luther, am Ende entscheidet das Schwert.' },
      { say: 'js', nm: 'Jakob Sturm von Straßburg', text: 'Vielleicht. Aber diese Schrift entscheidet, wofür man das Schwert zieht. Die Siegel sind unversehrt. Wir bringen sie zum Kaiser.' },
      { if: isF('k8', 'prot'), say: 'js', nm: 'Jakob Sturm von Straßburg', text: 'Die Städte und Fürsten werden nicht vergessen, wer zu ihnen stand, als es gefährlich war.' },
      { if: isF('k8', 'kaiser'), say: 'ks', nm: 'Reichsherold Kaspar Sturm', text: 'Der Erzherzog wird hören, dass Ihr Gesandte gerettet habt, deren Schrift er nicht annehmen wollte. Das ist wahre Treue zum Reich.' },
      { if: isF('k8', 'frieden'), say: 'ks', nm: 'Reichsherold Kaspar Sturm', text: 'Beide Seiten haben Eurem Vorschlag zugestimmt: Freies Geleit für alle Gesandten. Wenigstens auf dem Strom herrscht nun Friede.' },
      { title: 'Die Protestanten', sub: 'Am 25. April 1529 legen die Stände ihre Berufung an den Kaiser schriftlich nieder. Seit dem Reichstag von Speyer nennt man die Anhänger der neuen Lehre Protestanten.' },
      { title: 'Wien, im Herbst 1529', sub: 'Sultan Süleyman belagert Wien. Altgläubige und Protestanten schicken gemeinsam Truppen, und die Stadt hält stand. Im Oktober zieht das türkische Heer ab.' },
      { title: 'Unruhige Zeiten', sub: 'Neun Jahre lang habt Ihr das Reich durch seine unruhigsten Zeiten begleitet. Von Aachen bis Speyer kennt man Euren Namen.' }
    ] }
  ] }
);
/* Tafel unter dem Spiel: die acht Kapitel */
for (const [C, who] of ST_CH.map((C, i) => [C, ['bote', 'luther', 'sickingen', 'jaecklein', 'goetz', 'kaspar', 'winzer', 'johann'][i]])){
  const li = el('li'), im = el('img'), wh = el('span', 'what', 'Kapitel ' + C.n + ': ' + C.t);
  lazySrc(im, () => stPortrait(ST_CAST[who])); im.alt = ''; im.className = 'stimg';
  wh.append(el('small', null, C.year + ', ab Stufe ' + C.lvl + '. ' + C.d)); li.append(im, wh); $('stList').append(li);
}
