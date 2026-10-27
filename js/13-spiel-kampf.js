"use strict";
/* Der Apfelritter, Teil 13 von 27: Spielzustand, Eingabe, Monster, Kampf, Jagd, Erfahrung, Aktualisierung.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */
/* ============ Spielzustand der Sitzung ============ */
const KS = KNIGHT_SIZE, KBODY = Math.round(KS.ay * .45), SWING = .3;
function freshKnight(x, y){
  return { x, y, dir:'down', anim:0, moving:false, inv:0, dust:0, hp:1, slowT:0,
    atkT:0, atkLen:SWING, atkCd:0, swing:0, swA0:0, swA1:0, kbx:0, kby:0, mult:1, bashT:0, bx:0, by:0 };
}
function freshState(mode){
  DG_ON = null;
  const p = HERO ? { x: HERO.x, y: HERO.y } : GSTART;
  lifeReset();
  return {
    v:5, mode, t:0, shake:0, flash:0, dieT:0, fogX:0, zone: gZone(p.x, p.y).id,
    knight: freshKnight(p.x, p.y),
    mons:[], rising:[], shots:[], parts:[], floats:[], loot:[],
    cd:{ rund:0, stoss:0, ruf:0, trank:0, lanze:0 }, buffT:0, combatT:99, inside:null, near:null, nearDoor:null, nearExit:false, spawnT:0, saveT:0, fullMsgT:0, lostGold:0,
    travel:[], flocks:[], falter:[], flutter:[], prints:[], lifeSayT:0, lifeT:0
  };
}
let G = null;
const camOf = k => DG_ON ? dgCam(k) : G.scene && G.scene.cam ? stCam() : ({ x: Math.round(clamp(k.x - W / 2, 0, GW - W)), y: Math.round(clamp(k.y - 22 - H / 2, 0, GH - H)) });

/* Kollision über das Weltraster */
const blocked = (x, y, wade) => gBlocked(x - 6, y - 5, x + 6, y, wade);
function pushOut(m, wade){
  if (!blocked(m.x, m.y, wade)) return;
  for (let r = 2; r <= 24; r += 2) for (let a = 0; a < 8; a++){
    const nx = m.x + Math.cos(a * Math.PI / 4) * r, ny = m.y + Math.sin(a * Math.PI / 4) * r;
    if (!blocked(nx, ny, wade)){ m.x = nx; m.y = ny; return; }
  }
}
/* Ausweichen: ist der Weg versperrt, seitlich daran vorbei */
function steer(m, mvx, mvy, wade){
  const sp = Math.hypot(mvx, mvy);
  if (sp < 1) return [mvx, mvy];
  const ux = mvx / sp, uy = mvy / sp;
  if (!blocked(m.x + ux * 12, m.y + uy * 12, wade)){
    if (!m.av) return [mvx, mvy];
    if (--m.avT <= 0){ m.av = 0; return [mvx, mvy]; }
  } else {
    if (!m.av){
      const l = !blocked(m.x - uy * 14, m.y + ux * 14, wade), r = !blocked(m.x + uy * 14, m.y - ux * 14, wade);
      m.av = l && !r ? 1 : r && !l ? -1 : (Math.random() < .5 ? 1 : -1);
    }
    m.avT = 24;
  }
  const px = -uy * m.av, py = ux * m.av, nx = px * .9 + ux * .25, ny = py * .9 + uy * .25, nl = Math.hypot(nx, ny);
  return [nx / nl * sp, ny / nl * sp];
}

/* Objekte der Welt in ein grobes Raster einsortieren, damit nur Sichtbares gezeichnet wird */
const PCELL = 512, PCOLS = Math.ceil(GW / PCELL), PROWS = Math.ceil(GH / PCELL);
const propGrid = Array.from({ length: PCOLS * PROWS }, () => []);
GPROPS.forEach((p, i) => {
  p.shake = p.shake || 0;
  const c = clamp(p.x / PCELL | 0, 0, PCOLS - 1), r = clamp(p.y / PCELL | 0, 0, PROWS - 1);
  propGrid[r * PCOLS + c].push(i);
});
function propsInView(cam){
  const out = [], c0 = Math.max(0, (cam.x - 300) / PCELL | 0), c1 = Math.min(PCOLS - 1, (cam.x + W + 300) / PCELL | 0);
  const r0 = Math.max(0, (cam.y - 80) / PCELL | 0), r1 = Math.min(PROWS - 1, (cam.y + H + 560) / PCELL | 0);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) for (const i of propGrid[r * PCOLS + c]){
    const p = GPROPS[i];
    if (p.x - p.ax > cam.x + W || p.x - p.ax + p.img.width < cam.x || p.y - p.ay > cam.y + H || p.y - p.ay + p.img.height < cam.y) continue;
    out.push(p);
  }
  return out;
}
function burst(x, y, colors, n, spd = 70, glow){
  for (let i = 0; i < n; i++){
    const a = rand(0, Math.PI * 2), s = rand(spd * .4, spd);
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: rand(.35, .8), c: colors[i % colors.length], g: 160, glow: !!glow });
  }
}
/* schwebende Zahlen und Worte; s = Vergrößerung */
function floatText(x, y, txt, c, s, life){
  // frische Schriften an derselben Stelle stapeln, damit nichts übereinander liegt
  for (const f of G.floats) if (Math.abs(f.x - x) < 40 && Math.abs(f.y - y) < 12 && f.max - f.life < .35) y = f.y - 13 * (f.s || 1);
  G.floats.push({ x, y, txt: String(txt), c, s: s || 1, life: life || .9, max: life || .9 });
}

/* ============ Eingabe ============ */
const keys = new Set();
let padVec = { x: 0, y: 0 }, atkHeld = false, atkBtn = false;
function inputVec(){
  let x = padVec.x, y = padVec.y;
  if (keys.has('left')) x -= 1;
  if (keys.has('right')) x += 1;
  if (keys.has('up')) y -= 1;
  if (keys.has('down')) y += 1;
  x = clamp(x, -1, 1); y = clamp(y, -1, 1);
  const l = Math.hypot(x, y);
  return l ? { x: x / l, y: y / l } : { x: 0, y: 0 };
}
const DIRV = { right:[1, 0], left:[-1, 0], down:[0, 1], up:[0, -1] };

/* ============ Lindwurm: Glieder folgen der Spur des Kopfes ============ */
const WURM_PARTS = BOSS_ART.lindwurm.segs.concat(BOSS_ART.lindwurm.tail ? [BOSS_ART.lindwurm.tail] : []);
const WURM_STEP = 3, WURM_OFF = (() => { const o = []; let acc = 0, prev = 34; for (const s of WURM_PARTS){ acc += (prev / 2 + s.w / 2) * .62; o.push(Math.round(acc / WURM_STEP)); prev = s.w; } return o; })();
function wurmSegs(m){
  const tr = m.trail || [], out = [];
  (m.parts || WURM_PARTS).forEach((s, i) => {
    const p = tr[tr.length - 1 - WURM_OFF[i]];
    if (p) out.push({ x: p[0], y: p[1], cy: p[1] - s.h * .45, r: s.w / 2, s });
  });
  return out;
}

/* ============ Monster: Lager, Wachen, Verfolgen, Heimkehr ============ */
let monSeq = 0;
function createMonster(kind, x, y, lvl, slot){
  const d = MON[kind];
  const m = { k: kind, x, y, y0: y, hx: x, hy: y, lvl, slot: slot || null, zone: slot ? slot.zone : (BOSSES[kind] ? BOSSES[kind].zone : gZone(x, y).id),
    hp: monHp(kind, lvl), max: 0, vx: 0, vy: 0, t: rand(0, 6), st: 'idle', sT: 0, dir: Math.random() < .5 ? 1 : -1, fl: 0, hitBy: -1,
    ax: 0, ay: 0, loot: [], av: 0, avT: 0, rl: rand(1, 2), spd: d.spd, mode: 'idle', wT: rand(.5, 3), tx: x, ty: y, walking: false,
    alpha: 1, stunT: 0, backT: 0, uid: ++monSeq, seen: 0 };
  m.max = m.hp;
  if (kind === 'lindwurm') m.trail = [];
  if (aiK(kind) === 'rabe' || aiK(kind) === 'irrlicht'){ m.y = y - 24; m.hy = y; }
  G.mons.push(m);
  return m;
}
const aggroRange = (m, T) => m.ev || m.story ? 240 : MON[m.k].boss ? 130 : clamp(95 + (m.lvl - (T && T !== G.knight ? T.lv : HERO.lvl)) * 9, 45, 150);
const leashOf = m => MON[m.k].boss ? 420 : 520;
function engage(m, social){
  if (m.mode === 'fight' || m.mode === 'back') return;
  m.mode = 'fight'; m.t = 0; m.walking = false;
  const ai = aiK(m.k);
  m.st = { raubritter:'walk', tod:'wind', rabe:'circle' }[ai] || 'go';
  m.sT = ai === 'raubritter' ? 1.5 : m.k === 'lindwurm' ? 2 : ai === 'tod' ? .7 : ai === 'rabe' ? rand(1.2, 2) : 0;
  if (!social){
    if (m.k === 'werwolf' || m.k === 'wolf') Sound.howl(); else if (ai === 'rabe') Sound.caw(); else if (ai === 'ratte') Sound.squeak(); else if (m.k === 'rotbart') Sound.horn();
    if (MON[m.k].boss){ Sound.horn(); G.flash = .3; showBanner(m.nm || MON[m.k].name, 'Stufe ' + m.lvl + ' · Anführer'); }
    for (const o of G.mons) if (o !== m && o.mode === 'idle' && !MON[o.k].boss && Math.hypot(o.x - m.x, o.y - m.y) < 80) engage(o, true);
  }
}
/* Heimkehr: das Monster lässt ab, läuft zu seinem Lager und heilt sich */
function goHome(m){
  if (m.mode === 'back') return;
  m.mode = 'back'; m.st = 'idle'; m.backT = 0; m.stunT = 0; m.walking = true;
  if (aiK(m.k) === 'tod'){ m.st = 'fade'; m.sT = .5; }
}
function idleMove(m, dt){
  const d = MON[m.k];
  if (d.fly){
    const ai = aiK(m.k);
    if (ai === 'rabe'){ const a = m.t * .9 + m.uid; m.dir = Math.cos(a + 1.57) > 0 ? -1 : 1; return [(m.hx + Math.cos(a) * 34 - m.x) * 2, (m.hy - 30 + Math.sin(a) * 10 - m.y) * 2]; }
    if (ai === 'irrlicht') return [(m.hx + Math.cos(m.t * .7) * 20 - m.x) * 1.5, (m.hy - 22 + Math.sin(m.t * 1.3) * 8 - m.y) * 1.5];
    if (ai === 'tod'){ m.alpha = Math.min(1, (m.alpha == null ? 1 : m.alpha) + dt); return [(m.hx - m.x) * 2, (m.hy - 20 + Math.sin(m.t) * 3 - m.y) * 2]; }
  }
  m.wT -= dt;
  if (m.walking){
    const dx = m.tx - m.x, dy = m.ty - m.y, l = Math.hypot(dx, dy);
    if (l < 4 || m.wT <= 0){ m.walking = false; m.march = false; m.wT = rand(1.5, 4.5); return [0, 0]; }
    const sp = Math.max(14, (d.spd || 30) * (m.march ? 1.1 : .4));
    if (Math.abs(dx) > 1) m.dir = dx > 0 ? 1 : -1;
    return [dx / l * sp, dy / l * sp];
  }
  if (m.wT <= 0){
    const p = gRandWalk(m.hx, m.hy, 8, 48);
    if (p && !(d.wade ? false : blocked(p.x, p.y))){ m.tx = p.x; m.ty = p.y; m.walking = true; m.wT = 4; }
    else m.wT = rand(1, 3);
  }
  return [0, 0];
}

