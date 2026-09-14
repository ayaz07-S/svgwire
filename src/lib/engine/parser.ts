/**
 * Universal SVG Parser
 * Uses the browser's native DOMParser to extract SVG data.
 * Zero dependencies. Zero backend.
 */

import { truncatePath, truncateNumberStrings } from './precision.ts';

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
export interface ParseOptions {
  componentName?: string;
  precision?: number;
}

/**
 * Generates a short, stable hash for a given string.
 */
function generateShortHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 4);
}

export function parseSvg(rawSvg: string, options?: ParseOptions): ParsedSvg {
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

    // Phase 1: Deterministic ID Collision Scrambler
    const idElements = svgEl.querySelectorAll('[id]');
    if (idElements.length > 0) {
      const namePart = (options?.componentName || 'icon').toLowerCase().replace(/[^a-z0-9]/g, '');
      const hashPart = generateShortHash(trimmed);
      const prefix = `svgwire-${namePart}-${hashPart}-`;
      const idMap = new Map<string, string>(); // oldId -> newId

      // 1. Rewrite IDs and build map
      idElements.forEach(el => {
        const oldId = el.id;
        const newId = `${prefix}${oldId}`;
        el.id = newId;
        idMap.set(oldId, newId);
      });

      // 2. Find and rewrite all references to these IDs
      const allElements = svgEl.querySelectorAll('*');
      allElements.forEach(el => {
        // Rewrite attributes (e.g. fill="url(#oldId)", xlink:href="#oldId")
        for (const attr of Array.from(el.attributes)) {
          let val = attr.value;
          if (val.includes('#')) {
            for (const [oldId, newId] of idMap.entries()) {
              // Replace url(#oldId), url('#oldId'), url("#oldId")
              const urlRegex = new RegExp(`url\\(['"]?#${oldId}['"]?\\)`, 'g');
              val = val.replace(urlRegex, `url(#${newId})`);

              // Replace exact #oldId (used in href, xlink:href)
              if (val === `#${oldId}`) {
                val = `#${newId}`;
              }
            }
            if (val !== attr.value) {
              el.setAttribute(attr.name, val);
            }
          }
        }

        // Rewrite inline style attributes
        const styleAttr = el.getAttribute('style');
        if (styleAttr && styleAttr.includes('#')) {
          let newStyle = styleAttr;
          for (const [oldId, newId] of idMap.entries()) {
            const urlRegex = new RegExp(`url\\(['"]?#${oldId}['"]?\\)`, 'g');
            newStyle = newStyle.replace(urlRegex, `url(#${newId})`);
          }
          if (newStyle !== styleAttr) {
            el.setAttribute('style', newStyle);
          }
        }
      });

      // Rewrite <style> block contents
      const styleElements = svgEl.querySelectorAll('style');
      styleElements.forEach(styleEl => {
        let cssText = styleEl.textContent || '';
        if (cssText.includes('#')) {
          for (const [oldId, newId] of idMap.entries()) {
            const urlRegex = new RegExp(`url\\(['"]?#${oldId}['"]?\\)`, 'g');
            cssText = cssText.replace(urlRegex, `url(#${newId})`);
          }
          styleEl.textContent = cssText;
        }
      });
    }

    // Phase 1.5: Remove redundant namespaces from inner elements
    const allInnerElements = svgEl.querySelectorAll('*');
    allInnerElements.forEach(el => {
      el.removeAttribute('xmlns');
      el.removeAttribute('xmlns:xlink');
      el.removeAttribute('xml:space');
      el.removeAttribute('version');
    });

    // Phase 1.6: Coordinate Precision Truncation
    if (typeof options?.precision === 'number') {
      const precision = options.precision;
      const coordsAttrs = ['cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'points', 'transform', 'width', 'height'];
      const elementsToTruncate = [svgEl, ...Array.from(allInnerElements)];

      elementsToTruncate.forEach(el => {
        if (el.hasAttribute('d')) {
          el.setAttribute('d', truncatePath(el.getAttribute('d')!, precision));
        }
        if (el.hasAttribute('viewBox')) {
          el.setAttribute('viewBox', truncateNumberStrings(el.getAttribute('viewBox')!, precision));
        }
        for (const attr of coordsAttrs) {
          if (el.hasAttribute(attr)) {
            el.setAttribute(attr, truncateNumberStrings(el.getAttribute(attr)!, precision));
          }
        }
      });
    }

    // Extract attributes
    const attributes: Record<string, string> = {};
    for (const attr of Array.from(svgEl.attributes)) {
      attributes[attr.name] = attr.value;
    }

    // Clean up any remaining xmlns declarations that the browser's XMLSerializer might forcibly inject
    const cleanInnerHTML = svgEl.innerHTML.replace(/\sxmlns(:\w+)?="[^"]*"/g, '');

    return {
      attributes,
      innerHTML: cleanInnerHTML,
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
