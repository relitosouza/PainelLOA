"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { currency } from "@/lib/format";

type AreaItem = {
  key: string;
  label: string;
  valor: number;
  percentual: number;
  icone: string;
  corTexto: string;
  corFundo: string;
  corBarra: string;
  destaque: boolean;
  tags?: string[];
};

type InvestimentoItem = {
  id?: string;
  titulo: string;
  secretaria: string;
  valor: number;
  destaque?: boolean;
};

type CardDestaqueItem = {
  id: string;
  titulo: string;
  valor: number | string;
  legenda?: string;
  icone: string;
  tipoFormato?: "compacto" | "moeda" | "inteiro" | "texto";
  corIcone?: string;
  corFundoIcone?: string;
  ordem?: number;
};

type SugestaoItem = {
  id: string;
  nome: string;
  email?: string | null;
  bairro?: string | null;
  area: string;
  titulo: string;
  descricao: string;
  status: string;
  criadoEm: string;
};

type ConfigData = {
  exercicio: string;
  totalGeral: number;
  totalInvestimentos: number;
  totalSecretarias: number;
  cardsDestaque?: CardDestaqueItem[];
  tituloHero: string;
  subtituloHero: string;
  notaInformativa: string;
  atualizadoEm: string;
};

export function TransparenteAdminView() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [activeTab, setActiveTab] = useState<"geral" | "areas" | "investimentos" | "sugestoes">("geral");

  const [config, setConfig] = useState<ConfigData>({
    exercicio: "2027",
    totalGeral: 0,
    totalInvestimentos: 0,
    totalSecretarias: 0,
    tituloHero: "",
    subtituloHero: "",
    notaInformativa: "",
    atualizadoEm: "",
  });

  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [investimentos, setInvestimentos] = useState<InvestimentoItem[]>([]);
  const [sugestoes, setSugestoes] = useState<SugestaoItem[]>([]);

  // Novo Investimento form
  const [novoInvTitulo, setNovoInvTitulo] = useState("");
  const [novoInvSec, setNovoInvSec] = useState("");
  const [novoInvValor, setNovoInvValor] = useState<number | "">("");

  // Nova Área form
  const [novaAreaKey, setNovaAreaKey] = useState("");
  const [novaAreaLabel, setNovaAreaLabel] = useState("");
  const [novaAreaValor, setNovaAreaValor] = useState<number | "">("");
  const [novaAreaIcone, setNovaAreaIcone] = useState("category");

  // Novo Card Extra de Totais form
  const [novoCardTitulo, setNovoCardTitulo] = useState("Despesas Correntes");
  const [novoCardValor, setNovoCardValor] = useState<number | "">("");
  const [novoCardLegenda, setNovoCardLegenda] = useState("Custeio e Manutenção");
  const [novoCardIcone, setNovoCardIcone] = useState("account_balance_wallet");
  const [novoCardFormato, setNovoCardFormato] = useState<"compacto" | "moeda" | "inteiro">("compacto");

  const carregarDados = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transparente/admin");
      const data = await res.json();
      if (data.success) {
        setConfig({
          exercicio: data.exercicio || "2027",
          totalGeral: data.total || 0,
          totalInvestimentos: data.totalInvestimentos || 0,
          totalSecretarias: data.totalSecretarias || 0,
          cardsDestaque: Array.isArray(data.cardsDestaque) ? data.cardsDestaque : [],
          tituloHero: data.tituloHero || "",
          subtituloHero: data.subtituloHero || "",
          notaInformativa: data.notaInformativa || "",
          atualizadoEm: data.atualizadoEm || "",
        });
        setAreas(data.porArea || []);
        setInvestimentos(data.topInvestimentos || []);
      }

      // Carregar sugestões dos cidadãos
      const resSug = await fetch("/api/transparente/sugestoes");
      const dataSug = await resSug.json();
      if (dataSug.success) {
        setSugestoes(dataSug.sugestoes || []);
      }
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha ao carregar dados do orçamento." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      setMensagem(null);
      const res = await fetch("/api/transparente/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          areas,
          topInvestimentos: investimentos,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMensagem({ tipo: "ok", texto: "Alterações salvas com sucesso!" });
      } else {
        setMensagem({ tipo: "erro", texto: data.error || "Erro ao salvar alterações." });
      }
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha na comunicação com o servidor." });
    } finally {
      setSalvando(false);
    }
  };

  const handleSincronizarSnapshot = async () => {
    if (
      !confirm(
        "Atenção: Isso irá capturar uma nova foto oficial da Análise LOA ativa, substituindo os valores do Orçamento Transparente. Deseja continuar?"
      )
    ) {
      return;
    }
    try {
      setSincronizando(true);
      setMensagem(null);
      const res = await fetch("/api/transparente/snapshot", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMensagem({ tipo: "ok", texto: "Novo snapshot oficial sincronizado com sucesso!" });
        await carregarDados();
      } else {
        setMensagem({ tipo: "erro", texto: data.error || "Erro ao sincronizar snapshot." });
      }
    } catch {
      setMensagem({ tipo: "erro", texto: "Falha ao sincronizar snapshot." });
    } finally {
      setSincronizando(false);
    }
  };

  const handleAddInvestimento = () => {
    if (!novoInvTitulo.trim() || !novoInvSec.trim() || novoInvValor === "") return;
    const item: InvestimentoItem = {
      titulo: novoInvTitulo.trim(),
      secretaria: novoInvSec.trim(),
      valor: Number(novoInvValor),
      destaque: true,
    };
    setInvestimentos([item, ...investimentos]);
    setNovoInvTitulo("");
    setNovoInvSec("");
    setNovoInvValor("");
  };

  const handleRemoveInvestimento = (idx: number) => {
    setInvestimentos(investimentos.filter((_, i) => i !== idx));
  };

  const handleAddArea = () => {
    if (!novaAreaKey.trim() || !novaAreaLabel.trim() || novaAreaValor === "") return;
    const totalG = config.totalGeral > 0 ? config.totalGeral : 1;
    const v = Number(novaAreaValor);
    const item: AreaItem = {
      key: novaAreaKey.trim().toLowerCase().replace(/\s+/g, "_"),
      label: novaAreaLabel.trim(),
      valor: v,
      percentual: Number(((v / totalG) * 100).toFixed(2)),
      icone: novaAreaIcone || "category",
      corTexto: "text-emerald-700 dark:text-emerald-400",
      corFundo: "bg-emerald-100 dark:bg-emerald-950/40",
      corBarra: "#34D399",
      destaque: false,
      tags: [],
    };
    setAreas([...areas, item]);
    setNovaAreaKey("");
    setNovaAreaLabel("");
    setNovaAreaValor("");
  };

  const handleRemoveArea = (idx: number) => {
    setAreas(areas.filter((_, i) => i !== idx));
  };

  const handleAddCardDestaque = () => {
    if (!novoCardTitulo.trim() || novoCardValor === "") return;
    const novoCard: CardDestaqueItem = {
      id: "card-" + Date.now(),
      titulo: novoCardTitulo.trim(),
      valor: Number(novoCardValor),
      legenda: novoCardLegenda.trim() || undefined,
      icone: novoCardIcone.trim() || "payments",
      tipoFormato: novoCardFormato,
      corIcone: "text-amber-600",
      corFundoIcone: "bg-amber-100 dark:bg-amber-950/40",
      ordem: (config.cardsDestaque?.length || 0) + 1,
    };
    const lista = [...(config.cardsDestaque || []), novoCard];
    setConfig({ ...config, cardsDestaque: lista });
    setNovoCardTitulo("");
    setNovoCardValor("");
    setNovoCardLegenda("");
  };

  const handleRemoveCardDestaque = (id: string) => {
    const lista = (config.cardsDestaque || []).filter((c) => c.id !== id);
    setConfig({ ...config, cardsDestaque: lista });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground font-medium">Carregando painel de gestão...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/transparente"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Voltar ao Orçamento Transparente
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">database</span>
            Gestão do Orçamento Transparente
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dados desacoplados e independentes. Altere totais, áreas e investimentos sem impactar as planilhas analíticas da LOA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSincronizarSnapshot}
            disabled={sincronizando || salvando}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all shadow-xs disabled:opacity-50"
            title="Importa os totais atuais da LOA ativa como ponto de partida"
          >
            <span className={`material-symbols-outlined text-sm ${sincronizando ? "animate-spin" : ""}`}>
              sync
            </span>
            {sincronizando ? "Sincronizando..." : "Re-sincronizar da LOA"}
          </button>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando || sincronizando}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {mensagem && (
        <div
          className={`p-3.5 rounded-lg text-sm flex items-center gap-2 border ${
            mensagem.tipo === "ok"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {mensagem.tipo === "ok" ? "check_circle" : "error"}
          </span>
          <span className="font-medium">{mensagem.texto}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border space-x-2">
        <button
          onClick={() => setActiveTab("geral")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "geral"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-base">settings</span>
          Totais & Configurações
        </button>
        <button
          onClick={() => setActiveTab("areas")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "areas"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-base">grid_view</span>
          Áreas Temáticas ({areas.length})
        </button>
        <button
          onClick={() => setActiveTab("investimentos")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "investimentos"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-base">star</span>
          Maiores Investimentos ({investimentos.length})
        </button>
        <button
          onClick={() => setActiveTab("sugestoes")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "sugestoes"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-base">campaign</span>
          Sugestões de Cidadãos ({sugestoes.length})
        </button>
      </div>

      {/* TAB 1: GERAL & TOTAIS */}
      {activeTab === "geral" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-xl border border-border shadow-2xs space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">tune</span>
              Totais Globais Divulgados
            </h3>
            <p className="text-xs text-muted-foreground">
              Estes valores alimentam os cards principais no topo do portal do Orçamento Transparente.
            </p>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Exercício (Ano)</label>
              <input
                type="text"
                value={config.exercicio}
                onChange={(e) => setConfig({ ...config, exercicio: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Orçamento Total Geral (R$)</label>
              <input
                type="number"
                step="0.01"
                value={config.totalGeral}
                onChange={(e) => setConfig({ ...config, totalGeral: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Visualização formatada: <strong>{currency.format(config.totalGeral)}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Total de Investimentos e Inversões (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={config.totalInvestimentos}
                onChange={(e) => setConfig({ ...config, totalInvestimentos: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Visualização formatada: <strong>{currency.format(config.totalInvestimentos)}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Quantidade de Secretarias/Órgãos com dotação
              </label>
              <input
                type="number"
                value={config.totalSecretarias}
                onChange={(e) => setConfig({ ...config, totalSecretarias: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl border border-border shadow-2xs space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">notes</span>
              Textos de Comunicação Pública
            </h3>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Título Hero</label>
              <input
                type="text"
                value={config.tituloHero}
                onChange={(e) => setConfig({ ...config, tituloHero: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Subtítulo Hero</label>
              <textarea
                rows={3}
                value={config.subtituloHero}
                onChange={(e) => setConfig({ ...config, subtituloHero: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Nota Informativa / Disclaimer</label>
              <textarea
                rows={3}
                value={config.notaInformativa}
                onChange={(e) => setConfig({ ...config, notaInformativa: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground">
              Última atualização registrada no banco:{" "}
              <strong>{config.atualizadoEm ? new Date(config.atualizadoEm).toLocaleString("pt-BR") : "—"}</strong>
            </div>
          </div>

          {/* Seção: Cards Extras em Destaque (Totais Globais) */}
          <div className="md:col-span-2 bg-card p-6 rounded-xl border border-border shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">view_carousel</span>
                  Cards Extras em Destaque (Totais Globais)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adicione cards adicionais no topo da página de Transparência (ex: Despesas Correntes, Custeio e Manutenção, Pessoal, etc.).
                </p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                {(config.cardsDestaque || []).length} card(s) extra(s)
              </span>
            </div>

            {/* Form de Inserção de Novo Card */}
            <div className="bg-muted/40 p-4 rounded-lg border border-border/80 space-y-3">
              <span className="text-xs font-semibold text-foreground block">
                + Adicionar Novo Card aos Totais Globais
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-medium text-foreground mb-1">Título do Card *</label>
                  <input
                    type="text"
                    placeholder="Ex: Despesas Correntes"
                    value={novoCardTitulo}
                    onChange={(e) => setNovoCardTitulo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">Valor Numérico (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 85000000"
                    value={novoCardValor}
                    onChange={(e) => setNovoCardValor(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background font-mono focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">Subtítulo / Legenda</label>
                  <input
                    type="text"
                    placeholder="Ex: Custeio e Manutenção"
                    value={novoCardLegenda}
                    onChange={(e) => setNovoCardLegenda(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground mb-1">Formato Visual</label>
                  <select
                    value={novoCardFormato}
                    onChange={(e) => setNovoCardFormato(e.target.value as "compacto" | "moeda" | "inteiro")}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background focus:ring-1 focus:ring-primary"
                  >
                    <option value="compacto">Compacto (ex: R$ 85,0 mi)</option>
                    <option value="moeda">Moeda cheia (ex: R$ 85.000.000,00)</option>
                    <option value="inteiro">Número inteiro</option>
                  </select>
                </div>
              </div>

              {/* Seletor do Ícone do Card */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-foreground">Ícone do Card:</span>
                    <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-md">
                      <span className="material-symbols-outlined text-primary text-base">
                        {novoCardIcone || "payments"}
                      </span>
                      <input
                        type="text"
                        value={novoCardIcone}
                        onChange={(e) => setNovoCardIcone(e.target.value.trim().toLowerCase())}
                        placeholder="nome do icone"
                        className="text-xs bg-transparent border-none outline-none w-36 font-mono"
                        title="Digite o nome de qualquer ícone do Google Material Symbols"
                      />
                    </div>
                  </div>

                  {/* Ícones Rápidos Recomendados */}
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Sugestões:</span>
                    {[
                      { icon: "account_balance_wallet", label: "Carteira" },
                      { icon: "receipt_long", label: "Custeio" },
                      { icon: "payments", label: "Pagamentos" },
                      { icon: "savings", label: "Poupança" },
                      { icon: "badge", label: "Pessoal" },
                      { icon: "trending_up", label: "Crescimento" },
                      { icon: "analytics", label: "Análise" },
                      { icon: "domain", label: "Prédios" },
                      { icon: "construction", label: "Obras" },
                      { icon: "health_and_safety", label: "Saúde" },
                      { icon: "school", label: "Educação" },
                    ].map((sug) => (
                      <button
                        key={sug.icon}
                        type="button"
                        onClick={() => setNovoCardIcone(sug.icon)}
                        title={sug.label}
                        className={`p-1 rounded text-xs inline-flex items-center justify-center transition-colors ${
                          novoCardIcone === sug.icon
                            ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                            : "bg-background border border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">{sug.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNovoCardTitulo("Despesas Correntes");
                      setNovoCardLegenda("Custeio e Manutenção");
                      setNovoCardIcone("receipt_long");
                      setNovoCardFormato("compacto");
                    }}
                    className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                    Preencher com: Despesas Correntes
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddCardDestaque}
                  disabled={!novoCardTitulo.trim() || novoCardValor === ""}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar Card
                </button>
              </div>
            </div>

            {/* Lista dos cards extras existentes */}
            {(!config.cardsDestaque || config.cardsDestaque.length === 0) ? (
              <p className="text-xs text-muted-foreground italic py-2">
                Nenhum card adicional cadastrado. O portal exibirá os 3 cards padrão (Orçamento Total, Investimentos e Órgãos).
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {config.cardsDestaque.map((card, idx) => (
                  <div
                    key={card.id || idx}
                    className="p-3 rounded-lg border border-border bg-background flex items-start justify-between gap-2 shadow-2xs hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-amber-600 text-sm">
                          {card.icone || "payments"}
                        </span>
                        <span className="text-xs font-bold text-foreground">{card.titulo}</span>
                      </div>
                      <div className="text-sm font-extrabold text-foreground font-mono">
                        {card.tipoFormato === "currency"
                          ? currency.format(card.valor)
                          : card.tipoFormato === "integer"
                          ? card.valor.toLocaleString("pt-BR")
                          : `R$ ${(card.valor / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`}
                      </div>
                      {card.legenda && (
                        <p className="text-[11px] text-muted-foreground">{card.legenda}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCardDestaque(card.id)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-muted transition-colors"
                      title="Remover card"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ÁREAS TEMÁTICAS */}
      {activeTab === "areas" && (
        <div className="space-y-6">
          {/* Adicionar Nova Área */}
          <div className="bg-card p-4 rounded-xl border border-border shadow-2xs flex flex-wrap items-end gap-3">
            <div className="w-40">
              <label className="block text-[11px] font-medium text-foreground mb-1">Chave Única</label>
              <input
                type="text"
                placeholder="ex: meio_ambiente"
                value={novaAreaKey}
                onChange={(e) => setNovaAreaKey(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-medium text-foreground mb-1">Nome da Área</label>
              <input
                type="text"
                placeholder="ex: Meio Ambiente e Sustentabilidade"
                value={novaAreaLabel}
                onChange={(e) => setNovaAreaLabel(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background"
              />
            </div>
            <div className="w-36">
              <label className="block text-[11px] font-medium text-foreground mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={novaAreaValor}
                onChange={(e) => setNovaAreaValor(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background font-mono"
              />
            </div>
            <div className="w-28">
              <label className="block text-[11px] font-medium text-foreground mb-1">Ícone Material</label>
              <input
                type="text"
                placeholder="park"
                value={novaAreaIcone}
                onChange={(e) => setNovaAreaIcone(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background"
              />
            </div>
            <button
              type="button"
              onClick={handleAddArea}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Adicionar Área
            </button>
          </div>

          {/* Lista de Áreas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area, idx) => (
              <div
                key={area.key}
                className="bg-card p-4 rounded-xl border border-border shadow-2xs space-y-3 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <span className="material-symbols-outlined text-foreground text-sm">{area.icone}</span>
                      </div>
                      <span className="text-xs font-bold text-foreground">{area.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(idx)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Excluir Área"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] text-muted-foreground">Valor Estimado (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={area.valor}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const totalG = config.totalGeral > 0 ? config.totalGeral : 1;
                          const updated = [...areas];
                          updated[idx] = {
                            ...updated[idx],
                            valor: v,
                            percentual: Number(((v / totalG) * 100).toFixed(2)),
                          };
                          setAreas(updated);
                        }}
                        className="w-full px-2 py-1 text-xs rounded border border-input bg-background font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>Percentual da LOA:</span>
                      <strong className="text-foreground">{area.percentual.toFixed(1)}%</strong>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`destaque-${area.key}`}
                        checked={area.destaque}
                        onChange={(e) => {
                          const updated = [...areas];
                          updated[idx] = { ...updated[idx], destaque: e.target.checked };
                          setAreas(updated);
                        }}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <label htmlFor={`destaque-${area.key}`} className="text-xs text-foreground font-medium">
                        Destaque em &quot;R$ 100&quot;
                      </label>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground pt-2 border-t border-border mt-2">
                  Chave: <code>{area.key}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MAIORES INVESTIMENTOS */}
      {activeTab === "investimentos" && (
        <div className="space-y-6">
          {/* Adicionar Investimento */}
          <div className="bg-card p-4 rounded-xl border border-border shadow-2xs flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-[11px] font-medium text-foreground mb-1">Título do Projeto / Obra</label>
              <input
                type="text"
                placeholder="ex: Construção de Novo Hospital Municipal"
                value={novoInvTitulo}
                onChange={(e) => setNovoInvTitulo(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background"
              />
            </div>
            <div className="w-56">
              <label className="block text-[11px] font-medium text-foreground mb-1">Secretaria Responsável</label>
              <input
                type="text"
                placeholder="ex: Secretaria de Saúde"
                value={novoInvSec}
                onChange={(e) => setNovoInvSec(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background"
              />
            </div>
            <div className="w-40">
              <label className="block text-[11px] font-medium text-foreground mb-1">Valor Previsto (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={novoInvValor}
                onChange={(e) => setNovoInvValor(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleAddInvestimento}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Adicionar Projeto
            </button>
          </div>

          {/* Tabela de Investimentos */}
          <div className="bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Ranking de Investimentos Divulgados ({investimentos.length})
              </span>
              <span className="text-xs text-muted-foreground">Exibidos na página pública</span>
            </div>

            <div className="divide-y divide-border">
              {investimentos.map((inv, idx) => (
                <div key={`${inv.titulo}-${idx}`} className="p-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs font-bold font-mono text-primary w-6">#{idx + 1}</span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={inv.titulo}
                        onChange={(e) => {
                          const updated = [...investimentos];
                          updated[idx] = { ...updated[idx], titulo: e.target.value };
                          setInvestimentos(updated);
                        }}
                        className="w-full text-xs font-semibold text-foreground bg-transparent border-b border-transparent hover:border-input focus:border-primary focus:bg-background px-1 py-0.5 rounded"
                      />
                      <input
                        type="text"
                        value={inv.secretaria}
                        onChange={(e) => {
                          const updated = [...investimentos];
                          updated[idx] = { ...updated[idx], secretaria: e.target.value };
                          setInvestimentos(updated);
                        }}
                        className="w-full text-[11px] text-muted-foreground bg-transparent border-b border-transparent hover:border-input focus:border-primary focus:bg-background px-1 py-0.5 rounded mt-0.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-36">
                      <input
                        type="number"
                        step="0.01"
                        value={inv.valor}
                        onChange={(e) => {
                          const updated = [...investimentos];
                          updated[idx] = { ...updated[idx], valor: Number(e.target.value) };
                          setInvestimentos(updated);
                        }}
                        className="w-full px-2 py-1 text-xs rounded border border-input bg-background font-mono text-right"
                      />
                      <p className="text-[10px] text-muted-foreground text-right mt-0.5 font-mono">
                        {currency.format(inv.valor)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveInvestimento(idx)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Remover Projeto"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}

              {investimentos.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Nenhum investimento cadastrado. Utilize o formulário acima ou clique em &quot;Re-sincronizar da LOA&quot;.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUGESTÕES DE CIDADÃOS */}
      {activeTab === "sugestoes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">campaign</span>
                Propostas Enviadas pela População
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ideias e prioridades de investimentos enviadas diretamente pelo botão &quot;Sugerir Investimento&quot; do portal.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
              {sugestoes.length} {sugestoes.length === 1 ? "proposta" : "propostas"}
            </span>
          </div>

          <div className="space-y-3">
            {sugestoes.map((sug) => (
              <div
                key={sug.id}
                className="bg-card p-5 rounded-xl border border-border shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{sug.titulo}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-semibold">
                        {sug.area}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span><strong>Cidadão:</strong> {sug.nome}</span>
                      {sug.email && <span><strong>E-mail:</strong> {sug.email}</span>}
                      {sug.bairro && <span><strong>Bairro:</strong> {sug.bairro}</span>}
                    </div>
                  </div>

                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(sug.criadoEm).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {sug.descricao}
                </p>
              </div>
            ))}

            {sugestoes.length === 0 && (
              <div className="bg-card p-12 rounded-xl border border-border text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-muted-foreground">inbox</span>
                <h4 className="text-sm font-semibold text-foreground">Nenhuma sugestão recebida ainda</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Assim que os cidadãos enviarem sugestões pelo portal, elas aparecerão listadas aqui para triagem da equipe.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
