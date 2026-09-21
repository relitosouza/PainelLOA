import { db } from "../../src/lib/db";
(async () => {
  for (const chave of ["painel_loa_custom_edits","painel_loa_added_expenses"]) {
    const c = await db.painelConfig.findUnique({ where:{chave} });
    const v:any = c?.valor;
    const arr = Array.isArray(v) ? v : Object.entries(v ?? {}).slice(0,3);
    console.log(chave, "tipo", Array.isArray(v)?"array":"obj", "n", Array.isArray(v)?v.length:Object.keys(v??{}).length);
    console.log(JSON.stringify(arr).slice(0,1200));
  }
  await db.$disconnect();
})();
