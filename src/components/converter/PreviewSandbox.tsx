import { useMemo, useState, useEffect } from 'react';

type PreviewBg = 'light' | 'dark' | 'checker';

const STORAGE_KEY = 'svgwire-preview-bg';

interface PreviewSandboxProps {
  svgContent: string;
  isValid: boolean;
}

// ─── Icon components ────────────────────────────────────────────────────────

/** White square with a hairline border — represents "Light" canvas */
function LightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="0.5" y="0.5" width="11" height="11" rx="2" fill="white" stroke="currentColor" strokeOpacity="0.4" />
    </svg>
  );
}

/** Near-black filled square — represents "Dark" canvas */
function DarkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="0.5" y="0.5" width="11" height="11" rx="2" fill="#000000" stroke="currentColor" strokeOpacity="0.4" />
    </svg>
  );
}

/** 2×2 alternating grid — represents "Checkerboard / transparency" */
function CheckerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="0" y="0" width="12" height="12" rx="2" fill="white" />
      <rect x="0" y="0" width="6" height="6" fill="#e4e4e7" />
      <rect x="6" y="6" width="6" height="6" fill="#e4e4e7" />
      <rect x="0.5" y="0.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeOpacity="0.4" />
    </svg>
  );
}

// ─── Background class map ────────────────────────────────────────────────────

const BG_CLASSES: Record<PreviewBg, string> = {
  light:   'bg-[#ffffff]',
  dark:    'bg-black',
  checker: 'bg-preview-checker',
};

const BG_BORDER: Record<PreviewBg, string> = {
  light:   'border-hairline',
  dark:    'border-zinc-800',
  checker: 'border-hairline',
};

// ─── Segmented control option ─────────────────────────────────────────────────

interface BgOptionProps {
  id: PreviewBg;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function BgOption({ id, label, icon, active, onClick }: BgOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Preview on ${label} background`}
      aria-pressed={active}
      title={label}
      id={`preview-bg-${id}`}
      className={[
        'relative flex items-center justify-center w-6 h-6 rounded transition-all duration-150',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-hairline-strong focus-visible:ring-offset-1',
        active
          ? 'bg-canvas-soft-2 dark:bg-zinc-800 shadow-level-2 ring-1 ring-hairline text-ink scale-[1.05] z-10'
          : 'text-mute hover:text-body hover:bg-canvas-soft-2/60 dark:hover:bg-zinc-800/50',
      ].join(' ')}
    >
      {icon}
      {/* Active indicator dot */}
      {active && (
        <span
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ink"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PreviewSandbox({ svgContent, isValid }: PreviewSandboxProps) {
  const [previewBg, setPreviewBg] = useState<PreviewBg>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as PreviewBg | null;
      if (stored === 'light' || stored === 'dark' || stored === 'checker') return stored;
    }
    return 'checker';
  });

  // Persist selection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, previewBg);
    } catch {
      // ignore quota / private-browsing errors
    }
  }, [previewBg]);

  const sanitizedSvg = useMemo(() => {
    if (!isValid || !svgContent.trim()) return null;
    const trimmed = svgContent.trim();
    if (!trimmed.startsWith('<svg') && !trimmed.startsWith('<?xml')) return null;
    return trimmed;
  }, [svgContent, isValid]);

  const OPTIONS: { id: PreviewBg; label: string; icon: React.ReactNode }[] = [
    { id: 'light',   label: 'Light',        icon: <LightIcon /> },
    { id: 'dark',    label: 'Dark',         icon: <DarkIcon /> },
    { id: 'checker', label: 'Transparent',  icon: <CheckerIcon /> },
  ];

  return (
    <div
      className="rounded-xl border border-hairline bg-canvas dark:bg-zinc-900 overflow-hidden transition-colors duration-200"
      id="preview-sandbox"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2 dark:bg-zinc-800">

        {/* Left: status + label */}
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isValid ? 'bg-success' : 'bg-error'}`} />
          <span className="text-caption text-mute select-none">Preview</span>
        </div>

        {/* Right: background selector — compact segmented icon control */}
        <div
          className="flex items-center gap-0.5 rounded-md border border-hairline bg-canvas-soft dark:bg-zinc-900 px-1 py-0.5"
          role="group"
          aria-label="Preview background"
        >
          {OPTIONS.map((opt) => (
            <BgOption
              key={opt.id}
              id={opt.id}
              label={opt.label}
              icon={opt.icon}
              active={previewBg === opt.id}
              onClick={() => setPreviewBg(opt.id)}
            />
          ))}
        </div>

      </div>

      {/* ── Canvas ── */}
      <div className="p-3">
        <div
          className={[
            'rounded-lg border p-6 flex items-center justify-center min-h-[140px]',
            'transition-colors duration-200',
            BG_CLASSES[previewBg],
            BG_BORDER[previewBg],
          ].join(' ')}
        >
          {sanitizedSvg ? (
            <div
              className="max-w-[120px] max-h-[120px] [&_svg]:w-full [&_svg]:h-full"
              dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <span className="text-caption" style={{ color: '#9ca3af' }}>Paste SVG to preview</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
