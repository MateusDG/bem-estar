import {
  deliveryMaxBusinessDays,
  findBundle,
  product,
  siteOrigin,
  type StoreConfig,
} from "../catalog.ts";
export type CommerceEnv = Partial<
  Record<
    | "STRIPE_SECRET_KEY"
    | "CHECKOUT_ENABLED"
    | "SITE_URL"
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
    /^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY || "") &&
    originValid &&
    deliveryValid;
  return config;
}
export function trustedOrigin(env: CommerceEnv) {
  const url = new URL(env.SITE_URL || siteOrigin);
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
  const current = new URL(request.url);
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(current.hostname);
  const origin = local ? current.origin : trustedOrigin(env);
  return request.headers.get("Origin") === origin ? origin : null;
}
export function checkoutParams(
  bundleId: unknown,
  origin: string,
  reference: string,
  store: StoreConfig,
) {
  const bundle = findBundle(bundleId);
  if (!bundle) throw new Error("Invalid bundle");
  const params = new URLSearchParams({
    mode: "payment",
    locale: "pt-BR",
    customer_creation: "if_required",
    client_reference_id: reference,
    success_url:
      origin + "/?checkout=complete&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: origin + "/?checkout=cancelled&kit=" + bundle.id + "#kits",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][unit_amount]": String(bundle.priceCents),
    "line_items[0][price_data][product_data][name]":
      "Coenzima Q10 Nutrify — " + bundle.label,
    "line_items[0][price_data][product_data][description]":
      bundle.quantity +
      " frasco(s), 60 cápsulas por frasco. Frete grátis. Compra única.",
    "line_items[0][price_data][product_data][images][0]":
      origin + product.image,
    "shipping_address_collection[allowed_countries][0]": "BR",
    "phone_number_collection[enabled]": "true",
    "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
    "shipping_options[0][shipping_rate_data][fixed_amount][amount]": "0",
    "shipping_options[0][shipping_rate_data][fixed_amount][currency]": "brl",
    "shipping_options[0][shipping_rate_data][display_name]": "Frete grátis",
    "shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]":
      "business_day",
    "shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]":
      String(store.deliveryMaxDays),
    "metadata[store]": "bem-de-hoje",
    "metadata[bundle_id]": bundle.id,
    "metadata[bottle_quantity]": String(bundle.quantity),
    "metadata[order_reference]": reference,
    "payment_intent_data[metadata][store]": "bem-de-hoje",
    "payment_intent_data[metadata][bundle_id]": bundle.id,
    "payment_intent_data[metadata][order_reference]": reference,
  });
  if (store.deliveryMinDays !== null) {
    params.set(
      "shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]",
      "business_day",
    );
    params.set(
      "shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]",
      String(store.deliveryMinDays),
    );
  }
  return params;
}
export async function handleCheckout(
  request: Request,
  env: CommerceEnv,
  stripeFetch: typeof fetch = fetch,
) {
  let origin: string | null;
  try {
    origin = checkoutOrigin(request, env);
  } catch {
    return response({ error: "A loja ainda está em preparação." }, 503);
  }
  if (!origin)
    return response({ error: "Abra o pagamento pela página da loja." }, 403);
  if (!request.headers.get("Content-Type")?.startsWith("application/json"))
    return response({ error: "Formato de pedido inválido." }, 415);
  let payload: unknown;
  try {
    const body = await request.text();
    if (body.length > 2048) return response({ error: "Pedido inválido." }, 400);
    payload = JSON.parse(body);
  } catch {
    return response({ error: "Pedido inválido." }, 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return response({ error: "Pedido inválido." }, 400);
  const values = payload as Record<string, unknown>;
  if (
    Object.keys(values).length !== 2 ||
    !findBundle(values.bundleId) ||
    typeof values.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      values.requestId,
    )
  )
    return response({ error: "Escolha um kit válido e tente novamente." }, 400);
  const store = storeConfig(env);
  if (!store.checkoutReady)
    return response(
      {
        error:
          "A loja está em preparação. O pagamento ainda não está disponível.",
      },
      503,
    );
  try {
    const reference = "BDH-" + values.requestId.slice(0, 8).toUpperCase();
    const stripeResponse = await stripeFetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": "bdh-" + values.requestId + "-" + values.bundleId,
        },
        body: checkoutParams(values.bundleId, origin, reference, store),
        signal: AbortSignal.timeout(18000),
      },
    );
    if (!stripeResponse.ok)
      return response(
        {
          error:
            "Não foi possível abrir o pagamento. Tente novamente em instantes.",
        },
        502,
      );
    const session = (await stripeResponse.json()) as { url?: string };
    const url = new URL(session.url || "");
    if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
      throw new Error("Invalid Checkout URL");
    return response({ url: url.href });
  } catch {
    return response(
      {
        error:
          "Não foi possível abrir o pagamento. Seu pedido não foi cobrado nesta página. Tente novamente.",
      },
      502,
    );
  }
}
export async function handleOrderStatus(
  request: Request,
  env: CommerceEnv,
  stripeFetch: typeof fetch = fetch,
) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId || !/^cs_(test_|live_)?[a-zA-Z0-9]{20,220}$/.test(sessionId))
    return response({ error: "Não foi possível identificar o pedido." }, 400);
  if (!env.STRIPE_SECRET_KEY)
    return response(
      { error: "A confirmação do pagamento está indisponível." },
      503,
    );
  try {
    const result = await stripeFetch(
      "https://api.stripe.com/v1/checkout/sessions/" +
        encodeURIComponent(sessionId),
      {
        headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!result.ok)
      return response(
        {
          error:
            "Não foi possível consultar este pedido. Procure o atendimento.",
        },
        404,
      );
    const session = (await result.json()) as {
      payment_status: string;
      status: string;
      mode: string;
      currency: string;
      amount_total: number;
      metadata: Record<string, string>;
    };
    const bundle = findBundle(session.metadata?.bundle_id);
    if (
      session.metadata?.store !== "bem-de-hoje" ||
      !bundle ||
      session.mode !== "payment" ||
      session.currency !== "brl" ||
      session.amount_total !== bundle.priceCents
    )
      return response(
        { error: "Não foi possível confirmar este pedido." },
        404,
      );
    return response({
      status:
        session.payment_status === "paid"
          ? "paid"
          : session.status === "expired"
            ? "expired"
            : "pending",
      orderReference: /^BDH-[A-F0-9]{8}$/.test(
        session.metadata.order_reference || "",
      )
        ? session.metadata.order_reference
        : "",
      quantity: bundle.quantity,
      totalCents: bundle.priceCents,
    });
  } catch {
    return response(
      { error: "A consulta está indisponível no momento. Tente novamente." },
      502,
    );
  }
}
