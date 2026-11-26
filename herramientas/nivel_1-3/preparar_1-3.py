"""ARTE DEL 1-3 «El Bosque de Hilos» desde las láminas de Yesli (fondo magenta), sin redibujar.
Uso: python3 -I herramientas/nivel_1-3/preparar_1-3.py
 · assets/criaturas/arana_<colgar|bajar|aviso|golpe|remendarse><n>.png: lienzo 200 × 170; el hilo de cada cuadro se borra
   (el juego lo dibuja con el largo que toque) y el punto donde el hilo toca el cuerpo queda en (100, 40).
 · assets/retos/: tablon_descose1..3, alfileres1..3, carrete_control_apagado/encendido.
 · assets/acertijos/: hilos_tablero, carrete_<rojo|azul|amarillo|verde|violeta>, bordado_bastidor, bordado_flor,
   puntada_<recta|curva|cruce|contorno>, caja_costura, bastidor_poste.
 · assets/backgrounds/: bosque_cielo.jpg, bosque_medio.png, bosque_frente.png.
El magenta se quita con un umbral más alto que en hojas anteriores: aquí hay flores rosadas y una araña morada que
el umbral viejo volvía medio transparentes.
"""
import os, json
import numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(D, 'fuentes'); A = os.path.join(D, '..', '..', 'assets')
for c in ('retos',): os.makedirs(os.path.join(A, c), exist_ok=True)
M = np.array([255, 0, 255], np.float32)

def sin_magenta(path):
    a = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    d = np.minimum(R, B) - G
    al = 1 - np.clip((d - 105) / 110, 0, 1)
    al = np.where(al < 0.06, 0, al)
    col = np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255)
    # separadores blancos de la lámina fuera
    blanco = (a.min(-1) > 238)
    return col, al, blanco

def corte(col, al, x0, y0, x1, y1, quitar_blanco=None):
    c = col[y0:y1, x0:x1]; a = al[y0:y1, x0:x1].copy()
    if quitar_blanco is not None: a[quitar_blanco[y0:y1, x0:x1]] = 0
    # sólo lo conectado a la figura principal (fuera migas de letreros vecinos)
    n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate((a > 0.3).astype(np.uint8), np.ones((7, 7), np.uint8)))
    if n > 1:
        g = st[1:, 4].max(); keep = np.isin(lab, [i for i in range(1, n) if st[i, 4] > g * 0.04])
        a = np.where(keep, a, 0)
    im = Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA')
    return im.crop(im.getbbox())

def guardar(im, carpeta, nombre, alto=None, ancho=None):
    if alto: im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
    if ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    im.save(os.path.join(A, carpeta, nombre + '.png')); return im

info = {}
# ---------- ARAÑA (segunda lámina) ----------
col, al, bl = sin_magenta(os.path.join(F, 'hoja_arana_tablero.png'))
filas = [('colgar', 0, 186), ('bajar', 201, 386), ('aviso', 392, 540), ('golpe', 550, 708), ('remendarse', 730, 905)]
W, H, AX, AY = 200, 170, 100, 40
for nombre, y0, y1 in filas:
    a = al[y0:y1, 150:752].copy(); a[bl[y0:y1, 150:752]] = 0
    # líneas separadoras de la lámina (filas casi llenas) fuera
    fr = (a > 0.3).mean(1)
    llenas = [r for r in range(len(fr)) if fr[r] > 0.8 and fr[max(0, r - 5)] < 0.6 and fr[min(len(fr) - 1, r + 5)] < 0.6]
    for r in llenas: a[max(0, r - 2):r + 3] = 0
    # cuadros: los N cuerpos más grandes (sin hilos ni destellos) y cortes a mitad de camino entre cuerpos
    N = {'colgar': 4, 'bajar': 3, 'aviso': 2, 'golpe': 2, 'remendarse': 4}[nombre]
    cuerpo = cv2.erode((a > 0.5).astype(np.uint8), np.ones((9, 9), np.uint8))
    n, lab, st, cc = cv2.connectedComponentsWithStats(cuerpo)
    big = sorted(sorted(range(1, n), key=lambda i: -st[i, 4])[:N], key=lambda i: cc[i][0])
    cx = [cc[i][0] for i in big]
    cortes = [0] + [int((cx[k] + cx[k + 1]) / 2) for k in range(N - 1)] + [a.shape[1]]
    tr = list(zip(cortes[:-1], cortes[1:]))
    for i, ((s, e), bx) in enumerate(zip(tr, cx), 1):
        sub_a = a[:, s:e].copy(); sub_c = col[y0:y1, 150 + s:150 + e]
        cuenta = (sub_a > 0.5).sum(1)
        top_body = int(np.argmax(cuenta > 40))           # primera fila ancha = arriba del cuerpo
        # hilo: columna central de las filas finas sobre el cuerpo
        finas = [(r, np.nonzero(sub_a[r] > 0.5)[0]) for r in range(max(0, top_body - 30), top_body) if 0 < cuenta[r] < 12]
        hx = np.median([xs.mean() for _, xs in finas]) if finas else bx - s
        # borrar el hilo: banda de ±6 px sobre el cuerpo (los destellos de los lados se quedan)
        x0b, x1b = int(hx - 7), int(hx + 8)
        sub_a[:top_body + 2, x0b:x1b] = 0
        im = Image.fromarray(np.dstack([sub_c, sub_a * 255]).astype(np.uint8), 'RGBA')
        c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.alpha_composite(im, (int(round(AX - hx)), int(AY - top_body)))
        c.save(os.path.join(A, 'criaturas', f'arana_{nombre}{i}.png'))
    info['arana_' + nombre] = len(tr)

