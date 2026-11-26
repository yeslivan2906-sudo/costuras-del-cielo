"""ARTE DEL 1-5 «El Corazón del Telar» (Eryndor) desde las imágenes de Yesli (fondo magenta), sin redibujar.
Uso: python3 -I herramientas/nivel_1-5/preparar_1-5.py
 · assets/criaturas/eryndor_<aviso|lanzar|descoser|cansado|golpe|escudo|remendarse><n>.png: lienzo 360 × 240 con el
   centro del cuerpo en (180, 125); mira a la derecha (las agujas salen a la derecha). Los letreros de la hoja se quitan.
 · assets/criaturas/eryndor_flotar1..6 (la propuesta de 6 cuadros, mismo lienzo), aguja1..3, ovillo1..4.
 · assets/personajes/eryndor_cara.png (para los diálogos), assets/menus/barra_jefe.png (+ barra_jefe.json con el hueco rojo).
 · assets/acertijos/nudos_tablero, nudo_atado, nudo_desatado.
 · assets/backgrounds/corazon_cielo.jpg, corazon_medio.jpg (opaca, la sala del telar), corazon_frente.png; fin_capitulo1.jpg.
"""
import os, sys, json
import numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(D, 'fuentes'); A = os.path.join(D, '..', '..', 'assets')
M = np.array([255, 0, 255], np.float32)

def sin_magenta(path, umbral=105):
    a = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    d = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    al = 1 - np.clip((d - umbral) / 110, 0, 1); al = np.where(al < 0.06, 0, al)
    col = np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255)
    return col, al

def imagen(col, al): return Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), 'RGBA')

def principal(al, frac=0.04, dil=7):
    n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate((al > 0.3).astype(np.uint8), np.ones((dil, dil), np.uint8)))
    if n <= 1: return al
    g = st[1:, 4].max(); return np.where(np.isin(lab, [i for i in range(1, n) if st[i, 4] > g * frac]), al, 0)

def recorta(col, al, box, frac=0.04):
    x0, y0, x1, y1 = box; c, a = col[y0:y1, x0:x1], principal(al[y0:y1, x0:x1].copy(), frac)
    im = imagen(c, a); return im.crop(im.getbbox())

def guardar(im, carpeta, nombre, ancho=None, alto=None, jpg=False):
    if ancho and im.width > ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    if alto and im.height > alto: im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
    os.makedirs(os.path.join(A, carpeta), exist_ok=True)
    if jpg: im.convert('RGB').save(os.path.join(A, carpeta, nombre + '.jpg'), quality=86)
    else: im.save(os.path.join(A, carpeta, nombre + '.png'))
    return im

def cuadros(col, al, y0, y1, x0, x1, n, nombre, W=360, H=240, CX=180, CY=125, k=1.0, frac=0.03, borde=0):
    """parte una tira en n cuadros (cortes a mitad de camino entre los n cuerpos más grandes) y centra cada cuerpo."""
    a = al[y0:y1, x0:x1].copy(); c = col[y0:y1, x0:x1]
    if borde: a[:borde] = 0; a[-borde:] = 0   # líneas separadoras de la hoja
    cuerpo = cv2.erode((a > 0.6).astype(np.uint8), np.ones((11, 11), np.uint8))
    nn, lab, st, cc = cv2.connectedComponentsWithStats(cuerpo)
    big = sorted(sorted(range(1, nn), key=lambda i: -st[i, 4])[:n], key=lambda i: cc[i][0])
    cx = [cc[i][0] for i in big]; cy = [cc[i][1] for i in big]
    cortes = [0] + [int((cx[j] + cx[j + 1]) / 2) for j in range(n - 1)] + [a.shape[1]]
    for j in range(n):
        s0, s1 = cortes[j], cortes[j + 1]
        sub = principal(a[:, s0:s1].copy(), frac, 15)
        im = imagen(c[:, s0:s1], sub)
        if k != 1: im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        out.alpha_composite(im, (int(round(CX - (cx[j] - s0) * k)), int(round(CY - cy[j] * k))))
        out.save(os.path.join(A, 'criaturas', f'{nombre}{j + 1}.png'))

info = {}
# ---------- Eryndor: hoja de acciones ----------
col, al = sin_magenta(os.path.join(F, 'eryndor_hoja.png'))
blanco = np.array(Image.open(os.path.join(F, 'eryndor_hoja.png')).convert('RGB')).min(-1) > 225
al[blanco] = 0   # letreros, líneas separadoras
for (x0, x1, y0, y1) in [(0, 150, 0, 193), (583, 735, 0, 193), (0, 182, 196, 401), (0, 162, 405, 597), (935, 1100, 405, 597), (0, 182, 600, 801), (0, 182, 805, 1024)]:
    al[y0:y1, x0:x1] = 0
