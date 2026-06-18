import React, { useState } from 'react';
import { Bot, ChevronDown, ChevronUp, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import type { GeoAnalysisResult, GeoFactor } from '../utils/geoAnalyzer';

interface GeoScoreCardProps {
  result: GeoAnalysisResult;
}

export const GeoScoreCard: React.FC<GeoScoreCardProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: GeoFactor['status']) => {
    switch (status) {
      case 'excellent': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'good': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'needs-work': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'poor': return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
  };

  const getStatusIcon = (status: GeoFactor['status']) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'needs-work':
        return <AlertTriangle className="w-4 h-4" />;
      case 'poor':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0">
            {/* SVG Circle for Score */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                className="stroke-slate-800"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                className={clsx(
                  "transition-all duration-1000 ease-out",
                  result.gradeColor === 'emerald' ? 'stroke-emerald-500' :
                  result.gradeColor === 'amber' ? 'stroke-amber-500' : 'stroke-red-500'
                )}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - result.score / 100)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={clsx(
                "text-lg font-bold",
                result.gradeColor === 'emerald' ? 'text-emerald-400' :
                result.gradeColor === 'amber' ? 'text-amber-400' : 'text-red-400'
              )}>
                {result.score}
              </span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5 text-indigo-400" />
              تقييم GEO/AEO
              <span className="text-xl">{result.gradeEmoji}</span>
            </h3>
            <p className="text-sm text-slate-400 mt-1">مدى قابلية الاقتباس من محركات البحث الذكية</p>
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
          {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </div>
      </div>

      {/* Expanded Content */}
      <div className={clsx(
        "transition-all duration-300 ease-in-out overflow-hidden border-t border-slate-800/50",
        isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 border-transparent"
      )}>
        <div className="p-4 sm:p-5 space-y-6">
          
          {/* Top Suggestions (if any and score is not perfect) */}
          {result.suggestions.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <h4 className="font-bold text-slate-200 mb-3 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                أهم نصائح التحسين لمحركات AI:
              </h4>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-amber-500/50 mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Factors List */}
          <div className="space-y-3">
            {result.factors.map(factor => (
              <div key={factor.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-slate-200">{factor.name}</div>
                  <div className={clsx("flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border", getStatusColor(factor.status))}>
                    {getStatusIcon(factor.status)}
                    <span>{factor.score}%</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div 
                    className={clsx(
                      "h-full rounded-full",
                      factor.status === 'excellent' || factor.status === 'good' ? 'bg-emerald-500' :
                      factor.status === 'needs-work' ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
                
                <p className="text-xs text-slate-400">{factor.message}</p>
                {factor.suggestion && factor.status !== 'excellent' && factor.status !== 'good' && (
                  <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1">
                    <ChevronLeft className="w-3 h-3" /> {factor.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

// Simple ChevronLeft for local use
const ChevronLeft = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m15 18-6-6 6-6"/>
  </svg>
);
