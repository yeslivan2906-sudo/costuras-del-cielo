// PRUEBA DEL 1-5 «El Corazón del Telar»: se juega entero con las MISMAS entradas que un jugador (◀ ▶ ↑, carrete, aguja),
// a 60 Hz exactos. Los minijuegos se resuelven con sus propias funciones de toque (las mismas que llaman los dedos).
// Uso: node nivel_1-5.js <phaser.min.js | -> <carpeta del juego> <salida>
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
  J.dialogo = () => { for (let i = 0; i < 40 && S().talking && !S().mini; i++) { if (S().talkNext) S().talkNext(); J.st(40); } return J.est(); };
  // pelea con Eryndor jugando con los mismos botones: esquiva lo que tiembla, se pone debajo cuando está cansado y golpea,
  // va al nudo cuando hay escudo (y lo resuelve), vuelve a subir si cae y se defiende de los ayudantes de la fase 3
  J.pelearJefe = (max = 9000) => { const s = S(), B = s.jefe; const log = { caidas: 0, remendada: 0, golpes: 0 };
    let hp = s.hearts;
    for (let i = 0; i < max && !B.vencido; i++) {
      if (s.talking && !s.mini) { if (s.talkNext) s.talkNext(); J.st(20); continue; }
      if (s.mini) { const M = s.mini; M.solucion.forEach(c => M.tocar(c)); J.st(130); continue; }
      const e = J_e(); const lx = e.x / 2, pie = e.pie / 2;
      if (s.hearts > hp) hp = s.hearts; if (s.hearts < hp) { hp = s.hearts; } 
      if (pie > 1760) { log.caidas++; if (pie > 1855) { J.ir(80); J.saltarA(140); } else J.saltarA(140); J.saltarA(170, 14); continue; }
      const bajo = s.descosidos.find(D => D.d.jefe && D.estado !== 'firme' && lx > D.d.x - 6 && lx < D.d.x + D.d.w + 6);
      let k = {};
      const ayud = s.criaturas.find(c => c.vivo && !c.dormida && c.c.fase3 && Math.abs(c.x - lx) < 70);
      if (bajo) { const meta = lx < 180 ? 28 : 332; k = meta < lx ? { L: true } : { R: true }; }
      else if (B.escudo) { if (Math.abs(lx - 30) > 4) k = lx > 30 ? { L: true } : { R: true }; }
      else if (ayud && (ayud.c.tipo !== 'lobo' || ayud.estado !== 'embestida')) { const d = ayud.x - lx; if (Math.abs(d) > 50) k = d > 0 ? { R: true } : { L: true }; else if (s.time.now > s.attackUntil + 150) { s.facing = Math.sign(d) || 1; k = { N: true }; } }
      else { const d = B.x - lx, cansado = B.accion && B.accion.e === 'cansado';
        const objetivo = cansado ? B.x - Math.sign(d || 1) * 30 : (B.x > 180 ? B.x - 60 : B.x + 60);
        const dx = Phaser.Math.Clamp(objetivo, 20, 340) - lx;
        if (cansado && Math.abs(d) < 50 && s.time.now > s.attackUntil + 150) { s.facing = Math.sign(d) || 1; k = { N: true }; log.golpes++; }
        else if (Math.abs(dx) > 6) k = dx > 0 ? { R: true } : { L: true };
        else if (!cansado && Math.abs(d) < 75 && s.time.now > s.attackUntil + 150 && e.suelo) { s.facing = Math.sign(d) || 1; k = { J: true }; }
        else if (!cansado && !e.suelo && Math.abs(d) < 70 && Math.abs(B.y - e.y / 2) < 45 && s.time.now > s.attackUntil + 150) { s.facing = Math.sign(d) || 1; k = { N: true }; } }
      J.keys(k); J.st(1); J.keys(); }
    J.st(60); return { vencido: B.vencido, vida: B.vida, fase: B.fase, ...log }; };
  const J_e = () => J.est();
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
  await pg.evaluate(() => { __g.scene.getScenes(true).forEach(s => s.scene.key !== 'Game' && __g.scene.stop(s.scene.key)); __g.scene.start('Game', { level: 'corazon' }); });
  await pg.waitForTimeout(1500);
  await pg.evaluate(`(${LIB})()`); await pg.evaluate(EXTRA);
  const E = f => pg.evaluate(f);
  const foto = async n => { await E(() => __J.dibuja()); await pg.screenshot({ path: `${OUT}/capturas/${n}.png` }); };
  await E(() => { __J.dormir(); __J.st(150); });
  let e = await E(() => __J.est()), i = await E(() => __J.info());
  ok(i.nivel === 'corazon', 'abre el 1-5 El Corazón del Telar'); ok(i.texturasFaltantes === 0, 'todas las texturas existen', i.texturasFaltantes);
  const U = o => ({ x: Math.round(o.x / 2), pie: Math.round(o.pie / 2), suelo: o.suelo, puente: o.puente });
  const P = async f => U(await E(f));
  ok(e.suelo && Math.round(e.pie / 2) === 2600, 'Lumi aparece de pie en la isla de inicio', U(e));
  await foto('01_inicio');
  const snap = () => E(() => { const s = __J.S(); return { corazones: s.hearts, vivos: s.criaturas.map(c => c.vivo ? 1 : 0).join(''), enl: s.L.links.map(l => l.done ? 1 : 0).join(''),
    mision: s.quest.tasks.map(t => t.n).join(''), mini: !!s.mini, control: s.control && s.control.x, corazonSecreto: s.collected.heart, cristal: s.collected.crystal,
    colgado: !!s.colgado, jefe: s.jefe && { vida: s.jefe.vida, fase: s.jefe.fase, activo: s.jefe.activo, escudo: s.jefe.escudo, acc: s.jefe.accion && s.jefe.accion.e } }; });
  const pasos = [
    ['fuelle', () => { __J.ir(380); return __J.saltarA(212, 16, 300); }, (r, z) => r.pie === 2400],
    ['sube a la rueda', () => { let j = -1; __J.esperar(() => { j = __J.S().moviles.findIndex((q, i) => { const t = __J.tab(i); return t.top > 2330 && t.x > 118 && t.x < 140; }); return j >= 0; }, 900);
        const e = __J.saltarA(__J.tab(j).x + 10, 12); window.__j = j; return e; }, () => true],
    ['la rueda la sube', () => __J.montar(window.__j, (x, top) => { const t = __J.S().criaturas[0]; return top < 2242 && x > 140 && t.estado === 'volar' && t.x > 290; }, 3000), () => true],
    ['salta a A', () => __J.saltarA(262, 16), (r, z) => r.pie === 2190],
    ['tijeras', () => __J.pelearCon(0), (r, z) => z.vivos[0] === '0'],
    ['P2', () => { __J.ir(500); return __J.saltarA(205); }, (r, z) => r.pie === 2130],
    ['P3 (se descose)', () => __J.saltarA(275), (r, z) => Math.abs(r.pie - 2070) < 6],
    ['P4', () => __J.saltarA(235), (r, z) => r.pie === 2010],
    ['W: carrete de control', () => __J.saltarA(160, 10), (r, z) => r.pie === 1960 && z.control === 150, '02_w'],
    ['el bastidor abre el «Punto de cruz» de 7 × 7', () => { __J.ir(250); __J.st(20); return { ...__J.est(), abierto: !!__J.S().mini && __J.S().mini.A.tipo === 'picross' }; }, (r, z) => r.abierto, '02b_picross'],
    ['resuelve el punto de cruz', () => ({ ...__J.est(), ok: __J.resolver() }), (r, z) => r.ok && z.mision[1] === '1'],
    ['columpio', () => { __J.ir(390); for (let k = 0; k < 90 && !__J.S().colgado; k++) { __J.keys({ R: true, J: k < 16 }); __J.st(1); } __J.keys(); __J.st(2); return __J.est(); }, (r, z) => z.colgado],
    ['suelta hacia LV', () => { const s = __J.S(); for (let k = 0; k < 600 && s.colgado; k++) { const C = s.colgado, th = C.th, w = C.w; __J.keys({ R: w > 0, L: w < 0, J: th > 0.45 && w > 0 }); __J.st(1); __J.keys({ R: w > 0, L: w < 0 }); }
        __J.keys({ R: true }); for (let i = 0; i < 80 && !__J.est().suelo; i++) __J.st(1); __J.keys(); __J.st(3); return __J.est(); }, (r, z) => r.pie === 1900],
    ['en la isla de la palanca: Laberinto en la Niebla 9 × 9', () => { __J.ir(684); __J.st(20); const M = __J.S().mini; return { ...__J.est(), cols: M && M.cols, niebla: M && !!M.A.niebla }; }, (r, z) => r.cols === 9 && r.niebla, '03b_niebla'],
    ['lo cruza', () => ({ ...__J.est(), ok: __J.resolver() }), (r, z) => r.ok && z.mision[2] === '1'],
    ['cose el puente', () => { __J.ir(615); __J.pulsar('T'); __J.st(90); return __J.est(); }, (r, z) => z.enl === '1', '03_puente'],
    ['cruza a Q', () => __J.ir(80), (r, z) => r.pie === 1860 && z.control === 40],
    ['sube a la arena: Eryndor habla', () => { __J.saltarA(140); __J.saltarA(170, 14); __J.st(12); return { ...__J.est(), hablando: __J.S().talking }; }, (r, z) => r.hablando || z.jefe.activo, '04_eryndor_habla'],
    ['empieza la pelea: barra de vida', () => { __J.dialogo(); __J.st(30); return __J.est(); }, (r, z) => z.jefe.activo === true && r.pie === 1750, '05_pelea'],
    ['pelea (fase 1 → 2)', () => { const s = __J.S(); for (let i = 0; i < 40 && s.jefe.fase === 1; i++) __J.pelearJefe(300); return { ...__J.est(), msg: JSON.stringify({ vida: s.jefe.vida, fase: s.jefe.fase }) }; }, (r, z) => z.jefe.fase >= 2, '06_fase2'],
    ['pelea (fase 2 → 3: escudo)', () => { const s = __J.S(); for (let i = 0; i < 40 && s.jefe.fase === 2; i++) __J.pelearJefe(300); __J.st(90); return __J.est(); }, (r, z) => z.jefe.fase === 3, '07_escudo'],
    ['pelea hasta remendarlo', () => __J.pelearJefe(20000), (r, z) => r.vencido, '08_remendado'],
    ['diálogo final', () => { __J.st(150); __J.dialogo(); __J.st(30); return __J.est(); }, (r, z) => z.mision === '111111' || z.mision === '111110'],
    ['cruza la puerta: Fin del Capítulo I', () => { const s = __J.S(); if (__J.est().pie / 2 > 1760) { __J.ir(80); __J.saltarA(140); __J.saltarA(170, 14); } __J.ir(680); __J.st(120); return { ...__J.est(), fin: !!s.finUI }; }, (r, z) => r.fin, '09_fin_capitulo'],
    ['«Continuar» lleva al resumen del nivel', () => { __J.S().finContinuar(); __J.st(60); return { ...__J.info(), panel: __J.S().children.list.some(o => (o.type === 'Text' && o.text === '¡Nivel completado!') || (o.type === 'Image' && o.texture.key === 'a/ui/res_panel')) }; }, (r, z) => r.panel, '10_completado'],
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
  ok(guardado && guardado.completados && guardado.completados['1-5'], 'el progreso del 1-5 queda guardado');
  ok(!errs.length, 'sin errores de consola', errs);
  console.log(fallos.length ? `FALLAN ${fallos.length}` : 'TODO CORRECTO');
  await b.close();
})();
