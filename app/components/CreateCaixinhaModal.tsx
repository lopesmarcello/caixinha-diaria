"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/format";
import type { Caixinha } from "@/lib/queries";

export default function CreateCaixinhaModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (caixinha: Caixinha) => void;
}) {
  const [name, setName] = useState("");
  const [totalDays, setTotalDays] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewTotal = Number.isFinite(totalDays) && totalDays > 0
    ? (totalDays * (totalDays + 1)) / 2
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length === 0) {
      setError("Informe um nome para a caixinha.");
      return;
    }
    if (!Number.isInteger(totalDays) || totalDays < 1 || totalDays > 365) {
      setError("O número de dias deve ser um inteiro entre 1 e 365.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/caixinhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), total_days: totalDays }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Não foi possível criar a caixinha.");
      }
      const caixinha = (await res.json()) as Caixinha;
      onCreated(caixinha);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Nova caixinha
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome</span>
            <input
              type="text"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem 2026"
              className="h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Número de dias
            </span>
            <input
              type="number"
              min={1}
              max={365}
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
              className="h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </label>

          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Você vai guardar até <strong>{formatBRL(previewTotal)}</strong> em{" "}
            {totalDays || 0} dias.
          </p>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-xl border border-zinc-300 font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-12 flex-1 rounded-xl bg-amber-500 font-medium text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {submitting ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
