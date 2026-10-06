# Bem de Hoje

Página de produto com kits de Coenzima Q10 Nutrify, interface para pessoas 60+ e integração preparada para Stripe Checkout. Entrega informada: até 10 dias úteis após a confirmação do pagamento.

A aplicação fica em [site/](site/), preparada para Next.js em hospedagem Node.js da Hostinger. Consulte o [guia de publicação](site/docs/hostinger.md) e a [documentação](site/README.md).

## Desenvolvimento e verificação

Requer Node.js 22.13 ou superior.

```sh
cd site
npm ci
npm run dev
```

Abra http://127.0.0.1:5173. Para validar e gerar o build:

```sh
npm run lint
npx tsc --noEmit
npm run test:commerce
npm run build
```

npm start executa o servidor de produção. Use site/.env.example como modelo de site/.env.local em testes locais, ou configure variáveis no hPanel. Segredos, dependências e builds são ignorados pelo Git.

As vendas ficam desativadas até configurar Stripe e domínio. Os testes de comércio são simulados, sem cobranças reais. A publicação e a validação de pagamentos com credenciais reais devem ser concluídas pelo responsável.
