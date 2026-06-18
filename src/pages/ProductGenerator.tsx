import { useState, useMemo, useCallback } from 'react';
import { ImageUpload } from '../components/ImageUpload';
import { ContentDisplay } from '../components/ContentDisplay';
import { SeoScorecard } from '../components/SeoScorecard';
import { getBestModel } from '../utils/aiTools';

import { SchemaOutput } from '../components/SchemaOutput';
import { ReadabilityCard } from '../components/ReadabilityCard';
import { HumanityScoreCard } from '../components/HumanityScoreCard';
import { KeywordSuggestions } from '../components/KeywordSuggestions';
import { ExportModal } from '../components/ExportModal';
import { UsageBar } from '../components/UsageBar';
import { TypewriterLoader } from '../components/TypewriterLoader';
import { HistoryPanel } from '../components/HistoryPanel';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { optimizeImage } from '../utils/imageOptimizer';
import { analyzeSeo } from '../utils/seoAnalyzer';
import { analyzeReadability } from '../utils/readabilityAnalyzer';
import { analyzeHumanity, generateHumanizePrompt } from '../utils/humanityAnalyzer';
import type { ContentStyle, SEOContent } from '../utils/gemini';
import type { ExportData } from '../utils/wooCommerce';

// Custom Hooks
import { useApiKeys } from '../hooks/useApiKeys';
import { useSallaOAuth } from '../hooks/useSallaOAuth';
import { useContentGenerator } from '../hooks/useContentGenerator';
import { useExport } from '../hooks/useExport';
import { useHistory } from '../hooks/useHistory';

import {
  Sparkles, Loader2, Zap, GraduationCap,
  ShoppingCart, CheckCircle, AlertOctagon
} from 'lucide-react';

