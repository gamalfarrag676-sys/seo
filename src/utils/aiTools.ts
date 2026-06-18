export interface KeywordData {
  keyword: string;
  volume: string;
  difficulty: number;
  intent: 'Navigational' | 'Informational' | 'Commercial' | 'Transactional';
  cpc: string;
}

export interface ContentPlanCluster {
  clusterName: string;
  subtopics: {
    title: string;
    type: 'Blog' | 'Product' | 'Category';
    intent: string;
  }[];
}

export interface KeywordItem {
  keyword: string;
  volume: string;
  position: number;
  kd: number;
}

export interface CompetitorAnalysisData {
  url: string;
  domainOverview: {
    domainAuthority: number;
    organicTraffic: string;
    backlinks: string;
    referringDomains: string;
  };
  topKeywords: KeywordItem[];
  seoAnalysis: {
    contentScore: number;
    technicalIssues: string[];
    contentGaps: string[];
  };
}

export async function getBestModel(apiKey: string): Promise<string> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) return "gemini-1.5-flash";
    const data = await response.json();
    const models = data.models || [];
    const generateModels = models.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'));
    
    const findModel = (name: string) => generateModels.find((m: any) => m.name === `models/${name}`);
    
    if (findModel('gemini-3.5-flash')) return 'gemini-3.5-flash';
    if (findModel('gemini-2.5-flash')) return 'gemini-2.5-flash';
    if (findModel('gemini-2.0-flash')) return 'gemini-2.0-flash';
    if (findModel('gemini-1.5-flash')) return 'gemini-1.5-flash';
    if (findModel('gemini-1.5-pro')) return 'gemini-1.5-pro';
    
    // Find any flash model
    const anyFlash = generateModels.find((m: any) => m.name.includes('flash'));
    if (anyFlash) return anyFlash.name.replace('models/', '');

    // Fallback to anything with gemini
    const anyGemini = generateModels.find((m: any) => m.name.includes('gemini'));
    if (anyGemini) return anyGemini.name.replace('models/', '');
    
  } catch (err) {
    console.error("Error fetching models:", err);
  }
  return "gemini-1.5-flash";
}

async function callAI(prompt: string, apiKey: string, provider: 'gemini' | 'openai'): Promise<string> {
  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });
    if (!response.ok) throw new Error('فشل الاتصال بـ OpenAI');
    const data = await response.json();
    return data.choices[0].message.content;
  } else {
    const modelName = await getBestModel(apiKey);
    // console.log("Using dynamic model:", modelName);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        }
      })
    });
    if (!response.ok) throw new Error('فشل الاتصال بـ Gemini');
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}

export async function generateKeywordIdeas(seedKeyword: string, apiKey: string, provider: 'gemini' | 'openai'): Promise<KeywordData[]> {
  const prompt = `
  You are an expert SEO tool. Provide exactly 10 keyword variations and related long-tail keywords for the Arabic seed keyword: "${seedKeyword}".
  Respond ONLY with a valid JSON object with the following structure:
  {
    "keywords": [
      {
        "keyword": "string (the Arabic keyword)",
        "volume": "string (e.g. '1K - 10K', '100 - 1K', etc.)",
        "difficulty": number (1 to 100),
        "intent": "string (must be exactly one of: 'Navigational', 'Informational', 'Commercial', 'Transactional')",
        "cpc": "string (e.g. '$1.20')"
      }
    ]
  }
  Do not include markdown blocks or any other text.
  `;
  
  const text = await callAI(prompt, apiKey, provider);
  const json = JSON.parse(text);
  return json.keywords || [];
}

export async function generateContentPlan(topic: string, apiKey: string, provider: 'gemini' | 'openai'): Promise<ContentPlanCluster[]> {
  const prompt = `
  You are an expert SEO Content Strategist. Create a Topical Map / Content Plan for an Arabic website about "${topic}".
  Group the plan into 3-5 logical Topic Clusters. Each cluster should have 3-5 subtopics/articles/pages.
  Respond ONLY with a valid JSON object with the following structure:
  {
    "clusters": [
      {
        "clusterName": "string (Arabic cluster name)",
        "subtopics": [
          {
            "title": "string (Arabic title)",
            "type": "string (must be exactly one of: 'Blog', 'Product', 'Category')",
            "intent": "string (Brief intent description in Arabic)"
          }
        ]
      }
    ]
  }
  Do not include markdown blocks or any other text.
  `;

  const text = await callAI(prompt, apiKey, provider);
  const json = JSON.parse(text);
  return json.clusters || [];
}

import { supabase } from '../lib/supabase';

