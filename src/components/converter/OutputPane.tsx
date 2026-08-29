import { Highlight, themes } from 'prism-react-renderer';
import { formatBytes } from '../../lib/utils';

interface OutputPaneProps {
  code: string;
  language: string;
  outputSize: number;
  extension: string;
  componentName: string;
}

export function OutputPane({ code, language, outputSize, extension, componentName }: OutputPaneProps) {
  // Map our language identifiers to prism-compatible ones
  const prismLang = language === 'tsx' || language === 'jsx' ? 'tsx' : 'markup';

  return (
    <div className="flex flex-col rounded-lg bg-ink shadow-level-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-body-sm-strong text-on-primary">Output</span>
          <span className="text-caption-mono text-white/50">
            {componentName}{extension}
          </span>
        </div>
        {outputSize > 0 && (
          <span className="text-caption-mono text-white/40">{formatBytes(outputSize)}</span>
        )}
      </div>

      {/* Code Display */}
      <div className="overflow-auto min-h-[200px] max-h-[420px]">
        <Highlight
          theme={themes.nightOwl}
          code={code}
          language={prismLang}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className="px-4 py-3 text-code overflow-x-auto"
              style={{ ...style, background: 'transparent', margin: 0 }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="inline-block w-8 text-right mr-4 text-white/20 select-none text-caption-mono">
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