function aiMove(m, dt, k, dx, dy, dist){
  let mvx = 0, mvy = 0;
  const toK = s => [dx / dist * s, dy / dist * s], dmg = monDmg(m.k, m.lvl);
  switch (aiK(m.k)){
    case 'wieder': case 'moor': {
      [mvx, mvy] = toK(m.spd * 1.15); mvy += Math.sin(m.t * 3) * 9; break;
    }
    case 'ratte': {
      const a = Math.atan2(dy, dx) + Math.sin(m.t * 7 + m.x) * .8;
      mvx = Math.cos(a) * m.spd; mvy = Math.sin(a) * m.spd; break;
    }
    case 'pluend': {
      m.sT -= dt;
      const reach = (artOf(m.k).reach || artOf('pluend').reach || 36), fast = !!MON[m.k].boss;
      if (m.st === 'go'){
        const side = m.x < k.x ? 1 : -1, gx = k.x - side * (reach - 4), gy = k.y, gdx = gx - m.x, gdy = gy - m.y, gl = Math.hypot(gdx, gdy) || 1;
        if (gl > 3){ mvx = gdx / gl * m.spd * 1.2; mvy = gdy / gl * m.spd * 1.2; }
        m.dir = side;
        if (Math.abs(m.y - k.y) < 10 && Math.abs(m.x - k.x) < reach + 12 && m.t > (fast ? .3 : .6)){ m.st = 'aim'; m.sT = fast ? .38 : .5; }
      } else if (m.st === 'aim'){ if (m.sT <= 0){ m.st = 'thrust'; m.sT = .22; Sound.swing(); m.hitK = false; } }
      else if (m.st === 'thrust'){
        const fwd = (k.x - m.x) * m.dir;
        if (!m.hitK && fwd > 2 && fwd < reach + 8 && Math.abs(k.y - m.y) < 13){ m.hitK = hitT(k, m, dmg * 1.2); }
        if (m.sT <= 0){ m.st = 'rest'; m.sT = fast ? .45 : .7; }
      } else if (m.sT <= 0){ m.st = 'go'; m.t = 0; }
      break;
    }
    case 'armbrust': {
      m.rl -= dt; m.sT -= dt;
      if (m.st === 'go'){
        if (dist < 110) [mvx, mvy] = toK(-m.spd);
        else if (dist > 180) [mvx, mvy] = toK(m.spd);
        else { const s = Math.sign(Math.sin(m.t * .7)) || 1; mvx = -dy / dist * m.spd * .5 * s; mvy = dx / dist * m.spd * .5 * s; }
        m.dir = dx > 0 ? 1 : -1;
        if (m.rl <= 0 && dist < 280){ m.st = 'aim'; m.sT = .9; }
      } else if (m.st === 'aim'){
        m.dir = dx > 0 ? 1 : -1;
        const mz = muzzleOf(m);
        if (m.sT > .3){ const ty = k.y - KBODY, l = Math.hypot(k.x - mz.x, ty - mz.y) || 1; m.ax = (k.x - mz.x) / l; m.ay = (ty - mz.y) / l; }
        if (m.sT <= 0){
          const gun = !!artOf(m.k).gun;
          G.shots.push({ x: mz.x, y: mz.y, vx: m.ax * (gun ? 330 : 240), vy: m.ay * (gun ? 330 : 240), life: 2.2, k: gun ? 'ball' : 'bolt', h: mz.h, dmg, from: m });
          if (gun){ Sound.gun(); for (let i = 0; i < 7; i++) G.parts.push({ x: mz.x + m.ax * 6, y: mz.y + m.ay * 6, vx: m.ax * rand(10, 40) + rand(-12, 12), vy: m.ay * rand(10, 40) - rand(6, 20), life: rand(.6, 1.1), c: i < 2 ? '#ffd060' : '#bcb8b0', g: -10, s: 1 }); }
          else Sound.bolt();
          m.rl = rand(2, 2.7) * (gun ? 1.25 : 1); m.st = 'shot'; m.sT = .25;
        }
      } else if (m.st === 'shot'){ if (m.sT <= 0) m.st = 'go'; }
      break;
    }
    case 'werwolf': {
      m.sT -= dt;
      const wl = !!MON[m.k].boss;
      if (m.st === 'go'){ [mvx, mvy] = toK(m.spd * 1.1); if (dist < (wl ? 150 : 100) && m.t > (wl ? 1.6 : 1)){ m.st = 'aim'; m.sT = wl ? .9 : .6; } }
      else if (m.st === 'aim'){ if (m.sT > .25){ m.ax = dx / dist; m.ay = dy / dist; m.dir = dx > 0 ? 1 : -1; } if (m.sT <= 0){ m.st = 'dash'; m.sT = wl ? .55 : .42; if (wl){ Sound.hit(); G.shake = .2; } else Sound.howl(); } }
      else if (m.st === 'dash'){ mvx = m.ax * (wl ? 260 : 290); mvy = m.ay * (wl ? 260 : 290); if (m.sT <= 0){ m.st = 'rest'; m.sT = wl ? 1.1 : .7; } }
      else if (m.sT <= 0){ m.st = 'go'; m.t = 0; }
      break;
    }
    case 'rabe': {
      // kreist über dem Ritter und stößt herab
      m.sT -= dt;
      const ty = k.y - KBODY;
      if (m.st === 'circle'){
        const a = m.t * 1.6 + m.uid, gx = k.x + Math.cos(a) * 64, gy = ty - 26 + Math.sin(a) * 22;
        mvx = (gx - m.x) * 2.4; mvy = (gy - m.y) * 2.4; m.dir = mvx > 0 ? 1 : -1;
        if (m.sT <= 0){ m.st = 'dive'; m.sT = .55; const l = Math.hypot(k.x - m.x, ty - m.y) || 1; m.ax = (k.x - m.x) / l; m.ay = (ty - m.y) / l; Sound.caw(); }
      } else if (m.st === 'dive'){
        mvx = m.ax * 210; mvy = m.ay * 210; m.dir = m.ax > 0 ? 1 : -1;
        if (m.sT <= 0){ m.st = 'circle'; m.sT = rand(1.6, 2.6); }
      }
      break;
    }
    case 'irrlicht': {
      let target = null, bd = 1e9;
      if (m.loot.length < 5) for (const a of G.loot){
        if (a.z > 0) continue;
        const dd = Math.hypot(a.x - m.x, a.y - 6 - m.y);
        if (dd < bd && dd < 240){ bd = dd; target = a; }
      }
      const gx = target ? target.x : k.x, gy = target ? target.y - 6 : k.y - KBODY;
      const ddx = gx - m.x, ddy = gy - m.y, dl = Math.hypot(ddx, ddy) || 1, sp = target ? m.spd * 1.2 : m.spd * .9;
      mvx = ddx / dl * sp + Math.cos(m.t * 2.3) * 24; mvy = ddy / dl * sp + Math.sin(m.t * 3.1) * 24;
      if (target && dl < 8){
        G.loot.splice(G.loot.indexOf(target), 1); m.loot.push(target);
        burst(target.x, target.y - 6, ['#6fe8b0', '#ecd27a'], 6, 35, true);
      }
      break;
    }
    case 'raubritter': {
      m.sT -= dt;
      if (m.st === 'walk'){ [mvx, mvy] = toK(m.spd); m.dir = dx > 0 ? 1 : -1; if (m.sT <= 0){ m.st = 'wind'; m.sT = .8; } }
      else if (m.st === 'wind'){
        if (m.sT > .3){ m.ax = dx / dist; m.ay = dy / dist; m.dir = dx > 0 ? 1 : -1; }
        else if (!m.locked){ m.locked = true; Sound.horn(); }
        if (m.sT <= 0){ m.st = 'charge'; m.sT = .9; m.locked = false; m.hitK = false; }
      } else if (m.st === 'charge'){
        mvx = m.ax * 240; mvy = m.ay * 240;
        if (m.sT <= 0 || blocked(m.x + m.ax * 14, m.y + m.ay * 14)){ m.st = 'stun'; m.sT = 1.3; G.shake = .25; Sound.hit(); }
      } else if (m.st === 'stun'){ if (m.sT <= 0){ m.st = 'walk'; m.sT = rand(2.2, 3.4); } }
      break;
    }
    case 'lindwurm': {
      m.sT -= dt;
      const fast = m.hp <= m.max / 2 ? 1.3 : 1;
      if (m.st === 'go'){
        const a = Math.atan2(dy, dx) + Math.sin(m.t * 2.2) * .6;
        mvx = Math.cos(a) * m.spd * fast; mvy = Math.sin(a) * m.spd * fast;
        if (m.sT <= 0 && dist < 300){ m.st = 'breath'; m.sT = .9; }
      } else if (m.st === 'breath'){
        if (m.sT > .3){ m.ax = dx / dist; m.ay = dy / dist; }
        if (m.sT <= 0){
          const n = fast > 1 ? 7 : 5, base = Math.atan2(m.ay, m.ax), mz = mouthOf(m);
          for (let i = 0; i < n; i++){ const a = base + (i - (n - 1) / 2) * .16; G.shots.push({ x: mz.x, y: mz.y, vx: Math.cos(a) * 155, vy: Math.sin(a) * 155, life: 2.4, k:'fire', h: mz.h, dmg: dmg * .55, from: m }); }
          Sound.fire(); m.st = 'go'; m.sT = rand(3.5, 4.6);
        }
      }
      m.dir = (m.st === 'breath' ? m.ax : mvx) >= 0 ? 1 : -1;
      break;
    }
    case 'noeck': {   // Dreizack: ausholen, vorstoßen, verschnaufen; abgetaucht treibt er zur Mitte des Saals
      m.sT -= dt;
      const rage = m.hp <= m.max * ZB_FLOOD[1] ? 1.35 : 1, reach = BOSS_ART.noeck.reach;
      if (m.sub){ mvx = (m.hx - m.x) * 1.4; mvy = (m.hy - m.y) * 1.4; m.st = 'go'; break; }
      if (m.st === 'go'){ [mvx, mvy] = toK(m.spd * rage); m.dir = dx > 0 ? 1 : -1; if (dist < reach + 12 && m.t > .5){ m.st = 'aim'; m.sT = .75 / rage; } }
      else if (m.st === 'aim'){ m.dir = dx > 0 ? 1 : -1; if (m.sT > .22){ m.ax = dx / dist; m.ay = dy / dist; } if (m.sT <= 0){ m.st = 'thrust'; m.sT = .28; m.hitK = false; Sound.swing(); Sound.tone(90, .3, 'sawtooth', .03); } }
      else if (m.st === 'thrust'){ mvx = m.ax * 140; mvy = m.ay * 140; if (!m.hitK && dist < reach + 16 && dx * m.ax + dy * m.ay > 0) m.hitK = hitT(k, m, dmg * 1.25); if (m.sT <= 0){ m.st = 'rest'; m.sT = .95 / rage; } }
      else if (m.sT <= 0){ m.st = 'go'; m.t = 0; }
      break;
    }
    case 'tod': {
      m.sT -= dt;
      if (m.st === 'appear'){ m.alpha = clamp(1 - m.sT / .9, 0, 1); if (m.sT <= 0){ m.st = 'wind'; m.sT = .7; } }
      else if (m.st === 'wind'){ m.alpha = 1; m.dir = dx > 0 ? 1 : -1; if (m.sT <= 0){ m.st = 'sweep'; m.sT = .24; Sound.scythe(); m.hitK = false; } }
      else if (m.st === 'sweep'){ if (!m.hitK && dist < 64) m.hitK = hitT(k, m, dmg); if (m.sT <= 0){ m.st = 'linger'; m.sT = 1.5; } }
      else if (m.st === 'linger'){ [mvx, mvy] = toK(24); m.dir = dx > 0 ? 1 : -1; if (m.sT <= 0){ m.st = 'fade'; m.sT = .5; } }
      else if (m.st === 'fade'){ m.alpha = clamp(m.sT / .5, 0, 1); if (m.sT <= 0){ m.st = 'hidden'; m.sT = .5; } }
      else if (m.st === 'hidden'){
        if (m.sT <= 0){
          const a = rand(0, Math.PI * 2);
          m.x = clamp(k.x + Math.cos(a) * 52, 30, GW - 30); m.y = clamp(k.y - KBODY + Math.sin(a) * 36, 40, GH - 20);
          m.st = 'appear'; m.sT = .9; m.alpha = 0;
        }
      }
      break;
    }
  }
  return [mvx, mvy];
}
/* Austrittspunkte (Bolzen, Feuer) in Weltkoordinaten; h = Höhe über dem Boden */
function muzzleOf(m){
  const art = artOf(m.k).muzzle ? artOf(m.k) : artOf('armbrust'), mz = art.muzzle || { x: 14, y: -26 };
  return { x: m.x + mz.x * m.dir, y: m.y + mz.y, h: -mz.y };
}
function mouthOf(m){
  const art = BOSS_ART.lindwurm, mo = art.mouth || { x: 20, y: -16 };
  return { x: m.x + mo.x * m.dir, y: m.y + mo.y, h: -mo.y };
}

