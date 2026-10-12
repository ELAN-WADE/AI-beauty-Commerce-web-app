/** @type {import('tailwindcss').Config} */
// VERBATIM theme copy of root tailwind.config.js (zero UI drift).
// Only `content` globs were retargeted to backend/src (incl. storefront/).
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/storefront/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        desla: {
          champagne: '#F3EEE3',
          olive: '#263127',
          canvas: '#FFFFFF',
          surface: '#FAF9F6',
          elevated: '#F3F4F6',
          card: '#FFFFFF',
          img: '#F6F5F2',
          black: '#0F0F10',
          charcoal: '#0F0F10',
          'charcoal-light': '#2D2A26',
          gold: '#D4AF37',
          'gold-light': '#FBF5E8',
          'gold-dark': '#997A2E',
          'gold-muted': '#B38F39',
          border: '#E5E7EB',
          'border-gold': 'rgba(212, 175, 55, 0.25)',
          'border-strong': 'rgba(212, 175, 55, 0.45)',
          text: '#0F0F10',
          muted: '#6B7280',
          'muted-light': '#9CA3AF',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
        },
        glowly: {
          primary: '#D4AF37',
          'primary-hover': '#C29B2D',
          'primary-dark': '#997A2E',
          secondary: '#B89628',
          accent: '#FBF5E8',
          'accent-light': '#FFFDF7',
          'accent-muted': '#F3ECE0',
          surface: '#FAF9F6',
          card: '#FFFFFF',
          charcoal: '#0F0F10',
          muted: '#6B7280',
          'muted-light': '#9CA3AF',
          border: '#E5E7EB',
          'border-subtle': '#F3F4F6',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
          gold: '#D4AF37',
        }
      },
      fontFamily: {
        sans: ['miui', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '".SFNSText-Regular"', 'Helvetica', 'Arial', 'sans-serif'],
        heading: ['miui', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '".SFNSText-Regular"', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['miui', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '".SFNSText-Regular"', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['miui', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '".SFNSText-Regular"', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['miui', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '".SFNSText-Regular"', 'Helvetica', 'Arial', 'sans-serif'],
        price: ['miui', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '".SFNSText-Regular"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['miui', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '".SFNSText-Regular"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontWeight: {
        hairline: '100',
        thin: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '600',
        extrabold: '600',
        black: '600',
      },
      borderRadius: {
        'btn': '14px',
        'card': '18px',
        'hero': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(212, 175, 55, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
        'float': '0 10px 30px -4px rgba(212, 175, 55, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.6)',
        'sheet': '0 -10px 40px -5px rgba(0, 0, 0, 0.8)',
        'glow': '0 0 24px rgba(212, 175, 55, 0.3)',
        'gold-inner': 'inset 0 1px 0 rgba(246, 231, 193, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan 2.5s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(-100%)', opacity: '0.2' },
          '50%': { transform: 'translateY(100%)', opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
