// Quadro de conciliação Receita x Despesa por UG + Fonte de Acompanhamento (a planilha "BATE FONTE").
//
// A RECEITA, a ordem das linhas e o agrupamento em blocos vêm cadastrados (tabela ConciliacaoFonte):
// os blocos são editoriais — juntam fontes que se cobrem entre si, como o duodécimo da Câmara, que
// aparece como despesa da CMO mas é custeado por uma fonte da Prefeitura — e não se deduzem dos dados.
//
// A DESPESA é somada ao vivo a partir dos itens da Análise LOA, por isso este módulo é puro: recebe os
// itens já em memória e devolve o quadro pronto, sem tocar no banco.
import { calculateAnalyticalValues, type AnalyticalFinancialInput, type BudgetScenario } from "@/lib/loa-analytical-values";

export interface LinhaCadastrada {
  ug: string;
  fa: string;
  conf: string;
  receita: number;
  bloco: number;
  ordem: number;
}

export interface ItemDespesaConciliacao extends AnalyticalFinancialInput {
  secretaria: string;
  fonteVinculo?: string;
  codigoAplicacao?: string;
}

export interface LinhaConciliacao {
  ug: string;
  fa: string;
  conf: string;
  receita: number;
  despesa: number;
  diferenca: number;
  /** false quando a despesa caiu numa F.A que não está na planilha cadastrada. */
  cadastrada: boolean;
}

export interface BlocoConciliacao {
  bloco: number;
  linhas: LinhaConciliacao[];
  /** Subtotal do bloco: é a coluna DIFERENÇAS da planilha. */
  diferencas: number;
}

export interface Conciliacao {
  blocos: BlocoConciliacao[];
  /** Linhas com despesa cuja F.A não está cadastrada; também compõem o último bloco. */
  naoCadastradas: LinhaConciliacao[];
  totais: { receita: number; despesa: number; diferenca: number };
}

/** Entidades que a planilha separa da Prefeitura, pelo código que abre o nome da secretaria. */
const UG_POR_CODIGO: Record<string, string> = {
  "01": "CMO",
  "21": "IPMO",
  "22": "FITO",
  // O IPMO-RC tem código próprio na base, mas a conciliação o soma dentro do IPMO.
  "77": "IPMO",
};

export function derivarUg(secretaria: string): string {
  const codigo = String(secretaria ?? "").trim().match(/^(\d+)\s*-/)?.[1]?.padStart(2, "0");
  return (codigo && UG_POR_CODIGO[codigo]) || "PMO";
}

/**
 * Monta a Fonte de Acompanhamento no formato NN.NNN.NNNN a partir da fonte e do código de aplicação.
 * Sem código de aplicação a F.A não é determinável: devolve só a fonte, e a linha acaba destacada
 * como não cadastrada — que é exatamente o aviso de que falta preencher o código naquela dotação.
 */
export function derivarFa(fonteVinculo?: string, codigoAplicacao?: string): string {
  const fonte = String(fonteVinculo ?? "").trim() || "01";
  // A fonte pode vir já completa ("01.110.0000") quando a dotação foi cadastrada assim.
  if (/^\d{2}\.\d{3}\.\d{4}$/.test(fonte)) return fonte;

  const aplicacao = String(codigoAplicacao ?? "").trim();
  const raiz = fonte.padStart(2, "0");
  return aplicacao ? `${raiz}.${aplicacao}` : raiz;
}

export function derivarConf(item: ItemDespesaConciliacao): string {
  return `${derivarUg(item.secretaria)}.${derivarFa(item.fonteVinculo, item.codigoAplicacao)}`;
}

/** Os valores do orçamento são somados em centavos: somar reais acumula erro de ponto flutuante. */
const emCentavos = (valor: number) => Math.round(valor * 100);
const emReais = (centavos: number) => centavos / 100;

export function montarConciliacao(
  itens: ItemDespesaConciliacao[],
  cadastradas: LinhaCadastrada[],
  scenario: BudgetScenario = "oficial"
): Conciliacao {
  const despesaPorConf = new Map<string, number>();
  for (const item of itens) {
    const conf = derivarConf(item);
    const valor = emCentavos(calculateAnalyticalValues(item, scenario).loa2027);
    despesaPorConf.set(conf, (despesaPorConf.get(conf) ?? 0) + valor);
  }

  const ordenadas = [...cadastradas].sort((a, b) => a.bloco - b.bloco || a.ordem - b.ordem);
  const blocos: BlocoConciliacao[] = [];
  const confsCadastradas = new Set<string>();

  for (const cadastrada of ordenadas) {
    confsCadastradas.add(cadastrada.conf);
    const receita = emCentavos(cadastrada.receita);
    const despesa = despesaPorConf.get(cadastrada.conf) ?? 0;
    const linha: LinhaConciliacao = {
      ug: cadastrada.ug,
      fa: cadastrada.fa,
      conf: cadastrada.conf,
      receita: emReais(receita),
      despesa: emReais(despesa),
      diferenca: emReais(receita - despesa),
      cadastrada: true,
    };

    const atual = blocos[blocos.length - 1];
    if (atual && atual.bloco === cadastrada.bloco) atual.linhas.push(linha);
    else blocos.push({ bloco: cadastrada.bloco, linhas: [linha], diferencas: 0 });
  }

  // Despesa em F.A fora do cadastro não pode sumir do quadro, senão os totais deixam de fechar.
  const naoCadastradas: LinhaConciliacao[] = [...despesaPorConf.entries()]
    .filter(([conf]) => !confsCadastradas.has(conf))
    .map(([conf, despesa]) => {
      const [ug, ...resto] = conf.split(".");
      return {
        ug,
        fa: resto.join("."),
        conf,
        receita: 0,
        despesa: emReais(despesa),
        diferenca: emReais(-despesa),
        cadastrada: false,
      };
    })
    .sort((a, b) => a.conf.localeCompare(b.conf, "pt-BR"));

  if (naoCadastradas.length > 0) {
    const ultimoBloco = blocos.length > 0 ? blocos[blocos.length - 1].bloco : 0;
    blocos.push({ bloco: ultimoBloco + 1, linhas: naoCadastradas, diferencas: 0 });
  }

  for (const bloco of blocos) {
    bloco.diferencas = emReais(bloco.linhas.reduce((soma, l) => soma + emCentavos(l.diferenca), 0));
  }

  const totais = blocos.reduce(
    (acc, bloco) => {
      for (const linha of bloco.linhas) {
        acc.receita += emCentavos(linha.receita);
        acc.despesa += emCentavos(linha.despesa);
      }
      return acc;
    },
    { receita: 0, despesa: 0 }
  );

  return {
    blocos,
    naoCadastradas,
    totais: {
      receita: emReais(totais.receita),
      despesa: emReais(totais.despesa),
      diferenca: emReais(totais.receita - totais.despesa),
    },
  };
}
