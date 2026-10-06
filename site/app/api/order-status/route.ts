import { commerceEnv } from "@/lib/commerce/runtime";
import { handleOrderStatus } from "@/lib/commerce/checkout";
export function GET(request: Request) { return handleOrderStatus(request, commerceEnv()); }
