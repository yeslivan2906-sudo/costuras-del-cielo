"""1-6 «LA NOCHE DE LOS FAROLES»: farol de pie (apagado/encendido) y 4 botones de colores (normal/encendido) de Yesli.
Uso: python3 -I herramientas/niveles_nuevos/preparar_faroles.py"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cortar import pieza, guardar
H = 'faroles_botones.png'
print(guardar(pieza(H, (30, 10, 345, 745), alto=150), 'faroles', 'farol_pie'))
print(guardar(pieza(H, (350, 10, 680, 745), alto=150), 'faroles', 'farol_pie_on'))
for i, x0 in enumerate([690, 895, 1100, 1305]):
    print(guardar(pieza(H, (x0, 140, x0 + 210, 360), ancho=120), 'acertijos', f'luz_boton{i}'))
    print(guardar(pieza(H, (x0 - 5, 385, x0 + 215, 615), ancho=128), 'acertijos', f'luz_boton{i}_on'))
print(guardar(pieza(H, (505, 765, 745, 990), ancho=80), 'faroles', 'letrero'))
print(guardar(pieza(H, (1330, 820, 1515, 980), ancho=60), 'faroles', 'setas'))
