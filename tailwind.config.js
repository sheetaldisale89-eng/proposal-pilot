/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#030712',
        'surface-primary': '#08111F',
        'surface-secondary': '#0F1B2E',
        card: '#121F33',
        'text-primary': '#F5F9FF',
        'text-secondary': '#9CAEC4',
        'text-muted': '#64748B',
        'neon-cyan': '#00E5FF',
        'neon-violet': '#8B5CF6',
        'neon-mint': '#00F5A0',
        'neon-coral': '#FF4D6D',
        'neon-amber': '#FFB020',
        'liquid-gold': '#FFD166',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0,229,255,0.18), 0 0 40px rgba(0,229,255,0.08)',
        'glow-violet': '0 0 20px rgba(139,92,246,0.18), 0 0 40px rgba(139,92,246,0.08)',
        'glow-mint': '0 0 20px rgba(0,245,160,0.18)',
        'glow-coral': '0 0 20px rgba(255,77,109,0.18)',
        'glow-gold': '0 0 20px rgba(255,209,102,0.2)',
      },
      borderColor: {
        'soft': 'rgba(255,255,255,0.08)',
        'cyan': 'rgba(0,229,255,0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'progress': 'progress 1.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,229,255,0.18)' },
          '50%': { boxShadow: '0 0 40px rgba(0,229,255,0.35)' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
  plugins: [],
};
