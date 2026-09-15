/**
 * @file Framework Persistence Tests
 * Tests that framework selection persists across mode navigation
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { getSessionFramework, setSessionFramework } from '../src/lib/frameworkSession.ts';

// Mock sessionStorage for Node.js environment
class SessionStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  clear() {
    this.store = {};
  }
}

test('getSessionFramework returns null when no framework is stored', () => {
  global.sessionStorage = new SessionStorageMock();
  const framework = getSessionFramework();
  assert.equal(framework, null);
});

test('setSessionFramework stores framework in session storage', () => {
  global.sessionStorage = new SessionStorageMock();
  setSessionFramework('vue');
  const stored = getSessionFramework();
  assert.equal(stored, 'vue');
});

test('setSessionFramework updates framework selection', () => {
  global.sessionStorage = new SessionStorageMock();
  setSessionFramework('react');
  assert.equal(getSessionFramework(), 'react');

  setSessionFramework('svelte');
  assert.equal(getSessionFramework(), 'svelte');
});

test('getSessionFramework handles missing sessionStorage gracefully', () => {
  const originalSessionStorage = global.sessionStorage;
  global.sessionStorage = undefined;

  const framework = getSessionFramework();
  assert.equal(framework, null);

  global.sessionStorage = originalSessionStorage;
});

test('setSessionFramework handles missing sessionStorage gracefully', () => {
  const originalSessionStorage = global.sessionStorage;
  global.sessionStorage = undefined;

  // Should not throw
  assert.doesNotThrow(() => {
    setSessionFramework('vue');
  });

  global.sessionStorage = originalSessionStorage;
});

test('framework persistence simulates mode navigation', () => {
  global.sessionStorage = new SessionStorageMock();

  // User starts at Single File mode with React (default)
  assert.equal(getSessionFramework(), null);

  // User changes to Vue in Single File mode (/svg-to-vue)
  setSessionFramework('vue');
  assert.equal(getSessionFramework(), 'vue');

  // User navigates to Batch mode - should get Vue
  const batchFramework = getSessionFramework() || 'react';
  assert.equal(batchFramework, 'vue');

  // User navigates to Sprite mode - should still get Vue
  const spriteFramework = getSessionFramework() || 'react';
  assert.equal(spriteFramework, 'vue');

  // User changes to Svelte in Sprite mode
  setSessionFramework('svelte');

  // User navigates back to Batch - should get Svelte
  const batchFramework2 = getSessionFramework() || 'react';
  assert.equal(batchFramework2, 'svelte');
});

test('fresh direct session defaults to React for /batch and /sprite', () => {
  global.sessionStorage = new SessionStorageMock();

  // Fresh session - no framework saved
  assert.equal(getSessionFramework(), null);

  // Opening /batch defaults to react
  const batchDefault = getSessionFramework() || 'react';
  assert.equal(batchDefault, 'react');

  // Opening /sprite defaults to react
  const spriteDefault = getSessionFramework() || 'react';
  assert.equal(spriteDefault, 'react');
});

test('single-mode framework tab onClick writes sessionStorage before navigation', () => {
  global.sessionStorage = new SessionStorageMock();

  // Simulate what the Converter does on a single-mode page (React)
  // At page load, the useEffect writes the current page's framework
  setSessionFramework('react');
  assert.equal(getSessionFramework(), 'react');

  // Simulate user clicking the Vue tab in single mode:
  // The onClick handler calls setSessionFramework('vue') BEFORE the browser
  // navigates away to /svg-to-vue. This is the Bug 1 fix.
  setSessionFramework('vue');
  assert.equal(getSessionFramework(), 'vue', 'sessionStorage should be written with "vue" on link click');

  // When the Batch page now loads, it reads 'vue' from sessionStorage.
  const batchFramework = getSessionFramework() || 'react';
  assert.equal(batchFramework, 'vue', 'Batch page should initialize to vue after Vue link click');
});

test('selecting different frameworks sequentially updates sessionStorage correctly', () => {
  global.sessionStorage = new SessionStorageMock();

  const frameworks = ['react', 'vue', 'svelte', 'react-native', 'tailwind-react'];
  for (const fw of frameworks) {
    setSessionFramework(fw);
    assert.equal(getSessionFramework(), fw, `sessionStorage should reflect selected framework: ${fw}`);
  }
});

