const {theme: sanityDemoTheme} = require('@sanity/demo/tailwind')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './intro-template/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Pull ONLY the typography customization from @sanity/demo. We
      // intentionally drop its spacing override (1–9 → custom Fibonacci-ish
      // values) because it inflates shadcn's `size-8` to 136px and breaks
      // every component that relies on the standard Tailwind 4×N scale.
      typography: sanityDemoTheme.extend?.typography,
    },
    // Overriding fontFamily to use @next/font loaded families
    fontFamily: {
      mono: 'var(--font-mono)',
      sans: 'var(--font-sans)',
      serif: 'var(--font-serif)',
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
