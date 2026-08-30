/**
 * Utility helpers: clipboard, download, file reading.
 */

/** Copy text to clipboard with fallback */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/** Download text as a file */
export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Read a File object as text */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Convert a component name to PascalCase */
export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(.)/, (_, char) => char.toUpperCase());
}

/** Convert a file path to a valid SVG sprite symbol ID (e.g., solid/home.svg -> solid-home) */
export function sanitizeSpriteId(filePath: string): string {
  return filePath
    .replace(/\.svg$/i, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/** Format byte size for display */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export interface ScannedFile {
  file: File;
  path: string;
}

/** Recursively scan FileSystemEntry objects for SVGs */
export async function scanFiles(entry: any, basePath = ''): Promise<ScannedFile[]> {
  const result: ScannedFile[] = [];

  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      entry.file(resolve, reject);
    });
    if (file.name.endsWith('.svg') || file.type === 'image/svg+xml') {
      result.push({ file, path: basePath + file.name });
    }
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    // readEntries might not return all entries in one go, but for typical use cases it usually does.
    // For a robust implementation we loop until it returns empty.
    let allEntries: any[] = [];
    let readMore = true;
    while (readMore) {
      const entries = await new Promise<any[]>((resolve, reject) => {
        dirReader.readEntries(resolve, reject);
      });
      if (entries.length > 0) {
        allEntries = allEntries.concat(entries);
      } else {
        readMore = false;
      }
    }
    
    for (const childEntry of allEntries) {
      const children = await scanFiles(childEntry, basePath + entry.name + '/');
      result.push(...children);
    }
  }
  
  return result;
}

/** Download a generic Blob as a file */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
