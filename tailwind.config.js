import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#0f766e',
          light: '#14b8a6',
          dark: '#0f514b',
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
