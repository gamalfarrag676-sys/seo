/**
 * تحليل قابلية القراءة للنصوص العربية
 * Readability Analysis for Arabic Text
 */

export interface ReadabilityResult {
    score: number; // 0-100
    grade: 'سهل جداً' | 'سهل' | 'متوسط' | 'صعب' | 'صعب جداً';
    gradeColor: 'emerald' | 'green' | 'amber' | 'orange' | 'red';
    metrics: {
        sentenceCount: number;
        wordCount: number;
        avgWordsPerSentence: number;
        avgCharsPerWord: number;
        paragraphCount: number;
        avgWordsPerParagraph: number;
        complexWordCount: number;
        complexWordPercentage: number;
        uniqueWordRatio: number;
        passiveVoiceCount: number;
        questionCount: number;
    };
    suggestions: string[];
    details: ReadabilityDetail[];
}

export interface ReadabilityDetail {
    id: string;
    name: string;
    value: number | string;
    status: 'good' | 'warning' | 'bad';
    message: string;
    icon: string;
}

// ===== HELPER FUNCTIONS =====

/**
 * عد الجمل (تدعم علامات الترقيم العربية والإنجليزية)
 */
function countSentences(text: string): number {
    // Arabic and English sentence endings
    const sentences = text.split(/[.!?؟،؛]+/).filter(s => s.trim().length > 0);
    return Math.max(sentences.length, 1);
}

/**
 * عد الفقرات
 */
function countParagraphs(text: string): number {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    return Math.max(paragraphs.length, 1);
}

/**
 * الحصول على كلمات النص
 */
function getWords(text: string): string[] {
    return text.trim().split(/\s+/).filter(w => w.length > 0);
}

/**
 * عد الكلمات المعقدة (كلمات طويلة تحتوي أكثر من 6 أحرف)
 */
function countComplexWords(words: string[]): number {
    return words.filter(word => {
        // Remove punctuation for counting
        const cleanWord = word.replace(/[^\u0600-\u06FFa-zA-Z]/g, '');
        return cleanWord.length > 6;
    }).length;
}

/**
 * حساب نسبة الكلمات الفريدة (تنوع المفردات)
 */
function calculateUniqueWordRatio(words: string[]): number {
    if (words.length === 0) return 0;
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\u0600-\u06FFa-zA-Z]/g, '')));
    return uniqueWords.size / words.length;
}

/**
 * عد الجمل بصيغة المبني للمجهول
 */
function countPassiveVoice(text: string): number {
    // Arabic passive patterns: يُ، تُ، أُ، نُ at the start of words
    const passivePatterns = /\s[يتأن]ُ\S+/g;
    const matches = text.match(passivePatterns) || [];
    return matches.length;
}

/**
 * عد الأسئلة
 */
function countQuestions(text: string): number {
    const questionMarks = (text.match(/[?؟]/g) || []).length;
    return questionMarks;
}

/**
 * حساب متوسط طول الكلمة
 */
function calculateAvgCharsPerWord(words: string[]): number {
    if (words.length === 0) return 0;
    const totalChars = words.reduce((sum, word) => {
        const cleanWord = word.replace(/[^\u0600-\u06FFa-zA-Z]/g, '');
        return sum + cleanWord.length;
    }, 0);
    return totalChars / words.length;
}

/**
 * حساب درجة القراءة العربية (مستوحى من Flesch-Kincaid مع تعديل للعربية)
 */
