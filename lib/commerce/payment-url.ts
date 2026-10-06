// Shared by the server and the browser. Never accept an arbitrary payment host.
export function paymentUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.port && ["checkout.infinitepay.io", "checkout.infinitepay.com.br"].includes(url.hostname)
      ? url.href : null;
  } catch { return null; }
}
