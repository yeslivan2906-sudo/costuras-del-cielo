// PRUEBA DEL 1-4 «La Torre del Reloj»: se juega entero con las MISMAS entradas que un jugador (◀ ▶ ↑, carrete, aguja),
// a 60 Hz exactos. Los minijuegos se resuelven con sus propias funciones de toque (las mismas que llaman los dedos).
// Uso: node nivel_1-4.js <phaser.min.js | -> <carpeta del juego> <salida>
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
  // tablones de rueda: índice del que está más abajo; montar = quedarse en su centro hasta que se cumpla cond(x, top)
  J.tab = j => { const b = S().moviles[j].o.body; return { x: b.x / 2, top: b.y / 2 }; };
  J.montar = (j, cond, max = 900) => { for (let k = 0; k < max; k++) { const q = J.tab(j); if (cond(q.x, q.top)) break; const dx = q.x + 25 - J.est().x / 2; J.keys({ R: dx > 5, L: dx < -5 }); J.st(1); } J.keys(); return J.est(); };
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
        const dy = (e.o.y - s.player.body.center.y) / 2, quieto = tipo === 'tijeras' ? Math.min(335, e.c.hasta + 10) : 300;
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
  await pg.evaluate(() => { __g.scene.getScenes(true).forEach(s => s.scene.key !== 'Game' && __g.scene.stop(s.scene.key)); __g.scene.start('Game', { level: 'torre' }); });
  await pg.waitForTimeout(1500);
  await pg.evaluate(`(${LIB})()`); await pg.evaluate(EXTRA);
  const E = f => pg.evaluate(f);
  const foto = async n => { await E(() => __J.dibuja()); await pg.screenshot({ path: `${OUT}/capturas/${n}.png` }); };
  await E(() => { __J.dormir(); __J.st(150); });
  let e = await E(() => __J.est()), i = await E(() => __J.info());
  ok(i.nivel === 'torre', 'abre el 1-4 La Torre del Reloj'); ok(i.texturasFaltantes === 0, 'todas las texturas existen', i.texturasFaltantes);
  const U = o => ({ x: Math.round(o.x / 2), pie: Math.round(o.pie / 2), suelo: o.suelo, puente: o.puente });
  const P = async f => U(await E(f));
  ok(e.suelo && Math.round(e.pie / 2) === 3200, 'Lumi aparece de pie en la isla de inicio', U(e));
  await foto('01_inicio');
  const snap = () => E(() => { const s = __J.S(); return { corazones: s.hearts, vivos: s.criaturas.map(c => c.vivo ? 1 : 0).join(''), enl: s.L.links.map(l => l.done ? 1 : 0).join(''),
    mision: s.quest.tasks.map(t => t.n).join(''), mini: !!s.mini, control: s.control && s.control.x, corazonSecreto: s.collected.heart, cristal: s.collected.crystal,
    colgado: !!s.colgado, compuerta: s.compuertas.g1 && s.compuertas.g1.abierta, fuelles: s.fuelles.map(f => f.activo ? 1 : 0).join('') }; });
  const pasos = [
    ['EXPLORA', () => { __J.ir(380); return __J.saltarA(212, 16, 300); }, () => true, '02_fuelle'],
    ['sube a la rueda', () => { let j = -1; __J.esperar(() => { j = __J.S().moviles.findIndex((q, i) => { const t = __J.tab(i); return t.top > 2930 && t.x > 118 && t.x < 140; }); return j >= 0; }, 900);
        const e = __J.saltarA(__J.tab(j).x + 10, 12); window.__j = j; return e; }, () => true, '03_rueda'],
    ['la rueda la sube (y espera a que las tijeras estén lejos)', () => __J.montar(window.__j, (x, top) => { const t = __J.S().criaturas[0]; return top < 2842 && x > 140 && t.estado === 'volar' && t.x > 290; }, 3000), () => true],
    ['salta a A', () => __J.saltarA(262, 16), (r, z) => r.pie === 2790],
    ['tijeras 1', () => __J.pelearCon(0), (r, z) => z.vivos[0] === '0'],
    ['sube a P2', () => { __J.ir(500); return __J.saltarA(205); }, (r, z) => r.pie === 2730],
    ['P3', () => __J.saltarA(275), (r, z) => Math.abs(r.pie - 2670) < 6],
    ['P4', () => __J.saltarA(235), (r, z) => r.pie === 2610],
    ['W', () => __J.saltarA(185, 10), (r, z) => r.pie === 2560, '04_compuerta'],
    ['en la isla de la compuerta se abre el «Sudoku del Relojero»', () => { __J.ir(100); return { ...__J.est(), sudoku: !!__J.S().mini && __J.S().mini.A.tipo === 'sudoku' }; }, (r, z) => r.sudoku, '04b_sudoku'],
    ['un color repetido avisa', () => { const M = __J.S().mini; M.elegir(2); M.poner(2); __J.st(5); const r = { ...__J.est(), msg: M.msg.text }; M.reiniciar(); return r; }, (r, z) => /ya está/.test(r.msg)],
    ['resuelve el sudoku', () => ({ ...__J.est(), ok: __J.resolver() }), (r, z) => r.ok && z.mision[6] === '1'],
    ['la compuerta no deja pasar', () => { __J.st(30); return __J.ir(100); }, (r, z) => r.x > 108],
    ['salta y se agarra al columpio', () => { __J.ir(390); for (let k = 0; k < 90 && !__J.S().colgado; k++) { __J.keys({ R: true, J: k < 16 }); __J.st(1); } __J.keys(); __J.st(2); return __J.est(); }, (r, z) => z.colgado, '05_columpio'],
    ['se balancea y se suelta hacia la palanca', () => { const s = __J.S(); let k = 0;
        for (; k < 600 && s.colgado; k++) { const C = s.colgado, th = C.th, w = C.w; const suelta = th > 0.45 && w > 0;
          __J.keys({ R: w > 0, L: w < 0, J: suelta }); __J.st(1); __J.keys({ R: w > 0, L: w < 0 }); }
        __J.keys({ R: true }); for (let i = 0; i < 80 && !__J.est().suelo; i++) __J.st(1); __J.keys(); __J.st(3); return __J.est(); }, (r, z) => r.pie === 2500],
    ['tira de la palanca: la compuerta se abre', () => { __J.ir(652); __J.st(30); return __J.est(); }, (r, z) => z.compuerta && z.mision[0] === '1', '06_palanca'],
    ['vuelve de un salto (al caer llega más lejos)', () => { __J.ir(640); return __J.saltarA(150, 16); }, (r, z) => r.pie === 2560],
    ['cruza la compuerta abierta: el cuco abre «Rueda de engranajes»', () => { __J.ir(140); __J.st(30); return __J.est(); }, (r, z) => z.mini, '07_engranajes'],
    ['un engranaje grande no cabe en el hueco pequeño', () => { const M = __J.S().mini; const ok1 = M.poner(0, 2); __J.st(5); return { ...__J.est(), msg: M.msg.text, ok1 }; }, (r, z) => r.ok1 === false && /grande/.test(r.msg)],
    ['pone los 5 engranajes: giran y el cuco se arregla', () => { const M = __J.S().mini; M.solucion.forEach(([g, h]) => M.poner(g, h)); __J.st(30); return __J.est(); }, (r, z) => z.mini, '08_engranajes_listos'],
    ['el cuco suelta un cristal', () => { __J.st(100); __J.ir(170); __J.ir(110); __J.st(10); return __J.est(); }, (r, z) => !z.mini && z.mision[1] === '1' && z.cristal],
    ['el 2.º fuelle sube a Lumi al tablón', () => { __J.ir(64); const F = __J.S().fuelles[2]; __J.esperar(() => !F.activo, 400); __J.esperar(() => F.activo, 400); return __J.saltarA(40, 16, 300); }, (r, z) => r.pie === 2390, '09_fuelle2'],
    ['SECRETO: el corazón encima del tablón del fuelle', () => { __J.ir(56); return __J.saltarA(28, 16); }, (r, z) => z.corazonSecreto && r.pie === 2390],
    ['tablón que se descose y tablón siguiente', () => { __J.saltarA(118); return __J.saltarA(198); }, (r, z) => r.pie === 2270],
    ['isla del puente (espera a que las tijeras se alejen): carrete de control', () => { const T = __J.S().criaturas[1]; __J.esperar(() => T.estado === 'volar' && T.x < 135 && T.dir < 0, 900); __J.saltarA(262, 16); __J.ir(660); return __J.est(); }, (r, z) => r.pie === 2220 && z.control === 330],
    ['cose el puente desde lejos (las tijeras no llegan)', () => { __J.ir(650); __J.pulsar('T'); __J.st(90); return __J.est(); }, (r, z) => z.enl === '1' && z.mision[2] === '1' && z.corazones >= 5, '10_puente'],
    ['¡las tijeras cortan el hilo cuando Lumi se acerca!', () => { __J.ir(500); const n = __J.esperar(() => !__J.S().L.links[0].done, 600); __J.ir(650); return { ...__J.est(), n }; }, (r, z) => z.enl === '0' && r.n >= 0, '11_hilo_cortado'],
    ['remienda las tijeras', () => __J.pelearCon(1), (r, z) => z.vivos[1] === '0' && z.mision[3] === '2'],
    ['vuelve a coser y cruza', () => { __J.ir(600); __J.pulsar('T'); __J.st(90); return __J.ir(160); }, (r, z) => z.enl === '1' && r.pie === 2180],
    ['la caja de música abre «Coser el patrón»', () => { __J.ir(112); __J.st(30); return __J.est(); }, (r, z) => z.mini, '12_patron'],
    ['si el dedo se sale de la costura, avisa y no avanza', () => { const M = __J.S().mini; const q = M.punto(0); M.dedo(q.x + 25, q.y - 10); __J.st(5); return { ...__J.est(), msg: M.msg.text, d: M.d }; }, (r, z) => /saliste/.test(r.msg) && r.d === 0],
    ['cose media torre', () => { const M = __J.S().mini; for (let d = 0; d <= M.total / 2; d += 3) { const q = M.punto(d); M.dedo(q.x + 3, q.y - 2); } __J.st(5); return { ...__J.est(), d: Math.round(M.d), tot: Math.round(M.total) }; }, (r, z) => r.d > r.tot / 2 - 6 && z.mini, '13_patron_mitad'],
    ['termina la costura', () => { const M = __J.S().mini; for (let d = M.d; d <= M.total + 3; d += 3) { const q = M.punto(Math.min(d, M.total)); M.dedo(q.x, q.y); } __J.st(10); return __J.est(); }, (r, z) => z.mini, '14_patron_listo'],
    ['la caja de música suelta su premio', () => { __J.st(110); __J.ir(80); __J.ir(140); __J.st(10); return __J.est(); }, (r, z) => !z.mini && z.mision[4] === '1'],
    ['sube a la arena', () => { __J.saltarA(60); return __J.saltarA(140, 12); }, (r, z) => r.pie === 2070, '15_arena'],
    ['la puerta no se abre con guardianes', () => { const s = __J.S(); s.tryWin(); return { ...__J.est(), mini: !!s.mini }; }, (r, z) => !r.mini],
    ['remienda al lobo guardián', () => __J.pelearCon(2), (r, z) => z.vivos[2] === '0'],
    ['remienda las tijeras guardianas', () => __J.pelearCon(3), (r, z) => z.vivos[3] === '0' && z.mision[5] === '1'],
    ['en la puerta: rompecabezas deslizante', () => { __J.ir(660); __J.st(30); return __J.est(); }, (r, z) => z.mini, '16_deslizante'],
    ['una pieza lejos del hueco no se mueve', () => { const M = __J.S().mini; const lejos = [0,1,2,3,4,5,6,7,8].find(c => c !== M.hueco && ![M.hueco - 3, M.hueco + 3, M.hueco % 3 ? M.hueco - 1 : -9, M.hueco % 3 < 2 ? M.hueco + 1 : -9].includes(c)); return { ...__J.est(), movio: M.tocar(lejos) }; }, (r, z) => r.movio === false],
    ['arma la torre: la puerta se abre', () => { const s = __J.S(), M = s.mini; M.solucion.forEach(c => M.tocar(c)); __J.st(120); return { ...__J.est(), abierta: s.acertijoResuelto }; }, (r, z) => r.abierta, '17_deslizante_resuelto'],
    ['cruza la puerta: nivel completado', () => { __J.keys({ L: true }); __J.st(10); __J.keys({ R: true }); __J.st(30); __J.keys(); __J.st(150); return __J.info(); }, (r, z) => r.ganado && r.misionCompleta, '18_completado'],
  ];
  for (const [n, f, chk, cap] of pasos) {
    let r = await E(f); if (r && r.pie !== undefined) r = { ...r, ...U(r) };
    const z = await snap();
    ok(chk(r, z), n, { ...(r.pie !== undefined ? { x: r.x, pie: r.pie } : {}), corazones: z.corazones, mision: z.mision, ...(r.msg ? { msg: r.msg } : {}), z });
    if (cap) await foto(cap);
  }
  const fin = await E(() => __J.info());
  ok(fin.texturasFaltantes === 0, 'ninguna textura falta al final', fin.texturasFaltantes);
  const guardado = await E(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /costuras/i.test(k)) || 'null')));
  ok(guardado && guardado.completados && guardado.completados['1-4'], 'el progreso del 1-4 queda guardado');
  ok(!errs.length, 'sin errores de consola', errs);
  console.log(fallos.length ? `FALLAN ${fallos.length}` : 'TODO CORRECTO');
  await b.close();
})();