# tablero, bastidor y flor
guardar(corte(col, al, 784, 74, 1184, 486, bl), 'acertijos', 'hilos_tablero', ancho=440)
guardar(corte(col, al, 1232, 62, 1500, 288, bl), 'acertijos', 'bordado_bastidor', ancho=440)
import sys; sys.path.insert(0, os.path.join(D, '..', 'acertijos')); from magenta import quitar_magenta
c2, a2 = quitar_magenta(os.path.join(F, 'hoja_arana_tablero.png'))
flor = corte(c2, a2, 1270, 330, 1460, 508, bl)
info['flor_px'] = flor.size
# la flor se guarda en la MISMA escala que el bastidor y con su posición dentro del aro (medida a ojo sobre la lámina:
# centro del aro 1366,176 en la lámina; la flor apagada del aro mide ~ 0.72 de la flor encendida)
guardar(flor, 'acertijos', 'bordado_flor')

# ---------- PRIMERA LÁMINA ----------
col, al, bl = sin_magenta(os.path.join(F, 'hoja_bosque_1.png'))
for i, box in enumerate([(800, 50, 1020, 122), (1040, 40, 1264, 134), (1286, 40, 1514, 138)], 1):
    guardar(corte(col, al, *box, bl), 'retos', f'tablon_descose{i}')
for i, box in enumerate([(824, 184, 970, 282), (1066, 172, 1222, 282), (1300, 166, 1480, 282)], 1):
    guardar(corte(col, al, *box, bl), 'retos', f'alfileres{i}')
guardar(corte(col, al, 896, 328, 1082, 466, bl), 'retos', 'carrete_control_apagado')
guardar(corte(col, al, 1186, 322, 1402, 468, bl), 'retos', 'carrete_control_encendido')
for nm, x0 in zip(['rojo', 'azul', 'amarillo', 'verde', 'violeta'], [540, 583, 628, 670, 713]):
    guardar(corte(col, al, x0, 543, x0 + 43, 604, bl), 'acertijos', f'carrete_{nm}', alto=96)
for nm, box in zip(['recta', 'curva', 'cruce', 'contorno'],
                   [(1306, 532, 1404, 626), (1418, 532, 1516, 626), (1306, 628, 1404, 722), (1418, 628, 1516, 722)]):
    guardar(corte(col, al, *box, bl), 'acertijos', f'puntada_{nm}', ancho=150)
guardar(corte(col, al, 36, 778, 252, 960, bl), 'acertijos', 'caja_costura', ancho=150)
guardar(corte(col, al, 298, 776, 470, 962, bl), 'acertijos', 'bastidor_poste', alto=200)

# ---------- FONDO (3 capas, panel por panel) ----------
src = os.path.join(F, 'fondo_capas.png')
cielo = Image.open(src).convert('RGB').crop((3, 3, 549, 938))
cielo.resize((760, round(cielo.height * 760 / cielo.width)), Image.LANCZOS).save(os.path.join(A, 'backgrounds', 'bosque_cielo.jpg'), quality=88)
col, al, bl = sin_magenta(src)
for nm, (x0, x1), w in [('bosque_medio', (565, 1106), 900), ('bosque_frente', (1121, 1669), 720)]:
    im = Image.fromarray(np.dstack([col[0:941, x0:x1], al[0:941, x0:x1] * 255]).astype(np.uint8), 'RGBA')
    im.resize((w, round(941 * w / (x1 - x0))), Image.LANCZOS).save(os.path.join(A, 'backgrounds', nm + '.png'))
print(json.dumps(info))

# ---------- PIEZAS v2 (lámina individual de Yesli, más grande): tablero morado, bastidor y flor ----------
src = os.path.join(F, 'hoja_piezas_v2.png')
col, al, bl = sin_magenta(src)
guardar(corte(col, al, 575, 30, 1110, 680, bl), 'acertijos', 'hilos_tablero', ancho=480)
bast = guardar(corte(col, al, 1130, 30, 1650, 690, bl), 'acertijos', 'bordado_bastidor', ancho=440)
c2, a2 = quitar_magenta(src)
# la flor sólo es dorada: cualquier borde rosado/morado es mezcla con el magenta → al dorado
rosa = c2[..., 2] > c2[..., 1] + 10
c2 = np.where(rosa[..., None], np.array([255, 205, 90], np.float32) * np.maximum(c2.max(-1, keepdims=True) / 255, 0.7), c2)
a2 = np.where(rosa, a2 * 0.8, a2)
flor = corte(c2, a2, 1672, 30, 2162, 680, bl)
guardar(flor, 'acertijos', 'bordado_flor', ancho=round(flor.width * 440 / (1650 - 1130)))
