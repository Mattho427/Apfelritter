"use strict";
/* Der Apfelritter, Teil 15 von 29: Zeichnen des Spielbilds.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Zeichnen ============ */
function shadow(x, y, w, a){
  ctx.fillStyle = 'rgba(18,16,22,' + a + ')';
  const x0 = Math.round(x - w / 2), y0 = Math.round(y), e = Math.min(3, w >> 2);
  ctx.fillRect(x0 + e, y0 - 1, w - e * 2, 1); ctx.fillRect(x0, y0, w, 2); ctx.fillRect(x0 + e, y0 + 2, w - e * 2, 1);
}
const underProp = (p, o) => o.y < p.y && o.x > p.occl[0] && o.x < p.occl[2] && o.y > p.occl[1] && o.y < p.occl[3];
/* Bild einer Requisite nachmalen (aus dem Zwischenspeicher der Maße gesetzt) */
function propLazy(p){
  p.lz = false;
  const q = wp_paintV(p.kind, p.v, SEA.cur);
  p.img = q.img; p.img0 = q.img;
  if (p.wins && p.wins.length){ const n = nightImg(p.img, p.wins); p.nimg = n.img; p.lights = n.lit.map(([x, y]) => [p.x - p.ax + x, p.y - p.ay + y]); }
}
/* im Hintergrund: fehlende Bilder malen, die nächsten zuerst; je Bild ein paar Millisekunden */
const PL = { list: null, i: 0, at: null };
function propPump(budget){
  if (!PL.list){
    const k = G.knight, by = new Map(); PL.at = { x: k.x, y: k.y };
    for (const p of GPROPS) if (p.lz){ const key = p.kind + '|' + p.v, d = Math.hypot(p.x - k.x, p.y - k.y); let e = by.get(key); if (!e){ e = { d, ps: [] }; by.set(key, e); } else if (d < e.d) e.d = d; e.ps.push(p); }
    PL.list = [...by.values()].sort((a, b) => a.d - b.d); PL.i = 0;
  }
  const t0 = performance.now();
  while (PL.i < PL.list.length && performance.now() - t0 < budget){ for (const p of PL.list[PL.i++].ps) if (p.lz) propLazy(p); }
}
function drawProp(p){
  if (p.lz) propLazy(p);
  const off = p.shake > 0 ? ((G.t * 30 | 0) % 2 ? 1 : -1) : 0;
  const see = G.mode !== 'title' && p.occl && (underProp(p, G.knight) || G.mons.some(m => !MON[m.k].fly && underProp(p, m)));
  const a0 = see ? .45 : 1;
  ctx.globalAlpha = a0;
  ctx.drawImage(p.img, Math.round(p.x - p.ax) + off, Math.round(p.y - p.ay));
  if (p.nimg && SKY.night > .05){ ctx.globalAlpha = a0 * clamp(SKY.night * 1.3, 0, 1); ctx.drawImage(p.nimg, Math.round(p.x - p.ax) + off, Math.round(p.y - p.ay)); }
  ctx.globalAlpha = 1;
}
/* Beute am Boden: Münzen, Tränke, Ausrüstung mit Lichtsäule in der Farbe der Seltenheit */
function drawLoot(a){
  const blink = a.age > (a.t === 'item' ? 110 : 52) && (G.t * 10 | 0) % 2;
  if (blink) return;
  const img = a.t === 'gold' ? COIN_PILE : a.t === 'potion' ? POTION_SMALL : groundIcon(a.it);
  ctx.drawImage(img, Math.round(a.x - img.width / 2), Math.round(a.y - img.height + 1 - a.z));
}
function drawLootBeam(a){
  if (a.t !== 'item' || !a.it.r || a.z > 0) return;
  const c = RARITY[a.it.r].c, h = 14 + a.it.r * 7, ph = (G.t * 2 + a.x * .07) % 1;
  for (let i = 0; i < h; i++){
    ctx.globalAlpha = (1 - i / h) * .55 * (.7 + .3 * Math.sin(G.t * 4 + i * .3));
    ctx.fillStyle = c; ctx.fillRect(Math.round(a.x), Math.round(a.y - 14 - i), 1, 1);
  }
  ctx.globalAlpha = 1;
  if (ph < .25){ ctx.fillStyle = '#ffffff'; const x = Math.round(a.x + 5), y = Math.round(a.y - 16); ctx.fillRect(x, y - 2, 1, 5); ctx.fillRect(x - 2, y, 5, 1); }
}

