"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Info, RotateCcw } from "lucide-react";
type OrderState = { status: "paid" | "pending" | "expired"; orderReference: string; quantity: number; totalCents: number };
export default function PaymentStatus({ help }: { help: () => void }) {
  const [sessionId, setSessionId] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [order, setOrder] = useState<OrderState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Stripe return parameters exist only in the browser after hydration.
    if (params.get("checkout") === "cancelled") setCancelled(true);
    if (params.get("checkout") === "complete") {
      const id = params.get("session_id");
      if (id) setSessionId(id); else setError("Não foi possível identificar seu pedido. Consulte o atendimento.");
    }
    if (params.has("checkout") || params.has("session_id")) {
      params.delete("checkout"); params.delete("session_id");
      history.replaceState(null, "", location.pathname + (params.size ? "?" + params.toString() : "") + location.hash);
    }
  }, []);
  const checkPayment = useCallback(async () => {
    if (!sessionId) return;
    setBusy(true); setError("");
    try {
      const result = await fetch("/api/order-status?session_id=" + encodeURIComponent(sessionId), { cache: "no-store" });
      const data = await result.json() as OrderState & { error?: string };
      if (!result.ok) throw new Error(data.error || "Não foi possível consultar seu pedido.");
      setOrder(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "A consulta está indisponível."); }
    finally { setBusy(false); }
  }, [sessionId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- A newly hydrated Stripe session starts an external payment-status request.
  useEffect(() => { void checkPayment(); }, [checkPayment]);
  if (!cancelled && !sessionId && !error) return null;
  const paid = order?.status === "paid";
  return <section className={"payment-status wrap " + (paid ? "confirmed" : "")} role="status" aria-live="polite"><div className="status-icon">{paid ? <CheckCircle2 aria-hidden="true" /> : cancelled ? <Info aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</div><div><h2>{paid ? "Pagamento confirmado." : cancelled ? "Você voltou para a loja." : order?.status === "expired" ? "Este pagamento expirou." : busy ? "Consultando seu pagamento…" : "Vamos confirmar seu pagamento."}</h2><p>{paid ? <>Pedido {order.orderReference || "confirmado"} · {order.quantity} {order.quantity === 1 ? "frasco" : "frascos"}. Nossa equipe enviará as atualizações da entrega pelo contato informado na compra.</> : cancelled ? "Seu kit continua selecionado. Você pode conferir o pedido e tentar o pagamento novamente." : order?.status === "expired" ? "Escolha seu kit e abra um novo pagamento para continuar." : error || "Seu pagamento ainda está pendente de confirmação. Consulte novamente em instantes."}</p>{!paid && sessionId && order?.status !== "expired" && <button className="text-button" onClick={checkPayment} disabled={busy}><RotateCcw size={16} aria-hidden="true" /> {busy ? "Consultando…" : "Consultar novamente"}</button>}{!cancelled && !paid && <button className="text-button" onClick={help}>Consultar o atendimento</button>}</div></section>;
}
