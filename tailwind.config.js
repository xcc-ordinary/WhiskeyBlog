/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", '"Noto Sans SC"', "sans-serif"],
        serif: ["Lora", '"Noto Serif SC"', "serif"],
      },
    },
  },
};
