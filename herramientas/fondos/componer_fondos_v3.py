"""FONDOS v3 (coherencia y niebla): sobre la v2, la capa 2 pasa a ser TIERRAS FLOTANTES de cartón (las islas pequeñas
aprobadas, con árboles de la Aldea encima y alguna cascada fina) en lugar de islotes con ruinas; la capa 3 tiene una
cordillera más lejana, niebla entre las montañas y en los valles, y bosquecillos en lugar de ruinas destruidas.
El azar común y la geometría de las montañas son los de siempre (lo nuevo usa su propio generador), así que las nueve
cascadas, sus recortes de nubes y el molino pequeño siguen encajando.
Uso: python3 -I herramientas/fondos/componer_fondos_v3.py

FONDOS v2 (mejora visual): misma semilla, mismo orden de azar y misma geometría que la v1 (montañas, nubes,
islas y posiciones), así las cascadas animadas, sus recortes de nubes y el molino pequeño siguen encajando igual.
Cambios: capa 4 con los árboles y arbustos aprobados de la Aldea G2 en alta resolución (antes: recortes diminutos
ampliados a píxel gordo) y base en degradado en lugar de una franja plana; capa 3 con las ruinas de la lámina
aprobada en alta resolución y el filo de las montañas suave (antes: una línea clara dura); todas las reducciones con
Lanczos (sin píxel gordo). Capas 1 y 2: iguales.
Uso: python3 -I herramientas/fondos/componer_fondos_v2.py   (escribe en assets/backgrounds/)"""
"""Compone las 4 capas PROVISIONALES del fondo del Lienzo Inicial a partir de los recortes.
Cada capa mide 1440x1280 px (2 pantallas de ancho) y se repite hacia los lados sin cortes.
Cuando llegue el arte final, basta con reemplazar estos archivos con el mismo nombre."""
import random
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

import os
J = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
A = os.path.join(J, 'assets') + '/'
OUT = os.path.join(J, 'assets/backgrounds') + '/'
V1 = os.path.join(J, 'respaldo/fondos_v1') + '/'
rnd2 = random.Random(23)   # azar SOLO para lo nuevo de la v3 (no altera la secuencia común)
M = os.path.join(J, 'maestros') + '/'
WD, HT = 1440, 1280
rnd = random.Random(11)

def load(p): return Image.open(A + p).convert('RGBA')
def loadm(p): return Image.open(M + p).convert('RGBA')
def alto(im, h): f = h / im.height; return im.resize((max(1, round(im.width * f)), max(1, round(h))), Image.LANCZOS)
def tint(im, col, t, dark=0.0):
    a = np.array(im).astype(float)
    a[..., :3] = a[..., :3] * (1 - t) + np.array(col) * t
    a[..., :3] *= (1 - dark)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))
def scale(im, f):
    return im.resize((max(1, int(im.width * f)), max(1, int(im.height * f))), Image.NEAREST if f >= 1 else Image.LANCZOS)
def paste_wrap(canvas, im, x, y):
    for dx in (-WD, 0, WD):
        canvas.alpha_composite(im, (int(x + dx), int(y))) if -im.width < x + dx < WD else None
def soft_clouds(canvas, n, ymin, ymax, cols, rmin, rmax, blur, alpha):
    # una pasada por color: máscara desenfocada + color sólido (sin bordes oscuros)
    blobs = {c: [] for c in cols}
    for _ in range(n):
        cx, cy = rnd.uniform(0, WD), rnd.uniform(ymin, ymax); col = rnd.choice(cols)
        for _ in range(rnd.randint(4, 7)):
            r = rnd.uniform(rmin, rmax); blobs[col].append((cx + rnd.uniform(-r * 1.6, r * 1.6), cy + rnd.uniform(-r * 0.35, r * 0.25), r))
    for col, bl in blobs.items():
        mask = Image.new('L', (WD, HT), 0); d = ImageDraw.Draw(mask)
        for cx, cy, r in bl:
            for dx in (-WD, 0, WD): d.ellipse([cx + dx - r, cy - r * 0.7, cx + dx + r, cy + r * 0.7], fill=alpha)
        mask = mask.filter(ImageFilter.GaussianBlur(blur))
        solid = Image.new('RGBA', (WD, HT), col + (255,)); solid.putalpha(mask)
        canvas.alpha_composite(solid)
