"""IDIOMAS: saca del juego (index.html) todos los textos en español que se ven en pantalla.
Las plantillas `…${x}…` quedan como «…{0}…». Salida: herramientas/idiomas/textos_es.json
Uso: python3 -I herramientas/idiomas/extraer_textos.py"""
import re, json, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
t = open(os.path.join(R, 'index.html'), encoding='utf8').read()
a = t.index('/* =========================================================\n   COSTURAS DEL CIELO')
code = re.sub(r'"data:[^"]+"', '""', t[a:])
code = re.sub(r'/\*[\s\S]*?\*/', '', code)
code = re.sub(r'(?m)(^|[^:\'"`\\])//[^\n]*', r'\1', code)   # comentarios de línea (no las URLs)
out = []
def tpl(s):
    n = [0]
    def r(m): k = '{%d}' % n[0]; n[0] += 1; return k
    return re.sub(r'\$\{(?:[^{}]|\{[^{}]*\})*\}', r, s)
for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`((?:[^`\\]|\\.)*)`", code):
    s = m.group(1) if m.group(1) is not None else m.group(2) if m.group(2) is not None else tpl(m.group(3))
    s = s.replace("\\'", "'").replace('\\"', '"').replace('\\n', '\n')
    if len(s) < 2 or s.startswith(('a/', '#', 'http', 'assets/', 'lumi_')) or re.fullmatch(r'[\w./:,\- ]*\.(png|jpg|mp4|js|json)', s): continue
    if re.fullmatch(r'[a-z0-9_:\-./]+', s): continue                       # ids y claves
    if re.search(r'(MS|UI|serif|sans-serif|Verdana|Georgia|easeInOut|easeOut|easeIn|Linear)\b', s): continue
    if re.fullmatch(r'[A-Z0-9,_ ]+', s) and len(s) < 12: continue          # teclas
    if not re.search(r'[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}', s): continue
    if s in ('Game', 'Title', 'Boot', 'Mundos', 'Capitulo', 'Galeria', 'Tienda', 'Opciones', 'Text', 'Image', 'Container', 'Graphics'): 
        if s != 'Opciones': continue
    out.append(s)
out = list(dict.fromkeys(out))
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'textos_es.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=0)
print(len(out), sum(len(x) for x in out))
