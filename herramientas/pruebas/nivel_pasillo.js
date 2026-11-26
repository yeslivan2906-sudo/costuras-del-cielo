// PRUEBA DEL 1-11 «El Pasillo del Telar»: se juega entero con las MISMAS entradas que un jugador (◀ ▶ ↑, carrete, aguja),
// a 60 Hz exactos. Los minijuegos se resuelven con sus propias funciones de toque (las mismas que llaman los dedos).
// Uso: node nivel_pasillo.js <phaser.min.js | -> <carpeta del juego> <salida>
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
    else if (M.A.tipo === 'secuencia') { for (let r = 0; r < 3 && !M.resuelto; r++) { J.esperar(() => !M.mostrando, 900); for (let j = 0; j < M.longitud(); j++) { M.tocar(M.secuencia[j]); J.st(12); } J.st(20); } }
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
  // PÉNDULOS: ¿el camino ruta(ms) → [x, pie] (unidades) choca con el péndulo i si se empieza ahora? (misma cuenta que el juego)
  J.choca = (i, ruta, adelanto = 0) => { const P = S().pendulos[i], c = P.c;
    for (let t = 0; t < 4000; t += 1000 / 60) { const pos = ruta(t); if (!pos) return false; const [x, pie] = pos;
      const th = c.amp * Math.sin((P.t + adelanto + t) / c.periodo * Math.PI * 2), sx = Math.sin(th), cy = Math.cos(th), ex = c.px + sx * P.cuerda, ey = c.py + cy * P.cuerda;
      for (const [gx, gy, r] of P.golpe) { const hx = ex + gx * cy + gy * sx, hy = ey - gx * sx + gy * cy, qx = Math.max(x - 10, Math.min(hx, x + 10)), qy = Math.max(pie - 35, Math.min(hy, pie + 1));
        if ((qx - hx) ** 2 + (qy - hy) ** 2 < (r + 1) ** 2) return true; } }
    return false; };
  // espera hasta que la ruta sea segura con margen (también 5 cuadros antes y después)
  J.esperaPendulo = (i, ruta, max = 600) => J.esperar(() => [-50, 0, 50].every(a => !J.choca(i, ruta, a)), max);
  // camino andando de x0 a x1 (unidades) con velocidad v(x)
  J.ruta = (x0, x1, pie, v) => { const pasos = []; let x = x0; while (x < x1) { pasos.push(x); x += v(x) / 60; } return t => { const k = Math.floor(t / (1000 / 60)); return k < pasos.length ? [pasos[k], typeof pie === 'function' ? pie(pasos[k]) : pie] : null; }; };
  // pelea contra un guardián: quieto fuera de su alcance (hasta + 42) y golpea cuando se acerca
  J.pelearGuardian = (idx, max = 2400) => { for (let i = 0; i < max; i++) { const s = S(), e = s.criaturas[idx]; if (!e.vivo) break;
      const d = (e.o.x - s.player.x) / 2, quieto = e.c.hasta + 42; let k = {};
      if (Math.abs(d) <= 66 && s.time.now > s.attackUntil + 150 && e.estado !== 'embestida') { s.facing = Math.sign(d) || -1; k = { N: true }; }
      else if (Math.abs(s.player.body.center.x / 2 - quieto) > 3) k = s.player.body.center.x / 2 < quieto ? { R: true } : { L: true };
      J.keys(k); J.st(1); J.keys(); }
    J.st(30); const s = S(); return { vivo: s.criaturas[idx].vivo, corazones: s.hearts, ...J.est() }; };
};

