import { useState, useEffect } from 'react';
import { X, FileText, FileDown, CheckCircle, Download } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
}

const sections = [
  { id: 'decision', label: 'Decision summary', defaultChecked: true },
  { id: 'metadata', label: 'Extracted metadata', defaultChecked: true },
  { id: 'eligibility', label: 'Eligibility matrix', defaultChecked: true },
  { id: 'risk', label: 'Risk radar', defaultChecked: true },
  { id: 'commercial', label: 'Commercial lens', defaultChecked: true },
  { id: 'wins', label: 'Win themes', defaultChecked: true },
  { id: 'strategy', label: 'Proposal strategy', defaultChecked: true },
  { id: 'questions', label: 'Clarification questions', defaultChecked: true },
  { id: 'actions', label: 'Next actions', defaultChecked: true },
];

export default function ExportModal({ onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'word'>('pdf');
  const [checkedSections, setCheckedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(sections.map(s => [s.id, s.defaultChecked]))
  );
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const toggleSection = (id: string) => {
    setCheckedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1500);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Toast */}
      {exported && (
        <div
          className="fixed top-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium animate-slide-in-right z-50"
          style={{ background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.3)', color: '#00F5A0', boxShadow: '0 0 30px rgba(0,245,160,0.15)' }}
        >
          <CheckCircle className="w-4 h-4" />
          Intelligence brief export started.
        </div>
      )}

      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.2)', boxShadow: '0 0 60px rgba(0,229,255,0.1), 0 0 100px rgba(139,92,246,0.06)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="font-serif text-xl font-bold text-text-primary">Export Intelligence Brief</h2>
            <p className="text-text-muted text-xs mt-0.5">Download a partner-ready version of the RFP analysis</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: '#64748B' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Format selection */}
          <div>
            <div className="text-xs text-text-muted uppercase tracking-widest mb-3">Export Format</div>
            <div className="grid grid-cols-2 gap-3">
              {/* PDF */}
              <button
                onClick={() => setFormat('pdf')}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: format === 'pdf' ? 'rgba(255,209,102,0.06)' : 'rgba(255,255,255,0.02)',
                  border: format === 'pdf' ? '2px solid rgba(0,229,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: format === 'pdf' ? '0 0 20px rgba(0,229,255,0.1)' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5" style={{ color: '#FFD166' }} />
                  {format === 'pdf' && <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#00E5FF' }}><div className="w-2 h-2 rounded-full bg-background" /></div>}
                </div>
                <div className="text-text-primary font-semibold text-sm mb-1">PDF Board Brief</div>
                <p className="text-text-muted text-xs leading-relaxed">Best for partner review, leadership circulation, and formal pursuit discussions.</p>
              </button>

              {/* Word */}
              <button
                onClick={() => setFormat('word')}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: format === 'word' ? 'rgba(0,229,255,0.04)' : 'rgba(255,255,255,0.02)',
                  border: format === 'word' ? '2px solid rgba(0,229,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: format === 'word' ? '0 0 20px rgba(0,229,255,0.1)' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileDown className="w-5 h-5 text-neon-cyan" />
                  {format === 'word' && <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#00E5FF' }}><div className="w-2 h-2 rounded-full bg-background" /></div>}
                </div>
                <div className="text-text-primary font-semibold text-sm mb-1">Word Working Document</div>
                <p className="text-text-muted text-xs leading-relaxed">Best for proposal teams who need to edit, expand, and convert analysis into response content.</p>
              </button>
            </div>
          </div>

          {/* Section selection */}
          <div>
            <div className="text-xs text-text-muted uppercase tracking-widest mb-3">Sections to Include</div>
            <div className="grid grid-cols-2 gap-2">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleSection(s.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors"
                  style={{ background: checkedSections[s.id] ? 'rgba(0,229,255,0.06)' : 'rgba(255,255,255,0.02)', border: checkedSections[s.id] ? '1px solid rgba(0,229,255,0.2)' : '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: checkedSections[s.id] ? '#00E5FF' : 'rgba(255,255,255,0.06)', border: checkedSections[s.id] ? 'none' : '1px solid rgba(255,255,255,0.12)' }}
                  >
                    {checkedSections[s.id] && <div className="w-2 h-0.5 bg-background rounded-full" />}
                  </div>
                  <span style={{ color: checkedSections[s.id] ? '#F5F9FF' : '#9CAEC4' }}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] text-background"
            style={{
              background: format === 'pdf' ? 'linear-gradient(135deg, #FFD166, #FFB020)' : 'linear-gradient(135deg, #00E5FF, #00B8CC)',
              boxShadow: format === 'pdf' ? '0 0 30px rgba(255,209,102,0.2)' : '0 0 30px rgba(0,229,255,0.2)',
            }}
          >
            {exporting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                Preparing export...
              </div>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {format === 'pdf' ? 'PDF' : 'Word'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
