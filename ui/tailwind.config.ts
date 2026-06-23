import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand guide core palette
        chalk:  '#fafaf9',
        paper:  '#ffffff',
        border: '#e5e7eb',
        muted:  '#78716c',

        // Accent: Build Blue
        accent: {
          DEFAULT: '#2563eb',
          light:   '#3b82f6',
          dark:    '#1d4ed8',
          muted:   'rgba(37, 99, 235, 0.10)',
        },

        // Ink — semantic text tokens
        ink: {
          primary:   '#111827',
          secondary: '#4b5563',
          tertiary:  '#6b7280',
          disabled:  '#9ca3af',
        },

        // Mood palette
        mood: {
          building:   '#f97316',
          shipped:    '#22c55e',
          stuck:      '#ef4444',
          learning:   '#60a5fa',
          inspired:   '#c084fc',
          reflecting: '#94a3b8',
        },

        // Dark surface tokens — kept for existing app pages
        surface: {
          950: '#080808',
          900: '#0f0f0f',
          800: '#161616',
          700: '#1c1c1c',
          600: '#242424',
          500: '#2e2e2e',
        },

        success: '#22c55e',
        warning: '#f97316',
        danger:  '#ef4444',
      },
      fontFamily: {
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        display:  ['clamp(52px,7vw,100px)', { lineHeight: '1.01', letterSpacing: '-0.03em' }],
        headline: ['2rem',    { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        title:    ['1.25rem', { lineHeight: '1.3',  letterSpacing: '-0.01em', fontWeight: '600' }],
        body:     ['0.9375rem', { lineHeight: '1.6' }],
        caption:  ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        label:    ['0.75rem',   { lineHeight: '1',   letterSpacing: '0.06em', fontWeight: '500' }],
      },
      borderRadius: {
        glass: '16px',
        pill:  '9999px',
      },
      backdropBlur: {
        glass: '20px',
      },
      boxShadow: {
        glass:    '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-lg':'0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow:     '0 0 20px rgba(37, 99, 235, 0.20)',
        'glow-lg':'0 0 40px rgba(37, 99, 235, 0.30)',
        card:     '0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: {
        invert: {
          css: {
            '--tw-prose-body':         '#a0a0a0',
            '--tw-prose-headings':     '#f0f0f0',
            '--tw-prose-lead':         '#a0a0a0',
            '--tw-prose-links':        '#3b82f6',
            '--tw-prose-bold':         '#f0f0f0',
            '--tw-prose-counters':     '#606060',
            '--tw-prose-bullets':      '#606060',
            '--tw-prose-hr':           '#1c1c1c',
            '--tw-prose-quotes':       '#a0a0a0',
            '--tw-prose-quote-borders':'#2563eb',
            '--tw-prose-captions':     '#606060',
            '--tw-prose-code':         '#f0f0f0',
            '--tw-prose-pre-code':     '#f0f0f0',
            '--tw-prose-pre-bg':       '#0f0f0f',
            '--tw-prose-th-borders':   '#2e2e2e',
            '--tw-prose-td-borders':   '#1c1c1c',
          },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
