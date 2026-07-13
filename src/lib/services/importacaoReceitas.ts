import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import crypto from 'crypto';

const prisma = new PrismaClient();

export type ResultadoImportacao = {
  sucesso: boolean;
  mensagem: string;
  totalLinhas: number;
  importados: number;
  ignorados: number;
  comErro: number;
  arquivoImportacaoId?: string;
  errosDetalhes?: any[];
};

export async function processarArquivoReceitas(
  buffer: Buffer,
  nomeArquivo: string,
  tipoArquivo: string
): Promise<ResultadoImportacao> {
  let workbook;
  try {
    workbook = xlsx.read(buffer, { type: 'buffer' });
  } catch (error) {
    return {
      sucesso: false,
      mensagem: 'Falha ao ler o arquivo. Formato inválido.',
      totalLinhas: 0,
      importados: 0,
      ignorados: 0,
      comErro: 1
    };
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Lendo dados em formato de array de objetos
  const rawData: any[] = xlsx.utils.sheet_to_json(sheet, { defval: null });
  
  if (!rawData || rawData.length === 0) {
    return {
      sucesso: false,
      mensagem: 'Arquivo vazio ou sem dados formatados corretamente.',
      totalLinhas: 0,
      importados: 0,
      ignorados: 0,
      comErro: 1
    };
  }

  // Normalizando cabeçalhos
  const normalizedData = rawData.map(row => {
    const newRow: any = {};
    for (const key in row) {
      // Remove espaços, hífens, acentos e coloca em lowercase
      const normalizedKey = key
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      
      newRow[normalizedKey] = row[key];
    }
    return newRow;
  });

  const totalLinhas = normalizedData.length;
  let importados = 0;
  let ignorados = 0;
  let comErro = 0;
  const errosDetalhes: any[] = [];
  const receitasParaInserir: any[] = [];

  // Criar registro de importação
  const importacao = await prisma.arquivoImportacao.create({
    data: {
      nomeArquivo,
      tipoArquivo,
      tamanhoArquivo: BigInt(buffer.length),
      quantidadeLinhas: totalLinhas,
      status: 'PROCESSANDO'
    }
  });

  for (let i = 0; i < totalLinhas; i++) {
    const row = normalizedData[i];
    try {
      // Mapeamento e Validação Básica
      // Espera-se datamovto, valor, exercicio, etc.
      
      const dataStr = row.datamovto || row.data;
      let dataMovimento: Date | null = null;
      if (dataStr) {
        if (typeof dataStr === 'number') { // Excel serial date
           dataMovimento = new Date(Math.round((dataStr - 25569) * 86400 * 1000));
        } else {
           dataMovimento = new Date(dataStr);
        }
      }

      const valorRaw = row.valor;
      let valorFinal = 0;
      if (valorRaw !== null && valorRaw !== undefined) {
        if (typeof valorRaw === 'number') {
           valorFinal = valorRaw;
        } else if (typeof valorRaw === 'string') {
           const cleaned = valorRaw.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.');
           valorFinal = parseFloat(cleaned);
        }
      }

      if (isNaN(valorFinal)) {
        throw new Error('Valor inválido');
      }

      let exercicio = parseInt(row.exercicio);
      if (isNaN(exercicio)) {
         exercicio = dataMovimento ? dataMovimento.getFullYear() : new Date().getFullYear();
      }

      // Preparar os campos limpos
      const receita = (row.receita || '').toString().trim();
      const naturezaReceita = (row.naturrec || row.naturezareceita || '').toString().trim();
      const contabil = (row.contabil || '').toString().trim();
      const vinculo = (row.vinculo || '').toString().trim();
      const vinculoBanco = (row.vinculobco || row.vinculobanco || '').toString().trim();
      const codigo = (row.codigo || '').toString().trim();
      const unidadeOrcamentaria = (row.unidorcam || row.unidadeorcamentaria || '').toString().trim();
      const unidadeGestora = (row.unidgest || row.unidadegestora || '').toString().trim();
      const idUnidadeGestora = (row.idug || '').toString().trim();
      const lote = (row.lote || '').toString().trim();
      const seqAvisoCred = (row.seqavisocred || '').toString().trim();
      const codigoFundo = (row.codigofundo || '').toString().trim();
      
      const hashInput = `${dataMovimento?.toISOString() || ''}|${receita}|${naturezaReceita}|${contabil}|${vinculo}|${valorFinal.toFixed(2)}|${codigo}|${unidadeOrcamentaria}|${exercicio}|${unidadeGestora}|${lote}|${seqAvisoCred}|${codigoFundo}`;
      const hashRegistro = crypto.createHash('sha256').update(hashInput).digest('hex');

      receitasParaInserir.push({
        dataMovimento,
        receita,
        naturezaReceita,
        contabil,
        vinculo,
        vinculoBanco,
        valor: valorFinal,
        descricaoReceita: (row.descrreceita || row.descricaoreceita || '').toString().trim(),
        descricaoBanco: (row.descrbanco || row.descricaobanco || '').toString().trim(),
        prefixoBanco: (row.prefixobanco || '').toString().trim(),
        numeroBanco: (row.nrobanco || row.numerobanco || '').toString().trim(),
        nomeBanco: (row.nomebanco || '').toString().trim(),
        codigo,
        unidadeOrcamentaria,
        exercicio,
        unidadeGestora,
        idUnidadeGestora,
        idSelecionado: (row.idselecionado || '').toString().trim(),
        historico: (row.historico || '').toString().trim(),
        lote,
        sequenciaAvisoCredito: seqAvisoCred,
        codigoFundo,
        descricaoFundo: (row.descrfundo || row.descricaofundo || '').toString().trim(),
        arquivoImportacaoId: importacao.id,
        hashRegistro
      });

    } catch (e: any) {
       comErro++;
       errosDetalhes.push({ linha: i + 2, erro: e.message });
    }
  }

  // Lote inserts usando deleteMany + createMany (MUITO MAIS RÁPIDO para "subscrever")
  const LOTE_SIZE = 2000;
  for (let i = 0; i < receitasParaInserir.length; i += LOTE_SIZE) {
    const batch = receitasParaInserir.slice(i, i + LOTE_SIZE);
    
    try {
      // Removendo duplicatas dentro do mesmo lote (mantendo o último)
      const uniqueBatch = new Map();
      for (const record of batch) {
        uniqueBatch.set(record.hashRegistro, record);
      }
      
      const recordsToInsert = Array.from(uniqueBatch.values());
      const hashes = recordsToInsert.map(r => r.hashRegistro);
      
      // Executa um delete em massa dos que já existem e insere os novos (Equivalente rápido a Upsert)
      await prisma.$transaction([
        prisma.receitaHistorica.deleteMany({
          where: { hashRegistro: { in: hashes } }
        }),
        prisma.receitaHistorica.createMany({
          data: recordsToInsert,
          skipDuplicates: true
        })
      ]);
      
      const inseridosOuAtualizados = recordsToInsert.length;
      importados += inseridosOuAtualizados;
      // Como estamos subscrevendo (upsert), não temos ignorados
    } catch (err: any) {
      comErro += batch.length;
      errosDetalhes.push({ erro: 'Falha fatal ao inserir o lote inteiro.', detalhes: err.message });
    }
  }

  const finalStatus = (comErro === 0 && ignorados === 0) ? 'CONCLUIDO' : (comErro > 0 ? 'ERRO' : 'CONCLUIDO_COM_ALERTAS');

  await prisma.arquivoImportacao.update({
    where: { id: importacao.id },
    data: {
      registrosImportados: importados,
      registrosIgnorados: ignorados,
      registrosComErro: comErro,
      status: finalStatus,
      concluidoEm: new Date()
    }
  });

  return {
    sucesso: true,
    mensagem: 'Processamento finalizado',
    totalLinhas,
    importados,
    ignorados,
    comErro,
    arquivoImportacaoId: importacao.id.toString(),
    errosDetalhes
  };
}
