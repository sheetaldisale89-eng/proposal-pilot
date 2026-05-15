import { useState, useRef, useEffect } from 'react';
import { Download, FileDown, ArrowLeft, CheckCircle, Circle, AlertTriangle, ChevronRight, Loader2, AlertCircle, Mail } from 'lucide-react';
import type { RfpProject } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import EmailModal from '@/components/EmailModal';

interface IntelligenceBriefProps {
  onNavigate: (page: string) => void;
  project?: RfpProject | null;
}

interface AiAnalysis {
  id: string;
  status: string;
  executive_summary: string | null;
  scope_summary: string | null;
  full_analysis_json: Record<string, unknown> | null;
  confidence_score: number | null;
  completed_at: string | null;
}

// ─── Sidebar sections in new order ───────────────────────────────────────────
const sidebarSections = [
  { id: 'snapshot',   label: 'RFP Snapshot' },
  { id: 'scope',      label: 'Scope of Work' },
  { id: 'eligibility',label: 'Eligibility & Compliance' },
  { id: 'evaluation', label: 'Evaluation Criteria' },
  { id: 'risk',       label: 'Risk Radar' },
  { id: 'questions',  label: 'Clarification Questions' },
  { id: 'strategy',   label: 'Proposal Strategy' },
  { id: 'actions',    label: 'Next Actions' },
  { id: 'decision',   label: 'Decision Summary' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function safeStr(val: unknown, fallback = 'Not specified'): string {
  if (val === null || val === undefined || val === '') return fallback;
  return String(val);
}
function safeArr<T>(val: unknown): T[] {
  if (!val || !Array.isArray(val)) return [];
  return val as T[];
}
function safeObj(val: unknown): Record<string, unknown> {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return {};
  return val as Record<string, unknown>;
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0"
        style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
        {number}
      </div>
      <h2 className="font-serif text-2xl font-bold text-text-primary">{title}</h2>
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="rounded-xl p-6 text-center" style={{ background: '#08111F', border: '1px dashed rgba(255,255,255,0.1)' }}>
      <AlertCircle className="w-6 h-6 mx-auto mb-3" style={{ color: '#9CAEC4' }} />
      <p className="text-text-muted text-sm">{message || 'This data was not found in the analyzed pages. Consider re-uploading with a higher page limit.'}</p>
    </div>
  );
}

function MandatoryBadge({ mandatory }: { mandatory: boolean }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
      style={{ background: mandatory ? 'rgba(255,77,109,0.12)' : 'rgba(156,174,196,0.12)', color: mandatory ? '#FF4D6D' : '#9CAEC4' }}>
      {mandatory ? 'Mandatory' : 'Desirable'}
    </span>
  );
}

function AssessmentBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const color = v.startsWith('can meet') ? '#00F5A0' : v.startsWith('cannot') ? '#FF4D6D' : '#FFB020';
  const bg = v.startsWith('can meet') ? 'rgba(0,245,160,0.1)' : v.startsWith('cannot') ? 'rgba(255,77,109,0.1)' : 'rgba(255,176,32,0.1)';
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold"
      style={{ background: bg, color }}>{value}</span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  const color = p === 'high' ? '#FF4D6D' : p === 'medium' ? '#FFB020' : '#9CAEC4';
  const bg = p === 'high' ? 'rgba(255,77,109,0.1)' : p === 'medium' ? 'rgba(255,176,32,0.1)' : 'rgba(156,174,196,0.1)';
  return (
    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
      style={{ background: bg, color }}>{priority}</span>
  );
}

function GoNoGoBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const isPursue = v === 'pursue';
  const isCaution = v.includes('caution');
  const color = isPursue ? '#00F5A0' : isCaution ? '#FFB020' : '#FF4D6D';
  const bg = isPursue ? 'rgba(0,245,160,0.1)' : isCaution ? 'rgba(255,176,32,0.1)' : 'rgba(255,77,109,0.1)';
  const border = isPursue ? 'rgba(0,245,160,0.3)' : isCaution ? 'rgba(255,176,32,0.3)' : 'rgba(255,77,109,0.3)';
  return (
    <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl mb-6"
      style={{ background: bg, border: `2px solid ${border}`, boxShadow: `0 0 40px ${bg}` }}>
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span className="font-serif text-3xl font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function ComplexityDot({ level }: { level: string }) {
  const l = level.toLowerCase();
  const color = l === 'high' ? '#FF4D6D' : l === 'medium' ? '#FFB020' : '#00F5A0';
  return <span className="inline-flex items-center gap-1.5">
    <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
    <span style={{ color }} className="font-semibold">{level}</span>
  </span>;
}

