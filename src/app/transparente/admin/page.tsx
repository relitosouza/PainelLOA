import { Metadata } from "next";
import { TransparenteAdminView } from "@/components/transparente-admin-view";

export const metadata: Metadata = {
  title: "Gestão do Orçamento Transparente | Painel LOA",
  description: "Gerenciamento desacoplado de dados, áreas e investimentos para o Orçamento Transparente.",
};

export default function TransparenteAdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <TransparenteAdminView />
    </div>
  );
}
