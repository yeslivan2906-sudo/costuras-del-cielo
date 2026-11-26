"""Mapa del Capítulo I (fondo de Yesli): saca del propio fondo
 · las 3 cascadas → tiras de 12 cuadros con el agua bajando (solo los píxeles de agua, bordes suaves);
 · las nubes → recortes con transparencia para mecerlas despacio encima de su sitio.
Uso: python3 -I herramientas/mapa_capitulo/preparar_mapa.py"""
import os, json
import numpy as np
from PIL import Image, ImageFilter
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
im = np.array(Image.open(os.path.join(R, 'assets/menus/mapa_capitulo1.jpg')).convert('RGB')).astype(float)
out = {}
N = 12
for i, (x0, y0, x1, y1) in enumerate([(640, 262, 712, 420), (212, 596, 296, 716), (262, 1108, 352, 1280)], 1):
    S = im[y0:y1, x0:x1]; h = S.shape[0]
    r, g, b = S[..., 0], S[..., 1], S[..., 2]
    m = ((g > r + 18) & (b > 160)).astype(np.uint8) * 255
    M = np.array(Image.fromarray(m).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255
    w = 1 - np.abs(np.linspace(-1, 1, h))[:, None, None]          # tira sin costura: mezcla con la mitad desplazada
    T = S * w + np.roll(S, h // 2, axis=0) * (1 - w)
    tira = np.zeros((h, (x1 - x0) * N, 4), np.uint8)
    for k in range(N):
        F = np.roll(T, int(round(k * h / N)), axis=0)
        tira[:, k * (x1 - x0):(k + 1) * (x1 - x0), :3] = F.clip(0, 255)
        tira[:, k * (x1 - x0):(k + 1) * (x1 - x0), 3] = (M * 255).clip(0, 255)
    Image.fromarray(tira).save(os.path.join(R, f'assets/menus/mapa_cap1_agua{i}.png'))
    out[f'agua{i}'] = [x0, y0, x1 - x0, h]
for i, (x0, y0, x1, y1) in enumerate([(0, 1150, 250, 1280), (430, 990, 570, 1110), (0, 515, 115, 650),
                                      (630, 690, 720, 800), (325, 185, 425, 235)], 1):
    S = im[y0:y1, x0:x1]; r, g, b = S[..., 0], S[..., 1], S[..., 2]
    mx = S.max(2); mn = S.min(2)
    m = ((mx > 200) & (mx - mn < 95) & (g > 150)).astype(np.uint8) * 255       # nubes claras, poco saturadas
    from scipy import ndimage
    lab, n = ndimage.label(np.array(Image.fromarray(m).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(5))) > 0)
    tam = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); keep = np.isin(lab, [j + 1 for j, a in enumerate(tam) if a >= 900])
    M = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))   # solo las nubes grandes (sin agujas ni aspas)
    a = np.dstack([S.clip(0, 255).astype(np.uint8), np.array(M)])
    Image.fromarray(a).save(os.path.join(R, f'assets/menus/mapa_cap1_nube{i}.png'))
    out[f'nube{i}'] = [x0, y0, x1 - x0, y1 - y0]
print(json.dumps(out))
