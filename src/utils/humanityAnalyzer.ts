/**
 * تحليل إنسانية المحتوى - AI Content Humanizer
 * يكتشف علامات المحتوى المكتوب بالذكاء الاصطناعي
 * ويقدم اقتراحات لجعله أكثر إنسانية
 */

// ===== TYPES =====

export interface HumanityFactor {
    id: string;
    name: string;
    nameEn: string;
    score: number; // 0-100
    weight: number; // importance weight
    status: 'human' | 'mixed' | 'ai';
    message: string;
    suggestion?: string;
}

export interface HumanityAnalysisResult {
    humanScore: number; // 0-100 (higher = more human)
    aiScore: number; // 0-100 (higher = more AI-like)
    grade: 'إنساني' | 'طبيعي' | 'مختلط' | 'آلي' | 'روبوتي';
    gradeEmoji: string;
    gradeColor: 'emerald' | 'green' | 'amber' | 'orange' | 'red';
    factors: HumanityFactor[];
    suggestions: string[];
    quickFixes: string[];
}

// ===== ARABIC LANGUAGE PATTERNS =====

// Emotional words and phrases (Arabic)
const EMOTIONAL_WORDS = [
    'صراحة', 'والله', 'بصراحة', 'الحقيقة', 'عجبني', 'انبهرت', 'رائع',
    'مذهل', 'خرافي', 'جنان', 'رهيب', 'فظيع', 'حلو', 'جميل جداً',
    'ما توقعت', 'فاجأني', 'حسيت', 'شعرت', 'أحسست', 'ابتسمت',
    'ضحكت', 'فرحت', 'زعلت', 'قلقت', 'اطمنيت', 'ارتحت',
    'ما صدقت', 'استغربت', 'تفاجأت', 'أعجبني', 'كرهت', 'حبيت'
];

// Personal pronouns and direct address (Arabic)
const PERSONAL_PRONOUNS = [
    'أنا', 'أنت', 'أنتِ', 'إنت', 'انت', 'انتي', 'نحن', 'إحنا', 'احنا',
    'بتقدر', 'تقدر', 'بتحتاج', 'تحتاج', 'راح تلاحظ', 'بتلاحظ', 'هتلاحظ',
    'جربت', 'جربته', 'استخدمت', 'استخدمته', 'شفت', 'شفته', 'لقيت',
    'عندي', 'عندك', 'معي', 'معك', 'لي', 'لك', 'خذيت', 'أخذت'
];

// Local/regional context markers (Saudi/Gulf)
const LOCAL_CONTEXT = [
    'السعودية', 'الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الخبر',
    'الشرقية', 'القصيم', 'عسير', 'الإمارات', 'دبي', 'الكويت', 'قطر', 'البحرين',
    'الخليج', 'الخليجي', 'السعودي', 'صيف الرياض', 'شتاء السعودية',
    'رمضان', 'العيد', 'الجمعة البيضاء', 'اليوم الوطني', 'موسم الرياض',
    'توصيل سريع', 'يوصلك', 'شحن مجاني', 'داخل المملكة'
];

// Imperfection/honesty markers
const IMPERFECTION_MARKERS = [
    'العيب', 'السلبية', 'الملاحظة', 'بس', 'لكن', 'إلا إن', 'المشكلة',
    'ياليت', 'كان ودي', 'أتمنى لو', 'ينقصه', 'يحتاج تحسين',
    'مو مثالي', 'مش مثالي', 'فيه نقطة', 'الشي الوحيد', 'للأمانة',
    'بكل صراحة', 'ما أبي أكذب', 'لازم أقول'
];

// Colloquial/informal expressions
const COLLOQUIALISMS = [
    'يعني', 'زي', 'كذا', 'وش', 'ليش', 'عشان', 'علشان', 'معليش',
    'إيه', 'أيوه', 'لا وربي', 'والله العظيم', 'بالذمة', 'يلا',
    'خلاص', 'طيب', 'أوكي', 'تمام', 'حلو', 'زين', 'كويس',
    'شي', 'شوي', 'كتير', 'مرة', 'وايد', 'هالشي', 'ذا الشي'
];

// Opinion markers
const OPINION_MARKERS = [
    'من وجهة نظري', 'شخصياً', 'أشوف إن', 'اعتقد', 'أظن', 'حسب رأيي',
    'بالنسبة لي', 'من تجربتي', 'على حسب', 'أحس إن', 'حاسس',
    'متأكد', 'واثق', 'أفضل', 'أحب', 'ما أحب', 'أكره'
];

