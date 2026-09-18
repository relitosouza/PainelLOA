import { describe, expect, it } from "vitest";
import { converterIdVinculo, migrarIdsNoValor } from "./migracao-ids-vinculos";

const antigo = (sec: string, fonte = "90.39") => `${sec}|2.010 - Ação|3.3.90.39.00 - SERVIÇOS|${fonte}||PA 1|SUB`;

describe("converterIdVinculo", () => {
  it("aplica o código de aplicação pela secretaria", () => {
    expect(converterIdVinculo(antigo("09 - SECRETARIA DA SAÚDE"))).toBe("09 - SECRETARIA DA SAÚDE|2.010 - Ação|3.3.90.39.00 - SERVIÇOS|01|310.0000|PA 1|SUB");
    expect(converterIdVinculo(antigo("08 - SECRETARIA DE EDUCAÇÃO"))).toContain("|01|200.0000|");
    expect(converterIdVinculo(antigo("18 - ENCARGOS/FINANÇAS", "Confirmar com a Dani"))).toContain("|01|110.0000|");
  });

  it("não mexe em IDs já no formato novo, de despesas manuais ou no formato legado de 6 partes", () => {
    expect(converterIdVinculo("08 - SECRETARIA DE EDUCAÇÃO|2.010 - Ação|3.3.90.39.00|01|200.0000|PA 1|SUB")).toBeNull();
    expect(converterIdVinculo("manual-1787090446077-rctub")).toBeNull();
    expect(converterIdVinculo("18 - ENCARGOS/FINANÇAS|0.003 - Precatórios|3.3.90.39.00|90.39||")).toBeNull();
  });
});

describe("migrarIdsNoValor", () => {
  it("reescreve chaves, listas e textos, e é idempotente", () => {
    const sec = "14 - SECRETARIA DE ASSISTÊNCIA SOCIAL";
    const velho = antigo(sec);
    const novo = converterIdVinculo(velho)!;
    const entrada = { mapa: { [velho]: 10 }, lista: [velho, "manual-1"], pai: { vinculoParentId: velho } };
    const primeira = migrarIdsNoValor(entrada);
    expect(primeira.valor).toEqual({ mapa: { [novo]: 10 }, lista: [novo, "manual-1"], pai: { vinculoParentId: novo } });
    expect(primeira.convertidos).toHaveLength(3);
    const segunda = migrarIdsNoValor(primeira.valor);
    expect(segunda.convertidos).toHaveLength(0);
    expect(segunda.valor).toEqual(primeira.valor);
  });

  it("em colisão mantém o conteúdo preenchido e junta textos diferentes", () => {
    const sec = "29 - SECRETARIA EXECUTIVA DA INFÂNCIA E JUVENTUDE";
    const velho = antigo(sec);
    const novo = converterIdVinculo(velho)!;
    expect(migrarIdsNoValor({ [novo]: "RECLASSIFICAÇÃO", [velho]: "ARP" }).valor).toEqual({ [novo]: "ARP / RECLASSIFICAÇÃO" });
    expect(migrarIdsNoValor({ [novo]: { valorReajuste: 0 }, [velho]: { valorReajuste: 50 } }).valor).toEqual({ [novo]: { valorReajuste: 50 } });
    expect(migrarIdsNoValor([velho, novo]).valor).toEqual([novo]);
  });
});
