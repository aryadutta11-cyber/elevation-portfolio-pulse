import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ec-navy': '#0d1b2a',
        'ec-navy-deep': '#0F172A',
        'ec-blue': '#3283FF',
        'ec-glass-1': '#C3DAF8',
        'ec-glass-2': '#d6e6ff',
        'ec-glass-3': '#EBF1FA',
        'ec-cream': '#f4f2ed',
      },
    },
  },
  plugins: [],
};

export default config;
