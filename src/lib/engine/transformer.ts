/**
 * SVG Attribute Transformer
 * Handles the conversion of SVG attributes between different framework conventions.
 */

/** SVG attributes that need kebab-case → camelCase conversion for JSX */
const KEBAB_TO_CAMEL_MAP: Record<string, string> = {
  'accent-height': 'accentHeight',
  'alignment-baseline': 'alignmentBaseline',
  'arabic-form': 'arabicForm',
  'baseline-shift': 'baselineShift',
  'cap-height': 'capHeight',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'color-interpolation': 'colorInterpolation',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'color-profile': 'colorProfile',
  'dominant-baseline': 'dominantBaseline',
  'enable-background': 'enableBackground',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-size-adjust': 'fontSizeAdjust',
  'font-stretch': 'fontStretch',
  'font-style': 'fontStyle',
  'font-variant': 'fontVariant',
  'font-weight': 'fontWeight',
  'glyph-name': 'glyphName',
  'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  'horiz-adv-x': 'horizAdvX',
  'horiz-origin-x': 'horizOriginX',
  'image-rendering': 'imageRendering',
  'letter-spacing': 'letterSpacing',
  'lighting-color': 'lightingColor',
  'marker-end': 'markerEnd',
  'marker-mid': 'markerMid',
  'marker-start': 'markerStart',
  'overline-position': 'overlinePosition',
  'overline-thickness': 'overlineThickness',
  'paint-order': 'paintOrder',
  'panose-1': 'panose1',
  'pointer-events': 'pointerEvents',
  'rendering-intent': 'renderingIntent',
  'shape-rendering': 'shapeRendering',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'strikethrough-position': 'strikethroughPosition',
  'strikethrough-thickness': 'strikethroughThickness',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'text-anchor': 'textAnchor',
  'text-decoration': 'textDecoration',
  'text-rendering': 'textRendering',
  'underline-position': 'underlinePosition',
  'underline-thickness': 'underlineThickness',
  'unicode-bidi': 'unicodeBidi',
  'unicode-range': 'unicodeRange',
  'units-per-em': 'unitsPerEm',
  'v-alphabetic': 'vAlphabetic',
  'v-hanging': 'vHanging',
  'v-ideographic': 'vIdeographic',
  'v-mathematical': 'vMathematical',
  'vert-adv-y': 'vertAdvY',
  'vert-origin-x': 'vertOriginX',
  'vert-origin-y': 'vertOriginY',
  'word-spacing': 'wordSpacing',
  'writing-mode': 'writingMode',
  'x-height': 'xHeight',
  'xlink:actuate': 'xlinkActuate',
  'xlink:arcrole': 'xlinkArcrole',
  'xlink:href': 'xlinkHref',
  'xlink:role': 'xlinkRole',
  'xlink:show': 'xlinkShow',
  'xlink:title': 'xlinkTitle',
  'xlink:type': 'xlinkType',
  'xml:base': 'xmlBase',
  'xml:lang': 'xmlLang',
  'xml:space': 'xmlSpace',
  'xmlns:xlink': 'xmlnsXlink',
};

/** HTML attributes that differ in JSX */
const HTML_ATTR_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
};

/** Attributes to always skip */
const SKIP_ATTRS = new Set(['xmlns', 'xmlns:xlink', 'version', 'xml:space']);

export type TransformMode = 'jsx' | 'kebab';

/**
 * Transform a single attribute name for the target framework.
 * - jsx: camelCase (React, React Native)
 * - kebab: keep as-is (Vue, Svelte)
 */
export function transformAttrName(name: string, mode: TransformMode): string | null {
  if (SKIP_ATTRS.has(name)) return null;

  if (mode === 'jsx') {
    if (HTML_ATTR_MAP[name]) return HTML_ATTR_MAP[name];
    if (KEBAB_TO_CAMEL_MAP[name]) return KEBAB_TO_CAMEL_MAP[name];
    // Generic kebab to camelCase fallback for data-* and aria-* we keep as-is
    if (name.startsWith('data-') || name.startsWith('aria-')) return name;
    // Convert remaining kebab-case
    if (name.includes('-')) {
      return name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    }
    return name;
  }

  // kebab mode: keep everything as-is except class → class (no change needed)
  return name;
}

/**
 * Transform SVG innerHTML: convert attribute names on all nested elements.
 */
export function transformInnerHtml(html: string, mode: TransformMode): string {
  if (mode === 'kebab') return html;

  // For JSX mode, we need to transform attributes in nested elements
  // Use regex to find all attribute names in tags
  return html.replace(
    /(<\w+(?:\s+[a-zA-Z][a-zA-Z0-9:_-]*(?:="[^"]*")?)*)\s*/g,
    (match) => {
      return match.replace(
        /\s([a-zA-Z][a-zA-Z0-9:_-]*)(?==)/g,
        (attrMatch, attrName) => {
          const transformed = transformAttrName(attrName, mode);
          if (transformed === null) return ''; // skip attribute
          return ` ${transformed}`;
        }
      );
    }
  );
}

/**
 * Build an attributes string from a record.
 */
export function buildAttrString(
  attrs: Record<string, string>,
  mode: TransformMode,
  indent: string = '  '
): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(attrs)) {
    const transformed = transformAttrName(key, mode);
    if (transformed === null) continue;
    lines.push(`${indent}${transformed}="${value}"`);
  }

  return lines.join('\n');
}

/** React Native SVG element name mapping */
export const RN_ELEMENT_MAP: Record<string, string> = {
  svg: 'Svg',
  path: 'Path',
  circle: 'Circle',
  rect: 'Rect',
  line: 'Line',
  polyline: 'Polyline',
  polygon: 'Polygon',
  ellipse: 'Ellipse',
  g: 'G',
  defs: 'Defs',
  clipPath: 'ClipPath',
  linearGradient: 'LinearGradient',
  radialGradient: 'RadialGradient',
  stop: 'Stop',
  mask: 'Mask',
  use: 'Use',
  text: 'SvgText',
  tspan: 'TSpan',
  image: 'Image',
  symbol: 'Symbol',
  pattern: 'Pattern',
  marker: 'Marker',
  foreignObject: 'ForeignObject',
};

/**
 * Transform innerHTML for React Native: replace element names with RN equivalents.
 */
export function transformForReactNative(html: string): string {
  let result = html;

  // Transform element names (both opening and closing tags)
  for (const [svgTag, rnTag] of Object.entries(RN_ELEMENT_MAP)) {
    // Opening tags
    const openRegex = new RegExp(`<${svgTag}(\\s|>|/>)`, 'g');
    result = result.replace(openRegex, `<${rnTag}$1`);
    // Closing tags
    const closeRegex = new RegExp(`</${svgTag}>`, 'g');
    result = result.replace(closeRegex, `</${rnTag}>`);
  }

  return result;
}
