import { useState } from 'react';
import { Bot, User, Sparkles, ChevronDown, ChevronUp, RefreshCw, Loader2, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import type { HumanityAnalysisResult, HumanityFactor } from '../utils/humanityAnalyzer';

interface HumanityScoreCardProps {
 result: HumanityAnalysisResult;
 onRewrite?: () => Promise<void>;
 isRewriting?: boolean;
}

// Color mappings
const gradeColors: Record<string, string> = {
 emerald: 'bg-emerald-500',
 green: 'bg-green-500',
 amber: 'bg-amber-500',
 orange: 'bg-orange-500',
 red: 'bg-red-500'
};

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
 human: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: <CheckCircle className="w-4 h-4" /> },
 mixed: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: <AlertTriangle className="w-4 h-4" /> },
 ai: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <Bot className="w-4 h-4" /> }
};

// Factor score bar component
function FactorBar({ factor }: { factor: HumanityFactor }) {
 const statusStyle = statusColors[factor.status];

 return (
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-xs">
 <div className="flex items-center gap-2">
 <span className={`${statusStyle.text}`}>{statusStyle.icon}</span>
 <span className="text-gray-600 font-medium">{factor.name}</span>
 </div>
 <span className={`font-bold ${statusStyle.text}`}>{factor.score}%</span>
 </div>
 <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
 <div
 className={`h-full transition-all duration-500 ease-out rounded-full ${factor.status === 'human' ? 'bg-emerald-500' :
 factor.status === 'mixed' ? 'bg-amber-500' :
 'bg-red-500'
 }`}
 style={{ width: `${factor.score}%` }}
 />
 </div>
 {factor.suggestion && (
 <p className="text-xs text-gray-400 flex items-start gap-1.5 mt-1">
 <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
 <span>{factor.suggestion}</span>
 </p>
 )}
 </div>
 );
}

export function HumanityScoreCard({ result, onRewrite, isRewriting }: HumanityScoreCardProps) {
 const [isExpanded, setIsExpanded] = useState(false);

 const gradientClass = gradeColors[result.gradeColor] || gradeColors.amber;

 return (
 <div className="space-y-4">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-blue-500/20 rounded-xl">
 <Bot className="w-5 h-5 text-blue-400" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-gray-900">مقياس إنسانية المحتوى</h3>
 <p className="text-xs text-gray-500">AI Content Humanizer</p>
 </div>
 </div>
 <div className={`px-3 py-1.5 rounded-full ${gradientClass} text-gray-900 text-sm font-bold flex items-center gap-1.5`}>
 <span>{result.gradeEmoji}</span>
 <span>{result.grade}</span>
 </div>
 </div>

 {/* Main Score Visualization */}
 <div className="relative p-6 bg-gray-50 rounded-2xl border border-gray-200">
 {/* Score Slider */}
 <div className="relative mb-6">
 {/* Labels */}
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2 text-emerald-400">
 <User className="w-5 h-5" />
 <span className="font-bold">{result.humanScore}%</span>
 <span className="text-xs text-gray-500">إنساني</span>
 </div>
 <div className="flex items-center gap-2 text-red-400">
 <span className="text-xs text-gray-500">آلي</span>
 <span className="font-bold">{result.aiScore}%</span>
 <Bot className="w-5 h-5" />
 </div>
 </div>

 {/* Gradient Bar */}
 <div className="h-4 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 relative overflow-hidden">
 {/* Indicator */}
 <div
 className="absolute top-0 h-full w-1 bg-white shadow-lg shadow-white/50 transition-all duration-700 ease-out"
 style={{ left: `${result.humanScore}%`, transform: 'translateX(-50%)' }}
 />
 {/* Dark overlay for AI portion */}
 <div
 className="absolute top-0 right-0 h-full bg-gray-50/60 transition-all duration-700"
 style={{ width: `${result.aiScore}%` }}
 />
 </div>

 {/* Scale markers */}
 <div className="flex justify-between mt-2 text-xs text-gray-400">
 <span>100%</span>
 <span>75%</span>
 <span>50%</span>
 <span>25%</span>
 <span>0%</span>
 </div>
 </div>

 {/* Grade Message */}
 <div className={`p-4 rounded-xl ${result.humanScore >= 65 ? 'bg-emerald-500/10 border border-emerald-500/20' :
 result.humanScore >= 45 ? 'bg-amber-500/10 border border-amber-500/20' :
 'bg-red-500/10 border border-red-500/20'
 }`}>
 <p className={`text-sm font-medium ${result.humanScore >= 65 ? 'text-emerald-300' :
 result.humanScore >= 45 ? 'text-amber-300' :
 'text-red-300'
 }`}>
 {result.humanScore >= 80 && '✨ ممتاز! محتوى طبيعي وإنساني - جاهز للنشر'}
 {result.humanScore >= 65 && result.humanScore < 80 && '👍 جيد! محتوى يبدو طبيعياً مع بعض التحسينات الممكنة'}
 {result.humanScore >= 45 && result.humanScore < 65 && '⚠️ تحذير: المحتوى يحتاج تعديلات ليبدو أكثر إنسانية'}
 {result.humanScore >= 25 && result.humanScore < 45 && '🤖 المحتوى يبدو آلياً - يحتاج إعادة كتابة'}
 {result.humanScore < 25 && '🚨 خطر! جوجل قد يكتشف هذا كمحتوى AI'}
 </p>
 </div>
 </div>

 {/* Quick Fixes */}
 {result.quickFixes.length > 0 && (
 <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
 <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
 <Lightbulb className="w-4 h-4" />
 إصلاحات سريعة (أعلى تأثير)
 </h4>
 <ul className="space-y-2">
 {result.quickFixes.map((fix, index) => (
 <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
 <span className="text-amber-400 font-bold">{index + 1}.</span>
 <span>{fix}</span>
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* Rewrite Button */}
 {onRewrite && (
 <button
 onClick={onRewrite}
 disabled={isRewriting}
 className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${result.humanScore >= 65
 ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
 : 'bg-blue-600 text-gray-900 hover:bg-blue-700 shadow-sm'
 }`}
 >
 {isRewriting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>جاري إعادة الكتابة...</span>
 </>
 ) : (
 <>
 <RefreshCw className="w-4 h-4" />
 <span>🪄 إعادة كتابة بأسلوب إنساني</span>
 </>
 )}
 </button>
 )}

 {/* Expandable Details */}
 <div className="border-t border-gray-200 pt-4">
 <button
 onClick={() => setIsExpanded(!isExpanded)}
 className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-900 transition-colors"
 >
 <span className="flex items-center gap-2">
 <Sparkles className="w-4 h-4" />
 تفاصيل التحليل ({result.factors.length} عوامل)
 </span>
 {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
 </button>

 {isExpanded && (
 <div className="mt-4 space-y-4 animate-fade-in">
 {result.factors.map((factor) => (
 <FactorBar key={factor.id} factor={factor} />
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
