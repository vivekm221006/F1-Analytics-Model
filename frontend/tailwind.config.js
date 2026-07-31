/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#05060A",
        panel: "#0B0E16",
        "panel-2": "#10141F",
        cyan: {
          DEFAULT: "#00E5C9",
          dim: "#00897A",
          glow: "rgba(0, 229, 201, 0.5)",
        },
        race: {
          red: "#FF2D55",
        },
        ink: {
          hi: "#E8EAED",
          mid: "#9298A6",
          lo: "#5B6270",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      animation: {
        "pulse-dot": "pulse-dot 2.4s ease-in-out infinite",
        "scroll-trace": "scroll-trace 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "scroll-trace": {
          "0%": { transform: "translateY(-14px)" },
          "50%": { transform: "translateY(40px)" },
          "100%": { transform: "translateY(-14px)" },
        },
      },
    },
  },
  plugins: [],
};
