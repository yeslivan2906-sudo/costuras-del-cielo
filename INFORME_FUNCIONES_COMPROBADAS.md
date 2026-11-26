# Informe de funciones comprobadas · Costuras del Cielo v1.0.4

Fecha: 9 de noviembre de 2026. Versión probada: esta carpeta (`index.html` con Phaser local). Todas las pruebas se pueden repetir con los scripts de `herramientas/pruebas/`.

**Dónde se probó:** navegador Chromium de escritorio, automatizado, con física a 60 Hz exactos y con toques y clics reales sobre la pantalla. **No se ha probado en un teléfono Android real** (ver `ERRORES_Y_PENDIENTES.md`).

Resultado: **100 comprobaciones, 100 correctas, 0 errores de consola.**

## 1. Partida completa de principio a fin (43 comprobaciones)

| | Comprobación |
|---|---|
| ✅ | la pantalla de título carga |
| ✅ | Nueva partida abre 1-1 La Aldea Inicial |
| ✅ | Lumi aparece de pie en G1 |
| ✅ | junto a Tilo aparece el botón «Hablar» |
| ✅ | hablar con Tilo cumple la tarea 1 de la misión |
| ✅ | salto de G1 a la repisa 1 (tablón A) |
| ✅ | salto a la repisa 2 (tablón B) |
| ✅ | salto a la isla G2 (mercado) |
| ✅ | salto a la repisa 3 |
| ✅ | se recoge el carrete de hilo dorado (tarea 2) |
| ✅ | salto a la repisa 4 |
| ✅ | se recoge el cristal secreto de la repisa 4 |
| ✅ | bajada a G2 junto al anclaje del puente |
| ✅ | el botón del carrete abre «Reparar con Hilo Dorado» |
| ✅ | botón «Reparar» pulsado |
| ✅ | el puente queda cosido y se gasta el carrete |
| ✅ | la imagen del puente pasa a «reparado» |
| ✅ | misión «El Hilo Perdido» completada |
| ✅ | G3 (isla, casa, faroles, decoración) se restaura al coser |
| ✅ | Lumi camina sobre el puente |
| ✅ | llega a G3 por el puente |
| ✅ | la puerta dorada termina el nivel |
| ✅ | el progreso de 1-1 queda guardado |
| ✅ | el guardado está en el almacenamiento del navegador |
| ✅ | botón «Siguiente nivel» |
| ✅ | se abre 1-2 La primera puntada |
| ✅ | Lumi aparece de pie en la isla inicial |
| ✅ | salto a la repisa dañada (tablón A dañado) |
| ✅ | salto a la isla A |
| ✅ | el carrete cose la grieta gastando energía de hilo |
| ✅ | tarea «Cose la gran grieta» |
| ✅ | Lumi cruza por el puente de hilo |
| ✅ | llega a la isla B |
| ✅ | sube a la repisa sobre B |
| ✅ | sube a la repisa de la izquierda |
| ✅ | sube a la isla D (la de la puerta) |
| ✅ | se cose el anclaje del borde: aparece el rincón secreto |
| ✅ | por el hilo inclinado se sube al rincón: cristal y corazón |
| ✅ | el corazón de cartón da una vida extra (6) |
| ✅ | baja por el hilo, llega a la puerta y completa la misión |
| ✅ | progreso de 1-2 guardado |
| ✅ | 1-2 es el último nivel programado (sin «Siguiente nivel») |
| ✅ | al caer al vacío, Nube devuelve a Lumi a un lugar seguro |

## 2. Menús, controles táctiles, pausa, tienda y guardado (44)

