"use strict";
/* Der Apfelritter, Teil 14 von 25: Tjost, Gewölbe, Feste im Jahreslauf.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Turnier: Tjost auf der Wiese vor der Reichsstadt ============
   Drei Durchgänge an der Schranke. Kurz vor dem Zusammenprall wandert das Ziel über den Gegner:
   mit Hieb die Lanze senken. Helm 2 Punkte, Schild 1 Punkt, aus dem Sattel heben gewinnt sofort. */
const JOUST_FOES = [
  { id:'konrad', name:'Junker Konrad von Lindach', short:'Konrad', lvl: 4, f:'reich', look:'11111', stake: 10, prize: 35, trophy: { name:'Turnierkranz', r: 2 }, osc: 1.5,
    say:'Ein junger Herr aus dem Dorf unter der Burg. Er reitet tapfer, aber noch ungestüm.' },
  { id:'bayard', name:'Chevalier Bayard', short:'Bayard', lvl: 10, f:'frankreich', look:'22232', stake: 40, prize: 140, trophy: { name:'Silberner Sporn', r: 3 }, osc: 2.1,
    say:'Pierre Terrail, Herr von Bayard, der Ritter ohne Furcht und Tadel. Er hat bei Marignano gefochten.' },
  { id:'goetz', name:'Götz von Berlichingen', short:'Götz', lvl: 16, f:'reich', look:'33343', stake: 120, prize: 420, trophy: { name:'Goldene Kette des Turniers', r: 4 }, osc: 2.8,
    say:'Der fränkische Reichsritter mit der eisernen Hand. Grob, gefürchtet und kaum je aus dem Sattel zu heben.' }
];
const LISTS = (() => { const p = GPROPS.find(q => q.kind === 'schranke'); return p ? { x: p.x, y: p.y } : null; })();
const JOUST_AIM = 430;   // Abstand, ab dem das Ziel wandert und die Lanze gesenkt werden kann
const JOUST_ZONES = [['daneben', -1, -.62], ['Schild', -.62, .3], ['Helm', .3, .62], ['daneben', .62, 1.01]];
function startJoust(foe){
  if (!LISTS || G.joust || !canAct()) return;
  if (HERO.gold < foe.stake){ logLine('Das Startgeld beträgt ' + foe.stake + ' Gulden.', '#d8c69c'); return; }
  HERO.gold -= foe.stake; updateHud();
  G.joust = { foe, pass: 0, me: 0, op: 0, st: 'intro', t: 1.8, cx: LISTS.x, cy: LISTS.y - 60, cheer: 0, parts: [], text: '', textT: 0, fallen: null };
  HERO.riding = false; renderSkills(); G.near = null; $('btnTalk').hidden = true; $('log').style.visibility = 'hidden';
  for (const s of LIFE_SPOTS) if (s.crowd){ s.act = true; s.ents = []; lifeMake(s, true); }
  showBanner('Tjost', HERO.name + ' gegen ' + foe.name);
  Sound.horn(); Sound.cheer(.8);
  joustPass();
  G.joust.st = 'intro'; G.joust.t = 2.2;
  markDirty(true);
}
function joustPass(){
  const J = G.joust, half = Math.min(300, W / 2 - 44);
  J.pass++; J.dir = (J.pass % 2 ? 1 : -1) * (J.pvp ? J.pvp.side : 1);
  J.px = LISTS.x - half * J.dir; J.ox = LISTS.x + half * J.dir; J.sp = 0;
  const north = J.pvp && J.pvp.side < 0;   // gegen einen Ritter: wer annimmt, reitet die nördliche Bahn
  J.py = LISTS.y + (north ? -18 : 26); J.oy = LISTS.y + (north ? 26 : -18);
  J.lock = null; J.ph = Math.random() * 6; J.held = true; J.resolved = false; J.st = 'ready'; J.t = 1.1; J.anim = 0;
}
function updateJoust(dt){
  const J = G.joust, k = G.knight;
  if (J.pvp && !duelTick(J)) return;
  J.t -= dt; J.anim += dt * (J.sp / 18 + 1); if (J.cheer > 0) J.cheer -= dt; if (J.textT > 0) J.textT -= dt;
  for (let i = J.parts.length - 1; i >= 0; i--){ const p = J.parts[i]; p.life -= dt; p.vy += 220 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) J.parts.splice(i, 1); }
  if (J.fallen){ J.fallen.t += dt; }
  const press = atkHeld || atkBtn, edge = press && !J.held; J.held = press;
  k.x = J.px; k.y = J.py; k.dir = J.dir > 0 ? 'right' : 'left'; k.moving = J.sp > 10;
  if (J.st === 'intro'){ if (J.t <= 0){ J.st = 'ready'; J.t = .6; } return; }
  if (J.st === 'ready'){ if (J.pvp) J.pvp.r = J.pass; if (J.t <= 0 && (!J.pvp || duelReady(J))){ J.st = 'charge'; Sound.horn(); } return; }
  if (J.st === 'charge' || J.st === 'after'){
    J.sp = Math.min(230, J.sp + 200 * dt) * (J.st === 'after' ? Math.pow(.25, dt) : 1);
    J.px += J.sp * J.dir * dt; J.ox -= J.sp * J.dir * dt;
    J.hoof = (J.hoof || 0) - dt; if (J.hoof <= 0 && J.sp > 30){ J.hoof = 2.6 / Math.max(30, J.sp); Sound.hoof(); }
    const gap = (J.ox - J.px) * J.dir;
    if (J.st === 'charge'){
      J.ph += dt * J.foe.osc * 2.4;
      if (gap < JOUST_AIM && J.lock === null && edge){ J.lock = Math.sin(J.ph); Sound.swing(); }
      if (gap <= 0 && !J.resolved){ J.resolved = true; if (J.pvp) duelLock(J); else joustImpact(); }
    } else if (J.waitRes){
      const v = duelPeerLock(J);
      if (v !== null || nowS() - J.waitRes > 6){ J.waitRes = 0; duelImpact(J, v === null ? -9 : v); }
    } else if (J.t <= 0){
      if (J.over) return joustEnd();
      joustPass();
    }
  }
}
function joustZone(u){ for (const z of JOUST_ZONES) if (u >= z[1] && u < z[2]) return z[0]; return 'daneben'; }
function joustImpact(){
  const J = G.joust, f = J.foe, d = HERO.lvl - f.lvl;
  const myZone = J.lock === null ? 'zu spät' : joustZone(J.lock);
  let my = 0, op = 0, iFall = false, oFall = false;
  if (myZone === 'Helm' || myZone === 'Schild'){
    if (Math.random() < clamp(.74 + d * .04, .3, .96)){
      my = myZone === 'Helm' ? 2 : 1;
      if (Math.random() < clamp((myZone === 'Helm' ? .28 : .09) + d * .02, .02, .5)) oFall = true;
    } else J.glance = true;
  }
  const oHit = Math.random() < clamp(.6 - d * .05 - ST.block / 250, .15, .92), oHelm = Math.random() < .3;
  if (oHit){ op = oHelm ? 2 : 1; if (Math.random() < clamp((oHelm ? .22 : .08) * (1 - ST.mit) * (1 - d * .05), .01, .45)) iFall = true; }
  J.me += my; J.op += op;
  const hitX = J.ox, hy = (J.py + J.oy) / 2 - 40;
  if (my || op){ for (let i = 0; i < 18; i++) J.parts.push({ x: hitX + rand(-8, 8), y: hy + rand(-10, 10), vx: rand(-90, 90), vy: rand(-120, -20), life: rand(.5, 1), c: Math.random() < .5 ? '#e8d8b0' : '#b08a5a' }); G.shake = .35; Sound.hit(); Sound.parry(); J.cheer = 2; Sound.cheer(1); }
  else Sound.swing();
  const parts = [];
  parts.push(myZone === 'zu spät' ? 'Zu spät!' : my ? myZone + '! +' + my : J.glance ? 'Abgeglitten' : 'Daneben');
  if (op) parts.push(f.short + ' trifft' + (oHelm ? ' den Helm' : '') + ' +' + op);
  if (oFall){ parts.push(f.short + ' fällt!'); J.fallen = { who: 'op', x: J.ox, y: J.oy, t: 0, dir: -J.dir }; }
  if (iFall){ parts.push('Ihr fallt!'); J.fallen = { who: 'me', x: J.px, y: J.py, t: 0, dir: J.dir }; }
  // Rufe von der Tribüne
  const crowd = [];
  for (const s of LIFE_SPOTS) if (s.crowd) for (const e of s.ents) crowd.push(e);
  for (let i = 0; i < 3 && crowd.length && (my || op || oFall || iFall); i++){
    const e = crowd.splice(Math.random() * crowd.length | 0, 1)[0];
    e.say = pick(oFall || iFall ? ['Aus dem Sattel!', 'Er fällt!', 'Hoho!', 'Heiliger Georg!'] : my ? ['Bravo!', 'Treffer!', 'Gut gestoßen!', 'Hurra!'] : ['Oh weh!', 'Haltet Euch!', 'Ach!']);
    e.sayUntil = nowS() + 1.6 + i * .3;
  }
  J.text = parts.join(',  '); J.textT = 2.4;
  J.over = oFall || iFall || (J.pass >= 3 && J.me !== J.op) || J.pass >= 5;
  J.st = 'after'; J.t = 1.9;
  if (oFall && !iFall) J.win = true; else if (iFall && !oFall) J.win = false; else if (J.over) J.win = J.me > J.op;
}
function joustEnd(){
  if (G.joust.pvp) return duelEnd(G.joust);
  const J = G.joust, f = J.foe, k = G.knight;
  G.joust = null; $('log').style.visibility = '';
  const herold = NPCS.find(n => n.id === 'herold');
  if (herold){ k.x = herold.x + 30; k.y = herold.y + 10; k.dir = 'left'; if (!gOk(k.x, k.y)){ k.x = herold.x; k.y = herold.y + 26; } }
  HERO.joust = HERO.joust || { wins: 0, beat: {} };
  if (J.win){
    HERO.gold += f.prize; HERO.joust.wins++; lwAdd(5); ehCount('joust');
    const xp = Math.round(xpNeed(HERO.lvl) * .12 + f.lvl * 6); gainXp(xp);
    let extra = '';
    if (!HERO.joust.beat[f.id]){
      HERO.joust.beat[f.id] = true;
      const it = makeItem('kleinod', f.lvl + 4, f.trophy.r, { name: f.trophy.name });
      const i = HERO.inv.indexOf(null);
      if (i >= 0){ HERO.inv[i] = it; extra = ' und ' + f.trophy.name; } else extra = ' (der Rucksack ist voll, der Preis verfällt)';
    }
    showBanner('Sieg im Tjost', J.me + ' : ' + J.op + ' gegen ' + f.short);
    logLine('Ihr besiegt ' + f.name + ' im Tjost: ' + f.prize + ' Gulden, ' + xp + ' EP' + extra + '.', '#ffd98a');
    Sound.levelUp();
  } else {
    showBanner(J.me === J.op ? 'Unentschieden' : 'Niederlage im Tjost', J.me + ' : ' + J.op + ' gegen ' + f.short);
    logLine(J.me === J.op ? 'Gleichstand nach fünf Durchgängen. Das Startgeld behält der Herold.' : f.name + ' bleibt Sieger. Übt weiter und kommt wieder.', '#d8c69c');
  }
  updateHud(); markDirty(true); sendPresence(true);
}
/* ---------- Zeichnen ---------- */
function joustLance(x0, y0, x1, y1, fid){
  const C = LANCE_COL[fid] || LANCE_COL.reich, n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= n; i++){ const t = i / n; ctx.fillStyle = OUT; ctx.fillRect(Math.round(x0 + (x1 - x0) * t - 1), Math.round(y0 + (y1 - y0) * t - 1), t > .9 ? 2 : 3, t > .9 ? 2 : 3); }
  for (let i = 0; i <= n; i++){ const t = i / n; ctx.fillStyle = t > .94 ? '#c8ccd2' : (Math.floor(i / 6) & 1) ? C[1] : C[0]; ctx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), t > .9 ? 1 : 2, t > .9 ? 1 : 2); }
  const bx = x0 + (x1 - x0) * .14, by = y0 + (y1 - y0) * .14;
  ctx.fillStyle = OUT; ctx.fillRect(Math.round(bx - 3), Math.round(by - 3), 7, 7); ctx.fillStyle = '#9aa2ac'; ctx.fillRect(Math.round(bx - 2), Math.round(by - 2), 5, 5);
}
function drawJoustRider(who){
  const J = G.joust, me = who === 'me', x = me ? J.px : J.ox, y = me ? J.py : J.oy, dir = (me ? J.dir : -J.dir) > 0 ? 'right' : 'left';
  const set = me ? ownSet() : knightSet(J.foe.f, J.foe.look), fid = me ? HERO.f : J.foe.f;
  const f = J.sp > 10 ? (J.anim | 0) % 4 : 4, fallen = J.fallen && J.fallen.who === who;
  if (fallen){
    const hs = horseSet('streitross', set.key)[dir][f];
    ctx.drawImage(hs.under, Math.round(x - hs.ax - 1), Math.round(y - HO_GY - 1));
    const F = J.fallen, fr = (set.fall || KNIGHT_FALL)[F.dir > 0 ? 'right' : 'left'][Math.min(3, Math.floor(F.t * 6))], fy = Math.min(F.t * 120, 40);
    ctx.drawImage(fr.img, Math.round(F.x - fr.ox), Math.round(F.y - 46 + fy - fr.oy));
    return;
  }
  const sx = dir === 'right' ? 1 : -1, other = me ? { x: J.ox, y: J.oy } : { x: J.px, y: J.py }, gap = Math.abs(other.x - x);
  // Lanze: aufrecht beim Warten, eingelegt im Ansturm, über die Schranke auf den Gegner gerichtet
  let tx, ty;
  if (J.st === 'charge' || J.st === 'after'){ const aimY = me ? -46 : -38; tx = x + sx * 62; ty = y - 34 + (other.y - y + aimY + 34) * clamp(1 - gap / 420, .25, 1); }
  else { tx = x + sx * 8; ty = y - 92; }
  if (me) drawMounted(ctx, 'streitross', set.key, dir, x, y, f);
  joustLance(x - sx * 12, y - 36, tx, ty, fid);
  if (!me) drawMounted(ctx, 'streitross', set.key, dir, x, y, f);
}
function renderJoust(){
  const J = G.joust, k = G.knight;
  const cam = { x: Math.round(clamp(J.cx - W / 2, 0, GW - W)), y: Math.round(clamp(J.cy - H / 2, 0, GH - H)) };
  const sh = G.shake > 0 && !RM ? 2 : 0, sx = sh ? Math.round(rand(-sh, sh)) : 0, sy = sh ? Math.round(rand(-sh, sh)) : 0;
  ctx.setTransform(1, 0, 0, 1, sx, sy);
  drawGround(ctx, cam.x, cam.y);
  ctx.setTransform(1, 0, 0, 1, sx - cam.x, sy - cam.y);
  shadow(J.px, J.py - 1, 44, .4); shadow(J.ox, J.oy - 1, 44, .4);
  const list = [];
  for (const p of propsInView(cam)) list.push({ y: p.y, d: () => drawProp(p) });
  for (const e of lifeEnts(cam, [])) list.push({ y: (e.sy || e.y) + .05, d: () => drawLife(e) });
  for (const n of NPCS) if (inView(n.x, n.y, cam)) list.push({ y: n.y + .15, d: () => drawNpc(n) });
  list.push({ y: J.oy + .2, d: () => drawJoustRider('op') }, { y: J.py + .2, d: () => drawJoustRider('me') });
  list.sort((a, b) => a.y - b.y);
  for (const it of list) it.d();
  for (const p of J.parts){ ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawSkyLight(cam);
  ctx.drawImage(gradeTex, 0, 0);
  ctx.setTransform(1, 0, 0, 1, sx - cam.x, sy - cam.y);
  for (const f of GFIRES) if (inView(f.x, f.y, cam)) flameHD(f.x, f.y, G.t + f.x * .01, f.big);
  for (const p of G.parts){ if (!p.glow) continue; ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, 1, 1); }
  drawSpeech(cam);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawRain(); drawBolt();
  // Anzeige: Gegner, Durchgang, Punkte
  const head = 'Tjost: ' + HERO.name + ' gegen ' + J.foe.short, sc = 'Durchgang ' + Math.max(1, J.pass) + (J.pass > 3 ? ' (Stechen)' : ' von 3') + ',  ' + J.me + ' : ' + J.op;
  ctx.fillStyle = 'rgba(16,14,20,.62)'; ctx.fillRect(W / 2 - 150, 6, 300, 34);
  drawText(head, W / 2, 9, '#ffd98a'); drawText(sc, W / 2, 24, '#ffffff');
  if (J.st === 'intro' || J.st === 'ready') drawText(J.st === 'intro' ? 'Die Trompete ruft!' : 'Anreiten!', W / 2, H * .62, '#ffd98a', 'c', 1.5);
  // Ziel: wandernde Marke über dem Gegner, Leiste rechts
  if (J.st === 'charge'){
    const gap = (J.ox - J.px) * J.dir;
    if (gap < JOUST_AIM){
      const u = J.lock !== null ? J.lock : Math.sin(J.ph), bx = W - 40, by = H / 2 - 70, bh = 140;
      ctx.fillStyle = OUT; ctx.fillRect(bx - 2, by - 2, 18, bh + 4);
      for (const [nm, a, b] of JOUST_ZONES){ ctx.fillStyle = nm === 'Helm' ? '#d8a830' : nm === 'Schild' ? '#5a9a4a' : '#4a4650'; ctx.fillRect(bx, Math.round(by + (1 - b) / 2 * bh), 14, Math.ceil((b - a) / 2 * bh)); }
      const my = Math.round(by + (1 - u) / 2 * bh);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx - 6, my - 1, 26, 3); ctx.fillStyle = OUT; ctx.fillRect(bx - 8, my - 2, 2, 5);
      drawText('Helm', bx - 10, Math.round(by + (1 - .46) / 2 * bh) - 6, '#ffd98a', 'r'); drawText('Schild', bx - 10, Math.round(by + (1 + .16) / 2 * bh) - 6, '#9fe08a', 'r');
      // Marke am Gegner
      const ox = J.ox - cam.x, oy = J.oy - cam.y - 42 - u * 20;
      ctx.fillStyle = J.lock !== null ? '#ffd541' : '#ffffff';
      ctx.fillRect(Math.round(ox) - 6, Math.round(oy), 4, 1); ctx.fillRect(Math.round(ox) + 3, Math.round(oy), 4, 1); ctx.fillRect(Math.round(ox), Math.round(oy) - 6, 1, 4); ctx.fillRect(Math.round(ox), Math.round(oy) + 3, 1, 4);
      if (J.lock === null) drawText(touchUI() ? 'Hieb: Lanze senken!' : 'Leertaste: Lanze senken!', W / 2, H * .66, '#ffffff', 'c', 1.5);
    }
  }
  if (J.textT > 0) drawText(J.text, W / 2, H * .3, '#ffffff', 'c', 1.5);
  if (G.flash > 0 && !RM){ ctx.fillStyle = 'rgba(220,226,255,' + Math.min(.45, G.flash * .9).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
}

