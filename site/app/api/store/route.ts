import { commerceEnv } from "@/lib/commerce/runtime";
import { response, storeConfig } from "@/lib/commerce/checkout";
export function GET() { return response(storeConfig(commerceEnv())); }
