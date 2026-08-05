import { NextRequest, NextResponse } from 'next/server';
import { obterResumo, evolucaoAnual, agrupamento } from '@/lib/services/consultaReceitas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filtros = Object.fromEntries(searchParams.entries());

    const [resumo, evolucao, porVinculo, porNatureza, porFundo, porMes] = await Promise.all([
      obterResumo(filtros),
      evolucaoAnual(filtros),
      agrupamento(filtros, 'vinculo'),
      agrupamento(filtros, 'naturezaReceita'),
      agrupamento(filtros, 'codigoFundo'),
      fetch(`${req.url.replace('/dashboard', '')}/por-mes?${searchParams.toString()}`).then(r => r.json()).catch(() => [])
    ]);

    return NextResponse.json({
      resumo,
      evolucao,
      porVinculo,
      porNatureza,
      porFundo,
      porMes
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
