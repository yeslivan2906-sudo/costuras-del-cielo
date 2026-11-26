"""MADERA E HILO de Yesli (3 hojas, fondo magenta) para todos los niveles, sin redibujar.
Uso: python3 -I herramientas/madera_hilo/preparar_madera_hilo.py
 · assets/platforms/tablon_A_120.png (y _danado): el banco de madera con estandarte (hoja 3) a 124 px de ancho; el borde de
   arriba es la superficie que pisa Lumi. La versión dañada es la misma pieza apagada y gastada (los originales quedan en
   respaldo/assets_madera/).
 · assets/retos/hilo_tira.png: la trenza dorada (hoja 2) hecha repetible (los extremos se funden entre sí).
 · assets/retos/anc_off / anc_on / anc_done.png (56 × 56): el botón de madera cosido (hoja 1) apagado, brillando y cosido.
"""
import os, sys
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
D = os.path.dirname(os.path.abspath(__file__)); F = os.path.join(D, 'fuentes'); A = os.path.join(D, '..', '..', 'assets')
sys.path.insert(0, os.path.join(D, '..', 'acertijos')); from magenta import quitar_magenta

def pieza(hoja, x, y, w, h, m=3):
    col, al = quitar_magenta(os.path.join(F, hoja + '.png'))
    im = Image.fromarray(np.dstack([col[y - m:y + h + m, x - m:x + w + m], al[y - m:y + h + m, x - m:x + w + m] * 255]).astype(np.uint8), 'RGBA')
    return im.crop(im.getbbox())

# ---------- tablón ----------
t = pieza('hoja_3', 537, 37, 255, 114)
t = t.resize((124, round(t.height * 124 / t.width)), Image.LANCZOS)
t.save(os.path.join(A, 'platforms', 'tablon_A_120.png'))
rgb, a = t.convert('RGB'), t.getchannel('A')
d = ImageEnhance.Color(rgb).enhance(0.35); d = ImageEnhance.Brightness(d).enhance(0.72)
d = Image.merge('RGBA', (*d.split(), a)); d.save(os.path.join(A, 'platforms', 'tablon_A_120_danado.png'))
# ---------- hilo (tira repetible) ----------
h = pieza('hoja_2', 686, 721, 337, 41)
h = h.crop((14, 0, h.width - 14, h.height))
arr = np.array(h).astype(np.float32); W = arr.shape[1]; F_ = 40
izq, der = arr[:, :F_].copy(), arr[:, W - F_:].copy()
mezcla = np.linspace(0, 1, F_)[None, :, None]
arr[:, W - F_:] = der * (1 - mezcla) + izq * mezcla        # el final se funde con el principio
arr = arr[:, :W - F_ // 2]
Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA').resize((round((W - F_ // 2) * 32 / arr.shape[0]), 32), Image.LANCZOS).save(os.path.join(A, 'retos', 'hilo_tira.png'))
# ---------- anclajes ----------
b = pieza('hoja_1', 1287, 615, 67, 68).resize((44, 44), Image.LANCZOS)
def lienzo(im, brillo=None):
    c = Image.new('RGBA', (56, 56), (0, 0, 0, 0))
    if brillo:
        g = Image.new('RGBA', (56, 56), (0, 0, 0, 0)); halo = Image.new('RGBA', (52, 52), brillo)
        m = Image.new('L', (52, 52), 0); from PIL import ImageDraw; ImageDraw.Draw(m).ellipse((0, 0, 51, 51), fill=150)
        g.paste(halo, (2, 2), m.filter(ImageFilter.GaussianBlur(4))); c.alpha_composite(g)
    c.alpha_composite(im, (6, 6)); return c
gris = ImageEnhance.Brightness(ImageEnhance.Color(b.convert('RGB')).enhance(0.45)).enhance(0.85)
lienzo(Image.merge('RGBA', (*gris.split(), b.getchannel('A')))).save(os.path.join(A, 'retos', 'anc_off.png'))
lienzo(b, (255, 214, 110, 255)).save(os.path.join(A, 'retos', 'anc_on.png'))
lienzo(ImageEnhance.Brightness(b).enhance(1.12)).save(os.path.join(A, 'retos', 'anc_done.png'))
print('listo')