/* ============ Gewölbe: Keller unter der Ruine, Krypta im Kloster ============
   Eigene Karte aus Räumen und Gängen (Felder zu 32 Feinpixeln) an einem festen Ort außerhalb der Wege.
   Beim Hinabsteigen werden Monster, Beute und Geschosse der Welt beiseitegelegt; im Gewölbe gelten
   eigene Hindernisse (blocked, gRandWalk, camOf schauen auf DG_ON). Nach Süden zeigende Wände haben
   eine Mauerseite, alle anderen sind dunkle Kappen. Am Ende wacht ein Anführer über eine Truhe,
   die sich einmal am Tag füllt. */
const DG_T = 32, DG_FH = 40, DG_PAD = 96, DG_OX = 256, DG_OY = 320;
const DG_DEF = {
  keller: { name:'Keller unter der Ruine', lvl:[15, 18], cols:44, rows:30, style: 0, dark: .9, seed: 4401,
    rooms:[[3, 3, 8, 6, 'entry'], [15, 2, 12, 8, 'store'], [31, 3, 10, 8, 'guard'], [3, 14, 10, 9, 'cells'], [16, 14, 13, 10, 'hall'], [32, 16, 9, 10, 'vault']],
    links:[[0, 1], [1, 2], [0, 3], [1, 4], [3, 4], [2, 5], [4, 5]],
    mobs:{ store:[['ratte', 2], ['pluend', 1]], guard:[['armbrust', 2], ['pluend', 1]], cells:[['ratte', 3]], hall:[['pluend', 2], ['armbrust', 1]], vault:[['pluend', 2]] },
    elite:{ k:'pluend', name:'Kellermeister Hartmut' }, chest:'die Schatztruhe des Raubritters', chestN:'die Schatztruhe des Raubritters' },
  krypta: { name:'Krypta im Kloster', lvl:[6, 9], cols:42, rows:32, style: 1, dark: .88, seed: 4402,
    rooms:[[17, 2, 8, 6, 'entry'], [14, 11, 14, 9, 'nave'], [2, 12, 9, 8, 'ossuary'], [31, 12, 9, 8, 'chapel'], [3, 23, 11, 7, 'crypt'], [18, 23, 12, 7, 'vault']],
    links:[[0, 1], [1, 2], [1, 3], [2, 4], [1, 5], [4, 5], [3, 5]],
    mobs:{ nave:[['wieder', 3]], ossuary:[['wieder', 2], ['ratte', 2]], chapel:[['irrlicht', 2]], crypt:[['wieder', 3]], vault:[['irrlicht', 2]] },
    elite:{ k:'wieder', name:'Der bleiche Abt' }, chest:'den Kirchenschatz der Krypta', chestN:'der Kirchenschatz der Krypta' },
  /* Gruppen-Gewölbe: jedes Fallgitter öffnet sich nur, wenn die beiden Hebel in den Seitenstollen zugleich gezogen sind */
  bergwerk: { name:'Das verlassene Bergwerk', group: true, lvl:[0, 2], cols:46, rows:46, style: 2, dark: .92, seed: 4403,
    rooms:[[19, 2, 8, 6, 'entry'], [14, 11, 18, 8, 'grube'], [3, 12, 8, 7, 'stollen'], [36, 12, 8, 7, 'stollen'], [17, 24, 12, 8, 'grube'], [3, 25, 8, 7, 'stollen'], [36, 25, 8, 7, 'stollen'], [13, 36, 20, 9, 'vault']],
    links:[[0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [4, 6], [4, 7]],
    gates:[{ a: 1, row: 21 }, { a: 4, row: 33 }],
    levers:[{ room: 2, gate: 0 }, { room: 3, gate: 0 }, { room: 5, gate: 1 }, { room: 6, gate: 1 }],
    mobs:{ grube:[['wieder', 3], ['ratte', 2]], stollen:[['wieder', 2], ['irrlicht', 1]], vault:[['ratte', 2]] },
    names:{ wieder:'Toter Bergknappe', irrlicht:'Grubenlicht', ratte:'Grubenratte' },
    elite:{ k:'lindwurm', name:'Der Bergdrache', grp: true }, chest:'den Schatz der Bergleute', chestN:'der Schatz der Bergleute' }
};
/* Gruppen-Gewölbe für vier Ritter: die versunkene Zollburg unter dem Zollturm. Zwei Fallgitter öffnen Schleusenräder, die zwei Ritter
   zugleich drehen; im Thronsaal setzt der Nöck den Saal zweimal unter Wasser, dann müssen zwei Ritter die Schieber an der Nordwand
   zugleich öffnen, während die anderen den Flutwellen ausweichen. */
DG_DEF.zollburg = { name:'Die versunkene Zollburg', group: true, zb: true, base:[17, 19], lvl:[1, 2], cols:50, rows:50, style: 3, dark: .9, seed: 4404, lever:'rad',
  rooms:[[21, 2, 8, 6, 'entry'], [15, 11, 20, 9, 'halle'], [3, 12, 9, 7, 'schleuse'], [38, 12, 9, 7, 'schleuse'], [17, 24, 16, 8, 'zoll'], [3, 25, 9, 7, 'schleuse'], [38, 25, 9, 7, 'schleuse'], [11, 36, 28, 12, 'vault']],
  links:[[0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [4, 6], [4, 7]],
  gates:[{ a: 1, row: 21 }, { a: 4, row: 33 }, { flood: 1 }, { flood: 2 }],
  levers:[{ room: 2, gate: 0 }, { room: 3, gate: 0 }, { room: 5, gate: 1 }, { room: 6, gate: 1 }, { room: 7, gate: 2, dx: -11 }, { room: 7, gate: 2, dx: 11 }, { room: 7, gate: 3, dx: -7 }, { room: 7, gate: 3, dx: 7 }],
  mobs:{ halle:[['nix', 3], ['pirat', 2]], schleuse:[['nix', 2], ['pschuetze', 1]], zoll:[['pirat', 3], ['pschuetze', 2]], vault:[] },
  names:{ nix:'Wassergeist', pirat:'Versunkener Zollknecht', pschuetze:'Versunkener Armbruster' },
  elite:{ k:'noeck', name:'Der Nöck', grp: true }, chest:'den Zollschatz der versunkenen Burg', chestN:'der Zollschatz der versunkenen Burg',
  slain:'der Nöck ist heute schon bezwungen', hort:'Dahinter liegt der Thronsaal des Nöck',
  intro:'Die Zollburg ist für vier Ritter gebaut: Jedes Fallgitter hebt sich nur, wenn zwei Ritter die Schleusenräder in den Seitenkammern zugleich drehen. Im Thronsaal wartet der Nöck.' };
UNIQUES.noeck = { s:'helm', n:'Die Krone des Nöck', aff:['hp', 'arm', 'crit'] };
UNIQUE_ICON.noeck = bi_icon(['................', '................', '..j....j....j...', '..ij..jij..ji...', '..iij.iii.jii...', '..iiijiiijiii...', '..iiiiiiiiiii...', '..hihVihuhiVh...',
  '..hhhhhhhhhhh...', '..ggggggggggg...', '...v.v.....v....', '...V.v.....V....', '.....V..........', '................', '................', '................']);
const DG_CACHE = {};
const dgGet = id => DG_CACHE[id] || (DG_CACHE[id] = dgBuild(id));
/* Karte, Einrichtung, Monsterplätze */
function dgBuild(id){
  const D = DG_DEF[id], C = D.cols, Rn = D.rows, R = rng(D.seed);
  const g = new Uint8Array(C * Rn).fill(1), blk = new Uint8Array(C * Rn), corr = new Uint8Array(C * Rn);
  const at = (x, y) => x < 0 || y < 0 || x >= C || y >= Rn ? 1 : g[y * C + x];
  const set = (x, y, v, c) => { if (x > 0 && y > 0 && x < C - 1 && y < Rn - 1){ if (c && g[y * C + x]) corr[y * C + x] = 1; g[y * C + x] = v; } };   // Gang nur außerhalb der Räume
  for (const [x, y, w, h] of D.rooms) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, 0);
  const cen = r => [Math.floor(r[0] + r[2] / 2), Math.floor(r[1] + r[3] / 2)];
  for (const [a, b] of D.links){
    const [ax, ay] = cen(D.rooms[a]), [bx, by] = cen(D.rooms[b]);
    const H = (y, x0, x1) => { for (let i = Math.min(x0, x1); i <= Math.max(x0, x1) + 1; i++){ set(i, y, 0, 1); set(i, y + 1, 0, 1); } };
    const V = (x, y0, y1) => { for (let j = Math.min(y0, y1); j <= Math.max(y0, y1) + 1; j++){ set(x, j, 0, 1); set(x + 1, j, 0, 1); } };
    if ((a + b) % 2) { V(ax, ay, by); H(by, ax, bx); } else { H(ay, ax, bx); V(bx, ay, by); }
  }
  const T = DG_T, X = i => DG_OX + i * T, Y = j => DG_OY + j * T;
  const entry = D.rooms[0], sx = entry[0] + (entry[2] >> 1), sy = entry[1];
  const reach = () => {   // alle freien Felder vom Eingang aus erreichbar?
    const seen = new Uint8Array(C * Rn), q = [sy * C + sx]; seen[q[0]] = 1; let n = 0;
    while (q.length){ const i = q.pop(); n++; for (const d of [1, -1, C, -C]){ const j = i + d; if (!seen[j] && !g[j] && !blk[j]){ seen[j] = 1; q.push(j); } } }
    let free = 0; for (let i = 0; i < C * Rn; i++) if (!g[i] && !blk[i]) free++;
    return n === free;
  };
  const objs = [], decals = [], spawns = [], torches = [], lights = [], levers = [];
  const place = (kind, v, tx, ty, w, opt) => {
    for (let i = 0; i < w; i++){ const k = ty * C + tx + i; if (at(tx + i, ty) || blk[k] || corr[k] || (Math.abs(tx + i - sx) < 2 && ty - sy < 3)) return null; }
    for (let i = 0; i < w; i++) blk[ty * C + tx + i] = 1;
    if (!reach()){ for (let i = 0; i < w; i++) blk[ty * C + tx + i] = 0; return null; }
    const P = wp_paintV(kind, v, 1), o = Object.assign({ kind, v, tx, ty, w, x: X(tx) + w * T / 2, y: Y(ty + 1) - 4, img: P.img, ax: P.ax * WS, ay: P.ay * WS }, opt || {});
    objs.push(o); return o;
  };
  const inRoom = (r, f) => { const out = []; for (let j = r[1]; j < r[1] + r[3]; j++) for (let i = r[0]; i < r[0] + r[2]; i++) if (f(i, j)) out.push([i, j]); return out; };
  const wallSide = r => inRoom(r, (i, j) => i === r[0] || i === r[0] + r[2] - 1 || j === r[1] || j === r[1] + r[3] - 1);
  const pickN = (arr, n) => { const a = arr.slice(), o = []; while (a.length && o.length < n) o.push(a.splice((R() * a.length) | 0, 1)[0]); return o; };
  let chest = null;
  for (const r of D.rooms){
    const role = r[4], cx = r[0] + (r[2] >> 1), cy = r[1] + (r[3] >> 1), side = wallSide(r);
    const tryAll = (kind, v, list, n, w) => { let k = 0; for (const [i, j] of pickN(list, list.length)){ if (k >= n) break; if (place(kind, v, i, j, w || 1)) k++; } };
    if (role === 'store'){ tryAll('fass', 0, side, 5); tryAll('kisten', 0, side, 3); tryAll('weinfass', 0, side, 3, 2); }
    if (role === 'guard'){ place('becken', 0, cx, cy, 1, { fire: true }); tryAll('kisten', 0, side, 2); tryAll('fass', 0, side, 2); }
    if (role === 'cells' || role === 'hall' || role === 'nave'){
      for (let j = r[1] + 2; j < r[1] + r[3] - 2; j += 3) for (const i of [r[0] + 2, r[0] + r[2] - 3]) place('saeule', D.style, i, j, 1);
    }
    if (role === 'hall'){ place('becken', 0, cx - 1, cy, 1, { fire: true }); place('becken', 0, cx + 1, cy, 1, { fire: true }); tryAll('kisten', 0, side, 2); }
    if (role === 'nave'){ for (let j = r[1] + 2; j < r[1] + r[3] - 1; j += 3) place('sarg', (j >> 1) & 1, cx - 1, j, 2); }
    if (role === 'ossuary' || role === 'chapel') tryAll('sarg', 1, side, 1, 2);
    if (role === 'chapel'){ place('becken', 0, cx - 2, r[1] + 1, 1, { fire: true }); place('becken', 0, cx + 2, r[1] + 1, 1, { fire: true }); }
    if (role === 'crypt'){ for (let j = r[1] + 1; j < r[1] + r[3] - 1; j += 2) for (const i of [r[0] + 2, r[0] + r[2] - 4]) place('sarg', (i + j) & 1, i, j, 2); }
    if (role === 'vault' && D.style === 3){   // Thronsaal des Nöck: Thron an der Südwand, Säulen, Zollschatz daneben
      place('thron', 0, cx - 1, r[1] + r[3] - 3, 3);
      for (const dx of [5, -5, 6, -6, 7, -7]){ chest = place('truhe', 0, cx + dx, r[1] + r[3] - 3, 1, { chest: true }); if (chest) break; }
      for (const i of [r[0] + 2, r[0] + r[2] - 3]) for (let j = r[1] + 3; j < r[1] + r[3] - 1; j += 4) place('saeule', 1, i, j, 1);
      place('becken', 0, cx - 4, r[1] + r[3] - 4, 1, { fire: true }); place('becken', 0, cx + 4, r[1] + r[3] - 4, 1, { fire: true });
    } else if (role === 'vault'){
      for (const dx of [0, 1, -1, 2, -2, 3, -3]){ chest = place('truhe', 0, cx + dx, r[1] + 1, 1, { chest: true }); if (chest) break; }
      place('becken', 0, cx - 2, r[1] + 1, 1, { fire: true }); place('becken', 0, cx + 2, r[1] + 1, 1, { fire: true });
      if (D.style === 1) tryAll('sarg', 0, side, 1, 2); else tryAll('kisten', 0, side, 2);
      if (D.style === 2) tryAll('erz', 1, side, 3);
    }
    if (role === 'grube'){ place('becken', 0, cx, cy, 1, { fire: true }); tryAll('lore', 0, side, 2); tryAll('erz', 0, side, 3); tryAll('erz', 1, side, 1); tryAll('kisten', 0, side, 2); tryAll('fass', 0, side, 2); }
    if (role === 'halle'){ for (let j = r[1] + 2; j < r[1] + r[3] - 2; j += 3) for (const i of [r[0] + 3, r[0] + r[2] - 4]) place('saeule', 0, i, j, 1); tryAll('anker', 0, side, 1, 2); tryAll('fass', 0, side, 3); tryAll('kisten', 0, side, 2); }
    if (role === 'schleuse'){ tryAll('fass', 0, side, 2); tryAll('kisten', 0, side, 1); place('becken', 0, cx, cy + 1, 1, { fire: true }); }
    if (role === 'zoll'){ place('becken', 0, cx - 3, cy, 1, { fire: true }); place('becken', 0, cx + 3, cy, 1, { fire: true }); tryAll('kisten', 0, side, 4); tryAll('weinfass', 0, side, 2, 2); tryAll('fass', 0, side, 3); tryAll('anker', 0, side, 1, 2); }
    if (role === 'stollen'){ tryAll('erz', (cx + cy) & 1, side, 3); tryAll('lore', 1, side, 1); tryAll('fass', 0, side, 1); place('becken', 0, cx, cy + 1, 1, { fire: true }); }
    // Hebel an der Nordwand des Raums
    for (const [li, L] of (D.levers || []).entries()) if (D.rooms[L.room] === r)
      for (const dx of [0, 1, -1, 2, -2, 3, -3]){ const o = place(D.lever || 'hebel', 0, cx + (L.dx || 0) + dx, r[1], 1, { lever: li, gate: L.gate }); if (o){ levers[li] = { o, gate: L.gate }; break; } }
    // Bodenschmuck: Knochen, Schutt, Pfützen
    const nDec = role === 'ossuary' ? 14 : role === 'cells' || role === 'crypt' ? 7 : 3;
    for (const [i, j] of pickN(inRoom(r, (i, j) => !blk[j * C + i]), nDec)) decals.push([i, j, role === 'ossuary' || role === 'cells' || role === 'crypt' || R() < (D.style === 3 ? .15 : .4) ? 'bone' : (D.style === 0 || D.style === 3) && R() < .6 ? 'puddle' : 'rubble', R()]);
    // Monster
    const free = inRoom(r, (i, j) => !blk[j * C + i] && Math.hypot(i - sx, j - sy) > 6);
    for (const [kind, n] of (D.mobs[role] || [])) for (const [i, j] of pickN(free, n)) spawns.push([kind, X(i) + T / 2, Y(j) + T - 4, D.lvl[0] + ((R() * (D.lvl[1] - D.lvl[0] + 1)) | 0), null]);
    if (role === 'vault'){ const [i, j] = [cx, r[1] + (D.style === 3 ? 4 : 3)]; spawns.push([D.elite.k, X(i) + T / 2, Y(j) + T - 4, D.lvl[1] + 1, D.elite.name]); }
  }
  // Fallgitter mitten im Gang zwischen zwei Räumen (zwei Felder breit, zu Beginn geschlossen)
  const gates = (D.gates || []).map((gd, gi) => {
    if (gd.flood) return { tiles: [], o: null, flood: gd.flood, levers: levers.map((L, li) => L && L.gate === gi ? li : -1).filter(li => li >= 0), open: false };   // Schieber gegen die Flut
    const ra = D.rooms[gd.a], gx = ra[0] + (ra[2] >> 1), j = gd.row, P0 = wp_paintV('gitter', 0, 1), tiles = [j * C + gx, j * C + gx + 1];
    for (const t of tiles) blk[t] = 1;
    const o = { kind: 'gitter', v: 0, gate: gi, tx: gx, ty: j, w: 2, x: X(gx) + T, y: Y(j + 1) - 4, img: P0.img, ax: P0.ax * WS, ay: P0.ay * WS };
    objs.push(o);
    return { tiles, o, levers: levers.map((L, li) => L && L.gate === gi ? li : -1).filter(li => li >= 0), open: false };
  });
  // Fackeln an den Mauerseiten (Wand mit Boden darunter), etwa alle vier Felder
  for (let j = 1; j < Rn - 1; j++) for (let i = 1; i < C - 1; i++) if (at(i, j) && !at(i, j + 1) && (i * 7 + j * 3) % 4 === 0 && !(i === sx && j === sy - 1)) torches.push([X(i) + T / 2, Y(j + 1) - DG_FH * .62]);
  const out = { id, D, C, Rn, g, blk, sx, sy, objs, decals, spawns, torches, chest, gates, levers, seen: new Uint8Array(C * Rn),
    ox: DG_OX, oy: DG_OY, W: C * T, H: Rn * T, start: { x: X(sx) + T / 2, y: Y(sy) + T + 10 }, stair: { x: X(sx) + T / 2, y: Y(sy) + 6 } };
  dgPaint(out);
  return out;
}
/* Boden, dunkle Kappen und Mauerseiten vorab zeichnen */
function dgPaint(M){
  const { C, Rn, g, D } = M, T = DG_T, FH = DG_FH, P = DG_PAD, W = C * T + 2 * P, Hh = Rn * T + 2 * P, st = D.style;
  const wall = (i, j) => i < 0 || j < 0 || i >= C || j >= Rn ? true : !!g[j * C + i];
  const tall = (i, j) => wall(i, j) && !wall(i, j + 1);
  const pk = (h) => wo_c(h), FL = [['#2a2622', '#322d28', '#3a342e', '#433c35', '#4c443c', '#554c43'], ['#34343a', '#3c3c42', '#45454b', '#4e4e54', '#58585e', '#626268'], ['#26221d', '#2d2822', '#352f28', '#3d362e', '#463e35', '#50473c'], ['#1c2422', '#232c29', '#2a3431', '#323d39', '#3b4742', '#45524c']][st].map(pk);
  const MS = [['#332e28', '#3e3730', '#4a4239', '#554c42', '#61574b'], ['#3a3c42', '#44464c', '#4e5056', '#5a5c62', '#66686e'], ['#29251f', '#322d27', '#3c362f', '#463f37', '#514940'], ['#232c2a', '#2b3633', '#34403c', '#3e4b46', '#495752']][st].map(pk);
  const WTR = pk('#1a3e4e');
  const OAK = ['#1c1612', '#3d3024', '#4f3e2e', '#624e3a'].map(pk), ORE = pk('#93a6b4');
  const SEAM = pk(st ? '#222228' : '#1a1714'), CAP = pk('#131116'), RIM = pk('#29262d'), MOSS = pk('#34402c'), PUD = pk('#1a2026');
  // Boden
  const fc = canvasOf(W, Hh), fg = fc.getContext('2d'), id = fg.createImageData(W, Hh), d32 = new Uint32Array(id.data.buffer);
  d32.fill(CAP);
  for (let y = 0; y < Rn * T; y++) for (let x = 0; x < C * T; x++){
    const i = x >> 5, j = y >> 5; if (g[j * C + i]) continue;
    let c;
    if (st === 2){ // Bergwerk: gewachsener Fels mit Kies und Erzadern
      const v = wo_h(x >> 2, y >> 2, 81) * 1.5 + wo_h(x >> 3, y >> 3, 82) * 2.1 + wo_h(x >> 4, y >> 4, 83) * 1.6 - 1.1;
      c = FL[clamp(Math.floor(v), 0, 5)];
      if (wo_h(x >> 1, y >> 1, 84) < .02) c = FL[5];
      if (wo_h(x >> 1, y >> 1, 85) < .004) c = ORE;
    } else if (st === 1){ // Krypta: Platten 32 × 16, versetzt
      const row = y >> 4, ox = (row & 1) * 16, cell = ((x + ox) >> 5) * 7919 + row * 131, sx = (x + ox) & 31, sy = y & 15;
      const v = wo_h(cell, 3, 77) * 3.2 + wo_h(x >> 2, y >> 2, 78) * .9 + (sy === 0 || sx === 0 ? -9 : sy === 1 || sx === 1 ? .8 : 0);
      c = v < -5 ? SEAM : FL[clamp(Math.floor(v + 1), 0, 5)];
    } else { // Keller: unregelmäßige Steine 16 × 16 mit Fugen, Moos, Schmutz
      const row = y >> 4, ox = ((row * 5) & 15), cell = ((x + ox) >> 4) * 7919 + row * 131, sx = (x + ox) & 15, sy = y & 15;
      const v = wo_h(cell, 5, 71) * 3.4 + wo_h(x >> 1, y >> 1, 72) * 1.2 + (sy === 0 || sx === 0 ? -9 : 0);
      c = v < -5 ? SEAM : FL[clamp(Math.floor(v + .6), 0, 5)];
      if (c !== SEAM && wo_h(x >> 3, y >> 3, 73) < (st === 3 ? .14 : .06) && wo_h(x, y, 74) < .6) c = MOSS;
      if (st === 3){ const w = wo_h(x >> 4, y >> 4, 75) * .6 + wo_h(x >> 3, y >> 3, 76) * .4; if (w < .2) c = wo_mix(c, WTR, .6 - w * 2); }   // stehendes Wasser
    }
    // Schatten unter Mauerseiten und neben Wänden
    const ly = y & 31, lx = x & 31;
    if (tall(i, j - 1) && ly < 12) c = wo_mix(c, 0xff08060a, (12 - ly) / 12 * .6);
    if (wall(i - 1, j) && lx < 5) c = wo_mix(c, 0xff08060a, (5 - lx) / 5 * .4);
    if (wall(i + 1, j) && lx > 26) c = wo_mix(c, 0xff08060a, (lx - 26) / 5 * .35);
    d32[(y + P) * W + x + P] = c;
  }
  // flache Kappen: helle Kante zum Boden hin
  for (let j = 0; j < Rn; j++) for (let i = 0; i < C; i++){
    if (!g[j * C + i] || tall(i, j)) continue;
    const x0 = i * T + P, y0 = j * T + P;
    for (let k = 0; k < T; k++){
      if (!wall(i - 1, j)) for (let w = 0; w < 2; w++) d32[(y0 + k) * W + x0 + w] = RIM;
      if (!wall(i + 1, j)) for (let w = 0; w < 2; w++) d32[(y0 + k) * W + x0 + T - 1 - w] = RIM;
      if (!wall(i, j - 1)) for (let w = 0; w < 2; w++) d32[(y0 + w) * W + x0 + k] = RIM;
    }
  }
  // Bodenschmuck
  const dot = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < Hh) d32[y * W + x] = c; };
  const BONE = [pk('#d8d2bc'), pk('#b4ae98'), pk('#7a7464')];
  for (const [i, j, k, r] of M.decals){
    const x0 = i * T + P + 6 + ((r * 13) | 0), y0 = j * T + P + 8 + ((r * 11) | 0);
    if (k === 'bone'){ for (let t = 0; t < 10; t++){ dot(x0 + t, y0 + (t >> 2), BONE[t === 0 || t === 9 ? 0 : 1]); dot(x0 + t, y0 + 1 + (t >> 2), BONE[2]); } dot(x0 - 1, y0 - 1, BONE[0]); dot(x0 + 10, y0 + 3, BONE[0]); if (r > .5){ for (let a = 0; a < 6; a++) for (let b = 0; b < 5; b++) if ((a - 2.5) ** 2 / 9 + (b - 2) ** 2 / 6 < 1) dot(x0 + 12 + a, y0 - 4 + b, a === 1 && b === 2 || a === 4 && b === 2 ? BONE[2] : BONE[1]); } }
    else if (k === 'puddle'){ for (let a = -10; a <= 10; a++) for (let b = -5; b <= 5; b++) if (a * a / 100 + b * b / 25 < 1) dot(x0 + a + 4, y0 + b + 6, b === -3 && a > -4 && a < 3 ? pk('#3a4650') : PUD); }
    else for (let t = 0; t < 7; t++) dot(x0 + ((r * 97 * (t + 1)) % 18 | 0), y0 + ((r * 53 * (t + 2)) % 12 | 0), MS[1 + (t % 3)]);
  }
  fg.putImageData(id, 0, 0);
  M.floor = fc;
  // Mauerseiten (hohe Wände) als Abschnitte je Reihe, zum Sortieren nach y
  M.segs = [];
  for (let j = 0; j < Rn; j++){
    let i = 0;
    while (i < C){
      if (!tall(i, j)){ i++; continue; }
      let i1 = i; while (i1 + 1 < C && tall(i1 + 1, j)) i1++;
      const w = (i1 - i + 1) * T, c = canvasOf(w, T + FH), cg = c.getContext('2d'), sd = cg.createImageData(w, T + FH), s32 = new Uint32Array(sd.data.buffer);
      for (let y = 0; y < T + FH; y++) for (let x = 0; x < w; x++){
        const gx = i * T + x, gy = j * T - FH + y;   // Weltlage im Gewölbe
        let col;
        if (y < T){ col = y >= T - 2 ? RIM : CAP; }
        else {
          const fy = y - T, crs = fy >> 3, bo = (crs * 11) % 3 === 0 ? 0 : (crs & 1) * 9, bx = (gx + bo) % 20, brick = Math.floor((gx + bo) / 20) * 31 + crs * 17;
          const mortar = (fy & 7) === 0 || bx === 0, v = wo_h(brick, 9, 91) * 2.4 + wo_h(gx >> 1, gy >> 1, 92) * .8 - (fy > FH - 6 ? 1.6 : 0) + (fy < 3 ? .8 : 0);
          col = mortar ? SEAM : MS[clamp(Math.floor(v + .4), 0, 4)];
          if (st === 2){   // Fels statt Mauer, alle vier Felder ein Stempel, oben die Kappe
            const rv = wo_h(gx >> 2, gy >> 2, 94) * 2 + wo_h(gx >> 3, gy >> 3, 95) * 1.4 - (fy > FH - 6 ? 1.4 : 0) + (fy < 3 ? .7 : 0) - .5, px = gx % 128;
            col = MS[clamp(Math.floor(rv), 0, 4)];
            if (wo_h(gx >> 1, gy >> 1, 96) < .006) col = ORE;
            if (px < 7) col = px === 0 || px === 6 ? OAK[0] : px < 3 ? OAK[3] : OAK[2];
            else if (fy < 5) col = fy === 4 ? OAK[0] : fy < 2 ? OAK[3] : OAK[1];
          }
          if (!st && !mortar && wo_h(gx >> 2, crs, 93) < .08) col = wo_mix(col, 0xff1a2016, .35);       // Feuchtigkeit
          if (st === 3){   // Zollburg: Algen am Fuß, Wasserlinie, Rinnspuren
            if (!mortar && wo_h(gx >> 2, crs, 93) < .2) col = wo_mix(col, 0xff304826, .35);
            if (fy > FH - 13 + ((wo_h(gx >> 2, 0, 97) * 4) | 0)) col = wo_mix(col, 0xff2c4a24, .5);
            if (fy === FH - 14) col = wo_mix(col, 0xff6a8a7a, .3);
            if (wo_h(gx >> 1, 0, 98) < .05 && fy > 4) col = wo_mix(col, 0xff4a6a50, .3);
          }
        }
        s32[y * w + x] = col;
      }
      cg.putImageData(sd, 0, 0);
      // Treppe hinauf über dem Eingang
      if (j === M.sy - 1 && M.sx >= i && M.sx <= i1){
        const ax = (M.sx - i) * T + T / 2;
        cg.fillStyle = '#0a090c'; cg.fillRect(ax - 12, T + 4, 24, FH - 4);
        for (let k = 0; k < 4; k++){ cg.fillStyle = ['#7a7468', '#625c52', '#4a453e', '#35312c'][k]; cg.fillRect(ax - 11, T + FH - 4 - k * 8, 22, 3); }
        cg.fillStyle = 'rgba(220,230,255,.12)'; cg.fillRect(ax - 12, T + 4, 24, FH - 4);
      }
      M.segs.push({ c, x0: DG_OX + i * T, x1: DG_OX + (i1 + 1) * T, y0: DG_OY + j * T - FH, key: DG_OY + (j + 1) * T });
      i = i1 + 1;
    }
  }
}
/* Hindernisse im Gewölbe (Feinpixel) */
function dgBox(x0, y0, x1, y1){
  const M = DG_ON, T = DG_T;
  const i0 = Math.floor((x0 - M.ox) / T), i1 = Math.floor((x1 - M.ox) / T), j0 = Math.floor((y0 - M.oy) / T), j1 = Math.floor((y1 - M.oy) / T);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ if (i < 0 || j < 0 || i >= M.C || j >= M.Rn) return true; const k = j * M.C + i; if (M.g[k] || M.blk[k]) return true; }
  return false;
}
function dgRandWalk(x, y, rMin, rMax){
  for (let t = 0; t < 12; t++){ const a = Math.random() * 6.283, r = rMin + Math.random() * (rMax - rMin), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * .7; if (!dgBox(px - 6, py - 5, px + 6, py)) return { x: px, y: py }; }
  return null;
}
function dgCam(k){
  const M = DG_ON, P = DG_PAD, w = M.W + 2 * P, h = M.H + 2 * P;
  return { x: Math.round(w <= W ? M.ox - P + (w - W) / 2 : clamp(k.x - W / 2, M.ox - P, M.ox - P + w - W)), y: Math.round(h <= H ? M.oy - P + (h - H) / 2 : clamp(k.y - 22 - H / 2, M.oy - P, M.oy - P + h - H)) };
}
/* Hinabsteigen und Hinaufsteigen */
const DG_DOORS = wo_DGDOORS.map(d => ({ dg: d.dg, x: d.x * WS, y: d.y * WS, name: DG_DEF[d.dg].name }));
function enterDungeon(door){
  if (!canAct() || DG_ON) return;
  const M = dgGet(door.dg), k = G.knight;
  if (HERO.riding){ HERO.riding = false; renderSkills(); }
  M.door = door;
  M.world = { mons: G.mons, loot: G.loot, shots: G.shots, rising: G.rising };
  G.mons = []; G.loot = []; G.shots = []; G.rising = [];
  DG_ON = M; G.dg = M;
  k.x = M.start.x; k.y = M.start.y; k.dir = 'down'; k.kbx = k.kby = 0; k.lance = 0;
  M.seen.fill(0); M.chestOpen = HERO.dg && HERO.dg[M.id] === dgDay();
  const D = M.D, base = D.group ? clamp(Math.max(HERO.lvl, ...partyList().map(q => q.lv)), ...(D.base || [8, MAX_LVL - 2])) : 0;   // Gruppen-Gewölbe: nach dem stärksten Gefährten
  M.lvl = D.group ? [base, base + 2] : D.lvl;
  const slain = D.group && HERO.dgBoss && HERO.dgBoss[M.id] === dgDay();
  for (const [kind, x, y, lvl, elite] of M.spawns){
    if (elite && slain) continue;
    const m = createMonster(kind, x, y, lvl + base, null); m.zone = gZone(door.x, door.y).id;
    if (D.names && D.names[kind]) m.nm = D.names[kind];
    if (elite){ m.elite = elite; if (D.elite.grp){ m.grp = true; m.nm = elite; m.summoned = true; if (D.elite.k === 'lindwurm'){ m.art = drakeArt(); m.parts = drakeParts(); } } else m.hp = m.max = m.max * 5; }
  }
  for (const gt of M.gates || []){ gt.open = false; for (const t of gt.tiles) M.blk[t] = 1; }
  M.openG = []; M.ddSeen = new Map(); G.lever = null;
  M.bossDmg = HERO.dgDmg && HERO.dgDmg.k === M.id + ':' + dgDay() ? +HERO.dgDmg.d || 0 : 0;
  G.zone = 'gewoelbe'; G.near = null; G.nearDoor = null; G.dgNear = null; $('btnTalk').hidden = true;
  const z = $('zone'); z.textContent = M.D.name; z.append(el('small', null, 'Stufe ' + M.lvl[0] + '–' + M.lvl[1]));
  showBanner(M.D.name, 'Stufe ' + M.lvl[0] + '–' + M.lvl[1] + ', ' + (slain ? (D.slain || 'der Drache ist heute schon erschlagen') : M.D.elite.name + ' bewacht ' + M.D.chest));
  logLine('Ihr steigt hinab: ' + M.D.name + '. Am Ende wartet ' + M.D.chestN + '. Über die Treppe kommt Ihr wieder hinauf.', '#c8b8ff');
  if (D.group) logLine(D.intro || 'Hier unten braucht Ihr Gefährten: Ein Fallgitter geht nur auf, wenn die beiden Hebel in den Seitenstollen zugleich gezogen werden.', '#ffd98a');
  if (D.zb) zbEnter(M);
  Sound.tone(98, .8, 'sine', .05); Sound.tone(73, 1.2, 'sine', .04, 0, .2);
  sendPresence(true); markDirty(true);
}
function leaveDungeon(silent){
  const M = DG_ON; if (!M) return;
  const k = G.knight, door = M.door;
  DG_ON = null; G.dg = null; G.wadeM = 1;
  G.mons = M.world.mons; G.loot = M.world.loot; G.shots = M.world.shots; G.rising = M.world.rising;
  k.x = door.x; k.y = door.y + 30; k.dir = 'down'; k.kbx = k.kby = 0;
  G.zone = gZone(k.x, k.y).id; updateZone(false); G.near = null; G.dgNear = null; $('btnTalk').hidden = true;
  if (!silent){ logLine('Ihr steigt wieder hinauf ans Tageslicht.', '#ffd98a'); Sound.tone(147, .5, 'sine', .04); }
  sendPresence(true); markDirty(true);
}
const dgDay = () => Math.floor(skyNow() / DAY_LEN);
/* Truhe öffnen: einmal am Tag voll, beim ersten Mal ein besonderes Stück */
function dgOpenChest(){
  const M = DG_ON, o = M.chest; if (!o) return;
  HERO.dg = HERO.dg || {}; HERO.dgFirst = HERO.dgFirst || {};
  const elite = G.mons.find(m => m.elite);
  if (elite){ floatText(o.x, o.y - 40, elite.elite + ' wacht noch', '#ff9a8a', 1, 1.4); return; }
  if (HERO.dg[M.id] === dgDay()){ floatText(o.x, o.y - 40, 'leer', '#d8c69c'); logLine('Die Truhe ist leer. Morgen ist sie wieder gefüllt.', '#d8c69c'); return; }
  HERO.dg[M.id] = dgDay(); M.chestOpen = true; orCount('chests'); lwAdd(5); ehCount('dg:' + M.id);
  const L = (M.lvl || M.D.lvl)[1] + 1, from = { x: o.x, y: o.y + 18 };
  for (let j = 0; j < 4; j++) dropLoot(from, 'gold', monGold(L) * 4);
  dropLoot(from, 'potion'); dropLoot(from, 'potion');
  dropLoot(from, 'item', 0, makeItem(pick(SLOTS), L, rollRarity(true)));
  if (!HERO.dgFirst[M.id]){ HERO.dgFirst[M.id] = true; dropLoot(from, 'item', 0, makeItem(pick(SLOTS), L + 1, 3)); showBanner('Schatz gefunden', 'Zum ersten Mal: ein episches Stück'); }
  else showBanner('Schatz gefunden', 'Die Truhe füllt sich jeden Tag neu');
  Sound.gold(); G.flash = .2; burst(o.x, o.y - 14, ['#ffd541', '#ffffff', '#c9a227'], 18, 90, true);
  logLine('Ihr öffnet ' + M.D.chest + '.', '#ffd98a');
  markDirty(true);
}
function dgNear(){
  const M = DG_ON, k = G.knight;
  let near = null;
  if (Math.abs(k.x - M.stair.x) < 30 && k.y - M.stair.y < 62) near = 'stair';
  else if (M.chest && !M.chestOpen && Math.abs(k.x - M.chest.x) < 30 && Math.abs(k.y - M.chest.y - 14) < 26) near = 'chest';
  else for (const [li, L] of (M.levers || []).entries()) if (L && Math.abs(k.x - L.o.x) < 30 && k.y - L.o.y > -8 && k.y - L.o.y < 42){ near = 'lever:' + li; break; }
  if (near !== G.dgNear){
    G.dgNear = near;
    const b = $('btnTalk'); b.hidden = !near;
    b.textContent = near === 'stair' ? 'Hinaufsteigen' : near === 'chest' ? 'Truhe öffnen' : dgLvN(near, near && G.lever === +near.slice(6));
  }
}
function dgInteract(){
  if (G.mode !== 'play') return;
  if (G.dgNear === 'stair') leaveDungeon();
  else if (G.dgNear === 'chest'){ dgOpenChest(); G.dgNear = 'neu'; dgNear(); }
  else if (G.dgNear && G.dgNear.startsWith('lever:')) dgPull(+G.dgNear.slice(6));
}
function updateDungeon(dt){
  const M = DG_ON, k = G.knight;
  updateKnight(dt);
  peerHits();
  updateLoot(dt);
  if (G.mode === 'play'){ updateMons(dt); updateShots(dt); }
  kbTick(dt);
  updateFx(dt); updateBossBar(); dgNear();
  if (M.D.group) dgGroupTick(M);
  if (M.D.zb) zbTick(M, dt);
  // erkundete Felder (für die kleine Karte)
  const ti = Math.floor((k.x - M.ox) / DG_T), tj = Math.floor((k.y - M.oy) / DG_T);
  for (let j = tj - 6; j <= tj + 6; j++) for (let i = ti - 8; i <= ti + 8; i++) if (i >= 0 && j >= 0 && i < M.C && j < M.Rn) M.seen[j * M.C + i] = 1;
  // Tropfen und Wind in der Tiefe
  G.dripT = (G.dripT || 2) - dt;
  if (G.dripT <= 0){ G.dripT = rand(2.5, 6); Sound.tone(rand(1500, 2100), .06, 'sine', .012, -400); }
  sendPresence(); HERO.played += dt; G.saveT += dt;
  if (G.saveT > 8){ G.saveT = 0; saveHero(); }
}
/* ---------- Gruppen-Gewölbe: Hebel halten, Fallgitter, Bergdrache ----------
   Wer einen Hebel zieht, hält ihn, solange er daneben steht; das steht in seiner Anwesenheit (hl). Sind alle Hebel
   eines Gitters zugleich gezogen, geht es auf; wer es offen gesehen hat, meldet das (go), so sehen es alle im Bergwerk.
   Das Leben des Drachen ist die Summe der Stufenanteile aller Kämpfer weniger dem gemeldeten Schaden (dd). */
