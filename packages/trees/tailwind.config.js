/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      transitionDelay: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
      transitionDuration: {
        '3000': '3000ms',
      },
    },
  },
  plugins: [],
}
