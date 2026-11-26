"""IDIOMAS: mete en index.html la tabla de traducciones (traducciones.tsv: español · inglés · portugués) y el traductor.
Todo texto que el juego pone en pantalla (Phaser Text) pasa por T(): busca la frase exacta; si no, una plantilla con {0}…;
si no, la parte por saltos de línea y separadores « · ». Lo que no encuentre se queda en español (y se apunta en
window.__sinTraducir para revisarlo). Se puede volver a correr cuantas veces haga falta.
Uso: python3 -I herramientas/idiomas/aplicar_idiomas.py"""
import os, json, re
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(D, '..', '..')
rows = []
for l in open(os.path.join(D, 'traducciones.tsv'), encoding='utf8'):
    if not l.strip() or l.startswith('#'): continue
    es, en, pt = [x.replace('\\n', '\n') for x in l.rstrip('\n').split('\t')]
    rows.append([es, en, pt])
JS = """<!-- IDIOMAS -->
<script>
// ---------- IDIOMAS (español · English · português) ----------
// Tabla generada por herramientas/idiomas/aplicar_idiomas.py desde traducciones.tsv. NO editar a mano aquí.
const IDIOMAS = ['es', 'en', 'pt'], NOMBRE_IDIOMA = { es: 'Español', en: 'English', pt: 'Português' };
const TRAD = %s;
const Idioma = {
  actual: 'es', mapa: { en: new Map(), pt: new Map() }, plantillas: { en: [], pt: [] },
  iniciar() {
    for (const [es, en, pt] of TRAD) {
      this.mapa.en.set(es, en); this.mapa.pt.set(es, pt);
      if (/\\{\\d\\}/.test(es)) {
        const re = new RegExp('^' + es.replace(/[.*+?^$()|[\\]\\\\]/g, '\\\\$&').replace(/\\{(\\d)\\}/g, '(?<g$1>[\\\\s\\\\S]+?)') + '$');
        this.plantillas.en.push([re, en]); this.plantillas.pt.push([re, pt]);
      }
    }
  },
  // idioma guardado; la primera vez, el del teléfono (si es inglés o portugués)
  elegir(d) {
    let l = d && d.idioma;
    if (!l) { const n = (navigator.languages && navigator.languages[0] || navigator.language || 'es').slice(0, 2).toLowerCase();
      l = !navigator.webdriver && IDIOMAS.includes(n) ? n : 'es'; }
    this.actual = IDIOMAS.includes(l) ? l : 'es';
    try { document.documentElement.lang = this.actual; } catch (e) {}
  },
  t(s, prof = 0) {
    if (this.actual === 'es' || typeof s !== 'string' || !s || prof > 4) return s;
    const L = this.actual, m = this.mapa[L], d = m.get(s);
    if (d !== undefined) return d;
    for (const [re, tpl] of this.plantillas[L]) { const r = re.exec(s); if (r) return tpl.replace(/\\{(\\d)\\}/g, (_, i) => { const v = r.groups['g' + i]; return /[A-Za-zÁÉÍÓÚáéíóúñ]{2}/.test(v) ? this.t(v, prof + 1) : v; }); }
    for (const sep of ['\\n', '   ·   ', '  ·  ', ' · ', '   ']) if (s.includes(sep)) return s.split(sep).map(p => this.t(p, prof + 1)).join(sep);
    const b = s.trim(); if (b !== s && b) return s.replace(b, this.t(b, prof + 1));
    let r = /^«([\\s\\S]+)»$/.exec(s); if (r) return '“' + this.t(r[1], prof + 1) + '”';
    r = /^([\\s\\S]+?) (\\(\\d+\\/\\d+\\))$/.exec(s); if (r) return this.t(r[1], prof + 1) + ' ' + r[2];
    if (/[a-záéíóúñ]{3}/i.test(s)) (window.__sinTraducir = window.__sinTraducir || new Set()).add(s);
    return s;
  }
};
Idioma.iniciar();
function T(s) { return Idioma.t(s); }
// todo texto de Phaser se traduce al ponerlo (también al crearlo: el constructor llama a setText)
(function () { const P = Phaser.GameObjects.Text.prototype, orig = P.setText;
  P.setText = function (v) { return orig.call(this, typeof v === 'string' ? Idioma.t(v) : v); }; })();
</script>
<!-- /IDIOMAS -->
""" % json.dumps(rows, ensure_ascii=False)
p = os.path.join(R, 'index.html'); t = open(p, encoding='utf8').read()
if '<!-- IDIOMAS -->' in t:
    a = t.index('<!-- IDIOMAS -->'); b = t.index('<!-- /IDIOMAS -->') + len('<!-- /IDIOMAS -->\n'); t = t[:a] + JS + t[b:]
else:
    k = t.index('<script src="lib/phaser.min.js"></script>\n') + len('<script src="lib/phaser.min.js"></script>\n'); t = t[:k] + JS + t[k:]
open(p, 'w', encoding='utf8').write(t); print(len(rows), 'textos ·', len(JS) // 1024, 'KB')
