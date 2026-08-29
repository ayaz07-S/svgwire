/**
 * Universal SVG Parser
 * Uses the browser's native DOMParser to extract SVG data.
 * Zero dependencies. Zero backend.
 */

export interface ParsedSvg {
  /** The root SVG element's attributes */
  attributes: Record<string, string>;
  /** The inner HTML content of the SVG */
  innerHTML: string;
  /** The full outer HTML of the SVG */
  outerHTML: string;
  /** The viewBox value if present */
  viewBox: string | null;
  /** Original width attribute */
  width: string | null;
  /** Original height attribute */
  height: string | null;
  /** Whether the SVG is valid */
  isValid: boolean;
  /** Error message if invalid */
  error: string | null;
  /** Original byte size */
  originalSize: number;
}

export function parseSvg(rawSvg: string): ParsedSvg {
  const trimmed = rawSvg.trim();

  if (!trimmed) {
    return {
      attributes: {},
      innerHTML: '',
      outerHTML: '',
      viewBox: null,
      width: null,
      height: null,
      isValid: false,
      error: 'Empty input',
      originalSize: 0,
    };
  }

  const originalSize = new Blob([trimmed]).size;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'image/svg+xml');

    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return {
        attributes: {},
        innerHTML: '',
        outerHTML: trimmed,
        viewBox: null,
        width: null,
        height: null,
        isValid: false,
        error: 'Invalid SVG: ' + (parseError.textContent?.slice(0, 100) ?? 'Parse error'),
        originalSize,
      };
    }

    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      return {
        attributes: {},
        innerHTML: '',
        outerHTML: trimmed,
        viewBox: null,
        width: null,
        height: null,
        isValid: false,
        error: 'No <svg> element found',
        originalSize,
      };
    }

    // Extract attributes
    const attributes: Record<string, string> = {};
    for (const attr of Array.from(svgEl.attributes)) {
      attributes[attr.name] = attr.value;
    }

    return {
      attributes,
      innerHTML: svgEl.innerHTML,
      outerHTML: svgEl.outerHTML,
      viewBox: attributes['viewBox'] ?? attributes['viewbox'] ?? null,
      width: attributes['width'] ?? null,
      height: attributes['height'] ?? null,
      isValid: true,
      error: null,
      originalSize,
    };
  } catch (e) {
    return {
      attributes: {},
      innerHTML: '',
      outerHTML: trimmed,
      viewBox: null,
      width: null,
      height: null,
      isValid: false,
      error: e instanceof Error ? e.message : 'Unknown parse error',
      originalSize,
    };
  }
}