def waterfall(w, h, col=(170, 215, 255), alpha=200):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for x in range(w):
        a = int(alpha * (1 - abs(x - w / 2) / (w / 2)) ** 0.4)
        d.line([(x, 0), (x, h)], fill=col + (a,))
    for _ in range(w // 3):
        x = rnd.uniform(0, w); d.line([(x, rnd.uniform(0, h * 0.3)), (x, rnd.uniform(h * 0.4, h))], fill=(235, 248, 255, 150))
    fade = np.linspace(1, 0, h) ** 1.5
    arr = np.array(im).astype(float); arr[..., 3] *= fade[:, None]; return Image.fromarray(arr.astype(np.uint8))

# ---------- Capa 1: cielo y nubes (sin transparencia) ----------
sky = Image.new('RGBA', (WD, HT))
top, mid, bot = np.array([38, 46, 112]), np.array([118, 104, 196]), np.array([242, 192, 216])
g = np.zeros((HT, WD, 4), np.uint8)
for y in range(HT):
    t = y / HT
    c = top + (mid - top) * (t / 0.55) if t < 0.55 else mid + (bot - mid) * ((t - 0.55) / 0.45)
    g[y, :, :3] = c; g[y, :, 3] = 255
sky = Image.fromarray(g)
d = ImageDraw.Draw(sky)
for _ in range(140):
    x, y, r = rnd.uniform(0, WD), rnd.uniform(0, HT * 0.45), rnd.choice([1, 1, 1.5, 2])
    d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, rnd.randint(110, 230)))