/* Hiebspur: Sichel hinter der Klinge, zur Klinge hin breiter und heller, außen eine helle Schneide */
const TRAIL_COL = [null, null, ['rgba(200,224,255,', 'rgba(120,170,240,'], ['rgba(232,200,255,', 'rgba(170,110,230,'], ['rgba(255,240,180,', 'rgba(236,190,90,']];
function drawTrail(k, gp, a, wr){
  const R = Math.round(reachOf(k) * .92), a0 = Math.max(k.swA0, a - 1.5), span = Math.max(.01, a - a0), px = new Map();
  for (let t = a0; t < a; t += .5 / R){
    const f = (t - a0) / span, w = Math.round(1 + f * 4), c = Math.cos(t), s = Math.sin(t);
    for (let r = R - w; r <= R; r++){
      const x = Math.round(gp.x + c * r), y = Math.round(gp.y + s * r), key = x + ',' + y, al = (r === R ? .72 : .34) * (.2 + .8 * f), old = px.get(key);
      if (!old || old[2] < al) px.set(key, [x, y, al, r === R]);
    }
  }
  const gold = k.mult > 1.2 || (k === G.knight && G.buffT > 0);
  for (const [x, y, al, edge] of px.values()){
    const TC = TRAIL_COL[wr || 0];
    ctx.fillStyle = gold ? (edge ? 'rgba(255,240,180,' : 'rgba(236,210,122,') + al.toFixed(2) + ')' : TC ? TC[edge ? 0 : 1] + al.toFixed(2) + ')' : (edge ? 'rgba(240,244,250,' : 'rgba(186,202,224,') + al.toFixed(2) + ')';
    ctx.fillRect(x, y, 1, 1);
  }
}
/* Ritter zeichnen: eigener (k = G.knight) oder ein anderer (set = Farbvariante) */
function drawKnightAt(k, set, dead, dieP){
  if (k.ride && !dead && HORSES[k.ride]){
    const couched = k.lance > 0, back = k.dir === 'up';
    if (back) drawLance(k, set.id, couched);
    drawMounted(ctx, k.ride, set.key || set.id, k.dir, k.x, k.y, k.moving ? (k.anim | 0) % 4 : 4);
    if (!back) drawLance(k, set.id, couched);
    return;
  }
  const SW = set.sword;
  if (dead){
    const r = (set.fall || KNIGHT_FALL)[k.dir][Math.min(3, Math.floor(dieP * 9))];
    drawSword(ctx, Math.round(k.x - 16), Math.round(k.y + 3), -.12, SW);
    ctx.drawImage(r.img, Math.round(k.x - r.ox), Math.round(k.y - 1 - r.oy));
    return;
  }
  const f = k.moving ? 1 + ((k.anim | 0) % 4) : 0;
  const hit = k === G.knight && k.inv > .4 && k.inv < .55 + 1e-3;
  const wt = set.wt || 'schwert';
  const fr = hit ? (set.hit || KNIGHT_HIT)[k.dir][0] : (k.atkT > 0 && wt !== 'armbrust' ? set.atk : set.walk)[k.dir][f];
  let sword, behind;
  if (wt === 'armbrust' && !(k.bashT > 0)){
    const sh = k.atkT > 0, c = (sh ? XB_AIM : WT_CARRY.armbrust)[k.dir], fw = set.walk[k.dir][f], a = sh ? k.swA0 : c.a, rc = sh ? clamp(k.atkT / k.atkLen, 0, 1) * 3 : 0;
    behind = c.behind;
    sword = () => {
      drawSword(ctx, Math.round(k.x + c.x - Math.cos(a) * rc), Math.round(k.y + c.y - Math.sin(a) * rc), a, SW);
      if (fw.hands) ctx.drawImage(fw.hands, Math.round(k.x - KS.ax), Math.round(k.y - KS.ay));
    };
  } else if (k.bashT > 0){
    behind = k.dir !== 'down';
    sword = () => { const c = KNIGHT_CARRY[k.dir]; drawSword(ctx, Math.round(k.x + c.x), Math.round(k.y + c.y), c.a, SW); };
  } else if (k.atkT > 0){
    const gp = thrustGp(k, wt), a = swingAngle(k);
    behind = k.dir === 'up' || k.dir === 'left' || Math.sin(a) < -.4;
    sword = () => {
      drawTrail(k, gp, a, set.wr); drawSword(ctx, Math.round(gp.x), Math.round(gp.y), a, SW);
      if (k.dir !== 'up') ctx.drawImage(KNIGHT_FIST, Math.round(gp.x - KNIGHT_FIST.width / 2), Math.round(gp.y - KNIGHT_FIST.height / 2));
    };
  } else {
    const c = (WT_CARRY[wt] || KNIGHT_CARRY)[k.dir], fw = set.walk[k.dir][f];
    behind = c.behind;
    sword = () => {
      drawSword(ctx, Math.round(k.x + c.x), Math.round(k.y + c.y), c.a, SW);
      if (fw.hands) ctx.drawImage(fw.hands, Math.round(k.x - KS.ax), Math.round(k.y - KS.ay));
    };
  }
  if (behind) sword();
  ctx.drawImage(fr.img, Math.round(k.x - KS.ax), Math.round(k.y - KS.ay));
  if (k.slowT > 0){ ctx.fillStyle = '#3a2c1e'; ctx.fillRect(Math.round(k.x - 8), Math.round(k.y - 3), 16, 3); }
  if (!behind) sword();
}
const ownSet = () => HERO ? knightSet(HERO.f, lookOf(HERO.eq)) : knightSet('reich');
function drawKnight(){
  const k = G.knight;
  k.ride = riding() && G.mode !== 'dying' && G.mode !== 'dead' ? HERO.horse : null;
  if (k.lift){ ctx.save(); ctx.translate(0, -Math.round(k.lift)); }   // klettern, springen
  drawKnightAt(k, ownSet(), G.mode === 'dying' || G.mode === 'dead', G.mode === 'dead' ? 1 : 1 - G.dieT / 1.3);
  if (k.lift) ctx.restore();
}

