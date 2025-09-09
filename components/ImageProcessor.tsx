import React, { useRef } from 'react';
import type { Corner, Tool } from '../types';
import { Corner as CornerEnum, Tool as ToolEnum } from '../types';
import { CornerBottomLeftIcon, CornerBottomRightIcon, CornerTopLeftIcon, CornerTopRightIcon, UploadIcon, WandIcon, XCircleIcon, RetryIcon, DownloadAllIcon, SparklesIcon } from './icons';

interface ImageProcessorProps {
  onFilesSelected: (files: FileList | null) => void;
  onProcess: () => void;
  onClear: () => void;
  onRetry: () => void;
  onDownloadAll: () => void;
  isProcessing: boolean;
  isDownloading: boolean;
  imageCount: number;
  processedCount: number;
  processingTotal: number;
  hasErrors: boolean;
  hasDownloads: boolean;
  selectedCorner: Corner;
  onCornerChange: (corner: Corner) => void;
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const cornerOptions = [
  { id: CornerEnum.TopLeft, label: 'Top Left', icon: <CornerTopLeftIcon /> },
  { id: CornerEnum.TopRight, label: 'Top Right', icon: <CornerTopRightIcon /> },
  { id: CornerEnum.BottomLeft, label: 'Bottom Left', icon: <CornerBottomLeftIcon /> },
  { id: CornerEnum.BottomRight, label: 'Bottom Right', icon: <CornerBottomRightIcon /> },
];

const toolOptions = [
    { id: ToolEnum.Heal, label: 'Heal', description: 'Faster, best for small spots.', icon: <WandIcon /> },
    { id: ToolEnum.GenerativeRemove, label: 'Generative Remove', description: 'Slower, best for larger objects.', icon: <SparklesIcon /> },
];


export const ImageProcessor: React.FC<ImageProcessorProps> = ({
  onFilesSelected,
  onProcess,
  onClear,
  onRetry,
  onDownloadAll,
  isProcessing,
  isDownloading,
  imageCount,
  processedCount,
  processingTotal,
  hasErrors,
  hasDownloads,
  selectedCorner,
  onCornerChange,
  selectedTool,
  onToolChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const showProgressBar = isProcessing && processingTotal > 0 && imageCount > 1;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8 mb-12 shadow-lg backdrop-blur-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Step 1: Upload */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-8 h-full transition-colors hover:border-cyan-500 hover:bg-slate-800">
            <UploadIcon />
            <p className="mt-4 text-slate-400">Drag & drop images or</p>
            <input
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => onFilesSelected(e.target.files)}
                className="hidden"
                ref={fileInputRef}
                disabled={isProcessing}
            />
            <button
                onClick={handleFileButtonClick}
                disabled={isProcessing}
                className="mt-2 font-semibold text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            >
                Browse Files
            </button>
            {imageCount > 0 && <p className="mt-2 text-sm text-slate-500">{imageCount} image{imageCount > 1 ? 's' : ''} selected.</p>}
        </div>

        {/* Steps 2, 3, 4 */}
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 text-slate-200">2. Select Object Corner</h3>
            <div className="grid grid-cols-2 gap-3">
              {cornerOptions.map(({ id, label, icon }) => (
                <label key={id} className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedCorner === id ? 'bg-cyan-900/50 border-cyan-500 text-white' : 'bg-slate-700/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  <input type="radio" name="corner" value={id} checked={selectedCorner === id} onChange={() => onCornerChange(id)} className="hidden" disabled={isProcessing} />
                  {icon}
                  <span className="font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-slate-200">3. Select Tool</h3>
            <div className="grid grid-cols-1 gap-3">
              {toolOptions.map(({ id, label, icon, description }) => (
                <label key={id} className={`flex items-start space-x-4 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedTool === id ? 'bg-cyan-900/50 border-cyan-500 text-white' : 'bg-slate-700/50 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                    <input type="radio" name="tool" value={id} checked={selectedTool === id} onChange={() => onToolChange(id)} className="hidden" disabled={isProcessing} />
                    <div className="mt-0.5">{icon}</div>
                    <div>
                        <span className="font-medium">{label}</span>
                        <p className="text-sm text-slate-400">{description}</p>
                    </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-slate-200">4. Process Images</h3>
            <div className="flex flex-wrap gap-4">
              <button onClick={onProcess} disabled={isProcessing || imageCount === 0} className="flex-1 min-w-[150px] inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500">
                <WandIcon />
                {isProcessing ? 'Processing...' : 'Process Images'}
              </button>
              {hasErrors && !isProcessing && (
                <button onClick={onRetry} className="flex-1 min-w-[150px] inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500">
                  <RetryIcon />
                  Retry Failed
                </button>
              )}
              {hasDownloads && !isProcessing && (
                <button onClick={onDownloadAll} disabled={isDownloading} className="flex-1 min-w-[150px] inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500">
                  <DownloadAllIcon />
                  {isDownloading ? 'Zipping...' : 'Download All'}
                </button>
              )}
              <button onClick={onClear} disabled={isProcessing || imageCount === 0} className="inline-flex items-center justify-center px-4 py-3 border border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500">
                <XCircleIcon />
              </button>
            </div>
            {showProgressBar && (
              <div className="mt-4 space-y-2" aria-live="polite">
                <div className="flex justify-between text-sm font-medium text-slate-300">
                  <span>Progress...</span>
                  <span>{processedCount} / {processingTotal}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-cyan-600 h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${(processedCount / processingTotal) * 100}%` }} role="progressbar" aria-valuenow={processedCount} aria-valuemin={0} aria-valuemax={processingTotal}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};