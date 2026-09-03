"use client";

import { useEffect, useMemo, useState } from "react";
import { currency, integer } from "@/lib/format";
import { BANCO_PROJETOS_DETALHES, BANCO_PROJETOS_SECRETARIAS } from "@/lib/banco-projetos-data";
import { BancoProjetoFormDialog, BancoProjetoFormData } from "./banco-projeto-form-dialog";
import * as XLSX from "xlsx";

export type BancoProjetoLinha = {
  id: string;
  secretaria: string;
  objeto: string;
  natureza: string;
  edital: string;
  valor: number;
  isCustom?: boolean;
};

type BancoProjetosFilters = { secretaria: string[]; natureza: string[]; search: string };
export type BancoProjetoAllocation = Pick<BancoProjetoLinha, "secretaria" | "objeto" | "natureza" | "valor">;

const STORAGE_KEY_CUSTOM_BANCO = "painel_loa_banco_projetos_custom_v1";

export function BancoProjetosCard({
  filters,
  allocatedKeys = [],
  onAllocate,
}: {
  filters?: BancoProjetosFilters;
  allocatedKeys?: string[];
  onAllocate?: (project: BancoProjetoAllocation) => void;
}) {
  const [linhas, setLinhas] = useState<BancoProjetoLinha[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expandedSecretarias, setExpandedSecretarias] = useState<string[]>([]);

  // Estado do Modal de CRUD
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<BancoProjetoFormData | null>(null);

  // Sincronizar e salvar alterações no LocalStorage e no Banco de Dados
  const saveProjectsToStorage = async (updatedProjects: BancoProjetoLinha[]) => {
    setLinhas(updatedProjects);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_BANCO, JSON.stringify(updatedProjects));
      await fetch("/api/configuracoes/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chave: "painel_loa_banco_projetos_custom",
          valor: updatedProjects,
        }),
      });
    } catch (err) {
      console.warn("Aviso ao salvar Banco de Projetos customizado:", err);
    }
  };

  const loadWorkbook = async () => {
    setLoading(true);
    setLoadError(false);

    try {
      // 1. Tentar carregar customizações salvas no Banco de Dados / LocalStorage primeiro
      let savedCustomProjects: BancoProjetoLinha[] | null = null;

      try {
        const resDb = await fetch("/api/configuracoes/layout?chave=painel_loa_banco_projetos_custom");
        if (resDb.ok) {
          const data = await resDb.json();
          if (data.success && Array.isArray(data.valor) && data.valor.length > 0) {
            savedCustomProjects = data.valor;
          }
        }
      } catch {
        // Fallback para localStorage
      }

      if (!savedCustomProjects) {
        const localSaved = localStorage.getItem(STORAGE_KEY_CUSTOM_BANCO);
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              savedCustomProjects = parsed;
            }
          } catch { }
        }
      }

      if (savedCustomProjects && savedCustomProjects.length > 0) {
        setLinhas(savedCustomProjects);
        setLoading(false);
        return;
      }

      // 2. Se não houver customizações, carregar da planilha original
      const response = await fetch("/BancoProjetos.xlsx");
      if (!response.ok) throw new Error("Falha ao carregar a planilha");
      const buffer = await response.arrayBuffer();
      const sheet = XLSX.read(buffer, { type: "array" }).Sheets.Planilha1;
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      const parsedRows: BancoProjetoLinha[] = rows.map((row, idx) => ({
        id: `bp-raw-${idx + 1}-${Date.now()}`,
        secretaria: String(row.secretaria || "Não informada"),
        objeto: String(row.detalhe_projeto || "Objeto não informado"),
        natureza:
          String(row.natureza || "Não informada") === "-"
            ? "Não informada"
            : String(row.natureza || "Não informada"),
        edital:
          String(row.previsao_edital || "") === "-" || !row.previsao_edital
            ? "Não"
            : String(row.previsao_edital),
        valor: Number(row.valor) || 0,
      }));

      setLinhas(parsedRows);
    } catch {
      setLinhas([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkbook();
  }, []);

  // Handlers do CRUD
  const handleOpenCreate = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (project: BancoProjetoLinha) => {
    setEditingProject({
      id: project.id,
      secretaria: project.secretaria,
      objeto: project.objeto,
      natureza: project.natureza,
      edital: project.edital,
      valor: project.valor,
    });
    setDialogOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Deseja realmente remover este projeto do Banco de Projetos?")) return;
    const nextList = linhas.filter((item) => item.id !== projectId);
    await saveProjectsToStorage(nextList);
  };

  const handleSaveProjectForm = async (formData: BancoProjetoFormData) => {
    if (formData.id) {
      // Edição
      const nextList = linhas.map((item) =>
        item.id === formData.id
          ? {
              ...item,
              secretaria: formData.secretaria,
              objeto: formData.objeto,
              natureza: formData.natureza,
              edital: formData.edital,
              valor: formData.valor,
              isCustom: true,
            }
          : item
      );
      await saveProjectsToStorage(nextList);
    } else {
      // Criação de Novo Projeto
      const newItem: BancoProjetoLinha = {
        id: `bp-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        secretaria: formData.secretaria,
        objeto: formData.objeto,
        natureza: formData.natureza,
        edital: formData.edital,
        valor: formData.valor,
        isCustom: true,
      };
      const nextList = [newItem, ...linhas];
      await saveProjectsToStorage(nextList);
    }
  };

  const handleResetToDefault = async () => {
    if (
      !window.confirm(
        "Deseja restaurar o Banco de Projetos para a versão original da planilha? Todas as alterações e projetos novos serão descartados."
      )
    )
      return;

    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_BANCO);
      await fetch("/api/configuracoes/layout?chave=painel_loa_banco_projetos_custom", {
        method: "DELETE",
      });
    } catch { }

    void loadWorkbook();
  };

  const linhasPorSecretaria = useMemo(() => {
    const grouped = new Map<string, BancoProjetoLinha[]>();
    const search = filters?.search.trim().toLocaleLowerCase("pt-BR") ?? "";
    const selectedSecretarias = filters?.secretaria ?? [];
    const selectedNaturezas = filters?.natureza ?? [];

    linhas
      .filter((linha) => {
        const matchesSecretaria =
          !selectedSecretarias.length || selectedSecretarias.includes(linha.secretaria);
        const matchesNatureza =
          !selectedNaturezas.length || selectedNaturezas.includes(linha.natureza);
        const haystack = `${linha.secretaria} ${linha.objeto} ${linha.natureza} ${linha.edital}`.toLocaleLowerCase(
          "pt-BR"
        );
        return matchesSecretaria && matchesNatureza && (!search || haystack.includes(search));
      })
      .forEach((linha) =>
        grouped.set(linha.secretaria, [...(grouped.get(linha.secretaria) ?? []), linha])
      );
    return grouped;
  }, [filters?.natureza, filters?.search, filters?.secretaria, linhas]);

  // Lista combinada de secretarias (garantindo que novas secretarias criadas manualmente apareçam)
  const secretariasVisiveis = useMemo(() => {
    const secList = [...BANCO_PROJETOS_SECRETARIAS];
    // Adicionar quaisquer novas secretarias que existam em linhas mas não na lista padrão
    for (const key of linhasPorSecretaria.keys()) {
      if (!secList.some((s) => s.secretaria === key)) {
        secList.push({ secretaria: key, projetos: 0, valor: 0 });
      }
    }
    return secList.filter(
      (item) => !filters?.secretaria?.length || filters.secretaria.includes(item.secretaria)
    );
  }, [filters?.secretaria, linhasPorSecretaria]);

  const totalFiltrado = useMemo(
    () => [...linhasPorSecretaria.values()].flat().reduce((total, linha) => total + linha.valor, 0),
    [linhasPorSecretaria]
  );
  const projetosFiltrados = useMemo(() => [...linhasPorSecretaria.values()].flat(), [linhasPorSecretaria]);
  const projetosAlocados = useMemo(
    () =>
      projetosFiltrados.filter((projeto) =>
        allocatedKeys.includes(
          [projeto.secretaria, projeto.objeto, projeto.natureza, projeto.valor].join("|")
        )
      ),
    [allocatedKeys, projetosFiltrados]
  );
  const projetosDisponiveis = projetosFiltrados.length - projetosAlocados.length;
  const valorAlocado = useMemo(
    () => projetosAlocados.reduce((total, projeto) => total + projeto.valor, 0),
    [projetosAlocados]
  );
  const valorDisponivel = totalFiltrado - valorAlocado;

  return (
    <section
      className="glass-card overflow-hidden border-t-4 border-t-tertiary"
      aria-labelledby="banco-projetos-title"
      aria-busy={loading}
    >
      <div className="flex flex-col gap-4 border-b border-outline-variant bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-tertiary">
            <span className="material-symbols-outlined text-2xl">folder_special</span>
            <h3 id="banco-projetos-title" className="text-xl font-headline font-bold text-on-surface">
              Banco de Projetos
            </h3>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">
            Gerencie, edite ou crie novos projetos antes de alocá-los na LOA 2027.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            title="Restaurar projetos padrão da planilha original"
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-tertiary px-4 py-2 text-xs font-bold text-on-tertiary hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>Novo Projeto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 bg-surface-container-low p-6 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-tertiary/20 bg-tertiary/10 p-4">
          <p className="text-xs font-bold text-on-surface-variant">Valor total previsto</p>
          <p className="mt-1 text-2xl font-headline font-extrabold text-tertiary">
            {loading ? "Carregando…" : currency.format(valorDisponivel)}
          </p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface p-4">
          <p className="text-xs font-bold text-on-surface-variant">Projetos disponíveis para LOA 2027</p>
          <p className="mt-1 text-2xl font-headline font-extrabold text-on-surface">
            {loading ? "—" : integer.format(projetosDisponiveis)}
          </p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <p className="text-xs font-bold text-emerald-800">Projetos alocados na LOA 2027</p>
          <p className="mt-1 text-2xl font-headline font-extrabold text-emerald-800">
            {loading ? "—" : integer.format(projetosAlocados.length)}
          </p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface p-4">
          <p className="text-xs font-bold text-on-surface-variant">Secretarias com projetos</p>
          <p className="mt-1 text-2xl font-headline font-extrabold text-on-surface">
            {loading ? "—" : integer.format(linhasPorSecretaria.size)}
          </p>
        </article>
      </div>

      <div className="max-h-[560px] overflow-y-auto bg-surface-container-low p-4 sm:p-6">
        {loadError ? (
          <div className="rounded-xl border border-error/30 bg-error-container/40 p-6 text-center" role="alert">
            <p className="font-semibold text-on-error-container">Não foi possível carregar o Banco de Projetos.</p>
            <button
              type="button"
              onClick={loadWorkbook}
              className="mt-4 min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-4" aria-label="Carregando projetos">
            <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
            <div className="h-24 animate-pulse rounded-xl bg-surface-container" />
          </div>
        ) : !projetosFiltrados.length ? (
          <div className="rounded-xl border border-outline-variant bg-surface p-8 text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">search_off</span>
            <p className="mt-2 font-semibold text-on-surface">Nenhum projeto encontrado</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Ajuste os filtros avançados ou clique em &quot;Novo Projeto&quot; para cadastrar.
            </p>
          </div>
        ) : (
          <div className="space-y-4" aria-live="polite">
            {secretariasVisiveis.map((item) => {
              const detalhes = BANCO_PROJETOS_DETALHES[item.secretaria];
              const projetos = linhasPorSecretaria.get(item.secretaria) ?? [];
              const naturezas = projetos.length
                ? [...new Set(projetos.map((projeto) => projeto.natureza))]
                : detalhes?.naturezas ?? [];

              if (!projetos.length && (filters?.natureza?.length || filters?.search)) return null;

              const valorDaSecretaria = projetos.length
                ? projetos.reduce((total, projeto) => total + projeto.valor, 0)
                : item.valor;
              const expanded = expandedSecretarias.includes(item.secretaria);
              const visibleProjects = expanded ? projetos : projetos.slice(0, 3);

              return (
                <article
                  key={item.secretaria}
                  className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm"
                >
                  <header className="flex flex-col gap-2 border-b border-outline-variant px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">Secretaria</p>
                      <h4 className="mt-1 text-sm font-bold text-on-surface">{item.secretaria}</h4>
                    </div>
                    <div className="flex gap-3 text-xs font-semibold text-on-surface-variant">
                      <span>{integer.format(projetos.length || item.projetos)} projetos</span>
                      <span>{currency.format(valorDaSecretaria)}</span>
                    </div>
                  </header>

                  <div className="hidden grid-cols-[minmax(280px,2fr)_minmax(180px,1.15fr)_minmax(140px,.8fr)_minmax(140px,.8fr)_minmax(200px,1.2fr)] items-center gap-4 bg-surface-container px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant md:grid">
                    <span>Objeto / Detalhe</span>
                    <span>Natureza da despesa</span>
                    <span className="text-center">Previsão Edital</span>
                    <span className="text-right">Valor</span>
                    <span className="text-center">Ações</span>
                  </div>

                  <div className="divide-y divide-outline-variant/30">
                    {projetos.length ? (
                      visibleProjects.map((projeto) => {
                        const projectKey = [
                          projeto.secretaria,
                          projeto.objeto,
                          projeto.natureza,
                          projeto.valor,
                        ].join("|");
                        const isAllocated = allocatedKeys.includes(projectKey);

                        return (
                          <div
                            key={projeto.id}
                            className="grid grid-cols-1 gap-3 px-5 py-4 text-sm md:grid-cols-[minmax(280px,2fr)_minmax(180px,1.15fr)_minmax(140px,.8fr)_minmax(140px,.8fr)_minmax(200px,1.2fr)] md:items-center md:gap-4 hover:bg-surface-container-lowest transition-colors"
                          >
                            <div className="min-w-0">
                              <span className="mb-1 block text-[10px] font-bold uppercase text-on-surface-variant md:hidden">
                                Objeto
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="break-words leading-5 font-medium text-on-surface">
                                  {projeto.objeto}
                                </span>
                                {projeto.isCustom && (
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                                    Editado / Novo
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <span className="mb-1 block text-[10px] font-bold uppercase text-on-surface-variant md:hidden">
                                Natureza da despesa
                              </span>
                              <span className="inline-flex max-w-full rounded-md bg-surface-container-low px-2 py-1 text-xs font-mono font-medium text-on-surface-variant">
                                {projeto.natureza}
                              </span>
                            </div>

                            <div className="md:text-center">
                              <span className="mb-1 block text-[10px] font-bold uppercase text-on-surface-variant md:hidden">
                                Previsão do edital
                              </span>
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  projeto.edital !== "Não"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {projeto.edital}
                              </span>
                            </div>

                            <div className="md:text-right">
                              <span className="mb-1 block text-[10px] font-bold uppercase text-on-surface-variant md:hidden">
                                Valor
                              </span>
                              <span className="font-mono font-bold text-on-surface">
                                {currency.format(projeto.valor)}
                              </span>
                            </div>

                            <div className="flex items-center justify-start md:justify-center gap-1.5">
                              {/* Botão de Editar Projeto */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(projeto)}
                                title="Editar dados deste projeto antes de alocar"
                                className="h-8 w-8 rounded-lg border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors flex items-center justify-center cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>

                              {/* Botão de Excluir Projeto */}
                              <button
                                type="button"
                                onClick={() => handleDeleteProject(projeto.id)}
                                title="Remover projeto do banco"
                                className="h-8 w-8 rounded-lg border border-outline-variant bg-surface text-on-surface-variant hover:bg-error-container hover:text-error transition-colors flex items-center justify-center cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>

                              {/* Botão de Alocação na LOA */}
                              {isAllocated ? (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                  <span className="material-symbols-outlined text-sm">check_circle</span>
                                  Alocado
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onAllocate?.(projeto)}
                                  disabled={!onAllocate}
                                  className="rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                  Alocar na LOA
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="grid grid-cols-1 gap-3 px-5 py-4 text-sm md:grid-cols-[minmax(320px,2fr)_minmax(190px,1.15fr)_minmax(170px,.9fr)_minmax(150px,.7fr)] md:items-center md:gap-5">
                        <div className="text-on-surface">Carteira de projetos ({integer.format(item.projetos)})</div>
                        <div className="flex flex-wrap gap-1.5">
                          {naturezas.map((natureza) => (
                            <span
                              key={natureza}
                              className="rounded-md bg-surface-container-low px-2 py-1 text-xs text-on-surface-variant"
                            >
                              {natureza}
                            </span>
                          ))}
                        </div>
                        <div className="text-on-surface-variant md:text-center">
                          {detalhes?.editais ? `Sim · ${detalhes.editais} projetos` : "Não"}
                        </div>
                        <div className="font-bold text-on-surface md:text-right">
                          {currency.format(item.valor)}
                        </div>
                      </div>
                    )}
                  </div>

                  {projetos.length > 3 && (
                    <div className="flex justify-center border-t border-outline-variant/30 px-5 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSecretarias((previous) =>
                            expanded
                              ? previous.filter((name) => name !== item.secretaria)
                              : [...previous, item.secretaria]
                          )
                        }
                        className="min-h-10 rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary cursor-pointer"
                      >
                        {expanded ? "Mostrar menos" : `Ver mais ${projetos.length - 3} projetos`}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição de Projeto */}
      <BancoProjetoFormDialog
        isOpen={dialogOpen}
        initialData={editingProject}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveProjectForm}
      />
    </section>
  );
}
