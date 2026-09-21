import { db } from "../../src/lib/db";
(async () => {
  const keys = await db.painelConfig.findMany({ select:{chave:true} });
  console.log("chaves", JSON.stringify(keys.map(k=>k.chave)));
  await db.$disconnect();
})();
