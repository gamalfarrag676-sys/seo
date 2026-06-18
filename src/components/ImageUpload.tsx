import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, X, Download, Zap, ShieldCheck, CheckCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { optimizeImage, formatBytes, scanForMetadata } from '../utils/imageOptimizer';

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  selectedImage: File | null;
  className?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUpload({ onImageSelect, selectedImage, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [optimizationStats, setOptimizationStats] = useState<{ original: number, optimized: number } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [wasCleanStart, setWasCleanStart] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  // Cleanup object URLs on unmount or when they change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (optimizedUrl) URL.revokeObjectURL(optimizedUrl);
    };
  }, [optimizedUrl]);

  // Generate preview URL when selectedImage changes
  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedImage]);

  // Helper to trigger optimization
  const handleOptimization = async (file: File) => {
    setIsOptimizing(true);
    setWasCleanStart(false);

    try {
      // 1. Scan for Metadata FIRST
      const foundTokens = await scanForMetadata(file);
      const isClean = foundTokens.length === 0;
      setWasCleanStart(isClean);

      // 2. Optimization (Always run it to ensure size caps < 50KB)
      const result = await optimizeImage(file);
      const url = URL.createObjectURL(result.blob);
      setOptimizedUrl(url);
      setOptimizationStats({
        original: result.originalSize,
        optimized: result.optimizedSize
      });
      
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSizeError(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        if (file.size > MAX_FILE_SIZE) {
          setSizeError('حجم الملف يتجاوز 10 ميجابايت. يرجى اختيار صورة أصغر.');
          return;
        }
        onImageSelect(file);
        handleOptimization(file);
      }
    }
  }, [onImageSelect, handleOptimization]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > MAX_FILE_SIZE) {
        setSizeError('حجم الملف يتجاوز 10 ميجابايت. يرجى اختيار صورة أصغر.');
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      onImageSelect(file);
      handleOptimization(file);
    }
  }, [onImageSelect, handleOptimization]);

  const removeImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onImageSelect(null);
    setOptimizedUrl(null);
    setOptimizationStats(null);
    setWasCleanStart(false);
    setPreviewUrl(null);
    setSizeError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onImageSelect]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (optimizedUrl) {
      const a = document.createElement('a');
      a.href = optimizedUrl;
      a.download = `optimized-product-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div
      className={twMerge(
        "relative group cursor-pointer transition-all duration-300",
        className
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        accept="image/*"
        className="hidden"
      />
      
      <div className={clsx(
        "w-full h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all duration-300",
        selectedImage 
          ? "border-emerald-500/50 bg-emerald-500/10" 
          : "border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800/50 bg-slate-800/20"
      )}>
        {selectedImage ? (
          <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center gap-4 overflow-hidden rounded-xl">
            
            {/* Optimization Loading Overlay */}
            {isOptimizing && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm rounded-xl">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-sm text-slate-200">جاري تحسين الصورة...</span>
                </div>
              </div>
            )}

            {/* Image Preview */}
            <div className="relative flex-1 h-full w-full flex items-center justify-center">
               <img 
              src={previewUrl ?? ''} 
              alt="معاينة" 
              className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
            />
            </div>

            {/* Optimization Status Overlay / Sidebar */}
            {optimizationStats && (
              <div 
                className="absolute md:static bottom-0 w-full md:w-56 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-emerald-500/20 shadow-xl flex flex-col gap-2 animate-in slide-in-from-bottom-2"
                onClick={(e) => e.stopPropagation()} 
              >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                    <Zap size={14} fill="currentColor"/>
                    ضغط وتسريع
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>الأصلي:</span>
                    <span className="line-through">{formatBytes(optimizationStats.original)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white font-bold">
                    <span>بعد الضغط:</span>
                    <span className="text-emerald-400">{formatBytes(optimizationStats.optimized)}</span>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="mt-2 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download size={14} />
                    تحميل الصورة
                  </button>
                  
                  {/* METADATA STATUS REPORT */}
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                    
                    {wasCleanStart ? (
                      // SCENARIO 1: IMAGE WAS ALREADY CLEAN
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-2 text-center">
                         <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs mb-1">
                            <CheckCircle size={14} />
                            <span>نظيفة 100%</span>
                         </div>
                         <p className="text-[10px] text-emerald-300/80">
                           لم يتم العثور على أي بيانات وصفية
                         </p>
                      </div>
                    ) : (
                      // SCENARIO 2: IMAGE HAD DATA, WE CLEANED IT
                      <>
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium opacity-90">
                          <ShieldCheck size={12} />
                           <span>تم تنظيف البيانات بعمق:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-400">
                           <div className="flex items-center gap-1">
                             <span className="text-emerald-500 font-bold">✓</span> الموقع
                           </div>
                           <div className="flex items-center gap-1">
                             <span className="text-emerald-500 font-bold">✓</span> الكاميرا
                           </div>
                           <div className="flex items-center gap-1">
                             <span className="text-emerald-500 font-bold">✓</span> السجل
                           </div>
                           <div className="flex items-center gap-1">
                             <span className="text-emerald-500 font-bold">✓</span> الجهاز
                           </div>
                        </div>
                      </>
                    )}

                  </div>
              </div>
            )}

            <button 
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm shadow-lg z-10"
            >
              <X size={16} />
            </button>
            
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-200">
                رفع صورة المنتج
              </p>
              <p className="text-sm text-slate-400 mt-1">
                اسحب وأفلت أو اضغط للاختيار
              </p>
            </div>
            {sizeError && (
              <p className="text-sm text-red-400 font-medium mt-2">{sizeError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
