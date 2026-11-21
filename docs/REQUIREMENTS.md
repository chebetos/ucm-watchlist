# Requirements History — MCU & Multiverse Watchlist

## Project Origin & Evolution

**MCU & Multiverse Watchlist** was born on **2026-11-19** (`8274156`) as a single monolithic 4,767-line `index.html` file (_MCU & Multiverse Master Tracker_) using CDN-hosted Tailwind CSS, Font Awesome, and Google Fonts to track 124 Marvel titles across movies, TV series, specials, and canon comics.

Over subsequent iterations, the project evolved into a modular, privacy-first, bilingual (ES/EN), 100% offline Progressive Web App deployed on **Cloudflare Workers Static Assets**, with automated formatting/linting/typechecking/testing (`bun fmt`, `oxlint`, `bun check`, `bun test`, `lefthook`, `semantic-release`), a SemVer-versioned JSON Schema for user progress, compressed client-side deeplinks, friend progress comparison, and hardened security & keyboard accessibility.

---

## Governance & Append-Only Policy

1. **Append-Only History:** Existing requirements (`FR-*` and `NFR-*`) are **never deleted or rewritten** when behavior changes.
2. **Updating Existing Behavior:** When a feature evolves or supersedes an earlier decision, append a **new requirement** referencing the previous one via `Updates: <REQ-ID>`, and mark the original requirement's status as `Updated by <NEW-ID>`.
3. **Branch Gate:** Every feature or non-functional change must add its requirement(s) here before the branch/PR is closed or merged (enforced in `AGENTS.md`).

---

## Functional Requirements (FR)

### FR-001 — Master MCU & Multiverse Catalog

- **Introduced:** 2026-11-19 (`8274156`)
- **Status:** Active
- **User Story:** As a Marvel fan, I want a unified catalog of 124 movies, Disney+/Netflix/ABC/Hulu series, Fox/Sony Multiverse legacy titles, specials, and canon comics so that I can browse the complete universe in one place.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Display complete catalog with unique entries
    Given the application loads the offline catalog
    Then at least 124 unique titles are available across movies, TV series, specials, and canon comics
    And each title displays its title, release year, category badge, phase/era, runtime, and synopsis
  ```

### FR-002 — Dual Watch Order, Grouping, Filtering & Doomsday Essential Route

- **Introduced:** 2026-11-19 (`8274156`)
- **Status:** Active
- **User Story:** As a viewer planning a rewatch, I want to switch between Release Order and Chronological Order, group titles by saga/phase, search/filter by category, phase, or status, and toggle the _Doomsday Essential Route_ so that I can follow my preferred viewing path.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Switch between release and chronological order
    Given the catalog is displayed in Release Order
    When the user selects Chronological Order
    Then the catalog re-sorts all visible titles by their chronological timeline order

  Scenario: Filter by Doomsday Essential Route and search query
    Given the user enables the "Doomsday Essential Route" filter and types a title keyword
    Then only matching essential titles are rendered in the catalog grid
    And if no titles match, an empty state with a "Reset filters" button is shown
  ```

### FR-003 — Local Watch Progress, Episode Checklist, Ratings & Personal Notes

- **Introduced:** 2026-11-19 (`8274156`)
- **Status:** Active
- **User Story:** As a viewer, I want to mark movies, entire seasons, phase blocks, or individual episodes as watched, rate titles from 1 to 5 stars, and save personal notes locally so that my progress persists automatically across sessions without creating an account.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Track series progress episode by episode
    Given a user opens the detail modal for a multi-episode series
    When the user toggles individual episodes as watched
    Then the series status transitions from pending to in progress and to completed once all episodes are watched
    And progress is persisted automatically to localStorage

  Scenario: Save personal rating and note
    Given a user opens a title's detail modal
    When the user selects a 1-to-5 star rating and saves a personal note
    Then the rating and note are persisted locally and shown when reopening the title
  ```

### FR-004 — Target-Date Marathon Planner

- **Introduced:** 2026-11-19 (`8274156`)
- **Status:** Active
- **User Story:** As a viewer preparing for an upcoming premiere, I want a marathon planner that computes pending hours, required daily/weekly pace, and the next recommended title based on a target date and scope so that I can finish on time.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Calculate daily and weekly pace from target date
    Given the user has unwatched titles and sets a future target date
    When the planner computes the schedule for the selected scope (filtered, Doomsday, or full catalog)
    Then it displays days remaining, pending hours, daily minutes, weekly hours, and the next recommended unwatched title
  ```

