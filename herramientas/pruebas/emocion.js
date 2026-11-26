// EMOCIÓN: reloj y estrellas, acertijos contra reloj y «el cielo se descose» (1-3).
// Uso: node emocion.js <phaser.min.js | -> <carpeta del juego> <carpeta de salida>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , PH, JUEGO, OUT] = process.argv; fs.mkdirSync(OUT + '/capturas', { recursive: true });
const URL = 'file://' + JUEGO + '/index.html';
const fallos = [];
const ok = (c, m, x) => { if (!c) fallos.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); };
const fuente = fs.readFileSync(__dirname + '/recorrido_completo.js', 'utf8');
const LIB = fuente.match(/const LIB = (\(\) => \{[\s\S]*?\n\};)/)[1].replace(/;$/, '');

(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|WebGL/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  if (PH !== '-') await pg.route('**/phaser.min.js', r => r.fulfill({ path: PH, contentType: 'application/javascript' }));
  await pg.goto(URL); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(2500);
  const E = f => pg.evaluate(f);
  const abrir = async lv => { await pg.evaluate(lv => { __g.scene.getScenes(true).forEach(s => s.scene.key !== 'Game' && __g.scene.stop(s.scene.key)); __g.scene.start('Game', { level: lv }); }, lv);
    await pg.waitForTimeout(1500); await E(`(${LIB})()`); await E(() => { __J.dormir(); __J.st(60); }); };
  const foto = async n => { await E(() => __J.dibuja()); await pg.screenshot({ path: `${OUT}/capturas/${n}.png` }); };
  await abrir('bosque');

  console.log('— Reloj y estrellas');
  let r = await E(() => { const s = __J.S(), t0 = s.reloj; __J.st(120); return { avanza: Math.round(s.reloj - t0), txt: s.relojTxt.text, tiempos: s.tiempos }; });
  ok(Math.abs(r.avanza - 2000) < 20, 'el reloj cuenta el tiempo de juego (120 cuadros ≈ 2 s)', r);
  r = await E(() => { const s = __J.S(); s.togglePause(); const t0 = s.reloj; __J.st(60); const d = s.reloj - t0; s.togglePause(); __J.st(2); return Math.round(d); });
  ok(r === 0, 'en pausa el reloj no avanza', r);
  r = await E(() => { const s = __J.S(), kv = 'a/ui/estrella_vacia', vac = () => s.relojEst.map(o => o.texture.key === kv ? 0 : 1).join('');
    const a = vac(); s.reloj = (s.tiempos[0] + 1) * 1000; __J.st(1); const b = vac(); s.reloj = (s.tiempos[1] + 1) * 1000; __J.st(1); const c = vac();
    const e = [s.estrellasPor(s.tiempos[0] * 1000 - 1), s.estrellasPor(s.tiempos[1] * 1000 - 1), s.estrellasPor(s.tiempos[1] * 1000 + 1)];
    s.reloj = 30000; s.relojPerdidas = -1; __J.st(1); return { a, b, c, e }; });
  ok(r.a === '111' && r.b === '110' && r.c === '100', 'las estrellitas del reloj se apagan al pasar cada tiempo', r);
  ok(r.e.join() === '3,2,1', '★★★ / ★★ / ★ según el tiempo', r.e);
  await foto('01_reloj');

  console.log('— Acertijos contra reloj');
  r = await E(() => { const s = __J.S(), A = s.L.acertijos.find(a => a.tipo === 'picross'); const m0 = s.coinsGot;
    s.minijuego({ ...A, id: 'prueba_rapida' }, null, null, 60); __J.st(30); const M = s.mini, txt = M.relojTxt.text;
    M.solucionLista().forEach(i => M.tocar(i)); const msg = M.msg.text; __J.st(80);
    return { txt, msg, monedas: s.coinsGot - m0, cristales: s.cristalesExtra, cerrado: !s.mini }; });
  ok(r.txt === '1:00' || r.txt === '0:60' || r.txt === '0:59', 'el acertijo muestra su cuenta atrás', r.txt);
  ok(r.monedas === 10 && r.cristales === 1, 'resuelto en menos de la mitad: +10 monedas y +1 cristal', r);
  r = await E(() => { const s = __J.S(), A = s.L.acertijos.find(a => a.tipo === 'picross'); const m0 = s.coinsGot, c0 = s.cristalesExtra;
    const h0 = s.hearts; s.minijuego({ ...A, id: 'prueba_tarde' }, null, null, 2); __J.st(150); const M = s.mini, sub = M.relojSub.text, h1 = s.hearts, txt = M.relojTxt.text;
    M.solucionLista().forEach(i => M.tocar(i)); __J.st(80); return { sub, h0, h1, txt, monedas: s.coinsGot - m0, cristales: s.cristalesExtra - c0 }; });
  ok(r.h1 === r.h0, 'si el tiempo del acertijo se acaba no se pierde vida', r);
  ok(r.txt.startsWith('+') && r.sub.includes('★'), 'el reloj sigue contando (+) y avisa −1 ★', r);
  ok(r.monedas === 0 && r.cristales === 0, 'pasado el tiempo: sin premio extra al resolverlo', r);
  r = await E(() => { const s = __J.S(); return { est: s.estrellasPor(1000), vencidos: Object.keys(s.acertVencidos).length }; });
  ok(r.vencidos === 1 && r.est === 2, 'un acertijo pasado de tiempo quita 1 ★ al nivel (3 → 2)', r);
  await E(() => { __J.S().acertVencidos = {}; });
  r = await E(() => { const s = __J.S(), A = s.L.acertijos.find(a => a.tipo === 'picross');
    s.minijuego({ ...A, id: 'prueba_cierra' }, null, null, 60); __J.st(120); s.mini.cerrar(); __J.st(5);
    s.minijuego({ ...A, id: 'prueba_cierra' }, null, null, 60); __J.st(1); const t = s.mini.relojTxt.text; s.mini.cerrar(); __J.st(5); return t; });
  ok(r === '0:58', 'cerrar y volver a abrir no reinicia el tiempo del acertijo', r);

  console.log('— El cielo se descose (1-3)');
  r = await E(() => { const s = __J.S(), Dz = s.descose; return { hay: !!Dz, estado: Dz && Dz.estado, c: Dz && Dz.c }; });
  ok(r.hay && r.estado === 'espera', 'el 1-3 tiene un tramo que se descose, en espera al empezar', r);
  r = await E(() => { const s = __J.S(), p = s.player, Dz = s.descose; s.control = null; s.spots.forEach(sp => { sp.resuelto = true; });   // sin abrir acertijos al caer
    p.body.reset(p.x, (Dz.c.desde - 20) * 2 - 30); s.invulHasta = 0; __J.st(3);
    const e1 = Dz.estado, f1 = Dz.front; __J.st(60); const f2 = Dz.front; return { e1, f1: Math.round(f1), f2: Math.round(f2), pie: Math.round(p.body.bottom / 2) }; });
  ok(r.e1 === 'activo' && r.f2 < r.f1, 'al subir del inicio del tramo los hilos se sueltan y suben', r);
  await foto('02_descose');
  r = await E(() => { const s = __J.S(), Dz = s.descose, h0 = s.hearts; let i = 0;
    for (; i < 1200 && Dz.estado === 'activo'; i++) { s.player.body.setVelocity(0, 0); __J.st(1); }
    __J.st(5); return { cuadros: i, corazones: h0 - s.hearts, estado: Dz.estado, pie: Math.round(s.player.body.bottom / 2), inicio: Dz.inicio && Math.round(Dz.inicio.y / 2 + 25) }; });
  ok(r.corazones === 1 && r.estado === 'espera', 'si los hilos alcanzan a Lumi: −1 corazón', r);
  ok(r.inicio && Math.abs(r.pie - r.inicio) < 30, 'y vuelve a donde empezó el tramo (no al principio del nivel)', r);
  r = await E(() => { const s = __J.S(), p = s.player, Dz = s.descose;
    p.body.reset(p.x, (Dz.c.desde - 20) * 2 - 30); __J.st(3); const a = Dz.estado;
    const C2 = s.L.controles[1]; p.body.reset(C2.x * 2, (C2.y - 30) * 2); __J.st(40); return { a, b: Dz.estado, pie: Math.round(p.body.bottom / 2), hablando: s.talking, mini: !!s.mini }; });
  ok(r.a === 'activo' && r.b === 'fin', 'al llegar arriba del tramo los hilos se calman', r);

  console.log('— Panel de resultados');
  r = await E(() => { const s = __J.S(); s.reloj = (s.tiempos[0] - 5) * 1000; const mon0 = Save.data.monedas || 0, got = s.coinsGot;
    s.won = true; s.showWin(); __J.st(90);
    return { est: Save.data.estrellas[s.L.key], mejor: Save.data.mejorTiempo[s.L.key], bono: (Save.data.monedas || 0) - mon0 - got,
      rapidos: Save.data.rapidos, textos: s.children.list.filter(o => o.type === 'Text' && o.visible).map(o => o.text).filter(t => /Tiempo|estrella|Monedas/.test(t)) }; });
  ok(r.est === 3 && r.bono === 30, 'termina rápido: ★★★ guardadas y +30 monedas por estrellas nuevas', r);
  ok(r.textos.some(t => t.includes('Nuevo récord')), 'el panel muestra el tiempo y el récord', r.textos);
  ok(r.rapidos && r.rapidos['1-3:prueba_rapida'] === 2, 'los premios rápidos quedan guardados (no se repiten)', r.rapidos);
  await foto('03_resultados');
  ok(errs.length === 0, 'sin errores de consola', errs);
  await b.close();
  console.log(fallos.length ? `\n${fallos.length} FALLOS` : '\nTODO BIEN'); process.exit(fallos.length ? 1 : 0);
})();
