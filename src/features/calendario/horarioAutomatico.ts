import { toast } from "react-toastify";
import type { Clase, Comision } from "../../api/types";
import { elegir } from "../../components/elegir";
import { borrarClase, crearClase, getClases, getComisiones } from "./api";
import { NOMBRE_CUATRIMESTRE, comisionesParaAutomatico, resumenHorarios } from "./comisiones";

// Cuando una materia pasa a "Cursando" se agregan sus clases al horario
// semanal; si deja de estar en curso se sacan las que se cargaron solas.

const CURSANDO = "Cursando";
const NOMBRE_NIVEL = ["", "1er año", "2do año", "3er año", "4to año", "5to año"];

interface MateriaBasica {
  id: number;
  nombre: string;
  nivel?: number;
}

const opcionDe = (c: Comision) => ({
  valor: String(c.id),
  etiqueta: `${c.codigo} · ${NOMBRE_CUATRIMESTRE[c.cuatrimestre] ?? c.cuatrimestre}`,
  detalle: resumenHorarios(c),
});

const cargarComision = async (materia: MateriaBasica, comision: Comision) => {
  for (const h of comision.horarios) {
    await crearClase({
      titulo: materia.nombre,
      dia: h.dia,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      aula: h.aula || comision.codigo,
      materia_id: materia.id,
      comision_id: comision.id,
    });
  }
};

const yaEstaEnHorario = (clases: Clase[], materiaId: number) => clases.some((c) => c.materia?.id === materiaId);

// Pregunta en que comision cursa la materia. Devuelve undefined si no elige.
const preguntarComision = async (materia: MateriaBasica, comisiones: Comision[], cancelar: string) => {
  const valor = await elegir({
    titulo: `¿En qué comisión cursás ${materia.nombre}?`,
    mensaje: "La agregamos a tu horario semanal con sus aulas.",
    opciones: comisiones.map(opcionDe),
    cancelar,
  });
  return comisiones.find((c) => String(c.id) === valor);
};

// Agrega una materia al horario. Con una sola comision la carga directo; con
// varias pregunta en cual esta el alumno. Devuelve true si cargo algo.
export const agregarAlHorario = async (materia: MateriaBasica, clases?: Clase[]) => {
  const actuales = clases ?? (await getClases());
  if (yaEstaEnHorario(actuales, materia.id)) return false;

  const comisiones = comisionesParaAutomatico(await getComisiones(materia.id));
  if (comisiones.length === 0) return false;

  const comision =
    comisiones.length === 1 ? comisiones[0] : await preguntarComision(materia, comisiones, "No agregar al horario");
  if (!comision) return false;

  await cargarComision(materia, comision);
  toast.success(`Agregamos ${materia.nombre} (${comision.codigo}) a tu horario`);
  return true;
};

// Saca del horario las clases de la materia que se cargaron desde una comision.
// Las que el alumno cargo a mano no se tocan.
export const sacarDelHorario = async (materia: MateriaBasica) => {
  const clases = (await getClases()).filter((c) => c.materia?.id === materia.id && c.comision_id);
  for (const c of clases) await borrarClase(c.id);
  if (clases.length > 0) toast.info(`Sacamos ${materia.nombre} de tu horario`);
};

// alCambiarEstado se llama despues de guardar el estado de una materia.
// Los errores del horario no frenan el cambio de estado: solo se avisan.
export const alCambiarEstado = async (materia: MateriaBasica, anterior: string, nuevo: string) => {
  try {
    if (nuevo === CURSANDO && anterior !== CURSANDO) await agregarAlHorario(materia);
    else if (anterior === CURSANDO && nuevo !== CURSANDO) await sacarDelHorario(materia);
  } catch {
    toast.error("No se pudo actualizar tu horario, revisalo en Horarios");
  }
};

const POR_MATERIA = "por-materia";

// Para "Marcar todas como cursando": las del mismo año suelen ser del mismo
// curso (K1.1, K1.2...), asi que se ofrece elegir uno solo para todas o ir
// materia por materia. Las que tienen una sola comision se cargan directo y
// las que no tienen el curso elegido se preguntan aparte.
export const agregarVariasAlHorario = async (materias: MateriaBasica[]) => {
  try {
    const clases = await getClases();
    const pendientes = materias.filter((m) => !yaEstaEnHorario(clases, m.id));
    const conComisiones = await Promise.all(
      pendientes.map(async (m) => ({ materia: m, comisiones: comisionesParaAutomatico(await getComisiones(m.id)) }))
    );
    const conVarias = conComisiones.filter((x) => x.comisiones.length > 1);

    const nivel = materias[0]?.nivel;
    const todos = [...new Set(conVarias.flatMap((x) => x.comisiones.map((c) => c.codigo)))].sort();
    // Los cursos de un año empiezan con K<año>. (K1.1, K1.2...); otras materias
    // del año pueden tener comisiones de otro año, que no se ofrecen
    const delNivel = todos.filter((c) => c.startsWith(`K${nivel}.`));
    const codigos = delNivel.length > 0 ? delNivel : todos;

    let codigo: string | null = null;
    if (conVarias.length > 1 && codigos.length > 0) {
      codigo = await elegir({
        titulo: `¿En qué curso de ${NOMBRE_NIVEL[nivel ?? 0] || "este año"} estás?`,
        mensaje: "Elegí tu curso y cargamos todas las materias con esa comisión, o elegí una por materia.",
        opciones: [
          ...codigos.map((c) => ({ valor: c, etiqueta: c })),
          {
            valor: POR_MATERIA,
            etiqueta: "Elegir una por materia",
            detalle: "Te preguntamos la comisión de cada materia",
          },
        ],
        cancelar: "No agregar al horario",
      });
      if (!codigo) return;
    }

    let agregadas = 0;
    for (const { materia, comisiones } of conComisiones) {
      let comision = comisiones.length === 1 ? comisiones[0] : comisiones.find((c) => c.codigo === codigo);
      if (!comision && comisiones.length > 1) {
        comision = await preguntarComision(materia, comisiones, "Saltear esta materia");
      }
      if (!comision) continue;
      await cargarComision(materia, comision);
      agregadas++;
    }
    if (agregadas > 0) {
      toast.success(agregadas === 1 ? "Agregamos 1 materia a tu horario" : `Agregamos ${agregadas} materias a tu horario`);
    }
  } catch {
    toast.error("No se pudo actualizar tu horario, revisalo en Horarios");
  }
};

export const sacarVariasDelHorario = async (materias: MateriaBasica[]) => {
  try {
    const ids = new Set(materias.map((m) => m.id));
    const clases = (await getClases()).filter((c) => c.materia && ids.has(c.materia.id) && c.comision_id);
    for (const c of clases) await borrarClase(c.id);
    if (clases.length > 0) toast.info("Actualizamos tu horario");
  } catch {
    toast.error("No se pudo actualizar tu horario, revisalo en Horarios");
  }
};
