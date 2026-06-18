export interface GeoFactor {
  id: string;
  name: string;
  score: number; // 0-100
  weight: number;
  status: 'excellent' | 'good' | 'needs-work' | 'poor';
  message: string;
  suggestion?: string;
}

export interface GeoAnalysisResult {
  score: number; // 0-100
  grade: 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف';
  gradeColor: 'emerald' | 'amber' | 'red';
  gradeEmoji: string;
  factors: GeoFactor[];
  suggestions: string[];
}

export function analyzeGeo(text: string, keyword: string): GeoAnalysisResult {
  if (!text) {
    return {
      score: 0,
      grade: 'ضعيف',
      gradeColor: 'red',
      gradeEmoji: '🔻',
      factors: [],
      suggestions: ['أضف محتوى ليتم تقييمه']
    };
  }

  const factors: GeoFactor[] = [];
  const suggestions: string[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  const getStatus = (percent: number): GeoFactor['status'] => {
    if (percent >= 90) return 'excellent';
    if (percent >= 70) return 'good';
    if (percent >= 40) return 'needs-work';
    return 'poor';
  };

  // 1. Direct Answers (Weight: 20)
  const answerRegex = /(هو|هي|يعني|يُعرف بـ|يُعتبر|عبارة عن|تتمثل في)/g;
  const answerMatches = (text.match(answerRegex) || []).length;
  let answerScore = Math.min((answerMatches / 3) * 100, 100);
  factors.push({
    id: 'answers',
    name: 'الإجابات المباشرة',
    score: answerScore,
    weight: 20,
    status: getStatus(answerScore),
    message: answerMatches > 0 ? `تم العثور على ${answerMatches} إجابات مباشرة.` : 'لم يتم العثور على إجابات واضحة ومباشرة.',
    suggestion: answerScore < 70 ? 'أضف تعريفات واضحة للمصطلحات باستخدام "هو/هي" أو "يعتبر".' : undefined
  });
  if (answerScore < 70) suggestions.push('محركات الذكاء الاصطناعي تفضل الإجابات المباشرة. أضف فقرة تبدأ بتعريف صريح للمنتج/الموضوع.');

  // 2. Structured Content (Weight: 18)
  const headingMatches = (text.match(/##/g) || []).length;
  const listMatches = (text.match(/^[-*]\s|\d+\.\s/gm) || []).length;
  let structScore = Math.min(((headingMatches * 10 + listMatches * 5) / 50) * 100, 100);
  factors.push({
    id: 'structure',
    name: 'الهيكلة والبيانات المنظمة',
    score: structScore,
    weight: 18,
    status: getStatus(structScore),
    message: `تم العثور على ${headingMatches} عناوين و ${listMatches} عناصر قائمة.`,
    suggestion: structScore < 70 ? 'استخدم القوائم النقطية والمرقمة والعناوين الفرعية بكثرة.' : undefined
  });
  if (structScore < 70) suggestions.push('قسّم النص الطويل باستخدام قوائم (Bullet points) أو جداول، فهذا يسهل على AI استخراج المعلومات.');

  // 3. FAQ Presence (Weight: 15)
  const faqRegex = /(س:|ج:|سؤال:|جواب:|\?|؟)/g;
  const faqMatches = (text.match(faqRegex) || []).length;
  let faqScore = Math.min((faqMatches / 4) * 100, 100);
  factors.push({
    id: 'faq',
    name: 'الأسئلة الشائعة (FAQ)',
    score: faqScore,
    weight: 15,
    status: getStatus(faqScore),
    message: faqMatches > 0 ? `موجود بشكل جيد (${faqMatches} إشارات).` : 'لا يوجد قسم أسئلة شائعة.',
    suggestion: faqScore < 70 ? 'أضف قسماً للأسئلة الشائعة يجيب على أسئلة المشترين.' : undefined
  });
  if (faqScore < 70) suggestions.push('قم بإضافة قسم "أسئلة شائعة (FAQ)" صريح في نهاية المحتوى لإجابة تساؤلات المستخدمين بشكل مباشر.');

  // 4. Data & Statistics (Weight: 12)
  const dataRegex = /(\d+%|\d+٪|نسبة|إحصائيات|دراسة|جرام|سم|متر|كجم)/g;
  const dataMatches = (text.match(dataRegex) || []).length;
  let dataScore = Math.min((dataMatches / 3) * 100, 100);
  factors.push({
    id: 'data',
    name: 'البيانات والأرقام',
    score: dataScore,
    weight: 12,
    status: getStatus(dataScore),
    message: dataMatches > 0 ? 'المحتوى يحتوي على بيانات وأرقام محددة.' : 'يفتقر للبيانات المحددة والأرقام.',
    suggestion: dataScore < 70 ? 'أضف مواصفات رقمية، نسب مئوية، أو قياسات دقيقة.' : undefined
  });
  if (dataScore < 70) suggestions.push('الذكاء الاصطناعي يحب الأرقام الدقيقة. أضف مقاسات أو نسب أو بيانات كمية بدلاً من الوصف العام.');

  // 5. Concise Paragraphs (Weight: 10)
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const avgLength = paragraphs.length ? paragraphs.reduce((acc, p) => acc + p.split(' ').length, 0) / paragraphs.length : 0;
  let paraScore = 100;
  if (avgLength > 80) paraScore = 30;
  else if (avgLength > 50) paraScore = 70;
  factors.push({
    id: 'paragraphs',
    name: 'الفقرات المختصرة',
    score: paraScore,
    weight: 10,
    status: getStatus(paraScore),
    message: `متوسط طول الفقرة ${Math.round(avgLength)} كلمة.`,
    suggestion: paraScore < 70 ? 'قسّم الفقرات الطويلة لتكون أقل من 50 كلمة لتسهيل الاقتباس.' : undefined
  });

  // 6. Keyword in Context (Weight: 10)
  const kwLower = keyword.toLowerCase();
  const kwInDefinition = text.match(new RegExp(`${kwLower}.{0,30}(هو|هي|يعني|يُعتبر)`, 'i')) || text.match(new RegExp(`(هو|هي|يعني|يُعتبر).{0,30}${kwLower}`, 'i'));
  let kwScore = kwInDefinition ? 100 : 0;
  factors.push({
    id: 'keyword-context',
    name: 'سياق الكلمة المفتاحية',
    score: kwScore,
    weight: 10,
    status: getStatus(kwScore),
    message: kwInDefinition ? 'تم ربط الكلمة المفتاحية بتعريف مباشر.' : 'لم يتم ربط الكلمة المفتاحية بتعريف مباشر صريح.',
    suggestion: kwScore === 0 ? `ضع الكلمة المفتاحية "${keyword}" بجوار كلمة "هو" أو "يعتبر".` : undefined
  });

  // 7. Comparison Markers (Weight: 8)
  const compRegex = /(مقارنة بـ|أفضل من|الفرق بين|يتميز عن|بديل)/g;
  const compMatches = (text.match(compRegex) || []).length;
  let compScore = Math.min((compMatches / 2) * 100, 100);
  factors.push({
    id: 'comparison',
    name: 'المقارنات (Comparisons)',
    score: compScore,
    weight: 8,
    status: getStatus(compScore),
    message: compMatches > 0 ? 'يحتوي على مقارنات مفيدة.' : 'لا يوجد مقارنات مع بدائل أو منافسين.',
    suggestion: compScore < 70 ? 'أضف مقارنة توضح ما يميز المنتج عن البدائل.' : undefined
  });

  // 8. Authoritative Language (Weight: 7)
  const authRegex = /(وفقاً لـ|تشير|يؤكد|خبراء|ينصح|دليل|أثبتت)/g;
  const authMatches = (text.match(authRegex) || []).length;
  let authScore = Math.min((authMatches / 2) * 100, 100);
  factors.push({
    id: 'authoritative',
    name: 'لغة المصداقية',
    score: authScore,
    weight: 7,
    status: getStatus(authScore),
    message: authMatches > 0 ? 'تستخدم لغة موثوقة.' : 'يفتقر لعبارات المصداقية والتوثيق.',
    suggestion: authScore < 70 ? 'استخدم عبارات مثل "ينصح الخبراء" أو "وفقاً للتجارب".' : undefined
  });

  // Calculate final score
  factors.forEach(f => {
    totalScore += (f.score * f.weight);
    totalWeight += f.weight;
  });
  
  const finalScore = Math.round(totalScore / totalWeight);
  
  let grade: GeoAnalysisResult['grade'] = 'ضعيف';
  let gradeColor: GeoAnalysisResult['gradeColor'] = 'red';
  let gradeEmoji = '🔻';

  if (finalScore >= 80) {
    grade = 'ممتاز';
    gradeColor = 'emerald';
    gradeEmoji = '🌟';
  } else if (finalScore >= 60) {
    grade = 'جيد';
    gradeColor = 'emerald';
    gradeEmoji = '👍';
  } else if (finalScore >= 40) {
    grade = 'متوسط';
    gradeColor = 'amber';
    gradeEmoji = '⚠️';
  }

  return {
    score: finalScore,
    grade,
    gradeColor,
    gradeEmoji,
    factors,
    suggestions: [...new Set(suggestions)].slice(0, 4) // Top 4 unique suggestions
  };
}
