"""PERSONAJES: Lumi, Nube (zorro) y Tilo (panda) desde las láminas originales, sin redibujar. Salen:
 · maestros/: cada figura recortada a su resolución original con alfa real
 · juego/: las texturas con la MISMA clave y el MISMO tamaño que las dibujadas por código en el juego, para que se
   cambien sin tocar físicas ni posiciones: lumi_<capucha>_<pose> 84 × 100 (pie en la fila 96, donde termina el cuerpo
   de colisión), portrait_<capucha> 88 × 88 (redondo), nube 72 × 68, tilo 80 × 96 (pie abajo), tilo_face 88 × 88.
 · Capuchas: la lámina trae la roja (Clásica); las otras cuatro (Estrella, Aurora, Hoja, Noche) se sacan cambiando
   SOLO el tono de las zonas rojas de la ropa al color de cada capucha del juego (mismo brillo y sombra).
Uso: python3 -I herramientas/extraer_personajes.py
"""
import os, json, colorsys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT_M, OUT_J = os.path.join(R, 'maestros'), os.path.join(R, 'juego')
os.makedirs(OUT_M, exist_ok=True); os.makedirs(OUT_J, exist_ok=True)
inf = {}

# ---------- Lumi (lámina sin alfa: fondo de panel) ----------
L = np.array(Image.open(os.path.join(R, 'original/lamina_lumi.png')).convert('RGB')).astype(float)
PANEL = np.array([76, 33, 55.])
cand = np.sqrt(((L - PANEL) ** 2).sum(-1)) < 34
def recorte_lumi(box, pad_arriba=6):
    x0, y0, x1, y1 = box; x0 -= 6; y0 -= pad_arriba; x1 += 6; y1 += 6
    sub = L[y0:y1, x0:x1]; c = cand[y0:y1, x0:x1].copy()
    lab, n = ndimage.label(c)
    borde = np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]]); borde = borde[borde > 0]
    fondo = np.isin(lab, borde)
    fig = ~fondo
    lf, nf = ndimage.label(ndimage.binary_opening(fig, iterations=1))
    if nf:
        tam = ndimage.sum(fig, lf, range(1, nf + 1)); fig = lf == (1 + int(np.argmax(tam)))   # la figura (sin chispas sueltas ni polvo)
        fig = ndimage.binary_fill_holes(fig) | (fig)
    a = fig.astype(float) * 255
    # borde suave de medio píxel
    a = np.maximum(a, ndimage.binary_dilation(fig) * 0)
    ys, xs = np.nonzero(fig)
    im = np.dstack([sub, a]).astype(np.uint8)[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(im, 'RGBA')
LUMI = {'idle': (42, 699, 108, 799), 'walk1': (152, 537, 223, 631), 'walk2': (253, 537, 324, 632), 'walk3': (347, 537, 418, 626),
        'walk4': (444, 537, 513, 627), 'jump': (1192, 529, 1260, 615), 'sew': (708, 708, 781, 794), 'attack': (598, 535, 673, 629)}
ESC = 0.96
def a_lienzo(im, w, h, pie, escala):
    im = im.resize((max(1, round(im.width * escala)), max(1, round(im.height * escala))), Image.LANCZOS)
    a = np.array(im)[..., 3] > 128; cx = np.nonzero(a)[1].mean()
    c = Image.new('RGBA', (w, h), (0, 0, 0, 0)); c.alpha_composite(im, (int(round(w / 2 - cx)), int(pie - im.height)))
    return c
base = {}
for pose, box in LUMI.items():
    m = recorte_lumi(box, 0 if pose == 'jump' else 6); m.save(os.path.join(OUT_M, f'lumi_{pose}.png'))
    base[pose] = a_lienzo(m, 84, 100, 97, ESC)
    inf[f'lumi_{pose}'] = {'origen_en_la_lamina': box, 'maestro': list(m.size)}
# retrato: primera expresión del panel, recortada dentro del marco y redonda
P = Image.fromarray(L.astype(np.uint8)).crop((70, 866, 178, 974)).resize((88, 88), Image.LANCZOS).convert('RGBA')
mk = Image.new('L', (88 * 4, 88 * 4), 0)
from PIL import ImageDraw
ImageDraw.Draw(mk).ellipse([4, 4, 88 * 4 - 4, 88 * 4 - 4], fill=255); mk = mk.resize((88, 88), Image.LANCZOS); P.putalpha(mk)
P.save(os.path.join(OUT_M, 'lumi_retrato.png')); base['portrait'] = P

# capuchas: cambiar solo el tono de lo rojo/magenta saturado (capucha, capa, bufanda)
CAP = {'clasica': None, 'estrella': 0xe0a83a, 'aurora': 0x8e6bd6, 'hoja': 0x4f9a5a, 'noche': 0x34437a}
def recolor(im, col):
    if col is None: return im
    a = np.array(im).astype(float) / 255; rgb = a[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1); d = mx - mn
    hue = np.zeros_like(mx); m = d > 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hue = np.where(m & (mx == r), ((g - b) / np.maximum(d, 1e-6)) % 6, hue)
    hue = np.where(m & (mx == g), (b - r) / np.maximum(d, 1e-6) + 2, hue)
    hue = np.where(m & (mx == b), (r - g) / np.maximum(d, 1e-6) + 4, hue)
    hue = hue * 60
    sat = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    rojo = ((hue < 14) | (hue > 315)) & (sat > 0.42) & (mx > 0.18)
    tr, tg, tb = [((col >> s) & 255) / 255 for s in (16, 8, 0)]
    th, ts, tv = colorsys.rgb_to_hsv(tr, tg, tb)
    # nuevo color: tono y saturación de la capucha; brillo relativo del original (sombras y luces se conservan)
    v = mx / 0.72 * tv
    out = rgb.copy()
    hh = np.full_like(mx, th); ss = np.full_like(mx, ts)
    i = np.floor(hh * 6) % 6; f = hh * 6 - np.floor(hh * 6)
    p_, q_, t_ = v * (1 - ss), v * (1 - f * ss), v * (1 - (1 - f) * ss)
    sel = [(i == k) for k in range(6)]
    nr = np.select(sel, [v, q_, p_, p_, t_, v]); ng = np.select(sel, [t_, v, v, q_, p_, p_]); nb = np.select(sel, [p_, p_, t_, v, v, q_])
    nuevo = np.clip(np.dstack([nr, ng, nb]), 0, 1)
    out[rojo] = nuevo[rojo]
    return Image.fromarray(np.dstack([out, a[..., 3:]]).__mul__(255).round().astype(np.uint8), 'RGBA')
for cap, col in CAP.items():
    for pose, im in base.items():
        k = f'portrait_{cap}' if pose == 'portrait' else f'lumi_{cap}_{pose}'
        recolor(im, col).save(os.path.join(OUT_J, k + '.png'))

# ---------- Nube y Tilo (láminas con alfa real) ----------
def recorte_alfa(lamina, box):
    A = np.array(Image.open(os.path.join(R, f'original/{lamina}.png')).convert('RGBA'))
    core = A[..., 3] >= 200
    lab, n = ndimage.label(ndimage.binary_closing(core, iterations=2))
    x0, y0, x1, y1 = box; sub = lab[y0:y1, x0:x1]; ids, cnt = np.unique(sub[sub > 0], return_counts=True)
    fig = (lab == ids[cnt.argmax()]) & core
    fig = ndimage.binary_fill_holes(fig)
    ys, xs = np.nonzero(fig)
    rgba = A.copy(); rgba[..., 3] = np.where(fig, 255, 0)
    # anillo de 1 px a media opacidad (borde sin dientes)
    an = ndimage.binary_dilation(fig) & ~fig; rgba[..., 3] = np.where(an, 110, rgba[..., 3])
    return Image.fromarray(rgba[ys.min() - 1:ys.max() + 2, xs.min() - 1:xs.max() + 2], 'RGBA')
def encajar(im, w, h, abajo=False):
    f = min(w / im.width, h / im.height); im = im.resize((max(1, round(im.width * f)), max(1, round(im.height * f))), Image.LANCZOS)
    c = Image.new('RGBA', (w, h), (0, 0, 0, 0)); c.alpha_composite(im, ((w - im.width) // 2, h - im.height if abajo else (h - im.height) // 2)); return c
nube = recorte_alfa('lamina_nube_zorro', (29, 264, 261, 447)); nube.save(os.path.join(OUT_M, 'nube_volando.png'))
encajar(nube, 72, 68).save(os.path.join(OUT_J, 'nube.png'))
tilo = recorte_alfa('lamina_tilo_panda', (41, 12, 251, 252)); tilo.save(os.path.join(OUT_M, 'tilo_frente.png'))
encajar(tilo, 80, 96, abajo=True).save(os.path.join(OUT_J, 'tilo.png'))
cara = recorte_alfa('lamina_tilo_panda', (50, 678, 179, 774)); cara.save(os.path.join(OUT_M, 'tilo_cara.png'))
encajar(cara, 84, 84).save(os.path.join(OUT_J, 'tilo_face.png'))
inf.update({'nube': {'origen': [29, 264, 261, 447], 'juego': [72, 68]}, 'tilo': {'origen': [41, 12, 251, 252], 'juego': [80, 96]}, 'tilo_face': {'origen': [50, 678, 179, 774], 'juego': [88, 88]}})
# la cara de Tilo debe ocupar 88 × 88 como la anterior
c = Image.new('RGBA', (88, 88), (0, 0, 0, 0)); c.alpha_composite(Image.open(os.path.join(OUT_J, 'tilo_face.png')), (2, 2)); c.save(os.path.join(OUT_J, 'tilo_face.png'))
json.dump(inf, open(os.path.join(R, 'ficha_personajes.json'), 'w'), indent=1)
print(len(os.listdir(OUT_J)), 'texturas de juego')
