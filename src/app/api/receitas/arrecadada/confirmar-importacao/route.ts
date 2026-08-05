import { NextRequest, NextResponse } from 'next/server';
import { confirmarImportacao } from '@/lib/services/importacaoReceitas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { arquivoImportacaoId } = body;

    if (!arquivoImportacaoId) {
      return NextResponse.json({ error: 'ID da importação não informado' }, { status: 400 });
    }

    const resultado = await confirmarImportacao(arquivoImportacaoId);
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error('Erro ao confirmar importação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
