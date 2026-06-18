import { useState } from 'react';
import { useApiKeys } from '../hooks/useApiKeys';
import { useCompetitorAnalysis } from '../hooks/useCompetitorAnalysis';
import { CompetitorAnalysisDashboard } from '../components/CompetitorAnalysis';

export default function CompetitorAnalyzer() {
 const { apiKey, openaiKey, aiProvider } = useApiKeys();
 const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;
 
 const { report, isLoading, error, analyze, clearReport } = useCompetitorAnalysis(
 currentKey,
 aiProvider
 );
 
 const [input, setInput] = useState('');
 const [yourUrl, setYourUrl] = useState('');

 return (
 <div className="max-w-7xl mx-auto p-6 animate-fade-in">
 <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-8">تحليل المنافسين</h1>
 
 {/* Input Form */}
 <div className="card p-6 md:p-8 mb-8">
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">
 كلمة مفتاحية أو رابط منافس
 </label>
 <input
 type="text"
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder="مثال: سماعات بلوتوث أو https://noon.com/..."
 className="input w-full"
 />
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
 onClick={() => analyze(input, yourUrl || undefined)}
 disabled={isLoading || !input}
 className="w-full btn btn-primary bg-blue-600 hover:bg-blue-700 text-gray-900 shadow-sm disabled:opacity-50"
 >
 {isLoading ? 'جاري التحليل...' : 'تحليل المنافسين'}
 </button>
 </div>
 </div>
 
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
