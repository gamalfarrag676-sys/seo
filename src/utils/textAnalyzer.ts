// src/utils/textAnalyzer.ts — Algorithmic Text & SEO Analysis Engine

const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'أن', 'إن', 'أو', 'أم', 'بل', 'لكن',
  'التي', 'الذي', 'الذين', 'و', 'ف', 'ثم', 'حتى', 'لا', 'لم', 'لن', 'ما', 'ماذا', 'كيف',
  'متى', 'أين', 'هل', 'نعم', 'بلى', 'إذن', 'إذا', 'لو', 'لولا', 'كل', 'بعض', 'أي', 'غير',
  'سوى', 'حيث', 'بين', 'أمام', 'خلف', 'فوق', 'تحت', 'قبل', 'بعد', 'عند', 'لدى', 'ب', 'ل',
  'ك', 'كان', 'كانت', 'يكون', 'ليس', 'ليست', 'تم', 'يتم', 'تتم', 'أنها', 'أنه', 'إلا', 'ولا'
]);

// Clean text: remove diacritics, symbols, english letters if we only want arabic
export function cleanArabicText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[ً-ٓ]/g, '') // Remove Arabic diacritics
    .replace(/[^\u0600-\u06FF\s]/g, ' ') // Keep only Arabic letters and spaces
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function extractNgrams(words: string[], n: number): string[] {
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

// Extract keywords using Term Frequency
export function extractKeywordsTF(text: string, topK: number = 20): { keyword: string; density: number; count: number }[] {
  const cleaned = cleanArabicText(text);
  const rawWords = cleaned.split(' ').filter(w => w.length > 2);
  const words = rawWords.filter(w => !ARABIC_STOP_WORDS.has(w));
  
  const totalWords = words.length;
  if (totalWords === 0) return [];

  const counts: Record<string, number> = {};
  
  // 1-grams
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  
  // 2-grams
  const bigrams = extractNgrams(words, 2);
  for (const bg of bigrams) counts[bg] = (counts[bg] || 0) + 1.5; // weight bigrams slightly higher

  // 3-grams
  const trigrams = extractNgrams(words, 3);
  for (const tg of trigrams) counts[tg] = (counts[tg] || 0) + 2; // weight trigrams higher

  // Convert to array and sort
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([keyword, count]) => ({
      keyword,
      count: Math.round(count),
      density: Number(((count / totalWords) * 100).toFixed(2))
    }));

  return sorted;
}

// Algorithmic Readability (Flesch-based adapted for Arabic)
export function calculateArabicReadability(text: string): number {
  if (!text || text.length < 10) return 0;
  
  // Count sentences by looking for punctuation (. ! ? ،)
  const sentences = text.split(/[.!?،:]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = Math.max(1, words.length);
  
  // Average Word Length (chars per word)
  const avgWordLength = words.reduce((acc, w) => acc + w.length, 0) / wordCount;
  
  // Average Sentence Length (words per sentence)
  const avgSentenceLength = wordCount / sentenceCount;

  // Custom formula tuned for Arabic
  // Arabic words are naturally longer and sentences can be complex.
  // 100 is very easy, 0 is very difficult.
  let score = 100 - (avgSentenceLength * 1.5) - (avgWordLength * 8);
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Calculate intersection for gap analysis
export function generateContentGaps(competitorKeywords: string[][], targetKeyword: string): { topic: string; score: number }[] {
  const keywordFrequency: Record<string, number> = {};
  
  competitorKeywords.forEach(keywords => {
    // Unique keywords per competitor to count document frequency
    const unique = new Set(keywords);
    unique.forEach(k => {
      keywordFrequency[k] = (keywordFrequency[k] || 0) + 1;
    });
  });

  // Topics mentioned by multiple competitors are high priority gaps
  // If only 1 competitor, treat all their topics as gaps
  const numCompetitors = competitorKeywords.length;
  const minCount = numCompetitors > 1 ? 1 : 0;
  
  return Object.entries(keywordFrequency)
    .filter(([kw, count]) => count > minCount && !kw.includes(targetKeyword.split(' ')[0])) // Exclude the target keyword itself
    .map(([topic, count]) => ({
      topic,
      score: Math.round((count / numCompetitors) * 100) // Percentage of competitors covering it
    }))
    .sort((a, b) => b.score - a.score);
}
