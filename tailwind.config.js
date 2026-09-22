/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: '#0B2D5D', brand: '#D7192D', canvas: '#F4F5F7', ink: '#111827',
        muted: '#6B7280', line: '#E5E7EB', success: '#1FA66A', rating: '#F4B400'
      },
      fontFamily: {
        sans: ['Inter_400Regular'], medium: ['Inter_600SemiBold'], display: ['RobotoCondensed_700Bold']
      }
    }
  },
  plugins: []
};
