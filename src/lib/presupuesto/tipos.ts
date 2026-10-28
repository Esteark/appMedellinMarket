export type Rubro =
  | "Carnes"
  | "Granos"
  | "Verduras"
  | "Frutas"
  | "Lácteos"
  | "Panadería"
  | "Despensa"
  | "Aseo"
  | "Bebidas"
  | "Mecato"
  | "Otros";

export type OrigenGasto =
  | "manual"
  | "desde_lista"
  | "plan_hogar"
  | "plan_dieta";

export type PresupuestoRubro = {
  rubro: Rubro | string;
  monto: number;
  orden: number;
};

export type GastoReal = {
  id: string;
  user_id: string;
  fecha: string;
  mes: string;
  rubro: Rubro | string;
  monto: number;
  tienda_id: string | null;
  producto_id: string | null;
  origen: OrigenGasto;
  nota: string | null;
  created_at: string;
};

export type ResumenMes = {
  mes: string;
  presupuestado: number;
  gastado: number;
  restante: number;
  porcentajeUsado: number;
  proyeccionFinMes: number;
  diasTranscurridos: number;
  diasDelMes: number;
};

export type EstadoDesfase = "al_dia" | "desfasado" | "ahorrando";

export type FilaDesfase = {
  rubro: Rubro | string;
  presupuestado: number;
  gastado: number;
  esperadoHastaHoy: number;
  proyeccion: number;
  porcentajeUsado: number;
  desfasePct: number;
  estado: EstadoDesfase;
};

export type TipoAprendizaje =
  | "logro"
  | "situacion"
  | "aprendizaje"
  | "oportunidad";

export type Aprendizaje = {
  tipo: TipoAprendizaje;
  titulo: string;
  descripcion: string;
};
