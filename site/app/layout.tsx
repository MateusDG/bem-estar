import type { Metadata } from "next";
import "./globals.css";
const indexable = process.env.SITE_INDEXABLE === "true";
export const metadata: Metadata = {
  title: "Bem de Hoje | Coenzima Q10 Nutrify",
  description:
    "Conheça a Coenzima Q10 Nutrify. Escolha seu kit com informações claras, frete grátis e pagamento pela Stripe.",
  robots: { index: indexable, follow: indexable },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
