"""BOTONES DEL TELAR desde la lámina de Yesli con fondo magenta: Restablecer, Resolver (encendido), Resolver (apagado)
y cerrar (X). Se quita el magenta, se desmezclan los bordes y se recorta cada botón (con sus chispas, en «Resolver»).
Uso: python3 -I preparar_botones_telar.py <lamina.jpg> <assets/menus>
"""
import sys, os
import numpy as np, cv2
from PIL import Image
SRC, OUT = sys.argv[1:3]
a = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
al = 1 - np.clip((np.minimum(R, B) - G - 40) / 150, 0, 1)
al = np.where(al < 0.06, 0, al)
fig = (al > 0.5).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.morphologyEx(fig, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)))
grandes = sorted([tuple(int(v) for v in st[i, :4]) for i in range(1, n) if st[i, 4] > 40000], key=lambda b: (b[1] // 300, b[0]))
assert len(grandes) == 4, grandes
M = np.array([255, 0, 255], np.float32)
col = np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255)
rojizo = (al < 0.97) & (col[..., 0] > col[..., 1] + 35) & (col[..., 2] > col[..., 1])
col = np.where(rojizo[..., None], np.array([255, 215, 120], np.float32) * np.maximum(col.max(-1, keepdims=True) / 255, 0.75), col)
for nombre, (x, y, w, h), margen in zip(['boton_restablecer', 'boton_resolver', 'boton_resolver_apagado', 'boton_cerrar'], grandes, [6, 70, 6, 6]):
    x0, y0, x1, y1 = max(0, x - margen), max(0, y - margen), min(a.shape[1], x + w + margen), min(a.shape[0], y + h + margen)
    im = Image.fromarray(np.dstack([col[y0:y1, x0:x1], al[y0:y1, x0:x1] * 255]).astype(np.uint8), 'RGBA')
    im = im.crop(im.getbbox())
    f = 300 / im.width if nombre != 'boton_cerrar' else 96 / im.width
    if nombre == 'boton_resolver': f = 340 / im.width        # con chispas alrededor: el botón en sí queda de ~300
    im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS).save(os.path.join(OUT, nombre + '.png'))
    print(nombre, im.size, '→', round(im.width * f), round(im.height * f))
