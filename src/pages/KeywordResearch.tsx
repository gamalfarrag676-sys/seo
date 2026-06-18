import React, { useState } from 'react';
import { Search, BarChart, Target, Activity } from 'lucide-react';

import { useApiKeys } from '../hooks/useApiKeys';
import { generateKeywordIdeas, type KeywordData } from '../utils/aiTools';
import { useToast } from '../components/Toast';

const getIntentColor = (intent: string) => {
  const normalized = intent.toLowerCase();
  if (normalized.includes('informational')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (normalized.includes('commercial')) return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
  if (normalized.includes('transactional')) return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  if (normalized.includes('navigational')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

const getDifficultyColor = (score: number) => {
  if (score < 30) return 'text-emerald-400';
  if (score < 60) return 'text-amber-400';
  return 'text-rose-400';
};

export default function KeywordResearch() {
  const { apiKey, openaiKey, aiProvider } = useApiKeys();
  const toast = useToast();
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordData[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;
    if (!currentKey) {
      toast.error('مفتاح API غير متوفر');
      return;
    }
    
    setLoading(true);
    try {
      const data = await generateKeywordIdeas(query, currentKey, aiProvider);
      setResults(data);
      toast.success('تم تحليل الكلمات بنجاح!');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3 w-fit">
          <Search className="w-8 h-8 text-indigo-400" />
          البحث عن الكلمات المفتاحية
        </h1>
        <p className="text-slate-400">
          اكتشف الكلمات المفتاحية المناسبة لتحسين محركات البحث وزيادة الزيارات لموقعك.
        </p>
      </div>

      {/* Search Box */}
      <div className="glass-card p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label htmlFor="keyword" className="section-label mb-2 block">الكلمة المفتاحية (Seed Keyword)</label>
            <input
              id="keyword"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال: أحذية رياضية..."
              className="premium-input w-full"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-premium w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>بحث</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 font-semibold text-slate-300">الكلمة المفتاحية</th>
                  <th className="p-4 font-semibold text-slate-300">
                    <div className="flex items-center gap-2">
                      <BarChart className="w-4 h-4 text-indigo-400" />
                      حجم البحث
                    </div>
                  </th>
                  <th className="p-4 font-semibold text-slate-300">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-rose-400" />
                      الصعوبة (KD)
                    </div>
                  </th>
                  <th className="p-4 font-semibold text-slate-300">نية البحث</th>
                  <th className="p-4 font-semibold text-slate-300">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      تكلفة النقرة (CPC)
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {results.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-slate-200">{item.keyword}</td>
                    <td className="p-4 text-slate-300">{item.volume}</td>
                    <td className={`p-4 font-semibold ${getDifficultyColor(item.difficulty)}`}>
                      {item.difficulty}%
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs border ${getIntentColor(item.intent)}`}>
                        {item.intent}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{item.cpc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
