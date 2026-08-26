export interface ActiveUser {
  id?: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "PLANEJAMENTO" | "TECNICO_SECRETARIA" | "LEITURA";
  secretaria?: string | null;
  codigoSecretaria?: string | null;
  cargo?: string | null;
}

export const USER_SESSION_STORAGE_KEY = "painel_loa_current_user_v1";

export const DEFAULT_USER: ActiveUser = {
  nome: "Administrador do Sistema",
  email: "admin@osasco.sp.gov.br",
  papel: "ADMIN",
  cargo: "Administrador Geral do Sistema",
};

export function getActiveUser(): ActiveUser | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(USER_SESSION_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as ActiveUser;
    }
  } catch {}
  return null;
}

export function setActiveUser(user: ActiveUser) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent("painel-loa-user-change", { detail: user }));
  } catch {}
}

export function clearActiveUser() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("painel-loa-user-change", { detail: null }));
  } catch {}
}

