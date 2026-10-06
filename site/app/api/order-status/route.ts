import { commerceEnv } from "@/lib/commerce/runtime";
import { handleOrderStatus } from "@/lib/commerce/checkout";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return handleOrderStatus(request, commerceEnv()); }
