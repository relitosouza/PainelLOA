import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { z } from "zod";

const usuarioCreateSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  papel: z.enum(["ADMIN", "PLANEJAMENTO", "TECNICO_SECRETARIA", "LEITURA"]).default("TECNICO_SECRETARIA"),
  secretaria: z.string().optional().nullable(),
  codigoSecretaria: z.string().optional().nullable(),
  cargo: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secretaria = searchParams.get("secretaria");
    const papel = searchParams.get("papel") as Prisma.EnumPapelUsuarioFilter | undefined;
    const ativoParam = searchParams.get("ativo");

    const where: Prisma.UsuarioWhereInput = {};
    if (secretaria) {
      where.OR = [
        { secretaria: { contains: secretaria, mode: "insensitive" } },
        { codigoSecretaria: secretaria },
      ];
    }
    if (papel) {
      where.papel = papel;
    }
    if (ativoParam !== null && ativoParam !== undefined) {
      where.ativo = ativoParam === "true";
    }

    const usuarios = await db.usuario.findMany({
      where,
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
        ultimoAcesso: true,
        criadoEm: true,
        _count: {
          select: {
            alteracoesRealizadas: true,
            exclusoesRealizadas: true,
          },
        },
      },
      orderBy: [{ papel: "asc" }, { nome: "asc" }],
    });

    return NextResponse.json({ success: true, count: usuarios.length, usuarios });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao consultar usuários" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = usuarioCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Se informou secretaria, extrair o código se estiver no padrão "11 - SECRETARIA..."
    let codigoSecretaria = data.codigoSecretaria;
    if (data.secretaria && !codigoSecretaria) {
      const match = data.secretaria.match(/^(\d+)/);
      if (match) {
        codigoSecretaria = match[1];
      }
    }

    const usuarioExistente = await db.usuario.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { success: false, error: "Já existe um usuário cadastrado com este e-mail" },
        { status: 409 }
      );
    }

    const novoUsuario = await db.usuario.create({
      data: {
        nome: data.nome.trim(),
        email: data.email.toLowerCase().trim(),
        papel: data.papel,
        secretaria: data.secretaria?.trim() || null,
        codigoSecretaria: codigoSecretaria || null,
        cargo: data.cargo?.trim() || null,
        telefone: data.telefone?.trim() || null,
        ativo: data.ativo,
      },
    });

    return NextResponse.json(
      {
        success: true,
        usuario: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          papel: novoUsuario.papel,
          secretaria: novoUsuario.secretaria,
          codigoSecretaria: novoUsuario.codigoSecretaria,
          ativo: novoUsuario.ativo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao cadastrar usuário" },
      { status: 500 }
    );
  }
}
