import { FileText, Brain, Shield, Download, ChevronRight, ArrowRight, Zap, BarChart3, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(0,229,255,0.35)' }}>
              <Brain className="w-4 h-4 text-neon-cyan" />
            </div>
            <div>
              <span className="font-serif font-semibold text-text-primary text-lg leading-none">ProposalPilot</span>
              <div className="text-[10px] text-text-muted uppercase tracking-widest leading-none mt-0.5">BFSI RFP Analyzer</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-text-secondary text-sm hover:text-text-primary transition-colors">Product</a>
            <a href="#" className="text-text-secondary text-sm hover:text-text-primary transition-colors">How It Works</a>
            <button onClick={() => onNavigate('login')} className="text-text-secondary text-sm hover:text-text-primary transition-colors">Login</button>
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-medium text-background rounded-lg transition-all hover:shadow-glow-cyan"
              style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', boxShadow: '0 0 20px rgba(0,229,255,0.25)' }}
            >
              Upload RFP
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #00E5FF, transparent)' }} />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-4" style={{ background: 'radial-gradient(circle, #00F5A0, transparent)' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(0,229,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider mb-6" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                BFSI Pursuit Intelligence Platform
              </div>
              <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-tight mb-6 text-text-primary">
                Convert BFSI RFPs into{' '}
                <span style={{ background: 'linear-gradient(135deg, #00E5FF, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Pursuit-Ready Intelligence
                </span>
              </h1>
              <p className="text-text-secondary text-lg leading-relaxed mb-10 max-w-xl">
                ProposalPilot reads complex banking, insurance, NBFC, and capital markets RFPs — then generates a consulting-grade opportunity assessment, risk view, win strategy, and downloadable intelligence brief.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('login')}
                  className="group flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-background transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #FFD166, #FFB020)', boxShadow: '0 0 30px rgba(255,209,102,0.3)' }}
                >
                  Upload RFP
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('brief')}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-text-primary border transition-all hover:border-neon-cyan/50"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
                >
                  View Intelligence Brief
                </button>
              </div>
            </div>

            {/* Right: Brief mockup */}
            <div className="relative animate-slide-up stagger-3">
              <div className="relative" style={{ border: '1px solid rgba(0,229,255,0.35)', borderRadius: '16px', background: '#08111F', boxShadow: '0 0 40px rgba(0,229,255,0.1), 0 0 80px rgba(139,92,246,0.08)' }}>
                <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-text-muted uppercase tracking-wider mb-1">RFP Intelligence Brief</div>
                      <div className="text-text-primary font-semibold text-sm">Digital Lending Transformation RFP</div>
                      <div className="text-text-muted text-xs mt-0.5">Leading Public Sector Bank · Banking</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider" style={{ background: 'rgba(255,209,102,0.1)', border: '1px solid rgba(255,209,102,0.3)', color: '#FFD166' }}>
                      Pursue Selectively
                    </div>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Strategic Fit', value: 'High', color: '#00F5A0' },
                    { label: 'Confidence Score', value: '86%', color: '#00E5FF' },
                    { label: 'Delivery Complexity', value: 'High', color: '#FF4D6D' },
                    { label: 'Integration Risk', value: 'High', color: '#FF4D6D' },
                    { label: 'Commercial Risk', value: 'Medium', color: '#FFB020' },
                    { label: 'Risk Flags', value: '5 identified', color: '#FFB020' },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{item.label}</div>
                      <div className="font-semibold text-sm" style={{ color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <div className="rounded-lg p-3 text-xs text-text-secondary leading-relaxed" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    "Strategically attractive BFSI transformation opportunity — proceed after leadership review of delivery complexity and commercial exposure."
                  </div>
                </div>
                {/* Glow decoration */}
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs text-neon-cyan uppercase tracking-widest mb-3">Platform Capabilities</div>
            <h2 className="font-serif text-4xl font-bold text-text-primary mb-4">Intelligence at every pursuit stage</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">From raw RFP document to structured board-pack in minutes. Four core capabilities that transform how BFSI pursuits are assessed.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <FileText className="w-5 h-5" />,
                title: 'Document Intelligence',
                desc: 'Reads RFP, identifies issuing bank, extracts dates, scope, eligibility criteria, and commercial terms automatically.',
                color: '#00E5FF',
                glow: 'rgba(0,229,255,0.1)'
              },
              {
                icon: <Brain className="w-5 h-5" />,
                title: 'Pursuit Decision Support',
                desc: 'Go/No-Go recommendation, strategic fit scoring, and submission urgency — structured for leadership review.',
                color: '#00F5A0',
                glow: 'rgba(0,245,160,0.08)'
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: 'BFSI Risk Lens',
                desc: 'Flags delivery complexity, commercial exposure, integration risk, and regulatory dependencies specific to BFSI.',
                color: '#FF4D6D',
                glow: 'rgba(255,77,109,0.08)'
              },
              {
                icon: <Download className="w-5 h-5" />,
                title: 'Consulting-Grade Output',
                desc: 'Structured intelligence brief ready for export as PDF board pack or editable Word working document.',
                color: '#FFD166',
                glow: 'rgba(255,209,102,0.08)'
              }
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl p-6 card-hover"
                style={{ background: '#08111F', border: '1px solid rgba(255,255,255,0.06)', boxShadow: `0 0 30px ${item.glow}` }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: `${item.glow}`, border: `1px solid ${item.color}30`, color: item.color }}>
                  {item.icon}
                </div>
                <h3 className="font-semibold text-text-primary mb-2 text-sm">{item.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20" style={{ background: '#08111F' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs text-neon-cyan uppercase tracking-widest mb-3">Coverage</div>
            <h2 className="font-serif text-4xl font-bold text-text-primary mb-4">Designed for BFSI transformation pursuits</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              'PSU bank transformation RFPs',
              'Digital lending RFPs',
              'Core banking modernization',
              'Insurance claims transformation',
              'Payments infrastructure',
              'Regulatory reporting',
              'NBFC process transformation',
              'Capital markets platforms'
            ].map((useCase, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-text-secondary"
                style={{ background: '#0F1B2E', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#00E5FF' }} />
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs text-neon-cyan uppercase tracking-widest mb-3">How It Works</div>
            <h2 className="font-serif text-4xl font-bold text-text-primary">From document to decision in minutes</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            {/* Connector line */}
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px hidden md:block" style={{ background: 'linear-gradient(90deg, rgba(0,229,255,0.3), rgba(139,92,246,0.3), rgba(0,245,160,0.3), rgba(255,209,102,0.3))' }} />
            {[
              { step: '01', label: 'Upload', desc: 'Drop your BFSI RFP PDF. Any size, any complexity.', color: '#00E5FF' },
              { step: '02', label: 'Extract', desc: 'Document intelligence extracts metadata automatically.', color: '#8B5CF6' },
              { step: '03', label: 'Analyze', desc: 'Seven-stage intelligence pipeline builds the brief.', color: '#00F5A0' },
              { step: '04', label: 'Download', desc: 'Export as PDF board pack or Word working document.', color: '#FFD166' },
            ].map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10" style={{ background: '#0F1B2E', border: `2px solid ${s.color}50`, boxShadow: `0 0 20px ${s.color}20` }}>
                  <span className="font-mono font-bold text-sm" style={{ color: s.color }}>{s.step}</span>
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{s.label}</h3>
                <p className="text-text-muted text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,229,255,0.04), rgba(139,92,246,0.04))' }} />
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-serif text-5xl font-bold text-text-primary mb-6">
            Ready to pursue with <span style={{ color: '#FFD166' }}>intelligence</span>?
          </h2>
          <p className="text-text-secondary text-lg mb-10">Upload your BFSI RFP and receive a pursuit-ready intelligence brief in minutes.</p>
          <button
            onClick={() => onNavigate('login')}
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-lg font-semibold text-lg text-background transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', boxShadow: '0 0 40px rgba(0,229,255,0.3)' }}
          >
            Start Analysis
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-neon-cyan" />
            <span className="text-text-muted text-sm">ProposalPilot · BFSI Pursuit Intelligence</span>
          </div>
          <div className="text-text-muted text-xs">© 2026 ProposalPilot. For authorized BFSI pursuit teams only.</div>
        </div>
      </footer>
    </div>
  );
}
