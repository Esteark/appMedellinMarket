import { Spinner } from "@/components/cargando";

/** Relleno de `Suspense` en las páginas de auth. No es un formulario: si lo fuera, lo que se escribe antes de que cargue se pierde y hay dos campos iguales por un instante. */
export function CargandoAuth({
  titulo,
  texto = "Cargando…",
}: {
  titulo: string;
  texto?: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Spinner />
        {texto}
      </p>
    </main>
  );
}
