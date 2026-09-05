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
    <div className="flex flex-col rounded-lg bg-ink shadow-level-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-canvas/10 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <div className="!flex !bg-[#111] !border-b !border-[#262626]">
            <button
              onClick={() => setActiveTab('component')}
              className={activeTab === 'component' ? '!px-4 !py-2 !text-sm !text-canvas !bg-ink !border-t-2 !border-t-link !font-medium' : '!px-4 !py-2 !text-sm !text-mute hover:!text-canvas hover:!bg-[#262626] !transition-colors'}
            >
              Component
            </button>
            <button
              onClick={() => setActiveTab('data-uri')}
              className={activeTab === 'data-uri' ? '!px-4 !py-2 !text-sm !text-canvas !bg-ink !border-t-2 !border-t-link !font-medium' : '!px-4 !py-2 !text-sm !text-mute hover:!text-canvas hover:!bg-[#262626] !transition-colors'}
            >
              Data URI
            </button>
            <button
              onClick={() => setActiveTab('tailwind')}
              className={activeTab === 'tailwind' ? '!px-4 !py-2 !text-sm !text-canvas !bg-ink !border-t-2 !border-t-link !font-medium' : '!px-4 !py-2 !text-sm !text-mute hover:!text-canvas hover:!bg-[#262626] !transition-colors'}
            >
              Tailwind Mask
            </button>
          </div>
          {activeTab === 'component' && (
            <span className="text-caption-mono text-canvas/50 hidden sm:inline-block">
              {componentName}{extension}
            </span>
          )}
        </div>
        {displayCode.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-caption-mono text-canvas/40">
               {activeTab === 'component' ? formatBytes(outputSize) : formatBytes(new Blob([displayCode]).size)}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-1 text-caption text-mute hover:text-canvas hover:bg-white/10 rounded transition-colors"
              title="Copy to clipboard"
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
        <div className="px-4 py-2.5 bg-[#1A1A1A] border-b border-canvas/10 text-caption text-canvas/70 flex items-start sm:items-center gap-2">
           <svg className="w-4 h-4 text-link shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           <span>Zero-JS Icon: Color this element using Tailwind utility classes like <code className="text-canvas/90 bg-canvas/10 px-1 rounded mx-0.5">bg-red-500</code> and <code className="text-canvas/90 bg-canvas/10 px-1 rounded mx-0.5">hover:bg-blue-600</code>.</span>
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
                  <span className="inline-block w-8 text-right mr-4 text-canvas/20 select-none text-caption-mono">
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
