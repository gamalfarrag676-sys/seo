// Admin Dashboard - User Management & API Settings
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    supabase,
    type UserProfile,
    sendPasswordResetEmail,
    getAllGlobalSettings,
    setGlobalSetting
} from '../lib/supabase';
import { useToast } from '../components/Toast';
import {
    Users, Crown, ArrowLeft, Edit2, Save, X,
    Package, FileText, Loader2, Search,
    RefreshCw, Shield, User, UserPlus, Key,
    Mail, Lock, Eye, EyeOff
} from 'lucide-react';

type AdminTab = 'users' | 'add-user' | 'api-keys';

export default function Admin() {
    const { isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    // Tab state
    const [activeTab, setActiveTab] = useState<AdminTab>('users');

    // Users state
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ products_limit: 0, articles_limit: 0 });
    const [saving, setSaving] = useState(false);

    // Add user form state
    const [newUserForm, setNewUserForm] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'user' as 'user' | 'admin',
        productsLimit: 10,
        articlesLimit: 5
    });
    const [showPassword, setShowPassword] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);

    // API Keys state
    const [geminiKey, setGeminiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [savingKeys, setSavingKeys] = useState(false);

    // Fetch all users
    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    // Fetch API keys
    const fetchApiKeys = async () => {
        const settings = await getAllGlobalSettings();
        setGeminiKey(settings['gemini_api_key'] || '');
        setOpenaiKey(settings['openai_api_key'] || '');
    };

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            navigate('/');
            return;
        }
        if (isAdmin) {
            fetchUsers();
            fetchApiKeys();
        }
    }, [isAdmin, authLoading]);

    // Filter users by search
    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Start editing user
    const startEdit = (user: UserProfile) => {
        setEditingUser(user.id);
        setEditForm({
            products_limit: user.products_limit,
            articles_limit: user.articles_limit
        });
    };

    // Save user changes
    const saveUser = async (userId: string) => {
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update(editForm)
            .eq('id', userId);

        if (error) {
            console.error('Error updating user:', error);
            toast.error('خطأ في تحديث المستخدم');
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, ...editForm } : u));
            setEditingUser(null);
            toast.success('تم تحديث المستخدم بنجاح');
        }
        setSaving(false);
    };

    // Reset user usage
    const resetUsage = async (userId: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ products_used: 0, articles_used: 0 })
            .eq('id', userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, products_used: 0, articles_used: 0 } : u));
            toast.success('تم إعادة تعيين الاستخدام');
        }
    };

    // Toggle admin role
    const toggleAdmin = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success(`تم تغيير الدور إلى ${newRole === 'admin' ? 'مدير' : 'مستخدم'}`);
        }
    };

    // Send password reset email
    const handleResetPassword = async (email: string) => {
        const result = await sendPasswordResetEmail(email);
        if (result.success) {
            toast.success('تم إرسال رابط إعادة تعيين كلمة المرور');
        } else {
            toast.error('فشل إرسال الرابط: ' + result.error);
        }
    };

    // Create new user
    const handleCreateUser = async () => {
        if (!newUserForm.email || !newUserForm.password || !newUserForm.fullName) {
            toast.warning('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setCreatingUser(true);
        try {
            // Use Supabase auth to create user
            const { data, error } = await supabase.auth.signUp({
                email: newUserForm.email,
                password: newUserForm.password,
                options: {
                    data: { full_name: newUserForm.fullName }
                }
            });

            if (error) throw error;

            // Update profile with custom settings
            if (data.user) {
                // Wait for trigger to create profile
                await new Promise(resolve => setTimeout(resolve, 1000));

                await supabase.from('profiles').update({
                    role: newUserForm.role,
                    products_limit: newUserForm.productsLimit,
                    articles_limit: newUserForm.articlesLimit
                }).eq('id', data.user.id);
            }

            toast.success('تم إنشاء المستخدم بنجاح! 🎉');
            setNewUserForm({
                email: '',
                password: '',
                fullName: '',
                role: 'user',
                productsLimit: 10,
                articlesLimit: 5
            });
            fetchUsers();
        } catch (err: any) {
            toast.error('فشل إنشاء المستخدم: ' + err.message);
        }
        setCreatingUser(false);
    };

    // Save API Keys
    const handleSaveApiKeys = async () => {
        setSavingKeys(true);
        try {
            if (geminiKey) {
                const result = await setGlobalSetting('gemini_api_key', geminiKey);
                if (!result.success) throw new Error(result.error);
            }
            if (openaiKey) {
                const result = await setGlobalSetting('openai_api_key', openaiKey);
                if (!result.success) throw new Error(result.error);
            }
            toast.success('تم حفظ مفاتيح API بنجاح! 🔑');
        } catch (err: any) {
            toast.error('فشل حفظ المفاتيح: ' + err.message);
        }
        setSavingKeys(false);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animated-bg"></div>
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="animated-bg"></div>
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>

            <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black gradient-text flex items-center gap-2">
                                <Crown className="w-7 h-7 text-yellow-400" />
                                لوحة التحكم
                            </h1>
                            <p className="text-slate-400 text-sm">إدارة المستخدمين وإعدادات النظام</p>
                        </div>
                    </div>

                    <button
                        onClick={() => { fetchUsers(); fetchApiKeys(); }}
                        className="p-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Admin Tabs */}
                <div className="flex gap-2 mb-6 p-1.5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'users'
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        المستخدمين
                    </button>
                    <button
                        onClick={() => setActiveTab('add-user')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'add-user'
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        <UserPlus className="w-4 h-4" />
                        إضافة مستخدم
                    </button>
                    <button
                        onClick={() => setActiveTab('api-keys')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'api-keys'
                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        <Key className="w-4 h-4" />
                        مفاتيح API
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="glass-card p-4 text-center">
                        <Users className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{users.length}</div>
                        <div className="text-xs text-slate-400">المستخدمين</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <Shield className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin').length}</div>
                        <div className="text-xs text-slate-400">المديرين</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <Package className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{users.reduce((a, u) => a + (u.products_used || 0), 0)}</div>
                        <div className="text-xs text-slate-400">المنتجات</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <FileText className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{users.reduce((a, u) => a + (u.articles_used || 0), 0)}</div>
                        <div className="text-xs text-slate-400">المقالات</div>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'users' && (
                    <>
                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="البحث بالاسم أو الإيميل..."
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                            />
                        </div>

                        {/* Users Table */}
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700/50">
                                            <th className="text-right text-xs font-medium text-slate-400 p-4">المستخدم</th>
                                            <th className="text-center text-xs font-medium text-slate-400 p-4">الدور</th>
                                            <th className="text-center text-xs font-medium text-slate-400 p-4">المنتجات</th>
                                            <th className="text-center text-xs font-medium text-slate-400 p-4">المقالات</th>
                                            <th className="text-center text-xs font-medium text-slate-400 p-4">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium text-sm">{user.full_name || 'بدون اسم'}</div>
                                                            <div className="text-slate-500 text-xs" dir="ltr">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => toggleAdmin(user.id, user.role)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-400'}`}
                                                    >
                                                        {user.role === 'admin' ? '👑 Admin' : 'User'}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {editingUser === user.id ? (
                                                        <input
                                                            type="number"
                                                            value={editForm.products_limit}
                                                            onChange={(e) => setEditForm({ ...editForm, products_limit: parseInt(e.target.value) || 0 })}
                                                            className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center"
                                                        />
                                                    ) : (
                                                        <span className="text-white">
                                                            <span className="text-pink-400">{user.products_used}</span>
                                                            <span className="text-slate-500">/{user.products_limit}</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {editingUser === user.id ? (
                                                        <input
                                                            type="number"
                                                            value={editForm.articles_limit}
                                                            onChange={(e) => setEditForm({ ...editForm, articles_limit: parseInt(e.target.value) || 0 })}
                                                            className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center"
                                                        />
                                                    ) : (
                                                        <span className="text-white">
                                                            <span className="text-emerald-400">{user.articles_used}</span>
                                                            <span className="text-slate-500">/{user.articles_limit}</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {editingUser === user.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => saveUser(user.id)}
                                                                    disabled={saving}
                                                                    className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                                                >
                                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingUser(null)}
                                                                    className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => startEdit(user)}
                                                                    className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                                                                    title="تعديل الحدود"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => resetUsage(user.id)}
                                                                    className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                                                    title="إعادة تعيين الاستخدام"
                                                                >
                                                                    <RefreshCw className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleResetPassword(user.email)}
                                                                    className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                                                    title="إرسال رابط تغيير كلمة المرور"
                                                                >
                                                                    <Lock className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    لا يوجد مستخدمين
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'add-user' && (
                    <div className="glass-card p-6 max-w-lg mx-auto">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl ring-1 ring-emerald-500/50 mb-4">
                                <UserPlus className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">إضافة مستخدم جديد</h2>
                            <p className="text-slate-400 text-sm">أنشئ حساب جديد للنظام</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">الاسم الكامل *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newUserForm.fullName}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        placeholder="أدخل الاسم الكامل"
                                    />
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">البريد الإلكتروني *</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={newUserForm.email}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        placeholder="email@example.com"
                                        dir="ltr"
                                    />
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">كلمة المرور *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newUserForm.password}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-16 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        placeholder="••••••••"
                                        dir="ltr"
                                    />
                                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-1 block">الدور</label>
                                    <select
                                        value={newUserForm.role}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as 'user' | 'admin' })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                    >
                                        <option value="user">مستخدم</option>
                                        <option value="admin">مدير</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-1 block">حد المنتجات</label>
                                    <input
                                        type="number"
                                        value={newUserForm.productsLimit}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, productsLimit: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block">حد المقالات</label>
                                <input
                                    type="number"
                                    value={newUserForm.articlesLimit}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, articlesLimit: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                />
                            </div>

                            <button
                                onClick={handleCreateUser}
                                disabled={creatingUser}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {creatingUser ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإنشاء...</>
                                ) : (
                                    <><UserPlus className="w-5 h-5" /> إنشاء المستخدم</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'api-keys' && (
                    <div className="glass-card p-6 max-w-lg mx-auto">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 rounded-2xl ring-1 ring-purple-500/50 mb-4">
                                <Key className="w-8 h-8 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">مفاتيح الذكاء الاصطناعي</h2>
                            <p className="text-slate-400 text-sm">هذه المفاتيح يستخدمها جميع المستخدمين</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block flex items-center gap-2">
                                    <span className="text-lg">✨</span> مفتاح Gemini API
                                </label>
                                <div className="relative">
                                    <input
                                        type={showGeminiKey ? 'text' : 'password'}
                                        value={geminiKey}
                                        onChange={(e) => setGeminiKey(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 outline-none font-mono text-sm"
                                        placeholder="AIzaSy..."
                                        dir="ltr"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1 block flex items-center gap-2">
                                    <span className="text-lg">🤖</span> مفتاح OpenAI API
                                </label>
                                <div className="relative">
                                    <input
                                        type={showOpenaiKey ? 'text' : 'password'}
                                        value={openaiKey}
                                        onChange={(e) => setOpenaiKey(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 outline-none font-mono text-sm"
                                        placeholder="sk-proj-..."
                                        dir="ltr"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <p className="text-amber-400 text-xs">
                                    ⚠️ هذه المفاتيح ستكون متاحة لجميع المستخدمين لاستخدام الذكاء الاصطناعي. تأكد من إعداد حدود الاستخدام المناسبة.
                                </p>
                            </div>

                            <button
                                onClick={handleSaveApiKeys}
                                disabled={savingKeys}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {savingKeys ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
                                ) : (
                                    <><Save className="w-5 h-5" /> حفظ المفاتيح</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
