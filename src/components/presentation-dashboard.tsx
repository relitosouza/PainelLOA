"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { currency, percent } from "@/lib/format";
import { getPresentationRecords, groupPresentation, PRESENTATION_SECRETARIATS, type PresentationRecord } from "@/lib/presentation-data";
import { useDataSource } from "./data-source-toggle";
import type { DashboardData, BudgetRow } from "@/types/loa";

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function cleanBudgetLabel(label: string) {
  return label
    .replace(/^\d{2}\.\d{2}\.\d{3}\.\d{2}\s*-\s*/i, "")
    .replace(/=$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function share(value: number, total: number) {
  return total ? percent.format(value / total) : "0%";
}

function Treemap({
  items,
  onSelectSecretariat,
}: {
  items: { label: string; value: number }[];
  onSelectSecretariat: (name: string) => void;
}) {
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.value - a.value);
  }, [items]);

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];
  const top4 = sorted[3];
  const top5 = sorted[4];
  const othersValue = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
  const othersCount = Math.max(0, sorted.length - 5);

  return (
    <div className="grid grid-cols-10 grid-rows-2 h-[320px] gap-3">
      {top1 && (
        <div
          onClick={() => onSelectSecretariat(top1.label)}
          className="col-span-4 row-span-2 bg-gradient-to-br from-tertiary to-[#004883] text-white p-6 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-transform cursor-pointer shadow-md group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-tertiary-fixed/80 mb-1">Maior Secretaria</p>
          <h4 className="font-black text-3xl leading-tight mb-1">{cleanBudgetLabel(top1.label)}</h4>
          <p className="text-lg font-medium text-white/90">{compactCurrency(top1.value)}</p>
        </div>
      )}
      {top2 && (
        <div
          onClick={() => onSelectSecretariat(top2.label)}
          className="col-span-3 row-span-1 bg-[#2b88d8] text-white p-5 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-transform cursor-pointer shadow-sm relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 className="font-black text-xl leading-tight mb-1">{cleanBudgetLabel(top2.label)}</h4>
          <p className="text-sm font-medium text-white/90">{compactCurrency(top2.value)}</p>
        </div>
      )}
      {top3 && (
        <div
          onClick={() => onSelectSecretariat(top3.label)}
          className="col-span-3 row-span-1 bg-[#56a5eb] text-white p-5 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-transform cursor-pointer shadow-sm relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 className="font-black text-lg leading-tight mb-1">{cleanBudgetLabel(top3.label)}</h4>
          <p className="text-sm font-medium text-white/90">{compactCurrency(top3.value)}</p>
        </div>
      )}
      {top4 && (
        <div
          onClick={() => onSelectSecretariat(top4.label)}
          className="col-span-2 row-span-1 bg-[#90c6f4] text-[#00386b] p-4 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-transform cursor-pointer shadow-sm relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 className="font-bold text-base leading-tight mb-1">{cleanBudgetLabel(top4.label)}</h4>
          <p className="text-xs font-semibold">{compactCurrency(top4.value)}</p>
        </div>
      )}
      {top5 && (
        <div
          onClick={() => onSelectSecretariat(top5.label)}
          className="col-span-2 row-span-1 bg-[#b9dbf8] text-[#00386b] p-4 rounded-xl flex flex-col justify-end hover:scale-[1.01] transition-transform cursor-pointer shadow-sm relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h4 className="font-bold text-sm leading-tight mb-1">{cleanBudgetLabel(top5.label)}</h4>
          <p className="text-xs font-semibold">{compactCurrency(top5.value)}</p>
        </div>
      )}
      {othersCount > 0 && (
        <div
          onClick={() => onSelectSecretariat("")}
          className="col-span-2 row-span-1 bg-surface-container-low text-on-surface-variant p-4 rounded-xl flex flex-col justify-center items-center border-2 border-dashed border-outline-variant/50 hover:bg-surface-container hover:border-outline-variant transition-colors cursor-pointer"
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-1">Outras {othersCount}</p>
          <p className="text-sm font-black">{compactCurrency(othersValue)}</p>
        </div>
      )}
    </div>
  );
}

