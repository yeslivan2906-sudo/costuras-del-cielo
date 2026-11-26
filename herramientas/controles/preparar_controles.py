"""CONTROLES Y PAUSA de Yesli (hoja de fieltro bordado, fondo magenta), sin redibujar.
Uso: python3 -I herramientas/controles/preparar_controles.py
Salen en assets/ui/: pausa_panel, boton_ancho / boton_ancho_apretado, icono_<seguir|reiniciar|sonido_si|sonido_no|mapa|pista>,
joy_base / joy_base_apretada, joy_perilla / joy_perilla_apretada, btn_pausa / btn_pausa_apretado, btn_saltar(_apretado),
btn_coser(_apretado), btn_ataque(_apretado), pista_cuadro. Los letreros de la hoja se quitan (se guarda solo la pieza más grande).
"""
import os, sys
import numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(D, '..', '..', 'assets', 'ui')
os.makedirs(A, exist_ok=True)
# fondo magenta por DISTANCIA al color (255, 0, 255): el fieltro morado de Yesli se parece al magenta y el quitado de
# siempre lo volvía transparente
_a = np.array(Image.open(os.path.join(D, 'fuentes', 'hoja_ui.png')).convert('RGB')).astype(np.float32)
_M = np.array([255, 0, 255], np.float32)
_d = np.sqrt(((_a - _M) ** 2).sum(-1))
al = np.clip((_d - 55) / 70, 0, 1)
col = np.clip((_a - (1 - al[..., None]) * _M) / np.maximum(al[..., None], 0.05), 0, 255)

def pieza(nombre, x0, y0, x1, y1, ancho):
    a = al[y0:y1, x0:x1].copy(); c = col[y0:y1, x0:x1]
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.35).astype(np.uint8))
    if n > 1:
        k = 1 + int(np.argmax(st[1:, 4])); m = cv2.dilate((lab == k).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        a = np.where(m, a, 0)
    im = Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA'); im = im.crop(im.getbbox())
    im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS).save(os.path.join(A, nombre + '.png'))

pieza('pausa_panel', 20, 5, 582, 810, 520)
pieza('boton_ancho', 610, 5, 1172, 116, 380)
pieza('boton_ancho_apretado', 610, 116, 1172, 230, 380)
for nom, x0 in zip(['seguir', 'reiniciar', 'sonido_si', 'sonido_no', 'mapa', 'pista'], [612, 761, 910, 1055, 1202, 1351]):
    pieza('icono_' + nom, x0, 236, x0 + 124, 346, 64)
pieza('joy_base', 600, 404, 808, 600, 200); pieza('joy_base_apretada', 802, 404, 1008, 600, 200)
pieza('joy_perilla', 1012, 450, 1120, 556, 90); pieza('joy_perilla_apretada', 1124, 450, 1232, 556, 90)
pieza('btn_pausa', 1270, 428, 1380, 530, 80); pieza('btn_pausa_apretado', 1386, 428, 1494, 530, 80)
pieza('btn_saltar', 588, 658, 720, 786, 120); pieza('btn_saltar_apretado', 722, 658, 852, 786, 120)
pieza('btn_coser', 876, 658, 1010, 786, 120); pieza('btn_coser_apretado', 1012, 658, 1145, 786, 120)
pieza('btn_ataque', 1162, 630, 1338, 800, 140); pieza('btn_ataque_apretado', 1340, 630, 1512, 800, 140)
pieza('pista_cuadro', 60, 825, 1255, 1018, 680)
print('listo:', len(os.listdir(A)))
