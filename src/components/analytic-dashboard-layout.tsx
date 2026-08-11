"use client";

import Link from "next/link";
import { useState } from "react";
import { DataSourceToggle } from "./data-source-toggle";
import { currency, integer, percent } from "@/lib/format";
import type { DashboardData } from "@/types/loa";
import { getPrimaryPageLinks } from "@/lib/page-navigation";
import { Filters, EMPTY_FILTERS, type FilterState } from "./filters";
import { BarChart } from "./bar-chart";
import { AnalisesCombinadasSection } from "./analises-combinadas";
import { SecretariasMenu } from "./secretarias-menu";

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatCompactMoney(value: number) {
  if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(1).replace(".", ",")}B`;
  if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(1).replace(".", ",")}M`;
  return currency.format(value);
}

function findGroupValue(items: { label: string; value: number }[], keywords: string[]) {
  return items.find((item) => keywords.some((keyword) => normalizeText(item.label).includes(normalizeText(keyword))))?.value ?? 0;
}

function findGroup(items: { label: string; value: number }[], keywords: string[]) {
  return items.find((item) => keywords.some((keyword) => normalizeText(item.label).includes(normalizeText(keyword)))) ?? null;
}

function findCodeGroupValue(items: { label: string; value: number }[], code: string) {
  return items.find((item) => item.label.startsWith(`${code} —`))?.value ?? 0;
}

