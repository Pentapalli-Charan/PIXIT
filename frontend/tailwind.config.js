/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#B0FF00',
        'bg-dark': '#000000',
        'card-dark': '#0B0B0B',
        'border-dark': '#1F1F1F',
        'text-light': '#FFFFFF',
      }
    },
  },
  plugins: [],
}
