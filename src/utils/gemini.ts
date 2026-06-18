import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SEOContent, ContentStyle } from './types';
import { getExpertPrompt, getSimplePrompt } from './prompts';
import { parseSEOContent } from './parsers';

// Re-export types for backward compatibility
export type { SEOContent, ContentStyle };

// ===== Model Cache =====
// Cache the best model result for 1 hour to avoid fetching on every request
const MODEL_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cachedModel: { name: string; apiKey: string; timestamp: number } | null = null;

async function getBestModel(apiKey: string): Promise<string> {
  // Return cached model if still valid and for the same API key
  if (
    cachedModel &&
    cachedModel.apiKey === apiKey &&
    Date.now() - cachedModel.timestamp < MODEL_CACHE_TTL_MS
  ) {
    return cachedModel.name;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) return "gemini-1.5-flash";
    const data = await response.json();
    const models = data.models || [];
    const generateModels = models.filter((m: Record<string, string[]>) => m.supportedGenerationMethods?.includes('generateContent'));
    
    const findModel = (name: string) => generateModels.find((m: Record<string, string>) => m.name === `models/${name}`);
    
    let modelName = "gemini-1.5-flash"; // default fallback

    if (findModel('gemini-3.5-flash')) modelName = 'gemini-3.5-flash';
    else if (findModel('gemini-2.5-flash')) modelName = 'gemini-2.5-flash';
    else if (findModel('gemini-2.0-flash')) modelName = 'gemini-2.0-flash';
    else if (findModel('gemini-1.5-flash')) modelName = 'gemini-1.5-flash';
    else if (findModel('gemini-1.5-pro')) modelName = 'gemini-1.5-pro';
    else {
      // Find any flash model
      const anyFlash = generateModels.find((m: Record<string, string>) => m.name.includes('flash'));
      if (anyFlash) modelName = anyFlash.name.replace('models/', '');
      else {
        // Fallback to anything with gemini
        const anyGemini = generateModels.find((m: Record<string, string>) => m.name.includes('gemini'));
        if (anyGemini) modelName = anyGemini.name.replace('models/', '');
      }
    }

    // Cache the result
    cachedModel = { name: modelName, apiKey, timestamp: Date.now() };
    return modelName;
    
  } catch (err) {
    console.error("Error fetching Gemini models:", err);
  }
  return "gemini-1.5-flash";
}

export async function generateSEOContent(
  apiKey: string,
  imageFile: File,
  productName: string,
  keyword: string,
  style: ContentStyle = 'expert'
): Promise<SEOContent> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = await getBestModel(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = style === 'expert'
    ? getExpertPrompt(productName, keyword)
    : getSimplePrompt(productName, keyword);

  const imagePart = await fileToGenerativePart(imageFile);

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();

  return parseSEOContent(text);
}

async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string, mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
