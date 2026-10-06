import "server-only";
import type { CommerceEnv } from "./checkout";
// Hostinger/Node reads runtime settings here; secrets never enter client props.
export function commerceEnv(): CommerceEnv {
  return process.env as CommerceEnv;
}
