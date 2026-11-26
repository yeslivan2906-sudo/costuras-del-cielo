// Copia a www/ SOLO lo que la app necesita: index.html, Phaser local y el paquete de imágenes (las imágenes van
// dentro de paquete_assets.js). Correr después de cualquier cambio en el juego: npm run sync
const fs = require('fs'), path = require('path');
const J = path.join(__dirname, '..'), W = path.join(__dirname, 'www');
fs.rmSync(W, { recursive: true, force: true });
for (const f of ['index.html', 'lib/phaser.min.js', 'lib/PHASER_LICENSE.md', 'assets/paquete_assets.js', 'assets/menus/titulo_video.mp4']) {   // el video de la portada va aparte (no cabe en el paquete)
  fs.mkdirSync(path.dirname(path.join(W, f)), { recursive: true }); fs.copyFileSync(path.join(J, f), path.join(W, f));
}
console.log('www/ listo:', fs.readdirSync(W, { recursive: true }).join(', '));
