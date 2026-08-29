import { useCallback, useRef, useState } from 'react';
import { readFileAsText, formatBytes } from '../../lib/utils';
import { Upload } from 'lucide-react';

interface InputPaneProps {
  value: string;
  onChange: (value: string) => void;
  originalSize: number;
}

export function InputPane({ value, onChange, originalSize }: InputPaneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/svg+xml' || file.name.endsWith('.svg'))) {
      const text = await readFileAsText(file);
      onChange(text);
    }
  }, [onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await readFileAsText(file);
      onChange(text);
    }
  }, [onChange]);

  return (
    <div className="flex flex-col rounded-lg bg-canvas shadow-level-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-body-sm-strong text-ink">Input</span>
          <span className="text-caption text-mute">SVG</span>
        </div>
        <div className="flex items-center gap-2">
          {originalSize > 0 && (
            <span className="text-caption-mono text-mute">{formatBytes(originalSize)}</span>
          )}
          <label
            className="flex items-center gap-1.5 rounded-sm border border-hairline px-2 py-1 text-caption text-body cursor-pointer hover:bg-canvas-soft-2 transition-colors duration-150"
            id="file-upload-label"
          >
            <Upload size={12} />
            <span>Upload</span>
            <input
              type="file"
              accept=".svg,image/svg+xml"
              className="sr-only"
              onChange={handleFileInput}
              id="file-upload-input"
            />
          </label>
        </div>
      </div>

      {/* Textarea + Drop Zone */}
      <div
        className={`relative min-h-[300px] lg:min-h-[420px] transition-colors duration-200 ${
          isDragOver ? 'bg-link-bg-soft' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
          className="w-full h-full min-h-[300px] lg:min-h-[420px] resize-none bg-transparent px-4 py-3 text-code text-ink outline-none placeholder:text-mute font-mono"
          placeholder="Paste SVG code here or drag & drop an .svg file..."
          id="svg-input-textarea"
        />

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-link-bg-soft/80 backdrop-blur-sm rounded-b-lg pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-link">
              <Upload size={32} />
              <span className="text-body-sm-strong">Drop your SVG file</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