// AI-typical transition phrases (to detect)
const AI_TRANSITIONS = [
    'علاوة على ذلك', 'بالإضافة إلى ذلك', 'فضلاً عن ذلك', 'من ناحية أخرى',
    'في السياق ذاته', 'تجدر الإشارة', 'من الجدير بالذكر', 'لا بد من القول',
    'يتضح مما سبق', 'استناداً إلى ما تقدم', 'في ضوء ما سبق',
    'ختاماً', 'في الختام', 'وفي النهاية', 'إجمالاً'
];

// Human-like transitions
const HUMAN_TRANSITIONS = [
    'وبعدين', 'والأحلى', 'وانتبه', 'والمفاجأة', 'وتخيل', 'وعلى فكرة',
    'بس انتظر', 'والأهم', 'ومش بس كذا', 'وفوق هذا', 'وكمان',
    'طيب خليني أقولك', 'بقولك شي', 'اسمع', 'شوف'
];

// Rhetorical question starters
const QUESTION_STARTERS = [
    'تعرف', 'تدري', 'عارف', 'هل', 'وش تتوقع', 'ايش تحس', 'ليش',
    'كيف', 'متى', 'وين', 'شو رأيك', 'ما تشوف', 'ألا ترى',
    'مو كذا', 'صح', 'ولا لا', 'ما قلتلك'
];

// ===== HELPER FUNCTIONS =====

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function getSentences(text: string): string[] {
    return text.split(/[.!?؟،؛]+/).filter(s => s.trim().length > 0);
}

function countPatternMatches(text: string, patterns: string[]): number {
    const textLower = text.toLowerCase();
    return patterns.filter(pattern => textLower.includes(pattern.toLowerCase())).length;
}

function hasPattern(text: string, patterns: string[]): boolean {
    return countPatternMatches(text, patterns) > 0;
}

function calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(avgSquaredDiff);
}

// ===== INDIVIDUAL FACTOR ANALYZERS =====

/**
 * 1. تحليل تنوع أطوال الجمل
 * AI tends to write uniform sentence lengths
 */
function analyzeSentenceVariance(text: string): HumanityFactor {
    const sentences = getSentences(text);
    const lengths = sentences.map(s => countWords(s));

    if (lengths.length < 3) {
        return {
            id: 'sentence-variance',
            name: 'تنوع الجمل',
            nameEn: 'Sentence Variance',
            score: 50,
            weight: 15,
            status: 'mixed',
            message: 'محتوى قصير جداً للتحليل',
        };
    }

    const stdDev = calculateStandardDeviation(lengths);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const coefficientOfVariation = (stdDev / avgLength) * 100;

    // High CV = more human-like variation
    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (coefficientOfVariation > 50) {
        score = 95;
        status = 'human';
        message = 'تنوع ممتاز في أطوال الجمل ✓';
    } else if (coefficientOfVariation > 35) {
        score = 75;
        status = 'human';
        message = 'تنوع جيد في الجمل';
    } else if (coefficientOfVariation > 20) {
        score = 50;
        status = 'mixed';
        message = 'تنوع متوسط - جمل متشابهة الطول';
        suggestion = 'نوّع في أطوال الجمل - أضف جمل قصيرة جداً وأخرى طويلة';
    } else {
        score = 20;
        status = 'ai';
        message = 'جمل متساوية الطول (علامة AI)';
        suggestion = 'كسّر النمط بجمل مثل: "رائع!" أو "وتخيل الباقي..."';
    }

    return {
        id: 'sentence-variance',
        name: 'تنوع الجمل',
        nameEn: 'Sentence Variance',
        score,
        weight: 15,
        status,
        message,
        suggestion
    };
}

/**
 * 2. تحليل اللغة العاطفية
 */
