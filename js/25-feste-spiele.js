"use strict";
/* Der Apfelritter, Teil 25 von 28: Feste und Spiele: Ostern, Schützenfest, Martini und Fastnacht mit ihren Spielen;
   Mühle, Einunddreißig, Kegeln und Ringen im Gasthaus.
   Die Teile werden in der Reihenfolge der Nummern geladen und teilen sich alle Namen der obersten Ebene. */

/* ============ Vier neue Feste (Version 27) ============
   An den freien Tagen jeder Jahreszeit: Ostern am ersten Frühlingstag in den Obstgärten, das Schützenfest am letzten Sommertag
   auf der Turnierwiese, der Martinimarkt am letzten Herbsttag in Goldbrunn, die Fastnacht mit dem Schembartlauf am letzten
   Wintertag in Burgfelden. Jedes hat einen Gastgeber mit Speis und Trank, Musik, Leute und ein eigenes Spiel (FG, Teil 14). */
FESTS.push(
  { id:'ostern', sea:0, days:[0], extra:true, name:'Osterfest', where:'in den Obstgärten bei Lindach', tune:'ostern', game:'eier', gameName:'Ostereiersuche', prize:'Goldenes Osterei', c:[1700, 1020],
    host:{ name:'Bäuerin Walburg', at:[1650, 1052], o:{ robe:'long', hat:'tuch', apron:'linen' }, pal:{ 1:'#3a5a8a', 2:'#4a6ea6', 3:'#5e86c0', 4:'#7aa0d6', 5:'#a8801c', 6:'#c89c28', 7:'#e0b83a', 8:'#f0d460' },
      greet:['Frohe Ostern, Herr Ritter! Die Fastenzeit ist vorbei, heute wird gegessen.', 'Die Kinder haben bunte Eier zwischen den Apfelbäumen versteckt. Findet Ihr sie alle?', 'Am Osterfeuer hat der Pfarrer die Flammen gesegnet. Das bringt Glück für das ganze Jahr.'] },
    gameText:'Zwölf bunte Eier liegen versteckt im Gras zwischen den Apfelbäumen. Findet sie in anderthalb Minuten: Lauft einfach darüber. Ab und zu blitzt eines in der Sonne auf.',
    build(B){ const w = B.obj('feuerholz', 0, 1748, 996); B.fires.push({ x: w.x, y: w.y - 10 }); B.obj('festtisch', 0, 1640, 1070); B.obj('heuhaufen', 0, 1780, 1050); B.obj('banner', 0, 1606, 1000); } },
  { id:'schuetzen', sea:1, days:[3], extra:true, name:'Schützenfest', where:'auf der Turnierwiese vor dem Osttor', tune:'schuetzen', game:'schiessen', gameName:'Armbrustschießen', prize:'Silberner Schützenvogel', c:[3540, 2262],
    host:{ name:'Schützenmeister Lienhart', at:[3466, 2294], o:{ robe:'short', hat:'barett', parti:true, belt:true, beard:true, hair:['h', 'j'] }, pal:{ 1:'#1c4a24', 2:'#2a6a32', 3:'#3e8a44', 4:'#5aaa5a', 5:'#6a5010', 6:'#9a7a1c', 7:'#c8a030', 8:'#e6c44c' },
      greet:['Willkommen zum Schützenfest! Wer die meisten Ringe schießt, ist ein Jahr lang Schützenkönig.', 'Die Goldbrunner haben neunzehnhundert Schützen zu ihrem Schießen geladen. Wir sind bescheidener, aber zielen genauer.', 'Fünfzig Schritt bis zur Scheibe. Haltet den Atem an, Herr Ritter.'] },
    gameText:'Fünf Bolzen auf die Scheibe. Das Fadenkreuz wandert mit Eurem Atem: Haltet den Hieb gedrückt, dann wird es ruhiger, aber nicht zu lange, sonst zittert die Hand. Lasst los, um zu schießen. Mit 38 Ringen werdet Ihr Schützenkönig.',
    build(B){ B.obj('scheibe', 0, 3604, 2262); B.obj('festtisch', 0, 3470, 2330); B.obj('fass', 0, 3500, 2336); for (const [x, y, v] of [[3440, 2244, 0], [3640, 2244, 1]]) B.obj('banner', v, x, y); } },
  { id:'martini', sea:2, days:[3], extra:true, name:'Martinimarkt', where:'auf dem Markt in Goldbrunn', tune:'martini', game:'gans', gameName:'Gänsefangen', prize:'Silberne Martinsgans', c:[7440, 3795],
    host:{ name:'Gänsehirtin Els', at:[7420, 3816], o:{ robe:'long', hat:'tuch', apron:'linen', hairTop:false }, pal:{ 1:'#4a3a22', 2:'#64502e', 3:'#7e683c', 4:'#98804e', 5:'#7a2a1a', 6:'#9a3a22', 7:'#b8502e', 8:'#d06a40' },
      greet:['Sankt Martin hat seinen Mantel mit dem Bettler geteilt. Heute teilen wir die Gänse, gebraten.', 'Meine Gänse sind mir über den ganzen Markt davongelaufen! Helft Ihr mir?', 'Heute Abend ziehen die Kinder mit Laternen um den Markt.'] },
    gameText:'Sechs Martinsgänse sind der Hirtin über den Markt entwischt. Fangt sie alle in einer Minute und einer Viertelminute: Lauft ihnen nach, bis sie müde werden und sich hinsetzen, dann packt sie.',
    build(B){ const w = B.obj('feuerholz', 0, 7470, 3772); B.fires.push({ x: w.x, y: w.y - 10 }); B.obj('festtisch', 0, 7400, 3820);
      for (const [x, y] of [[7330, 3768], [7550, 3768], [7330, 3826], [7550, 3826]]){ const l = B.obj('laterne', 0, x, y); B.lights.push([l.x + 10, l.y - 60, 130, .9]); } } },
  { id:'fastnacht', sea:3, days:[3], extra:true, name:'Fastnacht', where:'auf dem Hauptmarkt in Burgfelden', tune:'fastnacht', game:'moriske', gameName:'Moriskentanz', prize:'Schembartmaske', c:[7752, 2300],
    host:{ name:'Schembarthauptmann Endres', at:[7800, 2330], o:{ robe:'short', hat:'narr', mask:true, parti:true, belt:true, hair:['h', 'j'] }, pal:{ 1:'#5a0e0e', 2:'#861a16', 3:'#ae2c22', 4:'#d0483a', 5:'#6a5010', 6:'#9a7a1c', 7:'#c8a030', 8:'#e6c44c' },
      greet:['Der Schembartlauf! Seit hundert Jahren laufen die Metzger und ihre Freunde vermummt durch Burgfelden.', 'Am Ende stürmen wir die Hölle, einen Wagen voller Teufel und Narren. Aber erst wird getanzt!', 'Morgen ist Aschermittwoch. Heute ist alles erlaubt, fast alles.'] },
    gameText:'Der Vortänzer zeigt die Schritte des Moriskentanzes vor, Ihr tanzt sie nach: mit den Pfeiltasten oder dem Steuerkreuz, in derselben Reihenfolge. Fünf Runden, jede einen Schritt länger. Zweimal daneben, und die Narren lachen Euch aus.',
    build(B){ B.obj('festtisch', 0, 7716, 2342); for (const [x, y, v] of [[7560, 2250, 0], [7980, 2250, 1]]) B.obj('banner', v, x, y);
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
  // Martini in Goldbrunn: Marktleute und der Laternenzug um den Markt
  add({ p: 'walk', t: G4, ...P(7440, 3795), r: 200, n: [3, 4], fest: 'martini' });
  add({ p: 'stand', t: ['spielmann'], ...gNear(7380, 3772), dir: 'down', n: [1, 1], fest: 'martini', music: true });
  parade([[7200, 3780], [7440, 3772], [7690, 3780], [7690, 3814], [7440, 3820], [7200, 3814]], ['knecht', 'magd', 'buergerin', 'buerger', 'magd', 'knecht'], 8, 'martini');
  // Fastnacht in Burgfelden: Schembartlauf um den Hauptmarkt, Narrentanz am Brunnen
  parade([[7500, 2264], [7700, 2258], [8060, 2264], [8060, 2332], [7700, 2338], [7500, 2332]], ['schembart'], 9, 'fastnacht');
  add({ p: 'dance', t: ['schembart'], cx: P(7752, 2300).x, cy: P(7752, 2300).y + 6, x: P(7752, 2300).x, y: P(7752, 2300).y, r: 58, n: [5, 5], fest: 'fastnacht' });
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
    const n = g.seq.length, gap = 34, x0 = W / 2 - (n - 1) * gap / 2, y = 68;
    if (g.st === 'show' || g.st === 'play'){
      ctx.fillStyle = 'rgba(16,14,20,.78)'; ctx.fillRect(x0 - 24, y - 20, (n - 1) * gap + 48, 40);
      g.seq.forEach((d, i) => {
        const x = Math.round(x0 + i * gap);
        if (g.st === 'show') fsArrow(x, y, d, i < g.i - 1 ? '#8a8476' : i === g.i - 1 ? '#ffd541' : '#4a4650', 1.6);
        else if (i < g.i) fsArrow(x, y, d, '#9fe08a', 1.6); else { ctx.fillStyle = i === g.i ? '#ffd98a' : '#5a5660'; ctx.fillRect(x - 3, y - 3, 6, 6); }
      });
      drawText(g.st === 'show' ? 'Schaut genau hin …' : 'Tanzt nach: Pfeiltasten oder Steuerkreuz', W / 2, H * .78, '#ffffff', 'c', 1.4);
    }
  },
  rec(g, ok){ if (ok) festRecord('moriske', g.used * 10); }
};
VK_SAY.schembart = ['Hoho! Der Schembart läuft!', 'Wer bin ich? Das ratet Ihr nie!', 'Narren, Teufel und Wilde Männer, heute gehört uns die Stadt!', 'Morgen wird gefastet, heute getanzt!'];

/* ============ Spiele im Gasthaus (Version 27) ============
   Vier neue Gäste in jedem Gasthaus: Schulmeister Ambrosius spielt Mühle, die Spielerin Kathrein Einunddreißig, Kegelbruder Kunz
   lädt zum Kegeln, Ringer Jörg zum Ringen nach den Regeln des Fabian von Auerswald. Gespielt wird um 5, 20 oder 50 Gulden;
   wer gewinnt, bekommt den doppelten Einsatz zurück, bei Gleichstand den eigenen. Siege zählen fürs Trophäenbuch (HERO.fsw). */
INN_ART.schulmeister = np_frames({ robe:'long', hat:'barett', belt:true, beard:true, hair:['w', 'x'] },
  { 1:'#141218', 2:'#221e28', 3:'#322c3a', 4:'#463e50', 5:'#141218', 6:'#221e28', 7:'#322c3a', 8:'#463e50' });
INN_ART.spielerin = np_frames({ robe:'long', hat:'haube', apron:'linen', chain:true },
  { 1:'#3a1438', 2:'#562050', 3:'#743068', 4:'#924a84', 5:'#3a2c1e', 6:'#4a3a28', 7:'#5a4a34', 8:'#6e5c44' });
INN_ART.kegler = np_frames({ robe:'short', hat:'filz', belt:true, beard:true, hair:['h', 'j'] },
  { 1:'#4a3a20', 2:'#64502c', 3:'#7e683a', 4:'#98804c', 5:'#2c3424', 6:'#3e4a32', 7:'#526044', 8:'#6a7a58' });
INN_ART.ringer = np_frames({ robe:'short', belt:true, beard:true, hairSide:true, hair:['j', 'h'] },
  { 1:'#8a8270', 2:'#aca490', 3:'#cac2ac', 4:'#e4dec8', 5:'#3a2a1c', 6:'#4e3a26', 7:'#624a32', 8:'#78603e' });
function innMore(inn, npcs){
  npcs.push(
    { id:'schulmeister', key:'schulmeister_' + inn.id, name:'Schulmeister Ambrosius', role:'Mühle', x: 365, y: 235, art: INN_ART.schulmeister, fsGame: 'muehle',
      greet:['Eine Partie Mühle, Herr Ritter? Neun Steine, drei Reihen, ein klarer Kopf.', 'Ich lehre die Kinder Latein und Rechnen. Beim Mühlespiel lerne ich selbst noch dazu.', 'Wer drei Steine in eine Reihe bringt, darf dem anderen einen nehmen. So einfach, so schwer.'] },
    { id:'spielerin', key:'spielerin_' + inn.id, name:'Spielerin Kathrein', role:'Einunddreißig', x: 625, y: 251, art: INN_ART.spielerin, fsGame: 'karten',
      greet:['Einunddreißig, Herr Ritter? Wer näher an die Einunddreißig kommt, gewinnt. Wer drüber kommt, verliert.', 'Die Karten sind aus Burgfelden, frisch gedruckt. Eicheln, Grün, Herz und Schellen.', 'Der Pfarrer sagt, Karten seien des Teufels Gebetbuch. Er spielt trotzdem jeden Freitag.'] },
    { id:'kegler', key:'kegler_' + inn.id, name:'Kegelbruder Kunz', role:'Kegeln', x: 215, y: 377, art: INN_ART.kegler, fsGame: 'kegeln',
      greet:['Hinten im Hof ist die Kegelbahn. Drei Würfe, wer mehr Kegel umwirft, gewinnt!', 'Alle Neune! Das hab ich zuletzt an Martini geschafft.', 'Zielen, Schwung holen, loslassen. Mehr ist es nicht. Eigentlich.'] },
    { id:'ringer', key:'ringer_' + inn.id, name:'Ringer Jörg', role:'Ringen', x: 486, y: 389, art: INN_ART.ringer, fsGame: 'ringen',
      greet:['Ringen ohne Harnisch, Herr Ritter, Mann gegen Mann. Wer zweimal liegt, hat verloren.', 'Meister Fabian, der Ringmeister des Herzogs, hat mir drei Griffe gezeigt. Den vierten habe ich selbst erfunden.', 'Kraft ist gut. Das richtige Maß ist besser.'] });
}
const FS_GAMES = {
  muehle: { label: 'Eine Partie Mühle spielen', foe: 'Der Schulmeister', intro: 'Mühle um einen Einsatz: Jeder hat neun Steine. Erst werden sie gesetzt, dann gezogen. Drei in einer Reihe sind eine Mühle, dann nehmt Ihr dem anderen einen Stein. Wer nur noch zwei hat oder nicht mehr ziehen kann, verliert. Ihr spielt Weiß und fangt an.' },
  karten: { label: 'Einunddreißig spielen', foe: 'Kathrein', intro: 'Einunddreißig: Sieben bis Zehn zählen ihre Augen, Unter zwei, Ober drei, König vier und das Daus elf. Ihr zieht Karten, solange Ihr wollt. Wer näher an die Einunddreißig kommt, gewinnt, wer darüber kommt, verliert sofort.' },
  kegeln: { label: 'Auf der Kegelbahn kegeln', foe: 'Kunz', intro: 'Drei Würfe auf neun Kegel. Erst wählt Ihr die Richtung, dann den Schwung, beides mit dem Knopf, wenn die Marke richtig steht. Wer zusammen mehr Kegel umwirft, gewinnt.' },
  ringen: { label: 'Mit Jörg ringen', foe: 'Jörg', intro: 'Ringen in drei Gängen: Jörg drückt Euch stetig zurück. Drückt den Knopf, wenn die Marke im grünen Feld steht, dann schiebt Ihr ihn zurück. Wer den anderen zu Boden bringt, gewinnt den Gang. Wer zwei Gänge gewinnt, gewinnt das Ringen.' }
};
function fsTalkOpts(n, opts){ if (n.fsGame && G.inside) opts.append(btn(FS_GAMES[n.fsGame].label, () => { G.fs = null; renderTalk('fsBet'); }, 'opt')); }
function fsStart(kind, stake){
  if (HERO.gold < stake) return;
  HERO.gold -= stake; updateHud();
  G.fs = Object.assign({ kind, stake, res: null }, FS_PLAY[kind].start());
  renderTalk('fsPlay');
}
/* Ende eines Spiels: 1 gewonnen, 0 Gleichstand, -1 verloren */
function fsEnd(S, res){
  if (S.res !== null) return;
  S.res = res;
  if (res > 0){ HERO.gold += S.stake * 2; Sound.gold(); HERO.fsw = HERO.fsw || {}; HERO.fsw[S.kind] = (HERO.fsw[S.kind] | 0) + 1; logLine('Gewonnen! Ihr streicht ' + S.stake * 2 + ' Gulden ein.', '#ffd98a'); }
  else if (res === 0){ HERO.gold += S.stake; logLine('Gleichstand. Jeder behält seinen Einsatz.', '#d8c69c'); }
  else { Sound.tone(180, .3, 'triangle', .04, -60); logLine('Verloren. Der Einsatz ist weg.', '#d8c69c'); }
  updateHud(); markDirty(true);
}
function fsView(view, body, opts){
  const n = G.talk, kind = n && n.fsGame, D = FS_GAMES[kind]; if (!D) return;
  if (view === 'fsBet' || !G.fs){
    $('talkText').textContent = D.intro + ' Ihr habt ' + HERO.gold + ' Gulden.';
    for (const st of [5, 20, 50]){ const b = btn('Um ' + st + ' Gulden', () => fsStart(kind, st), 'opt'); b.disabled = HERO.gold < st; opts.append(b); }
    opts.append(btn('Zurück', () => renderTalk('main'), 'tbtn'));
    body.append(opts); return;
  }
  const S = G.fs;
  FS_PLAY[kind].view(S, body, opts);
  if (S.res !== null){
    const again = btn('Noch einmal um ' + S.stake, () => fsStart(kind, S.stake), 'opt'); again.disabled = HERO.gold < S.stake;
    opts.append(again, btn('Anderer Einsatz', () => { G.fs = null; renderTalk('fsBet'); }, 'opt'));
  }
  opts.append(btn('Zurück', () => { if (S.res === null) fsEnd(S, -1); G.fs = null; renderTalk('main'); }, 'tbtn'));
  body.append(opts);
}
const fsLive = S => G.fs === S && G.mode === 'menu' && G.talk && !$('ovTalk').hidden;

/* ---------- Mühle ---------- */
const MU_P = [[0, 0], [3, 0], [6, 0], [1, 1], [3, 1], [5, 1], [2, 2], [3, 2], [4, 2], [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3], [2, 4], [3, 4], [4, 4], [1, 5], [3, 5], [5, 5], [0, 6], [3, 6], [6, 6]];
const MU_ADJ = [[1, 9], [0, 2, 4], [1, 14], [4, 10], [1, 3, 5, 7], [4, 13], [7, 11], [4, 6, 8], [7, 12], [0, 10, 21], [3, 9, 11, 18], [6, 10, 15], [8, 13, 17], [5, 12, 14, 20], [2, 13, 23], [11, 16], [15, 17, 19], [12, 16], [10, 19], [16, 18, 20, 22], [13, 19], [9, 22], [19, 21, 23], [14, 22]];
const MU_MILLS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23], [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23]];
const muInMill = (b, i) => MU_MILLS.some(m => m.includes(i) && m.every(j => b[j] === b[i]));
const muCount = (b, p) => b.filter(v => v === p).length;
const muRemovable = (b, p) => { const all = b.map((v, i) => v === p ? i : -1).filter(i => i >= 0), free = all.filter(i => !muInMill(b, i)); return free.length ? free : all; };
function muMoves(S, p){   // alle Züge: [von, nach] (von -1 = setzen)
  const b = S.b, out = [];
  if (S.hand[p] > 0){ for (let i = 0; i < 24; i++) if (!b[i]) out.push([-1, i]); return out; }
  const fly = muCount(b, p) === 3;
  for (let i = 0; i < 24; i++) if (b[i] === p) for (const j of (fly ? [...Array(24).keys()] : MU_ADJ[i])) if (!b[j]) out.push([i, j]);
  return out;
}
const muThreats = (b, p) => MU_MILLS.filter(m => m.filter(j => b[j] === p).length === 2 && m.some(j => !b[j])).map(m => m.find(j => !b[j]));
function muCheckEnd(S){
  for (const p of [1, 2]){
    const left = muCount(S.b, p) + S.hand[p];
    if (left < 3 || (S.hand[p] === 0 && !muMoves(S, p).length && muCount(S.b, p) > 3)){ fsEnd(S, p === 2 ? 1 : -1); return true; }
  }
  return false;
}
function muAI(S){
  const b = S.b, moves = muMoves(S, 2);
  if (!moves.length){ muCheckEnd(S); return; }
  let best = null, bs = -1e9;
  for (const [f, t] of moves){
    const nb = b.slice(); if (f >= 0) nb[f] = 0; nb[t] = 2;
    let s = Math.random() * 4;
    if (muInMill(nb, t)) s += 100;
    if (muThreats(b, 1).includes(t)) s += 55;                      // eine Mühle des Ritters verhindern
    s += muThreats(nb, 2).length * 12;                             // eigene Zwickmühlen vorbereiten
    if (f >= 0 && muThreats(nb, 1).some(x => x === f)) s -= 45;    // nicht den Weg freimachen
    if (s > bs){ bs = s; best = [f, t]; }
  }
  const [f, t] = best;
  if (f >= 0) b[f] = 0; else S.hand[2]--;
  b[t] = 2; S.last = t;
  if (muInMill(b, t)){
    const rm = muRemovable(b, 1), th = muThreats(b, 1), pref = rm.filter(i => MU_MILLS.some(m => m.includes(i) && th.some(x => m.includes(x))));
    const r = pick(pref.length ? pref : rm); b[r] = 0; S.msg = 'Der Schulmeister schließt eine Mühle und nimmt Euch einen Stein.'; Sound.tone(220, .2, 'square', .03);
  } else S.msg = '';
  S.turn = 1; muCheckEnd(S);
}
function muClick(S, i){
  if (S.res !== null || S.turn !== 1) return;
  const b = S.b;
  if (S.remove){
    if (b[i] !== 2 || !muRemovable(b, 2).includes(i)) return;
    b[i] = 0; S.remove = false; Sound.tone(520, .1, 'square', .03);
    if (!muCheckEnd(S)) muAfter(S);
    return renderTalk('fsPlay');
  }
  if (S.hand[1] > 0){
    if (b[i]) return;
    b[i] = 1; S.hand[1]--; Sound.tone(330, .06, 'triangle', .03);
  } else {
    if (b[i] === 1){ S.sel = i; return renderTalk('fsPlay'); }
    const fly = muCount(b, 1) === 3;
    if (b[i] || S.sel == null || (!fly && !MU_ADJ[S.sel].includes(i))) return;
    b[S.sel] = 0; b[i] = 1; S.sel = null; Sound.tone(330, .06, 'triangle', .03);
  }
  if (muInMill(b, i)){ S.remove = true; S.msg = 'Mühle! Nehmt dem Schulmeister einen Stein.'; Sound.tone(660, .15, 'square', .03); return renderTalk('fsPlay'); }
  if (!muCheckEnd(S)) muAfter(S);
  renderTalk('fsPlay');
}
function muAfter(S){
  S.turn = 2; S.msg = 'Der Schulmeister überlegt …';
  setTimeout(() => { if (G.fs !== S || S.res !== null) return; muAI(S); if (fsLive(S)) renderTalk('fsPlay'); }, 550);
}
const FS_PLAY = {};
FS_PLAY.muehle = {
  start: () => ({ b: Array(24).fill(0), hand: [0, 9, 9], turn: 1, sel: null, remove: false, msg: '', last: -1 }),
  view(S, body){
    const me = muCount(S.b, 1) + S.hand[1], op = muCount(S.b, 2) + S.hand[2];
    $('talkText').textContent = S.res !== null ? (S.res > 0 ? 'Gewonnen! „Ihr spielt wie ein Magister, Herr Ritter.“ Ihr bekommt ' + S.stake * 2 + ' Gulden.' : 'Verloren. „Kopf hoch, die nächste Partie gehört vielleicht Euch.“')
      : S.msg || (S.remove ? 'Mühle! Nehmt dem Schulmeister einen Stein.' : S.hand[1] > 0 ? 'Setzt einen Stein (noch ' + S.hand[1] + ' in der Hand).' : muCount(S.b, 1) === 3 ? 'Ihr habt nur noch drei Steine und dürft springen: Stein wählen, dann ein freies Feld.' : 'Zieht einen Stein: erst wählen, dann auf ein freies Nachbarfeld.');
    body.append(el('p', 'hint', 'Ihr: ' + me + ' Steine · Schulmeister: ' + op + ' Steine · Einsatz ' + S.stake + ' Gulden'));
    const box = el('div', 'fsboard'), NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    const P = i => [8 + MU_P[i][0] * 14, 8 + MU_P[i][1] * 14];
    for (const [a, c] of [[0, 2], [2, 23], [23, 21], [21, 0], [3, 5], [5, 20], [20, 18], [18, 3], [6, 8], [8, 17], [17, 15], [15, 6], [1, 7], [16, 22], [9, 11], [12, 14]]){
      const l = document.createElementNS(NS, 'line'), [x1, y1] = P(a), [x2, y2] = P(c);
      l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); svg.append(l);
    }
    box.append(svg);
    const can = S.res === null && S.turn === 1 ? (S.remove ? muRemovable(S.b, 2) : S.hand[1] > 0 || S.sel != null ? muMoves(S, 1).filter(m => S.hand[1] > 0 || m[0] === S.sel).map(m => m[1]) : muMoves(S, 1).map(m => m[0])) : [];
    for (let i = 0; i < 24; i++){
      const [x, y] = P(i), b = el('button', 'pt' + (S.b[i] === 1 ? ' w' : S.b[i] === 2 ? ' b' : '') + (S.sel === i ? ' sel' : '') + (can.includes(i) ? ' can' : '') + (S.last === i && S.b[i] === 2 ? ' last' : ''));
      b.type = 'button'; b.style.left = x + '%'; b.style.top = y + '%';
      b.setAttribute('aria-label', 'Feld ' + (i + 1) + (S.b[i] === 1 ? ', Euer Stein' : S.b[i] === 2 ? ', Stein des Schulmeisters' : ', frei'));
      b.addEventListener('click', () => muClick(S, i)); box.append(b);
    }
    body.append(box);
  }
};