export function PresentationDashboard() {
  const [year, setYear] = useState<2026 | 2027>(2027);
  const [secretariat, setSecretariat] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [dataSource, setDataSource] = useDataSource();
  const [dbData, setDbData] = useState<DashboardData | null>(null);

  // Pergunte ao Orçamento Interactivity State
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (dataSource === "real" && !dbData) {
      fetch("/api/loa?all=true")
        .then((res) => res.json())
        .then((res) => setDbData(res))
        .catch(console.error);
    }
  }, [dataSource, dbData]);

  const realRecords = useMemo((): PresentationRecord[] => {
    if (!dbData?.records) return [];
    return dbData.records.map((record: BudgetRow) => {
      const isOperating = record.expenseNature.startsWith("3") || record.subelement === "33";
      let nature: PresentationRecord["nature"] = "Custeio";
      if (record.expenseNature.startsWith("3.1")) nature = "Pessoal";
      else if (record.expenseNature.startsWith("3.3")) nature = "Custeio";
      else if (record.expenseNature.startsWith("4.4")) nature = "Investimentos";
      else if (record.expenseNature.startsWith("4.6")) nature = "Amortização";
      else if (!isOperating) nature = "Investimentos";

      return {
        secretariat: record.organ,
        unit: record.budgetUnit,
        functionName: record.functionName,
        program: record.program,
        process: record.administrativeProcess,
        category: isOperating ? "operating" : "investment",
        nature,
        value: record.value,
      };
    });
  }, [dbData]);

  const getCurrentRecords = useMemo(() => {
    return (selectedYear: 2026 | 2027): PresentationRecord[] => {
      if (dataSource === "ficticio") return getPresentationRecords(selectedYear);
      if (selectedYear === 2027) return realRecords;
      return realRecords.map((record, index) => ({
        ...record,
        value: Math.round(record.value * (0.88 + (index % 4) * 0.01)),
      }));
    };
  }, [dataSource, realRecords]);

  const summary = useMemo(() => {
    const records = getCurrentRecords(year).filter((record) => !secretariat || record.secretariat === secretariat);
    const total = records.reduce((sum, record) => sum + record.value, 0);
    const operating = records.filter((record) => record.category === "operating").reduce((sum, record) => sum + record.value, 0);
    const functions = groupPresentation(records, "functionName");
    const units = groupPresentation(records, "unit");
    const programs = groupPresentation(records, "program");
    const processes = groupPresentation(records, "process");
    const organs = groupPresentation(records, "secretariat");
    return {
      total,
      operating,
      investment: total - operating,
      functions,
      units,
      programs,
      processes,
      organs,
      totalRecords: records.length,
      secretariatCount: new Set(records.map((record) => record.secretariat)).size,
      unitCount: new Set(records.map((record) => record.unit)).size,
      programCount: new Set(records.map((record) => record.program)).size,
      processCount: new Set(records.map((record) => record.process)).size,
      natureTotals: records.reduce<Record<PresentationRecord["nature"], number>>(
        (acc, record) => {
          acc[record.nature] += record.value;
          return acc;
        },
        { Pessoal: 0, Custeio: 0, Investimentos: 0, Amortização: 0 }
      ),
    };
  }, [secretariat, year, getCurrentRecords]);

  const previousTotal = useMemo(() => {
    return getCurrentRecords(2026)
      .filter((record) => !secretariat || record.secretariat === secretariat)
      .reduce((sum, record) => sum + record.value, 0);
  }, [secretariat, getCurrentRecords]);

  const trend = previousTotal ? summary.total / previousTotal - 1 : 0;
  const topFiveShare = summary.total ? summary.organs.slice(0, 5).reduce((sum, item) => sum + item.value, 0) / summary.total : 0;
  const ownRevenue = summary.total * 0.41;
  const transfers = summary.total * 0.53;
  const capitalRevenue = Math.max(0, summary.total - ownRevenue - transfers);
  const investmentShare = summary.total ? summary.investment / summary.total : 0;
  const perCapita = summary.total / 723500;

  const topProgram = summary.programs[0];
  const topProcess = summary.processes[0];
  const topInvestment = summary.programs.find((program) => program.label.toLowerCase().includes("obra")) ?? summary.programs[1] ?? summary.programs[0];

  const getPriorityValue = (keywords: string[], fallbackPct: number) => {
    const organMatch = summary.organs.find((item) =>
      keywords.some((keyword) => item.label.toLowerCase().includes(keyword))
    );
    if (organMatch) return organMatch.value;

    const functionMatch = summary.functions.find((item) =>
      keywords.some((keyword) => item.label.toLowerCase().includes(keyword))
    );
    if (functionMatch) return functionMatch.value;

    return summary.total * fallbackPct;
  };

  const prioritySaude = getPriorityValue(["saude", "saúde"], 0.24);
  const priorityEducacao = getPriorityValue(["educac", "educaç"], 0.20);
  const priorityObras = getPriorityValue(["obras", "infraestrutura", "infra", "urbanismo"], 0.08);
  const priorityMobilidade = getPriorityValue(["mobilidade", "transporte", "trânsito", "transito"], 0.05);
  const priorityAssistencia = getPriorityValue(["assistência", "assistencia", "social", "cidadania"], 0.04);

  const priorities = [
    { label: "Saúde", value: prioritySaude, color: "bg-red-500" },
    { label: "Educação", value: priorityEducacao, color: "bg-indigo-500" },
    { label: "Obras", value: priorityObras, color: "bg-amber-500" },
    { label: "Mobilidade", value: priorityMobilidade, color: "bg-blue-500" },
    { label: "Assistência", value: priorityAssistencia, color: "bg-emerald-500" },
  ];

  // Pergunte ao Orçamento Interactivity Handler
  const askQuestion = (question: string) => {
    setQuestionText(question);
    setIsTyping(true);
    setAnswerText(null);

    setTimeout(() => {
      setIsTyping(false);
      let answer = "";
      const lower = question.toLowerCase();

      if (lower.includes("saúde") || lower.includes("saude")) {
        answer = `A Saúde é uma das maiores prioridades do município, com uma dotação de **${compactCurrency(
          prioritySaude
        )}**, representando aproximadamente **${share(prioritySaude, summary.total)}** do orçamento total LOA ${year}.`;
      } else if (lower.includes("secretaria") || lower.includes("órgão")) {
        const topOrganName = summary.organs[0]?.label ?? "Saúde";
        const topOrganValue = summary.organs[0]?.value ?? 0;
        answer = `A secretaria com maior dotação orçamentária é a **${cleanBudgetLabel(
          topOrganName
        )}**, com um montante de **${compactCurrency(topOrganValue)}** (cerca de **${share(
          topOrganValue,
          summary.total
        )}** do total do município).`;
      } else if (lower.includes("obras")) {
        answer = `O setor de Obras e Infraestrutura Urbana tem dotação estimada em **${compactCurrency(
          priorityObras
        )}** para o exercício de ${year}.`;
      } else if (lower.includes("educação") || lower.includes("educacao")) {
        answer = `Para a Educação está previsto o valor de **${compactCurrency(
          priorityEducacao
        )}**, equivalente a **${share(priorityEducacao, summary.total)}** do total LOA ${year}.`;
      } else {
        answer = `No orçamento LOA ${year}, o total estimado é de **${compactCurrency(
          summary.total
        )}**. Destacam-se **${compactCurrency(
          summary.natureTotals.Pessoal
        )}** em Pessoal e Encargos, **${compactCurrency(
          summary.natureTotals.Custeio
        )}** em Custeio/Manutenção e **${compactCurrency(
          summary.natureTotals.Investimentos
        )}** para Investimentos diretos.`;
      }

      setAnswerText(answer);
    }, 600);
  };

  // PDF Report Export Handler
  const handlePdfExport = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Prefeitura de Osasco", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Sala de Situação - Relatório Executivo LOA ${year}`, 14, 28);
    if (secretariat) {
      doc.text(`Secretaria Filtrada: ${cleanBudgetLabel(secretariat)}`, 14, 35);
    }

    doc.line(14, 38, 196, 38);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. Resumo dos Indicadores Gerais", 14, 46);

    doc.setFont("helvetica", "normal");
    doc.text(`Orçamento Total: ${currency.format(summary.total)}`, 14, 54);
    doc.text(`Custeio Real: ${share(summary.operating, summary.total)}`, 14, 61);
    doc.text(`Investimentos Real: ${share(summary.investment, summary.total)}`, 14, 68);
    doc.text(`Pessoal e Folha: ${share(summary.natureTotals.Pessoal, summary.total)}`, 14, 75);

    doc.line(14, 80, 196, 80);

    doc.setFont("helvetica", "bold");
    doc.text("2. Despesas por Natureza", 14, 88);

    doc.setFont("helvetica", "normal");
    doc.text(`Pessoal e Encargos: ${currency.format(summary.natureTotals.Pessoal)}`, 14, 96);
    doc.text(`Outras Despesas Correntes (Custeio): ${currency.format(summary.natureTotals.Custeio)}`, 14, 103);
    doc.text(`Investimentos (Obras/Projetos): ${currency.format(summary.natureTotals.Investimentos)}`, 14, 110);
    doc.text(`Amortização da Dívida: ${currency.format(summary.natureTotals.Amortização)}`, 14, 117);

    doc.line(14, 122, 196, 122);

    doc.setFont("helvetica", "bold");
    doc.text("3. Distribuição das Principais Secretarias", 14, 130);

    doc.setFont("helvetica", "normal");
    let y = 138;
    summary.organs.slice(0, 5).forEach((organ, index) => {
      doc.text(
        `${index + 1}. ${cleanBudgetLabel(organ.label)}: ${currency.format(organ.value)} (${share(
          organ.value,
          summary.total
        )})`,
        14,
        y
      );
      y += 8;
    });

    doc.save(`LOA-${year}-Relatorio-Executivo.pdf`);
  };

  return (
    <div className="relative min-h-screen bg-background font-body text-on-surface antialiased">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/50 flex justify-between items-center w-full px-8 py-4 shadow-sm">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-surface-container rounded-xl flex items-center justify-center text-on-surface cursor-pointer transition-colors"
            aria-label="Alternar Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {sidebarCollapsed ? "menu" : "menu_open"}
            </span>
          </button>
          <div className="flex items-center gap-3">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPv8bxz9qBvO0U-LbRPOpq5Zv3IM3GqYCCJdLPolQmfhY7LWhcVQDNA6O2hlCTigyfqa-Vi8V2Ybvn75DIVi8vi7GszUXwtVR6DaIrN-RouQO7vy-b0Z1MU4e3amKwkEuYL3_hPizKdBt2UjiF9P9o7N03Rdv5u7kbtO9Vsr5wr2h-ikyncy-lB9A8KxhGQfO4QLV97UDbsZm3M4-LAvJQaBHUyuEdX2dffDmmvGzNiE7-SIAosqsO58xtB337OLqhfqs"
              alt="Brasão de Osasco"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="hidden md:flex gap-8 font-headline text-sm font-semibold tracking-wide">
            <Link className="text-tertiary border-b-2 border-tertiary pb-1" href="/apresentacao">
              Painel Executivo
            </Link>
            <Link className="text-on-surface-variant hover:text-tertiary transition-colors pb-1" href="/transparente">
              LOA Transparência
            </Link>
            <Link className="text-on-surface-variant hover:text-tertiary transition-colors pb-1" href="/">
              Visão Analítica
            </Link>
          </div>
        </div>
      </nav>

      {/* SideNavBar */}
      <aside
        className={`flex flex-col h-screen fixed left-0 top-0 border-r border-inverse-surface/10 pt-24 pb-6 px-4 bg-[#1e2022] text-white w-72 shadow-xl z-40 transition-all duration-300 lg:translate-x-0 ${
          sidebarCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:px-0 lg:border-r-0" : "translate-x-0"
        } lg:flex`}
      >
        <nav className="flex-1 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          <Link
            className="flex items-center gap-4 px-4 py-3 bg-tertiary text-white rounded-xl font-bold font-body text-sm shadow-md shadow-tertiary/20"
            href="#"
          >
            <span className="material-symbols-outlined text-xl">home</span>
            <span>Visão Geral</span>
          </Link>
          <Link
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="/receitas"
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            <span className="font-medium">Receita</span>
          </Link>
          <Link
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="/despesas"
          >
            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
            <span className="font-medium">Despesa</span>
          </Link>
          <a
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#prioridades"
          >
            <span className="material-symbols-outlined text-xl">account_balance</span>
            <span className="font-medium">Secretarias</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#prioridades"
          >
            <span className="material-symbols-outlined text-xl">track_changes</span>
            <span className="font-medium">Prioridades</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#despesas"
          >
            <span className="material-symbols-outlined text-xl">trending_up</span>
            <span className="font-medium">Investimentos</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#alertas"
          >
            <span className="material-symbols-outlined text-xl">warning</span>
            <span className="font-medium">Riscos e Concentração</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#prioridades"
          >
            <span className="material-symbols-outlined text-xl">insights</span>
            <span className="font-medium">Comparativos</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#insights"
          >
            <span className="material-symbols-outlined text-xl">psychology</span>
            <span className="font-medium">Insights</span>
          </a>
          <a
            className="flex items-center gap-4 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="#pergunte"
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            <span className="font-medium">Pergunte ao Orçamento</span>
          </a>
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-white/10">
          <button
            onClick={handlePdfExport}
            className="w-full flex items-center justify-center gap-3 bg-tertiary/20 text-tertiary-fixed py-3.5 rounded-xl font-bold mb-6 hover:bg-tertiary/30 transition-colors border border-tertiary/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>Gerar Relatório
          </button>
          <Link
            className="flex items-center gap-4 px-4 py-2.5 text-white/60 hover:bg-white/5 hover:text-white transition-all font-body text-sm rounded-xl"
            href="/transparente"
          >
            <span className="material-symbols-outlined text-xl">help</span>
            <span className="font-medium">Suporte</span>
          </Link>
          <Link
            className="flex items-center gap-4 px-4 py-2.5 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all font-body text-sm rounded-xl"
            href="/"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-medium">Sair</span>
          </Link>
        </div>
      </aside>

      {!sidebarCollapsed && (
        <button
          aria-label="Fechar menu"
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden border-0 cursor-pointer"
        />
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-28 px-8 pb-12 max-w-[1600px] mx-auto ${
        sidebarCollapsed ? "lg:ml-0" : "lg:ml-72"
      }`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-headline font-black text-on-surface tracking-tight mb-2">Painel Executivo da LOA</h1>
            <p className="text-on-surface-variant text-lg">Sala de Situação do Prefeito — Visão Consolidada de Recursos</p>
          </div>
        </div>

        {/* 1. Panorama Geral (Header Row) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-7 rounded-2xl bg-gradient-to-br from-tertiary to-[#00386b] text-white shadow-xl shadow-tertiary/20 relative overflow-hidden group border border-tertiary/20">
            <div className="absolute -right-6 -bottom-6 opacity-[0.08] group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[160px]">account_balance</span>
            </div>
            <div className="relative z-10">
              <p className="text-tertiary-fixed font-semibold text-sm tracking-wide mb-2 opacity-90 uppercase">Orçamento Total (LOA)</p>
              <h3 className="text-5xl font-headline font-black mb-5 tracking-tight">{compactCurrency(summary.total)}</h3>
              <div className="flex items-center gap-2 text-sm font-bold bg-white/10 backdrop-blur-sm w-fit px-3 py-1.5 rounded-lg border border-white/10">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>{trend >= 0 ? "+" : ""}{percent.format(trend)} vs Ano Anterior</span>
              </div>
            </div>
          </div>

          <div id="alertas" className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-3">
                <p className="text-outline font-bold text-xs uppercase tracking-wider">Receita vs Despesa</p>
                <div className="w-10 h-10 rounded-full bg-[#e6f4ea] flex items-center justify-center text-[#137333] shadow-inner">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
              </div>
              <h3 className="text-3xl font-headline font-black text-on-surface mb-1">Equilibrado</h3>
              <p className="text-sm font-semibold text-[#137333]">Superávit Projetado: R$ 12M</p>
            </div>
            <div className="mt-6 h-2 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/20">
              <div className="bg-[#1e8e3e] h-full w-[100%] rounded-full shadow-[0_0_10px_rgba(30,142,62,0.5)]"></div>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <p className="text-outline font-bold text-xs uppercase tracking-wider">Investimento / Hab.</p>
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-xl">person_pin_circle</span>
              </div>
            </div>
            <h3 className="text-3xl font-headline font-black text-on-surface mb-1">{currency.format(perCapita)}</h3>
            <p className="text-sm font-medium text-on-surface-variant">População: 723.441 hab.</p>
            <div className="mt-6 flex gap-1.5 h-2">
              <div className="h-full flex-1 bg-tertiary rounded-l-full shadow-[0_0_8px_rgba(0,93,167,0.4)]"></div>
              <div className="h-full flex-1 bg-tertiary/80 shadow-[0_0_8px_rgba(0,93,167,0.4)]"></div>
              <div className="h-full flex-1 bg-tertiary/60 shadow-[0_0_8px_rgba(0,93,167,0.4)]"></div>
              <div className="h-full flex-1 bg-surface-container-high rounded-r-full"></div>
            </div>
          </div>
        </div>

        {/* FilterBar */}
        <div className="bg-surface-container-low border border-outline-variant/30 px-6 py-4 mb-8 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 w-full">
            {/* Custom Styled Secretariat Filter */}
            <div className="relative flex items-center bg-surface border border-outline-variant/60 rounded-xl px-4 py-2.5 hover:bg-surface-container-low transition-colors shadow-sm text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[18px] mr-2">corporate_fare</span>
              <select
                name="presentation-secretariat"
                value={secretariat}
                onChange={(e) => setSecretariat(e.target.value)}
                className="bg-transparent border-none outline-none pr-8 cursor-pointer appearance-none animate-none"
                aria-label="Filtrar por secretaria"
              >
                <option value="">Todas as Secretarias</option>
                {PRESENTATION_SECRETARIATS.map((item) => (
                  <option key={item} value={item}>{cleanBudgetLabel(item)}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-sm absolute right-3 pointer-events-none">expand_more</span>
            </div>

            {/* Read-Only Un. Orçamentárias Info */}
            <div className="relative group px-5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-sm">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
              <span>{summary.unitCount} Un. Orçamentárias</span>
            </div>

            {/* Year Toggle Button */}
            <button
              onClick={() => setYear((y) => (y === 2027 ? 2026 : 2027))}
              className="px-5 py-2.5 bg-surface border border-outline-variant/60 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-surface-container-low transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              LOA {year}
            </button>

            {/* Dynamic Data Source Toggle */}
            <div className="flex bg-surface-container-high p-1 rounded-xl border border-outline-variant/30" role="group" aria-label="Origem dos dados">
              <button
                type="button"
                onClick={() => setDataSource("ficticio")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dataSource === "ficticio"
                    ? "bg-white text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Simulados
              </button>
              <button
                type="button"
                onClick={() => setDataSource("real")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dataSource === "real"
                    ? "bg-white text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Reais
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setSecretariat("");
                setYear(2027);
              }}
              className="px-6 py-2.5 bg-tertiary text-white rounded-xl font-bold shadow-lg shadow-tertiary/30 hover:bg-[#004e8c] transition-colors flex items-center gap-2 ml-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              Resetar Filtros
            </button>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="p-5 bg-surface border border-outline-variant/40 rounded-2xl flex flex-col justify-center text-center shadow-sm hover:border-tertiary/30 transition-colors">
            <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-1">Secretarias</p>
            <p className="text-2xl font-black text-on-surface">{summary.secretariatCount}</p>
          </div>
          <div className="p-5 bg-surface border border-outline-variant/40 rounded-2xl flex flex-col justify-center text-center shadow-sm hover:border-tertiary/30 transition-colors">
            <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-1">Programas</p>
            <p className="text-2xl font-black text-on-surface">{summary.programCount}</p>
          </div>
          <div className="p-5 bg-surface border border-outline-variant/40 rounded-2xl flex flex-col justify-center text-center shadow-sm hover:border-tertiary/30 transition-colors">
            <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-1">Ações</p>
            <p className="text-2xl font-black text-on-surface">{summary.unitCount}</p>
          </div>
          <div className="p-5 bg-surface border border-outline-variant/40 rounded-2xl flex flex-col justify-center text-center shadow-sm hover:border-tertiary/30 transition-colors">
            <p className="text-[11px] uppercase font-bold text-outline tracking-wider mb-1">Processos</p>
            <p className="text-2xl font-black text-on-surface">{summary.processCount}</p>
          </div>
        </div>

        {/* 2 & 3. De onde vem e Para onde vai o dinheiro */}
        <div id="receitas" className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
          {/* Receita Section */}
          <div className="bg-surface rounded-2xl border border-outline-variant/40 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/30">
              <h2 className="text-2xl font-headline font-black flex items-center gap-3 text-on-surface">
                <div className="w-10 h-10 rounded-xl bg-[#e6f4ea] flex items-center justify-center text-[#137333]">
                  <span className="material-symbols-outlined">arrow_downward</span>
                </div>
                De onde vem o dinheiro
              </h2>
              <span className="text-xs font-bold px-3 py-1.5 bg-surface-container rounded-lg text-outline-variant border border-outline-variant/20 tracking-wider">
                FONTES {year}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-5 bg-[#fce8e6] rounded-xl border border-[#fad2cf] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <span className="material-symbols-outlined text-4xl text-[#c5221f]">account_balance_wallet</span>
                </div>
                <p className="text-xs text-[#c5221f] font-bold uppercase tracking-wider mb-2 relative z-10">Receita Própria</p>
                <p className="text-3xl font-black text-[#a50e0e] mb-1 relative z-10">{compactCurrency(ownRevenue)}</p>
                <p className="text-[11px] font-medium text-[#c5221f] relative z-10">IPTU, ISS, Taxas</p>
              </div>

              <div className="p-5 bg-[#e8f0fe] rounded-xl border border-[#d2e3fc] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <span className="material-symbols-outlined text-4xl text-[#1967d2]">swap_horiz</span>
                </div>
                <p className="text-xs text-[#1967d2] font-bold uppercase tracking-wider mb-2 relative z-10">Transferências</p>
                <p className="text-3xl font-black text-[#174ea6] mb-1 relative z-10">{compactCurrency(transfers)}</p>
                <p className="text-[11px] font-medium text-[#1967d2] relative z-10">FPM, ICMS, SUS, FUNDEB</p>
              </div>
            </div>

            <div className="bg-[#fef7e0] border border-[#fbe9a7] p-5 rounded-xl mb-8 flex gap-4 items-start shadow-inner">
              <div className="bg-[#f9ab00] text-white p-1.5 rounded-lg shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-lg">warning</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#b06000] mb-1">Alerta Estratégico: Dependência Externa</p>
                <p className="text-xs text-[#b06000]/80 font-medium leading-relaxed">
                  A dependência de transferências estaduais e federais é de {share(transfers, summary.total)}. Recomenda-se reforço na fiscalização do ISS para 2025.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-10 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <div className="relative w-36 h-36 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f0eded" strokeWidth="12"></circle>
                  <circle
                    className="drop-shadow-sm transition-all duration-500"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#ea4335"
                    strokeDasharray={`${(ownRevenue / (summary.total || 1)) * 251} 251`}
                    strokeDashoffset="0"
                    strokeWidth="12"
                  ></circle>
                  <circle
                    className="drop-shadow-sm transition-all duration-500"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#4285f4"
                    strokeDasharray={`${(transfers / (summary.total || 1)) * 251} 251`}
                    strokeDashoffset={`-${(ownRevenue / (summary.total || 1)) * 251}`}
                    strokeWidth="12"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-on-surface">{share(ownRevenue, summary.total)}</span>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Própria</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <p className="text-sm italic text-on-surface-variant font-medium leading-relaxed border-l-4 border-outline-variant/30 pl-4 py-1">
                  &quot;O município gera {share(ownRevenue, summary.total)} da sua própria receita, garantindo autonomia para investimentos essenciais.&quot;
                </p>
                <div className="flex flex-col gap-2.5 text-xs font-semibold">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-[#ea4335]"></span>
                      <span className="text-on-surface">Receita Própria</span>
                    </div>
                    <span className="text-outline">{share(ownRevenue, summary.total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-[#4285f4]"></span>
                      <span className="text-on-surface">Transferências</span>
                    </div>
                    <span className="text-outline">{share(transfers, summary.total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-surface-container-high"></span>
                      <span className="text-on-surface">Capital/Outros</span>
                    </div>
                    <span className="text-outline">{share(capitalRevenue, summary.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Despesa Section */}
          <div id="despesas" className="bg-surface rounded-2xl border border-outline-variant/40 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/30">
              <h2 className="text-2xl font-headline font-black flex items-center gap-3 text-on-surface">
                <div className="w-10 h-10 rounded-xl bg-[#fce8e6] flex items-center justify-center text-[#c5221f]">
                  <span className="material-symbols-outlined">arrow_upward</span>
                </div>
                Para onde vai o dinheiro
              </h2>
              <span className="text-xs font-bold px-3 py-1.5 bg-surface-container rounded-lg text-outline-variant border border-outline-variant/20 tracking-wider">
                APLICAÇÃO {year}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm text-center">
                <p className="text-[11px] text-outline font-bold uppercase tracking-wider mb-2">Pessoal</p>
                <p className="text-xl font-black text-on-surface">{compactCurrency(summary.natureTotals.Pessoal)}</p>
              </div>
              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm text-center">
                <p className="text-[11px] text-outline font-bold uppercase tracking-wider mb-2">Custeio</p>
                <p className="text-xl font-black text-on-surface">{compactCurrency(summary.natureTotals.Custeio)}</p>
              </div>
              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm text-center">
                <p className="text-[11px] text-outline font-bold uppercase tracking-wider mb-2">Dívida</p>
                <p className="text-xl font-black text-on-surface">{compactCurrency(summary.natureTotals.Amortização)}</p>
              </div>
              <div className="p-4 bg-tertiary text-white rounded-xl border border-tertiary shadow-md shadow-tertiary/20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <p className="text-[11px] text-tertiary-fixed font-bold uppercase tracking-wider mb-2 relative z-10">Investimento</p>
                <p className="text-xl font-black relative z-10">{compactCurrency(summary.natureTotals.Investimentos)}</p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#e3f2fd] border border-[#bbdefb] mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#1976d2] text-white rounded-xl shadow-inner">
                  <span className="material-symbols-outlined text-2xl">trending_up</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1565c0] uppercase tracking-wider mb-1">Índice de Investimento</p>
                  <h4 className="text-3xl font-black text-[#0d47a1]">
                    {percent.format(investmentShare)}{" "}
                    <span className="text-sm font-semibold text-[#1976d2]/70 lowercase">da Receita Líquida</span>
                  </h4>
                </div>
              </div>
              <div className="w-24 h-16 opacity-30 hidden sm:block">
                <svg className="w-full h-full text-[#1976d2] stroke-current" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" viewBox="0 0 100 50">
                  <path d="M0 40 Q 20 40, 30 20 T 60 20 T 100 5"></path>
                </svg>
              </div>
            </div>

            <div className="space-y-6 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wide text-on-surface">
                  <span>Manutenção da Máquina ({share(summary.operating, summary.total)})</span>
                  <span className="text-outline">{compactCurrency(summary.operating)}</span>
                </div>
                <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-outline rounded-full transition-all duration-500"
                    style={{ width: `${summary.total > 0 ? (summary.operating / summary.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wide text-tertiary">
                  <span>Obras e Novos Projetos ({share(summary.investment, summary.total)})</span>
                  <span>{compactCurrency(summary.investment)}</span>
                </div>
                <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tertiary rounded-full shadow-[0_0_8px_rgba(0,93,167,0.5)] transition-all duration-500"
                    style={{ width: `${summary.total > 0 ? (summary.investment / summary.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm font-medium text-on-surface-variant italic border-l-4 border-tertiary/40 pl-4 py-1 mt-4">
                &quot;R$ {compactCurrency(summary.investment)} será investido diretamente em melhorias estruturais da cidade neste exercício.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* 4. Prioridades de Governo (Bento Grid) */}
        <h2 id="prioridades" className="text-2xl font-headline font-black mb-8 flex items-center gap-3 text-on-surface scroll-mt-24">
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined">dashboard_customize</span>
          </div>
          Prioridades de Governo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
          <div className="md:col-span-8 bg-surface border border-outline-variant/40 rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg text-on-surface">Alocação por Secretaria (Mapa de Valor)</h3>
              <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <button className="w-9 h-9 rounded-md bg-white shadow-sm flex items-center justify-center text-tertiary cursor-pointer">
                  <span className="material-symbols-outlined text-sm">grid_view</span>
                </button>
              </div>
            </div>

            <Treemap items={summary.organs} onSelectSecretariat={setSecretariat} />

            <div className="mt-6 p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-medium text-on-surface-variant flex items-start gap-3 shadow-sm">
              <span className="material-symbols-outlined text-tertiary mt-0.5">info</span>
              Nota: As 5 maiores Secretarias representam {percent.format(topFiveShare)} de toda a LOA, indicando forte concentração em áreas sociais e infraestrutura. Clique nas caixas acima para filtrar por secretaria específica.
            </div>
          </div>

          <div className="md:col-span-4 space-y-6">
            <div className="bg-surface border border-outline-variant/40 rounded-2xl p-7 shadow-sm">
              <h3 className="font-black text-lg mb-6 flex items-center gap-3 text-on-surface pb-4 border-b border-outline-variant/30">
                <div className="w-8 h-8 rounded-lg bg-[#fff8e1] flex items-center justify-center text-[#fbc02d]">
                  <span className="material-symbols-outlined text-lg">workspace_premium</span>
                </div>
                Top Rankings {year}
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-center font-black text-tertiary text-lg group-hover:bg-tertiary group-hover:text-white transition-colors">
                    1
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-0.5">Maior Programa</p>
                    <p className="text-sm font-bold text-on-surface group-hover:text-tertiary transition-colors">
                      {cleanBudgetLabel(topProgram?.label ?? "Não informado")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-center font-black text-tertiary text-lg group-hover:bg-tertiary group-hover:text-white transition-colors">
                    2
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-0.5">Maior Processo Administrativo</p>
                    <p className="text-sm font-bold text-on-surface group-hover:text-tertiary transition-colors">
                      {cleanBudgetLabel(topProcess?.label ?? "Não informado")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-center font-black text-tertiary text-lg group-hover:bg-tertiary group-hover:text-white transition-colors">
                    3
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-0.5">Maior Investimento</p>
                    <p className="text-sm font-bold text-on-surface group-hover:text-tertiary transition-colors">
                      {cleanBudgetLabel(topInvestment?.label ?? "Não informado")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-outline-variant/40 rounded-2xl p-7 shadow-sm">
              <h3 className="font-black text-lg mb-6 flex items-center gap-3 text-on-surface pb-4 border-b border-outline-variant/30">
                <div className="w-8 h-8 rounded-lg bg-[#fff8e1] flex items-center justify-center text-[#fbc02d]">
                  <span className="material-symbols-outlined text-lg">star</span>
                </div>
                Prioridades de Governo
              </h3>
              <div className="space-y-4">
                {priorities.map((item) => {
                  const pct = summary.total > 0 ? (item.value / summary.total) * 100 : 0;
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-on-surface">
                        <span>{item.label}</span>
                        <span className="text-outline">{compactCurrency(item.value)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#202124] text-white rounded-2xl p-7 shadow-xl relative overflow-hidden border border-white/10">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <span className="material-symbols-outlined text-[100px]">insights</span>
              </div>
              <div className="relative z-10">
                <h3 className="font-bold mb-6 text-xs text-white/50 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">summarize</span> Resumo Executivo
                </h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Custeio Real</p>
                    <p className="text-2xl font-black">{share(summary.operating, summary.total)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Investimento</p>
                    <p className="text-2xl font-black text-[#8ab4f8]">{share(summary.investment, summary.total)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Folha</p>
                    <p className="text-2xl font-black">{share(summary.natureTotals.Pessoal, summary.total)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#f28b82]/70 uppercase font-bold tracking-wider mb-1">Ponto Crítico</p>
                    <p className="text-xl font-bold text-[#f28b82] leading-tight">
                      {cleanBudgetLabel(summary.functions[0]?.label ?? "Previdência")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Insights Estratégicos (AI Analysis) */}
        <div id="insights" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 scroll-mt-24">
          <div className="lg:col-span-2 bg-surface rounded-2xl border border-outline-variant/40 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-outline-variant/30">
              <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <h2 className="text-2xl font-headline font-black text-on-surface">O que merece atenção (Análise IA)</h2>
            </div>
            <div className="space-y-4">
              <div className="flex gap-5 items-start p-5 bg-surface-container-lowest rounded-xl border border-outline-variant/40 hover:border-tertiary/30 transition-colors shadow-sm">
                <div className="mt-1 w-3 h-3 rounded-full bg-tertiary shrink-0 shadow-[0_0_8px_rgba(0,93,167,0.4)]"></div>
                <p className="text-sm font-medium leading-relaxed text-on-surface-variant">
                  {cleanBudgetLabel(summary.organs[0]?.label ?? "Saúde")} concentra{" "}
                  <span className="font-bold text-on-surface bg-tertiary/10 px-1.5 py-0.5 rounded">
                    {share(summary.organs[0]?.value ?? 0, summary.total)} do orçamento
                  </span>
                  , sendo o maior bloco administrativo do município neste exercício.
                </p>
              </div>

              <div className="flex gap-5 items-start p-5 bg-[#fff8e1] rounded-xl border border-[#ffecb3] hover:border-[#ffd54f] transition-colors shadow-sm">
                <div className="mt-1 w-3 h-3 rounded-full bg-[#fbc02d] shrink-0 shadow-[0_0_8px_rgba(251,192,45,0.4)]"></div>
                <p className="text-sm font-medium leading-relaxed text-[#795548]">
                  O maior programa geral é o <span className="font-bold text-[#3e2723] bg-[#ffecb3] px-1.5 py-0.5 rounded">{cleanBudgetLabel(topProgram?.label ?? "não informado")}</span>, com alocação total de {compactCurrency(topProgram?.value ?? 0)}.
                </p>
              </div>

              <div className="flex gap-5 items-start p-5 bg-[#e8f5e9] rounded-xl border border-[#c8e6c9] hover:border-[#a5d6a7] transition-colors shadow-sm">
                <div className="mt-1 w-3 h-3 rounded-full bg-[#43a047] shrink-0 shadow-[0_0_8px_rgba(67,160,71,0.4)]"></div>
                <p className="text-sm font-medium leading-relaxed text-[#1b5e20]">
                  Investimentos somam <span className="font-bold text-[#1b5e20] bg-[#c8e6c9] px-1.5 py-0.5 rounded">{compactCurrency(summary.investment)}</span>, o equivalente a {share(summary.investment, summary.total)} da LOA total.
                </p>
              </div>

              <div className="flex gap-5 items-start p-5 bg-[#ffebee] rounded-xl border border-[#ffcdd2] hover:border-[#ef9a9a] transition-colors shadow-sm">
                <div className="mt-1 w-3 h-3 rounded-full bg-[#e53935] shrink-0 shadow-[0_0_8px_rgba(229,57,53,0.4)]"></div>
                <p className="text-sm font-medium leading-relaxed text-[#b71c1c]">
                  <span className="font-black uppercase tracking-wider text-xs bg-[#ffcdd2] px-2 py-1 rounded mr-1">Atenção Crítica</span>
                  Recomendado acompanhar a dotação de {cleanBudgetLabel(summary.functions[0]?.label ?? "Previdência")} por representar o maior bloco funcional de custos.
                </p>
              </div>
            </div>
          </div>

          {/* 6. Pergunte ao Orçamento (Interactivity) */}
          <div id="pergunte" className="bg-gradient-to-b from-surface-container-low to-surface-container rounded-2xl p-8 shadow-inner flex flex-col border border-outline-variant/50 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined">forum</span>
              </div>
              <h2 className="text-2xl font-headline font-black text-on-surface">Pergunte ao Orçamento</h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 font-medium">Acesso rápido aos dados consolidados para tomadas de decisão imediatas.</p>

            <div className="space-y-3 flex-1">
              {[
                "Quanto será investido em Saúde?",
                "Qual secretaria recebe mais recursos?",
                "Quanto será investido em obras?",
                "Quanto vai para Educação?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => askQuestion(q)}
                  className="w-full text-left p-4 bg-white border border-outline-variant/30 hover:border-tertiary hover:shadow-md transition-all rounded-xl text-sm font-bold flex justify-between items-center group text-on-surface cursor-pointer"
                >
                  {q}
                  <span className="material-symbols-outlined text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    arrow_forward
                  </span>
                </button>
              ))}
            </div>

            {/* Answer Display */}
            {(isTyping || answerText) && (
              <div className="mt-6 p-4 rounded-xl bg-white border border-outline-variant/30 shadow-sm transition-all duration-300">
                {isTyping ? (
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
                    <span className="animate-pulse">Analisando dotações da LOA...</span>
                  </div>
                ) : (
                  <p
                    className="text-sm text-on-surface-variant font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: answerText
                        ? answerText
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-on-surface font-extrabold">$1</strong>')
                        : "",
                    }}
                  ></p>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-outline-variant/40">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (questionText.trim()) {
                    askQuestion(questionText);
                  }
                }}
                className="relative"
              >
                <input
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-white border-2 border-outline-variant/30 rounded-xl px-5 py-4 text-sm pr-14 focus:ring-0 focus:border-tertiary shadow-sm outline-none transition-colors placeholder:text-outline font-medium"
                  placeholder="Digite sua pergunta..."
                  type="text"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-tertiary text-white rounded-lg flex items-center justify-center hover:bg-[#004e8c] transition-colors shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 7. Indicadores Estratégicos (Bottom Summary) */}
        <div className="bg-white rounded-2xl p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 border border-outline-variant/40 shadow-sm">
          <div className="text-center md:text-left group cursor-default">
            <p className="text-[11px] font-bold uppercase text-outline tracking-wider mb-2">Concentração Orçamentária</p>
            <div className="flex items-end justify-center md:justify-start gap-3 mb-1">
              <span className="text-4xl font-black text-on-surface group-hover:text-tertiary transition-colors">{percent.format(topFiveShare)}</span>
              <span className="text-sm text-error font-bold bg-error/10 px-2 py-0.5 rounded-md mb-1">-2% vs 23</span>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">Dependência Top 5 Secretarias</p>
          </div>

          <div className="text-center md:text-left lg:border-l lg:border-outline-variant/30 lg:pl-10 group cursor-default">
            <p className="text-[11px] font-bold uppercase text-outline tracking-wider mb-2">Índice de Investimento</p>
            <div className="flex items-end justify-center md:justify-start gap-3 mb-1">
              <span className="text-4xl font-black text-on-surface group-hover:text-tertiary transition-colors">{percent.format(investmentShare)}</span>
              <span className="text-sm text-[#137333] font-bold bg-[#e6f4ea] px-2 py-0.5 rounded-md mb-1">+5% meta</span>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">Percentual da Receita Corrente Líquida</p>
          </div>

          <div className="text-center md:text-left lg:border-l lg:border-outline-variant/30 lg:pl-10 group cursor-default">
            <p className="text-[11px] font-bold uppercase text-outline tracking-wider mb-2">Receita Própria</p>
            <div className="flex items-end justify-center md:justify-start gap-3 mb-1">
              <span className="text-4xl font-black text-on-surface group-hover:text-tertiary transition-colors">{share(ownRevenue, summary.total)}</span>
              <span className="text-sm text-tertiary font-bold bg-tertiary/10 px-2 py-0.5 rounded-md mb-1">Estável</span>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">Capacidade de Arrecadação Direta</p>
          </div>

          <div className="text-center md:text-left lg:border-l lg:border-outline-variant/30 lg:pl-10 group cursor-default">
            <p className="text-[11px] font-bold uppercase text-outline tracking-wider mb-2">Dependência Externa</p>
            <div className="flex items-end justify-center md:justify-start gap-3 mb-1">
              <span className="text-4xl font-black text-on-surface group-hover:text-tertiary transition-colors">{share(transfers, summary.total)}</span>
              <span className="text-sm text-[#b06000] font-bold bg-[#fef7e0] px-2 py-0.5 rounded-md mb-1">Atenção</span>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">Fundo Participação e Repasses</p>
          </div>
        </div>
      </main>
    </div>
  );
}
