// PRUEBA DE MENÚS, CONTROLES TÁCTILES Y GUARDADO (tiempo real, con toques/clics de verdad sobre la pantalla).
// Título · Opciones · Mapa · capítulos bloqueados y compra de prueba con puerta para adultos · Taller de Nube (capuchas)
// · controles en pantalla (joystick, salto, carrete, aguja, Hablar, barra rápida) · teclado · pausa y sus botones ·
// anuncio de prueba con premio · salir al mapa · recarga de la página (guardado) · borrar partida.
// Nota: en el navegador de pruebas (sin GPU) el juego va a pocos cuadros por segundo, así que las distancias que
// recorre Lumi en tiempo real son menores que en un móvil; se comprueba la dirección del movimiento, no la distancia.
// Uso: node menus_y_controles.js <phaser.min.js> <carpeta del juego> <salida>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , PH, JUEGO, OUT] = process.argv; fs.mkdirSync(OUT + '/capturas', { recursive: true });
const log = [], fallos = [];
const ok = (c, m, d) => { log.push({ ok: !!c, msg: m, ...(d !== undefined ? { datos: d } : {}) }); if (!c) fallos.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m + (d !== undefined ? ' ' + JSON.stringify(d) : '')); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 720, height: 1280 }, hasTouch: true }); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|WebGL/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  if (PH !== '-') await pg.route('**/phaser.min.js', r => r.fulfill({ path: PH, contentType: 'application/javascript' }));
  const URL = 'file://' + JUEGO + '/index.html';
  await pg.addInitScript(() => { window.__sinViento = true; });   // el viento del fondo (shader) hace muy lento el navegador sin GPU de las pruebas
  await pg.goto(URL); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3000);
  const E = (f, a) => pg.evaluate(f, a);
  const act = () => E(() => __g.scene.getScenes(true).map(s => s.sys.settings.key).join(','));
  const toca = async (x, y, ms = 600) => { await pg.mouse.click(x * 2, y * 2); await pg.waitForTimeout(ms); };   // unidades base 360 × 640
  const foto = n => pg.screenshot({ path: `${OUT}/capturas/${n}.png` });
  // busca también dentro de los contenedores (la caja de pistas de Nube es un contenedor)
  const textoVisible = t => E(t => { const todos = l => l.flatMap(o => o.type === 'Container' ? (o.visible && o.alpha > 0 ? todos(o.list) : []) : [o]);
    return __g.scene.getScenes(true).some(s => todos(s.children.list).some(o => o.type === 'Text' && o.visible && o.alpha > 0 && o.text.includes(t))); }, t);
  // espera hasta que se cumpla (el navegador de pruebas va lento: el tiempo de juego avanza más despacio que el real)
  const hasta = async (f, ms = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f()) return true; await pg.waitForTimeout(250); } return false; };
  const tocaTexto = async (t, ms = 700) => { const p = await E(t => { for (const s of __g.scene.getScenes(true)) { const o = s.children.list.filter(o => o.type === 'Text' && o.visible && o.text === t).pop(); if (o) return [o.x / 2, o.y / 2]; } return null; }, t);
    if (!p) return false; await toca(p[0], p[1], ms); return true; };

  console.log('TÍTULO Y OPCIONES');
  await toca(180, 431); ok(await textoVisible('Aún no tienes una partida guardada'), '«Continuar» sin partida avisa que no hay partida guardada');
  await pg.waitForTimeout(2300);
  await toca(180, 510, 1000); ok((await act()) === 'Galeria', '«Galería» abre la galería', await act());
  ok(await E(() => { const g = __g.scene.getScene('Galeria'); return g.postales.length === 12 && g.postales.every(p => !p.abierta); }), 'partida nueva: los 12 recuerdos están cerrados');
  await toca(259, 102, 900); ok(await E(() => { const g = __g.scene.getScene('Galeria'); return g.pest === 'criaturas' && g.fichas.length === 6 && g.fichas.every(f => !f.vista); }), 'pestaña Criaturas: 6 criaturas sin conocer');
  await toca(32, 32, 1000); ok((await act()) === 'Title', 'la flecha de la galería vuelve al título', await act());
  await pg.waitForTimeout(2300);
  await toca(180, 550); ok(await textoVisible('este botón cierra el juego'), '«Salir» en navegador avisa; en Android cierra la app');
  await pg.waitForTimeout(2300);
  await toca(180, 470); ok((await act()) === 'Opciones', '«Opciones» abre la pantalla de opciones', await act());
  await foto('01_opciones');
  const aj0 = await E(() => ({ ...Save.aj() }));
  await pg.mouse.move(560, 490); await pg.mouse.down(); await pg.mouse.move(400, 490, { steps: 4 }); await pg.mouse.up(); await pg.waitForTimeout(300);
  await toca(302.5, 343.5); await toca(302.5, 370); await toca(317.5, 398);
  const aj1 = await E(() => ({ ...Save.aj() }));
  ok(aj1.efectos !== aj0.efectos && aj1.vibracion !== aj0.vibracion && aj1.tutoriales !== aj0.tutoriales && aj1.pistas !== aj0.pistas, 'deslizador de efectos, vibración, tutoriales y pistas cambian y se guardan', { antes: aj0, despues: aj1 });
  await toca(279, 507.5, 1400); const aj2 = await E(() => ({ ...Save.aj() }));
  ok(aj2.efectos === 100 && aj2.vibracion === true && aj2.tutoriales === true && aj2.pistas === 1, '«Restablecer» vuelve a los valores de fábrica', aj2);
  await toca(28, 30); ok((await act()) === 'Title', 'flecha atrás vuelve al título', await act());

  console.log('NUEVA PARTIDA Y CONTROLES TÁCTILES');
  await toca(178, 386, 2500); ok((await act()) === 'Game', 'Nueva partida abre el juego', await act());
  await E(() => { Save.aj().tutoriales = true; });
  const x0 = await E(() => __g.scene.getScene('Game').player.x);
  await pg.mouse.move(236, 1096); await pg.mouse.down(); await pg.waitForTimeout(1500);
  const x1 = await E(() => __g.scene.getScene('Game').player.x); await pg.mouse.up();
  await pg.mouse.move(92, 1096); await pg.mouse.down(); await pg.waitForTimeout(1500);
  const x2 = await E(() => __g.scene.getScene('Game').player.x); await pg.mouse.up(); await pg.waitForTimeout(300);
  const x3 = await E(() => __g.scene.getScene('Game').player.x); await pg.waitForTimeout(400);
  const x4 = await E(() => __g.scene.getScene('Game').player.x);
  ok(x1 > x0 + 30 && x2 < x1, 'flechas: ▶ mueve a la derecha, ◀ a la izquierda', { x0, x1, x2 });
  ok(Math.abs(x4 - x3) < 1, 'al soltar la flecha Lumi se para', { x3, x4 });
  await pg.mouse.move(644, 904); await pg.mouse.down(); await pg.waitForTimeout(120);
  const vy = await E(() => __g.scene.getScene('Game').player.body.velocity.y); await pg.mouse.up(); await pg.waitForTimeout(900);
  ok(vy < -100, 'botón ↑ salta', vy);
  // dos dedos: joystick + salto a la vez (multitáctil)
  await pg.evaluate(() => {});
  const md = await E(() => __g.input.pointers.length);
  ok(md >= 3, 'el juego acepta varios dedos a la vez (flecha + botón)', md);
  await pg.mouse.click(556, 1000);   // toque RÁPIDO (pulsar y soltar al instante)
  ok(await hasta(() => textoVisible('Acércate a un anclaje dorado'), 4000), 'botón del carrete (toque rápido) lejos de un anclaje: Nube explica qué hacer');
  await pg.mouse.click(644, 1096);
  ok(await hasta(() => E(() => __g.scene.getScene('Game').attackUntil > 0), 4000), 'botón de la aguja (toque rápido): Lumi ataca');
  await toca(130, 612); ok(await textoVisible('No tienes pociones'), 'barra rápida: poción (sin pociones explica dónde conseguirlas)');
  await toca(244, 612); ok(await textoVisible('Hojas doradas'), 'barra rápida: hojas doradas');
  // Hablar con Tilo con el botón en pantalla
  await E(() => { const s = __g.scene.getScene('Game'); s.player.body.reset(660, 1150); });
  await pg.waitForTimeout(700);
  ok(await E(() => __g.scene.getScene('Game').actBtn.visible), 'junto a Tilo aparece «Hablar»');
  await toca(232, 452, 600); ok(await E(() => __g.scene.getScene('Game').talking), '«Hablar» abre el diálogo con Tilo');
  await foto('02_dialogo_tilo');
  for (let k = 0; k < 14 && await E(() => __g.scene.getScene('Game').talking); k++) await toca(180, 520, 450);
  ok(!(await E(() => __g.scene.getScene('Game').talking)) && (await E(() => __g.scene.getScene('Game').quest.tasks[0].n)) === 1, 'tocando la pantalla se avanza y se cierra el diálogo; tarea cumplida');
  // teclado
  const k0 = await E(() => __g.scene.getScene('Game').player.x);
  await pg.keyboard.down('ArrowLeft'); await pg.waitForTimeout(1500); await pg.keyboard.up('ArrowLeft');
  ok((await E(() => __g.scene.getScene('Game').player.x)) < k0 - 20, 'teclado: flechas mueven a Lumi');

  console.log('PAUSA');
  await toca(338, 23); ok(await E(() => __g.scene.getScene('Game').paused), 'el engranaje abre la pausa');
  await foto('03_pausa');
  const fx = await E(() => __g.scene.getScene('Game').player.x); await pg.waitForTimeout(500);
  ok((await E(() => __g.scene.getScene('Game').player.x)) === fx && await E(() => __g.scene.getScene('Game').physics.world.isPaused), 'en pausa el juego se detiene');
  await toca(180, 362); ok((await E(() => Save.data.sonido)) === false, '«Sonido» se apaga y se guarda'); await toca(180, 362);
  await toca(180, 416, 800); ok(await textoVisible('Anuncio de prueba'), '«Pista de Nube» muestra el anuncio de prueba (simulado)');
  ok(await hasta(() => textoVisible('Recibir premio')), 'tras la cuenta atrás de 5 s aparece «Recibir premio»');
  await tocaTexto('Recibir premio', 900); await hasta(() => E(() => !__g.scene.getScene('Game').paused), 5000);
  ok(!(await E(() => __g.scene.getScene('Game').paused)) && (await E(() => Save.data.ads.n)) === 1, 'el premio cierra la pausa, guía con puntos y descuenta un anuncio del día');
  await foto('04_guia_de_nube');
  await toca(338, 23); await toca(180, 266); ok(!(await E(() => __g.scene.getScene('Game').paused)), '«Seguir» continúa');
  await toca(338, 23); await toca(180, 314, 1200);
  ok(await E(() => { const s = __g.scene.getScene('Game'); return !s.paused && s.quest.tasks[0].n === 0; }), '«Reiniciar» vuelve a empezar el nivel');
  await toca(338, 23); await toca(180, 474, 1200); ok((await act()) === 'Capitulo', '«Salir al mapa» abre el Capítulo I con sus niveles', await act());
  ok(await E(() => { const c = __g.scene.getScene('Capitulo').casillas; return c.length === 12 && c[0].abierto; }), 'el Capítulo I muestra los 12 niveles (el 1-1 abierto)');
  await toca(28, 30, 1000); ok((await act()) === 'Mundos', 'la flecha del Capítulo vuelve al mapa del mundo', await act());

  console.log('MAPA, COMPRA Y TALLER');
  await foto('05_mapa');
  await toca(257, 292, 900); ok(await textoVisible('Solo para adultos'), 'capítulo bloqueado → puerta para adultos antes de comprar');
  const resp = await E(() => { const s = __g.scene.getScene('Mundos'); const q = s.children.list.find(o => o.type === 'Text' && /Cuánto es/.test(o.text)).text.match(/(\d+) × (\d+)/); return String(q[1] * q[2]); });
  await tocaTexto(resp, 1400);
  ok(await E(() => Save.data.owned.cielo_completo === true), 'respuesta correcta → compra de prueba «Cielo completo» (modo prueba, sin cobro)');
  await pg.waitForTimeout(600);
  await toca(257, 292, 700); ok(await textoVisible('llegará en una actualización'), 'capítulo II comprado pero sin niveles: «llegará en una actualización» (no programado)');
  await pg.waitForTimeout(2300);
  await toca(277, 425, 900); ok((await act()) === 'Tienda', 'Taller de Nube abre la tienda', await act());
  await foto('06_taller');
  await E(() => { Save.data.cristales = 3; Save.save(); }); await tocaTexto('Volver', 900); await toca(277, 425, 900);
  await toca(294, 305, 1500);
  ok(await E(() => Save.data.owned.aurora && Save.data.skin === 'aurora' && Save.data.cristales === 0), 'comprar la capucha Aurora con 3 cristales y ponérsela');
  await toca(66, 305, 900); ok(await E(() => Save.data.skin === 'clasica'), 'volver a la capucha Clásica');
  await toca(180, 305, 900); ok(await textoVisible('Encuentra todos los secretos'), 'capucha Estrella sin ganar: explica cómo ganarla');
  await pg.waitForTimeout(2300);
  await toca(180, 447, 900); ok(await textoVisible('Necesitas 5 cristales'), 'capucha Noche sin cristales suficientes: avisa cuántos faltan');
  await pg.waitForTimeout(2300);
  await tocaTexto('Volver', 900); ok((await act()) === 'Mundos', '«Volver» regresa al mapa');
  await toca(95, 367, 1200); ok((await act()) === 'Capitulo', 'capítulo I en el mapa abre la lista de sus 12 niveles', await act());
  await toca(130, 518, 2500); ok(await E(() => __g.scene.isActive('Game') && __g.scene.getScene('Game').L.id === 'aldea'), 'tocar el 1-1 abre ese nivel');

  console.log('GUARDADO Y RECARGA');
  await E(() => { Save.data.completados['1-1'] = true; Save.data.hojas['1-1'] = 6; Save.data.secretos['1-1'] = 1; Save.save(); });
  await pg.reload(); await pg.waitForTimeout(3000);
  await toca(180, 431, 1200); ok((await act()) === 'Mundos', 'tras recargar, «Continuar» abre el mapa de la partida guardada', await act());
  await foto('07_mapa_continuar');
  ok(await textoVisible('%'), 'el panel muestra progreso, tiempo y fecha');
  await toca(121, 570, 2500); ok(await E(() => __g.scene.isActive('Game') && __g.scene.getScene('Game').L.id === 'puntada'), '«Continuar» del panel abre el siguiente nivel pendiente (1-2)');
  await toca(338, 23); await toca(180, 474, 1200); await toca(28, 30, 1200);
  await toca(244, 570, 900); ok(await textoVisible('¿Eliminar partida?'), '«Borrar» pide confirmación');
  await tocaTexto('Eliminar', 2200);
  ok(await E(() => !Object.keys(Save.data.completados).length && Save.data.owned.aurora && Save.data.owned.cielo_completo), 'borrar partida quita el progreso pero conserva compras y capuchas');
  ok((await act()) === 'Title', 'tras borrar vuelve al título', await act());

  // IDIOMAS: Opciones → Idioma → English / Português / Español; todo el texto cambia y queda guardado
  await E(() => { __g.scene.getScenes(true).forEach(s => __g.scene.stop(s.scene.key)); __g.scene.start('Opciones', {}); }); await pg.waitForTimeout(900);
  await toca(145, 138, 900); ok(await textoVisible('Elige el idioma del juego'), 'la pestaña Idioma muestra los idiomas');
  await toca(180, 350, 900); ok(await E(() => Idioma.actual === 'en' && Save.data.idioma === 'en'), 'elegir English cambia el idioma y lo guarda');
  ok(await textoVisible('Choose the game language'), 'los textos cambian al inglés al momento');
  await toca(62, 138, 900); ok(await textoVisible('Music'), 'la pestaña General también sale en inglés');
  await toca(145, 138, 900); await toca(180, 414, 900); ok(await E(() => Idioma.actual === 'pt') && await textoVisible('Escolha o idioma do jogo'), 'Português funciona');
  await toca(180, 286, 900); ok(await E(() => Idioma.actual === 'es') && await textoVisible('Elige el idioma del juego'), 'volver a Español');

  fs.writeFileSync(OUT + '/menus_y_controles.json', JSON.stringify({ fallos, errores: errs, pasos: log }, null, 1));
  console.log(fallos.length ? `\n${fallos.length} FALLOS` : '\nTODO CORRECTO', errs.length ? `· errores de consola: ${errs.length}` : '· sin errores de consola');
  if (errs.length) console.log(errs.slice(0, 10));
  await b.close();
})();
