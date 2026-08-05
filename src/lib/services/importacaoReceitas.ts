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
  errosDetalhes?: unknown[];
  preview?: unknown[];
};

const HEADER_ALIASES: Record<string, string> = {
  datamovto: 'dataMovimento',
  datamovimento: 'dataMovimento',
  data_movto: 'dataMovimento',
  data_movimento: 'dataMovimento',
  data: 'dataMovimento',
  exercicio: 'exercicio',
  exercício: 'exercicio',
  ano: 'exercicio',
  anoexercicio: 'exercicio',
  anoexercício: 'exercicio',
  valor: 'valor',
  valorarrecadado: 'valor',
  total: 'valor',
  valortotal: 'valor',
  receita: 'receita',
  codigoreceita: 'receita',
  codreceita: 'receita',
  cdreceita: 'receita',
  natur_rec: 'naturezaReceita',
  naturrec: 'naturezaReceita',
  naturalezareceita: 'naturezaReceita',
  natureza_receita: 'naturezaReceita',
  naturezareceita: 'naturezaReceita',
  naturaleza: 'naturezaReceita',
  codnaturezareceita: 'naturezaReceita',
  desc_receita: 'descricaoReceita',
  descrição_receita: 'descricaoReceita',
  descricaoreceita: 'descricaoReceita',
  descricao_receita: 'descricaoReceita',
  descreceita: 'descricaoReceita',
  unid_orcam: 'unidadeOrcamentaria',
  unidorcam: 'unidadeOrcamentaria',
  unidadeorcamentaria: 'unidadeOrcamentaria',
  unidade_orcamentaria: 'unidadeOrcamentaria',
  codigo_fundo: 'codigoFundo',
  codigofundo: 'codigoFundo',
  codfundo: 'codigoFundo',
  fundo: 'codigoFundo',
  vinculo: 'vinculo',
  vínculo: 'vinculo',
  codigovinculo: 'vinculo',
  codvinculo: 'vinculo',
  fonte: 'vinculo',
  fonterecurso: 'vinculo',
};

function normalizeHeader(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function mapHeaders(rawData: unknown[]): Map<string, string> {
  const map = new Map<string, string>();
  if (!rawData || rawData.length === 0) return map;
  const firstRow = rawData[0] as Record<string, string>;
  for (const key in firstRow) {
    const normalized = normalizeHeader(key);
    const field = HEADER_ALIASES[normalized];
    if (field) {
      map.set(field, key);
    }
  }
  return map;
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? null : date;
  }
  const text = String(value).trim();
  if (!text) return null;
  const ddmmyyyy = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(date.getTime()) ? null : date;
  }
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, yyyy, mm, dd] = iso;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(text);
  return isNaN(date.getTime()) ? null : date;
}

function parseDecimal(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let text = String(value).replace(/R\$\s?/gi, '').replace(/\s/g, '');
  if (!text) return null;
  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  if (lastComma > lastDot) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && /,/.test(text)) {
    text = text.replace(/,/g, '');
  } else if ((text.match(/\./g) ?? []).length > 1) {
    text = text.replace(/\./g, '');
  } else if (lastComma >= 0) {
    text = text.replace(/\./g, '').replace(',', '.');
  }
  const parsed = Number(text.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function inferExercise(dataMovimento: Date | null, row: Record<string, unknown>, defaultYear: number): number | null {
  const source = row.exercicio ?? row.ano ?? row.exercício ?? null;
  if (source !== null && source !== undefined && source !== '') {
    const parsed = parseInt(String(source));
    if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) return parsed;
  }
  if (dataMovimento) return dataMovimento.getFullYear();
  return defaultYear;
}

type ErroDetalhe =
  | { linha: number; erro: string }
  | { erro: string; detalhes: string };

interface ReceitaParaInserir {
  dataMovimento: Date | null;
  exercicio: number;
  valor: number;
  receita: string | null;
  naturezaReceita: string | null;
  descricaoReceita: string | null;
  unidadeOrcamentaria: string | null;
  codigoFundo: string | null;
  vinculo: string | null;
  arquivoImportacaoId: string;
  hashRegistro: string;
}

