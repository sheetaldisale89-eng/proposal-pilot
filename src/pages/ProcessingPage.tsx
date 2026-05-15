import { useState, useEffect } from 'react';
import { CheckCircle, Loader, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { supabase } from '@/lib/supabase';
import type { RfpProject } from '@/lib/types';

interface ProcessingPageProps {
  onNavigate: (page: string, data?: unknown) => void;
  activeProject?: RfpProject | null;
}

const stages = [
  { id: 1, label: 'Document structure mapping' },
  { id: 2, label: 'Metadata validation' },
  { id: 3, label: 'Eligibility and compliance extraction' },
  { id: 4, label: 'Scope and deliverables analysis' },
  { id: 5, label: 'Commercial and contractual risk scan' },
  { id: 6, label: 'Win-theme and differentiator mapping' },
  { id: 7, label: 'Executive brief assembly' },
];

export default function ProcessingPage({ onNavigate, activeProject }: ProcessingPageProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [activeStage, setActiveStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  // Fetch analysis from Supabase
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        if (!activeProject?.id) {
          setError('No active project');
          setLoading(false);
          return;
        }

        // Fetch latest ai_analysis_results for this project
        const { data, error: fetchError } = await supabase
          .from('ai_analysis_results')
          .select('*')
          .eq('project_id', activeProject.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('No analysis found');

        setAnalysis(data);

        // If already completed, show completion state immediately
        if (data.status === 'completed') {
          setProgress(100);
          setComplete(true);
          setLoading(false);
          // Simulate completion animation
          setCompletedStages(stages.map(s => s.id));
          setActiveStage(0);
          const logs = [
            `Bank: ${data.rfp_objective?.split(':')[0] || 'RFP identified'}`,
            `Status: Analysis completed`,
            `Confidence: ${data.confidence_score}%`,
            `Sections analyzed: 7/7`,
          ];
          setVisibleLogs(logs);
        } else if (data.status === 'queued' || data.status === 'processing') {
          // Still processing - poll for updates
          setLoading(false);
          const pollInterval = setInterval(async () => {
            const { data: updated } = await supabase
              .from('ai_analysis_results')
              .select('*')
              .eq('id', data.id)
              .single();

            if (updated?.status === 'completed') {
              setAnalysis(updated);
              setProgress(100);
              setComplete(true);
              setCompletedStages(stages.map(s => s.id));
              clearInterval(pollInterval);
            }
          }, 2000); // Poll every 2 seconds

          return () => clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setError(data.error_message || 'Analysis failed');
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [activeProject?.id]);

  // Animate stages if analysis just completed
  useEffect(() => {
    if (complete && completedStages.length === 0) {
      let stageIndex = 0;
      let logIndex = 0;

      const logs = [
        `RFP: ${analysis?.rfp_objective?.substring(0, 50)}...` || 'RFP identified',
        `Eligibility items: ${analysis?.eligibility_criteria?.length || 0}`,
        `Scope items: ${analysis?.scope_of_work?.length || 0}`,
        `Risk flags: ${analysis?.risks_and_red_flags?.length || 0}`,
        `Clarification questions: ${analysis?.clarification_questions?.length || 0}`,
        `Win themes: ${analysis?.win_themes?.length || 0}`,
        `Confidence score: ${analysis?.confidence_score}%`,
      ];

      const advanceStage = () => {
        if (stageIndex < stages.length) {
          setActiveStage(stageIndex + 1);
          const interval = setInterval(() => {
            if (logIndex < logs.length && Math.floor(logIndex * stages.length / logs.length) <= stageIndex) {
              setVisibleLogs(prev => [...prev, logs[logIndex]]);
              logIndex++;
            }
          }, 200);

          setTimeout(() => {
            clearInterval(interval);
            setCompletedStages(prev => [...prev, stageIndex + 1]);
            setProgress(Math.round(((stageIndex + 1) / stages.length) * 100));
            stageIndex++;
            if (stageIndex < stages.length) {
              setTimeout(advanceStage, 400);
            } else {
              setProgress(100);
              setVisibleLogs(logs);
            }
          }, 1000);
        }
      };

      const timer = setTimeout(advanceStage, 300);
      return () => clearTimeout(timer);
    }
  }, [complete, analysis, completedStages.length]);

  if (loading && !analysis) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar currentPage="upload" onNavigate={onNavigate} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader className="w-12 h-12 animate-spin mx-auto" style={{ color: '#00E5FF' }} />
            <div className="text-text-primary font-semibold">Loading analysis...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="upload" onNavigate={onNavigate} />

      <div className="flex-1 overflow-auto">
        <div className="px-8 py-5 border-b sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(3,7,18,0.9)' }}>
          <h1 className="font-serif text-2xl font-bold text-text-primary">Building Intelligence Brief</h1>
          <p className="text-text-muted text-sm mt-0.5">ProposalPilot is converting the RFP into a structured pursuit decision report.</p>
        </div>

        <div className="p-8 max-w-4xl mx-auto">
          {error && (
            <div className="mb-8 flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)' }}>
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: '#FF4D6D' }} />
              <div>
                <div className="font-semibold text-sm" style={{ color: '#FF4D6D' }}>Analysis Error</div>
                <div className="text-sm text-text-secondary">{error}</div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Pipeline */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <h2 className="text-text-primary font-semibold text-sm">Intelligence Pipeline</h2>
              </div>
              <div className="p-6 space-y-3">
                {stages.map((stage) => {
                  const isCompleted = completedStages.includes(stage.id);
                  const isActive = activeStage === stage.id && !isCompleted;
                  const isPending = activeStage < stage.id;

                  return (
                    <div
                      key={stage.id}
                      className="flex items-center gap-4 p-3.5 rounded-xl transition-all"
                      style={{
                        background: isActive ? 'rgba(0,229,255,0.06)' : isCompleted ? 'rgba(0,245,160,0.04)' : 'rgba(255,255,255,0.02)',
                        border: isActive ? '1px solid rgba(0,229,255,0.2)' : isCompleted ? '1px solid rgba(0,245,160,0.15)' : '1px solid rgba(255,255,255,0.05)',
                        boxShadow: isActive ? '0 0 20px rgba(0,229,255,0.08)' : 'none',
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                        style={{
                          background: isCompleted ? 'rgba(0,245,160,0.1)' : isActive ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)',
                          color: isCompleted ? '#00F5A0' : isActive ? '#00E5FF' : '#64748B',
                        }}
                      >
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : isActive ? <Loader className="w-4 h-4 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div
                          className="text-sm font-medium"
                          style={{ color: isCompleted ? '#00F5A0' : isActive ? '#00E5FF' : '#64748B' }}
                        >
                          {stage.label}
                        </div>
                      </div>
                      {isCompleted && <span className="text-[10px] uppercase tracking-wider" style={{ color: '#00F5A0' }}>Done</span>}
                      {isActive && <span className="text-[10px] uppercase tracking-wider animate-pulse" style={{ color: '#00E5FF' }}>Active</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Log + Progress */}
            <div className="space-y-6">
              {/* Progress */}
              <div className="rounded-2xl p-6" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-text-muted uppercase tracking-wider">Brief assembly</span>
                  <span className="font-mono font-bold" style={{ color: '#00E5FF' }}>{progress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00E5FF, #00F5A0)' }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted uppercase tracking-wider">Confidence score</span>
                  <span className="font-mono font-semibold" style={{ color: analysis?.confidence_score ? '#00F5A0' : '#64748B' }}>
                    {analysis?.confidence_score ? `${analysis.confidence_score}%` : '--'}
                  </span>
                </div>
              </div>

              {/* Intelligence feed */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: complete ? '#00F5A0' : '#00E5FF', boxShadow: `0 0 8px ${complete ? '#00F5A0' : '#00E5FF'}` }} />
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Live Intelligence Feed</span>
                  </div>
                </div>
                <div className="p-5 space-y-2 font-mono text-xs" style={{ minHeight: 200, maxHeight: 300, overflowY: 'auto' }}>
                  {visibleLogs.length === 0 && !complete && (
                    <div className="flex gap-2 animate-pulse" style={{ color: '#64748B' }}>
                      <span>›</span>
                      <span>Waiting for analysis to start...</span>
                    </div>
                  )}
                  {visibleLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 animate-fade-in" style={{ color: '#9CAEC4' }}>
                      <span style={{ color: '#00E5FF' }}>›</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  {!complete && activeStage > 0 && (
                    <div className="flex gap-2" style={{ color: '#64748B' }}>
                      <span className="animate-pulse">›</span>
                      <span className="animate-pulse">Processing...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              {complete && analysis && (
                <button
                  onClick={() => onNavigate('brief', activeProject)}
                  className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-background transition-all hover:scale-105 animate-slide-up"
                  style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', boxShadow: '0 0 40px rgba(0,229,255,0.3)' }}
                >
                  Open Intelligence Brief
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {!complete && (
                <div className="py-4 rounded-xl text-center text-text-muted text-sm" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                  Building intelligence brief... please wait
                </div>
              )}

              {error && (
                <button
                  onClick={() => onNavigate('upload')}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#9CAEC4', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Go Back to Upload
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}