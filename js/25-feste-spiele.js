"use strict";
/* Der Apfelritter, Teil 25 von 26: Feste und Spiele: Ostern, Schützenfest, Martini und Fastnacht mit ihren Spielen;
   Mühle, Einunddreißig, Kegeln und Ringen im Gasthaus.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */

/* ============ Vier neue Feste (Version 27) ============
   An den freien Tagen jeder Jahreszeit: Ostern am ersten Frühlingstag in den Obstgärten, das Schützenfest am letzten Sommertag
   auf der Turnierwiese, der Martinimarkt am letzten Herbsttag in Augsburg, die Fastnacht mit dem Schembartlauf am letzten
   Wintertag in Nürnberg. Jedes hat einen Gastgeber mit Speis und Trank, Musik, Leute und ein eigenes Spiel (FG, Teil 14). */
FESTS.push(
  { id:'ostern', sea:0, days:[0], extra:true, name:'Osterfest', where:'in den Obstgärten bei Lindach', tune:'ostern', game:'eier', gameName:'Ostereiersuche', prize:'Goldenes Osterei', c:[1700, 1020],
    host:{ name:'Bäuerin Walburg', at:[1650, 1052], o:{ robe:'long', hat:'tuch', apron:'linen' }, pal:{ 1:'#3a5a8a', 2:'#4a6ea6', 3:'#5e86c0', 4:'#7aa0d6', 5:'#a8801c', 6:'#c89c28', 7:'#e0b83a', 8:'#f0d460' },
      greet:['Frohe Ostern, Herr Ritter! Die Fastenzeit ist vorbei, heute wird gegessen.', 'Die Kinder haben bunte Eier zwischen den Apfelbäumen versteckt. Findet Ihr sie alle?', 'Am Osterfeuer hat der Pfarrer die Flammen gesegnet. Das bringt Glück für das ganze Jahr.'] },
    gameText:'Zwölf bunte Eier liegen versteckt im Gras zwischen den Apfelbäumen. Findet sie in anderthalb Minuten: Lauft einfach darüber. Ab und zu blitzt eines in der Sonne auf.',
    build(B){ const w = B.obj('feuerholz', 0, 1748, 996); B.fires.push({ x: w.x, y: w.y - 10 }); B.obj('festtisch', 0, 1640, 1070); B.obj('heuhaufen', 0, 1780, 1050); B.obj('banner', 0, 1606, 1000); } },
  { id:'schuetzen', sea:1, days:[3], extra:true, name:'Schützenfest', where:'auf der Turnierwiese vor dem Osttor', tune:'schuetzen', game:'schiessen', gameName:'Armbrustschießen', prize:'Silberner Schützenvogel', c:[3540, 2262],
    host:{ name:'Schützenmeister Lienhart', at:[3466, 2294], o:{ robe:'short', hat:'barett', parti:true, belt:true, beard:true, hair:['h', 'j'] }, pal:{ 1:'#1c4a24', 2:'#2a6a32', 3:'#3e8a44', 4:'#5aaa5a', 5:'#6a5010', 6:'#9a7a1c', 7:'#c8a030', 8:'#e6c44c' },
      greet:['Willkommen zum Schützenfest! Wer die meisten Ringe schießt, ist ein Jahr lang Schützenkönig.', 'Die Augsburger haben neunzehnhundert Schützen zu ihrem Schießen geladen. Wir sind bescheidener, aber zielen genauer.', 'Fünfzig Schritt bis zur Scheibe. Haltet den Atem an, Herr Ritter.'] },
    gameText:'Fünf Bolzen auf die Scheibe. Das Fadenkreuz wandert mit Eurem Atem: Haltet den Hieb gedrückt, dann wird es ruhiger, aber nicht zu lange, sonst zittert die Hand. Lasst los, um zu schießen. Mit 38 Ringen werdet Ihr Schützenkönig.',
    build(B){ B.obj('scheibe', 0, 3604, 2262); B.obj('festtisch', 0, 3470, 2330); B.obj('fass', 0, 3500, 2336); for (const [x, y, v] of [[3440, 2244, 0], [3640, 2244, 1]]) B.obj('banner', v, x, y); } },
  { id:'martini', sea:2, days:[3], extra:true, name:'Martinimarkt', where:'auf dem Markt in Augsburg', tune:'martini', game:'gans', gameName:'Gänsefangen', prize:'Silberne Martinsgans', c:[7440, 3795],
    host:{ name:'Gänsehirtin Els', at:[7420, 3816], o:{ robe:'long', hat:'tuch', apron:'linen', hairTop:false }, pal:{ 1:'#4a3a22', 2:'#64502e', 3:'#7e683c', 4:'#98804e', 5:'#7a2a1a', 6:'#9a3a22', 7:'#b8502e', 8:'#d06a40' },
      greet:['Sankt Martin hat seinen Mantel mit dem Bettler geteilt. Heute teilen wir die Gänse, gebraten.', 'Meine Gänse sind mir über den ganzen Markt davongelaufen! Helft Ihr mir?', 'Heute Abend ziehen die Kinder mit Laternen um den Markt.'] },
    gameText:'Sechs Martinsgänse sind der Hirtin über den Markt entwischt. Fangt sie alle in einer Minute und einer Viertelminute: Lauft ihnen nach, bis sie müde werden und sich hinsetzen, dann packt sie.',
    build(B){ const w = B.obj('feuerholz', 0, 7470, 3772); B.fires.push({ x: w.x, y: w.y - 10 }); B.obj('festtisch', 0, 7400, 3820);
      for (const [x, y] of [[7330, 3768], [7550, 3768], [7330, 3826], [7550, 3826]]){ const l = B.obj('laterne', 0, x, y); B.lights.push([l.x + 10, l.y - 60, 130, .9]); } } },
  { id:'fastnacht', sea:3, days:[3], extra:true, name:'Fastnacht', where:'auf dem Hauptmarkt in Nürnberg', tune:'fastnacht', game:'moriske', gameName:'Moriskentanz', prize:'Schembartmaske', c:[7700, 2300],
    host:{ name:'Schembarthauptmann Endres', at:[7724, 2322], o:{ robe:'short', hat:'narr', mask:true, parti:true, belt:true, hair:['h', 'j'] }, pal:{ 1:'#5a0e0e', 2:'#861a16', 3:'#ae2c22', 4:'#d0483a', 5:'#6a5010', 6:'#9a7a1c', 7:'#c8a030', 8:'#e6c44c' },
      greet:['Der Schembartlauf! Seit hundert Jahren laufen die Metzger und ihre Freunde vermummt durch Nürnberg.', 'Am Ende stürmen wir die Hölle, einen Wagen voller Teufel und Narren. Aber erst wird getanzt!', 'Morgen ist Aschermittwoch. Heute ist alles erlaubt, fast alles.'] },
    gameText:'Der Vortänzer zeigt die Schritte des Moriskentanzes vor, Ihr tanzt sie nach: mit den Pfeiltasten oder dem Steuerkreuz, in derselben Reihenfolge. Fünf Runden, jede einen Schritt länger. Zweimal daneben, und die Narren lachen Euch aus.',
    build(B){ B.obj('festtisch', 0, 7760, 2330); for (const [x, y, v] of [[7560, 2250, 0], [7980, 2250, 1]]) B.obj('banner', v, x, y);
      for (const x of [7600, 7800]){ const l = B.obj('laterne', 0, x, 2336); B.lights.push([l.x + 10, l.y - 60, 130, .9]); } } }
);
/* Speis und Trank der neuen Feste */
for (const fa of [
  { id:'osterfladen', kind:'speise', n:'Osterfladen mit Rosinen', fx:{ hpPct:10, regen:2 }, base:3, icon:'brot', fest:'ostern' },
  { id:'osterwasser', kind:'trank', n:'Osterwasser, vor Sonnenaufgang geschöpft', fx:{ regen:3, spd:4 }, base:2, icon:'krug', fest:'ostern' },
  { id:'spanferkel', kind:'speise', n:'Spanferkel vom Spieß', fx:{ hpPct:12, dmgPct:4 }, base:5, icon:'braten', fest:'schuetzen' },
  { id:'schuetzenbier', kind:'trank', n:'Schützenbier vom Fass', fx:{ crit:5, regen:1 }, base:3, icon:'krug', fest:'schuetzen' },
  { id:'martinsgans', kind:'speise', n:'Martinsgans mit Rotkraut', fx:{ hpPct:15, dmgPct:3 }, base:6, icon:'braten', fest:'martini' },
  { id:'martiniwein', kind:'trank', n:'Neuer Wein zu Martini', fx:{ spd:8, crit:2 }, base:3, icon:'wein', fest:'martini' },
  { id:'krapfen', kind:'speise', n:'Fastnachtskrapfen', fx:{ hpPct:8, crit:3 }, base:2, icon:'brot', fest:'fastnacht' },
  { id:'starkbier', kind:'trank', n:'Starkbier zur Fastnacht', fx:{ dmgPct:6 }, base:3, icon:'krug', fest:'fastnacht' }
]){ FARE.push(fa); FARE_BY[fa.id] = fa; }
/* Weisen der neuen Feste */
Object.assign(TUNES, {
  ostern: { sp: .24, w: 'triangle', v: .03, len: .22, bell: true, indoor: true,
    mel: [0,2,4,5, 7,null,5,4, 2,4,5,7, 4,null,null,null, 9,7,5,4, 2,4,5,2, 0,null,-1,0, 0,null,null,null],
    bass: [-24,-24,-19,-19,-17,-17,-24,-24] },
  schuetzen: { sp: .2, w: 'square', v: .022, len: .16, drum: true, indoor: true,
    mel: [0,null,0,4, 7,null,7,null, 5,4,2,4, 0,null,null,null, 7,null,7,9, 11,null,12,null, 7,5,4,2, 0,null,null,null],
    bass: [-24,-17,-24,-17,-19,-24,-17,-24] },
  martini: { sp: .28, w: 'triangle', v: .03, len: .3, bw: 'sine', bv: .018, blen: .9, indoor: true,
    mel: [-5,null,0,null, 2,0,-2,-5, -3,null,-5,null, -7,null,null,null, -5,-3,0,2, 3,2,0,-2, 0,null,-5,null, 0,null,null,null],
    bass: [-29,-29,-24,-24,-31,-31,-29,-29] },
  fastnacht: { sp: .15, w: 'square', v: .02, len: .12, drum: true, hat: true, indoor: true,
    mel: [7,5,4,5, 7,7,7,null, 5,4,2,4, 5,5,5,null, 7,9,7,5, 4,5,4,2, 0,2,4,2, 0,null,null,null],
    bass: [-24,-17,-24,-17,-22,-17,-24,-24] }
});
/* Leute bei den neuen Festen: Spazierende, Spielleute, Zuschauer, der Laternenzug und der Schembartlauf */
(() => {
  const add = o => { o.ents = []; o.act = false; o.cool = 0; LIFE_SPOTS.push(o); };
  const P = (x, y) => gPt({ x, y }), G4 = ['magd', 'baeuerin', 'bauer', 'knecht', 'buergerin', 'buerger'];
  const parade = (pts, t, n, fest) => {
    const path = pts.map(([x, y]) => P(x, y)), cum = [0]; let len = 0;
    for (let i = 0; i < path.length; i++){ const a = path[i], b = path[(i + 1) % path.length]; len += Math.hypot(b.x - a.x, b.y - a.y); cum.push(len); }
    add({ p: 'parade', t, x: path[0].x, y: path[0].y, path, cum, plen: len, n: [n, n], fest });
  };
  // Ostern in den Obstgärten
  add({ p: 'walk', t: G4, ...P(1700, 1030), r: 150, n: [4, 5], fest: 'ostern' });
  add({ p: 'stand', t: ['spielmann'], ...gNear(1676, 1000), dir: 'down', n: [1, 1], fest: 'ostern', music: true });
  // Schützenfest: Zuschauer an der Schießlinie, Schützen mit Hellebarden
  for (const [x, y] of [[3470, 2236], [3500, 2232], [3530, 2236]]) add({ p: 'stand', t: ['buerger', 'buergerin', 'wache'], ...gNear(x, y), dir: 'right', n: [1, 1], fest: 'schuetzen' });
  add({ p: 'walk', t: G4, ...P(3540, 2300), r: 160, n: [4, 5], fest: 'schuetzen' });
  add({ p: 'stand', t: ['spielmann'], ...gNear(3600, 2318), dir: 'left', n: [1, 1], fest: 'schuetzen', music: true });
  // Martini in Augsburg: Marktleute und der Laternenzug um den Markt
  add({ p: 'walk', t: G4, ...P(7440, 3795), r: 200, n: [3, 4], fest: 'martini' });
  add({ p: 'stand', t: ['spielmann'], ...gNear(7380, 3772), dir: 'down', n: [1, 1], fest: 'martini', music: true });
  parade([[7200, 3780], [7440, 3772], [7690, 3780], [7690, 3814], [7440, 3820], [7200, 3814]], ['knecht', 'magd', 'buergerin', 'buerger', 'magd', 'knecht'], 8, 'martini');
  // Fastnacht in Nürnberg: Schembartlauf um den Hauptmarkt, Narrentanz am Brunnen
  parade([[7500, 2264], [7700, 2258], [8060, 2264], [8060, 2332], [7700, 2338], [7500, 2332]], ['schembart'], 9, 'fastnacht');
  add({ p: 'dance', t: ['schembart'], cx: P(7700, 2300).x, cy: P(7700, 2300).y + 6, x: P(7700, 2300).x, y: P(7700, 2300).y, r: 64, n: [5, 5], fest: 'fastnacht' });
  for (const x of [7640, 7766]) add({ p: 'stand', t: ['spielmann'], ...gNear(x, 2276), dir: 'down', n: [1, 1], fest: 'fastnacht', music: true });
})();
/* Rekorde der neuen Festspiele (Ruhmeshalle) */
const fsSec = v => (v / 10).toFixed(1).replace('.', ',') + ' Sekunden';
for (const r of [
  { id: 'eier', f: 'fe', name: 'Ostereiersuche', fmt: fsSec, hi: false },
  { id: 'schiessen', f: 'fz', name: 'Armbrustschießen', fmt: v => v + ' Ringe', hi: true },
  { id: 'gans', f: 'fg', name: 'Gänsefangen', fmt: fsSec, hi: false },
  { id: 'moriske', f: 'fm', name: 'Moriskentanz', fmt: fsSec, hi: false }
]){ FREC.push(r); FREC_BY[r.id] = r; }