const MOVE_FPS = { wieder:4, moor:3, ratte:12, rabe:9, pluend:6, armbrust:6, werwolf:8, irrlicht:7, raubritter:5, lindwurm:5, tod:3, pirat:6, pschuetze:6, nix:3, rotbart:7, wels:4, noeck:4 };
function monFrame(m){
  const art = m.art || artOf(m.k), side = m.dir > 0 ? 'r' : 'l', st = m.st;
  let set = art.move[side], i = (m.t * (MOVE_FPS[m.k] || 5) | 0) % set.length;
  if (m.stunT > 0){ set = art.idle[side]; i = 0; }
  else if (m.mode !== 'fight' && !m.walking && m.mode !== 'back' && !MON[m.k].fly){ set = art.idle[side]; i = (m.t * 1.5 | 0) % set.length; }
  else if (st === 'aim' || st === 'wind' || st === 'breath'){ set = art.act[side]; i = 0; }
  else if (st === 'thrust' || st === 'dash' || st === 'charge' || st === 'sweep' || st === 'shot' || st === 'dive'){ set = art.act[side]; i = Math.min(1, set.length - 1); }
  else if (st === 'rest' || st === 'stun' || st === 'linger' || st === 'appear' || st === 'fade' || (aiK(m.k) === 'tod' && st === 'idle')){ set = art.idle[side]; i = (m.t * 2 | 0) % set.length; }
  return set[i];
}
function monXY(m){
  const art = m.art || artOf(m.k);
  let ox = 0, oy = 0;
  if (aiK(m.k) === 'raubritter' && m.st === 'wind' && m.sT > .3) ox = (G.t * 30 | 0) % 2 ? 1 : -1;
  if (aiK(m.k) === 'werwolf' && m.st === 'aim' && m.sT > .25) ox = (G.t * 24 | 0) % 2;
  if (aiK(m.k) === 'tod') oy = Math.round(Math.sin(G.t * 2) * 2);
  return { x: Math.round(m.x - art.ax) + ox, y: Math.round(m.y - art.ay) + oy };
}
function drawMon(m, glowOnly){
  if (aiK(m.k) === 'tod' && m.st === 'hidden') return;
  const fr = monFrame(m), p = monXY(m);
  const fade = aiK(m.k) === 'tod' ? (m.alpha == null ? 1 : m.alpha) : m.sub ? .2 : 1;
  ctx.globalAlpha = fade * (m.mode === 'back' ? .6 : 1);
  if (glowOnly){
    if (fr.glow && !(m.fl > 0)) ctx.drawImage(fr.glow, p.x, p.y);
    ctx.globalAlpha = 1;
    return;
  }
  if (m.k === 'lindwurm'){
    const segs = wurmSegs(m);
    for (let i = segs.length - 1; i >= 0; i--){ const s = segs[i]; ctx.drawImage(m.fl > 0 ? s.s.white : s.s.img, Math.round(s.x - s.s.w / 2), Math.round(s.cy - s.s.h / 2)); }
  }
  const lock = (aiK(m.k) === 'raubritter' && m.st === 'wind' && m.sT <= .3) || (aiK(m.k) === 'werwolf' && m.st === 'aim' && m.sT <= .25);
  const white = m.fl > 0 || (lock && (G.t * 20 | 0) % 2);
  if (aiK(m.k) === 'tod' && m.st === 'wind' && (G.t * 12 | 0) % 2){
    const c = centerOf(m);
    ctx.fillStyle = '#c8343c';
    for (let a = 0; a < Math.PI * 2; a += .09) ctx.fillRect(Math.round(c.x + Math.cos(a) * 64), Math.round(c.y + 4 + Math.sin(a) * 46), 1, 1);
  }
  ctx.drawImage(white ? fr.white : fr.img, p.x, p.y);
  if (aiK(m.k) === 'armbrust' && m.st === 'aim' && m.mode === 'fight'){
    const mz = muzzleOf(m), locked = m.sT <= .3;
    if (!locked || (G.t * 20 | 0) % 2){
      ctx.fillStyle = locked ? '#ff5050' : 'rgba(255,80,80,.55)';
      for (let i = 10; i < 130; i += 4) ctx.fillRect(Math.round(mz.x + m.ax * i), Math.round(mz.y + m.ay * i), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}
/* Namensschild über einem Monster: Name und Stufe in der Farbe des Abstands, darunter Lebensbalken */
function drawPlate(m){
  if (aiK(m.k) === 'tod' && (m.st === 'hidden' || (m.alpha != null && m.alpha < .5))) return;
  const art = artOf(m.k), d = MON[m.k], top = (m.k === 'lindwurm' ? m.y - 40 : d.fly ? m.y - art.h * .5 - 4 : m.y - art.ay) - 19;
  const col = CON_COL[conOf(m.lvl - HERO.lvl)];
  drawText((m.nm || m.elite || d.name) + ' ' + m.lvl, m.x, top, m.elite ? '#ff9a50' : (m.ev && m.ev.boss) || (m.story && m.story.boss) ? '#ff6a50' : col);
  if (m.hp < m.max){
    const w = d.boss || m.elite ? 44 : 28, x0 = Math.round(m.x - w / 2), y0 = Math.round(top + 14), f = Math.max(0, Math.round((w - 2) * m.hp / m.max));
    ctx.fillStyle = OUT; ctx.fillRect(x0, y0, w, 5);
    ctx.fillStyle = '#3a1416'; ctx.fillRect(x0 + 1, y0 + 1, w - 2, 3);
    ctx.fillStyle = '#d0343c'; ctx.fillRect(x0 + 1, y0 + 1, f, 3);
    ctx.fillStyle = '#f08a80'; ctx.fillRect(x0 + 1, y0 + 1, f, 1);
  }
  if (m.stunT > 0 || (aiK(m.k) === 'raubritter' && m.st === 'stun')) for (let i = 0; i < 3; i++){
    const a = G.t * 5 + i * 2.1, x = Math.round(m.x + Math.cos(a) * 12), y = Math.round(top - 4 + Math.sin(a) * 3);
    ctx.fillStyle = '#ecd27a'; ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5);
    ctx.fillStyle = '#fff3c0'; ctx.fillRect(x, y, 1, 1);
  }
}
const BOLT_ROT = (() => { const out = []; const b = ITEM_ART.bolt; for (let i = 0; i < 32; i++) out.push(rotateNN(b, i / 32 * Math.PI * 2, b.width / 2, b.height / 2)); return out; })();
function drawShot(s){
  if (s.k === 'ball'){   // Bleikugel der Hakenbüchse mit kurzer Rauchspur
    const l = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / l, uy = s.vy / l;
    for (let i = 1; i <= 4; i++){ ctx.globalAlpha = .35 - i * .07; ctx.fillStyle = '#c8c4bc'; ctx.fillRect(Math.round(s.x - ux * i * 3), Math.round(s.y - uy * i * 3), 2, 2); }
    ctx.globalAlpha = 1; ctx.fillStyle = '#1a1a1e'; ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 3, 3); ctx.fillStyle = '#8a8a90'; ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 1, 1);
  } else if (s.k === 'bolt'){
    const a = Math.atan2(s.vy, s.vx), r = BOLT_ROT[((Math.round(a / (Math.PI * 2) * 32) % 32) + 32) % 32];
    ctx.drawImage(r.img, Math.round(s.x - r.ox), Math.round(s.y - r.oy));
  } else {
    const f = ITEM_ART.fire[(G.t * 14 | 0) % ITEM_ART.fire.length];
    ctx.drawImage(f, Math.round(s.x - f.width / 2), Math.round(s.y - f.height / 2));
  }
}
function flame(x, y, t, big){
  const f = (t * 12 + x) | 0, h = (big ? 9 : 5) + (f % 2) * 2, w = big ? 7 : 4, x0 = Math.round(x - w / 2);
  y = Math.round(y);
  ctx.fillStyle = '#8e1b1b'; ctx.fillRect(x0, y - 1, w, 2);
  ctx.fillStyle = '#e0782a'; ctx.fillRect(x0, y - h, w, h);
  ctx.fillRect(x0 + 1, y - h - 2 - (f % 3 === 0 ? 1 : 0), w - 2, 2);
  ctx.fillStyle = '#ffd36a'; ctx.fillRect(x0 + (w >> 1) - (big ? 1 : 0), y - h + 2, big ? 3 : 1, h - 3);
  ctx.fillStyle = '#fff3c0'; ctx.fillRect(x0 + (w >> 1), y - (h >> 1), 1, 2);
}
/* Flamme in Feinpixeln für Feuerstellen der Welt: flackernde Zunge mit hellem Kern */
function flameHD(x, y, t, big){
  const ph = t * 9 + x * .37, h = (big ? 22 : 13) + Math.round(Math.sin(ph * 1.7) * 2 + Math.sin(ph * 3.1)), w = big ? 14 : 8;
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = '#5e1610'; ctx.fillRect(x - (w >> 1), y - 1, w, 2);
  for (let r = 0; r < h; r++){
    const u = r / h, hw = w / 2 * Math.pow(Math.sin(Math.PI * Math.min(1, u * .9 + .12)), .7) * (1 - u * .45), sw = Math.sin(ph + u * 5) * u * 2.4;
    if (hw < .35) continue;
    const cx = x + sw, yy = y - 1 - r;
    ctx.fillStyle = u > .75 ? '#c8461e' : '#e0782a'; ctx.fillRect(Math.round(cx - hw), yy, Math.max(1, Math.round(hw * 2)), 1);
    if (u < .7 && hw > 1.2){ ctx.fillStyle = '#ffd36a'; ctx.fillRect(Math.round(cx - hw * .55), yy, Math.max(1, Math.round(hw * 1.1)), 1); }
    if (u < .38 && hw > 2){ ctx.fillStyle = '#fff3c0'; ctx.fillRect(Math.round(cx - hw * .22), yy, Math.max(1, Math.round(hw * .44)), 1); }
  }
}
const inView = (x, y, cam, m) => { m = m || 60; return x > cam.x - m && x < cam.x + W + m && y > cam.y - m && y < cam.y + H + m * 2; };

