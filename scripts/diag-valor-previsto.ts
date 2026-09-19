import { db } from "../src/lib/db";
async function main() {
  for (const k of ["painel_loa_added_expenses","painel_loa_removed_expenses","painel_loa_custom_edits","painel_loa_reajustes_aditamentos"]) {
    const r = await db.painelConfig.findUnique({ where: { chave: k } });
    const v: any = r?.valor;
    let soma = 0;
    if (Array.isArray(v)) v.forEach((i: any) => soma += (Number(i?.valLoa)||0)+(Number(i?.valorReajuste)||0)+(Number(i?.valorAditamento)||0));
    else if (v) Object.values(v).forEach((i: any) => soma += typeof i==="number"? i : (Number(i?.valorLoa)||0)+(Number(i?.valorReajuste)||0)+(Number(i?.valorAditamento)||0));
    console.log(k, "itens:", v ? (Array.isArray(v)? v.length : Object.keys(v).length) : 0, "soma:", soma.toFixed(2), "atualizado:", (r as any)?.updatedAt);
  }
  const { getValorPrevistoLoaDespesa } = await import("../src/lib/loa-valor-previsto");
  console.log("total:", await getValorPrevistoLoaDespesa());
}
main().finally(()=>process.exit(0));
