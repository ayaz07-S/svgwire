/**
 * Vue 3 Template Adapter
 * Generates a Vue 3 SFC from parsed SVG data.
 */

import type { ParsedSvg } from '../engine/parser';
import { optimizeSvg, type OptimizeOptions } from '../engine/optimizer';

export interface VueOptions extends OptimizeOptions {
  componentName: string;
  typescript: boolean;
}

export function generateVue(parsed: ParsedSvg, options: VueOptions): string {
  const { attrs, innerHTML } = optimizeSvg(parsed.attributes, parsed.innerHTML, options);

  // Build SVG attributes (Vue uses kebab-case — the native SVG format)
  const svgAttrs: string[] = [];
  const skipAttrs = new Set(['xmlns', 'xmlns:xlink', 'version', 'xml:space']);

  for (const [key, value] of Object.entries(attrs)) {
    if (skipAttrs.has(key)) continue;
    if (options.removeDimensions && (key === 'width' || key === 'height')) continue;
    svgAttrs.push(`    ${key}="${value}"`);
  }

  svgAttrs.push('    v-bind="$attrs"');

  const lang = options.typescript ? ' lang="ts"' : '';

  const lines: string[] = [];

  lines.push(`<script setup${lang}>`);
  if (options.typescript) {
    lines.push(`interface Props {`);
    lines.push(`  size?: number | string;`);
    lines.push(`}`);
    lines.push('');
    lines.push('defineProps<Props>();');
  }
  lines.push('defineOptions({');
  lines.push(`  name: '${options.componentName}',`);
  lines.push('  inheritAttrs: false,');
  lines.push('});');
  lines.push('</script>');
  lines.push('');
  lines.push('<template>');
  lines.push('  <svg');
  lines.push(svgAttrs.join('\n'));
  lines.push('  >');
  lines.push(`    ${innerHTML.trim()}`);
  lines.push('  </svg>');
  lines.push('</template>');

  return lines.join('\n');
}
