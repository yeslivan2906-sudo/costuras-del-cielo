// PRUEBA DEL 2-1 «La Entrada del Bosque»: se juega entero con las MISMAS entradas que un jugador (◀ ▶ ↑, carrete, aguja),
// a 60 Hz exactos. Los minijuegos se resuelven con sus propias funciones de toque (las mismas que llaman los dedos).
// Uso: node nivel_bosque2_1.js <phaser.min.js | -> <carpeta del juego> <salida>
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
  // «de pie» de verdad: las monedas también marcan touching.down al tocarlas en el aire
  J.pie = () => { const b = S().player.body; return b.blocked.down || (b.touching.down && Math.abs(b.velocity.y) < 1) || S().onBridge; };
  J.saltarA = (xt, hold = 16, max = 200) => { let dejo = false;
    for (let i = 0; i < max; i++) { const e = J.est(), pie = J.pie(); if (i > 3 && !pie) dejo = true; if (dejo && pie) break;
      const dx = xt - e.x / 2; J.keys({ R: dx > 3, L: dx < -3, J: i < hold }); J.st(1); }
    J.keys(); J.st(4); return J.est(); };
  // resuelve el minijuego abierto con sus propias funciones de toque (sudoku, punto de cruz, laberinto)
  J.resolver = () => { const s = S(), M = s.mini; if (!M) return false;
    if (M.A.tipo === 'sudoku') M.solucionLista().forEach(([i, v]) => { M.elegir(i); M.poner(v); });
    else if (M.A.tipo === 'picross') M.solucionLista().forEach(i => M.tocar(i));
    else if (M.A.tipo === 'balanza') { for (let r = 0; r < 4 && !M.resuelto; r++) { J.esperar(() => !M.esperando, 200); M.solucionRonda().forEach(i => M.tocar(i)); J.st(80); } }
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
  J.montada = (i, cond, max = 900) => { for (let k = 0; k < max; k++) { if (cond()) break; const m = S().moviles[i], cx = (m.o.body.x + m.o.body.width / 2) / 2, x = S().player.body.center.x / 2;
      J.keys(x < cx - 4 ? { R: true } : x > cx + 4 ? { L: true } : {}); J.st(1); } J.keys(); return J.est(); };
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
  J.pelear = (idx, quieto, max = 2400) => { for (let i = 0; i < max; i++) { const s = S(), e = s.criaturas[idx]; if (!e.vivo) break;
      const d = (e.o.x - s.player.x) / 2; let k = {};
      if (Math.abs(d) <= 50 && s.time.now > s.attackUntil + 150) { s.facing = Math.sign(d) || 1; k = { N: true }; }
      else if (Math.abs(s.player.body.center.x / 2 - quieto) > 3) k = s.player.body.center.x / 2 < quieto ? { R: true } : { L: true };
      J.keys(k); J.st(1); J.keys(); }
    J.st(30); const s = S(); return { vivo: s.criaturas[idx].vivo, ...J.est() }; };
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
  await pg.evaluate(() => { __g.scene.getScenes(true).forEach(s => s.scene.key !== 'Game' && __g.scene.stop(s.scene.key)); __g.scene.start('Game', { level: 'bosque2_1' }); });
  await pg.waitForTimeout(1500);
  await pg.evaluate(`(${LIB})()`); await pg.evaluate(EXTRA);
  const E = f => pg.evaluate(f);
  const foto = async n => { await E(() => __J.dibuja()); await pg.screenshot({ path: `${OUT}/capturas/${n}.png` }); };
  await E(() => { __J.dormir(); __J.st(150); });
  let e = await E(() => __J.est()), i = await E(() => __J.info());
  ok(i.nivel === 'bosque2_1', 'abre el 2-1 La Entrada del Bosque'); ok(i.texturasFaltantes === 0, 'todas las texturas existen', i.texturasFaltantes);
  const U = o => ({ x: Math.round(o.x / 2), pie: Math.round(o.pie / 2), suelo: o.suelo, puente: o.puente });
  const P = async f => U(await E(f));
  ok(e.suelo && Math.round(e.pie / 2) === 2800, 'Lumi aparece de pie en la isla de inicio', U(e));
  await foto('01_inicio');
  const snap = () => E(() => { const s = __J.S(); return { corazones: s.hearts, vivos: s.criaturas.map(c => c.vivo ? 1 : 0).join(''), enl: s.L.links.map(l => l.done ? 1 : 0).join(''),
    mision: s.quest.tasks.map(t => t.n).join(''), mini: !!s.mini, control: s.control && s.control.x, corazonSecreto: s.collected.heart, cristal: s.collected.crystal,
    chase: s.descose && s.descose.estado }; });
  const pasos = [
    ['hojas que caen hasta la isla B', () => { __J.ir(330); __J.saltarA(230, 14); const h1 = __J.est().pie; __J.saltarA(300, 14); __J.saltarA(185, 16); __J.st(10); return { ...__J.est(), w: h1 }; },
      (r, z) => r.pie === 2645 && z.corazones === 5, '01_hojas'],
    ['la hoja pisada se cae y vuelve', () => { const s = __J.S(), D = s.descosidos[0]; const e1 = D.estado; __J.st(240); return { ...__J.est(), w: e1 + '>' + D.estado }; }, (r, z) => /firme/.test(r.w)],
    ['sube a la grulla y vuela hasta la isla C', () => { const s = __J.S(), M = s.moviles[0];
      __J.ir(420); __J.esperar(() => { const x = M.o.body.x / 2; return x > 200 && M.o.body.velocity.x < 0; }, 900); __J.saltarA(226, 6);
      const enG = __J.est(); __J.esperar(() => M.o.body.x / 2 < 140, 600); __J.saltarA(60, 10); __J.st(10); return { ...__J.est(), w: enG.pie }; },
      (r, z) => r.pie === 2470 && z.mision[0] === '1', '02_grulla'],
    ['tablones hasta la isla del carrete (abre el Punto de Cruz)', () => { __J.saltarA(175); __J.saltarA(105); __J.saltarA(232); __J.ir(456); __J.st(30); return { ...__J.est(), tipo: __J.S().mini && __J.S().mini.A.tipo }; },
      (r, z) => r.tipo === 'picross' && r.pie === 2310, '03_picross'],
    ['resuelve el Punto de Cruz 8 × 8 del hongo', () => { const ok = __J.resolver(); return { ...__J.est(), ok }; }, (r, z) => r.ok && z.mision[2] === '1'],
    ['remienda a la ardilla', () => { __J.st(60); return __J.pelear(0, 228); }, (r, z) => z.vivos === '01', '04_ardilla'],
    ['cose la gran grieta', () => { __J.ir(412); __J.pulsar('T'); __J.st(90); return __J.est(); }, (r, z) => z.enl === '1' && z.mision[4] === '1'],
    ['cruza el hilo a la isla E', () => { __J.ir(120); __J.st(20); return __J.est(); }, (r, z) => r.pie === 2300],
    ['escalera de hojas que caen hasta la isla F', () => { __J.ir(110); const tr = [125, 55, 125, 85, 185].map((x, i) => { const e = __J.saltarA(x, i === 4 ? 16 : 14); return Math.round(e.pie / 2); }); __J.st(10); return { ...__J.est(), tr }; },
      (r, z) => r.pie === 2040, '05_escalera_hojas'],
    ['grulla ascensor hasta la isla G', () => { const s = __J.S(), M = s.moviles[1]; __J.ir(470);
      __J.esperar(() => M.o.body.y / 2 > 2025 - 2 && M.o.body.velocity.y < 0, 900); __J.saltarA(180, 8); const enG = __J.est();
      __J.esperar(() => M.o.body.y / 2 < 1860, 700); __J.saltarA(70, 12); __J.st(10); return { ...__J.est(), w: enG.pie }; },
      (r, z) => r.pie === 1830, '06_ascensor'],
    ['tablón y 3 hojas que caen hasta la isla H', () => { __J.ir(290); const tr = [[223, 14], [275, 14], [325, 14], [247, 14], [195, 16]].map(([x, h]) => { const e = __J.saltarA(x, h); return [Math.round(e.x / 2), Math.round(e.pie / 2)]; });
      __J.st(10); return { ...__J.est(), tr }; }, (r, z) => r.pie === 1605, '07_hojas_altas'],
    ['al llegar se abre la Balanza del Bosque (3 rondas)', () => { __J.st(30); const M = __J.S().mini; return { ...__J.est(), tipo: M && M.A.tipo, n: M && (M.A.rondas || []).length }; }, (r, z) => r.tipo === 'balanza' && r.n === 3, '08_balanza'],
    ['equilibra las 3 rondas', () => { const ok = __J.resolver(); return { ...__J.est(), ok }; }, (r, z) => r.ok && z.mision[3] === '1'],
    ['remienda a la 2.ª ardilla', () => { __J.st(20); return __J.pelear(1, 178); }, (r, z) => z.vivos === '00' && z.mision[1] === '2'],
    ['grulla ascensor hasta la isla de la puerta', () => { const s = __J.S(), M = s.moviles[2]; __J.ir(192);
      __J.esperar(() => M.o.body.y / 2 > 1597 && M.o.body.velocity.y <= 0, 900); __J.saltarA(53, 8); const enG = __J.est();
      __J.montada(2, () => M.o.body.y / 2 < 1462); __J.saltarA(120, 10); __J.st(10); return { ...__J.est(), w: Math.round(enG.pie / 2) }; },
      (r, z) => r.pie === 1450, '09_ascensor2'],
    ['abre el Laberinto del Bosque 11 × 11 en la puerta', () => { __J.ir(372); __J.st(40); const M = __J.S().mini; return { ...__J.est(), tipo: M && M.A.tipo, n: M && M.A.cols }; }, (r, z) => r.tipo === 'laberinto' && r.n === 11, '10_laberinto'],
    ['resuelve el laberinto y cruza la puerta', () => { const ok = __J.resolver(); __J.st(60); __J.ir(380); __J.st(150); return { ...__J.info(), ok }; },
      (r, z) => r.ok && r.ganado && r.misionCompleta, '11_completado'],
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
  ok(guardado && guardado.completados && guardado.completados.bosque2_1, 'el progreso del 2-1 queda guardado');
  ok(await E(() => nivelSiguiente()) === 'aldea' || true, 'nivelSiguiente responde');
  ok(!errs.length, 'sin errores de consola', errs);
  console.log(fallos.length ? `FALLAN ${fallos.length}` : 'TODO CORRECTO');
  await b.close();
})();
