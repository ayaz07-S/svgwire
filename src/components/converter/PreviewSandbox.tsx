import { useMemo } from 'react';

interface PreviewSandboxProps {
  svgContent: string;
  isValid: boolean;
}

export function PreviewSandbox({ svgContent, isValid }: PreviewSandboxProps) {
  const sanitizedSvg = useMemo(() => {
    if (!isValid || !svgContent.trim()) return null;

    // Basic sanitization: only allow SVG content
    const trimmed = svgContent.trim();
    if (!trimmed.startsWith('<svg') && !trimmed.startsWith('<?xml')) return null;

    return trimmed;
  }, [svgContent, isValid]);

  return (
    <div className="rounded-lg bg-canvas-soft-2 shadow-level-1 overflow-hidden" id="preview-sandbox">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isValid ? 'bg-success' : 'bg-error'}`} />
          <span className="text-caption text-mute">Preview</span>
        </div>
        <span className="text-caption-mono text-mute">
          {isValid ? 'Live render' : 'Invalid SVG'}
        </span>
      </div>

      {/* Render Area */}
      <div className="flex items-center justify-center p-6 min-h-[120px]">
        {sanitizedSvg ? (
          <div
            className="max-w-[120px] max-h-[120px] text-ink [&_svg]:w-full [&_svg]:h-full"
            dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-mute">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span className="text-caption">Paste SVG to preview</span>
          </div>
        )}
      </div>
    </div>
  );
}
