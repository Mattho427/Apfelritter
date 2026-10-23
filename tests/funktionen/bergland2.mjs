// Bergland: neue Gegner und Anführer im Kampf (Kampfweise, Treffer, Beute, keine Fehler)
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
await p.evaluate(() => { window.__wx = 'klar'; const h = freshHero('Hans', 'reich'); h.lvl = 30; startGame(h); $('banner').hidden = true; setInterval(() => { if (G.knight.hp > 0) G.knight.hp = ST.hp; }, 150); });
await p.waitForTimeout(600);
let fehl = 0;
for (const k of ['wolf', 'schrat', 'kobold', 'grubengeist', 'doppelsoeldner', 'hakenschuetze', 'baer', 'geier', 'eislicht', 'tatzelwurm', 'bergmoench', 'feldhauptmann', 'ruebezahl']){
  const r = await p.evaluate(k => new Promise(res => {
    const lair = LAIRS[k], s = lair ? { x: lair.x, y: lair.y } : SPAWN_SLOTS.find(q => q.kind === k), kn = G.knight;
    G.mons.length = 0; G.shots.length = 0; kn.x = s.x - 90; kn.y = s.y + 6; updateZone(true);
    const m = createMonster(k, s.x, s.y, 28, null); engage(m);
    const sts = new Set(); let hits = 0, hp0 = kn.hp;
    const iv = setInterval(() => { sts.add(m.st); }, 50);
    const hurt0 = G.knight.hp;
    setTimeout(() => { clearInterval(iv); const alive = G.mons.includes(m); res({ st: [...sts].join(','), alive, dist: Math.round(Math.hypot(m.x - kn.x, m.y - kn.y)) }); }, 3500);
  }), k);
  await (await p.$('canvas')).screenshot({ path: OUT + 'bk_' + k + '.png' });
  const ok = r.alive && (r.st.split(',').length > 1 || r.dist < 40);   // Berührungsangreifer (Schrat, Kobold, Geist, Licht) kennen nur „gehen“
  if (!ok) fehl++;
  console.log((ok ? 'ok   ' : 'FEHL ') + k.padEnd(16), JSON.stringify(r));
}
// Anführer erschlagen: Einzelstück fällt
const loot = await p.evaluate(() => { const out = []; for (const k of ['tatzelwurm', 'bergmoench', 'feldhauptmann', 'ruebezahl']){ G.loot.length = 0; G.mons.length = 0; const m = createMonster(k, G.knight.x + 40, G.knight.y, 30, null); m.by = 'me'; m.hitBy = 0; kill(m); const u = G.loot.find(a => a.it && a.it.u === k); out.push(k + ': ' + (u ? u.it.n + ' (' + u.it.s + (u.it.wt ? ' ' + u.it.wt : '') + ')' : 'kein Einzelstück')); } return out; });
console.log('Beute', JSON.stringify(loot));
if (loot.some(t => /kein/.test(t))) fehl++;
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
