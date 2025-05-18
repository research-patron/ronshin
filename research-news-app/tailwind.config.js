/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'mincho': ['"Yu Mincho"', '"YuMincho"', 'serif'],
        'gothic': ['"Hiragino Kaku Gothic ProN"', '"Hiragino Sans"', 'sans-serif']
      },
      colors: {
        'paper': '#f8f6f1',
        'newspaper-header': '#252525',
        'newspaper-gray': '#e5e5e5',
      }
    },
  },
  plugins: [],
}