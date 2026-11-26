"""Quitar el cuadriculado gris/blanco de «transparente» que viene PINTADO en algunas hojas de Yesli (no es transparencia
real). El fondo es gris sin color y claro; se borra todo lo que está unido al borde del recorte. Cerca del borde de la
pieza los brillos suaves (halo) quedan semitransparentes según cuánto color tienen."""
import numpy as np, cv2
from PIL import Image

def quitar(rgb, banda=28):
    a = rgb.astype(np.float32); mx, mn = a.max(-1), a.min(-1); chroma = mx - mn
    fondo = ((chroma < 18) & (mn > 188)).astype(np.uint8)
    n, lab = cv2.connectedComponents(fondo, connectivity=4)
    borde = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(borde))
    al = np.ones(a.shape[:2], np.float32); al[bg] = 0
    cerca = cv2.distanceTransform((~bg).astype(np.uint8), cv2.DIST_L2, 3) < banda
    suave = cerca & ~bg & (mn > 140)
    al[suave] = np.clip((chroma[suave] - 10) / 55, 0, 1) * np.clip((255 - mn[suave]) / 30 + 0.2, 0, 1) ** 0 
    al = np.where(suave, np.maximum(al, np.clip((235 - mn) / 60, 0, 1)), al)
    al = cv2.GaussianBlur(al, (3, 3), 0) * (~bg | (al > 0))
    B = 246.0
    col = np.clip((a - (1 - al[..., None]) * B) / np.maximum(al[..., None], 0.05), 0, 255)
    return col, al

def pieza(ruta, box, ancho=None, alto=None):
    rgb = np.array(Image.open(ruta).convert('RGB'))
    x0, y0, x1, y1 = box; col, al = quitar(rgb[y0:y1, x0:x1])
    # solo lo unido a la pieza más grande (quita letreros y restos de otras piezas)
    n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate((al > 0.3).astype(np.uint8), np.ones((9, 9), np.uint8)))
    if n > 1:
        k = 1 + int(np.argmax(st[1:, 4])); al = np.where(lab == k, al, 0)
    im = Image.fromarray(np.dstack([col, al * 255]).astype(np.uint8), 'RGBA'); im = im.crop(im.getbbox())
    if ancho: im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    if alto: im = im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS)
    return im
