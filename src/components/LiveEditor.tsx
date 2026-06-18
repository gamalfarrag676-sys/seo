import { useState, useEffect, useCallback, useMemo } from 'react';
import {
 FileText, Tag, Copy, Check, Type, Link, Image as ImageIcon,
 Hash, BarChart3, AlertCircle, CheckCircle, AlertTriangle
} from 'lucide-react';
import type { SEOContent } from '../utils/gemini';
import { useDebounce } from '../hooks/useDebounce';

interface LiveEditorProps {
 content: SEOContent;
 keyword: string;
 productName: string;
 onContentChange: (updates: Partial<SEOContent>) => void;
}

type TabKey = 'mainContent' | 'meta';

/** Character count validation status */
type ValidationStatus = 'good' | 'warn' | 'bad';

interface FieldValidation {
 status: ValidationStatus;
 message: string;
}

// Helper: get validation icon & color
const ValidationIcon: React.FC<{ status: ValidationStatus }> = ({ status }) => {
 switch (status) {
 case 'good':
 return <CheckCircle className="w-4 h-4 text-emerald-500" />;
 case 'warn':
 return <AlertTriangle className="w-4 h-4 text-amber-500" />;
 case 'bad':
 return <AlertCircle className="w-4 h-4 text-red-500" />;
 }
};

const getStatusColor = (status: ValidationStatus): string => {
 switch (status) {
 case 'good': return 'text-emerald-500';
 case 'warn': return 'text-amber-500';
 case 'bad': return 'text-red-500';
 }
};

const getStatusBorderColor = (status: ValidationStatus): string => {
 switch (status) {
 case 'good': return 'border-emerald-500/30 focus:border-emerald-500/50';
 case 'warn': return 'border-amber-500/30 focus:border-amber-500/50';
 case 'bad': return 'border-red-500/30 focus:border-red-500/50';
 }
};

// Validation logic
const validateH1Title = (value: string): FieldValidation => {
 const len = value.length;
 if (len >= 30 && len <= 70) return { status: 'good', message: `${len} حرف ✓` };
 if ((len >= 20 && len < 30) || (len > 70 && len <= 80)) return { status: 'warn', message: `${len} حرف - يُفضل 30-70` };
 return { status: 'bad', message: `${len} حرف - يجب 30-70` };
};

const validateMetaTitle = (value: string): FieldValidation => {
 const len = value.length;
 if (len >= 30 && len <= 60) return { status: 'good', message: `${len} حرف ✓` };
 return { status: 'warn', message: `${len} حرف - يُفضل 30-60` };
};

const validateMetaDescription = (value: string): FieldValidation => {
 const len = value.length;
 if (len >= 120 && len <= 160) return { status: 'good', message: `${len} حرف ✓` };
 if ((len >= 100 && len < 120) || (len > 160 && len <= 170)) return { status: 'warn', message: `${len} حرف - يُفضل 120-160` };
 return { status: 'bad', message: `${len} حرف - يجب 120-160` };
};

const validateGeneric = (value: string): FieldValidation => {
 if (value.trim().length > 0) return { status: 'good', message: '✓' };
 return { status: 'bad', message: 'حقل مطلوب' };
};

