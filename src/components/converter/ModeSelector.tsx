import type { ReactNode } from 'react';

export type ConverterMode = 'single' | 'batch' | 'sprite';

interface ModeSelectorProps {
  mode: ConverterMode;
  onChange: (mode: ConverterMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="inline-flex items-center rounded-pill bg-canvas shadow-level-1 border border-hairline p-1 mb-4">
      <button
        onClick={() => onChange('single')}
        className={`rounded-pill px-4 py-1.5 text-body-sm-strong transition-colors duration-150 ${
          mode === 'single'
            ? 'bg-ink text-on-primary shadow-level-2'
            : 'text-body hover:text-ink hover:bg-canvas-soft-2'
        }`}
        id="mode-single"
      >
        Single File
      </button>
      <button
        onClick={() => onChange('batch')}
        className={`rounded-pill px-4 py-1.5 text-body-sm-strong transition-colors duration-150 ${
          mode === 'batch'
            ? 'bg-ink text-on-primary shadow-level-2'
            : 'text-body hover:text-ink hover:bg-canvas-soft-2'
        }`}
        id="mode-batch"
      >
        Batch Folder
      </button>
      <button
        onClick={() => onChange('sprite')}
        className={`rounded-pill px-4 py-1.5 text-body-sm-strong transition-colors duration-150 ${
          mode === 'sprite'
            ? 'bg-ink text-on-primary shadow-level-2'
            : 'text-body hover:text-ink hover:bg-canvas-soft-2'
        }`}
        id="mode-sprite"
      >
        Sprite
      </button>
    </div>
  );
}
