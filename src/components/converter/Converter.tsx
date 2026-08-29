/**
 * Converter — Root React Island
 * The single interactive island hydrated with client:load.
 * Manages all converter state and orchestrates sub-components.
 */

import { useState, useCallback, useMemo } from 'react';
import { convert, DEFAULT_OPTIONS, getDefaultsForFramework, type ConversionOptions } from '../../lib/templates/index';
import { FRAMEWORKS, getFrameworkById } from '../../lib/frameworks';
import { InputPane } from './InputPane';
import { OutputPane } from './OutputPane';
import { PreviewSandbox } from './PreviewSandbox';
import { OptionsPanel } from './OptionsPanel';
import { ActionBar } from './ActionBar';
import { ModeSelector, type ConverterMode } from './ModeSelector';
import { BatchPane } from './BatchPane';

interface ConverterProps {
  defaultFramework: string;
}

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <path d="m16 12-4-4-4 4"/>
  <path d="M12 16V8"/>
</svg>`;

export function Converter({ defaultFramework }: ConverterProps) {
  const [mode, setMode] = useState<ConverterMode>('single');
  const [rawSvg, setRawSvg] = useState(SAMPLE_SVG);
  const [options, setOptions] = useState<ConversionOptions>(() => ({
    ...DEFAULT_OPTIONS,
    framework: defaultFramework,
    ...getDefaultsForFramework(defaultFramework),
  }));

  const result = useMemo(() => {
    if (!rawSvg.trim()) return null;
    return convert(rawSvg, options);
  }, [rawSvg, options]);

  const handleFrameworkChange = useCallback((frameworkId: string) => {
    setOptions(prev => ({
      ...prev,
      framework: frameworkId,
      ...getDefaultsForFramework(frameworkId),
    }));
  }, []);

  const handleOptionChange = useCallback((key: keyof ConversionOptions, value: unknown) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const currentFw = getFrameworkById(options.framework);

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-caption-mono text-mute mb-2 uppercase tracking-wider">
          {currentFw.name} converter
        </p>
        <h1 className="text-display-lg text-ink mb-3">
          {currentFw.h1}
        </h1>
        <p className="text-body-md text-body max-w-2xl">
          Paste your SVG code or drop a file. Get a production-ready {currentFw.name} component instantly — processed entirely in your browser.
        </p>
      </div>

      {/* Framework Tabs (inside island for instant switching) */}
      <div className="flex flex-wrap gap-1.5 mb-6" role="tablist" aria-label="Framework selector">
        {FRAMEWORKS.map(fw => (
          <button
            key={fw.id}
            role="tab"
            aria-selected={options.framework === fw.id}
            onClick={() => handleFrameworkChange(fw.id)}
            className={`rounded-[64px] px-4 py-1.5 text-body-sm transition-all duration-150 ${
              options.framework === fw.id
                ? 'bg-ink text-on-primary shadow-level-2'
                : 'bg-canvas text-body shadow-level-1 hover:bg-canvas-soft-2 hover:text-ink'
            }`}
            id={`tab-${fw.id}`}
          >
            {fw.name}
          </button>
        ))}
      </div>

      {/* Mode Selector */}
      <div className="flex items-center justify-between mb-4 mt-8 border-b border-hairline pb-4">
        <ModeSelector mode={mode} onChange={setMode} />
      </div>

      {/* Options Panel */}
      <OptionsPanel
        options={options}
        onChange={handleOptionChange}
        framework={options.framework}
      />

      {mode === 'single' ? (
        <>
          {/* Main Split Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Left: Input */}
            <InputPane
              value={rawSvg}
              onChange={setRawSvg}
              originalSize={result?.parsed.originalSize ?? 0}
            />

            {/* Right: Preview + Output */}
            <div className="flex flex-col gap-4">
              {/* Preview Sandbox */}
              <PreviewSandbox svgContent={rawSvg} isValid={result?.parsed.isValid ?? false} />

              {/* Output */}
              <OutputPane
                code={result?.code ?? ''}
                language={result?.language ?? 'typescript'}
                outputSize={result?.outputSize ?? 0}
                extension={result?.extension ?? '.tsx'}
                componentName={options.componentName}
              />
            </div>
          </div>

          {/* Action Bar */}
          <ActionBar
            code={result?.code ?? ''}
            filename={`${options.componentName}${result?.extension ?? '.tsx'}`}
          />
        </>
      ) : (
        <BatchPane options={options} frameworkSlug={currentFw.slug} />
      )}
    </div>
  );
}
