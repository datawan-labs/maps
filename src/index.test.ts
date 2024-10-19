import worker from ".";
import { describe, it, expect } from "vitest";
import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";

describe("Test request pmtiles", () => {
  describe("request for /tiles/planet.json", () => {
    it("/ responds tilejson /tiles/planet.json", async () => {
      const request = new Request<unknown, IncomingRequestCfProperties>(
        "http://example.com/tiles/planet.json"
      );
      // Create an empty context to pass to `worker.fetch()`.
      const ctx = createExecutionContext();

      const response = await worker.fetch(request, env as Env, ctx);
      // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
      await waitOnExecutionContext(ctx);

      expect(await response.json()).toHaveProperty("tiles", [
        "http://example.com/tiles/planet/{z}/{x}/{y}.mvt",
      ]);
    });

    it("responds with not found tiles", async () => {
      const request = new Request("http://example.com/tiles/moon.json");

      const ctx = createExecutionContext();

      const response = await worker.fetch(request, env as Env, ctx);

      // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
      await waitOnExecutionContext(ctx);

      expect(response.ok).toBeFalsy();
    });
  });
});
