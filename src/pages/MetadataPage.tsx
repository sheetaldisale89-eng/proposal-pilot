import { CheckCircle, AlertCircle, Clock, Info, ChevronRight, RefreshCw, CreditCard as Edit3 } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface MetadataPageProps {
  onNavigate: (page: string) => void;
  fileInfo?: { name: string; size: string; storagePath: string; projectId: string } | null;
}

const metadataFields = [
  { label: 'RFP Title', value: 'Digital Lending Transformation RFP', confidence: 'High', status: 'verified' },
  { label: 'Issuing Institution', value: 'Leading Public Sector Bank', confidence: 'High', status: 'verified', highlight: true },
  { label: 'BFSI Segment', value: 'Banking', confidence: 'High', status: 'verified' },
  { label: 'RFP Type', value: 'Digital Lending / LOS Transformation', confidence: 'Medium', status: 'review' },
  { label: 'Geography', value: 'India', confidence: 'High', status: 'verified' },
  { label: 'Submission Deadline', value: '30 June 2026', confidence: 'High', status: 'verified' },
  { label: 'Contract Duration', value: '3 years', confidence: 'High', status: 'verified' },
  { label: 'Estimated Deal Value', value: 'Not disclosed', confidence: 'Low', status: 'needs-review' },
  { label: 'Pre-bid Meeting', value: '12 June 2026', confidence: 'High', status: 'verified' },
];

const detectedSections = [
  'Eligibility Criteria', 'Scope of Work', 'Technical Requirements',
  'Commercial Terms', 'Evaluation Criteria', 'Submission Format', 'Annexures'
];

function ConfidenceBadge({ confidence, status }: { confidence: string; status: string }) {
  const config = {
    verified: { color: '#00F5A0', bg: 'rgba(0,245,160,0.08)', border: 'rgba(0,245,160,0.2)', icon: <CheckCircle className="w-3 h-3" />, label: 'High confidence' },
    review: { color: '#FFB020', bg: 'rgba(255,176,32,0.08)', border: 'rgba(255,176,32,0.2)', icon: <Clock className="w-3 h-3" />, label: 'Medium confidence' },
    'needs-review': { color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)', border: 'rgba(255,77,109,0.2)', icon: <AlertCircle className="w-3 h-3" />, label: 'Needs review' },
  }[status] || { color: '#9CAEC4', bg: 'transparent', border: 'transparent', icon: null, label: confidence };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wider" style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}>
      {config.icon}
      {config.label}
    </div>
  );
}

export default function MetadataPage({ onNavigate, fileInfo }: MetadataPageProps) {
  const displayFileName = fileInfo?.name ?? 'Digital_Lending_Transformation_RFP.pdf';
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="upload" onNavigate={onNavigate} />

      <div className="flex-1 overflow-auto">
        <div className="px-8 py-5 border-b sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(3,7,18,0.9)' }}>
          <h1 className="font-serif text-2xl font-bold text-text-primary">Document Intelligence Extracted</h1>
          <p className="text-text-muted text-sm mt-0.5">ProposalPilot identified the following opportunity details from the uploaded RFP.</p>
        </div>

        <div className="p-8 max-w-5xl mx-auto space-y-6 animate-slide-up">
          {/* File summary card */}
          <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
                <Info className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <div className="text-text-primary font-medium text-sm">{displayFileName}</div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-text-muted text-xs">142 pages</span>
                  <span className="text-text-muted text-xs">·</span>
                  <span className="text-text-muted text-xs">BFSI Transformation RFP</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-text-muted mb-0.5">Extraction confidence</div>
                <div className="text-neon-cyan font-mono font-semibold">86%</div>
              </div>
              <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{ width: '86%', background: 'linear-gradient(90deg, #00E5FF, #00F5A0)' }} />
              </div>
            </div>
          </div>

          {/* Metadata grid */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-text-primary font-semibold text-sm">Extracted Metadata</h2>
              <p className="text-text-muted text-xs mt-0.5">9 fields extracted · Verify before proceeding</p>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-4">
              {metadataFields.map((field, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{
                    background: field.highlight ? 'rgba(0,229,255,0.04)' : '#0F1B2E',
                    border: field.highlight ? '1px solid rgba(0,229,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">{field.label}</div>
                  <div className="flex items-center justify-between gap-3">
                    <div className={`font-medium text-sm ${field.status === 'needs-review' ? 'text-text-muted' : 'text-text-primary'}`}>
                      {field.value}
                    </div>
                    <ConfidenceBadge confidence={field.confidence} status={field.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected sections */}
          <div className="rounded-2xl p-6" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs text-text-muted uppercase tracking-widest mb-4">Detected Document Sections</div>
            <div className="flex flex-wrap gap-2">
              {detectedSections.map((section, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#0F1B2E', border: '1px solid rgba(255,255,255,0.08)', color: '#9CAEC4' }}>
                  {section}
                </span>
              ))}
            </div>
          </div>

          {/* System insight */}
          <div className="rounded-2xl p-5 flex gap-4" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 0 30px rgba(139,92,246,0.06)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(139,92,246,0.15)' }}>
              <Info className="w-4 h-4" style={{ color: '#8B5CF6' }} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B5CF6' }}>System Insight</div>
              <p className="text-text-secondary text-sm leading-relaxed">
                ProposalPilot has identified this as a <strong className="text-text-primary">high-complexity digital lending transformation RFP</strong> with legacy integration dependencies and aggressive delivery expectations.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigate('processing')}
              className="flex items-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm text-background transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', boxShadow: '0 0 30px rgba(0,229,255,0.25)' }}
            >
              Continue to Full Analysis
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-sm text-text-secondary transition-all hover:text-text-primary"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Edit3 className="w-4 h-4" />
              Edit Extracted Details
            </button>
            <button
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium text-sm text-text-secondary transition-all hover:text-text-primary"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <RefreshCw className="w-4 h-4" />
              Re-upload Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
