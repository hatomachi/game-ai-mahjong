/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mahjong: {
          green: '#1a472a',
          table: '#22543d',
          tile: '#faf6ee',
          tileback: '#1e3a8a',
          dark: '#0f172a',
        }
      }
    },
  },
  plugins: [],
}
