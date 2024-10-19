import { AwsClient } from "aws4fetch";
import {
  Source,
  PMTiles,
  TileType,
  Compression,
  EtagMismatch,
  RangeResponse,
  ResolvedValueCache,
} from "pmtiles";

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

class KeyNotFoundError extends Error {}

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

const CACHE = new ResolvedValueCache(25, undefined, nativeDecompress);

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
    signal?: AbortSignal,
    etag?: string
  ): Promise<RangeResponse> {
    const url = new URL(this.env.BUCKET);

    url.pathname = getPMTilesPath(this.archiveName, this.env.PMTILES_PATH);

    const header = new Headers();

    header.set("Range", `bytes=${offset}-${offset + length - 1}`);

    if (etag) header.set("If-Match", etag);

    const response = await this.client.fetch(url, {
      cf: { cacheEverything: true },
      headers: header,
      signal: signal,
    });

    if (!response.ok) throw new KeyNotFoundError("Not Found");

    if (!response.body) throw new EtagMismatch();

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
}

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

    const cache = caches.default;

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
     * generate response with caching
     */
    const cacheableResponse = (
      body: ArrayBuffer | string | undefined,
      cacheableHeaders: Headers,
      status: number
    ) => {
      cacheableHeaders.set("Cache-Control", "public, max-age=86400");

      const cacheable = new Response(body, {
        headers: cacheableHeaders,
        status: status,
      });

      ctx.waitUntil(cache.put(request.url, cacheable));

      const respHeaders = new Headers(cacheableHeaders);

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
      console.log(e);
      if (e instanceof KeyNotFoundError)
        return cacheableResponse("Archive not found", cacheableHeaders, 404);
      throw e;
    }
  },
} satisfies ExportedHandler<Env>;
