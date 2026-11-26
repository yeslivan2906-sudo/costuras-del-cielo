"""1-5 «EL ARROYO DE RETAZOS» y piezas de la hoja tangram/cremallera de Yesli (fondo magenta), sin redibujar.
El tablero del tangram viene VACÍO: la silueta la dibuja el juego con las 5 piezas reales (siempre se puede armar).
Uso: python3 -I herramientas/niveles_nuevos/preparar_arroyo.py"""
import os, sys, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cortar import pieza, guardar
H = 'tangram_vacio.png'
print('tablero', guardar(pieza(H, (95, 10, 620, 500), ancho=440), 'acertijos', 'tangram_tablero'))
K = 0.5   # todas las piezas a la misma escala (mitad de la hoja) para que guarden su proporción
tam = {}
for n, b in [('azul', (650, 20, 1010, 236)), ('rojo', (1005, 30, 1205, 242)), ('amarillo', (636, 250, 795, 445)), ('morado', (800, 252, 1036, 460)), ('verde', (1052, 280, 1202, 445))]:
    im = pieza(H, b); im = im.resize((round(im.width * K), round(im.height * K))); tam[n] = guardar(im, 'acertijos', 'tangram_' + n)
print(json.dumps(tam))
# cremallera (1-8)
print(guardar(pieza(H, (30, 520, 630, 612), ancho=300), 'retos', 'cremallera'))
print(guardar(pieza(H, (300, 618, 420, 752), alto=64), 'retos', 'cremallera_tirador'))
for n, b in [('curva', (655, 525, 812, 708)), ('te', (828, 522, 1018, 690)), ('cruz', (1015, 510, 1218, 712))]:
    print(n, guardar(pieza(H, b, ancho=120), 'acertijos', 'tubo_' + n))
# 1-5: parche que aparece y desaparece (el borde de tela con parche azul) y el ovillo con agujas que rueda
print('parche', guardar(pieza('costura_1-10.png', (912, 625, 1275, 722), ancho=124), 'arroyo', 'parche'))
print('parche2', guardar(pieza('costura_1-10.png', (912, 520, 1275, 612), ancho=124), 'arroyo', 'parche_botones'))
print('costurero', guardar(pieza('desvan.png', (680, 810, 970, 990), ancho=120), 'acertijos', 'costurero'))
print('ovillo', guardar(pieza('telar_1-11.png', (552, 12, 775, 250), ancho=96), 'arroyo', 'ovillo_agujas'))
