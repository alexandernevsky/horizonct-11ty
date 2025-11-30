module.exports = {
  content: [
    "./src/**/*.{html,njk,md,js}",
    "./src/_includes/**/*.{html,njk}",
    "./src/_data/**/*.{yaml,yml,json}",
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {},
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
