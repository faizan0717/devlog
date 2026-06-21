import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#080808',
          900: '#0f0f0f',
          800: '#161616',
          700: '#1c1c1c',
          600: '#242424',
          500: '#2e2e2e',
        },
        accent: {
          DEFAULT: '#7c6fe0',
          light: '#9d92eb',
          dark: '#5a4fc7',
          muted: 'rgba(124, 111, 224, 0.12)',
        },
        ink: {
          primary: '#f0f0f0',
          secondary: '#a0a0a0',
          tertiary: '#606060',
          disabled: '#404040',
        },
        success: '#4ade80',
        warning: '#fbbf24',
        danger: '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        display: ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        headline: ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        title: ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.6' }],
        caption: ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        label: ['0.75rem', { lineHeight: '1', letterSpacing: '0.06em', fontWeight: '500' }],
      },
      borderRadius: {
        glass: '16px',
        pill: '9999px',
      },
      backdropBlur: {
        glass: '20px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-lg': '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow: '0 0 20px rgba(124, 111, 224, 0.25)',
        'glow-lg': '0 0 40px rgba(124, 111, 224, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-body': '#a0a0a0',
            '--tw-prose-headings': '#f0f0f0',
            '--tw-prose-lead': '#a0a0a0',
            '--tw-prose-links': '#9d92eb',
            '--tw-prose-bold': '#f0f0f0',
            '--tw-prose-counters': '#606060',
            '--tw-prose-bullets': '#606060',
            '--tw-prose-hr': '#1c1c1c',
            '--tw-prose-quotes': '#a0a0a0',
            '--tw-prose-quote-borders': '#7c6fe0',
            '--tw-prose-captions': '#606060',
            '--tw-prose-code': '#f0f0f0',
            '--tw-prose-pre-code': '#f0f0f0',
            '--tw-prose-pre-bg': '#0f0f0f',
            '--tw-prose-th-borders': '#2e2e2e',
            '--tw-prose-td-borders': '#1c1c1c',
          },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
