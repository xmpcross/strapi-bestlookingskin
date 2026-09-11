import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand blue (Polaris primary tokens).
        // Sandbox demo 25 accent. Kept as a literal here (Tailwind needs a real
        // value at build time) and mirrored by --sb-primary in globals.css.
        primary: {
          /* The text-safe shade of demo 14's leaf green. Tailwind's `primary`
             is used for links and labels, so it carries the 4.58:1 variant;
             the raw accent (#7cb798) lives in --sb-primary for fills. */
          DEFAULT: '#478162',
          emphasis: '#014fd3',
          emphasisHover: '#0072de',
          emphasisPressed: '#0046be',
          highlight: '#0072de',
          highlightHover: '#025ccc',
          highlightPressed: '#014fd3',
          hover: '#cfe9fe',
          pressed: '#9bcffc',
          bg: '#eef8ff',
        },
        secondary: {
          DEFAULT: '#fff6d1',
          emphasis: '#914600',
          hover: '#fff200',
          pressed: '#ffce00',
        },
        success: {
          DEFAULT: '#e5fde5',
          emphasis: '#03721e',
        },
        attention: {
          DEFAULT: '#fff5ec',
          emphasis: '#983e00',
        },
        danger: {
          DEFAULT: '#fff4f3',
          emphasis: '#b00625',
        },
        info: {
          DEFAULT: '#f6f6f7',
          emphasis: '#575d64',
          highlight: '#c7c9cc',
          hover: '#e4e5e8',
          pressed: '#c4c8cf',
        },
        forest: {
          50: '#f0f4ff',
          100: '#e7f4ff',
          200: '#cfe9fe',
          300: '#9bcffc',
          400: '#4ea5f0',
          500: '#0072de',
          600: '#025ccc',
          700: '#014fd3',
          800: '#0046be',
          900: '#092d74',
          950: '#061b46',
        },
        sand: {
          50: '#fffdf0',
          100: '#fff6d1',
          200: '#fff200',
          300: '#ffe200',
          400: '#ffce00',
          500: '#d6aa00',
          600: '#aa8400',
          700: '#7b6000',
          800: '#554200',
          900: '#332800',
        },
        terracotta: {
          500: '#b85812',
          600: '#983e00',
          700: '#7a3100',
        },
        ink: '#07142b',
        paper: '#f5f7fd',
        muted: '#f5f7fd',

        // Surface / default neutrals (Polaris surface + default tokens).
        surface: {
          DEFAULT: '#ffffff',
          muted: '#e4e5e8',
          inverse: '#030303',
          secondary: '#ffe200',
        },
        default: {
          DEFAULT: '#ffffff',
          subdued: '#f3f4f6',
          emphasis: '#141d23',
          hover: '#f6f6f7',
          pressed: '#e4e5e8',
          muted: '#fbfbfb',
        },
      },
      fontFamily: {
        // Inter everywhere. Every token resolves through --font-sans, so the
        // existing font-display / font-outfit / font-urbanist classes in the
        // markup all render Inter and the typeface changes in one place.
        sans:     ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
        jakarta:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
        inter:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
        outfit:   ['var(--font-sans)', 'system-ui', 'sans-serif'],
        urbanist: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        figtree:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
        fraunces: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '70ch',
        // Site-wide content width override. Default Tailwind max-w-7xl is
        // 80rem (1280px); we override it to 1366px so every layout that
        // already uses `max-w-7xl mx-auto` widens without per-file edits.
        '7xl': '1420px',
      },
      borderRadius: {
        '3xl': '1rem',
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    /*
     * `bls` is this site's palette expressed in daisyUI's semantic names, so a
     * daisyUI component lands already wearing the brand: primary is the same
     * #478162 the storefront has always used for links and labels, base-200 is
     * the existing paper grey, neutral is ink. Nothing new is invented here —
     * every value is lifted from theme.extend.colors above, which is what keeps
     * the redesign recognisably the same site rather than a daisyUI demo.
     *
     * `base: false` still holds while the redesign is a pilot: daisyUI's base
     * layer would set html/body colours globally, repainting the 18 pages that
     * have not been converted yet. It comes off in the same change that
     * converts the last page.
     */
    themes: [
      {
        bls: {
          primary: '#478162',
          'primary-content': '#ffffff',
          secondary: '#ffce00',
          'secondary-content': '#332800',
          accent: '#0072de',
          'accent-content': '#ffffff',
          neutral: '#07142b',
          'neutral-content': '#f5f7fd',
          'base-100': '#ffffff',
          'base-200': '#f5f7fd',
          'base-300': '#e4e5e8',
          'base-content': '#07142b',
          info: '#575d64',
          success: '#03721e',
          warning: '#983e00',
          error: '#b00625',
          // Matches the site's existing rounding: borderRadius['3xl'] is 1rem.
          '--rounded-box': '1rem',
          '--rounded-btn': '0.625rem',
          '--rounded-badge': '9999px',
          '--border-btn': '1px',
          '--tab-radius': '0.5rem',
        },
      },
    ],
    base: false,
    logs: false,
  },
} satisfies Config;
