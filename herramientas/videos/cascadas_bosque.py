"""CASCADAS DEL 1-3 que se mueven, sacadas del video de Gemini que hizo Yesli (fuentes/bosque_cascadas.mp4, animado
desde fuentes/1b_bosque_cascadas_completo.png = cielo + bosque del medio). Solo se recorta el AGUA que se mueve (máscara
por movimiento, con borde suave) y solo donde el bosque del medio es opaco; lo demás sigue siendo el dibujo de Yesli.
Bucle: cuadros 184 → 216 del video (el par más parecido), 16 cuadros a 12 por segundo, con fundido al final.
El video está a 0,8 de la imagen (desplazado −1, +2 px). Salen assets/backgrounds/bosque_cascada<n>.png (tiras) y
los datos para el juego (posición en píxeles de bosque_medio).
Uso: python3 -I herramientas/videos/cascadas_bosque.py   (necesita ffmpeg)
"""
import os, json, subprocess, tempfile
import numpy as np, cv2
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(D, '..', '..', 'assets', 'backgrounds')
tmp = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(D, 'fuentes', 'bosque_cascadas.mp4'), os.path.join(tmp, '%03d.png')], check=True)
fr = lambda i: np.array(Image.open(os.path.join(tmp, '%03d.png' % i)).convert('RGB')).astype(np.float32)
I0, I1, PASO = 184, 216, 2
cuadros = [fr(i) for i in range(I0, I1, PASO)]
N = len(cuadros)
for k in range(4):   # fundido: los últimos cuadros se acercan al primero para que el bucle no salte
    t = (k + 1) / 5; cuadros[N - 4 + k] = cuadros[N - 4 + k] * (1 - t) + cuadros[0] * t
st = np.stack([fr(i) for i in range(48, 241, 4)]).std(0).mean(-1)
medio = Image.open(os.path.join(A, 'bosque_medio.png')).convert('RGBA'); MA = np.array(medio)[..., 3] / 255
R = [(270, 390, 340, 740), (510, 270, 595, 530), (440, 730, 555, 1120)]
datos = []
for n, (x0, y0, x1, y1) in enumerate(R, 1):
    mov = (st[y0:y1, x0:x1] > 10).astype(np.uint8)
    mov = cv2.morphologyEx(mov, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)); mov = cv2.dilate(mov, np.ones((5, 5), np.uint8))
    n2, lab, s, _ = cv2.connectedComponentsWithStats(mov); keep = [i for i in range(1, n2) if s[i, 4] > 150]
    mov = np.isin(lab, keep).astype(np.float32); mov = cv2.GaussianBlur(mov, (9, 9), 0)
    # a coordenadas de bosque_medio
    mx0, my0 = int(round((x0 - 1) / 0.8)), int(round((y0 + 2) / 0.8)); W_, H_ = int(round((x1 - x0) / 0.8)), int(round((y1 - y0) / 0.8))
    m = cv2.resize(mov, (W_, H_)) * MA[my0:my0 + H_, mx0:mx0 + W_]
    tira = Image.new('RGBA', (W_ * N, H_))
    for k, c in enumerate(cuadros):
        cc = cv2.resize(c[y0:y1, x0:x1], (W_, H_), interpolation=cv2.INTER_CUBIC)
        tira.paste(Image.fromarray(np.dstack([np.clip(cc, 0, 255), m * 255]).astype(np.uint8), 'RGBA'), (k * W_, 0))
    tira.save(os.path.join(A, f'bosque_cascada{n}.png'))
    datos.append({'k': f'bosque_cascada{n}', 'x': mx0, 'y': my0, 'w': W_, 'h': H_})
print(json.dumps({'n': N, 'fps': 12, 'cascadas': datos}))
