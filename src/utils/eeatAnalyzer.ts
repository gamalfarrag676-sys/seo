export interface EEATFactor {
  id: string;
  category: 'experience' | 'expertise' | 'authoritativeness' | 'trustworthiness';
  categoryLabel: string;
  name: string;
  score: number;
  weight: number;
  status: 'strong' | 'moderate' | 'weak';
  message: string;
  suggestion?: string;
}

export interface EEATAnalysisResult {
  overallScore: number;
  grade: 'ممتاز' | 'جيد' | 'متوسط' | 'ضعيف';
  gradeColor: 'emerald' | 'amber' | 'red';
  categories: {
    experience: { score: number; max: number };
    expertise: { score: number; max: number };
    authoritativeness: { score: number; max: number };
    trustworthiness: { score: number; max: number };
  };
  factors: EEATFactor[];
  suggestions: string[];
}

export function analyzeEEAT(text: string): EEATAnalysisResult {
  if (!text) {
    return {
      overallScore: 0,
      grade: 'ضعيف',
      gradeColor: 'red',
      categories: {
        experience: { score: 0, max: 25 },
        expertise: { score: 0, max: 25 },
        authoritativeness: { score: 0, max: 25 },
        trustworthiness: { score: 0, max: 25 },
      },
      factors: [],
      suggestions: ['أضف محتوى ليتم تقييمه']
    };
  }

  const factors: EEATFactor[] = [];
  const suggestions: string[] = [];

  const getStatus = (score: number, max: number): EEATFactor['status'] => {
    const percent = (score / max) * 100;
    if (percent >= 75) return 'strong';
    if (percent >= 40) return 'moderate';
    return 'weak';
  };

  // --- Experience (التجربة) Max: 25 ---
  let expScore = 0;
  
  // 1. Personal usage
  const personalRegex = /(جربت|استخدمت|تجربتي|شخصياً|أول مرة|لاحظت|استعمال)/g;
  const personalMatches = (text.match(personalRegex) || []).length;
  const personalPts = Math.min(personalMatches * 5, 15);
  expScore += personalPts;
  factors.push({
    id: 'exp-personal',
    category: 'experience',
    categoryLabel: 'التجربة',
    name: 'التجارب الشخصية والاستخدام',
    score: personalPts,
    weight: 15,
    status: getStatus(personalPts, 15),
    message: personalMatches > 0 ? `وجدنا ${personalMatches} إشارات لتجربة شخصية.` : 'لا يوجد ذكر لتجربة استخدام حقيقية للمنتج.',
    suggestion: personalPts === 0 ? 'أضف فقرة تبدأ بـ "من خلال تجربتي" أو "عندما استخدمت".' : undefined
  });

  // 2. Scenarios / Time
  const scenarioRegex = /(في البيت|السفر|المكتب|العمل|الخارج|بعد أسبوع|خلال شهر|بمرور الوقت)/g;
  const scenarioMatches = (text.match(scenarioRegex) || []).length;
  const scenarioPts = Math.min(scenarioMatches * 5, 10);
  expScore += scenarioPts;
  factors.push({
    id: 'exp-scenarios',
    category: 'experience',
    categoryLabel: 'التجربة',
    name: 'سيناريوهات الاستخدام والزمن',
    score: scenarioPts,
    weight: 10,
    status: getStatus(scenarioPts, 10),
    message: scenarioMatches > 0 ? 'تم ذكر سيناريوهات استخدام واضحة أو فترات زمنية.' : 'يفتقر لأمثلة حية على الاستخدام أو الزمن.',
    suggestion: scenarioPts === 0 ? 'اذكر أين ومتى وكيف استخدمت المنتج، وكم استغرق من الوقت لظهور النتيجة.' : undefined
  });

  if (expScore < 15) suggestions.push('جوجل تحب "التجربة" (Experience). تحدث كأنك جربت المنتج حقاً وليس مجرد سرد للمواصفات.');

  // --- Expertise (الخبرة) Max: 25 ---
  let expertScore = 0;

  // 1. Technical/Specs
  const techRegex = /(مواصفات|تقنية|مميزات|يتميز بـ|أداء|سعة|معالج|نظام|خامة|تصميم|قوة|فولت|واط|جيجا|ميجا)/g;
  const techMatches = (text.match(techRegex) || []).length;
  const techPts = Math.min(techMatches * 3, 15);
  expertScore += techPts;
  factors.push({
    id: 'expert-tech',
    category: 'expertise',
    categoryLabel: 'الخبرة',
    name: 'التفاصيل التقنية والمواصفات',
    score: techPts,
    weight: 15,
    status: getStatus(techPts, 15),
    message: techMatches > 0 ? 'تم شرح المواصفات أو المميزات التقنية.' : 'يفتقر للتفاصيل العميقة حول مواصفات المنتج.',
    suggestion: techPts < 10 ? 'تعمق في شرح مواصفات المنتج (مثل الخامات، الأبعاد، التقنيات المستخدمة).' : undefined
  });

  // 2. Benefit explanations
  const benefitRegex = /(لأنه|مما|يساعدك|يوفر|يحميك|لتتمكن|بحيث|لضمان)/g;
  const benefitMatches = (text.match(benefitRegex) || []).length;
  const benefitPts = Math.min(benefitMatches * 5, 10);
  expertScore += benefitPts;
  factors.push({
    id: 'expert-benefits',
    category: 'expertise',
    categoryLabel: 'الخبرة',
    name: 'ربط المواصفات بالفوائد',
    score: benefitPts,
    weight: 10,
    status: getStatus(benefitPts, 10),
    message: benefitMatches > 0 ? 'يتم شرح الفوائد المترتبة على المواصفات.' : 'لا يوجد ربط جيد بين الميزة والفائدة للمستخدم.',
    suggestion: benefitPts < 5 ? 'اشرح كل ميزة وكيف تفيد المستخدم ("يتميز بكذا... مما يساعدك على كذا").' : undefined
  });

  if (expertScore < 15) suggestions.push('أظهر خبرتك في مجالك بشرح دقيق للمواصفات وكيف تعمل وكيف تحل مشكلة المستخدم.');

  // --- Authoritativeness (المصداقية/السلطة) Max: 25 ---
  let authScore = 0;

  // 1. Data and sources
  const sourceRegex = /(نسبة|إحصائيات|دراسة|بحوث|دراسات|أثبتت|وفقاً|بحسب|أرقام|تؤكد|دليل)/g;
  const sourceMatches = (text.match(sourceRegex) || []).length;
  const sourcePts = Math.min(sourceMatches * 5, 15);
  authScore += sourcePts;
  factors.push({
    id: 'auth-sources',
    category: 'authoritativeness',
    categoryLabel: 'السلطة',
    name: 'المصادر والبيانات',
    score: sourcePts,
    weight: 15,
    status: getStatus(sourcePts, 15),
    message: sourceMatches > 0 ? 'يستشهد بأرقام أو دراسات أو إحصائيات.' : 'لا يوجد استشهاد بمصادر خارجية أو بيانات وأرقام للتوثيق.',
    suggestion: sourcePts === 0 ? 'ادعم ادعاءاتك بأرقام أو نسبة نجاح أو استشهاد بمصادر معروفة.' : undefined
  });

  // 2. Expert mentions
  const expertRegex = /(ينصح الخبراء|أطباء|متخصصين|طبيب|مهندس|خبير|تقييمات|مراجعات)/g;
  const expertMatches = (text.match(expertRegex) || []).length;
  const expertPts = Math.min(expertMatches * 5, 10);
  authScore += expertPts;
  factors.push({
    id: 'auth-experts',
    category: 'authoritativeness',
    categoryLabel: 'السلطة',
    name: 'توصيات الخبراء',
    score: expertPts,
    weight: 10,
    status: getStatus(expertPts, 10),
    message: expertMatches > 0 ? 'يحتوي على توصيات متخصصين.' : 'يفتقر لتوصيات أصحاب التخصص.',
    suggestion: expertPts === 0 ? 'أضف جملة مثل "ينصح به الخبراء" إذا كانت معلومة صحيحة لزيادة السلطة.' : undefined
  });

  if (authScore < 15) suggestions.push('لزيادة المصداقية، اذكر إحصائيات دقيقة أو استشهد بنصائح المتخصصين في المجال.');

  // --- Trustworthiness (الموثوقية) Max: 25 ---
  let trustScore = 0;

  // 1. Honesty (Cons / Limitations)
  const consRegex = /(العيب|عيبه|الجانب السلبي|ملاحظة|لكن|إلا أن|ينقصه|قد لا يناسب|بالرغم من)/g;
  const consMatches = (text.match(consRegex) || []).length;
  const consPts = Math.min(consMatches * 5, 10);
  trustScore += consPts;
  factors.push({
    id: 'trust-honesty',
    category: 'trustworthiness',
    categoryLabel: 'الموثوقية',
    name: 'الشفافية في العيوب',
    score: consPts,
    weight: 10,
    status: getStatus(consPts, 10),
    message: consMatches > 0 ? 'يعرض قيوداً أو عيوباً مما يعكس الشفافية.' : 'يبدو المحتوى ترويجياً 100% ولا يذكر أي قصور للمنتج.',
    suggestion: consPts === 0 ? 'جوجل يثق بالمحتوى الذي يذكر العيوب بشفافية، أضف قسماً لـ "سلبيات المنتج" أو لمن لا يناسب.' : undefined
  });

  // 2. Assurances (Policies, support)
  const assureRegex = /(ضمان|استرجاع|كفالة|دعم فني|خدمة عملاء|آمن|معتمد|مرخص|توصيل|مجاني|دفع آمن)/g;
  const assureMatches = (text.match(assureRegex) || []).length;
  const assurePts = Math.min(assureMatches * 3, 15);
  trustScore += assurePts;
  factors.push({
    id: 'trust-assure',
    category: 'trustworthiness',
    categoryLabel: 'الموثوقية',
    name: 'الضمانات وخدمة العملاء',
    score: assurePts,
    weight: 15,
    status: getStatus(assurePts, 15),
    message: assureMatches > 0 ? 'يذكر ضمانات الاسترجاع أو خدمات الدعم.' : 'لا يذكر حقوق المشتري كالضمان وسياسات الاسترجاع.',
    suggestion: assurePts < 10 ? 'تحدث عن ضمان المنتج، سياسة الاسترجاع، وخدمات ما بعد البيع لزرع الثقة.' : undefined
  });

  if (trustScore < 15) suggestions.push('لبناء الثقة (Trust)، اذكر سياسات الاسترجاع، الضمان، ولا تخف من ذكر من "لا يناسبه" هذا المنتج.');

  // Calculate Totals
  const overallScore = expScore + expertScore + authScore + trustScore;
  
  let grade: EEATAnalysisResult['grade'] = 'ضعيف';
  let gradeColor: EEATAnalysisResult['gradeColor'] = 'red';

  if (overallScore >= 80) {
    grade = 'ممتاز';
    gradeColor = 'emerald';
  } else if (overallScore >= 60) {
    grade = 'جيد';
    gradeColor = 'emerald';
  } else if (overallScore >= 40) {
    grade = 'متوسط';
    gradeColor = 'amber';
  }

  return {
    overallScore,
    grade,
    gradeColor,
    categories: {
      experience: { score: expScore, max: 25 },
      expertise: { score: expertScore, max: 25 },
      authoritativeness: { score: authScore, max: 25 },
      trustworthiness: { score: trustScore, max: 25 },
    },
    factors,
    suggestions: [...new Set(suggestions)].slice(0, 4)
  };
}
