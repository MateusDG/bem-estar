"use client";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Package,
  ShoppingBag,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  bundles,
  deliveryLabel,
  money,
  product,
  type StoreConfig,
} from "@/lib/catalog";

export type ShopDialogKind =
  | "review"
  | "image"
  | "help"
  | "privacy"
  | "returns";
type Props = {
  dialog: ShopDialogKind;
  bundle: (typeof bundles)[number] | undefined;
  store: StoreConfig;
  busy: boolean;
  error: string;
  pay: () => void;
  closeDialog: () => void;
  navigateTo: (id: "kits" | "entrega") => void;
  onCloseAutoFocus: (event: Event) => void;
};

export default function ShopDialog({
  dialog,
  bundle,
  store,
  busy,
  error,
  pay,
  closeDialog,
  navigateTo,
  onCloseAutoFocus,
}: Props) {
  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) closeDialog();
      }}
    >
      <DialogContent
        className={"shop-dialog " + (dialog === "image" ? "image-dialog" : "")}
        showCloseButton={false}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogClose className="dialog-close" aria-label="Fechar">
          <X size={22} aria-hidden="true" />
        </DialogClose>
        {dialog === "review" && (
          <ReviewDialog
            bundle={bundle}
            store={store}
            busy={busy}
            error={error}
            pay={pay}
            closeDialog={closeDialog}
          />
        )}
        {dialog === "image" && (
          <>
            <DialogTitle>Veja a embalagem</DialogTitle>
            <DialogDescription>
              Coenzima Q10 Nutrify · frasco com 60 cápsulas.
            </DialogDescription>
            <Image
              sizes="(max-width: 760px) calc(100vw - 80px), 640px"
              className="enlarged-product"
              src={product.image}
              alt="Embalagem da Coenzima Q10 Nutrify ampliada"
              width={1274}
              height={1274}
            />
            <a
              className="source-link"
              href={product.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar informações do fabricante{" "}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </>
        )}
        {dialog === "help" && (
          <HelpDialog store={store} navigateTo={navigateTo} />
        )}
        {dialog === "privacy" && (
          <>
            <DialogTitle>Sua privacidade.</DialogTitle>
            <DialogDescription>
              Informações sobre os dados usados na compra.
            </DialogDescription>
            <p>
              Esta página salva no seu navegador as preferências de leitura e
              contraste, o kit escolhido e a referência do pedido. Nenhum pixel
              de publicidade está ativo.
            </p>
            <p>
              Quando o pagamento estiver disponível, os dados de contato,
              endereço e pagamento serão solicitados no checkout da InfinitePay.
              A loja utiliza contato e endereço para processar seu pedido e
              enviar atualizações da entrega.
            </p>
            <p>
              Os dados de cartão são tratados pela InfinitePay. Consulte a{" "}
              <a
                href="https://www.infinitepay.io/legal/aviso-de-privacidade"
                target="_blank"
                rel="noopener noreferrer"
              >
                política de privacidade da InfinitePay
              </a>
              .
            </p>
            <p>
              {store.email ? (
                <>
                  Para solicitar acesso, correção ou exclusão de dados, escreva
                  para <a href={"mailto:" + store.email}>{store.email}</a>.
                </>
              ) : (
                "O responsável pela loja e o contato para solicitações serão publicados antes da abertura das vendas."
              )}
            </p>
          </>
        )}
        {dialog === "returns" && (
          <>
            <DialogTitle>Trocas e devoluções.</DialogTitle>
            <DialogDescription>
              Você pode comprar com informações claras sobre seus direitos.
            </DialogDescription>
            <p>
              Em compras pela internet, você pode solicitar o cancelamento por
              arrependimento em até 7 dias corridos a partir do recebimento do
              produto, conforme o Código de Defesa do Consumidor.
            </p>
            <p>
              Se o produto chegar com defeito, avaria ou diferente do pedido,
              entre em contato para receber orientação. Guarde a embalagem e o
              comprovante da compra.
            </p>
            <p>
              {store.email ? (
                <>
                  Envie o número do pedido para{" "}
                  <a href={"mailto:" + store.email}>{store.email}</a>. Nossa
                  equipe informará como devolver, sem custo no exercício do
                  direito de arrependimento.
                </>
              ) : (
                "O canal de solicitação de devolução será publicado antes da abertura das vendas."
              )}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({
  bundle,
  store,
  busy,
  error,
  pay,
  closeDialog,
}: Pick<Props, "bundle" | "store" | "busy" | "error" | "pay" | "closeDialog">) {
  if (!bundle) return null;
  return (
    <>
      <p className="eyebrow">CONFIRA COM CALMA</p>
      <DialogTitle>Seu pedido, às claras.</DialogTitle>
      <DialogDescription>
        Você escolheu uma compra única. Confira os detalhes antes de seguir.
      </DialogDescription>
      <div className="review-product">
        <Image
          sizes="100px"
          src={product.image}
          alt="Coenzima Q10 Nutrify"
          width={100}
          height={100}
        />
        <div>
          <strong>Coenzima Q10 Nutrify</strong>
          <p>{bundle.label} · 60 cápsulas por frasco</p>
        </div>
      </div>
      <dl className="review-values">
        <div>
          <dt>Produtos</dt>
          <dd>{money(bundle.priceCents)}</dd>
        </div>
        <div>
          <dt>Frete</dt>
          <dd>Grátis</dd>
        </div>
        <div className="review-total">
          <dt>Total</dt>
          <dd>{money(bundle.priceCents)}</dd>
        </div>
      </dl>
      <p className="delivery-estimate">
        {deliveryLabel(store)} após a confirmação do pagamento.
      </p>
      <p>Até 4x sem juros no cartão.</p>
      {!store.checkoutReady && (
        <p className="availability-note" role="status">
          A loja está em preparação. O pagamento ainda não está disponível.
        </p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <button
        className="primary-button full-width"
        disabled={!store.checkoutReady || busy}
        onClick={pay}
      >
        {busy
          ? "Abrindo pagamento…"
          : store.checkoutReady
            ? "Continuar na InfinitePay"
            : "Pagamento disponível em breve"}
        {!busy && <ArrowRight size={20} aria-hidden="true" />}
      </button>
      <button className="text-button" onClick={closeDialog}>
        Voltar e alterar meu kit
      </button>
    </>
  );
}

function HelpDialog({
  store,
  navigateTo,
}: Pick<Props, "store" | "navigateTo">) {
  return (
    <>
      <DialogTitle>Vamos ajudar você.</DialogTitle>
      <DialogDescription>
        Escolha um assunto para encontrar a informação.
      </DialogDescription>
      <div className="help-links">
        <button onClick={() => navigateTo("kits")}>
          <ShoppingBag aria-hidden="true" />
          <span>
            Escolher um kit
            <small>Quantidades e valores completos</small>
          </span>
          <ChevronRight aria-hidden="true" />
        </button>
        <button onClick={() => navigateTo("entrega")}>
          <Package aria-hidden="true" />
          <span>
            Entender a entrega
            <small>Frete e atualizações do pedido</small>
          </span>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      {store.email || store.phone ? (
        <p>
          Fale com nossa equipe:
          {store.email && (
            <>
              {" "}
              <a href={"mailto:" + store.email}>{store.email}</a>
            </>
          )}
          {store.phone && (
            <>
              <br />
              <a href={"tel:" + store.phone.replace(/[^+\d]/g, "")}>
                {store.phone}
              </a>
            </>
          )}
        </p>
      ) : (
        <p className="availability-note">
          Os canais de atendimento serão informados antes da abertura das
          vendas.
        </p>
      )}
    </>
  );
}
