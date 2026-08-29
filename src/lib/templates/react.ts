/**
 * React Template Adapter
 * Generates a React component from parsed SVG data.
 */

import type { ParsedSvg } from '../engine/parser';
import { transformAttrName, transformInnerHtml } from '../engine/transformer';
import { optimizeSvg, type OptimizeOptions } from '../engine/optimizer';

export interface ReactOptions extends OptimizeOptions {
  componentName: string;
  typescript: boolean;
  exportType: 'default' | 'named';
  addClassName: boolean;
  addPropsSpread: boolean;
}

export function generateReact(parsed: ParsedSvg, options: ReactOptions): string {
  const { attrs, innerHTML } = optimizeSvg(parsed.attributes, parsed.innerHTML, options);

  // Transform attributes to camelCase
  const svgAttrs: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    const name = transformAttrName(key, 'jsx');
    if (name === null) continue;
    if (options.removeDimensions && (key === 'width' || key === 'height')) continue;
    svgAttrs.push(`      ${name}="${value}"`);
  }

  if (options.addClassName) {
    svgAttrs.push('      className={className}');
  }

  if (options.addPropsSpread) {
    svgAttrs.push('      {...props}');
  }

  const transformedInner = transformInnerHtml(innerHTML, 'jsx');
  const propsType = options.typescript ? `React.SVGProps<SVGSVGElement>` : '';

  const lines: string[] = [];

  if (options.typescript) {
    lines.push(`import type React from "react";`);
    lines.push('');
  }

  const propsParam = options.addClassName
    ? options.typescript
      ? `{ className, ...props }: ${propsType}`
      : '{ className, ...props }'
    : options.addPropsSpread
      ? options.typescript
        ? `props: ${propsType}`
        : 'props'
      : '';

  const fnSignature = `const ${options.componentName} = (${propsParam})`;
  const returnType = options.typescript ? ': React.ReactElement' : '';

  lines.push(`${fnSignature}${returnType} => {`);
  lines.push('  return (');
  lines.push(`    <svg`);
  lines.push(svgAttrs.join('\n'));
  lines.push(`    >`);
  lines.push(`      ${transformedInner.trim()}`);
  lines.push(`    </svg>`);
  lines.push('  );');
  lines.push('};');
  lines.push('');

  if (options.exportType === 'default') {
    lines.push(`export default ${options.componentName};`);
  } else {
    // Prepend export to function
    lines[lines.indexOf(`${fnSignature}${returnType} => {`)] =
      `export ${fnSignature}${returnType} => {`;
  }

  return lines.join('\n');
}
