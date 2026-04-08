// Tailwind v4 ships its own PostCSS plugin and has built-in vendor prefixing
// (autoprefixer is no longer needed).
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
