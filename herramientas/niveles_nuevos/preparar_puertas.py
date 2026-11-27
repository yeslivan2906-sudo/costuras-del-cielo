"""PUERTA MÁGICA de Yesli (puertas_magicas.png) para todos los niveles: cerrada, brillando (lista para abrir), abierta y los
8 cuadros de la animación de apertura. Todas a la misma altura (280 px) para que encajen al pie de la puerta. Sin redibujar.
Uso: python3 -I herramientas/niveles_nuevos/preparar_puertas.py"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cortar import pieza, guardar
H = 'puertas_magicas.png'; ALTO = 280
G = [('cerrada', (12, 15, 505, 641)), ('brilla', (506, 14, 990, 640)), ('abierta', (994, 14, 1522, 641))]
P = [(7, 183), (191, 361), (367, 537), (541, 710), (715, 896), (900, 1088), (1092, 1298), (1305, 1529)]
for n, b in G: print(n, guardar(pieza(H, b, alto=ALTO), 'puertas', n))
for i, (x0, x1) in enumerate(P, 1): print('abre', i, guardar(pieza(H, (x0, 695, x1, 934), alto=ALTO), 'puertas', f'abre{i}'))
