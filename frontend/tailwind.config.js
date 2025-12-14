/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // Dark mode base
        surface: "#18181b",    // Card background
        primary: "#3b82f6",    // Blue accent
        success: "#22c55e",
      }
    },
  },
  plugins: [],
}