export function mesDeFecha(fecha: string): string {
  return fecha.slice(0, 7);
}

export function diasDelMes(mes: string): number {
  const [anio, mesNum] = mes.split("-").map(Number);
  return new Date(anio, mesNum, 0).getDate();
}

export function diasTranscurridos(hoy: string, mes: string): number {
  const [anio, mesNum] = mes.split("-").map(Number);
  const [hAnio, hMes, hDia] = hoy.split("-").map(Number);
  if (hAnio !== anio || hMes !== mesNum) return diasDelMes(mes);
  return Math.max(0, hDia);
}

export function esMismoMes(fecha: string, mes: string): boolean {
  return mesDeFecha(fecha) === mes;
}
