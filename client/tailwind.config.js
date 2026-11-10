/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#0b0e18',
          secondary: '#111520',
          card:      '#161d2e',
          border:    '#1e2a3d',
          hover:     '#1a2235',
        },
        accent: {
          DEFAULT: '#4f7dff',
          hover:   '#3d6bee',
          muted:   '#2a3f7a',
          soft:    'rgba(79,125,255,0.12)',
        },
        brand: {
          purple: '#8b5cf6',
          teal:   '#14b8a6',
          amber:  '#f59e0b',
          rose:   '#f43f5e',
          green:  '#22c55e',
        },
        text: {
          primary:   '#e8ecf4',
          secondary: '#a8b4cc',
          muted:     '#5a6a85',
          dim:       '#3d4f6a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow':'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                        to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      boxShadow: {
        card:  '0 2px 16px rgba(0,0,0,0.4)',
        glow:  '0 0 20px rgba(79,125,255,0.15)',
        'glow-lg': '0 0 40px rgba(79,125,255,0.2)',
      },
    },
  },
  plugins: [],
};
