import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// GET: Lista todos os arquivos de backup disponíveis
export async function GET() {
  try {
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ backups: [] });
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter((file) => file.startsWith("painel_loa_backup_") && (file.endsWith(".sql.gz") || file.endsWith(".sql")))
      .map((file) => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
          sizeBytes: stats.size,
          createdAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ backups });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: "Erro ao listar backups", details: err.message }, { status: 500 });
  }
}

// POST: Executa restauração a partir do arquivo selecionado
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { filename, password } = body;

    const expectedPassword = process.env.RESTORE_SECURITY_PASSWORD || "Admin@LOA2027#Osasco";
    if (!password || password.trim() !== expectedPassword.trim()) {
      return NextResponse.json(
        { error: "Senha de segurança incorreta. Acesso negado para restauração do banco." },
        { status: 403 }
      );
    }

    if (!filename) {
      return NextResponse.json({ error: "Nome do arquivo de backup não fornecido." }, { status: 400 });
    }

    // Sanitização de segurança contra Path Traversal
    const safeFilename = path.basename(filename);
    const backupFilePath = path.join(process.cwd(), "backups", safeFilename);

    if (!fs.existsSync(backupFilePath)) {
      return NextResponse.json({ error: "Arquivo de backup não encontrado no servidor." }, { status: 404 });
    }

    const scriptPath = path.join(process.cwd(), "scripts", "restore-db.sh");
    // Executa em modo não-interativo passando confirmação via echo
    const { stdout, stderr } = await execAsync(`echo "s" | bash "${scriptPath}" "${backupFilePath}"`);

    return NextResponse.json({
      success: true,
      message: "Base de dados restaurada com sucesso!",
      backupFile: safeFilename,
      log: stdout || stderr,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro ao restaurar backup do banco:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao restaurar banco de dados.",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
