import { parseArgs } from "node:util";
import type { Adapter } from "./adapters/adapter.ts";
import { instagram } from "./adapters/instagram.ts";

const adapters: Record<string, Adapter> = { instagram };

const USAGE = `usage:
  node src/cli.ts post <platform> -c <caption> [--dry-run] <image-url>...
  node src/cli.ts refresh <platform>
  node src/cli.ts verify <platform>

platforms: ${Object.keys(adapters).join(", ")}`;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main(): Promise<void> {
  const [command, platform, ...rest] = process.argv.slice(2);
  if (!command || !platform) fail(USAGE);
  const adapter = adapters[platform];
  if (!adapter) fail(`unknown platform: ${platform}\n\n${USAGE}`);

  switch (command) {
    case "post": {
      const { values, positionals } = parseArgs({
        args: rest,
        options: {
          caption: { type: "string", short: "c" },
          "dry-run": { type: "boolean", default: false },
        },
        allowPositionals: true,
      });
      if (!values.caption) fail(`caption is required (-c)\n\n${USAGE}`);
      if (positionals.length === 0) fail(`at least one image URL is required\n\n${USAGE}`);
      const permalink = await adapter.post({
        caption: values.caption,
        images: positionals,
        dryRun: values["dry-run"],
      });
      console.log(
        permalink
          ? `published: ${permalink}`
          : `dry run: would publish ${positionals.length} image(s) to ${adapter.name}`,
      );
      break;
    }
    case "refresh":
      await adapter.refresh();
      break;
    case "verify":
      console.log(`token ok: ${await adapter.verify()}`);
      break;
    default:
      fail(`unknown command: ${command}\n\n${USAGE}`);
  }
}

main().catch((error: unknown) => {
  fail(`error: ${error instanceof Error ? error.message : String(error)}`);
});
