import type { SEOContent, ContentStyle } from './types';

export interface BulkItem {
  id: string;
  productName: string;
  keyword: string;
  description?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: SEOContent;
  error?: string;
}

export interface BulkProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
}

export type BulkProgressCallback = (progress: BulkProgress) => void;

// Basic delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function processBulkItems(
  items: BulkItem[],
  apiKey: string,
  aiProvider: 'gemini' | 'openai',
  contentStyle: ContentStyle,
  onProgress: BulkProgressCallback,
  signal?: AbortSignal
): Promise<BulkItem[]> {
  const results: BulkItem[] = [...items];
  
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < results.length; i++) {
    if (signal?.aborted) {
      break;
    }

    const item = results[i];
    if (item.status === 'done') {
      completed++;
      continue; // Skip already done (if resuming)
    }

    // Update status to processing
    results[i] = { ...item, status: 'processing' };
    onProgress({
      total: results.length,
      completed,
      failed,
      current: item.productName || item.keyword
    });

    try {
      let content: SEOContent;
      
      // Fallback empty image since bulk processor doesn't have images
      // A more robust implementation would separate text-only generation from image generation
      // in the core gemini/openai utilities. For now, we simulate an empty image or use the text-only path if available.
      
      // Actually, we can use the existing articleGenerator approach if it's pure text,
      // but the prompt says "For bulk processing without images, create the content using the AI directly with a text-only prompt. You can use fetch to call the Gemini/OpenAI API directly...".
      // But we can also just use the existing `generateSEOContent` if we modify it, but we can't easily upload an empty file.
      // Wait, let's implement a text-only call here for products using the same endpoints.

      if (aiProvider === 'gemini') {
        content = await generateTextOnlyGemini(item.productName, item.keyword, item.description, contentStyle, apiKey, signal);
      } else {
        content = await generateTextOnlyOpenAI(item.productName, item.keyword, item.description, contentStyle, apiKey, signal);
      }

      results[i] = { ...results[i], status: 'done', result: content };
      completed++;

    } catch (err: any) {
      if (signal?.aborted) break;

      // Retry once on failure
      console.warn(`Failed to process ${item.productName}, retrying in 3s...`, err);
      await delay(3000);
      
      try {
        if (signal?.aborted) break;
        let content: SEOContent;
        if (aiProvider === 'gemini') {
          content = await generateTextOnlyGemini(item.productName, item.keyword, item.description, contentStyle, apiKey, signal);
        } else {
          content = await generateTextOnlyOpenAI(item.productName, item.keyword, item.description, contentStyle, apiKey, signal);
        }
        results[i] = { ...results[i], status: 'done', result: content };
        completed++;
      } catch (retryErr: any) {
        results[i] = { ...results[i], status: 'error', error: retryErr.message || 'فشل التوليد' };
        failed++;
      }
    }

    // Report progress
    onProgress({
      total: results.length,
      completed,
      failed,
      current: item.productName || item.keyword
    });

    // Rate limiting delay
    if (i < results.length - 1 && !signal?.aborted) {
      await delay(2000);
    }
  }

  return results;
}

export function parseCSV(csvText: string): BulkItem[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const items: BulkItem[] = [];
  
  // Start from line 1 to skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Very basic CSV parser (doesn't handle quotes perfectly, but good enough for simple cases)
    const [productName, keyword, description] = line.split(',').map(s => s.trim());
    
    if (productName && keyword) {
      items.push({
        id: crypto.randomUUID(),
        productName,
        keyword,
        description: description || undefined,
        status: 'pending'
      });
    }
  }

  return items;
}

