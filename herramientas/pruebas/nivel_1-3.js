// PRUEBA DEL 1-3 «El Bosque de Hilos»: se juega entero con las MISMAS entradas que un jugador (◀ ▶ ↑, carrete, aguja),
// a 60 Hz exactos. Los minijuegos se resuelven con sus propias funciones de toque (las mismas que llaman los dedos).
// Uso: node nivel_1-3.js <phaser.min.js | -> <carpeta del juego> <salida>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , PH, JUEGO, OUT] = process.argv; fs.mkdirSync(OUT + '/capturas', { recursive: true });
const URL = 'file://' + JUEGO + '/index.html';
const fallos = [];
const ok = (c, m, x) => { if (!c) fallos.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m + (x !== undefined ? ' ' + JSON.stringify(x) : '')); };
// mismas utilidades que recorrido_completo.js
const fuente = fs.readFileSync(__dirname + '/recorrido_completo.js', 'utf8');
const LIB = fuente.match(/const LIB = (\(\) => \{[\s\S]*?\n\};)/)[1].replace(/;$/, '');

const EXTRA = () => {
  const J = __J, S = J.S;
  // espera (con el juego andando y sin tocar nada) hasta que se cumpla cond o pasen max cuadros
  J.esperar = (cond, max = 600) => { for (let i = 0; i < max; i++) { if (cond()) return i; J.st(1); } return -1; };
  // salto hacia una x (unidades): mantiene ↑ «hold» cuadros y va hacia xt hasta llegar; acaba al volver a pisar suelo
  J.saltarA = (xt, hold = 16, max = 200) => { let dejo = false;
    for (let i = 0; i < max; i++) { const e = J.est(); if (i > 3 && !e.suelo) dejo = true; if (dejo && e.suelo) break;
      const dx = xt - e.x / 2; J.keys({ R: dx > 3, L: dx < -3, J: i < hold }); J.st(1); }
    J.keys(); J.st(4); return J.est(); };
  // resuelve el minijuego abierto con sus propias funciones de toque (sudoku, punto de cruz, laberinto)
  J.resolver = () => { const s = S(), M = s.mini; if (!M) return false;
    if (M.A.tipo === 'sudoku') M.solucionLista().forEach(([i, v]) => { M.elegir(i); M.poner(v); });
    else if (M.A.tipo === 'picross') M.solucionLista().forEach(i => M.tocar(i));
    else if (M.A.tipo === 'laberinto') M.solucion.slice(1).forEach(c => M.paso(c));
    J.st(150); return !s.mini; };
  J.movil = i => { const m = S().moviles[i]; return { x: Math.round(m.o.body.x / 2), top: Math.round(m.o.body.y / 2) }; };
  // pelea con una criatura concreta: se acerca, se aparta de los avisos y golpea cuando puede
  J.pelearCon = (idx, max = 1500) => { for (let i = 0; i < max; i++) { const s = S(), e = s.criaturas[idx]; if (!e.vivo) break;
      const d = (e.o.x - s.player.x) / 2, tipo = e.c.tipo; let k = {};
      if (tipo === 'lobo') {   // a 50–72 de distancia la aguja llega y la mordida no: se queda ahí y golpea
        const ad = Math.abs(d);
        if ((e.estado === 'aviso' || e.estado === 'embestida') && ad < 56) k = d > 0 ? { L: true } : { R: true };
        else if (ad > 72) { if (e.estado === 'patrulla' || e.estado === 'descanso') k = d > 0 ? { R: true } : { L: true }; }
        else if (ad < 50 && e.estado !== 'descanso') k = d > 0 ? { L: true } : { R: true };
        else if (s.time.now > s.attackUntil + 150) { s.facing = Math.sign(d) || 1; k = { N: true }; } }
      else if (tipo === 'arana') {   // atraerla (pasar por debajo), apartarse durante el aviso y golpearla cuando está abajo
        const lado = Math.sign(-d) || -1;
        if (e.estado === 'abajo') { if (Math.abs(d) > 52) k = d > 0 ? { R: true } : { L: true }; else if (s.time.now > s.attackUntil + 150) { s.facing = Math.sign(d) || 1; k = { N: true }; } }
        else if (e.estado === 'aviso' || e.estado === 'bajar') { if (Math.abs(d) < 44) k = lado > 0 ? { R: true } : { L: true }; }
        else if (e.estado === 'colgar' && s.time.now > (e.calma || 0)) { if (Math.abs(d) > 26) k = d > 0 ? { R: true } : { L: true }; }
        else if (Math.abs(d) < 44) k = lado > 0 ? { R: true } : { L: true }; }
      else {   // murciélago: esperar en un sitio fijo (lejos de los alfileres) y golpear cuando baja en picada
        const dy = (e.o.y - s.player.body.center.y) / 2, quieto = 300;
        if (Math.abs(d) <= 56 && Math.abs(dy) <= 38 && s.time.now > s.attackUntil + 150) { s.facing = Math.sign(d) || 1; k = { N: true }; }
        else if (Math.abs(s.player.body.center.x / 2 - quieto) > 4) k = s.player.body.center.x / 2 < quieto ? { R: true } : { L: true }; }
      J.keys(k); J.st(1); J.keys(); }
    J.st(30); const s = S(); return { vivo: s.criaturas[idx].vivo, corazones: s.hearts, x: J.est().x, pie: J.est().pie }; };
};

