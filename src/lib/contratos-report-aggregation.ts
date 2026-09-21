import type { LoaReportGroup, LoaReportItem } from "./loa-report-template";

export interface ContratosReportAggregationOptions {
  ocultarNatureza?: boolean;
  ocultarAcao?: boolean;
  ocultarVinculo?: boolean;
}

const itemTotal = (item: LoaReportItem): number =>
  item.valorTotal ??
  (item.valLoa || 0) +
    (item.valorReajuste || 0) +
    (item.valorAditamento || 0) +
    (item.valorAjusteSf || 0) +
    (item.valorCorteGp || 0);

/**
 * Consolida as dimensões removidas do relatório de contratos.
 *
 * Ocultar uma coluna equivale a removê-la da chave de agrupamento. Assim,
 * registros que diferem somente por ação, natureza ou vínculo passam a ocupar
 * a mesma linha e têm todos os valores financeiros somados.
 */
export function aggregateContractReportGroups(
  groups: LoaReportGroup[],
  options: ContratosReportAggregationOptions
): LoaReportGroup[] {
  const aggregatedGroups = new Map<
    string,
    { group: LoaReportGroup; items: Map<string, LoaReportItem> }
  >();

  for (const sourceGroup of groups) {
    const secretaria = sourceGroup.secretaria || "Secretaria não identificada";
    const actionKey = options.ocultarAcao
      ? "SEM_ACAO"
      : sourceGroup.groupCode || sourceGroup.groupTitle || "SEM_ACAO";
    const groupKey = JSON.stringify([secretaria, actionKey]);

    if (!aggregatedGroups.has(groupKey)) {
      aggregatedGroups.set(groupKey, {
        group: {
          groupCode: options.ocultarAcao ? undefined : sourceGroup.groupCode,
          groupTitle: options.ocultarAcao
            ? "Contratos consolidados"
            : sourceGroup.groupTitle,
          secretaria,
          valLdo: 0,
          valLoa: 0,
          valorReajuste: 0,
          valorAditamento: 0,
          valorAjusteSf: 0,
          valorCorteGp: 0,
          valorTotal: 0,
          items: [],
        },
        items: new Map(),
      });
    }

    const target = aggregatedGroups.get(groupKey)!;

    for (const sourceItem of sourceGroup.items) {
      const natureza = options.ocultarNatureza ? "—" : sourceItem.natureza || "—";
      const vinculo = options.ocultarVinculo ? undefined : sourceItem.vinculo;
      const rowKey = JSON.stringify([
        natureza,
        vinculo || "",
        sourceItem.processo || "",
        sourceItem.observacao || "",
        sourceItem.processoObs || "",
        sourceItem.isContrato ?? null,
      ]);

      if (!target.items.has(rowKey)) {
        const item: LoaReportItem = {
          ...sourceItem,
          natureza,
          vinculo,
          valLdo: 0,
          valLoa: 0,
          valorReajuste: 0,
          valorAditamento: 0,
          valorAjusteSf: 0,
          valorCorteGp: 0,
          valorTotal: 0,
        };
        target.items.set(rowKey, item);
        target.group.items.push(item);
      }

      const item = target.items.get(rowKey)!;
      const valLdo = sourceItem.valLdo || 0;
      const valLoa = sourceItem.valLoa || 0;
      const reajuste = sourceItem.valorReajuste || 0;
      const aditamento = sourceItem.valorAditamento || 0;
      const ajusteSf = sourceItem.valorAjusteSf || 0;
      const corteGp = sourceItem.valorCorteGp || 0;
      const total = itemTotal(sourceItem);

      item.valLdo = (item.valLdo || 0) + valLdo;
      item.valLoa = (item.valLoa || 0) + valLoa;
      item.valorReajuste = (item.valorReajuste || 0) + reajuste;
      item.valorAditamento = (item.valorAditamento || 0) + aditamento;
      item.valorAjusteSf = (item.valorAjusteSf || 0) + ajusteSf;
      item.valorCorteGp = (item.valorCorteGp || 0) + corteGp;
      item.valorTotal = (item.valorTotal || 0) + total;

      target.group.valLdo += valLdo;
      target.group.valLoa += valLoa;
      target.group.valorReajuste += reajuste;
      target.group.valorAditamento += aditamento;
      target.group.valorAjusteSf = (target.group.valorAjusteSf || 0) + ajusteSf;
      target.group.valorCorteGp = (target.group.valorCorteGp || 0) + corteGp;
      target.group.valorTotal += total;
    }
  }

  return Array.from(aggregatedGroups.values(), ({ group }) => group);
}
