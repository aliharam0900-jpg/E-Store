import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
        "4k": "2560px",
      },
    },
    extend: {
      // Bespoke, high-contrast, professional palette with strict removal of generic blue/purple defaults
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Fluid typography scale (responsive from 320px mobile to 4K displays)
      fontSize: {
        "fluid-xs": "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
        "fluid-sm": "clamp(0.875rem, 0.8rem + 0.35vw, 1rem)",
        "fluid-base": "clamp(1rem, 0.95rem + 0.4vw, 1.25rem)",
        "fluid-lg": "clamp(1.125rem, 1.05rem + 0.6vw, 1.5rem)",
        "fluid-xl": "clamp(1.25rem, 1.15rem + 0.9vw, 1.875rem)",
        "fluid-2xl": "clamp(1.5rem, 1.35rem + 1.4vw, 2.5rem)",
        "fluid-3xl": "clamp(1.875rem, 1.65rem + 2vw, 3.25rem)",
        "fluid-4xl": "clamp(2.25rem, 1.95rem + 2.8vw, 4.25rem)",
        "fluid-5xl": "clamp(2.75rem, 2.3rem + 3.8vw, 5.5rem)",
        "fluid-hero": "clamp(3.25rem, 2.6rem + 5vw, 7.5rem)",
      },
      screens: {
        xs: "320px",
        "3xl": "1920px",
        "4k": "2560px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
