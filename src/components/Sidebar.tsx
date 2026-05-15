import { Brain, LayoutDashboard, Upload, FileText, Download, Settings, Zap } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload RFP', icon: Upload },
  { id: 'analyzer', label: 'RFP Analyzer', icon: Zap },
  { id: 'briefs', label: 'Intelligence Briefs', icon: FileText },
  { id: 'exports', label: 'Export History', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="w-56 flex-shrink-0 flex flex-col h-screen sticky top-0" style={{ background: '#08111F', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)' }}>
            <Brain className="w-4 h-4 text-neon-cyan" />
          </div>
          <div>
            <div className="font-serif font-semibold text-text-primary text-sm leading-none">ProposalPilot</div>
            <div className="text-[9px] text-text-muted uppercase tracking-widest leading-none mt-1">BFSI RFP Analyzer</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => {
          const isActive = currentPage === item.id || (currentPage === 'brief' && item.id === 'briefs');
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id === 'briefs' ? 'brief' : item.id === 'exports' ? 'workspace' : item.id === 'analyzer' ? 'analyzer' : item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left"
              style={{
                background: isActive ? 'rgba(0,229,255,0.08)' : 'transparent',
                color: isActive ? '#00E5FF' : '#9CAEC4',
                border: isActive ? '1px solid rgba(0,229,255,0.15)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#F5F9FF'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CAEC4'; } }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: 'rgba(0,229,255,0.15)', color: '#00E5FF' }}>P</div>
          <div>
            <div className="text-xs text-text-primary font-medium">Pursuit Lead</div>
            <div className="text-[10px] text-text-muted">BFSI Practice</div>
          </div>
        </div>
      </div>
    </div>
  );
}