/* Lager füllen: in der Nähe des Ritters wachsen Monster nach */
function updateSpawns(dt){
  G.spawnT -= dt;
  if (G.spawnT > 0) return;
  G.spawnT = .5;
  const k = G.knight, cam = camOf(k);
  for (const s of SPAWN_SLOTS){
    if (s.mon){ if (s.mon !== true && !G.mons.includes(s.mon)) s.mon = null; else continue; }
    if (s.t > 0){ s.t -= .5; continue; }
    const d = Math.hypot(s.x - k.x, s.y - k.y);
    if (d > 1080 || d < 70) continue;
    if (inView(s.x, s.y, cam, 10)){ s.mon = true; G.rising.push({ kind: s.kind, x: s.x, y: s.y, t: s.boss ? 1.6 : .9, slot: s }); }
    else { s.mon = createMonster(s.kind, s.x, s.y, s.lvl, s); }
  }
}
function updateMons(dt){
  const k = G.knight, alive = G.mode === 'play' && k.hp > 0, safeZ = isSafe(G.zone), safe = safeZ || nearInn(k.x, k.y) || nearFest(k.x, k.y);
  for (let i = G.rising.length - 1; i >= 0; i--){
    const r = G.rising[i]; r.t -= dt;
    if (Math.random() < .6){
      const wisp = aiK(r.kind) === 'irrlicht', boss = MON[r.kind].boss;
      G.parts.push({ x: r.x + rand(-9, 9), y: r.y - (wisp ? 10 : 0), vx: rand(-14, 14), vy: rand(-45, -14), life: .5,
        c: wisp ? '#6fe8b0' : boss ? '#b3202a' : aiK(r.kind) === 'moor' ? '#33413f' : '#3e3022', g: 70, glow: wisp || boss });
    }
    if (r.t > 0) continue;
    G.rising.splice(i, 1);
    const m = createMonster(r.kind, r.x, r.y, r.lvl || r.slot.lvl, r.slot);
    if (r.slot) r.slot.mon = m;
    if (r.minionOf){ m.minion = true; m.zone = r.minionOf.zone; }
    if (r.nm) m.nm = r.nm;
    if (r.engage) engage(m, true);
    if (MON[r.kind].boss){ G.flash = .35; Sound.thunder(); }
    else if (r.kind !== 'irrlicht' && r.kind !== 'rabe' && Math.hypot(r.x - k.x, r.y - k.y) < 300) Sound.rise();
  }
  for (let i = G.mons.length - 1; i >= 0; i--){
    const m = G.mons[i], d = MON[m.k];
    m.t += dt; if (m.fl > 0) m.fl -= dt;
    // Ziel: der nächste Ritter, der eigene oder ein Mitspieler am selben Ort
    const c = centerOf(m), T0 = monTarget(m, c, alive && !(m.ev || m.story ? safeZ : safe), dt), T = T0 || k;
    const dx = T.x - c.x, dy = (T.y - KBODY) - c.y, dist = Math.hypot(dx, dy) || 1, dk = Math.hypot(k.x - c.x, k.y - KBODY - c.y);
    let mvx = 0, mvy = 0;
    if (m.mode === 'idle'){
      [mvx, mvy] = idleMove(m, dt);
      if (T0 && dist < aggroRange(m, T)) engage(m);
      if (dk > (m.ev || m.story ? 2400 : 1500) && !m.minion){ G.mons.splice(i, 1); if (m.slot) m.slot.mon = null; continue; }
    } else if (m.mode === 'fight'){
      const home = Math.hypot(m.x - m.hx, m.y - m.hy);
      if (!T0 || home > leashOf(m) || dist > 560){ goHome(m); }
      else if (m.stunT > 0){ m.stunT -= dt; }
      else [mvx, mvy] = aiMove(m, dt, T, dx, dy, dist);
    }
    if (m.mode === 'back'){
      m.backT += dt;
      if (aiK(m.k) === 'tod'){
        m.sT -= dt; m.alpha = clamp(m.sT / .5, 0, 1);
        if (m.sT <= 0){ m.x = m.hx; m.y = m.hy - 20; m.alpha = 0; m.mode = 'idle'; m.st = 'idle'; m.hp = m.max; }
      } else {
        const hx = m.hx, hy = d.fly ? m.hy - 26 : m.hy, ddx = hx - m.x, ddy = hy - m.y, l = Math.hypot(ddx, ddy);
        if (l < 6 || m.backT > 7){ if (m.backT > 7){ m.x = hx; m.y = hy; if (m.trail) m.trail.length = 0; } m.mode = 'idle'; m.st = 'idle'; m.walking = false; m.wT = rand(1, 3); m.hp = m.max; }
        else { const sp = Math.max(60, (m.spd || 40) * 1.7); mvx = ddx / l * sp; mvy = ddy / l * sp; m.dir = ddx > 0 ? 1 : -1; m.hp = Math.min(m.max, m.hp + m.max * dt * .5); }
      }
    }
    if (m.mode === 'fight' && ['wieder', 'moor', 'ratte', 'irrlicht'].includes(aiK(m.k)) && Math.abs(mvx) > 1) m.dir = mvx > 0 ? 1 : -1;
    if (m.mode === 'fight' && aiK(m.k) === 'werwolf' && m.st === 'go' && Math.abs(mvx) > 1) m.dir = mvx > 0 ? 1 : -1;
    const ground = !d.fly && (m.k !== 'lindwurm' || DG_ON);
    if (ground && m.st !== 'dash' && m.st !== 'charge') [mvx, mvy] = steer(m, mvx, mvy, d.wade);
    const ox = m.x, oy = m.y;
    m.x += (mvx + m.vx) * dt; m.y += (mvy + m.vy) * dt;
    const decay = Math.pow(.002, dt); m.vx *= decay; m.vy *= decay;
    if (ground){
      if (blocked(m.x, m.y, d.wade)){ if (!blocked(m.x, oy, d.wade)) m.y = oy; else if (!blocked(ox, m.y, d.wade)) m.x = ox; else pushOut(m, d.wade); }
      m.x = clamp(m.x, 8, GW - 8); m.y = clamp(m.y, 12, GH - 2);
    } else { m.x = clamp(m.x, 12, GW - 12); m.y = clamp(m.y, 24, GH - 6); }
    if (m.k === 'lindwurm'){
      const last = m.trail[m.trail.length - 1];
      if (!last || Math.hypot(last[0] - m.x, last[1] - m.y) >= WURM_STEP){ m.trail.push([Math.round(m.x), Math.round(m.y)]); if (m.trail.length > 120) m.trail.shift(); }
    }
    const sumAt = m.k === 'rotbart' ? [.7, .35] : [.5];
    if (d.boss && m.mode === 'fight' && !(m.summoned && !m.sumN) && (m.sumN || 0) < sumAt.length && m.hp <= m.max * sumAt[m.sumN || 0]){
      m.summoned = true; m.sumN = (m.sumN || 0) + 1;
      if (m.k === 'rotbart'){ logLine('Hinrich Rotbart brüllt: „Alle Mann an Deck!“', '#ff9a8a'); Sound.horn(); }
      if (m.k === 'wels') logLine('Das Altwasser wallt auf: Nöcke steigen aus dem Schlamm.', '#9fdcc8');
      for (let j = 0; j < 2; j++){
        const p = gRandWalk(m.x, m.y, 40, 90); if (!p) continue;
        G.rising.push({ kind: BOSS_MINION[m.k], x: p.x, y: p.y, t: .9 + j * .2, lvl: Math.max(1, m.lvl - 3), engage: true, minionOf: m });
      }
    }
    if (m.mode === 'idle' && m.minion){ G.mons.splice(i, 1); continue; }
  }
  for (let i = 0; i < G.mons.length; i++) for (let j = i + 1; j < G.mons.length; j++){
    const a = G.mons[i], b = G.mons[j], da = MON[a.k], db = MON[b.k];
    if (da.fly || db.fly || a.k === 'lindwurm' || b.k === 'lindwurm') continue;
    const dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy), min = da.r + db.r;
    if (dd > 0 && dd < min){ const p = (min - dd) / 2; a.x -= dx / dd * p; a.y -= dy / dd * p; b.x += dx / dd * p; b.y += dy / dd * p; }
  }
  if (!alive) return;
  for (const m of G.mons){
    if (m.mode !== 'fight' || m.stunT > 0 || aiK(m.k) === 'tod' || m.k === 'noeck' || aiK(m.k) === 'pluend' || aiK(m.k) === 'armbrust') continue;
    if (aiK(m.k) === 'raubritter' && m.st === 'stun') continue;
    const touch = bodyCircles(m).some(c => Math.hypot(c.x - k.x, c.y - (k.y - KBODY)) < c.r + 10);
    if (!touch) continue;
    const mul = m.st === 'dash' || m.st === 'dive' || m.st === 'charge' ? 1.3 : aiK(m.k) === 'raubritter' ? .6 : 1;
    if (hurt(m, monDmg(m.k, m.lvl) * mul) && aiK(m.k) === 'moor') k.slowT = 1.6;
    if (G.mode !== 'play') return;
  }
}

