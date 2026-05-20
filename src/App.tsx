import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import WorkspacePage from './pages/WorkspacePage';
import UploadPage from './pages/UploadPage';
import MetadataPage from './pages/MetadataPage';
import ProcessingPage from './pages/ProcessingPage';
import IntelligenceBrief from './pages/IntelligenceBrief';
import SettingsPage from './pages/SettingsPage';
import ExportModal from './components/ExportModal';
import { RfpAnalyzer } from './components/RfpAnalyzer';
import Sidebar from './components/Sidebar';
import type { RfpProject } from '@/lib/types';

type Page = 'landing' | 'login' | 'workspace' | 'upload' | 'metadata' | 'processing' | 'brief' | 'settings' | 'analyzer';

const protectedPages: Page[] = ['workspace', 'upload', 'metadata', 'processing', 'brief', 'settings', 'analyzer'];

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [exportOpen, setExportOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<Partial<RfpProject> | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: string; storagePath: string; projectId: string } | null>(null);

  const email = localStorage.getItem('userEmail');
  const user = email ? { email } : null;

  const navigate = (page: string, data?: unknown) => {
    console.log('[APP NAVIGATE]', page, data);

    if (page === 'export') {
      setExportOpen(true);
      return;
    }

    if (page === 'brief' && data) {
      setActiveProject(data as RfpProject);
    }

    // Guard: don't navigate away from brief back to workspace immediately after arriving
    if (page === 'workspace' && currentPage === 'brief') {
      return;
    }

    setCurrentPage(page as Page);
    window.scrollTo(0, 0);
  };

  const effectivePage: Page = (!user && protectedPages.includes(currentPage)) ? 'login' : currentPage;
  const resolvedPage: Page = (user && (effectivePage === 'login' || effectivePage === 'landing')) ? 'workspace' : effectivePage;

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
      {resolvedPage === 'upload' && (
        <UploadPage
          onNavigate={navigate}
          onFileUploaded={setUploadedFileInfo}
        />
      )}
      {resolvedPage === 'metadata' && <MetadataPage onNavigate={navigate} fileInfo={uploadedFileInfo} />}
      {resolvedPage === 'processing' && <ProcessingPage onNavigate={navigate} activeProject={activeProject as RfpProject | null} />}
      {resolvedPage === 'brief' && <IntelligenceBrief onNavigate={navigate} project={activeProject as RfpProject | null} />}
      {resolvedPage === 'settings' && <SettingsPage onNavigate={navigate} />}

      {exportOpen && (
        <ExportModal onClose={() => { setExportOpen(false); navigate('workspace'); }} />
      )}
    </>
  );
}
