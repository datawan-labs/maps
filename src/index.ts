import { AwsClient } from "aws4fetch";
import {
  Source,
  PMTiles,
  TileType,
  Compression,
  RangeResponse,
  ResolvedValueCache,
} from "pmtiles";

class KeyNotFoundError extends Error {}

class MaximumAttempRequest extends Error {}

const TILE =
  /^\/(?<NAME>[0-9a-zA-Z\/!\-_\.\*\'\(\)]+)\/(?<Z>\d+)\/(?<X>\d+)\/(?<Y>\d+).(?<EXT>[a-z]+)$/;

const TILESET = /^\/(?<NAME>[0-9a-zA-Z\/!\-_\.\*\'\(\)]+).json$/;

const getPMTilesPath = (name: string, setting?: string): string => {
  if (setting) return setting.replaceAll("{name}", name);

  return name + ".pmtiles";
};

/**
 * check if path is match with tilejson url or xyz tiles
 *
 * @param path
 * @returns
 */
const getTilePath = (path: string) => {
  const tile_match = path.match(TILE);

  /**
   * match the xyz tiles
   */
  if (tile_match) {
    const groups = tile_match.groups!;

    return {
      ok: true,
      ext: groups.EXT,
      name: groups.NAME,
      tile: [+groups.Z, +groups.X, +groups.Y],
    };
  }

  const tileset_match = path.match(TILESET);

  /**
   * match the tilejson
   */
  if (tileset_match) {
    const groups = tileset_match.groups!;

    return { ok: true, name: groups.NAME, ext: "json" };
  }

  return { ok: false, name: "", tile: [0, 0, 0], ext: "" };
};

const nativeDecompress = async (
  buf: ArrayBuffer,
  compression: Compression
): Promise<ArrayBuffer> => {
  if (compression === Compression.None || compression === Compression.Unknown)
    return buf;

  if (compression === Compression.Gzip) {
    const stream = new Response(buf).body;

    const result = stream?.pipeThrough(new DecompressionStream("gzip"));

    return new Response(result).arrayBuffer();
  }

  throw Error("Compression method not supported");
};

/**
 * external S3 implementation
 */
class S3Source implements Source {
  env: Env;

  client: AwsClient;

  archiveName: string;

  constructor(env: Env, archiveName: string) {
    this.env = env;

    this.archiveName = archiveName;

    this.client = new AwsClient({
      service: "s3",
      accessKeyId: env.ACCESS_KEY_ID,
      secretAccessKey: env.SECRET_ACCESS_KEY,
    });
  }

  getKey() {
    return this.archiveName;
  }

  async getBytes(
    offset: number,
    length: number,
    _signal?: AbortSignal,
    etag?: string
  ): Promise<RangeResponse> {
    const url = new URL(this.env.BUCKET);

    url.pathname = getPMTilesPath(this.archiveName, this.env.PMTILES_PATH);

    const header = new Headers();

    header.set("Range", `bytes=${offset}-${offset + length - 1}`);

    if (etag) header.set("If-Match", etag);

    /**
     * we do 3 attemp to request data to S3, because we don't know
     * how behaviour from cloudflare when using fetch, sometimes they cache the response
     * sometimes not. we will check if result is not exceeded the bytes
     * request in range request.
     */
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();

      const response = await this.client.fetch(url, {
        cf: { cacheEverything: false },
        headers: header,
        signal: controller.signal,
      });

      if (!response.ok) throw new KeyNotFoundError("Not Found");

      /**
       * check total bytes, for some reason cloudflare does not include
       * range request to origin server. so if we don't check this, your
       * bill can be nightmare.
       *
       * - https://community.cloudflare.com/t/cloudflare-worker-fetch-ignores-byte-request-range-on-initial-request/395047/4
       * - https://community.cloudflare.com/t/workers-dont-support-range-requests-on-gzip-files/614199
       */
      if (parseInt(response.headers.get("Content-Length")!) > length) {
        controller.abort();

        continue;
      }

      const buffer = await response.arrayBuffer();

      const newEtag = response.headers.get("ETag")!;

      const expires = response.headers.get("Expires")!;

      const cacheControl = response.headers.get("Cache-Control")!;

      return {
        data: buffer,
        etag: newEtag,
        expires: expires,
        cacheControl: cacheControl,
      };
    }

    throw new MaximumAttempRequest("failed to get resources from origin");
  }
}

const CACHE = new ResolvedValueCache(25, undefined, nativeDecompress);

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (request.method.toUpperCase() === "POST")
      return new Response(undefined, { status: 405 });

    const url = new URL(request.url);

    const { ok, name, tile, ext } = getTilePath(url.pathname);

    if (!ok) return new Response("Invalid URL", { status: 404 });

    /**
     * we open new cache with custom keys
     */
    const cache = await caches.open("datawan-maps");

    const cached = await cache.match(request.url);

    /**
     * if existing url match with the cache, return the cache, no
     * server roundtrip to S3
     */
    if (cached) {
      const respHeaders = new Headers(cached.headers);

      respHeaders.set("Access-Control-Allow-Origin", "*");

      respHeaders.set("Vary", "Origin");

      return new Response(cached.body, {
        headers: respHeaders,
        status: cached.status,
      });
    }

    /**
     * cache resoponse
     */
    const cacheableResponse = (
      body: ArrayBuffer | string | undefined,
      cacheableHeaders: Headers,
      status: number
    ) => {
      cacheableHeaders.set("Cache-Control", "public, max-age=86400");

      const respHeaders = new Headers(cacheableHeaders);

      const cacheable = new Response(body, {
        headers: cacheableHeaders,
        status: status,
      });

      ctx.waitUntil(cache.put(request.url, cacheable));

      respHeaders.set("Access-Control-Allow-Origin", "*");

      respHeaders.set("Vary", "Origin");

      return new Response(body, { headers: respHeaders, status: status });
    };

    const cacheableHeaders = new Headers();

    const source = new S3Source(env, name);

    const pmtiles = new PMTiles(source, CACHE, nativeDecompress);

    try {
      const pHeader = await pmtiles.getHeader();

      if (!tile) {
        cacheableHeaders.set("Content-Type", "application/json");

        const t = await pmtiles.getTileJson(`${url.origin}/${name}`);

        return cacheableResponse(JSON.stringify(t), cacheableHeaders, 200);
      }

      /**
       * execedd minimum and maximum zoom in pmtiles data
       */
      if (tile[0] < pHeader.minZoom || tile[0] > pHeader.maxZoom)
        return cacheableResponse(undefined, cacheableHeaders, 404);

      const VALID_PAIR = [
        [TileType.Mvt, "mvt"],
        [TileType.Png, "png"],
        [TileType.Jpeg, "jpg"],
        [TileType.Webp, "webp"],
        [TileType.Avif, "avif"],
      ];

      /**
       * check available tile format and requested format
       */
      for (const pair of VALID_PAIR)
        if (pHeader.tileType === pair[0] && ext !== pair[1]) {
          // allow this for now. Eventually we will delete this in favor of .mvt
          if (pHeader.tileType === TileType.Mvt && ext === "pbf") continue;

          const msg = `Bad request: requested .${ext} but archive has type .${pair[1]}`;

          return cacheableResponse(msg, cacheableHeaders, 400);
        }

      /**
       * now get the xyz tiles
       */
      const tiledata = await pmtiles.getZxy(tile[0], tile[1], tile[2]);

      if (!tiledata) return cacheableResponse(undefined, cacheableHeaders, 204);

      switch (pHeader.tileType) {
        case TileType.Mvt:
          cacheableHeaders.set("Content-Type", "application/x-protobuf");
          break;
        case TileType.Png:
          cacheableHeaders.set("Content-Type", "image/png");
          break;
        case TileType.Jpeg:
          cacheableHeaders.set("Content-Type", "image/jpeg");
          break;
        case TileType.Webp:
          cacheableHeaders.set("Content-Type", "image/webp");
          break;
      }

      return cacheableResponse(tiledata.data, cacheableHeaders, 200);
    } catch (e) {
      if (e instanceof KeyNotFoundError)
        return cacheableResponse("Archive not found", cacheableHeaders, 404);
      if (e instanceof MaximumAttempRequest)
        return new Response("Failed to get data", { status: 400 });
      if (e instanceof Error && e.name === "AbortError")
        return new Response("request abborted", { status: 400 });
      throw e;
    }
  },
} satisfies ExportedHandler<Env>;
