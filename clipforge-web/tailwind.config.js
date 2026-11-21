/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#000000',
          surface: '#0A0A0A',
          card: '#141414',
          secondary: '#1C1C1C',
          border: '#2A2A2A',
          text: '#FFFFFF',
          muted: '#A1A1AA',
        },
        light: {
          bg: '#F9FAFB',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          secondary: '#F3F4F6',
          border: '#E5E7EB',
          text: '#18181B',
          muted: '#71717A',
        },
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
