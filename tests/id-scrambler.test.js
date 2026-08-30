import test from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { parseSvg } from '../src/lib/engine/parser.ts';

const { window } = new JSDOM();
global.DOMParser = window.DOMParser;

test('ID collision scrambler', () => {
  const svg1 = `
    <svg width="24" height="24">
      <defs>
        <clipPath id="clip0_0">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
        <mask id="mask0_0">
          <circle cx="12" cy="12" r="10" fill="white"/>
        </mask>
      </defs>
      <g clip-path="url(#clip0_0)">
        <path d="M0 0h24v24H0z" mask="url(#mask0_0)"/>
      </g>
    </svg>
  `;

  const svg2 = `
    <svg width="24" height="24">
      <defs>
        <clipPath id="clip0_0">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
        <mask id="mask0_0">
          <circle cx="12" cy="12" r="10" fill="white"/>
        </mask>
      </defs>
      <g clip-path="url(#clip0_0)">
        <path d="M1 1h22v22H1z" mask="url(#mask0_0)"/>
      </g>
    </svg>
  `;

  const parsed1 = parseSvg(svg1, { componentName: 'IconOne' });
  const parsed2 = parseSvg(svg2, { componentName: 'IconTwo' });

  // Make sure we have new IDs
  assert.ok(!parsed1.outerHTML.includes('id="clip0_0"'));
  assert.ok(!parsed2.outerHTML.includes('id="clip0_0"'));

  // Extract the generated prefix/id
  const match1 = parsed1.outerHTML.match(/id="(svg2c-iconone-[^-]+-clip0_0)"/);
  const match2 = parsed2.outerHTML.match(/id="(svg2c-icontwo-[^-]+-clip0_0)"/);

  assert.ok(match1, 'IconOne should have generated ID');
  assert.ok(match2, 'IconTwo should have generated ID');

  assert.notStrictEqual(match1[1], match2[1], 'Generated IDs should be different between the two SVGs');

  // Verify references are correctly rewritten
  assert.ok(parsed1.outerHTML.includes(`clip-path="url(#${match1[1]})"`));
  assert.ok(parsed2.outerHTML.includes(`clip-path="url(#${match2[1]})"`));

  // Verify mask references
  const maskMatch1 = parsed1.outerHTML.match(/id="(svg2c-iconone-[^-]+-mask0_0)"/);
  const maskMatch2 = parsed2.outerHTML.match(/id="(svg2c-icontwo-[^-]+-mask0_0)"/);

  assert.ok(parsed1.outerHTML.includes(`mask="url(#${maskMatch1[1]})"`));
  assert.ok(parsed2.outerHTML.includes(`mask="url(#${maskMatch2[1]})"`));
});
