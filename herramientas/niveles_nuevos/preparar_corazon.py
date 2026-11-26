"""1-12 «EL CORAZÓN DEL TELAR»: piezas de la hoja corazon_telar.png de Yesli (encapuchados, tejedor grande, puerta final,
corazón del telar, cristales, banderines, carretes, cofre, faroles…). Sin redibujar.
Uso: python3 -I herramientas/niveles_nuevos/preparar_corazon.py"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cortar import pieza, guardar
H = 'corazon_telar.png'
P = [('encapuchado1', (10, 0, 290, 245), None), ('encapuchado2', (280, 0, 645, 245), None), ('tejedor', (640, 0, 1175, 345), 360),
     ('puerta_final', (1170, 0, 1536, 365), 220), ('arana1', (55, 265, 215, 385), 90), ('arana2', (215, 265, 370, 385), 90),
     ('munecos', (365, 255, 560, 395), 120), ('golem', (555, 245, 695, 385), 90),
     ('cristal_azul', (35, 385, 145, 525), 50), ('cristal_dorado', (175, 385, 285, 525), 50), ('cristal_morado', (305, 385, 405, 525), 50),
     ('poste_banderin', (0, 535, 205, 715), 110), ('banderin', (205, 535, 385, 725), 90), ('corazon', (378, 375, 742, 745), 260),
     ('plataforma_banderin', (715, 365, 985, 495), 150), ('caja_plataforma', (985, 365, 1145, 495), 90), ('cajas', (1145, 365, 1405, 495), 130),
     ('engranaje', (1405, 375, 1525, 485), 60), ('carretes_hilos', (745, 485, 1125, 605), 200), ('puas', (1145, 495, 1365, 605), 110),
     ('reja', (1355, 495, 1535, 695), 90), ('guirnalda', (775, 605, 1365, 725), 300), ('carretes1', (0, 745, 255, 1024), 120),
     ('carretes2', (250, 845, 435, 1015), 90), ('farol1', (425, 735, 555, 1015), 60), ('carrete_alto', (595, 735, 735, 945), 70),
     ('alfiletero', (455, 865, 605, 1015), 70), ('telas', (715, 725, 925, 965), 110), ('frascos', (915, 785, 1085, 1015), 90),
     ('farol2', (1075, 755, 1225, 1015), 60), ('cofre', (1195, 745, 1536, 1015), 160)]
for n, b, a in P:
    print(n, guardar(pieza(H, b, ancho=a), 'corazon', n))
