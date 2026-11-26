"""LOBO COSIDO (hoja de Yesli) → cuadros del juego, sin redibujar.
La hoja viene en JPG con la cuadrícula gris pintada (no es transparencia real) y con los nombres de las filas escritos.
Se separa el lobo de la cuadrícula (gris neutro claro), se quitan los textos y cada cuadro sale con fondo transparente,
todos a la MISMA escala, con las patas en la misma fila y centrados. Mira a la derecha, como en la hoja.
Uso: python3 -I preparar_lobo.py <hoja.jpg> <assets/criaturas> <carpeta de vista previa>
"""
import os, sys
import numpy as np, cv2
from PIL import Image
SRC, OUT, PREV = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True); os.makedirs(PREV, exist_ok=True)
a = np.array(Image.open(SRC).convert('RGB')).astype(np.int16)
mx, mn = a.max(2), a.min(2)
fondo = ((mx - mn) < 16) & (mx > 145)                # cuadrícula: gris neutro claro (172 / 200)
fig = (~fondo).astype(np.uint8)
fig = cv2.morphologyEx(fig, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
# textos de la hoja (nombres de las filas): se borran
for x0, y0, x1, y1 in [(60, 292, 240, 345), (70, 578, 190, 632), (90, 842, 290, 898), (1715, 812, 1955, 862), (625, 1232, 870, 1330)]:
    fig[y0:y1, x0:x1] = 0
# cajas de cada cuadro (px de la hoja original 2576 × 1438)
CUADROS = {
    'quieto':     [(0, 30, 420, 292), (425, 30, 850, 300), (850, 30, 1275, 300), (1285, 30, 1712, 300)],
    'caminar':    [(0, 318, 432, 588), (432, 318, 862, 588), (860, 318, 1288, 588), (1286, 318, 1716, 588), (1714, 318, 2144, 588), (2142, 318, 2575, 588)],
    'aviso':      [(10, 630, 452, 840), (452, 630, 900, 840)],
    'embestida':  [(25, 870, 545, 1140), (560, 850, 1105, 1100), (1105, 870, 1590, 1140)],
    'golpe':      [(1615, 790, 2010, 1142), (2030, 870, 2490, 1142)],
    'remendarse': [(35, 1120, 490, 1436), (860, 1120, 1335, 1436), (1360, 1110, 1825, 1436), (1830, 1110, 2290, 1436)],
}
ESC, W, H, PIE = 0.52, 300, 176, 170
for anim, cajas in CUADROS.items():
    for i, (x0, y0, x1, y1) in enumerate(cajas, 1):
        m = fig[y0:y1, x0:x1].copy()
        n, lab, st, _ = cv2.connectedComponentsWithStats(m)
        grande = max(range(1, n), key=lambda k: st[k, 4])
        keep = np.zeros_like(m)
        sub = a[y0:y1, x0:x1]
        for k in range(1, n):
            comp = lab == k
            if k == grande: keep[comp] = 1; continue
            # se guardan chispas e hilos dorados (saturados) y trozos cercanos al lobo; se tira el ruido gris
            sat = (sub[comp].max(1) - sub[comp].min(1)).mean()
            if sat > 40 and st[k, 4] >= 6: keep[comp] = 1
        keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        alfa = cv2.GaussianBlur(cv2.erode(keep, np.ones((2, 2), np.uint8)).astype(np.float32), (0, 0), 0.7)
        im = np.dstack([sub.astype(np.uint8), (alfa * 255).astype(np.uint8)])
        ys, xs = np.nonzero(keep)
        im = Image.fromarray(im).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        im.save(os.path.join(PREV, f'lobo_{anim}{i}_grande.png'))
        g = im.resize((round(im.width * ESC), round(im.height * ESC)), Image.LANCZOS)
        c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.alpha_composite(g, ((W - g.width) // 2, PIE - g.height))
        c.save(os.path.join(OUT, f'lobo_{anim}{i}.png'))
print('listo')
