"""Cajita de la barra de abajo para el hilo dorado (hoja «tablero artesanal» de Yesli, fondo magenta) y el letrero suelto.
Uso: python3 -I herramientas/hud_fieltro/preparar_hueco_letrero.py"""
import os
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(D, '..', '..')
a = np.array(Image.open(os.path.join(D, 'fuentes', 'hueco_letrero.png')).convert('RGB')).astype(float)
d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2); al = ((d - 60) / 70).clip(0, 1)
c = a.copy()
for ch in (0, 2): c[..., ch] = np.where((al > 0) & (al < 1), (a[..., ch] - 255 * (1 - al)) / np.maximum(al, 1e-3), a[..., ch])
rgba = np.dstack([c.clip(0, 255), al * 255]).astype(np.uint8)
def pieza(caja, ancho, dest):
    x0, y0, x1, y1 = caja; sub = al[y0:y1, x0:x1] > 0.3; ys, xs = np.nonzero(sub)
    im = Image.fromarray(rgba[y0 + ys.min():y0 + ys.max() + 1, x0 + xs.min():x0 + xs.max() + 1])
    im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS); im.save(os.path.join(R, dest)); print(dest, im.size)
pieza((0, 0, 900, 887), 240, 'assets/ui/hud_hueco_hilo.png')
pieza((960, 0, 1774, 887), 200, 'assets/ui/letrero_madera.png')
