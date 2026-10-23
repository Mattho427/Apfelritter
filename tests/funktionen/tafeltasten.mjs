// Tafeln und Hilfe mit der Tastatur: Esc ins Menü, Pfeile wechseln die Tafel, vom Startbildschirm und zurück
import { chromium, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
const st = () => p.evaluate(() => ({ mode: G.mode, ov: OVERLAYS.filter(o => !$(o).hidden), tafel: [...document.querySelectorAll('#notes > .note')].findIndex(n => !n.hidden) }));
const out = [];
await p.evaluate(() => $('btnNotesStart').click()); out.push(['Start → Tafeln', await st()]);
await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); out.push(['2× runter', await st()]);
await p.keyboard.press('Escape'); out.push(['Esc', await st()]);
await p.evaluate(() => startGame(freshHero('Hans', 'reich'))); await p.waitForTimeout(500);
await p.keyboard.press('Escape'); out.push(['Esc im Spiel (Menü)', await st()]);
await p.evaluate(() => $('btnNotes').click()); out.push(['Tafeln aus dem Menü', await st()]);
await p.keyboard.press('ArrowUp'); out.push(['hoch', await st()]);
await p.keyboard.press('Space'); out.push(['Leertaste bleibt im Fenster', await st()]);
await p.keyboard.press('Escape'); out.push(['Esc zurück ins Menü', await st()]);
await p.keyboard.press('Escape'); out.push(['Esc weiter spielen', await st()]);
for (const [k, v] of out) console.log(k.padEnd(28), JSON.stringify(v));
const ok = out[0][1].ov[0] === 'ovNotes' && out[1][1].tafel === (out[0][1].tafel + 2) % 25 && out[2][1].ov[0] === 'ovStart' && out[3][1].mode === 'pause'
  && out[4][1].ov[0] === 'ovNotes' && out[6][1].ov[0] === 'ovNotes' && out[7][1].ov[0] === 'ovPause' && out[8][1].mode === 'play';
console.log(ok && !errs.length ? 'keine Fehler' : 'FEHL ' + errs.join('; '));
await b.close();
