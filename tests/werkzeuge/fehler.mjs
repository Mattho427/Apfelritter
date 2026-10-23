import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(PAGE); await p.waitForTimeout(3000);
await b.close();
