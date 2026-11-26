# Errores y pendientes · Costuras del Cielo v1.1.0

## Errores que impiden jugar
**Ninguno encontrado.** La partida completa (1-1 y 1-2), los menús, la tienda de prueba, el guardado y los controles
funcionan en las 111 comprobaciones automáticas (100 de juego + 11 de la animación unificada). Los tres errores reales que aparecieron están corregidos (ver
`INFORME_FUNCIONES_COMPROBADAS.md`, apartado 5).

## Comprobado en un teléfono real (23/11/2026)
Galaxy A07 (SM-A075M, Android 16, Chrome 157, GPU Mali-G57): la Aldea se jugó entera con los controles táctiles, con los
6 hitos (repisas, mercado, puente cosido, cruzar, casa, puerta). 87 FPS de media, p95 11,3 ms, 4 cuadros > 33 ms de
6549, 62 MB de memoria. Una caída al vacío (a los 23 s) sin consecuencias. Los niveles 1-2 a 1-5 aún no se han jugado
enteros en el teléfono.

## Sin comprobar todavía
| Qué | Por qué | Cómo comprobarlo |
|---|---|---|
| Compilación del APK | Este entorno no tiene el SDK de Android ni acceso a los repositorios de Google. El proyecto está generado pero **no compilado**. | Android Studio → abrir `app_android/android` → *Build › Build APK(s)*. |
| Sonido en el teléfono | Los efectos se sintetizan en el navegador (Web Audio); en escritorio funcionan, en el teléfono no se ha escuchado. | Al jugar en el teléfono. |

## Funciones que existen en pantalla pero NO están programadas
Ya estaban así en el proyecto; se dejan como están (no se han inventado mecánicas):

| Función | Qué pasa hoy |
|---|---|
| Capítulos II a V del mapa | Sin niveles. Al tocarlos: compra de prueba y luego «llegará en una actualización». |
| Combate y criaturas | La aguja hace su animación pero no hay enemigos. Los corazones nunca bajan (no hay daño). |
| Pociones | El hueco de la barra rápida explica que llegarán con el combate. |
| Galería | Aviso «llegará pronto». |
| Guardar en la nube | Aviso «llegará pronto». |
| Música y voces | No hay música ni voces; solo efectos. Los deslizadores «Música» y «Voces» se guardan pero no cambian nada. |
| Pestañas Controles, Gráficos e Idioma de Opciones | Solo muestran un aviso informativo. Solo español. |
| Compras reales (Google Play Billing) y anuncios reales (AdMob) | En **modo prueba**: «Cielo completo» se desbloquea sin cobrar y el anuncio es una pantalla de 5 s. Conectarlos exige cuenta de Google Play Console (ver notas al final de `index.html`). |
| Elegir nivel en el mapa | El capítulo I abre siempre el siguiente nivel pendiente; con los dos terminados abre la Aldea (a 1-2 se llega desde «Siguiente nivel»). |

## Decisiones pendientes (no son errores)
- **Icono de la app**: usa el icono por defecto de Capacitor. Hace falta un icono de Costuras del Cielo (512 × 512).
- **Nombre del paquete** `com.estrellaerrante.costurasdelcielo`: cambiarlo antes de publicar si quieres otro (en `app_android/capacitor.config.json` y en Android Studio).
- Arbolito provisional dibujado por código en G3, delante de la esquina de la casa (parte del mapa original).
- Decoración extraída y aprobada que no está colocada (árbol dorado, árbol azul, pino, pozo, banco, banderines…).
- Tablones B y C dañados (no hechos; sus repisas empiezan reparadas).
- Arte provisional de los lotes 1–3 marcado como PROVISIONAL en `assets/REGISTRO_ASSETS.md` (no se usa en los niveles actuales).
- Islas del nivel 1-2 en cartón: hay piezas de isla pequeña de cartón (lote 1: 136, 144, 148 y 188 px), pero solo en estado normal; faltan sus versiones dañada y reparada.
- Personajes (v1.0.6): Lumi usa ya la lámina pintada con **animación unificada** (quieta 6, caminar 8, saltar 3, coser 4,
  aguja 3, en las 5 capuchas, misma escala, mismo pie y mismo eje) y Nube anima sus 6 cuadros de vuelo. **Tilo sigue
  provisional** (pixel art) hasta tener su lámina pintada. Sin usar todavía: Nube «seguir», «girar», «reaccionar»,
  «descansar» y los retratos de emociones (no hay momentos del juego que los pidan aún).
- Los colores de los carretes de la mochila de Lumi cambian un poco entre cuadros (vienen así en la lámina).
- Integración en el proyecto principal `costuras/`: no se ha tocado. Esta carpeta es la versión jugable completa.

## Pendientes al pasar a 1.0.0 (26/11/2026)
- Personajes nuevos: falta decidir el nombre del tercero (choca con «Nube», la que da los consejos), meter a Brisa y
  decidir cómo se consiguen (cristales o completando algo). El Taller de Nube está lleno: pasarlo a varias páginas.
- Letras pintadas en las imágenes (portada, mapa, galería, Opciones) siguen en español en inglés y portugués.
  En Opciones se tapan con un parche provisional.
- Mapa del Capítulo I: «Recompensas» y «Misiones» todavía dicen «¡muy pronto!».
- Fondos propios para los niveles nuevos (ahora usan los de cielo, bosque o torre).
- Arte opcional: piezas de tubo rectas (1-8), sábanas (1-3), fondo de noche (1-6), el «!» de novedades de la Galería.
- Prueba inestable: el bot del 1-3 a veces falla «tablón que se descose 3» y pasa al repetir (es del bot, no del juego).