al[:, 555:578][:200] = 0; al[405:597, 920:940] = 0
for (y0, y1, x0, x1, n, nom) in [(0, 193, 150, 560, 2, 'aviso'), (0, 193, 735, 1536, 4, 'lanzar'), (196, 401, 182, 1536, 4, 'descoser'),
                                 (405, 597, 162, 925, 4, 'cansado'), (405, 597, 1100, 1536, 2, 'golpe'), (600, 801, 182, 1536, 4, 'escudo'),
                                 (805, 1024, 182, 1536, 6, 'remendarse')]:
    cuadros(col, al, y0, y1, x0, x1, n, 'eryndor_' + nom, frac=0.15 if nom == 'lanzar' else 0.03, borde=9)
# propuesta de «flotar» (6 cuadros): se escala para que mida lo mismo que los cuadros de la hoja (≈ 170 px de alto)
col, al = sin_magenta(os.path.join(F, 'eryndor_flotar.png'))
cuadros(col, al, 120, 560, 0, 2172, 6, 'eryndor_flotar', k=0.52)
# ---------- aguja y ovillo ----------
col, al = sin_magenta(os.path.join(F, 'aguja_ovillo.png'))
for i, (x0, x1) in enumerate([(40, 640), (760, 1400), (1460, 2172)], 1): guardar(recorta(col, al, (x0, 60, x1, 260)), 'criaturas', f'aguja{i}', ancho=200)
for i, (x0, x1) in enumerate([(90, 470), (620, 980), (1110, 1480), (1640, 2100)], 1):
    im = recorta(col, al, (x0, 300, x1, 700), frac=0.002); im = im.resize((120, round(im.height * 120 / im.width)), Image.LANCZOS)
    c = Image.new('RGBA', (130, 150), (0, 0, 0, 0)); c.alpha_composite(im, (65 - im.width // 2, 150 - im.height)); c.save(os.path.join(A, 'criaturas', f'ovillo{i}.png'))
# ---------- cara para los diálogos, barra del jefe ----------
col, al = sin_magenta(os.path.join(F, 'eryndor_retrato.png'))
cara = imagen(col, al).crop((440, 20, 920, 500)).resize((170, 170), Image.LANCZOS)
os.makedirs(os.path.join(A, 'personajes'), exist_ok=True); cara.save(os.path.join(A, 'personajes', 'eryndor_cara.png'))
col, al = sin_magenta(os.path.join(F, 'barra_jefe.png'))
barra = recorta(col, al, (0, 0, 2135, 737), frac=0.002); bb = imagen(col, principal(al, 0.002)).getbbox()
arr = np.array(Image.open(os.path.join(F, 'barra_jefe.png')).convert('RGB')).astype(int)
rojo = (arr[..., 0] > 180) & (arr[..., 1] < 70) & (arr[..., 2] < 70)
barra = guardar(barra, 'menus', 'barra_jefe', ancho=720)
b2 = np.array(barra).astype(int); rojo = (b2[..., 0] > 190) & (b2[..., 1] < 60) & (b2[..., 2] < 60) & (b2[..., 3] > 200)
ys, xs = np.nonzero(rojo); f = 1
hueco = [int(np.percentile(xs, 1)), int(np.percentile(ys, 1)), int(np.percentile(xs, 99)), int(np.percentile(ys, 99))]
json.dump({'ancho': 720, 'alto': round(barra.height * f), 'hueco': hueco}, open(os.path.join(A, 'menus', 'barra_jefe.json'), 'w'))
info['barra'] = hueco
# ---------- Desata los nudos ----------
col, al = sin_magenta(os.path.join(F, 'tablero_nudos.png'))
guardar(imagen(col, al).crop(imagen(col, al).getbbox()), 'acertijos', 'nudos_tablero', ancho=500)
for n in ['nudo_atado', 'nudo_desatado']:
    col, al = sin_magenta(os.path.join(F, n + '.png')); guardar(recorta(col, al, (0, 0, 600, 360), 0.01), 'acertijos', n, ancho=180)
# ---------- fondo de la arena (segunda propuesta: la sala del telar con suelo) y fin de capítulo ----------
src = os.path.join(F, 'fondo_b.png'); bruto = Image.open(src).convert('RGB')
bruto.crop((3, 3, 549, 938)).resize((760, round(935 * 760 / 546)), Image.LANCZOS).save(os.path.join(A, 'backgrounds', 'corazon_cielo.jpg'), quality=84)
bruto.crop((562, 3, 1111, 938)).resize((800, round(935 * 800 / 549)), Image.LANCZOS).save(os.path.join(A, 'backgrounds', 'corazon_medio.jpg'), quality=84)
col, al = sin_magenta(src)
fr = imagen(col[3:938, 1125:1672], al[3:938, 1125:1672]); fr.resize((760, round(fr.height * 760 / fr.width)), Image.LANCZOS).save(os.path.join(A, 'backgrounds', 'corazon_frente.png'))
Image.open(os.path.join(F, 'fin_capitulo.png')).convert('RGB').resize((720, round(1448 * 720 / 1086)), Image.LANCZOS).save(os.path.join(A, 'backgrounds', 'fin_capitulo1.jpg'), quality=86)
print(json.dumps(info))
