export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(isoOrSqlite: string): string {
  const normalized = isoOrSqlite.includes("T")
    ? isoOrSqlite
    : `${isoOrSqlite.replace(" ", "T")}Z`;
  return new Date(normalized).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
