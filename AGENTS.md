# SVGWire — Project Context

## What is this project?

**SVGWire** (https://svgwire.com) is a blazing-fast, **100% client-side** SVG → framework component converter. Users paste raw SVG or drop SVG files/folders, and the app generates production-ready components for **React/JSX**, **Vue 3 SFC**, **Svelte 5**, **React Native** (react-native-svg / NativeWind), and a **Tailwind-optimized React** variant — entirely in the browser. **No backend, no uploads, no API calls.**

Competitors targeted: `transform.tools`, `allsvgicons.com`. Current build of record is deployed to Cloudflare Workers via Wrangler.

## Tech Stack

- **Framework**: Astro 7 (static HTML shells, SEO pages, `@astrojs/react` islands)
- **UI**: React 19 (client-side islands, hydrated with `client:load`)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`), custom design-token system from `DESIGN.md`
- **Fonts**: Geist + Geist Mono (Google Fonts)
- **Icons**: `lucide-react`
- **Zip/downloads**: `JSZip`
- **Syntax highlighting in output**: `prism-react-renderer`
- **Testing**: Node.js native test runner (`node:test`) + `jsdom`; tests import `.ts` sources directly via `node --experimental-strip-types`
- **Deployment**: Cloudflare Workers + Static Assets (`wrangler deploy`, see `wrangler.jsonc` — assets dir `./dist`)

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

### Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Installs dependencies |
| `astro dev --background` | Starts dev server on `localhost:4321` (background mode) |
| `npm run build` | Builds production site to `./dist/` |
| `npm run preview` | Previews the build locally |
| `npm run deploy` | `astro build && wrangler deploy` |
| `npm run test` | Runs all tests in `tests/*.test.js` |
| `node verify-browsers.mjs` | CDP-driven headless Chrome script to verify bug fixes against the real running app (needs `astro dev` up on :4321) |

## Architecture

```
astro.config.mjs         → site, trailingSlash:'never', react+sitemap integrations, Tailwind v4 vite plugin
src/
  layouts/BaseLayout.astro     → HTML shell: SEO meta/OG/Twitter, JSON-LD, Geist fonts, inline dark-mode theme script
  components/
    Nav.astro / Footer.astro   → shared chrome; Nav has the theme toggle island
    SeoContent.astro           → programmatic per-page SEO content
    ThemeToggle.tsx            → dark/light toggle island (persists to localStorage 'theme')
    converter/
      Converter.tsx            → ROOT island; owns all state, framework tabs, routes to panes
      InputPane.tsx            → left pane: paste or drag-and-drop single SVG
      OutputPane.tsx           → right pane: prism-highlighted code + copy/download
      PreviewSandbox.tsx       → live SVG render with light/dark/transparency checkerboard toggle
      ActionBar.tsx            → copy-to-clipboard + download filename buttons
      OptionsPanel.tsx         → toggle checkboxes (removeDimensions, currentColor, size prop, etc.)
      ModeSelector.tsx         → single / batch / sprite mode switcher
      BatchPane.tsx            → folder/sprite drop zone; recursive scan, JSZip output, progress log
  pages/
    index.astro            → `/` (defaults to React)
    [framework].astro      → dynamic route via getStaticPaths() from FRAMEWORKS slugs
    batch.astro            → `/batch` (mode="batch")
    sprite.astro           → `/sprite` (mode="sprite")
    faq.astro / privacy.astro / terms.astro
  lib/
    frameworks.ts          → FRAMEWORKS config (id, slug, name, extension, SEO strings) + getters
    frameworkSession.ts    → sessionStorage persistence of framework choice across modes ('svgwire-framework')
    engine/
      parser.ts            → DOMParser-based Universal Parser (ID scrambler + namespace cleanup + precision truncation)
      optimizer.ts         → removeDimensions / currentColor transforms
      precision.ts         → coordinate rounding + custom path tokenizer (arc-flag-safe)
      transformer.ts       → attribute/innerHTML fixes per framework, React Native element mapping
    templates/
      index.ts             → template REGISTRY: convert() dispatches to per-framework adapter; DEFAULT_OPTIONS + getDefaultsForFramework()
      react.ts / vue.ts / svelte.ts / react-native.ts → framework adapters
      sprite.ts            → generateSpriteWrapper(): <Icon> wrapper consuming sprite.svg via <use>
    utils.ts               → clipboard, download, file reading, PascalCase, sprite-id sanitization, recursive folder scan, data-URI encoding
  styles/app.css           → Tailwind v4 @theme token system + dark-mode remap + text-* @utility scale + preview checkerboard
public/
  brand/                   → wordmark/mark/app-icon SVGs (light + dark variants)
  favicon.svg, favicon.ico, robots.txt
```

## Key Concepts to Preserve

- **Zero-backend constraint is sacred.** Everything uses browser `DOMParser`, `XMLSerializer`, `Blob`, `FileReader`. Do not introduce servers/API routes/filesystem. SSR must guard `window`/`DOMParser` usage (Converter returns `null` result when `typeof window === 'undefined'`).
- **Universal Core architecture**: one shared parse engine + per-framework template adapters in `src/lib/templates/`. New frameworks = new adapter + a FRAMEWORKS entry + (if SEO page) a slug route.
- **Framework slugs** drive the SEO landing pages. React maps to `/`, all others to `/svg-to-*` via `getStaticPaths()`. Changing `FRAMEWORKS` slugs/bundles affects routing, nav tabs, and generated zip names (`svgwire-<slug minus 'svg-to-'>.zip`).
- **Single mode** uses full-page navigation between framework URLs (each page a static build with its own `<Converter defaultFramework>`). **Batch/Sprite modes** switch framework client-side via state, persisted to `sessionStorage` under `svgwire-framework` so the choice survives mode transitions.
- **CurrentColor semantics**: `replaceColorsInHtml` and `replaceWithCurrentColor` preserve `none`, `transparent`, `inherit`, and `url(#...)` values — only fill/stroke become `currentColor`.
- **ID scrambler** (`parser.ts` Phase 1) deterministically renames ids/`url(#...)` refs using a hash of content + component name. Critical for rendering multiple icons on one page. Also rewrites `<style>` blocks and `style=` attributes.
- **Precision truncation** (`precision.ts`) rounds coords in `d`, `points`, `viewBox`, transforms, etc. to a slider-controlled decimal (1–6, default 3). Must preserve arc (`A/a`) flag syntax.
- **Design system is code, not vibe**: tokens live in `src/styles/app.css` `@theme` block and come from `DESIGN.md`. Light defaults are in `@theme`; dark mode remaps the same CSS custom properties under `html.dark`. Use `text-display-*`, `text-body-*`, `text-caption-*`, `text-code` utilities and `bg-canvas`/`border-hairline`/`shadow-level-*` tokens — do not hardcode ad-hoc colors or spacing.
- **Dark mode** toggling: inline blocking script in `BaseLayout` reads `localStorage.theme` / `prefers-color-scheme`, sets `.dark` class on `<html>`. Tailwind v4 uses `@custom-variant dark`.

## Framework Conversion Pipeline

1. `Converter.tsx` keeps raw SVG + `ConversionOptions` (componentName, typescript, removeDimensions, useCurrentColor, addSizeProp, nativewind, addClassName, addPropsSpread, exportType, precision, framework).
2. `convert(rawSvg, options)` → `parseSvg()` → engine transforms → per-framework template generator.
3. Result: `{ code, parsed, outputSize, extension, language }`.
4. Per-framework default presets (`getDefaultsForFramework`) are applied on every framework switch: e.g. tailwind-react pre-enables `removeDimensions + useCurrentColor`.

## Routes

| Route | Framework | Mode |
| :--- | :--- | :--- |
| `/` | React JSX | single |
| `/svg-to-tailwind-react` | Tailwind + React | single |
| `/svg-to-vue` | Vue 3 SFC | single |
| `/svg-to-svelte` | Svelte 5 | single |
| `/svg-to-react-native` | React Native | single |
| `/batch` | (any, session-persisted) | batch |
| `/sprite` | (any, session-persisted) | sprite |
| `/faq`, `/privacy`, `/terms` | static | — |

## Testing

Tests live in `tests/*.test.js` and use `node --experimental-strip-types --test "tests/*.test.js"` (so `.ts` sources are imported directly — no build step).

Existing suites:
- `comprehensive.test.js` — core utils, precision, optimizer, transformer, frameworks config
- `framework-selection.test.js`, `framework-persistence.test.js` — framework defaults and sessionStorage persistence
- `id-scrambler.test.js` — ID collision scrambling
- `precision.test.js` — coordinate truncation
- `preview-color.test.js` — currentColor / preview color handling

When you add engine features, extend the matching suite. When running `npm test`, `jsdom` must be used to set up `DOMParser` / `Blob` globals before importing parser-dependent modules.

## Verification Scripts

`verify-browsers.mjs` is a CDP (Chrome DevTools Protocol) harness that launches headless Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`), drives the real app on `localhost:4321`, and screenshots bug-fix scenarios. Used to confirm UI-level fixes (e.g., framework selection bugs, preview color). Requires the dev server running and Chrome installed.

## Gotchas & Conventions

- Windows machine: use forward slashes in bash; paths like `I:\Playground\svgwire.com`.
- `CLAUDE.md` is a symlink to `AGENTS.md` — **edit `AGENTS.md`**, not the symlink.
- `svgwire/` directory is a stray wrangler bootstrap; ignore it (contains its own node_modules).
- Engine files import with explicit `.ts` extensions (Node strip-types requirement). Keep that consistent in new engine modules.
- Site domain: `https://svgwire.com` (used as `site` in `astro.config.mjs`; assume it for canonical URLs).
- Git commits, PRs, and all GitHub activity are handled by the user. Do not append any attribution lines to commit messages or PR descriptions.
- Never run `npm run deploy` or perform any deployment actions — the user will handle deployment manually after verification.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

Reference docs in-repo:
- `DESIGN.md` — full Vercel-style design system (colors, type scale, tokens) the CSS is derived from
- `PRD.md` — product requirements / MVP feature checklist