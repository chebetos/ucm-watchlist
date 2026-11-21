# MCU & Multiverse — Unofficial Watchlist Tracker

> [Leer en español](./README.es.md) · [Requirements History (Gherkin)](./docs/REQUIREMENTS.md)

A non-profit, fan-made static web app (PWA) to track movies, TV series, specials, and canon comics across the Marvel Cinematic Universe and the Multiverse.

Includes **124 titles**, **50 seasons**, and **543 episodes** with original synopses in English and Spanish **100% offline**.

---

## Key Features

- **Bilingual UI (`EN` / `ES`):** instant language toggle in the header with browser language auto-detection and 100% offline translations (UI, legal notice, all 124 catalog synopses, and all 543 episode synopses).
- **Dual Watch Order:** switch instantly between **Release Order** and **Chronological Order (by Year)**.
- **Flexible Grouping:** organize by _Sagas, Phases & Eras (Interleaved)_, _Separate Official Phase / Era_, or _Continuous List_, with collapsible blocks and per-phase progress.
- **Doomsday Essential Route:** quick filter highlighting the essential titles to prepare for _Avengers: Doomsday_.
- **Target-Date Marathon Planner:** calculates pending hours, required daily and weekly pace, and the next recommended title based on your selected scope.
- **Episode-by-Episode Tracking with Offline Reviews:** all 543 episodes include synopses expanded by default, collapsible independently from the watched switch.
- **Personal Ratings & Notes:** 1-to-5 star ratings and private notes per title.
- **100% Local & Portable (PWA):**
  - Progress saved automatically in `localStorage`.
  - Export and import via `.JSON` file or quick sync code with a SemVer-versioned JSON Schema (`schemas/progress.schema.json`), never including private OMDb API keys.
  - Installable as a Progressive Web App (Web App Manifest + Service Worker).
- **Above-the-Fold Responsive Layout:** on mobile and compact viewports, the marathon planner and advanced filters start collapsed so the first catalog block is immediately visible without scrolling.

---

## Privacy (GDPR / LSSI-CE)

- **Zero External Requests by Default:** typography (`@fontsource-variable/inter`) and icons (`@fortawesome/fontawesome-free`) are bundled locally. No CDNs, analytics, or tracking cookies are loaded.
- **Strictly Opt-In External Artwork:** queries to external APIs (**TVmaze**, **Wikipedia**, **Open Library**, and optional **OMDb**) remain disabled by default; they are only enabled if the user manually opts in under _IMDb / TV Posters_.

---

## Tech Stack & Project Structure

- **Runtime, Bundler, Formatter, Typechecker & Test Runner:** [Bun](https://bun.sh/) (`bun fmt`, `bun check`, `bun test`, `Bun.build`)
- **Linting:** [Oxlint](https://oxc.rs/) (Oxc)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (`bun-plugin-tailwind`)
- **Git Hooks & Releases:** [Lefthook](https://lefthook.dev/), `commitlint` (Conventional Commits), and `semantic-release`
- **Hosting:** Cloudflare Workers Static Assets (`wrangler.jsonc` + Workers Builds)

```text
.
├── build.ts                     # Production build with Bun + Tailwind v4
├── preview.ts                   # Local static server to preview ./dist
├── wrangler.jsonc               # Cloudflare Workers Static Assets configuration
├── schemas/
│   └── progress.schema.json     # SemVer-versioned JSON Schema for backups
├── public/
│   ├── _headers                 # HTTP security (CSP, HSTS) and caching headers
│   ├── .assetsignore            # Upload exclusions (*.map, .DS_Store)
│   ├── icon.svg                 # PWA icon
│   ├── manifest.webmanifest     # PWA manifest
│   └── sw.js                    # Service Worker
├── src/
│   ├── index.html               # Semantic markup and accessible modals
│   ├── styles.css               # Tailwind v4 + locally bundled fonts and icons
│   ├── i18n.js                  # EN / ES dictionary and language management
│   ├── main.js                  # State, events, filters, and UI coordination
│   ├── ui.js                    # XSS-safe rendering for catalog and modals
│   ├── logic.js                 # Progress calculations, filtering, and planner
│   ├── store.js                 # Local persistence, SemVer checks, and export/import
│   ├── mediaApi.js              # Opt-in integration with TVmaze, Wikipedia, Open Library, and OMDb
│   ├── pwa.js                   # Service Worker registration and PWA installation
│   ├── utils.js                 # Utilities (escapeHtml, sanitizeImageUrl, debounce, clipboard)
│   ├── catalog.js               # Master catalog (124 entries / 50 seasons / 543 episodes)
│   └── data/
│       ├── catalogEn.js         # Lazy-loaded English catalog synopses
│       └── episodes/            # Offline ES & EN episode synopses (lazy-loaded)
└── tests/                       # Unit test suite (bun test)
```

---

## Local Development

Requirements: [Bun](https://bun.sh/) `>= 1.4.5`.

```bash
# Install dependencies and Git hooks (lefthook)
bun install

# Start dev server with hot reload
bun run dev

# Format, lint (oxlint), and typecheck (bun check)
bun run format
bun run verify

# Run unit tests
bun test

# Build production bundle into ./dist (without sourcemaps)
bun run build

# Preview ./dist at http://localhost:4173
bun run preview
```

To emit sourcemaps on demand locally:

```bash
SOURCEMAP=1 bun run build
```

---

## Deployment on Cloudflare Workers Builds

This repository is configured for **Cloudflare Workers + Static Assets** (assets-only Worker, no server script):

- **Build command:** `bun run build`
- **Deploy command:** `npx wrangler deploy`
- **Production branch:** `main`
- **Output directory:** `./dist` (configured in `wrangler.jsonc`)

---

## Legal Notice & Intellectual Property

This is a **personal, fan-made, unofficial, non-profit project**. It is not affiliated with, sponsored by, or authorized by **The Walt Disney Company**, **Marvel Characters, Inc.**, **Marvel Studios**, **Sony Pictures Entertainment**, or **20th Century Studios**. All characters, titles, and trademarks belong to their respective owners. This application does not host or distribute any copyrighted audiovisual content.

### Third-Party Licenses

- **Inter (`@fontsource-variable/inter`):** SIL OFL 1.1.
- **Font Awesome Free (`@fortawesome/fontawesome-free`):** CC BY 4.0 / SIL OFL / MIT.
- **TVmaze API & Wikipedia REST API (opt-in):** CC BY-SA 4.0.

---

## License

Distributed under the **Apache License 2.0**. See [LICENSE](./LICENSE) for more details.
