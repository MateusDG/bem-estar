import { commerceEnv } from "@/lib/commerce/runtime";
import { response, storeConfig } from "@/lib/commerce/checkout";
export const dynamic = "force-dynamic";
export function GET() { return response(storeConfig(commerceEnv())); }
