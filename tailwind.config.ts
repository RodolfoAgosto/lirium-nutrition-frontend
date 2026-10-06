import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF7",
        surface: "#FFFFFF",
        border: "#E3E8E4",
        foreground: "#263238",
        muted: "#5F6D65",
        primary: { DEFAULT: "#2E7D32", hover: "#1B5E20" },
        accent: "#E9A23B",
        danger: "#C0392B",
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      borderRadius: { DEFAULT: "8px", md: "8px", lg: "8px" },
    },
  },
  plugins: [],
};
export default config;
