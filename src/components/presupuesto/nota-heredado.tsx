/** Avisa que los montos del mes se copiaron de otro mes y todavía no se guardaron en este. */
export function NotaHeredado({ desde }: { desde?: string }) {
  return (
    <p
      role="status"
      data-testid="nota-heredado"
      className="text-xs text-muted-foreground"
    >
      Montos copiados de {desde}; se guardan al editarlos.
    </p>
  );
}
