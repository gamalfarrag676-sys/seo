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
 <div className="relative w-full max-w-md animate-fade-in">
 {/* Gradient Border Glow */}
 <div className="absolute -inset-0.5 bg-blue-500/20 rounded-3xl blur-sm"></div>

 <div className="relative card p-8 space-y-6">
 {/* Logo & Title */}
 <div className="text-center space-y-2">
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-sm mb-4">
 <Sparkles className="w-8 h-8 text-gray-900" />
 </div>
 <h1 className="text-3xl font-black gradient-text">تسجيل الدخول</h1>
 <p className="text-gray-500 text-sm">أدخل بياناتك للوصول لحسابك</p>
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
 <label className="text-sm font-medium text-gray-600">البريد الإلكتروني</label>
 <div className="relative">
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 dir="ltr"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 
 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 
 focus:border-blue-200 outline-none transition-all"
 placeholder="email@example.com"
 />
 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 </div>
 </div>

 {/* Password */}
 <div className="space-y-1">
 <label className="text-sm font-medium text-gray-600">كلمة المرور</label>
 <div className="relative">
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 dir="ltr"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 
 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 
 focus:border-blue-200 outline-none transition-all"
 placeholder="••••••••"
 />
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 </div>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={loading}
 className="w-full btn btn-primary text-gray-900 disabled:opacity-50"
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
 <div className="flex-grow border-t border-gray-200"></div>
 <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">أو</span>
 <div className="flex-grow border-t border-gray-200"></div>
 </div>

 <button
 type="button"
 onClick={() => {
 demoLogin();
 navigate('/');
 }}
 className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-gray-200"
 >
 <Sparkles className="w-5 h-5 text-amber-400" />
 دخول تجريبي (للاختبار)
 </button>
 </>
 )}
 </form>

 {/* Register Link */}
 <div className="text-center text-sm">
 <span className="text-gray-500">ليس لديك حساب؟ </span>
 <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
 سجل الآن
 </Link>
 </div>
 </div>
 </div>
 </div>
 );
}
