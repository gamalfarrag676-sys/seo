import React, { useState } from 'react';
import { 
 ShieldCheck, ChevronDown, ChevronUp, AlertCircle, 
 CheckCircle, AlertTriangle, UserPlus, BookOpen, 
 Award, Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import type { EEATAnalysisResult, EEATFactor } from '../utils/eeatAnalyzer';

interface EEATScoreCardProps {
 result: EEATAnalysisResult;
}

export const EEATScoreCard: React.FC<EEATScoreCardProps> = ({ result }) => {
 const [isExpanded, setIsExpanded] = useState(false);

 const getStatusIcon = (status: EEATFactor['status']) => {
 switch (status) {
 case 'strong': return <CheckCircle className="w-4 h-4" />;
 case 'moderate': return <AlertTriangle className="w-4 h-4" />;
 case 'weak': return <AlertCircle className="w-4 h-4" />;
 }
 };

 const categories = [
 { 
 id: 'experience', 
 label: 'التجربة', 
 icon: <UserPlus className="w-4 h-4" />, 
 data: result.categories.experience,
 factors: result.factors.filter(f => f.category === 'experience')
 },
 { 
 id: 'expertise', 
 label: 'الخبرة', 
 icon: <BookOpen className="w-4 h-4" />, 
 data: result.categories.expertise,
 factors: result.factors.filter(f => f.category === 'expertise')
 },
 { 
 id: 'authoritativeness', 
 label: 'السلطة (المصداقية)', 
 icon: <Award className="w-4 h-4" />, 
 data: result.categories.authoritativeness,
 factors: result.factors.filter(f => f.category === 'authoritativeness')
 },
 { 
 id: 'trustworthiness', 
 label: 'الموثوقية', 
 icon: <Shield className="w-4 h-4" />, 
 data: result.categories.trustworthiness,
 factors: result.factors.filter(f => f.category === 'trustworthiness')
 }
 ];

 return (
 <div className="card overflow-hidden">
 {/* Header */}
 <div 
 className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
 onClick={() => setIsExpanded(!isExpanded)}
 >
 <div className="flex items-center gap-4">
 <div className="relative w-14 h-14 shrink-0 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
 <span className={clsx(
 "text-2xl font-black",
 result.gradeColor === 'emerald' ? 'text-emerald-400' :
 result.gradeColor === 'amber' ? 'text-amber-400' : 'text-red-400'
 )}>
 {result.overallScore}
 </span>
 </div>
 <div>
 <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
 <ShieldCheck className="w-5 h-5 text-blue-600" />
 تقييم E-E-A-T
 </h3>
 <p className="text-sm text-gray-500 mt-1">معايير جوجل للجودة والمصداقية</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className={clsx(
 "px-3 py-1 rounded-full text-xs font-bold border",
 result.gradeColor === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
 result.gradeColor === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 
 'text-red-400 bg-red-500/10 border-red-500/20'
 )}>
 {result.grade}
 </div>
 {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
 </div>
 </div>

 {/* Expanded Content */}
 <div className={clsx(
 "transition-all duration-300 ease-in-out overflow-hidden border-t border-gray-200",
 isExpanded ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0 border-transparent"
 )}>
 <div className="p-4 sm:p-5 space-y-6">
 
 {/* Top Suggestions (if any) */}
 {result.suggestions.length > 0 && (
 <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
 <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm">
 <AlertCircle className="w-4 h-4 text-amber-400" />
 أهم نصائح لزيادة الموثوقية:
 </h4>
 <ul className="space-y-2">
 {result.suggestions.map((suggestion, idx) => (
 <li key={idx} className="flex gap-2 text-sm text-gray-600">
 <span className="text-amber-500/50 mt-0.5">•</span>
 {suggestion}
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* Categories */}
 <div className="space-y-4">
 {categories.map(cat => (
 <div key={cat.id} className="bg-gray-50/40 rounded-xl p-4 border border-gray-200">
 {/* Category Header */}
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2 font-bold text-gray-700">
 <div className="p-1.5 rounded-lg bg-gray-100 text-blue-600">
 {cat.icon}
 </div>
 {cat.label}
 </div>
 <div className="text-sm font-bold text-gray-500">
 {cat.data.score} / {cat.data.max}
 </div>
 </div>

 {/* Category Progress */}
 <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
 <div 
 className={clsx(
 "h-full rounded-full transition-all",
 (cat.data.score / cat.data.max) >= 0.75 ? 'bg-emerald-500' :
 (cat.data.score / cat.data.max) >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
 )}
 style={{ width: `${(cat.data.score / cat.data.max) * 100}%` }}
 />
 </div>

 {/* Category Factors */}
 <div className="space-y-2 mt-3">
 {cat.factors.map(factor => (
 <div key={factor.id} className="bg-gray-100 rounded p-2.5">
 <div className="flex justify-between items-start mb-1">
 <span className="text-xs font-semibold text-gray-600">{factor.name}</span>
 <span className={clsx("text-[10px] flex items-center gap-1", 
 factor.status === 'strong' ? 'text-emerald-400' :
 factor.status === 'moderate' ? 'text-amber-400' : 'text-red-400'
 )}>
 {getStatusIcon(factor.status)} {factor.score}/{factor.weight}
 </span>
 </div>
 <p className="text-[11px] text-gray-500 leading-relaxed">{factor.message}</p>
 {factor.suggestion && factor.status !== 'strong' && (
 <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-start gap-1">
 <span className="mt-0.5">💡</span> {factor.suggestion}
 </p>
 )}
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>

 </div>
 </div>
 </div>
 );
};
