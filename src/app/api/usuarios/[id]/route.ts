import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const usuarioUpdateSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("E-mail inválido").optional(),
  papel: z.enum(["ADMIN", "PLANEJAMENTO", "TECNICO_SECRETARIA", "LEITURA"]).optional(),
  secretaria: z.string().optional().nullable(),
  codigoSecretaria: z.string().optional().nullable(),
  cargo: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = usuarioUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    let codigoSecretaria = data.codigoSecretaria;
    if (data.secretaria && !codigoSecretaria) {
      const match = data.secretaria.match(/^(\d+)/);
      if (match) {
        codigoSecretaria = match[1];
      }
    }

    const usuarioAtualizado = await db.usuario.update({
      where: { id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase().trim() } : {}),
        ...(data.papel !== undefined ? { papel: data.papel } : {}),
        ...(data.secretaria !== undefined ? { secretaria: data.secretaria?.trim() || null } : {}),
        ...(codigoSecretaria !== undefined ? { codigoSecretaria: codigoSecretaria || null } : {}),
        ...(data.cargo !== undefined ? { cargo: data.cargo?.trim() || null } : {}),
        ...(data.telefone !== undefined ? { telefone: data.telefone?.trim() || null } : {}),
        ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
      },
    });

    return NextResponse.json({ success: true, usuario: usuarioAtualizado });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao atualizar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar se possui alterações vinculadas
    const userWithCounts = await db.usuario.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            alteracoesRealizadas: true,
            exclusoesRealizadas: true,
          },
        },
      },
    });

    if (!userWithCounts) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Se já tiver histórico de alterações, desativar (soft delete) para manter integridade da auditoria
    if (
      userWithCounts._count.alteracoesRealizadas > 0 ||
      userWithCounts._count.exclusoesRealizadas > 0
    ) {
      const desativado = await db.usuario.update({
        where: { id },
        data: { ativo: false },
      });
      return NextResponse.json({
        success: true,
        message: "Usuário desativado para preservar o histórico de auditoria.",
        usuario: desativado,
      });
    }

    // Se não tiver registros dependentes, excluir definitivamente
    await db.usuario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Usuário excluído com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao excluir usuário" },
      { status: 500 }
    );
  }
}
