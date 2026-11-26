# Costuras del Cielo

Juego de plataformas y acertijos en un mundo de papel y tela, vertical, para Android.
**Estrella Errante Games** · Phaser 3.80.1 · app Android con Capacitor · versión 1.0.0.

Todo el arte es de Yesli (Estrella Errante Games). El código es un solo `index.html`.

## Carpetas
| Carpeta | Qué hay |
|---|---|
| `index.html` | el juego completo |
| `index_prueba_android.html` | el mismo juego + panel de medición para probar en el teléfono |
| `assets/` | imágenes del juego ya preparadas (y `menus/titulo_video.mp4`, la portada) |
| `herramientas/` | scripts que preparan el arte de Yesli (quitar el magenta, recortar…), las pruebas automáticas (`pruebas/`) y los originales (`*/fuentes/`) |
| `herramientas/idiomas/` | `traducciones.tsv` (español · inglés · portugués) y `aplicar_idiomas.py` |
| `maestros/` | arte original de Yesli a tamaño completo |
| `lib/` | Phaser |
| `app_android/` | proyecto Android (Capacitor) |

## Después de clonar (o de cambiar imágenes)
El paquete de imágenes es grande (≈ 63 MB) y no va en git: se genera.
```
python3 herramientas/empaquetar_assets.py          # crea assets/paquete_assets.js
```
Luego se puede abrir `index.html` con doble clic (el video de la portada solo se ve desde un servidor o en la app).

## Cambiar textos o traducciones
Editar `herramientas/idiomas/traducciones.tsv` (una línea por texto: español, inglés y portugués separados por TAB) y correr
```
python3 herramientas/idiomas/aplicar_idiomas.py
```

## App Android
```
cd app_android
npm install
npm run sync        # copia el juego a la app
npm run abrir       # abre Android Studio para compilar / firmar
```
Versión en `app_android/android/app/build.gradle`: `versionName` (la que ven los jugadores) y `versionCode`
(número interno: **subirlo en cada envío a la Play Store**).

## Pruebas automáticas
```
node herramientas/pruebas/recorrido_completo.js lib/phaser.min.js "$PWD" /tmp/salida
```
(una por nivel: `nivel_tendederos.js`, `nivel_arroyo.js`… y `menus_y_controles.js`, `emocion.js`, `calidad_auto.js`).
