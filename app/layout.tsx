import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { logout } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cofrinho",
  description: "Rastreie seus desafios de poupança diária",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {user && (
          <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <span className="truncate text-sm text-zinc-600 dark:text-zinc-400">
              {user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm font-medium text-amber-600 hover:underline dark:text-amber-400"
              >
                Sair
              </button>
            </form>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
