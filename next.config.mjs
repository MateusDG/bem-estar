// @ts-check
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  poweredByHeader: false,
  agentRules: false,
  devIndicators: false,
};

export default nextConfig;
