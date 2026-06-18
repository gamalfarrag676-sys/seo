import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
 theme: Theme;
 toggleTheme: () => void;
 isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
 const [theme, setTheme] = useState<Theme>(() => {
 const saved = localStorage.getItem('theme') as Theme;
 return saved || 'dark';
 });

 useEffect(() => {
 localStorage.setItem('theme', theme);

 // Apply theme to document
 if (theme === 'dark') {
 document.documentElement.classList.add('dark');
 document.documentElement.classList.remove('light');
 } else {
 document.documentElement.classList.add('light');
 document.documentElement.classList.remove('dark');
 }
 }, [theme]);

 const toggleTheme = () => {
 setTheme(prev => prev === 'dark' ? 'light' : 'dark');
 };

 return (
 <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
 {children}
 </ThemeContext.Provider>
 );
};

export const useTheme = () => {
 const context = useContext(ThemeContext);
 if (!context) {
 throw new Error('useTheme must be used within ThemeProvider');
 }
 return context;
};

// Theme Toggle Button Component
export const ThemeToggle = () => {
 const { theme, toggleTheme } = useTheme();

 return (
 <button
 onClick={toggleTheme}
 className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-100 dark:hover:bg-gray-200 transition-colors"
 title={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
 >
 {theme === 'dark' ? (
 <span className="text-xl">☀️</span>
 ) : (
 <span className="text-xl">🌙</span>
 )}
 </button>
 );
};
