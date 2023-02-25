/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}","./public/index.html"],
  theme: {
    extend: {
      colors: {
        black: "#1e1e1e",
        blue: "#7bcefa",
        green: "#2e8555",
        "green-light": "#4aa172",
        "green-bright": "#52dc90",
        background: "#ffffff",
        foreground: "#1e1e1e",
        inset: "#313131",
        outset: "#3f3e3e",
        "inset-border": "#3e3e3e",
        danger: "#bf5a5a",
        ticket: "#d6a241",
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
