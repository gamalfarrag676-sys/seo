import React, { useState, useRef } from 'react';
import { Upload, Play, StopCircle, Download, FileText, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useApiKeys } from '../hooks/useApiKeys';
import { useToast } from './Toast';
import { parseCSV, processBulkItems, exportToCSV, type BulkItem, type BulkProgress } from '../utils/bulkProcessor';

export const BulkGenerator: React.FC = () => {
  const { apiKey, openaiKey, aiProvider } = useApiKeys();
  const toast = useToast();
  
  const [items, setItems] = useState<BulkItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedItems = parseCSV(text);
      if (parsedItems.length > 0) {
        setItems(parsedItems);
        toast.success(`تم استيراد ${parsedItems.length} منتج بنجاح`);
      } else {
        toast.error('الملف فارغ أو بتنسيق غير صحيح. تأكد من وجود أعمدة: اسم المنتج، الكلمة المفتاحية');
      }
    };
    reader.readAsText(file, 'UTF-8');
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = 'اسم المنتج,الكلمة المفتاحية,وصف إضافي (اختياري)\nمكيف سبليت جري,مكيف جري,مكيف 18 وحدة بارد فقط\nعطر ديور سوفاج,عطر سوفاج الأصلي,\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'seo-bulk-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startProcessing = async () => {
    const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;
    if (!currentKey) {
      toast.error('مفتاح API غير متوفر');
      return;
    }
    
    if (items.length === 0) return;

    setIsProcessing(true);
    abortControllerRef.current = new AbortController();

    try {
      const updatedItems = await processBulkItems(
        items,
        currentKey,
        aiProvider,
        'expert', // default style for bulk
        (p) => setProgress(p),
        abortControllerRef.current.signal
      );
      
      setItems(updatedItems);
      
      if (!abortControllerRef.current.signal.aborted) {
        toast.success('تم الانتهاء من التوليد الجماعي!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء التوليد');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const stopProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
      toast.info('تم إيقاف التوليد');
    }
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;
    const csvStr = exportToCSV(items);
    const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bulk-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearList = () => {
    if (confirm('هل أنت متأكد من مسح القائمة الحالية؟')) {
      setItems([]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header & Controls */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            التوليد الجماعي
          </h2>
          <p className="text-sm text-slate-400 mt-1">ارفع ملف CSV لتوليد محتوى عشرات المنتجات دفعة واحدة.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {!isProcessing ? (
            <>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-colors flex flex-1 justify-center items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تحميل القالب
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-bold transition-colors flex flex-1 justify-center items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                رفع ملف CSV
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".csv" 
                className="hidden" 
              />
            </>
          ) : (
            <button
              onClick={stopProcessing}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold transition-colors flex flex-1 justify-center items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              إيقاف التوليد
            </button>
          )}

          {items.length > 0 && !isProcessing && (
            <button
              onClick={startProcessing}
              className="btn-premium px-6 py-2 rounded-lg text-sm flex-1 md:flex-none justify-center"
            >
              <Play className="w-4 h-4" />
              ابدأ التوليد ({items.length})
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && progress && (
        <div className="glass-card p-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-bold text-indigo-400">جاري المعالجة: {progress.current}</span>
            <span className="text-slate-400">{progress.completed} / {progress.total}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
          {progress.failed > 0 && (
            <p className="text-xs text-red-400 mt-2">فشل توليد {progress.failed} عناصر</p>
          )}
        </div>
      )}

      {/* Results Table */}
      {items.length > 0 && (
        <div className="glass-card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white">قائمة المنتجات</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                title="تصدير النتائج"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={clearList}
                disabled={isProcessing}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                title="مسح القائمة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">اسم المنتج</th>
                  <th className="px-4 py-3 font-semibold">الكلمة المفتاحية</th>
                  <th className="px-4 py-3 font-semibold">طول المحتوى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 w-10">
                      {item.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-600" />}
                      {item.status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                      {item.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {item.status === 'error' && (
                        <div title={item.error}><AlertCircle className="w-4 h-4 text-red-400" /></div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">{item.productName}</td>
                    <td className="px-4 py-3 text-slate-400">
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs">{item.keyword}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.result ? (
                        <span className="text-emerald-400 font-medium">
                          {item.result.mainContent.split(' ').length} كلمة
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-700/50">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-300 mb-2">القائمة فارغة</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            قم بتحميل القالب، املأه بمنتجاتك، ثم ارفعه هنا للبدء بالتوليد الجماعي.
          </p>
        </div>
      )}
    </div>
  );
};
