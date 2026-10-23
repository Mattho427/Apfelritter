// Hauptgeschichte von Anfang bis Ende durchspielen. Aufruf: node ts1.mjs <Plan> (a, b oder c)
import { launch, wait, OUT } from './harness.mjs';
const PLANS = {
  a: { 1: 0, 2: 0, 'sick': 0, 3: 0, 4: 0, 5: 2, 6: 2, 7: 0, 8: 2, shotPrefix: 'sa' },   // brand, kampf, Sickingen, Gnade, rede, frieden (gn = Gnade + rede = 2)
  b: { 1: 1, 2: 1, 'sick': 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, shotPrefix: 'sb' },   // weigern, still, Fürsten, recht, schwert, herren
  c: { 1: 1, 2: 0, 'sick': 0, 3: 1, 4: 2, 5: 0, 6: 0, 7: 2, 8: 0, shotPrefix: 'sc' }    // weigern, kampf, Sickingen, Lösegeld, brand, bauern
};
const plan = PLANS[process.argv[2] || 'a'];
const H = await launch(1, { init: { fn: () => { window.__wx = 'klar'; }, arg: 0 } });
await H.start(['Hans'], ['reich']);
const A = H.pages[0].p;
const cab = async name => (await A.$('.cabinet')).screenshot({ path: OUT + plan.shotPrefix + '_' + name + '.png' });
await A.evaluate(() => { HERO.lvl = 2; HERO.eq.waffe = makeItem('waffe', 4, 2); refreshStats(); G.knight.hp = ST.hp; setInterval(() => { if (G.knight.hp < ST.hp * .6) G.knight.hp = ST.hp; }, 80); stLevel(2); });
await wait(3000);
console.log('tracker:', await A.evaluate(() => $('tracker').textContent));
const shots = new Set();
const state = () => A.evaluate(() => {
  const S = HERO.story, st = stStep(), C = stCh();
  return { mode: G.mode, c: S ? S.c : -1, s: S ? S.s : -1, n: S ? S.n : 0, type: st && st.type, t: st && st.t, lvl: HERO.lvl, line: G.scene && G.scene.line ? (G.scene.line.say || '') + ': ' + (G.scene.line.text || G.scene.line.title || '').slice(0, 70) : '',
    stage: !!(G.scene && G.scene.stage), talk: !$('ovTalk').hidden ? $('talkName').textContent : '', locked: C ? HERO.lvl < C.lvl : null, done: !C };
});
let last = '', stuck = 0, choiceN = {};
for (let i = 0; i < 2400; i++){
  const s = await state();
  const key = JSON.stringify([s.c, s.s, s.mode, s.line, s.talk, s.n]);
  if (key === last) stuck++; else { stuck = 0; last = key; }
  if (stuck > 120){ console.log('HÄNGT', JSON.stringify(s)); break; }
  if (s.done){ console.log('FERTIG'); break; }
  if (s.locked){ await A.evaluate(L => { while (HERO.lvl < L) { HERO.xp = xpNeed(HERO.lvl); gainXp(1); } refreshStats(); G.knight.hp = ST.hp; }, [0, 2, 5, 8, 11, 14, 16, 18, 20][s.c + 1]); await wait(2800); continue; }
  if (s.mode === 'scene'){
    const tag = 'k' + (s.c + 1) + 's' + s.s;
    if (s.line && !shots.has(tag) && /[a-z]/.test(s.line)){ shots.add(tag); await cab(tag + (s.stage ? '_stage' : '')); }
    if (s.stage && !shots.has('worms2') && /Hier stehe ich/.test(s.line)){ shots.add('worms2'); await cab('worms_hier'); }
    if (/Aleander:.*Fackel/.test(s.line) && !shots.has('fackel')){ shots.add('fackel'); await cab('fackel'); }
    if (/^jaeck:.*Flammen/.test(s.line) && !shots.has('nacht')){ shots.add('nacht'); await cab('nacht'); }
    if (/Seht, wie sie brennt/.test(s.line) && !shots.has('brand')){ shots.add('brand'); await cab('scheune'); }
    await A.evaluate(() => stAdvance()); await wait(120); continue;
  }
  if (s.mode === 'menu' && s.talk){
    // Entscheidung: Knopf nach Plan
    const r = await A.evaluate(() => [...document.querySelectorAll('#talkBody button')].map(b => (b.disabled ? '[x]' : '') + b.textContent));
    const st = await A.evaluate(() => { const st = stStep(); return st && st.type === 'choice' ? st.opts.length : 0; });
    if (st){
      const ck = s.c === 2 && s.s === 1 ? 'sick' : s.c + 1;
      const pick = plan[ck];
      if (!shots.has('choice' + s.c + s.s)){ shots.add('choice' + s.c + s.s); await cab('choice_k' + (s.c + 1) + 's' + s.s); }
      console.log('Wahl K' + (s.c + 1) + ' S' + s.s + ':', r.join(' | '), '→', pick);
      await A.evaluate(i => { const b = [...document.querySelectorAll('#talkBody button')].filter(b => !b.disabled)[i]; b.click(); }, Math.min(pick, r.filter(x => !x.startsWith('[x]')).length - 1));
      await wait(200); continue;
    }
    await A.evaluate(() => closePanel()); await wait(100); continue;
  }
  if (s.mode !== 'play'){ await wait(200); continue; }
  // in der Welt: je nach Schritt
  const act = await A.evaluate(() => {
    const st = stStep(), S = HERO.story, k = G.knight;
    if (!st) return 'none';
    if (st.type === 'talk'){
      const n = NPCS.find(x => x.id === st.npc); if (!n) return 'kein npc ' + st.npc;
      k.x = n.x + 18; k.y = n.y + 8; openTalk(n);
      const b = document.querySelector('#talkBody .opt.story'); if (!b) return 'kein Knopf';
      b.click(); return 'talk ' + st.npc;
    }
    if (st.type === 'goto' || st.type === 'hunt' || st.type === 'kill'){
      const p = stPt(st.at);
      if (st.type === 'hunt'){ stHunt('wildschwein'); return 'hunt'; }
      if (Math.hypot(k.x - p.x, k.y - p.y) > 120){ const q = gNear(st.at[0], st.at[1] + 30); k.x = q.x; k.y = q.y; return 'tp'; }
      if (st.type === 'kill'){
        const ms = G.mons.filter(m => m.story); if (!ms.length) return 'warte auf Gegner';
        const m = ms[0]; k.x = m.x - 20; k.y = m.y + 4; damage(m, m.hp + 5, false, 0); return 'hieb ' + m.nm;
      }
      return 'goto';
    }
    if (st.type === 'escort'){
      st.spd = 420;
      const P = stPath(st), p = stAt(P, S.e);
      const ms = G.mons.filter(m => m.story && m.story.amb != null);
      if (ms.length){ const m = ms[0]; k.x = m.x - 20; k.y = m.y + 4; damage(m, m.hp + 5, false, 0); return 'amb ' + m.nm; }
      k.x = p.x + 30; k.y = p.y + 20; return 'esc ' + Math.round(S.e) + '/' + Math.round(P.len);
    }
    if (st.type === 'choice'){ stTalkFallback(); return 'choice'; }
    return st.type;
  });
  if (/^(talk|tp|esc|amb|hieb)/.test(act) === false && i % 20 === 0) console.log(i, JSON.stringify(s), act);
  if (/^esc/.test(act) && !shots.has('esc' + s.c)){ shots.add('esc' + s.c); await wait(600); await cab('escort_k' + (s.c + 1)); }
  if (/^hieb/.test(act) && !shots.has('fight' + s.c + s.s)){ shots.add('fight' + s.c + s.s); await cab('fight_k' + (s.c + 1) + 's' + s.s); }
  await wait(/^(tp|esc)/.test(act) ? 250 : 150);
}
const end = await A.evaluate(() => ({ story: HERO.story, inv: HERO.inv.filter(Boolean).map(i => i.n + ' (' + RARITY[i.r].n + ')'), lvl: HERO.lvl, gold: HERO.gold, title: stTitle() }));
console.log('Ende', JSON.stringify({ f: end.story.f, gn: end.story.gn, c: end.story.c, title: end.title, lvl: end.lvl }));
console.log('Chronik:\n  ' + end.story.log.join('\n  '));
console.log('Lohn:', end.inv.join(', '));
await A.evaluate(() => openQuests()); await wait(300); await cab('quests');
console.log(H.errors().join('\n') || 'keine Fehler');
await H.done();
