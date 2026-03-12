// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // This tells Tailwind to scan your app files
  ],
  theme: { extend: {} },
  plugins: [],
};
export default config;