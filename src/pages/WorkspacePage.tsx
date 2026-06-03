import { useState, useEffect, useCallback } from 'react';
import { FileText, CheckCircle, Calendar, Building2, Plus, Eye, Mail, Download, Trash2, Loader2, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import EmailModal from '../components/EmailModal';
import { supabase } from '@/lib/supabase';
import type { RfpProject } from '@/lib/types';

interface WorkspacePageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

type SortOption = 'newest' | 'oldest' | 'institution' | 'recommendation';

interface ProjectWithRec extends RfpProject {
  go_no_go?: string;
}

function getGreeting(email: string): string {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstPart = email.split('@')[0] || '';
  const firstName = firstPart.split('.')[0];
  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  return name ? `${greeting}, ${name}` : greeting;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function cleanTitle(title: string): string {
  if (!title) return 'Untitled Analysis';
  if (title.endsWith('.pdf') || (title.includes('_') && !title.includes(' '))) {
    return title.replace(/\.pdf$/i, '').replace(/_/g, ' ').replace(/-/g, ' ').trim();
  }
  return title;
}

function RecBadge({ value }: { value?: string }) {
  if (!value) return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'rgba(156,174,196,0.12)', color: '#9CAEC4' }}>Pending</span>;
  const v = value.toLowerCase();
  if (v === 'pursue') return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'rgba(0,245,160,0.12)', color: '#00F5A0' }}>Pursue</span>;
  if (v.includes('caution')) return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'rgba(255,176,32,0.12)', color: '#FFB020' }}>Caution</span>;
  if (v.includes('do not') || v.includes('no-go') || v === 'no go') return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'rgba(255,77,109,0.12)', color: '#FF4D6D' }}>Do Not Pursue</span>;
  return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase" style={{ background: 'rgba(156,174,196,0.12)', color: '#9CAEC4' }}>{value}</span>;
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td className="px-6 py-4">
        <div className="h-3.5 rounded mb-2 animate-pulse" style={{ background: 'rgba(255,255,255,0.07)', width: 200 }} />
        <div className="h-2.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', width: 130 }} />
      </td>
      <td className="px-4 py-4"><div className="h-5 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: 80 }} /></td>
      <td className="px-4 py-4"><div className="h-2.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)', width: 90 }} /></td>
      <td className="px-6 py-4"><div className="h-7 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', width: 120 }} /></td>
    </tr>
  );
}