/* ---------- Einunddreißig ---------- */
const CA_SUIT = ['eichel', 'gruen', 'herz', 'schellen'], CA_RANK = [['7', 7], ['8', 8], ['9', 9], ['10', 10], ['U', 2], ['O', 3], ['K', 4], ['D', 11]];
const CA_GLYPH = { 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'], 1: ['010', '110', '010', '010', '111'], 0: ['111', '101', '101', '101', '111'],
  U: ['101', '101', '101', '101', '111'], O: ['111', '101', '101', '101', '111'], K: ['101', '110', '100', '110', '101'], D: ['110', '101', '101', '101', '110'] };
const CA_ICON = {   // Farbzeichen, 7 × 7
  eichel: [['..aaa..', '.aaaaa.', '.bbbbb.', '.bcbcb.', '..bbb..', '...b...', '...d...'], { a: '#5a3a1a', b: '#c89a3a', c: '#a8782a', d: '#3a2a1a' }],
  gruen: [['...a...', '..aaa..', '.aabaa.', 'aaabaaa', '.aabaa.', '..aba..', '...d...'], { a: '#3e8a3a', b: '#2a5a26', d: '#3a2a1a' }],
  herz: [['.aa.aa.', 'abbabba', 'abbbbba', '.abbba.', '..aba..', '...a...', '.......'], { a: '#8a1c1c', b: '#d03a2c' }],
  schellen: [['...d...', '..aaa..', '.abbba.', '.abcba.', '.abbba.', '..aaa..', '...d...'], { a: '#8a6a1a', b: '#e0b83a', c: '#3a2a1a', d: '#3a2a1a' }]
};
const CA_URL = {};
function caCard(c){
  const key = c ? c.s + c.r : 'back'; if (CA_URL[key]) return CA_URL[key];
  const cv = canvasOf(15, 21), g = cv.getContext('2d');
  g.fillStyle = '#16120f'; g.fillRect(1, 0, 13, 21); g.fillRect(0, 1, 15, 19);
  if (!c){ g.fillStyle = '#6a1a1a'; g.fillRect(1, 1, 13, 19); g.fillStyle = '#a8382a'; for (let y = 2; y < 19; y += 2) for (let x = 2 + (y >> 1) % 2; x < 13; x += 2) g.fillRect(x, y, 1, 1); return (CA_URL[key] = urlOf(cv, 3)); }
  g.fillStyle = '#efe6cc'; g.fillRect(1, 1, 13, 19);
  const txt = c.r === '10' ? ['1', '0'] : [c.r], col = c.s === 'herz' ? '#a8241e' : '#2a2018';
  txt.forEach((ch, k) => CA_GLYPH[ch].forEach((row, y) => [...row].forEach((v, x) => { if (v === '1'){ g.fillStyle = col; g.fillRect(2 + k * 4 + x, 2 + y, 1, 1); } })));
  const [rows, pal] = CA_ICON[c.s];
  rows.forEach((row, y) => [...row].forEach((v, x) => { if (pal[v]){ g.fillStyle = pal[v]; g.fillRect(4 + x, 10 + y, 1, 1); } }));
  return (CA_URL[key] = urlOf(cv, 3));
}
const caSum = h => h.reduce((a, c) => a + c.v, 0);
FS_PLAY.karten = {
  start(){
    const deck = []; for (const s of CA_SUIT) for (const [r, v] of CA_RANK) deck.push({ s, r, v });
    for (let i = deck.length - 1; i > 0; i--){ const j = (Math.random() * (i + 1)) | 0; [deck[i], deck[j]] = [deck[j], deck[i]]; }
    return { deck, me: [deck.pop(), deck.pop()], op: [deck.pop(), deck.pop()], phase: 'play' };
  },
  draw(S){ S.me.push(S.deck.pop()); Sound.tone(900, .03, 'square', .02); if (caSum(S.me) > 31){ S.phase = 'done'; fsEnd(S, -1); } renderTalk('fsPlay'); },
  stand(S){
    const me = caSum(S.me);
    while (caSum(S.op) < 27 && (caSum(S.op) < me || caSum(S.op) < 22) && S.deck.length) S.op.push(S.deck.pop());
    const op = caSum(S.op); S.phase = 'done';
    fsEnd(S, op > 31 ? 1 : me > op ? 1 : me === op ? 0 : -1);
    renderTalk('fsPlay');
  },
  view(S, body, opts){
    const me = caSum(S.me), op = caSum(S.op), row = (h, hide) => { const r = el('div', 'fscards'); h.forEach((c, i) => { const im = el('img'); im.src = caCard(hide && i > 0 ? null : c); im.alt = hide && i > 0 ? 'verdeckt' : c.r + ' ' + c.s; r.append(im); }); return r; };
    $('talkText').textContent = S.phase === 'play' ? 'Ihr habt ' + me + '. Noch eine Karte oder halten? Einsatz ' + S.stake + ' Gulden.'
      : me > 31 ? 'Überkauft: ' + me + '! Kathrein lächelt und nimmt Euren Einsatz.' : op > 31 ? 'Kathrein hat sich überkauft (' + op + '). Ihr gewinnt ' + S.stake * 2 + ' Gulden!'
      : S.res > 0 ? 'Gewonnen! ' + me + ' gegen ' + op + '. Ihr bekommt ' + S.stake * 2 + ' Gulden.' : S.res === 0 ? 'Gleichstand bei ' + me + '. Jeder behält seinen Einsatz.' : 'Verloren: ' + op + ' schlägt ' + me + '.';
    body.append(el('p', 'hint', 'Eure Karten: ' + me), row(S.me), el('p', 'hint', 'Kathrein' + (S.phase === 'play' ? '' : ': ' + op)), row(S.op, S.phase === 'play'));
    if (S.phase === 'play'){ const b = btn('Noch eine Karte', () => FS_PLAY.karten.draw(S), 'opt'); opts.append(b, btn('Halten', () => FS_PLAY.karten.stand(S), 'opt')); }
  }
};

