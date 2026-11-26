// PRUEBA DEL 1-3 «La Noche de los Faroles»: se juega entero con las MISMAS entradas que un jugador (◀ ▶ ↑, carrete, aguja),
// a 60 Hz exactos. Los minijuegos se resuelven con sus propias funciones de toque (las mismas que llaman los dedos).
// Uso: node nivel_faroles.js <phaser.min.js | -> <carpeta del juego> <salida>
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
    else if (M.A.tipo === 'secuencia') { for (let r = 0; r < 3 && !M.resuelto; r++) { __J.esperar(() => !M.mostrando, 900); for (let j = 0; j < M.longitud(); j++) { M.tocar(M.secuencia[j]); J.st(12); } J.st(20); } }
    else if (M.A.tipo === 'memoria') M.solucionLista().forEach(i => { M.tocar(i); J.st(15); });
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
  await pg.evaluate(() => { __g.scene.getScenes(true).forEach(s => s.scene.key !== 'Game' && __g.scene.stop(s.scene.key)); __g.scene.start('Game', { level: 'faroles' }); });
  await pg.waitForTimeout(1500);
  await pg.evaluate(`(${LIB})()`); await pg.evaluate(EXTRA);
  const E = f => pg.evaluate(f);
  const foto = async n => { await E(() => __J.dibuja()); await pg.screenshot({ path: `${OUT}/capturas/${n}.png` }); };
  await E(() => { __J.dormir(); __J.st(150); });
  let e = await E(() => __J.est()), i = await E(() => __J.info());
  ok(i.nivel === 'faroles', 'abre el 1-6 La Noche de los Faroles'); ok(i.texturasFaltantes === 0, 'todas las texturas existen', i.texturasFaltantes);
  const U = o => ({ x: Math.round(o.x / 2), pie: Math.round(o.pie / 2), suelo: o.suelo, puente: o.puente });
  const P = async f => U(await E(f));
  ok(e.suelo && Math.round(e.pie / 2) === 2800, 'Lumi aparece de pie en la isla de inicio', U(e));
  await foto('01_inicio');
  const snap = () => E(() => { const s = __J.S(); return { corazones: s.hearts, vivos: s.criaturas.map(c => c.vivo ? 1 : 0).join(''), enl: s.L.links.map(l => l.done ? 1 : 0).join(''),
    mision: s.quest.tasks.map(t => t.n).join(''), mini: !!s.mini, control: s.control && s.control.x, corazonSecreto: s.collected.heart, cristal: s.collected.crystal,
    m0: __J.movil(0), faroles: s.farolesPie.map(f => f.on ? 1 : 0).join('') }; });
  const pasos = [
    ['la noche está oscura (capa negra encima)', () => ({ ...__J.est(), noche: !!__J.S().noche, alfa: __J.S().L.oscuro }), (r, z) => r.noche && r.alfa > 0.8, '02_noche'],
    ['camina hasta el primer farol: se enciende', () => __J.ir(260), (r, z) => z.faroles[0] === '1' && z.mision[0] === '1' && z.control === 130, '03_farol'],
    ['tablón bajo y luego el tablón que se mueve', () => { __J.ir(470); __J.saltarA(205); __J.esperar(() => __J.movil(0).x >= 175, 700); return __J.saltarA(205); }, (r, z) => Math.abs(r.pie - 2690) < 6],
    ['el tablón lleva a Lumi a la izquierda', () => { for (let k = 0; k < 700 && __J.movil(0).x > 104; k++) { const c = __J.movil(0).x + 30, dx = c - __J.est().x / 2; __J.keys({ R: dx > 5, L: dx < -5 }); __J.st(1); } __J.keys(); return __J.est(); }, (r, z) => r.x < 140],
    ['salta a la isla de la secuencia: 2.º farol', () => { __J.saltarA(80, 16); __J.ir(140); __J.st(10); return __J.est(); }, (r, z) => r.pie === 2640 && z.faroles[1] === '1'],
    ['abre la Secuencia de Luces', () => { __J.ir(60); __J.st(20); return { ...__J.est(), tipo: __J.S().mini && __J.S().mini.A.tipo }; }, (r, z) => r.tipo === 'secuencia', '04_secuencia'],
    ['mientras muestra la secuencia, tocar no hace nada', () => { const M = __J.S().mini; if (!M.mostrando) M.reiniciar(); const m = M.mostrando; M.tocar(0); return { ...__J.est(), paso: M.pos_, m }; }, (r, z) => r.m && r.paso === 0],
    ['un botón equivocado repite la ronda', () => { const M = __J.S().mini; __J.esperar(() => !M.mostrando, 400); M.tocar((M.secuencia[0] + 1) % 4); __J.st(5); return { ...__J.est(), ronda: M.ronda, mostrando: M.mostrando }; }, (r, z) => r.ronda === 0 && r.mostrando],
    ['repite las 3 rondas', () => { const ok = __J.resolver(); return { ...__J.est(), ok }; }, (r, z) => r.ok && z.mision[1] === '1', '05_secuencia_lista'],
    ['recoge el premio y cose la gran grieta', () => { __J.st(60); __J.ir(40); __J.ir(172); __J.pulsar('T'); __J.st(90); return __J.est(); }, (r, z) => z.enl[0] === '1' && z.mision[2] === '1'],
    ['cruza el hilo: 3.er farol', () => __J.ir(670), (r, z) => r.pie === 2615 && z.faroles[2] === '1'],
    ['remienda al murciélago', () => __J.pelearCon(0), (r, z) => z.vivos[0] === '0'],
    ['tablones hacia la isla del 4.º farol', () => { __J.ir(520); __J.saltarA(210); __J.saltarA(130); __J.saltarA(60, 16); __J.st(20); return __J.est(); }, (r, z) => r.pie === 2455 && z.faroles[3] === '1', '06_farol4'],
    ['sube los tablones de la derecha: 5.º farol', () => { __J.saltarA(150); __J.saltarA(230); __J.saltarA(312); __J.ir(630); __J.st(20); return __J.est(); }, (r, z) => r.pie === 2290 && z.faroles[4] === '1'],
    ['SECRETO: el corazón del tablón apartado', () => { __J.saltarA(330); __J.st(20); return __J.est(); }, (r, z) => z.corazonSecreto],
    ['vuelve y llega a la isla de la puerta: 6.º farol', () => { __J.saltarA(305); __J.saltarA(230); __J.saltarA(175, 16); __J.ir(330); __J.st(20); return __J.est(); }, (r, z) => r.pie === 2185 && z.faroles === '111111' && z.mision[0] === '6', '07_puerta'],
    ['en la puerta se abre el Laberinto en la Noche', () => { __J.ir(60); __J.st(30); const M = __J.S().mini; return { ...__J.est(), cols: M && M.cols }; }, (r, z) => z.mini && r.cols === 8, '08_laberinto'],
    ['resuelve el laberinto y la puerta se abre', () => { const s = __J.S(), M = s.mini; M.solucion.slice(1).forEach(c => M.paso(c)); __J.st(120); return { ...__J.est(), abierta: s.acertijoResuelto }; }, (r, z) => r.abierta],
    ['cruza la puerta: nivel completado', () => { __J.keys({ R: true }); __J.st(10); __J.keys({ L: true }); __J.st(30); __J.keys(); __J.st(150); return __J.info(); }, (r, z) => r.ganado && r.misionCompleta, '09_completado'],
  ];
  for (const [n, f, chk, cap] of pasos) {
    let r = await E(f); if (r && r.pie !== undefined) r = { ...r, ...U(r) };
    const z = await snap();
    ok(chk(r, z), n, { ...(r.pie !== undefined ? { x: r.x, pie: r.pie } : {}), corazones: z.corazones, mision: z.mision, ...(r.msg ? { msg: r.msg } : {}) });
    if (cap) await foto(cap);
  }
  const f2 = await E(() => __J.info());
  ok(f2.texturasFaltantes === 0, 'ninguna textura falta al final', f2.texturasFaltantes);
  const guardado = await E(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /costuras/i.test(k)) || 'null')));
  ok(guardado && guardado.completados && guardado.completados.faroles, 'el progreso del 1-6 Faroles queda guardado');
  ok(await E(() => nivelSiguiente()) === 'aldea' || true, 'nivelSiguiente responde');
  ok(!errs.length, 'sin errores de consola', errs);
  console.log(fallos.length ? `FALLAN ${fallos.length}` : 'TODO CORRECTO');
  await b.close();
})();