/* ---------- Ostereiersuche: zwölf Eier im Gras, anderthalb Minuten ---------- */
const FS_EGG = [['#c8302a', '#f06a50'], ['#2a5ab0', '#5a8ae0'], ['#e0b020', '#f8e070'], ['#3a8a3a', '#6ac06a'], ['#8a3aa8', '#b870d0'], ['#e07a20', '#f8a860']];
FG.eier = {
  start(g, F){
    Object.assign(g, { time: 90, used: 0, eggs: [], glintT: 1.5, glint: -1 });
    for (let i = 0; i < 12; i++){
      let q = null; for (let k = 0; k < 20 && !q; k++){ const c = gRandWalk(F.cx, F.cy + 20, 60, 440); if (c && g.eggs.every(e => Math.hypot(e.x - c.x, e.y - c.y) > 50)) q = c; }
      q = q || gRandWalk(F.cx, F.cy, 40, 300) || { x: F.cx + i * 20, y: F.cy };
      g.eggs.push({ x: q.x, y: q.y, c: i % FS_EGG.length, found: false });
    }
  },
  tick(g, dt){
    const k = G.knight;
    g.time -= dt; g.used += dt; updateKnight(dt);
    for (const e of g.eggs) if (!e.found && Math.hypot(k.x - e.x, k.y - e.y) < 18){
      e.found = true; Sound.tone(660 + g.eggs.filter(q => q.found).length * 40, .12, 'triangle', .04); burst(e.x, e.y - 4, FS_EGG[e.c], 8, 50);
      g.msg = 'Ein Ei! ' + g.eggs.filter(q => q.found).length + ' von 12'; g.msgC = '#9fe08a'; g.msgT = 1;
    }
    g.glintT -= dt;
    if (g.glintT <= 0){ const left = g.eggs.filter(q => !q.found); g.glint = left.length ? g.eggs.indexOf(pick(left)) : -1; g.glintT = 2.6; }
    const n = g.eggs.filter(q => q.found).length;
    if (n >= 12) return fgEnd(true, 'Alle zwölf Eier in ' + Math.round(g.used) + ' Sekunden gefunden!');
    if (g.time <= 0) return fgEnd(false, 'Die Zeit ist um. Ihr habt ' + n + ' von 12 Eiern gefunden.');
  },
  info: g => 'Eier ' + g.eggs.filter(q => q.found).length + ' von 12,  Zeit ' + Math.max(0, Math.ceil(g.time)),
  list(g, cam, list){
    g.eggs.forEach((e, i) => { if (!e.found && inView(e.x, e.y, cam, 20)) list.push({ y: e.y - 2, d: () => {
      const [c0, c1] = FS_EGG[e.c], x = Math.round(e.x), y = Math.round(e.y);
      ctx.fillStyle = OUT; ctx.fillRect(x - 3, y - 7, 6, 8); ctx.fillRect(x - 2, y - 8, 4, 10);
      ctx.fillStyle = c0; ctx.fillRect(x - 2, y - 6, 4, 6); ctx.fillRect(x - 1, y - 7, 2, 8);
      ctx.fillStyle = c1; ctx.fillRect(x - 1, y - 6, 1, 2); ctx.fillStyle = '#f8f4e8'; ctx.fillRect(x - 2, y - 3, 4, 1);
      ctx.fillStyle = 'rgba(40,70,30,.75)'; ctx.fillRect(x - 3, y - 1, 2, 2); ctx.fillRect(x + 1, y - 2, 2, 3);   // Grashalme davor
      if (i === g.glint && g.glintT > 1.9){ const a = (g.glintT - 1.9) / .7; ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y - 13, 1, 5); ctx.fillRect(x - 2, y - 11, 5, 1); ctx.globalAlpha = 1; }
    } }); });
  },
  rec(g, ok){ if (ok) festRecord('eier', g.used * 10); }
};

