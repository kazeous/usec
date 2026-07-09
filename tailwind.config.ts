import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#f7f4ee",
        signal: "#e74d3d",
        mint: "#56b68b",
        cobalt: "#335cba",
        gold: "#d8a531"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(21, 21, 21, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
