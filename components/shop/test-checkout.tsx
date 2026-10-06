"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { money, testProduct, type StoreConfig } from "@/lib/catalog";
import { paymentUrl } from "@/lib/commerce/payment-url";
import PaymentStatus from "./payment-status";

export default function TestCheckout({ ready, store }: { ready: boolean; store: StoreConfig }) {
  const requestId = useRef<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => activeRequest.current?.abort(), []);
  async function pay() {
    if (!ready || activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    setBusy(true); setError("");
    try {
      requestId.current ||= crypto.randomUUID();
      const result = await fetch("/api/checkout", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId: testProduct.id, requestId: requestId.current }),
      });
      const data = await result.json() as { url?: unknown; error?: string };
      if (!result.ok) throw new Error(data.error || "Não foi possível preparar o pagamento.");
      const url = paymentUrl(data.url);
      if (!url) throw new Error("O endereço de pagamento não pôde ser confirmado.");
      if (!controller.signal.aborted) {
        try { sessionStorage.removeItem("bem-de-hoje-payment"); } catch {}
        location.assign(url);
      }
    } catch (cause) {
      setError(controller.signal.aborted ? "O pagamento demorou para abrir. Tente novamente em um minuto."
        : cause instanceof Error ? cause.message : "Não foi possível abrir o pagamento.");
    } finally {
      window.clearTimeout(timeout);
      activeRequest.current = null; setBusy(false);
    }
  }
  return <>
    <header className="test-header wrap"><Link className="brand" href="/">Bem de Hoje<span className="brand-dot">.</span></Link><Link className="text-button" href="/">Voltar para a loja</Link></header>
    <PaymentStatus help={() => document.getElementById("test-contact")?.scrollIntoView({ behavior: "smooth" })} />
    <main className="test-main wrap">
      <p className="eyebrow">VERIFICAÇÃO DO PAGAMENTO</p>
      <h1>Um pequeno teste.<br /><em>O mesmo checkout.</em></h1>
      <p className="test-intro">Confira a compra e a confirmação na InfinitePay com um produto de teste de R$ 1,00.</p>
      <section className="test-card" aria-labelledby="test-product-title">
        <div><p className="eyebrow">PRODUTO DE TESTE</p><h2 id="test-product-title">Teste do checkout</h2><p>Esta é uma cobrança real e única, sem envio de produto físico.</p><p>O teste usa o mesmo registro de pedido, pagamento e confirmação da loja.</p></div>
        <div className="test-price"><p>Total</p><strong>{money(testProduct.priceCents)}</strong><button className="primary-button" onClick={pay} disabled={!ready || busy}>{busy ? "Preparando pagamento…" : "Testar compra de R$ 1,00"}<ArrowRight size={20} aria-hidden="true" /></button><p className="test-security"><LockKeyhole size={15} aria-hidden="true" /> Pagamento seguro na InfinitePay</p>{!ready && <p role="status">O produto de teste está desativado no momento.</p>}{error && <p className="test-error" role="alert">{error}</p>}</div>
      </section>
      <section id="test-contact" className="test-contact" aria-labelledby="test-contact-title"><h2 id="test-contact-title">Atendimento da loja</h2><p>{store.companyName}{store.taxId && <> · CNPJ {store.taxId}</>}</p>{store.email && <a href={"mailto:" + store.email}>{store.email}</a>}{store.phone && <a href={"tel:" + store.phone.replace(/[^+\d]/g, "")}>{store.phone}</a>}<p>Na InfinitePay, o recebedor é Mateus Diniz Gottardi, da conta $mateus-diniz-5eo.</p></section>
    </main>
  </>;
}
