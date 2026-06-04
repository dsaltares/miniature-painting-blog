import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import { getEnv, setEnv } from "../env.ts";
import { fetchJson } from "../lib/http.ts";
import type { Adapter, PostOptions } from "./adapter.ts";

// Instagram API with Instagram Login (token generated in the Meta app dashboard).
// Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing/
const API = "https://graph.instagram.com/v23.0";
const TOKEN_KEY = "INSTAGRAM_TOKEN";
const MAX_CAROUSEL_IMAGES = 10;
const POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 2_000;

const Container = z.object({ id: z.string() });
const ContainerStatus = z.object({ status_code: z.string() });
const Media = z.object({ permalink: z.string() });
const RefreshedToken = z.object({ access_token: z.string(), expires_in: z.number() });
const Account = z.object({ username: z.string(), account_type: z.string().optional() });
const MetaError = z.object({ error: z.object({ message: z.string() }) });

function metaErrorMessage(body: unknown): string | undefined {
  return MetaError.safeParse(body).data?.error.message;
}

async function api<Schema extends z.ZodType>(
  schema: Schema,
  method: "GET" | "POST",
  path: string,
  params: Record<string, string> = {},
): Promise<z.infer<Schema>> {
  const search = new URLSearchParams({ ...params, access_token: getEnv(TOKEN_KEY) });
  const url = new URL(`${API}/${path}`);
  if (method === "GET") {
    url.search = search.toString();
    return fetchJson(schema, url, undefined, metaErrorMessage);
  }
  return fetchJson(schema, url, { method, body: search }, metaErrorMessage);
}

/** Instagram only accepts public HTTPS JPEG URLs, so fail fast on anything else. */
async function assertPublicJpeg(imageUrl: string): Promise<void> {
  const response = await fetch(imageUrl, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`image not reachable (HTTP ${response.status}): ${imageUrl}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("image/jpeg")) {
    throw new Error(`not a JPEG (${contentType || "unknown type"}): ${imageUrl}`);
  }
  console.log(`ok: ${imageUrl}`);
}

async function createContainer(caption: string, images: string[]): Promise<string> {
  if (images.length === 1) {
    const container = await api(Container, "POST", "me/media", {
      image_url: images[0]!,
      caption,
    });
    return container.id;
  }
  const children: string[] = [];
  for (const imageUrl of images) {
    const child = await api(Container, "POST", "me/media", {
      image_url: imageUrl,
      is_carousel_item: "true",
    });
    console.log(`child container: ${child.id}`);
    children.push(child.id);
  }
  const carousel = await api(Container, "POST", "me/media", {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
  });
  return carousel.id;
}

async function waitUntilReady(containerId: string): Promise<void> {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    const { status_code } = await api(ContainerStatus, "GET", containerId, {
      fields: "status_code",
    });
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR") throw new Error("container processing failed");
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`container not ready after ${(POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`);
}

/** Swap the current token for a fresh 60-day one and persist it to .env. */
async function refreshToken(): Promise<void> {
  // The refresh endpoint is unversioned, so don't go through api()
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.search = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: getEnv(TOKEN_KEY),
  }).toString();
  const { access_token, expires_in } = await fetchJson(RefreshedToken, url, undefined, metaErrorMessage);
  setEnv(TOKEN_KEY, access_token);
  console.log(`token refreshed (expires in ${Math.floor(expires_in / 86_400)} days), .env updated`);
}

export const instagram: Adapter = {
  name: "instagram",

  async post({ caption, images, dryRun }: PostOptions): Promise<string | null> {
    if (images.length < 1 || images.length > MAX_CAROUSEL_IMAGES) {
      throw new Error(`need 1-${MAX_CAROUSEL_IMAGES} image URLs, got ${images.length}`);
    }
    for (const imageUrl of images) await assertPublicJpeg(imageUrl);
    if (dryRun) return null;

    const containerId = await createContainer(caption, images);
    console.log(`container: ${containerId}`);
    await waitUntilReady(containerId);
    const media = await api(Container, "POST", "me/media_publish", { creation_id: containerId });
    const { permalink } = await api(Media, "GET", media.id, { fields: "permalink" });

    // Keep the token alive: each refresh buys another 60 days. Refresh can fail
    // legitimately (tokens under 24h old can't be refreshed), so warn, don't die.
    try {
      await refreshToken();
    } catch (error) {
      console.warn(`warn: token refresh failed: ${error instanceof Error ? error.message : error}`);
    }
    return permalink;
  },

  refresh: refreshToken,

  async verify(): Promise<string> {
    const account = await api(Account, "GET", "me", { fields: "username,account_type" });
    return `@${account.username}${account.account_type ? ` (${account.account_type})` : ""}`;
  },
};
