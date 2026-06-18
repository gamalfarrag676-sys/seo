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

 <div className="relative w-full max-w-md animate-fade-in">
 <div className="absolute -inset-0.5 bg-emerald-500/20 rounded-3xl blur-sm"></div>

 <div className="relative card p-8 text-center space-y-4">
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-sm mb-4">
 <CheckCircle className="w-8 h-8 text-gray-900" />
 </div>
 <h2 className="text-2xl font-bold text-gray-900">تم التسجيل بنجاح! 🎉</h2>
 <p className="text-gray-500">تم إرسال رابط التأكيد لبريدك الإلكتروني</p>
 <p className="text-gray-400 text-sm">سيتم تحويلك لصفحة الدخول...</p>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">


 {/* Register Card */}
 <div className="relative w-full max-w-md animate-fade-in">
 {/* Gradient Border Glow */}
 <div className="absolute -inset-0.5 bg-blue-500/20 rounded-3xl blur-sm"></div>

 <div className="relative card p-8 space-y-6">
 {/* Logo & Title */}
 <div className="text-center space-y-2">
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-sm mb-4">
 <Sparkles className="w-8 h-8 text-gray-900" />
 </div>
 <h1 className="text-3xl font-black gradient-text">إنشاء حساب</h1>
 <p className="text-gray-500 text-sm">سجل الآن وابدأ في إنشاء محتوى احترافي</p>
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
 <label className="text-sm font-medium text-gray-600">الاسم الكامل</label>
 <div className="relative">
 <input
 type="text"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 required
 className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-10 pl-4 py-3 
 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 
 focus:border-purple-500 outline-none transition-all"
 placeholder="أدخل اسمك الكامل"
 />
 <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 </div>
 </div>

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
 focus:border-purple-500 outline-none transition-all"
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
 focus:border-purple-500 outline-none transition-all"
 placeholder="••••••••"
 />
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 </div>
 </div>

 {/* Confirm Password */}
 <div className="space-y-1">
 <label className="text-sm font-medium text-gray-600">تأكيد كلمة المرور</label>
 <div className="relative">
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 required
 dir="ltr"
 className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 
 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 
 focus:border-purple-500 outline-none transition-all"
 placeholder="••••••••"
 />
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 </div>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={loading}
 className="w-full btn btn-primary"
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
 <span className="text-gray-500">لديك حساب بالفعل؟ </span>
 <Link to="/login" className="text-blue-600 hover:text-purple-300 font-medium">
 سجل دخول
 </Link>
 </div>
 </div>
 </div>
 </div>
 );
}
