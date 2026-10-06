import test from "node:test";
import assert from "node:assert/strict";
import { checkoutParams, handleCheckout, handleOrderStatus, storeConfig, validCnpj, type CommerceEnv } from "../lib/commerce/checkout.ts";
import { bundles, siteOrigin } from "../lib/catalog.ts";
// All values below are isolated fixtures. No Stripe request is sent by these tests.
const fixtureEnv: CommerceEnv = { STRIPE_SECRET_KEY: "sk_test_fixture", CHECKOUT_ENABLED: "true", STORE_COMPANY_NAME: "Fixture only", STORE_CNPJ: "11222333000181", STORE_ADDRESS: "Fixture address", STORE_EMAIL: "test@example.invalid", DELIVERY_MIN_DAYS: "3", DELIVERY_MAX_DAYS: "8" };
const requestId = "d9c05515-811a-4e85-bd87-5a7b0f0b2329";
const post = (body: unknown, origin = siteOrigin) => new Request(siteOrigin + "/api/checkout", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
const offline = (() => { throw new Error("No external network allowed in this test"); }) as typeof fetch;
test("each server-side kit has its exact total and free BR shipping", () => {
  for (const bundle of bundles) {
    const params = checkoutParams(bundle.id, siteOrigin, "BDH-TEST", storeConfig(fixtureEnv));
    assert.equal(params.get("line_items[0][price_data][unit_amount]"), String(bundle.priceCents));
    assert.equal(params.get("line_items[0][quantity]"), "1");
    assert.equal(params.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"), "0");
    assert.equal(params.get("shipping_address_collection[allowed_countries][0]"), "BR");
    assert.equal(params.get("mode"), "payment");
    assert.equal(params.get("metadata[bottle_quantity]"), String(bundle.quantity));
  }
});
test("checkout stays closed without credentials, merchant data or a real delivery estimate", () => {
  assert.equal(storeConfig({}).checkoutReady, false);
  assert.equal(storeConfig(fixtureEnv).checkoutReady, true);
  for (const key of ["STRIPE_SECRET_KEY", "STORE_EMAIL", "STORE_COMPANY_NAME", "STORE_ADDRESS", "STORE_CNPJ", "DELIVERY_MIN_DAYS"] as const) assert.equal(storeConfig({...fixtureEnv, [key]: ""}).checkoutReady, false, key);
  assert.equal(storeConfig({...fixtureEnv, CHECKOUT_ENABLED: "false"}).checkoutReady, false);
  assert.equal(storeConfig({...fixtureEnv, DELIVERY_MAX_DAYS: "2"}).checkoutReady, false);
});
test("numeric and new alphanumeric CNPJ formats are checked", () => {
  assert.equal(validCnpj("11.222.333/0001-81"), true);
  assert.equal(validCnpj("12.ABC.345/01DE-35"), true);
  assert.equal(validCnpj("00.000.000/0000-00"), false);
  assert.equal(validCnpj("12.ABC.345/01DE-34"), false);
});
test("client cannot override price, shipping or bundle", async () => {
  for (const payload of [{bundleId:"two", requestId, priceCents:1}, {bundleId:"four", requestId}, {bundleId:"one", requestId:"invalid"}, {bundleId:"one", requestId, shipping:0}]) assert.equal((await handleCheckout(post(payload), fixtureEnv, offline)).status, 400);
});
test("cross-origin checkout is rejected before Stripe is called", async () => {
  assert.equal((await handleCheckout(post({bundleId:"one", requestId}, "https://attacker.invalid"), fixtureEnv, offline)).status, 403);
});
test("unconfigured checkout returns a clear preparation message", async () => {
  const result = await handleCheckout(post({bundleId:"one", requestId}), {}, offline);
  assert.equal(result.status, 503);
  assert.match((await result.json() as {error:string}).error, /preparação/);
});
test("Stripe receives server pricing, free shipping and a stable idempotency key", async () => {
  const calls: RequestInit[] = [];
  const mock = (async (_url: unknown, init: RequestInit) => { calls.push(init); return Response.json({url:"https://checkout.stripe.com/c/pay/cs_test_fixture"}); }) as typeof fetch;
  for (let attempt = 0; attempt < 2; attempt++) assert.equal((await handleCheckout(post({bundleId:"two", requestId}), fixtureEnv, mock)).status, 200);
  const params = new URLSearchParams(String(calls[0].body));
  assert.equal(params.get("line_items[0][price_data][unit_amount]"), "9990");
  assert.equal(params.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"), "0");
  assert.equal(new Headers(calls[0].headers).get("Idempotency-Key"), new Headers(calls[1].headers).get("Idempotency-Key"));
  assert.equal(params.get("phone_number_collection[enabled]"), "true");
});
test("Stripe errors and unexpected redirect hosts never leak details or redirect", async () => {
  const fail = (async () => Response.json({error:{message:"internal sensitive detail"}}, {status:400})) as typeof fetch;
  const result = await handleCheckout(post({bundleId:"one", requestId}), fixtureEnv, fail);
  assert.equal(result.status, 502); assert.doesNotMatch(await result.text(), /sensitive/);
  const unexpected = (async () => Response.json({url:"https://attacker.invalid/payment"})) as typeof fetch;
  assert.equal((await handleCheckout(post({bundleId:"one", requestId}), fixtureEnv, unexpected)).status, 502);
});
test("order confirmation depends on Stripe status and returns no personal data", async () => {
  const request = new Request(siteOrigin + "/api/order-status?session_id=cs_test_" + "a".repeat(30));
  const session = {mode:"payment", currency:"brl", amount_total:9990, payment_status:"unpaid", status:"complete", metadata:{store:"bem-de-hoje", bundle_id:"two", order_reference:"BDH-12345678"}, customer_details:{email:"private@example.invalid", address:{line1:"private"}}};
  const mock = (async () => Response.json(session)) as typeof fetch;
  assert.equal((await (await handleOrderStatus(request, fixtureEnv, mock)).json() as {status:string}).status, "pending");
  session.payment_status = "paid";
  const paid = await (await handleOrderStatus(request, fixtureEnv, mock)).json();
  assert.equal((paid as {status:string}).status, "paid"); assert.doesNotMatch(JSON.stringify(paid), /private/);
  session.amount_total = 1;
  assert.equal((await handleOrderStatus(request, fixtureEnv, mock)).status, 404);
});
test("foreign-store orders and forged return URLs do not confirm payment", async () => {
  assert.equal((await handleOrderStatus(new Request(siteOrigin + "/api/order-status?session_id=invalid"), fixtureEnv, offline)).status, 400);
  const wrongStore = (async () => Response.json({mode:"payment", currency:"brl", amount_total:6990, payment_status:"paid", metadata:{store:"another", bundle_id:"one"}})) as typeof fetch;
  assert.equal((await handleOrderStatus(new Request(siteOrigin + "/api/order-status?session_id=cs_test_" + "b".repeat(30)), fixtureEnv, wrongStore)).status, 404);
});
