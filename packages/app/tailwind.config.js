/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#181818",
        inset: "#313131",
        outset: "#3f3e3e",
        "inset-border": "#3e3e3e",
        green: "#2e8555",
        "green-light": "#4aa172",
        "green-bright": "#52dc90",
        blue: "#7bcefa",
        danger: "#bf5a5a",
        ticket: "#d6a241",
        textColor: "#ffffff",
        warning: "f9c23c",
      },
      fontFamily: {
        sans: ['"Open Sans"', defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
