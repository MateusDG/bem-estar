import type { Metadata } from "next";
import TestCheckout from "@/components/shop/test-checkout";
import { commerceEnv } from "@/lib/commerce/runtime";
import { storeConfig } from "@/lib/commerce/checkout";
import { OrderStore } from "@/lib/commerce/orders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Teste de checkout de R$ 1,00 | Bem de Hoje",
  robots: { index: false, follow: false },
  alternates: { canonical: "/teste-checkout" },
};
export default function TestCheckoutPage() {
  const env = commerceEnv();
  const store = storeConfig(env);
  let ready = store.checkoutReady && env.CHECKOUT_TEST_ENABLED === "true";
  if (ready) {
    try { new OrderStore(env.COMMERCE_DATA_DIR!, env.NODE_ENV === "production").close(); }
    catch { ready = false; }
  }
  return <TestCheckout ready={ready} store={store} />;
}
