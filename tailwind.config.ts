import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0c0a09", // stone-950
        foreground: "#fafaf9", // stone-50
        card: "#1c1917", // stone-900
        accent: {
          DEFAULT: "#f97316", // orange-500
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#10b981", // emerald-500
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444", // red-500
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#292524", // stone-800
          foreground: "#a8a29e", // stone-400
        },
        border: "#292524", // stone-800
      },
      borderRadius: {
        xl: "0.75rem",
        lg: "0.5rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
