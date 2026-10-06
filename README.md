# Bem de Hoje

Página de produto para Coenzima Q10 Nutrify (SKU 1001726), com kits de 1, 2 ou 3 frascos. Aplicação Next.js / React em servidor Node.js. Prazo informado: **entrega em até 10 dias úteis após a confirmação do pagamento**, sem prazo mínimo prometido.

O projeto está diretamente na raiz do repositório. `package.json`, `package-lock.json`, `next.config.ts`, `app/` e `public/` ficam juntos; não há uma pasta `site/` para selecionar na hospedagem.

O código de pagamento ainda usa Stripe. A integração com InfinitePay está pendente; mantenha `CHECKOUT_ENABLED=false` até concluir e validar a troca.

## Organização

```text
app/          Página, estilos e APIs
components/   Interface da loja e componentes acessíveis
hooks/        Hooks da interface
lib/          Catálogo e regras de pagamento
public/       Imagens e ícone públicos
scripts/      Preparação do build e testes de comércio
docs/         Publicação, pesquisa e origem das imagens
vendor/       Estilos de terceiros e licença
```

`.gitignore` protege segredos, dependências, caches e builds. `.env.example` contém apenas campos vazios e padrões públicos. As configurações antigas de Sites/Vinext/Cloudflare foram retiradas da aplicação; uma cópia local foi preservada em `.git/local-backups/hostinger-root-2026-10-06/`, fora dos arquivos enviados ao GitHub.

## Rodar e verificar

Requer Node.js 22.13 ou superior; selecione Node.js 22 na Hostinger. Execute na pasta deste package.json:

```sh
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. Para verificar e executar a versão de produção:

```sh
npm run lint
npx tsc --noEmit
npm run test:commerce
npm run build
npm start
```

`npm run build` executa `next build` e, em seguida, o `postbuild` copia `public/` e `.next/static/` para `.next/standalone/`. O arquivo inicial de produção é `.next/standalone/server.js`. O servidor usa `PORT` e `HOSTNAME` fornecidos pela hospedagem; a porta padrão é 3000. Configure `HOSTNAME=0.0.0.0` no hPanel. Não execute `dev` em produção.

## Publicar na Hostinger

Leia [o guia de publicação](docs/hostinger.md). É necessário um ambiente de **aplicação Node.js**: enviar código por FTP para public_html não executa as APIs de pagamento. O pacote contém código-fonte; dependências e build devem ser gerados no servidor Linux da Hostinger.

O servidor público Next.js não exige login do ChatGPT. No hPanel, selecione Next.js e a raiz do repositório (`./`). Se a aplicação existente apontava para `site`, altere essa configuração antes de republicar.

## Configuração

Em desenvolvimento, copie .env.example para .env.local. Na Hostinger, configure as variáveis no hPanel. Não inclua segredos em arquivos públicos, Git, chat ou NEXT_PUBLIC_*.

| Variável | Uso |
|---|---|
| STRIPE_SECRET_KEY | Chave secreta Stripe; comece com uma chave de teste. |
| CHECKOUT_ENABLED | true permite checkout quando chave, origem e prazo são válidos. Padrão: false. |
| SITE_URL | Origem HTTPS exata do domínio, sem caminho, query ou fragmento. |
| SITE_INDEXABLE | true permite indexação. Configure antes do build de lançamento; refaça o build se mudar. Padrão: false. |
| DELIVERY_MAX_DAYS | 10, conforme informado. O código também usa 10 quando vazio. |
| DELIVERY_MIN_DAYS | Vazio: não foi informado um prazo mínimo. |
| STORE_COMPANY_NAME, STORE_CNPJ, STORE_ADDRESS, STORE_EMAIL, STORE_PHONE | Campos para informações comerciais reais quando fornecidas. Nenhum dado foi inventado. |

Sem configuração válida, seleção e revisão funcionam e o pagamento fica indisponível, com aviso claro. GET /api/store expõe somente configuração pública, sem chave Stripe.

## Stripe e entrega

POST /api/checkout cria uma sessão de Stripe Checkout hospedada. O servidor define os preços: 1 frasco por R$ 69,90; 2 por R$ 99,90; 3 por R$ 149,90. Frete grátis, compra única, sem assinatura. O checkout coleta endereço brasileiro, e-mail e telefone. A idempotência reutiliza a mesma sessão em tentativas do mesmo pedido. Pix e parcelamento dependem da configuração e elegibilidade da conta Stripe; não são prometidos.

`SITE_URL` define o domínio público usado na validação da origem e nos retornos do pagamento, mesmo quando o proxy da hospedagem passa um endereço interno ao Next.js. O acesso HTTP por loopback para testes locais é aceito somente com `NODE_ENV=development`, definido pelo comando `npm run dev`.

GET /api/order-status consulta a Stripe para confirmar o pagamento. Um parâmetro de retorno na URL não prova uma venda. A resposta não contém nome, endereço, e-mail ou dados de cartão. Os testes usam respostas simuladas; nenhuma transação real ou sessão real de teste foi executada sem credenciais.

Antes de vender, teste os três kits e retornos de sucesso, cancelamento e pagamento pendente no modo de teste da Stripe. Depois, configure a chave de produção e o domínio. Não envie chaves pelo chat.

O painel Stripe é a fonte de pedidos pagos e contatos/endereço. Confirme o pagamento antes de enviar. Consulte metadata.bundle_id e metadata.bottle_quantity: o kit é um item; a quantidade de frascos está no nome, descrição e metadados. Confirmação, postagem e rastreio são enviados manualmente pela operação. Não há mensagens automáticas ou webhook de fulfillment.

## Interface para pessoas 60+

- Texto base e controles principais de 18 px; auxiliares de pelo menos 16,2 px, relativos à preferência do navegador.
- Leitura de 100% a 200%, preferências preservadas, contraste adicional e respeito a movimento reduzido.
- Produto, quantidade, preço e ação antes da imagem no celular.
- Nenhum kit pré-selecionado; revisão mostra total, frete e prazo.
- Toque de pelo menos 44 px, foco visível, teclado e retorno de foco ao fechar diálogos.
- Tabela com cabeçalhos identificados e revisão sem rolagem horizontal em tela estreita com texto ampliado.
- Sem vídeo automático, contador, estoque fictício, depoimento inventado ou assinatura escondida.

Não há Meta Pixel ou analytics publicitário ativo. Defina consentimento antes dessas integrações; registre compra somente após pagamento confirmado. As ferramentas WebMCP usam o estado da interface e nunca abrem pagamento automaticamente.

## Pendências da operação

Os testes locais não confirmam publicação, pagamento real ou adequação comercial integral. O art. 2º do [Decreto 7.962/2013](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm) exige identificação e canais de contato do fornecedor no comércio eletrônico. Os campos ficaram vazios conforme solicitado; o prazo não substitui essas informações. Marca, domínio, autorização das imagens do fabricante e políticas devem corresponder à operação real.

Fontes: [pesquisa](docs/pesquisa-e-conteudo.md) e [proveniência das imagens](docs/imagens.md).

## Dependências

`package-lock.json` fixa a árvore instalada por `npm ci`. Next.js e `eslint-config-next` usam a mesma versão, 16.3.8. A aplicação utiliza somente a configuração de build do Next.js; Vite, Vinext, Wrangler e dependências de Cloudflare/D1 não fazem parte deste projeto de publicação.