function updateShots(dt){
  const k = G.knight;
  for (let i = G.shots.length - 1; i >= 0; i--){
    const s = G.shots[i];
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.k === 'fire' && Math.random() < .6) G.parts.push({ x: s.x, y: s.y, vx: rand(-10, 10), vy: rand(-18, 0), life: .3, c: Math.random() < .5 ? '#e0782a' : '#ffd36a', g: 0, glow: true });
    let gone = s.life <= 0 || s.x < 0 || s.y < 0 || s.x > GW || s.y > GH;
    if (!gone && gBlocked(s.x - 1, s.y + (s.h || 20) - 2, s.x + 1, s.y + (s.h || 20), true)) gone = true;
    if (!gone && G.mode === 'play' && k.hp > 0 && Math.hypot(s.x - k.x, s.y - (k.y - KBODY)) < 10){
      // Schild nach vorn: Geschosse prallen ab
      const [fx, fy] = DIRV[k.dir], facing = (-s.vx * fx - s.vy * fy) > 0;
      if (k.bashT > 0 || (HERO.eq.schild && facing && Math.random() * 100 < ST.block * 1.6)){
        burst(s.x, s.y, ['#ffffff', '#ecd27a'], 6, 70, true); Sound.parry(); floatText(k.x, k.y - KS.ay - 2, 'abgewehrt', '#d8dee8');
      } else hurt(s, s.dmg || 5, true);
      gone = true;
    }
    if (!gone && s.from) for (const q of PEERS.values()) if (samePlace(q) && !q.dead && Math.hypot(s.x - q.x, s.y - (q.y - KBODY)) < 10){ burst(s.x, s.y, ['#ffffff', '#c8343c'], 5, 60); gone = true; break; }
    if (gone){ G.shots.splice(i, 1); if (s.k === 'fire') burst(s.x, s.y, ['#e0782a', '#ffd36a'], 5, 40, true); }
    if (G.mode !== 'play') return;
  }
}

/* ============ Kampf ============ */
function bodyCircles(m){
  const d = MON[m.k];
  if (m.k === 'lindwurm') return [{ x: m.x, y: m.y - 14, r: d.r, hr: d.hr }].concat(wurmSegs(m).map(s => ({ x: s.x, y: s.cy, r: s.r * .8, hr: s.r })));
  if (m.k === 'wels') return [16, -10, -36].map((dx, i) => ({ x: m.x + dx * m.dir, y: m.y - 13, r: i ? 11 : d.r, hr: i ? 14 : d.hr }));
  if (d.fly) return [{ x: m.x, y: m.y, r: d.r, hr: d.hr }];
  return [{ x: m.x, y: m.y - artOf(m.k).ay * .45, r: d.r, hr: d.hr }];
}
const vulnerable = m => !m.sub && m.mode !== 'back' && (m.k !== 'tod' || !(m.st === 'hidden' || m.st === 'fade' || (m.st === 'appear' && m.sT > .45)));
const centerOf = m => { const c = bodyCircles(m)[0]; return { x: c.x, y: c.y }; };
const gripOf = k => ({ x: k.x + KNIGHT_GRIP[k.dir].x, y: k.y + KNIGHT_GRIP[k.dir].y });
const reachOf = k => { const w = wtK(k); return (SWORD.len - SWORD.gripBack + 3) * WT[w].reach * (w === 'hellebarde' && k.mult >= 1.75 ? 1.6 : 1) + (k.mult > 1.2 ? 4 : 0); };
function swingAngle(k){ const p = clamp(1 - k.atkT / k.atkLen, 0, 1), e = 1 - (1 - p) * (1 - p); return k.swA0 + (k.swA1 - k.swA0) * e; }
const canAct = () => G.mode === 'play' && G.knight.hp > 0 && !G.joust && !G.fgame;
const canFight = () => canAct() && !G.inside;

function startSwing(k, full, mult, len, arcO){
  const [fx, fy] = DIRV[k.dir], base = Math.atan2(fy, fx), arc = arcO || WT[wtK(k)].arc || 1.45;
  k.atkLen = len; k.atkT = len; k.swing++; k.mult = mult; k.skF = false;
  if (full){ k.swA0 = base - Math.PI; k.swA1 = base + Math.PI; }
  else { k.swA0 = base - arc; k.swA1 = base + arc; }
}
function attack(){
  if (G.fgame){ fgThrow(); return; }
  const k = G.knight;
  if (HERO.riding && canAct()){
    // im Sattel: Lanzenstoß mit kurzem Ansturm
    if (!canFight() || G.cd.lanze > 0 || k.lance > 0) return;
    k.lance = .5; k.lanceHit = new Set(); G.cd.lanze = 3; Sound.charge(); sendPresence(true);
    return;
  }
  if (k.atkCd > 0 || !canFight() || k.bashT > 0) return;
  if (heroWt() === 'armbrust'){ xbShoot(0); k.atkCd = ST.cd; return; }
  startSwing(k, false, 1, SWING * WT[heroWt()].swing);
  k.atkCd = ST.cd;
  Sound.swing();
}
function skillRund(){
  const k = G.knight;
  if (HERO.riding && canAct()) dismount();
  if (!canFight() || HERO.lvl < 3 || G.cd.rund > 0 || k.bashT > 0) return;
  const w = heroWt();
  if (w === 'armbrust'){ xbShoot(1); k.atkCd = Math.max(k.atkCd, ST.cd); G.cd.rund = cdT(6, 'wirbel', 2); return; }   // Bolzenfächer
  const zw = w === 'zweihaender', len = SWING * 1.4 * WT[w].swing;
  startSwing(k, true, zw ? 1.8 : 1.4, len);
  k.atkCd = Math.max(k.atkCd, len); G.cd.rund = cdT(zw ? 7 : 6, 'wirbel', 2);
  Sound.swing(); setTimeout(() => Sound.swing(), 120);
}
function skillStoss(){
  const k = G.knight;
  if (HERO.riding && canAct()) dismount();
  if (!canFight() || HERO.lvl < 6 || G.cd.stoss > 0) return;
  const w = heroWt();
  if (w === 'armbrust'){ if (k.bashT > 0) return; xbShoot(2); k.atkCd = Math.max(k.atkCd, ST.cd); G.cd.stoss = cdT(9, 'sturm', 3); return; }   // Durchschuss
  if (w === 'hellebarde'){ if (k.bashT > 0) return; startSwing(k, false, 1.8, .28, .2); k.skF = true; k.atkCd = Math.max(k.atkCd, .3); G.cd.stoss = cdT(9, 'sturm', 3); Sound.swing(); return; }
  if (w === 'zweihaender'){ if (k.bashT > 0) return; startSwing(k, false, 2.4, SWING * 1.7, .55); k.skF = true; k.atkCd = Math.max(k.atkCd, SWING * 1.7); G.cd.stoss = cdT(10, 'sturm', 3); Sound.swing(); G.shake = Math.max(G.shake, .12); return; }
  if (heroBib()){ bibPray(); return; }   // mit der Bibel in der Nebenhand: Gebet
  const [fx, fy] = DIRV[k.dir];
  k.bashT = .26; k.bx = fx; k.by = fy; k.bashHit = new Set(); k.atkT = 0;
  G.cd.stoss = cdT(9, 'sturm', 3); Sound.bash();
}
function skillRuf(){
  const k = G.knight;
  if (HERO.riding && canAct()) dismount();
  if (!canFight() || HERO.lvl < 10 || G.cd.ruf > 0) return;
  G.buffT = hasTal('feldherr') ? 15 : 10; G.cd.ruf = hasTal('feldherr') ? 20 : 30; Sound.cry();
  burst(k.x, k.y - KBODY, ['#ecd27a', '#fff3c0', '#c9a227'], 30, 120, true);
  floatText(k.x, k.y - KS.ay - 4, KN_FACTIONS[HERO.f].cry, '#ecd27a', 2, 1.4);
}
function drinkPotion(){
  const k = G.knight;
  if (!canAct() || G.cd.trank > 0) return;
  if (HERO.potions <= 0){ floatText(k.x, k.y - KS.ay - 2, 'keine Tränke', '#d8c69c'); return; }
  if (k.hp >= ST.hp){ floatText(k.x, k.y - KS.ay - 2, 'volles Leben', '#d8c69c'); return; }
  HERO.potions--; G.cd.trank = 6;
  const heal = Math.round(ST.hp * (hasTal('feldscher') ? .6 : .45)); k.hp = Math.min(ST.hp, k.hp + heal);
  floatText(k.x, k.y - KS.ay - 2, '+' + heal, '#7fe08a', 1);
  burst(k.x, k.y - KBODY, ['#c8343c', '#f08a6a', '#ffffff'], 14, 60, true);
  Sound.potion(); updateHud(); markDirty();
}

