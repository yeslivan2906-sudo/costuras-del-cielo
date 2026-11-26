"""TALLER DE NUBE (tienda) con el mismo arte pintado que Opciones, sin redibujar nada:
 · taller_fondo.jpg 720 × 1280: el fondo de Opciones con el título «Opciones» borrado del estandarte (el juego escribe
   «Taller de Nube») y, en lugar de pestañas y ajustes, el mismo pergamino con marco cosido, limpio y alargado hacia arriba.
 · cinta.png: la cinta morada de «Audio» sin icono ni texto (el juego pone icono y título).
 · boton_rojo.png: el botón de «Restablecer» sin texto.
 · icono_restaurar.png: la flecha circular de «Restablecer ajustes» con alfa.
 · capucha_<skin>.png: las cinco Lumi de frente de la lámina (Costuras_Personajes_v2, frontal_lamina_<capucha>.png).
Uso: python3 -I herramientas/menus/componer_taller.py <OPT_BG.jpeg> <Costuras_Personajes_v2> <assets/menus>
"""
import os, sys
import numpy as np, cv2
from PIL import Image
OPT, PERS, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)
bg = np.array(Image.open(OPT).convert('RGB')).astype(np.float32)
hsv = cv2.cvtColor(bg.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32) / [180, 255, 255]

def rellenar_suave(img, valido, sigma):
    """relleno por convolución normalizada: color medio del pergamino de alrededor."""
    v = valido.astype(np.float32)
    num = cv2.GaussianBlur(img * v[..., None], (0, 0), sigma); den = cv2.GaussianBlur(v, (0, 0), sigma)[..., None]
    return num / np.maximum(den, 1e-4)

# 1) estandarte: borrar «Opciones»
x0, y0, x1, y1 = 248, 52, 474, 112
sub = bg[y0:y1, x0:x1].astype(np.uint8)
m = (hsv[y0:y1, x0:x1, 2] < 0.55).astype(np.uint8) * 255
m = cv2.dilate(m, np.ones((5, 5), np.uint8))
bg[y0:y1, x0:x1] = cv2.inpaint(sub, m, 9, cv2.INPAINT_TELEA)

# 2) pergamino limpio
P0, P1 = 300, 1092
P = bg[P0:P1].copy(); Ph = hsv[P0:P1]
ix0, ix1, iy0, iy1 = 30, 690, 44, 760          # interior (sin tocar el marco cosido)
pergamino = (Ph[..., 2] > 0.86) & (Ph[..., 1] < 0.26)
interior = np.zeros(pergamino.shape, np.float32); interior[iy0:iy1, ix0:ix1] = 1
limpio = (pergamino & (interior > 0)) & ~cv2.dilate((~pergamino).astype(np.uint8), np.ones((15, 15), np.uint8)).astype(bool)
# tono del pergamino: superficie suave (polinomio de grado 3 ajustado a los píxeles limpios), sin manchas
yy, xx = np.nonzero(limpio); sel = np.random.default_rng(1).choice(len(yy), min(40000, len(yy)), replace=False); yy, xx = yy[sel], xx[sel]
def feats(y, x):
    y = y / P.shape[0]; x = x / P.shape[1]
    return np.stack([x ** i * y ** j for i in range(4) for j in range(4 - i)], -1)
coef = np.linalg.lstsq(feats(yy, xx), P[yy, xx], rcond=None)[0]
gy, gx = np.mgrid[0:P.shape[0], 0:P.shape[1]]
base = (feats(gy.ravel().astype(np.float32), gx.ravel().astype(np.float32)) @ coef).reshape(P.shape).astype(np.float32)
contenido = interior
# grano del papel: ruido fino + manchas suaves (el pergamino original es casi liso)
rng = np.random.default_rng(7)
fino = cv2.GaussianBlur(rng.normal(0, 1, P.shape[:2]).astype(np.float32), (0, 0), 0.9) * 5
manchas = cv2.GaussianBlur(rng.normal(0, 1, P.shape[:2]).astype(np.float32), (0, 0), 18) * 60
tile = (fino + manchas)[..., None] * np.array([1.0, 0.92, 0.8], np.float32)
lleno = np.clip(base + tile * 0.9, 0, 255)
suave = cv2.GaussianBlur(contenido, (0, 0), 7)[..., None]
P = P * (1 - suave) + lleno * suave
# alargar hacia arriba: el pergamino empieza en y = 215 (debajo del estandarte) y acaba donde estaba
NY0 = 215
P = cv2.resize(P, (720, P1 - NY0), interpolation=cv2.INTER_CUBIC)
out = bg.copy(); out[NY0:P1] = P
# unir con el cielo de arriba (2 px de fundido)
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(os.path.join(OUT, 'taller_fondo.jpg'), quality=90)

