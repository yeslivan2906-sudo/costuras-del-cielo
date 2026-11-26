"""GALERÍA de Yesli: postales de los niveles (Recuerdos), postal bloqueada, marco de criaturas y pestañas.
Quita el magenta (distancia al #FF00FF, borde suave) y recorta a lo dibujado. Sin redibujar.
Uso: python3 -I herramientas/galeria/preparar_galeria.py"""
import os, glob
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'galeria')
for f in sorted(glob.glob(os.path.join(D, 'fuentes', '*.png'))):
    a = np.array(Image.open(f).convert('RGB')).astype(float)
    d = np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2)
    al = ((d - 60) / 70).clip(0, 1)
    k = (1 - al)[..., None]; c = a.copy()   # quita el tinte magenta del borde suave
    c[..., 0] = np.where(al > 0, (a[..., 0] - 255 * (1 - al)) / np.maximum(al, 1e-3), a[..., 0]); c[..., 2] = np.where(al > 0, (a[..., 2] - 255 * (1 - al)) / np.maximum(al, 1e-3), a[..., 2])
    rgba = np.dstack([c.clip(0, 255), al * 255]).astype(np.uint8)
    ys, xs = np.where(al > 0.1); im = Image.fromarray(rgba).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    n = os.path.basename(f); im.save(os.path.join(OUT, n)); print(n, im.size)