/* ---------- Armbrustschießen: fünf Bolzen, das Fadenkreuz wandert mit dem Atem ---------- */
FG.schiessen = {
  start(g, F, k){
    const p = gNear(3480, 2264), sc = (F.objs || []).find(o => o.kind === 'scheibe');
    Object.assign(g, { x0: p.x, y0: p.y, tx: sc ? sc.x : p.x + 248, ty: sc ? sc.y - 60 : p.y - 60, shots: 5, total: 0, hits: [], st: 'aim', hold: 0, ph: [rand(0, 6), rand(0, 6), rand(0, 6), rand(0, 6)], wind: rand(-.08, .08) });
    k.x = p.x; k.y = p.y; k.dir = 'right';
  },
  aim(g){ // Lage des Fadenkreuzes in Scheibenradien: der Atem wird ruhiger, wenn man ihn anhält, und zittert, wenn man es übertreibt
    const t = G.t, h = g.hold, calm = h < 1.4 ? 1 - h * .5 : .3 + (h - 1.4) * .55, A = .42 * clamp(calm, .3, 1.6);
    return [A * (Math.sin(t * 1.7 + g.ph[0]) + .55 * Math.sin(t * 3.3 + g.ph[1])) + g.wind, A * (Math.sin(t * 1.3 + g.ph[2]) + .55 * Math.sin(t * 2.9 + g.ph[3]))];
  },
  tick(g, dt, press){
    const k = G.knight; k.x = g.x0; k.y = g.y0; k.dir = 'right';
    if (g.st === 'aim'){
      if (press){ g.hold += dt; g.armed = true; }
      else if (g.armed){
        const [u, v] = FG.schiessen.aim(g), d = Math.hypot(u, v), pts = d >= 1 ? 0 : clamp(10 - Math.floor(d * 10), 1, 10);
        g.hits.push([u, v, pts]); g.total += pts; g.shots--; g.hold = 0; g.armed = false;
        g.st = 'fly'; g.ft = 0; k.atkT = .2; Sound.tone(220, .08, 'square', .03); Sound.swing();
        g.last = pts;
      }
    } else if (g.st === 'fly'){
      g.ft += dt / .45;
      if (g.ft >= 1){
        g.st = 'wait'; g.wt = .9; Sound.drop();
        g.msg = g.last ? g.last + (g.last === 1 ? ' Ring' : ' Ringe') + (g.last === 10 ? ', ins Schwarze!' : '') : 'Daneben!'; g.msgC = g.last >= 9 ? '#ffd541' : g.last ? '#ffffff' : '#ff9a8a'; g.msgT = 1.2;
        if (g.last === 10) Sound.cheer(.6);
      }
    } else if (g.st === 'wait'){
      g.wt -= dt;
      if (g.wt <= 0){
        if (g.shots <= 0) return fgEnd(g.total >= 38, g.total + ' Ringe mit fünf Bolzen.' + (g.total >= 38 ? ' Ihr seid Schützenkönig!' : ' Schützenkönig wird man mit 38.'));
        g.st = 'aim'; g.ph = g.ph.map(p => p + rand(1, 3)); g.wind = rand(-.08, .08);
      }
    }
  },
  info: g => 'Bolzen übrig ' + g.shots + ',  Ringe ' + g.total + ',  Schützenkönig ab 38',
  world(g){ if (g.st !== 'fly') return; const x = g.x0 + 10 + (g.tx - g.x0 - 10) * g.ft, y = g.y0 - 34 + (g.ty - g.y0 + 34) * g.ft - Math.sin(g.ft * Math.PI) * 10; ctx.fillStyle = '#3a2416'; ctx.fillRect(Math.round(x) - 5, Math.round(y), 7, 1); ctx.fillStyle = '#c8c2b0'; ctx.fillRect(Math.round(x) + 2, Math.round(y), 2, 1); },
  ui(g, btnTxt){
    const R = 64, cx = W - R - 26, cy = H / 2 - 10;
    ctx.fillStyle = 'rgba(16,14,20,.55)'; ctx.fillRect(cx - R - 10, cy - R - 10, R * 2 + 20, R * 2 + 20);
    for (let ring = 5; ring >= 1; ring--){ ctx.fillStyle = ring === 1 ? '#a8241e' : ring & 1 ? '#efe8d4' : '#26221e'; ctx.beginPath(); ctx.arc(cx, cy, R * ring / 5, 0, 6.283); ctx.fill(); }
    ctx.fillStyle = '#e0c040'; ctx.fillRect(cx - 1, cy - 1, 2, 2);
    for (const [u, v] of g.hits){ const x = Math.round(cx + u * R), y = Math.round(cy + v * R); ctx.fillStyle = OUT; ctx.fillRect(x - 2, y - 2, 5, 5); ctx.fillStyle = '#8a6a40'; ctx.fillRect(x - 1, y - 1, 3, 3); }
    if (g.st === 'aim'){
      const [u, v] = FG.schiessen.aim(g), x = Math.round(cx + u * R), y = Math.round(cy + v * R);
      ctx.fillStyle = OUT; ctx.fillRect(x - 9, y - 1, 19, 3); ctx.fillRect(x - 1, y - 9, 3, 19);
      ctx.fillStyle = g.hold > 2.2 ? '#ff7a5a' : '#ffffff'; ctx.fillRect(x - 8, y, 6, 1); ctx.fillRect(x + 3, y, 6, 1); ctx.fillRect(x, y - 8, 1, 6); ctx.fillRect(x, y + 3, 1, 6);
      drawText(g.hold > 0 ? (g.hold > 2.2 ? 'Die Hand zittert! Loslassen!' : 'Atem anhalten … loslassen zum Schuss') : btnTxt + ' gedrückt halten, loslassen zum Schuss', W / 2, H * .78, '#ffffff', 'c', 1.4);
    }
  },
  rec(g){ if (g.total > 0) festRecord('schiessen', g.total); }
};

