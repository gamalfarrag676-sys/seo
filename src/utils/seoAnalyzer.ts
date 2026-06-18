import type { SEOContent } from './gemini';

// ===== TYPES =====

export interface SeoCheckResult {
    id: string;
    category: 'title' | 'content' | 'keywords' | 'readability' | 'technical';
    name: string;
    status: 'pass' | 'warning' | 'fail';
    score: number;
    maxScore: number;
    message: string;
    suggestion?: string;
}

export interface SeoAnalysisResult {
    score: number;
    maxScore: number;
    percentage: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    checks: SeoCheckResult[];
    issues: string[];
    passes: string[];
    summary: {
        title: { score: number; max: number };
        content: { score: number; max: number };
        keywords: { score: number; max: number };
        readability: { score: number; max: number };
        technical: { score: number; max: number };
    };
}

// ===== HELPER FUNCTIONS =====

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function countSentences(text: string): number {
    return text.split(/[.!?؟،]+/).filter(s => s.trim().length > 0).length;
}

function calculateKeywordDensity(text: string, keyword: string): number {
    const words = countWords(text);
    if (words === 0) return 0;
    const keywordLower = keyword.toLowerCase();
    const textLower = text.toLowerCase();
    const matches = (textLower.match(new RegExp(keywordLower, 'g')) || []).length;
    return (matches / words) * 100;
}


function getGrade(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (percentage >= 90) return 'A';
    if (percentage >= 75) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
}

function averageSentenceLength(text: string): number {
    const words = countWords(text);
    const sentences = countSentences(text);
    return sentences > 0 ? Math.round(words / sentences) : 0;
}

function hasPassiveVoice(text: string): boolean {
    // Improved Arabic passive voice check
    // Patterns that are actual passive voice indicators (not just diacritics on regular words)
    // We look for common passive verb patterns: يُفعَل، تُفعَل، أُفعِل
    // Exclude common false positives: مُميز، مُنتج، مُستخدم (these are active participles)
    const passivePatterns = /يُصنَع|تُصنَع|يُستخدَم|تُستخدَم|يُعتبَر|تُعتبَر|يُوصَى|يُنصَح|تُنصَح|يُفضَّل|تُفضَّل/;
    return passivePatterns.test(text);
}

function countParagraphs(text: string): number {
    return text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
}

// ===== MAIN ANALYZER =====

