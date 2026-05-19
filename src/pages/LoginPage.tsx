import { useState } from 'react';
import { Brain, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleContinue = () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    localStorage.setItem('userEmail', email.trim().toLowerCase());
    onNavigate('workspace');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleContinue();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #00E5FF, transparent)' }} />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #00B8CC, transparent)' }} />
      </div>

      <div className="w-full max-w-md px-6 animate-slide-up relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', boxShadow: '0 0 40px rgba(0,229,255,0.12)' }}>
            <Brain className="w-7 h-7 text-neon-cyan" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-text-primary mb-1">ProposalPilot BFSI</h1>
          <p className="text-text-muted text-sm text-center">AI-Powered RFP Intelligence for BFSI Consulting</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{ background: '#08111F', border: '1px solid rgba(0,229,255,0.15)', boxShadow: '0 0 60px rgba(0,229,255,0.05)' }}>
          <div className="mb-6">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-1">Welcome back</h2>
            <p className="text-text-muted text-sm">Enter your work email to continue</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="you@company.com"
                autoFocus
                className="w-full px-4 py-3 rounded-lg text-sm text-text-primary placeholder-text-muted"
                style={{ background: '#0F1B2E', border: `1px solid ${error ? 'rgba(255,77,109,0.4)' : 'rgba(255,255,255,0.08)'}`, outline: 'none' }}
                onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(0,229,255,0.4)'; }}
                onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#FF4D6D' }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleContinue}
              disabled={!email.trim()}
              className="w-full py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#030712', boxShadow: email.trim() ? '0 0 30px rgba(0,229,255,0.25)' : 'none' }}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">For authorized pursuit team members only.</p>
      </div>
    </div>
  );
}
