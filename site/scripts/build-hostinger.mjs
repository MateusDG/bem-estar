import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const standalone = resolve(".next/standalone");
if (!existsSync(resolve(standalone, "server.js")))
  throw new Error("Standalone server was not generated.");
mkdirSync(resolve(standalone, ".next"), { recursive: true });
cpSync(resolve("public"), resolve(standalone, "public"), { recursive: true });
cpSync(resolve(".next/static"), resolve(standalone, ".next/static"), {
  recursive: true,
});
console.log(
  "Hostinger build ready: standalone server, public images and static assets.",
);
