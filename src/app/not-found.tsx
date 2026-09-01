import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4 text-center">
      <h1 className="text-4xl font-headline font-bold text-on-surface">404 - Página não encontrada</h1>
      <p className="mt-2 text-sm text-on-surface-variant">A página que você está procurando não existe ou foi movida.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary/90 transition-colors"
      >
        <span className="material-symbols-outlined text-base">home</span>
        Voltar para o Início
      </Link>
    </div>
  );
}