moon = Image.new('RGBA', (WD, HT), (0, 0, 0, 0)); md = ImageDraw.Draw(moon)
md.ellipse([1040, 120, 1200, 280], fill=(255, 240, 215, 255)); md.ellipse([1080, 100, 1240, 260], fill=(0, 0, 0, 0))
glow = Image.new('RGBA', (WD, HT), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse([980, 60, 1260, 340], fill=(255, 230, 240, 60))
sky.alpha_composite(glow.filter(ImageFilter.GaussianBlur(30))); sky.alpha_composite(moon)
soft_clouds(sky, 9, 380, 620, [(196, 176, 236), (214, 190, 240)], 40, 90, 14, 150)
soft_clouds(sky, 11, 700, 1150, [(246, 206, 228), (236, 196, 236), (255, 222, 236)], 60, 130, 18, 200)
pass  # capa 1: sin cambios (se conserva el archivo)

# ---------- Capa 2: islas flotantes lejanas ----------
L2 = Image.new('RGBA', (WD, HT), (0, 0, 0, 0))
plats = ['platforms/plataforma_flotante_mediana.png', 'platforms/plataforma_flotante_corta.png', 'platforms/plataforma_flotante_flores_grande.png',
         'platforms/plataforma_flotante_pequena.png', 'platforms/plataforma_flotante_mediana.png', 'platforms/plataforma_flotante_corta.png']
ruins = ['structures/arco_ruinas.png', 'structures/arco_ruinas_musgo.png', 'structures/ruinas_escombros.png']
spots = [(60, 330, 0.9), (330, 470, 0.65), (560, 300, 1.0), (840, 520, 0.7), (1050, 360, 0.95), (1270, 560, 0.55)]
for (x, y, f), p in zip(spots, plats):
    isl = tint(scale(load(p), f), (150, 140, 214), 0.68)
    if f >= 0.9:
        r = tint(scale(load(rnd.choice(ruins)), f * 0.55), (150, 140, 214), 0.6)
        paste_wrap(L2, r, x + isl.width * 0.45, y - r.height + 6)
    if f >= 0.65:
        wf = waterfall(max(6, int(10 * f)), int(220 * f), (190, 205, 250), 150)
        paste_wrap(L2, wf, x + isl.width * 0.62, y + isl.height * 0.55)
    paste_wrap(L2, isl, x, y)
for _ in range(10):
    tiny = tint(scale(load(rnd.choice(plats)), rnd.uniform(0.25, 0.4)), (170, 160, 225), 0.7)
    paste_wrap(L2, tiny, rnd.uniform(0, WD), rnd.uniform(180, 760))
# v3: lo anterior se genera solo para consumir el mismo azar; la capa 2 nueva son tierras flotantes de cartón
def cascadita(w, h, col=(196, 208, 248), alpha=120):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for xx in range(w):
        d.line([(xx, 0), (xx, h)], fill=col + (int(alpha * (1 - abs(xx - w / 2) / (w / 2)) ** 0.4),))
    a = np.array(im).astype(float); a[..., 3] *= (np.linspace(1, 0, h) ** 1.6)[:, None]; return Image.fromarray(a.astype(np.uint8))
ISLAS = ['fondo/islas_carton/isla_pequena_136_normal.png', 'fondo/islas_carton/isla_pequena_144_normal.png',
         'fondo/islas_carton/isla_pequena_148_normal.png', 'fondo/islas_carton/isla_pequena_188_normal.png']
ARBOLES = ['village/pino_g2.png', 'village/arbol_azul_g2.png', 'village/arbol_rosa_g2.png', 'village/arbol_glicina_g2.png', 'village/arbol_dorado_g2.png']
LEJOS = (150, 140, 214)
def isla_carton():
    """isla de cartón aprobada (diagrama 64 + 128 + 64: borde izq + centro + borde der, estado normal)"""
    P = A + 'platforms/'
    piezas = [Image.open(P + f'isla_mediana_{k}_normal.png').convert('RGBA') for k in ('borde_izq', 'centro', 'borde_der')]
    im = Image.new('RGBA', (sum(p.width for p in piezas), piezas[0].height), (0, 0, 0, 0)); x0 = 0
    for p in piezas: im.alpha_composite(p, (x0, 0)); x0 += p.width
    if rnd2.random() < 0.5: im = im.transpose(Image.FLIP_LEFT_RIGHT)   # variedad: a veces en espejo
    return im
def tierra(ancho, t_tinte, arboles, cascada):
    isl = isla_carton(); f = ancho / isl.width
    isl = isl.resize((round(isl.width * f), round(isl.height * f)), Image.LANCZOS)
    # de lejos, la isla se afina hacia abajo (silueta de tierra flotante, como en el diagrama aprobado): los lados se
    # recortan cada vez más por debajo de la línea del pasto; el borde del recorte va difuminado
    w_, h_ = isl.size; g_ = int(34 * f); al = np.array(isl.getchannel('A')).astype(float)
    ys = np.arange(h_)[:, None]; xs = np.arange(w_)[None, :]
    ins = np.clip((ys - g_) / max(1, h_ * 0.62 - g_), 0, 1) ** 1.35 * 0.40 * w_
    m = ((xs >= ins) & (xs <= w_ - 1 - ins)).astype(np.uint8) * 255
    m = np.array(Image.fromarray(m).filter(ImageFilter.GaussianBlur(max(1, 2 * f))))
    isl.putalpha(Image.fromarray((al * m / 255).astype(np.uint8)))
    out = Image.new('RGBA', (isl.width + 40, isl.height + 140 + (260 if cascada else 0)), (0, 0, 0, 0)); oy = 140
    suelo = oy + round(24 * f)
    xs = sorted(rnd2.uniform(0.18, 0.78) for _ in range(arboles))
    for u in xs:                                              # árboles sobre el pasto
        a = alto(loadm(rnd2.choice(ARBOLES)), rnd2.uniform(0.34, 0.44) * isl.width)
        out.alpha_composite(a, (int(20 + u * isl.width - a.width / 2), int(suelo - a.height + 5 * f)))
    if cascada:
        c = cascadita(max(4, int(10 * f)), int(260 * f)); out.alpha_composite(c, (int(20 + isl.width * rnd2.uniform(0.4, 0.6)), int(oy + isl.height * 0.45)))
    out.alpha_composite(isl, (20, oy))
    out = tint(out, LEJOS, t_tinte)
    a = np.array(out).astype(float); m = 0.18; a[..., :3] = a[..., :3] * (1 - m) + np.array((214, 198, 242)) * m
    return Image.fromarray(a.astype(np.uint8)), 20, oy
L2 = Image.new('RGBA', (WD, HT), (0, 0, 0, 0))
for x, y, f in spots:
    im, dx, dy = tierra(230 * f, 0.42, 2 if f >= 0.9 else (1 if f >= 0.65 else 0), f >= 0.65)
    paste_wrap(L2, im, x - dx, y - dy)
for _ in range(10):
    im, dx, dy = tierra(rnd2.uniform(60, 90), 0.6, 1 if rnd2.random() < 0.4 else 0, False)
    paste_wrap(L2, im, rnd2.uniform(0, WD) - dx, rnd2.uniform(180, 760) - dy)
L2.save(OUT + 'capa_2_islas_lejanas.png', optimize=True)

# ---------- Capa 3: montañas, ruinas y cascadas ----------
L3 = Image.new('RGBA', (WD, HT), (0, 0, 0, 0))
NIEBLA = (214, 198, 242)
def niebla(img, y0, y1, fuerza):
    """niebla que sube desde los valles: transparente en y0, «fuerza» en y1 y más abajo; solo donde ya hay montaña"""
    a = np.array(img).astype(float); al = a[..., 3] / 255
    k = np.clip((np.arange(HT) - y0) / max(1, y1 - y0), 0, 1) ** 1.3 * fuerza
    m = (k[:, None] * al)[..., None]
    a[..., :3] = a[..., :3] * (1 - m) + np.array(NIEBLA) * m
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))
def jirones(img, n, ymin, ymax, alpha):
    """bancos de niebla sueltos (elipses muy difuminadas) delante de las montañas"""
    m = Image.new('L', (WD, HT), 0); d = ImageDraw.Draw(m)
    for _ in range(n):
        cx, cy, r = rnd2.uniform(0, WD), rnd2.uniform(ymin, ymax), rnd2.uniform(90, 200)
        for dx in (-WD, 0, WD): d.ellipse([cx + dx - r, cy - r * 0.18, cx + dx + r, cy + r * 0.18], fill=alpha)
    s_ = Image.new('RGBA', (WD, HT), NIEBLA + (255,)); s_.putalpha(m.filter(ImageFilter.GaussianBlur(22))); img.alpha_composite(s_)