function inferProofRequired(criterion: string, subCriterion: string): string {
  const text = (criterion + ' ' + subCriterion).toLowerCase();
  if (text.includes('turnover') || text.includes('revenue') || text.includes('financial'))
    return 'Audited financial statements, CA certificate on letterhead';
  if (text.includes('experience') || text.includes('project') || text.includes('engagement'))
    return 'Work orders / LoA, completion certificates, client references on letterhead';
  if (text.includes('team') || text.includes('resource') || text.includes('staff') || text.includes('personnel'))
    return 'CVs with qualification certificates, employment proof';
  if (text.includes('certif') || text.includes('iso') || text.includes('cmmi'))
    return 'Valid certificate copies (with expiry date)';
  if (text.includes('incorporation') || text.includes('legal') || text.includes('entity'))
    return 'Certificate of incorporation, MoA/AoA';
  if (text.includes('pan') || text.includes('gst') || text.includes('tax'))
    return 'PAN card copy, GST registration certificate';
  return 'Supporting documentation as specified by the issuing authority';
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function IntelligenceBrief({ onNavigate, project }: IntelligenceBriefProps) {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('snapshot');
  const [actionStatus, setActionStatus] = useState<Record<string, boolean>>({});
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const projectId = project?.id || localStorage.getItem('lastProjectId');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    if (!projectId) { setFetchError('No project selected.'); setLoading(false); return; }
    supabase
      .from('ai_analysis_results')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setFetchError(`Failed to load analysis: ${error.message}`);
        else if (!data) setFetchError('No analysis found for this project.');
        else setAnalysis(data as AiAnalysis);
        setLoading(false);
      });
  }, [projectId]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const rfpTitle = project?.title || 'RFP Intelligence Brief';
  const institution = project?.client_name || '—';
  const segment = project?.institution_type || '—';
  const dueDate = project?.due_date
    ? new Date(project.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00E5FF' }} />
        <p className="text-text-muted text-sm">Loading analysis...</p>
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <AlertCircle className="w-10 h-10" style={{ color: '#FF4D6D' }} />
        <p className="text-text-primary font-semibold">Analysis Not Found</p>
        <p className="text-text-muted text-sm">{fetchError}</p>
        <button onClick={() => onNavigate('workspace')}
          className="mt-2 px-5 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
          Back to Workspace
        </button>
      </div>
    </div>
  );

  if (!analysis?.full_analysis_json) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <AlertCircle className="w-10 h-10" style={{ color: '#FFB020' }} />
        <p className="text-text-primary font-semibold">Analysis Data Not Found</p>
        <p className="text-text-muted text-sm">Analysis data not found. Please re-upload the document.</p>
        <button onClick={() => onNavigate('upload')}
          className="mt-2 px-5 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
          Re-upload Document
        </button>
      </div>
    </div>
  );

  // ─── Data extraction ────────────────────────────────────────────────────────
  const full = safeObj(analysis.full_analysis_json);

  const snap      = safeObj(full.rfp_snapshot);
  const bidDesk   = safeObj(full.bid_desk_summary);
  const nextSteps = safeObj(full.next_steps ?? (safeObj(full.recommended_next_steps)));

  type EligItem   = { criterion: string; requirement: string; mandatory: boolean; evidence_required: string; ey_assessment: string };
  type ScopeItem  = { workstream: string; what_bank_wants: string; deliverables: string[]; timeline: string };
  type EvalItem   = { stage: string; criterion: string; sub_criterion: string; parameters: string; marks: number | string; max_marks: number | string };
  type RedFlag    = { flag: string; detail: string; risk_level: string; recommended_action: string };
  type LegalRisk  = { risk: string; detail: string; impact: string; suggested_clarification: string };
  type ClarQ      = { question: string; section_reference: string; priority: string; why_critical: string };
  type WinTheme   = { theme: string; rationale: string; proof_points: string };

  const eligibilityArr   = safeArr<EligItem>(full.eligibility_criteria);
  const scopeArr         = safeArr<ScopeItem>(full.scope_of_work);
  const evaluationArr    = safeArr<EvalItem>(full.evaluation_criteria);
  const redFlagsArr      = safeArr<RedFlag>(full.red_flags);
  const legalRisksArr    = safeArr<LegalRisk>(full.legal_commercial_risks);
  const clarQsArr        = safeArr<ClarQ>(full.clarification_questions);
  const winThemesArr     = safeArr<WinTheme>(full.win_themes);

  const next24h         = safeArr<string>(nextSteps.within_24_hours);
  const next3d          = safeArr<string>(nextSteps.within_3_days);
  const nextPreBid      = safeArr<string>(nextSteps.before_pre_bid);
  const nextSubmission  = safeArr<string>(nextSteps.before_submission);

  const recommendation  = safeStr(bidDesk.go_no_go || bidDesk.go_no_go_signal, project?.recommendation || 'Pending Analysis');
  const goNoGoReasoning = safeStr(bidDesk.go_no_go_reasoning, '');
  const topRisks        = safeArr<string>(bidDesk.top_risks);
  const immediateActions= safeArr<string>(bidDesk.immediate_actions);
  const strategicFit    = safeStr(bidDesk.strategic_fit, 'Not specified');
  const bidComplexity   = safeStr(bidDesk.bid_complexity, 'Not specified');
  const oneLiner        = safeStr(bidDesk.one_line_summary, '');

  // Eligibility summary bar
  const totalCriteria  = eligibilityArr.length;
  const mandatoryCount = eligibilityArr.filter(e => e.mandatory !== false).length;
  const canMeetCount   = eligibilityArr.filter(e => safeStr(e.ey_assessment).toLowerCase().startsWith('can meet')).length;
  const atRiskCount    = eligibilityArr.filter(e => {
    const a = safeStr(e.ey_assessment).toLowerCase();
    return a.startsWith('cannot') || a.startsWith('partially');
  }).length;

  // Eval marks totals
  const totalTechMarks = evaluationArr
    .filter(e => safeStr(e.stage).toLowerCase().includes('tech'))
    .reduce((sum, e) => sum + (Number(e.max_marks) || 0), 0);
  const totalFinMarks = evaluationArr
    .filter(e => safeStr(e.stage).toLowerCase().includes('fin'))
    .reduce((sum, e) => sum + (Number(e.max_marks) || 0), 0);

  // Sort risk flags: High → Medium → Low
  const riskOrder = (l: string) => l.toLowerCase() === 'high' ? 0 : l.toLowerCase() === 'medium' ? 1 : 2;
  const sortedRedFlags = [...redFlagsArr].sort((a, b) => riskOrder(safeStr(a.risk_level)) - riskOrder(safeStr(b.risk_level)));

  // Sort clarification questions: High → Medium → Low
  const sortedClarQs = [...clarQsArr].sort((a, b) => riskOrder(safeStr(a.priority)) - riskOrder(safeStr(b.priority)));

  const confidenceScore = analysis?.confidence_score ?? null;

  // ─── Snapshot rows ──────────────────────────────────────────────────────────
  const snapFields = [
    { label: 'Issuing Authority',         key: 'issuing_authority',        highlight: false },
    { label: 'RFP Reference Number',      key: 'rfp_reference',            highlight: false },
    { label: 'RFP Title',                 key: 'rfp_title',                highlight: false },
    { label: 'Release Date',              key: 'release_date',             highlight: false },
    { label: 'Pre-Bid Meeting Date',      key: 'pre_bid_meeting',          highlight: false },
    { label: 'Clarification Deadline',    key: 'clarification_deadline',   highlight: false },
    { label: 'Submission Deadline',       key: 'submission_deadline',      highlight: true  },
    { label: 'Bid Opening Date',          key: 'bid_opening_date',         highlight: false },
    { label: 'Contract Duration',         key: 'contract_duration',        highlight: false },
    { label: 'Estimated Contract Value',  key: 'contract_value',           highlight: false },
    { label: 'EMD Amount',                key: 'emd_amount',               highlight: false },
    { label: 'Performance Bank Guarantee',key: 'performance_guarantee',    highlight: false },
    { label: 'Evaluation Method',         key: 'evaluation_method',        highlight: false },
    { label: 'Submission Mode',           key: 'submission_mode',          highlight: false },
  ];

  return (
    <>
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top header ────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between border-b backdrop-blur-md"
        style={{ background: 'rgba(3,7,18,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('workspace')}
            className="flex items-center gap-1.5 text-text-muted text-sm hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Workspace
          </button>
          <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div className="text-text-primary font-semibold text-sm">{rfpTitle}</div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{institution}</span>
              {institution !== '—' && <><span>·</span><span>{segment}</span></>}
              {dueDate !== '—' && <><span>·</span><span>Due {dueDate}</span></>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}>
            <Mail className="w-3.5 h-3.5" /> Email Brief
          </button>
          <button onClick={() => onNavigate('export')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-background transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FFD166, #FFB020)', boxShadow: '0 0 20px rgba(255,209,102,0.2)' }}>
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => onNavigate('export')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}>
            <FileDown className="w-3.5 h-3.5" /> Word
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* ── Left sidebar ──────────────────────────────────────────────────── */}
        <div className="w-56 flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-6 px-3 space-y-1"
          style={{ background: '#08111F', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[10px] text-text-muted uppercase tracking-widest px-3 mb-3">Report Sections</div>
          {sidebarSections.map((s, i) => (
            <button key={s.id} onClick={() => scrollToSection(s.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all"
              style={{
                background: activeSection === s.id ? 'rgba(0,229,255,0.08)' : 'transparent',
                color: activeSection === s.id ? '#00E5FF' : '#9CAEC4',
                border: activeSection === s.id ? '1px solid rgba(0,229,255,0.15)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (activeSection !== s.id) { e.currentTarget.style.color = '#F5F9FF'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; } }}
              onMouseLeave={e => { if (activeSection !== s.id) { e.currentTarget.style.color = '#9CAEC4'; e.currentTarget.style.background = 'transparent'; } }}>
              <span className="text-[10px] font-mono opacity-50">{String(i + 1).padStart(2, '0')}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Main content ───────────────────────────────────────────────────── */}
        <div ref={contentRef} className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-10 space-y-16">

            {/* ══ 01. RFP SNAPSHOT ══════════════════════════════════════════ */}
            <section id="section-snapshot">
              <SectionHeader number="01" title="RFP Snapshot" />
              {snapFields.some(f => snap[f.key]) ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {snapFields.map(f => {
                    const val = safeStr(snap[f.key], '');
                    return (
                      <div key={f.key} className="rounded-xl p-4"
                        style={{
                          background: f.highlight ? 'rgba(255,176,32,0.06)' : '#08111F',
                          border: f.highlight ? '1px solid rgba(255,176,32,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        }}>
                        <div className="text-[10px] uppercase tracking-wider mb-1.5"
                          style={{ color: f.highlight ? '#FFB020' : '#9CAEC4' }}>{f.label}</div>
                        <div className="font-bold text-sm leading-snug"
                          style={{ color: f.highlight ? '#FFD166' : val ? '#F5F9FF' : '#4A5568' }}>
                          {val || 'Not specified'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyState />}
            </section>

            <div className="section-divider" />

            {/* ══ 02. SCOPE OF WORK ═════════════════════════════════════════ */}
            <section id="section-scope">
              <SectionHeader number="02" title="Scope of Work" />
              {scopeArr.length > 0 ? (
                <div className="space-y-5">
                  {scopeArr.map((ws, i) => (
                    <div key={i} className="rounded-2xl p-6"
                      style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.1)' }}>
                      {/* Title */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0"
                          style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <h3 className="font-semibold text-base text-text-primary">{safeStr(ws.workstream, 'Workstream')}</h3>
                      </div>

                      {/* What bank wants */}
                      <div className="mb-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#00E5FF' }}>What the Bank Wants</div>
                        <p className="text-text-secondary text-sm leading-relaxed">{safeStr(ws.what_bank_wants)}</p>
                      </div>

                      {/* Deliverables */}
                      {safeArr<string>(ws.deliverables).length > 0 && (
                        <div className="mb-4">
                          <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-text-muted">Key Deliverables</div>
                          <ul className="space-y-1.5">
                            {safeArr<string>(ws.deliverables).map((d, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-text-secondary">
                                <span style={{ color: '#00E5FF' }} className="mt-1 flex-shrink-0">•</span>
                                {safeStr(d)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flex items-center gap-2 text-xs mb-3">
                        <span className="text-text-muted uppercase tracking-wider">Timeline:</span>
                        <span className="font-medium" style={{ color: safeStr(ws.timeline, '') && ws.timeline !== 'Not specified' ? '#FFD166' : '#4A5568' }}>
                          {safeStr(ws.timeline, 'Not specified')}
                        </span>
                      </div>

                      {/* EY implication */}
                      <div className="rounded-lg px-4 py-2.5" style={{ background: 'rgba(255,209,102,0.04)', border: '1px solid rgba(255,209,102,0.1)' }}>
                        <span className="text-[10px] font-semibold uppercase tracking-wider mr-2" style={{ color: '#FFD166' }}>What This Means for EY:</span>
                        <span className="text-xs text-text-muted italic">
                          {(() => {
                            const w = safeStr(ws.workstream).toLowerCase();
                            const b = safeStr(ws.what_bank_wants).toLowerCase();
                            if (w.includes('audit') || b.includes('audit')) return 'Requires dedicated audit capability and prior banking sector audit engagements.';
                            if (w.includes('digital') || b.includes('digital')) return 'Digital transformation credentials and technology partner network will be critical differentiators.';
                            if (w.includes('risk') || b.includes('risk')) return 'Enterprise risk management practice must lead this workstream with BFSI-specific risk frameworks.';
                            if (w.includes('compliance') || b.includes('compliance') || w.includes('regul') || b.includes('regul')) return 'Regulatory compliance expertise and RBI/SEBI/IRDAI experience must be front and center.';
                            if (w.includes('technology') || b.includes('technology') || w.includes('it ') || b.includes(' it ')) return 'Technology advisory team with core banking implementation experience is essential.';
                            if (w.includes('strategy') || b.includes('strategy')) return 'Senior partner-led engagement with strategy practice; requires board-level banking relationships.';
                            if (w.includes('hr') || b.includes('human resource') || b.includes('talent')) return 'People advisory practice with banking sector HR transformation track record needed.';
                            return 'Cross-functional team required spanning advisory, technology, and domain-specific banking expertise.';
                          })()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState />}
            </section>

            <div className="section-divider" />

            {/* ══ 03. ELIGIBILITY & COMPLIANCE ══════════════════════════════ */}
            <section id="section-eligibility">
              <SectionHeader number="03" title="Eligibility & Compliance" />

              {eligibilityArr.length > 0 ? (
                <>
                  {/* Summary bar */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Total Criteria', value: totalCriteria, color: '#00E5FF' },
                      { label: 'Mandatory',       value: mandatoryCount, color: '#FF4D6D' },
                      { label: 'Can Meet',         value: canMeetCount,   color: '#00F5A0' },
                      { label: 'At Risk',          value: atRiskCount,    color: '#FFB020' },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-xl p-4 text-center"
                        style={{ background: '#08111F', border: `1px solid rgba(${stat.color === '#00E5FF' ? '0,229,255' : stat.color === '#FF4D6D' ? '255,77,109' : stat.color === '#00F5A0' ? '0,245,160' : '255,176,32'},0.2)` }}>
                        <div className="text-2xl font-bold font-mono mb-1" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: '#08111F', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            {['Criterion', 'Exact Requirement', 'Type', 'Evidence Required', 'EY Assessment'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {eligibilityArr.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(8,17,31,0.8)' : 'rgba(15,27,46,0.4)' }}>
                              <td className="px-4 py-3 font-semibold text-text-primary align-top whitespace-nowrap">{safeStr(item.criterion)}</td>
                              <td className="px-4 py-3 text-text-secondary align-top" style={{ minWidth: 220 }}>{safeStr(item.requirement)}</td>
                              <td className="px-4 py-3 align-top whitespace-nowrap"><MandatoryBadge mandatory={item.mandatory !== false} /></td>
                              <td className="px-4 py-3 text-text-muted align-top" style={{ minWidth: 180 }}>{safeStr(item.evidence_required)}</td>
                              <td className="px-4 py-3 align-top whitespace-nowrap"><AssessmentBadge value={safeStr(item.ey_assessment, 'Pending Review')} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : <EmptyState />}
            </section>

            <div className="section-divider" />

            {/* ══ 04. EVALUATION CRITERIA ═══════════════════════════════════ */}
            <section id="section-evaluation">
              <SectionHeader number="04" title="Evaluation Criteria" />

              {evaluationArr.length > 0 ? (
                <>
                  {/* Totals bar */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    {totalTechMarks > 0 && (
                      <div className="rounded-xl px-5 py-3 flex items-center gap-3"
                        style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider">Total Technical Marks</span>
                        <span className="font-bold text-lg font-mono" style={{ color: '#00E5FF' }}>{totalTechMarks}</span>
                      </div>
                    )}
                    {totalFinMarks > 0 && (
                      <div className="rounded-xl px-5 py-3 flex items-center gap-3"
                        style={{ background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.2)' }}>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider">Total Financial Marks</span>
                        <span className="font-bold text-lg font-mono" style={{ color: '#FFD166' }}>{totalFinMarks}</span>
                      </div>
                    )}
                  </div>

                  {/* Expanded cards */}
                  <div className="space-y-4">
                    {evaluationArr.map((item, i) => {
                      const marks = Number(item.marks) || 0;
                      const maxMarks = Number(item.max_marks) || 0;
                      const pct = maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;
                      const stageLower = safeStr(item.stage).toLowerCase();
                      const stageColor = stageLower.includes('fin') ? '#FFD166' : '#00E5FF';
                      const stageLabel = safeStr(item.stage, '—').toUpperCase();
                      const proof = inferProofRequired(safeStr(item.criterion), safeStr(item.sub_criterion));

                      return (
                        <div key={i} className="rounded-2xl p-6"
                          style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {/* Stage + type badges */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
                              style={{ background: stageLower.includes('fin') ? 'rgba(255,209,102,0.1)' : 'rgba(0,229,255,0.1)', color: stageColor }}>
                              {stageLabel}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-base text-text-primary mb-1">{safeStr(item.criterion, '—')}</h3>
                          {item.sub_criterion && (
                            <p className="text-text-muted text-sm mb-4">{safeStr(item.sub_criterion)}</p>
                          )}

                          {/* What is asked */}
                          <div className="rounded-lg p-4 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-text-muted">What is Asked</div>
                            <p className="text-text-secondary text-sm leading-relaxed italic">
                              "{safeStr(item.parameters, 'Refer to the RFP document for exact parameters.')}"
                            </p>
                          </div>

                          {/* Proof required */}
                          <div className="rounded-lg p-4 mb-4" style={{ background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.1)' }}>
                            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#00E5FF' }}>Proof Required</div>
                            <p className="text-text-muted text-sm">{proof}</p>
                          </div>

                          {/* Marks + progress bar */}
                          {maxMarks > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-text-muted">Marks</span>
                                <span className="text-sm font-bold font-mono" style={{ color: stageColor }}>
                                  {marks} <span className="text-text-muted font-normal">/ {maxMarks}</span>
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: stageColor }} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : <EmptyState />}
            </section>

            <div className="section-divider" />

            {/* ══ 05. RISK RADAR ════════════════════════════════════════════ */}
            <section id="section-risk">
              <SectionHeader number="05" title="Risk Radar" />

              {sortedRedFlags.length > 0 || legalRisksArr.length > 0 ? (
                <>
                  {sortedRedFlags.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {sortedRedFlags.map((r, i) => {
                        const level = safeStr(r.risk_level, 'Medium').toLowerCase();
                        const borderColor = level === 'high' ? '#FF4D6D' : level === 'medium' ? '#FFB020' : '#FFD166';
                        const bgColor = level === 'high' ? 'rgba(255,77,109,0.04)' : level === 'medium' ? 'rgba(255,176,32,0.04)' : 'rgba(255,209,102,0.03)';
                        return (
                          <div key={i} className="rounded-xl p-5"
                            style={{ background: bgColor, borderLeft: `3px solid ${borderColor}`, border: `1px solid rgba(255,255,255,0.06)`, borderLeftWidth: 3, borderLeftColor: borderColor }}>
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h3 className="font-semibold text-sm text-text-primary flex-1">{safeStr(r.flag)}</h3>
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex-shrink-0"
                                style={{ background: `${bgColor}`, border: `1px solid ${borderColor}`, color: borderColor }}>
                                {safeStr(r.risk_level, 'Medium')} Risk
                              </span>
                            </div>
                            {r.detail && (
                              <div className="mb-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">What: </span>
                                <span className="text-text-muted text-xs">{safeStr(r.detail)}</span>
                              </div>
                            )}
                            {r.recommended_action && (
                              <div className="mt-2 flex items-start gap-1.5">
                                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: borderColor }} />
                                <span className="text-xs font-medium" style={{ color: borderColor }}>Action: {safeStr(r.recommended_action)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {legalRisksArr.length > 0 && (
                    <>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">Legal & Commercial Risks</div>
                      <div className="space-y-3">
                        {legalRisksArr.map((r, i) => (
                          <div key={i} className="rounded-xl p-5"
                            style={{ background: 'rgba(255,176,32,0.04)', borderLeft: '3px solid #FFB020', border: '1px solid rgba(255,176,32,0.15)', borderLeftWidth: 3, borderLeftColor: '#FFB020' }}>
                            <h3 className="font-semibold text-sm text-text-primary mb-2">{safeStr(r.risk)}</h3>
                            {r.detail && <p className="text-text-muted text-xs mb-2">{safeStr(r.detail)}</p>}
                            {r.impact && <p className="text-xs mb-2"><span className="font-semibold" style={{ color: '#FFB020' }}>Impact: </span><span className="text-text-muted">{safeStr(r.impact)}</span></p>}
                            {r.suggested_clarification && <p className="text-xs text-text-muted italic">Ask: {safeStr(r.suggested_clarification)}</p>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : <EmptyState />}
            </section>

            <div className="section-divider" />

            {/* ══ 06. CLARIFICATION QUESTIONS ═══════════════════════════════ */}
            <section id="section-questions">
              <SectionHeader number="06" title="Clarification Questions" />
              {sortedClarQs.length > 0 ? (
                <div className="space-y-3">
                  {sortedClarQs.map((q, i) => (
                    <div key={i} className="rounded-xl p-5"
                      style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                          style={{ background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="font-semibold text-sm text-text-primary leading-snug">{safeStr(q.question)}</p>
                            {q.priority && <PriorityBadge priority={safeStr(q.priority)} />}
                          </div>
                          {q.section_reference && (
                            <p className="text-[10px] text-text-muted mb-1">Section: {safeStr(q.section_reference)}</p>
                          )}
                          {q.why_critical && (
                            <p className="text-xs text-text-muted italic">{safeStr(q.why_critical)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState />}
            </section>

            <div className="section-divider" />

            {/* ══ 07. PROPOSAL STRATEGY ═════════════════════════════════════ */}
            <section id="section-strategy">
              <SectionHeader number="07" title="Proposal Strategy" />
              {winThemesArr.length > 0 ? (
                <div className="space-y-4">
                  {winThemesArr.map((w, i) => (
                    <div key={i} className="rounded-2xl p-6"
                      style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.1)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: '#00E5FF' }} />
                        <h3 className="font-bold text-base text-text-primary">{safeStr(w.theme, `Win Theme ${i + 1}`)}</h3>
                      </div>
                      {w.rationale && (
                        <p className="text-text-secondary text-sm leading-relaxed mb-3">{safeStr(w.rationale)}</p>
                      )}
                      {w.proof_points && (
                        <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                          <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#00E5FF' }}>Proof Points</div>
                          <p className="text-text-muted text-xs italic">{safeStr(w.proof_points)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <EmptyState />}
            </section>

            <div className="section-divider" />

            {/* ══ 08. NEXT ACTIONS ══════════════════════════════════════════ */}
            <section id="section-actions">
              <SectionHeader number="08" title="Next Actions" />
              {(next24h.length + next3d.length + nextPreBid.length + nextSubmission.length) > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Within 24 Hours', items: next24h,        color: '#FF4D6D', bg: 'rgba(255,77,109,0.06)',   border: 'rgba(255,77,109,0.2)' },
                    { label: 'Within 3 Days',   items: next3d,         color: '#FFB020', bg: 'rgba(255,176,32,0.06)',   border: 'rgba(255,176,32,0.2)' },
                    { label: 'Before Pre-Bid',  items: nextPreBid,     color: '#00E5FF', bg: 'rgba(0,229,255,0.06)',    border: 'rgba(0,229,255,0.2)' },
                    { label: 'Before Submission',items: nextSubmission, color: '#00F5A0', bg: 'rgba(0,245,160,0.06)',   border: 'rgba(0,245,160,0.2)' },
                  ].map(col => (
                    <div key={col.label} className="rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${col.border}` }}>
                      <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider"
                        style={{ background: col.bg, color: col.color }}>{col.label}</div>
                      <div className="p-3 space-y-2" style={{ background: '#08111F' }}>
                        {col.items.length > 0 ? col.items.map((task, j) => {
                          const key = `${col.label}-${j}`;
                          const done = actionStatus[key] || false;
                          return (
                            <button key={j}
                              className="w-full flex items-start gap-2 text-left text-xs text-text-secondary transition-opacity hover:text-text-primary"
                              onClick={() => setActionStatus(prev => ({ ...prev, [key]: !prev[key] }))}>
                              {done
                                ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#00F5A0' }} />
                                : <Circle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: col.color }} />}
                              <span style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1 }}>
                                {safeStr(task)}
                              </span>
                            </button>
                          );
                        }) : (
                          <p className="text-text-muted text-xs py-2">No actions specified.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState />}
            </section>

            <div className="section-divider" />

            {/* ══ 09. DECISION SUMMARY (LAST) ═══════════════════════════════ */}
            <section id="section-decision">
              <SectionHeader number="09" title="Decision Summary" />
              <div className="grid md:grid-cols-5 gap-6">

                {/* Left 60% */}
                <div className="md:col-span-3 space-y-5">
                  <GoNoGoBadge value={recommendation} />

                  {oneLiner && (
                    <p className="text-text-muted text-sm italic border-l-2 pl-4" style={{ borderColor: '#00E5FF' }}>{oneLiner}</p>
                  )}

                  {goNoGoReasoning && (
                    <div className="rounded-2xl p-5" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">Our Recommendation</div>
                      <div className="space-y-2">
                        {goNoGoReasoning.split(/\n|(?<=\.)(?=\s[A-Z])/).filter(Boolean).map((line, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                            <span className="font-mono text-[10px] mt-1 opacity-40 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                            {line.trim()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {topRisks.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Top Risks</div>
                      {topRisks.map((risk, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                          style={{ background: 'rgba(255,77,109,0.04)', border: '1px solid rgba(255,77,109,0.15)' }}>
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FF4D6D' }} />
                          <p className="text-text-secondary text-sm">{safeStr(risk)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(strategicFit !== 'Not specified' || bidComplexity !== 'Not specified') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Strategic Fit</div>
                        <ComplexityDot level={strategicFit.split('—')[0].trim()} />
                        {strategicFit.includes('—') && (
                          <p className="text-[10px] text-text-muted mt-1">{strategicFit.split('—').slice(1).join('—').trim()}</p>
                        )}
                      </div>
                      <div className="rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Bid Complexity</div>
                        <ComplexityDot level={bidComplexity.split('—')[0].trim()} />
                        {bidComplexity.includes('—') && (
                          <p className="text-[10px] text-text-muted mt-1">{bidComplexity.split('—').slice(1).join('—').trim()}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right 40% — sticky action card */}
                <div className="md:col-span-2 space-y-4">
                  <div className="rounded-2xl p-5 sticky top-20"
                    style={{ background: '#08111F', border: '1px solid rgba(255,209,102,0.2)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#FFD166' }}>Immediate Actions Required</div>
                    <div className="space-y-3">
                      {immediateActions.length > 0 ? immediateActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(255,209,102,0.15)', color: '#FFD166' }}>
                            {i + 1}
                          </span>
                          <p className="text-text-secondary text-sm leading-relaxed">{safeStr(action)}</p>
                        </div>
                      )) : (
                        <p className="text-text-muted text-xs">No immediate actions specified.</p>
                      )}
                    </div>
                    <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] text-text-muted leading-relaxed italic">
                        This intelligence brief was prepared by ProposalPilot BFSI. Analysis based on the submitted document content.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────────── */}
        <div className="w-56 flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto p-4 space-y-4"
          style={{ background: '#08111F', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Recommendation</div>
            <div className="px-3 py-2.5 rounded-xl text-center font-serif font-bold text-sm"
              style={{ background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.25)', color: '#FFD166' }}>
              {recommendation}
            </div>
          </div>

          <div className="space-y-1.5">
            {confidenceScore !== null && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">Confidence</span>
                <span className="text-xs font-semibold" style={{ color: '#00E5FF' }}>{confidenceScore}%</span>
              </div>
            )}
            {snap.submission_deadline && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">Deadline</span>
                <span className="text-xs font-bold" style={{ color: '#FFB020' }}>{safeStr(snap.submission_deadline)}</span>
              </div>
            )}
            {sortedRedFlags.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">Red Flags</span>
                <span className="text-xs font-semibold" style={{ color: '#FF4D6D' }}>{sortedRedFlags.length}</span>
              </div>
            )}
            {sortedClarQs.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">Questions</span>
                <span className="text-xs font-semibold text-text-muted">{sortedClarQs.length}</span>
              </div>
            )}
            {eligibilityArr.length > 0 && (
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-text-muted">Elig. Criteria</span>
                <span className="text-xs font-semibold text-text-muted">{eligibilityArr.length}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <button onClick={() => onNavigate('export')}
              className="w-full py-2.5 rounded-lg text-xs font-semibold text-background flex items-center justify-center gap-1.5 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FFD166, #FFB020)' }}>
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={() => onNavigate('export')}
              className="w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-105"
              style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}>
              <FileDown className="w-3.5 h-3.5" /> Word
            </button>
          </div>
        </div>
      </div>
    </div>

    {showEmailModal && project?.id && (
      <EmailModal
        projectId={project.id}
        userEmail={userEmail}
        onClose={() => setShowEmailModal(false)}
      />
    )}
    </>
  );
}
