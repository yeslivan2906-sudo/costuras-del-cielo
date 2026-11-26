// PRUEBA DE JUEGO COMPLETO (Costuras del Cielo). Juega los dos niveles del Capítulo I con las MISMAS entradas que un
// jugador (teclas/botones ◀ ▶ ↑, carrete, hablar; nada de teletransportes) a 60 Hz exactos, desde la pantalla de título:
//   Título → «Nueva partida» → 1-1 La Aldea Inicial: hablar con Tilo · subir repisas · carrete · cristal · coser el
//   puente (diálogo «Reparar») · cruzar · puerta → «Siguiente nivel» → 1-2 La primera puntada: repisas · coser la
//   grieta con energía · puente de hilo · subir · coser el rincón secreto · cristal y corazón · puerta → guardado.
// Comprueba en cada paso posición, suelo, objetos, misión, energía, monedas y errores, y hace capturas.
// Uso: node recorrido_completo.js <phaser.min.js> <carpeta del juego> <salida>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , PH, JUEGO, OUT] = process.argv; fs.mkdirSync(OUT + '/capturas', { recursive: true });
const URL = 'file://' + JUEGO + '/index.html';
const log = [], fallos = [];
const cerca = (v, o, tol = 4) => Math.abs(v - o) <= tol;
const ok = (cond, msg, extra) => { log.push({ ok: !!cond, msg, ...(extra ? { datos: extra } : {}) }); if (!cond) fallos.push(msg); console.log((cond ? '  ✓ ' : '  ✗ ') + msg + (extra ? ' ' + JSON.stringify(extra) : '')); };

const LIB = () => {
  const g = __g; let T = performance.now();
  const S = () => g.scene.getScene('Game');
  // Phaser mide el tiempo de los tweens con el reloj real (Date.now); en la prueba el juego avanza cuadro a cuadro más
  // rápido que el reloj, así que los tweens de la escena se atan al mismo paso de 16,667 ms (solo en la prueba).
  const atar = s => { if (s && !s.tweens.__fijo) { s.tweens.__fijo = true; s.tweens.getDelta = () => 16.667; } };
  const st = n => { for (let i = 0; i < n; i++) { const s = S(); atar(s); if (s && s.talking && s.talkNext && !s.telar && !s.mini) { s.talkNext(); if (s.talkNext && !s.telar && !s.mini) s.talkNext(); }
    T += 16.667; g.loop.now = T; g.loop.delta = 16.667; g.loop.rawDelta = 16.667; g.headlessStep(T, 16.667); } };
  const keys = (i = {}) => { const s = S(); s.cursors.left.isDown = !!i.L; s.cursors.right.isDown = !!i.R; s.cursors.up.isDown = !!i.J;
    s.keys.E.isDown = !!i.T; s.keys.F.isDown = !!i.I; s.keys.X.isDown = !!i.N; };
  const est = () => { const s = S(), b = s.player.body; return { x: Math.round(b.center.x), pie: Math.round(b.bottom), suelo: !!(b.blocked.down || b.touching.down || s.onBridge), puente: !!s.onBridge }; };
  const ir = (x, max = 900) => { const d = Math.sign(x - S().player.body.center.x);
    for (let i = 0; i < max; i++) { if ((S().player.body.center.x - x) * d >= 0) break; keys({ R: d > 0, L: d < 0 }); st(1); }
    keys(); st(12); return est(); };
  // salto: dir -1/0/1, mantiene ↑ «hold» cuadros (altura variable), sigue en «dir» hasta volver a pisar suelo
  const saltar = (dir, hold = 16, max = 200, soltarDir = 999) => { let dejo = false;
    for (let i = 0; i < max; i++) { const e = est(); if (i > 3 && !e.suelo) dejo = true; if (dejo && e.suelo) break;
      keys({ R: dir > 0 && i < soltarDir, L: dir < 0 && i < soltarDir, J: i < hold }); st(1); }
    keys(); st(10); return est(); };
  // combate: se acerca, retrocede ante el aviso/embestida y golpea con la aguja mientras el lobo descansa
  const pelear = (max = 900) => { for (let i = 0; i < max; i++) { const s = S(), e = s.criaturas.find(c => c.vivo); if (!e) break;
      const d = (e.o.x - s.player.x) / 2; let k = {};
      if (e.estado === 'aviso' || e.estado === 'embestida') k = { L: d < 90 }; else if (d > 52) k = { R: true }; else if (d > 0 && s.time.now > s.attackUntil + 150) k = { N: true };
      keys(k); st(1); keys(); }
    st(30); const s = S(); return { vivos: s.criaturas.filter(c => c.vivo).length, corazones: s.hearts }; };
  const telar = () => { const s = S(); if (!s.telar) return false; s.L.acertijo.orden.forEach(k => s.tocarTelar(k)); s.resolverTelar(); st(120); return !s.telar && s.acertijoResuelto; };
  const pulsar = (k, n = 2) => { keys({ [k]: true }); st(n); keys(); st(2); };
  const botonPanel = txt => { const s = S(); const t = s.children.list.find(o => o.type === 'Text' && o.text === txt && o.visible);
    if (!t) return false; const z = s.children.list.filter(o => o.type === 'Zone' && o.input && Math.abs(o.x - t.x) < o.width / 2 && Math.abs(o.y - t.y) < o.height / 2).sort((a, b) => a.width * a.height - b.width * b.height)[0];   // el botón (zona) que contiene el texto
    if (!z) return false; z.emit('pointerdown'); return true; };
  const info = () => { const s = S(); return { nivel: s.L.id, monedas: s.coinsGot, hojas: s.leaves, carretes: s.spools, cristal: s.collected.crystal, corazon: s.collected.heart,
    corazones: s.hearts + '/' + s.maxHearts, energia: Math.round(s.thread), enlaces: s.L.links.map(l => l.done), mision: s.quest.tasks.map(t => t.id + ':' + t.n + '/' + t.of),
    misionCompleta: !!s.quest.complete, ganado: s.won, hablando: s.talking, pausa: s.paused,
    texturasFaltantes: s.children.list.filter(o => o.texture && o.texture.key === '__MISSING').length }; };
  const dibuja = () => { const s = S(), c = s.cameras.main; c.startFollow(s.player, true, 1, 1, 0, 120); const dl = g.loop.delta; g.loop.delta = 0; s.updateParallax();
    g.renderer.preRender(); s.sys.render(g.renderer); g.renderer.postRender(); g.renderer.preRender(); s.sys.render(g.renderer); g.renderer.postRender(); g.loop.delta = dl; c.startFollow(s.player, true, 0.12, 0.12, 0, 120); };
  window.__J = { S, st, keys, est, ir, saltar, pulsar, pelear, telar, botonPanel, info, dibuja, dormir: () => g.loop.sleep(), despertar: () => g.loop.wake() };
};

