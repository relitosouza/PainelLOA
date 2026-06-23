import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visualizador da LOA",
  description: "Painel Executivo de Análise Orçamentária",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

