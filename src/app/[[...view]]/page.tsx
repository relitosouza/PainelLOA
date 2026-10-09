import { AppShell } from "@/components/app-shell";
import TransparentePage from "@/app/transparente/page";

export default async function Page({ params }: { params: Promise<{ view?: string[] }> }) {
  const { view } = await params;
  const currentView = view?.[0];

  // Se o usuário acessar a raiz /, renderiza diretamente o Orçamento Transparente público
  if (!currentView) {
    return <TransparentePage />;
  }

  return <AppShell view={currentView} />;
}