export default function ProductGenerator() {
  const { profile } = useAuth();
  const toast = useToast();

  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Form states
  const [image, setImage] = useState<File | null>(null);
  const [compressedImageBlob, setCompressedImageBlob] = useState<Blob | null>(null);
  const [productName, setProductName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [contentStyle, setContentStyle] = useState<ContentStyle>('expert');
  const [isRewriting, setIsRewriting] = useState(false);

  // Custom Hooks
  const {
    apiKey, openaiKey, aiProvider, setAiProvider,
    hasApiKey
  } = useApiKeys();

  // Handle Salla OAuth callback
  useSallaOAuth();

  const {
    generatedContent, isLoading, error,
    generateProduct, updateContent, clearError
  } = useContentGenerator({
    profileId: profile?.id,
    apiKey,
    openaiKey,
    aiProvider,
  });

  const {
    publishStatus, exportToStore, clearStatus, openExportModal
  } = useExport();

  // History hook
  const {
    history, addToHistory: _addToHistory, removeFromHistory, clearHistory
  } = useHistory();

  // Handle history item selection
  const handleHistorySelect = (_content: SEOContent, kw: string, pn: string) => {
    setKeyword(kw);
    setProductName(pn);
  };

  // Handle image selection
  const handleImageSelect = async (file: File | null) => {
    setImage(file);
    setCompressedImageBlob(null);
    clearError();
    clearStatus();

    if (file) {
      try {
        const result = await optimizeImage(file);
        setCompressedImageBlob(result.blob);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Handle content generation
  const handleGenerate = async () => {
    if (!hasApiKey) {
      toast.error('الرجاء إضافة مفتاح API من الإعدادات أولاً');
      return;
    }

    await generateProduct({ image: image!, productName, keyword, contentStyle });
  };

  // Handle export modal open
  const handleOpenExportModal = () => {
    if (openExportModal()) {
      setIsExportModalOpen(true);
    } else {
      toast.error('الرجاء ربط متجرك من الإعدادات أولاً');
    }
  };

  // Handle export
  const handleExport = async (exportData: ExportData) => {
    if (!generatedContent || !compressedImageBlob || !image) {
      throw new Error('البيانات غير مكتملة');
    }

    const imageName = image.name.replace(/\.[^/.]+$/, '') + '_optimized.jpg';
    await exportToStore(generatedContent, compressedImageBlob, imageName, productName, exportData);
  };

  // Memoized SEO analysis
  const seoResult = useMemo(() => {
    if (!generatedContent || !keyword) return null;
    return analyzeSeo(generatedContent, keyword, productName);
  }, [generatedContent, keyword, productName]);

  // Memoized readability analysis
  const readabilityResult = useMemo(() => {
    if (!generatedContent?.mainContent) return null;
    return analyzeReadability(generatedContent.mainContent);
  }, [generatedContent]);

  // Memoized humanity analysis
  const humanityResult = useMemo(() => {
    if (!generatedContent?.mainContent) return null;
    return analyzeHumanity(generatedContent.mainContent);
  }, [generatedContent]);

  // Handle content rewrite for humanization
  const handleHumanizeRewrite = useCallback(async () => {
    const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;

    if (!generatedContent?.mainContent) {
      toast.error('لا يوجد محتوى لإعادة كتابته');
      return;
    }

    if (!currentKey) {
      toast.error(`يرجى إضافة مفتاح ${aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'} من الإعدادات`);
      return;
    }

    setIsRewriting(true);
    try {
      const prompt = generateHumanizePrompt(generatedContent.mainContent);
      let rewrittenText: string | null = null;

      if (aiProvider === 'openai') {
        // Use OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.9
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'فشل في الاتصال بـ OpenAI');
        }

        const data = await response.json();
        rewrittenText = data.choices?.[0]?.message?.content;
      } else {
        // Use Gemini
        const modelName = await getBestModel(currentKey);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${currentKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.9, maxOutputTokens: 2000 }
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'فشل في الاتصال بـ Gemini');
        }

        const data = await response.json();
        rewrittenText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      if (rewrittenText) {
        // Update the content directly - this will trigger re-analysis
        updateContent({ mainContent: rewrittenText });
        toast.success('✨ تم إعادة كتابة المحتوى بنجاح! تحقق من النتيجة الجديدة.');
      } else {
        throw new Error('لم يتم استلام محتوى من الذكاء الاصطناعي');
      }
    } catch (err: any) {
      console.error('Humanize rewrite failed:', err);
      toast.error(err.message || 'فشل في إعادة كتابة المحتوى');
    } finally {
      setIsRewriting(false);
    }
  }, [generatedContent, apiKey, openaiKey, aiProvider, updateContent, toast]);

  return (
    <div className="animate-fade-in-up space-y-10">
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        productName={generatedContent?.h1Title || productName}
        userKeyword={keyword}
      />

      {/* History Panel */}
      <HistoryPanel
        history={history}
        onSelect={handleHistorySelect}
        onDelete={removeFromHistory}
        onClear={clearHistory}
      />

      {/* Hero Section */}
      <div className="text-center space-y-6 pt-4">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl ring-1 ring-indigo-500/30 mb-4 animate-pulse-glow">
            <Sparkles className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight gradient-text pb-2">
            مولد محتوى المنتجات
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            حوّل صور منتجاتك إلى محتوى تسويقي احترافي متوافق مع SEO
          </p>

          <span className="badge inline-flex">✨ مدعوم بالذكاء الاصطناعي</span>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* Input Section */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <UsageBar />

            {/* Product Form */}
            <div className="glass-card p-6 md:p-8">
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  selectedImage={image}
                />

                <div className="mt-8 space-y-5">
                  {/* AI Provider Toggle */}
                  <div>
                    <label className="section-label">مزود الذكاء الاصطناعي</label>
                    <div className="toggle-group grid-cols-2">
                      <button
                        onClick={() => { setAiProvider('gemini'); }}
                        className={`toggle-btn ${aiProvider === 'gemini' ? 'active' : ''}`}
                      >
                        <span>✨</span>
                        <span>Gemini</span>
                      </button>
                      <button
                        onClick={() => { setAiProvider('openai'); }}
                        className={`toggle-btn ${aiProvider === 'openai' ? 'active' : ''}`}
                      >
                        <span>🤖</span>
                        <span>ChatGPT</span>
                      </button>
                    </div>
                    {aiProvider === 'openai' && !openaiKey && (
                      <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">⚠️ أضف مفتاح OpenAI من الإعدادات</p>
                    )}
                    {aiProvider === 'gemini' && !apiKey && (
                      <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">⚠️ أضف مفتاح Gemini من الإعدادات</p>
                    )}
                  </div>

                  {/* Content Style Toggle */}
                  <div>
                    <label className="section-label">نوع المحتوى</label>
                    <div className="toggle-group grid-cols-2">
                      <button
                        onClick={() => setContentStyle('expert')}
                        className={`toggle-btn ${contentStyle === 'expert' ? 'active' : ''}`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>احترافي (E-E-A-T)</span>
                      </button>
                      <button
                        onClick={() => setContentStyle('simple')}
                        className={`toggle-btn ${contentStyle === 'simple' ? 'active' : ''}`}
                      >
                        <Zap className="w-4 h-4" />
                        <span>سريع (منتج)</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Description Input */}
                  <div>
                    <label className="section-label">وصف المنتج (اختياري)</label>
                    <textarea
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="premium-input"
                      placeholder="مثال: سماعة بلوتوث رياضية مقاومة للماء مع خاصية إلغاء الضوضاء..."
                      rows={3}
                      style={{ resize: 'vertical', minHeight: '80px' }}
                    />
                    <p className="text-xs text-slate-500 mt-1">💡 أضف وصفاً دقيقاً للمنتج ليستخدمه الذكاء الاصطناعي كمرجع أساسي</p>
                  </div>

                  {/* Keyword Input */}
                  <div className="relative">
                    <label className="section-label">الكلمة المفتاحية (مطلوب)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="premium-input pl-14"
                        placeholder="مثال: سماعة عزل ضوضاء..."
                      />
                      <KeywordSuggestions
                        keyword={keyword}
                        onSelect={(selected) => setKeyword(selected)}
                        apiKey={aiProvider === 'gemini' ? apiKey : openaiKey}
                        aiProvider={aiProvider}
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !image || !keyword}
                    className="w-full btn-premium text-white"
                  >
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>جاري التحليل والكتابة...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>توليد المحتوى الذكي</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {error && (
              <div className="glass-card p-4 border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                {error}
              </div>
            )}

            {publishStatus && (
              <div className={`glass-card p-4 text-sm flex items-center gap-2 ${publishStatus.success
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>
                {publishStatus.success ? <CheckCircle className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                <span>{publishStatus.message}</span>
              </div>
            )}

            {generatedContent && (
              <div className="space-y-6">
                <button
                  onClick={handleOpenExportModal}
                  className="w-full btn-premium text-white"
                  style={{ background: 'linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153))' }}
                >
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <ShoppingCart className="w-5 h-5" />
                    <span>نشر في المتجر (سلة / WooCommerce)</span>
                  </div>
                </button>

                <div className="glass-card p-6">
                  <ContentDisplay content={generatedContent} loading={isLoading} />
                </div>

                {seoResult && (
                  <div className="glass-card p-6">
                    <SeoScorecard result={seoResult} />
                  </div>
                )}

                {readabilityResult && (
                  <div className="glass-card p-6">
                    <ReadabilityCard result={readabilityResult} />
                  </div>
                )}

                {humanityResult && (
                  <div className="glass-card p-6">
                    <HumanityScoreCard
                      result={humanityResult}
                      onRewrite={handleHumanizeRewrite}
                      isRewriting={isRewriting}
                    />
                  </div>
                )}

                <div className="glass-card p-6">
                  <SchemaOutput
                    content={generatedContent}
                    productName={productName}
                  />
                </div>
              </div>
            )}

            {/* Premium Loading Animation */}
            {isLoading && (
              <div className="glass-card overflow-hidden">
                <TypewriterLoader />
              </div>
            )}

            {!generatedContent && !isLoading && (
              <div className="result-placeholder">
                <Sparkles className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">النتيجة ستظهر هنا بعد التحليل</p>
                <p className="text-sm text-slate-600 mt-2">ارفع صورة المنتج وأدخل الكلمة المفتاحية</p>
              </div>
            )}
          </div>

      </div>
    </div>
  );
}
