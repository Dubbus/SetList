/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d4a017',
          600: '#b7860d',
          700: '#92660a',
          800: '#6b4a07',
          900: '#4a3305',
        },
        maroon: {
          50: '#fdf2f2',
          100: '#fce4e4',
          200: '#f5c6c6',
          300: '#e89696',
          400: '#d45f5f',
          500: '#8b1a1a',
          600: '#7a1515',
          700: '#621010',
          800: '#4a0c0c',
          900: '#330808',
        },
        ivory: {
          50: '#fdfcf7',
          100: '#faf8f0',
          200: '#f5f0e0',
          300: '#ede5cc',
          400: '#e0d4b0',
          500: '#cfc09a',
        },
      },
      fontFamily: {
        heading: ['Georgia', 'Cambria', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
