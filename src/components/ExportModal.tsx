import { useState, useEffect } from 'react';
import { X, Loader2, Package, DollarSign, Boxes, FolderOpen, Upload, RefreshCw, Check, Hash } from 'lucide-react';
import type { WooCommerceConfig } from '../utils/wooCommerce';
import type { SallaCategory } from '../utils/salla';

interface Category { id: number; name: string; parent: number; }

const COLORS = [
  { name: 'أسود', hex: '#000000' }, { name: 'أبيض', hex: '#FFFFFF' },
  { name: 'أحمر', hex: '#EF4444' }, { name: 'أزرق', hex: '#3B82F6' },
  { name: 'أخضر', hex: '#22C55E' }, { name: 'أصفر', hex: '#EAB308' },
  { name: 'برتقالي', hex: '#F97316' }, { name: 'وردي', hex: '#EC4899' },
  { name: 'بنفسجي', hex: '#A855F7' }, { name: 'بني', hex: '#A16207' },
  { name: 'رمادي', hex: '#6B7280' }, { name: 'بيج', hex: '#D4A574' },
  { name: 'نيلي', hex: '#1E3A5F' }, { name: 'ذهبي', hex: '#FFD700' },
  { name: 'فضي', hex: '#C0C0C0' },
];

// Extended color database for auto-detection
const COLOR_DATABASE = [
  { name: 'أسود', r: 0, g: 0, b: 0 },
  { name: 'أبيض', r: 255, g: 255, b: 255 },
  { name: 'أحمر', r: 255, g: 0, b: 0 },
  { name: 'أخضر', r: 0, g: 128, b: 0 },
  { name: 'أزرق', r: 0, g: 0, b: 255 },
  { name: 'أصفر', r: 255, g: 255, b: 0 },
  { name: 'برتقالي', r: 255, g: 165, b: 0 },
  { name: 'وردي', r: 255, g: 192, b: 203 },
  { name: 'بنفسجي', r: 128, g: 0, b: 128 },
  { name: 'بني', r: 139, g: 69, b: 19 },
  { name: 'رمادي', r: 128, g: 128, b: 128 },
  { name: 'بيج', r: 245, g: 245, b: 220 },
  { name: 'ذهبي', r: 255, g: 215, b: 0 },
  { name: 'فضي', r: 192, g: 192, b: 192 },
  { name: 'سماوي', r: 0, g: 255, b: 255 },
  { name: 'فيروزي', r: 64, g: 224, b: 208 },
  { name: 'كحلي', r: 0, g: 0, b: 128 },
  { name: 'زيتي', r: 128, g: 128, b: 0 },
  { name: 'خمري', r: 128, g: 0, b: 32 },
  { name: 'مشمشي', r: 251, g: 206, b: 177 },
];

