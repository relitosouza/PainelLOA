import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AgentRequest = {
  question?: unknown;
  importId?: unknown;
  exercise?: unknown;
};

type Intent = "loa" | "secretarias" | "programas" | "funcoes" | "despesas" | "importacao" | "receita" | "qualidade";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function inferIntent(question: string): Intent {
  const text = normalize(question);
  if (/(qualidade|incompativ|incompatív|classificacao|classificação|catalogo|catálogo|alerta)/.test(text)) return "qualidade";
  if (/(secretaria|orgao|órgao|maiores despesas|maior despesa)/.test(text)) return "secretarias";
  if (text.includes("programa")) return "programas";
  if (/(funcao|função)/.test(text)) return "funcoes";
  if (/(operacional|investimento|composicao da despesa|composição da despesa)/.test(text)) return "despesas";
  if (/(importacao|importação|arquivo selecionado|qual exercicio|qual exercício)/.test(text)) return "importacao";
  if (/(receita|arrecad|ldo|historico|histórico)/.test(text)) return "receita";
  return "loa";
}

function getGroupLabel(intent: Intent, question: string) {
  const text = normalize(question);
  if (intent === "secretarias") return "secretarias (órgãos)";
  if (intent === "programas") return "programas";
  if (intent === "funcoes") return "funções";
  if (text.includes("programa")) return "programas";
  if (text.includes("funcao")) return "funções";
  return "despesas LOA";
}