function analyzeEmotionalLanguage(text: string): HumanityFactor {
    const wordCount = countWords(text);
    const emotionalCount = countPatternMatches(text, EMOTIONAL_WORDS);
    const density = (emotionalCount / wordCount) * 100;

    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (emotionalCount >= 5 || density > 2) {
        score = 95;
        status = 'human';
        message = `تعبيرات عاطفية غنية (${emotionalCount} تعبير) ✓`;
    } else if (emotionalCount >= 3 || density > 1) {
        score = 70;
        status = 'human';
        message = `لغة عاطفية جيدة (${emotionalCount} تعبير)`;
    } else if (emotionalCount >= 1) {
        score = 45;
        status = 'mixed';
        message = `لغة عاطفية محدودة (${emotionalCount} تعبير)`;
        suggestion = 'أضف تعبيرات مثل: "صراحة عجبني" أو "انبهرت من..."';
    } else {
        score = 15;
        status = 'ai';
        message = 'لا يوجد تعبيرات عاطفية (علامة AI)';
        suggestion = 'ابدأ جملة بـ "والله" أو "صراحة" أو "الحقيقة..."';
    }

    return {
        id: 'emotional-language',
        name: 'اللغة العاطفية',
        nameEn: 'Emotional Language',
        score,
        weight: 15,
        status,
        message,
        suggestion
    };
}

/**
 * 3. تحليل الضمائر الشخصية
 */
function analyzePersonalPronouns(text: string): HumanityFactor {
    const wordCount = countWords(text);
    const pronounCount = countPatternMatches(text, PERSONAL_PRONOUNS);
    const density = (pronounCount / wordCount) * 100;

    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (pronounCount >= 6 || density > 3) {
        score = 95;
        status = 'human';
        message = `مخاطبة شخصية ممتازة (${pronounCount} ضمير) ✓`;
    } else if (pronounCount >= 3 || density > 1.5) {
        score = 70;
        status = 'human';
        message = `مخاطبة شخصية جيدة (${pronounCount} ضمير)`;
    } else if (pronounCount >= 1) {
        score = 40;
        status = 'mixed';
        message = `مخاطبة شخصية ضعيفة (${pronounCount} ضمير)`;
        suggestion = 'استخدم "أنت/بتقدر/راح تلاحظ" بدل الأسلوب المبني للمجهول';
    } else {
        score = 10;
        status = 'ai';
        message = 'لا يوجد مخاطبة شخصية (علامة AI)';
        suggestion = 'غيّر "يمكن استخدامه" إلى "تقدر تستخدمه"';
    }

    return {
        id: 'personal-pronouns',
        name: 'الضمائر الشخصية',
        nameEn: 'Personal Pronouns',
        score,
        weight: 12,
        status,
        message,
        suggestion
    };
}

/**
 * 4. تحليل السياق المحلي
 */
function analyzeLocalContext(text: string): HumanityFactor {
    const localCount = countPatternMatches(text, LOCAL_CONTEXT);

    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (localCount >= 3) {
        score = 95;
        status = 'human';
        message = `سياق محلي غني (${localCount} إشارة) ✓`;
    } else if (localCount >= 2) {
        score = 75;
        status = 'human';
        message = `سياق محلي جيد (${localCount} إشارة)`;
    } else if (localCount >= 1) {
        score = 50;
        status = 'mixed';
        message = `سياق محلي محدود (${localCount} إشارة)`;
        suggestion = 'أضف إشارات مثل: "مثالي لصيف الرياض" أو "يوصلك خلال يومين"';
    } else {
        score = 25;
        status = 'ai';
        message = 'لا يوجد سياق محلي';
        suggestion = 'اربط المنتج بالمناسبات: رمضان، العيد، شتاء السعودية';
    }

    return {
        id: 'local-context',
        name: 'السياق المحلي',
        nameEn: 'Local Context',
        score,
        weight: 8,
        status,
        message,
        suggestion
    };
}

/**
 * 5. تحليل علامات عدم المثالية (الصدق)
 */
function analyzeImperfections(text: string): HumanityFactor {
    const imperfectionCount = countPatternMatches(text, IMPERFECTION_MARKERS);

    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (imperfectionCount >= 2) {
        score = 95;
        status = 'human';
        message = `صدق ومصداقية عالية (${imperfectionCount} إشارة) ✓`;
    } else if (imperfectionCount >= 1) {
        score = 70;
        status = 'human';
        message = 'يوجد ذكر للعيوب (مصداقية)';
    } else {
        score = 30;
        status = 'ai';
        message = 'كل شيء إيجابي 100% (علامة AI)';
        suggestion = 'اذكر عيب بسيط: "العيب الوحيد..." أو "ياليت لو كان..."';
    }

    return {
        id: 'imperfections',
        name: 'المصداقية',
        nameEn: 'Imperfections',
        score,
        weight: 10,
        status,
        message,
        suggestion
    };
}

