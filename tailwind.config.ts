import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        f: {
          bg: '#fafafa',
          surface: '#ffffff',
          surface2: '#f4f4f5',
          border: '#e4e4e7',
          border2: '#d4d4d8',
          t1: '#111827',
          t2: '#374151',
          t3: '#6b7280',
          t4: '#9ca3af',
          accent: '#2563eb',
          'accent-light': '#eff6ff',
          success: '#16a34a',
          warn: '#d97706',
          danger: '#dc2626',
          'canvas-bg': '#fafafa',
          'dot': '#e4e4e7',
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
