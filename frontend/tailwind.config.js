/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0A66C2',
          dark: '#004182',
          light: '#EAF3FF',
          subtle: '#F3F8FD',
        },
        ink: {
          DEFAULT: '#172B4D',
          2: '#5E6C84',
          3: '#8993A4',
          4: '#AAB8C8',
          soft: '#5E6C84',
          muted: '#8993A4',
          faint: '#AAB8C8',
        },
        line: { DEFAULT: '#E1E5EB', soft: '#EDF0F5' },
        canvas: '#F7F9FC',
        page: '#F7F9FC',
        ok: { DEFAULT: '#057642', bg: '#E8F5EE', soft: '#E8F5EE' },
        warn: { DEFAULT: '#B54708', bg: '#FFF4E5', soft: '#FFF4E5' },
        bad: { DEFAULT: '#D92D20', soft: '#FEF0F0' },
        err: { DEFAULT: '#D92D20', bg: '#FEF0F0' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'page-title': ['26px', { lineHeight: '1.3', fontWeight: '700' }],
        'section': ['19px', { lineHeight: '1.35', fontWeight: '600' }],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
