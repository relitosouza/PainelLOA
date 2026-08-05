import { NextRequest, NextResponse } from 'next/server';
import { validarArquivoReceitas } from '@/lib/services/importacaoReceitas';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resultado = await validarArquivoReceitas(buffer);

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error('Erro na validação:', error);
    return NextResponse.json({ error: 'Erro interno ao validar arquivo' }, { status: 500 });
  }
}
