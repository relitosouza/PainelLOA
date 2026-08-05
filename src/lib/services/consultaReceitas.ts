import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function obterResumo(filtros: Record<string, unknown>) {
  const where = construirFiltros(filtros);

  const [
    agregacaoTotal,
    fundosDistintos,
    agregacaoPropria,
    agregacaoTransferencias,
    agregacaoCapital,
    agregacaoIPTU,
    agregacaoISS,
    agregacaoFPM,
    agregacaoICMS,
    agregacaoFUNDEB,
    anosBrutos
  ] = await Promise.all([
    prisma.receitaArrecadada.aggregate({
      where,
      _sum: { valor: true },
      _count: { id: true }
    }),
    prisma.receitaArrecadada.findMany({
      where: { ...where, codigoFundo: { not: null, notIn: [''] } },
      select: { codigoFundo: true },
      distinct: ['codigoFundo']
    }),
    prisma.receitaArrecadada.aggregate({
      where: {
        ...where,
        OR: [
          { receita: { contains: 'IPTU', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'IPTU', mode: 'insensitive' } },
          { receita: { contains: 'ISS', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'ISS', mode: 'insensitive' } },
          { receita: { contains: 'ITBI', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'ITBI', mode: 'insensitive' } },
          { receita: { contains: 'TAXA', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'TAXA', mode: 'insensitive' } },
          { receita: { contains: 'IMPOSTO', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'IMPOSTO', mode: 'insensitive' } },
        ]
      },
      _sum: { valor: true }
    }),
    prisma.receitaArrecadada.aggregate({
      where: {
        ...where,
        OR: [
          { receita: { contains: 'FPM', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'FPM', mode: 'insensitive' } },
          { receita: { contains: 'ICMS', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'ICMS', mode: 'insensitive' } },
          { receita: { contains: 'FUNDEB', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'FUNDEB', mode: 'insensitive' } },
          { receita: { contains: 'SUS', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'SUS', mode: 'insensitive' } },
          { receita: { contains: 'COTA', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'COTA', mode: 'insensitive' } },
          { receita: { contains: 'TRANSFERENCIA', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'TRANSFERENCIA', mode: 'insensitive' } },
        ]
      },
      _sum: { valor: true }
    }),
    prisma.receitaArrecadada.aggregate({
      where: {
        ...where,
        OR: [
          { receita: { contains: 'CAPITAL', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'CAPITAL', mode: 'insensitive' } },
          { receita: { contains: 'ALIENACAO', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'ALIENACAO', mode: 'insensitive' } },
          { receita: { contains: 'CREDITO', mode: 'insensitive' } },
          { descricaoReceita: { contains: 'CREDITO', mode: 'insensitive' } },
          { naturezaReceita: { startsWith: '2' } }
        ]
      },
      _sum: { valor: true }
    }),
    prisma.receitaArrecadada.aggregate({
      where: { ...where, OR: [{ receita: { contains: 'IPTU', mode: 'insensitive' } }, { descricaoReceita: { contains: 'IPTU', mode: 'insensitive' } }] },
      _sum: { valor: true }
    }),
    prisma.receitaArrecadada.aggregate({
      where: { ...where, OR: [{ receita: { contains: 'ISS', mode: 'insensitive' } }, { descricaoReceita: { contains: 'ISS', mode: 'insensitive' } }] },
      _sum: { valor: true }
    }),
    prisma.receitaArrecadada.aggregate({
      where: { ...where, OR: [{ receita: { contains: 'FPM', mode: 'insensitive' } }, { descricaoReceita: { contains: 'FPM', mode: 'insensitive' } }] },
      _sum: { valor: true }
    }),
    prisma.receitaArrecadada.aggregate({
      where: { ...where, OR: [{ receita: { contains: 'ICMS', mode: 'insensitive' } }, { descricaoReceita: { contains: 'ICMS', mode: 'insensitive' } }] },
      _sum: { valor: true }
    }),
    prisma.receitaArrecadada.aggregate({
      where: { ...where, OR: [{ receita: { contains: 'FUNDEB', mode: 'insensitive' } }, { descricaoReceita: { contains: 'FUNDEB', mode: 'insensitive' } }] },
      _sum: { valor: true }
    }),
    prisma.$queryRaw<{ano: number}[]>`
      SELECT DISTINCT EXTRACT(YEAR FROM "dataMovimento")::int AS ano 
      FROM "ReceitaArrecadada" 
      WHERE "dataMovimento" IS NOT NULL 
      ORDER BY ano DESC
    `
  ]);

  return {
    totalArrecadado: agregacaoTotal._sum.valor || 0,
    quantidadeLancamentos: agregacaoTotal._count.id || 0,
    quantidadeFundos: fundosDistintos.length,
    grupos: {
      propria: agregacaoPropria._sum.valor || 0,
      transferencias: agregacaoTransferencias._sum.valor || 0,
      capital: agregacaoCapital._sum.valor || 0,
      detalhes: {
        iptu: agregacaoIPTU._sum.valor || 0,
        iss: agregacaoISS._sum.valor || 0,
        fpm: agregacaoFPM._sum.valor || 0,
        icms: agregacaoICMS._sum.valor || 0,
        fundeb: agregacaoFUNDEB._sum.valor || 0,
      }
    },
    anosDisponiveis: anosBrutos ? anosBrutos.map(a => a.ano) : []
  };
}

