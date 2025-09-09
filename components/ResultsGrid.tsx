import React, { useState } from 'react';
import type { AppImage, Tool } from '../types';
import { Tool as ToolEnum } from '../types';
import { DownloadIcon, ErrorIcon, SpinnerIcon, RetryIcon, WandIcon, SparklesIcon } from './icons';

interface ResultsGridProps {
  images: AppImage[];
  onRetrySingle: (image: AppImage, tool: Tool) => void;
  retryingImageName: string | null;
}

const ImageCard: React.FC<{
  image: AppImage;
  onRetrySingle: (image: AppImage, tool: Tool) => void;
  isRetrying: boolean;
}> = ({ image, onRetrySingle, isRetrying }) => {
  const [showRetryOptions, setShowRetryOptions] = useState(false);

  const handleDownload = () => {
    if (!image.processedUrl) return;
    const link = document.createElement('a');
    link.href = image.processedUrl;
    
    const nameParts = image.originalFile.name.split('.');
    const extension = nameParts.pop();
    const name = nameParts.join('.');
    link.download = `${name}_healed.${extension}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRetry = (tool: Tool) => {
    setShowRetryOptions(false);
    onRetrySingle(image, tool);
  };
  
  const renderContent = () => {
    if (isRetrying || image.status === 'processing') {
      return (
        <div className="text-center text-slate-400">
          <SpinnerIcon />
          <p className="mt-2 text-sm">Processing...</p>
        </div>
      );
    }
    
    if (image.status === 'done' && image.processedUrl) {
      return (
        <div className="group relative w-full h-full">
          <img src={image.processedUrl} alt="Processed" className="w-full h-full object-cover rounded-md" />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
            <button onClick={handleDownload} className="inline-flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
              <DownloadIcon /> Download
            </button>
            <button onClick={() => setShowRetryOptions(true)} className="inline-flex items-center p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
              <RetryIcon />
            </button>
          </div>
        </div>
      );
    }

    if (image.status === 'error') {
        return (
            <div className="text-center text-red-400 p-4 flex flex-col justify-center items-center h-full">
                <ErrorIcon />
                <p className="mt-2 text-sm font-semibold">Processing Failed</p>
                <p className="mt-1 text-xs text-slate-500 w-full truncate" title={image.error}>{image.error}</p>
                <button onClick={() => setShowRetryOptions(true)} className="mt-4 inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                    <RetryIcon /> Retry
                </button>
            </div>
        );
    }

    return (
      <div className="text-center text-slate-500">
        <p>Pending...</p>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden shadow-md border border-slate-700 transition-all hover:border-cyan-600 hover:shadow-cyan-600/10">
      <div className="grid grid-cols-2 gap-px bg-slate-700">
        <img src={image.originalUrl} alt="Original" className="w-full h-auto object-cover aspect-square" />
        <div className="flex items-center justify-center bg-slate-800 aspect-square relative p-2">
          {renderContent()}
          {showRetryOptions && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 gap-3 z-10">
              <h4 className="font-semibold text-white">Retry with:</h4>
              <button onClick={() => handleRetry(ToolEnum.Heal)} className="w-full inline-flex items-center justify-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                  <WandIcon /> Heal
              </button>
              <button onClick={() => handleRetry(ToolEnum.GenerativeRemove)} className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <SparklesIcon /> Gen Remove
              </button>
              <button onClick={() => setShowRetryOptions(false)} className="text-slate-400 hover:text-white text-sm mt-2">
                  Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="p-3 bg-slate-800/50 flex justify-between items-center">
        <p className="text-sm text-slate-400 truncate" title={image.originalFile.name}>
          {image.originalFile.name}
        </p>
        {image.toolUsed && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${image.toolUsed === 'heal' ? 'bg-cyan-900 text-cyan-300' : 'bg-indigo-900 text-indigo-300'}`}>
                {image.toolUsed === 'heal' ? 'H' : 'GR'}
            </span>
        )}
      </div>
    </div>
  );
};


export const ResultsGrid: React.FC<ResultsGridProps> = ({ images, onRetrySingle, retryingImageName }) => {
  if (images.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg">
        <p className="text-slate-500">Your processed images will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {images.map((image) => (
        <ImageCard
            key={image.originalFile.name}
            image={image}
            onRetrySingle={onRetrySingle}
            isRetrying={retryingImageName === image.originalFile.name}
        />
      ))}
    </div>
  );
};