// src/hooks/useCompetitorAnalysis.ts
import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { analyzeCompetitor, type FullCompetitorReport, CompetitorAnalysisError } from '../utils/competitorAnalyzer';

interface UseCompetitorAnalysisReturn {
  report: FullCompetitorReport | null;
  isLoading: boolean;
  error: string | null;
  analyze: (input: string, yourUrl?: string) => Promise<void>;
  clearReport: () => void;
}

export function useCompetitorAnalysis(
  apiKey: string,
  provider: 'gemini' | 'openai'
): UseCompetitorAnalysisReturn {
  const toast = useToast();
  const [report, setReport] = useState<FullCompetitorReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (input: string, yourUrl?: string) => {
    if (!apiKey?.trim()) {
      setError('مفتاح API غير موجود. يرجى إضافة مفتاح من الإعدادات.');
      toast.error('مفتاح API غير موجود');
      return;
    }

    if (!input?.trim()) {
      setError('يرجى إدخال كلمة مفتاحية أو رابط منافس');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      toast.info('جاري تحليل المنافسين... قد يستغرق 30-60 ثانية');
      
      const result = await analyzeCompetitor(input, apiKey, provider, yourUrl);
      
      setReport(result);
      toast.success('تم إكمال تحليل المنافسين! ✨');
    } catch (err: any) {
      let message = 'حدث خطأ غير متوقع';
      
      if (err instanceof CompetitorAnalysisError) {
        switch (err.code) {
          case 'EMPTY_INPUT':
            message = 'يرجى إدخال كلمة مفتاحية أو رابط';
            break;
          case 'MISSING_API_KEY':
            message = 'مفتاح API غير موجود';
            break;
          case 'SCRAPE_FAILED':
            message = 'تعذر الوصول للموقع. جرب رابط آخر.';
            break;
          case 'NO_COMPETITORS':
            message = 'لم يتم العثور على منافسين لهذه الكلمة';
            break;
          case 'ALL_SCRAPES_FAILED':
            message = 'تعذر جلب بيانات المنافسين. جرب مرة أخرى.';
            break;
          default:
            message = err.message;
        }
      } else if (err.message?.includes('API')) {
        message = 'خطأ في API. تأكد من صحة المفتاح.';
      } else if (err.message?.includes('timeout')) {
        message = 'انتهت المهلة. جرب مرة أخرى.';
      } else {
        message = err.message || 'حدث خطأ غير متوقع';
      }
      
      setError(message);
      toast.error(message);
      console.error('[CompetitorAnalysis] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, provider, toast]);

  const clearReport = useCallback(() => {
    setReport(null);
    setError(null);
  }, []);

  return {
    report,
    isLoading,
    error,
    analyze,
    clearReport,
  };
}
