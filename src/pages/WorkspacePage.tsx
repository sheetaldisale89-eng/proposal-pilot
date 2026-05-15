import { Upload, ExternalLink, Download, FileDown, TrendingUp, FileText, Clock, AlertTriangle, BarChart2, RefreshCw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useProjects } from '@/hooks/useProjects';
import type { RfpProject } from '@/lib/types';

interface WorkspacePageProps {
  onNavigate: (page: string, data?: unknown) => void;
}

function recommendationStyle(rec: string) {
  if (rec === 'Strong Pursuit') return { color: '#00F5A0', bg: 'rgba(0,245,160,0.1)', border: 'rgba(0,245,160,0.25)' };
  if (rec === 'No-Go') return { color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)', border: 'rgba(255,77,109,0.2)' };
  if (rec === 'Needs Review') return { color: '#FFB020', bg: 'rgba(255,176,32,0.08)', border: 'rgba(255,176,32,0.2)' };
  if (rec === 'Pursue Selectively') return { color: '#FFB020', bg: 'rgba(255,176,32,0.08)', border: 'rgba(255,176,32,0.2)' };
  return { color: '#9CAEC4', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };
}

function riskColor(risk: string) {
  if (risk === 'High' || risk === 'Medium-High') return '#FF4D6D';
  if (risk === 'Medium') return '#FFB020';
  if (risk === 'Low') return '#00F5A0';
  return '#9CAEC4';
}

