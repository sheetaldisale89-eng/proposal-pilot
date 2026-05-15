import { useState, useRef } from 'react';
import { Download, FileDown, ArrowLeft, CheckCircle, Circle, AlertTriangle, ChevronRight } from 'lucide-react';
import type { RfpProject } from '@/lib/types';

interface IntelligenceBriefProps {
  onNavigate: (page: string) => void;
  project?: RfpProject | null;
}

const sidebarSections = [
  { id: 'decision', label: 'Decision Summary' },
  { id: 'metadata', label: 'Extracted Metadata' },
  { id: 'snapshot', label: 'Opportunity Snapshot' },
  { id: 'eligibility', label: 'Eligibility & Compliance' },
  { id: 'scope', label: 'Scope Intelligence' },
  { id: 'risk', label: 'Risk Radar' },
  { id: 'commercial', label: 'Commercial Lens' },
  { id: 'wins', label: 'Win Themes' },
  { id: 'strategy', label: 'Proposal Strategy' },
  { id: 'effort', label: 'Effort & Teaming' },
  { id: 'questions', label: 'Clarification Questions' },
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

export default function IntelligenceBrief({ onNavigate, project }: IntelligenceBriefProps) {
  // Use live project data where available, fall back to demo values
  const rfpTitle = project?.title || 'Digital Lending Transformation RFP';
  const institution = project?.client_name || 'Leading Public Sector Bank';
  const segment = project?.institution_type || 'Banking';
  const dueDate = project?.due_date ? new Date(project.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Jun 2026';
  const recommendation = project?.recommendation || 'Pursue Selectively';
  const confidenceScore = project?.confidence_score ?? 86;
  const riskLevel = project?.risk_level || 'Medium-High';
  const [activeSection, setActiveSection] = useState('decision');
  const [actionStatus, setActionStatus] = useState<Record<number, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

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

  const nextActions = [
    { task: 'Validate eligibility', owner: 'Ops Lead' },
    { task: 'Confirm bid team', owner: 'Pursuit Lead' },
    { task: 'Schedule pursuit call', owner: 'Account Lead' },
    { task: 'Review commercial clauses', owner: 'Commercial Lead' },
    { task: 'Draft clarification questions', owner: 'Proposal Lead' },
    { task: 'Prepare credentials', owner: 'Knowledge Lead' },
    { task: 'Build proposal storyboard', owner: 'Solution Lead' },
    { task: 'Conduct partner review', owner: 'Partner' },
    { task: 'Finalize pricing', owner: 'Finance' },
    { task: 'Lock delivery assumptions', owner: 'Delivery Lead' },
    { task: 'Mobilize proposal team', owner: 'Bid Manager' },
    { task: 'Submit final bid', owner: 'Ops Lead' },
  ];

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
              <span>·</span>
              <span>{segment}</span>
              <span>·</span>
              <span>{dueDate}</span>
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
                  <span className="font-serif text-2xl font-bold" style={{ color: '#FFD166' }}>Pursue Selectively</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Strategic Fit', value: 'High', color: '#00F5A0' },
                  { label: 'Delivery Complexity', value: 'High', color: '#FF4D6D' },
                  { label: 'Commercial Risk', value: 'Medium', color: '#FFB020' },
                  { label: 'Integration Risk', value: 'High', color: '#FF4D6D' },
                  { label: 'Submission Urgency', value: 'High', color: '#FFB020' },
                  { label: 'Confidence Score', value: '86%', color: '#00E5FF' },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{m.label}</div>
                    <div className="font-semibold text-lg" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-6 mb-5" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-text-secondary leading-relaxed">
                  This is a strategically attractive BFSI transformation opportunity, but it should move forward only after leadership review of delivery complexity, legacy integration dependencies, and commercial exposure.
                </p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,209,102,0.04)', border: '1px solid rgba(255,209,102,0.15)' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#FFD166' }}>Decision Conditions</div>
                <ul className="space-y-2">
                  {[
                    'Confirm mandatory eligibility documentation is available and complete',
                    'Validate integration scope and legacy system dependencies with delivery team',
                    'Review payment and penalty clauses with commercial lead',
                    'Secure senior delivery sponsorship before submission',
                    'Prepare clarification questions for pre-bid meeting on 12 June 2026',
                  ].map((c, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FFD166' }} />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 2 — EXTRACTED METADATA */}
            <section id="section-metadata">
              <SectionHeader number="02" title="Extracted Metadata" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Issuing Institution', value: 'Leading Public Sector Bank' },
                  { label: 'RFP Title', value: 'Digital Lending Transformation RFP' },
                  { label: 'Segment', value: 'Banking' },
                  { label: 'RFP Type', value: 'Digital Lending / LOS Transformation' },
                  { label: 'Geography', value: 'India' },
                  { label: 'Submission Deadline', value: '30 June 2026' },
                  { label: 'Pre-bid Date', value: '12 June 2026' },
                  { label: 'Clarification Deadline', value: '18 June 2026' },
                  { label: 'Contract Duration', value: '3 years' },
                  { label: 'Pages Analyzed', value: '142' },
                  { label: 'Sections Detected', value: '7' },
                ].map((f, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">{f.label}</div>
                    <div className="text-text-primary font-medium text-sm">{f.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 3 — OPPORTUNITY SNAPSHOT */}
            <section id="section-snapshot">
              <SectionHeader number="03" title="Opportunity Snapshot" />
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Client Context', body: 'A leading public sector bank seeking to modernize its retail lending infrastructure. Legacy LOS platform with high manual processing burden and growing digital customer expectations.' },
                  { title: 'Transformation Objective', body: 'End-to-end digitization of the lending journey — from customer acquisition through credit decision to disbursement — with automated workflow orchestration.' },
                  { title: 'Business Functions Impacted', body: 'Retail lending, credit underwriting, collections, customer onboarding, branch operations, and digital banking channels.' },
                  { title: 'Technology Scope', body: 'LOS/LMS replacement or upgrade, API gateway integration, customer portal, mobile lending app, analytics dashboard, and core banking interface.' },
                  { title: 'Operating Model Impact', body: 'Significant redesign of credit operations, reduced manual touchpoints, new digital roles, and branch staff reskilling requirements.' },
                  { title: 'Stakeholder Complexity', body: 'Multi-stakeholder engagement across IT, credit, operations, compliance, and digital banking leadership. Board-level visibility expected.' },
                ].map((c, i) => (
                  <div key={i} className="rounded-xl p-5 card-hover" style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.15)', boxShadow: '0 0 20px rgba(0,229,255,0.04)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#00E5FF' }}>{c.title}</div>
                    <p className="text-text-secondary text-sm leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 4 — ELIGIBILITY */}
            <section id="section-eligibility">
              <SectionHeader number="04" title="Eligibility & Compliance" />
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#08111F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Requirement', 'Type', 'Status', 'Confidence', 'Action Required'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-text-muted first:pl-5 last:pr-5">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { req: 'Prior BFSI transformation experience', type: 'Mandatory', status: 'Likely Met', statusColor: '#00F5A0', conf: 'High', action: 'Add 3-5 case studies' },
                      { req: 'Net worth / turnover threshold', type: 'Mandatory', status: 'Needs Review', statusColor: '#FFB020', conf: 'Medium', action: 'Validate finance documentation' },
                      { req: 'Digital lending platform experience', type: 'Mandatory', status: 'Partially Met', statusColor: '#FFB020', conf: 'Medium', action: 'Confirm solution credentials' },
                      { req: 'Bid security submission', type: 'Mandatory', status: 'Pending', statusColor: '#FF4D6D', conf: 'High', action: 'Assign proposal operations' },
                      { req: 'Local implementation support', type: 'Optional', status: 'Met', statusColor: '#00F5A0', conf: 'High', action: 'Highlight India delivery model' },
                    ].map((r, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(8,17,31,0.8)' : 'rgba(15,27,46,0.4)' }}>
                        <td className="px-4 py-3.5 pl-5 text-sm text-text-primary max-w-[200px]">{r.req}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: r.type === 'Mandatory' ? 'rgba(255,77,109,0.08)' : 'rgba(255,255,255,0.05)', color: r.type === 'Mandatory' ? '#FF4D6D' : '#9CAEC4' }}>{r.type}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-medium" style={{ color: r.statusColor }}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-text-muted">{r.conf}</td>
                        <td className="px-4 py-3.5 pr-5 text-xs text-text-secondary">{r.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 5 — SCOPE INTELLIGENCE */}
            <section id="section-scope">
              <SectionHeader number="05" title="Scope Intelligence" />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Lending Journey Coverage', body: 'Full digital lending lifecycle from customer acquisition, application, underwriting, approval, disbursement, and repayment management.', complexity: 'High' },
                  { title: 'LOS / LMS Integration', body: 'New or upgraded loan origination system with existing core banking integration. Complex API and data migration requirements.', complexity: 'High' },
                  { title: 'Customer Portal', body: 'Self-service digital lending portal for retail customers with document upload, status tracking, and communication workflows.', complexity: 'Medium' },
                  { title: 'Workflow Automation', body: 'Credit decision automation, exception handling workflows, and queue management for underwriting teams.', complexity: 'Medium' },
                  { title: 'Analytics and Reporting', body: 'MIS dashboards, portfolio analytics, regulatory reporting, and credit risk monitoring for management visibility.', complexity: 'Medium' },
                  { title: 'Governance and Change Management', body: 'Training program, process documentation, operational transition, and post-go-live hypercare support across branches.', complexity: 'Low' },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl p-5 card-hover" style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.12)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-text-primary">{s.title}</div>
                      <RiskBadge level={s.complexity} />
                    </div>
                    <p className="text-text-muted text-xs leading-relaxed">{s.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 6 — RISK RADAR */}
            <section id="section-risk">
              <SectionHeader number="06" title="Risk Radar" />
              <div className="space-y-3">
                {[
                  { category: 'Delivery Risk', level: 'High', why: 'Aggressive timeline with phased go-live across 3,000+ branches. Limited mobilization window from contract award.', mitigation: 'Pre-allocate delivery team. Define phased scope with clear milestone gates.', owner: 'Delivery Lead' },
                  { category: 'Integration Risk', level: 'High', why: 'Core banking system (CBS) integration complexity not fully disclosed. Legacy APIs may require extensive reverse engineering.', mitigation: 'Raise integration scope clarification before submission. Validate CBS vendor support availability.', owner: 'Tech Lead' },
                  { category: 'Commercial Risk', level: 'Medium', why: 'Pricing model not confirmed. QCBS vs L1 methodology unclear. Penalty clauses may include aggressive liquidated damages.', mitigation: 'Review commercial section in detail. Confirm pricing methodology in pre-bid queries.', owner: 'Commercial Lead' },
                  { category: 'Legal Risk', level: 'Medium', why: 'Standard public sector contract with limited negotiation flexibility. IP ownership clauses require review.', mitigation: 'Legal review of contract annexures. Flag IP and data clauses for negotiation.', owner: 'Legal Lead' },
                  { category: 'Timeline Risk', level: 'High', why: 'Submission deadline is 30 June 2026 with pre-bid on 12 June. Tight window for solution design and pricing.', mitigation: 'Mobilize bid team immediately. Assign dedicated bid manager.', owner: 'Bid Manager' },
                  { category: 'Resource Risk', level: 'Medium', why: 'Requires BFSI SMEs, CBS-experienced architect, and senior delivery leadership. Availability in peak season uncertain.', mitigation: 'Confirm resource availability by 16 June. Identify backup SMEs.', owner: 'Pursuit Lead' },
                  { category: 'Strategic Fit Risk', level: 'Low', why: 'Digital lending transformation is a core capability area. Strong credential base and delivery track record.', mitigation: 'Ensure case studies are positioned to reflect PSU bank transformation experience.', owner: 'Solution Lead' },
                ].map((r, i) => {
                  const borderColor = r.level === 'High' ? 'rgba(255,77,109,0.2)' : r.level === 'Medium' ? 'rgba(255,176,32,0.15)' : 'rgba(0,245,160,0.15)';
                  const bgColor = r.level === 'High' ? 'rgba(255,77,109,0.04)' : r.level === 'Medium' ? 'rgba(255,176,32,0.03)' : 'rgba(0,245,160,0.03)';
                  return (
                    <div key={i} className="rounded-xl p-5" style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="font-semibold text-sm text-text-primary">{r.category}</div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <RiskBadge level={r.level} />
                          <span className="text-[10px] text-text-muted uppercase">{r.owner}</span>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Why it's a risk</div>
                          <p className="text-text-secondary text-xs leading-relaxed">{r.why}</p>
                        </div>
                        <div>
                          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Mitigation</div>
                          <p className="text-text-secondary text-xs leading-relaxed">{r.mitigation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 7 — COMMERCIAL LENS */}
            <section id="section-commercial">
              <SectionHeader number="07" title="Commercial Lens" />
              <div className="grid md:grid-cols-2 gap-6 mb-5">
                {[
                  { label: 'Pricing Expectations', value: 'Not disclosed. Likely L1 or QCBS model based on public sector norms. Price competitiveness will be critical.' },
                  { label: 'Payment Terms', value: 'Milestone-based disbursements expected. Standard 30-day payment terms. Advance payment may be available against bank guarantee.' },
                  { label: 'Penalty Exposure', value: 'Likely SLA penalties for go-live delays and post-production defects. Liquidated damages clause probable.' },
                  { label: 'Margin Pressure', value: 'High. Public sector RFPs typically compress margin. Factor in compliance overhead, reporting requirements, and bid bond costs.' },
                ].map((c, i) => (
                  <div key={i} className="rounded-xl p-5" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">{c.label}</div>
                    <p className="text-text-secondary text-sm leading-relaxed">{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,77,109,0.05)', border: '1px solid rgba(255,77,109,0.2)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#FF4D6D' }}>Commercial Red Flags</div>
                  {['Penalty clause specifics not disclosed — high liquidated damages risk', 'No advance payment confirmation — cash flow exposure', 'Bid security EMD required — operational overhead'].map((f, i) => (
                    <div key={i} className="flex gap-2 text-xs text-text-secondary mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FF4D6D' }} />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,176,32,0.05)', border: '1px solid rgba(255,176,32,0.2)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#FFB020' }}>Clauses Needing Review</div>
                  {['IP and data ownership in technology deployment', 'Exit and transition obligations on contract end', 'Subcontracting and partner engagement restrictions', 'Warranty and post-implementation support obligations'].map((c, i) => (
                    <div key={i} className="flex gap-2 text-xs text-text-secondary mb-2">
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FFB020' }} />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 8 — WIN THEMES */}
            <section id="section-wins">
              <SectionHeader number="08" title="Win Themes" />
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { n: '01', title: 'BFSI Transformation Credibility', body: 'Track record of delivering large-scale banking transformation programs in PSU and private bank environments.' },
                  { n: '02', title: 'Digital Lending Domain Depth', body: 'Deep expertise in LOS/LMS design, credit workflow automation, and digital lending channel development.' },
                  { n: '03', title: 'AI-led Process Intelligence', body: 'AI-powered credit decisioning, document processing automation, and anomaly detection capabilities.' },
                  { n: '04', title: 'Legacy Integration Experience', body: 'Proven approach to CBS integration, API layer design, and data migration from legacy lending platforms.' },
                  { n: '05', title: 'Strong Governance Model', body: 'Structured program governance with milestone-based tracking, executive steering, and escalation protocols.' },
                  { n: '06', title: 'Accelerated Mobilization', body: 'Rapid team ramp-up capability with pre-trained BFSI delivery units and reusable solution accelerators.' },
                  { n: '07', title: 'India Delivery Scale', body: 'Strong India-based delivery presence with branch-level implementation support and regional change management capability.' },
                ].map((w, i) => (
                  <div key={i} className="flex gap-4 rounded-xl p-5 card-hover" style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.12)' }}>
                    <div className="font-mono font-bold text-xs pt-0.5" style={{ color: 'rgba(0,229,255,0.4)', minWidth: 24 }}>{w.n}</div>
                    <div>
                      <div className="text-text-primary font-semibold text-sm mb-1.5">{w.title}</div>
                      <p className="text-text-muted text-xs leading-relaxed">{w.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 9 — PROPOSAL STRATEGY */}
            <section id="section-strategy">
              <SectionHeader number="09" title="Proposal Strategy" />
              <div className="rounded-2xl p-6 mb-5" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.2)' }}>
                <div className="text-xs text-neon-cyan uppercase tracking-wider mb-3">Recommended Positioning</div>
                <p className="text-text-secondary leading-relaxed">
                  Position the response around <strong className="text-text-primary">risk-managed digital lending transformation</strong> — combining BFSI domain depth, scalable technology delivery, operating model redesign, and phased implementation governance. Lead with PSU bank experience and a clear delivery confidence narrative.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="rounded-xl p-5" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-text-muted">Differentiators to Emphasize</div>
                  {['Phased go-live with risk-gated delivery model', 'Pre-built digital lending accelerators reducing delivery time', 'Dedicated CBS integration pod with proven playbook', 'BFSI-trained change management and branch enablement', 'Transparent governance with fortnightly leadership reviews'].map((d, i) => (
                    <div key={i} className="flex gap-2 text-xs text-text-secondary mb-2.5">
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neon-cyan" />
                      {d}
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-text-muted">Case Studies to Include</div>
                    {['PSU bank LOS transformation (2,500+ branches)', 'Private bank digital lending platform (4M+ customers)', 'Regional bank CBS integration project'].map((c, i) => (
                      <div key={i} className="text-xs text-text-secondary mb-1.5 flex gap-2">
                        <span className="text-neon-mint">·</span> {c}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-text-muted">Stakeholders to Activate</div>
                    {['Bank CTO / CIO for technology credibility', 'RBI / compliance head for regulatory alignment', 'CFO for commercial risk discussion'].map((s, i) => (
                      <div key={i} className="text-xs text-text-secondary mb-1.5 flex gap-2">
                        <span className="text-neon-cyan">·</span> {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 10 — EFFORT & TEAMING */}
            <section id="section-effort">
              <SectionHeader number="10" title="Effort & Teaming" />
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#08111F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Workstream', 'Role Required', 'Effort', 'Owner', 'Notes'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-text-muted first:pl-5">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ws: 'Bid Management', role: 'Bid Manager', effort: '240 hrs', owner: 'Proposal Lead', note: 'End-to-end coordination' },
                      { ws: 'Solution Design', role: 'BFSI Architect', effort: '300 hrs', owner: 'Solution Lead', note: 'Technical approach' },
                      { ws: 'BFSI SME Inputs', role: 'Domain Expert', effort: '160 hrs', owner: 'SME Lead', note: 'Transformation experience' },
                      { ws: 'Technology Inputs', role: 'Tech Architect', effort: '240 hrs', owner: 'Tech Lead', note: 'Platform and integration design' },
                      { ws: 'Commercial Pricing', role: 'Pricing Manager', effort: '120 hrs', owner: 'Commercial Lead', note: 'Costing and margins' },
                      { ws: 'Legal Review', role: 'Legal Counsel', effort: '80 hrs', owner: 'Legal Lead', note: 'Contract review' },
                      { ws: 'Partner Review', role: 'Partner Review', effort: '60 hrs', owner: 'Leadership', note: 'Final sanity check' },
                    ].map((r, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'rgba(8,17,31,0.8)' : 'rgba(15,27,46,0.4)' }}>
                        <td className="px-4 py-3 pl-5 text-sm text-text-primary">{r.ws}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{r.role}</td>
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: '#00E5FF' }}>{r.effort}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{r.owner}</td>
                        <td className="px-4 py-3 text-xs text-text-muted">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 11 — CLARIFICATION QUESTIONS */}
            <section id="section-questions">
              <SectionHeader number="11" title="Clarification Questions" />
              <div className="space-y-3">
                {[
                  'Please confirm the specific legacy systems and integration touchpoints in scope for the transformation.',
                  'Please clarify the expected data migration approach, including ownership of data readiness and cleansing.',
                  'Please confirm whether commercial evaluation follows QCBS, L1, or an alternative scoring methodology.',
                  'Please clarify the penalty mechanism and liquidated damages calculation for implementation delays.',
                  'Please confirm the expected deployment architecture — on-premise, cloud, or hybrid.',
                  'Please clarify ownership of API readiness and whether the bank will provide integration documentation.',
                  'Please confirm whether existing lending workflows and process documentation are available for review.',
                ].map((q, i) => (
                  <div key={i} className="flex gap-4 rounded-xl p-4" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold" style={{ background: 'rgba(0,229,255,0.08)', color: '#00E5FF' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="section-divider" />

            {/* SECTION 12 — NEXT ACTIONS */}
            <section id="section-actions">
              <SectionHeader number="12" title="Next Actions" />
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-5 py-3 border-b text-xs text-text-muted" style={{ background: '#08111F', borderColor: 'rgba(255,255,255,0.06)' }}>
                  Click any action to cycle status: Not Started → In Progress → Completed
                </div>
                <div>
                  {nextActions.map((a, i) => {
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
                        <div className="text-xs text-text-muted">→ {a.owner}</div>
                        <div className="text-[10px] uppercase tracking-wider w-20 text-right" style={{ color: isCompleted ? '#00F5A0' : isInProgress ? '#FFB020' : '#00E5FF' }}>
                          {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
            {[
              { label: 'Strategic Fit', value: 'High', color: '#00F5A0' },
              { label: 'Confidence Score', value: `${confidenceScore}%`, color: '#00E5FF' },
              { label: 'Risk Level', value: riskLevel || '—', color: '#FF4D6D' },
              { label: 'Pages Analyzed', value: '142', color: '#9CAEC4' },
              { label: 'Mandatory Criteria', value: '5', color: '#9CAEC4' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span className="text-xs text-text-muted">{item.label}</span>
                <span className="text-xs font-semibold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <span className="text-xs text-text-muted">Submission Deadline</span>
              <span className="text-xs font-bold" style={{ color: '#FFB020' }}>{dueDate}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-text-muted">Leadership Review</span>
              <span className="text-xs font-semibold" style={{ color: '#FF4D6D' }}>Required</span>
            </div>
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
            <button
              className="w-full py-2.5 rounded-lg text-xs font-medium text-text-secondary flex items-center justify-center gap-1.5 transition-all hover:text-text-primary"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Regenerate Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
