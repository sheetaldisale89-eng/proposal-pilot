import { useState, useRef } from 'react';
import { Upload, File, CheckCircle, X, FileText, Calendar, Users, DollarSign, Layers, Award, ClipboardList, Scale, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { supabase } from '@/lib/supabase';
import { useProjects } from '@/hooks/useProjects';

interface UploadPageProps {
  onNavigate: (page: string) => void;
  onFileUploaded: (info: { name: string; size: string; storagePath: string; projectId: string }) => void;
}

const infoCards = [
  { icon: <FileText className="w-4 h-4" />, label: 'Issuing Institution', desc: 'Bank, insurer, or financial entity' },
  { icon: <Layers className="w-4 h-4" />, label: 'BFSI Segment', desc: 'Banking, insurance, payments, capital markets' },
  { icon: <File className="w-4 h-4" />, label: 'RFP Title', desc: 'Full document title and reference' },
  { icon: <Calendar className="w-4 h-4" />, label: 'Submission Deadline', desc: 'Date and time of bid submission' },
  { icon: <Users className="w-4 h-4" />, label: 'Eligibility Criteria', desc: 'Mandatory qualification requirements' },
  { icon: <ClipboardList className="w-4 h-4" />, label: 'Scope and Deliverables', desc: 'Work packages and output expectations' },
  { icon: <DollarSign className="w-4 h-4" />, label: 'Commercial Terms', desc: 'Payment, penalties, and pricing model' },
  { icon: <Award className="w-4 h-4" />, label: 'Evaluation Criteria', desc: 'Scoring methodology and weightages' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function str(val: unknown, fallback = ''): string {
  if (val == null) return fallback;
  return String(val);
}

function toArr(val: unknown): unknown[] {
  return Array.isArray(val) ? val : [];
}

function toObj(val: unknown): Record<string, unknown> {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, unknown>;
  return {};
}

export default function UploadPage({ onNavigate, onFileUploaded }: UploadPageProps) {
  console.log('[UPLOAD PAGE RENDERED]');

  const { createProject } = useProjects();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; storagePath: string; projectId: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File exceeds the 50 MB limit.');
      return;
    }
    setError(null);
    setUploading(true);
    setUploadProgress(10);

    try {
      const userId = localStorage.getItem('userEmail') || 'anonymous';

      // Create a draft project
      const project = await createProject({
        title: file.name.replace(/\.pdf$/i, '').replace(/_/g, ' '),
        client_name: '',
        institution_type: 'Banking',
        rfp_category: '',
        description: '',
        due_date: null,
      });

      setUploadProgress(30);

      // Extract text from PDF client-side
      const { extractTextFromPdf } = await import('@/lib/pdfUtils');
      const rfpText = await extractTextFromPdf(file);
      if (!rfpText || rfpText.length < 200) {
        throw new Error('PDF extraction failed or text too short (< 200 characters)');
      }
      setUploadProgress(40);

      // Upload PDF to Supabase Storage
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${userId}/${project.id}/${safeFileName}`;
      const { error: storageError } = await supabase.storage
        .from('rfp-documents')
        .upload(storagePath, file, { upsert: false, contentType: 'application/pdf' });

      if (storageError) {
        console.error('[SUPABASE ERROR FULL]', JSON.stringify(storageError, null, 2));
        throw storageError;
      }
      setUploadProgress(50);

      // Create rfp_files row
      const { data: rfpFileData, error: fileRowError } = await supabase
        .from('rfp_files')
        .insert({
          project_id: project.id,
          uploaded_by: userId,
          bucket_name: 'rfp-documents',
          storage_path: storagePath,
          original_file_name: file.name,
          file_type: 'application/pdf',
          file_size_bytes: file.size,
          status: 'uploaded',
        })
        .select()
        .single();

      if (fileRowError) {
        console.error('[SUPABASE ERROR FULL]', JSON.stringify(fileRowError, null, 2));
        throw fileRowError;
      }
      setUploadProgress(60);

      // Create ai_analysis_results row (initial status: queued)
      const { data: analysisRecord, error: analysisCreateError } = await supabase
        .from('ai_analysis_results')
        .insert({
          project_id: project.id,
          rfp_file_id: rfpFileData.id,
          created_by: userId,
          status: 'queued',
          model_provider: 'openai',
          model_name: 'gpt-4o',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (analysisCreateError) {
        console.error('[SUPABASE ERROR FULL]', JSON.stringify(analysisCreateError, null, 2));
        throw analysisCreateError;
      }
      setUploadProgress(65);

      // Call analyze-rfp edge function
      const { data: fnData, error: fnError } = await supabase.functions.invoke('analyze-rfp', {
        body: { rfpText },
      });

      if (fnError) throw new Error(`Edge function error: ${fnError.message || JSON.stringify(fnError)}`);
      if (!fnData) throw new Error('Edge function returned no data');
      if (fnData.error) throw new Error(`Analysis error: ${fnData.error}`);
      if (!fnData.json) throw new Error('Edge function response missing JSON field');

      let analysisJson: Record<string, unknown>;
      try {
        analysisJson = JSON.parse(fnData.json);
      } catch {
        throw new Error(`Failed to parse analysis JSON: ${String(fnData.json).slice(0, 200)}`);
      }
      setUploadProgress(80);

      // ── Map new structured_json shape to DB columns ────────────────────────
      const sj = toObj(analysisJson.structured_json ?? analysisJson);
      const ov = toObj(sj.opportunity_overview);
      const evalCrit = toObj(sj.evaluation_criteria);
      const eligRows = toArr(sj.eligibility_criteria_table) as Record<string, unknown>[];
      const scopeSnapshot = toArr(sj.scope_snapshot) as string[];
      const scopeWorkstreams = toArr(sj.scope_of_work) as Record<string, unknown>[];
      const importantDates = toArr(sj.important_dates) as Record<string, unknown>[];
      const commercialReqs = toArr(sj.commercial_and_submission_requirements) as Record<string, unknown>[];
      const redFlags = toArr(sj.red_flags) as Record<string, unknown>[];
      const clarQs = toArr(sj.clarification_questions) as Record<string, unknown>[];

      const rfpTitle = str(ov.rfp_title) || file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');
      const issuingAuthority = str(ov.client);

      const executiveSummary = [
        str(ov.recommendation) ? `Recommendation: ${str(ov.recommendation)}` : null,
        str(ov.one_line_reason) || null,
      ].filter(Boolean).join('\n\n') || null;

      const keyDates = importantDates
        .map(d => ({ label: str(d.event), value: str(d.date_time), notes: str(d.mode_notes) }))
        .filter(d => d.label && d.value);

      const eligibilityCriteria = eligRows.map(row => ({
        sr_no: str(row.sr_no),
        criteria_category: str(row.criteria_category),
        eligibility_requirement: str(row.eligibility_requirement),
        documents_to_be_submitted: toArr(row.documents_to_be_submitted),
        mandatory_or_desirable: str(row.mandatory_or_desirable),
        proposal_team_action: str(row.proposal_team_action),
        source_reference: str(row.source_reference),
      }));

      const scopeOfWork = scopeWorkstreams.length > 0
        ? scopeWorkstreams.map(ws => ({
            workstream: str(ws.workstream),
            what_bank_wants: str(ws.what_bank_wants),
            deliverables: toArr(ws.deliverables),
            timeline: str(ws.timeline),
          }))
        : scopeSnapshot.map(b => ({ workstream: b }));

      const evaluationCriteria = [{
        evaluation_process: str(evalCrit.evaluation_process),
        technical_weightage: str(evalCrit.technical_weightage),
        commercial_weightage: str(evalCrit.commercial_weightage),
        minimum_technical_qualifying_score: str(evalCrit.minimum_technical_qualifying_score),
        commercial_bid_opening_rule: str(evalCrit.commercial_bid_opening_rule),
        final_selection_method: str(evalCrit.final_selection_method),
        special_conditions: toArr(evalCrit.special_conditions),
        stages: toArr(evalCrit.stages),
        detailed_scoring_table: toArr(evalCrit.detailed_scoring_table),
      }];

      const risksAndRedFlags = redFlags.map(f => ({
        flag: str(f.flag),
        detail: str(f.detail),
        risk_level: str(f.risk_level),
        recommended_action: str(f.recommended_action),
      }));

      const commercialSummary = commercialReqs
        .map(r => `${str(r.item)}: ${str(r.detail)}`)
        .filter(Boolean).join(' | ') || null;

      // Update rfp_projects with extracted title/client
      await supabase
        .from('rfp_projects')
        .update({ title: rfpTitle, client_name: issuingAuthority || null, status: 'completed' })
        .eq('id', project.id);

      // Update ai_analysis_results with full parsed data
      const { error: updateError } = await supabase
        .from('ai_analysis_results')
        .update({
          status: 'completed',
          executive_summary: executiveSummary,
          rfp_objective: str(ov.rfp_title) || null,
          scope_summary: scopeSnapshot.slice(0, 3).join('; ') || null,
          eligibility_summary: eligRows.length > 0 ? `${eligRows.length} eligibility criteria extracted` : null,
          compliance_summary: null,
          commercial_summary: commercialSummary,
          technical_summary: str(evalCrit.evaluation_process) || null,
          key_dates: keyDates,
          eligibility_criteria: eligibilityCriteria,
          scope_of_work: scopeOfWork,
          compliance_matrix: [],
          evaluation_criteria: evaluationCriteria,
          required_documents: commercialReqs,
          risks_and_red_flags: risksAndRedFlags,
          clarification_questions: clarQs,
          win_themes: [],
          recommended_actions: [],
          full_analysis_json: analysisJson,
          confidence_score: 85,
          completed_at: new Date().toISOString(),
        })
        .eq('id', analysisRecord.id);

      if (updateError) {
        console.error('[SUPABASE ERROR FULL]', JSON.stringify(updateError, null, 2));
        throw updateError;
      }
      setUploadProgress(100);

      const info = { name: file.name, size: formatBytes(file.size), storagePath, projectId: project.id };
      setUploadedFile(info);
      onFileUploaded(info);
      localStorage.setItem('lastProjectId', project.id);

      setTimeout(() => {
        onNavigate('brief', { id: project.id });
      }, 1000);

    } catch (err) {
      console.error('[UPLOAD FLOW ERROR]', err);
      const e = err as { message?: string; details?: string; hint?: string };
      setError(e.message || e.details || e.hint || 'Upload/analysis failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="upload" onNavigate={onNavigate} />

      <div className="flex-1 overflow-auto">
        <div className="px-8 py-5 border-b sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(3,7,18,0.9)' }}>
          <h1 className="font-serif text-2xl font-bold text-text-primary">Upload RFP Document</h1>
          <p className="text-text-muted text-sm mt-0.5">Upload a BFSI RFP PDF. ProposalPilot will identify the institution, key dates, scope, and eligibility criteria automatically.</p>
        </div>

        <div className="p-8 max-w-4xl mx-auto space-y-8">
          {/* Upload Zone */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#08111F',
              border: `1px solid ${isDragging ? 'rgba(0,229,255,0.6)' : 'rgba(255,255,255,0.06)'}`,
              boxShadow: isDragging ? '0 0 40px rgba(0,229,255,0.15)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-text-primary font-semibold text-sm">Document Upload</h2>
            </div>
            <div className="p-8">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', color: '#FF4D6D' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Idle dropzone */}
              {!uploadedFile && !uploading && (
                <div
                  className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-16 cursor-pointer transition-all"
                  style={{ borderColor: isDragging ? '#00E5FF' : 'rgba(0,229,255,0.2)', background: isDragging ? 'rgba(0,229,255,0.04)' : 'transparent' }}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.background = 'rgba(0,229,255,0.02)'; }}
                  onMouseLeave={e => { if (!isDragging) { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
                    <Upload className="w-7 h-7" style={{ color: '#00E5FF' }} />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">Drop BFSI RFP PDF</h3>
                  <p className="text-text-muted text-sm text-center max-w-sm mb-4">
                    PDF only. ProposalPilot will scan the document and extract opportunity metadata automatically.
                  </p>
                  <span className="text-xs text-text-muted px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    PDF up to 50 MB
                  </span>
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleInputChange} />
                </div>
              )}

              {/* Uploading */}
              {uploading && (
                <div className="rounded-xl flex flex-col items-center justify-center py-16" style={{ border: '1px solid rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.02)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.3)' }}>
                    <Upload className="w-7 h-7 text-neon-cyan animate-bounce" />
                  </div>
                  <div className="text-text-primary font-semibold mb-2">Analysing RFP document...</div>
                  <div className="text-text-muted text-sm mb-6">
                    {uploadProgress < 40 ? 'Uploading to secure storage...' :
                     uploadProgress < 65 ? 'Extracting PDF text...' :
                     uploadProgress < 80 ? 'Running AI analysis...' :
                     'Saving intelligence brief...'}
                  </div>
                  <div className="w-64 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #00E5FF, #00F5A0)' }}
                    />
                  </div>
                  <div className="text-neon-cyan font-mono text-xs mt-2">{uploadProgress}%</div>
                </div>
              )}

              {/* Success state */}
              {uploadedFile && (
                <div className="rounded-xl p-6 animate-slide-up" style={{ border: '1px solid rgba(0,245,160,0.3)', background: 'rgba(0,245,160,0.04)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.25)' }}>
                        <File className="w-6 h-6" style={{ color: '#00F5A0' }} />
                      </div>
                      <div>
                        <div className="text-text-primary font-semibold text-sm">{uploadedFile.name}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-text-muted text-xs">{uploadedFile.size}</span>
                          <span className="text-text-muted text-xs">·</span>
                          <span className="text-text-muted text-xs">Analysis complete — redirecting...</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(0,245,160,0.1)', color: '#00F5A0' }}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Analysis complete
                      </div>
                      <button onClick={handleReset} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10" style={{ color: '#64748B' }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-lg text-sm text-text-secondary" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                    Intelligence brief generated. Opening report...
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                <Scale className="w-3.5 h-3.5" />
                Documents are processed securely for proposal intelligence.
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div>
            <div className="text-xs text-text-muted uppercase tracking-widest mb-4">Metadata ProposalPilot will extract</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {infoCards.map((card, i) => (
                <div key={i} className="rounded-xl p-4 card-hover" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-2 text-text-muted">
                    {card.icon}
                    <span className="text-xs font-medium text-text-secondary">{card.label}</span>
                  </div>
                  <p className="text-text-muted text-xs leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('workspace')}
              className="px-7 py-3 rounded-lg font-medium text-sm text-text-secondary transition-all hover:text-text-primary"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Back to Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