export async function listarReceitas(filtros: Record<string, unknown>, page: number = 1, limit: number = 50) {
  const where = construirFiltros(filtros);
  
  const [total, dados] = await Promise.all([
    prisma.receitaArrecadada.count({ where }),
    prisma.receitaArrecadada.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dataMovimento: 'desc' }
    })
  ]);

  return { total, dados, page, totalPages: Math.ceil(total / limit) };
}

export async function evolucaoAnual(filtros: Record<string, unknown>) {
  const where = construirFiltros(filtros);
  
  const dados = await prisma.receitaArrecadada.groupBy({
    by: ['exercicio'],
    where,
    _sum: {
      valor: true,
    },
    orderBy: {
      exercicio: 'asc'
    }
  });

  return dados.map(d => ({
    exercicio: d.exercicio,
    valor: d._sum.valor || 0
  }));
}

export async function agrupamento(filtros: Record<string, unknown>, groupByField: Prisma.ReceitaArrecadadaScalarFieldEnum) {
  const where = construirFiltros(filtros);
  
  const dados = await prisma.receitaArrecadada.groupBy({
    by: [groupByField],
    where,
    _sum: {
      valor: true,
    },
    orderBy: {
      _sum: {
        valor: 'desc'
      }
    }
  });

  return dados.map(d => ({
    chave: d[groupByField],
    valor: d._sum.valor || 0
  }));
}

function construirFiltros(filtros: Record<string, unknown>): Prisma.ReceitaArrecadadaWhereInput {
  const where: Prisma.ReceitaArrecadadaWhereInput = {};

  if ((filtros.exercicioInicial as string | undefined) || (filtros.exercicioFinal as string | undefined)) {
    where.exercicio = {};
    if (filtros.exercicioInicial) where.exercicio.gte = parseInt(filtros.exercicioInicial as string);
    if (filtros.exercicioFinal) where.exercicio.lte = parseInt(filtros.exercicioFinal as string);
  }

  if (filtros.naturezaReceita as string | undefined) {
    where.naturezaReceita = { contains: filtros.naturezaReceita as string, mode: 'insensitive' };
  }
  
  if (filtros.unidadeOrcamentaria as string | undefined) {
    where.unidadeOrcamentaria = filtros.unidadeOrcamentaria as string;
  }
  
  if (filtros.codigoFundo as string | undefined) {
    where.codigoFundo = filtros.codigoFundo as string;
  }
  
  if (filtros.pesquisa as string | undefined) {
    where.OR = [
      { descricaoReceita: { contains: filtros.pesquisa as string, mode: 'insensitive' } },
      { receita: { contains: filtros.pesquisa as string } },
      { naturezaReceita: { contains: filtros.pesquisa as string } }
    ];
  }

  return where;
}
