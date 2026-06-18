// src/utils/openai.ts — OPTIMIZED VERSION
import type { SEOContent, ContentStyle } from './types';
import { getExpertPrompt, getSimplePrompt } from './prompts';
import { parseSEOContent } from './parsers';
import { sanitizeForPrompt } from './inputSanitizer';

// Re-export types for backward compatibility
export type { SEOContent, ContentStyle };

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 60000;

// ===== Error Classes =====
class OpenAIAPIError extends Error {
  constructor(message: string, public code: string, public retryable: boolean = false) {
    super(message);
    this.name = 'OpenAIAPIError';
  }
}

// ===== Rate Limiting =====
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 10;

function checkRateLimit(): boolean {
  const now = Date.now();
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  requestTimestamps.push(now);
  return true;
}

// ===== Image Validation =====
function validateImage(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new OpenAIAPIError('Invalid file type. Please upload an image.', 'INVALID_IMAGE_TYPE');
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new OpenAIAPIError(
      `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: ${MAX_IMAGE_SIZE_MB}MB`,
      'IMAGE_TOO_LARGE'
    );
  }
}

// ===== Retry Logic =====
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  
  throw lastError;
}

export async function generateContentWithOpenAI(
  imageFile: File,
  productName: string,
  keyword: string,
  apiKey: string,
  style: ContentStyle = 'expert'
): Promise<SEOContent> {
  // Validate
  if (!apiKey?.trim()) {
    throw new OpenAIAPIError('API key is required', 'MISSING_API_KEY');
  }
  
  validateImage(imageFile);
  
  // Sanitize
  const safeProductName = sanitizeForPrompt(productName, 200);
  const safeKeyword = sanitizeForPrompt(keyword, 100);
  
  if (!checkRateLimit()) {
    throw new OpenAIAPIError('Too many requests. Please wait.', 'RATE_LIMIT_EXCEEDED');
  }
  
  return withRetry(async () => {
    const base64Image = await fileToBase64(imageFile);
    
    const prompt = style === 'expert'
      ? getExpertPrompt(safeProductName, safeKeyword)
      : getSimplePrompt(safeProductName, safeKeyword);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${imageFile.type};base64,${base64Image}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 4096,
          temperature: 0.7
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          error: { message: response.statusText } 
        }));
        
        const errorMsg = error.error?.message || response.statusText;
        
        // Map specific errors
        if (response.status === 401) {
          throw new OpenAIAPIError('Invalid API key', 'INVALID_API_KEY');
        }
        if (response.status === 429) {
          throw new OpenAIAPIError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', true);
        }
        if (response.status >= 500) {
          throw new OpenAIAPIError('OpenAI server error', 'SERVER_ERROR', true);
        }
        
        throw new OpenAIAPIError(`OpenAI API Error: ${errorMsg}`, 'API_ERROR');
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      if (!text?.trim()) {
        throw new OpenAIAPIError('Empty response', 'EMPTY_RESPONSE', true);
      }
      
      return parseSEOContent(text);
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        throw new OpenAIAPIError('Request timed out', 'TIMEOUT', true);
      }
      
      if (err instanceof OpenAIAPIError) throw err;
      throw new OpenAIAPIError(err.message || 'Generation failed', 'GENERATION_ERROR', true);
    }
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = () => reject(new OpenAIAPIError('Failed to read image', 'IMAGE_READ_ERROR'));
    reader.readAsDataURL(file);
  });
}

export { OpenAIAPIError };
