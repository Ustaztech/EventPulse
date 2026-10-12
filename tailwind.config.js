/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B132B',
          light: '#1C2541',
          dark: '#070B19',
          card: '#16203B'
        },
        royal: {
          DEFAULT: '#1D4ED8',
          hover: '#1E40AF',
          light: '#3B82F6'
        },
        teal: {
          DEFAULT: '#0D9488',
          accent: '#14B8A6',
          light: '#CCFBF1'
        },
        turquoise: {
          DEFAULT: '#06B6D4',
          accent: '#2DD4BF',
          glow: '#A5F3FC'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glow': '0 0 20px rgba(6, 182, 212, 0.35)',
        'glow-royal': '0 0 20px rgba(29, 78, 216, 0.35)',
      }
    },
  },
  plugins: [],
};