const dgLeverDown = li => G.lever === li || [...PEERS.values()].some(q => q.in === 'dg:' + DG_ON.id && q.hl === li && !q.dead);
function dgPull(li){
  const M = DG_ON, L = M.levers[li]; if (!L) return;
  const g0 = M.gates[L.gate];
  if (g0.flood && G.lever !== li && (g0.open || !zbFloodOn(M, g0.flood))){ floatText(L.o.x, L.o.y - 46, g0.open ? 'Das Wasser ist abgelaufen' : 'Der Schieber sitzt fest', '#d8c69c', 1, 1.4); return; }
  if (G.lever === li){ G.lever = null; Sound.tone(220, .1, 'square', .03); }
  else {
    G.lever = li; Sound.tone(160, .25, 'sawtooth', .04, -40); G.shake = .1;
    const gt = M.gates[L.gate], other = gt.levers.find(x => x !== li);
    const held = other != null && dgLeverDown(other);
    const nm = !M.D.zb ? ['Hebel', 'den Hebel', 'den zweiten Hebel im anderen Seitenstollen ziehen'] : gt.flood ? ['Schieber', 'den Schieber', 'den zweiten Schieber auf der anderen Seite öffnen'] : ['Räder', 'das Rad', 'das zweite Rad in der anderen Seitenkammer drehen'];
    floatText(L.o.x, L.o.y - 46, held ? 'Beide ' + nm[0] + '!' : 'Haltet ' + nm[1] + ' …', held ? '#9fe08a' : '#ffd98a', 1, 1.6);
    if (!held && !gt.open) logLine('Ihr haltet ' + nm[1] + '. Ein Gefährte muss zugleich ' + nm[2] + '.', '#ffd98a');
  }
  G.dgNear = 'neu'; dgNear(); sendPresence(true);
}
function dgOpenGate(M, gi, byLever){
  const gt = M.gates[gi]; if (gt.open) return;
  gt.open = true;
  for (const t of gt.tiles) M.blk[t] = 0;
  M.openG = M.gates.map((g, i) => g.open ? i : -1).filter(i => i >= 0);
  if (gt.flood){ zbDrained(M, gt, byLever); sendPresence(true); return; }
  burst(gt.o.x, gt.o.y - 20, ['#6e5a42', '#9a948a', '#c9c2ad'], 24, 90); G.shake = .35;
  Sound.tone(70, .9, 'sawtooth', .05, 30); Sound.tone(110, .6, 'square', .02, 60, .15);
  logLine(byLever ? 'Mit Rasseln fährt das Fallgitter hoch!' : 'Ein Fallgitter steht offen.', '#ffd98a');
  if (byLever) showBanner('Fallgitter offen', gi === M.gates.filter(g => !g.flood).length - 1 ? (M.D.hort || 'Dahinter liegt der Hort des Drachen') : 'Weiter in die Tiefe');
  sendPresence(true);
}
function dgGroupTick(M){
  const k = G.knight, here = 'dg:' + M.id, peers = [...PEERS.values()].filter(q => q.in === here);
  if (G.lever != null){ const L = M.levers[G.lever]; if (!L || G.mode !== 'play' || k.hp <= 0 || Math.hypot(k.x - L.o.x, k.y - L.o.y - 20) > 52){ G.lever = null; G.dgNear = 'neu'; sendPresence(true); } }
  M.gates.forEach((gt, gi) => {
    if (gt.open) return;
    if (gt.flood && !zbFloodOn(M, gt.flood)) return;
    const held = gt.levers.length > 1 && gt.levers.every(li => dgLeverDown(li));
    if (held || peers.some(q => q.go && q.go.includes(gi))) dgOpenGate(M, gi, held);
  });
  const boss = G.mons.find(m => m.grp); if (!boss) return;
  const key = M.id + ':' + dgDay();
  for (const q of peers){ const dd = q.dd; if (dd && dd.k === key) M.ddSeen.set(q.by || q.peer, { lv: q.lv, d: clamp(+dd.d || 0, 0, 1e7) }); }
  const parts = [{ lv: HERO.lvl, d: M.bossDmg || 0 }].concat([...M.ddSeen.values()]);
  const maxHp = Math.round(parts.reduce((a, p) => a + monHp(boss.k, clamp(p.lv, 1, MAX_LVL)), 0) * 1.2), dealt = parts.reduce((a, p) => a + p.d, 0);
  boss.max = maxHp; boss.hp = Math.max(1, maxHp - dealt);
  if (dealt >= maxHp){ if (M.bossDmg > 0) boss.by = 'me'; kill(boss); }
}
/* der Bergdrache: rot und bronzen statt grün */
function tintArt(art, f){
  const tint = src => {
    const c = canvasOf(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0);
    const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]){ const o = f(d[i], d[i + 1], d[i + 2]); d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; }
    g.putImageData(id, 0, 0); return c;
  };
  const fr = s => ({ img: tint(s.img), glow: s.glow ? tint(s.glow) : null, white: s.white });
  const side = o => ({ r: o.r.map(fr), l: o.l.map(fr) });
  const out = Object.assign({}, art, { move: side(art.move), idle: side(art.idle), act: side(art.act) });
  if (art.segs) out.segs = art.segs.map(s => Object.assign({}, s, { img: tint(s.img) }));
  if (art.tail) out.tail = Object.assign({}, art.tail, { img: tint(art.tail.img) });
  return out;
}
let DRAKE = null;
const drakeArt = () => DRAKE || (DRAKE = tintArt(BOSS_ART.lindwurm, (r, g, b) => [Math.min(255, g * 1.2 + 16), r * .62 + b * .2 + 6, b * .55]));
const drakeParts = () => drakeArt().segs.concat(drakeArt().tail ? [drakeArt().tail] : []);
function dgDrakeKill(m){
  const M = DG_ON, c = centerOf(m), from = { x: m.x, y: m.y };
  HERO.kills++; HERO.dgBoss = HERO.dgBoss || {}; HERO.dgBoss[M.id] = dgDay(); orCount('kills'); orCount('boss');
  Sound.kill(); Sound.thunder(); G.flash = .5; G.shake = .4;
  burst(c.x, c.y, ['#a84020', '#e0a040', '#401810', '#ffd36a'], 50, 140, true);
  for (const sg of wurmSegs(m)) burst(sg.x, sg.cy, ['#a84020', '#e0a040', '#401810'], 8, 70);
  for (let j = 0; j < 5; j++) dropLoot(from, 'gold', monGold(m.lvl) * 4);
  dropLoot(from, 'potion'); dropLoot(from, 'potion');
  HERO.dgFirst = HERO.dgFirst || {};
  if (!HERO.dgFirst.drache){ HERO.dgFirst.drache = true; dropLoot(from, 'item', 0, makeItem('waffe', m.lvl + 1, 4, { name: 'Drachenzahn', aff: ['str', 'crit', 'spd'] })); }
  else dropLoot(from, 'item', 0, makeItem(pick(SLOTS), m.lvl, 3));
  dropLoot(from, 'item', 0, makeItem(pick(SLOTS), m.lvl, rollRarity(true)));
  if (m.by === 'me') NET.kx = { n: NET.kx.n + 1, s: NET.kx.s + monXp('lindwurm', m.lvl), l: m.lvl };
  const xp = Math.round(monXp('lindwurm', m.lvl) * 1.5 * xpMul(m.lvl - HERO.lvl)); if (xp > 0) gainXp(xp);
  showBanner('Der Bergdrache ist erschlagen', 'Die Truhe im Hort ist frei');
  logLine('Der Bergdrache ist erschlagen! ' + M.D.chestN[0].toUpperCase() + M.D.chestN.slice(1) + ' gehört Euch.', '#ecd27a');
  pushFame(); updateHud(); markDirty(true);
}
/* ---------- Zeichnen ---------- */
function dgSeg(s, k){
  const behind = k.y < s.key - DG_T + 4 && k.y > s.key - DG_T - DG_FH - 8 && k.x > s.x0 - 16 && k.x < s.x1 + 16;
  if (!behind){ ctx.drawImage(s.c, s.x0, s.y0); return; }
  // Ritter hinter der Mauer: dort durchscheinend
  const a = clamp(Math.round(k.x - 26 - s.x0), 0, s.c.width), b = clamp(Math.round(k.x + 26 - s.x0), 0, s.c.width), h = s.c.height;
  if (a > 0) ctx.drawImage(s.c, 0, 0, a, h, s.x0, s.y0, a, h);
  if (b > a){ ctx.globalAlpha = .45; ctx.drawImage(s.c, a, 0, b - a, h, s.x0 + a, s.y0, b - a, h); ctx.globalAlpha = 1; }
  if (b < s.c.width) ctx.drawImage(s.c, b, 0, s.c.width - b, h, s.x0 + b, s.y0, s.c.width - b, h);
}
function dgObjImg(o){
  if (o.chest && DG_ON.chestOpen) return o.openImg || (o.openImg = wp_paintV('truhe', 1, 1).img);
  if (o.lever != null) return dgLeverDown(o.lever) || DG_ON.gates[o.gate].open ? o.downImg || (o.downImg = wp_paintV(o.kind, 1, 1).img) : o.img;
  if (o.gate != null && DG_ON.gates[o.gate].open) return o.openImg || (o.openImg = wp_paintV('gitter', 1, 1).img);
  return o.img;
}
function dgLights(cam){
  const M = DG_ON, k = G.knight, L = [], v = (x, y, m) => x > cam.x - m && x < cam.x + W + m && y > cam.y - m && y < cam.y + H + m;
  L.push([k.x, k.y - 24, 210, .95, 0]);
  for (const p of PEERS.values()) if (p.in === 'dg:' + M.id && v(p.x, p.y, 200)) L.push([p.x, p.y - 24, 180, .85, 0]);
  for (const [x, y] of M.torches) if (v(x, y, 170)) L.push([x, y, 150 + Math.sin(G.t * 9 + x) * 6, 1, 1]);
  for (const o of M.objs) if (o.fire && v(o.x, o.y, 200)) L.push([o.x, o.y - 40, 190 + Math.sin(G.t * 7 + o.x) * 8, 1, 1]);
  L.push([M.stair.x, M.stair.y, 170, .8, 2]);
  for (const m of G.mons) if (aiK(m.k) === 'irrlicht' && v(m.x, m.y, 120)) L.push([m.x, m.y - 26, 140, .9, 3]);
  for (const s of G.shots) if (s.k === 'fire') L.push([s.x, s.y, 140, .9, 1]);
  return L;
}
function dgLight(cam){
  const M = DG_ON, g = LIGHT_G, lw = LIGHT_CV.width, lh = LIGHT_CV.height, L = dgLights(cam);
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, lw, lh);
  g.fillStyle = 'rgba(5,4,9,' + M.D.dark + ')'; g.fillRect(0, 0, lw, lh);
  g.globalCompositeOperation = 'destination-out';
  for (const [x, y, r, a] of L){
    const px = (x - cam.x) / 2, py = (y - cam.y) / 2, rr = r / 2, gr = g.createRadialGradient(px, py, 0, px, py, rr);
    gr.addColorStop(0, 'rgba(0,0,0,' + a.toFixed(2) + ')'); gr.addColorStop(.55, 'rgba(0,0,0,' + (a * .5).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(LIGHT_CV, 0, 0, lw * 2, lh * 2);
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, a, c] of L){
    if (!c) continue;
    const px = x - cam.x, py = y - cam.y, rr = r * .7, gr = ctx.createRadialGradient(px, py, 0, px, py, rr);
    gr.addColorStop(0, c === 2 ? 'rgba(150,170,220,.12)' : c === 3 ? 'rgba(90,230,170,.14)' : 'rgba(255,140,50,.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}
function renderDungeon(){
  const M = DG_ON, k = G.knight, cam = camOf(k);
  const sh = G.shake > 0 && !RM ? 2 : 0, sx = sh ? Math.round(rand(-sh, sh)) : 0, sy = sh ? Math.round(rand(-sh, sh)) : 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#08070a'; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(1, 0, 0, 1, sx - cam.x, sy - cam.y);
  ctx.drawImage(M.floor, M.ox - DG_PAD, M.oy - DG_PAD);
  if (M.zb) zbFloor(M);
  const peers = [...PEERS.values()].filter(p => p.in === 'dg:' + M.id && inView(p.x, p.y, cam));
  if (G.mode !== 'dead') shadow(k.x, k.y - 1, 18, .42);
  for (const p of peers) shadow(p.x, p.y - 1, 18, .38);
  for (const a of G.loot) if (inView(a.x, a.y, cam)) shadow(a.x, a.y - 1, a.z > 3 ? 4 : 8, a.z > 3 ? .2 : .3);
  for (const m of G.mons){
    if (!inView(m.x, m.y, cam)) continue;
    if (m.elite){ ctx.globalAlpha = .35 + Math.sin(G.t * 4) * .12; ctx.fillStyle = '#b3202a'; ctx.beginPath(); ctx.ellipse(m.x, m.y - 1, 18, 6, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
    if (aiK(m.k) === 'irrlicht') shadow(m.x, m.y + 18, 6, .18); else shadow(m.x, m.y - 1, Math.max(10, artOf(m.k).w * .55), .38);
  }
  const list = [];
  for (const s of M.segs) if (s.x1 > cam.x && s.x0 < cam.x + W && s.key > cam.y && s.y0 < cam.y + H) list.push({ y: s.key, d: () => dgSeg(s, k) });
  for (const o of M.objs) if (inView(o.x, o.y, cam, 80)) list.push({ y: o.y, d: () => { const img = dgObjImg(o); ctx.drawImage(img, Math.round(o.x - o.ax), Math.round(o.y - o.ay)); } });
  for (const a of G.loot) if (inView(a.x, a.y, cam)) list.push({ y: a.y, d: () => drawLoot(a) });
  for (const m of G.mons) if (!MON[m.k].fly && inView(m.x, m.y, cam, 120)) list.push({ y: m.y + .1, d: () => drawMon(m) });
  for (const p of peers) list.push({ y: p.y + .18, d: () => drawKnightAt(p, knightSet(p.f, p.lk), p.dead, 1) });
  list.push({ y: k.y + .2, d: drawKnight });
  list.sort((p, q) => p.y - q.y);
  for (const it of list) it.d();
  for (const m of G.mons) if (MON[m.k].fly && inView(m.x, m.y, cam, 100)) drawMon(m);
  for (const s of G.shots) if (s.k === 'bolt' || s.k === 'ball') drawShot(s);
  kbDraw();
  for (const p of G.parts){ if (p.glow) continue; ctx.globalAlpha = p.s ? Math.min(.6, p.life * .5) : .85; ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, p.s || 1, p.s || 1); }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  dgLight(cam);
  ctx.setTransform(1, 0, 0, 1, sx - cam.x, sy - cam.y);
  for (const [x, y] of M.torches) if (inView(x, y, cam)){ ctx.fillStyle = '#2a2420'; ctx.fillRect(Math.round(x) - 2, Math.round(y) + 2, 4, 8); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(Math.round(x) - 3, Math.round(y) + 1, 6, 2); flameHD(x, y + 1, G.t + x * .01, false); }
  for (const o of M.objs) if (o.fire && inView(o.x, o.y, cam)) flameHD(o.x, o.y - 40, G.t + o.x * .01, true);
  if (M.zb) zbOver(M);
  for (const m of G.mons) if (inView(m.x, m.y, cam, 120)) drawMon(m, true);
  for (const s of G.shots) if (s.k === 'fire') drawShot(s);
  for (const a of G.loot) if (inView(a.x, a.y, cam)) drawLootBeam(a);
  for (const p of G.parts){ if (!p.glow) continue; ctx.fillStyle = p.c; ctx.fillRect(p.x | 0, p.y | 0, 1, 1); }
  for (const m of G.mons) if (inView(m.x, m.y, cam, 20) && (m.mode === 'fight' || m.hp < m.max || m.elite || Math.hypot(m.x - k.x, m.y - k.y) < 170)) drawPlate(m);
  for (const p of peers){ drawText(p.nm + ' ' + p.lv, p.x, p.y - KS.ay - 15, inParty(p) ? '#9fe08a' : '#9cc8ff'); if (p.say && nowS() < p.sayT) drawBubble(p.x, p.y - KS.ay - 11, p.say); }
  if (G.say && nowS() < G.sayT) drawBubble(k.x, k.y - KS.ay - 4, G.say);
  for (const f of G.floats){ ctx.globalAlpha = clamp(f.life / f.max * 2.5, 0, 1); drawText(f.txt, f.x, f.y, f.c, 'c', f.s); }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  dgMiniMap();
  if (G.flash > 0 && !RM){ ctx.fillStyle = 'rgba(220,226,255,' + Math.min(.45, G.flash * .9).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
}
/* kleine Karte: erkundete Felder, Treppe, Truhe, Monster im Kampf */
function dgMiniMap(){
  const M = DG_ON, k = G.knight, g = mmG, s = 2, mw = M.C * s, mh = M.Rn * s, mx = 2 + Math.max(0, (MM_W - mw) >> 1);
  const my = 2 + (mh <= MM_H ? (MM_H - mh) >> 1 : clamp(Math.round(MM_H / 2 - (k.y - M.oy) / DG_T * s), MM_H - mh, 0));   // höher als die Karte: mit dem Ritter wandern
  g.fillStyle = OUT; g.fillRect(0, 0, MM_W + 4, MM_H + 4);
  g.fillStyle = '#7d6414'; g.fillRect(1, 1, MM_W + 2, MM_H + 2);
  g.fillStyle = '#0e0d12'; g.fillRect(2, 2, MM_W, MM_H);
  g.save(); g.beginPath(); g.rect(2, 2, MM_W, MM_H); g.clip();
  for (let j = 0; j < M.Rn; j++) for (let i = 0; i < M.C; i++){
    const q = j * M.C + i; if (!M.seen[q]) continue;
    g.fillStyle = M.g[q] ? '#2a2630' : M.blk[q] ? '#4a4450' : '#6a6270'; g.fillRect(mx + i * s, my + j * s, s, s);
  }
  const P = (x, y) => [mx + Math.floor((x - M.ox) / DG_T * s), my + Math.floor((y - M.oy) / DG_T * s)];
  let q = P(M.stair.x, M.stair.y); g.fillStyle = '#e8ecf4'; g.fillRect(q[0] - 1, q[1], 3, 2);
  if (M.chest && M.seen[M.chest.ty * M.C + M.chest.tx]){ q = P(M.chest.x, M.chest.y); g.fillStyle = M.chestOpen ? '#7a6a40' : '#ffd541'; g.fillRect(q[0] - 1, q[1] - 2, 3, 3); }
  for (const m of G.mons) if (m.mode === 'fight' || m.elite){ q = P(m.x, m.y); g.fillStyle = m.elite ? '#ff7a40' : '#d0343c'; g.fillRect(q[0], q[1], 2, 2); }
  for (const p of PEERS.values()) if (p.in === 'dg:' + M.id){ q = P(p.x, p.y); g.fillStyle = inParty(p) ? '#7fe08a' : '#9cc8ff'; g.fillRect(q[0], q[1], 2, 2); }
  for (const gt of M.gates || []) if (gt.o){ q = P(gt.o.x, gt.o.y - 16); g.fillStyle = gt.open ? '#5a9a4a' : '#d0343c'; g.fillRect(q[0] - 2, q[1], 5, 2); }
  for (const L of M.levers || []) if (L && M.seen[L.o.ty * M.C + L.o.tx]){ q = P(L.o.x, L.o.y); g.fillStyle = dgLeverDown(M.levers.indexOf(L)) ? '#ffd541' : '#a8862a'; g.fillRect(q[0] - 1, q[1] - 1, 2, 2); }
  q = P(k.x, k.y); g.fillStyle = '#ffffff'; g.fillRect(q[0] - 1, q[1] - 1, 3, 3);
  g.restore();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mmCv, Math.round(W - (MM_W + 4) * MM_Z - 6), Math.round(H - (MM_H + 4) * MM_Z - 6), Math.round((MM_W + 4) * MM_Z), Math.round((MM_H + 4) * MM_Z));
}

/* ============ Feste im Jahreslauf ============
   Am zweiten und dritten Spieltag jeder Jahreszeit wird gefeiert, für alle Ritter zugleich: Maifest am Maibaum in Lindach,
   Johannisfeuer im Obstgarten, Erntedank und Weihnachtsmarkt auf dem Markt der Reichsstadt. Jedes Fest hat Musik, tanzende
   Leute, einen Gastgeber mit Speis und Trank und ein Spiel mit Preis (einmal je Fest). Koordinaten in Weltpixeln. */
const FESTS = [
  { id:'mai', name:'Maifest', where:'in Dorf Lindach am Maibaum', tune:'mai', game:'klettern', gameName:'Maibaumklettern', prize:'Maienkranz', c:[2470, 590],
    host:{ name:'Maikönigin Gretl', at:[2436, 640], o:{ robe:'long', hat:'haube', belt:true }, pal:{ 1:'#c8c0a8', 2:'#e0d8c0', 3:'#f0ead8', 4:'#fbf8ee', 5:'#2e5a24', 6:'#3e7230', 7:'#548a40', 8:'#6ea654' },
      greet:['Grüß Gott, Herr Ritter! Tanzt mit uns um den Maibaum!', 'Wer den Kranz von der Spitze holt, ist der Held des Tages.', 'Der Maiwein ist frisch, mit Waldmeister aus dem Finsterwald.'] },
    gameText:'Klettert den Maibaum hinauf: Drückt den Hieb, wenn die Marke im grünen Feld steht. Dreimal daneben, und Ihr rutscht hinunter. Oben hängt der Kranz.' },
  { id:'johannis', name:'Johannisfeuer', where:'auf der Wiese vor der Reichsburg', tune:'johannis', game:'springen', gameName:'Feuerspringen', prize:'Johanniskraut-Amulett', c:[2200, 694],
    host:{ name:'Feuermeister Wendel', at:[2146, 734], o:{ robe:'short', apron:'leather', beard:true, belt:true, hair:['h', 'j'] }, pal:{ 1:'#5a1e10', 2:'#7a2e18', 3:'#9a4222', 4:'#b85a30', 5:'#3a2c1e', 6:'#4a3a28', 7:'#5a4a34', 8:'#6e5c44' },
      greet:['Am Johannistag brennt das Feuer die ganze Nacht.', 'Wer übers Feuer springt, bleibt ein Jahr lang gesund. So sagt man.', 'Nehmt ein Stockbrot, es ist gleich gar.'] },
    gameText:'Lauft an und springt übers Feuer: Drückt den Hieb, wenn Ihr im hellen Feld vor den Flammen seid. Drei Sprünge, jeder schwerer.' },
  { id:'ernte', name:'Erntedank', where:'auf dem Markt der Reichsstadt', tune:'ernte', game:'stein', gameName:'Steinstoßen', prize:'Erntekrone', c:[2966, 2318],
    host:{ name:'Erntevogt Sebald', at:[2878, 2326], o:{ robe:'short', hat:'filz', beard:true, belt:true, hair:['w', 'x'] }, pal:{ 1:'#3a4a1c', 2:'#4e6226', 3:'#667a32', 4:'#80923e', 5:'#4a3a28', 6:'#5e4a34', 7:'#725c42', 8:'#8a7254' },
      greet:['Gott sei Dank für die Ernte! Feiert mit, Herr Ritter.', 'Der bärenstarke Hans stößt den Stein zwölfeinhalb Ellen weit. Schafft Ihr mehr?', 'Probiert den Federweißer, er ist von diesem Herbst.'] },
    gameText:'Haltet den Hieb gedrückt und lasst los, wenn die Kraft am größten ist. Drei Würfe; der bärenstarke Hans hält den Rekord mit 12,5 Ellen.' },
  { id:'advent', name:'Weihnachtsmarkt', where:'auf dem Markt der Reichsstadt', tune:'advent', game:'schnee', gameName:'Schneeballschlacht', prize:'Lebkuchenherz', c:[2966, 2318],
    host:{ name:'Marktfrau Agnes', at:[2878, 2326], o:{ robe:'long', hat:'haube', apron:'linen' }, pal:{ 1:'#4a1414', 2:'#6e2020', 3:'#8e3028', 4:'#ae4a3a', 5:'#1e3a24', 6:'#2a5030', 7:'#386640', 8:'#4a7c50' },
      greet:['Heißer Würzwein und Lebkuchen aus Nürnberg!', 'Die Lehrbuben wollen eine Schneeballschlacht. Traut Ihr Euch?', 'Seht den Baum mit Äpfeln und Kerzen, so macht man es jetzt im Elsass.'] },
    gameText:'Drei Lehrbuben fordern Euch heraus. Mit dem Hieb werft Ihr Schneebälle in Blickrichtung. Trefft jeden dreimal, bevor sie Euch zehnmal treffen oder die Minute um ist.' }
];
const FEST_ART = {}, FEST_HOST = {}, FEST_OBJ = {};
const festDay = () => Math.floor(((Date.now() / 1000 + (window.__skyShift || 0)) % SEA_LEN) / DAY_LEN);
function festNow(){
  if (window.__fest === false) return null;
  return window.__fest || festDay() === 1 || festDay() === 2 ? FESTS[SEA.cur] : null;
}
const festKey = () => FESTS[SEA.cur].id + ':' + Math.floor((Date.now() / 1000 + (window.__skyShift || 0)) / SEA_LEN);
function festNear(){ const f = G && G.fest; if (!f || G.inside || DG_ON) return null; const k = G.knight; return Math.hypot(k.x - f.cx, k.y - f.cy) < 520 ? f : null; }
const nearFest = (x, y) => !!(G && G.fest && Math.hypot(x - G.fest.cx, y - G.fest.cy) < 420);
/* Schmuck und Gastgeber eines Festes (beim ersten Mal gebaut) */
function festBuild(f){
  const P = (x, y) => ({ x: x * WS, y: y * WS }), objs = [], lines = [], lights = [], fires = [];
  const obj = (kind, v, x, y) => { const q = wp_paintV(kind, v, SEA.cur), o = { kind, x: x * WS, y: y * WS, img: q.img, ax: q.ax * WS, ay: q.ay * WS, ex: q.extra }; objs.push(o); return o; };
  const top = o => ({ x: o.x + (o.kind === 'banner' ? -14 : 0), y: o.y - o.ay + 6 });
  const [cx, cy] = f.c;
  if (f.id === 'mai'){
    const mb = GPROPS.find(q => q.kind === 'maibaum'), mt = mb ? { x: mb.x, y: mb.y - mb.ay + 30 } : P(cx, cy - 100);
    for (const [dx, dy] of [[-70, 52], [76, 48]]) obj('festtisch', 0, cx + dx, cy + dy);
    for (const [dx, dy, v] of [[-104, 18, 0], [104, 18, 1]]) lines.push([mt, top(obj('banner', v, cx + dx, cy + dy))]);
  }
  if (f.id === 'johannis'){
    const w = obj('feuerholz', 0, cx, cy);
    fires.push({ x: w.x, y: w.y - 10 });
    obj('festtisch', 0, cx + 84, cy + 40);
    for (const [dx, dy] of [[-76, -28], [74, -34], [-60, 44]]) obj('heuhaufen', 0, cx + dx, cy + dy);
  }
  if (f.id === 'ernte'){
    const kr = obj('erntekrone', 0, cx, cy), kt = { x: kr.x, y: kr.y - kr.ay + 40 };
    for (const [dx, dy] of [[-56, -26], [24, -30], [-62, 30], [46, 26]]) obj('garbe', 0, cx + dx, cy + dy);
    obj('festtisch', 0, cx - 8, cy + 44);
    for (const [dx, dy, v] of [[-114, -8, 0], [130, -8, 1]]) lines.push([kt, top(obj('banner', v, cx + dx, cy + dy))]);
  }
  if (f.id === 'advent'){
    const t = obj('christbaum', 0, cx, cy), tt = { x: t.x, y: t.y - t.ay + 30 };
    for (const c of (t.ex.candles || [])) lights.push([t.x - t.ax + c[0], t.y - t.ay + c[1], 60, .5]);
    for (const [dx, dy] of [[-86, -44], [86, -44], [-86, 36], [86, 36]]){ const l = obj('laterne', 0, cx + dx, cy + dy); lines.push([tt, { x: l.x + 10, y: l.y - 70 }, 'lamp']); lights.push([l.x + 10, l.y - 60, 130, .9]); }
    obj('festtisch', 0, cx - 8, cy + 48);
  }
  objs.sort((a, b) => a.y - b.y);
  return { objs, lines, lights, fires };
}
function festHost(f){
  if (FEST_HOST[f.id]) return FEST_HOST[f.id];
  const H = f.host, art = FEST_ART[f.id] || (FEST_ART[f.id] = np_frames(H.o, H.pal)), p = gNear(H.at[0], H.at[1]);
  return (FEST_HOST[f.id] = { id: 'fest_' + f.id, key: 'fest_' + f.id, name: H.name, role: f.name, x: p.x, y: p.y, art, fest: f.id, greet: H.greet });
}
const FEST_SELLER = { id: 'fest_haendler', key: 'fest_haendler', name: 'Fahrender Händler Benedetto', role: 'aus Venedig', fest: 'ernte', festShop: true,
  greet: ['Seide, Gewürze, und Waffen aus Mailand! Nur heute, nur hier.', 'Benedetto handelt ehrlich. Meistens.'] };
/* Fest beginnt oder endet */
function festSync(){
  const f = festNow(), id = f ? f.id : null;
  if ((G.fest ? G.fest.id : null) === id) return;
  if (G.fest){
    for (const n of [festHost(G.fest), FEST_SELLER]){ const i = NPCS.indexOf(n); if (i >= 0) NPCS.splice(i, 1); }
    if (G.mode === 'play') logLine('Das ' + G.fest.name + ' ist vorbei. Die Leute gehen heim.', '#d8c69c');
    G.fest = null;
  }
  if (f){
    const B = FEST_OBJ[f.id + SEA.cur] || (FEST_OBJ[f.id + SEA.cur] = festBuild(f));
    G.fest = Object.assign({}, f, { cx: f.c[0] * WS, cy: f.c[1] * WS }, B);
    NPCS.push(festHost(f));
    if (f.id === 'ernte'){ if (!FEST_SELLER.art){ const p = gNear(2962, 2276); FEST_SELLER.x = p.x; FEST_SELLER.y = p.y; FEST_SELLER.art = np_frames({ robe:'long', hat:'barett', fur:true, chain:true, beard:true, hair:['h', 'j'] }, { 1:'#2a1438', 2:'#3e1e52', 3:'#562a6e', 4:'#703a8a', 5:'#2a1438', 6:'#3e1e52', 7:'#562a6e', 8:'#703a8a' }); } NPCS.push(FEST_SELLER); }
    if (G.mode === 'play'){ showBanner(f.name, 'heute ' + f.where); logLine('Heute ist ' + f.name + ' ' + f.where + ': Musik, Tanz, Speis und Trank, dazu ' + f.gameName + '.', '#ffd98a'); }
  }
  for (const s of LIFE_SPOTS) if (s.fest){ s.act = false; s.ents = []; s.cool = 0; }
}
/* Leute beim Fest: Tänzer im Kreis, Spielleute, Gäste, Fackelzug */
(() => {
  const add = o => { o.ents = []; o.act = false; o.cool = 0; LIFE_SPOTS.push(o); };
  const P = (x, y) => gPt({ x, y }), G4 = ['magd', 'baeuerin', 'bauer', 'knecht', 'buergerin', 'buerger'];
  // Maifest
  const mb = GPROPS.find(q => q.kind === 'maibaum'), mc = mb ? { x: mb.x, y: mb.y + 14 } : P(2470, 598);
  add({ p: 'dance', t: G4, cx: mc.x, cy: mc.y, x: mc.x, y: mc.y, r: 96, n: [10, 10], fest: 'mai' });
  for (const [x, y] of [[2424, 632], [2448, 636]]) add({ p: 'stand', t: ['spielmann'], ...gNear(x, y), dir: 'down', n: [1, 1], fest: 'mai', music: true });
  add({ p: 'walk', t: G4, ...P(2470, 650), r: 160, n: [3, 4], fest: 'mai' });
  // Johannisfeuer
  const jc = P(2200, 694);
  add({ p: 'dance', t: G4, cx: jc.x, cy: jc.y + 4, x: jc.x, y: jc.y, r: 118, n: [10, 10], fest: 'johannis' });
  add({ p: 'stand', t: ['spielmann'], ...gNear(2250, 736), dir: 'left', n: [1, 1], fest: 'johannis', music: true });
  add({ p: 'walk', t: G4, ...P(2200, 750), r: 160, n: [2, 3], fest: 'johannis' });
  // Markt: Erntedank und Weihnachtsmarkt
  for (const id of ['ernte', 'advent']){
    add({ p: 'stand', t: ['spielmann'], ...gNear(3040, 2336), dir: 'down', n: [1, 1], fest: id, music: true });
    add({ p: 'walk', t: G4, ...P(2966, 2320), r: 200, n: [4, 5], fest: id });
  }
  add({ p: 'dance', t: G4, cx: P(2966, 2318).x, cy: P(2966, 2318).y + 10, x: P(2966, 2318).x, y: P(2966, 2318).y, r: 92, n: [8, 8], fest: 'ernte' });
  const path = [[2872, 2278], [2966, 2238], [3086, 2290], [3070, 2384], [2966, 2398], [2868, 2360]].map(([x, y]) => P(x, y));
  let len = 0; const cum = [0]; for (let i = 0; i < path.length; i++){ const a = path[i], b = path[(i + 1) % path.length]; len += Math.hypot(b.x - a.x, b.y - a.y); cum.push(len); }
  add({ p: 'parade', t: ['buerger', 'buergerin', 'moench', 'magd', 'knecht', 'buerger'], x: path[0].x, y: path[0].y, path, cum, plen: len, n: [9, 9], fest: 'advent' });
})();
/* Bewegung der Festleute (aus lifePerson aufgerufen) */
function festPerson(e, dt){
  const s = e.spot;
  if (e.mode === 'dance'){
    e.ang += dt * .5;
    const nx = s.cx + Math.cos(e.ang) * s.r, ny = s.cy + Math.sin(e.ang) * s.r * .55;
    e.dir = VK_DIR(nx - e.x, ny - e.y); e.x = nx; e.y = ny; e.st = 'walk'; e.anim += dt * 6;
    return true;
  }
  if (e.mode === 'parade'){
    e.u = (e.u + dt * 20) % s.plen;
    let i = 0; while (i < s.path.length - 1 && s.cum[i + 1] < e.u) i++;
    const a = s.path[i], b = s.path[(i + 1) % s.path.length], t = (e.u - s.cum[i]) / Math.max(1, s.cum[i + 1] - s.cum[i]);
    const nx = a.x + (b.x - a.x) * t, ny = a.y + (b.y - a.y) * t;
    e.dir = VK_DIR(nx - e.x, ny - e.y); e.x = nx; e.y = ny; e.st = 'walk'; e.anim += dt * 4.5;
    e.torch = SKY.night > .25;
    return true;
  }
  return false;
}
/* Startplatz der Festleute (aus lifeMake) */
function festPlace(s, e, i, n){
  if (s.p === 'dance'){ e.ang = i / n * Math.PI * 2; e.x = s.cx + Math.cos(e.ang) * s.r; e.y = s.cy + Math.sin(e.ang) * s.r * .55; }
  if (s.p === 'parade'){ e.u = i / n * s.plen; festPerson(e, 0); }
}
/* ---------- Zeichnen ---------- */
function festList(cam, list){
  const F = G.fest;
  if (F && !G.inside) for (const o of F.objs) if (inView(o.x, o.y, cam, 120)) list.push({ y: o.y, d: () => ctx.drawImage(o.img, Math.round(o.x - o.ax), Math.round(o.y - o.ay)) });
  const g = G.fgame;
  if (g && g.kids) for (const c of g.kids) if (!c.gone) list.push({ y: c.y + .05, d: () => fgDrawKid(c) });
}
/* Wimpelketten und Laternenschnüre über den Köpfen; Noten über den Spielleuten */
function festOverlay(cam){
  const F = G.fest; if (!F || G.inside) return;
  for (const [a, b, lamp] of F.lines){
    if (Math.max(a.x, b.x) < cam.x - 20 || Math.min(a.x, b.x) > cam.x + W + 20) continue;
    const n = Math.max(4, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 6));
    for (let i = 0; i <= n; i++){
      const t = i / n, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * 22;
      ctx.fillStyle = '#3a2c1e'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (i % 2 || i === 0 || i === n) continue;
      if (lamp){ const on = SKY.night > .2; ctx.fillStyle = OUT; ctx.fillRect(Math.round(x) - 2, Math.round(y) + 1, 5, 5); ctx.fillStyle = on ? '#ffd36a' : '#c8902a'; ctx.fillRect(Math.round(x) - 1, Math.round(y) + 2, 3, 3); }
      else { const c = ['#b8281e', '#e8c040', '#2a4290', '#f2eee4', '#3e7230'][(i >> 1) % 5]; ctx.fillStyle = OUT; ctx.fillRect(Math.round(x) - 2, Math.round(y), 5, 2); ctx.fillRect(Math.round(x) - 1, Math.round(y) + 2, 3, 3); ctx.fillStyle = c; ctx.fillRect(Math.round(x) - 1, Math.round(y) + 1, 3, 1); ctx.fillRect(Math.round(x), Math.round(y) + 2, 1, 2); }
    }
  }
  if (!RM) for (const s of LIFE_SPOTS) if (s.music && s.act) for (const e of s.ents) if (inView(e.x, e.y, cam, 40)) drawNotes(e.x, e.y, true);
}
function drawNotes(x, y, on){
  for (let q = 0; q < 3; q++){
    const ph = (G.t * .55 + q / 3 + x * .001) % 1, nx = Math.round(x + 12 + Math.sin(G.t * 1.7 + q * 2) * 6 + ph * 8), ny = Math.round(y - 52 - ph * 34);
    ctx.globalAlpha = Math.min(1, (1 - ph) * 1.6); ctx.fillStyle = on ? '#ffd541' : '#e0c890';
    ctx.fillRect(nx, ny + 4, 3, 2); ctx.fillRect(nx + 2, ny, 1, 5); ctx.fillRect(nx + 3, ny, 2, 1);
  }
  ctx.globalAlpha = 1;
}
function festFlames(cam){
  const F = G.fest; if (!F || G.inside) return;
  for (const f of F.fires) if (inView(f.x, f.y, cam, 80)) for (let i = 0; i < 5; i++) flameHD(f.x - 16 + i * 8, f.y - (i === 2 ? 10 : i % 2 ? 5 : 0), G.t + i * .7, true);
}
function festLights(cam, L){
  const F = G.fest; if (!F || G.inside) return;
  for (const f of F.fires) L.push([f.x, f.y - 20, 340, 1, 1]);
  for (const [x, y, r, a] of F.lights) L.push([x, y, r, a, 1]);
}
function festParts(dt, cam){
  const F = G.fest; if (!F || G.inside || RM) return;
  for (const f of F.fires) if (inView(f.x, f.y, cam, 80) && G.parts.length < 420) for (let i = 0; i < 3; i++) if (Math.random() < dt * 14)
    G.parts.push({ x: f.x + rand(-14, 14), y: f.y - 14, vx: rand(-10, 10), vy: rand(-80, -40), life: rand(.6, 1.4), c: Math.random() < .5 ? '#e0782a' : '#ffd36a', g: -10, glow: true });
}
/* ---------- Spiele ---------- */
const EL = 20;                       // eine Elle in Feinpixeln (Steinstoßen)
function festReward(f, ok, extra){
  HERO.festDone = HERO.festDone || {};
  const key = festKey(), first = ok && !HERO.festDone[key];
  if (!ok){ logLine(extra || 'Diesmal nicht. Versucht es noch einmal!', '#d8c69c'); return; }
  const gold = first ? 20 + HERO.lvl * 3 : 4 + HERO.lvl;
  HERO.gold += gold; Sound.levelUp(); lwAdd(5);
  let txt = gold + ' Gulden';
  if (first){
    HERO.festDone[key] = true;
    const it = makeItem('kleinod', HERO.lvl + 1, 2, { name: f.prize }), i = HERO.inv.indexOf(null);
    if (i >= 0){ HERO.inv[i] = it; txt += ' und ' + f.prize; } else txt += ' (der Rucksack ist voll, der ' + f.prize + ' bleibt beim Gastgeber)';
  }
  showBanner(first ? 'Sieg beim ' + f.gameName : f.gameName, first ? 'Der Preis des Festes gehört Euch' : 'Noch einmal geschafft');
  logLine('Geschafft! ' + (extra ? extra + ' ' : '') + 'Lohn: ' + txt + '.', '#ffd98a');
  updateHud(); markDirty(true);
}
function startFgame(kind){
  const F = G.fest, k = G.knight; if (!F || G.fgame || !canAct()) return;
  if (HERO.riding){ HERO.riding = false; renderSkills(); }
  G.near = null; $('btnTalk').hidden = true; atkHeld = false; atkBtn = false;
  const g = { kind, f: F, t: 0, msg: '', msgT: 0, held: true };
  if (kind === 'klettern'){
    const mb = GPROPS.find(q => q.kind === 'maibaum');
    Object.assign(g, { px: mb.x + 2, py: mb.y + 3, stage: 0, max: 6, miss: 0, ph: 0, st: 'climb', H: mb.ay - 60 });
    k.x = g.px; k.y = g.py; k.dir = 'up';
  } else if (kind === 'springen'){
    Object.assign(g, { fx: F.fires[0].x, fy: F.fires[0].y + 12, round: 1, ok: 0, st: 'ready' });
    fgSpringRound(g);
  } else if (kind === 'stein'){
    const p = gNear(2858, 2312);
    Object.assign(g, { x0: p.x, y0: p.y, tries: 3, best: 0, st: 'ready', ph: 0, pw: 0, stone: null, marks: [] });
    k.x = p.x; k.y = p.y; k.dir = 'right';
  } else if (kind === 'schnee'){
    Object.assign(g, { time: 60, got: 0, balls: [], kids: [] });
    for (let i = 0; i < 3; i++){ const q = gRandWalk(F.cx, F.cy + 40, 60, 160) || { x: F.cx + (i - 1) * 60, y: F.cy + 60 }; g.kids.push({ x: q.x, y: q.y, hp: 3, cd: rand(1.5, 2.5), art: vkPerson('knecht', i), dir: 'down', anim: 0, tx: q.x, ty: q.y, hitT: 0, gone: false }); }
  }
  G.fgame = g; k.kbx = k.kby = 0; $('log').style.visibility = 'hidden';
  showBanner(F.name + ': ' + F.gameName, touchUI() ? 'Hieb drücken' : 'Leertaste drücken');
  Sound.horn(); markDirty();
}
function fgEnd(ok, extra){
  const g = G.fgame, k = G.knight; G.fgame = null; k.lift = 0; $('log').style.visibility = '';
  festReward(g.f, ok, extra);
  festRecordOf(g, ok);
  updateNear();
}
function fgSpringRound(g){
  const k = G.knight;
  g.st = 'ready'; g.t = .9; g.x = g.fx - 170; g.jump = null; g.zw = 44 - g.round * 9;
  k.x = g.x; k.y = g.fy; k.dir = 'right'; k.lift = 0;
}
function updateFgame(dt){
  const g = G.fgame, k = G.knight, press = atkHeld || atkBtn, edge = press && !g.held;
  g.held = press; g.t += 0; if (g.msgT > 0) g.msgT -= dt;
  const say = (m, c) => { g.msg = m; g.msgC = c || '#ffffff'; g.msgT = 1.4; };
  if (g.kind === 'klettern'){
    g.ph += dt * (2.2 + g.stage * .5); if (g.st === 'climb') g.clock = (g.clock || 0) + dt;
    const u = Math.sin(g.ph), w = .5 - g.stage * .06, target = g.H * g.stage / g.max;
    k.lift += (target - k.lift) * Math.min(1, dt * (g.st === 'fall' ? 10 : 4)); k.x = g.px; k.y = g.py; k.dir = 'up'; k.moving = Math.abs(target - k.lift) > 2; if (k.moving) k.anim += dt * 8;
    if (g.st === 'climb' && edge){
      if (Math.abs(u) < w){ g.stage++; Sound.tone(392 + g.stage * 60, .12, 'square', .03); say('Hinauf!', '#9fe08a'); if (g.stage >= g.max){ g.st = 'top'; g.t = 1.8; say('Der Kranz ist Euer!', '#ffd541'); Sound.cheer(.8); } }
      else { g.miss++; g.stage = Math.max(0, g.stage - 1); Sound.tone(200, .2, 'triangle', .04, -80); say('Abgerutscht!', '#ff9a8a'); if (g.miss >= 3){ g.st = 'fall'; g.stage = 0; g.t = 1.2; } }
    }
    if (g.st === 'top' || g.st === 'fall'){ g.t -= dt; if (g.st === 'top' && g.t < .6) g.stage = 0; if (g.t <= 0) return fgEnd(g.st === 'top', g.st === 'top' ? 'Ihr holt den Maienkranz von der Spitze.' : 'Ihr rutscht den Maibaum hinunter.'); }
  } else if (g.kind === 'springen'){
    const z0 = g.fx - 64, z1 = z0 + g.zw;
    if (g.st === 'ready'){ g.t -= dt; if (g.t <= 0) g.st = 'run'; }
    else if (g.st === 'run'){
      g.x += 135 * dt; k.moving = true; k.anim += dt * 9;
      if (edge){ if (g.x >= z0 && g.x <= z1){ g.st = 'jump'; g.j0 = g.x; g.mut = Math.round(100 * (g.x - z0) / g.zw); Sound.swing(); } else { g.st = 'fail'; g.t = 1.2; say(g.x < z0 ? 'Zu früh abgesprungen!' : 'Zu spät!', '#ff9a8a'); Sound.tone(180, .3, 'triangle', .04, -60); } }
      else if (g.x > g.fx - 30){ g.st = 'fail'; g.t = 1.2; say('Vor den Flammen gebremst!', '#ff9a8a'); }
    } else if (g.st === 'jump'){
      g.x += 170 * dt; const p = clamp((g.x - g.j0) / 128, 0, 1); k.lift = Math.sin(p * Math.PI) * 46; k.anim += dt * 4;
      if (p >= 1){ k.lift = 0; g.ok++; g.pts = (g.pts || 0) + (g.mut || 0); g.st = 'land'; g.t = 1; say('Geschafft! Mut ' + (g.mut || 0), '#9fe08a'); Sound.cheer(.7); }
    } else { g.t -= dt; k.moving = false; if (g.t <= 0){ if (g.round >= 3) return fgEnd(g.ok >= 2, g.ok + ' von 3 Sprüngen gelungen.'); g.round++; fgSpringRound(g); } }
    k.x = g.x; k.y = g.fy; k.dir = 'right';
  } else if (g.kind === 'stein'){
    k.x = g.x0; k.y = g.y0; k.dir = 'right';
    if (g.st === 'ready' && press && edge){ g.st = 'charge'; g.ph = 0; }
    if (g.st === 'charge'){
      g.ph += dt * 3.4; g.pw = (1 - Math.cos(g.ph)) / 2;
      if (!press){
        const d = Math.round((6 + g.pw * 7 + Math.min(1.5, HERO.lvl * .06) + rand(-.2, .2)) * 10) / 10;
        g.stone = { t: 0, d, x0: k.x + 8, y0: k.y - 30 }; g.st = 'fly'; k.atkT = .25; Sound.swing();
      }
    } else if (g.st === 'fly'){
      const s = g.stone; s.t += dt / .9;
      if (s.t >= 1){ g.marks.push(s.d); g.best = Math.max(g.best, s.d); g.tries--; Sound.drop(); say(s.d.toFixed(1).replace('.', ',') + ' Ellen' + (s.d > 12.5 ? ', neuer Rekord!' : ''), s.d > 12.5 ? '#ffd541' : '#ffffff'); g.st = 'wait'; g.t = 1.2; if (s.d > 12.5) Sound.cheer(1); }
    } else if (g.st === 'wait'){ g.t -= dt; if (g.t <= 0){ g.stone = null; if (g.tries <= 0) return fgEnd(g.best > 12.5, 'Bester Wurf: ' + g.best.toFixed(1).replace('.', ',') + ' Ellen.'); g.st = 'ready'; } }
  } else if (g.kind === 'schnee'){
    g.time -= dt; updateKnight(dt);
    for (const c of g.kids){
      if (c.gone) continue;
      c.hitT -= dt; c.cd -= dt;
      const dx = k.x - c.x, dy = k.y - c.y, d = Math.hypot(dx, dy) || 1;
      if (Math.hypot(c.tx - c.x, c.ty - c.y) < 6 || Math.random() < dt * .3){ const a = Math.atan2(c.y - k.y, c.x - k.x) + rand(-1.2, 1.2), r = rand(100, 170); const q = { x: k.x + Math.cos(a) * r, y: k.y + Math.sin(a) * r * .7 }; if (Math.hypot(q.x - g.f.cx, q.y - g.f.cy) < 260 && !blocked(q.x, q.y)){ c.tx = q.x; c.ty = q.y; } }
      const mx = c.tx - c.x, my = c.ty - c.y, ml = Math.hypot(mx, my);
      if (ml > 3){ const sp = c.hitT > 0 ? 90 : 55, nx = c.x + mx / ml * sp * dt, ny = c.y + my / ml * sp * dt; if (!blocked(nx, ny)){ c.x = nx; c.y = ny; } c.dir = VK_DIR(mx, my); c.anim += dt * 7; c.mv = true; } else { c.mv = false; c.dir = VK_DIR(dx, dy); }
      if (c.cd <= 0 && d < 260){ c.cd = rand(1.4, 2.4); const a = Math.atan2(dy - 20, dx) + rand(-.12, .12); g.balls.push({ x: c.x, y: c.y - 24, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, life: 1.6, kid: true }); }
    }
    for (let i = g.balls.length - 1; i >= 0; i--){
      const b = g.balls[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      let hit = false;
      if (b.kid && Math.hypot(b.x - k.x, b.y - (k.y - 22)) < 13){ g.got++; hit = true; say('Platsch!', '#c8dcff'); Sound.splat(); }
      if (!b.kid) for (const c of g.kids) if (!c.gone && Math.hypot(b.x - c.x, b.y - (c.y - 22)) < 13){
        c.hp--; c.hitT = 1; hit = true; Sound.splat();
        if (c.hp <= 0){ c.gone = true; say('„Ich ergebe mich!“', '#9fe08a'); } else say('Getroffen!', '#9fe08a');
        break;
      }
      if (hit || b.life <= 0 || blocked(b.x, b.y + 24)){ for (let j = 0; j < 6; j++) G.parts.push({ x: b.x, y: b.y, vx: rand(-40, 40), vy: rand(-50, 0), life: .4, c: '#f4f8fc', g: 160 }); g.balls.splice(i, 1); }
    }
    if (g.kids.every(c => c.gone)) return fgEnd(true, 'Die Lehrbuben ergeben sich lachend.');
    if (g.got >= 10) return fgEnd(false, 'Ihr seid weiß wie ein Schneemann. Die Lehrbuben jubeln.');
    if (g.time <= 0) return fgEnd(false, 'Die Zeit ist um.');
  }
}
/* Schneeball werfen (Hieb während der Schneeballschlacht) */
function fgThrow(){
  const g = G.fgame, k = G.knight; if (!g || g.kind !== 'schnee' || (g.tc || 0) > G.t) return;
  g.tc = G.t + .35;
  const [fx, fy] = DIRV[k.dir]; g.balls.push({ x: k.x + fx * 8, y: k.y - 24 + fy * 4, vx: fx * 260, vy: fy * 260, life: 1.2, kid: false });
  Sound.swing(); k.atkT = .2;
}
function fgDrawKid(c){
  const A = c.art, img = c.mv ? A[c.dir][(c.anim | 0) % 4] : A.stand[c.dir] || A.stand.down;
  ctx.drawImage(img, Math.round(c.x - A.ax), Math.round(c.y - A.ay));
  if (c.hitT > 0){ ctx.fillStyle = '#f4f8fc'; ctx.fillRect(Math.round(c.x) - 3, Math.round(c.y - A.ay) + 6, 7, 3); }
}
/* Spiele in der Welt (Stein, Schneebälle, Kranz an der Spitze) und Anzeige oben */
function drawFgameWorld(cam){
  const g = G.fgame; if (!g) return;
  if (g.kind === 'stein'){
    for (let e = 6; e <= 16; e += 2){ const x = g.x0 + 8 + e * EL; ctx.fillStyle = 'rgba(240,232,200,.6)'; ctx.fillRect(Math.round(x), Math.round(g.y0) - 6, 1, 10); drawText(e + '', x, g.y0 + 6, '#f0e8c8'); }
    const rx = g.x0 + 8 + 12.5 * EL; ctx.fillStyle = '#b8281e'; ctx.fillRect(Math.round(rx), Math.round(g.y0) - 22, 1, 22); ctx.fillRect(Math.round(rx) + 1, Math.round(g.y0) - 22, 7, 5); drawText('Hans', rx, g.y0 - 36, '#ffb0a0');
    for (const d of g.marks){ const x = g.x0 + 8 + d * EL; ctx.fillStyle = '#16120f'; ctx.fillRect(Math.round(x) - 3, Math.round(g.y0) - 2, 7, 4); ctx.fillStyle = '#8a8478'; ctx.fillRect(Math.round(x) - 2, Math.round(g.y0) - 2, 5, 3); }
    if (g.stone){ const s = g.stone, x = s.x0 + (s.d * EL) * s.t, y = s.y0 + (g.y0 - s.y0) * s.t - Math.sin(s.t * Math.PI) * 60; shadow(x, g.y0 - 1, 6, .3); ctx.fillStyle = '#16120f'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 7, 7); ctx.fillStyle = '#9a948a'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5); }
  }
  if (g.kind === 'schnee') for (const b of g.balls){ ctx.fillStyle = 'rgba(18,16,22,.18)'; ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) + 22, 5, 2); ctx.fillStyle = '#16120f'; ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 2, 5, 5); ctx.fillStyle = '#f4f8fc'; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 3, 3); }
  if (g.kind === 'klettern' && g.st !== 'top' && g.stage < g.max){ const y = g.py - g.H - 34 + Math.sin(G.t * 2) * 2; ctx.fillStyle = '#3e7230'; ctx.fillRect(Math.round(g.px) - 9, Math.round(y), 18, 4); ctx.fillStyle = '#e8c040'; ctx.fillRect(Math.round(g.px) - 6, Math.round(y) + 1, 3, 2); ctx.fillStyle = '#b8281e'; ctx.fillRect(Math.round(g.px) + 3, Math.round(y) + 1, 3, 2); }
}
function drawFgameUI(){
  const g = G.fgame; if (!g) return;
  const head = g.f.gameName, info = g.kind === 'klettern' ? 'Höhe ' + g.stage + ' von ' + g.max + ',  daneben ' + g.miss + ' von 3' : g.kind === 'springen' ? 'Sprung ' + g.round + ' von 3,  gelungen ' + g.ok
    : g.kind === 'stein' ? 'Würfe übrig ' + g.tries + ',  bester ' + (g.best ? g.best.toFixed(1).replace('.', ',') : '–') + ' Ellen,  Rekord 12,5' : 'Zeit ' + Math.ceil(g.time) + ',  Lehrbuben ' + g.kids.filter(c => !c.gone).length + ',  getroffen ' + g.got + ' von 10';
  ctx.fillStyle = 'rgba(16,14,20,.62)'; ctx.fillRect(W / 2 - 170, 6, 340, 34);
  drawText(head, W / 2, 9, '#ffd98a'); drawText(info, W / 2, 24, '#ffffff');
  const btnTxt = touchUI() ? $('btnAtk').textContent : 'Leertaste';
  if (g.kind === 'klettern' && g.st === 'climb'){
    const u = Math.sin(g.ph), w = .5 - g.stage * .06, bx = W - 40, by = H / 2 - 70, bh = 140;
    ctx.fillStyle = OUT; ctx.fillRect(bx - 2, by - 2, 18, bh + 4); ctx.fillStyle = '#4a4650'; ctx.fillRect(bx, by, 14, bh);
    ctx.fillStyle = '#5a9a4a'; ctx.fillRect(bx, Math.round(by + (1 - w) / 2 * bh), 14, Math.round(w * bh));
    const my = Math.round(by + (1 - u) / 2 * bh); ctx.fillStyle = '#ffffff'; ctx.fillRect(bx - 6, my - 1, 26, 3);
    drawText(btnTxt + ' im grünen Feld!', W / 2, H * .7, '#ffffff', 'c', 1.5);
  }
  if (g.kind === 'springen' && (g.st === 'run' || g.st === 'ready')){
    const bx = W / 2 - 120, by = H * .78, bw = 240, x0 = g.fx - 170, span = 150, z0 = g.fx - 64;
    ctx.fillStyle = OUT; ctx.fillRect(bx - 2, by - 2, bw + 4, 14); ctx.fillStyle = '#4a4650'; ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = '#e8c040'; ctx.fillRect(Math.round(bx + (z0 - x0) / span * bw), by, Math.round(g.zw / span * bw), 10);
    ctx.fillStyle = '#c8401c'; ctx.fillRect(Math.round(bx + (g.fx - 30 - x0) / span * bw), by, bw - Math.round((g.fx - 30 - x0) / span * bw), 10);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(bx + clamp((g.x - x0) / span, 0, 1) * bw) - 1, by - 4, 3, 18);
    drawText(g.st === 'ready' ? 'Anlauf …' : btnTxt + ' im gelben Feld: springen!', W / 2, by - 22, '#ffffff', 'c', 1.5);
  }
  if (g.kind === 'stein' && (g.st === 'ready' || g.st === 'charge')){
    const bx = W / 2 - 100, by = H * .78, bw = 200;
    ctx.fillStyle = OUT; ctx.fillRect(bx - 2, by - 2, bw + 4, 14); ctx.fillStyle = '#4a4650'; ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = '#5a9a4a'; ctx.fillRect(bx + bw * .85, by, bw * .15, 10);
    ctx.fillStyle = '#e8c040'; ctx.fillRect(bx, by, Math.round(bw * g.pw), 10);
    drawText(g.st === 'ready' ? btnTxt + ' gedrückt halten …' : '… und loslassen, wenn der Balken voll ist!', W / 2, by - 22, '#ffffff', 'c', 1.5);
  }
  if (g.kind === 'schnee' && g.time > 56) drawText(btnTxt + ': Schneeball werfen', W / 2, H * .7, '#ffffff', 'c', 1.5);
  if (g.msgT > 0) drawText(g.msg, W / 2, H * .3, g.msgC, 'c', 1.5);
}
/* Gastgeber: Spiel, Speis und Trank; Händler beim Erntedank */
function festTalk(n, opts){
  const F = G.fest; if (!F || F.id !== n.fest) return;
  if (n.festShop){ opts.append(btn('Waren ansehen', () => renderTalk('festshop'), 'opt')); return; }
  const done = HERO.festDone && HERO.festDone[festKey()];
  opts.append(btn(F.gameName + (done ? ' (Preis schon gewonnen)' : ' (Preis: ' + F.prize + ')'), () => { G.greet = F.gameText; renderTalk('festgame'); }, 'opt'));
  for (const fa of FARE.filter(x => x.fest === F.id)){ const b = btn((fa.kind === 'speise' ? 'Essen: ' : 'Trinken: ') + fa.n + ' (' + farePrice(fa) + ' Gulden)', () => { eatFare(fa); renderTalk('main'); }, 'opt'); b.disabled = HERO.gold < farePrice(fa); opts.append(b); }
}
function festTalkView(view, body, opts){
  const F = G.fest;
  if (view === 'festgame'){
    const rec = festBest(F.game);
    $('talkText').textContent = F.gameText + (rec ? ' Rekord aller Ritter: ' + rec.nm + ', ' + FREC_BY[F.game].fmt(rec.v) + '.' : '');
    opts.append(btn('Mitmachen', () => { closePanel(); startFgame(F.game); }, 'opt'), btn('Zurück', () => renderTalk('main'), 'tbtn'));
  } else {
    // Händler: zwei Stücke je Fest
    const key = festKey();
    if (!G.festShop || G.festShop.key !== key) G.festShop = { key, items: [makeItem(pick(SLOTS), HERO.lvl + 1, 2), makeItem(pick(SLOTS), HERO.lvl + 2, 3)] };
    $('talkText').textContent = 'Ihr habt ' + HERO.gold + ' Gulden. Benedetto zeigt, was er aus Mailand und Venedig mitgebracht hat.';
    G.festShop.items.forEach((it, j) => {
      if (!it) return;
      const r = el('div', 'shoprow'), ic = el('img'); ic.src = itemUrl(it); ic.alt = ''; ic.style.boxShadow = '0 0 0 2px ' + RARITY[it.r].c;
      const t = el('div', 'stx'), nm = el('b', null, itemName(it)); nm.style.color = RARITY[it.r].c;
      t.append(nm, el('small', null, 'Stufe ' + it.il + ' · ' + itemLines(it).join(' · ')));
      const price = it.v * 3, b = btn('Kaufen für ' + price, () => {
        const i = HERO.inv.indexOf(null); if (HERO.gold < price || i < 0) return;
        HERO.gold -= price; HERO.inv[i] = it; G.festShop.items[j] = null; Sound.coin(); logItem('Gekauft: ', it); updateHud(); markDirty(true); renderTalk('festshop');
      }, 'tbtn');
      b.disabled = HERO.gold < price || HERO.inv.indexOf(null) < 0;
      r.append(ic, t, b); body.append(r);
    });
    if (!G.festShop.items.some(Boolean)) body.append(el('p', 'hint', 'Ausverkauft. Beim nächsten Erntedank bringt Benedetto Neues.'));
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
  }
  body.append(opts);
}
