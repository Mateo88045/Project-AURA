import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        chronos: {
          dark: '#0A1118',
          light: '#F1FAEE',
          mist: '#A8DADC',
          steel: '#457B9D',
          green: '#7ECFA0',
          'green-light': '#3BA06E',
          amber: '#F4A261',
          red: '#E76F6F',
          'red-light': '#D05050',
          'text-primary': '#F1FAEE',
          'text-secondary': '#8EAFC2',
        },
      },
      borderRadius: {
        hero: '22px',
        card: '14px',
        button: '8px',
      },
      spacing: {
        'screen-px': '28px',
      },
    },
  },
  plugins: [],
} satisfies Config;