// Helper to scrape a URL via our Supabase Edge Function with a fallback to AllOrigins
async function scrapeUrlContent(url: string) {
  try {
    // Attempt 1: Our custom Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('scrape-url', {
      body: { url }
    });
    
    if (!error && data) {
      return data;
    }
    
    console.warn("Edge function failed, falling back to public proxy:", error);
  } catch (err) {
    console.warn("Edge function not reachable, falling back to public proxy:", err);
  }

  // Fallback: Use corsproxy.io public proxy if Supabase is inactive or edge function fails
  try {
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('فشل الاتصال بالبروكسي المجاني.');
    
    const html = await response.text();
    if (!html || typeof html !== 'string') {
        throw new Error('محتوى فارغ');
    }
    
    // Very basic regex-based extraction since we are in the browser
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'عنوان غير معروف';
    
    // Remove scripts and styles roughly
    let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    
    const wordCount = cleanHtml.replace(/<[^>]*>?/gm, ' ').split(/\s+/).filter(w => w.length > 0).length;
    const textContent = cleanHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').substring(0, 10000); // 10k chars max

    return {
      title,
      metaDescription: '',
      headings: { h1: [], h2: [] },
      wordCount,
      textContent
    };
  } catch (fallbackErr: any) {
    console.error("Fallback error:", fallbackErr);
    throw new Error(`تعذر جلب محتوى الرابط. تفاصيل الخطأ: ${fallbackErr.message || "تأكد من صحة الرابط وأن الموقع يسمح بالوصول."}`);
  }
}

export async function analyzeCompetitorUrl(url: string, apiKey: string, provider: 'gemini' | 'openai'): Promise<CompetitorAnalysisData[]> {
  // Step 1: Scrape the actual content
  const scrapedData = await scrapeUrlContent(url);
  
  if (!scrapedData || !scrapedData.textContent) {
    throw new Error("لم يتم العثور على محتوى قابل للقراءة في هذا الرابط.");
  }

  // Step 2: Ask AI to analyze the extracted real content
  const prompt = `
  You are an expert SEO Analyst. I have scraped the content of a competitor's page.
  Here are the details:
  URL: ${url}
  Title: ${scrapedData.title}
  Meta Description: ${scrapedData.metaDescription}
  H1: ${scrapedData.headings.h1.join(', ')}
  Word Count: ${scrapedData.wordCount}
  
  Content Preview:
  "${scrapedData.textContent.substring(0, 3000)}" // First 3000 chars for context
  
  Based on this actual content and the URL provided, act like an Ahrefs or Semrush dashboard.
  ESTIMATE realistic metrics for this domain and page targeting the Arabic/Saudi market.
  
  Respond ONLY with a valid JSON object with the following structure:
  {
    "competitors": [
      {
        "url": "${url}",
        "domainOverview": {
          "domainAuthority": number (1-100),
          "organicTraffic": "string (e.g. '120K', '500', '1.2M')",
          "backlinks": "string (e.g. '15K', '250')",
          "referringDomains": "string (e.g. '1.5K', '80')"
        },
        "topKeywords": [
          { "keyword": "string (Arabic keyword)", "volume": "string", "position": number, "kd": number (1-100) },
          { "keyword": "string (Arabic keyword)", "volume": "string", "position": number, "kd": number (1-100) }
          // Provide exactly 5 top keywords
        ],
        "seoAnalysis": {
          "contentScore": number (1-100),
          "technicalIssues": ["string (Arabic technical issue 1)", "string (Arabic technical issue 2)"],
          "contentGaps": ["string (Arabic gap 1)", "string (Arabic gap 2)"]
        }
      }
    ]
  }
  Do not include markdown blocks or any other text.
  `;

  const text = await callAI(prompt, apiKey, provider);
  const json = JSON.parse(text);
  return json.competitors || [];
}

export async function generateCompetitorAnalysis(keyword: string, apiKey: string, provider: 'gemini' | 'openai'): Promise<CompetitorAnalysisData[]> {
  // Check if input is a URL
  const isUrl = keyword.startsWith('http://') || keyword.startsWith('https://');
  
  if (isUrl) {
    return analyzeCompetitorUrl(keyword, apiKey, provider);
  }

  // Fallback to keyword-based simulation
  const prompt = `
  You are an expert SEO Analyst. Simulate a SERP competitor analysis for the Arabic keyword "${keyword}".
  Invent 1 realistic top competitor that would rank on page 1 for this keyword in Saudi Arabia (use realistic domain names like noon.com, amazon.sa, jarir.com, extrastores.com, mawdoo3.com, etc.).
  Act like an Ahrefs or Semrush dashboard and provide realistic estimated metrics.
  
  Respond ONLY with a valid JSON object with the following structure:
  {
    "competitors": [
      {
        "url": "string (domain/path)",
        "domainOverview": {
          "domainAuthority": number (1-100),
          "organicTraffic": "string (e.g. '120K', '500', '1.2M')",
          "backlinks": "string (e.g. '15K', '250')",
          "referringDomains": "string (e.g. '1.5K', '80')"
        },
        "topKeywords": [
          { "keyword": "string (Arabic keyword)", "volume": "string", "position": number, "kd": number (1-100) },
          { "keyword": "string (Arabic keyword)", "volume": "string", "position": number, "kd": number (1-100) }
          // Provide exactly 5 top keywords
        ],
        "seoAnalysis": {
          "contentScore": number (1-100),
          "technicalIssues": ["string (Arabic technical issue 1)", "string (Arabic technical issue 2)"],
          "contentGaps": ["string (Arabic gap 1)", "string (Arabic gap 2)"]
        }
      }
    ]
  }
  Do not include markdown blocks or any other text.
  `;

  const text = await callAI(prompt, apiKey, provider);
  const json = JSON.parse(text);
  return json.competitors || [];
}
