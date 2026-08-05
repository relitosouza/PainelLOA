import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseLdoWorkbook } from "@/lib/ldo-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const exercicioStr = formData.get("exercicio") as string;
    const numeroLdo = (formData.get("numeroLdo") as string) || "LDO-" + new Date().getFullYear();
    const acaoDuplicados = (formData.get("acaoDuplicados") as string) || "consolidar"; // consolidar | manter | rejeitar
    const modoImportacao = (formData.get("modoImportacao") as string) || "substituir"; // substituir | complementar

    const exercicio = exercicioStr ? parseInt(exercicioStr) : new Date().getFullYear() + 1;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parsed = parseLdoWorkbook(buffer);

    if (parsed.records.length === 0) {
      return NextResponse.json({ error: "Nenhum registro válido encontrado no arquivo." }, { status: 400 });
    }

    // Processamento de duplicidades conforme escolha do usuário
    let registrosParaInserir = parsed.records;

    if (acaoDuplicados === "consolidar") {
      const mapaConsolidado = new Map<string, typeof parsed.records[0]>();
      parsed.records.forEach((r) => {
        const chave = `${r.apelidoNormalizado}|${r.vinculo.toLowerCase()}`;
        if (mapaConsolidado.has(chave)) {
          const existente = mapaConsolidado.get(chave)!;
          existente.total += r.total;
        } else {
          mapaConsolidado.set(chave, { ...r });
        }
      });
      registrosParaInserir = Array.from(mapaConsolidado.values());
    } else if (acaoDuplicados === "rejeitar") {
      registrosParaInserir = parsed.records.filter((r) => r.situacaoValidacao !== "DUPLICADO");
    }

    // Criar cabeçalho do arquivo de importação
    const importIdBigInt = BigInt(Date.now());
    const arquivoImportacao = await db.arquivoImportacao.create({
      data: {
        id: importIdBigInt,
        nomeArquivo: file.name,
        tipoArquivo: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        tamanhoArquivo: BigInt(file.size),
        tipoImportacao: "LDO_RECEITAS",
        exercicioReferencia: exercicio,
        quantidadeLinhas: parsed.totalLinhas,
        registrosImportados: registrosParaInserir.length,
        registrosIgnorados: parsed.totalLinhas - registrosParaInserir.length,
        valorTotalImportado: parsed.valorTotalLdo,
        status: "CONCLUIDO",
        usuarioResponsavel: "Sistema / Admin",
        concluidoEm: new Date(),
      },
    });

    if (modoImportacao === "substituir") {
      const ldoClient = (db as any).ldoReceita || (new (require("@prisma/client").PrismaClient)()).ldoReceita;
      if (ldoClient?.deleteMany) {
        await ldoClient.deleteMany({
          where: { exercicio },
        });
      }
    }

    // Inserção em lote no banco preservando Apelido Original e Normalizado
    const insertData = registrosParaInserir.map((r) => ({
      exercicio,
      numeroLdo,
      apelidoOriginal: r.apelidoOriginal,
      apelidoNormalizado: r.apelidoNormalizado,
      vinculo: r.vinculo,
      descricaoVinculo: r.descricaoVinculo,
      valorTotalLdo: r.total,
      arquivoImportacaoId: arquivoImportacao.id,
      linhaOrigem: r.linhaOrigem,
      situacaoValidacao: r.situacaoValidacao,
      mensagemValidacao: r.mensagemValidacao || null,
      statusDistribuicao: "NAO_INICIADO" as const,
      valorDistribuidoLoa: 0,
      saldoDistribuir: r.total,
    }));

    const ldoClient = (db as any).ldoReceita || (new (require("@prisma/client").PrismaClient)()).ldoReceita;
    await ldoClient.createMany({
      data: insertData,
    });

    return NextResponse.json({
      success: true,
      importacaoId: arquivoImportacao.id.toString(),
      quantidadeRegistros: registrosParaInserir.length,
      valorTotal: parsed.valorTotalLdo,
    });
  } catch (error: any) {
    console.error("Erro detalhado ao confirmar importação LDO:", error);
    const detail = error?.message || String(error);
    return NextResponse.json({ error: `Falha ao gravar no banco: ${detail}` }, { status: 500 });
  }
}
