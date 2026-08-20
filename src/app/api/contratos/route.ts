import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() {
  const latest = await db.loaImport.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, fileName: true, createdAt: true } });
  if (!latest) return NextResponse.json({ contracts: [], import: null });
  return NextResponse.json({ contracts: await db.contract.findMany({ where: { importId: latest.id }, orderBy: { secretaria: "asc" } }), import: latest });
}
