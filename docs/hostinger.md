# Publicar na Hostinger

Este projeto precisa de servidor Node.js para executar as APIs de loja e pagamento. Upload comum em public_html não é suficiente. Use **Aplicação Node.js** no hPanel de um plano compatível, ou VPS com Node.js.

Referências oficiais: [publicação Node.js](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) e [correção de estrutura, diretório e comandos](https://www.hostinger.com/support/fix-failed-to-build-application-error-hostinger-node-js/).

## Código-fonte e build

1. Faça commit de **todas as alterações**, incluindo a remoção dos arquivos do antigo diretório `site/`, e envie o commit ao GitHub. Confirme que `package.json` aparece ao abrir a raiz do repositório no GitHub.
2. No hPanel, importe esse repositório como aplicação Node.js. Se já existir uma implantação, abra a configuração de republicação e remova a referência antiga a `site/`.
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

## Stripe e lançamento

O backend atual ainda é Stripe. **InfinitePay não foi integrada nesta reorganização.** Se a operação usar InfinitePay, conclua a substituição do checkout e da confirmação do pagamento antes de habilitar vendas. As instruções abaixo descrevem o backend existente.

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
