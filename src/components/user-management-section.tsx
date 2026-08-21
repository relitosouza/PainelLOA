"use client";

import { useEffect, useState, useCallback } from "react";
import { SECRETARIAS_NOMES } from "@/lib/secretarias-catalogo";

interface UsuarioItem {
  id: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "PLANEJAMENTO" | "TECNICO_SECRETARIA" | "LEITURA";
  ativo: boolean;
  secretaria: string | null;
  codigoSecretaria: string | null;
  cargo: string | null;
  telefone: string | null;
  criadoEm: string;
  _count?: {
    alteracoesRealizadas: number;
    exclusoesRealizadas: number;
  };
}

export function UserManagementSection() {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterSecretaria, setFilterSecretaria] = useState("");

  // Formulário de Criação
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<"ADMIN" | "PLANEJAMENTO" | "TECNICO_SECRETARIA" | "LEITURA">("TECNICO_SECRETARIA");
  const [secretaria, setSecretaria] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const url = filterSecretaria
        ? `/api/usuarios?secretaria=${encodeURIComponent(filterSecretaria)}`
        : "/api/usuarios";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data.usuarios || []);
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  }, [filterSecretaria]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!nome.trim() || !email.trim()) {
      setFormError("Preencha o nome e o e-mail.");
      return;
    }

    if (papel === "TECNICO_SECRETARIA" && !secretaria) {
      setFormError("Técnicos de Secretaria devem estar vinculados a uma Secretaria.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          papel,
          secretaria: papel === "ADMIN" || papel === "PLANEJAMENTO" ? (secretaria || null) : secretaria,
          cargo: cargo.trim() || null,
          telefone: telefone.trim() || null,
          ativo: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || "Erro ao salvar usuário.");
        return;
      }

      setFormSuccess("Usuário cadastrado com sucesso!");
      setNome("");
      setEmail("");
      setCargo("");
      setTelefone("");
      setSecretaria("");
      setPapel("TECNICO_SECRETARIA");
      await carregarUsuarios();
      setTimeout(() => {
        setModalOpen(false);
        setFormSuccess("");
      }, 1200);
    } catch {
      setFormError("Erro de conexão com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPapelBadge = (p: string) => {
    switch (p) {
      case "ADMIN":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "PLANEJAMENTO":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "TECNICO_SECRETARIA":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "LEITURA":
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPapelLabel = (p: string) => {
    switch (p) {
      case "ADMIN":
        return "Administrador Geral";
      case "PLANEJAMENTO":
        return "Equipe Planejamento (Finanças)";
      case "TECNICO_SECRETARIA":
        return "Técnico Setorial";
      case "LEITURA":
      default:
        return "Consulta / Leitura";
    }
  };

  return (
    <section className="panel bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-xs mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">badge</span>
            <h2 className="text-lg font-bold text-on-surface">Gestão de Usuários & Secretarias</h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Cadastre e vincule servidores às suas respectivas secretarias para controle de permissões e auditoria de alterações.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-on-primary bg-primary rounded-xl hover:opacity-90 transition-opacity shrink-0 shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-lg text-xs">
          <span className="font-semibold text-on-surface-variant">Filtrar por Secretaria:</span>
          <select
            value={filterSecretaria}
            onChange={(e) => setFilterSecretaria(e.target.value)}
            className="bg-transparent font-medium text-on-surface outline-none cursor-pointer"
          >
            <option value="">Todas as Secretarias</option>
            {Object.entries(SECRETARIAS_NOMES).map(([cod, nomeSec]) => (
              <option key={cod} value={cod}>
                {cod} - {nomeSec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container font-bold text-on-surface-variant border-b border-outline-variant">
            <tr>
              <th className="px-4 py-3">Nome / Cargo</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel / Acesso</th>
              <th className="px-4 py-3">Secretaria Vinculada</th>
              <th className="px-4 py-3 text-center">Atividade Registrada</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                  Carregando usuários cadastrados...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                  Nenhum usuário encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-bold text-on-surface">{u.nome}</div>
                    {u.cargo && <div className="text-[10px] text-on-surface-variant">{u.cargo}</div>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-on-surface-variant">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPapelBadge(u.papel)}`}>
                      {getPapelLabel(u.papel)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.secretaria ? (
                      <span className="font-medium text-on-surface">{u.secretaria}</span>
                    ) : (
                      <span className="text-on-surface-variant italic">Geral / Todas</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono">
                    <span className="font-bold text-primary">{u._count?.alteracoesRealizadas ?? 0}</span> alterações
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.ativo ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação de Usuário */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-2xl shadow-2xl border border-outline-variant max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person_add</span>
                <h3 className="font-bold text-sm text-on-surface">Novo Usuário do Sistema</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarUsuario} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">E-mail Institucional *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@osasco.sp.gov.br"
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Perfil / Papel *</label>
                  <select
                    value={papel}
                    onChange={(e) => setPapel(e.target.value as "ADMIN" | "PLANEJAMENTO" | "TECNICO_SECRETARIA" | "LEITURA")}
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="TECNICO_SECRETARIA">Técnico de Secretaria</option>
                    <option value="PLANEJAMENTO">Equipe Planejamento (Finanças)</option>
                    <option value="ADMIN">Administrador do Sistema</option>
                    <option value="LEITURA">Somente Leitura</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Secretaria Vinculada {papel === "TECNICO_SECRETARIA" ? "*" : "(Opcional)"}
                  </label>
                  <select
                    value={secretaria}
                    onChange={(e) => setSecretaria(e.target.value)}
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Geral / Todas</option>
                    {Object.entries(SECRETARIAS_NOMES).map(([cod, nomeSec]) => (
                      <option key={cod} value={`${cod} - ${nomeSec}`}>
                        {cod} - {nomeSec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Diretor Financeiro"
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Telefone / Ramal</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="Ex: (11) 3652-9000"
                    className="w-full text-xs rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-on-primary bg-primary rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Cadastrando..." : "Cadastrar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
