export default {
  darkMode: 'class',
  content: [
    './*.html',
    './pages/**/*.html',
    './components/**/*.html',
    './main.js'
  ],
  safelist: [
    'lg:ml-64', 'lg:ml-0', 'lg:left-64', 'lg:left-0',
    'animate-spin', 'text-primary', 'w-4', 'h-4', 'text-gray-400', 'flex-shrink-0',
    'from-primary',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c41e3a',
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca',
          300: '#fca5a5', 400: '#f87171', 500: '#c41e3a',
          600: '#a51d2d', 700: '#8b1a2b', 800: '#6f1726', 900: '#4a0e1a',
        },
        accent: { DEFAULT: '#d4a017' },
        gold: { DEFAULT: '#d4a017', light: '#f0c850', dark: '#b8860b' },
        crimson: { DEFAULT: '#c41e3a', deep: '#8b1a2b', glow: '#e11d48' },
        void: { DEFAULT: '#0a0a0f', card: '#111118', edge: '#1a1a24' },
        glass: {
          light: 'rgba(255,255,255,0.7)',
          dark: 'rgba(17,24,39,0.6)',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 20px rgba(196,30,58,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(196,30,58,0.6)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      }
    }
  },
  plugins: []
}
