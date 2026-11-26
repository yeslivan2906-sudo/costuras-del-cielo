"""ACERTIJO DEL TELAR con las dos imágenes de Yesli (apagada y encendida, alineadas píxel a píxel), sin redibujar:
 · telar_fondo.jpg: la versión APAGADA ajustada a la pantalla (720 × 1280, recortando los lados).
 · telar_<luna|nube|hoja|sol>.png: el trozo de la versión ENCENDIDA que cambia en ese radio (hilo + círculo), con
   alfa suave; se pone encima cuando el jugador toca ese símbolo.
 · telar_centro.png: el carrete encendido, para cuando el acertijo se resuelve.
Imprime la posición de cada trozo (px de pantalla) para el código.
Uso: python3 -I preparar_telar.py <apagado.jpg> <encendido.jpg> <assets/menus>
"""
import sys, os, json
import numpy as np, cv2
from PIL import Image
OFF, ON, OUT = sys.argv[1:4]
def pantalla(p):
    im = Image.open(p).convert('RGB'); f = 1280 / im.height
    im = im.resize((round(im.width * f), 1280), Image.LANCZOS); x0 = (im.width - 720) // 2
    return np.array(im.crop((x0, 0, x0 + 720, 1280))).astype(np.float32)
a, b = pantalla(OFF), pantalla(ON)
Image.fromarray(a.astype(np.uint8)).save(os.path.join(OUT, 'telar_fondo.jpg'), quality=88)
dif = np.abs(b - a).max(-1)
mask = cv2.GaussianBlur((dif > 22).astype(np.float32), (0, 0), 3)
mask = np.clip(cv2.dilate(mask, np.ones((7, 7), np.uint8)) * 1.4, 0, 1)
C = (360, 680)                       # centro del carrete (px de pantalla); radio del círculo central ≈ 84
yy, xx = np.mgrid[0:1280, 0:720]
d = np.hypot(xx - C[0], yy - C[1]); ang = np.degrees(np.arctan2(yy - C[1], xx - C[0]))
zonas = {
    'centro': d < 92,
    'hoja': (d >= 80) & (np.abs(ang) < 30) & (xx < 700),
    'sol': (d >= 80) & (np.abs(ang - 90) < 30) & (yy < 980),
    'nube': (d >= 80) & (np.abs(np.abs(ang) - 180) < 30) & (xx > 20),
    'luna': (d >= 80) & (np.abs(ang + 90) < 30) & (yy > 380),
}
pos = {}
for k, z in zonas.items():
    al = mask * cv2.GaussianBlur(z.astype(np.float32), (0, 0), 4)
    ys, xs = np.nonzero(al > 0.02)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    im = np.dstack([b[y0:y1, x0:x1], al[y0:y1, x0:x1] * 255]).astype(np.uint8)
    Image.fromarray(im, 'RGBA').save(os.path.join(OUT, f'telar_{k}.png'))
    pos[k] = [int(x0), int(y0)]
print(json.dumps(pos))
