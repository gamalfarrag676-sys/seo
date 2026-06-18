// Register Page with Premium Design
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Loader2, Sparkles, CheckCircle } from 'lucide-react';

export default function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }
        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        setLoading(true);

        const { error } = await signUp(email, password, fullName);

        if (error) {
            setError(error.message === 'User already registered'
                ? 'هذا البريد مسجل بالفعل'
                : error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <div className="animated-bg"></div>
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>

                <div className="relative w-full max-w-md animate-fade-in-up">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl opacity-40 blur-sm"></div>

                    <div className="relative glass-card p-8 text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg mb-4">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">تم التسجيل بنجاح! 🎉</h2>
                        <p className="text-slate-400">تم إرسال رابط التأكيد لبريدك الإلكتروني</p>
                        <p className="text-slate-500 text-sm">سيتم تحويلك لصفحة الدخول...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="animated-bg"></div>

            {/* Floating Orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>

            {/* Register Card */}
            <div className="relative w-full max-w-md animate-fade-in-up">
                {/* Gradient Border Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-3xl opacity-40 blur-sm"></div>

                <div className="relative glass-card p-8 space-y-6">
                    {/* Logo & Title */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-pink-500/30 mb-4">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black gradient-text">إنشاء حساب</h1>
                        <p className="text-slate-400 text-sm">سجل الآن وابدأ في إنشاء محتوى احترافي</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300">الاسم الكامل</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pr-10 pl-4 py-3 
                           text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 
                           focus:border-purple-500 outline-none transition-all"
                                    placeholder="أدخل اسمك الكامل"
                                />
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300">البريد الإلكتروني</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    dir="ltr"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 
                           text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 
                           focus:border-purple-500 outline-none transition-all"
                                    placeholder="email@example.com"
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300">كلمة المرور</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    dir="ltr"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 
                           text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 
                           focus:border-purple-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-300">تأكيد كلمة المرور</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    dir="ltr"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 
                           text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 
                           focus:border-purple-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-premium text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153))' }}
                        >
                            <div className="flex items-center justify-center gap-2 relative z-10">
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> جاري التسجيل...</>
                                ) : (
                                    <>إنشاء حساب</>
                                )}
                            </div>
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="text-center text-sm">
                        <span className="text-slate-400">لديك حساب بالفعل؟ </span>
                        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                            سجل دخول
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
