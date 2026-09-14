import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { formatBytes, encodeSvgDataUri, copyToClipboard } from '../../lib/utils';
import { Copy, Check } from 'lucide-react';

interface OutputPaneProps {
  code: string;
  language: string;
  outputSize: number;
  extension: string;
  componentName: string;
  parsedSvgString?: string;
}

export function OutputPane({ code, language, outputSize, extension, componentName, parsedSvgString }: OutputPaneProps) {
  const [activeTab, setActiveTab] = useState<'component' | 'data-uri' | 'tailwind'>('component');
  const [copied, setCopied] = useState(false);

  let displayCode = code;
  let prismLang = language === 'tsx' || language === 'jsx' ? 'tsx' : 'markup';
  
  if (activeTab === 'data-uri' && parsedSvgString) {
    displayCode = encodeSvgDataUri(parsedSvgString);
    prismLang = 'css';
  } else if (activeTab === 'tailwind' && parsedSvgString) {
    displayCode = `<div class="inline-block w-6 h-6 bg-current mask-[url('${encodeSvgDataUri(parsedSvgString).replace(/\s+/g, '%20')}')] mask-no-repeat mask-center mask-contain"></div>`;
    prismLang = 'markup';
  }

  const handleCopy = async () => {
    const success = await copyToClipboard(displayCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    /*
      The output pane intentionally keeps a near-black surface in both light and dark
      mode — it's a "code editor mockup" that matches the DESIGN.md showcase-band-dark
      pattern (bg-ink / on-primary text).  In dark mode bg-ink becomes #fafafa so we
      lock it to the near-black CSS custom property via an inline style override rather
      than a semantic Tailwind class.  This ensures the code block always reads as a
      dark terminal regardless of theme.
    */
    <div
      className="flex flex-col rounded-lg overflow-hidden shadow-level-2 transition-colors duration-200"
      style={{ backgroundColor: 'var(--output-bg, #0a0a0a)' }}
    >
      <style>{`
        :root { --output-bg: #0a0a0a; --output-border: rgba(255,255,255,0.08); --output-tab-hover: rgba(255,255,255,0.06); }
        html.dark { --output-bg: #0a0a0a; --output-border: rgba(255,255,255,0.08); --output-tab-hover: rgba(255,255,255,0.06); }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--output-border)' }}>
        <div className="flex items-center gap-4">
          {/* Tab bar */}
          <div className="flex">
            {(['component', 'data-uri', 'tailwind'] as const).map((tab) => {
              const labels: Record<string, string> = { component: 'Component', 'data-uri': 'Data URI', tailwind: 'Tailwind Mask' };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'border-t-2 border-t-link font-medium'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    color: isActive ? '#ffffff' : 'rgba(200,200,200,0.85)',
                  }}
                  aria-label={`Show ${labels[tab]}`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
          {activeTab === 'component' && (
            <span className="text-caption-mono text-neutral-400 hidden sm:inline-block">
              {componentName}{extension}
            </span>
          )}
        </div>
        {displayCode.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-caption-mono text-neutral-500">
               {activeTab === 'component' ? formatBytes(outputSize) : formatBytes(new Blob([displayCode]).size)}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 rounded transition-colors duration-150 hover:bg-white/10"
              title="Copy to clipboard"
              aria-label="Copy to clipboard"
              style={{ color: copied ? undefined : 'rgba(200,200,200,0.85)' }}
            >
              {copied ? (
                <>
                  <Check size={14} className="text-success" />
                  <span className="text-success">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {activeTab === 'tailwind' && (
        <div
          className="px-4 py-2.5 text-caption text-neutral-300 flex items-start sm:items-center gap-2"
          style={{ borderBottom: '1px solid var(--output-border)', backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
           <svg className="w-4 h-4 text-link shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           <span>Zero-JS Icon: Color this element using Tailwind utility classes like <code className="text-neutral-200 bg-white/10 px-1 rounded mx-0.5">bg-red-500</code> and <code className="text-neutral-200 bg-white/10 px-1 rounded mx-0.5">hover:bg-blue-600</code>.</span>
        </div>
      )}

      {/* Code Display */}
      <div className={`overflow-auto max-h-[420px] ${activeTab === 'component' ? 'min-h-[200px]' : ''}`}>
        <Highlight
          theme={themes.nightOwl}
          code={displayCode}
          language={prismLang}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className="px-4 py-3 text-code overflow-x-auto"
              style={{ ...style, background: 'transparent', margin: 0 }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="inline-block w-8 text-right mr-4 text-neutral-600 select-none text-caption-mono">
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
