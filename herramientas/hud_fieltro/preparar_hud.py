"""HUD DE FIELTRO de Yesli (fondo magenta): cajitas de objeto (poción, cristal, hoja; el número va en la esquina oscura)
y contadores de monedas y cristales (el número va en la parte morada). Sin redibujar.
Uso: python3 -I herramientas/hud_fieltro/preparar_hud.py  →  assets/ui/hud_hueco_<pocion|cristal|hoja>, hud_contador_<moneda|cristal>
"""
import os
import numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(D, '..', '..', 'assets', 'ui')
a = np.array(Image.open(os.path.join(D, 'fuentes', 'hud.png')).convert('RGB')).astype(np.float32); M = np.array([255, 0, 255], np.float32)
al = np.clip((np.sqrt(((a - M) ** 2).sum(-1)) - 55) / 70, 0, 1)
col = np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255)
def pieza(nombre, box, ancho):
    x0, y0, x1, y1 = box; m = al[y0:y1, x0:x1].copy(); c = col[y0:y1, x0:x1]
    n, lab, st, _ = cv2.connectedComponentsWithStats((m > 0.35).astype(np.uint8))
    if n > 1: k = 1 + int(np.argmax(st[1:, 4])); m = np.where(cv2.dilate((lab == k).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0, m, 0)
    im = Image.fromarray(np.dstack([c, m * 255]).astype(np.uint8), 'RGBA'); im = im.crop(im.getbbox())
    im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS); im.save(os.path.join(A, nombre + '.png')); print(nombre, im.size)
pieza('hud_hueco_pocion', (40, 100, 505, 560), 96)
pieza('hud_hueco_cristal', (540, 100, 1000, 560), 96)
pieza('hud_hueco_hoja', (1035, 100, 1500, 560), 96)
pieza('hud_contador_moneda', (5, 620, 770, 930), 240)
pieza('hud_contador_cristal', (775, 620, 1530, 930), 240)
# farol de fieltro (cuelga de las islas en todos los niveles): reemplaza al farol de papel dibujado
a = np.array(Image.open(os.path.join(D, 'fuentes', 'farol.png')).convert('RGB')).astype(np.float32)
al = np.clip((np.sqrt(((a - M) ** 2).sum(-1)) - 55) / 70, 0, 1)
col = np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255)
im = Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), 'RGBA'); im = im.crop(im.getbbox())
A2 = os.path.join(D, '..', '..', 'assets', 'items'); im = im.resize((round(im.width * 112 / im.height), 112), Image.LANCZOS); im.save(os.path.join(A2, 'farol.png')); print('farol', im.size)
