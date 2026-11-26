"""Empaqueta assets/ en assets/paquete_assets.js para que index.html funcione con doble clic
(sin servidor). Cada recurso queda disponible en Phaser con la clave 'a/<carpeta>/<nombre>'.
Correr de nuevo cada vez que se agregue o reemplace una imagen en assets/."""
import os, base64, json
ROOT = os.path.join(os.path.dirname(__file__), '..', 'assets')
out = {}
# assets/no_empaquetar.txt: claves '<carpeta>/<nombre>' que el juego no usa; se quedan en su carpeta pero no se empaquetan
lista = os.path.join(ROOT, 'no_empaquetar.txt')
fuera = set(l.strip() for l in open(lista) if l.strip() and not l.startswith('#')) if os.path.exists(lista) else set()
for carpeta in sorted(os.listdir(ROOT)):
    d = os.path.join(ROOT, carpeta)
    if not os.path.isdir(d): continue
    for f in sorted(os.listdir(d)):
        ext = f.rsplit('.', 1)[-1].lower()
        if ext not in ('png', 'jpg', 'jpeg', 'webp'): continue
        mime = 'image/png' if ext == 'png' else 'image/webp' if ext == 'webp' else 'image/jpeg'
        if f'{carpeta}/{f.rsplit(".", 1)[0]}' in fuera: continue
        data = base64.b64encode(open(os.path.join(d, f), 'rb').read()).decode()
        out[f'{carpeta}/{f.rsplit(".", 1)[0]}'] = f'data:{mime};base64,{data}'
js = ('// GENERADO por herramientas/empaquetar_assets.py — no editar a mano.\n'
      '// Recursos PROVISIONALES (ver assets/REGISTRO_ASSETS.md).\n'
      'window.ASSETS = ' + json.dumps(out, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'paquete_assets.js'), 'w').write(js)
print(len(out), 'recursos (', len(fuera), 'sin usar fuera del paquete ),', round(len(js) / 1024), 'KB')
