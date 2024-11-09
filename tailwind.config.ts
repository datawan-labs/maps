import { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import typography from "@tailwindcss/typography";
import { datawanUIPreset } from "./src/styles/datawan-ui";

const config: Config = {
  presets: [datawanUIPreset],
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [
    typography,
    plugin(function ({ addVariant }) {
      addVariant(
        "prose-inline-code",
        '&.prose :where(:not(pre)>code):not(:where([class~="not-prose"] *))'
      );
    }),
  ],
};

export default config;
