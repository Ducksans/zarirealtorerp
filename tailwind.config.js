/**
 * Tailwind CSS configuration for the ERP system.
 * Mirrors the Google Docs dark theme and uses Google Sans / Noto Sans KR.
 */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Support dark mode toggling if needed
  theme: {
    extend: {
      colors: {
        surface: '#0d1117', // dark background
        border: '#30363d',
        accent: '#8ab4f8', // Google blue accent
        muted: '#64748b',
        subtle: '#94a3b8',
      },
      fontFamily: {
        sans: ['"Google Sans"', '"Noto Sans KR"', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
