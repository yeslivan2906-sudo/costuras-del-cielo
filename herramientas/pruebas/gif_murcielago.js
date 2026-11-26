// GIF del murciélago en 1-2: vuela, chilla, se lanza en picada; Lumi se aparta y lo golpea al bajar hasta remendarlo.
const { chromium } = require('playwright'); const fs = require('fs');
const [, , J, OUT] = process.argv; fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  await pg.goto('file://' + J + '/index.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { Save.load(); __g.scene.getScenes(true).forEach(s => __g.scene.stop(s.sys.settings.key)); __g.scene.start('Game', { level: 'puntada' }); });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { const g = __g, s = g.scene.getScene('Game'); g.loop.sleep(); let T = performance.now(); s.tweens.getDelta = () => 16.667;
    window.__st = n => { for (let i = 0; i < n; i++) { if (s.talking && s.talkNext) s.talkNext(); T += 16.667; g.loop.now = T; g.loop.delta = 16.667; g.headlessStep(T, 16.667); } };
    window.__dib = () => { g.renderer.preRender(); s.sys.render(g.renderer); g.renderer.postRender(); };
    s.energy = 999; s.sew(s.L.links[0]); window.__st(100); s.player.body.reset(2 * 150, 2 * 960); s.cameras.main.setLerp(1, 1); window.__st(20); s.cameras.main.setLerp(0.12, 0.12); });
  for (let i = 0; i < 200; i++) {
    await pg.evaluate(() => { const s = __g.scene.getScene('Game'), p = s.player, e = s.criaturas[0];
      let R = false, Lf = false;
      if (e && e.vivo) {
        const d = (e.o.x - p.x) / 2, dyb = (p.body.center.y - e.o.y) / 2;
        if (e.estado === 'aviso') { R = p.x / 2 < 200; Lf = !R; }                 // se aparta de la picada
        else if ((e.estado === 'picada' || e.estado === 'regreso') && Math.abs(d) < 56 && Math.abs(dyb) < 38 && s.time.now > s.attackUntil + 150) { s.facing = d > 0 ? 1 : -1; p.setFlipX(d < 0); s.attack(); }
        else if (e.estado === 'vuelo' && Math.abs(d) > 40) { R = d > 0; Lf = d < 0; }
      }
      s.cursors.right.isDown = R; s.cursors.left.isDown = Lf; window.__st(2); window.__dib(); });
    await pg.screenshot({ path: `${OUT}/f${String(i).padStart(3, '0')}.png`, clip: { x: 0, y: 200, width: 720, height: 800 } });
  }
  await b.close(); })();
