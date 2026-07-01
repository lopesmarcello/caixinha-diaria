"use client";

export default function NumberGrid({
  totalDays,
  depositedValues,
  drawnValue,
}: {
  totalDays: number;
  depositedValues: Set<number>;
  drawnValue: number | null;
}) {
  const numbers = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
      {numbers.map((n) => {
        const isDeposited = depositedValues.has(n);
        const isDrawn = n === drawnValue;

        return (
          <div
            key={n}
            className={[
              "flex aspect-square items-center justify-center rounded-lg font-mono text-xs font-medium sm:text-sm",
              isDrawn
                ? "animate-pulse border-2 border-amber-500 bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200"
                : isDeposited
                ? "bg-green-500 text-white"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
            ].join(" ")}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
}
