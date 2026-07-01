import { db } from "./db";

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

function toUtcDate(sqliteDateTime: string): Date {
  return new Date(sqliteDateTime.replace(" ", "T") + "Z");
}

// Counts full days elapsed since creation, so a brand-new caixinha has 0 expected
// deposits yet — it only becomes "skipped" once a full day passes untouched.
function diasDesdeCriacao(createdAt: string): number {
  const created = toUtcDate(createdAt);
  const diffMs = Date.now() - created.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

function dataPrevista(createdAt: string, totalDays: number): string {
  const created = toUtcDate(createdAt);
  return new Date(created.getTime() + totalDays * 86400000).toISOString();
}

function withStats(caixinha: Caixinha): CaixinhaWithStats {
  const { total, count } = db
    .prepare(
      "SELECT COALESCE(SUM(value), 0) as total, COUNT(*) as count FROM deposits WHERE caixinha_id = ?"
    )
    .get(caixinha.id) as { total: number; count: number };

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

export function listCaixinhas(): CaixinhaWithStats[] {
  const rows = db.prepare("SELECT * FROM caixinhas ORDER BY created_at DESC, id DESC").all() as Caixinha[];
  return rows.map(withStats);
}

export function createCaixinha(name: string, totalDays: number): Caixinha {
  const info = db
    .prepare("INSERT INTO caixinhas (name, total_days) VALUES (?, ?)")
    .run(name, totalDays);
  return db.prepare("SELECT * FROM caixinhas WHERE id = ?").get(info.lastInsertRowid) as Caixinha;
}

export function getCaixinha(id: number): Caixinha | undefined {
  return db.prepare("SELECT * FROM caixinhas WHERE id = ?").get(id) as Caixinha | undefined;
}

export function getCaixinhaDetail(id: number): CaixinhaDetail | undefined {
  const caixinha = getCaixinha(id);
  if (!caixinha) return undefined;

  const stats = withStats(caixinha);
  const deposits = db
    .prepare("SELECT id, value, deposited_at FROM deposits WHERE caixinha_id = ? ORDER BY id ASC")
    .all(id) as Deposit[];
  const available_count = caixinha.total_days - deposits.length;

  return { ...stats, deposits, available_count };
}

export function deleteCaixinha(id: number): void {
  db.prepare("DELETE FROM caixinhas WHERE id = ?").run(id);
}

function getAvailableNumbers(id: number, totalDays: number): number[] {
  const deposited = db
    .prepare("SELECT value FROM deposits WHERE caixinha_id = ?")
    .all(id) as { value: number }[];
  const depositedSet = new Set(deposited.map((d) => d.value));
  const available: number[] = [];
  for (let i = 1; i <= totalDays; i++) {
    if (!depositedSet.has(i)) available.push(i);
  }
  return available;
}

type NotFound = { error: "not_found" };

export function drawNumber(id: number): { drawn_value: number } | NotFound | { error: "no_numbers_available" } {
  const caixinha = getCaixinha(id);
  if (!caixinha) return { error: "not_found" };

  const available = getAvailableNumbers(id, caixinha.total_days);
  if (available.length === 0) return { error: "no_numbers_available" };

  const drawn = available[Math.floor(Math.random() * available.length)];
  db.prepare("UPDATE caixinhas SET drawn_value = ? WHERE id = ?").run(drawn, id);
  return { drawn_value: drawn };
}

export function confirmDeposit(id: number): CaixinhaDetail | NotFound | { error: "no_drawn_value" } {
  const caixinha = getCaixinha(id);
  if (!caixinha) return { error: "not_found" };
  if (caixinha.drawn_value == null) return { error: "no_drawn_value" };

  const drawnValue = caixinha.drawn_value;
  const run = db.transaction(() => {
    db.prepare("INSERT INTO deposits (caixinha_id, value) VALUES (?, ?)").run(id, drawnValue);
    db.prepare("UPDATE caixinhas SET drawn_value = NULL WHERE id = ?").run(id);
    const { c } = db
      .prepare("SELECT COUNT(*) as c FROM deposits WHERE caixinha_id = ?")
      .get(id) as { c: number };
    if (c >= caixinha.total_days) {
      db.prepare("UPDATE caixinhas SET status = 'completed' WHERE id = ?").run(id);
    }
  });
  run();

  return getCaixinhaDetail(id)!;
}

export function undoLastDeposit(id: number): CaixinhaDetail | NotFound {
  const caixinha = getCaixinha(id);
  if (!caixinha) return { error: "not_found" };

  const run = db.transaction(() => {
    const last = db
      .prepare("SELECT id FROM deposits WHERE caixinha_id = ? ORDER BY id DESC LIMIT 1")
      .get(id) as { id: number } | undefined;
    if (last) {
      db.prepare("DELETE FROM deposits WHERE id = ?").run(last.id);
    }
    if (caixinha.status === "completed") {
      db.prepare("UPDATE caixinhas SET status = 'active' WHERE id = ?").run(id);
    }
  });
  run();

  return getCaixinhaDetail(id)!;
}
