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
        // Shell / navigation
        shell: "#0E0B08",
        sidebar: "#1C1814",
        // Main surface (parchment)
        surface: "#F5F2EC",
        "feed-gap": "#DDD8D0",
        border: "#E2DDD5",
        // Text — used on light surfaces
        "text-primary": "#1C1814",
        "text-secondary": "#6B655C",
        "text-tertiary": "#9E9890",
        "text-muted": "#B5AFA5",
        // Accent — amber
        amber: {
          DEFAULT: "#C4855A",
          dark: "#8B5430",
        },
        // Impact severity
        impact: {
          high: "#B85C5C",
          medium: "#D4893A",
          low: "#7B9E87",
        },
        // Blue / info
        blue: {
          reg: "#6B8CAE",
        },
        // Purple / digests
        purple: {
          reg: "#9B7FC7",
        },
        // Document view (same as main surface)
        doc: {
          bg: "#F5F2EC",
          text: "#1C1814",
          "text-secondary": "#6B655C",
          accent: "#C4855A",
          border: "#E2DDD5",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "5px",
        sm: "4px",
        md: "5px",
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
