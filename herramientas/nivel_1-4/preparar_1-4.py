"""ARTE DEL 1-4 «La Torre del Reloj» desde las imágenes de Yesli (fondo magenta o ya transparentes), sin redibujar.
Uso: python3 -I herramientas/nivel_1-4/preparar_1-4.py
 · assets/retos/: fuelle_apagado, fuelle_soplando (la boquilla mira a la derecha), engranaje_plataforma,
   compuerta_cerrada/abierta, palanca_arriba/abajo, cuerda_boton (el botón del que cuelga el columpio).
 · assets/criaturas/tijeras_<volar|aviso|cortar|golpe|remendarse><n>.png: lienzo 360 × 210 con el botón (eje) en el centro.
 · assets/acertijos/: engranajes_tablero, engranaje_1..5 (de grande a pequeño), patron_bastidor, deslizante_dibujo (600),
   caja_musica, reloj_cuco.
 · assets/backgrounds/: torre_cielo.jpg, torre_medio.jpg (opaca: la torre por dentro), torre_frente.png.
"""
import os, sys, json
import numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(D, 'fuentes'); A = os.path.join(D, '..', '..', 'assets')
sys.path.insert(0, os.path.join(D, '..', 'acertijos')); from magenta import quitar_magenta
M = np.array([255, 0, 255], np.float32)

def sin_magenta(path, umbral=105):
    a = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    d = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    al = 1 - np.clip((d - umbral) / 110, 0, 1); al = np.where(al < 0.06, 0, al)
    col = np.clip((a - (1 - al[..., None]) * M) / np.maximum(al[..., None], 0.05), 0, 255)
    return col, al, a.min(-1) > 238

def recorta(col, al, box=None, blanco=None, limpiar=True):
    if box: x0, y0, x1, y1 = box; col, al = col[y0:y1, x0:x1], al[y0:y1, x0:x1].copy(); blanco = blanco[y0:y1, x0:x1] if blanco is not None else None
    else: al = al.copy()
    if blanco is not None: al[blanco & (al > 0.9) & False] = 0
    if limpiar:   # solo lo conectado a la figura principal
        n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate((al > 0.3).astype(np.uint8), np.ones((7, 7), np.uint8)))
        if n > 1:
            g = st[1:, 4].max(); al = np.where(np.isin(lab, [i for i in range(1, n) if st[i, 4] > g * 0.04]), al, 0)
    im = Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), 'RGBA'); return im.crop(im.getbbox())

def guardar(im, carpeta, nombre, ancho=None, alto=None):
    if ancho and im.width > ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    if alto and im.height > alto: im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
    os.makedirs(os.path.join(A, carpeta), exist_ok=True); im.save(os.path.join(A, carpeta, nombre + '.png')); return im

def transparente(nombre):   # las que Yesli mandó ya sin fondo
    im = Image.open(os.path.join(F, nombre + '.png')).convert('RGBA'); return im.crop(im.getbbox())

info = {}
# ---------- fuelles (última hoja: misma base apagado / soplando) ----------
col, al, bl = sin_magenta(os.path.join(F, 'fuelles.png'))
ap = recorta(col, al, (0, 150, 700, 887)); so = recorta(col, al, (700, 100, 1774, 887))
# el soplando trae el aire pintado a la derecha: se quita (el juego anima su propio aire) cortando a la anchura del apagado
# alineando por la izquierda y por abajo (misma base)
so = so.crop((0, 0, min(so.width, ap.width + 8), so.height))
guardar(ap, 'retos', 'fuelle_apagado', ancho=300); guardar(so, 'retos', 'fuelle_soplando', ancho=round(300 * so.width / ap.width))
info['fuelle'] = [ap.size, so.size]
# ---------- piezas ya transparentes ----------
guardar(transparente('engranaje_01_grande'), 'retos', 'engranaje_plataforma', ancho=400)
for i, n in enumerate(['engranaje_01_grande', 'engranaje_02_mediano', 'engranaje_03_mediano', 'engranaje_04_pequeno', 'engranaje_05_pequeno'], 1):
    im = transparente(n); guardar(im, 'acertijos', f'engranaje_{i}'); info[f'engranaje_{i}'] = im.size
