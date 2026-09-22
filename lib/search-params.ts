/** Manipulação do estado de tela que vive na URL (filtros, ordenação, página). */
export function buildQuery(
  current: URLSearchParams | Record<string, string | undefined>,
  changes: Record<string, string | number | null | undefined>,
): string {
  const params = new URLSearchParams(
    current instanceof URLSearchParams ? current : (current as Record<string, string>),
  );

  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  }

  // Qualquer mudança de filtro ou ordenação volta para a primeira página.
  if (!("page" in changes)) params.delete("page");

  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Lê um valor de searchParams aceitando apenas as opções conhecidas. */
export function oneOf<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

export function firstString(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.trim() !== "" ? raw : undefined;
}
