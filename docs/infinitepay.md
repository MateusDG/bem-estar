# Checkout Integrado da InfinitePay

Fontes: [documentação do checkout](https://www.infinitepay.io/checkout-documentacao) e [central de ajuda](https://ajuda.infinitepay.io/pt-BR/articles/10766888-como-usar-o-checkout-integrado-da-infinitepay), consultadas em 06/10/2026. O registro local usa o [SQLite do Node.js 22.13+](https://nodejs.org/download/release/v22.13.1/docs/api/sqlite.html), disponível sem flag a partir dessa versão e ainda experimental no Node.js 22.

## O que acontece na compra

1. O cliente escolhe um kit e revisa quantidade, total e frete grátis.
2. POST /api/checkout valida a origem e o pedido, ignora qualquer preço vindo do cliente por rejeitar campos extras e registra um pedido privado.
3. O servidor envia handle, order_nsu, um item com o preço total do kit, redirect_url e webhook_url por POST https://api.checkout.infinitepay.io/links.
4. O navegador recebe a URL retornada pela InfinitePay e segue para um dos domínios oficiais de checkout permitidos. O endereço deve pertencer à conta configurada.
5. Depois do pagamento, o comprador clica em Continuar na InfinitePay. O site verifica order_nsu, transaction_nsu e slug por POST https://api.checkout.infinitepay.io/payment_check. A tela só confirma aprovação depois dessa consulta ou de confirmação já persistida pelo webhook.
6. O webhook também verifica a API antes de salvar a aprovação. O total original precisa bater com o pedido. Notificações repetidas não geram outra confirmação. A entrega continua sendo atualizada manualmente.

## Variáveis da hospedagem

| Variável | Valor |
|---|---|
| INFINITEPAY_HANDLE | mateus-diniz-5eo, sem $ |
| SITE_URL | https://bemnasaude.com.br |
| COMMERCE_DATA_DIR | Pasta privada persistente fora da aplicação/release, caminho absoluto |
| CHECKOUT_ENABLED | true depois de configurar o armazenamento |
| CHECKOUT_TEST_ENABLED | true somente durante o teste real de R$ 1,00 |
| DELIVERY_MAX_DAYS | 10 |

Use o exemplo de caminho e os comandos de publicação em [Hostinger](hostinger.md#infinitepay-e-lançamento). O caminho precisa existir ou permitir criação pelo processo Node.js, com permissão 0700. O SQLite é uma instalação local em disco; não use este modelo em hospedagem sem disco persistente ou com instâncias em hosts separados. Nesse caso, migre o registro para um banco compartilhado antes de habilitar compras.

A chave inchk não é usada pelo fluxo público documentado e validado. Não grave chaves reais em .env.example, Git, páginas públicas ou NEXT_PUBLIC_*. A pasta privada e arquivos SQLite foram adicionados ao .gitignore.

## Endereços

- Página da loja: https://bemnasaude.com.br/
- Webhook, após publicar o código: https://bemnasaude.com.br/api/webhooks/infinitepay (POST, usado pela InfinitePay).
- Retorno do cliente: https://bemnasaude.com.br/?checkout=complete (a InfinitePay acrescenta os dados do pedido).
- Checkout de pagamento: URL dinâmica retornada pelo provedor para cada pedido; não há um link fixo para os três kits.

Cada chamada de criação envia o webhook e o retorno. Abrir a URL do webhook no navegador envia GET e não testa a notificação; o servidor aceita POST JSON.

## Conferência antes de tráfego pago

- Habilite Checkout Integrado e Etapa de endereço na conta. Ambos foram vistos habilitados no painel em 06/10/2026.
- Confira cartão, Pix e como a conta trata taxas de parcelamento. A configuração verificada em 06/10/2026 assume as taxas até 4x; por isso a loja oferece até 4x sem juros. O painel atualmente lista somente cartão como meio habilitado. O preço enviado é o total original do kit, com frete grátis. Atualize esse aviso se a política de taxas mudar.
- Execute npm run test:commerce, npm run lint e npm run build. Os testes não fazem pagamentos.
- Após publicar, confira GET /api/store: checkoutReady deve ser true. Configure hPanel e republique se for false; nenhuma credencial é retornada por essa rota.
- Confira os três kits no checkout, incluindo quantidade e total. Teste uma compra pela operação, acompanhe a aprovação no painel e verifique retorno/webhook e persistência após reiniciar o processo. Não marque uma venda como paga pelo texto da URL.
- Consulte contatos e endereço no painel InfinitePay antes de enviar e mantenha backup do banco privado. A aplicação não envia mensagens nem atualizações de entrega automaticamente.

## Verificação técnica realizada

### Produto de teste de R$ 1,00

A página `/teste-checkout` oferece uma cobrança real e única de 100 centavos, sem entrega física. Ela usa os mesmos pedidos persistentes, criação de link, webhook e confirmação dos kits. O preço é definido no servidor. O cartão segue a política da conta, que assume as taxas até 4x, respeitando os limites de valor e parcelas do provedor.

Habilite `CHECKOUT_TEST_ENABLED=true` na hospedagem para disponibilizar o botão. Após concluir a compra de teste e conferir o retorno e a confirmação, defina a variável como `false` para encerrar os testes. Pedidos existentes continuam consultáveis. A página tem `noindex` e não aparece entre os kits.

Uma chamada real à API gerou um link para a conta configurada sem exigir API Key. Apenas o link foi criado: nenhum cartão, dado pessoal ou pagamento foi enviado. A aprovação, os erros e os eventos duplicados são testados com respostas simuladas; aprovação real e entrega de webhook público não podem ser afirmadas por esses testes.
