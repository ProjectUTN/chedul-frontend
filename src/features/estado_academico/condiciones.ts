import type { Condicion, Materia } from "../../api/types";

// "No me interesa" es solo para electivas: la materia deja de aparecer en
// "Podés cursar" y en el resto del progreso
export const NO_ME_INTERESA = "No me interesa";

export const esElectiva = (materia: Pick<Materia, "tipo">) => materia.tipo === "Electiva";

// condicionesPara deja las condiciones que se pueden elegir en esa materia
export const condicionesPara = (materia: Pick<Materia, "tipo">, condiciones: Condicion[]) =>
  esElectiva(materia) ? condiciones : condiciones.filter((c) => c.condicion !== NO_ME_INTERESA);

// En la UTN se aprueba con 6 o más
export const NOTAS_APROBADA = [6, 7, 8, 9, 10];
