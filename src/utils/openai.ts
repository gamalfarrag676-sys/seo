// OpenAI GPT-4o Integration for SEO Content Generation

import type { SEOContent, ContentStyle } from './types';
import { getExpertPrompt, getSimplePrompt } from './prompts';
import { parseSEOContent } from './parsers';

// Re-export types for backward compatibility
export type { SEOContent, ContentStyle };

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function generateContentWithOpenAI(
  imageFile: File,
  productName: string,
  keyword: string,
  apiKey: string,
  style: ContentStyle = 'expert'
): Promise<SEOContent> {

  const base64Image = await fileToBase64(imageFile);

  const prompt = style === 'expert'
    ? getExpertPrompt(productName, keyword)
    : getSimplePrompt(productName, keyword);

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
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';

  return parseSEOContent(text);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
