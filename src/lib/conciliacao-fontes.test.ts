import { describe, expect, it } from "vitest";
import {
  derivarFa,
  derivarUg,
  derivarConf,
  montarConciliacao,
  type ItemDespesaConciliacao,
  type LinhaCadastrada,
} from "./conciliacao-fontes";

const item = (over: Partial<ItemDespesaConciliacao> = {}): ItemDespesaConciliacao => ({
  secretaria: "11 - SECRETARIA DE SERVIÇOS E OBRAS",
  fonteVinculo: "01",
  codigoAplicacao: "110.0000",
  valLoa: 0,
  ...over,
});

const cadastro = (conf: string, receita: number, bloco: number, ordem: number): LinhaCadastrada => {
  const [ug, ...resto] = conf.split(".");
  return { ug, fa: resto.join("."), conf, receita, bloco, ordem };
};

describe("derivarUg", () => {
  it("usa o código da secretaria para separar as entidades da Prefeitura", () => {
    expect(derivarUg("01- CMO")).toBe("CMO");
    expect(derivarUg("22 - FITO")).toBe("FITO");
    expect(derivarUg("21 - IPMO")).toBe("IPMO");
    expect(derivarUg("11 - SECRETARIA DE SERVIÇOS E OBRAS")).toBe("PMO");
  });

  it("trata o IPMO-RC (77) como IPMO, que é como a planilha de conciliação agrupa", () => {
    expect(derivarUg("77 - IPMO - RC")).toBe("IPMO");
  });

  it("cai em PMO quando a secretaria não tem código numérico", () => {
    expect(derivarUg("SECRETARIA SEM CÓDIGO")).toBe("PMO");
    expect(derivarUg("")).toBe("PMO");
  });
});

describe("derivarFa", () => {
  it("concatena fonte e código de aplicação no formato da planilha", () => {
    expect(derivarFa("01", "110.0000")).toBe("01.110.0000");
    expect(derivarFa("04", "603.0000")).toBe("04.603.0000");
  });

  it("completa a fonte com zero à esquerda", () => {
    expect(derivarFa("1", "110.0000")).toBe("01.110.0000");
  });

  it("aceita a fonte já informada por inteiro", () => {
    expect(derivarFa("01.110.0000", "")).toBe("01.110.0000");
  });

  it("sem código de aplicação, devolve só a fonte — a F.A não é determinável", () => {
    expect(derivarFa("01", "")).toBe("01");
    expect(derivarFa("01", undefined)).toBe("01");
  });

  it("usa 01 como fonte padrão quando ela vem vazia, como o resto do painel faz", () => {
    expect(derivarFa("", "110.0000")).toBe("01.110.0000");
  });
});

describe("derivarConf", () => {
  it("monta a chave no formato UG.F.A", () => {
    expect(derivarConf(item())).toBe("PMO.01.110.0000");
    expect(derivarConf(item({ secretaria: "01- CMO" }))).toBe("CMO.01.110.0000");
  });
});

