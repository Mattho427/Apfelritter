// Gemeinsame Pfade für alle Tests: Projektordner, Ausgabeordner (Bildschirmfotos), Testseiten, Playwright.
// Beim Laden wird eine Testseite mit derselben UTF-8-Hülle wie im veröffentlichten Artefakt erzeugt (tests/ausgabe/page.html
// und mobile.html), dazu eine Kopie der Teile aus js/.
import fs from 'fs'; import path from 'path'; import url from 'url';
export const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
export const OUT = path.join(ROOT, 'tests', 'ausgabe') + path.sep;
let pw;
try { pw = await import(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright/index.mjs'); } catch(e){ pw = await import('playwright'); }
export const chromium = pw.chromium, devices = pw.devices;
fs.mkdirSync(OUT, { recursive: true });
const pre = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>';
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const f of ['page.html', 'mobile.html']) fs.writeFileSync(OUT + f, pre + html + '</body></html>');
fs.rmSync(OUT + 'js', { recursive: true, force: true }); fs.cpSync(path.join(ROOT, 'js'), OUT + 'js', { recursive: true });
export const GAME = url.pathToFileURL(path.join(ROOT, 'index.html')).href;   // die Seite selbst
export const PAGE = url.pathToFileURL(OUT + 'page.html').href;               // mit UTF-8-Hülle
export const MOBILE = url.pathToFileURL(OUT + 'mobile.html').href;
// Die Tafeln liegen im Fenster „Tafeln und Hilfe“: vor einem Bildschirmfoto die Tafel mit dem Element sel öffnen, danach wieder schließen
export async function zeigeTafel(p, sel){
  await p.evaluate(sel => {
    if (typeof openNotes !== 'function') return;
    openNotes();
    const n = sel && document.querySelector(sel), note = n && n.closest('.note');
    if (note) showNote([...document.querySelectorAll('#notes > .note')].indexOf(note));
  }, sel);
  await p.waitForTimeout(250);
}
export async function schliesseTafel(p){ await p.evaluate(() => { if (typeof closeNotes === 'function' && !$('ovNotes').hidden) closeNotes(); }); }
