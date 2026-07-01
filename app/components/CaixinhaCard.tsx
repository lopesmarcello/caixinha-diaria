"use client";

import { useState } from "react";
import Link from "next/link";
import ConfirmModal from "./ConfirmModal";
import type { CaixinhaWithStats } from "@/lib/queries";
import { formatBRL } from "@/lib/format";

export default function CaixinhaCard({
  caixinha,
  onDelete,
}: {
  caixinha: CaixinhaWithStats;
  onDelete: (id: number) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const progress = Math.min(
    100,
    Math.round((caixinha.montante_atual / caixinha.montante_previsto) * 100)
  );

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmingDelete(true);
  }

  return (
    <>
      <Link
        href={`/caixinha/${caixinha.id}`}
        className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {caixinha.name}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            {caixinha.dias_pulados > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                {caixinha.dias_pulados} pulado{caixinha.dias_pulados > 1 ? "s" : ""}
              </span>
            )}
            <button
              type="button"
              onClick={handleDeleteClick}
              aria-label="Excluir caixinha"
              className="rounded-lg p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            {formatBRL(caixinha.montante_atual)} / {formatBRL(caixinha.montante_previsto)}
          </span>
          <span>
            {caixinha.dias_depositados}/{caixinha.total_days} dias
          </span>
        </div>
      </Link>

      {confirmingDelete && (
        <ConfirmModal
          title="Excluir caixinha"
          message={`Excluir a caixinha "${caixinha.name}"? Essa ação não pode ser desfeita.`}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete(caixinha.id);
          }}
        />
      )}
    </>
  );
}