/* Trifft die Klinge? Kreissektor vom Griffpunkt aus, so weit wie die Klinge bisher geschwungen ist */
function inSwing(k, x, y, r){
  const gp = gripOf(k), dx = x - gp.x, dy = y - gp.y, d = Math.hypot(dx, dy), R = reachOf(k);
  if (d > R + r) return false;
  if (d < r + 10) return true;
  const span = swingAngle(k) - k.swA0, tol = Math.asin(Math.min(1, r / d));
  const rel = ((Math.atan2(dy, dx) - k.swA0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  return rel <= span + tol || rel >= Math.PI * 2 - tol;
}
function rollHit(mult){
  const buff = G.buffT > 0, crit = Math.random() * 100 < ST.crit + (buff ? 10 : 0);
  return { dmg: Math.max(1, Math.round(ST.dmg * mult * (buff ? 1.3 : 1) * rand(.9, 1.1) * (crit ? 1.75 : 1))), crit };
}
/* ============ Jagd: Wild mit Schwert und Lanze ============
   Hasen, Rehe, Hirsche, Füchse und Wildschweine lassen sich erlegen; gehetztes Wild wird nach ein paar Sekunden müde.
   Wildschweine wehren sich. Die Beute ist stapelbare Handelsware: der Krämer kauft alles, der Wirt zahlt mehr für Wildbret. */
const WARES = {
  wildbret:   { n:'Wildbret', v: 5, wirt: true },
  hasenbalg:  { n:'Hasenbalg', v: 4 },
  rehfell:    { n:'Rehfell', v: 9 },
  hirschfell: { n:'Hirschfell', v: 15 },
  geweih:     { n:'Hirschgeweih', v: 32, r: 1 },
  fuchsbalg:  { n:'Fuchsbalg', v: 18, r: 1 },
  hauer:      { n:'Keilerhauer', v: 24, r: 1 },
  schwarte:   { n:'Wildschweinschwarte', v: 11 },
  // Bergland: Beute von Gegnern
  silbererz:  { n:'Silbererz', v: 22, r: 1, berg: true },
  wolfspelz:  { n:'Wolfspelz', v: 16, berg: true },
  baerenfell: { n:'Bärenfell', v: 42, r: 1, berg: true },
  geierfeder: { n:'Bartgeierfeder', v: 14, berg: true },
  // Ostlande: Beute von Gegnern
  otterhaut:  { n:'Natternhaut', v: 12, ost: true },
  krebsschere: { n:'Krebsschere', v: 20, ost: true },
  alraune:    { n:'Alraunwurzel', v: 34, r: 1, ost: true },
  pfeilspitze: { n:'Ungarische Pfeilspitze', v: 26, r: 1, ost: true }
};
const MON_WARE = { kobold: ['silbererz', .3], grubengeist: ['silbererz', .2], wolf: ['wolfspelz', .4], baer: ['baerenfell', .5], geier: ['geierfeder', .35],
  kreuzotter: ['otterhaut', .35], keiler: ['hauer', .3], moosweib: ['alraune', .2], riesenkrebs: ['krebsschere', .4], geisterbogner: ['pfeilspitze', .25], geisterreiter: ['pfeilspitze', .15] };
const WARE_MAX = 10;   // Stück je Stapel
/* hp: Vielfaches des eigenen Schadens; drops: [Ware, Wahrscheinlichkeit]; fight: wehrt sich */
const HUNT = {
  hase:        { hp: .5, xp: 2, drops: [['hasenbalg', 1], ['wildbret', .6]] },
  reh:         { hp: 1.2, xp: 4, drops: [['rehfell', 1], ['wildbret', 1]] },
  hirsch:      { hp: 2.2, xp: 7, drops: [['geweih', 1], ['hirschfell', .8], ['wildbret', 1], ['wildbret', .6]] },
  fuchs:       { hp: .9, xp: 4, drops: [['fuchsbalg', 1]] },
  wildschwein: { hp: 3.4, xp: 9, fight: true, drops: [['hauer', 1], ['schwarte', .8], ['wildbret', 1], ['wildbret', .7]] }
};
function makeWare(w){
  const D = WARES[w];
  return { s: 'ware', w, n: D.n, r: D.r || 0, il: HERO.lvl, v: Math.max(1, Math.round(D.v * (1 + HERO.lvl * .15))), q: 1, a: {}, id: Date.now().toString(36) + (itemSeq++).toString(36) };
}
const itemValue = it => it.v * (it.q || 1);
function huntTargets(k, r){
  const out = [];
  for (const s of LIFE_SPOTS) if (s.act) for (const e of s.ents) if (!e.person && HUNT[e.k] && !e.gone && Math.abs(e.x - k.x) < r && Math.abs(e.y - k.y) < r) out.push(e);
  return out;
}
const huntBody = e => ({ x: e.x, y: e.y - e.art.h * .4, r: Math.max(6, e.art.w * .3) });
function huntHit(e, h){
  const H = HUNT[e.k], b = huntBody(e), k = G.knight;
  if (e.hp == null) e.hp = e.max = Math.max(1, Math.round(ST.dmg * H.hp));
  e.hp -= h.dmg;
  floatText(b.x + rand(-4, 4), b.y - 12, h.dmg, h.crit ? '#ffd541' : '#ffffff', h.crit ? 2 : 1);
  burst(b.x, b.y, ['#8a2a2a', '#5a3a28', '#c8a070'], 6, 60);
  if (e.hp <= 0) return huntKill(e);
  Sound.hit();
  if (H.fight && e.hp > e.max * .3){ e.st = 'charge'; e.t = 1.1; e.rage = 6; lifeSound('oink', e); }
  else { e.st = 'flee'; e.t = rand(1.5, 2.4); const a = Math.atan2(e.y - k.y, e.x - k.x) + rand(-.4, .4); e.fx = Math.cos(a); e.fy = Math.sin(a); }
}
function huntKill(e){
  const H = HUNT[e.k], b = huntBody(e);
  orCount('wild'); stHunt(e.k); lwAdd(1); rrHunt(e);
  e.gone = true; e.spot.cool = 150;
  Sound.kill(); burst(b.x, b.y, ['#8a2a2a', '#6a4a30', '#c8a070', '#3a2a1e'], 14, 80);
  for (const [w, p] of H.drops) if (Math.random() < p) dropLoot({ x: e.x, y: e.y }, 'item', 0, makeWare(w));
  HERO.hunted = (HERO.hunted || 0) + 1; ehCount('hunt');
  const xp = Math.round(H.xp * (1 + HERO.lvl * .25));
  if (HERO.lvl < MAX_LVL){ floatText(G.knight.x, G.knight.y - KS.ay - 10, '+' + xp + ' EP', '#c9a6ff', 1, 1.2); gainXp(xp); }
  if (!HERO.huntTip){ HERO.huntTip = true; logLine('Waidmannsheil! Felle, Geweihe und Wildbret kauft der Krämer, Wildbret auch der Wirt.', '#9fe08a'); }
  updateHud(); markDirty();
}
/* Wildschwein: kurzer Ansturm auf den Ritter, nach dem Zusammenstoß ein Stück zurück, dann wieder */
function huntBoar(e, dt){
  const k = G.knight, dx = k.x - e.x, dy = k.y - e.y, d = Math.hypot(dx, dy) || 1;
  e.t -= dt; e.anim += dt * (e.st === 'charge' ? 12 : 7);
  if (e.st === 'charge'){
    lifeMove(e, dx / d * 175, dy / d * 140, dt); e.dir = dx > 0 ? 1 : -1;
    if (d < e.art.w * .5 + 8 && G.mode === 'play' && k.hp > 0){ hurt(e, 5 + HERO.lvl * 2.4); e.st = 'rest'; e.t = 1; e.fx = -dx / d; e.fy = -dy / d; }
    else if (e.t <= 0){ e.st = 'rest'; e.t = .8; e.fx = 0; e.fy = 0; }
  } else {
    lifeMove(e, e.fx * 45, e.fy * 34, dt);
    if (e.t <= 0){ if (--e.rage > 0 && d < 260 && G.mode === 'play' && k.hp > 0){ e.st = 'charge'; e.t = 1.1; } else { e.st = 'idle'; e.t = rand(1, 3); } }
  }
}
/* Wirt: Wildbret zum besseren Preis */
function sellMeat(){
  let gold = 0, n = 0;
  HERO.inv.forEach((it, i) => { if (it && it.s === 'ware' && WARES[it.w].wirt){ gold += Math.round(itemValue(it) * 1.6); n += it.q || 1; HERO.inv[i] = null; } });
  if (!n) return;
  HERO.gold += gold; Sound.coin(); logLine('Der Wirt kauft ' + n + ' × Wildbret für ' + gold + ' Gulden.', '#ffd98a');
  updateHud(); markDirty(true);
}
function swingHits(){
  const k = G.knight, w = heroWt();
  if (w === 'armbrust') return;   // die Bolzen treffen selbst (kbTick)
  for (const m of G.mons.slice()){
    if (m.hitBy === k.swing || !vulnerable(m)) continue;
    if (!bodyCircles(m).some(c => inSwing(k, c.x, c.y, c.hr))) continue;
    m.hitBy = k.swing;
    const h = rollHit(k.mult * (aiK(m.k) === 'raubritter' && m.st === 'stun' ? 1.5 : 1));
    const fm = foeMul(m);   // Kleine Bibel, Segen, Meisterschaften
    if (fm !== 1) h.dmg = Math.round(h.dmg * fm);
    if (k.skF && !MON[m.k].boss) m.stunT = Math.max(m.stunT || 0, w === 'zweihaender' ? 1.5 : 1);
    damage(m, h.dmg, h.crit, WT[w].kb * (k.skF ? 1.6 : 1));
    leech(h.dmg);
  }
  for (const e of huntTargets(k, 100)){
    const b = huntBody(e);
    if (e.hitBy === k.swing || !inSwing(k, b.x, b.y, b.r)) continue;
    e.hitBy = k.swing; huntHit(e, rollHit(k.mult));
  }
  for (let i = G.shots.length - 1; i >= 0; i--){
    const s = G.shots[i];
    if (!inSwing(k, s.x, s.y, 4)) continue;
    G.shots.splice(i, 1);
    burst(s.x, s.y, ['#ffffff', '#ecd27a'], 6, 70, true); Sound.parry();
    floatText(s.x, s.y - 10, 'pariert', '#ecd27a');
  }
}
/* Lanzenspitze und -schaft je Richtung (vom Bodenpunkt des Pferdes) */
const LANCE_TIP = { right: [56, -34], left: [-56, -34], down: [10, 8], up: [-6, -90] };
function lanceHits(){
  const k = G.knight, L = LANCE_TIP[k.dir], t = { x: k.x + L[0], y: k.y + L[1] }, mid = { x: k.x + L[0] * .55, y: k.y - 34 + (L[1] + 34) * .55 };
  for (const m of G.mons.slice()){
    if (k.lanceHit.has(m.uid) || !vulnerable(m)) continue;
    if (!bodyCircles(m).some(c => Math.hypot(c.x - t.x, c.y - t.y) < c.hr + 10 || Math.hypot(c.x - mid.x, c.y - mid.y) < c.hr + 6)) continue;
    k.lanceHit.add(m.uid);
    const h = rollHit(1.8);
    if (!MON[m.k].boss) m.stunT = 1.2;
    damage(m, h.dmg, h.crit, 2.6);
    G.shake = Math.max(G.shake, .2);
    burst(t.x, t.y, ['#e8d8b0', '#b08a5a', '#8a6a42'], 9, 100);
  }
  for (const e of huntTargets(k, 130)){
    const b = huntBody(e);
    if (k.lanceHit.has(e) || (Math.hypot(b.x - t.x, b.y - t.y) > b.r + 10 && Math.hypot(b.x - mid.x, b.y - mid.y) > b.r + 6)) continue;
    k.lanceHit.add(e); huntHit(e, rollHit(1.8));
  }
}
/* Turnier- und Kriegslanze: bemalter Schaft, Brechscheibe, im Sattel aufrecht mit Fähnlein */
const LANCE_COL = { reich: ['#e0b030', '#1a1818'], frankreich: ['#2a4290', '#e8c040'], england: ['#f2eee4', '#b8281e'], spanien: ['#b8281e', '#f2eee4'] };
function drawLance(k, fid, couched){
  const C = LANCE_COL[fid] || LANCE_COL.reich, d = k.dir, sx = d === 'left' ? -1 : 1;
  let x0, y0, x1, y1;
  if (couched){
    if (d === 'right' || d === 'left'){ x0 = k.x - 12 * sx; y0 = k.y - 38; x1 = k.x + LANCE_TIP[d][0]; y1 = k.y + LANCE_TIP[d][1]; }
    else if (d === 'down'){ x0 = k.x + 9; y0 = k.y - 40; x1 = k.x + LANCE_TIP.down[0]; y1 = k.y + LANCE_TIP.down[1]; }
    else { x0 = k.x - 6; y0 = k.y - 34; x1 = k.x + LANCE_TIP.up[0]; y1 = k.y + LANCE_TIP.up[1]; }
  } else {
    const hx = d === 'down' ? 11 : d === 'up' ? -11 : 6 * sx;
    x0 = k.x + hx; y0 = k.y - 28; x1 = k.x + hx + 4 * (d === 'left' ? -1 : 1); y1 = k.y - 92;
  }
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)), nx = (y1 - y0) / n, ny = -(x1 - x0) / n;
  for (let i = 0; i <= n; i++){
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, w = t > .9 ? 1 : 2;
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(x - nx - .5), Math.round(y - ny - .5), w + 1, w + 1);
  }
  for (let i = 0; i <= n; i++){
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    ctx.fillStyle = t > .94 ? '#c8ccd2' : (Math.floor(i / 6) & 1) ? C[1] : C[0];
    ctx.fillRect(Math.round(x), Math.round(y), t > .9 ? 1 : 2, t > .9 ? 1 : 2);
  }
  // Brechscheibe am Griff
  const bx = x0 + (x1 - x0) * .14, by = y0 + (y1 - y0) * .14;
  ctx.fillStyle = OUT; ctx.fillRect(Math.round(bx - 3), Math.round(by - 3), 7, 7);
  ctx.fillStyle = '#9aa2ac'; ctx.fillRect(Math.round(bx - 2), Math.round(by - 2), 5, 5); ctx.fillStyle = '#d4d8de'; ctx.fillRect(Math.round(bx - 2), Math.round(by - 2), 2, 2);
  // Fähnlein an der aufrechten Lanze
  if (!couched){
    const fx = Math.round(x1), fy = Math.round(y1 + 4), fl = (G.t * 6 | 0) % 2;
    for (let j = 0; j < 6; j++){ const len = 10 - j * 1.4 + (fl && j > 2 ? 1 : 0); ctx.fillStyle = OUT; ctx.fillRect(fx + 1, fy + j - 1, Math.round(len) + 1, 3); }
    for (let j = 0; j < 6; j++){ const len = 9 - j * 1.4 + (fl && j > 2 ? 1 : 0); ctx.fillStyle = j < 3 ? C[0] : C[1]; ctx.fillRect(fx + 2, fy + j, Math.max(1, Math.round(len)), 1); }
  }
}
function bashHits(){
  const k = G.knight;
  for (const m of G.mons.slice()){
    if (k.bashHit.has(m.uid) || !vulnerable(m)) continue;
    if (!bodyCircles(m).some(c => Math.hypot(c.x - (k.x + k.bx * 12), c.y - (k.y - KBODY + k.by * 8)) < c.hr + 12)) continue;
    k.bashHit.add(m.uid);
    const h = rollHit(.8);
    if (!MON[m.k].boss){ m.stunT = 1.6; if (m.st === 'thrust' || m.st === 'aim' || m.st === 'dash' || m.st === 'dive') m.st = aiK(m.k) === 'rabe' ? 'circle' : 'go'; }
    else if (aiK(m.k) === 'raubritter' && (m.st === 'wind' || m.st === 'walk')){ m.st = 'stun'; m.sT = 1.3; }
    damage(m, h.dmg, h.crit, 2.2);
    G.shake = Math.max(G.shake, .15);
  }
}
/* Lebensraub: ein Teil des Schadens heilt den Ritter */
function leech(dmg){
  if (!ST.leech) return;
  const k = G.knight, hl = Math.round(dmg * ST.leech / 100); if (hl < 1 || k.hp >= ST.hp) return;
  k.hp = Math.min(ST.hp, k.hp + hl); if (Math.random() < .3) floatText(k.x, k.y - KS.ay - 2, '+' + hl, '#c8343c', 1);
}
function damage(m, dmg, crit, kbMul, src){
  const mine = !src || src === G.knight, k = mine ? G.knight : src, c = centerOf(m);
  if (m.sub){ if (mine && G.t - (m.subMsg || 0) > 1.2){ m.subMsg = G.t; floatText(c.x, c.y - 20, 'unter Wasser', '#9fdcff'); } return; }
  // Anführer eines Weltereignisses: sein Leben kommt aus dem gemeldeten Schaden aller, Hiebe anderer hier nur zu sehen
  if (((m.ev && m.ev.boss) || m.grp) && !mine){ m.fl = .12; burst(c.x, c.y, ['#ffffff', '#c3ccd8'], 4, 60, true); return; }
  if (m.grp && DG_ON){ DG_ON.bossDmg = (DG_ON.bossDmg || 0) + dmg; HERO.dgDmg = { k: DG_ON.id + ':' + dgDay(), d: Math.round(DG_ON.bossDmg) }; }
  m.hp -= dmg; m.fl = .12; m.by = mine ? 'me' : src.peer;
  if (mine){ G.combatT = 0; m.mine = (m.mine || 0) + dmg; if (m.ev && EVT.cur && m.ev.id === EVT.cur.id){ EVT.cur.contrib = true; if (m.ev.boss) EVT.cur.dmg += dmg; } }
  if (m.mode === 'idle') engage(m);
  const dx = c.x - k.x, dy = c.y - (k.y - KBODY), l = Math.hypot(dx, dy) || 1;
  const kb = (MON[m.k].boss ? (aiK(m.k) === 'raubritter' && m.st === 'stun' ? 80 : 0) : aiK(m.k) === 'moor' ? 90 : 160) * (kbMul || 1);
  m.vx += dx / l * kb; m.vy += dy / l * kb;
  if ((aiK(m.k) === 'werwolf' || aiK(m.k) === 'pluend') && !MON[m.k].boss && m.st === 'aim'){ m.st = 'rest'; m.sT = .5; }
  burst(c.x, c.y, ['#ffffff', '#c3ccd8', '#8a2a2a'], crit ? 10 : 6, crit ? 100 : 70, true);
  floatText(c.x + rand(-6, 6), c.y - 16, dmg, crit ? '#ffd541' : '#ffffff', crit ? 2 : 1);
  if (m.hp <= 0) kill(m); else Sound.hit();
}
const DEATH_COLORS = {
  wieder:['#c9c2ad', '#8a9a7c', '#2a2420'], moor:['#5a4630', '#3a2c1e', '#6e5638'], ratte:['#4a4038', '#7a2a2a'],
  werwolf:['#5a4a3e', '#3e3229', '#7a2a2a'], pluend:['#7a2e2a', '#6a6e76', '#c79a7a'], armbrust:['#4a5a3a', '#5e626a', '#6a5030'],
  rabe:['#2e2638', '#6a5e86'], irrlicht:['#6fe8b0', '#effff6'], raubritter:['#46404e', '#b3202a', '#c9a227'],
  lindwurm:['#4a6a3a', '#33502a', '#ffcc33', '#a3242a'], tod:['#1e1a22', '#d8d2bc', '#ff3030'],
  pirat:['#2b3648', '#a29a80', '#842a21'], pschuetze:['#3e3123', '#842a21', '#5e626a'], nix:['#24443a', '#1f4a26', '#9fdcc8'],
  rotbart:['#6e1518', '#d0a843', '#c8561e'], wels:['#323c27', '#7a7460', '#9fb8b6'], noeck:['#244b4c', '#9fdcff', '#c19a36', '#1d4a29'],
  wolf:['#5a5650', '#3a3632', '#7a2a2a'], schrat:['#3a2c1e', '#4f5c2a', '#6a5438'], wegelagerer:['#3e4a2e', '#6a5030', '#c79a7a'], kobold:['#4a5a3a', '#c8a040', '#2a2420'],
  grubengeist:['#8aa0b0', '#3a3a40', '#cfe8ff'], doppelsoeldner:['#b8281e', '#e0c040', '#6a6e76'], hakenschuetze:['#2a3a5a', '#5e626a', '#d8d0c0'], baer:['#4a3220', '#2e1e12', '#7a2a2a'],
  geier:['#5a4a38', '#d8c8a0', '#2a2018'], eislicht:['#9fdcff', '#ffffff'], tatzelwurm:['#4a5a2a', '#c8a040', '#a3242a'], bergmoench:['#2a2830', '#ffd070', '#8aa0b0'],
  feldhauptmann:['#b8281e', '#e0c040', '#1a1a20'], ruebezahl:['#5a4a38', '#8a8a80', '#d8d0c0', '#3a5a2a'],
  kreuzotter:['#5e5440', '#16130f', '#c43020'], strauchdieb:['#544838', '#36363c', '#c79a7a'], irrwisch:['#f0b050', '#fff6d8'], keiler:['#362c22', '#5c4e3c', '#cbc4a6'],
  moosweib:['#3e5226', '#727e62', '#a8301e'], reisiger:['#6e767e', '#7a2420', '#c79a7a'], riesenkrebs:['#423822', '#923a1c', '#6e5c3a'], geisterreiter:['#7eaebc', '#d0eef4', '#56406e'],
  geisterbogner:['#7eaebc', '#d0eef4', '#56406e'], hackelberg:['#243426', '#36363e', '#ff6a3a', '#a8987a'], eppelein:['#6e767e', '#a8241e', '#7a401c'],
  donauweibchen:['#64948a', '#86963a', '#e0e0d8', '#9ff4ff'], bulcsu:['#6e3e86', '#cabc5a', '#d0eef4'],
  schweizer:['#a82a22', '#e6e6de', '#c79a7a'], arkebusier:['#243466', '#acaca4', '#6e767e'], gendarm:['#6e767e', '#223266', '#d4aa3a'], franz:['#203078', '#d4aa3a', '#f0f0ec', '#6e767e'],
  janitschar:['#243a66', '#d4d4ca', '#7a2020'], tuefekci:['#7a1a18', '#d4d4ca', '#b89432'], mineur:['#463626', '#bab2a2', '#a8241e'], aga:['#861814', '#d4aa3a', '#ecece2']
};
function kill(m){
  const i = G.mons.indexOf(m); if (i >= 0) G.mons.splice(i, 1);
  const d = MON[m.k], c = centerOf(m), k = G.knight;
  if (m.ev) evMark(m);
  if (m.story) stKill(m);
  rrKill(m);   // Steckbriefe und Fehde
  if (m.ev && m.ev.boss){ burst(c.x, c.y, m.ghost ? ['#9fdcff', '#e8f6ff', '#ffffff'] : DEATH_COLORS[m.k], 50, 140, true); Sound.kill(); G.flash = .4; return; }   // Lohn kommt mit dem Ende des Ereignisses
  if (!killCredit(m)){ burst(c.x, c.y, DEATH_COLORS[m.k], 12, 70); Sound.kill(); if (m.slot){ m.slot.mon = null; m.slot.t = d.boss ? 240 : rand(40, 70); } return; }
  if (m.grp) return m.k === 'noeck' ? zbKill(m) : dgDrakeKill(m);
  HERO.kills++; G.shake = Math.max(G.shake, .08); orCount('kills'); lwAdd(d.boss || m.elite ? 10 : 1);
  if (d.boss || m.elite) orCount('boss');
  Sound.kill();
  burst(c.x, c.y, DEATH_COLORS[m.k], d.boss ? 50 : 16, d.boss ? 140 : 80, aiK(m.k) === 'irrlicht');
  if (m.k === 'lindwurm') for (const s of wurmSegs(m)) burst(s.x, s.cy, DEATH_COLORS.lindwurm, 8, 70);
  if (m.slot){ m.slot.mon = null; m.slot.t = d.boss ? 240 : rand(40, 70); }
  // Erfahrung
  const byMate = m.by && m.by !== 'me' && inParty(PEERS.get(m.by));   // der Gefährte meldet den Sieg, seine Erfahrung kommt über die Gruppe
  if (m.by === 'me'){ NET.kx = { n: NET.kx.n + 1, s: NET.kx.s + monXp(m.k, m.lvl), l: m.lvl }; }
  const xp = byMate ? 0 : Math.round(monXp(m.k, m.lvl) * xpMul(m.lvl - HERO.lvl) * (1 + .1 * partyNear().length));   // Gefährten in der Nähe: je ein Zehntel mehr
  if (xp > 0 && HERO.lvl < MAX_LVL) floatText(k.x, k.y - KS.ay - 10, '+' + xp + ' EP', '#c9a6ff', 1, 1.2);
  // Beute
  const gy = aiK(m.k) === 'tod' ? m.y + 24 : (d.fly ? m.y + 24 : m.y), from = { x: m.x, y: gy };
  for (const it of m.loot) dropLoot(from, it.t, it.n, it.it);
  if (m.story && m.story.boss){   // Anführer der Hauptgeschichte: reiche Beute, aber nicht die Beute der Weltbosse
    G.flash = .4; Sound.thunder();
    for (let j = 0; j < 3; j++) dropLoot(from, 'gold', monGold(m.lvl) * 2);
    dropLoot(from, 'potion');
    dropLoot(from, 'item', 0, makeItem(pick(SLOTS), m.lvl, Math.random() < .4 ? 3 : 2));
  } else if (d.boss){
    G.flash = .5; Sound.thunder();
    const first = !HERO.bosses[m.k];
    HERO.bosses[m.k] = (HERO.bosses[m.k] || 0) + 1;
    for (let j = 0; j < 4; j++) dropLoot(from, 'gold', monGold(m.lvl) * 3);
    dropLoot(from, 'potion'); dropLoot(from, 'potion');
    const u = UNIQUES[m.k];
    if (first || Math.random() < .2) dropLoot(from, 'item', 0, makeItem(u.s, m.lvl + 1, 4, { name: u.n, aff: u.aff, u: m.k, wt: u.wt }));
    for (let j = 0; j < 2; j++) dropLoot(from, 'item', 0, makeItem(pick(SLOTS), m.lvl, rollRarity(true)));
    if (BOSSES[m.k] && BOSSES[m.k].lvl >= 22 && Math.random() < .3){ const set = pick(Object.keys(SETS)); dropLoot(from, 'item', 0, makeSetItem(set, pick(Object.keys(SETS[set].parts)), m.lvl)); }   // Anführer im Bergland: Satzteil
    showBanner(m.k === 'tod' ? 'Der Tod weicht' : m.k === 'lindwurm' ? 'Der Lindwurm ist erschlagen' : m.k === 'wels' ? 'Der Waller ist gefangen' : d.name + ' fällt', first ? 'Seine Beute liegt vor dir' : 'Er kehrt wieder');
    logLine((m.k === 'tod' ? 'Der Tod' : d.name) + ' ist bezwungen.', '#ecd27a');
    pushFame();
  } else {
    if (Math.random() < .55) dropLoot(from, 'gold', monGold(m.lvl));
    if (Math.random() < .07) dropLoot(from, 'potion');
    if (Math.random() < .16) dropLoot(from, 'item', 0, makeItem(pick(SLOTS), m.lvl, rollRarity(false)));
    const mw = MON_WARE[m.k]; if (mw && Math.random() < mw[1]) dropLoot(from, 'item', 0, makeWare(mw[0]));   // Bergland: Erz, Felle, Federn
    if (m.lvl >= 20 && Math.random() < .004){ const u = UNIQUES[pick(FUNDE)], key = Object.keys(UNIQUES).find(k => UNIQUES[k] === u); dropLoot(from, 'item', 0, makeItem(u.s, m.lvl + 1, 4, { name: u.n, aff: u.aff, u: key, wt: u.wt })); }   // Fundstück
    if (m.lvl >= 21 && Math.random() < .006){ const set = pick(Object.keys(SETS)); dropLoot(from, 'item', 0, makeSetItem(set, pick(Object.keys(SETS[set].parts)), m.lvl)); }   // Satzteil
  }
  if (m.elite){
    for (let j = 0; j < 3; j++) dropLoot(from, 'gold', monGold(m.lvl) * 2);
    dropLoot(from, 'item', 0, makeItem(pick(SLOTS), m.lvl, Math.random() < .35 ? 3 : 2));
    showBanner(m.elite + ' fällt', 'Die Truhe ist frei'); logLine(m.elite + ' ist bezwungen. Die Truhe gehört Euch.', '#ecd27a'); G.flash = .3;
  }
  bibFind(m, from);
  if (!(m.story && m.story.boss)) questProgress(m);
  ehOnKill(m);
  if (xp > 0) gainXp(xp);
  updateHud(); markDirty();
}
function dropLoot(at, t, n, it){
  let ax = clamp(at.x + rand(-16, 16), 10, GW - 10), ay = clamp(at.y + rand(-4, 14), 12, GH - 4);
  for (let i = 0; i < 10 && blocked(ax, ay); i++){ ax += rand(-12, 12); ay += rand(-4, 12); }
  G.loot.push({ x: ax, y: ay, z: 14, vz: -120, t, n: n || 0, it: it || null, age: 0, bounced: false });
  if (it && it.r >= 2) setTimeout(() => Sound.loot(it.r), 200);
}
function updateLoot(dt){
  const k = G.knight;
  for (let i = G.loot.length - 1; i >= 0; i--){
    const a = G.loot[i];
    if (a.z > 0 || a.vz < 0){
      a.vz += 700 * dt; a.z -= a.vz * dt;
      if (a.z <= 0){ a.z = 0; if (!a.bounced){ a.bounced = true; a.vz = -a.vz * .3; Sound.drop(); } else a.vz = 0; }
      continue;
    }
    a.age += dt;
    if (a.age > (a.t === 'item' ? 120 : 60)){ G.loot.splice(i, 1); continue; }
    if (G.mode === 'play' && k.hp > 0 && Math.abs(a.x - k.x) < 14 && Math.abs(a.y - k.y) < 11){
      if (pickUp(a)) G.loot.splice(i, 1);
    }
  }
}
function pickUp(a){
  const k = G.knight;
  if (a.t === 'gold'){
    const gn = Math.round(a.n * (1 + asGoldBonus()) * (hasTal('beute') ? 1.2 : 1) * (1 + (ST.gold || 0) / 100));   // Ruhm des Landes, Ordenshaus, Beutegier
    HERO.gold += gn; Sound.coin();
    floatText(a.x, a.y - 14, '+' + gn + ' Gulden', '#ffd541');
  } else if (a.t === 'potion'){
    if (HERO.potions >= 20) return fullMsg('Kein Platz für mehr Tränke');
    HERO.potions++; Sound.coin();
    floatText(a.x, a.y - 14, '+1 Heiltrank', '#f08a6a');
  } else {
    const st = a.it.s === 'ware' ? HERO.inv.find(x => x && x.s === 'ware' && x.w === a.it.w && x.q < WARE_MAX) : null;
    if (st){
      st.q += a.it.q || 1; st.v = Math.max(st.v, a.it.v); Sound.coin();
      floatText(a.x, a.y - 14, a.it.n, RARITY[a.it.r].c, 1, 1.4);
      burst(a.x, a.y - 6, ['#ecd27a', '#ffffff'], 6, 50, true);
      if (!$('ovBag').hidden) renderBag();
      updateHud(); markDirty();
      return true;
    }
    const slot = HERO.inv.indexOf(null);
    if (slot < 0) return fullMsg('Der Rucksack ist voll');
    HERO.inv[slot] = a.it; Sound.loot(a.it.r);
    floatText(a.x, a.y - 14, a.it.n, RARITY[a.it.r].c, 1, 1.4);
    if (itemGain(a.it) > .5) floatText(a.x, a.y - 20, 'besser als Eures', '#7fd65f', 1, 1.4);
    logItem('Erbeutet: ', a.it);
    if (!$('ovBag').hidden) renderBag();
  }
  burst(a.x, a.y - 6, ['#ecd27a', '#ffffff'], 6, 50, true);
  updateHud(); markDirty();
  return true;
}
function fullMsg(txt){
  if (G.t - G.fullMsgT > 3){ G.fullMsgT = G.t; floatText(G.knight.x, G.knight.y - KS.ay - 4, txt, '#ff9a8a', 1, 1.4); logLine(txt + '.', '#ff9a8a'); }
  return false;
}

