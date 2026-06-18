// src/hooks/useContentGenerator.ts — OPTIMIZED VERSION
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { checkUsageLimit, incrementUsage } from '../lib/supabase';
import { generateSEOContent, type SEOContent, type ContentStyle, GeminiAPIError } from '../utils/gemini';
import { getBestModel } from '../utils/aiTools';
import { generateContentWithOpenAI, OpenAIAPIError } from '../utils/openai';
import { getArticlePrompt, parseArticleResponse, type ArticleStyle, type ArticleLength } from '../utils/articleGenerator';
import { sanitizeForPrompt } from '../utils/inputSanitizer';

interface UseContentGeneratorOptions {
  profileId?: string;
  apiKey: string;
  openaiKey: string;
  aiProvider: 'gemini' | 'openai';
}

interface GenerateProductOptions {
  image: File;
  productName: string;
  keyword: string;
  contentStyle: ContentStyle;
}

interface GenerateArticleOptions {
  keyword: string;
  secondaryKeywords?: string;
  style?: ArticleStyle;
  length?: ArticleLength;
  notes?: string;
}

interface UseContentGeneratorReturn {
  generatedContent: SEOContent | null;
  isLoading: boolean;
  error: string | null;
  generateProduct: (options: GenerateProductOptions) => Promise<boolean>;
  generateArticle: (options: GenerateArticleOptions) => Promise<boolean>;
  updateContent: (updates: Partial<SEOContent>) => void;
  clearContent: () => void;
  clearError: () => void;
}

