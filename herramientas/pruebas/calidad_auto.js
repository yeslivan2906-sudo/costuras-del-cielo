// PRUEBA: calidad automática (si el teléfono baja de 55 FPS 2 s seguidos: fuera el viento; si sigue, fuera las partículas).
// Uso: node herramientas/pruebas/calidad_auto.js <phaser> <carpeta del juego> <salida>
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const DIR = process.argv[3] || path.join(__dirname, '..', '..');
const fuente = fs.readFileSync(path.join(__dirname, 'recorrido_completo.js'), 'utf8');
const LIB = fuente.match(/const LIB = (\(\) => \{[\s\S]*?\n\};)/)[1].replace(/;$/, '');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.resolve(DIR, 'index.html')); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { __g.scene.getScenes(true).forEach(s => s.scene.key !== 'Game' && __g.scene.stop(s.scene.key)); __g.scene.start('Game', { level: 'aldea' }); });
  await pg.waitForTimeout(1500); await pg.evaluate(`(${LIB})()`);
  const r = await pg.evaluate(() => { __J.dormir(); const s = __J.S(); window.__fpsFalso = 90; __J.st(300); const a = s.fondoLigero;
    window.__fpsFalso = 30; __J.st(150); const b = s.fondoLigero, v = s.fondoVivo.conViento.map(o => o.postPipelines.length).join(',');
    __J.st(150); const c = s.fondoLigero, pv = s.fondoVivo.particulas.map(p => p.emitting).join(',');
    return { a, b, v, c, pv }; });
  const ok = r.a === 0 && r.b === 1 && r.v === '0' && r.c === 2 && r.pv === 'false' && !errs.length;
  console.log((r.a === 0 ? '  ✓' : '  ✗') + ' con 90 FPS no se apaga nada');
  console.log((r.b === 1 && r.v === '0' ? '  ✓' : '  ✗') + ' lento 2 s: se apaga el viento', JSON.stringify(r));
  console.log((r.c === 2 && r.pv === 'false' ? '  ✓' : '  ✗') + ' sigue lento: se paran las partículas');
  console.log((!errs.length ? '  ✓' : '  ✗') + ' sin errores', errs.join(' | '));
  console.log(ok ? 'TODO CORRECTO' : 'FALLA'); await b.close();
})();
