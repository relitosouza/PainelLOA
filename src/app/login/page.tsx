import { Suspense } from "react";
import { LoginView } from "@/components/login-view";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface">Carregando...</div>}>
      <LoginView />
    </Suspense>
  );
}
