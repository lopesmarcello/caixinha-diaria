import { NextResponse } from "next/server";
import { undoLastDeposit } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const result = await undoLastDeposit(supabase, user.id, id);
  if ("error" in result) {
    return NextResponse.json({ error: "Caixinha não encontrada" }, { status: 404 });
  }

  return NextResponse.json(result);
}
