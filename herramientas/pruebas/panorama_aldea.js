// Panorámica de la Aldea en UNA sola imagen (sin costuras): el juego se renderiza a 2800 × 1280 con una sola cámara.
// Uso: node panorama_aldea.js <phaser.min.js> <url> <salida.png> [cosido=1|0] [lumi=1|0]
const { chromium } = require('playwright');
const [,, PHASER, URL, OUT, COSIDO = '1', LUMI = '0'] = process.argv;
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route('**/phaser.min.js', r => r.fulfill({ path: PHASER, contentType: 'application/javascript' }));
  await pg.goto(URL); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { localStorage.clear(); Save.load(); Save.aj().tutoriales = false;
    __g.scene.getScenes(true).forEach(sc => { if (sc.sys.settings.key !== 'Game') __g.scene.stop(sc.sys.settings.key); }); __g.scene.start('Game', { level: 'aldea' }); });
  await pg.waitForTimeout(3000);
  await pg.evaluate(([cos, lumi]) => { const g = __g, s = g.scene.getScene('Game'); g.loop.sleep(); let T = performance.now();
    window.__st = n => { for (let i = 0; i < n; i++) { if (s.talking) { s.talkNext(); s.talkNext(); } if (s.hideHint) s.hideHint(); T += 16.667; g.loop.now = T; g.loop.delta = 16.667; g.headlessStep(T, 16.667); } };
    window.__st(200);
    if (cos === '1') { s.L.links[0].done = true; s.restorables.filter(r => r.grp === 'main').forEach(r => { r.done = true; r.rep.setAlpha(1); if (r.dmg) r.dmg.setAlpha(0); }); s.gray.setAlpha(0); s.cambiarPuente('reparado'); }
    s.player.setVisible(lumi === '1');
    if (lumi === '1') { s.player.body.reset(1576, 834); s.player.body.setVelocity(0, 0); window.__st(30); }
    s.tweens.pauseAll(); s.children.list.forEach(o => { if (o.anims && o.anims.isPlaying) o.anims.pause(); });
    s.children.list.filter(o => o.scrollFactorX === 0 && o.depth >= 50).forEach(o => o.setVisible(false)); }, [COSIDO, LUMI]);
  // 4 vistas de 720 px (x 0, 720, 1440, 2080) con la cámara a y 380; se unen en una imagen de 2800 × 1280
  for (const x of [0, 720, 1440, 2080]) {
    await pg.evaluate(x => { const g = __g, s = g.scene.getScene('Game'), c = s.cameras.main; c.stopFollow(); c.setScroll(x, 380);
      s.updateParallax(); g.renderer.preRender(); s.sys.render(g.renderer); g.renderer.postRender(); }, x);
    await pg.screenshot({ path: OUT.replace('.png', `_vista_${x}.png`) });
  }
  if (errs.length) console.log('errores', errs);
  await b.close();
})();
