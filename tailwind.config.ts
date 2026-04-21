import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#020c1b",
          dark: "#020c1b",
          paper: "#0d1b2a",
          surface: "#142433",
        },
        surface: {
          DEFAULT: "#0d1b2a",
          dark: "#020c1b",
        },
        primary: {
          DEFAULT: "#a7dadb",
          foreground: "#020c1b",
        },
        secondary: {
          DEFAULT: "#4f46e5",
          foreground: "#ffffff",
        },
        text: {
          primary: "#e0e0e0",
          secondary: "#b0c5c6",
          disabled: "#7a8a8b",
        },
        foreground: "#e0e0e0",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-lato)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-quicksand)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        'in': 'in 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