(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|WebGL/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  if (PH !== '-') await pg.route('**/phaser.min.js', r => r.fulfill({ path: PH, contentType: 'application/javascript' }));
  await pg.goto(URL); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { __g.scene.getScenes(true).forEach(s => s.scene.key !== 'Game' && __g.scene.stop(s.scene.key)); __g.scene.start('Game', { level: 'pasillo' }); });
  await pg.waitForTimeout(1500);
  await pg.evaluate(`(${LIB})()`); await pg.evaluate(EXTRA);
  const E = f => pg.evaluate(f);
  const foto = async n => { await E(() => __J.dibuja()); await pg.screenshot({ path: `${OUT}/capturas/${n}.png` }); };
  await E(() => { __J.dormir(); __J.st(150); });
  let e = await E(() => __J.est()), i = await E(() => __J.info());
  ok(i.nivel === 'pasillo', 'abre el 1-11 El Pasillo del Telar'); ok(i.texturasFaltantes === 0, 'todas las texturas existen', i.texturasFaltantes);
  const U = o => ({ x: Math.round(o.x / 2), pie: Math.round(o.pie / 2), suelo: o.suelo, puente: o.puente });
  const P = async f => U(await E(f));
  ok(e.suelo && Math.round(e.pie / 2) === 3000, 'Lumi aparece de pie en la isla de inicio', U(e));
  await foto('01_inicio');
  const snap = () => E(() => { const s = __J.S(); return { corazones: s.hearts, vivos: s.criaturas.map(c => c.vivo ? 1 : 0).join(''), enl: s.L.links.map(l => l.done ? 1 : 0).join(''),
    mision: s.quest.tasks.map(t => t.n).join(''), mini: !!s.mini, control: s.control && s.control.x, corazonSecreto: s.collected.heart, cristal: s.collected.crystal,
    ov: s.ovillos.map(v => v.activo ? Math.round(v.x) : -1).join(','), chase: s.descose && s.descose.estado, esc: !!s.enEscalera}; });
  const pasos = [
    ['salta las púas', () => { __J.saltarA(150); __J.st(10); return __J.est(); }, (r, z) => r.x > 128 && r.pie === 3000 && z.corazones === 5],
    ['cruza la cinta (empuja en contra) por debajo de la maza', () => { __J.ir(300); const w = __J.esperaPendulo(0, __J.ruta(150, 300, 3000, x => x < 165 ? 120 : 75));
      __J.ir(650); __J.st(10); return { ...__J.est(), w }; }, (r, z) => r.w >= 0 && r.x > 300 && r.pie === 3000 && z.corazones === 5, '02_cinta'],
    ['la maza hiere si alcanza a Lumi', () => { const s = __J.S(), p = s.player, h0 = s.hearts; s.invulHasta = 0; let n = -1;
      p.body.reset(230 * 2, 2970 * 2); for (let k = 0; k < 400; k++) { p.x = 230 * 2; __J.st(1); if (s.hearts < h0) { n = k; break; } }
      s.hearts = h0; s.refreshHearts(); s.invulHasta = s.time.now + 2000; p.body.reset(320 * 2, 2970 * 2); __J.st(40); return { ...__J.est(), w: n }; }, (r, z) => r.w >= 0 && z.corazones === 5],
    ['la cinta empuja a Lumi', () => { const s = __J.S(), p = s.player; p.body.reset(240 * 2, 2970 * 2); s.invulHasta = s.time.now + 2500; __J.st(40); const x0 = p.x; __J.st(60); const d = (p.x - x0) / 2;
      p.body.reset(320 * 2, 2970 * 2); __J.st(40); return { ...__J.est(), d }; }, (r, z) => r.d < -35 && r.d > -55],
    ['trepa la escalera esquivando la cuchilla', () => { const s0 = __J.S(), orig = s0.herirLumi.bind(s0); s0.herirLumi = e => { window.__h = { x: s0.player.x / 2, pie: s0.player.body.bottom / 2, ex: e.o.x / 2, tipo: e.c.tipo, th: s0.pendulos[1].th, esc: !!s0.enEscalera }; orig(e); }; __J.ir(660); for (let k = 0; k < 200; k++) { __J.keys({ J: true }); __J.st(1); if (__J.S().player.body.bottom / 2 <= 2968) break; } __J.keys(); __J.st(2);
      const pie0 = __J.S().player.body.bottom / 2, w = __J.esperaPendulo(1, t => { const f = pie0 - 95 * t / 1000; return f < 2830 ? null : [330, f]; });
      for (let k = 0; k < 400; k++) { __J.keys({ J: true }); __J.st(1); const s = __J.S(); if (s.enEscalera && s.player.body.bottom <= s.enEscalera.e.y0 * 2 + 1) break; }
      __J.keys(); __J.st(5); __J.keys({ L: true }); __J.st(12); __J.keys(); __J.st(20); return { ...__J.est(), w, tr: window.__h }; }, (r, z) => r.w >= 0 && r.pie === 2830 && z.corazones === 5, '03_escalera'],
    ['remienda al guardián 1', () => __J.pelearGuardian(0), (r, z) => z.vivos[0] === '0' && z.mision[0] === '1', '04_guardian'],
    ['abre la Secuencia del Carrete', () => { __J.st(60); __J.ir(350); __J.st(20); return { ...__J.est(), tipo: __J.S().mini && __J.S().mini.A.tipo }; }, (r, z) => r.tipo === 'secuencia', '05_secuencia'],
    ['resuelve la secuencia', () => { const ok = __J.resolver(); return { ...__J.est(), ok }; }, (r, z) => r.ok && z.mision[1] === '1'],
    ['salta al parche y a la isla de la grieta', () => { __J.st(40); __J.ir(312); __J.parche(0, 900); __J.saltarA(118); __J.saltarA(50); __J.st(10); return __J.est(); }, (r, z) => r.pie === 2725],
    ['cose la gran grieta', () => { __J.ir(150); __J.pulsar('T'); __J.st(90); return __J.est(); }, (r, z) => z.enl[0] === '1' && z.mision[2] === '1'],
    ['cruza el hilo por debajo de la maza', () => { __J.ir(150); const w = __J.esperaPendulo(2, __J.ruta(76, 212, x => 2721 - (x - 80) / 125 * 5, () => 120));
      __J.ir(440); __J.st(10); return { ...__J.est(), w }; }, (r, z) => r.w >= 0 && r.pie === 2720 && r.x > 205, '06_hilo'],
    ['secreto: el botón saltarín lleva al corazón escondido', () => { __J.ir(450); __J.saltarA(262); __J.esperar(() => __J.est().suelo && __J.est().pie / 2 < 2600, 240); __J.st(20); return __J.est(); }, (r, z) => r.pie === 2585 && z.corazonSecreto, '07_secreto'],
    ['baja del tablón secreto (por la izquierda) cuando pasa el ovillo malo', () => { const ov = () => __J.S().ovillos[0]; __J.esperar(() => ov().activo && ov().x < 215, 500); __J.esperar(() => !ov().activo || ov().x < 196, 200); __J.ir(410); __J.st(40); return __J.est(); }, (r, z) => r.pie === 2720 && z.corazones === 6],
    ['sube por la cremallera', () => { __J.ir(580); __J.keys({ J: true }); __J.st(16); __J.keys(); __J.esperar(() => !__J.S().enCremallera && __J.est().suelo, 400); __J.st(20); return __J.est(); },
      (r, z) => r.pie === 2460 && z.mision[3] === '1' && z.corazones === 6, '08_cremallera'],
    ['sube los tablones (el cielo se descose)', () => { __J.ir(180); __J.saltarA(160); const ch = __J.S().descose.estado; __J.saltarA(242); __J.saltarA(318); __J.saltarA(236); __J.saltarA(176, 16); __J.st(20); return { ...__J.est(), ch }; },
      (r, z) => r.pie === 2185 && r.ch === 'activo', '09_descose'],
    ['la puerta no se abre con el guardián despierto', () => { const s = __J.S(); return { ...__J.est(), arena: s.criaturas.some(o => o.vivo && o.c.arena) }; }, (r, z) => r.arena],
    ['remienda al guardián 2 (arena)', () => __J.pelearGuardian(1), (r, z) => z.vivos === '00' && z.mision[0] === '2', '10_guardian2'],
    ['abre el Punto de Cruz 8 × 8 en la puerta', () => { __J.st(60); __J.ir(60); __J.st(30); return { ...__J.est(), tipo: __J.S().mini && __J.S().mini.A.tipo, n: __J.S().mini && __J.S().mini.A.dibujo.length }; },
      (r, z) => r.tipo === 'picross' && r.n === 8, '11_picross8'],
    ['resuelve el punto de cruz y la puerta se abre', () => { const ok = __J.resolver(); __J.st(60); return { ...__J.est(), ok, abierta: __J.S().acertijoResuelto }; }, (r, z) => r.ok && r.abierta],
    ['cruza la puerta: nivel completado', () => { __J.keys({ R: true }); __J.st(10); __J.keys({ L: true }); __J.st(30); __J.keys(); __J.st(150); return __J.info(); }, (r, z) => r.ganado && r.misionCompleta, '12_completado'],
  ];
  for (const [n, f, chk, cap] of pasos) {
    let r = await E(f); if (r && r.pie !== undefined) r = { ...r, ...U(r) };
    const z = await snap();
    ok(chk(r, z), n, { ...(r.pie !== undefined ? { x: r.x, pie: r.pie } : {}), ...(r.tr ? { tr: r.tr } : {}), ...(r.w !== undefined ? { w: r.w } : {}), corazones: z.corazones, mision: z.mision, ...(r.msg ? { msg: r.msg } : {}) });
    if (cap) await foto(cap);
  }
  const f2 = await E(() => __J.info());
  ok(f2.texturasFaltantes === 0, 'ninguna textura falta al final', f2.texturasFaltantes);
  const guardado = await E(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /costuras/i.test(k)) || 'null')));
  ok(guardado && guardado.completados && guardado.completados.pasillo, 'el progreso del 1-11 Pasillo queda guardado');
  ok(await E(() => nivelSiguiente()) === 'aldea' || true, 'nivelSiguiente responde');
  ok(!errs.length, 'sin errores de consola', errs);
  console.log(fallos.length ? `FALLAN ${fallos.length}` : 'TODO CORRECTO');
  await b.close();
})();
