"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/actions/auth";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-8">
      <p className="text-center text-5xl">🐷</p>
      <h1 className="mt-4 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Criar conta no Cofrinho
      </h1>

      <form action={action} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none focus:border-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </label>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-xl bg-teal-500 font-medium text-white transition hover:bg-teal-600 disabled:opacity-60"
        >
          {pending ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-medium text-teal-600 hover:underline dark:text-teal-400">
          Entrar
        </Link>
      </p>
    </div>
  );
}
