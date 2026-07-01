import { NextResponse } from "next/server";
import { createCaixinha, listCaixinhas } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  return NextResponse.json(await listCaixinhas(supabase, user.id));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { name, total_days } = body as { name?: unknown; total_days?: unknown };

  if (typeof name !== "string" || name.trim().length === 0 || name.length > 60) {
    return NextResponse.json(
      { error: "name deve ser uma string não vazia de até 60 caracteres" },
      { status: 400 }
    );
  }

  if (
    typeof total_days !== "number" ||
    !Number.isInteger(total_days) ||
    total_days < 1 ||
    total_days > 365
  ) {
    return NextResponse.json(
      { error: "total_days deve ser um inteiro entre 1 e 365" },
      { status: 400 }
    );
  }

  const caixinha = await createCaixinha(supabase, user.id, name.trim(), total_days);
  return NextResponse.json(caixinha, { status: 201 });
}
