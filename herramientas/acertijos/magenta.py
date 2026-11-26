"""Utilidad: quitar el fondo magenta de las láminas de Yesli (bordes desmezclados, hilos rojizos devueltos al dorado)."""
import numpy as np, cv2
from PIL import Image
def quitar_magenta(path):
    a = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    al = 1 - np.clip((np.minimum(R, B) - G - 40) / 150, 0, 1)
    al = np.where(al < 0.06, 0, al)
    col = np.clip((a - (1 - al[..., None]) * np.array([255, 0, 255], np.float32)) / np.maximum(al[..., None], 0.05), 0, 255)
    roj = (al < 0.97) & (col[..., 0] > col[..., 1] + 35) & (col[..., 2] > col[..., 1] + 20)
    col = np.where(roj[..., None], np.array([255, 215, 120], np.float32) * np.maximum(col.max(-1, keepdims=True) / 255, 0.75), col)
    return col, al
def piezas(al, dil=25, minimo=3000):
    k = cv2.dilate((al > 0.5).astype(np.uint8), np.ones((dil, dil), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(k)
    return sorted([tuple(int(v) for v in st[i, :5]) for i in range(1, n) if st[i, 4] > minimo], key=lambda b: (b[1] // 300, b[0]))
def recorte(col, al, box, alto=None, ancho=None):
    x, y, w, h = box[:4]
    im = Image.fromarray(np.dstack([col[y:y+h, x:x+w], al[y:y+h, x:x+w] * 255]).astype(np.uint8), 'RGBA')
    im = im.crop(im.getbbox())
    if alto: im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
    if ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    return im