async function readJson(url: URL) {
  const response = await fetch(url, { cache: "no-store" });
  const body = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(body.message ?? body.error ?? "Consulta indisponível."));
  return body;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AgentRequest;
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (question.length < 3) {
      return NextResponse.json({ message: "Digite uma pergunta com pelo menos 3 caracteres." }, { status: 400 });
    }
    if (question.length > 500) {
      return NextResponse.json({ message: "A pergunta deve ter no máximo 500 caracteres." }, { status: 400 });
    }

    const intent = inferIntent(question);
    const baseUrl = new URL(request.url);
    const loaUrl = new URL("/api/loa", baseUrl);
    loaUrl.searchParams.set("pageSize", "10");
    if (typeof body.importId === "string" && body.importId) loaUrl.searchParams.set("importId", body.importId);

    const analysisUrl = new URL("/api/analises-combinadas", baseUrl);
    if (typeof body.exercise === "number" || typeof body.exercise === "string") {
      const exercise = Number(body.exercise);
      if (Number.isInteger(exercise)) analysisUrl.searchParams.set("exercicio", String(exercise));
    }

    const data = intent === "receita" ? await readJson(analysisUrl) : await readJson(loaUrl);
    const totals = (data.totals ?? {}) as Record<string, unknown>;
    const groups = (data.groups ?? {}) as Record<string, Array<Record<string, unknown>>>;
    const quality = (data.quality ?? {}) as Record<string, unknown>;
    const selection = (data.selection ?? {}) as Record<string, unknown>;
    let answer = "";
    let details: Array<{ label: string; value: string }> = [];

    if (["secretarias", "programas", "funcoes"].includes(intent)) {
      const groupKey = intent === "secretarias" ? "organ" : intent === "programas" ? "program" : "functionName";
      const rows = groups[groupKey] ?? [];
      answer = rows.length
        ? `Os maiores valores estão concentrados nos seguintes ${getGroupLabel(intent, question)}:`
        : `Não encontrei dados agrupados por ${getGroupLabel(intent, question)} para os filtros selecionados.`;
      details = rows.slice(0, 5).map((row, index) => ({
        label: `${index + 1}. ${String(row.label ?? "Órgão não informado")}`,
        value: formatCurrency(Number(row.value ?? 0)),
      }));
    } else if (intent === "qualidade") {
      const totalRecords = Number(quality.totalRecords ?? 0);
      const warningRecords = Number(quality.warningRecords ?? 0);
      const coverage = Number(quality.coverage ?? 0) * 100;
      answer = totalRecords
        ? `A consulta encontrou ${totalRecords.toLocaleString("pt-BR")} registros. ${warningRecords.toLocaleString("pt-BR")} possuem algum alerta de classificação.`
        : "Não encontrei dados de qualidade para a importação selecionada.";
      details = [
        { label: "Cobertura válida", value: `${coverage.toFixed(1).replace(".", ",")}%` },
        { label: "Valor com alerta", value: formatCurrency(Number(quality.warningValue ?? 0)) },
        { label: "Subelementos sem correspondência", value: Number(quality.unmatchedSubelements ?? 0).toLocaleString("pt-BR") },
      ];
    } else if (intent === "receita") {
      answer = "Resumo das bases de receita disponíveis para o exercício informado:";
      details = [
        { label: "Receita LDO", value: formatCurrency(Number(totals.totalReceitaLdo ?? 0)) },
        { label: "Receita arrecadada", value: formatCurrency(Number(totals.totalReceitaArrecadada ?? 0)) },
        { label: "Anos de arrecadação", value: String(totals.qtdAnosArrecadacao ?? 0) },
      ];
    } else if (intent === "despesas") {
      answer = "Composição das despesas da importação selecionada:";
      details = [
        { label: "Despesas operacionais", value: formatCurrency(Number((data.spending && (data.spending as Record<string, unknown>).operating) ?? 0)) },
        { label: "Investimentos", value: formatCurrency(Number((data.spending && (data.spending as Record<string, unknown>).investment) ?? 0)) },
        { label: "Valor filtrado", value: formatCurrency(Number(totals.filtered ?? 0)) },
      ];
    } else if (intent === "importacao") {
      const selectedImport = (data.imports as Array<Record<string, unknown>> | undefined)?.find((item) => item.id === selection.importId);
      answer = selectedImport
        ? "Esta é a importação atualmente usada como contexto da consulta:"
        : "Não há uma importação LOA disponível para consulta.";
      details = selectedImport
        ? [
            { label: "Arquivo", value: String(selectedImport.fileName ?? "Não informado") },
            { label: "Exercício", value: String(selectedImport.exercise ?? "Não informado") },
            { label: "Registros", value: Number(selectedImport.recordCount ?? 0).toLocaleString("pt-BR") },
            { label: "Identificador", value: String(selectedImport.id ?? "Não informado") },
          ]
        : [];
    } else {
      const groupKey = normalize(question).includes("programa") ? "program" : normalize(question).includes("funcao") ? "functionName" : "organ";
      const rows = groups[groupKey] ?? [];
      answer = "Resumo da LOA para a importação selecionada:";
      details = [
        { label: "Valor total da LOA", value: formatCurrency(Number(totals.loa ?? 0)) },
        { label: "Valor filtrado", value: formatCurrency(Number(totals.filtered ?? 0)) },
        { label: "Registros", value: Number((data.pagination && (data.pagination as Record<string, unknown>).total) ?? 0).toLocaleString("pt-BR") },
        ...(rows.length ? [{ label: `Maior grupo (${getGroupLabel(intent, question)})`, value: String(rows[0].label ?? "Não informado") }] : []),
      ];
    }

    return NextResponse.json({
      mode: "prototype-readonly",
      intent,
      answer,
      details,
      filters: {
        importId: selection.importId ?? (typeof body.importId === "string" ? body.importId : null),
        exercise: selection.exercise ?? (typeof body.exercise === "number" ? body.exercise : null),
      },
      sources: intent === "receita" ? ["/api/analises-combinadas"] : ["/api/loa"],
      warnings: ["Protótipo somente leitura: os resultados foram consultados nas APIs atuais, sem alteração de dados."],
    });
  } catch (error) {
    console.error("Erro no assistente de análise:", error);
    return NextResponse.json({ message: "Não foi possível consultar os dados para essa pergunta." }, { status: 500 });
  }
}
