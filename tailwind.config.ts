import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F3E8CE",
          card: "#FBF4E4",
          card2: "#F7EEDA",
        },
        ink: {
          DEFAULT: "#3E3226",
          soft: "#7A6B58",
        },
        accent: {
          DEFAULT: "#B23A2E",
          deep: "#8F2C22",
        },
        highlight: "#F0C24E",
      },
      fontFamily: {
        display: ["var(--font-gaegu)", "sans-serif"],
        body: ["var(--font-noto)", "sans-serif"],
      },
      borderRadius: {
        xl2: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
