import type { SEOContent } from './gemini';

export interface SchemaProduct {
    "@context": string;
    "@type": string;
    name: string;
    description: string;
    image?: string;
    brand?: {
        "@type": string;
        name: string;
    };
    offers?: {
        "@type": string;
        price: string;
        priceCurrency: string;
        availability: string;
        url?: string;
    };
    aggregateRating?: {
        "@type": string;
        ratingValue: string;
        reviewCount: string;
    };
}

export interface SchemaArticle {
    "@context": string;
    "@type": string;
    headline: string;
    description?: string;
    image?: string;
    author?: {
        "@type": string;
        name: string;
    };
    publisher?: {
        "@type": string;
        name: string;
        logo?: {
            "@type": string;
            url: string;
        };
    };
    datePublished?: string;
    dateModified?: string;
}

export interface SchemaFAQ {
    "@context": string;
    "@type": string;
    mainEntity: Array<{
        "@type": string;
        name: string;
        acceptedAnswer: {
            "@type": string;
            text: string;
        };
    }>;
}

export interface SchemaOrganization {
    "@context": string;
    "@type": string;
    name: string;
    url?: string;
    logo?: string;
    description?: string;
}

export interface SchemaGeneratorOptions {
    price?: number;
    salePrice?: number;
    currency?: string;
    inStock?: boolean;
    brandName?: string;
    productUrl?: string;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
}

export function generateProductSchema(
    content: SEOContent,
    productName: string,
    options: SchemaGeneratorOptions = {}
): SchemaProduct {
    const {
        price,
        salePrice,
        currency = 'SAR',
        inStock = true,
        brandName,
        productUrl,
        imageUrl,
        rating,
        reviewCount,
    } = options;

    const schema: SchemaProduct = {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: content.h1Title || productName,
        description: content.metaDescription || content.mainContent?.substring(0, 200) || '',
    };

    // Add image
    if (imageUrl) {
        schema.image = imageUrl;
    }

    // Add brand
    if (brandName) {
        schema.brand = {
            "@type": "Brand",
            name: brandName,
        };
    }

    // Add offers
    if (price || salePrice) {
        schema.offers = {
            "@type": "Offer",
            price: String(salePrice || price),
            priceCurrency: currency,
            availability: inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
        };

        if (productUrl) {
            schema.offers.url = productUrl;
        }
    }

    // Add rating
    if (rating && reviewCount) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: String(rating),
            reviewCount: String(reviewCount),
        };
    }

    return schema;
}

export function generateArticleSchema(
    content: SEOContent,
    articleTitle: string,
    authorName?: string,
    datePublished?: string
): SchemaArticle {
    const schema: SchemaArticle = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: content.h1Title || articleTitle,
        description: content.metaDescription || content.mainContent?.substring(0, 200) || '',
        datePublished: datePublished || new Date().toISOString(),
        dateModified: new Date().toISOString(),
    };

    if (authorName) {
        schema.author = {
            "@type": "Person",
            name: authorName,
        };
    }

    return schema;
}

export function generateFAQSchema(questions: { question: string, answer: string }[]): SchemaFAQ {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map(q => ({
            "@type": "Question",
            name: q.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: q.answer
            }
        }))
    };
}

export function generateOrganizationSchema(
    name: string,
    url?: string,
    logo?: string,
    description?: string
): SchemaOrganization {
    const schema: SchemaOrganization = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name,
    };

    if (url) schema.url = url;
    if (logo) schema.logo = logo;
    if (description) schema.description = description;

    return schema;
}

export function schemaToJsonLd(schema: any): string {
    return JSON.stringify(schema, null, 2);
}

export function schemaToHtmlScript(schema: any): string {
    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}
