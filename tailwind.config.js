/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,tsx,jsx}",
    "./src/components/**/*.{js,ts,tsx,jsx}",
    "./src/lib/**/*.{js,ts,tsx,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2c3e50",
        accent: "#3498db",
      }
    },
  },
  plugins: [],
}
