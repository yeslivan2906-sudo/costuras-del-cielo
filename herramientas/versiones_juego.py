"""Versiones de JUEGO de la decoración de la Aldea G2: cada PNG maestro (maestros/village, sin tocar) se reduce una
sola vez (Lanczos, alfa premultiplicado para no oscurecer bordes) a la escala MAYOR con que aparece en el nivel, y se
reescriben en index.html esc (relativa a la versión de juego) y pie (fila de apoyo en la versión de juego).
Así el tamaño en pantalla no cambia y la memoria de texturas baja mucho. Uso: python3 -I herramientas/versiones_juego.py"""
import os, re, json
import numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
html = os.path.join(R, 'index.html'); t = open(html).read()
pat = re.compile(r"\{ id: '([a-z_0-9]+)', (?!carpeta)x: ([\d.]+), suelo: (\d+), esc: ([\d.]+), pie: (\d+)")
filas = pat.findall(t)
mx = {}
for i, x, su, e, p in filas: mx[i] = max(mx.get(i, 0), float(e))
inf = {}
for i, m in mx.items():
    im = Image.open(os.path.join(R, f'maestros/village/{i}.png')).convert('RGBA')
    a = np.array(im).astype(float); a[..., :3] *= a[..., 3:] / 255
    W, H = round(im.width * m), round(im.height * m)
    ch = [Image.fromarray(a[..., c].astype(np.float32), 'F').resize((W, H), Image.LANCZOS) for c in range(4)]
    o = np.dstack([np.array(c) for c in ch]); o[..., 3] = np.clip(o[..., 3], 0, 255)
    o[..., :3] = np.where(o[..., 3:] > 0, o[..., :3] * 255 / np.maximum(o[..., 3:], 1e-3), 0)
    o = np.clip(o, 0, 255).round().astype(np.uint8); o[o[..., 3] < 3] = 0
    Image.fromarray(o, 'RGBA').save(os.path.join(R, f'assets/village/{i}.png'), optimize=True)
    inf[i] = {'maestro': [im.width, im.height], 'juego': [W, H], 'escala_maestro': m}
def rep(mo):
    i, x, su, e, p = mo.groups(); m = mx[i]
    return f"{{ id: '{i}', x: {x}, suelo: {su}, esc: {round(float(e) / m, 4):g}, pie: {round(int(p) * m)}"
t2 = pat.sub(rep, t)
open(html, 'w').write(t2)
json.dump(inf, open(os.path.join(R, 'maestros/versiones_juego.json'), 'w'), indent=1)
print(json.dumps(inf))
