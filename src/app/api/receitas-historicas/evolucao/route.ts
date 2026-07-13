import { NextRequest, NextResponse } from 'next/server';
import { evolucaoAnual } from '@/lib/services/consultaReceitas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filtros = Object.fromEntries(searchParams.entries());
    
    const resultado = await evolucaoAnual(filtros);

    return NextResponse.json(resultado, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao obter evolucao:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
