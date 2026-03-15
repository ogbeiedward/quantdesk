/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        trading: {
          dark: '#0B0E14',
          panel: '#151924',
          border: '#2A2E39',
          green: '#00C853',
          red: '#FF3D00',
          blue: '#2962FF',
          text: '#D1D4DC',
          muted: '#787B86'
        }
      }
    },
  },
  plugins: [],
}