| | Comprobación |
|---|---|
| ✅ | «Continuar» sin partida avisa que no hay partida guardada |
| ✅ | «Galería» avisa que llegará pronto (no programada) |
| ✅ | «Salir» en navegador avisa; en Android cierra la app |
| ✅ | «Opciones» abre la pantalla de opciones |
| ✅ | deslizador de efectos, vibración, tutoriales y pistas cambian y se guardan |
| ✅ | «Restablecer» vuelve a los valores de fábrica |
| ✅ | flecha atrás vuelve al título |
| ✅ | Nueva partida abre el juego |
| ✅ | joystick: derecha mueve a la derecha, izquierda a la izquierda |
| ✅ | botón ↑ salta |
| ✅ | el juego acepta varios dedos a la vez (joystick + botón) |
| ✅ | botón del carrete (toque rápido) lejos de un anclaje: Nube explica qué hacer |
| ✅ | botón de la aguja (toque rápido): ataque (sin enemigos todavía) |
| ✅ | barra rápida: poción (explica que llega con el combate) |
| ✅ | barra rápida: hojas doradas |
| ✅ | junto a Tilo aparece «Hablar» |
| ✅ | «Hablar» abre el diálogo con Tilo |
| ✅ | tocando la pantalla se avanza y se cierra el diálogo; tarea cumplida |
| ✅ | teclado: flechas mueven a Lumi |
| ✅ | el engranaje abre la pausa |
| ✅ | en pausa el juego se detiene |
| ✅ | «Sonido» se apaga y se guarda |
| ✅ | «Pista de Nube» muestra el anuncio de prueba (simulado) |
| ✅ | tras la cuenta atrás de 5 s aparece «Recibir premio» |
| ✅ | el premio cierra la pausa, guía con puntos y descuenta un anuncio del día |
| ✅ | «Seguir» continúa |
| ✅ | «Reiniciar» vuelve a empezar el nivel |
| ✅ | «Salir al mapa» abre el mapa |
| ✅ | capítulo bloqueado → puerta para adultos antes de comprar |
| ✅ | respuesta correcta → compra de prueba «Cielo completo» (modo prueba, sin cobro) |
| ✅ | capítulo II comprado pero sin niveles: «llegará en una actualización» (no programado) |
| ✅ | Taller de Nube abre la tienda |
| ✅ | comprar la capucha Aurora con 3 cristales y ponérsela |
| ✅ | volver a la capucha Clásica |
| ✅ | capucha Estrella sin ganar: explica cómo ganarla |
| ✅ | capucha Noche sin cristales suficientes: avisa cuántos faltan |
| ✅ | «Volver» regresa al mapa |
| ✅ | capítulo I en el mapa abre el nivel que toca |
| ✅ | tras recargar, «Continuar» abre el mapa de la partida guardada |
| ✅ | el panel muestra progreso, tiempo y fecha |
| ✅ | «Continuar» del panel abre el siguiente nivel pendiente (1-2) |
| ✅ | «Borrar» pide confirmación |
| ✅ | borrar partida quita el progreso pero conserva compras y capuchas |
| ✅ | tras borrar vuelve al título |

## 3. Integración Android simulada y funcionamiento sin internet (13)

| | Comprobación |
|---|---|
| ✅ | sin internet: arranca con Phaser 3.80.1 local y muestra el título |
| ✅ | se registra el botón atrás de Android |
| ✅ | atrás en Opciones → título |
| ✅ | atrás en el Taller → mapa |
| ✅ | atrás en el mapa → título |
| ✅ | atrás en el juego → abre la pausa |
| ✅ | atrás otra vez → cierra la pausa |
| ✅ | con el diálogo «Reparar» abierto, atrás no lo rompe (sigue el diálogo) |
| ✅ | con el diálogo abierto, la tecla P tampoco lo rompe (corrección) |
| ✅ | «Cerrar» del diálogo devuelve el control |
| ✅ | al pasar a segundo plano (llamada, inicio) el juego queda en pausa |
| ✅ | atrás en el título → cierra la app |
| ✅ | sin errores ni cargas fallidas |

## 4. Recursos gráficos

- Las 50 imágenes que usa el juego cargan; **0 objetos con textura faltante** en el título, opciones, mapa, taller y los dos niveles (antes y después de coser).
- El paquete de imágenes pasa de 138 a 50 recursos (de 4,4 a 2,4 MB): los 88 que no aparecen en ningún nivel siguen en `assets/`, solo que no se cargan (`assets/no_empaquetar.txt`). No cambia nada de lo que se ve.
- Casa, mercado con interior oscuro, vegetación, faroles, puente, tablones, nueve cascadas, molinos y Taller de Tilo: en sus posiciones aprobadas (la decoración es la misma que en la versión de referencia).

## 5. Correcciones hechas (errores reales)

