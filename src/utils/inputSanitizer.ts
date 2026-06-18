// Input Sanitization — Protects against Prompt Injection attacks
// Cleans user inputs before embedding them in AI prompts

/**
 * Characters and patterns that could be used for prompt injection
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
  /forget\s+(all\s+)?(previous|above|prior)/gi,
  /you\s+are\s+now\s+a/gi,
  /act\s+as\s+(a|an|if)/gi,
  /new\s+instructions?:/gi,
  /system\s*prompt:/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|.*?\|>/g,  // Special tokens like <|system|>, <|user|>
];

/**
 * Max allowed length for various input fields
 */
const MAX_LENGTHS = {
  keyword: 100,
  productName: 2000,
  description: 5000,
} as const;

/**
 * Sanitize text input before including it in an AI prompt.
 * Removes potential prompt injection patterns while preserving legitimate content.
 */
export function sanitizeForPrompt(input: string, maxLength: number = MAX_LENGTHS.description): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove potential injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Remove excessive special characters that aren't typical in Arabic/English product text
  // Keep: Arabic chars, Latin chars, numbers, common punctuation, emoji
  sanitized = sanitized
    .replace(/[`$\\]/g, '') // Remove shell-dangerous chars
    .replace(/\n{4,}/g, '\n\n\n') // Limit consecutive newlines
    .trim();
  
  return sanitized;
}

/**
 * Validate and sanitize a keyword input
 */
export function sanitizeKeyword(keyword: string): string {
  return sanitizeForPrompt(keyword, MAX_LENGTHS.keyword);
}

/**
 * Validate and sanitize a product name/description input
 */
export function sanitizeProductName(productName: string): string {
  return sanitizeForPrompt(productName, MAX_LENGTHS.productName);
}
