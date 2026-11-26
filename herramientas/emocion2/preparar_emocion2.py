"""PIEZAS DE «EMOCIÓN» (2.ª tanda de Yesli): panel de resultados en piezas, rasgaduras del cielo e hilos que suben.
Las hojas llegaron con el cuadriculado de «transparente» PINTADO (no es transparencia real): ver cuadriculado.py.
Elegidas: hoja5 = panel con el título; hoja3 = botones, barras, rasgaduras e hilos. Sin redibujar.
La versión «apretada» de cada botón es la misma pieza un poco más oscura.
Uso: python3 -I herramientas/emocion2/preparar_emocion2.py
"""
import os, sys
from PIL import Image, ImageEnhance
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, D)
from cuadriculado import pieza
A = os.path.join(D, '..', '..', 'assets'); F = lambda n: os.path.join(D, 'fuentes', n)
def guarda(im, carpeta, nombre):
    os.makedirs(os.path.join(A, carpeta), exist_ok=True); im.save(os.path.join(A, carpeta, nombre + '.png')); return im.size
def apretado(im):
    r = ImageEnhance.Brightness(im.convert('RGB')).enhance(0.8); return Image.merge('RGBA', (*r.split(), im.getchannel('A')))
print('panel', guarda(pieza(F('hoja5.png'), (780, 5, 1225, 600), ancho=640), 'ui', 'res_panel'))
for nom, box, w in [('siguiente', (1170, 760, 1495, 860), 460), ('repetir', (1165, 865, 1330, 952), 240), ('mapa', (1340, 865, 1510, 952), 240)]:
    im = pieza(F('hoja3.png'), box, ancho=w); guarda(im, 'ui', 'res_' + nom); guarda(apretado(im), 'ui', 'res_' + nom + '_apretado')
for nom, box in [('vacia', (1195, 328, 1478, 385)), ('corona', (1176, 385, 1492, 445)), ('hoja', (1150, 456, 1520, 528)),
                 ('cofre', (1150, 528, 1520, 595)), ('cristal', (1150, 595, 1520, 660))]:
    print(nom, guarda(pieza(F('hoja3.png'), box, ancho=520), 'ui', 'res_barra_' + nom))
for i, box in enumerate([(10, 320, 300, 455), (295, 320, 595, 455), (565, 320, 750, 455)], 1):
    print('rasgadura', i, guarda(pieza(F('hoja3.png'), box, ancho=700 if i < 3 else 480), 'retos', f'rasgadura{i}'))
for i, box in enumerate([(18, 560, 188, 688), (192, 520, 362, 688), (368, 480, 540, 688), (548, 455, 755, 688)], 1):
    print('hilos', i, guarda(pieza(F('hoja3.png'), box, ancho=118), 'retos', f'hilos_sube{i}'))
print('listo')
