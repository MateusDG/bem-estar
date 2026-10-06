# Publicar na Hostinger

Este projeto precisa de servidor Node.js para executar as APIs de loja e pagamento. Upload comum em public_html não é suficiente. Use **Aplicação Node.js** no hPanel de um plano compatível, ou VPS com Node.js.

Referências oficiais: [aplicações criadas com Codex](https://www.hostinger.com/br/support/como-implantar-aplicativos-criados-com-codex-na-hostinger/) e [publicação Node.js](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

## Código-fonte e build

1. Adicione uma aplicação Node.js no hPanel e envie o ZIP de código-fonte. O package.json está na raiz do ZIP. Ao importar o repositório completo, use site como diretório da aplicação.
2. Selecione Next.js e Node.js 22 (22.13 ou superior).
3. Confira: instalação npm ci, build npm run build, execução npm start. Se o painel pedir arquivo inicial, use .next/standalone/server.js.
4. Configure as variáveis abaixo, conecte o domínio e aguarde HTTPS. O painel deve fornecer PORT. Se precisar configurar o endereço de escuta, use HOSTNAME=0.0.0.0.
5. Gere o build na Hostinger e publique. Verifique em janela anônima, sem login do ChatGPT.

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

## Stripe e lançamento

Configure uma chave Stripe de teste e CHECKOUT_ENABLED=true no ambiente de homologação. Reinicie/republique após alterar variáveis. Confira:

- Os três totais: R$ 69,90, R$ 99,90 e R$ 149,90, com frete grátis.
- Endereço brasileiro, contato e quantidade de frascos no checkout.
- Entrega em até 10 dias úteis, sem prazo mínimo inventado.
- Retornos aprovado, pendente e cancelado; confirme o resultado no painel Stripe.
- Consulta do pedido sem exposição de dados pessoais ou chave Stripe.

Após testar, configure a chave de produção no hPanel. Defina SITE_INDEXABLE=true **antes do build de lançamento** e gere novo build. O domínio em SITE_URL deve ser o mesmo acessado pelo cliente, incluindo a escolha de usar ou não www.

## Conferência após publicar

Abra em computador e celular. Verifique imagens, ampliação, ajuda, seleção, resumo e retorno do foco ao fechar a revisão. Confirme que /api/store responde JSON com checkoutReady coerente com a configuração e deliveryMaxDays: 10, sem segredos. Valide entrega real, atendimento e políticas com a operação.

Os dados comerciais ficaram vazios conforme solicitado. A exigência de identificação e contato está no [README](../README.md#pendências-da-operação) e continua sendo uma pendência de lançamento comercial.
