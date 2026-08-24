"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getActiveUser, setActiveUser, clearActiveUser, type ActiveUser, DEFAULT_USER } from "@/lib/user-session";

const ROLE_LABELS: Record<string, { label: string; badgeClass: string; icon: string }> = {
  ADMIN: { label: "Administrador", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: "shield_person" },
  PLANEJAMENTO: { label: "Planejamento Central", badgeClass: "bg-blue-100 text-blue-800 border-blue-300", icon: "account_tree" },
  TECNICO_SECRETARIA: { label: "Técnico Setorial", badgeClass: "bg-amber-100 text-amber-800 border-amber-300", icon: "badge" },
  LEITURA: { label: "Apenas Leitura", badgeClass: "bg-slate-100 text-slate-800 border-slate-300", icon: "visibility" },
};

export function UserProfileMenu() {
  const [user, setUser] = useState<ActiveUser>(DEFAULT_USER);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<ActiveUser[]>([]);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getActiveUser());

    const handleUserChange = () => {
      setUser(getActiveUser());
    };

    window.addEventListener("painel-loa-user-change", handleUserChange);
    return () => window.removeEventListener("painel-loa-user-change", handleUserChange);
  }, []);

  useEffect(() => {
    // Carregar usuários do banco para o alternador rápido
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/usuarios");
        if (res.ok) {
          const data = await res.json();
          if (data.usuarios && Array.isArray(data.usuarios)) {
            setAvailableUsers(data.usuarios);
          }
        }
      } catch {}
    };
    fetchUsers();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleSelectUser = (u: ActiveUser) => {
    setActiveUser(u);
    setUser(u);
    setDropdownOpen(false);
  };

  const handleConfirmLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    clearActiveUser();
    setUser(DEFAULT_USER);
    setLogoutModalOpen(false);
    setDropdownOpen(false);
    window.location.href = "/login";
  };

  const roleInfo = ROLE_LABELS[user.papel] || ROLE_LABELS.ADMIN;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Perfil no TopNav */}
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-outline-variant text-left"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shadow-xs">
          {user.nome.charAt(0).toUpperCase()}
        </div>
        <div className="hidden lg:block text-xs text-left leading-tight">
          <p className="font-bold text-on-surface truncate max-w-[140px]">{user.nome}</p>
          <span className="text-[10px] text-on-surface-variant font-medium">{roleInfo.label}</span>
        </div>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant hidden sm:block">
          {dropdownOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Menu Dropdown Flutuante */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-surface border border-outline-variant shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header do Usuário */}
          <div className="p-4 bg-surface-container border-b border-outline-variant">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sm text-on-surface">{user.nome}</p>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5 truncate">{user.email}</p>
                {user.cargo && <p className="text-[11px] text-on-surface-variant mt-0.5">{user.cargo}</p>}
                {user.secretaria && (
                  <p className="text-[11px] text-primary font-semibold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">apartment</span>
                    {user.secretaria}
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.badgeClass}`}>
                <span className="material-symbols-outlined text-[12px]">{roleInfo.icon}</span>
                {roleInfo.label}
              </span>
            </div>
          </div>

          {/* Alternar Perfil Rápido */}
          {availableUsers.length > 0 && (
            <div className="p-3 border-b border-outline-variant/60 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-1 mb-2">
                Alternar Usuário / Perfil:
              </p>
              <div className="space-y-1">
                {availableUsers.map((u) => {
                  const isCurrent = u.email === user.email;
                  const uRole = ROLE_LABELS[u.papel] || ROLE_LABELS.ADMIN;
                  return (
                    <button
                      key={u.id || u.email}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? "bg-primary/10 text-primary font-bold"
                          : "hover:bg-surface-container text-on-surface"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="truncate font-semibold">{u.nome}</p>
                        <p className="text-[10px] text-on-surface-variant truncate">{u.secretaria || u.cargo || u.email}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${uRole.badgeClass}`}>
                        {u.papel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ações do Menu */}
          <div className="p-2 bg-surface space-y-1">
            <Link
              href="/configuracoes"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">settings</span>
              <span>Gerenciar Usuários & Acessos</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setLogoutModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-900 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-rose-600">logout</span>
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Logout */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">logout</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Deseja realmente sair?</h3>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Você será desconectado da sessão atual ({user.nome}). Todas as suas alterações salvas no banco de dados estão seguras.
            </p>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-outline-variant text-on-surface hover:bg-surface-container cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Confirmar e Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
