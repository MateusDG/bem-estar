"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Contrast, Headphones, Leaf, LockKeyhole, Minus, Package, Plus, ShoppingBag, Sun, Truck, ZoomIn, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ProductDetails from "./product-details";
import PaymentStatus from "./payment-status";
import { useShopTools } from "./use-shop-tools";
import { bundles, emptyStore, findBundle, money, product, type BundleId, type StoreConfig } from "@/lib/catalog";

export default function Storefront() {
  const [bundleId, setBundleId] = useState<BundleId>("one");
  const [dialog, setDialog] = useState<"review" | "image" | "help" | "privacy" | "returns" | null>(null);
  const [store, setStore] = useState<StoreConfig>(emptyStore);
  const [textSize, setTextSize] = useState(100);
  const [contrast, setContrast] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestIds = useRef<Partial<Record<BundleId, string>>>({});
  const bundle = findBundle(bundleId)!;
  useEffect(() => {
    fetch("/api/store").then(async response => response.ok ? await response.json() as StoreConfig : emptyStore).then(setStore).catch(() => {});
    try {
      const saved = JSON.parse(localStorage.getItem("bem-de-hoje-reading") || "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser-only preferences hydrate after SSR to preserve matching initial markup.
      if (Number.isInteger(saved.size) && saved.size >= 100 && saved.size <= 150) setTextSize(saved.size);
      if (saved.contrast === true) setContrast(true);
    } catch { /* Reading preferences are optional. */ }
    const restored = findBundle(new URLSearchParams(location.search).get("kit"));
    if (restored) setBundleId(restored.id);
  }, []);
  useEffect(() => {
    document.documentElement.style.fontSize = String(18 * textSize / 100) + "px";
    document.documentElement.dataset.contrast = String(contrast);
    try { localStorage.setItem("bem-de-hoje-reading", JSON.stringify({ size: textSize, contrast })); } catch {}
  }, [textSize, contrast]);
  function choose(id: BundleId) { setBundleId(id); setError(""); }
  function review() { setError(""); setDialog("review"); }
  useShopTools(bundleId, choose, review, store.checkoutReady);
  async function pay() {
    if (!store.checkoutReady || busy) return;
    setBusy(true); setError("");
    try {
      requestIds.current[bundleId] ||= crypto.randomUUID();
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bundleId, requestId: requestIds.current[bundleId] }) });
      const result = await response.json() as { url: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Não foi possível abrir o pagamento. Tente novamente.");
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("O endereço de pagamento não pôde ser confirmado.");
      location.assign(url.href);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Tente novamente em instantes."); setBusy(false); }
  }
  return <>
    <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
    <div className="announcement"><Truck size={18} aria-hidden="true" /> Frete grátis em todos os kits <span className="announcement-note">Uma escolha. Tudo às claras.</span></div>
    <header className="site-header wrap">
      <a href="#" className="brand" aria-label="Bem de Hoje, início"><Sun aria-hidden="true" /><span>bem de hoje<span className="brand-dot">.</span></span></a>
      <nav aria-label="Navegação principal"><a href="#produto">O produto</a><a href="#kits">Escolha seu kit</a><a href="#entrega">Sua entrega</a></nav>
      <button className="help-button" onClick={() => setDialog("help")}><Headphones size={20} aria-hidden="true" /> Precisa de ajuda?</button>
    </header>
    <div className="reading-bar"><div className="wrap reading-inner"><span>Leitura confortável</span><div className="reading-controls"><button onClick={() => setTextSize(value => Math.max(100, value - 10))} disabled={textSize === 100} aria-label="Diminuir tamanho do texto"><Minus size={14} aria-hidden="true" /> A</button><output aria-live="polite">{textSize}%</output><button onClick={() => setTextSize(value => Math.min(150, value + 10))} disabled={textSize === 150} aria-label="Aumentar tamanho do texto">A <Plus size={14} aria-hidden="true" /></button><span className="control-divider" /><button className="contrast-control" aria-pressed={contrast} onClick={() => setContrast(!contrast)}><Contrast size={17} aria-hidden="true" /> Mais contraste</button></div></div></div>
    <main id="conteudo">
      <PaymentStatus help={() => setDialog("help")} />
      <section className="hero wrap" id="produto" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow"><span /> CUIDADO NO SEU RITMO</p><h1 id="hero-title">Uma boa escolha<br />começa com<br /><em>informação.</em></h1><p className="hero-description">Coenzima Q10 Nutrify. Composição clara, cápsulas vegetais e uma compra fácil, do começo ao fim.</p><div className="product-tags"><span>60 cápsulas</span><span>100 mg por porção*</span></div><div className="hero-price"><span>A partir de</span><strong>R$ 69,90</strong><span>1 frasco · frete grátis</span></div><a className="primary-button hero-cta" href="#kits">Escolher meu kit <ArrowRight size={21} aria-hidden="true" /></a><p className="small-note"><LockKeyhole size={15} aria-hidden="true" /> Compra sem criar uma conta</p><p className="serving-note">*Porção de 2 cápsulas. Consulte a composição abaixo.</p></div>
        <div className="hero-visual"><div className="visual-circle circle-one" /><div className="visual-circle circle-two" /><span className="visual-caption">NUTRIFY · COENZIMA Q10</span><Image unoptimized src={product.image} alt="Frasco de Coenzima Q10 Nutrify, 60 cápsulas vegetais, 100 mg por porção" width={1274} height={1274} fetchPriority="high" /><button className="zoom-button" onClick={() => setDialog("image")}><ZoomIn size={18} aria-hidden="true" /> Ver embalagem</button><div className="visual-foot"><Leaf size={20} aria-hidden="true" /><span>Cápsulas vegetais<br /><strong>Para uma escolha consciente.</strong></span></div></div>
      </section>
      <div className="trust-strip wrap"><div><Truck aria-hidden="true" /><span><strong>Frete por nossa conta</strong><small>Em todos os kits</small></span></div><div><Leaf aria-hidden="true" /><span><strong>Composição transparente</strong><small>Conheça o que está comprando</small></span></div><div><LockKeyhole aria-hidden="true" /><span><strong>Pagamento pela Stripe</strong><small>Seus dados protegidos no checkout</small></span></div></div>
      <section className="kits-section section-space" id="kits" aria-labelledby="kits-title"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">01 / SUA ESCOLHA</p><h2 id="kits-title">O kit que faz sentido<br /><em>para você.</em></h2></div><p>Escolha a quantidade.<br />Veja o valor completo antes de pagar.</p></div>
        <RadioGroup className="bundle-grid" value={bundleId} onValueChange={id => { if (findBundle(id)) choose(id as BundleId); }} aria-label="Escolha a quantidade de frascos">
          {bundles.map(option => { const selected = bundleId === option.id; const saving = option.quantity * 6990 - option.priceCents; return <label key={option.id} className={"bundle-card " + (selected ? "selected" : "")} htmlFor={"bundle-" + option.id}><div className="bundle-top"><span>{option.quantity === 1 ? "PARA CONHECER" : option.quantity === 2 ? "MENOR PREÇO POR FRASCO" : "PARA TER POR PERTO"}</span><RadioGroupItem id={"bundle-" + option.id} value={option.id} className="bundle-radio" /></div><div className={"bundle-bottles bottles-" + option.quantity} aria-hidden="true">{Array.from({length: option.quantity}, (_, i) => <Image unoptimized src={product.image} key={i} alt="" width={1274} height={1274} loading="lazy" />)}</div><h3>{option.label}</h3><p>{option.quantity * 60} cápsulas no total</p><strong className="bundle-price">{money(option.priceCents)}</strong><p className="per-bottle">{money(option.priceCents / option.quantity)} por frasco</p><div className="bundle-bottom"><span><Truck size={16} aria-hidden="true" /> Frete grátis</span>{saving > 0 && <span className="saving">Economize {money(saving)}</span>}</div><span className="selected-label">{selected ? <><Check size={16} aria-hidden="true" /> Seu kit selecionado</> : <>Selecionar este kit <Plus size={16} aria-hidden="true" /></>}</span></label>; })}
        </RadioGroup>
        <div className="order-summary"><div aria-live="polite" aria-atomic="true"><span>Seu pedido</span><strong>{bundle.label} de Coenzima Q10 Nutrify</strong><small>Frete grátis · compra única</small></div><div className="summary-total"><span>Total</span><strong>{money(bundle.priceCents)}</strong></div><button className="primary-button" onClick={review}>Revisar meu pedido <ArrowRight size={20} aria-hidden="true" /></button></div>
        <p className="kits-footnote">A economia dos kits é calculada em relação ao preço de R$ 69,90 por frasco avulso. Sem assinatura.</p>
      </div></section>
      <ProductDetails store={store} help={() => setDialog("help")} />
      <section className="first-note wrap"><Sun aria-hidden="true" /><div><h2>Informação também é cuidado.</h2><p>Suplementos alimentares não são medicamentos. Antes de usar, converse com seu médico ou nutricionista, especialmente se toma medicamentos ou tem alguma condição de saúde.</p></div></section>
    </main>
    <footer className="site-footer"><div className="wrap footer-top"><a href="#" className="brand"><Sun aria-hidden="true" /><span>bem de hoje.</span></a><p>Boas escolhas.<br />No seu tempo.</p><div><button onClick={() => setDialog("help")}>Atendimento <ArrowUpRight size={16} aria-hidden="true" /></button><button onClick={() => setDialog("privacy")}>Privacidade <ArrowUpRight size={16} aria-hidden="true" /></button><button onClick={() => setDialog("returns")}>Trocas e devoluções <ArrowUpRight size={16} aria-hidden="true" /></button></div></div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} Bem de Hoje.</span><span>Loja independente. Produto fabricado pela Nutrify.</span></div>{store.companyName && <div className="wrap merchant-info">{store.companyName} · CNPJ {store.taxId}<br />{store.address}</div>}</footer>
    <div className="mobile-cart"><div aria-live="polite"><small>{bundle.label} · frete grátis</small><strong>{money(bundle.priceCents)}</strong></div><button className="primary-button" onClick={review}>Revisar pedido <ChevronRight size={18} aria-hidden="true" /></button></div>
    <Dialog open={dialog !== null} onOpenChange={open => { if (!open && !busy) setDialog(null); }}><DialogContent className={"shop-dialog " + (dialog === "image" ? "image-dialog" : "")} showCloseButton={false}><DialogClose className="dialog-close" aria-label="Fechar" disabled={busy}><X size={22} aria-hidden="true" /></DialogClose>
      {dialog === "review" && <><p className="eyebrow">CONFIRA COM CALMA</p><DialogTitle>Seu pedido, às claras.</DialogTitle><DialogDescription>Você escolheu uma compra única. Confira os detalhes antes de seguir.</DialogDescription><div className="review-product"><Image unoptimized src={product.image} alt="Coenzima Q10 Nutrify" width={100} height={100} /><div><strong>Coenzima Q10 Nutrify</strong><p>{bundle.label} · 60 cápsulas por frasco</p></div></div><dl className="review-values"><div><dt>Produtos</dt><dd>{money(bundle.priceCents)}</dd></div><div><dt>Frete</dt><dd>Grátis</dd></div><div className="review-total"><dt>Total</dt><dd>{money(bundle.priceCents)}</dd></div></dl>{store.deliveryMinDays !== null && <p className="delivery-estimate">Prazo estimado: {store.deliveryMinDays} a {store.deliveryMaxDays} dias úteis após a confirmação do pagamento.</p>}<p className="checkout-explainer"><LockKeyhole size={20} aria-hidden="true" /> No próximo passo, a Stripe pede seu contato, endereço de entrega e forma de pagamento.</p>{!store.checkoutReady && <p className="availability-note" role="status">A loja está em preparação. O pagamento ainda não está disponível.</p>}{error && <p className="error-message" role="alert">{error}</p>}<button className="primary-button full-width" disabled={!store.checkoutReady || busy} onClick={pay}>{busy ? "Abrindo pagamento…" : store.checkoutReady ? "Ir para o pagamento seguro" : "Pagamento disponível em breve"}{!busy && <ArrowRight size={20} aria-hidden="true" />}</button><button className="text-button" disabled={busy} onClick={() => setDialog(null)}>Voltar e alterar meu kit</button></>}
      {dialog === "image" && <><DialogTitle>Veja a embalagem</DialogTitle><DialogDescription>Coenzima Q10 Nutrify · frasco com 60 cápsulas.</DialogDescription><Image unoptimized className="enlarged-product" src={product.image} alt="Embalagem da Coenzima Q10 Nutrify ampliada" width={1274} height={1274} /><a className="source-link" href={product.source} target="_blank" rel="noopener noreferrer">Consultar informações do fabricante <ArrowUpRight size={17} aria-hidden="true" /></a></>}
      {dialog === "help" && <><DialogTitle>Vamos ajudar você.</DialogTitle><DialogDescription>Escolha um assunto para encontrar a informação.</DialogDescription><div className="help-links"><button onClick={() => { setDialog(null); document.getElementById("kits")?.scrollIntoView({behavior:"smooth"}); }}><ShoppingBag aria-hidden="true" /><span>Escolher um kit<small>Quantidades e valores completos</small></span><ChevronRight aria-hidden="true" /></button><button onClick={() => { setDialog(null); document.getElementById("entrega")?.scrollIntoView({behavior:"smooth"}); }}><Package aria-hidden="true" /><span>Entender a entrega<small>Frete e atualizações do pedido</small></span><ChevronRight aria-hidden="true" /></button></div>{store.email ? <p>Fale com nossa equipe: <a href={"mailto:" + store.email}>{store.email}</a>{store.phone && <><br /><a href={"tel:" + store.phone.replace(/[^+\d]/g, "")}>{store.phone}</a></>}</p> : <p className="availability-note">Os canais de atendimento serão informados antes da abertura das vendas.</p>}</>}
      {dialog === "privacy" && <><DialogTitle>Sua privacidade.</DialogTitle><DialogDescription>Informações sobre os dados usados na compra.</DialogDescription><p>Esta página salva no seu navegador apenas as preferências de leitura e contraste. Nenhum pixel de publicidade está ativo.</p><p>Quando o pagamento estiver disponível, os dados de contato, endereço e pagamento serão solicitados no checkout da Stripe. A loja utiliza contato e endereço para processar seu pedido e enviar atualizações da entrega.</p><p>Os dados de cartão são tratados pela Stripe. Consulte a <a href="https://stripe.com/br/privacy" target="_blank" rel="noopener noreferrer">política de privacidade da Stripe</a>.</p><p>{store.email ? <>Para solicitar acesso, correção ou exclusão de dados, escreva para <a href={"mailto:" + store.email}>{store.email}</a>.</> : "O responsável pela loja e o contato para solicitações serão publicados antes da abertura das vendas."}</p></>}
      {dialog === "returns" && <><DialogTitle>Trocas e devoluções.</DialogTitle><DialogDescription>Você pode comprar com informações claras sobre seus direitos.</DialogDescription><p>Em compras pela internet, você pode solicitar o cancelamento por arrependimento em até 7 dias corridos a partir do recebimento do produto, conforme o Código de Defesa do Consumidor.</p><p>Se o produto chegar com defeito, avaria ou diferente do pedido, entre em contato para receber orientação. Guarde a embalagem e o comprovante da compra.</p><p>{store.email ? <>Envie o número do pedido para <a href={"mailto:" + store.email}>{store.email}</a>. Nossa equipe informará como devolver, sem custo no exercício do direito de arrependimento.</> : "O canal de solicitação de devolução será publicado antes da abertura das vendas."}</p></>}
    </DialogContent></Dialog>
  </>;
}
