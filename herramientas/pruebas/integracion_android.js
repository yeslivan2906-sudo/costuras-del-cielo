// PRUEBA de la integración Android SIN teléfono: se simula el objeto Capacitor (botón «atrás», salir de la app) y el
// paso a segundo plano. Comprueba también que el juego arranca con Phaser local (lib/), sin internet.
// Uso: node integracion_android.js <carpeta del juego> <salida.json>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , JUEGO, OUT] = process.argv;
const res = [], ok = (c, m, d) => { res.push({ ok: !!c, msg: m, d }); console.log((c ? '  ✓ ' : '  ✗ ') + m + (d !== undefined ? ' ' + JSON.stringify(d) : '')); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 720, height: 1280 }, offline: true }); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('requestfailed', r => errs.push('falla carga ' + r.url()));
  await pg.addInitScript(() => { window.__atras = []; window.__salio = false;
    window.Capacitor = { Plugins: { App: { addListener: (ev, f) => { if (ev === 'backButton') window.__atras.push(f); }, exitApp: () => { window.__salio = true; } } } }; });
  await pg.goto('file://' + JUEGO + '/index.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3500);
  const E = (f, a) => pg.evaluate(f, a), atras = () => E(() => window.__atras.forEach(f => f())), act = () => E(() => __g.scene.getScenes(true).map(s => s.sys.settings.key).join(','));
  ok(await E(() => typeof Phaser !== 'undefined' && Phaser.VERSION === '3.80.1' && __g.scene.isActive('Title')), 'sin internet: arranca con Phaser 3.80.1 local y muestra el título');
  ok(await E(() => window.__atras.length === 1), 'se registra el botón atrás de Android');
  await E(() => __g.scene.getScene('Title').scene.start('Opciones', { from: 'Title' })); await pg.waitForTimeout(800);
  await atras(); await pg.waitForTimeout(800); ok((await act()) === 'Title', 'atrás en Opciones → título', await act());
  await E(() => __g.scene.getScene('Title').scene.start('Mundos', {})); await pg.waitForTimeout(800);
  await E(() => __g.scene.getScene('Mundos').scene.start('Tienda', { from: 'Mundos', back: {} })); await pg.waitForTimeout(800);
  await atras(); await pg.waitForTimeout(800); ok((await act()) === 'Mundos', 'atrás en el Taller → mapa', await act());
  await atras(); await pg.waitForTimeout(800); ok((await act()) === 'Title', 'atrás en el mapa → título', await act());
  await E(() => __g.scene.getScene('Title').scene.start('Game', { level: 'aldea' })); await pg.waitForTimeout(2500);
  await atras(); await pg.waitForTimeout(300); ok(await E(() => __g.scene.getScene('Game').paused && !!__g.scene.getScene('Game').pauseUI), 'atrás en el juego → abre la pausa');
  await atras(); await pg.waitForTimeout(300); ok(await E(() => !__g.scene.getScene('Game').paused), 'atrás otra vez → cierra la pausa');
  await E(() => { const s = __g.scene.getScene('Game'); s.player.body.reset(1770, 834); s.trySewNear(); }); await pg.waitForTimeout(300);
  const conDialogo = await E(() => __g.scene.getScene('Game').paused);
  await atras(); await pg.waitForTimeout(300);
  ok(conDialogo && await E(() => __g.scene.getScene('Game').paused && !__g.scene.getScene('Game').pauseUI), 'con el diálogo «Reparar» abierto, atrás no lo rompe (sigue el diálogo)');
  await pg.keyboard.press('p'); await pg.waitForTimeout(300);
  ok(await E(() => __g.scene.getScene('Game').paused && !__g.scene.getScene('Game').pauseUI), 'con el diálogo abierto, la tecla P tampoco lo rompe (corrección)');
  await E(() => { const s = __g.scene.getScene('Game'); const t = s.children.list.find(o => o.type === 'Text' && o.text === 'Cerrar'); const z = s.children.list.find(o => o.type === 'Zone' && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2); z.emit('pointerdown'); });
  await pg.waitForTimeout(300); ok(await E(() => !__g.scene.getScene('Game').paused), '«Cerrar» del diálogo devuelve el control');
  await E(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await pg.waitForTimeout(300); ok(await E(() => __g.scene.getScene('Game').paused && !!__g.scene.getScene('Game').pauseUI), 'al pasar a segundo plano (llamada, inicio) el juego queda en pausa');
  await E(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); });
  await E(() => __g.scene.getScene('Game').scene.start('Title')); await pg.waitForTimeout(800);
  await atras(); ok(await E(() => window.__salio), 'atrás en el título → cierra la app');
  await E(() => { Save.data.jugado = false; });
  ok(!errs.length, 'sin errores ni cargas fallidas', errs);
  fs.writeFileSync(OUT, JSON.stringify({ pasos: res, errores: errs }, null, 1));
  console.log(res.every(r => r.ok) ? 'TODO CORRECTO' : res.filter(r => !r.ok).length + ' FALLOS');
  await b.close();
})();
