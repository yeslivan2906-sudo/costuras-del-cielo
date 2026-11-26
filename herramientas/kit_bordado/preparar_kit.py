"""KIT DE INTERFAZ BORDADA de Yesli (fondo magenta), sin redibujar. Sale en assets/ui/:
dialogo (cuadro con la pestaña del nombre), mision_titulo / mision_fila / mision_pie, casilla_vacia / casilla_marcada,
sudoku_tablero, picross_bastidor, x_bordada, y en assets/acertijos/: baul_carretes, bastidor_postecito, carrete_rosa.
Uso: python3 -I herramientas/kit_bordado/preparar_kit.py
"""
import os
import numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(D, '..', '..', 'assets')

def cargar(nombre):
    a = np.array(Image.open(os.path.join(D, 'fuentes', nombre)).convert('RGB')).astype(np.float32); M = np.array([255, 0, 255], np.float32)
    al = np.clip((np.sqrt(((a - M) ** 2).sum(-1)) - 55) / 70, 0, 1)   # por distancia: el fieltro morado no se borra
    return np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255), al

def pieza(col, al, carpeta, nombre, box, ancho=None, alto=None):
    x0, y0, x1, y1 = box; a = al[y0:y1, x0:x1].copy(); c = col[y0:y1, x0:x1]
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.35).astype(np.uint8))
    if n > 1:
        k = 1 + int(np.argmax(st[1:, 4])); a = np.where(cv2.dilate((lab == k).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0, a, 0)
    im = Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA'); im = im.crop(im.getbbox())
    if ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    if alto: im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
    os.makedirs(os.path.join(R, carpeta), exist_ok=True); im.save(os.path.join(R, carpeta, nombre + '.png')); return im

col, al = cargar('dialogo.png')
pieza(col, al, 'ui', 'dialogo', (0, 0, 1987, 791), ancho=700)
col, al = cargar('kit.png')
pieza(col, al, 'ui', 'mision_titulo', (1095, 0, 1515, 121), ancho=310)
pieza(col, al, 'ui', 'mision_fila', (1090, 170, 1520, 258), ancho=310)
pieza(col, al, 'ui', 'mision_pie', (1098, 300, 1515, 364), ancho=310)
pieza(col, al, 'ui', 'casilla_vacia', (800, 220, 905, 318), ancho=40)
pieza(col, al, 'ui', 'casilla_marcada', (933, 220, 1038, 318), ancho=40)
# (primera versión, cambiada por kit2) pieza(col, al, 'ui', 'sudoku_tablero', (20, 400, 436, 820), ancho=420)
# (primera versión, cambiada por kit2) pieza(col, al, 'ui', 'picross_bastidor', (458, 398, 866, 843), ancho=460)
# (primera versión, cambiada por kit2) pieza(col, al, 'ui', 'x_bordada', (960, 428, 1110, 530), ancho=48)
# (primera versión, cambiada por kit2) pieza(col, al, 'acertijos', 'baul_carretes', (888, 610, 1190, 884), ancho=200)
# (primera versión, cambiada por kit2) pieza(col, al, 'acertijos', 'bastidor_postecito', (1255, 425, 1492, 892), alto=240)
# (primera versión, cambiada por kit2) pieza(col, al, 'acertijos', 'carrete_rosa', (398, 890, 476, 986), alto=96)
# segunda hoja de Yesli (más grande y limpia): sudoku, bastidor, X, baúl, poste, carrete rosa
col, al = cargar('kit2.png')
pieza(col, al, 'ui', 'sudoku_tablero', (18, 80, 502, 572), ancho=440)
pieza(col, al, 'ui', 'picross_bastidor', (495, 30, 945, 580), ancho=460)
pieza(col, al, 'ui', 'x_bordada', (958, 48, 1158, 245), ancho=64)
pieza(col, al, 'acertijos', 'baul_carretes', (928, 258, 1278, 595), ancho=200)
pieza(col, al, 'acertijos', 'bastidor_postecito', (1272, 88, 1525, 578), alto=240)
pieza(col, al, 'acertijos', 'carrete_rosa', (68, 630, 380, 962), alto=96)
# monedas y cristales: 4 poses para girar + 1 brillante
col, al = cargar('monedas.png')
for fila, nombre, y0, y1 in [(0, 'moneda', 30, 420), (1, 'cristal', 450, 830)]:
    for i, (x0, x1) in enumerate([(15, 420), (430, 760), (790, 975), (985, 1370), (1360, 1774)], 1):
        pieza(col, al, 'items', f'{nombre}{i}', (x0, y0, x1, y1), alto=96 if i < 5 else 120)
print('listo')
# tablero_picross7_final = cuadrícula de la v2 + panel de arriba liso de la v3 (las dos de Yesli). Tablero bordado 5 × 5 del punto de cruz (imagen opaca, sin magenta): sus líneas reales se usan en miniPicross
Image.open(os.path.join(D, 'fuentes', 'tablero_picross5.png')).convert('RGB').resize((660, 660), Image.LANCZOS).save(os.path.join(R, 'ui', 'picross_tablero5.jpg'), quality=88)
print('tablero 5 × 5 listo')
# X bordada nueva (hoja suelta de Yesli): reemplaza la del kit2 (copia de la anterior en respaldo/x_bordada_kit2.png)
col, al = cargar('x_bordada2.png')
pieza(col, al, 'ui', 'x_bordada', (0, 0, 1254, 1254), ancho=96)
print('X nueva lista')
Image.open(os.path.join(D, 'fuentes', 'tablero_picross7_final.png')).convert('RGB').resize((660, 660), Image.LANCZOS).save(os.path.join(R, 'ui', 'picross_tablero7.jpg'), quality=88)
print('tablero 7 × 7 listo')
