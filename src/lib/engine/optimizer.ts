/**
 * SVG Optimizer
 * Applies optional transformations: remove dimensions, currentColor replacement, size prop.
 */

export interface OptimizeOptions {
  removeDimensions: boolean;
  useCurrentColor: boolean;
  addSizeProp: boolean;
}

/**
 * Color patterns to match for currentColor replacement.
 * Matches hex, rgb, rgba, hsl, hsla, and named colors commonly used in fills/strokes.
 */
const COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,8})|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;

/** Common fill/stroke values that should NOT be replaced with currentColor */
const PRESERVE_VALUES = new Set(['none', 'transparent', 'inherit', 'currentColor', 'currentcolor', 'url(']);

/**
 * Remove width and height attributes from an attributes record.
 */
export function removeDimensions(attrs: Record<string, string>): Record<string, string> {
  const result = { ...attrs };
  delete result['width'];
  delete result['height'];
  return result;
}

/**
 * Replace color values with currentColor in fill and stroke attributes.
 */
export function replaceWithCurrentColor(attrs: Record<string, string>): Record<string, string> {
  const result = { ...attrs };

  for (const key of ['fill', 'stroke']) {
    if (result[key] && !PRESERVE_VALUES.has(result[key]) && !result[key].startsWith('url(')) {
      result[key] = 'currentColor';
    }
  }

  return result;
}

/**
 * Replace color values in innerHTML (nested elements' fill/stroke attributes).
 */
export function replaceColorsInHtml(html: string): string {
  // Replace fill="<color>" and stroke="<color>" with currentColor
  return html.replace(
    /((?:fill|stroke)\s*=\s*")([^"]+)(")/g,
    (match, prefix, value, suffix) => {
      if (PRESERVE_VALUES.has(value) || value.startsWith('url(')) {
        return match;
      }
      if (COLOR_PATTERN.test(value)) {
        COLOR_PATTERN.lastIndex = 0; // Reset regex state
        return `${prefix}currentColor${suffix}`;
      }
      return match;
    }
  );
}

/**
 * Apply all optimizations to attributes and innerHTML.
 */
export function optimizeSvg(
  attrs: Record<string, string>,
  innerHTML: string,
  options: OptimizeOptions
): { attrs: Record<string, string>; innerHTML: string } {
  let optimizedAttrs = { ...attrs };
  let optimizedHtml = innerHTML;

  if (options.removeDimensions) {
    optimizedAttrs = removeDimensions(optimizedAttrs);
  }

  if (options.useCurrentColor) {
    optimizedAttrs = replaceWithCurrentColor(optimizedAttrs);
    optimizedHtml = replaceColorsInHtml(optimizedHtml);
  }

  return { attrs: optimizedAttrs, innerHTML: optimizedHtml };
}
