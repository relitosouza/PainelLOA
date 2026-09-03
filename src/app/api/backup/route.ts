import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "backup-db.sh");
    const { stdout, stderr } = await execAsync(`bash "${scriptPath}"`);

    const filenameMatch = stdout.match(/painel_loa_backup_[0-9_]+\.sql(\.gz)?/);
    const backupFile = filenameMatch ? filenameMatch[0] : "painel_loa_backup.sql.gz";

    return NextResponse.json({
      success: true,
      message: "Backup realizado com sucesso!",
      backupFile,
      log: stdout || stderr,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Erro ao executar backup do banco:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao gerar backup do banco de dados.",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
