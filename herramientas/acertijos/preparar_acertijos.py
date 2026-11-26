"""PIEZAS DE ACERTIJOS de Yesli → juego (sin redibujar). Uso: python3 -I herramientas/acertijos/preparar_acertijos.py
 · assets/menus/minijuego_fondo.jpg: fondo común de los minijuegos (marco cuadrado vacío), 720 × 1280.
 · assets/acertijos/: cofre_cerrado/abierto, reloj_cerrado/abierto (poste), reloj_esfera, manecilla_corta/larga,
   laberinto_tablero, aguja, rompecabezas_dibujo. Imprime los datos que necesita el código (pivotes, lienzo del tablero).
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from magenta import quitar_magenta, recorte
D = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(D, '..', '..', 'assets')
o = lambda n: os.path.join(A, 'acertijos', n)
im = Image.open(os.path.join(D, '50c1ef7d-image.jpg')).convert('RGB')
im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS); d = (im.height - 1280) // 2
im.crop((0, d, 720, d + 1280)).save(os.path.join(A, 'menus', 'minijuego_fondo.jpg'), quality=88)
c, a = quitar_magenta(os.path.join(D, '46c99ba5-image.jpg'))
f = 68 / 1178
for n, box in [('cofre_cerrado', (66, 343, 1178, 980)), ('cofre_abierto', (1349, 86, 1146, 1237))]:
    p = recorte(c, a, box); p.resize((round(p.width * f), round(p.height * f)), Image.LANCZOS).save(o(n + '.png'))
c, a = quitar_magenta(os.path.join(D, 'e26877ad-image.jpg'))
poste = recorte(c, a, (1676, 110, 564, 1545), alto=128); poste.save(o('reloj_cerrado.png')); poste.save(o('reloj_abierto.png'))
recorte(c, a, (77, 61, 926, 926), ancho=440).save(o('reloj_esfera.png'))
info = {}
for n, box in [('manecilla_corta', (281, 1105, 481, 194)), ('manecilla_larga', (282, 1435, 680, 163))]:
    p = recorte(c, a, box)
    al = np.array(p)[..., 3] > 128
    # pivote: centro del extremo redondo (columna donde termina el círculo: mitad de la altura desde la izquierda)
    piv = p.height / 2
    info[n] = {'largo_px': p.width, 'alto_px': p.height, 'pivote_x': round(piv / p.width, 3)}
    p.save(o(n + '.png'))
c, a = quitar_magenta(os.path.join(D, 'cb6d980b-image.jpg'))
t = recorte(c, a, (54, 54, 1940, 1938), ancho=480)
arr = np.array(t).astype(int)
crema = (arr[..., 0] > 200) & (arr[..., 1] > 180) & (arr[..., 2] > 140) & (arr[..., 0] - arr[..., 2] < 70)
fil = crema.mean(1) > 0.6; col = crema.mean(0) > 0.6
ys, xs = np.nonzero(fil)[0], np.nonzero(col)[0]
info['tablero_lienzo'] = [round(xs.min() / t.width, 3), round(ys.min() / t.height, 3), round((xs.max() + 1) / t.width, 3), round((ys.max() + 1) / t.height, 3)]
t.save(o('laberinto_tablero.png'))
c, a = quitar_magenta(os.path.join(D, 'f93307f5-image.jpg'))
recorte(c, a, (295, 250, 1443, 1518), ancho=160).save(o('aguja.png'))
Image.open(os.path.join(D, '338ea8c7-image.jpg')).convert('RGB').resize((600, 600), Image.LANCZOS).save(o('rompecabezas_dibujo.jpg'), quality=90)
print(json.dumps(info))
