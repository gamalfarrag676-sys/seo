import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Crown, User, Settings, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeProvider';

interface TopNavProps {
  isAdmin: boolean;
  onSettingsClick: () => void;
  onSignOut: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ isAdmin, onSettingsClick, onSignOut }) => {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/50">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl lg:hidden">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text lg:hidden">SEO Generator</span>
        </div>
        
        <div className="flex items-center gap-2 mr-auto">
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="p-2.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition-all border border-yellow-500/30"
              title="لوحة التحكم"
            >
              <Crown className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => navigate('/profile')}
            className="p-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-all border border-indigo-500/30"
            title="الملف الشخصي"
          >
            <User className="w-5 h-5" />
          </button>
          <ThemeToggle />
          <button
            onClick={onSettingsClick}
            className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all border border-slate-700/50 hover:border-slate-600/50"
            title="إعدادات المفتاح والمتجر"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onSignOut}
            className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all border border-red-500/30"
            title="تسجيل خروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
