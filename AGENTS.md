# Reglas del Proyecto — UCM Watchlist

## Stack, Build y Despliegue (Cloudflare Workers)

- **Toolchain:** Bun (`bun run build`, `bun test`, `bun run preview`) + Tailwind CSS v4 (`bun-plugin-tailwind`).
- **Despliegue:** Cloudflare Workers Static Assets (`wrangler.jsonc` con `assets.directory: "./dist"`, sin `main`) mediante Workers Builds desde `main`.
- **Rutas PWA en `build.ts`:** mantener `href="/manifest.webmanifest"` y `href="/icon.svg"` en `src/index.html` (el bundler HTML de Bun falla con rutas `./` en `src/`) y conservar la reescritura post-build a `./` en `dist/index.html`.
- **Producción sin sourcemaps:** `bun run build` debe generar `sourcemap: 'none'` por defecto (`SOURCEMAP=1` solo bajo demanda) y mantener `public/_headers` y `public/.assetsignore`.

## Privacidad (RGPD / LSSI-CE) y Propiedad Intelectual

- **Cero peticiones externas por defecto:** fuentes (`@fontsource-variable/inter`) e iconos (`@fortawesome/fontawesome-free`) deben mantenerse empaquetados localmente. No añadir CDNs ni Google Fonts.
- **APIs externas estrictamente opt-in:** TVMaze, Wikipedia, Open Library y OMDb deben permanecer desactivadas por defecto (`EXTERNAL_MEDIA_STORAGE_KEY`). No descargar ni redistribuir pósters con copyright dentro de `dist/`.
- **Branding neutral y atribución:** no usar logotipos oficiales de Marvel/Disney; mantener el aviso legal en `#legalModal` actualizado si cambia el proveedor de alojamiento o APIs.

## Catálogo y Sinopsis de Episodios

- **Cobertura 100 % offline:** cada episodio añadido a `src/catalog.js` debe tener una sinopsis original en español en el módulo correspondiente de `src/data/episodes/` (`disneyPlus.js`, `netflix.js`, `abc.js`, `hulu.js`). Si una serie aún no está estrenada, indicar honestamente que la trama oficial está pendiente de confirmación.
- **UX de episodios en `#detailModal`:** las reseñas de episodios deben mostrarse **abiertas por defecto** (`aria-expanded="true"`) y su botón desplegable debe ser independiente del switch `role="switch"` de episodio visto.

## UI, Iconos y Responsive

- **Solo Font Awesome Free 6:** no usar iconos exclusivos de Font Awesome Pro (p. ej. `fa-cloud-check`), ya que renderizan huecos vacíos.
- **Prioridad al catálogo _above the fold_:** en viewports compactos (`max-width: 1023px` o `max-height: 780px`), `#plannerSection` y `#filtersCollapsibleBody` deben arrancar colapsados para que el primer bloque del catálogo sea visible sin scroll.
- **Prevención de desbordamiento horizontal:** mantener `html, body { overflow-x: clip; max-width: 100%; }`, usar `min-w-0` en contenedores flex/grid con texto, `whitespace-nowrap shrink-0` en pills de estado (`#syncBadge`), y conservar `shrink-0` en `.cat-pill` cuando se actualice `className` dinámicamente en `src/main.js`.

## Esquema de Progreso y Semantic Versioning (SemVer)

- **Fuente de verdad:** el formato de exportación/importación (archivo `.JSON` y código rápido) está definido en `schemas/progress.schema.json` y sincronizado con `PROGRESS_SCHEMA_VERSION` en `src/store.js`. Ambos valores deben coincidir siempre (validado por `tests/store.test.js`).
- **Evolución estricta con SemVer (`MAJOR.MINOR.PATCH`):** cualquier cambio en el esquema debe incrementar la versión según su compatibilidad:
  - **MAJOR (`X.0.0`):** cambios incompatibles (_breaking changes_: renombrar o eliminar campos, cambiar tipos existentes o alterar la semántica de claves). Al importar, versiones con `MAJOR` distinto se rechazan automáticamente.
  - **MINOR (`1.Y.0`):** incorporación de campos opcionales retrocompatibles (los backups con el mismo `MAJOR` siguen siendo importables).
  - **PATCH (`1.0.Z`):** ajustes de documentación, descripciones o aclaraciones del esquema que no afectan a la compatibilidad de payloads existentes.

## Flujo de Trabajo y Git

- Introducir todos los cambios mediante ramas dedicadas y Pull Requests hacia `main` (no hacer commits ni `push` directamente sobre `main`).
- Ejecutar siempre `bun test` y `bun run build` antes de commitear cambios.
- Verificar que `git config user.email` en este repo personal usa el correo personal (no corporativo).
- No ejecutar `git push` sin confirmación explícita del usuario.
