"""Variante de componer_fondos_provisionales.py para la PRUEBA de las 9 cascadas: misma semilla y mismo orden;
la capa 3 sale SIN las cascadas 6, 7, 8 y 9 (van como objetos animados) y se guarda aparte la capa de nubes de la
capa 3, para recortar el trozo que tapa el pie de las cascadas 6-8."""
"""Compone las 4 capas PROVISIONALES del fondo del Lienzo Inicial a partir de los recortes.
Cada capa mide 1440x1280 px (2 pantallas de ancho) y se repite hacia los lados sin cortes.
Cuando llegue el arte final, basta con reemplazar estos archivos con el mismo nombre."""
import random
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

A = '/home/claude/costuras_prueba_puente/assets/'
OUT = '/tmp/claude-0/-home-claude/263f95dd-e91a-53b9-8ef7-35580ffd67d3/scratchpad/casc_todas/'
WD, HT = 1440, 1280
rnd = random.Random(11)

def load(p): return Image.open(A + p).convert('RGBA')
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
sky.convert('RGB').save(OUT + 'capa_1_cielo.jpg', quality=86, optimize=True, progressive=True)

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
L2.save(OUT + 'capa_2_islas_lejanas.png', optimize=True)

# ---------- Capa 3: montañas, ruinas y cascadas ----------
L3 = Image.new('RGBA', (WD, HT), (0, 0, 0, 0))
for base, col, amp, ph in [(760, (132, 112, 196), 150, 0.0), (860, (108, 90, 170), 120, 2.0)]:
    pts = [(0, HT)]; x = 0
    while x <= WD:
        pts.append((x, base - amp * (0.5 + 0.5 * np.sin(x / 140 + ph * 3 + amp)) - rnd.uniform(0, 40))); x += 48
    pts[-1] = (WD, pts[1][1]); pts.append((WD, HT))
    mask = Image.new('L', (WD, HT), 0); ImageDraw.Draw(mask).polygon(pts, fill=255)
    grad = np.zeros((HT, WD, 4), np.uint8)
    for y in range(HT):
        k = max(0.0, min(1.0, (y - (base - amp)) / 520))
        grad[y, :, :3] = np.array(col) * (1.08 - 0.28 * k); grad[y, :, 3] = 255
    gim = Image.fromarray(grad.clip(0, 255).astype(np.uint8)); gim.putalpha(mask)
    L3.alpha_composite(gim)
    rim = Image.new('L', (WD, HT), 0); ImageDraw.Draw(rim).line(pts[1:-2], fill=150, width=3)
    lit = Image.new('RGBA', (WD, HT), (196, 180, 240, 255)); lit.putalpha(rim.filter(ImageFilter.GaussianBlur(1)))
    L3.alpha_composite(lit)
for x, p, f in [(90, 'structures/arco_ruinas_musgo.png', 1.1), (520, 'structures/puerta_arco_piedra.png', 1.0), (900, 'structures/ruinas_escombros.png', 1.0), (1220, 'structures/arco_ruinas.png', 1.2)]:
    r = tint(scale(load(p), f), (122, 104, 186), 0.45)
    paste_wrap(L3, r, x, 690 - r.height + rnd.uniform(0, 60))
for x, h in [(330, 520), (760, 600), (1120, 480)]:
    _wf = waterfall(22, h, (175, 215, 255), 210)   # se genera (mismo azar) pero no se pega
casc = tint(scale(load('waterfalls/cascada_rocas.png'), 1.0), (130, 115, 195), 0.3)
pass  # cascada 9: va aparte
NUBES3 = Image.new('RGBA', (WD, HT), (0, 0, 0, 0)); _st = rnd.getstate()
soft_clouds(NUBES3, 10, 1020, 1240, [(246, 206, 228), (255, 222, 236)], 70, 140, 16, 235); NUBES3.save(OUT + 'capa_3_solo_nubes.png')
rnd.setstate(_st)
soft_clouds(L3, 10, 1020, 1240, [(246, 206, 228), (255, 222, 236)], 70, 140, 16, 235)
L3.save(OUT + 'capa_3_ruinas_cascadas.png', optimize=True)

# ---------- Capa 4: árboles y siluetas cercanas ----------
L4 = Image.new('RGBA', (WD, HT), (0, 0, 0, 0))
for x, p, f in [(-30, 'vegetation/arbol_flores_rosadas.png', 2.2), (420, 'vegetation/arbol_glicina.png', 2.0), (820, 'vegetation/arbol_flores_rosadas.png', 1.8), (1150, 'vegetation/arbol_dorado.png', 2.0)]:
    t = tint(scale(load(p), f), (70, 50, 110), 0.35, 0.12)
    paste_wrap(L4, t, x, HT - 150 - t.height)
bushes = ['vegetation/arbusto_a.png', 'vegetation/arbusto_b.png', 'vegetation/arbusto_largo.png', 'vegetation/arbusto_rosado.png', 'vegetation/flores_rosadas_b.png']
x = -40
while x < WD:
    b = tint(scale(load(rnd.choice(bushes)), 1.6), (60, 44, 96), 0.45, 0.2)
    paste_wrap(L4, b, x, HT - 175 + rnd.uniform(-10, 10)); x += b.width * 0.75
base = Image.new('RGBA', (WD, 120), (52, 38, 84, 255)); L4.alpha_composite(base, (0, HT - 120))
L4.save(OUT + 'capa_4_arboles_cercanos.png', optimize=True)
print('ok')