/* ---------- Gänsefangen: sechs Gänse auf dem Markt, die müde werden ---------- */
FG.gans = {
  start(g, F, k){
    Object.assign(g, { time: 75, used: 0, geese: [] });
    for (let i = 0; i < 6; i++){
      const q = gRandWalk(F.cx, F.cy, 60, 360) || { x: F.cx + (i - 3) * 50, y: F.cy };
      g.geese.push({ x: q.x, y: q.y, dir: i & 1 ? 1 : -1, st: 'idle', stam: rand(2.2, 3.2), rest: 0, anim: 0, wT: rand(.5, 2), vx: 0, vy: 0, got: false });
    }
    const p = gNear(F.c[0], F.c[1] + 20); k.x = p.x; k.y = p.y;
  },
  tick(g, dt){
    const k = G.knight, F = g.f;
    g.time -= dt; g.used += dt; updateKnight(dt);
    for (const s of g.geese){
      if (s.got) continue;
      const dx = s.x - k.x, dy = s.y - k.y, d = Math.hypot(dx, dy) || 1;
      if (s.st === 'tired'){
        s.rest -= dt; s.anim = 0;
        if (d < 20){ s.got = true; Sound.tone(520, .1, 'square', .03); Sound.tone(780, .12, 'triangle', .03, 0, .1); burst(s.x, s.y - 8, ['#f2efe6', '#d8d4c8', '#e0782a'], 10, 60); g.msg = 'Gepackt! ' + g.geese.filter(q => q.got).length + ' von 6'; g.msgC = '#9fe08a'; g.msgT = 1; continue; }
        if (s.rest <= 0){ s.st = 'idle'; s.stam = rand(1.6, 2.4); }
        continue;
      }
      if (d < 100 && s.st !== 'flee'){ s.st = 'flee'; if (Math.random() < .5) Sound.tone(rand(500, 640), .08, 'square', .02, -120); }
      if (s.st === 'flee'){
        s.stam -= dt;
        let ax = dx / d, ay = dy / d;
        const hx = F.cx - s.x, hy = F.cy - s.y, hd = Math.hypot(hx, hy);   // nicht vom Markt laufen
        if (hd > 300){ ax += hx / hd * 1.2; ay += hy / hd * 1.2; }
        const l = Math.hypot(ax, ay) || 1, sp = 96;
        let nx = s.x + ax / l * sp * dt, ny = s.y + ay / l * sp * dt * .8;
        if (blocked(nx, ny)){ const a = Math.atan2(ay, ax) + (Math.random() < .5 ? 1.4 : -1.4); nx = s.x + Math.cos(a) * sp * dt; ny = s.y + Math.sin(a) * sp * dt; if (blocked(nx, ny)){ nx = s.x; ny = s.y; } }
        s.dir = nx >= s.x ? 1 : -1; s.x = nx; s.y = ny; s.anim += dt * 10;
        if (s.stam <= 0){ s.st = 'tired'; s.rest = rand(1.8, 2.6); g.msg = 'Eine Gans ist müde!'; g.msgC = '#ffd98a'; g.msgT = .8; }
        else if (d > 190) s.st = 'idle';
      } else {
        s.wT -= dt; s.stam = Math.min(3.2, s.stam + dt * .4);
        if (s.wT <= 0){ s.wT = rand(1, 2.5); const a = rand(0, 6.283); s.vx = Math.cos(a) * 20; s.vy = Math.sin(a) * 14; }
        const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
        if (!blocked(nx, ny) && Math.hypot(nx - F.cx, ny - F.cy) < 320){ s.x = nx; s.y = ny; s.dir = s.vx >= 0 ? 1 : -1; s.anim += dt * 4; }
      }
    }
    const n = g.geese.filter(q => q.got).length;
    if (n >= 6) return fgEnd(true, 'Alle sechs Gänse sind wieder bei der Hirtin, nach ' + Math.round(g.used) + ' Sekunden.');
    if (g.time <= 0) return fgEnd(false, 'Die Zeit ist um. Ihr habt ' + n + ' von 6 Gänsen gefangen.');
  },
  info: g => 'Gänse ' + g.geese.filter(q => q.got).length + ' von 6,  Zeit ' + Math.max(0, Math.ceil(g.time)),
  list(g, cam, list){
    const A = trArt('gans', 0);
    for (const s of g.geese) if (!s.got && inView(s.x, s.y, cam, 20)) list.push({ y: s.y, d: () => {
      const side = s.dir < 0 ? A.l : A, img = s.st === 'tired' ? side.graze : s.st === 'flee' ? side.walk[(s.anim | 0) % 4] : (s.anim | 0) % 6 < 3 ? side.stand : side.walk[(s.anim | 0) % 4];
      shadow(s.x, s.y, 6, .2); ctx.drawImage(img, Math.round(s.x - A.ax), Math.round(s.y - A.ay));
      if (s.st === 'tired'){ ctx.fillStyle = '#ffffff'; ctx.globalAlpha = .7; ctx.fillRect(Math.round(s.x) + 4, Math.round(s.y - A.ay) - 4, 3, 1); ctx.fillRect(Math.round(s.x) + 6, Math.round(s.y - A.ay) - 7, 2, 1); ctx.globalAlpha = 1; }
    } });
  },
  rec(g, ok){ if (ok) festRecord('gans', g.used * 10); }
};