/* ============ Erfahrung und Stufen ============ */
function gainXp(n){
  if (HERO.mood && HERO.mood.t > 0) n = Math.round(n * 1.1);
  n = Math.round(n * (1 + asXpBonus()) * (hasTal('lern') ? 1.08 : 1) * (1 + (ST.xp || 0) / 100));   // Ruhm des Landes, Ordenshaus, Lernbegier
  if (HERO.lvl >= MAX_LVL){ ehGain(n); return; }   // nach Stufe 30: Ehrenstufen
  HERO.xp += n;
  while (HERO.lvl < MAX_LVL && HERO.xp >= xpNeed(HERO.lvl)){ HERO.xp -= xpNeed(HERO.lvl); HERO.lvl++; levelUp(); }
  if (HERO.lvl >= MAX_LVL) HERO.xp = 0;
  updateHud();
}
function levelUp(){
  const k = G.knight, L = HERO.lvl, old = titleOf(L - 1), now = titleOf(L);
  refreshStats(); k.hp = ST.hp;
  Sound.levelUp();
  burst(k.x, k.y - KBODY, ['#c9a227', '#ecd27a', '#ffffff'], 36, 120, true);
  const sk = SKILLS.find(s => s.lvl === L && s.cd);
  const mt = MEISTER.find(t => t.lvl === L);
  const sub = sk ? 'Neu: ' + sk.name + ' (Taste ' + sk.key + ')' : now !== old ? 'Ihr seid nun ' + now + (mt ? ' · neue Meisterschaft' : '') : mt ? 'Neue Meisterschaft: im Rucksack wählen' : 'Mehr Leben und Schaden';
  if (mt) logLine('Stufe ' + L + ': Ihr könnt eine neue Meisterschaft wählen (Rucksack, „Meisterschaften“).', '#ecd27a');
  showBanner(L === MAX_LVL ? 'Vivat Imperator!' : 'Stufe ' + L, sub);
  logLine('Stufe ' + L + ' erreicht. ' + sub + '.', '#ecd27a');
  renderSkills(); pushFame(); markDirty(true);
  stLevel(L);
}

