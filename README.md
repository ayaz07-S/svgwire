# SVGWire

A blazing fast, 100% client-side SVG to Framework Component converter. Convert raw SVGs into production-ready React, Vue, Svelte, and React Native components entirely within your browser.

## 🚀 Features

- **Multi-Framework Support**: Instantly generate clean components for React, Vue, Svelte, and React Native.
- **Zero Backend**: All processing is done locally in your browser using DOM APIs and `JSZip`. No files are ever uploaded.
- **Deterministic ID Scrambling**: Solves the notorious SVG internal ID collision bug. Automatically detects elements like `<linearGradient>`, `<clipPath>`, and `<mask>`, renaming their IDs and references (`url(#...)`) using a hash derived from the file name and content. Ensures visually perfect rendering when multiple icons share a page.
- **Coordinate Precision Truncation**: Includes a robust, custom path tokenizer that rounds coordinate values (`d`, `points`, `viewBox`, `cx`, etc.) to a configurable decimal precision (1-6). Features deep arc (`A/a`) flag preservation to ensure valid syntax. Drastically reduces file sizes by stripping unnecessary precision.
- **Live Output Metrics**: Compare raw SVG bytes against parsed/cleaned output sizes in real-time as you drag the precision slider.
- **Batch Folder Processing**: Drag and drop an entire folder of SVGs. The engine processes everything concurrently and downloads a single `.zip` file while preserving nested directory structures.
- **Sprite Mode**: Compiles dozens of SVGs into a single optimized `<svg>` sprite. Automatically extracts root presentation attributes, strips dropped root folders, and generates:
  - `sprite.svg` containing all `<symbol>` definitions.
  - A strict TypeScript union file (`icon-names.ts`) of all valid icon names.
  - A framework-specific `<Icon>` wrapper component that consumes the sprite using `<use href="/sprite.svg#icon-name" />`.

## 🧞 Development Commands

All commands are run from the root of the project from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run test`            | Runs the local Node.js test suite                |
| `npm run preview`         | Preview your build locally, before deploying     |

## 🛠 Tech Stack
- **Framework**: Astro (for fast static routing and HTML shells)
- **UI Components**: React (Interactive client-side Islands)
- **Styling**: Tailwind CSS
- **Testing**: Node.js Native Test Runner (`node:test`)
