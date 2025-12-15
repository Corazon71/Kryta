/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'], // Suggest installing this font later
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        background: "#050505", // Deep Void Black
        surface: "#0f0f11",    // Slightly lighter black
        primary: "#7c3aed",    // Electric Violet (The Daemon Core)
        accent: "#10b981",     // Terminal Green (Success)
        glass: "rgba(255, 255, 255, 0.03)",
        border: "rgba(255, 255, 255, 0.08)",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}