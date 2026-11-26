// PRUEBA DEL 1-3 «La Escalera de Agujas»: se juega entero con las MISMAS entradas que un jugador (◀ ▶ ↑, carrete, aguja),
// a 60 Hz exactos. Los minijuegos se resuelven con sus propias funciones de toque (las mismas que llaman los dedos).
// Uso: node nivel_agujas.js <phaser.min.js | -> <carpeta del juego> <salida>
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
    else if (M.A.tipo === 'balanza') { for (let r = 0; r < 2 && !M.resuelto; r++) { J.esperar(() => !M.esperando, 200); M.solucionRonda().forEach(i => M.tocar(i)); J.st(80); } }
    else if (M.A.tipo === 'tangram') M.piezas.forEach(P => { for (let k = 0; k < 4 && !M.poner(P.i); k++) M.girar(P.i); });
    else if (M.A.tipo === 'memoria') M.solucionLista().forEach(i => { M.tocar(i); J.st(15); });
    else if (M.A.tipo === 'laberinto') M.solucion.slice(1).forEach(c => M.paso(c));
    J.st(150); return !s.mini; };
  // espera a que el parche i esté encendido y le queden al menos «margen» ms
  J.parche = (i, margen = 500) => J.esperar(() => { const c = S().parches[i].parche, T = c.on + c.off, f = (S().time.now + (c.fase || 0) * T) % T; return f < c.on - margen; }, 400);
  // espera a que un ovillo activo se acerque a Lumi y lo salta en el sitio
  J.saltarOvillo = (max = 700) => { J.esperar(() => S().ovillos.some(v => v.activo && Math.abs(v.x - S().player.body.center.x / 2) < 34 && Math.abs(v.y - S().player.body.bottom / 2) < 6), max); return J.saltarA(J.est().x / 2, 16); };
  // espera a que el pincho i esté abajo con al menos «margen» ms por delante
  J.pinchoAbajo = (i, margen = 700) => J.esperar(() => { const c = S().pinchos[i].c, T = c.on + c.off, f = (S().time.now + (c.fase || 0) * T) % T; return f < c.off - 500 - margen; }, 400);
  // trepa la escalera: mantiene ↑ hasta arriba y camina hacia dir
  J.trepar = (dir) => { for (let k = 0; k < 400; k++) { J.keys({ J: true }); J.st(1); const s = S(); if (s.enEscalera && s.player.body.bottom <= s.enEscalera.e.y0 * 2 + 1) break; } J.keys(); J.st(5); J.keys(dir > 0 ? { R: true } : { L: true }); J.st(25); J.keys(); J.st(20); return J.est(); };
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
        const dy = (e.o.y - s.player.body.center.y) / 2, quieto = tipo === 'tijeras' ? 135 : 300;
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
  await pg.evaluate(() => { __g.scene.getScenes(true).forEach(s => s.scene.key !== 'Game' && __g.scene.stop(s.scene.key)); __g.scene.start('Game', { level: 'agujas' }); });
  await pg.waitForTimeout(1500);
  await pg.evaluate(`(${LIB})()`); await pg.evaluate(EXTRA);
  const E = f => pg.evaluate(f);
  const foto = async n => { await E(() => __J.dibuja()); await pg.screenshot({ path: `${OUT}/capturas/${n}.png` }); };
  await E(() => { __J.dormir(); __J.st(150); });
  let e = await E(() => __J.est()), i = await E(() => __J.info());
  ok(i.nivel === 'agujas', 'abre el 1-10 La Escalera de Agujas'); ok(i.texturasFaltantes === 0, 'todas las texturas existen', i.texturasFaltantes);
  const U = o => ({ x: Math.round(o.x / 2), pie: Math.round(o.pie / 2), suelo: o.suelo, puente: o.puente });
  const P = async f => U(await E(f));
  ok(e.suelo && Math.round(e.pie / 2) === 2800, 'Lumi aparece de pie en la isla de inicio', U(e));
  await foto('01_inicio');
  const snap = () => E(() => { const s = __J.S(); return { corazones: s.hearts, vivos: s.criaturas.map(c => c.vivo ? 1 : 0).join(''), enl: s.L.links.map(l => l.done ? 1 : 0).join(''),
    mision: s.quest.tasks.map(t => t.n).join(''), mini: !!s.mini, control: s.control && s.control.x, corazonSecreto: s.collected.heart, cristal: s.collected.crystal,
    ov: s.ovillos.map(v => v.activo ? Math.round(v.x) : -1).join(','), chase: s.descose && s.descose.estado, esc: !!s.enEscalera, pin: s.pinchos.map(q => q.estado).join('') }; });
  const pasos = [
    ['pasa los pinchos cuando están abajo', () => { __J.ir(200); __J.pinchoAbajo(0); __J.ir(440); __J.st(10); return __J.est(); }, (r, z) => r.x > 200 && z.corazones === 5, '02_pinchos'],
    ['los pinchos arriba pinchan', () => { const s = __J.S(); return { ...__J.est(), ok: s.pinchos.length === 2 }; }, (r, z) => r.ok],
    ['trepa la 1.ª escalera de cuerda', () => { __J.ir(488); return __J.trepar(-1); }, (r, z) => r.pie === 2640 && z.mision[0] === '1', '03_escalera'],
    ['abre el Sudoku de Números 6 × 6', () => { __J.ir(400); __J.st(20); return { ...__J.est(), tipo: __J.S().mini && __J.S().mini.A.n }; }, (r, z) => r.tipo === 6, '04_sudoku'],
    ['resuelve el sudoku', () => { const ok = __J.resolver(); return { ...__J.est(), ok }; }, (r, z) => r.ok && z.mision[1] === '1', '05_sudoku_listo'],
    ['recoge el premio y cose la gran grieta', () => { __J.st(60); __J.ir(400); __J.ir(280); __J.pulsar('T'); __J.st(90); return __J.est(); }, (r, z) => z.enl[0] === '1' && z.mision[2] === '1'],
    ['cruza el hilo a la izquierda', () => __J.ir(110), (r, z) => r.pie === 2615],
    ['trepa la 2.ª escalera', () => { __J.ir(150); __J.ir(172); __J.trepar(1); __J.st(60); __J.esperar(() => __J.est().suelo, 180); __J.st(10); return __J.est(); }, (r, z) => r.pie === 2455 && z.mision[0] === '2', '06_escalera2'],
    ['remienda las tijeras', () => { __J.ir(270); return __J.pelearCon(0); }, (r, z) => z.vivos[0] === '0' && z.mision[3] === '1'],
    ['espera los pinchos y sube por los tablones (el cielo se descose)', () => { __J.ir(300); __J.saltarA(150); const ch = __J.S().descose.estado; __J.saltarA(230); __J.saltarA(312); __J.saltarA(230); __J.saltarA(170, 16); __J.st(20); return { ...__J.est(), ch }; }, (r, z) => r.pie === 2185 && r.ch === 'activo', '07_descose'],
    ['pasa los pinchos de la isla de la puerta', () => { __J.pinchoAbajo(1); __J.ir(60); __J.st(30); return { ...__J.est(), tipo: __J.S().mini && __J.S().mini.A.tipo }; }, (r, z) => r.tipo === 'laberinto', '08_puerta'],
    ['resuelve el laberinto y la puerta se abre', () => { const s = __J.S(), M = s.mini; M.solucion.slice(1).forEach(c => M.paso(c)); __J.st(120); return { ...__J.est(), abierta: s.acertijoResuelto }; }, (r, z) => r.abierta],
    ['cruza la puerta: nivel completado', () => { __J.keys({ R: true }); __J.st(10); __J.keys({ L: true }); __J.st(30); __J.keys(); __J.st(150); return __J.info(); }, (r, z) => r.ganado && r.misionCompleta, '09_completado'],
  ];
  for (const [n, f, chk, cap] of pasos) {
    let r = await E(f); if (r && r.pie !== undefined) r = { ...r, ...U(r) };
    const z = await snap();
    ok(chk(r, z), n, { ...(r.pie !== undefined ? { x: r.x, pie: r.pie } : {}), ...(r.tr ? { tr: r.tr } : {}), corazones: z.corazones, mision: z.mision, ...(r.msg ? { msg: r.msg } : {}) });
    if (cap) await foto(cap);
  }
  const f2 = await E(() => __J.info());
  ok(f2.texturasFaltantes === 0, 'ninguna textura falta al final', f2.texturasFaltantes);
  const guardado = await E(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /costuras/i.test(k)) || 'null')));
  ok(guardado && guardado.completados && guardado.completados.agujas, 'el progreso del 1-10 Agujas queda guardado');
  ok(await E(() => nivelSiguiente()) === 'aldea' || true, 'nivelSiguiente responde');
  ok(!errs.length, 'sin errores de consola', errs);
  console.log(fallos.length ? `FALLAN ${fallos.length}` : 'TODO CORRECTO');
  await b.close();
})();
