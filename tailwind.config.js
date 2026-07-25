module.exports = {
  darkMode: 'class',
  content: ['./*.html', './**/*.html'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1F3A',
          950: '#050E1F',
          800: '#003380',
        },
        gold: {
          500: '#F59E0B',
          600: '#D97706',
          400: '#FBBF24',
          100: '#FEF3C7',
        },
        stone: {
          50: '#F8FAFC',
          900: '#0F172A',
          600: '#475569',
          100: '#F1F5F9',
        },
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        body: ['Lora', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in-left': 'fadeInLeft 0.8s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(245, 158, 11, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
