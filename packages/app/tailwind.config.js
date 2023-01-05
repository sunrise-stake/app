/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        lightgreen: '#a4c0af',
        green: '#7BB692'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}
