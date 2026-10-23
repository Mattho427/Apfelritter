// Weltkarte als Bild speichern (für die Planung): node ../werkzeuge/karte.mjs [Datei]
import { chromium, OUT, PAGE } from '../pfad.mjs';
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE);
await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 60000 });
await p.evaluate(() => { const h = freshHero('Hans', 'reich'); startGame(h); $('banner').hidden = true; });
await p.waitForTimeout(500);
const r = await p.evaluate(() => { openMap(); const c = $('ovMap').querySelector('canvas'); return c ? [c.width, c.height] : null; });
await p.waitForTimeout(500);
await (await p.$('#ovMap canvas')).screenshot({ path: process.argv[2] || OUT + 'karte.png' });
console.log('Karte', r);
await b.close();
