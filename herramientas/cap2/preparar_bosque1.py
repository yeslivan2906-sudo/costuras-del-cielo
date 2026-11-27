"""CAPÍTULO II «Bosque de Papel» · hoja 1 de Yesli (fondo magenta): 3 franjas de fondo (lejos · medio · cerca), 5 islas,
hoja que cae (6 cuadros), grulla de origami (6 cuadros) y ardilla (4 quieta + 4 corriendo). Sin redibujar.
Los fondos verticales (720 de ancho) se arman con sus franjas: cielo degradado + lejos, el bosque del medio y el frente.
Uso: python3 -I herramientas/cap2/preparar_bosque1.py"""
import os
import numpy as np
from PIL import Image, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'bosque2')
a = np.array(Image.open(os.path.join(D, 'fuentes', 'hoja_bosque1.png')).convert('RGB')).astype(float)
d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2); al = ((d - 60) / 70).clip(0, 1)
c = a.copy()
for ch in (0, 2): c[..., ch] = np.where((al > 0) & (al < 1), (a[..., ch] - 255 * (1 - al)) / np.maximum(al, 1e-3), a[..., ch])
RGBA = np.dstack([c.clip(0, 255), al * 255]).astype(np.uint8)

def recorte(x0, y0, x1, y1):
    sub = al[y0:y1, x0:x1] > 0.3; ys, xs = np.nonzero(sub)
    return Image.fromarray(RGBA[y0 + ys.min():y0 + ys.max() + 1, x0 + xs.min():x0 + xs.max() + 1])

def fila(y0, y1, n, x0=0, x1=1536):
    col = (al[y0:y1, x0:x1] > 0.3).sum(0) > 1; xs = np.nonzero(col)[0]; segs = []; s0 = p = xs[0]
    for x in xs[1:]:
        if x - p > 8: segs.append([s0, p + 1]); s0 = x
        p = x
    segs.append([s0, p + 1])
    while len(segs) > n:
        g = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]; i = int(np.argmin(g)); segs[i:i + 2] = [[segs[i][0], segs[i + 1][1]]]
    assert len(segs) == n, (y0, len(segs))
    return [recorte(x0 + a_, y0, x0 + b_, y1) for a_, b_ in segs]

def guardar(im, n, ancho=None):
    if ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, n + '.png')); return im.size

# islas (su ancho en px = el ancho que tendrán × 2 aprox.)
for i, im in enumerate(fila(440, 615, 5), 1): print('isla', i, guardar(im, f'isla{i}'))
for i, im in enumerate(fila(618, 712, 6), 1): guardar(im, f'hoja{i}', 160)
for i, im in enumerate(fila(720, 845, 6), 1): guardar(im, f'grulla{i}', 200)
ard = fila(855, 1010, 8)
for i, im in enumerate(ard[:4], 1): guardar(im, f'ardilla_quieta{i}')
for i, im in enumerate(ard[4:], 1): guardar(im, f'ardilla_corre{i}')
print('hojas, grullas, ardillas ok')

# FONDOS VERTICALES (mismos tamaños que los del 1-3: cielo 760 × 1301, medio 900 × 1565, frente 720 × 1236)
lejos = recorte(5, 2, 1531, 160); medio = recorte(5, 162, 1531, 325); frente = recorte(5, 328, 1531, 436)
# cielo: degradado de Yesli (lavanda arriba → rosado abajo) con la franja lejana abajo y sus nubes arriba
W1, H1 = 760, 1301; cielo = Image.new('RGBA', (W1, H1))
top, bot = np.array([150, 120, 205]), np.array([236, 182, 226]); g = np.linspace(0, 1, H1)[:, None, None]
cielo = Image.fromarray(((1 - g) * top + g * bot).repeat(W1, 1).astype(np.uint8)).convert('RGBA')
L = lejos.resize((round(lejos.width * 270 / lejos.height), 270), Image.LANCZOS)
cielo.alpha_composite(L.crop((0, 0, W1, 270)), (0, H1 - 270 - 60)); cielo.alpha_composite(L.crop((0, 200, W1, 270)), (0, H1 - 70))
cielo.convert('RGB').save(os.path.join(OUT, 'fondo_cielo.jpg'), quality=88)
# medio: el bosque del medio abajo (dos tramos uno sobre otro para cubrir más alto)
W2, H2 = 900, 1565; med = Image.new('RGBA', (W2, H2), (0, 0, 0, 0))
M = medio.resize((round(medio.width * 330 / medio.height), 330), Image.LANCZOS)
def fundir_arriba(im, alto):   # el borde de arriba de la franja se desvanece (no se ve el corte recto)
    a_ = np.array(im).astype(float); r = np.clip(np.arange(im.height) / alto, 0, 1)[:, None]; a_[..., 3] *= r; return Image.fromarray(a_.astype(np.uint8))
med.alpha_composite(fundir_arriba(M.crop((150, 0, 150 + W2, 330)), 70), (0, H2 - 330))
med.save(os.path.join(OUT, 'fondo_medio.png'))
# frente: hongos, raíces y piedras abajo
W3, H3 = 720, 1236; fr = Image.new('RGBA', (W3, H3), (0, 0, 0, 0))
F = frente.resize((round(frente.width * 140 / frente.height), 140), Image.LANCZOS)
fr.alpha_composite(F.crop((0, 0, W3, 140)), (0, H3 - 140)); fr.save(os.path.join(OUT, 'fondo_frente.png'))
print('fondos ok')
