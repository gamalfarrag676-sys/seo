// src/utils/gemini.ts — OPTIMIZED VERSION
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SEOContent, ContentStyle } from './types';
import { getExpertPrompt, getSimplePrompt } from './prompts';
import { parseSEOContent } from './parsers';
import { sanitizeForPrompt } from './inputSanitizer';

// Re-export types for backward compatibility
export type { SEOContent, ContentStyle };

// ===== Configuration =====
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 60000; // 60 seconds
const MAX_RETRIES = 2;

// ===== Model Cache =====
const MODEL_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let cachedModel: { name: string; apiKey: string; timestamp: number } | null = null;

// ===== Rate Limiting =====
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 10;

function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps older than 1 minute
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  requestTimestamps.push(now);
  return true;
}

// ===== Error Classes =====
class GeminiAPIError extends Error {
  constructor(message: string, public code: string, public retryable: boolean = false) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

// ===== Model Selection =====
async function getBestModel(apiKey: string): Promise<string> {
  if (
    cachedModel &&
    cachedModel.apiKey === apiKey &&
    Date.now() - cachedModel.timestamp < MODEL_CACHE_TTL_MS
  ) {
    return cachedModel.name;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new GeminiAPIError('Failed to fetch models', 'MODEL_FETCH_ERROR', true);
    }

    const data = await response.json();
    const models = data.models || [];
    const generateModels = models.filter((m: Record<string, any>) => 
      m.supportedGenerationMethods?.includes('generateContent')
    );

    const findModel = (name: string) => 
      generateModels.find((m: Record<string, any>) => m.name === `models/${name}`);

    let modelName = "gemini-1.5-flash";

    if (findModel('gemini-3.5-flash')) modelName = 'gemini-3.5-flash';
    else if (findModel('gemini-2.5-flash')) modelName = 'gemini-2.5-flash';
    else if (findModel('gemini-2.0-flash')) modelName = 'gemini-2.0-flash';
    else if (findModel('gemini-1.5-flash')) modelName = 'gemini-1.5-flash';
    else if (findModel('gemini-1.5-pro')) modelName = 'gemini-1.5-pro';
    else {
      const anyFlash = generateModels.find((m: Record<string, any>) => m.name.includes('flash'));
      if (anyFlash) modelName = anyFlash.name.replace('models/', '');
      else {
        const anyGemini = generateModels.find((m: Record<string, any>) => m.name.includes('gemini'));
        if (anyGemini) modelName = anyGemini.name.replace('models/', '');
      }
    }

    cachedModel = { name: modelName, apiKey, timestamp: Date.now() };
    return modelName;

  } catch (err) {
    console.error("Error fetching Gemini models:", err);
    return "gemini-1.5-flash";
  }
}

// ===== Image Validation =====
function validateImage(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new GeminiAPIError('Invalid file type. Please upload an image.', 'INVALID_IMAGE_TYPE');
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new GeminiAPIError(
      `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${MAX_IMAGE_SIZE_MB}MB`,
      'IMAGE_TOO_LARGE'
    );
  }
}

// ===== Retry Logic =====
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries && err instanceof GeminiAPIError && err.retryable) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  
  throw lastError;
}

// ===== Main Export =====
export async function generateSEOContent(
  apiKey: string,
  imageFile: File,
  productName: string,
  keyword: string,
  style: ContentStyle = 'expert'
): Promise<SEOContent> {
  // Validate inputs
  if (!apiKey?.trim()) {
    throw new GeminiAPIError('API key is required', 'MISSING_API_KEY');
  }
  
  validateImage(imageFile);
  
  // Sanitize inputs
  const safeProductName = sanitizeForPrompt(productName, 200);
  const safeKeyword = sanitizeForPrompt(keyword, 100);
  
  // Rate limiting
  if (!checkRateLimit()) {
    throw new GeminiAPIError(
      'Too many requests. Please wait a moment.',
      'RATE_LIMIT_EXCEEDED'
    );
  }
  
  return withRetry(async () => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = await getBestModel(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = style === 'expert'
      ? getExpertPrompt(safeProductName, safeKeyword)
      : getSimplePrompt(safeProductName, safeKeyword);

    const imagePart = await fileToGenerativePart(imageFile);

    // Add timeout to generation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const result = await model.generateContent([prompt, imagePart]);
      clearTimeout(timeoutId);
      
      const response = await result.response;
      const text = response.text();
      
      if (!text?.trim()) {
        throw new GeminiAPIError('Empty response from AI', 'EMPTY_RESPONSE', true);
      }
      
      return parseSEOContent(text);
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        throw new GeminiAPIError('Request timed out', 'TIMEOUT', true);
      }
      
      // Handle specific Gemini errors
      if (err.message?.includes('API key')) {
        throw new GeminiAPIError('Invalid API key', 'INVALID_API_KEY');
      }
      if (err.message?.includes('quota')) {
        throw new GeminiAPIError('API quota exceeded', 'QUOTA_EXCEEDED', true);
      }
      
      throw new GeminiAPIError(err.message || 'Generation failed', 'GENERATION_ERROR', true);
    }
  });
}

// ===== File Conversion =====
async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
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
    
    reader.onerror = () => reject(new GeminiAPIError('Failed to read image', 'IMAGE_READ_ERROR'));
    reader.readAsDataURL(file);
  });
}

// ===== Export error class for handling =====
export { GeminiAPIError };
