// Mapa código da natureza de despesa → descrição oficial (NomenclaturaDespesa), nos formatos usados pela Análise LOA.
export function buildNomenclaturaMap(items: Array<{ codigo: string | null; codigoFormatado: string; descricao: string }>) {
  const mapa: Record<string, string> = {};
  items.forEach((item) => {
    if (item.codigo) mapa[item.codigo] = item.descricao;
    if (item.codigoFormatado) mapa[item.codigoFormatado] = item.descricao;

    // Adiciona formato reduzido de 4 partes (ex: 3.3.90.30) se aplicável
    const parts = item.codigoFormatado.split(".");
    if (parts.length === 5) {
      const short4 = `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}`;
      mapa[short4] = item.descricao;
    }
  });
  return mapa;
}
