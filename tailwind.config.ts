import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config = {
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [animate],
} satisfies Config;

export default config;