| Error | Efecto | Corrección |
|---|---|---|
| Toques rápidos en los botones de pantalla | Los botones ↑, carrete y aguja se leían solo mirando si el dedo seguía apoyado en cada cuadro: en un móvil lento, un toque corto se perdía y Lumi no saltaba o no cosía. | Cada toque sobre un botón queda anotado hasta el cuadro siguiente. El salto, el carrete y la aguja responden aunque el toque sea muy corto. |
| Pausa con el diálogo «Reparar con Hilo Dorado» abierto | La tecla P (y el botón atrás de Android) quitaba la pausa del diálogo y lo dejaba en pantalla con el juego en marcha. | La pausa no se toca mientras haya un diálogo abierto. |
| Phaser cargado desde internet | Sin conexión (o en la app) el juego no arrancaba. | Phaser 3.80.1 va dentro del juego (`lib/`). |

## 6. Preparación para Android

- Formato vertical fijo (360 × 640 base, lienzo 720 × 1280 que se ajusta a la pantalla).
- Proyecto de app listo en `app_android/` (Capacitor 8): orientación vertical, pantalla completa, la pantalla no se apaga mientras se juega, botón «atrás» del teléfono (pausa / volver / salir) y pausa automática al pasar a segundo plano.
- Rendimiento para teléfonos modestos: lienzo de tamaño fijo (no crece con la densidad de la pantalla), Phaser local, 88 imágenes sin uso fuera del paquete y la app solo lleva lo necesario (`index.html`, Phaser y el paquete: unos 5 MB).
- No se pudo compilar el APK aquí: este entorno no tiene el SDK de Android ni acceso a los repositorios de Google. Los pasos para compilarlo en tu ordenador están en `COMO_JUGAR.md`.

## 7. Mejora visual del fondo (v1.0.1)

- **Árboles de abajo (capa cercana):** los árboles eran recortes diminutos (unos 100 px) ampliados al doble, por eso se veían pixelados. Ahora son los árboles y arbustos **aprobados de la Aldea G2** en alta resolución (cerezo rosa, glicina, árbol azul, árbol dorado y pino, con hortensias, helechos y flores), con el mismo tinte nocturno de primer plano. La franja plana de abajo pasa a ser un degradado.
- **Montañas y ruinas del fondo:** el filo de las montañas era una línea clara dura y ahora es un brillo suave. Las cuatro ruinas pixeladas se sustituyen, en las mismas posiciones, por ruinas de la lámina aprobada de la Aldea G2 en alta resolución.
- **No se mueve nada:** se usa el mismo azar y la misma geometría. Las montañas, las nubes y las islas lejanas están donde estaban, así que las nueve cascadas, sus recortes de nubes y el molino pequeño siguen encajando. Las nubes de la capa 3 son idénticas píxel a píxel.
- El cielo, la luna y las islas lejanas no cambian.
- El nivel 1-2 conserva su cielo propio: se probó el fondo de la Aldea y las islas del fondo se confundían con las plataformas por las que se salta.
- Fondos anteriores guardados en `respaldo/fondos_v1/`. Script: `herramientas/fondos/componer_fondos_v2.py`.
- Partida completa repetida con el fondo nuevo: todo correcto.

## 8. Islas de cartón de la Aldea (v1.0.2)

- Las islas G1, G2 y G3 usan la **isla de cartón aprobada**: piezas 64 + 128 + 64 de la ilustración aprobada de la isla mediana, con pasto, capas de cartón y puntadas doradas. Antes, G2 y G3 tenían unas piezas de ladrillo pixelado de prueba que se habían quedado en el proyecto, y G1 era un bloque dibujado por código.
- Se usan los tres estados ya preparados: normal; dañada, con grietas; y reparada, con hilo dorado. En G3 la isla pasa de dañada a reparada al coser el puente. Los centros alternan sus tres variantes para que no se repita el mismo dibujo.
- **Colisiones sin cambios:** las zonas de suelo son exactamente las mismas. La partida completa se repitió y todo es correcto.
- Las piezas de ladrillo anteriores están guardadas en `respaldo/plataformas_ladrillo_v1/`.
- Las islas del nivel 1-2 siguen con su dibujo propio (ver pendientes).

## 9. Fondo lejano coherente: tierras flotantes y niebla (v1.0.3)

