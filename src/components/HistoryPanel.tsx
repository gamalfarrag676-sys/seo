import { useState } from 'react';
import { History, X, Clock, Trash2, ChevronRight, Search, Star } from 'lucide-react';
import type { SEOContent } from '../utils/gemini';

interface HistoryItem {
    id: string;
    timestamp: number;
    keyword: string;
    productName: string;
    content: SEOContent;
    seoScore?: number;
}

interface HistoryPanelProps {
    history: HistoryItem[];
    onSelect: (content: SEOContent, keyword: string, productName: string) => void;
    onDelete: (id: string) => void;
    onClear: () => void;
}

export function HistoryPanel({ history, onSelect, onDelete, onClear }: HistoryPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredHistory = history.filter(item =>
        item.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.h1Title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getScoreColor = (score?: number) => {
        if (!score) return 'text-slate-500';
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all group"
                title="سجل المحتوى"
            >
                <History className="w-5 h-5" />
                {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
                        {history.length}
                    </span>
                )}
            </button>

            {/* Slide Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-r border-slate-800 z-50 animate-slide-in-left">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-lg font-bold text-white">سجل المحتوى</h2>
                                <span className="text-xs text-slate-400">({history.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {history.length > 0 && (
                                    <button
                                        onClick={onClear}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                        title="مسح الكل"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-slate-800">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="بحث في السجل..."
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                />
                            </div>
                        </div>

                        {/* History List */}
                        <div className="overflow-y-auto h-[calc(100vh-140px)] p-4 space-y-3">
                            {filteredHistory.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>لا يوجد محتوى سابق</p>
                                </div>
                            ) : (
                                filteredHistory.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all overflow-hidden"
                                    >
                                        <button
                                            onClick={() => {
                                                onSelect(item.content, item.keyword, item.productName);
                                                setIsOpen(false);
                                            }}
                                            className="w-full p-4 text-right"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                                                        {item.content.h1Title || item.keyword}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(item.timestamp)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full">
                                                            {item.keyword}
                                                        </span>
                                                        {item.seoScore && (
                                                            <span className={`text-xs font-bold flex items-center gap-1 ${getScoreColor(item.seoScore)}`}>
                                                                <Star className="w-3 h-3" />
                                                                {item.seoScore}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                                            </div>
                                        </button>

                                        {/* Delete button */}
                                        <div className="px-4 pb-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(item.id);
                                                }}
                                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                حذف
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
