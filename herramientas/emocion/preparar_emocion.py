"""RELOJ, ESTRELLAS Y CIELO DESCOSIDO de Yesli (hoja con fondo magenta), sin redibujar.
Uso: python3 -I herramientas/emocion/preparar_emocion.py
Salen en assets/ui/: reloj (el reloj de bolsillo bordado), estrella_llena, estrella_brillo (la obtenida, con destello),
estrella_vacia; y assets/backgrounds/cielo_descosido.jpg (la escena del cielo roto, opaca).
"""
import os
import numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(D, '..', '..', 'assets')
a = np.array(Image.open(os.path.join(D, 'fuentes', 'hoja_reloj_estrellas.png')).convert('RGB')).astype(np.float32)
M = np.array([255, 0, 255], np.float32)
al = np.clip((np.sqrt(((a - M) ** 2).sum(-1)) - 55) / 70, 0, 1)   # por distancia: el fieltro morado no se borra
col = np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255)

def pieza(nombre, box, alto, todo=False):
    x0, y0, x1, y1 = box; m = al[y0:y1, x0:x1].copy(); c = col[y0:y1, x0:x1]
    if not todo:   # solo la pieza más grande (quita letreros); con «todo» se guardan también los destellos sueltos
        n, lab, st, _ = cv2.connectedComponentsWithStats((m > 0.35).astype(np.uint8))
        if n > 1:
            k = 1 + int(np.argmax(st[1:, 4])); m = np.where(cv2.dilate((lab == k).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0, m, 0)
    im = Image.fromarray(np.dstack([c, m * 255]).astype(np.uint8), 'RGBA'); im = im.crop(im.getbbox())
    im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
    im.save(os.path.join(A, 'ui', nombre + '.png')); return im.size

print('reloj', pieza('reloj', (0, 0, 590, 1024), 200))
print('llena', pieza('estrella_llena', (600, 30, 905, 300), 120))
print('brillo', pieza('estrella_brillo', (925, 30, 1240, 300), 120, todo=True))
print('vacia', pieza('estrella_vacia', (1240, 30, 1536, 300), 120))
Image.open(os.path.join(D, 'fuentes', 'hoja_reloj_estrellas.png')).convert('RGB').crop((593, 437, 1528, 994)).resize((720, 429), Image.LANCZOS).save(os.path.join(A, 'backgrounds', 'cielo_descosido.jpg'), quality=86)
print('listo')
