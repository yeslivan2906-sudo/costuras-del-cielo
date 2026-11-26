"""HOJA DORADA de Yesli. La hoja llegó con el cuadriculado gris de «transparente» pintado dentro de la imagen:
se quita por color (el cuadriculado es gris sin color; la hoja y su brillo son amarillo/naranja). Sin redibujar.
Uso: python3 -I herramientas/hoja_dorada/preparar_hoja.py  →  assets/items/hoja_dorada.png (128 px de alto)
"""
import os
import numpy as np
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(D, '..', '..', 'assets', 'items')
a = np.array(Image.open(os.path.join(D, 'fuentes', 'hoja_dorada.png')).convert('RGBA')).astype(np.float32)
rgb = a[..., :3]; mx = rgb.max(-1); mn = rgb.min(-1)
sat = (mx - mn) / np.maximum(mx, 1)
al = np.clip((sat - 0.10) / 0.30, 0, 1) * (a[..., 3] / 255)
im = Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA')
bb = Image.fromarray((al > 0.08).astype(np.uint8) * 255).getbbox(); im = im.crop(bb)
im = im.resize((round(im.width * 128 / im.height), 128), Image.LANCZOS); im.save(os.path.join(A, 'hoja_dorada.png')); print(im.size)
