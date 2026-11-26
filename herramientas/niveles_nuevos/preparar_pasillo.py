"""1-11 «EL PASILLO DEL TELAR»: guardián encapuchado (quieto / ataque), ovillo malo, carrete-pedestal, tapiz, telar,
púas (2), cuchilla y maza que se balancean, banderines, cinta transportadora, deco (farol, caja, cesta, poste, rollos,
carretes, frascos) de la hoja telar_1-11.png de Yesli, y su tablero 8 × 8 con flores (tangram_vacio.png). Sin redibujar.
Uso: python3 -I herramientas/niveles_nuevos/preparar_pasillo.py"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cortar import pieza, guardar, hoja
import numpy as np
from PIL import Image
H = 'telar_1-11.png'
P = [  # nombre, caja (px de la hoja 1536 × 1024), ancho final
    ('guardian1', (5, 5, 252, 250), None), ('guardian2', (255, 5, 560, 262), None), ('ovillo_malo', (560, 10, 740, 215), 110),
    ('pedestal', (775, 5, 960, 225), 110), ('tapiz', (960, 10, 1150, 235), 110), ('telar', (1180, 5, 1536, 370), 260),
    ('puas1', (15, 262, 232, 395), 120), ('puas2', (232, 262, 445, 395), 120),
    ('cuchilla', (5, 395, 225, 580), 120), ('cuchilla_rapida', (215, 385, 425, 590), 120), ('maza', (405, 245, 620, 520), 120),
    ('banderin_largo', (5, 590, 335, 740), 200), ('banderin_corto', (375, 585, 610, 715), 140), ('cinta', (135, 695, 560, 805), 260),
    ('farol', (5, 765, 145, 1020), 70), ('caja', (180, 805, 345, 1020), 80), ('cesta', (340, 795, 535, 1020), 90),
    ('poste', (515, 765, 725, 1024), 100), ('rollos', (725, 800, 1015, 1020), 130), ('carretes', (1005, 800, 1295, 1020), 130),
    ('frascos', (1180, 785, 1536, 1024), 160), ('casilla_x', (1365, 385, 1525, 545), 80), ('casilla', (1365, 565, 1525, 725), 80)]
for n, b, a in P:
    print(n, guardar(pieza(H, b, ancho=a), 'pasillo', n))
print('pedestal (acertijo)', guardar(pieza(H, (775, 5, 960, 225), ancho=110), 'acertijos', 'pedestal_telar'))
for i, (y0, y1) in enumerate([(383, 455), (455, 525), (525, 597), (597, 670), (670, 748)], 1):   # madejas (rojo, azul, amarillo, verde, morado)
    print('madeja', i, guardar(pieza(H, (1165, y0, 1340, y1), ancho=70, todo=True), 'pasillo', f'madeja{i}'))
# tablero 8 × 8 de Yesli (con flores): se guarda con su recorte y se imprimen sus líneas reales relativas al recorte
col, al = hoja('tangram_vacio.png'); x0, y0, x1, y1 = 740, 700, 1254, 1220
a = al[y0:y1, x0:x1]; ys, xs = np.where(a > 0.35); bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
im = pieza('tangram_vacio.png', (x0, y0, x1, y1), todo=True)
LX = [847, 886, 924, 962, 1000, 1038, 1076, 1114, 1152]; LY = [806, 845, 883, 922, 960, 998, 1037, 1075, 1114]
ox, oy = x0 + bx0, y0 + by0
print('tablero8', im.size, 'lx', [v - ox for v in LX], 'ly', [v - oy for v in LY])
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'ui'); im.save(os.path.join(p, 'picross_tablero8.png'))