/**
 * 6. تحليل العبارات العامية
 */
function analyzeColloquialisms(text: string): HumanityFactor {
    const wordCount = countWords(text);
    const colloquialCount = countPatternMatches(text, COLLOQUIALISMS);
    const density = (colloquialCount / wordCount) * 100;

    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (colloquialCount >= 5 || density > 2) {
        score = 95;
        status = 'human';
        message = `أسلوب عامي طبيعي (${colloquialCount} عبارة) ✓`;
    } else if (colloquialCount >= 3 || density > 1) {
        score = 70;
        status = 'human';
        message = `بعض العبارات العامية (${colloquialCount})`;
    } else if (colloquialCount >= 1) {
        score = 45;
        status = 'mixed';
        message = `عبارات عامية قليلة (${colloquialCount})`;
        suggestion = 'أضف: "يعني"، "زي كذا"، "شوي"، "مرة حلو"';
    } else {
        score = 15;
        status = 'ai';
        message = 'أسلوب رسمي جداً (علامة AI)';
        suggestion = 'خفف الرسمية - استخدم لغة يومية طبيعية';
    }

    return {
        id: 'colloquialisms',
        name: 'العبارات العامية',
        nameEn: 'Colloquialisms',
        score,
        weight: 10,
        status,
        message,
        suggestion
    };
}

/**
 * 7. تحليل الأسئلة البلاغية
 */
function analyzeRhetoricalQuestions(text: string): HumanityFactor {
    const questionMarks = (text.match(/[?؟]/g) || []).length;
    const hasQuestionStarters = hasPattern(text, QUESTION_STARTERS);

    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (questionMarks >= 3 || (questionMarks >= 2 && hasQuestionStarters)) {
        score = 95;
        status = 'human';
        message = `تفاعل ممتاز مع القارئ (${questionMarks} سؤال) ✓`;
    } else if (questionMarks >= 1) {
        score = 65;
        status = 'human';
        message = `يوجد تفاعل (${questionMarks} سؤال)`;
    } else {
        score = 25;
        status = 'ai';
        message = 'لا يوجد أسئلة تفاعلية';
        suggestion = 'أضف: "تعرف ليش؟" أو "وش تتوقع يصير؟" أو "مو كذا؟"';
    }

    return {
        id: 'rhetorical-questions',
        name: 'الأسئلة التفاعلية',
        nameEn: 'Rhetorical Questions',
        score,
        weight: 8,
        status,
        message,
        suggestion
    };
}

/**
 * 8. تحليل علامات الرأي
 */
function analyzeOpinionMarkers(text: string): HumanityFactor {
    const opinionCount = countPatternMatches(text, OPINION_MARKERS);

    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (opinionCount >= 3) {
        score = 95;
        status = 'human';
        message = `آراء شخصية واضحة (${opinionCount}) ✓`;
    } else if (opinionCount >= 2) {
        score = 75;
        status = 'human';
        message = `بعض الآراء الشخصية (${opinionCount})`;
    } else if (opinionCount >= 1) {
        score = 50;
        status = 'mixed';
        message = `رأي شخصي محدود (${opinionCount})`;
        suggestion = 'أضف: "شخصياً أشوف" أو "من وجهة نظري" أو "بالنسبة لي"';
    } else {
        score = 20;
        status = 'ai';
        message = 'لا يوجد آراء شخصية';
        suggestion = 'عبّر عن رأيك: "أنا أفضل..." أو "اللي عجبني..."';
    }

    return {
        id: 'opinion-markers',
        name: 'علامات الرأي',
        nameEn: 'Opinion Markers',
        score,
        weight: 10,
        status,
        message,
        suggestion
    };
}

/**
 * 9. تحليل تنوع الانتقالات
 */
