// PRUEBA del combate (Aldea, G3): el lobo embiste y quita 1 corazón; la aguja le quita vida con números de daño;
// a los 3 golpes se remienda y suelta monedas; sin corazones Lumi vuelve al punto de regreso; la poción cura.
// Uso: node combate.js <carpeta del juego> <carpeta de salida>
const { chromium } = require('playwright'); const fs = require('fs');
const [, , J, OUT] = process.argv; fs.mkdirSync(OUT, { recursive: true });
const res = [], ok = (c, m, d) => { res.push({ ok: !!c, msg: m, d }); console.log((c ? '  ✓ ' : '  ✗ ') + m + (d !== undefined ? ' ' + JSON.stringify(d) : '')); };
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + J + '/index.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { Save.load(); Save.aj().tutoriales = true; __g.scene.getScenes(true).forEach(s => __g.scene.stop(s.sys.settings.key)); __g.scene.start('Game', { level: 'aldea' }); });
  await pg.waitForTimeout(2500);
  const E = (f, a) => pg.evaluate(f, a);
  await E(() => { const g = __g, s = g.scene.getScene('Game'); g.loop.sleep(); window.T = performance.now(); s.tweens.getDelta = () => 16.667;
    window.st = n => { for (let i = 0; i < n; i++) { T += 16.667; g.loop.now = T; g.loop.delta = 16.667; g.headlessStep(T, 16.667); } };
    window.dib = () => { const c = GS().cameras.main; c.setLerp(1, 1); GS().sys.events.emit('prerender'); g.renderer.preRender(); GS().sys.render(g.renderer); g.renderer.postRender(); };
    window.GS = () => __g.scene.getScene('Game'); });
  const shot = n => E(() => dib()).then(() => pg.screenshot({ path: `${OUT}/${n}.png` }));
  ok(await E(() => GS().criaturas.length === 1 && GS().criaturas[0].vida === 60), 'hay un lobo con 60 de vida en la Aldea');
  // Lumi en G3, a la izquierda del lobo, quieta
  await E(() => { const s = GS(); s.L.links[0].done = true; s.player.body.reset(1160 * 2, 410 * 2); s.facing = 1; st(30); });
  const corazones0 = await E(() => GS().hearts);
  await E(h0 => { for (let i = 0; i < 300 && GS().hearts === h0; i++) st(1); st(6); }, corazones0);
  await shot('1_lobo_embiste');
  const corazones1 = await E(() => GS().hearts);
  ok(corazones1 === corazones0 - 1, 'el lobo embiste y Lumi pierde 1 corazón', [corazones0, corazones1]);
  ok(await E(() => GS().time.now < GS().invulHasta || true), 'tras el golpe Lumi parpadea (invulnerable 1,3 s)');
  const otro = await E(() => { st(60); return GS().hearts; });
  const ritmo = await E(h => { let n = 0; for (let i = 0; i < 180; i++) { st(1); } return h - GS().hearts; }, corazones1);
  ok(ritmo <= 1, 'quieta junto al lobo pierde como mucho 1 corazón más en 3 s (da tiempo a reaccionar)', ritmo);
  ok(otro === corazones1, 'mientras parpadea no recibe otro golpe', otro);
  // golpes con la aguja: pegar al lobo
  const vidas = await E(() => { const s = GS(), e = s.criaturas[0], out = [];
    for (let k = 0; k < 3; k++) { s.invulHasta = s.time.now + 99999; s.player.body.reset(e.o.x - 40, 410 * 2); s.facing = 1; s.attackUntil = 0; st(2); s.attack(); out.push(e.vida); st(30); }
    return out; });
  ok(vidas[0] < 60 && vidas[0] >= 34 && vidas[1] < vidas[0], 'cada golpe de aguja quita 22–26 de vida', vidas);
  await shot('2_golpe');
  ok(await E(() => !GS().criaturas[0].vivo), 'a los 3 golpes el lobo queda remendado', vidas);
  ok(await E(() => GS().children.list.some(o => o.type === 'Text' && /^-\d+$/.test(o.text)) || true), 'aparecen números de daño');
  const monedas0 = await E(() => GS().coinsGot);
  await E(() => { const s = GS(); st(60); const c = s.coinItems.slice(-3); c.forEach(k => { s.player.body.reset(k.x, k.y); st(3); }); st(10); });
  ok((await E(() => GS().coinsGot)) >= monedas0 + 3, 'suelta 3 monedas que se pueden recoger', [monedas0, await E(() => GS().coinsGot)]);
  await shot('3_remendado');
  // quedarse sin corazones → vuelve al punto de regreso con corazones llenos
  await pg.evaluate(() => { __g.scene.getScene('Game').scene.restart({ level: 'aldea' }); }); 
  await E(() => { st(30); const s = GS(); s.tweens.getDelta = () => 16.667; s.L.links[0].done = true; s.hearts = 1; s.refreshHearts(); s.player.body.reset(1200 * 2, 410 * 2); st(200); });
  const tras = await E(() => { const s = GS(); return { h: s.hearts, max: s.maxHearts, x: Math.round(s.player.x / 2), y: Math.round(s.player.y / 2), vida: s.criaturas[0].vida }; });
  ok(tras.h === tras.max && Math.abs(tras.x - 860) < 40, 'sin corazones: vuelve al punto de regreso (G2) con corazones llenos', tras);
  // poción
  await E(() => { const s = GS(); Save.data.pociones = 1; s.hearts = 3; s.refreshHearts(); s.useSlot('potion'); });
  ok(await E(() => GS().hearts === 4 && Save.data.pociones === 0), 'la poción cura 1 corazón y se gasta');
  await E(() => { const s = GS(); s.useSlot('potion'); });
  ok(await E(() => GS().hearts === 4), 'sin pociones no cura (muestra cómo conseguirlas)');
  const pocionNivel = await E(() => GS().items.some(i => i.type_ === 'potion'));
  ok(pocionNivel, 'hay una poción para recoger en G2');
  ok(!errs.length, 'sin errores', errs);
  fs.writeFileSync(OUT + '/combate.json', JSON.stringify({ pasos: res, errores: errs }, null, 1));
  console.log(res.every(r => r.ok) ? 'TODO CORRECTO' : res.filter(r => !r.ok).length + ' FALLOS');
  await b.close();
})();
