export type BundleId = "one" | "two" | "three";
export type CheckoutProductId = BundleId | "test";
export const testProduct = {
  id: "test", quantity: 1, priceCents: 100, label: "Produto de teste do checkout",
} as const;
export const bundles = [
  { id: "one", quantity: 1, priceCents: 6990, oldPriceCents: 29090, label: "1 frasco" },
  { id: "two", quantity: 2, priceCents: 9990, oldPriceCents: 35990, label: "2 frascos" },
  { id: "three", quantity: 3, priceCents: 13990, oldPriceCents: 39990, label: "3 frascos" },
] as const;
export const product = {
  name: "Coenzima Q10",
  manufacturer: "Nutrify",
  capsules: 60,
  image: "/images/coenzima-q10-nutrify.png",
  source: "https://www.nutrify.com.br/coenzima-q10/p?skuId=1001726",
  sku: "1001726",
  serving: "1,14 g (2 cápsulas)",
  servings: 30,
  ingredients:
    "Coenzima Q10, vitamina E (acetato de DL-alfatocoferol), estabilizante celulose microcristalina e lubrificante estearato de magnésio. Cápsula verde: estabilizante hidroxipropilmetilcelulose, glaceantes carragena e acetato de potássio e corante clorofilina cúprica.",
};
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const findBundle = (id: unknown) =>
  bundles.find((bundle) => bundle.id === id);
export const findCheckoutProduct = (id: unknown, testEnabled: boolean) =>
  id === "test" && testEnabled ? testProduct : findBundle(id);
export interface StoreConfig {
  checkoutReady: boolean;
  companyName: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
  deliveryMinDays: number | null;
  deliveryMaxDays: number | null;
}
export const deliveryMaxBusinessDays = 10;
export const emptyStore: StoreConfig = {
  checkoutReady: false,
  companyName: "",
  taxId: "",
  address: "",
  email: "",
  phone: "",
  deliveryMinDays: null,
  deliveryMaxDays: deliveryMaxBusinessDays,
};
export const deliveryLabel = (store: Pick<StoreConfig, "deliveryMaxDays">) =>
  `Entrega em até ${store.deliveryMaxDays ?? deliveryMaxBusinessDays} dias úteis`;
