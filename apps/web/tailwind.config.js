/**
 * Bellor Design System - Tailwind CSS Configuration
 * ==================================================
 *
 * Extends Tailwind CSS with Bellor design tokens.
 * Based on Figma design system (Bellor-Mui).
 *
 * @version 1.0.0
 * @author Claude Code
 * @license MIT
 * @see https://tailwindcss.com/docs/configuration
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  /**
   * Dark mode configuration
   * Using 'class' strategy for manual control via ThemeProvider
   */
  darkMode: ["class"],

  /**
   * Content paths for purging unused styles
   */
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],

  /**
   * Theme configuration
   * Extends default Tailwind with Bellor design tokens
   */
  theme: {
    /**
     * Container configuration
     */
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },

    /**
     * Theme extensions
     */
    extend: {
      /**
       * Color palette
       * Uses CSS variables for dynamic theming
       */
      colors: {
        // Semantic colors (mapped to CSS variables)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          // Extended primary scale
          50: "hsl(355 100% 97%)",
          100: "hsl(355 100% 94%)",
          200: "hsl(353 96% 86%)",
          300: "hsl(353 96% 76%)",
          400: "hsl(351 95% 64%)",
          500: "hsl(349 89% 55%)",
          600: "hsl(346 84% 46%)",
          700: "hsl(345 83% 38%)",
          800: "hsl(343 80% 32%)",
          900: "hsl(341 76% 27%)",
          950: "hsl(339 84% 15%)",
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          // Extended secondary scale (purple)
          50: "hsl(270 100% 98%)",
          100: "hsl(269 100% 95%)",
          200: "hsl(269 100% 92%)",
          300: "hsl(269 97% 85%)",
          400: "hsl(270 95% 75%)",
          500: "hsl(271 91% 65%)",
          600: "hsl(271 81% 56%)",
          700: "hsl(272 72% 47%)",
          800: "hsl(273 67% 39%)",
          900: "hsl(274 66% 32%)",
          950: "hsl(274 87% 21%)",
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          // Extended accent scale (coral/orange)
          50: "hsl(33 100% 96%)",
          100: "hsl(34 100% 91%)",
          200: "hsl(32 98% 83%)",
          300: "hsl(31 97% 72%)",
          400: "hsl(27 96% 61%)",
          500: "hsl(25 95% 53%)",
          600: "hsl(21 90% 48%)",
          700: "hsl(17 88% 40%)",
          800: "hsl(15 79% 34%)",
          900: "hsl(15 75% 28%)",
          950: "hsl(13 81% 15%)",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          50: "hsl(138 76% 97%)",
          100: "hsl(141 84% 93%)",
          200: "hsl(141 79% 85%)",
          300: "hsl(142 77% 73%)",
          400: "hsl(142 69% 58%)",
          500: "hsl(142 71% 45%)",
          600: "hsl(142 76% 36%)",
          700: "hsl(142 72% 29%)",
          800: "hsl(143 64% 24%)",
          900: "hsl(144 61% 20%)",
        },

        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          50: "hsl(48 100% 96%)",
          100: "hsl(48 96% 89%)",
          200: "hsl(48 97% 77%)",
          300: "hsl(46 97% 65%)",
          400: "hsl(43 96% 56%)",
          500: "hsl(38 92% 50%)",
          600: "hsl(32 95% 44%)",
          700: "hsl(26 90% 37%)",
          800: "hsl(23 83% 31%)",
          900: "hsl(22 78% 26%)",
        },

        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          50: "hsl(204 100% 97%)",
          100: "hsl(204 94% 94%)",
          200: "hsl(201 94% 86%)",
          300: "hsl(199 95% 74%)",
          400: "hsl(198 93% 60%)",
          500: "hsl(199 89% 48%)",
          600: "hsl(200 98% 39%)",
          700: "hsl(201 96% 32%)",
          800: "hsl(201 90% 27%)",
          900: "hsl(202 80% 24%)",
        },

        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Chart colors
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },

        // Sidebar colors
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // Dating app specific colors
        love: {
          DEFAULT: "hsl(349 89% 55%)",
          light: "hsl(353 96% 86%)",
          dark: "hsl(345 83% 38%)",
        },

        match: {
          DEFAULT: "hsl(271 91% 65%)",
          light: "hsl(269 100% 92%)",
          dark: "hsl(272 72% 47%)",
        },

        superlike: {
          DEFAULT: "hsl(45 93% 47%)",
          light: "hsl(48 96% 89%)",
          dark: "hsl(32 95% 44%)",
        },
      },

      /**
       * Border radius
       * Friendly, rounded corners for dating app feel
       */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },

      /**
       * Font families
       */
      fontFamily: {
        sans: ["Satoshi", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Satoshi", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      /**
       * Font sizes with line heights
       */
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
      },

      /**
       * Spacing scale extensions
       */
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "22": "5.5rem",
      },

      /**
       * Box shadows
       */
      boxShadow: {
        "primary-sm": "0 2px 8px -2px hsl(349 89% 55% / 0.3)",
        "primary-md": "0 4px 14px -3px hsl(349 89% 55% / 0.4)",
        "primary-lg": "0 8px 24px -4px hsl(349 89% 55% / 0.5)",
        "secondary-sm": "0 2px 8px -2px hsl(271 91% 65% / 0.3)",
        "secondary-md": "0 4px 14px -3px hsl(271 91% 65% / 0.4)",
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },

      /**
       * Keyframe animations
       */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "heart-beat": {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.1)" },
          "50%": { transform: "scale(1)" },
          "75%": { transform: "scale(1.1)" },
        },
        "match-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "swipe-right": {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(150%) rotate(20deg)", opacity: "0" },
        },
        "swipe-left": {
          "0%": { transform: "translateX(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateX(-150%) rotate(-20deg)", opacity: "0" },
        },
        "like-pop": {
          "0%": { transform: "scale(0)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },

      /**
       * Animation utilities
       */
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.15s ease-in",
        "slide-up": "slide-up 0.2s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "heart-beat": "heart-beat 1.2s ease-in-out infinite",
        "match-pop": "match-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "swipe-right": "swipe-right 0.3s ease-out forwards",
        "swipe-left": "swipe-left 0.3s ease-out forwards",
        "like-pop": "like-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "bounce-slow": "bounce 2s ease-in-out infinite",
      },

      /**
       * Transition timing functions
       */
      transitionTimingFunction: {
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },

      /**
       * Z-index scale
       */
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },

      /**
       * Aspect ratios
       */
      aspectRatio: {
        profile: "1 / 1",
        story: "9 / 16",
        cover: "2 / 1",
      },
    },
  },

  /**
   * Plugins
   */
  plugins: [
    require("tailwindcss-animate"),
  ],
};
