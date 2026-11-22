/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        moss: {
          DEFAULT: '#1F3D2B',
          dark: '#14291D',
          light: '#2B543B',
          50: '#F2F7F4',
          100: '#E1EDE6',
          200: '#C3DCCE',
          800: '#1F3D2B',
          900: '#14291D',
        },
        deepMoss: '#1F3D2B',
        fern: {
          DEFAULT: '#3E7B52',
          dark: '#306040',
          light: '#529668',
        },
        sageMist: {
          DEFAULT: '#C9D8C5',
          light: '#E2EBE0',
          dark: '#AEC4A8',
        },
        oatCream: {
          DEFAULT: '#F5F1E6',
          light: '#FCFAF6',
          dark: '#ECE5D4',
        },
        terracotta: {
          DEFAULT: '#C8693F',
          dark: '#A65330',
          light: '#D98561',
        },
        bark: {
          DEFAULT: '#3B2F2A',
          light: '#594740',
          muted: '#736159',
        },
        paleLime: {
          DEFAULT: '#E4EDB8',
          light: '#F0F6D5',
          dark: '#CCD895',
        },
        // Backwards compatibility aliases for existing components being refactored
        botanical: {
          forest: '#1F3D2B',
          forestDark: '#14291D',
          forestLight: '#3E7B52',
          sage: '#C9D8C5',
          sageLight: '#E2EBE0',
          cream: '#F5F1E6',
          creamDark: '#ECE5D4',
          mint: '#E4EDB8',
          mintLight: '#F0F6D5',
          amber: '#C8693F',
          amberLight: '#FCFAF6',
          coral: '#C8693F',
          coralLight: '#FCFAF6',
        },
        brand: {
          dark: '#1F3D2B',
          darker: '#14291D',
          light: '#F5F1E6',
          subtle: '#E2EBE0',
          accent: '#C8693F',
          hover: '#14291D',
          badge: '#E4EDB8',
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(31, 61, 43, 0.04), 0 1px 3px rgba(31, 61, 43, 0.02)',
        'card': '0 4px 20px -2px rgba(31, 61, 43, 0.06), 0 2px 6px -1px rgba(31, 61, 43, 0.02)',
        'lifted': '0 12px 30px -4px rgba(31, 61, 43, 0.10), 0 4px 12px -2px rgba(31, 61, 43, 0.04)',
        'botanical-sm': '0 2px 8px rgba(31, 61, 43, 0.04)',
        'botanical': '0 4px 16px rgba(31, 61, 43, 0.06)',
        'botanical-lg': '0 12px 30px rgba(31, 61, 43, 0.10)',
      }
    },
  },
  plugins: [],
}
