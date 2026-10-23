// Vollbild und Tafeln im Menü: Auflösung je Gerät, Bühne füllt den Platz, kein Seiten-Scrollen, Menü, Tafeln
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch();
const GER = [
  ['rechner', { viewport: { width: 1400, height: 860 } }],
  ['breit', { viewport: { width: 1900, height: 940 } }],
  ['handy', { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['handyquer', { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['tablet', { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]
];
let fehler = 0;
for (const [name, opt] of GER){
  const ctx = await b.newContext(opt), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.goto(PAGE);
  await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + 'vb_' + name + '_titel.png' });
  await p.evaluate(() => { const h = freshHero('Hans', 'reich'); startGame(h); $('banner').hidden = true; });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const st = $('stage').getBoundingClientRect(), bx = $('stageBox').getBoundingClientRect();
    return { W, H, stage: [Math.round(st.width), Math.round(st.height)], box: [Math.round(bx.width), Math.round(bx.height)], fuellt: +(Math.max(st.width / bx.width, st.height / bx.height)).toFixed(3),
      scroll: [document.documentElement.scrollHeight - innerHeight, document.documentElement.scrollWidth - innerWidth], notesSichtbar: $('ovNotes').hidden === false, menue: $('btnPause').textContent };
  });
  await p.screenshot({ path: OUT + 'vb_' + name + '_spiel.png' });
  await p.evaluate(() => $('btnPause').click()); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + 'vb_' + name + '_menue.png' });
  await p.evaluate(() => $('btnNotes').click()); await p.waitForTimeout(600);
  const t = await p.evaluate(() => ({ tabs: $('noteTabs').children.length, sichtbar: [...document.querySelectorAll('#notes > .note')].filter(n => !n.hidden).map(n => n.querySelector('h3').textContent) }));
  await p.screenshot({ path: OUT + 'vb_' + name + '_tafeln.png' });
  await p.evaluate(() => $('ntab5').click()); await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + 'vb_' + name + '_tafel5.png' });
  await p.evaluate(() => $('btnNotesClose').click()); await p.waitForTimeout(150);
  const back = await p.evaluate(() => ({ mode: G.mode, pause: !$('ovPause').hidden }));
  console.log(name.padEnd(10), JSON.stringify(r), '| Tafeln', t.tabs, t.sichtbar.join(','), '| zurück', JSON.stringify(back), errs.length ? 'FEHLER ' + errs.join('; ') : '');
  if (errs.length || r.scroll[0] > 0 || r.scroll[1] > 0 || r.fuellt < .98 || !back.pause) fehler++;
  await ctx.close();
}
console.log(fehler ? 'FEHL ' + fehler + ' Geräte' : 'keine Fehler');
await b.close();
