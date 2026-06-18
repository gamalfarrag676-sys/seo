// User Profile Page - Account Management
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sendPasswordResetEmail } from '../lib/supabase';
import { useToast } from '../components/Toast';
import {
    User, Mail, Package, FileText, ArrowLeft, Lock,
    LogOut, Loader2, Calendar, Shield, AlertTriangle
} from 'lucide-react';

export default function Profile() {
    const { user, profile, signOut, loading } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [sendingReset, setSendingReset] = useState(false);
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // Calculate usage percentages
    const productsPercent = profile ? Math.min((profile.products_used / profile.products_limit) * 100, 100) : 0;
    const articlesPercent = profile ? Math.min((profile.articles_used / profile.articles_limit) * 100, 100) : 0;

    // Timeout for loading - redirect to login if taking too long
    useEffect(() => {
        if (!profile && !loading) {
            // If not loading and no profile, redirect to login
            navigate('/login');
            return;
        }

        const timeout = setTimeout(() => {
            if (!profile) {
                setLoadingTimeout(true);
            }
        }, 5000);

        return () => clearTimeout(timeout);
    }, [profile, loading, navigate]);

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setSendingReset(true);
        const result = await sendPasswordResetEmail(user.email);
        if (result.success) {
            toast.success('تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني 📧');
        } else {
            toast.error('فشل إرسال الرابط: ' + result.error);
        }
        setSendingReset(false);
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            // Use hard redirect to ensure clean state
            window.location.href = '/login';
        } catch (err) {
            console.error('Sign out error:', err);
            window.location.href = '/login';
        }
    };

    // Show loading or timeout message
    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <div className="animated-bg"></div>
                {loadingTimeout ? (
                    <>
                        <AlertTriangle className="w-12 h-12 text-amber-400" />
                        <p className="text-white text-lg">فشل تحميل البيانات</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            العودة لتسجيل الدخول
                        </button>
                    </>
                ) : (
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="animated-bg"></div>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>

            <div className="relative z-10 max-w-2xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black gradient-text flex items-center gap-2">
                            <User className="w-7 h-7 text-indigo-400" />
                            الملف الشخصي
                        </h1>
                        <p className="text-slate-400 text-sm">إدارة حسابك ومعلوماتك</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{profile.full_name || 'بدون اسم'}</h2>
                            <p className="text-slate-400 text-sm flex items-center gap-1" dir="ltr">
                                <Mail className="w-3 h-3" />
                                {profile.email}
                            </p>
                            {profile.role === 'admin' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full mt-1">
                                    <Shield className="w-3 h-3" />
                                    مدير
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-700/50 pt-4">
                        <div>
                            <Calendar className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                            <p className="text-xs text-slate-500">تاريخ التسجيل</p>
                            <p className="text-sm text-white font-medium">
                                {new Date(profile.created_at).toLocaleDateString('ar-EG')}
                            </p>
                        </div>
                        <div>
                            <Shield className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                            <p className="text-xs text-slate-500">نوع الحساب</p>
                            <p className="text-sm text-white font-medium">
                                {profile.role === 'admin' ? 'مدير' : 'مستخدم'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Usage Card */}
                <div className="glass-card p-6 mb-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-pink-400" />
                        الاستخدام
                    </h3>

                    {/* Products Usage */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-300 flex items-center gap-1">
                                <Package className="w-4 h-4 text-pink-400" />
                                المنتجات
                            </span>
                            <span className="text-sm font-bold text-white">
                                {profile.products_used} / {profile.products_limit}
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${productsPercent >= 100
                                    ? 'bg-red-500'
                                    : productsPercent >= 80
                                        ? 'bg-amber-500'
                                        : 'bg-gradient-to-r from-pink-500 to-rose-500'
                                    }`}
                                style={{ width: `${productsPercent}%` }}
                            />
                        </div>
                        {productsPercent >= 100 && (
                            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                وصلت للحد الأقصى
                            </p>
                        )}
                    </div>

                    {/* Articles Usage */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-300 flex items-center gap-1">
                                <FileText className="w-4 h-4 text-emerald-400" />
                                المقالات
                            </span>
                            <span className="text-sm font-bold text-white">
                                {profile.articles_used} / {profile.articles_limit}
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${articlesPercent >= 100
                                    ? 'bg-red-500'
                                    : articlesPercent >= 80
                                        ? 'bg-amber-500'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    }`}
                                style={{ width: `${articlesPercent}%` }}
                            />
                        </div>
                        {articlesPercent >= 100 && (
                            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                وصلت للحد الأقصى
                            </p>
                        )}
                    </div>

                    {(productsPercent >= 100 || articlesPercent >= 100) && (
                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-amber-400 text-xs">
                                ⚠️ لزيادة الحد، تواصل مع مدير النظام
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions Card */}
                <div className="glass-card p-6 space-y-3">
                    <h3 className="text-lg font-bold text-white mb-4">الإجراءات</h3>

                    <button
                        onClick={handlePasswordReset}
                        disabled={sendingReset}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
                    >
                        {sendingReset ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                جاري الإرسال...
                            </>
                        ) : (
                            <>
                                <Lock className="w-5 h-5" />
                                تغيير كلمة المرور
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold py-3 px-4 rounded-xl transition-all border border-red-500/30"
                    >
                        <LogOut className="w-5 h-5" />
                        تسجيل الخروج
                    </button>
                </div>
            </div>
        </div>
    );
}
