import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Informe o e-mail e a senha de acesso." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const usuario = await db.usuario.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciais inválidas. Usuário não encontrado." },
        { status: 401 }
      );
    }

    if (!usuario.ativo) {
      return NextResponse.json(
        { error: "Acesso inativo. Entre em contato com a equipe de administração." },
        { status: 403 }
      );
    }

    // Verificar Hash da senha
    const inputHash = hashPassword(password);
    if (usuario.senhaHash && usuario.senhaHash !== inputHash) {
      return NextResponse.json(
        { error: "Senha incorreta. Verifique os dados digitados." },
        { status: 401 }
      );
    }

    // Atualizar último acesso
    await db.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcesso: new Date() },
    });

    const userPayload = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      secretaria: usuario.secretaria,
      codigoSecretaria: usuario.codigoSecretaria,
      cargo: usuario.cargo,
      telefone: usuario.telefone,
    };

    const token = signSession({
      id: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
      nome: usuario.nome,
    });

    const response = NextResponse.json({
      success: true,
      user: userPayload,
    });

    // Set HTTP-only Cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar autenticação." },
      { status: 500 }
    );
  }
}
