import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark shell palette
        shell: "#0C0C0C",
        surface: "#111111",
        card: "#161616",
        border: "#262626",
        // Text
        "text-primary": "#F0EEE9",
        "text-secondary": "#737373",
        "text-tertiary": "#404040",
        // Accent
        crimson: {
          DEFAULT: "#C0392B",
          hover: "rgba(192, 57, 43, 0.10)",
        },
        // Impact severity
        impact: {
          high: "#C0392B",
          medium: "#D4893A",
          low: "#5A9E6F",
        },
        // Document view (light surface)
        doc: {
          bg: "#F7F6F3",
          text: "#111111",
          "text-secondary": "#5C5C5C",
          accent: "#C0392B",
          border: "#E2E0DB",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        // No radius above 6px per spec
      },
      maxWidth: {
        content: "860px",
        document: "720px",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
