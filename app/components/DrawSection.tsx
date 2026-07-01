"use client";

import { useState } from "react";
import confetti from "canvas-confetti";

export default function DrawSection({
  drawnValue,
  availableCount,
  onDraw,
  onDeposit,
}: {
  drawnValue: number | null;
  availableCount: number;
  onDraw: () => Promise<void>;
  onDeposit: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<"draw" | "deposit" | null>(null);

  async function handleDraw() {
    setBusy("draw");
    try {
      await onDraw();
    } finally {
      setBusy(null);
    }
  }

  async function handleDeposit() {
    setBusy("deposit");
    try {
      await onDeposit();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    } finally {
      setBusy(null);
    }
  }

  if (availableCount === 0) {
    return (
      <div className="rounded-2xl bg-green-50 p-6 text-center dark:bg-green-950">
        <p className="text-lg font-semibold text-green-800 dark:text-green-300">
          Parabéns! Você completou a caixinha 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl p-6 text-center">
      {drawnValue === null ? (
        <button
          onClick={handleDraw}
          disabled={busy !== null}
          className="h-12 w-full max-w-xs rounded-xl bg-teal-500 px-6 font-medium text-white transition hover:bg-teal-600 disabled:opacity-60"
        >
          {busy === "draw" ? "Sorteando..." : "Sortear o número de hoje"}
        </button>
      ) : (
        <>
          <span className="font-mono text-6xl font-bold text-amber-600 dark:text-amber-300">
            {drawnValue}
          </span>
          <div className="flex w-full max-w-xs flex-col gap-3 sm:flex-row">
            <button
              onClick={handleDeposit}
              disabled={busy !== null}
              className="h-12 flex-1 rounded-xl bg-green-600 font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {busy === "deposit" ? "Depositando..." : `Depositei R$ ${drawnValue}`}
            </button>
            <button
              onClick={handleDraw}
              disabled={busy !== null}
              className="h-12 flex-1 rounded-xl border border-amber-400 font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              {busy === "draw" ? "Sorteando..." : "Tentar novamente"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
