/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        // Palette One Piece
        'luffy-red': '#E63946',
        'marine-blue': '#1D3557',
        'gold-treasure': '#F1C40F',
        'emerald-sea': '#2A9D8F',
        'pirate-black': '#1A1A2E',
        'cloud-white': '#F8F9FA',
        // Anciennes couleurs pour compatibilité
        'op-blue': '#1D3557',
        'op-red': '#E63946',
        'op-gold': '#F1C40F',
        'op-purple': '#8B5CF6',
        'rare': {
          'common': '#9CA3AF',
          'uncommon': '#22C55E',
          'rare': '#1D3557',
          'super': '#8B5CF6',
          'secret': '#F1C40F'
        }
      },
      fontFamily: {
        'pirate': ['"Luckiest Guy"', 'cursive'],
        'body': ['Montserrat', 'system-ui', 'sans-serif'],
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0)' },
          '100%': { transform: 'rotateY(180deg)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}