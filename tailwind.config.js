/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}', './src/main/shared/**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: '#4ade80',
        'base-950': '#08090d',
        'base-900': '#0d0f14',
        'base-800': '#11141b',
        'surface-raised': '#1a1d26',
        'surface-border': '#242736',
        'text-primary': '#e8eaf2',
        'text-secondary': '#b0b4c8',
        'text-muted': '#6b7094',
        'console-error': '#f87171',
        'console-warn': '#fbbf24',
        'console-input': '#60a5fa',
        'console-system': '#6b7094',
      },
    },
  },
  plugins: [],
};
