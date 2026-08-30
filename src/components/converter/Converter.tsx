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

      {/* Framework Tabs (Primary Navigation) */}
      <nav className="flex flex-wrap gap-2 mb-8 border-b border-hairline pb-6" aria-label="Framework selector">
        {FRAMEWORKS.map(fw => {
          const isActive = options.framework === fw.id;
          const href = fw.id === 'react' ? '/' : `/${fw.slug}`;
          return (
            <a
              key={fw.id}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-full px-5 py-2 text-body-sm-strong transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? 'bg-ink text-on-primary shadow-level-2 scale-[1.02]'
                  : 'bg-canvas text-body border border-hairline shadow-level-1 hover:bg-canvas-soft-2 hover:text-ink hover:border-hairline-strong'
              }`}
              id={`tab-${fw.id}`}
            >
              {fw.name}
            </a>
          );
        })}
      </nav>

      {/* Mode Selector */}
      <div className="flex items-center justify-between mb-4 mt-8 border-b border-hairline pb-4">
        <ModeSelector mode={mode} onChange={setMode} />
      </div>

      {/* Options Panel */}
      <OptionsPanel
        options={options}
        onChange={handleOptionChange}
        framework={options.framework}
        originalSize={result?.parsed.originalSize}
        parsedSize={result?.parsed ? new Blob([result.parsed.outerHTML]).size : undefined}
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
        <BatchPane options={options} frameworkSlug={currentFw.slug} mode={mode} />
      )}
    </div>
  );
}
