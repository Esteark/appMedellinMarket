"use client";

/** Una página que falla (p. ej. la base no responde) no tumba el encabezado ni las pestañas. */
export default function ErrorPagina({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-3 px-4 py-10">
      <h1 className="text-xl font-bold">No se pudieron cargar los precios</h1>
      <p className="text-muted-foreground">
        La base de datos no respondió. Intenta de nuevo en un momento.
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-11 rounded-[10px] bg-primary px-4 font-semibold text-primary-foreground"
      >
        Reintentar
      </button>
    </main>
  );
}
