/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cuero: {
          DEFAULT: "#8B5E3C", // Marrón cuero
          light: "#A97456",
          dark: "#5C3A24",
        },
        pastel: {
          beige: "#FDF6EC",
          rose: "#F9E0D9",
          green: "#D8E2DC",
          blue: "#CCE3F2",
        },
        accent: {
          DEFAULT: "#E07A5F", // Terracota suave
          dark: "#B85C3A",
        },
      },
      fontFamily: {
        sans: ["'Open Sans'", "sans-serif"],
        serif: ["'Playfair Display'", "serif"],
      },
    },
  },
  plugins: [],
};
