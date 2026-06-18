// Usage Progress Bar Component
import { useAuth } from '../contexts/AuthContext';
import { Package, FileText } from 'lucide-react';

export function UsageBar() {
    const { profile } = useAuth();

    if (!profile) return null;

    const productPercent = Math.min(100, (profile.products_used / profile.products_limit) * 100);
    const articlePercent = Math.min(100, (profile.articles_used / profile.articles_limit) * 100);

    return (
        <div className="glass-card p-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                📊 استخدامك
            </h3>

            {/* Products Usage */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-400">
                        <Package className="w-4 h-4 text-pink-400" />
                        المنتجات
                    </span>
                    <span className="text-white font-bold">
                        {profile.products_used} / {profile.products_limit}
                    </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${productPercent >= 90 ? 'bg-red-500' : productPercent >= 70 ? 'bg-yellow-500' : 'bg-gradient-to-r from-pink-500 to-rose-500'
                            }`}
                        style={{ width: `${productPercent}%` }}
                    />
                </div>
            </div>

            {/* Articles Usage */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-400">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        المقالات
                    </span>
                    <span className="text-white font-bold">
                        {profile.articles_used} / {profile.articles_limit}
                    </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${articlePercent >= 90 ? 'bg-red-500' : articlePercent >= 70 ? 'bg-yellow-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            }`}
                        style={{ width: `${articlePercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
