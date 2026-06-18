import type { SEOContent } from './gemini';

export interface WooCommerceConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  wpUsername: string;
  wpAppPassword: string;
}

export interface Variation {
  color?: string;
  colorHex?: string;
  size?: string;
  price: string;
  stock: string;
}

export interface ExportData {
  productType: 'simple' | 'variable';
  regularPrice: string;
  salePrice: string;
  stockQuantity: string;
  categoryId: number | null;
  parentCategoryId: number | null;
  userKeyword: string;
  variations: Variation[];
  hasColors: boolean;
  hasSizes: boolean;
  colorDisplayType?: 'text' | 'color' | 'image';
  exportPlatform: 'salla' | 'woocommerce';
}

const cleanUrl = (url: string) => url.replace(/\/$/, '');

const getWcAuthHeader = (config: WooCommerceConfig) => {
  return `Basic ${btoa(`${config.consumerKey}:${config.consumerSecret}`)}`;
};

const getWpAuthHeader = (config: WooCommerceConfig) => {
  return `Basic ${btoa(`${config.wpUsername}:${config.wpAppPassword}`)}`;
};

function cleanAndConvertToHtml(markdown: string): string {
  let text = markdown
    .replace(/\(التفاصيل التقنية\)/g, '')
    .replace(/\(تجارب واقعية\)/g, '')
    .replace(/\(رأي الخبراء\)/g, '')
    .replace(/\[السيناريو\]:\s*/g, '')
    .replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  let html = text
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^س:\s*(.*$)/gm, '<p><strong>س: $1</strong></p>')
    .replace(/^ج:\s*(.*$)/gm, '<p>ج: $1</p>')
    .replace(/^[\*\-•]\s*(.*$)/gm, '<li>$1</li>');

  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, match => `<ul>${match.replace(/\n/g, '')}</ul>`);

  html = html.split(/\n\n+/).map(block => {
    block = block.trim();
    if (!block || block.startsWith('<')) return block;
    return `<p>${block.replace(/\n/g, ' ')}</p>`;
  }).filter(Boolean).join('\n');

  return html.replace(/<p>\s*<\/p>/g, '').replace(/<h2>\s*<\/h2>/g, '').trim();
}

async function uploadImage(config: WooCommerceConfig, imageBlob: Blob, filename: string, altText: string): Promise<number> {
  const formData = new FormData();
  formData.append('file', imageBlob, filename);

  const response = await fetch(`${cleanUrl(config.storeUrl)}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: { 'Authorization': getWpAuthHeader(config) },
    body: formData
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`فشل رفع الصورة: ${err.message || response.statusText}`);
  }

  const data = await response.json();

  if (altText) {
    try {
      await fetch(`${cleanUrl(config.storeUrl)}/wp-json/wp/v2/media/${data.id}`, {
        method: 'POST',
        headers: { 'Authorization': getWpAuthHeader(config), 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text: altText })
      });
    } catch (e) { console.warn('Failed to set alt text:', e); }
  }

  return data.id;
}

async function createVariation(
  config: WooCommerceConfig,
  productId: number,
  variation: Variation,
  hasColors: boolean,
  hasSizes: boolean
) {
  const attributes = [];

  if (hasColors && variation.color) {
    attributes.push({ name: 'اللون', option: variation.color });
  }
  if (hasSizes && variation.size) {
    attributes.push({ name: 'المقاس', option: variation.size });
  }

  const variationData: any = {
    regular_price: variation.price,
    attributes
  };

  if (variation.stock) {
    variationData.manage_stock = true;
    variationData.stock_quantity = parseInt(variation.stock);
  }

  const response = await fetch(`${cleanUrl(config.storeUrl)}/wp-json/wc/v3/products/${productId}/variations`, {
    method: 'POST',
    headers: {
      'Authorization': getWcAuthHeader(config),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(variationData)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    console.error('Variation creation failed:', err);
  }

  return response.json();
}

export async function createProductInWooCommerce(
  config: WooCommerceConfig,
  content: SEOContent,
  imageBlob: Blob,
  imageName: string,
  productName: string,
  exportData: ExportData
) {
  const altText = content.altText || content.h1Title || productName || '';

  // 1. Upload image
  const imageId = await uploadImage(config, imageBlob, imageName, altText);

  // 2. Prepare description with H1
  const htmlDescription = `<h1>${content.h1Title || productName}</h1>\n` + cleanAndConvertToHtml(content.mainContent);

  // 3. Build attributes for variable product
  const attributes = [];
  if (exportData.productType === 'variable') {
    if (exportData.hasColors) {
      const colorOptions = [...new Set(exportData.variations.filter(v => v.color).map(v => v.color!))];
      attributes.push({
        name: 'اللون',
        position: 0,
        visible: true,
        variation: true,
        options: colorOptions
      });
    }
    if (exportData.hasSizes) {
      const sizeOptions = [...new Set(exportData.variations.filter(v => v.size).map(v => v.size!))];
      attributes.push({
        name: 'المقاس',
        position: 1,
        visible: true,
        variation: true,
        options: sizeOptions
      });
    }
  }

  // 4. Prepare product data
  const productData: any = {
    name: content.h1Title || productName || 'New Product',
    type: exportData.productType,
    description: htmlDescription,
    short_description: content.metaDescription,
    images: [{ id: imageId, alt: altText }],
    meta_data: [
      { key: '_yoast_wpseo_title', value: content.metaTitle },
      { key: '_yoast_wpseo_metadesc', value: content.metaDescription },
      { key: '_yoast_wpseo_focuskw', value: exportData.userKeyword }
    ]
  };

  // Simple product fields
  if (exportData.productType === 'simple') {
    productData.regular_price = exportData.regularPrice;
    if (exportData.salePrice) productData.sale_price = exportData.salePrice;
    if (exportData.stockQuantity) {
      productData.manage_stock = true;
      productData.stock_quantity = parseInt(exportData.stockQuantity);
    }
  } else {
    // Variable product
    productData.attributes = attributes;
  }

  // Categories
  const categories: { id: number }[] = [];
  if (exportData.parentCategoryId && exportData.parentCategoryId !== exportData.categoryId) {
    categories.push({ id: exportData.parentCategoryId });
  }
  if (exportData.categoryId) {
    categories.push({ id: exportData.categoryId });
  }
  if (categories.length > 0) productData.categories = categories;

  // 5. Create product
  const response = await fetch(`${cleanUrl(config.storeUrl)}/wp-json/wc/v3/products`, {
    method: 'POST',
    headers: {
      'Authorization': getWcAuthHeader(config),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`فشل إنشاء المنتج: ${err.message || response.statusText}`);
  }

  const product = await response.json();

  // 6. Create variations for variable products
  if (exportData.productType === 'variable' && exportData.variations.length > 0) {
    for (const variation of exportData.variations) {
      await createVariation(config, product.id, variation, exportData.hasColors, exportData.hasSizes);
    }
  }

  return product;
}
