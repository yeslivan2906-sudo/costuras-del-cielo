"""Corta una pieza de una hoja de Yesli con fondo magenta (por distancia al magenta, como el kit de interfaz).
Se queda con la pieza más grande dentro de la caja (quita restos vecinos)."""
import os, numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); _cache = {}
def hoja(n):
    if n not in _cache:
        a = np.array(Image.open(os.path.join(D, 'fuentes', n)).convert('RGB')).astype(np.float32); M = np.array([255, 0, 255], np.float32)
        al = np.clip((np.sqrt(((a - M) ** 2).sum(-1)) - 60) / 70, 0, 1)
        col = np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255); _cache[n] = (col, al)
    return _cache[n]
def pieza(n, box, ancho=None, alto=None, todo=False):
    col, al = hoja(n); x0, y0, x1, y1 = box; a = al[y0:y1, x0:x1].copy(); c = col[y0:y1, x0:x1]
    if not todo:
        k_, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate((a > 0.35).astype(np.uint8), np.ones((5, 5), np.uint8)))
        if k_ > 1: k = 1 + int(np.argmax(st[1:, 4])); a = np.where(lab == k, a, 0)
    im = Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA'); im = im.crop(im.getbbox())
    if ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    if alto: im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
    return im
def guardar(im, carpeta, nombre):
    p = os.path.join(D, '..', '..', 'assets', carpeta); os.makedirs(p, exist_ok=True); im.save(os.path.join(p, nombre + '.png')); return im.size
