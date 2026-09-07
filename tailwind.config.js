/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        inox: {
          light: 'var(--color-inox-light)',
          DEFAULT: 'var(--color-inox-base)',
          dark: 'var(--color-inox-dark)',
          border: 'var(--color-inox-border)',
        },
        cart: {
          wood: 'var(--color-cart-wood)',
          dark: 'var(--color-cart-wood-dark)',
          awning: 'var(--color-cart-awning)',
          accent: 'var(--color-cart-awning-accent)',
        },
        board: {
          bg: 'var(--color-board-bg)',
          text: 'var(--color-board-text)',
          border: 'var(--color-board-border)',
        },
        street: {
          bg: 'var(--color-street-bg)',
          amber: 'var(--color-street-amber)',
        },
        sauce: {
          chili: 'var(--color-sauce-chili)',
          black: 'var(--color-sauce-black)',
          mayo: 'var(--color-sauce-mayo)',
        },
        fried: {
          golden: 'var(--color-fried-golden)',
          crispy: 'var(--color-fried-crispy)',
          over: 'var(--color-fried-over)',
        },
      },
      borderRadius: {
        tactile: '6px',
        plate: '10px',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
