// PRUEBA EN ANDROID · Aldea G2 (solo en index_prueba_android.html; el juego es el mismo que index.html).
// Se juega con los controles reales. El panel apunta solo: hitos del recorrido (G1 → repisas → mercado G2 → coser →
// puente → casa G3 → puerta), FPS durante TODA la partida, tramos lentos por zona, y que la decoración no tiene física.
// Al llegar a la puerta (o con «Terminar») muestra el informe con botón para copiarlo.
(() => {
  const css = 'position:fixed;z-index:9;font:13px/1.35 monospace;color:#fff;background:rgba(10,8,20,.82);border-radius:10px;padding:8px 10px';
  const caja = document.createElement('div'); caja.style.cssText = css + ';left:6px;right:6px;top:6px;white-space:pre-wrap;pointer-events:none';
  const btn = document.createElement('button'); btn.textContent = '▶ Empezar prueba (juega la Aldea hasta la puerta)';
  btn.style.cssText = css + ';left:50%;bottom:24px;transform:translateX(-50%);border:2px solid #f2c94c;font-weight:bold;font-size:16px;width:86%';
  const fin = document.createElement('button'); fin.textContent = 'Terminar'; fin.style.cssText = css + ';display:none;right:8px;top:118px;border:1px solid #f2c94c;font-size:13px;pointer-events:auto';
  const copiar = document.createElement('button'); copiar.textContent = 'Copiar resultados'; copiar.style.cssText = css + ';display:none;left:50%;bottom:24px;transform:translateX(-50%);border:2px solid #9fe08a;font-size:17px';
  const poner = () => { document.body.append(caja, btn, fin, copiar); caja.textContent = 'Prueba Aldea G2 · pulsa «Empezar» y juega normal: habla con Tilo, coge el hilo, cruza al mercado, cose el puente y entra por la puerta.'; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poner); else poner();

  const entorno = async () => {   // mismo criterio que el Medidor v2: «Android real» solo si todas las señales coinciden
    const ua = navigator.userAgent, uad = navigator.userAgentData;
    let hi = {}; try { if (uad && uad.getHighEntropyValues) hi = await uad.getHighEntropyValues(['platform', 'platformVersion', 'model', 'fullVersionList']); } catch (e) {}
    let gpu = 'desconocida';
    try { const c = document.createElement('canvas'), g = c.getContext('webgl'); const x = g && g.getExtension('WEBGL_debug_renderer_info');
      gpu = g ? (x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)) : 'sin WebGL'; } catch (e) {}
    const pl = hi.platform || (uad && uad.platform) || null;
    const so = pl ? pl + (hi.platformVersion ? ' ' + hi.platformVersion : '') : /Android ([\d.]+)/.test(ua) ? 'Android ' + RegExp.$1 : /Linux/.test(ua) ? 'Linux' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : 'desconocido';
    const nav = (hi.fullVersionList || (uad && uad.brands) || []).filter(b => !/Not.?A.?Brand/i.test(b.brand)).map(b => b.brand + ' ' + b.version).join(', ')
      || (/SamsungBrowser\/([\d.]+)/.test(ua) ? 'Samsung Internet ' + RegExp.$1 : /Chrome\/([\d.]+)/.test(ua) ? 'Chrome ' + RegExp.$1 : 'desconocido');
    const avisos = [];
    if (navigator.webdriver) avisos.push('navegador automatizado');
    if (/HeadlessChrome/.test(ua + nav)) avisos.push('HeadlessChrome');
    if (/SwiftShader|llvmpipe|softpipe|Software/i.test(gpu)) avisos.push('GPU por software');
    const dice = /Android/.test(ua);
    if (dice && pl && pl !== 'Android') avisos.push('pantalla móvil simulada (plataforma real ' + pl + ')');
    if (dice && !(navigator.maxTouchPoints > 0)) avisos.push('sin pantalla táctil');
    const android = dice && (!pl || pl === 'Android') && navigator.maxTouchPoints > 0 && !avisos.length;
    return { android, tipo: android ? 'ANDROID REAL' : dice ? 'ANDROID SIMULADO (no es un dispositivo)' : 'NO ES ANDROID — ' + so, so, nav, gpu, modelo: hi.model || null, avisos, ua };
  };

  btn.onclick = async () => {
    btn.style.display = 'none'; fin.style.display = 'block';
    try { Save.load(); Save.aj().tutoriales = false; } catch (e) {}
    __g.scene.getScenes(true).forEach(sc => { if (sc.sys.settings.key !== 'Game') __g.scene.stop(sc.sys.settings.key); });
    __g.scene.start('Game', { level: 'aldea' });
    let s; for (let i = 0; i < 80; i++) { await new Promise(r => setTimeout(r, 250)); s = __g.scene.getScene('Game'); if (s && s.sys.isActive() && s.L && s.L.id === 'aldea' && s.player && s.decoAldea) break; }
    const t0 = performance.now(), H = {}, zonas = {}, d = []; let ant = null, fuera = null, terminado = false;
    const deco = (s.decoAldea || []).length, decoFisica = (s.decoAldea || []).filter(o => o.body).length;
    const zona = (x, y) => x < 1040 && y > 1100 ? 'G1' : x < 1400 && y > 900 ? 'repisas' : x >= 1400 && x < 1800 && y < 900 ? 'G2 mercado' : x >= 1800 && x < 2120 ? 'puente' : x >= 2120 && y < 900 ? 'G3 casa' : 'en el aire';
    const seg = v => ((v - t0) / 1000).toFixed(1) + ' s';
    const paso = now => {
      if (terminado) return;
      if (ant !== null) { const dt = now - ant; if (!document.hidden && dt < 1000) { d.push(dt); const z = zona(s.player.x, s.player.body.bottom); (zonas[z] = zonas[z] || []).push(dt); } }
      ant = now;
      const p = s.player.body, x = p.center.x, y = p.bottom;
      if (!H.repisas && y <= 1082 && x > 1076 && x < 1384) H.repisas = seg(now);
      if (!H.mercado_G2 && y <= 882 && x > 1400 && x < 1800) H.mercado_G2 = seg(now);
      if (!H.puente_cosido && s.L.links[0].done) H.puente_cosido = seg(now);
      if (!H.cruza_puente && s.onBridge) H.cruza_puente = seg(now);
      if (!H.casa_G3 && y <= 882 && x > 2120) H.casa_G3 = seg(now);
      if (!H.puerta && s.won) { H.puerta = seg(now); setTimeout(informe, 800); }
      if (y > 1500 && fuera === null) fuera = seg(now);
      const r = d.length > 30 ? d.slice(-60) : d, m = r.reduce((a, b) => a + b, 0) / Math.max(1, r.length);
      caja.textContent = `Prueba Aldea G2 · ${zona(x, y)} · ${m ? (1000 / m).toFixed(0) : '—'} FPS\n` +
        ['repisas', 'mercado_G2', 'puente_cosido', 'cruza_puente', 'casa_G3', 'puerta'].map(k => (H[k] ? '✓ ' : '· ') + k.replace('_', ' ')).join('  ');
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
    const res = v => { const o = v.slice().sort((a, b) => a - b), m = o.reduce((a, b) => a + b, 0) / o.length;
      return `${(1000 / m).toFixed(1)} FPS · p95 ${o[Math.floor(o.length * .95)].toFixed(1)} ms · >33 ms: ${o.filter(t => t > 33.4).length} de ${o.length}`; };
    const informe = async () => {
      if (terminado) return; terminado = true; fin.style.display = 'none';
      const E = await entorno();
      const mem = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB' : 'no disponible en este navegador';
      const txt = [`COSTURAS DEL CIELO · PRUEBA ALDEA G2 · ${E.android ? 'ANDROID REAL' : 'REFERENCIA (NO es Android)'}`, new Date().toLocaleString(),
        `Entorno: ${E.tipo} · ${E.so}${E.modelo ? ' · ' + E.modelo : ''} · ${E.nav}`, `GPU: ${E.gpu}`, ...(E.avisos.length ? ['AVISOS: ' + E.avisos.join(' · ')] : []),
        `Pantalla ${screen.width}×${screen.height} · densidad ${devicePixelRatio.toFixed(2)} · lienzo ${__g.canvas.width}×${__g.canvas.height} · ${__g.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'}`,
        `Decoración cargada: ${deco} imágenes · con física: ${decoFisica}`,
        `Hitos: ${['repisas', 'mercado_G2', 'puente_cosido', 'cruza_puente', 'casa_G3', 'puerta'].map(k => k + ' ' + (H[k] || 'NO')).join(' · ')}`,
        `Caídas al vacío: ${fuera ? 'sí (primera a los ' + fuera + ')' : 'ninguna'}`,
        `Partida completa: ${d.length ? res(d) : 'sin datos'}`, ...Object.entries(zonas).filter(([, v]) => v.length > 20).map(([z, v]) => `  ${z}: ${res(v)}`),
        `Memoria JS: ${mem}`, `Agente: ${E.ua}`].join('\n');
      caja.style.pointerEvents = 'auto'; caja.style.userSelect = 'text'; caja.style.borderLeft = '6px solid ' + (E.android ? '#9fe08a' : '#f2994a');
      caja.textContent = txt; window.__resultadosAldea = txt; copiar.style.display = 'block';
      copiar.onclick = async () => { try { await navigator.clipboard.writeText(txt); copiar.textContent = 'Copiado ✓'; } catch (e) {
        const ta = document.createElement('textarea'); ta.value = txt; document.body.append(ta); ta.select(); try { document.execCommand('copy'); copiar.textContent = 'Copiado ✓'; } catch (e2) { copiar.textContent = 'Selecciona el texto y cópialo'; } ta.remove(); } };
    };
    fin.onclick = informe;
  };
})();
