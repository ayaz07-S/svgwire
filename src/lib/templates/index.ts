/**
 * Template Registry
 * Central dispatcher that routes conversion to the correct framework adapter.
 */

import { parseSvg, type ParsedSvg } from '../engine/parser.ts';
import { generateReact, type ReactOptions } from './react.ts';
import { generateVue, type VueOptions } from './vue.ts';
import { generateSvelte, type SvelteOptions } from './svelte.ts';
import { generateReactNative, type ReactNativeOptions } from './react-native.ts';

export interface ConversionOptions {
  framework: string;
  componentName: string;
  typescript: boolean;
  removeDimensions: boolean;
  useCurrentColor: boolean;
  addSizeProp: boolean;
  nativewind: boolean;
  addClassName: boolean;
  addPropsSpread: boolean;
  exportType: 'default' | 'named';
  precision: number;
}

export interface ConversionResult {
  code: string;
  parsed: ParsedSvg;
  outputSize: number;
  extension: string;
  language: string;
}

export const DEFAULT_OPTIONS: ConversionOptions = {
  framework: 'react',
  componentName: 'SvgIcon',
  typescript: true,
  removeDimensions: false,
  useCurrentColor: false,
  addSizeProp: false,
  nativewind: false,
  addClassName: true,
  addPropsSpread: true,
  exportType: 'default',
  precision: 3,
};

/**
 * Default options per framework — presets applied when switching frameworks.
 */
export function getDefaultsForFramework(frameworkId: string): Partial<ConversionOptions> {
  switch (frameworkId) {
    case 'react':
      return { addClassName: true, addPropsSpread: true, nativewind: false };
    case 'vue':
      return { addClassName: false, addPropsSpread: false, nativewind: false };
    case 'svelte':
      return { addClassName: false, addPropsSpread: false, nativewind: false };
    case 'react-native':
      return { addClassName: false, addPropsSpread: true, nativewind: false, removeDimensions: true };
    case 'tailwind-react':
      return { addClassName: true, addPropsSpread: true, nativewind: false, removeDimensions: true, useCurrentColor: true };
    default:
      return {};
  }
}

/**
 * Convert raw SVG to a framework component.
 */
export function convert(rawSvg: string, options: ConversionOptions): ConversionResult {
  const parsed = parseSvg(rawSvg, { componentName: options.componentName, precision: options.precision });

  if (!parsed.isValid) {
    return {
      code: `// Error: ${parsed.error}`,
      parsed,
      outputSize: 0,
      extension: '.tsx',
      language: 'typescript',
    };
  }

  let code: string;
  let extension: string;
  let language: string;

  switch (options.framework) {
    case 'vue': {
      const vueOpts: VueOptions = {
        componentName: options.componentName,
        typescript: options.typescript,
        removeDimensions: options.removeDimensions,
        useCurrentColor: options.useCurrentColor,
        addSizeProp: options.addSizeProp,
      };
      code = generateVue(parsed, vueOpts);
      extension = '.vue';
      language = 'html';
      break;
    }

    case 'svelte': {
      const svelteOpts: SvelteOptions = {
        componentName: options.componentName,
        typescript: options.typescript,
        removeDimensions: options.removeDimensions,
        useCurrentColor: options.useCurrentColor,
        addSizeProp: options.addSizeProp,
      };
      code = generateSvelte(parsed, svelteOpts);
      extension = '.svelte';
      language = 'html';
      break;
    }

    case 'react-native': {
      const rnOpts: ReactNativeOptions = {
        componentName: options.componentName,
        typescript: options.typescript,
        removeDimensions: options.removeDimensions,
        useCurrentColor: options.useCurrentColor,
        addSizeProp: options.addSizeProp,
        nativewind: options.nativewind,
      };
      code = generateReactNative(parsed, rnOpts);
      extension = options.typescript ? '.tsx' : '.jsx';
      language = options.typescript ? 'tsx' : 'jsx';
      break;
    }

    case 'tailwind-react':
    case 'react':
    default: {
      const reactOpts: ReactOptions = {
        componentName: options.componentName,
        typescript: options.typescript,
        removeDimensions: options.removeDimensions,
        useCurrentColor: options.useCurrentColor,
        addSizeProp: options.addSizeProp,
        exportType: options.exportType,
        addClassName: options.addClassName,
        addPropsSpread: options.addPropsSpread,
      };
      code = generateReact(parsed, reactOpts);
      extension = options.typescript ? '.tsx' : '.jsx';
      language = options.typescript ? 'tsx' : 'jsx';
      break;
    }
  }

  const outputSize = new Blob([code]).size;

  return { code, parsed, outputSize, extension, language };
}
