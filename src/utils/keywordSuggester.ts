/**
 * اقتراح كلمات مفتاحية ذكي
 * Smart Keyword Suggestions using Google Suggest
 */
import { getBestModel } from './aiTools';

export interface KeywordSuggestion {
    keyword: string;
    relevance: number; // 1-5 stars
    type: 'exact' | 'related' | 'question' | 'long-tail';
}

export interface KeywordSuggestResult {
    suggestions: KeywordSuggestion[];
    lsiKeywords: string[];
    questions: string[];
}

// ===== GOOGLE SUGGEST API =====

/**
 * جلب اقتراحات من Google Suggest
 * Uses CORS proxy to access Google's autocomplete API
 */
async function fetchGoogleSuggestions(keyword: string): Promise<string[]> {
    try {
        // Use a CORS proxy or direct access
        const encodedKeyword = encodeURIComponent(keyword);

        // Google Suggest endpoint (requires CORS handling in production)
        // For production, you should use a backend proxy
        const proxyUrl = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodedKeyword}&hl=ar`;

        // Try direct fetch (works in some environments)
        try {
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const data = await response.json();
                return data[1] || [];
            }
        } catch {
            // CORS blocked - fallback to generated suggestions
        }

        // Fallback: Generate intelligent suggestions based on patterns
        return generateFallbackSuggestions(keyword);
    } catch (error) {
        console.warn('Google Suggest failed, using fallback:', error);
        return generateFallbackSuggestions(keyword);
    }
}

/**
 * توليد اقتراحات احتياطية ذكية
 */
function generateFallbackSuggestions(keyword: string): string[] {
    const prefixes = ['أفضل', 'أرخص', 'أقوى', 'أجود'];
    const suffixes = ['للبيع', 'أصلي', 'ممتاز', 'جديد', 'فاخر', 'رخيص', 'احترافي'];
    const questions = [`ما هو أفضل ${keyword}`, `كيف أختار ${keyword}`, `سعر ${keyword}`];

    const suggestions: string[] = [];

    // Add prefix variations
    prefixes.forEach(prefix => {
        suggestions.push(`${prefix} ${keyword}`);
    });

    // Add suffix variations
    suffixes.slice(0, 3).forEach(suffix => {
        suggestions.push(`${keyword} ${suffix}`);
    });

    // Add questions
    suggestions.push(...questions.slice(0, 2));

    return suggestions;
}

/**
 * توليد كلمات LSI باستخدام AI
 */
export async function generateLSIKeywords(
    keyword: string,
    apiKey: string,
    provider: 'gemini' | 'openai' = 'gemini'
): Promise<string[]> {
    if (!apiKey) return [];

    try {
        const prompt = `اقترح 5 كلمات مفتاحية ذات صلة (LSI) للكلمة: "${keyword}"
        
القواعد:
- كلمات عربية فقط
- كلمات تستخدم في نفس السياق
- مرادفات ومصطلحات متعلقة
- بدون ترقيم أو شرح

النتيجة: كلمة واحدة في كل سطر`;

        if (provider === 'openai') {
            // OpenAI API logic (simulated for now, replace with actual call if needed)
            throw new Error("OpenAI is not yet fully implemented for Keyword Suggester");
        } else {
            const modelName = await getBestModel(apiKey);
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                return text.split('\n').map((k: string) => k.trim()).filter((k: string) => k.length > 0 && k.length < 30);
            }
        }

        return [];
    } catch (error) {
        console.warn('LSI generation failed:', error);
        return [];
    }
}

/**
 * تصنيف نوع الكلمة المفتاحية
 */
function classifyKeyword(keyword: string, originalKeyword: string): KeywordSuggestion['type'] {
    const questionWords = ['ما', 'كيف', 'لماذا', 'متى', 'أين', 'هل'];

    if (questionWords.some(q => keyword.startsWith(q))) {
        return 'question';
    }

    if (keyword.split(' ').length > 3) {
        return 'long-tail';
    }

    if (keyword.toLowerCase() === originalKeyword.toLowerCase()) {
        return 'exact';
    }

    return 'related';
}

/**
 * حساب مدى الصلة
 */
function calculateRelevance(suggestion: string, originalKeyword: string): number {
    const suggestionLower = suggestion.toLowerCase();
    const keywordLower = originalKeyword.toLowerCase();

    // Exact match
    if (suggestionLower === keywordLower) return 5;

    // Contains keyword
    if (suggestionLower.includes(keywordLower)) return 4;

    // Keyword contains suggestion
    if (keywordLower.includes(suggestionLower)) return 3;

    // Word overlap
    const suggestionWords = suggestionLower.split(' ');
    const keywordWords = keywordLower.split(' ');
    const overlap = suggestionWords.filter(w => keywordWords.includes(w)).length;

    if (overlap > 0) return 2 + Math.min(overlap, 2);

    return 2;
}

// ===== MAIN SUGGESTER =====

export async function suggestKeywords(
    keyword: string,
    apiKey?: string,
    aiProvider: 'gemini' | 'openai' = 'gemini'
): Promise<KeywordSuggestResult> {
    if (!keyword || keyword.trim().length < 2) {
        return { suggestions: [], lsiKeywords: [], questions: [] };
    }

    const cleanKeyword = keyword.trim();

    // Fetch from Google Suggest
    const googleSuggestions = await fetchGoogleSuggestions(cleanKeyword);

    // Generate LSI if API key provided
    const lsiKeywords = apiKey ? await generateLSIKeywords(cleanKeyword, apiKey, aiProvider) : [];

    // Process suggestions
    const suggestions: KeywordSuggestion[] = googleSuggestions.map(suggestion => ({
        keyword: suggestion,
        relevance: calculateRelevance(suggestion, cleanKeyword),
        type: classifyKeyword(suggestion, cleanKeyword),
    }));

    // Sort by relevance
    suggestions.sort((a, b) => b.relevance - a.relevance);

    // Extract questions
    const questions = suggestions
        .filter(s => s.type === 'question')
        .map(s => s.keyword);

    return {
        suggestions: suggestions.slice(0, 10),
        lsiKeywords,
        questions,
    };
}
