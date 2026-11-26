"""GALERÍA (hoja 2 de Yesli, cuadrada): fondo de la galería, 12 recuerdos cuadrados con su título, recuerdo bloqueado,
marco de criaturas (hueco transparente) y pestañas. Quita el magenta y recorta cada pieza a su mancha más grande.
Uso: python3 -I herramientas/galeria/preparar_hoja_cuadrada.py"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'galeria')
a = np.array(Image.open(os.path.join(D, 'fuentes', 'hoja_galeria_cuadrada.png')).convert('RGB')).astype(float)
d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2); al = ((d - 60) / 70).clip(0, 1)
c = a.copy(); m = al > 0
for ch in (0, 2): c[..., ch] = np.where(m, (a[..., ch] - 255 * (1 - al)) / np.maximum(al, 1e-3), a[..., ch])
rgba = np.dstack([c.clip(0, 255), al * 255]).astype(np.uint8)
def pieza(n, x0, y0, x1, y1, ancho=None):
    sub = al[y0:y1, x0:x1] > 0.3; lab, k = ndimage.label(sub)
    big = np.argmax(ndimage.sum(sub, lab, range(1, k + 1))) + 1; ys, xs = np.where(lab == big)
    im = Image.fromarray(rgba[y0 + ys.min():y0 + ys.max() + 1, x0 + xs.min():x0 + xs.max() + 1])
    if ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, n + '.png')); print(n, (x0 + xs.min(), y0 + ys.min()), im.size)
Image.fromarray(a[37:979, 16:540].clip(0, 255).astype(np.uint8)).resize((720, 1280), Image.LANCZOS).save(os.path.join(OUT, 'galeria_fondo.jpg'), quality=90)   # fondo opaco (sus morados no se tocan)
COL = [(560, 800), (802, 1040), (1043, 1282), (1284, 1530)]; FIL = [(8, 222), (222, 434), (434, 648)]
for i in range(12):
    (x0, x1), (y0, y1) = COL[i % 4], FIL[i // 4]; pieza(f'recuerdo_1-{i + 1}', x0, y0, x1, y1)
pieza('recuerdo_bloqueado', 558, 690, 815, 945); pieza('marco_criatura', 815, 655, 1070, 945)
pieza('pestana_recuerdos_activa', 1068, 700, 1300, 800); pieza('pestana_criaturas_activa', 1300, 700, 1530, 800)
pieza('pestana_recuerdos_inactiva', 1068, 820, 1300, 920); pieza('pestana_criaturas_inactiva', 1300, 820, 1530, 920)
