"""1-9 «EL DESVÁN DE LOS RETALES»: balanza de Yesli partida en 4 piezas para que se mueva (brazo que gira, 2 platillos
que cuelgan rectos, poste con base), carretes de 6 colores, saquitos, cofre y alfiletero. Sin redibujar.
Uso: python3 -I herramientas/niveles_nuevos/preparar_desvan.py"""
import os, sys, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from cortar import pieza, guardar, hoja
H = 'desvan.png'; col, al = hoja(H)
def zona(rects, nombre, K=0.5):
    m = np.zeros(al.shape, np.float32)
    for x0, y0, x1, y1 in rects: m[y0:y1, x0:x1] = 1
    a = al * m; im = Image.fromarray(np.dstack([col, a * 255]).astype(np.uint8), 'RGBA'); bb = im.getbbox(); im = im.crop(bb)
    im = im.resize((round(im.width * K), round(im.height * K)), Image.LANCZOS); guardar(im, 'acertijos', nombre); return [b * K for b in bb]
info = {}
info['brazo'] = zona([(30, 20, 650, 140), (270, 20, 410, 160)], 'balanza_brazo')
info['plato_izq'] = zona([(20, 140, 272, 402)], 'balanza_plato_izq')
info['plato_der'] = zona([(392, 140, 650, 402)], 'balanza_plato_der')
info['base'] = zona([(282, 160, 382, 415), (255, 340, 422, 415), (120, 405, 548, 522)], 'balanza_base')
print(json.dumps(info))
for i, (x0, y0) in enumerate([(650, 45), (795, 45), (940, 45), (650, 262), (795, 262), (940, 262)]):
    guardar(pieza(H, (x0, y0, x0 + 145, y0 + 185), alto=90), 'acertijos', f'carrete{i}')
for i, b in enumerate([(1108, 45, 1252, 240), (1252, 45, 1388, 240), (1386, 45, 1522, 240), (1162, 258, 1308, 450), (1322, 258, 1478, 450)]):
    guardar(pieza(H, b, alto=90), 'acertijos', f'saquito{i}')
print(guardar(pieza(H, (680, 715, 968, 980), ancho=110), 'desvan', 'cofre'))
print(guardar(pieza(H, (680, 715, 968, 980), ancho=110), 'acertijos', 'cofre_desvan'))
print(guardar(pieza(H, (1275, 815, 1528, 980), ancho=80), 'desvan', 'alfiletero'))
print(guardar(pieza(H, (985, 790, 1265, 975), ancho=90), 'desvan', 'rollos'))
