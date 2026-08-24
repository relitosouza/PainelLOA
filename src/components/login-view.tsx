"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { setActiveUser } from "@/lib/user-session";

const TEST_PROFILES = [
  {
    papel: "ADMIN",
    label: "Administrador Geral",
    email: "admin@osasco.sp.gov.br",
    senha: "Admin@Osasco2027",
    icon: "shield_person",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    desc: "Acesso total irrestrito",
  },
  {
    papel: "PLANEJAMENTO",
    label: "Planejamento LOA",
    email: "alex.sf@osasco.sp.gov.br",
    senha: "Plan@Osasco2027",
    icon: "account_tree",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    desc: "04 - Finanças / Planejamento",
  },
  {
    papel: "TECNICO_SECRETARIA",
    label: "Técnico de Saúde",
    email: "tecnico.saude@osasco.sp.gov.br",
    senha: "Saude@Osasco2027",
    icon: "health_and_safety",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    desc: "09 - Secretaria da Saúde",
  },
  {
    papel: "TECNICO_SECRETARIA",
    label: "Técnico de Educação",
    email: "tecnico.educacao@osasco.sp.gov.br",
    senha: "Educacao@Osasco2027",
    icon: "school",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    desc: "08 - Secretaria de Educação",
  },
  {
    papel: "LEITURA",
    label: "Auditoria / CGM",
    email: "auditoria@osasco.sp.gov.br",
    senha: "Consulta@Osasco2027",
    icon: "visibility",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    desc: "27 - Controladoria Geral",
  },
];

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const targetEmail = (customEmail ?? email).trim();
    const targetPassword = customPassword ?? password;

    if (!targetEmail || !targetPassword) {
      setErrorMsg("Por favor, preencha o e-mail e a senha.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setActiveUser(data.user);
        router.push(redirectUrl);
        router.refresh();
      } else {
        setErrorMsg(data.error || "Falha na autenticação. Verifique os dados.");
      }
    } catch {
      setErrorMsg("Erro de conexão ao comunicar com o servidor de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (p: typeof TEST_PROFILES[0]) => {
    setEmail(p.email);
    setPassword(p.senha);
    handleLogin(undefined, p.email, p.senha);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-surface-container-low p-4 sm:p-6 md:p-10 font-body">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-surface border border-outline-variant shadow-2xl overflow-hidden">
        
        {/* Painel Esquerdo: Identidade Institucional */}
        <div className="md:col-span-5 bg-gradient-to-br from-primary-container/30 via-surface-container to-surface p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-outline-variant">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/brasao.png"
                alt="Brasão de Osasco"
                width={48}
                height={48}
                className="h-12 w-auto object-contain drop-shadow-xs"
              />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                  Município de Osasco
                </p>
                <h1 className="text-xl font-headline font-bold text-on-surface leading-tight">
                  Painel LOA
                </h1>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl bg-surface p-4 border border-outline-variant shadow-xs">
                <p className="text-xs font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">account_balance</span>
                  Gestão Orçamentária LOA
                </p>
                <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                  Sistema integrado de elaboração, análise analítica de dotações, receitas e controle por secretarias.
                </p>
              </div>

              <div className="rounded-2xl bg-surface p-4 border border-outline-variant shadow-xs">
                <p className="text-xs font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[18px]">verified_user</span>
                  Trilha Segura e Auditada
                </p>
                <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
                  Histórico completo de alterações, operadores responsáveis e controle granular de acessos setoriais.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-outline-variant/60 text-[11px] text-on-surface-variant">
            Prefeitura Municipal de Osasco • Exercício 2027
          </div>
        </div>

        {/* Painel Direito: Formulário de Login */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-surface">
          <div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Acesso Corporativo
            </span>
            <h2 className="text-2xl font-headline font-bold text-on-surface mt-2">
              Entrar no Sistema
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Informe suas credenciais institucionais para autenticar.
            </p>
          </div>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => handleLogin(e)} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5" htmlFor="login-email">
                E-mail Institucional
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  mail
                </span>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@osasco.sp.gov.br"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5" htmlFor="login-password">
                Senha de Acesso
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  lock
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer p-1"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Acessar Painel</span>
                </>
              )}
            </button>
          </form>

          {/* Perfis de Acesso Rápido (Homologação / Demonstração) */}
          <div className="mt-8 pt-6 border-t border-outline-variant/60">
            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
              Acesso Rápido por Perfil (Homologação):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEST_PROFILES.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handleQuickLogin(p)}
                  disabled={loading}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary/40 text-left transition-all cursor-pointer group"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {p.label}
                    </p>
                    <p className="text-[10px] text-on-surface-variant truncate font-mono">
                      {p.desc}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${p.badgeClass}`}>
                    {p.papel === "TECNICO_SECRETARIA" ? "TÉCNICO" : p.papel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
