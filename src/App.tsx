// TODO: Demo/no-login mode — authentication is disabled.
// Before production, restore useAuth(), protect routes, and re-enable RLS.
import { useState } from 'react';
import LandingPage from './pages/LandingPage';
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

type Page = 'landing' | 'workspace' | 'upload' | 'metadata' | 'processing' | 'brief' | 'settings' | 'analyzer';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
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

  if (currentPage === 'analyzer') {
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
      {currentPage === 'landing' && <LandingPage onNavigate={navigate} />}
      {currentPage === 'workspace' && <WorkspacePage onNavigate={navigate} />}
      {currentPage === 'upload' && <UploadPage onNavigate={navigate} onFileUploaded={setUploadedFileInfo} />}
      {currentPage === 'metadata' && <MetadataPage onNavigate={navigate} fileInfo={uploadedFileInfo} />}
      {currentPage === 'processing' && <ProcessingPage onNavigate={navigate} activeProject={activeProject as RfpProject | null} />}
      {currentPage === 'brief' && <IntelligenceBrief onNavigate={navigate} project={activeProject as RfpProject | null} />}
      {currentPage === 'settings' && <SettingsPage onNavigate={navigate} />}

      {exportOpen && (
        <ExportModal onClose={() => { setExportOpen(false); navigate('workspace'); }} />
      )}
    </>
  );
}
