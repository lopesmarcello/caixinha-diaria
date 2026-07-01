import { NextResponse } from "next/server";
import { undoLastDeposit } from "@/lib/queries";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const result = undoLastDeposit(id);
  if ("error" in result) {
    return NextResponse.json({ error: "Caixinha não encontrada" }, { status: 404 });
  }

  return NextResponse.json(result);
}
