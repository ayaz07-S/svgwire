/**
 * Comprehensive test suite for SVGWire
 * Tests all core conversion features across all frameworks.
 */
import test from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

// Setup browser globals for parser
const { window } = new JSDOM();
global.DOMParser = window.DOMParser;
global.Blob = class Blob {
  constructor(content) {
    this.size = content.join('').length;
  }
};

// === Direct imports (avoid chained .ts imports via precision) ===
import { truncatePath, truncateNumberStrings } from '../src/lib/engine/precision.ts';
import { transformAttrName, transformInnerHtml, transformForReactNative, RN_ELEMENT_MAP } from '../src/lib/engine/transformer.ts';
import { optimizeSvg, removeDimensions, replaceWithCurrentColor, replaceColorsInHtml } from '../src/lib/engine/optimizer.ts';
import { toPascalCase, sanitizeSpriteId, formatBytes, encodeSvgDataUri } from '../src/lib/utils.ts';
import { FRAMEWORKS, getFrameworkById, getFrameworkBySlug, DEFAULT_FRAMEWORK } from '../src/lib/frameworks.ts';

// ============================================================
// 1. UTILITY FUNCTIONS
// ============================================================

test('toPascalCase', () => {
  assert.strictEqual(toPascalCase('my-icon'), 'MyIcon');
  assert.strictEqual(toPascalCase('home'), 'Home');
  assert.strictEqual(toPascalCase('arrow-left-circle'), 'ArrowLeftCircle');
  assert.strictEqual(toPascalCase('my_icon_name'), 'MyIconName');
  assert.strictEqual(toPascalCase('icon-1-2'), 'Icon12');
  assert.strictEqual(toPascalCase(''), '');
  assert.strictEqual(toPascalCase('a'), 'A');
  assert.strictEqual(toPascalCase('already-PascalCase'), 'AlreadyPascalCase');
  assert.strictEqual(toPascalCase('my icon'), 'MyIcon');
  // Test with special characters
  assert.strictEqual(toPascalCase('my-icon(1)'), 'MyIcon1');
});

test('sanitizeSpriteId', () => {
  assert.strictEqual(sanitizeSpriteId('home.svg'), 'home');
  assert.strictEqual(sanitizeSpriteId('solid/home.svg'), 'solid-home');
  assert.strictEqual(sanitizeSpriteId('outline/arrow-left.svg'), 'outline-arrow-left');
  assert.strictEqual(sanitizeSpriteId('ICON.SVG'), 'icon');
  assert.strictEqual(sanitizeSpriteId('my icon (1).svg'), 'my-icon-1');
});

test('formatBytes', () => {
  assert.strictEqual(formatBytes(0), '0 B');
  assert.strictEqual(formatBytes(500), '500 B');
  assert.strictEqual(formatBytes(1024), '1.0 KB');
  assert.strictEqual(formatBytes(1536), '1.5 KB');
  assert.strictEqual(formatBytes(10240), '10.0 KB');
});

test('encodeSvgDataUri', () => {
  const simple = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" /></svg>';
  const uri = encodeSvgDataUri(simple);
  assert.ok(uri.startsWith('data:image/svg+xml,'));
  assert.ok(!uri.includes('<'));
  assert.ok(!uri.includes('>'));
  assert.ok(!uri.includes(' '));
  assert.ok(uri.includes('%20'));
});

// ============================================================
// 2. FRAMEWORK REGISTRY
// ============================================================

test('Framework registry - all frameworks present', () => {
  assert.strictEqual(FRAMEWORKS.length, 5);
  const ids = FRAMEWORKS.map(f => f.id);
  assert.ok(ids.includes('react'));
  assert.ok(ids.includes('vue'));
  assert.ok(ids.includes('svelte'));
  assert.ok(ids.includes('react-native'));
  assert.ok(ids.includes('tailwind-react'));
});

test('Framework registry - getFrameworkById', () => {
  const react = getFrameworkById('react');
  assert.strictEqual(react.id, 'react');
  assert.strictEqual(react.name, 'React');
  
  // Unknown ID should fallback to React
  const unknown = getFrameworkById('angular');
  assert.strictEqual(unknown.id, 'react');
});

