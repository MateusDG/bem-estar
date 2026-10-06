import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Bem de Hoje | Coenzima Q10 Nutrify",
  description: "Conheça a Coenzima Q10 Nutrify. Escolha seu kit com informações claras, frete grátis e pagamento pela Stripe.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
