import { useState } from 'react';
import { Globe, Search, BarChart2, Zap, ArrowUpRight, TrendingUp, AlertTriangle, Link, Users, Shield, Target } from 'lucide-react';
import { useToast } from '../components/Toast';

import { useApiKeys } from '../hooks/useApiKeys';
import { generateCompetitorAnalysis, type CompetitorAnalysisData } from '../utils/aiTools';

export default function CompetitorAnalyzer() {
  const { apiKey, openaiKey, aiProvider } = useApiKeys();
  const toast = useToast();
  
  const [keyword, setKeyword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CompetitorAnalysisData[] | null>(null);

  const handleAnalyze = async () => {
    if (!keyword.trim()) {
      toast.error('الرجاء إدخال الكلمة المفتاحية أو رابط المنافس');
      return;
    }

    const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;
    if (!currentKey) {
      toast.error('مفتاح API غير متوفر');
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await generateCompetitorAnalysis(keyword, currentKey, aiProvider);
      setResults(data);
      toast.success('تم جلب البيانات بنجاح!');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء التحليل');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl ring-1 ring-indigo-500/30 mb-2">
          <BarChart2 className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white">تحليل النطاق <span className="text-indigo-400">Domain Overview</span></h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          أدخل رابط أي موقع أو كلمة مفتاحية للحصول على تقديرات شاملة للزيارات، الباكلينكس، والكلمات المتصدرة (Powered by AI).
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-card p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="premium-input pl-4 pr-12"
              placeholder="مثال: https://miniso.sa/ar أو 'ميني سو'"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !keyword}
            className="btn-premium whitespace-nowrap"
          >
            <div className="flex items-center gap-2 relative z-10">
              {isAnalyzing ? (
                <>
                  <Zap className="w-5 h-5 animate-pulse" />
                  <span>جاري سحب البيانات...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>حلل النطاق</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Results Dashboard */}
      {results && results.map((comp, idx) => (
        <div key={idx} className="space-y-6 animate-fade-in-up">
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-400" />
              التقرير الشامل لـ: <span className="text-indigo-300 font-mono tracking-wider">{comp.url}</span>
            </h2>
            <a href={comp.url.startsWith('http') ? comp.url : `https://${comp.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full transition-colors">
              زيارة الموقع <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          {/* Top 4 Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-slate-400 font-medium">Authority Score</div>
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-white">{comp.domainOverview.domainAuthority}</div>
              <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> قوة النطاق ممتازة
              </div>
            </div>

            <div className="glass-card p-5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-slate-400 font-medium">Organic Traffic</div>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white">{comp.domainOverview.organicTraffic}</div>
              <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> زيارات شهرية مقدرة
              </div>
            </div>

            <div className="glass-card p-5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-slate-400 font-medium">Backlinks</div>
                <Link className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white">{comp.domainOverview.backlinks}</div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                إجمالي الروابط الخلفية
              </div>
            </div>

            <div className="glass-card p-5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-slate-400 font-medium">Ref. Domains</div>
                <Globe className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white">{comp.domainOverview.referringDomains}</div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                نطاقات فريدة مرجعية
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Top Organic Keywords Table */}
            <div className="lg:col-span-2 glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                أهم الكلمات المتصدرة (Top Organic Keywords)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="text-xs text-slate-400 border-b border-slate-700/50">
                    <tr>
                      <th className="pb-3 pr-2 font-medium">الكلمة المفتاحية (Keyword)</th>
                      <th className="pb-3 px-2 font-medium">الترتيب (Pos)</th>
                      <th className="pb-3 px-2 font-medium">البحث (Volume)</th>
                      <th className="pb-3 px-2 font-medium">الصعوبة (KD%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comp.topKeywords.map((kw, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 pr-2 font-semibold text-slate-200">{kw.keyword}</td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-mono text-xs">
                            {kw.position}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-300">{kw.volume}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${kw.kd < 30 ? 'text-emerald-400' : kw.kd < 60 ? 'text-amber-400' : 'text-red-400'}`}>
                              {kw.kd}
                            </span>
                            <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${kw.kd < 30 ? 'bg-emerald-500' : kw.kd < 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                style={{ width: `${kw.kd}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEO Analysis Panel */}
            <div className="glass-card p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                التدقيق الفني (Site Audit)
              </h3>
              
              <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={comp.seoAnalysis.contentScore >= 80 ? '#10b981' : '#f59e0b'}
                      strokeWidth="3"
                      strokeDasharray={`${comp.seoAnalysis.contentScore}, 100`}
                    />
                  </svg>
                  <span className="absolute text-lg font-black text-white">{comp.seoAnalysis.contentScore}</span>
                </div>
                <div>
                  <div className="text-slate-200 font-bold">تقييم المحتوى العام</div>
                  <div className="text-xs text-slate-400">تحليل جودة النصوص وتجربة المستخدم.</div>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <h4 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-700 pb-1">المشاكل التقنية (Errors)</h4>
                  <ul className="space-y-2">
                    {comp.seoAnalysis.technicalIssues.map((issue, i) => (
                      <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-700 pb-1">فجوات يمكنك استغلالها (Gaps)</h4>
                  <ul className="space-y-2">
                    {comp.seoAnalysis.contentGaps.map((gap, i) => (
                      <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}
