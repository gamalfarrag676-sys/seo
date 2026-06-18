// Login Page with Premium Design
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signIn, demoLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message === 'Invalid login credentials'
                ? 'بيانات الدخول غير صحيحة'
                : error.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="animated-bg"></div>

            {/* Floating Orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>

            {/* Login Card */}
            <div className="relative w-full max-w-md animate-fade-in-up">
                {/* Gradient Border Glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-40 blur-sm"></div>

                <div className="relative glass-card p-8 space-y-6">
                    {/* Logo & Title */}
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/30 mb-4">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black gradient-text">تسجيل الدخول</h1>
                        <p className="text-slate-400 text-sm">أدخل بياناتك للوصول لحسابك</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                           text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 
                           focus:border-indigo-500 outline-none transition-all"
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
                           text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 
                           focus:border-indigo-500 outline-none transition-all"
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
                        >
                            <div className="flex items-center justify-center gap-2 relative z-10">
                                {loading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> جاري الدخول...</>
                                ) : (
                                    <>دخول</>
                                )}
                            </div>
                        </button>

                        {import.meta.env.DEV && (
                        <>
                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">أو</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                demoLogin();
                                navigate('/');
                            }}
                            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
                        >
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            دخول تجريبي (للاختبار)
                        </button>
                        </>
                        )}
                    </form>

                    {/* Register Link */}
                    <div className="text-center text-sm">
                        <span className="text-slate-400">ليس لديك حساب؟ </span>
                        <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                            سجل الآن
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
