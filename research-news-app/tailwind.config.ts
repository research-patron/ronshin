import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#1a73e8",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f1f3f4",
          foreground: "#202124",
        },
        destructive: {
          DEFAULT: "#d93025",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f8f9fa",
          foreground: "#5f6368",
        },
        accent: {
          DEFAULT: "#e8f0fe",
          foreground: "#1967d2",
        },
        ring: "#1a73e8",
        input: "#dadce0",
      },
      fontFamily: {
        newspaper: ["Noto Serif JP", "serif"],
        gothic: ["Noto Sans JP", "sans-serif"],
      },
      writingMode: {
        'vertical-rl': 'vertical-rl',
        'vertical-lr': 'vertical-lr',
      },
    },
  },
  plugins: [],
} satisfies Config;
