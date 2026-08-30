import { parseSvg } from './src/lib/engine/parser.ts';
import { generateReact } from './src/lib/templates/react.ts';
import { toPascalCase } from './src/lib/utils.ts';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM();
global.DOMParser = window.DOMParser;
global.Blob = class Blob {
  constructor(content) {
    this.size = content.join('').length;
  }
};

const rawSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <g xmlns="http://www.w3.org/2000/svg" id="group1">
    <path d="M0 0h24v24H0z" fill="none"/>
  </g>
  <defs xmlns="http://www.w3.org/2000/svg">
    <linearGradient id="grad1"></linearGradient>
  </defs>
</svg>
`;

const componentName = toPascalCase('my-icon(1)');
console.log('--- PascalCase output ---');
console.log(componentName);

const parsed = parseSvg(rawSvg, { componentName });
console.log('\n--- Parsed innerHTML ---');
console.log(parsed.innerHTML);

const reactCode = generateReact(parsed, {
  componentName,
  typescript: true,
  exportType: 'default',
  addClassName: true,
  addPropsSpread: true,
  removeDimensions: false,
});

console.log('\n--- React output ---');
console.log(reactCode);
