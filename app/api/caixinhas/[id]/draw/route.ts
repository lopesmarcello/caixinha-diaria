import { NextResponse } from "next/server";
import { drawNumber } from "@/lib/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const result = drawNumber(id);
  if ("error" in result) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Caixinha não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Não há números disponíveis" }, { status: 409 });
  }

  return NextResponse.json(result);
}
