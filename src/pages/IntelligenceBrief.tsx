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
  scope_summary: string | null;
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
  const config = ({
    'High': { color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)', border: 'rgba(255,77,109,0.25)' },
    'Medium-High': { color: '#FF4D6D', bg: 'rgba(255,77,109,0.06)', border: 'rgba(255,77,109,0.2)' },
    'Medium': { color: '#FFB020', bg: 'rgba(255,176,32,0.08)', border: 'rgba(255,176,32,0.25)' },
    'Low': { color: '#00F5A0', bg: 'rgba(0,245,160,0.08)', border: 'rgba(0,245,160,0.25)' },
  } as Record<string, { color: string; bg: string; border: string }>)[level] || { color: '#9CAEC4', bg: 'transparent', border: 'transparent' };
  return (
    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}>
      {level || 'Unknown'}
    </span>
  );
}

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

  if (!analysis?.full_analysis_json) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <AlertCircle className="w-10 h-10" style={{ color: '#FFB020' }} />
          <p className="text-text-primary font-semibold">Analysis Data Not Found</p>
          <p className="text-text-muted text-sm">Analysis data not found. Please re-upload the document.</p>
          <button
            onClick={() => onNavigate('upload')}
            className="mt-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}
          >
            Re-upload Document
          </button>
        </div>
      </div>
    );
  }

  // Safe extraction from full_analysis_json — supports BOTH old and new schema shapes
  const full = safeObj(analysis.full_analysis_json);

  // New schema keys (from updated system prompt)
  const bidDesk = safeObj(full.bid_desk_summary);
  const snap = safeObj(full.rfp_snapshot);
  // New schema: scope_of_work is an array of workstream objects
  const scopeWorkstreams = safeArr<Record<string, unknown>>(full.scope_of_work);
  // New schema: eligibility_criteria is a flat array of criterion objects
  const eligibilityArray = safeArr<Record<string, unknown>>(full.eligibility_criteria);
  // New schema: evaluation_criteria is a flat array
  const evaluationArray = safeArr<Record<string, unknown>>(full.evaluation_criteria);
  // New schema: red_flags is a flat array
  const redFlagsArray = safeArr<Record<string, unknown>>(full.red_flags);
  // New schema: legal_commercial_risks is a flat array
  const legalRisksArray = safeArr<Record<string, unknown>>(full.legal_commercial_risks);
  // New schema: clarification_questions is a flat array
  const clarificationQsNew = safeArr<Record<string, unknown>>(full.clarification_questions);
  // New schema: win_themes is a flat array of objects
  const winThemesArray = safeArr<Record<string, unknown>>(full.win_themes);
  // New schema: next_steps is an object with arrays
  const nextStepsObj = safeObj(full.next_steps);

  // Old schema fallbacks
  const meta = safeObj(full.analysis_metadata);
  const strategyObj = safeObj(full.proposal_strategy_recommendations);
  const redFlagsObj = safeObj(full.red_flags_and_ambiguities);
  const evalObj = safeObj(full.evaluation_criteria_old ?? full.evaluation_criteria);
  const eligObj = safeObj(full.eligibility_criteria_obj);
  const scopeObj = safeObj(full.scope_of_work_obj);

  // Resolve recommendation — try new key first, then old
  const recommendation = safeStr(bidDesk.go_no_go || bidDesk.go_no_go_signal, project?.recommendation || 'Pending Analysis');
  const confidenceScore = analysis?.confidence_score ?? null;

  // Reasons to bid / caution
  const topReasonsToBid = safeArr<string>(bidDesk.top_reasons_to_bid);
  const topCautions = safeArr<string>(bidDesk.top_reasons_for_caution);
  const immediateActions = safeArr<string>(bidDesk.immediate_actions);
  const topRisks = safeArr<string>(bidDesk.top_risks);

  // Eligibility — new schema is flat array; old schema is nested object
  const resolvedEligibility: { text: string; mandatory?: boolean; evidence?: string; assessment?: string }[] =
    eligibilityArray.length > 0
      ? eligibilityArray.map(item => ({
          text: safeStr(item.criterion || item.requirement || item.text || JSON.stringify(item)),
          mandatory: item.mandatory !== false,
          evidence: safeStr(item.evidence_required, ''),
          assessment: safeStr(item.ey_assessment, ''),
        }))
      : [
          ...safeArr<unknown>(eligObj.legal_and_entity_requirements),
          ...safeArr<unknown>(eligObj.financial_requirements),
          ...safeArr<unknown>(eligObj.technical_requirements),
          ...safeArr<unknown>(eligObj.experience_requirements),
          ...safeArr<unknown>(eligObj.certifications_required),
        ].map(item => ({
          text: typeof item === 'string' ? item : safeStr((item as Record<string, unknown>)?.requirement || (item as Record<string, unknown>)?.criterion || JSON.stringify(item)),
        }));

  // Scope — new schema is array of workstream objects; old schema is nested object
  const resolvedScope: { title: string; detail: string; deliverables: string[] }[] =
    scopeWorkstreams.length > 0
      ? scopeWorkstreams.map(ws => ({
          title: safeStr(ws.workstream, 'Workstream'),
          detail: safeStr(ws.what_bank_wants, ''),
          deliverables: safeArr<string>(ws.deliverables),
        }))
      : [
          ...safeArr<unknown>(scopeObj.in_scope_items),
          ...safeArr<unknown>(scopeObj.functional_scope),
          ...safeArr<unknown>(scopeObj.technical_scope),
        ].map(item => ({
          title: '',
          detail: typeof item === 'string' ? item : safeStr((item as Record<string, unknown>)?.description || JSON.stringify(item)),
          deliverables: [],
        }));

  // Evaluation — new schema is flat array with marks; old schema is nested
  const resolvedEvalRows: { stage: string; criterion: string; subCriterion: string; marks: string; maxMarks: string }[] =
    evaluationArray.length > 0 && typeof evaluationArray[0] === 'object' && 'stage' in evaluationArray[0]
      ? evaluationArray.map(row => ({
          stage: safeStr(row.stage, '—'),
          criterion: safeStr(row.criterion, '—'),
          subCriterion: safeStr(row.sub_criterion, '—'),
          marks: safeStr(row.marks, '—'),
          maxMarks: safeStr(row.max_marks, '—'),
        }))
      : [];

  const evalMethod = safeStr(evalObj.evaluation_method, '');
  const evalWeights = safeArr<Record<string, unknown>>(evalObj.scoring_weights);
  const evalTechnical = safeArr<string>(evalObj.technical_evaluation_criteria);
  const evalFinancial = safeArr<string>(evalObj.financial_evaluation_criteria);

  // Red flags — new schema is flat array of objects with flag/detail/risk_level
  const resolvedRedFlags: { cat: string; text: string; detail: string; level: string; action: string }[] =
    redFlagsArray.length > 0
      ? redFlagsArray.map(f => ({
          cat: safeStr(f.risk_level, 'Risk'),
          text: safeStr(f.flag || f.text, ''),
          detail: safeStr(f.detail, ''),
          level: safeStr(f.risk_level, 'Medium'),
          action: safeStr(f.recommended_action, ''),
        }))
      : [
          ...safeArr<unknown>(redFlagsObj.commercial_red_flags).map(f => ({ cat: 'Commercial', text: String(f), detail: '', level: 'Medium', action: '' })),
          ...safeArr<unknown>(redFlagsObj.delivery_red_flags).map(f => ({ cat: 'Delivery', text: String(f), detail: '', level: 'Medium', action: '' })),
          ...safeArr<unknown>(redFlagsObj.legal_or_contractual_red_flags).map(f => ({ cat: 'Legal', text: String(f), detail: '', level: 'High', action: '' })),
          ...safeArr<unknown>(redFlagsObj.technical_red_flags).map(f => ({ cat: 'Technical', text: String(f), detail: '', level: 'Medium', action: '' })),
          ...safeArr<unknown>(redFlagsObj.eligibility_red_flags).map(f => ({ cat: 'Eligibility', text: String(f), detail: '', level: 'High', action: '' })),
          ...safeArr<unknown>(redFlagsObj.timeline_red_flags).map(f => ({ cat: 'Timeline', text: String(f), detail: '', level: 'Medium', action: '' })),
        ];

  // Clarification questions — new schema has question/section_reference/priority/why_critical
  const resolvedClarificationQs =
    clarificationQsNew.length > 0
      ? clarificationQsNew
      : safeArr<Record<string, unknown>>(full.clarification_questions);

  // Win themes — new schema is array of objects with theme/rationale/proof_points
  const resolvedWinThemes =
    winThemesArray.length > 0
      ? winThemesArray
      : safeArr<string>(strategyObj.win_themes).map(w => ({ theme: w, rationale: '', proof_points: '' }));

  const positioning = safeStr(strategyObj.recommended_positioning, '');
  const differentiators = safeArr<string>(strategyObj.differentiators_to_highlight);

  // Next steps — new schema: next_steps.within_24_hours etc; old: recommended_next_steps.within_24_hours
  const oldNextSteps = safeObj(full.recommended_next_steps);
  const nextActions24h = safeArr<string>(nextStepsObj.within_24_hours || oldNextSteps.within_24_hours);
  const nextActions3d = safeArr<string>(nextStepsObj.within_3_days || oldNextSteps.within_3_days);
  const nextActionsPreBid = safeArr<string>(nextStepsObj.before_pre_bid || oldNextSteps.before_pre_bid_or_clarification_deadline);
  const nextActionsSubmit = safeArr<string>(nextStepsObj.before_submission || oldNextSteps.before_submission);

  const allNextActions = [
    ...nextActions24h.map(t => ({ task: t, when: '24h' })),
    ...nextActions3d.map(t => ({ task: t, when: '3 days' })),
    ...nextActionsPreBid.map(t => ({ task: t, when: 'Pre-bid' })),
    ...nextActionsSubmit.map(t => ({ task: t, when: 'Pre-submission' })),
  ];

  const snapRows = [
    { label: 'Issuing Authority', value: safeStr(snap.issuing_authority || snap.issuing_organization, '') },
    { label: 'RFP Reference', value: safeStr(snap.rfp_reference || snap.rfp_reference_number, '') },
    { label: 'Submission Deadline', value: safeStr(snap.submission_deadline, '') },
    { label: 'Pre-Bid Meeting', value: safeStr(snap.pre_bid_meeting || snap.pre_bid_meeting_date, '') },
    { label: 'Clarification Deadline', value: safeStr(snap.clarification_deadline, '') },
    { label: 'Bid Opening', value: safeStr(snap.bid_opening_date, '') },
    { label: 'Contract Duration', value: safeStr(snap.contract_duration, '') },
    { label: 'Estimated Value', value: safeStr(snap.contract_value || snap.estimated_contract_value, '') },
    { label: 'EMD Amount', value: safeStr(snap.emd_amount, '') },
    { label: 'Performance Guarantee', value: safeStr(snap.performance_guarantee || snap.performance_bank_guarantee, '') },
    { label: 'Evaluation Method', value: safeStr(snap.evaluation_method, '') },
    { label: 'Submission Mode', value: safeStr(snap.submission_mode, '') },
    { label: 'Sector', value: safeStr(meta.sector, '') },
    { label: 'Document Type', value: safeStr(meta.document_type, '') },
  ].filter(r => r.value && r.value !== 'Not specified in the RFP' && r.value !== 'Not specified');

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

            {/* DEBUG BLOCK — shows available top-level keys in full_analysis_json */}
            <pre style={{ color: 'lime', fontSize: 10, background: '#000', padding: 8, overflow: 'auto', maxHeight: 200 }}>
              {JSON.stringify(Object.keys(analysis?.full_analysis_json || {}), null, 2)}
            </pre>

            {/* SECTION 1 — DECISION SUMMARY */}
            <section id="section-decision">
              <SectionHeader number="01" title="Decision Summary" />
              <div className="mb-6">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl mb-6" style={{ background: 'rgba(255,209,102,0.08)', border: '2px solid rgba(255,209,102,0.3)', boxShadow: '0 0 30px rgba(255,209,102,0.1)' }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFD166' }} />
                  <span className="font-serif text-2xl font-bold" style={{ color: '#FFD166' }}>{recommendation}</span>
                </div>
              </div>

              {safeStr(bidDesk.go_no_go_reasoning || bidDesk.one_line_summary || analysis?.executive_summary, '') && (
                <div className="rounded-2xl p-6 mb-5" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                    {safeStr(bidDesk.go_no_go_reasoning || bidDesk.one_line_summary || analysis?.executive_summary, '')}
                  </p>
                </div>
              )}

              {topRisks.length > 0 && (
                <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,77,109,0.04)', border: '1px solid rgba(255,77,109,0.15)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#FF4D6D' }}>Top Risks</div>
                  <ul className="space-y-2">
                    {topRisks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FF4D6D' }} />
                        {safeStr(r)}
                      </li>
                    ))}
                  </ul>
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
                            {safeStr(r)}
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
                            {safeStr(c)}
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
                        {safeStr(a)}
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
              {resolvedEligibility.length > 0 ? (
                <div className="space-y-3">
                  {resolvedEligibility.map((item, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex gap-4">
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold" style={{ background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-secondary text-sm leading-relaxed">{item.text}</p>
                          {item.evidence && (
                            <p className="text-text-muted text-xs mt-1.5">Evidence: {item.evidence}</p>
                          )}
                          {item.assessment && (
                            <p className="text-xs mt-1.5 font-medium" style={{ color: item.assessment.startsWith('Can Meet') ? '#00F5A0' : item.assessment.startsWith('Cannot') ? '#FF4D6D' : '#FFB020' }}>
                              {item.assessment}
                            </p>
                          )}
                        </div>
                        {item.mandatory !== undefined && (
                          <div className="flex-shrink-0">
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded" style={{ background: item.mandatory ? 'rgba(255,77,109,0.1)' : 'rgba(0,245,160,0.08)', color: item.mandatory ? '#FF4D6D' : '#00F5A0' }}>
                              {item.mandatory ? 'Mandatory' : 'Desirable'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">Eligibility criteria not extracted. Manual review recommended.</p>
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
              {resolvedScope.length > 0 ? (
                <div className="space-y-4">
                  {resolvedScope.map((ws, i) => (
                    <div key={i} className="rounded-xl p-5" style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.1)' }}>
                      {ws.title && (
                        <div className="font-semibold text-sm mb-2" style={{ color: '#00E5FF' }}>{ws.title}</div>
                      )}
                      {ws.detail && (
                        <p className="text-text-secondary text-sm leading-relaxed mb-3">{ws.detail}</p>
                      )}
                      {ws.deliverables.length > 0 && (
                        <ul className="space-y-1.5">
                          {ws.deliverables.map((d, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-text-muted">
                              <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#00E5FF' }} />
                              {safeStr(d)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">Scope items not extracted.</p>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 5 — EVALUATION CRITERIA */}
            <section id="section-evaluation">
              <SectionHeader number="05" title="Evaluation Criteria" />

              {resolvedEvalRows.length > 0 ? (
                <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: '#08111F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['Stage', 'Criterion', 'Sub-Criterion', 'Parameters', 'Marks', 'Max Marks'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-text-muted font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resolvedEvalRows.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(8,17,31,0.8)' : 'rgba(15,27,46,0.4)' }}>
                            <td className="px-4 py-3 text-text-muted whitespace-nowrap">{row.stage}</td>
                            <td className="px-4 py-3 text-text-secondary">{row.criterion}</td>
                            <td className="px-4 py-3 text-text-muted">{row.subCriterion}</td>
                            <td className="px-4 py-3 text-text-secondary">{row.marks}</td>
                            <td className="px-4 py-3 text-center font-mono" style={{ color: '#00E5FF' }}>{row.marks}</td>
                            <td className="px-4 py-3 text-center font-mono text-text-muted">{row.maxMarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {evalMethod && (
                <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)' }}>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Evaluation Method</div>
                  <div className="text-text-primary font-medium text-sm">{evalMethod}</div>
                </div>
              )}

              {evalWeights.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {evalWeights.map((w, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{safeStr(w.criterion || w.category, `Criterion ${i + 1}`)}</div>
                      <div className="font-semibold text-sm" style={{ color: '#00E5FF' }}>{safeStr(w.weight || w.score, '—')}</div>
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
                        <p className="text-text-secondary text-sm">{safeStr(c)}</p>
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
                        <p className="text-text-secondary text-sm">{safeStr(c)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resolvedEvalRows.length === 0 && !evalMethod && evalTechnical.length === 0 && evalFinancial.length === 0 && (
                <p className="text-text-muted text-sm">Evaluation criteria not extracted.</p>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 6 — RISK RADAR */}
            <section id="section-risk">
              <SectionHeader number="06" title="Risk Radar" />
              {resolvedRedFlags.length > 0 ? (
                <div className="space-y-3">
                  {resolvedRedFlags.map((r, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,77,109,0.04)', border: '1px solid rgba(255,77,109,0.15)' }}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FF4D6D' }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-text-primary">{safeStr(r.text)}</span>
                            <RiskBadge level={safeStr(r.level, 'Medium')} />
                          </div>
                          {r.detail && <p className="text-text-muted text-xs leading-relaxed mt-1">{r.detail}</p>}
                          {r.action && <p className="text-xs mt-2 font-medium" style={{ color: '#FFB020' }}>Action: {r.action}</p>}
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: '#FF4D6D' }}>{r.cat}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">No red flags identified.</p>
              )}

              {legalRisksArray.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">Legal & Commercial Risks</div>
                  <div className="space-y-3">
                    {legalRisksArray.map((r, i) => (
                      <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,176,32,0.04)', border: '1px solid rgba(255,176,32,0.15)' }}>
                        <div className="font-semibold text-sm text-text-primary mb-1">{safeStr(r.risk)}</div>
                        {r.detail && <p className="text-text-muted text-xs leading-relaxed">{safeStr(r.detail)}</p>}
                        {r.impact && <p className="text-xs mt-1.5 font-medium" style={{ color: '#FFB020' }}>Impact: {safeStr(r.impact)}</p>}
                        {r.suggested_clarification && <p className="text-xs mt-1 text-text-muted">Ask: {safeStr(r.suggested_clarification)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="section-divider" />

            {/* SECTION 7 — CLARIFICATION QUESTIONS */}
            <section id="section-questions">
              <SectionHeader number="07" title="Clarification Questions" />
              {resolvedClarificationQs.length > 0 ? (
                <div className="space-y-3">
                  {resolvedClarificationQs.map((q, i) => {
                    const question = safeStr(q.question || q.text, String(q));
                    const reason = safeStr(q.why_critical || q.reason_for_asking, '');
                    const section = safeStr(q.section_reference || q.rfp_section_or_context, '');
                    const priority = safeStr(q.priority, '');
                    const priorityColor = priority === 'High' ? '#FF4D6D' : priority === 'Medium' ? '#FFB020' : '#9CAEC4';
                    return (
                      <div key={i} className="flex gap-4 rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold" style={{ background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-secondary text-sm leading-relaxed">{question}</p>
                          {section && <p className="text-[10px] text-text-muted mt-1">Section: {section}</p>}
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
              {resolvedWinThemes.length > 0 && (
                <div className="space-y-3 mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-text-muted">Win Themes</div>
                  {resolvedWinThemes.map((w, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="font-semibold text-sm text-text-primary mb-1">{safeStr(w.theme || String(w))}</div>
                      {w.rationale && <p className="text-text-muted text-xs leading-relaxed">{safeStr(w.rationale)}</p>}
                      {w.proof_points && <p className="text-xs mt-1.5 text-text-secondary">{safeStr(w.proof_points)}</p>}
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
                      {safeStr(d)}
                    </div>
                  ))}
                </div>
              )}
              {!positioning && resolvedWinThemes.length === 0 && differentiators.length === 0 && (
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
                            <div className="text-sm text-text-primary">{safeStr(a.task)}</div>
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
                <span className="text-xs font-bold" style={{ color: '#FFB020' }}>{safeStr(snap.submission_deadline)}</span>
              </div>
            )}
            {resolvedRedFlags.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">Red Flags</span>
                <span className="text-xs font-semibold" style={{ color: '#FF4D6D' }}>{resolvedRedFlags.length}</span>
              </div>
            )}
            {resolvedClarificationQs.length > 0 && (
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-text-muted">Clarification Qs</span>
                <span className="text-xs font-semibold" style={{ color: '#9CAEC4' }}>{resolvedClarificationQs.length}</span>
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
