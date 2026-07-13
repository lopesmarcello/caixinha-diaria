import { NextResponse } from "next/server";
import { selectNumber } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { value } = body as { value?: unknown };
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return NextResponse.json(
      { error: "value deve ser um inteiro positivo" },
      { status: 400 }
    );
  }

  const result = await selectNumber(supabase, user.id, id, value);
  if ("error" in result) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Caixinha não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Número indisponível" }, { status: 409 });
  }

  return NextResponse.json(result);
}