# cordillera más lejana (nueva, muy envuelta en niebla), detrás de las dos de siempre
pts = [(0, HT)]; x = 0
while x <= WD:
    pts.append((x, 640 - 110 * (0.5 + 0.5 * np.sin(x / 95 + 1.3)) - 60 * (0.5 + 0.5 * np.sin(x / 37 + 0.4)) - rnd2.uniform(0, 25))); x += 36
pts[-1] = (WD, pts[1][1]); pts.append((WD, HT))
mk = Image.new('L', (WD, HT), 0); ImageDraw.Draw(mk).polygon(pts, fill=255)
lej = Image.new('RGBA', (WD, HT), (158, 140, 214, 255)); lej.putalpha(mk.filter(ImageFilter.GaussianBlur(1.5)))
L3.alpha_composite(niebla(lej, 520, 700, 0.75))
jirones(L3, 9, 600, 700, 120)
CRESTAS = []   # silueta de cada cordillera, para plantar los árboles en el suelo
for base, col, amp, ph in [(760, (132, 112, 196), 150, 0.0), (860, (108, 90, 170), 120, 2.0)]:
    pts = [(0, HT)]; x = 0
    while x <= WD:
        pts.append((x, base - amp * (0.5 + 0.5 * np.sin(x / 140 + ph * 3 + amp)) - rnd.uniform(0, 40))); x += 48
    pts[-1] = (WD, pts[1][1]); pts.append((WD, HT)); CRESTAS.append(pts[1:-1])
    mask = Image.new('L', (WD, HT), 0); ImageDraw.Draw(mask).polygon(pts, fill=255)
    grad = np.zeros((HT, WD, 4), np.uint8)
    for y in range(HT):
        k = max(0.0, min(1.0, (y - (base - amp)) / 520))
        grad[y, :, :3] = np.array(col) * (1.08 - 0.28 * k); grad[y, :, 3] = 255
    gim = Image.fromarray(grad.clip(0, 255).astype(np.uint8)); gim.putalpha(mask)
    L3.alpha_composite(niebla(gim, base - amp * 0.35, base + 160, 0.55 if base < 800 else 0.42))
    # filo iluminado SUAVE (v1: línea clara de 3 px casi sin difuminar, se veía como un trazo)
    rim = Image.new('L', (WD, HT), 0); ImageDraw.Draw(rim).line(pts[1:-2], fill=70, width=4)
    lit = Image.new('RGBA', (WD, HT), (190, 176, 236, 255)); lit.putalpha(rim.filter(ImageFilter.GaussianBlur(4)))
    L3.alpha_composite(lit)
    jirones(L3, 7, base - 30, base + 70, 95)
# v3: bosquecillos (árboles de la Aldea, lejanos y con niebla) en lugar de ruinas destruidas; mismas posiciones y el
# mismo número de tiradas del azar común que las ruinas de la v1/v2
def suelo_en(xp):
    """altura del suelo visible en la columna xp: la cresta más alta de las dos cordilleras (interpolada)"""
    xp %= WD; ys = []
    for c in CRESTAS:
        xs_ = [q[0] for q in c]; ys_ = [q[1] for q in c]; ys.append(float(np.interp(xp, xs_, ys_)))
    return min(ys)
