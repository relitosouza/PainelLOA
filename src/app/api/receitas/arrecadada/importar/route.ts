import { NextRequest, NextResponse } from 'next/server';
import { processarArquivoReceitas } from '@/lib/services/importacaoReceitas';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const usuario = formData.get('usuario') as string | null;
    const exercicio = formData.get('exercicio') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resultado = await processarArquivoReceitas(buffer, file.name, file.type || 'application/octet-stream', {
      usuarioResponsavel: usuario || undefined,
      exercicioReferencia: exercicio ? parseInt(exercicio) : undefined
    });

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error('Erro na rota de importação:', error);
    return NextResponse.json({ error: 'Erro interno ao processar arquivo' }, { status: 500 });
  }
}
