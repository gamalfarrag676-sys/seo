// Salla E-Commerce Platform Integration
// API Documentation: https://docs.salla.dev

import type { SEOContent } from './gemini';


// OAuth Configuration
export interface SallaOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Generate OAuth authorization URL with state parameter
export function getSallaAuthUrl(config: SallaOAuthConfig): string {
  // Generate random state for CSRF protection
  const state = generateRandomState();
  sessionStorage.setItem('salla_oauth_state', state);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'offline_access',
    state: state
  });
  return `https://accounts.salla.sa/oauth2/auth?${params.toString()}`;
}

// Generate random string for OAuth state
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}


// Exchange authorization code for access token (uses Vite proxy to bypass CORS)
export async function exchangeCodeForToken(
  code: string,
  config: SallaOAuthConfig
): Promise<{ success: boolean; accessToken?: string; refreshToken?: string; error?: string }> {
  try {
    // console.log('[Salla Token] Sending token exchange request...');

    // Use local proxy endpoint to bypass CORS
    const response = await fetch('/api/salla/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error_description || data.error || 'Token exchange failed' };
    }

    if (!data.access_token) {
      console.error('[Salla Token] No access_token in response!');
      return { success: false, error: 'No access token received' };
    }

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token
    };
  } catch (err: any) {
    console.error('[Salla Token] Exception:', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

// Refresh access token (uses proxy to bypass CORS)
export async function refreshSallaToken(
  refreshToken: string,
  config: SallaOAuthConfig
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    // Use local proxy endpoint (same as token exchange) to bypass CORS
    const response = await fetch('/api/salla/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret
      })
    });

    if (!response.ok) {
      return { success: false, error: 'Token refresh failed' };
    }

    const data = await response.json();
    return {
      success: true,
      accessToken: data.access_token
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export interface SallaConfig {
  accessToken: string;
  merchantId?: string;
}

export interface SallaCategory {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface SallaVariation {
  color?: string;
  size?: string;
  price: string;
  stock: string;
  sku?: string;
}

export interface SallaExportData {
  productType: 'simple' | 'variable';
  regularPrice: string;
  salePrice: string;
  stockQuantity: string;
  categoryId: number | null;
  variations: SallaVariation[];
  hasColors: boolean;
  hasSizes: boolean;
  colorDisplayType?: 'text' | 'color' | 'image';
}

// Use local proxy to bypass CORS (Vite proxies /api/salla/v2 to api.salla.dev/admin/v2)
const SALLA_API_BASE = '/api/salla/v2';

function getAuthHeader(config: SallaConfig) {
  return {
    'Authorization': `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json'
  };
}

// Test connection using products endpoint (requires products.read scope which is commonly enabled)
export async function testSallaConnection(config: SallaConfig): Promise<{ success: boolean; storeName?: string; error?: string }> {
  try {
    // Use products endpoint instead of store/info since products.read_write is more commonly enabled
    const response = await fetch(`${SALLA_API_BASE}/products?per_page=1`, {
      method: 'GET',
      headers: getAuthHeader(config)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return { success: false, error: 'Access Token غير صالح أو منتهي الصلاحية' };
      }
      if (response.status === 403) {
        return { success: false, error: 'صلاحيات غير كافية - تأكد من اختيار "المنتجات" (قراءة) في إعدادات التطبيق' };
      }

      return { success: false, error: error.error?.message || error.message || `HTTP ${response.status}` };
    }

    // Consume response body (validate it's proper JSON)
    await response.json();

    // Token is valid - return success
    return { success: true, storeName: 'متجر سلة' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطأ في الاتصال';
    return { success: false, error: message };
  }
}

// Get categories
export async function getSallaCategories(config: SallaConfig): Promise<SallaCategory[]> {
  try {
    const response = await fetch(`${SALLA_API_BASE}/categories`, {
      method: 'GET',
      headers: getAuthHeader(config)
    });

    if (!response.ok) {
      console.error('Failed to fetch Salla categories');
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (err) {
    console.error('Error fetching Salla categories:', err);
    return [];
  }
}

// Upload image to Salla
export async function _uploadImageToSalla(config: SallaConfig, imageBlob: Blob, filename: string): Promise<string | null> {
  try {
    // Convert blob to base64
    const base64 = await blobToBase64(imageBlob);

    const response = await fetch(`${SALLA_API_BASE}/products/images/upload`, {
      method: 'POST',
      headers: getAuthHeader(config),
      body: JSON.stringify({
        image: base64,
        name: filename
      })
    });

    if (!response.ok) {
      // Try alternative: direct URL upload might be needed
      console.warn('Direct image upload failed, product will be created without image');
      return null;
    }

    const data = await response.json();
    return data.data?.url || null;
  } catch (err) {
    console.error('Error uploading image to Salla:', err);
    return null;
  }
}

// Create product in Salla
export async function createProductInSalla(
  config: SallaConfig,
  content: SEOContent,
  imageBlob: Blob,
  _imageName: string,
  productName: string,
  exportData: SallaExportData
): Promise<{ success: boolean; productId?: number; productUrl?: string; error?: string }> {
  try {
    // 1. Prepare product data according to Salla UI structure
    // Based on actual Salla dashboard screenshots
    const productData: any = {
      // المعلومات الأساسية
      name: content.h1Title || productName || 'منتج جديد',

      // السعر - رقم بسيط (مطلوب)
      price: parseFloat(exportData.regularPrice) || 100,

      // نوع المنتج - 'product' = منتج ملموس
      product_type: 'product',

      // الوصف
      description: formatDescriptionForSalla(content),

      // الكمية - إذا المنتج متعدد، نحسب الكمية الإجمالية
      // الكمية المُدخلة × عدد الألوان (أو المقاسات)
      quantity: (() => {
        const inputQty = parseInt(exportData.stockQuantity) || 10; // افتراضي 10
        const numColors = exportData.hasColors ?
          [...new Set(exportData.variations.filter(v => v.color).map(v => v.color))].length : 0;
        const numSizes = exportData.hasSizes ?
          [...new Set(exportData.variations.filter(v => v.size).map(v => v.size))].length : 0;

        // إذا المنتج له خيارات، الكمية = كمية لكل خيار × عدد الخيارات
        if (numColors > 0) {
          const total = inputQty * numColors;
          // console.log(`[Salla] Quantity: ${inputQty} per color × ${numColors} colors = ${total}`);
          return total;
        }
        if (numSizes > 0) {
          const total = inputQty * numSizes;
          // console.log(`[Salla] Quantity: ${inputQty} per size × ${numSizes} sizes = ${total}`);
          return total;
        }
        // console.log(`[Salla] Quantity: ${inputQty} (simple product)`);
        return inputQty;
      })(),

      // الشحن - مطلوب للمتاجر
      require_shipping: true,

      // الوزن بالكيلوجرام
      weight: 0.5,
      weight_type: 'kg',

      // بيانات SEO
      metadata_title: (content.metaTitle || content.h1Title || productName || '').substring(0, 70),
      metadata_description: (content.metaDescription || '').substring(0, 150)
      // ملاحظة: لا نرسل url لأن سلة ستنشئه تلقائياً من اسم المنتج
    };

    // السعر المخفض (اختياري)
    if (exportData.salePrice && parseFloat(exportData.salePrice) > 0) {
      productData.sale_price = parseFloat(exportData.salePrice);
    }

    // التصنيفات
    if (exportData.categoryId) {
      productData.categories = [exportData.categoryId];
    }

    // console.log('[Salla Create] Sending product data:', JSON.stringify(productData, null, 2));

    // 2. Create the product
    const response = await fetch(`${SALLA_API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeader(config),
      body: JSON.stringify(productData)
    });

    const responseData = await response.json();
    // console.log('[Salla Create] Response:', response.status, JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      // Extract detailed error message - handle various Salla error formats
      let errorMsg = '';

      if (responseData.errors && typeof responseData.errors === 'object') {
        // Handle field-specific errors like { "name": ["required"], "price": ["must be number"] }
        const fieldErrors = Object.entries(responseData.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ');
        errorMsg = fieldErrors || JSON.stringify(responseData.errors);
      } else if (responseData.message) {
        errorMsg = responseData.message;
      } else if (responseData.error?.message) {
        errorMsg = responseData.error.message;
      } else {
        errorMsg = response.statusText;
      }

      console.error('[Salla Create] Error details:', errorMsg);
      throw new Error(`فشل إنشاء المنتج: ${errorMsg}`);
    }

    const productId = responseData.data?.id;

    if (!productId) {
      throw new Error('لم يتم الحصول على معرف المنتج');
    }

    // 3. Upload and attach image using FormData (multipart/form-data)
    // console.log('[Salla Create] Uploading image for product:', productId);
    try {
      // Try with 'photo' field name (common in Salla API)
      const formData = new FormData();
      formData.append('photo', imageBlob, 'product-image.jpg');

      const imgResponse = await fetch(`${SALLA_API_BASE}/products/${productId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        },
        body: formData
      });

      await imgResponse.json();
      // console.log('[Salla Create] Image upload result:', imgResponse.status);

      if (!imgResponse.ok) {
        console.warn('[Salla Create] Upload with "photo" failed, trying "file"...');

        // Try with 'file' field name
        const formData2 = new FormData();
        formData2.append('file', imageBlob, 'product-image.jpg');

        const imgResponse2 = await fetch(`${SALLA_API_BASE}/products/${productId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`
          },
          body: formData2
        });

        await imgResponse2.json();
        // console.log('[Salla Create] Image upload with "file":', imgResponse2.status);
      } else {
        // console.log('[Salla Create] Image uploaded successfully!');
      }
    } catch (imgErr) {
      console.error('[Salla Create] Image upload error:', imgErr);
    }

    // 4. Add product options (colors/sizes) if any
    if (exportData.hasColors || exportData.hasSizes) {
      // console.log('[Salla Create] Adding product options...');
      await addSallaVariations(config, productId, exportData);
    }

    return {
      success: true,
      productId: productId,
      productUrl: responseData.data?.url || `https://s.salla.sa/products/${productId}`
    };

  } catch (err: any) {
    console.error('Error creating product in Salla:', err);
    return {
      success: false,
      error: err.message || 'حدث خطأ أثناء إنشاء المنتج'
    };
  }
}

// Add product options (خيارات المنتج) to a Salla product
async function addSallaVariations(
  config: SallaConfig,
  productId: number,
  exportData: SallaExportData
): Promise<void> {
  // console.log('[Salla Options] Adding options for product:', productId);
  // console.log('[Salla Options] hasColors:', exportData.hasColors, 'hasSizes:', exportData.hasSizes);

  // Calculate quantity per variation
  const totalQty = parseInt(exportData.stockQuantity) || 10;

  // Map Arabic color names to hex codes
  const colorHexMap: Record<string, string> = {
    'أسود': '#000000',
    'أبيض': '#FFFFFF',
    'أحمر': '#FF0000',
    'أزرق': '#0000FF',
    'أخضر': '#00FF00',
    'أصفر': '#FFFF00',
    'برتقالي': '#FFA500',
    'وردي': '#FFC0CB',
    'بنفسجي': '#800080',
    'رمادي': '#808080',
    'بني': '#8B4513',
    'ذهبي': '#FFD700',
    'فضي': '#C0C0C0',
    'كحلي': '#000080',
    'بيج': '#F5F5DC'
  };

  // Add color option
  if (exportData.hasColors) {
    const colorValues = [...new Set(exportData.variations.filter(v => v.color).map(v => v.color!))];
    // console.log('[Salla Options] Color values:', colorValues);

    // Create a map of color -> quantity from the variations
    const colorQuantityMap: Record<string, number> = {};
    for (const v of exportData.variations) {
      if (v.color && v.stock) {
        colorQuantityMap[v.color] = parseInt(String(v.stock)) || 10;
      }
    }
    // console.log('[Salla Options] Color quantities:', colorQuantityMap);

    if (colorValues.length > 0) {
      try {
        // Get display type from user selection (default to 'color')
        const displayType = exportData.colorDisplayType || 'color';

        // Create option with selected display type
        const optionData = {
          name: 'اللون',
          display_type: displayType,
          values: colorValues.map(c => ({
            name: c,
            display_value: displayType === 'color' ? (colorHexMap[c] || '#000000') : c
          }))
        };

        // console.log(`[Salla Options] Creating color option with display_type: ${displayType}`);
        const response = await fetch(`${SALLA_API_BASE}/products/${productId}/options`, {
          method: 'POST',
          headers: getAuthHeader(config),
          body: JSON.stringify(optionData)
        });

        const result = await response.json();
        // console.log('[Salla Options] Color option result:', response.status);

        // Update option values with display_value (color hex) - CORRECT ENDPOINT
        if (result.success && result.data?.values) {
          // console.log('[Salla Options] Updating color values with hex codes...');

          for (let i = 0; i < result.data.values.length; i++) {
            const value = result.data.values[i];
            const cleanHex = (colorHexMap[colorValues[i]] || '#000000').replace('#', '');

            try {
              // CORRECT: PUT /products/options/values/{value}
              await fetch(`${SALLA_API_BASE}/products/options/values/${value.id}`, {
                method: 'PUT',
                headers: getAuthHeader(config),
                body: JSON.stringify({
                  color: `#${cleanHex}` // Set the custom hex code
                })
              });
              // console.log(`[Salla Options] Value ${value.name} color updated`);
            } catch (valErr) {
              console.warn('[Salla Options] Failed to update value color:', value.id, valErr);
            }
          }
        }

        // Update quantities using bulk endpoint - CORRECT ENDPOINT
        if (result.success && result.data?.skus && result.data.skus.length > 0) {
          // console.log('[Salla Options] Updating quantities via bulk endpoint...');

          try {
            // Get branch ID from first SKU
            const branchId = result.data.skus[0]?.branches_quantities?.[0]?.id;

            if (branchId) {
              // Build bulk quantities payload with ACTUAL quantities from variations
              const bulkPayload = {
                products: result.data.skus.map((sku: any, index: number) => {
                  // Get the quantity for this color from user input
                  const colorName = colorValues[index];
                  const qty = colorQuantityMap[colorName] || 10;
                  // console.log(`[Salla Bulk] Color ${colorName} -> quantity ${qty}`);

                  return {
                    identifer_type: 'variant_id',
                    identifer: String(sku.id),
                    quantity: qty,
                    mode: 'overwrite',
                    branch: String(branchId)
                  };
                })
              };

              // console.log('[Salla Bulk] Sending:', JSON.stringify(bulkPayload, null, 2));

              const bulkUpdate = await fetch(`${SALLA_API_BASE}/products/quantities/bulk`, {
                method: 'POST',
                headers: getAuthHeader(config),
                body: JSON.stringify(bulkPayload)
              });
              await bulkUpdate.json();
              // console.log(`[Salla Bulk] Quantities update:`, bulkUpdate.status);
            } else {
              console.warn('[Salla Bulk] No branch ID found');
            }
          } catch (bulkErr) {
            console.warn('[Salla Bulk] Failed to update quantities:', bulkErr);
          }
        }
      } catch (err) {
        console.error('[Salla Options] Failed to add color option:', err);
      }
    }
  }

  // Add size option
  if (exportData.hasSizes) {
    const sizeValues = [...new Set(exportData.variations.filter(v => v.size).map(v => v.size!))];
    // console.log('[Salla Options] Size values:', sizeValues);
    const inputQty = Math.ceil(totalQty / sizeValues.length);

    if (sizeValues.length > 0) {
      try {
        const optionData = {
          name: 'المقاس',
          display_type: 'text',
          values: sizeValues.map(s => ({ name: s }))
        };

        // console.log('[Salla Options] Creating size option...');
        const response = await fetch(`${SALLA_API_BASE}/products/${productId}/options`, {
          method: 'POST',
          headers: getAuthHeader(config),
          body: JSON.stringify(optionData)
        });

        const result = await response.json();
        // console.log('[Salla Options] Size option result:', response.status);

        // Update SKUs with quantities
        if (result.success && result.data?.skus) {
          // console.log('[Salla Options] Updating size SKUs with quantities...');
          for (const sku of result.data.skus) {
            try {
              await fetch(`${SALLA_API_BASE}/products/${productId}/skus/${sku.id}`, {
                method: 'PUT',
                headers: getAuthHeader(config),
                body: JSON.stringify({
                  stock_quantity: inputQty
                })
              });
              // console.log(`[Salla Options] Size SKU ${sku.id} updated`);
            } catch (skuErr) {
              console.warn('[Salla Options] Failed to update size SKU:', sku.id, skuErr);
            }
          }
        }
      } catch (err) {
        console.error('[Salla Options] Failed to add size option:', err);
      }
    }
  }

  // console.log('[Salla Options] Finished adding options');
}

// Format description for Salla (clean HTML)
function formatDescriptionForSalla(content: SEOContent): string {
  let text = content.mainContent
    .replace(/\(التفاصيل التقنية\)/g, '')
    .replace(/\(تجارب واقعية\)/g, '')
    .replace(/\(رأي الخبراء\)/g, '')
    .replace(/\[السيناريو\]:\s*/g, '')
    .replace(/^---+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Convert markdown to HTML
  let html = `<h1>${content.h1Title}</h1>\n`;
  html += text
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^[\*\-•]\s*(.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*?<\/li>\n?)+/gs, match => `<ul>${match.replace(/\n/g, '')}</ul>`);

  // Wrap bare text in paragraphs
  html = html.split(/\n\n+/).map(block => {
    block = block.trim();
    if (!block || block.startsWith('<')) return block;
    return `<p>${block.replace(/\n/g, ' ')}</p>`;
  }).filter(Boolean).join('\n');

  return html.replace(/<p>\s*<\/p>/g, '').replace(/<h2>\s*<\/h2>/g, '').trim();
}

// Helper: Convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix if present
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
