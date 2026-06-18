import React, { useState } from 'react';
import { Map, Layers, List, Download, ChevronDown } from 'lucide-react';

import { useApiKeys } from '../hooks/useApiKeys';
import { generateContentPlan, type ContentPlanCluster } from '../utils/aiTools';
import { useToast } from '../components/Toast';

const getTypeColor = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized.includes('blog') || normalized.includes('مدونة')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (normalized.includes('product') || normalized.includes('منتج')) return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
  if (normalized.includes('category') || normalized.includes('تصنيف')) return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

export default function ContentPlanner() {
  const { apiKey, openaiKey, aiProvider } = useApiKeys();
  const toast = useToast();
  
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ContentPlanCluster[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;
    if (!currentKey) {
      toast.error('مفتاح API غير متوفر');
      return;
    }
    
    setLoading(true);
    try {
      const data = await generateContentPlan(topic, currentKey, aiProvider);
      setPlan(data);
      toast.success('تم بناء مخطط المحتوى بنجاح!');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء التوليد');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(plan, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `content-plan-${topic}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-8 animate-fade-in-up" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3 w-fit">
          <Map className="w-8 h-8 text-indigo-400" />
          مخطط المحتوى (Topical Map)
        </h1>
        <p className="text-slate-400">
          قم بإنشاء هيكل محتوى متكامل يغطي جميع جوانب موضوعك لتعزيز سلطة موقعك (Topical Authority).
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-card p-6">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label htmlFor="topic" className="section-label mb-2 block">الموضوع الرئيسي</label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: أحذية رياضية..."
              className="premium-input w-full"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="btn-premium w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Layers className="w-5 h-5" />
                <span>توليد الخطة</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Export Action */}
      {plan.length > 0 && (
        <div className="flex justify-end">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تصدير الخطة</span>
          </button>
        </div>
      )}

      {/* Plan Display */}
      {plan.length > 0 && (
        <div className="space-y-6">
          {plan.map((cluster, cIdx) => (
            <div key={cIdx} className="glass-card p-6 border-t-4 border-t-indigo-500/50">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <List className="w-6 h-6 text-indigo-400" />
                {cluster.clusterName}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cluster.subtopics.map((node, nIdx) => (
                  <div key={nIdx} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-slate-200 text-lg group-hover:text-indigo-300 transition-colors">
                        {node.title}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs border whitespace-nowrap mr-3 ${getTypeColor(node.type)}`}>
                        {node.type}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-sm text-slate-400 mb-2 flex items-center gap-1">
                        <ChevronDown className="w-4 h-4" />
                        النية والهدف:
                      </div>
                      <div className="text-sm text-slate-300 bg-black/20 px-3 py-2 rounded-md">
                        {node.intent}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
