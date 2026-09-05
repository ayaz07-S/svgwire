/**
 * Svelte 5 Template Adapter
 * Generates a Svelte 5 component with runes syntax from parsed SVG data.
 */

import type { ParsedSvg } from '../engine/parser.ts';
import { optimizeSvg, type OptimizeOptions } from '../engine/optimizer.ts';

export interface SvelteOptions extends OptimizeOptions {
  componentName: string;
  typescript: boolean;
}

export function generateSvelte(parsed: ParsedSvg, options: SvelteOptions): string {
  const { attrs, innerHTML } = optimizeSvg(parsed.attributes, parsed.innerHTML, options);

  // Build SVG attributes (Svelte uses standard HTML attributes)
  const svgAttrs: string[] = [];
  const skipAttrs = new Set(['xmlns', 'xmlns:xlink', 'version', 'xml:space']);

  for (const [key, value] of Object.entries(attrs)) {
    if (skipAttrs.has(key)) continue;
    if (options.removeDimensions && (key === 'width' || key === 'height')) continue;
    svgAttrs.push(`  ${key}="${value}"`);
  }

  svgAttrs.push('  {...restProps}');

  const lang = options.typescript ? ' lang="ts"' : '';

  const lines: string[] = [];

  lines.push(`<script${lang}>`);
  if (options.typescript) {
    lines.push(`  import type { SVGAttributes } from 'svelte/elements';`);
    lines.push('');
    lines.push(`  interface Props extends SVGAttributes<SVGSVGElement> {`);
    lines.push(`    size?: number | string;`);
    lines.push(`    class?: string;`);
    lines.push(`  }`);
    lines.push('');
    lines.push('  let { class: className, size, ...restProps }: Props = $props();');
  } else {
    lines.push('  let { class: className, size, ...restProps } = $props();');
  }
  lines.push('</script>');
  lines.push('');
  lines.push('<svg');
  lines.push(svgAttrs.join('\n'));
  lines.push(`  class={className}`);
  lines.push('>');
  lines.push(`  ${innerHTML.trim()}`);
  lines.push('</svg>');

  return lines.join('\n');
}
