// PRUEBA del murciélago (nivel 1-2): vuela; si Lumi está debajo chilla (aviso) y se lanza en picada; si la alcanza le
// quita 1 corazón y vuelve a su altura; la aguja lo golpea cuando baja; a los 2 golpes se remienda y suelta 3 monedas.
const { chromium } = require('playwright'); const fs = require('fs');
const [, , J, OUT] = process.argv; fs.mkdirSync(OUT, { recursive: true });
const res = [], ok = (c, m, d) => { res.push({ ok: !!c, msg: m, d }); console.log((c ? '  ✓ ' : '  ✗ ') + m + (d !== undefined ? ' ' + JSON.stringify(d) : '')); };
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 720, height: 1280 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + J + '/index.html'); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { Save.load(); __g.scene.getScenes(true).forEach(s => __g.scene.stop(s.sys.settings.key)); __g.scene.start('Game', { level: 'puntada' }); });
  await pg.waitForTimeout(2500);
  const E = (f, a) => pg.evaluate(f, a);
  await E(() => { const g = __g, s = g.scene.getScene('Game'); g.loop.sleep(); window.T = performance.now(); s.tweens.getDelta = () => 16.667;
    window.st = n => { for (let i = 0; i < n; i++) { T += 16.667; g.loop.now = T; g.loop.delta = 16.667; g.headlessStep(T, 16.667); } };
    window.dib = () => { g.renderer.preRender(); s.sys.render(g.renderer); g.renderer.postRender(); };
    window.GS = () => s; for (let k = 0; k < 20 && s.talking; k++) { s.talkNext && s.talkNext(); st(3); }
    s.energy = 999; s.sew(s.L.links[0]); st(90); for (let k = 0; k < 20 && s.talking; k++) { s.talkNext && s.talkNext(); st(3); } });
  ok(await E(() => GS().criaturas.length === 2 && GS().criaturas[0].c.tipo === 'murcielago' && ['vuelo', 'aviso', 'picada', 'regreso'].includes(GS().criaturas[0].estado)), 'en 1-2 hay un murciélago volando', await E(() => GS().criaturas[0].estado));
  // Lumi quieta en el puente, debajo del murciélago
  const h0 = await E(() => { const s = GS(); s.player.body.reset(2 * 300, 2 * 2060); st(5); return s.hearts; });
  const estados = await E(() => { const s = GS(), e = s.criaturas[0], v = new Set(); for (let i = 0; i < 400 && s.hearts === GS().hearts && !v.has('herida'); i++) { st(1); v.add(e.estado); if (s.hearts < 99 && s.time.now < s.invulHasta) v.add('herida'); } return [...v]; });
  await E(() => dib()); await pg.screenshot({ path: OUT + '/1_picada.png' });
  ok(estados.includes('aviso') && estados.includes('picada'), 'al ver a Lumi debajo chilla (aviso) y se lanza en picada', estados);
  ok(await E(h => GS().hearts === h - 1, h0), 'la picada le quita 1 corazón a Lumi');
  const tras = await E(() => { const s = GS(), e = s.criaturas[0]; s.player.body.reset(2 * 60, 2 * 2290); st(150); return { estado: e.estado, y: Math.round(e.y) }; });
  ok(tras.estado === 'vuelo' && Math.abs(tras.y - 1930) < 10, 'después vuelve a su altura y sigue volando', tras);
  // golpes: se pone delante de Lumi como en plena picada y Lumi ataca
  const vidas = await E(() => { const s = GS(), e = s.criaturas[0], out = [];
    for (let k = 0; k < 2; k++) { s.invulHasta = s.time.now + 99999; e.estado = 'picada'; e.t = s.time.now; e.x = s.player.x / 2 + 26; e.y = s.player.body.center.y / 2; e.meta = { x: e.x, y: e.y }; st(1); s.facing = 1; s.attackUntil = 0; s.attack(); out.push(e.vida); st(40); }
    return out; });
  ok(vidas[0] < 40 && vidas[0] >= 14, 'la aguja le quita 22–26 de vida', vidas);
  await E(() => dib()); await pg.screenshot({ path: OUT + '/2_remendado.png' });
  ok(await E(() => !GS().criaturas[0].vivo), 'a los 2 golpes queda remendado', vidas);
  const m0 = await E(() => GS().coinsGot);
  await E(() => { const s = GS(); st(60); s.coinItems.slice(-3).forEach(c => { s.player.body.reset(c.x, c.y); st(3); }); });
  ok((await E(() => GS().coinsGot)) >= m0 + 3, 'suelta 3 monedas sobre el puente', [m0, await E(() => GS().coinsGot)]);
  ok(!errs.length, 'sin errores', errs);
  fs.writeFileSync(OUT + '/murcielago.json', JSON.stringify({ pasos: res, errores: errs }, null, 1));
  console.log(res.every(r => r.ok) ? 'TODO CORRECTO' : res.filter(r => !r.ok).length + ' FALLOS');
  await b.close();
})();