export function AnalyticDashboardLayout({
  data,
  filters,
  onChange,
  dataSource,
  selectedImportId,
  onSelectImport,
}: {
  data: DashboardData;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  dataSource: "ficticio" | "real";
  selectedImportId: string;
  onSelectImport: (importId: string) => void;
}) {
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState<{ answer: string; details?: Array<{ label: string; value: string }>; warning?: string } | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState("");
  const totalVal = data.totals.filtered;
  const operatingVal = data.spending.operating;
  const investmentVal = data.spending.investment;
  const isRealData = dataSource === "real";
  const expenseTotal = isRealData ? totalVal : operatingVal + investmentVal;
  const isBalanced = totalVal >= expenseTotal;
  const population = 723500;

  const askAssistant = async (question: string) => {
    const text = question.trim();
    if (!text || assistantLoading) return;
    setAssistantQuestion(text);
    setAssistantAnswer(null);
    setAssistantError("");
    setAssistantLoading(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, importId: selectedImportId || undefined }),
      });
      const result = (await response.json()) as { message?: string; answer?: string; details?: Array<{ label: string; value: string }>; warnings?: string[] };
      if (!response.ok) throw new Error(result.message ?? "Não foi possível consultar o orçamento.");
      setAssistantAnswer({ answer: result.answer ?? "Não encontrei uma resposta.", details: result.details, warning: result.warnings?.[0] });
    } catch (error) {
      setAssistantError(error instanceof Error ? error.message : "Não foi possível consultar o orçamento.");
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleQuestionClick = (questionId: string) => {
    switch (questionId) {
      case "saude": {
        const saudeOpt = data.filterOptions.functionName?.find(
          (opt) => opt.toLowerCase().includes("saude") || opt.toLowerCase().includes("saúde")
        );
        onChange({
          ...EMPTY_FILTERS,
          functionName: saudeOpt ? [saudeOpt] : [],
        });
        break;
      }
      case "secretariat": {
        const topOrgan = data.groups.organ[0]?.label;
        onChange({
          ...EMPTY_FILTERS,
          organ: topOrgan ? [topOrgan] : [],
        });
        break;
      }
      case "obras": {
        const obraOpt = data.filterOptions.functionName?.find(
          (opt) =>
            opt.toLowerCase().includes("obra") ||
            opt.toLowerCase().includes("infra") ||
            opt.toLowerCase().includes("urbanismo")
        );
        if (obraOpt) {
          onChange({
            ...EMPTY_FILTERS,
            functionName: [obraOpt],
          });
        } else {
          onChange({
            ...EMPTY_FILTERS,
            subelement: ["51"],
          });
        }
        break;
      }
      case "programa": {
        const topProgram = data.groups.program[0]?.label;
        onChange({
          ...EMPTY_FILTERS,
          program: topProgram ? [topProgram] : [],
        });
        break;
      }
      case "educacao": {
        const educacaoOpt = data.filterOptions.functionName?.find(
          (opt) => opt.toLowerCase().includes("educac") || opt.toLowerCase().includes("educaç")
        );
        onChange({
          ...EMPTY_FILTERS,
          functionName: educacaoOpt ? [educacaoOpt] : [],
        });
        break;
      }
      case "futuro": {
        onChange({
          ...EMPTY_FILTERS,
          subelement: ["51"],
        });
        break;
      }
      case "acoes": {
        const topAction = data.groups.action[0]?.label;
        onChange({
          ...EMPTY_FILTERS,
          action: topAction ? [topAction] : [],
        });
        break;
      }
      default:
        break;
    }
  };

  const questions = [
    {
      id: "saude",
      label: "Quanto será investido em Saúde?",
      icon: "medical_services",
      colorClass: "bg-red-50 hover:bg-red-100 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300",
      iconColorClass: "text-red-500",
    },
    {
      id: "secretariat",
      label: "Qual secretaria recebe mais recursos?",
      icon: "leaderboard",
      colorClass: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-300",
      iconColorClass: "text-blue-500",
    },
    {
      id: "obras",
      label: "Quanto será investido em obras?",
      icon: "engineering",
      colorClass: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300",
      iconColorClass: "text-amber-500",
    },
    {
      id: "programa",
      label: "Qual programa possui maior orçamento?",
      icon: "star",
      colorClass: "bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900/30 dark:text-teal-300",
      iconColorClass: "text-teal-500",
    },
    {
      id: "educacao",
      label: "Quanto vai para Educação?",
      icon: "school",
      colorClass: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-300",
      iconColorClass: "text-indigo-500",
    },
    {
      id: "futuro",
      label: "Quanto está sendo investido no futuro da cidade?",
      icon: "wb_sunny",
      colorClass: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300",
      iconColorClass: "text-emerald-500",
    },
    {
      id: "acoes",
      label: "Quais são as maiores ações?",
      icon: "receipt_long",
      colorClass: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-700 dark:bg-cyan-950/20 dark:border-cyan-900/30 dark:text-cyan-300",
      iconColorClass: "text-cyan-500",
    },
    {
      id: "programas-maiores",
      label: "Quais programas têm os maiores valores?",
      icon: "account_tree",
      colorClass: "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700 dark:bg-violet-950/20 dark:border-violet-900/30 dark:text-violet-300",
      iconColorClass: "text-violet-500",
    },
    {
      id: "funcoes-maiores",
      label: "Quais funções concentram mais recursos?",
      icon: "category",
      colorClass: "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900/30 dark:text-sky-300",
      iconColorClass: "text-sky-500",
    },
    {
      id: "composicao-despesas",
      label: "Quanto há em despesas operacionais e investimentos?",
      icon: "pie_chart",
      colorClass: "bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-300",
      iconColorClass: "text-orange-500",
    },
    {
      id: "registros-importacao",
      label: "Quantos registros existem na importação selecionada?",
      icon: "table_rows",
      colorClass: "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950/20 dark:border-slate-900/30 dark:text-slate-300",
      iconColorClass: "text-slate-500",
    },
    {
      id: "importacao-atual",
      label: "Qual importação está sendo consultada?",
      icon: "inventory_2",
      colorClass: "bg-lime-50 hover:bg-lime-100 border-lime-200 text-lime-700 dark:bg-lime-950/20 dark:border-lime-900/30 dark:text-lime-300",
      iconColorClass: "text-lime-600",
    },
    {
      id: "qualidade-classificacao",
      label: "Como está a qualidade da classificação?",
      icon: "fact_check",
      colorClass: "bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-950/20 dark:border-fuchsia-900/30 dark:text-fuchsia-300",
      iconColorClass: "text-fuchsia-500",
    },
    {
      id: "receitas-exercicio",
      label: "Compare as receitas disponíveis no exercício selecionado.",
      icon: "account_balance_wallet",
      colorClass: "bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-300",
      iconColorClass: "text-green-600",
    },
  ];

  const currentRevenue = isRealData ? operatingVal : totalVal * 0.896;
  const capitalRevenue = isRealData ? investmentVal : totalVal * 0.104;

  const organLeader = data.secretariatCeiling ?? data.groups.organ[0] ?? null;
  const topPrograms = data.groups.program.slice(0, 2);

  const healthValue = findGroupValue(data.groups.functionName, ["saude", "saúde"]);
  const educationValue = findGroupValue(data.groups.functionName, ["educacao", "educação"]);
  const infrastructureValue = findGroupValue(data.groups.functionName, ["obra", "infra"]);


  const perCapitaRows = [
    {
      label: "Saúde por Habitante",
      total: healthValue || totalVal * 0.24,
      perCapita: (healthValue || totalVal * 0.24) / population,
      status: "Adequado",
      tone: "green",
    },
    {
      label: "Educação por Habitante",
      total: educationValue || totalVal * 0.2,
      perCapita: (educationValue || totalVal * 0.2) / population,
      status: "Adequado",
      tone: "green",
    },
    {
      label: "Obras e Infraestrutura",
      total: infrastructureValue || totalVal * 0.08,
      perCapita: (infrastructureValue || totalVal * 0.08) / population,
      status: "Em Expansão",
      tone: "blue",
    },
  ];

  const sumByPrefixes = (prefixes: string[]) =>
    data.classifications.economic
      .filter((item) => prefixes.some((p) => item.label.startsWith(p)))
      .reduce((sum, item) => sum + item.value, 0);

  const realPessoalValue = sumByPrefixes(["3.1.9"]);
  const realOutrasCorrentesValue = sumByPrefixes(["3.3.50", "3.3.71"]);
  const realInvestimentosValue = sumByPrefixes(["4.4", "4.5"]);
  const realAmortizacaoValue = sumByPrefixes(["4.6"]);

  const realExpenseBlocks = [
    { label: "Pessoal e Encargos (3.1.9)", value: realPessoalValue },
    { label: "Outras Despesas Correntes (3.3.50, 3.3.71)", value: realOutrasCorrentesValue },
    { label: "Investimentos e Inversões (4.4 e 4.5)", value: realInvestimentosValue, highlight: true },
  ];
  const expenseBlocks = isRealData
    ? realExpenseBlocks.map((block) => ({ ...block, share: expenseTotal ? Math.round((block.value / expenseTotal) * 100) : 0 }))
    : [
        { label: "Pessoal e Encargos", value: expenseTotal * 0.36, share: 36 },
        { label: "Custeio (Manutenção)", value: expenseTotal * 0.43, share: 43 },
        { label: "Investimentos & Expansão", value: expenseTotal * 0.17, share: 17, highlight: true },
      ];
  const amortizationValue = isRealData ? realAmortizacaoValue : totalVal * 0.026;
  const contingencyValue = isRealData ? sumByPrefixes(["9.9"]) || findCodeGroupValue(data.classifications.expenseGroup, "9") : totalVal * 0.009;

  const modalityTones = ["bg-tertiary", "bg-blue-400", "bg-blue-200"];
  const topModalities = data.classifications.modality.slice(0, 3);
  const originBlocks = isRealData
    ? topModalities.map((item, index) => ({
        label: item.label,
        value: totalVal ? Math.round((item.value / totalVal) * 1000) / 10 : 0,
        tone: modalityTones[index],
        text: index < 2 ? "text-white" : "text-on-surface",
      }))
    : [
        { label: "Transferências", value: 53, tone: "bg-tertiary", text: "text-white" },
        { label: "Própria", value: 41, tone: "bg-blue-400", text: "text-white" },
        { label: "Outros", value: 6, tone: "bg-blue-200", text: "text-on-surface" },
      ];

  const topHealthFunction = findGroup(data.groups.functionName, ["saude", "saúde"]) ?? data.groups.functionName[0] ?? null;
  const topEducationFunction = findGroup(data.groups.functionName, ["educacao", "educação"]) ?? data.groups.functionName[1] ?? null;
  const topInfrastructureFunction = findGroup(data.groups.functionName, ["obra", "infra"]) ?? data.groups.functionName[2] ?? null;

  const currentImportId = selectedImportId || data.selection.importId || "";
  const exerciseYear = dataSource === "ficticio" ? 2027 : data.selection.exercise;
  const importYears = [...new Set(data.imports.map((item) => item.exercise).filter((year): year is number => year !== null))].sort((left, right) => right - left);
  const importsForExercise = data.imports.filter((item) => item.exercise === exerciseYear);
  const primaryLinks = getPrimaryPageLinks("dashboard");

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
            {isRealData ? "Visualização Analítica da LOA — Dados Importados" : "Visualização Analítica da LOA - Equilíbrio entre Receita e Despesa"}
          </h2>
          <p className="text-on-surface-variant mt-1">
            {isRealData ? "Valores, classificações e alertas da importação selecionada." : "Gestão orçamentária integrada: análise de fontes e aplicações de recursos."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {primaryLinks.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="inline-flex items-center gap-2 bg-surface border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface rounded-lg shadow-sm hover:bg-surface-container-low transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3 bg-surface px-4 py-3 border border-outline-variant rounded-lg text-sm font-medium text-on-surface">
          <DataSourceToggle />
          <label className="grid gap-1 border-l border-outline-variant/30 pl-3 text-xs text-on-surface-variant">
            Exercício
            <select
              className="min-w-24 rounded-md border border-outline-variant bg-surface px-2 py-1.5 text-sm font-semibold text-on-surface disabled:opacity-70"
              value={exerciseYear ?? ""}
              disabled={dataSource === "ficticio" || !importYears.length}
              onChange={(event) => {
                const nextExercise = Number(event.target.value);
                const nextImport = data.imports.find((item) => item.exercise === nextExercise);
                if (nextImport) onSelectImport(nextImport.id);
              }}
            >
              {dataSource === "ficticio" ? <option value="2027">2027</option> : importYears.length ? importYears.map((year) => <option key={year} value={year}>{year}</option>) : <option value="">Sem exercício</option>}
            </select>
          </label>
          <label className="grid min-w-56 gap-1 text-xs text-on-surface-variant">
            Importação
            <select
              className="max-w-80 rounded-md border border-outline-variant bg-surface px-2 py-1.5 text-sm font-semibold text-on-surface disabled:opacity-70"
              value={currentImportId}
              disabled={dataSource === "ficticio" || !importsForExercise.length}
              onChange={(event) => onSelectImport(event.target.value)}
            >
              {dataSource === "ficticio" ? <option value="">Base simulada</option> : importsForExercise.length ? importsForExercise.map((item) => (
                <option key={item.id} value={item.id}>{item.fileName} · {integer.format(item.recordCount)} linhas</option>
              )) : <option value="">Nenhuma importação</option>}
            </select>
          </label>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <article className="glass-card bg-emerald-50/60 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">Despesa LDO (2027)</p>
            <h3 className="text-2xl font-headline font-bold text-emerald-900 dark:text-emerald-100">{formatCompactMoney(5868871609.91)}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Previsão 1.142 registros</p>
          </div>
          <span className="material-symbols-outlined absolute right-[-5px] bottom-[-5px] text-[60px] text-emerald-500/10">gavel</span>
        </article>
        <article className="glass-card bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-l-blue-500 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">Despesa LOA (2027)</p>
            <h3 className="text-2xl font-headline font-bold text-blue-900 dark:text-blue-100">{formatCompactMoney(totalVal)}</h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">{integer.format(data.quality.totalRecords)} registros fixados</p>
          </div>
          <span className="material-symbols-outlined absolute right-[-5px] bottom-[-5px] text-[60px] text-blue-500/10">account_balance_wallet</span>
        </article>
        <article className="glass-card bg-orange-50/60 dark:bg-orange-950/20 border-l-4 border-l-orange-500 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1">{isRealData ? "Despesas Correntes" : "Despesa Total Fixada"}</p>
            <h3 className="text-2xl font-headline font-bold text-orange-900 dark:text-orange-100">{formatCompactMoney(isRealData ? operatingVal : expenseTotal)}</h3>
            <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-1">Pessoal e Custeio</p>
          </div>
          <span className="material-symbols-outlined absolute right-[-5px] bottom-[-5px] text-[60px] text-orange-500/10">payments</span>
        </article>
        <article className="glass-card bg-teal-50/60 dark:bg-teal-950/20 border-l-4 border-l-teal-500 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="z-10">
            <p className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider mb-1">Investimentos (LOA)</p>
            <h3 className="text-2xl font-headline font-bold text-teal-900 dark:text-teal-100">{formatCompactMoney(investmentVal)}</h3>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">Obras e Capital</p>
          </div>
          <span className="material-symbols-outlined absolute right-[-5px] bottom-[-5px] text-[60px] text-teal-500/10">engineering</span>
        </article>
        <article className="glass-card bg-amber-50/60 dark:bg-amber-950/20 border-l-4 border-l-amber-500 p-5 flex flex-col justify-center h-32">
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Conformidade LOA</p>
            <h3 className="text-lg font-headline font-bold text-amber-900 dark:text-amber-100">{percent.format(data.quality.coverage)}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{integer.format(data.quality.warningRecords)} alertas de cadastro</p>
          </div>
        </article>
      </section>

      <AnalisesCombinadasSection />

      <Filters
        filters={filters}
        options={data.filterOptions}
        total={data.totals.filtered}
        onChange={onChange}
        onClear={() => onChange(EMPTY_FILTERS)}
      />

      <section aria-labelledby="classification-title" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 id="classification-title" className="text-xl font-headline font-bold text-on-surface">Classificação da Despesa</h3>
            <p className="text-sm text-on-surface-variant">Categoria, grupo, modalidade, classificação econômica e subelemento no recorte selecionado.</p>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant">{dataSource === "real" ? `Importação real · exercício ${exerciseYear ?? "não identificado"}` : "Base simulada preservada"}</span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <BarChart title="Categoria da Despesa" subtitle="Participação no valor importado" data={data.classifications.category} changeable />
          <BarChart title="Grupo de Despesa" subtitle="Distribuição por grupo orçamentário" data={data.classifications.expenseGroup} changeable />
          <BarChart title="Modalidade de Aplicação" subtitle="Principais formas de aplicação" data={data.classifications.modality} changeable />
          <BarChart title="Classificação Econômica" subtitle="Naturezas com maior valor previsto" data={data.classifications.economic} changeable />
          <BarChart title="Subelementos" subtitle="Detalhamento informado na planilha" data={data.classifications.subelement} changeable />
        </div>
      </section>

      <section aria-labelledby="quality-title" className="rounded-xl border border-outline-variant bg-surface overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-outline-variant px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 id="quality-title" className="text-lg font-headline font-bold text-on-surface">Qualidade dos dados importados</h3>
            <p className="text-sm text-on-surface-variant">Registros com alerta continuam incluídos em todos os totais e gráficos.</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${data.quality.warningRecords ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"}`}>
            {data.quality.available ? `${percent.format(data.quality.coverage)} em conformidade` : "Disponível para dados reais"}
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-outline-variant md:grid-cols-4 md:divide-y-0">
          {[
            ["Registros analisados", integer.format(data.quality.totalRecords)],
            ["Em conformidade", integer.format(data.quality.validRecords)],
            ["Com alerta", integer.format(data.quality.warningRecords)],
            ["Valor sinalizado", currency.format(data.quality.warningValue)],
          ].map(([label, value]) => (
            <div key={label} className="px-5 py-4">
              <p className="text-xs text-on-surface-variant">{label}</p>
              <p className="mt-1 text-lg font-bold text-on-surface">{value}</p>
            </div>
          ))}
        </div>
        {data.quality.issues.length > 0 && (
          <div className="overflow-x-auto border-t border-outline-variant">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-surface-container text-xs text-on-surface-variant">
                <tr><th className="px-5 py-3">Código da Despesa</th><th className="px-5 py-3">Desc Sub</th><th className="px-5 py-3">Tipo do alerta</th><th className="px-5 py-3 text-right">Registros</th><th className="px-5 py-3 text-right">Valor mantido</th></tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {data.quality.issues.map((issue) => (
                  <tr key={`${issue.type}-${issue.expenseCode}-${issue.subelementDescription}`}>
                    <td className="whitespace-nowrap px-5 py-3 font-mono font-semibold text-on-surface">{issue.expenseCode}</td>
                    <td className="max-w-md px-5 py-3 text-on-surface">{issue.subelementDescription}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{issue.type === "missing-nature" ? "Natureza ausente" : issue.type === "invalid-nature" ? "Código não cadastrado" : "Subelemento não localizado"}</td>
                    <td className="px-5 py-3 text-right font-semibold">{integer.format(issue.count)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{currency.format(issue.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SecretariasMenu data={data} filters={filters} onChange={onChange} totalVal={totalVal} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-tertiary">trending_up</span>
            <h3 className="text-xl font-headline font-bold text-on-surface">{isRealData ? "Composição Econômica da Despesa" : "Análise da Receita Pública"}</h3>
          </div>

          <section className="glass-card p-6">
            <h4 className="text-sm font-bold uppercase text-on-surface-variant mb-4">Detalhamento por Categoria</h4>
            <div className="space-y-4">
              <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{isRealData ? "Despesas Correntes" : "Receita Corrente"}</span>
                  <span className="text-sm font-bold text-tertiary">{formatCompactMoney(currentRevenue)}</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5">
                  <div className="bg-tertiary h-1.5 rounded-full" style={{ width: `${totalVal > 0 ? (currentRevenue / totalVal) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{isRealData ? "Despesas de Capital" : "Receita de Capital"}</span>
                  <span className="text-sm font-bold text-tertiary">{formatCompactMoney(capitalRevenue)}</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5">
                  <div className="bg-tertiary-container h-1.5 rounded-full" style={{ width: `${totalVal > 0 ? (capitalRevenue / totalVal) * 100 : 0}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h5 className="text-xs font-bold uppercase text-on-surface-variant mb-3">{isRealData ? "Distribuição por Modalidade de Aplicação" : "Distribuição por Origem"}</h5>
              <div className="flex h-10 rounded-lg overflow-hidden shadow-inner mb-4">
                {originBlocks.map((block) => (
                  <div key={block.label} className={`${block.tone} h-full flex items-center justify-center text-[10px] font-bold ${block.text}`} style={{ width: `${block.value}%` }}>
                    {String(block.value).replace(".", ",")}%
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-medium text-on-surface-variant">
                {originBlocks.map((block) => (
                  <div key={block.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${block.tone}`} />
                    {block.label} ({formatCompactMoney(totalVal * (block.value / 100))})
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <h4 className="text-sm font-bold uppercase text-on-surface-variant mb-4">{isRealData ? "Métricas Per Capita (Despesa)" : "Métricas Per Capita (Receita)"}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Total / Habitante</p>
                <p className="text-xl font-bold text-on-surface">{currency.format(totalVal / population)}</p>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">{isRealData ? "Capital / Habitante" : "Própria / Habitante"}</p>
                <p className="text-xl font-bold text-tertiary">{currency.format((isRealData ? investmentVal : totalVal * 0.41) / population)}</p>
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4 text-tertiary">
              <span className="material-symbols-outlined text-sm">lightbulb</span>
              <h4 className="text-sm font-bold uppercase">{isRealData ? "Leitura da Importação" : "Insights de Receita"}</h4>
            </div>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1.5 shrink-0" />
                <p className="text-sm text-on-surface-variant">{isRealData ? `${percent.format(totalVal ? operatingVal / totalVal : 0)} do valor importado corresponde a despesas correntes.` : "A arrecadação própria atingiu 41%, demonstrando robustez fiscal municipal."}</p>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1.5 shrink-0" />
                <p className="text-sm text-on-surface-variant">{isRealData ? `${integer.format(data.quality.warningRecords)} registros foram mantidos nos totais com sinalização cadastral.` : "Os grupos funcionais mais relevantes concentram a maior parcela dos recursos."}</p>
              </li>
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-orange-600">trending_down</span>
            <h3 className="text-xl font-headline font-bold text-on-surface">Análise da Despesa Pública</h3>
          </div>

          <section className="glass-card p-6 border-t-4 border-t-orange-500">
            <h4 className="text-sm font-bold uppercase text-on-surface-variant mb-4">Estrutura do Orçamento de Despesa</h4>
            <div className="space-y-4">
              {expenseBlocks.map((block) => (
                <div
                  key={block.label}
                  className={`bg-surface-container rounded-lg p-3 border border-outline-variant/30 flex justify-between items-center ${
                    block.highlight ? "ring-2 ring-orange-500/20" : ""
                  }`}
                >
                  <div>
                    <p className={`text-[10px] uppercase font-bold ${block.highlight ? "text-orange-700" : "text-on-surface-variant"}`}>{block.label}</p>
                    <p className={`text-lg font-bold ${block.highlight ? "text-orange-700" : "text-on-surface"}`}>
                      {formatCompactMoney(block.value)} <span className={`text-xs font-normal ml-2 ${block.highlight ? "text-orange-600" : "text-on-surface-variant"}`}>({block.share}%)</span>
                    </p>
                  </div>
                  {block.highlight ? (
                    <span className="material-symbols-outlined text-orange-600">rocket_launch</span>
                  ) : (
                    <div className="w-12 h-1.5 bg-orange-200 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${block.share}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-surface rounded border border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Amortização Dívida</p>
                <p className="text-md font-bold text-on-surface">{formatCompactMoney(amortizationValue)}</p>
              </div>
              <div className="p-3 bg-surface rounded border border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Reserva Contingência</p>
                <p className="text-md font-bold text-on-surface">{formatCompactMoney(contingencyValue)}</p>
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <h4 className="text-sm font-bold uppercase text-on-surface-variant mb-4">Concentração e Rankings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-600">medical_services</span>
                  <div className="text-sm">
                    <p className="font-bold text-on-surface">{organLeader?.label || "Saúde"}</p>
                    <p className="text-xs text-on-surface-variant">Maior Órgão Executor</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-on-surface">{formatCompactMoney(organLeader?.value ?? 0)}</p>
                  <p className="text-[10px] text-orange-600 font-bold">{totalVal ? `${Math.round(((organLeader?.value ?? 0) / totalVal) * 100)}% do Total` : "0% do Total"}</p>
                </div>
              </div>
              <div className="p-3 border border-outline-variant/30 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-2">Top Programas e Ações</p>
                <div className="space-y-2">
                  {topPrograms.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm gap-4">
                      <span className="text-on-surface-variant truncate pr-4">{item.label}</span>
                      <span className="font-bold shrink-0">{formatCompactMoney(item.value)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-on-surface-variant italic">As maiores estruturas concentram a maior parte da despesa total.</p>
              </div>
            </div>
          </section>

          <section className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4 text-orange-600">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <h4 className="text-sm font-bold uppercase">Insights de Despesa (IA)</h4>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 rounded text-sm text-on-surface-variant border-l-4 border-l-orange-400">
                Investimentos representam {expenseTotal ? `${Math.round((investmentVal / expenseTotal) * 100)}%` : "0%"} do orçamento, com maior peso nos projetos de expansão.
              </div>
              <div className="p-3 bg-surface-container rounded text-sm text-on-surface-variant">
                Identificadas {data.counts.actions} ações vinculadas ao plano, indicando boa granularidade de execução.
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="glass-card p-6 bg-surface">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <span className="material-symbols-outlined text-xl">help_outline</span>
          <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface">Pergunte ao orçamento</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => {
                handleQuestionClick(q.id);
                void askAssistant(q.label);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] cursor-pointer ${q.colorClass}`}
            >
              <span className={`material-symbols-outlined text-[16px] ${q.iconColorClass}`}>{q.icon}</span>
              {q.label}
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
          <form
            className="flex flex-col gap-2 md:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void askAssistant(assistantQuestion);
            }}
          >
            <label htmlFor="analytic-assistant-question" className="sr-only">Pergunte ao orçamento</label>
            <input
              id="analytic-assistant-question"
              value={assistantQuestion}
              onChange={(event) => setAssistantQuestion(event.target.value)}
              placeholder="Ou escreva uma pergunta sobre os dados selecionados..."
              maxLength={500}
              className="min-h-11 flex-1 rounded-xl border border-outline-variant bg-surface px-4 text-sm text-on-surface outline-none focus:border-tertiary"
            />
            <button
              type="submit"
              disabled={assistantLoading || !assistantQuestion.trim()}
              className="rounded-xl bg-tertiary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tertiary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assistantLoading ? "Consultando..." : "Perguntar"}
            </button>
          </form>
          {assistantError && <p role="alert" className="mt-3 rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">{assistantError}</p>}
          {assistantAnswer && (
            <div className="mt-4 rounded-2xl border border-tertiary/30 bg-surface p-4">
              <p className="text-sm leading-6 text-on-surface">{assistantAnswer.answer}</p>
              {assistantAnswer.details && assistantAnswer.details.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {assistantAnswer.details.map((detail) => (
                    <div key={detail.label} className="rounded-xl bg-surface-container-low p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">{detail.label}</p>
                      <p className="mt-1 text-sm font-bold text-tertiary">{detail.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {assistantAnswer.warning && <p className="mt-3 text-[11px] text-on-surface-variant">{assistantAnswer.warning}</p>}
            </div>
          )}
        </div>
      </section>

      <section className="glass-card p-8">
        <div className="text-center mb-8">
          <h4 className="text-lg font-headline font-bold text-on-surface">Fluxo de Aplicação de Recursos</h4>
          <p className="text-sm text-on-surface-variant">Como {isRealData ? "o valor importado" : "a receita"} de {formatCompactMoney(totalVal)} é distribuído entre as principais naturezas de despesa.</p>
        </div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl mx-auto">
          <div className="w-full md:w-48 p-6 bg-tertiary text-on-tertiary rounded-xl text-center shadow-lg z-10">
            <p className="text-[10px] uppercase font-bold opacity-80 mb-1">{isRealData ? "Valor Importado" : "Receita Total"}</p>
            <p className="text-2xl font-extrabold">{formatCompactMoney(totalVal)}</p>
          </div>
          <div className="hidden md:block absolute left-48 right-48 top-1/2 -translate-y-1/2 h-40 opacity-20 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path className="text-tertiary" d="M0,50 C50,50 50,20 100,20" fill="none" stroke="currentColor" strokeWidth="2" />
              <path className="text-tertiary" d="M0,50 C50,50 50,50 100,50" fill="none" stroke="currentColor" strokeWidth="2" />
              <path className="text-tertiary" d="M0,50 C50,50 50,80 100,80" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-48">
            <div className="p-3 bg-surface border border-orange-200 rounded-lg shadow-sm text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Pessoal</p>
              <p className="font-bold text-on-surface">{formatCompactMoney(expenseBlocks[0]?.value ?? 0)}</p>
            </div>
            <div className="p-3 bg-surface border border-orange-200 rounded-lg shadow-sm text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Custeio</p>
              <p className="font-bold text-on-surface">{formatCompactMoney(expenseBlocks[1]?.value ?? 0)}</p>
            </div>
            <div className="p-3 bg-orange-100 border border-orange-300 rounded-lg shadow-sm text-center">
              <p className="text-[10px] font-bold text-orange-800 uppercase">Investimentos</p>
              <p className="font-bold text-orange-800">{formatCompactMoney(expenseBlocks[2]?.value ?? 0)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-surface">
          <h4 className="text-sm font-semibold text-on-surface">Indicadores de Despesa por Habitante</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant font-semibold text-xs tracking-wider">
                <th className="px-6 py-4">Indicador</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Valor por Habitante</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {perCapitaRows.map((row) => (
                <tr key={row.label} className="hover:bg-surface-container-low/30">
                  <td className="px-6 py-4 font-semibold text-on-surface">{row.label}</td>
                  <td className="px-6 py-4 text-on-surface font-medium">{formatCompactMoney(row.total)}</td>
                  <td className="px-6 py-4 font-semibold text-on-surface">{currency.format(row.perCapita)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      row.tone === "green" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="glass-card bg-surface p-5">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{isRealData ? "Despesas Correntes" : "Receita Corrente"}</p>
          <h4 className="text-lg font-headline font-bold text-on-surface">{formatCompactMoney(currentRevenue)}</h4>
          <p className="text-xs text-on-surface-variant mt-2">{topHealthFunction?.label || "Maior função"}</p>
        </article>
        <article className="glass-card bg-surface p-5">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Educação</p>
          <h4 className="text-lg font-headline font-bold text-on-surface">{formatCompactMoney(educationValue || totalVal * 0.2)}</h4>
          <p className="text-xs text-on-surface-variant mt-2">{topEducationFunction?.label || "Segundo maior eixo"}</p>
        </article>
        <article className="glass-card bg-surface p-5">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Obras e Infraestrutura</p>
          <h4 className="text-lg font-headline font-bold text-on-surface">{formatCompactMoney(infrastructureValue || totalVal * 0.08)}</h4>
          <p className="text-xs text-on-surface-variant mt-2">{topInfrastructureFunction?.label || "Carteira estratégica"}</p>
        </article>
      </section>
    </div>
  );
}
