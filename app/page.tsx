"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import CaixinhaCard from "./components/CaixinhaCard";
import CreateCaixinhaModal from "./components/CreateCaixinhaModal";
import OnboardingModal from "./components/OnboardingModal";
import OnboardingTooltip from "./components/OnboardingTooltip";
import { fetcher } from "@/lib/fetcher";
import { createClient } from "@/lib/supabase/client";
import type { CaixinhaWithStats } from "@/lib/queries";

export type OnboardingStep =
  | "none"
  | "intro"
  | "cta"
  | "name"
  | "days"
  | "preview"
  | "success";

export default function Home() {
  const { data, isLoading, mutate } = useSWR<CaixinhaWithStats[]>(
    "/api/caixinhas",
    fetcher
  );
  const [showModal, setShowModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("none");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.user_metadata?.has_onboarded) {
        setOnboardingStep("intro");
      }
    });
  }, []);

  async function handleCloseIntro() {
    setOnboardingStep("cta");
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { has_onboarded: true } });
  }

  function handleOpenModal() {
    setShowModal(true);
    if (onboardingStep === "cta") {
      setOnboardingStep("name");
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/caixinhas/${id}`, { method: "DELETE" });
    mutate();
  }

  const active = data?.filter((c) => c.status === "active") ?? [];
  const completed = data?.filter((c) => c.status === "completed") ?? [];
  const isOnboardingCreation =
    onboardingStep === "name" ||
    onboardingStep === "days" ||
    onboardingStep === "preview" ||
    onboardingStep === "success";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Minhas caixinhas
        </h1>
        <button
          onClick={handleOpenModal}
          className="h-12 rounded-xl bg-teal-500 px-5 font-medium text-white transition hover:bg-teal-600"
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
          <OnboardingTooltip
            show={onboardingStep === "cta"}
            text="Clique aqui para começar!"
          >
            <button
              onClick={handleOpenModal}
              className="h-12 rounded-xl bg-teal-500 px-5 font-medium text-white transition hover:bg-teal-600"
            >
              Criar minha primeira caixinha
            </button>
          </OnboardingTooltip>
        </div>
      )}

      {active.length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          {active.map((c) => (
            <CaixinhaCard key={c.id} caixinha={c} onDelete={handleDelete} />
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
              <CaixinhaCard key={c.id} caixinha={c} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {onboardingStep === "intro" && <OnboardingModal onClose={handleCloseIntro} />}

      {showModal && (
        <CreateCaixinhaModal
          onClose={() => {
            setShowModal(false);
            if (isOnboardingCreation) setOnboardingStep("none");
          }}
          onCreated={() => {
            setShowModal(false);
            mutate();
          }}
          onboarding={
            isOnboardingCreation
              ? { step: onboardingStep, onAdvance: setOnboardingStep }
              : undefined
          }
        />
      )}
    </div>
  );
}
