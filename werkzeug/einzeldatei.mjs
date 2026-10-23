// Baut aus index.html und js/*.js wieder eine einzelne HTML-Datei (zum Weitergeben oder Herunterladen).
// Aufruf: node werkzeug/einzeldatei.mjs [Ziel]   (Standard: apfelritter-einzeldatei.html im Projektordner)
import fs from 'fs'; import path from 'path'; import url from 'url';
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(root, 'apfelritter-einzeldatei.html');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tags = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>\n?/g)];
if (!tags.length) { console.error('keine Skript-Verweise gefunden'); process.exit(1); }
const code = tags.map(m => fs.readFileSync(path.join(root, m[1]), 'utf8')).join('\n');
const inline = '<script>\n' + code.replace(/<\/script/gi, '<\\/script') + '</script>\n';
let res = html.replace(tags[0][0], () => inline);   // als Funktion, sonst deutet replace Zeichen wie $' im Code
for (const m of tags.slice(1)) res = res.replace(m[0], '');
fs.writeFileSync(out, res);
console.log('Einzeldatei geschrieben:', out, Math.round(res.length / 1024) + ' KB');
