"use client";
import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  Headphones,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deliveryLabel, product, type StoreConfig } from "@/lib/catalog";
export default function ProductDetails({
  store,
  help,
}: {
  store: StoreConfig;
  help: () => void;
}) {
  return (
    <>
      <section
        className="details-section section-space wrap"
        id="composicao"
        aria-labelledby="details-title"
      >
        <div className="details-intro">
          <p className="eyebrow">02 / CONHEÇA O PRODUTO</p>
          <h2 id="details-title">
            Menos dúvidas.
            <br />
            <em>Mais clareza.</em>
          </h2>
          <p>O que vem no frasco e o que considerar antes de usar.</p>
          <div className="detail-facts">
            <span>
              <Check aria-hidden="true" /> Cápsulas vegetais
            </span>
            <span>
              <Check aria-hidden="true" /> Sem glúten
            </span>
            <span>
              <Check aria-hidden="true" /> Sem lactose
            </span>
          </div>
          <a
            className="source-link"
            href={product.source}
            target="_blank"
            rel="noopener noreferrer"
          >
            Informações do fabricante{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
        <Tabs className="product-tabs" defaultValue="composition">
          <TabsList
            aria-label="Informações do produto"
            className="detail-tabs-list"
          >
            <TabsTrigger value="composition">Composição</TabsTrigger>
            <TabsTrigger value="use">Como usar</TabsTrigger>
            <TabsTrigger value="care">Cuidados</TabsTrigger>
          </TabsList>
          <TabsContent value="composition" className="detail-panel">
            <h3>Dentro de cada porção</h3>
            <p>Porção de {product.serving}. Cada frasco tem 30 porções.</p>
            <Table aria-label="Composição por porção de duas cápsulas">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Nutriente</TableHead>
                  <TableHead scope="col">Quantidade</TableHead>
                  <TableHead scope="col">% VD*</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Coenzima Q10</TableCell>
                  <TableCell>100 mg</TableCell>
                  <TableCell>—</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vitamina E</TableCell>
                  <TableCell>15 mg</TableCell>
                  <TableCell>100%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Fibras alimentares</TableCell>
                  <TableCell>0,7 g</TableCell>
                  <TableCell>3%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <p className="nutrition-note">
              *Percentual de valores diários fornecidos pela porção. Valor
              diário não estabelecido para Coenzima Q10.
            </p>
            <h4>Ingredientes</h4>
            <p className="ingredients">{product.ingredients}</p>
          </TabsContent>
          <TabsContent value="use" className="detail-panel">
            <span className="panel-number">01</span>
            <h3>Seu cuidado é individual.</h3>
            <p>
              A tabela nutricional usa uma porção de duas cápsulas. Essa
              informação não substitui uma orientação de uso individual.
            </p>
            <p>
              Siga as instruções e advertências da embalagem. Converse com seu
              médico ou nutricionista para saber se o produto é adequado para
              você e como incluí-lo na sua rotina.
            </p>
            <p>
              Guarde conforme as orientações do rótulo e observe o prazo de
              validade.
            </p>
          </TabsContent>
          <TabsContent value="care" className="detail-panel">
            <span className="panel-number">!</span>
            <h3>Leia antes de usar.</h3>
            <p>
              Este produto é um suplemento alimentar. Não é um medicamento e não
              deve ser usado para tratar ou prevenir doenças.
            </p>
            <p>
              Se você usa medicamentos, tem alguma condição de saúde, está
              grávida ou amamentando, procure orientação profissional antes do
              consumo.
            </p>
            <p>
              Confira as restrições de uso, faixa etária, ingredientes e demais
              advertências na embalagem. Mantenha fora do alcance de crianças.
            </p>
          </TabsContent>
        </Tabs>
      </section>
      <section className="editorial-section">
        <div className="editorial-image">
          <Image
            sizes="(max-width: 760px) 100vw, 55vw"
            src="/images/bem-de-hoje-editorial.webp"
            alt="Mulher de cabelos grisalhos aproveitando uma manhã tranquila em um jardim"
            width={1400}
            height={933}
            loading="lazy"
          />
        </div>
        <div className="editorial-copy">
          <p className="eyebrow">BEM DE HOJE</p>
          <h2>
            O tempo é seu.
            <br />A escolha <em>também.</em>
          </h2>
          <p>
            Acreditamos em escolhas bem informadas. Por isso, aqui você encontra
            o produto, a composição e o preço completo — com espaço para decidir
            com calma.
          </p>
          <a href="#kits" className="editorial-link">
            Encontrar meu kit <ArrowUpRight size={21} aria-hidden="true" />
          </a>
        </div>
      </section>
      <section
        className="delivery-section section-space wrap"
        id="entrega"
        aria-labelledby="delivery-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">03 / DO PEDIDO À SUA CASA</p>
            <h2 id="delivery-title" tabIndex={-1}>
              Você sabe
              <br />
              <em>o próximo passo.</em>
            </h2>
          </div>
          <p>
            Frete grátis. {deliveryLabel(store)} após a confirmação do
            pagamento.
          </p>
        </div>
        <Tabs defaultValue="order" className="delivery-tabs">
          <TabsList
            className="delivery-tabs-list"
            aria-label="Etapas da compra e entrega"
          >
            <TabsTrigger value="order">
              <span>1</span> Seu pedido
            </TabsTrigger>
            <TabsTrigger value="prepare">
              <span>2</span> Preparação
            </TabsTrigger>
            <TabsTrigger value="updates">
              <span>3</span> Sua entrega
            </TabsTrigger>
          </TabsList>
          <TabsContent value="order" className="delivery-panel">
            <ShoppingBag aria-hidden="true" />
            <div>
              <h3>Escolha, confira e pague.</h3>
              <p>
                Selecione seu kit e revise o total. No checkout da InfinitePay,
                informe seu contato e o endereço completo da entrega. Não é
                preciso criar uma conta na nossa loja.
              </p>
            </div>
            <span className="delivery-tag">
              <Truck size={18} aria-hidden="true" /> Frete grátis
            </span>
          </TabsContent>
          <TabsContent value="prepare" className="delivery-panel">
            <Package aria-hidden="true" />
            <div>
              <h3>Pagamento confirmado. Pedido em preparação.</h3>
              <p>
                Depois da confirmação do pagamento, nossa equipe prepara seu
                pedido para envio. Acompanhe as mensagens no contato informado
                na compra.
              </p>
              <p>{deliveryLabel(store)} após a confirmação do pagamento.</p>
            </div>
          </TabsContent>
          <TabsContent value="updates" className="delivery-panel">
            <Headphones aria-hidden="true" />
            <div>
              <h3>As atualizações chegam até você.</h3>
              <p>
                Nossa equipe envia manualmente as informações de envio e as
                atualizações da entrega pelo contato informado na compra. Se
                houver código de rastreio, ele será enviado junto.
              </p>
              <button className="text-button" onClick={help}>
                Consultar o atendimento
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </section>
      <section
        className="faq-section section-space"
        id="duvidas"
        aria-labelledby="faq-title"
      >
        <div className="wrap faq-layout">
          <div>
            <p className="eyebrow">04 / PODE PERGUNTAR</p>
            <h2 id="faq-title">
              Ficou alguma
              <br />
              <em>dúvida?</em>
            </h2>
            <p>
              Informação fácil de encontrar.
              <br />
              Para você decidir com confiança.
            </p>
            <button className="outline-button" onClick={help}>
              <Headphones size={19} aria-hidden="true" /> Preciso de ajuda
            </button>
          </div>
          <Accordion type="single" collapsible className="faq-list">
            <AccordionItem value="shipping">
              <AccordionTrigger>
                O frete é grátis em todos os kits?
              </AccordionTrigger>
              <AccordionContent>
                Sim. Os kits com 1, 2 ou 3 frascos têm frete grátis. O resumo do
                pedido mostra o valor dos produtos e o frete antes do pagamento.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="serving">
              <AccordionTrigger>Os 100 mg são por cápsula?</AccordionTrigger>
              <AccordionContent>
                Não. Segundo a tabela do fabricante, 100 mg de Coenzima Q10
                correspondem a uma porção de 2 cápsulas. Cada frasco contém 60
                cápsulas, equivalentes a 30 porções. Siga as orientações da
                embalagem e do seu profissional de saúde.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tracking">
              <AccordionTrigger>
                Como recebo as informações da entrega?
              </AccordionTrigger>
              <AccordionContent>
                Nossa equipe envia as atualizações manualmente pelo contato
                informado no pagamento. Quando houver código de rastreio, você
                também receberá essa informação.
                <> {deliveryLabel(store)} após a confirmação do pagamento.</>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="payment">
              <AccordionTrigger>Como funciona o pagamento?</AccordionTrigger>
              <AccordionContent>
                Depois de revisar seu pedido, você segue para uma página segura
                da InfinitePay. Lá você informa seu contato e endereço e escolhe
                entre as formas de pagamento disponíveis. A compra é única, sem
                assinatura. No cartão, pague em até 4x sem juros.
                {!store.checkoutReady && (
                  <>
                    {" "}
                    A loja está em preparação e o pagamento ainda não está
                    disponível.
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="account">
              <AccordionTrigger>Preciso criar uma conta?</AccordionTrigger>
              <AccordionContent>
                Não é necessário criar uma conta na nossa loja. Você informa no
                pagamento os dados necessários para a compra e entrega.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns">
              <AccordionTrigger>
                Posso cancelar ou devolver minha compra?
              </AccordionTrigger>
              <AccordionContent>
                Em compras pela internet, você pode solicitar o cancelamento por
                arrependimento em até 7 dias corridos a partir do recebimento.
                Consulte “Trocas e devoluções” no rodapé para saber como
                solicitar atendimento.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </>
  );
}
