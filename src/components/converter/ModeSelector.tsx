export type ConverterMode = 'single' | 'batch' | 'sprite';

interface ModeSelectorProps {
  activeMode: ConverterMode;
  frameworkSlug?: string;
}

export function ModeSelector({ activeMode, frameworkSlug }: ModeSelectorProps) {
  const singleRoute = frameworkSlug && frameworkSlug !== 'react' ? `/${frameworkSlug}` : '/';
  
  return (
    <div className="inline-flex items-center rounded-pill bg-canvas shadow-level-1 border border-hairline p-1 mb-4 transition-colors duration-200">
      <a
        href={singleRoute}
        className={`rounded-pill px-4 py-1.5 text-body-sm-strong transition-colors duration-150 ${
          activeMode === 'single'
            ? 'bg-ink text-on-primary shadow-level-2'
            : 'text-body hover:text-ink hover:bg-canvas-soft-2'
        }`}
        id="mode-single"
      >
        Single File
      </a>
      <a
        href="/batch"
        className={`rounded-pill px-4 py-1.5 text-body-sm-strong transition-colors duration-150 ${
          activeMode === 'batch'
            ? 'bg-ink text-on-primary shadow-level-2'
            : 'text-body hover:text-ink hover:bg-canvas-soft-2'
        }`}
        id="mode-batch"
      >
        Batch Folder
      </a>
      <a
        href="/sprite"
        className={`rounded-pill px-4 py-1.5 text-body-sm-strong transition-colors duration-150 ${
          activeMode === 'sprite'
            ? 'bg-ink text-on-primary shadow-level-2'
            : 'text-body hover:text-ink hover:bg-canvas-soft-2'
        }`}
        id="mode-sprite"
      >
        Sprite
      </a>
    </div>
  );
}