/* ============ Aufträge: Fortschritt ============ */
function questProgress(m){
  for (const q of HERO.quests){
    const d = qInfo(q);
    if (!d || q.n >= d.need) continue;
    const hit = d.boss ? m.k === d.boss : q.id === 'kg' ? m.zone === d.zone && xpMul(m.lvl - HERO.lvl) > 0 : m.k === d.kind && m.zone === d.zone;
    if (!hit) continue;
    q.n++;
    if (q.n >= d.need){ Sound.quest(); showBanner('Auftrag erfüllt', d.t); logLine('Auftrag erfüllt: ' + d.t + '. Kehrt zum ' + ({ vogt: 'Vogt', schreiber: 'Stadtschreiber in Altmünster' }[d.giver] || 'Bürgermeister') + ' zurück.', '#ecd27a'); }
  }
  renderTracker();
}

/* ============ Ritter: Schaden, Tod, Erwachen ============ */
function hurt(from, dmg, ranged){
  const k = G.knight;
  if (k.inv > 0 || G.mode !== 'play' || k.hp <= 0) return false;
  if (HERO.riding) dismount('Vom Pferd geworfen!');
  let block = false;
  if (!ranged && from && HERO.eq.schild){
    const [fx, fy] = DIRV[k.dir];
    if ((from.x - k.x) * fx + (from.y - k.y) * fy > 0 && Math.random() * 100 < ST.block) block = true;
  }
  const n = Math.max(1, Math.round(dmg * (1 - ST.mit) * rand(.9, 1.1) * (block ? .25 : 1)));
  k.hp -= n; k.inv = .55; G.combatT = 0; G.shake = .2;
  floatText(k.x + rand(-4, 4), k.y - KS.ay + 2, '-' + n, '#ff5a5a', 1);
  if (block){ floatText(k.x, k.y - KS.ay - 6, 'abgewehrt', '#d8dee8'); Sound.parry(); }
  if (from){ const dx = k.x - from.x, dy = k.y - from.y, l = Math.hypot(dx, dy) || 1; k.kbx = dx / l * (block ? 60 : 130); k.kby = dy / l * (block ? 60 : 130); }
  Sound.hurt();
  burst(k.x, k.y - KBODY, ['#c8343c', '#f0a0a0', '#d4d8de'], block ? 6 : 12, 90);
  if (k.hp <= 0) die();
  updateHud();
  return true;
}
function die(){
  const k = G.knight;
  k.hp = 0; G.mode = 'dying'; G.dieT = 1.3; atkHeld = false; atkBtn = false; G.buffT = 0; HERO.riding = false; k.ride = null;
  G.ablassUsed = !!HERO.ablass;   // ein Ablassbrief (Dom) bewahrt einmal das Gold
  if (HERO.ablass){ HERO.ablass = false; G.lostGold = 0; renderBuffs(); }
  else { G.lostGold = Math.floor(HERO.gold * .1); HERO.gold -= G.lostGold; }
  for (const m of G.mons) if (m.mode === 'fight' && (!m.tgt || m.tgt === G.knight)) goHome(m);
  G.shots.length = 0;
  Sound.over(); markDirty(true);
}
function respawn(){
  if (G.mode !== 'dead') return;
  if (DG_ON) leaveDungeon(true);
  const b = BIND[HERO.bind], k = G.knight;
  k.x = b.x; k.y = b.y; k.hp = ST.hp; k.inv = 0; k.dir = 'down'; k.kbx = k.kby = 0; k.slowT = 0; k.atkT = 0; k.bashT = 0;
  G.mode = 'play'; G.combatT = 99; G.loot.length = 0;
  for (let i = G.mons.length - 1; i >= 0; i--){ const m = G.mons[i]; if (m.slot) m.slot.mon = null; }
  G.mons.length = 0; G.rising.length = 0;
  for (const s of SPAWN_SLOTS) if (s.mon === true) s.mon = null;
  G.zone = gZone(k.x, k.y).id; updateZone(true);
  showOverlay(null); blurActive(); updateHud(); Sound.startMusic();
  if (INN_BY[HERO.bind]) enterInn(INN_BY[HERO.bind]);
  showBanner('Ihr erwacht', HUB_NAME[HERO.bind]);
  markDirty(true);
}

