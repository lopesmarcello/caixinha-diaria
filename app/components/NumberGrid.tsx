"use client";

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
  const numbers = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-10 gap-1 sm:grid-cols-12">
      {numbers.map((n) => {
        const isDeposited = depositedValues.has(n);
        const isDrawn = n === drawnValue;
        const isSelectable = onSelect != null && !isDeposited && !isDrawn;

        const className = [
          "flex aspect-square items-center justify-center rounded-md font-mono text-[10px] font-medium sm:text-xs",
          isDrawn
            ? "animate-pulse border-2 border-amber-500 bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200"
            : isDeposited
            ? "bg-green-500 text-white"
            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
          isSelectable
            ? "cursor-pointer transition hover:bg-amber-100 hover:text-amber-800 hover:ring-2 hover:ring-amber-400 dark:hover:bg-amber-500/20 dark:hover:text-amber-200"
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
            onClick={() => onSelect(n)}
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
