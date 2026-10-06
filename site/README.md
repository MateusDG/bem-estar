# Bem de Hoje

Página de produto em português para Coenzima Q10 Nutrify (SKU 1001726). Marca provisória sugerida; registro de marca, domínio e autorização de uso comercial das imagens do fabricante ainda precisam ser confirmados pelo responsável pela loja.

## Rodar e verificar

```sh
npm install
npm run dev -- --host 127.0.0.1
npx tsc --noEmit
node --experimental-strip-types --test scripts/commerce.test.ts
npm run build
```

Projeto Vinext / React / Cloudflare Workers. O desenvolvimento local usa `.dev.vars`; há um modelo sem segredos em `.dev.vars.example`. O projeto publicado usa variáveis de ambiente do Sites, não o arquivo local. Não coloque credenciais em componentes, Git ou chat.

## Stripe preparada, vendas desativadas

`POST /api/checkout` cria uma sessão de Stripe Checkout hospedada. O servidor define o kit e o valor: 1 frasco 6990 centavos, 2 frascos 9990, 3 frascos 14990. O checkout coleta endereço brasileiro, email e telefone. Frete zero, compra única, sem assinatura. A chave de idempotência mantém tentativas do mesmo pedido na mesma sessão. As formas de pagamento vêm da configuração e elegibilidade da conta Stripe; Pix ou parcelamento não foram prometidos.

`GET /api/order-status` consulta a Stripe para confirmar o pagamento. Um parâmetro de retorno na URL não prova uma venda. A resposta não contém nome, endereço, email nem dados de cartão. Os testes usam respostas simuladas; nenhuma cobrança real ou sessão real de teste foi executada, pois não há uma chave Stripe configurada.

Para ativar, configure no ambiente de execução:

| Variável | Uso |
|---|---|
| `STRIPE_SECRET_KEY` | Segredo da conta Stripe. Começar com uma chave de teste. |
| `CHECKOUT_ENABLED` | `true` habilita somente depois de todos os campos necessários serem válidos. |
| `SITE_URL` | Origem HTTPS exata, sem caminho. Atualizar se usar domínio próprio. |
| `STORE_COMPANY_NAME` | Razão social real. |
| `STORE_CNPJ` | CNPJ real, numérico ou alfanumérico com dígitos verificadores válidos. |
| `STORE_ADDRESS` | Endereço completo real do vendedor. |
| `STORE_EMAIL` | Canal real de atendimento, privacidade e devolução. |
| `STORE_PHONE` | Telefone público opcional, com DDI/DDD. |
| `DELIVERY_MIN_DAYS` / `DELIVERY_MAX_DAYS` | Prazo real de entrega em dias úteis, mínimo 1 e máximo 120. Não há prazo inventado. |

Sem credenciais e dados operacionais, o visitante pode escolher e revisar o kit; a página informa que as vendas estão em preparação e não inicia cobrança. Antes do tráfego pago, completar os dados, revisar as políticas com a operação real, testar os três kits no modo de teste da Stripe e configurar domínio/audiência públicos. O site foi criado com acesso privado para revisão.

## Operação manual de entrega

O painel da Stripe é a fonte dos pedidos pagos e dos contatos/endereço fornecidos. Verifique pagamento confirmado no painel; não prepare envio com base apenas em uma captura da página de sucesso. Leia `metadata.bundle_id` e `metadata.bottle_quantity`: o checkout vende um kit como um item; a quantidade de frascos está no nome/descrição e nos metadados. Envie a confirmação, preparação, postagem e rastreio manualmente pelo contato informado. Não foi criado um sistema fictício de rastreio, nem envio automático de mensagens. Não há webhook de fulfillment porque a operação solicitada é manual; eventual automação futura precisa de webhook assinado e armazenamento persistente.

## Interface

- Seleção de kits com preços e total imediatos, revisão acessível antes do checkout.
- Texto base 18 px, preferências de leitura 100–150%, contraste adicional, zoom do navegador preservado, foco visível e navegação por teclado.
- Foto real do produto, embalagem ampliável, composição em abas, FAQ em acordeão e etapas de entrega navegáveis.
- Respeito à preferência por movimento reduzido. Nenhum vídeo automático, contador, estoque fictício ou depoimento inventado.
- Nenhum Meta Pixel, analytics publicitário ou coleta de email na landing page ativo. Antes de medir anúncios, definir a política de consentimento e a integração com Meta; não registrar eventos Purchase sem pagamento confirmado.
- `bdh_select_bundle`, `bdh_get_order_summary`, `bdh_review_order` usam o mesmo estado da interface. As ferramentas nunca compram nem abrem pagamento automaticamente.

Fontes e critérios da pesquisa estão em `docs/pesquisa-e-conteudo.md`. Proveniência visual em `docs/imagens.md`.
