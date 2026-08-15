import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '400px',
      },
      colors: {
        primary: "#1565C0",
        "primary-light": "#1976D2",
        "primary-dark": "#0D47A1",
        accent: "#F9A825",
        "accent-light": "#FBC02D",
        "accent-dark": "#F57F17",
        background: "#F5F7FA",
        "background-alt": "#eef2f6",
        textMain: "#111827",
        textSecondary: "#6B7280",
        borderLight: "#e2e8f0",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ['var(--font-be-vietnam-pro)', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(15, 52, 96, 0.08)',
        'glass-lg': '0 20px 70px rgba(15, 52, 96, 0.12)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 12px 40px rgba(15, 52, 96, 0.15)',
        'glow': '0 0 20px rgba(15, 52, 96, 0.2)',
        'glow-accent': '0 0 20px rgba(244, 162, 97, 0.3)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(15, 52, 96, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(15, 52, 96, 0.4)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'count-up': 'countUp 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
};
export default config;
