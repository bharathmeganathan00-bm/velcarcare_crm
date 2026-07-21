/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // VELCARCARE brand system
        brand: {
          red: '#E11D2A',
          redDark: '#B3141F',
          redLight: '#FCE9EA',
          charcoal: '#1E2530',
          charcoalLight: '#2A323F',
          ink: '#0F1520',
        },
        // Semantic status colors
        status: {
          success: '#16A34A',
          successBg: '#DCFCE7',
          warning: '#F59E0B',
          warningBg: '#FEF3C7',
          info: '#2563EB',
          infoBg: '#DBEAFE',
          danger: '#DC2626',
          dangerBg: '#FEE2E2',
          low: '#CA8A04',
          lowBg: '#FEF9C3',
        },
        // Neutral surfaces
        surface: {
          page: '#F5F6F8',
          card: '#FFFFFF',
          muted: '#F1F3F5',
          border: '#E5E7EB',
        },
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,21,32,0.06), 0 1px 2px rgba(16,21,32,0.04)',
        cardHover: '0 8px 24px rgba(16,21,32,0.10), 0 2px 6px rgba(16,21,32,0.06)',
        float: '0 12px 32px rgba(16,21,32,0.16)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
