/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Public Sans"', '"Inter"', '"Helvetica Neue"', '"Segoe UI"', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter"', '"Helvetica Neue"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          DEFAULT: '#F2F0EF',
          50: '#faf9f8',
          100: '#f7f5f4',
          200: '#F2F0EF',
        },
        primary: {
          DEFAULT: '#CB550B',
          50: '#faeee7',
          100: '#f5ddce',
          200: '#eabb9d',
          300: '#CB550B',
          400: '#a24409',
          500: '#7A3307',
          600: '#512204',
          700: '#291102',
        },
        brown: {
          DEFAULT: '#7A3307',
          light: '#a24409',
          dark: '#3D1A03',
          deepest: '#291102',
          near: '#2d1a0a',
          black: '#1a0f05',
        },
        body: {
          DEFAULT: '#423F3E',
          muted: '#6e6968',
        },
        neutral: {
          border: '#e2e1e1',
          divider: '#f1f0f0',
        },
        darkband: {
          DEFAULT: '#2d1a0a',
          deep: '#1a0f05',
        },
        charcoal: {
          DEFAULT: '#3a3a3a',
          light: '#4a4a4a',
        },
        success: {
          50: '#f0f5ed',
          100: '#d8e4d0',
          500: '#5a7a4a',
          700: '#3d5a2e',
        },
        warning: {
          50: '#fdf6ed',
          100: '#f5ddce',
          700: '#7A3307',
        },
        danger: {
          50: '#f7ecea',
          100: '#e8d0c8',
          700: '#8a3b2a',
        },
      },
      fontSize: {
        'display-xl': ['80px', { lineHeight: '1.1', letterSpacing: '-0.022em', fontWeight: '700' }],
        'display-lg': ['64px', { lineHeight: '1.2', letterSpacing: '-0.022em', fontWeight: '700' }],
        'display-md': ['48px', { lineHeight: '1.2', letterSpacing: '-0.022em', fontWeight: '600' }],
        'display-sm': ['40px', { lineHeight: '1.2', letterSpacing: '-0.022em', fontWeight: '600' }],
        'h4': ['28px', { lineHeight: '1.3', letterSpacing: '-0.018em', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.55', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', letterSpacing: '0.06em', fontWeight: '500' }],
        'eyebrow': ['12px', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
      },
      transitionDuration: {
        '150': '150ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'brand': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