(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|WebGL/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  if (PH !== '-') await pg.route('**/phaser.min.js', r => r.fulfill({ path: PH, contentType: 'application/javascript' }));
  await pg.goto(URL); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { __g.scene.getScenes(true).forEach(s => s.scene.key !== 'Game' && __g.scene.stop(s.scene.key)); __g.scene.start('Game', { level: 'bosque' }); });
  await pg.waitForTimeout(1500);
  await pg.evaluate(`(${LIB})()`); await pg.evaluate(EXTRA);
  const E = f => pg.evaluate(f);
  const foto = async n => { await E(() => __J.dibuja()); await pg.screenshot({ path: `${OUT}/capturas/${n}.png` }); };
  await E(() => { __J.dormir(); __J.st(150); });
  let e = await E(() => __J.est()), i = await E(() => __J.info());
  ok(i.nivel === 'bosque', 'abre el 1-3 El Bosque de Hilos'); ok(i.texturasFaltantes === 0, 'todas las texturas existen', i.texturasFaltantes);
  const U = o => ({ x: Math.round(o.x / 2), pie: Math.round(o.pie / 2), suelo: o.suelo, puente: o.puente });
  const P = async f => U(await E(f));
  ok(e.suelo && Math.round(e.pie / 2) === 3000, 'Lumi aparece de pie en la isla de inicio', U(e));
  await foto('01_inicio');
  const snap = () => E(() => { const s = __J.S(); return { corazones: s.hearts, vivos: s.criaturas.map(c => c.vivo ? 1 : 0).join(''), enl: s.L.links.map(l => l.done ? 1 : 0).join(''),
    mision: s.quest.tasks.map(t => t.n).join(''), mini: !!s.mini, control: s.control && s.control.x, corazonSecreto: s.collected.heart, cristal: s.collected.crystal,
    descosidos: s.descosidos.map(d => d.estado[0]).join(''), m0: __J.movil(0), m1: __J.movil(1) }; });
  // [nombre, acción en el juego, comprobación(r = resultado en unidades, z = estado), captura]
  const pasos = [
    ['camina hasta los alfileres', () => __J.ir(240), (r, z) => r.pie === 3000 && z.corazones === 5],
    ['salta los alfileres hasta el primer tablón', () => __J.saltarA(220), (r, z) => r.pie === 2945 && z.corazones === 5],
    ['tablón que se descose 1', () => __J.saltarA(152), (r, z) => r.pie === 2885, '02_tablon_descose'],
    ['tablón que se descose 2 (el 1 ya tiembla)', () => __J.saltarA(222), (r, z) => r.pie > 2805 && r.pie <= 2826 && z.descosidos[0] !== 'f'],
    ['tablón que se descose 3', () => __J.saltarA(152), (r, z) => r.pie === 2765],
    ['llega a la isla de la grieta', () => __J.saltarA(90, 6), (r, z) => r.pie === 2720],
    ['los tablones se vuelven a coser a los 3 s', () => { __J.st(200); return __J.est(); }, (r, z) => z.descosidos === 'fff'],
    ['cose la gran grieta (puente pintado)', () => { __J.ir(200); __J.pulsar('T'); __J.st(90); return __J.est(); }, (r, z) => z.enl[0] === '1' && z.mision[0] === '1', '03_grieta_cosida'],
    ['cruza el puente', () => __J.ir(600), (r, z) => r.pie === 2720 && r.x > 280],
    ['sube al tablón que va y viene', () => { __J.esperar(() => __J.movil(0).x >= 272, 600); return __J.saltarA(300); }, (r, z) => r.pie === 2660, '04_tablon_movil'],
    ['SECRETO: el corazón solo se alcanza desde el tablón móvil', () => { __J.esperar(() => __J.movil(0).x >= 276, 600); const e = __J.saltarA(330, 16); return e; }, (r, z) => z.corazonSecreto],
    ['vuelve a subir al tablón móvil', () => { __J.st(40); if (__J.est().pie / 2 > 2700) { __J.esperar(() => __J.movil(0).x >= 272, 600); __J.saltarA(300); } return __J.est(); }, (r, z) => r.pie === 2660],
    ['el tablón lleva a Lumi hacia la izquierda', () => {   // Lumi se coloca en el centro del tablón y se deja llevar
        for (let k = 0; k < 600 && __J.movil(0).x > 162; k++) { const c = __J.movil(0).x + 30, dx = c - __J.est().x / 2; __J.keys({ R: dx > 6, L: dx < -6 }); __J.st(1); }
        __J.keys(); return __J.est(); }, (r, z) => r.pie === 2660 && r.x < 200],
    ['salta a la isla de la caja: se abre «Une los hilos»', () => { __J.saltarA(60, 16); __J.ir(196); return __J.est(); }, (r, z) => r.pie === 2610 && z.mini],
    ['Une los hilos: tres colores unidos', () => { const M = __J.S().mini; Object.entries(M.solucion).slice(0, 3).forEach(([col, cam]) => { M.empezar(M.id(...cam[0])); cam.slice(1).forEach(q => M.paso(M.id(...q))); M.soltar(); }); __J.st(5); return __J.est(); }, (r, z) => z.mini, '05_une_los_hilos'],
    ['un hilo no puede cruzar otro', () => { const M = __J.S().mini, c = M.solucion.amarillo; M.empezar(M.id(...c[0])); M.paso(M.id(1, 1)); const r = { ...__J.est(), largo: M.caminos.amarillo.length }; M.soltar(); return r; }, (r, z) => r.largo === 1],
    ['unidos pero sin llenar: avisa', () => { const M = __J.S().mini, am = M.solucion.amarillo; M.empezar(M.id(...am[0])); am.slice(1).forEach(q => M.paso(M.id(...q))); M.soltar(); M.empezar(M.id(3, 4)); M.paso(M.id(4, 4)); M.soltar(); __J.st(5); const r = { ...__J.est(), msg: M.msg.text }; return r; }, (r, z) => /cruces libres/.test(r.msg) && z.mini, '05b_hilos_aviso'],
    ['Une los hilos resuelto (llena el tablero)', () => { const M = __J.S().mini; Object.entries(M.solucion).slice(3).forEach(([col, cam]) => { M.empezar(M.id(...cam[0])); cam.slice(1).forEach(q => M.paso(M.id(...q))); M.soltar(); }); __J.st(10); return __J.est(); }, (r, z) => z.mini, '05c_hilos_resuelto'],
    ['la caja suelta su premio', () => { __J.st(110); __J.st(30); __J.ir(190); __J.ir(200); return __J.est(); }, (r, z) => !z.mini && z.mision[1] === '1'],
    ['enciende el carrete de control', () => __J.ir(64), (r, z) => z.control === 32, '06_carrete_control'],
    ['sube al ascensor de tablón', () => { __J.ir(222); __J.esperar(() => __J.movil(1).top >= 2606, 700); return __J.saltarA(160, 6); }, (r, z) => z.m1.top > 2580],
    ['el ascensor sube a Lumi', () => { __J.esperar(() => __J.movil(1).top <= 2484, 700); return __J.est(); }, (r, z) => r.pie <= 2486],
    ['salta al tablón de la araña', () => __J.saltarA(238), (r, z) => r.pie === 2440, '07_arana'],
    ['remienda la araña 1 (atraerla, apartarse, golpear abajo)', () => __J.pelearCon(0), (r, z) => z.vivos[0] === '0' && z.mision[2] === '1'],
    ['sube al tablón del hilo con tiempo', () => { __J.st(60); return __J.saltarA(312); }, (r, z) => r.pie === 2380],
    ['cose el hilo con tiempo', () => { __J.ir(600); __J.pulsar('T'); __J.st(40); return __J.est(); }, (r, z) => z.enl[1] === '1', '08_hilo_con_tiempo'],
    ['cruza el hilo antes de que se descosa', () => __J.ir(270), (r, z) => r.pie === 2330],
    ['a los 6 s el hilo se descose', () => { __J.st(400); return __J.est(); }, (r, z) => z.enl[1] === '0'],
    ['el bastidor de la isla abre «Punto de cruz» y se resuelve', () => { __J.ir(80); __J.st(30); const abierto = !!__J.S().mini; const ok = __J.resolver(); return { ...__J.est(), abierto, ok }; }, (r, z) => r.abierto && r.ok && z.mision[5] === '1', '08b_picross'],
    ['recoge la poción', () => { __J.st(30); __J.ir(40); __J.ir(60); return __J.est(); }, (r, z) => r.pie === 2330],
    ['sube por los tablones hasta la araña 2', () => { __J.ir(300); __J.saltarA(205); return __J.saltarA(268); }, (r, z) => r.pie === 2210],
    ['remienda la araña 2', () => __J.pelearCon(1), (r, z) => z.vivos[1] === '0' && z.mision[2] === '2'],
    ['llega a la isla del lobo: 2.º carrete de control', () => { __J.ir(530); __J.saltarA(222); return __J.saltarA(176, 10); }, (r, z) => r.pie === 2100 && z.control === 174, '09_isla_lobo'],
    ['remienda al lobo', () => __J.pelearCon(2), (r, z) => z.vivos[2] === '0'],
    ['el bastidor abre «Patrón de bordado»', () => { __J.ir(68); __J.st(60); return __J.est(); }, (r, z) => z.mini, '10_bordado_nube_ensena'],
    ['una puntada equivocada repite la ronda', () => { const M = __J.S().mini; __J.esperar(() => !M.mostrando, 900); M.tocar(M.secuencia[0] === 'recta' ? 'cruce' : 'recta'); __J.st(5); return { ...__J.est(), msg: M.msg.text, ronda: M.ronda }; }, (r, z) => /no era/.test(r.msg) && r.ronda === 0],
    ['ronda 1 bien: se borda un tercio de la flor', () => { const M = __J.S().mini; __J.esperar(() => !M.mostrando, 900); for (let k = 0; k < 3; k++) { M.tocar(M.secuencia[k]); __J.st(20); } __J.st(30); return { ...__J.est(), ronda: M.ronda }; }, (r, z) => r.ronda === 1, '11_bordado_ronda1'],
    ['rondas 2 y 3: flor bordada', () => { const M = __J.S().mini; for (const n of [4, 5]) { __J.esperar(() => !M.mostrando, 900); for (let k = 0; k < n; k++) { M.tocar(M.secuencia[k]); __J.st(20); } } __J.st(10); return { ...__J.est(), ronda: M.ronda }; }, (r, z) => r.ronda === 3, '12_bordado_flor'],
    ['el bastidor suelta un cristal', () => { __J.st(120); __J.ir(112); __J.st(20); return __J.est(); }, (r, z) => !z.mini && z.mision[3] === '1' && z.cristal],
    ['sube por la escalera de tablones a la arena', () => { __J.ir(110); __J.saltarA(55); __J.saltarA(95); return __J.saltarA(160, 10); }, (r, z) => r.pie === 1935, '13_arena'],
    ['la puerta no se abre con guardianes', () => { const s = __J.S(); s.tryWin(); return { ...__J.est(), mini: !!s.mini, ganado: s.won }; }, (r, z) => !r.mini && !r.ganado],
    ['remienda al lobo guardián', () => __J.pelearCon(3), (r, z) => z.vivos[3] === '0'],
    ['remienda al murciélago guardián', () => { if (__J.S().player.body.center.x / 2 < 220) { __J.ir(380); __J.saltarA(250); } return __J.pelearCon(4); }, (r, z) => z.vivos[4] === '0' && z.mision[4] === '1'],
    ['en la puerta se abre el Laberinto 8 × 8', () => { __J.ir(640); __J.st(30); const M = __J.S().mini; return { ...__J.est(), cols: M && M.cols, rows: M && M.rows }; }, (r, z) => z.mini && r.cols === 8 && r.rows === 8, '14_laberinto'],
    ['resuelve el laberinto y la puerta se abre', () => { const s = __J.S(), M = s.mini; M.solucion.slice(1).forEach(c => M.paso(c)); __J.st(120); return { ...__J.est(), abierta: s.acertijoResuelto }; }, (r, z) => r.abierta],
    ['cruza la puerta: nivel completado', () => { __J.keys({ L: true }); __J.st(10); __J.keys({ R: true }); __J.st(30); __J.keys(); __J.st(150); return __J.info(); }, (r, z) => r.ganado && r.misionCompleta, '15_completado'],
  ];
  for (const [n, f, chk, cap] of pasos) {
    let r = await E(f); if (r && r.pie !== undefined) r = { ...r, ...U(r) };
    const z = await snap();
    ok(chk(r, z), n, { ...(r.pie !== undefined ? { x: r.x, pie: r.pie } : {}), corazones: z.corazones, mision: z.mision, ...(r.msg ? { msg: r.msg } : {}) });
    if (cap) await foto(cap);
  }
  // sin corazones → Nube remienda a Lumi y vuelve al ÚLTIMO carrete de control encendido (no al principio)
  await E(() => { __J.S().scene.restart({ level: 'bosque' }); }); await E(() => __J.st(120));
  const rc = await E(() => { const s = __J.S(); s.control = { x: 174, y: 2075 }; s.hearts = 1; s.herirLumi(s.alfileres[0].falso); __J.st(90); const b = s.player.body; return { x: Math.round(b.center.x / 2), pie: Math.round(b.bottom / 2), corazones: s.hearts }; });
  ok(Math.abs(rc.x - 174) < 4 && Math.abs(rc.pie - 2100) < 3 && rc.corazones === 5, 'sin corazones vuelve al carrete de control con los corazones llenos', rc);
  // caer de un tablón que se descose no deja el «lugar seguro» encima de él
  const sg = await E(() => { const s = __J.S(); return s.solids.filter(z => z.noSafe).length; });
  ok(sg === 3, 'los 3 tablones que se descosen no sirven de lugar seguro', sg);
  const fin = await E(() => __J.info());
  ok(fin.texturasFaltantes === 0, 'ninguna textura falta al final', fin.texturasFaltantes);
  const guardado = await E(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /costuras/i.test(k)) || 'null')));
  ok(guardado && guardado.completados && guardado.completados['1-3'], 'el progreso del 1-3 queda guardado');
  ok(!errs.length, 'sin errores de consola', errs);
  console.log(fallos.length ? `FALLAN ${fallos.length}` : 'TODO CORRECTO');
  await b.close();
})();
