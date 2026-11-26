"""Aldea G2: separa piezas de las tres láminas RGBA originales (vegetación, faroles, caminos/puentes/señales) en PNG
individuales con alfa real. No se redibuja nada: los píxeles son los de la lámina.
 · Cada pieza = un componente conectado del objeto (alfa de la lámina ≥ 200) + las piececitas sueltas que caen en su
   recuadro (estrellas colgantes, flores sueltas).
 · Resplandor: la lámina trae un halo amarillo/rojizo semitransparente alrededor de cada objeto (alfa < 200). Ese halo
   NO es parte del objeto (sobre el cielo del juego sería un borde amarillo), así que se quita: el objeto acaba donde
   termina su alfa sólido. El borde se suaviza con un anillo de 1 px.
 · Contaminación del borde: los píxeles de contorno que el halo tiñó de amarillo se igualan al color del interior más
   cercano (solo color; la silueta no cambia).
Uso: python3 -I herramientas/fondos/extraer_ruinas_fondo.py  (salida: maestros/fondo/)
"""
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage

R = '/home/claude/Costuras_del_Cielo_juego/maestros/fondo'
LAM = '/home/claude/Costuras_del_Cielo/referencias/laminas_aldea_g2'
# nombre: (lámina, recuadro aproximado x0, y0, x1, y1 del componente principal)
PIEZAS = {
    'ruina_arco_flores':   ('vegetacion', (253, 652, 480, 863)),
    'ruina_columna':       ('vegetacion', (494, 651, 673, 866)),
    'ruina_arco_doble':    ('vegetacion', (683, 652, 869, 862)),
    'ruina_muro_banderin': ('vegetacion', (883, 669, 1106, 860)),
    'rocas_flores':        ('vegetacion', (3, 677, 239, 858)),
}
M = 4
cache = {}
inf = {'laminas': {}, 'piezas': {}}
os.makedirs(R, exist_ok=True)
for nom, (lam, (bx0, by0, bx1, by1)) in PIEZAS.items():
    if lam not in cache:
        L = np.array(Image.open(os.path.join(LAM, f'lamina_{lam}.png')).convert('RGBA'))
        core = L[..., 3] >= 200
        lab, n = ndimage.label(ndimage.binary_closing(core, iterations=3))
        cache[lam] = (L, core, lab, n)
        inf['laminas'][lam] = {'archivo': f'original/lamina_{lam}.png', 'tamano': [int(L.shape[1]), int(L.shape[0])]}
    L, core, lab, n = cache[lam]
    I = L[..., :3].astype(float)
    # componente principal = el más grande dentro del recuadro
    sub = lab[by0:by1, bx0:bx1]; ids, cnt = np.unique(sub[sub > 0], return_counts=True)
    ip = ids[cnt.argmax()]
    pieza = lab == ip
    ys, xs = np.nonzero(pieza); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    sueltas = 0
    for s, sl in enumerate(ndimage.find_objects(lab), 1):
        if s == ip or sl is None: continue
        if sl[1].start >= x0 and sl[1].stop - 1 <= x1 and sl[0].start >= y0 and sl[0].stop - 1 <= y1 and (lab[sl] == s).sum() >= 60:
            pieza |= lab == s; sueltas += 1
    obj = pieza & core
    obj = ndimage.binary_fill_holes(obj) & (core | ~ndimage.binary_fill_holes(obj) | (L[..., 3] >= 120))
    # huecos encerrados grandes donde la lámina es transparente = se ve el fondo (entre ramas, bajo bancos)
    hueco = ndimage.binary_fill_holes(obj) & ~obj
    lh, nh = ndimage.label(hueco); th = ndimage.sum(hueco, lh, range(1, nh + 1))
    obj |= np.isin(lh, 1 + np.nonzero(th < 25)[0])
    obj = ndimage.binary_opening(obj, iterations=1)
    lo, no = ndimage.label(obj); to = ndimage.sum(obj, lo, range(1, no + 1)); obj = np.isin(lo, 1 + np.nonzero(to >= 40)[0])
    # color: el interior (≥ 3 px del borde) es limpio; en el contorno, el halo amarillo puede haber teñido el color.
    interior = ndimage.binary_erosion(obj, iterations=3)
    _, (iy, ix) = ndimage.distance_transform_edt(~interior, return_indices=True)
    F = I[iy, ix]
    contorno = obj & ~interior
    # tinte del halo: más amarillo (R+G altos, B bajo) que el interior vecino → se toma el color del interior
    amar = lambda C: (C[..., 0] + C[..., 1]) / 2 - C[..., 2]
    tenido = contorno & (amar(I) - amar(F) > 40) & (I.mean(-1) > F.mean(-1) + 15)
    col = np.where(tenido[..., None], F, I)
    # alfa: sólido dentro; anillo exterior de 1 px a media opacidad para que no quede dentado
    anillo = ndimage.binary_dilation(obj) & ~obj
    alfa = np.where(obj, 1.0, np.where(anillo, 0.45, 0.0))
    _, (jy, jx) = ndimage.distance_transform_edt(~obj, return_indices=True)
    col = np.where(anillo[..., None], col[jy, jx], col)
    ys, xs = np.nonzero(alfa > 0)
    ya, yb, xa, xb = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    out = np.pad(np.dstack([np.clip(col, 0, 255), alfa * 255]).round().astype(np.uint8)[ya:yb, xa:xb], ((M, M), (M, M), (0, 0)))
    out[out[..., 3] == 0, :3] = 0
    Image.fromarray(out, 'RGBA').save(os.path.join(R, f'{nom}.png'), optimize=True)
    a = out[..., 3]
    halo = (L[..., 3] > 0) & ~ndimage.binary_dilation(obj, iterations=1)
    inf['piezas'][nom] = {'lamina': lam, 'recorte_en_la_lamina': [int(xa), int(ya), int(xb), int(yb)], 'tamano_png': [int(out.shape[1]), int(out.shape[0])],
                          'piezas_sueltas_incluidas': sueltas, 'px_contorno_tenidos_corregidos': int(tenido.sum()),
                          'px_de_halo_quitados_en_su_recuadro': int(halo[ya:yb, xa:xb].sum()),
                          'opacos': int((a == 255).sum()), 'semitransparentes': int(((a > 0) & (a < 255)).sum()), 'transparentes': int((a == 0).sum())}
json.dump(inf, open(os.path.join(R, 'ficha_ruinas_fondo.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps({k: v['tamano_png'] for k, v in inf['piezas'].items()}))
