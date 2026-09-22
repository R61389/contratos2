import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: "#141414", // negro principal
          dark: "#444444", // gris oscuro
          mid: "#979797", // gris medio
          light: "#D6D6D6", // gris claro
        },
        volt: {
          DEFAULT: "#E2E800", // color de acento
          foreground: "#141414",
        },
        border: "rgba(214, 214, 214, 0.12)",
        background: "#141414",
        foreground: "#D6D6D6",
        card: "rgba(68, 68, 68, 0.16)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-geist)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px 4px rgba(226, 232, 0, 0.35)",
        "glow-lg": "0 0 60px 12px rgba(226, 232, 0, 0.25)",
        card: "0 8px 40px -12px rgba(0, 0, 0, 0.6)",
      },
      backgroundImage: {
        "radial-fade":
          "radial-gradient(60% 60% at 50% 0%, rgba(226,232,0,0.10) 0%, rgba(20,20,20,0) 70%)",
        "grid-glow":
          "linear-gradient(to bottom, rgba(214,214,214,0.06) 1px, transparent 1px), linear-gradient(to right, rgba(214,214,214,0.06) 1px, transparent 1px)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