// Auto-detect color name from hex
function getColorName(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  let closestColor = COLOR_DATABASE[0];
  let minDistance = Infinity;

  for (const color of COLOR_DATABASE) {
    const distance = Math.sqrt(
      Math.pow(r - color.r, 2) +
      Math.pow(g - color.g, 2) +
      Math.pow(b - color.b, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor.name;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '36', '38', '40', '42', '44', '46', '48'];

interface Variation { color?: string; colorHex?: string; size?: string; price: string; stock: string; }

interface ExportData {
  productType: 'simple' | 'variable';
  regularPrice: string; salePrice: string; stockQuantity: string;
  categoryId: number | null; parentCategoryId: number | null;
  userKeyword: string; variations: Variation[]; hasColors: boolean; hasSizes: boolean;
  colorDisplayType: 'text' | 'color' | 'image';
  exportPlatform: 'salla' | 'woocommerce';
}

interface ExportModalProps {
  isOpen: boolean; onClose: () => void;
  onExport: (data: ExportData) => Promise<void>;
  productName: string; userKeyword: string;
}

export const ExportModal = ({ isOpen, onClose, onExport, productName, userKeyword }: ExportModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const [exportPlatform, setExportPlatform] = useState<'woocommerce' | 'salla'>('woocommerce');
  const [sallaCategories, setSallaCategories] = useState<SallaCategory[]>([]);
  const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
  const [regularPrice, setRegularPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
  const [manualCategoryId, setManualCategoryId] = useState('');
  const [useManualCategory, setUseManualCategory] = useState(false);

  const [hasColors, setHasColors] = useState(false);
  const [hasSizes, setHasSizes] = useState(false);
  const [colorDisplayType, setColorDisplayType] = useState<'text' | 'color' | 'image'>('color');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [textOptionValues, setTextOptionValues] = useState<string[]>(['']); // For text type options
  const [customColors, setCustomColors] = useState<{ name: string, hex: string }[]>([]); // Custom picked colors
  const [imageOptions, setImageOptions] = useState<{ name: string, imageUrl: string }[]>([]); // For image type options
  const [variations, setVariations] = useState<Variation[]>([]);

  // Fetch categories when modal opens or platform changes
  useEffect(() => {
    if (isOpen) {
      fetchCategories(exportPlatform);
    }
  }, [isOpen, exportPlatform]);

  useEffect(() => {
    if (productType !== 'variable') return;
    const newVariations: Variation[] = [];

    // Get option values based on display type
    let optionValues: string[] = [];
    if (colorDisplayType === 'color') {
      optionValues = selectedColors;
    } else if (colorDisplayType === 'text') {
      optionValues = textOptionValues.filter(v => v.trim() !== '');
    }

    if (hasColors && hasSizes && optionValues.length > 0 && selectedSizes.length > 0) {
      optionValues.forEach(color => {
        const colorData = COLORS.find(c => c.name === color);
        selectedSizes.forEach(size => {
          const existing = variations.find(v => v.color === color && v.size === size);
          newVariations.push({ color, colorHex: colorData?.hex, size, price: existing?.price || regularPrice, stock: existing?.stock || '' });
        });
      });
    } else if (hasColors && optionValues.length > 0) {
      optionValues.forEach(color => {
        const colorData = COLORS.find(c => c.name === color);
        const existing = variations.find(v => v.color === color && !v.size);
        newVariations.push({ color, colorHex: colorData?.hex, price: existing?.price || regularPrice, stock: existing?.stock || '' });
      });
    } else if (hasSizes && selectedSizes.length > 0) {
      selectedSizes.forEach(size => {
        const existing = variations.find(v => v.size === size && !v.color);
        newVariations.push({ size, price: existing?.price || regularPrice, stock: existing?.stock || '' });
      });
    }
    setVariations(newVariations);
  }, [selectedColors, selectedSizes, hasColors, hasSizes, productType, colorDisplayType, textOptionValues]);

  // Fetch categories based on selected platform
  const fetchCategories = async (platform?: 'salla' | 'woocommerce') => {
    const targetPlatform = platform || exportPlatform;
    setIsLoading(true);
    setCategoryError('');

    if (targetPlatform === 'salla') {
      // Fetch Salla categories
      try {
        const sallaToken = localStorage.getItem('salla_access_token');
        if (!sallaToken) {
          setCategoryError('اربط متجر سلة أولاً من الإعدادات');
          setIsLoading(false);
          return;
        }

        // console.log('[Salla Categories] Fetching categories...');

        // Use local proxy to bypass CORS
        const response = await fetch('/api/salla/v2/categories', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sallaToken}`,
            'Content-Type': 'application/json'
          }
        });

        // console.log('[Salla Categories] Response status:', response.status);

        if (!response.ok) throw new Error(`فشل (${response.status})`);
        const data = await response.json();

        // console.log('[Salla Categories] Data:', data);

        const cats = data.data || [];
        // console.log('[Salla Categories] Found', cats.length, 'categories');

        setSallaCategories(cats);
        setCategories([]); // Clear WC categories
        setUseManualCategory(cats.length === 0);

        if (cats.length === 0) {
          setCategoryError('لا توجد تصنيفات في متجرك');
        }
      } catch (err: any) {
        console.error("[Salla category fetch error]:", err);
        setCategoryError(err.message || 'فشل تحميل تصنيفات سلة');
        setUseManualCategory(true);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fetch WooCommerce categories via local proxy (bypasses CORS)
      try {
        const savedWcStr = localStorage.getItem('wc_config');
        if (!savedWcStr) {
          setCategoryError('بيانات المتجر غير موجودة - اربط WooCommerce من الإعدادات');
          setIsLoading(false);
          return;
        }
        const config: WooCommerceConfig = JSON.parse(savedWcStr);

        // Validate config
        if (!config.storeUrl || !config.consumerKey || !config.consumerSecret) {
          setCategoryError('بيانات المتجر غير مكتملة - راجع الإعدادات');
          setIsLoading(false);
          return;
        }

        const auth = btoa(`${config.consumerKey}:${config.consumerSecret}`);

        // Use local proxy to bypass CORS
        // The proxy forwards requests to the user's WooCommerce store
        const proxyUrl = '/api/wc/products/categories?per_page=100';

        // console.log('[WooCommerce] Fetching via proxy for store:', config.storeUrl);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'X-WC-Store-URL': config.storeUrl.replace(/\/$/, '') // Pass store URL to proxy
          }
        });

        // console.log('[WooCommerce] Response status:', response.status);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || `خطأ ${response.status}`);
        }

        const data = await response.json();
        // console.log('[WooCommerce] Loaded', data.length, 'categories');

        setCategories(data);
        setSallaCategories([]);
        setUseManualCategory(data.length === 0);
        setCategoryError('');

        if (data.length === 0) {
          setCategoryError('لا توجد تصنيفات - أدخل رقم التصنيف يدوياً');
        }
      } catch (err: any) {
        console.error('[WooCommerce] Category fetch error:', err);
        setCategoryError(err.message || 'فشل تحميل التصنيفات - تأكد من صحة بيانات المتجر');
        setUseManualCategory(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCategoryChange = (catId: number | null) => {
    setCategoryId(catId);
    if (catId) {
      const cat = categories.find(c => c.id === catId);
      setParentCategoryId(cat?.parent && cat.parent > 0 ? cat.parent : null);
    } else {
      setParentCategoryId(null);
    }
  };

  const handleManualCategoryChange = (value: string) => {
    setManualCategoryId(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setCategoryId(num);
      setParentCategoryId(null);
    } else {
      setCategoryId(null);
    }
  };

  const toggleColor = (c: string) => setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleSize = (s: string) => setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const updateVariation = (i: number, field: 'price' | 'stock', value: string) => {
    const updated = [...variations]; updated[i][field] = value; setVariations(updated);
  };

  const handleExport = async () => {
    if (!regularPrice && productType === 'simple') { setError('السعر مطلوب'); return; }
    if (productType === 'variable' && variations.length === 0) { setError('اختر ألوان أو مقاسات'); return; }

    setIsExporting(true); setError('');
    try {
      await onExport({ productType, regularPrice, salePrice, stockQuantity, categoryId, parentCategoryId, userKeyword, variations, hasColors, hasSizes, colorDisplayType, exportPlatform });
      onClose();
    } catch (err: any) { setError(err.message || 'فشل'); }
    finally { setIsExporting(false); }
  };

  const getCategoryDisplayName = (cat: Category) => cat.parent > 0 ? `${categories.find(c => c.id === cat.parent)?.name || ''} → ${cat.name}` : cat.name;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      {/* Modal Container with Glow Effect */}
      <div className="relative w-full sm:max-w-2xl h-full sm:h-auto animate-fade-in-up">
        {/* Gradient Border Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-3xl opacity-30 blur-sm hidden sm:block"></div>

        {/* Modal Content */}
        <div className="relative glass-card p-4 sm:p-6 flex flex-col h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-3xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl border border-pink-500/20">
                <Upload className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-xl font-black gradient-text">تصدير للمتجر</h2>
                <p className="text-xs text-slate-400 truncate max-w-[250px]">{productName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 space-y-4 pr-1 scrollbar-thin">
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">⚠️ {error}</div>}

            {/* Keyword display */}
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-xs text-indigo-300"><strong>🎯 الكلمة المفتاحية:</strong> {userKeyword}</p>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">🛒 منصة التصدير</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportPlatform('salla')}
                  className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${exportPlatform === 'salla'
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  <span className="text-lg">🛍️</span>
                  <span>سلة</span>
                  {localStorage.getItem('salla_access_token') && (
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={() => setExportPlatform('woocommerce')}
                  className={`py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${exportPlatform === 'woocommerce'
                    ? 'bg-pink-600 text-white ring-2 ring-pink-400'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  <span className="text-lg">🛒</span>
                  <span>WooCommerce</span>
                  {localStorage.getItem('wc_config') && (
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  )}
                </button>
              </div>
              {exportPlatform === 'salla' && !localStorage.getItem('salla_access_token') && (
                <p className="text-xs text-amber-400 mt-2">⚠️ اربط متجر سلة أولاً من الإعدادات (⚙️)</p>
              )}
              {exportPlatform === 'woocommerce' && !localStorage.getItem('wc_config') && (
                <p className="text-xs text-amber-400 mt-2">⚠️ اربط WooCommerce أولاً من الإعدادات (⚙️)</p>
              )}
            </div>

            {/* Product Type */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block"><Package className="w-3 h-3 inline" /> نوع المنتج</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setProductType('simple'); setHasColors(false); setHasSizes(false); }}
                  className={`py-2 rounded-lg text-sm font-bold ${productType === 'simple' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>بسيط</button>
                <button onClick={() => setProductType('variable')}
                  className={`py-2 rounded-lg text-sm font-bold ${productType === 'variable' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>متعدد</button>
              </div>
            </div>

            {productType === 'simple' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1 block"><DollarSign className="w-3 h-3 inline" /> السعر *</label>
                    <input type="number" value={regularPrice} onChange={e => setRegularPrice(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1 block">سعر التخفيض</label>
                    <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block"><Boxes className="w-3 h-3 inline" /> الكمية</label>
                  <input type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" dir="ltr" />
                </div>
              </>
            )}

            {productType === 'variable' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">السعر الأساسي</label>
                  <input type="number" value={regularPrice} onChange={e => setRegularPrice(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" dir="ltr" />
                </div>

                {/* Option Type Section - Shown directly */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-300 font-medium mb-3">🏷️ خيارات المنتج:</p>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => { setHasColors(true); setColorDisplayType('color'); setSelectedColors([]); setTextOptionValues(['']); }}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${hasColors && colorDisplayType === 'color' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      🎨 لون
                    </button>
                    <button
                      onClick={() => { setHasColors(true); setColorDisplayType('text'); setSelectedColors([]); setTextOptionValues(['']); }}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${hasColors && colorDisplayType === 'text' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      📝 نص
                    </button>
                    <button
                      onClick={() => { setHasColors(true); setColorDisplayType('image'); setSelectedColors([]); setTextOptionValues(['']); }}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${hasColors && colorDisplayType === 'image' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      🖼️ صورة
                    </button>
                  </div>

                  {/* Color Type: Grid of color buttons + Color Picker */}
                  {hasColors && colorDisplayType === 'color' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-slate-400">اختر الألوان:</p>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-all">
                            <span className="text-xs text-slate-300">🎯 اختر لون مخصص</span>
                            <input
                              type="color"
                              className="w-6 h-6 rounded cursor-pointer border-0"
                              onChange={(e) => {
                                const hex = e.target.value;
                                const autoName = getColorName(hex);
                                setCustomColors([...customColors, { name: autoName, hex }]);
                                setSelectedColors([...selectedColors, autoName]);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Custom colors (picked with eyedropper) */}
                      {customColors.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-2">ألوان مخصصة:</p>
                          <div className="space-y-2">
                            {customColors.map((c, idx) => (
                              <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${selectedColors.includes(c.name) ? 'bg-indigo-600/20 ring-2 ring-indigo-400' : 'bg-slate-700/50'}`}>
                                <span className="w-6 h-6 rounded-full border-2 border-white/20 flex-shrink-0" style={{ backgroundColor: c.hex }}></span>
                                <input
                                  type="text"
                                  value={c.name}
                                  onChange={(e) => {
                                    const oldName = c.name;
                                    const newName = e.target.value;
                                    const newColors = [...customColors];
                                    newColors[idx] = { ...c, name: newName };
                                    setCustomColors(newColors);
                                    // Update selected colors too
                                    if (selectedColors.includes(oldName)) {
                                      setSelectedColors(selectedColors.map(s => s === oldName ? newName : s));
                                    }
                                  }}
                                  className="flex-1 bg-transparent border-b border-slate-600 focus:border-indigo-400 text-white text-sm px-1 py-0.5 outline-none"
                                  placeholder="اسم اللون"
                                />
                                <span className="text-xs text-slate-500">{c.hex}</span>
                                <button
                                  onClick={() => {
                                    setCustomColors(customColors.filter((_, i) => i !== idx));
                                    setSelectedColors(selectedColors.filter(s => s !== c.name));
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preset colors */}
                      <p className="text-xs text-slate-500 mb-2">أو اختر من الألوان الجاهزة:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {COLORS.map(c => (
                          <button key={c.name} onClick={() => toggleColor(c.name)}
                            className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all ${selectedColors.includes(c.name) ? 'bg-indigo-600/30 ring-2 ring-indigo-400' : 'bg-slate-700/50 hover:bg-slate-700'}`}>
                            <span className="w-6 h-6 rounded-full border-2 border-white/20 mb-1" style={{ backgroundColor: c.hex }}></span>
                            <span className="text-white/80">{c.name}</span>
                            {selectedColors.includes(c.name) && <Check className="w-3 h-3 text-indigo-400 mt-0.5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Type: Input fields */}
                  {hasColors && colorDisplayType === 'text' && (
                    <div>
                      <p className="text-xs text-slate-400 mb-3">أدخل قيم الخيار:</p>
                      <div className="space-y-2">
                        {textOptionValues.map((val, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={val}
                              onChange={e => {
                                const newVals = [...textOptionValues];
                                newVals[idx] = e.target.value;
                                setTextOptionValues(newVals);
                              }}
                              placeholder={`قيمة ${idx + 1} (مثال: قطن، حرير، جلد...)`}
                              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
                            />
                            {textOptionValues.length > 1 && (
                              <button
                                onClick={() => setTextOptionValues(textOptionValues.filter((_, i) => i !== idx))}
                                className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                              >✕</button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setTextOptionValues([...textOptionValues, ''])}
                          className="w-full py-2 border border-dashed border-slate-600 rounded-lg text-sm text-indigo-400 hover:border-indigo-400 hover:bg-indigo-500/10 transition-all"
                        >+ إضافة قيمة جديدة</button>
                      </div>
                    </div>
                  )}

                  {/* Image Type: Upload images for options */}
                  {hasColors && colorDisplayType === 'image' && (
                    <div>
                      <p className="text-xs text-slate-400 mb-3">رفع صور لقيم الخيار:</p>
                      <div className="space-y-3">
                        {imageOptions.map((opt, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                            {opt.imageUrl ? (
                              <img src={opt.imageUrl} alt={opt.name} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-600 flex items-center justify-center text-slate-400">🖼️</div>
                            )}
                            <input
                              type="text"
                              value={opt.name}
                              onChange={(e) => {
                                const newOpts = [...imageOptions];
                                newOpts[idx] = { ...opt, name: e.target.value };
                                setImageOptions(newOpts);
                              }}
                              placeholder="اسم الخيار"
                              className="flex-1 bg-transparent border-b border-slate-600 focus:border-indigo-400 text-white text-sm px-1 py-0.5 outline-none"
                            />
                            <label className="cursor-pointer bg-slate-600 hover:bg-slate-500 px-3 py-1.5 rounded-lg text-xs text-white transition-colors">
                              📷 رفع
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = URL.createObjectURL(file);
                                    const newOpts = [...imageOptions];
                                    newOpts[idx] = { ...opt, imageUrl: url };
                                    setImageOptions(newOpts);
                                  }
                                }}
                              />
                            </label>
                            <button
                              onClick={() => setImageOptions(imageOptions.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300"
                            >✕</button>
                          </div>
                        ))}
                        <button
                          onClick={() => setImageOptions([...imageOptions, { name: `خيار ${imageOptions.length + 1}`, imageUrl: '' }])}
                          className="w-full py-3 border border-dashed border-slate-600 rounded-lg text-sm text-indigo-400 hover:border-indigo-400 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2"
                        >
                          🖼️ + إضافة صورة جديدة
                        </button>
                      </div>
                      {imageOptions.length === 0 && (
                        <p className="text-xs text-slate-500 text-center mt-2">اضغط الزر أعلاه لإضافة صور للخيارات</p>
                      )}
                    </div>
                  )}
                </div>

                {hasSizes && (
                  <div className="p-3 bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-slate-300 mb-2">اختر المقاسات:</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map(s => (
                        <button key={s} onClick={() => toggleSize(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedSizes.includes(s) ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-slate-700 text-slate-300'}`}>
                          {s} {selectedSizes.includes(s) && <Check className="w-3 h-3 inline ml-1" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {variations.length > 0 && (
                  <div className="p-3 bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-slate-300 mb-2">التنويعات ({variations.length}):</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {variations.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center gap-1.5 min-w-[80px]">
                            {v.colorHex && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: v.colorHex }}></span>}
                            <span className="text-xs text-white">{v.color}{v.color && v.size && '-'}{v.size}</span>
                          </div>
                          <input type="number" value={v.price} onChange={e => updateVariation(i, 'price', e.target.value)} placeholder="السعر"
                            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs" dir="ltr" />
                          <input type="number" value={v.stock} onChange={e => updateVariation(i, 'stock', e.target.value)} placeholder="الكمية"
                            className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs" dir="ltr" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
            }

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  <FolderOpen className="w-3 h-3 inline" /> التصنيف
                  {exportPlatform === 'salla' ? ' (سلة)' : ' (WooCommerce)'}
                  {parentCategoryId && <span className="text-emerald-400"> (+أساسي)</span>}
                </label>
                <button onClick={() => fetchCategories()} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> {isLoading ? 'جاري...' : 'تحديث'}
                </button>
              </div>

              {/* Category dropdown or manual input toggle */}
              <div className="space-y-2">
                {/* Salla Categories */}
                {exportPlatform === 'salla' && !useManualCategory && sallaCategories.length > 0 ? (
                  <>
                    <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                      <option value="">-- بدون تصنيف --</option>
                      {sallaCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <button onClick={() => setUseManualCategory(true)} className="text-xs text-slate-500 hover:text-slate-300">
                      أو أدخل رقم التصنيف يدوياً
                    </button>
                  </>
                ) : exportPlatform === 'woocommerce' && !useManualCategory && categories.length > 0 ? (
                  /* WooCommerce Categories */
                  <>
                    <select value={categoryId || ''} onChange={e => handleCategoryChange(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                      <option value="">-- بدون تصنيف --</option>
                      {categories.sort((a, b) => a.parent - b.parent).map(cat => <option key={cat.id} value={cat.id}>{getCategoryDisplayName(cat)}</option>)}
                    </select>
                    <button onClick={() => setUseManualCategory(true)} className="text-xs text-slate-500 hover:text-slate-300">
                      أو أدخل رقم التصنيف يدوياً
                    </button>
                  </>
                ) : (
                  /* Manual Category Input */
                  <>
                    {categoryError && <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">{categoryError}</div>}
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <input type="number" value={manualCategoryId} onChange={e => handleManualCategoryChange(e.target.value)}
                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-pink-500/50 outline-none transition-all"
                        placeholder="رقم التصنيف (Category ID)" dir="ltr" />
                    </div>
                    {(categories.length > 0 || sallaCategories.length > 0) && (
                      <button onClick={() => setUseManualCategory(false)} className="text-xs text-indigo-400 hover:text-indigo-300">
                        العودة للقائمة المنسدلة
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`w-full btn-premium text-white ${exportPlatform === 'salla' ? '' : ''}`}
              style={{
                background: exportPlatform === 'salla'
                  ? 'linear-gradient(135deg, rgb(147, 51, 234), rgb(168, 85, 247))'
                  : 'linear-gradient(135deg, rgb(219, 39, 119), rgb(236, 72, 153))'
              }}
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                {isExporting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> جاري التصدير...</>
                ) : (
                  <><Upload className="w-5 h-5" /> تصدير إلى {exportPlatform === 'salla' ? 'سلة 🛍️' : 'WooCommerce 🛒'}</>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
