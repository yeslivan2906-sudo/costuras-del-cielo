"""1-8 «LOS ENGRANAJES ROTOS»: engranajes, palanca y caja de Yesli (hoja engranajes.png) + tubos de cremallera
(hoja tangram_vacio.png, ya recortados por preparar_arroyo.py). El tubo RECTO no venía: se hace por código.
Uso: python3 -I herramientas/niveles_nuevos/preparar_engranajes.py"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cortar import pieza, guardar
H = 'engranajes.png'
print(guardar(pieza(H, (40, 15, 415, 360), ancho=240), 'engranajes', 'engranaje_grande'))
print(guardar(pieza(H, (430, 15, 805, 360), ancho=240), 'engranajes', 'engranaje_roto'))
print(guardar(pieza(H, (370, 355, 670, 640), ancho=200), 'engranajes', 'engranaje_rueda'))
print(guardar(pieza(H, (720, 395, 925, 595), ancho=90), 'engranajes', 'engranaje_mediano'))
print(guardar(pieza(H, (960, 425, 1130, 595), ancho=70), 'engranajes', 'engranaje_chico'))
print(guardar(pieza(H, (1160, 455, 1440, 630), ancho=110), 'engranajes', 'palanca'))
print(guardar(pieza(H, (1090, 820, 1290, 1010), ancho=70), 'engranajes', 'caja'))
print(guardar(pieza(H, (30, 360, 315, 640), ancho=120), 'engranajes', 'ventilador'))