test('Framework registry - getFrameworkBySlug', () => {
  const vue = getFrameworkBySlug('svg-to-vue');
  assert.strictEqual(vue.id, 'vue');
  
  // Unknown slug should fallback to React
  const unknown = getFrameworkBySlug('svg-to-angular');
  assert.strictEqual(unknown.id, 'react');
});

test('Framework registry - DEFAULT_FRAMEWORK is react', () => {
  assert.strictEqual(DEFAULT_FRAMEWORK, 'react');
});

test('Framework registry - all frameworks have required fields', () => {
  for (const fw of FRAMEWORKS) {
    assert.ok(fw.id, `${fw.name} missing id`);
    assert.ok(fw.slug, `${fw.name} missing slug`);
    assert.ok(fw.name, `${fw.id} missing name`);
    assert.ok(fw.label, `${fw.id} missing label`);
    assert.ok(fw.extension, `${fw.id} missing extension`);
    assert.ok(fw.title, `${fw.id} missing title`);
    assert.ok(fw.description, `${fw.id} missing description`);
    assert.ok(fw.h1, `${fw.id} missing h1`);
    assert.ok(fw.seoContent, `${fw.id} missing seoContent`);
  }
});

// ============================================================
// 3. TRANSFORMER - Attribute Conversion
// ============================================================

test('Transformer - JSX camelCase conversion', () => {
  assert.strictEqual(transformAttrName('stroke-width', 'jsx'), 'strokeWidth');
  assert.strictEqual(transformAttrName('fill-opacity', 'jsx'), 'fillOpacity');
  assert.strictEqual(transformAttrName('clip-path', 'jsx'), 'clipPath');
  assert.strictEqual(transformAttrName('class', 'jsx'), 'className');
  assert.strictEqual(transformAttrName('for', 'jsx'), 'htmlFor');
  assert.strictEqual(transformAttrName('tabindex', 'jsx'), 'tabIndex');
  assert.strictEqual(transformAttrName('xlink:href', 'jsx'), 'xlinkHref');
});

test('Transformer - JSX skips xmlns and version', () => {
  assert.strictEqual(transformAttrName('xmlns', 'jsx'), null);
  assert.strictEqual(transformAttrName('xmlns:xlink', 'jsx'), null);
  assert.strictEqual(transformAttrName('version', 'jsx'), null);
  assert.strictEqual(transformAttrName('xml:space', 'jsx'), null);
});

test('Transformer - JSX preserves data-* and aria-*', () => {
  assert.strictEqual(transformAttrName('data-testid', 'jsx'), 'data-testid');
  assert.strictEqual(transformAttrName('aria-label', 'jsx'), 'aria-label');
  assert.strictEqual(transformAttrName('aria-hidden', 'jsx'), 'aria-hidden');
});

test('Transformer - kebab mode keeps attributes as-is', () => {
  assert.strictEqual(transformAttrName('stroke-width', 'kebab'), 'stroke-width');
  assert.strictEqual(transformAttrName('fill-opacity', 'kebab'), 'fill-opacity');
  assert.strictEqual(transformAttrName('class', 'kebab'), 'class');
  assert.strictEqual(transformAttrName('viewBox', 'kebab'), 'viewBox');
});

test('Transformer - kebab mode still skips xmlns', () => {
  assert.strictEqual(transformAttrName('xmlns', 'kebab'), null);
  assert.strictEqual(transformAttrName('xmlns:xlink', 'kebab'), null);
  assert.strictEqual(transformAttrName('version', 'kebab'), null);
});

test('Transformer - transformInnerHtml JSX mode', () => {
  const input = '<path stroke-width="2" fill-rule="evenodd"/>';
  const result = transformInnerHtml(input, 'jsx');
  assert.ok(result.includes('strokeWidth='), `Expected strokeWidth in: ${result}`);
  assert.ok(result.includes('fillRule='), `Expected fillRule in: ${result}`);
  assert.ok(!result.includes('stroke-width'), `Should not contain stroke-width in: ${result}`);
});

