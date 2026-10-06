import { commerceEnv } from "@/lib/commerce/runtime";
import { handleWebhook } from "@/lib/commerce/checkout";
export const runtime = "nodejs";
export function POST(request: Request) {
  return handleWebhook(request, commerceEnv());
}