# 3) piezas
def pieza(box, borrar, nombre, limpias):
    """borra icono y texto rellenando cada fila con el color medio de esa fila en columnas limpias de la propia pieza."""
    x0, y0, x1, y1 = box
    sub = bg[y0:y1, x0:x1].copy()
    bx0, by0, bx1, by1 = borrar
    perfil = np.mean([sub[:, c0:c1].mean(1) for c0, c1 in limpias], 0)          # (alto, 3)
    perfil = cv2.GaussianBlur(perfil[:, None, :].astype(np.float32), (1, 0), sigmaX=0.1, sigmaY=2.2)[:, 0]   # sin rayas
    rng = np.random.default_rng(3)
    relleno = np.repeat(perfil[:, None], sub.shape[1], 1) + (cv2.GaussianBlur(rng.normal(0, 1, sub.shape[:2]).astype(np.float32), (0, 0), 1.2) * 4 + cv2.GaussianBlur(rng.normal(0, 1, sub.shape[:2]).astype(np.float32), (0, 0), 7) * 40)[..., None]
    m = np.zeros(sub.shape[:2], np.float32); m[by0:by1, bx0:bx1] = 1
    m = cv2.GaussianBlur(m, (0, 0), 1.5)[..., None]
    sub = sub * (1 - m) + relleno * m
    # alfa: forma de píldora del propio botón (el marco dorado mide lo mismo que la pieza menos 3 px)
    H, Wd = sub.shape[:2]; k = 4
    m = np.zeros((H * k, Wd * k), np.uint8); r = (H - 6) * k // 2
    cv2.rectangle(m, (3 * k + r, 3 * k), ((Wd - 3) * k - r, (H - 3) * k), 255, -1)
    cv2.circle(m, (3 * k + r, H * k // 2), r, 255, -1); cv2.circle(m, ((Wd - 3) * k - r, H * k // 2), r, 255, -1)
    a = cv2.resize(m, (Wd, H), interpolation=cv2.INTER_AREA)
    Image.fromarray(np.dstack([np.clip(sub, 0, 255).astype(np.uint8), a])).save(os.path.join(OUT, nombre))
pieza((40, 351, 274, 404), (13, 8, 214, 46), 'cinta.png', [(214, 224)])
pieza((448, 978, 666, 1034), (24, 10, 194, 46), 'boton_rojo.png', [(14, 22), (196, 204)])
ic = bg[978:1030, 66:126]; ih = hsv[978:1030, 66:126]
alfa = np.clip((0.78 - ih[..., 2]) / 0.25, 0, 1) * 255
Image.fromarray(np.dstack([ic.astype(np.uint8), alfa.astype(np.uint8)])).save(os.path.join(OUT, 'icono_restaurar.png'))

CAP = {'roja': 'clasica', 'dorada': 'estrella', 'violeta': 'aurora', 'verde': 'hoja', 'azul_noche': 'noche'}
for cap, skin in CAP.items():
    im = Image.open(f'{PERS}/Lumi/capuchas/{cap}/frontal_lamina_{cap}.png').convert('RGBA')
    im = im.crop(im.getbbox()); f = 196 / im.height
    im.resize((round(im.width * f), 196), Image.LANCZOS).save(os.path.join(OUT, f'capucha_{skin}.png'))
print('listo:', sorted(os.listdir(OUT)))
