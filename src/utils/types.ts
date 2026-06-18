// Shared types for SEO content generation (used by both Gemini and OpenAI)

export interface SEOContent {
  h1Title: string;
  metaTitle: string;
  metaDescription: string;
  mainContent: string;
  altText: string;
  tags?: string[];
}

export type ContentStyle = 'expert' | 'simple';
