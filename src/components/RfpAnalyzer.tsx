import { useState } from 'react';
import { Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

async function analyzeRfp(rfpText: string): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-rfp', {
    body: { rfpText },
  });

  if (error) throw new Error(error.message || 'Analysis function failed');
  if (data?.error) throw new Error(data.error);

  return { json: data.json, markdown: data.markdown };
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
