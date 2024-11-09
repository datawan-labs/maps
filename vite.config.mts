import fs from "fs";
import path from "path";
import { Plugin } from "vite";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import react from "@vitejs/plugin-react";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

const OUT_DIR = "./dist";

/**
 * copy maps assets to dist folder
 */
const copyMapsAssets = (): Plugin => {
  return {
    name: "copy-maps-assets",
    apply: "build",
    writeBundle() {
      const maps = path.resolve(__dirname, "./maps");

      const dist = path.resolve(__dirname, OUT_DIR);

      ["glyphs", "styles", "sprites"].forEach((dir) =>
        fs.cpSync(path.join(maps, dir), path.join(dist, dir), {
          recursive: true,
          force: true,
        })
      );
    },
  };
};

export default defineWorkersConfig({
  plugins: [react(), mdx({ remarkPlugins: [remarkGfm] }), copyMapsAssets()],
  build: { outDir: OUT_DIR },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
      },
    },
  },
});
