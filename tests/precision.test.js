import test from 'node:test';
import assert from 'node:assert';
import { truncatePath, truncateNumberStrings } from '../src/lib/engine/precision.ts';

test('Precision Truncation - truncateNumberStrings', () => {
  assert.strictEqual(truncateNumberStrings('10.1234 20.9876', 2), '10.12 20.99');
  assert.strictEqual(truncateNumberStrings('-5.555, 6.666px', 1), '-5.6, 6.7px');
  assert.strictEqual(truncateNumberStrings('1e-5', 2), '0');
  assert.strictEqual(truncateNumberStrings('1e-5', 6), '0.00001');
});

test('Precision Truncation - truncatePath', () => {
  // Simple path
  assert.strictEqual(truncatePath('M 10.123 20.456 L 30.789 40.0', 1), 'M 10.1 20.5 L 30.8 40');
  
  // Implicit adjacencies that need spaces
  assert.strictEqual(truncatePath('M10.123-20.456L30.789.456', 2), 'M10.12-20.46L30.79 0.46');
  
  // Verify that an injected space happens for things that would otherwise merge illegally
  assert.strictEqual(truncatePath('M 10.5.6', 0), 'M 11 1'); // 10.5 -> 11, .6 -> 1

  // Arc command with flags!
  assert.strictEqual(truncatePath('A10.123,10.123,0,015,-10', 1), 'A10.1,10.1,0,01 5,-10');
  
  // Arc command with adjacent decimals
  assert.strictEqual(truncatePath('a 10 10 45.123 1 0 20.123 30.456', 1), 'a 10 10 45.1 1 0 20.1 30.5');

  // Multi arc command! (multiple sets of 7 arguments)
  assert.strictEqual(
    truncatePath('A 10 10 0 1 1 20 20 10 10 0 0 0 30 30', 2), 
    'A 10 10 0 1 1 20 20 10 10 0 0 0 30 30'
  );
  
  // Random SVG path snippet from Figma
  const figmaPath = 'M10.12345 20.98765A5.123 5.123 0 0115.1234 25.9876L20 20';
  const expectedPath = 'M10.12 20.99A5.12 5.12 0 01 15.12 25.99L20 20';
  assert.strictEqual(truncatePath(figmaPath, 2), expectedPath);
});
