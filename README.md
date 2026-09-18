# SVGWire

Turn SVG assets into production-ready React, Vue, Svelte, React Native, and Tailwind code.

Live Demo → [https://svgwire.com](https://svgwire.com)

## What SVGWire Does

SVG exports can require cleanup, framework-specific attribute conversion, styling adjustments, and repetitive manual work before they are ready for frontend projects. SVGWire provides a browser-based workflow for converting and preparing these assets.

## Features

### Framework Conversion
- React
- Vue 3
- Svelte 5
- React Native
- Tailwind React

### Asset Workflows
- Single SVG conversion
- Batch folder conversion (recursive processing supported)
- SVG sprite generation

### Output & Utilities
- TypeScript support
- currentColor support
- Remove width/height dimensions
- Live SVG preview
- Code output with copy/download
- ZIP output
- `sprite.svg` generation
- `icon-names.ts` generation
- Framework-specific sprite wrapper generation
- Tailwind Data URI output
- Tailwind CSS Mask output
- Light/Dark mode
- Responsive UI
- SEO framework pages

## Privacy & Architecture

SVG conversion is performed client-side in your browser, so SVG source content does not need to be uploaded to an SVGWire server. No account is required for the core converter.

## Tech Stack

SVGWire is built with:
- Astro
- React Islands
- TypeScript
- Tailwind CSS v4
- Cloudflare Workers / Static Assets

## How It Works

1. Paste or upload an SVG.
2. Select the target framework/output.
3. Configure options.
4. Preview the result.
5. Copy or download the generated code.

**Batch Mode**: Drag and drop an entire folder of SVGs. The application recursively processes all files and generates a single `.zip` file with converted components.
**Sprite Mode**: Process multiple SVGs into a single `sprite.svg`, complete with a TypeScript union file (`icon-names.ts`) and a framework-specific `<Icon>` wrapper.

## Local Development

Commands for developing locally:

| Command           | Action                                        |
| ----------------- | --------------------------------------------- |
| `npm install`     | Installs dependencies                         |
| `npm run dev`     | Starts the development server                 |
| `npm run build`   | Builds the production static site             |
| `npm run preview` | Previews the production build locally         |
| `npm run test`    | Runs the local Node.js test suite             |
| `npm run deploy`  | Builds and deploys to Cloudflare Workers      |

## Project Structure

```text
src/
  components/  # React components (Interactive islands) and Astro components
  layouts/     # Base layouts
  lib/         # Conversion engine, parsing logic, and templates
  pages/       # Astro pages (Framework routes, Batch, Sprite, FAQ)
  styles/      # Global CSS and Tailwind directives
```

## Testing

Tests run via the native Node.js test runner (`node:test`). The test suite covers the parsing engine behavior, ID scrambling, coordinate truncation, and framework conversion outputs.

## Deployment

SVGWire is deployed using Cloudflare Workers. Static assets are served from the Cloudflare edge, while the converter logic remains entirely in the browser. 
Production domain: https://svgwire.com

## Roadmap

The following features are **planned** or represent future directions for the project:

- Shared conversion core package
- SVGWire CLI
- Project configuration
- Watch mode
- SVG validation/checking
- GitHub Action / CI integration
- Figma integration
- VS Code integration

## Contributing

1. Fork and clone the repository.
2. Run `npm install` to install dependencies.
3. Start the dev server with `npm run dev`.
4. Make your changes and ensure `npm run test` passes.
5. Submit a pull request.

*(Note: No license information is currently specified in the repository.)*

## Related Links

- [Home](https://svgwire.com/)
- [SVG to React](https://svgwire.com/svg-to-react)
- [SVG to Vue 3](https://svgwire.com/svg-to-vue)
- [SVG to Svelte 5](https://svgwire.com/svg-to-svelte)
- [SVG to React Native](https://svgwire.com/svg-to-react-native)
- [SVG to Tailwind React](https://svgwire.com/svg-to-tailwind-react)
- [Batch Mode](https://svgwire.com/batch)
- [Sprite Mode](https://svgwire.com/sprite)