### FR-005 — Offline PWA & Portable Sync via Quick Code and JSON Backup

- **Introduced:** 2026-11-19 (`8274156`)
- **Status:** Updated by `FR-010`, `FR-014`
- **User Story:** As a multi-device user, I want to install the app as a PWA and export/import my progress via a copy-paste quick code or `.JSON` file so that I can back up or move my watchlist without a backend server.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Export and restore progress via quick code or JSON
    Given a user has marked titles as watched
    When the user exports a quick code or downloads a .JSON backup and imports it on another browser
    Then the watched items, episodes, ratings, notes, and target date are restored accurately
  ```

### FR-006 — Legal/Privacy Notice & Opt-In External Artwork APIs

- **Introduced:** 2026-11-19 (`b9f907d`)
- **Status:** Active
- **User Story:** As a privacy-conscious visitor, I want transparent legal/GDPR/LSSI-CE disclosures and external poster APIs (TVMaze, Wikipedia, Open Library, OMDb) disabled by default so that no third-party service receives my IP address unless I explicitly opt in.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Zero external requests until explicit opt-in
    Given a user opens the app with default settings
    Then stylized local posters are rendered and zero requests are made to TVMaze, Wikipedia, Open Library, or OMDb
    And the Legal, Privacy & Credits modal documents all localStorage keys and non-affiliation disclaimers

  Scenario: Enable optional external artwork
    Given the user opens the IMDb / TV Posters modal
    When the user toggles external artwork loading on
    Then the preference is saved in localStorage and external artwork requests are permitted
  ```

### FR-007 — Offline Spanish Synopses for All 543 Episodes

- **Introduced:** 2026-11-19 (`c98b4e7`)
- **Status:** Updated by `FR-009`, `FR-011`
- **User Story:** As a viewer catching up on TV series, I want original offline Spanish synopses for every one of the 543 episodes lazy-loaded by platform so that I can remember each episode's plot without external API calls.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Display offline episode synopses on demand
    Given a user opens the detail modal of any catalog series
    Then the platform's episode synopsis module is lazy-loaded locally
    And every episode in that series has a non-empty synopsis available offline
  ```

### FR-008 — Compact-Viewport Above-the-Fold Catalog Priority

- **Introduced:** 2026-11-19 (`7895b09`)
- **Status:** Active
- **User Story:** When opening the app on a phone or compact laptop screen, I want the marathon planner and advanced filters to start collapsed so that the first catalog block is immediately visible above the fold without scrolling.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Collapse planner and advanced filters on compact viewports
    Given the viewport matches max-width 1023px or max-height 780px
    When the page initializes
    Then the marathon planner panel and collapsible filters body start collapsed
    And the search bar, filter toggle button, and first catalog section are visible above the fold
  ```

### FR-009 — Episode Synopses Expanded by Default with Independent Toggle

- **Introduced:** 2026-11-19 (`7895b09`)
- **Updates:** `FR-007`
- **Status:** Active
- **User Story:** As a viewer reading episode guides in `#detailModal`, I want episode synopses to be expanded by default and collapsible independently from the watched switch so that I can read reviews immediately without accidentally toggling watched state.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Episode synopses open by default and toggle independently
    Given a user opens a series detail modal
    Then each episode's synopsis panel is visible with aria-expanded="true"
    When the user clicks the episode review toggle button
    Then only the synopsis visibility toggles and the episode's watched switch state remains unchanged
  ```

### FR-010 — SemVer-Versioned Progress JSON Schema (`v1.0.0`)

- **Introduced:** 2026-11-20 (`06653f0`, PR #4 / PR #2)
- **Updates:** `FR-005`
- **Status:** Updated by `FR-014`
- **User Story:** As a long-term user restoring old backups, I want exported JSON files and quick codes to follow a formal SemVer-versioned JSON Schema so that backward-compatible backups import cleanly while incompatible major versions are rejected safely.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Import compatible or legacy backups and reject incompatible MAJOR versions
    Given a progress payload is imported
    When its schemaVersion has the same MAJOR version or is omitted (legacy)
    Then the payload is accepted and normalized to the current schema
    When its schemaVersion has a different MAJOR version or invalid SemVer format
    Then the import is rejected with an explanatory error message
  ```

