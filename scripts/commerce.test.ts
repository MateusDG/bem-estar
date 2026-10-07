import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { checkoutParams, handleCheckout, handleOrderStatus, handleWebhook, storeConfig, validCnpj, type CommerceEnv } from "../lib/commerce/checkout.ts";
import { OrderStore } from "../lib/commerce/orders.ts";
import { paymentUrl } from "../lib/commerce/payment-url.ts";
import { bundles, testProduct } from "../lib/catalog.ts";
// All providers below are simulated: tests never send requests or payments.
const origin = "https://store.example.test";
const env: CommerceEnv = { INFINITEPAY_HANDLE: "fixture-merchant", COMMERCE_DATA_DIR: "/tmp/fixture-orders", SITE_URL: origin, CHECKOUT_ENABLED: "true", NODE_ENV: "production" };
const requestId = "d9c05515-811a-4e85-bd87-5a7b0f0b2329";
const transaction = "fc7c6f60-8032-4fb5-9d43-10e0dd6c5e12";
const paymentLink = "https://checkout.infinitepay.io/fixture-merchant?lenc=fixture";
const offline = (() => { throw new Error("External network forbidden"); }) as typeof fetch;
function fixture(t: test.TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "bdh-orders-test-"));
  const orders = new OrderStore(directory);
  // Windows can briefly retain WAL file handles after closing SQLite.
  t.after(() => { orders.close(); rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); });
  return { directory, orders };
}
test("Windows development storage works but cannot silently bypass production privacy checks", { skip: process.platform !== "win32" }, t => {
  const { directory, orders } = fixture(t);
  assert.ok(orders.reserve(randomUUID(), bundles[0], "fixture-merchant").order.nsu);
  assert.throws(() => new OrderStore(directory, true), /POSIX file permissions/);
});
test("POSIX order storage rejects a directory accessible by other users", { skip: process.platform === "win32" }, t => {
  const directory = mkdtempSync(join(tmpdir(), "bdh-orders-test-permissions-"));
  t.after(() => rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  chmodSync(directory, 0o755);
  assert.throws(() => new OrderStore(directory), /private \(0700\)/);
});
function post(body: unknown, source = origin, internal = origin) {
  return new Request(internal + "/api/checkout", { method: "POST", headers: { Origin: source, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
function reserve(orders: OrderStore, bundle = bundles[0]) {
  return orders.reserve(randomUUID(), bundle, env.INFINITEPAY_HANDLE!).order;
}
function status(nsu: string, extra = "") { return new Request(origin + "/api/order-status?order_nsu=" + nsu + extra); }
function webhook(nsu: string, changes: Record<string, unknown> = {}) {
  return new Request(origin + "/api/webhooks/infinitepay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_nsu: nsu, transaction_nsu: transaction, invoice_slug: "invoice-fixture", amount: 3990, ...changes }) });
}
const paid = (() => Promise.resolve(Response.json({ success: true, paid: true, amount: 3990, paid_amount: 4000, capture_method: "pix" }))) as typeof fetch;

test("three kits send one item at the exact kit total and no shipping fee", () => {
  for (const [index, bundle] of bundles.entries()) {
    const data = checkoutParams(bundle.id, origin, "BDH-fixture", env);
    assert.deepEqual(data.items.map(item => [item.quantity, item.price]), [[1, [3990, 6990, 10990][index]]]);
    assert.match(data.items[0].description, new RegExp(bundle.label));
    assert.match(data.items[0].description, /Frete grátis/);
    assert.equal(data.handle, "fixture-merchant");
    assert.equal(data.redirect_url, origin + "/?checkout=complete");
    assert.equal(data.webhook_url, origin + "/api/webhooks/infinitepay");
  }
});

test("R$1 test product is opt-in and cannot accept a price override", async t => {
  const { orders } = fixture(t);
  const testEnv = { ...env, CHECKOUT_TEST_ENABLED: "true" };
  assert.throws(() => checkoutParams("test", origin, "BDH-fixture", env), /Invalid bundle/);
  assert.equal((await handleCheckout(post({ bundleId: "test", requestId }), env, { fetch: offline })).status, 400);
  assert.equal((await handleCheckout(post({ bundleId: "test", requestId, price: 1 }), testEnv, { fetch: offline })).status, 400);
  const provider = (async (_url, options) => {
    const data = JSON.parse(String(options?.body));
    assert.equal(data.items[0].price, 100);
    assert.equal(data.items[0].quantity, 1);
    assert.match(data.items[0].description, /sem entrega de produto físico/);
    assert.equal(data.redirect_url, origin + "/teste-checkout?checkout=complete");
    assert.equal(data.webhook_url, origin + "/api/webhooks/infinitepay");
    return Response.json({ url: paymentLink });
  }) as typeof fetch;
  const created = await handleCheckout(post({ bundleId: "test", requestId }), testEnv, { orders, fetch: provider });
  assert.equal(created.status, 200);
  const { orderReference } = await created.json();
  assert.equal(orders.get(orderReference)?.amount, 100);
  assert.equal(orders.get(orderReference)?.bundle_id, "test");
});

test("test payment follows real verification and remains identifiable after test product is disabled", async t => {
  const { orders } = fixture(t);
  const order = orders.reserve(randomUUID(), testProduct, env.INFINITEPAY_HANDLE!).order;
  const provider = (() => Promise.resolve(Response.json({ success: true, paid: true, amount: 100, paid_amount: 100, capture_method: "pix" }))) as typeof fetch;
  assert.equal((await handleWebhook(webhook(order.nsu, { amount: 100 }), env, { orders, fetch: provider })).status, 200);
  assert.deepEqual(await (await handleOrderStatus(status(order.nsu), env, { orders, fetch: offline })).json(), {
    status: "paid", orderReference: order.nsu, quantity: 1, totalCents: 100, isTest: true,
  });
});
test("readiness requires a public handle, private persistent directory, enabled flag and HTTPS origin", () => {
  assert.equal(storeConfig(env).checkoutReady, true);
  for (const key of ["INFINITEPAY_HANDLE", "COMMERCE_DATA_DIR", "SITE_URL"]) assert.equal(storeConfig({ ...env, [key]: "" }).checkoutReady, false);
  for (const changes of [{ CHECKOUT_ENABLED: "false" }, { INFINITEPAY_HANDLE: "$fixture" }, { COMMERCE_DATA_DIR: "./orders" }, { COMMERCE_DATA_DIR: process.cwd() + "/orders" }, { COMMERCE_DATA_DIR: "/tmp/public_html/orders" }, { SITE_URL: "http://store.example.test" }, { SITE_URL: origin + "/checkout" }, { DELIVERY_MAX_DAYS: "invalid" }, { DELIVERY_MIN_DAYS: "11", DELIVERY_MAX_DAYS: "10" }]) assert.equal(storeConfig({ ...env, ...changes }).checkoutReady, false);
  assert.equal(storeConfig(env).deliveryMaxDays, 10);
  assert.equal(storeConfig(env).deliveryMinDays, null);
});
test("CNPJ validation still supports valid numeric and alphanumeric formats", () => {
  assert.equal(validCnpj("45.475.531/0001-79"), true);
  assert.equal(validCnpj("11.222.333/0001-81"), true);
  assert.equal(validCnpj("00000000000000"), false);
  assert.equal(validCnpj("11.222.333/0001-80"), false);
});
test("request validation rejects foreign origins, malformed bodies and client price overrides before contacting provider", async () => {
  assert.equal((await handleCheckout(post({ bundleId: "one", requestId }, "https://evil.example"), env, { fetch: offline })).status, 403);
  for (const body of [null, [], {}, { bundleId: "fake", requestId }, { bundleId: "one", requestId: "../etc" }, { bundleId: "one", requestId, price: 1 }, { bundleId: "one", requestId, filler: "a".repeat(3000) }]) assert.equal((await handleCheckout(post(body), env, { fetch: offline })).status, 400);
});
test("disabled checkout cannot create orders or call provider", async () => {
  assert.equal((await handleCheckout(post({ bundleId: "one", requestId }), { ...env, CHECKOUT_ENABLED: "false" }, { fetch: offline })).status, 503);
});
test("production proxy internal addresses use the configured public callback and webhook", async t => {
  const { orders } = fixture(t);
  const provider = (async (_url, options) => {
    const data = JSON.parse(String(options?.body));
    assert.equal(data.redirect_url, origin + "/?checkout=complete");
    assert.equal(data.webhook_url, origin + "/api/webhooks/infinitepay");
    assert.equal(data.items[0].price, 6990);
    return Response.json({ url: paymentLink });
  }) as typeof fetch;
  assert.equal((await handleCheckout(post({ bundleId: "two", requestId }, origin, "http://127.0.0.1:3000"), env, { orders, fetch: provider })).status, 200);
  assert.equal((await handleCheckout(post({ bundleId: "one", requestId }, "http://localhost:3000", "http://localhost:3000"), env, { fetch: offline })).status, 403);
});
test("development permits only matching loopback host and port", async t => {
  const { orders } = fixture(t);
  const local = "http://127.0.0.1:5173";
  const provider = (async (_url, options) => {
    assert.equal(JSON.parse(String(options?.body)).redirect_url, local + "/?checkout=complete");
    return Response.json({ url: paymentLink });
  }) as typeof fetch;
  assert.equal((await handleCheckout(post({ bundleId: "one", requestId }, local, local), { ...env, NODE_ENV: "development" }, { orders, fetch: provider })).status, 200);
  assert.equal((await handleCheckout(post({ bundleId: "one", requestId }, "http://127.0.0.1:9999", local), { ...env, NODE_ENV: "development" }, { fetch: offline })).status, 403);
});
test("retry after process restart reuses the persisted URL and order reference", async t => {
  const { directory, orders } = fixture(t);
  const provider = (() => Promise.resolve(Response.json({ url: paymentLink }))) as typeof fetch;
  const first = await (await handleCheckout(post({ bundleId: "one", requestId }), env, { orders, fetch: provider })).json();
  const reopened = new OrderStore(directory);
  try {
    const second = await (await handleCheckout(post({ bundleId: "one", requestId }), env, { orders: reopened, fetch: offline })).json();
    assert.deepEqual(second, first);
  } finally { reopened.close(); }
});
test("two workers cannot create competing links for the same reserved request", t => {
  const { directory, orders } = fixture(t);
  const other = new OrderStore(directory);
  try {
    const a = orders.reserve(requestId, bundles[0], env.INFINITEPAY_HANDLE!);
    const b = other.reserve(requestId, bundles[0], env.INFINITEPAY_HANDLE!);
    assert.equal(a.claimed, true); assert.equal(b.claimed, false);
    assert.equal(a.order.nsu, b.order.nsu);
  } finally { other.close(); }
});
test("provider HTTP errors expose no upstream message", async t => {
  const { orders } = fixture(t);
  const provider = (() => Promise.resolve(Response.json({ secret: "provider-private-error" }, { status: 401 }))) as typeof fetch;
  const result = await handleCheckout(post({ bundleId: "one", requestId }), env, { orders, fetch: provider });
  assert.equal(result.status, 502);
  assert.doesNotMatch(await result.text(), /provider-private-error/);
});
test("redirect validation rejects insecure protocols, spoofed hosts, userinfo and ports", () => {
  assert.equal(paymentUrl(paymentLink), paymentLink);
  assert.ok(paymentUrl("https://checkout.infinitepay.com.br/fixture"));
  for (const value of ["http://checkout.infinitepay.io/x", "https://checkout.infinitepay.io.evil.example/x", "https://user@checkout.infinitepay.io/x", "https://checkout.infinitepay.io:444/x", "javascript:alert(1)", "https://checkout.stripe.com/x"]) assert.equal(paymentUrl(value), null);
});
test("untrusted provider redirect never reaches the customer", async t => {
  const { orders } = fixture(t);
  const provider = (() => Promise.resolve(Response.json({ url: "https://evil.example" }))) as typeof fetch;
  assert.equal((await handleCheckout(post({ bundleId: "one", requestId }), env, { orders, fetch: provider })).status, 502);
});
test("payment return is verified server-to-server, accepting separate installment fees", async t => {
  const { orders } = fixture(t); const order = reserve(orders);
  const provider = (async (url, options) => {
    assert.equal(url, "https://api.checkout.infinitepay.io/payment_check");
    assert.deepEqual(JSON.parse(String(options?.body)), { handle: order.handle, order_nsu: order.nsu, transaction_nsu: transaction, slug: "invoice-fixture" });
    return paid(url, options);
  }) as typeof fetch;
  const result = await handleOrderStatus(status(order.nsu, "&transaction_nsu=" + transaction + "&slug=invoice-fixture"), env, { orders, fetch: provider });
  assert.deepEqual(await result.json(), { status: "paid", orderReference: order.nsu, quantity: 1, totalCents: 3990 });
  assert.equal(orders.get(order.nsu)?.paid_amount, 4000);
});
test("an order reference alone never fabricates payment approval", async t => {
  const { orders } = fixture(t); const order = reserve(orders);
  const result = await handleOrderStatus(status(order.nsu), env, { orders, fetch: offline });
  assert.equal((await result.json()).status, "pending");
});
test("paid browser query and forged webhook cannot override pending provider status", async t => {
  const { orders } = fixture(t); const order = reserve(orders);
  const pending = (() => Promise.resolve(Response.json({ success: true, paid: false }))) as typeof fetch;
  const result = await handleWebhook(webhook(order.nsu, { paid: true }), env, { orders, fetch: pending });
  assert.equal(result.status, 400);
  assert.equal(orders.get(order.nsu)?.state, "pending");
});
test("wrong amounts, invalid provider shapes and provider outages keep the order unpaid", async t => {
  const { orders } = fixture(t); const order = reserve(orders);
  for (const data of [{ success: true, paid: true, amount: 1, paid_amount: 3990, capture_method: "pix" }, { success: false, paid: true, amount: 3990 }, { success: true, paid: "true" }, { success: true, paid: true, amount: 3990, paid_amount: 1, capture_method: "pix" }]) {
    const provider = (() => Promise.resolve(Response.json(data))) as typeof fetch;
    assert.equal((await handleWebhook(webhook(order.nsu), env, { orders, fetch: provider })).status, 400);
    assert.equal(orders.get(order.nsu)?.state, "pending");
  }
  assert.equal((await handleWebhook(webhook(order.nsu), env, { orders, fetch: offline })).status, 400);
});
test("webhook acknowledgment follows verified durable payment and duplicate events are idempotent", async t => {
  const { directory, orders } = fixture(t); const order = reserve(orders);
  const result = await handleWebhook(webhook(order.nsu), env, { orders, fetch: paid });
  assert.deepEqual(await result.json(), { success: true, message: null });
  assert.equal(result.status, 200);
  const reopened = new OrderStore(directory);
  try {
    assert.equal(reopened.get(order.nsu)?.state, "paid");
    assert.equal((await handleWebhook(webhook(order.nsu), env, { orders: reopened, fetch: offline })).status, 200);
    assert.equal((await handleWebhook(webhook(order.nsu, { transaction_nsu: randomUUID() }), env, { orders: reopened, fetch: offline })).status, 400);
    assert.equal((await (await handleOrderStatus(status(order.nsu), env, { orders: reopened, fetch: offline })).json()).status, "paid");
  } finally { reopened.close(); }
});
test("invalid webhook, unknown order, wrong notified amount and oversized body are rejected before verification", async t => {
  const { orders } = fixture(t); const order = reserve(orders);
  for (const request of [webhook("../fake"), webhook("BDH-" + randomUUID()), webhook(order.nsu, { amount: 1 }), webhook(order.nsu, { extra: "a".repeat(17000) })]) assert.equal((await handleWebhook(request, env, { orders, fetch: offline })).status, 400);
});
test("a provider transaction cannot confirm two local orders", async t => {
  const { orders } = fixture(t); const one = reserve(orders); const two = reserve(orders);
  assert.equal((await handleWebhook(webhook(one.nsu), env, { orders, fetch: paid })).status, 200);
  assert.equal((await handleWebhook(webhook(two.nsu), env, { orders, fetch: paid })).status, 400);
  assert.equal(orders.get(two.nsu)?.state, "pending");
});
test("paid requests cannot reopen a payment link", async t => {
  const { orders } = fixture(t);
  const order = orders.reserve(requestId + ":one", bundles[0], env.INFINITEPAY_HANDLE!).order;
  orders.confirm(order.nsu, { transaction, slug: "fixture", paidAmount: 3990, method: "pix" });
  assert.equal((await handleCheckout(post({ bundleId: "one", requestId }), env, { orders, fetch: offline })).status, 409);
});
test("public configuration and status expose no credentials, private path or provider metadata", async t => {
  const { orders } = fixture(t); const order = reserve(orders);
  const config = JSON.stringify(storeConfig(env));
  assert.doesNotMatch(config, /INFINITEPAY|COMMERCE_DATA_DIR|fixture-merchant|fixture-orders|inchk_/);
  const result = await handleOrderStatus(status(order.nsu), env, { orders, fetch: offline });
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.doesNotMatch(await result.text(), /handle|transaction_nsu|capture_method|invoice_slug|checkout_url/);
});