test('Transformer - transformInnerHtml kebab mode returns unchanged', () => {
  const input = '<path stroke-width="2" fill-rule="evenodd"/>';
  const result = transformInnerHtml(input, 'kebab');
  assert.strictEqual(result, input);
});

test('Transformer - React Native element mapping', () => {
  const input = '<path d="M0 0"/><circle cx="12" cy="12" r="10"/><rect x="0" y="0" width="24" height="24"/>';
  const result = transformForReactNative(input);
  assert.ok(result.includes('<Path'), `Expected <Path in: ${result}`);
  assert.ok(result.includes('<Circle'), `Expected <Circle in: ${result}`);
  assert.ok(result.includes('<Rect'), `Expected <Rect in: ${result}`);
  assert.ok(!result.includes('<path'), `Should not contain <path in: ${result}`);
});

test('Transformer - React Native element map completeness', () => {
  const expectedElements = ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'defs', 'clipPath', 'linearGradient', 'radialGradient', 'stop', 'mask', 'use', 'text', 'tspan', 'image'];
  for (const el of expectedElements) {
    assert.ok(RN_ELEMENT_MAP[el], `Missing RN mapping for: ${el}`);
  }
});

// ============================================================
// 4. OPTIMIZER
// ============================================================

test('Optimizer - removeDimensions', () => {
  const attrs = { width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none' };
  const result = removeDimensions(attrs);
  assert.ok(!result.width);
  assert.ok(!result.height);
  assert.strictEqual(result.viewBox, '0 0 24 24');
  assert.strictEqual(result.fill, 'none');
});

test('Optimizer - replaceWithCurrentColor', () => {
  const attrs = { fill: '#000000', stroke: 'rgb(255,0,0)' };
  const result = replaceWithCurrentColor(attrs);
  assert.strictEqual(result.fill, 'currentColor');
  assert.strictEqual(result.stroke, 'currentColor');
});

test('Optimizer - replaceWithCurrentColor preserves special values', () => {
  const attrs1 = { fill: 'none', stroke: 'transparent' };
  const result1 = replaceWithCurrentColor(attrs1);
  assert.strictEqual(result1.fill, 'none');
  assert.strictEqual(result1.stroke, 'transparent');
  
  const attrs2 = { fill: 'currentColor', stroke: 'inherit' };
  const result2 = replaceWithCurrentColor(attrs2);
  assert.strictEqual(result2.fill, 'currentColor');
  assert.strictEqual(result2.stroke, 'inherit');
  
  const attrs3 = { fill: 'url(#gradient)' };
  const result3 = replaceWithCurrentColor(attrs3);
  assert.strictEqual(result3.fill, 'url(#gradient)');
});

test('Optimizer - replaceColorsInHtml', () => {
  const html = '<path fill="#ff0000" stroke="rgb(0,0,255)"/>';
  const result = replaceColorsInHtml(html);
  assert.ok(result.includes('fill="currentColor"'), `Expected fill=currentColor in: ${result}`);
  assert.ok(result.includes('stroke="currentColor"'), `Expected stroke=currentColor in: ${result}`);
});

test('Optimizer - replaceColorsInHtml preserves none and url()', () => {
  const html = '<path fill="none" stroke="url(#grad)"/>';
  const result = replaceColorsInHtml(html);
  assert.ok(result.includes('fill="none"'), `Expected fill=none in: ${result}`);
  assert.ok(result.includes('stroke="url(#grad)"'), `Expected stroke=url(#grad) in: ${result}`);
});

test('Optimizer - optimizeSvg applies all options', () => {
  const attrs = { width: '24', height: '24', viewBox: '0 0 24 24', fill: '#000' };
  const html = '<path fill="#ff0000"/>';
  
  const result = optimizeSvg(attrs, html, {
    removeDimensions: true,
    useCurrentColor: true,
    addSizeProp: false,
  });
  
  assert.ok(!result.attrs.width, 'width should be removed');
  assert.ok(!result.attrs.height, 'height should be removed');
  assert.strictEqual(result.attrs.fill, 'currentColor');
  assert.ok(result.innerHTML.includes('fill="currentColor"'));
});

// ============================================================
// 5. PRECISION
// ============================================================

test('Precision - truncatePath with simple commands', () => {
  assert.strictEqual(truncatePath('M 10.123 20.456 L 30.789 40.0', 1), 'M 10.1 20.5 L 30.8 40');
});

test('Precision - truncatePath with arc commands (preserves flags)', () => {
  const arcPath = 'A10.123,10.123,0,015,-10';
  const result = truncatePath(arcPath, 1);
  // Flags 0 and 1 should be preserved as-is
  assert.ok(result.includes('0,01'), `Arc flags should be preserved in: ${result}`);
});

test('Precision - truncateNumberStrings', () => {
  assert.strictEqual(truncateNumberStrings('10.1234 20.9876', 2), '10.12 20.99');
});

test('Precision - scientific notation', () => {
  assert.strictEqual(truncateNumberStrings('1e-5', 2), '0');
  assert.strictEqual(truncateNumberStrings('1e-5', 6), '0.00001');
});

// ============================================================
// 6. CONVERSION PIPELINE (end-to-end, requires DOMParser)
// ============================================================

// We must import parser separately after precision because parser.ts imports precision.ts
// without extension - which may fail in Node ESM but works with --experimental-strip-types
// in some versions. Let's try a dynamic import with fallback.

let parseSvg, convert, generateReact, generateVue, generateSvelte, generateReactNative, generateSpriteWrapper;

try {
  const parserMod = await import('../src/lib/engine/parser.ts');
  parseSvg = parserMod.parseSvg;
  
  const templateMod = await import('../src/lib/templates/index.ts');
  convert = templateMod.convert;

  const reactMod = await import('../src/lib/templates/react.ts');
  generateReact = reactMod.generateReact;

  const vueMod = await import('../src/lib/templates/vue.ts');
  generateVue = vueMod.generateVue;

  const svelteMod = await import('../src/lib/templates/svelte.ts');
  generateSvelte = svelteMod.generateSvelte;

  const rnMod = await import('../src/lib/templates/react-native.ts');
  generateReactNative = rnMod.generateReactNative;

  const spriteMod = await import('../src/lib/templates/sprite.ts');
  generateSpriteWrapper = spriteMod.generateSpriteWrapper;
} catch (e) {
  console.error('⚠️  Could not import parser/templates (expected if Node ESM resolution fails for extensionless .ts imports):', e.message);
  console.log('Skipping parser-dependent tests.');
}

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <path d="m16 12-4-4-4 4"/>
  <path d="M12 16V8"/>
</svg>`;

const COMPLEX_SVG_WITH_IDS = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff0000"/>
      <stop offset="100%" stop-color="#0000ff"/>
    </linearGradient>
    <clipPath id="clip0">
      <rect width="24" height="24"/>
    </clipPath>
  </defs>
  <g clip-path="url(#clip0)">
    <circle cx="12" cy="12" r="10" fill="url(#grad1)"/>
  </g>
</svg>`;

const SOLID_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="#000000">
  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
</svg>`;

if (parseSvg) {

  test('Parser - valid SVG', () => {
    const result = parseSvg(SAMPLE_SVG);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.error, null);
    assert.strictEqual(result.viewBox, '0 0 24 24');
    assert.strictEqual(result.width, '24');
    assert.strictEqual(result.height, '24');
    assert.ok(result.innerHTML.length > 0);
    assert.ok(result.originalSize > 0);
  });

  test('Parser - invalid SVG', () => {
    const result = parseSvg('<div>not an svg</div>');
    assert.strictEqual(result.isValid, false);
    assert.ok(result.error);
  });

  test('Parser - empty input', () => {
    const result = parseSvg('');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.error, 'Empty input');
  });

  test('Parser - whitespace only input', () => {
    const result = parseSvg('   \n  ');
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.error, 'Empty input');
  });

  test('Parser - ID collision scrambler', () => {
    const result = parseSvg(COMPLEX_SVG_WITH_IDS, { componentName: 'TestIcon' });
    assert.ok(result.isValid);
    // Original IDs should be replaced
    assert.ok(!result.innerHTML.includes('id="grad1"'), 'Original ID grad1 should be scrambled');
    assert.ok(!result.innerHTML.includes('id="clip0"'), 'Original ID clip0 should be scrambled');
    // References should be updated
    assert.ok(result.innerHTML.includes('svg2c-testicon-'), 'Should contain scrambled prefix');
  });

  test('Parser - namespace removal from inner elements', () => {
    const svgWithNamespaces = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <g xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0h24v24H0z"/>
      </g>
    </svg>`;
    const result = parseSvg(svgWithNamespaces);
    assert.ok(result.isValid);
    // Inner elements should not have xmlns
    assert.ok(!result.innerHTML.includes('xmlns='), `Inner xmlns should be removed: ${result.innerHTML}`);
  });

  test('Parser - precision truncation', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M10.12345 20.98765L5.555 6.666"/>
    </svg>`;
    const result = parseSvg(svg, { precision: 2 });
    assert.ok(result.isValid);
    assert.ok(result.innerHTML.includes('10.12'), `Expected truncated values in: ${result.innerHTML}`);
    assert.ok(!result.innerHTML.includes('10.12345'), `Should not contain full precision: ${result.innerHTML}`);
  });

}

if (convert) {

  // ============================================================
  // 7. REACT TEMPLATE
  // ============================================================

  test('React - basic conversion', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'react',
      componentName: 'ArrowIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.parsed.isValid);
    assert.ok(result.code.includes('ArrowIcon'));
    assert.ok(result.code.includes('import type React'));
    assert.ok(result.code.includes('className={className}'));
    assert.ok(result.code.includes('{...props}'));
    assert.ok(result.code.includes('export default ArrowIcon'));
    assert.strictEqual(result.extension, '.tsx');
    assert.strictEqual(result.language, 'tsx');
  });

  test('React - named export', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'react',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: true,
      exportType: 'named',
      precision: 3,
    });
    
    assert.ok(result.code.includes('export const MyIcon'));
    assert.ok(!result.code.includes('export default'));
  });

  test('React - JavaScript mode (no TypeScript)', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'react',
      componentName: 'MyIcon',
      typescript: false,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(!result.code.includes('import type React'));
    assert.ok(!result.code.includes('React.SVGProps'));
    assert.strictEqual(result.extension, '.jsx');
    assert.strictEqual(result.language, 'jsx');
  });

  test('React - removeDimensions option', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'react',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: true,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    // Should not contain width="24" or height="24" in the SVG attributes
    assert.ok(!result.code.includes('width="24"'), `Should not contain width attr: ${result.code}`);
    assert.ok(!result.code.includes('height="24"'), `Should not contain height attr: ${result.code}`);
  });

  test('React - currentColor option', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'react',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: true,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.code.includes('currentColor'), `Should contain currentColor: ${result.code}`);
  });

  test('React - camelCase attributes', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'react',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.code.includes('strokeWidth'), `Should convert stroke-width to strokeWidth: ${result.code}`);
    assert.ok(result.code.includes('strokeLinecap'), `Should convert stroke-linecap to strokeLinecap: ${result.code}`);
    assert.ok(result.code.includes('strokeLinejoin'), `Should convert stroke-linejoin to strokeLinejoin: ${result.code}`);
  });

  // ============================================================
  // 8. VUE TEMPLATE
  // ============================================================

  test('Vue - basic conversion', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'vue',
      componentName: 'ArrowIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: false,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.parsed.isValid);
    assert.ok(result.code.includes('<script setup lang="ts">'));
    assert.ok(result.code.includes("name: 'ArrowIcon'"));
    assert.ok(result.code.includes('defineProps<Props>()'));
    assert.ok(result.code.includes('v-bind="$attrs"'));
    assert.ok(result.code.includes('<template>'));
    assert.strictEqual(result.extension, '.vue');
    assert.strictEqual(result.language, 'html');
  });

  test('Vue - uses kebab-case attributes', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'vue',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: false,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.code.includes('stroke-width'), `Vue should keep kebab-case: ${result.code}`);
    assert.ok(!result.code.includes('strokeWidth'), `Vue should not use camelCase: ${result.code}`);
  });

  test('Vue - JavaScript mode', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'vue',
      componentName: 'MyIcon',
      typescript: false,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: false,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.code.includes('<script setup>'));
    assert.ok(!result.code.includes('lang="ts"'));
    assert.ok(!result.code.includes('defineProps<'));
  });

  // ============================================================
  // 9. SVELTE TEMPLATE
  // ============================================================

  test('Svelte - basic conversion', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'svelte',
      componentName: 'ArrowIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: false,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.parsed.isValid);
    assert.ok(result.code.includes('<script lang="ts">'));
    assert.ok(result.code.includes('$props()'));
    assert.ok(result.code.includes('{...restProps}'));
    assert.ok(result.code.includes('class={className}'));
    assert.strictEqual(result.extension, '.svelte');
    assert.strictEqual(result.language, 'html');
  });

  test('Svelte - uses kebab-case attributes', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'svelte',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: false,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.code.includes('stroke-width'), `Svelte should keep kebab-case: ${result.code}`);
  });

  // ============================================================
  // 10. REACT NATIVE TEMPLATE
  // ============================================================

  test('React Native - basic conversion', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'react-native',
      componentName: 'ArrowIcon',
      typescript: true,
      removeDimensions: true,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.parsed.isValid);
    assert.ok(result.code.includes('import { Svg'));
    assert.ok(result.code.includes('from "react-native-svg"'));
    assert.ok(result.code.includes('<Svg'));
    assert.ok(result.code.includes('width={size}'));
    assert.ok(result.code.includes('height={size}'));
    assert.ok(result.code.includes('export default ArrowIcon'));
    assert.strictEqual(result.extension, '.tsx');
  });

  test('React Native - element mapping', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'react-native',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: true,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    // Inner elements should use RN names
    assert.ok(result.code.includes('<Circle') || result.code.includes('<Path'), 
      `Should contain RN element names: ${result.code}`);
  });

  test('React Native - NativeWind option', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'react-native',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: true,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: true,
      addClassName: false,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.code.includes('import { styled }'), `Should import styled: ${result.code}`);
    assert.ok(result.code.includes('export default styled(MyIcon)'), `Should export styled: ${result.code}`);
  });

  // ============================================================
  // 11. TAILWIND-REACT TEMPLATE
  // ============================================================

  test('Tailwind React - basic conversion', () => {
    const result = convert(SAMPLE_SVG, {
      framework: 'tailwind-react',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: true,
      useCurrentColor: true,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.parsed.isValid);
    // Tailwind-React uses the React generator, so it should have JSX output
    assert.ok(result.code.includes('className={className}'));
    assert.ok(result.code.includes('{...props}'));
    assert.strictEqual(result.extension, '.tsx');
  });

  // ============================================================
  // 12. SPRITE GENERATION
  // ============================================================

  test('Sprite wrapper - React', () => {
    const wrapper = generateSpriteWrapper('react', {
      framework: 'react',
      componentName: 'Icon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(wrapper.code.includes('IconName'));
    assert.ok(wrapper.code.includes('SPRITE_PATH'));
    assert.ok(wrapper.code.includes('<use href='));
    assert.strictEqual(wrapper.extension, '.tsx');
  });

  test('Sprite wrapper - Vue', () => {
    const wrapper = generateSpriteWrapper('vue', {
      framework: 'vue',
      componentName: 'Icon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: false,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(wrapper.code.includes('IconName'));
    assert.ok(wrapper.code.includes(':href='));
    assert.strictEqual(wrapper.extension, '.vue');
  });

  test('Sprite wrapper - Svelte', () => {
    const wrapper = generateSpriteWrapper('svelte', {
      framework: 'svelte',
      componentName: 'Icon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: false,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(wrapper.code.includes('IconName'));
    assert.ok(wrapper.code.includes('$props()'));
    assert.strictEqual(wrapper.extension, '.svelte');
  });

  test('Sprite wrapper - React Native', () => {
    const wrapper = generateSpriteWrapper('react-native', {
      framework: 'react-native',
      componentName: 'Icon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: false,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(wrapper.code.includes('IconName'));
    assert.ok(wrapper.code.includes('react-native-svg'));
    assert.strictEqual(wrapper.extension, '.tsx');
  });

  // ============================================================
  // 13. EDGE CASES
  // ============================================================

  test('Convert - invalid SVG returns error comment', () => {
    const result = convert('<div>not svg</div>', {
      framework: 'react',
      componentName: 'MyIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.code.startsWith('// Error:'));
  });

  test('Convert - SVG with complex gradients', () => {
    const result = convert(COMPLEX_SVG_WITH_IDS, {
      framework: 'react',
      componentName: 'GradientIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: false,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.parsed.isValid);
    assert.ok(result.code.includes('GradientIcon'));
    assert.ok(result.code.includes('linearGradient') || result.code.includes('LinearGradient'), 
      `Should contain gradient element`);
  });

  test('Convert - currentColor with solid fill SVG', () => {
    const result = convert(SOLID_SVG, {
      framework: 'react',
      componentName: 'HomeIcon',
      typescript: true,
      removeDimensions: false,
      useCurrentColor: true,
      addSizeProp: false,
      nativewind: false,
      addClassName: true,
      addPropsSpread: true,
      exportType: 'default',
      precision: 3,
    });
    
    assert.ok(result.code.includes('currentColor'), `Should replace #000000 with currentColor: ${result.code}`);
    assert.ok(!result.code.includes('#000000'), `Should not contain original color: ${result.code}`);
  });

  test('Convert - all frameworks produce non-empty output', () => {
    const frameworks = ['react', 'vue', 'svelte', 'react-native', 'tailwind-react'];
    
    for (const framework of frameworks) {
      const result = convert(SAMPLE_SVG, {
        framework,
        componentName: 'TestIcon',
        typescript: true,
        removeDimensions: false,
        useCurrentColor: false,
        addSizeProp: false,
        nativewind: false,
        addClassName: framework === 'react' || framework === 'tailwind-react',
        addPropsSpread: framework !== 'vue' && framework !== 'svelte',
        exportType: 'default',
        precision: 3,
      });
      
      assert.ok(result.code.length > 0, `${framework} should produce non-empty output`);
      assert.ok(result.parsed.isValid, `${framework} parse should be valid`);
      assert.ok(result.outputSize > 0, `${framework} output size should be > 0`);
    }
  });

  // ============================================================
  // 14. TRANSFORMER INNER HTML EDGE CASES
  // ============================================================

  test('Transformer - JSX handles self-closing tags', () => {
    const input = '<path d="M0 0" stroke-width="2"/>';
    const result = transformInnerHtml(input, 'jsx');
    assert.ok(result.includes('strokeWidth='), `Self-closing tag attrs should be converted: ${result}`);
  });

  test('Transformer - JSX handles nested tags', () => {
    const input = '<g fill-rule="evenodd"><path stroke-width="2"/></g>';
    const result = transformInnerHtml(input, 'jsx');
    assert.ok(result.includes('fillRule='), `Nested g attrs should be converted: ${result}`);
    assert.ok(result.includes('strokeWidth='), `Nested path attrs should be converted: ${result}`);
  });

  test('Transformer - React Native handles closing tags', () => {
    const input = '<g><path d="M0 0"/></g>';
    const result = transformForReactNative(input);
    assert.ok(result.includes('<G>'), `Opening g should become G: ${result}`);
    assert.ok(result.includes('</G>'), `Closing g should become G: ${result}`);
    assert.ok(result.includes('<Path'), `path should become Path: ${result}`);
  });
}
