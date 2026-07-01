"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-8">
      <p className="text-center text-5xl">🐷</p>
      <h1 className="mt-4 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Entrar no Cofrinho
      </h1>

      <form action={action} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </label>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-xl bg-amber-500 font-medium text-white transition hover:bg-amber-600 disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Não tem uma conta?{" "}
        <Link href="/signup" className="font-medium text-amber-600 hover:underline dark:text-amber-400">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
