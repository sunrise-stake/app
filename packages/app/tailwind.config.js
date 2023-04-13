/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}","./public/index.html"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        black: "#1e1e1e",
        blue: "#7bcefa",
        green: "#145D3E",
        "green-light": "#238358",
        "green-bright": "#52DC90",
        grey: "#F2F2F2",
        "grey-dark": "#262626",
        "grey-medium": "#3E3E3E",
        orange: "#D6A241",
        yellow: "#FFD660",
        background: "#ffffff",
        foreground: "#3E3E3E",
        inset: "#262626",
        outset: "#3f3e3e",
        "inset-border": "#3e3e3e",
        danger: "#bf5a5a",
        ticket: "#D6A241",
        warning: "#D6A241",
        "button-disabled": "#145D3E",
        "button": "#238358"
      },
      fontFamily: {
        sans: ['"Inter var, sans-serif"', defaultTheme.fontFamily.sans],
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