### FR-011 — Full Offline Bilingual Support (Spanish / English) & Bilingual READMEs

- **Introduced:** 2026-11-20 (`d264904`, PR #3)
- **Updates:** `FR-007`
- **Status:** Updated by `FR-012`
- **User Story:** As an English- or Spanish-speaking user, I want to switch the entire app (UI, modals, legal notice, 124 catalog synopses, and 543 episode synopses) between Spanish and English offline with browser language auto-detection and persisted preference, alongside English (`README.md`) and Spanish (`README.es.md`) documentation.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Instant live ES/EN language switch with persistence
    Given the app is displaying Spanish
    When the user activates the language toggle
    Then html[lang], document.title, all static/dynamic UI, modals, catalog synopses, and episode synopses update immediately to English without external requests
    And the selected language is stored under mcu_multiverse_lang_v1 (documented in #legalModal)
  ```

### FR-012 — Enlarged Language Toggle Positioned Beside Progress Box

- **Introduced:** 2026-11-20 (`dd1aa4f`, PR #3)
- **Updates:** `FR-011`
- **Status:** Updated by `FR-013`
- **User Story:** As a user scanning the header, I want the language toggle to be larger and positioned at the top-right immediately beside the `"0 / 124"` progress box so that it is easy to spot and tap on both desktop and mobile.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Language toggle aligned beside progress box
    Given the header renders on desktop or mobile
    Then the language toggle sits immediately to the right of the progress summary card with matching height and zero horizontal overflow
  ```

### FR-013 — Sliding Pill Switch (`ES / EN`) & Untruncated Desktop Header Title

- **Introduced:** 2026-11-20 (`5bd44f8`, `7323050`, PR #3)
- **Updates:** `FR-012`
- **Status:** Active
- **User Story:** As a user, I want the language toggle to look and behave like an accessible sliding pill switch with `ES` and `EN` labels inside the switch track, and I want the full app title to remain untruncated on desktop screens.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Accessible sliding pill switch toggles ES/EN
    Given the language switch renders with role="switch"
    When the user clicks the switch
    Then aria-checked updates accordingly and the sliding thumb animates between ES and EN inside the pill track

  Scenario: Full header title visible on desktop
    Given the viewport width is at least 1024px (lg)
    Then the header brand block does not shrink and displays the full title in both ES and EN without ellipsis truncation
  ```

### FR-014 — Compressed Shareable Deeplinks, Optional Nick, UTC Timestamp & Schema `v1.1.0`

- **Introduced:** 2026-11-21 (`60865ef`, PR #6)
- **Updates:** `FR-005`, `FR-010`
- **Status:** Active
- **User Story:** As a user sharing my watchlist with friends or another device, I want to export a compact `#sync=z1.<deflate-raw>` deeplink containing my optional nickname, UTC export timestamp, and an option to include or exclude personal notes, opening the installed PWA or web app without ever sending progress data to any server.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Generate compressed client-side deeplink with nick and UTC timestamp
    Given the user opens Export / Import, enters an optional nickname, and selects whether to include personal notes
    Then the app generates a v1.1.0 payload with nick and ISO-8601 UTC exportedAt compressed into a #sync=z1.<base64url> URL fragment
    And unchecking "Include personal notes" immediately invalidates any prior link and emits empty userNotes

  Scenario: Preserve nickname locally and across resets
    Given the user has saved a nickname in Export / Import
    When the user resets watch progress
    Then watched items, episodes, ratings, and notes are cleared while targetDate, nick, and OMDb key are preserved
  ```

### FR-015 — Incoming Deeplink Prompt & Read-Only Friend Comparison Modal

- **Introduced:** 2026-11-21 (`60865ef`, `c73869a`, PR #6)
- **Status:** Active
- **User Story:** When I open a friend's shared `#sync=...` link, I want the app to show who shared it and when (UTC), clear the URL fragment, and let me compare our progress side by side (including titles, episodes, hours watched, average ratings, and in-progress series counts) without modifying my own watchlist.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Open incoming deeplink and compare without mutating local progress
    Given a user navigates to a valid #sync=z1.<payload> URL
    Then the URL fragment is stripped via history.replaceState and #deeplinkModal displays the sender's nick, UTC export date, and progress summary
    When the user selects "Compare with my progress"
    Then #compareModal opens showing side-by-side stats and 4 filterable tabs (Both, Only friend, Only you, Unwatched by both) with episode counts for in-progress series
    And the user's local progress remains completely unchanged
  ```

### FR-016 — Two-Step Overwrite Confirmation Across All Import Paths

- **Introduced:** 2026-11-21 (`60865ef`, `c73869a`, PR #6)
- **Status:** Active
- **User Story:** When I choose to import progress from a deeplink, pasted quick code, or `.JSON` file, I want a dedicated confirmation modal showing a before/after summary diff before my local data is overwritten so that I never lose my watchlist by accident.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Require explicit second confirmation before overwriting local progress
    Given a user clicks "Import data" from #deeplinkModal, #compareModal, quick code import, or .JSON upload
    Then #confirmOverwriteModal opens displaying the current local summary versus the incoming summary (with sender nick and UTC timestamp)
    When the user confirms overwrite
    Then local progress is replaced while preserving the OMDb API key and language preference
    When the user cancels
    Then local progress remains untouched
  ```

---

## Non-Functional Requirements (NFR)

### NFR-001 — Modular Bun + Tailwind CSS v4 Architecture & Automated Unit Tests

- **Introduced:** 2026-11-19 (`d40e887`)
- **Status:** Active
- **Job Story:** When maintaining and extending the app, engineers need a clean modular ESM codebase built with Bun and Tailwind CSS v4 backed by fast unit tests (`bun test`) rather than a single monolithic HTML file.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Modular build and test suite execution
    Given the source modules under src/ and tests under tests/
    When "bun test" and "bun run build" are executed
    Then all unit tests pass and a self-contained production bundle is emitted to dist/
  ```

### NFR-002 — 100% Local Asset Bundling (Zero External CDNs)

- **Introduced:** 2026-11-19 (`d40e887`)
- **Status:** Active
- **Job Story:** When loading the application offline or under strict privacy constraints, all fonts (`@fontsource-variable/inter`) and icons (`@fortawesome/fontawesome-free`) must be bundled locally with zero external CDN dependencies.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: No external font or icon CDN requests on load
    Given the production build is served locally
    When the page loads in a browser
    Then all stylesheets, scripts, fonts, and icon assets are served from the app's own origin
  ```

### NFR-003 — Privacy-by-Default (GDPR / LSSI-CE) & Zero Analytics

- **Introduced:** 2026-11-19 (`b9f907d`)
- **Status:** Active
- **Job Story:** When publishing the app publicly on the internet, it must use zero tracking cookies or analytics, make zero external HTTP requests by default, and transparently document all strictly technical `localStorage` keys.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Strict zero-egress privacy posture by default
    Given a fresh browser session with default preferences
    When the user browses the catalog, filters items, and opens detail modals
    Then zero cookies are set and zero network requests leave the app's origin
  ```

### NFR-004 — Cloudflare Workers Static Assets Deployment & No Production Sourcemaps

- **Introduced:** 2026-11-19 (`cacde4b`)
- **Status:** Updated by `NFR-005`
- **Job Story:** When deploying to production via Cloudflare Workers Builds from `main`, static assets must be served from `./dist` with security headers (`public/_headers`), `.assetsignore`, PWA root-to-relative path rewriting in `build.ts`, and `sourcemap: 'none'` by default.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Production build omits sourcemaps and preserves Cloudflare assets
    Given "bun run build" runs without SOURCEMAP=1
    Then dist/ contains _headers, .assetsignore, rewritten ./manifest.webmanifest and ./icon.svg links, and zero .map files
  ```

### NFR-005 — Cloudflare Workers Previews Compatibility

- **Introduced:** 2026-11-20 (`0c2bc64`, PR #5)
- **Updates:** `NFR-004`
- **Status:** Active
- **Job Story:** When opening Pull Requests connected to Cloudflare Workers Builds, branch preview deployments (`npx wrangler preview`) must succeed without configuration errors.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Wrangler configuration includes previews block
    Given wrangler.jsonc is parsed by Wrangler CLI
    Then it defines a top-level "previews": {} block while keeping "assets" and "compatibility_date" at top level
  ```

### NFR-006 — Zero Horizontal Overflow & Font Awesome Free 6 Only

- **Introduced:** 2026-11-19 (`e2f10f2`)
- **Status:** Active
- **Job Story:** When using the app on narrow mobile viewports (e.g., `375x812`), layouts must never overflow horizontally and must use only Font Awesome Free 6 icons so no blank glyphs render.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: No horizontal overflow across mobile and desktop viewports
    Given the app is rendered at 375x812 and 1440x900 in either ES or EN
    Then document.documentElement.scrollWidth is less than or equal to window.innerWidth
    And all rendered icons belong to Font Awesome Free 6
  ```

### NFR-007 — Repository Governance, Licensing & Documentation

- **Introduced:** 2026-11-19 (`39e7f54`, `0c0f5c6`)
- **Status:** Active
- **Job Story:** When collaborating or onboarding AI agents and human contributors, the repository must provide clear project rules (`AGENTS.md`), documentation (`README.md` / `README.es.md`), and an open-source Apache 2.0 `LICENSE`.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Governance and licensing artifacts present at repository root
    Given the repository root
    Then AGENTS.md, README.md, README.es.md, and LICENSE (Apache 2.0) exist and are kept up to date
  ```

### NFR-008 — Security Hardening (CSP, XSS, Prototype Pollution, Secret Isolation & SAST)

- **Introduced:** 2026-11-20 (`21fb209`, `4a57a8b`)
- **Status:** Active
- **Job Story:** When processing untrusted user input or external metadata, the application must enforce a strict CSP (no `unsafe-eval`, `frame-ancestors 'none'`), allowlist external image hosts, escape all HTML output, block prototype pollution, isolate `omdbApiKey` from exports, cap import sizes at 512 KB, and run automated SAST (Semgrep & CodeQL).
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Reject prototype pollution, disallowed image hosts, and oversized imports
    Given an attacker supplies __proto__ keys, non-allowlisted image URLs, or payloads larger than 512 KB
    Then prototype keys are stripped, disallowed image URLs are rejected, and oversized imports fail safely
    And omdbApiKey is never included in sync codes, deeplinks, or JSON exports
  ```

### NFR-009 — Automated Quality Gates, Git Hooks & Semantic Release

- **Introduced:** 2026-11-20 (`dedefdb`, PR #2)
- **Status:** Active
- **Job Story:** When committing, pushing, or merging changes to `main`, formatting (`bun fmt`), linting (`oxlint`), typechecking (`bun check`), unit tests (`bun test`), Conventional Commits (`commitlint`), and automated releases (`semantic-release`) must run automatically via `lefthook` and GitHub Actions.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Local git hooks and CI enforce quality gates
    Given a contributor commits or pushes a branch
    Then pre-commit runs bun fmt, oxlint, and bun check; commit-msg validates Conventional Commits; and pre-push runs format-check, lint, typecheck, and bun test
  ```

### NFR-010 — Stream Resilience, Export Cache Consistency & Modal Accessibility

- **Introduced:** 2026-11-21 (`c73869a`, `5765118`, `8e9a322`, `562fd37`, PR #6)
- **Status:** Active
- **Job Story:** When handling untrusted compressed deeplinks and stacked modal dialogs, the app must cancel decompression bombs cleanly without unhandled rejections, reject pre-compression oversized exports (> 512 KB UTF-8), invalidate cached exports on progress revision changes, contain keyboard and screen-reader focus (`inert` + `Tab` focus trap + focus restoration), and preserve focus on comparison tab switches.
- **Acceptance Criteria:**
  ```gherkin
  Scenario: Reject decompression bombs and oversized UTF-8 exports safely
    Given a z1. payload expands beyond 512 KB or a serialized profile exceeds 512 KB UTF-8
    Then the decompression stream is cancelled cleanly without unhandled promise rejections and oversized exports are blocked before compression

  Scenario: Contain and restore focus across modal transitions and tab switches
    Given a user opens a modal dialog
    Then background landmarks become inert, focus moves inside the dialog, and Tab stays trapped within it
    When the user switches comparison tabs via keyboard
    Then focus remains on the newly active tab button
    When all modals are closed
    Then background landmarks are restored and focus returns to the initiating trigger element
  ```
