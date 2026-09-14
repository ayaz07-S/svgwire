export interface FrameworkConfig {
  id: string;
  slug: string;
  name: string;
  label: string;
  extension: string;
  title: string;
  description: string;
  h1: string;
  seoContent: string;
}

export const FRAMEWORKS: FrameworkConfig[] = [
  {
    id: 'react',
    slug: 'svg-to-react',
    name: 'React',
    label: 'JSX',
    extension: '.tsx',
    title: 'SVG to React Component — Free Online Converter | SVGWire',
    description: 'Convert raw SVG code into production-ready React JSX/TSX components instantly. Zero-latency, client-side conversion with TypeScript support, currentColor mode, and dimension removal.',
    h1: 'SVGWire — Wire SVG assets into production-ready code',
    seoContent: 'Convert any SVG file or code into a clean, reusable React component. Our converter handles camelCase attribute mapping (stroke-width → strokeWidth), JSX-compatible output, forwardRef support, and TypeScript interfaces — all processed in your browser with zero backend calls.',
  },
  {
    id: 'vue',
    slug: 'svg-to-vue',
    name: 'Vue 3',
    label: 'SFC',
    extension: '.vue',
    title: 'SVG to Vue 3 Component — Free Online Converter | SVGWire',
    description: 'Convert raw SVG code into Vue 3 Single File Components with <script setup>. Supports TypeScript, currentColor mode, and production-ready output.',
    h1: 'SVGWire — Wire SVG assets into production-ready code',
    seoContent: 'Transform SVG files into Vue 3 Single File Components with <script setup lang="ts"> syntax. Our converter preserves kebab-case attributes (the Vue way), generates proper defineProps interfaces, and supports currentColor replacement for seamless Tailwind CSS theming.',
  },
  {
    id: 'svelte',
    slug: 'svg-to-svelte',
    name: 'Svelte 5',
    label: 'Svelte',
    extension: '.svelte',
    title: 'SVG to Svelte 5 Component — Free Online Converter | SVGWire',
    description: 'Convert raw SVG code into Svelte 5 components with runes syntax. Zero-latency, client-side conversion with TypeScript and currentColor support.',
    h1: 'SVGWire — Wire SVG assets into production-ready code',
    seoContent: 'Generate Svelte 5 components from SVG code using the new runes syntax ($props). Our converter outputs clean .svelte files with proper prop spreading ({...restProps}), TypeScript support via <script lang="ts">, and automatic currentColor replacement for design system compatibility.',
  },
  {
    id: 'react-native',
    slug: 'svg-to-react-native',
    name: 'React Native',
    label: 'RN',
    extension: '.tsx',
    title: 'SVG to React Native Component — Free Online Converter | SVGWire',
    description: 'Convert raw SVG code into React Native components using react-native-svg. Supports NativeWind wrappers and production-ready TypeScript output.',
    h1: 'SVGWire — Wire SVG assets into production-ready code',
    seoContent: 'Convert SVG code into React Native components using the react-native-svg library. Our converter maps standard SVG elements to their React Native equivalents (Svg, Path, Circle, Rect, etc.), handles camelCase attributes, and optionally wraps output in NativeWind-compatible containers for Tailwind CSS styling on mobile.',
  },
  {
    id: 'tailwind-react',
    slug: 'svg-to-tailwind-react',
    name: 'Tailwind + React',
    label: 'TW',
    extension: '.tsx',
    title: 'SVG to Tailwind React Component — Free Online Converter | SVGWire',
    description: 'Convert SVG code into React components pre-configured for Tailwind CSS. Automatically applies currentColor, className prop, and removes hardcoded dimensions.',
    h1: 'SVGWire — Wire SVG assets into production-ready code',
    seoContent: 'Purpose-built for Tailwind CSS projects. This converter automatically strips hardcoded width/height attributes (so you can use Tailwind sizing utilities like w-6 h-6), replaces all fill and stroke colors with currentColor (so text-blue-500 just works), and adds a className prop for easy utility class composition.',
  },
];

export function getFrameworkById(id: string): FrameworkConfig {
  return FRAMEWORKS.find(f => f.id === id) ?? FRAMEWORKS[0];
}

export function getFrameworkBySlug(slug: string): FrameworkConfig {
  return FRAMEWORKS.find(f => f.slug === slug) ?? FRAMEWORKS[0];
}

export const DEFAULT_FRAMEWORK = 'react';
