// GIF del combate en la Aldea: Lumi cruza el puente cosido, el lobo avisa y embiste, Lumi recibe un golpe,
// contraataca con la aguja (números de daño) y lo remienda; recoge las monedas.
const { chromium } = require('playwright'); const fs = require('fs');
const [, , J, OUT] = process.argv; fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  await pg.goto('file://' + J + '/index.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { Save.load(); __g.scene.getScenes(true).forEach(s => __g.scene.stop(s.sys.settings.key)); __g.scene.start('Game', { level: 'aldea' }); });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { const g = __g, s = g.scene.getScene('Game'); g.loop.sleep(); let T = performance.now(); s.tweens.getDelta = () => 16.667;
    window.__st = n => { for (let i = 0; i < n; i++) { if (s.talking) { s.talkNext(); } T += 16.667; g.loop.now = T; g.loop.delta = 16.667; g.headlessStep(T, 16.667); } };
    window.__dib = () => { g.renderer.preRender(); s.sys.render(g.renderer); g.renderer.postRender(); };
    s.spools = 1; s.sew(s.L.links[0]); window.__st(120); s.hintFlags.leaf = true;
    s.player.body.reset(2 * 1085, 2 * 410); s.cameras.main.setLerp(1, 1); window.__st(40); s.cameras.main.setLerp(0.12, 0.12); });
  // jugadora sencilla: se acerca, retrocede durante el aviso/embestida y golpea mientras el lobo descansa
  for (let i = 0; i < 190; i++) {
    await pg.evaluate(i => { const s = __g.scene.getScene('Game'), p = s.player, e = s.criaturas[0];
      let R = false, Lf = false, N = false;
      if (i < 8) {} else if (e && e.vivo) {
        const d = (e.o.x - p.x) / 2;
        if (e.estado === 'aviso' || e.estado === 'embestida') Lf = d < 90;
        else if (d > 52) R = true;
        else if (d > 0 && s.time.now > s.attackUntil + 150) N = true;
        s.facing = d > 0 ? 1 : -1;
      } else if (i < 170) R = (s.coinItems.some(c => c.active && c.x > p.x));
      s.cursors.right.isDown = R; s.cursors.left.isDown = Lf;
      if (N) s.attack();
      window.__st(2); if (Lf) { s.facing = 1; p.setFlipX(false); } window.__dib(); }, i);
    await pg.screenshot({ path: `${OUT}/f${String(i).padStart(3, '0')}.png`, clip: { x: 0, y: 160, width: 720, height: 760 } });
  }
  await b.close(); })();
