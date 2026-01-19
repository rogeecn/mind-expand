import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F9F9F7",
        ink: "#121212"
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"]
      },
      boxShadow: {
        editorial: "0 2px 0 0 rgba(0,0,0,1)"
      }
    }
  },
  plugins: []
};

export default config;
