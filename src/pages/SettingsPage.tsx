import { useState } from 'react';
import { User, Building2, FileText, Download, Shield, LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '@/hooks/useAuth';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'org', label: 'Organization', icon: Building2 },
  { id: 'report', label: 'Report Preferences', icon: FileText },
  { id: 'export', label: 'Export Preferences', icon: Download },
  { id: 'security', label: 'Security', icon: Shield },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="w-10 h-5.5 rounded-full relative transition-all flex-shrink-0"
      style={{
        background: checked ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.1)',
        border: checked ? '1px solid rgba(0,229,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
        height: 22,
        width: 40,
      }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{
          background: checked ? '#00E5FF' : '#64748B',
          left: checked ? 'calc(100% - 18px)' : '2px',
          boxShadow: checked ? '0 0 8px rgba(0,229,255,0.5)' : 'none',
        }}
      />
    </button>
  );
}

export default function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState('report');
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onNavigate('landing');
  };

  const [reportPrefs, setReportPrefs] = useState({
    executiveBrief: true,
    detailedConsulting: false,
    proposalWorkingDoc: false,
    riskFirstAssessment: false,
  });
  const [exportPrefs, setExportPrefs] = useState({
    defaultPDF: true,
    orgBranding: true,
    metadataCover: true,
    confidenceScores: true,
  });

  const toggleReport = (key: keyof typeof reportPrefs) => {
    setReportPrefs(p => ({ ...p, [key]: !p[key] }));
  };
  const toggleExport = (key: keyof typeof exportPrefs) => {
    setExportPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="settings" onNavigate={onNavigate} />

      <div className="flex-1 overflow-auto">
        <div className="px-8 py-5 border-b sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(3,7,18,0.9)' }}>
          <h1 className="font-serif text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-muted text-sm mt-0.5">Manage your workspace preferences and account settings</p>
        </div>

        <div className="flex p-8 gap-8 max-w-5xl">
          {/* Settings sidebar */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {settingsSections.map(s => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all"
                    style={{
                      background: isActive ? 'rgba(0,229,255,0.08)' : 'transparent',
                      color: isActive ? '#00E5FF' : '#9CAEC4',
                      border: isActive ? '1px solid rgba(0,229,255,0.15)' : '1px solid transparent',
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">
            {activeSection === 'profile' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h2 className="text-text-primary font-semibold">Profile</h2>
                </div>
                <div className="p-6 space-y-4">
                  {[{ label: 'Full Name', placeholder: 'Pursuit Lead' }, { label: 'Email Address', placeholder: 'lead@organization.com' }, { label: 'Role', placeholder: 'BFSI Practice Lead' }].map((f, i) => (
                    <div key={i}>
                      <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">{f.label}</label>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        className="w-full px-4 py-3 rounded-lg text-sm text-text-primary placeholder-text-muted"
                        style={{ background: '#0F1B2E', border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    </div>
                  ))}
                  <button className="px-5 py-2.5 rounded-lg text-sm font-medium text-background" style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)' }}>
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'org' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h2 className="text-text-primary font-semibold">Organization</h2>
                </div>
                <div className="p-6 space-y-4">
                  {[{ label: 'Organization Name', placeholder: 'Consulting Practice Name' }, { label: 'Practice Area', placeholder: 'BFSI Digital Transformation' }, { label: 'Default Client Region', placeholder: 'India & South Asia' }].map((f, i) => (
                    <div key={i}>
                      <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">{f.label}</label>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        className="w-full px-4 py-3 rounded-lg text-sm text-text-primary placeholder-text-muted"
                        style={{ background: '#0F1B2E', border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    </div>
                  ))}
                  <button className="px-5 py-2.5 rounded-lg text-sm font-medium text-background" style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)' }}>
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'report' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h2 className="text-text-primary font-semibold">Report Preferences</h2>
                  <p className="text-text-muted text-xs mt-0.5">Configure the default report format generated by ProposalPilot</p>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { key: 'executiveBrief' as const, label: 'Executive brief', desc: 'Concise board-ready summary with decision metrics, risk overview, and next actions' },
                    { key: 'detailedConsulting' as const, label: 'Detailed consulting report', desc: 'Full analysis including scope intelligence, commercial lens, and proposal strategy' },
                    { key: 'proposalWorkingDoc' as const, label: 'Proposal working document', desc: 'Editable version structured for proposal team drafting and expansion' },
                    { key: 'riskFirstAssessment' as const, label: 'Risk-first assessment', desc: 'Risk radar leading format — ideal for high-complexity or high-risk pursuits' },
                  ].map(pref => (
                    <div key={pref.key} className="flex items-start justify-between gap-4 py-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <div>
                        <div className="text-text-primary text-sm font-medium mb-0.5">{pref.label}</div>
                        <div className="text-text-muted text-xs leading-relaxed">{pref.desc}</div>
                      </div>
                      <Toggle checked={reportPrefs[pref.key]} onChange={() => toggleReport(pref.key)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'export' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h2 className="text-text-primary font-semibold">Export Preferences</h2>
                  <p className="text-text-muted text-xs mt-0.5">Configure default export options for intelligence briefs</p>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { key: 'defaultPDF' as const, label: 'Default format: PDF', desc: 'Export as PDF board brief by default when downloading reports' },
                    { key: 'orgBranding' as const, label: 'Include organization branding', desc: 'Add organization logo and header to exported documents' },
                    { key: 'metadataCover' as const, label: 'Include metadata cover page', desc: 'Add a structured cover page with RFP metadata to all exports' },
                    { key: 'confidenceScores' as const, label: 'Include confidence scores', desc: 'Show extraction and analysis confidence scores in exported documents' },
                  ].map(pref => (
                    <div key={pref.key} className="flex items-start justify-between gap-4 py-3 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <div>
                        <div className="text-text-primary text-sm font-medium mb-0.5">{pref.label}</div>
                        <div className="text-text-muted text-xs leading-relaxed">{pref.desc}</div>
                      </div>
                      <Toggle checked={exportPrefs[pref.key]} onChange={() => toggleExport(pref.key)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-5">
                <div className="rounded-2xl overflow-hidden" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <h2 className="text-text-primary font-semibold">Security</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="rounded-xl p-4" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)' }}>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#00E5FF' }}>Session</div>
                      <p className="text-text-secondary text-sm">You are currently signed in as a BFSI Practice pursuit lead. Session expires after 8 hours of inactivity.</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: '#0F1B2E', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-text-muted">Change Password</div>
                      {['Current password', 'New password', 'Confirm new password'].map((label, i) => (
                        <div key={i} className="mb-3">
                          <label className="block text-xs text-text-muted mb-1.5">{label}</label>
                          <input type="password" placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg text-sm" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.08)', color: '#F5F9FF' }} />
                        </div>
                      ))}
                      <button className="px-5 py-2 rounded-lg text-sm font-medium text-background mt-2" style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)' }}>Update Password</button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{ background: 'rgba(255,77,109,0.05)', border: '1px solid rgba(255,77,109,0.2)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#FF4D6D' }}>Sign Out</div>
                  <p className="text-text-muted text-sm mb-4">This will end your session and return you to the landing page. All unsaved changes will be lost.</p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#FF4D6D' }}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
