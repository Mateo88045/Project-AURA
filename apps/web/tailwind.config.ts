import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A1118',
        'bg-card': '#0e1a25',
        mist: '#A8DADC',
        steel: '#457B9D',
        'steel-deep': '#325c78',
        primary: '#F1FAEE',
        secondary: '#8EAFC2',
        muted2: '#4f6b80',
      },
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
