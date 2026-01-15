/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Tailwind v3+ için safelist yerine content kullanılıyor
  // Production build'de otomatik olarak kullanılmayan CSS kaldırılır
}
