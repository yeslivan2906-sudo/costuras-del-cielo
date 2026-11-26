// Captura de los personajes en la Aldea (Lumi junto a Tilo, Nube volando) y de Lumi caminando (4 cuadros).
const { chromium } = require('playwright');
const [, , JUEGO, OUT] = process.argv;
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  await pg.goto('file://' + JUEGO + '/index.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { Save.load(); Save.aj().tutoriales = false; __g.scene.getScenes(true).forEach(s => __g.scene.stop(s.sys.settings.key)); __g.scene.start('Game', { level: 'aldea' }); });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => { const s = __g.scene.getScene('Game'); s.player.body.reset(560, 1150); s.facing = 1; });
  await pg.waitForTimeout(2500);
  await pg.screenshot({ path: OUT + '/personajes_aldea.png' });
  const fr = await pg.evaluate(() => { const s = __g.scene.getScene('Game'); return ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'jump', 'sew', 'attack'].map(p => s.textures.exists(lk(p))); });
  console.log('texturas de Lumi:', fr.join(' '));
  await b.close(); })();
