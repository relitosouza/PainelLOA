import { NextRequest, NextResponse } from 'next/server';
import { desfazerImportacao } from '@/lib/services/importacaoReceitas';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resultado = await desfazerImportacao(id);
    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.mensagem }, { status: 404 });
    }
    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error('Erro ao desfazer importação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