function statusColor(status: string) {
  if (status === 'completed') return '#00E5FF';
  if (status === 'processing') return '#8B5CF6';
  if (status === 'draft') return '#FFB020';
  return '#9CAEC4';
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkspacePage({ onNavigate }: WorkspacePageProps) {
  const { projects, loading, error, fetchProjects } = useProjects();

  const totalProjects = projects.length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const processing = projects.filter(p => p.status === 'processing').length;
  const highRisk = projects.filter(p => p.risk_level === 'High' || p.risk_level === 'Medium-High').length;
  const avgConfidence = projects.length
    ? Math.round(projects.filter(p => p.confidence_score != null).reduce((a, p) => a + (p.confidence_score ?? 0), 0) / Math.max(1, projects.filter(p => p.confidence_score != null).length))
    : 0;

  const metrics = [
    { label: 'RFPs Analyzed', value: String(totalProjects), icon: FileText, color: '#00E5FF', bgColor: 'rgba(0,229,255,0.08)' },
    { label: 'Reports Completed', value: String(completed), icon: TrendingUp, color: '#00F5A0', bgColor: 'rgba(0,245,160,0.08)' },
    { label: 'Awaiting Review', value: String(processing), icon: Clock, color: '#FFB020', bgColor: 'rgba(255,176,32,0.08)' },
    { label: 'High-Risk Pursuits', value: String(highRisk), icon: AlertTriangle, color: '#FF4D6D', bgColor: 'rgba(255,77,109,0.08)' },
    { label: 'Avg. Confidence', value: projects.length ? `${avgConfidence}%` : '—', icon: BarChart2, color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.08)' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="workspace" onNavigate={onNavigate} />

      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="px-8 py-5 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(3,7,18,0.9)' }}>
          <div>
            <h1 className="font-serif text-2xl font-bold text-text-primary">Pursuit Intelligence Workspace</h1>
            <p className="text-text-muted text-sm mt-0.5">Active pursuit analyses and intelligence briefs</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProjects}
              title="Refresh"
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#64748B' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F5F9FF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-background transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', boxShadow: '0 0 20px rgba(0,229,255,0.2)' }}
            >
              <Upload className="w-4 h-4" />
              Upload RFP
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="rounded-xl p-4 card-hover" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: m.bgColor }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                    </div>
                  </div>
                  <div className="font-serif text-2xl font-bold mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-text-muted text-xs uppercase tracking-wider">{m.label}</div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <h2 className="text-text-primary font-semibold">Recent Intelligence Briefs</h2>
                <p className="text-text-muted text-xs mt-0.5">
                  {loading ? 'Loading...' : `${projects.length} pursuit ${projects.length === 1 ? 'analysis' : 'analyses'}`}
                </p>
              </div>
            </div>

            {error && (
              <div className="px-6 py-4 text-sm" style={{ color: '#FF4D6D' }}>
                Error loading projects: {error}
              </div>
            )}

            {!loading && projects.length === 0 && !error && (
              <div className="px-6 py-16 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" />
                <div className="text-text-muted text-sm mb-4">No RFP analyses yet.</div>
                <button
                  onClick={() => onNavigate('upload')}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-background"
                  style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)' }}
                >
                  Upload your first RFP
                </button>
              </div>
            )}

            {(loading || projects.length > 0) && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Opportunity', 'Institution', 'Segment', 'Deadline', 'Recommendation', 'Risk Level', 'Confidence', 'Status', 'Actions'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-text-muted first:pl-6 last:pr-6">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            {Array.from({ length: 9 }).map((_, j) => (
                              <td key={j} className="px-4 py-4">
                                <div className="h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: j === 0 ? 160 : j === 8 ? 100 : 80 }} />
                              </td>
                            ))}
                          </tr>
                        ))
                      : projects.map((row: RfpProject) => {
                          const rec = recommendationStyle(row.recommendation);
                          return (
                            <tr
                              key={row.id}
                              className="border-b transition-colors"
                              style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td className="px-4 py-4 pl-6">
                                <div className="text-text-primary text-sm font-medium leading-tight max-w-[200px]">{row.title}</div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-text-secondary text-sm max-w-[160px] leading-tight">{row.client_name}</div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-xs px-2 py-1 rounded-full text-text-secondary" style={{ background: 'rgba(255,255,255,0.05)' }}>{row.institution_type}</span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-xs font-mono text-text-secondary">{formatDate(row.due_date)}</span>
                              </td>
                              <td className="px-4 py-4">
                                {row.recommendation ? (
                                  <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: rec.bg, color: rec.color, border: `1px solid ${rec.border}` }}>
                                    {row.recommendation}
                                  </span>
                                ) : (
                                  <span className="text-xs text-text-muted">—</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-xs font-medium" style={{ color: riskColor(row.risk_level) }}>{row.risk_level || '—'}</span>
                              </td>
                              <td className="px-4 py-4">
                                {row.confidence_score != null ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full max-w-[60px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                      <div className="h-full rounded-full" style={{ width: `${row.confidence_score}%`, background: '#00E5FF' }} />
                                    </div>
                                    <span className="text-xs font-mono text-neon-cyan">{row.confidence_score}%</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-text-muted">—</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-xs font-medium" style={{ color: statusColor(row.status) }}>
                                  {row.status === 'processing' ? (
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#8B5CF6' }} />
                                      Processing
                                    </span>
                                  ) : (
                                    row.status.charAt(0).toUpperCase() + row.status.slice(1)
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-4 pr-6">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onNavigate('brief', row)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:scale-105"
                                    style={{ background: 'rgba(0,229,255,0.08)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.2)' }}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Brief
                                  </button>
                                  <button
                                    onClick={() => onNavigate('export')}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:scale-105"
                                    style={{ background: 'rgba(255,255,255,0.05)', color: '#9CAEC4', border: '1px solid rgba(255,255,255,0.08)' }}
                                  >
                                    <Download className="w-3 h-3" />
                                    PDF
                                  </button>
                                  <button
                                    onClick={() => onNavigate('export')}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-all hover:scale-105"
                                    style={{ background: 'rgba(255,255,255,0.05)', color: '#9CAEC4', border: '1px solid rgba(255,255,255,0.08)' }}
                                  >
                                    <FileDown className="w-3 h-3" />
                                    Word
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