/* Leute: Bild, Name, Rolle, Zeichen für offene Aufträge */
function npcMark(n){
  if (HERO && stWants(n.id)) return '!';
  if (HERO && asMark(n)) return '!';
  const rm = HERO ? rrMark(n) : ''; if (rm) return rm;
  if (n.fest && !n.festShop && HERO) return HERO.festDone && HERO.festDone[festKey()] ? '' : '!';
  if (!n.quest || !HERO) return '';
  if (HERO.quests.some(q => { const d = qInfo(q); return d && d.giver === n.id && q.n >= d.need; })) return '?';
  if (availableQuests(n.id).length) return '!';
  return '';
}
function drawNpc(n){
  if (n.act) return stDrawActor(n.act);   // Leute der Hauptgeschichte
  const f = n.art.frames[(G.t * .8 + n.x) % 2 | 0];
  ctx.drawImage(f, Math.round(n.x - n.art.ax), Math.round(n.y - n.art.ay));
}
function drawNpcPlate(n){
  if (G.scene && G.scene.speaker !== n.id) return;   // in Szenen nur, wer spricht
  const top = n.y - n.art.ay - 26;
  drawText(n.name, n.x, top, '#9fe08a');
  drawText('<' + n.role + '>', n.x, top + 12, '#c8d8b8');
  const mk = npcMark(n);
  if (mk) drawText(mk, n.x, top - 22 + Math.round(Math.sin(G.t * 4) * 2), '#ffd541', 'c', 1.5);
  if (G.near === n && !G.scene) drawText(touchUI() ? 'Sprechen' : 'E: Sprechen', n.x, n.y + 4, '#ffffff');
}

