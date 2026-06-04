export interface PostOptions {
  caption: string;
  /** Public HTTPS image URLs (platforms fetch these; they are not local paths). */
  images: string[];
  /** Validate everything but publish nothing. */
  dryRun: boolean;
}

export interface Adapter {
  name: string;
  /** Publish a post; returns its permalink, or null on dry run. */
  post(options: PostOptions): Promise<string | null>;
  /** Exchange the current token for a fresh one and persist it. */
  refresh(): Promise<void>;
  /** Check credentials; returns a human-readable account label. */
  verify(): Promise<string>;
}