- **Islas lejanas:** ahora son tierras flotantes con la forma de la isla de cartón aprobada (64 + 128 + 64), afinadas hacia abajo, con árboles de la Aldea encima y alguna cascada fina. Antes eran islotes pixelados con ruinas. Llevan el tono violeta y la niebla de la distancia.
- **Montañas:** hay una cordillera más lejana envuelta en niebla. La niebla sube desde los valles y hay bancos de niebla entre las montañas.
- **En lugar de ruinas destruidas:** bosquecillos de los árboles de la Aldea, en las mismas posiciones. Cada árbol está plantado en la ladera de la montaña, en su propia columna, para que no quede flotando.
- **Nada del juego se mueve:** la forma de las dos cordilleras y la posición de las nubes son las de siempre. Las nueve cascadas y el molino pequeño siguen en su sitio.
- Fondos anteriores en `respaldo/fondos_v2/`. Script: `herramientas/fondos/componer_fondos_v3.py`. Partida completa repetida: todo correcto.

## 10. Personajes de las láminas (v1.0.4)

- **Lumi**, **Nube** y **Tilo** son ahora los de las láminas de personajes, en lugar de los dibujados por código.
- **Lumi:** reposo, caminar con 4 cuadros (antes 2), saltar, coser y aguja, más su retrato redondo del HUD y de los diálogos. La lámina trae la capucha roja; las otras cuatro capuchas del Taller (Estrella, Aurora, Hoja y Noche) cambian solo el color de la ropa roja.
- **Nube** vuela junto a Lumi y aparece en las pistas y los diálogos. **Tilo** es el panda con gafas y tiene su cara en los diálogos.
- **Física sin cambios:** misma clave y mismo tamaño de textura; el pie de Lumi está donde termina su cuerpo de colisión.
- Partida completa y prueba de menús repetidas con los personajes nuevos: todo correcto.
- Herramienta: `herramientas/personajes/extraer_personajes.py`. Recortes grandes en `maestros/personajes/`. El `index.html` anterior está en `respaldo/index_antes_personajes.html`.

## 11. Lumi pintada con animación unificada (v1.0.5)
- **Lumi** usa la lámina pintada (Costuras_Personajes_v2) con **todas** sus animaciones en el juego: quieta 6 cuadros (en
  bucle, también mientras habla), caminar 8, saltar 3 (despegue → subida → caída, según la velocidad), coser 4 (durante el
  cosido) y aguja 3 (durante el golpe). Las 5 capuchas tienen todos los cuadros.
- **Unificada:** todas las poses salen con la misma escala, el mismo pie (fila 97) y el mismo eje (la cabeza centrada en
  la columna 74 = centro del cuerpo de colisión): no cambia de tamaño ni da saltos al pasar de una pose a otra.
- **Nube** anima sus 6 cuadros de vuelo mientras sigue a Lumi. Su icono de pistas y diálogos no cambia. **Tilo** sigue igual.
- **Física sin cambios:** cuerpo 36 × 68 en la misma posición que en v1.0.4 (medido con la misma prueba en las dos versiones).
- Pruebas: partida completa 43 ✓ · menús y controles 44 ✓ · Android 13 ✓ · animación unificada 11 ✓ (`herramientas/pruebas/animacion_unificada.js`).
- Herramienta: `herramientas/personajes/texturas_unificadas.py`. GIF y vídeo en `pruebas_juego/animacion_unificada/`.
  La versión anterior completa está en `respaldo/v1.0.4_personajes_pixel/`.

## 12. Taller de Nube rediseñado (v1.0.6)
- La tienda usa ya el mismo arte pintado que Opciones: estandarte con carrete («Taller de Nube»), cielo con islas,
  pergamino con marco cosido, flores abajo, cintas moradas para «Cielo completo» y «Capuchas de Lumi», y botones rojos.
- Las tarjetas de capucha muestran a **Lumi pintada de frente** de la lámina (las 5 capuchas), con costura punteada, color
  de su capucha, brillo dorado en la puesta y estado en una píldora (Usando · Usar · cristales · Gánala jugando).
- «Restaurar compras» ocupa la sexta casilla; flecha atrás arriba y «Volver» abajo.
- **Lo que hace la tienda no cambia:** mismo precio, misma compra de prueba, mismas capuchas, costes y avisos.
- Pruebas: menús y controles 44 ✓ (incluye comprar Aurora, cambiar a Clásica, Estrella sin ganar, Noche sin cristales y
  Volver) · partida 43 ✓ · Android 13 ✓ · animación 11 ✓. Capturas: `pruebas_juego/taller_nuevo*.png`.
- Herramienta: `herramientas/menus/componer_taller.py` (sale de `opciones_fondo_origen.jpeg` y de las láminas de Lumi;
  piezas en `assets/menus/`). Versión anterior en `respaldo/v1.0.5_antes_taller/`.
