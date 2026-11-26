# Aldea G2 · versión visual completa (COPIA DE PRUEBAS)

Copia independiente: `costuras_prueba_aldea_g2` (base: `costuras_prueba_casa_g2` = 9 cascadas al 82 % + casa en prueba).
El proyecto principal `costuras/` no se ha tocado. Nada está integrado.

## Qué cambia en esta copia
- `index.html`: `LEVEL_ALDEA.decoraciones` (lista de imágenes) + métodos `decoracionesAldea()` y `texturaApagada()`.
  Solo dibujo: sin cuerpo físico, sin tocar `solids`, controles, interfaz, misiones ni progreso.
- `assets/village/`: versiones de juego (maestro reducido a su escala aprobada). Maestros sin tocar en `maestros/village/`.
- G3 (grupo `main`): la casa y su decoración empiezan apagadas (copia gris lavanda, como la isla sin coser) y recuperan
  el color al coser el puente, con el mismo mecanismo de restauración que islas, repisas y faroles.
- `index_prueba_android.html`: el mismo juego + panel de prueba para el móvil (hitos del recorrido, FPS por zona).

## Distribución (px de juego)
Ver `pruebas/aldea_g2/tabla_posiciones.md`.
- G1: glicina detrás de la rendija molino/taller; cerezo rosa, farol seta, hortensias y poste de señales en el hueco 820–1040.
- G2: mercado en dos filas a 0,30 con la variante APROBADA de interior oscuro opaco (v2; la de interior transparente se
  guarda en `maestros/village_interior_transparente/`) (alimentos delante; costura y mágico detrás, 10 px más arriba) + farol en la llegada.
- G3: casa pequeña a 1,0 (2190–2651, deja libre la puerta 2672–2748) + farol a la salida del puente y otro junto a la puerta.
- Sin usar: los puentes de la lámina (no hay agua que cruzar y los puentes aprobados no se sustituyen), árboles dorado,
  azul y pino, pozo, tablón, banco, banderines, guirnalda… extraídos y disponibles en `maestros/village/`.

## Pruebas (navegador de escritorio, física a 60 Hz exactos)
- Colisiones idénticas (7 sólidos), cuerpos físicos 31 = 31, decoración con física 0.
- Recorrido con controles (derecha + salto) desde el inicio hasta la puerta, con cosido real del puente: mismos hitos y
  633 de 634 cuadros idénticos con y sin decoración. El único cuadro distinto (n.º 1, 0,3–0,6 px al posarse tras el
  teletransporte inicial) aparece igual comparando la página SIN decoración consigo misma (`control_misma_pagina/`).
- Sin errores de consola. Paquete de recursos: 4,4 MB (antes 3,9 MB).
- Android: NO medido aquí. Prueba en el Galaxy A07 con `index_prueba_android.html` (o el artefacto «Prueba Aldea G2»).
