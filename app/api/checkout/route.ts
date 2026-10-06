import { commerceEnv } from "@/lib/commerce/runtime";
import { handleCheckout } from "@/lib/commerce/checkout";
export const runtime = "nodejs";
export function POST(request: Request) { return handleCheckout(request, commerceEnv()); }