/* ============ Aktualisierung ============ */
function updateKnight(dt){
  const k = G.knight, v = inputVec();
  k.moving = v.x !== 0 || v.y !== 0;
  if (k.lance > 0 && riding()){
    // Lanzenstoß: das Pferd stürmt geradeaus, die Lanze trifft alles vor ihm
    k.lance -= dt; k.moving = true; k.anim += dt * 14; k.ride = HERO.horse;
    const [fx, fy] = DIRV[k.dir], sp = 330;
    const nx = clamp(k.x + fx * sp * dt, 8, GW - 8), ny = clamp(k.y + fy * sp * .8 * dt, 12, GH - 2);
    if (!blocked(nx, k.y)) k.x = nx; else k.lance = 0;
    if (!blocked(k.x, ny)) k.y = ny; else if (fy) k.lance = 0;
    lanceHits();
    G.hoofT = (G.hoofT || 0) - dt; if (G.hoofT <= 0){ G.hoofT = .09; Sound.hoof(); }
    if (Math.random() < .9) G.parts.push({ x: k.x + rand(-10, 10), y: k.y, vx: -fx * 50 + rand(-10, 10), vy: -14, life: .45, c: '#6e5a42', g: 0, s: 2 });
  } else if (k.bashT > 0){
    // Schildstoß: kurzer Sprung nach vorn
    k.bashT -= dt;
    const nx = clamp(k.x + k.bx * 320 * dt, 8, GW - 8), ny = clamp(k.y + k.by * 320 * dt, 12, GH - 2);
    if (!blocked(nx, k.y)) k.x = nx;
    if (!blocked(k.x, ny)) k.y = ny;
    bashHits();
    if (Math.random() < .7) G.parts.push({ x: k.x + rand(-6, 6), y: k.y, vx: -k.bx * 30, vy: -10, life: .35, c: '#6e5a42', g: 0 });
  } else {
    if (k.moving){
      if (k.atkT <= 0){
        if (Math.abs(v.x) > Math.abs(v.y) + .01) k.dir = v.x > 0 ? 'right' : 'left';
        else k.dir = v.y > 0 ? 'down' : 'up';
      }
      k.anim += dt * 8;
      k.dust -= dt;
      if (k.dust <= 0){ k.dust = .22; G.parts.push({ x: k.x + rand(-5, 5), y: k.y, vx: rand(-10, 10), vy: -12, life: .4, c: '#6e5a42', g: 0 }); }
    } else k.anim = 0;
    k.ride = riding() ? HERO.horse : null;
    const sp = 128 * (k.atkT > 0 ? .55 : 1) * (k.slowT > 0 ? .55 : 1) * (G.wadeM || 1) * (k.ride ? HORSES[k.ride].speed : 1);
    if (k.ride && k.moving){ G.hoofT = (G.hoofT || 0) - dt; if (G.hoofT <= 0){ G.hoofT = .25 / HORSES[k.ride].speed * 1.5; Sound.hoof(); } }
    const nx = clamp(k.x + (v.x * sp + k.kbx) * dt, 8, GW - 8);
    if (!blocked(nx, k.y)) k.x = nx;
    const ny = clamp(k.y + (v.y * sp + k.kby) * dt, 12, GH - 2);
    if (!blocked(k.x, ny)) k.y = ny;
    // gegen die Gasthaustür laufen: eintreten
    if (v.y < -.5) for (const inn of INNS) if (Math.abs(k.x - inn.dx) < 12 && k.y - inn.y < 28 && k.y > inn.y){ enterInn(inn); return; }
    if (v.y < -.5 && !DG_ON) for (const d of DG_DOORS) if (Math.abs(k.x - d.x) < 14 && k.y - d.y < 24 && k.y > d.y - 8){ enterDungeon(d); return; }
  }
  const decay = Math.pow(.001, dt); k.kbx *= decay; k.kby *= decay;
  if (k.inv > 0) k.inv -= dt;
  if (k.slowT > 0) k.slowT -= dt;
  if (k.atkCd > 0) k.atkCd -= dt;
  if (atkHeld || atkBtn) attack();
  if (k.atkT > 0){ k.atkT -= dt; swingHits(); }
  // Erholung: außer Gefecht langsam, in Burg und Stadt schnell
  G.combatT += dt;
  if (k.hp > 0 && k.hp < ST.hp && (G.combatT > 5 || isSafe(G.zone))) k.hp = Math.min(ST.hp, k.hp + ST.hp * (isSafe(G.zone) ? .12 : .03) * (ST.regen || 1) * dt);
  for (const id in G.cd) if (G.cd[id] > 0) G.cd[id] = Math.max(0, G.cd[id] - dt);
  if (G.buffT > 0){ G.buffT -= dt; if (Math.random() < dt * 14) G.parts.push({ x: k.x + rand(-9, 9), y: k.y - rand(4, 40), vx: 0, vy: -24, life: .5, c: Math.random() < .5 ? '#ecd27a' : '#fff3c0', g: 0, glow: true }); }
}
function updateFx(dt){
  for (let i = G.parts.length - 1; i >= 0; i--){
    const p = G.parts[i];
    p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life <= 0) G.parts.splice(i, 1);
  }
  for (let i = G.floats.length - 1; i >= 0; i--){
    const f = G.floats[i]; f.life -= dt; f.y -= 24 * dt;
    if (f.life <= 0) G.floats.splice(i, 1);
  }
  const cam = camOf(G.knight), near = (x, y) => x > cam.x - 80 && x < cam.x + W + 80 && y > cam.y - 60 && y < cam.y + H + 120;
  if (G.parts.length < 420 && !G.inside && !DG_ON){
    for (const f of GFIRES) if (near(f.x, f.y) && Math.random() < dt * (f.big ? 8 : 4))
      G.parts.push({ x: f.x + rand(-3, 3), y: f.y - 6, vx: rand(-6, 6), vy: rand(-40, -20), life: rand(.6, 1.2), c: Math.random() < .5 ? '#e0782a' : '#ffd36a', g: -6, glow: true });
    for (const s of GSMOKES) if (near(s.x, s.y) && Math.random() < dt * 5)
      G.parts.push({ x: s.x + rand(-6, 6), y: s.y, vx: rand(4, 14), vy: rand(-26, -14), life: rand(1.8, 3), c: Math.random() < .5 ? '#6e6a70' : '#56525a', g: -2, s: 3 });
  }
  for (const p of GPROPS) if (p.shake > 0) p.shake -= dt;
  if (G.shake > 0) G.shake -= dt;
  if (G.flash > 0) G.flash -= dt;
}
const PAUSED = { pause:1, menu:1, map:1, dead:1 };
function update(dt){
  updatePeers(dt);
  netTick(); evTick(dt);
  const hideT = !!(G.joust || G.fgame); if (hideT !== !!G.trackHidden){ G.trackHidden = hideT; $('tracker').style.visibility = hideT ? 'hidden' : ''; }
  if (PAUSED[G.mode]) return;
  G.t += dt; G.fogX = (G.fogX + dt * 6) % 512;
  if ((G.musT = (G.musT || 0) - dt) <= 0){ G.musT = 1; Sound.setTune(musicFor()); }   // Musik nach Ort und Zeit
  if (G.mode === 'scene'){ stUpdate(dt); updateLife(dt); updateFx(dt); skyEvents(dt); sendPresence(); return; }   // Zwischenszene
  if (G.mode === 'title'){
    for (const m of G.mons){ m.t += dt; const [vx, vy] = idleMove(m, dt); if (MON[m.k].fly || !blocked(m.x + vx * dt, m.y + vy * dt)){ m.x += vx * dt; m.y += vy * dt; } }
    updateLife(dt);
    updateFx(dt);
    return;
  }
  if (G.mode === 'dying'){
    G.dieT -= dt; updateFx(dt); updateMons(dt); updateBossBar();
    if (G.dieT <= 0){ G.mode = 'dead'; showDead(); }
    return;
  }
  tickBuffs(dt);
  if (DG_ON){ updateDungeon(dt); return; }
  if (G.fgame){ updateFgame(dt); updateLife(dt); skyEvents(dt); updateFx(dt); updateLoot(dt); sendPresence(); HERO.played += dt; return; }
  if (G.joust){
    updateJoust(dt);
    if (G.joust){ updateLife(dt); skyEvents(dt); updateFx(dt); sendPresence(); HERO.played += dt; return; }
  }
  if (G.inside){
    updateInn(dt);
    if (G.inside){
      updateFx(dt); updateNear(); sendPresence();
      HERO.played += dt; G.saveT += dt;
      if (G.saveT > 8){ G.saveT = 0; saveHero(); }
      return;
    }
  }
  updateKnight(dt);
  if (G.inside) return;
  peerHits();
  const z = gZone(G.knight.x, G.knight.y).id;
  if (z !== G.zone){ G.zone = z; updateZone(true); }
  updateSpawns(dt);
  stTick(dt); fishTick(dt); rrTick(dt);
  updateLoot(dt);
  if (G.mode === 'play') updateMons(dt);
  if (G.mode === 'play') updateShots(dt);
  kbTick(dt);
  updateLife(dt);
  skyEvents(dt);
  updateFx(dt);
  updateBossBar();
  updateNear();
  sendPresence();
  HERO.played += dt;
  G.saveT += dt;
  if (G.saveT > 8){ G.saveT = 0; saveHero(); }
}
