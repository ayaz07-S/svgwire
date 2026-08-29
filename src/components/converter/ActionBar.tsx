import { useState, useCallback } from 'react';
import { copyToClipboard, downloadFile } from '../../lib/utils';
import { Copy, Download, Check } from 'lucide-react';

interface ActionBarProps {
  code: string;
  filename: string;
}

export function ActionBar({ code, filename }: ActionBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const handleDownload = useCallback(() => {
    downloadFile(code, filename);
  }, [code, filename]);

  return (
    <div className="flex items-center justify-end gap-3 mt-4">
      <button
        onClick={handleCopy}
        disabled={!code}
        className="inline-flex items-center gap-2 rounded-pill bg-ink px-4 py-2 text-button-md text-on-primary shadow-level-2 transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        id="action-copy"
      >
        {copied ? (
          <>
            <Check size={14} />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy size={14} />
            <span>Copy</span>
          </>
        )}
      </button>

      <button
        onClick={handleDownload}
        disabled={!code}
        className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-canvas px-4 py-2 text-button-md text-ink shadow-level-1 transition-all duration-150 hover:bg-canvas-soft-2 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        id="action-download"
      >
        <Download size={14} />
        <span>Download</span>
      </button>
    </div>
  );
}