export function analyzeSeo(
    content: SEOContent,
    keyword: string,
    productName?: string
): SeoAnalysisResult {
    const checks: SeoCheckResult[] = [];
    const mainKeyword = keyword?.trim();

    if (!mainKeyword) {
        return {
            score: 0,
            maxScore: 100,
            percentage: 0,
            grade: 'F',
            checks: [],
            issues: ['يرجى إدخال كلمة مفتاحية للبدء في التحليل.'],
            passes: [],
            summary: {
                title: { score: 0, max: 25 },
                content: { score: 0, max: 25 },
                keywords: { score: 0, max: 20 },
                readability: { score: 0, max: 20 },
                technical: { score: 0, max: 10 },
            }
        };
    }

    // ===== 1. TITLE CHECKS (25 points) =====

    // 1.1 Keyword in Title (10 points)
    if (content.h1Title) {
        const titleHasKeyword = content.h1Title.toLowerCase().includes(mainKeyword.toLowerCase());
        checks.push({
            id: 'title-keyword',
            category: 'title',
            name: 'الكلمة المفتاحية في العنوان',
            status: titleHasKeyword ? 'pass' : 'fail',
            score: titleHasKeyword ? 10 : 0,
            maxScore: 10,
            message: titleHasKeyword
                ? 'العنوان يحتوي على الكلمة المفتاحية ✓'
                : `العنوان لا يحتوي على "${mainKeyword}"`,
            suggestion: titleHasKeyword ? undefined : 'أضف الكلمة المفتاحية في بداية العنوان'
        });

        // 1.2 Title Length (10 points)
        const titleLength = content.h1Title.length;
        const titleLengthOk = titleLength >= 30 && titleLength <= 70;
        checks.push({
            id: 'title-length',
            category: 'title',
            name: 'طول العنوان',
            status: titleLengthOk ? 'pass' : (titleLength < 30 ? 'fail' : 'warning'),
            score: titleLengthOk ? 10 : (titleLength >= 20 && titleLength <= 80 ? 5 : 0),
            maxScore: 10,
            message: titleLengthOk
                ? `طول العنوان مثالي (${titleLength} حرف)`
                : `طول العنوان ${titleLength} حرف (المثالي: 30-70)`,
            suggestion: titleLengthOk ? undefined : 'اجعل العنوان بين 30-70 حرف'
        });

        // 1.3 Keyword at Beginning (5 points)
        const keywordAtStart = content.h1Title.toLowerCase().startsWith(mainKeyword.toLowerCase()) ||
            content.h1Title.toLowerCase().indexOf(mainKeyword.toLowerCase()) < 10;
        checks.push({
            id: 'title-keyword-position',
            category: 'title',
            name: 'موقع الكلمة المفتاحية',
            status: keywordAtStart ? 'pass' : 'warning',
            score: keywordAtStart ? 5 : 2,
            maxScore: 5,
            message: keywordAtStart
                ? 'الكلمة المفتاحية في بداية العنوان ✓'
                : 'الكلمة المفتاحية ليست في بداية العنوان',
            suggestion: keywordAtStart ? undefined : 'ضع الكلمة المفتاحية في أول 10 أحرف'
        });
    } else {
        checks.push({
            id: 'title-missing',
            category: 'title',
            name: 'العنوان',
            status: 'fail',
            score: 0,
            maxScore: 25,
            message: 'العنوان مفقود!',
            suggestion: 'أضف عنوان H1 للمحتوى'
        });
    }

    // ===== 2. CONTENT CHECKS (25 points) =====

    if (content.mainContent) {
        const contentText = content.mainContent;
        const wordCount = countWords(contentText);

        // 2.1 Content Length (10 points)
        const lengthOk = wordCount >= 100;
        checks.push({
            id: 'content-length',
            category: 'content',
            name: 'طول المحتوى',
            status: lengthOk ? 'pass' : (wordCount >= 50 ? 'warning' : 'fail'),
            score: lengthOk ? 10 : (wordCount >= 50 ? 5 : 0),
            maxScore: 10,
            message: lengthOk
                ? `محتوى غني (${wordCount} كلمة) ✓`
                : `المحتوى قصير (${wordCount} كلمة)`,
            suggestion: lengthOk ? undefined : 'أضف محتوى أكثر تفصيلاً (100+ كلمة)'
        });

        // 2.2 Keyword in First 150 Characters (8 points)
        // Using 150 chars for Arabic content (Arabic words are shorter on average)
        const first150 = contentText.substring(0, 150).toLowerCase();
        const keywordInIntro = first150.includes(mainKeyword.toLowerCase());
        checks.push({
            id: 'content-keyword-intro',
            category: 'content',
            name: 'الكلمة في المقدمة',
            status: keywordInIntro ? 'pass' : 'fail',
            score: keywordInIntro ? 8 : 0,
            maxScore: 8,
            message: keywordInIntro
                ? 'الكلمة المفتاحية في أول 150 حرف ✓'
                : 'الكلمة المفتاحية غير موجودة في المقدمة',
            suggestion: keywordInIntro ? undefined : 'أضف الكلمة المفتاحية في أول جملة'
        });

        // 2.3 Paragraph Structure (7 points)
        const paragraphs = countParagraphs(contentText);
        const goodStructure = paragraphs >= 3;
        checks.push({
            id: 'content-structure',
            category: 'content',
            name: 'هيكلة المحتوى',
            status: goodStructure ? 'pass' : 'warning',
            score: goodStructure ? 7 : 3,
            maxScore: 7,
            message: goodStructure
                ? `محتوى منظم (${paragraphs} فقرات) ✓`
                : `فقرات قليلة (${paragraphs})`,
            suggestion: goodStructure ? undefined : 'قسّم المحتوى إلى 3+ فقرات'
        });
    } else {
        checks.push({
            id: 'content-missing',
            category: 'content',
            name: 'المحتوى',
            status: 'fail',
            score: 0,
            maxScore: 25,
            message: 'المحتوى الرئيسي مفقود!',
            suggestion: 'أضف وصف تفصيلي للمنتج'
        });
    }

    // ===== 3. KEYWORD CHECKS (20 points) =====

    if (content.mainContent) {
        // 3.1 Keyword Density (10 points)
        const density = calculateKeywordDensity(content.mainContent, mainKeyword);
        const densityIdeal = density >= 1.0 && density <= 2.5;
        const densityAcceptable = density >= 0.5 && density <= 3.0;
        checks.push({
            id: 'keyword-density',
            category: 'keywords',
            name: 'كثافة الكلمة المفتاحية',
            status: densityIdeal ? 'pass' : (densityAcceptable ? 'warning' : 'fail'),
            score: densityIdeal ? 10 : (densityAcceptable ? 6 : (density > 0 ? 3 : 0)),
            maxScore: 10,
            message: densityIdeal
                ? `كثافة مثالية (${density.toFixed(1)}%) ✓`
                : `كثافة ${density.toFixed(1)}% (المثالي: 1.0-2.5%)`,
            suggestion: densityIdeal ? undefined : density < 1.0
                ? 'أضف الكلمة المفتاحية أكثر في المحتوى'
                : 'قلل من تكرار الكلمة المفتاحية'
        });

        // 3.2 Keyword Variations (5 points)
        const hasVariations = content.mainContent.toLowerCase().includes(mainKeyword.toLowerCase().split(' ').reverse().join(' ')) ||
            content.mainContent.toLowerCase().includes(mainKeyword.toLowerCase() + 's') ||
            content.mainContent.includes('ال' + mainKeyword);
        checks.push({
            id: 'keyword-variations',
            category: 'keywords',
            name: 'تنويع الكلمة المفتاحية',
            status: hasVariations ? 'pass' : 'warning',
            score: hasVariations ? 5 : 2,
            maxScore: 5,
            message: hasVariations
                ? 'يوجد تنويع في الكلمات المفتاحية ✓'
                : 'لا يوجد تنويع كافٍ',
            suggestion: hasVariations ? undefined : 'استخدم صيغ مختلفة للكلمة المفتاحية'
        });

        // 3.3 LSI Keywords Potential (5 points) - Check for related terms
        const productWords = productName?.toLowerCase().split(' ') || [];
        const hasRelatedTerms = productWords.some(w =>
            w.length > 2 && content.mainContent.toLowerCase().includes(w)
        );
        checks.push({
            id: 'keyword-lsi',
            category: 'keywords',
            name: 'كلمات ذات صلة',
            status: hasRelatedTerms || productName ? 'pass' : 'warning',
            score: hasRelatedTerms ? 5 : 3,
            maxScore: 5,
            message: hasRelatedTerms
                ? 'يحتوي على كلمات مترادفة ✓'
                : 'أضف كلمات ذات صلة بالمنتج',
            suggestion: hasRelatedTerms ? undefined : 'استخدم مرادفات ومصطلحات ذات صلة'
        });
    }

    // ===== 4. READABILITY CHECKS (20 points) =====

    if (content.mainContent) {
        const avgSentence = averageSentenceLength(content.mainContent);

        // 4.1 Sentence Length (10 points)
        const sentenceLengthOk = avgSentence <= 20 && avgSentence >= 5;
        checks.push({
            id: 'readability-sentences',
            category: 'readability',
            name: 'طول الجمل',
            status: sentenceLengthOk ? 'pass' : (avgSentence <= 25 ? 'warning' : 'fail'),
            score: sentenceLengthOk ? 10 : (avgSentence <= 25 ? 5 : 0),
            maxScore: 10,
            message: sentenceLengthOk
                ? `جمل قصيرة ومقروءة (${avgSentence} كلمة/جملة) ✓`
                : `جمل طويلة (${avgSentence} كلمة/جملة)`,
            suggestion: sentenceLengthOk ? undefined : 'قصّر الجمل لتسهيل القراءة'
        });

        // 4.2 Active Voice (5 points)
        const hasPassive = hasPassiveVoice(content.mainContent);
        checks.push({
            id: 'readability-voice',
            category: 'readability',
            name: 'أسلوب الكتابة',
            status: !hasPassive ? 'pass' : 'warning',
            score: !hasPassive ? 5 : 3,
            maxScore: 5,
            message: !hasPassive
                ? 'أسلوب نشط وجذاب ✓'
                : 'يحتوي على صيغ مبنية للمجهول',
            suggestion: hasPassive ? 'استخدم الفعل المبني للمعلوم أكثر' : undefined
        });

        // 4.3 Use of Power Words (5 points)
        const powerWords = ['مميز', 'حصري', 'أفضل', 'جديد', 'فريد', 'احترافي', 'مضمون', 'سريع', 'مجاني', 'خصم'];
        const hasPowerWords = powerWords.some(w => content.mainContent.includes(w));
        checks.push({
            id: 'readability-power',
            category: 'readability',
            name: 'كلمات قوية',
            status: hasPowerWords ? 'pass' : 'warning',
            score: hasPowerWords ? 5 : 2,
            maxScore: 5,
            message: hasPowerWords
                ? 'يحتوي كلمات تسويقية قوية ✓'
                : 'أضف كلمات تسويقية جذابة',
            suggestion: hasPowerWords ? undefined : 'استخدم: مميز، حصري، أفضل، فريد'
        });
    }

    // ===== 5. TECHNICAL CHECKS (10 points) =====

    // 5.1 Meta Description (5 points)
    if (content.metaDescription) {
        const metaHasKeyword = content.metaDescription.toLowerCase().includes(mainKeyword.toLowerCase());
        const metaLengthOk = content.metaDescription.length >= 120 && content.metaDescription.length <= 155;
        checks.push({
            id: 'meta-description',
            category: 'technical',
            name: 'وصف الميتا',
            status: metaHasKeyword && metaLengthOk ? 'pass' : (metaHasKeyword || metaLengthOk ? 'warning' : 'fail'),
            score: (metaHasKeyword ? 2.5 : 0) + (metaLengthOk ? 2.5 : 0),
            maxScore: 5,
            message: metaHasKeyword && metaLengthOk
                ? 'وصف ميتا مثالي ✓'
                : `وصف ميتا: ${content.metaDescription.length} حرف`,
            suggestion: !metaHasKeyword ? 'أضف الكلمة المفتاحية في وصف الميتا' :
                !metaLengthOk ? 'اجعل وصف الميتا 120-155 حرف' : undefined
        });
    } else {
        checks.push({
            id: 'meta-missing',
            category: 'technical',
            name: 'وصف الميتا',
            status: 'fail',
            score: 0,
            maxScore: 5,
            message: 'وصف الميتا مفقود',
            suggestion: 'أضف وصف ميتا جذاب'
        });
    }

    // 5.2 Alt Text (5 points)
    const hasAltText = content.altText && content.altText.length > 5;
    checks.push({
        id: 'alt-text',
        category: 'technical',
        name: 'نص بديل للصورة',
        status: hasAltText ? 'pass' : 'fail',
        score: hasAltText ? 5 : 0,
        maxScore: 5,
        message: hasAltText
            ? 'نص بديل للصورة موجود ✓'
            : 'نص بديل للصورة مفقود',
        suggestion: hasAltText ? undefined : 'أضف وصف للصورة يحتوي الكلمة المفتاحية'
    });

    // ===== CALCULATE FINAL SCORE =====

    const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
    const maxScore = 100;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Group by category
    const summary = {
        title: { score: 0, max: 25 },
        content: { score: 0, max: 25 },
        keywords: { score: 0, max: 20 },
        readability: { score: 0, max: 20 },
        technical: { score: 0, max: 10 },
    };

    checks.forEach(c => {
        summary[c.category].score += c.score;
    });

    // Build issues and passes
    const issues = checks.filter(c => c.status === 'fail').map(c => c.message);
    const passes = checks.filter(c => c.status === 'pass').map(c => c.message);

    return {
        score: Math.round(totalScore),
        maxScore,
        percentage,
        grade: getGrade(percentage),
        checks,
        issues,
        passes,
        summary
    };
}
