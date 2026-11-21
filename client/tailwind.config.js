/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: { colors: { ink: "#101b26", panel: "#172633", gold: "#c7a56a", mist: "#eef1ed", muted: "#87949b" }, fontFamily: { sans: ["DM Sans", "sans-serif"], display: ["Manrope", "sans-serif"] } } },
  plugins: []
};