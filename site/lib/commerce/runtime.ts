import { env } from "cloudflare:workers";
import type { CommerceEnv } from "./checkout";
export function commerceEnv(): CommerceEnv { return env as CommerceEnv; }
