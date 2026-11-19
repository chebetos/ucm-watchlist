import { existsSync } from 'node:fs';
import { join, normalize } from 'node:path';

const DIST_DIR = join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 4173);

if (!existsSync(DIST_DIR)) {
  console.error('La carpeta dist/ no existe. Ejecuta primero "bun run build".');
  process.exit(1);
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let reqPath = decodeURIComponent(url.pathname);
    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    }

    const safePath = normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = join(DIST_DIR, safePath);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Preview server corriendo en http://localhost:${server.port}`);
