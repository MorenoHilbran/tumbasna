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
        sans: ["'Plus Jakarta Sans'", "Poppins", "sans-serif"],
        serif: ["'Playfair Display'", "Georgia", "serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        brand: {
          primary: "#1F3826",
          secondary: "#7FBB54",
          orange: "#EB9728",
          blue: "#697EE8",
        },
      },
      boxShadow: {
        "brand-sm": "0 2px 12px rgba(31, 56, 38, 0.08)",
        "brand-md": "0 4px 24px rgba(31, 56, 38, 0.12)",
        "brand-lg": "0 8px 40px rgba(31, 56, 38, 0.15)",
        "orange-glow": "0 4px 20px rgba(235, 151, 40, 0.25)",
        "green-glow": "0 4px 20px rgba(127, 187, 84, 0.25)",
        "blue-glow": "0 4px 20px rgba(105, 126, 232, 0.25)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #1F3826 0%, #2D5038 100%)",
        "green-gradient": "linear-gradient(135deg, #7FBB54 0%, #5E9C36 100%)",
        "orange-gradient": "linear-gradient(135deg, #EB9728 0%, #D4821A 100%)",
        "blue-gradient": "linear-gradient(135deg, #697EE8 0%, #4C5DD4 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
