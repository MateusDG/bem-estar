# Bem de Hoje

Página de produto com kits de Coenzima Q10 Nutrify e integração preparada para Stripe Checkout.

O aplicativo fica em [`site/`](./site/). Consulte o [guia do site](./site/README.md) para configurar pagamentos, dados da loja e entrega.

## Desenvolvimento local

Requer Node.js 22.13 ou superior.

```sh
cd site
npm ci
npm run dev -- --host 127.0.0.1
```

## Verificação

```sh
cd site
npx tsc --noEmit
node --experimental-strip-types --test scripts/commerce.test.ts
npm run build
```

Os testes de pagamento usam respostas simuladas, sem cobranças reais. As vendas permanecem desativadas até a configuração da Stripe e dos dados operacionais.

## Configuração e Git

Use `site/.dev.vars.example` como modelo de configuração local. Credenciais reais, dependências, builds, dados locais e arquivos de publicação são ignorados pelo Git. O código, as imagens utilizadas na página e `site/package-lock.json` devem ser versionados.
