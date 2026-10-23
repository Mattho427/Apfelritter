import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const browser = await chromium.launch();
// iPad quer mit Tastatur
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(500);
await p.fill('#heroName', 'Tasta'); await p.press('#heroName', 'Enter');
await p.waitForTimeout(500);
console.log('start', await p.evaluate(() => JSON.stringify({ touch: TOUCH, kbd: KBD.on, cls: document.body.className, pad: getComputedStyle($('padRow')).display, focus: document.activeElement && document.activeElement.id })));
await p.screenshot({ path: 'k_touch.png' });
const x0 = await p.evaluate(() => G.knight.x);
await p.keyboard.down('KeyD'); await p.waitForTimeout(500); await p.keyboard.up('KeyD');
console.log('after D', await p.evaluate(x0 => JSON.stringify({ moved: Math.round(G.knight.x - x0), kbd: KBD.on, cls: document.body.className, pad: getComputedStyle($('padRow')).display }), x0));
await p.screenshot({ path: 'k_kbd.png' });
// zum Vogt, E, Ziffer, Esc
await p.evaluate(() => { const n = NPCS[0]; G.knight.x = n.x; G.knight.y = n.y + 14; });
await p.waitForTimeout(300);
await p.keyboard.press('KeyE'); await p.waitForTimeout(300);
console.log('talk', await p.evaluate(() => JSON.stringify({ mode: G.mode, btns: [...document.querySelectorAll('#talkBody [data-k]')].map(b => b.dataset.k + ':' + b.textContent.slice(0, 30)), focus: document.activeElement && document.activeElement.textContent.slice(0, 30) })));
await p.screenshot({ path: 'k_talk.png' });
await p.keyboard.press('Digit1'); await p.waitForTimeout(300);
console.log('after 1', await p.evaluate(() => $('talkText').textContent.slice(0, 60)));
await p.keyboard.press('Backspace'); await p.waitForTimeout(200);
console.log('after back', await p.evaluate(() => $('talkText').textContent.slice(0, 40)));
await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(100);
console.log('focus', await p.evaluate(() => document.activeElement.textContent.slice(0, 40)));
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
console.log('after esc', await p.evaluate(() => G.mode));
await p.keyboard.press('F1'); await p.waitForTimeout(200);
await p.screenshot({ path: 'k_help.png' });
console.log('help', await p.evaluate(() => G.mode + ' ' + !$('ovKeys').hidden));
await p.keyboard.press('KeyP'); await p.waitForTimeout(200);
// Bag mit Pfeilen
await p.keyboard.press('KeyI'); await p.waitForTimeout(200);
await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
console.log('bag', await p.evaluate(() => JSON.stringify({ mode: G.mode, sel: G.sel, focus: document.activeElement.className })));
await p.keyboard.press('KeyI'); await p.waitForTimeout(200);
// Tippen bringt das Steuerkreuz zurück
await p.touchscreen.tap(300, 300); await p.waitForTimeout(200);
console.log('after tap', await p.evaluate(() => JSON.stringify({ kbd: KBD.on, pad: getComputedStyle($('padRow')).display })));
console.log(errs.join('\n') || 'ok');
await browser.close();