(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|WebGL/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  if (PH !== '-') await pg.route('**/phaser.min.js', r => r.fulfill({ path: PH, contentType: 'application/javascript' }));
  await pg.goto(URL); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3000);
  const foto = async n => { await pg.evaluate(() => __J.dibuja()); await pg.screenshot({ path: `${OUT}/capturas/${n}.png` }); };
  const E = f => pg.evaluate(f);

  console.log('TÍTULO');
  ok(await E(() => __g.scene.isActive('Title')), 'la pantalla de título carga');
  await pg.screenshot({ path: `${OUT}/capturas/00_titulo.png` });
  await pg.mouse.click(356, 772);                        // «Nueva partida» pintado en la ilustración
  await pg.waitForTimeout(2500);
  ok(await E(() => __g.scene.isActive('Game') && __g.scene.getScene('Game').L.id === 'aldea'), 'Nueva partida abre 1-1 La Aldea Inicial');
  await E(LIB); await E(() => { __J.dormir(); __J.st(200); });
  ok((await E(() => __J.est())).suelo, 'Lumi aparece de pie en G1', await E(() => __J.est()));

  console.log('1-1 · ALDEA');
  let e = await E(() => __J.ir(690));
  ok(await E(() => !!__J.S().nearNpc() && __J.S().actBtn.visible), 'junto a Tilo aparece el botón «Hablar»', e);
  await E(() => __J.pulsar('I')); await E(() => __J.st(400));
  let i = await E(() => __J.info());
  ok(i.mision[0] === 'tilo:1/1', 'hablar con Tilo cumple la tarea 1 de la misión', i.mision);
  await foto('01_aldea_G1_tilo');
  e = await E(() => __J.ir(1015)); e = await E(() => __J.saltar(1, 16));
  ok(cerca(e.pie, 1080), 'salto de G1 a la repisa 1 (tablón A)', e);
  e = await E(() => __J.ir(1185)); e = await E(() => __J.saltar(1, 16));
  ok(cerca(e.pie, 960), 'salto a la repisa 2 (tablón B)', e);
  e = await E(() => __J.ir(1360)); e = await E(() => __J.saltar(1, 16));
  ok(cerca(e.pie, 880) && e.x > 1400, 'salto a la isla G2 (mercado)', e);
  await foto('02_aldea_G2_mercado');
  e = await E(() => __J.ir(1470)); e = await E(() => __J.saltar(1, 20, 200, 26));
  ok(cerca(e.pie, 760), 'salto a la repisa 3', e);
  i = await E(() => __J.info());
  ok(i.carretes === 1 && i.mision[1] === 'hilo:1/1', 'se recoge el carrete de hilo dorado (tarea 2)', { carretes: i.carretes, mision: i.mision });
  e = await E(() => __J.ir(1630)); e = await E(() => __J.saltar(1, 20, 200, 22));
  ok(cerca(e.pie, 640), 'salto a la repisa 4', e);
  i = await E(() => __J.info());
  ok(i.cristal, 'se recoge el cristal secreto de la repisa 4', i.cristal);
  await foto('03_aldea_repisa4_cristal');
  e = await E(() => __J.ir(1660)); await E(() => __J.st(60)); e = await E(() => __J.ir(1770));
  ok(cerca(e.pie, 880), 'bajada a G2 junto al anclaje del puente', e);
  // el puente aún no está cosido: no se puede cruzar (se cae y Nube lo devuelve a un lugar seguro)
  await E(() => __J.pulsar('T', 2));
  ok(await E(() => __J.S().paused && !!__J.S().children.list.find(o => o.type === 'Text' && o.text === 'Reparar con Hilo Dorado')), 'el botón del carrete abre «Reparar con Hilo Dorado»');
  await foto('04_aldea_dialogo_reparar');
  ok(await E(() => __J.botonPanel('Reparar')), 'botón «Reparar» pulsado');
  await E(() => __J.st(500));
  i = await E(() => __J.info());
  ok(i.enlaces[0] && i.carretes === 0, 'el puente queda cosido y se gasta el carrete', { enlaces: i.enlaces, carretes: i.carretes });
  ok(await E(() => __J.S().puente && __J.S().puente.estado === 'reparado'), 'la imagen del puente pasa a «reparado»');
  ok(i.mision.every(t => t.endsWith('1/1')) && i.misionCompleta, 'misión «El Hilo Perdido» completada', i.mision);
  ok(await E(() => __J.S().restorables.filter(r => r.grp === 'main').every(r => r.done)), 'G3 (isla, casa, faroles, decoración) se restaura al coser');
  e = await E(() => __J.ir(2000));
  ok(e.puente, 'Lumi camina sobre el puente', e);
  await foto('05_aldea_cruzando_puente');
  e = await E(() => __J.ir(2300));
  ok(cerca(e.pie, 880) && e.x >= 2300, 'llega a G3 por el puente', e);
  await foto('06_aldea_G3_casa');
  const pel = await E(() => __J.pelear());
  ok(pel.vivos === 0 && pel.corazones > 0, 'remienda al lobo descosido con la aguja', pel);
  e = await E(() => __J.ir(2710)); await E(() => __J.st(20));
  ok(await E(() => !!__J.S().telar && !__J.S().won), 'la puerta sellada abre el Acertijo del Telar');
  ok(await E(() => __J.telar()), 'resuelve el telar (luna, sol, nube, hoja)');
  e = await E(() => __J.ir(2720)); await E(() => __J.st(120));
  i = await E(() => __J.info());
  ok(i.ganado, 'la puerta dorada termina el nivel', e);
  await foto('07_aldea_nivel_completado');
  const g1 = await E(() => ({ completados: Save.data.completados, misiones: Save.data.misiones, monedas: Save.data.monedas, cristales: Save.data.cristales, hojas: Save.data.hojas, secretos: Save.data.secretos }));
  ok(g1.completados['1-1'] && g1.misiones.hilo_perdido && g1.monedas > 0, 'el progreso de 1-1 queda guardado', g1);
  const persistido = await E(() => JSON.parse(localStorage.getItem('costuras_save_v1')).completados);
  ok(persistido && persistido['1-1'], 'el guardado está en el almacenamiento del navegador', persistido);

  console.log('1-2 · LA PRIMERA PUNTADA');
  ok(await E(() => __J.botonPanel('Siguiente nivel')), 'botón «Siguiente nivel»');
  await E(() => __J.st(120));
  ok(await E(() => __J.S().L.id === 'puntada'), 'se abre 1-2 La primera puntada');
  await E(() => __J.st(120));
  e = await E(() => __J.est()); ok(e.suelo && cerca(e.pie, 4640), 'Lumi aparece de pie en la isla inicial', e);
  await foto('10_puntada_inicio');
  // ZONA 1 · tablones de inicio
  e = await E(() => __J.ir(450)); e = await E(() => __J.saltar(0, 18));
  ok(cerca(e.pie, 4520), 'inicio: salta al primer tablón', e);
  e = await E(() => __J.ir(445)); e = await E(() => __J.saltar(-1, 18));
  ok(cerca(e.pie, 4400), 'inicio: segundo tablón', e);
  e = await E(() => __J.ir(320)); e = await E(() => __J.saltar(0, 18));
  ok(cerca(e.pie, 4280), 'inicio: tercer tablón', e);
  e = await E(() => __J.ir(240)); e = await E(() => __J.saltar(-1, 18));
  ok(cerca(e.pie, 4180), 'ZONA 2: llega a la isla A (la gran grieta)', e);
  // ZONA 2 · coser la gran grieta
  e = await E(() => __J.ir(200));
  i = await E(() => __J.info()); const energia0 = i.energia;
  await E(() => __J.pulsar('T', 2)); await E(() => __J.st(40)); i = await E(() => __J.info()); await E(() => __J.st(200));
  ok(i.enlaces[0] && i.energia < 100, 'el carrete cose la gran grieta gastando energía de hilo', { enlaces: i.enlaces, energiaAntes: energia0, energiaDespues: i.energia });
  ok(i.mision[0] === 'grieta:1/1', 'tarea «Cose la gran grieta»', i.mision);
  await foto('11_puntada_grieta_cosida');
  // el murciélago baja a por Lumi antes del puente (su combate completo: pruebas/murcielago.js)
  const rm = await E(() => { const s = __J.S(), b = s.criaturas.find(c => c.c.tipo === 'murcielago');
    for (let k = 0; k < 4 && b.vivo; k++) { b.estado = 'picada'; b.t = s.time.now; b.x = s.player.x / 2 + 26; b.y = s.player.body.center.y / 2; b.meta = { x: b.x, y: b.y }; s.invulHasta = s.time.now + 2000; __J.st(1); s.facing = 1; s.player.setFlipX(false); s.attackUntil = 0; s.attack(); __J.st(30); }
    __J.st(150); return { vivo: b.vivo, mision: s.quest.tasks[1].n }; });
  ok(rm.vivo === false && rm.mision === 1, 'remienda al murciélago con la aguja (tarea cumplida)', rm);
  e = await E(() => __J.ir(430));
  ok(e.puente, 'cruza por el puente de hilo', e);
  e = await E(() => __J.ir(560));
  ok(cerca(e.pie, 4180), 'llega a la isla B', e);
  e = await E(() => __J.ir(530)); e = await E(() => __J.saltar(-1, 18));
  ok(cerca(e.pie, 4060), 'zigzag: tablón 1', e);
  // camino secreto: coser el ancla del tablón con la del rincón escondido
  e = await E(() => __J.ir(400)); await E(() => __J.st(120));
  await E(() => __J.pulsar('T', 2)); await E(() => __J.st(240));
  i = await E(() => __J.info());
  ok(i.enlaces[1], 'cose el hilo del camino secreto', i.enlaces);
  e = await E(() => __J.ir(60, 1500));
  ok(cerca(e.pie, 3970), 'sube por el hilo al rincón secreto', e);
  ok(await E(() => !!__J.S().mini && __J.S().mini.A.tipo === 'reloj'), 'el reloj escondido abre «El Reloj Descosido»');
  await foto('12_reloj');
  ok(await E(() => { const M = __J.S().mini; M.comprobar(); return !M.resuelto && /hora/.test(M.msg.text); }), 'reloj: con la hora equivocada no se resuelve');
  await E(() => { const M = __J.S().mini; M.poner(3, 0); M.comprobar(); __J.st(120); });
  i = await E(() => __J.info());
  ok(i.mision[3] === 'reloj:1/1', 'reloj a las tres en punto: resuelto (tarea cumplida)', i.mision);
  await E(() => __J.st(60));
  i = await E(() => __J.info());
  ok(i.cristal && i.corazon, 'el reloj deja un cristal; en el rincón también hay un corazón', { cristal: i.cristal, corazon: i.corazon });
  e = await E(() => __J.ir(430, 1500)); await E(() => __J.st(30)); e = await E(() => __J.est());
  ok(cerca(e.pie, 4060), 'vuelve por el hilo al tablón', e);
  e = await E(() => __J.ir(500)); e = await E(() => __J.saltar(1, 18));
  ok(cerca(e.pie, 3940), 'zigzag: tablón 2', e);
  e = await E(() => __J.ir(545)); e = await E(() => __J.saltar(-1, 18));
  ok(cerca(e.pie, 3820), 'zigzag: tablón 3', e);
  e = await E(() => __J.ir(500)); e = await E(() => __J.saltar(1, 18));
  ok(cerca(e.pie, 3700), 'zigzag: tablón 4', e);
  e = await E(() => __J.ir(545)); e = await E(() => __J.saltar(-1, 18));
  ok(cerca(e.pie, 3600), 'llega a la isla C', e);
  // ZONA 4 · isla del lobo y cofre
  e = await E(() => __J.ir(470)); e = await E(() => __J.saltar(1, 18));
  ok(cerca(e.pie, 3480), 'tablón hacia la isla del lobo', e);
  // el lobo descansa mientras Lumi salta a su isla (su combate completo: pruebas/combate.js)
  e = await E(() => { const s = __J.S(), w = s.criaturas.find(c => c.c.tipo === 'lobo'); w.estado = 'descanso'; w.t = s.time.now + 5000; __J.ir(505); return __J.saltar(-1, 18); });
  ok(cerca(e.pie, 3380), 'ZONA 4: sube a la isla ancha del lobo', e);
  const rl = await E(() => { const s = __J.S(), w = s.criaturas.find(c => c.c.tipo === 'lobo');
    for (let k = 0; k < 5 && w.vivo; k++) { s.invulHasta = s.time.now + 2000; w.x = s.player.x / 2 - 30; w.estado = 'descanso'; w.t = s.time.now; __J.st(1); s.facing = -1; s.player.setFlipX(true); s.attackUntil = 0; s.attack(); __J.st(30); }
    __J.st(120); return { vivo: w.vivo }; });
  ok(rl.vivo === false, 'remienda al lobo con la aguja', rl);
  e = await E(() => __J.ir(60, 1500));
  ok(await E(() => !!__J.S().mini && __J.S().mini.A.tipo === 'rompecabezas'), 'el cofre abre el «Rompecabezas de Retazos»');
  await foto('13_rompecabezas');
  const pociones0 = await E(() => Save.data.pociones || 0); const mon0 = (await E(() => __J.info())).monedas;
  await E(() => { const M = __J.S().mini, o = M.orden(); for (let pos = 0; pos < 9; pos++) if (o[pos] !== pos) { const j = o.indexOf(pos); M.tocar(pos); M.tocar(j); } __J.st(150); });
  i = await E(() => __J.info());
  ok(i.mision[2] === 'cofre:1/1', 'rompecabezas completo: el cofre se abre (tarea cumplida)', i.mision);
  await E(() => { __J.st(80); __J.ir(24); __J.ir(100); }); i = await E(() => __J.info());
  ok((await E(() => Save.data.pociones || 0)) > pociones0 && i.monedas >= mon0 + 3, 'el cofre da una poción y 3 monedas', { pociones: await E(() => Save.data.pociones), monedas: [mon0, i.monedas] });
  // CIMA
  e = await E(() => __J.ir(450)); e = await E(() => __J.saltar(1, 18));
  ok(cerca(e.pie, 3260), 'cima: tablón 1', e);
  e = await E(() => __J.ir(485)); e = await E(() => __J.saltar(-1, 18));
  ok(cerca(e.pie, 3140), 'cima: tablón 2', e);
  e = await E(() => __J.ir(325)); e = await E(() => __J.saltar(-1, 18));
  ok(cerca(e.pie, 3020), 'cima: tablón 3', e);
  e = await E(() => __J.ir(275)); e = await E(() => __J.saltar(1, 18));
  ok(cerca(e.pie, 2920), 'llega a la cima (isla de la puerta)', e);
  // SUDOKU DE CARRETES (la caja de la cima): la puerta no deja pasar sin él
  e = await E(() => __J.ir(410)); await E(() => __J.st(20));
  ok(await E(() => !!__J.S().mini && __J.S().mini.A.tipo === 'sudoku'), 'la caja de la cima abre el «Sudoku de Carretes»');
  await foto('13b_sudoku');
  ok(await E(() => { const M = __J.S().mini; M.solucionLista().forEach(([i, v]) => { M.elegir(i); M.poner(v); }); __J.st(150); return !__J.S().mini; }), 'el sudoku se resuelve con los toques de la bandeja');
  await E(() => { __J.st(30); __J.ir(380); __J.ir(440); });
  e = await E(() => __J.ir(650)); await E(() => __J.st(10));
  ok(await E(() => !!__J.S().mini && __J.S().mini.A.tipo === 'laberinto' && !__J.S().won), 'la puerta sellada abre el «Laberinto del Hilo»');
  await foto('14_laberinto');
  ok(await E(() => { const M = __J.S().mini; const sol = M.solucion; let choca = false; const u = M.camino.at(-1); const otra = [1, M.cols].find(c => c !== sol[1]); M.paso(otra); choca = M.camino.length === 1; M.reiniciar(); return choca; }), 'laberinto: el hilo no atraviesa las costuras');
  await E(() => { const M = __J.S().mini; M.solucion.slice(1).forEach(c => M.paso(c)); __J.st(120); });
  ok(await E(() => __J.S().acertijoResuelto && !__J.S().mini), 'llevando el hilo hasta la aguja, la puerta pierde su sello');
  await E(() => __J.st(120));
  i = await E(() => __J.info());
  ok(i.ganado && i.misionCompleta, 'cruza la puerta y completa la misión (5 tareas)', { mision: i.mision });
  await foto('15_puntada_nivel_completado');
  const g2 = await E(() => ({ completados: Save.data.completados, secretos: Save.data.secretos, hojas: Save.data.hojas, cristales: Save.data.cristales, monedas: Save.data.monedas, owned: Save.data.owned }));
  ok(g2.completados['1-2'], 'progreso de 1-2 guardado', g2);
  ok(await E(() => __J.S().children.list.some(o => o.type === 'Text' && o.text === 'Siguiente nivel')), 'al terminar el 1-2 aparece «Siguiente nivel» (lleva al 1-3, probado en nivel_1-3.js)');

  // caída al vacío y vuelta a lugar seguro
  console.log('CAÍDAS');
  await E(() => __J.botonPanel('Repetir')); await E(() => __J.st(150));
  e = await E(() => { __J.S().player.body.reset(640, 4140); __J.st(60); return __J.est(); });
  const antes = e;
  const caida = await E(() => { for (let k = 0; k < 400; k++) { __J.keys({ R: true }); __J.st(1); if (__J.S().player.alpha < 1) break; } __J.keys(); __J.st(90); return __J.est(); });
  ok(caida.suelo && caida.pie <= 4640, 'al caer al vacío, Nube devuelve a Lumi a un lugar seguro', { antes, caida });

  const info = { fallos, errores: errs, pasos: log };
  fs.writeFileSync(OUT + '/recorrido_completo.json', JSON.stringify(info, null, 1));
  console.log(fallos.length ? `\n${fallos.length} FALLOS` : '\nTODO CORRECTO', errs.length ? `· errores de consola: ${errs.length}` : '· sin errores de consola');
  if (errs.length) console.log(errs.slice(0, 10));
  await b.close();
})();
