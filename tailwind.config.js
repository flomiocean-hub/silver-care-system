/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1a6b4a', light: '#2d9e6b' },
        warning: '#f59e0b',
        danger: '#ef4444',
        surface: '#f8faf9',
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'sans-serif'],
        display: ['"Noto Serif TC"', 'serif'],
      },
    },
  },
  plugins: [],
}
