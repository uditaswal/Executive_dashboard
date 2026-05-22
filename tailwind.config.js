/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        page: "#F5F6FA",
        surface: "#FFFFFF",
        sidebar: "#0F172A",
        accent: {
          blue: "#2563EB",
          red: "#DC2626",
          green: "#16A34A",
          orange: "#EA580C",
          purple: "#7C3AED"
        },
        text: {
          primary: "#0F172A",
          muted: "#64748B"
        },
        border: "#E2E8F0",
      },
      boxShadow: {
        panel: "0 10px 30px rgba(15, 23, 42, 0.06)",
        float: "0 18px 50px rgba(15, 23, 42, 0.10)"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};