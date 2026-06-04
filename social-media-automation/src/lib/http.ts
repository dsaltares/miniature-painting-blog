import type { z } from "zod";

/** Pull a platform-specific error message out of a response body, if present. */
export type ErrorExtractor = (body: unknown) => string | undefined;

/** Fetch JSON and validate it against a zod schema. */
export async function fetchJson<Schema extends z.ZodType>(
  schema: Schema,
  url: URL,
  init?: RequestInit,
  extractError?: ErrorExtractor,
): Promise<z.infer<Schema>> {
  const response = await fetch(url, init);
  const body: unknown = await response.json().catch(() => undefined);
  const apiMessage = extractError?.(body);
  if (apiMessage) throw new Error(apiMessage);
  if (!response.ok) {
    // url.pathname only: the full URL may carry an access token in its query string
    throw new Error(`HTTP ${response.status} for ${url.pathname}`);
  }
  return schema.parse(body);
}
