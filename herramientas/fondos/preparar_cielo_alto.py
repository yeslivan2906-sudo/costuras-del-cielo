"""FONDO VERTICAL del 1-2 con las tres capas de Yesli (sin redibujar):
 cielo_alto.jpg (760 de ancho), islas_altas.png (1000 de ancho, sin magenta), nubes_frente.png (720 de ancho, sin magenta).
Uso: python3 -I herramientas/fondos/preparar_cielo_alto.py
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'acertijos'))
import numpy as np
from PIL import Image
from magenta import quitar_magenta
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cielo_1-2'); A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'backgrounds')
def ancho(im, w): return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
ancho(Image.open(os.path.join(D, 'cielo_yesli.jpg')).convert('RGB'), 760).save(os.path.join(A, 'cielo_alto.jpg'), quality=88)
for src, dst, w in [('islas_yesli.jpg', 'islas_altas.png', 1000), ('nubes_yesli.jpg', 'nubes_frente.png', 720)]:
    c, a = quitar_magenta(os.path.join(D, src))
    im = Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA')
    ancho(im, w).save(os.path.join(A, dst))
print('ok')
