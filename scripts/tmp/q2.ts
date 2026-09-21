import { db } from "../../src/lib/db";
(async () => {
  const g = await db.loaReceita.groupBy({ by:["orgaoUnidade"], _count:{_all:true}, _sum:{valor:true} });
  console.log("orgaoUnidade", JSON.stringify(g));
  const f = await db.loaReceita.findMany({ distinct:["fonteRecurso"], select:{fonteRecurso:true, descricaoFonte:true}, take: 200 });
  console.log("fontes", f.length, JSON.stringify(f.slice(0,15)));
  const s = await db.subelementoCustomizado.findMany({ take:5, select:{fonteVinculo:true, codigoAplicacao:true, secretaria:true} });
  console.log("subelem", JSON.stringify(s));
  const br = await db.budgetRecord.findMany({ take:5, select:{fonteRecurso:true, organ:true, budgetUnit:true} });
  console.log("budgetRecord", JSON.stringify(br));
  await db.$disconnect();
})();