function analyzeTransitionVariety(text: string): HumanityFactor {
    const aiTransitionCount = countPatternMatches(text, AI_TRANSITIONS);
    const humanTransitionCount = countPatternMatches(text, HUMAN_TRANSITIONS);

    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (humanTransitionCount >= 3 && aiTransitionCount <= 1) {
        score = 95;
        status = 'human';
        message = 'انتقالات طبيعية ومتنوعة ✓';
    } else if (humanTransitionCount > aiTransitionCount) {
        score = 70;
        status = 'human';
        message = 'انتقالات جيدة';
    } else if (humanTransitionCount === aiTransitionCount) {
        score = 50;
        status = 'mixed';
        message = 'مزيج من الانتقالات';
        suggestion = 'قلل من "علاوة على ذلك" و"بالإضافة"، استخدم "وكمان" و"والأحلى"';
    } else {
        score = 20;
        status = 'ai';
        message = 'انتقالات رسمية نمطية (علامة AI)';
        suggestion = 'غيّر "بالإضافة إلى ذلك" إلى "وبعدين تخيل..." أو "والمفاجأة..."';
    }

    return {
        id: 'transition-variety',
        name: 'تنوع الانتقالات',
        nameEn: 'Transition Variety',
        score,
        weight: 7,
        status,
        message,
        suggestion
    };
}

/**
 * 10. تحليل القصص والتجارب
 */
function analyzeAnecdotes(text: string): HumanityFactor {
    const storyIndicators = [
        'أول مرة', 'لما', 'من يوم', 'قبل كذا', 'في مرة', 'حصلي',
        'صار لي', 'جربت', 'استخدمت', 'اشتريت', 'طلبت',
        'كنت', 'رحت', 'سافرت', 'في الرحلة', 'في البر', 'في البيت'
    ];

    const anecdoteCount = countPatternMatches(text, storyIndicators);

    let score: number;
    let status: 'human' | 'mixed' | 'ai';
    let message: string;
    let suggestion: string | undefined;

    if (anecdoteCount >= 3) {
        score = 95;
        status = 'human';
        message = `قصص وتجارب شخصية غنية (${anecdoteCount}) ✓`;
    } else if (anecdoteCount >= 2) {
        score = 75;
        status = 'human';
        message = `بعض التجارب الشخصية (${anecdoteCount})`;
    } else if (anecdoteCount >= 1) {
        score = 50;
        status = 'mixed';
        message = `تجربة واحدة مذكورة (${anecdoteCount})`;
        suggestion = 'أضف قصة قصيرة: "أول مرة جربته كانت في..."';
    } else {
        score = 20;
        status = 'ai';
        message = 'لا يوجد قصص أو تجارب شخصية';
        suggestion = 'اكتب تجربة: "لما استخدمته لأول مرة، حسيت إن..."';
    }

    return {
        id: 'anecdotes',
        name: 'القصص والتجارب',
        nameEn: 'Anecdotes',
        score,
        weight: 5,
        status,
        message,
        suggestion
    };
}

// ===== GRADE CALCULATOR =====

function calculateGrade(humanScore: number): {
    grade: HumanityAnalysisResult['grade'];
    emoji: string;
    color: HumanityAnalysisResult['gradeColor'];
} {
    if (humanScore >= 80) {
        return { grade: 'إنساني', emoji: '😊', color: 'emerald' };
    } else if (humanScore >= 65) {
        return { grade: 'طبيعي', emoji: '🙂', color: 'green' };
    } else if (humanScore >= 45) {
        return { grade: 'مختلط', emoji: '😐', color: 'amber' };
    } else if (humanScore >= 25) {
        return { grade: 'آلي', emoji: '🤖', color: 'orange' };
    } else {
        return { grade: 'روبوتي', emoji: '⚠️', color: 'red' };
    }
}

// ===== MAIN ANALYZER =====

export function analyzeHumanity(text: string): HumanityAnalysisResult {
    if (!text || text.trim().length < 50) {
        return {
            humanScore: 0,
            aiScore: 100,
            grade: 'روبوتي',
            gradeEmoji: '⚠️',
            gradeColor: 'red',
            factors: [],
            suggestions: ['أضف محتوى كافٍ للتحليل (50+ حرف)'],
            quickFixes: []
        };
    }

    // Run all analyzers
    const factors: HumanityFactor[] = [
        analyzeSentenceVariance(text),
        analyzeEmotionalLanguage(text),
        analyzePersonalPronouns(text),
        analyzeLocalContext(text),
        analyzeImperfections(text),
        analyzeColloquialisms(text),
        analyzeRhetoricalQuestions(text),
        analyzeOpinionMarkers(text),
        analyzeTransitionVariety(text),
        analyzeAnecdotes(text),
    ];

    // Calculate weighted average
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedSum = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);
    const humanScore = Math.round(weightedSum / totalWeight);
    const aiScore = 100 - humanScore;

    // Get grade
    const { grade, emoji, color } = calculateGrade(humanScore);

    // Collect suggestions from failing factors
    const suggestions = factors
        .filter(f => f.status === 'ai' && f.suggestion)
        .map(f => f.suggestion!)
        .slice(0, 5);

    // Quick fixes (highest impact)
    const quickFixes = factors
        .filter(f => f.status === 'ai' || f.status === 'mixed')
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map(f => f.suggestion)
        .filter(Boolean) as string[];

    return {
        humanScore,
        aiScore,
        grade,
        gradeEmoji: emoji,
        gradeColor: color,
        factors,
        suggestions,
        quickFixes
    };
}

