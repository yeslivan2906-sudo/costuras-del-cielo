// PRUEBA de la animación unificada: en el nivel Aldea se fuerza cada estado (quieta, caminar, saltar, coser, aguja) y
// se anotan las texturas que pone el juego paso a paso; también que Nube anima y que el cuerpo de colisión no cambia.
// Uso: node animacion_unificada.js <carpeta del juego> <salida.json>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , JUEGO, OUT] = process.argv;
const res = [], ok = (c, m, d) => { res.push({ ok: !!c, msg: m, d }); console.log((c ? '  ✓ ' : '  ✗ ') + m + (d !== undefined ? ' ' + JSON.stringify(d) : '')); };
(async () => {
  const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: 720, height: 1280 } })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + JUEGO + '/index.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3000);
  await pg.evaluate(() => __g.scene.getScene('Title').scene.start('Game', { level: 'aldea' })); await pg.waitForTimeout(2500);
  const E = (f, a) => pg.evaluate(f, a);
  await E(() => { __g.loop.sleep(); window.T = performance.now(); window.tick = () => { T += 16.667; __g.loop.now = T; __g.loop.delta = 16.667; __g.loop.rawDelta = 16.667; __g.headlessStep(T, 16.667); }; const s = __g.scene.getScene('Game'); s.tweens.getDelta = () => 16.667;
    window.paso = (n, f) => { const t = []; for (let i = 0; i < n; i++) { f && f(s, i); tick(); t.push(s.player.texture.key); } return t; };
    window.cuerpo = () => { const p = s.player, bd = p.body; return [bd.width, Math.round(bd.height / p.scaleY), Math.round(bd.x - p.x), Math.round((bd.bottom - p.y) / p.scaleY)]; };
    s.player.body.reset(s.player.x, s.player.y); });
  const uniq = a => [...new Set(a)];
  // al pararse anima el reposo 1,5 s (5 cuadros) y luego se queda quieta en la pose 1 (pedido de Yesli)
  const quieta = await E(() => { const s = __g.scene.getScene('Game'); s.wasMoving = true; paso(1); return paso(88); });
  ok(uniq(quieta).length >= 5 && quieta.every(k => /_idle\d$/.test(k)), 'quieta: al pararse anima el reposo', uniq(quieta));
  const quieta2 = await E(() => { paso(10); return paso(60); });
  ok(uniq(quieta2).length === 1 && /_idle1$/.test(quieta2[0]), 'quieta: después se queda en la pose 1, sin moverse', uniq(quieta2));
  const cuerpoQ = await E(() => cuerpo());
  const camina = await E(() => { const s = __g.scene.getScene('Game'); s.keys.D.isDown = true; const t = paso(60); s.keys.D.isDown = false; return t; });
  ok(uniq(camina.slice(5)).length === 8, 'caminar: 8 cuadros', uniq(camina.slice(5)));
  const cuerpoC = await E(() => { paso(30); return cuerpo(); });
  const salta = await E(() => { const s = __g.scene.getScene('Game'); s.keys.W.isDown = true; const t = paso(70, (sc, i) => { if (i === 12) sc.keys.W.isDown = false; }); return t; });
  ok(['jump1', 'jump2', 'jump3'].every(k => salta.some(x => x.endsWith(k))), 'saltar: despegue, subida y caída (1→2→3)', uniq(salta));
  const ordenSalto = uniq(salta.filter(k => /jump/.test(k)).map(k => k.slice(-1))).join('');
  ok(ordenSalto === '123', 'saltar: en orden', ordenSalto);
  const cose = await E(() => { const s = __g.scene.getScene('Game'); paso(40); s.sewUntil = s.time.now + 650; return paso(42); });
  ok(['sew1', 'sew2', 'sew3', 'sew4'].every(k => cose.some(x => x.endsWith(k))), 'coser: 4 cuadros', uniq(cose));
  const aguja = await E(() => { const s = __g.scene.getScene('Game'); paso(20); s.attack(); return paso(18); });
  ok(['attack1', 'attack2', 'attack3'].every(k => aguja.some(x => x.endsWith(k))), 'aguja: 3 cuadros', uniq(aguja));
  const nube = await E(() => { const s = __g.scene.getScene('Game'); const t = []; for (let i = 0; i < 60; i++) { tick(); t.push(s.nube.texture.key); } return [...new Set(t)]; });
  ok(nube.length === 6, 'Nube: anima sus 6 cuadros de vuelo', nube);
  const cuerpoF = await E(() => { paso(60); return cuerpo(); });
  ok(JSON.stringify(cuerpoQ) === JSON.stringify(cuerpoF), 'cuerpo de colisión igual antes y después (ancho, alto, posición)', { quieta: cuerpoQ, caminando: cuerpoC, final: cuerpoF });
  ok(await E(() => { const s = __g.scene.getScene('Game'); return s.player.body.width === 36 && Math.round(s.player.body.height / s.player.scaleY) === 68; }), 'cuerpo 36 × 68 como siempre (sin contar la respiración scaleY que ya tenía el juego)');
  const capuchas = await E(() => ['clasica', 'estrella', 'aurora', 'hoja', 'noche'].every(c => ['idle1', 'idle6', 'walk8', 'jump3', 'sew4', 'attack3'].every(p => __g.textures.exists('lumi_' + c + '_' + p))));
  ok(capuchas, 'las 5 capuchas tienen todos los cuadros');
  ok(!errs.length, 'sin errores', errs);
  fs.writeFileSync(OUT, JSON.stringify({ pasos: res, errores: errs }, null, 1));
  console.log(res.every(r => r.ok) ? 'TODO CORRECTO' : res.filter(r => !r.ok).length + ' FALLOS');
  await b.close();
})();
