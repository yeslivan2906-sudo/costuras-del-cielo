"""1-3 «TENDEDEROS DEL VIENTO»: piezas de las hojas de Yesli (fondo magenta), sin redibujar.
Uso: python3 -I herramientas/niveles_nuevos/preparar_tendederos.py  → assets/tendederos/*, assets/acertijos/memoria_*"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cortar import pieza, guardar
T = 'tendederos'
print(guardar(pieza('boton_rebote.png', (20, 180, 820, 700), ancho=150), T, 'boton_rebote'))
print(guardar(pieza('boton_rebote.png', (900, 360, 1720, 700), ancho=150), T, 'boton_rebote_aplastado'))
print(guardar(pieza('boton_rebote.png', (860, 190, 1760, 710), ancho=210, todo=True), T, 'boton_rebote_chispas'))
print(guardar(pieza('tendederos.png', (40, 20, 1060, 390), ancho=360), T, 'cuerda_postes'))
for i, b in enumerate([(660, 190, 760, 345), (770, 190, 885, 345)], 1): print(guardar(pieza('tendederos.png', b, alto=56), T, f'pinza{i}'))
print(guardar(pieza('tendederos.png', (40, 405, 255, 690), ancho=110), T, 'chaleco'))
print(guardar(pieza('tendederos.png', (280, 405, 480, 690), ancho=110), T, 'peto'))
print(guardar(pieza('tendederos.png', (1000, 420, 1510, 665), ancho=220), T, 'banderas'))
print(guardar(pieza('tendederos.png', (215, 190, 625, 340), ancho=190), T, 'banderines'))
print(guardar(pieza('tendederos.png', (765, 410, 980, 710), alto=110), T, 'molinillo'))
print(guardar(pieza('tendederos.png', (490, 425, 785, 615), ancho=120), T, 'nube'))
print(guardar(pieza('tendederos.png', (20, 720, 680, 1000), ancho=240), T, 'plataforma_tela'))
print(guardar(pieza('tendederos.png', (695, 720, 945, 940), ancho=124), T, 'plataforma_tela_corta'))
print(guardar(pieza('tendederos.png', (925, 790, 1235, 960), ancho=120), T, 'cojines'))
print(guardar(pieza('tendederos.png', (1215, 680, 1510, 960), ancho=120), T, 'cesta_ovillos'))
print(guardar(pieza('tendederos.png', (1075, 20, 1290, 390), alto=100), T, 'farol_colgante'))
print(guardar(pieza('tendederos.png', (1295, 20, 1520, 390), alto=100), T, 'farol_colgante_on'))
# cartas de memoria: reverso + 6 caras
cajas = [(25, 30, 420, 425), (435, 30, 825, 425), (840, 30, 1235, 425), (1245, 30, 1640, 425), (165, 475, 570, 875), (620, 475, 1025, 875), (1070, 475, 1475, 875)]
for i, b in enumerate(cajas): print(guardar(pieza('memoria.png', b, ancho=120), 'acertijos', 'memoria_reverso' if i == 0 else f'memoria_{i}'))
print(guardar(pieza('tendederos.png', (765, 410, 980, 582), ancho=80), T, 'molinillo_cabeza'))
print(guardar(pieza('tendederos.png', (1215, 680, 1510, 960), ancho=120), 'acertijos', 'cesta'))
print('listo')
