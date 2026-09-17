import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C53C3",
          foreground: "#ffffff",
        },
        brand: {
          navy: '#171C2C',
          navyDark: '#10131C',
          navyPanel: '#20263A',
          indigo: '#6C63F5',
          indigoSoft: '#EEF0FF',
          green: '#16A34A',
          greenSoft: '#DCF3E3',
          red: '#E5484D',
        },
        // Settings App specific colors
        "sidebar-bg": "#12121b",
        "sidebar-bg-2": "#181824",
        "sidebar-border": "#242435",
        "sidebar-text": "#8e8ea8",
        "sidebar-text-active": "#f5f5fa",
        rail: "#0c0c13",
        accent: "#7c5cff",
        "accent-dim": "#7c5cff22",
        "accent-dark": "#6446e6",
        "bg-app": "#f3f3f8",
        "card-bg": "#ffffff",
        border: "#e7e7f0",
        "text-primary": "#16161f",
        "text-secondary": "#6b6b80",
        "text-tertiary": "#a2a2b5",
        success: "#17b26a",
        "success-dim": "#17b26a1a",
        info: "#5b6ee8",
        "info-dim": "#5b6ee81a",
        warning: "#f5a623",
        "warning-dim": "#f5a6231a",
        danger: "#e5484d",
        "danger-dim": "#e5484d1a",
        "av-purple": "#7c5cff",
        "av-purple-bg": "#7c5cff1f",
        "av-pink": "#e8579d",
        "av-pink-bg": "#e8579d1f",
        "av-teal": "#17a8a0",
        "av-teal-bg": "#17a8a01f",
        "av-amber": "#e6923a",
        "av-amber-bg": "#e6923a1f",
      },
      fontFamily: {
        disp: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,40,.04), 0 1px 0 rgba(20,20,40,.03)",
        toast: "0 8px 24px rgba(0,0,0,.25)",
        drawer: "20px 0 40px rgba(0,0,0,.2)",
      },
      keyframes: {
        fade: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%": { boxShadow: "0 0 0 0 var(--tw-shadow-color, #17b26a1a)" },
          "70%": { boxShadow: "0 0 0 5px transparent" },
          "100%": { boxShadow: "0 0 0 0 transparent" },
        },
      },
      animation: {
        fade: "fade .25s ease",
        "pulse-dot": "pulseDot 1.8s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