/* ---------- Kegeln: Richtung und Schwung, neun Kegel in der Raute ---------- */
const KG_PINS = (() => { const o = []; [[1], [2], [3], [2], [1]].forEach((r, j) => { const n = r[0]; for (let i = 0; i < n; i++) o.push([50 + (i - (n - 1) / 2) * 10, 20 + j * 8]); }); return o; })();
function kgReset(S){ S.pins = KG_PINS.map(([x, y]) => ({ x, y, vx: 0, vy: 0, down: false })); S.ball = { x: 50, y: 140, vx: 0, vy: 0 }; S.st = 'aim'; S.t = 0; }
function kgFoe(){ const out = []; for (let i = 0; i < 3; i++){ const r = Math.random(); out.push(r < .08 ? 9 : r < .2 ? 0 : 3 + ((Math.random() * 6) | 0)); } return out; }
FS_PLAY.kegeln = {
  start(){ const S = { throws: [], foe: kgFoe() }; kgReset(S); return S; },
  press(S){
    if (S.st === 'aim'){ S.aim = 50 + Math.sin(S.t * 2.2) * 26; S.st = 'power'; S.t = 0; Sound.tone(440, .05, 'square', .02); }
    else if (S.st === 'power'){
      S.pw = (1 - Math.cos(S.t * 3)) / 2; S.st = 'roll';
      const dx = S.aim - 50, dy = -120, l = Math.hypot(dx, dy), sp = 40 + S.pw * 110;
      S.ball.vx = dx / l * sp; S.ball.vy = dy / l * sp; S.spin = rand(-6, 6); Sound.tone(110, .5, 'triangle', .03, -20);
    }
    renderTalk('fsPlay');
  },
  step(S, dt){
    S.t += dt;
    if (S.st !== 'roll') return;
    const B = S.ball; B.vx += S.spin * dt; B.x += B.vx * dt; B.y += B.vy * dt;
    const f = Math.pow(.6, dt); B.vx *= f; B.vy *= f;
    let moving = Math.hypot(B.vx, B.vy) > 6 && B.y > -10 && B.x > 4 && B.x < 96;
    for (const p of S.pins){
      if (!p.down && Math.hypot(p.x - B.x, p.y - B.y) < 6){ p.down = true; p.vx = B.vx * .7 + rand(-15, 15); p.vy = B.vy * .7 + rand(-10, 5); Sound.tone(rand(600, 900), .04, 'square', .02); B.vx *= .85; B.vy *= .85; }
      if (p.down && Math.hypot(p.vx, p.vy) > 3){
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.25, dt); p.vy *= Math.pow(.25, dt); moving = true;
        for (const q of S.pins) if (!q.down && Math.hypot(q.x - p.x, q.y - p.y) < 5){ q.down = true; q.vx = p.vx * .8 + rand(-8, 8); q.vy = p.vy * .8 + rand(-8, 4); }
      }
    }
    if (!moving){
      const n = S.pins.filter(p => p.down).length; S.throws.push(n); S.st = 'shown'; S.t = 0;
      S.msg = n === 9 ? 'Alle Neune!' : n + (n === 1 ? ' Kegel' : ' Kegel');
      if (n === 9) Sound.cheer(.7);
      if (S.throws.length >= 3){ const me = S.throws.reduce((a, b) => a + b, 0), op = S.foe.reduce((a, b) => a + b, 0); fsEnd(S, Math.sign(me - op)); }
      if (fsLive(S)) renderTalk('fsPlay');
    }
  },
  next(S){ kgReset(S); renderTalk('fsPlay'); },
  draw(S, g){
    g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, 100, 150);
    for (let x = 10; x < 90; x += 8){ g.fillStyle = (x >> 3) & 1 ? '#a8804c' : '#b8905a'; g.fillRect(x, 0, 8, 150); }
    g.fillStyle = '#2a1e12'; g.fillRect(8, 0, 2, 150); g.fillRect(90, 0, 2, 150);
    for (const p of S.pins){ const x = Math.round(p.x), y = Math.round(p.y);
      if (p.down){ g.fillStyle = '#16120f'; g.fillRect(x - 3, y - 1, 7, 3); g.fillStyle = '#e8e0cc'; g.fillRect(x - 2, y, 5, 1); g.fillStyle = '#a8241e'; g.fillRect(x + 1, y, 1, 1); }
      else { g.fillStyle = '#16120f'; g.fillRect(x - 2, y - 7, 5, 9); g.fillStyle = '#efe8d4'; g.fillRect(x - 1, y - 6, 3, 7); g.fillStyle = '#a8241e'; g.fillRect(x - 1, y - 4, 3, 1); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 6, 1, 2); }
    }
    const B = S.ball; g.fillStyle = '#16120f'; g.fillRect(Math.round(B.x) - 3, Math.round(B.y) - 3, 7, 7); g.fillStyle = '#5a3a1e'; g.fillRect(Math.round(B.x) - 2, Math.round(B.y) - 2, 5, 5); g.fillStyle = '#8a5a2e'; g.fillRect(Math.round(B.x) - 1, Math.round(B.y) - 2, 2, 1);
    if (S.st === 'aim'){ const x = Math.round(50 + Math.sin(S.t * 2.2) * 26); g.fillStyle = '#ffd541'; for (let y = 60; y < 130; y += 6) g.fillRect(Math.round(50 + (x - 50) * (140 - y) / 120), y, 1, 3); }
    if (S.st === 'power'){ const pw = (1 - Math.cos(S.t * 3)) / 2; g.fillStyle = '#16120f'; g.fillRect(93, 60, 6, 82); g.fillStyle = '#4a4650'; g.fillRect(94, 61, 4, 80); g.fillStyle = pw > .8 ? '#ff7a40' : '#9fe08a'; g.fillRect(94, 141 - Math.round(pw * 80), 4, Math.round(pw * 80)); }
  },
  view(S, body, opts){
    const me = S.throws.reduce((a, b) => a + b, 0), op = S.foe.reduce((a, b) => a + b, 0), done = S.throws.length >= 3;
    $('talkText').textContent = done ? (S.res > 0 ? 'Gewonnen! ' + me + ' gegen ' + op + ' Kegel. Kunz zahlt ' + S.stake * 2 + ' Gulden.' : S.res === 0 ? 'Gleichstand: ' + me + ' gegen ' + op + '.' : 'Verloren: ' + me + ' gegen ' + op + ' Kegel.')
      : S.st === 'aim' ? 'Wurf ' + (S.throws.length + 1) + ' von 3: Drückt, wenn die gelbe Linie richtig zielt.' : S.st === 'power' ? 'Jetzt der Schwung: Drückt, wenn der Balken hoch genug steht.' : S.st === 'roll' ? 'Die Kugel rollt …' : (S.msg || '') + ' Weiter zum nächsten Wurf.';
    body.append(el('p', 'hint', 'Eure Würfe: ' + (S.throws.join(' + ') || '–') + (done ? ' = ' + me : '') + ' · Kunz: ' + (done ? S.foe.join(' + ') + ' = ' + op : 'wartet')));
    const cv = el('canvas', 'fscanvas'); cv.width = 100; cv.height = 150; body.append(cv);
    const g = cv.getContext('2d');
    let last = performance.now();
    const loop = now => { if (!cv.isConnected || G.fs !== S) return; FS_PLAY.kegeln.step(S, Math.min(.05, (now - last) / 1000)); last = now; FS_PLAY.kegeln.draw(S, g); requestAnimationFrame(loop); };
    FS_PLAY.kegeln.draw(S, g); requestAnimationFrame(loop);
    if (!done){
      const b = S.st === 'shown' ? btn('Nächster Wurf', () => FS_PLAY.kegeln.next(S), 'opt') : btn(S.st === 'aim' ? 'Richtung wählen' : S.st === 'power' ? 'Werfen!' : 'Die Kugel rollt …', () => FS_PLAY.kegeln.press(S), 'opt');
      b.disabled = S.st === 'roll'; opts.append(b); setTimeout(() => { if (b.isConnected && !b.disabled) b.focus({ preventScroll: true }); }, 0);
    }
  }
};