export function exportToCSV(items: BulkItem[]): string {
  const header = 'Product Name,Keyword,H1 Title,Meta Title,Meta Description,URL Slug,Main Content\n';
  
  const escapeCsv = (str: string) => {
    if (!str) return '""';
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = items.map(item => {
    if (!item.result) return '';
    const { h1Title, metaTitle, metaDescription, urlSlug, mainContent } = item.result;
    return [
      escapeCsv(item.productName),
      escapeCsv(item.keyword),
      escapeCsv(h1Title),
      escapeCsv(metaTitle),
      escapeCsv(metaDescription),
      escapeCsv(urlSlug),
      escapeCsv(mainContent)
    ].join(',');
  }).filter(Boolean);

  return header + rows.join('\n');
}

export function exportToJSON(items: BulkItem[]): string {
  return JSON.stringify(items, null, 2);
}


// --- INTERNAL TEXT-ONLY GENERATORS ---

const getProductPrompt = (productName: string, keyword: string, description: string = '', style: string = 'balanced') => `
قم بكتابة محتوى متوافق مع السيو (SEO) لمنتج في متجر إلكتروني.
اسم المنتج: ${productName}
الكلمة المفتاحية المستهدفة: ${keyword}
${description ? `معلومات إضافية عن المنتج: ${description}` : ''}
أسلوب الكتابة: ${style}

استخدم علامات الاستخراج التالية بدقة:
<<<TITLE>>>
[عنوان المنتج بحد أقصى 60 حرف يحتوي على الكلمة المفتاحية]
<<<END_TITLE>>>

<<<CONTENT>>>
[وصف المنتج بالتفصيل (300 كلمة على الأقل) باستخدام HTML أو Markdown (عناوين ##، قوائم نقاط)]
<<<END_CONTENT>>>

<<<KEYWORDS>>>
[5 كلمات مفتاحية مفصولة بفواصل]
<<<END_KEYWORDS>>>

<<<META_TITLE>>>
[عنوان للميتا تاج]
<<<END_META_TITLE>>>

<<<META_DESC>>>
[وصف للميتا تاج (150 حرف)]
<<<END_META_DESC>>>

<<<URL_SLUG>>>
[رابط URL بالانجليزية مفصول بشرطات]
<<<END_URL_SLUG>>>

<<<ALT_TEXT>>>
[نص بديل للصور يحتوي على الكلمة المفتاحية]
<<<END_ALT_TEXT>>>
`;

async function generateTextOnlyGemini(productName: string, keyword: string, description: string | undefined, style: string, apiKey: string, signal?: AbortSignal): Promise<SEOContent> {
  const prompt = getProductPrompt(productName, keyword, description, style);
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 }
    }),
    signal
  });

  if (!response.ok) throw new Error('فشل الاتصال بـ Gemini API');
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('لم يتم استلام نص من Gemini');

  return parseResponse(text);
}

async function generateTextOnlyOpenAI(productName: string, keyword: string, description: string | undefined, style: string, apiKey: string, signal?: AbortSignal): Promise<SEOContent> {
  const prompt = getProductPrompt(productName, keyword, description, style);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }),
    signal
  });

  if (!response.ok) throw new Error('فشل الاتصال بـ OpenAI API');
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('لم يتم استلام نص من OpenAI');

  return parseResponse(text);
}

function parseResponse(text: string): SEOContent {
  const extract = (startTag: string, endTag: string): string => {
    const regex = new RegExp(`<<<\s*${startTag.replace(/<<</, '').replace(/>>>/, '')}\s*>>>([\\s\\S]*?)<<<\s*${endTag.replace(/<<</, '').replace(/>>>/, '')}\s*>>>`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    h1Title: extract('<<<TITLE>>>', '<<<END_TITLE>>>'),
    mainContent: extract('<<<CONTENT>>>', '<<<END_CONTENT>>>') || text,
    keywords: extract('<<<KEYWORDS>>>', '<<<END_KEYWORDS>>>'),
    metaTitle: extract('<<<META_TITLE>>>', '<<<END_META_TITLE>>>'),
    metaDescription: extract('<<<META_DESC>>>', '<<<END_META_DESC>>>'),
    urlSlug: extract('<<<URL_SLUG>>>', '<<<END_URL_SLUG>>>') || 'product',
    altText: extract('<<<ALT_TEXT>>>', '<<<END_ALT_TEXT>>>'),
  };
}
