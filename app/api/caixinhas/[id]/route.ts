import { NextResponse } from "next/server";
import { deleteCaixinha, getCaixinhaDetail } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) ? id : null;
}

export async function GET(
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
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const detail = await getCaixinhaDetail(supabase, user.id, id);
  if (!detail) {
    return NextResponse.json({ error: "Caixinha não encontrada" }, { status: 404 });
  }

  return NextResponse.json(detail);
}

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
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const detail = await getCaixinhaDetail(supabase, user.id, id);
  if (!detail) {
    return NextResponse.json({ error: "Caixinha não encontrada" }, { status: 404 });
  }

  await deleteCaixinha(supabase, user.id, id);
  return new NextResponse(null, { status: 204 });
}