/* ---------- Ringen: drei Gänge, im Takt dagegenhalten ---------- */
FS_PLAY.ringen = {
  start: () => ({ round: 1, wins: [0, 0], p: 0, ph: 0, zc: rand(.3, .7), zw: .22, st: 'go', flash: 0, msg: '' }),
  press(S){
    if (S.st !== 'go') return;
    const m = (Math.sin(S.ph) + 1) / 2;
    if (Math.abs(m - S.zc) < S.zw / 2){ S.p += .2 + (HERO.lvl / MAX_LVL) * .06; S.flash = .25; Sound.tone(330, .08, 'square', .03); }
    else { S.p -= .1; Sound.tone(150, .12, 'triangle', .03, -40); }
    S.zc = rand(.2, .8); S.zw = Math.max(.14, .24 - S.round * .02);
  },
  step(S, dt){
    if (S.st === 'go'){
      S.ph += dt * (2.6 + S.round * .5); S.p -= dt * (.16 + S.round * .04); S.flash = Math.max(0, S.flash - dt);
      if (S.p >= 1 || S.p <= -1){
        const w = S.p >= 1 ? 0 : 1; S.wins[w]++; S.st = 'fall'; S.t = 1.2; S.msg = w ? 'Jörg wirft Euch zu Boden!' : 'Ihr werft Jörg zu Boden!';
        Sound.drop(); if (!w) Sound.cheer(.5);
        if (Math.max(...S.wins) >= 2) fsEnd(S, S.wins[0] >= 2 ? 1 : -1);
        if (fsLive(S)) renderTalk('fsPlay');
      }
    } else if (S.st === 'fall' && S.res === null){ S.t -= dt; if (S.t <= 0){ S.round++; S.p = 0; S.st = 'go'; S.msg = ''; if (fsLive(S)) renderTalk('fsPlay'); } }
  },
  draw(S, g){
    g.fillStyle = '#4a3624'; g.fillRect(0, 0, 160, 90); g.fillStyle = '#5c4430'; for (let x = 0; x < 160; x += 12) g.fillRect(x, 60, 6, 30);
    const cx = 80 + S.p * 26, fall = S.st === 'fall', A = INN_ART.ringer.frames[0], K = fsHeroArt().frames[0];
    const kx = cx - 24, jx = cx + 2;
    if (fall && S.wins[1] > S.wins[0] - (S.res > 0 ? 1 : 0) && S.msg.startsWith('Jörg')){ g.save(); g.translate(kx + 12, 70); g.rotate(-1.4); g.drawImage(K, -12, -47); g.restore(); g.drawImage(A, jx, 23); }
    else if (fall){ g.drawImage(K, kx, 23); g.save(); g.translate(jx + 12, 70); g.rotate(1.4); g.drawImage(A, -12, -47); g.restore(); }
    else { g.drawImage(K, kx, 23); g.drawImage(A, jx, 23); }
    // Balken mit Marke und grünem Feld
    g.fillStyle = '#16120f'; g.fillRect(19, 6, 122, 9); g.fillStyle = '#4a4650'; g.fillRect(20, 7, 120, 7);
    g.fillStyle = S.flash > 0 ? '#c8ffb0' : '#5a9a4a'; g.fillRect(20 + Math.round((S.zc - S.zw / 2) * 120), 7, Math.round(S.zw * 120), 7);
    if (S.st === 'go'){ const m = (Math.sin(S.ph) + 1) / 2; g.fillStyle = '#ffffff'; g.fillRect(19 + Math.round(m * 120), 4, 3, 13); }
    // Kraftanzeige: wer drückt wen
    g.fillStyle = '#16120f'; g.fillRect(39, 82, 82, 5); g.fillStyle = '#8a1c1c'; g.fillRect(40, 83, 80, 3); g.fillStyle = '#e0c040'; g.fillRect(80, 83, Math.round(S.p * 40), 3);
  },
  view(S, body, opts){
    $('talkText').textContent = S.res !== null ? (S.res > 0 ? 'Gewonnen, ' + S.wins[0] + ' zu ' + S.wins[1] + '! Jörg reicht Euch die Hand und zahlt ' + S.stake * 2 + ' Gulden.' : 'Verloren, ' + S.wins[0] + ' zu ' + S.wins[1] + '. „Das nächste Mal, Herr Ritter.“')
      : (S.msg ? S.msg + ' ' : '') + 'Gang ' + S.round + ' von 3 (' + S.wins[0] + ' zu ' + S.wins[1] + '): Drückt, wenn die weiße Marke im grünen Feld steht.';
    const cv = el('canvas', 'fscanvas wide'); cv.width = 160; cv.height = 90; body.append(cv);
    const g = cv.getContext('2d'); let last = performance.now();
    const loop = now => { if (!cv.isConnected || G.fs !== S) return; FS_PLAY.ringen.step(S, Math.min(.05, (now - last) / 1000)); last = now; FS_PLAY.ringen.draw(S, g); requestAnimationFrame(loop); };
    FS_PLAY.ringen.draw(S, g); requestAnimationFrame(loop);
    if (S.res === null){ const b = btn('Drücken!', () => FS_PLAY.ringen.press(S), 'opt'); opts.append(b); setTimeout(() => { if (b.isConnected) b.focus({ preventScroll: true }); }, 0); }
  }
};
/* der Ritter ohne Harnisch, in den Farben seines Hauses */
let FS_HERO = null;
function fsHeroArt(){
  const f = HERO ? HERO.f : 'reich';
  if (FS_HERO && FS_HERO.f === f) return FS_HERO.a;
  const C = { reich: ['#6a5010', '#9a7a1c', '#c8a030', '#e6c44c'], frankreich: ['#143a20', '#1f5c30', '#2e7d40', '#4aa05a'], england: ['#5a0e0e', '#861a16', '#ae2c22', '#d0483a'], spanien: ['#1a1a20', '#2e2e36', '#46464f', '#66666f'] }[f] || ['#4a4a46', '#6a6a64', '#8a8a82', '#aaaaa0'];
  const a = np_frames({ robe:'short', belt:true, beard:true, hair:['h', 'j'] }, { 1: C[0], 2: C[1], 3: C[2], 4: C[3], 5: '#3a2c1e', 6: '#4a3a28', 7: '#5a4a34', 8: '#6e5c44' });
  FS_HERO = { f, a }; return a;
}
/* Stammgast: in allen vier Wirtshausspielen gewonnen */
TROPHIES.splice(TROPHIES.findIndex(t => t.id === 'turnier'), 0, { id: 'stammgast', n: 'Stammgast', d: 'im Gasthaus in Mühle, Einunddreißig, Kegeln und Ringen gewonnen', ok: h => !!(h.fsw && ['muehle', 'karten', 'kegeln', 'ringen'].every(k => h.fsw[k] > 0)) });
TROPHY_BY.stammgast = TROPHIES.find(t => t.id === 'stammgast');
/* Tafeln: die neuen Feste und die Spiele im Gasthaus */
for (const f of FESTS.filter(q => q.extra)){
  const li = el('li'), im = el('img'), wh = el('span', 'what', f.name);
  lazySrc(im, () => urlOf((FEST_ART[f.id] || (FEST_ART[f.id] = np_frames(f.host.o, f.host.pal))).frames[0], 2)); im.alt = '';
  wh.append(el('small', null, SEA_NAME[f.sea] + ', ' + (f.days[0] === 0 ? 'erster' : 'letzter') + ' Tag, ' + f.where + '. ' + f.host.name + (/(schlacht|suche)$/.test(f.gameName) ? ' lädt zur ' : ' lädt zum ') + f.gameName + ', Preis: ' + f.prize + '.'));
  li.append(im, wh); $('festList').append(li);
}
for (const [art, name, desc] of [[INN_ART.schulmeister, 'Schulmeister Ambrosius', 'spielt Mühle um 5, 20 oder 50 Gulden: neun Steine setzen, dann ziehen; drei in einer Reihe nehmen einen Stein'],
  [INN_ART.spielerin, 'Spielerin Kathrein', 'spielt Einunddreißig: Karten ziehen, so nah an die Einunddreißig wie möglich, aber nicht darüber'],
  [INN_ART.kegler, 'Kegelbruder Kunz', 'lädt zum Kegeln: drei Würfe auf neun Kegel, erst die Richtung, dann der Schwung'],
  [INN_ART.ringer, 'Ringer Jörg', 'ringt in drei Gängen: im Takt dagegenhalten, wer zweimal liegt, verliert. Wer in allen vier Spielen gewinnt, wird Stammgast']]){
  const li = el('li'), im = el('img'), wh = el('span', 'what', name);
  lazySrc(im, () => urlOf(art.frames[0], 2)); im.alt = '';
  wh.append(el('small', null, desc)); li.append(im, wh); $('innFun').append(li);
}
