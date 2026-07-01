"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import DrawSection from "@/app/components/DrawSection";
import NumberGrid from "@/app/components/NumberGrid";
import StatsPanel from "@/app/components/StatsPanel";
import CompletionOverlay from "@/app/components/CompletionOverlay";
import { fetcher } from "@/lib/fetcher";
import type { CaixinhaDetail } from "@/lib/queries";

export default function CaixinhaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, mutate, isLoading } = useSWR<CaixinhaDetail>(
    params.id ? `/api/caixinhas/${params.id}` : null,
    fetcher
  );
  const [dismissedCompletion, setDismissedCompletion] = useState(false);

  async function handleDraw() {
    await fetch(`/api/caixinhas/${params.id}/draw`, { method: "POST" });
    await mutate();
  }

  async function handleDeposit() {
    await fetch(`/api/caixinhas/${params.id}/deposit`, { method: "POST" });
    setDismissedCompletion(false);
    await mutate();
  }

  async function handleUndo() {
    await fetch(`/api/caixinhas/${params.id}/deposit/last`, { method: "DELETE" });
    await mutate();
  }

  if (isLoading || !data) {
    return (
      <p className="mx-auto mt-16 text-center text-zinc-500 dark:text-zinc-400">
        Carregando...
      </p>
    );
  }

  const depositedValues = new Set(data.deposits.map((d) => d.value));
  const lastDeposit = data.deposits[data.deposits.length - 1] ?? null;
  const showCompletion = data.status === "completed" && !dismissedCompletion;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <button
        onClick={() => router.push("/")}
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Voltar
      </button>
      <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {data.name}
      </h1>

      <div className="mt-6">
        <DrawSection
          drawnValue={data.drawn_value}
          availableCount={data.available_count}
          onDraw={handleDraw}
          onDeposit={handleDeposit}
        />
      </div>

      <div className="mt-6">
        <NumberGrid
          totalDays={data.total_days}
          depositedValues={depositedValues}
          drawnValue={data.drawn_value}
        />
      </div>

      <div className="mt-6">
        <StatsPanel
          montanteAtual={data.montante_atual}
          montantePrevisto={data.montante_previsto}
          diasDepositados={data.dias_depositados}
          totalDays={data.total_days}
          dataPrevista={data.data_prevista}
          diasPulados={data.dias_pulados}
          hasDeposits={data.deposits.length > 0}
          onUndo={handleUndo}
        />
      </div>

      {showCompletion && (
        <CompletionOverlay
          montanteAtual={data.montante_atual}
          createdAt={data.created_at}
          lastDepositAt={lastDeposit?.deposited_at ?? null}
          onClose={() => setDismissedCompletion(true)}
        />
      )}
    </div>
  );
}
