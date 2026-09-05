import { useCallback, useRef, useState } from 'react';
import { FolderArchive, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { scanFiles, readFileAsText, downloadBlob, toPascalCase, sanitizeSpriteId } from '../../lib/utils';
import { convert, type ConversionOptions } from '../../lib/templates/index';
import { parseSvg } from '../../lib/engine/parser';
import { generateSpriteWrapper } from '../../lib/templates/sprite';

interface BatchPaneProps {
  options: ConversionOptions;
  frameworkSlug: string;
  mode: 'batch' | 'sprite';
}

export function BatchPane({ options, frameworkSlug, mode }: BatchPaneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedLog, setProcessedLog] = useState<{name: string, status: 'success' | 'error'}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFilesList = async (allFiles: {file: File, path: string}[]) => {
    setTotalFiles(allFiles.length);

    if (allFiles.length === 0) {
      setIsProcessing(false);
      return;
    }

    const zip = new JSZip();
    const newLog: typeof processedLog = [];
    
    if (mode === 'sprite') {
      let spriteContent = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n';
      const validIconNames: string[] = [];

      for (let i = 0; i < allFiles.length; i++) {
        let { file, path } = allFiles[i];
        
        // Strip the dropped root directory segment from the path
        if (path.includes('/')) {
          const parts = path.split('/');
          parts.shift(); // Remove the leading root directory
          path = parts.join('/');
        }
        
        try {
          const rawSvg = await readFileAsText(file);
          const sanitizedId = sanitizeSpriteId(path);
          const fileOptions = { componentName: toPascalCase(sanitizedId), precision: options.precision };
          const parsed = parseSvg(rawSvg, fileOptions);
          
          if (parsed.isValid) {
            // Preserve root presentation attributes on <symbol> (e.g. fill, stroke)
            const excludeAttrs = new Set(['xmlns', 'xmlns:xlink', 'version', 'class', 'id', 'width', 'height', 'viewbox', 'viewBox']);
            let symbolAttrs = `id="icon-${sanitizedId}" viewBox="${parsed.viewBox || '0 0 24 24'}"`;
            
            for (const [key, value] of Object.entries(parsed.attributes)) {
              if (!excludeAttrs.has(key)) {
                symbolAttrs += ` ${key}="${value}"`;
              }
            }
            
            spriteContent += `  <symbol ${symbolAttrs}>\n    ${parsed.innerHTML}\n  </symbol>\n`;
            validIconNames.push(sanitizedId);
            newLog.push({ name: `icon-${sanitizedId}`, status: 'success' as const });
          } else {
            newLog.push({ name: path, status: 'error' as const });
          }
        } catch (error) {
          newLog.push({ name: path, status: 'error' as const });
        }
        
        setProgress(i + 1);
        setProcessedLog([...newLog]);
      }

      spriteContent += '</svg>';
      
      if (validIconNames.length > 0) {
        zip.file('sprite.svg', spriteContent);
        
        const typesContent = `export type IconName = ${validIconNames.map(n => `'${n}'`).join(' | ')};\n`;
        zip.file('icon-names.ts', typesContent);
        
        const wrapper = generateSpriteWrapper(options.framework, options);
        const componentName = options.componentName || 'Icon';
        zip.file(`${componentName}${wrapper.extension}`, wrapper.code);
      }
    } else {
      for (let i = 0; i < allFiles.length; i++) {
        let { file, path } = allFiles[i];
        
        // Strip the dropped root directory segment from the path
        if (path.includes('/')) {
          const parts = path.split('/');
          parts.shift(); // Remove the leading root directory
          path = parts.join('/');
        }
        
        try {
          const rawSvg = await readFileAsText(file);
          
          // Generate component name from filename without extension
          const filenameNoExt = path.replace(/\.svg$/i, '').split('/').pop() || 'SvgIcon';
          const componentName = toPascalCase(filenameNoExt) || 'SvgIcon';
          
          const fileOptions = { ...options, componentName };
          const result = convert(rawSvg, fileOptions);
          
          if (result.parsed.isValid) {
            // Replace .svg extension with the target framework extension
            const outPath = path.replace(/\.svg$/i, result.extension);
            zip.file(outPath, result.code);
            newLog.push({ name: outPath, status: 'success' as const });
          } else {
            newLog.push({ name: path, status: 'error' as const });
          }
        } catch (error) {
          newLog.push({ name: path, status: 'error' as const });
        }
        
        setProgress(i + 1);
        setProcessedLog([...newLog]);
      }
    }

    // Create ZIP file named after the requested convention: svgwire-[framework].zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    // Only download if we successfully added at least one file
    if (newLog.some(l => l.status === 'success')) {
       const zipName = `svgwire-${frameworkSlug.replace('svg-to-', '')}.zip`;
       downloadBlob(zipBlob, zipName);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setTotalFiles(0);
    setProcessedLog([]);

    try {
      const allFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            const files = await scanFiles(entry);
            allFiles.push(...files);
          }
        } else if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && (file.name.endsWith('.svg') || file.type === 'image/svg+xml')) {
            allFiles.push({ file, path: file.name });
          }
        }
      }

      await processFilesList(allFiles);
    } finally {
      setIsProcessing(false);
    }
  }, [options, frameworkSlug]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setTotalFiles(0);
    setProcessedLog([]);

    try {
      const allFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.svg') || file.type === 'image/svg+xml') {
          // webkitRelativePath contains the full path of the file relative to the selected directory
          allFiles.push({ file, path: file.webkitRelativePath || file.name });
        }
      }
      
      await processFilesList(allFiles);
    } finally {
      setIsProcessing(false);
      // Reset input so the same folder can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [options, frameworkSlug]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* Drop Zone */}
      <div
        className={`relative min-h-[300px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors duration-200 cursor-pointer ${
          isDragOver 
            ? 'border-link bg-link-bg-soft' 
            : 'border-hairline bg-canvas hover:border-hairline-strong'
        } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          // @ts-expect-error - webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center gap-3 text-center px-6 py-12">
           <FolderArchive size={48} className="text-mute mb-2" strokeWidth={1.5} />
           <h3 className="text-display-sm text-ink">Drop your SVG folder here</h3>
           <p className="text-body-md text-body max-w-md">
             Drag and drop an entire folder of SVGs, or <strong>click to select a folder</strong>. We'll recursively scan it, convert all files preserving the directory structure, and download a bundled <strong>.zip</strong> file.
           </p>
        </div>
        
        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas/90 backdrop-blur-sm rounded-lg gap-4">
            <Loader2 size={36} className="text-link animate-spin" />
            <div className="text-center">
              <h4 className="text-body-lg text-ink font-medium">Processing SVGs</h4>
              <p className="text-body-sm text-body">{progress} / {totalFiles} files converted</p>
            </div>
            {/* Progress bar */}
            <div className="w-64 h-2 bg-canvas-soft-2 rounded-full overflow-hidden border border-hairline mt-2">
              <div 
                className="h-full bg-link transition-all duration-300"
                style={{ width: `${totalFiles > 0 ? (progress / totalFiles) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Log output */}
      {processedLog.length > 0 && !isProcessing && (
        <div className="rounded-lg bg-canvas shadow-level-1 border border-hairline overflow-hidden">
           <div className="px-4 py-3 border-b border-hairline bg-canvas-soft flex items-center justify-between">
              <h4 className="text-body-sm-strong text-ink">Conversion Log</h4>
              <span className="text-caption text-mute">{processedLog.length} files processed</span>
           </div>
           <div className="max-h-60 overflow-y-auto px-2 py-2">
              <ul className="space-y-1">
                {processedLog.map((log, idx) => (
                  <li key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-canvas-soft-2">
                    {log.status === 'success' 
                      ? <CheckCircle2 size={14} className="text-success shrink-0" />
                      : <AlertCircle size={14} className="text-error shrink-0" />
                    }
                    <span className="text-caption-mono text-ink truncate" title={log.name}>{log.name}</span>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      )}
    </div>
  );
}

