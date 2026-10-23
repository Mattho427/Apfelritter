// Setzt den Fingerabdruck SRC_HASH in js/01-grundlagen.js aus dem Inhalt aller Teile.
// Vor jedem Veröffentlichen ausführen: node werkzeug/stempel.mjs
// (Der Ladezwischenspeicher im Browser gilt nur für genau diese Fassung des Codes.)
import fs from 'fs'; import path from 'path'; import url from 'url';
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'js'), names = fs.readdirSync(dir).filter(n => n.endsWith('.js')).sort();
const RE = /^const SRC_HASH = '[^']*';$/m;
let h = 0, len = 0;
for (const n of names){
  const s = fs.readFileSync(path.join(dir, n), 'utf8').replace(RE, "const SRC_HASH = '';");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  len += s.length;
}
const stamp = len + ':' + (h >>> 0).toString(36);
const f = path.join(dir, names[0]), src = fs.readFileSync(f, 'utf8');
if (!RE.test(src)) { console.error('SRC_HASH-Zeile nicht gefunden in ' + names[0]); process.exit(1); }
fs.writeFileSync(f, src.replace(RE, "const SRC_HASH = '" + stamp + "';"));
console.log('Stempel', stamp, 'aus', names.length, 'Teilen');
