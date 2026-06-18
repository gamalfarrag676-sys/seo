// Shared SEO content parser (used by both Gemini and OpenAI)
// Extracted to eliminate code duplication between the two providers

import type { SEOContent } from './types';

/**
 * Parse AI-generated text into structured SEO content sections.
 * Expects text with <<<TAG>>> markers separating sections.
 */
export function parseSEOContent(text: string): SEOContent {
  // Remove potential markdown code blocks
  const cleanText = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();

  // Robust regex: Tolerates optional spaces inside brackets
  const getSection = (tag: string): string => {
    const regex = new RegExp(`<<<\\s*${tag}\\s*>>>([\\s\\S]*?)(?=<<<|$)`, 'i');
    const match = cleanText.match(regex);
    return match ? match[1].trim() : '';
  };

  // Check for the opening bracket of a known tag
  const hasMarkers = cleanText.includes('<<<');

  if (!hasMarkers) {
    console.warn('No SEO markers found in AI output. Returning raw text.');
    return {
      h1Title: '',
      mainContent: cleanText,
      keywords: '',
      metaTitle: '',
      metaDescription: '',
      urlSlug: '',
      altText: ''
    };
  }

  const content: SEOContent = {
    h1Title: getSection('H1_TITLE'),
    mainContent: getSection('MAIN_CONTENT'),
    keywords: getSection('KEYWORDS'),
    metaTitle: getSection('META_TITLE'),
    metaDescription: getSection('META_DESCRIPTION'),
    urlSlug: getSection('URL_SLUG'),
    altText: getSection('ALT_TEXT'),
  };

  // Fallback: If parsing failed effectively (empty main content), use raw text
  if (!content.mainContent && !content.h1Title && cleanText.length > 50) {
    console.warn('Parsed content empty. Falling back to raw text.');
    content.mainContent = cleanText;
  }

  return content;
}
