import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { checkUsageLimit, incrementUsage } from '../lib/supabase';
import { generateSEOContent, type SEOContent, type ContentStyle } from '../utils/gemini';
import { getBestModel } from '../utils/aiTools';
import { generateContentWithOpenAI } from '../utils/openai';
import { getArticlePrompt, parseArticleResponse, type ArticleStyle, type ArticleLength } from '../utils/articleGenerator';

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

/**
 * Custom hook for generating SEO content using AI
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

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const clearContent = useCallback(() => setGeneratedContent(null), []);
    const clearError = useCallback(() => setError(null), []);

    // Update content directly (e.g., for humanization rewrites)
    const updateContent = useCallback((updates: Partial<SEOContent>) => {
        setGeneratedContent(prev => {
            if (!prev) return null;
            return { ...prev, ...updates };
        });
    }, []);

    // Generate product content
    const generateProduct = useCallback(async ({
        image,
        productName,
        keyword,
        contentStyle,
    }: GenerateProductOptions): Promise<boolean> => {
        const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;

        if (!currentKey) {
            setError('مفتاح API غير موجود');
            return false;
        }

        if (!image || !keyword) {
            setError('يرجى رفع صورة وإدخال الكلمة المفتاحية');
            return false;
        }

        if (!profileId) {
            setError('يجب تسجيل الدخول لتوليد المحتوى');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check usage limit
            const { allowed, remaining } = await checkUsageLimit(profileId, 'products');
            if (!allowed) {
                setError('⛔ لقد وصلت للحد الأقصى من المنتجات. تواصل مع المسؤول لزيادة الحد.');
                setIsLoading(false);
                return false;
            }
            toast.info(`متبقي لديك ${remaining} منتج`);

            // Generate content
            let content: SEOContent;
            if (aiProvider === 'openai') {
                content = await generateContentWithOpenAI(image, productName, keyword, openaiKey, contentStyle);
            } else {
                content = await generateSEOContent(apiKey, image, productName, keyword, contentStyle);
            }

            setGeneratedContent(content);

            // Increment usage
            await incrementUsage(profileId, 'products');
            toast.success('تم توليد المحتوى بنجاح! ✨');

            setIsLoading(false);
            return true;
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء التوليد');
            setIsLoading(false);
            return false;
        }
    }, [apiKey, openaiKey, aiProvider, profileId, toast]);

    // Generate article content
    const generateArticle = useCallback(async ({
        keyword,
        secondaryKeywords,
        style = 'informative',
        length = 'medium',
        notes,
    }: GenerateArticleOptions): Promise<boolean> => {
        const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;

        if (!currentKey) {
            setError('مفتاح API غير موجود');
            return false;
        }

        if (!keyword) {
            setError('يرجى إدخال موضوع المقال');
            return false;
        }

        if (!profileId) {
            setError('يجب تسجيل الدخول لتوليد المحتوى');
            return false;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
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
            toast.info(`متبقي لديك ${remaining} مقال`);

            const articlePrompt = getArticlePrompt({
                keyword,
                secondaryKeywords,
                style,
                length,
                notes
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
                if (!response.ok) throw new Error('فشل الاتصال بـ OpenAI API');
                const data = await response.json();
                const text = data.choices?.[0]?.message?.content || '';
                content = parseArticleResponse(text);
            } else {
                const modelName = await getBestModel(apiKey);
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: articlePrompt }] }]
                    }),
                    signal: controller.signal
                });
                if (!response.ok) throw new Error('فشل الاتصال بـ Gemini API');
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                content = parseArticleResponse(text);
            }

            if (!content || !content.h1Title) {
                throw new Error('فشل في تحليل النتيجة');
            }

            if (controller.signal.aborted) return false;

            setGeneratedContent(content);

            // Increment usage
            await incrementUsage(profileId, 'articles');
            toast.success('تم توليد المحتوى بنجاح! ✨');

            return true;
        } catch (err: any) {
            if (controller.signal.aborted) return false;
            setError(err.message || 'حدث خطأ أثناء التوليد');
            return false;
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [apiKey, openaiKey, aiProvider, profileId, toast]);

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