for x, grupo in [(90, ['village/arbol_glicina_g2.png', 'village/pino_g2.png']), (520, ['village/arbol_rosa_g2.png', 'village/arbol_azul_g2.png', 'village/pino_g2.png']),
                 (900, ['village/arbol_dorado_g2.png', 'village/pino_g2.png']), (1220, ['village/pino_g2.png', 'village/arbol_azul_g2.png'])]:
    _ = rnd.uniform(0, 60)                     # misma tirada que la v1 (mantiene la secuencia del azar común)
    # CORRECCIÓN: cada árbol se planta en el suelo de la montaña en SU columna (antes iban a una altura fija y algunos
    # quedaban flotando por encima de la ladera); el pie entra unos píxeles en la montaña
    bx = x
    for p in grupo:
        a = alto(loadm(p), rnd2.uniform(95, 135)); a = tint(a, (122, 104, 186), 0.5)
        ar = np.array(a).astype(float); ar[..., :3] = ar[..., :3] * 0.75 + np.array(NIEBLA) * 0.25; a = Image.fromarray(ar.astype(np.uint8))
        # el pie más bajo de los dos lados del árbol (así ningún lado queda en el aire)
        yb = max(suelo_en(bx + a.width * 0.3), suelo_en(bx + a.width * 0.5), suelo_en(bx + a.width * 0.7)) + 10
        paste_wrap(L3, a, bx, yb - a.height)
        bx += a.width * 0.62
for x, h in [(330, 520), (760, 600), (1120, 480)]:
    _wf = waterfall(22, h, (175, 215, 255), 210)   # se genera (mismo azar) pero no se pega
casc = tint(scale(load('waterfalls/cascada_rocas.png'), 1.0), (130, 115, 195), 0.3)
pass  # cascada 9: va aparte
NUBES3 = Image.new('RGBA', (WD, HT), (0, 0, 0, 0)); _st = rnd.getstate()
soft_clouds(NUBES3, 10, 1020, 1240, [(246, 206, 228), (255, 222, 236)], 70, 140, 16, 235); 
rnd.setstate(_st)
soft_clouds(L3, 10, 1020, 1240, [(246, 206, 228), (255, 222, 236)], 70, 140, 16, 235)
L3.save(OUT + 'capa_3_ruinas_cascadas.png', optimize=True)


# ---------- Capa 4: árboles y arbustos cercanos (v2: piezas aprobadas de la Aldea G2 en alta resolución) ----------
L4 = Image.new('RGBA', (WD, HT), (0, 0, 0, 0))
NOCHE = (64, 46, 104)                      # tinte de primer plano nocturno (como la v1: 35 % hacia violeta + 12 % más oscuro)
SUELO = HT - 140                           # línea donde se apoyan (v1: troncos en HT − 150)
ARB = [(-40, 'village/arbol_rosa_g2.png', 236), (410, 'village/arbol_glicina_g2.png', 220), (800, 'village/arbol_azul_g2.png', 196),
       (1110, 'village/arbol_dorado_g2.png', 200), (1290, 'village/pino_g2.png', 196)]
for x, p, h in ARB:
    im = loadm(p); pie = 7                  # los árboles traen 7 px de margen + hierba bajo el tronco
    t_ = tint(alto(im, h), NOCHE, 0.33, 0.14)
    paste_wrap(L4, t_, x, SUELO - t_.height + round(pie * h / im.height) + 6)
bushes = ['village/arbusto_hortensias_g2.png', 'village/arbusto_verde_g2.png', 'village/helecho_g2.png', 'village/planta_morada_g2.png', 'village/flores_rosas_g2.png']
x = -40
while x < WD:
    b = tint(alto(loadm(rnd.choice(bushes)), rnd.uniform(58, 74)), (56, 40, 92), 0.42, 0.22)
    paste_wrap(L4, b, x, SUELO - b.height + 38 + rnd.uniform(-8, 8)); x += b.width * 0.72
# base: degradado hasta el color de relleno del juego (0x342654) en lugar de una franja plana con borde duro
base = np.zeros((HT, WD, 4), np.uint8); base[..., :3] = (52, 38, 84)
y0, y1 = SUELO + 10, SUELO + 70
for y in range(y0, HT): base[y, :, 3] = int(255 * min(1, (y - y0) / (y1 - y0)) ** 1.4)
L4.alpha_composite(Image.fromarray(base))
L4.save(OUT + 'capa_4_arboles_cercanos.png', optimize=True)
print('ok')
