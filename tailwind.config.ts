import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Helvetica", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "tl-accent": "var(--tl-accent)",
        "tl-accent-deep": "var(--tl-accent-deep)",
        "tl-accent-light": "var(--tl-accent-light)",
        "tl-gold": "var(--tl-gold)",
        "tl-gold-secondary": "var(--tl-gold-secondary)",
        "tl-blue": "var(--tl-blue)",
        "tl-blue-soft": "var(--tl-blue-soft)",
        "tl-dark": "var(--tl-dark)",
        "tl-nebula": "var(--tl-nebula)",
      },
    },
  },
  plugins: [],
};
export default config;
