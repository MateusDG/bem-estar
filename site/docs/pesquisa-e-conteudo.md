# Pesquisa aplicada à Bem de Hoje

Consulta em 5 de outubro de 2026. A interface foi desenhada para facilitar o uso por pessoas mais velhas e por familiares que compram para elas. Não pressupõe que todas as pessoas idosas tenham as mesmas necessidades.

## Decisões de UX/UI

1. Texto principal com 18 px, entrelinha ampla, contraste e possibilidade de ampliar. Controles visíveis de leitura são complementares ao zoom do navegador. Texto real, não texto embutido nas imagens.
2. Uma tarefa por etapa: escolher quantidade, revisar pedido, pagar. Nenhuma conta obrigatória na loja. Rotulagem explícita, preço total e frete antes do checkout.
3. Alvos de toque grandes nos controles principais, foco visível, rádios navegáveis por setas, abas e diálogos com primitivas acessíveis. Cor acompanhada de rótulo e estado selecionado.
4. Movimento discreto, sem rotação automática, vídeo automático ou urgência artificial. Preferência de movimento reduzido respeitada.
5. Confiança por informação verificável: fabricante, composição, embalagem real, políticas e dados reais do vendedor antes da ativação. Não há estrelas, testemunhos nem benefícios clínicos inventados.
6. Celular como principal contexto para anúncios na Meta: kits em coluna, resumo persistente e revisão simples. A faixa fixa tem espaço reservado ao final da página.

Referências:

- [W3C — websites para pessoas mais velhas](https://www.w3.org/WAI/older-users/developing/).
- [W3C — redimensionamento do texto](https://www.w3.org/WAI/WCAG21/Understanding/resize-text).
- [W3C — tamanho mínimo de alvos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- [Stripe — Checkout hospedado](https://docs.stripe.com/payments/checkout/quickstarts).
- [Stripe — criar Checkout Session](https://docs.stripe.com/api/checkout/sessions/create).

Não foi realizada auditoria completa de conformidade WCAG, teste com leitores de tela ou pesquisa com participantes idosos. As verificações cobrem a implementação e os fluxos descritos no README.

## Conteúdo do produto

Fonte: [Coenzima Q10 Nutrify — SKU 1001726](https://www.nutrify.com.br/coenzima-q10/p?skuId=1001726), dados do produto e ficha nutricional do fabricante.

- Frasco de 60 cápsulas vegetais; produto sem glúten e sem lactose.
- Porção de 1,14 g: duas cápsulas. **100 mg de Coenzima Q10 por porção**, não por cápsula.
- 30 porções por frasco, vitamina E 15 mg (100% VD), fibras 0,7 g (3% VD).
- Ingredientes transcritos da ficha do SKU. Não se deduziu recomendação de uso individual nem duração de tratamento.
- Preços fornecidos pelo lojista: R$ 69,90 / R$ 99,90 / R$ 149,90. Economia calculada contra unidades avulsas a R$ 69,90, sem referência a preço promocional do fabricante.

[Anvisa — suplementos alimentares](https://www.gov.br/anvisa/pt-br/assuntos/alimentos/suplementos-alimentares/perguntas-frequentes/) e [cuidados com propaganda enganosa](https://www.gov.br/anvisa/pt-br/assuntos/alimentos/suplementos-alimentares/cuidado-com-a-propaganda-enganosa): suplementos não devem ser apresentados como prevenção ou tratamento de doenças. A página não afirma rejuvenescimento, tratamento cardiovascular ou alívio de sintomas.

[Ministério da Justiça — direitos nas compras pela internet](https://www.gov.br/mj/pt-br/assuntos/noticias-1/dia-dos-pais-conheca-os-direitos-do-consumidor-na-compra-de-presentes): arrependimento em sete dias a partir do recebimento ou assinatura, com devolução integral dos valores. A operação deve cumprir o atendimento e logística de devolução apresentados na página.

[Receita Federal — cálculo do CNPJ alfanumérico](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj): validação aceita os formatos numérico e alfanumérico. A validação dos dígitos não comprova situação cadastral.

## Antes dos anúncios

Usar criativos coerentes com a composição e com o preço da página, sem inferir doença ou condição pessoal do visitante. Validar as políticas vigentes da Meta para o produto e o criativo específico antes de campanha. Não houve aprovação de anúncio nem criação de campanha nesta tarefa.
