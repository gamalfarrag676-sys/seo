// src/utils/exportReport.ts — CSV & PDF Export for Competitor Reports
import type { FullCompetitorReport } from './competitorAnalyzer';

// ===== CSV EXPORT =====
export function exportToCSV(report: FullCompetitorReport) {
  const rows: string[][] = [];
  
  // Header
  rows.push(['تقرير تحليل المنافسين — ' + report.keyword]);
  rows.push(['تاريخ التقرير: ' + new Date(report.timestamp).toLocaleDateString('ar-SA')]);
  rows.push([]);
  
  // Market Overview
  rows.push(['=== نظرة عامة على السوق ===']);
  rows.push(['صعوبة الكلمة', report.marketOverview.keywordDifficulty.toString()]);
  rows.push(['متوسط DA', report.marketOverview.avgDomainAuthority.toString()]);
  rows.push(['متوسط المحتوى (كلمة)', report.marketOverview.avgContentLength.toString()]);
  rows.push(['نوع البحث', report.marketOverview.searchIntent]);
  rows.push([]);
  
  // Competitors
  rows.push(['=== المنافسون ===']);
  rows.push(['النطاق', 'DA', 'الزيارات', 'نقاط المحتوى', 'عدد الكلمات', 'الروابط الخلفية', 'SSL', 'Schema']);
  for (const c of report.serpAnalysis.competitors) {
    rows.push([
      c.domain,
      c.domainAuthority.toString(),
      c.organicTraffic,
      c.contentScore.toString(),
      c.wordCount.toString(),
      c.backlinks,
      c.hasSSL ? 'نعم' : 'لا',
      c.hasSchema ? 'نعم' : 'لا'
    ]);
  }
  rows.push([]);
  
  // Top Keywords per competitor
  for (const c of report.serpAnalysis.competitors) {
    rows.push([`=== كلمات: ${c.domain} ===`]);
    rows.push(['الكلمة', 'المركز', 'الحجم', 'الصعوبة', 'النية', 'CPC', 'الترافيك']);
    for (const kw of c.topKeywords) {
      rows.push([
        kw.keyword,
        kw.position.toString(),
        kw.volume,
        kw.difficulty.toString(),
        kw.intent,
        kw.cpc,
        kw.traffic
      ]);
    }
    rows.push([]);
  }
  
  // Keyword Gaps
  if (report.serpAnalysis.keywordGaps.length > 0) {
    rows.push(['=== فجوات الكلمات المفتاحية ===']);
    rows.push(['الكلمة', 'مركزك', 'مركز المنافس', 'الحجم', 'الصعوبة', 'النية', 'CPC', 'الفرصة']);
    for (const gap of report.serpAnalysis.keywordGaps) {
      rows.push([
        gap.keyword,
        gap.yourPosition?.toString() || 'غير مصنف',
        gap.competitorPosition.toString(),
        gap.volume,
        gap.difficulty.toString(),
        gap.intent,
        gap.cpc,
        gap.opportunity
      ]);
    }
    rows.push([]);
  }
  
  // Content Gaps
  if (report.serpAnalysis.contentGaps.length > 0) {
    rows.push(['=== فجوات المحتوى ===']);
    rows.push(['الموضوع', 'تغطية المنافس %', 'تغطيتك %', 'الكلمات المقترحة', 'الفرصة']);
    for (const gap of report.serpAnalysis.contentGaps) {
      rows.push([
        gap.topic,
        gap.competitorCoverage.toString(),
        gap.yourCoverage.toString(),
        gap.suggestedWordCount.toString(),
        gap.opportunity
      ]);
    }
  }
  
  // Build CSV string with BOM for Arabic support
  const BOM = '\uFEFF';
  const csvContent = BOM + rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `competitor-report-${report.keyword}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ===== PDF EXPORT =====
export function exportToPDF(report: FullCompetitorReport) {
  const intentLabel = (i: string) => i === 'informational' ? 'معلوماتي' : i === 'commercial' ? 'تجاري' : i === 'transactional' ? 'شرائي' : 'تنقلي';
  const oppLabel = (o: string) => o === 'high' ? 'عالية' : o === 'medium' ? 'متوسطة' : 'منخفضة';
  
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Cairo', sans-serif; background: #fff; color: #1a1a2e; padding: 40px; font-size: 13px; line-height: 1.7; }
  h1 { font-size: 28px; font-weight: 900; color: #1e40af; margin-bottom: 4px; }
  h2 { font-size: 18px; font-weight: 700; color: #1e3a5f; margin: 30px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb; }
  h3 { font-size: 14px; font-weight: 600; color: #374151; margin: 16px 0 8px; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
  .stats { display: flex; gap: 16px; margin: 20px 0; }
  .stat { flex: 1; background: #f0f4ff; border-radius: 10px; padding: 14px; text-align: center; }
  .stat-value { font-size: 24px; font-weight: 900; color: #1e40af; }
  .stat-label { font-size: 11px; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 20px; font-size: 12px; }
  th { background: #f8fafc; color: #374151; font-weight: 600; padding: 8px 10px; text-align: right; border-bottom: 2px solid #e5e7eb; }
  td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; }
  tr:hover { background: #fafbfc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .badge-high { background: #dcfce7; color: #166534; }
  .badge-medium { background: #fef3c7; color: #92400e; }
  .badge-low { background: #f3f4f6; color: #6b7280; }
  .badge-i { background: #dbeafe; color: #1d4ed8; }
  .badge-c { background: #fef3c7; color: #b45309; }
  .badge-t { background: #dcfce7; color: #166534; }
  .badge-n { background: #f3e8ff; color: #7c3aed; }
  .page-break { page-break-before: always; }
  .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; }
</style>
</head>
<body>

<h1>📊 تقرير تحليل المنافسين</h1>
<p class="subtitle">الكلمة المفتاحية: <strong>${report.keyword}</strong> — ${new Date(report.timestamp).toLocaleDateString('ar-SA')}</p>

<div class="stats">
  <div class="stat"><div class="stat-value">${report.marketOverview.keywordDifficulty}</div><div class="stat-label">صعوبة الكلمة</div></div>
  <div class="stat"><div class="stat-value">${report.marketOverview.avgDomainAuthority}</div><div class="stat-label">متوسط DA</div></div>
  <div class="stat"><div class="stat-value">${report.marketOverview.avgContentLength}</div><div class="stat-label">متوسط المحتوى</div></div>
  <div class="stat"><div class="stat-value">${report.serpAnalysis.competitors.length}</div><div class="stat-label">عدد المنافسين</div></div>
</div>

<h2>🏆 المنافسون</h2>
<table>
  <tr><th>النطاق</th><th>DA</th><th>الزيارات</th><th>المحتوى</th><th>الكلمات</th><th>الروابط</th><th>SSL</th><th>Schema</th></tr>
  ${report.serpAnalysis.competitors.map(c => `<tr><td><strong>${c.domain}</strong></td><td>${c.domainAuthority}</td><td>${c.organicTraffic}</td><td>${c.contentScore}/100</td><td>${c.wordCount}</td><td>${c.backlinks}</td><td>${c.hasSSL ? '✅' : '❌'}</td><td>${c.hasSchema ? '✅' : '❌'}</td></tr>`).join('')}
</table>

${report.serpAnalysis.competitors.map(c => `
<h3>🔑 كلمات ${c.domain} (${c.topKeywords.length} كلمة)</h3>
<table>
  <tr><th>الكلمة</th><th>النية</th><th>#</th><th>الحجم</th><th>CPC</th><th>الصعوبة</th></tr>
  ${c.topKeywords.slice(0, 20).map(kw => `<tr><td>${kw.keyword}</td><td><span class="badge badge-${kw.intent[0]}">${intentLabel(kw.intent)}</span></td><td>${kw.position}</td><td>${kw.volume}</td><td>${kw.cpc}</td><td>${kw.difficulty}</td></tr>`).join('')}
</table>
`).join('')}

<div class="page-break"></div>

<h2>🎯 فجوات الكلمات المفتاحية</h2>
<table>
  <tr><th>الكلمة</th><th>النية</th><th>مركزك</th><th>المنافس</th><th>الحجم</th><th>CPC</th><th>الفرصة</th></tr>
  ${report.serpAnalysis.keywordGaps.map(g => `<tr><td>${g.keyword}</td><td><span class="badge badge-${g.intent[0]}">${intentLabel(g.intent)}</span></td><td>${g.yourPosition || 'غير مصنف'}</td><td>#${g.competitorPosition}</td><td>${g.volume}</td><td>${g.cpc}</td><td><span class="badge badge-${g.opportunity}">${oppLabel(g.opportunity)}</span></td></tr>`).join('')}
</table>

<h2>📝 فجوات المحتوى</h2>
<table>
  <tr><th>الموضوع</th><th>تغطية المنافس</th><th>تغطيتك</th><th>الكلمات المقترحة</th><th>الفرصة</th></tr>
  ${report.serpAnalysis.contentGaps.map(g => `<tr><td>${g.topic}</td><td>${g.competitorCoverage}%</td><td>${g.yourCoverage}%</td><td>${g.suggestedWordCount}</td><td><span class="badge badge-${g.opportunity}">${oppLabel(g.opportunity)}</span></td></tr>`).join('')}
</table>

${report.actionPlan.length > 0 ? `
<h2>⚡ خطة العمل</h2>
<table>
  <tr><th>الأولوية</th><th>الإجراء</th><th>التأثير المتوقع</th><th>الصعوبة</th><th>الوقت</th></tr>
  ${report.actionPlan.map(a => `<tr><td><span class="badge badge-${a.priority}">${a.priority === 'high' ? 'عالية' : a.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</span></td><td>${a.action}</td><td>${a.expectedImpact}</td><td>${a.difficulty === 'easy' ? 'سهل' : a.difficulty === 'medium' ? 'متوسط' : 'صعب'}</td><td>${a.timeEstimate}</td></tr>`).join('')}
</table>
` : ''}

<div class="footer">تم إنشاء هذا التقرير بواسطة SEO Pro — منصة تحسين محركات البحث والمحتوى</div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}
