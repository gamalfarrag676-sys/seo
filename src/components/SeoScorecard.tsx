import { CheckCircle, AlertTriangle, TrendingUp, Target, FileText, Hash, BookOpen, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import type { SeoAnalysisResult, SeoCheckResult } from '../utils/seoAnalyzer';

interface SeoScorecardProps {
 result: SeoAnalysisResult;
 isLoading?: boolean;
}

const categoryIcons = {
 title: Target,
 content: FileText,
 keywords: Hash,
 readability: BookOpen,
 technical: Settings,
};

const categoryNames = {
 title: 'العنوان',
 content: 'المحتوى',
 keywords: 'الكلمات المفتاحية',
 readability: 'القراءة',
 technical: 'التقنية',
};

const gradeColors = {
 A: 'from-emerald-500 to-emerald-600',
 B: 'from-blue-500 to-blue-600',
 C: 'from-amber-500 to-amber-600',
 D: 'from-orange-500 to-orange-600',
 F: 'from-red-500 to-red-600',
};

function CategoryProgress({ category, score, max, checks }: {
 category: keyof typeof categoryNames;
 score: number;
 max: number;
 checks: SeoCheckResult[];
}) {
 const [isOpen, setIsOpen] = useState(false);
 const Icon = categoryIcons[category];
 const percentage = max > 0 ? Math.round((score / max) * 100) : 0;
 const categoryChecks = checks.filter(c => c.category === category);

 const getProgressColor = () => {
 if (percentage >= 80) return 'bg-emerald-500';
 if (percentage >= 60) return 'bg-amber-500';
 return 'bg-red-500';
 };

 return (
 <div className="space-y-2">
 <button
 onClick={() => setIsOpen(!isOpen)}
 className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-100 hover:bg-gray-100 transition-colors group"
 >
 <div className="flex items-center gap-3">
 <div className={clsx(
 "w-8 h-8 rounded-lg flex items-center justify-center",
 percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
 percentage >= 60 ? 'bg-amber-500/20 text-amber-400' :
 'bg-red-500/20 text-red-400'
 )}>
 <Icon className="w-4 h-4" />
 </div>
 <div className="text-right">
 <span className="text-sm font-medium text-gray-700">{categoryNames[category]}</span>
 <div className="flex items-center gap-2 mt-1">
 <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
 <div
 className={clsx("h-full rounded-full transition-all", getProgressColor())}
 style={{ width: `${percentage}%` }}
 />
 </div>
 <span className="text-xs text-gray-500">{score}/{max}</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className={clsx(
 "text-lg font-bold",
 percentage >= 80 ? 'text-emerald-400' :
 percentage >= 60 ? 'text-amber-400' :
 'text-red-400'
 )}>
 {percentage}%
 </span>
 {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
 </div>
 </button>

 {isOpen && categoryChecks.length > 0 && (
 <div className="pr-4 space-y-2 animate-in slide-in-from-top-2">
 {categoryChecks.map((check) => (
 <div
 key={check.id}
 className={clsx(
 "flex items-start gap-2 p-2 rounded-lg text-xs border",
 check.status === 'pass' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' :
 check.status === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' :
 'bg-red-500/5 border-red-500/20 text-red-300'
 )}
 >
 {check.status === 'pass' ? (
 <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
 ) : (
 <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
 )}
 <div>
 <span className="font-medium">{check.message}</span>
 {check.suggestion && (
 <p className="text-gray-500 mt-0.5">💡 {check.suggestion}</p>
 )}
 </div>
 <span className="mr-auto text-gray-400 shrink-0">+{check.score}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

export function SeoScorecard({ result, isLoading }: SeoScorecardProps) {
 if (isLoading) return null;
 if (result.score === 0 && result.checks.length === 0) return null;

 const passCount = result.checks.filter(c => c.status === 'pass').length;
 const failCount = result.checks.filter(c => c.status === 'fail').length;
 const warningCount = result.checks.filter(c => c.status === 'warning').length;

 return (
 <div className="bg-gray-100 -md border border-gray-200 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">

 {/* Header with Grade */}
 <div className="p-5 border-b border-gray-200">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <TrendingUp className="w-5 h-5 text-blue-600" />
 <div>
 <h3 className="font-bold text-base text-gray-700">تقرير SEO المتقدم</h3>
 <p className="text-xs text-gray-500 mt-0.5">
 {passCount} نجح • {warningCount} تحذير • {failCount} فشل
 </p>
 </div>
 </div>

 {/* Grade Circle */}
 <div className="flex items-center gap-3">
 <div className="text-left">
 <div className="text-2xl font-black text-gray-700">{result.score}</div>
 <div className="text-xs text-gray-500">من {result.maxScore}</div>
 </div>
 <div className={clsx(
 "w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl text-gray-900 shadow-sm",
 gradeColors[result.grade]
 )}>
 {result.grade}
 </div>
 </div>
 </div>

 {/* Progress Bar */}
 <div className="mt-4">
 <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
 <div
 className={clsx(
 "h-full rounded-full transition-all duration-500",
 gradeColors[result.grade]
 )}
 style={{ width: `${result.percentage}%` }}
 />
 </div>
 </div>
 </div>

 {/* Category Breakdown */}
 <div className="p-4 space-y-3">
 <CategoryProgress
 category="title"
 score={result.summary.title.score}
 max={result.summary.title.max}
 checks={result.checks}
 />
 <CategoryProgress
 category="content"
 score={result.summary.content.score}
 max={result.summary.content.max}
 checks={result.checks}
 />
 <CategoryProgress
 category="keywords"
 score={result.summary.keywords.score}
 max={result.summary.keywords.max}
 checks={result.checks}
 />
 <CategoryProgress
 category="readability"
 score={result.summary.readability.score}
 max={result.summary.readability.max}
 checks={result.checks}
 />
 <CategoryProgress
 category="technical"
 score={result.summary.technical.score}
 max={result.summary.technical.max}
 checks={result.checks}
 />
 </div>

 {/* Quick Summary */}
 <div className="p-4 bg-gray-50 border-t border-gray-200">
 <div className="grid grid-cols-3 gap-2 text-center">
 <div className="p-2 rounded-lg bg-emerald-500/10">
 <div className="text-lg font-bold text-emerald-400">{passCount}</div>
 <div className="text-xs text-gray-500">نجح</div>
 </div>
 <div className="p-2 rounded-lg bg-amber-500/10">
 <div className="text-lg font-bold text-amber-400">{warningCount}</div>
 <div className="text-xs text-gray-500">تحذير</div>
 </div>
 <div className="p-2 rounded-lg bg-red-500/10">
 <div className="text-lg font-bold text-red-400">{failCount}</div>
 <div className="text-xs text-gray-500">فشل</div>
 </div>
 </div>
 </div>
 </div>
 );
}
