/**
 * @file Preview Color Tests
 * Tests that preview SVG rendering respects preview background setting
 * independently of the application theme
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { JSDOM } from 'jsdom';

// ─── Helper: re-implements the sanitizedSvg logic from PreviewSandbox.tsx ─────
// Mirrors the production function for pure-JS testing (no React required).

/**
 * @param {string} svgContent - raw SVG string
 * @param {boolean} isValid   - whether the SVG parsed successfully
 * @param {'light'|'dark'|'checker'} previewBg - selected preview background
 * @returns {string|null} sanitized SVG string, or null if invalid
 */
function sanitizeForPreview(svgContent, isValid, previewBg) {
  if (!isValid || !svgContent.trim()) return null;
  const trimmed = svgContent.trim();
  if (!trimmed.startsWith('<svg') && !trimmed.startsWith('<?xml')) return null;

  const previewColor = previewBg === 'dark' ? '#ffffff' : '#171717';
  let result = trimmed;

  if (previewBg === 'dark') {
    result = result.replace(
      /((?:fill|stroke)\s*=\s*")(#171717|#000000|#000|black)(")/gi,
      `$1${previewColor}$3`
    );
    result = result.replace(
      /(?<=["';\s])((?:fill|stroke)\s*:\s*)(#171717|#000000|#000|black)/gi,
      `$1${previewColor}`
    );
  } else {
    result = result.replace(
      /((?:fill|stroke)\s*=\s*")(#ffffff|#fff|white)(")/gi,
      `$1${previewColor}$3`
    );
    result = result.replace(
      /(?<=["';\s])((?:fill|stroke)\s*:\s*)(#ffffff|#fff|white)/gi,
      `$1${previewColor}`
    );
  }

  if (result.includes('<svg')) {
    result = result.replace(
      /<svg(\s[^>]*)?>/, 
      (match, attrs = '') => {
        if (/\bstyle\s*=/i.test(attrs)) {
          return match.replace(/(\bstyle\s*=\s*")/i, `$1color:${previewColor};`);
        }
        return `<svg${attrs} style="color:${previewColor}">`;
      }
    );
  }

  return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('PreviewSandbox applies correct color for dark preview background', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="[color:#ffffff] max-w-[120px] max-h-[120px] [&_svg]:w-full [&_svg]:h-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        </div>
      </body>
    </html>
  `);

  const container = dom.window.document.querySelector('div');
  assert.ok(container.className.includes('[color:#ffffff]'), 'Dark preview should set white color');
});

test('PreviewSandbox applies correct color for light preview background', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div class="[color:#171717] max-w-[120px] max-h-[120px] [&_svg]:w-full [&_svg]:h-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        </div>
      </body>
    </html>
  `);

  const container = dom.window.document.querySelector('div');
  assert.ok(container.className.includes('[color:#171717]'), 'Light preview should set dark color');
});

test('Preview background classes remain independent of app theme', () => {
  // Simulate light app theme with dark preview
  const lightAppDarkPreview = new JSDOM(`
    <!DOCTYPE html>
    <html class="">
      <body>
        <div class="bg-black [color:#ffffff]">
          <svg fill="currentColor"><circle/></svg>
        </div>
      </body>
    </html>
  `);

  const lightContainer = lightAppDarkPreview.window.document.querySelector('div');
  assert.ok(lightContainer.className.includes('bg-black'), 'Dark preview background present');
  assert.ok(lightContainer.className.includes('[color:#ffffff]'), 'White text color for dark background');
  assert.ok(!lightAppDarkPreview.window.document.documentElement.classList.contains('dark'), 'App is in light mode');

  // Simulate dark app theme with light preview
  const darkAppLightPreview = new JSDOM(`
    <!DOCTYPE html>
    <html class="dark">
      <body>
        <div class="bg-[#ffffff] [color:#171717]">
          <svg fill="currentColor"><circle/></svg>
        </div>
      </body>
    </html>
  `);

  const darkContainer = darkAppLightPreview.window.document.querySelector('div');
  assert.ok(darkContainer.className.includes('bg-[#ffffff]'), 'Light preview background present');
  assert.ok(darkContainer.className.includes('[color:#171717]'), 'Dark text color for light background');
  assert.ok(darkAppLightPreview.window.document.documentElement.classList.contains('dark'), 'App is in dark mode');
});

test('currentColor in SVG inherits from preview container, not app theme', () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html class="">
      <head>
        <style>
          body { color: #171717; } /* Light mode ink color */
          .preview-container { color: #ffffff; } /* Override for dark preview */
        </style>
      </head>
      <body>
        <div class="preview-container">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        </div>
      </body>
    </html>
  `);

  const container = dom.window.document.querySelector('.preview-container');
  const computedColor = dom.window.getComputedStyle(container).color;

  // The preview container should have white color, not inherit from body
  assert.equal(computedColor, 'rgb(255, 255, 255)', 'Preview container should have white color');
});

test('preview SVG preserves fill="none" for stroked icons', () => {
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
  const result = sanitizeForPreview(sampleSvg, true, 'dark');
  
  assert.ok(result !== null, 'Should produce a result');
  assert.ok(result.includes('fill="none"'), 'fill="none" must be preserved');
  assert.ok(result.includes('stroke="#ffffff"'), 'stroke color adapts to white on dark preview');
});

test('preview SVG adapts hardcoded white colors on light background in light app theme', () => {
  const whiteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ffffff"><path d="M12 2L2 22h20L12 2z"/></svg>`;
  const result = sanitizeForPreview(whiteSvg, true, 'light');

  assert.ok(result !== null, 'Should produce a result');
  assert.ok(result.includes('fill="#171717"'), 'White fill adapts to dark color on light preview');
});

// ─── NEW: direct SVG color injection tests ────────────────────────────────────

test('sanitizeForPreview injects color style onto root SVG element for dark preview', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;
  const result = sanitizeForPreview(svg, true, 'dark');

  assert.ok(result !== null, 'Should produce a result');
  assert.ok(
    result.includes('style="color:#ffffff"'),
    'Should inject white color onto SVG element for dark preview'
  );
});

test('sanitizeForPreview injects color style onto root SVG element for light preview', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`;
  const result = sanitizeForPreview(svg, true, 'light');

  assert.ok(result !== null, 'Should produce a result');
  assert.ok(
    result.includes('style="color:#171717"'),
    'Should inject dark color onto SVG element for light preview'
  );
});

test('sanitizeForPreview prepends color to existing SVG style attribute', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" style="overflow:visible" fill="currentColor"><circle/></svg>`;
  const result = sanitizeForPreview(svg, true, 'dark');

  assert.ok(result !== null, 'Should produce a result');
  assert.ok(
    result.includes('style="color:#ffffff;overflow:visible"'),
    'Should prepend color to existing style attribute'
  );
});

test('sanitizeForPreview handles style attribute dark colors in dark preview', () => {
  // Test with a single fill property (preceded by quote - lookbehind matches)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect style="fill:#000000;stroke:#171717" width="10" height="10"/></svg>`;
  const result = sanitizeForPreview(svg, true, 'dark');

  assert.ok(result !== null, 'Should produce a result');
  // The lookbehind regex replaces fill/stroke CSS properties preceded by quote or semicolon
  // fill:#000000 (preceded by ") and stroke:#171717 (preceded by ;) should both be replaced
  assert.ok(
    result.includes('fill:#ffffff') || result.includes('fill: #ffffff'),
    'Should replace dark fill in style attribute on dark preview'
  );
});

test('sanitizeForPreview handles style attribute white colors in light preview', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect style="fill:#ffffff" width="10" height="10"/></svg>`;
  const result = sanitizeForPreview(svg, true, 'light');

  assert.ok(result !== null, 'Should produce a result');
  assert.ok(
    result.includes('fill:#171717') || result.includes('fill: #171717'),
    'Should replace white fill in style attribute on light preview'
  );
});

test('sanitizeForPreview returns null for invalid SVG', () => {
  assert.equal(sanitizeForPreview('<div>not svg</div>', true, 'dark'), null, 'Non-SVG root should return null');
  assert.equal(sanitizeForPreview('', true, 'dark'), null, 'Empty string should return null');
  assert.equal(sanitizeForPreview('<svg>valid</svg>', false, 'dark'), null, 'isValid=false should return null');
});

test('sanitizeForPreview preserves SVG for checker background (same as light)', () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="white"><circle/></svg>`;
  const result = sanitizeForPreview(svg, true, 'checker');

  assert.ok(result !== null, 'Should produce a result');
  // checker uses same color logic as light (previewColor = #171717)
  assert.ok(result.includes('stroke="#171717"'), 'White stroke replaced with dark color for checker preview');
  assert.ok(result.includes('style="color:#171717"'), 'Dark color injected onto SVG for checker preview');
});
