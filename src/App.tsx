import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
  const { isAdmin, signOut, profile } = useAuth();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const { apiKey } = useApiKeys();

  // Check if API key modal should open
  useEffect(() => {
    if (profile !== undefined && isAdmin && !apiKey) {
      setIsKeyModalOpen(true);
    }
  }, [profile, isAdmin, apiKey]);



  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-50 font-sans" dir="rtl">
      {/* Premium Aurora Background */}
      <div className="aurora-bg fixed inset-0 z-0">
        <div className="aurora-1"></div>
        <div className="aurora-2"></div>
        <div className="aurora-3"></div>
      </div>

      <Sidebar 
        isAdmin={isAdmin}
        onSettingsClick={() => setIsKeyModalOpen(true)}
        onSignOut={signOut}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 transition-all duration-300 mr-20 lg:mr-[280px]">
        <TopNav 
          isAdmin={isAdmin} 
          onSettingsClick={() => setIsKeyModalOpen(true)} 
          onSignOut={signOut}
        />
        
        <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="max-w-6xl mx-auto animate-fade-in-up">
            <ErrorBoundary fallbackTitle="حدث خطأ في تحميل الصفحة">
            <Routes>
              <Route path="/" element={<ProductGenerator />} />
              <Route path="/articles" element={<ArticleGenerator />} />
              <Route path="/bulk" element={<BulkGenerator />} />
              <Route path="/keywords" element={<KeywordResearch />} />
              <Route path="/planner" element={<ContentPlanner />} />
              <Route path="/analyzer" element={<CompetitorAnalyzer />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <ApiKeyModal
          isOpen={isKeyModalOpen}
          onClose={() => setIsKeyModalOpen(false)}
          onSave={() => {}}
        />
    </div>
  );
}