function ActionBtn({ icon, tooltip, hoverColor, onClick }: {
  icon: React.ReactNode;
  tooltip: string;
  hoverColor: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isRed = hoverColor === '#FF4D6D';
  return (
    <div className="relative">
      <button
        onClick={onClick}
        title={tooltip}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: hovered ? (isRed ? 'rgba(255,77,109,0.1)' : 'rgba(0,229,255,0.1)') : 'rgba(255,255,255,0.04)',
          border: `1px solid ${hovered ? (isRed ? 'rgba(255,77,109,0.25)' : 'rgba(0,229,255,0.25)') : 'rgba(255,255,255,0.07)'}`,
          color: hovered ? hoverColor : '#9CAEC4',
        }}>
        {icon}
      </button>
      {hovered && (
        <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded text-[10px] whitespace-nowrap pointer-events-none z-30"
          style={{ background: '#0D1829', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F9FF' }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

export default function WorkspacePage({ onNavigate }: WorkspacePageProps) {
  const [projects, setProjects] = useState<ProjectWithRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, thisMonth: 0, institutions: 0 });
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [emailProjectId, setEmailProjectId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: projectsData }, { data: analysisData }] = await Promise.all([
        supabase.from('rfp_projects').select('*').is('archived_at', null).order('created_at', { ascending: false }),
        supabase.from('ai_analysis_results').select('project_id, status, full_analysis_json'),
      ]);

      const email = localStorage.getItem('userEmail') || '';
      setUserEmail(email);

      const rawProjects = (projectsData as RfpProject[]) ?? [];

      // Single source of truth: structured_json.recommendation → opportunity_overview.recommendation → bid_desk_summary fallback
      const recMap: Record<string, string> = {};
      for (const a of (analysisData ?? [])) {
        const full = (a.full_analysis_json as Record<string, unknown>) ?? {};
        // New schema: recommendation at root of structured_json (which is spread flat)
        const rootRec = String(full.recommendation || '');
        if (rootRec) { recMap[a.project_id] = rootRec; continue; }
        // New schema: opportunity_overview.recommendation
        const ov = (full.opportunity_overview as Record<string, unknown>) ?? {};
        const ovRec = String(ov.recommendation || '');
        if (ovRec) { recMap[a.project_id] = ovRec; continue; }
        // Legacy fallback: bid_desk_summary
        const bidDesk = (full.bid_desk_summary as Record<string, unknown>) ?? {};
        const legacyRec = String(bidDesk.go_no_go || bidDesk.go_no_go_signal || '');
        if (legacyRec) recMap[a.project_id] = legacyRec;
      }

      const enriched: ProjectWithRec[] = rawProjects.map(p => ({
        ...p,
        go_no_go: recMap[p.id] || (p as RfpProject & { recommendation?: string }).recommendation || undefined,
      }));

      setProjects(enriched);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setStats({
        total: rawProjects.length,
        completed: (analysisData ?? []).filter(a => a.status === 'completed').length,
        thisMonth: rawProjects.filter(p => new Date(p.created_at) >= monthStart).length,
        institutions: new Set(rawProjects.map(p => p.client_name).filter(Boolean)).size,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'institution') return (a.client_name || '').localeCompare(b.client_name || '');
    if (sortBy === 'recommendation') return (a.go_no_go || '').localeCompare(b.go_no_go || '');
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest First',
    oldest: 'Oldest First',
    institution: 'Institution Name A–Z',
    recommendation: 'Recommendation',
  };

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from('rfp_projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setConfirmDeleteId(null);
    setDeletingId(null);
    fetchAll();
  }

  const statCards = [
    { label: 'Total Analyses', value: stats.total, icon: FileText, color: '#00E5FF' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: '#00F5A0' },
    { label: 'This Month', value: stats.thisMonth, icon: Calendar, color: '#FFB020' },
    { label: 'Institutions', value: stats.institutions, icon: Building2, color: '#9CAEC4' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="workspace" onNavigate={onNavigate} />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="px-8 py-6 border-b sticky top-0 z-10 backdrop-blur-md"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(3,7,18,0.92)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-text-primary">
                {userEmail ? getGreeting(userEmail) : 'Workspace'}
              </h1>
              <p className="text-text-muted text-sm mt-0.5">Your active RFP intelligence workspace</p>
            </div>
            <button
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#030712', boxShadow: '0 0 20px rgba(0,229,255,0.2)' }}>
              <Plus className="w-4 h-4" />
              New Analysis
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl p-5 flex items-start justify-between transition-all"
                  style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                  <div>
                    <div className="font-bold text-3xl font-mono mb-1" style={{ color: s.color }}>
                      {loading
                        ? <div className="w-8 h-7 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
                        : s.value}
                    </div>
                    <div className="text-[11px] text-text-muted uppercase tracking-wider">{s.label}</div>
                  </div>
                  <Icon className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: 'rgba(156,174,196,0.4)' }} />
                </div>
              );
            })}
          </div>

          {/* Projects list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary">Recent Analyses</h2>
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted transition-all hover:text-text-primary"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                  {sortLabels[sortBy]}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl z-20 min-w-[180px]"
                    style={{ background: '#0D1829', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                      <button key={key}
                        onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs transition-colors"
                        style={{ color: sortBy === key ? '#00E5FF' : '#9CAEC4', background: sortBy === key ? 'rgba(0,229,255,0.06)' : 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = sortBy === key ? 'rgba(0,229,255,0.06)' : 'transparent'; }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Empty state */}
            {!loading && sortedProjects.length === 0 && (
              <div className="rounded-2xl py-20 text-center"
                style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(0,229,255,0.3)' }} />
                <p className="text-text-primary font-semibold mb-1">No analyses yet</p>
                <p className="text-text-muted text-sm mb-6">Upload your first BFSI RFP to get started</p>
                <button onClick={() => onNavigate('upload')}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#030712' }}>
                  + New Analysis
                </button>
              </div>
            )}

            {/* Table */}
            {(loading || sortedProjects.length > 0) && (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#08111F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold">RFP Details</th>
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold">Recommendation</th>
                        <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold">Created</th>
                        <th className="px-6 py-3 text-right text-[10px] uppercase tracking-wider text-text-muted font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                        : sortedProjects.map(row => {
                            if (confirmDeleteId === row.id) {
                              return (
                                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,77,109,0.04)' }}>
                                  <td colSpan={4} className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-text-secondary">
                                        Delete <span className="font-semibold text-text-primary">"{cleanTitle(row.title)}"</span>? This cannot be undone.
                                      </span>
                                      <button
                                        onClick={() => handleDelete(row.id)}
                                        disabled={deletingId === row.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                        style={{ background: 'rgba(255,77,109,0.15)', border: '1px solid rgba(255,77,109,0.3)', color: '#FF4D6D' }}>
                                        {deletingId === row.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                        Yes, Delete
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-3 py-1.5 rounded-lg text-xs text-text-muted transition-colors hover:text-text-primary"
                                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                                        Cancel
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={row.id}
                                className="transition-colors"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-sm text-text-primary leading-tight mb-1">
                                    {cleanTitle(row.title)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                    <Building2 className="w-3 h-3 flex-shrink-0" />
                                    {row.client_name
                                      ? <span>{row.client_name}</span>
                                      : <span className="italic opacity-60">Institution not specified</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <RecBadge value={row.go_no_go} />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Created</div>
                                  <div className="text-xs text-text-secondary font-medium">{formatDate(row.created_at)}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <ActionBtn icon={<Eye className="w-3.5 h-3.5" />} tooltip="View Intelligence Brief" hoverColor="#00E5FF" onClick={() => onNavigate('brief', row)} />
                                    <ActionBtn icon={<Mail className="w-3.5 h-3.5" />} tooltip="Email Intelligence Brief" hoverColor="#00E5FF" onClick={() => setEmailProjectId(row.id)} />
                                    <ActionBtn icon={<Download className="w-3.5 h-3.5" />} tooltip="Download PDF" hoverColor="#00E5FF" onClick={() => onNavigate('export')} />
                                    <ActionBtn icon={<Trash2 className="w-3.5 h-3.5" />} tooltip="Delete Analysis" hoverColor="#FF4D6D" onClick={() => setConfirmDeleteId(row.id)} />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {emailProjectId && (
        <EmailModal
          projectId={emailProjectId}
          userEmail={userEmail}
          onClose={() => setEmailProjectId(null)}
        />
      )}
    </div>
  );
}
