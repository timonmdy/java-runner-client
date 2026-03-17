/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        // Deep dark terminal palette
        base: {
          950: '#08090d',
          900: '#0d0f15',
          850: '#11141c',
          800: '#161922',
          700: '#1e2230',
          600: '#262b3d',
        },
        accent: {
          DEFAULT: '#4ade80',  // electric green — Java/terminal brand
          dim:    '#22c55e',
          glow:   '#86efac',
          muted:  '#166534',
        },
        surface: {
          DEFAULT: '#161922',
          raised:  '#1e2230',
          border:  '#262b3d',
          hover:   '#2a3045',
        },
        text: {
          primary:   '#e8eaf2',
          secondary: '#8b91a8',
          muted:     '#4d5369',
          accent:    '#4ade80',
        },
        // Console output colors
        console: {
          info:  '#60a5fa',
          warn:  '#fbbf24',
          error: '#f87171',
          debug: '#a78bfa',
          input: '#4ade80',
        },
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(74, 222, 128, 0.2)',
        'glow':    '0 0 16px rgba(74, 222, 128, 0.25)',
        'glow-lg': '0 0 32px rgba(74, 222, 128, 0.3)',
        'panel':   '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
        'fade-in':      'fadeIn 0.15s ease-out',
        'slide-up':     'slideUp 0.2s ease-out',
        'pulse-dot':    'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        blink:    { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
}
