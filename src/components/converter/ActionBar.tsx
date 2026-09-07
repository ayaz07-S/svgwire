import { useCallback } from 'react';
import { downloadFile } from '../../lib/utils';
import { Download } from 'lucide-react';

interface ActionBarProps {
  code: string;
  filename: string;
}

export function ActionBar({ code, filename }: ActionBarProps) {
  const handleDownload = useCallback(() => {
    downloadFile(code, filename);
  }, [code, filename]);

  return (
    <div className="flex items-center justify-end gap-3 mt-4">

      <button
        onClick={handleDownload}
        disabled={!code}
        className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-canvas px-4 py-2 text-button-md text-ink shadow-level-1 transition-all duration-200 hover:bg-canvas-soft-2 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        id="action-download"
      >
        <Download size={14} />
        <span>Download</span>
      </button>
    </div>
  );
}
