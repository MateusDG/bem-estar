"use client";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { findBundle, type BundleId } from "@/lib/catalog";
export function useShopTools(
  bundleId: BundleId | null,
  select: (id: BundleId) => void,
  review: () => boolean,
  checkoutReady: boolean,
) {
  const current = useRef({ bundleId, select, review, checkoutReady });
  useEffect(() => {
    current.current = { bundleId, select, review, checkoutReady };
  });
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const summary = () => {
      const bundle = findBundle(current.current.bundleId);
      return {
        bundleId: bundle?.id ?? null,
        bottles: bundle?.quantity ?? 0,
        product: "Coenzima Q10 Nutrify",
        totalCents: bundle?.priceCents ?? null,
        currency: "BRL",
        shippingCents: 0,
        recurring: false,
        selectionRequired: !bundle,
        checkoutReady: current.current.checkoutReady,
      };
    };
    const emptyInput = (input: unknown) => {
      if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input) ||
        Object.keys(input).length
      )
        throw new Error("This action expects an empty object.");
    };
    const register = (
      tool: Parameters<
        NonNullable<Document["modelContext"]>["registerTool"]
      >[0],
    ) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: "bdh_select_bundle",
      title: "Escolher kit",
      description:
        "Select a kit and update the visible order summary. Does not submit a payment or purchase.",
      inputSchema: {
        type: "object",
        properties: {
          bundleId: { type: "string", enum: ["one", "two", "three"] },
        },
        required: ["bundleId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (
          !input ||
          typeof input !== "object" ||
          Array.isArray(input) ||
          Object.keys(input).length !== 1
        )
          throw new Error("Provide only bundleId.");
        const bundle = findBundle((input as { bundleId?: unknown }).bundleId);
        if (!bundle) throw new Error("Unknown kit. Choose one, two or three.");
        flushSync(() => current.current.select(bundle.id));
        document
          .getElementById("kits")
          ?.scrollIntoView({ behavior: "instant" });
        return summary();
      },
    });
    register({
      name: "bdh_get_order_summary",
      title: "Consultar pedido",
      description:
        "Read the selected kit, total and checkout availability. Prices are in BRL cents.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        emptyInput(input);
        return summary();
      },
    });
    register({
      name: "bdh_review_order",
      title: "Revisar pedido",
      description:
        "Open the order review after a kit is selected; otherwise focus the kit choices. Does not open InfinitePay or complete a purchase.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        emptyInput(input);
        let reviewOpen = false;
        flushSync(() => {
          reviewOpen = current.current.review();
        });
        return { ...summary(), reviewOpen };
      },
    });
    return () => lifecycle.abort();
  }, []);
}
