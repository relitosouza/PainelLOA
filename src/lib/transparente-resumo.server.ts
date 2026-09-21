import { loadAnaliseLoaItems } from "@/lib/loa-analise-items.server";
import { calculateAnalyticalValues, getSecretariatCode } from "@/lib/loa-analytical-values";
import { AREAS_TRANSPARENTE } from "@/lib/transparente-areas";

export type ResumoSecretaria = {
  codigo: string;
  nome: string;
  valor: number;
  percentual: number;
};

export type ResumoArea = {
  key: string;
  valor: number;
  percentual: number;
};

export type ResumoInvestimento = {
  titulo: string;
  secretaria: string;
  valor: number;
};

export type TransparenteResumo = {
  total: number;
  totalInvestimentos: number;
  totalSecretarias: number;
  porSecretaria: ResumoSecretaria[];
  porArea: ResumoArea[];
  topInvestimentos: ResumoInvestimento[];
  atualizadoEm: string;
};

/** Investimentos e inversões financeiras, mesma regra da Análise LOA. */
function isInvestimento(natureza: string) {
  const nat = natureza.trim();
  return nat.startsWith("4.4") || nat.startsWith("4.5");
}

/** "1.009 - Urbanização de Favelas" → "Urbanização de Favelas". */
function rotuloPublico(acao: string) {
  return acao.replace(/^[\d.]+\s*-\s*/, "").trim();
}

/**
 * Consolida a LOA 2027 para a página pública a partir da mesma base da
 * Análise LOA, de modo que o total divulgado seja idêntico ao do relatório
 * analítico: vigente + reajuste + aditamento + Ajuste SF + Corte GP.
 */
export async function getTransparenteResumo(): Promise<TransparenteResumo> {
  const items = await loadAnaliseLoaItems();

  let total = 0;
  let totalInvestimentos = 0;
  const porSecretaria = new Map<string, { nome: string; valor: number }>();
  // Uma mesma ação pode aparecer em várias dotações (subelementos/vínculos distintos);
  // no ranking público elas são consolidadas para não repetir a mesma obra.
  const investimentos = new Map<string, ResumoInvestimento>();

  for (const item of items) {
    const valores = calculateAnalyticalValues(item);
    const valor = valores.loa2027 + valores.sugestaoSf + valores.corteGp;
    if (valor === 0) continue;

    total += valor;

    const nome = item.secretaria || "Não Identificado";
    const codigo = getSecretariatCode(nome) || nome;
    const atual = porSecretaria.get(codigo) ?? { nome, valor: 0 };
    atual.valor += valor;
    porSecretaria.set(codigo, atual);

    if (isInvestimento(item.natureza)) {
      totalInvestimentos += valor;
      if (valor > 0) {
        const titulo = rotuloPublico(item.acao) || "Investimento";
        const chave = `${codigo}|${titulo}`;
        const atualInv = investimentos.get(chave) ?? { titulo, secretaria: nome, valor: 0 };
        atualInv.valor += valor;
        investimentos.set(chave, atualInv);
      }
    }
  }

  const secretarias: ResumoSecretaria[] = [...porSecretaria.entries()]
    .map(([codigo, { nome, valor }]) => ({
      codigo,
      nome,
      valor: Number(valor.toFixed(2)),
      percentual: total > 0 ? (valor / total) * 100 : 0,
    }))
    .sort((left, right) => right.valor - left.valor);

  const valorPorCodigo = new Map(secretarias.map((sec) => [sec.codigo, sec.valor]));
  const porArea: ResumoArea[] = AREAS_TRANSPARENTE.map((area) => {
    const valor = area.codigos.reduce((soma, codigo) => soma + (valorPorCodigo.get(codigo) ?? 0), 0);
    return { key: area.key, valor, percentual: total > 0 ? (valor / total) * 100 : 0 };
  });

  return {
    total: Number(total.toFixed(2)),
    totalInvestimentos: Number(totalInvestimentos.toFixed(2)),
    totalSecretarias: secretarias.length,
    porSecretaria: secretarias,
    porArea,
    topInvestimentos: [...investimentos.values()]
      .sort((left, right) => right.valor - left.valor)
      .slice(0, 5)
      .map((inv) => ({ ...inv, valor: Number(inv.valor.toFixed(2)) })),
    atualizadoEm: new Date().toISOString(),
  };
}
