"use client";

import Link from "next/link";
import type { CaixinhaWithStats } from "@/lib/queries";
import { formatBRL } from "@/lib/format";

export default function CaixinhaCard({ caixinha }: { caixinha: CaixinhaWithStats }) {
  const progress = Math.min(
    100,
    Math.round((caixinha.montante_atual / caixinha.montante_previsto) * 100)
  );

  return (
    <Link
      href={`/caixinha/${caixinha.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {caixinha.name}
        </h3>
        {caixinha.dias_pulados > 0 && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            {caixinha.dias_pulados} pulado{caixinha.dias_pulados > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
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
  );
}
