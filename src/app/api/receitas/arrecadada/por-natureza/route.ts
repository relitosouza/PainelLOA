import { NextRequest, NextResponse } from 'next/server';
import { agrupamento } from '@/lib/services/consultaReceitas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filtros = Object.fromEntries(searchParams.entries());
    const dados = await agrupamento(filtros, 'naturezaReceita');
    return NextResponse.json(dados, { status: 200 });
  } catch (error) {
    console.error('Erro ao agrupar por natureza:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
