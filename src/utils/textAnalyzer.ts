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

// ===== PHASE 5: CONTENT AUDIT ALGORITHMS =====

export function analyzeContentDepth(wordCount: number, keywordDensity: number, headingsCount: number): number {
  // A heuristic for how deeply a topic is covered
  let score = 0;
  // Word count: max 40 points for 2000+ words
  score += Math.min(40, (wordCount / 2000) * 40);
  // Headings: max 30 points for 15+ headings (shows structured, deep content)
  score += Math.min(30, (headingsCount / 15) * 30);
  // Keyword density relevance: max 30 points (optimal density ~1-3%, too low or too high is bad)
  const densityScore = keywordDensity >= 0.5 && keywordDensity <= 3.5 ? 30 : keywordDensity > 3.5 ? 10 : 15;
  score += densityScore;
  
  return Math.min(100, Math.round(score));
}

export function detectDuplicateContent(text: string): { duplicateRatio: number; snippets: string[] } {
  // Simple heuristic for internal duplication: split into sentences and find repeats
  if (!text) return { duplicateRatio: 0, snippets: [] };
  
  const sentences = text.split(/[.!?،\n]+/).map(s => s.trim()).filter(s => s.length > 20);
  if (sentences.length === 0) return { duplicateRatio: 0, snippets: [] };
  
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  let duplicateSentences = 0;
  
  for (const s of sentences) {
    if (seen.has(s)) {
      duplicates.add(s);
      duplicateSentences++;
    } else {
      seen.add(s);
    }
  }
  
  const ratio = Math.round((duplicateSentences / sentences.length) * 100);
  return {
    duplicateRatio: Math.min(100, ratio),
    snippets: Array.from(duplicates).slice(0, 3) // Return top 3 duplicate snippets
  };
}

export function analyzeSentimentAndTone(text: string): 'رسمي' | 'ودود' | 'بيعي' | 'معلوماتي' {
  if (!text) return 'معلوماتي';
  
  const salesWords = ['اشتر', 'سعر', 'خصم', 'عروض', 'حصري', 'تسوق', 'سلة', 'منتج', 'رخيص'];
  const formalWords = ['تعتبر', 'بناءً على', 'مما سبق', 'يُذكر', 'بالإضافة', 'لذلك', 'تشير'];
  const friendlyWords = ['رأيك', 'أهلاً', 'دعنا', 'شاركنا', 'نصيحتنا', 'يا', 'معك'];
  
  let salesCount = 0;
  let formalCount = 0;
  let friendlyCount = 0;
  
  const words = text.split(/\s+/);
  
  for (const w of words) {
    if (salesWords.some(s => w.includes(s))) salesCount++;
    else if (formalWords.some(s => w.includes(s))) formalCount++;
    else if (friendlyWords.some(s => w.includes(s))) friendlyCount++;
  }
  
  const max = Math.max(salesCount, formalCount, friendlyCount);
  if (max === 0 || (max === formalCount && formalCount < 3)) return 'معلوماتي';
  
  if (max === salesCount) return 'بيعي';
  if (max === friendlyCount) return 'ودود';
  return 'رسمي';
}
