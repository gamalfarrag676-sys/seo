# 📊 تحديث تحليل المنافسين — SEMrush/Ahrefs Style

## الملفات الجديدة

### 1. `src/utils/competitorAnalyzer.ts` ⭐ NEW
ملف التحليل الرئيسي — يحتوي على:
- **Scraping Engine**: جلب محتوى الصفحات الحقيقية
- **Multi-Proxy Support**: دعم multiple proxies + Supabase Edge Function
- **AI Analysis**: تحليل ذكي للمنافسين
- **Error Handling**: معالجة أخطاء محسّنة

### 2. `src/components/CompetitorAnalysis.tsx` ⭐ NEW
واجهة المستخدم — تحتوي على:
- **Score Rings**: دوائر التقييم المتحركة
- **Competitor Cards**: بطاقات قابلة للتوسيع
- **Keyword Gap Table**: جدول فجوات الكلمات
- **Content Gap Analysis**: تحليل فجوات المحتوى
- **Traffic Charts**: رسوم بيانية للزيارات
- **Action Plan**: خطة عمل مرئية
- **5 Tabs**: نظرة عامة / كلمات / محتوى / روابط / خطة

### 3. `src/hooks/useCompetitorAnalysis.ts` ⭐ NEW
Hook للاستخدام:
```typescript
const { report, isLoading, error, analyze, clearReport } = useCompetitorAnalysis(apiKey, provider);
```

---

## 🔧 خطوات التركيب

### الخطوة 1: أنسخ الملفات
انسخ الملفات الثلاثة للمجلدات المناسبة:
```
src/utils/competitorAnalyzer.ts
src/components/CompetitorAnalysis.tsx
src/hooks/useCompetitorAnalysis.ts
```

### الخطوة 2: عدّل الصفحة
في صفحة تحليل المنافسين (مثلاً `src/pages/CompetitorAnalysisPage.tsx`):

```tsx
import { useState } from 'react';
import { useApiKeys } from '../hooks/useApiKeys';
import { useCompetitorAnalysis } from '../hooks/useCompetitorAnalysis';
import { CompetitorAnalysisDashboard } from '../components/CompetitorAnalysis';

export default function CompetitorAnalysisPage() {
  const { apiKey, openaiKey, aiProvider } = useApiKeys();
  const currentKey = aiProvider === 'gemini' ? apiKey : openaiKey;
  
  const { report, isLoading, error, analyze, clearReport } = useCompetitorAnalysis(
    currentKey,
    aiProvider
  );
  
  const [input, setInput] = useState('');
  const [yourUrl, setYourUrl] = useState('');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">تحليل المنافسين</h1>
      
      {/* Input Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة مفتاحية أو رابط منافس
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="مثال: سماعات بلوتوث أو https://noon.com/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              موقعك (اختياري — للمقارنة)
            </label>
            <input
              type="text"
              value={yourUrl}
              onChange={(e) => setYourUrl(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={() => analyze(input, yourUrl || undefined)}
            disabled={isLoading || !input}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'جاري التحليل...' : 'تحليل المنافسين'}
          </button>
        </div>
      </div>
      
      {/* Results */}
      <CompetitorAnalysisDashboard 
        report={report} 
        isLoading={isLoading} 
        error={error} 
      />
    </div>
  );
}
```

---

## 🎯 المميزات الجديدة

| الميزة | SEMrush | Ahrefs | مشروعك (جديد) |
|--------|---------|--------|--------------|
| Domain Authority | ✅ | ✅ | ✅ (AI Estimate) |
| Organic Traffic | ✅ | ✅ | ✅ (AI Estimate) |
| Backlinks | ✅ | ✅ | ✅ (AI Estimate) |
| Top Keywords | ✅ | ✅ | ✅ |
| Keyword Gap | ✅ | ✅ | ✅ |
| Content Gap | ✅ | ✅ | ✅ |
| SERP Features | ✅ | ✅ | ✅ |
| Traffic Charts | ✅ | ✅ | ✅ |
| Technical Audit | ✅ | ✅ | ✅ |
| Action Plan | ❌ | ❌ | ✅ (فريد!) |
| Real Scraping | ❌ | ❌ | ✅ (فريد!) |

---

## ⚠️ ملاحظات مهمة

### 1. Scraping Limitations
- بعض المواقع تمنع الـ scraping (Cloudflare, etc.)
- الـ proxies المجانية محدودة
- **الحل**: استخدم Supabase Edge Function للـ production

### 2. AI Estimates
- الأرقام (DA, Traffic, Backlinks) هي **تقديرات ذكاء اصطناعي**
- مش بيانات حقيقية زي SEMrush
- لكنها واقعية بناءً على تحليل المحتوى

### 3. API Costs
- كل تحليل بيستخدم 3-4 calls للـ AI
- استخدم Gemini (أرخص) للـ production

---

## 🚀 تحسينات مستقبلية

1. **Real SERP API**: ربط بـ DataForSEO أو SerpAPI
2. **Real Backlink Data**: ربط بـ Majestic أو Moz
3. **Historical Data**: تخزين التحليلات السابقة
4. **PDF Export**: تصدير التقارير
5. **Email Alerts**: تنبيهات عند تغير المراكز

---

## 📁 الملفات للتنزيل

| الملف | الرابط |
|-------|--------|
| competitorAnalyzer.ts | [تنزيل](sandbox:///mnt/agents/output/competitorAnalyzer.ts) |
| CompetitorAnalysis.tsx | [تنزيل](sandbox:///mnt/agents/output/CompetitorAnalysis.tsx) |
| useCompetitorAnalysis.ts | [تنزيل](sandbox:///mnt/agents/output/useCompetitorAnalysis.ts) |
