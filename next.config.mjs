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
  experimental: {
    // The small storefront stylesheet can render with the document, without a CSS round trip.
    inlineCss: true,
  },
};

export default nextConfig;
