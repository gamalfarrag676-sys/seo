// Shared types for SEO content generation (used by both Gemini and OpenAI)

export interface SEOContent {
  h1Title: string;
  mainContent: string;
  keywords: string;
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
  altText: string;
}

export type ContentStyle = 'expert' | 'simple';
