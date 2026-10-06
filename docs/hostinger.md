# Publicar na Hostinger

Este projeto precisa de servidor Node.js para executar as APIs de loja e pagamento. Upload comum em public_html não é suficiente. Use **Aplicação Node.js** no hPanel de um plano compatível, ou VPS com Node.js.

Referências oficiais: [publicação Node.js](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) e [correção de estrutura, diretório e comandos](https://www.hostinger.com/support/fix-failed-to-build-application-error-hostinger-node-js/).

## 403 com instalação de Composer no log

Um log que passa de `Installing Composer dependencies` diretamente para `Publishing`, sem instalar pacotes npm nem compilar Next.js, indica publicação pelo fluxo PHP/HTML. O código-fonte Next.js copiado para `public_html` não é uma página pronta para esse servidor exibir.

Em 06/10/2026, a implantação do commit `34b54dd` apresentou esse comportamento. O painel de `bemnasaude.com.br` mostrava `public_html` como diretório de publicação e plano Business Web Hosting. A estrutura do repositório já estava corrigida.

No hPanel, abra **Sites → Adicionar site / Criar site → Aplicativo Web / Web App → Importar repositório Git**. Selecione este repositório e use os parâmetros da tabela abaixo. A integração Git disponível no painel de um site PHP/HTML é um fluxo diferente.

Para validar primeiro, use o domínio temporário disponibilizado pela aplicação Node.js. Depois associe o domínio definitivo. Se o painel exigir remover o site existente para liberar esse domínio, preserve um backup dos arquivos e das configurações e revise o impacto antes de excluir: a remoção pode apagar dados e interromper serviços vinculados.

O log da aplicação Node.js deve registrar a instalação npm, a compilação Next.js e a inicialização do servidor. A confirmação de publicação do fluxo PHP/HTML, isoladamente, não comprova que o Next.js está funcionando. Após o build correto, confira o site e `/api/store`.

## Falha `GLIBC_2.29` ao carregar SWC

O build das 17:37 de 06/10/2026 já usava Node.js 22 e Next.js, mas o compilador nativo SWC exigia `GLIBC_2.29`, indisponível nesse servidor. O carregamento de `next.config.ts` também falhou. Essa etapa acontece antes de iniciar a aplicação.

O projeto usa agora `next.config.mjs`, carregado diretamente pelo Node.js, e `next build --webpack`. Isso permite ao Next.js usar seu fallback SWC WebAssembly quando o binário nativo não carrega. A versão Next.js 16.3.8 foi mantida. Referências: [configuração JavaScript](https://nextjs.org/docs/app/api-reference/config/next-config-js) e [opção Webpack](https://nextjs.org/docs/app/api-reference/cli/next).

Faça commit incluindo a **remoção de `next.config.ts` e adição de `next.config.mjs`**, envie ao GitHub e reimplante o novo commit. Mantenha o comando do painel em `npm run build`; o `package.json` já aplica `--webpack` e executa o `postbuild`.

No log novo, confirme `Next.js 16.3.8 (webpack)` e o carregamento de `next.config.mjs`. Avisos sobre o SWC nativo podem aparecer durante o fallback: o resultado esperado é `Compiled successfully`, verificação de TypeScript concluída e build finalizado. O primeiro fallback pode baixar o pacote WebAssembly da mesma versão do Next.js.

A correção foi validada localmente com Node.js 22 e falha do SWC nativo simulada. Essa simulação verifica o caminho WebAssembly da aplicação; a confirmação no ambiente Linux da Hostinger depende do novo build e da conferência do site publicado.

## Código-fonte e build

1. Faça commit de **todas as alterações**, incluindo a remoção dos arquivos do antigo diretório `site/`, e envie o commit ao GitHub. Confirme que `package.json` aparece ao abrir a raiz do repositório no GitHub.
2. No hPanel, importe esse repositório pelo fluxo **Aplicativo Web / Node.js** descrito acima. Em uma aplicação que já seja Node.js, abra a configuração de republicação e remova a referência antiga a `site/`.
3. Confira os parâmetros abaixo. Use o build do `package.json` para executar também a preparação das imagens e dos arquivos estáticos.
4. Configure as variáveis abaixo, conecte o domínio e aguarde HTTPS.
5. Republique a versão que contém o novo commit e confira o log do build. Verifique o site em janela anônima, sem login do ChatGPT.

| Parâmetro | Valor deste projeto |
|---|---|
| Framework | Next.js, com servidor Node.js |
| Raiz do projeto | `./` — raiz do repositório |
| Node.js | 22, versão 22.13 ou superior |
| Instalação | `npm ci` |
| Build | `npm run build` |
| Execução | `npm start` |
| Diretório de saída, se solicitado | `.next` |
| Arquivo inicial, se solicitado | `.next/standalone/server.js`, relativo à raiz do projeto |
| Porta | `3000` |
| Endereço de escuta | `HOSTNAME=0.0.0.0` |

Se enviar um ZIP, `package.json`, `app/` e `public/` precisam estar diretamente na raiz do arquivo, sem uma pasta `bem-estar/` ou `site/` envolvendo o projeto. A pasta `.git/` também não deve entrar no ZIP.

Não envie node_modules, .next, .env.local nem build produzido no Windows. O ZIP contém código e imagens; o build na hospedagem prepara os arquivos para Linux.

## Primeira publicação sem cobrança

```dotenv
CHECKOUT_ENABLED=false
SITE_URL=https://seu-dominio-real.com.br
SITE_INDEXABLE=false
DELIVERY_MAX_DAYS=10
DELIVERY_MIN_DAYS=
HOSTNAME=0.0.0.0
```

Substitua SITE_URL pelo domínio HTTPS real, sem caminho. O site permitirá escolher/revisar kits, com pagamento indisponível. Configure credenciais diretamente no hPanel; .env.example é somente uma referência.

## InfinitePay e lançamento

O checkout e a confirmação foram migrados para InfinitePay. Siga [o guia de integração](infinitepay.md). Configure no hPanel:

```dotenv
INFINITEPAY_HANDLE=mateus-diniz-5eo
COMMERCE_DATA_DIR=/home/u211581624/domains/bemnasaude.com.br/.commerce
SITE_URL=https://bemnasaude.com.br
CHECKOUT_ENABLED=true
```

O caminho acima usa o usuário/domínio mostrados no log da sua hospedagem. Confirme que ele é persistente e gravável pelo processo Node.js. A aplicação cria a pasta privada e o banco automaticamente; não use `public_html`, `.next`, pasta de release, `/tmp` em produção ou o diretório do repositório. Se já criou essa pasta, deixe permissão 0700. Não mude esse caminho nem remova o banco em uma republicação. O servidor desabilita compras se a configuração ou o armazenamento falhar.

Faça commit das alterações e reimplante pela integração Git. O webhook só existirá no domínio após a nova publicação. Cada link criado pelo site já envia a URL `https://bemnasaude.com.br/api/webhooks/infinitepay`; não é necessário criar links manualmente nem usar o webhook como endereço de pagamento do cliente.

Confira os três kits, o contato/endereço no checkout e o retorno. A compra só fica confirmada após verificação da API. Os testes automatizados usam respostas simuladas; um pagamento real e a chegada do webhook na Hostinger ainda precisam ser verificados na operação antes de iniciar tráfego pago.

Para indexação, defina SITE_INDEXABLE=true antes do build de lançamento. O domínio em SITE_URL deve ser o mesmo acessado pelo cliente, incluindo a escolha de usar ou não www. A geração de links foi confirmada pela API pública documentada usando a InfiniteTag; a chave privada da conversa não foi colocada no código.

## Conferência após publicar

Abra em computador e celular. Verifique imagens, ampliação, ajuda, seleção, resumo e retorno do foco ao fechar a revisão. Confirme que /api/store responde JSON com checkoutReady coerente com a configuração e deliveryMaxDays: 10, sem segredos. Valide entrega real, atendimento e políticas com a operação.

Configure também STORE_COMPANY_NAME, STORE_CNPJ, STORE_ADDRESS, STORE_EMAIL e STORE_PHONE com a identificação e o atendimento reais. A identificação indicada e a conta de recebimento estão registradas no [README](../README.md#pendências-da-operação). Após aplicar as mudanças e reimplantar, confirme os campos públicos em /api/store e no rodapé da loja.
