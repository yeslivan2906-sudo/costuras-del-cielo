"""Lumi: la lámina no trae transparencia (fondo de paneles morado oscuro con textura). Fondo = píxeles parecidos al
color del panel CONECTADOS con el exterior de cada figura; el contorno oscuro del dibujo corta el relleno, así que las
botas y sombras de dentro (aunque se parezcan al panel) quedan como figura. Uso: python3 -I herramientas/segmentar_lumi.py"""
import numpy as np, json, os
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
I = np.array(Image.open(os.path.join(R, 'original/lamina_lumi.png')).convert('RGB')).astype(float)
H, W = I.shape[:2]
# color del panel: mediana de una zona sin figuras
panel = np.median(I[620:640, 22:40].reshape(-1, 3), 0)
# fondo local (la textura del panel cambia un poco): mediana grande sobre el panel
d = np.sqrt(((I - panel) ** 2).sum(-1))
cand = d < 34
lab, n = ndimage.label(cand)
np.save('/tmp/claude-0/-home-claude/263f95dd-e91a-53b9-8ef7-35580ffd67d3/scratchpad/lumi_cand.npy', cand)
# zonas de paneles (y): animaciones 530-650, 690-810; retratos aparte
fg = ~cand
fg[:480] = False
lf, nf = ndimage.label(ndimage.binary_opening(fg, iterations=1))
sl = ndimage.find_objects(lf); sz = ndimage.sum(fg, lf, range(1, nf + 1))
out = []
for i, s in enumerate(sl):
    h_, w_ = s[0].stop - s[0].start, s[1].stop - s[1].start
    if sz[i] > 1500 and 60 < h_ < 140 and 30 < w_ < 130: out.append((i + 1, s[1].start, s[0].start, s[1].stop, s[0].stop, int(sz[i])))
im = Image.fromarray(I.astype(np.uint8)); dr = ImageDraw.Draw(im); F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
for k, x0, y0, x1, y1, z in out: dr.rectangle([x0, y0, x1, y1], outline=(0, 255, 255)); dr.text((x0, y0 - 14), str(k), fill=(255, 255, 0), font=F)
im.save(os.path.join(R, 'revision/indice_lumi.png'))
print(panel, len(out)); print(out)
