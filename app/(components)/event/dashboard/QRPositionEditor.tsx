'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  X,
  QrCode,
  FileImage,
  FileText,
  Loader2,
  Grid,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/app/(components)/ui/button';

interface QRPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface QRPositionEditorProps {
  templateUrl: string;
  templateType: 'image' | 'pdf';
  initialPosition?: QRPosition;
  onSave: (position: QRPosition) => void;
  onCancel: () => void;
}

const DEFAULT_POSITION: QRPosition = {
  x: 50,
  y: 50,
  width: 15,
  height: 15,
  rotation: 0,
};

export function QRPositionEditor({
  templateUrl,
  templateType,
  initialPosition,
  onSave,
  onCancel,
}: QRPositionEditorProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<QRPosition>(initialPosition || DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  
  // PDF specific state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);

  // Load PDF.js locally (bundled) to avoid CSP issues
  useEffect(() => {
    if (templateType === 'pdf') {
      loadPdfFromBundle();
    } else {
      setLoading(false);
    }
  }, [templateType]);

  // Render PDF when loaded or page changes
  useEffect(() => {
    if (pdfDoc && templateType === 'pdf') {
      renderPdfPage(currentPage);
    }
  }, [pdfDoc, currentPage]);

  const loadPdfFromBundle = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dynamically import PDF.js (legacy build) for better compatibility with Webpack
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
      const workerSrc = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')).default;

      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

      await loadPdfDocument(pdfjsLib);
    } catch (err: any) {
      console.error('Error loading PDF.js:', err);
      setError(t('QR_EDITOR_PDF_ERROR'));
      setLoading(false);
    }
  };

  const loadPdfDocument = async (pdfjsLib: any) => {
    try {
      if (!pdfjsLib) {
        throw new Error('PDF.js not loaded');
      }

      const loadingTask = pdfjsLib.getDocument(templateUrl);
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
    } catch (err: any) {
      console.error('Error loading PDF document:', err);
      setError(t('QR_EDITOR_PDF_ERROR'));
      setLoading(false);
    }
  };

  const renderPdfPage = async (pageNum: number) => {
    if (!pdfDoc) return;

    try {
      setLoading(true);
      
      const page = await pdfDoc.getPage(pageNum);
      const scale = 2; // Higher scale for better quality
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert canvas to image URL
      const imageUrl = canvas.toDataURL('image/png');
      setRenderedImageUrl(imageUrl);
      setLoading(false);
      
    } catch (err: any) {
      console.error('Error rendering PDF page:', err);
      setError(t('QR_EDITOR_RENDER_ERROR'));
      setLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !qrRef.current) return;
    
    const rect = qrRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const handleSize = 12;
    const corners = {
      'nw': { x: rect.left, y: rect.top },
      'ne': { x: rect.right, y: rect.top },
      'sw': { x: rect.left, y: rect.bottom },
      'se': { x: rect.right, y: rect.bottom },
    };

    for (const [corner, pos] of Object.entries(corners)) {
      if (
        Math.abs(e.clientX - pos.x) < handleSize &&
        Math.abs(e.clientY - pos.y) < handleSize
      ) {
        e.preventDefault();
        setIsResizing(true);
        setResizeCorner(corner);
        setDragStart({ x: e.clientX, y: e.clientY });
        return;
      }
    }

    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - (position.x / 100) * containerRect.width,
        y: e.clientY - (position.y / 100) * containerRect.height,
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    if (isDragging) {
      const newX = ((e.clientX - dragStart.x) / containerRect.width) * 100;
      const newY = ((e.clientY - dragStart.y) / containerRect.height) * 100;

      setPosition(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, newX)),
        y: Math.max(0, Math.min(100 - prev.height, newY)),
      }));
    }

    if (isResizing && resizeCorner) {
      const deltaX = ((e.clientX - dragStart.x) / containerRect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / containerRect.height) * 100;

      setPosition(prev => {
        let newPos = { ...prev };

        switch (resizeCorner) {
          case 'se':
            newPos.width = Math.max(5, prev.width + deltaX);
            if (lockAspectRatio) {
              newPos.height = newPos.width;
            } else {
              newPos.height = Math.max(5, prev.height + deltaY);
            }
            break;
          case 'sw':
            newPos.x = Math.max(0, prev.x + deltaX);
            newPos.width = Math.max(5, prev.width - deltaX);
            if (lockAspectRatio) {
              newPos.height = newPos.width;
            } else {
              newPos.height = Math.max(5, prev.height + deltaY);
            }
            break;
          case 'ne':
            newPos.y = Math.max(0, prev.y + deltaY);
            newPos.width = Math.max(5, prev.width + deltaX);
            if (lockAspectRatio) {
              newPos.height = newPos.width;
              newPos.y = prev.y - (newPos.height - prev.height);
            } else {
              newPos.height = Math.max(5, prev.height - deltaY);
            }
            break;
          case 'nw':
            newPos.x = Math.max(0, prev.x + deltaX);
            newPos.y = Math.max(0, prev.y + deltaY);
            newPos.width = Math.max(5, prev.width - deltaX);
            if (lockAspectRatio) {
              newPos.height = newPos.width;
            } else {
              newPos.height = Math.max(5, prev.height - deltaY);
            }
            break;
        }

        newPos.width = Math.min(newPos.width, 100 - newPos.x);
        newPos.height = Math.min(newPos.height, 100 - newPos.y);

        return newPos;
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isResizing, resizeCorner, dragStart, lockAspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeCorner(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault(),
      } as any);
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as any);
    }
  }, [handleMouseMove]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleTouchMove, handleMouseUp]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetPosition = () => setPosition(DEFAULT_POSITION);

  const handleSave = () => {
    onSave(position);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (templateType === 'pdf') {
      loadPdfFromBundle();
    } else {
      setLoading(false);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 5 : 1;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setPosition(prev => ({ ...prev, x: Math.max(0, prev.x - step) }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPosition(prev => ({ ...prev, x: Math.min(100 - prev.width, prev.x + step) }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setPosition(prev => ({ ...prev, y: Math.max(0, prev.y - step) }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setPosition(prev => ({ ...prev, y: Math.min(100 - prev.height, prev.y + step) }));
          break;
        case '+':
        case '=':
          e.preventDefault();
          setPosition(prev => ({
            ...prev,
            width: Math.min(prev.width + step, 100 - prev.x),
            height: lockAspectRatio ? Math.min(prev.width + step, 100 - prev.x) : Math.min(prev.height + step, 100 - prev.y),
          }));
          break;
        case '-':
          e.preventDefault();
          setPosition(prev => ({
            ...prev,
            width: Math.max(5, prev.width - step),
            height: lockAspectRatio ? Math.max(5, prev.width - step) : Math.max(5, prev.height - step),
          }));
          break;
        case 'Escape':
          onCancel();
          break;
        case 'Enter':
          if (e.ctrlKey || e.metaKey) {
            handleSave();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lockAspectRatio, onCancel]);

  // Get the display image URL
  const displayImageUrl = templateType === 'pdf' ? renderedImageUrl : templateUrl;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              {templateType === 'pdf' ? <FileText className="h-5 w-5" /> : <FileImage className="h-5 w-5" />}
              {t('QR_EDITOR_TITLE')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('QR_EDITOR_DESC')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t('QR_EDITOR_CANCEL')}
          </Button>
          <Button onClick={handleSave} disabled={loading || !!error}>
            <Save className="h-4 w-4 mr-2" />
            {t('QR_EDITOR_SAVE')}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card/80 border-b border-border px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={loading}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-16 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={loading}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="outline" size="sm" onClick={handleResetPosition} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-1" />
            {t('QR_EDITOR_RESET')}
          </Button>
          <Button
            variant={showGrid ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            disabled={loading}
          >
            <Grid className="h-4 w-4 mr-1" />
            {t('QR_EDITOR_GRID')}
          </Button>
          <Button
            variant={lockAspectRatio ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLockAspectRatio(!lockAspectRatio)}
            disabled={loading}
          >
            {lockAspectRatio ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
            {t('QR_EDITOR_ASPECT_RATIO')}
          </Button>

          {/* PDF Page Navigation */}
          {templateType === 'pdf' && totalPages > 1 && !loading && !error && (
            <>
              <div className="w-px h-6 bg-border mx-2" />
              <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">X:</span>
            <input
              type="number"
              value={Math.round(position.x)}
              onChange={(e) => setPosition(prev => ({ ...prev, x: Math.max(0, Math.min(100 - prev.width, Number(e.target.value))) }))}
              className="w-16 px-2 py-1 rounded border border-border bg-background text-center"
              min={0}
              max={100}
              disabled={loading}
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Y:</span>
            <input
              type="number"
              value={Math.round(position.y)}
              onChange={(e) => setPosition(prev => ({ ...prev, y: Math.max(0, Math.min(100 - prev.height, Number(e.target.value))) }))}
              className="w-16 px-2 py-1 rounded border border-border bg-background text-center"
              min={0}
              max={100}
              disabled={loading}
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t('QR_EDITOR_SIZE')}:</span>
            <input
              type="number"
              value={Math.round(position.width)}
              onChange={(e) => {
                const newWidth = Math.max(5, Math.min(100, Number(e.target.value)));
                setPosition(prev => ({
                  ...prev,
                  width: newWidth,
                  height: lockAspectRatio ? newWidth : prev.height,
                }));
              }}
              className="w-16 px-2 py-1 rounded border border-border bg-background text-center"
              min={5}
              max={100}
              disabled={loading}
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span>{t('QR_EDITOR_LOADING')}</span>
            {templateType === 'pdf' && (
              <span className="text-sm">{t('QR_EDITOR_LOADING_PDF')}</span>
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <FileText className="h-16 w-16 text-red-500" />
            <span className="text-red-500">{error}</span>
            <Button onClick={handleRetry}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('QR_EDITOR_RETRY')}
            </Button>
          </div>
        ) : displayImageUrl ? (
          <div
            ref={containerRef}
            className="relative bg-white shadow-2xl cursor-crosshair select-none"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Template Image */}
            <img
              src={displayImageUrl}
              alt="Template"
              className="max-w-full max-h-[70vh] pointer-events-none"
              onLoad={() => setLoading(false)}
              draggable={false}
            />

            {/* Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none">
                <svg width="100%" height="100%" className="opacity-30">
                  <defs>
                    <pattern id="grid" width="10%" height="10%" patternUnits="userSpaceOnUse">
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            )}

            {/* QR Code Box */}
            <div
              ref={qrRef}
              className={`absolute border-2 border-primary bg-white flex items-center justify-center transition-shadow ${
                isDragging || isResizing ? 'shadow-lg border-primary ring-4 ring-primary/30' : 'shadow-md'
              }`}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: `${position.width}%`,
                height: `${position.height}%`,
                cursor: isDragging ? 'grabbing' : 'grab',
                transform: `rotate(${position.rotation}deg)`,
              }}
            >
              {/* QR Preview - Styled rounded QR representation */}
              <div className="w-full h-full p-1 flex items-center justify-center bg-white rounded-sm overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Background */}
                  <rect width="100" height="100" fill="white" />
                  
                  {/* Top-left finder pattern */}
                  <rect x="5" y="5" width="25" height="25" rx="5" fill="#1a1a2e" />
                  <rect x="9" y="9" width="17" height="17" rx="3" fill="white" />
                  <rect x="13" y="13" width="9" height="9" rx="2" fill="#1a1a2e" />
                  
                  {/* Top-right finder pattern */}
                  <rect x="70" y="5" width="25" height="25" rx="5" fill="#1a1a2e" />
                  <rect x="74" y="9" width="17" height="17" rx="3" fill="white" />
                  <rect x="78" y="13" width="9" height="9" rx="2" fill="#1a1a2e" />
                  
                  {/* Bottom-left finder pattern */}
                  <rect x="5" y="70" width="25" height="25" rx="5" fill="#1a1a2e" />
                  <rect x="9" y="74" width="17" height="17" rx="3" fill="white" />
                  <rect x="13" y="78" width="9" height="9" rx="2" fill="#1a1a2e" />
                  
                  {/* Data dots (rounded) */}
                  <circle cx="40" cy="15" r="3" fill="#1a1a2e" />
                  <circle cx="50" cy="15" r="3" fill="#1a1a2e" />
                  <circle cx="60" cy="15" r="3" fill="#1a1a2e" />
                  <circle cx="40" cy="25" r="3" fill="#1a1a2e" />
                  <circle cx="60" cy="25" r="3" fill="#1a1a2e" />
                  
                  <circle cx="15" cy="40" r="3" fill="#1a1a2e" />
                  <circle cx="25" cy="40" r="3" fill="#1a1a2e" />
                  <circle cx="15" cy="50" r="3" fill="#1a1a2e" />
                  <circle cx="25" cy="50" r="3" fill="#1a1a2e" />
                  <circle cx="15" cy="60" r="3" fill="#1a1a2e" />
                  
                  <circle cx="40" cy="40" r="3" fill="#1a1a2e" />
                  <circle cx="50" cy="40" r="3" fill="#1a1a2e" />
                  <circle cx="60" cy="40" r="3" fill="#1a1a2e" />
                  <circle cx="40" cy="50" r="3" fill="#1a1a2e" />
                  <circle cx="50" cy="50" r="3" fill="#1a1a2e" />
                  <circle cx="60" cy="50" r="3" fill="#1a1a2e" />
                  <circle cx="40" cy="60" r="3" fill="#1a1a2e" />
                  <circle cx="50" cy="60" r="3" fill="#1a1a2e" />
                  <circle cx="60" cy="60" r="3" fill="#1a1a2e" />
                  
                  <circle cx="75" cy="40" r="3" fill="#1a1a2e" />
                  <circle cx="85" cy="40" r="3" fill="#1a1a2e" />
                  <circle cx="75" cy="50" r="3" fill="#1a1a2e" />
                  <circle cx="85" cy="50" r="3" fill="#1a1a2e" />
                  <circle cx="75" cy="60" r="3" fill="#1a1a2e" />
                  <circle cx="85" cy="60" r="3" fill="#1a1a2e" />
                  
                  <circle cx="40" cy="75" r="3" fill="#1a1a2e" />
                  <circle cx="50" cy="75" r="3" fill="#1a1a2e" />
                  <circle cx="60" cy="75" r="3" fill="#1a1a2e" />
                  <circle cx="75" cy="75" r="3" fill="#1a1a2e" />
                  <circle cx="85" cy="75" r="3" fill="#1a1a2e" />
                  <circle cx="40" cy="85" r="3" fill="#1a1a2e" />
                  <circle cx="50" cy="85" r="3" fill="#1a1a2e" />
                  <circle cx="60" cy="85" r="3" fill="#1a1a2e" />
                  <circle cx="75" cy="85" r="3" fill="#1a1a2e" />
                  <circle cx="85" cy="85" r="3" fill="#1a1a2e" />
                </svg>
              </div>

              {/* Resize Handles */}
              {['nw', 'ne', 'sw', 'se'].map((corner) => (
                <div
                  key={corner}
                  className={`absolute w-4 h-4 bg-primary border-2 border-white rounded-sm shadow-md ${
                    corner.includes('n') ? '-top-2' : '-bottom-2'
                  } ${corner.includes('w') ? '-left-2' : '-right-2'} cursor-${
                    corner === 'nw' || corner === 'se' ? 'nwse' : 'nesw'
                  }-resize hover:scale-110 transition-transform`}
                />
              ))}

              {/* Move Label */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 whitespace-nowrap shadow-lg">
                <Move className="h-3 w-3" />
                {t('QR_EDITOR_DRAG')}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <FileImage className="h-16 w-16" />
            <span>{t('QR_EDITOR_NO_TEMPLATE')}</span>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="bg-card border-t border-border p-3 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span>🖱️ {t('QR_EDITOR_HINT_DRAG')}</span>
          <span>📐 {t('QR_EDITOR_HINT_RESIZE')}</span>
          <span>⌨️ {t('QR_EDITOR_HINT_KEYBOARD')}</span>
          <span>⏎ Ctrl+Enter {t('QR_EDITOR_HINT_SAVE')}</span>
        </div>
      </div>
    </div>
  );
}
