"""1-10 «LA ESCALERA DE AGUJAS»: tablero de sudoku 6 × 6 y fichas 1–6, pinchos que suben (3 estados), escalera de cuerda,
alfileres de colores (hoja costura_1-10.png de Yesli). Sin redibujar.
Uso: python3 -I herramientas/niveles_nuevos/preparar_agujas.py"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cortar import pieza, guardar
H = 'costura_1-10.png'
print('tablero', guardar(pieza(H, (440, 245, 900, 715), todo=True), 'acertijos', 'sudoku6_tablero'))
for i, b in enumerate([(18, 312, 160, 458), (158, 312, 298, 458), (296, 312, 438, 458), (18, 475, 160, 622), (158, 475, 298, 622), (296, 475, 438, 622)], 1):
    guardar(pieza(H, b, ancho=96), 'acertijos', f'numero{i}')
for i, b in enumerate([(640, 100, 845, 225), (850, 85, 1055, 225), (1060, 10, 1265, 225)]):
    print('pincho', i, guardar(pieza(H, b, ancho=100, todo=True), 'agujas', f'pinchos{i}'))
print('escalera', guardar(pieza(H, (1305, 5, 1520, 735), ancho=60), 'agujas', 'escalera'))
for i, x0 in enumerate([40, 150, 260, 370, 480]):
    guardar(pieza(H, (x0, 15, x0 + 115, 250), alto=60), 'agujas', f'alfiler{i}')
print(guardar(pieza(H, (10, 720, 300, 990), ancho=90), 'agujas', 'alfiletero'))
