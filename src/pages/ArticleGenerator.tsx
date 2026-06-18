import { useState, useMemo } from 'react';
import { Zap, Loader2, FileText, Settings2 } from 'lucide-react';
import { useContentGenerator } from '../hooks/useContentGenerator';
import { useAuth } from '../contexts/AuthContext';
import { useApiKeys } from '../hooks/useApiKeys';
import { useToast } from '../components/Toast';
import { LiveEditor } from '../components/LiveEditor';
import { GeoScoreCard } from '../components/GeoScoreCard';
import { EEATScoreCard } from '../components/EEATScoreCard';
import { UsageBar } from '../components/UsageBar';
import { analyzeGeo } from '../utils/geoAnalyzer';
import { analyzeEEAT } from '../utils/eeatAnalyzer';
import { KeywordSuggestions } from '../components/KeywordSuggestions';

import type { ArticleStyle, ArticleLength } from '../utils/articleGenerator';

export default function ArticleGenerator() {
 const { profile } = useAuth();
 const { apiKey, openaiKey, aiProvider } = useApiKeys();
 const toast = useToast();

 const [keyword, setKeyword] = useState('');
 const [secondaryKeywords, setSecondaryKeywords] = useState('');
 const [style, setStyle] = useState<ArticleStyle>('informative');
 const [length, setLength] = useState<ArticleLength>('medium');
 const [notes, setNotes] = useState('');
 
 const {
 generatedContent, isLoading, error,
 generateArticle, updateContent
 } = useContentGenerator({
 profileId: profile?.id,
 apiKey,
 openaiKey,
 aiProvider,
 });

 const handleGenerate = async () => {
 if (!keyword) {
 toast.error('الكلمة المفتاحية الرئيسية مطلوبة');
 return;
 }
 await generateArticle({
 keyword,
 secondaryKeywords,
 style,
 length,
 notes
 });
 };

 const geoResult = useMemo(() => {
 if (!generatedContent?.mainContent) return null;
 return analyzeGeo(generatedContent.mainContent, keyword);
 }, [generatedContent, keyword]);

 const eeatResult = useMemo(() => {
 if (!generatedContent?.mainContent) return null;
 return analyzeEEAT(generatedContent.mainContent);
 }, [generatedContent]);

 return (
 <div className="space-y-8 animate-fade-in">
 {/* Header */}
 <div className="text-center space-y-4 pt-4">
 <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-2xl ring-1 ring-emerald-500/30 mb-2">
 <Zap className="w-8 h-8 text-emerald-400" />
 </div>
 <h1 className="text-3xl md:text-5xl font-black gradient-text">مولد المقالات الذكي</h1>
 <p className="text-gray-500 max-w-2xl mx-auto">أنشئ مقالات متوافقة مع محركات البحث الحديثة (SEO/AEO) بسهولة تامة.</p>
 </div>

 <div className="grid lg:grid-cols-12 gap-8 items-start">
 {/* Input Section */}
 <div className="lg:col-span-5 space-y-6">
 <UsageBar />

 <div className="card p-6 md:p-8 space-y-6">
 <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-200 pb-4">
 <Settings2 className="w-5 h-5 text-blue-600" />
 إعدادات المقال
 </h2>

 {/* Keyword Input */}
 <div className="relative">
 <label className="section-label">الكلمة المفتاحية الرئيسية (مطلوب)</label>
 <div className="relative">
 <input
 type="text"
 value={keyword}
 onChange={(e) => setKeyword(e.target.value)}
 className="input pl-14"
 placeholder="مثال: أفضل طرق تحسين محركات البحث..."
 />
 <KeywordSuggestions
 keyword={keyword}
 onSelect={(selected) => setKeyword(selected)}
 apiKey={aiProvider === 'gemini' ? apiKey : openaiKey}
 aiProvider={aiProvider}
 />
 </div>
 </div>

 {/* Secondary Keywords Input */}
 <div>
 <label className="section-label">كلمات مفتاحية ثانوية (اختياري)</label>
 <input
 type="text"
 value={secondaryKeywords}
 onChange={(e) => setSecondaryKeywords(e.target.value)}
 className="input"
 placeholder="كلمات مفصولة بفواصل..."
 />
 </div>

 {/* Style and Length */}
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="section-label">أسلوب الكتابة</label>
 <select 
 className="input py-2.5"
 value={style}
 onChange={(e) => setStyle(e.target.value as ArticleStyle)}
 >
 <option value="informative">معلوماتي (موضوعي)</option>
 <option value="guide">دليل إرشادي (خطوات)</option>
 <option value="persuasive">إقناعي (تسويقي)</option>
 </select>
 </div>
 <div>
 <label className="section-label">الطول التقريبي</label>
 <select 
 className="input py-2.5"
 value={length}
 onChange={(e) => setLength(e.target.value as ArticleLength)}
 >
 <option value="short">قصير (~500 كلمة)</option>
 <option value="medium">متوسط (~1000 كلمة)</option>
 <option value="long">طويل (~1500+ كلمة)</option>
 </select>
 </div>
 </div>

 {/* Notes Input */}
 <div>
 <label className="section-label">ملاحظات إضافية للذكاء الاصطناعي</label>
 <textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="input"
 placeholder="أضف أي تعليمات خاصة أو معلومات تريد تضمينها في المقال..."
 rows={3}
 />
 </div>

 {/* Generate Button */}
 <button
 onClick={handleGenerate}
 disabled={isLoading || !keyword}
 className="w-full btn btn-primary bg-blue-600 hover:bg-blue-700 text-gray-900 shadow-sm"
 >
 <div className="flex items-center justify-center gap-3 relative z-10">
 {isLoading ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin" />
 <span>جاري الكتابة الإبداعية...</span>
 </>
 ) : (
 <>
 <FileText className="w-5 h-5" />
 <span>توليد المقال</span>
 </>
 )}
 </div>
 </button>
 </div>
 </div>

 {/* Output Section */}
 <div className="lg:col-span-7 space-y-6">
 {error && (
 <div className="card p-4 border-red-500/30 bg-red-500/10 text-red-400 text-sm">
 {error}
 </div>
 )}

 {!generatedContent && !isLoading && (
 <div className="card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-200">
 <FileText className="w-16 h-16 mb-4 opacity-20 text-emerald-400" />
 <p className="text-lg text-gray-600">محرر المقالات المتقدم سيعمل هنا</p>
 <p className="text-sm text-gray-400 mt-2">قم بضبط الإعدادات واضغط على "توليد المقال"</p>
 </div>
 )}

 {generatedContent && (
 <div className="space-y-6">
 <LiveEditor 
 content={generatedContent}
 keyword={keyword}
 productName={""} // Not a product
 onContentChange={(updates) => updateContent(updates)}
 />

 <div className="grid sm:grid-cols-2 gap-6">
 {geoResult && <GeoScoreCard result={geoResult} />}
 {eeatResult && <EEATScoreCard result={eeatResult} />}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
