# UCM & Multiverso — Checklist No Oficial

Aplicación web estática (PWA) y sin ánimo de lucro para llevar el seguimiento completo de películas, series, especiales y cómics canon del Universo Cinematográfico de Marvel y el Multiverso.

Incluye **124 títulos**, **50 temporadas** y **543 episodios** con reseñas/sinopsis originales en español **100 % offline**.

---

## Características principales

- **Doble orden de visionado:** alterna al instante entre **Orden de Publicación** y **Orden Cronológico por Año**.
- **Agrupación flexible:** organiza por _Sagas, Fases y Eras (intercalado)_, _Por Fase / Era separada_ o _Lista continua_, con bloques plegables y progreso por fase.
- **Ruta Esencial Doomsday:** filtro rápido con los títulos imprescindibles para llegar preparado a _Avengers: Doomsday_.
- **Planificador de maratón por fecha objetivo:** calcula horas pendientes, ritmo diario y semanal, y el próximo título recomendado según el alcance elegido.
- **Seguimiento episodio a episodio con reseñas offline:** los 543 capítulos cuentan con sinopsis en español abiertas por defecto, desplegables de forma independiente al switch de visto.
- **Valoraciones y notas personales:** puntuación de 1 a 5 estrellas y notas privadas por título.
- **100 % local y portable (PWA):**
  - Progreso guardado automáticamente en `localStorage`.
  - Exportación e importación mediante archivo `.JSON` o código rápido (sin incluir claves privadas de OMDb).
  - Instalable como aplicación (Web App Manifest + Service Worker).
- **Diseño responsive _above the fold_:** en móviles y pantallas compactas, el planificador y los filtros avanzados arrancan colapsados para mostrar el primer bloque del catálogo nada más abrir la web.

---

## Privacidad (RGPD / LSSI-CE)

- **Cero peticiones externas por defecto:** la tipografía (`@fontsource-variable/inter`) y los iconos (`@fortawesome/fontawesome-free`) están empaquetados localmente. No se cargan CDNs ni herramientas de analítica ni cookies de seguimiento.
- **Portadas externas estrictamente _opt-in_:** la consulta a APIs externas (**TVmaze**, **Wikipedia**, **Open Library** y **OMDb** opcional) permanece desactivada por defecto; solo se activa si el usuario la habilita manualmente desde _Portadas IMDb / TV_.

---

## Stack técnico y estructura

- **Runtime & Bundler:** [Bun](https://bun.sh/) (`Bun.build` + `bun test`)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) (`bun-plugin-tailwind`)
- **Alojamiento:** Cloudflare Workers Static Assets (`wrangler.jsonc` + Workers Builds)

```text
.
├── build.ts                     # Build de producción con Bun + Tailwind v4
├── preview.ts                   # Servidor estático local para previsualizar ./dist
├── wrangler.jsonc               # Configuración de Cloudflare Workers Static Assets
├── public/
│   ├── _headers                 # Cabeceras HTTP de seguridad y caché
│   ├── .assetsignore            # Exclusiones de subida (*.map, .DS_Store)
│   ├── icon.svg                 # Icono PWA
│   ├── manifest.webmanifest     # Manifiesto PWA
│   └── sw.js                    # Service Worker
├── src/
│   ├── index.html               # Marcado semántico y modales accesibles
│   ├── styles.css               # Tailwind v4 + fuentes e iconos locales
│   ├── main.js                  # Estado, eventos, filtros y coordinación de UI
│   ├── ui.js                    # Renderizado seguro (XSS-safe) de catálogo y modales
│   ├── logic.js                 # Cálculos de progreso, filtros y planificador
│   ├── store.js                 # Persistencia local, validación y exportación/importación
│   ├── mediaApi.js              # Integración opt-in con TVmaze, Wikipedia, Open Library y OMDb
│   ├── pwa.js                   # Registro del Service Worker e instalación PWA
│   ├── utils.js                 # Utilidades (escapeHtml, sanitizeImageUrl, debounce, clipboard)
│   ├── catalog.js               # Catálogo maestro (124 entradas / 50 temporadas / 543 episodios)
│   └── data/episodes/           # Sinopsis originales en español (100 % offline)
│       ├── index.js             # Cargador modular por plataforma
│       ├── disneyPlus.js
│       ├── netflix.js
│       ├── abc.js
│       └── hulu.js
└── tests/                       # Suite de pruebas unitarias (bun test)
```

---

## Desarrollo local

Requisitos: [Bun](https://bun.sh/) `>= 1.4`.

```bash
# Instalar dependencias
bun install

# Desarrollo con recarga en caliente
bun run dev

# Ejecutar tests unitarios (incluye cobertura 543/543 de sinopsis)
bun test

# Compilar build de producción en ./dist (sin sourcemaps)
bun run build

# Previsualizar ./dist en http://localhost:4173
bun run preview
```

Para generar sourcemaps puntualmente en local:

```bash
SOURCEMAP=1 bun run build
```

---

## Despliegue en Cloudflare Workers Builds

El repositorio está preparado para **Cloudflare Workers + Static Assets** (_assets-only Worker_, sin script de servidor):

- **Build command:** `bun run build`
- **Deploy command:** `npx wrangler deploy`
- **Production branch:** `main`
- **Directorio de salida:** `./dist` (configurado en `wrangler.jsonc`)

---

## Aviso legal y propiedad intelectual

Este es un **proyecto personal, fan, no oficial y sin ánimo de lucro**. No está afiliado, patrocinado ni autorizado por **The Walt Disney Company**, **Marvel Characters, Inc.**, **Marvel Studios**, **Sony Pictures Entertainment** ni **20th Century Studios**. Todos los personajes, títulos y marcas pertenecen a sus respectivos titulares. Esta aplicación no aloja ni distribuye material audiovisual protegido.

### Licencias de terceros

- **Inter (`@fontsource-variable/inter`):** SIL OFL 1.1.
- **Font Awesome Free (`@fortawesome/fontawesome-free`):** CC BY 4.0 / SIL OFL / MIT.
- **TVmaze API & Wikipedia REST API (opt-in):** CC BY-SA 4.0.

---

## Licencia

Distribuido bajo la licencia **Apache License 2.0**. Consulta el archivo [LICENSE](./LICENSE) para más detalles.
