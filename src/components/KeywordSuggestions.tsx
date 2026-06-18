import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Sparkles, Star, HelpCircle, ArrowRight, Loader2, X, Zap, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { suggestKeywords, type KeywordSuggestResult } from '../utils/keywordSuggester';
import { useDebounce } from '../hooks/useDebounce';

interface KeywordSuggestionsProps {
 keyword: string;
 onSelect: (keyword: string) => void;
 apiKey?: string;
 aiProvider?: 'gemini' | 'openai';
}

const typeIcons = {
 exact: <Search className="w-3.5 h-3.5" />,
 related: <Sparkles className="w-3.5 h-3.5" />,
 question: <HelpCircle className="w-3.5 h-3.5" />,
 'long-tail': <ArrowRight className="w-3.5 h-3.5" />,
};

const typeLabels = {
 exact: 'مطابق',
 related: 'ذات صلة',
 question: 'سؤال',
 'long-tail': 'طويل',
};

const typeColors = {
 exact: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
 related: 'text-blue-600 bg-blue-500 border-blue-200',
 question: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
 'long-tail': 'text-blue-600 bg-blue-500 border-purple-500/20',
};

function RelevanceStars({ relevance }: { relevance: number }) {
 return (
 <div className="flex gap-0.5">
 {Array.from({ length: 5 }).map((_, i) => (
 <Star
 key={i}
 className={clsx(
 "w-3 h-3",
 i < relevance ? "fill-amber-400 text-amber-400" : "text-gray-600"
 )}
 />
 ))}
 </div>
 );
}

export function KeywordSuggestions({ keyword, onSelect, apiKey, aiProvider = 'gemini' }: KeywordSuggestionsProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [result, setResult] = useState<KeywordSuggestResult | null>(null);
 const [error, setError] = useState<string | null>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const abortControllerRef = useRef<AbortController | null>(null);

 const debouncedKeyword = useDebounce(keyword, 500);

 // Click-outside handler to close dropdown
 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const fetchSuggestions = useCallback(async () => {
 if (!debouncedKeyword || debouncedKeyword.length < 2) {
 setResult(null);
 setError(null);
 return;
 }

 // Cancel previous in-flight request
 if (abortControllerRef.current) {
 abortControllerRef.current.abort();
 }
 const controller = new AbortController();
 abortControllerRef.current = controller;

 setIsLoading(true);
 setError(null);
 try {
 const suggestions = await suggestKeywords(debouncedKeyword, apiKey, aiProvider);
 // Ignore result if this request was aborted
 if (controller.signal.aborted) return;
 setResult(suggestions);
 if (suggestions.suggestions.length > 0) {
 setIsOpen(true);
 }
 } catch (err) {
 if (controller.signal.aborted) return;
 console.error('Keyword suggestion error:', err);
 setError('حدث خطأ أثناء جلب الاقتراحات. حاول مرة أخرى.');
 } finally {
 if (!controller.signal.aborted) {
 setIsLoading(false);
 }
 }
 }, [debouncedKeyword, apiKey, aiProvider]);

 // Cleanup abort controller on unmount
 useEffect(() => {
 return () => {
 if (abortControllerRef.current) {
 abortControllerRef.current.abort();
 }
 };
 }, []);

 useEffect(() => {
 if (debouncedKeyword && debouncedKeyword.length >= 2) {
 fetchSuggestions();
 }
 }, [debouncedKeyword, fetchSuggestions]);

 const handleSelect = (selectedKeyword: string) => {
 onSelect(selectedKeyword);
 setIsOpen(false);
 };

 if (!keyword || keyword.length < 2) return null;

 return (
 <div className="relative" ref={containerRef}>
 {/* Trigger Button */}
 <button
 onClick={() => setIsOpen(!isOpen)}
 className={clsx(
 "absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
 isOpen
 ? "bg-blue-500 text-gray-900"
 : "bg-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
 )}
 title="اقتراحات كلمات مفتاحية"
 >
 {isLoading ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Zap className="w-4 h-4" />
 )}
 </button>

 {/* Dropdown */}
 {isOpen && (error || (result && result.suggestions.length > 0)) && (
 <div className="absolute z-50 left-0 top-full mt-2 w-80 bg-gray-100 border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
 {/* Header */}
 <div className="flex items-center justify-between p-3 border-b border-gray-200">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-blue-600" />
 <span className="text-sm font-medium text-gray-700">كلمات مفتاحية مقترحة</span>
 </div>
 <button
 onClick={() => setIsOpen(false)}
 className="p-1 rounded hover:bg-gray-200 text-gray-500"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Error State */}
 {error && (
 <div className="p-3 flex items-center gap-2 text-red-400 text-sm">
 <AlertCircle className="w-4 h-4 flex-shrink-0" />
 <span>{error}</span>
 </div>
 )}

 {/* Suggestions List */}
 {result && result.suggestions.length > 0 && (
 <div className="max-h-64 overflow-y-auto">
 {result.suggestions.map((suggestion) => (
 <button
 key={suggestion.keyword}
 onClick={() => handleSelect(suggestion.keyword)}
 className="w-full p-3 text-right hover:bg-gray-200 transition-colors flex items-center gap-3 border-b border-gray-200/30 last:border-0"
 >
 <div className={clsx(
 "p-1.5 rounded-lg border",
 typeColors[suggestion.type]
 )}>
 {typeIcons[suggestion.type]}
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-sm text-gray-700 truncate">
 {suggestion.keyword}
 </div>
 <div className="flex items-center gap-2 mt-0.5">
 <span className={clsx(
 "text-xs px-1.5 py-0.5 rounded",
 typeColors[suggestion.type]
 )}>
 {typeLabels[suggestion.type]}
 </span>
 <RelevanceStars relevance={suggestion.relevance} />
 </div>
 </div>
 </button>
 ))}
 </div>
 )}

 {/* LSI Keywords */}
 {result && result.lsiKeywords && result.lsiKeywords.length > 0 && (
 <div className="p-3 bg-gray-50 border-t border-gray-200">
 <div className="flex items-center gap-2 mb-2">
 <Sparkles className="w-3 h-3 text-blue-600" />
 <span className="text-xs text-gray-500">كلمات LSI مقترحة:</span>
 </div>
 <div className="flex flex-wrap gap-1.5">
 {result.lsiKeywords.map((lsi) => (
 <button
 key={lsi}
 onClick={() => handleSelect(lsi)}
 className="px-2 py-1 text-xs rounded-lg bg-blue-500 text-purple-300 border border-purple-500/20 hover:bg-blue-500 transition-colors"
 >
 {lsi}
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
