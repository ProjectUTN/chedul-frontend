// Lee el estado academico de SysAcad (la pagina /Alumnos/estado/) y lo pasa a
// estados de Chedul. Acepta el HTML guardado o el texto copiado de la tabla
// (Ctrl+A, Ctrl+C). Todo pasa en el navegador: nunca se piden datos de
// ingreso a SysAcad.

export type EstadoImportado = "Aprobada" | "Regularizada" | "Cursando" | "Libre";

export interface FilaSysacad {
  anio: number;
  materia: string;
  estado: string;
}

export interface FilaInterpretada extends FilaSysacad {
  // null si el estado no se entiende o no corresponde (curso de ingreso)
  condicion: EstadoImportado | null;
  nota: number | null;
  // Codigo de la comision en la que cursa (ej. K5.1), si SysAcad lo dice
  comision: string | null;
}

export interface MateriaParaMatch {
  id: number;
  nombre: string;
}

// Sin tildes, en minusculas, sin "(Elec.)", sin puntuacion y sin el "I" final
// de "Física I", que en el plan a veces figura solo como "Física".
export const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(elec\.?\)/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ i$/, "");

const bigramas = (texto: string) => {
  const lista: string[] = [];
  for (let i = 0; i < texto.length - 1; i++) lista.push(texto.slice(i, i + 2));
  return lista;
};

// Parecido entre dos textos de 0 a 1 (coeficiente de Dice con pares de letras)
export const parecido = (a: string, b: string) => {
  const x = bigramas(a);
  const y = bigramas(b);
  if (x.length === 0 || y.length === 0) return a === b ? 1 : 0;
  const restantes = [...y];
  let comunes = 0;
  for (const par of x) {
    const i = restantes.indexOf(par);
    if (i >= 0) {
      comunes++;
      restantes.splice(i, 1);
    }
  }
  return (2 * comunes) / (x.length + y.length);
};

// SysAcad corta los nombres en 40 letras ("Complejidad y Técnicas de Diseño de Algo")
const LARGO_CORTADO = 40;

// buscarMateria devuelve el id de la materia del plan que corresponde al nombre
// de SysAcad, o null si ninguna se parece lo suficiente.
export const buscarMateria = (nombre: string, materias: MateriaParaMatch[]) => {
  const buscado = normalizar(nombre);
  if (!buscado) return null;
  const candidatas = materias.map((m) => ({ id: m.id, nombre: normalizar(m.nombre) }));

  const exacta = candidatas.find((m) => m.nombre === buscado);
  if (exacta) return exacta.id;

  if (nombre.replace(/\s*\(Elec\.?\)\s*$/i, "").trim().length >= LARGO_CORTADO - 1) {
    const empiezan = candidatas.filter((m) => m.nombre.startsWith(buscado));
    if (empiezan.length === 1) return empiezan[0].id;
  }

  let mejor: { id: number; puntaje: number } | null = null;
  for (const m of candidatas) {
    const puntaje = parecido(buscado, m.nombre);
    if (!mejor || puntaje > mejor.puntaje) mejor = { id: m.id, puntaje };
  }
  return mejor && mejor.puntaje >= 0.82 ? mejor.id : null;
};

// interpretarEstado pasa el texto de la columna Estado a un estado de Chedul.
//   "Aprobada con 7 (5 hs.) Tomo: 139 Folio: 384" -> Aprobada, nota 7
//   "Aprobada con Aprob. ... por resolución 743/2024" / "Aprobada en 2019" -> Aprobada sin nota
//   "Regular en 2024 (2C)" -> Regularizada
//   "Cursa en K5.1 EDIFICIO CENTRAL" -> Cursando en K5.1
//   "Libre en K5.1 ..." -> Libre (en Chedul queda pendiente)
export const interpretarEstado = (estado: string) => {
  const texto = estado.trim();
  const comision = texto.match(/\b([A-Z]\d+\.\d+)\b/)?.[1] ?? null;
  if (/^aprobad/i.test(texto)) {
    const nota = texto.match(/^aprobada con (\d{1,2})\b/i)?.[1];
    const valor = nota ? Number(nota) : null;
    return {
      condicion: "Aprobada" as const,
      nota: valor !== null && valor >= 6 && valor <= 10 ? valor : null,
      comision: null,
    };
  }
  if (/^regular/i.test(texto)) return { condicion: "Regularizada" as const, nota: null, comision: null };
  if (/^cursa/i.test(texto)) return { condicion: "Cursando" as const, nota: null, comision };
  if (/^libre/i.test(texto)) return { condicion: "Libre" as const, nota: null, comision: null };
  return { condicion: null, nota: null, comision: null };
};

const limpiar = (texto: string) => texto.replace(/\s+/g, " ").trim();

// Filas de la tabla del HTML guardado de SysAcad
const filasDelHTML = (html: string): FilaSysacad[] => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const filas: FilaSysacad[] = [];
  for (const tr of doc.querySelectorAll("table tbody tr")) {
    const celdas = [...tr.querySelectorAll("td")].map((td) => limpiar(td.textContent ?? ""));
    if (celdas.length < 3 || !/^\d+$/.test(celdas[0])) continue;
    filas.push({ anio: Number(celdas[0]), materia: celdas[1], estado: celdas[2] });
  }
  return filas;
};

// Filas del texto copiado: el navegador separa las celdas con tabulaciones
const filasDelTexto = (texto: string): FilaSysacad[] => {
  const filas: FilaSysacad[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    const celdas = linea.split("\t").map(limpiar);
    if (celdas.length < 3 || !/^\d+$/.test(celdas[0])) continue;
    filas.push({ anio: Number(celdas[0]), materia: celdas[1], estado: celdas[2] });
  }
  return filas;
};

// leerSysacad acepta el HTML de la pagina o el texto copiado de la tabla.
export const leerSysacad = (contenido: string): FilaInterpretada[] => {
  const filas = /<table[\s>]/i.test(contenido) ? filasDelHTML(contenido) : filasDelTexto(contenido);
  return filas.map((f) => ({
    ...f,
    // Año 0 es el curso de ingreso: no es parte del plan
    ...(f.anio === 0 ? { condicion: null, nota: null, comision: null } : interpretarEstado(f.estado)),
  }));
};
