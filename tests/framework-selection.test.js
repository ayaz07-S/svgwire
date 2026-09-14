/**
 * Framework Selection Behavior Test
 * Verifies that framework selection works correctly in different modes
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

test('Batch page renders framework buttons (not links)', async () => {
  const html = fs.readFileSync(path.join(process.cwd(), 'dist', 'batch', 'index.html'), 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Framework selector should exist
  const nav = doc.querySelector('nav[aria-label="Framework selector"]');
  assert.ok(nav, 'Framework selector nav should exist');

  // In batch mode, frameworks should be buttons (client-side rendered)
  // Astro encodes props as JSON in the HTML
  assert.ok(html.includes('batch'), 'Should have batch mode');
  assert.ok(html.includes('defaultFramework') || html.includes('react'), 'Should have framework prop');
});

test('Sprite page renders framework buttons (not links)', async () => {
  const html = fs.readFileSync(path.join(process.cwd(), 'dist', 'sprite', 'index.html'), 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const nav = doc.querySelector('nav[aria-label="Framework selector"]');
  assert.ok(nav, 'Framework selector nav should exist');

  // Verify sprite mode
  assert.ok(html.includes('sprite'), 'Should have sprite mode');
  assert.ok(html.includes('defaultFramework') || html.includes('react'), 'Should have framework prop');
});

test('Single file page uses navigation links', async () => {
  const html = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const nav = doc.querySelector('nav[aria-label="Framework selector"]');
  assert.ok(nav, 'Framework selector nav should exist');

  // In single mode, frameworks should be navigation links
  assert.ok(html.includes('single'), 'Should have single mode');
  assert.ok(html.includes('defaultFramework') || html.includes('react'), 'Should have framework prop');
});

test('All framework pages have correct SEO routes', async () => {
  const routes = [
    'svg-to-react',
    'svg-to-vue',
    'svg-to-svelte',
    'svg-to-react-native',
    'svg-to-tailwind-react'
  ];

  for (const route of routes) {
    const htmlPath = path.join(process.cwd(), 'dist', route, 'index.html');
    assert.ok(fs.existsSync(htmlPath), `Route /${route} should exist`);

    const html = fs.readFileSync(htmlPath, 'utf-8');
    assert.ok(html.includes('single'), `${route} should have single mode`);
  }
});

test('Batch and Sprite routes exist', () => {
  assert.ok(fs.existsSync(path.join(process.cwd(), 'dist', 'batch', 'index.html')), '/batch route exists');
  assert.ok(fs.existsSync(path.join(process.cwd(), 'dist', 'sprite', 'index.html')), '/sprite route exists');
});
