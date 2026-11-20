/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        juice: {
          orange: "#F97316",
          lime: "#84CC16",
          cream: "#FFF8F0",
          bark: "#1C1917",
        },
      },
      boxShadow: {
        card: "0 8px 24px rgba(249, 115, 22, 0.08)",
        bar: "0 -8px 24px rgba(28, 25, 23, 0.08)",
      },
    },
  },
  plugins: [],
};
