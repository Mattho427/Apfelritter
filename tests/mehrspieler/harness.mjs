// Mehrere Spielseiten in getrennten Browser-Kontexten, verbunden über einen nachgebauten Raum (room/db/user) in Node.
import { chromium, OUT, PAGE } from '../pfad.mjs';
export { OUT };
const FAKE = ({ peer, uid }) => {
  const H = { pres: {}, seq: 0, peers: new Map(), peerL: [], msgL: {}, last: {} };
  const send = m => { try { window.__send(m); } catch(e){} };
  const snap = () => {
    const me = { peer, by: uid, isMe: true, sameTab: true, kind: 'viewer', guest: false, presence: H.pres, updatedAt: Date.now() };
    return Object.freeze([me, ...[...H.peers].map(([p, v]) => Object.freeze({ peer: p, by: v.by, isMe: false, sameTab: false, kind: 'viewer', guest: false, presence: v.presence, updatedAt: v.t }))]);
  };
  let q = null;
  const notify = (j, l, u) => {
    q = q || { j: [], l: [], u: [] }; q.j.push(...j); q.l.push(...l); q.u.push(...u);
    if (q.timer) return;
    q.timer = requestAnimationFrame(() => { const c = q; q = null; const ps = snap(); for (const f of H.peerL) f({ peers: ps, joined: c.j, left: c.l, updated: c.u }); });
  };
  window.__recv = m => {
    if (m.to && m.to !== peer) return;
    if (m.t === 'pres'){
      if ((H.last[m.from] || 0) >= m.seq) return; H.last[m.from] = m.seq;
      const had = H.peers.has(m.from);
      H.peers.set(m.from, { presence: Object.freeze(m.p), by: m.by, t: Date.now() });
      const row = snap().find(x => x.peer === m.from);
      notify(had ? [] : [row], [], had ? [row] : []);
      if (!had) send({ t: 'pres', p: H.pres, seq: ++H.seq, to: m.from });
    } else if (m.t === 'bye'){ const row = snap().find(x => x.peer === m.from); if (H.peers.delete(m.from)) notify([], [row], []); }
    else if (m.t === 'emit'){ for (const f of H.msgL[m.topic] || []) f({ topic: m.topic, data: m.data, peer: m.from, by: m.by, isMe: false, sameTab: false, kind: 'viewer', guest: false }); }
    else if (m.t === 'dbpush'){ const f = DB.subs[m.sid]; if (f) f(m.docs); }
  };
  const room = {
    presence(patch){ const p = Object.assign({}, H.pres); for (const k in patch){ if (patch[k] === null) delete p[k]; else p[k] = patch[k]; }
      if (JSON.stringify(p).length > 4096) return Promise.reject({ code: 'invalid_argument', message: 'presence over 4 KiB: ' + JSON.stringify(p).length });
      H.pres = Object.freeze(p); window.__presBytes = Math.max(window.__presBytes || 0, JSON.stringify(p).length); send({ t: 'pres', p, seq: ++H.seq }); return Promise.resolve(); },
    onPeers(f){ H.peerL.push(f); setTimeout(() => { const ps = snap(); f({ peers: ps, joined: ps, left: [], updated: [] }); }, 0); return () => {}; },
    on(topic, f){ (H.msgL[topic] = H.msgL[topic] || []).push(f); return () => {}; },
    emit(topic, data){ send({ t: 'emit', topic, data }); for (const f of H.msgL[topic] || []) f({ topic, data, peer, by: uid, isMe: true, sameTab: true, kind: 'viewer', guest: false }); return Promise.resolve(); },
    connected: () => true, peers: snap, onConnection(f){ setTimeout(() => f(true), 0); return () => {}; },
    join: () => Promise.reject({ code: 'not_permitted' })
  };
  const DB = { subs: {}, sid: 0 };
  const call = op => window.__dbcall(op);
  const docSnap = (id, data) => ({ id, exists: !!data, data: () => data ? JSON.parse(JSON.stringify(data)) : undefined });
  const query = (coll, o) => ({
    orderBy: (f, d) => query(coll, Object.assign({}, o, { ob: f, dir: d || 'asc' })),
    limit: n => query(coll, Object.assign({}, o, { lim: n })),
    where: (f, op, v) => query(coll, Object.assign({}, o, { ws: (o.ws || []).concat([[f, op, v]]) })),
    get: () => call({ op: 'query', coll, o }).then(docs => ({ docs: docs.map(d => docSnap(d.id, d.data)), docChanges: () => [] })),
    onSnapshot(next){ const sid = ++DB.sid; DB.subs[sid] = docs => next({ docs: docs.map(d => docSnap(d.id, d.data)), docChanges: () => [] }); call({ op: 'sub', coll, o, sid }); return () => { delete DB.subs[sid]; }; }
  });
  const db = {
    doc: path => ({ path, get: () => call({ op: 'get', path }).then(d => docSnap(path.split('/').pop(), d)), set: data => call({ op: 'set', path, data }), update: data => call({ op: 'update', path, data }), delete: () => call({ op: 'del', path }) }),
    collection: coll => Object.assign(query(coll, {}), { doc: id => db.doc(coll + '/' + id) })
  };
  const user = { id: () => Promise.resolve(uid), isOwner: () => false, canEdit: () => false, can: () => true, me: () => Promise.resolve({ id: uid }), profiles: () => Promise.resolve({}) };
  window.claude = { use: name => new Promise(r => setTimeout(() => r(name === 'room' ? room : name === 'db' ? db : name === 'user' ? user : null), 30)) };
  window.__peerId = peer;
};
// REAL=http://localhost:8787/ (und REAL_DATA=Datenordner): dieselben Tests gegen den echten Spielserver der App
const REAL = process.env.REAL, REAL_DATA = process.env.REAL_DATA;
async function launchReal(n, opts){
  const fs = await import('node:fs');
  const browser = await chromium.launch();
  const pages = [];
  const DBS = { get(k){ try { const r = JSON.parse(fs.readFileSync(REAL_DATA + '/store.json', 'utf8')).docs[k]; return r ? r.d : undefined; } catch(e){ return undefined; } },
    *[Symbol.iterator](){ let d = {}; try { d = JSON.parse(fs.readFileSync(REAL_DATA + '/store.json', 'utf8')).docs; } catch(e){} for (const [k, r] of Object.entries(d)) yield [k, r.d]; } };
  const mk = async (i, key) => {
    const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1000, height: 1000 }, ...(opts.ctx || {}) });
    if (key) await ctx.addInitScript(k => { try { localStorage.setItem('apfelritter.schluessel', k); } catch(e){} }, key);
    if (opts.init) await ctx.addInitScript(opts.init.fn, opts.init.arg);
    const p = await ctx.newPage(), errs = pages[i] ? pages[i].errs : [];
    p.on('pageerror', e => errs.push('PAGEERROR[' + i + '] ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::|WebSocket/.test(m.text())) errs.push('CONSOLE[' + i + '] ' + m.text()); });
    await p.goto(REAL);
    await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title' && window.apfelApp && apfelApp.state() === 'verbunden' && cloud.uid, null, { timeout: 20000 });
    const [uid, peer, k] = await p.evaluate(() => [cloud.uid, cloud.room.peers().find(x => x.sameTab).peer, apfelApp.key()]);
    pages[i] = { p, ctx, errs, peer, uid, key: k, closed: false };
    return p;
  };
  for (let i = 0; i < n; i++) await mk(i);
  return {
    browser, pages, DBS,
    async start(names, f){ for (let i = 0; i < pages.length; i++){ const p = pages[i].p; await p.evaluate(([n, f]) => startGame(freshHero(n, f || 'reich')), [names[i] || ('Ritter' + i), (f || [])[i]]); } await pages[0].p.waitForTimeout(600); },
    async reopen(i){ const p = await mk(i, pages[i].key); await p.waitForFunction(() => SAVED, null, { timeout: 15000 }); await p.evaluate(() => startGame(SAVED)); return p; },
    async close(i){ pages[i].closed = true; await pages[i].ctx.close(); },
    errors(){ return pages.flatMap(P => P.errs); },
    async done(){ await browser.close(); }
  };
}
export async function launch(n, opts = {}){
  if (REAL) return launchReal(n, opts);
  const browser = await chromium.launch();
  const pages = [], DBS = new Map(), subs = [];
  const lat = () => (opts.lat != null ? opts.lat : 50 + Math.random() * 50);
  const deliver = (i, m) => setTimeout(() => { const P = pages[i]; if (P && !P.closed) P.p.evaluate(x => window.__recv && window.__recv(x), m).catch(() => {}); }, lat());
  const queryDocs = (coll, o) => {
    let docs = [...DBS].filter(([k]) => k.startsWith(coll + '/') && k.split('/').length === coll.split('/').length + 1).map(([k, v]) => ({ id: k.split('/').pop(), data: v }));
    const OPS = { '==': (a, b) => a === b, '!=': (a, b) => a !== b, '>': (a, b) => a > b, '>=': (a, b) => a >= b, '<': (a, b) => a < b, '<=': (a, b) => a <= b,
      'array-contains': (a, b) => Array.isArray(a) && a.includes(b), 'in': (a, b) => b.includes(a), 'not-in': (a, b) => !b.includes(a) };
    for (const w of (o.ws || []).concat(o.w ? [o.w] : [])) docs = docs.filter(d => d.data[w[0]] !== undefined && OPS[w[1]](d.data[w[0]], w[2]));
    if (o.ob){ const has = docs.filter(d => d.data[o.ob] != null), not = docs.filter(d => d.data[o.ob] == null); has.sort((a, b) => (a.data[o.ob] > b.data[o.ob] ? 1 : -1) * (o.dir === 'desc' ? -1 : 1)); docs = has.concat(not); }
    if (o.lim) docs = docs.slice(0, o.lim);
    return docs;
  };
  const push = () => { for (const s of subs) deliver(s.i, { t: 'dbpush', sid: s.sid, docs: queryDocs(s.coll, s.o) }); };
  const dbcallFor = i => (src, op) => {
    if (op.op === 'get') return DBS.get(op.path) || null;
    if (op.op === 'set'){ DBS.set(op.path, JSON.parse(JSON.stringify(op.data))); push(); return null; }
    if (op.op === 'update'){ DBS.set(op.path, Object.assign({}, DBS.get(op.path) || {}, op.data)); push(); return null; }
    if (op.op === 'del'){ DBS.delete(op.path); push(); return null; }
    if (op.op === 'query') return queryDocs(op.coll, op.o);
    if (op.op === 'sub'){ for (let k = subs.length - 1; k >= 0; k--) if (subs[k].i === i && subs[k].stale) subs.splice(k, 1); subs.push({ i, sid: op.sid, coll: op.coll, o: op.o }); deliver(i, { t: 'dbpush', sid: op.sid, docs: queryDocs(op.coll, op.o) }); return null; }
  };
  for (let i = 0; i < n; i++){
    const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1000, height: 1000 }, ...(opts.ctx || {}) });
    const peer = 'peer' + i, uid = 'user' + i;
    await ctx.exposeBinding('__send', (src, m) => { const msg = Object.assign({ from: peer, by: uid }, m); for (let j = 0; j < pages.length; j++) if (j !== i) deliver(j, msg); });
    await ctx.exposeBinding('__dbcall', dbcallFor(i));
    if (false) await ctx.exposeBinding('__x', (src, op) => {
      if (op.op === 'get') return DBS.get(op.path) || null;
      if (op.op === 'set'){ DBS.set(op.path, JSON.parse(JSON.stringify(op.data))); push(); return null; }
      if (op.op === 'update'){ DBS.set(op.path, Object.assign({}, DBS.get(op.path) || {}, op.data)); push(); return null; }
      if (op.op === 'del'){ DBS.delete(op.path); push(); return null; }
      if (op.op === 'query') return queryDocs(op.coll, op.o);
      if (op.op === 'sub'){ subs.push({ i, sid: op.sid, coll: op.coll, o: op.o }); deliver(i, { t: 'dbpush', sid: op.sid, docs: queryDocs(op.coll, op.o) }); return null; }
    });
    await ctx.addInitScript(FAKE, { peer, uid });
    if (opts.init) await ctx.addInitScript(opts.init.fn, opts.init.arg);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR[' + i + '] ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errs.push('CONSOLE[' + i + '] ' + m.text()); });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    pages.push({ p, ctx, errs, peer, uid, closed: false });
  }
  for (const P of pages) await P.p.goto(opts.file || (PAGE), { waitUntil: 'load' });
  return {
    browser, pages, DBS,
    async start(names, f){ for (let i = 0; i < pages.length; i++){ const p = pages[i].p; await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title'); await p.evaluate(([n, f]) => startGame(freshHero(n, f || 'reich')), [names[i] || ('Ritter' + i), (f || [])[i]]); } await pages[0].p.waitForTimeout(600); },
    async reopen(i){
      const old = pages[i], peer = old.peer + 'b', uid = old.uid;
      const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1000, height: 1000 }, ...(opts.ctx || {}) });
      await ctx.exposeBinding('__send', (src, m) => { const msg = Object.assign({ from: peer, by: uid }, m); for (let j = 0; j < pages.length; j++) if (j !== i) deliver(j, msg); });
      await ctx.exposeBinding('__dbcall', dbcallFor(i));
      await ctx.addInitScript(FAKE, { peer, uid });
      if (opts.init) await ctx.addInitScript(opts.init.fn, opts.init.arg);
      const p = await ctx.newPage(), errs = old.errs;
      p.on('pageerror', e => errs.push('PAGEERROR[' + i + '] ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
      await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
      pages[i] = { p, ctx, errs, peer, uid, closed: false };
      await p.goto(opts.file || (PAGE), { waitUntil: 'load' });
      await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title' && SAVED, null, { timeout: 15000 });
      await p.evaluate(() => startGame(SAVED));
      return p;
    },
    async close(i){ const P = pages[i]; P.closed = true; for (const s of subs) if (s.i === i) s.stale = true; for (let j = 0; j < pages.length; j++) if (j !== i) deliver(j, { t: 'bye', from: P.peer }); await P.ctx.close(); },
    errors(){ return pages.flatMap(P => P.errs); },
    async done(){ await browser.close(); }
  };
}
export const wait = ms => new Promise(r => setTimeout(r, ms));
