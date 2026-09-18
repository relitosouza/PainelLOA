// Migração dos IDs das linhas da Análise LOA após a correção dos vínculos em public/loa_new.xlsx.
//
// O ID de cada linha é `secretaria|ação|natureza|fonte|código de aplicação|processo|subelemento`.
// Linhas que tinham o vínculo em branco (ou com texto livre) ganhavam uma fonte derivada da natureza
// (ex.: "90.39") e código de aplicação vazio. Com o vínculo preenchido, a fonte passa a "01" e o código de
// aplicação a 110.0000 / 200.0000 / 310.0000. Os dados salvos com o ID antigo precisam ser religados.

/** Código de aplicação dado ao vínculo corrigido, pela secretaria (mesma regra da correção da planilha). */
export function codigoAplicacaoPorSecretaria(secretaria: string) {
  if (/SECRETARIA\s+DA\s+SA[ÚU]DE/i.test(secretaria)) return "310.0000";
  if (/SECRETARIA\s+DE\s+EDUCA[ÇC][ÃA]O/i.test(secretaria)) return "200.0000";
  return "110.0000";
}

const isFonteAntiga = (fonte: string) =>
  /^\d{2}\.\d{2}$/.test(fonte) || fonte === "Confirmar com a Dani" || fonte === "Tesouro / Próprio";

/** Converte um ID no formato antigo para o novo; devolve null se o ID não for do formato antigo. */
export function converterIdVinculo(id: string): string | null {
  const partes = id.split("|");
  if (partes.length !== 7 || !isFonteAntiga(partes[3]) || partes[4] !== "") return null;
  partes[3] = "01";
  partes[4] = codigoAplicacaoPorSecretaria(partes[0]);
  return partes.join("|");
}

export type ResultadoMigracao = {
  valor: unknown;
  convertidos: string[];
  /** IDs novos que já existiam (ou que receberam mais de um ID antigo). */
  colisoes: string[];
};

const vazio = (valor: unknown): boolean =>
  valor === null || valor === undefined || valor === "" || valor === false || valor === 0 ||
  (typeof valor === "object" && !Object.values(valor as object).some((item) => !vazio(item)));

/**
 * Reescreve os IDs antigos em qualquer ponto de um valor JSON: chaves de objeto, itens de lista e textos.
 * Em colisão, fica o conteúdo não vazio; se os dois lados são textos diferentes, junta os dois ("antigo / atual").
 */
export function migrarIdsNoValor(valor: unknown): ResultadoMigracao {
  const convertidos: string[] = [];
  const colisoes: string[] = [];

  const reescrever = (atual: unknown): unknown => {
    if (typeof atual === "string") {
      const novo = converterIdVinculo(atual);
      if (!novo) return atual;
      convertidos.push(novo);
      return novo;
    }
    if (Array.isArray(atual)) {
      const lista = atual.map(reescrever);
      if (!lista.every((item) => typeof item === "string")) return lista;
      const vistos = new Set<string>();
      return lista.filter((item) => {
        if (vistos.has(item as string)) {
          colisoes.push(item as string);
          return false;
        }
        vistos.add(item as string);
        return true;
      });
    }
    if (atual && typeof atual === "object") {
      const saida: Record<string, unknown> = {};
      // IDs que já estão no formato novo entram primeiro, para o conteúdo atual ter prioridade.
      const entradas = Object.entries(atual).sort(([a], [b]) => Number(converterIdVinculo(a) !== null) - Number(converterIdVinculo(b) !== null));
      for (const [chave, conteudo] of entradas) {
        const novaChave = converterIdVinculo(chave) ?? chave;
        if (novaChave !== chave) convertidos.push(novaChave);
        const novoConteudo = reescrever(conteudo);
        if (novaChave in saida) {
          colisoes.push(novaChave);
          const existente = saida[novaChave];
          if (vazio(existente) && !vazio(novoConteudo)) saida[novaChave] = novoConteudo;
          else if (typeof existente === "string" && typeof novoConteudo === "string" && novoConteudo && novoConteudo !== existente) {
            saida[novaChave] = `${novoConteudo} / ${existente}`;
          }
          continue;
        }
        saida[novaChave] = novoConteudo;
      }
      return saida;
    }
    return atual;
  };

  return { valor: reescrever(valor), convertidos, colisoes };
}
