import { useState, useEffect } from 'react';
import { Brain, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

export default function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically on SIGNED_IN / PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setSessionReady(true);
      }
    });

    // Also check if a session is already active (hash already consumed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        setDone(true);
        setTimeout(() => onNavigate('workspace'), 2500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #00E5FF, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #00E5FF, transparent)' }} />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.35)' }}>
            <Brain className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <div className="font-serif font-semibold text-text-primary text-lg leading-none">ProposalPilot</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest leading-none mt-0.5">BFSI RFP Analyzer</div>
          </div>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.2)', boxShadow: '0 0 60px rgba(0,229,255,0.06)' }}>
          {done ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12" style={{ color: '#00E5FF' }} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">Password updated</h2>
              <p className="text-text-muted text-sm">Redirecting you to your workspace...</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">Set new password</h1>
                <p className="text-text-muted text-sm">
                  {sessionReady
                    ? 'Choose a new password for your account.'
                    : 'Validating your reset link...'}
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', color: '#FF4D6D' }}>
                  {error}
                </div>
              )}

              {!sessionReady ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(0,229,255,0.2)', borderTopColor: '#00E5FF' }} />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-text-primary placeholder-text-muted"
                        style={{ background: '#0F1B2E', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(0,229,255,0.4)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-text-primary placeholder-text-muted"
                        style={{ background: '#0F1B2E', border: '1px solid rgba(255,255,255,0.08)', outline: 'none' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(0,229,255,0.4)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] mt-4"
                    style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#030712', boxShadow: '0 0 30px rgba(0,229,255,0.25)' }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        Updating...
                      </div>
                    ) : (
                      <>Update password <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
