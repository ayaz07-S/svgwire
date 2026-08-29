/**
 * React Native Template Adapter
 * Generates a React Native component using react-native-svg.
 */

import type { ParsedSvg } from '../engine/parser';
import { transformAttrName, transformForReactNative } from '../engine/transformer';
import { optimizeSvg, type OptimizeOptions } from '../engine/optimizer';

export interface ReactNativeOptions extends OptimizeOptions {
  componentName: string;
  typescript: boolean;
  nativewind: boolean;
}

/** Collect used RN SVG element names from innerHTML */
function collectRnImports(html: string): string[] {
  const rnElements = new Set<string>();
  const tagRegex = /<([A-Z][a-zA-Z]*)/g;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    rnElements.add(match[1]);
  }
  return Array.from(rnElements).sort();
}

export function generateReactNative(parsed: ParsedSvg, options: ReactNativeOptions): string {
  const { attrs, innerHTML } = optimizeSvg(parsed.attributes, parsed.innerHTML, options);

  // Transform inner HTML: camelCase attrs + RN element names
  let transformedInner = innerHTML;

  // First, transform attribute names to camelCase
  transformedInner = transformedInner.replace(
    /(<\w+)((?:\s+[a-zA-Z][a-zA-Z0-9:_-]*(?:="[^"]*")?)*)/g,
    (match, tag, attrsStr) => {
      if (!attrsStr) return match;
      const newAttrs = attrsStr.replace(
        /\s([a-zA-Z][a-zA-Z0-9:_-]*)=/g,
        (_: string, attrName: string) => {
          const transformed = transformAttrName(attrName, 'jsx');
          if (transformed === null) return ' ';
          return ` ${transformed}=`;
        }
      );
      return `${tag}${newAttrs}`;
    }
  );

  // Then transform element names to RN equivalents
  transformedInner = transformForReactNative(transformedInner);

  // Collect imports from transformed inner HTML
  const rnImports = collectRnImports(transformedInner);

  // Build root Svg attributes
  const svgAttrs: string[] = [];
  const skipAttrs = new Set(['xmlns', 'xmlns:xlink', 'version', 'xml:space', 'class']);

  for (const [key, value] of Object.entries(attrs)) {
    if (skipAttrs.has(key)) continue;
    if (options.removeDimensions && (key === 'width' || key === 'height')) continue;
    const name = transformAttrName(key, 'jsx');
    if (name === null) continue;
    svgAttrs.push(`      ${name}="${value}"`);
  }

  svgAttrs.push('      {...props}');

  const lines: string[] = [];

  // Imports
  if (options.typescript) {
    lines.push(`import type React from "react";`);
  }
  const allImports = ['Svg', ...rnImports.filter(i => i !== 'Svg')];
  lines.push(`import { ${allImports.join(', ')} } from "react-native-svg";`);

  if (options.nativewind) {
    lines.push(`import { styled } from "nativewind";`);
  }

  lines.push('');

  if (options.typescript) {
    lines.push('interface Props {');
    lines.push('  size?: number;');
    lines.push('  color?: string;');
    lines.push('  [key: string]: unknown;');
    lines.push('}');
    lines.push('');
  }

  const propsParam = options.typescript
    ? '{ size = 24, color = "currentColor", ...props }: Props'
    : '{ size = 24, color = "currentColor", ...props }';

  lines.push(`const ${options.componentName} = (${propsParam}) => {`);
  lines.push('  return (');
  lines.push('    <Svg');
  lines.push(svgAttrs.join('\n'));
  lines.push('      width={size}');
  lines.push('      height={size}');
  lines.push('    >');
  lines.push(`      ${transformedInner.trim()}`);
  lines.push('    </Svg>');
  lines.push('  );');
  lines.push('};');
  lines.push('');

  if (options.nativewind) {
    lines.push(`export default styled(${options.componentName});`);
  } else {
    lines.push(`export default ${options.componentName};`);
  }

  return lines.join('\n');
}
