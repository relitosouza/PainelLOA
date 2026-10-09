"use client";

import { useState } from "react";

type SugerirInvestimentoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  areasDisponiveis?: { key: string; label: string }[];
};

export function SugerirInvestimentoModal({
  isOpen,
  onClose,
  areasDisponiveis = [
    { key: "saude", label: "Saúde" },
    { key: "educacao", label: "Educação" },
    { key: "obras", label: "Obras e Infraestrutura" },
    { key: "mobilidade", label: "Mobilidade Urbana" },
    { key: "social", label: "Assistência Social e Segurança" },
    { key: "cultura", label: "Cultura" },
    { key: "habitacao", label: "Habitação" },
    { key: "emprego", label: "Emprego e Renda" },
  ],
}: SugerirInvestimentoModalProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [bairro, setBairro] = useState("");
  const [area, setArea] = useState(areasDisponiveis[0]?.label || "Saúde");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !titulo.trim() || !descricao.trim()) {
      setErro("Por favor, preencha seu nome, o título do projeto e a descrição da sugestão.");
      return;
    }

    try {
      setEnviando(true);
      const res = await fetch("/api/transparente/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          bairro,
          area,
          titulo,
          descricao,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSucesso(true);
      } else {
        setErro(data.error || "Não foi possível registrar sua sugestão.");
      }
    } catch {
      setErro("Falha na conexão com o servidor. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
  };

  const handleResetAndClose = () => {
    setNome("");
    setEmail("");
    setBairro("");
    setTitulo("");
    setDescricao("");
    setSucesso(false);
    setErro(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sugerir-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={handleResetAndClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/40 flex items-start justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary text-2xl">campaign</span>
            </div>
            <div>
              <h3 id="modal-sugerir-titulo" className="font-headline-md text-headline-md text-primary font-bold">
                Sugerir Investimento
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Compartilhe com a Prefeitura de Osasco sua ideia ou prioridade para o orçamento
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container transition-colors"
            aria-label="Fechar modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {sucesso ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h4 className="font-headline-md text-xl font-bold text-foreground">
                Sugestão Registrada com Sucesso!
              </h4>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                Muito obrigado por participar. Sua contribuição é fundamental para o planejamento orçamentário participativo da nossa cidade.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="bg-primary text-on-primary px-8 py-2.5 rounded-xl font-label-md text-sm hover:opacity-90 transition-opacity font-semibold shadow-sm"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <div className="p-3.5 rounded-xl text-xs bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{erro}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Seu Nome Completo <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Maria dos Santos"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    E-mail para Acompanhamento
                  </label>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Bairro / Região
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Centro, Rochdale, Helena Maria"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Área Temática <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all"
                  >
                    {areasDisponiveis.map((a) => (
                      <option key={a.key} value={a.label}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Título da Proposta ou Projeto <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reforma e modernização da praça com pista de caminhada"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all placeholder:text-on-surface-variant/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Descrição e Benefícios para a Comunidade <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explique o problema a ser resolvido, localização sugerida e como esse investimento beneficiará o município..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-all placeholder:text-on-surface-variant/50 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={enviando}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex items-center gap-2 bg-secondary text-on-secondary px-6 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-base ${enviando ? "animate-spin" : ""}`}>
                    {enviando ? "sync" : "send"}
                  </span>
                  {enviando ? "Enviando Proposta..." : "Enviar Sugestão"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
