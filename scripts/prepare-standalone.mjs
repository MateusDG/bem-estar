import { cpSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const projectPath = (...parts) => resolve(projectRoot, ...parts);

const standalone = projectPath(".next/standalone");
if (!existsSync(resolve(standalone, "server.js")))
  throw new Error("Standalone server was not generated.");
mkdirSync(resolve(standalone, ".next"), { recursive: true });
cpSync(projectPath("public"), resolve(standalone, "public"), { recursive: true });
cpSync(projectPath(".next/static"), resolve(standalone, ".next/static"), {
  recursive: true,
});
console.log(
  "Hostinger build ready: standalone server, public images and static assets.",
);