/* ---------- Moriskentanz: Schritte vortanzen lassen und nachtanzen ---------- */
const FS_DIRS = ['up', 'right', 'down', 'left'];
function fsArrow(x, y, d, col, s){
  ctx.fillStyle = col; s = s || 1;
  for (let i = 0; i < 7; i++){
    const w = i * s, l = 7 * s;
    if (d === 'up') ctx.fillRect(x - w, y - l + i * s * 2, w * 2 + s, s * 2);
    else if (d === 'down') ctx.fillRect(x - w, y + l - i * s * 2 - s * 2, w * 2 + s, s * 2);
    else if (d === 'left') ctx.fillRect(x - l + i * s * 2, y - w, s * 2, w * 2 + s);
    else ctx.fillRect(x + l - i * s * 2 - s * 2, y - w, s * 2, w * 2 + s);
  }
}
FG.moriske = {
  start(g, F, k){
    const p = gNear(F.c[0], F.c[1] + 18), q = gNear(F.c[0], F.c[1] - 14);
    Object.assign(g, { x0: p.x, y0: p.y, lead: { x: q.x, y: q.y, art: vkPerson('schembart', 1), dir: 'down', hop: 0 }, round: 1, rounds: 5, miss: 0, used: 0, st: 'pause', pt: 1.2, seq: [], i: 0, neutral: true });
    k.x = p.x; k.y = p.y; k.dir = 'up';
  },
  next(g){ g.seq = []; for (let i = 0; i < g.round + 2; i++) g.seq.push(pick(FS_DIRS)); g.st = 'show'; g.i = 0; g.pt = .7; },
  tick(g, dt){
    const k = G.knight, L = g.lead;
    L.hop = Math.max(0, L.hop - dt * 4); k.lift = Math.max(0, (k.lift || 0) - dt * 60);
    if (g.st === 'pause'){ g.pt -= dt; if (g.pt <= 0) FG.moriske.next(g); }
    else if (g.st === 'show'){
      g.pt -= dt;
      if (g.pt <= 0){
        if (g.i >= g.seq.length){ g.st = 'play'; g.i = 0; g.stepT = 4; L.dir = 'down'; g.msg = 'Jetzt Ihr!'; g.msgC = '#ffd98a'; g.msgT = .9; return; }
        L.dir = g.seq[g.i]; L.hop = 1; Sound.tone([392, 440, 494, 523][FS_DIRS.indexOf(g.seq[g.i])], .14, 'triangle', .04); Sound.noise && Sound.noise(.03, .04, 1800);
        g.i++; g.pt = .62;
      }
    } else if (g.st === 'play'){
      g.used += dt; g.stepT -= dt;
      const v = inputVec(), mag = Math.hypot(v.x, v.y);
      let d = null;
      if (mag > .6 && g.neutral){ d = Math.abs(v.x) > Math.abs(v.y) ? (v.x > 0 ? 'right' : 'left') : (v.y > 0 ? 'down' : 'up'); g.neutral = false; }
      if (mag < .3) g.neutral = true;
      if (d || g.stepT <= 0){
        const want = g.seq[g.i];
        if (d === want){ k.dir = d; k.lift = 8; g.i++; g.stepT = 4; Sound.tone([392, 440, 494, 523][FS_DIRS.indexOf(d)], .14, 'triangle', .04); }
        else {
          g.miss++; g.stepT = 4; Sound.tone(180, .25, 'sawtooth', .04, -60);
          g.msg = d ? 'Falscher Schritt!' : 'Zu langsam!'; g.msgC = '#ff9a8a'; g.msgT = 1;
          if (g.miss >= 2) return fgEnd(false, 'Die Narren lachen: Ihr seid aus dem Takt gekommen. Runde ' + g.round + ' von ' + g.rounds + '.');
          g.st = 'show'; g.i = 0; g.pt = .9; return;   // die Runde noch einmal vortanzen
        }
        if (g.i >= g.seq.length){
          Sound.cheer(.5); g.msg = 'Bravo!'; g.msgC = '#9fe08a'; g.msgT = 1;
          if (g.round >= g.rounds) return fgEnd(true, 'Ihr habt alle fünf Runden des Moriskentanzes getanzt. Die Narren werfen ihre Kappen in die Luft!');
          g.round++; g.st = 'pause'; g.pt = 1.1;
        }
      }
    }
    k.x = g.x0; k.y = g.y0; k.moving = false;
  },
  info: g => 'Runde ' + g.round + ' von ' + g.rounds + ',  daneben ' + g.miss + ' von 2',
  list(g, cam, list){
    const L = g.lead, A = L.art; list.push({ y: L.y, d: () => { const img = L.hop > 0 ? (A[L.dir] || A.down)[1] : A.stand[L.dir] || A.stand.down; shadow(L.x, L.y, 8, .25); ctx.drawImage(img, Math.round(L.x - A.ax), Math.round(L.y - A.ay - Math.sin(L.hop * Math.PI) * 6)); } });
  },
  ui(g){
    const n = g.seq.length, gap = 30, x0 = W / 2 - (n - 1) * gap / 2, y = H * .2;
    if (g.st === 'show' || g.st === 'play'){
      ctx.fillStyle = 'rgba(16,14,20,.55)'; ctx.fillRect(x0 - 22, y - 18, (n - 1) * gap + 44, 36);
      g.seq.forEach((d, i) => {
        const x = Math.round(x0 + i * gap);
        if (g.st === 'show') fsArrow(x, y, d, i < g.i - 1 ? '#7a7466' : i === g.i - 1 ? '#ffd541' : '#3a3630', 1.4);
        else fsArrow(x, y, i < g.i ? d : 'down', i < g.i ? '#9fe08a' : '#4a4650', i < g.i ? 1.4 : .7);
      });
      drawText(g.st === 'show' ? 'Schaut genau hin …' : 'Tanzt nach: Pfeiltasten oder Steuerkreuz', W / 2, H * .78, '#ffffff', 'c', 1.4);
    }
  },
  rec(g, ok){ if (ok) festRecord('moriske', g.used * 10); }
};
VK_SAY.schembart = ['Hoho! Der Schembart läuft!', 'Wer bin ich? Das ratet Ihr nie!', 'Narren, Teufel und Wilde Männer, heute gehört uns die Stadt!', 'Morgen wird gefastet, heute getanzt!'];
