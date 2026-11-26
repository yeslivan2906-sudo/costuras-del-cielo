"""PERSONAJE NUEVO desde la hoja de sprites de Yesli (fondo magenta, 5 filas: quieto 6 · caminar 8 · saltar 3 · atacar 3 ·
coser 4, y el retrato arriba a la izquierda). Sin redibujar. Sale igual que Lumi (texturas_unificadas.py):
cuadros 148 × 100, MISMA escala en todas las poses, pie en la fila 97 y la cabeza centrada en la columna 74.
  lumi_<id>_idle1..6 · walk1..8 · jump1..3 · attack1..3 · sew1..4 (+ idle/jump/sew/attack) y portrait_<id> (88 × 88)
Uso: python3 -I herramientas/personajes/preparar_personaje.py <hoja.png> <id> <filas y0,y1;…> <x0 de los cuadros> <retrato x0,y0,x1,y1>"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage
HOJA, ID, FILAS, X0, RET = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'personajes')
W, H, PIE, CX, ALTO = 148, 100, 97, 74, 90
a = np.array(Image.open(HOJA).convert('RGB')).astype(float)
d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2)
# el magenta de estas hojas va de rosa claro a morado: se mide como «mucho rojo y azul, poco verde»
mag = (a[..., 0] - a[..., 1] > 70) & (a[..., 2] - a[..., 1] > 70) & (np.abs(a[..., 0] - a[..., 2]) < 90)
al = np.where(mag, ((d - 60) / 70).clip(0, 1), 1.0)
al = np.array(Image.fromarray((al * 255).astype(np.uint8)).filter(__import__('PIL.ImageFilter', fromlist=['x']).MedianFilter(3))).astype(float) / 255
c = a.copy()
for ch in (0, 2): c[..., ch] = np.where((al > 0) & (al < 1), (a[..., ch] - 255 * (1 - al)) / np.maximum(al, 1e-3), a[..., ch])
RGBA = np.dstack([c.clip(0, 255), al * 255]).astype(np.uint8)
ANIM = [('idle', 6), ('walk', 8), ('jump', 3), ('attack', 3), ('sew', 4)]

def cuadros(y0, y1, n):
    m = al[y0:y1, X0:] > 0.5
    lab, k = ndimage.label(m); objs = ndimage.find_objects(lab); tam = ndimage.sum(m, lab, range(1, k + 1))
    keep = np.zeros_like(m)
    for i, sl in enumerate(objs):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if tam[i] < 25 or (h < 8 and w > 120): continue          # puntitos y líneas separadoras
        keep |= lab == i + 1
    col = keep.any(0); xs = np.nonzero(col)[0]
    segs = []; s0 = xs[0]; prev = xs[0]
    for x in xs[1:]:
        if x - prev > 6: segs.append([s0, prev + 1]); s0 = x
        prev = x
    segs.append([s0, prev + 1])
    while len(segs) > n:                                         # une los huecos más chicos (hilos, chispas sueltas)
        g = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]; i = int(np.argmin(g)); segs[i:i + 2] = [[segs[i][0], segs[i + 1][1]]]
    assert len(segs) == n, (y0, len(segs))
    out = []
    for sx0, sx1 in segs:
        sub = keep[:, sx0:sx1]; lab2, k2 = ndimage.label(sub); tam2 = ndimage.sum(sub, lab2, range(1, k2 + 1)); big = np.argmax(tam2) + 1
        bys, bxs = np.nonzero(lab2 == big); fondo = bys.max()
        sel = sub.copy()
        for j, sl in enumerate(ndimage.find_objects(lab2)):     # quita la sombra del salto (mancha plana bajo los pies)
            if j + 1 != big and sl[0].start > fondo - 4 and (sl[0].stop - sl[0].start) < 16: sel &= lab2 != j + 1
        ys, xs2 = np.nonzero(sel)
        top = ys.min(); fr = RGBA[y0:y1, X0 + sx0:X0 + sx1].copy(); fr[..., 3] = np.where(sel, fr[..., 3], 0)
        cab = bxs[bys < bys.min() + (fondo - bys.min()) * 0.35].mean()   # centro de la cabeza (cuerpo principal)
        out.append((Image.fromarray(fr), fondo, cab, fondo - bys.min()))
    return out

filas = [tuple(map(int, f.split(','))) for f in FILAS.split(';')]
todos = {clave: cuadros(y0, y1, n) for (clave, n), (y0, y1) in zip(ANIM, filas)}
G = ALTO / np.median([alto for (_, _, _, alto) in todos['idle']])
for clave, lista in todos.items():
    for i, (im, fondo, cab, _) in enumerate(lista, 1):
        w, h = round(im.width * G), round(im.height * G); r = im.resize((w, h), Image.LANCZOS)
        o = Image.new('RGBA', (W, H), (0, 0, 0, 0)); o.alpha_composite(r, (int(round(CX - cab * G)), int(round(PIE - fondo * G)))) if False else None
        o.paste(r, (int(round(CX - cab * G)), int(round(PIE - fondo * G))), r)
        o.save(os.path.join(OUT, f'lumi_{ID}_{clave}{i}.png'))
for clave, i in {'idle': 1, 'jump': 2, 'sew': 2, 'attack': 2}.items():
    Image.open(os.path.join(OUT, f'lumi_{ID}_{clave}{i}.png')).save(os.path.join(OUT, f'lumi_{ID}_{clave}.png'))
x0, y0, x1, y1 = map(int, RET.split(','))
Image.fromarray(RGBA[y0:y1, x0:x1]).convert('RGBA').resize((88, 88), Image.LANCZOS).save(os.path.join(OUT, f'portrait_{ID}.png'))
print(ID, 'escala', round(G, 3), {k: len(v) for k, v in todos.items()})
