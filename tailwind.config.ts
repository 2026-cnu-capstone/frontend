import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        f: {
          bg: 'var(--f-bg)',
          surface: 'var(--f-surface)',
          surface2: 'var(--f-surface2)',
          border: 'var(--f-border)',
          border2: 'var(--f-border2)',
          t1: 'var(--f-t1)',
          t2: 'var(--f-t2)',
          t3: 'var(--f-t3)',
          t4: 'var(--f-t4)',
          accent: 'var(--f-accent)',
          'accent-light': 'var(--f-accent-light)',
          success: 'var(--f-success)',
          warn: 'var(--f-warn)',
          danger: 'var(--f-danger)',
          'canvas-bg': 'var(--f-canvas-bg)',
          'dot': 'var(--f-dot)',
          'invert-bg': 'var(--f-invert-bg)',
          'invert-bg-hover': 'var(--f-invert-bg-hover)',
          'invert-fg': 'var(--f-invert-fg)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '"Pretendard Variable"',
          'Pretendard',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      boxShadow: {
        flat: '0 1px 2px rgba(17, 24, 39, 0.04)',
        modal: '0 4px 16px -2px rgba(17, 24, 39, 0.08), 0 2px 4px rgba(17, 24, 39, 0.04)',
        popover: '0 2px 8px rgba(17, 24, 39, 0.06)',
      },
      keyframes: {
        pulse2: {
          '0%': { opacity: '0.3', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1.15)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        pulse2: 'pulse2 0.8s ease-in-out infinite alternate',
        pulse2d: 'pulse2 0.95s ease-in-out infinite alternate',
        pulse2e: 'pulse2 1.1s ease-in-out infinite alternate',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
