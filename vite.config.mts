import fs from "fs";
import path from "path";
import mdx from "@mdx-js/rollup";
import remarkGfm from "remark-gfm";
import { PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

const OUT_DIR = "./dist";

/**
 * copy maps assets to dist folder
 */
const copyMapsAssets = (): PluginOption => {
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
  build: { outDir: OUT_DIR },
  plugins: [
    react(),
    copyMapsAssets(),
    TanStackRouterVite({ generatedRouteTree: "./src/route-tree-gen.ts" }),
    mdx({ remarkPlugins: [remarkGfm] }),
  ] as never,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
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