guardar(transparente('tablero_engranajes'), 'acertijos', 'engranajes_tablero', ancho=600)
# ---------- compuerta, palanca, botón del columpio ----------
for n in ['compuerta_cerrada', 'compuerta_abierta']:
    c, a, b = sin_magenta(os.path.join(F, n + '.png')); guardar(recorta(c, a), 'retos', n, ancho=340)
for n in ['palanca_arriba', 'palanca_abajo']:
    c, a, b = sin_magenta(os.path.join(F, n + '.png')); guardar(recorta(c, a), 'retos', n, ancho=260)
c, a, b = sin_magenta(os.path.join(F, 'cuerda.png'))
guardar(recorta(c, a, (520, 0, 1020, 310)), 'retos', 'cuerda_boton', ancho=240)
# ---------- tijeras (5 filas × 4) ----------
col, al, bl = sin_magenta(os.path.join(F, 'tijeras.png'))
filas = [0, 212, 405, 592, 800, 1024]; cols = [0, 384, 768, 1152, 1536]
celdas = [[recorta(col, al, (cols[c], filas[r], cols[c + 1], filas[r + 1])) for c in range(4)] for r in range(5)]
ANIM = {'volar': [(0, 0), (0, 1), (0, 2), (0, 3)], 'aviso': [(1, 2), (1, 3)], 'cortar': [(2, 0), (2, 1), (2, 2), (2, 3)],
        'golpe': [(3, 0), (3, 1)], 'remendarse': [(4, 0), (4, 1), (4, 2), (4, 3)]}
W, H = 380, 220
for anim, lst in ANIM.items():
    for i, (r, c) in enumerate(lst, 1):
        im = celdas[r][c]
        # eje = el botón dorado: el centro de los píxeles amarillos grandes cerca del medio
        a = np.array(im).astype(int); y = (a[..., 0] > 200) & (a[..., 1] > 150) & (a[..., 2] < 90) & (a[..., 3] > 200)
        n, lab, st, cc = cv2.connectedComponentsWithStats(y.astype(np.uint8))
        k = 1 + int(np.argmax(st[1:, 4])) if n > 1 else 0
        bx, by = (cc[k] if k else (im.width / 2, im.height / 2))
        out = Image.new('RGBA', (W, H), (0, 0, 0, 0)); out.alpha_composite(im, (int(round(W / 2 - bx)), int(round(H / 2 - by))))
        out.save(os.path.join(A, 'criaturas', f'tijeras_{anim}{i}.png'))
# ---------- hoja de la torre: patrón, deslizante, caja de música, cuco ----------
col, al, bl = sin_magenta(os.path.join(F, 'hoja_torre.png'))
guardar(recorta(col, al, (0, 0, 396, 381)), 'acertijos', 'patron_bastidor', ancho=480)
d = recorta(col, al, (411, 0, 804, 381), limpiar=False)
lado = min(d.size); d = d.crop(((d.width - lado) // 2, (d.height - lado) // 2, (d.width + lado) // 2, (d.height + lado) // 2))
d.convert('RGB').resize((600, 600), Image.LANCZOS).save(os.path.join(A, 'acertijos', 'deslizante_dibujo.jpg'), quality=90)
guardar(recorta(col, al, (820, 0, 1169, 381)), 'acertijos', 'caja_musica', ancho=200)
guardar(recorta(col, al, (1185, 0, 1536, 381)), 'acertijos', 'reloj_cuco', ancho=200)
# ---------- fondo: cielo, torre (opaca), marco del frente ----------
src = os.path.join(F, 'fondo_capas.png'); bruto = Image.open(src).convert('RGB')
bruto.crop((4, 2, 578, 885)).resize((760, round(883 * 760 / 574)), Image.LANCZOS).save(os.path.join(A, 'backgrounds', 'torre_cielo.jpg'), quality=86)
bruto.crop((599, 2, 1173, 885)).resize((820, round(883 * 820 / 574)), Image.LANCZOS).save(os.path.join(A, 'backgrounds', 'torre_medio.jpg'), quality=86)
col, al, bl = sin_magenta(src)
fr = Image.fromarray(np.dstack([col[2:885, 1195:1768], al[2:885, 1195:1768] * 255]).astype(np.uint8), 'RGBA')
fr.resize((760, round(fr.height * 760 / fr.width)), Image.LANCZOS).save(os.path.join(A, 'backgrounds', 'torre_frente.png'))
print(json.dumps({k: [list(v) for v in vv] if isinstance(vv, list) else list(vv) for k, vv in info.items()}))
