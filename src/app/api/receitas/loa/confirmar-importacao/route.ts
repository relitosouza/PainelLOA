import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseLoaReceitaWorkbook } from "@/lib/loa-receita-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const exercicioStr = formData.get("exercicio") as string;
    const acaoDuplicados = (formData.get("acaoDuplicados") as string) || "consolidar"; // consolidar | manter | rejeitar
    const modoImportacao = (formData.get("modoImportacao") as string) || "substituir"; // substituir | complementar

    const exercicio = exercicioStr ? parseInt(exercicioStr) : new Date().getFullYear() + 1;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parsed = parseLoaReceitaWorkbook(buffer);

    if (parsed.records.length === 0) {
      return NextResponse.json({ error: "Nenhum registro válido encontrado na planilha." }, { status: 400 });
    }

    // Processamento de duplicidades
    let registrosParaInserir = parsed.records;

    if (acaoDuplicados === "consolidar") {
      const mapaConsolidado = new Map<string, typeof parsed.records[0]>();
      parsed.records.forEach((r) => {
        const chave = `${r.naturezaReceita.trim()}|${r.fonteRecurso.trim()}`.toLowerCase();
        if (mapaConsolidado.has(chave)) {
          const existente = mapaConsolidado.get(chave)!;
          existente.valor += r.valor;
        } else {
          mapaConsolidado.set(chave, { ...r });
        }
      });
      registrosParaInserir = Array.from(mapaConsolidado.values());
    } else if (acaoDuplicados === "rejeitar") {
      registrosParaInserir = parsed.records.filter((r) => r.situacaoValidacao !== "DUPLICADO");
    }

    const valorTotalFinal = registrosParaInserir.reduce((sum, r) => sum + r.valor, 0);

    // Criar cabeçalho do arquivo de importação
    const importIdBigInt = BigInt(Date.now());
    const arquivoImportacao = await db.arquivoImportacao.create({
      data: {
        id: importIdBigInt,
        nomeArquivo: file.name,
        tipoArquivo: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        tamanhoArquivo: BigInt(file.size),
        tipoImportacao: "LOA_RECEITAS",
        exercicioReferencia: exercicio,
        quantidadeLinhas: parsed.totalLinhas,
        registrosImportados: registrosParaInserir.length,
        registrosIgnorados: parsed.totalLinhas - registrosParaInserir.length,
        valorTotalImportado: valorTotalFinal,
        status: "CONCLUIDO",
        usuarioResponsavel: "Sistema / Gestor Orçamentário",
        concluidoEm: new Date(),
      },
    });

    if (modoImportacao === "substituir") {
      await db.loaReceita.deleteMany({
        where: { exercicio },
      });
    }

    // Inserção em lote na tabela LoaReceita
    const insertData = registrosParaInserir.map((r) => ({
      exercicio,
      codigoReceita: r.codigoReceita || null,
      naturezaReceita: r.naturezaReceita,
      descricaoReceita: r.descricaoReceita,
      fonteRecurso: r.fonteRecurso,
      descricaoFonte: r.descricaoFonte || null,
      orgaoUnidade: r.orgaoUnidade || null,
      valor: r.valor,
      arquivoImportacaoId: arquivoImportacao.id,
      linhaOrigem: r.linhaOrigem,
      situacaoValidacao: r.situacaoValidacao,
      mensagemValidacao: r.mensagemValidacao || null,
    }));

    await db.loaReceita.createMany({
      data: insertData,
    });

    return NextResponse.json({
      success: true,
      importacaoId: arquivoImportacao.id.toString(),
      quantidadeRegistros: registrosParaInserir.length,
      valorTotal: valorTotalFinal,
      exercicio,
    });
  } catch (error) {
    console.error("Erro detalhado ao confirmar importação LOA Receitas:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Falha ao gravar no banco: ${detail}` }, { status: 500 });
  }
}
