import { useState } from 'react';
import { Brain, Mail, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onNavigate: _onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (otpError) throw otpError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #00E5FF, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-4" style={{ background: 'radial-gradient(circle, #00B8CC, transparent)' }} />
      </div>

      <div className="flex w-full min-h-screen">
        {/* Left trust panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative" style={{ background: 'linear-gradient(135deg, #08111F, #0F1B2E)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.35)' }}>
              <Brain className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <div className="font-serif font-semibold text-text-primary text-lg leading-none">ProposalPilot</div>
              <div className="text-[10px] text-text-muted uppercase tracking-widest leading-none mt-0.5">BFSI RFP Analyzer</div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-2xl p-8" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)', boxShadow: '0 0 40px rgba(0,229,255,0.06)' }}>
              <Shield className="w-8 h-8 mb-4" style={{ color: '#00E5FF' }} />
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-3">Secure BFSI pursuit intelligence</h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                Confidential proposal intelligence for authorized pursuit teams. Every document is processed in a secure, isolated environment.
              </p>
              <div className="mt-5 space-y-3">
                {[
                  'End-to-end document security',
                  'Passwordless — no credentials to compromise',
                  'Confidential pursuit data protection',
                  'Audit trail for all analyses',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00E5FF' }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '18', label: 'RFPs Analyzed' },
                { value: '86%', label: 'Avg. Confidence' },
                { value: '14', label: 'Briefs Completed' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="font-serif text-2xl font-bold" style={{ color: '#00E5FF' }}>{stat.value}</div>
                  <div className="text-text-muted text-xs mt-1 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-text-muted text-xs">© 2026 ProposalPilot. For authorized users only.</div>
        </div>

        {/* Right: login card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md animate-slide-up">
            <div className="rounded-2xl p-8" style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.2)', boxShadow: '0 0 60px rgba(0,229,255,0.06)' }}>

              {/* Mobile logo */}
              <div className="flex items-center gap-2 mb-1 lg:hidden">
                <Brain className="w-5 h-5 text-neon-cyan" />
                <span className="font-serif font-semibold text-text-primary">ProposalPilot</span>
              </div>

              {sent ? (
                /* ── Success state ── */
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
                    <Mail className="w-8 h-8" style={{ color: '#00E5FF' }} />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">Check your inbox</h2>
                  <p className="text-text-secondary text-sm mb-1">
                    We've sent a magic link to
                  </p>
                  <p className="font-semibold text-sm mb-4" style={{ color: '#00E5FF' }}>{email}</p>
                  <p className="text-text-muted text-sm mb-1">Click the link in the email to sign in.</p>
                  <p className="text-text-muted text-xs mb-6">Link expires in 60 minutes.</p>
                  <button
                    onClick={() => { setSent(false); setError(null); }}
                    className="text-xs transition-colors"
                    style={{ color: 'rgba(156,174,196,0.7)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#9CAEC4')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(156,174,196,0.7)')}
                  >
                    Wrong email? Go back
                  </button>
                </div>
              ) : (
                /* ── Form state ── */
                <>
                  <div className="mb-8">
                    <h1 className="font-serif text-3xl font-bold text-text-primary mb-2">
                      Welcome to ProposalPilot BFSI
                    </h1>
                    <p className="text-text-muted text-sm">
                      Enter your email to receive a secure login link.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', color: '#FF4D6D' }}>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Email address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          autoFocus
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
                      className="w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] mt-2 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#030712', boxShadow: '0 0 30px rgba(0,229,255,0.25)' }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Magic Link
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-text-muted text-xs mt-6">For authorized users only.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
