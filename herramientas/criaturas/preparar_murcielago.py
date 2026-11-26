"""MURCIÉLAGO COSIDO desde la hoja de Yesli (fondo magenta) → cuadros del juego, sin redibujar.
15 cuadros por filas: volar 4, aviso 2, picada 3, golpe 2, remendarse 4. Se quita el magenta (bordes desmezclados),
se conservan los trazos de efecto (líneas de aviso, de velocidad, chispas) y todos salen a la misma escala, con el
CUERPO centrado en el lienzo (así no tiembla al cambiar de cuadro aunque los efectos sobresalgan). Mira a la derecha.
Uso: python3 -I preparar_murcielago.py <hoja.png> <assets/criaturas>
"""
import os, sys
import numpy as np, cv2
from PIL import Image
SRC, OUT = sys.argv[1:3]
a = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
al = 1 - np.clip((np.minimum(R, B) - G - 40) / 150, 0, 1)
al = np.where(al < 0.06, 0, al)
fig = (al > 0.5).astype(np.uint8)
k = cv2.dilate(cv2.morphologyEx(fig, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)), np.ones((31, 31), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(k)
cajas = sorted([tuple(int(v) for v in st[i, :4]) for i in range(1, n) if st[i, 4] > 4000], key=lambda b: (b[1] // 200, b[0]))
assert len(cajas) == 15, (len(cajas), cajas)
orden = [f'{nm}{i}' for nm, c in [('volar', 4), ('aviso', 2), ('picada', 3), ('golpe', 2), ('remendarse', 4)] for i in range(1, c + 1)]
M = np.array([255, 0, 255], np.float32)
col = np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255)
rojizo = (al < 0.97) & (col[..., 0] > col[..., 1] + 35) & (col[..., 2] > col[..., 1] + 20)
col = np.where(rojizo[..., None], np.array([255, 215, 120], np.float32) * np.maximum(col.max(-1, keepdims=True) / 255, 0.75), col)
ESC, W, H = 0.42, 170, 130
for nombre, (x, y, w, h) in zip(orden, cajas):
    sl = (slice(y, y + h), slice(x, x + w))
    m = (k[sl] > 0) & (lab[sl] == lab[y + h // 2, x + w // 2] if False else (k[sl] > 0))
    alfa = np.where(m, al[sl], 0)
    # centro del cuerpo = centroide del trozo más grande (sin los trazos de efecto)
    nn, ll, ss, cc = cv2.connectedComponentsWithStats((alfa > 0.5).astype(np.uint8))
    g = 1 + int(np.argmax(ss[1:, 4])); cx, cy = cc[g]
    im = Image.fromarray(np.dstack([col[sl], alfa * 255]).astype(np.uint8), 'RGBA')
    im = im.resize((round(im.width * ESC), round(im.height * ESC)), Image.LANCZOS)
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.alpha_composite(im, (int(round(W / 2 - cx * ESC)), int(round(H / 2 - cy * ESC))))
    c.save(os.path.join(OUT, f'murcielago_{nombre}.png'))
print('15 cuadros')
