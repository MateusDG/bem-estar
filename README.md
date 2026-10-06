# Bem de Hoje

Página de produto para Coenzima Q10 Nutrify (SKU 1001726), com kits de 1, 2 ou 3 frascos. Aplicação Next.js / React em servidor Node.js. Prazo informado: **entrega em até 10 dias úteis após a confirmação do pagamento**, sem prazo mínimo prometido.

O projeto está diretamente na raiz do repositório. `package.json`, `package-lock.json`, `next.config.mjs`, `app/` e `public/` ficam juntos; não há uma pasta `site/` para selecionar na hospedagem.

O pagamento usa o Checkout Integrado da InfinitePay. O servidor gera o link para o kit escolhido e confirma pagamentos pela API, tanto no retorno do comprador quanto pelo webhook. Veja [configuração e operação](docs/infinitepay.md).

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

`npm run build` executa `next build --webpack` e, em seguida, o `postbuild` copia `public/` e `.next/static/` para `.next/standalone/`. A configuração JavaScript (`next.config.mjs`) dispensa a compilação do arquivo de configuração. Webpack permite o fallback WebAssembly do SWC quando o binário nativo não carrega na hospedagem. O arquivo inicial de produção é `.next/standalone/server.js`. O servidor usa `PORT` e `HOSTNAME` fornecidos pela hospedagem; a porta padrão é 3000. Configure `HOSTNAME=0.0.0.0` no hPanel. Não execute `dev` em produção.

## Publicar na Hostinger

Leia [o guia de publicação](docs/hostinger.md). É necessário um ambiente de **aplicação Node.js**: enviar código por FTP para public_html não executa as APIs de pagamento. O pacote contém código-fonte; dependências e build devem ser gerados no servidor Linux da Hostinger.

O servidor público Next.js não exige login do ChatGPT. No hPanel, selecione Next.js e a raiz do repositório (`./`). Se a aplicação existente apontava para `site`, altere essa configuração antes de republicar.

## Configuração

Em desenvolvimento, copie .env.example para .env.local. Na Hostinger, configure as variáveis no hPanel. Não inclua segredos em arquivos públicos, Git, chat ou NEXT_PUBLIC_*.

| Variável | Uso |
|---|---|
| INFINITEPAY_HANDLE | Sua InfiniteTag pública, sem `$`. Conta configurada: `mateus-diniz-5eo`. |
| COMMERCE_DATA_DIR | Caminho absoluto de uma pasta privada e persistente fora da aplicação publicada. Guarda `orders.sqlite`; necessário para habilitar compras. |
| CHECKOUT_ENABLED | true permite checkout quando conta, armazenamento, origem e prazo são válidos. Padrão: false. |
| SITE_URL | Origem HTTPS exata do domínio, sem caminho, query ou fragmento. |
| SITE_INDEXABLE | true permite indexação. Configure antes do build de lançamento; refaça o build se mudar. Padrão: false. |
| DELIVERY_MAX_DAYS | 10, conforme informado. O código também usa 10 quando vazio. |
| DELIVERY_MIN_DAYS | Vazio: não foi informado um prazo mínimo. |
| STORE_COMPANY_NAME, STORE_CNPJ, STORE_ADDRESS, STORE_EMAIL, STORE_PHONE | Campos para informações comerciais reais quando fornecidas. Nenhum dado foi inventado. |

Sem configuração válida, seleção e revisão funcionam e o pagamento fica indisponível, com aviso claro. GET /api/store expõe somente configuração pública, sem credenciais, identificadores da conta ou caminhos privados.

## InfinitePay e entrega

POST /api/checkout envia o pedido à API documentada da InfinitePay e retorna o link de pagamento. O servidor define os totais: 1 frasco por R$ 69,90; 2 por R$ 99,90; 3 por R$ 149,90. Cada kit é um único item com o preço do kit, sem taxa de frete ou assinatura. A quantidade de frascos aparece na descrição. As formas de pagamento e eventuais taxas de parcelamento seguem a configuração da conta InfinitePay.

`SITE_URL` define o domínio público para validar a origem e receber o retorno do pagamento, mesmo quando o proxy passa um endereço interno ao Next.js. O acesso HTTP por loopback para testes locais é permitido somente com `NODE_ENV=development` e host/porta correspondentes.

O pedido é registrado em SQLite antes da geração do link. Repetições do mesmo pedido reutilizam o link salvo; uma reserva impede chamadas simultâneas por diferentes workers. A documentação não promete idempotência da API da InfinitePay: se uma chamada perder a resposta, uma tentativa após o intervalo de recuperação pode gerar outro link para o mesmo identificador local. A confirmação aceita uma única transação por pedido e uma transação não pode confirmar dois pedidos.

GET /api/order-status confirma o retorno por POST /payment_check na InfinitePay. POST /api/webhooks/infinitepay recebe notificações e faz a mesma verificação. Parâmetros da URL e corpo do webhook não são provas de pagamento. O valor original deve corresponder ao pedido salvo; taxas adicionais de parcelamento são registradas separadamente. Eventos repetidos já confirmados são reconhecidos sem duplicar o pedido. Falhas recebem HTTP 400 para a InfinitePay tentar novamente. A preferência de resposta em menos de um segundo depende da latência da API na primeira confirmação.

O banco precisa ficar em armazenamento persistente privado, fora de public_html e das pastas de build/release. Em produção, use Linux/POSIX: a aplicação exige diretório com permissão 0700 e guarda apenas referências, kit, valores e confirmação; não guarda cartão, CPF, telefone ou endereço. Windows é suportado para desenvolvimento e testes, sem presumir que seus bits de permissão representem proteção por ACL; o armazenamento de produção nesse sistema é recusado. Faça backup consistente de SQLite incluindo WAL, por ferramenta própria ou com o servidor parado, e teste restauração. O painel InfinitePay fornece os contatos/endereço para a operação. Confirmação de envio e rastreio continuam manuais.

A API pública documentada usa a InfiniteTag. Uma chamada real de geração de link para a conta foi validada sem API Key, sem pagar. A chave enviada na conversa não foi usada, gravada nem incluída no repositório; não há cabeçalho de autenticação inventado. Se a InfinitePay exigir futuramente outro modo autenticado, siga a documentação oficial correspondente antes de mudar esse fluxo. Não presuma que exista sandbox: os testes automatizados simulam o provedor.

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

Os testes locais não confirmam pagamento real ou adequação comercial integral. O art. 2º do [Decreto 7.962/2013](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm) exige identificação e canais de contato do fornecedor no comércio eletrônico. A identificação indicada para a loja é ISS Comércio Saúde e Bem Estar Ltda., CNPJ 45.475.531/0001-79, conforme [cadastro fornecido pelo responsável](https://cnpj.biz/45475531000179). Configure os campos STORE_* na hospedagem; eles aparecem no rodapé e no atendimento. A conta de recebimento InfinitePay continua mateus-diniz-5eo, conforme confirmado pelo responsável. No cartão, a conta repassa todas as taxas ao comprador; a loja informa o total no Pix e explica o acréscimo antes de abrir o checkout. Marca, domínio, autorização das imagens do fabricante e políticas devem corresponder à operação real.

Fontes: [pesquisa](docs/pesquisa-e-conteudo.md) e [proveniência das imagens](docs/imagens.md).

## Dependências

`package-lock.json` fixa a árvore instalada por `npm ci`. Next.js e `eslint-config-next` usam a mesma versão, 16.3.8. A aplicação utiliza somente a configuração de build do Next.js; Vite, Vinext, Wrangler e dependências de Cloudflare/D1 não fazem parte deste projeto de publicação.
