import { NextRequest, NextResponse } from 'next/server';
import { processarArquivoReceitas } from '@/lib/services/importacaoReceitas';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const nomeArquivo = file.name;
    const tipoArquivo = file.type || 'application/octet-stream';

    // Para evitar timeout longo (Next.js serverless functions têm limite de tempo),
    // o ideal seria uma job queue, mas como a estrutura é básica, faremos de forma síncrona aguardando o processamento.
    const resultado = await processarArquivoReceitas(buffer, nomeArquivo, tipoArquivo);

    return NextResponse.json(resultado, { status: 200 });
  } catch (error: any) {
    console.error('Erro na rota de importação:', error);
    return NextResponse.json({ error: 'Erro interno ao processar arquivo' }, { status: 500 });
  }
}
