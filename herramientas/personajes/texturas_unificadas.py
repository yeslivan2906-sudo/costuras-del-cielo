"""ANIMACIÓN UNIFICADA de Lumi y Nube para el juego (sin redibujar: sale de las celdas 400 × 400 de Costuras_Personajes_v2).
Todas las poses usan la MISMA escala (G = 92/360), el MISMO pie (fila 97) y el MISMO eje: la cabeza de cada cuadro se
centra en la columna 74, que es el centro del cuerpo de colisión. Así no hay saltos de tamaño ni de posición al cambiar
de pose. Salen, para cada capucha (clasica, estrella, aurora, hoja, noche), texturas 148 × 100:
  lumi_<capucha>_idle1..6 · walk1..8 · jump1..3 · sew1..4 · attack1..3
  y las claves de siempre idle / jump / sew / attack (= idle1, jump2, sew2, attack2) para lo que no anima.
Nube (zorro): nube_vuelo1..6 (80 × 72) desde «flotar». La textura «nube» (iconos, diálogos) no cambia.
Uso: python3 -I herramientas/personajes/texturas_unificadas.py <Costuras_Personajes_v2> <carpeta assets/personajes>
"""
import os, sys, json
import numpy as np
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2]
G, W, H, PIE, CX = 92 / 360, 148, 100, 97, 74
CAP = {'roja': 'clasica', 'dorada': 'estrella', 'violeta': 'aurora', 'verde': 'hoja', 'azul_noche': 'noche'}
ANIM = {'quieta': ('idle', 6), 'caminar': ('walk', 8), 'saltar': ('jump', 3), 'coser': ('sew', 4), 'aguja': ('attack', 3)}
LEGADO = {'idle': 1, 'jump': 2, 'sew': 2, 'attack': 2}

def cabeza_x(im):
    a = np.array(im)[..., 3] > 128; ys, _ = np.nonzero(a); top, h = ys.min(), ys.max() - ys.min()
    return np.nonzero(a[top:top + int(h * 0.35)])[1].mean()

def a_juego(celda, centro, dx):
    """celda → 148 × 100: desplaza dx (px de celda), escala G y pone (centro, 390) en (74, 97)."""
    c = Image.new('RGBA', celda.size, (0, 0, 0, 0)); c.alpha_composite(celda, (int(round(dx)), 0))
    w, h = round(c.width * G), round(c.height * G)
    c = c.resize((w, h), Image.LANCZOS)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    out.alpha_composite(c, (int(round(CX - centro * G)), int(round(PIE - 390 * G))))
    return out

ficha = {}
# los desplazamientos se miden en la capucha roja y se aplican igual a las cinco (misma silueta)
for anim, (clave, n) in ANIM.items():
    for i in range(1, n + 1):
        roja = Image.open(f'{SRC}/Lumi/capuchas/roja/{anim}/{anim}_{i:02d}.png').convert('RGBA')
        centro = roja.width / 2 if roja.width == 400 else 250
        dx = centro - cabeza_x(roja)
        ficha[f'{clave}{i}'] = {'origen': f'{anim}_{i:02d}', 'desplazamiento_celda_px': round(dx, 1)}
        for cap, skin in CAP.items():
            celda = Image.open(f'{SRC}/Lumi/capuchas/{cap}/{anim}/{anim}_{i:02d}.png').convert('RGBA')
            t = a_juego(celda, centro, dx)
            t.save(f'{OUT}/lumi_{skin}_{clave}{i}.png')
            if LEGADO.get(clave) == i: t.save(f'{OUT}/lumi_{skin}_{clave}.png')

# Nube: flotar 1..6, escala fija, centro de la celda (200, 200) en el centro del lienzo
ZG, ZW, ZH = 0.24, 80, 72
for i in range(1, 7):
    celda = Image.open(f'{SRC}/Zoro/animaciones/flotar/flotar_{i:02d}.png').convert('RGBA')
    c = celda.resize((round(400 * ZG), round(400 * ZG)), Image.LANCZOS)
    out = Image.new('RGBA', (ZW, ZH), (0, 0, 0, 0)); out.alpha_composite(c, (int(ZW / 2 - 200 * ZG), int(ZH / 2 - 200 * ZG)))
    out.save(f'{OUT}/nube_vuelo{i}.png')
json.dump({'escala': G, 'lienzo': [W, H], 'pie_fila': PIE, 'eje_columna': CX, 'cuadros': ficha}, open(f'{OUT}/../../herramientas/personajes/ficha_animacion_unificada.json', 'w'), indent=1)
print(sum(1 for f in os.listdir(OUT) if f.startswith('lumi_')), 'texturas de Lumi ·', 6, 'de Nube')
