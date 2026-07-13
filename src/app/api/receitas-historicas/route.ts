import { NextRequest, NextResponse } from 'next/server';
import { listarReceitas } from '@/lib/services/consultaReceitas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filtros = Object.fromEntries(searchParams.entries());
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const resultado = await listarReceitas(filtros, page, limit);

    return NextResponse.json(resultado, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao listar receitas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
