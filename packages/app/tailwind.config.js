/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        green: '#a4c0af',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}
