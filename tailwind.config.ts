import { Config } from "tailwindcss";
import { datawanUIPreset } from "./src/styles/datawan-ui";

const config: Config = {
  presets: [datawanUIPreset],
  content: ["./src/**/*.{ts,tsx}"],
};

export default config;
