"use client";

import { useState } from "react";
import { formatBRL, formatDate } from "@/lib/format";

export default function StatsPanel({
  montanteAtual,
  montantePrevisto,
  diasDepositados,
  totalDays,
  dataPrevista,
  diasPulados,
  hasDeposits,
  onUndo,
}: {
  montanteAtual: number;
  montantePrevisto: number;
  diasDepositados: number;
  totalDays: number;
  dataPrevista: string;
  diasPulados: number;
  hasDeposits: boolean;
  onUndo: () => Promise<void>;
}) {
  const [undoing, setUndoing] = useState(false);

  async function handleUndo() {
    setUndoing(true);
    try {
      await onUndo();
    } finally {
      setUndoing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Montante atual</dt>
          <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {formatBRL(montanteAtual)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Montante previsto</dt>
          <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {formatBRL(montantePrevisto)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Progresso</dt>
          <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {diasDepositados} / {totalDays}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Data prevista</dt>
          <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {formatDate(dataPrevista)}
          </dd>
        </div>
      </dl>

      {diasPulados > 0 && (
        <span className="mt-4 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
          {diasPulados} dia{diasPulados > 1 ? "s" : ""} pulado{diasPulados > 1 ? "s" : ""}
        </span>
      )}

      {hasDeposits && (
        <button
          onClick={handleUndo}
          disabled={undoing}
          className="mt-4 block text-sm text-zinc-400 underline transition hover:text-zinc-600 disabled:opacity-60 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          {undoing ? "Desfazendo..." : "Desfazer último depósito"}
        </button>
      )}
    </div>
  );
}