// ===== HUMANIZE PROMPT GENERATOR =====

export function generateHumanizePrompt(originalContent: string): string {
    return `أنت خبير SEO متخصص في كتابة محتوى المنتجات للمتاجر الإلكترونية السعودية.

🎯 **المهمة:** تحسين المحتوى ليكون:
1. احترافي ومناسب لصفحات المنتجات (ليس السوشيال ميديا)
2. إنساني بشكل طبيعي ومتوازن
3. محسّن للـ SEO والتحويل (Conversion)

═══════════════════════════════════════
🔴 **قواعد إلزامية للصفحات التجارية:**
═══════════════════════════════════════

**1. المقدمة (أول 100 كلمة):**
- ❌ لا تبدأ بـ "يا هلا" أو "زمان عن" أو أي تحية عامية
- ✅ ابدأ بسؤال يحدد الحاجة: "تبحثين عن...؟"
- ✅ اذكر: ما المنتج؟ لمن؟ لماذا أشتريه؟
- ✅ اذكر الكلمة المفتاحية في أول 50 حرف

**2. التعليقات الشخصية:**
- ❌ احذف: "صراحة عجبني"، "بالنسبة لي"، "هذي أهم ميزة عندي"
- ❌ احذف التعليقات بين النجوم (*) داخل المميزات
- ✅ بدلاً منها: أضف فوائد واضحة للعميل

**3. العيوب والنواقص:**
- 🚫🚫🚫 **ممنوع تماماً** ذكر أي عيب في المنتج
- ❌ "ياليت لو فيه..."
- ❌ "العيب الوحيد..."
- ❌ "ينقصه..."
- 📌 صفحة المنتج = بيع، ليس مراجعة صادقة

**4. اللهجة:**
- ✅ عامية خفيفة ومقبولة: "يعني"، "تقدرين"، "بكل سهولة"
- ❌ عامية ثقيلة: "وش رايكم"، "مرة حلو"، "والله"، "صح؟"
- 📌 متوازنة بين الاحترافية والود

**5. الخاتمة (CTA):**
- ❌ "وش رايكم؟"، "ناوين تجيبونه؟" (ضعيف للتحويل)
- ✅ CTA قوي ومباشر:
  "اطلبي الآن واستمتعي بابتسامة طفلتك ✨"
  "أضيفيه للسلة الآن – التوصيل سريع داخل المملكة"

**6. تنوع الكلمات المفتاحية:**
إذا كانت الكلمة الأساسية "مكياج اطفال"، وزّع هذه الصيغ:
- مكياج أطفال آمن
- مكياج أطفال ديزني
- مكياج بنات
- مكياج أطفال قابل للغسل
- مكياج أطفال أصلي

**7. الأسئلة الشائعة (FAQ):**
- ✅ اللهجة الرسمية المبسطة
- ❌ "يعني شوي على يدها وشوفي"
- ✅ "يُفضّل اختبار بسيط على اليد قبل الاستخدام"

═══════════════════════════════════════
📌 **ملخص التوازن المطلوب:**
═══════════════════════════════════════
| العنصر | ممنوع ❌ | مطلوب ✅ |
|--------|---------|---------|
| المقدمة | تحية عامية | سؤال + فائدة |
| المميزات | تعليق شخصي | فائدة للعميل |
| العيوب | ذكر أي نقص | لا شيء |
| اللهجة | ثقيلة جداً | خفيفة احترافية |
| الخاتمة | سؤال | CTA مباشر |

═══════════════════════════════════════

**المحتوى الأصلي:**
\`\`\`
${originalContent}
\`\`\`

**اكتب المحتوى المُحسَّن بنفس الهيكل (## و --- و النقاط):**`;
}
