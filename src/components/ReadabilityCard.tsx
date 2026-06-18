import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, Lightbulb } from 'lucide-react';
import { clsx } from 'clsx';
import type { ReadabilityResult, ReadabilityDetail } from '../utils/readabilityAnalyzer';

interface ReadabilityCardProps {
 result: ReadabilityResult;
}

const gradeColors = {
 emerald: 'bg-emerald-500',
 green: 'bg-green-500',
 amber: 'bg-amber-500',
 orange: 'bg-orange-500',
 red: 'bg-red-500',
};

const StatusIcon = ({ status }: { status: ReadabilityDetail['status'] }) => {
 switch (status) {
 case 'good':
 return <CheckCircle className="w-4 h-4 text-emerald-500" />;
 case 'warning':
 return <AlertTriangle className="w-4 h-4 text-amber-500" />;
 case 'bad':
 return <XCircle className="w-4 h-4 text-red-500" />;
 }
};

export function ReadabilityCard({ result }: ReadabilityCardProps) {
 const [isOpen, setIsOpen] = useState(false);

 if (result.score === 0 && result.metrics.wordCount === 0) return null;

 return (
 <div className="bg-gray-100 -md border border-gray-200 rounded-2xl overflow-hidden">
 {/* Header */}
 <button
 onClick={() => setIsOpen(!isOpen)}
 className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
 >
 <div className="flex items-center gap-3">
 <div className={clsx(
 "w-10 h-10 rounded-xl flex items-center justify-center",
 `bg-${result.gradeColor}-500/20`
 )}>
 <BookOpen className={`w-5 h-5 text-${result.gradeColor}-400`} />
 </div>
 <div className="text-right">
 <h3 className="font-bold text-gray-700">قابلية القراءة</h3>
 <p className="text-xs text-gray-500">
 {result.metrics.wordCount} كلمة • {result.metrics.sentenceCount} جملة
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3">
 {/* Score Circle */}
 <div className="flex items-center gap-2">
 <span className="text-lg font-bold text-gray-700">{result.score}</span>
 <div className={clsx(
 "px-3 py-1 rounded-full text-xs font-bold text-gray-900",
 gradeColors[result.gradeColor]
 )}>
 {result.grade}
 </div>
 </div>
 {isOpen ? (
 <ChevronUp className="w-5 h-5 text-gray-500" />
 ) : (
 <ChevronDown className="w-5 h-5 text-gray-500" />
 )}
 </div>
 </button>

 {/* Content */}
 {isOpen && (
 <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2">
 {/* Progress Bar */}
 <div className="space-y-1">
 <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
 <div
 className={clsx(
 "h-full rounded-full transition-all duration-500",
 gradeColors[result.gradeColor]
 )}
 style={{ width: `${result.score}%` }}
 />
 </div>
 </div>

 {/* Metrics Grid */}
 <div className="grid grid-cols-2 gap-2">
 {result.details.map((detail) => (
 <div
 key={detail.id}
 className={clsx(
 "p-3 rounded-xl border",
 detail.status === 'good' && "bg-emerald-500/5 border-emerald-500/20",
 detail.status === 'warning' && "bg-amber-500/5 border-amber-500/20",
 detail.status === 'bad' && "bg-red-500/5 border-red-500/20"
 )}
 >
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs text-gray-500">{detail.name}</span>
 <StatusIcon status={detail.status} />
 </div>
 <div className="flex items-baseline gap-1">
 <span className="text-xl font-bold text-gray-700">{detail.value}</span>
 </div>
 <p className="text-xs text-gray-500 mt-1">{detail.message}</p>
 </div>
 ))}
 </div>

 {/* Suggestions */}
 {result.suggestions.length > 0 && (
 <div className="bg-gray-50 rounded-xl p-3 space-y-2">
 <div className="flex items-center gap-2 text-amber-400">
 <Lightbulb className="w-4 h-4" />
 <span className="text-sm font-medium">اقتراحات للتحسين</span>
 </div>
 <ul className="space-y-1.5">
 {result.suggestions.map((suggestion, i) => (
 <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
 <span className="text-amber-400">💡</span>
 <span>{suggestion}</span>
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* Stats Footer */}
 <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-gray-200">
 <div>
 <div className="text-lg font-bold text-blue-400">
 {result.metrics.avgWordsPerSentence}
 </div>
 <div className="text-xs text-gray-500">كلمة/جملة</div>
 </div>
 <div>
 <div className="text-lg font-bold text-blue-400">
 {result.metrics.paragraphCount}
 </div>
 <div className="text-xs text-gray-500">فقرة</div>
 </div>
 <div>
 <div className="text-lg font-bold text-blue-400">
 {result.metrics.questionCount}
 </div>
 <div className="text-xs text-gray-500">سؤال</div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
