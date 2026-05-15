import { useState, useRef, useEffect } from 'react';
import { Download, FileDown, ArrowLeft, CheckCircle, Circle, AlertTriangle, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import type { RfpProject } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface IntelligenceBriefProps {
  onNavigate: (page: string) => void;
  project?: RfpProject | null;
}

interface AiAnalysis {
  id: string;
  status: string;
  executive_summary: string | null;
  rfp_objective: string | null;
  scope_summary: string | null;
  eligibility_summary: string | null;
  compliance_summary: string | null;
  commercial_summary: string | null;
  technical_summary: string | null;
  key_dates: unknown[];
  eligibility_criteria: unknown[];
  scope_of_work: unknown[];
  compliance_matrix: unknown[];
  evaluation_criteria: unknown[];
  required_documents: unknown[];
  risks_and_red_flags: unknown[];
  clarification_questions: unknown[];
  win_themes: unknown[];
  recommended_actions: unknown[];
  full_analysis_json: Record<string, unknown> | null;
  confidence_score: number | null;
  completed_at: string | null;
}

const sidebarSections = [
  { id: 'decision', label: 'Decision Summary' },
  { id: 'snapshot', label: 'RFP Snapshot' },
  { id: 'eligibility', label: 'Eligibility & Compliance' },
  { id: 'scope', label: 'Scope of Work' },
  { id: 'evaluation', label: 'Evaluation Criteria' },
  { id: 'risk', label: 'Risk Radar' },
  { id: 'questions', label: 'Clarification Questions' },
  { id: 'strategy', label: 'Proposal Strategy' },
  { id: 'actions', label: 'Next Actions' },
];

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0" style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
        {number}
      </div>
      <h2 className="font-serif text-2xl font-bold text-text-primary">{title}</h2>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const config = {
    'High': { color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)', border: 'rgba(255,77,109,0.25)' },
    'Medium-High': { color: '#FF4D6D', bg: 'rgba(255,77,109,0.06)', border: 'rgba(255,77,109,0.2)' },
    'Medium': { color: '#FFB020', bg: 'rgba(255,176,32,0.08)', border: 'rgba(255,176,32,0.25)' },
    'Low': { color: '#00F5A0', bg: 'rgba(0,245,160,0.08)', border: 'rgba(0,245,160,0.25)' },
  }[level] || { color: '#9CAEC4', bg: 'transparent', border: 'transparent' };
  return (
    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}>
      {level}
    </span>
  );
}

function stringList(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        return (obj.question || obj.text || obj.item || obj.description || obj.task || obj.compliance_item || JSON.stringify(obj)) as string;
      }
      return String(item);
    });
  }
  if (typeof val === 'string') return val.split('\n').filter(Boolean);
  return [];
}

