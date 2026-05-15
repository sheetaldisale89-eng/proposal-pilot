import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import WorkspacePage from './pages/WorkspacePage';
import UploadPage from './pages/UploadPage';
import MetadataPage from './pages/MetadataPage';
import ProcessingPage from './pages/ProcessingPage';
import IntelligenceBrief from './pages/IntelligenceBrief';
import SettingsPage from './pages/SettingsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ExportModal from './components/ExportModal';
import { RfpAnalyzer } from './components/RfpAnalyzer';
import Sidebar from './components/Sidebar';
import type { RfpProject } from '@/lib/types';

type Page = 'landing' | 'login' | 'workspace' | 'upload' | 'metadata' | 'processing' | 'brief' | 'settings' | 'analyzer' | 'reset-password';

function getInitialPage(): Page {
  // Supabase password reset links contain #access_token and type=recovery in the hash
  if (window.location.hash.includes('type=recovery')) return 'reset-password';
  return 'landing';
}

export default function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage);

  // Also catch the case where Supabase redirects to /reset-password path
  useEffect(() => {
    if (window.location.pathname === '/reset-password' || window.location.hash.includes('type=recovery')) {
      setCurrentPage('reset-password');
    }
  }, []);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<Partial<RfpProject> | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: string; storagePath: string; projectId: string } | null>(null);

  const navigate = (page: string, data?: unknown) => {
    if (page === 'export') {
      setExportOpen(true);
      return;
    }
    if (page === 'brief' && data) {
      setActiveProject(data as RfpProject);
    }
    setCurrentPage(page as Page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,229,255,0.2)', borderTopColor: '#00E5FF' }} />
          <p className="text-text-muted text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const protectedPages: Page[] = ['workspace', 'upload', 'metadata', 'processing', 'brief', 'settings', 'analyzer'];
  const effectivePage: Page = (!user && protectedPages.includes(currentPage)) ? 'login' : currentPage;
  // Don't redirect away from reset-password even if user becomes logged in during the flow
  const resolvedPage: Page = (currentPage !== 'reset-password' && user && (effectivePage === 'login' || effectivePage === 'landing')) ? 'workspace' : effectivePage;

  // Analyzer gets the sidebar wrapper here so RfpAnalyzer stays self-contained
  if (resolvedPage === 'analyzer') {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar currentPage="analyzer" onNavigate={navigate} />
        <div className="flex-1 overflow-auto">
          <RfpAnalyzer />
        </div>
      </div>
    );
  }

  return (
    <>
      {resolvedPage === 'landing' && <LandingPage onNavigate={navigate} />}
      {resolvedPage === 'login' && <LoginPage onNavigate={navigate} />}
      {resolvedPage === 'workspace' && <WorkspacePage onNavigate={navigate} />}
      {resolvedPage === 'upload' && <UploadPage onNavigate={navigate} onFileUploaded={setUploadedFileInfo} />}
      {resolvedPage === 'metadata' && <MetadataPage onNavigate={navigate} fileInfo={uploadedFileInfo} />}
      {resolvedPage === 'processing' && <ProcessingPage onNavigate={navigate} activeProject={activeProject as RfpProject | null} />}
      {resolvedPage === 'brief' && <IntelligenceBrief onNavigate={navigate} project={activeProject as RfpProject | null} />}
      {resolvedPage === 'settings' && <SettingsPage onNavigate={navigate} />}
      {resolvedPage === 'reset-password' && <ResetPasswordPage onNavigate={navigate} />}

      {exportOpen && (
        <ExportModal onClose={() => { setExportOpen(false); navigate('workspace'); }} />
      )}
    </>
  );
}
