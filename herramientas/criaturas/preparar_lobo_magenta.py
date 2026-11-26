"""LOBO COSIDO desde la hoja de Yesli con fondo MAGENTA (#FF00FF) → cuadros del juego, sin redibujar.
El magenta se quita por color y los bordes se «desmezclan» (se les quita el tinte rosa del fondo), así quedan
limpios sobre cualquier escenario. 21 cuadros en el orden de la hoja: quieto 4, caminar 6, aviso 2, embestida 3,
golpe 2, remendarse 4. Misma escala para todos, patas en la fila 170 de un lienzo 300 × 176, mirando a la derecha.
Uso: python3 -I preparar_lobo_magenta.py <hoja.jpg> <assets/criaturas>
"""
import os, sys
import numpy as np, cv2
from PIL import Image
SRC, OUT = sys.argv[1:3]
a = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
magen = np.clip((np.minimum(R, B) - G - 40) / 150, 0, 1)            # 0 = figura, 1 = fondo magenta puro
alfa = 1 - magen
fig = (alfa > 0.5).astype(np.uint8)
k = cv2.dilate(cv2.morphologyEx(fig, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)), np.ones((9, 9), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(k)
cajas = sorted([tuple(int(v) for v in st[i, :4]) for i in range(1, n) if st[i, 4] > 5000], key=lambda b: (b[1] // 250, b[0]))
assert len(cajas) == 21, len(cajas)
NOMBRES = [('quieto', 4), ('caminar', 6), ('aviso', 2), ('embestida', 3), ('golpe', 2), ('remendarse', 4)]
orden = [f'{nm}{i}' for nm, c in NOMBRES for i in range(1, c + 1)]
M = np.array([255, 0, 255], np.float32)
ESC, W, H, PIE = 0.52, 300, 176, 170
for nombre, (x, y, w, h) in zip(orden, cajas):
    sl = (slice(y, y + h), slice(x, x + w))
    al = alfa[sl].copy()
    comp = (lab[sl] == lab[y + h // 2, x + w // 2]) if False else (k[sl] > 0)
    al[~comp] = 0
    al = np.where(al < 0.06, 0, al)
    col = (a[sl] - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05)   # quitar el tinte magenta del borde
    col = np.clip(col, 0, 255)
    # hilos dorados semitransparentes: lo que quedó rosado o rojizo vuelve al dorado de los hilos (mismo brillo)
    rojizo = (al < 0.97) & (col[..., 0] > col[..., 1] + 35)
    luz = np.clip(col.max(-1) / 255, 0, 1)[..., None]
    col = np.where(rojizo[..., None], np.array([255, 205, 95], np.float32) * np.maximum(luz, 0.75), col)
    im = Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), 'RGBA')
    im = im.crop(im.getbbox())
    g = im.resize((round(im.width * ESC), round(im.height * ESC)), Image.LANCZOS)
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.alpha_composite(g, ((W - g.width) // 2, PIE - g.height))
    c.save(os.path.join(OUT, f'lobo_{nombre}.png'))
print('21 cuadros')
