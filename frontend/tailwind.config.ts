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
        brand: {
          DEFAULT: '#0a1628',
          light: '#1a2a4a',
          lighter: '#2a3a5a',
        },
        cream: {
          50: '#faf9f6',
          100: '#f5f4ef',
          200: '#e8e6dc',
          300: '#d4d0bf',
        },
        accent: {
          DEFAULT: '#c8a87c',
          light: '#dcc8a8',
          dark: '#b09060',
        },
        ink: {
          DEFAULT: '#1a1a1a',
          light: '#6b6b6b',
          lighter: '#9ca3af',
        },
        border: '#e5e3db',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'display-sm': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'hero': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
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
