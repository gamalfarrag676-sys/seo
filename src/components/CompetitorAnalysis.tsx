// src/components/CompetitorAnalysis.tsx — SEMrush/Ahrefs Style Dashboard
import { useState } from 'react';
import { 
  BarChart3, TrendingUp, Link2, FileText, AlertTriangle, 
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Minus,
  Globe, Shield, Zap, Target, Clock, Award, ChevronDown, ChevronUp
} from 'lucide-react';
import type { FullCompetitorReport, CompetitorMetrics, KeywordGap, ContentGap } from '../utils/competitorAnalyzer';

interface Props {
  report: FullCompetitorReport | null;
  isLoading: boolean;
  error: string | null;
}

// ===== UTILITY COMPONENTS =====

function ScoreRing({ score, size = 80, label }: { score: number; size?: number; label: string }) {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle 
            cx={size/2} cy={size/2} r={radius} fill="none" 
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, trend, color = 'blue' }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : trend < 0 ? <ArrowDownRight size={14} /> : <Minus size={14} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'pass' | 'warning' | 'fail' }) {
  const config = {
    pass: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'ممتاز' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle, label: 'تحذير' },
    fail: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'ضعيف' },
  };
  const { bg, text, icon: Icon, label } = config[status];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon size={12} /> {label}
    </span>
  );
}

function DifficultyBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-red-500' : value >= 40 ? 'bg-amber-500' : 'bg-green-500';
  const label = value >= 70 ? 'صعب' : value >= 40 ? 'متوسط' : 'سهل';
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-12">{label}</span>
    </div>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const config = {
    informational: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'معلوماتي', letter: 'I' },
    navigational: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'تنقلي', letter: 'N' },
    commercial: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'تجاري', letter: 'C' },
    transactional: { bg: 'bg-green-100', text: 'text-green-700', label: 'شرائي', letter: 'T' },
  };
  const c = config[intent as keyof typeof config] || config.informational;
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${c.bg} ${c.text}`} title={c.label}>
      {c.letter}
    </span>
  );
}

// ===== SECTION COMPONENTS =====

function CompetitorCard({ competitor, rank }: { competitor: CompetitorMetrics; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [kwPage, setKwPage] = useState(0);
  const KW_PER_PAGE = 10;
  const totalKwPages = Math.ceil(competitor.topKeywords.length / KW_PER_PAGE);
  const displayedKeywords = competitor.topKeywords.slice(kwPage * KW_PER_PAGE, (kwPage + 1) * KW_PER_PAGE);
  
  const rankColors = ['bg-yellow-100 text-yellow-700', 'bg-gray-100 text-gray-700', 'bg-amber-100 text-amber-700'];
  const rankColor = rank <= 3 ? rankColors[rank - 1] : 'bg-gray-50 text-gray-500';
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div 
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rankColor}`}>
          {rank}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-gray-400 shrink-0" />
            <span className="font-semibold text-gray-900 truncate">{competitor.domain}</span>
          </div>
          <p className="text-sm text-gray-500 truncate mt-0.5">{competitor.title}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <ScoreRing score={competitor.contentScore} size={50} label="المحتوى" />
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{competitor.domainAuthority}</div>
            <div className="text-xs text-gray-500">DA</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{competitor.organicTraffic}</div>
            <div className="text-xs text-gray-500">زيارات</div>
          </div>
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard icon={Link2} label="الروابط الخلفية" value={competitor.backlinks} color="blue" />
            <MetricCard icon={Globe} label="النطاقات المرجعة" value={competitor.referringDomains} color="green" />
            <MetricCard icon={FileText} label="عدد الكلمات" value={competitor.wordCount.toLocaleString()} color="purple" />
            <MetricCard icon={Shield} label="نسبة Dofollow" value={`${competitor.dofollowRatio}%`} color="amber" />
          </div>
          
          {/* Top Keywords */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Target size={16} /> الكلمات المفتاحية الأفضل
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{competitor.topKeywords.length} كلمة</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">الكلمة</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">النية</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">المركز</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">الحجم</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">CPC</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">الصعوبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedKeywords.map((kw, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{kw.keyword}</td>
                      <td className="px-3 py-2 text-center">
                        <IntentBadge intent={kw.intent} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          kw.position <= 3 ? 'bg-green-100 text-green-700' : 
                          kw.position <= 10 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {kw.position}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">{kw.volume}</td>
                      <td className="px-3 py-2 text-center text-gray-600 font-medium">{kw.cpc}</td>
                      <td className="px-3 py-2">
                        <DifficultyBar value={kw.difficulty} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalKwPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">صفحة {kwPage + 1} من {totalKwPages} ({competitor.topKeywords.length} كلمة)</span>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setKwPage(Math.max(0, kwPage - 1)); }} disabled={kwPage === 0} className="px-3 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30">السابق</button>
                  <button onClick={(e) => { e.stopPropagation(); setKwPage(Math.min(totalKwPages - 1, kwPage + 1)); }} disabled={kwPage >= totalKwPages - 1} className="px-3 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30">التالي</button>
                </div>
              </div>
            )}
          </div>
          
          {/* Technical Issues */}
          {competitor.technicalIssues.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} /> المشاكل التقنية
              </h4>
              <div className="space-y-2">
                {competitor.technicalIssues.map((issue, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    issue.category === 'critical' ? 'bg-red-50 border-red-200' :
                    issue.category === 'warning' ? 'bg-amber-50 border-amber-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        issue.category === 'critical' ? 'bg-red-200 text-red-800' :
                        issue.category === 'warning' ? 'bg-amber-200 text-amber-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {issue.category === 'critical' ? 'حرج' : issue.category === 'warning' ? 'تحذير' : 'معلومة'}
                      </span>
                      <span className="font-medium text-gray-900">{issue.issue}</span>
                    </div>
                    <p className="text-sm text-gray-600">{issue.impact}</p>
                    <p className="text-sm text-gray-500 mt-1">💡 {issue.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* On-Page SEO */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">هيكل الصفحة</h5>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between"><span>H1:</span> <span className="font-medium">{competitor.headingStructure.h1.length}</span></div>
                <div className="flex justify-between"><span>H2:</span> <span className="font-medium">{competitor.headingStructure.h2.length}</span></div>
                <div className="flex justify-between"><span>H3:</span> <span className="font-medium">{competitor.headingStructure.h3.length}</span></div>
                <div className="flex justify-between"><span>روابط داخلية:</span> <span className="font-medium">{competitor.internalLinks}</span></div>
                <div className="flex justify-between"><span>روابط خارجية:</span> <span className="font-medium">{competitor.externalLinks}</span></div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">الصور والوسائط</h5>
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between"><span>الصور:</span> <span className="font-medium">{competitor.images}</span></div>
                <div className="flex justify-between"><span>بنص بديل:</span> <span className="font-medium">{competitor.imagesWithAlt}</span></div>
                <div className="flex justify-between"><span>Schema:</span> <StatusBadge status={competitor.hasSchema ? 'pass' : 'fail'} /></div>
                <div className="flex justify-between"><span>SSL:</span> <StatusBadge status={competitor.hasSSL ? 'pass' : 'fail'} /></div>
                <div className="flex justify-between"><span>سرعة التحميل:</span> <span className="font-medium">{competitor.loadTime}s</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeywordGapTable({ gaps }: { gaps: KeywordGap[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Target size={18} className="text-purple-600" />
          فجوات الكلمات المفتاحية
        </h3>
        <p className="text-sm text-gray-500 mt-1">كلمات يتصدرها المنافسون ولا تظهر فيها</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الكلمة</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">النية</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">مركزك</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">المنافس</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">الحجم</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">CPC</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">الصعوبة</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">الفرصة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gaps.map((gap, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{gap.keyword}</td>
                <td className="px-4 py-3 text-center">
                  <IntentBadge intent={gap.intent} />
                </td>
                <td className="px-4 py-3 text-center">
                  {gap.yourPosition ? (
                    <span className="text-gray-600">#{gap.yourPosition}</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">غير مصنف</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-green-600 font-medium">#{gap.competitorPosition}</span>
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{gap.volume}</td>
                <td className="px-4 py-3 text-center text-gray-600 font-medium">{gap.cpc}</td>
                <td className="px-4 py-3">
                  <DifficultyBar value={gap.difficulty} />
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    gap.opportunity === 'high' ? 'bg-green-100 text-green-700' :
                    gap.opportunity === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {gap.opportunity === 'high' ? 'عالية' : gap.opportunity === 'medium' ? 'متوسطة' : 'منخفضة'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContentGapTable({ gaps }: { gaps: ContentGap[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          فجوات المحتوى
        </h3>
        <p className="text-sm text-gray-500 mt-1">مواضيع يغطيها المنافسون بشكل أفضل</p>
      </div>
      <div className="p-4 space-y-3">
        {gaps.map((gap, i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{gap.topic}</h4>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>تغطية المنافس: <strong className="text-gray-700">{gap.competitorCoverage}%</strong></span>
                <span>تغطيتك: <strong className="text-gray-700">{gap.yourCoverage}%</strong></span>
                <span>الكلمات المقترحة: <strong className="text-gray-700">{gap.suggestedWordCount.toLocaleString()}</strong></span>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              gap.opportunity === 'high' ? 'bg-green-100 text-green-700' :
              gap.opportunity === 'medium' ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {gap.opportunity === 'high' ? 'فرصة عالية' : gap.opportunity === 'medium' ? 'فرصة متوسطة' : 'فرصة منخفضة'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionPlan({ actions }: { actions: FullCompetitorReport['actionPlan'] }) {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...actions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Zap size={18} className="text-amber-600" />
          خطة العمل
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {sorted.map((action, i) => (
          <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                action.priority === 'high' ? 'bg-red-500' :
                action.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    action.priority === 'high' ? 'bg-red-100 text-red-700' :
                    action.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {action.priority === 'high' ? 'أولوية عالية' : action.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    action.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    action.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {action.difficulty === 'easy' ? 'سهل' : action.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{action.action}</p>
                <p className="text-sm text-gray-600 mt-1">{action.expectedImpact}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock size={12} />
                  {action.timeEstimate}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrafficChart({ data }: { data: { domain: string; data: { month: string; organic: number; paid: number }[] }[] }) {
  const maxValue = Math.max(...data.flatMap(d => d.data.map(p => Math.max(p.organic, p.paid))));
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-green-600" />
        مقارنة حركة المرور
      </h3>
      <div className="space-y-6">
        {data.map((site, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{site.domain}</span>
              <span className="text-xs text-gray-500">
                آخر شهر: {site.data[site.data.length - 1]?.organic.toLocaleString()} زيارة عضوية
              </span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {site.data.map((point, j) => (
                <div key={j} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: '80px' }}>
                    <div 
                      className="flex-1 bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                      style={{ height: `${(point.organic / maxValue) * 100}%` }}
                      title={`عضوي: ${point.organic.toLocaleString()}`}
                    />
                    <div 
                      className="flex-1 bg-blue-400 rounded-t transition-all duration-500 hover:bg-blue-500"
                      style={{ height: `${(point.paid / maxValue) * 100}%` }}
                      title={`مدفوع: ${point.paid.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{point.month}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-600">عضوي</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-400 rounded" />
          <span className="text-gray-600">مدفوع</span>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====

export function CompetitorAnalysisDashboard({ report, isLoading, error }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'keywords' | 'content' | 'backlinks' | 'action'>('overview');
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">جاري تحليل المنافسين...</p>
        <p className="text-sm text-gray-400 mt-1">قد يستغرق الأمر 30-60 ثانية</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle size={48} className="text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">حدث خطأ</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  if (!report) return null;
  
  const { serpAnalysis, marketOverview, actionPlan } = report;
  
  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
    { id: 'compare', label: 'مقارنة', icon: Shield },
    { id: 'keywords', label: 'الكلمات', icon: Target },
    { id: 'content', label: 'المحتوى', icon: FileText },
    { id: 'backlinks', label: 'الروابط', icon: Link2 },
    { id: 'action', label: 'الخطة', icon: Zap },
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">تحليل المنافسين</h2>
            <p className="text-blue-100 mt-1">الكلمة المفتاحية: <strong>{report.keyword}</strong></p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">صعوبة الكلمة</div>
            <div className="text-3xl font-bold">{marketOverview.keywordDifficulty}</div>
            <DifficultyBar value={marketOverview.keywordDifficulty} />
          </div>
        </div>
        
        {/* Market Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-sm text-blue-100">عدد النتائج</div>
            <div className="text-xl font-bold">{marketOverview.totalResults.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-sm text-blue-100">متوسط DA</div>
            <div className="text-xl font-bold">{marketOverview.avgDomainAuthority}</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-sm text-blue-100">متوسط المحتوى</div>
            <div className="text-xl font-bold">{marketOverview.avgContentLength.toLocaleString()} كلمة</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-sm text-blue-100">نوع البحث</div>
            <div className="text-xl font-bold">
              {marketOverview.searchIntent === 'informational' ? 'معلوماتي' :
               marketOverview.searchIntent === 'commercial' ? 'تجاري' :
               marketOverview.searchIntent === 'transactional' ? 'شرائي' : 'تنقلي'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 text-lg mb-3">ملخص تنفيذي</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="text-blue-600 font-semibold mb-1">المنافسة</div>
                <p className="text-gray-700">تم تحليل <strong>{serpAnalysis.competitors.length}</strong> منافس بمتوسط قوة نطاق <strong>{marketOverview.avgDomainAuthority}</strong> ومتوسط محتوى <strong>{marketOverview.avgContentLength.toLocaleString()}</strong> كلمة</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="text-green-600 font-semibold mb-1">الفرص</div>
                <p className="text-gray-700">تم اكتشاف <strong>{serpAnalysis.keywordGaps.length}</strong> فجوة كلمات مفتاحية و <strong>{serpAnalysis.contentGaps.length}</strong> فجوة محتوى يمكنك استغلالها</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <div className="text-amber-600 font-semibold mb-1">التوصية</div>
                <p className="text-gray-700">صعوبة الكلمة <strong>{marketOverview.keywordDifficulty}</strong>/100 — {marketOverview.keywordDifficulty >= 70 ? 'منافسة شرسة، ركز على Long-tail' : marketOverview.keywordDifficulty >= 40 ? 'منافسة متوسطة، محتوى عميق سيفوز' : 'فرصة ذهبية، منافسة ضعيفة!'}</p>
              </div>
            </div>
          </div>

          {/* Winner Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
            <Award size={32} className="text-amber-600" />
            <div>
              <h3 className="font-bold text-amber-900">المتصدر: {serpAnalysis.winner.overall}</h3>
              <p className="text-sm text-amber-700">
                أفضل محتوى: {serpAnalysis.winner.content} | أفضل تقني: {serpAnalysis.winner.technical} | أقوى سلطة: {serpAnalysis.winner.authority}
              </p>
            </div>
          </div>
          
          {/* Competitors */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Globe size={18} className="text-blue-600" />
              المنافسون ({serpAnalysis.competitors.length})
            </h3>
            {serpAnalysis.competitors.map((comp, i) => (
              <CompetitorCard key={comp.domain} competitor={comp} rank={i + 1} />
            ))}
          </div>
          
          {/* Traffic Comparison */}
          <TrafficChart data={serpAnalysis.trafficComparison} />
        </div>
      )}
      
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <KeywordGapTable gaps={serpAnalysis.keywordGaps} />
          
          {/* SERP Features */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">مميزات SERP</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {marketOverview.serpFeatures.map((feature, i) => (
                <div key={i} className={`p-3 rounded-lg border ${feature.present ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    {feature.present ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-gray-400" />}
                    <span className={`text-sm font-medium ${feature.present ? 'text-green-800' : 'text-gray-500'}`}>
                      {feature.type === 'featured_snippet' ? 'Featured Snippet' :
                       feature.type === 'people_also_ask' ? 'People Also Ask' :
                       feature.type === 'video' ? 'فيديوهات' :
                       feature.type === 'image_pack' ? 'حزمة صور' :
                       feature.type === 'local_pack' ? 'Local Pack' : 'Shopping'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Phase 5: Deep Content Audit */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" />
              تدقيق المحتوى المتقدم (Content Audit)
            </h3>
            <div className="space-y-4">
              {serpAnalysis.competitors.map((comp, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-800">{comp.domain}</span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{comp.wordCount} كلمة</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">عمق المحتوى</div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${comp.contentDepth > 70 ? 'bg-green-500' : comp.contentDepth > 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${comp.contentDepth}%` }}></div>
                        </div>
                        <span className="text-sm font-bold">{comp.contentDepth}%</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">تكرار المحتوى (Duplicate)</div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${comp.duplicateRatio < 20 ? 'text-green-600' : comp.duplicateRatio < 40 ? 'text-amber-500' : 'text-red-500'}`}>
                          {comp.duplicateRatio}% مكرر
                        </span>
                        {comp.duplicateSnippets?.length > 0 && (
                          <span className="text-xs text-red-400" title={comp.duplicateSnippets[0]}>تفاصيل</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">نبرة المحتوى (Tone)</div>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                        comp.tone === 'بيعي' ? 'bg-orange-100 text-orange-700' :
                        comp.tone === 'ودود' ? 'bg-green-100 text-green-700' :
                        comp.tone === 'معلوماتي' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{comp.tone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ContentGapTable gaps={serpAnalysis.contentGaps} />
          
          {/* Content Score Comparison */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">مقارنة درجات المحتوى</h3>
            <div className="space-y-3">
              {serpAnalysis.competitors.map((comp, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-32 text-sm text-gray-600 truncate">{comp.domain}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full flex items-center justify-end px-3 transition-all duration-1000 ${
                        comp.contentScore >= 80 ? 'bg-green-500' :
                        comp.contentScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${comp.contentScore}%` }}
                    >
                      <span className="text-white text-xs font-bold">{comp.contentScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'backlinks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Link2 size={18} className="text-blue-600" />
                فجوات الروابط الخلفية
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">النطاق</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">السلطة</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">روابط للمنافس</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">روابط لك</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">الفرصة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serpAnalysis.backlinkGaps.map((gap, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{gap.domain}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                          gap.authority >= 70 ? 'bg-green-100 text-green-700' :
                          gap.authority >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {gap.authority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-green-600 font-medium">{gap.linksToCompetitor}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{gap.linksToYou || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          gap.opportunity === 'high' ? 'bg-green-100 text-green-700' :
                          gap.opportunity === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {gap.opportunity === 'high' ? 'عالية' : gap.opportunity === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'compare' && serpAnalysis.competitors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield size={18} className="text-blue-600" />
              مقارنة جنباً لجنب (Side-by-Side)
            </h3>
            <p className="text-sm text-gray-500 mt-1">مقارنة شاملة بين جميع المنافسين</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 w-36">المعيار</th>
                  {serpAnalysis.competitors.map((c, i) => (
                    <th key={i} className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                      <div className="flex flex-col items-center gap-1">
                        <Globe size={14} className="text-gray-400" />
                        {c.domain}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { label: 'قوة النطاق (DA)', key: 'domainAuthority', best: 'max' },
                  { label: 'الزيارات العضوية', key: 'organicTraffic', best: 'none' },
                  { label: 'نقاط المحتوى', key: 'contentScore', best: 'max' },
                  { label: 'عدد الكلمات', key: 'wordCount', best: 'max' },
                  { label: 'الروابط الخلفية', key: 'backlinks', best: 'none' },
                  { label: 'الروابط الداخلية', key: 'internalLinks', best: 'max' },
                  { label: 'الروابط الخارجية', key: 'externalLinks', best: 'max' },
                  { label: 'الصور', key: 'images', best: 'max' },
                  { label: 'سرعة التحميل (s)', key: 'loadTime', best: 'min' },
                  { label: 'SSL', key: 'hasSSL', best: 'bool' },
                  { label: 'Schema', key: 'hasSchema', best: 'bool' },
                  { label: 'الكلمات المفتاحية', key: 'topKeywordsCount', best: 'max' },
                ].map((row) => {
                  const values = serpAnalysis.competitors.map((c: any) => {
                    if (row.key === 'topKeywordsCount') return c.topKeywords?.length || 0;
                    return c[row.key];
                  });
                  const numValues = values.map((v: any) => typeof v === 'number' ? v : parseFloat(v) || 0);
                  const bestVal = row.best === 'max' ? Math.max(...numValues) : row.best === 'min' ? Math.min(...numValues) : null;
                  
                  return (
                    <tr key={row.key} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-700">{row.label}</td>
                      {values.map((val: any, i: number) => {
                        const numVal = typeof val === 'number' ? val : parseFloat(val) || 0;
                        const isBest = row.best === 'bool' ? val === true : bestVal !== null && numVal === bestVal;
                        return (
                          <td key={i} className="px-4 py-3 text-center">
                            <span className={`font-semibold ${isBest ? 'text-green-600' : 'text-gray-700'}`}>
                              {row.best === 'bool' ? (
                                val ? <CheckCircle size={16} className="text-green-500 mx-auto" /> : <XCircle size={16} className="text-red-400 mx-auto" />
                              ) : (
                                typeof val === 'number' ? val.toLocaleString() : val
                              )}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'action' && (
        <ActionPlan actions={actionPlan} />
      )}
    </div>
  );
}
