// Qué recursos de assets/ usa de verdad el juego: se registran todas las consultas a texturas 'a/…' mientras se recorren
// todas las escenas (título, opciones, mapa, taller, 1-1 antes y después de coser, 1-2 antes y después de coser).
// Uso: node texturas_usadas.js <phaser.min.js> <carpeta del juego> <salida.json>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , PH, JUEGO, OUT] = process.argv;
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  if (PH !== '-') await pg.route('**/phaser.min.js', r => r.fulfill({ path: PH, contentType: 'application/javascript' }));
  await pg.goto('file://' + JUEGO + '/index.html'); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { window.__usadas = new Set(); const T = __g.textures;
    for (const f of ['get', 'exists', 'getFrame']) { const o = T[f].bind(T); T[f] = (k, ...r) => { if (typeof k === 'string' && k.startsWith('a/')) __usadas.add(k); return o(k, ...r); }; } });
  const ir = async (k, d) => { await pg.evaluate(([k, d]) => { __g.scene.getScenes(true).forEach(s => __g.scene.stop(s.sys.settings.key)); __g.scene.start(k, d); }, [k, d]); await pg.waitForTimeout(2500); };
  for (const [k, d] of [['Title', {}], ['Opciones', {}], ['Mundos', {}], ['Mundos', { cont: true }], ['Tienda', {}]]) await ir(k, d);
  for (const lvl of ['aldea', 'puntada']) {
    await ir('Game', { level: lvl });
    await pg.evaluate(() => { const s = __g.scene.getScene('Game'); s.L.links.forEach(l => s.sew(l, true)); });
    await pg.waitForTimeout(4000);
  }
  const usadas = await pg.evaluate(() => [...__usadas].sort());
  const todas = await pg.evaluate(() => Object.keys(window.ASSETS).map(k => 'a/' + k).sort());
  const res = { usadas, sin_usar: todas.filter(k => !usadas.includes(k)), total: todas.length };
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log('usadas', usadas.length, 'de', todas.length); console.log('sin usar:', res.sin_usar.join(' '));
  await b.close(); })();
