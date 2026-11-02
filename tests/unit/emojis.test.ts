import { describe, expect, it } from "vitest";
import {
  buscarEmojis,
  CATEGORIAS_EMOJI,
  limpiarEmoji,
  TODOS_EMOJI,
} from "@/data/emojis";

describe("emojis del selector", () => {
  it("sin texto devuelve todos y sin repetir", () => {
    expect(buscarEmojis("")).toHaveLength(TODOS_EMOJI.length);
    const unicos = new Set(TODOS_EMOJI.map((i) => i.e));
    expect(unicos.size).toBe(TODOS_EMOJI.length);
  });

  it("busca en español sin importar tildes ni mayúsculas", () => {
    expect(buscarEmojis("PIÑA").map((i) => i.e)).toContain("🍍");
    expect(buscarEmojis("pimentón").map((i) => i.e)).toContain("🫑");
    expect(buscarEmojis("zzzz")).toEqual([]);
  });

  it("cada categoría tiene emojis y nombre", () => {
    for (const c of CATEGORIAS_EMOJI) {
      expect(c.nombre.length).toBeGreaterThan(0);
      expect(c.items.length).toBeGreaterThan(0);
    }
  });

  it("limpiarEmoji recorta a 8 caracteres y quita espacios", () => {
    expect(limpiarEmoji("  🍎  ")).toBe("🍎");
    expect([...limpiarEmoji("123456789")]).toHaveLength(8);
    expect(limpiarEmoji("   ")).toBe("");
  });
});
