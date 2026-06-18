import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, FileText, Package, Search, Map, Globe,
  Crown, User, Settings, LogOut, ChevronLeft, ChevronRight,
  Sparkles, X, Menu
} from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
  onSettingsClick: () => void;
  onSignOut: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  route?: string;
  onClick?: () => void;
  adminOnly?: boolean;
  isDivider?: boolean;
  variant?: 'default' | 'danger';
}

export const Sidebar: React.FC<SidebarProps> = ({ isAdmin, onSettingsClick, onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [navigate, isMobile]);

  const handleSettingsClick = useCallback(() => {
    onSettingsClick();
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [onSettingsClick, isMobile]);

  const handleSignOut = useCallback(() => {
    onSignOut();
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [onSignOut, isMobile]);

  // Navigation items configuration
  const navItems: NavItem[] = [
    { icon: Home, label: 'مولد المنتجات', route: '/' },
    { icon: FileText, label: 'مولد المقالات', route: '/articles' },
    { icon: Package, label: 'التوليد الجماعي', route: '/bulk' },
    { icon: Search, label: 'الكلمات المفتاحية', route: '/keywords' },
    { icon: Map, label: 'مخطط المحتوى', route: '/planner' },
    { icon: Globe, label: 'محلل المنافسين', route: '/analyzer' },
    // Divider
    { icon: Home, label: '', isDivider: true },
    // Admin & user items
    { icon: Crown, label: 'لوحة التحكم', route: '/admin', adminOnly: true },
    { icon: User, label: 'الملف الشخصي', route: '/profile' },
    { icon: Settings, label: 'الإعدادات', onClick: handleSettingsClick },
    { icon: LogOut, label: 'تسجيل خروج', onClick: handleSignOut, variant: 'danger' },
  ];

  const isActiveRoute = (route?: string): boolean => {
    if (!route) return false;
    if (route === '/') return location.pathname === '/';
    return location.pathname.startsWith(route);
  };

  const renderNavItem = (item: NavItem, index: number) => {
    // Skip admin-only items for non-admin users
    if (item.adminOnly && !isAdmin) return null;

    // Render divider
    if (item.isDivider) {
      return (
        <div key={`divider-${index}`} className="my-2 mx-3">
          <div className="h-px bg-gradient-to-l from-transparent via-slate-700/50 to-transparent" />
        </div>
      );
    }

    const Icon = item.icon;
    const isActive = isActiveRoute(item.route);
    const isDanger = item.variant === 'danger';

    const handleClick = () => {
      if (item.onClick) {
        item.onClick();
      } else if (item.route) {
        handleNavigate(item.route);
      }
    };

    return (
      <button
        key={item.route || item.label}
        onClick={handleClick}
        title={item.label}
        className={`
          group relative w-full flex items-center gap-3 rounded-xl transition-all duration-200
          ${isExpanded || isMobileOpen ? 'px-4 py-3' : 'px-0 py-3 justify-center'}
          ${isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : isDanger
              ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }
        `}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/80 rounded-l-full" />
        )}

        <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
          isActive ? 'text-white' : isDanger ? 'group-hover:text-red-400' : 'group-hover:text-indigo-400'
        }`} />

        {/* Label - visible when expanded or mobile */}
        {(isExpanded || isMobileOpen) && (
          <span className={`text-sm font-semibold whitespace-nowrap transition-opacity duration-200 ${
            isActive ? 'text-white' : ''
          }`}>
            {item.label}
          </span>
        )}

        {/* Tooltip for collapsed state */}
        {!isExpanded && !isMobileOpen && (
          <div className="
            absolute right-full mr-3 px-3 py-1.5 rounded-lg
            bg-slate-800 text-white text-xs font-semibold whitespace-nowrap
            opacity-0 pointer-events-none group-hover:opacity-100
            transition-opacity duration-200 shadow-xl border border-slate-700/50
            z-50
          ">
            {item.label}
            {/* Tooltip arrow */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-800" />
          </div>
        )}
      </button>
    );
  };

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className={`flex items-center gap-3 p-4 mb-2 ${isExpanded || isMobileOpen ? '' : 'justify-center'}`}>
        <div className="p-2 bg-indigo-600 rounded-xl flex-shrink-0 shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {(isExpanded || isMobileOpen) && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-black text-sm gradient-text leading-tight">SEO Generator</span>
            <span className="text-[10px] text-slate-500 font-medium">مولد المحتوى الذكي</span>
          </div>
        )}

        {/* Close button for mobile */}
        {isMobile && isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="mr-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(renderNavItem)}
      </nav>

      {/* Toggle button (desktop only) */}
      {!isMobile && (
        <div className="p-3 mt-auto border-t border-slate-800/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
              text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
            title={isExpanded ? 'طي القائمة' : 'توسيع القائمة'}
          >
            {isExpanded ? (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-semibold">طي القائمة</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger trigger */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 right-4 z-40 p-2.5 rounded-xl
            bg-slate-900/80 backdrop-blur-xl border border-slate-700/50
            text-slate-300 hover:text-white hover:border-indigo-500/30
            transition-all duration-200 shadow-xl"
          title="فتح القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile backdrop */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 z-50 h-screen
          transition-all duration-300 ease-in-out
          ${isMobile
            ? `${isMobileOpen ? 'translate-x-0' : 'translate-x-full'} w-[280px]`
            : `${isExpanded ? 'w-[280px]' : 'w-[72px]'}`
          }
        `}
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '-10px 0 40px -10px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Spacer for desktop layout to push content */}
      {!isMobile && (
        <div
          className="flex-shrink-0 transition-all duration-300"
          style={{ width: isExpanded ? 280 : 72 }}
        />
      )}
    </>
  );
};