export async function processarArquivoReceitas(
  buffer: Buffer,
  nomeArquivo: string,
  tipoArquivo: string,
  options?: { usuarioResponsavel?: string; exercicioReferencia?: number }
): Promise<ResultadoImportacao> {
  let workbook;
  try {
    workbook = xlsx.read(buffer, { type: 'buffer' });
  } catch {
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
  const rawData: unknown[] = xlsx.utils.sheet_to_json(sheet, { defval: null });

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

  const headerMap = mapHeaders(rawData);
  const requiredFields = ['exercicio', 'valor'];
  const hasRequired = requiredFields.every(f => headerMap.has(f));
  
  if (!hasRequired) {
    return {
      sucesso: false,
      mensagem: `Cabeçalhos obrigatórios não encontrados. O arquivo deve conter pelo menos: ${requiredFields.join(', ')}.`,
      totalLinhas: rawData.length,
      importados: 0,
      ignorados: 0,
      comErro: rawData.length,
      preview: rawData.slice(0, 5)
    };
  }

  const defaultYear = options?.exercicioReferencia ?? new Date().getFullYear();
  const totalLinhas = rawData.length;
  let importados = 0;
  const ignorados = 0;
  let comErro = 0;
  const errosDetalhes: ErroDetalhe[] = [];
  const receitasParaInserir: ReceitaParaInserir[] = [];
  const previewRows: unknown[] = [];

  const importacao = await prisma.arquivoImportacao.create({
    data: {
      nomeArquivo,
      tipoArquivo,
      tamanhoArquivo: BigInt(buffer.length),
      tipoImportacao: 'RECEITA_ARRECADADA',
      quantidadeLinhas: totalLinhas,
      usuarioResponsavel: options?.usuarioResponsavel,
      exercicioReferencia: defaultYear,
      status: 'PROCESSANDO'
    }
  });

  for (let i = 0; i < totalLinhas; i++) {
    const row = rawData[i] as Record<string, unknown>;
    try {
      const dataMovimento = parseDate(row[headerMap.get('dataMovimento')!]);
      const valorRaw = row[headerMap.get('valor')!];
      const valorFinal = parseDecimal(valorRaw);
      
      if (valorFinal === null) {
        throw new Error('Valor inválido ou ausente');
      }

      const exercicio = inferExercise(dataMovimento, row, defaultYear);
      if (exercicio === null) {
        throw new Error('Exercício inválido ou ausente');
      }

      const receita = headerMap.has('receita') ? String(row[headerMap.get('receita')!] ?? '').trim() : '';
      const naturezaReceita = headerMap.has('naturezaReceita') ? String(row[headerMap.get('naturezaReceita')!] ?? '').trim() : '';
      const descricaoReceita = headerMap.has('descricaoReceita') ? String(row[headerMap.get('descricaoReceita')!] ?? '').trim() : '';
      const unidadeOrcamentaria = headerMap.has('unidadeOrcamentaria') ? String(row[headerMap.get('unidadeOrcamentaria')!] ?? '').trim() : '';
      const codigoFundo = headerMap.has('codigoFundo') ? String(row[headerMap.get('codigoFundo')!] ?? '').trim() : '';
      const vinculo = headerMap.has('vinculo') ? String(row[headerMap.get('vinculo')!] ?? '').trim() : '';

      const hashInput = `${dataMovimento ? dataMovimento.toISOString().split('T')[0] : ''}|${exercicio}|${valorFinal.toFixed(2)}|${receita}|${naturezaReceita}|${descricaoReceita}|${unidadeOrcamentaria}|${codigoFundo}|${vinculo}`;
      const hashRegistro = crypto.createHash('sha256').update(hashInput).digest('hex');

      if (previewRows.length < 10) {
        previewRows.push({
          dataMovimento: dataMovimento ? dataMovimento.toISOString().split('T')[0] : null,
          exercicio,
          valor: valorFinal,
          receita,
          naturezaReceita,
          descricaoReceita,
          unidadeOrcamentaria,
          codigoFundo,
          vinculo
        });
      }

      receitasParaInserir.push({
        dataMovimento,
        exercicio,
        valor: valorFinal,
        receita: receita || null,
        naturezaReceita: naturezaReceita || null,
        descricaoReceita: descricaoReceita || null,
        unidadeOrcamentaria: unidadeOrcamentaria || null,
        codigoFundo: codigoFundo || null,
        vinculo: vinculo || null,
        arquivoImportacaoId: importacao.id.toString(),
        hashRegistro
      });

    } catch (err: unknown) {
      comErro++;
      errosDetalhes.push({ linha: i + 2, erro: err instanceof Error ? err.message : String(err) });
    }
  }

  const LOTE_SIZE = 2000;
  for (let i = 0; i < receitasParaInserir.length; i += LOTE_SIZE) {
    const batch = receitasParaInserir.slice(i, i + LOTE_SIZE);
    
    try {
      const uniqueBatch = new Map();
      for (const record of batch) {
        uniqueBatch.set(record.hashRegistro, record);
      }
      
      const recordsToInsert = Array.from(uniqueBatch.values());
      const hashes = recordsToInsert.map(r => r.hashRegistro);
      
      await prisma.$transaction([
        prisma.receitaArrecadada.deleteMany({
          where: { hashRegistro: { in: hashes } }
        }),
        prisma.receitaArrecadada.createMany({
          data: recordsToInsert,
          skipDuplicates: true
        })
      ]);
      
      importados += recordsToInsert.length;
    } catch (err: unknown) {
      comErro += batch.length;
      errosDetalhes.push({ erro: 'Falha fatal ao inserir o lote inteiro.', detalhes: err instanceof Error ? err.message : String(err) });
    }
  }

  const valorTotal = receitasParaInserir.reduce((sum, r) => sum + r.valor, 0);
  const finalStatus = (comErro === 0 && ignorados === 0) ? 'CONCLUIDO' : (comErro > 0 ? 'ERRO' : 'CONCLUIDO_COM_ALERTAS');

  await prisma.arquivoImportacao.update({
    where: { id: importacao.id },
    data: {
      registrosImportados: importados,
      registrosIgnorados: ignorados,
      registrosComErro: comErro,
      valorTotalImportado: valorTotal,
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
    errosDetalhes,
    preview: previewRows
  };
}

export async function validarArquivoReceitas(buffer: Buffer) {
  let workbook;
  try {
    workbook = xlsx.read(buffer, { type: 'buffer' });
  } catch {
    return { valido: false, mensagem: 'Falha ao ler o arquivo. Formato inválido.' };
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData: unknown[] = xlsx.utils.sheet_to_json(sheet, { defval: null });

  if (!rawData || rawData.length === 0) {
    return { valido: false, mensagem: 'Arquivo vazio ou sem dados.' };
  }

  const headerMap = mapHeaders(rawData);
  const requiredFields = ['exercicio', 'valor'];
  const hasRequired = requiredFields.every(f => headerMap.has(f));

  const headersEncontrados = Array.from(headerMap.values());
  const headersFaltantes = requiredFields.filter(f => !headerMap.has(f));

  return {
    valido: hasRequired,
    mensagem: hasRequired 
      ? `Cabeçalhos válidos detectados. ${rawData.length} linhas encontradas.` 
      : `Cabeçalhos obrigatórios ausentes: ${headersFaltantes.join(', ')}`,
    totalLinhas: rawData.length,
    headersEncontrados,
    headersFaltantes
  };
}

export async function confirmarImportacao(arquivoImportacaoId: string) {
  const importacao = await prisma.arquivoImportacao.findUnique({
    where: { id: BigInt(arquivoImportacaoId) },
    include: { receitasArrecadadas: true }
  });

  if (!importacao) {
    return { sucesso: false, mensagem: 'Importação não encontrada.' };
  }

  return {
    sucesso: true,
    mensagem: 'Importação confirmada.',
    quantidade: importacao.receitasArrecadadas.length,
    valorTotal: importacao.valorTotalImportado
  };
}

export async function desfazerImportacao(arquivoImportacaoId: string) {
  const importacao = await prisma.arquivoImportacao.findUnique({
    where: { id: BigInt(arquivoImportacaoId) }
  });

  if (!importacao) {
    return { sucesso: false, mensagem: 'Importação não encontrada.' };
  }

  await prisma.receitaArrecadada.deleteMany({
    where: { arquivoImportacaoId: importacao.id }
  });

  await prisma.arquivoImportacao.delete({
    where: { id: importacao.id }
  });

  return { sucesso: true, mensagem: 'Importação desfeita com sucesso.' };
}
