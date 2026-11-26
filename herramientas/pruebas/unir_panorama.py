"""Une las 4 vistas de panorama_aldea.js (x 0, 720, 1440, 2080) en una imagen de 2800 × 1280. Uso: python3 unir_panorama.py <salida.png>"""
import sys; from PIL import Image
o = sys.argv[1]; P = Image.new('RGB', (2800, 1280))
for x in (0, 720, 1440, 2080):
    v = Image.open(o.replace('.png', f'_vista_{x}.png')).convert('RGB')
    P.paste(v.crop((2160 - 2080, 0, 720, 1280)) if x == 2080 else v, (2160 if x == 2080 else x, 0))
P.save(o)