/* Dunst und Bildstimmung */
const fogTex = (() => {
  const sw = 80, sh = 24, small = canvasOf(sw, sh), sg = small.getContext('2d'), Rn = rng(99);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++){
    const v = Rn(), band = Math.max(0, Math.sin(y / sh * Math.PI * 2 + .6)) * .8 + .2;
    sg.fillStyle = 'rgba(190,196,210,' + (v * v * band * .9).toFixed(3) + ')';
    sg.fillRect(x, y, 1, 1);
  }
  const big = canvasOf(W * 2, H), bg2 = big.getContext('2d');
  bg2.imageSmoothingEnabled = true; bg2.drawImage(small, 0, 0, sw, sh, 0, 0, W * 2, H);
  return big;
})();
const gradeTex = (() => {
  const c = canvasOf(W, H), g = c.getContext('2d'), img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
    const a = .06 + .3 * Math.max(0, dx * dx * .7 + dy * dy * .8 - .28);
    const q = .05, step = Math.floor(a / q + dither(x, y)) * q, i = (y * W + x) * 4;
    img.data[i] = 34; img.data[i + 1] = 34; img.data[i + 2] = 44; img.data[i + 3] = Math.round(clamp(step, 0, 1) * 255);
  }
  g.putImageData(img, 0, 0); return c;
})();
const FOG_BY_ZONE = { moor:.26, friedhof:.16, wald:.13, fluss:.12, schlachtfeld:.12 };

/* Sprechblase über einem Ritter */
function drawBubble(x, y, text){
  const lines = wrapText(text, 26);
  if (!lines.length) return;
  const imgs = lines.map(l => textImg(l, '#2a1c12', true)), w = Math.max(...imgs.map(i => i.width)) + 8, h = imgs.length * 13 + 4;
  const x0 = Math.round(clamp(x - w / 2, 2, GW - w - 2)), y0 = Math.round(y - h - 4), tx = Math.round(x);
  ctx.fillStyle = OUT; ctx.fillRect(x0 - 1, y0 - 1, w + 2, h + 2); ctx.fillRect(tx - 2, y0 + h, 5, 2); ctx.fillRect(tx - 1, y0 + h + 2, 3, 1);
  ctx.fillStyle = '#e8dcbc'; ctx.fillRect(x0, y0, w, h); ctx.fillRect(tx - 1, y0 + h, 3, 1); ctx.fillRect(tx, y0 + h + 1, 1, 1);
  imgs.forEach((im, i) => ctx.drawImage(im, x0 + 4, y0 + 2 + i * 13));
}

