"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { formatBRL, formatDate } from "@/lib/format";

export default function CompletionOverlay({
  montanteAtual,
  createdAt,
  lastDepositAt,
  onClose,
}: {
  montanteAtual: number;
  createdAt: string;
  lastDepositAt: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Caixinha concluída!
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Total guardado: <strong>{formatBRL(montanteAtual)}</strong>
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          {formatDate(createdAt)} até{" "}
          {lastDepositAt ? formatDate(lastDepositAt) : formatDate(createdAt)}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onClose}
            className="h-12 rounded-xl bg-teal-500 font-medium text-white transition hover:bg-teal-600"
          >
            Ver detalhes
          </button>
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-xl border border-zinc-300 font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Criar nova caixinha
          </Link>
        </div>
      </div>
    </div>
  );
}
