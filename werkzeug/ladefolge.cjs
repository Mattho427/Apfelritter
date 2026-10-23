// Prüft die Ladereihenfolge der Teile in js/: Was ein Teil schon beim Laden aufruft (direkt oder über Funktionen,
// die dabei laufen), muss in demselben oder einem früheren Teil stehen. Aufruf: node werkzeug/ladefolge.cjs
const fs = require('fs'), path = require('path');
let ts; try { ts = require('typescript'); } catch(e){ ts = require('/opt/node22/lib/node_modules/typescript'); }
const dir = path.join(__dirname, '..', 'js'), names = fs.readdirSync(dir).filter(n => n.endsWith('.js')).sort();
const plan = [], parts = []; let off = 0;
for (const n of names){ const t = fs.readFileSync(path.join(dir, n), 'utf8') + '\n'; plan.push([off, n.replace('.js', '')]); parts.push(t); off += t.length; }
const js = parts.join(''), cuts = plan.map(p => p[0]);
const sf = ts.createSourceFile('a.js', js, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const fileOf = pos => { let f = 0; for (let i = 0; i < cuts.length; i++) if (pos >= cuts[i]) f = i; return f; };
// 2) Deklarationen der obersten Ebene
const funcs = new Map(), VARS = [];   // Name -> { node, file }
for (const s of sf.statements){
  if (ts.isFunctionDeclaration(s) && s.name) funcs.set(s.name.text, { node: s, file: fileOf(s.getStart(sf)) });
  if (ts.isVariableStatement(s) && !(s.declarationList.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const))) for (const d of s.declarationList.declarations) if (ts.isIdentifier(d.name)) VARS.push(d.name.text);
}
const EAGER_M = new Set(['forEach', 'map', 'filter', 'some', 'every', 'reduce', 'reduceRight', 'find', 'findIndex', 'findLast', 'sort', 'flatMap', 'replace', 'replaceAll', 'from']);
const ASYNC = new Set(['setTimeout', 'setInterval', 'requestAnimationFrame', 'then', 'catch', 'finally', 'queueMicrotask']);
// Zeitgeber mit mindestens einer Sekunde Verzug laufen sicher erst, wenn alle Dateien geladen sind
const slowTimer = p => { if (!p || !ts.isCallExpression(p)) return false; const nm = ts.isIdentifier(p.expression) ? p.expression.text : ''; if (nm !== 'setTimeout' && nm !== 'setInterval') return false; const d = p.arguments[1]; return d && ts.isNumericLiteral(d) && +d.text >= 1000; };
const isFn = n => ts.isFunctionExpression(n) || ts.isArrowFunction(n);
function classify(fn){   // wie wird eine Funktion an dieser Stelle ausgeführt? 'eager' | 'async' | 'deferred'
  let p = fn.parent; while (p && ts.isParenthesizedExpression(p)) { fn = p; p = p.parent; }
  if (ts.isCallExpression(p) && p.expression === fn) return 'eager';                                   // sofort aufgerufen
  if ((ts.isCallExpression(p) || ts.isNewExpression(p)) && p.arguments && p.arguments.includes(fn)){
    const c = p.expression, nm = ts.isPropertyAccessExpression(c) ? c.name.text : ts.isIdentifier(c) ? c.text : '';
    if (ts.isNewExpression(p) && nm === 'Promise') return 'eager';
    if (EAGER_M.has(nm)) return 'eager';
    if (ASYNC.has(nm)) return 'async';
  }
  return 'deferred';
}
// Bezüge einer Funktion (oder Anweisung), getrennt nach sofort und asynchron
const memo = new Map();
function refs(root){
  if (memo.has(root)) return memo.get(root);
  const out = { eager: new Set(), async: new Set() }; memo.set(root, out);
  const walk = (n, mode) => {
    if (n !== root && (ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) || ts.isGetAccessor(n) || ts.isSetAccessor(n) || ts.isClassDeclaration(n))) return;   // innere Funktionen nur über Aufrufe
    if (n !== root && isFn(n)){ const c = classify(n); if (c === 'deferred') return; if (c === 'async'){ if (slowTimer(n.parent)) return; ts.forEachChild(n, k => walk(k, 'async')); return; } }
    if (ts.isIdentifier(n) && funcs.has(n.text)){
      const p = n.parent;
      const isDecl = (ts.isFunctionDeclaration(p) && p.name === n) || (ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n) || (ts.isParameter(p)) || (ts.isVariableDeclaration(p) && p.name === n);
      // gezählt wird nur, was hier wirklich aufgerufen wird (oder einer sofort laufenden Schleifenmethode übergeben)
      const called = ts.isCallExpression(p) && p.expression === n;
      const eagerArg = ts.isCallExpression(p) && p.arguments.includes(n) && ts.isPropertyAccessExpression(p.expression) && EAGER_M.has(p.expression.name.text);
      const asyncArg = ts.isCallExpression(p) && p.arguments.includes(n) && ASYNC.has(ts.isPropertyAccessExpression(p.expression) ? p.expression.name.text : ts.isIdentifier(p.expression) ? p.expression.text : '');
      if (!isDecl && (called || eagerArg)) out[mode].add(n.text);
      else if (!isDecl && asyncArg && !slowTimer(p)) out.async.add(n.text);
    }
    ts.forEachChild(n, k => walk(k, mode));
  };
  if (ts.isFunctionDeclaration(root)) { if (root.body) ts.forEachChild(root.body, k => walk(k, 'eager')); }
  else walk(root, 'eager');
  return out;
}
// Hülle: alles, was beim Ausführen einer Anweisung sofort (oder asynchron gleich danach) erreicht wird
function closure(start){
  const seen = new Map(), q = [];   // Name -> Weg
  for (const nm of start.eager) if (!seen.has(nm)){ seen.set(nm, [nm]); q.push(nm); }
  while (q.length){ const nm = q.shift(); const r = refs(funcs.get(nm).node); for (const k of r.eager) if (!seen.has(k)){ seen.set(k, seen.get(nm).concat(k)); q.push(k); } }
  return seen;
}
let bad = 0; const SEEN = new Set();
for (const s of sf.statements){
  if (ts.isFunctionDeclaration(s)) continue;
  const f = fileOf(s.getStart(sf)), r = refs(s);
  for (const [nm, path] of closure(r)){ const g = funcs.get(nm).file; if (g > f){ bad++; const key = 'SOFORT ' + plan[f][1] + ' -> ' + plan[g][1] + ' ' + nm; if (!SEEN.has(key)){ SEEN.add(key); console.log(key, ':', path.join(' > '), '| bei:', js.slice(s.getStart(sf), s.getStart(sf) + 70).replace(/\n/g, ' ')); } } }
  const ar = { eager: r.async }; for (const [nm, path] of closure(ar)){ const g = funcs.get(nm).file; if (g > f){ bad++; const key = 'ASYNC ' + plan[f][1] + ' -> ' + plan[g][1] + ' ' + nm; if (!SEEN.has(key)){ SEEN.add(key); console.log(key, ':', path.join(' > '), '| bei:', js.slice(s.getStart(sf), s.getStart(sf) + 70).replace(/\n/g, ' ')); } } }
}
if (VARS.length) console.log('Hinweis: var-Deklarationen (nicht über Teile hinweg vorgezogen):', VARS.join(', '));
console.log(names.length + ' Teile, ' + funcs.size + ' Funktionen, ' + sf.statements.length + ' Anweisungen: ' + (bad ? bad + ' Probleme' : 'Ladereihenfolge in Ordnung'));
process.exit(bad ? 1 : 0);
