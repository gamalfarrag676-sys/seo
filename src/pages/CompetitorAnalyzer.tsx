import { useState } from 'react';
import { useApiKeys } from '../hooks/useApiKeys';
import { useCompetitorAnalysis } from '../hooks/useCompetitorAnalysis';
import { useCompetitorHistory } from '../hooks/useCompetitorHistory';
import { CompetitorAnalysisDashboard } from '../components/CompetitorAnalysis';
import { exportToCSV, exportToPDF } from '../utils/exportReport';
import { History, Trash2, Eye } from 'lucide-react';

export default function CompetitorAnalyzer() {
 const { apiKey, openaiKey, aiProvider } = useApiKeys();
 const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;
 
 const { report, isLoading, error, analyze, setReport } = useCompetitorAnalysis(
  currentKey,
  aiProvider
 );
 
 const { reports, isLoading: isHistoryLoading, deleteReport } = useCompetitorHistory();
 
 const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
 const [yourUrl, setYourUrl] = useState('');

 const addCompetitor = () => {
  if (competitorUrls.length < 5) setCompetitorUrls([...competitorUrls, '']);
 };

 const removeCompetitor = (index: number) => {
  if (competitorUrls.length > 1) {
   setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
  }
 };

 const updateUrl = (index: number, value: string) => {
  const updated = [...competitorUrls];
  updated[index] = value;
  setCompetitorUrls(updated);
 };

 const handleAnalyze = () => {
  const validUrls = competitorUrls.filter(u => u.trim());
  if (validUrls.length === 0) return;
  // Pass multiple URLs joined by ||| delimiter
  analyze(validUrls.join('|||'), yourUrl || undefined);
 };

 const hasInput = competitorUrls.some(u => u.trim());

 return (
  <div className="max-w-7xl mx-auto p-6 animate-fade-in">
   <div className="flex items-center justify-between mb-8">
    <h1 className="text-3xl md:text-5xl font-black text-gray-900">تحليل المنافسين</h1>
    {report && (
     <div className="flex gap-2">
      <button
       onClick={() => exportToCSV(report)}
       className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
      >
       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
       CSV
      </button>
      <button
       onClick={() => exportToPDF(report)}
       className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
      >
       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
       PDF
      </button>
     </div>
    )}
   </div>

   {/* Input Form */}
   <div className="card p-6 md:p-8 mb-8">
    <div className="space-y-4">
     {/* Competitor URLs */}
     <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
       روابط المنافسين (حتى 5 منافسين)
      </label>
      <div className="space-y-3">
       {competitorUrls.map((url, i) => (
        <div key={i} className="flex items-center gap-2">
         <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">{i + 1}</span>
         <input
          type="text"
          value={url}
          onChange={(e) => updateUrl(i, e.target.value)}
          placeholder={i === 0 ? 'رابط المنافس أو كلمة مفتاحية — مثال: https://miniso.sa' : 'رابط منافس إضافي'}
          className="input w-full"
         />
         {competitorUrls.length > 1 && (
          <button onClick={() => removeCompetitor(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="حذف">
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
          </button>
         )}
        </div>
       ))}
      </div>
      {competitorUrls.length < 5 && (
       <button onClick={addCompetitor} className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
        أضف منافس آخر ({competitorUrls.length}/5)
       </button>
      )}
     </div>

     <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
       موقعك (اختياري — للمقارنة)
      </label>
      <input
       type="text"
       value={yourUrl}
       onChange={(e) => setYourUrl(e.target.value)}
       placeholder="https://yoursite.com"
       className="input w-full"
      />
     </div>

     <button
      onClick={handleAnalyze}
      disabled={isLoading || !hasInput}
      className="w-full btn btn-primary bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 py-3 text-base font-bold rounded-xl transition-all"
     >
      {isLoading ? (
       <span className="flex items-center justify-center gap-3">
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        جاري تحليل {competitorUrls.filter(u => u.trim()).length} منافس...
       </span>
      ) : (
       `تحليل ${competitorUrls.filter(u => u.trim()).length > 1 ? competitorUrls.filter(u => u.trim()).length + ' منافسين' : 'المنافسين'}`
      )}
     </button>
    </div>
   </div>

   {/* History Section */}
   {!report && reports.length > 0 && (
    <div className="mb-8">
     <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <History className="text-blue-600" />
      التقارير السابقة
     </h2>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reports.map((r) => (
       <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
         <h3 className="font-bold text-lg text-gray-900 truncate pr-2" title={r.keyword}>{r.keyword}</h3>
         <button onClick={() => deleteReport(r.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
          <Trash2 size={16} />
         </button>
        </div>
        <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
         <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">{r.report_data.serpAnalysis?.competitors?.length || 0} منافسين</span>
         {new Date(r.created_at).toLocaleDateString('ar-SA')}
        </p>
        <button 
         onClick={() => {
          setReport(r.report_data);
          window.scrollTo({ top: 0, behavior: 'smooth' });
         }}
         className="w-full btn btn-secondary py-2 text-sm flex items-center justify-center gap-2"
        >
         <Eye size={16} />
         عرض التقرير
        </button>
       </div>
      ))}
     </div>
    </div>
   )}

   {/* Results */}
   <div className="mt-8">
    <CompetitorAnalysisDashboard 
     report={report} 
     isLoading={isLoading} 
     error={error} 
    />
   </div>
  </div>
 );
}
