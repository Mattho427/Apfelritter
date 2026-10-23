import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const browser = await chromium.launch();
const p = await (await browser.newContext({ viewport: { width: 1000, height: 1400 } })).newPage();
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(m.text()); if (m.type() === 'log') console.log('PAGE', m.text()); });
await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await p.addInitScript(() => {
  const docs = new Map(), subs = [];
  const snapOf = (path) => ({ id: path.split('/').pop(), exists: docs.has(path), data: () => docs.get(path) && JSON.parse(JSON.stringify(docs.get(path))), metadata: { fromCache: false, hasPendingWrites: false } });
  const notify = () => subs.forEach(s => s());
  const doc = path => ({ id: path.split('/').pop(), path,
    get: async () => snapOf(path),
    set: async d => { docs.set(path, JSON.parse(JSON.stringify(d))); window.__writes = (window.__writes || 0) + 1; notify(); },
    update: async d => { docs.set(path, Object.assign({}, docs.get(path), d)); notify(); },
    delete: async () => { docs.delete(path); notify(); },
    onSnapshot: (fn) => { const f = () => fn(snapOf(path)); subs.push(f); setTimeout(f, 10); return () => {}; } });
  const query = (col, ord, lim) => ({
    orderBy: (f, dir) => query(col, [f, dir], lim), limit: n => query(col, ord, n), where: () => query(col, ord, lim),
    get: async () => ({ docs: list(col, ord, lim) }),
    onSnapshot: (fn) => { const f = () => { const d = list(col, ord, lim); fn({ docs: d, size: d.length, empty: !d.length, docChanges: () => [] }); }; subs.push(f); setTimeout(f, 10); return () => {}; },
    doc: id => doc(col + '/' + id), path: col });
  const list = (col, ord, lim) => [...docs.keys()].filter(k => k.startsWith(col + '/') && k.split('/').length === col.split('/').length + 1).map(snapOf)
    .sort((a, b) => ord ? (b.data()[ord[0]] - a.data()[ord[0]]) * (ord[1] === 'desc' ? 1 : -1) : 0).slice(0, lim || 1000);
  docs.set('heroes/other1', { nm: 'Florian', lv: 7, kills: 120, bosses: 0, score: 700500 });
  docs.set('heroes/other2', { nm: 'Kunigunde', lv: 15, kills: 900, bosses: 2, score: 1500200 });
  docs.set('data/users/u1/save', { hero: JSON.stringify({ v:5, name:'Wolfram', lvl:4, xp:20, gold:77, potions:2, inv:Array(24).fill(null), eq:{}, quests:[], done:['v1'], kills:40, bosses:{}, bind:'burg', x:1900, y:456, played:600, savedAt: Date.now(), made: 1 }), at: Date.now() });
  const db = { doc, collection: col => query(col) };
  let peersFn = null, chatFn = null, me = { peer: 'me', by: 'u1', isMe: true, sameTab: true, kind: 'viewer', guest: false, presence: {}, updatedAt: 0 };
  const other = { peer: 'p2', by: 'u2', isMe: false, sameTab: false, kind: 'viewer', guest: false, presence: { x: 1960, y: 500, d: 'left', mv: 1, sw: 0, lv: 9, nm: 'Florian', f: 'spanien', ri: 'zelter' }, updatedAt: 0 };
  const room = {
    presence: async pr => { me = Object.assign({}, me, { presence: Object.assign({}, me.presence, pr) }); window.__pres = me.presence; },
    onPeers: fn => { peersFn = fn; setTimeout(() => fn({ peers: [me, other], joined: [me, other], left: [], updated: [] }), 20); return () => {}; },
    on: (t, fn) => { if (t === 'chat') chatFn = fn; return () => {}; },
    emit: async (t, d) => { window.__emits = (window.__emits || []).concat([[t, d]]); },
    connected: () => true, peers: () => [me, other]
  };
  window.__peerSay = (t) => chatFn && chatFn({ topic: 'chat', data: { nm: 'Florian', t }, peer: 'p2', by: 'u2', isMe: false, sameTab: false, kind: 'viewer', guest: false });
  window.__peerMove = (x, y, sw) => { other.presence = Object.assign({}, other.presence, { x, y, mv: 1, sw: sw || 0, sa: -1, se: 2, sl: .3 }); peersFn && peersFn({ peers: [me, other], joined: [], left: [], updated: [other] }); };
  const user = { id: async () => 'u1', isOwner: async () => false, canEdit: async () => false, can: async () => true };
  window.claude = { use: async name => ({ db, room, user })[name] || null };
});
await p.goto(GAME, { waitUntil: 'load' });
await p.waitForTimeout(800);
const cab = await p.$('.cabinet');
await cab.screenshot({ path: OUT + 'm_title3.png' });
console.log('start panel:', await p.evaluate(() => ({ cont: !document.getElementById('startCont').hidden, name: document.getElementById('contName').textContent, info: document.getElementById('contInfo').textContent })));
await p.click('#btnContinue');
await p.waitForTimeout(600);
await p.evaluate(() => { document.getElementById('banner').hidden = true; });
await p.evaluate(() => window.__peerMove(1940, 470, 1));
await p.waitForTimeout(150);
await p.evaluate(() => window.__peerSay('Gott zum Gruße! Wer kommt mit zum Moor?'));
await p.keyboard.press('Enter');
await p.keyboard.type('Ich komme mit!');
await p.keyboard.press('Enter');
await p.waitForTimeout(400);
await cab.screenshot({ path: OUT + 'm_ride.png' });
const st = await p.evaluate(() => ({ peers: [...PEERS.values()].map(q => q.nm + q.lv + '@' + Math.round(q.x)), emits: window.__emits, pres: window.__pres, online: document.getElementById('online').textContent, onlineHidden: document.getElementById('onlineWrap').hidden, hero: HERO.name + HERO.lvl }));
console.log(JSON.stringify(st));
await p.evaluate(() => { saveHero(); });
await p.waitForTimeout(300);
console.log('writes', await p.evaluate(() => window.__writes));
const notes = await p.$('#fameList');
await (await p.$('.notes')).screenshot({ path: OUT + 'm_notes3.png' });
console.log(errs.join('\n') || 'keine Fehler');
await browser.close();
