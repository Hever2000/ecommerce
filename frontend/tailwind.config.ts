import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FDFBF7',
          50: '#FDFBF7',
          100: '#F8F5F0',
          200: '#EDE8DF',
          300: '#D4CFC4',
        },
        ink: {
          DEFAULT: '#000000',
          light: '#404040',
          lighter: '#8C8C8C',
        },
        accent: {
          DEFAULT: '#4A0E17',
          light: '#6B1A26',
          dark: '#35060D',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E0C55A',
          dark: '#B8962E',
        },
        border: '#E5E0D6',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['5rem', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-sm': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'hero': ['4.5rem', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'hero-sm': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      spacing: {
        'section': '6rem',
        'section-lg': '10rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(2rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
