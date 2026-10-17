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
          950: '#f8fafc',
          900: '#ffffff',
          850: '#ffffff',
          800: '#f1f5f9',
          750: '#e2e8f0',
          700: '#cbd5e1',
          600: '#94a3b8',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          accent: '#3b82f6',
          cyan: '#0284c7',
          emerald: '#059669',
          amber: '#d97706',
        },
        gst: {
          navy: '#0f294a',
          blue: '#1b4b8a',
          sky: '#eff6ff',
          badge: '#f1f5f9',
          border: '#cbd5e1',
          text: '#0f172a',
          muted: '#475569',
        },
        gold: {
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          glow: '#fbbf2415',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['DM Serif Display', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-medium': 'float 5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'spin-slow': 'spin 15s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(3deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'blur(20px)' },
          '50%': { opacity: '0.8', filter: 'blur(30px)' },
        }
      }
    },
  },
  plugins: [],
}