function calculateArabicReadabilityScore(
    avgWordsPerSentence: number,
    avgCharsPerWord: number,
    complexWordPercentage: number
): number {
    // Formula adjusted for Arabic:
    // Base 100 - penalties for complexity
    let score = 100;

    // Penalty for long sentences (ideal: 10-18 words)
    if (avgWordsPerSentence > 25) {
        score -= (avgWordsPerSentence - 25) * 2;
    } else if (avgWordsPerSentence > 18) {
        score -= (avgWordsPerSentence - 18);
    } else if (avgWordsPerSentence < 8) {
        score -= (8 - avgWordsPerSentence) * 0.5; // Light penalty for very short
    }

    // Penalty for long words (Arabic words are typically 3-5 chars)
    if (avgCharsPerWord > 6) {
        score -= (avgCharsPerWord - 6) * 3;
    }

    // Penalty for complex words
    score -= complexWordPercentage * 0.5;

    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * تحديد مستوى الصعوبة
 */
function getGrade(score: number): { grade: ReadabilityResult['grade']; color: ReadabilityResult['gradeColor'] } {
    if (score >= 80) return { grade: 'سهل جداً', color: 'emerald' };
    if (score >= 60) return { grade: 'سهل', color: 'green' };
    if (score >= 40) return { grade: 'متوسط', color: 'amber' };
    if (score >= 20) return { grade: 'صعب', color: 'orange' };
    return { grade: 'صعب جداً', color: 'red' };
}

// ===== MAIN ANALYZER =====

export function analyzeReadability(text: string): ReadabilityResult {
    if (!text || text.trim().length === 0) {
        return {
            score: 0,
            grade: 'صعب جداً',
            gradeColor: 'red',
            metrics: {
                sentenceCount: 0,
                wordCount: 0,
                avgWordsPerSentence: 0,
                avgCharsPerWord: 0,
                paragraphCount: 0,
                avgWordsPerParagraph: 0,
                complexWordCount: 0,
                complexWordPercentage: 0,
                uniqueWordRatio: 0,
                passiveVoiceCount: 0,
                questionCount: 0,
            },
            suggestions: ['أضف محتوى للتحليل'],
            details: [],
        };
    }

    const words = getWords(text);
    const wordCount = words.length;
    const sentenceCount = countSentences(text);
    const paragraphCount = countParagraphs(text);
    const complexWordCount = countComplexWords(words);
    const passiveVoiceCount = countPassiveVoice(text);
    const questionCount = countQuestions(text);

    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgCharsPerWord = calculateAvgCharsPerWord(words);
    const avgWordsPerParagraph = wordCount / paragraphCount;
    const complexWordPercentage = (complexWordCount / wordCount) * 100;
    const uniqueWordRatio = calculateUniqueWordRatio(words);

    const score = calculateArabicReadabilityScore(
        avgWordsPerSentence,
        avgCharsPerWord,
        complexWordPercentage
    );

    const { grade, color } = getGrade(score);

    // Build suggestions
    const suggestions: string[] = [];

    if (avgWordsPerSentence > 20) {
        suggestions.push('قسّم الجمل الطويلة إلى جمل أقصر (15-20 كلمة)');
    }
    if (complexWordPercentage > 30) {
        suggestions.push('استخدم كلمات أبسط وأقصر');
    }
    if (paragraphCount < 3 && wordCount > 100) {
        suggestions.push('قسّم النص إلى فقرات أكثر');
    }
    if (passiveVoiceCount > sentenceCount * 0.3) {
        suggestions.push('استخدم صيغة المبني للمعلوم أكثر');
    }
    if (uniqueWordRatio < 0.5) {
        suggestions.push('نوّع المفردات المستخدمة');
    }
    if (questionCount === 0 && wordCount > 50) {
        suggestions.push('أضف أسئلة لزيادة التفاعل');
    }

    // Build detailed analysis
    const details: ReadabilityDetail[] = [
        {
            id: 'sentence-length',
            name: 'متوسط طول الجملة',
            value: `${avgWordsPerSentence.toFixed(1)} كلمة`,
            status: avgWordsPerSentence <= 18 ? 'good' : avgWordsPerSentence <= 25 ? 'warning' : 'bad',
            message: avgWordsPerSentence <= 18
                ? 'جمل قصيرة ومقروءة ✓'
                : avgWordsPerSentence <= 25
                    ? 'جمل متوسطة الطول'
                    : 'جمل طويلة جداً',
            icon: avgWordsPerSentence <= 18 ? '✓' : '⚠',
        },
        {
            id: 'paragraph-count',
            name: 'عدد الفقرات',
            value: paragraphCount,
            status: paragraphCount >= 3 ? 'good' : paragraphCount >= 2 ? 'warning' : 'bad',
            message: paragraphCount >= 3
                ? 'تنظيم جيد للفقرات ✓'
                : 'أضف المزيد من الفقرات',
            icon: paragraphCount >= 3 ? '📝' : '📄',
        },
        {
            id: 'complex-words',
            name: 'الكلمات المعقدة',
            value: `${complexWordPercentage.toFixed(1)}%`,
            status: complexWordPercentage <= 20 ? 'good' : complexWordPercentage <= 35 ? 'warning' : 'bad',
            message: complexWordPercentage <= 20
                ? 'مفردات سهلة ✓'
                : complexWordPercentage <= 35
                    ? 'بعض الكلمات المعقدة'
                    : 'كلمات معقدة كثيرة',
            icon: complexWordPercentage <= 20 ? '📖' : '📚',
        },
        {
            id: 'vocabulary',
            name: 'تنوع المفردات',
            value: `${(uniqueWordRatio * 100).toFixed(0)}%`,
            status: uniqueWordRatio >= 0.6 ? 'good' : uniqueWordRatio >= 0.4 ? 'warning' : 'bad',
            message: uniqueWordRatio >= 0.6
                ? 'تنوع جيد ✓'
                : uniqueWordRatio >= 0.4
                    ? 'تنوع متوسط'
                    : 'تكرار مفرط',
            icon: uniqueWordRatio >= 0.6 ? '🎨' : '🔁',
        },
        {
            id: 'passive-voice',
            name: 'المبني للمجهول',
            value: passiveVoiceCount,
            status: passiveVoiceCount <= 2 ? 'good' : passiveVoiceCount <= 5 ? 'warning' : 'bad',
            message: passiveVoiceCount <= 2
                ? 'أسلوب نشط ✓'
                : 'كثرة المبني للمجهول',
            icon: passiveVoiceCount <= 2 ? '💪' : '😐',
        },
    ];

    return {
        score,
        grade,
        gradeColor: color,
        metrics: {
            sentenceCount,
            wordCount,
            avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
            avgCharsPerWord: Math.round(avgCharsPerWord * 10) / 10,
            paragraphCount,
            avgWordsPerParagraph: Math.round(avgWordsPerParagraph * 10) / 10,
            complexWordCount,
            complexWordPercentage: Math.round(complexWordPercentage * 10) / 10,
            uniqueWordRatio: Math.round(uniqueWordRatio * 100) / 100,
            passiveVoiceCount,
            questionCount,
        },
        suggestions,
        details,
    };
}
