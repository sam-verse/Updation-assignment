/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f8b217', // major yellow-orange
          light: '#ffe7b2',   // very light yellow-orange for backgrounds
          dark: '#fc4c04',    // strong orange for buttons/accents
        },
        accent: {
          DEFAULT: '#fc4c04', // strong orange
          light: '#ffd8b2',
          dark: '#f8b217',
        },
        black: '#040404',
        gray: {
          DEFAULT: '#8b8b8b',
          light: '#e5e5e5',
          dark: '#444444',
        },
        white: '#fff',
      },
    },
  },
  plugins: [],
};
