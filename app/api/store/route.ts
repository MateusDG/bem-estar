import { commerceEnv } from "@/lib/commerce/runtime";
import { response, storeConfig } from "@/lib/commerce/checkout";
import { OrderStore } from "@/lib/commerce/orders";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET() {
  const env = commerceEnv();
  const config = storeConfig(env);
  if (config.checkoutReady) {
    try { new OrderStore(env.COMMERCE_DATA_DIR!, env.NODE_ENV === "production").close(); }
    catch { config.checkoutReady = false; }
  }
  return response(config);
}
