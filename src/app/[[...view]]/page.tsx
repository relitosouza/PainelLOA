import { AppShell } from "@/components/app-shell";

export default async function Page({ params }: { params: Promise<{ view?: string[] }> }) {
  const { view } = await params;
  return <AppShell view={view?.[0] ?? "dashboard"} />;
}

