"""Mapa del Capítulo II de Yesli (1024 × 1536) → fondo 720 × 1280 del juego: se escala a 1280 de alto y se recorta el
centro a 720 de ancho (pierde un poco de los lados). Sin retocar. Uso: python3 -I herramientas/mapa_capitulo/preparar_mapa2.py"""
import os
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__))
im = Image.open(os.path.join(D, 'fuentes', 'mapa_capitulo2.png')).convert('RGB')
k = 1280 / im.height; im = im.resize((round(im.width * k), 1280), Image.LANCZOS)
x0 = (im.width - 720) // 2; im = im.crop((x0, 0, x0 + 720, 1280))
out = os.path.join(D, '..', '..', 'assets', 'menus', 'mapa_capitulo2.jpg'); im.save(out, quality=90); print(out, im.size, 'recorte x0', x0)