function render(){
  updateClock();
  if (G.inside){ renderInn(); return; }
  if (DG_ON){ renderDungeon(); return; }
  if (G.joust){ renderJoust(); return; }
  if (G.scene && G.scene.stage){ renderStage(); return; }
  const k = G.knight, cam = camOf(k);
  const sh = G.shake > 0 && !RM ? 2 : 0, sx = sh ? Math.round(rand(-sh, sh)) : 0, sy = sh ? Math.round(rand(-sh, sh)) : 0;
  ctx.setTransform(1, 0, 0, 1, sx, sy);
  drawGround(ctx, cam.x, cam.y);
  drawWaterFx(ctx, cam.x, cam.y, G.t);
  ctx.setTransform(1, 0, 0, 1, sx - cam.x, sy - cam.y);
  const title = G.mode === 'title';
  drawPrints(cam);

  for (const a of G.loot) if (inView(a.x, a.y, cam)) shadow(a.x, a.y - 1, a.z > 3 ? 4 : 8, a.z > 3 ? .2 : .3);
  const shW = o => o.ride ? (o.dir === 'left' || o.dir === 'right' ? 44 : 26) : 18;
  if (!title) shadow(k.x, k.y - 1, shW(k), .42);
  for (const p of PEERS.values()) if (!p.in && inView(p.x, p.y, cam)) shadow(p.x, p.y - 1, shW(p), .38);
  if (!title) zkRing(cam);
  for (const n of NPCS) if (inView(n.x, n.y, cam)) shadow(n.x, n.y - 1, 14, .38);
  const lifeL = lifeEnts(cam, []);
  for (const e of lifeL) lifeShadow(e);
  for (const m of G.mons){
    if (!inView(m.x, m.y, cam)) continue;
    const art = artOf(m.k);
    if (aiK(m.k) === 'rabe') shadow(m.x, m.y + 30, 12, .22);
    else if (aiK(m.k) === 'irrlicht') shadow(m.x, m.y + 18, 6, .18);
    else if (aiK(m.k) === 'tod'){ if (m.st !== 'hidden') shadow(m.x, m.y + art.h * .5 + 6, 26, .3 * (m.alpha == null ? 1 : m.alpha)); }
    else if (m.k === 'lindwurm'){ shadow(m.x, m.y - 1, 26, .35); for (const s of wurmSegs(m)) shadow(s.x, s.y - 1, s.s.w * .9, .3); }
    else shadow(m.x, m.y - 1, Math.max(10, art.w * .55), .38);
  }
  for (const r of G.rising){
    if (aiK(r.kind) === 'irrlicht' || aiK(r.kind) === 'rabe' || !inView(r.x, r.y, cam)) continue;
    const boss = MON[r.kind].boss, w = Math.round((boss ? 40 : 20) * (1 - r.t / (boss ? 1.6 : .9))) + 2;
    ctx.fillStyle = boss ? '#3a1416' : '#2a2018'; ctx.fillRect(Math.round(r.x - w / 2), Math.round(r.y - 2), w, 4);
  }

  const list = [];
  for (const p of propsInView(cam)) list.push({ y: p.y, d: () => drawProp(p) });
  for (const a of G.loot) if (inView(a.x, a.y, cam)) list.push({ y: a.y, d: () => drawLoot(a) });
  for (const m of G.mons) if (!MON[m.k].fly && inView(m.x, m.y, cam, 120)) list.push({ y: m.y + .1, d: () => drawMon(m) });
  for (const n of NPCS) if (inView(n.x, n.y, cam)) list.push({ y: n.y + .15, d: () => drawNpc(n) });
  for (const e of lifeL) list.push({ y: (e.sy || e.y) + .05, d: () => drawLife(e) });
  for (const p of PEERS.values()) if (!p.in && inView(p.x, p.y, cam)) list.push({ y: p.y + .18, d: () => { geWrap(p, () => drawKnightAt(p, knightSet(p.f, p.lk), p.dead, 1)); if (p.bk) drawBucket(p.x - 14, p.y - 14); } });
  evList(cam, list); olList(cam, list); stList(cam, list); asList(cam, list); fishList(cam, list); rrList(cam, list);
  if (G.bucket && !title) list.push({ y: k.y + .21, d: () => drawBucket(k.x - 14, k.y - 14) });
  if (!title) list.push({ y: k.y + .2, d: () => geWrap(k, drawKnight) });
  festList(cam, list);
  list.sort((p, q) => p.y - q.y);
  for (const it of list) it.d();
  festOverlay(cam); drawFgameWorld(cam); rrOverlay();
  for (const m of G.mons) if (MON[m.k].fly && inView(m.x, m.y, cam, 100)) drawMon(m);
  drawSky(cam);
  for (const s of G.shots) if (s.k === 'bolt' || s.k === 'ball') drawShot(s);
  kbDraw();
  for (const p of G.parts){
    if (p.glow) continue;
    ctx.globalAlpha = p.s ? Math.min(.6, p.life * .5) : .85;
    ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, p.s || 1, p.s || 1);
  }
  ctx.globalAlpha = 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawSkyLight(cam);
  const mist = SKY.hour > 4 && SKY.hour < 8.5 ? .06 * Math.sin((SKY.hour - 4) / 4.5 * Math.PI) : 0;
  const fogA = (FOG_BY_ZONE[G.zone] || .07) + SKY.fog * .3 + mist, fx = Math.round(G.fogX * 1.8) % (W * 2);
  ctx.globalAlpha = fogA;
  ctx.drawImage(fogTex, -fx, 0); ctx.drawImage(fogTex, W * 2 - fx, 0);
  ctx.globalAlpha = fogA * .6;
  const fx2 = Math.round(G.fogX * 3) % (W * 2);
  ctx.drawImage(fogTex, fx2 - W * 2, 14); ctx.drawImage(fogTex, fx2, 14);
  ctx.globalAlpha = 1;
  ctx.drawImage(gradeTex, 0, 0);

  ctx.setTransform(1, 0, 0, 1, sx - cam.x, sy - cam.y);
  for (const f of GFIRES) if (inView(f.x, f.y, cam)) flameHD(f.x, f.y, G.t + f.x * .01, f.big);
  festFlames(cam); evFlames(cam); stFx(cam);
  for (const m of G.mons) if (inView(m.x, m.y, cam, 120)) drawMon(m, true);
  for (const m of G.mons) if (m.k === 'lindwurm' && m.st === 'breath' && (G.t * 18 | 0) % 2){
    const mz = mouthOf(m); ctx.fillStyle = '#ffd36a'; ctx.fillRect(Math.round(mz.x) - 2, Math.round(mz.y) - 1, 4, 3);
  }
  for (const s of G.shots) if (s.k === 'fire') drawShot(s);
  for (const a of G.loot) if (inView(a.x, a.y, cam)) drawLootBeam(a);
  for (const p of G.parts){ if (!p.glow) continue; ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, 1, 1); }
  // Schilder: Monster in der Nähe oder im Kampf, Leute, andere Ritter
  if (!title){
    for (const m of G.mons) if (inView(m.x, m.y, cam, 20) && (m.mode === 'fight' || m.hp < m.max || Math.hypot(m.x - k.x, m.y - k.y) < 170)) drawPlate(m);
    for (const n of NPCS) if (inView(n.x, n.y, cam, 20) && (Math.hypot(n.x - k.x, n.y - k.y) < 260 || npcMark(n))) drawNpcPlate(n);   // Schilder nur in der Nähe oder mit Aufgabe
    drawSpeech(cam); stPlates(cam);
    for (const inn of INNS) if (inView(inn.dx, inn.y, cam, 260)){
      drawText('Gasthaus ' + inn.name, inn.dx, inn.y - 74, '#ffd98a');
      if (G.nearDoor === inn) drawText(touchUI() ? 'Eintreten' : 'E oder hinauf: eintreten', inn.dx, inn.y + 4, '#ffffff');
    }
    for (const d of DG_DOORS) if (inView(d.x, d.y, cam, 200)){
      drawText(d.name, d.x, d.y - 108, '#c8b8ff');
      if (G.nearDoor === d) drawText(touchUI() ? 'Hinabsteigen' : 'E oder hinauf: hinabsteigen', d.x, d.y + 4, '#ffffff');
    }
    for (const p of PEERS.values()) if (!p.in && inView(p.x, p.y, cam, 20)){
      const up = p.ride ? 15 : 0;
      const pal = inParty(p);
      drawText(p.nm + ' ' + p.lv, p.x, p.y - KS.ay - 15 - up, pal ? '#9fe08a' : '#9cc8ff');
      if (p.or){ const tw = textImg(p.nm + ' ' + p.lv, '#ffffff').width; ctx.drawImage(orBanner(p.or.wp), Math.round(p.x - tw / 2 - 16), Math.round(p.y - KS.ay - 21 - up)); }
      ehPlate(p, up); rrPlate(p, up);
      if (pal){ const x0 = Math.round(p.x - 12), y0 = Math.round(p.y - KS.ay - 3 - up); ctx.fillStyle = OUT; ctx.fillRect(x0, y0, 24, 4); ctx.fillStyle = '#3a1416'; ctx.fillRect(x0 + 1, y0 + 1, 22, 2); ctx.fillStyle = '#7fd65f'; ctx.fillRect(x0 + 1, y0 + 1, Math.round(22 * p.hp / 100), 2); }
      if (p.say && nowS() < p.sayT) drawBubble(p.x, p.y - KS.ay - 11 - up, p.say);
    }
    olDraw(cam, k);
    if (G.say && nowS() < G.sayT) drawBubble(k.x, k.y - KS.ay - 4 - (k.ride ? 15 : 0), G.say);
  }
  for (const f of G.floats){
    ctx.globalAlpha = clamp(f.life / f.max * 2.5, 0, 1);
    drawText(f.txt, f.x, f.y, f.c, 'c', f.s);
  }
  ctx.globalAlpha = 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawRain();
  drawBolt();
  // Monster im Kampf außer Sicht: Zeichen am Rand
  const off = [];
  for (const m of G.mons){ if (m.mode !== 'fight' || (aiK(m.k) === 'tod' && m.st === 'hidden')) continue; const c = centerOf(m); if (!(c.x > cam.x && c.x < cam.x + W && c.y > cam.y && c.y < cam.y + H)) off.push({ x: c.x, y: c.y, boss: MON[m.k].boss }); }
  for (const o of off.slice(0, 10)){
    const vx = o.x - (cam.x + W / 2), vy = o.y - (cam.y + H / 2), s = Math.min((W / 2 - 12) / Math.abs(vx || 1e-6), (H / 2 - 12) / Math.abs(vy || 1e-6));
    const x = Math.round(W / 2 + vx * s), y = Math.round(H / 2 + vy * s);
    ctx.fillStyle = OUT; ctx.fillRect(x - 5, y - 5, 11, 11);
    ctx.fillStyle = o.boss ? '#ecd27a' : '#d0343c'; ctx.fillRect(x - 4, y - 4, 9, 9);
    if (o.boss){ ctx.fillStyle = '#d0343c'; ctx.fillRect(x - 2, y - 2, 5, 5); }
  }
  if (!title && !G.scene){ drawQuestArrow(k); drawQuestArrow(k, rrTarget(), true); drawMiniMap(k, cam); drawSkyHud(); duelWatch(); }
  stOverlay(cam);
  if (G.fgame) drawFgameUI();
  rrUi();
  if (G.flash > 0 && !RM){
    ctx.fillStyle = 'rgba(220,226,255,' + Math.min(.45, G.flash * .9).toFixed(2) + ')';
    ctx.fillRect(0, 0, W, H);
  }
}
function drawRain(){
  if (!RM && SKY.snow > .04){
    // Flocken: langsam, im Wind treibend, jede mit eigenem Schaukeln
    const n = Math.round(120 * W * H / 129600 * SKY.snow);
    for (let i = 0; i < n; i++){
      const sp = 20 + (i % 7) * 6, dr = SKY.wind * (.5 + (i % 3) * .25);
      const x = (((i * 53.7 + G.t * dr + Math.sin(G.t * 1.1 + i) * 9) % (W + 20)) + W + 20) % (W + 20) - 10, y = ((i * 97.3 + G.t * sp) % (H + 10)) - 5;
      ctx.fillStyle = i % 4 ? 'rgba(236,241,248,.8)' : 'rgba(255,255,255,.95)';
      ctx.fillRect(x | 0, y | 0, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
  }
  if (!RM && SKY.rain > .04){
    // Regen nach Wetter: Tropfen schräg im Wind, kleine Spritzer am Boden
    ctx.fillStyle = 'rgba(190,198,212,' + (.22 + SKY.rain * .14).toFixed(2) + ')';
    const sl = SKY.wind / 190;
    for (let i = 0, n = Math.round(70 * W * H / 129600 * 1.1 * SKY.rain); i < n; i++){
      const x = ((i * 53.7 + G.t * (46 + SKY.wind * 2)) % (W + 40)) - 20, y = ((i * 97.3 + G.t * 190) % (H + 10)) - 5;
      ctx.fillRect(x | 0, y | 0, 1, 3); ctx.fillRect(Math.round(x - sl * 4), (y | 0) + 3, 1, 1);
    }
    ctx.fillStyle = 'rgba(210,218,226,.45)';
    for (let i = 0, n = Math.round(24 * SKY.rain * W / 480); i < n; i++){
      const ph = (G.t * 3 + i * .618) % 1, x = ((i * 137.5) % W + (Math.floor(G.t * 3 + i * .618) * 61) % W) % W, y = ((i * 71.3) % H + (Math.floor(G.t * 3 + i * .618) * 37) % H) % H;
      if (ph < .3){ ctx.fillRect(x | 0, y | 0, 1, 1); ctx.fillRect((x | 0) - 1, (y | 0) - 1, 1, 1); ctx.fillRect((x | 0) + 1, (y | 0) - 1, 1, 1); }
    }
  }
}
/* Ausschnitt der Übersichtskarte um den Ritter (1 px = 32 Weltpixel) */
const MM_W = 96, MM_H = 72, MM_S = GW / MINIMAP.width;
const MM_Z = W >= 800 ? 2 : 1, mmCv = canvasOf(MM_W + 4, MM_H + 4), mmG = mmCv.getContext('2d');
function drawMiniMap(k, cam){
  G.mmN = ((G.mmN | 0) + 1) % 3;
  if (!G.mmN || G.mmK !== HERO) { drawMiniMap1(mmG, k, cam, 2, 2); G.mmK = HERO; }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mmCv, Math.round(W - (MM_W + 4) * MM_Z - 6), Math.round(H - (MM_H + 4) * MM_Z - 6), Math.round((MM_W + 4) * MM_Z), Math.round((MM_H + 4) * MM_Z));
}
function drawMiniMap1(g, k, cam, mx, my){
  const sx0 = clamp(Math.round(k.x / MM_S - MM_W / 2), 0, MINIMAP.width - MM_W), sy0 = clamp(Math.round(k.y / MM_S - MM_H / 2), 0, MINIMAP.height - MM_H);
  g.fillStyle = OUT; g.fillRect(mx - 2, my - 2, MM_W + 4, MM_H + 4);
  g.fillStyle = '#7d6414'; g.fillRect(mx - 1, my - 1, MM_W + 2, MM_H + 2);
  g.drawImage(MINIMAP, sx0, sy0, MM_W, MM_H, mx, my, MM_W, MM_H);
  if (SEA.cur === 3){ g.fillStyle = 'rgba(232,238,246,.34)'; g.fillRect(mx, my, MM_W, MM_H); }
  const P = (x, y) => [mx + (x / MM_S | 0) - sx0, my + (y / MM_S | 0) - sy0];
  const inMM = ([x, y]) => x >= mx && y >= my && x < mx + MM_W && y < my + MM_H;
  const dot = (x, y, c, s) => { const q = P(x, y); if (inMM(q)){ g.fillStyle = c; g.fillRect(q[0], q[1], s || 1, s || 1); } };
  g.fillStyle = 'rgba(236,210,122,.75)';
  const [vx, vy] = P(cam.x, cam.y), vw = W / MM_S | 0, vh = H / MM_S | 0;
  g.fillRect(vx, vy, vw, 1); g.fillRect(vx, vy + vh, vw, 1); g.fillRect(vx, vy, 1, vh); g.fillRect(vx + vw, vy, 1, vh + 1);
  for (const a of G.loot) if (a.t === 'item') dot(a.x, a.y, RARITY[a.it.r].c);
  for (const m of G.mons){ const boss = MON[m.k].boss; dot(m.x, m.y, boss ? '#ffe27a' : m.mode === 'fight' ? '#ff3b3b' : '#a83a3a', boss ? 2 : 1); }
  for (const n of NPCS) dot(n.x, n.y, npcMark(n) ? '#ffd541' : '#7fe08a', 2);
  const stm = stTarget(); if (stm && (G.t * 2 | 0) % 2) dot(stm.x - MM_S, stm.y - MM_S, '#ffe27a', 3);
  for (const inn of INNS) dot(inn.dx, inn.y, '#ff9a40', 2);
  for (const p of PEERS.values()){ const at = peerAt(p); dot(at ? at.x : p.x, at ? at.y + 4 : p.y, inParty(p) ? '#7fe08a' : '#9cc8ff', 2); }
  const es = evMark2(); if (es && (G.t * 3 | 0) % 2){ const q = P(es.x, es.y); if (inMM(q)){ g.fillStyle = '#ff4030'; g.fillRect(q[0] - 1, q[1] - 2, 3, 3); g.fillStyle = OUT; g.fillRect(q[0] - 2, q[1] - 3, 1, 5); } }
  const q = P(k.x, k.y); g.fillStyle = '#ffffff'; g.fillRect(q[0] - 1, q[1] - 1, 3, 3); g.fillStyle = OUT; g.fillRect(q[0], q[1], 1, 1);
}