export default function IntelligenceBrief({ onNavigate, project }: IntelligenceBriefProps) {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('decision');
  const [actionStatus, setActionStatus] = useState<Record<number, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  const projectId = project?.id || localStorage.getItem('lastProjectId');

  useEffect(() => {
    if (!projectId) {
      setFetchError('No project selected.');
      setLoading(false);
      return;
    }
    supabase
      .from('ai_analysis_results')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setFetchError(`Failed to load analysis: ${error.message}`);
        } else if (!data) {
          setFetchError('No analysis found for this project.');
        } else {
          setAnalysis(data as AiAnalysis);
        }
        setLoading(false);
      });
  }, [projectId]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cycleActionStatus = (idx: number) => {
    setActionStatus(prev => {
      const current = prev[idx] || 'not-started';
      const next = current === 'not-started' ? 'in-progress' : current === 'in-progress' ? 'completed' : 'not-started';
      return { ...prev, [idx]: next };
    });
  };

  const rfpTitle = project?.title || 'RFP Intelligence Brief';
  const institution = project?.client_name || '—';
  const segment = project?.institution_type || '—';
  const dueDate = project?.due_date
    ? new Date(project.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  // Pull nested fields from full_analysis_json for richer display
  const full = analysis?.full_analysis_json ?? {};
  const snap = (full.rfp_snapshot ?? {}) as Record<string, unknown>;
  const bidDesk = (full.bid_desk_summary ?? {}) as Record<string, unknown>;
  const meta = (full.analysis_metadata ?? {}) as Record<string, unknown>;
  const strategyObj = (full.proposal_strategy_recommendations ?? {}) as Record<string, unknown>;
  const nextStepsObj = (full.recommended_next_steps ?? {}) as Record<string, unknown>;
  const redFlagsObj = (full.red_flags_and_ambiguities ?? {}) as Record<string, unknown>;
  const evalObj = (full.evaluation_criteria ?? {}) as Record<string, unknown>;
  const eligObj = (full.eligibility_criteria ?? {}) as Record<string, unknown>;
  const scopeObj = (full.scope_of_work ?? {}) as Record<string, unknown>;

  const recommendation = (bidDesk.go_no_go_signal as string) || project?.recommendation || 'Pending Analysis';
  const confidenceScore = analysis?.confidence_score ?? null;
  const topReasonsToBid = stringList(bidDesk.top_reasons_to_bid);
  const topCautions = stringList(bidDesk.top_reasons_for_caution);
  const immediateActions = stringList(bidDesk.immediate_actions);

  const eligibilityItems = [
    ...(Array.isArray(eligObj.legal_and_entity_requirements) ? eligObj.legal_and_entity_requirements : []),
    ...(Array.isArray(eligObj.financial_requirements) ? eligObj.financial_requirements : []),
    ...(Array.isArray(eligObj.technical_requirements) ? eligObj.technical_requirements : []),
    ...(Array.isArray(eligObj.experience_requirements) ? eligObj.experience_requirements : []),
    ...(Array.isArray(eligObj.certifications_required) ? eligObj.certifications_required : []),
  ] as unknown[];

  const scopeItems = [
    ...(Array.isArray(scopeObj.in_scope_items) ? scopeObj.in_scope_items : []),
    ...(Array.isArray(scopeObj.functional_scope) ? scopeObj.functional_scope : []),
    ...(Array.isArray(scopeObj.technical_scope) ? scopeObj.technical_scope : []),
  ];
  const scopeAmbiguities = stringList(scopeObj.scope_ambiguities);

  const evalTechnical = stringList(evalObj.technical_evaluation_criteria);
  const evalFinancial = stringList(evalObj.financial_evaluation_criteria);
  const evalMethod = (evalObj.evaluation_method as string) || null;
  const evalWeights = (evalObj.scoring_weights ?? []) as unknown[];

  const allRedFlags = [
    ...(Array.isArray(redFlagsObj.commercial_red_flags) ? redFlagsObj.commercial_red_flags.map((f: unknown) => ({ cat: 'Commercial', text: String(f) })) : []),
    ...(Array.isArray(redFlagsObj.delivery_red_flags) ? redFlagsObj.delivery_red_flags.map((f: unknown) => ({ cat: 'Delivery', text: String(f) })) : []),
    ...(Array.isArray(redFlagsObj.legal_or_contractual_red_flags) ? redFlagsObj.legal_or_contractual_red_flags.map((f: unknown) => ({ cat: 'Legal', text: String(f) })) : []),
    ...(Array.isArray(redFlagsObj.technical_red_flags) ? redFlagsObj.technical_red_flags.map((f: unknown) => ({ cat: 'Technical', text: String(f) })) : []),
    ...(Array.isArray(redFlagsObj.eligibility_red_flags) ? redFlagsObj.eligibility_red_flags.map((f: unknown) => ({ cat: 'Eligibility', text: String(f) })) : []),
    ...(Array.isArray(redFlagsObj.timeline_red_flags) ? redFlagsObj.timeline_red_flags.map((f: unknown) => ({ cat: 'Timeline', text: String(f) })) : []),
    ...(Array.isArray(redFlagsObj.ambiguities_requiring_clarification) ? redFlagsObj.ambiguities_requiring_clarification.map((f: unknown) => ({ cat: 'Ambiguity', text: String(f) })) : []),
  ];

  const clarificationQs = Array.isArray(full.clarification_questions)
    ? (full.clarification_questions as Array<Record<string, unknown>>)
    : [];

  const winThemes = stringList(strategyObj.win_themes);
  const differentiators = stringList(strategyObj.differentiators_to_highlight);
  const positioning = (strategyObj.recommended_positioning as string) || null;

  const nextActions24h = stringList(nextStepsObj.within_24_hours);
  const nextActions3d = stringList(nextStepsObj.within_3_days);
  const nextActionsSubmit = stringList(nextStepsObj.before_submission);

  const allNextActions = [
    ...nextActions24h.map(t => ({ task: t, when: '24h' })),
    ...nextActions3d.map(t => ({ task: t, when: '3 days' })),
    ...nextActionsSubmit.map(t => ({ task: t, when: 'Pre-submission' })),
  ];

  const snapRows = [
    { label: 'Issuing Authority', value: snap.issuing_authority as string },
    { label: 'RFP Reference', value: snap.rfp_reference_number as string },
    { label: 'Submission Deadline', value: snap.submission_deadline as string },
    { label: 'Pre-Bid Meeting', value: snap.pre_bid_meeting_date as string },
    { label: 'Clarification Deadline', value: snap.clarification_deadline as string },
    { label: 'Bid Opening', value: snap.bid_opening_date as string },
    { label: 'Contract Duration', value: snap.contract_duration as string },
    { label: 'Estimated Value', value: snap.estimated_contract_value as string },
    { label: 'EMD Amount', value: snap.emd_amount as string },
    { label: 'Submission Mode', value: snap.submission_mode as string },
    { label: 'Sector', value: meta.sector as string },
    { label: 'Document Type', value: meta.document_type as string },
  ].filter(r => r.value && r.value !== 'Not specified in the RFP');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00E5FF' }} />
          <p className="text-text-muted text-sm">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <AlertCircle className="w-10 h-10" style={{ color: '#FF4D6D' }} />
          <p className="text-text-primary font-semibold">Analysis Not Found</p>
          <p className="text-text-muted text-sm">{fetchError}</p>
          <button
            onClick={() => onNavigate('workspace')}
            className="mt-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}
          >
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky top header */}
      <div className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between border-b backdrop-blur-md" style={{ background: 'rgba(3,7,18,0.95)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('workspace')}
            className="flex items-center gap-1.5 text-text-muted text-sm hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Workspace
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
          <button
            onClick={() => onNavigate('export')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-background transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FFD166, #FFB020)', boxShadow: '0 0 20px rgba(255,209,102,0.2)' }}
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            onClick={() => onNavigate('export')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}
          >
            <FileDown className="w-3.5 h-3.5" />
            Word
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left sidebar nav */}
        <div className="w-56 flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-6 px-3 space-y-1" style={{ background: '#08111F', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[10px] text-text-muted uppercase tracking-widest px-3 mb-3">Report Sections</div>
          {sidebarSections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all"
              style={{
                background: activeSection === s.id ? 'rgba(0,229,255,0.08)' : 'transparent',
                color: activeSection === s.id ? '#00E5FF' : '#9CAEC4',
                border: activeSection === s.id ? '1px solid rgba(0,229,255,0.15)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (activeSection !== s.id) { e.currentTarget.style.color = '#F5F9FF'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; } }}
              onMouseLeave={e => { if (activeSection !== s.id) { e.currentTarget.style.color = '#9CAEC4'; e.currentTarget.style.background = 'transparent'; } }}
            >
              <span className="text-[10px] font-mono opacity-50">{String(i + 1).padStart(2, '0')}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div ref={contentRef} className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-8 py-10 space-y-16">

            {/* SECTION 1 — DECISION SUMMARY */}
            <section id="section-decision">
              <SectionHeader number="01" title="Decision Summary" />
              <div className="mb-6">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl mb-6" style={{ background: 'rgba(255,209,102,0.08)', border: '2px solid rgba(255,209,102,0.3)', boxShadow: '0 0 30px rgba(255,209,102,0.1)' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFD166' }} />
                  <span className="font-serif text-2xl font-bold" style={{ color: '#FFD166' }}>{recommendation}</span>
                </div>
              </div>

              {analysis?.executive_summary && (
                <div className="rounded-2xl p-6 mb-5" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">{analysis.executive_summary}</p>
                </div>
              )}

              {(topReasonsToBid.length > 0 || topCautions.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  {topReasonsToBid.length > 0 && (
                    <div className="rounded-xl p-4" style={{ background: 'rgba(0,245,160,0.04)', border: '1px solid rgba(0,245,160,0.15)' }}>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#00F5A0' }}>Reasons to Bid</div>
                      <ul className="space-y-2">
                        {topReasonsToBid.map((r, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#00F5A0' }} />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {topCautions.length > 0 && (
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,176,32,0.04)', border: '1px solid rgba(255,176,32,0.15)' }}>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#FFB020' }}>Caution Points</div>
                      <ul className="space-y-2">
                        {topCautions.map((c, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FFB020' }} />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {immediateActions.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: 'rgba(255,209,102,0.04)', border: '1px solid rgba(255,209,102,0.15)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#FFD166' }}>Immediate Actions</div>
                  <ul className="space-y-2">
                    {immediateActions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FFD166' }} />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 2 — RFP SNAPSHOT */}
            <section id="section-snapshot">
              <SectionHeader number="02" title="RFP Snapshot" />
              {snapRows.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {snapRows.map((f, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{f.label}</div>
                      <div className="text-text-primary font-medium text-sm">{f.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">Snapshot data not available in this analysis.</p>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 3 — ELIGIBILITY */}
            <section id="section-eligibility">
              <SectionHeader number="03" title="Eligibility & Compliance" />
              {eligibilityItems.length > 0 ? (
                <div className="space-y-3">
                  {(eligibilityItems as unknown[]).map((item, i) => {
                    const text = typeof item === 'string' ? item : JSON.stringify(item);
                    return (
                      <div key={i} className="flex gap-4 rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold" style={{ background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <p className="text-text-secondary text-sm leading-relaxed">{text}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-muted text-sm">Eligibility criteria not extracted.</p>
              )}
              {Array.isArray(eligObj.eligibility_gaps_or_unclear_items) && (eligObj.eligibility_gaps_or_unclear_items as unknown[]).length > 0 && (
                <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(255,176,32,0.04)', border: '1px solid rgba(255,176,32,0.15)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#FFB020' }}>Gaps / Unclear Items</div>
                  {stringList(eligObj.eligibility_gaps_or_unclear_items).map((g, i) => (
                    <div key={i} className="flex gap-2 text-xs text-text-secondary mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FFB020' }} />
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 4 — SCOPE OF WORK */}
            <section id="section-scope">
              <SectionHeader number="04" title="Scope of Work" />
              {analysis?.scope_summary && (
                <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)' }}>
                  <p className="text-text-secondary text-sm leading-relaxed">{analysis.scope_summary}</p>
                </div>
              )}
              {scopeItems.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {scopeItems.map((item, i) => {
                    const text = typeof item === 'string' ? item : JSON.stringify(item);
                    return (
                      <div key={i} className="flex gap-3 rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.1)' }}>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neon-cyan" />
                        <p className="text-text-secondary text-sm leading-relaxed">{text}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-muted text-sm">Scope items not extracted.</p>
              )}
              {scopeAmbiguities.length > 0 && (
                <div className="mt-4 rounded-xl p-4" style={{ background: 'rgba(255,176,32,0.04)', border: '1px solid rgba(255,176,32,0.15)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#FFB020' }}>Scope Ambiguities</div>
                  {scopeAmbiguities.map((a, i) => (
                    <div key={i} className="flex gap-2 text-xs text-text-secondary mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FFB020' }} />
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 5 — EVALUATION CRITERIA */}
            <section id="section-evaluation">
              <SectionHeader number="05" title="Evaluation Criteria" />
              {evalMethod && (
                <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)' }}>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Evaluation Method</div>
                  <div className="text-text-primary font-medium text-sm">{evalMethod}</div>
                </div>
              )}
              {evalWeights.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {(evalWeights as Array<Record<string, unknown>>).map((w, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{String(w.criterion || w.category || `Criterion ${i + 1}`)}</div>
                      <div className="font-semibold text-sm" style={{ color: '#00E5FF' }}>{String(w.weight || w.score || '—')}</div>
                    </div>
                  ))}
                </div>
              )}
              {evalTechnical.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">Technical Criteria</div>
                  <div className="space-y-2">
                    {evalTechnical.map((c, i) => (
                      <div key={i} className="flex gap-3 rounded-xl p-3" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neon-cyan" />
                        <p className="text-text-secondary text-sm">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {evalFinancial.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">Financial Criteria</div>
                  <div className="space-y-2">
                    {evalFinancial.map((c, i) => (
                      <div key={i} className="flex gap-3 rounded-xl p-3" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FFD166' }} />
                        <p className="text-text-secondary text-sm">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!evalMethod && evalTechnical.length === 0 && evalFinancial.length === 0 && (
                <p className="text-text-muted text-sm">Evaluation criteria not extracted.</p>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 6 — RISK RADAR */}
            <section id="section-risk">
              <SectionHeader number="06" title="Risk Radar" />
              {allRedFlags.length > 0 ? (
                <div className="space-y-3">
                  {allRedFlags.map((r, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,77,109,0.04)', border: '1px solid rgba(255,77,109,0.15)' }}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FF4D6D' }} />
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider mr-2" style={{ color: '#FF4D6D' }}>{r.cat}</span>
                          <p className="text-text-secondary text-sm leading-relaxed mt-0.5">{r.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">No red flags identified.</p>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 7 — CLARIFICATION QUESTIONS */}
            <section id="section-questions">
              <SectionHeader number="07" title="Clarification Questions" />
              {clarificationQs.length > 0 ? (
                <div className="space-y-3">
                  {clarificationQs.map((q, i) => {
                    const question = String(q.question || q.text || q);
                    const reason = q.reason_for_asking ? String(q.reason_for_asking) : null;
                    const priority = q.priority ? String(q.priority) : null;
                    const priorityColor = priority === 'High' ? '#FF4D6D' : priority === 'Medium' ? '#FFB020' : '#9CAEC4';
                    return (
                      <div key={i} className="flex gap-4 rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold" style={{ background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-secondary text-sm leading-relaxed">{question}</p>
                          {reason && <p className="text-text-muted text-xs mt-1.5">{reason}</p>}
                        </div>
                        {priority && (
                          <div className="flex-shrink-0">
                            <span className="text-[10px] font-semibold uppercase" style={{ color: priorityColor }}>{priority}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-muted text-sm">No clarification questions generated.</p>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 8 — PROPOSAL STRATEGY */}
            <section id="section-strategy">
              <SectionHeader number="08" title="Proposal Strategy" />
              {positioning && (
                <div className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.2)' }}>
                  <div className="text-xs text-neon-cyan uppercase tracking-wider mb-3">Recommended Positioning</div>
                  <p className="text-text-secondary leading-relaxed">{positioning}</p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-5">
                {winThemes.length > 0 && (
                  <div className="rounded-xl p-5" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">Win Themes</div>
                    {winThemes.map((w, i) => (
                      <div key={i} className="flex gap-2 text-xs text-text-secondary mb-2.5">
                        <span className="font-mono text-[10px] opacity-50 w-5 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                        {w}
                      </div>
                    ))}
                  </div>
                )}
                {differentiators.length > 0 && (
                  <div className="rounded-xl p-5" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">Differentiators to Highlight</div>
                    {differentiators.map((d, i) => (
                      <div key={i} className="flex gap-2 text-xs text-text-secondary mb-2.5">
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neon-cyan" />
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!positioning && winThemes.length === 0 && differentiators.length === 0 && (
                <p className="text-text-muted text-sm">Strategy recommendations not available.</p>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 9 — NEXT ACTIONS */}
            <section id="section-actions">
              <SectionHeader number="09" title="Next Actions" />
              {allNextActions.length > 0 ? (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="px-5 py-3 border-b text-xs text-text-muted" style={{ background: '#08111F', borderColor: 'rgba(255,255,255,0.06)' }}>
                    Click any action to cycle status: Not Started → In Progress → Completed
                  </div>
                  <div>
                    {allNextActions.map((a, i) => {
                      const status = actionStatus[i] || 'not-started';
                      const isCompleted = status === 'completed';
                      const isInProgress = status === 'in-progress';
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-4 px-5 py-3.5 border-b cursor-pointer transition-all"
                          style={{
                            borderColor: 'rgba(255,255,255,0.04)',
                            background: isCompleted ? 'rgba(0,245,160,0.03)' : isInProgress ? 'rgba(255,176,32,0.03)' : i % 2 === 0 ? 'rgba(8,17,31,0.8)' : 'rgba(15,27,46,0.4)'
                          }}
                          onClick={() => cycleActionStatus(i)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = isCompleted ? 'rgba(0,245,160,0.03)' : isInProgress ? 'rgba(255,176,32,0.03)' : i % 2 === 0 ? 'rgba(8,17,31,0.8)' : 'rgba(15,27,46,0.4)'; }}
                        >
                          <div>
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4" style={{ color: '#00F5A0' }} />
                            ) : isInProgress ? (
                              <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              </div>
                            ) : (
                              <Circle className="w-4 h-4" style={{ color: '#00E5FF' }} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-text-primary">{a.task}</div>
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-text-muted">{a.when}</div>
                          <div className="text-[10px] uppercase tracking-wider w-20 text-right" style={{ color: isCompleted ? '#00F5A0' : isInProgress ? '#FFB020' : '#00E5FF' }}>
                            {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-text-muted text-sm">No next actions generated.</p>
              )}
            </section>

          </div>
        </div>

        {/* Right sticky panel */}
        <div className="w-64 flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto p-5 space-y-4" style={{ background: '#08111F', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Overall Recommendation</div>
            <div className="px-4 py-3 rounded-xl text-center font-serif font-bold" style={{ background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.25)', color: '#FFD166' }}>
              {recommendation}
            </div>
          </div>

          <div className="space-y-2">
            {confidenceScore !== null && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">Confidence Score</span>
                <span className="text-xs font-semibold" style={{ color: '#00E5FF' }}>{confidenceScore}%</span>
              </div>
            )}
            {analysis?.status && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">Analysis Status</span>
                <span className="text-xs font-semibold" style={{ color: analysis.status === 'completed' ? '#00F5A0' : '#FFB020' }}>{analysis.status}</span>
              </div>
            )}
            {snap.submission_deadline && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">Submission Deadline</span>
                <span className="text-xs font-bold" style={{ color: '#FFB020' }}>{String(snap.submission_deadline)}</span>
              </div>
            )}
            {allRedFlags.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">Red Flags</span>
                <span className="text-xs font-semibold" style={{ color: '#FF4D6D' }}>{allRedFlags.length}</span>
              </div>
            )}
            {clarificationQs.length > 0 && (
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-text-muted">Clarification Qs</span>
                <span className="text-xs font-semibold" style={{ color: '#9CAEC4' }}>{clarificationQs.length}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onNavigate('export')}
              className="w-full py-2.5 rounded-lg text-xs font-semibold text-background flex items-center justify-center gap-1.5 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #FFD166, #FFB020)', boxShadow: '0 0 20px rgba(255,209,102,0.15)' }}
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={() => onNavigate('export')}
              className="w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-105"
              style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}
            >
              <FileDown className="w-3.5 h-3.5" />
              Download Word
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
