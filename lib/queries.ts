import type { SupabaseClient } from "@supabase/supabase-js";

export interface Caixinha {
  id: number;
  name: string;
  total_days: number;
  created_at: string;
  status: "active" | "completed";
  drawn_value: number | null;
}

export interface Deposit {
  id: number;
  value: number;
  deposited_at: string;
}

export interface CaixinhaWithStats extends Caixinha {
  montante_atual: number;
  montante_previsto: number;
  data_prevista: string;
  dias_depositados: number;
  dias_esperados: number;
  dias_pulados: number;
}

export interface CaixinhaDetail extends CaixinhaWithStats {
  deposits: Deposit[];
  available_count: number;
}

const CAIXINHA_COLUMNS = "id, name, total_days, created_at, status, drawn_value";

// Counts full days elapsed since creation, so a brand-new caixinha has 0 expected
// deposits yet — it only becomes "skipped" once a full day passes untouched.
function diasDesdeCriacao(createdAt: string): number {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

function dataPrevista(createdAt: string, totalDays: number): string {
  return new Date(new Date(createdAt).getTime() + totalDays * 86400000).toISOString();
}

function computeStats(caixinha: Caixinha, depositValues: number[]): CaixinhaWithStats {
  const total = depositValues.reduce((sum, v) => sum + v, 0);
  const count = depositValues.length;

  const montante_previsto = (caixinha.total_days * (caixinha.total_days + 1)) / 2;
  const dias_esperados = Math.min(diasDesdeCriacao(caixinha.created_at), caixinha.total_days);
  const dias_pulados = Math.max(0, dias_esperados - count);

  return {
    ...caixinha,
    montante_atual: total,
    montante_previsto,
    data_prevista: dataPrevista(caixinha.created_at, caixinha.total_days),
    dias_depositados: count,
    dias_esperados,
    dias_pulados,
  };
}

function getAvailableNumbers(totalDays: number, depositValues: number[]): number[] {
  const depositedSet = new Set(depositValues);
  const available: number[] = [];
  for (let i = 1; i <= totalDays; i++) {
    if (!depositedSet.has(i)) available.push(i);
  }
  return available;
}

export async function listCaixinhas(
  supabase: SupabaseClient,
  userId: string
): Promise<CaixinhaWithStats[]> {
  const { data: caixinhas, error } = await supabase
    .from("caixinhas")
    .select(CAIXINHA_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  if (!caixinhas || caixinhas.length === 0) return [];

  const ids = caixinhas.map((c) => c.id);
  const { data: deposits, error: depositsError } = await supabase
    .from("deposits")
    .select("caixinha_id, value")
    .in("caixinha_id", ids);
  if (depositsError) throw depositsError;

  const valuesByCaixinha = new Map<number, number[]>();
  for (const d of deposits ?? []) {
    const list = valuesByCaixinha.get(d.caixinha_id) ?? [];
    list.push(d.value);
    valuesByCaixinha.set(d.caixinha_id, list);
  }

  return (caixinhas as Caixinha[]).map((c) =>
    computeStats(c, valuesByCaixinha.get(c.id) ?? [])
  );
}

export async function createCaixinha(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  totalDays: number
): Promise<Caixinha> {
  const { data, error } = await supabase
    .from("caixinhas")
    .insert({ user_id: userId, name, total_days: totalDays })
    .select(CAIXINHA_COLUMNS)
    .single();
  if (error) throw error;
  return data as Caixinha;
}

export async function getCaixinha(
  supabase: SupabaseClient,
  userId: string,
  id: number
): Promise<Caixinha | undefined> {
  const { data, error } = await supabase
    .from("caixinhas")
    .select(CAIXINHA_COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Caixinha) ?? undefined;
}

async function getDepositValues(supabase: SupabaseClient, caixinhaId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from("deposits")
    .select("value")
    .eq("caixinha_id", caixinhaId);
  if (error) throw error;
  return (data ?? []).map((d) => d.value);
}

export async function getCaixinhaDetail(
  supabase: SupabaseClient,
  userId: string,
  id: number
): Promise<CaixinhaDetail | undefined> {
  const caixinha = await getCaixinha(supabase, userId, id);
  if (!caixinha) return undefined;

  const { data: deposits, error } = await supabase
    .from("deposits")
    .select("id, value, deposited_at")
    .eq("caixinha_id", id)
    .order("id", { ascending: true });
  if (error) throw error;

  const stats = computeStats(caixinha, (deposits ?? []).map((d) => d.value));
  const available_count = caixinha.total_days - (deposits?.length ?? 0);

  return { ...stats, deposits: (deposits as Deposit[]) ?? [], available_count };
}

export async function deleteCaixinha(
  supabase: SupabaseClient,
  userId: string,
  id: number
): Promise<void> {
  const { error } = await supabase
    .from("caixinhas")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

type NotFound = { error: "not_found" };

export async function drawNumber(
  supabase: SupabaseClient,
  userId: string,
  id: number
): Promise<{ drawn_value: number } | NotFound | { error: "no_numbers_available" }> {
  const caixinha = await getCaixinha(supabase, userId, id);
  if (!caixinha) return { error: "not_found" };

  const depositValues = await getDepositValues(supabase, id);
  const available = getAvailableNumbers(caixinha.total_days, depositValues);
  if (available.length === 0) return { error: "no_numbers_available" };

  const drawn = available[Math.floor(Math.random() * available.length)];
  const { error } = await supabase
    .from("caixinhas")
    .update({ drawn_value: drawn })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;

  return { drawn_value: drawn };
}

export async function confirmDeposit(
  supabase: SupabaseClient,
  userId: string,
  id: number
): Promise<CaixinhaDetail | NotFound | { error: "no_drawn_value" }> {
  const caixinha = await getCaixinha(supabase, userId, id);
  if (!caixinha) return { error: "not_found" };
  if (caixinha.drawn_value == null) return { error: "no_drawn_value" };

  const { error: insertError } = await supabase
    .from("deposits")
    .insert({ caixinha_id: id, user_id: userId, value: caixinha.drawn_value });
  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("caixinhas")
    .update({ drawn_value: null })
    .eq("id", id)
    .eq("user_id", userId);
  if (updateError) throw updateError;

  const depositValues = await getDepositValues(supabase, id);
  if (depositValues.length >= caixinha.total_days) {
    const { error: statusError } = await supabase
      .from("caixinhas")
      .update({ status: "completed" })
      .eq("id", id)
      .eq("user_id", userId);
    if (statusError) throw statusError;
  }

  return (await getCaixinhaDetail(supabase, userId, id))!;
}

export async function undoLastDeposit(
  supabase: SupabaseClient,
  userId: string,
  id: number
): Promise<CaixinhaDetail | NotFound> {
  const caixinha = await getCaixinha(supabase, userId, id);
  if (!caixinha) return { error: "not_found" };

  const { data: last, error: lastError } = await supabase
    .from("deposits")
    .select("id")
    .eq("caixinha_id", id)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) throw lastError;

  if (last) {
    const { error: deleteError } = await supabase.from("deposits").delete().eq("id", last.id);
    if (deleteError) throw deleteError;
  }

  if (caixinha.status === "completed") {
    const { error: statusError } = await supabase
      .from("caixinhas")
      .update({ status: "active" })
      .eq("id", id)
      .eq("user_id", userId);
    if (statusError) throw statusError;
  }

  return (await getCaixinhaDetail(supabase, userId, id))!;
}
