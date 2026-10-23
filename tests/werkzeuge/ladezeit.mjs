import { chromium, ROOT, OUT, GAME, PAGE, MOBILE } from '../pfad.mjs';
const file = process.argv[2], thr = +(process.argv[3] || 1);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1000, height: 1000 } });
for (let run = 1; run <= 2; run++){
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  if (thr > 1){ const s = await ctx.newCDPSession(p); await s.send('Emulation.setCPUThrottlingRate', { rate: thr }); }
  const t0 = Date.now();
  await p.goto('file://' + file);
  await p.waitForFunction(() => typeof G !== 'undefined' && G && G.mode === 'title', null, { timeout: 120000 });
  const t1 = Date.now();
  await p.waitForTimeout(100);
  if (run === 2) await (await p.$('.cabinet')).screenshot({ path: OUT + 'v20_title_early.png' });
  // Bildrate auf dem Titel in den ersten 3 s (hier wird nachgemalt)
  const fr = await p.evaluate(() => new Promise(r => { let n = 0, worst = 0, last = performance.now(); const t = last; const f = () => { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; if (now - t < 3000) requestAnimationFrame(f); else r({ fps: n / 3, worst: Math.round(worst) }); }; requestAnimationFrame(f); }));
  const st = await p.evaluate(() => ({ lazyLeft: GPROPS.filter(p => p.lz).length, chunks: wo_CACHE.size, pm: typeof PM !== 'undefined' && !!PM, lazyQ: typeof LAZY !== 'undefined' ? LAZY.q.length : -1 }));
  if (run === 2) await (await p.$('.cabinet')).screenshot({ path: OUT + 'v20_title_3s.png' });
  console.log('Lauf', run, 'bis Titel', t1 - t0, 'ms | Titel-Bildrate', fr.fps.toFixed(1), 'schlechtestes Bild', fr.worst, 'ms |', JSON.stringify(st), errs.length ? 'FEHLER ' + errs.join('; ') : '');
  await p.close();
}
await b.close();
