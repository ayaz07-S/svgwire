# Product Requirements Document
**Project:** SVG2Component
**Platform:** Web (Client-Side Only)
**Tech Stack:** Astro.js, React (Islands), Tailwind CSS v4, Lucide React
**Deployment Target:** Cloudflare Pages (Static Export)

## 1. Executive Summary
SVG2Component is a lightning-fast, client-side developer tool that converts raw SVGs into framework-specific code (React, Vue, Svelte, React Native). It utilizes a "Universal Core" architecture: a single JavaScript DOMParser engine extracts SVG data and passes it to framework-specific template adapters. 

## 2. Architecture & Programmatic SEO (Astro)
* **Framework:** Astro.js (using `@astrojs/react` for interactivity).
* **Routing:** The application MUST use Astro's dynamic routing (`[framework].astro`) and `getStaticPaths()` to build distinct, SEO-optimized static landing pages.
* **Routes to Generate:**
  * `/` (Default: React JSX)
  * `/svg-to-tailwind-react` (Pre-loads React + Tailwind config)
  * `/svg-to-vue` (Pre-loads Vue 3 config)
  * `/svg-to-svelte` (Pre-loads Svelte config)
  * `/svg-to-react-native` (Pre-loads React Native SVG / NativeWind config)
* **Performance:** The layout, navigation, and SEO meta-tags must be pure Astro HTML. Only the core `<Converter />` UI should be hydrated as a React island using `client:load`.

## 3. Core Conversion Logic (Zero-Backend)
* The app MUST NOT use any backend servers, Node.js filesystem APIs, or API routes. 
* All conversion logic must run in the browser using the native `DOMParser` and `XMLSerializer` APIs.
* **Attribute Mapping:** The parser must handle case conversions dynamically (e.g., converting `stroke-width` to `strokeWidth` for React, but leaving it kebab-case for Vue).

## 4. UI/UX Requirements (Vercel Aesthetic)
* **Design System:** Strictly follow the `DESIGN.md` rules (monochrome, high-contrast borders, Geist/sans-serif fonts, monospace code blocks).
* **Split-Pane Layout:** Left pane for input (paste raw code or drag-and-drop a file). Right pane for output code.
* **Visual Sandbox:** Above the code output, include a UI box that actually renders the SVG graphic in real-time so the user can verify the output visually.

## 5. Competitor Edge Features (MVP Checklist)
To beat `transform.tools` and `allsvgicons.com`, the converter panel must include these toggle checkboxes:
1. **Remove Dimensions:** Strips hardcoded `width` and `height` attributes.
2. **currentColor Mode:** Automatically detects hex/RGB fill or stroke colors and replaces them with `currentColor` (essential for Tailwind theming).
3. **NativeWind Support:** (Specific to React Native output) Changes standard SVG elements into NativeWind compatible wrappers.
4. **Copy / Download:** A one-click "Copy to Clipboard" button and a "Download .tsx/.vue" button.