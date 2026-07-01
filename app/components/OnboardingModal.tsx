"use client";

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-900">
        <p className="text-4xl">🐷</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Bem-vindo(a) ao Cofrinho!
        </h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Aqui você cria desafios de poupança: escolha um número de dias e,
          todo dia, sorteamos um número aleatório — esse é o valor em reais
          que você deposita na sua conta (ou onde preferir guardar o
          dinheiro).
        </p>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Vamos te ajudar a criar sua primeira caixinha agora!
        </p>

        <button
          onClick={onClose}
          className="mt-6 h-12 w-full rounded-xl bg-teal-500 font-medium text-white transition hover:bg-teal-600"
        >
          Vamos começar!
        </button>
      </div>
    </div>
  );
}
