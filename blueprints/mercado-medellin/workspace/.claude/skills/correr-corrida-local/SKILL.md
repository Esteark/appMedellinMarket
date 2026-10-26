---
name: correr-corrida-local
description: Ejecuta la corrida de precios contra Supabase local y revisa su resultado. Úsala para probar la corrida de punta a punta, depurar por qué una tienda quedó en fallo o reproducir en local una corrida de GitHub Actions.
---

# Correr la corrida en local

## Cuándo usarla
- "corre la corrida", "¿por qué Euro quedó en fallo?", "reproduce la corrida de hoy".

## Pasos
1. `pnpm exec supabase status` debe salir 0 (si no: `pnpm exec supabase start` y `pnpm env:local`).
2. `pnpm corrida` (solo grupos del día) o `pnpm corrida --todo` (también semanales). Requiere red.
3. Revisa la fila nueva de `corridas` (fuentes, conteos, notas) y `tienda_estado` en Supabase Studio (http://127.0.0.1:54323).
4. Sin variables SMTP, el correo al admin se registra en consola y la corrida no falla.

## Verificar
```bash
pnpm corrida --ayuda                            # expect: exit 0, imprime el uso
pnpm test tests/integracion/corrida.test.ts     # expect: exit 0 — corrida con fetch falso e idempotencia
```

## No
- No bajes la pausa entre peticiones por debajo de 1000 ms ni quites la comprobación de robots.txt.
- No corras la corrida contra producción desde tu máquina; producción la corre el workflow.
