"use client";

import { useState } from "react";

export default function NumberGrid({
  totalDays,
  depositedValues,
  drawnValue,
  onSelect,
}: {
  totalDays: number;
  depositedValues: Set<number>;
  drawnValue: number | null;
  onSelect?: (value: number) => Promise<void>;
}) {
  const [pending, setPending] = useState<number | null>(null);
  const numbers = Array.from({ length: totalDays }, (_, i) => i + 1);

  async function handleSelect(value: number) {
    if (!onSelect || pending !== null) return;
    setPending(value);
    try {
      await onSelect(value);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10 sm:gap-1 md:grid-cols-12">
      {numbers.map((n) => {
        const isDeposited = depositedValues.has(n);
        const isDrawn = n === drawnValue;
        const isPending = n === pending;
        const isSelectable = onSelect != null && !isDeposited && !isDrawn;

        const className = [
          "flex aspect-square select-none items-center justify-center rounded-md font-mono text-sm font-medium sm:text-xs",
          isDrawn || isPending
            ? "animate-pulse border-2 border-amber-500 bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200"
            : isDeposited
            ? "bg-green-500 text-white"
            : isSelectable
            ? "bg-white text-zinc-700 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600"
            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
          isSelectable && !isPending
            ? "cursor-pointer touch-manipulation transition active:scale-95 active:bg-amber-100 active:text-amber-900 active:ring-2 active:ring-amber-400 hover:bg-amber-100 hover:text-amber-800 hover:ring-2 hover:ring-amber-400 dark:active:bg-amber-500/20 dark:active:text-amber-200 dark:hover:bg-amber-500/20 dark:hover:text-amber-200"
            : "",
        ].join(" ");

        if (!isSelectable) {
          return (
            <div key={n} className={className}>
              {n}
            </div>
          );
        }

        return (
          <button
            key={n}
            type="button"
            onClick={() => handleSelect(n)}
            disabled={pending !== null}
            aria-label={`Escolher o número ${n}`}
            className={className}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