// Markdown to basic HTML conversion for clipboard
const markdownToHtml = (md: string): string => {
 let html = md
 .replace(/^### (.*$)/gim, '<h3><strong>$1</strong></h3>')
 .replace(/^## (.*$)/gim, '<h2><strong>$1</strong></h2>')
 .replace(/^# (.*$)/gim, '<h1><strong>$1</strong></h1>')
 .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
 .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
 .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
 .replace(/\n/gim, '<br>');

 html = html.replace(/<\/ul><br><ul>/gim, '');
 return html;
};

export const LiveEditor: React.FC<LiveEditorProps> = ({
 content,
 keyword,
 productName,
 onContentChange,
}) => {
 const [activeTab, setActiveTab] = useState<TabKey>('mainContent');
 const [copiedType, setCopiedType] = useState<string | null>(null);

 // Local editable state for all fields
 const [localContent, setLocalContent] = useState<SEOContent>({ ...content });

 // Sync local state when content prop changes externally
 useEffect(() => {
 setLocalContent({ ...content });
 }, [content]);

 // Debounced values for each field
 const debouncedMainContent = useDebounce(localContent.mainContent, 300);
 const debouncedH1Title = useDebounce(localContent.h1Title, 300);
 const debouncedMetaTitle = useDebounce(localContent.metaTitle, 300);
 const debouncedMetaDescription = useDebounce(localContent.metaDescription, 300);
 const debouncedUrlSlug = useDebounce(localContent.urlSlug, 300);
 const debouncedAltText = useDebounce(localContent.altText, 300);
 const debouncedKeywords = useDebounce(localContent.keywords, 300);

 // Emit changes when debounced values settle
 useEffect(() => {
 const updates: Partial<SEOContent> = {};
 if (debouncedMainContent !== content.mainContent) updates.mainContent = debouncedMainContent;
 if (debouncedH1Title !== content.h1Title) updates.h1Title = debouncedH1Title;
 if (debouncedMetaTitle !== content.metaTitle) updates.metaTitle = debouncedMetaTitle;
 if (debouncedMetaDescription !== content.metaDescription) updates.metaDescription = debouncedMetaDescription;
 if (debouncedUrlSlug !== content.urlSlug) updates.urlSlug = debouncedUrlSlug;
 if (debouncedAltText !== content.altText) updates.altText = debouncedAltText;
 if (debouncedKeywords !== content.keywords) updates.keywords = debouncedKeywords;

 if (Object.keys(updates).length > 0) {
 onContentChange(updates);
 }
 }, [
 debouncedMainContent, debouncedH1Title, debouncedMetaTitle,
 debouncedMetaDescription, debouncedUrlSlug, debouncedAltText,
 debouncedKeywords, content, onContentChange,
 ]);

 // Handle field changes
 const handleFieldChange = useCallback((field: keyof SEOContent, value: string) => {
 setLocalContent(prev => ({ ...prev, [field]: value }));
 }, []);

 // Word count for main content
 const wordCount = useMemo(() => {
 const text = localContent.mainContent.trim();
 if (!text) return 0;
 return text.split(/\s+/).filter(Boolean).length;
 }, [localContent.mainContent]);

 // Keyword density calculation
 const keywordDensity = useMemo(() => {
 if (!keyword || !localContent.mainContent) return 0;
 const words = localContent.mainContent.split(/\s+/).filter(Boolean);
 if (words.length === 0) return 0;
 const keywordLower = keyword.toLowerCase();
 const keywordCount = words.filter(w => w.toLowerCase().includes(keywordLower)).length;
 return Number(((keywordCount / words.length) * 100).toFixed(1));
 }, [localContent.mainContent, keyword]);

 const keywordDensityStatus: ValidationStatus =
 keywordDensity >= 1.5 && keywordDensity <= 2.5 ? 'good' :
 keywordDensity >= 1 && keywordDensity <= 3 ? 'warn' : 'bad';

 // Copy handlers
 const handleCopy = async (text: string, type: string) => {
 try {
 if (type === 'html') {
 const html = markdownToHtml(text);
 const blobHtml = new Blob([html], { type: 'text/html' });
 const blobText = new Blob([text], { type: 'text/plain' });

 if (typeof ClipboardItem !== 'undefined') {
 await navigator.clipboard.write([
 new ClipboardItem({
 'text/html': blobHtml,
 'text/plain': blobText,
 }),
 ]);
 } else {
 await navigator.clipboard.writeText(text);
 }
 } else {
 await navigator.clipboard.writeText(text);
 }
 setCopiedType(type);
 setTimeout(() => setCopiedType(null), 2000);
 } catch {
 await navigator.clipboard.writeText(text);
 setCopiedType(type);
 setTimeout(() => setCopiedType(null), 2000);
 }
 };

 // Validations for meta tab fields
 const h1Validation = validateH1Title(localContent.h1Title);
 const metaTitleValidation = validateMetaTitle(localContent.metaTitle);
 const metaDescValidation = validateMetaDescription(localContent.metaDescription);
 const urlSlugValidation = validateGeneric(localContent.urlSlug || '');
 const altTextValidation = validateGeneric(localContent.altText || '');
 const keywordsValidation = validateGeneric(localContent.keywords || '');

 // Tab definitions
 const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
 { key: 'mainContent', label: 'المحتوى الرئيسي', icon: FileText },
 { key: 'meta', label: 'العنوان والميتا', icon: Tag },
 ];

 return (
 <div className="card overflow-hidden animate-fade-in">
 {/* Tab Header */}
 <div className="flex border-b border-gray-200">
 {tabs.map(tab => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.key;
 return (
 <button
 key={tab.key}
 onClick={() => setActiveTab(tab.key)}
 className={`
 flex-1 flex items-center justify-center gap-2 py-4 px-4
 text-sm font-bold transition-all duration-200 relative
 ${isActive
 ? 'text-gray-900'
 : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
 }
 `}
 >
 <Icon className="w-4 h-4" />
 <span>{tab.label}</span>
 {/* Active tab indicator */}
 {isActive && (
 <div className="absolute bottom-0 inset-x-4 h-0.5 bg-blue-500 rounded-full" />
 )}
 </button>
 );
 })}
 </div>

 {/* Tab Content */}
 <div className="p-5 md:p-6 space-y-5">
 {/* ===== Tab 1: Main Content ===== */}
 {activeTab === 'mainContent' && (
 <div className="space-y-4 animate-fade-in" style={{ animationDuration: '0.3s' }}>
 {/* Stats Bar */}
 <div className="flex flex-wrap items-center gap-3">
 {/* Word count badge */}
 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
 <Hash className="w-3.5 h-3.5 text-blue-500" />
 <span className="text-xs font-bold text-blue-500">{wordCount} كلمة</span>
 </div>

 {/* Keyword density badge */}
 {keyword && (
 <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
 keywordDensityStatus === 'good'
 ? 'bg-emerald-500/10 border-emerald-500/20'
 : keywordDensityStatus === 'warn'
 ? 'bg-amber-500/10 border-amber-500/20'
 : 'bg-red-500/10 border-red-500/20'
 }`}>
 <BarChart3 className={`w-3.5 h-3.5 ${getStatusColor(keywordDensityStatus)}`} />
 <span className={`text-xs font-bold ${getStatusColor(keywordDensityStatus)}`}>
 كثافة الكلمة: {keywordDensity}%
 </span>
 </div>
 )}

 {/* Copy buttons */}
 <div className="flex items-center gap-2 mr-auto">
 <button
 onClick={() => handleCopy(localContent.mainContent, 'html')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
 copiedType === 'html'
 ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
 : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 border border-gray-200'
 }`}
 >
 {copiedType === 'html' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
 {copiedType === 'html' ? 'تم!' : 'نسخ HTML'}
 </button>

 <button
 onClick={() => handleCopy(localContent.mainContent, 'text')}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
 copiedType === 'text'
 ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
 : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 border border-gray-200'
 }`}
 >
 {copiedType === 'text' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
 {copiedType === 'text' ? 'تم!' : 'نسخ نص'}
 </button>
 </div>
 </div>

 {/* Main Content Textarea */}
 <div>
 <label className="section-label">المحتوى الرئيسي</label>
 <textarea
 value={localContent.mainContent}
 onChange={(e) => handleFieldChange('mainContent', e.target.value)}
 className="input font-sans leading-relaxed"
 rows={16}
 dir="rtl"
 placeholder="اكتب المحتوى الرئيسي هنا..."
 style={{ resize: 'vertical', minHeight: '300px' }}
 />
 </div>

 {/* Product name context (read-only info) */}
 {productName && (
 <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200/30">
 <Type className="w-3.5 h-3.5 text-gray-400" />
 <span className="text-xs text-gray-400">المنتج: {productName}</span>
 </div>
 )}
 </div>
 )}

 {/* ===== Tab 2: Title & Meta ===== */}
 {activeTab === 'meta' && (
 <div className="space-y-5 animate-fade-in" style={{ animationDuration: '0.3s' }}>

 {/* H1 Title */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="section-label mb-0">عنوان H1</label>
 <div className="flex items-center gap-1.5">
 <ValidationIcon status={h1Validation.status} />
 <span className={`text-xs font-semibold ${getStatusColor(h1Validation.status)}`}>
 {h1Validation.message}
 </span>
 </div>
 </div>
 <input
 type="text"
 value={localContent.h1Title}
 onChange={(e) => handleFieldChange('h1Title', e.target.value)}
 className={`input ${getStatusBorderColor(h1Validation.status)}`}
 dir="rtl"
 placeholder="أدخل عنوان H1..."
 />
 </div>

 {/* Meta Title */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="section-label mb-0">عنوان الميتا (Meta Title)</label>
 <div className="flex items-center gap-1.5">
 <ValidationIcon status={metaTitleValidation.status} />
 <span className={`text-xs font-semibold ${getStatusColor(metaTitleValidation.status)}`}>
 {metaTitleValidation.message}
 </span>
 </div>
 </div>
 <input
 type="text"
 value={localContent.metaTitle}
 onChange={(e) => handleFieldChange('metaTitle', e.target.value)}
 className={`input ${getStatusBorderColor(metaTitleValidation.status)}`}
 dir="rtl"
 placeholder="أدخل عنوان الميتا..."
 />
 </div>

 {/* Meta Description */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="section-label mb-0">وصف الميتا (Meta Description)</label>
 <div className="flex items-center gap-1.5">
 <ValidationIcon status={metaDescValidation.status} />
 <span className={`text-xs font-semibold ${getStatusColor(metaDescValidation.status)}`}>
 {metaDescValidation.message}
 </span>
 </div>
 </div>
 <textarea
 value={localContent.metaDescription}
 onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
 className={`input ${getStatusBorderColor(metaDescValidation.status)}`}
 rows={3}
 dir="rtl"
 placeholder="أدخل وصف الميتا (120-160 حرف)..."
 style={{ resize: 'vertical', minHeight: '80px' }}
 />
 {/* Character progress bar */}
 <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-300 ${
 metaDescValidation.status === 'good'
 ? 'bg-emerald-500'
 : metaDescValidation.status === 'warn'
 ? 'bg-amber-500'
 : 'bg-red-500'
 }`}
 style={{ width: `${Math.min((localContent.metaDescription.length / 160) * 100, 100)}%` }}
 />
 </div>
 </div>

 {/* URL Slug */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="section-label mb-0">
 <Link className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
 رابط URL (Slug)
 </label>
 <div className="flex items-center gap-1.5">
 <ValidationIcon status={urlSlugValidation.status} />
 <span className={`text-xs font-semibold ${getStatusColor(urlSlugValidation.status)}`}>
 {urlSlugValidation.message}
 </span>
 </div>
 </div>
 <input
 type="text"
 value={localContent.urlSlug}
 onChange={(e) => handleFieldChange('urlSlug', e.target.value)}
 className={`input font-mono text-sm ${getStatusBorderColor(urlSlugValidation.status)}`}
 dir="ltr"
 placeholder="product-url-slug"
 />
 </div>

 {/* Alt Text */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="section-label mb-0">
 <ImageIcon className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
 النص البديل للصورة (Alt Text)
 </label>
 <div className="flex items-center gap-1.5">
 <ValidationIcon status={altTextValidation.status} />
 <span className={`text-xs font-semibold ${getStatusColor(altTextValidation.status)}`}>
 {altTextValidation.message}
 </span>
 </div>
 </div>
 <input
 type="text"
 value={localContent.altText}
 onChange={(e) => handleFieldChange('altText', e.target.value)}
 className={`input ${getStatusBorderColor(altTextValidation.status)}`}
 dir="rtl"
 placeholder="وصف دقيق للصورة..."
 />
 </div>

 {/* Keywords */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <label className="section-label mb-0">
 <Tag className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
 الكلمات المفتاحية
 </label>
 <div className="flex items-center gap-1.5">
 <ValidationIcon status={keywordsValidation.status} />
 <span className={`text-xs font-semibold ${getStatusColor(keywordsValidation.status)}`}>
 {keywordsValidation.message}
 </span>
 </div>
 </div>
 <textarea
 value={localContent.keywords}
 onChange={(e) => handleFieldChange('keywords', e.target.value)}
 className={`input ${getStatusBorderColor(keywordsValidation.status)}`}
 rows={2}
 dir="rtl"
 placeholder="كلمات مفتاحية مفصولة بفواصل..."
 style={{ resize: 'vertical', minHeight: '60px' }}
 />
 </div>
 </div>
 )}
 </div>
 </div>
 );
};
