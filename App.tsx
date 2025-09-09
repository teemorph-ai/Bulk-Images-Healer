import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { Header } from './components/Header';
import { ImageProcessor } from './components/ImageProcessor';
import { ResultsGrid } from './components/ResultsGrid';
import { Corner as CornerEnum, Tool as ToolEnum } from './types';
import type { AppImage, Corner, Tool } from './types';
import { fileToBase64, getMimeType } from './utils';
import { removeObjectFromImage } from './services/geminiService';

const App: React.FC = () => {
  const [appImages, setAppImages] = useState<AppImage[]>([]);
  const [corner, setCorner] = useState<Corner>(CornerEnum.TopLeft);
  const [tool, setTool] = useState<Tool>(ToolEnum.Heal);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [retryingImageName, setRetryingImageName] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [processingTotal, setProcessingTotal] = useState<number>(0);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    setGlobalError(null);
    const newImages: AppImage[] = Array.from(files).map(file => ({
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      status: 'pending',
    }));
    setAppImages(newImages);
    setProcessedCount(0);
    setProcessingTotal(0);
  };

  const handleClear = () => {
    appImages.forEach(image => URL.revokeObjectURL(image.originalUrl));
    setAppImages([]);
    setGlobalError(null);
    setProcessedCount(0);
    setProcessingTotal(0);
  };

  const handleProcessImages = useCallback(async () => {
    if (appImages.length === 0) {
      setGlobalError("Please select images to process.");
      return;
    }
    if (isProcessing || retryingImageName) return;

    setIsProcessing(true);
    setGlobalError(null);
    setProcessedCount(0);
    setProcessingTotal(appImages.length);

    const processingQueue: AppImage[] = appImages.map(img => ({ ...img, status: 'pending', processedUrl: undefined, error: undefined }));
    setAppImages(processingQueue);

    for (let i = 0; i < processingQueue.length; i++) {
      const imageToProcess = processingQueue[i];

      setAppImages(currentImages => currentImages.map(img =>
        img.originalFile.name === imageToProcess.originalFile.name ? { ...img, status: 'processing' } : img
      ));

      try {
        const base64 = await fileToBase64(imageToProcess.originalFile);
        const mimeType = getMimeType(imageToProcess.originalFile);
        const resultBase64 = await removeObjectFromImage(base64, mimeType, corner, tool);

        setAppImages(currentImages => currentImages.map(img =>
          img.originalFile.name === imageToProcess.originalFile.name
            ? { ...img, status: 'done', processedUrl: `data:${mimeType};base64,${resultBase64}`, toolUsed: tool }
            : img
        ));
      } catch (e) {
        setAppImages(currentImages => currentImages.map(img =>
          img.originalFile.name === imageToProcess.originalFile.name
            ? { ...img, status: 'error', error: e instanceof Error ? e.message : 'An unknown error occurred' }
            : img
        ));
      }
      setProcessedCount(i + 1);
    }

    setIsProcessing(false);
  }, [appImages, corner, tool, isProcessing, retryingImageName]);

  const handleRetryFailedImages = useCallback(async () => {
    const failedImages = appImages.filter(img => img.status === 'error');
    if (failedImages.length === 0 || isProcessing || retryingImageName) return;

    setIsProcessing(true);
    setGlobalError(null);
    setProcessedCount(0);
    setProcessingTotal(failedImages.length);

    setAppImages(prev => prev.map(img =>
      img.status === 'error' ? { ...img, status: 'pending', error: undefined } : img
    ));

    for (let i = 0; i < failedImages.length; i++) {
      const imageToProcess = failedImages[i];

      setAppImages(currentImages => currentImages.map(img =>
        img.originalFile.name === imageToProcess.originalFile.name ? { ...img, status: 'processing' } : img
      ));

      try {
        const base64 = await fileToBase64(imageToProcess.originalFile);
        const mimeType = getMimeType(imageToProcess.originalFile);
        const resultBase64 = await removeObjectFromImage(base64, mimeType, corner, tool);

        setAppImages(currentImages => currentImages.map(img =>
          img.originalFile.name === imageToProcess.originalFile.name
            ? { ...img, status: 'done', processedUrl: `data:${mimeType};base64,${resultBase64}`, toolUsed: tool }
            : img
        ));
      } catch (e) {
        setAppImages(currentImages => currentImages.map(img =>
          img.originalFile.name === imageToProcess.originalFile.name
            ? { ...img, status: 'error', error: e instanceof Error ? e.message : 'An unknown error occurred' }
            : img
        ));
      }
      setProcessedCount(i + 1);
    }
    setIsProcessing(false);
  }, [appImages, corner, tool, isProcessing, retryingImageName]);

  const handleRetrySingleImage = useCallback(async (imageToRetry: AppImage, toolToUse: Tool) => {
    if (isProcessing || retryingImageName) return;

    setRetryingImageName(imageToRetry.originalFile.name);
    setAppImages(currentImages => currentImages.map(img =>
      img.originalFile.name === imageToRetry.originalFile.name ? { ...img, status: 'processing', error: undefined } : img
    ));

    try {
      const base64 = await fileToBase64(imageToRetry.originalFile);
      const mimeType = getMimeType(imageToRetry.originalFile);
      const resultBase64 = await removeObjectFromImage(base64, mimeType, corner, toolToUse);

      setAppImages(currentImages => currentImages.map(img =>
        img.originalFile.name === imageToRetry.originalFile.name
          ? { ...img, status: 'done', processedUrl: `data:${mimeType};base64,${resultBase64}`, toolUsed: toolToUse }
          : img
      ));
    } catch (e) {
      setAppImages(currentImages => currentImages.map(img =>
        img.originalFile.name === imageToRetry.originalFile.name
          ? { ...img, status: 'error', error: e instanceof Error ? e.message : 'An unknown error occurred' }
          : img
      ));
    }

    setRetryingImageName(null);
  }, [isProcessing, retryingImageName, corner]);
  
  const handleDownloadAll = async () => {
    if (isDownloading) return;
    const downloadableImages = appImages.filter((img) => img.status === 'done' && img.processedUrl);
    if (downloadableImages.length === 0) return;

    setIsDownloading(true);
    setGlobalError(null);

    try {
      const zip = new JSZip();
      for (const image of downloadableImages) {
        if (image.processedUrl) {
          const base64Data = image.processedUrl.split(',')[1];
          const nameParts = image.originalFile.name.split('.');
          const extension = nameParts.pop();
          const name = nameParts.join('.');
          const filename = `${name}_healed.${extension}`;
          zip.file(filename, base64Data, { base64: true });
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'healed-images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Failed to create zip file", error);
      setGlobalError("Could not create the zip file. Please try downloading images individually.");
    } finally {
      setIsDownloading(false);
    }
  };

  const hasErrors = appImages.some(img => img.status === 'error');
  const hasDownloads = appImages.some(img => img.status === 'done');
  const isAnythingProcessing = isProcessing || !!retryingImageName;

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Header />
        {globalError && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative my-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{globalError}</span>
            </div>
        )}
        <ImageProcessor
          onFilesSelected={handleFilesSelected}
          onProcess={handleProcessImages}
          onClear={handleClear}
          onRetry={handleRetryFailedImages}
          onDownloadAll={handleDownloadAll}
          isProcessing={isAnythingProcessing}
          isDownloading={isDownloading}
          imageCount={appImages.length}
          processedCount={processedCount}
          processingTotal={processingTotal}
          hasErrors={hasErrors}
          hasDownloads={hasDownloads}
          selectedCorner={corner}
          onCornerChange={setCorner}
          selectedTool={tool}
          onToolChange={setTool}
        />
        <ResultsGrid
          images={appImages}
          onRetrySingle={handleRetrySingleImage}
          retryingImageName={retryingImageName}
        />
      </main>
    </div>
  );
};

export default App;