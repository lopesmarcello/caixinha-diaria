"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import OnboardingTooltip from "./OnboardingTooltip";
import { formatBRL } from "@/lib/format";
import type { Caixinha } from "@/lib/queries";
import type { OnboardingStep } from "@/app/page";

export default function CreateCaixinhaModal({
  onClose,
  onCreated,
  onboarding,
}: {
  onClose: () => void;
  onCreated: (caixinha: Caixinha) => void;
  onboarding?: {
    step: OnboardingStep;
    onAdvance: (step: OnboardingStep) => void;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [totalDaysInput, setTotalDaysInput] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // NaN enquanto o campo está vazio — só vira número na validação/envio.
  const totalDays = totalDaysInput === "" ? NaN : Number(totalDaysInput);
  const isValidDays = Number.isInteger(totalDays) && totalDays > 0;
  const previewTotal = isValidDays ? (totalDays * (totalDays + 1)) / 2 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length === 0) {
      setError("Informe um nome para a caixinha.");
      return;
    }
    if (!isValidDays || totalDays < 1 || totalDays > 365) {
      setError("O número de dias deve ser um inteiro entre 1 e 365.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/caixinhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), total_days: totalDays }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Não foi possível criar a caixinha.");
      }
      const caixinha = (await res.json()) as Caixinha;

      if (onboarding) {
        onboarding.onAdvance("success");
        setShowSuccess(true);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => {
          router.push(`/caixinha/${caixinha.id}`);
        }, 1200);
      } else {
        onCreated(caixinha);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={showSuccess ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {showSuccess ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-5xl">✅</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Caixinha criada!
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Te levando para a sua caixinha...
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Nova caixinha
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <OnboardingTooltip
                show={onboarding?.step === "name"}
                text="Selecione um nome para sua caixinha!"
              >
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome</span>
                  <input
                    type="text"
                    value={name}
                    maxLength={60}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Viagem 2026"
                    className="h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                </label>
              </OnboardingTooltip>

              <OnboardingTooltip
                show={onboarding?.step === "days"}
                text="Selecione o número de dias!"
              >
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Número de dias
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={365}
                    value={totalDaysInput}
                    onFocus={() => {
                      if (onboarding?.step === "name") onboarding.onAdvance("days");
                    }}
                    onChange={(e) => {
                      // Só dígitos, sem zeros à esquerda: evita "0" grudado ao esvaziar o campo.
                      const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
                      setTotalDaysInput(digits === "0" ? "" : digits);
                      if (onboarding?.step === "days") onboarding.onAdvance("preview");
                    }}
                    className="h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                </label>
              </OnboardingTooltip>

              <OnboardingTooltip
                show={onboarding?.step === "preview"}
                text="Esse é o resultado esperado!"
              >
                <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  Você vai guardar até <strong>{formatBRL(previewTotal)}</strong> em{" "}
                  {isValidDays ? totalDays : 0} dias.
                </p>
              </OnboardingTooltip>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-12 flex-1 rounded-xl border border-zinc-300 font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-12 flex-1 rounded-xl bg-teal-500 font-medium text-white transition hover:bg-teal-600 disabled:opacity-60"
                >
                  {submitting ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
