type Pagina<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

/** PostgREST corta en 1000 filas: pide de a 1000 hasta que no venga una página llena. */
export async function todas<T>(
  pedir: (desde: number, hasta: number) => Pagina<T>,
  que: string,
): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await pedir(desde, desde + 999);
    if (error) throw new Error(`${que}: ${error.message}`);
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) return filas;
  }
}
