// Kirchen, Priester und Glaube: betreten, Innenraum, Dienste, Ablass, Wallfahrt, Messe
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1400, height: 860 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
await p.evaluate(() => { window.__wx = 'klar'; const h = freshHero('Hans', 'reich'); h.lvl = 12; h.gold = 2000; startGame(h); $('banner').hidden = true; setInterval(() => { if (G.knight.hp > 0 && G.mode === 'play') G.knight.hp = ST.hp; }, 300); });
await p.waitForTimeout(800);
const T = async (name, fn, arg) => { const r = await p.evaluate(fn, arg); console.log(name.padEnd(24), JSON.stringify(r)); return r; };
await T('Kirchen', () => CHURCHES.map(c => c.id + ' ' + Math.round(c.dx / 2) + ',' + Math.round(c.y / 2)));
let fehl = 0;
for (const id of ['burgkapelle', 'stadtkirche', 'klosterkirche', 'friedhofskapelle', 'wallfahrtskapelle', 'kaiserdom']){
  // vor die Tür stellen, Tür erkennen, eintreten
  const r = await p.evaluate(id => {
    if (G.inside) leaveInn();
    const c = CH_BY[id], k = G.knight; k.x = c.dx; k.y = c.y + 14; k.dir = 'up'; updateNear(true);
    const door = G.nearDoor && G.nearDoor.id, btnTxt = $('btnTalk').textContent;
    const t0 = performance.now(); talk(); const ms = Math.round(performance.now() - t0);
    return { door, btnTxt, inside: G.inside && G.inside.id, ms, npcs: chRoom(c).npcs.map(n => n.name).join(', '), zone: $('zone').textContent };
  }, id);
  console.log(id.padEnd(18), JSON.stringify(r));
  if (r.door !== id || r.inside !== id) fehl++;
  await p.waitForTimeout(700);
  await p.evaluate(() => { const k = G.knight; k.x = 480; k.y = 300; });
  await p.waitForTimeout(300);
  await (await p.$('canvas')).screenshot({ path: OUT + 'ki_' + id + '.png' });
}
console.log(errs.length ? 'FEHLER ' + errs.join(' | ') : (fehl ? 'FEHL ' + fehl : 'keine Fehler'));
await b.close();
