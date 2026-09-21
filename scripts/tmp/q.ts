import { db } from "../../src/lib/db";
(async () => {
  const r = await db.ldoReceita.findMany({ take: 8, select: { exercicio:true, apelidoOriginal:true, apelidoNormalizado:true, vinculo:true, valorTotalLdo:true } });
  console.log("LDO sample", JSON.stringify(r, (k,v)=> typeof v==="bigint"?v.toString():v));
  const apel = await db.ldoReceita.groupBy({ by:["apelidoNormalizado"], _count:{_all:true} });
  console.log("apelidos", JSON.stringify(apel));
  const lr = await db.loaReceita.findMany({ take: 6, select:{exercicio:true, fonteRecurso:true, orgaoUnidade:true, valor:true} });
  console.log("LOAReceita sample", JSON.stringify(lr, (k,v)=> typeof v==="bigint"?v.toString():v));
  await db.$disconnect();
})();
