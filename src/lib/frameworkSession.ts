/**
 * Session-persisted framework selection
 * Preserves the user's framework choice when navigating between converter modes.
 */

const STORAGE_KEY = 'svgwire-framework';

export function getSessionFramework(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSessionFramework(framework: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, framework);
  } catch {
    // ignore quota errors
  }
}
