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
      },
      animation: {
        slideUp: "slideUp 0.3s ease-out",
        fadeIn: "fadeIn 0.4s ease-out",
        highlight: "highlight 2s ease-out",
      },
      keyframes: {
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        highlight: {
          "0%": { boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)" },
          "100%": { boxShadow: "0 0 0 2px transparent" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
