"""Paquete LIGERO para la página de prueba en el teléfono: igual que empaquetar_assets.py, pero las imágenes grandes
(> 90 KB) van en WebP de calidad 90 (con transparencia). Mismo tamaño en píxeles y mismas claves; el juego no cambia.
Los archivos de assets/ no se tocan. Solo entran los recursos que también lleva el paquete normal (assets/paquete_assets.js).
Uso: python3 -I herramientas/empaquetar_movil.py <salida/paquete_assets.js> [calidad=84]"""
import os, sys, io, base64, json
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
lista = os.path.join(ROOT, 'no_empaquetar.txt')
fuera = set(l.strip() for l in open(lista) if l.strip() and not l.startswith('#')) if os.path.exists(lista) else set()
out, antes, despues = {}, 0, 0
import re
CAL = int(sys.argv[2]) if len(sys.argv) > 2 else 84
normal = set(re.findall(r'"([a-z0-9_]+/[^"]+)":"data:', open(os.path.join(ROOT, 'paquete_assets.js')).read()))
for carpeta in sorted(os.listdir(ROOT)):
    d = os.path.join(ROOT, carpeta)
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        nombre, ext = f.rsplit('.', 1)[0], f.rsplit('.', 1)[-1].lower()
        if ext not in ('png', 'jpg', 'jpeg', 'webp') or f'{carpeta}/{nombre}' in fuera or (normal and f'{carpeta}/{nombre}' not in normal): continue
        raw = open(os.path.join(d, f), 'rb').read(); antes += len(raw)
        mime = 'image/png' if ext == 'png' else 'image/webp' if ext == 'webp' else 'image/jpeg'
        if len(raw) > 40 * 1024:
            im = Image.open(io.BytesIO(raw)); b = io.BytesIO()
            im.save(b, 'WEBP', quality=CAL, method=6)
            if b.tell() < len(raw): raw, mime = b.getvalue(), 'image/webp'
        despues += len(raw)
        out[f'{carpeta}/{nombre}'] = f'data:{mime};base64,' + base64.b64encode(raw).decode()
js = '// GENERADO por herramientas/empaquetar_movil.py (versión ligera para el teléfono) — no editar a mano.\nwindow.ASSETS = ' + json.dumps(out, separators=(',', ':')) + ';\n'
open(sys.argv[1], 'w').write(js)
print(len(out), 'recursos ·', antes // 1024, 'KB →', despues // 1024, 'KB · paquete', len(js) // 1024, 'KB')