describe("montarConciliacao", () => {
  it("soma a despesa por CONF e calcula a diferença contra a receita cadastrada", () => {
    const linhas = [cadastro("PMO.01.110.0000", 1_000, 1, 1)];
    const itens = [
      item({ valLoa: 300 }),
      item({ valLoa: 200 }),
    ];

    const { blocos } = montarConciliacao(itens, linhas);

    expect(blocos[0].linhas[0]).toMatchObject({
      conf: "PMO.01.110.0000",
      receita: 1_000,
      despesa: 500,
      diferenca: 500,
      cadastrada: true,
    });
  });

  it("inclui reajuste e aditamento na despesa", () => {
    const linhas = [cadastro("PMO.01.110.0000", 0, 1, 1)];
    const itens = [item({ valLoa: 100, valorReajuste: 10, valorAditamento: 5 })];

    const { blocos } = montarConciliacao(itens, linhas);

    expect(blocos[0].linhas[0].despesa).toBe(115);
  });

  it("no cenário SF usa a sugestão no lugar da composição oficial", () => {
    const linhas = [cadastro("PMO.01.110.0000", 0, 1, 1)];
    const itens = [item({ valLoa: 100, valorAditamento: 20, valorSugestaoSf: 70 })];

    expect(montarConciliacao(itens, linhas, "oficial").blocos[0].linhas[0].despesa).toBe(120);
    expect(montarConciliacao(itens, linhas, "sf").blocos[0].linhas[0].despesa).toBe(70);
  });

  it("mantém as linhas cadastradas sem despesa, preservando a ordem do cadastro", () => {
    const linhas = [
      cadastro("PMO.01.110.0000", 100, 1, 1),
      cadastro("PMO.01.111.0000", 50, 1, 2),
    ];

    const { blocos } = montarConciliacao([], linhas);

    expect(blocos[0].linhas.map((l) => l.conf)).toEqual(["PMO.01.110.0000", "PMO.01.111.0000"]);
    expect(blocos[0].linhas[1]).toMatchObject({ receita: 50, despesa: 0, diferenca: 50 });
  });

  it("subtotaliza DIFERENÇAS por bloco, e não por entidade", () => {
    // Reproduz o bloco em que o duodécimo da Câmara aparece sob a UG CMO,
    // enquanto a receita que o cobre está numa F.A da PMO.
    const linhas = [
      cadastro("PMO.08.804.0000", 20_595_000, 2, 1),
      cadastro("CMO.01.110.0000", 0, 2, 2),
    ];
    const itens = [
      item({ secretaria: "04 - SECRETARIA DE FINANÇAS", fonteVinculo: "08", codigoAplicacao: "804.0000", valLoa: 20_595_000 }),
      item({ secretaria: "01- CMO", valLoa: 148_065_765 }),
    ];

    const { blocos } = montarConciliacao(itens, linhas);

    expect(blocos[0].diferencas).toBe(-148_065_765);
    expect(blocos[0].linhas[0].diferenca).toBe(0);
    expect(blocos[0].linhas[1].diferenca).toBe(-148_065_765);
  });

  it("agrupa a despesa sem F.A cadastrada num bloco próprio no fim", () => {
    const linhas = [cadastro("PMO.01.110.0000", 100, 1, 1)];
    const itens = [
      item({ valLoa: 40 }),
      item({ codigoAplicacao: "999.9999", valLoa: 7 }),
    ];

    const { blocos, naoCadastradas } = montarConciliacao(itens, linhas);

    expect(naoCadastradas).toHaveLength(1);
    expect(naoCadastradas[0]).toMatchObject({ conf: "PMO.01.999.9999", despesa: 7, receita: 0, cadastrada: false });
    // O bloco extra vem depois de todos os cadastrados.
    expect(blocos[blocos.length - 1].bloco).toBeGreaterThan(1);
    expect(blocos[blocos.length - 1].linhas[0].conf).toBe("PMO.01.999.9999");
  });

  it("não perde despesa: o total confere com a soma dos itens", () => {
    const linhas = [cadastro("PMO.01.110.0000", 0, 1, 1)];
    const itens = [
      item({ valLoa: 40 }),
      item({ codigoAplicacao: "999.9999", valLoa: 7 }),
      item({ secretaria: "22 - FITO", valLoa: 3 }),
    ];

    const { totais } = montarConciliacao(itens, linhas);

    expect(totais.despesa).toBe(50);
  });

  it("totaliza receita e diferença do quadro inteiro", () => {
    const linhas = [
      cadastro("PMO.01.110.0000", 1_000, 1, 1),
      cadastro("PMO.01.200.0000", 500, 2, 1),
    ];
    const itens = [item({ valLoa: 200 }), item({ codigoAplicacao: "200.0000", valLoa: 900 })];

    const { totais } = montarConciliacao(itens, linhas);

    expect(totais.receita).toBe(1_500);
    expect(totais.despesa).toBe(1_100);
    expect(totais.diferenca).toBe(400);
  });

  it("soma em centavos para não acumular erro de ponto flutuante", () => {
    const linhas = [cadastro("PMO.01.110.0000", 0, 1, 1)];
    const itens = [item({ valLoa: 0.1 }), item({ valLoa: 0.2 })];

    expect(montarConciliacao(itens, linhas).blocos[0].linhas[0].despesa).toBe(0.3);
  });
});
