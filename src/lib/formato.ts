const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** 4980 → "$ 4.980". */
export const pesos = (n: number) => COP.format(Math.round(n));
