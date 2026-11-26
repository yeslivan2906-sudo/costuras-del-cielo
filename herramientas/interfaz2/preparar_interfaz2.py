"""Paquete de interfaz de Yesli (fondo BLANCO): medallones del mapa del capítulo, candado, panel «Continuar» y sus
botones, fondo de Opciones sin letras y fondo del mapa sin panel. El blanco se quita solo si toca el borde del recorte
(relleno desde los bordes), así los blancos de dentro de las piezas se respetan. Sin redibujar.
Uso: python3 -I herramientas/interfaz2/preparar_interfaz2.py"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
D = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(D, '..', '..', 'assets', 'interfaz2')
H = np.array(Image.open(os.path.join(D, 'fuentes', 'paquete_interfaz.png')).convert('RGB')).astype(float)
M2 = np.array(Image.open(os.path.join(D, 'fuentes', 'medallones2.png')).convert('RGB')).astype(float)

def pieza(n, caja, ancho=None, hoja=None):
    x0, y0, x1, y1 = caja; a = (H if hoja is None else hoja)[y0:y1, x0:x1]
    claro = (a.min(2) > 226) & (a.max(2) - a.min(2) < 30)          # blanco del fondo
    lab, k = ndimage.label(claro); borde = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    fondo = np.isin(lab, list(borde))
    d = ndimage.distance_transform_edt(~fondo)                       # borde suave de 2 px
    al = np.clip(d / 2.0, 0, 1)
    rgba = np.dstack([a, al * 255]).clip(0, 255).astype(np.uint8)
    ys, xs = np.nonzero(al > 0.05); im = Image.fromarray(rgba).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    if ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    elif hoja is not None: im = im.resize((round(im.width / 2), round(im.height / 2)), Image.LANCZOS)   # medallones a la mitad
    im.save(os.path.join(OUT, n + '.png')); print(n, im.size)

# medallones (hoja 2 de Yesli, con flores y carretes): fila de arriba = abierto · cerrado · el que toca;
# fila de abajo = variantes de cielo, retazos y galaxia. Mismo ancho de anillo → misma escala (ancho total 300).
for n, caja in [('medallon_abierto', (40, 15, 600, 375)), ('medallon_cerrado', (610, 15, 1160, 375)), ('medallon_actual', (1160, 0, 1774, 385)),
                ('medallon_cielo', (40, 385, 600, 715)), ('medallon_retazos', (610, 385, 1160, 715)), ('medallon_galaxia', (1160, 385, 1774, 725))]:
    pieza(n, caja, None, M2)
pieza('candado', (800, 715, 965, 887), None, M2)
pieza('panel_continuar', (984, 372, 1534, 684), 680)
pieza('boton_continuar', (1068, 708, 1450, 804), 280); pieza('boton_eliminar', (1074, 822, 1426, 908), 240)
# fondos opacos (se estiran a 720 × 1280)
for n, caja in [('opciones_fondo_sin_letras', (0, 0, 598, 1024)), ('mapa_sin_panel', (607, 329, 970, 1022))]:
    Image.fromarray(H[caja[1]:caja[3], caja[0]:caja[2]].astype(np.uint8)).resize((720, 1280), Image.LANCZOS).save(os.path.join(OUT, n + '.jpg'), quality=90); print(n)
