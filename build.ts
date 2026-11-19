import { rm, cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import tailwind from 'bun-plugin-tailwind';

const DIST_DIR = './dist';
const PUBLIC_DIR = './public';

async function build() {
  if (existsSync(DIST_DIR)) {
    await rm(DIST_DIR, { recursive: true, force: true });
  }
  await mkdir(DIST_DIR, { recursive: true });

  const result = await Bun.build({
    entrypoints: ['./src/index.html'],
    outdir: DIST_DIR,
    minify: true,
    sourcemap: 'linked',
    external: ['./manifest.webmanifest', './icon.svg', '/manifest.webmanifest', '/icon.svg'],
    plugins: [tailwind],
  });

  if (!result.success) {
    console.error('Error durante el build:');
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  if (existsSync(PUBLIC_DIR)) {
    await cp(PUBLIC_DIR, DIST_DIR, { recursive: true });
  }

  console.log(`Build completado (${result.outputs.length} artefactos en ${DIST_DIR})`);
}

build();
