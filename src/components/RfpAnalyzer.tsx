import { useState } from 'react';
import { Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalysisResult {
  json: string;
  markdown: string;
}

type CopiedState = 'json' | 'markdown' | null;
type ActiveTab = 'json' | 'markdown';

// ─── Markdown renderer ────────────────────────────────────────────────────────
// Minimal but complete: headings, bold, tables, ordered/unordered lists, horizontal rules.

function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      output.push('<hr class="border-t border-white/10 my-4" />');
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      output.push(`<h3 class="text-base font-semibold text-text-primary mt-6 mb-2">${inlineFormat(line.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      output.push(`<h2 class="text-lg font-bold text-neon-cyan mt-8 mb-3 pb-1" style="border-bottom: 1px solid rgba(0,229,255,0.2)">${inlineFormat(line.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      output.push(`<h1 class="text-2xl font-bold text-text-primary mt-4 mb-4">${inlineFormat(line.slice(2))}</h1>`);
      i++;
      continue;
    }

    // Table — gather all pipe-delimited lines together
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      output.push(renderTable(tableLines));
      continue;
    }

    // Unordered list — gather contiguous bullet lines
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li class="mb-1 leading-relaxed">${inlineFormat(lines[i].replace(/^[-*] /, ''))}</li>`);
        i++;
      }
      output.push(`<ul class="list-disc list-inside space-y-0.5 text-text-secondary text-sm my-2 pl-2">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li class="mb-1 leading-relaxed">${inlineFormat(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i++;
      }
      output.push(`<ol class="list-decimal list-inside space-y-0.5 text-text-secondary text-sm my-2 pl-2">${items.join('')}</ol>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      output.push('<div class="my-1"></div>');
      i++;
      continue;
    }

    // Paragraph
    output.push(`<p class="text-text-secondary text-sm leading-relaxed mb-2">${inlineFormat(line)}</p>`);
    i++;
  }

  return output.join('\n');
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded text-xs font-mono" style="background:rgba(0,229,255,0.08);color:#00E5FF">$1</code>');
}

function renderTable(lines: string[]): string {
  const rows = lines.map(l =>
    l.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
  );
  if (rows.length < 2) return '';

  const header = rows[0];
  // row[1] is the separator (---), skip it
  const body = rows.slice(2);

  const headerHtml = header
    .map(h => `<th class="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider" style="color:#9CAEC4;border-bottom:1px solid rgba(255,255,255,0.08)">${inlineFormat(h)}</th>`)
    .join('');

  const bodyHtml = body
    .map((row, ri) => {
      const cells = row
        .map(c => `<td class="px-3 py-2 text-sm" style="color:#9CAEC4;border-bottom:1px solid rgba(255,255,255,0.04)">${inlineFormat(c)}</td>`)
        .join('');
      const bg = ri % 2 === 0 ? 'background:rgba(8,17,31,0.8)' : 'background:rgba(15,27,46,0.5)';
      return `<tr style="${bg}">${cells}</tr>`;
    })
    .join('');

  return `<div class="overflow-x-auto my-4 rounded-xl" style="border:1px solid rgba(255,255,255,0.08)"><table class="w-full text-sm"><thead><tr style="background:#08111F">${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`;
}

// ─── API call ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are ProposalPilot BFSI, an expert AI Bid Desk Analyst for Indian Banking, Financial Services, Insurance, FinTech, Payments, NBFC, and Capital Markets proposals. Analyze BFSI RFP text and output exactly: PART 1: Valid JSON (no preamble) following this schema: {analysis_metadata: {document_type: 'RFP|EOI|RFQ|Tender|Request for Information', sector: 'Banking|Insurance|FinTech|Payments|NBFC|Capital Markets|Mixed', rfp_title: '', issuing_organization: '', analysis_confidence: 'High|Medium|Low', confidence_reasoning: '', incomplete_document_warning: ''}, bid_desk_summary: {one_line_summary: '', opportunity_type: '', strategic_relevance: '', bid_complexity: '', go_no_go_signal: '', top_reasons_to_bid: [], top_reasons_for_caution: [], immediate_actions: []}, rfp_snapshot: {issuing_authority: '', rfp_reference_number: '', release_date: '', pre_bid_meeting_date: '', clarification_deadline: '', submission_deadline: '', bid_opening_date: '', contract_duration: '', estimated_contract_value: '', emd_amount: '', performance_bank_guarantee: '', submission_mode: '', contact_details: [{name: '', title: '', email: '', phone: ''}]}, eligibility_criteria: {legal_and_entity_requirements: [], financial_requirements: [], technical_requirements: [], experience_requirements: [], certifications_required: [], consortium_or_subcontracting_rules: [], blacklisting_or_debarment_conditions: [], other_eligibility_conditions: [], eligibility_gaps_or_unclear_items: []}, scope_of_work: {scope_summary: '', in_scope_items: [], out_of_scope_items: [], functional_scope: [], technical_scope: [], operational_scope: [], governance_and_reporting_scope: [], security_compliance_and_audit_scope: [], dependencies_on_client_or_third_parties: [], scope_ambiguities: []}, key_deliverables: {deliverables: [{deliverable_name: '', description: '', timeline_or_frequency: '', acceptance_criteria: '', owner_or_responsibility: ''}], milestones: [], sla_or_tat_requirements: [], documentation_requirements: []}, evaluation_criteria: {evaluation_method: '', technical_evaluation_criteria: [], financial_evaluation_criteria: [], scoring_weights: [], minimum_qualifying_score: '', presentation_or_demo_requirements: [], commercial_bid_rules: [], tie_breaker_or_selection_rules: [], evaluation_ambiguities: []}, submission_requirements: {submission_format: '', number_of_copies: '', technical_bid_requirements: [], financial_bid_requirements: [], mandatory_forms_and_annexures: [], supporting_documents: [], signing_and_authorization_requirements: [], packaging_or_labelling_instructions: [], online_portal_or_physical_submission_details: [], submission_risks: []}, compliance_checklist: [{compliance_item: '', category: 'Eligibility|Legal|Technical|Financial|Commercial|Security|Regulatory|Submission|Delivery|Governance', mandatory_or_desirable: 'Mandatory|Desirable', evidence_required: '', status_from_rfp_text: '', risk_if_missed: ''}], red_flags_and_ambiguities: {commercial_red_flags: [], legal_or_contractual_red_flags: [], delivery_red_flags: [], technical_red_flags: [], eligibility_red_flags: [], timeline_red_flags: [], ambiguities_requiring_clarification: []}, clarification_questions: [{question: '', reason_for_asking: '', rfp_section_or_context: '', priority: 'High|Medium|Low'}], proposal_strategy_recommendations: {recommended_positioning: '', win_themes: [], solution_strategy: [], delivery_strategy: [], commercial_strategy: [], partner_or_subcontractor_strategy: [], differentiators_to_highlight: [], risks_to_mitigate_in_proposal: [], assumptions_to_state: []}, recommended_next_steps: {within_24_hours: [], within_3_days: [], before_pre_bid_or_clarification_deadline: [], before_submission: [], internal_workstreams_to_start: []}}. PART 2: Markdown report with 12 sections: 1. 90-Second Bid Desk Summary (facts vs interpretation separated), 2. RFP Snapshot (table), 3. Eligibility Criteria, 4. Scope of Work, 5. Key Deliverables (table), 6. Evaluation Criteria, 7. Submission Requirements, 8. Compliance Checklist (table), 9. Red Flags and Ambiguities, 10. Clarification Questions (table), 11. Proposal Strategy Recommendations (RFP-based only), 12. Recommended Next Steps. RULES: (1) Do not invent facts—if missing, write 'Not specified in the RFP'. (2) All JSON fields must be populated. (3) Use 'Not specified in the RFP' for missing data in tables. (4) Preserve exact dates, amounts, numbers as stated. (5) Use Indian BFSI terminology. (6) If RFP contradicts itself, state both versions and flag as red flag. (7) Array limits: top_reasons_to_bid max 5, top_reasons_for_caution max 5, immediate_actions max 4, win_themes max 4, clarification_questions max 10, compliance_checklist max 15, other arrays max 10. (8) Strategy recommendations must be RFP-based, not bidder-assumed. (9) Do NOT add text before JSON or after Markdown.`;

async function analyzeRfp(rfpText: string): Promise<AnalysisResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('OpenAI API key is not configured. Set VITE_OPENAI_API_KEY in your .env file.');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      max_tokens: 4000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this BFSI RFP:\n\n${rfpText}` },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const message = (errBody as { error?: { message?: string } }).error?.message ?? `API error ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices[0]?.message?.content ?? '';

  // Split on the separator between PART 1 (JSON) and PART 2 (Markdown).
  // The model outputs JSON first, then the markdown report.
  // We locate the JSON block by finding the first { and the last matching }.
  const jsonStart = raw.indexOf('{');
  if (jsonStart === -1) throw new Error('No JSON found in API response. The model may have returned an unexpected format.');

  // Walk to find the balanced closing brace
  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
  }
  if (jsonEnd === -1) throw new Error('Malformed JSON in API response — could not find closing brace.');

  const jsonStr = raw.slice(jsonStart, jsonEnd + 1);
  const markdownStr = raw.slice(jsonEnd + 1).replace(/^\s*PART\s*2[:\s]*/i, '').trim();

  // Validate JSON parses
  try {
    JSON.parse(jsonStr);
  } catch {
    throw new Error('API returned invalid JSON. Try re-running the analysis.');
  }

  // Pretty-print JSON
  const prettyJson = JSON.stringify(JSON.parse(jsonStr), null, 2);

  return { json: prettyJson, markdown: markdownStr };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RfpAnalyzer = () => {
  const [rfpText, setRfpText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('markdown');
  const [copied, setCopied] = useState<CopiedState>(null);

  const wordCount = rfpText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = rfpText.length;
  const canSubmit = wordCount >= 200 && !loading;

  const handleAnalyze = async () => {
    if (wordCount < 200) {
      setError(`RFP text must be at least 200 words. Currently ${wordCount} words.`);
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const analysisResult = await analyzeRfp(rfpText);
      setResult(analysisResult);
      setActiveTab('markdown');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (type: 'json' | 'markdown') => {
    if (!result) return;
    const text = type === 'json' ? result.json : result.markdown;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: '#030712', color: '#F5F9FF', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="text-center space-y-2 animate-slide-up">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider mb-4"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse inline-block" />
            Powered by GPT-4 Turbo
          </div>
          <h1
            className="font-serif text-4xl font-bold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            ProposalPilot{' '}
            <span style={{ background: 'linear-gradient(135deg, #00E5FF, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              BFSI RFP Analyzer
            </span>
          </h1>
          <p className="text-text-secondary text-base">
            Paste your RFP document for instant consulting-grade analysis
          </p>
        </div>

        {/* ── Input section ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="px-5 py-3.5 flex items-center justify-between border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CAEC4' }}>
              RFP Document Text
            </span>
            <span className="text-xs font-mono" style={{ color: wordCount >= 200 ? '#00F5A0' : '#64748B' }}>
              {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
            </span>
          </div>
          <div className="p-4">
            <textarea
              value={rfpText}
              onChange={e => setRfpText(e.target.value)}
              disabled={loading}
              placeholder="Paste your BFSI RFP text here. The analyzer will extract metadata, eligibility criteria, scope of work, evaluation criteria, compliance requirements, red flags, clarification questions, and proposal strategy recommendations.

Minimum 200 words required for analysis."
              style={{
                width: '100%',
                minHeight: 500,
                background: '#0F1B2E',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                color: '#F5F9FF',
                fontSize: 14,
                lineHeight: 1.7,
                padding: '16px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(0,229,255,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
            />
          </div>
          <div
            className="px-4 pb-4 flex items-center justify-between"
          >
            <div className="text-xs" style={{ color: '#64748B' }}>
              {wordCount < 200
                ? `${200 - wordCount} more words needed`
                : <span style={{ color: '#00F5A0' }}>Ready for analysis</span>}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!canSubmit}
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #00E5FF, #00B8CC)'
                  : 'rgba(255,255,255,0.08)',
                color: canSubmit ? '#030712' : '#64748B',
                border: 'none',
                borderRadius: 10,
                padding: '11px 28px',
                fontSize: 14,
                fontWeight: 600,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: canSubmit ? '0 0 30px rgba(0,229,255,0.25)' : 'none',
              }}
              onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Analyzing RFP...
                </>
              ) : (
                'Analyze RFP'
              )}
            </button>
          </div>
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-5 animate-fade-in"
            style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.15)' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)' }}
            >
              <Loader className="w-6 h-6 animate-spin" style={{ color: '#00E5FF' }} />
            </div>
            <div className="text-center">
              <div className="text-text-primary font-semibold mb-1">Analyzing RFP document...</div>
              <div className="text-text-muted text-sm">
                GPT-4 Turbo is reading your document and building the intelligence brief. This typically takes 15–45 seconds.
              </div>
            </div>
            <div className="flex gap-2">
              {['Extracting metadata', 'Scoring eligibility', 'Mapping scope', 'Building report'].map((step, i) => (
                <div
                  key={i}
                  className="px-3 py-1 rounded-full text-xs animate-pulse"
                  style={{
                    background: 'rgba(0,229,255,0.06)',
                    border: '1px solid rgba(0,229,255,0.15)',
                    color: '#00E5FF',
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div
            className="flex items-start gap-3 rounded-xl p-4 animate-fade-in"
            style={{ background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.25)' }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FF4D6D' }} />
            <div>
              <div className="text-sm font-semibold mb-0.5" style={{ color: '#FF4D6D' }}>Analysis failed</div>
              <div className="text-sm" style={{ color: '#9CAEC4' }}>{error}</div>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div className="space-y-0 animate-slide-up rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Tab bar */}
            <div
              className="flex items-center justify-between px-2 py-2"
              style={{ background: '#08111F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex">
                {(['markdown', 'json'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '7px 18px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: activeTab === tab ? 'rgba(0,229,255,0.1)' : 'transparent',
                      color: activeTab === tab ? '#00E5FF' : '#64748B',
                      borderBottom: activeTab === tab ? '2px solid #00E5FF' : '2px solid transparent',
                    }}
                  >
                    {tab === 'markdown' ? 'Report (Markdown)' : 'JSON Output'}
                  </button>
                ))}
              </div>

              {/* Copy button */}
              <button
                onClick={() => handleCopy(activeTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  border: copied === activeTab
                    ? '1px solid rgba(0,245,160,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: copied === activeTab ? 'rgba(0,245,160,0.08)' : 'rgba(255,255,255,0.04)',
                  color: copied === activeTab ? '#00F5A0' : '#9CAEC4',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (copied !== activeTab) (e.currentTarget as HTMLButtonElement).style.color = '#F5F9FF'; }}
                onMouseLeave={e => { if (copied !== activeTab) (e.currentTarget as HTMLButtonElement).style.color = '#9CAEC4'; }}
              >
                {copied === activeTab ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy {activeTab === 'json' ? 'JSON' : 'Markdown'}
                  </>
                )}
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'json' && (
              <div style={{ background: '#0a1628', position: 'relative' }}>
                <pre
                  style={{
                    margin: 0,
                    padding: '24px',
                    overflowX: 'auto',
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    color: '#9CAEC4',
                    maxHeight: 700,
                    overflowY: 'auto',
                    tabSize: 2,
                  }}
                >
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightJson(result.json),
                    }}
                  />
                </pre>
              </div>
            )}

            {activeTab === 'markdown' && (
              <div
                style={{ background: '#08111F', padding: '32px', maxHeight: 800, overflowY: 'auto' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(result.markdown) }}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// ─── JSON syntax highlighter ─────────────────────────────────────────────────

function highlightJson(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            // key
            return `<span style="color:#00E5FF">${match}</span>`;
          }
          // string value
          return `<span style="color:#FFD166">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span style="color:#00F5A0">${match}</span>`;
        if (/null/.test(match)) return `<span style="color:#FF4D6D">${match}</span>`;
        // number
        return `<span style="color:#FFB020">${match}</span>`;
      }
    );
}

export default RfpAnalyzer;