// ===== Error Mapping =====
function getUserFriendlyError(err: Error): string {
  if (err instanceof GeminiAPIError || err instanceof OpenAIAPIError) {
    switch (err.code) {
      case 'MISSING_API_KEY':
        return 'مفتاح API غير موجود. يرجى إضافة مفتاح من الإعدادات.';
      case 'INVALID_API_KEY':
        return 'مفتاح API غير صالح. يرجى التحقق من المفتاح.';
      case 'QUOTA_EXCEEDED':
        return 'تم تجاوز حصة API. يرجى المحاولة لاحقاً أو ترقية الخطة.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'طلبات كثيرة جداً. يرجى الانتظار لحظة.';
      case 'IMAGE_TOO_LARGE':
        return 'الصورة كبيرة جداً. الحد الأقصى 10 ميجابايت.';
      case 'INVALID_IMAGE_TYPE':
        return 'نوع الملف غير صالح. يرجى رفع صورة.';
      case 'TIMEOUT':
        return 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.';
      case 'EMPTY_RESPONSE':
        return 'لم يتم استلام رد من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.';
      default:
        return err.message;
    }
  }
  return err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

/**
 * Custom hook for generating SEO content using AI — OPTIMIZED
 */
export function useContentGenerator({
  profileId,
  apiKey,
  openaiKey,
  aiProvider,
}: UseContentGeneratorOptions): UseContentGeneratorReturn {
  const toast = useToast();
  const [generatedContent, setGeneratedContent] = useState<SEOContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const clearContent = useCallback(() => {
    if (isMountedRef.current) setGeneratedContent(null);
  }, []);

  const clearError = useCallback(() => {
    if (isMountedRef.current) setError(null);
  }, []);

  const updateContent = useCallback((updates: Partial<SEOContent>) => {
    if (!isMountedRef.current) return;
    setGeneratedContent(prev => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  // Cancel pending requests
  const cancelPending = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Generate product content
  const generateProduct = useCallback(async ({
    image,
    productName,
    keyword,
    contentStyle,
  }: GenerateProductOptions): Promise<boolean> => {
    const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;

    if (!currentKey?.trim()) {
      setError('مفتاح API غير موجود. يرجى إضافة مفتاح من الإعدادات.');
      return false;
    }

    if (!image) {
      setError('يرجى رفع صورة المنتج');
      return false;
    }

    if (!keyword?.trim()) {
      setError('يرجى إدخال الكلمة المفتاحية');
      return false;
    }

    if (!profileId) {
      setError('يجب تسجيل الدخول لتوليد المحتوى');
      return false;
    }

    // Cancel any pending request
    cancelPending();
    setIsLoading(true);
    setError(null);

    try {
      // Check usage limit
      const { allowed, remaining } = await checkUsageLimit(profileId, 'products');
      if (!allowed) {
        setError('⛔ لقد وصلت للحد الأقصى من المنتجات. تواصل مع المسؤول لزيادة الحد.');
        return false;
      }
      
      if (remaining <= 3) {
        toast.warning(`متبقي لديك ${remaining} منتج فقط!`);
      } else {
        toast.info(`متبقي لديك ${remaining} منتج`);
      }

      // Generate content
      let content: SEOContent;
      
      if (aiProvider === 'openai') {
        content = await generateContentWithOpenAI(image, productName, keyword, openaiKey, contentStyle);
      } else {
        content = await generateSEOContent(apiKey, image, productName, keyword, contentStyle);
      }

      if (!isMountedRef.current) return false;

      setGeneratedContent(content);

      // Increment usage
      await incrementUsage(profileId, 'products');
      toast.success('تم توليد المحتوى بنجاح! ✨');

      return true;
    } catch (err: any) {
      if (!isMountedRef.current) return false;
      
      const friendlyError = getUserFriendlyError(err);
      setError(friendlyError);
      console.error('[useContentGenerator] Product generation error:', err);
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [apiKey, openaiKey, aiProvider, profileId, toast, cancelPending]);

  // Generate article content
  const generateArticle = useCallback(async ({
    keyword,
    secondaryKeywords,
    style = 'informative',
    length = 'medium',
    notes,
  }: GenerateArticleOptions): Promise<boolean> => {
    const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;

    if (!currentKey?.trim()) {
      setError('مفتاح API غير موجود. يرجى إضافة مفتاح من الإعدادات.');
      return false;
    }

    if (!keyword?.trim()) {
      setError('يرجى إدخال موضوع المقال');
      return false;
    }

    if (!profileId) {
      setError('يجب تسجيل الدخول لتوليد المحتوى');
      return false;
    }

    // Cancel previous request
    cancelPending();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // Check usage limit
      const { allowed, remaining } = await checkUsageLimit(profileId, 'articles');
      if (!allowed) {
        setError('⛔ لقد وصلت للحد الأقصى من المقالات. تواصل مع المسؤول لزيادة الحد.');
        return false;
      }

      if (remaining <= 2) {
        toast.warning(`متبقي لديك ${remaining} مقال فقط!`);
      } else {
        toast.info(`متبقي لديك ${remaining} مقال`);
      }

      // Sanitize inputs
      const safeKeyword = sanitizeForPrompt(keyword, 100);
      const safeSecondary = secondaryKeywords ? sanitizeForPrompt(secondaryKeywords, 200) : undefined;
      const safeNotes = notes ? sanitizeForPrompt(notes, 500) : undefined;

      const articlePrompt = getArticlePrompt({
        keyword: safeKeyword,
        secondaryKeywords: safeSecondary,
        style,
        length,
        notes: safeNotes,
      });

      let content: SEOContent | null = null;

      if (aiProvider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: articlePrompt }],
            max_tokens: 4000
          }),
          signal: controller.signal
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new OpenAIAPIError(
            error.error?.message || 'فشل الاتصال بـ OpenAI API',
            'API_ERROR'
          );
        }
        
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        content = parseArticleResponse(text);
      } else {
        const modelName = await getBestModel(apiKey);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: articlePrompt }] }]
            }),
            signal: controller.signal
          }
        );
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new GeminiAPIError(
            error.error?.message || 'فشل الاتصال بـ Gemini API',
            'API_ERROR'
          );
        }
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        content = parseArticleResponse(text);
      }

      if (controller.signal.aborted) return false;

      if (!content || !content.h1Title) {
        throw new Error('فشل في تحليل نتيجة الذكاء الاصطناعي');
      }

      if (!isMountedRef.current) return false;

      setGeneratedContent(content);

      // Increment usage
      await incrementUsage(profileId, 'articles');
      toast.success('تم توليد المقال بنجاح! ✨');

      return true;
    } catch (err: any) {
      if (controller.signal.aborted) return false;
      if (!isMountedRef.current) return false;
      
      const friendlyError = getUserFriendlyError(err);
      setError(friendlyError);
      console.error('[useContentGenerator] Article generation error:', err);
      return false;
    } finally {
      if (!controller.signal.aborted && isMountedRef.current) {
        setIsLoading(false);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [apiKey, openaiKey, aiProvider, profileId, toast, cancelPending]);

  return {
    generatedContent,
    isLoading,
    error,
    generateProduct,
    generateArticle,
    updateContent,
    clearContent,
    clearError,
  };
}
