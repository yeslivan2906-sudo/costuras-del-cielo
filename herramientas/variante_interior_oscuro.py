"""Mercado G2 · variante APROBADA de interior oscuro opaco. Sustituye los maestros de los tres puestos por los PNG de
interior oscuro (mismo tamaño y misma fila de apoyo que los de interior transparente, que se guardan en
maestros/village_interior_transparente) y rehace sus versiones de juego a ×0,30 con el mismo método (Lanczos con alfa
premultiplicado). La configuración del nivel (posición, escala, pie, profundidad) no cambia.
Uso: python3 -I herramientas/variante_interior_oscuro.py"""
import os, json, shutil
import numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = '/home/claude/costuras_puestos_g2/variante_interior_oscuro'
inf = json.load(open(os.path.join(R, 'maestros/versiones_juego.json')))
res = {}
for n in ('puesto_costura_g2', 'puesto_alimentos_g2', 'puesto_magico_g2'):
    nuevo = os.path.join(SRC, f'{n}_interior_oscuro.png'); viejo = os.path.join(R, f'maestros/village_interior_transparente/{n}.png')
    a_n, a_v = Image.open(nuevo), Image.open(viejo)
    assert a_n.size == a_v.size, (n, a_n.size, a_v.size)
    shutil.copyfile(nuevo, os.path.join(R, f'maestros/village/{n}.png'))
    im = a_n.convert('RGBA'); m = inf[n]['escala_maestro']; W, H = inf[n]['juego']
    a = np.array(im).astype(float); a[..., :3] *= a[..., 3:] / 255
    o = np.dstack([np.array(Image.fromarray(a[..., c].astype(np.float32), 'F').resize((W, H), Image.LANCZOS)) for c in range(4)])
    o[..., 3] = np.clip(o[..., 3], 0, 255)
    o[..., :3] = np.where(o[..., 3:] > 0, o[..., :3] * 255 / np.maximum(o[..., 3:], 1e-3), 0)
    o = np.clip(o, 0, 255).round().astype(np.uint8); o[o[..., 3] < 3] = 0
    Image.fromarray(o, 'RGBA').save(os.path.join(R, f'assets/village/{n}.png'), optimize=True)
    al = o[..., 3]
    res[n] = {'maestro': list(im.size), 'juego': [W, H], 'escala': m, 'opacos_juego': int((al == 255).sum()), 'transparentes_juego': int((al == 0).sum())}
    inf[n]['variante'] = 'interior oscuro opaco (aprobada)'
json.dump(inf, open(os.path.join(R, 'maestros/versiones_juego.json'), 'w'), indent=1)
print(json.dumps(res))
