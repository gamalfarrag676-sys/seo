// src/App.tsx — Professional Enterprise Layout
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { useAuth } from './contexts/AuthContext';
import { useApiKeys } from './hooks/useApiKeys';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import ProductGenerator from './pages/ProductGenerator';
import ArticleGenerator from './pages/ArticleGenerator';
import { BulkGenerator } from './components/BulkGenerator';
import CompetitorAnalyzer from './pages/CompetitorAnalyzer';
import KeywordResearch from './pages/KeywordResearch';
import ContentPlanner from './pages/ContentPlanner';

export default function App() {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const { apiKey } = useApiKeys();

  // Check if API key modal should open
  useEffect(() => {
    if (profile !== undefined && isAdmin && !apiKey) {
      setIsKeyModalOpen(true);
    }
  }, [profile, isAdmin, apiKey]);
  
  // Hide sidebar on auth pages
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {/* Auth routes are handled by main.tsx */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      {user && <Sidebar isAdmin={isAdmin} onSettingsClick={() => setIsKeyModalOpen(true)} />}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary fallbackTitle="حدث خطأ في تحميل الصفحة">
              <Routes>
                {/* Routes from both old App.tsx and new Sidebar links */}
                <Route path="/" element={<ProductGenerator />} />
                <Route path="/product" element={<ProductGenerator />} />
                
                <Route path="/articles" element={<ArticleGenerator />} />
                <Route path="/article" element={<ArticleGenerator />} />
                
                <Route path="/bulk" element={<BulkGenerator />} />
                <Route path="/keywords" element={<KeywordResearch />} />
                
                <Route path="/planner" element={<ContentPlanner />} />
                <Route path="/content-plan" element={<ContentPlanner />} />
                
                <Route path="/analyzer" element={<CompetitorAnalyzer />} />
                <Route path="/analyze" element={<CompetitorAnalyzer />} />
                <Route path="/competitors" element={<CompetitorAnalyzer />} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="h-12 border-t border-gray-200 bg-white flex items-center justify-between px-6 text-xs text-gray-400">
          <span>SEO Pro © 2026</span>
          <span>منصة تحسين محركات البحث والمحتوى</span>
        </footer>
      </div>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSave={() => {}}
      />
    </div>
  );
}
