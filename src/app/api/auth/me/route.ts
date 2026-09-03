import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const usuario = await db.usuario.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        ativo: true,
        secretaria: true,
        codigoSecretaria: true,
        cargo: true,
        telefone: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user: usuario });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
