import { useState, useEffect } from 'react';
import { testSallaConnection } from '../utils/salla';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import { getUserStore, saveUserStore, type Store } from '../lib/supabase';
import { Key, Save, Eye, EyeOff, AlertTriangle, ShoppingCart, Globe, Lock, User } from 'lucide-react';

interface WooCommerceConfig {
    storeUrl: string;
    consumerKey: string;
    consumerSecret: string;
    wpUsername: string;
    wpAppPassword: string;
}

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
}

export const ApiKeyModal = ({ isOpen, onClose, onSave }: ApiKeyModalProps) => {
    const toast = useToast();
    const { isAdmin } = useAuth();
    // For non-admin users, default to 'salla' tab (first visible tab)
    const [activeTab, setActiveTab] = useState<'general' | 'openai' | 'salla' | 'woocommerce'>(isAdmin ? 'general' : 'salla');

    // General (Gemini)
    const [key, setKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState('');
    // OpenAI
    const [openaiKey, setOpenaiKey] = useState('');
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [openaiError, setOpenaiError] = useState('');
    // Salla
    const [sallaStoreName, setSallaStoreName] = useState('');
    const [sallaConnected, setSallaConnected] = useState(false);
    // Salla Access Token
    const [sallaAccessToken, setSallaAccessToken] = useState('');
    const [showAccessToken, setShowAccessToken] = useState(false);




    const [wcUrl, setWcUrl] = useState('');
    const [wcKey, setWcKey] = useState('');
    const [wcSecret, setWcSecret] = useState('');
    const [wpUsername, setWpUsername] = useState('');
    const [wpAppPassword, setWpAppPassword] = useState('');
    const [showWcSecret, setShowWcSecret] = useState(false);
    const [showWpPassword, setShowWpPassword] = useState(false);
    // Loading states for UI (set but not read - can be used for spinners later)
    const [, setLoadingStores] = useState(false);
    const [, setSavingStore] = useState(false);


    const { profile } = useAuth();

    useEffect(() => {
        if (!isOpen) return;

        // Load Gemini Key (still from localStorage for admin)
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) setKey(savedKey);

        // Load OpenAI Key (still from localStorage for admin)
        const savedOpenaiKey = localStorage.getItem('openai_api_key');
        if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);

        // Load store data from database (linked to user account)
        const loadStoresFromDB = async () => {
            if (!profile?.id) return;
            setLoadingStores(true);

            try {
                // Load Salla store
                const sallaStore = await getUserStore(profile.id, 'salla');
                if (sallaStore) {
                    setSallaAccessToken(sallaStore.access_token || '');
                    setSallaStoreName(sallaStore.store_name || '');
                    setSallaConnected(!!sallaStore.access_token);
                }

                // Load WooCommerce store
                const wcStore = await getUserStore(profile.id, 'woocommerce');
                if (wcStore) {
                    setWcUrl(wcStore.store_url || '');
                    setWcKey(wcStore.consumer_key || '');
                    setWcSecret(wcStore.consumer_secret || '');
                    setWpUsername(wcStore.wp_username || '');
                    setWpAppPassword(wcStore.wp_app_password || '');
                }
            } catch (err) {
                console.error('Error loading stores from DB:', err);
            } finally {
                setLoadingStores(false);
            }
        };

        loadStoresFromDB();
    }, [isOpen, profile?.id]);

    const handleSaveGemini = () => {
        if (!key.trim()) {
            setError('يرجى إدخال مفتاح API صحيح');
            return;
        }
        if (key.trim().length < 20) {
            setError('يبدو أن المفتاح قصير جداً وغير صحيح');
            return;
        }
        localStorage.setItem('gemini_api_key', key.trim());
        onSave(key.trim());
        window.dispatchEvent(new Event('api-keys-updated'));
        setError('');
        toast.success('تم حفظ مفتاح Gemini بنجاح ✓');
    };





    const handleSaveSallaToken = async () => {
        if (!sallaAccessToken.trim()) {
            toast.warning('يرجى إدخال Access Token');
            return;
        }
        if (!profile?.id) {
            toast.error('يجب تسجيل الدخول أولاً');
            return;
        }

        toast.info('جاري التحقق من الاتصال...');

        // Test the connection
        const result = await testSallaConnection({ accessToken: sallaAccessToken.trim() });

        if (result.success) {
            setSavingStore(true);

            // Save to database
            const store: Store = {
                user_id: profile.id,
                platform: 'salla',
                access_token: sallaAccessToken.trim(),
                store_name: result.storeName || ''
            };

            const saveResult = await saveUserStore(store);
            setSavingStore(false);

            if (saveResult.success) {
                // Also save to localStorage for quick access
                localStorage.setItem('salla_access_token', sallaAccessToken.trim());
                if (result.storeName) {
                    localStorage.setItem('salla_store_name', result.storeName);
                    setSallaStoreName(result.storeName);
                }
                setSallaConnected(true);
                toast.success('تم ربط سلة بنجاح! 🛍️ (مرتبطة بحسابك)');
            } else {
                toast.error('فشل الحفظ: ' + saveResult.error);
            }
        } else {
            toast.error('فشل الاتصال: ' + (result.error || 'تأكد من صحة Access Token'));
        }
    };

    const handleDisconnectSalla = async () => {
        if (!profile?.id) return;

        // Delete from database
        await saveUserStore({
            user_id: profile.id,
            platform: 'salla',
            access_token: '',
            store_name: ''
        });

        // Clear localStorage
        localStorage.removeItem('salla_access_token');
        localStorage.removeItem('salla_store_name');
        setSallaAccessToken('');
        setSallaStoreName('');
        setSallaConnected(false);
        toast.success('تم إلغاء ربط سلة');
    };

    const handleSaveOpenAI = () => {
        if (!openaiKey.trim()) {
            setOpenaiError('يرجى إدخال مفتاح API صحيح');
            return;
        }
        if (!openaiKey.startsWith('sk-')) {
            setOpenaiError('يبدو أن صيغة المفتاح غير صحيحة (يجب أن يبدأ بـ sk-)');
            return;
        }
        localStorage.setItem('openai_api_key', openaiKey.trim());
        window.dispatchEvent(new Event('api-keys-updated'));
        setOpenaiError('');
        toast.success('تم حفظ مفتاح OpenAI بنجاح ✓');
    };

    const handleSaveWooCommerce = async () => {
        if (!wcUrl || !wcKey || !wcSecret || !wpUsername || !wpAppPassword) {
            toast.warning('الرجاء تعبئة جميع حقول WooCommerce');
            return;
        }
        if (!profile?.id) {
            toast.error('يجب تسجيل الدخول أولاً');
            return;
        }

        setSavingStore(true);

        const store: Store = {
            user_id: profile.id,
            platform: 'woocommerce',
            store_url: wcUrl.trim(),
            consumer_key: wcKey.trim(),
            consumer_secret: wcSecret.trim(),
            wp_username: wpUsername.trim(),
            wp_app_password: wpAppPassword.trim().replace(/\s/g, '')
        };

        const result = await saveUserStore(store);
        setSavingStore(false);

        if (result.success) {
            // Also save to localStorage for quick access during export
            const config: WooCommerceConfig = {
                storeUrl: store.store_url!,
                consumerKey: store.consumer_key!,
                consumerSecret: store.consumer_secret!,
                wpUsername: store.wp_username!,
                wpAppPassword: store.wp_app_password!
            };
            localStorage.setItem('wc_config', JSON.stringify(config));
            toast.success('تم حفظ إعدادات المتجر بنجاح ✓ (مرتبطة بحسابك)');
        } else {
            toast.error('فشل الحفظ: ' + result.error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            {/* Modal Container with Glow Effect */}
            <div className="relative w-full max-w-lg animate-fade-in-up">
                {/* Gradient Border Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-30 blur-sm"></div>

                {/* Modal Content */}
                <div className="relative glass-card p-6 md:p-8 flex flex-col max-h-[85vh] space-y-6">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all z-10"
                    >
                        ✕
                    </button>

                    {/* Header Title */}
                    <div className="text-center pt-2">
                        <h2 className="text-2xl font-black gradient-text">الإعدادات</h2>
                        <p className="text-slate-500 text-sm mt-1">إدارة مفاتيح API والمتاجر</p>
                    </div>

                    {/* Premium Tabs */}
                    <div className="flex gap-1.5 p-1.5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                        {/* AI Tabs - Admin Only */}
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setActiveTab('general')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'general'
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span>✨</span>
                                    <span>Gemini</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('openai')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'openai'
                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span>🤖</span>
                                    <span>ChatGPT</span>
                                </button>
                            </>
                        )}

                        {/* Store Tabs - All Users */}
                        <button
                            onClick={() => setActiveTab('salla')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'salla'
                                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-900/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                        >
                            <span>🛍️</span>
                            <span>سلة</span>
                            {sallaConnected && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>}
                        </button>

                        <button
                            onClick={() => setActiveTab('woocommerce')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'woocommerce'
                                ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg shadow-pink-900/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                        >
                            <span>🛒</span>
                            <span>WooCommerce</span>
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto flex-1 space-y-6 scrollbar-thin">

                        {/* --- GEMINI TAB --- */}
                        {activeTab === 'general' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl ring-1 ring-indigo-500/50 mb-2">
                                        <Key className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">مفتاح الذكاء الاصطناعي</h2>
                                    <p className="text-slate-400 text-sm">أدخل مفتاح Gemini API لتوليد المحتوى.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">مفتاح API</label>
                                    <div className="relative">
                                        <input
                                            type={showKey ? 'text' : 'password'}
                                            value={key}
                                            onChange={(e) => { setKey(e.target.value); setError(''); }}
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-slate-200 placeholder:text-slate-600 font-mono text-sm"
                                            placeholder="AIzaSy..."
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {error && (
                                        <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSaveGemini}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>حفظ مفتاح Gemini</span>
                                </button>
                            </div>
                        )}


                        {/* --- OPENAI TAB --- */}
                        {activeTab === 'openai' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl ring-1 ring-emerald-500/50 mb-2">
                                        <span className="text-3xl">🤖</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">ChatGPT (OpenAI)</h2>
                                    <p className="text-xs text-slate-400">استخدم GPT-4o لتوليد محتوى عالي الجودة</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-300 mb-1 block">مفتاح OpenAI API</label>
                                        <p className="text-[10px] text-slate-500 mb-2">
                                            احصل على مفتاحك من{' '}
                                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                                                platform.openai.com/api-keys
                                            </a>
                                        </p>
                                        <div className="relative">
                                            <input
                                                type={showOpenaiKey ? 'text' : 'password'}
                                                value={openaiKey}
                                                onChange={(e) => { setOpenaiKey(e.target.value); setOpenaiError(''); }}
                                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-slate-200 placeholder:text-slate-600 font-mono text-sm"
                                                placeholder="sk-proj-..."
                                                dir="ltr"
                                            />
                                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <button
                                                type="button"
                                                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                            >
                                                {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {openaiError && (
                                            <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
                                                <AlertTriangle className="w-3 h-3" />
                                                <span>{openaiError}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSaveOpenAI}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>حفظ مفتاح OpenAI</span>
                                    </button>
                                </div>
                            </div>
                        )}


                        {/* --- SALLA TAB --- */}
                        {activeTab === 'salla' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl ring-1 ring-purple-500/50 mb-2">
                                        <span className="text-3xl">🛍️</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">منصة سلة</h2>
                                    <p className="text-xs text-slate-400">اربط متجرك في سلة لنشر المنتجات مباشرة</p>
                                </div>

                                {sallaConnected ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold mb-2">
                                                <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                                                <span>متصل بنجاح</span>
                                            </div>
                                            {sallaStoreName && (
                                                <p className="text-white font-medium">{sallaStoreName}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleDisconnectSalla}
                                            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold py-3 rounded-xl transition-all border border-red-500/30"
                                        >
                                            إلغاء الربط
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Simple Access Token Input */}
                                        <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/20">
                                            <p className="text-[10px] text-purple-300 mb-1">📝 احصل على Access Token من لوحة تحكم سلة</p>
                                            <p className="text-[10px] text-slate-400">الإعدادات → التطبيقات → إنشاء تطبيق → نسخ Access Token</p>
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-300 mb-1 block">Access Token</label>
                                            <div className="relative">
                                                <input
                                                    type={showAccessToken ? 'text' : 'password'}
                                                    value={sallaAccessToken}
                                                    onChange={(e) => setSallaAccessToken(e.target.value)}
                                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-500/50 outline-none text-slate-200 font-mono text-sm"
                                                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                    dir="ltr"
                                                />
                                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAccessToken(!showAccessToken)}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                                >
                                                    {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSaveSallaToken}
                                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>حفظ وربط سلة</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- WOOCOMMERCE TAB --- */}
                        {activeTab === 'woocommerce' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center p-3 bg-pink-500/10 rounded-2xl ring-1 ring-pink-500/50 mb-2">
                                        <ShoppingCart className="w-6 h-6 text-pink-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">ربط المتجر</h2>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> رابط المتجر
                                        </label>
                                        <input
                                            type="url"
                                            value={wcUrl}
                                            onChange={(e) => setWcUrl(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 outline-none transition-all text-slate-200 placeholder:text-slate-600 font-mono text-sm"
                                            placeholder="https://your-store.com"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-xs text-slate-400 mb-2">🔑 مفاتيح WooCommerce API (من الإعدادات → REST API)</p>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={wcKey}
                                                onChange={(e) => setWcKey(e.target.value)}
                                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500/50 outline-none text-slate-200 placeholder:text-slate-600 font-mono text-xs"
                                                placeholder="Consumer Key (ck_...)"
                                                dir="ltr"
                                            />
                                            <div className="relative">
                                                <input
                                                    type={showWcSecret ? 'text' : 'password'}
                                                    value={wcSecret}
                                                    onChange={(e) => setWcSecret(e.target.value)}
                                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-pink-500/50 outline-none text-slate-200 placeholder:text-slate-600 font-mono text-xs"
                                                    placeholder="Consumer Secret (cs_...)"
                                                    dir="ltr"
                                                />
                                                <button type="button" onClick={() => setShowWcSecret(!showWcSecret)} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500">
                                                    {showWcSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-xs text-slate-400 mb-2">👤 بيانات WordPress (لرفع الصور - من ملفك الشخصي)</p>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={wpUsername}
                                                    onChange={(e) => setWpUsername(e.target.value)}
                                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-pink-500/50 outline-none text-slate-200 placeholder:text-slate-600 font-mono text-xs"
                                                    placeholder="اسم المستخدم WordPress"
                                                    dir="ltr"
                                                />
                                                <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showWpPassword ? 'text' : 'password'}
                                                    value={wpAppPassword}
                                                    onChange={(e) => setWpAppPassword(e.target.value)}
                                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-pink-500/50 outline-none text-slate-200 placeholder:text-slate-600 font-mono text-xs"
                                                    placeholder="كلمة مرور التطبيق (Application Password)"
                                                    dir="ltr"
                                                />
                                                <button type="button" onClick={() => setShowWpPassword(!showWpPassword)} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500">
                                                    {showWpPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveWooCommerce}
                                    className="w-full btn-premium text-white"
                                    style={{ background: 'linear-gradient(135deg, rgb(219, 39, 119), rgb(236, 72, 153))' }}
                                >
                                    <div className="flex items-center justify-center gap-2 relative z-10">
                                        <Save className="w-4 h-4" />
                                        <span>حفظ بيانات المتجر</span>
                                    </div>
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
