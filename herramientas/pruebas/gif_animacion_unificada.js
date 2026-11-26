// GIF: Lumi en la Aldea con la animación unificada: quieta → cose → aguja → camina → salta → quieta (30 imágenes/s).
// Uso: node gif_animacion_unificada.js <carpeta del juego> <carpeta de cuadros>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , JUEGO, OUT] = process.argv; fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  await pg.goto('file://' + JUEGO + '/index.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { Save.load(); Save.aj().tutoriales = false; __g.scene.getScenes(true).forEach(s => __g.scene.stop(s.sys.settings.key)); __g.scene.start('Game', { level: 'aldea' }); });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { const g = __g, s = g.scene.getScene('Game'); g.loop.sleep(); let T = performance.now(); s.tweens.getDelta = () => 16.667;
    window.__st = n => { for (let i = 0; i < n; i++) { if (s.talking) { s.talkNext(); s.talkNext(); } T += 16.667; g.loop.now = T; g.loop.delta = 16.667; g.headlessStep(T, 16.667); } };
    window.__dib = () => { const c = s.cameras.main; c.startFollow(s.player, true, 1, 1, 0, 120); g.renderer.preRender(); s.sys.render(g.renderer); g.renderer.postRender(); };
    s.player.body.reset(520, 1150); window.__st(60); });
  const guion = i => i < 35 ? {} : i < 62 ? (i === 38 ? { cose: 1 } : {}) : i < 82 ? (i === 64 ? { aguja: 1 } : {}) : i < 140 ? { R: 1, U: i >= 100 && i < 110 } : {};
  for (let i = 0; i < 175; i++) {
    await pg.evaluate(a => { const s = __g.scene.getScene('Game'); s.cursors.right.isDown = !!a.R; s.cursors.up.isDown = !!a.U;
      if (a.cose) s.sewUntil = s.time.now + 650; if (a.aguja) s.attack();
      window.__st(2); window.__dib(); }, guion(i));
    await pg.screenshot({ path: `${OUT}/f${String(i).padStart(3, '0')}.png`, clip: { x: 60, y: 420, width: 600, height: 520 } });
  }
  await b.close(); })();
