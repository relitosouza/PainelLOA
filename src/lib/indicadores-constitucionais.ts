// Índices constitucionais mínimos (CF art. 198 §2º III: Saúde 15%; art. 212: Educação 25%)
// e emendas impositivas (CF art. 166 §9º, por simetria na Lei Orgânica do Município).

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Impostos e transferências constitucionais da LoaReceita que formam a base dos índices (campo naturezaReceita). */
export const IMPOSTOS_BASE_INDICES = ["ISSQN", "IPTU", "ITBI", "IRRF", "ICMS", "IPVA", "IPI", "FPM"] as const;

export const VINCULO_SAUDE = "01.310.0000";
export const VINCULO_EDUCACAO = "01.200.0000";

export type ReceitaLoaLinha = {
  naturezaReceita: string;
  fonteRecurso: string;
  valor: number;
};

export type IndiceConstitucional = {
  percentual: number;
  /** Quanto deve ser deduzido da receita base para a área (base × percentual). */
  minimo: number;
  /** Quanto a receita LOA já destina ao vínculo da área. */
  vinculadoReceita: number;
  /** Valor efetivamente aplicado na proposta LOA; null enquanto não houver a despesa por fonte de recurso. */
  aplicado: number | null;
};

export function calcularIndicesConstitucionais(receitas: ReceitaLoaLinha[]) {
  const porImposto = IMPOSTOS_BASE_INDICES.map((imposto) => {
    // As linhas positivas trazem o valor bruto; as retenções do Fundeb vêm em linhas próprias ("Fundeb - ICMS" etc.).
    const linhas = receitas.filter((r) => r.naturezaReceita === imposto && r.valor > 0);
    const somaVinculo = (vinculo: string) => linhas.filter((r) => r.fonteRecurso === vinculo).reduce((sum, r) => sum + r.valor, 0);
    return {
      imposto,
      valor: round2(linhas.reduce((sum, r) => sum + r.valor, 0)),
      saude: round2(somaVinculo(VINCULO_SAUDE)),
      educacao: round2(somaVinculo(VINCULO_EDUCACAO)),
    };
  });

  const base = round2(porImposto.reduce((sum, item) => sum + item.valor, 0));
  const retencaoFundeb = round2(Math.abs(
    receitas.filter((r) => /^fundeb\s*-/i.test(r.naturezaReceita)).reduce((sum, r) => sum + r.valor, 0),
  ));

  const saude: IndiceConstitucional = {
    percentual: 0.15,
    minimo: round2(base * 0.15),
    vinculadoReceita: round2(porImposto.reduce((sum, item) => sum + item.saude, 0)),
    aplicado: null,
  };
  const educacao: IndiceConstitucional & { retencaoFundeb: number } = {
    percentual: 0.25,
    minimo: round2(base * 0.25),
    vinculadoReceita: round2(porImposto.reduce((sum, item) => sum + item.educacao, 0)),
    retencaoFundeb,
    aplicado: null,
  };

  return { base, porImposto, saude, educacao };
}

export type ParametrosEmendas = {
  /** Receita Corrente Líquida de referência. */
  rcl: number;
  /** Percentual da RCL destinado às emendas (ex.: 0.012 = 1,2%). */
  aliquota: number;
  vereadores: number;
  /** Parcela mínima das emendas destinada à Saúde (CF art. 166 §9º: metade). */
  percentualSaude: number;
};

/** Parâmetros informados pela SF para a LOA 2027. */
export const EMENDAS_IMPOSITIVAS_2027: ParametrosEmendas = {
  rcl: 4_909_918_731.48,
  aliquota: 0.012,
  vereadores: 21,
  percentualSaude: 0.5,
};

export function calcularEmendasImpositivas({ rcl, aliquota, vereadores, percentualSaude }: ParametrosEmendas) {
  const totalMinimo = round2(rcl * aliquota);
  const saudeMinimoTotal = round2(totalMinimo * percentualSaude);
  return {
    vereadores,
    totalMinimo,
    cotaPorVereador: round2(totalMinimo / vereadores),
    saudeMinimoTotal,
    saudeMinimoPorVereador: round2(saudeMinimoTotal / vereadores),
  };
}
