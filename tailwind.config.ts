import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          ink: "#101418",
          panel: "#171d23",
          glass: "#202932",
          lime: "#a8f04f",
          cyan: "#4fd9ff",
          amber: "#ffc857",
          danger: "#ff5a6a",
        },
      },
      boxShadow: {
        device: "0 28px 80px rgba(6, 10, 16, 0.36)",
      },
    },
  },
  plugins: [],
};

export default config;
