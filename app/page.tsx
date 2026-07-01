"use client";

import { useState } from "react";
import useSWR from "swr";
import CaixinhaCard from "./components/CaixinhaCard";
import CreateCaixinhaModal from "./components/CreateCaixinhaModal";
import { fetcher } from "@/lib/fetcher";
import type { CaixinhaWithStats } from "@/lib/queries";

export default function Home() {
  const { data, isLoading, mutate } = useSWR<CaixinhaWithStats[]>(
    "/api/caixinhas",
    fetcher
  );
  const [showModal, setShowModal] = useState(false);

  const active = data?.filter((c) => c.status === "active") ?? [];
  const completed = data?.filter((c) => c.status === "completed") ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Minhas caixinhas
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="h-12 rounded-xl bg-amber-500 px-5 font-medium text-white transition hover:bg-amber-600"
        >
          Nova caixinha
        </button>
      </div>

      {isLoading && (
        <p className="mt-8 text-center text-zinc-500 dark:text-zinc-400">Carregando...</p>
      )}

      {!isLoading && data && data.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-6xl">🐷</p>
          <p className="text-zinc-600 dark:text-zinc-400">
            Você ainda não tem nenhuma caixinha.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="h-12 rounded-xl bg-amber-500 px-5 font-medium text-white transition hover:bg-amber-600"
          >
            Criar minha primeira caixinha
          </button>
        </div>
      )}

      {active.length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          {active.map((c) => (
            <CaixinhaCard key={c.id} caixinha={c} />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            Concluídas
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {completed.map((c) => (
              <CaixinhaCard key={c.id} caixinha={c} />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <CreateCaixinhaModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            mutate();
          }}
        />
      )}
    </div>
  );
}
