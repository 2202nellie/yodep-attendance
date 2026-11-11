/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef5ff',
          100: '#d9e9ff',
          200: '#bcd6ff',
          300: '#8ebcff',
          400: '#5a97fc',
          500: '#3474f8',
          600: '#1e55ed',
          700: '#1640da',
          800: '#1836b0',
          900: '#19318b',
          950: '#141f54',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
