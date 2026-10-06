import { OrderStore, validDataDir, type Order } from "./orders.ts";
import { paymentUrl } from "./payment-url.ts";
import {
  deliveryMaxBusinessDays,
  findBundle,
  type StoreConfig,
} from "../catalog.ts";
export type CommerceEnv = Partial<
  Record<
    | "INFINITEPAY_HANDLE"
    | "COMMERCE_DATA_DIR"
    | "CHECKOUT_ENABLED"
    | "SITE_URL"
    | "NODE_ENV"
    | "STORE_COMPANY_NAME"
    | "STORE_CNPJ"
    | "STORE_ADDRESS"
    | "STORE_EMAIL"
    | "STORE_PHONE"
    | "DELIVERY_MIN_DAYS"
    | "DELIVERY_MAX_DAYS",
    string
  >
>;
export const response = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
export function validCnpj(value: string) {
  const digits = value.toUpperCase().replace(/[.\/-]/g, "");
  if (!/^[A-Z0-9]{12}\d{2}$/.test(digits) || /^(\d)\1{13}$/.test(digits))
    return false;
  const check = (length: number) => {
    let weight = length - 7,
      sum = 0;
    for (let i = 0; i < length; i++) {
      sum += (digits.charCodeAt(i) - 48) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return Number(digits[12]) === check(12) && Number(digits[13]) === check(13);
}
export function storeConfig(env: CommerceEnv): StoreConfig {
  const min = env.DELIVERY_MIN_DAYS?.trim()
    ? Number(env.DELIVERY_MIN_DAYS)
    : null;
  const max = env.DELIVERY_MAX_DAYS?.trim()
    ? Number(env.DELIVERY_MAX_DAYS)
    : deliveryMaxBusinessDays;
  const deliveryValid =
    Number.isInteger(max) &&
    max >= 1 &&
    max <= 120 &&
    (min === null || (Number.isInteger(min) && min >= 1 && min <= max));
  const config: StoreConfig = {
    checkoutReady: false,
    companyName: env.STORE_COMPANY_NAME?.trim() || "",
    taxId: env.STORE_CNPJ?.trim() || "",
    address: env.STORE_ADDRESS?.trim() || "",
    email: env.STORE_EMAIL?.trim() || "",
    phone: env.STORE_PHONE?.trim() || "",
    deliveryMinDays: deliveryValid ? min : null,
    deliveryMaxDays: deliveryValid ? max : null,
  };
  let originValid = false;
  try {
    originValid =
      Boolean(env.SITE_URL?.trim()) &&
      trustedOrigin(env) === env.SITE_URL?.replace(/\/$/, "");
  } catch {
    /* Invalid or missing origin keeps payment closed. */
  }
  // Technical availability is distinct from the merchant's launch obligations.
  config.checkoutReady =
    env.CHECKOUT_ENABLED === "true" &&
    /^[A-Za-z][A-Za-z0-9_-]{0,23}$/.test(env.INFINITEPAY_HANDLE || "") &&
    validDataDir(env.COMMERCE_DATA_DIR, env.NODE_ENV === "production") &&
    originValid &&
    deliveryValid;
  return config;
}
export function trustedOrigin(env: CommerceEnv) {
  const url = new URL(env.SITE_URL || "");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Invalid store origin");
  return url.origin;
}
function checkoutOrigin(request: Request, env: CommerceEnv) {
  // Next.js can reconstruct request.url using the internal Node server address.
  // Production redirects and Origin checks must use the configured public domain.
  const origin = trustedOrigin(env);
  const browserOrigin = request.headers.get("Origin");
  if (browserOrigin === origin) return origin;
  if (env.NODE_ENV !== "development" || !browserOrigin) return null;

  // Local testing is allowed only in development, on the same loopback host/port.
  const loopback = ["127.0.0.1", "localhost", "[::1]"];
  try {
    const current = new URL(request.url);
    const browser = new URL(browserOrigin);
    return loopback.includes(current.hostname) &&
      loopback.includes(browser.hostname) &&
      browser.protocol === "http:" &&
      browser.origin === browserOrigin &&
      browser.host === (request.headers.get("Host") || current.host)
      ? browser.origin
      : null;
  } catch {
    return null;
  }
}

const api = "https://api.checkout.infinitepay.io";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const orderId = /^BDH-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invoiceId = /^[A-Za-z0-9_-]{1,200}$/;
export type CommerceDeps = { fetch?: typeof fetch; orders?: OrderStore };
function openOrders(env: CommerceEnv, deps: CommerceDeps) {
  return deps.orders || new OrderStore(env.COMMERCE_DATA_DIR || "", env.NODE_ENV === "production");
}
async function readJson(request: Request, limit: number): Promise<Record<string, unknown>> {
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))
    throw new Error("Invalid content type");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("Body too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const payload: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid body");
  return payload as Record<string, unknown>;
}
export function checkoutParams(bundleId: unknown, origin: string, nsu: string, env: CommerceEnv) {
  const bundle = findBundle(bundleId);
  if (!bundle) throw new Error("Invalid bundle");
  return {
    handle: env.INFINITEPAY_HANDLE,
    order_nsu: nsu,
    redirect_url: origin + "/?checkout=complete",
    webhook_url: trustedOrigin(env) + "/api/webhooks/infinitepay",
    // One kit is one item: using bottle quantity here would multiply the kit price.
    items: [{ quantity: 1, price: bundle.priceCents,
      description: "Coenzima Q10 Nutrify — " + bundle.label +
        ", 60 cápsulas por frasco. Frete grátis. Compra única." }],
  };
}
export async function handleCheckout(request: Request, env: CommerceEnv, deps: CommerceDeps = {}) {
  let origin: string | null;
  try { origin = checkoutOrigin(request, env); }
  catch { return response({ error: "A loja ainda está em preparação." }, 503); }
  if (!origin) return response({ error: "Abra o pagamento pela página da loja." }, 403);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))
    return response({ error: "Formato de pedido inválido." }, 415);
  let values: Record<string, unknown>;
  try { values = await readJson(request, 2048); }
  catch { return response({ error: "Pedido inválido." }, 400); }
  const bundle = findBundle(values.bundleId);
  if (Object.keys(values).length !== 2 || !bundle || typeof values.requestId !== "string" ||
      !uuid.test(values.requestId))
    return response({ error: "Escolha um kit válido e tente novamente." }, 400);
  if (!storeConfig(env).checkoutReady)
    return response({ error: "A loja está em preparação. O pagamento ainda não está disponível." }, 503);
  let orders: OrderStore;
  try { orders = openOrders(env, deps); }
  catch { return response({ error: "Não foi possível preparar o pedido. Tente novamente em instantes." }, 503); }
  try {
    const { order, claimed } = orders.reserve(values.requestId + ":" + bundle.id, bundle, env.INFINITEPAY_HANDLE!);
    if (order.state === "paid") return response({ error: "Este pedido já foi pago. Atualize a página para iniciar outra compra." }, 409);
    if (order.checkout_url) {
      const url = paymentUrl(order.checkout_url);
      if (!url) throw new Error("Invalid saved URL");
      return response({ url, orderReference: order.nsu });
    }
    if (!claimed) return response({ error: "Seu pagamento está sendo preparado. Aguarde alguns instantes e tente novamente." }, 409);
    const result = await (deps.fetch || fetch)(api + "/links", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutParams(bundle.id, origin, order.nsu, env)),
      signal: AbortSignal.timeout(15000), redirect: "error",
    });
    if (!result.ok) {
      orders.release(order.nsu);
      throw new Error("Provider unavailable");
    }
    const data = await result.json() as { url?: unknown };
    const url = paymentUrl(data.url);
    if (!url || new URL(url).pathname !== "/" + order.handle) throw new Error("Invalid payment URL");
    orders.saveCheckout(order.nsu, url);
    return response({ url, orderReference: order.nsu });
  } catch {
    // A timeout can leave a provider invoice open. Keep the reservation for 60s.
    return response({ error: "Não foi possível abrir o pagamento. Nenhuma cobrança é feita nesta página. Aguarde um minuto e tente novamente." }, 502);
  } finally { if (!deps.orders) orders.close(); }
}
function publicOrder(order: Order) {
  return { status: order.state, orderReference: order.nsu,
    quantity: order.quantity, totalCents: order.amount };
}
async function verifyPayment(order: Order, transaction: string, slug: string, orders: OrderStore, deps: CommerceDeps) {
  if (order.state === "paid") {
    if (order.transaction_nsu !== transaction || order.invoice_slug !== slug) throw new Error("Conflicting transaction");
    return order;
  }
  const result = await (deps.fetch || fetch)(api + "/payment_check", {
    method: "POST", headers: { "Content-Type": "application/json" }, redirect: "error",
    body: JSON.stringify({ handle: order.handle, order_nsu: order.nsu, transaction_nsu: transaction, slug }),
    signal: AbortSignal.timeout(8000),
  });
  if (!result.ok) throw new Error("Payment verification unavailable");
  const data = await result.json() as Record<string, unknown>;
  if (data.success !== true || typeof data.paid !== "boolean") throw new Error("Invalid payment status");
  if (!data.paid) return order;
  if (data.amount !== order.amount || !Number.isSafeInteger(data.paid_amount) ||
      (data.paid_amount as number) < order.amount ||
      !["credit_card", "pix"].includes(data.capture_method as string)) throw new Error("Payment mismatch");
  return orders.confirm(order.nsu, { transaction, slug,
    paidAmount: data.paid_amount as number, method: data.capture_method as string });
}
export async function handleOrderStatus(request: Request, env: CommerceEnv, deps: CommerceDeps = {}) {
  const params = new URL(request.url).searchParams;
  const nsu = params.get("order_nsu") || "";
  const transaction = params.get("transaction_nsu");
  const slug = params.get("slug");
  if (!orderId.test(nsu) || (transaction !== null && !uuid.test(transaction)) ||
      (slug !== null && !invoiceId.test(slug)) || Boolean(transaction) !== Boolean(slug))
    return response({ error: "Não foi possível identificar o pedido." }, 400);
  let orders: OrderStore;
  try { orders = openOrders(env, deps); }
  catch { return response({ error: "A confirmação do pagamento está indisponível." }, 503); }
  try {
    const order = orders.get(nsu);
    if (!order) return response({ error: "Não foi possível identificar o pedido." }, 404);
    if (order.state === "paid" || !transaction || !slug) return response(publicOrder(order));
    return response(publicOrder(await verifyPayment(order, transaction, slug, orders, deps)));
  } catch { return response({ error: "A consulta está indisponível no momento. Tente novamente ou procure o atendimento." }, 502); }
  finally { if (!deps.orders) orders.close(); }
}
export async function handleWebhook(request: Request, env: CommerceEnv, deps: CommerceDeps = {}) {
  let payload: Record<string, unknown>;
  const fail = (message: string) => response({ success: false, message }, 400);
  try { payload = await readJson(request, 16384); }
  catch { return fail("Notificação inválida"); }
  const { order_nsu: nsu, transaction_nsu: transaction, invoice_slug: slug } = payload;
  if (typeof nsu !== "string" || !orderId.test(nsu) || typeof transaction !== "string" ||
      !uuid.test(transaction) || typeof slug !== "string" || !invoiceId.test(slug))
    return fail("Notificação inválida");
  let orders: OrderStore;
  try { orders = openOrders(env, deps); }
  catch { return fail("Confirmação temporariamente indisponível"); }
  try {
    const order = orders.get(nsu);
    if (!order) return fail("Pedido não encontrado");
    if (payload.amount !== order.amount) return fail("Valor do pedido inválido");
    // No webhook signature is specified in the provider documentation.
    // Never trust the notification itself: confirm the real payment with the API.
    const verified = await verifyPayment(order, transaction, slug, orders, deps);
    if (verified.state !== "paid") return fail("Pagamento ainda não confirmado");
    return response({ success: true, message: null });
  } catch { return fail("Não foi possível confirmar o pagamento"); }
  finally { if (!deps.orders) orders.close(); }
}
