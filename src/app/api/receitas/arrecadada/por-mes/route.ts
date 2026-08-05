import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exercicio = searchParams.get('exercicio') || searchParams.get('exercicioInicial');
    
    let query = `
      SELECT 
        EXTRACT(MONTH FROM "dataMovimento")::int AS mes,
        EXTRACT(YEAR FROM "dataMovimento")::int AS ano,
        SUM("valor")::float AS valor
      FROM "ReceitaArrecadada"
      WHERE "dataMovimento" IS NOT NULL
    `;
    if (exercicio) {
      query += ` AND EXTRACT(YEAR FROM "dataMovimento")::int = ${parseInt(exercicio)}`;
    }
    query += `
      GROUP BY EXTRACT(YEAR FROM "dataMovimento"), EXTRACT(MONTH FROM "dataMovimento")
      ORDER BY ano DESC, mes ASC
    `;

    const dados = await db.$queryRawUnsafe<{mes: number, ano: number, valor: number}>(query);

    return NextResponse.json(dados || [], { status: 200 });
  } catch (error) {
    console.error('Erro ao obter evolução mensal:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
