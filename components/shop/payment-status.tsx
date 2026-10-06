"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Info, RotateCcw } from "lucide-react";
type OrderState = { status: "paid" | "pending"; orderReference: string; quantity: number; totalCents: number };
const storageKey = "bem-de-hoje-payment";
export default function PaymentStatus({ help }: { help: () => void }) {
  const [query, setQuery] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [order, setOrder] = useState<OrderState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const complete = params.get("checkout") === "complete" || params.has("order_nsu");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Payment-return data exists only in the browser after hydration.
    if (params.get("checkout") === "cancelled") setCancelled(true);
    if (complete) {
      if (params.get("order_nsu")) {
        const values = new URLSearchParams();
        for (const key of ["order_nsu", "transaction_nsu", "slug"]) {
          const value = params.get(key);
          if (value) values.set(key, value);
        }
        setQuery(values.toString());
        try { sessionStorage.setItem(storageKey, values.toString()); } catch {}
      } else setError("Não foi possível identificar seu pedido. Consulte o atendimento.");
    } else if (!params.has("checkout")) {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) setQuery(saved);
      } catch {}
    }
    if (complete || params.has("checkout")) {
      // Never leave payment/receipt identifiers in links, browser history or referrers.
      for (const key of ["checkout", "order_nsu", "transaction_nsu", "slug", "receipt_url", "capture_method", "session_id"]) params.delete(key);
      history.replaceState(null, "", location.pathname + (params.size ? "?" + params.toString() : "") + location.hash);
    }
  }, []);
  const checkPayment = useCallback(async () => {
    if (!query) return;
    setBusy(true); setError("");
    try {
      const result = await fetch("/api/order-status?" + query, { cache: "no-store" });
      const data = await result.json() as OrderState & { error?: string };
      if (!result.ok) throw new Error(data.error || "Não foi possível consultar seu pedido.");
      setOrder(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "A consulta está indisponível."); }
    finally { setBusy(false); }
  }, [query]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrating the return starts an external payment-status request.
  useEffect(() => { void checkPayment(); }, [checkPayment]);
  if (!cancelled && !query && !error) return null;
  const paid = order?.status === "paid";
  return <section className={"payment-status wrap " + (paid ? "confirmed" : "")} role="status" aria-live="polite"><div className="status-icon">{paid ? <CheckCircle2 aria-hidden="true" /> : cancelled ? <Info aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</div><div><h2>{paid ? "Pagamento confirmado." : cancelled ? "Você voltou para a loja." : busy ? "Consultando seu pagamento…" : "Vamos confirmar seu pagamento."}</h2><p>{paid ? <>Pedido {order.orderReference} · {order.quantity} {order.quantity === 1 ? "frasco" : "frascos"}. Nossa equipe enviará as atualizações da entrega pelo contato informado na compra.</> : cancelled ? "Seu kit continua selecionado. Você pode conferir o pedido e tentar o pagamento novamente." : error || "Seu pagamento ainda está pendente de confirmação. Consulte novamente em instantes."}</p>{!paid && query && <button className="text-button" onClick={checkPayment} disabled={busy}><RotateCcw size={16} aria-hidden="true" /> {busy ? "Consultando…" : "Consultar novamente"}</button>}{!cancelled && !paid && <button className="text-button" onClick={help}>Consultar o atendimento</button>}</div></section>;
}
