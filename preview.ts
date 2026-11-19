import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const DIST_DIR = resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 4173);

if (!existsSync(DIST_DIR)) {
  console.error('La carpeta dist/ no existe. Ejecuta primero "bun run build".');
  process.exit(1);
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let reqPath: string;
    try {
      reqPath = decodeURIComponent(url.pathname);
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    if (reqPath === '/' || reqPath === '') {
      reqPath = '/index.html';
    }

    const filePath = resolve(DIST_DIR, `.${reqPath}`);
    if (filePath !== DIST_DIR && !filePath.startsWith(DIST_DIR + sep)) {
      return new Response('Forbidden', { status: 403 });
    }

    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`Preview server corriendo en http://localhost:${server.port}`);
